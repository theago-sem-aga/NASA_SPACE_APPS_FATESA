// Cliente da API. Escolhe entre mock e backend real por configuração
// (VITE_FONTE_DADOS), como pede a convenção §6.
//
// BACKEND: cada função abaixo documenta a rota que o front chama. Os nomes de
// rota seguem a proposta da convenção §6 (/api/v1, substantivo no plural);
// /locais e /municipios são novas e ainda precisam entrar em docs/contrato_api.md.
import type { Analise, AnaliseEntrada, Cultura, ErroApi, Local } from './tipos';
import { ANALISE_MOCK, CULTURAS_MOCK, MUNICIPIOS_MOCK, montarTalhaoMock } from './mock/dadosMock';

const FONTE_DADOS = import.meta.env.VITE_FONTE_DADOS ?? 'mock';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const USANDO_MOCK = FONTE_DADOS !== 'api';

/**
 * Mostra na tela os avisos de "dados de exemplo". Desligado por padrão para avaliar
 * o visual final. LIGUE (VITE_SINALIZAR_MOCK=true) em qualquer apresentação pública
 * com dados mock: a convenção §0.3 proíbe mock parecendo observação real.
 */
export const SINALIZAR_MOCK = USANDO_MOCK && import.meta.env.VITE_SINALIZAR_MOCK === 'true';

export class FalhaApi extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string
  ) {
    super(mensagem);
  }
}

// Permite demonstrar os estados da tela no mock: ?simular=erro | dados_insuficientes | lento | sem_gps
export function simulacaoPedida(): string | null {
  return new URLSearchParams(window.location.search).get('simular');
}

function esperar(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers }
    });
  } catch {
    throw new FalhaApi('sem_conexao', 'Não deu para falar com o servidor. Veja se a internet está ligada e tente de novo.');
  }
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as ErroApi | null;
    throw new FalhaApi(corpo?.erro.codigo ?? 'erro_inesperado', corpo?.erro.mensagem ?? 'Algo deu errado do nosso lado.');
  }
  return (await resposta.json()) as T;
}

/** Tira acento e caixa, para a busca achar "olimpia" em "Olímpia". */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * GET /api/v1/culturas → Cultura[]
 * BACKEND: lista fixa por enquanto; ordem = ordem de exibição.
 */
export async function listarCulturas(): Promise<Cultura[]> {
  if (!USANDO_MOCK) return requisitar<Cultura[]>('/culturas');
  await esperar(300);
  return CULTURAS_MOCK;
}

/**
 * GET /api/v1/locais?latitude=-20.73&longitude=-48.91 → Local
 * Coordenada do GPS → município (para a tela "Você está perto de …").
 * BACKEND:
 *  - ponto dentro de qual município (malha IBGE, ST_Intersects);
 *  - 404 com codigo 'fora_da_cobertura' se cair fora do Brasil ou no mar;
 *  - não guardar a coordenada além do necessário para a análise.
 */
export async function buscarLocalPorCoordenada(latitude: number, longitude: number): Promise<Local> {
  if (!USANDO_MOCK) {
    return requisitar<Local>(`/locais?latitude=${latitude.toFixed(5)}&longitude=${longitude.toFixed(5)}`);
  }
  await esperar(400);
  // Mock: devolve o município da lista mais próximo do ponto.
  const maisPerto = MUNICIPIOS_MOCK.reduce((melhor, m) =>
    Math.hypot(m.latitude - latitude, m.longitude - longitude) < Math.hypot(melhor.latitude - latitude, melhor.longitude - longitude) ? m : melhor
  );
  return { ...maisPerto, latitude, longitude };
}

/**
 * GET /api/v1/municipios?busca=olim&limite=8 → Local[]
 * Busca para quem prefere digitar a cidade. Chamado a cada letra (com pausa de 250 ms).
 * BACKEND:
 *  - ignorar acento e maiúscula ("sao jose" acha "São José do Rio Preto");
 *  - começar a responder a partir de 2 letras; ordenar quem começa com o texto primeiro;
 *  - latitude/longitude = centro (centroide) do município.
 */
export async function buscarMunicipios(busca: string): Promise<Local[]> {
  const termo = normalizar(busca);
  if (termo.length < 2) return [];
  if (!USANDO_MOCK) return requisitar<Local[]>(`/municipios?busca=${encodeURIComponent(busca.trim())}&limite=8`);
  await esperar(150);
  return MUNICIPIOS_MOCK.filter(m => normalizar(`${m.municipio} ${m.uf}`).includes(termo))
    .sort((a, b) => Number(normalizar(b.municipio).startsWith(termo)) - Number(normalizar(a.municipio).startsWith(termo)))
    .slice(0, 8);
}

/**
 * POST /api/v1/analises  (corpo: AnaliseEntrada) → Analise
 * BACKEND:
 *  - devolver ≥3 estratégias já ordenadas, a prática atual incluída (o front não pontua);
 *  - preencher `talhao` com solo/relevo/riscos dos mapas, respeitando `correcoes`;
 *  - erro 422 com codigo 'dados_insuficientes' quando não houver dado para o ponto;
 *  - se demorar mais de ~10 s, combinar processamento assíncrono (convenção §6).
 */
export async function criarAnalise(entrada: AnaliseEntrada, descricaoLocal: string): Promise<Analise> {
  if (!USANDO_MOCK) {
    return requisitar<Analise>('/analises', { method: 'POST', body: JSON.stringify(entrada) });
  }
  const simular = simulacaoPedida();
  await esperar(simular === 'lento' ? 4000 : 900);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', 'Algo deu errado do nosso lado.');
  if (simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', 'Ainda não temos dados de satélite bons o bastante para esse lugar.');
  }
  return { ...ANALISE_MOCK, descricao_local: descricaoLocal, talhao: montarTalhaoMock(entrada.correcoes) };
}
