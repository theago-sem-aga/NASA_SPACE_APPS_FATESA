"""Referência real das cidades e condados dos EUA (nome, estado, centro), para
GET /municipios achar "Fresno, CA" pelo nome e GET /locais dar nome a um ponto
de GPS nos EUA -- o equivalente de ingestao_municipios_brasil.py (IBGE).

Fonte: U.S. Census Bureau, Gazetteer Files 2025 (oficial, público, sem chave):
  - places: cidades, vilas e CDPs (lugares recenseados), ~32 mil;
  - counties: condados, ~3,2 mil.
https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
Cada linha traz o ponto interno oficial (INTPTLAT/INTPTLONG), que usamos como
centro -- precisão de quilômetros, como o centroide dos municípios do Brasil.

O NAME do Census vem com o tipo no fim ("Fresno city", "Abanda CDP"); tiramos
só esse sufixo para mostrar. Condados ficam com "County"/"Parish" no nome, para
não confundir com a cidade de mesmo nome.

Saída: data/processed/census_lugares/lugares_eua.parquet
       colunas: geoid, nome, uf, tipo ('cidade' | 'condado'), latitude, longitude
Cópia bruta: data/raw/census_gazetteer/2025_Gaz_<places|counties>_national.zip
Uso:   python ingestao_lugares_eua.py
"""

from __future__ import annotations

import io
import re
import sys
import zipfile
from pathlib import Path

import pandas as pd
import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))  # indice_espacial (import solto)
from indice_espacial import RAIZ_DADOS_PROCESSADOS  # noqa: E402

ANO = 2025
URL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/{ano}_Gazetteer/{ano}_Gaz_{tipo}_national.zip"
PASTA_BRUTA = RAIZ_DADOS_PROCESSADOS.parent / "raw" / "census_gazetteer"
SAIDA = RAIZ_DADOS_PROCESSADOS / "census_lugares" / "lugares_eua.parquet"

# Sufixo de tipo do Census no fim do nome: palavras em minúsculas (city, town,
# village, borough, municipality, "metropolitan government (balance)"...) ou "CDP".
SUFIXO_TIPO = re.compile(r"(?:\s+(?:\(balance\)|CDP|[a-z][a-z()/.-]*))+$")


def _baixar(tipo: str) -> pd.DataFrame:
    url = URL.format(ano=ANO, tipo=tipo)
    resposta = requests.get(url, timeout=120)
    resposta.raise_for_status()
    PASTA_BRUTA.mkdir(parents=True, exist_ok=True)
    (PASTA_BRUTA / f"{ANO}_Gaz_{tipo}_national.zip").write_bytes(resposta.content)
    with zipfile.ZipFile(io.BytesIO(resposta.content)) as z:
        texto = z.read(z.namelist()[0]).decode("utf-8")
    df = pd.read_csv(io.StringIO(texto), sep="|", dtype=str)
    df.columns = [c.strip() for c in df.columns]
    return df


def limpar_nome(nome: str) -> str:
    """'Fresno city' -> 'Fresno'; 'Abanda CDP' -> 'Abanda'. Nunca devolve vazio."""
    limpo = SUFIXO_TIPO.sub("", nome.strip())
    return limpo or nome.strip()


def montar(places: pd.DataFrame, counties: pd.DataFrame) -> pd.DataFrame:
    cidades = pd.DataFrame({
        "geoid": places["GEOID"],
        "nome": places["NAME"].map(limpar_nome),
        "uf": places["USPS"],
        "tipo": "cidade",
        "latitude": places["INTPTLAT"].astype(float),
        "longitude": places["INTPTLONG"].astype(float),
    })
    condados = pd.DataFrame({
        "geoid": counties["GEOID"],
        "nome": counties["NAME"].str.strip(),
        "uf": counties["USPS"],
        "tipo": "condado",
        "latitude": counties["INTPTLAT"].astype(float),
        "longitude": counties["INTPTLONG"].astype(float),
    })
    return pd.concat([cidades, condados], ignore_index=True)


def ingerir() -> Path:
    df = montar(_baixar("place"), _baixar("counties"))
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(SAIDA, index=False)
    print(f"cidades={int((df['tipo'] == 'cidade').sum())} condados={int((df['tipo'] == 'condado').sum())} -> {SAIDA}")
    return SAIDA


if __name__ == "__main__":
    ingerir()
