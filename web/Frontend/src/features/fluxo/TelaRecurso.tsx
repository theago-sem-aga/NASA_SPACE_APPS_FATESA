import type { RequisitoId, Resposta } from '../../api/tipos';
import { BotaoFigura } from '../../components/BotaoFigura';
import { Icone } from '../../components/Icone';
import { Pictograma } from '../../components/Pictograma';
import { PICTO_REQUISITO, ROTULO_REQUISITO, ROTULO_RESPOSTA } from './rotulos';

interface TelaRecursoProps {
  recurso: RequisitoId;
  resposta: Resposta | null;
  aoResponder: (resposta: Resposta) => void;
  aoVoltar: () => void;
}

const SIMBOLO: Record<Resposta, { texto: string; tom: 'sim' | 'nao' | 'talvez' }> = {
  sim: { texto: '✓', tom: 'sim' },
  nao: { texto: '✕', tom: 'nao' },
  nao_sei: { texto: '?', tom: 'talvez' }
};

/** Uma pergunta, uma figura, três botões. Tocar responde e já vai para a próxima. */
export function TelaRecurso({ recurso, resposta, aoResponder, aoVoltar }: TelaRecursoProps) {
  const r = ROTULO_REQUISITO[recurso];
  return (
    <>
      <div className="pergunta-unica">
        <Pictograma nome={PICTO_REQUISITO[recurso]} tamanho={96} />
        <h1 tabIndex={-1}>{r.pergunta}</h1>
        <p className="texto-apoio">{r.porque}</p>
      </div>
      <div className="grade-respostas" role="group" aria-label={r.pergunta}>
        {(Object.keys(ROTULO_RESPOSTA) as Resposta[]).map(resp => (
          <BotaoFigura
            key={resp}
            simbolo={SIMBOLO[resp]}
            titulo={ROTULO_RESPOSTA[resp]}
            escolhido={resposta === resp}
            aoTocar={() => aoResponder(resp)}
          />
        ))}
      </div>
      <button type="button" className="link-discreto" onClick={aoVoltar}>
        <Icone nome="voltar" tamanho={18} /> Voltar
      </button>
    </>
  );
}
