"""Declividade em cinco elevações (centro e quatro direções, raio ~100 m).

USGS 3DEP nos EUA; no hemisfério sul, SRTMGL1 preparado em disco pelo pipeline.
Não usa média/mínimo/máximo da célula de 0,1 grau (~11 km) como inclinação.
Sem raster ou sem todas as elevações: None. Cache por coordenada exata.
"""

from __future__ import annotations

import json
import math
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import suppress
from pathlib import Path
from tempfile import NamedTemporaryFile

from app.configuracao import RAIZ, configuracao
from app.domain.declividade import classificar_relevo, declividade_de_elevacoes
from app.integrations.srtm_local import buscar_elevacao_local
from app.integrations.usgs_elevacao import buscar_elevacao_ponto

OFFSET_GRAUS = 0.0009  # ~100 m em latitude (1 grau de latitude ~111,32 km)
METROS_POR_GRAU_LATITUDE = 111_320
PASTA_CACHE = RAIZ / "web" / "Backend" / ".cache" / "declividade"


def declividade_do_ponto(latitude: float, longitude: float) -> dict | None:
    """Reutiliza por cache_ttl_s uma consulta completa da mesma coordenada.

    Não guarda falha/ausência e não usa a célula de um ponto vizinho. O prazo
    segue a configuração de cache das fontes (24 h por padrão).
    """
    if not (math.isfinite(latitude) and -90 <= latitude <= 90
            and math.isfinite(longitude) and -180 <= longitude <= 180):
        raise ValueError("Coordenada inválida")
    # float.hex preserva a coordenada exata, sem arredondar para outra propriedade.
    caminho = PASTA_CACHE / f"{float(latitude).hex()}_{float(longitude).hex()}.json"
    try:
        guardado = json.loads(caminho.read_text(encoding="utf-8"))
        idade = time.time() - guardado["consultado_em"]
        resultado = guardado["resultado"]
        if (0 <= idade < configuracao()["cache_ttl_s"]
                and resultado["relevo"] in ("plano", "suave_ondulado", "ondulado")
                and math.isfinite(resultado["declividade_pct"])
                and resultado["declividade_pct"] >= 0):
            return {**resultado, "uso_cache": True, "consultado_em": guardado["consultado_em"]}
    except (OSError, ValueError, KeyError, TypeError):
        pass
    resultado = _consultar_declividade(latitude, longitude)
    if resultado is not None:
        temporario = None
        try:
            PASTA_CACHE.mkdir(parents=True, exist_ok=True)
            with NamedTemporaryFile(mode="w", encoding="utf-8", dir=PASTA_CACHE,
                                    suffix=".tmp", delete=False) as arquivo:
                temporario = Path(arquivo.name)
                json.dump({"consultado_em": time.time(), "resultado": resultado}, arquivo)
            temporario.replace(caminho)
        except OSError:
            # Falha no disco não deve descartar uma consulta real bem-sucedida.
            pass
        finally:
            if temporario is not None:
                with suppress(OSError):
                    temporario.unlink(missing_ok=True)
    return resultado


def _consultar_declividade(latitude: float, longitude: float) -> dict | None:
    # No hemisfério sul, usar somente raster SRTM preparado localmente;
    # nunca iniciar download durante a análise interativa.
    usa_srtm = latitude < 0
    consultar = buscar_elevacao_local if usa_srtm else buscar_elevacao_ponto
    pontos = pontos_amostragem(latitude, longitude)
    with ThreadPoolExecutor(max_workers=5) as executor:
        valores = list(executor.map(lambda p: consultar(*p), pontos.values()))
    elevacoes = dict(zip(pontos.keys(), valores, strict=True))
    if any(v is None for v in elevacoes.values()):
        return None

    distancia_m = OFFSET_GRAUS * METROS_POR_GRAU_LATITUDE
    declividade_pct = declividade_de_elevacoes(elevacoes, distancia_m)
    return {
        "declividade_pct": declividade_pct,
        "relevo": classificar_relevo(declividade_pct),
        "elevacao_m": round(elevacoes["centro"], 1),
        "fonte": "NASA SRTMGL1 v003 (1 segundo de arco)" if usa_srtm else "USGS 3DEP (Elevation Point Query Service)",
        "tipo_acesso": "pre_processado" if usa_srtm else "ao_vivo",
    }


def pontos_amostragem(latitude: float, longitude: float) -> dict[str, tuple[float, float]]:
    """Mesma geometria usada na preparação e no cálculo, sem regra duplicada."""
    cos_lat = math.cos(math.radians(latitude))
    offset_lon = OFFSET_GRAUS / max(cos_lat, 0.01)  # mesma distância em metros, leste-oeste
    return {
        "centro": (latitude, longitude),
        "norte": (latitude + OFFSET_GRAUS, longitude),
        "sul": (latitude - OFFSET_GRAUS, longitude),
        "leste": (latitude, longitude + offset_lon),
        "oeste": (latitude, longitude - offset_lon),
    }
