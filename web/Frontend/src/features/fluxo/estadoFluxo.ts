import type { Analise, PrioridadeId, ProblemaId, Relevo, RequisitoId, Resposta, TexturaSolo } from '../../api/tipos';

export const ETAPAS = [
  'inicio', 'local', 'cultura', 'talhao', 'prioridades', 'estrategias', 'comparar', 'estrategia', 'clima', 'proximos'
] as const;
export type Etapa = (typeof ETAPAS)[number];

export const TITULO_ETAPA: Record<Etapa, string> = {
  inicio: 'Início',
  local: 'Onde fica',
  cultura: 'O que está plantado',
  talhao: 'Como é o talhão',
  prioridades: 'O que importa',
  estrategias: 'Caminhos possíveis',
  comparar: 'Comparar',
  estrategia: 'Detalhe',
  clima: 'Chuva e umidade',
  proximos: 'Resumo'
};

/** Para onde o botão Voltar leva em cada tela (o fluxo tem desvios). */
export const VOLTAR_PARA: Record<Etapa, Etapa> = {
  inicio: 'inicio',
  local: 'inicio',
  cultura: 'local',
  talhao: 'cultura',
  prioridades: 'talhao',
  estrategias: 'prioridades',
  comparar: 'estrategias',
  estrategia: 'estrategias',
  clima: 'estrategia',
  proximos: 'estrategias'
};

export const MAX_PRIORIDADES = 2;

export interface DadosFluxo {
  descricao_local: string;
  latitude: number | null;
  longitude: number | null;
  cultura_atual_id: string | null;
  /** Só para exibição (resumo impresso); não vai para a API. */
  nomeCultura: string | null;
  textura_solo: TexturaSolo | null;
  relevo: Relevo | null;
  problemas: ProblemaId[];
  recursos_disponiveis: Record<RequisitoId, Resposta>;
  prioridades: PrioridadeId[];
  estrategia_id: string | null;
}

export const DADOS_INICIAIS: DadosFluxo = {
  descricao_local: '',
  latitude: null,
  longitude: null,
  cultura_atual_id: null,
  nomeCultura: null,
  textura_solo: null,
  relevo: null,
  problemas: [],
  recursos_disponiveis: { maquinas_graos: 'nao_sei', comprador_graos: 'nao_sei', irrigacao: 'nao_sei' },
  prioridades: [],
  estrategia_id: null
};

export type SituacaoAnalise =
  | { situacao: 'ociosa' }
  | { situacao: 'carregando' }
  | { situacao: 'sucesso'; analise: Analise }
  | { situacao: 'falha'; codigo: string; mensagem: string };
