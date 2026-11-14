import type { Analise } from '../../api/tipos';
import { Icone, type NomeIcone } from '../../components/Icone';
import { ResumoVisual } from '../../components/ResumoVisual';
import type { DadosFluxo } from './estadoFluxo';

interface TelaProximosProps {
  dados: DadosFluxo;
  analise: Analise;
  aoVoltar: () => void;
  aoRecomecar: () => void;
}

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  {
    icone: 'pessoa',
    titulo: 'Converse com quem conhece a área',
    texto: 'Mostre este resumo ao agrônomo da usina, da cooperativa ou da Casa da Agricultura (CATI).'
  },
  {
    icone: 'tubo',
    titulo: 'Faça a análise de solo',
    texto: 'De 0 a 20 e de 20 a 40 cm. Se desconfia de nematoide, peça essa análise também.'
  },
  {
    icone: 'calendario',
    titulo: 'Confira a época de plantar',
    texto: 'O Zoneamento Agrícola (ZARC) mostra a melhor época no seu município, pelo app Plantio Certo.'
  }
];

export function TelaProximos({ dados, analise, aoVoltar, aoRecomecar }: TelaProximosProps) {
  return (
    <>
      <h1 tabIndex={-1}>Seu resumo</h1>
      <ResumoVisual dados={dados} analise={analise} />

      <button type="button" className="botao botao-primario botao-largo" onClick={() => window.print()}>
        <Icone nome="imprimir" /> Imprimir ou salvar em PDF
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

      <p className="destaque destaque-neutro">
        Quem conhece o talhão é você. A ferramenta junta informação e levanta perguntas. A decisão é sua, com quem acompanha a sua área.
      </p>

      {analise.limitacoes.length > 0 && (
        <details className="detalhes cartao">
          <summary>O que esta análise não leva em conta</summary>
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
