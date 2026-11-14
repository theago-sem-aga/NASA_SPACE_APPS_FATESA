import type { ImagemCreditada } from './imagens';

interface FotoProps {
  imagem: ImagemCreditada;
  legenda?: string;
  classe?: string;
}

export function Foto({ imagem, legenda, classe = '' }: FotoProps) {
  return (
    <figure className={`foto ${classe}`}>
      <img src={imagem.src} alt={imagem.alt} loading="lazy" decoding="async" />
      <figcaption>
        {legenda && <span className="foto-legenda">{legenda}</span>}
        <span className="foto-credito">
          Foto: <a href={imagem.url_origem} target="_blank" rel="noreferrer">{imagem.credito}</a> · {imagem.licenca}
        </span>
      </figcaption>
    </figure>
  );
}
