import { Termo } from '../../components/Termo';
import { useId, useState } from 'react';
import type { EstresseVegetal } from '../../api/tipos';

// Só escreve e desenha o que a API mandou (app/domain/estresse_vegetal.py).
// A conta (normal da época, posição entre os anos, situação) é toda do backend.

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const dataLonga = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
};
const dataCurta = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_CURTOS[m - 1]} ${String(a).slice(2)}`;
};
const num = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ROTULO_ESTRESSE: Record<EstresseVegetal['situacao'], string> = {
  normal: 'Normal para a época',
  abaixo: 'Abaixo do normal (atenção)',
  muito_abaixo: 'Bem abaixo do normal (estresse)',
  acima: 'Acima do normal',
  sem_vegetacao: 'Sem vegetação no ponto'
};

/**
 * Frase do estresse vegetal com os números (também usada na narração e na folha impressa).
 * A regra é do backend (app/domain/estresse_vegetal.py): posição da foto entre os anos
 * anteriores na mesma época (cortes de 10%, 25% e 90%, sem fonte agronômica).
 */
export function fraseEstresse(e: EstresseVegetal): string {
  if (e.situacao === 'sem_vegetacao') {
    return (
      `Neste ponto quase nunca há planta: o índice de vegetação (NDVI) típico do lugar é ${num(e.ndvi_mediano_geral)}, ` +
      `abaixo de ${num(e.limiar_sem_vegetacao)}, o que indica cidade, água ou terra sem cultivo. Não dá para medir o estresse da lavoura aqui. ` +
      `Marque o ponto em cima da plantação.`
    );
  }
  const medida =
    `Índice de vegetação (NDVI) medido pelo satélite MODIS em ${dataLonga(e.data_foto)}: ${num(e.ndvi_atual)}. ` +
    `Nesta mesma época do ano, o normal é ${num(e.normal_mediana)}, e em 8 de cada 10 anos o valor fica entre ${num(e.normal_p10)} e ${num(e.normal_p90)}.`;
  const pct = Math.abs(e.anomalia_pct).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const diferenca =
    e.anomalia_pct >= 0 ? `Está ${pct}% acima do normal` : `Está ${pct}% abaixo do normal`;
  const posicao = `${diferenca}: dos ${e.anos_comparados} anos anteriores, ${e.anos_mais_verdes} tiveram mais folha verde nesta época.`;
  switch (e.situacao) {
    case 'normal':
      return `${medida} ${posicao} Fica dentro do comum para a época: sem sinal de estresse.`;
    case 'acima':
      return `${medida} ${posicao} Passa do que se vê em 9 de cada 10 anos: vegetação mais vigorosa que o normal, sem sinal de estresse.`;
    case 'abaixo':
      return `${medida} ${posicao} Fica entre os 25% de anos mais baixos para a época: atenção. Pode ser começo de estresse (falta de água, calor, praga ou doença) ou só colheita ou preparo do solo.`;
    case 'muito_abaixo':
      return `${medida} ${posicao} Fica abaixo do que se vê em 9 de cada 10 anos: sinal de estresse (falta de água, calor, praga ou doença), a não ser que a área tenha sido colhida ou esteja em preparo. Vale ir ao campo conferir.`;
  }
}

/** Linha técnica para o agrônomo. */
export function linhaTecnicaEstresse(e: EstresseVegetal): string {
  const sinal = e.anomalia_pct > 0 ? '+' : '';
  return (
    `NDVI ${num(e.ndvi_atual)} em ${e.data_foto}; normal da época ${num(e.normal_mediana)} ` +
    `(P10 ${num(e.normal_p10)}–P90 ${num(e.normal_p90)}, ${e.anos_comparados} anos desde ${e.periodo_inicio}); ` +
    `anomalia ${sinal}${e.anomalia_pct.toLocaleString('pt-BR')}%; posição ${Math.round(e.posicao * 100)}%; ` +
    `MODIS ${e.produto} 250 m, pixel a ${e.distancia_pixel_km.toLocaleString('pt-BR')} km do ponto.`
  );
}

// Geometria do gráfico (unidades do viewBox; o SVG escala com a largura).
const L = 320;
const A = 150;
const M = { topo: 12, base: 20, esq: 4, dir: 4 };

/**
 * Último ano de fotos: a linha é o verdor da planta; a faixa clara é onde ficam
 * 8 de cada 10 anos nessa época (P10–P90), com o normal tracejado no meio.
 */
export function FaixaEstresseVegetal({ estresse }: { estresse: EstresseVegetal }) {
  const id = useId();
  const [ativo, setAtivo] = useState<number | null>(null);
  const fotos = estresse.ultimas_fotos;
  const tempo = fotos.map(f => new Date(`${f.data}T00:00:00Z`).getTime());
  const t0 = tempo[0];
  const t1 = tempo[tempo.length - 1];
  const largura = L - M.esq - M.dir;
  const altura = A - M.topo - M.base;
  const x = (i: number) => M.esq + (t1 > t0 ? ((tempo[i] - t0) / (t1 - t0)) * largura : largura / 2);
  const y = (v: number) => M.topo + altura - Math.max(0, Math.min(1, v)) * altura;
  const comNormal = fotos.map((f, i) => ({ f, i })).filter(({ f }) => f.normal_p10 !== null && f.normal_p90 !== null);
  const faixa =
    comNormal.length > 1
      ? `M${comNormal.map(({ f, i }) => `${x(i)},${y(f.normal_p90!)}`).join(' L')} L${[...comNormal]
          .reverse()
          .map(({ f, i }) => `${x(i)},${y(f.normal_p10!)}`)
          .join(' L')} Z`
      : '';
  const mediana = comNormal.length > 1 ? `M${comNormal.map(({ f, i }) => `${x(i)},${y(f.normal_mediana!)}`).join(' L')}` : '';
  const linha = `M${fotos.map((f, i) => `${x(i)},${y(f.ndvi)}`).join(' L')}`;
  const fotoAtiva = ativo !== null ? fotos[ativo] : null;
  const alvo = (i: number) => {
    const antes = i > 0 ? (x(i) + x(i - 1)) / 2 : M.esq;
    const depois = i < fotos.length - 1 ? (x(i) + x(i + 1)) / 2 : L - M.dir;
    return { x: antes, width: Math.max(1, depois - antes) };
  };
  const semPlanta = estresse.situacao === 'sem_vegetacao';

  return (
    <div className="faixa-tendencia">
      <p className="faixa-tendencia-frase">{fraseEstresse(estresse)}</p>
      {!semPlanta && fotos.length > 1 && (
        <figure className="grafico-chuva-anos">
          <figcaption id={`${id}-titulo`} className="grafico-chuva-anos-titulo">
            NDVI (folha verde) no último ano e o normal da época
          </figcaption>
          <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-labelledby={`${id}-titulo`} onMouseLeave={() => setAtivo(null)}>
            <line x1={M.esq} x2={L - M.dir} y1={y(0)} y2={y(0)} className="grafico-base" />
            <line x1={M.esq} x2={L - M.dir} y1={y(1)} y2={y(1)} className="grafico-grade" />
            <text x={M.esq} y={y(1) + 10} className="grafico-eixo-texto">1,0 · muita folha verde</text>
            <text x={M.esq} y={y(0) - 4} className="grafico-eixo-texto">0 · sem planta</text>
            {faixa && <path d={faixa} className="grafico-ndvi-faixa" />}
            {mediana && <path d={mediana} className="grafico-ndvi-normal" />}
            <path d={linha} className="grafico-ndvi-linha" />
            {fotos.map((f, i) => (
              <circle
                key={f.data}
                cx={x(i)}
                cy={y(f.ndvi)}
                r={ativo === i || i === fotos.length - 1 ? 4 : 0}
                className="grafico-ndvi-ponto"
              />
            ))}
            {fotos.map((f, i) => {
              const r = alvo(i);
              return (
                <rect
                  key={`alvo-${f.data}`}
                  x={r.x}
                  y={M.topo}
                  width={r.width}
                  height={altura}
                  fill="transparent"
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => setAtivo(ativo === i ? null : i)}
                />
              );
            })}
            <text x={M.esq} y={A - 5} className="grafico-eixo-texto">{dataCurta(fotos[0].data)}</text>
            <text x={L - M.dir} y={A - 5} textAnchor="end" className="grafico-eixo-texto">{dataCurta(fotos[fotos.length - 1].data)}</text>
          </svg>
          <p className="grafico-ndvi-legenda texto-apoio">
            <span className="grafico-ndvi-amostra-linha" aria-hidden="true" /> Este ano
            <span className="grafico-ndvi-amostra-faixa" aria-hidden="true" /> Faixa normal da época (8 de cada 10 anos, de P10 a P90)
          </p>
          <p className="grafico-chuva-anos-detalhe" aria-live="polite">
            {fotoAtiva
              ? `${dataLonga(fotoAtiva.data)}: NDVI ${num(fotoAtiva.ndvi)}${fotoAtiva.normal_mediana !== null ? `; o normal da época é ${num(fotoAtiva.normal_mediana)}` : ''}.`
              : 'Toque no gráfico para ver cada foto.'}
          </p>
          <table className="visualmente-oculto">
            <caption>Verdor (NDVI) de cada foto do último ano e o normal da época</caption>
            <thead>
              <tr><th scope="col">Data</th><th scope="col">NDVI</th><th scope="col">Normal da época</th></tr>
            </thead>
            <tbody>
              {fotos.map(f => (
                <tr key={f.data}>
                  <th scope="row">{f.data}</th>
                  <td>{num(f.ndvi)}</td>
                  <td>{f.normal_mediana !== null ? num(f.normal_mediana) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
      <details className="como-ler">
        <summary>Como ler este dado</summary>
        <p className="termos-relacionados">Palavras deste quadro: <Termo id="ndvi" /></p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>O que é medido.</strong> O NDVI (índice de vegetação por diferença normalizada) compara a luz vermelha, que a
          clorofila da folha absorve, com o infravermelho próximo, que a folha sadia reflete. Vai de −1 a 1. Na prática, perto de
          0,1 a 0,2 é terra exposta; 0,3 a 0,5, vegetação rala ou seca; 0,6 a 0,9, lavoura ou mata com muita folha verde.
        </p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>Como comparamos.</strong> Satélite MODIS da NASA (produto {estresse.produto}), um valor a cada 16 dias, num quadrado
          de 250 m. A foto mais recente é comparada com o mesmo período de 16 dias de cada ano anterior, desde {estresse.periodo_inicio}.
          Fotos com nuvem ficam de fora; o ano da foto não entra no próprio normal.
        </p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>Como classificamos.</strong> Abaixo dos 10% de anos mais baixos: bem menos verde (sinal de estresse). Abaixo dos 25%: um
          pouco menos verde. Acima dos 90%: mais verde que o normal. Entre esses cortes: normal. Os cortes são posição estatística entre
          os anos, escolhidos pela equipe sem fonte agronômica, e precisam de revisão de especialista.
        </p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>Limites.</strong> NDVI baixo também acontece depois da colheita, no preparo do solo ou na troca de cultura: quem conhece a
          lavoura confirma. O quadrado de 250 m mistura o talhão com o vizinho; o centro dele fica a{' '}
          {estresse.distancia_pixel_km.toLocaleString('pt-BR')} km do ponto marcado.
        </p>
      </details>
    </div>
  );
}
