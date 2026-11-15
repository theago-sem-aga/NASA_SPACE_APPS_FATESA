"""Referencia real dos ~5.571 municipios do Brasil (nome, UF, centroide),
pra GET /locais e GET /municipios funcionarem em qualquer lugar do pais --
nao so no recorte piloto.

Fonte: API publica do IBGE (servicodados.ibge.gov.br), oficial, sem chave.
1 chamada pra nome/UF de todos os municipios + 27 chamadas (uma por UF) pra
geometria, da qual tiramos o centroide. Mesmo calculo de centroide que
pipelines/dataset_produtividade_sp.py ja usa pra SP.

Saida: data/processed/ibge_municipios/municipios_brasil.parquet
Uso:   python ingestao_municipios_brasil.py
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import requests

from indice_espacial import RAIZ_DADOS_PROCESSADOS

LOCALIDADES_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
MALHA_URL = "https://servicodados.ibge.gov.br/api/v3/malhas/estados/{uf}"
UFS = [
    "11", "12", "13", "14", "15", "16", "17", "21", "22", "23", "24", "25", "26", "27", "28", "29",
    "31", "32", "33", "35", "41", "42", "43", "50", "51", "52", "53",
]
SAIDA = RAIZ_DADOS_PROCESSADOS / "ibge_municipios" / "municipios_brasil.parquet"


def _centroide(anel: list) -> tuple[float, float]:
    x, y = np.array(anel).T[:2]
    a = x[:-1] * y[1:] - x[1:] * y[:-1]
    area = a.sum() / 2
    return float(((y[:-1] + y[1:]) * a).sum() / (6 * area)), float(((x[:-1] + x[1:]) * a).sum() / (6 * area))


def _uf(m: dict) -> str:
    # Municipio sem microrregiao (ex.: Fernando de Noronha) usa regiao-imediata.
    if m.get("microrregiao"):
        return m["microrregiao"]["mesorregiao"]["UF"]["sigla"]
    return m["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]


def _nomes_e_ufs() -> pd.DataFrame:
    linhas = requests.get(LOCALIDADES_URL, timeout=60).json()
    return pd.DataFrame(
        {"geocodigo_ibge": str(m["id"]), "municipio": m["nome"], "uf": _uf(m)}
        for m in linhas
    )


def _centroides_da_uf(uf: str) -> list[dict]:
    malha = requests.get(
        MALHA_URL.format(uf=uf),
        params={"intrarregiao": "municipio", "formato": "application/vnd.geo+json", "qualidade": "minima"},
        timeout=120,
    ).json()
    linhas = []
    for f in malha["features"]:
        geom = f["geometry"]
        poligonos = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        maior = max((p[0] for p in poligonos), key=len)
        lat, lon = _centroide(maior)
        linhas.append({"geocodigo_ibge": f["properties"]["codarea"], "latitude": lat, "longitude": lon})
    return linhas


def montar() -> pd.DataFrame:
    base = _nomes_e_ufs()
    centroides = []
    for n, uf in enumerate(UFS, 1):
        centroides.extend(_centroides_da_uf(uf))
        print(f"  {n}/{len(UFS)} uf={uf} municipios_acumulados={len(centroides)}")
    df_centroides = pd.DataFrame(centroides)
    df = base.merge(df_centroides, on="geocodigo_ibge", how="inner")
    faltando = len(base) - len(df)
    if faltando:
        print(f"aviso: {faltando} municipios sem geometria na malha (nao entraram na base)")
    return df


if __name__ == "__main__":
    tabela = montar()
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    tabela.to_parquet(SAIDA, index=False)
    print(f"gravado {len(tabela)} municipios em {SAIDA}")
