// DTOs do contrato front <-> API.
// PROPOSTA: ainda não existem docs/contrato_api.md nem docs/dicionario_dados.md.
// Nomes seguem a convenção (snake_case, sem acento, unidade no nome) e precisam
// ser aprovados com o backend (Ghabriel) antes de virar contrato.

/** Situação da cobertura do solo em um mês do calendário de uma estratégia. */
export type CoberturaSolo =
  | 'solo_descoberto'
  | 'cultura_principal'
  | 'cultura_intermediaria'
  | 'adubo_verde'
  | 'palhada';

/** Prioridades do produtor, conforme a lista do desafio Field Shift. */
export type PrioridadeId =
  | 'uso_agua'
  | 'valor_forragem'
  | 'fixacao_nitrogenio'
  | 'reducao_erosao'
  | 'materia_organica'
  | 'adequacao_mercado';

/** Observação histórica ≠ previsão ≠ simulação (convenção §7). */
export type TipoDado = 'observacao_historica' | 'previsao' | 'simulacao';

export interface Cultura {
  cultura_id: string;
  nome: string;
  /** Protótipo: indica se já existe cenário de demonstração para a cultura. */
  tem_demonstracao: boolean;
}

export type TexturaSolo = 'arenosa' | 'media' | 'argilosa' | 'nao_sei';
export type Relevo = 'plano' | 'suave_ondulado' | 'ondulado' | 'nao_sei';
export type Resposta = 'sim' | 'nao' | 'nao_sei';

/** Problemas que o produtor já percebe no talhão (problemas-alvo do CLAUDE.md). */
export type ProblemaId = 'erosao' | 'falta_agua' | 'solo_cansado' | 'nematoides_pragas' | 'preco_baixo';

/** Recursos que uma estratégia exige e que o produtor informa se tem. */
export type RequisitoId = 'irrigacao' | 'maquinas_graos' | 'comprador_graos';

export interface AnaliseEntrada {
  descricao_local: string;
  latitude: number | null;
  longitude: number | null;
  cultura_atual_id: string;
  textura_solo: TexturaSolo;
  relevo: Relevo;
  problemas: ProblemaId[];
  recursos_disponiveis: Record<RequisitoId, Resposta>;
  prioridades: PrioridadeId[];
}

export type Nivel = 'nenhum' | 'baixo' | 'medio' | 'alto';
export type Confianca = 'baixa' | 'media' | 'alta';

/** Atributos usados na comparação lado a lado. */
export interface AtributosEstrategia {
  protecao_solo: Nivel;
  materia_organica: Nivel;
  fixacao_nitrogenio: Nivel;
  quebra_pragas: Nivel;
  renda_direta: Nivel;
  demanda_agua: Nivel;
  trabalho_custo: Nivel;
}

export interface ClimaMensal {
  /** 1 = janeiro … 12 = dezembro */
  mes: number;
  /** Chuva acumulada no mês, média do período (mm/mês). null = sem dado. */
  precipitacao_acumulada_mm: number | null;
  /** Umidade do solo na zona das raízes, índice de 0 (seco) a 1 (saturado). null = sem dado. */
  umidade_solo: number | null;
}

export interface FonteClima {
  fonte_id: string;
  nome: string;
  tipo_dado: TipoDado;
  /** YYYY-MM-DD */
  periodo_inicio: string;
  /** YYYY-MM-DD */
  periodo_fim: string;
}

export interface MesCalendario {
  mes: number;
  cobertura: CoberturaSolo;
}

export interface EtapaRotacao {
  /** id de cultura, ou 'pousio' para área parada */
  cultura_id: string;
  nome: string;
  duracao_meses: number | null;
}

export interface Estrategia {
  estrategia_id: string;
  nome: string;
  resumo: string;
  eh_pratica_atual: boolean;
  objetivo: string;
  /** Por que esta estratégia apareceu para este talhão. */
  motivos: string[];
  evidencias: string[];
  beneficios: string[];
  riscos: string[];
  /** O que a ferramenta ainda não sabe e precisa ser checado no local. */
  lacunas: string[];
  confianca: Confianca;
  explicacao_confianca: string;
  pergunta_especialista: string;
  prioridades_atendidas: PrioridadeId[];
  requisitos: RequisitoId[];
  atributos: AtributosEstrategia;
  /** Sequência da rotação, para a faixa visual (ex.: cana → amendoim → cana). */
  etapas_rotacao: EtapaRotacao[];
  /** Referências a consultar (protótipo: indicação, não citação verificada). */
  referencias: string[];
  /** 12 meses, na ordem em que acontecem a partir do início da reforma. */
  calendario: MesCalendario[];
}

export interface Analise {
  analise_id: string;
  /** true = dados fictícios de demonstração. A UI deve deixar isso visível. */
  eh_mock: boolean;
  descricao_local: string;
  fonte_clima: FonteClima;
  clima_mensal: ClimaMensal[];
  /** Já ordenadas pelo backend. O front não reordena nem pontua. */
  estrategias: Estrategia[];
  limitacoes: string[];
}

/** Esqueleto de erro sugerido na convenção §6 (pendente de aprovação). */
export interface ErroApi {
  erro: {
    codigo: string;
    mensagem: string;
    detalhes: unknown[];
    requisicao_id: string | null;
  };
}
