"""Ponto de entrada da API (FastAPI).

Primeiro endpoint real do backend -- ver decisao datada em
docs/convencao_programacao.md, secao 10. Consome os clientes de API
ao vivo (app/integrations/) e o indice espacial pre-processado
(app/pipelines/), sem reimplementar nenhuma logica deles.
"""

from __future__ import annotations

import sys
from pathlib import Path

_RAIZ_APP = Path(__file__).resolve().parent
for _caminho in (_RAIZ_APP, _RAIZ_APP / "integrations", _RAIZ_APP / "pipelines"):
    _caminho_str = str(_caminho)
    if _caminho_str not in sys.path:
        sys.path.insert(0, _caminho_str)

from dotenv import load_dotenv

load_dotenv(_RAIZ_APP.parents[1] / ".env")  # web/.env -- chaves de API, nunca no Git

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.v1.analises import roteador as roteador_analises

app = FastAPI(
    title="Field Shift API",
    version="0.1.0",
    description="Decisao de rotacao de culturas apoiada em dados da NASA e do USDA.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(roteador_analises, prefix="/api/v1")


@app.exception_handler(HTTPException)
def tratar_http_exception(_request, exc: HTTPException):
    corpo = exc.detail if isinstance(exc.detail, dict) and "erro" in exc.detail else {
        "erro": {"codigo": "erro_inesperado", "mensagem": str(exc.detail), "detalhes": [], "requisicao_id": None}
    }
    return JSONResponse(status_code=exc.status_code, content=corpo)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
