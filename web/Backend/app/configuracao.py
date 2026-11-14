"""Configuração local; nunca publicar valores de credenciais nos logs."""

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parents[3]
load_dotenv(RAIZ / "web" / ".env")


@lru_cache
def configuracao() -> dict:
    return {
        "database_url": os.getenv("DATABASE_URL", ""),
        "origens": [
            s.strip()
            for s in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(
                ","
            )
            if s.strip()
        ],
        "timeout_s": float(os.getenv("FONTES_TIMEOUT_S", "12")),
        "cache_ttl_s": int(os.getenv("CACHE_TTL_S", "86400")),
        "ano_inicio": int(os.getenv("CLIMA_ANO_INICIO", "1991")),
        "ano_fim": int(os.getenv("CLIMA_ANO_FIM", "2020")),
        "cenarios_beta": os.getenv("HABILITAR_CENARIOS_BETA", "false").lower() == "true",
    }
