"""Rotas de /api/v1/analises. Ver /openapi.json ou /docs."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.repositories.banco import RepositorioAnalises
from app.schemas.analises import Analise, AnaliseEntrada, RespostaAnalise
from app.services.analises import criar_analise
from app.services.coleta_variaveis import coletar_variaveis

roteador = APIRouter(tags=["analises"])


@roteador.get("/analises", response_model=RespostaAnalise)
def obter_analise(
    latitude: float = Query(ge=-90, le=90, allow_inf_nan=False),
    longitude: float = Query(ge=-180, le=180, allow_inf_nan=False),
):
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=422,
            detail={
                "erro": {
                    "codigo": "coordenada_invalida",
                    "mensagem": "latitude deve estar entre -90 e 90, longitude entre -180 e 180.",
                    "detalhes": [],
                    "requisicao_id": None,
                }
            },
        )

    resultado = coletar_variaveis(latitude, longitude)
    return resultado


@roteador.post("/analises", response_model=Analise, status_code=201)
def analisar(entrada: AnaliseEntrada):
    # Sem gate de local, código IBGE ou cultura: qualquer coordenada válida é
    # aceita. Cada fonte decide por si se tem cobertura ali -- quando não tem,
    # o campo correspondente vem None/vazio e entra em `fontes_indisponiveis`
    # com o motivo, nunca um 422 bloqueando a análise inteira.
    return criar_analise(entrada)


@roteador.get("/analises/{analise_id}", response_model=Analise)
def recuperar(analise_id: UUID):
    resultado = RepositorioAnalises().buscar(analise_id)
    if resultado is None:
        raise HTTPException(
            404,
            {
                "erro": {
                    "codigo": "analise_nao_encontrada",
                    "mensagem": "Não encontramos esta análise.",
                    "detalhes": [],
                    "requisicao_id": None,
                }
            },
        )
    return resultado
