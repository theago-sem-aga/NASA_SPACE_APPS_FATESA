// Textos curtos da tela de colheita. O front não decide nada: só traduz o que a API mandou.
import type { ChuvaDoMes, ClimaAno, SituacaoColheita, Tendencia } from '../../api/tipos';
import { diferencaTemperatura, temperatura, L, localeAtual, traduzivel, tx } from '../../i18n/idioma';

export const FRASE_COLHEITA: Record<SituacaoColheita, string> = traduzivel({
  acima: L('Colheu mais que o normal', 'Harvested more than normal'),
  normal: L('Colheu o normal', 'Normal harvest'),
  abaixo: L('Colheu menos que o normal', 'Harvested less than normal'),
  sem_plantio: L('Não plantaram este ano', 'Not planted this year')
});

export const FRASE_CHUVA: Record<ClimaAno['situacao_chuva'], string> = traduzivel({
  pouca: L('Choveu pouco', 'Little rain'),
  normal: L('Choveu o normal', 'Normal rain'),
  muita: L('Choveu muito', 'A lot of rain')
});

const mm = (n: number) => `${Math.round(n).toLocaleString(localeAtual())} mm`;

/**
 * A chuva do ano comparada com o normal, em milímetros e porcentagem.
 * Ex.: "Choveu 699 mm no ano; o normal é 1.177 mm (média de 1995 a 2024). Faltaram 478 mm, 41% a menos."
 */
export function fraseChuvaAno(c: ClimaAno): string {
  const periodo = c.periodo_normal.replace('-', tx(' a ', ' to '));
  const base = tx(
    `Choveu ${mm(c.chuva_mm)} no ano; o normal é ${mm(c.chuva_normal_mm)} (média de ${periodo}).`,
    `${mm(c.chuva_mm)} of rain in the year; normal is ${mm(c.chuva_normal_mm)} (average from ${periodo}).`
  );
  const diferenca = c.chuva_mm - c.chuva_normal_mm;
  const pct = c.chuva_normal_mm > 0 ? Math.round((Math.abs(diferenca) / c.chuva_normal_mm) * 100) : 0;
  if (c.situacao_chuva === 'pouca') return tx(`${base} Faltaram ${mm(-diferenca)}, ${pct}% a menos.`, `${base} ${mm(-diferenca)} short, ${pct}% less.`);
  if (c.situacao_chuva === 'muita') return tx(`${base} Choveu ${mm(diferenca)} a mais, ${pct}% acima do normal.`, `${base} ${mm(diferenca)} more, ${pct}% above normal.`);
  return tx(`${base} Ficou perto do normal (${pct}% de diferença).`, `${base} Close to normal (${pct}% difference).`);
}

const grauC = temperatura;

export function fraseCalor(c: ClimaAno): { titulo: string; detalhe: string } {
  const g = Math.abs(c.graus_de_diferenca);
  const graus = diferencaTemperatura(g);
  const medidas = tx(
    `A máxima média do dia foi ${grauC(c.tmax_c)}; o normal é ${grauC(c.tmax_normal_c)}`,
    `The average daily high was ${grauC(c.tmax_c)}; normal is ${grauC(c.tmax_normal_c)}`
  );
  if (c.situacao_calor === 'mais_quente') return { titulo: tx('Fez mais calor', 'Hotter'), detalhe: tx(`${medidas}, ${graus} a mais`, `${medidas}, ${graus} higher`) };
  if (c.situacao_calor === 'mais_frio') return { titulo: tx('Fez mais frio', 'Cooler'), detalhe: tx(`${medidas}, ${graus} a menos`, `${medidas}, ${graus} lower`) };
  return { titulo: tx('Calor normal', 'Normal heat'), detalhe: tx(`${medidas}, igual aos outros anos`, `${medidas}, same as other years`) };
}

export const FRASE_PREVISAO_CHUVA: Record<Tendencia, string> = traduzivel({
  acima: L('Deve chover mais que o normal', 'Likely more rain than normal'),
  normal: L('Deve chover o normal', 'Likely normal rain'),
  abaixo: L('Deve chover menos que o normal', 'Likely less rain than normal')
});

export const FRASE_PREVISAO_CALOR: Record<Tendencia, string> = traduzivel({
  acima: L('Deve fazer mais calor que o normal', 'Likely hotter than normal'),
  normal: L('O calor deve ficar normal', 'Heat likely normal'),
  abaixo: L('Deve fazer menos calor que o normal', 'Likely cooler than normal')
});

export const FRASE_CHUVA_MES: Record<ChuvaDoMes, string> = traduzivel({
  irregular: L('Chuva ainda falha', 'Rain still patchy'),
  melhora: L('Chuva melhora', 'Rain improves'),
  normal: L('Chuva normal', 'Normal rain'),
  excesso: L('Pode sobrar água', 'Possible excess water')
});
