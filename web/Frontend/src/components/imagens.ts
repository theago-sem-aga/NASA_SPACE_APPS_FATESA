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

/** Imagem ilustrativa de cada estratégia do mock (protótipo). */
export const IMAGEM_ESTRATEGIA: Record<string, ImagemCreditada> = {
  pousio: IMAGENS.soloDescoberto,
  amendoim: IMAGENS.orbita, // provisória: falta uma foto de amendoim com licença livre
  crotalaria: IMAGENS.crotalaria
};
