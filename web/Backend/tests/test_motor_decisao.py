"""Testes do motor de decisão (escolha dos caminhos pela prioridade do produtor).

Rodar: cd web/Backend && .venv/bin/python -m pytest tests -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "app" / "modelos"))
import motor_decisao as md  # noqa: E402

TEM_TUDO = {"maquinas_graos": "sim", "comprador_graos": "sim", "irrigacao": "nao"}
SJRP = "3549805"


def ids(resultado: dict) -> list[str]:
    return [s["estrategia_id"] for s in resultado["sugeridas"]]


@pytest.mark.parametrize("prioridades", [[], ["reducao_erosao"], ["adequacao_mercado", "valor_forragem"]])
def test_pratica_atual_sempre_primeiro_e_tres_caminhos(prioridades):
    r = md.sugerir(prioridades, TEM_TUDO, SJRP)
    assert ids(r)[0] == "pousio"
    assert len(ids(r)) == 3 and len(set(ids(r))) == 3


@pytest.mark.parametrize("prioridades, esperadas", [
    (["adequacao_mercado"], {"amendoim", "soja"}),
    (["valor_forragem", "uso_agua"], {"sorgo_forrageiro", "milheto"}),
    (["uso_agua"], {"milheto", "sorgo_forrageiro"}),
    (["fixacao_nitrogenio"], {"crotalaria", "mucuna"}),
    (["reducao_erosao", "materia_organica"], {"milheto", "crotalaria"}),
])
def test_sugestoes_mudam_com_as_prioridades(prioridades, esperadas):
    assert set(ids(md.sugerir(prioridades, TEM_TUDO, SJRP))[1:]) == esperadas


def test_sem_maquina_tira_os_graos_e_explica():
    r = md.sugerir(["adequacao_mercado"], {**TEM_TUDO, "maquinas_graos": "nao"}, SJRP)
    assert not {"amendoim", "soja"} & set(ids(r))
    assert {(f["estrategia_id"], f["motivo"]) for f in r["fora"]} >= {("amendoim", "sem_maquina"), ("soja", "sem_maquina")}


def test_nao_sei_nao_exclui():
    r = md.sugerir(["adequacao_mercado"], {"maquinas_graos": "nao_sei", "comprador_graos": "nao_sei"}, SJRP)
    assert set(ids(r)[1:]) == {"amendoim", "soja"}
    assert r["fora"] == []


def test_zarc_tira_cultura_sem_janela_na_reforma(monkeypatch):
    monkeypatch.setattr(md, "zarc_na_reforma", lambda _c: {"Amendoim": 20.0})  # cidade sem janela para soja
    r = md.sugerir(["adequacao_mercado"], TEM_TUDO, "9999999")
    assert "soja" not in ids(r) and "amendoim" in ids(r)
    assert {"estrategia_id": "soja", "motivo": "fora_zarc"} in r["fora"]
    assert r["zarc_conferido"]


def test_adubo_verde_nao_passa_pelo_zarc(monkeypatch):
    monkeypatch.setattr(md, "zarc_na_reforma", lambda _c: {})  # ZARC sem nenhuma cultura na janela
    r = md.sugerir(["fixacao_nitrogenio"], TEM_TUDO, "9999999")
    assert set(ids(r)[1:]) == {"crotalaria", "mucuna"}


def test_sem_zarc_da_cidade_nao_filtra_e_avisa():
    r = md.sugerir(["adequacao_mercado"], TEM_TUDO, None)
    assert set(ids(r)[1:]) == {"amendoim", "soja"}
    assert r["zarc_conferido"] is False
    assert all(s["zarc_risco_pct"] is None for s in r["sugeridas"])


def test_risco_do_zarc_vem_do_dado_real_de_sao_jose():
    r = md.sugerir(["adequacao_mercado"], TEM_TUDO, SJRP)
    assert all(s["zarc_risco_pct"] == 20.0 for s in r["sugeridas"][1:])


def test_prioridades_que_contam_sao_so_as_escolhidas_e_fortes():
    r = md.sugerir(["valor_forragem", "adequacao_mercado"], TEM_TUDO, SJRP)
    for s in r["sugeridas"][1:]:
        assert set(s["prioridades_que_contam"]) <= {"valor_forragem", "adequacao_mercado"}
        e = next(x for x in md.carregar_catalogo() if x["estrategia_id"] == s["estrategia_id"])
        assert all(md.nivel(e, p) >= md.NIVEL_QUE_CONTA for p in s["prioridades_que_contam"])


def test_tabela_do_front_cobre_todas_as_combinacoes(tmp_path, monkeypatch):
    monkeypatch.setattr(md, "SAIDA_FRONT", tmp_path / "estrategiasMotor.ts")
    md.gerar_front()
    texto = (tmp_path / "estrategiasMotor.ts").read_text(encoding="utf-8")
    # 22 combinações de prioridade (nenhuma, 6 sozinhas, 15 pares) x 8 de recursos x (sem ZARC + SJRP)
    assert texto.count('"s":') == 22 * 8 * 2
    chave = md.chave_tabela(["valor_forragem", "adequacao_mercado"], {"maquinas_graos": "nao"}, SJRP)
    assert chave == f"adequacao_mercado+valor_forragem|nss|{SJRP}" and f'"{chave}"' in texto
    assert f'"|sss|-"' in texto  # nenhuma prioridade, sem ZARC
