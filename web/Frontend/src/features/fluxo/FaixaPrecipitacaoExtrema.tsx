import { SeloFonte } from '../../components/SeloFonte';
import type { RiscoPrecipitacaoExtrema } from '../../api/tipos';
import { Pictograma } from '../../components/Pictograma';

const mm = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm`;

/** Frase curta da precipitação extrema, também usada na narração e na impressão. */
export function fraseChuvaExtrema(p: RiscoPrecipitacaoExtrema): string {
  if (p.dias_chuva_extrema_30d === 0) {
    return `Nos últimos 30 dias, a chuva ficou dentro do normal para a época — nenhum dia passou de ${mm(p.limiar_chuva_extrema_mm_dia)}, o valor raro para este mês.`;
  }
  const dias = p.dias_chuva_extrema_30d === 1 ? '1 dia teve' : `${p.dias_chuva_extrema_30d} dias tiveram`;
  return `Nos últimos 30 dias, ${dias} chuva acima de ${mm(p.limiar_chuva_extrema_mm_dia)} — valor raro para este mês, histórico da NASA POWER.`;
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
          <summary>Como ler este dado</summary>
          <p className="texto-apoio faixa-chuva-extrema-legenda">
            Limiar = chuva diária que só ocorre em 1 de cada 20 dias daquele mês, pelo histórico da NASA POWER
            até {p.data_referencia.split('-').reverse().slice(0, 2).join('/')}. Grade regional, não é pluviômetro no talhão.
          </p>
        </details>
      </div>
    </div>
  );
}
