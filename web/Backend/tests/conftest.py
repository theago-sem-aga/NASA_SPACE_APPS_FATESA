import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app.configuracao import configuracao
from app.repositories.banco import Base, RepositorioAnalises
from app.schemas.analises import AnaliseEntrada


@pytest.fixture
def entrada():
    return AnaliseEntrada(
        latitude=36.6,
        longitude=-119.7,
        origem_local="gps",
        codigo_ibge=None,
        cultura_atual_id="milho",
        problemas=[],
        recursos_disponiveis={
            "maquinas_graos": "sim",
            "comprador_graos": "nao_sei",
            "irrigacao": "nao",
        },
        prioridades=["fixacao_nitrogenio", "materia_organica"],
        correcoes={},
    )


@pytest.fixture
def repositorio():
    # SQLite apenas em teste de unidade da persistência; produção exige PostgreSQL.
    motor = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(motor)
    yield RepositorioAnalises(motor)
    motor.dispose()


@pytest.fixture(autouse=True)
def limpar_config():
    configuracao.cache_clear()
    yield
    configuracao.cache_clear()
