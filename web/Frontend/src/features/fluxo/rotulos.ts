// Textos exibidos para identificadores da API. A UI nunca usa estes textos
// como identificador (convenção §6): a chave é sempre o id técnico.
import type {
  AtributosEstrategia, Confianca, CoberturaSolo, Nivel, PrioridadeId, ProblemaId,
  Relevo, RequisitoId, Resposta, TexturaSolo, TipoDado
} from '../../api/tipos';
import type { NomePictograma } from '../../components/Pictograma';

export const NOME_MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const NOME_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/**
 * Na explicação, {safra} vira "próxima safra de <cultura escolhida>" (ou só "próxima safra").
 * Use sempre explicacaoPrioridade(): o texto não pode citar uma cultura fixa, porque vale para
 * qualquer cultura cadastrada.
 */
export const ROTULO_PRIORIDADE: Record<PrioridadeId, { nome: string; explicacao: string }> = {
  reducao_erosao: { nome: 'Não deixar a chuva levar a terra', explicacao: 'Isso evita que a enxurrada arraste o solo fértil e abra valetas.' },
  materia_organica: { nome: 'Deixar a terra mais rica', explicacao: 'Sobra mais palha e raiz no solo, e isso se transforma em nutriente para a {safra}.' },
  fixacao_nitrogenio: { nome: 'Gastar menos adubo', explicacao: 'São plantas que deixam nitrogênio no solo e, com isso, reduzem o adubo da {safra}.' },
  uso_agua: { nome: 'Aguentar a seca', explicacao: 'São culturas que exigem pouca água ou que ajudam o solo a reter umidade.' },
  adequacao_mercado: { nome: 'Ter renda até o próximo plantio', explicacao: 'É uma lavoura com comprador na região, que gera receita até o próximo plantio.' },
  valor_forragem: { nome: 'Tratar o gado', explicacao: 'É a produção de pasto, silagem ou feno para alimentar os animais.' }
};

export const ORDEM_PRIORIDADES: PrioridadeId[] = [
  'reducao_erosao', 'materia_organica', 'fixacao_nitrogenio', 'uso_agua', 'adequacao_mercado', 'valor_forragem'
];

export const ROTULO_PROBLEMA: Record<ProblemaId, string> = {
  solo_cansado: 'A cana está produzindo menos',
  nematoides_pragas: 'Tem praga ou nematoide',
  preco_baixo: 'O preço está ruim'
};

/** Nome curto para o que os mapas mostram, com uma frase de como a pessoa reconhece no chão. */
export const ROTULO_TEXTURA: Record<TexturaSolo, { nome: string; dica: string }> = {
  arenosa: { nome: 'Arenosa', dica: 'A terra solta, esfarela na mão e seca rápido.' },
  media: { nome: 'Mista', dica: 'A terra não é muito solta nem muito grudenta.' },
  argilosa: { nome: 'Argilosa', dica: 'A terra é vermelha ou roxa e gruda na bota quando molha.' }
};

export const ROTULO_RELEVO: Record<Relevo, { nome: string; dica: string }> = {
  plano: { nome: 'Plano', dica: 'A água da chuva quase não corre.' },
  suave_ondulado: { nome: 'Pouco inclinado', dica: 'O terreno tem caimento, mas a máquina trabalha bem.' },
  ondulado: { nome: 'Bem inclinado', dica: 'A enxurrada corre forte.' }
};

/** Uma pergunta por tela. `porque` aparece pequeno embaixo, para quem quiser saber. */
export const ROTULO_REQUISITO: Record<RequisitoId, { pergunta: string; porque: string; nome: string }> = {
  maquinas_graos: {
    pergunta: 'Você tem máquina para plantar e colher grão?',
    porque: 'Pode ser sua, alugada ou de um vizinho, já que amendoim e soja precisam disso.',
    nome: 'Máquina para grão'
  },
  comprador_graos: {
    pergunta: 'Tem para quem vender grão aqui perto?',
    porque: 'Vale uma cerealista, cooperativa ou indústria que compre a safra.',
    nome: 'Para quem vender'
  },
  irrigacao: {
    pergunta: 'Esse talhão tem irrigação ou recebe vinhaça?',
    porque: 'Com água garantida, dá para plantar mais cedo, sem esperar a chuva.',
    nome: 'Irrigação'
  }
};

export const ROTULO_RESPOSTA: Record<Resposta, string> = { sim: 'Sim', nao: 'Não', nao_sei: 'Não sei' };

export const ROTULO_NIVEL: Record<Nivel, string> = { nenhum: 'Nada', baixo: 'Pouco', medio: 'Médio', alto: 'Muito' };
/** Para riscos do talhão ("Risco de erosão: alto"). */
export const ROTULO_RISCO: Record<Nivel, string> = { nenhum: 'Quase nenhum', baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };

export const ROTULO_ATRIBUTO: Record<keyof AtributosEstrategia, { nome: string; maiorEhMelhor: boolean }> = {
  protecao_solo: { nome: 'Segura a terra na chuva', maiorEhMelhor: true },
  materia_organica: { nome: 'Deixa a terra mais rica', maiorEhMelhor: true },
  fixacao_nitrogenio: { nome: 'Economiza adubo', maiorEhMelhor: true },
  quebra_pragas: { nome: 'Ajuda contra praga', maiorEhMelhor: true },
  renda_direta: { nome: 'Dá dinheiro até o próximo plantio', maiorEhMelhor: true },
  demanda_agua: { nome: 'Gasta água', maiorEhMelhor: false },
  trabalho_custo: { nome: 'Dá trabalho e gasto', maiorEhMelhor: false },
  valor_forragem: { nome: 'Dá comida pro gado', maiorEhMelhor: true }
};

/** O que cada ponto quer dizer, em uma frase (legenda de "Todos os pontos"). */
export const DESCRICAO_ATRIBUTO: Record<keyof AtributosEstrategia, string> = {
  protecao_solo: 'É o quanto a planta ou a palha cobrem o chão e seguram a terra contra a enxurrada.',
  materia_organica: 'É o quanto de palha e raiz fica no solo e vira matéria orgânica, que guarda água e nutriente.',
  fixacao_nitrogenio: 'São plantas como crotalária e mucuna, que tiram nitrogênio do ar e deixam no solo, reduzindo o adubo da próxima lavoura.',
  quebra_pragas: 'É quando trocar de planta corta o ciclo de pragas e doenças que vivem na lavoura principal.',
  renda_direta: 'Diz se o intervalo dá alguma colheita para vender antes do próximo plantio.',
  demanda_agua: 'É quanta água a planta do intervalo precisa; aqui, menos é melhor.',
  trabalho_custo: 'É a semente, a máquina e a mão de obra que o caminho pede; aqui, menos é melhor.',
  valor_forragem: 'Diz se a planta do intervalo serve de alimento para o gado.'
};

export const ROTULO_CONFIANCA: Record<Confianca, string> = {
  alta: 'Bastante certeza',
  media: 'Alguma certeza',
  baixa: 'Pouca certeza'
};

export const ROTULO_COBERTURA: Record<CoberturaSolo, { nome: string; classe: string }> = {
  solo_descoberto: { nome: 'Terra descoberta', classe: 'cobertura-descoberto' },
  cultura_intermediaria: { nome: 'Lavoura do intervalo', classe: 'cobertura-intermediaria' },
  adubo_verde: { nome: 'Adubo verde', classe: 'cobertura-adubo' },
  palhada: { nome: 'Palha cobrindo o chão', classe: 'cobertura-palhada' },
  cultura_principal: { nome: 'Cultura principal', classe: 'cobertura-principal' }
};

export const ROTULO_TIPO_DADO: Record<TipoDado, string> = {
  observacao_historica: 'Histórico observado',
  previsao: 'Previsão',
  simulacao: 'Simulação'
};

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

const formatoNumero =new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
export const formatarNumero = (valor: number) => formatoNumero.format(valor);
export const anoDe = (data: string) => data.slice(0, 4);

/** Explicação da prioridade já com a cultura que a pessoa escolheu (ex.: "próxima safra de milho"). */
export function explicacaoPrioridade(id: PrioridadeId, nomeCultura: string | null): string {
  const safra = nomeCultura ? `próxima safra de ${nomeCultura.toLocaleLowerCase('pt-BR')}` : 'próxima safra';
  return ROTULO_PRIORIDADE[id].explicacao.replace('{safra}', safra);
}
