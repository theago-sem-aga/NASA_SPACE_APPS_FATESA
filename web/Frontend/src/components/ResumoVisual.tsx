import { LegendaMedidor } from './LegendaMedidor';
import { NomeCientificoCaminho } from './NomeCientifico';
import { vocabulario } from '../features/fluxo/vocabularioCultura';
import { useId } from 'react';
import type { Analise, AtributosEstrategia, RequisitoId } from '../api/tipos';
import type { DadosFluxo } from '../features/fluxo/estadoFluxo';
import {
  PICTO_ATRIBUTO, PICTO_PRIORIDADE, PICTO_PROBLEMA, PICTO_RELEVO, PICTO_REQUISITO, PICTO_TEXTURA, ROTULO_REQUISITO, ROTULO_RESPOSTA, ROTULO_RISCO,
  ROTULO_ATRIBUTO, ROTULO_CONFIANCA, ROTULO_PRIORIDADE, ROTULO_PROBLEMA, ROTULO_RELEVO, ROTULO_TEXTURA
} from '../features/fluxo/rotulos';
import { FaixaRotacao } from './FaixaRotacao';
import { Icone } from './Icone';
import { Medidor } from './Medidor';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from './Pictograma';
import { nivelComFaixa } from '../features/fluxo/FaixaGeada';
import { ROTULO_TENDENCIA } from '../features/fluxo/FaixaTendenciaHidrica';
import { ROTULO_ESTRESSE } from '../features/fluxo/FaixaEstresseVegetal';
import { tx } from '../i18n/idioma';

const CRITERIOS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'materia_organica', 'renda_direta', 'trabalho_custo'];
/** Na tela, só os dois pontos que mais separam os caminhos; a versão impressa mostra os quatro. */
const CRITERIOS_COMPACTOS: (keyof AtributosEstrategia)[] = ['protecao_solo', 'renda_direta'];

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

/**
 * Resumo feito para ser entendido olhando: figuras, faixas e medidores, com pouco texto.
 * `compacto` (tela do celular) mostra só o essencial; sem ele (impressão) mostra tudo.
 */
export function ResumoVisual({ dados, analise, compacto = false }: { dados: DadosFluxo; analise: Analise; compacto?: boolean }) {
  const id = useId();
  return (
    <div className="resumo-visual">
      <section aria-labelledby={`${id}-talhao`}>
        <h2 id={`${id}-talhao`} className="titulo-secao">{tx('Sua área', 'Your field')}</h2>
        <ul className="fichas">
          <li className="ficha">
            <span className="ficha-icone"><Icone nome="local" tamanho={28} /></span>
            <span className="ficha-texto">
              <span className="ficha-rotulo">{tx('Onde', 'Where')}</span>
              <span className="ficha-valor">{analise.descricao_local || tx('Sem local', 'No location')}</span>
            </span>
          </li>
          {dados.cultura_atual_id && (
            <Ficha pictograma={PICTOGRAMA_CULTURA[dados.cultura_atual_id] ?? 'nao_sei'} rotulo={tx('Plantado hoje', 'Planted today')} valor={dados.nomeCultura ?? ''} />
          )}
          {analise.talhao.textura_solo && (
            <Ficha pictograma={PICTO_TEXTURA[analise.talhao.textura_solo]} rotulo={tx('Terra', 'Soil')} valor={ROTULO_TEXTURA[analise.talhao.textura_solo].nome} />
          )}
          {analise.talhao.relevo && (
            <Ficha pictograma={PICTO_RELEVO[analise.talhao.relevo]} rotulo={tx('Terreno', 'Terrain')} valor={ROTULO_RELEVO[analise.talhao.relevo].nome} />
          )}
          {!compacto && analise.talhao.risco_erosao && (
            <Ficha pictograma="erosao" rotulo={tx('Risco de erosão', 'Erosion risk')} valor={ROTULO_RISCO[analise.talhao.risco_erosao]} />
          )}
          {analise.talhao.risco_geada && (
            <Ficha pictograma="geada" rotulo={tx('Risco de geada', 'Frost risk')} valor={analise.geada ? nivelComFaixa(analise.geada) : ROTULO_RISCO[analise.talhao.risco_geada]} />
          )}
          {analise.precipitacao_extrema && (
            <Ficha
              pictograma="chuva"
              rotulo={tx('Chuva extrema (30 dias)', 'Extreme rain (30 days)')}
              valor={
                analise.precipitacao_extrema.dias_chuva_extrema_30d === 0
                  ? tx('Normal', 'Normal')
                  : `${analise.precipitacao_extrema.dias_chuva_extrema_30d} ${analise.precipitacao_extrema.dias_chuva_extrema_30d === 1 ? tx('dia', 'day') : tx('dias', 'days')}`
              }
            />
          )}
          {analise.tendencia_hidrica && (
            <Ficha pictograma="chuva" rotulo={tx('Chuva ao longo dos anos', 'Rain over the years')} valor={ROTULO_TENDENCIA[analise.tendencia_hidrica.tendencia]} />
          )}
          {analise.estresse_vegetal && (
            <Ficha pictograma="planta" rotulo={tx('Vegetação (NDVI)', 'Vegetation (NDVI)')} valor={ROTULO_ESTRESSE[analise.estresse_vegetal.situacao]} />
          )}
          {!compacto && (Object.keys(ROTULO_REQUISITO) as RequisitoId[]).map(r => {
            const resp = dados.recursos_disponiveis[r];
            return resp && <Ficha key={r} pictograma={PICTO_REQUISITO[r]} rotulo={ROTULO_REQUISITO[r].nome} valor={ROTULO_RESPOSTA[resp]} />;
          })}
        </ul>
        {(dados.problemas.length > 0 || dados.prioridades.length > 0) && (
          <div className="resumo-duplo">
            {!compacto && dados.problemas.length > 0 && (
              <div>
                <h3 className="resumo-subtitulo">{tx('Incomoda', 'Problems')}</h3>
                <ul className="figuras-com-nome">
                  {dados.problemas.map(p => (
                    <li key={p}><Pictograma nome={PICTO_PROBLEMA[p]} tamanho={40} /> {p === 'solo_cansado' ? vocabulario(dados.cultura_atual_id, dados.nomeCultura).produzindoMenos : ROTULO_PROBLEMA[p]}</li>
                  ))}
                </ul>
              </div>
            )}
            {dados.prioridades.length > 0 && (
              <div>
                <h3 className="resumo-subtitulo">{tx('Mais importante', 'Most important')}</h3>
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
        <h2 id={`${id}-caminhos`} className="titulo-secao">{tx('Os caminhos', 'The options')}</h2>
        <LegendaMedidor />
        <ol className="resumo-caminhos">
          {analise.estrategias.map(e => (
            <li key={e.estrategia_id} className="resumo-caminho">
              <p className="resumo-caminho-nome">
                {e.nome}
                <NomeCientificoCaminho estrategia={e} />
                {e.eh_pratica_atual && <span className="etiqueta etiqueta-neutra">{tx('O jeito de hoje, para comparar', 'Today’s practice, for comparison')}</span>}
              </p>
              <FaixaRotacao etapas={e.etapas_rotacao} tamanho={compacto ? 28 : 36} />
              <ul className="resumo-criterios">
                {(compacto ? CRITERIOS_COMPACTOS : CRITERIOS).map(a => (
                  <li key={a}>
                    <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={28} />
                    <span className="visualmente-oculto">{ROTULO_ATRIBUTO[a].nome}:</span>
                    <span className="resumo-criterio-rotulo" aria-hidden="true">{ROTULO_ATRIBUTO[a].nome}</span>
                    <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                  </li>
                ))}
              </ul>
              {(e.beneficios[0] || e.riscos[0]) && (
                <dl className="resumo-motivos">
                  {e.beneficios[0] && (
                    <div className="resumo-motivo resumo-motivo-bom">
                      <dt>{tx('Por que pode dar certo', 'Why it may work')}</dt>
                      <dd>{e.beneficios[0]}</dd>
                    </div>
                  )}
                  {e.riscos[0] && (
                    <div className="resumo-motivo resumo-motivo-risco">
                      <dt>{tx('O que pode dar errado', 'What may go wrong')}</dt>
                      <dd>{e.riscos[0]}</dd>
                    </div>
                  )}
                </dl>
              )}
              {!compacto && (<>
              <p className="resumo-pergunta">
                <Icone nome="pessoa" tamanho={20} /> <span><strong>{tx('Pergunte:', 'Ask:')}</strong> {e.pergunta_especialista}</span>
              </p>
              <p className="texto-apoio">{ROTULO_CONFIANCA[e.confianca]}</p>
              </>)}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
