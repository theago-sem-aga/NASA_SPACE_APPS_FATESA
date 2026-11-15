"""Testes da regra de risco de geada (app/domain/geada.py), com séries sintéticas de resultado conhecido.

Rodar: cd web/Backend && python -m pytest tests/test_geada.py -v
"""

from __future__ import annotations

import datetime as dt

import pytest

from app.domain.geada import (
    calcular_risco_geada,
    nivel_por_probabilidade,
    probabilidade_na_janela,
)


def serie(anos, tmin):
    """Série diária completa; `tmin(data)` devolve a mínima do dia (ou None)."""
    linhas = []
    for ano in anos:
        dia = dt.date(ano, 1, 1)
        while dia.year == ano:
            linhas.append({"data": dia.isoformat(), "temperatura_minima_c": tmin(dia)})
            dia += dt.timedelta(days=1)
    return linhas


def quente(_dia):
    return 15.0


def mes(r, numero):
    return r["meses"][numero - 1]


def test_sem_frio_nunca_dá_geada():
    r = calcular_risco_geada(serie(range(2000, 2010), quente))
    assert r["nivel"] == "baixo"
    assert r["meses_com_risco"] == [] and r["mes_mais_arriscado"] is None
    assert r["probabilidade_ano"] == 0
    assert all(m["probabilidade_geada"] == 0 and m["dias_geada_medio"] == 0 for m in r["meses"])


def test_geada_todo_julho_e_alto_e_so_em_julho():
    # Inverno do hemisfério sul: 3 noites a 1 °C no começo de julho, todo ano.
    r = calcular_risco_geada(
        serie(range(2000, 2010), lambda d: 1.0 if d.month == 7 and d.day <= 3 else 15.0)
    )
    assert r["nivel"] == "alto"
    assert r["meses_com_risco"] == [7] and r["mes_mais_arriscado"] == 7
    assert mes(r, 7)["probabilidade_geada"] == 1.0
    assert mes(r, 7)["dias_geada_medio"] == 3
    assert mes(r, 7)["menor_minima_c"] == 1.0
    # 1 °C é geada na relva (limiar 2 °C), mas não geada forte (0 °C).
    assert mes(r, 7)["probabilidade_geada_forte"] == 0
    assert mes(r, 6)["probabilidade_geada"] == 0


def test_probabilidade_e_fracao_dos_anos_com_geada():
    # Geada em junho só em 2 de 10 anos -> 20% -> nível médio.
    anos_frios = {2003, 2007}
    r = calcular_risco_geada(
        serie(range(2000, 2010), lambda d: -1.0 if d.year in anos_frios and d.month == 6 and d.day == 10 else 15.0)
    )
    assert mes(r, 6)["probabilidade_geada"] == 0.2
    assert mes(r, 6)["probabilidade_geada_forte"] == 0.2
    assert mes(r, 6)["anos_com_geada"] == 2
    assert mes(r, 6)["dias_geada_medio"] == 0.2
    assert r["nivel"] == "medio"
    assert r["probabilidade_ano"] == 0.2


@pytest.mark.parametrize(
    ("probabilidade", "nivel"),
    [(0, "baixo"), (0.099, "baixo"), (0.10, "medio"), (0.333, "medio"), (0.34, "alto"), (1, "alto")],
)
def test_cortes_do_nivel(probabilidade, nivel):
    assert nivel_por_probabilidade(probabilidade) == nivel


def test_limiar_inclusivo_e_configuravel():
    r = calcular_risco_geada(serie([2001], lambda d: 2.0 if d.month == 8 and d.day == 1 else 15.0))
    assert mes(r, 8)["probabilidade_geada"] == 1.0  # exatamente no limiar conta
    r0 = calcular_risco_geada(
        serie([2001], lambda d: 2.0 if d.month == 8 and d.day == 1 else 15.0), limiar_c=0.0
    )
    assert mes(r0, 8)["probabilidade_geada"] == 0


def test_ano_incompleto_fica_de_fora():
    # 2026 só até novembro e com muita geada: não pode entrar na conta.
    completa = serie(range(2000, 2010), quente)
    parcial = [
        linha
        for linha in serie([2026], lambda d: -5.0 if d.month == 1 else 15.0)
        if linha["data"] < "2026-11-12"
    ]
    r = calcular_risco_geada(completa + parcial)
    assert r["periodo_fim"] == 2009 and r["anos_analisados"] == 10
    assert mes(r, 1)["probabilidade_geada"] == 0


def test_valor_ausente_nao_vira_zero_grau():
    # None é ausência; se virasse 0 °C, contaria como geada.
    dados = serie([2001, 2002], quente)
    for linha in dados[:5]:
        linha["temperatura_minima_c"] = None
    dados.append({"data": "2002-12-31", "temperatura_minima_c": None})  # repetido, sem efeito
    r = calcular_risco_geada(dados)
    assert r["probabilidade_ano"] == 0
    # 2001 ficou com 360 dias válidos: incompleto, sai da conta.
    assert r["periodo_inicio"] == 2002 and r["anos_analisados"] == 1


def test_recorte_de_periodo():
    dados = serie(range(1990, 2021), lambda d: -2.0 if d.year < 2000 and d.month == 1 and d.day == 1 else 15.0)
    r = calcular_risco_geada(dados, ano_inicio=2000, ano_fim=2020)
    assert (r["periodo_inicio"], r["periodo_fim"], r["anos_analisados"]) == (2000, 2020, 21)
    assert mes(r, 1)["probabilidade_geada"] == 0


def test_sem_ano_completo_é_erro_e_não_risco_baixo():
    with pytest.raises(ValueError):
        calcular_risco_geada(serie([2001], quente)[:100])


def test_janela_conta_o_ano_uma_vez_só():
    # Anos pares gelam em junho E julho; anos ímpares, nunca.
    dados = serie(
        range(2000, 2010), lambda d: 0.5 if d.year % 2 == 0 and d.month in (6, 7) and d.day == 15 else 15.0
    )
    r = calcular_risco_geada(dados)
    assert mes(r, 6)["probabilidade_geada"] == 0.5 and mes(r, 7)["probabilidade_geada"] == 0.5
    # Somar daria 100%; o certo é 50% (os mesmos invernos).
    assert probabilidade_na_janela(r, dados, [6, 7]) == 0.5
    assert probabilidade_na_janela(r, iter(dados), [1, 2]) == 0


def test_inverno_do_hemisferio_norte_cruza_a_virada_do_ano():
    # Fresno: geada de dezembro a fevereiro.
    r = calcular_risco_geada(
        serie(range(2000, 2010), lambda d: -1.0 if d.month in (12, 1, 2) and d.day == 5 else 10.0)
    )
    assert r["meses_com_risco"] == [1, 2, 12]
    assert probabilidade_na_janela(r, serie(range(2000, 2010), lambda d: -1.0 if d.month in (12, 1, 2) and d.day == 5 else 10.0), [3, 4, 5]) == 0
