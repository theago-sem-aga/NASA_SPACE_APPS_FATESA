"""Ingestao do MapBiomas Colecao 10.1 -- cobertura e uso da terra por municipio.

Fonte (Dataverse do MapBiomas, CC BY 4.0):
  doi:10.58053/MapBiomas/SJZOLT -- "Coverage statistics by biomes,
  states and municipalities - MapBiomas Brasil Collection 10.1"

Area (ha) de cada classe de uso (soja, cana, pastagem, mosaico de usos,
floresta...) por ano, 1985-2024. E a estatistica municipal, nao o raster
de 30 m: mostra a trajetoria de uso do municipio, nao de um talhao.
O raster por pixel exige Google Earth Engine (o bucket publico de GeoTIFF
nacional respondeu 403 em 2026-11-14).

Saida: data/processed/mapbiomas/municipio_<geocodigo>.parquet
Uso:   REGIAO_PILOTO=sjrp python ingestao_mapbiomas.py
       (baixa o xlsx de ~79 MB para data/raw/mapbiomas/ se nao existir)
"""

from __future__ import annotations

import datetime as dt

import openpyxl
import pandas as pd
import requests

from indice_espacial import RAIZ_DADOS_PROCESSADOS
from regioes import caminho_parquet_municipal, regiao_atual

FONTE = "mapbiomas"
DOI = "doi:10.58053/MapBiomas/SJZOLT"
DATAVERSE = "https://data.mapbiomas.org/api"
PASTA_BRUTA = RAIZ_DADOS_PROCESSADOS.parent / "raw" / "mapbiomas"
ABA = "COVERAGE_10.1"


def baixar_se_preciso():
    versao = requests.get(f"{DATAVERSE}/datasets/:persistentId/", params={"persistentId": DOI}, timeout=120)
    versao.raise_for_status()
    arquivo = versao.json()["data"]["latestVersion"]["files"][0]["dataFile"]
    caminho = PASTA_BRUTA / arquivo["filename"]
    if not caminho.exists():
        PASTA_BRUTA.mkdir(parents=True, exist_ok=True)
        print(f"baixando {arquivo['filename']} ({arquivo.get('filesize', 0) // 1_000_000} MB)")
        with requests.get(f"{DATAVERSE}/access/datafile/{arquivo['id']}", stream=True, timeout=900) as r:
            r.raise_for_status()
            with open(caminho, "wb") as f:
                for bloco in r.iter_content(1 << 20):
                    f.write(bloco)
    return caminho


def ingerir() -> int:
    regiao = regiao_atual()
    geocodigo = regiao["geocodigo_ibge"]
    if not geocodigo:
        raise SystemExit(f"MapBiomas Brasil so cobre o Brasil; regiao atual: {regiao['chave']}")

    planilha = openpyxl.load_workbook(baixar_se_preciso(), read_only=True)[ABA]
    linhas = planilha.iter_rows(values_only=True)
    cabecalho = next(linhas)
    # A planilha nao traz geocodigo: casa por UF + nome do municipio.
    i_uf, i_mun = cabecalho.index("state_acronym"), cabecalho.index("municipality")
    do_municipio = [r for r in linhas if r[i_uf] == regiao["uf"] and r[i_mun] == regiao["nome_municipio"]]
    if not do_municipio:
        raise SystemExit(f"municipio {regiao['nome_municipio']}/{regiao['uf']} nao encontrado na aba {ABA}")

    largo = pd.DataFrame(do_municipio, columns=cabecalho)
    anos = [c for c in cabecalho if isinstance(c, int)]
    longo = largo.melt(
        id_vars=["biome", "class_id", "class_level_1", "class_level_2", "class_level_3", "class_level_4"],
        value_vars=anos, var_name="ano", value_name="area_ha",
    ).rename(columns={
        "biome": "bioma", "class_id": "classe_id", "class_level_1": "classe_nivel_1",
        "class_level_2": "classe_nivel_2", "class_level_3": "classe_nivel_3", "class_level_4": "classe_nivel_4",
    })
    # Municipio em dois biomas aparece em duas linhas por classe: soma.
    longo = (longo.groupby(["ano", "classe_id", "classe_nivel_1", "classe_nivel_2", "classe_nivel_3", "classe_nivel_4"],
                           as_index=False)["area_ha"].sum(min_count=1))
    longo["ano"] = longo["ano"].astype(int)
    longo["geocodigo_ibge"] = geocodigo
    longo["fonte"] = FONTE
    longo["colecao"] = "10.1"
    longo["data_coleta_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()

    caminho = caminho_parquet_municipal(FONTE, geocodigo)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    longo.to_parquet(caminho, index=False)
    print(f"fonte={FONTE} municipio={geocodigo} linhas={len(longo)} anos={min(anos)}-{max(anos)} -> {caminho}")
    return len(longo)


if __name__ == "__main__":
    ingerir()
