"""Abstrai cada fonte (ao vivo ou pre-indexada) num formato unico de
variaveis, pra permitir correlacionar dados de fontes diferentes sem
o chamador precisar conhecer o formato de cada uma.

Nao decide nada agronomico aqui -- isso e papel do motor de decisao
(futuro), que vai consumir esta lista de variaveis.
"""

from __future__ import annotations

import datetime as dt

import nasa_power
import usda_soil_data_access
from indice_espacial_postgis import buscar_por_coordenada_pg

_FONTES_INDEXADAS = ("gpm", "smap", "srtm", "ecostress", "landsat")

_CAMPOS_IGNORADOS = {
    "data", "data_levantamento", "n_pixels_agregados",
    "nome_unidade_mapeamento", "nome_componente", "percentual_componente",
    "profundidade_topo_cm", "profundidade_base_cm",
}


def _variaveis_de_serie(serie: list[dict], fonte: str, tipo_acesso: str) -> list[dict]:
    variaveis = []
    for registro in serie:
        data_campo = registro.get("data") or registro.get("data_levantamento")
        for chave, valor in registro.items():
            if chave in _CAMPOS_IGNORADOS:
                continue
            variaveis.append({
                "nome": chave,
                "fonte": fonte,
                "tipo_acesso": tipo_acesso,
                "data": data_campo,
                "valor": valor,
            })
    return variaveis


def coletar_variaveis(latitude: float, longitude: float) -> dict:
    """Busca todas as fontes pra uma coordenada e devolve a lista unica
    de variaveis abstraidas, pronta pra correlacionar entre si."""

    variaveis: list[dict] = []
    fontes_indisponiveis: list[dict] = []

    # --- NASA POWER (ao vivo) ---
    hoje = dt.date.today()
    resultado_power = nasa_power.buscar_power_ponto(
        latitude, longitude, hoje - dt.timedelta(days=7), hoje - dt.timedelta(days=1)
    )
    variaveis += _variaveis_de_serie(resultado_power["serie"], "nasa_power", "ao_vivo")

    # --- USDA Soil Data Access (ao vivo) ---
    resultado_solo = usda_soil_data_access.buscar_solo_ponto(latitude, longitude)
    if resultado_solo["disponivel"]:
        for componente in resultado_solo["componentes"]:
            for chave, valor in componente.items():
                if chave in _CAMPOS_IGNORADOS:
                    continue
                variaveis.append({
                    "nome": chave,
                    "fonte": "usda_soil_data_access",
                    "tipo_acesso": "ao_vivo",
                    "data": None,
                    "valor": valor,
                })
    else:
        fontes_indisponiveis.append({"fonte": "usda_soil_data_access", "motivo": "fora_da_cobertura"})

    # --- Fontes pre-indexadas (PostGIS + Parquet) ---
    for fonte in _FONTES_INDEXADAS:
        resultado = buscar_por_coordenada_pg(fonte, latitude, longitude)
        if resultado is None:
            fontes_indisponiveis.append({"fonte": fonte, "motivo": "fora_da_regiao_pre_processada"})
            continue
        variaveis += _variaveis_de_serie(resultado["serie"], fonte, "pre_processado")

    return {
        "latitude": latitude,
        "longitude": longitude,
        "variaveis": variaveis,
        "fontes_indisponiveis": fontes_indisponiveis,
    }
