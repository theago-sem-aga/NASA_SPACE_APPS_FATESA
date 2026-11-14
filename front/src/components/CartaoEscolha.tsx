import type { ReactNode } from 'react';
import { Pictograma, type NomePictograma } from './Pictograma';

interface CartaoEscolhaProps {
  tipo: 'radio' | 'checkbox';
  nomeGrupo?: string;
  marcado: boolean;
  desabilitado?: boolean;
  pictograma: NomePictograma;
  titulo: ReactNode;
  detalhe?: ReactNode;
  selo?: string;
  aoMudar: () => void;
}

/** Opção grande com imagem + palavra: dá para escolher só olhando o desenho. */
export function CartaoEscolha({ tipo, nomeGrupo, marcado, desabilitado, pictograma, titulo, detalhe, selo, aoMudar }: CartaoEscolhaProps) {
  return (
    <label className={`cartao-escolha ${desabilitado ? 'cartao-escolha-bloqueado' : ''}`}>
      <input
        type={tipo}
        name={nomeGrupo}
        className="visualmente-oculto"
        checked={marcado}
        disabled={desabilitado}
        onChange={aoMudar}
      />
      <span className="cartao-escolha-marca" aria-hidden="true">✓</span>
      <Pictograma nome={pictograma} tamanho={56} />
      <span className="cartao-escolha-titulo">{titulo}</span>
      {detalhe && <span className="cartao-escolha-detalhe">{detalhe}</span>}
      {selo && <span className="etiqueta etiqueta-neutra">{selo}</span>}
    </label>
  );
}
