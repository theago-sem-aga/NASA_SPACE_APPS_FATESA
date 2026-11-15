"""Elevação local do SRTMGL1 v003 (NASA), preparada em Parquet por célula.

Rasters preparados fora da requisição por app.pipelines.preparar_relevo_srtm.
Leitura de uma célula e interpolação bilinear dos quatro pixels vizinhos; -32768
é ausência, nunca altitude zero. Não usa médias de células de 0,1 grau.
"""

import json
import math
from functools import lru_cache

import pyarrow.parquet as pq

from app.configuracao import RAIZ
from app.pipelines.indice_espacial import celula_id

PASTA_SRTM = RAIZ / "data" / "processed" / "srtm_relevo"
AMOSTRAS = 3601
VALOR_AUSENTE = -32768


def nome_tile(latitude: float, longitude: float) -> str:
    if not (math.isfinite(latitude) and -90 <= latitude <= 90
            and math.isfinite(longitude) and -180 <= longitude <= 180):
        raise ValueError("Coordenada inválida")
    sul, oeste = math.floor(latitude), math.floor(longitude)
    return f"{'N' if sul >= 0 else 'S'}{abs(sul):02d}{'E' if oeste >= 0 else 'W'}{abs(oeste):03d}"


@lru_cache(maxsize=16)
def _ler_celula(caminho: str, modificado_ns: int, tamanho: int):
    tabela = pq.read_table(caminho, columns=["elevacao_m"])
    metadados = json.loads((tabela.schema.metadata or {})[b"fatesa_srtm"])
    if metadados["produto"] != "SRTMGL1.003":
        raise ValueError("Produto de elevação inesperado")
    grade = tabela["elevacao_m"].to_numpy().reshape(metadados["linhas"], metadados["colunas"])
    return metadados, grade


def buscar_elevacao_local(latitude: float, longitude: float) -> float | None:
    tile = nome_tile(latitude, longitude)
    caminho = PASTA_SRTM / f"{celula_id(latitude, longitude)}.parquet"
    if not caminho.is_file():
        return None
    stat = caminho.stat()
    metadados, grade = _ler_celula(str(caminho), stat.st_mtime_ns, stat.st_size)
    if metadados["tile"] != tile:
        return None
    sul, oeste = math.floor(latitude), math.floor(longitude)
    linha = (sul + 1 - latitude) * (AMOSTRAS - 1) - metadados["linha_inicial"]
    coluna = (longitude - oeste) * (AMOSTRAS - 1) - metadados["coluna_inicial"]
    tolerancia = 1e-7  # somente erro de ponto flutuante na borda da grade
    if not (-tolerancia <= linha <= grade.shape[0] - 1 + tolerancia
            and -tolerancia <= coluna <= grade.shape[1] - 1 + tolerancia):
        return None
    linha = min(max(linha, 0.0), grade.shape[0] - 1)
    coluna = min(max(coluna, 0.0), grade.shape[1] - 1)
    i, j = math.floor(linha), math.floor(coluna)
    i1, j1 = min(i + 1, grade.shape[0] - 1), min(j + 1, grade.shape[1] - 1)
    valores = [int(grade[i, j]), int(grade[i, j1]), int(grade[i1, j]), int(grade[i1, j1])]
    if VALOR_AUSENTE in valores:
        return None
    dy, dx = linha - i, coluna - j
    return float(
        valores[0] * (1 - dy) * (1 - dx) + valores[1] * (1 - dy) * dx
        + valores[2] * dy * (1 - dx) + valores[3] * dy * dx
    )
