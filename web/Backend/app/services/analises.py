"""Orquestração: coleta, clima, domínio e persistência."""

import datetime as dt
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import requests

from app.configuracao import configuracao
from app.domain.motor import VERSAO, caracterizar_talhao, gerar_cenarios
from app.domain.solo import classificar_textura
from app.integrations.clima_historico import buscar_clima
from app.modelos.motor_decisao import montar_estrategias_reais
from app.repositories.banco import RepositorioAnalises
from app.schemas.analises import Analise
from app.services.coleta_variaveis import coletar_variaveis
from app.services.declividade import declividade_do_ponto
from app.services.geada import risco_geada
from app.services.locais import buscar_por_codigo
from app.services.precipitacao_extrema import resumo_precipitacao_extrema
from app.services.risco_seca import resumo_risco_seca
from app.services.tendencia_hidrica import tendencia_hidrica
from app.services.estresse_vegetal import estresse_vegetal
from app.services.solo import buscar_textura_ponto

# Cultura com catalogo real (ZARC), ligado ao backend (ver docs/requisitos-faltantes.md).
# Outras culturas ainda caem no motor beta generico, simulado.
CULTURAS_COM_CATALOGO_REAL = {"cana_de_acucar"}


def criar_analise(entrada):
    repositorio = RepositorioAnalises()
    repositorio.verificar()  # falhar antes de gastar chamadas externas se não persistirá
    with ThreadPoolExecutor(max_workers=9) as executor:
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
        except (requests.RequestException, ValueError, KeyError, OSError):
            solo = None
            coleta["fontes_indisponiveis"].append({"fonte": "textura_solo", "motivo": "falha_fonte"})
        try:
            declividade = declividade_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            declividade = None
            coleta["fontes_indisponiveis"].append({"fonte": "declividade_usgs_3dep", "motivo": "falha_fonte"})
        try:
            risco_seca = risco_seca_pendente.result()
        except (requests.RequestException, ValueError, KeyError, OSError):
            risco_seca = None
            coleta["fontes_indisponiveis"].append({"fonte": "nasa_power_risco_seca", "motivo": "falha_fonte"})
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
    textura_calculada = classificar_textura(solo["areia_pct"], solo["argila_pct"]) if solo else None

    catalogo_real = entrada.cultura_atual_id in CULTURAS_COM_CATALOGO_REAL
    beta = configuracao()["cenarios_beta"]
    limitacoes = [
        "Dados regionais (grade de satélite/clima) não substituem levantamento do talhão.",
        "Risco de erosão ainda não tem regra validada e fica sem dado.",
        "Umidade superficial do SMAP não foi transformada em um índice de água na zona das raízes.",
        "A cultura atual não informa calendário nem manejo: a referência exibida não comprova a prática atual do produtor.",
        "NASA POWER fornece dados históricos em grade; não é medição de estação instalada no talhão nem previsão meteorológica.",
    ]
    if catalogo_real:
        limitacoes.append(
            "Estratégias do catálogo real de reforma de canavial (ZARC + práticas curadas); níveis de atributo "
            "ainda pendentes de revisão por um agrônomo."
        )
    elif beta:
        limitacoes.append(
            "SIMULAÇÃO BETA: estratégias, níveis e calendário são hipóteses de teste. O clima, quando disponível, é real e tem período próprio."
        )
    else:
        limitacoes.append(
            "Estratégias não geradas: só existe catálogo real pra cana-de-açúcar; outras culturas exigem habilitar o modo beta (simulado) pra teste."
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
    if tendencia:
        limitacoes.append(
            f"Tendência da chuva: {tendencia['metodo']}, {tendencia['periodo_inicio']}–{tendencia['periodo_fim']}. "
            "NASA POWER é reanálise em grade, não pluviômetro: uma tendência forte deve ser conferida com estação "
            "meteorológica antes de decisão cara. Tendência do passado não garante o futuro."
        )
    else:
        limitacoes.append("Tendência da chuva sem dado: faltam anos completos na série de chuva.")
    if estresse:
        limitacoes.append(
            f"Estresse vegetal: {estresse['metodo']}, foto de {estresse['data_foto']}, pixel de 250 m "
            f"a {estresse['distancia_pixel_km']:g} km do ponto. NDVI baixo também é colheita, preparo do solo "
            "ou troca de cultura, não só estresse: quem conhece o talhão confirma. Os cortes (10%, 25%, 90%) e o "
            "limiar de 0,20 para \"sem planta\" foram escolhidos sem fonte agronômica: pendentes de revisão."
        )
    else:
        limitacoes.append(
            "Estresse vegetal sem dado: ainda não há série de NDVI do MODIS guardada para esta região."
        )
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
            f"Textura do solo: classificação simplificada em 3 faixas a partir de areia/argila "
            f"da camada superficial ({solo['fonte']}); não é o triângulo textural completo e "
            "está pendente de revisão agronômica."
        )
    else:
        limitacoes.append(
            "Textura do solo sem dado: fonte indisponível, unidade de mapeamento ambígua, ou "
            "ponto fora da cobertura do USDA Soil Data Access e do SoilGrids."
        )
    if declividade:
        limitacoes.append(
            "Terreno: declividade calculada a partir de 5 pontos de elevação (USGS 3DEP) ao redor "
            "da coordenada, não um levantamento topográfico do talhão; só cobre os EUA hoje."
        )
    else:
        limitacoes.append("Terreno sem dado: fonte de elevação indisponível ou ponto fora da cobertura do USGS 3DEP (fora dos EUA).")
    if risco_seca:
        limitacoes.append(
            f"Risco de seca: {risco_seca['metodo']}. Grade regional da NASA POWER, não substitui "
            "previsão meteorológica nem umidade do solo medida no talhão."
        )
    else:
        limitacoes.append("Risco de seca sem dado: a série diária de chuva não respondeu.")
    if entrada.origem_local == "municipio":
        limitacoes.append("Localização aproximada por referência regional, sem precisão de talhão.")
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

    if catalogo_real:
        municipio = buscar_por_codigo(entrada.codigo_ibge) if entrada.codigo_ibge else None
        nome_municipio = municipio["municipio"] if municipio else "sua região"
        recursos = {
            "maquinas_graos": entrada.recursos_disponiveis.maquinas_graos,
            "comprador_graos": entrada.recursos_disponiveis.comprador_graos,
            "irrigacao": entrada.recursos_disponiveis.irrigacao,
        }
        estrategias, limitacoes_catalogo = montar_estrategias_reais(
            entrada.prioridades, recursos, entrada.codigo_ibge, nome_municipio
        )
        limitacoes.extend(limitacoes_catalogo)
    else:
        estrategias = gerar_cenarios(entrada, clima["clima_mensal"]) if beta else []

    resultado = Analise(
        analise_id=str(uuid4()),
        eh_mock=beta and not catalogo_real,
        descricao_local=f"Coordenada {entrada.latitude:.4f}, {entrada.longitude:.4f}",
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
