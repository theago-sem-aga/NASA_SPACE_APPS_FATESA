"""Regioes piloto dos pipelines de ingestao.

Cada pipeline recorta os dados brutos para a caixa da regiao escolhida
pela variavel de ambiente ``REGIAO_PILOTO`` (padrao: ``fresno``, a
regiao original do prototipo, para nao mudar o comportamento de quem
ja roda os pipelines).

Exemplo: ``REGIAO_PILOTO=sjrp python ingestao_gpm.py <arquivo.nc4>``
"""

from __future__ import annotations

import math
import os
from pathlib import Path

from indice_espacial import RAIZ_DADOS_PROCESSADOS, TAMANHO_CELULA_GRAUS

REGIOES = {
    # Condado de Fresno, CA (EUA) -- ver docs/convencao_programacao.md.
    "fresno": {
        "nome": "Condado de Fresno, CA (EUA)",
        "lat_min": 36.4, "lat_max": 36.8,
        "lon_min": -119.9, "lon_max": -119.5,
        "geocodigo_ibge": None,
    },
    # Sao Jose do Rio Preto, SP. Caixa = limites da malha municipal do
    # IBGE (API de malhas v3, qualidade intermediaria).
    "sjrp": {
        "nome": "São José do Rio Preto, SP (Brasil)",
        "lat_min": -20.9328, "lat_max": -20.6353,
        "lon_min": -49.4633, "lon_max": -49.2556,
        "geocodigo_ibge": "3549805",
        # Codigo do municipio no SICOR/BCB (coluna Cod_Munic do ZARC, sem zero a esquerda).
        "codigo_sicor": "23764",
        "uf": "SP",
        "nome_municipio": "São José do Rio Preto",
    },
}


def regiao_atual() -> dict:
    chave = os.environ.get("REGIAO_PILOTO", "fresno")
    if chave not in REGIOES:
        raise ValueError(f"REGIAO_PILOTO desconhecida: {chave!r}. Opcoes: {sorted(REGIOES)}")
    return {"chave": chave, **REGIOES[chave]}


def caixa_da_regiao() -> tuple[float, float, float, float]:
    """(lat_min, lat_max, lon_min, lon_max) da regiao atual."""
    r = regiao_atual()
    return r["lat_min"], r["lat_max"], r["lon_min"], r["lon_max"]


def centros_das_celulas(regiao: dict | None = None) -> list[tuple[float, float]]:
    """Centro de cada celula de 0,1 grau que intersecta a caixa da regiao."""
    r = regiao or regiao_atual()
    passo = TAMANHO_CELULA_GRAUS
    lat_ini, lat_fim = math.floor(r["lat_min"] / passo), math.floor(r["lat_max"] / passo)
    lon_ini, lon_fim = math.floor(r["lon_min"] / passo), math.floor(r["lon_max"] / passo)
    return [
        (round((i + 0.5) * passo, 4), round((j + 0.5) * passo, 4))
        for i in range(lat_ini, lat_fim + 1)
        for j in range(lon_ini, lon_fim + 1)
    ]


def caminho_parquet_municipal(fonte: str, geocodigo_ibge: str) -> Path:
    """Fontes tabulares por municipio (IBGE, ZARC, SICOR, MapBiomas) nao
    usam a grade de celulas: um Parquet por municipio, chave = geocodigo IBGE."""
    return RAIZ_DADOS_PROCESSADOS / fonte / f"municipio_{geocodigo_ibge}.parquet"
