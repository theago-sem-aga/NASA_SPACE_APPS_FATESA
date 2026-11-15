"""Orquestração: coleta, clima, domínio e persistência."""

import datetime as dt
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import requests

from app.configuracao import configuracao
from app.domain.motor import VERSAO, caracterizar_talhao, gerar_cenarios
from app.domain.solo import classificar_textura
from app.integrations.clima_historico import buscar_clima
from app.integrations.usda_soil_data_access import buscar_solo_ponto
from app.repositories.banco import RepositorioAnalises
from app.schemas.analises import Analise
from app.services.coleta_variaveis import coletar_variaveis
from app.services.geada import risco_geada
from app.services.precipitacao_extrema import resumo_precipitacao_extrema


def dentro_piloto(lat, lon):
    return 36.4 <= lat < 36.8 and -119.9 <= lon < -119.5


def criar_analise(entrada):
    repositorio = RepositorioAnalises()
    repositorio.verificar()  # falhar antes de gastar chamadas externas se não persistirá
    with ThreadPoolExecutor(max_workers=5) as executor:
        coleta_pendente = executor.submit(
            coletar_variaveis, entrada.latitude, entrada.longitude, True
        )
        clima_pendente = executor.submit(buscar_clima, entrada.latitude, entrada.longitude)
        geada_pendente = executor.submit(risco_geada, entrada.latitude, entrada.longitude)
        precipitacao_extrema_pendente = executor.submit(
            resumo_precipitacao_extrema, entrada.latitude, entrada.longitude
        )
        solo_pendente = executor.submit(buscar_solo_ponto, entrada.latitude, entrada.longitude)
        coleta = coleta_pendente.result()
        try:
            geada = geada_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            geada = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "nasa_power_geada", "motivo": "falha_fonte"}
            )
        try:
            precipitacao_extrema = precipitacao_extrema_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            precipitacao_extrema = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "nasa_power_precipitacao_extrema", "motivo": "falha_fonte"}
            )
        try:
            solo = solo_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            solo = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "usda_soil_data_access_textura", "motivo": "falha_fonte"}
            )
        try:
            clima = clima_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            config = configuracao()
            clima = {
                "clima_mensal": [
                    {"mes": m, "precipitacao_acumulada_mm": None, "umidade_solo": None}
                    for m in range(1, 13)
                ],
                "fonte_clima": {
                    "fonte_id": "nasa_power",
                    "nome": "NASA POWER — indisponível",
                    "tipo_dado": "observacao_historica",
                    "periodo_inicio": f"{config['ano_inicio']}-01-01",
                    "periodo_fim": f"{config['ano_fim']}-12-31",
                },
            }
            coleta["fontes_indisponiveis"].append(
                {"fonte": "nasa_power_historico", "motivo": "falha_fonte"}
            )
    componentes_solo = solo["componentes"] if solo and solo.get("disponivel") else []
    textura_calculada = None
    if len(componentes_solo) == 1:
        c = componentes_solo[0]
        if c["areia_pct"] is not None and c["argila_pct"] is not None:
            textura_calculada = classificar_textura(c["areia_pct"], c["argila_pct"])

    beta = configuracao()["cenarios_beta"]
    limitacoes = [
        "Piloto restrito ao recorte processado de Fresno, Califórnia. Dados regionais não substituem levantamento do talhão.",
        "Elevação agregada não permite calcular declividade; riscos de erosão e seca não têm regra validada e ficam sem dado.",
        "Umidade superficial do SMAP não foi transformada em um índice de água na zona das raízes.",
        "A cultura atual não informa calendário nem manejo: a referência exibida não comprova a prática atual do produtor.",
        "NASA POWER fornece dados históricos em grade; não é medição de estação instalada no talhão nem previsão meteorológica.",
    ]
    if beta:
        limitacoes.append(
            "SIMULAÇÃO BETA: estratégias, níveis e calendário são hipóteses de teste. O clima, quando disponível, é real e tem período próprio."
        )
    else:
        limitacoes.append(
            "Estratégias não geradas: falta validar o catálogo agronômico. Habilitar o modo beta só para teste explícito."
        )
    if any(m["precipitacao_acumulada_mm"] is None for m in clima["clima_mensal"]):
        limitacoes.append(
            "Histórico de chuva incompleto ou indisponível: meses sem série completa ficam sem valor."
        )
    if clima.get("proveniencia", {}).get("cache_desatualizado"):
        limitacoes.append(
            "Fonte histórica indisponível ao atualizar; usando cópia anterior com data de extração preservada."
        )
    if geada:
        limitacoes.append(
            f"Risco de geada: frequência de noites com mínima do ar a 2 m de até {geada['limiar_c']:g} °C "
            f"({geada['periodo_inicio']}–{geada['periodo_fim']}, NASA POWER). A folha esfria mais que o ar e "
            "baixadas geiam mais que a média da grade; limiar e faixas ainda sem referência validada."
        )
    else:
        limitacoes.append("Risco de geada sem dado: a série de temperatura mínima não respondeu.")
    if precipitacao_extrema:
        limitacoes.append(
            f"Precipitação extrema: {precipitacao_extrema['metodo']}. Grade regional da NASA POWER, "
            "não é medição de pluviômetro no talhão; limiar estatístico, não um alerta oficial."
        )
    else:
        limitacoes.append("Precipitação extrema sem dado: a série diária de chuva não respondeu.")
    if entrada.correcoes.textura_solo:
        pass  # o produtor corrigiu; não há limitação a registrar sobre a fonte.
    elif textura_calculada:
        limitacoes.append(
            "Textura do solo: classificação simplificada em 3 faixas a partir de areia/argila "
            "da camada superficial (USDA Soil Data Access / SSURGO); não é o triângulo textural "
            "completo e está pendente de revisão agronômica."
        )
    elif len(componentes_solo) > 1:
        limitacoes.append(
            "Textura do solo sem dado: a unidade de mapeamento tem mais de um tipo de solo, sem "
            "como escolher automaticamente qual representa o talhão."
        )
    else:
        limitacoes.append("Textura do solo sem dado: fonte indisponível ou ponto fora da cobertura do SSURGO.")
    if entrada.origem_local == "municipio":
        limitacoes.append("Localização aproximada por referência regional, sem precisão de talhão.")
    talhao_base = caracterizar_talhao(entrada)
    usa_textura_calculada = talhao_base.textura_solo is None and textura_calculada is not None
    bases = []
    if geada:
        bases.append("NASA POWER")
    if usa_textura_calculada:
        bases.append("USDA Soil Data Access")
    resultado = Analise(
        analise_id=str(uuid4()),
        eh_mock=beta,
        descricao_local="Região piloto de Fresno (CA)",
        talhao=talhao_base.model_copy(
            update={
                "risco_geada": geada["nivel"] if geada else None,
                "textura_solo": textura_calculada if usa_textura_calculada else talhao_base.textura_solo,
                "bases": bases,
            }
        ),
        fonte_clima=clima["fonte_clima"],
        clima_mensal=clima["clima_mensal"],
        geada=geada,
        precipitacao_extrema=precipitacao_extrema,
        estrategias=gerar_cenarios(entrada, clima["clima_mensal"]) if beta else [],
        limitacoes=limitacoes,
        versao_motor=VERSAO,
        criada_em_utc=dt.datetime.now(dt.UTC).isoformat(),
        fontes_indisponiveis=coleta["fontes_indisponiveis"],
        estado_recomendacoes="simulacao_beta" if beta else "dados_insuficientes",
    )
    coleta["clima_historico"] = clima
    repositorio.salvar(entrada.model_dump(mode="json"), resultado.model_dump(mode="json"), coleta)
    return resultado
