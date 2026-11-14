"""Indice espacial real, via PostGIS (substitui o manifesto em arquivo
de indice_espacial.py para quem ja tem o Postgres configurado).

Le a conexao de DATABASE_URL (ver web/.env.example). Mesmo contrato de
dados do protótipo em arquivo: fonte, celula, bounding box e caminho
do Parquet -- só a consulta muda para ``ST_Contains`` em vez de filtro
em arquivo.
"""

from __future__ import annotations

import os

import psycopg2

from indice_espacial import (
    RAIZ_DADOS_PROCESSADOS,
    TAMANHO_CELULA_GRAUS,
    caminho_parquet_da_celula,
    celula_id,
    limites_da_celula,
)


def _conexao():
    url = os.environ.get("DATABASE_URL", "postgresql://postgres:Fatesa2026Dev@localhost:5432/fatesa")
    return psycopg2.connect(url)


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
            LIMIT 1
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


if __name__ == "__main__":
    import pandas as pd

    manifesto = pd.read_parquet(RAIZ_DADOS_PROCESSADOS / "indice_espacial.parquet")
    for _, linha in manifesto.iterrows():
        centro_lat = (linha["lat_min"] + linha["lat_max"]) / 2
        centro_lon = (linha["lon_min"] + linha["lon_max"]) / 2
        registrar_celula_pg(linha["fonte"], centro_lat, centro_lon)
    print(f"migradas {len(manifesto)} celulas do manifesto em arquivo para o PostGIS")

    print(buscar_por_coordenada_pg("gpm", 36.6, -119.7))
