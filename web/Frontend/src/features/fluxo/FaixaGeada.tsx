import type { RiscoGeada } from '../../api/tipos';
import { Pictograma } from '../../components/Pictograma';
import { NOME_MES, NOME_MES_CURTO } from './rotulos';

/** "em quantos de cada 10 anos" — só arredonda a probabilidade que a API mandou. */
const emCada10 = (p: number) => Math.round(p * 10);
const grau = (c: number) => `${c.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} °C`;

/** Frase curta do risco de geada, também usada na narração. */
export function fraseGeada(g: RiscoGeada): string {
  if (g.probabilidade_ano === 0) {
    const maisFrio = g.meses
      .filter(m => m.menor_minima_c !== null)
      .reduce<RiscoGeada['meses'][number] | null>((a, m) => (!a || (m.menor_minima_c as number) < (a.menor_minima_c as number) ? m : a), null);
    const frio = maisFrio ? ` A noite mais fria foi de ${grau(maisFrio.menor_minima_c as number)}, em ${NOME_MES[maisFrio.mes - 1]}.` : '';
    return `Em ${g.anos_analisados} anos, nenhuma noite esfriou a ponto de gear.${frio}`;
  }
  const vezes = emCada10(g.probabilidade_ano);
  const pior = g.mes_mais_arriscado ? g.meses[g.mes_mais_arriscado - 1] : null;
  const anos =
    g.probabilidade_ano >= 1
      ? 'Geou em todos os anos.'
      : `Geou em ${Math.min(Math.max(vezes, 1), 9)} de cada 10 anos.`;
  return pior
    ? `${anos} O mês mais perigoso é ${NOME_MES[pior.mes - 1]}: geou em ${pior.anos_com_geada} dos ${g.anos_analisados} anos.`
    : anos;
}

/**
 * Os 12 meses com um floco de neve onde costuma gear e o número de anos (em cada 10).
 * Só exibe o que veio da API (app/domain/geada.py); não aplica regra própria.
 */
export function FaixaGeada({ geada }: { geada: RiscoGeada }) {
  const comRisco = new Set(geada.meses_com_risco);
  return (
    <div className="faixa-geada">
      <p className="faixa-geada-frase">{fraseGeada(geada)}</p>
      <ol className="faixa-geada-meses" aria-label="Geada mês a mês">
        {geada.meses.map(m => {
          const n = emCada10(m.probabilidade_geada);
          const risco = comRisco.has(m.mes);
          const descricao =
            m.anos_com_geada === 0
              ? `${NOME_MES[m.mes - 1]}: não geou`
              : `${NOME_MES[m.mes - 1]}: geou em ${m.anos_com_geada} dos ${geada.anos_analisados} anos`;
          return (
            <li key={m.mes} className={`faixa-geada-mes${risco ? ' com-risco' : ''}`} aria-label={descricao} title={descricao}>
              <span className="faixa-geada-nome" aria-hidden="true">{NOME_MES_CURTO[m.mes - 1]}</span>
              <span className="faixa-geada-icone" aria-hidden="true">
                {risco ? <Pictograma nome="geada" tamanho={26} /> : <span className="faixa-geada-vazio" />}
              </span>
              <span className="faixa-geada-numero" aria-hidden="true">{m.anos_com_geada === 0 ? '–' : Math.max(n, 1)}</span>
            </li>
          );
        })}
      </ol>
      <p className="texto-apoio faixa-geada-legenda">
        Número = em quantos de cada 10 anos geou naquele mês. Noites com o ar a até {grau(geada.limiar_c)}, de{' '}
        {geada.periodo_inicio} a {geada.periodo_fim} (NASA POWER). Baixada e beira de rio geiam mais que isso.
      </p>
    </div>
  );
}
