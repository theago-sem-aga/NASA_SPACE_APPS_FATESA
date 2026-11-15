import { useEffect, useRef } from 'react';

/**
 * Pergunta antes de voltar ao início: avisa que as respostas serão perdidas.
 * Usa <dialog> nativo (prende o foco, fecha com Esc). O foco começa em "Continuar aqui",
 * para que um Enter sem querer não apague nada.
 */
export function ConfirmarInicio({ aberto, aoConfirmar, aoCancelar }: { aberto: boolean; aoConfirmar: () => void; aoCancelar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const ficar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) {
      d.showModal();
      ficar.current?.focus();
    } else if (!aberto && d.open) {
      d.close();
    }
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className="confirmar-inicio"
      aria-labelledby="confirmar-inicio-titulo"
      aria-describedby="confirmar-inicio-texto"
      onCancel={e => {
        e.preventDefault();
        aoCancelar();
      }}
      onClick={e => {
        if (e.target === ref.current) aoCancelar();
      }}
    >
      <h2 id="confirmar-inicio-titulo">Voltar ao menu inicial?</h2>
      <p id="confirmar-inicio-texto">
        As respostas que você deu até aqui (cidade, lavoura, problemas e prioridades) <strong>serão perdidas</strong>, e você vai
        começar de novo.
      </p>
      <div className="confirmar-inicio-botoes">
        <button type="button" className="botao confirmar-inicio-sair" onClick={aoConfirmar}>
          Sim, voltar ao menu inicial
        </button>
        <button ref={ficar} type="button" className="botao botao-primario" onClick={aoCancelar}>
          Continuar aqui
        </button>
      </div>
    </dialog>
  );
}
