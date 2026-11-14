import { useId, useState } from 'react';
import type { CaracteristicasTalhao, CorrecoesTalhao, Nivel, Relevo, TexturaSolo } from '../../api/tipos';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { Pictograma, type NomePictograma } from '../../components/Pictograma';
import { PICTO_RELEVO, PICTO_TEXTURA, ROTULO_RELEVO, ROTULO_RISCO, ROTULO_TEXTURA } from './rotulos';

interface PainelTalhaoProps {
  talhao: CaracteristicasTalhao;
  aoCorrigir: (correcoes: CorrecoesTalhao) => void;
}

const TEXTURAS = Object.keys(ROTULO_TEXTURA) as TexturaSolo[];
const RELEVOS = Object.keys(ROTULO_RELEVO) as Relevo[];

function Item({ pictograma, rotulo, valor, corrigido }: { pictograma: NomePictograma; rotulo: string; valor: string; corrigido?: boolean }) {
  return (
    <li className="ficha">
      <Pictograma nome={pictograma} tamanho={36} />
      <span className="ficha-texto">
        <span className="ficha-rotulo">{rotulo}</span>
        <span className="ficha-valor">{valor}</span>
        {corrigido && <span className="etiqueta etiqueta-neutra">Você corrigiu</span>}
      </span>
    </li>
  );
}

const risco = (n: Nivel | null) => (n ? ROTULO_RISCO[n] : 'Sem dado');

/**
 * O que os dados acharam sobre o talhão (solo, terreno, riscos), em vez de perguntar.
 * A pessoa pode discordar: "Não é bem assim" reenvia a análise com a correção.
 */
export function PainelTalhao({ talhao, aoCorrigir }: PainelTalhaoProps) {
  const id = useId();
  const [corrigindo, setCorrigindo] = useState(false);

  const valorRelevo = talhao.relevo
    ? ROTULO_RELEVO[talhao.relevo].nome
    : 'Sem dado';

  return (
    <section className="cartao painel-talhao" aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`} className="titulo-secao">Sua terra, pelos mapas</h2>
      <ul className="fichas fichas-compactas">
        <Item
          pictograma={talhao.textura_solo ? PICTO_TEXTURA[talhao.textura_solo] : 'nao_sei'}
          rotulo="Terra"
          valor={talhao.textura_solo ? ROTULO_TEXTURA[talhao.textura_solo].nome : 'Sem dado'}
          corrigido={talhao.fonte_textura === 'informado_produtor'}
        />
        <Item
          pictograma={talhao.relevo ? PICTO_RELEVO[talhao.relevo] : 'nao_sei'}
          rotulo="Terreno"
          valor={valorRelevo}
          corrigido={talhao.fonte_relevo === 'informado_produtor'}
        />
        <Item pictograma="erosao" rotulo="Risco de erosão" valor={risco(talhao.risco_erosao)} />
        <Item pictograma="falta_agua" rotulo="Risco de seca" valor={risco(talhao.risco_seca)} />
      </ul>
      <div className="painel-talhao-rodape">
        {talhao.bases.length > 0 && <span className="texto-apoio">De onde vem: {talhao.bases.join(', ')}.</span>}
        {!corrigindo && (
          <button type="button" className="link-discreto" onClick={() => setCorrigindo(true)} aria-expanded={false}>
            Não é bem assim
          </button>
        )}
      </div>

      {corrigindo && (
        <div className="painel-correcao">
          <p className="texto-apoio">Você conhece a sua terra melhor que o satélite. Toque no que é certo e a gente refaz os caminhos.</p>
          <fieldset className="grade-escolhas grade-escolhas-3">
            <legend className="resumo-subtitulo">A terra é…</legend>
            {TEXTURAS.map(t => (
              <CartaoEscolha
                key={t}
                tipo="radio"
                nomeGrupo={`${id}-textura`}
                marcado={talhao.textura_solo === t}
                pictograma={PICTO_TEXTURA[t]}
                titulo={ROTULO_TEXTURA[t].nome}
                detalhe={ROTULO_TEXTURA[t].dica}
                aoMudar={() => aoCorrigir({ textura_solo: t })}
              />
            ))}
          </fieldset>
          <fieldset className="grade-escolhas grade-escolhas-3">
            <legend className="resumo-subtitulo">O terreno é…</legend>
            {RELEVOS.map(r => (
              <CartaoEscolha
                key={r}
                tipo="radio"
                nomeGrupo={`${id}-relevo`}
                marcado={talhao.relevo === r}
                pictograma={PICTO_RELEVO[r]}
                titulo={ROTULO_RELEVO[r].nome}
                detalhe={ROTULO_RELEVO[r].dica}
                aoMudar={() => aoCorrigir({ relevo: r })}
              />
            ))}
          </fieldset>
          <button type="button" className="link-discreto" onClick={() => setCorrigindo(false)}>
            Está certo, pode fechar
          </button>
        </div>
      )}
    </section>
  );
}
