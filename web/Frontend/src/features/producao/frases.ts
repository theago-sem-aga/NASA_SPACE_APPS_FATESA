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

export function fraseCalor(c: ClimaAno): { titulo: string; detalhe: string } {
  const g = Math.abs(c.graus_de_diferenca);
  const graus = g === 1 ? '1 grau' : `${g} graus`;
  if (c.situacao_calor === 'mais_quente') return { titulo: 'Fez mais calor', detalhe: `A tarde ficou ${graus} mais quente que o normal` };
  if (c.situacao_calor === 'mais_frio') return { titulo: 'Fez mais frio', detalhe: `A tarde ficou ${graus} mais fria que o normal` };
  return { titulo: 'Calor normal', detalhe: 'Igual aos outros anos' };
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
