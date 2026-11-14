"""DTOs da resposta de /api/v1/analises. Ver docs/contrato_api.md e
docs/dicionario_dados.md -- nomes e formato aqui sao o contrato real
consumido pelo frontend (snake_case, sem traducao automatica)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Variavel(BaseModel):
    nome: str
    fonte: str
    tipo_acesso: Literal["ao_vivo", "pre_processado"]
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


Prioridade = Literal[
    "uso_agua",
    "valor_forragem",
    "fixacao_nitrogenio",
    "reducao_erosao",
    "materia_organica",
    "adequacao_mercado",
]
Resposta = Literal["sim", "nao", "nao_sei"]
Textura = Literal["arenosa", "media", "argilosa"]
Relevo = Literal["plano", "suave_ondulado", "ondulado"]
Nivel = Literal["nenhum", "baixo", "medio", "alto"]


class EntradaEstrita(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Recursos(EntradaEstrita):
    maquinas_graos: Resposta
    comprador_graos: Resposta
    irrigacao: Resposta


class Correcoes(EntradaEstrita):
    textura_solo: Textura | None = None
    relevo: Relevo | None = None


class AnaliseEntrada(EntradaEstrita):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    origem_local: Literal["gps", "municipio"]
    codigo_ibge: str | None = Field(default=None, pattern=r"^\d{7}$")
    cultura_atual_id: str = Field(min_length=1, max_length=80)
    problemas: list[Literal["solo_cansado", "nematoides_pragas", "preco_baixo"]] = Field(
        default_factory=list, max_length=3
    )
    recursos_disponiveis: Recursos
    prioridades: list[Prioridade] = Field(min_length=1, max_length=2)
    correcoes: Correcoes = Field(default_factory=Correcoes)

    @model_validator(mode="after")
    def sem_duplicatas(self):
        if len(set(self.prioridades)) != len(self.prioridades) or len(set(self.problemas)) != len(
            self.problemas
        ):
            raise ValueError("Não repita prioridades ou problemas.")
        return self


class Cultura(BaseModel):
    cultura_id: str
    nome: str
    tem_demonstracao: bool


class Local(BaseModel):
    codigo_ibge: str
    municipio: str
    uf: str
    latitude: float
    longitude: float


class CaracteristicasTalhao(BaseModel):
    textura_solo: Textura | None = None
    fonte_textura: Literal["mapas", "informado_produtor"] = "mapas"
    relevo: Relevo | None = None
    fonte_relevo: Literal["mapas", "informado_produtor"] = "mapas"
    declividade_pct: float | None = None
    risco_erosao: Nivel | None = None
    risco_seca: Nivel | None = None
    bases: list[str] = Field(default_factory=list)


class ClimaMensal(BaseModel):
    mes: int = Field(ge=1, le=12)
    precipitacao_acumulada_mm: float | None = None
    umidade_solo: float | None = None


class FonteClima(BaseModel):
    fonte_id: str
    nome: str
    tipo_dado: Literal["observacao_historica", "previsao", "simulacao"]
    periodo_inicio: str
    periodo_fim: str


class AtributosEstrategia(BaseModel):
    protecao_solo: Nivel
    materia_organica: Nivel
    fixacao_nitrogenio: Nivel
    quebra_pragas: Nivel
    renda_direta: Nivel
    demanda_agua: Nivel
    trabalho_custo: Nivel


class EtapaRotacao(BaseModel):
    cultura_id: str
    nome: str
    duracao_meses: int | None = None


class MesCalendario(BaseModel):
    mes: int = Field(ge=1, le=12)
    cobertura: Literal[
        "solo_descoberto", "cultura_principal", "cultura_intermediaria", "adubo_verde", "palhada"
    ]


class Estrategia(BaseModel):
    estrategia_id: str
    nome: str
    resumo: str
    eh_pratica_atual: bool
    objetivo: str
    motivos: list[str]
    evidencias: list[str]
    beneficios: list[str]
    riscos: list[str]
    lacunas: list[str]
    confianca: Literal["baixa", "media", "alta"]
    explicacao_confianca: str
    pergunta_especialista: str
    prioridades_atendidas: list[Prioridade]
    requisitos: list[Literal["maquinas_graos", "comprador_graos", "irrigacao"]]
    atributos: AtributosEstrategia
    etapas_rotacao: list[EtapaRotacao]
    referencias: list[str]
    calendario: list[MesCalendario]


class Analise(BaseModel):
    analise_id: str
    eh_mock: bool
    descricao_local: str
    talhao: CaracteristicasTalhao
    fonte_clima: FonteClima
    clima_mensal: list[ClimaMensal]
    estrategias: list[Estrategia]
    limitacoes: list[str]
    # Metadados adicionais não alteram as propriedades consumidas pelo frontend.
    versao_motor: str
    criada_em_utc: str
    fontes_indisponiveis: list[FonteIndisponivel]
    estado_recomendacoes: Literal["simulacao_beta", "dados_insuficientes"]


class CorpoErro(BaseModel):
    codigo: str
    mensagem: str
    detalhes: list[dict] = Field(default_factory=list)
    requisicao_id: str | None = None


class ErroApi(BaseModel):
    erro: CorpoErro
