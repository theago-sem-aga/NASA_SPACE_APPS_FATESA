import { useEffect, useRef, useState } from 'react';
import type { ClimaMensal, CoberturaSolo, Estrategia } from '../api/tipos';
import { NOME_MES, NOME_MES_CURTO, ROTULO_COBERTURA } from '../features/fluxo/rotulos';
import { Pictograma, PICTOGRAMA_CULTURA, type NomePictograma } from './Pictograma';
import { SeloFonte } from './SeloFonte';

/**
 * "O ano da sua terra": o talhão mês a mês, com a chuva de cada mês (NASA POWER) caindo em cima.
 * Mostra quando a terra fica descoberta justo nos meses de chuva forte.
 * Só usa o que já vem da análise: o calendário do caminho e a chuva média mensal.
 */

/** Chuva do mês a partir da qual a terra descoberta é destacada. Proposta da equipe, sem fonte (ajustar com agrônomo). */
const CHUVA_FORTE_MM = 100;
const PASSO_MS = 1100;

function pictogramaDoMes(cobertura: CoberturaSolo, e: Estrategia): NomePictograma | null {
  const meio = e.etapas_rotacao[1]?.cultura_id;
  const ultima = e.etapas_rotacao[e.etapas_rotacao.length - 1]?.cultura_id;
  if (cobertura === 'solo_descoberto') return null;
  if (cobertura === 'palhada') return 'palhada';
  if (cobertura === 'cultura_principal') return PICTOGRAMA_CULTURA[ultima ?? ''] ?? 'cana';
  return PICTOGRAMA_CULTURA[meio ?? ''] ?? 'nao_sei';
}

function fraseDoMes(cobertura: CoberturaSolo, mm: number | null): string {
  const chuva = mm === null ? 'sem dado de chuva' : `${Math.round(mm)} mm de chuva em média`;
  if (cobertura === 'solo_descoberto' && mm !== null && mm >= CHUVA_FORTE_MM) {
    return `Terra descoberta com ${chuva}: é quando a enxurrada mais leva terra.`;
  }
  if (cobertura === 'solo_descoberto') return `Terra descoberta, ${chuva}.`;
  return `${ROTULO_COBERTURA[cobertura].nome} protegendo o chão, ${chuva}.`;
}

export function AnoDaTerra({ estrategia: e, clima, fonteClima }: { estrategia: Estrategia; clima: ClimaMensal[]; fonteClima?: string }) {
  const meses = e.calendario;
  const [i, setI] = useState(0);
  const [tocando, setTocando] = useState(false);
  const temporizador = useRef<number>();
  const reduzir = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const chuvaDo = (mes: number) => clima.find(c => c.mes === mes)?.precipitacao_acumulada_mm ?? null;
  const perigosos = meses.filter(m => m.cobertura === 'solo_descoberto' && (chuvaDo(m.mes) ?? 0) >= CHUVA_FORTE_MM);
  const descobertosSemChuva = meses.some(m => m.cobertura === 'solo_descoberto' && chuvaDo(m.mes) === null);

  useEffect(() => {
    if (!tocando) return;
    temporizador.current = window.setTimeout(() => {
      if (i >= meses.length - 1) setTocando(false);
      else setI(i + 1);
    }, PASSO_MS);
    return () => window.clearTimeout(temporizador.current);
  }, [tocando, i, meses.length]);

  if (meses.length === 0) return null;
  const atual = meses[i];
  const mm = chuvaDo(atual.mes);
  const picto = pictogramaDoMes(atual.cobertura, e);
  const gotas = mm === null ? 0 : Math.min(10, Math.round(mm / 25));
  const perigo = atual.cobertura === 'solo_descoberto' && mm !== null && mm >= CHUVA_FORTE_MM;

  const tocar = () => {
    if (tocando) {
      setTocando(false);
      return;
    }
    if (i >= meses.length - 1) setI(0);
    setTocando(true);
  };

  return (
    <section className="ano-terra cartao" aria-labelledby="ano-terra-titulo">
      <h2 id="ano-terra-titulo" className="ano-terra-titulo">O ano da sua terra</h2>
      <p className="ano-terra-resumo">
        {descobertosSemChuva
          ? 'Faltam dados de chuva em meses de terra descoberta. Não dá para avaliar todo o calendário.'
          : perigosos.length === 0
          ? 'Neste caminho, a terra não fica descoberta em nenhum mês de chuva forte.'
          : `Neste caminho, a terra fica descoberta em ${perigosos.length === 1 ? '1 mês' : `${perigosos.length} meses`} de chuva forte (${perigosos.map(m => NOME_MES[m.mes - 1].toLowerCase()).join(', ')}).`}
      </p>
      <SeloFonte fonte={fonteClima} />

      <div className={`ano-terra-cena${perigo ? ' ano-terra-perigo' : ''}`} aria-hidden="true">
        <span className="ano-terra-mes-grande">{NOME_MES[atual.mes - 1]}</span>
        <span className="ano-terra-chuva">
          {Array.from({ length: gotas }, (_, g) => (
            <span key={`${i}-${g}`} className={`ano-terra-gota${reduzir ? ' parada' : ''}`} style={{ left: `${8 + g * 9}%`, animationDelay: `${(g % 4) * 0.18}s` }} />
          ))}
        </span>
        <span className="ano-terra-plantas">
          {picto && Array.from({ length: 5 }, (_, p) => <Pictograma key={`${i}-${p}`} nome={picto} tamanho={40} />)}
        </span>
        <span className={`ano-terra-chao ${ROTULO_COBERTURA[atual.cobertura].classe}`} />
      </div>

      <p className="ano-terra-frase" aria-live="polite">
        <strong>{NOME_MES[atual.mes - 1]}:</strong> {fraseDoMes(atual.cobertura, mm)}
      </p>

      <div className="ano-terra-controles">
        <button type="button" className="botao botao-primario ano-terra-play" onClick={tocar} aria-pressed={tocando}>
          {tocando ? '⏸ Pausar' : i >= meses.length - 1 ? '↻ Ver de novo' : '▶ Ver o ano passar'}
        </button>
      </div>
      <ol className="ano-terra-linha" aria-label="Escolha o mês">
        {meses.map((m, k) => {
          const risco = m.cobertura === 'solo_descoberto' && (chuvaDo(m.mes) ?? 0) >= CHUVA_FORTE_MM;
          return (
            <li key={m.mes}>
              <button
                type="button"
                className={`ano-terra-ponto ${ROTULO_COBERTURA[m.cobertura].classe}${k === i ? ' atual' : ''}${risco ? ' risco' : ''}`}
                aria-current={k === i ? 'step' : undefined}
                aria-label={`${NOME_MES[m.mes - 1]}: ${fraseDoMes(m.cobertura, chuvaDo(m.mes))}`}
                onClick={() => {
                  setTocando(false);
                  setI(k);
                }}
              />
              <span className="ano-terra-ponto-nome" aria-hidden="true">{NOME_MES_CURTO[m.mes - 1]}</span>
            </li>
          );
        })}
      </ol>
      <p className="texto-apoio ano-terra-nota">
        Chuva: média de cada mês no histórico da NASA. O destaque vermelho marca terra descoberta em mês com {CHUVA_FORTE_MM} mm ou mais, uma referência da equipe que ainda precisa ser validada por um agrônomo.
      </p>
    </section>
  );
}
