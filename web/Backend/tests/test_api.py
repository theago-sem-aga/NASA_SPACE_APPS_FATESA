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
    "nivel_min": "medio",
    "nivel_max": "alto",
    "mes_mais_arriscado": 1,
    "meses_com_risco": [1, 12],
    "probabilidade_ano": 0.3,
    "probabilidade_ano_min": 0.17,
    "probabilidade_ano_max": 0.48,
    "confianca_intervalo": 0.9,
    "meses": [
        {"mes": m, "probabilidade_geada": 0.3 if m in (1, 12) else 0.0,
         "probabilidade_geada_min": 0.17 if m in (1, 12) else 0.0,
         "probabilidade_geada_max": 0.48 if m in (1, 12) else 0.08, "probabilidade_geada_forte": 0.0,
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


TENDENCIA_FIXTURE = {
    "tendencia": "secando",
    "mm_por_decada": -174.0,
    "pct_por_decada": -15.0,
    "p_valor": 0.0001,
    "alfa": 0.05,
    "media_anual_mm": 1161.0,
    "reta_inicio_mm": 1400.0,
    "reta_fim_mm": 880.0,
    "anos": [{"ano": 2011 + i, "chuva_mm": 1300.0 - 40 * i} for i in range(10)],
    "periodo_inicio": 2011,
    "periodo_fim": 2020,
    "anos_analisados": 10,
    "metodo": "fixture",
    "fonte": "fixture",
    "variavel": "precipitacao_acumulada_mm",
    "tipo_acesso": "pre_processado",
}


ESTRESSE_FIXTURE = {
    "situacao": "muito_abaixo",
    "data_foto": "2026-10-16",
    "ndvi_atual": 0.41,
    "normal_mediana": 0.62,
    "normal_p10": 0.48,
    "normal_p25": 0.55,
    "normal_p75": 0.68,
    "normal_p90": 0.72,
    "anomalia_pct": -33.9,
    "posicao": 0.04,
    "anos_mais_verdes": 25,
    "anos_comparados": 26,
    "ndvi_mediano_geral": 0.6,
    "limiar_sem_vegetacao": 0.2,
    "faixa_ndvi_atual": "vegetacao_esparsa_ou_estressada",
    "fonte_referencia": "fixture",
    "ultimas_fotos": [
        {"data": "2026-10-16", "ndvi": 0.41, "normal_mediana": 0.62, "normal_p10": 0.48, "normal_p90": 0.72}
    ],
    "periodo_inicio": 2000,
    "periodo_fim": 2026,
    "metodo": "fixture",
    "latitude_pixel": -20.89,
    "longitude_pixel": -49.36,
    "distancia_pixel_km": 1.2,
    "fonte": "modis_ornl",
    "produto": "MOD13Q1",
    "tipo_acesso": "pre_processado",
}


def preparar(monkeypatch, repositorio):
    # Estes testes validam orquestração/contrato com dados controlados, sem
    # depender da rede nem consumir credenciais reais do ambiente.
    monkeypatch.setattr(servico, "buscar_textura_ponto", lambda *args: None)
    monkeypatch.setattr(servico, "declividade_do_ponto", lambda *args: None)
    monkeypatch.setattr(servico, "resumo_risco_seca", lambda *args: None)
    monkeypatch.setattr(servico, "resumo_precipitacao_extrema", lambda *args: None)
    monkeypatch.setattr(servico, "estresse_termico_do_ponto", lambda *args: CALOR_FIXTURE)
    monkeypatch.setattr(servico, "estresse_vegetal", lambda *args: ESTRESSE_FIXTURE)
    monkeypatch.setattr(servico, "risco_geada", lambda *args: GEADA_FIXTURE)
    monkeypatch.setattr(servico, "tendencia_hidrica", lambda *args: TENDENCIA_FIXTURE)
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


def test_municipios_cobrem_o_brasil_real_fora_dele_404(cliente):
    # Base real do IBGE (ingestao_municipios_brasil.py): "Califórnia" é um
    # município real do Paraná, não o piloto antigo da Califórnia (EUA).
    resultado = cliente.get("/api/v1/municipios?busca=califórnia").json()
    assert resultado[0]["uf"] == "PR"
    assert resultado[0]["codigo_ibge"]

    local = cliente.get("/api/v1/locais?latitude=-20.78&longitude=-49.36").json()
    assert local["municipio"] == "São José do Rio Preto"
    assert local["uf"] == "SP"

    # Fresno, CA (EUA): cidade mais perto pela base do Census (lugares_eua.parquet).
    eua = cliente.get("/api/v1/locais?latitude=36.6&longitude=-119.7").json()
    assert eua["uf"] == "CA" and eua["codigo_ibge"] == ""
    # No meio do oceano: nem Brasil nem EUA.
    assert cliente.get("/api/v1/locais?latitude=0&longitude=-30").status_code == 404


def test_openapi_rotas_e_snake_case(cliente):
    c = cliente.get("/openapi.json").json()
    assert "post" in c["paths"]["/api/v1/analises"]
    for schema in c["components"]["schemas"].values():
        assert all(not any(ch.isupper() for ch in nome) for nome in schema.get("properties", {}))


def test_analise_traz_risco_de_geada(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["talhao"]["risco_geada"] == "medio"
    assert (corpo["geada"]["nivel_min"], corpo["geada"]["nivel_max"]) == ("medio", "alto")
    assert corpo["geada"]["meses"][0]["probabilidade_geada_max"] == 0.48
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


def test_analise_traz_tendencia_hidrica(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["tendencia_hidrica"]["tendencia"] == "secando"
    assert corpo["tendencia_hidrica"]["mm_por_decada"] == -174.0
    assert len(corpo["tendencia_hidrica"]["anos"]) == 10
    assert any("Tendência da chuva" in t for t in corpo["limitacoes"])


def test_falha_da_tendencia_nao_derruba_a_analise(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)

    def falhar(*args):
        raise ValueError("série com 5 anos completos")

    monkeypatch.setattr(servico, "tendencia_hidrica", falhar)
    resposta = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json"))
    assert resposta.status_code == 201, resposta.text
    corpo = resposta.json()
    assert corpo["tendencia_hidrica"] is None
    assert {"fonte": "nasa_power_tendencia_hidrica", "motivo": "falha_fonte"} in corpo["fontes_indisponiveis"]


def test_analise_traz_estresse_vegetal(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["estresse_vegetal"]["situacao"] == "muito_abaixo"
    assert corpo["estresse_vegetal"]["anos_comparados"] == 26
    assert "MODIS" in corpo["talhao"]["bases"]
    assert any("Estresse vegetal" in t and "colheita" in t for t in corpo["limitacoes"])


def test_sem_historico_de_ndvi_nao_derruba_a_analise(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)

    def sem_arquivo(*args):
        raise LookupError("sem série")

    monkeypatch.setattr(servico, "estresse_vegetal", sem_arquivo)
    resposta = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json"))
    assert resposta.status_code == 201, resposta.text
    corpo = resposta.json()
    assert corpo["estresse_vegetal"] is None
    assert {"fonte": "modis_ndvi_estresse_vegetal", "motivo": "sem_historico_pre_processado"} in corpo[
        "fontes_indisponiveis"
    ]


@pytest.mark.parametrize("codigo,nome,uf", [
    ("3549805", "São José do Rio Preto", "SP"),
    ("3533908", "Olímpia", "SP"),
])
def test_descricao_municipal_e_persistida(cliente, monkeypatch, repositorio, entrada, codigo, nome, uf):
    preparar(monkeypatch, repositorio)
    monkeypatch.setattr(servico, "buscar_por_codigo", lambda c: {"municipio": nome, "uf": uf})
    entrada.codigo_ibge = codigo
    entrada.origem_local = "municipio"
    resposta = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json"))
    assert resposta.status_code == 201
    analise = resposta.json()
    assert analise["descricao_local"] == f"{nome} ({uf})"
    salva = cliente.get(f"/api/v1/analises/{analise['analise_id']}").json()
    assert salva["descricao_local"] == analise["descricao_local"]


def test_codigo_desconhecido_nao_inventa_cidade(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    monkeypatch.setattr(servico, "buscar_por_codigo", lambda c: None)
    entrada.codigo_ibge = "0000000"
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["descricao_local"] == "Coordenada 36.6000, -119.7000"


def test_coordenada_digitada_nao_e_descrita_como_centroide(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    entrada.origem_local = "municipio"
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert any("Coordenada informada manualmente" in texto for texto in corpo["limitacoes"])
    assert not any("por referência regional" in texto for texto in corpo["limitacoes"])


def test_fonte_que_responde_sem_dado_tem_motivo_explicito(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    fontes = corpo["fontes_indisponiveis"]
    assert {"fonte": "textura_solo", "motivo": "sem_textura_inequivoca"} in fontes
    assert {"fonte": "declividade_usgs_3dep", "motivo": "sem_elevacao_disponivel"} in fontes


CALOR_FIXTURE = {
    "nivel": "baixo", "mes_mais_arriscado": None, "meses_com_risco": [],
    "dias_calor_ano": 0.0, "limiar_c": 35.0, "periodo_inicio": 2000,
    "periodo_fim": 2020, "anos_analisados": 21, "fonte": "fixture",
    "variavel": "temperatura_maxima_c", "meses": [
        {"mes": mes, "probabilidade_calor": 0.0, "anos_com_calor": 0,
         "dias_calor_medio": 0.0, "maior_maxima_c": 30.0, "maxima_media_c": 25.0}
        for mes in range(1, 13)
    ],
}


def test_calor_integrado_chega_ao_contrato(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["estresse_termico"] == CALOR_FIXTURE


def test_falha_de_calor_nao_derruba_analise(cliente, monkeypatch, repositorio, entrada):
    preparar(monkeypatch, repositorio)
    def falhar(*args):
        raise ValueError("série incompleta")
    monkeypatch.setattr(servico, "estresse_termico_do_ponto", falhar)
    corpo = cliente.post("/api/v1/analises", json=entrada.model_dump(mode="json")).json()
    assert corpo["estresse_termico"] is None
    assert {"fonte": "nasa_power_estresse_termico", "motivo": "falha_fonte"} in corpo["fontes_indisponiveis"]
