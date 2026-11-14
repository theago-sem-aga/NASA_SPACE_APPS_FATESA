import { SINALIZAR_MOCK } from '../api/cliente';
import type { Analise } from '../api/tipos';
import type { DadosFluxo } from '../features/fluxo/estadoFluxo';
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
