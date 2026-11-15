// Monta os caminhos a partir da escolha do motor de decisão (backend), sem servidor.
// A ESCOLHA (quais 3 caminhos, quem ficou de fora e por quê) vem pronta da tabela
// gerada por web/Backend/app/modelos/motor_decisao.py. Aqui só se monta o texto.
import type { AnaliseEntrada, Estrategia, PrioridadeId, RequisitoId } from '../tipos';
import { CATALOGO_ESTRATEGIAS, CATALOGO_ESTRATEGIAS_EN, CODIGOS_COM_ZARC, SUGESTOES } from './estrategiasMotor';
import { idiomaAtual, L, traduzivel, tx } from '../../i18n/idioma';

/** Catálogo no idioma da tela (os textos em inglês vêm de catalogo_reforma_cana.en.json). */
const catalogo = () => (idiomaAtual() === 'en' ? CATALOGO_ESTRATEGIAS_EN : CATALOGO_ESTRATEGIAS);

const REQUISITOS: RequisitoId[] = ['maquinas_graos', 'comprador_graos', 'irrigacao'];

/** Mesmos nomes de ROTULO_PRIORIDADE (features/fluxo/rotulos.ts), em minúscula para o meio da frase. */
const NOME_PRIORIDADE: Record<PrioridadeId, string> = traduzivel({
  reducao_erosao: L('não deixar a chuva levar a terra', 'keep the rain from washing the soil away'),
  materia_organica: L('deixar a terra mais rica', 'make the soil richer'),
  fixacao_nitrogenio: L('gastar menos adubo', 'spend less on fertilizer'),
  uso_agua: L('aguentar a seca', 'handle drought'),
  adequacao_mercado: L('ter renda até o próximo plantio', 'earn income until the next planting'),
  valor_forragem: L('tratar o gado', 'feed livestock')
});

const POR_QUE_FICOU_DE_FORA: Record<string, string> = traduzivel({
  sem_maquina: L('você disse que não tem máquina para grão', 'you said you do not have grain machinery'),
  sem_comprador: L('você disse que não tem para quem vender grão', 'you said you do not have a grain buyer'),
  sem_irrigacao: L('você disse que não tem irrigação', 'you said you do not have irrigation'),
  fora_zarc: L(
    'o zoneamento do Ministério da Agricultura (ZARC) não indica plantar de outubro a dezembro na sua cidade',
    'Brazil’s Ministry of Agriculture zoning (ZARC) does not recommend planting from October to December in your town'
  )
});

const emFrase = (itens: string[]) => (itens.length <= 1 ? itens[0] ?? '' : `${itens.slice(0, -1).join(', ')} ${tx('e', 'and')} ${itens[itens.length - 1]}`);
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
    const base = catalogo()[id];
    if (base.eh_pratica_atual) return base;
    const motivo = contam.length > 0
      ? tx(`Combina com o que você escolheu: ${emFrase(contam.map(p => NOME_PRIORIDADE[p]))}.`, `Matches what you chose: ${emFrase(contam.map(p => NOME_PRIORIDADE[p]))}.`)
      : algumFicouDeFora
        ? tx(
            'As opções que mais combinavam com o que você escolheu precisam de algo que você não tem. Esta é a melhor entre as que sobraram.',
            'The options that best matched your choices need something you do not have. This is the best of the rest.'
          )
        : tx('Boa opção para proteger a terra durante a reforma.', 'A good option to protect the soil during the renewal.');
    const zarc = risco !== null
      ? [
          tx(
            `Pelo zoneamento do Ministério da Agricultura (ZARC), dá para plantar ${nomeCurto(base).toLowerCase()} de outubro a dezembro em ${municipio}, com risco de perda de ${risco}%.`,
            `According to Brazil’s Ministry of Agriculture zoning (ZARC), ${nomeCurto(base).toLowerCase()} can be planted from October to December in ${municipio}, with a ${risco}% risk of loss.`
          )
        ]
      : [];
    return { ...base, motivos: [motivo, ...base.motivos], evidencias: [...zarc, ...base.evidencias] };
  });

  const limitacoes = escolha.f.map(
    ([id, motivo]) => `${nomeCurto(catalogo()[id])} ${tx('ficou de fora porque', 'was left out because')} ${POR_QUE_FICOU_DE_FORA[motivo] ?? motivo}.`
  );
  if (!(entrada.codigo_ibge && CODIGOS_COM_ZARC.includes(entrada.codigo_ibge))) {
    limitacoes.push(
      tx(
        'Ainda não conferimos o zoneamento (ZARC) da sua cidade. Confira a época de plantar no aplicativo Plantio Certo.',
        'We have not checked the planting zoning (ZARC) for your town yet. Check the planting window in the Plantio Certo app.'
      )
    );
  }
  return { estrategias, limitacoes };
}

/** Os 3 caminhos de antes, para quem usa ANALISE_MOCK sem passar pelo motor. */
export const ESTRATEGIAS_PADRAO: Estrategia[] = ['pousio', 'amendoim', 'crotalaria'].map(id => CATALOGO_ESTRATEGIAS[id]);
