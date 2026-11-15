"""Coleta concorrente com falha isolada por fonte; sem regras agronômicas."""

import datetime as dt
import math
import numbers
import os
from concurrent.futures import ThreadPoolExecutor

import requests
from sqlalchemy.exc import SQLAlchemyError

from app.configuracao import configuracao
from app.integrations import nasa_power, openet, usda_soil_data_access
from app.repositories.espacial import buscar_celula
from app.services.cache import com_cache
from app.services.grace import grace_do_ponto
from app.services.precipitacao_extrema import precipitacao_extrema_do_ponto
from app.services.solo import camada_soilgrids

FONTES_INDEXADAS = ("gpm", "smap", "srtm", "ecostress", "landsat", "grace", "soilgrids")
CAMPOS = {
    "nasa_power": set(nasa_power._MAPA_PARAMETROS.values()),
    "usda_soil_data_access": {
        "materia_organica_pct",
        "areia_pct",
        "argila_pct",
        "silte_pct",
        "condutividade_hidraulica_micrometros_s",
        "capacidade_agua_disponivel_cm_cm",
    },
    "openet": {"evapotranspiracao_mm"},
    "gpm": {"precipitacao_acumulada_mm"},
    "smap": {"umidade_solo_cm3_cm3"},
    "srtm": {"elevacao_media_m", "elevacao_min_m", "elevacao_max_m"},
    "ecostress": {"temperatura_superficie_media_c"},
    "landsat": {"ndvi_medio"},
    "grace": {"armazenamento_agua_anomalia_cm"},
    "precipitacao_extrema": {"dias_chuva_extrema_30d", "limiar_chuva_extrema_mm_dia"},
    # Mesmos nomes do usda_soil_data_access: mesma grandeza fisica (areia/argila/silte
    # da camada superficial), só a fonte muda (SoilGrids cobre fora dos EUA).
    "soilgrids": {"areia_pct", "argila_pct", "silte_pct"},
}


def _variaveis_de_serie(serie, fonte, tipo_acesso):
    resultado = []
    for registro in serie:
        data = registro.get("data") or registro.get("data_levantamento")
        if isinstance(data, (dt.date, dt.datetime)):
            data = data.isoformat()[:10]
        for nome in CAMPOS[fonte]:
            if nome not in registro:
                continue
            valor = registro[nome]
            if valor is not None:
                if not isinstance(valor, numbers.Real) or isinstance(valor, bool):
                    raise ValueError("Medição não numérica")
                valor = float(valor) if math.isfinite(valor) else None
            resultado.append(
                {
                    "nome": nome,
                    "fonte": fonte,
                    "tipo_acesso": tipo_acesso,
                    "data": data,
                    "valor": valor,
                }
            )
    return sorted(resultado, key=lambda v: (v["data"] or "", v["nome"]))


def _buscar(fonte, lat, lon):
    timeout = configuracao()["timeout_s"]
    hoje = dt.datetime.now(dt.UTC).date()
    if fonte == "nasa_power":
        return nasa_power.buscar_power_ponto(
            lat, lon, hoje - dt.timedelta(days=14), hoje - dt.timedelta(days=7), timeout_s=timeout
        )
    if fonte == "usda_soil_data_access":
        return usda_soil_data_access.buscar_solo_ponto(lat, lon, timeout_s=timeout)
    if fonte == "openet":
        if not os.getenv("OPENET_API_KEY"):
            return {"disponivel": False, "motivo": "chave_nao_configurada"}
        fim = (hoje.replace(day=1) - dt.timedelta(days=1)).replace(day=1) - dt.timedelta(days=1)
        return openet.buscar_et_ponto(lat, lon, fim.replace(day=1), fim, timeout_s=timeout)
    if fonte == "precipitacao_extrema":
        # Multi-regional: usa o cache local se existir (pontos piloto), senao
        # busca ao vivo na NASA POWER o recorte necessario (ver services/precipitacao_extrema.py).
        return precipitacao_extrema_do_ponto(lat, lon)
    if fonte == "grace":
        # Multi-regional: celula local se existir, senao le o pixel mais proximo
        # direto do arquivo global ja baixado (ver services/grace.py) -- cobre
        # qualquer coordenada do planeta, sem rede nova.
        return grace_do_ponto(lat, lon)
    if fonte == "soilgrids":
        # Formato longo (uma linha por variavel x profundidade) -- achata so a
        # camada superficial pros mesmos nomes de campo do usda_soil_data_access.
        camada = camada_soilgrids(lat, lon)
        if camada is None:
            return None
        return {
            "serie": [{
                "areia_pct": camada.get("areia"),
                "argila_pct": camada.get("argila"),
                "silte_pct": camada.get("silte"),
            }],
            "tipo_acesso": "pre_processado",
        }
    return buscar_celula(fonte, lat, lon)


def _coletar_fonte(fonte, lat, lon):
    try:
        resultado = com_cache(
            ("fonte", fonte, lat, lon),
            configuracao()["cache_ttl_s"],
            lambda: _buscar(fonte, lat, lon),
        )
        if resultado is None:
            return [], {"fonte": fonte, "motivo": "fora_da_regiao_pre_processada"}, None
        if resultado.get("disponivel") is False:
            return (
                [],
                {"fonte": fonte, "motivo": resultado.get("motivo", "fora_da_cobertura")},
                resultado,
            )
        if fonte == "usda_soil_data_access":
            componentes = resultado.get("componentes", [])
            # Sem associação de componentes no DTO legado, emitir só se inequívoco.
            serie = componentes if len(componentes) == 1 else []
        else:
            serie = resultado.get("serie", [])
        tipo_acesso = resultado.get("tipo_acesso") or ("pre_processado" if fonte in FONTES_INDEXADAS else "ao_vivo")
        valores = _variaveis_de_serie(serie, fonte, tipo_acesso)
        motivo_ausencia = (
            "componentes_solo_ambiguos"
            if fonte == "usda_soil_data_access" and len(componentes) > 1
            else "sem_medicoes"
        )
        ausencia = (
            None
            if any(v["valor"] is not None for v in valores)
            else {"fonte": fonte, "motivo": motivo_ausencia}
        )
        return valores, ausencia, resultado
    except requests.Timeout:
        motivo = "timeout"
    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 0
        motivo = (
            "falha_autenticacao"
            if status in (401, 403)
            else "limite_requisicoes"
            if status == 429
            else "falha_fonte"
        )
    except (SQLAlchemyError, RuntimeError):
        motivo = "banco_indisponivel" if fonte in FONTES_INDEXADAS else "falha_fonte"
    except FileNotFoundError:
        motivo = "arquivo_indisponivel"
    except (ValueError, KeyError, TypeError):
        motivo = "dado_invalido"
    except (requests.RequestException, OSError):
        motivo = "falha_fonte"
    return [], {"fonte": fonte, "motivo": motivo}, None


def coletar_variaveis(latitude, longitude, incluir_evidencias=False):
    fontes = ("nasa_power", "usda_soil_data_access", "openet", "precipitacao_extrema", *FONTES_INDEXADAS)
    with ThreadPoolExecutor(max_workers=8) as executor:
        resultados = list(executor.map(lambda f: _coletar_fonte(f, latitude, longitude), fontes))
    resposta = {
        "latitude": latitude,
        "longitude": longitude,
        "variaveis": [],
        "fontes_indisponiveis": [],
    }
    evidencias = {}
    for fonte, (valores, ausencia, bruto) in zip(fontes, resultados, strict=True):
        resposta["variaveis"].extend(valores)
        if ausencia:
            resposta["fontes_indisponiveis"].append(ausencia)
        if bruto:
            evidencias[fonte] = bruto
    if incluir_evidencias:
        resposta["evidencias"] = evidencias
    return resposta
