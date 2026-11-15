"""Busca a PAM (Produção Agrícola Municipal, IBGE/SIDRA) de um município --
local pré-processada se existir (município piloto), senão ao vivo
(qualquer município do Brasil). Mesma consulta SIDRA que
pipelines/ingestao_ibge.py já usa, só reaproveitada aqui pra não exigir
rodar o script antes de funcionar em qualquer lugar.
"""

from __future__ import annotations

import pandas as pd

from app.configuracao import RAIZ
from app.integrations.http import requisitar

PASTA_LOCAL = RAIZ / "data" / "processed" / "ibge_pam"
SIDRA = "https://apisidra.ibge.gov.br/values"

PAM_VARIAVEIS = {
    "8331": "area_plantada_ha",
    "216": "area_colhida_ha",
    "214": "quantidade_produzida",
    "112": "rendimento_medio",
    "215": "valor_producao_mil_reais",
}
_ZERO = {"-"}
_AUSENTE = {"X", "..", "...", ""}


def _valor(v: str) -> float | None:
    if v in _ZERO:
        return 0.0
    if v in _AUSENTE:
        return None
    return float(v)


def _ao_vivo(geocodigo: str, anos: int) -> pd.DataFrame:
    resposta = requisitar(
        "GET",
        f"{SIDRA}/t/5457/n6/{geocodigo}/v/{','.join(PAM_VARIAVEIS)}/p/last%20{anos}/c782/allxt",
        timeout=180,
    )
    resposta.raise_for_status()
    linhas = resposta.json()[1:]  # primeira linha = cabeçalho descritivo
    df = pd.DataFrame(
        [
            {
                "ano": int(r["D3N"]),
                "produto": r["D4N"],
                "variavel": PAM_VARIAVEIS[r["D2C"]],
                "valor": _valor(r["V"]),
                "unidade": r["MN"],
            }
            for r in linhas
        ]
    )
    if df.empty:
        return df
    com_dado = df.groupby("produto")["valor"].apply(lambda s: (s.fillna(0) != 0).any())
    return df[df["produto"].isin(com_dado[com_dado].index)].reset_index(drop=True)


def buscar_pam_municipio(geocodigo: str, anos: int = 10) -> pd.DataFrame:
    caminho = PASTA_LOCAL / f"municipio_{geocodigo}.parquet"
    if caminho.is_file():
        return pd.read_parquet(caminho)
    return _ao_vivo(geocodigo, anos)
