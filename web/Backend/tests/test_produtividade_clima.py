"""Testes do modelo de sensibilidade produtividade x clima.

Usa dados sinteticos com efeito climatico CONHECIDO para checar se o
modelo (1) recupera o que foi plantado, (2) nao inventa efeito em ruido
puro, (3) nao vaza informacao entre anos na validacao e (4) aplica as
regras de limpeza da PAM.

Rodar: cd web/Backend && .venv/bin/python -m pytest tests -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GroupKFold, KFold, cross_val_predict

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "app" / "modelos"))
import produtividade_clima as pc  # noqa: E402

ANOS = np.arange(2000, 2025)
EFEITOS_VERDADEIROS = {"chuva_anom_100mm": 2.0, "tmax_anom_c": -3.0, "meses_secos_anom": -4.0}


def gerar_dataset(
    n_municipios: int = 30,
    efeitos: dict | None = None,
    ruido_pct: float = 3.0,
    choque_anual_pct: float = 0.0,
    seed: int = 0,
    cultura: str = "soja",
) -> pd.DataFrame:
    """Rendimento = tendencia tecnologica x (1 + efeito do clima + ruido).

    O clima de cada ano e comum ao estado (como na POWER), com pequena
    variacao por municipio. ``choque_anual_pct`` adiciona um choque por ano
    que NAO tem relacao com o clima (preco, praga...).
    """
    rng = np.random.default_rng(seed)
    efeitos = efeitos or {}
    chuva_ano = rng.normal(900, 150, len(ANOS))
    tmax_ano = rng.normal(31, 0.8, len(ANOS))
    secos_ano = rng.integers(0, 4, len(ANOS))
    choque_ano = rng.normal(0, choque_anual_pct, len(ANOS)) if choque_anual_pct else np.zeros(len(ANOS))

    linhas = []
    for m in range(n_municipios):
        base, ganho = rng.uniform(2000, 4000), rng.uniform(20, 60)  # kg/ha e kg/ha/ano
        for i, ano in enumerate(ANOS):
            chuva = chuva_ano[i] + rng.normal(0, 30)
            tmax = tmax_ano[i] + rng.normal(0, 0.2)
            secos = int(secos_ano[i])
            linhas.append({"cultura": cultura, "geocodigo_ibge": f"35{m:05d}", "ano": int(ano),
                           "chuva_safra_mm": chuva, "tmax_safra_c": tmax, "meses_secos": secos,
                           "area_plantada_ha": rng.uniform(100, 5000), "_choque": choque_ano[i]})
    df = pd.DataFrame(linhas)

    # Efeito aplicado sobre a anomalia em relacao a media do proprio municipio,
    # que e exatamente o que o modelo deve recuperar.
    g = df.groupby("geocodigo_ibge")
    anom = (
        efeitos.get("chuva_anom_100mm", 0) * (df["chuva_safra_mm"] - g["chuva_safra_mm"].transform("mean")) / 100
        + efeitos.get("tmax_anom_c", 0) * (df["tmax_safra_c"] - g["tmax_safra_c"].transform("mean"))
        + efeitos.get("meses_secos_anom", 0) * (df["meses_secos"] - g["meses_secos"].transform("mean"))
    )
    base = df["geocodigo_ibge"].map({k: rng.uniform(2000, 4000) for k in df["geocodigo_ibge"].unique()})
    ganho = df["geocodigo_ibge"].map({k: rng.uniform(20, 60) for k in df["geocodigo_ibge"].unique()})
    tendencia = base + ganho * (df["ano"] - ANOS[0])
    ruido = rng.normal(0, ruido_pct, len(df))
    df["rendimento_kg_ha"] = (tendencia * (1 + (anom + df["_choque"] + ruido) / 100)).round(0)
    return df.drop(columns="_choque")


def coef_por_variavel(resultado: list[dict]) -> dict:
    return {r["variavel"]: r for r in resultado}


# ---------- o modelo recupera o que foi plantado ----------

@pytest.mark.parametrize("seed", range(5))
def test_recupera_efeitos_conhecidos(seed):
    dados = pc.preparar(gerar_dataset(efeitos=EFEITOS_VERDADEIROS, seed=seed))
    res = coef_por_variavel(pc.ajustar_cultura(dados, np.random.default_rng(1)))
    for var, verdadeiro in EFEITOS_VERDADEIROS.items():
        assert res[var]["efeito_pct"] == pytest.approx(verdadeiro, abs=0.6), var
        assert res[var]["efeito_confiavel"], var
    assert res["tmax_anom_c"]["r2_validacao_por_ano"] > 0.5


def test_intervalo_de_90_porcento_esta_calibrado(monkeypatch):
    """Um IC de 90% deve conter o valor real em ~90% das simulacoes --
    nem sempre (isso seria IC largo demais), nem bem menos (estreito demais,
    o que faria o app afirmar efeito que nao existe)."""
    monkeypatch.setattr(pc, "N_BOOTSTRAP", 150)
    acertos = total = 0
    for seed in range(20):
        res = coef_por_variavel(pc.ajustar_cultura(
            pc.preparar(gerar_dataset(efeitos=EFEITOS_VERDADEIROS, seed=100 + seed)), np.random.default_rng(seed)))
        for var, verdadeiro in EFEITOS_VERDADEIROS.items():
            acertos += res[var]["ic90_inf"] <= verdadeiro <= res[var]["ic90_sup"]
            total += 1
    cobertura = acertos / total
    assert 0.75 <= cobertura <= 0.99, f"cobertura {cobertura:.0%}"


def test_sinal_dos_efeitos_e_preservado():
    efeitos = {"chuva_anom_100mm": -1.5, "tmax_anom_c": 2.5, "meses_secos_anom": 0.0}
    res = coef_por_variavel(pc.ajustar_cultura(pc.preparar(gerar_dataset(efeitos=efeitos, seed=7)),
                                               np.random.default_rng(1)))
    assert res["chuva_anom_100mm"]["efeito_pct"] < 0
    assert res["tmax_anom_c"]["efeito_pct"] > 0
    assert abs(res["meses_secos_anom"]["efeito_pct"]) < 0.6


# ---------- e nao inventa efeito onde nao ha ----------

def test_ruido_puro_nao_gera_efeito_nem_poder_preditivo():
    dados = pc.preparar(gerar_dataset(efeitos={}, ruido_pct=8.0, seed=3))
    res = pc.ajustar_cultura(dados, np.random.default_rng(1))
    assert res[0]["r2_validacao_por_ano"] < 0.05
    # 3 testes a 90%: no maximo um falso positivo e aceitavel.
    assert sum(r["efeito_confiavel"] for r in res) <= 1


def test_validacao_por_ano_nao_vaza_choque_anual():
    """Choque por ano sem relacao com clima: dividir por linha deixaria o
    mesmo ano no treino e no teste e daria R2 falso. Por ano, nao."""
    dados = pc.preparar(gerar_dataset(efeitos={}, ruido_pct=1.0, choque_anual_pct=10.0, seed=5))
    X = dados[list(pc.VARIAVEIS)].to_numpy()
    y = dados["anomalia_rendimento_pct"].to_numpy()
    anos = dados["ano"].to_numpy()

    def r2(prev):
        return 1 - ((y - prev) ** 2).sum() / ((y - y.mean()) ** 2).sum()

    por_linha = r2(cross_val_predict(LinearRegression(), X, y, cv=KFold(5, shuffle=True, random_state=0)))
    por_ano = r2(cross_val_predict(LinearRegression(), X, y, groups=anos, cv=GroupKFold(5)))
    assert por_ano < por_linha
    assert por_ano < 0.1
    res = pc.ajustar_cultura(dados, np.random.default_rng(1))
    assert res[0]["r2_validacao_por_ano"] < 0.1


# ---------- regras de limpeza ----------

def test_tendencia_tecnologica_e_removida():
    dados = pc.preparar(gerar_dataset(efeitos={}, ruido_pct=0.0))
    assert dados["anomalia_rendimento_pct"].abs().max() < 0.5


def test_ano_com_rendimento_repetido_e_descartado():
    df = gerar_dataset()
    mun = df["geocodigo_ibge"].iat[0]
    linhas = df.index[(df["geocodigo_ibge"] == mun) & (df["ano"].isin([2010, 2011]))]
    df.loc[linhas[1], "rendimento_kg_ha"] = df.loc[linhas[0], "rendimento_kg_ha"]
    dados = pc.preparar(df)
    anos_mun = set(dados.loc[dados["geocodigo_ibge"] == mun, "ano"])
    assert 2010 in anos_mun and 2011 not in anos_mun


def test_laranja_area_pequena_e_poucos_anos_ficam_fora():
    soja = gerar_dataset(n_municipios=3)
    laranja = gerar_dataset(n_municipios=3, cultura="laranja")
    pequena = gerar_dataset(n_municipios=1, seed=9).assign(area_plantada_ha=10, geocodigo_ibge="3599999")
    curta = gerar_dataset(n_municipios=1, seed=11).assign(geocodigo_ibge="3588888")
    curta = curta[curta["ano"] < 2005]
    dados = pc.preparar(pd.concat([soja, laranja, pequena, curta]))
    assert set(dados["cultura"]) == {"soja"}
    assert not {"3599999", "3588888"} & set(dados["geocodigo_ibge"])


def test_outlier_de_registro_e_descartado():
    df = gerar_dataset(efeitos={}, ruido_pct=1.0)
    alvo = df.index[(df["geocodigo_ibge"] == df["geocodigo_ibge"].iat[0]) & (df["ano"] == 2015)][0]
    df.loc[alvo, "rendimento_kg_ha"] *= 3  # erro tipico de unidade/digitacao
    dados = pc.preparar(df)
    assert dados["anomalia_rendimento_pct"].abs().max() <= pc.ANOMALIA_MAX
    assert not ((dados["geocodigo_ibge"] == df.at[alvo, "geocodigo_ibge"]) & (dados["ano"] == 2015)).any()


# ---------- aplicacao ----------

def test_efeito_estimado_soma_as_contribuicoes():
    coef = pd.DataFrame([
        {"cultura": "milho", "variavel": "chuva_anom_100mm", "efeito_pct": 1.0},
        {"cultura": "milho", "variavel": "tmax_anom_c", "efeito_pct": -2.0},
        {"cultura": "milho", "variavel": "meses_secos_anom", "efeito_pct": -5.0},
    ])
    r = pc.efeito_estimado(coef, "milho", chuva_anom_mm=-200, tmax_anom_c=1.5, meses_secos_anom=1)
    assert r["por_variavel"] == {"chuva_anom_100mm": -2.0, "tmax_anom_c": -3.0, "meses_secos_anom": -5.0}
    assert r["variacao_rendimento_pct"] == -10.0


# ---------- saida real (se ja foi gerada) ----------

@pytest.mark.skipif(not pc.SAIDA.exists(), reason="rode produtividade_clima.py antes")
def test_coeficientes_gerados_sao_coerentes():
    coef = pd.read_parquet(pc.SAIDA)
    assert "laranja" not in set(coef["cultura"])
    assert set(coef["variavel"]) == set(pc.VARIAVEIS)
    assert (coef["ic90_inf"] <= coef["ic90_sup"]).all()
    confiavel = coef[coef["efeito_confiavel"]]
    assert ((confiavel["ic90_inf"] > 0) | (confiavel["ic90_sup"] < 0)).all()
