"""Acompanhamento da area pelo satelite (Sentinel-2 L2A, 10 m).

Para um ponto (o talhao), busca as fotos recentes no catalogo publico
Earth Search (Element84/AWS, sem login), descarta as que tem nuvem sobre o
talhao (mascara SCL do proprio produto), mede o verdor (NDVI) num quadrado de
100 m e gera a foto colorida de ~1,2 km em volta.

Regras (backend; o front so desenha):
  - estado observado pelo NDVI medio do quadrado de 100 m:
      < 0,25 terra_descoberta | 0,25-0,50 pouca_planta | >= 0,50 planta_verde
    (solo exposto fica em ~0,1-0,2; lavoura fechada passa de 0,6)
  - confere_por_cobertura: para cada cobertura do calendario das estrategias
    (CoberturaSolo do front), se o estado observado na ultima foto combina.
    Logo depois do plantio a planta ainda e pequena: por isso "pouca_planta"
    tambem conta como conferindo para culturas e adubo verde.

Convencao (secao 7): fonte de arquivo de satelite e PRE-PROCESSADA, nunca ao
vivo na requisicao do usuario. Este script roda offline e grava:
  - data/processed/sentinel2/ponto_<codigo_ibge>.json
  - web/Frontend/public/imagens/satelite/<codigo_ibge>_<data>.png
  - web/Frontend/src/api/mock/acompanhamentoMunicipio.ts (copia para o front)

Uso: python acompanhamento_sentinel2.py <codigo_ibge> <lat> <lon> [dias=120]
Atribuicao obrigatoria: "Contem dados Copernicus Sentinel-2 modificados (ano)".
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import rasterio
import requests
from PIL import Image, ImageDraw
from rasterio.warp import transform as warp_transform
from rasterio.windows import Window

from indice_espacial import RAIZ_DADOS_PROCESSADOS

# Leitura remota de COG mais rapida: nao listar a pasta do S3 a cada arquivo
# aberto e reaproveitar conexoes. Medido em 2026-11-14, junto com as leituras
# em paralelo: ponto novo caiu de ~2 min 12 s para ~32 s.
for _k, _v in {"GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR", "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif",
               "GDAL_HTTP_MULTIPLEX": "YES", "GDAL_HTTP_VERSION": "2", "VSI_CACHE": "TRUE"}.items():
    os.environ.setdefault(_k, _v)
LEITURAS_EM_PARALELO = 8

STAC = "https://earth-search.aws.element84.com/v1/search"
RAIZ = RAIZ_DADOS_PROCESSADOS.parents[1]
PASTA_IMAGENS = RAIZ / "web" / "Frontend" / "public" / "imagens" / "satelite"
SAIDA_FRONT = RAIZ / "web" / "Frontend" / "src" / "api" / "mock" / "acompanhamentoMunicipio.ts"

TALHAO_M = 100        # lado do quadrado onde o verdor e medido
FOTO_M = 1200         # lado da foto mostrada
FOTO_PX = 360
MAX_FOTOS = 4
NUVEM_MAX = 0.2       # fracao de pixels ruins aceitavel no quadrado do talhao
# Classes SCL ruins: sem dado, saturado, sombra de nuvem, nuvem media/alta, cirro.
SCL_RUIM = {0, 1, 3, 8, 9, 10}

ACEITA = {
    "solo_descoberto": {"terra_descoberta"},
    "palhada": {"terra_descoberta", "pouca_planta"},
    "cultura_principal": {"pouca_planta", "planta_verde"},
    "cultura_intermediaria": {"pouca_planta", "planta_verde"},
    "adubo_verde": {"pouca_planta", "planta_verde"},
}


def estado_pelo_ndvi(ndvi: float) -> str:
    return "terra_descoberta" if ndvi < 0.25 else "pouca_planta" if ndvi < 0.5 else "planta_verde"


def _janela(src, x: float, y: float, lado_m: float) -> Window:
    linha, coluna = src.index(x, y)
    meio = lado_m / 2 / abs(src.res[0])
    return Window(coluna - meio, linha - meio, 2 * meio, 2 * meio)


def _ler(href: str, lat: float, lon: float, lado_m: float, saida_px: int | None = None) -> np.ndarray:
    with rasterio.open(href) as src:
        (x,), (y,) = warp_transform("EPSG:4326", src.crs, [lon], [lat])
        janela = _janela(src, x, y, lado_m)
        forma = (saida_px, saida_px) if saida_px else None
        return src.read(1, window=janela, out_shape=forma, boundless=True, fill_value=0).astype(float)


def _cenas(lat: float, lon: float, dias: int) -> list[dict]:
    fim = dt.datetime.now(dt.timezone.utc)
    corpo = {
        "collections": ["sentinel-2-l2a"],
        "intersects": {"type": "Point", "coordinates": [lon, lat]},
        "datetime": f"{(fim - dt.timedelta(days=dias)).strftime('%Y-%m-%dT00:00:00Z')}/{fim.strftime('%Y-%m-%dT23:59:59Z')}",
        "limit": 50,
        "sortby": [{"field": "properties.datetime", "direction": "desc"}],
    }
    r = requests.post(STAC, json=corpo, timeout=60)
    r.raise_for_status()
    return r.json()["features"]


def _foto(cena: dict, lat: float, lon: float, caminho: Path) -> None:
    rgb = np.dstack([_ler(cena["assets"][b]["href"], lat, lon, FOTO_M, FOTO_PX) for b in ("red", "green", "blue")])
    rgb = np.clip(rgb / 2500, 0, 1) ** (1 / 1.6)
    img = Image.fromarray((rgb * 255).astype("uint8"))
    # Quadrado amarelo = onde o verdor foi medido (o talhao).
    lado = FOTO_PX * TALHAO_M / FOTO_M
    c = FOTO_PX / 2
    ImageDraw.Draw(img).rectangle([c - lado / 2, c - lado / 2, c + lado / 2, c + lado / 2], outline=(255, 214, 0), width=3)
    img.save(caminho, optimize=True)


def _avaliar(cena: dict, lat: float, lon: float) -> dict | None:
    """Verdor da cena no talhao, ou None se houver nuvem/sem dado sobre ele."""
    data = cena["properties"]["datetime"][:10]
    scl = _ler(cena["assets"]["scl"]["href"], lat, lon, TALHAO_M)
    ruim = np.isin(scl, list(SCL_RUIM)).mean() if scl.size else 1.0
    if ruim > NUVEM_MAX:
        print(f"  {data}: nuvem/sem dado sobre o talhao ({ruim:.0%}), pulando")
        return None
    vermelho = _ler(cena["assets"]["red"]["href"], lat, lon, TALHAO_M)
    nir = _ler(cena["assets"]["nir"]["href"], lat, lon, TALHAO_M)
    # Sem aplicar o offset -0,1 do metadado: nesta colecao (sentinel-2-l2a) os
    # valores ja vem sem os +1000. Verificado em 2026-11-14: vermelho chega a
    # 172 (impossivel com +1000) e o NDVI sem offset (p5 0,11 / p50 0,55 /
    # p99 0,91) bate com a colecao sentinel-2-c1-l2a corrigida.
    ndvi = float(np.nanmean((nir - vermelho) / np.where(nir + vermelho == 0, np.nan, nir + vermelho)))
    print(f"  {data}: ok, ndvi={ndvi:.2f} ({estado_pelo_ndvi(ndvi)})")
    return {"data": data, "ndvi": round(ndvi, 2), "estado": estado_pelo_ndvi(ndvi), "cena": cena}


def acompanhar(chave: str, lat: float, lon: float, dias: int = 120,
               pasta_imagens: Path = PASTA_IMAGENS, prefixo_url: str = "imagens/satelite/",
               max_cenas: int = 15) -> dict:
    """chave = nome base das fotos (codigo IBGE no CLI, coordenada na API).
    max_cenas limita quantas passagens olhar (cada uma custa leituras na rede)."""
    pasta_imagens.mkdir(parents=True, exist_ok=True)
    cenas, vistas = [], set()
    for cena in _cenas(lat, lon, dias):  # mais nova primeiro
        data = cena["properties"]["datetime"][:10]
        if data not in vistas:  # mesma passagem em dois tiles: fica a primeira
            vistas.add(data)
            cenas.append(cena)
    cenas = cenas[:max_cenas]

    with ThreadPoolExecutor(LEITURAS_EM_PARALELO) as pool:
        avaliadas = list(pool.map(lambda c: _avaliar(c, lat, lon), cenas))
        escolhidas = [a for a in avaliadas if a][:MAX_FOTOS]
        nomes = [f"{chave}_{a['data']}.png" for a in escolhidas]
        list(pool.map(lambda a_n: _foto(a_n[0]["cena"], lat, lon, pasta_imagens / a_n[1]), zip(escolhidas, nomes)))
    fotos = [{"data": a["data"], "ndvi": a["ndvi"], "estado": a["estado"], "imagem": f"{prefixo_url}{n}",
              "cena_id": a["cena"]["id"]} for a, n in zip(escolhidas, nomes)]

    ultima = fotos[0] if fotos else None
    return {
        "codigo_ibge": chave,
        "latitude": lat,
        "longitude": lon,
        "fotos": fotos,
        "confere_por_cobertura": {cob: (ultima["estado"] in ok) if ultima else None for cob, ok in ACEITA.items()},
        "lado_talhao_m": TALHAO_M,
        "fonte": "Sentinel-2 L2A (ESA/Copernicus), catálogo Earth Search (Element84)",
        "atribuicao": f"Contém dados Copernicus Sentinel-2 modificados ({dt.date.today().year})",
        "tipo_dado": "observacao_historica",
        "gerado_em": dt.date.today().isoformat(),
    }


def gravar(codigo_ibge: str, lat: float, lon: float, dias: int) -> None:
    resultado = acompanhar(codigo_ibge, lat, lon, dias)
    bruto = RAIZ_DADOS_PROCESSADOS / "sentinel2" / f"ponto_{codigo_ibge}.json"
    bruto.parent.mkdir(parents=True, exist_ok=True)
    bruto.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    sem_ids = {**resultado, "fotos": [{k: v for k, v in f.items() if k != "cena_id"} for f in resultado["fotos"]]}
    SAIDA_FRONT.write_text(
        "// GERADO por web/Backend/app/pipelines/acompanhamento_sentinel2.py -- nao editar a mao.\n"
        "// Copia local da rota proposta GET /api/v1/acompanhamento. Fotos REAIS do Sentinel-2,\n"
        "// de um talhao de EXEMPLO por municipio (o centro da cidade mostraria casas).\n"
        "import type { Acompanhamento } from '../tipos';\n\n"
        f"export const ACOMPANHAMENTOS: Record<string, Acompanhamento> = {json.dumps({codigo_ibge: sem_ids}, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )
    print(f"fotos={len(resultado['fotos'])} -> {bruto} e {SAIDA_FRONT}")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("uso: python acompanhamento_sentinel2.py <codigo_ibge> <lat> <lon> [dias=120]")
        sys.exit(1)
    gravar(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]) if len(sys.argv) > 4 else 120)
