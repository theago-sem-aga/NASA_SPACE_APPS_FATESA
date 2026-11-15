"""Busca a textura real do solo pra um ponto, tentando mais de uma fonte.

Ordem: USDA Soil Data Access (ao vivo, so cobre os EUA/SSURGO) -> SoilGrids
(pre-processado, so nos pontos ja ingeridos). Cada fonte decide por si se tem
cobertura ali; None so quando NENHUMA respondeu -- nunca inventa valor nem
mistura textura de fontes diferentes.
"""

from __future__ import annotations

from app.integrations.usda_soil_data_access import buscar_solo_ponto
from app.repositories.espacial import buscar_celula

# Camada superficial (0-5cm): mesma profundidade que a USDA usa (hzdept_r = 0).
SOILGRIDS_PROFUNDIDADE = "0-5cm"


def camada_soilgrids(latitude: float, longitude: float) -> dict | None:
    """{"areia": x, "argila": y, "silte": z, ...} da camada 0-5cm, ou None sem cobertura."""
    bruto = buscar_celula("soilgrids", latitude, longitude)
    if bruto is None:
        return None
    return {
        r["variavel"]: r["valor"]
        for r in bruto["serie"]
        if r.get("profundidade") == SOILGRIDS_PROFUNDIDADE
    }


def _via_usda(latitude: float, longitude: float) -> dict | None:
    resultado = buscar_solo_ponto(latitude, longitude)
    if not resultado.get("disponivel"):
        return None
    componentes = resultado.get("componentes", [])
    if len(componentes) != 1:
        return None  # unidade de mapeamento com mais de um tipo de solo: ambiguo.
    c = componentes[0]
    if c["areia_pct"] is None or c["argila_pct"] is None:
        return None
    return {"areia_pct": c["areia_pct"], "argila_pct": c["argila_pct"], "fonte": "USDA Soil Data Access"}


def _via_soilgrids(latitude: float, longitude: float) -> dict | None:
    camada = camada_soilgrids(latitude, longitude)
    if not camada or "areia" not in camada or "argila" not in camada:
        return None
    return {"areia_pct": camada["areia"], "argila_pct": camada["argila"], "fonte": "SoilGrids"}


def buscar_textura_ponto(latitude: float, longitude: float) -> dict | None:
    """{"areia_pct", "argila_pct", "fonte"} da primeira fonte com dado inequivoco, ou None."""
    return _via_usda(latitude, longitude) or _via_soilgrids(latitude, longitude)
