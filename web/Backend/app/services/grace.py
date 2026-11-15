"""Busca a serie do GRACE/GRACE-FO (armazenamento de agua) pra QUALQUER ponto
do planeta -- nao so os pontos piloto.

Ordem:
1. Celula local pre-indexada (pipelines/ingestao_grace.py ja rodou ali) -- mais
   rapido, mesmo formato de sempre.
2. Leitura direta do arquivo global (data/raw/grace/*.nc): esse arquivo JA
   cobre o planeta inteiro (foi baixado assim, ver pipelines/ingestao_grace.py),
   so nunca foi fatiado pra fora dos pontos piloto. Le so o pixel pedido via
   h5py (``[:, i, j]``), sem carregar o arquivo inteiro em memoria -- o
   dataset e comprimido em blocos de (66, 90, 180), carregar tudo seria quase
   1 GB em memoria pra sempre (testado: 3,5 s + risco de pressao de memoria
   no resto do processo). Ler so o pixel leva ~115 ms por chamada; cacheia o
   resultado por coordenada (arredondada pro pixel) pra nao repetir a leitura
   em requisicoes seguidas do mesmo ponto.

Sem o arquivo (quem nao baixou), ou oceano fora de mascon valido: None --
nunca inventa valor.
"""

from __future__ import annotations

import datetime as dt
from functools import lru_cache

import numpy as np

from app.configuracao import RAIZ
from app.repositories.espacial import buscar_celula

FILL_VALUE = -99999.0
EPOCA = dt.date(2002, 1, 1)
PASTA_RAW = RAIZ / "data" / "raw" / "grace"


def _arquivo_global():
    candidatos = sorted(PASTA_RAW.glob("GRCTellus.JPL.*.nc"))
    return candidatos[-1] if candidatos else None


@lru_cache
def _grade():
    """lat/lon da grade (arrays pequenos, ~8 KB) -- so pra achar o indice do
    pixel mais proximo sem reabrir o arquivo a cada chamada."""
    caminho = _arquivo_global()
    if caminho is None:
        return None
    import h5py

    with h5py.File(caminho, "r") as f:
        lat = f["lat"][:]
        lon = ((f["lon"][:] + 180) % 360) - 180
    return lat, lon


@lru_cache(maxsize=256)
def _serie_do_pixel(i: int, j: int) -> tuple | None:
    """So o pixel (i, j): le direto do HDF5, nao carrega a grade inteira.
    Cacheado por pixel -- chamadas repetidas pro mesmo ponto nao tocam o disco."""
    caminho = _arquivo_global()
    if caminho is None:
        return None
    import h5py

    with h5py.File(caminho, "r") as f:
        fator = float(f["scale_factor"][i, j])
        if fator <= FILL_VALUE:
            return None
        lwe = f["lwe_thickness"][:, i, j]
        if lwe[0] <= FILL_VALUE:
            return None  # oceano fora de mascon valido, sem dado real ali
        incerteza = f["uncertainty"][:, i, j]
        datas = tuple(
            (EPOCA + dt.timedelta(days=float(d))).replace(day=1).isoformat() for d in f["time"][:]
        )
    return datas, tuple(lwe * fator), tuple(incerteza)


def _serie_global(latitude: float, longitude: float) -> list[dict] | None:
    grade = _grade()
    if grade is None:
        return None
    lat, lon = grade
    i = int(np.argmin(np.abs(lat - latitude)))
    j = int(np.argmin(np.abs(lon - longitude)))
    resultado = _serie_do_pixel(i, j)
    if resultado is None:
        return None
    datas, serie, incerteza = resultado
    return [
        {
            "data": data,
            "armazenamento_agua_anomalia_cm": round(v, 3) if v > FILL_VALUE else None,
            "incerteza_cm": round(u, 3) if u > FILL_VALUE else None,
        }
        for data, v, u in zip(datas, serie, incerteza, strict=True)
    ]


def grace_do_ponto(latitude: float, longitude: float) -> dict | None:
    local = buscar_celula("grace", latitude, longitude)
    if local is not None:
        return {"serie": local["serie"], "tipo_acesso": "pre_processado"}
    serie = _serie_global(latitude, longitude)
    if serie is None:
        return None
    return {"serie": serie, "tipo_acesso": "pre_processado"}
