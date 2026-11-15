import { L, traduzivel } from '../i18n/idioma';

// Explicações curtas para termos técnicos (ajuda contextual "?").
// Textos centralizados aqui, em português e inglês (i18n/idioma.ts).
export const GLOSSARIO = traduzivel({
  reforma: {
    termo: L('Reforma do canavial', 'Sugarcane field renewal'),
    texto: L(
      'Quando a soqueira já não produz bem, depois de uns 5 ou 6 cortes, arranca-se a cana velha e planta de novo. É nesse intervalo que dá para fazer rotação.',
      'When the ratoon no longer yields well, after about 5 or 6 harvests, the old cane is removed and replanted. That gap is when a rotation can be done.'
    )
  },
  ano_e_meio: {
    termo: L('Cana de ano e meio', '18-month cane'),
    texto: L(
      'Cana plantada entre janeiro e março, que fica uns 18 meses no campo até o primeiro corte. É o plantio mais comum em São Paulo.',
      'Cane planted between January and March that stays about 18 months in the field until the first harvest. It is the most common planting in São Paulo state.'
    )
  },
  adubo_verde: {
    termo: L('Adubo verde', 'Green manure'),
    texto: L(
      'Planta cultivada para não ser colhida: ela cresce, cobre e protege o solo e depois é rolada ou incorporada, virando adubo para a próxima cultura.',
      'A plant grown not to be harvested: it grows, covers and protects the soil, and is then rolled or worked in, becoming fertilizer for the next crop.'
    )
  },
  leguminosa: {
    termo: L('Leguminosa', 'Legume'),
    texto: L(
      'Família de plantas como soja, amendoim, feijão e crotalária. Nas raízes, bactérias tiram nitrogênio do ar e deixam parte dele no solo.',
      'A plant family that includes soybeans, peanuts, beans and sunn hemp. Bacteria in the roots take nitrogen from the air and leave part of it in the soil.'
    )
  },
  palhada: {
    termo: L('Palhada', 'Straw mulch'),
    texto: L(
      'Restos de planta deixados sobre o chão. Funciona como um cobertor: segura o impacto da chuva, guarda umidade e vira matéria orgânica.',
      'Plant residue left on the ground. It works like a blanket: it absorbs the impact of rain, holds moisture and turns into organic matter.'
    )
  },
  nematoide: {
    termo: L('Nematoide', 'Nematode'),
    texto: L(
      'Verme microscópico que ataca a raiz e enfraquece a cana. Só se descobre qual tipo existe na área com análise de laboratório.',
      'A microscopic worm that attacks roots and weakens the cane. Only a lab test shows which type is in the field.'
    )
  },
  aflatoxina: {
    termo: L('Aflatoxina', 'Aflatoxin'),
    texto: L(
      'Toxina produzida por fungo quando o amendoim pega umidade na colheita ou no armazenamento. Lote contaminado perde valor ou é recusado.',
      'A toxin made by a fungus when peanuts get damp at harvest or in storage. A contaminated lot loses value or is rejected.'
    )
  },
  umidade_solo: {
    termo: L('Umidade do solo', 'Soil moisture'),
    texto: L(
      'Quanta água tem na terra na altura das raízes. Aqui aparece como um índice de 0 (seco) a 1 (encharcado), estimado a partir de satélite e modelos.',
      'How much water is in the soil at root depth. Here it is shown as an index from 0 (dry) to 1 (soaked), estimated from satellites and models.'
    )
  },
  satelite_estacao: {
    termo: L('Satélite × estação', 'Satellite × station'),
    texto: L(
      'Uma estação no chão mede com precisão aquele ponto exato. O satélite cobre o país todo, todos os dias, mas cada valor é uma média de uma área grande, de vários quilômetros. Os dois se completam: o satélite mostra o padrão da região e a medição local confirma o que acontece no talhão.',
      'A ground station measures that exact spot precisely. The satellite covers the whole country every day, but each value is an average over a large area several kilometers wide. The two complement each other: the satellite shows the regional pattern and the local measurement confirms what happens in the field.'
    )
  },
  confianca: {
    termo: L('Nível de confiança', 'Confidence level'),
    texto: L(
      'Diz o quanto a ferramenta tem base para aquela conclusão. Confiança baixa não quer dizer que a ideia é ruim. Quer dizer que depende de coisas que só se sabe no local.',
      'It says how much basis the tool has for that conclusion. Low confidence does not mean the idea is bad. It means it depends on things that can only be known on site.'
    )
  },
  // ---------- termos científicos que o desafio pede para explicar ----------
  evapotranspiracao: {
    termo: L('Evapotranspiração', 'Evapotranspiration'),
    texto: L(
      'A água que sai da lavoura de volta para o ar: parte evapora do chão e parte as plantas soltam pelas folhas (transpiração). Medida em milímetros, como a chuva. Quando sai mais água do que chove, a terra vai secando.',
      'The water that leaves the field back into the air: part evaporates from the ground and part is released by the plants through their leaves (transpiration). Measured in millimeters, like rain. When more water leaves than falls as rain, the soil dries out.'
    )
  },
  ndvi: {
    termo: L('NDVI (índice de vegetação)', 'NDVI (vegetation index)'),
    texto: L(
      'Número que o satélite da NASA usa para medir o quanto a planta está verde. De 0,6 para cima: planta cheia de folha e sadia. De 0,2 a 0,5: pouca planta, ou planta sofrendo. Abaixo de 0,2: terra sem planta. (Faixas do artigo da EOSDA sobre NDVI na agricultura.)',
      'A number NASA’s satellite uses to measure how green the plants are. 0.6 and up: leafy, healthy plants. 0.2 to 0.5: few plants, or plants under stress. Below 0.2: ground with no plants. (Bands from the EOSDA article on NDVI in agriculture.)'
    )
  },
  anomalia_umidade: {
    termo: L('Anomalia de umidade do solo', 'Soil moisture anomaly'),
    texto: L(
      'A diferença entre a umidade da terra agora e a que costuma ter na mesma época do ano. Negativa: está mais seco que o normal. Positiva: mais úmido. Mostra se o ano foge do comum, e não só se a terra está seca.',
      'The difference between soil moisture now and what it usually is at the same time of year. Negative: drier than normal. Positive: wetter. It shows whether the year is out of the ordinary, not just whether the soil is dry.'
    )
  },
  balanco_hidrico: {
    termo: L('Balanço hídrico', 'Water balance'),
    texto: L(
      'A conta da água da terra: o que entra (chuva e irrigação) menos o que sai (evapotranspiração e enxurrada). Saldo negativo por vários meses é sinal de falta de água para a planta.',
      'The soil’s water budget: what comes in (rain and irrigation) minus what goes out (evapotranspiration and runoff). A negative balance for several months signals a water shortage for the plants.'
    )
  },
  geada: {
    termo: L('Geada', 'Frost'),
    texto: L(
      'Gelo que se forma sobre as folhas em noites frias, de céu limpo e sem vento. A folha esfria mais que o ar: com o termômetro a uns 2 °C, a planta já pode gear. Por isso usamos 2 °C como sinal de risco.',
      'Ice that forms on leaves on cold, clear, windless nights. Leaves get colder than the air: with the thermometer at about 35.6 °F, the plant can already get frost. That is why we use 35.6 °F as the risk signal.'
    )
  },
  chuva_extrema: {
    termo: L('Chuva extrema', 'Extreme rain'),
    texto: L(
      'Chuva de um dia bem acima do comum para aquele mês. Aqui, é a quantidade que só é passada em 1 de cada 20 dias de chuva do histórico. É a chuva que mais arrasta terra descoberta.',
      'A day of rain well above normal for that month. Here, it is the amount exceeded on only 1 in every 20 rainy days in the record. It is the rain that washes away the most bare soil.'
    )
  },
  estresse_termico: {
    termo: L('Estresse térmico', 'Heat stress'),
    texto: L(
      'Quando faz calor demais para a planta: ela fecha os poros para não perder água, cresce menos e, na floração, pode perder flores e grãos. O limite muda de cultura para cultura.',
      'When it is too hot for the plant: it closes its pores to save water, grows less and, at flowering, can lose flowers and grain. The limit varies from crop to crop.'
    )
  },
  grace: {
    termo: L('GRACE (água no subsolo)', 'GRACE (underground water)'),
    texto: L(
      'Par de satélites da NASA que mede pequenas mudanças na gravidade da Terra. Como água pesa, isso mostra quanto de água uma região ganhou ou perdeu, inclusive debaixo da terra. Cobre áreas grandes, de centenas de quilômetros, mês a mês.',
      'A pair of NASA satellites that measure small changes in Earth’s gravity. Because water is heavy, this shows how much water a region gained or lost, including underground. It covers large areas, hundreds of kilometers wide, month by month.'
    )
  },
  dado_em_grade: {
    termo: L('Dado em grade (NASA POWER)', 'Gridded data (NASA POWER)'),
    texto: L(
      'Estimativa para quadrados de cerca de 50 km de lado, feita juntando satélite e modelos do clima. Mostra bem o padrão da região, mas não substitui um pluviômetro ou estação na fazenda.',
      'An estimate for squares about 50 km on each side, combining satellites and climate models. It shows the regional pattern well, but does not replace a rain gauge or weather station on the farm.'
    )
  }
});

export type TermoId = keyof typeof GLOSSARIO;
