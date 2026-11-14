"""Ingestao do ZARC -- Tabua de Risco (MAPA/Embrapa) para o municipio piloto.

Fonte: https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico
Dicionario: data/raw/zarc/dicionario_tabua_risco_2026.pdf (baixado do mesmo portal).

Cada linha do CSV original = cultura x ciclo x solo x manejo x municipio,
com 36 colunas dec1..dec36 (decendios do ano). Valor 20/30/40 = risco de
perda da safra (%) se plantar naquele decendio; 0 = plantio nao indicado.

Saida (formato longo): data/processed/zarc/municipio_<geocodigo>.parquet,
uma linha por cultura/ciclo/solo/manejo/decendio.

Uso: REGIAO_PILOTO=sjrp python ingestao_zarc.py
     (baixa os CSVs para data/raw/zarc/ se ainda nao existirem)
"""

from __future__ import annotations

import datetime as dt
from pathlib import Path

import pandas as pd
import requests

from indice_espacial import RAIZ_DADOS_PROCESSADOS
from regioes import caminho_parquet_municipal, regiao_atual

FONTE = "zarc"
PASTA_BRUTA = RAIZ_DADOS_PROCESSADOS.parent / "raw" / "zarc"
_BASE = "https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f/resource"
ARQUIVOS = {
    "2025/2026": ("tabua_2025_2026.csv", f"{_BASE}/f9d597f9-0fee-47eb-9344-8642274ca9da/download/dados-abertos-tabua-de-risco-safra-2025-2026.csv"),
    "perene_olericola": ("tabua_perene_olericola.csv", f"{_BASE}/dae65d31-683f-4ac4-ab90-3abd0c1583ba/download/dados-abertos-tabua-de-risco-safra-perene-olericola-sem-safra.csv"),
}

# Tabelas de codigos do dicionario de dados oficial (2026).
CICLOS = {"13": "Perene", "19": "Semiperene", "20": "Grupo I", "21": "Grupo II",
          "22": "Grupo III", "24": "Grupo IV", "25": "Grupo V", "26": "Grupo VI"}
SOLOS = {"1": "Arenoso", "2": "Textura Média", "3": "Argiloso",
         "11": "AD1", "12": "AD2", "13": "AD3", "14": "AD4", "15": "AD5", "16": "AD6"}

_DIAS_INICIO = (1, 11, 21)


def baixar_se_preciso() -> dict[str, Path]:
    PASTA_BRUTA.mkdir(parents=True, exist_ok=True)
    caminhos = {}
    for safra, (nome, url) in ARQUIVOS.items():
        caminho = PASTA_BRUTA / nome
        if not caminho.exists():
            print(f"baixando {url}")
            with requests.get(url, stream=True, timeout=600) as r:
                r.raise_for_status()
                with open(caminho, "wb") as f:
                    for bloco in r.iter_content(1 << 20):
                        f.write(bloco)
        caminhos[safra] = caminho
    return caminhos


def _filtrar_municipio(caminho: Path, geocodigo: str) -> pd.DataFrame:
    # Arquivos de 200-550 MB: le em blocos e guarda so o municipio.
    partes = [
        bloco[bloco["geocodigo"] == geocodigo]
        for bloco in pd.read_csv(caminho, sep=";", encoding="utf-8-sig", dtype=str, chunksize=200_000)
    ]
    return pd.concat(partes, ignore_index=True)


def ingerir() -> int:
    regiao = regiao_atual()
    geocodigo = regiao["geocodigo_ibge"]
    if not geocodigo:
        raise SystemExit(f"ZARC so existe para municipios brasileiros; regiao atual: {regiao['chave']}")

    linhas = []
    for safra, caminho in baixar_se_preciso().items():
        df = _filtrar_municipio(caminho, geocodigo)
        for _, r in df.iterrows():
            base = {
                "cultura": r["Nome_cultura"].strip(),
                "safra": safra,
                "manejo": r["Nome_Outros_Manejos"],
                "ciclo_codigo": r["Cod_Ciclo"],
                "ciclo": CICLOS.get(r["Cod_Ciclo"]),
                "solo_codigo": r["Cod_Solo"],
                "solo": SOLOS.get(r["Cod_Solo"]),
                "clima": r["Nome_Clima"],
                "portaria": r["Portaria"],
            }
            for decendio in range(1, 37):
                risco = int(r[f"dec{decendio}"])
                linhas.append({
                    **base,
                    "decendio": decendio,
                    "mes": (decendio - 1) // 3 + 1,
                    "dia_inicio": _DIAS_INICIO[(decendio - 1) % 3],
                    "plantio_indicado": risco > 0,
                    # 0 no CSV = nao indicado; nunca tratar como "risco zero".
                    "risco_perda_pct": risco if risco > 0 else None,
                })

    saida = pd.DataFrame(linhas)
    saida["geocodigo_ibge"] = geocodigo
    saida["fonte"] = FONTE
    saida["data_coleta_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()
    caminho_saida = caminho_parquet_municipal(FONTE, geocodigo)
    caminho_saida.parent.mkdir(parents=True, exist_ok=True)
    saida.to_parquet(caminho_saida, index=False)
    print(f"fonte={FONTE} municipio={geocodigo} linhas={len(saida)} culturas={saida['cultura'].nunique()} -> {caminho_saida}")
    return len(saida)


if __name__ == "__main__":
    ingerir()
