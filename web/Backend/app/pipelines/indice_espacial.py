"""Indice espacial para as fontes de arquivo pre-indexado (nunca ao vivo).

Protótipo baseado em arquivo (Parquet + um manifesto), compatível com
a migração futura para PostGIS descrita em docs/convencao_programacao.md
(seção "Estrategia de acesso aos dados"). O contrato -- celula de
0,1 grau, um Parquet por celula em data/processed/<fonte>/<celula_id>.parquet
-- é o mesmo que o backend (Ghabriel/Codex) vai consumir quando a tabela
espacial real existir; só a forma de consulta muda (filtro em arquivo
hoje, ``ST_Contains`` depois).
"""

from __future__ import annotations

import math
from pathlib import Path

import pandas as pd

TAMANHO_CELULA_GRAUS = 0.1

RAIZ_DADOS_PROCESSADOS = Path(__file__).resolve().parents[4] / "data" / "processed"
CAMINHO_MANIFESTO = RAIZ_DADOS_PROCESSADOS / "indice_espacial.parquet"


def celula_id(latitude: float, longitude: float) -> str:
    """Identificador estavel da celula de 0,1 grau que contem o ponto."""
    lat_idx = math.floor(latitude / TAMANHO_CELULA_GRAUS)
    lon_idx = math.floor(longitude / TAMANHO_CELULA_GRAUS)
    return f"{lat_idx}_{lon_idx}"


def limites_da_celula(latitude: float, longitude: float) -> dict:
    lat_idx = math.floor(latitude / TAMANHO_CELULA_GRAUS)
    lon_idx = math.floor(longitude / TAMANHO_CELULA_GRAUS)
    return {
        "lat_min": round(lat_idx * TAMANHO_CELULA_GRAUS, 2),
        "lat_max": round((lat_idx + 1) * TAMANHO_CELULA_GRAUS, 2),
        "lon_min": round(lon_idx * TAMANHO_CELULA_GRAUS, 2),
        "lon_max": round((lon_idx + 1) * TAMANHO_CELULA_GRAUS, 2),
    }


def caminho_parquet_da_celula(fonte: str, celula: str) -> Path:
    return RAIZ_DADOS_PROCESSADOS / fonte / f"{celula}.parquet"


def registrar_celula(fonte: str, latitude: float, longitude: float) -> dict:
    """Cria/atualiza a linha do manifesto para a celula desta coordenada."""
    celula = celula_id(latitude, longitude)
    limites = limites_da_celula(latitude, longitude)
    linha = {
        "fonte": fonte,
        "celula_id": celula,
        **limites,
        "caminho_parquet": str(caminho_parquet_da_celula(fonte, celula).relative_to(RAIZ_DADOS_PROCESSADOS.parent)),
    }

    RAIZ_DADOS_PROCESSADOS.mkdir(parents=True, exist_ok=True)
    if CAMINHO_MANIFESTO.exists():
        manifesto = pd.read_parquet(CAMINHO_MANIFESTO)
        manifesto = manifesto[
            ~((manifesto["fonte"] == fonte) & (manifesto["celula_id"] == celula))
        ]
        manifesto = pd.concat([manifesto, pd.DataFrame([linha])], ignore_index=True)
    else:
        manifesto = pd.DataFrame([linha])
    manifesto.to_parquet(CAMINHO_MANIFESTO, index=False)
    return linha


def buscar_por_coordenada(fonte: str, latitude: float, longitude: float) -> dict | None:
    """Consulta o manifesto pela celula que contem a coordenada e lê o Parquet.

    Retorna ``None`` quando a coordenada cai fora de qualquer celula já
    pré-processada -- nunca deve ser tratado como "buscar ao vivo" nem
    "assumir zero".
    """
    if not CAMINHO_MANIFESTO.exists():
        return None

    manifesto = pd.read_parquet(CAMINHO_MANIFESTO)
    celula = celula_id(latitude, longitude)
    linhas = manifesto[(manifesto["fonte"] == fonte) & (manifesto["celula_id"] == celula)]
    if linhas.empty:
        return None

    caminho = RAIZ_DADOS_PROCESSADOS.parent / linhas.iloc[0]["caminho_parquet"]
    if not caminho.exists():
        return None

    dados = pd.read_parquet(caminho)
    return {
        "fonte": fonte,
        "tipo_acesso": "pre_processado",
        "celula_id": celula,
        "latitude": latitude,
        "longitude": longitude,
        "serie": dados.to_dict(orient="records"),
    }
