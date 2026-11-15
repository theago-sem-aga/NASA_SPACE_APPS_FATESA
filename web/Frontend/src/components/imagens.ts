// Imagens reais com licença livre. Créditos completos em public/imagens/CREDITOS.md.
export interface ImagemCreditada {
  src: string;
  alt: string;
  credito: string;
  licenca: string;
  url_origem: string;
}

const base = `${import.meta.env.BASE_URL}imagens/`;

export const IMAGENS = {
  orbita: {
    src: `${base}orbita-lavouras-brasil.jpg`,
    alt: 'Foto tirada da Estação Espacial Internacional mostrando talhões agrícolas em volta de um reservatório no Brasil.',
    credito: 'NASA/ISS',
    licenca: 'CC BY 2.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Brazil_(14214279557).jpg'
  },
  palha: {
    src: `${base}palha-cana.jpg`,
    alt: 'Canavial depois da colheita mecanizada, com a palha da cana cobrindo o chão.',
    credito: 'Jonathan Wilkins',
    licenca: 'CC BY-SA 3.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Cane_field_after_harvestor.jpg'
  },
  crotalaria: {
    src: `${base}crotalaria.jpg`,
    alt: 'Plantação de crotalária com flores amarelas.',
    credito: 'lienyuan lee',
    licenca: 'CC BY 3.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:%E5%A4%AA%E9%99%BD%E9%BA%BB_Crotalaria_juncea_-_panoramio.jpg'
  },
  soloDescoberto: {
    src: `${base}solo-descoberto.jpg`,
    alt: 'Campo de terra sem nenhuma cobertura, com o vento levantando poeira do solo.',
    credito: 'Lynn Betts, USDA NRCS',
    licenca: 'Domínio público',
    url_origem: 'https://commons.wikimedia.org/wiki/File:NRCSIA99123_-_Iowa_(2947)(NRCS_Photo_Gallery).jpg'
  }
} satisfies Record<string, ImagemCreditada>;

export interface ImagemGaleria extends ImagemCreditada {
  /** Onde é e o que mostra: aparece no rodapé da foto. */
  legenda: string;
}

/** Fotos da tela inicial, que passam para o lado. A primeira é a que já existia. */
export const GALERIA_INICIO: ImagemGaleria[] = [
  { ...IMAGENS.orbita, legenda: 'Plantações no Brasil vistas da Estação Espacial Internacional.' },
  {
    src: `${base}lavouras-perdizes-iss.jpg`,
    alt: 'Vista do alto de lavouras perto de Perdizes, em Minas Gerais: círculos de pivô de irrigação e talhões em vários tons de verde e marrom.',
    legenda: 'Lavouras irrigadas por pivô perto de Perdizes (MG), vistas do espaço.',
    credito: 'NASA / Estação Espacial Internacional',
    licenca: 'Domínio público',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Agricultural_Fields_near_Perdizes,_Minas_Gerais,_Brazil.JPG'
  },
  {
    src: `${base}colheita-cana-piracicaba.jpg`,
    alt: 'Colhedora de cana carregando um caminhão ao lado do canavial, sobre o chão coberto de palha.',
    legenda: 'Colheita mecanizada de cana-de-açúcar em Piracicaba (SP).',
    credito: 'Mario Roberto Duran Ortiz',
    licenca: 'CC BY 3.0',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Sugarcane_harvest_Piracicaba_05_2009_5783.JPG'
  },
  {
    src: `${base}soja-brasnorte.jpg`,
    alt: 'Lavoura jovem, verde e plana até o horizonte, com céu nublado.',
    legenda: 'Lavoura de soja em Brasnorte, no noroeste de Mato Grosso.',
    credito: 'Marcelo Camargo / Agência Brasil',
    licenca: 'CC BY 3.0 BR',
    url_origem: 'https://commons.wikimedia.org/wiki/File:SojaBrasnorte.jpg'
  },
  {
    src: `${base}colheita-soja-rondonopolis.jpg`,
    alt: 'Colheitadeira amarela colhendo soja seca, com outra máquina ao fundo.',
    legenda: 'Colheita de soja em Rondonópolis (MT).',
    credito: 'Roosevelt Pinheiro / Agência Brasil',
    licenca: 'CC BY 3.0 BR',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Ronodon%C3%B3polis_colheita_soja_(Roosevelt_Pinheiro)_28mar09.jpg'
  },
  {
    src: `${base}pastagem-cerrado-embrapa.jpg`,
    alt: 'Pasto seco sobre terra vermelha, com mata ao fundo e céu limpo.',
    legenda: 'Pastagem na seca, em área de pesquisa da Embrapa Arroz e Feijão, no Cerrado.',
    credito: 'Alessandro Samuel-Rosa',
    licenca: 'CC0 (domínio público)',
    url_origem: 'https://commons.wikimedia.org/wiki/File:Pastagem_no_per%C3%ADodo_seco_no_Cerrado.jpg'
  }
];

/** Imagem ilustrativa de cada estratégia do mock (protótipo). */
export const IMAGEM_ESTRATEGIA: Record<string, ImagemCreditada> = {
  pousio: IMAGENS.soloDescoberto,
  amendoim: IMAGENS.orbita, // provisória: falta uma foto de amendoim com licença livre
  crotalaria: IMAGENS.crotalaria
};
