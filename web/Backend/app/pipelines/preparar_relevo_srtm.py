"""Prepara HGT oficial fora do POST: python -m app.pipelines.preparar_relevo_srtm LAT LON [LAT LON ...]."""

import argparse
import datetime as dt
import hashlib
import io
import json
import math
import os
import subprocess
import sys
import zipfile

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
import requests

from app.configuracao import RAIZ
from app.integrations.srtm_local import AMOSTRAS, PASTA_SRTM, nome_tile
from app.pipelines.indice_espacial import celula_id, limites_da_celula, registrar_celula
from app.services.declividade import pontos_amostragem
from app.services.locais import buscar_por_codigo

CMR_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
PREFIXO_DADOS = "https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/SRTMGL1.003/"
PASTA_BRUTOS = RAIZ / "data" / "raw" / "srtm"


def preparar_tile(latitude: float, longitude: float) -> str:
    tile = nome_tile(latitude, longitude)
    PASTA_BRUTOS.mkdir(parents=True, exist_ok=True)
    destino = PASTA_BRUTOS / f"{tile}.hgt"
    if (destino.is_file() and destino.stat().st_size == AMOSTRAS * AMOSTRAS * 2
            and destino.with_suffix(".json").is_file()):
        try:
            origem = json.loads(destino.with_suffix(".json").read_text(encoding="utf-8"))
            if hashlib.sha256(destino.read_bytes()).hexdigest() == origem["sha256_hgt"]:
                return tile
        except (OSError, ValueError, KeyError):
            pass
    token = os.getenv("EARTHDATA_TOKEN")
    if not token:
        raise RuntimeError("Configure EARTHDATA_TOKEN para preparar o raster SRTM")
    resposta = requests.get(CMR_URL, params={
        "short_name": "SRTMGL1", "version": "003",
        "point": f"{longitude},{latitude}", "page_size": 10,
    }, timeout=30)
    resposta.raise_for_status()
    url = next((
        link["href"] for granulo in resposta.json().get("feed", {}).get("entry", [])
        if granulo.get("title") == f"{tile}.SRTMGL1.hgt"
        for link in granulo.get("links", [])
        if link.get("href", "").startswith(PREFIXO_DADOS) and link["href"].endswith(".hgt.zip")
    ), None)
    if url is None:
        raise LookupError("Nenhum raster SRTMGL1 oficial disponível para o ponto")
    try:
        resposta = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=120)
    except requests.RequestException:
        raise RuntimeError("Download Earthdata sem resposta; tente preparar o raster novamente") from None
    # Não incluir URL de redirecionamento assinada em mensagens de erro.
    if resposta.status_code != 200:
        raise RuntimeError(f"Download Earthdata indisponível (HTTP {resposta.status_code})")
    with zipfile.ZipFile(io.BytesIO(resposta.content)) as pacote:
        arquivo = next((n for n in pacote.namelist() if n.endswith(f"{tile}.hgt")), None)
        if arquivo is None:
            raise ValueError("Pacote SRTM sem o HGT solicitado")
        dados = pacote.read(arquivo)
    if len(dados) != AMOSTRAS * AMOSTRAS * 2:
        raise ValueError("Raster SRTMGL1 com tamanho inesperado")
    temporario = destino.with_suffix(".hgt.tmp")
    temporario.write_bytes(dados)
    temporario.replace(destino)
    destino.with_suffix(".json").write_text(json.dumps({
        "produto": "SRTMGL1.003", "tile": tile, "url_fonte": url,
        "extraido_em_utc": dt.datetime.now(dt.UTC).isoformat(),
        "sha256_hgt": hashlib.sha256(dados).hexdigest(),
        "resolucao_segundos_arco": 1, "amostras_por_lado": AMOSTRAS,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    return tile


def preparar_celula(latitude: float, longitude: float) -> str:
    tile = preparar_tile(latitude, longitude)
    bruto = PASTA_BRUTOS / f"{tile}.hgt"
    origem = json.loads(bruto.with_suffix(".json").read_text(encoding="utf-8"))
    limites = limites_da_celula(latitude, longitude)
    sul, oeste = math.floor(latitude), math.floor(longitude)
    i0 = max(0, round((sul + 1 - limites["lat_max"]) * (AMOSTRAS - 1)))
    i1 = min(AMOSTRAS - 1, round((sul + 1 - limites["lat_min"]) * (AMOSTRAS - 1)))
    j0 = max(0, round((limites["lon_min"] - oeste) * (AMOSTRAS - 1)))
    j1 = min(AMOSTRAS - 1, round((limites["lon_max"] - oeste) * (AMOSTRAS - 1)))
    grade = np.memmap(bruto, dtype=">i2", mode="r", shape=(AMOSTRAS, AMOSTRAS))
    recorte = np.array(grade[i0:i1 + 1, j0:j1 + 1], dtype=np.int16)
    del grade
    metadados = {**origem, "linha_inicial": i0, "coluna_inicial": j0,
                 "linhas": recorte.shape[0], "colunas": recorte.shape[1]}
    tabela = pa.table({"elevacao_m": recorte.reshape(-1)})
    tabela = tabela.replace_schema_metadata({b"fatesa_srtm": json.dumps(metadados).encode()})
    celula = celula_id(latitude, longitude)
    PASTA_SRTM.mkdir(parents=True, exist_ok=True)
    destino = PASTA_SRTM / f"{celula}.parquet"
    temporario = destino.with_suffix(".parquet.tmp")
    pq.write_table(tabela, temporario, compression="zstd")
    temporario.replace(destino)
    registrar_celula("srtm_relevo", latitude, longitude)
    return celula


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("coordenadas", type=float, nargs="*")
    parser.add_argument("--municipios", nargs="*", default=[], help="Códigos IBGE dos centroides usados na busca")
    args = parser.parse_args()
    if len(args.coordenadas) % 2:
        parser.error("Informe pares de latitude e longitude")
    pontos = list(zip(args.coordenadas[::2], args.coordenadas[1::2], strict=True))
    for codigo in args.municipios:
        local = buscar_por_codigo(codigo)
        if local is None:
            parser.error("Município não encontrado na base local")
        pontos.append((local["latitude"], local["longitude"]))
    if not pontos:
        parser.error("Informe coordenadas ou códigos IBGE")
    preparados = set()
    for lat, lon in pontos:
        for amostra_lat, amostra_lon in pontos_amostragem(lat, lon).values():
            celula = celula_id(amostra_lat, amostra_lon)
            if celula not in preparados:
                print("Célula SRTM preparada:", preparar_celula(amostra_lat, amostra_lon), flush=True)
                preparados.add(celula)
    if os.getenv("DATABASE_URL"):
        subprocess.run([sys.executable, str(RAIZ / "web/Backend/app/pipelines/indice_espacial_postgis.py")],
                       cwd=RAIZ / "web/Backend", check=True)
