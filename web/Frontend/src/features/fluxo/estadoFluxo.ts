import type { Analise, CorrecoesTalhao, Local, OrigemLocal, PrioridadeId, ProblemaId, RequisitoId, Resposta } from '../../api/tipos';

export const ETAPAS = [
  'inicio', 'local', 'cultura', 'maquinas_graos', 'comprador_graos', 'irrigacao', 'problemas', 'prioridades',
  'estrategias', 'comparar', 'estrategia', 'clima', 'proximos', 'producao'
] as const;
export type Etapa = (typeof ETAPAS)[number];

/** Telas de pergunta (uma por tela), na ordem. As bolinhas de progresso contam só estas. */
export const PERGUNTAS: Etapa[] = ['cultura', 'maquinas_graos', 'comprador_graos', 'irrigacao', 'problemas', 'prioridades'];

export const TITULO_ETAPA: Record<Etapa, string> = {
  inicio: 'Início',
  local: 'Onde fica',
  cultura: 'O que está plantado',
  maquinas_graos: 'Máquina',
  comprador_graos: 'Para quem vender',
  irrigacao: 'Irrigação',
  problemas: 'O que incomoda',
  prioridades: 'O que importa',
  estrategias: 'Caminhos',
  comparar: 'Comparar',
  estrategia: 'Detalhe',
  clima: 'Chuva',
  proximos: 'Resumo',
  producao: 'Colheita'
};

/** Para onde o botão Voltar leva em cada tela (o fluxo tem desvios). */
export const VOLTAR_PARA: Record<Etapa, Etapa> = {
  inicio: 'inicio',
  local: 'inicio',
  cultura: 'local',
  maquinas_graos: 'cultura',
  comprador_graos: 'maquinas_graos',
  irrigacao: 'comprador_graos',
  problemas: 'irrigacao',
  prioridades: 'problemas',
  estrategias: 'prioridades',
  comparar: 'estrategias',
  estrategia: 'estrategias',
  clima: 'estrategia',
  proximos: 'estrategias',
  producao: 'inicio'
};

export const MAX_PRIORIDADES = 2;

/** Como a tela de local deve abrir: confirmando o que o GPS achou ou já na busca por cidade. */
export type ModoLocal = 'confirmar' | 'buscar';

export interface DadosFluxo {
  local: Local | null;
  origem_local: OrigemLocal | null;
  /** Só para a UI: por que caiu na busca (GPS negado, sem sinal…). Não vai para a API. */
  motivoBusca: string | null;
  modoLocal: ModoLocal;
  cultura_atual_id: string | null;
  /** Só para exibição (resumo impresso); não vai para a API. */
  nomeCultura: string | null;
  recursos_disponiveis: Record<RequisitoId, Resposta | null>;
  problemas: ProblemaId[];
  /** true depois que a pessoa respondeu a tela de problemas (mesmo com "Nenhum desses"). */
  problemasRespondidos: boolean;
  prioridades: PrioridadeId[];
  correcoes: CorrecoesTalhao;
  estrategia_id: string | null;
}

export const DADOS_INICIAIS: DadosFluxo = {
  local: null,
  origem_local: null,
  motivoBusca: null,
  modoLocal: 'buscar',
  cultura_atual_id: null,
  nomeCultura: null,
  recursos_disponiveis: { maquinas_graos: null, comprador_graos: null, irrigacao: null },
  problemas: [],
  problemasRespondidos: false,
  prioridades: [],
  correcoes: {},
  estrategia_id: null
};

/** 'Olímpia (SP)'. Sem UF (ponto do GPS sem município identificado), só o texto do local. */
export const descreverLocal = (local: Local | null) => (local ? (local.uf ? `${local.municipio} (${local.uf})` : local.municipio) : '');

export type SituacaoAnalise =
  | { situacao: 'ociosa' }
  | { situacao: 'carregando' }
  | { situacao: 'sucesso'; analise: Analise }
  | { situacao: 'falha'; codigo: string; mensagem: string };
