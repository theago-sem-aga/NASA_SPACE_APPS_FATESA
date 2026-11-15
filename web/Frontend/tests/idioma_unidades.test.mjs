import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const resultado = await build({
  stdin: {
    contents: `
      export * from './src/i18n/idioma';
      export { FaixaGeada } from './src/features/fluxo/FaixaGeada';
      export { GEADA_FRESNO } from './src/api/mock/geadaMock';
      export { fraseCalor } from './src/features/producao/frases';
    `,
    resolveDir: process.cwd(), loader: 'ts'
  },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic'
});
const modulo = { exports: {} };
new Function('require', 'module', 'exports', resultado.outputFiles[0].text)(require, modulo, modulo.exports);
const api = modulo.exports;

test('temperaturas absolutas e diferenças usam conversões distintas', () => {
  api.mudarIdioma('en');
  assert.equal(api.temperatura(0), '32 °F');
  assert.equal(api.temperatura(35), '95 °F');
  assert.equal(api.temperatura(-40), '-40 °F');
  assert.equal(api.diferencaTemperatura(2), '3.6 °F');
  api.mudarIdioma('pt');
  assert.equal(api.temperatura(2.5), '2,5 °C');
  assert.equal(api.diferencaTemperatura(2), '2 °C');
});

test('local identificado troca idioma; bandeira manual continua livre', () => {
  const local = { codigo_ibge: '', uf: 'CA' };
  api.mudarIdioma('pt');
  api.aplicarIdiomaDoLocal(local);
  assert.equal(api.idiomaAtual(), 'en');
  api.aplicarIdiomaDoLocal({ codigo_ibge: '3504800', uf: 'SP' });
  assert.equal(api.idiomaAtual(), 'pt');
  // Siglas como AL e MT existem em ambos os países; o código IBGE distingue.
  api.aplicarIdiomaDoLocal({ codigo_ibge: '', uf: 'AL' });
  assert.equal(api.idiomaAtual(), 'en');
  api.aplicarIdiomaDoLocal({ codigo_ibge: '2704302', uf: 'AL' });
  assert.equal(api.idiomaAtual(), 'pt');
  api.mudarIdioma('en');
  assert.equal(api.idiomaAtual(), 'en');
  api.aplicarIdiomaDoLocal({ codigo_ibge: '', uf: '' });
  assert.equal(api.idiomaAtual(), 'en');
});

test('geada converte tabela, escala e detalhe sem alterar os dados', () => {
  const original = JSON.stringify(api.GEADA_FRESNO);
  api.mudarIdioma('en');
  const ingles = renderToStaticMarkup(createElement(api.FaixaGeada, { geada: api.GEADA_FRESNO }));
  assert.match(ingles, /°F/);
  assert.match(ingles, /above 50/);
  assert.doesNotMatch(ingles, /°C/);
  api.mudarIdioma('pt');
  const portugues = renderToStaticMarkup(createElement(api.FaixaGeada, { geada: api.GEADA_FRESNO }));
  assert.match(portugues, /°C/);
  assert.doesNotMatch(portugues, /°F/);
  assert.equal(JSON.stringify(api.GEADA_FRESNO), original);
});

test('colheita exibe diferença em Fahrenheit sem somar 32', () => {
  api.mudarIdioma('en');
  const frase = api.fraseCalor({ tmax_c: 30, tmax_normal_c: 28, graus_de_diferenca: 2, situacao_calor: 'mais_quente' });
  assert.match(frase.detalhe, /86 °F/);
  assert.match(frase.detalhe, /3\.6 °F higher/);
});
