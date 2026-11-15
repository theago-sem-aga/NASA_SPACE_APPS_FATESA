"""Estresse vegetal: a planta está tão verde quanto costuma estar nesta época?

Regra pura, sem rede. Quem lê a série de NDVI do MODIS (MOD13Q1, 250 m, um
valor a cada 16 dias) é services/estresse_vegetal.py.

Método (explicável, sem caixa-preta):
1. Só entram fotos boas ou marginais (confiabilidade do pixel 0 ou 1); nuvem,
   neve e ausência ficam de fora, nunca viram 0.
2. "Esta época" = o mesmo período de 16 dias do ano (o MODIS começa os períodos
   sempre nos mesmos dias do ano: 1, 17, 33, ... 353).
3. Normal = os anos ANTERIORES no mesmo período (mediana e faixas de 10%, 25%,
   75% e 90%). O ano da foto não entra no próprio normal.
4. Posição da foto mais recente entre esses anos:
   - abaixo dos 10% mais baixos -> "muito_abaixo" (estresse: menos verde que em
     9 de cada 10 anos nesta época);
   - abaixo dos 25% -> "abaixo";
   - acima dos 90% -> "acima" (mais verde que o normal);
   - senão "normal".
5. Pixel que quase nunca tem planta (mediana do NDVI de todas as fotos abaixo de
   LIMIAR_SEM_VEGETACAO: cidade, água, rocha) -> "sem_vegetacao", sem nível.

Limites (devem aparecer na UI):
- NDVI baixo também é colheita, preparo do solo ou troca de cultura, não só
  estresse. Quem conhece o talhão confirma.
- Pixel de 250 m: o talhão pequeno se mistura com o vizinho.
- Cortes de 10%/25%/90% são estatísticos (posição entre os anos), não
  agronômicos; pendentes de revisão.
"""

from __future__ import annotations

import datetime as dt
from collections import defaultdict
from collections.abc import Iterable, Mapping
from statistics import median

CONFIABILIDADE_ACEITA = (0, 1)  # 0 bom, 1 marginal
LIMIAR_SEM_VEGETACAO = 0.20
MINIMO_ANOS = 8
DIAS_POR_PERIODO = 16
PERIODOS_NO_GRAFICO = 23  # um ano de fotos de 16 dias
CORTE_MUITO_ABAIXO = 0.10
CORTE_ABAIXO = 0.25
CORTE_ACIMA = 0.90


def periodo_do_ano(data: str) -> int:
    """0..22: o período de 16 dias do MODIS em que a data cai."""
    return (dt.date.fromisoformat(data).timetuple().tm_yday - 1) // DIAS_POR_PERIODO


def fotos_validas(serie: Iterable[Mapping]) -> list[dict]:
    """[{data, ndvi}] só com NDVI presente e pixel bom/marginal, em ordem de data."""
    saida = []
    for linha in serie:
        ndvi = linha.get("ndvi")
        confiabilidade = linha.get("confiabilidade_pixel")
        if ndvi is None or ndvi != ndvi:  # None ou NaN
            continue
        if confiabilidade is not None and confiabilidade == confiabilidade and int(confiabilidade) not in CONFIABILIDADE_ACEITA:
            continue
        saida.append({"data": str(linha["data"])[0:10], "ndvi": float(ndvi)})
    return sorted(saida, key=lambda f: f["data"])


def quantil(valores: list[float], q: float) -> float:
    """Quantil com interpolação linear (mesmo método padrão do numpy)."""
    ordenados = sorted(valores)
    posicao = q * (len(ordenados) - 1)
    baixo = int(posicao)
    alto = min(baixo + 1, len(ordenados) - 1)
    return ordenados[baixo] + (ordenados[alto] - ordenados[baixo]) * (posicao - baixo)


def _historico_por_periodo(fotos: list[dict]) -> dict[int, dict[int, float]]:
    """{periodo: {ano: ndvi}}."""
    por_periodo: dict[int, dict[int, float]] = defaultdict(dict)
    for f in fotos:
        por_periodo[periodo_do_ano(f["data"])][int(f["data"][0:4])] = f["ndvi"]
    return por_periodo


def _normal(por_periodo: dict[int, dict[int, float]], data: str) -> list[float]:
    """NDVI dos anos anteriores ao da data, no mesmo período."""
    ano = int(data[0:4])
    return [v for a, v in por_periodo.get(periodo_do_ano(data), {}).items() if a < ano]


def situacao_por_posicao(posicao: float) -> str:
    if posicao < CORTE_MUITO_ABAIXO:
        return "muito_abaixo"
    if posicao < CORTE_ABAIXO:
        return "abaixo"
    if posicao > CORTE_ACIMA:
        return "acima"
    return "normal"


def calcular_estresse_vegetal(serie: Iterable[Mapping]) -> dict:
    """Compara a foto válida mais recente com o normal da mesma época."""
    fotos = fotos_validas(serie)
    if not fotos:
        raise ValueError("série de NDVI sem nenhuma foto válida")
    por_periodo = _historico_por_periodo(fotos)
    atual = fotos[-1]
    normal = _normal(por_periodo, atual["data"])
    if len(normal) < MINIMO_ANOS:
        raise ValueError(f"só {len(normal)} anos para comparar nesta época; o mínimo é {MINIMO_ANOS}")

    mediana_geral = median(f["ndvi"] for f in fotos)
    # Posição: fração dos anos anteriores com NDVI menor que o de agora (empate conta meio).
    menores = sum(1 for v in normal if v < atual["ndvi"]) + 0.5 * sum(1 for v in normal if v == atual["ndvi"])
    posicao = menores / len(normal)
    mediana = median(normal)
    situacao = "sem_vegetacao" if mediana_geral < LIMIAR_SEM_VEGETACAO else situacao_por_posicao(posicao)

    grafico = []
    for f in fotos[-PERIODOS_NO_GRAFICO:]:
        anteriores = _normal(por_periodo, f["data"])
        ok = len(anteriores) >= MINIMO_ANOS
        grafico.append(
            {
                "data": f["data"],
                "ndvi": round(f["ndvi"], 3),
                "normal_mediana": round(median(anteriores), 3) if ok else None,
                "normal_p10": round(quantil(anteriores, 0.10), 3) if ok else None,
                "normal_p90": round(quantil(anteriores, 0.90), 3) if ok else None,
            }
        )

    anos = sorted({int(f["data"][0:4]) for f in fotos})
    return {
        "situacao": situacao,
        "data_foto": atual["data"],
        "ndvi_atual": round(atual["ndvi"], 3),
        "normal_mediana": round(mediana, 3),
        "normal_p10": round(quantil(normal, 0.10), 3),
        "normal_p25": round(quantil(normal, 0.25), 3),
        "normal_p75": round(quantil(normal, 0.75), 3),
        "normal_p90": round(quantil(normal, 0.90), 3),
        "anomalia_pct": round(100 * (atual["ndvi"] - mediana) / mediana, 1) if mediana else 0.0,
        "posicao": round(posicao, 3),
        "anos_mais_verdes": sum(1 for v in normal if v > atual["ndvi"]),
        "anos_comparados": len(normal),
        "ndvi_mediano_geral": round(mediana_geral, 3),
        "limiar_sem_vegetacao": LIMIAR_SEM_VEGETACAO,
        "ultimas_fotos": grafico,
        "periodo_inicio": anos[0],
        "periodo_fim": anos[-1],
        "metodo": (
            "NDVI MODIS (MOD13Q1, 16 dias) da foto mais recente comparado aos anos anteriores "
            "no mesmo período do ano (posição entre os anos; cortes 10%, 25% e 90%)"
        ),
    }
