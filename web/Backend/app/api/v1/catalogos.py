"""Catálogos do piloto. Não promete cobertura administrativa ou brasileira."""

import unicodedata

from fastapi import APIRouter, HTTPException, Query

from app.configuracao import configuracao
from app.schemas.analises import Cultura, Local
from app.services.analises import dentro_piloto

roteador = APIRouter(tags=["catalogos"])
PILOTO = Local(
    codigo_ibge="", municipio="Região piloto de Fresno", uf="CA", latitude=36.6, longitude=-119.7
)


@roteador.get("/culturas", response_model=list[Cultura])
def culturas():
    return [
        Cultura(
            cultura_id=c, nome=n, tem_demonstracao=c == "milho" and configuracao()["cenarios_beta"]
        )
        for c, n in [
            ("milho", "Milho (cenário beta)"),
            ("cana_de_acucar", "Cana-de-açúcar"),
            ("soja", "Soja"),
            ("trigo", "Trigo"),
            ("pastagem", "Pasto"),
        ]
    ]


@roteador.get("/locais", response_model=Local)
def local(
    latitude: float = Query(ge=-90, le=90, allow_inf_nan=False),
    longitude: float = Query(ge=-180, le=180, allow_inf_nan=False),
):
    if not dentro_piloto(latitude, longitude):
        raise HTTPException(
            404,
            {
                "erro": {
                    "codigo": "fora_da_cobertura",
                    "mensagem": "Local fora do recorte piloto de Fresno, Califórnia.",
                    "detalhes": [],
                    "requisicao_id": None,
                }
            },
        )
    return PILOTO.model_copy(update={"latitude": latitude, "longitude": longitude})


@roteador.get("/municipios", response_model=list[Local])
def municipios(
    busca: str = Query(default="", max_length=120), limite: int = Query(default=8, ge=1, le=20)
):
    termo = "".join(
        c
        for c in unicodedata.normalize("NFD", busca.strip().lower())
        if not unicodedata.combining(c)
    )
    if len(termo) < 2:
        return []
    return [PILOTO][:limite] if termo in "regiao piloto fresno california ca estados unidos" else []
