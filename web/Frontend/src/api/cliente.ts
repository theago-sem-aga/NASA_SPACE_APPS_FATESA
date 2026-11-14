// Cliente da API. Escolhe entre mock e backend real por configuração
// (VITE_FONTE_DADOS), como pede a convenção §6.
//
// No modo 'api', o front lê o /openapi.json do backend uma vez e usa cada rota
// real que já existir. Rota que ainda não existe cai no mock, sempre sinalizado
// na tela (convenção §0.3). Assim, quando o backend implementar uma rota, o front
// passa a usá-la sem mudar nada aqui.
//
// Situação hoje (ver docs/contrato_api.md):
//  - REAL:      GET /analises?latitude&longitude → RespostaAnalise (variáveis por fonte)
//  - PROPOSTA:  GET /culturas, GET /locais, GET /municipios, POST /analises → Analise,
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
import { montarEstrategias } from './mock/montarEstrategias';

const FONTE_DADOS = import.meta.env.VITE_FONTE_DADOS ?? 'mock';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const USANDO_MOCK = FONTE_DADOS !== 'api';

/**
 * Mostra na tela os avisos de "dados de exemplo" quando a análise é mock.
 * - Modo 'mock': desligado por padrão, para avaliar o visual final. LIGUE
 *   (VITE_SINALIZAR_MOCK=true) em qualquer apresentação pública com mock.
 * - Modo 'api': sempre ligado. Se alguma parte cair no mock porque o backend ainda
 *   não tem a rota, ela não pode parecer observação real (convenção §0.3).
 * Os componentes só mostram o aviso quando `analise.eh_mock` é true.
 */
export const SINALIZAR_MOCK = USANDO_MOCK ? import.meta.env.VITE_SINALIZAR_MOCK === 'true' : true;

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
  return (await carregarRotas()).has(`${metodo} ${caminho}`);
}

// --- Rotas -----------------------------------------------------------------------

/** Tira acento e caixa, para a busca achar "olimpia" em "Olímpia". */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * GET /api/v1/culturas → Cultura[]   (PROPOSTA, ainda não existe no backend)
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
 * GET /api/v1/locais?latitude=-20.73&longitude=-48.91 → Local   (PROPOSTA, ainda não existe)
 * Coordenada do GPS → município (para a tela "Você está perto de …").
 * BACKEND:
 *  - ponto dentro de qual município (malha IBGE, ST_Intersects);
 *  - 404 com codigo 'fora_da_cobertura' se cair fora do Brasil ou no mar;
 *  - não guardar a coordenada além do necessário para a análise.
 */
export async function buscarLocalPorCoordenada(latitude: number, longitude: number): Promise<Local> {
  if (await backendTem('GET', '/locais')) {
    return requisitar<Local>(`/locais?latitude=${latitude.toFixed(5)}&longitude=${longitude.toFixed(5)}`);
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
 * GET /api/v1/municipios?busca=olim&limite=8 → Local[]   (PROPOSTA, ainda não existe)
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

/** Nome curto de cada `fonte` do backend, para o texto da tela. */
const NOME_FONTE: Record<string, string> = {
  nasa_power: 'NASA POWER',
  usda_soil_data_access: 'solo do USDA',
  openet: 'OpenET',
  gpm: 'GPM',
  smap: 'SMAP',
  srtm: 'SRTM',
  ecostress: 'ECOSTRESS',
  landsat: 'Landsat'
};
const MOTIVO_FONTE: Record<string, string> = {
  fora_da_regiao_pre_processada: 'fora da área já processada',
  fora_da_cobertura: 'não cobre este lugar'
};
const nomeFonte = (fonte: string) => NOME_FONTE[fonte] ?? fonte;

/** Só descreve o que a API devolveu (quais fontes têm dado). Não interpreta valor nenhum. */
function limitacoesDaColeta(coleta: RespostaAnalise): string[] {
  const comDado = [...new Set(coleta.variaveis.filter(v => v.valor !== null).map(v => nomeFonte(v.fonte)))];
  const linhas = ['Os caminhos, a terra e a chuva destas telas ainda são exemplo: o servidor ainda não monta as estratégias.'];
  if (comDado.length > 0) linhas.push(`Já chegam dados reais deste ponto de: ${comDado.join(', ')}.`);
  if (coleta.fontes_indisponiveis.length > 0) {
    const semDado = coleta.fontes_indisponiveis.map(f => `${nomeFonte(f.fonte)} (${MOTIVO_FONTE[f.motivo] ?? f.motivo})`);
    linhas.push(`Sem dado para este ponto: ${semDado.join(', ')}.`);
  }
  return linhas;
}

function analiseMock(entrada: AnaliseEntrada, descricaoLocal: string): Analise {
  // Os caminhos mudam com as prioridades e os recursos: escolha do motor de decisão (backend).
  const { estrategias, limitacoes } = montarEstrategias(entrada, descricaoLocal.replace(/ \(.*\)$/, '') || 'sua cidade');
  return {
    ...ANALISE_MOCK,
    descricao_local: descricaoLocal,
    talhao: montarTalhaoMock(entrada.correcoes),
    estrategias,
    limitacoes: [...limitacoes, ...ANALISE_MOCK.limitacoes]
  };
}

/**
 * POST /api/v1/analises  (corpo: AnaliseEntrada) → Analise   (PROPOSTA, ainda não existe)
 * BACKEND:
 *  - devolver ≥3 estratégias já ordenadas, a prática atual incluída (o front não pontua);
 *  - preencher `talhao` com solo/relevo/riscos dos mapas, respeitando `correcoes`;
 *    as variáveis de GET /analises já trazem a base: areia_pct/argila_pct/silte_pct
 *    (textura), elevacao_*_m (relevo), precipitacao_acumulada_mm e umidade_solo_cm3_cm3 (seca);
 *  - erro 422 com codigo 'dados_insuficientes' quando não houver dado para o ponto;
 *  - se demorar mais de ~10 s, combinar processamento assíncrono (convenção §6).
 *
 * Enquanto o POST não existe, o modo 'api' busca as variáveis reais (GET acima) e
 * mostra os caminhos do mock com eh_mock = true, dizendo em `limitacoes` quais
 * fontes reais responderam para o ponto.
 */
export async function criarAnalise(entrada: AnaliseEntrada, descricaoLocal: string): Promise<Analise> {
  if (await backendTem('POST', '/analises')) {
    return requisitar<Analise>('/analises', { method: 'POST', body: JSON.stringify(entrada) });
  }
  if (!USANDO_MOCK) {
    const coleta = await coletarVariaveis(entrada.latitude, entrada.longitude);
    const mock = analiseMock(entrada, descricaoLocal);
    return { ...mock, eh_mock: true, limitacoes: [...limitacoesDaColeta(coleta), ...mock.limitacoes] };
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
 * GET /api/v1/producao?codigo_ibge=3549805 → PainelProducao   (PROPOSTA, ainda não existe)
 * BACKEND: a resposta já é montada por web/Backend/app/modelos/painel_producao.py
 * (montar_painel); falta só a rota. 404 com codigo 'dados_insuficientes' para
 * município sem dados pré-processados.
 *
 * Enquanto a rota não existe, usa a cópia local gerada por esse mesmo script.
 * Os números da cópia são REAIS (IBGE + NASA POWER), só congelados em `gerado_em`.
 */
export async function buscarPainelProducao(codigoIbge: string): Promise<PainelProducao> {
  if (await backendTem('GET', '/producao')) {
    return requisitar<PainelProducao>(`/producao?codigo_ibge=${encodeURIComponent(codigoIbge)}`);
  }
  const simular = simulacaoPedida();
  if (USANDO_MOCK) await esperar(simular === 'lento' ? 4000 : 400);
  if (simular === 'erro') throw new FalhaApi('erro_inesperado', 'Algo deu errado do nosso lado.');
  const painel = PAINEIS_PRODUCAO[codigoIbge];
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
 * casas), usa a cópia local: talhão de EXEMPLO da cidade (ponto_exemplo = true).
 */
export async function buscarAcompanhamento(local: Local, origem: OrigemLocal | null): Promise<Acompanhamento> {
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
 * GET /api/v1/previsao?codigo_ibge=3530300 → PrevisaoClima | null   (PROPOSTA, ainda não existe)
 * Previsão oficial dos próximos meses para a região do município (o boletim do INMET
 * fala por região, ex.: noroeste paulista). null = não temos previsão para essa região.
 * BACKEND: previsao_do_municipio() em web/Backend/app/modelos/painel_producao.py.
 */
export async function buscarPrevisao(codigoIbge: string): Promise<PrevisaoClima | null> {
  if (await backendTem('GET', '/previsao')) {
    return requisitar<PrevisaoClima | null>(`/previsao?codigo_ibge=${encodeURIComponent(codigoIbge)}`);
  }
  return PREVISOES_POR_REGIAO.find(r => r.codigos_ibge.includes(codigoIbge))?.previsao ?? null;
}
