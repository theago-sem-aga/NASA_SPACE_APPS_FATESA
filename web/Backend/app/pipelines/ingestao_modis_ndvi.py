"""Cache da serie de NDVI do MODIS (MOD13Q1, 16 dias) por celula, pela API do ORNL.

A serie longa (2000 ate hoje) leva ~62 blocos de 10 datas por banda no ORNL
(ver integrations/modis_ornl.py) e e lenta demais para a requisicao do
usuario. Este script guarda uma copia por celula e, nas proximas vezes, so
pede as datas que ainda nao estao no arquivo (incremental).

Saida: data/processed/modis_ndvi/<celula_id>.parquet
       colunas: data, ndvi, confiabilidade_pixel, latitude, longitude (do pixel), fonte, ...
Uso:   python ingestao_modis_ndvi.py <lat> <lon>          (um ponto)
       REGIAO_PILOTO=sjrp python ingestao_modis_ndvi.py   (todas as celulas da regiao)
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # web/Backend, para o pacote app
sys.path.insert(0, str(Path(__file__).resolve().parent))  # indice_espacial/regioes (import solto)
from app.integrations.modis_ornl import buscar_ndvi_ponto  # noqa: E402

from indice_espacial import caminho_parquet_da_celula, celula_id  # noqa: E402
from regioes import centros_das_celulas, regiao_atual  # noqa: E402

FONTE = "modis_ndvi"
COLUNAS = [
    "data", "ndvi", "confiabilidade_pixel", "latitude", "longitude", "fonte", "tipo_acesso", "data_coleta_utc",
]
PARALELO = 8


def juntar(antigo: pd.DataFrame | None, novo: pd.DataFrame) -> pd.DataFrame:
    """Concatena a serie guardada com a nova; na mesma data vale a mais recente."""
    partes = [p for p in (antigo, novo) if p is not None and not p.empty]
    if not partes:
        return pd.DataFrame(columns=COLUNAS)
    df = pd.concat(partes, ignore_index=True)
    df = df.drop_duplicates(subset="data", keep="last").sort_values("data", ignore_index=True)
    return df[COLUNAS]


def atualizar_ponto(latitude: float, longitude: float) -> tuple[str, int, int]:
    """Baixa o que falta da celula do ponto. Retorna (celula, datas_novas, total)."""
    celula = celula_id(latitude, longitude)
    caminho = caminho_parquet_da_celula(FONTE, celula)
    antigo = pd.read_parquet(caminho) if caminho.is_file() else None
    if antigo is not None and not (
        {"latitude", "longitude"} <= set(antigo.columns)
        and (antigo["latitude"].iloc[0], antigo["longitude"].iloc[0]) == (latitude, longitude)
    ):
        antigo = None  # outro pixel na mesma celula: comeca do zero, sem misturar pontos
    inicio = None
    if antigo is not None and not antigo.empty:
        inicio = dt.date.fromisoformat(antigo["data"].max()) + dt.timedelta(days=1)
    resultado = buscar_ndvi_ponto(latitude, longitude, data_inicio=inicio, paralelo=PARALELO)
    novo = pd.DataFrame(resultado["serie"], columns=["data", "ndvi", "confiabilidade_pixel"])
    novo["latitude"], novo["longitude"] = latitude, longitude
    novo["fonte"] = "modis_ornl"
    novo["tipo_acesso"] = "pre_processado"
    novo["data_coleta_utc"] = resultado["data_coleta_utc"]
    df = juntar(antigo, novo)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(caminho, index=False)
    return celula, len(novo), len(df)


def ingerir(pontos: list[tuple[float, float]]) -> int:
    for n, (lat, lon) in enumerate(pontos, 1):
        celula, novas, total = atualizar_ponto(lat, lon)
        print(f"  {n}/{len(pontos)} celula={celula} datas_novas={novas} total={total}", flush=True)
    return len(pontos)


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        ingerir([(float(sys.argv[1]), float(sys.argv[2]))])
    else:
        regiao = regiao_atual()
        print(f"fonte={FONTE} regiao={regiao['chave']}")
        ingerir(centros_das_celulas(regiao))
