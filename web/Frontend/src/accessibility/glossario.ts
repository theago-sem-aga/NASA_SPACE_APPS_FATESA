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
  },
  // ---------- termos científicos que o desafio pede para explicar ----------
  evapotranspiracao: {
    termo: 'Evapotranspiração',
    texto: 'A água que sai da lavoura de volta para o ar: parte evapora do chão e parte as plantas soltam pelas folhas (transpiração). Medida em milímetros, como a chuva. Quando sai mais água do que chove, a terra vai secando.'
  },
  ndvi: {
    termo: 'NDVI (índice de vegetação)',
    texto: 'Número que o satélite da NASA usa para medir o quanto a planta está verde. De 0,6 para cima: planta cheia de folha e sadia. De 0,2 a 0,5: pouca planta, ou planta sofrendo. Abaixo de 0,2: terra sem planta. (Faixas do artigo da EOSDA sobre NDVI na agricultura.)'
  },
  anomalia_umidade: {
    termo: 'Anomalia de umidade do solo',
    texto: 'A diferença entre a umidade da terra agora e a que costuma ter na mesma época do ano. Negativa: está mais seco que o normal. Positiva: mais úmido. Mostra se o ano foge do comum, e não só se a terra está seca.'
  },
  balanco_hidrico: {
    termo: 'Balanço hídrico',
    texto: 'A conta da água da terra: o que entra (chuva e irrigação) menos o que sai (evapotranspiração e enxurrada). Saldo negativo por vários meses é sinal de falta de água para a planta.'
  },
  geada: {
    termo: 'Geada',
    texto: 'Gelo que se forma sobre as folhas em noites frias, de céu limpo e sem vento. A folha esfria mais que o ar: com o termômetro a uns 2 °C, a planta já pode gear. Por isso usamos 2 °C como sinal de risco.'
  },
  chuva_extrema: {
    termo: 'Chuva extrema',
    texto: 'Chuva de um dia bem acima do comum para aquele mês. Aqui, é a quantidade que só é passada em 1 de cada 20 dias de chuva do histórico. É a chuva que mais arrasta terra descoberta.'
  },
  estresse_termico: {
    termo: 'Estresse térmico',
    texto: 'Quando faz calor demais para a planta: ela fecha os poros para não perder água, cresce menos e, na floração, pode perder flores e grãos. O limite muda de cultura para cultura.'
  },
  grace: {
    termo: 'GRACE (água no subsolo)',
    texto: 'Par de satélites da NASA que mede pequenas mudanças na gravidade da Terra. Como água pesa, isso mostra quanto de água uma região ganhou ou perdeu, inclusive debaixo da terra. Cobre áreas grandes, de centenas de quilômetros, mês a mês.'
  },
  dado_em_grade: {
    termo: 'Dado em grade (NASA POWER)',
    texto: 'Estimativa para quadrados de cerca de 50 km de lado, feita juntando satélite e modelos do clima. Mostra bem o padrão da região, mas não substitui um pluviômetro ou estação na fazenda.'
  }
} as const;

export type TermoId = keyof typeof GLOSSARIO;
