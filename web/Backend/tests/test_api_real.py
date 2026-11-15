from fastapi.testclient import TestClient

from app.main import app
from app.modelos.motor_decisao import montar_estrategias_reais
from app.schemas.analises import Estrategia


def test_cana_disponivel_sem_cenarios_beta(monkeypatch):
    monkeypatch.setenv("HABILITAR_CENARIOS_BETA", "false")
    with TestClient(app) as cliente:
        culturas = cliente.get("/api/v1/culturas").json()
    assert next(c for c in culturas if c["cultura_id"] == "cana_de_acucar")["tem_demonstracao"]
    assert not next(c for c in culturas if c["cultura_id"] == "milho")["tem_demonstracao"]


def test_forragem_do_catalogo_chega_ao_json():
    estrategias, _ = montar_estrategias_reais(["valor_forragem"], {}, "3549805", "SJRP")
    for entrada in estrategias:
        saida = Estrategia.model_validate(entrada).model_dump()
        assert saida["atributos"]["valor_forragem"] == entrada["atributos"]["valor_forragem"]


def test_previsao_real_e_sem_cobertura():
    with TestClient(app) as cliente:
        resposta = cliente.get("/api/v1/previsao?codigo_ibge=3549805")
        assert resposta.status_code == 200
        assert resposta.json()["tipo_dado"] == "previsao"
        assert resposta.json()["url_fonte"].startswith("https://")
        assert cliente.get("/api/v1/previsao?codigo_ibge=0000000").json() is None
        assert cliente.get("/api/v1/previsao?codigo_ibge=abc").status_code == 422
