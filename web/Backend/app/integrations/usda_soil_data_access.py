"""Cliente de integração com o USDA Soil Data Access (SDA), ao vivo.

API SQL publica, sem login (https://sdmdataaccess.sc.egov.usda.gov).
Mesma categoria de acesso que a NASA POWER (ver docs/convencao_programacao.md,
"Estrategia de acesso aos dados"): chamada direta por coordenada, nunca
pre-indexada. So funciona para pontos dentro dos EUA (cobertura do SSURGO).
"""

from __future__ import annotations

import requests

SDA_URL = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest"

_CAMPOS = [
    "nome_unidade_mapeamento",
    "nome_componente",
    "percentual_componente",
    "profundidade_topo_cm",
    "profundidade_base_cm",
    "materia_organica_pct",
    "areia_pct",
    "argila_pct",
    "silte_pct",
    "condutividade_hidraulica_micrometros_s",
    "capacidade_agua_disponivel_cm_cm",
]


def _mukey_do_ponto(latitude: float, longitude: float, timeout_s: int) -> int | None:
    consulta = {
        "query": (
            "SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84("
            f"'POINT({longitude} {latitude})')"
        ),
        "format": "JSON",
    }
    resposta = requests.post(SDA_URL, json=consulta, timeout=timeout_s)
    resposta.raise_for_status()
    corpo = resposta.json()
    linhas = corpo.get("Table")
    if not linhas:
        return None
    return int(linhas[0][0])


def buscar_solo_ponto(latitude: float, longitude: float, timeout_s: int = 30) -> dict:
    """Busca propriedades do solo (camada superficial) pra uma coordenada.

    Retorna ``disponivel=False`` quando o ponto nao cai em nenhuma unidade
    de mapeamento do SSURGO (fora dos EUA, ou area sem levantamento) --
    nunca inventa valor.
    """
    if not (-90 <= latitude <= 90):
        raise ValueError(f"latitude fora do intervalo valido: {latitude}")
    if not (-180 <= longitude <= 180):
        raise ValueError(f"longitude fora do intervalo valido: {longitude}")

    mukey = _mukey_do_ponto(latitude, longitude, timeout_s)
    if mukey is None:
        return {
            "fonte": "usda_soil_data_access",
            "tipo_acesso": "ao_vivo",
            "latitude": latitude,
            "longitude": longitude,
            "disponivel": False,
        }

    consulta = {
        "query": (
            "SELECT mapunit.muname, component.compname, component.comppct_r, "
            "chorizon.hzdept_r, chorizon.hzdepb_r, chorizon.om_r, "
            "chorizon.sandtotal_r, chorizon.claytotal_r, chorizon.silttotal_r, "
            "chorizon.ksat_r, chorizon.awc_r "
            "FROM mapunit "
            "INNER JOIN component ON component.mukey = mapunit.mukey AND component.majcompflag = 'Yes' "
            "INNER JOIN chorizon ON chorizon.cokey = component.cokey AND chorizon.hzdept_r = 0 "
            f"WHERE mapunit.mukey = {mukey}"
        ),
        "format": "JSON",
    }
    resposta = requests.post(SDA_URL, json=consulta, timeout=timeout_s)
    resposta.raise_for_status()
    linhas = resposta.json().get("Table") or []

    componentes = []
    for linha in linhas:
        registro = dict(zip(_CAMPOS, linha))
        for campo in registro:
            if campo != "nome_unidade_mapeamento" and campo != "nome_componente" and registro[campo] is not None:
                try:
                    registro[campo] = float(registro[campo])
                except (TypeError, ValueError):
                    pass
        componentes.append(registro)

    return {
        "fonte": "usda_soil_data_access",
        "tipo_acesso": "ao_vivo",
        "latitude": latitude,
        "longitude": longitude,
        "disponivel": True,
        "mukey": mukey,
        "componentes": componentes,
    }


if __name__ == "__main__":
    print("--- ponto piloto (Fresno County, dentro dos EUA) ---")
    print(buscar_solo_ponto(36.6, -119.7))

    print()
    print("--- ponto fora dos EUA (deve vir disponivel=False) ---")
    print(buscar_solo_ponto(-23.5, -46.6))
