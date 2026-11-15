// DADOS FICTÍCIOS (mock) — mesmo formato do contrato proposto em ../tipos.ts.
// Nenhum número aqui é observação real. Os textos tentam soar como uma conversa
// com o técnico de campo e citam práticas reais da reforma de canavial em SP,
// mas TODOS precisam ser conferidos nas referências antes de ir para o produto.
// As referências listadas NÃO foram verificadas: são indicações de onde buscar.
// EXCEÇÃO: o risco de geada (geadaMock.ts), a precipitação extrema
// (precipitacaoExtremaMock.ts) e a tendência da chuva (tendenciaHidricaMock.ts)
// são REAIS (NASA POWER), só congelados; o verdor da planta (estresseVegetalMock.ts)
// é REAL (NDVI do MODIS), só congelado.
import type { Analise, CaracteristicasTalhao, CorrecoesTalhao, Cultura, Local, RiscoGeada } from '../tipos';
import { CALOR_SJRP } from './calorMock';
import { GEADA_SJRP } from './geadaMock';
import { ESTRATEGIAS_PADRAO } from './montarEstrategias';
import { PRECIPITACAO_EXTREMA_SJRP } from './precipitacaoExtremaMock';
import { TENDENCIA_SJRP } from './tendenciaHidricaMock';
import { ESTRESSE_SJRP } from './estresseVegetalMock';

export const CULTURAS_MOCK: Cultura[] = [
  { cultura_id: 'cana_de_acucar', nome: 'Cana-de-açúcar', tem_demonstracao: true },
  { cultura_id: 'soja', nome: 'Soja', tem_demonstracao: false },
  { cultura_id: 'milho', nome: 'Milho', tem_demonstracao: false },
  { cultura_id: 'trigo', nome: 'Trigo', tem_demonstracao: false },
  { cultura_id: 'pastagem', nome: 'Pasto', tem_demonstracao: false }
];

// Municípios para a busca e para o "Você está perto de…" no mock. Coordenadas
// aproximadas do centro e códigos IBGE só ilustrativos: o back usa a malha oficial.
export const MUNICIPIOS_MOCK: Local[] = [
  { codigo_ibge: '3549805', municipio: 'São José do Rio Preto', uf: 'SP', latitude: -20.82, longitude: -49.38 },
  { codigo_ibge: '3533908', municipio: 'Olímpia', uf: 'SP', latitude: -20.74, longitude: -48.91 },
  { codigo_ibge: '3530300', municipio: 'Mirassol', uf: 'SP', latitude: -20.82, longitude: -49.52 },
  { codigo_ibge: '3511102', municipio: 'Catanduva', uf: 'SP', latitude: -21.14, longitude: -48.97 },
  { codigo_ibge: '3505500', municipio: 'Barretos', uf: 'SP', latitude: -20.56, longitude: -48.57 },
  { codigo_ibge: '3506102', municipio: 'Bebedouro', uf: 'SP', latitude: -20.95, longitude: -48.48 },
  { codigo_ibge: '3517406', municipio: 'Guaíra', uf: 'SP', latitude: -20.32, longitude: -48.31 },
  { codigo_ibge: '3524303', municipio: 'Jaboticabal', uf: 'SP', latitude: -21.25, longitude: -48.32 },
  { codigo_ibge: '3551702', municipio: 'Sertãozinho', uf: 'SP', latitude: -21.14, longitude: -47.99 },
  { codigo_ibge: '3543402', municipio: 'Ribeirão Preto', uf: 'SP', latitude: -21.18, longitude: -47.81 },
  { codigo_ibge: '3503208', municipio: 'Araraquara', uf: 'SP', latitude: -21.79, longitude: -48.18 },
  { codigo_ibge: '3502804', municipio: 'Araçatuba', uf: 'SP', latitude: -21.21, longitude: -50.43 },
  { codigo_ibge: '3527108', municipio: 'Lins', uf: 'SP', latitude: -21.67, longitude: -49.74 },
  { codigo_ibge: '3541406', municipio: 'Presidente Prudente', uf: 'SP', latitude: -22.13, longitude: -51.39 },
  { codigo_ibge: '3538709', municipio: 'Piracicaba', uf: 'SP', latitude: -22.73, longitude: -47.65 },
  { codigo_ibge: '3509502', municipio: 'Campinas', uf: 'SP', latitude: -22.91, longitude: -47.06 }
];

/** O que "os mapas" dizem do talhão no mock, já aplicando a correção do produtor. */
export function montarTalhaoMock(correcoes: CorrecoesTalhao, geada: RiscoGeada | null = GEADA_SJRP): CaracteristicasTalhao {
  return {
    textura_solo: correcoes.textura_solo ?? 'arenosa',
    fonte_textura: correcoes.textura_solo ? 'informado_produtor' : 'mapas',
    relevo: correcoes.relevo ?? 'suave_ondulado',
    fonte_relevo: correcoes.relevo ? 'informado_produtor' : 'mapas',
    declividade_pct: correcoes.relevo ? null : 5,
    risco_erosao: 'alto',
    risco_seca: 'medio',
    risco_geada: geada?.nivel ?? null,
    bases: ['SRTM', 'SoilGrids', 'NASA POWER', 'MODIS']
  };
}

export const ANALISE_MOCK: Omit<Analise, 'descricao_local' | 'talhao'> = {
  analise_id: 'mock-0001',
  eh_mock: true,
  geada: GEADA_SJRP,
  estresse_termico: CALOR_SJRP,
  precipitacao_extrema: PRECIPITACAO_EXTREMA_SJRP,
  tendencia_hidrica: TENDENCIA_SJRP,
  estresse_vegetal: ESTRESSE_SJRP,
  fonte_clima: {
    fonte_id: 'nasa_power',
    nome: 'NASA POWER',
    tipo_dado: 'observacao_historica',
    periodo_inicio: '1991-01-01',
    periodo_fim: '2024-12-31'
  },
  clima_mensal: [
    { mes: 1, precipitacao_acumulada_mm: 250, umidade_solo: 0.7 },
    { mes: 2, precipitacao_acumulada_mm: 190, umidade_solo: 0.71 },
    { mes: 3, precipitacao_acumulada_mm: 160, umidade_solo: 0.66 },
    { mes: 4, precipitacao_acumulada_mm: 70, umidade_solo: 0.55 },
    { mes: 5, precipitacao_acumulada_mm: 45, umidade_solo: 0.45 },
    { mes: 6, precipitacao_acumulada_mm: 15, umidade_solo: 0.38 },
    { mes: 7, precipitacao_acumulada_mm: 10, umidade_solo: 0.32 },
    { mes: 8, precipitacao_acumulada_mm: 20, umidade_solo: 0.28 },
    { mes: 9, precipitacao_acumulada_mm: 50, umidade_solo: 0.3 },
    { mes: 10, precipitacao_acumulada_mm: 110, umidade_solo: 0.4 },
    { mes: 11, precipitacao_acumulada_mm: 160, umidade_solo: 0.52 },
    { mes: 12, precipitacao_acumulada_mm: 230, umidade_solo: 0.63 }
  ],
  // Caminhos: vêm do catálogo do backend (data/processed/estrategias/catalogo_reforma_cana.json),
  // escolhidos pelo motor de decisão conforme as prioridades. Ver ./montarEstrategias.ts.
  estrategias: ESTRATEGIAS_PADRAO,
  limitacoes: [
    'Os dados de satélite mostram a média de uma área de vários quilômetros, não o seu talhão exato.',
    'A chuva mostrada é a média dos anos passados. Um ano pode fugir bastante da média.',
    'A ferramenta não visitou o talhão: não conhece a análise de solo, os terraços nem o histórico de pragas.',
    'Preço e mercado mudam a cada safra e não entram no cálculo.'
  ]
};
