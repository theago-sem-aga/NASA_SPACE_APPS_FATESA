"""Ingestao do SRTM (elevacao) para a regiao piloto (Fresno County).

Formato .hgt: grade regular de 3601x3601 amostras cobrindo exatamente
1 grau x 1 grau, comecando no canto noroeste, inteiros de 16 bits
big-endian em metros. Nao tem dimensao de tempo -- e um dado estatico
(levantado uma vez, 1999/2000), diferente de GPM/SMAP.

Uso: python ingestao_srtm.py <caminho_do_arquivo.hgt>
"""

from __future__ import annotations

import math
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from indice_espacial import registrar_celula, caminho_parquet_da_celula, TAMANHO_CELULA_GRAUS

LAT_MIN, LAT_MAX = 36.4, 36.8
LON_MIN, LON_MAX = -119.9, -119.5

FONTE = "srtm"
AMOSTRAS_POR_LADO = 3601
VALOR_AUSENTE = -32768
DATA_LEVANTAMENTO = "1999-02-11"  # missao SRTM original


def _canto_noroeste_do_nome(caminho: Path) -> tuple[float, float]:
    # Exemplo: N36W120.hgt -> canto superior esquerdo em lat 37, lon -120
    m = re.match(r"([NS])(\d+)([EW])(\d+)", caminho.stem)
    lat_sul, lon_oeste = int(m.group(2)), int(m.group(4))
    lat = lat_sul if m.group(1) == "N" else -lat_sul
    lon = -lon_oeste if m.group(3) == "W" else lon_oeste
    return lat + 1.0, lon  # canto NW: lat+1 (norte), lon (oeste) do nome do tile


def ingerir(caminho_arquivo: Path) -> int:
    lat_norte, lon_oeste = _canto_noroeste_do_nome(caminho_arquivo)
    passo = 1.0 / (AMOSTRAS_POR_LADO - 1)

    grade = np.fromfile(caminho_arquivo, dtype=">i2").reshape(AMOSTRAS_POR_LADO, AMOSTRAS_POR_LADO)

    # Vetores de lat/lon por linha/coluna (todas as amostras, nao por pixel).
    latitudes = lat_norte - np.arange(AMOSTRAS_POR_LADO) * passo
    longitudes = lon_oeste + np.arange(AMOSTRAS_POR_LADO) * passo

    linhas_na_regiao = np.where((latitudes >= LAT_MIN) & (latitudes < LAT_MAX))[0]
    colunas_na_regiao = np.where((longitudes >= LON_MIN) & (longitudes < LON_MAX))[0]

    sub_grade = grade[np.ix_(linhas_na_regiao, colunas_na_regiao)]
    sub_lat = latitudes[linhas_na_regiao]
    sub_lon = longitudes[colunas_na_regiao]

    # Indice de celula (0,1 grau) por amostra, vetorizado.
    idx_lat_celula = np.floor(sub_lat / TAMANHO_CELULA_GRAUS).astype(int)
    idx_lon_celula = np.floor(sub_lon / TAMANHO_CELULA_GRAUS).astype(int)

    mascara_valida = sub_grade != VALOR_AUSENTE

    acumulado: dict[str, list[int]] = {}
    for i_lin, lat_idx in enumerate(idx_lat_celula):
        linha_valores = sub_grade[i_lin][mascara_valida[i_lin]]
        linha_lon_idx = idx_lon_celula[mascara_valida[i_lin]]
        for lon_idx, valor in zip(linha_lon_idx, linha_valores):
            acumulado.setdefault(f"{lat_idx}_{lon_idx}", []).append(int(valor))

    celulas_gravadas = 0
    for celula_chave, valores in acumulado.items():
        lat_idx_str, lon_idx_str = celula_chave.split("_")
        lat_representativa = (int(lat_idx_str) + 0.5) * TAMANHO_CELULA_GRAUS
        lon_representativa = (int(lon_idx_str) + 0.5) * TAMANHO_CELULA_GRAUS

        linha_manifesto = registrar_celula(FONTE, lat_representativa, lon_representativa)
        caminho_saida = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
        caminho_saida.parent.mkdir(parents=True, exist_ok=True)

        valores_np = np.array(valores)
        registro = pd.DataFrame([{
            "data_levantamento": DATA_LEVANTAMENTO,
            "elevacao_media_m": round(float(valores_np.mean()), 1),
            "elevacao_min_m": int(valores_np.min()),
            "elevacao_max_m": int(valores_np.max()),
            "n_pixels_agregados": len(valores),
        }])
        registro.to_parquet(caminho_saida, index=False)
        celulas_gravadas += 1

    return celulas_gravadas


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("uso: python ingestao_srtm.py <caminho_do_arquivo.hgt>")
        sys.exit(1)

    caminho = Path(sys.argv[1])
    total = ingerir(caminho)
    print(f"fonte={FONTE} celulas_gravadas={total}")
    print(f"tamanho_celula_graus={TAMANHO_CELULA_GRAUS} regiao=({LAT_MIN},{LON_MIN})-({LAT_MAX},{LON_MAX})")
