import { SINALIZAR_MOCK } from '../../api/cliente';
import type { Analise, AtributosEstrategia, CorrecoesTalhao, PrioridadeId } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { FaixaRotacao } from '../../components/FaixaRotacao';
import { Icone } from '../../components/Icone';
import { Medidor } from '../../components/Medidor';
import { Pictograma } from '../../components/Pictograma';
import { PainelTalhao } from './PainelTalhao';
import { PICTO_ATRIBUTO, PICTO_PRIORIDADE, ROTULO_ATRIBUTO, ROTULO_PRIORIDADE } from './rotulos';

interface TelaEstrategiasProps {
  analise: Analise;
  prioridades: PrioridadeId[];
  aoAbrir: (estrategiaId: string) => void;
  aoCorrigir: (correcoes: CorrecoesTalhao) => void;
  aoVoltar: () => void;
  aoComparar: () => void;
}

/** Três pontos mostrados direto no cartão; o resto fica no detalhe e na comparação. */
const DESTAQUES: (keyof AtributosEstrategia)[] = ['protecao_solo', 'renda_direta', 'trabalho_custo'];

export function TelaEstrategias({ analise, prioridades, aoAbrir, aoCorrigir, aoVoltar, aoComparar }: TelaEstrategiasProps) {
  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>{analise.estrategias.length} caminhos para a reforma</h1>
      {analise.eh_mock && SINALIZAR_MOCK && <p className="texto-apoio">Nesta demonstração a ordem é sempre a mesma.</p>}

      <PainelTalhao talhao={analise.talhao} aoCorrigir={aoCorrigir} />

      <ol className="lista-estrategias">
        {analise.estrategias.map(e => {
          const atendidas = e.prioridades_atendidas.filter(p => prioridades.includes(p));
          return (
            <li key={e.estrategia_id}>
              <button type="button" className="cartao-estrategia" onClick={() => aoAbrir(e.estrategia_id)}>
                <span className="cartao-estrategia-topo">
                  <span className="cartao-estrategia-nome">{e.nome}</span>
                  <Icone nome="seguir" tamanho={24} />
                </span>
                {e.eh_pratica_atual && <span className="etiqueta etiqueta-neutra">O jeito mais comum hoje</span>}
                <FaixaRotacao etapas={e.etapas_rotacao} tamanho={32} />
                <span className="mini-painel">
                  {DESTAQUES.map(a => (
                    <span key={a} className="mini-painel-item">
                      <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={28} />
                      <span className="mini-painel-rotulo">{ROTULO_ATRIBUTO[a].nome}</span>
                      <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                    </span>
                  ))}
                </span>
                {atendidas.length > 0 && (
                  <span className="etiquetas">
                    {atendidas.map(p => (
                      <span key={p} className="etiqueta etiqueta-positiva etiqueta-com-figura">
                        <Pictograma nome={PICTO_PRIORIDADE[p]} tamanho={20} semFundo /> {ROTULO_PRIORIDADE[p].nome}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="navegacao">
        <button type="button" className="botao botao-secundario" onClick={aoVoltar}>
          <Icone nome="voltar" /> Voltar
        </button>
        <button type="button" className="botao botao-primario" onClick={aoComparar}>
          Comparar <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
