"""Tendência hídrica de longo prazo: a chuva do ano vem caindo, subindo ou está estável?

Regra pura, sem rede. Quem busca a série diária da NASA POWER (PRECTOTCORR) é
services/tendencia_hidrica.py.

Método (padrão em hidrologia, explicável, sem caixa-preta):
1. Só entram anos completos (>= 365 dias com chuva válida); ausente nunca vira 0 mm.
2. Soma a chuva de cada ano.
3. Teste de Mann-Kendall (Mann, 1945; Kendall, 1975): responde se a sequência de
   anos tem tendência de verdade ou se a diferença é só a variação normal de um
   ano para outro. Não supõe distribuição normal.
4. Inclinação de Sen (Sen, 1968): mediana das inclinações entre todos os pares de
   anos, em mm/ano. Um ano muito fora do comum não puxa o resultado.
5. Classificação: p >= ALFA -> "estavel" (sem tendência clara); senão "secando"
   ou "mais_chuvoso" pelo sinal da inclinação.

Limites (devem aparecer na UI):
- NASA POWER (MERRA-2) é reanálise em grade de ~0,5 grau, não pluviômetro. Uma
  tendência forte deve ser conferida com estação (INMET/NOAA) antes de decisão cara.
- Tendência do passado não garante o futuro.
"""

from __future__ import annotations

import math
from collections import defaultdict
from collections.abc import Iterable, Mapping
from statistics import NormalDist, median

CAMPO = "precipitacao_acumulada_mm"
DIAS_ANO_COMPLETO = 365
# Nível de significância do Mann-Kendall (5%, o usual em hidrologia).
ALFA = 0.05
# Com menos anos que isso o teste não tem poder: melhor não afirmar nada.
MINIMO_ANOS = 10


def chuva_anual(serie: Iterable[Mapping]) -> list[dict]:
    """[{ano, chuva_mm}] dos anos completos, em ordem."""
    soma = defaultdict(float)
    dias = defaultdict(int)
    for linha in serie:
        valor = linha.get(CAMPO)
        if valor is None:
            continue
        ano = int(linha["data"][0:4])
        soma[ano] += valor
        dias[ano] += 1
    return [
        {"ano": ano, "chuva_mm": round(soma[ano], 1)}
        for ano in sorted(soma)
        if dias[ano] >= DIAS_ANO_COMPLETO
    ]


def mann_kendall(valores: list[float]) -> tuple[int, float]:
    """Estatística S e p-valor bicaudal, com correção de empates e de continuidade."""
    n = len(valores)
    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diferenca = valores[j] - valores[i]
            s += (diferenca > 0) - (diferenca < 0)
    empates = defaultdict(int)
    for v in valores:
        empates[v] += 1
    variancia = (
        n * (n - 1) * (2 * n + 5) - sum(t * (t - 1) * (2 * t + 5) for t in empates.values() if t > 1)
    ) / 18
    if variancia <= 0 or s == 0:
        return s, 1.0
    z = (s - 1) / math.sqrt(variancia) if s > 0 else (s + 1) / math.sqrt(variancia)
    return s, 2 * (1 - NormalDist().cdf(abs(z)))


def inclinacao_sen(anos: list[int], valores: list[float]) -> float:
    """Mediana das inclinações entre todos os pares (unidade de valores por ano)."""
    inclinacoes = [
        (valores[j] - valores[i]) / (anos[j] - anos[i])
        for i in range(len(anos) - 1)
        for j in range(i + 1, len(anos))
    ]
    return median(inclinacoes)


def calcular_tendencia_hidrica(
    serie: Iterable[Mapping], ano_inicio: int | None = None, ano_fim: int | None = None
) -> dict:
    """Tendência da chuva anual nos anos completos da série (recortada se pedido)."""
    anual = [
        a
        for a in chuva_anual(serie)
        if (ano_inicio is None or a["ano"] >= ano_inicio) and (ano_fim is None or a["ano"] <= ano_fim)
    ]
    if len(anual) < MINIMO_ANOS:
        raise ValueError(f"série com {len(anual)} anos completos; o mínimo é {MINIMO_ANOS}")
    anos = [a["ano"] for a in anual]
    valores = [a["chuva_mm"] for a in anual]
    _, p = mann_kendall(valores)
    por_ano = inclinacao_sen(anos, valores)
    media = sum(valores) / len(valores)
    intercepto = median(v - por_ano * a for a, v in zip(anos, valores))
    if p >= ALFA:
        tendencia = "estavel"
    else:
        tendencia = "secando" if por_ano < 0 else "mais_chuvoso"
    return {
        "tendencia": tendencia,
        "mm_por_decada": round(por_ano * 10, 1),
        "pct_por_decada": round(100 * por_ano * 10 / media, 1) if media else 0.0,
        "p_valor": round(p, 4),
        "alfa": ALFA,
        "media_anual_mm": round(media, 1),
        # Valor da reta de Sen no primeiro e no último ano (para desenhar a linha).
        "reta_inicio_mm": round(intercepto + por_ano * anos[0], 1),
        "reta_fim_mm": round(intercepto + por_ano * anos[-1], 1),
        "anos": anual,
        "periodo_inicio": anos[0],
        "periodo_fim": anos[-1],
        "anos_analisados": len(anos),
        "metodo": "Mann-Kendall (5%) + inclinação de Sen sobre a chuva anual",
    }
