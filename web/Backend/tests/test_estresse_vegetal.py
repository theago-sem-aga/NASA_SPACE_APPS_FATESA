"""Testes do estresse vegetal (app/domain/estresse_vegetal.py), com séries de resultado conhecido.

Rodar: cd web/Backend && python -m pytest tests/test_estresse_vegetal.py -v
"""

from __future__ import annotations

import datetime as dt

import pytest

from app.domain.estresse_vegetal import (
    calcular_estresse_vegetal,
    faixa_ndvi,
    fotos_validas,
    periodo_do_ano,
    quantil,
)

DIAS_MODIS = [1 + 16 * i for i in range(23)]  # dias do ano em que o MODIS começa cada período


def data(ano: int, dia_do_ano: int) -> str:
    return (dt.date(ano, 1, 1) + dt.timedelta(days=dia_do_ano - 1)).isoformat()


def serie(ndvi_por_ano, anos=range(2000, 2026), ultima=None, confiabilidade=0):
    """Série completa; ndvi_por_ano(ano, periodo) dá o valor. `ultima` = NDVI da foto final."""
    linhas = [
        {"data": data(ano, dia), "ndvi": ndvi_por_ano(ano, p), "confiabilidade_pixel": confiabilidade}
        for ano in anos
        for p, dia in enumerate(DIAS_MODIS)
    ]
    if ultima is not None:
        linhas.append({"data": data(2026, 1), "ndvi": ultima, "confiabilidade_pixel": 0})
    return linhas


def lavoura(ano, p):
    # Verde no verão, seca no inverno; anos variam um pouco (0,60..0,725 no pico).
    return round(0.35 + 0.25 * (1 if p < 6 or p > 18 else 0) + 0.005 * (ano - 2000), 4)


def test_periodo_do_ano_e_igual_em_ano_bissexto():
    assert periodo_do_ano("2025-01-01") == 0
    assert periodo_do_ano("2025-03-06") == periodo_do_ano("2024-03-05") == 4  # dia 65 nos dois
    assert periodo_do_ano("2025-12-19") == 22


def test_foto_muito_menos_verde_que_todos_os_anos_e_muito_abaixo():
    r = calcular_estresse_vegetal(serie(lavoura, ultima=0.30))
    assert r["situacao"] == "muito_abaixo"
    assert r["anos_comparados"] == 26 and r["anos_mais_verdes"] == 26
    assert r["anomalia_pct"] < -40
    assert r["data_foto"] == "2026-01-01"


def test_foto_no_meio_dos_anos_e_normal():
    r = calcular_estresse_vegetal(serie(lavoura, ultima=0.665))
    assert r["situacao"] == "normal"
    assert 0.25 <= r["posicao"] <= 0.9


def test_faixas_abaixo_e_acima():
    # Anos de 2000 a 2025 no período 0: 0,600 .. 0,725. Posição 20% -> abaixo; acima do máximo -> acima.
    valores = sorted(lavoura(a, 0) for a in range(2000, 2026))
    assert calcular_estresse_vegetal(serie(lavoura, ultima=valores[5] + 0.001))["situacao"] == "abaixo"
    assert calcular_estresse_vegetal(serie(lavoura, ultima=0.90))["situacao"] == "acima"


def test_o_ano_da_foto_nao_entra_no_proprio_normal():
    linhas = serie(lavoura, ultima=0.30)
    # Outra foto de 2026 no mesmo período não pode puxar o normal para baixo.
    linhas.append({"data": "2026-01-05", "ndvi": 0.01, "confiabilidade_pixel": 0})
    r = calcular_estresse_vegetal(linhas)
    assert r["anos_comparados"] == 26 and r["normal_p10"] > 0.5


def test_nuvem_e_ausente_ficam_de_fora():
    linhas = serie(lavoura, ultima=0.665)
    linhas.append({"data": "2026-01-17", "ndvi": 0.05, "confiabilidade_pixel": 3})  # nuvem
    linhas.append({"data": "2026-02-02", "ndvi": None, "confiabilidade_pixel": -1})  # ausente
    r = calcular_estresse_vegetal(linhas)
    assert r["data_foto"] == "2026-01-01" and r["situacao"] == "normal"
    assert len(fotos_validas(linhas)) == 26 * 23 + 1


def test_cidade_sem_planta_nao_vira_estresse():
    r = calcular_estresse_vegetal(serie(lambda a, p: 0.13, ultima=0.05))
    assert r["situacao"] == "sem_vegetacao"


def test_poucos_anos_e_erro():
    with pytest.raises(ValueError):
        calcular_estresse_vegetal(serie(lavoura, anos=range(2020, 2026), ultima=0.3))


def test_grafico_traz_o_ultimo_ano_com_o_normal():
    r = calcular_estresse_vegetal(serie(lavoura, ultima=0.30))
    assert len(r["ultimas_fotos"]) == 23
    ultima = r["ultimas_fotos"][-1]
    assert ultima["data"] == "2026-01-01" and ultima["normal_p10"] <= ultima["normal_mediana"] <= ultima["normal_p90"]


def test_quantil_igual_ao_numpy():
    assert quantil([1, 2, 3, 4], 0.5) == 2.5
    assert quantil([10, 20, 30, 40, 50], 0.1) == pytest.approx(14)


def test_faixas_da_tabela_de_referencia():
    # Tabela do artigo da EOSDA: -1,0 a -0,1 água/neve/nuvem; 0 a 0,2 solo nu;
    # 0,2 a 0,5 vegetação esparsa ou estressada; 0,6 a 1,0 vegetação densa e saudável.
    assert faixa_ndvi(-0.5) == "agua_neve_nuvem"
    assert faixa_ndvi(0.13) == "solo_nu"
    assert faixa_ndvi(0.2) == faixa_ndvi(0.33) == faixa_ndvi(0.5) == "vegetacao_esparsa_ou_estressada"
    assert faixa_ndvi(0.6) == faixa_ndvi(0.74) == "vegetacao_densa_saudavel"
    # Onde a fonte não dá intervalo, não inventamos nome.
    assert faixa_ndvi(0.55) == faixa_ndvi(-0.05) == "entre_faixas"


def test_resultado_traz_a_faixa_e_a_fonte():
    r = calcular_estresse_vegetal(serie(lavoura, ultima=0.665))
    assert r["faixa_ndvi_atual"] == "vegetacao_densa_saudavel"
    assert "EOSDA" in r["fonte_referencia"]
