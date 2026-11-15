import { Termo } from '../../components/Termo';
import { SeloFonte } from '../../components/SeloFonte';
import { useState } from 'react';
import type { GeadaMensal, RiscoGeada } from '../../api/tipos';
import { Pictograma } from '../../components/Pictograma';
import { NOME_MES, NOME_MES_CURTO, ROTULO_RISCO } from './rotulos';

// Tudo aqui só ARREDONDA e escreve o que a API mandou (app/domain/geada.py).
// A faixa (min/max) também vem pronta do backend; o front não refaz conta.

/** "em quantos de cada 10 anos". */
const emCada10 = (p: number) => Math.round(p * 10);
const grau = (c: number) => `${c.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`;
const pct = (p: number) => `${Math.round(p * 100)}%`;

/** "1 de cada 12 anos", para chance pequena que "em cada 10" arredondaria para zero. */
function umEmCada(p: number): string {
  return `1 de cada ${Math.max(2, Math.round(1 / p))} anos`;
}

/** Faixa em palavras: "entre 7 e 9 de cada 10 anos" (ou "até 1 de cada 12 anos" quando começa em zero). */
export function faixaEmPalavras(min: number, max: number): string {
  const a = emCada10(min);
  const b = emCada10(max);
  if (a === 0 && b <= 1) return `até ${umEmCada(max)}`;
  if (a === 0) return `até ${b} de cada 10 anos`;
  if (a === b) return `perto de ${a} de cada 10 anos`;
  return `entre ${a} e ${b} de cada 10 anos`;
}

/** Nível com o aviso da faixa: "Médio, pode ser alto". */
export function nivelComFaixa(g: RiscoGeada): string {
  const base = ROTULO_RISCO[g.nivel];
  return g.nivel_max !== g.nivel ? `${base}, pode ser ${ROTULO_RISCO[g.nivel_max].toLowerCase()}` : base;
}

/** Detalhe de um mês, em fala de técnico de campo. */
function detalheMes(m: GeadaMensal, anos: number): string {
  const nome = NOME_MES[m.mes - 1];
  if (m.anos_com_geada === 0) {
    // Sem a faixa aqui: ela é só estatística e diria "pode gear" até em pleno verão.
    // O risco de "nunca geou, mas pode" já aparece na frase do ano (fraseGeada).
    const frio = m.menor_minima_c !== null ? ` A noite mais fria foi de ${grau(m.menor_minima_c)}.` : '';
    return `${nome}: não geou em ${anos} anos.${frio}`;
  }
  return `${nome}: geou em ${m.anos_com_geada} dos ${anos} anos. O provável é gear em ${faixaEmPalavras(m.probabilidade_geada_min, m.probabilidade_geada_max)}.`;
}

/** Frase curta do risco de geada, também usada na narração e na folha impressa. */
export function fraseGeada(g: RiscoGeada): string {
  const faixa = faixaEmPalavras(g.probabilidade_ano_min, g.probabilidade_ano_max);
  if (g.probabilidade_ano === 0) {
    const maisFrio = g.meses
      .filter(m => m.menor_minima_c !== null)
      .reduce<GeadaMensal | null>((a, m) => (!a || (m.menor_minima_c as number) < (a.menor_minima_c as number) ? m : a), null);
    const frio = maisFrio ? ` A noite mais fria foi de ${grau(maisFrio.menor_minima_c as number)}, em ${NOME_MES[maisFrio.mes - 1]}.` : '';
    return `Em ${g.anos_analisados} anos, nenhuma noite esfriou a ponto de gear.${frio} Mesmo assim, pode gear em ${faixa}.`;
  }
  const pior = g.mes_mais_arriscado ? g.meses[g.mes_mais_arriscado - 1] : null;
  const anos =
    g.probabilidade_ano >= 1
      ? `Geou em todos os ${g.anos_analisados} anos.`
      : `Geou em ${Math.round(g.probabilidade_ano * g.anos_analisados)} dos ${g.anos_analisados} anos (o provável é ${faixa}).`;
  return pior
    ? `${anos} O mês mais perigoso é ${NOME_MES[pior.mes - 1]}: geou em ${pior.anos_com_geada} dos ${g.anos_analisados} anos.`
    : anos;
}

/** Linha técnica para o agrônomo: valor e faixa em %. */
export function linhaTecnicaGeada(g: RiscoGeada): string {
  const conf = pct(g.confianca_intervalo);
  const meses = g.meses
    .filter(m => m.probabilidade_geada > 0)
    .map(m => `${NOME_MES_CURTO[m.mes - 1]} ${pct(m.probabilidade_geada)} (${pct(m.probabilidade_geada_min)}–${pct(m.probabilidade_geada_max)})`);
  const ano = `Algum mês: ${pct(g.probabilidade_ano)} (IC ${conf}: ${pct(g.probabilidade_ano_min)}–${pct(g.probabilidade_ano_max)})`;
  return meses.length ? `${ano}. Por mês: ${meses.join('; ')}.` : `${ano}.`;
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
      <div className="tabela-temperatura" role="group" aria-label="Geada mês a mês. Toque num mês para ver o detalhe.">
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
        <span className="tabela-temperatura-rotulo" aria-hidden="true">Mínima</span>
        {geada.meses.map(m => (
          <span key={m.mes} className={`tabela-temperatura-valor ${tomFrio(m.menor_minima_c)}`} aria-hidden="true">
            {m.menor_minima_c === null ? '–' : `${Math.round(m.menor_minima_c)}°`}
          </span>
        ))}
      </div>
      <p className="faixa-temperatura-legenda">
        <span>
          <strong>Mínima</strong> = a temperatura mais baixa já medida em cada mês, de {geada.periodo_inicio} a {geada.periodo_fim}. Não é a média.
        </span>
        <span className="escala-temperatura escala-fria" aria-hidden="true">
          <span className="temp-neutra">acima de 10°</span>
          <span className="temp-frio-1">até 10°</span>
          <span className="temp-frio-2">até 5°</span>
          <span className="temp-frio-3">até 2°</span>
        </span>
      </p>
      <p className="faixa-geada-detalhe" aria-live="polite">
        {mesAberto ? detalheMes(mesAberto, geada.anos_analisados) : ''}
      </p>
      <details className="como-ler">
        <summary>Como ler este dado</summary>
        <p className="termos-relacionados">Palavras deste quadro: <Termo id="geada" /> <Termo id="dado_em_grade" /></p>
        <p className="texto-apoio faixa-geada-legenda">
          A linha Mínima mostra a temperatura do ar mais baixa já medida em cada mês (não é a média); quanto mais frio, mais azul. O floco marca os meses em que geou em pelo menos 1 de cada 10 anos. Toque no mês para ver em quantos anos geou e a faixa provável: com só{' '}
        {geada.anos_analisados} anos de dados, a conta tem folga para mais ou para menos. Noites com o ar a até{' '}
          {grau(geada.limiar_c)}, de {geada.periodo_inicio} a {geada.periodo_fim} (NASA POWER). Baixada e beira de rio
          geiam mais que isso, e essa diferença não entra na faixa.
        </p>
      </details>
    </div>
  );
}
