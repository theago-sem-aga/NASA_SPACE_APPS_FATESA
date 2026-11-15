"""Cliente do NDVI do MODIS (MOD13Q1, 250 m, 16 dias) pela API REST do ORNL DAAC.

Por que este caminho: o arquivo oficial do MODIS vem em HDF4, que o GDAL
instalado nao le. O servico do ORNL DAAC (NASA) ja recorta o pixel do ponto e
devolve JSON, sem login e sem HDF4.
Doc: https://modis.ornl.gov/data/modis_webservice.html

Limites do servico (medidos em 2026-11-15):
  - no maximo 10 datas por pedido de /subset; um periodo maior volta com o
    erro "exceeds maximum subset tiles support of 10". Por isso a busca pede a
    lista de datas (/dates), reparte em blocos de 10, faz um pedido por bloco
    e concatena;
  - as vezes responde 502 depois de ~60 s: cada bloco tem novas tentativas.
  - a serie toda (2000 ate hoje, 614 datas) sao 62 blocos por banda. Tempo
    medido anteriormente com bandas separadas: 20 min com 4 pedidos em paralelo;
    8 e 14 min com 8.
    Lenta demais para a requisicao do usuario. Quem usa a serie longa deve guardar em parquet
    (pipelines/ingestao_modis_ndvi.py) e so buscar ao vivo o que falta.

A coleta padrão agora solicita NDVI e qualidade juntos, omitindo `band` conforme
a documentação oficial: https://modis.ornl.gov/data/modis_webservice.html.
São 62 pedidos para 614 datas (em vez de 124 com as bandas separadas); as demais
bandas da resposta são descartadas. Escala, filtros de qualidade e cálculos não mudam.

Valores: NDVI bruto vai de -2000 a 10000 com fator 0,0001; -3000 e ausencia.
Confiabilidade do pixel (banda pixel_reliability): 0 bom, 1 marginal,
2 neve/gelo, 3 nuvem; -1 ausencia. Ausencia vira None, nunca 0.
"""

from __future__ import annotations

import datetime as dt
import time
from collections.abc import Iterable
from concurrent.futures import Executor, ThreadPoolExecutor

from app.integrations.http import requisitar

ORNL_BASE_URL = "https://modis.ornl.gov/rst/api/v1"
PRODUTO = "MOD13Q1"
BANDA_NDVI = "250m_16_days_NDVI"
BANDA_CONFIABILIDADE = "250m_16_days_pixel_reliability"
MAXIMO_DATAS_POR_PEDIDO = 10

_ESCALA = {BANDA_NDVI: 0.0001, BANDA_CONFIABILIDADE: 1}
_AUSENTE = {BANDA_NDVI: -3000, BANDA_CONFIABILIDADE: -1}
_CAMPO = {BANDA_NDVI: "ndvi", BANDA_CONFIABILIDADE: "confiabilidade_pixel"}

CONFIABILIDADE = {0: "bom", 1: "marginal", 2: "neve_gelo", 3: "nuvem"}


def _validar_ponto(latitude: float, longitude: float) -> None:
    if not (-90 <= latitude <= 90):
        raise ValueError(f"latitude fora do intervalo valido: {latitude}")
    if not (-180 <= longitude <= 180):
        raise ValueError(f"longitude fora do intervalo valido: {longitude}")


def _get_json(caminho: str, params: dict, timeout_s: float, tentativas: int, espera_s: float) -> dict:
    """GET com novas tentativas para as falhas passageiras do ORNL (502/503/504, rede)."""
    url = f"{ORNL_BASE_URL}/{PRODUTO}/{caminho}"
    ultimo_erro: Exception | None = None
    for tentativa in range(tentativas):
        try:
            resposta = requisitar(
                "GET", url, params=params, headers={"Accept": "application/json"}, timeout=timeout_s
            )
            if resposta.status_code in (429, 502, 503, 504):
                raise ConnectionError(f"ORNL respondeu {resposta.status_code}")
            resposta.raise_for_status()
            corpo = resposta.json()
            if isinstance(corpo, str):  # o ORNL devolve erro de validacao como texto JSON
                raise ValueError(f"ORNL recusou o pedido: {corpo}")
            return corpo
        except ValueError:
            raise
        except Exception as erro:  # rede, timeout, 5xx
            ultimo_erro = erro
            if tentativa + 1 < tentativas:
                time.sleep(espera_s * (tentativa + 1))
    raise ConnectionError(f"ORNL sem resposta apos {tentativas} tentativas: {ultimo_erro}")


def listar_datas(
    latitude: float,
    longitude: float,
    data_inicio: dt.date | None = None,
    data_fim: dt.date | None = None,
    timeout_s: float = 60,
    tentativas: int = 4,
    espera_s: float = 5,
) -> list[dict]:
    """Datas do MOD13Q1 que existem para o ponto: [{modis_date, calendar_date}], em ordem."""
    _validar_ponto(latitude, longitude)
    corpo = _get_json(
        "dates", {"latitude": latitude, "longitude": longitude}, timeout_s, tentativas, espera_s
    )
    datas = sorted(corpo["dates"], key=lambda d: d["calendar_date"])
    return [
        d
        for d in datas
        if (data_inicio is None or d["calendar_date"] >= data_inicio.isoformat())
        and (data_fim is None or d["calendar_date"] <= data_fim.isoformat())
    ]


def blocos_de_datas(datas: list[dict], tamanho: int = MAXIMO_DATAS_POR_PEDIDO) -> list[tuple[str, str]]:
    """Reparte as datas em blocos de ate `tamanho`: [(modis_date_inicio, modis_date_fim)]."""
    return [
        (datas[i]["modis_date"], datas[min(i + tamanho, len(datas)) - 1]["modis_date"])
        for i in range(0, len(datas), tamanho)
    ]


def _valor(banda: str, bruto) -> float | int | None:
    if bruto is None or bruto == _AUSENTE[banda]:
        return None
    if banda == BANDA_NDVI:
        return round(bruto * _ESCALA[banda], 4)
    return int(bruto)


def _buscar_bloco(
    latitude: float, longitude: float, banda: str, inicio: str, fim: str,
    timeout_s: float, tentativas: int, espera_s: float,
) -> list[dict]:
    corpo = _get_json(
        "subset",
        {
            "latitude": latitude,
            "longitude": longitude,
            "band": banda,
            "startDate": inicio,
            "endDate": fim,
            "kmAboveBelow": 0,
            "kmLeftRight": 0,
        },
        timeout_s,
        tentativas,
        espera_s,
    )
    return [
        {"data": item["calendar_date"], _CAMPO[banda]: _valor(banda, (item.get("data") or [None])[0])}
        for item in corpo.get("subset", [])
    ]


def _buscar_bloco_conjunto(
    latitude: float, longitude: float, inicio: str, fim: str,
    timeout_s: float, tentativas: int, espera_s: float,
) -> list[dict]:
    # Omitir band solicita as bandas do produto na mesma resposta, conforme
    # a API ORNL. Filtrar apenas NDVI e confiabilidade; não mudar escala/QA.
    corpo = _get_json("subset", {
        "latitude": latitude, "longitude": longitude,
        "startDate": inicio, "endDate": fim, "kmAboveBelow": 0, "kmLeftRight": 0,
    }, timeout_s, tentativas, espera_s)
    linhas = []
    por_data = {}
    for item in corpo.get("subset", []):
        banda = item.get("band")
        if banda not in _CAMPO:
            continue
        valores = item.get("data") or [None]
        if len(valores) != 1:
            raise ValueError("ORNL retornou mais de um pixel para o ponto solicitado")
        data = item["calendar_date"]
        por_data.setdefault(data, set()).add(banda)
        linhas.append({"data": data, _CAMPO[banda]: _valor(banda, valores[0])})
    if not linhas or any(bandas != set(_CAMPO) for bandas in por_data.values()):
        raise ValueError("Resposta ORNL sem as duas bandas esperadas para cada data")
    return linhas


def buscar_ndvi_ponto(
    latitude: float,
    longitude: float,
    data_inicio: dt.date | None = None,
    data_fim: dt.date | None = None,
    bandas: Iterable[str] = (BANDA_NDVI, BANDA_CONFIABILIDADE),
    paralelo: int = 4,
    timeout_s: float = 90,
    tentativas: int = 4,
    espera_s: float = 5,
    executor: Executor | None = None,
) -> dict:
    """Serie de NDVI do MODIS no pixel do ponto, de quantos blocos de 10 datas precisar.

    Sem datas, busca a serie toda (2000 ate a ultima publicada). Retorna o mesmo
    formato de integrations/nasa_power.py: metadados + `serie` por data, com
    {data, ndvi, confiabilidade_pixel}; ausencia como None.
    Se um bloco falhar em todas as tentativas, a busca inteira falha: uma serie
    com buraco no meio pareceria completa e enganaria a anomalia.
    """
    _validar_ponto(latitude, longitude)
    if data_inicio and data_fim and data_inicio > data_fim:
        raise ValueError("data_inicio nao pode ser posterior a data_fim")
    bandas = tuple(bandas)
    datas = listar_datas(latitude, longitude, data_inicio, data_fim, timeout_s, tentativas, espera_s)
    blocos = blocos_de_datas(datas)
    conjunto = set(bandas) == set(_CAMPO)
    pedidos = list(blocos) if conjunto else [(banda, inicio, fim) for banda in bandas for inicio, fim in blocos]

    def buscar(pedido):
        if conjunto:
            inicio, fim = pedido
            return _buscar_bloco_conjunto(latitude, longitude, inicio, fim, timeout_s, tentativas, espera_s)
        banda, inicio, fim = pedido
        return _buscar_bloco(latitude, longitude, banda, inicio, fim, timeout_s, tentativas, espera_s)

    if executor is None:
        with ThreadPoolExecutor(max_workers=max(1, paralelo)) as pool:
            respostas = list(pool.map(buscar, pedidos))
    else:
        # A ingestão de vários pontos pode compartilhar um limite global de
        # requisições, em vez de multiplicar a concorrência por município.
        respostas = list(executor.map(buscar, pedidos))

    # Concatena: uma linha por data, com as bandas lado a lado; duplicadas se fundem.
    por_data: dict[str, dict] = {d["calendar_date"]: {"data": d["calendar_date"]} for d in datas}
    for linhas in respostas:
        for linha in linhas:
            por_data.setdefault(linha["data"], {"data": linha["data"]}).update(linha)
    serie = []
    for data in sorted(por_data):
        registro = {"data": data}
        for banda in bandas:
            registro[_CAMPO[banda]] = por_data[data].get(_CAMPO[banda])
        serie.append(registro)

    return {
        "fonte": "modis_ornl",
        "produto": PRODUTO,
        "tipo_acesso": "ao_vivo",
        "latitude": latitude,
        "longitude": longitude,
        "periodo_inicio": serie[0]["data"] if serie else None,
        "periodo_fim": serie[-1]["data"] if serie else None,
        "pedidos": len(pedidos),
        "data_coleta_utc": dt.datetime.now(dt.UTC).isoformat(),
        "serie": serie,
    }


if __name__ == "__main__":
    import sys

    lat, lon = (float(x) for x in sys.argv[1:3]) if len(sys.argv) >= 3 else (-20.81, -49.38)
    r = buscar_ndvi_ponto(lat, lon, dt.date(2025, 1, 1), dt.date(2025, 12, 31))
    print(f"fonte={r['fonte']} pedidos={r['pedidos']} datas={len(r['serie'])} {r['periodo_inicio']}..{r['periodo_fim']}")
    for linha in r["serie"][:5]:
        print(linha)
