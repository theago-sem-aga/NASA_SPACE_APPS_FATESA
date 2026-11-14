"""Executar com: python -m uvicorn app.main:app (pasta web/Backend)."""

import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException

from app.api.v1.analises import roteador as analises
from app.api.v1.catalogos import roteador as catalogos
from app.configuracao import configuracao
from app.repositories.banco import RepositorioAnalises
from app.schemas.analises import ErroApi

logger = logging.getLogger("fatesa.api")
app = FastAPI(
    title="Field Shift API",
    version="0.2.0",
    description="Piloto Fresno. Cenários beta são explicitamente simulados.",
    responses={codigo: {"model": ErroApi} for codigo in (400, 404, 422, 500, 503)},
)


def erro(request, status, codigo, mensagem, detalhes=None):
    return JSONResponse(
        status_code=status,
        content={
            "erro": {
                "codigo": codigo,
                "mensagem": mensagem,
                "detalhes": detalhes or [],
                "requisicao_id": getattr(request.state, "requisicao_id", None),
            }
        },
    )


@app.middleware("http")
async def identificar_e_proteger(request: Request, call_next):
    request.state.requisicao_id = str(uuid4())
    inicio = time.monotonic()
    try:
        resposta = await call_next(request)
    except SQLAlchemyError:
        resposta = erro(
            request,
            503,
            "banco_indisponivel",
            "O armazenamento está indisponível. Tente novamente em instantes.",
        )
    except RuntimeError:
        resposta = erro(
            request,
            503,
            "configuracao_indisponivel",
            "O serviço ainda precisa de configuração. Avise a equipe.",
        )
    except Exception as exc:  # noqa: BLE001 - fronteira HTTP: sanitizar falhas inesperadas
        # Não registrar mensagem da exceção: pode conter DSN, chaves ou coordenadas.
        logger.error(
            "falha_interna tipo=%s requisicao_id=%s",
            type(exc).__name__,
            request.state.requisicao_id,
        )
        resposta = erro(
            request, 500, "erro_inesperado", "Não foi possível concluir agora. Tente novamente."
        )
    resposta.headers["X-Request-ID"] = request.state.requisicao_id
    logger.info(
        "requisicao metodo=%s status=%s duracao_ms=%s id=%s",
        request.method,
        resposta.status_code,
        round((time.monotonic() - inicio) * 1000),
        request.state.requisicao_id,
    )
    return resposta


app.add_middleware(
    CORSMiddleware,
    allow_origins=configuracao()["origens"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Request-ID"],
)


@app.exception_handler(HTTPException)
async def tratar_http(request, exc):
    if isinstance(exc.detail, dict) and "erro" in exc.detail:
        detalhe = exc.detail["erro"]
        return erro(
            request,
            exc.status_code,
            detalhe["codigo"],
            detalhe["mensagem"],
            detalhe.get("detalhes"),
        )
    return erro(
        request,
        exc.status_code,
        "recurso_nao_encontrado" if exc.status_code == 404 else "requisicao_invalida",
        "Recurso não encontrado." if exc.status_code == 404 else "Requisição inválida.",
    )


@app.exception_handler(RequestValidationError)
async def tratar_validacao(request, exc):
    itens = exc.errors()
    sintaxe = any(i["type"] == "json_invalid" for i in itens)
    detalhes = [{"campo": ".".join(str(c) for c in i["loc"]), "tipo": i["type"]} for i in itens]
    coordenada_get = request.method == "GET" and any(
        i["loc"][-1] in ("latitude", "longitude") for i in itens
    )
    codigo = (
        "json_invalido"
        if sintaxe
        else "coordenada_invalida"
        if coordenada_get
        else "entrada_invalida"
    )
    mensagem = (
        "Confira o formato do JSON."
        if sintaxe
        else "latitude deve estar entre -90 e 90, longitude entre -180 e 180."
        if coordenada_get
        else "Confira os campos informados."
    )
    return erro(request, 400 if sintaxe else 422, codigo, mensagem, detalhes)


app.include_router(analises, prefix="/api/v1")
app.include_router(catalogos, prefix="/api/v1")


@app.get("/api/v1/health", tags=["operacao"])
def health():
    return {"status": "ok"}


@app.get("/api/v1/prontidao", tags=["operacao"])
def prontidao():
    RepositorioAnalises().verificar()
    return {"status": "ok", "banco": "disponivel"}
