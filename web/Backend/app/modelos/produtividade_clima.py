"""Modelo explicavel de sensibilidade da produtividade ao clima (SP, 2000-2024).

Pergunta que responde: "num ano com X mm a menos de chuva na safra (ou
+1 grau na maxima, ou 1 mes seco a mais), quanto o rendimento desta
cultura costuma cair, em %?". E evidencia para o motor de decisao --
nao escolhe rotacao sozinho.

Metodo (escolhido por ser explicavel, ver docs/convencao_programacao.md):
1. Por municipio, tira a tendencia linear do rendimento (ganho de
   tecnologia ao longo dos anos) -> alvo = anomalia % em relacao a tendencia.
2. Clima tambem vira anomalia em relacao a media do proprio municipio.
3. Regressao linear por cultura: anomalia_rendimento ~ chuva + tmax + meses_secos.
4. Validacao deixando ANOS inteiros de fora (GroupKFold por ano): o clima
   de um ano e compartilhado por todos os municipios, entao validar por
   linha superestimaria o acerto.
5. Intervalo de confianca 90% por bootstrap de anos (mesmo motivo).

Limites (devem aparecer na UI): municipio inteiro, nao talhao; PAM de
milho/feijao soma 1a e 2a safra; janelas de safra aproximadas; associacao
historica, nao causalidade.

RESULTADO (2026-11-14) -- NAO USAR COMO PREVISOR:
  R2 na validacao por ano ficou ~0 (entre -0,05 e 0,09) em todas as
  culturas. Tambem testados, sem melhora relevante: agregar por ponto da
  grade POWER (melhor caso amendoim/tmax R2=0,13) e clima mes a mes com
  Ridge (R2 de -0,35 a 0,12). Causas provaveis: 23-41% dos rendimentos
  municipais da PAM repetem o ano anterior (estimativa, nao medicao) e o
  clima de 0,5 grau e grosso demais para o municipio.
  O que se sustenta (IC 90% sem cruzar zero): amendoim -6,2% por +1 grau
  na tmax media da safra; milho -5,5% por mes seco a mais na safra. Na media estadual por ano o sinal tem o
  sentido esperado (chuva +, calor -; r ~0,4-0,5 em soja/milho/cana/
  amendoim) e os piores anos sao 2014 e 2024 (secas). Use os coeficientes
  so com a coluna efeito_confiavel e citando o R2.

Entrada: data/processed/modelo_produtividade/dataset_sp.parquet
Saida:   data/processed/modelo_produtividade/coeficientes.parquet
Uso:     python produtividade_clima.py
Testes:  cd web/Backend && .venv/bin/python -m pytest tests
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GroupKFold, cross_val_predict

PASTA = Path(__file__).resolve().parents[4] / "data" / "processed" / "modelo_produtividade"
ENTRADA = PASTA / "dataset_sp.parquet"
SAIDA = PASTA / "coeficientes.parquet"

AREA_MINIMA_HA = 50   # abaixo disso a PAM e muito ruidosa
ANOS_MINIMOS = 10     # por municipio, para estimar a tendencia
ANOMALIA_MAX = 80     # % -- acima disso e quase sempre erro de registro
VARIAVEIS = {
    "chuva_anom_100mm": "Chuva da safra (+100 mm)",
    "tmax_anom_c": "Temperatura máxima média da safra (+1 °C)",
    "meses_secos_anom": "Meses secos na safra (+1 mês com < 50 mm)",
}
N_BOOTSTRAP = 300
# Laranja: rendimento de 2000-2005 dominado por doenca (CVC/greening),
# correlacao com clima sai invertida -- nao modelar com clima.
CULTURAS_EXCLUIDAS = {"laranja"}


def _sem_tendencia(anos: pd.Series, valores: pd.Series) -> np.ndarray:
    v = valores.to_numpy(dtype=float)
    return v - np.polyval(np.polyfit(anos, v, 1), anos)


def preparar(df: pd.DataFrame) -> pd.DataFrame:
    df = df[~df["cultura"].isin(CULTURAS_EXCLUIDAS)]
    df = df[(df["area_plantada_ha"] >= AREA_MINIMA_HA) & (df["rendimento_kg_ha"] > 0)].copy()
    # 23-41% dos rendimentos municipais da PAM repetem o ano anterior
    # (estimativa copiada, nao medida): ruido puro para medir clima.
    df = df.sort_values(["cultura", "geocodigo_ibge", "ano"])
    repetido = df.groupby(["cultura", "geocodigo_ibge"])["rendimento_kg_ha"].diff() == 0
    df = df[~repetido]
    partes = []
    for _, g in df.groupby(["cultura", "geocodigo_ibge"]):
        if len(g) < ANOS_MINIMOS:
            continue
        coef = np.polyfit(g["ano"], g["rendimento_kg_ha"], 1)
        tendencia = np.polyval(coef, g["ano"])
        if (tendencia <= 0).any():
            continue
        # O clima tambem perde a tendencia linear (nao so a media): se a
        # tmax sobe ao longo dos anos, a tendencia do rendimento absorveria
        # parte do efeito e o coeficiente sairia atenuado (bug pego por
        # tests/test_produtividade_clima.py). O efeito medido e o da
        # variacao de um ano para o outro.
        g = g.assign(
            anomalia_rendimento_pct=(g["rendimento_kg_ha"] / tendencia - 1) * 100,
            chuva_anom_100mm=_sem_tendencia(g["ano"], g["chuva_safra_mm"]) / 100,
            tmax_anom_c=_sem_tendencia(g["ano"], g["tmax_safra_c"]),
            meses_secos_anom=_sem_tendencia(g["ano"], g["meses_secos"]),
        )
        partes.append(g)
    out = pd.concat(partes, ignore_index=True)
    return out[out["anomalia_rendimento_pct"].abs() <= ANOMALIA_MAX]


def ajustar_cultura(g: pd.DataFrame, rng: np.random.Generator) -> list[dict]:
    X, y, anos = g[list(VARIAVEIS)].to_numpy(), g["anomalia_rendimento_pct"].to_numpy(), g["ano"].to_numpy()
    # Peso = area plantada: municipio grande pesa mais (e reporta melhor).
    w = g["area_plantada_ha"].to_numpy()
    modelo = LinearRegression().fit(X, y, sample_weight=w)

    previsto = cross_val_predict(LinearRegression(), X, y, groups=anos, cv=GroupKFold(n_splits=5),
                                 params={"sample_weight": w})
    r2_cv = 1 - (w * (y - previsto) ** 2).sum() / (w * (y - np.average(y, weights=w)) ** 2).sum()

    anos_unicos = np.unique(anos)
    boot = []
    for _ in range(N_BOOTSTRAP):
        amostra = rng.choice(anos_unicos, size=len(anos_unicos), replace=True)
        idx = np.concatenate([np.flatnonzero(anos == a) for a in amostra])
        boot.append(LinearRegression().fit(X[idx], y[idx], sample_weight=w[idx]).coef_)
    boot = np.array(boot)

    return [{
        "cultura": g["cultura"].iat[0],
        "variavel": var,
        "descricao": desc,
        "efeito_pct": round(float(modelo.coef_[i]), 2),
        "ic90_inf": round(float(np.percentile(boot[:, i], 5)), 2),
        "ic90_sup": round(float(np.percentile(boot[:, i], 95)), 2),
        # IC que cruza zero = nao da para afirmar o sinal do efeito.
        "efeito_confiavel": bool(np.sign(np.percentile(boot[:, i], 5)) == np.sign(np.percentile(boot[:, i], 95))),
        "r2_validacao_por_ano": round(float(r2_cv), 3),
        "n_municipio_anos": len(g),
        "n_municipios": g["geocodigo_ibge"].nunique(),
        "periodo": f"{anos.min()}-{anos.max()}",
    } for i, (var, desc) in enumerate(VARIAVEIS.items())]


def treinar() -> pd.DataFrame:
    dados = preparar(pd.read_parquet(ENTRADA))
    rng = np.random.default_rng(42)
    linhas = []
    for cultura, g in dados.groupby("cultura"):
        linhas += ajustar_cultura(g, rng)
    coef = pd.DataFrame(linhas)
    coef["fonte"] = "PAM/IBGE 5457 + NASA POWER (mensal, MERRA-2)"
    coef.to_parquet(SAIDA, index=False)
    return coef


def efeito_estimado(coef: pd.DataFrame, cultura: str, chuva_anom_mm: float = 0,
                    tmax_anom_c: float = 0, meses_secos_anom: float = 0) -> dict:
    """Aplica os coeficientes a uma anomalia climatica (ex.: tendencia observada)."""
    c = coef[coef["cultura"] == cultura].set_index("variavel")
    entradas = {"chuva_anom_100mm": chuva_anom_mm / 100, "tmax_anom_c": tmax_anom_c,
                "meses_secos_anom": meses_secos_anom}
    partes = {v: round(float(c.at[v, "efeito_pct"] * x), 2) for v, x in entradas.items()}
    return {"cultura": cultura, "variacao_rendimento_pct": round(sum(partes.values()), 2), "por_variavel": partes}


if __name__ == "__main__":
    coef = treinar()
    pd.set_option("display.width", 200)
    print(coef[["cultura", "variavel", "efeito_pct", "ic90_inf", "ic90_sup", "efeito_confiavel",
                "r2_validacao_por_ano", "n_municipio_anos"]].to_string(index=False))
    print(f"-> {SAIDA}")
