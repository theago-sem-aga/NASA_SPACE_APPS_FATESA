import requests

from app.services import coleta_variaveis as coleta


def test_falha_em_uma_fonte_preserva_demais(monkeypatch):
    def buscar(fonte, lat, lon):
        if fonte == "nasa_power":
            raise requests.Timeout()
        if fonte == "srtm":
            return {"serie": [{"elevacao_media_m": 100, "n_pixels_agregados": 999}]}
        return None

    monkeypatch.setattr(coleta, "com_cache", lambda chave, ttl, func: func())
    monkeypatch.setattr(coleta, "_buscar", buscar)
    r = coleta.coletar_variaveis(36.6, -119.7)
    assert r["variaveis"] == [
        {
            "nome": "elevacao_media_m",
            "fonte": "srtm",
            "tipo_acesso": "pre_processado",
            "data": None,
            "valor": 100.0,
        }
    ]
    assert {"fonte": "nasa_power", "motivo": "timeout"} in r["fontes_indisponiveis"]


def test_nan_vira_ausencia_e_zero_permanece():
    r = coleta._variaveis_de_serie(
        [{"precipitacao_acumulada_mm": float("nan")}, {"precipitacao_acumulada_mm": 0}],
        "gpm",
        "pre_processado",
    )
    assert r[0]["valor"] is None
    assert r[1]["valor"] == 0


def test_chave_openet_ausente_nao_e_cobertura(monkeypatch):
    monkeypatch.delenv("OPENET_API_KEY", raising=False)
    r = coleta._buscar("openet", 36.6, -119.7)
    assert r["motivo"] == "chave_nao_configurada"
