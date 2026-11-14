"""Cliente de integração com USDA NASS QuickStats, ao vivo.

Requer chave gratuita (ver NASS_QUICKSTATS_API_KEY em web/.env). A API
é por condado/estado, não por coordenada -- diferente das demais
fontes "ao vivo" do projeto. Para a região piloto (Fresno County, CA),
o condado é fixo; mapear coordenada arbitrária para condado exigiria
um passo de geocodificação que não existe ainda (ver pendência em
docs/convencao_programacao.md).
"""

from __future__ import annotations

import os

import requests

QUICKSTATS_URL = "https://quickstats.nass.usda.gov/api/api_GET/"


def buscar_producao_condado(
    condado: str,
    estado_sigla: str,
    cultura: str,
    ano: int,
    timeout_s: int = 30,
) -> dict:
    """Busca estatisticas de producao (area, valor) pra um condado/cultura/ano.

    Retorna ``disponivel=False`` quando a NASS nao tem o dado pedido
    (cultura nao rastreada nesse condado, ano sem censo, etc.).
    """
    chave = os.environ.get("NASS_QUICKSTATS_API_KEY")
    if not chave:
        raise RuntimeError("NASS_QUICKSTATS_API_KEY nao configurada em web/.env")

    parametros = {
        "key": chave,
        "commodity_desc": cultura.upper(),
        "state_alpha": estado_sigla.upper(),
        "county_name": condado.upper(),
        "year": ano,
        "format": "JSON",
    }
    resposta = requests.get(QUICKSTATS_URL, params=parametros, timeout=timeout_s)
    if resposta.status_code != 200:
        return {
            "fonte": "nass_quickstats",
            "tipo_acesso": "ao_vivo",
            "condado": condado,
            "estado": estado_sigla,
            "cultura": cultura,
            "ano": ano,
            "disponivel": False,
        }

    linhas = resposta.json().get("data", [])
    serie = [
        {
            "descricao": linha.get("short_desc"),
            "valor": linha.get("Value"),
            "unidade": linha.get("unit_desc"),
        }
        for linha in linhas
    ]

    return {
        "fonte": "nass_quickstats",
        "tipo_acesso": "ao_vivo",
        "condado": condado,
        "estado": estado_sigla,
        "cultura": cultura,
        "ano": ano,
        "disponivel": len(serie) > 0,
        "serie": serie,
    }


if __name__ == "__main__":
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[3] / ".env")

    print("--- Fresno County, Almonds, 2022 (dentro da cobertura) ---")
    resultado = buscar_producao_condado("Fresno", "CA", "Almonds", 2022)
    for linha in resultado["serie"][:3]:
        print(linha)

    print()
    print("--- condado/cultura inexistente (deve vir disponivel=False) ---")
    print(buscar_producao_condado("Fresno", "CA", "Cafe", 2022)["disponivel"])
