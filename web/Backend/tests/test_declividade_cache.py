import pytest
import requests

from app.services import declividade as servico


@pytest.fixture
def cache(monkeypatch, tmp_path):
    monkeypatch.setattr(servico, "PASTA_CACHE", tmp_path)
    monkeypatch.setattr(servico, "configuracao", lambda: {"cache_ttl_s": 86400})
    monkeypatch.setattr(servico.time, "time", lambda: 100000)
    return tmp_path


RESULTADO = {
    "declividade_pct": 4.16, "relevo": "suave_ondulado", "elevacao_m": 294.3,
    "fonte": "USGS 3DEP (Elevation Point Query Service)", "tipo_acesso": "ao_vivo",
}


def test_consulta_valida_e_reutilizada_no_mesmo_ponto(cache, monkeypatch):
    chamadas = []
    monkeypatch.setattr(servico, "_consultar_declividade", lambda *p: chamadas.append(p) or RESULTADO)
    assert servico.declividade_do_ponto(42.1, -93.65) == RESULTADO
    r = servico.declividade_do_ponto(42.1, -93.65)
    assert r["declividade_pct"] == 4.16 and r["uso_cache"]
    assert r["consultado_em"] == 100000
    assert len(chamadas) == 1
    servico.declividade_do_ponto(42.10001, -93.65)
    assert len(chamadas) == 2


def test_ausencia_nao_e_guardada(cache, monkeypatch):
    monkeypatch.setattr(servico, "_consultar_declividade", lambda *p: None)
    assert servico.declividade_do_ponto(42.1, -93.65) is None
    assert not list(cache.glob("*.json"))
    monkeypatch.setattr(servico, "_consultar_declividade", lambda *p: RESULTADO)
    assert servico.declividade_do_ponto(42.1, -93.65) == RESULTADO


def test_cache_expirado_nao_esconde_falha_externa(cache, monkeypatch):
    monkeypatch.setattr(servico, "_consultar_declividade", lambda *p: RESULTADO)
    servico.declividade_do_ponto(42.1, -93.65)
    monkeypatch.setattr(servico.time, "time", lambda: 200000)
    def falhar(*p):
        raise requests.Timeout()
    monkeypatch.setattr(servico, "_consultar_declividade", falhar)
    with pytest.raises(requests.Timeout):
        servico.declividade_do_ponto(42.1, -93.65)


def test_cache_corrompido_e_consultado_novamente(cache, monkeypatch):
    monkeypatch.setattr(servico, "_consultar_declividade", lambda *p: RESULTADO)
    servico.declividade_do_ponto(42.1, -93.65)
    next(cache.glob("*.json")).write_text("incompleto", encoding="utf-8")
    assert servico.declividade_do_ponto(42.1, -93.65) == RESULTADO
