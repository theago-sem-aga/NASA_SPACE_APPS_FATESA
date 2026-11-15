"""Busca a chuva diária da NASA POWER para um ponto e calcula a tendência de longo prazo.

Ordem de busca (mesmo padrão de services/geada.py e services/precipitacao_extrema.py):
1. Cópia local pré-processada (data/processed/nasa_power/<celula>.parquet). Sem rede.
2. NASA POWER diária ao vivo, só PRECTOTCORR, de CLIMA_ANO_INICIO até o último ano
   completo. Guarda em memória por CACHE_TTL_S.

A regra está em app/domain/tendencia_hidrica.py.
"""

from __future__ import annotations

import datetime as dt

from app.configuracao import RAIZ, configuracao
from app.domain.tendencia_hidrica import calcular_tendencia_hidrica
from app.integrations.nasa_power import buscar_power_ponto
from app.pipelines.indice_espacial import celula_id
from app.services.cache import com_cache

PASTA_LOCAL = RAIZ / "data" / "processed" / "nasa_power"


def _serie_local(latitude: float, longitude: float) -> list[dict] | None:
    caminho = PASTA_LOCAL / f"{celula_id(latitude, longitude)}.parquet"
    if not caminho.is_file():
        return None
    import pandas as pd

    df = pd.read_parquet(caminho, columns=["data", "precipitacao_acumulada_mm"])
    df = df.astype(object).where(df.notna(), None)
    return df.to_dict("records")


def _serie_ao_vivo(latitude: float, longitude: float, ano_inicio: int, ano_fim: int) -> list[dict]:
    resultado = buscar_power_ponto(
        latitude,
        longitude,
        dt.date(ano_inicio, 1, 1),
        dt.date(ano_fim, 12, 31),
        parametros=("PRECTOTCORR",),
        timeout_s=max(60, configuracao()["timeout_s"]),
    )
    return resultado["serie"]


def tendencia_hidrica(latitude: float, longitude: float) -> dict:
    """Tendência da chuva anual do ponto, com a origem dos dados."""
    config = configuracao()
    serie = _serie_local(latitude, longitude)
    if serie is not None:
        resultado = calcular_tendencia_hidrica(serie)
        resultado["tipo_acesso"] = "pre_processado"
    else:
        inicio, fim = config["ano_inicio"], dt.date.today().year - 1
        serie = com_cache(
            ("tendencia_hidrica", round(latitude, 4), round(longitude, 4), inicio, fim),
            config["cache_ttl_s"],
            lambda: _serie_ao_vivo(latitude, longitude, inicio, fim),
        )
        resultado = calcular_tendencia_hidrica(serie, inicio, fim)
        resultado["tipo_acesso"] = "ao_vivo"
    resultado["fonte"] = "nasa_power"
    resultado["variavel"] = "precipitacao_acumulada_mm"
    return resultado


if __name__ == "__main__":
    import json
    import sys

    lat, lon = (float(x) for x in sys.argv[1:3]) if len(sys.argv) >= 3 else (36.6, -119.7)
    r = tendencia_hidrica(lat, lon)
    print(json.dumps({k: v for k, v in r.items() if k != "anos"}, ensure_ascii=False))
