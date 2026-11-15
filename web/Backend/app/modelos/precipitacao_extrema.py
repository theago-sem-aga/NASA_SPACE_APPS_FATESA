"""Deteccao de evento extremo de precipitacao a partir do historico real da
NASA POWER (ver docs/requisitos-faltantes.md, secao 2 -- "Precipitacao extrema").

Usa o cache de 30+ anos gerado por pipelines/ingestao_power_historico.py.
Sem esse cache pra celula pedida, a fonte fica indisponivel (mesma semantica
das demais fontes indexadas) -- nunca inventa limiar sem dado real.

Metodo: o limiar de "chuva extrema" de um dia e o percentil 95 da chuva
diaria do MESMO MES em todos os anos do historico -- sazonal de proposito,
porque um dia de chuva comum em janeiro pode ser um evento raro em julho
(estacao seca), e vice-versa. Conta quantos dos ultimos 30 dias com dado
publicado passaram desse limiar.
"""

from __future__ import annotations

import pandas as pd

JANELA_DIAS = 30
PERCENTIL = 0.95


def calcular(serie_historica: list[dict]) -> dict:
    df = pd.DataFrame(serie_historica)[["data", "precipitacao_acumulada_mm"]].dropna()
    if df.empty:
        return {"disponivel": False, "motivo": "sem_medicoes"}

    df["data"] = pd.to_datetime(df["data"])
    df["mes"] = df["data"].dt.month
    limiares_por_mes = df.groupby("mes")["precipitacao_acumulada_mm"].quantile(PERCENTIL)

    fim = df["data"].max()
    inicio = fim - pd.Timedelta(days=JANELA_DIAS - 1)
    recente = df[(df["data"] >= inicio) & (df["data"] <= fim)]

    limiar_mes_atual = float(limiares_por_mes.get(int(fim.month)))
    dias_extremos = int((recente["precipitacao_acumulada_mm"] > recente["mes"].map(limiares_por_mes)).sum())

    return {
        "serie": [{
            "data": fim.date().isoformat(),
            "dias_chuva_extrema_30d": dias_extremos,
            "limiar_chuva_extrema_mm_dia": round(limiar_mes_atual, 2),
        }],
        "metodo": (
            f"percentil {int(PERCENTIL * 100)} da chuva diaria do mesmo mes "
            f"(historico {df['data'].min().date().isoformat()} a {fim.date().isoformat()})"
        ),
    }
