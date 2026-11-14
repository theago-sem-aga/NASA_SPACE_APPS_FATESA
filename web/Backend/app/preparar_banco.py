"""Preparação idempotente do banco e migração do manifesto espacial existente.

Executar da pasta web/Backend: python -m app.preparar_banco
Não baixa datasets, não remove tabelas e não reprocessa os arquivos científicos.
"""

from pathlib import Path

import pandas as pd
import psycopg2
from alembic import command
from alembic.config import Config
from psycopg2 import sql
from psycopg2.extensions import make_dsn, parse_dsn
from sqlalchemy import text

from app.configuracao import RAIZ, configuracao
from app.repositories.banco import motor_banco


def preparar():
    url = configuracao()["database_url"]
    if not url:
        raise RuntimeError("Configure DATABASE_URL em web/.env")
    opcoes = parse_dsn(url)
    banco = opcoes.get("dbname", "fatesa")
    opcoes["dbname"] = "postgres"
    conexao = psycopg2.connect(make_dsn(**opcoes), connect_timeout=5)
    try:
        conexao.autocommit = True
        with conexao.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (banco,))
            if not cur.fetchone():
                cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(banco)))
    finally:
        conexao.close()
    motor = motor_banco()
    esquema = Path(__file__).parent / "pipelines" / "schema_postgis.sql"
    with motor.begin() as conexao:
        conexao.exec_driver_sql(esquema.read_text(encoding="utf-8"))
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    caminho = RAIZ / "data" / "processed" / "indice_espacial.parquet"
    total = 0
    if caminho.is_file():
        linhas = pd.read_parquet(caminho).to_dict(orient="records")
        with motor.begin() as conexao:
            for linha in linhas:
                relativo = str(linha["caminho_parquet"]).replace("\\", "/")
                arquivo = (RAIZ / "data" / relativo).resolve()
                if (
                    not arquivo.is_relative_to((RAIZ / "data" / "processed").resolve())
                    or not arquivo.is_file()
                ):
                    raise ValueError("Manifesto contém caminho inválido ou ausente")
                conexao.execute(
                    text("""
                    INSERT INTO indice_espacial(fonte,celula_id,geom,caminho_parquet)
                    VALUES(:fonte,:celula,ST_MakeEnvelope(:x0,:y0,:x1,:y1,4326),:caminho)
                    ON CONFLICT(fonte,celula_id) DO UPDATE SET
                        geom=EXCLUDED.geom,caminho_parquet=EXCLUDED.caminho_parquet
                """),
                    {
                        "fonte": linha["fonte"],
                        "celula": linha["celula_id"],
                        "x0": linha["lon_min"],
                        "x1": linha["lon_max"],
                        "y0": linha["lat_min"],
                        "y1": linha["lat_max"],
                        "caminho": relativo,
                    },
                )
                total += 1
    print(f"Banco preparado; {total} células registradas. Nenhum dataset foi alterado.")


if __name__ == "__main__":
    preparar()
