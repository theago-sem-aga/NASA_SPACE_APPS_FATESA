import type { ProblemaId } from '../../api/tipos';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { Icone } from '../../components/Icone';
import type { DadosFluxo } from './estadoFluxo';
import { PICTO_PROBLEMA, ROTULO_PROBLEMA } from './rotulos';

interface TelaProblemasProps {
  dados: DadosFluxo;
  aoMudar: (parcial: Partial<DadosFluxo>) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

const PROBLEMAS = Object.keys(ROTULO_PROBLEMA) as ProblemaId[];

/**
 * Só o que o produtor sabe e os mapas não mostram. Erosão e seca não são mais
 * perguntadas: vêm dos dados (ver `talhao` em api/tipos.ts).
 */
export function TelaProblemas({ dados, aoMudar, aoVoltar, aoAvancar }: TelaProblemasProps) {
  const nenhum = dados.problemasRespondidos && dados.problemas.length === 0;

  function alternar(p: ProblemaId) {
    const problemas = dados.problemas.includes(p) ? dados.problemas.filter(x => x !== p) : [...dados.problemas, p];
    aoMudar({ problemas, problemasRespondidos: problemas.length > 0 });
  }

  return (
    <>
      <h1 tabIndex={-1}>Alguma dessas coisas está acontecendo?</h1>
      <p className="texto-apoio">Pode tocar em mais de uma.</p>
      <fieldset className="grade-escolhas">
        <legend className="visualmente-oculto">O que está acontecendo</legend>
        {PROBLEMAS.map(p => (
          <CartaoEscolha
            key={p}
            tipo="checkbox"
            marcado={dados.problemas.includes(p)}
            pictograma={PICTO_PROBLEMA[p]}
            titulo={ROTULO_PROBLEMA[p]}
            aoMudar={() => alternar(p)}
          />
        ))}
        <CartaoEscolha
          tipo="checkbox"
          marcado={nenhum}
          simbolo={{ texto: '✓', tom: 'sim' }}
          titulo="Nada disso"
          aoMudar={() => aoMudar({ problemas: [], problemasRespondidos: !nenhum })}
        />
      </fieldset>
      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoAvancar}>
          {dados.problemasRespondidos ? 'Continuar' : 'Pular'} <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
