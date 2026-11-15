"""Rota de /api/v1/producao -- painel "Sua colheita". Ver /openapi.json ou /docs.

Aceita codigo_ibge (Brasil, IBGE PAM) OU latitude+longitude (qualquer
coordenada dos EUA, Census Geocoder + USDA NASS QuickStats). Nunca os dois
nem nenhum dos dois.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.modelos import painel_producao, painel_producao_eua
from app.schemas.analises import PainelProducao, PrevisaoClima

roteador = APIRouter(tags=["producao"])


@roteador.get("/previsao", response_model=PrevisaoClima | None)
def previsao(codigo_ibge: str = Query(pattern=r"^\d{7}$")):
    """Consulta o boletim oficial disponível no backend para o município.

    Não usa o arquivo mock do frontend nem inventa previsão onde não há boletim.
    O campo publicado_em permite conferir a data da transcrição.
    """
    return painel_producao.previsao_do_municipio(codigo_ibge)


def _erro(status: int, codigo: str, mensagem: str):
    raise HTTPException(status, {"erro": {"codigo": codigo, "mensagem": mensagem, "detalhes": [], "requisicao_id": None}})


@roteador.get("/producao", response_model=PainelProducao)
def producao(
    codigo_ibge: str | None = Query(default=None, pattern=r"^\d{7}$"),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
):
    if codigo_ibge and (latitude is not None or longitude is not None):
        _erro(422, "parametros_incompativeis", "Use codigo_ibge OU latitude+longitude, não os dois.")
    if codigo_ibge:
        try:
            return painel_producao.montar_painel(codigo_ibge)
        except LookupError:
            _erro(404, "dados_insuficientes", "Ainda não temos os números da colheita dessa cidade.")
    if latitude is not None and longitude is not None:
        resultado = painel_producao_eua.montar_painel(latitude, longitude)
        if resultado is None:
            _erro(404, "dados_insuficientes", "Ainda não temos os números da colheita fora do Brasil ou dos EUA.")
        return resultado
    _erro(422, "parametros_incompativeis", "Informe codigo_ibge, ou latitude e longitude.")
