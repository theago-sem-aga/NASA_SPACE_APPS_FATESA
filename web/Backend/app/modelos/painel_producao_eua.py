"""Painel "Sua colheita" pra coordenadas dos EUA -- mesmo conceito do painel
brasileiro (painel_producao.py), com fontes americanas: Census Bureau
Geocoder (condado, ao vivo) + USDA NASS QuickStats (produção, ao vivo) +
NASA POWER (clima, multi-regional). Funciona em qualquer coordenada dos
EUA, não um condado fixo.

Unidade do rendimento fica NATIVA da NASS (ex.: "LB / ACRE", "BU / ACRE")
-- nunca convertida pra kg/ha aqui: bushel pesa diferente por cultura
(milho, soja e trigo têm pesos-padrão diferentes), forçar um fator único
arriscaria inventar a conversão errada. O campo `rendimento_unidade`
avisa a tela qual unidade mostrar.
"""

from __future__ import annotations

import datetime as dt

from app.integrations.census_geocoder import buscar_condado_ponto
from app.integrations.nass_quickstats import buscar_serie_condado
from app.modelos.clima_anual import comparar_ano

ANOS_MEDIA = 5
LIMIAR_SITUACAO_PCT = 5
ANO_INICIO_NASS = 2010

# cultura_id do front (Pictograma.tsx) -> commodity_desc da NASS.
CULTURAS = {
    "milho": ("CORN", "Milho"),
    "soja": ("SOYBEANS", "Soja"),
    "trigo": ("WHEAT", "Trigo"),
    "cana_de_acucar": ("SUGARCANE", "Cana-de-açúcar"),
    "amendoim": ("PEANUTS", "Amendoim"),
    "sorgo_forrageiro": ("SORGHUM", "Sorgo"),
}


def _situacao(serie_por_ano: dict[int, float], unidade: str | None) -> dict:
    anos = sorted(serie_por_ano)
    ultimo_ano = anos[-1]
    ultimo = serie_por_ano[ultimo_ano]
    anteriores = [serie_por_ano[a] for a in anos if a < ultimo_ano][-ANOS_MEDIA:]
    if not anteriores:
        return {
            "ano": ultimo_ano, "situacao": "sem_plantio",
            "rendimento_nativo": None, "rendimento_unidade": unidade,
            "rendimento_medio_anterior_nativo": None,
        }
    media = sum(anteriores) / len(anteriores)
    dif = (ultimo / media - 1) * 100 if media else 0.0
    situacao = "acima" if dif > LIMIAR_SITUACAO_PCT else "abaixo" if dif < -LIMIAR_SITUACAO_PCT else "normal"
    return {
        "ano": ultimo_ano, "situacao": situacao,
        "rendimento_nativo": round(ultimo, 1), "rendimento_unidade": unidade,
        "rendimento_medio_anterior_nativo": round(media, 1),
    }


def montar_painel(latitude: float, longitude: float) -> dict | None:
    """None quando o ponto cai fora dos EUA (Census Geocoder sem condado)."""
    local = buscar_condado_ponto(latitude, longitude)
    if local is None:
        return None

    ano_fim = dt.date.today().year
    culturas = []
    for cultura_id, (commodity, nome) in CULTURAS.items():
        resultado = buscar_serie_condado(
            local["condado"], local["estado"], commodity, "YIELD", ANO_INICIO_NASS, ano_fim
        )
        if not resultado["disponivel"]:
            continue
        culturas.append({"cultura_id": cultura_id, "nome": nome, **_situacao(resultado["serie_por_ano"], resultado["unidade"])})

    ano_colheita = max((c["ano"] for c in culturas), default=None)
    clima = comparar_ano(latitude, longitude, ano_colheita)
    limitacoes = [
        "Números do condado todo, não da sua propriedade.",
        "Rendimento na unidade nativa da NASS (não convertido pra kg/ha): bushel pesa "
        "diferente por cultura, então converter com um fator único arriscaria errar.",
    ]
    if clima is None:
        limitacoes.append("Clima sem dado: a série diária da NASA POWER não respondeu ou está incompleta.")
    return {
        "condado": local["condado"],
        "estado": local["estado"],
        "culturas": culturas,
        "clima": clima,
        "fontes": [
            "USDA NASS QuickStats (estatística oficial de safra)",
            "Census Bureau Geocoder (condado)",
            "NASA POWER (clima)",
        ],
        "limitacoes": limitacoes,
        "tipo_dado": "observacao_historica",
        "gerado_em": dt.date.today().isoformat(),
    }
