"""DTOs da resposta de /api/v1/analises. Nomes e formato aqui sao o contrato
real consumido pelo frontend (snake_case, sem traducao automatica) -- ver
/openapi.json ou /docs, gerados a partir destes schemas."""

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
    # Regra em app/domain/geada.py (mínima do ar NASA POWER). Limiar e cortes pendentes de fonte.
    risco_geada: Nivel | None = None
    bases: list[str] = Field(default_factory=list)


class ClimaMensal(BaseModel):
    mes: int = Field(ge=1, le=12)
    precipitacao_acumulada_mm: float | None = None
    umidade_solo: float | None = None


class GeadaMensal(BaseModel):
    mes: int = Field(ge=1, le=12)
    # Fração dos anos com pelo menos 1 dia de mínima do ar <= limiar_c naquele mês.
    probabilidade_geada: float = Field(ge=0, le=1)
    # Faixa de incerteza (Wilson, confianca_intervalo) por ter poucos anos de série.
    probabilidade_geada_min: float = Field(ge=0, le=1)
    probabilidade_geada_max: float = Field(ge=0, le=1)
    probabilidade_geada_forte: float = Field(ge=0, le=1)
    anos_com_geada: int
    dias_geada_medio: float
    menor_minima_c: float | None = None


class RiscoGeada(BaseModel):
    nivel: Nivel
    # Nível que a faixa de incerteza permite (ex.: medio, mas pode ser alto).
    nivel_min: Nivel
    nivel_max: Nivel
    mes_mais_arriscado: int | None = None
    meses_com_risco: list[int]
    probabilidade_ano: float = Field(ge=0, le=1)
    probabilidade_ano_min: float = Field(ge=0, le=1)
    probabilidade_ano_max: float = Field(ge=0, le=1)
    confianca_intervalo: float = Field(gt=0, lt=1)
    meses: list[GeadaMensal]
    limiar_c: float
    limiar_forte_c: float
    periodo_inicio: int
    periodo_fim: int
    anos_analisados: int
    fonte: str
    variavel: str
    tipo_acesso: Literal["ao_vivo", "pre_processado"]


class RiscoPrecipitacaoExtrema(BaseModel):
    # Regra em app/modelos/precipitacao_extrema.py: percentil 95 da chuva
    # diaria do mesmo mes, sobre o historico real da NASA POWER.
    dias_chuva_extrema_30d: int
    limiar_chuva_extrema_mm_dia: float
    data_referencia: str
    metodo: str
    fonte: str
    variavel: str
    tipo_acesso: Literal["ao_vivo", "pre_processado"]


class ChuvaAno(BaseModel):
    ano: int
    chuva_mm: float = Field(ge=0)


class TendenciaHidrica(BaseModel):
    # Regra em app/domain/tendencia_hidrica.py: Mann-Kendall + inclinação de Sen
    # sobre a chuva anual da NASA POWER. "estavel" = sem tendência significativa.
    tendencia: Literal["secando", "estavel", "mais_chuvoso"]
    mm_por_decada: float
    pct_por_decada: float
    p_valor: float = Field(ge=0, le=1)
    alfa: float
    media_anual_mm: float
    reta_inicio_mm: float
    reta_fim_mm: float
    anos: list[ChuvaAno]
    periodo_inicio: int
    periodo_fim: int
    anos_analisados: int
    metodo: str
    fonte: str
    variavel: str
    tipo_acesso: Literal["ao_vivo", "pre_processado"]


class RiscoSeca(BaseModel):
    # Regra em app/domain/risco_seca.py: chuva dos últimos 90 dias vs. média
    # do mesmo período do ano, sobre o histórico real da NASA POWER.
    nivel: Nivel
    chuva_recente_mm: float
    chuva_normal_mm: float
    proporcao_normal_pct: float | None = None
    data_referencia: str
    metodo: str
    fonte: str
    variavel: str
    tipo_acesso: Literal["ao_vivo", "pre_processado"]


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
    # None = sem série de temperatura mínima para o ponto (fonte fora do ar).
    geada: RiscoGeada | None = None
    # None = sem série de precipitação diária para o ponto (fonte fora do ar).
    precipitacao_extrema: RiscoPrecipitacaoExtrema | None = None
    # None = série de chuva sem anos completos suficientes ou fonte fora do ar.
    tendencia_hidrica: TendenciaHidrica | None = None
    # None = série diária de chuva sem medição suficiente para o ponto.
    risco_seca: RiscoSeca | None = None
    estrategias: list[Estrategia]
    limitacoes: list[str]
    # Metadados adicionais não alteram as propriedades consumidas pelo frontend.
    versao_motor: str
    criada_em_utc: str
    fontes_indisponiveis: list[FonteIndisponivel]
    estado_recomendacoes: Literal["simulacao_beta", "dados_insuficientes"]


class ColheitaCultura(BaseModel):
    cultura_id: str
    nome: str
    situacao: Literal["acima", "normal", "abaixo", "sem_plantio"]
    ano: int | None = None
    area_plantada_ha: float | None = None
    rendimento_kg_ha: float | None = None
    rendimento_medio_anterior_kg_ha: float | None = None
    # Só presentes quando a unidade NÃO é kg/ha (hoje: EUA/NASS). bushel pesa
    # diferente por cultura -- nunca convertido pra kg/ha sem fonte segura.
    rendimento_nativo: float | None = None
    rendimento_unidade: str | None = None
    rendimento_medio_anterior_nativo: float | None = None


class ClimaAno(BaseModel):
    ano: int
    chuva_mm: float
    chuva_normal_mm: float
    situacao_chuva: Literal["pouca", "normal", "muita"]
    gotas_em_10: int
    tmax_c: float
    tmax_normal_c: float
    situacao_calor: Literal["mais_quente", "normal", "mais_frio"]
    graus_de_diferenca: int
    periodo_normal: str


class PainelProducao(BaseModel):
    # Brasil: codigo_ibge/municipio/uf. EUA: condado/estado. Um dos dois pares.
    codigo_ibge: str | None = None
    municipio: str | None = None
    uf: str | None = None
    condado: str | None = None
    estado: str | None = None
    culturas: list[ColheitaCultura]
    # None no caminho dos EUA hoje: clima vem por outra via (POWER multi-regional).
    clima: ClimaAno | None = None
    # Previsão oficial transcrita (INMET/INPE/FUNCEME); forma ainda não fixada
    # em schema próprio, só existe pro Brasil.
    previsao: dict | None = None
    fontes: list[str]
    limitacoes: list[str]
    tipo_dado: Literal["observacao_historica", "previsao", "simulacao"]
    gerado_em: str


class CorpoErro(BaseModel):
    codigo: str
    mensagem: str
    detalhes: list[dict] = Field(default_factory=list)
    requisicao_id: str | None = None


class ErroApi(BaseModel):
    erro: CorpoErro
