"""Ingestao do SMAP (umidade do solo) para a regiao piloto (Fresno County).

Diferente do GPM, a grade do SMAP (EASE-2) nao e um vetor regular de
lat/lon -- cada pixel tem sua propria latitude/longitude. Por isso a
celula de cada pixel e calculada a partir da sua propria coordenada,
em vez de indexar por posicao na grade.

Uso: python ingestao_smap.py <caminho_do_arquivo_bruto.h5>
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import h5py
import numpy as np
import pandas as pd

from regioes import caixa_da_regiao
from indice_espacial import registrar_celula, celula_id, caminho_parquet_da_celula, TAMANHO_CELULA_GRAUS

# Mesma regiao piloto usada na ingestao do GPM (ver docs/convencao_programacao.md).
# Caixa da regiao piloto escolhida por REGIAO_PILOTO (padrao: fresno), ver regioes.py.
LAT_MIN, LAT_MAX, LON_MIN, LON_MAX = caixa_da_regiao()

FONTE = "smap"
FILL_VALUE = -9999.0
GRUPO = "Soil_Moisture_Retrieval_Data_AM"


def _extrair_data_do_nome(caminho: Path) -> str:
    # Exemplo: SMAP_L3_SM_P_20230101_R19240_001.h5
    m = re.search(r"_(\d{8})_", caminho.name)
    aaaammdd = m.group(1)
    return f"{aaaammdd[0:4]}-{aaaammdd[4:6]}-{aaaammdd[6:8]}"


def ingerir(caminho_arquivo_bruto: Path) -> int:
    data_observacao = _extrair_data_do_nome(caminho_arquivo_bruto)

    with h5py.File(caminho_arquivo_bruto, "r") as f:
        lat = f[f"{GRUPO}/latitude"][:]
        lon = f[f"{GRUPO}/longitude"][:]
        umidade = f[f"{GRUPO}/soil_moisture"][:]

    dentro_da_regiao = (
        (lat >= LAT_MIN) & (lat < LAT_MAX) & (lon >= LON_MIN) & (lon < LON_MAX)
    )
    linhas_px, colunas_px = np.where(dentro_da_regiao)

    # Varios pixels de 9km podem cair na mesma celula de 0,1 grau; agrega por media.
    acumulado: dict[str, list[float]] = {}
    representante: dict[str, tuple[float, float]] = {}
    for lin, col in zip(linhas_px, colunas_px):
        valor = float(umidade[lin, col])
        if valor == FILL_VALUE or valor < 0:
            continue
        latitude_px = float(lat[lin, col])
        longitude_px = float(lon[lin, col])
        celula = celula_id(latitude_px, longitude_px)
        acumulado.setdefault(celula, []).append(valor)
        representante.setdefault(celula, (latitude_px, longitude_px))

    for celula, valores in acumulado.items():
        lat_rep, lon_rep = representante[celula]
        linha_manifesto = registrar_celula(FONTE, lat_rep, lon_rep)
        caminho_saida = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
        caminho_saida.parent.mkdir(parents=True, exist_ok=True)
        registro = pd.DataFrame([{
            "data": data_observacao,
            "umidade_solo_cm3_cm3": round(sum(valores) / len(valores), 4),
            "n_pixels_agregados": len(valores),
        }])
        registro.to_parquet(caminho_saida, index=False)

    return len(acumulado)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("uso: python ingestao_smap.py <caminho_do_arquivo_bruto.h5>")
        sys.exit(1)

    caminho = Path(sys.argv[1])
    total = ingerir(caminho)
    print(f"fonte={FONTE} data={_extrair_data_do_nome(caminho)} celulas_gravadas={total}")
    print(f"tamanho_celula_graus={TAMANHO_CELULA_GRAUS} regiao=({LAT_MIN},{LON_MIN})-({LAT_MAX},{LON_MAX})")
