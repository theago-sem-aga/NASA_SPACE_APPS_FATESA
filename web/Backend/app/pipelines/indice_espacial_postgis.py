"""Indice espacial real, via PostGIS (substitui o manifesto em arquivo
de indice_espacial.py para quem ja tem o Postgres configurado).

Le a conexao de DATABASE_URL (ver web/.env.example). Mesmo contrato de
dados do protótipo em arquivo: fonte, celula, bounding box e caminho
do Parquet -- só a consulta muda para ``ST_Contains`` em vez de filtro
em arquivo.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from indice_espacial import (
    RAIZ_DADOS_PROCESSADOS,
    TAMANHO_CELULA_GRAUS,
    caminho_parquet_da_celula,
    celula_id,
    limites_da_celula,
    registrar_celula,
)

# Carrega web/.env mesmo quando o script roda isolado (fora do app FastAPI,
# ex.: chamado direto pelo iniciar_backend.ps1 antes do uvicorn subir).
load_dotenv(Path(__file__).resolve().parents[4] / "web" / ".env")


def _conexao():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL não configurada")
    return psycopg2.connect(url, connect_timeout=5)


def registrar_celula_pg(fonte: str, latitude: float, longitude: float) -> dict:
    celula = celula_id(latitude, longitude)
    limites = limites_da_celula(latitude, longitude)
    caminho_rel = str(caminho_parquet_da_celula(fonte, celula).relative_to(RAIZ_DADOS_PROCESSADOS.parent))

    wkt_poligono = (
        f"POLYGON(({limites['lon_min']} {limites['lat_min']}, "
        f"{limites['lon_max']} {limites['lat_min']}, "
        f"{limites['lon_max']} {limites['lat_max']}, "
        f"{limites['lon_min']} {limites['lat_max']}, "
        f"{limites['lon_min']} {limites['lat_min']}))"
    )

    with _conexao() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO indice_espacial (fonte, celula_id, geom, caminho_parquet)
            VALUES (%s, %s, ST_GeomFromText(%s, 4326), %s)
            ON CONFLICT (fonte, celula_id)
            DO UPDATE SET geom = EXCLUDED.geom, caminho_parquet = EXCLUDED.caminho_parquet
            """,
            (fonte, celula, wkt_poligono, caminho_rel),
        )
        conn.commit()

    return {"fonte": fonte, "celula_id": celula, "caminho_parquet": caminho_rel, **limites}


def buscar_por_coordenada_pg(fonte: str, latitude: float, longitude: float) -> dict | None:
    with _conexao() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT celula_id, caminho_parquet
            FROM indice_espacial
            WHERE fonte = %s AND ST_Intersects(geom, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            ORDER BY celula_id LIMIT 1
            """,
            (fonte, longitude, latitude),
        )
        linha = cur.fetchone()

    if linha is None:
        return None

    celula, caminho_rel = linha
    import pandas as pd

    caminho = RAIZ_DADOS_PROCESSADOS.parent / caminho_rel
    if not caminho.exists():
        return None

    dados = pd.read_parquet(caminho)
    return {
        "fonte": fonte,
        "tipo_acesso": "pre_processado",
        "celula_id": celula,
        "latitude": latitude,
        "longitude": longitude,
        "serie": dados.to_dict(orient="records"),
    }


def incorporar_recortes_srtm():
    """Preserva no manifesto os recortes locais que ainda não estão no bucket.

    O startup pode baixar um manifesto GCS mais antigo. Os Parquets de relevo
    versionados no Git continuam em disco e precisam continuar indexados.
    """
    import pyarrow.parquet as pq
    for caminho in sorted((RAIZ_DADOS_PROCESSADOS / "srtm_relevo").glob("*.parquet")):
        if not re.fullmatch(r"-?\d+_-?\d+", caminho.stem):
            continue
        metadados = pq.read_metadata(caminho).metadata or {}
        produto = json.loads(metadados.get(b"fatesa_srtm", b"{}"))
        if produto.get("produto") != "SRTMGL1.003":
            raise ValueError("Recorte SRTM sem proveniência reconhecida")
        lat_idx, lon_idx = map(int, caminho.stem.split("_"))
        registrar_celula("srtm_relevo", (lat_idx + 0.5) * TAMANHO_CELULA_GRAUS,
                         (lon_idx + 0.5) * TAMANHO_CELULA_GRAUS)


if __name__ == "__main__":
    import pandas as pd

    incorporar_recortes_srtm()
    caminho_manifesto = RAIZ_DADOS_PROCESSADOS / "indice_espacial.parquet"
    if not caminho_manifesto.exists():
        print("indice_espacial.parquet nao existe ainda -- nenhuma celula pre-indexada pra migrar.")
    else:
        manifesto = pd.read_parquet(caminho_manifesto)
        for _, linha in manifesto.iterrows():
            centro_lat = (linha["lat_min"] + linha["lat_max"]) / 2
            centro_lon = (linha["lon_min"] + linha["lon_max"]) / 2
            registrar_celula_pg(linha["fonte"], centro_lat, centro_lon)
        print(f"indice espacial no PostGIS atualizado: {len(manifesto)} celulas (todas as fontes).")
