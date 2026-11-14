import { SINALIZAR_MOCK } from '../../api/cliente';
import type { Analise, AtributosEstrategia, PrioridadeId } from '../../api/tipos';
import { AvisoDemonstracao } from '../../components/AvisoDemonstracao';
import { FaixaRotacao } from '../../components/FaixaRotacao';
import { Icone } from '../../components/Icone';
import { Medidor } from '../../components/Medidor';
import { Pictograma } from '../../components/Pictograma';
import { Termo } from '../../components/Termo';
import { PICTO_ATRIBUTO, PICTO_PRIORIDADE, ROTULO_ATRIBUTO, ROTULO_CONFIANCA, ROTULO_PRIORIDADE } from './rotulos';

interface TelaEstrategiasProps {
  analise: Analise;
  prioridades: PrioridadeId[];
  aoAbrir: (estrategiaId: string) => void;
  aoVoltar: () => void;
  aoComparar: () => void;
}

/** Três critérios mostrados direto no cartão; o resto fica na comparação. */
const DESTAQUES: (keyof AtributosEstrategia)[] = ['protecao_solo', 'renda_direta', 'trabalho_custo'];

export function TelaEstrategias({ analise, prioridades, aoAbrir, aoVoltar, aoComparar }: TelaEstrategiasProps) {
  return (
    <>
      <AvisoDemonstracao ehMock={analise.eh_mock} />
      <h1 tabIndex={-1}>{analise.estrategias.length} caminhos para a reforma{analise.descricao_local ? ` em ${analise.descricao_local}` : ''}</h1>
      <p className="texto-apoio">
        O primeiro é o que você já faz. Toque num caminho para ver tudo sobre ele. <Termo id="reforma">O que é a reforma?</Termo>
        {analise.eh_mock && SINALIZAR_MOCK && ' Nesta demonstração a ordem é sempre a mesma.'}
      </p>

      <ol className="lista-estrategias">
        {analise.estrategias.map(e => {
          const atendidas = e.prioridades_atendidas.filter(p => prioridades.includes(p));
          const mesesDescobertos = e.calendario.filter(m => m.cobertura === 'solo_descoberto').length;
          return (
            <li key={e.estrategia_id}>
              <button type="button" className="cartao-estrategia" onClick={() => aoAbrir(e.estrategia_id)}>
                <span className="cartao-estrategia-topo">
                  {e.eh_pratica_atual && <span className="etiqueta etiqueta-neutra">O que você faz hoje</span>}
                  <span className="cartao-estrategia-nome">{e.nome}</span>
                </span>
                <FaixaRotacao etapas={e.etapas_rotacao} tamanho={40} />
                <span className="mini-painel">
                  {DESTAQUES.map(a => (
                    <span key={a} className="mini-painel-item">
                      <Pictograma nome={PICTO_ATRIBUTO[a]} tamanho={32} />
                      <span className="mini-painel-texto">
                        <span className="mini-painel-rotulo">{ROTULO_ATRIBUTO[a].nome}</span>
                        <Medidor nivel={e.atributos[a]} bom={ROTULO_ATRIBUTO[a].maiorEhMelhor} />
                      </span>
                    </span>
                  ))}
                </span>
                <span className="etiquetas">
                  {atendidas.map(p => (
                    <span key={p} className="etiqueta etiqueta-positiva etiqueta-com-figura">
                      <Pictograma nome={PICTO_PRIORIDADE[p]} tamanho={20} semFundo /> {ROTULO_PRIORIDADE[p].nome}
                    </span>
                  ))}
                  <span className={`etiqueta ${mesesDescobertos > 0 ? 'etiqueta-atencao' : 'etiqueta-positiva'}`}>
                    {mesesDescobertos === 0
                      ? 'Terra sempre coberta'
                      : `Terra descoberta ${mesesDescobertos} ${mesesDescobertos === 1 ? 'mês' : 'meses'}`}
                  </span>
                  <span className="etiqueta etiqueta-neutra">{ROTULO_CONFIANCA[e.confianca]}</span>
                </span>
                <span className="cartao-estrategia-acao">
                  Ver tudo sobre este caminho <Icone nome="seguir" tamanho={20} />
                </span>
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
          Comparar lado a lado <Icone nome="seguir" />
        </button>
      </div>
    </>
  );
}
