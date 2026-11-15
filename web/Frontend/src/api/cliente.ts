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
// As rotas seguem /api/v1, com substantivos no plural.
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
import { idiomaAtual, tx } from '../i18n/idioma';

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

const mensagemSemConexao = () =>
  tx('Não deu para falar com o servidor. Veja se a internet está ligada e tente de novo.', 'Could not reach the server. Check your internet connection and try again.');
const algoErrado = () => tx('Algo deu errado do nosso lado.', 'Something went wrong on our side.');

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
    throw new FalhaApi('sem_conexao', mensagemSemConexao());
  }
  if (!resposta.ok) {
    // Erro no formato da convenção ({ erro: {...} }). O 422 de validação do FastAPI
    // vem como { detail: [...] } e cai na mensagem genérica.
    const corpo = (await resposta.json().catch(() => null)) as Partial<ErroApi> | null;
    throw new FalhaApi(corpo?.erro?.codigo ?? 'erro_inesperado', corpo?.erro?.mensagem ?? algoErrado());
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
      throw new FalhaApi('sem_conexao', mensagemSemConexao());
    }
    if (!resposta.ok) throw new FalhaApi('erro_inesperado', tx('O servidor respondeu, mas não mostrou o que sabe fazer.', 'The server answered but did not list what it can do.'));
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
    throw new FalhaApi('rota_indisponivel', tx(`O servidor não disponibiliza ${metodo} ${caminho}. Reinicie a versão atual da API.`, `The server does not offer ${metodo} ${caminho}. Restart the current API version.`));
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
 * lista fixa por enquanto; ordem = ordem de exibição.
 */
let ultimasCulturas: Cultura[] = [];
/** A última lista mostrada na tela (para a narração ler as opções no idioma da tela). */
export const culturasCarregadas = () => ultimasCulturas;

export async function listarCulturas(): Promise<Cultura[]> {
  if (await backendTem('GET', '/culturas')) {
    ultimasCulturas = await requisitar<Cultura[]>(`/culturas?idioma=${idiomaAtual()}`);
    return ultimasCulturas;
  }
  if (USANDO_MOCK) await esperar(300);
  ultimasCulturas = CULTURAS_MOCK;
  return CULTURAS_MOCK;
}

/** Acima disso, o município mais próximo do mock seria um chute (ex.: um ponto nos EUA). */
const DISTANCIA_MAXIMA_MOCK_GRAUS = 1;

/**
 * GET /api/v1/locais?latitude=-20.73&longitude=-48.91 → Local
 * Coordenada do GPS → município (para a tela "Você está perto de …").
 */
export async function buscarLocalPorCoordenada(latitude: number, longitude: number): Promise<Local> {
  if (await backendTem('GET', '/locais')) {
    try {
      return await requisitar<Local>(`/locais?latitude=${latitude.toFixed(5)}&longitude=${longitude.toFixed(5)}`);
    } catch (e) {
      // Fora da cobertura municipal, mostra a coordenada recebida.
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
  // Sem município próximo no mock, mostra a coordenada recebida.
  return { codigo_ibge: '', municipio: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, uf: '', latitude, longitude };
}

/**
 * GET /api/v1/municipios?busca=olim&limite=8 → Local[]
 * Busca para quem prefere digitar a cidade. Chamado a cada letra (com pausa de 250 ms).
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
  const { estrategias, limitacoes } = montarEstrategias(entrada, descricaoLocal.replace(/ \(.*\)$/, '') || tx('sua cidade', 'your town'));
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
 *
 * No modo 'api', usa exclusivamente o POST real. Se a rota estiver ausente,
 * informa o erro; os caminhos fictícios só existem no modo 'mock' explícito.
 */
export async function criarAnalise(entrada: AnaliseEntrada, descricaoLocal: string): Promise<Analise> {
  if (await backendTem('POST', '/analises')) {
    return requisitar<Analise>('/analises', { method: 'POST', body: JSON.stringify({ ...entrada, idioma: idiomaAtual() }) });
  }
  const simular = simulacaoPedida();
  await esperar(simular === 'lento' ? 4000 : 900);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', algoErrado());
  if (simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', tx('Ainda não temos dados de satélite bons o bastante para esse lugar.', 'We do not have good enough satellite data for this place yet.'));
  }
  return analiseMock(entrada, descricaoLocal);
}

/** Cidade usada quando a pessoa abre o painel sem ter escolhido o local. */
export const CODIGO_IBGE_EXEMPLO = '3549805';

/**
 * GET /api/v1/producao?codigo_ibge=3549805 → PainelProducao   (REAL)
 * GET /api/v1/producao?latitude=&longitude= → PainelProducao  (REAL, EUA:
 *   Census Bureau Geocoder + USDA NASS QuickStats, qualquer coordenada)
 * web/Backend/app/modelos/painel_producao.py (Brasil, por código IBGE)
 * e painel_producao_eua.py (EUA, por coordenada). 404 'dados_insuficientes'
 * fora das duas coberturas, ou município/condado sem dado pré-processado.
 *
 * Sem código IBGE (fora do Brasil) tenta a coordenada; local null (ninguém
 * escolheu lugar ainda) só usa a cópia de exemplo no modo mock.
 */
export async function buscarPainelProducao(local: Local | null): Promise<PainelProducao> {
  if (!USANDO_MOCK && local === null) {
    throw new FalhaApi('local_nao_informado', tx('Escolha a localização da plantação para consultar a API.', 'Choose the location of the field to query the API.'));
  }
  const codigoIbge = local?.codigo_ibge || (local === null ? CODIGO_IBGE_EXEMPLO : '');
  if (await backendTem('GET', '/producao')) {
    if (codigoIbge) {
      return requisitar<PainelProducao>(`/producao?codigo_ibge=${encodeURIComponent(codigoIbge)}&idioma=${idiomaAtual()}`);
    }
    return requisitar<PainelProducao>(`/producao?latitude=${local!.latitude.toFixed(5)}&longitude=${local!.longitude.toFixed(5)}&idioma=${idiomaAtual()}`);
  }
  const simular = simulacaoPedida();
  if (USANDO_MOCK) await esperar(simular === 'lento' ? 4000 : 400);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', algoErrado());
  const painel = codigoIbge ? PAINEIS_PRODUCAO[codigoIbge] : undefined;
  if (!painel || simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', tx('Ainda não temos os números da colheita dessa cidade.', 'We do not have harvest numbers for this town yet.'));
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
 * Fotos do Sentinel-2 do GPS ou da coordenada digitada. Primeira consulta leva ~30 s
 * (o backend processa e guarda em cache); as seguintes respondem na hora.
 *
 * Usa a rota para ponto explícito quando o servidor está no ar, MESMO no modo
 * mock: é a única tela que precisa do ponto exato (o resto do fluxo usa a cidade).
 * Sem servidor, ou com a cidade escolhida na busca (o centro da cidade mostraria
 * casas), só usa a cópia local no modo mock. No modo api informa a limitação.
 */
export async function buscarAcompanhamento(local: Local, origem: OrigemLocal | null): Promise<Acompanhamento> {
  // A busca municipal traz código/UF. "Usar o ponto" preserva a coordenada
  // digitada com ambos vazios; não é um centroide escolhido automaticamente.
  const coordenadaDigitada = origem === 'municipio' && !local.codigo_ibge && !local.uf;
  const pontoReal = origem === 'gps' || coordenadaDigitada;
  if (!USANDO_MOCK && !pontoReal) {
    throw new FalhaApi(
      'dados_insuficientes',
      tx(
        'As fotos precisam da coordenada da plantação. Use o GPS no local ou digite a coordenada; o centro da cidade não identifica o seu talhão.',
        'The photos need the coordinates of the field. Use GPS on site or type the coordinate; the town center does not identify your field.'
      )
    );
  }
  if (pontoReal && (USANDO_MOCK ? await backendTemSemFalhar('GET', '/acompanhamento') : await backendTem('GET', '/acompanhamento'))) {
    return requisitar<Acompanhamento>(`/acompanhamento?latitude=${local.latitude.toFixed(5)}&longitude=${local.longitude.toFixed(5)}`);
  }
  const simular = simulacaoPedida();
  if (USANDO_MOCK) await esperar(simular === 'lento' ? 4000 : 400);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', algoErrado());
  const copia = ACOMPANHAMENTOS[local.codigo_ibge];
  if (!copia && pontoReal) {
    throw new FalhaApi('dados_insuficientes', tx(`Para ver as fotos do seu ponto (${local.latitude.toFixed(5)}, ${local.longitude.toFixed(5)}), o servidor precisa estar ligado.`, `To see the photos of your point (${local.latitude.toFixed(5)}, ${local.longitude.toFixed(5)}), the server must be running.`));
  }
  if (!copia || simular === 'dados_insuficientes') {
    throw new FalhaApi('dados_insuficientes', tx('Ainda não temos fotos de satélite dessa área.', 'We do not have satellite photos of this area yet.'));
  }
  return { ...copia, ponto_exemplo: true };
}

/**
 * GET /api/v1/previsao?codigo_ibge=3530300 → PrevisaoClima | null
 * Previsão oficial dos próximos meses para a região do município (o boletim do INMET
 * fala por região, ex.: noroeste paulista). null = não temos previsão para essa região.
 * previsao_do_municipio() em web/Backend/app/modelos/painel_producao.py.
 */
export async function buscarPrevisao(codigoIbge: string): Promise<PrevisaoClima | null> {
  if (!codigoIbge) return null; // sem região brasileira identificada, sem previsão
  if (await backendTem('GET', '/previsao')) {
    return requisitar<PrevisaoClima | null>(`/previsao?codigo_ibge=${encodeURIComponent(codigoIbge)}`);
  }
  return PREVISOES_POR_REGIAO.find(r => r.codigos_ibge.includes(codigoIbge))?.previsao ?? null;
}
