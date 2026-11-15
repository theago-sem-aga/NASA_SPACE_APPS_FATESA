import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import { useId, useState } from 'react';
import type { TendenciaHidrica } from '../../api/tipos';
import { L as bi, localeAtual, traduzivel, tx } from '../../i18n/idioma';

// Só escreve e desenha o que a API mandou (app/domain/tendencia_hidrica.py).
// Arredondar para a dezena é apresentação; a conta é toda do backend.

const mm = (v: number) => `${Math.round(v).toLocaleString(localeAtual())} mm`;
const dezena = (v: number) => `${(Math.round(Math.abs(v) / 10) * 10).toLocaleString(localeAtual())} mm`;

export const ROTULO_TENDENCIA: Record<TendenciaHidrica['tendencia'], string> = traduzivel({
  secando: bi('Diminuindo', 'Decreasing'),
  estavel: bi('Sem mudança clara', 'No clear change'),
  mais_chuvoso: bi('Aumentando', 'Increasing')
});

/** Frase curta da tendência, também usada na narração e na folha impressa. */
export function fraseTendencia(t: TendenciaHidrica): string {
  const periodo = tx(`De ${t.periodo_inicio} a ${t.periodo_fim}`, `From ${t.periodo_inicio} to ${t.periodo_fim}`);
  if (t.tendencia === 'estavel') {
    const valores = t.anos.map(a => a.chuva_mm);
    return tx(
      `${periodo}, a chuva mudou muito de um ano para outro (de ${mm(Math.min(...valores))} a ${mm(Math.max(...valores))}), mas não vem aumentando nem diminuindo. Em média, chove ${mm(t.media_anual_mm)} por ano.`,
      `${periodo}, rain changed a lot from one year to the next (from ${mm(Math.min(...valores))} to ${mm(Math.max(...valores))}), but it is neither rising nor falling. On average, ${mm(t.media_anual_mm)} of rain falls per year.`
    );
  }
  const sentido = t.tendencia === 'secando' ? tx('diminuindo', 'decreasing') : tx('aumentando', 'increasing');
  const aMais = t.tendencia === 'secando' ? tx('a menos', 'less') : tx('a mais', 'more');
  return tx(
    `${periodo}, a chuva do ano vem ${sentido}: cerca de ${dezena(t.mm_por_decada)} ${aMais} a cada 10 anos. No começo chovia uns ${dezena(t.reta_inicio_mm)} por ano; hoje, uns ${dezena(t.reta_fim_mm)}. Não é acaso: a mudança se repete ao longo dos anos.`,
    `${periodo}, yearly rain has been ${sentido}: about ${dezena(t.mm_por_decada)} ${aMais} every 10 years. At the start it rained about ${dezena(t.reta_inicio_mm)} a year; today, about ${dezena(t.reta_fim_mm)}. It is not chance: the change repeats over the years.`
  );
}

/** Linha técnica para o agrônomo. */
export function linhaTecnicaTendencia(t: TendenciaHidrica): string {
  const p = t.p_valor < 0.001 ? tx('p < 0,001', 'p < 0.001') : `p = ${t.p_valor.toLocaleString(localeAtual(), { maximumFractionDigits: 3 })}`;
  const sinal = t.mm_por_decada > 0 ? '+' : '';
  return tx(
    `${sinal}${t.mm_por_decada.toLocaleString(localeAtual())} mm/década (${sinal}${t.pct_por_decada.toLocaleString(localeAtual())}%/década), ${p}; média ${mm(t.media_anual_mm)}/ano; ${t.metodo}, ${t.periodo_inicio}–${t.periodo_fim}.`,
    `${sinal}${t.mm_por_decada.toLocaleString(localeAtual())} mm/decade (${sinal}${t.pct_por_decada.toLocaleString(localeAtual())}%/decade), ${p}; mean ${mm(t.media_anual_mm)}/year; Mann-Kendall (5%) + Sen’s slope on yearly rain, ${t.periodo_inicio}–${t.periodo_fim}.`
  );
}

// Geometria do gráfico (unidades do viewBox; o SVG escala com a largura).
const L = 320;
const A = 150;
const M = { topo: 14, base: 20, esq: 4, dir: 4 };
const VAO = 2; // espaço entre barras (spacer)

/**
 * Chuva de cada ano (barras) com a reta de tendência por cima.
 * Uma série só: o título nomeia; sem legenda. Tocar ou passar o mouse numa barra mostra o ano.
 */
export function FaixaTendenciaHidrica({ tendencia }: { tendencia: TendenciaHidrica }) {
  const id = useId();
  const [ativo, setAtivo] = useState<number | null>(null);
  const anos = tendencia.anos;
  const maximo = Math.max(...anos.map(a => a.chuva_mm), tendencia.reta_inicio_mm, tendencia.reta_fim_mm);
  const largura = (L - M.esq - M.dir) / anos.length;
  const altura = A - M.topo - M.base;
  const y = (v: number) => M.topo + altura - (Math.max(0, v) / maximo) * altura;
  const x = (i: number) => M.esq + i * largura;
  const anoAtivo = ativo !== null ? anos[ativo] : null;

  return (
    <div className="faixa-tendencia">
      <p className="faixa-tendencia-frase">{fraseTendencia(tendencia)}</p>
      <SeloFonte fonte={tendencia.fonte} />
      <figure className="grafico-chuva-anos">
        <figcaption id={`${id}-titulo`} className="grafico-chuva-anos-titulo">
          {tx('Chuva de cada ano (mm) e a linha da tendência', 'Rain each year (mm) and the trend line')}
        </figcaption>
        <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-labelledby={`${id}-titulo`} onMouseLeave={() => setAtivo(null)}>
          {/* Escala: só a referência do maior valor, discreta. */}
          <line x1={M.esq} x2={L - M.dir} y1={y(maximo)} y2={y(maximo)} className="grafico-grade" />
          <text x={M.esq} y={y(maximo) - 4} className="grafico-eixo-texto">{mm(maximo)}</text>
          <line x1={M.esq} x2={L - M.dir} y1={y(0)} y2={y(0)} className="grafico-base" />
          {anos.map((a, i) => {
            const topo = y(a.chuva_mm);
            const w = Math.max(1, largura - VAO);
            const h = y(0) - topo;
            const r = Math.min(2, w / 2, h);
            return (
              <g key={a.ano}>
                <path
                  className={`grafico-barra${ativo === i ? ' ativa' : ''}`}
                  d={`M${x(i)},${y(0)} v${-(h - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${h - r} z`}
                />
                {/* Alvo de toque maior que a barra (altura toda). */}
                <rect
                  x={x(i)}
                  y={M.topo}
                  width={largura}
                  height={altura}
                  fill="transparent"
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => setAtivo(ativo === i ? null : i)}
                />
              </g>
            );
          })}
          <line
            x1={x(0) + largura / 2}
            y1={y(tendencia.reta_inicio_mm)}
            x2={x(anos.length - 1) + largura / 2}
            y2={y(tendencia.reta_fim_mm)}
            className={`grafico-tendencia grafico-tendencia-${tendencia.tendencia}`}
          />
          <text x={M.esq} y={A - 5} className="grafico-eixo-texto">{tendencia.periodo_inicio}</text>
          <text x={L - M.dir} y={A - 5} textAnchor="end" className="grafico-eixo-texto">{tendencia.periodo_fim}</text>
        </svg>
        <p className="grafico-chuva-anos-detalhe" aria-live="polite">
          {anoAtivo
            ? tx(`${anoAtivo.ano}: choveu ${mm(anoAtivo.chuva_mm)}.`, `${anoAtivo.ano}: ${mm(anoAtivo.chuva_mm)} of rain.`)
            : tx('Toque numa barra para ver o ano.', 'Tap a bar to see the year.')}
        </p>
        <table className="visualmente-oculto">
          <caption>{tx('Chuva de cada ano, em milímetros', 'Rain each year, in millimeters')}</caption>
          <thead>
            <tr><th scope="col">{tx('Ano', 'Year')}</th><th scope="col">{tx('Chuva (mm)', 'Rain (mm)')}</th></tr>
          </thead>
          <tbody>
            {anos.map(a => (
              <tr key={a.ano}><th scope="row">{a.ano}</th><td>{Math.round(a.chuva_mm)}</td></tr>
            ))}
          </tbody>
        </table>
      </figure>
      <details className="como-ler">
        <summary>{tx('Como ler este dado', 'How to read this')}</summary>
        <p className="termos-relacionados">{tx('Palavras deste quadro:', 'Words in this box:')} <Termo id="balanco_hidrico" /> <Termo id="anomalia_umidade" /> <Termo id="grace" /></p>
        <p className="texto-apoio faixa-tendencia-legenda">
          {tx(
            'Barras = chuva somada de cada ano (NASA POWER). Linha = tendência. É dado de satélite e modelo em grade, não de pluviômetro: antes de uma decisão cara, confira com a estação mais perto. O passado não garante o futuro.',
            'Bars = total rain each year (NASA POWER). Line = trend. It is satellite and gridded model data, not a rain gauge: before a costly decision, check against the nearest weather station. The past does not guarantee the future.'
          )}
        </p>
      </details>
    </div>
  );
}
