"""Classificação de relevo a partir da declividade entre a coordenada e 4
pontos vizinhos (norte/sul/leste/oeste), medidos via USGS 3DEP.

Regra pura, sem rede. Declividade = maior diferença de elevação entre o
centro e os vizinhos, dividida pela distância entre eles, em %.

PENDENTE DE FONTE: os limiares (plano < 3%, suave_ondulado 3-8%, ondulado
> 8%) são uma escolha inicial da equipe (já sugerida em tipos.ts do front),
não uma norma oficial de classificação de relevo agrícola.
"""

from __future__ import annotations

LIMIAR_PLANO_PCT = 3.0
LIMIAR_SUAVE_PCT = 8.0


def classificar_relevo(declividade_pct: float) -> str:
    """'plano' | 'suave_ondulado' | 'ondulado', pelas faixas documentadas acima."""
    if declividade_pct < LIMIAR_PLANO_PCT:
        return "plano"
    if declividade_pct < LIMIAR_SUAVE_PCT:
        return "suave_ondulado"
    return "ondulado"


def declividade_de_elevacoes(elevacoes: dict[str, float], distancia_m: float) -> float:
    """``elevacoes``: {'centro', 'norte', 'sul', 'leste', 'oeste'} em metros.
    ``distancia_m``: distância do centro a cada vizinho (igual pros 4)."""
    centro = elevacoes["centro"]
    maior_diferenca = max(abs(centro - v) for chave, v in elevacoes.items() if chave != "centro")
    return round((maior_diferenca / distancia_m) * 100, 2)
