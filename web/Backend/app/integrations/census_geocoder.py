"""Cliente de integração com o Census Bureau Geocoder (EUA), ao vivo.

API oficial do governo americano, sem chave. Geocodificação reversa
(coordenada -> condado/estado) -- mesmo papel que app/services/locais.py
cumpre pro Brasil via IBGE, só que aqui ainda não existe uma base local:
é sempre uma chamada ao vivo.
"""

from __future__ import annotations

from app.integrations.http import requisitar

GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"


def buscar_condado_ponto(latitude: float, longitude: float, timeout_s: int = 15) -> dict | None:
    """{"condado": "Lubbock", "estado": "TX"}. None fora dos EUA (a API
    responde sem a camada "Counties"/"States" nesses casos)."""
    resposta = requisitar(
        "GET",
        GEOCODER_URL,
        params={
            "x": longitude,
            "y": latitude,
            "benchmark": "Public_AR_Current",
            "vintage": "Current_Current",
            "layers": "Counties,States",
            "format": "json",
        },
        timeout=timeout_s,
    )
    resposta.raise_for_status()
    geografias = resposta.json().get("result", {}).get("geographies", {})
    condados = geografias.get("Counties") or []
    estados = geografias.get("States") or []
    if not condados or not estados:
        return None
    return {"condado": condados[0]["BASENAME"], "estado": estados[0]["STUSAB"]}
