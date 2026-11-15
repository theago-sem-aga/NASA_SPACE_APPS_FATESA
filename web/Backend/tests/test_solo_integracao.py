import pytest
import requests

from app.services import solo


def preparar(monkeypatch, componentes):
    monkeypatch.setattr(solo, "buscar_solo_ponto", lambda *a: {
        "disponivel": True, "componentes": componentes,
    })
    monkeypatch.setattr(solo, "camada_soilgrids", lambda *a: None)


def test_componentes_concordantes_nao_inventam_percentuais(monkeypatch):
    preparar(monkeypatch, [
        {"areia_pct": 22.0, "argila_pct": 31.0},
        {"areia_pct": 41.1, "argila_pct": 22.0},
    ])
    resultado = solo.buscar_textura_ponto(42.1, -93.65)
    assert resultado["textura_solo"] == "media"
    assert resultado["componentes_considerados"] == 2
    assert "areia_pct" not in resultado and "argila_pct" not in resultado


def test_componentes_com_classes_distintas_continuam_ambiguos(monkeypatch):
    preparar(monkeypatch, [
        {"areia_pct": 22.0, "argila_pct": 31.0},
        {"areia_pct": 15.0, "argila_pct": 50.0},
    ])
    assert solo.buscar_textura_ponto(42.1, -93.65) is None


@pytest.mark.parametrize("valor", [None, "sem dado", float("nan"), -1, 101])
def test_componente_incompleto_ou_invalido_nao_cria_consenso(monkeypatch, valor):
    preparar(monkeypatch, [
        {"areia_pct": 22.0, "argila_pct": 31.0},
        {"areia_pct": valor, "argila_pct": 22.0},
    ])
    assert solo.buscar_textura_ponto(42.1, -93.65) is None


def test_usda_falha_mas_soilgrids_ainda_e_consultado(monkeypatch):
    def falhar(*a):
        raise requests.Timeout()
    monkeypatch.setattr(solo, "buscar_solo_ponto", falhar)
    monkeypatch.setattr(solo, "camada_soilgrids", lambda *a: {"areia": 20, "argila": 40})
    resultado = solo.buscar_textura_ponto(-20.82, -49.38)
    assert resultado == {"areia_pct": 20, "argila_pct": 40, "fonte": "SoilGrids"}


def test_componente_unico_preserva_percentuais(monkeypatch):
    preparar(monkeypatch, [{"areia_pct": 22.0, "argila_pct": 31.0}])
    assert solo.buscar_textura_ponto(42.1, -93.65) == {
        "areia_pct": 22.0, "argila_pct": 31.0, "fonte": "USDA Soil Data Access",
    }
