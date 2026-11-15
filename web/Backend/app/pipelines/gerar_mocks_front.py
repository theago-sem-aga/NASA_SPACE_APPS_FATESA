"""Congela resultados REAIS do backend nos mocks do front (modo demonstração).

Roda os serviços de verdade (geada, tendência hídrica, estresse vegetal) nos
pontos do mock e grava o resultado em web/Frontend/src/api/mock/. Nenhum
número é escrito à mão: se a fonte não tiver dado, o script falha (geada e
tendência) ou grava null (estresse vegetal, que só existe onde a série de
NDVI foi baixada).

Uso:  cd web/Backend && python -m app.pipelines.gerar_mocks_front [geada|tendencia|estresse ...]
      (sem argumento, gera os três)
"""

from __future__ import annotations

import datetime as dt
import json
import sys

from app.configuracao import RAIZ
from app.services.estresse_vegetal import estresse_vegetal
from app.services.geada import risco_geada
from app.services.tendencia_hidrica import tendencia_hidrica

PASTA_MOCK = RAIZ / "web" / "Frontend" / "src" / "api" / "mock"
GERADOR = "web/Backend/app/pipelines/gerar_mocks_front.py"

# Pontos do mock: São José do Rio Preto (célula -209_-494) e Fresno (célula 366_-1197).
SJRP = (-20.82, -49.38)
FRESNO = (36.65, -119.65)


def _gravar(arquivo: str, tipo: str, cabecalho: list[str], valores: dict[str, dict | None], anulavel: bool) -> None:
    linhas = [f"// GERADO por {GERADOR} -- nao editar a mao."]
    linhas += [f"// {texto}" for texto in cabecalho]
    linhas += [f"import type {{ {tipo} }} from '../tipos';", ""]
    anotacao = f"{tipo} | null" if anulavel else tipo
    for nome, valor in valores.items():
        corpo = "null" if valor is None else json.dumps(valor, ensure_ascii=False)
        linhas += [f"export const {nome}: {anotacao} = {corpo};", ""]
    (PASTA_MOCK / arquivo).write_text("\n".join(linhas), encoding="utf-8")
    print(f"gravado {arquivo}")


def _hoje() -> str:
    return dt.date.today().isoformat()


def gerar_geada() -> None:
    sjrp, fresno = risco_geada(*SJRP), risco_geada(*FRESNO)
    _gravar(
        "geadaMock.ts",
        "RiscoGeada",
        [
            f"Numeros REAIS da NASA POWER (minima diaria do ar), congelados em {_hoje()}:",
            f"Sao Jose do Rio Preto (celula -209_-494, {sjrp['periodo_inicio']}-{sjrp['periodo_fim']}, {sjrp['tipo_acesso']}) e",
            f"Fresno (celula 366_-1197, {fresno['periodo_inicio']}-{fresno['periodo_fim']}, {fresno['tipo_acesso']}).",
            "Para ver Fresno no mock: ?simular=fresno (ou ?simular=geada)",
        ],
        {"GEADA_SJRP": sjrp, "GEADA_FRESNO": fresno},
        anulavel=False,
    )


def gerar_tendencia() -> None:
    sjrp, fresno = tendencia_hidrica(*SJRP), tendencia_hidrica(*FRESNO)
    _gravar(
        "tendenciaHidricaMock.ts",
        "TendenciaHidrica",
        [
            f"Numeros REAIS da NASA POWER (chuva diaria somada por ano), congelados em {_hoje()}:",
            f"Sao Jose do Rio Preto (celula -209_-494, {sjrp['periodo_inicio']}-{sjrp['periodo_fim']}, {sjrp['tipo_acesso']}) e",
            f"Fresno (celula 366_-1197, {fresno['periodo_inicio']}-{fresno['periodo_fim']}, {fresno['tipo_acesso']}).",
            "Para ver Fresno no mock: ?simular=fresno",
        ],
        {"TENDENCIA_SJRP": sjrp, "TENDENCIA_FRESNO": fresno},
        anulavel=False,
    )


def gerar_estresse() -> None:
    valores = {}
    for nome, ponto in (("ESTRESSE_SJRP", SJRP), ("ESTRESSE_FRESNO", FRESNO)):
        try:
            valores[nome] = estresse_vegetal(*ponto)
        except LookupError:
            valores[nome] = None
    _gravar(
        "estresseVegetalMock.ts",
        "EstresseVegetal",
        [
            f"Numeros REAIS do NDVI do MODIS (MOD13Q1, API do ORNL), congelados em {_hoje()}.",
            "Sao Jose do Rio Preto: pixel (-20.89, -49.36), celula -209_-494. Fresno: pixel (36.65, -119.65),",
            "celula 366_-1197. Os dois sao lavoura (confirmado pelo Thiago em 15/11/2026).",
            "Para ver Fresno no mock: ?simular=fresno",
        ],
        valores,
        anulavel=True,
    )


GERADORES = {"geada": gerar_geada, "tendencia": gerar_tendencia, "estresse": gerar_estresse}

if __name__ == "__main__":
    for nome in sys.argv[1:] or list(GERADORES):
        GERADORES[nome]()
