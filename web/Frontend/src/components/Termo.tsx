import { useId, useState, type ReactNode } from 'react';
import { GLOSSARIO, type TermoId } from '../accessibility/glossario';

/** Palavra técnica com botão "?" que abre uma explicação curta logo abaixo. Funciona por toque, mouse e teclado. */
export function Termo({ id, children }: { id: TermoId; children?: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const idExplicacao = useId();
  const item = GLOSSARIO[id];
  return (
    <span className="termo">
      <span className="termo-palavra">{children ?? item.termo}</span>
      <button
        type="button"
        className="termo-botao"
        aria-expanded={aberto}
        aria-controls={idExplicacao}
        aria-label={`O que é ${item.termo.toLowerCase()}?`}
        onClick={() => setAberto(a => !a)}
      >
        ?
      </button>
      <span id={idExplicacao} className="termo-explicacao" hidden={!aberto}>
        <strong>{item.termo}:</strong> {item.texto}
      </span>
    </span>
  );
}
