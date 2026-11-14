"""Cliente de integração com a API da NASA POWER (ao vivo, sem login).

Fonte classificada como "API ao vivo" em docs/convencao_programacao.md,
seção "Estrategia de acesso aos dados". Nenhuma outra integração de
dados de satelite deve seguir este padrao de chamada direta por
requisicao do usuario -- as demais (SMAP, GPM, etc.) sao pre-indexadas.
"""

from __future__ import annotations

import datetime as dt
from typing import Iterable

import requests

POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Mapeia o codigo de parametro da NASA POWER para o nome de campo do
# dominio (snake_case, sem acento, conforme docs/convencao_programacao.md).
_MAPA_PARAMETROS = {
    "T2M": "temperatura_media_c",
    "T2M_MAX": "temperatura_maxima_c",
    "T2M_MIN": "temperatura_minima_c",
    "PRECTOTCORR": "precipitacao_acumulada_mm",
    "RH2M": "umidade_relativa_pct",
    "WS2M": "velocidade_vento_ms",
    "ALLSKY_SFC_SW_DWN": "radiacao_solar_kwh_m2",
}

PARAMETROS_PADRAO = tuple(_MAPA_PARAMETROS.keys())

# A NASA POWER usa -999 (ou valores muito proximos) para marcar ausencia
# de medicao. Nunca deve ser interpretado como zero.
_VALOR_AUSENTE = -999


def _data_str(data: dt.date) -> str:
    return data.strftime("%Y%m%d")


def buscar_power_ponto(
    latitude: float,
    longitude: float,
    data_inicio: dt.date,
    data_fim: dt.date,
    parametros: Iterable[str] = PARAMETROS_PADRAO,
    comunidade: str = "AG",
    timeout_s: int = 30,
) -> dict:
    """Busca series diarias da NASA POWER para um ponto, ao vivo.

    Retorna um dicionario com metadados de rastreabilidade (fonte,
    tipo de acesso, coordenada, janela de datas) e a serie por data,
    com nomes de campo em portugues (snake_case) e ausencias como
    ``None`` -- nunca convertidas para zero.
    """
    if not (-90 <= latitude <= 90):
        raise ValueError(f"latitude fora do intervalo valido: {latitude}")
    if not (-180 <= longitude <= 180):
        raise ValueError(f"longitude fora do intervalo valido: {longitude}")
    if data_inicio > data_fim:
        raise ValueError("data_inicio nao pode ser posterior a data_fim")

    params = {
        "parameters": ",".join(parametros),
        "community": comunidade,
        "longitude": longitude,
        "latitude": latitude,
        "start": _data_str(data_inicio),
        "end": _data_str(data_fim),
        "format": "JSON",
    }

    resposta = requests.get(POWER_BASE_URL, params=params, timeout=timeout_s)
    resposta.raise_for_status()
    corpo = resposta.json()

    parametros_api = corpo["properties"]["parameter"]

    datas = sorted(next(iter(parametros_api.values())).keys())
    serie = []
    for data_aaaammdd in datas:
        registro = {"data": f"{data_aaaammdd[0:4]}-{data_aaaammdd[4:6]}-{data_aaaammdd[6:8]}"}
        for codigo_api, valores_por_data in parametros_api.items():
            campo = _MAPA_PARAMETROS.get(codigo_api, codigo_api.lower())
            valor = valores_por_data.get(data_aaaammdd)
            registro[campo] = None if valor is None or valor <= _VALOR_AUSENTE else valor
        serie.append(registro)

    return {
        "fonte": "nasa_power",
        "tipo_acesso": "ao_vivo",
        "latitude": latitude,
        "longitude": longitude,
        "periodo_inicio": data_inicio.isoformat(),
        "periodo_fim": data_fim.isoformat(),
        "data_coleta_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "serie": serie,
    }


if __name__ == "__main__":
    # Teste manual contra a regiao piloto (Condado de Fresno, CA),
    # ver docs/convencao_programacao.md.
    resultado = buscar_power_ponto(
        latitude=36.6,
        longitude=-119.7,
        data_inicio=dt.date(2023, 1, 1),
        data_fim=dt.date(2023, 1, 7),
    )
    print(f"fonte={resultado['fonte']} tipo_acesso={resultado['tipo_acesso']}")
    print(f"{len(resultado['serie'])} dias retornados")
    for linha in resultado["serie"][:3]:
        print(linha)
