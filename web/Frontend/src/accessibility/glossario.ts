// Explicações curtas para termos técnicos (ajuda contextual "?").
// Textos centralizados aqui facilitam revisão e futura tradução.
export const GLOSSARIO = {
  reforma: {
    termo: 'Reforma do canavial',
    texto: 'Quando a soqueira já não produz bem, depois de uns 5 ou 6 cortes, arranca-se a cana velha e planta de novo. É nesse intervalo que dá para fazer rotação.'
  },
  ano_e_meio: {
    termo: 'Cana de ano e meio',
    texto: 'Cana plantada entre janeiro e março, que fica uns 18 meses no campo até o primeiro corte. É o plantio mais comum em São Paulo.'
  },
  adubo_verde: {
    termo: 'Adubo verde',
    texto: 'Planta cultivada para não ser colhida: ela cresce, cobre e protege o solo e depois é rolada ou incorporada, virando adubo para a próxima cultura.'
  },
  leguminosa: {
    termo: 'Leguminosa',
    texto: 'Família de plantas como soja, amendoim, feijão e crotalária. Nas raízes, bactérias tiram nitrogênio do ar e deixam parte dele no solo.'
  },
  palhada: {
    termo: 'Palhada',
    texto: 'Restos de planta deixados sobre o chão. Funciona como um cobertor: segura o impacto da chuva, guarda umidade e vira matéria orgânica.'
  },
  nematoide: {
    termo: 'Nematoide',
    texto: 'Verme microscópico que ataca a raiz e enfraquece a cana. Só se descobre qual tipo existe na área com análise de laboratório.'
  },
  aflatoxina: {
    termo: 'Aflatoxina',
    texto: 'Toxina produzida por fungo quando o amendoim pega umidade na colheita ou no armazenamento. Lote contaminado perde valor ou é recusado.'
  },
  umidade_solo: {
    termo: 'Umidade do solo',
    texto: 'Quanta água tem na terra na altura das raízes. Aqui aparece como um índice de 0 (seco) a 1 (encharcado), estimado a partir de satélite e modelos.'
  },
  satelite_estacao: {
    termo: 'Satélite × estação',
    texto: 'Uma estação no chão mede com precisão aquele ponto exato. O satélite cobre o país todo, todos os dias, mas cada valor é uma média de uma área grande, de vários quilômetros. Os dois se completam: o satélite mostra o padrão da região e a medição local confirma o que acontece no talhão.'
  },
  confianca: {
    termo: 'Nível de confiança',
    texto: 'Diz o quanto a ferramenta tem base para aquela conclusão. Confiança baixa não quer dizer que a ideia é ruim. Quer dizer que depende de coisas que só se sabe no local.'
  }
} as const;

export type TermoId = keyof typeof GLOSSARIO;
