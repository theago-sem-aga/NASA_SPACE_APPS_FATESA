// Cliente da API. Escolhe entre mock e backend real por configuração
// (VITE_FONTE_DADOS), como pede a convenção §6.
import type { Analise, AnaliseEntrada, Cultura, ErroApi } from './tipos';
import { ANALISE_MOCK, CULTURAS_MOCK } from './mock/dadosMock';

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

// Permite demonstrar os estados da tela no mock: ?simular=erro | dados_insuficientes | lento
function simulacaoPedida(): string | null {
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
    throw new FalhaApi('sem_conexao', 'Não foi possível falar com o servidor. Verifique a internet e tente de novo.');
  }
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as ErroApi | null;
    throw new FalhaApi(corpo?.erro.codigo ?? 'erro_inesperado', corpo?.erro.mensagem ?? 'Algo deu errado no servidor.');
  }
  return (await resposta.json()) as T;
}

export async function listarCulturas(): Promise<Cultura[]> {
  if (!USANDO_MOCK) return requisitar<Cultura[]>('/culturas');
  await esperar(300);
  return CULTURAS_MOCK;
}

export async function criarAnalise(entrada: AnaliseEntrada): Promise<Analise> {
  if (!USANDO_MOCK) {
    return requisitar<Analise>('/analises', { method: 'POST', body: JSON.stringify(entrada) });
  }
  const simular = simulacaoPedida();
  await esperar(simular === 'lento' ? 4000 : 900);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', 'Algo deu errado no servidor.');
  if (simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', 'Não há dados suficientes para esta localização.');
  }
  return { ...ANALISE_MOCK, descricao_local: entrada.descricao_local };
}
