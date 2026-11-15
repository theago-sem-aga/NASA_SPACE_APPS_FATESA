import { L, traduzivel } from '../i18n/idioma';
// Imagens reais com licença livre. Créditos completos em public/imagens/CREDITOS.md.
export interface ImagemCreditada {
  src: string;
  alt: string;
  credito: string;
  licenca: string;
  url_origem: string;
}

const base = `${import.meta.env.BASE_URL}imagens/`;

export const IMAGENS = traduzivel({
  orbita: {
    src: `${base}orbita-lavouras-brasil.jpg`,
    alt: L(
      'Foto tirada da Estação Espacial Internacional mostrando talhões agrícolas em volta de um reservatório no Brasil.',
      'Photo taken from the International Space Station showing farm fields around a reservoir in Brazil.'
    ),
    credito: 'NASA/ISS',
    licenca: 'CC BY 2.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Brazil_(14214279557).jpg'
  },
  palha: {
    src: `${base}palha-cana.jpg`,
    alt: L('Canavial depois da colheita mecanizada, com a palha da cana cobrindo o chão.', 'Sugarcane field after mechanical harvest, with cane straw covering the ground.'),
    credito: 'Jonathan Wilkins',
    licenca: 'CC BY-SA 3.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Cane_field_after_harvestor.jpg'
  },
  crotalaria: {
    src: `${base}crotalaria.jpg`,
    alt: L('Plantação de crotalária com flores amarelas.', 'Sunn hemp field with yellow flowers.'),
    credito: 'lienyuan lee',
    licenca: 'CC BY 3.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:%E5%A4%AA%E9%99%BD%E9%BA%BB_Crotalaria_juncea_-_panoramio.jpg'
  },
  soloDescoberto: {
    src: `${base}solo-descoberto.jpg`,
    alt: L('Campo de terra sem nenhuma cobertura, com o vento levantando poeira do solo.', 'A bare field with no cover, with wind lifting dust from the soil.'),
    credito: 'Lynn Betts, USDA NRCS',
    licenca: L('Domínio público', 'Public domain'),
    url_origem: 'https://commons.wikimedia.org/wiki/File:NRCSIA99123_-_Iowa_(2947)(NRCS_Photo_Gallery).jpg'
  }
} satisfies Record<string, ImagemCreditada>);

export interface ImagemGaleria extends ImagemCreditada {
  /** Onde é e o que mostra: aparece no rodapé da foto. */
  legenda: string;
}

/** Fotos da tela inicial, que passam para o lado. A primeira é a que já existia. */
export const GALERIA_INICIO: ImagemGaleria[] = traduzivel([
  {
    src: `${base}orbita-lavouras-brasil.jpg`,
    alt: L(
      'Foto tirada da Estação Espacial Internacional mostrando talhões agrícolas em volta de um reservatório no Brasil.',
      'Photo taken from the International Space Station showing farm fields around a reservoir in Brazil.'
    ),
    legenda: L('Plantações no Brasil vistas da Estação Espacial Internacional.', 'Farm fields in Brazil seen from the International Space Station.'),
    credito: 'NASA/ISS',
    licenca: 'CC BY 2.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Brazil_(14214279557).jpg'
  },
  {
    src: `${base}lavouras-perdizes-iss.jpg`,
    alt: L(
      'Vista do alto de lavouras perto de Perdizes, em Minas Gerais: círculos de pivô de irrigação e talhões em vários tons de verde e marrom.',
      'Aerial view of farms near Perdizes, Minas Gerais: center-pivot irrigation circles and fields in shades of green and brown.'
    ),
    legenda: L('Lavouras irrigadas por pivô perto de Perdizes (MG), vistas do espaço.', 'Center-pivot irrigated farms near Perdizes (Minas Gerais, Brazil), seen from space.'),
    credito: L('NASA / Estação Espacial Internacional', 'NASA / International Space Station'),
    licenca: L('Domínio público', 'Public domain'),
    url_origem: 'https://commons.wikimedia.org/wiki/File:Agricultural_Fields_near_Perdizes,_Minas_Gerais,_Brazil.JPG'
  },
  {
    src: `${base}colheita-cana-piracicaba.jpg`,
    alt: L('Colhedora de cana carregando um caminhão ao lado do canavial, sobre o chão coberto de palha.', 'A cane harvester loading a truck next to the field, on ground covered with straw.'),
    legenda: L('Colheita mecanizada de cana-de-açúcar em Piracicaba (SP).', 'Mechanical sugarcane harvest in Piracicaba (São Paulo, Brazil).'),
    credito: 'Mario Roberto Duran Ortiz',
    licenca: 'CC BY 3.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Sugarcane_harvest_Piracicaba_05_2009_5783.JPG'
  },
  {
    src: `${base}soja-brasnorte.jpg`,
    alt: L('Lavoura jovem, verde e plana até o horizonte, com céu nublado.', 'A young, green, flat crop stretching to the horizon under a cloudy sky.'),
    legenda: L('Lavoura de soja em Brasnorte, no noroeste de Mato Grosso.', 'Soybean field in Brasnorte, northwestern Mato Grosso, Brazil.'),
    credito: 'Marcelo Camargo / Agência Brasil',
    licenca: 'CC BY 3.0 BR',
    url_origem: 'https://commons.wikimedia.org/wiki/File:SojaBrasnorte.jpg'
  },
  {
    src: `${base}colheita-soja-rondonopolis.jpg`,
    alt: L('Colheitadeira amarela colhendo soja seca, com outra máquina ao fundo.', 'A yellow combine harvesting dry soybeans, with another machine behind.'),
    legenda: L('Colheita de soja em Rondonópolis (MT).', 'Soybean harvest in Rondonópolis (Mato Grosso, Brazil).'),
    credito: 'Roosevelt Pinheiro / Agência Brasil',
    licenca: 'CC BY 3.0 BR',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Ronodon%C3%B3polis_colheita_soja_(Roosevelt_Pinheiro)_28mar09.jpg'
  },
  {
    src: `${base}pastagem-cerrado-embrapa.jpg`,
    alt: L('Pasto seco sobre terra vermelha, com mata ao fundo e céu limpo.', 'Dry pasture on red soil, with woodland behind and a clear sky.'),
    legenda: L('Pastagem na seca, em área de pesquisa da Embrapa Arroz e Feijão, no Cerrado.', 'Pasture in the dry season at an Embrapa Rice and Beans research area in the Cerrado, Brazil.'),
    credito: 'Alessandro Samuel-Rosa',
    licenca: L('CC0 (domínio público)', 'CC0 (public domain)'),
    url_origem: 'https://commons.wikimedia.org/wiki/File:Pastagem_no_per%C3%ADodo_seco_no_Cerrado.jpg'
  }
]);

/** Imagem ilustrativa de cada estratégia do mock (protótipo). */
export const IMAGEM_ESTRATEGIA: Record<string, ImagemCreditada> = {
  pousio: IMAGENS.soloDescoberto,
  amendoim: IMAGENS.orbita, // provisória: falta uma foto de amendoim com licença livre
  crotalaria: IMAGENS.crotalaria
};
