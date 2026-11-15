"""Risco de seca a partir do déficit de chuva recente (NASA POWER) em
relação ao histórico do mesmo período do ano.

Regra pura, sem rede. Soma a chuva dos últimos N dias e compara com a média
do MESMO período do ano (mesmos dias-do-ano) nos anos anteriores do
histórico -- sazonal de propósito, mesmo motivo do precipitacao_extrema.py:
uma média anual única confundiria estação seca com déficit real.

PENDENTE DE FONTE: a janela (90 dias) e os cortes de nível são uma escolha
inicial da equipe, pendente de validação agronômica -- mesmo padrão de
geada.py e precipitacao_extrema.py.
"""

from __future__ import annotations

import pandas as pd

JANELA_DIAS = 90
CORTE_NENHUM_PCT = 1.00
CORTE_BAIXO_PCT = 0.85
CORTE_MEDIO_PCT = 0.60


def _nivel(proporcao: float | None) -> str:
    if proporcao is None or proporcao >= CORTE_NENHUM_PCT:
        return "nenhum"
    if proporcao >= CORTE_BAIXO_PCT:
        return "baixo"
    if proporcao >= CORTE_MEDIO_PCT:
        return "medio"
    return "alto"


def calcular(serie_historica: list[dict]) -> dict:
    df = pd.DataFrame(serie_historica)[["data", "precipitacao_acumulada_mm"]].dropna()
    if df.empty:
        return {"disponivel": False, "motivo": "sem_medicoes"}

    df["data"] = pd.to_datetime(df["data"])
    df["dia_do_ano"] = df["data"].dt.day_of_year

    fim = df["data"].max()
    inicio = fim - pd.Timedelta(days=JANELA_DIAS - 1)
    recente = df[(df["data"] >= inicio) & (df["data"] <= fim)]
    chuva_recente = float(recente["precipitacao_acumulada_mm"].sum())

    dias_da_janela = set(recente["dia_do_ano"])
    historico = df[df["dia_do_ano"].isin(dias_da_janela) & (df["data"] < inicio)]
    anos_anteriores = int(historico["data"].dt.year.nunique())
    if anos_anteriores == 0:
        return {"disponivel": False, "motivo": "sem_historico_suficiente"}

    chuva_normal = float(historico["precipitacao_acumulada_mm"].sum()) / anos_anteriores
    proporcao = (chuva_recente / chuva_normal) if chuva_normal > 0 else None

    return {
        "serie": [{
            "data": fim.date().isoformat(),
            "nivel_seca": _nivel(proporcao),
            "chuva_recente_mm": round(chuva_recente, 1),
            "chuva_normal_mm": round(chuva_normal, 1),
            "proporcao_normal_pct": round(proporcao * 100, 1) if proporcao is not None else None,
        }],
        "metodo": (
            f"chuva dos últimos {JANELA_DIAS} dias vs. média do mesmo período do ano, "
            f"{anos_anteriores} anos anteriores"
        ),
    }
