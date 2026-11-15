// Textos exibidos para identificadores da API. A UI nunca usa estes textos
// como identificador (convenção §6): a chave é sempre o id técnico.
import type {
  AtributosEstrategia, Confianca, CoberturaSolo, Nivel, PrioridadeId, ProblemaId,
  Relevo, RequisitoId, Resposta, TexturaSolo, TipoDado
} from '../../api/tipos';
import type { NomePictograma } from '../../components/Pictograma';
import { L, localeAtual, MESES_CURTOS, MESES_LONGOS, traduzivel, tx } from '../../i18n/idioma';

export const NOME_MES_CURTO = MESES_CURTOS;
export const NOME_MES = MESES_LONGOS;

/**
 * Na explicação, {safra} vira "próxima safra de <cultura escolhida>" (ou só "próxima safra").
 * Use sempre explicacaoPrioridade(): o texto não pode citar uma cultura fixa, porque vale para
 * qualquer cultura cadastrada.
 */
export const ROTULO_PRIORIDADE: Record<PrioridadeId, { nome: string; explicacao: string }> = traduzivel({
  reducao_erosao: {
    nome: L('Não deixar a chuva levar a terra', 'Keep the rain from washing the soil away'),
    explicacao: L('Evita que a enxurrada arraste o solo fértil e abra valetas.', 'Stops runoff from carrying off fertile soil and cutting gullies.')
  },
  materia_organica: {
    nome: L('Deixar a terra mais rica', 'Make the soil richer'),
    explicacao: L('Mais palha e raízes no solo, que se transformam em nutrientes para a {safra}.', 'More straw and roots in the soil, which turn into nutrients for the {safra}.')
  },
  fixacao_nitrogenio: {
    nome: L('Gastar menos adubo', 'Spend less on fertilizer'),
    explicacao: L('Plantas que deixam nitrogênio no solo e reduzem o adubo da {safra}.', 'Plants that leave nitrogen in the soil and cut the fertilizer needed for the {safra}.')
  },
  uso_agua: {
    nome: L('Aguentar a seca', 'Handle drought'),
    explicacao: L('Culturas que exigem pouca água ou ajudam o solo a reter umidade.', 'Crops that need little water or help the soil hold moisture.')
  },
  adequacao_mercado: {
    nome: L('Ter renda até o próximo plantio', 'Earn income until the next planting'),
    explicacao: L('Uma lavoura com compradores na região, que gere receita até o próximo plantio.', 'A crop with buyers in the region that brings in money until the next planting.')
  },
  valor_forragem: {
    nome: L('Tratar o gado', 'Feed livestock'),
    explicacao: L('Produção de pasto, silagem ou feno para alimentar os animais.', 'Pasture, silage or hay to feed the animals.')
  }
});

export const ORDEM_PRIORIDADES: PrioridadeId[] = [
  'reducao_erosao', 'materia_organica', 'fixacao_nitrogenio', 'uso_agua', 'adequacao_mercado', 'valor_forragem'
];

export const ROTULO_PROBLEMA: Record<ProblemaId, string> = traduzivel({
  solo_cansado: L('A cana está produzindo menos', 'The cane is yielding less'),
  nematoides_pragas: L('Tem praga ou nematoide', 'There are pests or nematodes'),
  preco_baixo: L('O preço está ruim', 'Prices are bad')
});

/** Nome curto para o que os mapas mostram, com uma frase de como a pessoa reconhece no chão. */
export const ROTULO_TEXTURA: Record<TexturaSolo, { nome: string; dica: string }> = traduzivel({
  arenosa: { nome: L('Arenosa', 'Sandy'), dica: L('Solta, esfarela na mão e seca rápido.', 'Loose, crumbles in your hand and dries fast.') },
  media: { nome: L('Mista', 'Loam'), dica: L('Nem muito solta nem muito grudenta.', 'Neither too loose nor too sticky.') },
  argilosa: { nome: L('Argilosa', 'Clay'), dica: L('Vermelha ou roxa, gruda na bota quando molha.', 'Red or purple, sticks to your boots when wet.') }
});

export const ROTULO_RELEVO: Record<Relevo, { nome: string; dica: string }> = traduzivel({
  plano: { nome: L('Plano', 'Flat'), dica: L('A água da chuva quase não corre.', 'Rainwater barely runs off.') },
  suave_ondulado: { nome: L('Pouco inclinado', 'Gentle slope'), dica: L('Tem caimento, mas a máquina trabalha bem.', 'It slopes, but machines work fine.') },
  ondulado: { nome: L('Bem inclinado', 'Steep slope'), dica: L('A enxurrada corre forte.', 'Runoff flows hard.') }
});

/** Uma pergunta por tela. `porque` aparece pequeno embaixo, para quem quiser saber. */
export const ROTULO_REQUISITO: Record<RequisitoId, { pergunta: string; porque: string; nome: string }> = traduzivel({
  maquinas_graos: {
    pergunta: L('Você tem máquina para plantar e colher grão?', 'Do you have machinery to plant and harvest grain?'),
    porque: L('Pode ser sua, alugada ou de um vizinho. Amendoim e soja precisam disso.', 'Your own, rented or a neighbor’s. Peanuts and soybeans need it.'),
    nome: L('Máquina para grão', 'Grain machinery')
  },
  comprador_graos: {
    pergunta: L('Tem para quem vender grão aqui perto?', 'Is there someone nearby who buys grain?'),
    porque: L('Uma cerealista, cooperativa ou indústria que compre a safra.', 'A grain elevator, co-op or mill that buys the harvest.'),
    nome: L('Para quem vender', 'Grain buyer')
  },
  irrigacao: {
    pergunta: L('Esse talhão tem irrigação ou recebe vinhaça?', 'Is this field irrigated or does it receive vinasse?'),
    porque: L('Com água garantida, dá para plantar mais cedo sem esperar a chuva.', 'With guaranteed water, you can plant earlier without waiting for rain.'),
    nome: L('Irrigação', 'Irrigation')
  }
});

export const ROTULO_RESPOSTA: Record<Resposta, string> = traduzivel({ sim: L('Sim', 'Yes'), nao: L('Não', 'No'), nao_sei: L('Não sei', 'Not sure') });

export const ROTULO_NIVEL: Record<Nivel, string> = traduzivel({
  nenhum: L('Nada', 'None'), baixo: L('Pouco', 'Low'), medio: L('Médio', 'Medium'), alto: L('Muito', 'High')
});
/** Para riscos do talhão ("Risco de erosão: alto"). */
export const ROTULO_RISCO: Record<Nivel, string> = traduzivel({
  nenhum: L('Quase nenhum', 'Almost none'), baixo: L('Baixo', 'Low'), medio: L('Médio', 'Medium'), alto: L('Alto', 'High')
});

export const ROTULO_ATRIBUTO: Record<keyof AtributosEstrategia, { nome: string; maiorEhMelhor: boolean }> = traduzivel({
  protecao_solo: { nome: L('Segura a terra na chuva', 'Holds soil in the rain'), maiorEhMelhor: true },
  materia_organica: { nome: L('Deixa a terra mais rica', 'Makes the soil richer'), maiorEhMelhor: true },
  fixacao_nitrogenio: { nome: L('Economiza adubo', 'Saves fertilizer'), maiorEhMelhor: true },
  quebra_pragas: { nome: L('Ajuda contra praga', 'Helps against pests'), maiorEhMelhor: true },
  renda_direta: { nome: L('Dá dinheiro até o próximo plantio', 'Earns money until the next planting'), maiorEhMelhor: true },
  demanda_agua: { nome: L('Gasta água', 'Uses water'), maiorEhMelhor: false },
  trabalho_custo: { nome: L('Dá trabalho e gasto', 'Work and cost'), maiorEhMelhor: false },
  valor_forragem: { nome: L('Dá comida pro gado', 'Feeds livestock'), maiorEhMelhor: true }
});

/** O que cada ponto quer dizer, em uma frase (legenda de "Todos os pontos"). */
export const DESCRICAO_ATRIBUTO: Record<keyof AtributosEstrategia, string> = traduzivel({
  protecao_solo: L('Quanto a planta ou a palha cobrem o chão e seguram a terra contra a enxurrada.', 'How much the plants or straw cover the ground and hold the soil against runoff.'),
  materia_organica: L('Quanto de palha e raiz fica no solo e vira matéria orgânica, que guarda água e nutriente.', 'How much straw and root stays in the soil and becomes organic matter, which holds water and nutrients.'),
  fixacao_nitrogenio: L('Plantas como crotalária e mucuna tiram nitrogênio do ar e deixam no solo; isso reduz o adubo da próxima lavoura.', 'Plants such as sunn hemp and velvet bean take nitrogen from the air and leave it in the soil; that cuts fertilizer for the next crop.'),
  quebra_pragas: L('Trocar de planta corta o ciclo de pragas e doenças que vivem na lavoura principal.', 'Switching plants breaks the cycle of pests and diseases that live on the main crop.'),
  renda_direta: L('Se o intervalo dá alguma colheita para vender antes do próximo plantio.', 'Whether the gap gives a harvest to sell before the next planting.'),
  demanda_agua: L('Quanta água a planta do intervalo precisa. Aqui, menos é melhor.', 'How much water the gap crop needs. Here, less is better.'),
  trabalho_custo: L('Semente, máquina e mão de obra que o caminho pede. Aqui, menos é melhor.', 'Seed, machinery and labor the option needs. Here, less is better.'),
  valor_forragem: L('Se a planta do intervalo serve de alimento para o gado.', 'Whether the gap crop can feed livestock.')
});

export const ROTULO_CONFIANCA: Record<Confianca, string> = traduzivel({
  alta: L('Bastante certeza', 'Fairly sure'),
  media: L('Alguma certeza', 'Somewhat sure'),
  baixa: L('Pouca certeza', 'Not very sure')
});

export const ROTULO_COBERTURA: Record<CoberturaSolo, { nome: string; classe: string }> = traduzivel({
  solo_descoberto: { nome: L('Terra descoberta', 'Bare soil'), classe: 'cobertura-descoberto' },
  cultura_intermediaria: { nome: L('Lavoura do intervalo', 'Gap crop'), classe: 'cobertura-intermediaria' },
  adubo_verde: { nome: L('Adubo verde', 'Green manure'), classe: 'cobertura-adubo' },
  palhada: { nome: L('Palha cobrindo o chão', 'Straw covering the ground'), classe: 'cobertura-palhada' },
  cultura_principal: { nome: L('Cultura principal', 'Main crop'), classe: 'cobertura-principal' }
});

export const ROTULO_TIPO_DADO: Record<TipoDado, string> = traduzivel({
  observacao_historica: L('Histórico observado', 'Observed history'),
  previsao: L('Previsão', 'Forecast'),
  simulacao: L('Simulação', 'Simulation')
});

// ---------- pictogramas de cada opção (ver components/Pictograma.tsx) ----------
export const PICTO_PRIORIDADE: Record<PrioridadeId, NomePictograma> = {
  reducao_erosao: 'segurar_solo',
  materia_organica: 'terra_forte',
  fixacao_nitrogenio: 'nitrogenio',
  uso_agua: 'seca',
  adequacao_mercado: 'renda',
  valor_forragem: 'gado'
};
export const PICTO_PROBLEMA: Record<ProblemaId, NomePictograma> = {
  solo_cansado: 'solo_cansado',
  nematoides_pragas: 'pragas',
  preco_baixo: 'preco_baixo'
};
export const PICTO_REQUISITO: Record<RequisitoId, NomePictograma> = {
  maquinas_graos: 'trator',
  comprador_graos: 'silo',
  irrigacao: 'irrigacao'
};
export const PICTO_ATRIBUTO: Record<keyof AtributosEstrategia, NomePictograma> = {
  protecao_solo: 'segurar_solo',
  materia_organica: 'terra_forte',
  fixacao_nitrogenio: 'nitrogenio',
  quebra_pragas: 'quebra_pragas',
  renda_direta: 'renda',
  demanda_agua: 'agua',
  trabalho_custo: 'trabalho',
  valor_forragem: 'gado'
};
/** Textura e relevo usam o próprio id como nome do pictograma. */
export const PICTO_TEXTURA: Record<TexturaSolo, NomePictograma> = { arenosa: 'arenosa', media: 'media', argilosa: 'argilosa' };
export const PICTO_RELEVO: Record<Relevo, NomePictograma> = { plano: 'plano', suave_ondulado: 'suave_ondulado', ondulado: 'ondulado' };

export const formatarNumero = (valor: number) => new Intl.NumberFormat(localeAtual(), { maximumFractionDigits: 2 }).format(valor);
export const anoDe = (data: string) => data.slice(0, 4);

/** Explicação da prioridade já com a cultura que a pessoa escolheu (ex.: "próxima safra de milho"). */
export function explicacaoPrioridade(id: PrioridadeId, nomeCultura: string | null): string {
  const safra = nomeCultura
    ? tx(`próxima safra de ${nomeCultura.toLocaleLowerCase('pt-BR')}`, `next ${nomeCultura.toLocaleLowerCase('en-US')} crop`)
    : tx('próxima safra', 'next crop');
  return ROTULO_PRIORIDADE[id].explicacao.replace('{safra}', safra);
}
