import pytest
from fastapi.testclient import TestClient

from app.api.v1 import analises as rotas
from app.main import app
from app.schemas.analises import Analise
from app.services import analises as servico


@pytest.fixture
def cliente():
    with TestClient(app) as c:
        yield c


GEADA_FIXTURE = {
    "nivel": "medio",
    "mes_mais_arriscado": 1,
    "meses_com_risco": [1, 12],
    "probabilidade_ano": 0.3,
    "meses": [
        {"mes": m, "probabilidade_geada": 0.3 if m in (1, 12) else 0.0, "probabilidade_geada_forte": 0.0,
         "anos_com_geada": 3 if m in (1, 12) else 0, "dias_geada_medio": 0.5 if m in (1, 12) else 0.0,
         "menor_minima_c": 1.0}
        for m in range(1, 13)
    ],
    "limiar_c": 2.0,
    "limiar_forte_c": 0.0,
    "periodo_inicio": 2011,
    "periodo_fim": 2020,
    "anos_analisados": 10,
    "fonte": "fixture",
    "variavel": "temperatura_minima_c",
    "tipo_acesso": "pre_processado",
}


def preparar(monkeypatch, repositorio):
    monkeypatch.setattr(servico, "risco_geada", lambda *args: GEADA_FIXTURE)
    monkeypatch.setattr(servico, "RepositorioAnalises", lambda: repositorio)
    monkeypatch.setattr(rotas, "RepositorioAnalises", lambda: repositorio)
    monkeypatch.setattr(
        servico,
        "coletar_variaveis",
        lambda *args: {"variaveis": [], "fontes_indisponiveis": [], "evidencias": {}},
    )
    monkeypatch.setattr(
        servico,
        "buscar_clima",
        lambda *args: {
            "clima_mensal": [
                {"mes": m, "precipitacao_acumulada_mm": 10, "umidade_solo": None}
                for m in range(1, 13)
            ],
            "fonte_clima": {
                "fonte_id": "fixture",
                "nome": "Fixture de teste, não real",
                "tipo_dado": "simulacao",
                "periodo_inicio": "2020-01-01",
                "periodo_fim": "2020-12-31",
            },
        },
    )


def test_post_e_get_preservam_resultado(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    monkeypatch.setenv("HABILITAR_CENARIOS_BETA", "true")
    r = cliente.post("/api/v1/analises", json=entrada.model_dump())
    assert r.status_code == 201, r.text
    corpo = r.json()
    Analise.model_validate(corpo)
    assert corpo["eh_mock"] is True
    assert corpo["estado_recomendacoes"] == "simulacao_beta"
    assert len(corpo["estrategias"]) == 3
    assert cliente.get("/api/v1/analises/" + corpo["analise_id"]).json() == corpo


def test_producao_nao_fabrica_estrategias(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    monkeypatch.setenv("HABILITAR_CENARIOS_BETA", "false")
    r = cliente.post("/api/v1/analises", json=entrada.model_dump())
    assert r.status_code == 201
    assert r.json()["estrategias"] == []
    assert r.json()["eh_mock"] is False


@pytest.mark.parametrize(
    "alteracao",
    [
        {"prioridades": ["uso_agua", "uso_agua"]},
        {"latitude": 91},
        {"recursos_disponiveis": {}},
        {"campoInventado": 1},
    ],
)
def test_validacao_uniforme(cliente, entrada, alteracao):
    r = cliente.post("/api/v1/analises", json={**entrada.model_dump(), **alteracao})
    assert r.status_code == 422
    assert r.json()["erro"]["codigo"] == "entrada_invalida"
    assert r.json()["erro"]["requisicao_id"] == r.headers["x-request-id"]


def test_json_invalido_400(cliente):
    r = cliente.post("/api/v1/analises", content="{", headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert r.json()["erro"]["codigo"] == "json_invalido"


def test_cors_post_e_falha_banco(cliente, monkeypatch, entrada):
    pre = cliente.options(
        "/api/v1/analises",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert pre.status_code == 200
    from sqlalchemy.exc import OperationalError

    def falhar(*args):
        raise OperationalError("secret", None, Exception("SENHA_NAO_PODE_VAZAR"))

    monkeypatch.setattr(rotas, "criar_analise", falhar)
    r = cliente.post(
        "/api/v1/analises", json=entrada.model_dump(), headers={"Origin": "http://localhost:5173"}
    )
    assert r.status_code == 503
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "SENHA" not in r.text


def test_california_e_fora_cobertura(cliente):
    assert cliente.get("/api/v1/municipios?busca=califórnia").json()[0]["uf"] == "CA"
    assert cliente.get("/api/v1/locais?latitude=36.6&longitude=-119.7").json()["codigo_ibge"] == ""
    assert cliente.get("/api/v1/locais?latitude=-20&longitude=-49").status_code == 404


def test_openapi_rotas_e_snake_case(cliente):
    c = cliente.get("/openapi.json").json()
    assert "post" in c["paths"]["/api/v1/analises"]
    for schema in c["components"]["schemas"].values():
        assert all(not any(ch.isupper() for ch in nome) for nome in schema.get("properties", {}))


def test_analise_traz_risco_de_geada(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["talhao"]["risco_geada"] == "medio"
    assert "NASA POWER" in corpo["talhao"]["bases"]
    assert corpo["geada"]["meses_com_risco"] == [1, 12]
    assert any("geada" in t.lower() for t in corpo["limitacoes"])


def test_falha_da_geada_nao_derruba_a_analise(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)

    def falhar(*args):
        raise OSError("POWER fora do ar")

    monkeypatch.setattr(servico, "risco_geada", falhar)
    resposta = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json"))
    assert resposta.status_code == 201, resposta.text
    corpo = resposta.json()
    assert corpo["geada"] is None and corpo["talhao"]["risco_geada"] is None
    assert {"fonte": "nasa_power_geada", "motivo": "falha_fonte"} in corpo["fontes_indisponiveis"]
