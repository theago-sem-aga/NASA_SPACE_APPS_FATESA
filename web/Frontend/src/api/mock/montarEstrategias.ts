// Monta os caminhos a partir da escolha do motor de decisão (backend), sem servidor.
// A ESCOLHA (quais 3 caminhos, quem ficou de fora e por quê) vem pronta da tabela
// gerada por web/Backend/app/modelos/motor_decisao.py. Aqui só se monta o texto.
// BACKEND: quando existir POST /api/v1/analises, ele deve chamar motor_decisao.sugerir.
import type { AnaliseEntrada, Estrategia, PrioridadeId, RequisitoId } from '../tipos';
import { CATALOGO_ESTRATEGIAS, CODIGOS_COM_ZARC, SUGESTOES } from './estrategiasMotor';

const REQUISITOS: RequisitoId[] = ['maquinas_graos', 'comprador_graos', 'irrigacao'];

/** Mesmos nomes de ROTULO_PRIORIDADE (features/fluxo/rotulos.ts), em minúscula para o meio da frase. */
const NOME_PRIORIDADE: Record<PrioridadeId, string> = {
  reducao_erosao: 'não deixar a chuva levar a terra',
  materia_organica: 'deixar a terra mais rica',
  fixacao_nitrogenio: 'gastar menos adubo',
  uso_agua: 'aguentar a seca',
  adequacao_mercado: 'ter renda até o próximo plantio',
  valor_forragem: 'tratar o gado'
};

const POR_QUE_FICOU_DE_FORA: Record<string, string> = {
  sem_maquina: 'você disse que não tem máquina para grão',
  sem_comprador: 'você disse que não tem para quem vender grão',
  sem_irrigacao: 'você disse que não tem irrigação',
  fora_zarc: 'o zoneamento do Ministério da Agricultura (ZARC) não indica plantar de outubro a dezembro na sua cidade'
};

const emFrase = (itens: string[]) => (itens.length <= 1 ? itens[0] ?? '' : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`);
const nomeCurto = (e: Estrategia) => e.etapas_rotacao[1]?.nome ?? e.nome;

/** Mesma chave de motor_decisao.chave_tabela: 'n' só quando a resposta foi NÃO. */
function chave(entrada: AnaliseEntrada): string {
  const rec = REQUISITOS.map(r => (entrada.recursos_disponiveis[r] === 'nao' ? 'n' : 's')).join('');
  const codigo = entrada.codigo_ibge && CODIGOS_COM_ZARC.includes(entrada.codigo_ibge) ? entrada.codigo_ibge : '-';
  return `${[...entrada.prioridades].sort().join('+')}|${rec}|${codigo}`;
}

export function montarEstrategias(entrada: AnaliseEntrada, municipio: string): { estrategias: Estrategia[]; limitacoes: string[] } {
  const escolha = SUGESTOES[chave(entrada)] ?? SUGESTOES[`|sss|-`];
  const algumFicouDeFora = escolha.f.length > 0;

  const estrategias = escolha.s.map(([id, contam, risco]) => {
    const base = CATALOGO_ESTRATEGIAS[id];
    if (base.eh_pratica_atual) return base;
    const motivo = contam.length > 0
      ? `Combina com o que você escolheu: ${emFrase(contam.map(p => NOME_PRIORIDADE[p]))}.`
      : algumFicouDeFora
        ? 'As opções que mais combinavam com o que você escolheu precisam de algo que você não tem. Esta é a melhor entre as que sobraram.'
        : 'Boa opção para proteger a terra durante a reforma.';
    const zarc = risco !== null
      ? [`Pelo zoneamento do Ministério da Agricultura (ZARC), dá para plantar ${nomeCurto(base).toLowerCase()} de outubro a dezembro em ${municipio}, com risco de perda de ${risco}%.`]
      : [];
    return { ...base, motivos: [motivo, ...base.motivos], evidencias: [...zarc, ...base.evidencias] };
  });

  const limitacoes = escolha.f.map(([id, motivo]) => `${nomeCurto(CATALOGO_ESTRATEGIAS[id])} ficou de fora porque ${POR_QUE_FICOU_DE_FORA[motivo] ?? motivo}.`);
  if (!(entrada.codigo_ibge && CODIGOS_COM_ZARC.includes(entrada.codigo_ibge))) {
    limitacoes.push('Ainda não conferimos o zoneamento (ZARC) da sua cidade. Confira a época de plantar no aplicativo Plantio Certo.');
  }
  return { estrategias, limitacoes };
}

/** Os 3 caminhos de antes, para quem usa ANALISE_MOCK sem passar pelo motor. */
export const ESTRATEGIAS_PADRAO: Estrategia[] = ['pousio', 'amendoim', 'crotalaria'].map(id => CATALOGO_ESTRATEGIAS[id]);
