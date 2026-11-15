import { NomeCientifico } from '../../components/NomeCientifico';
import { useEffect, useRef } from 'react';
import type { Estrategia } from '../../api/tipos';
import { Icone } from '../../components/Icone';
import { Pictograma, PICTOGRAMA_CULTURA } from '../../components/Pictograma';
import { tx } from '../../i18n/idioma';

interface TelaDecisaoProps {
  estrategia: Estrategia;
  aoSeguir: () => void;
}

/** Tempo da animação do trator; depois a tela segue sozinha. */
const DURACAO_MS = 2600;

/**
 * Passagem curta depois que a pessoa escolhe o caminho: um trator cruza a terra e
 * deixa o verde plantado para trás. Com "reduzir movimento" ligado, a cena já
 * aparece pronta (sem animação) e segue um pouco mais rápido.
 */
export function TelaDecisao({ estrategia, aoSeguir }: TelaDecisaoProps) {
  const meio = estrategia.etapas_rotacao[1];
  const nome = meio?.nome ?? estrategia.nome;

  // O timer roda uma vez só. aoSeguir muda de identidade a cada redesenho do App
  // (ex.: tocar em "Ouvir" durante a animação); se ele fosse dependência do efeito,
  // o timer recomeçaria do zero a cada vez. Por isso fica guardado num ref.
  const seguir = useRef(aoSeguir);
  seguir.current = aoSeguir;
  useEffect(() => {
    const semMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => seguir.current(), semMovimento ? 1500 : DURACAO_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="decisao">
      <h1 tabIndex={-1}>{tx('Caminho escolhido', 'Option chosen')}</h1>
      <p className="decisao-escolha">
        {meio && <Pictograma nome={PICTOGRAMA_CULTURA[meio.cultura_id] ?? 'nao_sei'} tamanho={56} />}
        <span className="decisao-nome">
          <strong>{nome}</strong>
          <NomeCientifico culturaId={meio?.cultura_id} />
        </span>
      </p>

      <div className="decisao-campo" aria-hidden="true">
        <div className="decisao-plantado">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="decisao-broto" style={{ animationDelay: `${0.35 + i * 0.22}s` }} />
          ))}
        </div>
        <div className="decisao-trator">
          <Pictograma nome="trator" tamanho={88} semFundo />
        </div>
      </div>
      <p className="texto-apoio" role="status">{tx('Preparando o acompanhamento da sua área…', 'Getting your field follow-up ready…')}</p>

      <button type="button" className="botao botao-secundario decisao-seguir" onClick={aoSeguir}>
        {tx('Seguir', 'Continue')} <Icone nome="seguir" />
      </button>
    </div>
  );
}
