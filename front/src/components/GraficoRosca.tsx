/** Rosca simples: mostra uma parte do todo (ex.: % da chuva do ano que cai com a terra descoberta). */
export function GraficoRosca({ percentual, cor, tamanho = 120 }: { percentual: number; cor: string; tamanho?: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percentual));
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true" className="grafico-rosca">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#dfe6f0" strokeWidth="14" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={cor}
        strokeWidth="14"
        strokeDasharray={`${(p / 100) * circ} ${circ}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1c241e" fontFamily="sans-serif">{p}%</text>
    </svg>
  );
}
