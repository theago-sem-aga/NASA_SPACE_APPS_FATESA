"""Painel "Sua colheita": como vai a producao de um municipio, em linguagem simples.

Monta a resposta da rota proposta GET /api/v1/producao?codigo_ibge=... (ver
docs/contrato_api.md). Toda regra fica aqui, no backend -- o front so exibe:
  - situacao de cada cultura: rendimento do ultimo ano vs media dos 5 anteriores
    (acima/abaixo se passar de 5%);
  - clima do ultimo ano vs media 1995-2024 (NASA POWER, celula do municipio);
  - cenarios seco/normal/chuvoso: so usa efeitos do modelo produtividade x clima
    marcados como confiaveis (IC 90% sem cruzar zero). Sem efeito confiavel ->
    variacao None ("ainda nao sabemos"). Ver produtividade_clima.py.

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

RAIZ = Path(__file__).resolve().parents[4]
PROCESSADOS = RAIZ / "data" / "processed"
SAIDA_FRONT = RAIZ / "web" / "Frontend" / "src" / "api" / "mock" / "producaoMunicipio.ts"

# Celula 0,1 grau do centro de cada municipio com dados (ver pipelines/regioes.py).
MUNICIPIOS = {
    "3549805": {"municipio": "São José do Rio Preto", "uf": "SP", "celula_power": "-209_-494"},
}

# cultura_id do front (src/components/Pictograma.tsx) -> (nome na PAM, nome no modelo)
CULTURAS = {
    "cana_de_acucar": ("Cana-de-açúcar", "cana", "Cana"),
    "soja": ("Soja (em grão)", "soja", "Soja"),
    "milho": ("Milho (em grão)", "milho", "Milho"),
    "mandioca": ("Mandioca", "mandioca", "Mandioca"),
}
LIMIAR_SITUACAO_PCT = 5
ANOS_MEDIA = 5

# Cenarios em anomalia do clima da safra (mesmas variaveis do modelo).
CENARIOS = {
    "seco": {"nome": "Ano seco", "chuva_anom_100mm": -2, "tmax_anom_c": 1, "meses_secos_anom": 1},
    "normal": {"nome": "Ano normal", "chuva_anom_100mm": 0, "tmax_anom_c": 0, "meses_secos_anom": 0},
    "chuvoso": {"nome": "Ano chuvoso", "chuva_anom_100mm": 2, "tmax_anom_c": -0.5, "meses_secos_anom": -1},
}


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


def _sacos_em_100(coef: pd.DataFrame, cultura_modelo: str, cenario: dict) -> int | None:
    c = coef[(coef["cultura"] == cultura_modelo) & coef["efeito_confiavel"]]
    usados = [(r.efeito_pct, cenario[r.variavel]) for r in c.itertuples() if cenario[r.variavel] != 0]
    if not usados:
        return None
    return int(round(sum(e * x for e, x in usados)))


def _clima(anual: pd.DataFrame, ano: int) -> dict:
    chuva, chuva_normal = float(anual.at[ano, "chuva"]), float(anual["chuva"].mean())
    tmax, tmax_normal = float(anual.at[ano, "tmax"]), float(anual["tmax"].mean())
    proporcao = chuva / chuva_normal
    graus = tmax - tmax_normal
    return {
        "ano": ano,
        "chuva_mm": round(chuva),
        "chuva_normal_mm": round(chuva_normal),
        # 15% abaixo/acima da media = pouca/muita chuva.
        "situacao_chuva": "pouca" if proporcao <= 0.85 else "muita" if proporcao >= 1.15 else "normal",
        # Para o desenho de gotas: de cada 10 de um ano normal, quantas cairam.
        "gotas_em_10": int(round(proporcao * 10)),
        "tmax_c": round(tmax, 1),
        "tmax_normal_c": round(tmax_normal, 1),
        "situacao_calor": "mais_quente" if graus >= 1 else "mais_frio" if graus <= -1 else "normal",
        "graus_de_diferenca": int(round(graus)),
        "periodo_normal": f"{int(anual.index.min())}-{ano}",
    }


def montar_painel(codigo_ibge: str) -> dict:
    if codigo_ibge not in MUNICIPIOS:
        raise LookupError(f"sem dados pre-processados para o municipio {codigo_ibge}")
    m = MUNICIPIOS[codigo_ibge]
    pam = pd.read_parquet(PROCESSADOS / "ibge_pam" / f"municipio_{codigo_ibge}.parquet")
    pam = pam.pivot_table(index=["produto", "ano"], columns="variavel", values="valor").reset_index()
    coef = pd.read_parquet(PROCESSADOS / "modelo_produtividade" / "coeficientes.parquet")

    culturas = []
    for cultura_id, (nome_pam, _, nome) in CULTURAS.items():
        serie = pam[pam["produto"] == nome_pam]
        if serie.empty:
            continue
        culturas.append({"cultura_id": cultura_id, "nome": nome, **_situacao(serie)})

    clima = pd.read_parquet(PROCESSADOS / "nasa_power" / f"{m['celula_power']}.parquet")
    clima["ano"] = clima["data"].str[:4].astype(int)
    anual = clima.groupby("ano").agg(chuva=("precipitacao_acumulada_mm", "sum"),
                                     tmax=("temperatura_maxima_c", "mean"))
    ultimo_ano = int(anual.index.max())

    cenarios = []
    for cenario_id, c in CENARIOS.items():
        cenarios.append({
            "cenario_id": cenario_id,
            "nome": c["nome"],
            "culturas": [{"cultura_id": cid, "sacos_em_100": 0 if cenario_id == "normal" else _sacos_em_100(coef, mod, c)}
                         for cid, (_, mod, _) in CULTURAS.items() if any(x["cultura_id"] == cid for x in culturas)],
        })

    return {
        "codigo_ibge": codigo_ibge,
        "municipio": m["municipio"],
        "uf": m["uf"],
        "culturas": culturas,
        "clima": _clima(anual, ultimo_ano),
        "cenarios": cenarios,
        "fontes": ["IBGE – Produção Agrícola Municipal (tabela 5457)", "NASA POWER (MERRA-2)",
                   "Modelo produtividade x clima, 645 municípios de SP, 2000–2024"],
        "limitacoes": [
            "Números da cidade toda, não da sua roça.",
            "O modelo só sabe dizer o efeito do clima quando ele é claro nos anos passados. Quando não é, a resposta é: ainda não sabemos.",
        ],
        "tipo_dado": "observacao_historica",
        "gerado_em": dt.date.today().isoformat(),
    }


def gravar_copia_front(codigo_ibge: str) -> Path:
    painel = montar_painel(codigo_ibge)
    corpo = json.dumps({codigo_ibge: painel}, ensure_ascii=False, indent=2)
    SAIDA_FRONT.write_text(
        "// GERADO por web/Backend/app/modelos/painel_producao.py -- nao editar a mao.\n"
        "// Copia local da rota proposta GET /api/v1/producao enquanto o backend nao a tem.\n"
        "// Numeros REAIS (IBGE + NASA POWER + modelo), congelados na data de `gerado_em`.\n"
        "import type { PainelProducao } from '../tipos';\n\n"
        f"export const PAINEIS_PRODUCAO: Record<string, PainelProducao> = {corpo};\n",
        encoding="utf-8",
    )
    return SAIDA_FRONT


if __name__ == "__main__":
    print(gravar_copia_front(sys.argv[1] if len(sys.argv) > 1 else "3549805"))
