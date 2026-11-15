// Roteiros falados por tela (convenção §9). São escritos para serem OUVIDOS:
// frases curtas, ditas como alguém explicando ao lado, e não a leitura da tela.
// Regras: nada de sigla solta ("SP" vira o nome da cidade), nada de lista colada
// com ponto e vírgula, sempre terminar dizendo o que fazer em seguida.
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

const ORDINAL = ['O primeiro', 'O segundo', 'O terceiro', 'O quarto', 'O quinto'];

function emFrase(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function roteiroRecurso(r: RequisitoId): string {
  const p = ROTULO_REQUISITO[r];
  return `${p.pergunta} ${p.porque} Toque em sim ou em não.`;
}

/** Nomes científicos (latim) ficam só na tela; a voz não os lê. */
const NOMES_EM_LATIM =
  /\b(Crotalaria|juncea|spectabilis|Mucuna|aterrima|Canavalia|ensiformis|Sorghum|bicolor|Pennisetum|glaucum|Saccharum|Glycine|Arachis|hypogaea|Zea|mays|Triticum|aestivum|Manihot|esculenta|Urochloa|Brachiaria)\b/;
function semLatim(texto: string): string {
  return texto
    .replace(/\s*\([^()]*\)/g, trecho => (NOMES_EM_LATIM.test(trecho) ? '' : trecho)) // "(Sorghum bicolor)"
    .replace(/,\s*[a-z]+ ou [a-z]+\?/g, trecho => (NOMES_EM_LATIM.test(trecho) ? '?' : trecho)) // ", juncea ou spectabilis?"
    .replace(/\s{2,}/g, ' ');
}

/** Como cada problema soa na narração: "Contra praga e nematoide, ajuda pouco." */
const PROBLEMA_FALADO: Record<ProblemaId, string> = {
  nematoides_pragas: 'Contra praga e nematoide',
  solo_cansado: 'Para a lavoura que está produzindo menos',
  preco_baixo: 'Para o preço ruim'
};

/** Um caminho na ordem da tela: o que ele atende e se ajuda no problema marcado (mesma regra do cartão). */
function fraseCaminho(e: Estrategia, i: number, total: number, prioridades: PrioridadeId[], problemas: ProblemaId[]): string {
  if (e.eh_pratica_atual) return `${i === total - 1 ? 'O último' : ORDINAL[i] ?? 'Outro'}: ${minuscula(e.nome)}. É o jeito de hoje, para comparar.`;
  const partes = [`${ORDINAL[i] ?? 'Outro'}: ${minuscula(e.nome)}.`];
  const atende = e.prioridades_atendidas.filter(p => prioridades.includes(p)).map(p => minuscula(ROTULO_PRIORIDADE[p].nome));
  if (atende.length) partes.push(`Atende ao que você escolheu: ${emFrase(atende)}.`);
  problemas.forEach(pr => partes.push(`${PROBLEMA_FALADO[pr]}, ${AJUDA_NIVEL[e.atributos[PONTO_DO_PROBLEMA[pr]]].texto}.`));
  return partes.join(' ');
}

function roteiroTalhao(a: Analise): string {
  const t = a.talhao;
  const partes: string[] = [];
  if (t.textura_solo) partes.push(`Pelos mapas, a terra aí é ${minuscula(ROTULO_TEXTURA[t.textura_solo].nome)}.`);
  if (t.relevo) partes.push(`O terreno é ${minuscula(ROTULO_RELEVO[t.relevo].nome)}.`);
  if (t.risco_erosao) partes.push(`O risco de a chuva levar terra é ${minuscula(ROTULO_RISCO[t.risco_erosao])}.`);
  if (t.risco_seca) partes.push(`O risco de seca é ${minuscula(ROTULO_RISCO[t.risco_seca])}.`);
  if (t.risco_geada) partes.push(`O risco de geada é ${minuscula(ROTULO_RISCO[t.risco_geada])}.`);
  if (a.estresse_termico || a.geada) partes.push(fraseMesesAtencao(a.estresse_termico ?? null, a.geada, a.clima_mensal));
  if (a.estresse_termico) partes.push(fraseCalor(a.estresse_termico));
  if (a.geada) partes.push(fraseGeada(a.geada));
  if (a.precipitacao_extrema) partes.push(fraseChuvaExtrema(a.precipitacao_extrema));
  if (a.tendencia_hidrica) partes.push(fraseTendencia(a.tendencia_hidrica));
  if (a.estresse_vegetal) partes.push(fraseEstresse(a.estresse_vegetal));
  if (partes.length) partes.push('Se não for bem assim, toque em: não é bem assim.');
  return partes.join(' ');
}

function roteiroEstrategia(e: Estrategia): string {
  return [
    `${e.nome}.`,
    e.resumo,
    e.objetivo ? `A ideia é: ${minuscula(e.objetivo)}` : '',
    e.beneficios.length ? `O que você ganha. ${e.beneficios.join(' ')}` : '',
    e.riscos.length ? `Agora, os cuidados. ${e.riscos.join(' ')}` : '',
    e.lacunas.length ? `O que ainda não sabemos. ${e.lacunas.join(' ')}` : '',
    'Logo abaixo do objetivo está o ano da sua terra. Toque em: ver o ano passar, para ver mês a mês como fica o chão e quanta chuva cai.',
    `Uma boa pergunta para levar ao agrônomo: ${e.pergunta_especialista}`,
    e.confianca === 'baixa'
      ? 'Atenção: há pouco volume de dados de referência para este caminho. Confira com um consultor agrônomo.'
      : `Nível de certeza: ${minuscula(ROTULO_CONFIANCA[e.confianca])}.`,
    'Para ver a chuva do lugar, toque em: ver a chuva.'
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
  return [
    `Aqui é como costuma chover aí, mês a mês, olhando mais de 30 anos.`,
    `Os meses de mais chuva são ${emFrase(maisChuvosos)}.`,
    descobertos.length
      ? `Nesse caminho, a terra fica descoberta em ${descobertos.length} ${descobertos.length === 1 ? 'mês' : 'meses'}. Cai nesse tempo ${pct} por cento da chuva do ano. É aí que a chuva leva terra embora.`
      : 'Nesse caminho, a terra fica coberta o ano todo. Isso protege bem contra a chuva forte.',
    'Para seguir, toque em: antes de decidir.'
  ].join(' ');
}

export function roteiroDaTela(etapa: Etapa, dados: DadosFluxo, analise: Analise | null, estrategia: Estrategia | null): string {
  const aviso = USANDO_MOCK && SINALIZAR_MOCK ? 'Lembrete: estes dados são de exemplo. ' : analise?.eh_mock ? 'Lembrete: estes caminhos são uma simulação de teste, ainda sem conferência de um agrônomo; o clima é real. ' : '';
  const v = vocabulario(dados.cultura_atual_id, dados.nomeCultura);
  switch (etapa) {
    case 'inicio':
      return 'Olá. Vai trocar ou renovar a lavoura? Mostramos o que dá para fazer com a terra até o próximo plantio. Para começar, toque no botão verde grande: usar onde estou agora. O celular vai perguntar se pode usar a localização. É só tocar em permitir. Se preferir, toque em: prefiro escrever a cidade. Em qualquer tela, o botão voltar ao menu inicial traz você de volta para cá. As palavras técnicas estão explicadas no glossário, no fim da página.';
    case 'local':
      return dados.modoLocal === 'confirmar' && dados.local
        ? `Pelo celular, você está perto de ${dados.local.municipio}. É aí que fica a plantação? Se for, toque em: sim, é aqui. Se não for, toque em: não, é em outro lugar.`
        : 'Em qual cidade fica a plantação? Escreva o nome no campo. Não precisa de acento. Quando a cidade aparecer embaixo, toque nela.';
    case 'cultura':
      return 'O que está plantado aí hoje? Toque na figura.';
    case 'maquinas_graos':
    case 'comprador_graos':
    case 'irrigacao':
      return roteiroRecurso(etapa);
    case 'problemas':
      return `Alguma dessas coisas está acontecendo? ${emFrase((Object.keys(ROTULO_PROBLEMA) as (keyof typeof ROTULO_PROBLEMA)[]).map(p => minuscula(p === 'solo_cansado' ? v.produzindoMenos : ROTULO_PROBLEMA[p])))}. Pode tocar em mais de uma. Se não for nada disso, toque em: nada disso. Depois toque em continuar.`;
    case 'prioridades':
      return `${v.nestePeriodo}, o que é mais importante para você? Escolha até duas coisas. As opções são: ${emFrase(Object.values(ROTULO_PRIORIDADE).map(p => minuscula(p.nome)))}. Depois toque em: ver os caminhos.`;
    case 'estrategias':
      return analise
        ? [
            aviso,
            dados.problemas.includes('nematoides_pragas')
              ? 'Antes, um lembrete: para controlar praga e nematoide, procure um engenheiro agrônomo. Aqui é só uma sugestão.'
              : '',
            `São ${analise.estrategias.length} caminhos para ${v.aPeriodo}. Primeiro vêm os que combinam com o que você escolheu. Por último, o jeito de hoje, para comparar.`,
            ...analise.estrategias.map((e, i) => fraseCaminho(e, i, analise.estrategias.length, dados.prioridades, dados.problemas)),
            'Para ver um caminho por vez, passe para o lado ou use as setas. Para ver tudo de um caminho, toque em: ver tudo sobre este caminho.',
            roteiroTalhao(analise) ? `Depois dos caminhos, a sua terra pelos mapas. ${roteiroTalhao(analise)}` : '',
            'Para ver todos juntos, toque em: comparar.'
          ].join(' ')
        : 'Estou montando os caminhos. Só um instante.';
    case 'comparar':
      return `${aviso}Aqui os caminhos estão lado a lado. Os tracinhos verdes são bons para você. Os laranja são pontos de atenção. Quanto mais tracinhos, mais forte. Em gasta água e em dá trabalho e gasto, menos é melhor. Para reorganizar, toque no que mais importa para você, por exemplo: segura a terra na chuva. O melhor caminho naquilo vai para a frente, com uma estrela. Depois, escolha o seu caminho lá embaixo.`;
    case 'estrategia':
      return estrategia ? aviso + roteiroEstrategia(estrategia) : '';
    case 'clima':
      return analise && estrategia ? aviso + roteiroClima(analise, estrategia) : '';
    case 'decisao':
      return estrategia ? `Pronto. Você escolheu: ${estrategia.nome}. Agora vamos acompanhar a sua área pelo satélite.` : '';
    case 'producao':
    case 'acompanhamento':
      // O roteiro desta tela vem de features/producao/roteiroProducao.ts (depende dos dados carregados).
      return '';
    case 'proximos':
      return `Este é o seu resumo. Ele junta a sua área e os caminhos, com as figuras. Antes de decidir, três coisas. Primeiro: mostre este resumo ao agrônomo. ${v.ondeAgronomo} Segundo: faça a análise de solo antes de ${v.aPeriodo}. Terceiro: confira a melhor época de plantar no aplicativo Plantio Certo. Embaixo de cada caminho, o resumo diz por que pode dar certo e o que pode dar errado. Se quiser, toque em: imprimir ou salvar, para levar no papel. Para fazer de novo, toque em: começar de novo.`;
  }
}
