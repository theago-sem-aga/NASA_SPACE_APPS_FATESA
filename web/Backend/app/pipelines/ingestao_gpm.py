"""Ingestao do GPM/IMERG para a regiao piloto (Condado de Fresno, CA).

Le o arquivo HDF5 bruto ja baixado (autenticado via Earthdata Login,
ver docs/convencao_programacao.md), recorta para a area de interesse e
grava um Parquet por celula de 0,1 grau em data/processed/gpm/,
registrando cada celula no indice espacial (indice_espacial.py).

Uso: python ingestao_gpm.py <caminho_do_arquivo_bruto.nc4>
"""

from __future__ import annotations

import sys
from pathlib import Path

import h5py
import pandas as pd

from indice_espacial import registrar_celula, caminho_parquet_da_celula, TAMANHO_CELULA_GRAUS

# Caixa delimitadora em torno da coordenada piloto (36.6, -119.7),
# ver docs/convencao_programacao.md -- regiao piloto do prototipo.
LAT_MIN, LAT_MAX = 36.4, 36.8
LON_MIN, LON_MAX = -119.9, -119.5

FONTE = "gpm"


def _extrair_data_do_nome(caminho: Path) -> str:
    # Exemplo de nome: 3B-DAY.MS.MRG.3IMERG.20230101-S000000-E235959.V07B.nc4
    trecho = caminho.name.split(".")[4]
    aaaammdd = trecho.split("-")[0]
    return f"{aaaammdd[0:4]}-{aaaammdd[4:6]}-{aaaammdd[6:8]}"


def ingerir(caminho_arquivo_bruto: Path) -> int:
    data_observacao = _extrair_data_do_nome(caminho_arquivo_bruto)

    with h5py.File(caminho_arquivo_bruto, "r") as f:
        lat = f["lat"][:]
        lon = f["lon"][:]
        # formato (tempo, lon, lat) neste produto
        precipitacao = f["precipitation"][0, :, :]

        celulas_gravadas = 0
        lat_idx = 0
        while lat[lat_idx] < LAT_MAX:
            if lat[lat_idx] >= LAT_MIN:
                lon_idx = 0
                while lon_idx < len(lon):
                    valor_lon = lon[lon_idx]
                    if LON_MIN <= valor_lon < LON_MAX:
                        latitude_centro = float(lat[lat_idx])
                        longitude_centro = float(valor_lon)
                        valor = float(precipitacao[lon_idx, lat_idx])
                        valor_tratado = None if valor <= -999 else round(valor, 3)

                        linha_manifesto = registrar_celula(FONTE, latitude_centro, longitude_centro)
                        caminho_saida = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
                        caminho_saida.parent.mkdir(parents=True, exist_ok=True)

                        registro = pd.DataFrame([{
                            "data": data_observacao,
                            "precipitacao_acumulada_mm": valor_tratado,
                        }])
                        registro.to_parquet(caminho_saida, index=False)
                        celulas_gravadas += 1
                    lon_idx += 1
            lat_idx += 1

    return celulas_gravadas


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("uso: python ingestao_gpm.py <caminho_do_arquivo_bruto.nc4>")
        sys.exit(1)

    caminho = Path(sys.argv[1])
    total = ingerir(caminho)
    print(f"fonte={FONTE} data={_extrair_data_do_nome(caminho)} celulas_gravadas={total}")
    print(f"tamanho_celula_graus={TAMANHO_CELULA_GRAUS} regiao=({LAT_MIN},{LON_MIN})-({LAT_MAX},{LON_MAX})")
