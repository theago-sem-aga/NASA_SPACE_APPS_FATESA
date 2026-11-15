import { useEffect, useRef } from 'react';
import { GLOSSARIO } from '../accessibility/glossario';
import { tx } from '../i18n/idioma';
import { useNarracao } from '../accessibility/useNarracao';
import { Icone } from './Icone';

/** Glossário inteiro numa janela, aberta pelo rodapé de qualquer tela. */
export function GlossarioDialogo({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const narracao = useNarracao();
  const pararRef = useRef(narracao.parar);
  pararRef.current = narracao.parar;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    else if (!aberto && d.open) {
      d.close();
      pararRef.current(); // só ao fechar: não corta a narração das telas
    }
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
        <h2 id="glossario-titulo">{tx('Glossário', 'Glossary')}</h2>
        {narracao.suportado && (
          <button
            type="button"
            className="glossario-ouvir"
            aria-pressed={narracao.falando}
            onClick={() =>
              narracao.falando
                ? narracao.parar()
                : narracao.falar(
                    `${tx('Glossário. As palavras da NASA e do campo, em linguagem simples.', 'Glossary. NASA and farm words, in plain language.')} ${itens.map(i => `${i.termo}. ${i.texto}`).join(' ')}`
                  )
            }
          >
            <Icone nome={narracao.falando ? 'parar' : 'ouvir'} tamanho={20} />
            {narracao.falando ? tx('Parar', 'Stop') : tx('Ouvir', 'Listen')}
          </button>
        )}
        <button type="button" className="glossario-fechar" onClick={aoFechar} aria-label={tx('Fechar o glossário', 'Close the glossary')}>
          ✕
        </button>
      </div>
      <p className="glossario-intro">{tx('As palavras da NASA e do campo que aparecem no site, em linguagem simples.', 'NASA and farm words used on the site, in plain language.')}</p>
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
