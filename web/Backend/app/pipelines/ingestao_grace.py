"""Ingestao do GRACE/GRACE-FO (anomalia de armazenamento de agua) para a
regiao configurada.

Diferente das outras fontes indexadas, o arquivo bruto do GRACE/GRACE-FO
(mascons do JPL, baixado do PO.DAAC com o mesmo Bearer token do Earthdata
Login usado para GES DISC/LP DAAC) ja contem a serie MENSAL COMPLETA da
missao (abril/2002 em diante) num unico arquivo global -- nao existe "uma
ingestao por data" como no GPM/SMAP/ECOSTRESS. Por isso este script roda
uma vez por atualizacao do arquivo (quando a NASA publica um mes novo) e
grava a serie inteira em cada Parquet de celula, em vez de uma linha por
execucao.

A grade nativa do produto e de 0,5 grau (lat/lon, land_mask, scale_factor,
lwe_thickness), bem mais grossa que a celula de 0,1 grau do indice
espacial -- cada ponto do GRACE cobre ~25 das nossas celulas, que recebem
a MESMA serie (nao ha como gerar mais detalhe espacial a partir deste
dado: a resolucao nativa real e de mascons equal-area de ~3 graus; ver
aviso oficial do CSR/JPL de nunca usar esta solucao para analise em um
unico ponto, so em escala de bacia/regiao).

Variavel gravada: "armazenamento_agua_anomalia_cm" = lwe_thickness x
scale_factor (correcao de leakage do filtro CRI, recomendada em Wiese,
Landerer & Watkins 2016, doi:10.1002/2016WR019344) -- anomalia relativa
a media 2004-2009 (atributo time_mean_removed do arquivo), nao um valor
absoluto de agua armazenada.

Uso: python ingestao_grace.py <caminho_do_arquivo_bruto.nc>
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

import h5py
import numpy as np
import pandas as pd

from regioes import caixa_da_regiao
from indice_espacial import registrar_celula, caminho_parquet_da_celula, TAMANHO_CELULA_GRAUS

LAT_MIN, LAT_MAX, LON_MIN, LON_MAX = caixa_da_regiao()

FONTE = "grace"
FILL_VALUE = -99999.0
EPOCA = dt.date(2002, 1, 1)


def _datas(tempos_dias: np.ndarray) -> list[str]:
    # "time" = dias desde 2002-01-01; produto e mensal, normaliza pro dia 1 do mes.
    return [
        (EPOCA + dt.timedelta(days=float(d))).replace(day=1).isoformat()
        for d in tempos_dias
    ]


def ingerir(caminho_arquivo_bruto: Path) -> int:
    with h5py.File(caminho_arquivo_bruto, "r") as f:
        lat = f["lat"][:]
        lon = ((f["lon"][:] + 180) % 360) - 180  # 0-360 -> -180..180
        datas = _datas(f["time"][:])

        # Overlap do pixel (0,5 grau) com a caixa da regiao, nao "centro
        # dentro da caixa" -- a caixa pedida pode ser menor que o pixel
        # do GRACE (mesmo problema do ST_Contains vs ST_Intersects).
        lat_idx = np.where((lat + 0.25 > LAT_MIN) & (lat - 0.25 < LAT_MAX))[0]
        lon_idx = np.where((lon + 0.25 > LON_MIN) & (lon - 0.25 < LON_MAX))[0]
        if len(lat_idx) == 0 or len(lon_idx) == 0:
            return 0

        celulas_gravadas = 0
        passo = TAMANHO_CELULA_GRAUS
        for i in lat_idx:
            for j in lon_idx:
                fator = float(f["scale_factor"][i, j])
                lwe = f["lwe_thickness"][:, i, j]
                incerteza = f["uncertainty"][:, i, j]
                if fator <= FILL_VALUE or lwe[0] <= FILL_VALUE:
                    continue  # ponto sem mascon valido (ex.: oceano fora da CRI)

                serie = pd.DataFrame({
                    "data": datas,
                    "armazenamento_agua_anomalia_cm": np.round(
                        np.where(lwe <= FILL_VALUE, np.nan, lwe * fator), 3
                    ),
                    "incerteza_cm": np.round(
                        np.where(incerteza <= FILL_VALUE, np.nan, incerteza), 3
                    ),
                })

                # fan-out: o pixel do GRACE (0,5 grau) cobre varias celulas
                # nossas (0,1 grau); grava a mesma serie em cada uma delas
                # que cair dentro da regiao pedida.
                lat_centro, lon_centro = float(lat[i]), float(lon[j])
                sub_lat = np.arange(lat_centro - 0.25 + passo / 2, lat_centro + 0.25, passo)
                sub_lon = np.arange(lon_centro - 0.25 + passo / 2, lon_centro + 0.25, passo)
                for sub_la in sub_lat:
                    if not (LAT_MIN <= sub_la < LAT_MAX):
                        continue
                    for sub_lo in sub_lon:
                        if not (LON_MIN <= sub_lo < LON_MAX):
                            continue
                        linha_manifesto = registrar_celula(FONTE, float(sub_la), float(sub_lo))
                        caminho_saida = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
                        caminho_saida.parent.mkdir(parents=True, exist_ok=True)
                        serie.to_parquet(caminho_saida, index=False)
                        celulas_gravadas += 1

    return celulas_gravadas


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("uso: python ingestao_grace.py <caminho_do_arquivo_bruto.nc>")
        sys.exit(1)

    caminho = Path(sys.argv[1])
    total = ingerir(caminho)
    print(f"fonte={FONTE} celulas_gravadas={total}")
    print(f"tamanho_celula_graus={TAMANHO_CELULA_GRAUS} regiao=({LAT_MIN},{LON_MIN})-({LAT_MAX},{LON_MAX})")
