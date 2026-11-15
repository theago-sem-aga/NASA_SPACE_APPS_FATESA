import { useEffect, useRef } from 'react';
import { GALERIA_INICIO, IMAGENS, type ImagemCreditada } from './imagens';
import { tx } from '../i18n/idioma';

/**
 * Créditos das fotos numa janela, aberta pelo rodapé (antes abria o CREDITOS.md cru).
 * Lista as imagens que o site usa, sem repetir, com autor, licença e link do original.
 */
export function CreditosDialogo({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    else if (!aberto && d.open) d.close();
  }, [aberto]);

  const vistas = new Set<string>();
  const fotos: (ImagemCreditada & { legenda?: string })[] = [...GALERIA_INICIO, ...Object.values(IMAGENS)].filter(f => {
    if (vistas.has(f.src)) return false;
    vistas.add(f.src);
    return true;
  });

  return (
    <dialog
      ref={ref}
      className="glossario-dialogo creditos-dialogo"
      aria-labelledby="creditos-titulo"
      onCancel={e => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={e => {
        if (e.target === ref.current) aoFechar();
      }}
    >
      <div className="glossario-cabeca">
        <h2 id="creditos-titulo">{tx('Créditos das fotos', 'Photo credits')}</h2>
        <button type="button" className="glossario-fechar" onClick={aoFechar} aria-label={tx('Fechar os créditos das fotos', 'Close the photo credits')}>
          ✕
        </button>
      </div>
      <p className="glossario-intro">
        {tx(
          'Fotos com licença livre, obtidas no Wikimedia Commons em 14/11/2026 e só reduzidas de tamanho.',
          'Freely licensed photos, taken from Wikimedia Commons on Nov 14, 2026, and only resized.'
        )}
      </p>
      <ul className="creditos-lista">
        {fotos.map(f => (
          <li key={f.src}>
            <img src={f.src} alt="" loading="lazy" className="creditos-miniatura" />
            <div>
              <p className="creditos-descricao">{f.legenda ?? f.alt}</p>
              <p className="creditos-dados">
                <strong>{tx('Autor:', 'Author:')}</strong> {f.credito} · <strong>{tx('Licença:', 'License:')}</strong> {f.licenca}
              </p>
              <a href={f.url_origem} target="_blank" rel="noopener noreferrer">
                {tx('Ver a foto original', 'See the original photo')}
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="glossario-intro creditos-nota">
        <strong>{tx('Fotos de satélite da sua área:', 'Satellite images of your field:')}</strong>{' '}
        {tx(
          'dados Copernicus Sentinel-2 (ESA), modificados pela equipe (recorte, cor e marcação da área). Uso livre com atribuição.',
          'Copernicus Sentinel-2 data (ESA), modified by the team (cropping, color and field marking). Free to use with attribution.'
        )}
      </p>
    </dialog>
  );
}
