import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import { useState } from 'react';
import type { GeadaMensal, RiscoGeada } from '../../api/tipos';
import { Pictograma } from '../../components/Pictograma';
import { NOME_MES, NOME_MES_CURTO, ROTULO_RISCO } from './rotulos';
import { temperatura, tx } from '../../i18n/idioma';

// Tudo aqui só ARREDONDA e escreve o que a API mandou (app/domain/geada.py).
// A faixa (min/max) também vem pronta do backend; o front não refaz conta.

/** "em quantos de cada 10 anos". */
const emCada10 = (p: number) => Math.round(p * 10);
const grau = temperatura;
const pct = (p: number) => `${Math.round(p * 100)}%`;

/** "1 de cada 12 anos", para chance pequena que "em cada 10" arredondaria para zero. */
function umEmCada(p: number): string {
  const n = Math.max(2, Math.round(1 / p));
  return tx(`1 de cada ${n} anos`, `1 in every ${n} years`);
}

/** Faixa em palavras: "entre 7 e 9 de cada 10 anos" (ou "até 1 de cada 12 anos" quando começa em zero). */
export function faixaEmPalavras(min: number, max: number): string {
  const a = emCada10(min);
  const b = emCada10(max);
  if (a === 0 && b <= 1) return tx(`até ${umEmCada(max)}`, `up to ${umEmCada(max)}`);
  if (a === 0) return tx(`até ${b} de cada 10 anos`, `up to ${b} in every 10 years`);
  if (a === b) return tx(`perto de ${a} de cada 10 anos`, `about ${a} in every 10 years`);
  return tx(`entre ${a} e ${b} de cada 10 anos`, `between ${a} and ${b} in every 10 years`);
}

/** Nível com o aviso da faixa: "Médio, pode ser alto". */
export function nivelComFaixa(g: RiscoGeada): string {
  const base = ROTULO_RISCO[g.nivel];
  return g.nivel_max !== g.nivel ? tx(`${base}, pode ser ${ROTULO_RISCO[g.nivel_max].toLowerCase()}`, `${base}, could be ${ROTULO_RISCO[g.nivel_max].toLowerCase()}`) : base;
}

/** Detalhe de um mês, em fala de técnico de campo. */
function detalheMes(m: GeadaMensal, anos: number): string {
  const nome = NOME_MES[m.mes - 1];
  if (m.anos_com_geada === 0) {
    // Sem a faixa aqui: ela é só estatística e diria "pode gear" até em pleno verão.
    // O risco de "nunca geou, mas pode" já aparece na frase do ano (fraseGeada).
    const frio = m.menor_minima_c !== null ? tx(` A noite mais fria foi de ${grau(m.menor_minima_c)}.`, ` The coldest night was ${grau(m.menor_minima_c)}.`) : '';
    return tx(`${nome}: não geou em ${anos} anos.${frio}`, `${nome}: no frost in ${anos} years.${frio}`);
  }
  const faixa = faixaEmPalavras(m.probabilidade_geada_min, m.probabilidade_geada_max);
  return tx(
    `${nome}: geou em ${m.anos_com_geada} dos ${anos} anos. O provável é gear em ${faixa}.`,
    `${nome}: frost in ${m.anos_com_geada} of ${anos} years. Frost is likely in ${faixa}.`
  );
}

/** Frase curta do risco de geada, também usada na narração e na folha impressa. */
export function fraseGeada(g: RiscoGeada): string {
  const faixa = faixaEmPalavras(g.probabilidade_ano_min, g.probabilidade_ano_max);
  if (g.probabilidade_ano === 0) {
    const maisFrio = g.meses
      .filter(m => m.menor_minima_c !== null)
      .reduce<GeadaMensal | null>((a, m) => (!a || (m.menor_minima_c as number) < (a.menor_minima_c as number) ? m : a), null);
    const frio = maisFrio
      ? tx(
          ` A noite mais fria foi de ${grau(maisFrio.menor_minima_c as number)}, em ${NOME_MES[maisFrio.mes - 1]}.`,
          ` The coldest night was ${grau(maisFrio.menor_minima_c as number)}, in ${NOME_MES[maisFrio.mes - 1]}.`
        )
      : '';
    return tx(
      `Em ${g.anos_analisados} anos, nenhuma noite esfriou a ponto de gear.${frio} Mesmo assim, pode gear em ${faixa}.`,
      `In ${g.anos_analisados} years, no night got cold enough for frost.${frio} Even so, frost can happen in ${faixa}.`
    );
  }
  const pior = g.mes_mais_arriscado ? g.meses[g.mes_mais_arriscado - 1] : null;
  const anos =
    g.probabilidade_ano >= 1
      ? tx(`Geou em todos os ${g.anos_analisados} anos.`, `There was frost in all ${g.anos_analisados} years.`)
      : tx(
          `Geou em ${Math.round(g.probabilidade_ano * g.anos_analisados)} dos ${g.anos_analisados} anos (o provável é ${faixa}).`,
          `There was frost in ${Math.round(g.probabilidade_ano * g.anos_analisados)} of ${g.anos_analisados} years (likely ${faixa}).`
        );
  return pior
    ? tx(
        `${anos} O mês mais perigoso é ${NOME_MES[pior.mes - 1]}: geou em ${pior.anos_com_geada} dos ${g.anos_analisados} anos.`,
        `${anos} The riskiest month is ${NOME_MES[pior.mes - 1]}: frost in ${pior.anos_com_geada} of ${g.anos_analisados} years.`
      )
    : anos;
}

/** Linha técnica para o agrônomo: valor e faixa em %. */
export function linhaTecnicaGeada(g: RiscoGeada): string {
  const conf = pct(g.confianca_intervalo);
  const meses = g.meses
    .filter(m => m.probabilidade_geada > 0)
    .map(m => `${NOME_MES_CURTO[m.mes - 1]} ${pct(m.probabilidade_geada)} (${pct(m.probabilidade_geada_min)}–${pct(m.probabilidade_geada_max)})`);
  const ano = tx(
    `Algum mês: ${pct(g.probabilidade_ano)} (IC ${conf}: ${pct(g.probabilidade_ano_min)}–${pct(g.probabilidade_ano_max)})`,
    `Any month: ${pct(g.probabilidade_ano)} (${conf} CI: ${pct(g.probabilidade_ano_min)}–${pct(g.probabilidade_ano_max)})`
  );
  return meses.length ? `${ano}. ${tx('Por mês:', 'By month:')} ${meses.join('; ')}.` : `${ano}.`;
}

/**
 * Os 12 meses com um floco de neve onde costuma gear e o número de anos (em cada 10).
 * Tocar num mês mostra quantas vezes geou e a faixa provável.
 */
/** Cor do mês pela menor mínima registrada: quanto mais frio, mais azul. */
const tomFrio = (c: number | null) => (c === null ? 'temp-neutra' : c <= 2 ? 'temp-frio-3' : c <= 5 ? 'temp-frio-2' : c <= 10 ? 'temp-frio-1' : 'temp-neutra');

export function FaixaGeada({ geada }: { geada: RiscoGeada }) {
  const comRisco = new Set(geada.meses_com_risco);
  const [aberto, setAberto] = useState<number | null>(null);
  const mesAberto = aberto ? geada.meses[aberto - 1] : null;
  return (
    <div className="faixa-geada">
      <p className="faixa-geada-frase">{fraseGeada(geada)}</p>
      <SeloFonte fonte={geada.fonte} />
      <div className="tabela-temperatura" role="group" aria-label={tx('Geada mês a mês. Toque num mês para ver o detalhe.', 'Frost month by month. Tap a month to see the detail.')}>
        <span className="tabela-temperatura-rotulo" aria-hidden="true" />
        {geada.meses.map(m => {
          const risco = comRisco.has(m.mes);
          return (
            <button
              key={m.mes}
              type="button"
              className={`tabela-temperatura-mes${risco ? ' com-risco' : ''}${aberto === m.mes ? ' aberto' : ''}`}
              aria-label={detalheMes(m, geada.anos_analisados)}
              aria-pressed={aberto === m.mes}
              onClick={() => setAberto(aberto === m.mes ? null : m.mes)}
            >
              <span aria-hidden="true">{NOME_MES_CURTO[m.mes - 1]}</span>
              <span className="tabela-temperatura-sol" aria-hidden="true">{risco ? <Pictograma nome="geada" tamanho={18} /> : null}</span>
            </button>
          );
        })}
        <span className="tabela-temperatura-rotulo" aria-hidden="true">{tx('Mínima', 'Low')}</span>
        {geada.meses.map(m => (
          <span key={m.mes} className={`tabela-temperatura-valor ${tomFrio(m.menor_minima_c)}`} aria-hidden="true">
            {m.menor_minima_c === null ? '–' : temperatura(m.menor_minima_c, 0)}
          </span>
        ))}
      </div>
      <p className="faixa-temperatura-legenda">
        <span>
          <strong>{tx('Mínima', 'Low')}</strong>{' '}
          {tx(
            `= a temperatura mais baixa já medida em cada mês, de ${geada.periodo_inicio} a ${geada.periodo_fim}. Não é a média.`,
            `= the lowest temperature ever measured in each month, from ${geada.periodo_inicio} to ${geada.periodo_fim}. It is not the average.`
          )}
        </span>
        <span className="escala-temperatura escala-fria" aria-hidden="true">
          <span className="temp-neutra">{tx('acima de 10°', `above ${temperatura(10, 0)}`)}</span>
          <span className="temp-frio-1">{tx('até 10°', `up to ${temperatura(10, 0)}`)}</span>
          <span className="temp-frio-2">{tx('até 5°', `up to ${temperatura(5, 0)}`)}</span>
          <span className="temp-frio-3">{tx('até 2°', `up to ${temperatura(2, 0)}`)}</span>
        </span>
      </p>
      <p className="faixa-geada-detalhe" aria-live="polite">
        {mesAberto ? detalheMes(mesAberto, geada.anos_analisados) : ''}
      </p>
      <details className="como-ler">
        <summary>{tx('Como ler este dado', 'How to read this')}</summary>
        <p className="termos-relacionados">{tx('Palavras deste quadro:', 'Words in this box:')} <Termo id="geada" /> <Termo id="dado_em_grade" /></p>
        <p className="texto-apoio faixa-geada-legenda">
          {tx(
            `A linha Mínima mostra a temperatura do ar mais baixa já medida em cada mês (não é a média); quanto mais frio, mais azul. O floco marca os meses em que geou em pelo menos 1 de cada 10 anos. Toque no mês para ver em quantos anos geou e a faixa provável: com só ${geada.anos_analisados} anos de dados, a conta tem folga para mais ou para menos. Noites com o ar a até ${grau(geada.limiar_c)}, de ${geada.periodo_inicio} a ${geada.periodo_fim} (NASA POWER). Baixada e beira de rio geiam mais que isso, e essa diferença não entra na faixa.`,
            `The Low row shows the lowest air temperature ever measured in each month (not the average); the colder, the bluer. The snowflake marks months with frost in at least 1 in every 10 years. Tap a month to see in how many years there was frost and the likely range: with only ${geada.anos_analisados} years of data, the estimate has some slack either way. Nights with air at or below ${grau(geada.limiar_c)}, from ${geada.periodo_inicio} to ${geada.periodo_fim} (NASA POWER). Low-lying ground and riverbanks get more frost than this, and that difference is not in the range.`
          )}
        </p>
      </details>
    </div>
  );
}
