// GERADO por web/Backend/app/services/precipitacao_extrema.py (resumo_precipitacao_extrema)
// -- nao editar a mao.
// Numeros REAIS da NASA POWER (precipitacao diaria), congelados em 2026-11-14:
// Sao Jose do Rio Preto (celula -209_-494, cache local 1995-2026) e Fresno (36.6, -119.7, cache local 1995-2026).
// Para ver Fresno no mock: ?simular=geada (mesmo recorte piloto, mesma celula local)
import type { RiscoPrecipitacaoExtrema } from '../tipos';

export const PRECIPITACAO_EXTREMA_SJRP: RiscoPrecipitacaoExtrema = {
  dias_chuva_extrema_30d: 0,
  limiar_chuva_extrema_mm_dia: 19.69,
  data_referencia: '2026-11-11',
  metodo: 'percentil 95 da chuva diária do mesmo mês (histórico 1995-01-01 a 2026-11-11)',
  fonte: 'nasa_power',
  variavel: 'precipitacao_acumulada_mm',
  tipo_acesso: 'pre_processado',
};

export const PRECIPITACAO_EXTREMA_FRESNO: RiscoPrecipitacaoExtrema = {
  dias_chuva_extrema_30d: 3,
  limiar_chuva_extrema_mm_dia: 8.0,
  data_referencia: '2026-11-11',
  metodo: 'percentil 95 da chuva diária do mesmo mês (histórico 1995-01-01 a 2026-11-11)',
  fonte: 'nasa_power',
  variavel: 'precipitacao_acumulada_mm',
  tipo_acesso: 'pre_processado',
};
