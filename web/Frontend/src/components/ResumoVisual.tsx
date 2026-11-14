import { useId } from 'react';
import type { Analise, AtributosEstrategia } from '../api/tipos';
import type { DadosFluxo } from '../features/fluxo/estadoFluxo';
import {
  PICTO_ATRIBUTO, PICTO_PRIORIDADE, PICTO_PROBLEMA, PICTO_RELEVO, PICTO_TEXTURA,
  ROTULO_ATRIBUTO, ROTULO_CONFIANCA, ROTULO_PRIORIDADE, ROTULO_PROBLEMA, ROTULO_RELEVO, ROTULO_TEXTURA
} from '../features/fluxo/rotulos';
import { FaixaRotacao } from './FaixaRotacao';
import { Icone } from './Icone';
import { Medidor } from './Medidor';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from './Pictograma';

const CRITERIOS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'materia_organica', 'renda_direta', 'trabalho_custo'];

function Ficha({ pictograma, rotulo, valor }: { pictograma: NomePictograma; rotulo: string; valor: string }) {
  return (
    <li className="ficha">
      <Pictograma nome={pictograma} tamanho={44} />
      <span className="ficha-texto">
        <span className="ficha-rotulo">{rotulo}</span>
        <span className="ficha-valor">{valor}</span>
      </span>
    </li>
  );
}

/** Resumo feito para ser entendido olhando: figuras, faixas e medidores, com pouco texto. */
export function ResumoVisual({ dados, analise }: { dados: DadosFluxo; analise: Analise }) {
  const id = useId();
  return (
    <div className="resumo-visual">
      <section aria-labelledby={`${id}-talhao`}>
        <h2 id={`${id}-talhao`} className="titulo-secao">Seu talhão</h2>
        <ul className="fichas">
          <li className="ficha">
            <span className="ficha-icone"><Icone nome="local" tamanho={28} /></span>
            <span className="ficha-texto">
              <span className="ficha-rotulo">Onde</span>
              <span className="ficha-valor">{analise.descricao_local || 'Não informado'}</span>
            </span>
          </li>
          {dados.cultura_atual_id && (
            <Ficha pictograma={PICTOGRAMA_CULTURA[dados.cultura_atual_id] ?? 'nao_sei'} rotulo="Plantado hoje" valor={dados.nomeCultura ?? ''} />
          )}
          {dados.textura_solo && <Ficha pictograma={PICTO_TEXTURA[dados.textura_solo]} rotulo="Terra" valor={ROTULO_TEXTURA[dados.textura_solo].nome} />}
          {dados.relevo && <Ficha pictograma={PICTO_RELEVO[dados.relevo]} rotulo="Terreno" valor={ROTULO_RELEVO[dados.relevo].nome} />}
        </ul>
        {(dados.problemas.length > 0 || dados.prioridades.length > 0) && (
          <div className="resumo-duplo">
            {dados.problemas.length > 0 && (
              <div>
                <h3 className="resumo-subtitulo">Incomoda</h3>
                <ul className="figuras-com-nome">
                  {dados.problemas.map(p => (
                    <li key={p}><Pictograma nome={PICTO_PROBLEMA[p]} tamanho={40} /> {ROTULO_PROBLEMA[p]}</li>
                  ))}
                </ul>
              </div>
            )}
            {dados.prioridades.length > 0 && (
              <div>
                <h3 className="resumo-subtitulo">Mais importante</h3>
                <ul className="figuras-com-nome">
                  {dados.prioridades.map(p => (
                    <li key={p}><Pictograma nome={PICTO_PRIORIDADE[p]} tamanho={40} /> {ROTULO_PRIORIDADE[p].nome}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby={`${id}-caminhos`}>
        <h2 id={`${id}-caminhos`} className="titulo-secao">Os caminhos</h2>
        <ol className="resumo-caminhos">
          {analise.estrategias.map(e => (
            <li key={e.estrategia_id} className="resumo-caminho">
              <p className="resumo-caminho-nome">
                {e.nome}
                {e.eh_pratica_atual && <span className="etiqueta etiqueta-neutra">Hoje</span>}
              </p>
              <FaixaRotacao etapas={e.etapas_rotacao} tamanho={36} />
              <ul className="resumo-criterios">
                {CRITERIOS.map(a => (
                  <li key={a}>
                    <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={28} />
                    <span className="visualmente-oculto">{ROTULO_ATRIBUTO[a].nome}:</span>
                    <span className="resumo-criterio-rotulo" aria-hidden="true">{ROTULO_ATRIBUTO[a].nome}</span>
                    <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  </li>
                ))}
              </ul>
              <p className="resumo-pergunta">
                <Icone nome="pessoa" tamanho={20} /> <span><strong>Pergunte:</strong> {e.pergunta_especialista}</span>
              </p>
              <p className="texto-apoio">{ROTULO_CONFIANCA[e.confianca]}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
