"""Ingestao do credito rural (SICOR / Banco Central) para o municipio piloto.

API OData publica, sem chave:
https://olinda.bcb.gov.br/olinda/servico/SICOR/versao/v2/odata/

- CusteioMunicipioProduto: filtra por ``codIbge``.
- InvestMunicipioProduto: filtra por ``cdMunicipio`` (codigo SICOR, ver regioes.py).

Mostra o que ja e financiado no municipio, por produto e programa.
``cdPrograma == "0001"`` e o PRONAF (credito da agricultura familiar).

A API devolve 500 em consultas grandes: por isso a busca e feita ano a
ano, com novas tentativas.

Saida: data/processed/sicor/municipio_<geocodigo>.parquet
Uso:   REGIAO_PILOTO=sjrp python ingestao_sicor.py [ano_inicial=2013]
"""

from __future__ import annotations

import datetime as dt
import sys
import time
from urllib.parse import quote

import pandas as pd
import requests

from regioes import caminho_parquet_municipal, regiao_atual

FONTE = "sicor"
BASE = "https://olinda.bcb.gov.br/olinda/servico/SICOR/versao/v2/odata/"
CODIGO_PRONAF = "0001"


def _consultar(entidade: str, filtro: str, tentativas: int = 10) -> list[dict] | None:
    """Devolve None se o servidor falhar em todas as tentativas.

    O Olinda devolve 500 de forma intermitente para a mesma URL (testado
    em 2026-11-14), entao insistir funciona. Um municipio tem poucas
    dezenas de linhas por ano: nao precisa paginar.
    """
    # O Olinda exige espacos como %20 no $filter (requests usaria "+").
    url = f"{BASE}{entidade}?$format=json&$top=5000&$filter={quote(filtro)}"
    for tentativa in range(1, tentativas + 1):
        r = requests.get(url, timeout=300)
        if r.status_code == 200:
            return r.json()["value"]
        time.sleep(2 * tentativa)
    return None


def ingerir(ano_inicial: int = 2013) -> int:
    regiao = regiao_atual()
    geocodigo, cod_sicor = regiao["geocodigo_ibge"], regiao.get("codigo_sicor")
    if not (geocodigo and cod_sicor):
        raise SystemExit(f"SICOR so existe para municipios brasileiros; regiao atual: {regiao['chave']}")

    linhas, falhas = [], []
    for ano in range(ano_inicial, dt.date.today().year + 1):
        consultas = (
            ("custeio", "CusteioMunicipioProduto", f"codIbge eq '{geocodigo}'", "VlCusteio", "AreaCusteio"),
            ("investimento", "InvestMunicipioProduto", f"cdMunicipio eq '{cod_sicor}'", "VlInvest", "AreaInvest"),
        )
        for finalidade, entidade, filtro, campo_valor, campo_area in consultas:
            registros = _consultar(entidade, f"{filtro} and AnoEmissao eq '{ano}'")
            if registros is None:
                falhas.append(f"{finalidade}/{ano}")
                continue
            for r in registros:
                linhas.append({
                    "finalidade": finalidade,
                    "ano": int(r["AnoEmissao"]),
                    "mes": int(r["MesEmissao"]),
                    "produto": r["nomeProduto"].strip('"'),
                    "programa_codigo": r["cdPrograma"],
                    "pronaf": r["cdPrograma"] == CODIGO_PRONAF,
                    "subprograma_codigo": r["cdSubPrograma"],
                    "atividade": {"1": "agricola", "2": "pecuaria"}.get(r["Atividade"], r["Atividade"]),
                    "valor_reais": r[campo_valor],
                    # Area 0 em investimento pecuario/maquinas = nao se aplica, nao "zero hectare".
                    "area_ha": r[campo_area] or None,
                })
        print(f"  ano={ano} acumulado={len(linhas)}")

    df = pd.DataFrame(linhas)
    df["geocodigo_ibge"] = geocodigo
    df["fonte"] = FONTE
    df["data_coleta_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()
    caminho = caminho_parquet_municipal(FONTE, geocodigo)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(caminho, index=False)
    print(f"fonte={FONTE} municipio={geocodigo} contratos_agregados={len(df)} -> {caminho}")
    if falhas:
        # Ano faltando != ano sem credito: avisar, nunca gravar como zero.
        print(f"ATENCAO: sem resposta do servidor para {falhas}; rode de novo para completar.")
    return len(df)


if __name__ == "__main__":
    ingerir(int(sys.argv[1]) if len(sys.argv) > 1 else 2013)
