// DADOS FICTÍCIOS (mock) — mesmo formato do contrato proposto em ../tipos.ts.
// Nenhum número aqui é observação real. Os textos tentam soar como uma conversa
// com o técnico de campo e citam práticas reais da reforma de canavial em SP,
// mas TODOS precisam ser conferidos nas referências antes de ir para o produto.
// As referências listadas NÃO foram verificadas: são indicações de onde buscar.
import type {
  Analise, CaracteristicasTalhao, CoberturaSolo, CorrecoesTalhao, Cultura, Local, MesCalendario
} from '../tipos';

export const CULTURAS_MOCK: Cultura[] = [
  { cultura_id: 'cana_de_acucar', nome: 'Cana-de-açúcar', tem_demonstracao: true },
  { cultura_id: 'soja', nome: 'Soja', tem_demonstracao: false },
  { cultura_id: 'milho', nome: 'Milho', tem_demonstracao: false },
  { cultura_id: 'trigo', nome: 'Trigo', tem_demonstracao: false },
  { cultura_id: 'pastagem', nome: 'Pasto', tem_demonstracao: false }
];

// Municípios para a busca e para o "Você está perto de…" no mock. Coordenadas
// aproximadas do centro e códigos IBGE só ilustrativos: o back usa a malha oficial.
export const MUNICIPIOS_MOCK: Local[] = [
  { codigo_ibge: '3549805', municipio: 'São José do Rio Preto', uf: 'SP', latitude: -20.82, longitude: -49.38 },
  { codigo_ibge: '3533908', municipio: 'Olímpia', uf: 'SP', latitude: -20.74, longitude: -48.91 },
  { codigo_ibge: '3530300', municipio: 'Mirassol', uf: 'SP', latitude: -20.82, longitude: -49.52 },
  { codigo_ibge: '3511102', municipio: 'Catanduva', uf: 'SP', latitude: -21.14, longitude: -48.97 },
  { codigo_ibge: '3505500', municipio: 'Barretos', uf: 'SP', latitude: -20.56, longitude: -48.57 },
  { codigo_ibge: '3506102', municipio: 'Bebedouro', uf: 'SP', latitude: -20.95, longitude: -48.48 },
  { codigo_ibge: '3517406', municipio: 'Guaíra', uf: 'SP', latitude: -20.32, longitude: -48.31 },
  { codigo_ibge: '3524303', municipio: 'Jaboticabal', uf: 'SP', latitude: -21.25, longitude: -48.32 },
  { codigo_ibge: '3551702', municipio: 'Sertãozinho', uf: 'SP', latitude: -21.14, longitude: -47.99 },
  { codigo_ibge: '3543402', municipio: 'Ribeirão Preto', uf: 'SP', latitude: -21.18, longitude: -47.81 },
  { codigo_ibge: '3503208', municipio: 'Araraquara', uf: 'SP', latitude: -21.79, longitude: -48.18 },
  { codigo_ibge: '3502804', municipio: 'Araçatuba', uf: 'SP', latitude: -21.21, longitude: -50.43 },
  { codigo_ibge: '3527108', municipio: 'Lins', uf: 'SP', latitude: -21.67, longitude: -49.74 },
  { codigo_ibge: '3541406', municipio: 'Presidente Prudente', uf: 'SP', latitude: -22.13, longitude: -51.39 },
  { codigo_ibge: '3538709', municipio: 'Piracicaba', uf: 'SP', latitude: -22.73, longitude: -47.65 },
  { codigo_ibge: '3509502', municipio: 'Campinas', uf: 'SP', latitude: -22.91, longitude: -47.06 }
];

/** O que "os mapas" dizem do talhão no mock, já aplicando a correção do produtor. */
export function montarTalhaoMock(correcoes: CorrecoesTalhao): CaracteristicasTalhao {
  return {
    textura_solo: correcoes.textura_solo ?? 'arenosa',
    fonte_textura: correcoes.textura_solo ? 'informado_produtor' : 'mapas',
    relevo: correcoes.relevo ?? 'suave_ondulado',
    fonte_relevo: correcoes.relevo ? 'informado_produtor' : 'mapas',
    declividade_pct: correcoes.relevo ? null : 5,
    risco_erosao: 'alto',
    risco_seca: 'medio',
    bases: ['SRTM', 'SoilGrids', 'NASA POWER']
  };
}

// Reforma começando depois do último corte, em outubro; cana de ano e meio plantada em março.
const ORDEM_MESES = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function calendario(trechos: [CoberturaSolo, number][]): MesCalendario[] {
  const coberturas = trechos.flatMap(([cobertura, n]) => Array<CoberturaSolo>(n).fill(cobertura));
  return ORDEM_MESES.map((mes, i) => ({ mes, cobertura: coberturas[i] }));
}

export const ANALISE_MOCK: Omit<Analise, 'descricao_local' | 'talhao'> = {
  analise_id: 'mock-0001',
  eh_mock: true,
  fonte_clima: {
    fonte_id: 'nasa_power',
    nome: 'NASA POWER',
    tipo_dado: 'observacao_historica',
    periodo_inicio: '1991-01-01',
    periodo_fim: '2024-12-31'
  },
  clima_mensal: [
    { mes: 1, precipitacao_acumulada_mm: 250, umidade_solo: 0.7 },
    { mes: 2, precipitacao_acumulada_mm: 190, umidade_solo: 0.71 },
    { mes: 3, precipitacao_acumulada_mm: 160, umidade_solo: 0.66 },
    { mes: 4, precipitacao_acumulada_mm: 70, umidade_solo: 0.55 },
    { mes: 5, precipitacao_acumulada_mm: 45, umidade_solo: 0.45 },
    { mes: 6, precipitacao_acumulada_mm: 15, umidade_solo: 0.38 },
    { mes: 7, precipitacao_acumulada_mm: 10, umidade_solo: 0.32 },
    { mes: 8, precipitacao_acumulada_mm: 20, umidade_solo: 0.28 },
    { mes: 9, precipitacao_acumulada_mm: 50, umidade_solo: 0.3 },
    { mes: 10, precipitacao_acumulada_mm: 110, umidade_solo: 0.4 },
    { mes: 11, precipitacao_acumulada_mm: 160, umidade_solo: 0.52 },
    { mes: 12, precipitacao_acumulada_mm: 230, umidade_solo: 0.63 }
  ],
  estrategias: [
    {
      estrategia_id: 'pousio',
      nome: 'Deixar a área parada até plantar',
      resumo: 'Como muita gente faz hoje: depois do último corte, prepara o solo e espera a época de plantar a cana de ano e meio.',
      eh_pratica_atual: true,
      objetivo: 'Gastar o mínimo na reforma e ter a área livre na hora de plantar.',
      motivos: [
        'Está aqui porque é o jeito mais comum de fazer a reforma hoje. Serve de base para comparar os outros dois.'
      ],
      evidencias: [
        'No histórico da região, a área fica sem nada de outubro a fevereiro, justamente quando cai a maior parte da chuva do ano.',
        'Solo gradeado e sem palha é o que a chuva de verão mais carrega, principalmente em terreno inclinado.'
      ],
      beneficios: [
        'Não tem custo de semente nem de colheita no meio da reforma.',
        'Sobra tempo para fazer calagem, gessagem e consertar terraço com calma.'
      ],
      riscos: [
        'Valeta e voçoroca depois de temporal, principalmente em solo arenoso.',
        'A terra perde matéria orgânica e o adubo que sobrou pode lavar com a chuva.',
        'Mato cresce e vai precisar de herbicida ou de outra gradagem antes do plantio.'
      ],
      lacunas: [
        'Não sabemos quanto o seu talhão já perdeu de solo nas reformas anteriores.',
        'Não sabemos se os terraços estão bem dimensionados para chuva forte.'
      ],
      confianca: 'alta',
      explicacao_confianca: 'É o que já acontece na fazenda. O risco de erosão com solo descoberto no verão é bem conhecido.',
      pergunta_especialista: 'Com a declividade e o solo deste talhão, os terraços que tenho aguentam o verão com a terra descoberta?',
      prioridades_atendidas: [],
      requisitos: [],
      etapas_rotacao: [
        { cultura_id: 'cana_de_acucar', nome: 'Cana velha', duracao_meses: null },
        { cultura_id: 'pousio', nome: 'Terra parada', duracao_meses: 5 },
        { cultura_id: 'cana_de_acucar', nome: 'Cana nova', duracao_meses: null }
      ],
      atributos: {
        protecao_solo: 'nenhum',
        materia_organica: 'nenhum',
        fixacao_nitrogenio: 'nenhum',
        quebra_pragas: 'baixo',
        renda_direta: 'nenhum',
        demanda_agua: 'nenhum',
        trabalho_custo: 'baixo'
      },
      referencias: [
        'CATI — orientações de conservação do solo e terraceamento',
        'Embrapa Solos — erosão em solos arenosos do oeste paulista'
      ],
      calendario: calendario([['solo_descoberto', 5], ['cultura_principal', 7]])
    },
    {
      estrategia_id: 'amendoim',
      nome: 'Plantar amendoim na reforma',
      resumo: 'Muito comum no interior de São Paulo: planta amendoim em outubro, colhe em fevereiro e planta a cana em seguida.',
      eh_pratica_atual: false,
      objetivo: 'Fazer a área render dinheiro durante a reforma, em vez de ficar parada.',
      motivos: [
        'Combina com quem quer ter renda durante a reforma.',
        'O ciclo do amendoim, de mais ou menos 4 meses, cabe entre o último corte e o plantio da cana.'
      ],
      evidencias: [
        'A chuva da região começa a firmar em outubro, o que dá para plantar sem irrigação na maioria dos anos.',
        'Amendoim é leguminosa: parte do nitrogênio que ele fixa fica no solo para a cana.'
      ],
      beneficios: [
        'Receita no período em que a área ficaria parada. Muitas vezes paga a reforma.',
        'Solo coberto em boa parte do verão.',
        'Ajuda a quebrar o ciclo de algumas pragas e doenças da cana.'
      ],
      riscos: [
        'Chuva na colheita atrasa o arranquio e aumenta o risco de aflatoxina, o que derruba o preço.',
        'O arranquio revolve a terra. Entre a colheita e o plantio da cana, o solo fica exposto em pleno fevereiro.',
        'Se a chuva atrasar em outubro, a colheita atrasa e empurra o plantio da cana.'
      ],
      lacunas: [
        'Não sabemos se você tem arrancadora e recolhedora, ou um parceiro com o maquinário.',
        'Não sabemos o preço do amendoim na sua região nesta safra.',
        'Não sabemos se o histórico de nematoides do talhão favorece ou atrapalha o amendoim.'
      ],
      confianca: 'media',
      explicacao_confianca: 'A prática é bem conhecida em SP, mas o resultado depende de máquina, comprador e chuva na colheita, que a ferramenta não conhece.',
      pergunta_especialista: 'Tem comprador e parceiro com máquina para amendoim aqui perto? Vale a pena com o preço deste ano?',
      prioridades_atendidas: ['adequacao_mercado', 'fixacao_nitrogenio'],
      requisitos: ['maquinas_graos', 'comprador_graos'],
      etapas_rotacao: [
        { cultura_id: 'cana_de_acucar', nome: 'Cana velha', duracao_meses: null },
        { cultura_id: 'amendoim', nome: 'Amendoim', duracao_meses: 4 },
        { cultura_id: 'cana_de_acucar', nome: 'Cana nova', duracao_meses: null }
      ],
      atributos: {
        protecao_solo: 'medio',
        materia_organica: 'baixo',
        fixacao_nitrogenio: 'medio',
        quebra_pragas: 'medio',
        renda_direta: 'alto',
        demanda_agua: 'medio',
        trabalho_custo: 'alto'
      },
      referencias: [
        'IAC — recomendações para amendoim em áreas de reforma de cana',
        'ZARC/MAPA — janela de plantio do amendoim para o município'
      ],
      calendario: calendario([['cultura_intermediaria', 4], ['solo_descoberto', 1], ['cultura_principal', 7]])
    },
    {
      estrategia_id: 'crotalaria',
      nome: 'Plantar crotalária para adubar e proteger',
      resumo: 'Planta a crotalária com as primeiras chuvas, deixa crescer até florir, rola e planta a cana em cima da palha.',
      eh_pratica_atual: false,
      objetivo: 'Proteger o solo no verão e deixar a terra mais forte para os próximos 5 ou 6 cortes.',
      motivos: [
        'Combina com quem quer segurar o solo e deixar a terra mais forte.',
        'É a opção que deixa a terra coberta por mais tempo nos meses de chuva forte.'
      ],
      evidencias: [
        'A crotalária cobre o solo de outubro a dezembro e a palha protege até o plantio, em março.',
        'É leguminosa e fixa nitrogênio do ar. Parte dele fica para a cana.',
        'Algumas espécies, como a Crotalaria spectabilis, são usadas para baixar a população de nematoides.'
      ],
      beneficios: [
        'Solo coberto durante quase todo o verão.',
        'Mais matéria orgânica e raiz abrindo caminho no solo, o que ajuda a água a infiltrar.',
        'Pode reduzir o gasto com adubo nitrogenado no plantio da cana.'
      ],
      riscos: [
        'Não dá dinheiro na hora. O retorno vem na produtividade dos cortes seguintes.',
        'Semente pode faltar ou ficar cara perto da época de plantio.',
        'Se passar do ponto, a crotalária fica dura e dá trabalho para rolar ou incorporar.'
      ],
      lacunas: [
        'Não sabemos qual nematoide existe no talhão. Isso muda qual espécie de crotalária usar.',
        'Não sabemos quanto a cana vai responder no seu solo. O ganho varia muito de área para área.'
      ],
      confianca: 'media',
      explicacao_confianca: 'O efeito de proteção do solo é conhecido. O ganho na produção da cana depende do solo e do manejo de cada área.',
      pergunta_especialista: 'Qual crotalária é melhor para o meu talhão, juncea ou spectabilis? Vale fazer análise de nematoide antes?',
      prioridades_atendidas: ['reducao_erosao', 'materia_organica', 'fixacao_nitrogenio'],
      requisitos: [],
      etapas_rotacao: [
        { cultura_id: 'cana_de_acucar', nome: 'Cana velha', duracao_meses: null },
        { cultura_id: 'crotalaria', nome: 'Crotalária', duracao_meses: 3 },
        { cultura_id: 'palhada', nome: 'Palha', duracao_meses: 2 },
        { cultura_id: 'cana_de_acucar', nome: 'Cana nova', duracao_meses: null }
      ],
      atributos: {
        protecao_solo: 'alto',
        materia_organica: 'alto',
        fixacao_nitrogenio: 'alto',
        quebra_pragas: 'alto',
        renda_direta: 'nenhum',
        demanda_agua: 'baixo',
        trabalho_custo: 'medio'
      },
      referencias: [
        'Embrapa — adubação verde com crotalária na reforma de canavial',
        'IAC — Boletim 100, recomendações de adubação e calagem para SP'
      ],
      calendario: calendario([['adubo_verde', 3], ['palhada', 2], ['cultura_principal', 7]])
    }
  ],
  limitacoes: [
    'Os dados de satélite mostram a média de uma área de vários quilômetros, não o seu talhão exato.',
    'A chuva mostrada é a média dos anos passados. Um ano pode fugir bastante da média.',
    'A ferramenta não visitou o talhão: não conhece a análise de solo, os terraços nem o histórico de pragas.',
    'Preço e mercado mudam a cada safra e não entram no cálculo.'
  ]
};
