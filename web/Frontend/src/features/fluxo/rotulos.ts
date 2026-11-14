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

export const ROTULO_PRIORIDADE: Record<PrioridadeId, { nome: string; explicacao: string }> = {
  reducao_erosao: { nome: 'Segurar o solo', explicacao: 'Não deixar a chuva levar a terra boa nem abrir valeta.' },
  materia_organica: { nome: 'Deixar a terra mais forte', explicacao: 'Mais palha e raiz no solo para os próximos cortes.' },
  fixacao_nitrogenio: { nome: 'Gastar menos adubo', explicacao: 'Plantas que deixam nitrogênio na terra para a cana.' },
  uso_agua: { nome: 'Aguentar a seca', explicacao: 'Algo que precise de pouca água ou ajude a terra a segurar umidade.' },
  adequacao_mercado: { nome: 'Ter renda na reforma', explicacao: 'Uma lavoura que tenha comprador aqui na região.' },
  valor_forragem: { nome: 'Tratar o gado', explicacao: 'Produzir pasto, silagem ou feno para os animais.' }
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
  arenosa: { nome: 'Arenosa', dica: 'Solta, esfarela na mão e seca rápido.' },
  media: { nome: 'Mista', dica: 'Nem muito solta nem muito grudenta.' },
  argilosa: { nome: 'Argilosa', dica: 'Vermelha ou roxa, gruda na bota quando molha.' }
};

export const ROTULO_RELEVO: Record<Relevo, { nome: string; dica: string }> = {
  plano: { nome: 'Plano', dica: 'A água da chuva quase não corre.' },
  suave_ondulado: { nome: 'Pouco inclinado', dica: 'Tem caimento, mas a máquina trabalha bem.' },
  ondulado: { nome: 'Bem inclinado', dica: 'A enxurrada corre forte.' }
};

/** Uma pergunta por tela. `porque` aparece pequeno embaixo, para quem quiser saber. */
export const ROTULO_REQUISITO: Record<RequisitoId, { pergunta: string; porque: string; nome: string }> = {
  maquinas_graos: {
    pergunta: 'Você tem máquina para plantar e colher grão?',
    porque: 'Pode ser sua, alugada ou de um vizinho. Amendoim e soja precisam disso.',
    nome: 'Máquina para grão'
  },
  comprador_graos: {
    pergunta: 'Tem para quem vender grão aqui perto?',
    porque: 'Uma cerealista, cooperativa ou indústria que compre a safra.',
    nome: 'Para quem vender'
  },
  irrigacao: {
    pergunta: 'Esse talhão tem irrigação ou recebe vinhaça?',
    porque: 'Com água garantida, dá para plantar mais cedo sem esperar a chuva.',
    nome: 'Irrigação'
  }
};

export const ROTULO_RESPOSTA: Record<Resposta, string> = { sim: 'Sim', nao: 'Não', nao_sei: 'Não sei' };

export const ROTULO_NIVEL: Record<Nivel, string> = { nenhum: 'Nada', baixo: 'Pouco', medio: 'Médio', alto: 'Muito' };
/** Para riscos do talhão ("Risco de erosão: alto"). */
export const ROTULO_RISCO: Record<Nivel, string> = { nenhum: 'Quase nenhum', baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };

export const ROTULO_ATRIBUTO: Record<keyof AtributosEstrategia, { nome: string; maiorEhMelhor: boolean }> = {
  protecao_solo: { nome: 'Segura a terra na chuva', maiorEhMelhor: true },
  materia_organica: { nome: 'Deixa a terra mais forte', maiorEhMelhor: true },
  fixacao_nitrogenio: { nome: 'Economiza adubo', maiorEhMelhor: true },
  quebra_pragas: { nome: 'Ajuda contra praga', maiorEhMelhor: true },
  renda_direta: { nome: 'Dá dinheiro na reforma', maiorEhMelhor: true },
  demanda_agua: { nome: 'Gasta água', maiorEhMelhor: false },
  trabalho_custo: { nome: 'Dá trabalho e gasto', maiorEhMelhor: false }
};

export const ROTULO_CONFIANCA: Record<Confianca, string> = {
  alta: 'Bastante certeza',
  media: 'Alguma certeza',
  baixa: 'Pouca certeza'
};

export const ROTULO_COBERTURA: Record<CoberturaSolo, { nome: string; classe: string }> = {
  solo_descoberto: { nome: 'Terra descoberta', classe: 'cobertura-descoberto' },
  cultura_intermediaria: { nome: 'Lavoura da reforma', classe: 'cobertura-intermediaria' },
  adubo_verde: { nome: 'Adubo verde', classe: 'cobertura-adubo' },
  palhada: { nome: 'Palha cobrindo o chão', classe: 'cobertura-palhada' },
  cultura_principal: { nome: 'Cana', classe: 'cobertura-principal' }
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
  trabalho_custo: 'trabalho'
};
/** Textura e relevo usam o próprio id como nome do pictograma. */
export const PICTO_TEXTURA: Record<TexturaSolo, NomePictograma> = { arenosa: 'arenosa', media: 'media', argilosa: 'argilosa' };
export const PICTO_RELEVO: Record<Relevo, NomePictograma> = { plano: 'plano', suave_ondulado: 'suave_ondulado', ondulado: 'ondulado' };

const formatoNumero =new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
export const formatarNumero = (valor: number) => formatoNumero.format(valor);
export const anoDe = (data: string) => data.slice(0, 4);
