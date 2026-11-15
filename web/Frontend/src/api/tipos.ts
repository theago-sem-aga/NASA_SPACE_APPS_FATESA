// DTOs do contrato front <-> API.
// Duas partes:
//  - REAL (fim do arquivo): Variavel / RespostaAnalise, já implementados no backend
//    e descritos em /openapi.json ou /docs (gerados a partir dos schemas reais).
//  - PROPOSTA (o resto): o que o front precisa para as telas e o backend ainda não
//    tem (culturas, locais, municípios, POST /analises com estratégias). Nomes seguem
//    a convenção (snake_case, sem acento, unidade no nome) e precisam ser aprovados
//    com o backend (Ghabriel) antes de virar contrato.
//
// Para o back: tudo o que o front espera e ainda não está na convenção está
// marcado com "BACKEND:" (busque esse texto em src/). As rotas estão em
// src/api/cliente.ts; exemplos de resposta completos, em src/api/mock/dadosMock.ts.

/** Situação da cobertura do solo em um mês do calendário de uma estratégia. */
export type CoberturaSolo =
  | 'solo_descoberto'
  | 'cultura_principal'
  | 'cultura_intermediaria'
  | 'adubo_verde'
  | 'palhada';

/** Prioridades do produtor, conforme a lista do desafio Field Shift. */
export type PrioridadeId =
  | 'uso_agua'
  | 'valor_forragem'
  | 'fixacao_nitrogenio'
  | 'reducao_erosao'
  | 'materia_organica'
  | 'adequacao_mercado';

/** Observação histórica ≠ previsão ≠ simulação (convenção §7). */
export type TipoDado = 'observacao_historica' | 'previsao' | 'simulacao';

export interface Cultura {
  cultura_id: string;
  nome: string;
  /**
   * false = a cultura aparece com o selo "Em breve" e não pode ser escolhida.
   * BACKEND: true só para culturas que o motor de recomendação já sabe tratar.
   */
  tem_demonstracao: boolean;
}

export type Nivel = 'nenhum' | 'baixo' | 'medio' | 'alto';
export type Confianca = 'baixa' | 'media' | 'alta';

/** BACKEND: textura vem dos dados de solo (ex.: SoilGrids/FAO); o usuário não informa mais. */
export type TexturaSolo = 'arenosa' | 'media' | 'argilosa';
/** BACKEND: relevo vem da declividade do SRTM. Sugestão de faixas: plano < 3%, suave_ondulado 3–8%, ondulado > 8%. */
export type Relevo = 'plano' | 'suave_ondulado' | 'ondulado';
export type Resposta = 'sim' | 'nao' | 'nao_sei';

/**
 * Problemas que só o produtor sabe dizer. Erosão e seca saíram da pergunta:
 * BACKEND: estimar a partir dos dados e devolver em `talhao.risco_erosao` e `talhao.risco_seca`.
 */
export type ProblemaId = 'solo_cansado' | 'nematoides_pragas' | 'preco_baixo';

/** Recursos que uma estratégia exige e que o produtor informa se tem (uma pergunta por tela). */
export type RequisitoId = 'maquinas_graos' | 'comprador_graos' | 'irrigacao';

/** Como o local foi obtido. 'municipio' = centro do município, precisão de dezenas de km. */
export type OrigemLocal = 'gps' | 'municipio';

/**
 * Local já identificado. Resposta de GET /locais (coordenada → município) e
 * item de GET /municipios (busca por nome).
 * BACKEND: usar a malha municipal do IBGE no PostGIS (ST_Intersects), sem mandar
 * a coordenada do usuário para serviço de terceiros.
 */
export interface Local {
  /** Código IBGE do município, 7 dígitos. */
  codigo_ibge: string;
  municipio: string;
  /** Sigla da UF, ex.: 'SP'. */
  uf: string;
  /** Em GET /locais: a coordenada recebida. Em GET /municipios: o centro do município. */
  latitude: number;
  longitude: number;
}

/** O usuário discorda do que os mapas mostraram ("Não é bem assim"). */
export interface CorrecoesTalhao {
  textura_solo?: TexturaSolo;
  relevo?: Relevo;
}

export interface AnaliseEntrada {
  latitude: number;
  longitude: number;
  /** BACKEND: com 'municipio', a análise é mais grosseira; refletir isso na `confianca` e nas `limitacoes`. */
  origem_local: OrigemLocal;
  codigo_ibge: string | null;
  cultura_atual_id: string;
  /** Pode vir vazio ("Nenhum desses"). */
  problemas: ProblemaId[];
  recursos_disponiveis: Record<RequisitoId, Resposta>;
  /** 1 ou 2 itens. */
  prioridades: PrioridadeId[];
  /** BACKEND: quando vier preenchido, usar no lugar do valor dos mapas e devolver a fonte como 'informado_produtor'. */
  correcoes: CorrecoesTalhao;
}

/** Atributos usados na comparação lado a lado. */
export interface AtributosEstrategia {
  protecao_solo: Nivel;
  materia_organica: Nivel;
  fixacao_nitrogenio: Nivel;
  quebra_pragas: Nivel;
  renda_direta: Nivel;
  demanda_agua: Nivel;
  trabalho_custo: Nivel;
  /** Quanto serve de comida para o gado (pasto, silagem). */
  valor_forragem: Nivel;
}

export interface ClimaMensal {
  /** 1 = janeiro … 12 = dezembro */
  mes: number;
  /** Chuva acumulada no mês, média do período (mm/mês). null = sem dado. */
  precipitacao_acumulada_mm: number | null;
  /** Umidade do solo na zona das raízes, índice de 0 (seco) a 1 (saturado). null = sem dado. */
  umidade_solo: number | null;
}

export interface FonteClima {
  fonte_id: string;
  nome: string;
  tipo_dado: TipoDado;
  /** YYYY-MM-DD */
  periodo_inicio: string;
  /** YYYY-MM-DD */
  periodo_fim: string;
}

export interface MesCalendario {
  mes: number;
  cobertura: CoberturaSolo;
}

export interface EtapaRotacao {
  /** id de cultura, ou 'pousio' para área parada, ou 'palhada' */
  cultura_id: string;
  nome: string;
  duracao_meses: number | null;
}

/**
 * BACKEND: os campos de texto (resumo, motivos, evidencias, beneficios, riscos, lacunas,
 * explicacao_confianca, pergunta_especialista) aparecem na tela e são lidos em voz alta.
 * Escrever como um técnico falaria com o produtor: frases curtas, sem sigla solta, sem
 * "atributo", "critério" ou "score". Ver os exemplos em mock/dadosMock.ts.
 */
export interface Estrategia {
  estrategia_id: string;
  nome: string;
  resumo: string;
  eh_pratica_atual: boolean;
  objetivo: string;
  /** Por que esta estratégia apareceu para este talhão. */
  motivos: string[];
  evidencias: string[];
  beneficios: string[];
  riscos: string[];
  /** O que a ferramenta ainda não sabe e precisa ser checado no local. */
  lacunas: string[];
  confianca: Confianca;
  explicacao_confianca: string;
  pergunta_especialista: string;
  prioridades_atendidas: PrioridadeId[];
  requisitos: RequisitoId[];
  atributos: AtributosEstrategia;
  /** Sequência da rotação, para a faixa visual (ex.: cana → amendoim → cana). */
  etapas_rotacao: EtapaRotacao[];
  /** Onde conferir. BACKEND: só referências verificadas (título + instituição, idealmente com link). */
  referencias: string[];
  /** 12 meses, na ordem em que acontecem a partir do início da reforma. */
  calendario: MesCalendario[];
}

/** De onde veio cada característica do talhão. */
export type FonteTalhao = 'mapas' | 'informado_produtor';

/**
 * O que os dados dizem sobre o talhão, mostrado para o usuário confirmar ou corrigir.
 * BACKEND: tudo calculado no servidor a partir da coordenada. null = sem dado para o ponto.
 */
export interface CaracteristicasTalhao {
  textura_solo: TexturaSolo | null;
  fonte_textura: FonteTalhao;
  relevo: Relevo | null;
  fonte_relevo: FonteTalhao;
  /** Declividade média do entorno, em %. */
  declividade_pct: number | null;
  /** BACKEND: combinar declividade, textura e chuva forte do histórico (regra explicável, sem caixa-preta). */
  risco_erosao: Nivel | null;
  /** BACKEND: a partir da tendência de chuva e da umidade do solo (POWER/SMAP). */
  risco_seca: Nivel | null;
  /** REAL: frequência de noites frias na mínima diária da NASA POWER (detalhe em `Analise.geada`). */
  risco_geada: Nivel | null;
  /** Nomes curtos das bases usadas, para a linha "De onde vem", ex.: ['SRTM', 'SoilGrids']. */
  bases: string[];
}

/** Geada num mês: em quantos dos anos analisados houve pelo menos 1 noite fria. */
export interface GeadaMensal {
  /** 1 = janeiro … 12 = dezembro */
  mes: number;
  /** 0–1: fração dos anos com mínima do ar <= `limiar_c` neste mês. */
  probabilidade_geada: number;
  /** Faixa de incerteza de `probabilidade_geada` (poucos anos de série), com `RiscoGeada.confianca_intervalo`. */
  probabilidade_geada_min: number;
  probabilidade_geada_max: number;
  /** 0–1: o mesmo, com mínima <= `limiar_forte_c` (geada forte). */
  probabilidade_geada_forte: number;
  anos_com_geada: number;
  dias_geada_medio: number;
  menor_minima_c: number | null;
}

/**
 * Risco de geada do ponto (REAL, calculado no backend em app/domain/geada.py).
 * O front só exibe; não refaz conta nem muda os cortes.
 */
export interface RiscoGeada {
  nivel: Nivel;
  /** Nível que a faixa de incerteza permite. nivel_max ≠ nivel → "pode ser {nivel_max}". */
  nivel_min: Nivel;
  nivel_max: Nivel;
  mes_mais_arriscado: number | null;
  /** Meses com geada em pelo menos 1 de cada 10 anos. */
  meses_com_risco: number[];
  /** 0–1: fração dos anos com geada em algum mês. */
  probabilidade_ano: number;
  probabilidade_ano_min: number;
  probabilidade_ano_max: number;
  /** Confiança da faixa, ex.: 0.9 = 90%. A faixa mede só o erro de ter poucos anos, não o da grade. */
  confianca_intervalo: number;
  meses: GeadaMensal[];
  limiar_c: number;
  limiar_forte_c: number;
  periodo_inicio: number;
  periodo_fim: number;
  anos_analisados: number;
  fonte: string;
  variavel: string;
  tipo_acesso: TipoAcesso;
}

/**
 * Precipitação extrema do ponto (REAL, calculado no backend em
 * app/modelos/precipitacao_extrema.py). O front só exibe; não refaz conta.
 */
export interface RiscoPrecipitacaoExtrema {
  /** Quantos dos últimos 30 dias com dado publicado tiveram chuva acima do limiar. */
  dias_chuva_extrema_30d: number;
  /** Chuva do dia (mm) acima da qual o dia conta como extremo, no mês de `data_referencia`. */
  limiar_chuva_extrema_mm_dia: number;
  /** YYYY-MM-DD do dia mais recente com dado. */
  data_referencia: string;
  /** Frase curta explicando o método (percentil, período do histórico). */
  metodo: string;
  fonte: string;
  variavel: string;
  tipo_acesso: TipoAcesso;
}

export interface ChuvaAno {
  ano: number;
  chuva_mm: number;
}

/**
 * A chuva do ano vem caindo, subindo ou está estável? (REAL, calculado no backend em
 * app/domain/tendencia_hidrica.py: Mann-Kendall + inclinação de Sen.) O front só exibe.
 */
export interface TendenciaHidrica {
  /** 'estavel' = sem tendência clara (p-valor >= alfa), mesmo que a chuva varie muito. */
  tendencia: 'secando' | 'estavel' | 'mais_chuvoso';
  mm_por_decada: number;
  pct_por_decada: number;
  p_valor: number;
  alfa: number;
  media_anual_mm: number;
  /** Ponta inicial e final da reta de tendência (mm), para desenhar a linha. */
  reta_inicio_mm: number;
  reta_fim_mm: number;
  anos: ChuvaAno[];
  periodo_inicio: number;
  periodo_fim: number;
  anos_analisados: number;
  metodo: string;
  fonte: string;
  variavel: string;
  tipo_acesso: TipoAcesso;
}

export interface FotoNdvi {
  data: string;
  ndvi: number;
  /** Normal da mesma época nos anos anteriores; null quando há poucos anos. */
  normal_mediana: number | null;
  normal_p10: number | null;
  normal_p90: number | null;
}

/**
 * A planta está tão verde quanto costuma estar nesta época? (REAL, calculado no backend em
 * app/domain/estresse_vegetal.py: NDVI do MODIS da foto mais recente vs. os anos anteriores
 * no mesmo período de 16 dias.) O front só exibe.
 */
export interface EstresseVegetal {
  /** 'sem_vegetacao' = o pixel quase nunca tem planta (cidade, água): não dá para medir. */
  situacao: 'normal' | 'abaixo' | 'muito_abaixo' | 'acima' | 'sem_vegetacao';
  data_foto: string;
  ndvi_atual: number;
  normal_mediana: number;
  normal_p10: number;
  normal_p25: number;
  normal_p75: number;
  normal_p90: number;
  anomalia_pct: number;
  /** Fração dos anos anteriores com NDVI menor que o de agora (0..1). */
  posicao: number;
  anos_mais_verdes: number;
  anos_comparados: number;
  ndvi_mediano_geral: number;
  limiar_sem_vegetacao: number;
  /** Último ano de fotos válidas, com o normal de cada época (para o gráfico). */
  ultimas_fotos: FotoNdvi[];
  periodo_inicio: number;
  periodo_fim: number;
  metodo: string;
  latitude_pixel: number;
  longitude_pixel: number;
  distancia_pixel_km: number;
  fonte: string;
  produto: string;
  tipo_acesso: TipoAcesso;
}

export interface Analise {
  analise_id: string;
  /** true = dados fictícios de demonstração. A UI deve deixar isso visível. */
  eh_mock: boolean;
  /** Texto pronto para exibir, ex.: 'Olímpia (SP)'. */
  descricao_local: string;
  talhao: CaracteristicasTalhao;
  fonte_clima: FonteClima;
  clima_mensal: ClimaMensal[];
  /** null = a série de temperatura mínima não respondeu para o ponto. */
  geada: RiscoGeada | null;
  /** PROPOSTA (o back ainda não manda): calor forte mês a mês. Ausente/null = não mostra. */
  estresse_termico?: EstresseTermico | null;
  /** null = a série de precipitação diária não respondeu para o ponto. */
  precipitacao_extrema: RiscoPrecipitacaoExtrema | null;
  /** null = faltam anos completos na série de chuva, ou a fonte não respondeu. */
  tendencia_hidrica: TendenciaHidrica | null;
  /** null = ainda não há série de NDVI do MODIS guardada para esta região. */
  estresse_vegetal: EstresseVegetal | null;
  /** Já ordenadas pelo backend. O front não reordena nem pontua. */
  estrategias: Estrategia[];
  limitacoes: string[];
}

// ---------------------------------------------------------------------------
// Contrato REAL, já implementado: GET /api/v1/analises?latitude=&longitude=
// Copiado do /openapi.json da API (contrato real, sempre atualizado).
// Não renomear: estes nomes são os do backend.
// ---------------------------------------------------------------------------

/** 'ao_vivo' = consultada na hora (NASA POWER, USDA, OpenET); 'pre_processado' = índice PostGIS + Parquet. */
export type TipoAcesso = 'ao_vivo' | 'pre_processado';

/** Uma medição de uma fonte. `nome` segue o /openapi.json (ex.: 'precipitacao_acumulada_mm'). */
export interface Variavel {
  nome: string;
  /** 'nasa_power' | 'usda_soil_data_access' | 'openet' | 'gpm' | 'smap' | 'srtm' | 'ecostress' | 'landsat' */
  fonte: string;
  tipo_acesso: TipoAcesso;
  /** YYYY-MM-DD; null quando a variável não tem data (ex.: solo). */
  data: string | null;
  /** null = sem medição. Nunca é zero no lugar de "sem dado". */
  valor: number | null;
}

export interface FonteIndisponivel {
  fonte: string;
  /** 'fora_da_regiao_pre_processada' | 'fora_da_cobertura' */
  motivo: string;
}

export interface RespostaAnalise {
  latitude: number;
  longitude: number;
  variaveis: Variavel[];
  fontes_indisponiveis: FonteIndisponivel[];
}

/** Esqueleto de erro sugerido na convenção §6 (pendente de aprovação). */
export interface ErroApi {
  erro: {
    codigo: string;
    mensagem: string;
    detalhes: unknown[];
    requisicao_id: string | null;
  };
}

// ---------------------------------------------------------------------------
// PROPOSTA: painel "Sua colheita" (GET /api/v1/producao?codigo_ibge=...).
// Montado em web/Backend/app/modelos/painel_producao.py: TODA regra (situação,
// cenários) fica no backend; o front só desenha. Ver /openapi.json ou /docs.

/** acima/abaixo = rendimento do último ano passou 5% da média dos 5 anteriores. */
export type SituacaoColheita = 'acima' | 'normal' | 'abaixo' | 'sem_plantio';

export interface ColheitaCultura {
  /** Mesmo id de Cultura (escolhe o pictograma). */
  cultura_id: string;
  nome: string;
  situacao: SituacaoColheita;
  ano: number | null;
  area_plantada_ha: number | null;
  rendimento_kg_ha: number | null;
  rendimento_medio_anterior_kg_ha: number | null;
  /**
   * Só presentes quando a unidade NÃO é kg/ha (hoje: condados dos EUA, via
   * USDA NASS QuickStats). Bushel pesa diferente por cultura, então o
   * backend nunca converte pra kg/ha sem fonte segura — mostra nativo
   * (ex.: "137 BU / ACRE") em vez de arriscar uma conversão errada.
   */
  rendimento_nativo?: number | null;
  rendimento_unidade?: string | null;
  rendimento_medio_anterior_nativo?: number | null;
}

export interface ClimaAno {
  ano: number;
  chuva_mm: number;
  chuva_normal_mm: number;
  /** pouca/muita = 15% abaixo/acima da média do período normal. */
  situacao_chuva: 'pouca' | 'normal' | 'muita';
  /** Para o desenho: de cada 10 gotas de um ano normal, quantas caíram. */
  gotas_em_10: number;
  tmax_c: number;
  tmax_normal_c: number;
  /** Média da temperatura máxima 1 °C ou mais acima/abaixo do normal. */
  situacao_calor: 'mais_quente' | 'normal' | 'mais_frio';
  /** Diferença arredondada em graus (positivo = mais quente). */
  graus_de_diferenca: number;
  /** Ex.: '1995-2024'. */
  periodo_normal: string;
}

/** Comparação com a média do clima, como o INMET publica. */
export type Tendencia = 'acima' | 'normal' | 'abaixo';
/** Como a chuva deve vir no mês, pelo texto do boletim para a região. */
export type ChuvaDoMes = 'irregular' | 'melhora' | 'normal' | 'excesso';

/**
 * Previsão OFICIAL para os próximos ~3 meses (INMET/INPE/FUNCEME), transcrita
 * do boletim mensal. tipo_dado = 'previsao': a tela mostra o selo "Previsão".
 */
export interface PrevisaoClima {
  /** Região do boletim, ex.: 'Região de São José do Rio Preto (noroeste paulista)'. */
  abrangencia: string;
  /** Ex.: 'novembro de 2026 a janeiro de 2027'. */
  periodo: string;
  chuva: Tendencia;
  temperatura: Tendencia;
  meses: { mes: string; nome: string; chuva: ChuvaDoMes }[];
  /** figura = nome de pictograma (src/components/Pictograma.tsx). */
  dicas: { figura: string; frase: string }[];
  fonte: string;
  url_fonte: string;
  /** AAAA-MM do boletim. */
  publicado_em: string;
  tipo_dado: 'previsao';
}

export interface PainelProducao {
  /** Brasil: codigo_ibge/municipio/uf. EUA: condado/estado. Só um dos pares. */
  codigo_ibge: string | null;
  municipio: string | null;
  uf: string | null;
  condado?: string | null;
  estado?: string | null;
  culturas: ColheitaCultura[];
  /** null = a série de clima (NASA POWER) não respondeu ou está incompleta. */
  clima: ClimaAno | null;
  /** null = ainda não temos a previsão oficial transcrita para esta cidade. */
  previsao: PrevisaoClima | null;
  fontes: string[];
  limitacoes: string[];
  tipo_dado: TipoDado;
  /** Data em que os números foram calculados (AAAA-MM-DD). */
  gerado_em: string;
}

// ---------------------------------------------------------------------------
// PROPOSTA: acompanhamento da área pelo satélite
// (GET /api/v1/acompanhamento?latitude=&longitude=). Montado por
// web/Backend/app/pipelines/acompanhamento_sentinel2.py; regras no backend.

/** Pelo verdor (NDVI) num quadrado de 100 m: < 0,25 / 0,25–0,50 / >= 0,50. */
export type EstadoArea = 'terra_descoberta' | 'pouca_planta' | 'planta_verde';

export interface FotoSatelite {
  /** AAAA-MM-DD da passagem do satélite. */
  data: string;
  /** Verdor de -1 a 1 (NDVI). Só para referência; a tela mostra `estado`. */
  ndvi: number;
  estado: EstadoArea;
  /** Caminho relativo à raiz do site (ex.: 'imagens/satelite/3549805_2026-11-12.png'). */
  imagem: string;
}

export interface Acompanhamento {
  codigo_ibge: string;
  latitude: number;
  longitude: number;
  /** true = talhão de exemplo da cidade, não o ponto da pessoa (o front avisa). */
  ponto_exemplo?: boolean;
  /** Da mais nova para a mais velha; só fotos sem nuvem sobre o talhão. Vazio = sem foto limpa. */
  fotos: FotoSatelite[];
  /** A última foto confere com o que o plano previa? null = sem foto. */
  confere_por_cobertura: Record<CoberturaSolo, boolean | null>;
  lado_talhao_m: number;
  fonte: string;
  /** Texto de atribuição exigido pelo Copernicus. */
  atribuicao: string;
  tipo_dado: TipoDado;
  gerado_em: string;
}

// --- Estresse térmico (PROPOSTA de contrato; o back ainda não calcula) ------------
// BACKEND: calcular como o risco de geada (app/domain/geada.py), a partir de
// temperatura_maxima_c diária da NASA POWER, e devolver em Analise.estresse_termico.
// O front exibe e usa os mesmos nomes. Exemplo real em api/mock/calorMock.ts.

export interface CalorMensal {
  mes: number;
  /** 0–1: fração dos anos com pelo menos um dia de máxima >= limiar_c no mês. */
  probabilidade_calor: number;
  anos_com_calor: number;
  /** Média de dias por ano com máxima >= limiar_c. */
  dias_calor_medio: number;
  maior_maxima_c: number;
  maxima_media_c: number;
}

export interface EstresseTermico {
  nivel: Nivel;
  mes_mais_arriscado: number | null;
  /** Meses com calor forte em pelo menos metade dos anos. */
  meses_com_risco: number[];
  dias_calor_ano: number;
  meses: CalorMensal[];
  /** Limiar de calor forte, em °C (hoje 35 °C, pendente de fonte por cultura). */
  limiar_c: number;
  periodo_inicio: number;
  periodo_fim: number;
  anos_analisados: number;
  fonte: string;
  variavel: string;
}
