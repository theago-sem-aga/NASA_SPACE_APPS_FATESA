"""Ingestao do IBGE (API SIDRA, sem chave) para o municipio piloto.

- PAM (Producao Agricola Municipal), tabela 5457: area plantada, colhida,
  producao, rendimento e valor por cultura, ultimos N anos.
- Censo Agropecuario 2017, tabelas 6957 (lavoura temporaria) e 6955
  (lavoura permanente): separa agricultura familiar e nao familiar
  (classificacao 829 "Tipologia", Lei 11.326).

Saidas:
  data/processed/ibge_pam/municipio_<geocodigo>.parquet
  data/processed/ibge_censo_agro/municipio_<geocodigo>.parquet

Uso: REGIAO_PILOTO=sjrp python ingestao_ibge.py [anos_pam=10]
"""

from __future__ import annotations

import datetime as dt
import sys

import pandas as pd
import requests

from regioes import caminho_parquet_municipal, regiao_atual

SIDRA = "https://apisidra.ibge.gov.br/values"

# Simbolos do SIDRA que significam ausencia, nao zero:
# "-" zero absoluto nao resultante de arredondamento e tratado como 0;
# "X" sigilo, ".." / "..." nao se aplica / nao disponivel -> None.
_ZERO = {"-"}
_AUSENTE = {"X", "..", "...", ""}

PAM_VARIAVEIS = {
    "8331": "area_plantada_ha",
    "216": "area_colhida_ha",
    "214": "quantidade_produzida",
    "112": "rendimento_medio",
    "215": "valor_producao_mil_reais",
}

CENSO_TIPOLOGIA = "46302,46303,46304"  # total, AF nao, AF sim
CENSO_TABELAS = {
    "temporaria": ("6957", "226", {"10084": "estabelecimentos", "10089": "area_colhida_ha",
                                   "10087": "valor_producao_mil_reais", "10088": "valor_venda_mil_reais"}),
    "permanente": ("6955", "227", {"10078": "area_colhida_ha", "10079": "area_existente_ha",
                                   "10076": "valor_producao_mil_reais", "10077": "valor_venda_mil_reais"}),
}


def _valor(v: str) -> float | None:
    if v in _ZERO:
        return 0.0
    if v in _AUSENTE:
        return None
    return float(v)


def _sidra(caminho: str) -> list[dict]:
    r = requests.get(SIDRA + caminho, timeout=180)
    r.raise_for_status()
    return r.json()[1:]  # primeira linha = cabecalho descritivo


def ingerir_pam(geocodigo: str, anos: int) -> pd.DataFrame:
    linhas = _sidra(f"/t/5457/n6/{geocodigo}/v/{','.join(PAM_VARIAVEIS)}/p/last%20{anos}/c782/allxt")
    df = pd.DataFrame([{
        "ano": int(r["D3N"]),
        "produto": r["D4N"],
        "variavel": PAM_VARIAVEIS[r["D2C"]],
        "valor": _valor(r["V"]),
        "unidade": r["MN"],
    } for r in linhas])
    # Remove culturas que nunca aparecem no municipio (todas as linhas zero/ausentes).
    com_dado = df.groupby("produto")["valor"].apply(lambda s: (s.fillna(0) != 0).any())
    return df[df["produto"].isin(com_dado[com_dado].index)].reset_index(drop=True)


def ingerir_censo(geocodigo: str) -> pd.DataFrame:
    partes = []
    for tipo_lavoura, (tabela, classif_produto, variaveis) in CENSO_TABELAS.items():
        linhas = _sidra(
            f"/t/{tabela}/n6/{geocodigo}/v/{','.join(variaveis)}/p/all"
            f"/c829/{CENSO_TIPOLOGIA}/c{classif_produto}/all/c218/46502/c12517/113601"
        )
        for r in linhas:
            valor = _valor(r["V"])
            if valor in (None, 0.0):
                continue
            partes.append({
                "ano_referencia": int(r["D3N"]),
                "tipo_lavoura": tipo_lavoura,
                "tipologia": r["D4N"],
                "agricultura_familiar": {"46302": None, "46303": False, "46304": True}[r["D4C"]],
                "produto": r["D5N"],
                "variavel": variaveis[r["D2C"]],
                "valor": valor,
                "unidade": r["MN"],
                "tabela_sidra": tabela,
            })
    return pd.DataFrame(partes)


def ingerir(anos_pam: int = 10) -> None:
    regiao = regiao_atual()
    geocodigo = regiao["geocodigo_ibge"]
    if not geocodigo:
        raise SystemExit(f"IBGE so existe para municipios brasileiros; regiao atual: {regiao['chave']}")
    coleta = dt.datetime.now(dt.timezone.utc).isoformat()

    for fonte, df in (("ibge_pam", ingerir_pam(geocodigo, anos_pam)), ("ibge_censo_agro", ingerir_censo(geocodigo))):
        df["geocodigo_ibge"] = geocodigo
        df["fonte"] = fonte
        df["data_coleta_utc"] = coleta
        caminho = caminho_parquet_municipal(fonte, geocodigo)
        caminho.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(caminho, index=False)
        print(f"fonte={fonte} municipio={geocodigo} linhas={len(df)} -> {caminho}")


if __name__ == "__main__":
    ingerir(int(sys.argv[1]) if len(sys.argv) > 1 else 10)
