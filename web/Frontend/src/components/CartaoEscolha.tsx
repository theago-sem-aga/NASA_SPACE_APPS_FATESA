import type { ReactNode } from 'react';
import { Pictograma, type NomePictograma } from './Pictograma';

interface CartaoEscolhaProps {
  tipo: 'radio' | 'checkbox';
  nomeGrupo?: string;
  marcado: boolean;
  desabilitado?: boolean;
  pictograma?: NomePictograma;
  /** Símbolo grande no lugar do pictograma (ex.: ✓ para "Nada disso"). */
  simbolo?: { texto: string; tom: 'sim' | 'nao' | 'talvez' };
  titulo: ReactNode;
  detalhe?: ReactNode;
  selo?: string;
  aoMudar: () => void;
}

/** Opção grande com imagem + palavra: dá para escolher só olhando o desenho. */
export function CartaoEscolha({ tipo, nomeGrupo, marcado, desabilitado, pictograma, simbolo, titulo, detalhe, selo, aoMudar }: CartaoEscolhaProps) {
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
      {pictograma && <Pictograma nome={pictograma} tamanho={56} />}
      {simbolo && <span className={`simbolo-resposta simbolo-${simbolo.tom}`} aria-hidden="true">{simbolo.texto}</span>}
      <span className="cartao-escolha-titulo">{titulo}</span>
      {detalhe && <span className="cartao-escolha-detalhe">{detalhe}</span>}
      {selo && <span className="etiqueta etiqueta-neutra">{selo}</span>}
    </label>
  );
}
