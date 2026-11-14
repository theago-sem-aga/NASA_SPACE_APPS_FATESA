import type { ReactNode } from 'react';
import { Icone, type NomeIcone } from './Icone';

interface SanfonaProps {
  icone: NomeIcone;
  titulo: string;
  /** Número pequeno ao lado do título (ex.: quantos itens tem dentro). */
  contagem?: number;
  children: ReactNode;
}

/**
 * Seção que abre e fecha. Guarda o detalhe para quem quiser ver, sem obrigar
 * todo mundo a rolar. Usa <details>, que funciona com teclado e leitor de tela.
 */
export function Sanfona({ icone, titulo, contagem, children }: SanfonaProps) {
  return (
    <details className="sanfona">
      <summary>
        <Icone nome={icone} tamanho={22} />
        <span className="sanfona-titulo">{titulo}</span>
        {contagem !== undefined && <span className="sanfona-contagem">{contagem}</span>}
        <span className="sanfona-seta" aria-hidden="true" />
      </summary>
      <div className="sanfona-corpo">{children}</div>
    </details>
  );
}
