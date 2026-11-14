// Textos curtos da tela de colheita. O front não decide nada: só traduz o que a API mandou.
import type { ClimaAno, SituacaoColheita } from '../../api/tipos';

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

export function fraseCenario(sacos: number | null): string {
  if (sacos === null) return 'Ainda não sabemos';
  if (sacos === 0) return 'Colhe o normal';
  return sacos < 0 ? `De 100 sacos, perde uns ${-sacos}` : `De 100 sacos, ganha uns ${sacos}`;
}

