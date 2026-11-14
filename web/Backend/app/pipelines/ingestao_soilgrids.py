"""Ingestao do SoilGrids 2.0 (ISRIC) -- propriedades do solo por celula.

API REST publica, sem chave (limite de ~5 requisicoes/minuto):
https://rest.isric.org/soilgrids/v2.0/docs

Consulta o centro de cada celula de 0,1 grau da regiao piloto e grava um
Parquet por celula (mesmo contrato das fontes de satelite, ver
indice_espacial.py). Valores convertidos para a unidade convencional
dividindo pelo ``d_factor`` informado pela propria API.

Area urbana e agua sao mascaradas pelo SoilGrids: o valor vem nulo e e
gravado como None -- nunca como zero.

Saida: data/processed/soilgrids/<celula_id>.parquet
Uso:   REGIAO_PILOTO=sjrp python ingestao_soilgrids.py
"""

from __future__ import annotations

import datetime as dt
import time

import pandas as pd
import requests

from indice_espacial import caminho_parquet_da_celula, registrar_celula
from regioes import centros_das_celulas, regiao_atual

FONTE = "soilgrids"
URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
PROPRIEDADES = {
    "clay": "argila",
    "sand": "areia",
    "silt": "silte",
    "soc": "carbono_organico",
    "phh2o": "ph_agua",
    "cec": "ctc",
    "nitrogen": "nitrogenio",
    "bdod": "densidade_aparente",
}
PROFUNDIDADES = ("0-5cm", "5-15cm", "15-30cm", "30-60cm")
INTERVALO_S = 13  # respeita ~5 req/min


def _consultar(lat: float, lon: float) -> dict:
    params = [("lat", lat), ("lon", lon), ("value", "mean")]
    params += [("property", p) for p in PROPRIEDADES] + [("depth", d) for d in PROFUNDIDADES]
    for tentativa in range(1, 4):
        r = requests.get(URL, params=params, timeout=120)
        if r.status_code == 200:
            return r.json()
        time.sleep(INTERVALO_S * tentativa)
    r.raise_for_status()
    return {}


def ingerir() -> int:
    regiao = regiao_atual()
    coleta = dt.datetime.now(dt.timezone.utc).isoformat()
    celulas = centros_das_celulas(regiao)
    for n, (lat, lon) in enumerate(celulas, 1):
        corpo = _consultar(lat, lon)
        linhas = []
        for camada in corpo["properties"]["layers"]:
            fator = camada["unit_measure"]["d_factor"]
            unidade = camada["unit_measure"]["target_units"]
            for prof in camada["depths"]:
                bruto = prof["values"]["mean"]
                linhas.append({
                    "variavel": PROPRIEDADES[camada["name"]],
                    "profundidade": prof["label"],
                    "valor": None if bruto is None else round(bruto / fator, 3),
                    "unidade": unidade,
                    "latitude_consulta": lat,
                    "longitude_consulta": lon,
                    "fonte": FONTE,
                    "data_coleta_utc": coleta,
                })
        linha_manifesto = registrar_celula(FONTE, lat, lon)
        caminho = caminho_parquet_da_celula(FONTE, linha_manifesto["celula_id"])
        caminho.parent.mkdir(parents=True, exist_ok=True)
        pd.DataFrame(linhas).to_parquet(caminho, index=False)
        nulos = sum(l["valor"] is None for l in linhas)
        print(f"  {n}/{len(celulas)} celula={linha_manifesto['celula_id']} valores={len(linhas)} nulos={nulos}")
        if n < len(celulas):
            time.sleep(INTERVALO_S)
    print(f"fonte={FONTE} regiao={regiao['chave']} celulas={len(celulas)}")
    return len(celulas)


if __name__ == "__main__":
    ingerir()
