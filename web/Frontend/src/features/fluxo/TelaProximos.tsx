import type { Analise } from '../../api/tipos';
import { Icone, type NomeIcone } from '../../components/Icone';
import { Pictograma } from '../../components/Pictograma';
import { ResumoVisual } from '../../components/ResumoVisual';
import type { DadosFluxo } from './estadoFluxo';

interface TelaProximosProps {
  dados: DadosFluxo;
  analise: Analise;
  aoVoltar: () => void;
  aoRecomecar: () => void;
  aoVerColheita: () => void;
}

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  {
    icone: 'pessoa',
    titulo: 'Mostre ao agrônomo',
    texto: 'Da usina, da cooperativa ou da Casa da Agricultura.'
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

export function TelaProximos({ dados, analise, aoVoltar, aoRecomecar, aoVerColheita }: TelaProximosProps) {
  return (
    <>
      <h1 tabIndex={-1}>Seu resumo</h1>
      <ResumoVisual dados={dados} analise={analise} compacto />

      <button type="button" className="botao botao-primario botao-largo" onClick={() => window.print()}>
        <Icone nome="imprimir" /> Imprimir ou salvar
      </button>

      <h2 className="titulo-secao">Antes de bater o martelo</h2>
      <ol className="lista-passos">
        {PASSOS.map((p, i) => (
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

      <button type="button" className="atalho-colheita" onClick={aoVerColheita}>
        <Pictograma nome="saco" tamanho={48} />
        <span>
          <strong>Como foi a colheita na cidade</strong>
          <span className="texto-apoio">E o que esperar se o ano for seco ou chuvoso</span>
        </span>
        <Icone nome="seguir" />
      </button>

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
