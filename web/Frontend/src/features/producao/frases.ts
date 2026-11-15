// Textos curtos da tela de colheita. O front não decide nada: só traduz o que a API mandou.
import type { ChuvaDoMes, ClimaAno, SituacaoColheita, Tendencia } from '../../api/tipos';

export const FRASE_COLHEITA: Record<SituacaoColheita, string> = {
  acima: 'Colheu mais que o normal',
  normal: 'Colheu o normal',
  abaixo: 'Colheu menos que o normal',
  sem_plantio: 'Não plantaram este ano'
};

export const FRASE_CHUVA: Record<ClimaAno['situacao_chuva'], string> = {
  pouca: 'Choveu pouco',
  normal: 'Choveu o normal',
  muita: 'Choveu muito'
};

const mm = (n: number) => `${Math.round(n).toLocaleString('pt-BR')} mm`;

/**
 * A chuva do ano comparada com o normal, em milímetros e porcentagem.
 * Ex.: "Choveu 699 mm no ano; o normal é 1.177 mm (média de 1995 a 2024). Faltaram 478 mm, 41% a menos."
 */
export function fraseChuvaAno(c: ClimaAno): string {
  const periodo = c.periodo_normal.replace('-', ' a ');
  const base = `Choveu ${mm(c.chuva_mm)} no ano; o normal é ${mm(c.chuva_normal_mm)} (média de ${periodo}).`;
  const diferenca = c.chuva_mm - c.chuva_normal_mm;
  const pct = c.chuva_normal_mm > 0 ? Math.round((Math.abs(diferenca) / c.chuva_normal_mm) * 100) : 0;
  if (c.situacao_chuva === 'pouca') return `${base} Faltaram ${mm(-diferenca)}, ${pct}% a menos.`;
  if (c.situacao_chuva === 'muita') return `${base} Choveu ${mm(diferenca)} a mais, ${pct}% acima do normal.`;
  return `${base} Ficou perto do normal (${pct}% de diferença).`;
}

const grauC = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`;

export function fraseCalor(c: ClimaAno): { titulo: string; detalhe: string } {
  const g = Math.abs(c.graus_de_diferenca);
  const graus = g === 1 ? '1 grau' : `${g} graus`;
  const medidas = `A máxima média do dia foi ${grauC(c.tmax_c)}; o normal é ${grauC(c.tmax_normal_c)}`;
  if (c.situacao_calor === 'mais_quente') return { titulo: 'Fez mais calor', detalhe: `${medidas}, ${graus} a mais` };
  if (c.situacao_calor === 'mais_frio') return { titulo: 'Fez mais frio', detalhe: `${medidas}, ${graus} a menos` };
  return { titulo: 'Calor normal', detalhe: `${medidas}, igual aos outros anos` };
}

export const FRASE_PREVISAO_CHUVA: Record<Tendencia, string> = {
  acima: 'Deve chover mais que o normal',
  normal: 'Deve chover o normal',
  abaixo: 'Deve chover menos que o normal'
};

export const FRASE_PREVISAO_CALOR: Record<Tendencia, string> = {
  acima: 'Deve fazer mais calor que o normal',
  normal: 'O calor deve ficar normal',
  abaixo: 'Deve fazer menos calor que o normal'
};

export const FRASE_CHUVA_MES: Record<ChuvaDoMes, string> = {
  irregular: 'Chuva ainda falha',
  melhora: 'Chuva melhora',
  normal: 'Chuva normal',
  excesso: 'Pode sobrar água'
};
