import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
// Os textos verificados aqui são os em português; o site abre em inglês por padrão.
// O componente e o módulo de idioma vão no mesmo pacote, para a troca valer para ele.
async function componente(caminho, nome) {
  const r = await build({
    stdin: {
      contents: `export { ${nome} } from './${caminho}'; export { mudarIdioma } from './src/i18n/idioma';`,
      resolveDir: process.cwd(), loader: 'ts'
    },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic'
  });
  const modulo = { exports: {} };
  new Function('require', 'module', 'exports', r.outputFiles[0].text)(require, modulo, modulo.exports);
  modulo.exports.mudarIdioma('pt');
  return modulo.exports[nome];
}
const MesesAtencao = await componente('src/features/fluxo/MesesAtencao.tsx', 'MesesAtencao');
const AnoDaTerra = await componente('src/components/AnoDaTerra.tsx', 'AnoDaTerra');
const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1 }));
const chuva = meses.map(m => ({ ...m, precipitacao_acumulada_mm: 80, umidade_solo: null }));
const render = (c, p) => renderToStaticMarkup(createElement(c, p));

test('falta de calor e geada não vira ausência de risco', () => {
  const html = render(MesesAtencao, { calor: null, geada: null, clima: chuva });
  assert.match(html, /dados incompletos/);
  assert.match(html, /Faltam dados/);
  assert.doesNotMatch(html, /Nenhum mês com calor forte/);
});

test('alerta conhecido continua visível quando outra fonte falta', () => {
  const html = render(MesesAtencao, { calor: null,
    geada: { meses, meses_com_risco: [7], fonte: 'nasa_power' }, clima: chuva });
  assert.match(html, /Geada/);
  assert.match(html, /Avaliação parcial/);
});

test('sem alerta só é afirmado para fontes completas', () => {
  const indicador = { meses, meses_com_risco: [], fonte: 'nasa_power' };
  const html = render(MesesAtencao, { calor: indicador, geada: indicador, clima: chuva });
  assert.match(html, /Nenhum mês com calor forte/);
  assert.doesNotMatch(html, /dados incompletos/);
});

test('calendário descoberto sem chuva não é descrito como seguro', () => {
  const estrategia = { calendario: meses.map(m => ({ ...m, cobertura: 'solo_descoberto' })),
    etapas_rotacao: [{ cultura_id: 'milho' }] };
  const html = render(AnoDaTerra, { estrategia, clima: [] });
  assert.match(html, /Faltam dados de chuva/);
  assert.doesNotMatch(html, /não fica descoberta em nenhum mês de chuva forte/);
});
