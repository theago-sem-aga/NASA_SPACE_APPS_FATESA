"""Serie diaria da NASA POWER pra um ponto -- local pre-processado se existir
(pontos piloto), senao ao vivo (qualquer coordenada). Compartilhado por
precipitacao_extrema.py e risco_seca.py (geada.py segue um padrao parecido,
mas so T2M_MIN e so ate o periodo climatico fixo, por isso fica separado).
"""

from __future__ import annotations

import datetime as dt

from app.configuracao import RAIZ, configuracao
from app.integrations.nasa_power import buscar_power_ponto
from app.pipelines.indice_espacial import celula_id
from app.services.cache import com_cache

PASTA_LOCAL = RAIZ / "data" / "processed" / "nasa_power"


def _serie_local(latitude: float, longitude: float, colunas: tuple[str, ...]) -> list[dict] | None:
    caminho = PASTA_LOCAL / f"{celula_id(latitude, longitude)}.parquet"
    if not caminho.is_file():
        return None
    import pandas as pd

    df = pd.read_parquet(caminho, columns=["data", *colunas])
    df = df.astype(object).where(df.notna(), None)
    return df.to_dict("records")


def _serie_ao_vivo(latitude: float, longitude: float, ano_inicio: int, parametros: tuple[str, ...]) -> list[dict]:
    resultado = buscar_power_ponto(
        latitude,
        longitude,
        dt.date(ano_inicio, 1, 1),
        dt.date.today() - dt.timedelta(days=1),
        parametros=parametros,
        timeout_s=max(60, configuracao()["timeout_s"]),
    )
    return resultado["serie"]


def serie_diaria(
    latitude: float, longitude: float, colunas: tuple[str, ...], parametros: tuple[str, ...], chave_cache: str
) -> tuple[list[dict], str]:
    """``colunas``: nomes de campo no parquet local. ``parametros``: códigos
    da NASA POWER pro fallback ao vivo. Retorna (serie, tipo_acesso)."""
    config = configuracao()
    serie = _serie_local(latitude, longitude, colunas)
    if serie is not None:
        return serie, "pre_processado"
    ano_inicio = config["ano_inicio"]
    serie = com_cache(
        (chave_cache, round(latitude, 4), round(longitude, 4), ano_inicio),
        config["cache_ttl_s"],
        lambda: _serie_ao_vivo(latitude, longitude, ano_inicio, parametros),
    )
    return serie, "ao_vivo"
