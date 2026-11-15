"""Cliente de integração com o USGS 3DEP (Elevation Point Query Service), ao vivo.

API pública do governo americano (epqs.nationalmap.gov), sem login. Mesma
categoria de acesso que a NASA POWER (chamada direta por coordenada, nunca
pre-indexada) -- so que a cobertura e so os EUA (+ territorios), por ser uma
base do USGS, nao da NASA.
"""

from __future__ import annotations

import json

from app.integrations.http import requisitar

EPQS_URL = "https://epqs.nationalmap.gov/v1/json"


def buscar_elevacao_ponto(latitude: float, longitude: float, timeout_s: int = 15) -> float | None:
    """Elevação (m) de um ponto, via USGS 3DEP. None fora da cobertura (fora
    dos EUA, ou ponto no mar) -- a API responde HTTP 200 com texto simples
    ("Invalid or missing input parameters."), não JSON, nesses casos."""
    resposta = requisitar(
        "GET",
        EPQS_URL,
        params={"x": longitude, "y": latitude, "units": "Meters", "wkid": 4326, "includeDate": "false"},
        timeout=timeout_s,
    )
    resposta.raise_for_status()
    try:
        valor = resposta.json().get("value")
    except json.JSONDecodeError:
        return None
    if valor is None:
        return None
    try:
        return float(valor)
    except (TypeError, ValueError):
        return None
