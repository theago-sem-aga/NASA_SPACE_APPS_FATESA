import type { ProblemaId } from '../../api/tipos';
import { AvisoEspecialistaPragas } from '../../components/AvisoEspecialistaPragas';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { Icone } from '../../components/Icone';
import type { DadosFluxo } from './estadoFluxo';
import { PICTO_PROBLEMA, ROTULO_PROBLEMA } from './rotulos';
import { vocabulario } from './vocabularioCultura';
import { tx } from '../../i18n/idioma';

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
      <h1 tabIndex={-1}>{tx('Alguma dessas coisas está acontecendo?', 'Is any of this happening?')}</h1>
      <p className="texto-apoio">{tx('Pode tocar em mais de uma.', 'You can tap more than one.')}</p>
      <fieldset className="grade-escolhas">
        <legend className="visualmente-oculto">{tx('O que está acontecendo', 'What is happening')}</legend>
        {PROBLEMAS.map(p => (
          <CartaoEscolha
            key={p}
            tipo="checkbox"
            marcado={dados.problemas.includes(p)}
            pictograma={PICTO_PROBLEMA[p]}
            titulo={p === 'solo_cansado' ? vocabulario(dados.cultura_atual_id, dados.nomeCultura).produzindoMenos : ROTULO_PROBLEMA[p]}
            aoMudar={() => alternar(p)}
          />
        ))}
        <CartaoEscolha
          tipo="checkbox"
          marcado={nenhum}
          simbolo={{ texto: '✓', tom: 'sim' }}
          titulo={tx('Nada disso', 'None of these')}
          aoMudar={() => aoMudar({ problemas: [], problemasRespondidos: !nenhum })}
        />
      </fieldset>
      {dados.problemas.includes('nematoides_pragas') && <AvisoEspecialistaPragas />}
      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> {tx('Voltar', 'Back')}
        </button>
        <button type="button" className="botao botao-primario" onClick={aoAvancar}>
          {dados.problemasRespondidos ? tx('Continuar', 'Continue') : tx('Pular', 'Skip')} <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
