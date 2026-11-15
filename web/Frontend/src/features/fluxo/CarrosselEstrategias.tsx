import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { AtributosEstrategia, Estrategia, Nivel, PrioridadeId, ProblemaId } from '../../api/tipos';
import { FaixaRotacao } from '../../components/FaixaRotacao';
import { NomeCientificoCaminho } from '../../components/NomeCientifico';
import { Icone } from '../../components/Icone';
import { ROTULO_PRIORIDADE, ROTULO_PROBLEMA } from './rotulos';

/**
 * Qual ponto do caminho responde a cada problema marcado. Só lê os atributos que já vêm
 * com o caminho; não muda a escolha do motor (BACKEND: o motor ainda não usa os problemas).
 */
export const PONTO_DO_PROBLEMA: Record<ProblemaId, keyof AtributosEstrategia> = {
  nematoides_pragas: 'quebra_pragas',
  solo_cansado: 'materia_organica',
  preco_baixo: 'renda_direta'
};
export const AJUDA_NIVEL: Record<Nivel, { texto: string; classe: string }> = {
  alto: { texto: 'ajuda bastante', classe: 'problema-ajuda-forte' },
  medio: { texto: 'ajuda', classe: 'problema-ajuda' },
  baixo: { texto: 'ajuda pouco', classe: 'problema-ajuda-pouca' },
  nenhum: { texto: 'não ajuda', classe: 'problema-ajuda-nada' }
};
import type { Vocabulario } from './vocabularioCultura';

interface CarrosselEstrategiasProps {
  problemas?: ProblemaId[];
  estrategias: Estrategia[];
  prioridades: PrioridadeId[];
  /** Vocabulário da cultura escolhida. */
  vocab: Vocabulario;
  /** Abre o detalhe completo do caminho (opcional: tudo o essencial já está no cartão). */
  aoAbrir: (estrategiaId: string) => void;
}

type Parte = 'resumo' | 'ganha' | 'cuidados' | 'agronomo';

const PARTES: { id: Parte; rotulo: string }[] = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'ganha', rotulo: 'O que ganha' },
  { id: 'cuidados', rotulo: 'Cuidados' },
  { id: 'agronomo', rotulo: 'Agrônomo' }
];

/** "a", "a e b", "a, b e c". */
function emFrase(itens: string[]) {
  return itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/**
 * Um caminho por vez: arrasta para o lado (ou usa ‹ ›) e as bolinhas mostram qual
 * está à vista. Dentro de cada caminho, abas trocam a parte sem abrir outra tela.
 */
export function CarrosselEstrategias({ estrategias, prioridades, problemas = [], vocab, aoAbrir }: CarrosselEstrategiasProps) {
  const id = useId();
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const total = estrategias.length;

  // Qual cartão está à vista, pela posição da rolagem (funciona com dedo, mouse e setas).
  const aoRolar = useCallback(() => {
    const el = trilho.current;
    if (!el || el.clientWidth === 0) return;
    setAtual(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / el.clientWidth))));
  }, [total]);

  const irPara = (i: number) => {
    const el = trilho.current;
    if (!el) return;
    const destino = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: destino * el.clientWidth, behavior: 'smooth' });
    setAtual(destino);
  };

  // Se a lista mudar (ex.: "Não é bem assim" refez os caminhos), volta ao primeiro.
  useEffect(() => {
    trilho.current?.scrollTo({ left: 0 });
    setAtual(0);
  }, [estrategias]);

  if (total === 0) return null;

  return (
    <section className="carrossel" aria-roledescription="carrossel" aria-label={`Caminhos para ${vocab.aPeriodo}`}>
      <div className="carrossel-topo">
        <button type="button" className="carrossel-seta" onClick={() => irPara(atual - 1)} aria-disabled={atual === 0 || undefined} aria-label="Caminho anterior">
          <Icone nome="voltar" />
        </button>
        <div className="carrossel-posicao">
          <span aria-live="polite">
            Caminho {atual + 1} de {total}
          </span>
          <span className="carrossel-bolinhas">
            {estrategias.map((e, i) => (
              <button
                key={e.estrategia_id}
                type="button"
                className={`carrossel-bolinha ${i === atual ? 'carrossel-bolinha-atual' : ''}`}
                onClick={() => irPara(i)}
                aria-label={`Ver caminho ${i + 1}: ${e.nome}`}
                aria-current={i === atual || undefined}
              />
            ))}
          </span>
        </div>
        <button type="button" className="carrossel-seta" onClick={() => irPara(atual + 1)} aria-disabled={atual === total - 1 || undefined} aria-label="Próximo caminho">
          <Icone nome="seguir" />
        </button>
      </div>

      <div ref={trilho} className="carrossel-trilho" onScroll={aoRolar}>
        {estrategias.map((e, i) => (
          <div
            key={e.estrategia_id}
            className="carrossel-item"
            role="group"
            aria-roledescription="caminho"
            aria-label={`${i + 1} de ${total}: ${e.nome}`}
          >
            <CartaoCaminho estrategia={e} prioridades={prioridades} problemas={problemas} vocab={vocab} idBase={`${id}-${i}`} aoAbrir={() => aoAbrir(e.estrategia_id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

interface CartaoCaminhoProps {
  vocab: Vocabulario;
  estrategia: Estrategia;
  prioridades: PrioridadeId[];
  problemas: ProblemaId[];
  idBase: string;
  aoAbrir: () => void;
}

function CartaoCaminho({ estrategia: e, prioridades, problemas, vocab, idBase, aoAbrir }: CartaoCaminhoProps) {
  const [parte, setParte] = useState<Parte>('resumo');
  const atendidas = e.prioridades_atendidas.filter(p => prioridades.includes(p));

  return (
    <article className="cartao carrossel-cartao">
      <div className="carrossel-cabeca">
        <h2 className="cartao-estrategia-nome">{e.nome}</h2>
        <NomeCientificoCaminho estrategia={e} />
        {e.eh_pratica_atual && <span className="etiqueta etiqueta-neutra">O jeito de hoje, para comparar</span>}
      </div>

      <div className="abas" role="tablist" aria-label="Partes deste caminho">
        {PARTES.map(p => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`${idBase}-aba-${p.id}`}
            aria-selected={parte === p.id}
            aria-controls={`${idBase}-painel`}
            className={`aba ${parte === p.id ? 'aba-atual' : ''}`}
            onClick={() => setParte(p.id)}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div id={`${idBase}-painel`} role="tabpanel" aria-labelledby={`${idBase}-aba-${parte}`} className="carrossel-painel">
        {parte === 'resumo' && (
          <>
            <FaixaRotacao etapas={e.etapas_rotacao} tamanho={36} />
            <p>{e.resumo}</p>
            {atendidas.length > 0 && (
              <p className="cartao-estrategia-ajuda">
                <Icone nome="ok" tamanho={20} />
                <span>Atende ao que você escolheu: {emFrase(atendidas.map(p => ROTULO_PRIORIDADE[p].nome.toLowerCase()))}</span>
              </p>
            )}
            {prioridades.length > 0 && atendidas.length === 0 && !e.eh_pratica_atual && (
              <p className="cartao-estrategia-ajuda cartao-estrategia-nao-atende">
                <Icone nome="info" tamanho={20} />
                <span>Não atende direto ao que você escolheu; entrou como a melhor opção que sobrou.</span>
              </p>
            )}
            {problemas.length > 0 && (
              <ul className="problemas-caminho" aria-label="Os problemas que você marcou">
                {problemas.map(pr => {
                  const a = AJUDA_NIVEL[e.atributos[PONTO_DO_PROBLEMA[pr]]];
                  return (
                    <li key={pr} className={a.classe}>
                      <strong>{ROTULO_PROBLEMA[pr]}:</strong> {a.texto}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        {parte === 'ganha' && (
          <ul className="lista-pontos">
            {e.beneficios.map(b => (
              <li key={b}>
                <Icone nome="ok" /> <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {parte === 'cuidados' && (
          <ul className="lista-pontos lista-cuidados">
            {e.riscos.map(r => (
              <li key={r}>
                <Icone nome="alerta" /> <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
        {parte === 'agronomo' && (
          <>
            <p className="texto-apoio">Pergunte ao agrônomo. {vocab.ondeAgronomo}</p>
            <p className="destaque destaque-neutro">“{e.pergunta_especialista}”</p>
          </>
        )}
      </div>

      <button type="button" className="botao botao-contorno botao-largo carrossel-detalhe" onClick={aoAbrir}>
        Ver tudo sobre este caminho <Icone nome="seguir" />
      </button>
    </article>
  );
}
