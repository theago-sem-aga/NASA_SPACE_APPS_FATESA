"""Busca de municipio por nome e por coordenada, pra qualquer lugar do
Brasil -- nao so o recorte piloto.

Fonte: data/processed/ibge_municipios/municipios_brasil.parquet (gerado por
pipelines/ingestao_municipios_brasil.py, API oficial do IBGE). Guarda nome,
UF e CENTROIDE de cada municipio -- nao o poligono. Por isso a busca por
coordenada é aproximada (centroide mais próximo), do mesmo jeito que a
convenção de `origem_local='municipio'` já descreve: "precisão de dezenas
de km", não o limite exato do município.

Fora do Brasil (ou sem o arquivo gerado): None/lista vazia, nunca inventa
um município. Município dos EUA não tem base equivalente ainda.
"""

from __future__ import annotations

import unicodedata
from functools import lru_cache

import pandas as pd

from app.configuracao import RAIZ

CAMINHO = RAIZ / "data" / "processed" / "ibge_municipios" / "municipios_brasil.parquet"

# Caixa aproximada do territorio brasileiro -- evita "achar" um municipio
# brasileiro pra um ponto nos EUA ou em outro continente.
BRASIL_LAT_MIN, BRASIL_LAT_MAX = -34.0, 6.0
BRASIL_LON_MIN, BRASIL_LON_MAX = -74.5, -28.0

# Acima disso, o centroide mais proximo provavelmente nao e o municipio
# certo (municipios grandes da Amazonia tem centroide longe da borda).
RAIO_MAXIMO_GRAUS = 3.0


def _normalizar(texto: str) -> str:
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFD", texto.lower()) if not unicodedata.combining(c)
    )
    return sem_acento.strip()


@lru_cache
def _tabela() -> pd.DataFrame | None:
    if not CAMINHO.is_file():
        return None
    df = pd.read_parquet(CAMINHO)
    df["busca"] = df["municipio"].map(_normalizar)
    return df


def buscar_por_nome(busca: str, limite: int = 8) -> list[dict]:
    df = _tabela()
    termo = _normalizar(busca)
    if df is None or len(termo) < 2:
        return []
    candidatos = df[df["busca"].str.contains(termo, regex=False)].copy()
    if candidatos.empty:
        return []
    candidatos["comeca_com"] = candidatos["busca"].str.startswith(termo)
    candidatos = candidatos.sort_values(["comeca_com", "municipio"], ascending=[False, True])
    registros = candidatos.head(limite)[["geocodigo_ibge", "municipio", "uf", "latitude", "longitude"]].to_dict("records")
    return [{"codigo_ibge": r.pop("geocodigo_ibge"), **r} for r in registros]


def buscar_por_codigo(codigo_ibge: str) -> dict | None:
    df = _tabela()
    if df is None:
        return None
    linhas = df[df["geocodigo_ibge"] == codigo_ibge]
    if linhas.empty:
        return None
    linha = linhas.iloc[0]
    return {"municipio": linha["municipio"], "uf": linha["uf"], "latitude": float(linha["latitude"]), "longitude": float(linha["longitude"])}


def localizar_por_coordenada(latitude: float, longitude: float) -> dict | None:
    if not (BRASIL_LAT_MIN <= latitude <= BRASIL_LAT_MAX and BRASIL_LON_MIN <= longitude <= BRASIL_LON_MAX):
        return None
    df = _tabela()
    if df is None:
        return None
    distancias = ((df["latitude"] - latitude) ** 2 + (df["longitude"] - longitude) ** 2) ** 0.5
    indice = distancias.idxmin()
    if distancias[indice] > RAIO_MAXIMO_GRAUS:
        return None
    linha = df.loc[indice]
    return {
        "codigo_ibge": linha["geocodigo_ibge"],
        "municipio": linha["municipio"],
        "uf": linha["uf"],
        "latitude": latitude,
        "longitude": longitude,
    }
