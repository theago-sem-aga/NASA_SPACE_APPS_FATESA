import { useEffect } from 'react';
import type { Estrategia } from '../../api/tipos';
import { Icone } from '../../components/Icone';
import { Pictograma, PICTOGRAMA_CULTURA } from '../../components/Pictograma';

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

  useEffect(() => {
    const semMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(aoSeguir, semMovimento ? 1500 : DURACAO_MS);
    return () => window.clearTimeout(t);
  }, [aoSeguir]);

  return (
    <div className="decisao">
      <h1 tabIndex={-1}>Caminho escolhido</h1>
      <p className="decisao-escolha">
        {meio && <Pictograma nome={PICTOGRAMA_CULTURA[meio.cultura_id] ?? 'nao_sei'} tamanho={56} />}
        <strong>{nome}</strong>
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
      <p className="texto-apoio" role="status">Preparando o acompanhamento da sua área…</p>

      <button type="button" className="botao botao-secundario decisao-seguir" onClick={aoSeguir}>
        Seguir <Icone nome="seguir" />
      </button>
    </div>
  );
}
