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

from app.modelos.precipitacao_extrema import calcular
from app.services.serie_power_diaria import serie_diaria


def precipitacao_extrema_do_ponto(latitude: float, longitude: float) -> dict:
    """Resultado de app.modelos.precipitacao_extrema.calcular, com a origem do dado."""
    serie, tipo_acesso = serie_diaria(
        latitude, longitude, ("precipitacao_acumulada_mm",), ("PRECTOTCORR",), "precipitacao_extrema"
    )
    resultado = calcular(serie)
    resultado["tipo_acesso"] = tipo_acesso
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
