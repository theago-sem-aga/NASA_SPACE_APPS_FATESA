"""Idioma dos textos que a API devolve (caminhos, limitações, nomes).

O front manda `idioma` ("pt" ou "en"); sem ele, a API responde em português,
como sempre fez. Inglês é o idioma principal da interface (ver o front,
src/i18n/idioma.ts), mas o padrão da API continua "pt" para não mudar quem já
chama sem o campo.
"""

from typing import Literal

Idioma = Literal["pt", "en"]


def texto(idioma: str, pt: str, en: str) -> str:
    return en if idioma == "en" else pt
