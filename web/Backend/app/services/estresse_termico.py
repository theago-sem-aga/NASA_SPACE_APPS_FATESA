"""Busca a máxima diária da NASA POWER para um ponto e calcula o estresse térmico.

Ordem de busca:
1. Cópia local pré-processada (data/processed/nasa_power/<celula>.parquet), feita
   por pipelines/ingestao_power_historico.py. Não usa rede.
2. NASA POWER diária ao vivo, só T2M_MAX, no período climático da configuração
   (CLIMA_ANO_INICIO..CLIMA_ANO_FIM). Guarda a resposta em memória por CACHE_TTL_S.

Mesmo padrão de services/geada.py. A regra está em app/domain/estresse_termico.py.
"""

from __future__ import annotations

import datetime as dt

from app.configuracao import RAIZ, configuracao
from app.domain.estresse_termico import calcular_estresse_termico
from app.integrations.nasa_power import buscar_power_ponto
from app.pipelines.indice_espacial import celula_id
from app.services.cache import com_cache

PASTA_LOCAL = RAIZ / "data" / "processed" / "nasa_power"


def _serie_local(latitude: float, longitude: float) -> list[dict] | None:
    caminho = PASTA_LOCAL / f"{celula_id(latitude, longitude)}.parquet"
    if not caminho.is_file():
        return None
    import pandas as pd

    df = pd.read_parquet(caminho, columns=["data", "temperatura_maxima_c"])
    df = df.astype(object).where(df.notna(), None)
    return df.to_dict("records")


def _serie_ao_vivo(latitude: float, longitude: float, ano_inicio: int, ano_fim: int) -> list[dict]:
    resultado = buscar_power_ponto(
        latitude,
        longitude,
        dt.date(ano_inicio, 1, 1),
        dt.date(ano_fim, 12, 31),
        parametros=("T2M_MAX",),
        timeout_s=max(60, configuracao()["timeout_s"]),
    )
    return resultado["serie"]


def estresse_termico_do_ponto(latitude: float, longitude: float) -> dict:
    """Estresse térmico do ponto, com a origem dos dados para rastreabilidade."""
    config = configuracao()
    serie = _serie_local(latitude, longitude)
    if serie is not None:
        resultado = calcular_estresse_termico(serie)
        resultado["tipo_acesso"] = "pre_processado"
    else:
        inicio, fim = config["ano_inicio"], config["ano_fim"]
        serie = com_cache(
            ("estresse_termico", round(latitude, 4), round(longitude, 4), inicio, fim),
            config["cache_ttl_s"],
            lambda: _serie_ao_vivo(latitude, longitude, inicio, fim),
        )
        resultado = calcular_estresse_termico(serie, inicio, fim)
        resultado["tipo_acesso"] = "ao_vivo"
    resultado["fonte"] = "nasa_power"
    resultado["variavel"] = "temperatura_maxima_c"
    return resultado


if __name__ == "__main__":
    import json
    import sys

    lat, lon = (float(x) for x in sys.argv[1:3]) if len(sys.argv) >= 3 else (36.6, -119.7)
    r = estresse_termico_do_ponto(lat, lon)
    print(json.dumps({k: v for k, v in r.items() if k != "meses"}, ensure_ascii=False))
    for m in r["meses"]:
        print(m)
