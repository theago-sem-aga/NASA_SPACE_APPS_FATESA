"""Cliente de integração com a API OpenET (evapotranspiração), ao vivo.

Requer chave gratuita (ver OPENET_API_KEY em web/.env). Mesma categoria
de acesso que NASA POWER/USDA Soil Data Access (chamada direta por
coordenada, nunca pre-indexada). Cobertura: só oeste dos EUA.
"""

from __future__ import annotations

import datetime as dt
import os

import requests

OPENET_URL = "https://openet-api.org/raster/timeseries/point"


def buscar_et_ponto(
    latitude: float,
    longitude: float,
    data_inicio: dt.date,
    data_fim: dt.date,
    timeout_s: int = 30,
) -> dict:
    """Busca evapotranspiracao (ET) mensal pra uma coordenada.

    Retorna ``disponivel=False`` quando a API nao tem dado pro ponto
    (fora da cobertura do oeste dos EUA) -- nunca inventa valor.
    """
    chave = os.environ.get("OPENET_API_KEY")
    if not chave:
        raise RuntimeError("OPENET_API_KEY nao configurada em web/.env")

    corpo = {
        "date_range": [data_inicio.isoformat(), data_fim.isoformat()],
        "interval": "monthly",
        "geometry": [longitude, latitude],
        "model": "Ensemble",
        "variable": "ET",
        "reference_et": "gridMET",
        "units": "mm",
        "file_format": "JSON",
    }
    resposta = requests.post(
        OPENET_URL, json=corpo, headers={"Authorization": chave}, timeout=timeout_s
    )
    if resposta.status_code != 200:
        return {
            "fonte": "openet",
            "tipo_acesso": "ao_vivo",
            "latitude": latitude,
            "longitude": longitude,
            "disponivel": False,
        }

    linhas = resposta.json()
    serie = [
        {"data": linha["time"], "evapotranspiracao_mm": linha["et"]}
        for linha in linhas
        if linha.get("et") is not None
    ]

    return {
        "fonte": "openet",
        "tipo_acesso": "ao_vivo",
        "latitude": latitude,
        "longitude": longitude,
        "disponivel": len(serie) > 0,
        "serie": serie,
    }


if __name__ == "__main__":
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[3] / ".env")

    print(buscar_et_ponto(36.6, -119.7, dt.date(2022, 6, 1), dt.date(2022, 6, 30)))
