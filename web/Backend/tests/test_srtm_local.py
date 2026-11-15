import importlib
import json
from pathlib import Path

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from app.integrations import srtm_local
from app.services import declividade


@pytest.fixture
def raster(monkeypatch, tmp_path):
    monkeypatch.setattr(srtm_local, "PASTA_SRTM", tmp_path)
    monkeypatch.setattr(srtm_local, "AMOSTRAS", 3)
    caminho = tmp_path / "-208_-493.parquet"
    gravar_raster(caminho, [[0, 10, 20], [20, 30, 40], [40, 50, 60]])
    return caminho


def gravar_raster(caminho, valores):
    tabela = pa.table({"elevacao_m": np.array(valores, dtype=np.int16).reshape(-1)})
    metadados = {"produto": "SRTMGL1.003", "tile": "S21W050", "linha_inicial": 0,
                 "coluna_inicial": 0, "linhas": 3, "colunas": 3}
    tabela = tabela.replace_schema_metadata({b"fatesa_srtm": json.dumps(metadados).encode()})
    pq.write_table(tabela, caminho)


def test_endereco_sul_oeste_e_interpolacao_bilinear(raster):
    assert srtm_local.nome_tile(-20.75, -49.25) == "S21W050"
    assert srtm_local.buscar_elevacao_local(-20.75, -49.25) == 45.0


def test_pixel_ausente_nao_vira_altitude_zero(raster):
    gravar_raster(raster, [[0, 10, 20], [20, -32768, 40], [40, 50, 60]])
    assert srtm_local.buscar_elevacao_local(-20.75, -49.25) is None


def test_sem_raster_nao_busca_rede(raster):
    assert srtm_local.buscar_elevacao_local(-20.70, -48.96) is None


def test_raster_truncado_e_rejeitado(raster):
    raster.write_bytes(b"incompleto")
    with pytest.raises(ValueError):
        srtm_local.buscar_elevacao_local(-20.75, -49.25)


def test_declividade_brasileira_usa_cinco_pontos_locais(monkeypatch, tmp_path):
    pontos = []
    def elevacao(lat, lon):
        pontos.append((lat, lon))
        return 100 + (lat + 20.82) * 111320 * 0.04
    def nao_usgs(*args):
        raise AssertionError("Não consultar USGS neste ponto brasileiro")
    monkeypatch.setattr(declividade, "buscar_elevacao_local", elevacao)
    monkeypatch.setattr(declividade, "buscar_elevacao_ponto", nao_usgs)
    monkeypatch.setattr(declividade, "PASTA_CACHE", tmp_path)
    resultado = declividade.declividade_do_ponto(-20.82, -49.38)
    assert len(pontos) == 5
    assert resultado["declividade_pct"] == 4.0
    assert resultado["relevo"] == "suave_ondulado"
    assert resultado["tipo_acesso"] == "pre_processado"
    assert "SRTMGL1" in resultado["fonte"]


def test_startup_reincorpora_recorte_local_ausente_no_bucket(monkeypatch, tmp_path):
    monkeypatch.syspath_prepend(str(Path(__file__).parents[1] / "app/pipelines"))
    indice = importlib.import_module("app.pipelines.indice_espacial_postgis")
    pasta = tmp_path / "srtm_relevo"
    pasta.mkdir()
    gravar_raster(pasta / "-208_-490.parquet", [[0, 10, 20], [20, 30, 40], [40, 50, 60]])
    registros = []
    monkeypatch.setattr(indice, "RAIZ_DADOS_PROCESSADOS", tmp_path)
    monkeypatch.setattr(indice, "registrar_celula", lambda *r: registros.append(r))
    indice.incorporar_recortes_srtm()
    assert len(registros) == 1
    assert registros[0][0] == "srtm_relevo"
    assert registros[0][1] == pytest.approx(-20.75)
    assert registros[0][2] == pytest.approx(-48.95)
