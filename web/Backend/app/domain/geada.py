"""Risco de geada a partir da temperatura mínima diária do ar (NASA POWER, T2M_MIN).

Regra pura, sem rede: recebe a série diária e devolve, por mês, com que frequência
houve geada nos anos observados. Quem busca a série é services/geada.py.

Método (explicável, sem caixa-preta):
1. Só entram anos completos (>= 365 dias com mínima válida). Ano pela metade
   faria um mês sem dado parecer "sem geada".
2. Um dia conta como "dia de geada" quando a mínima do ar a 2 m fica <= limiar.
3. Por mês: probabilidade = fração dos anos com pelo menos 1 dia de geada naquele
   mês; também a média de dias de geada por ano e a menor mínima já vista.
4. Nível geral = pela maior probabilidade mensal (ver CORTES_NIVEL).
5. Faixa de incerteza de cada probabilidade: intervalo de Wilson de 90% sobre
   "k anos com geada em n anos". Mede só o erro de ter poucos anos de série
   (ex.: 0 em 31 anos não quer dizer "nunca": a faixa vai de 0% a ~8%). NÃO
   mede o erro da grade nem do ar vs. folha (ver limites), que não tem número.

Limites (devem aparecer na UI):
- POWER é grade de ~0,5 grau, não estação no talhão. Baixadas e fundos de vale
  geam mais que a média da célula.
- A temperatura é do ar a 2 m; a relva/folha costuma ficar alguns graus mais fria
  em noite limpa e sem vento. Por isso o limiar padrão é 2 °C, e não 0 °C.
- Probabilidade histórica, não previsão do próximo inverno.

PENDENTE DE FONTE (não tratar como regra agronômica validada):
LIMIAR_GEADA_C e CORTES_NIVEL são valores iniciais da equipe. Precisam de
referência agrometeorológica (ex.: INMET/Embrapa para o Brasil, UC IPM/NOAA para
a Califórnia) ou revisão de especialista antes de sair do beta.
"""

from __future__ import annotations

import math
from collections import defaultdict
from collections.abc import Iterable, Mapping

# Mínima do ar a 2 m que já indica geada provável na relva (ver limites acima).
LIMIAR_GEADA_C = 2.0
# Mínima do ar a 2 m de geada forte, que congela o ar no próprio abrigo.
LIMIAR_GEADA_FORTE_C = 0.0
# Probabilidade mensal máxima -> nível. < 10% baixo; até 1 em 3 anos médio; acima, alto.
CORTES_NIVEL = ((0.10, "baixo"), (1 / 3, "medio"))
# A partir desta probabilidade o mês entra em "meses_com_risco".
PROBABILIDADE_MES_COM_RISCO = 0.10
DIAS_ANO_COMPLETO = 365
# Confiança da faixa de incerteza (intervalo de Wilson) e o z correspondente.
CONFIANCA_INTERVALO = 0.90
Z_INTERVALO = 1.6449


def _ano_mes(data: str) -> tuple[int, int]:
    return int(data[0:4]), int(data[5:7])


def anos_completos(serie: Iterable[Mapping], campo: str = "temperatura_minima_c") -> list[int]:
    """Anos com pelo menos 365 dias de mínima válida."""
    dias = defaultdict(int)
    for linha in serie:
        if linha.get(campo) is not None:
            dias[_ano_mes(linha["data"])[0]] += 1
    return sorted(ano for ano, n in dias.items() if n >= DIAS_ANO_COMPLETO)


def intervalo_wilson(sucessos: int, total: int, z: float = Z_INTERVALO) -> tuple[float, float]:
    """Faixa da proporção sucessos/total (Wilson). Funciona com 0 e com total (sem faixa vazia)."""
    if total <= 0:
        raise ValueError("total precisa ser positivo")
    p = sucessos / total
    divisor = 1 + z * z / total
    centro = (p + z * z / (2 * total)) / divisor
    meia = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / divisor
    return round(max(0.0, centro - meia), 3), round(min(1.0, centro + meia), 3)


def nivel_por_probabilidade(probabilidade: float) -> str:
    for corte, nivel in CORTES_NIVEL:
        if probabilidade < corte:
            return nivel
    return "alto"


def calcular_risco_geada(
    serie: Iterable[Mapping],
    ano_inicio: int | None = None,
    ano_fim: int | None = None,
    limiar_c: float = LIMIAR_GEADA_C,
    limiar_forte_c: float = LIMIAR_GEADA_FORTE_C,
) -> dict:
    """Frequência mensal de geada nos anos completos da série.

    `serie`: dicionários com `data` ("AAAA-MM-DD") e `temperatura_minima_c`
    (°C; None = ausente, nunca zero). `ano_inicio`/`ano_fim` recortam o período.
    """
    serie = [
        linha
        for linha in serie
        if (ano_inicio is None or int(linha["data"][0:4]) >= ano_inicio)
        and (ano_fim is None or int(linha["data"][0:4]) <= ano_fim)
    ]
    anos = anos_completos(serie)
    if not anos:
        raise ValueError("série sem nenhum ano completo de temperatura mínima")
    validos = set(anos)

    dias_geada = defaultdict(int)  # (ano, mes) -> dias com mínima <= limiar
    dias_forte = defaultdict(int)
    menor = {}  # mes -> menor mínima já vista
    for linha in serie:
        tmin = linha.get("temperatura_minima_c")
        if tmin is None:
            continue
        ano, mes = _ano_mes(linha["data"])
        if ano not in validos:
            continue
        menor[mes] = min(menor.get(mes, tmin), tmin)
        if tmin <= limiar_c:
            dias_geada[ano, mes] += 1
        if tmin <= limiar_forte_c:
            dias_forte[ano, mes] += 1

    n = len(anos)
    meses = []
    for mes in range(1, 13):
        com_geada = sum(1 for ano in anos if dias_geada[ano, mes] > 0)
        com_forte = sum(1 for ano in anos if dias_forte[ano, mes] > 0)
        faixa_min, faixa_max = intervalo_wilson(com_geada, n)
        meses.append(
            {
                "mes": mes,
                "probabilidade_geada": round(com_geada / n, 3),
                "probabilidade_geada_min": faixa_min,
                "probabilidade_geada_max": faixa_max,
                "probabilidade_geada_forte": round(com_forte / n, 3),
                "anos_com_geada": com_geada,
                "dias_geada_medio": round(sum(dias_geada[ano, mes] for ano in anos) / n, 2),
                "menor_minima_c": round(menor[mes], 1) if mes in menor else None,
            }
        )

    pior = max(meses, key=lambda m: m["probabilidade_geada"])
    anos_com_alguma = sum(1 for ano in anos if any(dias_geada[ano, mes] for mes in range(1, 13)))
    ano_min, ano_max = intervalo_wilson(anos_com_alguma, n)
    return {
        "nivel": nivel_por_probabilidade(pior["probabilidade_geada"]),
        # Nível que a faixa de incerteza permite, do mais brando ao mais grave.
        "nivel_min": nivel_por_probabilidade(max(m["probabilidade_geada_min"] for m in meses)),
        "nivel_max": nivel_por_probabilidade(max(m["probabilidade_geada_max"] for m in meses)),
        "mes_mais_arriscado": pior["mes"] if pior["probabilidade_geada"] > 0 else None,
        "meses_com_risco": [
            m["mes"] for m in meses if m["probabilidade_geada"] >= PROBABILIDADE_MES_COM_RISCO
        ],
        "probabilidade_ano": round(anos_com_alguma / n, 3),
        "probabilidade_ano_min": ano_min,
        "probabilidade_ano_max": ano_max,
        "confianca_intervalo": CONFIANCA_INTERVALO,
        "meses": meses,
        "limiar_c": limiar_c,
        "limiar_forte_c": limiar_forte_c,
        "periodo_inicio": anos[0],
        "periodo_fim": anos[-1],
        "anos_analisados": n,
    }


def probabilidade_na_janela(resultado: Mapping, serie: Iterable[Mapping], meses: Iterable[int]) -> float:
    """Fração dos anos com pelo menos 1 dia de geada em QUALQUER um dos `meses`.

    Serve para a janela de uma cultura (ex.: plantio em jun-ago). Não é a soma das
    probabilidades mensais: o mesmo inverno frio costuma gear em vários meses.
    Usa o mesmo período e limiar de `resultado` (saída de calcular_risco_geada).
    """
    meses = set(meses)
    serie = list(serie)
    inicio, fim, limiar = resultado["periodo_inicio"], resultado["periodo_fim"], resultado["limiar_c"]
    anos = set(anos_completos(s for s in serie if inicio <= int(s["data"][0:4]) <= fim))
    com_geada = set()
    for linha in serie:
        tmin = linha.get("temperatura_minima_c")
        if tmin is None:
            continue
        ano, mes = _ano_mes(linha["data"])
        if ano in anos and mes in meses and tmin <= limiar:
            com_geada.add(ano)
    return round(len(com_geada) / len(anos), 3) if anos else 0.0
