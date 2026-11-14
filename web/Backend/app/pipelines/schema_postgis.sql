-- Esquema do indice espacial real (PostGIS), conforme contrato
-- em docs/convencao_programacao.md ("Estrategia de acesso aos dados").
-- Substitui o manifesto em arquivo (data/processed/indice_espacial.parquet)
-- do protótipo -- mesma informacao, consulta por ST_Contains em vez de
-- filtro em arquivo.

CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

CREATE TABLE IF NOT EXISTS indice_espacial (
    id SERIAL PRIMARY KEY,
    fonte TEXT NOT NULL,
    celula_id TEXT NOT NULL,
    geom geometry(Polygon, 4326) NOT NULL,
    caminho_parquet TEXT NOT NULL,
    UNIQUE (fonte, celula_id)
);

CREATE INDEX IF NOT EXISTS idx_indice_espacial_geom
    ON indice_espacial USING GIST (geom);
