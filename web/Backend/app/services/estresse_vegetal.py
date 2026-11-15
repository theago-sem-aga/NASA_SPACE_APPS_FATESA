"""Estresse vegetal do ponto, a partir da série de NDVI do MODIS guardada por célula.

Só cópia local pré-processada (data/processed/modis_ndvi/<celula>.parquet):
a série longa no ORNL levou de 8 a 20 min por ponto (20 min com 4 pedidos em paralelo; 8 a 14 min com 8;
ver integrations/modis_ornl.py), então não
cabe na requisição do usuário — mesma regra das outras fontes de satélite
(docs/convencao_programacao.md, seção 7). Sem arquivo para a célula, levanta
LookupError e a análise segue sem o bloco, listando a fonte como indisponível.
Para gerar/atualizar: python app/pipelines/ingestao_modis_ndvi.py <lat> <lon>

A regra está em app/domain/estresse_vegetal.py.
"""

from __future__ import annotations

import math

from app.configuracao import RAIZ
from app.domain.estresse_vegetal import calcular_estresse_vegetal
from app.pipelines.indice_espacial import celula_id

PASTA_LOCAL = RAIZ / "data" / "processed" / "modis_ndvi"


def _distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def estresse_vegetal(latitude: float, longitude: float) -> dict:
    """Estresse vegetal do ponto, com a origem e a posição do pixel usado."""
    caminho = PASTA_LOCAL / f"{celula_id(latitude, longitude)}.parquet"
    if not caminho.is_file():
        raise LookupError("sem série de NDVI pré-processada para esta célula")
    import pandas as pd

    df = pd.read_parquet(caminho)
    df = df.astype(object).where(df.notna(), None)
    linhas = df.to_dict("records")
    resultado = calcular_estresse_vegetal(linhas)
    lat_pixel = linhas[0].get("latitude", latitude)
    lon_pixel = linhas[0].get("longitude", longitude)
    resultado.update(
        {
            "latitude_pixel": lat_pixel,
            "longitude_pixel": lon_pixel,
            "distancia_pixel_km": round(_distancia_km(latitude, longitude, lat_pixel, lon_pixel), 1),
            "fonte": "modis_ornl",
            "produto": "MOD13Q1",
            "tipo_acesso": "pre_processado",
        }
    )
    return resultado


if __name__ == "__main__":
    import json
    import sys

    lat, lon = (float(x) for x in sys.argv[1:3]) if len(sys.argv) >= 3 else (-20.82, -49.38)
    r = estresse_vegetal(lat, lon)
    print(json.dumps({k: v for k, v in r.items() if k != "ultimas_fotos"}, ensure_ascii=False))
