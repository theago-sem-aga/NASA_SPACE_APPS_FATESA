"""Cache da serie de NDVI do MODIS (MOD13Q1, 16 dias) por celula, pela API do ORNL.

A serie longa (2000 ate hoje) leva ~62 blocos de 10 datas no ORNL, com NDVI e qualidade juntos
(ver integrations/modis_ornl.py) e e lenta demais para a requisicao do
usuario. Este script guarda uma copia por celula e, nas proximas vezes, so
pede as datas que ainda nao estao no arquivo (incremental).

Saida: data/processed/modis_ndvi/<celula_id>.parquet
       colunas: data, ndvi, confiabilidade_pixel, latitude, longitude (do pixel), fonte, ...
Uso:   python ingestao_modis_ndvi.py <lat> <lon>          (um ponto)
       REGIAO_PILOTO=sjrp python ingestao_modis_ndvi.py   (todas as celulas da regiao)
       python ingestao_modis_ndvi.py --municipios 3549805 3533908 (pontos da busca municipal)
"""

from __future__ import annotations

import argparse
import datetime as dt
import sys
from concurrent.futures import Executor
from pathlib import Path
from tempfile import NamedTemporaryFile

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # web/Backend, para o pacote app
sys.path.insert(0, str(Path(__file__).resolve().parent))  # indice_espacial/regioes (import solto)
from indice_espacial import caminho_parquet_da_celula, celula_id  # noqa: E402
from regioes import centros_das_celulas, regiao_atual  # noqa: E402

from app.integrations.modis_ornl import buscar_ndvi_ponto  # noqa: E402
from app.services.locais import buscar_por_codigo  # noqa: E402

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


def atualizar_ponto(latitude: float, longitude: float, executor: Executor | None = None) -> tuple[str, int, int]:
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
    resultado = buscar_ndvi_ponto(latitude, longitude, data_inicio=inicio, paralelo=PARALELO, executor=executor)
    novo = pd.DataFrame(resultado["serie"], columns=["data", "ndvi", "confiabilidade_pixel"])
    novo["latitude"], novo["longitude"] = latitude, longitude
    novo["fonte"] = "modis_ornl"
    novo["tipo_acesso"] = "pre_processado"
    novo["data_coleta_utc"] = resultado["data_coleta_utc"]
    df = juntar(antigo, novo)
    if df.empty:
        raise LookupError("Nenhuma data MODIS disponível para preparar este ponto")
    caminho.parent.mkdir(parents=True, exist_ok=True)
    # A API não pode enxergar um Parquet parcialmente escrito durante a coleta.
    temporario = None
    try:
        with NamedTemporaryFile(dir=caminho.parent, suffix=".parquet.tmp", delete=False) as arquivo:
            temporario = Path(arquivo.name)
            df.to_parquet(arquivo, index=False)
        temporario.replace(caminho)
    finally:
        if temporario is not None:
            temporario.unlink(missing_ok=True)
    return celula, len(novo), len(df)


def ingerir(pontos: list[tuple[float, float]]) -> int:
    for n, (lat, lon) in enumerate(pontos, 1):
        celula, novas, total = atualizar_ponto(lat, lon)
        print(f"  {n}/{len(pontos)} celula={celula} datas_novas={novas} total={total}", flush=True)
    return len(pontos)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("coordenadas", type=float, nargs="*")
    parser.add_argument("--municipios", nargs="*", default=[], help="Códigos IBGE dos pontos usados pela busca municipal")
    args = parser.parse_args()
    if len(args.coordenadas) % 2:
        parser.error("Informe pares de latitude e longitude")
    pontos = list(zip(args.coordenadas[::2], args.coordenadas[1::2], strict=True))
    for codigo in args.municipios:
        local = buscar_por_codigo(codigo)
        if local is None:
            parser.error("Município não encontrado na base local")
        pontos.append((local["latitude"], local["longitude"]))
    if not pontos:
        regiao = regiao_atual()
        print(f"fonte={FONTE} regiao={regiao['chave']}")
        pontos = centros_das_celulas(regiao)
    ingerir(list(dict.fromkeys(pontos)))
