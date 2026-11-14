"""Rotas de /api/v1/analises. Ver docs/contrato_api.md."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from schemas.analises import RespostaAnalise
from services.coleta_variaveis import coletar_variaveis

roteador = APIRouter(tags=["analises"])


@roteador.get("/analises", response_model=RespostaAnalise)
def obter_analise(latitude: float, longitude: float):
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
