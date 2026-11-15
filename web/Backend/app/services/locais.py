"""Busca de municipio por nome e por coordenada, pra qualquer lugar do
Brasil -- nao so o recorte piloto.

Fonte: data/processed/ibge_municipios/municipios_brasil.parquet (gerado por
pipelines/ingestao_municipios_brasil.py, API oficial do IBGE). Guarda nome,
UF e CENTROIDE de cada municipio -- nao o poligono. Por isso a busca por
coordenada é aproximada (centroide mais próximo), do mesmo jeito que a
convenção de `origem_local='municipio'` já descreve: "precisão de dezenas
de km", não o limite exato do município.

EUA: data/processed/census_lugares/lugares_eua.parquet (gerado por
pipelines/ingestao_lugares_eua.py, Gazetteer oficial do Census Bureau):
cidades, CDPs e condados, com o ponto interno oficial como centro. Na busca,
voltam com codigo_ibge vazio e uf = sigla do estado (CA, TX...).

Fora das duas bases (ou sem o arquivo gerado): None/lista vazia, nunca inventa
um lugar.
"""

from __future__ import annotations

import unicodedata
from functools import lru_cache

import pandas as pd

from app.configuracao import RAIZ

CAMINHO = RAIZ / "data" / "processed" / "ibge_municipios" / "municipios_brasil.parquet"
CAMINHO_EUA = RAIZ / "data" / "processed" / "census_lugares" / "lugares_eua.parquet"

# Caixa aproximada dos EUA com Alasca e Havaí (não encosta na do Brasil).
EUA_LAT_MIN, EUA_LAT_MAX = 18.0, 72.0
EUA_LON_MIN, EUA_LON_MAX = -180.0, -65.0
# Ponto de GPS nos EUA: só dá nome se houver cidade/CDP a até ~30 km.
RAIO_EUA_GRAUS = 0.3

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


@lru_cache
def _tabela_eua() -> pd.DataFrame | None:
    if not CAMINHO_EUA.is_file():
        return None
    df = pd.read_parquet(CAMINHO_EUA)
    df["busca"] = df["nome"].map(_normalizar)
    return df


def buscar_por_nome(busca: str, limite: int = 8) -> list[dict]:
    """Brasil (IBGE) e EUA (Census) juntos; nome igual e quem começa com o texto vêm primeiro."""
    termo = _normalizar(busca)
    if len(termo) < 2:
        return []
    achados = []
    df = _tabela()
    if df is not None:
        br = df[df["busca"].str.contains(termo, regex=False)]
        achados.append(pd.DataFrame({
            "codigo_ibge": br["geocodigo_ibge"], "municipio": br["municipio"], "uf": br["uf"],
            "latitude": br["latitude"], "longitude": br["longitude"], "busca": br["busca"],
        }))
    eua = _tabela_eua()
    if eua is not None:
        us = eua[eua["busca"].str.contains(termo, regex=False)]
        achados.append(pd.DataFrame({
            "codigo_ibge": "", "municipio": us["nome"], "uf": us["uf"],
            "latitude": us["latitude"], "longitude": us["longitude"], "busca": us["busca"],
        }))
    if not achados:
        return []
    candidatos = pd.concat(achados, ignore_index=True)
    if candidatos.empty:
        return []
    candidatos["comeca_com"] = candidatos["busca"].str.startswith(termo)
    candidatos["igual"] = candidatos["busca"] == termo
    # Escrito igualzinho, com acento ("califórnia" -> Califórnia/PR antes de California/KY).
    candidatos["identico"] = candidatos["municipio"].str.lower() == busca.strip().lower()
    candidatos = candidatos.sort_values(
        ["identico", "igual", "comeca_com", "municipio", "uf"], ascending=[False, False, False, True, True]
    )
    colunas = ["codigo_ibge", "municipio", "uf", "latitude", "longitude"]
    return [
        {**r, "latitude": float(r["latitude"]), "longitude": float(r["longitude"])}
        for r in candidatos.head(limite)[colunas].to_dict("records")
    ]


def buscar_por_codigo(codigo_ibge: str) -> dict | None:
    df = _tabela()
    if df is None:
        return None
    linhas = df[df["geocodigo_ibge"] == codigo_ibge]
    if linhas.empty:
        return None
    linha = linhas.iloc[0]
    return {"municipio": linha["municipio"], "uf": linha["uf"], "latitude": float(linha["latitude"]), "longitude": float(linha["longitude"])}


def _localizar_eua(latitude: float, longitude: float) -> dict | None:
    """Cidade/CDP dos EUA mais perto do ponto (pelo centro), se houver a até RAIO_EUA_GRAUS."""
    df = _tabela_eua()
    if df is None:
        return None
    cidades = df[df["tipo"] == "cidade"]
    distancias = ((cidades["latitude"] - latitude) ** 2 + (cidades["longitude"] - longitude) ** 2) ** 0.5
    indice = distancias.idxmin()
    if distancias[indice] > RAIO_EUA_GRAUS:
        return None
    linha = cidades.loc[indice]
    return {"codigo_ibge": "", "municipio": linha["nome"], "uf": linha["uf"], "latitude": latitude, "longitude": longitude}


def localizar_por_coordenada(latitude: float, longitude: float) -> dict | None:
    if EUA_LAT_MIN <= latitude <= EUA_LAT_MAX and EUA_LON_MIN <= longitude <= EUA_LON_MAX:
        return _localizar_eua(latitude, longitude)
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
