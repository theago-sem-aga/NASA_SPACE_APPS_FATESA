"""Painel "Sua colheita": como vai a producao de um municipio, em linguagem simples.

Monta a resposta da rota proposta GET /api/v1/producao?codigo_ibge=... (ver
/openapi.json ou /docs). Toda regra fica aqui, no backend -- o front so exibe:
  - situacao de cada cultura: rendimento do ultimo ano vs media dos 5 anteriores
    (acima/abaixo se passar de 5%);
  - clima do mesmo ano da colheita vs media dos anos anteriores desde 1995 (NASA POWER, celula do municipio);
  - previsao dos proximos meses: prognostico OFICIAL INMET/INPE/FUNCEME,
    transcrito em data/processed/inmet/prognostico_<regiao>.json; vale para os
    municipios em `codigos_ibge` (a regiao do boletim). Fora deles -> None.
    E previsao, nao observacao (convencao secao 7).

Enquanto a rota nao existe, o CLI grava uma copia local para o front:
  python painel_producao.py [codigo_ibge=3549805]
  -> web/Frontend/src/api/mock/producaoMunicipio.ts
"""

from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

import pandas as pd

from app.modelos.clima_anual import comparar_ano
from app.services.ibge_pam import buscar_pam_municipio
from app.services.locais import buscar_por_codigo

RAIZ = Path(__file__).resolve().parents[4]
PROCESSADOS = RAIZ / "data" / "processed"
SAIDA_FRONT = RAIZ / "web" / "Frontend" / "src" / "api" / "mock" / "producaoMunicipio.ts"
SAIDA_PREVISAO = RAIZ / "web" / "Frontend" / "src" / "api" / "mock" / "previsaoRegiao.ts"

# Município piloto, com nome/UF fixos (cópia local do front, sem depender da
# base de municípios). Qualquer outro código IBGE busca nome/UF/coordenada
# em services/locais.py (base real do IBGE, qualquer município do Brasil).
MUNICIPIOS = {
    "3549805": {"municipio": "São José do Rio Preto", "uf": "SP", "latitude": -20.78, "longitude": -49.36},
}

# cultura_id do front (src/components/Pictograma.tsx) -> (nome na PAM, nome no modelo, nome curto)
CULTURAS = {
    "cana_de_acucar": ("Cana-de-açúcar", "cana", "Cana"),
    "soja": ("Soja (em grão)", "soja", "Soja"),
    "milho": ("Milho (em grão)", "milho", "Milho"),
    "mandioca": ("Mandioca", "mandioca", "Mandioca"),
}
LIMIAR_SITUACAO_PCT = 5
ANOS_MEDIA = 5



def _situacao(serie: pd.DataFrame) -> dict:
    serie = serie.sort_values("ano")
    ultimo = serie.iloc[-1]
    if not ultimo["area_plantada_ha"] or pd.isna(ultimo["rendimento_medio"]) or ultimo["rendimento_medio"] == 0:
        return {"situacao": "sem_plantio", "ano": int(ultimo["ano"]), "area_plantada_ha": None,
                "rendimento_kg_ha": None, "rendimento_medio_anterior_kg_ha": None}
    anteriores = serie.iloc[-1 - ANOS_MEDIA:-1]["rendimento_medio"].replace(0, pd.NA).dropna()
    media = float(anteriores.mean())
    dif = (ultimo["rendimento_medio"] / media - 1) * 100
    situacao = "acima" if dif > LIMIAR_SITUACAO_PCT else "abaixo" if dif < -LIMIAR_SITUACAO_PCT else "normal"
    return {"situacao": situacao, "ano": int(ultimo["ano"]), "area_plantada_ha": float(ultimo["area_plantada_ha"]),
            "rendimento_kg_ha": float(ultimo["rendimento_medio"]), "rendimento_medio_anterior_kg_ha": round(media)}


def _prognosticos() -> list[dict]:
    return [json.loads(c.read_text(encoding="utf-8")) for c in sorted((PROCESSADOS / "inmet").glob("prognostico_*.json"))]


def _formatar_previsao(p: dict) -> dict:
    """Os trechos originais do boletim ficam no arquivo; nao vao para a tela."""
    return {
        "abrangencia": p["abrangencia"],
        "periodo": p["periodo"],
        "chuva": p["chuva"],
        "temperatura": p["temperatura"],
        "meses": [{k: m[k] for k in ("mes", "nome", "chuva")} for m in p["meses"]],
        "dicas": [{k: d[k] for k in ("figura", "frase")} for d in p["dicas"]],
        "fonte": p["fonte"],
        "url_fonte": p["url_fonte"],
        "publicado_em": p["publicado_em"],
        "tipo_dado": "previsao",
    }


def previsao_do_municipio(codigo_ibge: str) -> dict | None:
    """Prognostico oficial que cobre o municipio (pela regiao do boletim), ou None."""
    for p in _prognosticos():
        if codigo_ibge in p["codigos_ibge"]:
            return _formatar_previsao(p)
    return None


def montar_painel(codigo_ibge: str) -> dict:
    if codigo_ibge in MUNICIPIOS:
        m = MUNICIPIOS[codigo_ibge]
    else:
        encontrado = buscar_por_codigo(codigo_ibge)
        if encontrado is None:
            raise LookupError(f"código IBGE desconhecido: {codigo_ibge}")
        m = encontrado

    pam = buscar_pam_municipio(codigo_ibge)
    if pam.empty:
        raise LookupError(f"IBGE sem PAM publicada para o município {codigo_ibge}")
    pam = pam.pivot_table(index=["produto", "ano"], columns="variavel", values="valor").reset_index()

    culturas = []
    for cultura_id, (nome_pam, _, nome) in CULTURAS.items():
        serie = pam[pam["produto"] == nome_pam]
        if serie.empty:
            continue
        culturas.append({"cultura_id": cultura_id, "nome": nome, **_situacao(serie)})

    # O tempo mostrado é o do MESMO ano da colheita mostrada, pra explicar aquela colheita.
    ano_colheita = max((c["ano"] for c in culturas), default=None)
    clima = comparar_ano(m["latitude"], m["longitude"], ano_colheita)

    limitacoes = [
        "Números da cidade toda, não da sua roça.",
        "A previsão vale para os próximos 3 meses. Ninguém consegue prever a chuva de um ano inteiro.",
    ]
    if clima is None:
        limitacoes.append("Clima sem dado: a série diária da NASA POWER não respondeu ou está incompleta.")

    return {
        "codigo_ibge": codigo_ibge,
        "municipio": m["municipio"],
        "uf": m["uf"],
        "culturas": culturas,
        "clima": clima,
        "previsao": previsao_do_municipio(codigo_ibge),
        "fontes": ["IBGE – Produção Agrícola Municipal (tabela 5457)", "NASA POWER (MERRA-2)",
                   "INMET, INPE e FUNCEME – prognóstico climático trimestral"],
        "limitacoes": limitacoes,
        "tipo_dado": "observacao_historica",
        "gerado_em": dt.date.today().isoformat(),
    }


def gravar_copia_front(codigo_ibge: str) -> Path:
    painel = montar_painel(codigo_ibge)
    corpo = json.dumps({codigo_ibge: painel}, ensure_ascii=False, indent=2)
    SAIDA_FRONT.write_text(
        "// GERADO por web/Backend/app/modelos/painel_producao.py -- nao editar a mao.\n"
        "// Copia local da rota proposta GET /api/v1/producao enquanto o backend nao a tem.\n"
        "// Numeros REAIS (IBGE + NASA POWER) e previsao oficial (INMET), congelados em `gerado_em`.\n"
        "import type { PainelProducao } from '../tipos';\n\n"
        f"export const PAINEIS_PRODUCAO: Record<string, PainelProducao> = {corpo};\n",
        encoding="utf-8",
    )
    # Previsao por regiao (vale para cidades sem painel de colheita, ex.: Mirassol).
    regioes = [{"codigos_ibge": p["codigos_ibge"], "previsao": _formatar_previsao(p)} for p in _prognosticos()]
    SAIDA_PREVISAO.write_text(
        "// GERADO por web/Backend/app/modelos/painel_producao.py -- nao editar a mao.\n"
        "// Copia local da rota proposta GET /api/v1/previsao. Previsao OFICIAL INMET/INPE/FUNCEME,\n"
        "// transcrita do boletim mensal; vale para os municipios da regiao do boletim.\n"
        "import type { PrevisaoClima } from '../tipos';\n\n"
        f"export const PREVISOES_POR_REGIAO: {{ codigos_ibge: string[]; previsao: PrevisaoClima }}[] = {json.dumps(regioes, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    return SAIDA_FRONT


if __name__ == "__main__":
    print(gravar_copia_front(sys.argv[1] if len(sys.argv) > 1 else "3549805"))
