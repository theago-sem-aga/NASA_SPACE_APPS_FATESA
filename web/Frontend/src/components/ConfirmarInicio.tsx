import { useEffect, useRef } from 'react';
import { tx } from '../i18n/idioma';

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
      <h2 id="confirmar-inicio-titulo">{tx('Voltar ao menu inicial?', 'Go back to the start?')}</h2>
      <p id="confirmar-inicio-texto">
        {tx(
          'As respostas que você deu até aqui (cidade, lavoura, problemas e prioridades)',
          'The answers you gave so far (town, crop, problems and priorities)'
        )}{' '}
        <strong>{tx('serão perdidas', 'will be lost')}</strong>
        {tx(', e você vai começar de novo.', ', and you will start over.')}
      </p>
      <div className="confirmar-inicio-botoes">
        <button type="button" className="botao confirmar-inicio-sair" onClick={aoConfirmar}>
          {tx('Sim, voltar ao menu inicial', 'Yes, go back to the start')}
        </button>
        <button ref={ficar} type="button" className="botao botao-primario" onClick={aoCancelar}>
          {tx('Continuar aqui', 'Stay here')}
        </button>
      </div>
    </dialog>
  );
}
