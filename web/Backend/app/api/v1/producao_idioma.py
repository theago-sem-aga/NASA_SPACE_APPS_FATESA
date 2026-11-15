"""Textos do painel "Sua colheita" em inglês (?idioma=en em /producao).

Os painéis (modelos/painel_producao*.py) montam os textos em português; aqui,
para idioma=en, troca o nome das culturas (pelo cultura_id) e as frases fixas
de limitações e fontes por tradução exata. Frase que não estiver na tabela
fica como veio (português) -- nunca vira uma tradução inventada na hora.
"""

from __future__ import annotations

NOME_CULTURA_EN = {
    "cana_de_acucar": "Sugarcane",
    "soja": "Soybeans",
    "milho": "Corn",
    "mandioca": "Cassava",
    "trigo": "Wheat",
    "amendoim": "Peanuts",
    "sorgo_forrageiro": "Sorghum",
    "pastagem": "Pasture",
}

TEXTO_EN = {
    "Números da cidade toda, não da sua roça.": "Numbers for the whole town, not your farm.",
    "A previsão vale para os próximos 3 meses. Ninguém consegue prever a chuva de um ano inteiro.":
        "The forecast covers the next 3 months. Nobody can forecast a whole year of rain.",
    "Clima sem dado: a série diária da NASA POWER não respondeu ou está incompleta.":
        "Climate without data: the NASA POWER daily series did not respond or is incomplete.",
    "Números do condado todo, não da sua propriedade.": "Numbers for the whole county, not your property.",
    "Rendimento na unidade nativa da NASS (não convertido pra kg/ha): bushel pesa "
    "diferente por cultura, então converter com um fator único arriscaria errar.":
        "Yield in NASS native units (not converted to kg/ha): a bushel weighs differently for each crop, "
        "so converting with a single factor would risk being wrong.",
    "IBGE – Produção Agrícola Municipal (tabela 5457)": "IBGE – Municipal Agricultural Production (table 5457)",
    "NASA POWER (MERRA-2)": "NASA POWER (MERRA-2)",
    "INMET, INPE e FUNCEME – prognóstico climático trimestral": "INMET, INPE and FUNCEME – quarterly climate outlook",
    "USDA NASS QuickStats (estatística oficial de safra)": "USDA NASS QuickStats (official crop statistics)",
    "Census Bureau Geocoder (condado)": "Census Bureau Geocoder (county)",
    "NASA POWER (clima)": "NASA POWER (climate)",
}


def traduzir_painel(painel: dict, idioma: str) -> dict:
    if idioma != "en":
        return painel
    saida = dict(painel)
    saida["culturas"] = [
        {**c, "nome": NOME_CULTURA_EN.get(c.get("cultura_id"), c.get("nome"))} for c in painel.get("culturas", [])
    ]
    saida["limitacoes"] = [TEXTO_EN.get(t, t) for t in painel.get("limitacoes", [])]
    saida["fontes"] = [TEXTO_EN.get(t, t) for t in painel.get("fontes", [])]
    return saida
