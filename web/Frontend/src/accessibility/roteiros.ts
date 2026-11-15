// Roteiros falados por tela (convenção §9). São escritos para serem OUVIDOS:
// frases curtas, ditas como alguém explicando ao lado, e não a leitura da tela.
// Regras: nada de sigla solta ("SP" vira o nome da cidade), nada de lista colada
// com ponto e vírgula, sempre terminar dizendo o que fazer em seguida.
import { SINALIZAR_MOCK } from '../api/cliente';
import type { Analise, Estrategia, RequisitoId } from '../api/tipos';
import type { DadosFluxo, Etapa } from '../features/fluxo/estadoFluxo';
import {
  NOME_MES, ROTULO_PRIORIDADE, ROTULO_PROBLEMA, ROTULO_RELEVO, ROTULO_REQUISITO, ROTULO_RISCO, ROTULO_TEXTURA
} from '../features/fluxo/rotulos';
import { fraseCalor } from '../features/fluxo/FaixaCalor';
import { fraseGeada } from '../features/fluxo/FaixaGeada';
import { vocabulario } from '../features/fluxo/vocabularioCultura';
import { fraseChuvaExtrema } from '../features/fluxo/FaixaPrecipitacaoExtrema';
import { fraseTendencia } from '../features/fluxo/FaixaTendenciaHidrica';
import { fraseEstresse } from '../features/fluxo/FaixaEstresseVegetal';
import { L, traduzivel, tx } from '../i18n/idioma';

const ORDINAL = traduzivel([
  L('O primeiro', 'The first'), L('O segundo', 'The second'), L('O terceiro', 'The third'), L('O quarto', 'The fourth'), L('O quinto', 'The fifth')
]);

function emFrase(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} ${tx('e', 'and')} ${itens[itens.length - 1]}`;
}

const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function roteiroRecurso(r: RequisitoId): string {
  const p = ROTULO_REQUISITO[r];
  return `${p.pergunta} ${p.porque} ${tx('Toque em sim, em não, ou em não sei.', 'Tap yes or no.')}`;
}

function roteiroTalhao(a: Analise): string {
  const t = a.talhao;
  const partes: string[] = [];
  if (t.textura_solo && t.relevo) {
    partes.push(
      tx(
        `Pelos mapas, a terra aí é ${minuscula(ROTULO_TEXTURA[t.textura_solo].nome)} e o terreno é ${minuscula(ROTULO_RELEVO[t.relevo].nome)}.`,
        `From the maps, the soil there is ${minuscula(ROTULO_TEXTURA[t.textura_solo].nome)} and the terrain is a ${minuscula(ROTULO_RELEVO[t.relevo].nome)}.`
      )
    );
  }
  if (t.risco_erosao) partes.push(tx(`O risco de a chuva levar terra é ${minuscula(ROTULO_RISCO[t.risco_erosao])}.`, `The risk of rain washing soil away is ${minuscula(ROTULO_RISCO[t.risco_erosao])}.`));
  if (t.risco_seca) partes.push(tx(`O risco de seca é ${minuscula(ROTULO_RISCO[t.risco_seca])}.`, `The drought risk is ${minuscula(ROTULO_RISCO[t.risco_seca])}.`));
  if (t.risco_geada) partes.push(tx(`O risco de geada é ${minuscula(ROTULO_RISCO[t.risco_geada])}.`, `The frost risk is ${minuscula(ROTULO_RISCO[t.risco_geada])}.`));
  if (a.estresse_termico) partes.push(fraseCalor(a.estresse_termico));
  if (a.geada) partes.push(fraseGeada(a.geada));
  if (a.precipitacao_extrema) partes.push(fraseChuvaExtrema(a.precipitacao_extrema));
  if (a.tendencia_hidrica) partes.push(fraseTendencia(a.tendencia_hidrica));
  if (a.estresse_vegetal) partes.push(fraseEstresse(a.estresse_vegetal));
  if (partes.length) partes.push(tx('Se não for bem assim, toque em: não é bem assim.', 'If that is not right, tap: that’s not quite right.'));
  return partes.join(' ');
}

function roteiroEstrategia(e: Estrategia): string {
  return [
    `${e.nome}.`,
    e.resumo,
    e.objetivo ? `${tx('A ideia é:', 'The idea is:')} ${minuscula(e.objetivo)}` : '',
    e.beneficios.length ? `${tx('O que você ganha.', 'What you gain.')} ${e.beneficios.join(' ')}` : '',
    e.riscos.length ? `${tx('Agora, os cuidados.', 'Now, the cautions.')} ${e.riscos.join(' ')}` : '',
    e.lacunas.length ? `${tx('O que a gente ainda não sabe.', 'What we do not know yet.')} ${e.lacunas.join(' ')}` : '',
    `${tx('Uma boa pergunta para levar ao agrônomo:', 'A good question to take to the agronomist:')} ${e.pergunta_especialista}`,
    tx('Para ver a chuva do lugar, toque no botão lá embaixo.', 'To see the rain for the place, tap the button at the bottom.')
  ]
    .filter(Boolean)
    .join(' ');
}

function roteiroClima(a: Analise, e: Estrategia): string {
  const chuva = (mes: number) => a.clima_mensal.find(c => c.mes === mes)?.precipitacao_acumulada_mm ?? 0;
  const total = a.clima_mensal.reduce((s, c) => s + (c.precipitacao_acumulada_mm ?? 0), 0);
  const descobertos = e.calendario.filter(m => m.cobertura === 'solo_descoberto').map(m => m.mes);
  const naTerraNua = descobertos.reduce((s, m) => s + chuva(m), 0);
  const maisChuvosos = [...a.clima_mensal]
    .sort((x, y) => (y.precipitacao_acumulada_mm ?? 0) - (x.precipitacao_acumulada_mm ?? 0))
    .slice(0, 3)
    .sort((x, y) => x.mes - y.mes)
    .map(c => NOME_MES[c.mes - 1]);
  const pct = total > 0 ? Math.round((naTerraNua / total) * 100) : 0;
  const n = descobertos.length;
  return [
    tx('Aqui é como costuma chover aí, mês a mês, olhando mais de 30 anos.', 'This is how it usually rains there, month by month, looking at more than 30 years.'),
    tx(`Os meses de mais chuva são ${emFrase(maisChuvosos)}.`, `The rainiest months are ${emFrase(maisChuvosos)}.`),
    n
      ? tx(
          `Nesse caminho, a terra fica descoberta em ${n} ${n === 1 ? 'mês' : 'meses'}. Cai nesse tempo ${pct} por cento da chuva do ano. É aí que a chuva leva terra embora.`,
          `With this option, the soil is bare for ${n} ${n === 1 ? 'month' : 'months'}. ${pct} percent of the year’s rain falls in that time. That is when rain carries soil away.`
        )
      : tx('Nesse caminho, a terra fica coberta o ano todo. Isso protege bem contra a chuva forte.', 'With this option, the soil stays covered all year. That protects well against heavy rain.'),
    tx('Os números também estão numa tabela no fim da tela.', 'The numbers are also in a table at the bottom of the screen.')
  ].join(' ');
}

export function roteiroDaTela(etapa: Etapa, dados: DadosFluxo, analise: Analise | null, estrategia: Estrategia | null): string {
  const aviso = analise?.eh_mock && SINALIZAR_MOCK ? tx('Lembrete: estes números são de exemplo, inventados para teste. ', 'Reminder: these numbers are sample data, made up for testing. ') : '';
  const v = vocabulario(dados.cultura_atual_id, dados.nomeCultura);
  switch (etapa) {
    case 'inicio':
      return tx(
        'Olá. Vai trocar ou renovar a lavoura? A gente mostra o que dá para fazer com a terra até o próximo plantio. Para começar, toque no botão verde grande: usar onde estou agora. O celular vai perguntar se pode usar a localização. É só tocar em permitir. Se preferir, toque em: prefiro escrever a cidade.',
        'Hello. Switching or renewing your crop? We show what you can do with the land until the next planting. To start, tap the big green button: use my current location. Your phone will ask whether it can use your location. Just tap allow. If you prefer, tap: I’d rather type the town.'
      );
    case 'local':
      return dados.modoLocal === 'confirmar' && dados.local
        ? tx(
            `Pelo celular, você está perto de ${dados.local.municipio}. É aí que fica a plantação? Se for, toque em: sim, é aqui. Se não for, toque em: não, é em outro lugar.`,
            `From your phone, you are near ${dados.local.municipio}. Is that where the field is? If so, tap: yes, it’s here. If not, tap: no, it’s somewhere else.`
          )
        : tx(
            'Em qual cidade fica a plantação? Escreva o nome no campo. Não precisa de acento. Quando a cidade aparecer embaixo, toque nela.',
            'Which town is the field in? Type the name in the box. When the town shows up below, tap it.'
          );
    case 'cultura':
      return tx(
        'O que está plantado aí hoje? Toque na figura. As que dizem em breve ainda não estão prontas.',
        'What is planted there today? Tap a picture. The ones marked coming soon are not ready yet.'
      );
    case 'maquinas_graos':
    case 'comprador_graos':
    case 'irrigacao':
      return roteiroRecurso(etapa);
    case 'problemas': {
      const lista = emFrase(
        (Object.keys(ROTULO_PROBLEMA) as (keyof typeof ROTULO_PROBLEMA)[]).map(p => minuscula(p === 'solo_cansado' ? v.produzindoMenos : ROTULO_PROBLEMA[p]))
      );
      return tx(
        `Alguma dessas coisas está acontecendo? ${lista}. Pode tocar em mais de uma. Se não for nada disso, toque em: nada disso. Depois toque em continuar.`,
        `Is any of this happening? ${lista}. You can tap more than one. If none of it is, tap: none of these. Then tap continue.`
      );
    }
    case 'prioridades': {
      const opcoes = emFrase(Object.values(ROTULO_PRIORIDADE).map(p => minuscula(p.nome)));
      return tx(
        `${v.nestePeriodo}, o que é mais importante para você? Escolha até duas coisas. As opções são: ${opcoes}. Depois toque em: ver os caminhos.`,
        `${v.nestePeriodo}, what matters most to you? Choose up to two things. The options are: ${opcoes}. Then tap: see the options.`
      );
    }
    case 'estrategias':
      return analise
        ? [
            aviso,
            roteiroTalhao(analise),
            tx(`Agora, os ${analise.estrategias.length} caminhos para ${v.aPeriodo}.`, `Now, the ${analise.estrategias.length} options for ${v.aPeriodo}.`),
            ...analise.estrategias.map((e, i) => `${ORDINAL[i] ?? tx('Outro', 'Another')}: ${minuscula(e.nome)}.`),
            tx('Toque num caminho para saber mais, ou em comparar lado a lado.', 'Tap an option to learn more, or compare them side by side.')
          ].join(' ')
        : tx('Estou montando os caminhos. Só um instante.', 'I am building the options. Just a moment.');
    case 'comparar':
      return (
        aviso +
        tx(
          `Aqui os caminhos estão lado a lado. Cada linha é uma coisa que importa para ${v.aPeriodo}. Os tracinhos verdes são bons. Os laranja pesam contra. No celular, arraste a tabela para o lado para ver tudo.`,
          `Here the options are side by side. Each row is something that matters for ${v.aPeriodo}. Green dashes are good. Orange ones count against. On a phone, swipe the table sideways to see everything.`
        )
      );
    case 'estrategia':
      return estrategia ? aviso + roteiroEstrategia(estrategia) : '';
    case 'clima':
      return analise && estrategia ? aviso + roteiroClima(analise, estrategia) : '';
    case 'decisao':
      return estrategia
        ? tx(
            `Pronto. Você escolheu: ${estrategia.nome}. Agora vamos acompanhar a sua área pelo satélite.`,
            `Done. You chose: ${estrategia.nome}. Now let’s follow your field by satellite.`
          )
        : '';
    case 'producao':
    case 'acompanhamento':
      // O roteiro desta tela vem de features/producao/roteiroProducao.ts (depende dos dados carregados).
      return '';
    case 'proximos':
      return tx(
        `Este é o seu resumo. Ele junta a sua área e os caminhos, com as figuras. Antes de decidir, três coisas. Primeiro: mostre este resumo ao agrônomo. ${v.ondeAgronomo} Segundo: faça a análise de solo antes de ${v.aPeriodo}. Terceiro: confira a melhor época de plantar no aplicativo Plantio Certo. Se quiser, toque em imprimir para levar no papel.`,
        `This is your summary. It brings together your field and the options, with pictures. Before deciding, three things. First: show this summary to an agronomist. ${v.ondeAgronomo} Second: get a soil test before ${v.aPeriodo}. Third: check the best planting window in the Plantio Certo app. If you like, tap print to take it on paper.`
      );
  }
}
