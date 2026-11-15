"""Busca a série diária de chuva (NASA POWER, multi-regional) e calcula o
risco de seca (regra em app/domain/risco_seca.py)."""

from __future__ import annotations

from app.domain.risco_seca import calcular
from app.services.serie_power_diaria import serie_diaria


def risco_seca_do_ponto(latitude: float, longitude: float) -> dict:
    serie, tipo_acesso = serie_diaria(
        latitude, longitude, ("precipitacao_acumulada_mm",), ("PRECTOTCORR",), "risco_seca"
    )
    resultado = calcular(serie)
    resultado["tipo_acesso"] = tipo_acesso
    resultado["fonte"] = "nasa_power"
    resultado["variavel"] = "precipitacao_acumulada_mm"
    return resultado


def resumo_risco_seca(latitude: float, longitude: float) -> dict | None:
    """Versão achatada, pro campo CaracteristicasTalhao.risco_seca (Nivel) +
    detalhe em Analise.risco_seca_detalhe -- None quando a série não tinha medição."""
    resultado = risco_seca_do_ponto(latitude, longitude)
    serie = resultado.get("serie")
    if not serie:
        return None
    linha = serie[0]
    return {
        "nivel": linha["nivel_seca"],
        "chuva_recente_mm": linha["chuva_recente_mm"],
        "chuva_normal_mm": linha["chuva_normal_mm"],
        "proporcao_normal_pct": linha["proporcao_normal_pct"],
        "data_referencia": linha["data"],
        "metodo": resultado["metodo"],
        "fonte": resultado["fonte"],
        "variavel": resultado["variavel"],
        "tipo_acesso": resultado["tipo_acesso"],
    }
