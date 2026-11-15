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

/** Respostas mostradas: só Sim e Não. Sem resposta, o App manda 'nao_sei' para a API. */
const OPCOES: Resposta[] = ['sim', 'nao'];

/** Uma pergunta, uma figura, dois botões. Tocar responde e já vai para a próxima. */
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
        {OPCOES.map(resp => (
          <BotaoFigura
            key={resp}
            simbolo={SIMBOLO[resp]}
            titulo={ROTULO_RESPOSTA[resp]}
            escolhido={resposta === resp}
            aoTocar={() => aoResponder(resp)}
          />
        ))}
      </div>
      <div className="navegacao navegacao-unica">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
      </div>
    </>
  );
}
