"""Orquestração: coleta, clima, domínio e persistência."""

import datetime as dt
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import requests

from app.configuracao import configuracao
from app.domain.motor import VERSAO, caracterizar_talhao, gerar_cenarios
from app.i18n import texto
from app.domain.solo import classificar_textura
from app.integrations.clima_historico import buscar_clima
from app.modelos.motor_decisao import montar_estrategias_reais
from app.repositories.banco import RepositorioAnalises
from app.schemas.analises import Analise
from app.services.coleta_variaveis import coletar_variaveis
from app.services.declividade import declividade_do_ponto
from app.services.estresse_termico import estresse_termico_do_ponto
from app.services.estresse_vegetal import estresse_vegetal
from app.services.geada import risco_geada
from app.services.locais import buscar_por_codigo
from app.services.precipitacao_extrema import resumo_precipitacao_extrema
from app.services.risco_seca import resumo_risco_seca
from app.services.solo import buscar_textura_ponto
from app.services.tendencia_hidrica import tendencia_hidrica

# Cultura com catalogo real (ZARC), ligado ao backend.
# Outras culturas ainda caem no motor beta generico, simulado.
CULTURAS_COM_CATALOGO_REAL = {"cana_de_acucar"}


def criar_analise(entrada):
    fonte_declividade = "srtm_declividade" if entrada.latitude < 0 else "declividade_usgs_3dep"
    repositorio = RepositorioAnalises()
    repositorio.verificar()  # falhar antes de gastar chamadas externas se não persistirá
    with ThreadPoolExecutor(max_workers=10) as executor:
        coleta_pendente = executor.submit(
            coletar_variaveis, entrada.latitude, entrada.longitude, True
        )
        clima_pendente = executor.submit(buscar_clima, entrada.latitude, entrada.longitude)
        geada_pendente = executor.submit(risco_geada, entrada.latitude, entrada.longitude)
        precipitacao_extrema_pendente = executor.submit(
            resumo_precipitacao_extrema, entrada.latitude, entrada.longitude
        )
        solo_pendente = executor.submit(buscar_textura_ponto, entrada.latitude, entrada.longitude)
        tendencia_pendente = executor.submit(tendencia_hidrica, entrada.latitude, entrada.longitude)
        estresse_pendente = executor.submit(estresse_vegetal, entrada.latitude, entrada.longitude)
        declividade_pendente = executor.submit(declividade_do_ponto, entrada.latitude, entrada.longitude)
        risco_seca_pendente = executor.submit(resumo_risco_seca, entrada.latitude, entrada.longitude)
        estresse_termico_pendente = executor.submit(
            estresse_termico_do_ponto, entrada.latitude, entrada.longitude
        )
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
            tendencia = tendencia_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            tendencia = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "nasa_power_tendencia_hidrica", "motivo": "falha_fonte"}
            )
        try:
            estresse = estresse_pendente.result()
        except LookupError:
            estresse = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "modis_ndvi_estresse_vegetal", "motivo": "sem_historico_pre_processado"}
            )
        except (ValueError, KeyError, OSError):
            estresse = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "modis_ndvi_estresse_vegetal", "motivo": "falha_fonte"}
            )
        try:
            solo = solo_pendente.result()
            if solo is None:
                coleta["fontes_indisponiveis"].append(
                    {"fonte": "textura_solo", "motivo": "sem_textura_inequivoca"}
                )
        except (requests.RequestException, ValueError, KeyError, OSError):
            solo = None
            coleta["fontes_indisponiveis"].append({"fonte": "textura_solo", "motivo": "falha_fonte"})
        try:
            declividade = declividade_pendente.result()
            if declividade is None:
                coleta["fontes_indisponiveis"].append(
                    {"fonte": fonte_declividade, "motivo": "sem_elevacao_disponivel"}
                )
        except (requests.RequestException, ValueError, KeyError, OSError):
            declividade = None
            coleta["fontes_indisponiveis"].append({"fonte": fonte_declividade, "motivo": "falha_fonte"})
        try:
            risco_seca = risco_seca_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            risco_seca = None
            coleta["fontes_indisponiveis"].append({"fonte": "nasa_power_risco_seca", "motivo": "falha_fonte"})
        try:
            estresse_termico = estresse_termico_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            estresse_termico = None
            coleta["fontes_indisponiveis"].append(
                {"fonte": "nasa_power_estresse_termico", "motivo": "falha_fonte"}
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
    textura_calculada = None
    if solo:
        textura_calculada = solo.get("textura_solo") or classificar_textura(
            solo["areia_pct"], solo["argila_pct"]
        )

    catalogo_real = entrada.cultura_atual_id in CULTURAS_COM_CATALOGO_REAL
    beta = configuracao()["cenarios_beta"]
    idioma = entrada.idioma

    def t(pt: str, en: str) -> str:
        return texto(idioma, pt, en)

    limitacoes = [
        t("Dados regionais (grade de satélite/clima) não substituem levantamento do talhão.",
          "Regional data (satellite/climate grid) does not replace a field survey."),
        t("Risco de erosão ainda não tem regra validada e fica sem dado.",
          "Erosion risk has no validated rule yet and is left without data."),
        t("Umidade superficial do SMAP não foi transformada em um índice de água na zona das raízes.",
          "SMAP surface moisture has not been turned into a root-zone water index."),
        t("A cultura atual não informa calendário nem manejo: a referência exibida não comprova a prática atual do produtor.",
          "The current crop does not tell us the calendar or management: the reference shown does not prove the grower's current practice."),
        t("NASA POWER fornece dados históricos em grade; não é medição de estação instalada no talhão nem previsão meteorológica.",
          "NASA POWER provides gridded historical data; it is not a station measurement in the field nor a weather forecast."),
    ]
    if catalogo_real:
        limitacoes.append(t(
            "Estratégias do catálogo real de reforma de canavial (ZARC + práticas curadas); níveis de atributo "
            "ainda pendentes de revisão por um agrônomo.",
            "Options from the real sugarcane renewal catalog (ZARC + curated practices); attribute levels are "
            "still pending review by an agronomist."))
    elif beta:
        limitacoes.append(t(
            "SIMULAÇÃO BETA: estratégias, níveis e calendário são hipóteses de teste. O clima, quando disponível, é real e tem período próprio.",
            "BETA SIMULATION: options, levels and calendar are test hypotheses. The climate, when available, is real and has its own period."))
    else:
        limitacoes.append(t(
            "Estratégias não geradas: só existe catálogo real pra cana-de-açúcar; outras culturas exigem habilitar o modo beta (simulado) pra teste.",
            "Options not generated: a real catalog exists only for sugarcane; other crops require enabling the (simulated) beta mode for testing."))
    if any(m["precipitacao_acumulada_mm"] is None for m in clima["clima_mensal"]):
        limitacoes.append(t(
            "Histórico de chuva incompleto ou indisponível: meses sem série completa ficam sem valor.",
            "Rain history incomplete or unavailable: months without a complete series have no value."))
    if clima.get("proveniencia", {}).get("cache_desatualizado"):
        limitacoes.append(t(
            "Fonte histórica indisponível ao atualizar; usando cópia anterior com data de extração preservada.",
            "Historical source unavailable on refresh; using the previous copy with its extraction date kept."))
    if geada:
        limitacoes.append(t(
            f"Risco de geada: frequência de noites com mínima do ar a 2 m de até {geada['limiar_c']:g} °C "
            f"({geada['periodo_inicio']}–{geada['periodo_fim']}, NASA POWER). A folha esfria mais que o ar e "
            "baixadas geiam mais que a média da grade; limiar e faixas ainda sem referência validada.",
            f"Frost risk: frequency of nights with 2 m air minimum at or below {geada['limiar_c']:g} °C "
            f"({geada['periodo_inicio']}–{geada['periodo_fim']}, NASA POWER). Leaves get colder than the air and "
            "low-lying ground gets more frost than the grid average; threshold and bands have no validated reference yet."))
    else:
        limitacoes.append(t("Risco de geada sem dado: a série de temperatura mínima não respondeu.",
                            "Frost risk without data: the minimum temperature series did not respond."))
    if tendencia:
        limitacoes.append(t(
            f"Tendência da chuva: {tendencia['metodo']}, {tendencia['periodo_inicio']}–{tendencia['periodo_fim']}. "
            "NASA POWER é reanálise em grade, não pluviômetro: uma tendência forte deve ser conferida com estação "
            "meteorológica antes de decisão cara. Tendência do passado não garante o futuro.",
            f"Rain trend: Mann-Kendall (5%) + Sen's slope on yearly rain, {tendencia['periodo_inicio']}–{tendencia['periodo_fim']}. "
            "NASA POWER is a gridded reanalysis, not a rain gauge: a strong trend should be checked against a weather "
            "station before a costly decision. A past trend does not guarantee the future."))
    else:
        limitacoes.append(t("Tendência da chuva sem dado: faltam anos completos na série de chuva.",
                            "Rain trend without data: not enough complete years in the rain series."))
    if estresse:
        limitacoes.append(t(
            f"Estresse vegetal: {estresse['metodo']}, foto de {estresse['data_foto']}, pixel de 250 m "
            f"a {estresse['distancia_pixel_km']:g} km do ponto. Queda do NDVI pode ser estresse hídrico, pragas, "
            "doenças ou falta de nutrientes, mas também colheita ou senescência, que não são problema: ler junto "
            f"com o campo e o clima ({estresse['fonte_referencia']}, de onde vêm também as faixas e o limiar de "
            "0,20). Os cortes de 10%, 25% e 90% não têm fonte agronômica: pendentes de revisão.",
            f"Plant stress: MODIS NDVI (MOD13Q1, 16 days) of the latest image compared with earlier years in the same "
            f"period of the year, image of {estresse['data_foto']}, 250 m pixel {estresse['distancia_pixel_km']:g} km "
            "from the point. An NDVI drop can be water stress, pests, diseases or lack of nutrients, but also harvest or "
            f"senescence, which are not a problem: read it together with the field and the weather ({estresse['fonte_referencia']}, "
            "which is also the source of the bands and the 0.20 threshold). The 10%, 25% and 90% cutoffs have no agronomic source: pending review."))
    else:
        limitacoes.append(t(
            "Estresse vegetal sem dado: ainda não há série de NDVI do MODIS guardada para esta região.",
            "Plant stress without data: there is no stored MODIS NDVI series for this region yet."))
    if precipitacao_extrema:
        limitacoes.append(t(
            f"Precipitação extrema: {precipitacao_extrema['metodo']}. Grade regional da NASA POWER, "
            "não é medição de pluviômetro no talhão; limiar estatístico, não um alerta oficial.",
            "Extreme rain: 95th percentile of daily rain for the month (NASA POWER). Regional NASA POWER grid, "
            "not a rain gauge in the field; a statistical threshold, not an official alert."))
    else:
        limitacoes.append(t("Precipitação extrema sem dado: a série diária de chuva não respondeu.",
                            "Extreme rain without data: the daily rain series did not respond."))
    if entrada.correcoes.textura_solo:
        pass  # o produtor corrigiu; não há limitação a registrar sobre a fonte.
    elif textura_calculada:
        limitacoes.append(t(
            f"Textura do solo: classificação simplificada em 3 faixas a partir de areia/argila "
            f"da camada superficial ({solo['fonte']}); não é o triângulo textural completo e "
            "está pendente de revisão agronômica.",
            f"Soil texture: simplified 3-band classification from topsoil sand/clay ({solo['fonte']}); "
            "it is not the full texture triangle and is pending agronomic review."))
        if solo.get("componentes_considerados", 1) > 1:
            limitacoes.append(t(
                "A unidade de solo tem múltiplos componentes principais, todos na mesma "
                "classe simplificada exibida. Não foi escolhido um componente nem feita "
                "média dos percentuais; o mapa não identifica qual componente há no talhão.",
                "The soil map unit has several major components, all in the same simplified class shown. "
                "No single component was chosen and the percentages were not averaged; the map does not "
                "identify which component is in the field."))
    else:
        limitacoes.append(t(
            "Textura do solo sem dado: fonte indisponível, unidade de mapeamento ambígua, ou "
            "ponto fora da cobertura do USDA Soil Data Access e do SoilGrids.",
            "Soil texture without data: source unavailable, ambiguous map unit, or point outside the "
            "coverage of USDA Soil Data Access and SoilGrids."))
    if declividade:
        limitacoes.append(t(
            f"Terreno: declividade calculada a partir de 5 pontos de elevação ({declividade['fonte']}) "
            "ao redor da coordenada, não um levantamento topográfico do talhão.",
            f"Terrain: slope computed from 5 elevation points ({declividade['fonte']}) around the "
            "coordinate, not a topographic survey of the field."))
        if "SRTMGL1" in declividade["fonte"]:
            limitacoes.append(t(
                "SRTM é um modelo histórico de superfície da missão de 2000, com amostras "
                "de 1 segundo de arco. O cálculo usa interpolação local e não mede alterações recentes do terreno.",
                "SRTM is a historical surface model from the 2000 mission, sampled at 1 arc-second. "
                "The calculation uses local interpolation and does not capture recent changes to the terrain."))
        if declividade.get("uso_cache"):
            consulta = dt.datetime.fromtimestamp(declividade["consultado_em"], dt.UTC).isoformat()
            limitacoes.append(t(
                f"Terreno reutiliza elevação válida ({declividade['fonte']}) da mesma coordenada, consultada em {consulta}; "
                f"cache limitado a {configuracao()['cache_ttl_s']} segundos.",
                f"Terrain reuses a valid elevation ({declividade['fonte']}) for the same coordinate, queried at {consulta}; "
                f"cache limited to {configuracao()['cache_ttl_s']} seconds."))
    else:
        limitacoes.append(t(
            "Terreno sem dado: não foi possível obter as cinco elevações. USGS 3DEP cobre os EUA; "
            "para pontos brasileiros, é necessário preparar o raster SRTM local e conferir os pixels válidos.",
            "Terrain without data: the five elevations could not be obtained. USGS 3DEP covers the US; "
            "for points in Brazil, the local SRTM raster must be prepared and its valid pixels checked."))
    if risco_seca:
        limitacoes.append(t(
            f"Risco de seca: {risco_seca['metodo']}. Grade regional da NASA POWER, não substitui "
            "previsão meteorológica nem umidade do solo medida no talhão.",
            "Drought risk: rain in the last 90 days vs. the average for the same period of the year (NASA POWER). "
            "Regional NASA POWER grid; it does not replace a weather forecast or soil moisture measured in the field."))
    else:
        limitacoes.append(t("Risco de seca sem dado: a série diária de chuva não respondeu.",
                            "Drought risk without data: the daily rain series did not respond."))
    if estresse_termico:
        limitacoes.append(t(
            f"Estresse térmico: frequência de dias com máxima do ar a 2 m de ao menos "
            f"{estresse_termico['limiar_c']:g} °C ({estresse_termico['periodo_inicio']}–"
            f"{estresse_termico['periodo_fim']}, NASA POWER). Grade regional, não estação no "
            "talhão; limiar e cortes de nível ainda sem referência agronômica validada por cultura.",
            f"Heat stress: frequency of days with 2 m air maximum of at least "
            f"{estresse_termico['limiar_c']:g} °C ({estresse_termico['periodo_inicio']}–"
            f"{estresse_termico['periodo_fim']}, NASA POWER). Regional grid, not a station in the "
            "field; threshold and level cutoffs have no validated agronomic reference per crop yet."))
    else:
        limitacoes.append(t("Estresse térmico sem dado: a série de temperatura máxima não respondeu.",
                            "Heat stress without data: the maximum temperature series did not respond."))
    if entrada.origem_local == "municipio":
        if entrada.codigo_ibge:
            limitacoes.append(t("Localização aproximada por referência regional, sem precisão de talhão.",
                                "Approximate location from a regional reference, without field precision."))
        else:
            limitacoes.append(t("Coordenada informada manualmente (ou centro de uma cidade fora do Brasil escolhida na lista); a precisão do ponto não foi verificada no local.",
                                "Coordinate entered by hand (or the center of a town outside Brazil picked from the list); the precision of the point was not checked on site."))
    talhao_base = caracterizar_talhao(entrada)
    usa_textura_calculada = talhao_base.textura_solo is None and textura_calculada is not None
    usa_declividade_calculada = talhao_base.relevo is None and declividade is not None
    bases = []
    if geada:
        bases.append("NASA POWER")
    if usa_textura_calculada:
        bases.append(solo["fonte"])
    if usa_declividade_calculada:
        bases.append(declividade["fonte"])
    if estresse:
        bases.append("MODIS")

    if catalogo_real:
        municipio = buscar_por_codigo(entrada.codigo_ibge) if entrada.codigo_ibge else None
        nome_municipio = municipio["municipio"] if municipio else t("sua região", "your region")
        recursos = {
            "maquinas_graos": entrada.recursos_disponiveis.maquinas_graos,
            "comprador_graos": entrada.recursos_disponiveis.comprador_graos,
            "irrigacao": entrada.recursos_disponiveis.irrigacao,
        }
        estrategias, limitacoes_catalogo = montar_estrategias_reais(
            entrada.prioridades, recursos, entrada.codigo_ibge, nome_municipio, idioma
        )
        limitacoes.extend(limitacoes_catalogo)
    else:
        estrategias = gerar_cenarios(entrada, clima["clima_mensal"]) if beta else []

    local_identificado = buscar_por_codigo(entrada.codigo_ibge) if entrada.codigo_ibge else None
    descricao_local = (
        f"{local_identificado['municipio']} ({local_identificado['uf']})"
        if local_identificado
        else texto(entrada.idioma, "Coordenada", "Coordinate") + f" {entrada.latitude:.4f}, {entrada.longitude:.4f}"
    )
    resultado = Analise(
        analise_id=str(uuid4()),
        eh_mock=beta and not catalogo_real,
        descricao_local=descricao_local,
        talhao=talhao_base.model_copy(
            update={
                "risco_geada": geada["nivel"] if geada else None,
                "risco_seca": risco_seca["nivel"] if risco_seca else talhao_base.risco_seca,
                "textura_solo": textura_calculada if usa_textura_calculada else talhao_base.textura_solo,
                "relevo": declividade["relevo"] if usa_declividade_calculada else talhao_base.relevo,
                "fonte_relevo": "mapas" if usa_declividade_calculada else talhao_base.fonte_relevo,
                "declividade_pct": declividade["declividade_pct"] if usa_declividade_calculada else talhao_base.declividade_pct,
                "bases": bases,
            }
        ),
        fonte_clima=clima["fonte_clima"],
        clima_mensal=clima["clima_mensal"],
        geada=geada,
        precipitacao_extrema=precipitacao_extrema,
        tendencia_hidrica=tendencia,
        estresse_vegetal=estresse,
        risco_seca=risco_seca,
        estresse_termico=estresse_termico,
        estrategias=estrategias,
        limitacoes=limitacoes,
        versao_motor=VERSAO,
        criada_em_utc=dt.datetime.now(dt.UTC).isoformat(),
        fontes_indisponiveis=coleta["fontes_indisponiveis"],
        estado_recomendacoes=(
            "catalogo_real" if catalogo_real else "simulacao_beta" if beta else "dados_insuficientes"
        ),
    )
    coleta["clima_historico"] = clima
    repositorio.salvar(entrada.model_dump(mode="json"), resultado.model_dump(mode="json"), coleta)
    return resultado
