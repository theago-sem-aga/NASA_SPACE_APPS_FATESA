"""Estresse térmico a partir da temperatura máxima diária do ar (NASA POWER, T2M_MAX).

Regra pura, sem rede: mesma estrutura de app/domain/geada.py, só que pro lado
do calor. Quem busca a série é services/estresse_termico.py.

Método (explicável, sem caixa-preta):
1. Só entram anos completos (>= 365 dias com máxima válida) -- mesmo motivo
   de geada.py: ano pela metade faria um mês sem dado parecer "sem calor".
2. Um dia conta como "dia de calor" quando a máxima do ar a 2 m fica >= limiar.
3. Por mês: probabilidade = fração dos anos com pelo menos 1 dia de calor
   naquele mês; também a média de dias de calor por ano, a maior e a média
   das máximas já vistas.
4. Mês de risco = probabilidade >= 0,5 (calor forte em pelo menos metade
   dos anos observados).
5. Nível geral: alto se o pior mês (maior média de dias de calor por ano)
   tiver em média >= 5 dias de calor por ano; médio se há algum mês de
   risco sem chegar nesse corte; baixo se nenhum mês chegar a mês de risco.

Limites (devem aparecer na UI, mesmos de geada.py):
- POWER é grade regional, não estação no talhão.
- Probabilidade histórica, não previsão do próximo verão.

PENDENTE DE FONTE (não tratar como regra agronômica validada):
LIMIAR_CALOR_C, PROBABILIDADE_MES_COM_RISCO e DIAS_CALOR_NIVEL_ALTO são
valores iniciais da equipe (mesmos já usados no mock histórico real de SJRP,
ver web/Frontend/src/api/mock/calorMock.ts), pendentes de referência
agrometeorológica por cultura antes de saírem do beta.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable, Mapping

from app.domain.geada import anos_completos

CAMPO_TEMPERATURA_MAXIMA = "temperatura_maxima_c"
# Máxima do ar a 2 m que já indica calor forte (ver limites acima).
LIMIAR_CALOR_C = 35.0
# A partir desta probabilidade o mês entra em "meses_com_risco".
PROBABILIDADE_MES_COM_RISCO = 0.50
# Dias de calor por ano, em média no pior mês, que já classificam o nível como alto.
DIAS_CALOR_NIVEL_ALTO = 5.0


def _ano_mes(data: str) -> tuple[int, int]:
    return int(data[0:4]), int(data[5:7])


def calcular_estresse_termico(
    serie: Iterable[Mapping],
    ano_inicio: int | None = None,
    ano_fim: int | None = None,
    limiar_c: float = LIMIAR_CALOR_C,
) -> dict:
    """Frequência mensal de calor forte nos anos completos da série.

    `serie`: dicionários com `data` ("AAAA-MM-DD") e `temperatura_maxima_c`
    (°C; None = ausente, nunca zero). `ano_inicio`/`ano_fim` recortam o período.
    """
    serie = [
        linha
        for linha in serie
        if (ano_inicio is None or int(linha["data"][0:4]) >= ano_inicio)
        and (ano_fim is None or int(linha["data"][0:4]) <= ano_fim)
    ]
    anos = anos_completos(serie, campo=CAMPO_TEMPERATURA_MAXIMA)
    if not anos:
        raise ValueError("série sem nenhum ano completo de temperatura máxima")
    validos = set(anos)

    dias_calor = defaultdict(int)  # (ano, mes) -> dias com máxima >= limiar
    maior = {}  # mes -> maior máxima já vista
    soma_maxima = defaultdict(float)
    conta_maxima = defaultdict(int)
    for linha in serie:
        tmax = linha.get(CAMPO_TEMPERATURA_MAXIMA)
        if tmax is None:
            continue
        ano, mes = _ano_mes(linha["data"])
        if ano not in validos:
            continue
        maior[mes] = max(maior.get(mes, tmax), tmax)
        soma_maxima[mes] += tmax
        conta_maxima[mes] += 1
        if tmax >= limiar_c:
            dias_calor[ano, mes] += 1

    n = len(anos)
    meses = []
    for mes in range(1, 13):
        com_calor = sum(1 for ano in anos if dias_calor[ano, mes] > 0)
        meses.append(
            {
                "mes": mes,
                "probabilidade_calor": round(com_calor / n, 3),
                "anos_com_calor": com_calor,
                "dias_calor_medio": round(sum(dias_calor[ano, mes] for ano in anos) / n, 2),
                "maior_maxima_c": round(maior[mes], 1),
                "maxima_media_c": round(soma_maxima[mes] / conta_maxima[mes], 1),
            }
        )

    pior = max(meses, key=lambda m: m["dias_calor_medio"])
    algum_mes_de_risco = any(m["probabilidade_calor"] >= PROBABILIDADE_MES_COM_RISCO for m in meses)
    nivel = (
        "alto"
        if pior["dias_calor_medio"] >= DIAS_CALOR_NIVEL_ALTO
        else "medio"
        if algum_mes_de_risco
        else "baixo"
    )
    return {
        "nivel": nivel,
        "mes_mais_arriscado": pior["mes"] if pior["dias_calor_medio"] > 0 else None,
        "meses_com_risco": [
            m["mes"] for m in meses if m["probabilidade_calor"] >= PROBABILIDADE_MES_COM_RISCO
        ],
        "dias_calor_ano": round(sum(m["dias_calor_medio"] for m in meses), 1),
        "meses": meses,
        "limiar_c": limiar_c,
        "periodo_inicio": anos[0],
        "periodo_fim": anos[-1],
        "anos_analisados": n,
    }
