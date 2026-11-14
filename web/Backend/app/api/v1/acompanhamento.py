"""Rotas de /api/v1/acompanhamento: fotos do satelite do ponto do produtor.

Ver docs/contrato_api.md. A logica fica em pipelines/acompanhamento_sentinel2.py.

EXCECAO A CONVENCAO (secao 7, satelite so pre-processado): o ponto vem do GPS
do produtor e nao da para pre-processar todos os pontos possiveis. Por isso o
ponto e processado UMA vez, na primeira consulta (~20-60 s), e o resultado fica
em cache por CACHE_DIAS; as consultas seguintes nao tocam a rede. Precisa de
aprovacao da equipe (Ghabriel/Tiago) -- registrado em docs/historico_sumario.md.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import threading

import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

from acompanhamento_sentinel2 import acompanhar
from indice_espacial import RAIZ_DADOS_PROCESSADOS

roteador = APIRouter(tags=["acompanhamento"])

PASTA_CACHE = RAIZ_DADOS_PROCESSADOS / "sentinel2" / "cache"
PASTA_FOTOS = PASTA_CACHE / "fotos"
CACHE_DIAS = 3          # o satelite passa a cada ~5 dias
DIAS_BUSCA = 90
_NOME_FOTO = re.compile(r"^-?\d+\.\d{4}_-?\d+\.\d{4}_\d{4}-\d{2}-\d{2}\.png$")
_travas: dict[str, threading.Lock] = {}
_trava_geral = threading.Lock()


def _erro(status: int, codigo: str, mensagem: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"erro": {"codigo": codigo, "mensagem": mensagem,
                                                               "detalhes": [], "requisicao_id": None}})


def _chave(latitude: float, longitude: float) -> str:
    # 4 casas ~ 11 m: o mesmo talhao pedido de novo cai no mesmo cache.
    return f"{latitude:.4f}_{longitude:.4f}"


@roteador.get("/acompanhamento")
def obter_acompanhamento(latitude: float, longitude: float, request: Request):
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        raise _erro(422, "coordenada_invalida", "latitude deve estar entre -90 e 90, longitude entre -180 e 180.")

    chave = _chave(latitude, longitude)
    arquivo = PASTA_CACHE / f"{chave}.json"
    # Uma trava por ponto: dois pedidos iguais ao mesmo tempo nao processam duas vezes.
    with _trava_geral:
        trava = _travas.setdefault(chave, threading.Lock())
    with trava:
        if arquivo.exists():
            resultado = json.loads(arquivo.read_text(encoding="utf-8"))
            if dt.date.fromisoformat(resultado["gerado_em"]) >= dt.date.today() - dt.timedelta(days=CACHE_DIAS):
                return _com_urls(resultado, request)
        try:
            resultado = acompanhar(chave, round(latitude, 4), round(longitude, 4), DIAS_BUSCA,
                                   pasta_imagens=PASTA_FOTOS, prefixo_url="")
        except (requests.RequestException, OSError) as e:
            raise _erro(503, "satelite_indisponivel", "Não deu para buscar as fotos do satélite agora. Tente de novo daqui a pouco.") from e
        PASTA_CACHE.mkdir(parents=True, exist_ok=True)
        arquivo.write_text(json.dumps(resultado, ensure_ascii=False), encoding="utf-8")
    return _com_urls(resultado, request)


def _com_urls(resultado: dict, request: Request) -> dict:
    base = str(request.url_for("obter_foto", nome="X")).removesuffix("X")
    return {
        **{k: v for k, v in resultado.items() if k != "fotos"},
        "codigo_ibge": "",
        "ponto_exemplo": False,
        "fotos": [{k: v for k, v in f.items() if k != "cena_id"} | {"imagem": base + f["imagem"]} for f in resultado["fotos"]],
    }


@roteador.get("/acompanhamento/fotos/{nome}", name="obter_foto")
def obter_foto(nome: str):
    if not _NOME_FOTO.match(nome) or not (PASTA_FOTOS / nome).is_file():
        raise _erro(404, "foto_inexistente", "Foto não encontrada.")
    return FileResponse(PASTA_FOTOS / nome, media_type="image/png")
