import { Termo } from '../../components/Termo';
import { useId, useState } from 'react';
import type { EstresseVegetal } from '../../api/tipos';
import { L as bi, localeAtual, MESES_CURTOS, MESES_LONGOS, traduzivel, tx } from '../../i18n/idioma';

// Só escreve e desenha o que a API mandou (app/domain/estresse_vegetal.py).
// A conta (normal da época, posição entre os anos, situação) é toda do backend.

const dataLonga = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return tx(`${d} de ${MESES_LONGOS[m - 1]} de ${a}`, `${MESES_LONGOS[m - 1]} ${d}, ${a}`);
};
const dataCurta = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return tx(`${d} ${MESES_CURTOS[m - 1]} ${String(a).slice(2)}`, `${MESES_CURTOS[m - 1]} ${d} ’${String(a).slice(2)}`);
};
const num = (v: number) => v.toLocaleString(localeAtual(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Faixas da tabela de referência do NDVI (artigo da EOSDA; ver app/domain/estresse_vegetal.py). */
export const FAIXA_NDVI: Record<EstresseVegetal['faixa_ndvi_atual'], string> = traduzivel({
  agua_neve_nuvem: bi('água, neve ou nuvem (−1,0 a −0,1)', 'water, snow or cloud (−1.0 to −0.1)'),
  solo_nu: bi('solo nu ou rocha (de 0 até 0,2)', 'bare soil or rock (0 up to 0.2)'),
  vegetacao_esparsa_ou_estressada: bi('vegetação esparsa ou estressada (0,2 a 0,5)', 'sparse or stressed vegetation (0.2 to 0.5)'),
  vegetacao_densa_saudavel: bi('vegetação densa e saudável (0,6 a 1,0)', 'dense, healthy vegetation (0.6 to 1.0)'),
  entre_faixas: bi('entre duas faixas da tabela de referência', 'between two bands of the reference table')
});

// Causas de queda do NDVI, da mesma fonte.
const causas = () => tx('falta de água, pragas, doenças ou falta de nutrientes', 'lack of water, pests, diseases or lack of nutrients');
const naturais = () => tx('colheita ou senescência (envelhecimento natural das folhas)', 'harvest or senescence (natural aging of the leaves)');

export const ROTULO_ESTRESSE: Record<EstresseVegetal['situacao'], string> = traduzivel({
  normal: bi('Normal para a época', 'Normal for the season'),
  abaixo: bi('Abaixo do normal (atenção)', 'Below normal (watch)'),
  muito_abaixo: bi('Bem abaixo do normal (estresse)', 'Well below normal (stress)'),
  acima: bi('Acima do normal', 'Above normal'),
  sem_vegetacao: bi('Sem vegetação no ponto', 'No vegetation at this point')
});

/**
 * Frase do estresse vegetal com os números (também usada na narração e na folha impressa).
 * A regra é do backend (app/domain/estresse_vegetal.py): posição da foto entre os anos
 * anteriores na mesma época (cortes de 10%, 25% e 90%, sem fonte agronômica). Faixas,
 * limiar de 0,20 e causas: artigo da EOSDA sobre NDVI (estresse.fonte_referencia).
 */
export function fraseEstresse(e: EstresseVegetal): string {
  if (e.situacao === 'sem_vegetacao') {
    return tx(
      `Neste ponto quase nunca há planta: o índice de vegetação (NDVI) típico do lugar é ${num(e.ndvi_mediano_geral)}, ` +
        `abaixo de ${num(e.limiar_sem_vegetacao)}, faixa de solo nu, rocha ou água na tabela de referência. Não dá para medir o estresse da lavoura aqui. ` +
        `Marque o ponto em cima da plantação.`,
      `There are almost never plants at this point: the typical vegetation index (NDVI) here is ${num(e.ndvi_mediano_geral)}, ` +
        `below ${num(e.limiar_sem_vegetacao)}, the bare soil, rock or water band of the reference table. Crop stress cannot be measured here. ` +
        `Place the point on top of the field.`
    );
  }
  const medida = tx(
    `Índice de vegetação (NDVI) medido pelo satélite MODIS em ${dataLonga(e.data_foto)}: ${num(e.ndvi_atual)}, ` +
      `faixa de ${FAIXA_NDVI[e.faixa_ndvi_atual]}. ` +
      `Nesta mesma época do ano, o normal é ${num(e.normal_mediana)}, e em 8 de cada 10 anos o valor fica entre ${num(e.normal_p10)} e ${num(e.normal_p90)}.`,
    `Vegetation index (NDVI) measured by the MODIS satellite on ${dataLonga(e.data_foto)}: ${num(e.ndvi_atual)}, ` +
      `in the ${FAIXA_NDVI[e.faixa_ndvi_atual]} band. ` +
      `At this time of year the normal is ${num(e.normal_mediana)}, and in 8 out of 10 years the value falls between ${num(e.normal_p10)} and ${num(e.normal_p90)}.`
  );
  const pct = Math.abs(e.anomalia_pct).toLocaleString(localeAtual(), { maximumFractionDigits: 0 });
  const diferenca =
    e.anomalia_pct >= 0 ? tx(`Está ${pct}% acima do normal`, `It is ${pct}% above normal`) : tx(`Está ${pct}% abaixo do normal`, `It is ${pct}% below normal`);
  const posicao = tx(
    `${diferenca}: dos ${e.anos_comparados} anos anteriores, ${e.anos_mais_verdes} tiveram mais folha verde nesta época.`,
    `${diferenca}: of the ${e.anos_comparados} previous years, ${e.anos_mais_verdes} had more green leaf at this time of year.`
  );
  switch (e.situacao) {
    case 'normal':
      return tx(`${medida} ${posicao} Fica dentro do comum para a época: sem sinal de estresse.`, `${medida} ${posicao} It is within the usual range for the season: no sign of stress.`);
    case 'acima':
      return tx(
        `${medida} ${posicao} Passa do que se vê em 9 de cada 10 anos: vegetação mais vigorosa que o normal, sem sinal de estresse.`,
        `${medida} ${posicao} It is above what is seen in 9 out of 10 years: more vigorous vegetation than normal, no sign of stress.`
      );
    case 'abaixo':
      return tx(
        `${medida} ${posicao} Fica entre os 25% de anos mais baixos para a época: atenção. Pode ser começo de estresse (${causas()}) ou só ${naturais()}, que não é problema.`,
        `${medida} ${posicao} It is among the lowest 25% of years for the season: watch it. It may be the start of stress (${causas()}) or just ${naturais()}, which is not a problem.`
      );
    case 'muito_abaixo':
      return tx(
        `${medida} ${posicao} Fica abaixo do que se vê em 9 de cada 10 anos: sinal de estresse (${causas()}), a não ser que seja ${naturais()}. Vale ir ao campo conferir.`,
        `${medida} ${posicao} It is below what is seen in 9 out of 10 years: a sign of stress (${causas()}), unless it is ${naturais()}. Worth checking in the field.`
      );
  }
}

/** Linha técnica para o agrônomo. */
export function linhaTecnicaEstresse(e: EstresseVegetal): string {
  const sinal = e.anomalia_pct > 0 ? '+' : '';
  const anomalia = `${sinal}${e.anomalia_pct.toLocaleString(localeAtual())}%`;
  const km = e.distancia_pixel_km.toLocaleString(localeAtual());
  return tx(
    `NDVI ${num(e.ndvi_atual)} em ${e.data_foto}; normal da época ${num(e.normal_mediana)} ` +
      `(P10 ${num(e.normal_p10)}–P90 ${num(e.normal_p90)}, ${e.anos_comparados} anos desde ${e.periodo_inicio}); ` +
      `anomalia ${anomalia}; posição ${Math.round(e.posicao * 100)}%; MODIS ${e.produto} 250 m, pixel a ${km} km do ponto.`,
    `NDVI ${num(e.ndvi_atual)} on ${e.data_foto}; seasonal normal ${num(e.normal_mediana)} ` +
      `(P10 ${num(e.normal_p10)}–P90 ${num(e.normal_p90)}, ${e.anos_comparados} years since ${e.periodo_inicio}); ` +
      `anomaly ${anomalia}; percentile ${Math.round(e.posicao * 100)}%; MODIS ${e.produto} 250 m, pixel ${km} km from the point.`
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
            {tx('NDVI (folha verde) no último ano e o normal da época', 'NDVI (green leaf) over the last year and the seasonal normal')}
          </figcaption>
          <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-labelledby={`${id}-titulo`} onMouseLeave={() => setAtivo(null)}>
            <line x1={M.esq} x2={L - M.dir} y1={y(0)} y2={y(0)} className="grafico-base" />
            <line x1={M.esq} x2={L - M.dir} y1={y(1)} y2={y(1)} className="grafico-grade" />
            <text x={M.esq} y={y(1) + 10} className="grafico-eixo-texto">{tx('1,0 · vegetação densa', '1.0 · dense vegetation')}</text>
            <text x={M.esq} y={y(0) - 4} className="grafico-eixo-texto">{tx('0 · solo nu', '0 · bare soil')}</text>
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
            <span className="grafico-ndvi-amostra-linha" aria-hidden="true" /> {tx('Este ano', 'This year')}
            <span className="grafico-ndvi-amostra-faixa" aria-hidden="true" /> {tx('Normal da época (onde ficam 8 de cada 10 anos)', 'Seasonal normal (where 8 out of 10 years fall)')}
          </p>
          <p className="grafico-chuva-anos-detalhe" aria-live="polite">
            {fotoAtiva
              ? `${dataLonga(fotoAtiva.data)}: NDVI ${num(fotoAtiva.ndvi)}${fotoAtiva.normal_mediana !== null ? tx(`; o normal da época é ${num(fotoAtiva.normal_mediana)}`, `; the seasonal normal is ${num(fotoAtiva.normal_mediana)}`) : ''}.`
              : tx('Toque no gráfico para ver cada foto.', 'Tap the chart to see each image.')}
          </p>
          <table className="visualmente-oculto">
            <caption>{tx('Verdor (NDVI) de cada foto do último ano e o normal da época', 'Greenness (NDVI) of each image in the last year and the seasonal normal')}</caption>
            <thead>
              <tr><th scope="col">{tx('Data', 'Date')}</th><th scope="col">NDVI</th><th scope="col">{tx('Normal da época', 'Seasonal normal')}</th></tr>
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
        <summary>{tx('Como ler este dado', 'How to read this')}</summary>
        <p className="termos-relacionados">{tx('Palavras deste quadro:', 'Words in this box:')} <Termo id="ndvi" /></p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>{tx('O que é.', 'What it is.')}</strong>{' '}
          {tx('O satélite da NASA mede o quanto a planta está verde. Esse número se chama NDVI.', 'NASA’s satellite measures how green the plants are. That number is called NDVI.')}
        </p>
        <ul className="texto-apoio faixa-tendencia-legenda">
          <li>{tx('De 0,6 para cima: planta cheia de folha e sadia.', '0.6 and up: leafy, healthy plants.')}</li>
          <li>{tx('De 0,2 a 0,5: pouca planta, ou planta sofrendo.', '0.2 to 0.5: few plants, or plants under stress.')}</li>
          <li>{tx('Abaixo de 0,2: terra sem planta.', 'Below 0.2: ground with no plants.')}</li>
        </ul>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>{tx('Como comparamos.', 'How we compare.')}</strong>{' '}
          {tx(
            `O satélite tira uma foto a cada 16 dias. A foto de agora é comparada com a mesma época dos anos anteriores, desde ${estresse.periodo_inicio}. Foto com nuvem não conta.`,
            `The satellite takes an image every 16 days. Today’s image is compared with the same time of year in earlier years, since ${estresse.periodo_inicio}. Cloudy images do not count.`
          )}
        </p>
        <ul className="texto-apoio faixa-tendencia-legenda">
          <li>{tx('Menos verde que em 9 de cada 10 anos: sinal de estresse.', 'Less green than in 9 out of 10 years: sign of stress.')}</li>
          <li>{tx('Menos verde que em 3 de cada 4 anos: atenção.', 'Less green than in 3 out of 4 years: watch it.')}</li>
          <li>{tx('Mais verde que em 9 de cada 10 anos: acima do normal.', 'Greener than in 9 out of 10 years: above normal.')}</li>
          <li>{tx('No meio disso: normal.', 'In between: normal.')}</li>
        </ul>
        <p className="texto-apoio faixa-tendencia-legenda">
          {tx('Essas regras ainda precisam ser conferidas por um agrônomo.', 'These rules still need to be checked by an agronomist.')}
        </p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>{tx('Cuidado.', 'Careful.')}</strong>{' '}
          {tx(
            `Planta menos verde nem sempre é problema. Depois da colheita, ou quando a folha fica velha, o número também cai. Olhe a lavoura antes de decidir. A foto cobre um quadrado de 250 metros, a ${estresse.distancia_pixel_km.toLocaleString('pt-BR')} km do ponto que você marcou.`,
            `Less green is not always a problem. After harvest, or when leaves get old, the number also drops. Look at the field before deciding. The image covers a 250-meter square, ${estresse.distancia_pixel_km.toLocaleString('en-US')} km from the point you marked.`
          )}
        </p>
        <p className="texto-apoio faixa-tendencia-legenda">
          <strong>{tx('Fonte.', 'Source.')}</strong> {estresse.fonte_referencia}.
        </p>
      </details>
    </div>
  );
}
