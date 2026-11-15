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

/** Folha para levar ao agrônomo. Escondida na tela; só aparece na impressão / PDF. */
export function ResumoImpressao({ dados, analise }: { dados: DadosFluxo; analise: Analise }) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  return (
    <section className="resumo-impressao" aria-hidden="true">
      <h1>Rotação de culturas: resumo para o agrônomo</h1>
      <p>
        Gerado em {hoje}. {USANDO_MOCK && SINALIZAR_MOCK ? 'ATENÇÃO: dados de exemplo.' : analise.eh_mock ? 'ATENÇÃO: caminhos em simulação de teste, ainda sem conferência de um agrônomo; clima e solo são dados reais.' : null}
      </p>
      <ResumoVisual dados={dados} analise={analise} />
      {analise.geada && (
        <p>
          <strong>Geada:</strong> {fraseGeada(analise.geada)}{' '}
          {analise.geada.meses_com_risco.length > 0 &&
            `Meses com geada em 1 de cada 10 anos ou mais: ${analise.geada.meses_com_risco.map(m => NOME_MES[m - 1]).join(', ')}. `}
          {linhaTecnicaGeada(analise.geada)}{' '}
          (NASA POWER, mínima do ar a 2 m de até {analise.geada.limiar_c} °C, {analise.geada.periodo_inicio}–{analise.geada.periodo_fim};
          faixa = intervalo de Wilson pelo número de anos; não inclui o erro da grade nem o ar vs. folha.)
        </p>
      )}
      {analise.precipitacao_extrema && (
        <p>
          <strong>Chuva extrema:</strong> {fraseChuvaExtrema(analise.precipitacao_extrema)}
        </p>
      )}
      {analise.tendencia_hidrica && (
        <p>
          <strong>Chuva ao longo dos anos:</strong> {fraseTendencia(analise.tendencia_hidrica)}{' '}
          ({linhaTecnicaTendencia(analise.tendencia_hidrica)} NASA POWER é reanálise em grade, não pluviômetro.)
        </p>
      )}
      {analise.estresse_vegetal && (
        <p>
          <strong>Vigor da vegetação (NDVI):</strong> {fraseEstresse(analise.estresse_vegetal)}{' '}
          ({linhaTecnicaEstresse(analise.estresse_vegetal)} Queda do NDVI também é colheita ou senescência; confirmar no campo. Fonte das faixas e causas: {analise.estresse_vegetal.fonte_referencia}.)
        </p>
      )}

      {analise.estrategias.map(e => (
        <div key={e.estrategia_id} className="resumo-estrategia">
          <h2>{e.nome}</h2>
          <p><NomeCientificoCaminho estrategia={e} /></p>
          <p><strong>Pode ganhar:</strong> {e.beneficios.join(' ')}</p>
          <p><strong>Pode dar errado:</strong> {e.riscos.join(' ')}</p>
          <p><strong>Falta saber:</strong> {e.lacunas.join(' ')}</p>
        </div>
      ))}

      <h2>Anotações da conversa</h2>
      <div className="resumo-linhas" />
      <p className="resumo-rodape">Ferramenta de apoio. Não substitui a avaliação de um profissional no local.</p>
    </section>
  );
}
