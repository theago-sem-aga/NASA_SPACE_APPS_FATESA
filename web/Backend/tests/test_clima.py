import json

import pytest

from app.integrations.clima_historico import agregar_clima


def corpo(unidade="mm/day"):
    return {
        "parameters": {"PRECTOTCORR": {"units": unidade}},
        "header": {"fill_value": -999},
        "properties": {
            "parameter": {
                "PRECTOTCORR": {
                    f"{ano}{mes:02d}": 1 for ano in (2019, 2020) for mes in range(1, 13)
                }
            }
        },
    }


def test_acumulados_respeitam_bissexto():
    meses, contagens = agregar_clima(corpo(), 2019, 2020)
    assert meses[1]["precipitacao_acumulada_mm"] == 28.5
    assert meses[0]["precipitacao_acumulada_mm"] == 31
    assert contagens["2"] == 2
    assert all(m["umidade_solo"] is None for m in meses)


def test_ausente_nao_vira_zero_e_mes_incompleto_nao_vira_normal():
    c = corpo()
    c["properties"]["parameter"]["PRECTOTCORR"]["201901"] = -999
    c["properties"]["parameter"]["PRECTOTCORR"]["201902"] = 0
    c["properties"]["parameter"]["PRECTOTCORR"]["202002"] = 0
    meses, _ = agregar_clima(c, 2019, 2020)
    assert meses[0]["precipitacao_acumulada_mm"] is None
    assert meses[1]["precipitacao_acumulada_mm"] == 0


def test_unidade_acumulada_nao_multiplica_dias():
    meses, _ = agregar_clima(corpo("mm/month"), 2019, 2020)
    assert meses[0]["precipitacao_acumulada_mm"] == 1


def test_unidade_desconhecida_e_rejeitada():
    with pytest.raises(ValueError):
        agregar_clima(corpo("kg/m2/s"), 2019, 2020)


def test_offline_usa_cache_com_proveniencia_e_aviso(monkeypatch, tmp_path):
    import requests

    from app.integrations import clima_historico as clima

    monkeypatch.setattr(clima, "RAIZ", tmp_path)
    monkeypatch.setenv("CACHE_TTL_S", "0")

    class Resposta:
        content = json.dumps(corpo()).encode()

        def raise_for_status(self):
            pass

        def json(self):
            return corpo()

    monkeypatch.setattr(clima, "requisitar", lambda *a, **k: Resposta())
    primeiro = clima._buscar(36.6, -119.7, 2019, 2020)

    def falhar(*a, **k):
        raise requests.Timeout()

    monkeypatch.setattr(clima, "requisitar", falhar)
    segundo = clima._buscar(36.6, -119.7, 2019, 2020)
    assert segundo["cache_desatualizado"] is True
    assert primeiro["sha256"] == segundo["sha256"]
    assert primeiro["extraido_em_utc"] == segundo["extraido_em_utc"]
