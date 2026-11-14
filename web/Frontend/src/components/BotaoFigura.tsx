import type { ReactNode } from 'react';
import { Pictograma, type NomePictograma } from './Pictograma';

interface BotaoFiguraProps {
  pictograma?: NomePictograma;
  /** Símbolo grande no lugar do pictograma (✓, ✕, ?), para respostas sim/não. */
  simbolo?: { texto: string; tom: 'sim' | 'nao' | 'talvez' };
  titulo: ReactNode;
  detalhe?: ReactNode;
  selo?: string;
  escolhido: boolean;
  aoTocar: () => void;
}

/**
 * Escolha de toque único: botão grande com figura. Usado nas telas de uma pergunta
 * só, em que tocar já responde e avança (um rádio avançaria ao usar as setas do teclado).
 */
export function BotaoFigura({ pictograma, simbolo, titulo, detalhe, selo, escolhido, aoTocar }: BotaoFiguraProps) {
  return (
    <button type="button" className="cartao-escolha botao-figura" aria-pressed={escolhido} onClick={aoTocar}>
      <span className="cartao-escolha-marca" aria-hidden="true">✓</span>
      {pictograma && <Pictograma nome={pictograma} tamanho={64} />}
      {simbolo && <span className={`simbolo-resposta simbolo-${simbolo.tom}`} aria-hidden="true">{simbolo.texto}</span>}
      <span className="cartao-escolha-titulo">{titulo}</span>
      {detalhe && <span className="cartao-escolha-detalhe">{detalhe}</span>}
      {selo && <span className="etiqueta etiqueta-neutra">{selo}</span>}
    </button>
  );
}
