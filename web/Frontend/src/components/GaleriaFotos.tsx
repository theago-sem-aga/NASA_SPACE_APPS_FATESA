import { useCallback, useEffect, useRef, useState } from 'react';
import { Foto } from './Foto';
import { Icone } from './Icone';
import type { ImagemGaleria } from './imagens';

/**
 * Fotos que passam para o lado (arrastar ou setas), com bolinhas mostrando qual
 * está à vista. Cada foto tem rodapé com onde é e a fonte. Mesmo visual do
 * carrossel dos caminhos (classes .carrossel-*).
 *
 * Gira como roleta: depois da última vem de novo a primeira, sempre andando para
 * a frente. Para isso há uma cópia da primeira foto no fim do trilho; ao chegar
 * nela, o trilho pula sem animação para a primeira de verdade (que é idêntica,
 * então não se nota o pulo).
 *
 * Passa sozinha a cada INTERVALO_MS. Para ser acessível, a passagem automática:
 *  - para enquanto o mouse ou o foco do teclado estão na galeria, e quando a pessoa toca nela;
 *  - não começa se o aparelho pede menos movimento (prefers-reduced-motion);
 *  - tem botão de pausar/continuar.
 */
const INTERVALO_MS = 3000;
/** Tempo para a animação de rolagem terminar antes do pulo invisível. */
const FIM_DA_ROLAGEM_MS = 600;

const preferePoucoMovimento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function GaleriaFotos({ fotos, rotulo }: { fotos: ImagemGaleria[]; rotulo: string }) {
  const trilho = useRef<HTMLDivElement>(null);
  const total = fotos.length;
  /** Posição no trilho: 0..total-1 são as fotos; `total` é a cópia da primeira. */
  const [posicao, setPosicao] = useState(0);
  const atual = posicao % total;
  /** Escolha da pessoa no botão pausar/continuar. */
  const [automatico, setAutomatico] = useState(() => !preferePoucoMovimento());
  /** Pausa enquanto o mouse/foco está na galeria ou a pessoa está arrastando. */
  const [emUso, setEmUso] = useState(false);

  const rolarAte = useCallback((i: number, suave: boolean) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: suave ? 'smooth' : 'instant' });
    setPosicao(i);
  }, []);

  const aoRolar = useCallback(() => {
    const el = trilho.current;
    if (!el || el.clientWidth === 0) return;
    setPosicao(Math.max(0, Math.min(total, Math.round(el.scrollLeft / el.clientWidth))));
  }, [total]);

  const proxima = () => rolarAte(Math.min(posicao + 1, total), true);
  const anterior = () => {
    if (posicao > 0) return rolarAte(posicao - 1, true);
    // Na primeira: pula para a cópia (igual à primeira) e anda para trás até a última.
    rolarAte(total, false);
    requestAnimationFrame(() => rolarAte(total - 1, true));
  };

  // Chegou na cópia da primeira: quando a animação terminar, pula para a primeira de verdade.
  useEffect(() => {
    if (posicao !== total) return;
    const t = window.setTimeout(() => rolarAte(0, false), FIM_DA_ROLAGEM_MS);
    return () => window.clearTimeout(t);
  }, [posicao, total, rolarAte]);

  // Um temporizador por foto: trocar de foto (sozinha ou pelos botões) recomeça a contagem.
  useEffect(() => {
    if (!automatico || emUso || total < 2 || posicao === total) return;
    const t = window.setTimeout(() => rolarAte(posicao + 1, true), INTERVALO_MS);
    return () => window.clearTimeout(t);
  }, [posicao, automatico, emUso, total, rolarAte]);

  // Mantém a foto certa à vista se a janela mudar de largura.
  useEffect(() => {
    const aoRedimensionar = () => trilho.current?.scrollTo({ left: atual * trilho.current.clientWidth, behavior: 'instant' });
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, [atual]);

  return (
    <section
      className="carrossel galeria"
      aria-roledescription="carrossel"
      aria-label={rotulo}
      onMouseEnter={() => setEmUso(true)}
      onMouseLeave={() => setEmUso(false)}
      onFocus={() => setEmUso(true)}
      onBlur={e => !e.currentTarget.contains(e.relatedTarget as Node | null) && setEmUso(false)}
      onTouchStart={() => setEmUso(true)}
      onTouchEnd={() => setEmUso(false)}
    >
      <div ref={trilho} className="carrossel-trilho" onScroll={aoRolar}>
        {fotos.map((f, i) => (
          <div key={f.src} className="carrossel-item" role="group" aria-roledescription="foto" aria-label={`${i + 1} de ${total}`}>
            <Foto imagem={f} legenda={f.legenda} classe="foto-destaque" />
          </div>
        ))}
        {/* Cópia da primeira foto, só para o giro contínuo. Invisível para leitor de tela e teclado. */}
        {total > 1 && (
          <div className="carrossel-item" aria-hidden="true" ref={el => el?.setAttribute('inert', '')}>
            <Foto imagem={fotos[0]} legenda={fotos[0].legenda} classe="foto-destaque" />
          </div>
        )}
      </div>
      <div className="carrossel-topo galeria-controles">
        <button type="button" className="carrossel-seta" onClick={anterior} aria-label="Foto anterior">
          <Icone nome="voltar" />
        </button>
        <span className="carrossel-bolinhas">
          {fotos.map((f, i) => (
            <button
              key={f.src}
              type="button"
              className={`carrossel-bolinha ${i === atual ? 'carrossel-bolinha-atual' : ''}`}
              onClick={() => rolarAte(i, true)}
              aria-label={`Ver foto ${i + 1} de ${total}`}
              aria-current={i === atual || undefined}
            />
          ))}
        </span>
        <button type="button" className="carrossel-seta" onClick={proxima} aria-label="Próxima foto">
          <Icone nome="seguir" />
        </button>
      </div>
      <button type="button" className="link-discreto galeria-pausa" onClick={() => setAutomatico(a => !a)} aria-pressed={!automatico}>
        {automatico ? 'Pausar as fotos' : 'Passar as fotos sozinhas'}
      </button>
    </section>
  );
}
