import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Icone } from '../../components/Icone';
import { Pictograma, type NomePictograma } from '../../components/Pictograma';

export interface SlideClima {
  id: string;
  titulo: string;
  pictograma: NomePictograma;
  conteudo: ReactNode;
}

/**
 * As explicações de clima do talhão (geada, chuva forte, chuva ao longo dos anos)
 * uma por vez: arrasta para o lado ou usa ‹ ›, e as bolinhas mostram qual está à vista.
 * Mesmo visual do carrossel dos caminhos (classes .carrossel-*).
 */
export function CarrosselClima({ slides }: { slides: SlideClima[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const total = slides.length;

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

  // O trilho fica com a altura do item à vista (os itens têm alturas bem diferentes).
  // Também acompanha mudanças de altura dentro do item (ex.: abrir "Como ler este dado").
  useLayoutEffect(() => {
    const el = trilho.current;
    const item = el?.children[atual] as HTMLElement | undefined;
    if (!el || !item) return;
    const ajustar = () => {
      el.style.height = `${item.offsetHeight}px`;
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(item);
    return () => observador.disconnect();
  }, [atual, total]);

  if (total === 0) return null;

  return (
    <section className="carrossel carrossel-clima" aria-roledescription="carrossel" aria-labelledby="titulo-chuva-geada">
      <h2 id="titulo-chuva-geada" className="titulo-secao carrossel-clima-titulo">Chuva e geada</h2>
      {total > 1 && (
        <div className="carrossel-topo">
          <button type="button" className="carrossel-seta" onClick={() => irPara(atual - 1)} aria-disabled={atual === 0 || undefined} aria-label="Anterior">
            <Icone nome="voltar" />
          </button>
          <div className="carrossel-posicao">
            <span aria-live="polite">
              {slides[atual].titulo} · {atual + 1} de {total}
            </span>
            <span className="carrossel-bolinhas">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`carrossel-bolinha ${i === atual ? 'carrossel-bolinha-atual' : ''}`}
                  onClick={() => irPara(i)}
                  aria-label={`Ver ${s.titulo}`}
                  aria-current={i === atual || undefined}
                />
              ))}
            </span>
          </div>
          <button type="button" className="carrossel-seta" onClick={() => irPara(atual + 1)} aria-disabled={atual === total - 1 || undefined} aria-label="Próximo">
            <Icone nome="seguir" />
          </button>
        </div>
      )}
      <div ref={trilho} className="carrossel-trilho" onScroll={aoRolar}>
        {slides.map((s, i) => (
          <div key={s.id} className="carrossel-item" role="group" aria-roledescription="item" aria-label={`${i + 1} de ${total}: ${s.titulo}`}>
            <article className="carrossel-clima-cartao">
              <h3 className="carrossel-clima-cabeca">
                <Pictograma nome={s.pictograma} tamanho={32} /> {s.titulo}
              </h3>
              {s.conteudo}
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
