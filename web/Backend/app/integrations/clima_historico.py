"""Série mensal POWER: taxa média diária convertida em acumulado mensal.

Metadados de unidade são obrigatórios. Arquivo original é preservado por hash.
"""

import calendar
import datetime as dt
import hashlib
import json
import math
import threading

import requests

from app.configuracao import RAIZ, configuracao
from app.integrations.http import requisitar
from app.services.cache import com_cache

URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
_arquivo_lock = threading.Lock()


def agregar_clima(corpo, ano_inicio, ano_fim):
    unidade = corpo["parameters"]["PRECTOTCORR"]["units"].lower().replace(" ", "")
    if unidade not in ("mm/day", "mm/d", "mm/month", "mm/mo"):
        raise ValueError("Unidade de precipitação não reconhecida")
    parametros = corpo["properties"]["parameter"]["PRECTOTCORR"]
    fill = corpo.get("header", {}).get("fill_value", -999)
    meses = []
    contagens = {}
    for mes in range(1, 13):
        acumulados = []
        for ano in range(ano_inicio, ano_fim + 1):
            valor = parametros.get(f"{ano}{mes:02d}")
            if (
                valor is None
                or not isinstance(valor, (int, float))
                or not math.isfinite(valor)
                or valor == fill
                or valor < 0
            ):
                continue
            acumulados.append(
                valor * calendar.monthrange(ano, mes)[1] if unidade in ("mm/day", "mm/d") else valor
            )
        contagens[str(mes)] = len(acumulados)
        # Um mês incompleto não é apresentado como normal de todo o período.
        media = (
            round(sum(acumulados) / len(acumulados), 2)
            if len(acumulados) == ano_fim - ano_inicio + 1
            else None
        )
        meses.append({"mes": mes, "precipitacao_acumulada_mm": media, "umidade_solo": None})
    return meses, contagens


def _buscar(latitude, longitude, inicio, fim):
    params = {
        "parameters": "PRECTOTCORR",
        "community": "AG",
        "latitude": latitude,
        "longitude": longitude,
        "start": inicio,
        "end": fim,
        "format": "JSON",
    }
    identidade = hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()
    pasta = RAIZ / "web" / "Backend" / ".cache" / "power"
    caminho = pasta / f"{identidade}.json"
    config = configuracao()
    anterior = None
    if caminho.is_file():
        try:
            anterior = json.loads(caminho.read_text(encoding="utf-8"))
            idade = (
                dt.datetime.now(dt.UTC) - dt.datetime.fromisoformat(anterior["extraido_em_utc"])
            ).total_seconds()
            if idade < config["cache_ttl_s"]:
                return anterior
        except (ValueError, KeyError, OSError):
            anterior = None
    try:
        resposta = requisitar("GET", URL, params=params, timeout=config["timeout_s"])
        resposta.raise_for_status()
        corpo = resposta.json()
        agregar_clima(corpo, inicio, fim)  # validar antes de substituir cache válido
        registro = {
            "corpo": corpo,
            "extraido_em_utc": dt.datetime.now(dt.UTC).isoformat(),
            "url_origem": URL,
            "parametros": params,
            "sha256": hashlib.sha256(resposta.content).hexdigest(),
            "cache_desatualizado": False,
        }
        with _arquivo_lock:
            pasta.mkdir(parents=True, exist_ok=True)
            temporario = caminho.with_suffix(".tmp")
            temporario.write_text(json.dumps(registro, allow_nan=False), encoding="utf-8")
            temporario.replace(caminho)
        return registro
    except (requests.RequestException, ValueError, KeyError):
        if anterior:
            return {**anterior, "cache_desatualizado": True}
        raise


def buscar_clima(latitude, longitude):
    config = configuracao()
    inicio, fim = config["ano_inicio"], config["ano_fim"]
    if inicio > fim or inicio < 1981 or fim >= dt.datetime.now(dt.UTC).year:
        raise ValueError("Período climático deve ter anos completos a partir de 1981")
    registro = com_cache(
        ("clima", latitude, longitude, inicio, fim),
        config["cache_ttl_s"],
        lambda: _buscar(latitude, longitude, inicio, fim),
    )
    meses, contagens = agregar_clima(registro["corpo"], inicio, fim)
    return {
        "clima_mensal": meses,
        "contagens": contagens,
        "proveniencia": registro,
        "fonte_clima": {
            "fonte_id": "nasa_power",
            "nome": "NASA POWER — série mensal",
            "tipo_dado": "observacao_historica",
            "periodo_inicio": f"{inicio}-01-01",
            "periodo_fim": f"{fim}-12-31",
        },
    }
