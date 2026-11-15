import { useEffect, useRef } from 'react';
import { GALERIA_INICIO, IMAGENS, type ImagemCreditada } from './imagens';

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
        <h2 id="creditos-titulo">Créditos das fotos</h2>
        <button type="button" className="glossario-fechar" onClick={aoFechar} aria-label="Fechar os créditos das fotos">
          ✕
        </button>
      </div>
      <p className="glossario-intro">
        Fotos com licença livre, obtidas no Wikimedia Commons em 14/11/2026 e só reduzidas de tamanho.
      </p>
      <ul className="creditos-lista">
        {fotos.map(f => (
          <li key={f.src}>
            <img src={f.src} alt="" loading="lazy" className="creditos-miniatura" />
            <div>
              <p className="creditos-descricao">{f.legenda ?? f.alt}</p>
              <p className="creditos-dados">
                <strong>Autor:</strong> {f.credito} · <strong>Licença:</strong> {f.licenca}
              </p>
              <a href={f.url_origem} target="_blank" rel="noopener noreferrer">
                Ver a foto original
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="glossario-intro creditos-nota">
        <strong>Fotos de satélite da sua área:</strong> dados Copernicus Sentinel-2 (ESA), modificados pela equipe (recorte, cor e
        marcação da área). Uso livre com atribuição.
      </p>
    </dialog>
  );
}
