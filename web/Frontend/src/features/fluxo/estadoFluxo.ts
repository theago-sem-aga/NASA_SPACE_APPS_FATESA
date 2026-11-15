import type { Analise, CorrecoesTalhao, Local, OrigemLocal, PrioridadeId, ProblemaId, RequisitoId, Resposta } from '../../api/tipos';
import { L, traduzivel } from '../../i18n/idioma';

export const ETAPAS = [
  'inicio', 'local', 'cultura', 'maquinas_graos', 'comprador_graos', 'irrigacao', 'problemas', 'prioridades',
  'estrategias', 'comparar', 'estrategia', 'clima', 'proximos', 'producao', 'decisao', 'acompanhamento'
] as const;
export type Etapa = (typeof ETAPAS)[number];

/** Telas de pergunta (uma por tela), na ordem. As bolinhas de progresso contam só estas. */
export const PERGUNTAS: Etapa[] = ['cultura', 'maquinas_graos', 'comprador_graos', 'irrigacao', 'problemas', 'prioridades'];

export const TITULO_ETAPA: Record<Etapa, string> = traduzivel({
  inicio: L('Início', 'Start'),
  local: L('Onde fica', 'Location'),
  cultura: L('O que está plantado', 'What is planted'),
  maquinas_graos: L('Máquina', 'Machinery'),
  comprador_graos: L('Para quem vender', 'Grain buyer'),
  irrigacao: L('Irrigação', 'Irrigation'),
  problemas: L('O que incomoda', 'What bothers you'),
  prioridades: L('O que importa', 'What matters'),
  estrategias: L('Caminhos', 'Options'),
  comparar: L('Comparar', 'Compare'),
  estrategia: L('Detalhe', 'Detail'),
  clima: L('Chuva', 'Rain'),
  proximos: L('Resumo', 'Summary'),
  producao: L('Colheita', 'Harvest'),
  decisao: L('Caminho escolhido', 'Chosen option'),
  acompanhamento: L('Acompanhar', 'Follow up')
});

/** Para onde o botão Voltar leva em cada tela (o fluxo tem desvios). */
export const VOLTAR_PARA: Record<Etapa, Etapa> = {
  inicio: 'inicio',
  local: 'inicio',
  cultura: 'local',
  maquinas_graos: 'producao',
  comprador_graos: 'maquinas_graos',
  irrigacao: 'comprador_graos',
  problemas: 'irrigacao',
  prioridades: 'problemas',
  estrategias: 'prioridades',
  comparar: 'estrategias',
  estrategia: 'estrategias',
  clima: 'estrategia',
  proximos: 'estrategias',
  producao: 'cultura',
  decisao: 'comparar',
  acompanhamento: 'comparar'
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
/** '-20.73430, -49.44290': a mesma coordenada do GPS em todas as telas. */
export const formatarCoordenada = (latitude: number, longitude: number) => `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

export const descreverLocal = (local: Local | null) => (local ? (local.uf ? `${local.municipio} (${local.uf})` : local.municipio) : '');

/**
 * "32.78, -96.80" (ou com espaço/ponto-e-vírgula no lugar da vírgula) → coordenada.
 * Pra testar um ponto sem GPS físico ali (ex.: Texas, Oklahoma) e sem precisar
 * de município cadastrado: não inventa local, só aceita a coordenada digitada.
 */
export function parseCoordenada(texto: string): { latitude: number; longitude: number } | null {
  const m = texto.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const latitude = Number(m[1]);
  const longitude = Number(m[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export type SituacaoAnalise =
  | { situacao: 'ociosa' }
  | { situacao: 'carregando' }
  | { situacao: 'sucesso'; analise: Analise }
  | { situacao: 'falha'; codigo: string; mensagem: string };
