"""Cliente de integração com o CropScape/CDL (Cropland Data Layer), ao vivo.

API publica, sem login (https://nassgeodata.gmu.edu). Mesma categoria
que NASA POWER e USDA Soil Data Access: chamada direta por coordenada,
nunca pre-indexada. So funciona para pontos dentro dos EUA.

Atencao: as coordenadas da API sao em metros, projecao Albers Equal
Area CONUS (EPSG:5070) -- nao graus decimais. Por isso reprojetamos
com pyproj antes de montar a URL.
"""

from __future__ import annotations

import re
import time

import requests
from pyproj import Transformer

CDL_URL = "https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue"

_para_albers = Transformer.from_crs("EPSG:4326", "EPSG:5070", always_xy=True)

_PADRAO_RESULTADO = re.compile(r"category:\s*\"([^\"]+)\"")


def _ano_do_ponto(latitude: float, longitude: float, ano: int, timeout_s: int, tentativas: int = 3) -> str | None:
    x, y = _para_albers.transform(longitude, latitude)
    erro = None
    for tentativa in range(tentativas):
        try:
            resposta = requests.get(CDL_URL, params={"year": ano, "x": x, "y": y}, timeout=timeout_s)
            if resposta.status_code == 500:
                # Servico responde 500 tanto por erro transiente quanto para
                # coordenada fora da cobertura (CONUS) -- trata como ausencia,
                # nunca inventa cultura. Ver docs/convencao_programacao.md.
                return None
            resposta.raise_for_status()
            corpo = resposta.text
            if "faultstring" in corpo:
                return None
            m = _PADRAO_RESULTADO.search(corpo)
            return m.group(1) if m else None
        except requests.exceptions.RequestException as e:
            erro = e
            time.sleep(2)
    raise erro


def buscar_historico_cultura(
    latitude: float,
    longitude: float,
    ano_inicio: int,
    ano_fim: int,
    timeout_s: int = 30,
) -> dict:
    """Busca a cultura classificada pra cada ano, numa coordenada dos EUA.

    Retorna ``disponivel=False`` por ano quando a coordenada cai fora da
    cobertura (fora dos EUA, por exemplo) -- nunca inventa cultura.
    """
    if ano_inicio > ano_fim:
        raise ValueError("ano_inicio nao pode ser posterior a ano_fim")

    serie = []
    for ano in range(ano_inicio, ano_fim + 1):
        categoria = _ano_do_ponto(latitude, longitude, ano, timeout_s)
        serie.append({
            "ano": ano,
            "disponivel": categoria is not None,
            "categoria": categoria,
        })
        time.sleep(1)  # servidor e sensivel a rajadas de requisicao

    return {
        "fonte": "usda_cropscape_cdl",
        "tipo_acesso": "ao_vivo",
        "latitude": latitude,
        "longitude": longitude,
        "serie": serie,
    }


if __name__ == "__main__":
    print("--- ponto piloto (Fresno County), 2018-2022 ---")
    resultado = buscar_historico_cultura(36.6, -119.7, 2018, 2022)
    for linha in resultado["serie"]:
        print(linha)

    print()
    print("--- ponto fora dos EUA (deve vir disponivel=False) ---")
    print(buscar_historico_cultura(-23.5, -46.6, 2022, 2022)["serie"])
