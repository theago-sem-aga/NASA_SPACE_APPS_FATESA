/**
 * Legenda única dos tracinhos (Medidor), igual em todas as telas:
 * Lado a lado, Todos os pontos e o resumo.
 */
export function LegendaMedidor({ menosEhMelhor = false }: { menosEhMelhor?: boolean }) {
  return (
    <p className="resumo-legenda">
      <span className="medidor medidor-bom"><span className="medidor-tracos" aria-hidden="true"><span className="cheio" /><span className="cheio" /><span /></span></span>
      <span>verde = bom para você</span>
      <span className="medidor medidor-atencao"><span className="medidor-tracos" aria-hidden="true"><span className="cheio" /><span className="cheio" /><span /></span></span>
      <span>laranja = ponto de atenção</span>
      <span className="resumo-legenda-nota">
        Mais tracinhos = mais forte.
        {menosEhMelhor && (
          <>
            {' '}Em <strong>Gasta água</strong> e <strong>Dá trabalho e gasto</strong>, menos é melhor.
          </>
        )}
      </span>
    </p>
  );
}
