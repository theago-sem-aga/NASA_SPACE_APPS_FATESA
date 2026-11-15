/**
 * Ícones animados do clima, só com SVG e CSS (sem biblioteca):
 *  - chuva: nuvem com gotas caindo;
 *  - geada: flocos de neve caindo e girando;
 *  - calor: sol com os raios pulsando.
 * Com "reduzir movimento" ligado no aparelho, ficam parados (ver estilos.css).
 */
export type Animacao = 'chuva' | 'geada' | 'calor';

function Floco({ x, atraso }: { x: number; atraso: string }) {
  return (
    <g className="anim-floco" style={{ animationDelay: atraso }}>
      <g transform={`translate(${x} 0)`}>
        <path d="M0 -4V4M-3.5 -2L3.5 2M-3.5 2L3.5 -2" />
      </g>
    </g>
  );
}

export function IconeAnimado({ tipo, tamanho = 40 }: { tipo: Animacao; tamanho?: number }) {
  return (
    <svg className={`icone-animado anim-${tipo}`} width={tamanho} height={tamanho} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {tipo === 'chuva' && (
        <>
          <g className="anim-gotas">
            <line className="anim-gota" x1="13" y1="24" x2="11" y2="29" style={{ animationDelay: '0s' }} />
            <line className="anim-gota" x1="20" y1="24" x2="18" y2="29" style={{ animationDelay: '0.35s' }} />
            <line className="anim-gota" x1="27" y1="24" x2="25" y2="29" style={{ animationDelay: '0.7s' }} />
          </g>
          <path className="anim-nuvem" d="M12 22a6 6 0 0 1 1-11.9A8 8 0 0 1 28.5 12 5 5 0 0 1 28 22z" />
        </>
      )}
      {tipo === 'geada' && (
        <g transform="translate(0 0)">
          <Floco x={10} atraso="0s" />
          <Floco x={20} atraso="0.9s" />
          <Floco x={30} atraso="1.8s" />
        </g>
      )}
      {tipo === 'calor' && (
        <g transform="translate(20 20)">
          <g className="anim-raios">
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1="0" y1="-12" x2="0" y2="-17" transform={`rotate(${i * 45})`} />
            ))}
          </g>
          <circle className="anim-sol" r="8" />
        </g>
      )}
    </svg>
  );
}
