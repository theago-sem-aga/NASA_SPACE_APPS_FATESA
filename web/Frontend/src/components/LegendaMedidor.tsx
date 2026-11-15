import { tx } from '../i18n/idioma';
/**
 * Legenda única dos tracinhos (Medidor), igual em todas as telas:
 * Lado a lado, Todos os pontos e o resumo.
 */
export function LegendaMedidor({ menosEhMelhor = false }: { menosEhMelhor?: boolean }) {
  return (
    <p className="resumo-legenda">
      <span className="medidor medidor-bom"><span className="medidor-tracos" aria-hidden="true"><span className="cheio" /><span className="cheio" /><span /></span></span>
      <span>{tx('verde = bom para você', 'green = good for you')}</span>
      <span className="medidor medidor-atencao"><span className="medidor-tracos" aria-hidden="true"><span className="cheio" /><span className="cheio" /><span /></span></span>
      <span>{tx('laranja = ponto de atenção', 'orange = watch point')}</span>
      <span className="resumo-legenda-nota">
        {tx('Mais tracinhos = mais forte.', 'More dashes = stronger.')}
        {menosEhMelhor && (
          <>
            {' '}
            {tx('Em', 'For')} <strong>{tx('Gasta água', 'Uses water')}</strong> {tx('e', 'and')} <strong>{tx('Dá trabalho e gasto', 'Work and cost')}</strong>
            {tx(', menos é melhor.', ', less is better.')}
          </>
        )}
      </span>
    </p>
  );
}
