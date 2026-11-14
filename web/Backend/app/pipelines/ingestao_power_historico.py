"""Cache historico da NASA POWER por celula da regiao piloto.

A NASA POWER continua sendo a fonte "ao vivo" do produto (ver
integrations/nasa_power.py). Este script so guarda uma copia da serie
diaria longa para (1) a demo funcionar sem internet, como exige
docs/convencao_programacao.md secao 7, e (2) calcular normais
climaticas sem 30 anos de requisicao a cada uso.

Saida: data/processed/nasa_power/<celula_id>.parquet (tipo_acesso = pre_processado)
Uso:   REGIAO_PILOTO=sjrp python ingestao_power_historico.py [ano_ini=1995] [ano_fim=2024]
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "integrations"))
from nasa_power import buscar_power_ponto  # noqa: E402

from indice_espacial import caminho_parquet_da_celula, registrar_celula  # noqa: E402
from regioes import centros_das_celulas, regiao_atual  # noqa: E402

FONTE = "nasa_power"


def ingerir(ano_ini: int = 1995, ano_fim: int = 2024) -> int:
    regiao = regiao_atual()
    celulas = centros_das_celulas(regiao)
    for n, (lat, lon) in enumerate(celulas, 1):
        resultado = buscar_power_ponto(lat, lon, dt.date(ano_ini, 1, 1), dt.date(ano_fim, 12, 31), timeout_s=300)
        df = pd.DataFrame(resultado["serie"])
        df["fonte"] = FONTE
        df["tipo_acesso"] = "pre_processado"
        df["data_coleta_utc"] = resultado["data_coleta_utc"]
        linha = registrar_celula(FONTE, lat, lon)
        caminho = caminho_parquet_da_celula(FONTE, linha["celula_id"])
        caminho.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(caminho, index=False)
        print(f"  {n}/{len(celulas)} celula={linha['celula_id']} dias={len(df)}")
    print(f"fonte={FONTE} regiao={regiao['chave']} celulas={len(celulas)} periodo={ano_ini}-{ano_fim}")
    return len(celulas)


if __name__ == "__main__":
    args = [int(a) for a in sys.argv[1:3]]
    ingerir(*args)
