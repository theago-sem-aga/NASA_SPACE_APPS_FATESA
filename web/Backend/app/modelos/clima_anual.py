"""Comparação do clima de um ano com a média dos anos anteriores, pra
qualquer coordenada -- usa a série diária multi-regional da NASA POWER
(app/services/serie_power_diaria.py: cache local se existir, senão ao
vivo). Compartilhado pelo painel brasileiro (painel_producao.py) e pelo
painel dos EUA (painel_producao_eua.py); unidades (mm, °C) são sempre
métricas, sem risco de conversão.
"""

from __future__ import annotations

import pandas as pd

from app.services.serie_power_diaria import serie_diaria

DIAS_ANO_QUASE_COMPLETO = 360  # a POWER às vezes atrasa 1-2 dias recentes


def comparar_ano(latitude: float, longitude: float, ano_alvo: int | None = None) -> dict | None:
    """``ano_alvo``: ano preferido pra comparar (ex.: o ano da colheita mostrada).
    Se não tiver dado completo pra ele, cai no último ano completo disponível."""
    serie, _ = serie_diaria(
        latitude,
        longitude,
        ("precipitacao_acumulada_mm", "temperatura_maxima_c"),
        ("PRECTOTCORR", "T2M_MAX"),
        "clima_anual",
    )
    df = pd.DataFrame(serie)
    if df.empty or "precipitacao_acumulada_mm" not in df or "temperatura_maxima_c" not in df:
        return None
    df = df[["data", "precipitacao_acumulada_mm", "temperatura_maxima_c"]].dropna()
    if df.empty:
        return None
    df["data"] = pd.to_datetime(df["data"])
    df["ano"] = df["data"].dt.year
    anual = df.groupby("ano").agg(
        chuva=("precipitacao_acumulada_mm", "sum"),
        tmax=("temperatura_maxima_c", "mean"),
        dias=("precipitacao_acumulada_mm", "count"),
    )
    anual = anual[anual["dias"] >= DIAS_ANO_QUASE_COMPLETO]
    if len(anual) < 2:
        return None

    ano = ano_alvo if ano_alvo in anual.index else int(anual.index.max())
    anteriores = anual.loc[anual.index < ano]
    if anteriores.empty:
        return None

    chuva, chuva_normal = float(anual.at[ano, "chuva"]), float(anteriores["chuva"].mean())
    tmax, tmax_normal = float(anual.at[ano, "tmax"]), float(anteriores["tmax"].mean())
    proporcao = chuva / chuva_normal if chuva_normal else 1.0
    graus = tmax - tmax_normal
    return {
        "ano": ano,
        "chuva_mm": round(chuva),
        "chuva_normal_mm": round(chuva_normal),
        "situacao_chuva": "pouca" if proporcao <= 0.85 else "muita" if proporcao >= 1.15 else "normal",
        "gotas_em_10": int(round(proporcao * 10)),
        "tmax_c": round(tmax, 1),
        "tmax_normal_c": round(tmax_normal, 1),
        "situacao_calor": "mais_quente" if graus >= 1 else "mais_frio" if graus <= -1 else "normal",
        "graus_de_diferenca": int(round(graus)),
        "periodo_normal": f"{int(anteriores.index.min())}-{int(anteriores.index.max())}",
    }
