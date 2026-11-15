import { L, traduzivel, tx } from '../../i18n/idioma';

/**
 * Como os textos falam de cada cultura. Todo texto que cita a cultura ou o período
 * entre um plantio e outro deve vir daqui, nunca escrito fixo na tela.
 *
 * Hoje só a cana está liberada. Quando o back liberar outra cultura (GET /culturas com
 * tem_demonstracao = true), os textos mudam sozinhos:
 *  - se a cultura estiver em VOCABULARIOS, usa as frases escritas à mão (melhor texto);
 *  - se não estiver, monta frases genéricas com o nome que o back mandar
 *    ("a lavoura de feijão", "a próxima safra de feijão"). Nada quebra.
 * Para uma cultura nova soar natural, basta acrescentar uma entrada abaixo.
 * Cada texto existe em português e inglês (i18n/idioma.ts).
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

const AGRONOMO_GERAL = L(
  'Da cooperativa, da Casa da Agricultura ou da empresa que compra a sua produção.',
  'From the co-op, the local extension office or the company that buys your crop.'
);

const VOCABULARIOS: Record<string, Vocabulario> = traduzivel({
  cana_de_acucar: {
    aCultura: L('a cana', 'the sugarcane'),
    periodo: L('reforma', 'renewal'),
    aPeriodo: L('a reforma', 'the renewal'),
    nestePeriodo: L('Nesta reforma', 'In this renewal'),
    culturaNova: L('a cana nova', 'the new cane'),
    produzindoMenos: L('A cana está produzindo menos', 'The cane is yielding less'),
    ondeAgronomo: L('Da usina, da cooperativa ou da Casa da Agricultura.', 'From the mill, the co-op or the local extension office.'),
    planejamento: L('Planejamento da reforma', 'Field renewal planning')
  },
  soja: {
    aCultura: L('a soja', 'the soybeans'),
    periodo: L('rotação', 'rotation'),
    aPeriodo: L('a rotação', 'the rotation'),
    nestePeriodo: L('Nesta rotação', 'In this rotation'),
    culturaNova: L('a próxima safra de soja', 'the next soybean crop'),
    produzindoMenos: L('A soja está produzindo menos', 'The soybeans are yielding less'),
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: L('Planejamento da rotação', 'Rotation planning')
  },
  milho: {
    aCultura: L('o milho', 'the corn'),
    periodo: L('rotação', 'rotation'),
    aPeriodo: L('a rotação', 'the rotation'),
    nestePeriodo: L('Nesta rotação', 'In this rotation'),
    culturaNova: L('a próxima safra de milho', 'the next corn crop'),
    produzindoMenos: L('O milho está produzindo menos', 'The corn is yielding less'),
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: L('Planejamento da rotação', 'Rotation planning')
  },
  trigo: {
    aCultura: L('o trigo', 'the wheat'),
    periodo: L('rotação', 'rotation'),
    aPeriodo: L('a rotação', 'the rotation'),
    nestePeriodo: L('Nesta rotação', 'In this rotation'),
    culturaNova: L('a próxima safra de trigo', 'the next wheat crop'),
    produzindoMenos: L('O trigo está produzindo menos', 'The wheat is yielding less'),
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: L('Planejamento da rotação', 'Rotation planning')
  },
  pastagem: {
    aCultura: L('o pasto', 'the pasture'),
    periodo: L('reforma', 'renewal'),
    aPeriodo: L('a reforma', 'the renewal'),
    nestePeriodo: L('Nesta reforma', 'In this renewal'),
    culturaNova: L('o pasto novo', 'the new pasture'),
    produzindoMenos: L('O pasto está produzindo menos', 'The pasture is yielding less'),
    ondeAgronomo: AGRONOMO_GERAL,
    planejamento: L('Planejamento da reforma do pasto', 'Pasture renewal planning')
  }
});

/** Antes de a pessoa escolher a cultura (tela inicial, cabeçalho). */
const SEM_CULTURA: Vocabulario = traduzivel({
  aCultura: L('a lavoura', 'the crop'),
  periodo: L('rotação', 'rotation'),
  aPeriodo: L('a rotação', 'the rotation'),
  nestePeriodo: L('Nesta rotação', 'In this rotation'),
  culturaNova: L('o próximo plantio', 'the next planting'),
  produzindoMenos: L('A lavoura está produzindo menos', 'The crop is yielding less'),
  ondeAgronomo: AGRONOMO_GERAL,
  planejamento: L('Planejamento da lavoura', 'Crop planning')
});

/** Frases genéricas para uma cultura que o back liberou, mas que ainda não está em VOCABULARIOS. */
function generico(nome: string): Vocabulario {
  const n = nome.toLocaleLowerCase(tx('pt-BR', 'en-US'));
  return {
    aCultura: tx(`a lavoura de ${n}`, `the ${n} crop`),
    periodo: SEM_CULTURA.periodo,
    aPeriodo: SEM_CULTURA.aPeriodo,
    nestePeriodo: SEM_CULTURA.nestePeriodo,
    culturaNova: tx(`a próxima safra de ${n}`, `the next ${n} crop`),
    produzindoMenos: tx(`A lavoura de ${n} está produzindo menos`, `The ${n} crop is yielding less`),
    ondeAgronomo: SEM_CULTURA.ondeAgronomo,
    planejamento: tx(`Planejamento da rotação de ${n}`, `${nome} rotation planning`)
  };
}

/** Vocabulário da cultura escolhida. Sem cultura, frases neutras. */
export function vocabulario(culturaId: string | null | undefined, nomeCultura?: string | null): Vocabulario {
  if (!culturaId) return SEM_CULTURA;
  return VOCABULARIOS[culturaId] ?? (nomeCultura ? generico(nomeCultura) : SEM_CULTURA);
}

/** Primeira letra maiúscula: 'a reforma' → 'A reforma'. */
export const maiuscula = (s: string) => s.charAt(0).toLocaleUpperCase(tx('pt-BR', 'en-US')) + s.slice(1);
