// Roteiros falados por tela (convenção §9). São escritos para serem OUVIDOS:
// frases curtas, ditas como alguém explicando ao lado, e não a leitura da tela.
// Regras: nada de sigla solta ("SP" vira o nome da cidade), nada de lista colada
// com ponto e vírgula, sempre terminar dizendo o que fazer em seguida.
// Cada frase existe em português e inglês (i18n/idioma.ts).
import { SINALIZAR_MOCK, USANDO_MOCK } from '../api/cliente';
import type { Analise, Estrategia, PrioridadeId, ProblemaId, RequisitoId } from '../api/tipos';
import type { DadosFluxo, Etapa } from '../features/fluxo/estadoFluxo';
import {
  NOME_MES, ROTULO_CONFIANCA, ROTULO_PRIORIDADE, ROTULO_PROBLEMA, ROTULO_RELEVO, ROTULO_REQUISITO, ROTULO_RISCO, ROTULO_TEXTURA
} from '../features/fluxo/rotulos';
import { AJUDA_NIVEL, PONTO_DO_PROBLEMA } from '../features/fluxo/CarrosselEstrategias';
import { fraseCalor } from '../features/fluxo/FaixaCalor';
import { fraseMesesAtencao } from '../features/fluxo/MesesAtencao';
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
  return `${p.pergunta} ${p.porque} ${tx('Toque em sim ou em não.', 'Tap yes or no.')}`;
}

/** Nomes científicos (latim) ficam só na tela; a voz não os lê. */
const NOMES_EM_LATIM =
  /\b(Crotalaria|juncea|spectabilis|Mucuna|aterrima|Canavalia|ensiformis|Sorghum|bicolor|Pennisetum|glaucum|Saccharum|Glycine|Arachis|hypogaea|Zea|mays|Triticum|aestivum|Manihot|esculenta|Urochloa|Brachiaria)\b/;
function semLatim(texto: string): string {
  return texto
    .replace(/\s*\([^()]*\)/g, trecho => (NOMES_EM_LATIM.test(trecho) ? '' : trecho)) // "(Sorghum bicolor)"
    .replace(/,\s*[a-z]+ (?:ou|or) [a-z]+\?/g, trecho => (NOMES_EM_LATIM.test(trecho) ? '?' : trecho)) // ", juncea ou spectabilis?"
    .replace(/\s{2,}/g, ' ');
}

/** Como cada problema soa na narração: "Contra praga e nematoide, ajuda pouco." */
const PROBLEMA_FALADO: Record<ProblemaId, string> = traduzivel({
  nematoides_pragas: L('Contra praga e nematoide', 'Against pests and nematodes'),
  solo_cansado: L('Para a lavoura que está produzindo menos', 'For the crop that is yielding less'),
  preco_baixo: L('Para o preço ruim', 'For the bad price')
});

/** Um caminho na ordem da tela: o que ele atende e se ajuda no problema marcado (mesma regra do cartão). */
function fraseCaminho(e: Estrategia, i: number, total: number, prioridades: PrioridadeId[], problemas: ProblemaId[]): string {
  if (e.eh_pratica_atual) {
    const qual = i === total - 1 ? tx('O último', 'The last') : ORDINAL[i] ?? tx('Outro', 'Another');
    return `${qual}: ${minuscula(e.nome)}. ${tx('É o jeito de hoje, para comparar.', 'It is today’s practice, for comparison.')}`;
  }
  const partes = [`${ORDINAL[i] ?? tx('Outro', 'Another')}: ${minuscula(e.nome)}.`];
  const atende = e.prioridades_atendidas.filter(p => prioridades.includes(p)).map(p => minuscula(ROTULO_PRIORIDADE[p].nome));
  if (atende.length) partes.push(`${tx('Atende ao que você escolheu:', 'It matches what you chose:')} ${emFrase(atende)}.`);
  problemas.forEach(pr => partes.push(`${PROBLEMA_FALADO[pr]}, ${AJUDA_NIVEL[e.atributos[PONTO_DO_PROBLEMA[pr]]].texto}.`));
  return partes.join(' ');
}

function roteiroTalhao(a: Analise): string {
  const t = a.talhao;
  const partes: string[] = [];
  if (t.textura_solo) partes.push(tx(`Pelos mapas, a terra aí é ${minuscula(ROTULO_TEXTURA[t.textura_solo].nome)}.`, `From the maps, the soil there is ${minuscula(ROTULO_TEXTURA[t.textura_solo].nome)}.`));
  if (t.relevo) partes.push(tx(`O terreno é ${minuscula(ROTULO_RELEVO[t.relevo].nome)}.`, `The terrain is a ${minuscula(ROTULO_RELEVO[t.relevo].nome)}.`));
  if (t.risco_erosao) partes.push(tx(`O risco de a chuva levar terra é ${minuscula(ROTULO_RISCO[t.risco_erosao])}.`, `The risk of rain washing soil away is ${minuscula(ROTULO_RISCO[t.risco_erosao])}.`));
  if (t.risco_seca) partes.push(tx(`O risco de seca é ${minuscula(ROTULO_RISCO[t.risco_seca])}.`, `The drought risk is ${minuscula(ROTULO_RISCO[t.risco_seca])}.`));
  if (t.risco_geada) partes.push(tx(`O risco de geada é ${minuscula(ROTULO_RISCO[t.risco_geada])}.`, `The frost risk is ${minuscula(ROTULO_RISCO[t.risco_geada])}.`));
  if (a.estresse_termico || a.geada) partes.push(fraseMesesAtencao(a.estresse_termico ?? null, a.geada, a.clima_mensal));
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
    e.lacunas.length ? `${tx('O que ainda não sabemos.', 'What we do not know yet.')} ${e.lacunas.join(' ')}` : '',
    tx(
      'Logo abaixo do objetivo está o ano da sua terra. Toque em: ver o ano passar, para ver mês a mês como fica o chão e quanta chuva cai.',
      'Right below the goal is your field’s year. Tap: watch the year go by, to see month by month how the ground looks and how much rain falls.'
    ),
    `${tx('Uma boa pergunta para levar ao agrônomo:', 'A good question to take to the agronomist:')} ${e.pergunta_especialista}`,
    e.confianca === 'baixa'
      ? tx(
          'Atenção: há pouco volume de dados de referência para este caminho. Confira com um consultor agrônomo.',
          'Note: there is little reference data for this option. Check with an agronomist.'
        )
      : `${tx('Nível de certeza:', 'How sure:')} ${minuscula(ROTULO_CONFIANCA[e.confianca])}.`,
    tx('Para ver a chuva do lugar, toque em: ver a chuva.', 'To see the rain for the place, tap: see the rain.')
  ]
    .filter(Boolean)
    .map(semLatim)
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
    tx('Para seguir, toque em: antes de decidir.', 'To go on, tap: before you decide.')
  ].join(' ');
}

export function roteiroDaTela(etapa: Etapa, dados: DadosFluxo, analise: Analise | null, estrategia: Estrategia | null): string {
  const aviso =
    USANDO_MOCK && SINALIZAR_MOCK
      ? tx('Lembrete: estes dados são de exemplo. ', 'Reminder: this is sample data. ')
      : analise?.eh_mock
        ? tx(
            'Lembrete: estes caminhos são uma simulação de teste, ainda sem conferência de um agrônomo; o clima é real. ',
            'Reminder: these options are a test simulation, not yet checked by an agronomist; the climate is real. '
          )
        : '';
  const v = vocabulario(dados.cultura_atual_id, dados.nomeCultura);
  switch (etapa) {
    case 'inicio':
      return tx(
        'Olá. Vai trocar ou renovar a lavoura? Mostramos o que dá para fazer com a terra até o próximo plantio. Para começar, toque no botão verde grande: usar onde estou agora. O celular vai perguntar se pode usar a localização. É só tocar em permitir. Se preferir, toque em: prefiro escrever a cidade. Em qualquer tela, o botão voltar ao menu inicial traz você de volta para cá. As palavras técnicas estão explicadas no glossário, no fim da página.',
        'Hello. Switching or renewing your crop? We show what you can do with the land until the next planting. To start, tap the big green button: use my current location. Your phone will ask whether it can use your location. Just tap allow. If you prefer, tap: I’d rather type the town. On any screen, the back to the start button brings you back here. Technical words are explained in the glossary at the bottom of the page.'
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
      return tx('O que está plantado aí hoje? Toque na figura.', 'What is planted there today? Tap a picture.');
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
            dados.problemas.includes('nematoides_pragas')
              ? tx(
                  'Antes, um lembrete: para controlar praga e nematoide, procure um engenheiro agrônomo. Aqui é só uma sugestão.',
                  'First, a reminder: to control pests and nematodes, talk to an agronomist. This is only a suggestion.'
                )
              : '',
            tx(
              `São ${analise.estrategias.length} caminhos para ${v.aPeriodo}. Primeiro vêm os que combinam com o que você escolheu. Por último, o jeito de hoje, para comparar.`,
              `There are ${analise.estrategias.length} options for ${v.aPeriodo}. First come the ones that match what you chose. Last, today’s practice, for comparison.`
            ),
            ...analise.estrategias.map((e, i) => fraseCaminho(e, i, analise.estrategias.length, dados.prioridades, dados.problemas)),
            tx(
              'Para ver um caminho por vez, passe para o lado ou use as setas. Para ver tudo de um caminho, toque em: ver tudo sobre este caminho.',
              'To see one option at a time, swipe sideways or use the arrows. To see everything about an option, tap: see everything about this option.'
            ),
            roteiroTalhao(analise) ? `${tx('Depois dos caminhos, a sua terra pelos mapas.', 'After the options, your land from the maps.')} ${roteiroTalhao(analise)}` : '',
            tx('Para ver todos juntos, toque em: comparar.', 'To see them all together, tap: compare.')
          ].join(' ')
        : tx('Estou montando os caminhos. Só um instante.', 'I am building the options. Just a moment.');
    case 'comparar':
      return (
        aviso +
        tx(
          'Aqui os caminhos estão lado a lado. Os tracinhos verdes são bons para você. Os laranja são pontos de atenção. Quanto mais tracinhos, mais forte. Em gasta água e em dá trabalho e gasto, menos é melhor. Para reorganizar, toque no que mais importa para você, por exemplo: segura a terra na chuva. O melhor caminho naquilo vai para a frente, com uma estrela. Depois, escolha o seu caminho lá embaixo.',
          'Here the options are side by side. Green dashes are good for you. Orange ones are watch points. The more dashes, the stronger. For uses water and for work and cost, less is better. To reorder, tap what matters most to you, for example: holds soil in the rain. The best option for that moves to the front, with a star. Then choose your option at the bottom.'
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
        `Este é o seu resumo. Ele junta a sua área e os caminhos, com as figuras. Antes de decidir, três coisas. Primeiro: mostre este resumo ao agrônomo. ${v.ondeAgronomo} Segundo: faça a análise de solo antes de ${v.aPeriodo}. Terceiro: confira a melhor época de plantar no aplicativo Plantio Certo. Embaixo de cada caminho, o resumo diz por que pode dar certo e o que pode dar errado. Se quiser, toque em: imprimir ou salvar, para levar no papel. Para fazer de novo, toque em: começar de novo.`,
        `This is your summary. It brings together your field and the options, with pictures. Before deciding, three things. First: show this summary to an agronomist. ${v.ondeAgronomo} Second: get a soil test before ${v.aPeriodo}. Third: check the best planting window in the Plantio Certo app. Under each option, the summary says why it may work and what may go wrong. If you like, tap: print or save, to take it on paper. To do it again, tap: start over.`
      );
  }
}
