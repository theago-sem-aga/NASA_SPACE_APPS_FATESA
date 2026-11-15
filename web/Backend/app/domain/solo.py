"""Classificacao simplificada de textura do solo a partir de areia/argila (%).

Regra pura, sem rede -- usa os percentuais ja coletados do USDA Soil Data
Access (EUA, unico ponto de origem ligado ao relatorio por enquanto; ver
services/analises.py). So 3 classes (TexturaSolo em app/schemas/analises.py),
nao o triangulo textural completo de 12 classes do USDA -- simplificacao
proposital pra caber nas 3 faixas que a tela ja usa.

PENDENTE DE REVISAO: os limiares abaixo sao uma escolha inicial da equipe,
nao o triangulo oficial. Precisam de validacao agronomica antes de sair do beta.
"""

from __future__ import annotations

LIMIAR_ARGILA_PCT = 35.0
LIMIAR_AREIA_PCT = 70.0


def classificar_textura(areia_pct: float, argila_pct: float) -> str:
    """'argilosa' | 'arenosa' | 'media', pelas faixas documentadas acima."""
    if argila_pct >= LIMIAR_ARGILA_PCT:
        return "argilosa"
    if areia_pct >= LIMIAR_AREIA_PCT:
        return "arenosa"
    return "media"
