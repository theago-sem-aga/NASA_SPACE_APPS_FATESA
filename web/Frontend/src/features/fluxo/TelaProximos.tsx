import type { Analise } from '../../api/tipos';
import { Icone, type NomeIcone } from '../../components/Icone';
import { ResumoVisual } from '../../components/ResumoVisual';
import type { DadosFluxo } from './estadoFluxo';
import { vocabulario } from './vocabularioCultura';

interface TelaProximosProps {
  dados: DadosFluxo;
  analise: Analise;
  aoVoltar: () => void;
  aoRecomecar: () => void;
  aoAcompanhar: () => void;
}

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  {
    icone: 'pessoa',
    titulo: 'Mostre ao agrônomo',
    // Trocado pelo vocabulário da cultura na hora de mostrar.
    texto: ''
  },
  {
    icone: 'tubo',
    titulo: 'Faça a análise de solo',
    texto: 'Se desconfia de nematoide, peça essa também.'
  },
  {
    icone: 'calendario',
    titulo: 'Veja a época de plantar',
    texto: 'No aplicativo Plantio Certo.'
  }
];

export function TelaProximos({ dados, analise, aoVoltar, aoRecomecar, aoAcompanhar }: TelaProximosProps) {
  const v = vocabulario(dados.cultura_atual_id, dados.nomeCultura);
  const passos = PASSOS.map(p => (p.icone === 'pessoa' ? { ...p, texto: v.ondeAgronomo } : p));
  return (
    <>
      <h1 tabIndex={-1}>Seu resumo</h1>
      <ResumoVisual dados={dados} analise={analise} compacto />

      <button type="button" className="botao botao-primario botao-largo" onClick={() => window.print()}>
        <Icone nome="imprimir" /> Imprimir ou salvar
      </button>

      <button type="button" className="botao botao-contorno botao-largo" onClick={aoAcompanhar}>
        <Icone nome="local" /> Acompanhar a área pelo satélite
      </button>

      <h2 className="titulo-secao">Antes de bater o martelo</h2>
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
        A decisão é sua. A ferramenta só ajuda a pensar.
      </p>

      {analise.limitacoes.length > 0 && (
        <details className="detalhes cartao">
          <summary>O que a ferramenta não vê</summary>
          <ul>
            {analise.limitacoes.map(l => <li key={l}>{l}</li>)}
          </ul>
        </details>
      )}

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoRecomecar}>
          Começar de novo
        </button>
      </div>
    </>
  );
}
