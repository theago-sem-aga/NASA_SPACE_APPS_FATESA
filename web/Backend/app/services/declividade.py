"""Busca elevação em 5 pontos (centro + norte/sul/leste/oeste, ~100 m de raio)
via USGS 3DEP e calcula a declividade/relevo de verdade -- em vez da célula
de 0,1 grau (~11 km) do SRTM indexado, grande demais pra representar o
talhão específico do produtor (ver docs/requisitos-faltantes.md).

Só cobre os EUA (+ territórios, cobertura do 3DEP). Fora dela: None, nunca
inventa relevo a partir da célula grossa.
"""

from __future__ import annotations

import math
from concurrent.futures import ThreadPoolExecutor

from app.domain.declividade import classificar_relevo, declividade_de_elevacoes
from app.integrations.usgs_elevacao import buscar_elevacao_ponto

OFFSET_GRAUS = 0.0009  # ~100 m em latitude (1 grau de latitude ~111,32 km)
METROS_POR_GRAU_LATITUDE = 111_320


def declividade_do_ponto(latitude: float, longitude: float) -> dict | None:
    cos_lat = math.cos(math.radians(latitude))
    offset_lon = OFFSET_GRAUS / max(cos_lat, 0.01)  # mesma distância em metros, leste-oeste
    pontos = {
        "centro": (latitude, longitude),
        "norte": (latitude + OFFSET_GRAUS, longitude),
        "sul": (latitude - OFFSET_GRAUS, longitude),
        "leste": (latitude, longitude + offset_lon),
        "oeste": (latitude, longitude - offset_lon),
    }
    with ThreadPoolExecutor(max_workers=5) as executor:
        valores = list(executor.map(lambda p: buscar_elevacao_ponto(*p), pontos.values()))
    elevacoes = dict(zip(pontos.keys(), valores, strict=True))
    if any(v is None for v in elevacoes.values()):
        return None  # fora da cobertura do 3DEP (fora dos EUA, ou ponto no mar)

    distancia_m = OFFSET_GRAUS * METROS_POR_GRAU_LATITUDE
    declividade_pct = declividade_de_elevacoes(elevacoes, distancia_m)
    return {
        "declividade_pct": declividade_pct,
        "relevo": classificar_relevo(declividade_pct),
        "elevacao_m": round(elevacoes["centro"], 1),
        "fonte": "USGS 3DEP (Elevation Point Query Service)",
        "tipo_acesso": "ao_vivo",
    }
