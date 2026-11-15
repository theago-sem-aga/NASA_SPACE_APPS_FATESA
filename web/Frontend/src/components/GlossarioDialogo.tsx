import { useEffect, useRef } from 'react';
import { GLOSSARIO } from '../accessibility/glossario';

/** Glossário inteiro numa janela, aberta pelo rodapé de qualquer tela. */
export function GlossarioDialogo({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    else if (!aberto && d.open) d.close();
  }, [aberto]);

  const itens = Object.values(GLOSSARIO).slice().sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'));
  return (
    <dialog
      ref={ref}
      className="glossario-dialogo"
      aria-labelledby="glossario-titulo"
      onCancel={e => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={e => {
        if (e.target === ref.current) aoFechar();
      }}
    >
      <div className="glossario-cabeca">
        <h2 id="glossario-titulo">Glossário</h2>
        <button type="button" className="glossario-fechar" onClick={aoFechar} aria-label="Fechar o glossário">
          ✕
        </button>
      </div>
      <p className="glossario-intro">As palavras da NASA e do campo que aparecem no site, em linguagem simples.</p>
      <dl className="glossario-lista">
        {itens.map(i => (
          <div key={i.termo}>
            <dt>{i.termo}</dt>
            <dd>{i.texto}</dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
