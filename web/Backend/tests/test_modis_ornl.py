"""Testes da busca do NDVI do MODIS no ORNL (sem rede: o HTTP é simulado).

Rodar: cd web/Backend && python -m pytest tests/test_modis_ornl.py -v
"""

from __future__ import annotations

import datetime as dt
from concurrent.futures import ThreadPoolExecutor

import pandas as pd
import pytest

from app.integrations import modis_ornl
from app.pipelines import ingestao_modis_ndvi
from app.pipelines.ingestao_modis_ndvi import juntar


def datas_falsas(n: int) -> list[dict]:
    """n datas de 16 em 16 dias a partir de 2000-02-18, no formato do /dates."""
    inicio = dt.date(2000, 2, 18)
    saida = []
    for i in range(n):
        d = inicio + dt.timedelta(days=16 * i)
        saida.append({"modis_date": f"A{d.year}{d.timetuple().tm_yday:03d}", "calendar_date": d.isoformat()})
    return saida


class RespostaFalsa:
    def __init__(self, corpo, status=200):
        self._corpo, self.status_code = corpo, status

    def json(self):
        return self._corpo

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)


class OrnlFalso:
    """Simula o ORNL: /dates devolve tudo; /subset recusa mais de 10 datas, como o real."""

    def __init__(self, datas, falhas_502=0):
        self.datas, self.falhas_502, self.pedidos = datas, falhas_502, []

    def __call__(self, metodo, url, params=None, **_):
        if url.endswith("/dates"):
            return RespostaFalsa({"dates": self.datas})
        self.pedidos.append(params)
        if self.falhas_502 > 0:
            self.falhas_502 -= 1
            return RespostaFalsa("<html>502 Proxy Error</html>", 502)
        bandas = [params["band"]] if "band" in params else [modis_ornl.BANDA_NDVI, modis_ornl.BANDA_CONFIABILIDADE]
        no_bloco = [d for d in self.datas if params["startDate"] <= d["modis_date"] <= params["endDate"]]
        if len(no_bloco) > 10:
            return RespostaFalsa("Subset time period exceeds maximum subset tiles support of 10.")
        subset = []
        for banda in bandas:
            for i, d in enumerate(no_bloco):
                if banda == modis_ornl.BANDA_NDVI:
                    bruto = -3000 if d["calendar_date"] == "2000-03-05" else 5000 + i
                else:
                    bruto = 3 if d["calendar_date"] == "2000-03-05" else 0
                subset.append({"modis_date": d["modis_date"], "calendar_date": d["calendar_date"], "band": banda, "data": [bruto]})
        return RespostaFalsa({"subset": subset})


@pytest.fixture
def ornl(monkeypatch):
    def instalar(datas, falhas_502=0):
        falso = OrnlFalso(datas, falhas_502)
        monkeypatch.setattr(modis_ornl, "requisitar", falso)
        monkeypatch.setattr(modis_ornl.time, "sleep", lambda _s: None)
        return falso

    return instalar


def test_blocos_de_10_cobrem_todas_as_datas_sem_sobrepor():
    blocos = modis_ornl.blocos_de_datas(datas_falsas(25))
    assert len(blocos) == 3
    assert blocos[0] == ("A2000049", datas_falsas(25)[9]["modis_date"])
    assert blocos[-1][0] == datas_falsas(25)[20]["modis_date"]


def test_periodo_longo_vira_varios_pedidos_concatenados(ornl):
    falso = ornl(datas_falsas(25))
    r = modis_ornl.buscar_ndvi_ponto(-20.81, -49.38)
    # Três blocos, cada um com NDVI e qualidade; nenhum passou de dez datas.
    assert r["pedidos"] == 3 and len(falso.pedidos) == 3
    assert all("band" not in pedido for pedido in falso.pedidos)
    assert [linha["data"] for linha in r["serie"]] == [d["calendar_date"] for d in datas_falsas(25)]
    assert r["serie"][0] == {"data": "2000-02-18", "ndvi": 0.5, "confiabilidade_pixel": 0}


def test_ausente_vira_none_e_nunca_zero(ornl):
    ornl(datas_falsas(12))
    r = modis_ornl.buscar_ndvi_ponto(-20.81, -49.38)
    linha = next(x for x in r["serie"] if x["data"] == "2000-03-05")
    assert linha["ndvi"] is None and linha["confiabilidade_pixel"] == 3


def test_recorte_por_data_pede_so_o_periodo(ornl):
    falso = ornl(datas_falsas(40))
    r = modis_ornl.buscar_ndvi_ponto(
        -20.81, -49.38, dt.date(2000, 6, 1), dt.date(2000, 9, 30), bandas=(modis_ornl.BANDA_NDVI,)
    )
    assert all("2000-06-01" <= x["data"] <= "2000-09-30" for x in r["serie"])
    assert len(falso.pedidos) == 1 and set(r["serie"][0]) == {"data", "ndvi"}


def test_502_passageiro_e_repetido(ornl):
    ornl(datas_falsas(5), falhas_502=2)
    r = modis_ornl.buscar_ndvi_ponto(-20.81, -49.38, bandas=(modis_ornl.BANDA_NDVI,), paralelo=1)
    assert len(r["serie"]) == 5 and r["serie"][0]["ndvi"] == 0.5


def test_bloco_que_nunca_responde_derruba_a_busca(ornl):
    # Serie com buraco no meio pareceria completa: melhor falhar.
    ornl(datas_falsas(5), falhas_502=99)
    with pytest.raises(ConnectionError):
        modis_ornl.buscar_ndvi_ponto(-20.81, -49.38, paralelo=1, tentativas=3)


def test_coordenada_invalida():
    with pytest.raises(ValueError):
        modis_ornl.buscar_ndvi_ponto(-95, 0)


def test_juntar_cache_incremental_sem_duplicar():
    base = {"latitude": -20.89, "longitude": -49.36, "fonte": "modis_ornl", "tipo_acesso": "pre_processado", "data_coleta_utc": "x"}
    antigo = pd.DataFrame([{"data": "2025-01-01", "ndvi": 0.5, "confiabilidade_pixel": 0, **base},
                           {"data": "2025-01-17", "ndvi": 0.6, "confiabilidade_pixel": 1, **base}])
    novo = pd.DataFrame([{"data": "2025-01-17", "ndvi": 0.61, "confiabilidade_pixel": 0, **base},
                         {"data": "2025-02-02", "ndvi": 0.7, "confiabilidade_pixel": 0, **base}])
    df = juntar(antigo, novo)
    assert list(df["data"]) == ["2025-01-01", "2025-01-17", "2025-02-02"]
    assert df.loc[1, "ndvi"] == 0.61


def test_pool_compartilhado_limita_requisicoes_sem_ser_encerrado_pelo_cliente(ornl):
    falso = ornl(datas_falsas(25))
    with ThreadPoolExecutor(max_workers=2) as pool:
        resultado = modis_ornl.buscar_ndvi_ponto(-20.797, -49.358, executor=pool)
        assert pool.submit(lambda: 42).result() == 42
    assert len(resultado["serie"]) == 25 and len(falso.pedidos) == 3


def test_falha_de_gravacao_preserva_serie_anterior(monkeypatch, tmp_path):
    caminho = tmp_path / "serie.parquet"
    antigo = pd.DataFrame([{
        "data": "2025-01-01", "ndvi": 0.5, "confiabilidade_pixel": 0,
        "latitude": -20.70, "longitude": -48.96, "fonte": "modis_ornl",
        "tipo_acesso": "pre_processado", "data_coleta_utc": "2025-02-01T00:00:00Z",
    }])
    antigo.to_parquet(caminho, index=False)
    original = caminho.read_bytes()
    monkeypatch.setattr(ingestao_modis_ndvi, "caminho_parquet_da_celula", lambda *a: caminho)
    monkeypatch.setattr(ingestao_modis_ndvi, "buscar_ndvi_ponto", lambda *a, **k: {
        "serie": [{"data": "2025-01-17", "ndvi": 0.6, "confiabilidade_pixel": 0}],
        "data_coleta_utc": "2025-02-02T00:00:00Z",
    })
    def falhar(self, arquivo, **kwargs):
        arquivo.write(b"incompleto")
        raise OSError("falha de disco")
    monkeypatch.setattr(pd.DataFrame, "to_parquet", falhar)
    with pytest.raises(OSError):
        ingestao_modis_ndvi.atualizar_ponto(-20.70, -48.96)
    assert caminho.read_bytes() == original
    assert not list(tmp_path.glob("*.tmp"))


def test_resposta_conjunta_sem_qualidade_nao_parece_serie_completa(monkeypatch):
    monkeypatch.setattr(modis_ornl, "_get_json", lambda *a, **k: {
        "subset": [{"calendar_date": "2026-10-16", "band": modis_ornl.BANDA_NDVI, "data": [5000]}],
    })
    with pytest.raises(ValueError, match="duas bandas"):
        modis_ornl._buscar_bloco_conjunto(-20.7, -48.96, "A2026289", "A2026289", 90, 1, 0)


def test_ponto_sem_datas_nao_publica_arquivo_vazio(monkeypatch, tmp_path):
    caminho = tmp_path / "serie.parquet"
    monkeypatch.setattr(ingestao_modis_ndvi, "caminho_parquet_da_celula", lambda *a: caminho)
    monkeypatch.setattr(ingestao_modis_ndvi, "buscar_ndvi_ponto", lambda *a, **k: {
        "serie": [], "data_coleta_utc": "2026-11-15T00:00:00Z",
    })
    with pytest.raises(LookupError, match="Nenhuma data"):
        ingestao_modis_ndvi.atualizar_ponto(-20.70, -48.96)
    assert not caminho.exists()


def test_bandas_extras_da_resposta_nao_mudam_ndvi_ou_qualidade(monkeypatch):
    monkeypatch.setattr(modis_ornl, "_get_json", lambda *a, **k: {"subset": [
        {"calendar_date": "2026-10-16", "band": modis_ornl.BANDA_NDVI, "data": [5000]},
        {"calendar_date": "2026-10-16", "band": modis_ornl.BANDA_CONFIABILIDADE, "data": [0]},
        {"calendar_date": "2026-10-16", "band": "250m_16_days_EVI", "data": [8000]},
    ]})
    linhas = modis_ornl._buscar_bloco_conjunto(-20.7, -48.96, "A2026289", "A2026289", 90, 1, 0)
    assert linhas == [{"data": "2026-10-16", "ndvi": 0.5},
                      {"data": "2026-10-16", "confiabilidade_pixel": 0}]
