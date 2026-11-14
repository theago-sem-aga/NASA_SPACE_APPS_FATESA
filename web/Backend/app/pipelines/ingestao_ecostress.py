"""Ingestao do ECOSTRESS (temperatura da superficie, LST) para a regiao piloto.

Diferente do SMAP, o produto L2T ja vem reprojetado (GeoTIFF, grade
UTM regular por tile) -- usamos rasterio para ler o raster e
transformar cada pixel pra lat/lon, em vez de interpretar uma grade
curva manualmente.

A cobertura e por "swath" (faixa estreita da orbita da ISS, horarios
irregulares): nem toda celula da regiao piloto tera dado nesse
arquivo -- isso e esperado, nao e erro.

Uso: python ingestao_ecostress.py <caminho_do_arquivo_LST.tif>
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio
from rasterio.warp import transform as warp_transform

from regioes import caixa_da_regiao
from indice_espacial import registrar_celula, celula_id, caminho_parquet_da_celula, TAMANHO_CELULA_GRAUS

# Caixa da regiao piloto escolhida por REGIAO_PILOTO (padrao: fresno), ver regioes.py.
LAT_MIN, LAT_MAX, LON_MIN, LON_MAX = caixa_da_regiao()

FONTE = "ecostress"


def _data_do_nome(caminho: Path) -> str:
    # Exemplo: ECOv002_L2T_LSTE_25776_003_11SKA_20230122T002727_0710_01_LST.tif
    m = re.search(r"_(\d{8})T\d{6}_", caminho.name)
    aaaammdd = m.group(1)
    return f"{aaaammdd[0:4]}-{aaaammdd[4:6]}-{aaaammdd[6:8]}"


def ingerir(caminho_arquivo: Path) -> int:
    data_observacao = _data_do_nome(caminho_arquivo)

    with rasterio.open(caminho_arquivo) as ds:
        dado = ds.read(1)  # kelvin

        xs_bbox, ys_bbox = warp_transform("EPSG:4326", ds.crs, [LON_MIN, LON_MAX], [LAT_MIN, LAT_MAX])
        r_topo, c_esq = ds.index(xs_bbox[0], ys_bbox[1])
        r_base, c_dir = ds.index(xs_bbox[1], ys_bbox[0])
        r0, r1 = max(0, min(r_topo, r_base)), min(ds.height, max(r_topo, r_base))
        c0, c1 = max(0, min(c_esq, c_dir)), min(ds.width, max(c_esq, c_dir))

        sub_grade = dado[r0:r1, c0:c1]
        linhas_px, colunas_px = np.where(~np.isnan(sub_grade))
        if len(linhas_px) == 0:
            return 0

        xs_px, ys_px = ds.xy(linhas_px + r0, colunas_px + c0)
        lons_px, lats_px = warp_transform(ds.crs, "EPSG:4326", xs_px, ys_px)

    acumulado: dict[str, list[float]] = {}
    representante: dict[str, tuple[float, float]] = {}
    for lat, lon, lin, col in zip(lats_px, lons_px, linhas_px, colunas_px):
        if not (LAT_MIN <= lat < LAT_MAX and LON_MIN <= lon < LON_MAX):
            continue
        valor_k = float(sub_grade[lin, col])
        celula = celula_id(lat, lon)
        acumulado.setdefault(celula, []).append(valor_k)
        representante.setdefault(celula, (lat, lon))

    for celula, valores in acumulado.items():
        lat_rep, lon_rep = representante[celula]
        linha_manifesto = registrar_celula(FONTE, lat_rep, lon_rep)
        caminho_saida = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
        caminho_saida.parent.mkdir(parents=True, exist_ok=True)
        media_k = sum(valores) / len(valores)
        registro = pd.DataFrame([{
            "data": data_observacao,
            "temperatura_superficie_media_c": round(media_k - 273.15, 2),
            "n_pixels_agregados": len(valores),
        }])
        registro.to_parquet(caminho_saida, index=False)

    return len(acumulado)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("uso: python ingestao_ecostress.py <caminho_do_arquivo_LST.tif>")
        sys.exit(1)

    caminho = Path(sys.argv[1])
    total = ingerir(caminho)
    print(f"fonte={FONTE} celulas_gravadas={total}")
    print(f"tamanho_celula_graus={TAMANHO_CELULA_GRAUS} regiao=({LAT_MIN},{LON_MIN})-({LAT_MAX},{LON_MAX})")
