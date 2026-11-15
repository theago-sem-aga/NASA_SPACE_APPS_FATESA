import type { MesCalendario } from '../api/tipos';
import { NOME_MES, NOME_MES_CURTO, ROTULO_COBERTURA } from '../features/fluxo/rotulos';
import { vocabulario } from '../features/fluxo/vocabularioCultura';

/** culturaId = cultura atual (primeira etapa do caminho), para o texto falar dela. */
export function CalendarioCobertura({ calendario, culturaId }: { calendario: MesCalendario[]; culturaId?: string }) {
  const v = vocabulario(culturaId);
  const usados = [...new Set(calendario.map(m => m.cobertura))];
  return (
    <section className="cartao" aria-labelledby="titulo-calendario">
      <div>
        <h2 id="titulo-calendario" className="titulo-secao">O que cobre a terra, mês a mês</h2>
        <p className="texto-apoio">Da última colheita até {v.culturaNova} estar no chão. Os meses listrados são de terra descoberta.</p>
      </div>
      <div className="rolagem-horizontal">
        <ol className="calendario">
          {calendario.map(({ mes, cobertura }) => (
            <li key={mes} className="calendario-mes">
              <span className={`calendario-bloco ${ROTULO_COBERTURA[cobertura].classe}`} title={ROTULO_COBERTURA[cobertura].nome} />
              <span aria-hidden="true">{NOME_MES_CURTO[mes - 1]}</span>
              <span className="visualmente-oculto">{NOME_MES[mes - 1]}: {ROTULO_COBERTURA[cobertura].nome}</span>
            </li>
          ))}
        </ol>
      </div>
      <ul className="legenda" aria-label="Legenda">
        {usados.map(c => (
          <li key={c}>
            <span className={`amostra ${ROTULO_COBERTURA[c].classe}`} aria-hidden="true" />
            {ROTULO_COBERTURA[c].nome}
          </li>
        ))}
      </ul>
    </section>
  );
}
