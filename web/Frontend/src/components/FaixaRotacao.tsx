import type { EtapaRotacao } from '../api/tipos';
import { NomeCientifico } from './NomeCientifico';
import { Pictograma, PICTOGRAMA_CULTURA } from './Pictograma';

/** Sequência visual da rotação: cana velha → amendoim → cana nova. */
export function FaixaRotacao({ etapas, tamanho = 44 }: { etapas: EtapaRotacao[]; tamanho?: number }) {
  return (
    <ol className="faixa-rotacao" aria-label="Sequência da rotação">
      {etapas.map((e, i) => (
        <li key={`${e.cultura_id}-${i}`} className="faixa-rotacao-etapa">
          <Pictograma nome={PICTOGRAMA_CULTURA[e.cultura_id] ?? 'nao_sei'} tamanho={tamanho} />
          <span className="faixa-rotacao-nome">{e.nome}</span>
          <NomeCientifico culturaId={e.cultura_id} />
          {e.duracao_meses !== null && <span className="faixa-rotacao-duracao">{e.duracao_meses} {e.duracao_meses === 1 ? 'mês' : 'meses'}</span>}
        </li>
      ))}
    </ol>
  );
}
