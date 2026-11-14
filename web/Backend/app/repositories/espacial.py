"""Leitura segura do índice existente, isolada da ingestão."""

import hashlib
from pathlib import Path

import pandas as pd
from sqlalchemy import text

from app.configuracao import RAIZ
from app.repositories.banco import motor_banco


def buscar_celula(fonte, latitude, longitude):
    with motor_banco().connect() as conexao:
        linha = conexao.execute(
            text("""
            SELECT celula_id, caminho_parquet FROM indice_espacial
            WHERE fonte=:fonte AND ST_Intersects(geom, ST_SetSRID(ST_MakePoint(:lon,:lat),4326))
            ORDER BY celula_id LIMIT 1
        """),
            {"fonte": fonte, "lat": latitude, "lon": longitude},
        ).first()
    if not linha:
        return None
    raiz_dados = (RAIZ / "data").resolve()
    caminho = (raiz_dados / Path(linha.caminho_parquet.replace("\\", "/"))).resolve()
    if not caminho.is_relative_to((raiz_dados / "processed").resolve()):
        raise ValueError("Caminho fora de data/processed")
    if not caminho.is_file():
        raise FileNotFoundError("Parquet indexado não encontrado")
    return {
        "serie": pd.read_parquet(caminho).to_dict(orient="records"),
        "celula_id": linha.celula_id,
        "caminho_relativo": linha.caminho_parquet,
        "sha256": hashlib.sha256(caminho.read_bytes()).hexdigest(),
    }
