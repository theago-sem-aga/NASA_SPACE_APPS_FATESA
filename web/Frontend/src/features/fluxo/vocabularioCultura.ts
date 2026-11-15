/**
 * Como os textos falam de cada cultura. Todo texto que cita a cultura ou o período
 * entre um plantio e outro deve vir daqui, nunca escrito fixo na tela.
 *
 * Hoje só a cana está liberada. Quando o back liberar outra cultura (GET /culturas com
 * tem_demonstracao = true), os textos mudam sozinhos:
 *  - se a cultura estiver em VOCABULARIOS, usa as frases escritas à mão (melhor português);
 *  - se não estiver, monta frases genéricas com o nome que o back mandar
 *    ("a lavoura de feijão", "a próxima safra de feijão"). Nada quebra.
 * Para uma cultura nova soar natural, basta acrescentar uma entrada abaixo.
 */

export interface Vocabulario {
  /** 'a cana', 'o milho' (com artigo, minúsculo). */
  aCultura: string;
  /** Nome do período entre um plantio e outro: 'reforma' (cana, pasto) ou 'rotação'. */
  periodo: string;
  /** 'a reforma', 'a rotação'. */
  aPeriodo: string;
  /** Início de frase: 'Nesta reforma', 'Nesta rotação'. */
  nestePeriodo: string;
  /** O que vem depois do período: 'a cana nova', 'a próxima safra de milho'. */
  culturaNova: string;
  /** Opção da tela de problemas: 'A cana está produzindo menos'. */
  produzindoMenos: string;
  /** Onde achar o agrônomo. */
  ondeAgronomo: string;
  /** Subtítulo do cabeçalho. */
  planejamento: string;
}

const AGRONOMO_GERAL = 'Da cooperativa, da Casa da Agricultura ou da empresa que compra a sua produção.';

const VOCABULARIOS: Record<string, Vocabulario> = {
  cana_de_acucar: {
    aCultura: 'a cana',
    periodo: 'reforma',
    aPeriodo: 'a reforma',
    nestePeriodo: 'Nesta reforma',
    culturaNova: 'a cana nova',
    produzindoMenos: 'A cana está produzindo menos',
    ondeAgronomo: 'Da usina, da cooperativa ou da Casa da Agricultura.',
    planejamento: 'Planejamento da reforma'
  },
  soja: {
    aCultura: 'a soja',
    periodo: 'rotação',
    aPeriodo: 'a rotação',
    nestePeriodo: 'Nesta rotação',
    culturaNova: 'a próxima safra de soja',
    produzindoMenos: 'A soja está produzindo menos',
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: 'Planejamento da rotação'
  },
  milho: {
    aCultura: 'o milho',
    periodo: 'rotação',
    aPeriodo: 'a rotação',
    nestePeriodo: 'Nesta rotação',
    culturaNova: 'a próxima safra de milho',
    produzindoMenos: 'O milho está produzindo menos',
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: 'Planejamento da rotação'
  },
  trigo: {
    aCultura: 'o trigo',
    periodo: 'rotação',
    aPeriodo: 'a rotação',
    nestePeriodo: 'Nesta rotação',
    culturaNova: 'a próxima safra de trigo',
    produzindoMenos: 'O trigo está produzindo menos',
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: 'Planejamento da rotação'
  },
  pastagem: {
    aCultura: 'o pasto',
    periodo: 'reforma',
    aPeriodo: 'a reforma',
    nestePeriodo: 'Nesta reforma',
    culturaNova: 'o pasto novo',
    produzindoMenos: 'O pasto está produzindo menos',
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: 'Planejamento da reforma do pasto'
  }
};

/** Antes de a pessoa escolher a cultura (tela inicial, cabeçalho). */
const SEM_CULTURA: Vocabulario = {
  aCultura: 'a lavoura',
  periodo: 'rotação',
  aPeriodo: 'a rotação',
  nestePeriodo: 'Nesta rotação',
  culturaNova: 'o próximo plantio',
  produzindoMenos: 'A lavoura está produzindo menos',
  ondeAgronomo: AGRONOMO_GERAL,
  planejamento: 'Planejamento da lavoura'
};

/** Frases genéricas para uma cultura que o back liberou, mas que ainda não está em VOCABULARIOS. */
function generico(nome: string): Vocabulario {
  const n = nome.toLocaleLowerCase('pt-BR');
  return {
    ...SEM_CULTURA,
    aCultura: `a lavoura de ${n}`,
    culturaNova: `a próxima safra de ${n}`,
    produzindoMenos: `A lavoura de ${n} está produzindo menos`,
    planejamento: `Planejamento da rotação de ${n}`
  };
}

/** Vocabulário da cultura escolhida. Sem cultura, frases neutras. */
export function vocabulario(culturaId: string | null | undefined, nomeCultura?: string | null): Vocabulario {
  if (!culturaId) return SEM_CULTURA;
  return VOCABULARIOS[culturaId] ?? (nomeCultura ? generico(nomeCultura) : SEM_CULTURA);
}

/** Primeira letra maiúscula: 'a reforma' → 'A reforma'. */
export const maiuscula = (s: string) => s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1);
