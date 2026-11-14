"""Ingestao do Landsat (NDVI, via HLS L30) para a regiao piloto.

HLS (Harmonized Landsat Sentinel) distribui Landsat ja em GeoTIFF/COG,
tile MGRS (mesma grade do Sentinel-2), igual ao padrao usado na
ingestao do ECOSTRESS -- sem reprojecao manual.

NDVI = (NIR - Red) / (NIR + Red); como e razao, o fator de escala do
reflectancia (HLS guarda inteiro escalado) se cancela, nao precisa
ser aplicado antes de calcular.

Uso: python ingestao_landsat.py <caminho_banda_vermelha_B04.tif> <caminho_banda_nir_B05.tif>
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio
from rasterio.warp import transform as warp_transform

from indice_espacial import registrar_celula, celula_id, caminho_parquet_da_celula, TAMANHO_CELULA_GRAUS

LAT_MIN, LAT_MAX = 36.4, 36.8
LON_MIN, LON_MAX = -119.9, -119.5

FONTE = "landsat"


def _data_do_nome(caminho: Path) -> str:
    # Exemplo: HLS.L30.T10SGF.2023007T184020.v2.0.B04.tif -> ano+dia-do-ano 2023007
    m = re.search(r"\.(\d{4})(\d{3})T\d{6}\.", caminho.name)
    ano, dia_do_ano = int(m.group(1)), int(m.group(2))
    import datetime as dt
    data = dt.date(ano, 1, 1) + dt.timedelta(days=dia_do_ano - 1)
    return data.isoformat()


def ingerir(caminho_vermelho: Path, caminho_nir: Path) -> int:
    data_observacao = _data_do_nome(caminho_vermelho)

    with rasterio.open(caminho_vermelho) as ds_red, rasterio.open(caminho_nir) as ds_nir:
        red = ds_red.read(1).astype(float)
        nir = ds_nir.read(1).astype(float)
        fill = ds_red.nodata if ds_red.nodata is not None else -9999.0

        xs_bbox, ys_bbox = warp_transform("EPSG:4326", ds_red.crs, [LON_MIN, LON_MAX], [LAT_MIN, LAT_MAX])
        r_topo, c_esq = ds_red.index(xs_bbox[0], ys_bbox[1])
        r_base, c_dir = ds_red.index(xs_bbox[1], ys_bbox[0])
        r0, r1 = max(0, min(r_topo, r_base)), min(ds_red.height, max(r_topo, r_base))
        c0, c1 = max(0, min(c_esq, c_dir)), min(ds_red.width, max(c_esq, c_dir))

        sub_red = red[r0:r1, c0:c1]
        sub_nir = nir[r0:r1, c0:c1]
        validos = (sub_red != fill) & (sub_nir != fill) & ((sub_red + sub_nir) != 0)
        linhas_px, colunas_px = np.where(validos)
        if len(linhas_px) == 0:
            return 0

        ndvi_sub = np.full(sub_red.shape, np.nan)
        ndvi_sub[validos] = (sub_nir[validos] - sub_red[validos]) / (sub_nir[validos] + sub_red[validos])

        xs_px, ys_px = ds_red.xy(linhas_px + r0, colunas_px + c0)
        lons_px, lats_px = warp_transform(ds_red.crs, "EPSG:4326", xs_px, ys_px)

    acumulado: dict[str, list[float]] = {}
    representante: dict[str, tuple[float, float]] = {}
    for lat, lon, lin, col in zip(lats_px, lons_px, linhas_px, colunas_px):
        if not (LAT_MIN <= lat < LAT_MAX and LON_MIN <= lon < LON_MAX):
            continue
        celula = celula_id(lat, lon)
        acumulado.setdefault(celula, []).append(float(ndvi_sub[lin, col]))
        representante.setdefault(celula, (lat, lon))

    for celula, valores in acumulado.items():
        lat_rep, lon_rep = representante[celula]
        linha_manifesto = registrar_celula(FONTE, lat_rep, lon_rep)
        caminho_saida = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
        caminho_saida.parent.mkdir(parents=True, exist_ok=True)
        valores_np = np.array(valores)
        registro = pd.DataFrame([{
            "data": data_observacao,
            "ndvi_medio": round(float(valores_np.mean()), 4),
            "n_pixels_agregados": len(valores),
        }])
        registro.to_parquet(caminho_saida, index=False)

    return len(acumulado)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("uso: python ingestao_landsat.py <banda_B04.tif> <banda_B05.tif>")
        sys.exit(1)

    total = ingerir(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"fonte={FONTE} celulas_gravadas={total}")
    print(f"tamanho_celula_graus={TAMANHO_CELULA_GRAUS} regiao=({LAT_MIN},{LON_MIN})-({LAT_MAX},{LON_MAX})")
