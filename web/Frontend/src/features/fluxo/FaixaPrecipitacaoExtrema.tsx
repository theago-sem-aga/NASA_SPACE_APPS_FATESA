import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import type { RiscoPrecipitacaoExtrema } from '../../api/tipos';
import { Pictograma } from '../../components/Pictograma';
import { localeAtual, tx } from '../../i18n/idioma';

const mm = (v: number) => `${v.toLocaleString(localeAtual(), { maximumFractionDigits: 1 })} mm`;

/** Frase curta da precipitação extrema, também usada na narração e na impressão. */
export function fraseChuvaExtrema(p: RiscoPrecipitacaoExtrema): string {
  if (p.dias_chuva_extrema_30d === 0) {
    return tx(
      `Nos últimos 30 dias, a chuva ficou dentro do normal para a época — nenhum dia passou de ${mm(p.limiar_chuva_extrema_mm_dia)}, o valor raro para este mês.`,
      `In the last 30 days, rain was within normal for the season — no day went above ${mm(p.limiar_chuva_extrema_mm_dia)}, the rare value for this month.`
    );
  }
  const dias =
    p.dias_chuva_extrema_30d === 1 ? tx('1 dia teve', '1 day had') : tx(`${p.dias_chuva_extrema_30d} dias tiveram`, `${p.dias_chuva_extrema_30d} days had`);
  return tx(
    `Nos últimos 30 dias, ${dias} chuva acima de ${mm(p.limiar_chuva_extrema_mm_dia)} — valor raro para este mês, histórico da NASA POWER.`,
    `In the last 30 days, ${dias} rain above ${mm(p.limiar_chuva_extrema_mm_dia)} — a rare value for this month, NASA POWER history.`
  );
}

/**
 * Quantos dos últimos 30 dias tiveram chuva extrema (acima do percentil 95
 * histórico do mesmo mês). Só exibe o que veio da API
 * (app/modelos/precipitacao_extrema.py); não aplica regra própria.
 */
export function FaixaPrecipitacaoExtrema({ precipitacaoExtrema: p }: { precipitacaoExtrema: RiscoPrecipitacaoExtrema }) {
  const comRisco = p.dias_chuva_extrema_30d > 0;
  return (
    <div className={`faixa-chuva-extrema${comRisco ? ' com-risco' : ''}`}>
      <span className="faixa-chuva-extrema-icone" aria-hidden="true">
        <Pictograma nome="chuva" tamanho={36} />
      </span>
      <div>
        <p className="faixa-chuva-extrema-frase">{fraseChuvaExtrema(p)}</p>
        <SeloFonte fonte={p.fonte} />
        <details className="como-ler">
          <summary>{tx('Como ler este dado', 'How to read this')}</summary>
          <p className="termos-relacionados">{tx('Palavras deste quadro:', 'Words in this box:')} <Termo id="chuva_extrema" /></p>
          <p className="texto-apoio faixa-chuva-extrema-legenda">
            {tx(
              `Limiar = chuva diária que só ocorre em 1 de cada 20 dias daquele mês, pelo histórico da NASA POWER até ${p.data_referencia.split('-').reverse().slice(0, 2).join('/')}. Grade regional, não é pluviômetro no talhão.`,
              `Threshold = daily rain that happens on only 1 in every 20 days of that month, in the NASA POWER history up to ${p.data_referencia}. Regional grid, not a rain gauge in your field.`
            )}
          </p>
        </details>
      </div>
    </div>
  );
}
