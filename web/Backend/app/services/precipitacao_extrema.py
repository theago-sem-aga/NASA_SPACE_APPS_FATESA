"""Busca a serie diaria de precipitacao da NASA POWER para um ponto e calcula
o evento extremo (regra em app/modelos/precipitacao_extrema.py).

Ordem de busca (mesmo padrao de services/geada.py):
1. Copia local pre-processada (data/processed/nasa_power/<celula>.parquet),
   feita por pipelines/ingestao_power_historico.py. Nao usa rede -- hoje so
   existe para os pontos piloto (Fresno, SJRP).
2. NASA POWER diaria ao vivo, so PRECTOTCORR, de CLIMA_ANO_INICIO (config)
   até ontem. Guarda em memoria por CACHE_TTL_S. Funciona em QUALQUER
   coordenada -- a ferramenta nao pode depender so dos pontos pre-cacheados
   pra responder isso, por isso puxa o recorte ao vivo quando precisa, em
   vez de dar "indisponivel" fora dos dois pontos piloto.

Diferente de geada.py, o recorte ao vivo vai até ontem (nao até um ano fixo
do periodo climatico): o calculo precisa saber se os ultimos 30 dias reais
tiveram chuva extrema, nao so a frequencia historica.
"""

from __future__ import annotations

import datetime as dt

from app.configuracao import RAIZ, configuracao
from app.integrations.nasa_power import buscar_power_ponto
from app.modelos.precipitacao_extrema import calcular
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


def _serie_ao_vivo(latitude: float, longitude: float, ano_inicio: int) -> list[dict]:
    resultado = buscar_power_ponto(
        latitude,
        longitude,
        dt.date(ano_inicio, 1, 1),
        dt.date.today() - dt.timedelta(days=1),
        parametros=("PRECTOTCORR",),
        timeout_s=max(60, configuracao()["timeout_s"]),
    )
    return resultado["serie"]


def precipitacao_extrema_do_ponto(latitude: float, longitude: float) -> dict:
    """Resultado de app.modelos.precipitacao_extrema.calcular, com a origem do dado."""
    config = configuracao()
    serie = _serie_local(latitude, longitude)
    if serie is not None:
        resultado = calcular(serie)
        resultado["tipo_acesso"] = "pre_processado"
    else:
        ano_inicio = config["ano_inicio"]
        serie = com_cache(
            ("precipitacao_extrema", round(latitude, 4), round(longitude, 4), ano_inicio),
            config["cache_ttl_s"],
            lambda: _serie_ao_vivo(latitude, longitude, ano_inicio),
        )
        resultado = calcular(serie)
        resultado["tipo_acesso"] = "ao_vivo"
    resultado["fonte"] = "nasa_power"
    resultado["variavel"] = "precipitacao_acumulada_mm"
    return resultado


def resumo_precipitacao_extrema(latitude: float, longitude: float) -> dict | None:
    """Versao achatada de precipitacao_extrema_do_ponto, pro schema RiscoPrecipitacaoExtrema
    (app/schemas/analises.py) -- None quando a serie nao tinha medicao nenhuma."""
    resultado = precipitacao_extrema_do_ponto(latitude, longitude)
    serie = resultado.get("serie")
    if not serie:
        return None
    linha = serie[0]
    return {
        "dias_chuva_extrema_30d": int(linha["dias_chuva_extrema_30d"]),
        "limiar_chuva_extrema_mm_dia": linha["limiar_chuva_extrema_mm_dia"],
        "data_referencia": linha["data"],
        "metodo": resultado["metodo"],
        "fonte": resultado["fonte"],
        "variavel": resultado["variavel"],
        "tipo_acesso": resultado["tipo_acesso"],
    }


if __name__ == "__main__":
    import sys

    lat, lon = (float(x) for x in sys.argv[1:3]) if len(sys.argv) >= 3 else (36.6, -119.7)
    print(precipitacao_extrema_do_ponto(lat, lon))
