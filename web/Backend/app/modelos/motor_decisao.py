"""Motor de decisão: escolhe os caminhos da reforma conforme o que o produtor quer.

Regras (explicáveis, sem caixa-preta -- convenção seção 3):
  1. A prática atual (pousio) entra SEMPRE, como base de comparação.
  2. Fica de fora quem exige algo que o produtor disse NÃO ter (máquina para grão,
     comprador, irrigação). "Não sei" não exclui.
  3. Fica de fora quem o ZARC não indica para plantio sequeiro de outubro a dezembro
     no município (quando temos o ZARC processado da cidade). Adubo verde não é
     zoneado pelo ZARC e não passa por esse filtro.
  4. Pontos = soma, para cada prioridade escolhida, do nível do atributo ligado a
     ela (nenhum 0, baixo 1, médio 2, alto 3), +1 se o catálogo marca a estratégia
     como indicada para aquela prioridade (prioridades_atendidas, curadoria). O +1
     desempata o que o atributo sozinho não separa: várias opções "gastam pouca
     água", mas só milheto e sorgo são indicados para aguentar seca. "Aguentar a
     seca" usa o gasto de água ao contrário. Sem prioridade escolhida, usa segurar
     o solo + terra forte.
  5. Entram as (quantos - 1) com mais pontos. Empate: menos trabalho e gasto,
     depois mais confiança, depois a ordem do catálogo.
  6. Para explicar: cada sugerida diz quais prioridades contaram (nível >= médio),
     e quem tinha pontos para entrar mas foi excluído aparece em "fora", com o motivo.

Catálogo: data/processed/estrategias/catalogo_reforma_cana.json (níveis a conferir
com técnico). Gera a tabela de todas as combinações para o front:
  python motor_decisao.py  ->  web/Frontend/src/api/mock/estrategiasMotor.ts
"""

from __future__ import annotations

import itertools
import json
from functools import lru_cache
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[4]
PROCESSADOS = RAIZ / "data" / "processed"
CATALOGO = PROCESSADOS / "estrategias" / "catalogo_reforma_cana.json"
# Textos em inglês do mesmo catálogo (mesmos estrategia_id); níveis e regras vêm do português.
CATALOGO_EN = PROCESSADOS / "estrategias" / "catalogo_reforma_cana.en.json"
CAMPOS_TEXTO = (
    "nome", "resumo", "objetivo", "motivos", "evidencias", "beneficios", "riscos", "lacunas",
    "explicacao_confianca", "pergunta_especialista", "referencias",
)
SAIDA_FRONT = RAIZ / "web" / "Frontend" / "src" / "api" / "mock" / "estrategiasMotor.ts"

NIVEL = {"nenhum": 0, "baixo": 1, "medio": 2, "alto": 3}
CONFIANCA = {"alta": 2, "media": 1, "baixa": 0}
# prioridade -> (atributo, invertido)
ATRIBUTO_DA_PRIORIDADE = {
    "reducao_erosao": ("protecao_solo", False),
    "materia_organica": ("materia_organica", False),
    "fixacao_nitrogenio": ("fixacao_nitrogenio", False),
    "adequacao_mercado": ("renda_direta", False),
    "valor_forragem": ("valor_forragem", False),
    "uso_agua": ("demanda_agua", True),
}
PRIORIDADES = list(ATRIBUTO_DA_PRIORIDADE)
PRIORIDADES_PADRAO = ("reducao_erosao", "materia_organica")
REQUISITOS = ("maquinas_graos", "comprador_graos", "irrigacao")
MOTIVO_SEM = {"maquinas_graos": "sem_maquina", "comprador_graos": "sem_comprador", "irrigacao": "sem_irrigacao"}
JANELA_REFORMA = range(28, 37)  # decêndios de outubro a dezembro
NIVEL_QUE_CONTA = 2


@lru_cache(maxsize=1)
def carregar_catalogo() -> tuple[dict, ...]:
    return tuple(json.loads(CATALOGO.read_text(encoding="utf-8"))["estrategias"])


@lru_cache(maxsize=2)
def catalogo_no_idioma(idioma: str = "pt") -> tuple[dict, ...]:
    """Catálogo com os textos no idioma pedido. Em inglês, troca só os campos de texto
    (e o nome de cada etapa da rotação) pelos do catalogo_reforma_cana.en.json."""
    base = carregar_catalogo()
    if idioma != "en":
        return base
    en = json.loads(CATALOGO_EN.read_text(encoding="utf-8"))["estrategias"]
    saida = []
    for e in base:
        traducao = en[e["estrategia_id"]]
        novo = {**e, **{k: traducao[k] for k in CAMPOS_TEXTO}}
        novo["etapas_rotacao"] = [{**etapa, "nome": nome} for etapa, nome in zip(e["etapas_rotacao"], traducao["etapas"])]
        saida.append(novo)
    return tuple(saida)


@lru_cache(maxsize=64)
def zarc_na_reforma(codigo_ibge: str | None) -> dict[str, float] | None:
    """Menor risco (%) de plantio sequeiro out-dez por cultura do ZARC; None se não temos o ZARC da cidade."""
    if not codigo_ibge:
        return None
    caminho = PROCESSADOS / "zarc" / f"municipio_{codigo_ibge}.parquet"
    if not caminho.exists():
        return None
    z = pd.read_parquet(caminho)
    z = z[(z["manejo"] == "Sequeiro") & z["plantio_indicado"] & z["decendio"].isin(JANELA_REFORMA)]
    return z.groupby("cultura")["risco_perda_pct"].min().to_dict()


def nivel(estrategia: dict, prioridade: str) -> int:
    """0 a 3: quanto a estratégia atende a prioridade, pelo atributo ligado a ela."""
    atributo, invertido = ATRIBUTO_DA_PRIORIDADE[prioridade]
    v = NIVEL[estrategia["atributos"][atributo]]
    return 3 - v if invertido else v


def pontos(estrategia: dict, prioridade: str) -> int:
    return nivel(estrategia, prioridade) + (1 if prioridade in estrategia["prioridades_atendidas"] else 0)


def _motivo_exclusao(e: dict, recursos: dict[str, str], zarc: dict[str, float] | None) -> str | None:
    for req in e["requisitos"]:
        if recursos.get(req) == "nao":
            return MOTIVO_SEM[req]
    if zarc is not None and e["zarc_culturas"] and not any(c in zarc for c in e["zarc_culturas"]):
        return "fora_zarc"
    return None


def sugerir(prioridades: list[str], recursos: dict[str, str], codigo_ibge: str | None, quantos: int = 3) -> dict:
    catalogo = carregar_catalogo()
    zarc = zarc_na_reforma(codigo_ibge)
    usadas = tuple(p for p in prioridades if p in ATRIBUTO_DA_PRIORIDADE) or PRIORIDADES_PADRAO

    atual = next(e for e in catalogo if e["eh_pratica_atual"])
    candidatas = []
    for ordem, e in enumerate(catalogo):
        if e["eh_pratica_atual"]:
            continue
        total = sum(pontos(e, p) for p in usadas)
        chave = (-total, NIVEL[e["atributos"]["trabalho_custo"]], -CONFIANCA[e["confianca"]], ordem)
        candidatas.append((chave, total, e, _motivo_exclusao(e, recursos, zarc)))
    candidatas.sort(key=lambda c: c[0])

    escolhidas = [c for c in candidatas if c[3] is None][: quantos - 1]
    corte = min((c[1] for c in escolhidas), default=0)
    fora = [{"estrategia_id": c[2]["estrategia_id"], "motivo": c[3]}
            for c in candidatas if c[3] is not None and c[1] > 0 and c[1] >= corte]

    def risco(e: dict) -> float | None:
        if not zarc or not e["zarc_culturas"]:
            return None
        return min(zarc[c] for c in e["zarc_culturas"] if c in zarc)

    sugeridas = [{"estrategia_id": atual["estrategia_id"], "pontos": None, "prioridades_que_contam": [], "zarc_risco_pct": None}]
    sugeridas += [{
        "estrategia_id": e["estrategia_id"],
        "pontos": total,
        "prioridades_que_contam": [p for p in prioridades if p in ATRIBUTO_DA_PRIORIDADE and nivel(e, p) >= NIVEL_QUE_CONTA],
        "zarc_risco_pct": risco(e),
    } for _, total, e, _ in escolhidas]
    return {"sugeridas": sugeridas, "fora": fora, "zarc_conferido": zarc is not None}


# ---------- tabela de todas as combinações para o front (modo sem servidor) ----------

def chave_tabela(prioridades: list[str], recursos: dict[str, str], codigo_zarc: str | None) -> str:
    """Mesma regra do front (src/api/cliente.ts): 'n' só quando a resposta foi NÃO."""
    rec = "".join("n" if recursos.get(r) == "nao" else "s" for r in REQUISITOS)
    return f"{'+'.join(sorted(prioridades))}|{rec}|{codigo_zarc or '-'}"


def _calendario(trechos: list) -> list[dict]:
    meses = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    coberturas = [c for c, n in trechos for _ in range(n)]
    return [{"mes": m, "cobertura": c} for m, c in zip(meses, coberturas)]


def gerar_front() -> Path:
    codigos_zarc = sorted(p.stem.removeprefix("municipio_") for p in (PROCESSADOS / "zarc").glob("municipio_*.parquet"))
    combos = [()] + [(p,) for p in PRIORIDADES] + list(itertools.combinations(PRIORIDADES, 2))
    tabela = {}
    for prio in combos:
        for resp in itertools.product(("sim", "nao"), repeat=len(REQUISITOS)):
            recursos = dict(zip(REQUISITOS, resp))
            for cod in [None, *codigos_zarc]:
                r = sugerir(list(prio), recursos, cod)
                tabela[chave_tabela(list(prio), recursos, cod)] = {
                    "s": [[s["estrategia_id"], s["prioridades_que_contam"], s["zarc_risco_pct"]] for s in r["sugeridas"]],
                    "f": [[f["estrategia_id"], f["motivo"]] for f in r["fora"]],
                }
    def para_front(itens):
        return {e["estrategia_id"]: {**{k: v for k, v in e.items() if k != "zarc_culturas"}, "calendario": _calendario(e["calendario"])}
                for e in itens}

    catalogo = para_front(carregar_catalogo())
    catalogo_en = para_front(catalogo_no_idioma("en"))
    SAIDA_FRONT.write_text(
        "// GERADO por web/Backend/app/modelos/motor_decisao.py -- nao editar a mao.\n"
        "// Catálogo de caminhos + escolha do motor para TODAS as combinações de prioridades\n"
        "// e recursos (o front só consulta; as regras ficam no backend). Textos a conferir.\n"
        "import type { Estrategia, PrioridadeId } from '../tipos';\n\n"
        f"export const CATALOGO_ESTRATEGIAS: Record<string, Estrategia> = {json.dumps(catalogo, ensure_ascii=False)};\n\n"
        "/** Mesmo catálogo com os textos em inglês (data/processed/estrategias/catalogo_reforma_cana.en.json). */\n"
        f"export const CATALOGO_ESTRATEGIAS_EN: Record<string, Estrategia> = {json.dumps(catalogo_en, ensure_ascii=False)};\n\n"
        f"export const CODIGOS_COM_ZARC: string[] = {json.dumps(codigos_zarc)};\n\n"
        "/** chave = 'prioridades+ordenadas|sss|codigo ou -'; s = [id, prioridades que contaram, risco ZARC %]; f = [id, motivo de ficar de fora]. */\n"
        "export const SUGESTOES: Record<string, { s: [string, PrioridadeId[], number | null][]; f: [string, string][] }> = "
        f"{json.dumps(tabela, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"combinacoes={len(tabela)} estrategias={len(catalogo)} -> {SAIDA_FRONT}")
    return SAIDA_FRONT


# ---------- versao real, pro backend (porta de web/Frontend/src/api/mock/montarEstrategias.ts) ----------

NOME_PRIORIDADE = {
    "reducao_erosao": "segurar o solo",
    "materia_organica": "deixar a terra mais forte",
    "fixacao_nitrogenio": "gastar menos adubo",
    "uso_agua": "aguentar a seca",
    "adequacao_mercado": "ter renda na reforma",
    "valor_forragem": "tratar o gado",
}
POR_QUE_FICOU_DE_FORA = {
    "sem_maquina": "você disse que não tem máquina para grão",
    "sem_comprador": "você disse que não tem para quem vender grão",
    "sem_irrigacao": "você disse que não tem irrigação",
    "fora_zarc": "o zoneamento do Ministério da Agricultura (ZARC) não indica plantar de outubro a dezembro na sua cidade",
}
NOME_PRIORIDADE_EN = {
    "reducao_erosao": "hold the soil",
    "materia_organica": "make the soil stronger",
    "fixacao_nitrogenio": "spend less on fertilizer",
    "uso_agua": "handle drought",
    "adequacao_mercado": "earn income during the renewal",
    "valor_forragem": "feed livestock",
}
POR_QUE_FICOU_DE_FORA_EN = {
    "sem_maquina": "you said you do not have grain machinery",
    "sem_comprador": "you said you do not have a grain buyer",
    "sem_irrigacao": "you said you do not have irrigation",
    "fora_zarc": "Brazil's Ministry of Agriculture zoning (ZARC) does not recommend planting from October to December in your town",
}


def _em_frase(itens: list[str], idioma: str = "pt") -> str:
    if len(itens) <= 1:
        return itens[0] if itens else ""
    return f"{', '.join(itens[:-1])} {'and' if idioma == 'en' else 'e'} {itens[-1]}"


def _nome_curto(e: dict) -> str:
    etapas = e["etapas_rotacao"]
    return etapas[1]["nome"] if len(etapas) > 1 else e["nome"]


def _sem_zarc_culturas(e: dict) -> dict:
    return {k: v for k, v in e.items() if k != "zarc_culturas"}


def montar_estrategias_reais(
    prioridades: list[str], recursos: dict[str, str], codigo_ibge: str | None, municipio: str, idioma: str = "pt"
) -> tuple[list[dict], list[str]]:
    """Mesma regra de web/Frontend/src/api/mock/montarEstrategias.ts, rodando
    de verdade no backend: chama sugerir() direto (sem tabela pré-computada,
    que só existia pro front funcionar sem servidor). Retorna (estrategias,
    limitacoes) já no formato do schema Estrategia."""
    resultado = sugerir(prioridades, recursos, codigo_ibge)
    catalogo = {e["estrategia_id"]: e for e in catalogo_no_idioma(idioma)}
    en = idioma == "en"
    nomes_prioridade = NOME_PRIORIDADE_EN if en else NOME_PRIORIDADE
    por_que = POR_QUE_FICOU_DE_FORA_EN if en else POR_QUE_FICOU_DE_FORA
    algum_fora = len(resultado["fora"]) > 0

    estrategias = []
    for s in resultado["sugeridas"]:
        base = _sem_zarc_culturas(catalogo[s["estrategia_id"]])
        base["calendario"] = _calendario(base["calendario"])
        if base["eh_pratica_atual"]:
            estrategias.append(base)
            continue
        contam = s["prioridades_que_contam"]
        if contam:
            lista = _em_frase([nomes_prioridade[p] for p in contam], idioma)
            motivo = f"Matches what you chose: {lista}." if en else f"Combina com o que você escolheu: {lista}."
        elif algum_fora:
            motivo = (
                "The options that best matched your choices need something you do not have. This is the best of the rest."
                if en
                else "As opções que mais combinavam com o que você escolheu precisam de algo que você não tem. Esta é a melhor entre as que sobraram."
            )
        else:
            motivo = "A good option to protect the soil during the renewal." if en else "Boa opção para proteger a terra durante a reforma."
        zarc_evidencia = []
        if s["zarc_risco_pct"] is not None:
            zarc_evidencia.append(
                f"According to Brazil's Ministry of Agriculture zoning (ZARC), {_nome_curto(base).lower()} can be planted "
                f"from October to December in {municipio}, with a {s['zarc_risco_pct']}% risk of loss."
                if en
                else f"Pelo zoneamento do Ministério da Agricultura (ZARC), dá para plantar "
                f"{_nome_curto(base).lower()} de outubro a dezembro em {municipio}, "
                f"com risco de perda de {s['zarc_risco_pct']}%."
            )
        estrategias.append({
            **base,
            "motivos": [motivo, *base["motivos"]],
            "evidencias": [*zarc_evidencia, *base["evidencias"]],
        })

    limitacoes = [
        f"{_nome_curto(_sem_zarc_culturas(catalogo[f['estrategia_id']]))} "
        f"{'was left out because' if en else 'ficou de fora porque'} "
        f"{por_que.get(f['motivo'], f['motivo'])}."
        for f in resultado["fora"]
    ]
    if not resultado["zarc_conferido"]:
        limitacoes.append(
            "We have not checked the planting zoning (ZARC) for your town yet -- confirm the planting window with a local advisor."
            if en
            else "Ainda não conferimos o zoneamento (ZARC) da sua cidade -- confira a época de plantar com um técnico local."
        )
    return estrategias, limitacoes


if __name__ == "__main__":
    gerar_front()
