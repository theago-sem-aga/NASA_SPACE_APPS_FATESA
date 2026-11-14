"""DTOs da resposta de /api/v1/analises. Ver docs/contrato_api.md e
docs/dicionario_dados.md -- nomes e formato aqui sao o contrato real
consumido pelo frontend (snake_case, sem traducao automatica)."""

from __future__ import annotations

from pydantic import BaseModel


class Variavel(BaseModel):
    nome: str
    fonte: str
    tipo_acesso: str  # "ao_vivo" | "pre_processado"
    data: str | None = None
    valor: float | None = None


class FonteIndisponivel(BaseModel):
    fonte: str
    motivo: str  # "fora_da_regiao_pre_processada" | "fora_da_cobertura"


class RespostaAnalise(BaseModel):
    latitude: float
    longitude: float
    variaveis: list[Variavel]
    fontes_indisponiveis: list[FonteIndisponivel]
