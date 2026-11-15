import type { Analise } from '../../api/tipos';
import { Icone, type NomeIcone } from '../../components/Icone';
import { ResumoVisual } from '../../components/ResumoVisual';
import type { DadosFluxo } from './estadoFluxo';
import { vocabulario } from './vocabularioCultura';
import { L, traduzivel, tx } from '../../i18n/idioma';

interface TelaProximosProps {
  dados: DadosFluxo;
  analise: Analise;
  aoVoltar: () => void;
  aoRecomecar: () => void;
  aoAcompanhar: () => void;
}

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = traduzivel([
  {
    icone: 'pessoa',
    titulo: L('Mostre ao agrônomo', 'Show it to an agronomist'),
    // Trocado pelo vocabulário da cultura na hora de mostrar.
    texto: ''
  },
  {
    icone: 'tubo',
    titulo: L('Faça a análise de solo', 'Get a soil test'),
    texto: L('Se desconfia de nematoide, peça essa também.', 'If you suspect nematodes, ask for that test too.')
  },
  {
    icone: 'calendario',
    titulo: L('Veja a época de plantar', 'Check the planting window'),
    texto: L('No aplicativo Plantio Certo.', 'In the Plantio Certo app (Brazil).')
  }
]);

export function TelaProximos({ dados, analise, aoVoltar, aoRecomecar, aoAcompanhar }: TelaProximosProps) {
  const v = vocabulario(dados.cultura_atual_id, dados.nomeCultura);
  const passos = PASSOS.map(p => (p.icone === 'pessoa' ? { ...p, texto: v.ondeAgronomo } : p));
  return (
    <>
      <h1 tabIndex={-1}>{tx('Seu resumo', 'Your summary')}</h1>
      <ResumoVisual dados={dados} analise={analise} compacto />

      <button type="button" className="botao botao-primario botao-largo" onClick={() => window.print()}>
        <Icone nome="imprimir" /> {tx('Imprimir ou salvar', 'Print or save')}
      </button>

      <button type="button" className="botao botao-contorno botao-largo" onClick={aoAcompanhar}>
        <Icone nome="local" /> {tx('Acompanhar a área pelo satélite', 'Follow the field by satellite')}
      </button>

      <h2 className="titulo-secao">{tx('Antes de bater o martelo', 'Before you make the call')}</h2>
      <ol className="lista-passos">
        {passos.map((p, i) => (
          <li key={p.icone} className="passo-item">
            <span className="passo-numero" aria-hidden="true">{i + 1}</span>
            <Icone nome={p.icone} tamanho={28} />
            <span>
              <strong className="passo-titulo">{p.titulo}</strong>
              {p.texto}
            </span>
          </li>
        ))}
      </ol>

      <p className="destaque destaque-neutro">
        {tx('A decisão é sua. A ferramenta só ajuda a pensar.', 'The decision is yours. The tool only helps you think it through.')}
      </p>

      {analise.limitacoes.length > 0 && (
        <details className="detalhes cartao">
          <summary>{tx('O que a ferramenta não vê', 'What the tool cannot see')}</summary>
          <ul>
            {analise.limitacoes.map(l => <li key={l}>{l}</li>)}
          </ul>
        </details>
      )}

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> {tx('Voltar', 'Back')}
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoRecomecar}>
          {tx('Começar de novo', 'Start over')}
        </button>
      </div>
    </>
  );
}
