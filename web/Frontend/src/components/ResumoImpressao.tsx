import { SINALIZAR_MOCK } from '../api/cliente';
import type { Analise } from '../api/tipos';
import type { DadosFluxo } from '../features/fluxo/estadoFluxo';
import { fraseGeada, linhaTecnicaGeada } from '../features/fluxo/FaixaGeada';
import { NOME_MES } from '../features/fluxo/rotulos';
import { ResumoVisual } from './ResumoVisual';

/** Folha para levar ao agrônomo. Escondida na tela; só aparece na impressão / PDF. */
export function ResumoImpressao({ dados, analise }: { dados: DadosFluxo; analise: Analise }) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  return (
    <section className="resumo-impressao" aria-hidden="true">
      <h1>Rotação de culturas: resumo para o agrônomo</h1>
      <p>
        Gerado em {hoje}. {analise.eh_mock && SINALIZAR_MOCK && 'ATENÇÃO: dados de exemplo.'}
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

      {analise.estrategias.map(e => (
        <div key={e.estrategia_id} className="resumo-estrategia">
          <h2>{e.nome}</h2>
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
