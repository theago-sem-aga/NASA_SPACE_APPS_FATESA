"""Orquestração: coleta, clima, domínio e persistência."""

import datetime as dt
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import requests

from app.configuracao import configuracao
from app.domain.motor import VERSAO, caracterizar_talhao, gerar_cenarios
from app.integrations.clima_historico import buscar_clima
from app.repositories.banco import RepositorioAnalises
from app.schemas.analises import Analise
from app.services.coleta_variaveis import coletar_variaveis


def dentro_piloto(lat, lon):
    return 36.4 <= lat < 36.8 and -119.9 <= lon < -119.5


def criar_analise(entrada):
    repositorio = RepositorioAnalises()
    repositorio.verificar()  # falhar antes de gastar chamadas externas se não persistirá
    with ThreadPoolExecutor(max_workers=2) as executor:
        coleta_pendente = executor.submit(
            coletar_variaveis, entrada.latitude, entrada.longitude, True
        )
        clima_pendente = executor.submit(buscar_clima, entrada.latitude, entrada.longitude)
        coleta = coleta_pendente.result()
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
    if entrada.origem_local == "municipio":
        limitacoes.append("Localização aproximada por referência regional, sem precisão de talhão.")
    resultado = Analise(
        analise_id=str(uuid4()),
        eh_mock=beta,
        descricao_local="Região piloto de Fresno (CA)",
        talhao=caracterizar_talhao(entrada),
        fonte_clima=clima["fonte_clima"],
        clima_mensal=clima["clima_mensal"],
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
