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

const ORDINAL = ['O primeiro', 'O segundo', 'O terceiro', 'O quarto', 'O quinto'];

function emFrase(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function roteiroRecurso(r: RequisitoId): string {
  const p = ROTULO_REQUISITO[r];
  return `${p.pergunta} ${p.porque} Toque em sim, em não, ou em não sei.`;
}

function roteiroTalhao(a: Analise): string {
  const t = a.talhao;
  const partes: string[] = [];
  if (t.textura_solo && t.relevo) {
    partes.push(`Pelos mapas, a terra aí é ${minuscula(ROTULO_TEXTURA[t.textura_solo].nome)} e o terreno é ${minuscula(ROTULO_RELEVO[t.relevo].nome)}.`);
  }
  if (t.risco_erosao) partes.push(`O risco de a chuva levar terra é ${minuscula(ROTULO_RISCO[t.risco_erosao])}.`);
  if (t.risco_seca) partes.push(`O risco de seca é ${minuscula(ROTULO_RISCO[t.risco_seca])}.`);
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
    e.lacunas.length ? `O que a gente ainda não sabe. ${e.lacunas.join(' ')}` : '',
    `Uma boa pergunta para levar ao agrônomo: ${e.pergunta_especialista}`,
    'Para ver a chuva do lugar, toque no botão lá embaixo.'
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
  return [
    `Aqui é como costuma chover aí, mês a mês, olhando mais de 30 anos.`,
    `Os meses de mais chuva são ${emFrase(maisChuvosos)}.`,
    descobertos.length
      ? `Nesse caminho, a terra fica descoberta em ${descobertos.length} ${descobertos.length === 1 ? 'mês' : 'meses'}. Cai nesse tempo ${pct} por cento da chuva do ano. É aí que a chuva leva terra embora.`
      : 'Nesse caminho, a terra fica coberta o ano todo. Isso protege bem contra a chuva forte.',
    'Os números também estão numa tabela no fim da tela.'
  ].join(' ');
}

export function roteiroDaTela(etapa: Etapa, dados: DadosFluxo, analise: Analise | null, estrategia: Estrategia | null): string {
  const aviso = analise?.eh_mock && SINALIZAR_MOCK ? 'Lembrete: estes números são de exemplo, inventados para teste. ' : '';
  switch (etapa) {
    case 'inicio':
      return 'Olá. Vai reformar o canavial? A gente mostra o que dá para fazer com a terra até plantar a cana de novo. Para começar, toque no botão verde grande: usar onde estou agora. O celular vai perguntar se pode usar a localização. É só tocar em permitir. Se preferir, toque em: prefiro escrever a cidade.';
    case 'local':
      return dados.modoLocal === 'confirmar' && dados.local
        ? `Pelo celular, você está perto de ${dados.local.municipio}. É aí que fica a plantação? Se for, toque em: sim, é aqui. Se não for, toque em: não, é em outro lugar.`
        : 'Em qual cidade fica a plantação? Escreva o nome no campo. Não precisa de acento. Quando a cidade aparecer embaixo, toque nela.';
    case 'cultura':
      return 'O que está plantado aí hoje? Toque na figura. Por enquanto, a ferramenta ajuda na reforma da cana.';
    case 'maquinas_graos':
    case 'comprador_graos':
    case 'irrigacao':
      return roteiroRecurso(etapa);
    case 'problemas':
      return `Alguma dessas coisas está acontecendo? ${emFrase(Object.values(ROTULO_PROBLEMA).map(minuscula))}. Pode tocar em mais de uma. Se não for nada disso, toque em: nada disso. Depois toque em continuar.`;
    case 'prioridades':
      return `Nesta reforma, o que é mais importante para você? Escolha até duas coisas. As opções são: ${emFrase(Object.values(ROTULO_PRIORIDADE).map(p => minuscula(p.nome)))}. Depois toque em: ver os caminhos.`;
    case 'estrategias':
      return analise
        ? [
            aviso,
            roteiroTalhao(analise),
            `Agora, os ${analise.estrategias.length} caminhos para a reforma.`,
            ...analise.estrategias.map((e, i) => `${ORDINAL[i] ?? 'Outro'}: ${minuscula(e.nome)}.`),
            'Toque num caminho para saber mais, ou em comparar lado a lado.'
          ].join(' ')
        : 'Estou montando os caminhos. Só um instante.';
    case 'comparar':
      return `${aviso}Aqui os caminhos estão lado a lado. Cada linha é uma coisa que importa na reforma. Os tracinhos verdes são bons. Os laranja pesam contra. No celular, arraste a tabela para o lado para ver tudo.`;
    case 'estrategia':
      return estrategia ? aviso + roteiroEstrategia(estrategia) : '';
    case 'clima':
      return analise && estrategia ? aviso + roteiroClima(analise, estrategia) : '';
    case 'proximos':
      return 'Este é o seu resumo. Ele junta a sua área e os caminhos, com as figuras. Antes de decidir, três coisas. Primeiro: mostre este resumo ao agrônomo da usina, da cooperativa ou da Casa da Agricultura. Segundo: faça a análise de solo antes da reforma. Terceiro: confira a melhor época de plantar no aplicativo Plantio Certo. Se quiser, toque em imprimir para levar no papel.';
  }
}
