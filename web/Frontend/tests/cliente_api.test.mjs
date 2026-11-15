import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

let sequencia = 0;
async function cliente(fetchImpl) {
  globalThis.window = { location: { href: 'http://localhost:5173/', search: '' } };
  globalThis.fetch = fetchImpl;
  const resultado = await build({
    entryPoints: ['src/api/cliente.ts'], bundle: true, write: false, format: 'esm',
    define: {
      'import.meta.env.VITE_FONTE_DADOS': '"api"',
      'import.meta.env.VITE_API_URL': '"http://127.0.0.1:8000/api/v1"',
      'import.meta.env.VITE_SINALIZAR_MOCK': '"true"',
    },
  });
  return import(`data:text/javascript;base64,${Buffer.from(resultado.outputFiles[0].text).toString('base64')}#${sequencia++}`);
}
const resposta = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });
const local = { codigo_ibge: '3549805', municipio: 'São José do Rio Preto', uf: 'SP', latitude: -20.78, longitude: -49.36 };

test('rota ausente em modo API não devolve catálogo mock', async () => {
  const c = await cliente(async () => resposta({ paths: {} }));
  await assert.rejects(c.listarCulturas(), e => e.codigo === 'rota_indisponivel');
});
test('POST ausente não mistura variáveis reais com estratégias mock', async () => {
  const urls = [];
  const c = await cliente(async url => { urls.push(url); return resposta({ paths: { '/api/v1/analises': { get: {} } } }); });
  await assert.rejects(c.criarAnalise({}, 'teste'), e => e.codigo === 'rota_indisponivel');
  assert.equal(urls.length, 1);
});
test('previsão vem da API e não da cópia local', async () => {
  const urls = [];
  const c = await cliente(async url => { urls.push(url); return resposta(url.endsWith('openapi.json') ? { paths: { '/api/v1/previsao': { get: {} } } } : { publicado_em: 'resposta-da-api' }); });
  assert.equal((await c.buscarPrevisao(local.codigo_ibge)).publicado_em, 'resposta-da-api');
  assert.ok(urls[1].includes('/previsao?codigo_ibge=3549805'));
});
test('coordenada não identificada continua real, sem inventar município', async () => {
  const c = await cliente(async url => resposta(url.endsWith('openapi.json') ? { paths: { '/api/v1/locais': { get: {} } } } : { erro: { codigo: 'fora_da_cobertura', mensagem: 'fora' } }, url.endsWith('openapi.json') ? 200 : 404));
  const r = await c.buscarLocalPorCoordenada(36.6, -119.7);
  assert.equal(r.codigo_ibge, '');
  assert.equal(r.latitude, 36.6);
});
test('acompanhamento por centro municipal não substitui o talhão por exemplo', async () => {
  const c = await cliente(async () => { throw new Error('não deveria consultar'); });
  await assert.rejects(c.buscarAcompanhamento(local, 'municipio'), e => e.codigo === 'dados_insuficientes');
});
test('GPS consulta a rota real de acompanhamento', async () => {
  const c = await cliente(async url => resposta(url.endsWith('openapi.json') ? { paths: { '/api/v1/acompanhamento': { get: {} } } } : { ponto_exemplo: false, latitude: local.latitude, fotos: [] }));
  const r = await c.buscarAcompanhamento(local, 'gps');
  assert.equal(r.ponto_exemplo, false);
  assert.equal(r.latitude, local.latitude);
});

test('coordenada digitada consulta fotos reais sem usar centroide municipal', async () => {
  const urls = [];
  const c = await cliente(async url => {
    urls.push(url);
    return resposta(url.endsWith('openapi.json')
      ? { paths: { '/api/v1/acompanhamento': { get: {} } } }
      : { ponto_exemplo: false, fotos: [] });
  });
  const r = await c.buscarAcompanhamento({ ...local, codigo_ibge: '', uf: '' }, 'municipio');
  assert.equal(r.ponto_exemplo, false);
  assert.ok(urls[1].includes(`latitude=${local.latitude.toFixed(5)}&longitude=${local.longitude.toFixed(5)}`));
});
test('servidor desligado resulta em erro e não em mock', async () => {
  const c = await cliente(async () => { throw new TypeError('offline'); });
  await assert.rejects(c.listarCulturas(), e => e.codigo === 'sem_conexao');
});
