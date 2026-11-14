"""Ingestao do SATVeg (Embrapa AgroAPI): serie de NDVI/EVI do MODIS por celula.

ESTADO: NAO TESTADO contra a API real -- depende de chaves da AgroAPI.
Doc oficial: https://www.agroapi.cnptia.embrapa.br/portal/assets/docs/satveg.pdf

Credenciais (nunca no Git), em web/.env ou no ambiente:
  AGROAPI_CONSUMER_KEY, AGROAPI_CONSUMER_SECRET
  AGROAPI_SATVEG_URL (opcional; confira a versao no "API Console" da loja,
                      padrao abaixo)

Como obter: https://www.agroapi.cnptia.embrapa.br/store/ -> criar conta ->
APPLICATIONS -> DefaultApplication -> Production Keys -> Generate keys;
depois assinar a API SATVeg no plano gratuito (1.000 requisicoes / 1 mes).

Cada celula da regiao gasta 1 requisicao por indice (12 celulas x ndvi = 12).

Saida: data/processed/satveg/<celula_id>.parquet
       + resposta bruta em data/raw/satveg/<celula_id>_<indice>.json
Uso:   REGIAO_PILOTO=sjrp python ingestao_satveg.py [ndvi|evi]
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys

import pandas as pd
import requests

from indice_espacial import RAIZ_DADOS_PROCESSADOS, caminho_parquet_da_celula, registrar_celula
from regioes import centros_das_celulas, regiao_atual

FONTE = "satveg"
URL_TOKEN = "https://api.cnptia.embrapa.br/token"
URL_SATVEG = os.environ.get("AGROAPI_SATVEG_URL", "https://api.cnptia.embrapa.br/satveg/v2")
PASTA_BRUTA = RAIZ_DADOS_PROCESSADOS.parent / "raw" / FONTE


def obter_token() -> str:
    chave = os.environ.get("AGROAPI_CONSUMER_KEY")
    segredo = os.environ.get("AGROAPI_CONSUMER_SECRET")
    if not (chave and segredo):
        raise SystemExit("defina AGROAPI_CONSUMER_KEY e AGROAPI_CONSUMER_SECRET (ver docstring)")
    r = requests.post(URL_TOKEN, data={"grant_type": "client_credentials"}, auth=(chave, segredo), timeout=60)
    r.raise_for_status()
    return r.json()["access_token"]


def ingerir(indice: str = "ndvi") -> int:
    regiao = regiao_atual()
    token = obter_token()
    PASTA_BRUTA.mkdir(parents=True, exist_ok=True)
    coleta = dt.datetime.now(dt.timezone.utc).isoformat()
    for lat, lon in centros_das_celulas(regiao):
        r = requests.get(
            f"{URL_SATVEG}/series",
            params={"tipoPerfil": indice, "satelite": "comb", "latitude": lat, "longitude": lon,
                    "preFiltro": 3},  # 3 = correcao de nuvem e nodata
            headers={"Authorization": f"Bearer {token}"},
            timeout=120,
        )
        r.raise_for_status()
        corpo = r.json()
        linha = registrar_celula(FONTE, lat, lon)
        (PASTA_BRUTA / f"{linha['celula_id']}_{indice}.json").write_text(json.dumps(corpo))

        # Nomes de campo da resposta ainda nao confirmados: falha alto em
        # vez de gravar lixo. Ajuste aqui olhando o JSON bruto salvo acima.
        if not {"listaSerie", "listaDatas"} <= set(corpo):
            raise SystemExit(f"formato inesperado; chaves recebidas: {sorted(corpo)} -- ver {PASTA_BRUTA}")
        df = pd.DataFrame({"data": corpo["listaDatas"], indice: corpo["listaSerie"]})
        df["fonte"] = FONTE
        df["satelite"] = "terra+aqua (MOD13Q1/MYD13Q1)"
        df["data_coleta_utc"] = coleta
        caminho = caminho_parquet_da_celula(FONTE, linha["celula_id"])
        caminho.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(caminho, index=False)
        print(f"  celula={linha['celula_id']} pontos={len(df)}")
    return 0


if __name__ == "__main__":
    ingerir(sys.argv[1] if len(sys.argv) > 1 else "ndvi")
