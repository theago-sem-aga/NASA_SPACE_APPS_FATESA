"""Persistência PostgreSQL isolada da API e do domínio."""

import math
import numbers
from datetime import date, datetime
from functools import lru_cache

from sqlalchemy import JSON, DateTime, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.configuracao import configuracao


def normalizar_json(valor):
    """JSON científico estrito: datas serializáveis e NaN como ausência."""
    if isinstance(valor, dict):
        return {str(k): normalizar_json(v) for k, v in valor.items()}
    if isinstance(valor, (list, tuple)):
        return [normalizar_json(v) for v in valor]
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    if isinstance(valor, numbers.Real) and not isinstance(valor, bool):
        return (
            (int(valor) if isinstance(valor, numbers.Integral) else float(valor))
            if math.isfinite(valor)
            else None
        )
    return valor


class Base(DeclarativeBase):
    pass


class RegistroAnalise(Base):
    __tablename__ = "analises"
    analise_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    criada_em_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    versao_motor: Mapped[str] = mapped_column(String(80))
    entrada: Mapped[dict] = mapped_column(JSON)
    resposta: Mapped[dict] = mapped_column(JSON)
    coleta: Mapped[dict] = mapped_column(JSON)


@lru_cache
def motor_banco():
    url = configuracao()["database_url"]
    if not url:
        raise RuntimeError("DATABASE_URL não configurada")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        connect_args={"connect_timeout": 5},
        hide_parameters=True,
    )


class RepositorioAnalises:
    def __init__(self, motor=None):
        self.motor = motor if motor is not None else motor_banco()

    def salvar(self, entrada, resposta, coleta):
        with Session(self.motor) as sessao, sessao.begin():
            sessao.add(
                RegistroAnalise(
                    analise_id=resposta["analise_id"],
                    criada_em_utc=datetime.fromisoformat(resposta["criada_em_utc"]),
                    versao_motor=resposta["versao_motor"],
                    entrada=entrada,
                    resposta=resposta,
                    coleta=normalizar_json(coleta),
                )
            )

    def buscar(self, analise_id):
        with Session(self.motor) as sessao:
            registro = sessao.get(RegistroAnalise, str(analise_id))
            return registro.resposta if registro else None

    def verificar(self):
        with Session(self.motor) as sessao:
            sessao.execute(select(RegistroAnalise.analise_id).limit(1))
