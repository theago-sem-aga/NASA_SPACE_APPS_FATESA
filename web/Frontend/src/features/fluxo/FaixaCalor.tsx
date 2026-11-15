import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import { useState } from 'react';
import type { CalorMensal, EstresseTermico } from '../../api/tipos';
import { Pictograma } from '../../components/Pictograma';
import { NOME_MES, NOME_MES_CURTO } from './rotulos';
import { localeAtual, tx } from '../../i18n/idioma';

/** Cor do mês pela maior máxima registrada: quanto mais quente, mais forte. */
const tomCalor = (c: number, limiar: number) => (c >= limiar + 6 ? 'temp-quente-3' : c >= limiar + 3 ? 'temp-quente-2' : c >= limiar ? 'temp-quente-1' : 'temp-neutra');
const grau = (c: number) => `${c.toLocaleString(localeAtual(), { maximumFractionDigits: 1 })} °C`;
const dias = (d: number) => {
  const n = Math.round(d);
  return n === 1 ? tx('1 dia', '1 day') : tx(`${n} dias`, `${n} days`);
};

/** Frase principal, em linguagem simples. */
export function fraseCalor(c: EstresseTermico): string {
  if (c.meses_com_risco.length === 0) {
    return tx(
      `Em ${c.anos_analisados} anos, o calor forte (acima de ${grau(c.limiar_c)}) foi raro em todos os meses.`,
      `In ${c.anos_analisados} years, strong heat (above ${grau(c.limiar_c)}) was rare in every month.`
    );
  }
  const nomes = c.meses_com_risco.map(m => tx(NOME_MES[m - 1].toLowerCase(), NOME_MES[m - 1]));
  const lista = nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(', ')} ${tx('e', 'and')} ${nomes[nomes.length - 1]}`;
  const pior = c.mes_mais_arriscado ? c.meses[c.mes_mais_arriscado - 1] : null;
  const frasePior = pior
    ? tx(
        ` O pior é ${NOME_MES[pior.mes - 1].toLowerCase()}: em média, ${dias(pior.dias_calor_medio)} por ano passam de ${grau(c.limiar_c)}.`,
        ` The worst is ${NOME_MES[pior.mes - 1]}: on average, ${dias(pior.dias_calor_medio)} a year go above ${grau(c.limiar_c)}.`
      )
    : '';
  return tx(`Calor forte é comum em ${lista}.${frasePior}`, `Strong heat is common in ${lista}.${frasePior}`);
}

/** Cor da mínima: quanto mais frio, mais azul (mesmos cortes da faixa da geada). */
const tomFrio = (c: number | null) => (c === null ? 'temp-neutra' : c <= 2 ? 'temp-frio-3' : c <= 5 ? 'temp-frio-2' : c <= 10 ? 'temp-frio-1' : 'temp-neutra');

function detalheMes(m: CalorMensal, minima: number | null, anos: number, limiar: number): string {
  const nome = NOME_MES[m.mes - 1];
  const extremos = tx(
    `Máxima mais alta: ${grau(m.maior_maxima_c)}.${minima === null ? '' : ` Mínima mais baixa: ${grau(minima)}.`}`,
    `Highest high: ${grau(m.maior_maxima_c)}.${minima === null ? '' : ` Lowest low: ${grau(minima)}.`}`
  );
  if (m.anos_com_calor === 0)
    return tx(`${nome}: ${extremos} Em ${anos} anos, nenhum dia passou de ${grau(limiar)}.`, `${nome}: ${extremos} In ${anos} years, no day went above ${grau(limiar)}.`);
  return tx(
    `${nome}: ${extremos} Teve dia acima de ${grau(limiar)} em ${m.anos_com_calor} de ${anos} anos, em média ${dias(m.dias_calor_medio)} por ano.`,
    `${nome}: ${extremos} There were days above ${grau(limiar)} in ${m.anos_com_calor} of ${anos} years, ${dias(m.dias_calor_medio)} a year on average.`
  );
}

/**
 * Temperatura mês a mês, como tabela: a máxima mais alta e a mínima mais baixa já
 * medidas em cada mês (NASA POWER), com cor (quente / frio). O sol marca os meses de
 * calor forte. `minimas` vem da geada (menor_minima_c de cada mês), quando houver.
 * O front só exibe; a conta é do backend (ver api/mock/calorMock.ts).
 */
export function FaixaCalor({ calor, minimas }: { calor: EstresseTermico; minimas?: (number | null)[] }) {
  const risco = new Set(calor.meses_com_risco);
  const [aberto, setAberto] = useState<number | null>(null);
  const mesAberto = aberto ? calor.meses[aberto - 1] : null;
  const minimaDo = (mes: number) => minimas?.[mes - 1] ?? null;
  const temMinima = (minimas ?? []).some(v => v !== null);
  return (
    <div className="faixa-geada faixa-calor">
      <p className="faixa-geada-frase">{fraseCalor(calor)}</p>
      <SeloFonte fonte={calor.fonte} />
      <div className="tabela-temperatura" role="group" aria-label={tx('Temperatura mês a mês. Toque num mês para ver o detalhe.', 'Temperature month by month. Tap a month to see the detail.')}>
        <span className="tabela-temperatura-rotulo" aria-hidden="true" />
        {calor.meses.map(m => (
          <button
            key={m.mes}
            type="button"
            className={`tabela-temperatura-mes${aberto === m.mes ? ' aberto' : ''}${risco.has(m.mes) ? ' com-risco' : ''}`}
            aria-label={detalheMes(m, minimaDo(m.mes), calor.anos_analisados, calor.limiar_c)}
            aria-pressed={aberto === m.mes}
            onClick={() => setAberto(aberto === m.mes ? null : m.mes)}
          >
            <span aria-hidden="true">{NOME_MES_CURTO[m.mes - 1]}</span>
            <span className="tabela-temperatura-sol" aria-hidden="true">{risco.has(m.mes) ? <Pictograma nome="calor" tamanho={18} /> : null}</span>
          </button>
        ))}
        <span className="tabela-temperatura-rotulo" aria-hidden="true">{tx('Máxima', 'High')}</span>
        {calor.meses.map(m => (
          <span key={m.mes} className={`tabela-temperatura-valor ${tomCalor(m.maior_maxima_c, calor.limiar_c)}`} aria-hidden="true">
            {Math.round(m.maior_maxima_c)}°
          </span>
        ))}
        {temMinima && (
          <>
            <span className="tabela-temperatura-rotulo" aria-hidden="true">{tx('Mínima', 'Low')}</span>
            {calor.meses.map(m => {
              const v = minimaDo(m.mes);
              return (
                <span key={m.mes} className={`tabela-temperatura-valor ${tomFrio(v)}`} aria-hidden="true">
                  {v === null ? '–' : `${Math.round(v)}°`}
                </span>
              );
            })}
          </>
        )}
      </div>
      <p className="faixa-temperatura-legenda">
        <span>
          <strong>{tx('Máxima', 'High')}</strong>{' '}
          {tx(
            `= a temperatura mais alta já medida em cada mês, de ${calor.periodo_inicio} a ${calor.periodo_fim}. Não é a média.`,
            `= the highest temperature ever measured in each month, from ${calor.periodo_inicio} to ${calor.periodo_fim}. It is not the average.`
          )}
        </span>
        <span className="escala-temperatura escala-quente" aria-hidden="true">
          <span className="temp-neutra">{tx('até', 'up to')} {Math.round(calor.limiar_c - 1)}°</span>
          <span className="temp-quente-1">{Math.round(calor.limiar_c)}°+</span>
          <span className="temp-quente-2">{Math.round(calor.limiar_c + 3)}°+</span>
          <span className="temp-quente-3">{Math.round(calor.limiar_c + 6)}°+</span>
        </span>
      </p>
      <p className="faixa-geada-detalhe" aria-live="polite">
        {mesAberto ? detalheMes(mesAberto, minimaDo(mesAberto.mes), calor.anos_analisados, calor.limiar_c) : tx('Toque num mês para ver o detalhe.', 'Tap a month to see the detail.')}
      </p>
      <details className="como-ler">
        <summary>{tx('Como ler este dado', 'How to read this')}</summary>
        <p className="termos-relacionados">{tx('Palavras deste quadro:', 'Words in this box:')} <Termo id="estresse_termico" /> <Termo id="dado_em_grade" /></p>
        <p className="texto-apoio">
          {tx(
            `Não é a média: é o recorde de cada mês, a temperatura do ar mais alta já medida, de ${calor.periodo_inicio} a ${calor.periodo_fim} (NASA POWER). A cor fica mais forte quanto mais quente. O sol marca os meses com dia acima de ${grau(calor.limiar_c)} em pelo menos metade dos anos. Esse limite ainda é uma proposta da equipe, sem fonte agronômica confirmada para cada cultura.`,
            `It is not the average: it is each month’s record, the highest air temperature ever measured, from ${calor.periodo_inicio} to ${calor.periodo_fim} (NASA POWER). The hotter, the stronger the color. The sun marks months with a day above ${grau(calor.limiar_c)} in at least half of the years. That threshold is still a team proposal, with no confirmed agronomic source for each crop.`
          )}
        </p>
      </details>
    </div>
  );
}
