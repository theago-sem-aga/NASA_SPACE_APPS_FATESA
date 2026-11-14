import type { ProblemaId, Relevo, RequisitoId, Resposta, TexturaSolo } from '../../api/tipos';
import { CartaoEscolha } from '../../components/CartaoEscolha';
import { Navegacao } from '../../components/Navegacao';
import { Pictograma } from '../../components/Pictograma';
import type { DadosFluxo } from './estadoFluxo';
import {
  PICTO_PROBLEMA, PICTO_RELEVO, PICTO_REQUISITO, PICTO_TEXTURA,
  ROTULO_PROBLEMA, ROTULO_RELEVO, ROTULO_REQUISITO, ROTULO_RESPOSTA, ROTULO_TEXTURA
} from './rotulos';

interface TelaTalhaoProps {
  dados: DadosFluxo;
  aoMudar: (parcial: Partial<DadosFluxo>) => void;
  aoVoltar: () => void;
  aoAvancar: () => void;
}

const TEXTURAS = Object.keys(ROTULO_TEXTURA) as TexturaSolo[];
const RELEVOS = Object.keys(ROTULO_RELEVO) as Relevo[];
const PROBLEMAS = Object.keys(ROTULO_PROBLEMA) as ProblemaId[];
const REQUISITOS = Object.keys(ROTULO_REQUISITO) as RequisitoId[];
const RESPOSTAS = Object.keys(ROTULO_RESPOSTA) as Resposta[];

export function TelaTalhao({ dados, aoMudar, aoVoltar, aoAvancar }: TelaTalhaoProps) {
  function alternarProblema(p: ProblemaId) {
    aoMudar({ problemas: dados.problemas.includes(p) ? dados.problemas.filter(x => x !== p) : [...dados.problemas, p] });
  }

  return (
    <>
      <h1 tabIndex={-1}>Conte um pouco sobre esse talhão</h1>
      <p className="texto-apoio">Se não souber, pode pular ou marcar "Não sei".</p>

      <fieldset className="grade-escolhas grade-escolhas-4">
        <legend className="titulo-secao">Como é a terra?</legend>
        {TEXTURAS.map(t => (
          <CartaoEscolha
            key={t}
            tipo="radio"
            nomeGrupo="textura"
            marcado={dados.textura_solo === t}
            pictograma={PICTO_TEXTURA[t]}
            titulo={ROTULO_TEXTURA[t].nome}
            detalhe={ROTULO_TEXTURA[t].dica}
            aoMudar={() => aoMudar({ textura_solo: t })}
          />
        ))}
      </fieldset>

      <fieldset className="grade-escolhas grade-escolhas-4">
        <legend className="titulo-secao">E o terreno?</legend>
        {RELEVOS.map(r => (
          <CartaoEscolha
            key={r}
            tipo="radio"
            nomeGrupo="relevo"
            marcado={dados.relevo === r}
            pictograma={PICTO_RELEVO[r]}
            titulo={ROTULO_RELEVO[r].nome}
            aoMudar={() => aoMudar({ relevo: r })}
          />
        ))}
      </fieldset>

      <fieldset className="grade-escolhas grade-escolhas-5">
        <legend className="titulo-secao">
          O que já está incomodando? <span className="unidade">Pode marcar mais de um.</span>
        </legend>
        {PROBLEMAS.map(p => (
          <CartaoEscolha
            key={p}
            tipo="checkbox"
            marcado={dados.problemas.includes(p)}
            pictograma={PICTO_PROBLEMA[p]}
            titulo={ROTULO_PROBLEMA[p]}
            aoMudar={() => alternarProblema(p)}
          />
        ))}
      </fieldset>

      <section className="cartao" aria-labelledby="titulo-recursos">
        <h2 id="titulo-recursos" className="titulo-secao">O que você tem à mão?</h2>
        {REQUISITOS.map(r => (
          <div key={r} className="pergunta-recurso">
            <Pictograma nome={PICTO_REQUISITO[r]} tamanho={52} />
            <div className="pergunta-recurso-corpo">
              <p id={`pergunta-${r}`} className="pergunta-recurso-texto">{ROTULO_REQUISITO[r].pergunta}</p>
              <div className="segmentado" role="radiogroup" aria-labelledby={`pergunta-${r}`}>
                {RESPOSTAS.map(resp => (
                  <label key={resp} className="segmentado-opcao">
                    <input
                      type="radio"
                      name={`recurso-${r}`}
                      checked={dados.recursos_disponiveis[r] === resp}
                      onChange={() => aoMudar({ recursos_disponiveis: { ...dados.recursos_disponiveis, [r]: resp } })}
                    />
                    <span>{ROTULO_RESPOSTA[resp]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <Navegacao aoVoltar={aoVoltar} aoAvancar={aoAvancar} />
    </>
  );
}
