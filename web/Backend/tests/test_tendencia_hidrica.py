"""Testes da tendência hídrica (app/domain/tendencia_hidrica.py), com séries de resultado conhecido.

Rodar: cd web/Backend && python -m pytest tests/test_tendencia_hidrica.py -v
"""

from __future__ import annotations

import datetime as dt
import random

import pytest

from app.domain.tendencia_hidrica import (
    calcular_tendencia_hidrica,
    chuva_anual,
    inclinacao_sen,
    mann_kendall,
)


def serie(chuva_por_ano: dict[int, float]):
    """Série diária completa; a chuva do ano é distribuída igualmente nos dias."""
    linhas = []
    for ano, total in chuva_por_ano.items():
        dia = dt.date(ano, 1, 1)
        dias = 366 if dt.date(ano, 12, 31).timetuple().tm_yday == 366 else 365
        while dia.year == ano:
            linhas.append({"data": dia.isoformat(), "precipitacao_acumulada_mm": total / dias})
            dia += dt.timedelta(days=1)
    return linhas


def test_queda_constante_e_secando_com_inclinacao_exata():
    # 1500 mm em 1995, caindo 20 mm por ano.
    r = calcular_tendencia_hidrica(serie({1995 + i: 1500 - 20 * i for i in range(31)}))
    assert r["tendencia"] == "secando"
    assert r["mm_por_decada"] == pytest.approx(-200, abs=0.5)
    assert r["p_valor"] < 0.001
    assert r["reta_inicio_mm"] == pytest.approx(1500, abs=1)
    assert r["reta_fim_mm"] == pytest.approx(900, abs=1)
    assert (r["periodo_inicio"], r["periodo_fim"], r["anos_analisados"]) == (1995, 2025, 31)


def test_alta_constante_e_mais_chuvoso():
    r = calcular_tendencia_hidrica(serie({2000 + i: 400 + 10 * i for i in range(20)}))
    assert r["tendencia"] == "mais_chuvoso"
    assert r["mm_por_decada"] == pytest.approx(100, abs=0.5)
    assert r["pct_por_decada"] > 0


def test_chuva_sem_tendencia_e_estavel():
    # Ruído em torno de 1200 mm, sem tendência (semente fixa: resultado reprodutível).
    sorteio = random.Random(42)
    r = calcular_tendencia_hidrica(serie({1995 + i: 1200 + sorteio.gauss(0, 150) for i in range(31)}))
    assert r["tendencia"] == "estavel"
    assert r["p_valor"] >= 0.05


def test_tudo_igual_nao_tem_tendencia():
    r = calcular_tendencia_hidrica(serie({2000 + i: 800 for i in range(15)}))
    assert r["tendencia"] == "estavel" and r["mm_por_decada"] == 0 and r["p_valor"] == 1.0


def test_um_ano_muito_fora_nao_puxa_a_inclinacao():
    # Sen é a mediana das inclinações: um ano de 5000 mm no meio quase não mexe nela.
    chuva = {1995 + i: 1500 - 20 * i for i in range(31)}
    chuva[2010] = 5000
    r = calcular_tendencia_hidrica(serie(chuva))
    assert r["mm_por_decada"] == pytest.approx(-200, abs=15)
    assert r["tendencia"] == "secando"


def test_ano_incompleto_fica_de_fora_e_ausente_nao_vira_zero():
    dados = serie({1995 + i: 1000 for i in range(12)})
    # 2026 só até novembro (chuva baixa porque falta dezembro): não pode entrar.
    dados += [linha for linha in serie({2026: 100}) if linha["data"] < "2026-11-12"]
    # Um dia ausente em 1995 deixa o ano com 364 dias: sai da conta.
    dados[0]["precipitacao_acumulada_mm"] = None
    anual = chuva_anual(dados)
    assert [a["ano"] for a in anual] == list(range(1996, 2007))
    r = calcular_tendencia_hidrica(dados)
    assert r["tendencia"] == "estavel"


def test_poucos_anos_e_erro_e_nao_estavel():
    with pytest.raises(ValueError):
        calcular_tendencia_hidrica(serie({2000 + i: 1000 - 50 * i for i in range(9)}))


def test_recorte_de_periodo():
    # Até 2009 sobe, depois cai; recortando 2010-2025 tem que dar só a queda.
    chuva = {1995 + i: (1000 + 30 * i if 1995 + i < 2010 else 1500 - 30 * (i - 15)) for i in range(31)}
    r = calcular_tendencia_hidrica(serie(chuva), ano_inicio=2010, ano_fim=2025)
    assert r["periodo_inicio"] == 2010 and r["tendencia"] == "secando"


def test_mann_kendall_e_sen_conferidos_a_mao():
    # 1, 2, 3, 4, 5: todos os 10 pares sobem -> S = 10; inclinações todas 1.
    s, p = mann_kendall([1, 2, 3, 4, 5])
    assert s == 10 and p < 0.05
    assert inclinacao_sen([2000, 2001, 2002, 2003, 2004], [1, 2, 3, 4, 5]) == 1
    # Empates não quebram a conta.
    s, p = mann_kendall([3, 3, 3, 4, 4])
    assert s == 6 and 0 < p < 1
