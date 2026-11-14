import type { Nivel } from '../api/tipos';
import { ROTULO_NIVEL } from '../features/fluxo/rotulos';

const VALOR_NIVEL: Record<Nivel, number> = { nenhum: 0, baixo: 1, medio: 2, alto: 3 };

/** Três tracinhos preenchidos conforme o nível, mais a palavra (não depende só de cor). */
export function Medidor({ nivel, bom, grande = false }: { nivel: Nivel; bom: boolean; grande?: boolean }) {
  const v = VALOR_NIVEL[nivel];
  const tom = v === 0 ? 'neutro' : bom ? 'bom' : 'atencao';
  return (
    <span className={`medidor medidor-${tom} ${grande ? 'medidor-grande' : ''}`}>
      <span className="medidor-tracos" aria-hidden="true">
        {[1, 2, 3].map(i => <span key={i} className={i <= v ? 'cheio' : ''} />)}
      </span>
      <span>{ROTULO_NIVEL[nivel]}</span>
    </span>
  );
}
