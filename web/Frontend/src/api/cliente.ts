// Cliente da API. Escolhe entre mock e backend real por configuração
// (VITE_FONTE_DADOS), como pede a convenção §6.
//
// No modo 'api', uma rota ausente ou fonte indisponível produz erro/ausência
// explícita. Nunca substituir uma resposta real por dados de src/api/mock.
//
// Situação hoje (ver /openapi.json ou /docs do backend):
//  - REAL:      GET /analises?latitude&longitude → RespostaAnalise (variáveis por fonte)
//  - REAL:      GET /culturas, GET /locais, GET /municipios, POST /analises → Analise,
//               GET /producao → PainelProducao, GET /previsao → PrevisaoClima | null
//  - REAL:      GET /acompanhamento → Acompanhamento (fotos do satélite do ponto do GPS)
//
// BACKEND: cada função abaixo documenta a rota que o front chama. Os nomes de
// rota seguem a proposta da convenção §6 (/api/v1, substantivo no plural).
import type { Acompanhamento, Analise, AnaliseEntrada, Cultura, ErroApi, Local, OrigemLocal, PainelProducao, PrevisaoClima, RespostaAnalise } from './tipos';
import { ACOMPANHAMENTOS } from './mock/acompanhamentoMunicipio';
import { PREVISOES_POR_REGIAO } from './mock/previsaoRegiao';
import { PAINEIS_PRODUCAO } from './mock/producaoMunicipio';
import { ANALISE_MOCK, CULTURAS_MOCK, MUNICIPIOS_MOCK, montarTalhaoMock } from './mock/dadosMock';
import { GEADA_FRESNO, GEADA_SJRP } from './mock/geadaMock';
import { TENDENCIA_FRESNO, TENDENCIA_SJRP } from './mock/tendenciaHidricaMock';
import { ESTRESSE_FRESNO, ESTRESSE_SJRP } from './mock/estresseVegetalMock';
import { PRECIPITACAO_EXTREMA_FRESNO, PRECIPITACAO_EXTREMA_SJRP } from './mock/precipitacaoExtremaMock';
import { montarEstrategias } from './mock/montarEstrategias';

const FONTE_DADOS = import.meta.env.VITE_FONTE_DADOS ?? 'api';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const USANDO_MOCK = FONTE_DADOS === 'mock';

/**
 * Mostra na tela os avisos de "dados de exemplo" quando a análise é mock.
 * - Modo 'mock': ligado por padrão (VITE_SINALIZAR_MOCK=true).
 * - Modo 'api': sempre ligado, inclusive se o servidor declarar uma análise beta.
 * Os componentes só mostram o aviso quando `analise.eh_mock` é true.
 */
export const SINALIZAR_MOCK = USANDO_MOCK ? import.meta.env.VITE_SINALIZAR_MOCK !== 'false' : true;

export class FalhaApi extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string
  ) {
    super(mensagem);
  }
}

// Permite demonstrar os estados da tela no mock: ?simular=erro | dados_insuficientes | lento | sem_gps | fresno (ou geada)
export function simulacaoPedida(): string | null {
  return new URLSearchParams(window.location.search).get('simular');
}

function esperar(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MENSAGEM_SEM_CONEXAO = 'Não deu para falar com o servidor. Veja se a internet está ligada e tente de novo.';

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...init,
      // Content-Type só quando há corpo: num GET ele obrigaria o navegador a fazer
      // uma consulta prévia de CORS (OPTIONS) sem necessidade.
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers
    });
  } catch {
    throw new FalhaApi('sem_conexao', MENSAGEM_SEM_CONEXAO);
  }
  if (!resposta.ok) {
    // Erro no formato da convenção ({ erro: {...} }). O 422 de validação do FastAPI
    // vem como { detail: [...] } e cai na mensagem genérica.
    const corpo = (await resposta.json().catch(() => null)) as Partial<ErroApi> | null;
    throw new FalhaApi(corpo?.erro?.codigo ?? 'erro_inesperado', corpo?.erro?.mensagem ?? 'Algo deu errado do nosso lado.');
  }
  return (await resposta.json()) as T;
}

// --- Descoberta de rotas pelo /openapi.json -------------------------------------

const URL_BASE = new URL(API_URL, window.location.href);
/** Prefixo das rotas, ex.: '/api/v1'. */
const PREFIXO = URL_BASE.pathname.replace(/\/$/, '');
/** O FastAPI publica o contrato na raiz do servidor, fora do prefixo. */
const URL_OPENAPI = `${URL_BASE.origin}/openapi.json`;

let rotasDoBackend: Promise<Set<string>> | null = null;

/** Lê o /openapi.json uma vez e guarda as rotas como 'GET /analises', 'POST /analises'… */
function carregarRotas(): Promise<Set<string>> {
  rotasDoBackend ??= (async () => {
    let resposta: Response;
    try {
      resposta = await fetch(URL_OPENAPI);
    } catch {
      throw new FalhaApi('sem_conexao', MENSAGEM_SEM_CONEXAO);
    }
    if (!resposta.ok) throw new FalhaApi('erro_inesperado', 'O servidor respondeu, mas não mostrou o que sabe fazer.');
    const contrato = (await resposta.json()) as { paths?: Record<string, Record<string, unknown>> };
    const rotas = new Set<string>();
    for (const [caminho, metodos] of Object.entries(contrato.paths ?? {})) {
      const relativo = caminho.startsWith(PREFIXO) ? caminho.slice(PREFIXO.length) : caminho;
      for (const metodo of Object.keys(metodos)) rotas.add(`${metodo.toUpperCase()} ${relativo}`);
    }
    return rotas;
  })().catch(erro => {
    rotasDoBackend = null; // tenta de novo na próxima chamada
    throw erro;
  });
  return rotasDoBackend;
}

/** true se o backend já implementa a rota (no modo mock, sempre false). */
async function backendTem(metodo: 'GET' | 'POST', caminho: string): Promise<boolean> {
  if (USANDO_MOCK) return false;
  if (!(await carregarRotas()).has(`${metodo} ${caminho}`)) {
    throw new FalhaApi('rota_indisponivel', `O servidor não disponibiliza ${metodo} ${caminho}. Reinicie a versão atual da API.`);
  }
  return true;
}

// --- Rotas -----------------------------------------------------------------------

/** Tira acento e caixa, para a busca achar "olimpia" em "Olímpia". */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * GET /api/v1/culturas → Cultura[]
 * BACKEND: lista fixa por enquanto; ordem = ordem de exibição.
 */
export async function listarCulturas(): Promise<Cultura[]> {
  if (await backendTem('GET', '/culturas')) return requisitar<Cultura[]>('/culturas');
  if (USANDO_MOCK) await esperar(300);
  return CULTURAS_MOCK;
}

/** Acima disso, o município mais próximo do mock seria um chute (ex.: um ponto nos EUA). */
const DISTANCIA_MAXIMA_MOCK_GRAUS = 1;

/**
 * GET /api/v1/locais?latitude=-20.73&longitude=-48.91 → Local
 * Coordenada do GPS → município (para a tela "Você está perto de …").
 * BACKEND:
 *  - ponto dentro de qual município (malha IBGE, ST_Intersects);
 *  - 404 com codigo 'fora_da_cobertura' se cair fora do Brasil ou no mar;
 *  - não guardar a coordenada além do necessário para a análise.
 */
export async function buscarLocalPorCoordenada(latitude: number, longitude: number): Promise<Local> {
  if (await backendTem('GET', '/locais')) {
    try {
      return await requisitar<Local>(`/locais?latitude=${latitude.toFixed(5)}&longitude=${longitude.toFixed(5)}`);
    } catch (e) {
      // Fora da cobertura de município (hoje só o Brasil tem busca por nome/malha):
      // mostra a própria coordenada, nunca inventa uma cidade. A análise usa o
      // ponto real de qualquer jeito — EUA e outros países funcionam assim.
      if (e instanceof FalhaApi && e.codigo === 'fora_da_cobertura') {
        return { codigo_ibge: '', municipio: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, uf: '', latitude, longitude };
      }
      throw e;
    }
  }
  if (USANDO_MOCK) await esperar(400);
  // Mock: devolve o município da lista mais próximo do ponto.
  const distancia = (m: Local) => Math.hypot(m.latitude - latitude, m.longitude - longitude);
  const maisPerto = MUNICIPIOS_MOCK.reduce((melhor, m) => (distancia(m) < distancia(melhor) ? m : melhor));
  if (USANDO_MOCK || distancia(maisPerto) <= DISTANCIA_MAXIMA_MOCK_GRAUS) return { ...maisPerto, latitude, longitude };
  // Modo api sem /locais e longe de todo município do mock: mostra o próprio ponto,
  // em vez de inventar uma cidade. A análise usa a coordenada de qualquer jeito.
  return { codigo_ibge: '', municipio: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, uf: '', latitude, longitude };
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
  if (await backendTem('GET', '/municipios')) {
    return requisitar<Local[]>(`/municipios?busca=${encodeURIComponent(busca.trim())}&limite=8`);
  }
  if (USANDO_MOCK) await esperar(150);
  return MUNICIPIOS_MOCK.filter(m => normalizar(`${m.municipio} ${m.uf}`).includes(termo))
    .sort((a, b) => Number(normalizar(b.municipio).startsWith(termo)) - Number(normalizar(a.municipio).startsWith(termo)))
    .slice(0, 8);
}

/**
 * GET /api/v1/analises?latitude=&longitude= → RespostaAnalise   (REAL, já implementada)
 * Todas as variáveis que o backend tem para o ponto, por fonte, e as fontes sem dado.
 */
export function coletarVariaveis(latitude: number, longitude: number): Promise<RespostaAnalise> {
  return requisitar<RespostaAnalise>(`/analises?latitude=${latitude}&longitude=${longitude}`);
}

function analiseMock(entrada: AnaliseEntrada, descricaoLocal: string): Analise {
  // Os caminhos mudam com as prioridades e os recursos: escolha do motor de decisão (backend).
  const { estrategias, limitacoes } = montarEstrategias(entrada, descricaoLocal.replace(/ \(.*\)$/, '') || 'sua cidade');
  // Geada, chuva extrema e tendência da chuva REAIS da NASA POWER (congeladas).
  // ?simular=fresno (ou o antigo ?simular=geada) mostra Fresno: geia todo inverno,
  // chove mais fora do padrão em novembro e a chuva do ano não tem tendência.
  const emFresno = simulacaoPedida() === 'fresno' || simulacaoPedida() === 'geada';
  const geada = emFresno ? GEADA_FRESNO : GEADA_SJRP;
  const precipitacaoExtrema = emFresno ? PRECIPITACAO_EXTREMA_FRESNO : PRECIPITACAO_EXTREMA_SJRP;
  return {
    ...ANALISE_MOCK,
    descricao_local: descricaoLocal,
    talhao: montarTalhaoMock(entrada.correcoes, geada),
    geada,
    precipitacao_extrema: precipitacaoExtrema,
    tendencia_hidrica: emFresno ? TENDENCIA_FRESNO : TENDENCIA_SJRP,
    estresse_vegetal: emFresno ? ESTRESSE_FRESNO : ESTRESSE_SJRP,
    estrategias,
    limitacoes: [...limitacoes, ...ANALISE_MOCK.limitacoes]
  };
}

/**
 * POST /api/v1/analises  (corpo: AnaliseEntrada) → Analise
 * BACKEND:
 *  - devolver ≥3 estratégias já ordenadas, a prática atual incluída (o front não pontua);
 *  - preencher `talhao` com solo/relevo/riscos dos mapas, respeitando `correcoes`;
 *    as variáveis de GET /analises já trazem a base: areia_pct/argila_pct/silte_pct
 *    (textura), elevacao_*_m (relevo), precipitacao_acumulada_mm e umidade_solo_cm3_cm3 (seca);
 *  - erro 422 com codigo 'dados_insuficientes' quando não houver dado para o ponto;
 *  - se demorar mais de ~10 s, combinar processamento assíncrono (convenção §6).
 *
 * No modo 'api', usa exclusivamente o POST real. Se a rota estiver ausente,
 * informa o erro; os caminhos fictícios só existem no modo 'mock' explícito.
 */
export async function criarAnalise(entrada: AnaliseEntrada, descricaoLocal: string): Promise<Analise> {
  if (await backendTem('POST', '/analises')) {
    return requisitar<Analise>('/analises', { method: 'POST', body: JSON.stringify(entrada) });
  }
  const simular = simulacaoPedida();
  await esperar(simular === 'lento' ? 4000 : 900);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', 'Algo deu errado do nosso lado.');
  if (simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', 'Ainda não temos dados de satélite bons o bastante para esse lugar.');
  }
  return analiseMock(entrada, descricaoLocal);
}

/** Cidade usada quando a pessoa abre o painel sem ter escolhido o local. */
export const CODIGO_IBGE_EXEMPLO = '3549805';

/**
 * GET /api/v1/producao?codigo_ibge=3549805 → PainelProducao   (REAL)
 * GET /api/v1/producao?latitude=&longitude= → PainelProducao  (REAL, EUA:
 *   Census Bureau Geocoder + USDA NASS QuickStats, qualquer coordenada)
 * BACKEND: web/Backend/app/modelos/painel_producao.py (Brasil, por código IBGE)
 * e painel_producao_eua.py (EUA, por coordenada). 404 'dados_insuficientes'
 * fora das duas coberturas, ou município/condado sem dado pré-processado.
 *
 * Sem código IBGE (fora do Brasil) tenta a coordenada; local null (ninguém
 * escolheu lugar ainda) só usa a cópia de exemplo no modo mock.
 */
export async function buscarPainelProducao(local: Local | null): Promise<PainelProducao> {
  if (!USANDO_MOCK && local === null) {
    throw new FalhaApi('local_nao_informado', 'Escolha a localização da plantação para consultar a API.');
  }
  const codigoIbge = local?.codigo_ibge || (local === null ? CODIGO_IBGE_EXEMPLO : '');
  if (await backendTem('GET', '/producao')) {
    if (codigoIbge) {
      return requisitar<PainelProducao>(`/producao?codigo_ibge=${encodeURIComponent(codigoIbge)}`);
    }
    return requisitar<PainelProducao>(`/producao?latitude=${local!.latitude.toFixed(5)}&longitude=${local!.longitude.toFixed(5)}`);
  }
  const simular = simulacaoPedida();
  if (USANDO_MOCK) await esperar(simular === 'lento' ? 4000 : 400);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', 'Algo deu errado do nosso lado.');
  const painel = codigoIbge ? PAINEIS_PRODUCAO[codigoIbge] : undefined;
  if (!painel || simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', 'Ainda não temos os números da colheita dessa cidade.');
  }
  return painel;
}

/** Como backendTem, mas também tenta no modo mock, e servidor desligado vira false (sem erro). */
async function backendTemSemFalhar(metodo: 'GET' | 'POST', caminho: string): Promise<boolean> {
  try {
    return (await carregarRotas()).has(`${metodo} ${caminho}`);
  } catch {
    return false;
  }
}

/**
 * GET /api/v1/acompanhamento?latitude=&longitude= → Acompanhamento   (REAL: web/Backend/app/api/v1/acompanhamento.py)
 * Fotos do Sentinel-2 do PONTO DO GPS. Primeira consulta de um ponto leva ~30 s
 * (o backend processa e guarda em cache); as seguintes respondem na hora.
 *
 * Usa a rota sempre que o ponto veio do GPS e o servidor está no ar, MESMO no modo
 * mock: é a única tela que precisa do ponto exato (o resto do fluxo usa a cidade).
 * Sem servidor, ou com a cidade escolhida na busca (o centro da cidade mostraria
 * casas), só usa a cópia local no modo mock. No modo api informa a limitação.
 */
export async function buscarAcompanhamento(local: Local, origem: OrigemLocal | null): Promise<Acompanhamento> {
  if (!USANDO_MOCK && origem !== 'gps') {
    throw new FalhaApi('dados_insuficientes', 'As fotos precisam da coordenada da plantação. Use o GPS no local; o centro da cidade não identifica o seu talhão.');
  }
  const pontoReal = origem === 'gps';
  if (pontoReal && (USANDO_MOCK ? await backendTemSemFalhar('GET', '/acompanhamento') : await backendTem('GET', '/acompanhamento'))) {
    return requisitar<Acompanhamento>(`/acompanhamento?latitude=${local.latitude.toFixed(5)}&longitude=${local.longitude.toFixed(5)}`);
  }
  const simular = simulacaoPedida();
  if (USANDO_MOCK) await esperar(simular === 'lento' ? 4000 : 400);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', 'Algo deu errado do nosso lado.');
  const copia = ACOMPANHAMENTOS[local.codigo_ibge];
  if (!copia && pontoReal) {
    throw new FalhaApi('dados_insuficientes', `Para ver as fotos do seu ponto (${local.latitude.toFixed(5)}, ${local.longitude.toFixed(5)}), o servidor precisa estar ligado.`);
  }
  if (!copia || simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', 'Ainda não temos fotos de satélite dessa área.');
  }
  return { ...copia, ponto_exemplo: true };
}

/**
 * GET /api/v1/previsao?codigo_ibge=3530300 → PrevisaoClima | null
 * Previsão oficial dos próximos meses para a região do município (o boletim do INMET
 * fala por região, ex.: noroeste paulista). null = não temos previsão para essa região.
 * BACKEND: previsao_do_municipio() em web/Backend/app/modelos/painel_producao.py.
 */
export async function buscarPrevisao(codigoIbge: string): Promise<PrevisaoClima | null> {
  if (!codigoIbge) return null; // sem região brasileira identificada, sem previsão
  if (await backendTem('GET', '/previsao')) {
    return requisitar<PrevisaoClima | null>(`/previsao?codigo_ibge=${encodeURIComponent(codigoIbge)}`);
  }
  return PREVISOES_POR_REGIAO.find(r => r.codigos_ibge.includes(codigoIbge))?.previsao ?? null;
}
