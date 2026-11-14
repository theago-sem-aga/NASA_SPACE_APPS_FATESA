"""Regioes dos pipelines de ingestao.

Dois jeitos de escolher a caixa de recorte, nessa ordem de prioridade:

1. **Por coordenada, generico** (``REGIAO_LAT``/``REGIAO_LON``, raio opcional
   em ``REGIAO_RAIO_GRAUS``): funciona em qualquer lugar do planeta, sem
   depender de municipio, condado, pais ou qualquer unidade administrativa.
   Exemplo: ``REGIAO_LAT=16.6 REGIAO_LON=-49.3 python ingestao_gpm.py <arquivo.nc4>``
   (um ponto em Goiania, GO -- nao precisa estar cadastrado em lugar nenhum).

2. **Por nome cadastrado** (``REGIAO_PILOTO``, padrao ``fresno``): mantido
   para as regioes que ja tem contexto extra alem da caixa de coordenadas
   (geocodigo IBGE, codigo SICOR etc.), usado pelas fontes tabulares
   brasileiras (IBGE, SICOR, ZARC, MapBiomas) que sao por municipio, nao
   por coordenada -- essas nao tem equivalente generico ainda.

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


RAIO_PADRAO_GRAUS = 0.2  # ~22 km nesta latitude -- cobre uns 20 celulas de 0,1 grau.


def caixa_ao_redor_do_ponto(
    latitude: float, longitude: float, raio_graus: float = RAIO_PADRAO_GRAUS
) -> tuple[float, float, float, float]:
    """(lat_min, lat_max, lon_min, lon_max) centrada num ponto qualquer.

    Generico de verdade: nao consulta IBGE, Census, nem nenhuma outra
    fonte externa, e nao depende de pais. Funciona pros EUA, Brasil ou
    qualquer outro lugar -- a unica entrada e a coordenada em si.
    """
    if not (-90 <= latitude <= 90):
        raise ValueError(f"latitude fora do intervalo valido: {latitude}")
    if not (-180 <= longitude <= 180):
        raise ValueError(f"longitude fora do intervalo valido: {longitude}")
    return (
        latitude - raio_graus,
        latitude + raio_graus,
        longitude - raio_graus,
        longitude + raio_graus,
    )


def regiao_atual() -> dict:
    lat, lon = os.environ.get("REGIAO_LAT"), os.environ.get("REGIAO_LON")
    if lat is not None and lon is not None:
        raio = float(os.environ.get("REGIAO_RAIO_GRAUS", RAIO_PADRAO_GRAUS))
        lat_min, lat_max, lon_min, lon_max = caixa_ao_redor_do_ponto(float(lat), float(lon), raio)
        return {
            "chave": f"ponto_{lat}_{lon}",
            "nome": f"Ponto ({lat}, {lon}), raio {raio}°",
            "lat_min": lat_min, "lat_max": lat_max,
            "lon_min": lon_min, "lon_max": lon_max,
            "geocodigo_ibge": None,
        }

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
