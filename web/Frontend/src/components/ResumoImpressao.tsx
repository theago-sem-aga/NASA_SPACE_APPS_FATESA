import { NomeCientificoCaminho } from './NomeCientifico';
import { SINALIZAR_MOCK, USANDO_MOCK } from '../api/cliente';
import type { Analise } from '../api/tipos';
import type { DadosFluxo } from '../features/fluxo/estadoFluxo';
import { fraseGeada, linhaTecnicaGeada } from '../features/fluxo/FaixaGeada';
import { fraseChuvaExtrema } from '../features/fluxo/FaixaPrecipitacaoExtrema';
import { NOME_MES } from '../features/fluxo/rotulos';
import { ResumoVisual } from './ResumoVisual';
import { fraseTendencia, linhaTecnicaTendencia } from '../features/fluxo/FaixaTendenciaHidrica';
import { fraseEstresse, linhaTecnicaEstresse } from '../features/fluxo/FaixaEstresseVegetal';
import { temperatura, localeAtual, tx } from '../i18n/idioma';

/** Folha para levar ao agrônomo. Escondida na tela; só aparece na impressão / PDF. */
export function ResumoImpressao({ dados, analise }: { dados: DadosFluxo; analise: Analise }) {
  const hoje = new Date().toLocaleDateString(localeAtual());
  return (
    <section className="resumo-impressao" aria-hidden="true">
      <h1>{tx('Rotação de culturas: resumo para o agrônomo', 'Crop rotation: summary for the agronomist')}</h1>
      <p>
        {tx('Gerado em', 'Generated on')} {hoje}.{' '}
        {USANDO_MOCK && SINALIZAR_MOCK
          ? tx('ATENÇÃO: dados de exemplo.', 'WARNING: sample data.')
          : analise.eh_mock
            ? tx(
                'ATENÇÃO: caminhos em simulação de teste, ainda sem conferência de um agrônomo; clima e solo são dados reais.',
                'WARNING: options are a test simulation, not yet checked by an agronomist; climate and soil are real data.'
              )
            : null}
      </p>
      <ResumoVisual dados={dados} analise={analise} />
      {analise.geada && (
        <p>
          <strong>{tx('Geada:', 'Frost:')}</strong> {fraseGeada(analise.geada)}{' '}
          {analise.geada.meses_com_risco.length > 0 &&
            tx(
              `Meses com geada em 1 de cada 10 anos ou mais: ${analise.geada.meses_com_risco.map(m => NOME_MES[m - 1]).join(', ')}. `,
              `Months with frost in 1 in every 10 years or more: ${analise.geada.meses_com_risco.map(m => NOME_MES[m - 1]).join(', ')}. `
            )}
          {linhaTecnicaGeada(analise.geada)}{' '}
          {tx(
            `(NASA POWER, mínima do ar a 2 m de até ${temperatura(analise.geada.limiar_c)}, ${analise.geada.periodo_inicio}–${analise.geada.periodo_fim}; faixa = intervalo de Wilson pelo número de anos; não inclui o erro da grade nem o ar vs. folha.)`,
            `(NASA POWER, 2 m air minimum at or below ${temperatura(analise.geada.limiar_c)}, ${analise.geada.periodo_inicio}–${analise.geada.periodo_fim}; range = Wilson interval over the number of years; it does not include grid error or air vs. leaf.)`
          )}
        </p>
      )}
      {analise.precipitacao_extrema && (
        <p>
          <strong>{tx('Chuva extrema:', 'Extreme rain:')}</strong> {fraseChuvaExtrema(analise.precipitacao_extrema)}
        </p>
      )}
      {analise.tendencia_hidrica && (
        <p>
          <strong>{tx('Chuva ao longo dos anos:', 'Rain over the years:')}</strong> {fraseTendencia(analise.tendencia_hidrica)}{' '}
          ({linhaTecnicaTendencia(analise.tendencia_hidrica)} {tx('NASA POWER é reanálise em grade, não pluviômetro.', 'NASA POWER is a gridded reanalysis, not a rain gauge.')})
        </p>
      )}
      {analise.estresse_vegetal && (
        <p>
          <strong>{tx('Vigor da vegetação (NDVI):', 'Vegetation vigor (NDVI):')}</strong> {fraseEstresse(analise.estresse_vegetal)}{' '}
          ({linhaTecnicaEstresse(analise.estresse_vegetal)}{' '}
          {tx('Queda do NDVI também é colheita ou senescência; confirmar no campo. Fonte das faixas e causas:', 'An NDVI drop can also be harvest or senescence; confirm in the field. Source of the bands and causes:')}{' '}
          {analise.estresse_vegetal.fonte_referencia}.)
        </p>
      )}

      {analise.estrategias.map(e => (
        <div key={e.estrategia_id} className="resumo-estrategia">
          <h2>{e.nome}</h2>
          <p><NomeCientificoCaminho estrategia={e} /></p>
          <p><strong>{tx('Pode ganhar:', 'Possible gains:')}</strong> {e.beneficios.join(' ')}</p>
          <p><strong>{tx('Pode dar errado:', 'What may go wrong:')}</strong> {e.riscos.join(' ')}</p>
          <p><strong>{tx('Falta saber:', 'Still unknown:')}</strong> {e.lacunas.join(' ')}</p>
        </div>
      ))}

      <h2>{tx('Anotações da conversa', 'Notes from the conversation')}</h2>
      <div className="resumo-linhas" />
      <p className="resumo-rodape">
        {tx('Ferramenta de apoio. Não substitui a avaliação de um profissional no local.', 'A support tool. It does not replace an on-site assessment by a professional.')}
      </p>
    </section>
  );
}
