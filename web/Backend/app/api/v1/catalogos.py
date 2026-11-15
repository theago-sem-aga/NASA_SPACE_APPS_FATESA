"""Catálogos. /locais e /municipios cobrem o Brasil (base real do IBGE);
fora do Brasil (ou sem reverse geocoding ainda, como os EUA), 404 honesto."""

from fastapi import APIRouter, HTTPException, Query

from app.configuracao import configuracao
from app.schemas.analises import Cultura, Local
from app.services.locais import buscar_por_nome, localizar_por_coordenada

roteador = APIRouter(tags=["catalogos"])


@roteador.get("/culturas", response_model=list[Cultura])
def culturas():
    # O motor de cenários (domain/motor.py) é genérico -- nunca teve lógica
    # específica de cultura -- então o selo de demonstração segue só o modo beta.
    beta = configuracao()["cenarios_beta"]
    return [
        Cultura(cultura_id=c, nome=n, tem_demonstracao=beta)
        for c, n in [
            ("milho", "Milho"),
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
    encontrado = localizar_por_coordenada(latitude, longitude)
    if encontrado is None:
        raise HTTPException(
            404,
            {
                "erro": {
                    "codigo": "fora_da_cobertura",
                    "mensagem": "Sem reconhecimento de município para esta coordenada ainda "
                    "(hoje só cobrimos o Brasil).",
                    "detalhes": [],
                    "requisicao_id": None,
                }
            },
        )
    return Local(**encontrado)


@roteador.get("/municipios", response_model=list[Local])
def municipios(
    busca: str = Query(default="", max_length=120), limite: int = Query(default=8, ge=1, le=20)
):
    return [Local(**m) for m in buscar_por_nome(busca, limite)]
