// Explicações curtas para termos técnicos (ajuda contextual "?").
// Textos centralizados aqui facilitam revisão e futura tradução.
export const GLOSSARIO = {
  reforma: {
    termo: 'Reforma do canavial',
    texto: 'Quando a soqueira já não produz bem, depois de uns 5 ou 6 cortes, arranca-se a cana velha e planta-se de novo, e é nesse intervalo que dá para fazer a rotação.'
  },
  ano_e_meio: {
    termo: 'Cana de ano e meio',
    texto: 'É a cana plantada entre janeiro e março, que fica uns 18 meses no campo até o primeiro corte; é o plantio mais comum em São Paulo.'
  },
  adubo_verde: {
    termo: 'Adubo verde',
    texto: 'É a planta cultivada para não ser colhida: ela cresce, cobre e protege o solo, e depois é rolada ou incorporada, virando adubo para a próxima cultura.'
  },
  leguminosa: {
    termo: 'Leguminosa',
    texto: 'É a família de plantas como soja, amendoim, feijão e crotalária, cujas raízes abrigam bactérias que tiram nitrogênio do ar e deixam parte dele no solo.'
  },
  palhada: {
    termo: 'Palhada',
    texto: 'São os restos de planta deixados sobre o chão, que funcionam como um cobertor: seguram o impacto da chuva, guardam umidade e viram matéria orgânica.'
  },
  nematoide: {
    termo: 'Nematoide',
    texto: 'É o verme microscópico que ataca a raiz e enfraquece a cana; só se descobre qual tipo existe na área com análise de laboratório.'
  },
  aflatoxina: {
    termo: 'Aflatoxina',
    texto: 'É a toxina produzida por fungo quando o amendoim pega umidade na colheita ou no armazenamento, e o lote contaminado perde valor ou é recusado.'
  },
  umidade_solo: {
    termo: 'Umidade do solo',
    texto: 'É quanta água tem na terra na altura das raízes; aqui aparece como um índice de 0 (seco) a 1 (encharcado), estimado a partir de satélite e modelos.'
  },
  satelite_estacao: {
    termo: 'Satélite × estação',
    texto: 'Uma estação no chão mede com precisão aquele ponto exato, enquanto o satélite cobre o país todo, todos os dias, mas cada valor é uma média de uma área de vários quilômetros. Por isso os dois se completam: o satélite mostra o padrão da região, e a medição local confirma o que acontece no talhão.'
  },
  confianca: {
    termo: 'Nível de confiança',
    texto: 'Diz o quanto a ferramenta tem de base para chegar naquela conclusão. Confiança baixa não quer dizer que a ideia é ruim, mas sim que depende de coisas que só se sabem no local.'
  }
} as const;

export type TermoId = keyof typeof GLOSSARIO;
