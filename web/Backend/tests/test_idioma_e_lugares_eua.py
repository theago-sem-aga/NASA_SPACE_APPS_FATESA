"""Idioma da resposta (?idioma / campo idioma) e busca de cidades e condados dos EUA.

Rodar: cd web/Backend && python -m pytest tests/test_idioma_e_lugares_eua.py -v
"""

from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.api.v1.producao_idioma import traduzir_painel
from app.domain.motor import gerar_cenarios
from app.main import app
from app.modelos.motor_decisao import catalogo_no_idioma, carregar_catalogo, montar_estrategias_reais
from app.pipelines.ingestao_lugares_eua import limpar_nome
from app.services import locais


@pytest.fixture
def cliente():
    return TestClient(app)


# ---------- busca de lugares dos EUA ----------

@pytest.fixture
def lugares_falsos(monkeypatch):
    """Base pequena no formato de lugares_eua.parquet (sem depender do arquivo real)."""
    eua = pd.DataFrame([
        {"geoid": "0627000", "nome": "Fresno", "uf": "CA", "tipo": "cidade", "latitude": 36.782684, "longitude": -119.793359},
        {"geoid": "4827540", "nome": "Fresno", "uf": "TX", "tipo": "cidade", "latitude": 29.537522, "longitude": -95.468665},
        {"geoid": "06019", "nome": "Fresno County", "uf": "CA", "tipo": "condado", "latitude": 36.761006, "longitude": -119.655019},
        {"geoid": "0625296", "nome": "Fowler", "uf": "CA", "tipo": "cidade", "latitude": 36.627, "longitude": -119.678},
    ])
    eua["busca"] = eua["nome"].map(locais._normalizar)
    br = pd.DataFrame([
        {"geocodigo_ibge": "3549805", "municipio": "São José do Rio Preto", "uf": "SP", "latitude": -20.797, "longitude": -49.357},
    ])
    br["busca"] = br["municipio"].map(locais._normalizar)
    monkeypatch.setattr(locais, "_tabela_eua", lambda: eua)
    monkeypatch.setattr(locais, "_tabela", lambda: br)


def test_nome_do_census_perde_so_o_sufixo_de_tipo():
    assert limpar_nome("Fresno city") == "Fresno"
    assert limpar_nome("Abanda CDP") == "Abanda"
    assert limpar_nome("Salt Lake City city") == "Salt Lake City"
    assert limpar_nome("Nashville-Davidson metropolitan government (balance)") == "Nashville-Davidson"


def test_busca_acha_cidade_e_condado_dos_eua(lugares_falsos):
    r = locais.buscar_por_nome("fresno")
    assert [(x["municipio"], x["uf"]) for x in r] == [("Fresno", "CA"), ("Fresno", "TX"), ("Fresno County", "CA")]
    assert all(x["codigo_ibge"] == "" for x in r)
    assert r[0]["latitude"] == pytest.approx(36.782684)


def test_busca_continua_achando_o_brasil(lugares_falsos):
    r = locais.buscar_por_nome("sao jose do rio")
    assert r[0]["codigo_ibge"] == "3549805"


def test_gps_nos_eua_da_nome_da_cidade_mais_perto(lugares_falsos):
    r = locais.localizar_por_coordenada(36.65, -119.65)
    assert (r["municipio"], r["uf"], r["codigo_ibge"]) == ("Fowler", "CA", "")
    assert (r["latitude"], r["longitude"]) == (36.65, -119.65)  # o ponto do GPS, não o centro da cidade


def test_gps_longe_de_qualquer_cidade_nao_inventa_lugar(lugares_falsos):
    assert locais.localizar_por_coordenada(44.0, -110.0) is None  # longe das cidades da base de teste
    assert locais.localizar_por_coordenada(0.0, 0.0) is None


# ---------- idioma ----------

def test_culturas_em_ingles_e_em_portugues(cliente):
    en = {c["cultura_id"]: c["nome"] for c in cliente.get("/api/v1/culturas?idioma=en").json()}
    pt = {c["cultura_id"]: c["nome"] for c in cliente.get("/api/v1/culturas").json()}
    assert en["milho"] == "Corn" and en["cana_de_acucar"] == "Sugarcane"
    assert pt["milho"] == "Milho"


def test_catalogo_em_ingles_tem_os_mesmos_niveis_e_regras():
    pt = {e["estrategia_id"]: e for e in carregar_catalogo()}
    for e in catalogo_no_idioma("en"):
        base = pt[e["estrategia_id"]]
        assert e["atributos"] == base["atributos"] and e["calendario"] == base["calendario"]
        assert e["requisitos"] == base["requisitos"] and e["confianca"] == base["confianca"]
        assert [x["cultura_id"] for x in e["etapas_rotacao"]] == [x["cultura_id"] for x in base["etapas_rotacao"]]
        assert e["nome"] != base["nome"]


def test_caminhos_reais_em_ingles():
    recursos = {"maquinas_graos": "sim", "comprador_graos": "sim", "irrigacao": "nao"}
    en, _ = montar_estrategias_reais(["uso_agua"], recursos, None, "your region", "en")
    pt, _ = montar_estrategias_reais(["uso_agua"], recursos, None, "sua região", "pt")
    assert [e["estrategia_id"] for e in en] == [e["estrategia_id"] for e in pt]  # mesma escolha
    assert en[0]["nome"] == "Leave the field idle until planting"
    assert en[1]["motivos"][0].startswith("Matches what you chose")


def test_motor_beta_em_ingles(entrada):
    en = gerar_cenarios(entrada.model_copy(update={"idioma": "en"}))
    pt = gerar_cenarios(entrada)
    assert [e.estrategia_id for e in en] == [e.estrategia_id for e in pt]
    assert any(e.nome == "Explore a legume cover crop" for e in en)
    assert all("Simulated scenario" in e.resumo for e in en)


def test_painel_de_colheita_em_ingles_sem_inventar_traducao():
    painel = {
        "culturas": [{"cultura_id": "milho", "nome": "Milho"}],
        "limitacoes": ["Números do condado todo, não da sua propriedade.", "Frase nova sem tradução."],
        "fontes": ["NASA POWER (clima)"],
    }
    r = traduzir_painel(painel, "en")
    assert r["culturas"][0]["nome"] == "Corn"
    assert r["limitacoes"] == ["Numbers for the whole county, not your property.", "Frase nova sem tradução."]
    assert r["fontes"] == ["NASA POWER (climate)"]
    assert traduzir_painel(painel, "pt") is painel
