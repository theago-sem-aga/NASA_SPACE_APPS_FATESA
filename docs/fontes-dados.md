# Fontes de dados — detalhe completo

## Verificação da entrega backend — 14/11/2026

- NASA POWER mensal: consulta real do ponto piloto 36.6,-119.7 para 1991–2020;
  30 valores anuais válidos para cada um dos 12 meses. Unidade original de
  PRECTOTCORR: mm/day; acumulados mensais calculados antes da média interanual.
  Resposta original, parâmetros, extração e hash são preservados localmente e
  no snapshot da análise. Método em `app/integrations/clima_historico.py`.
- Documentação da API temporal: https://power.larc.nasa.gov/docs/services/api/temporal/
- Dados pré-processados: 16 células GPM, 1 SMAP, 20 SRTM, 16 ECOSTRESS, 7 Landsat.
  São os arquivos já presentes; não implicam histórico longo ou cobertura total.
  A leitura preserva hash SHA256 do Parquet e identificador da célula no snapshot.
- OpenET não foi verificado com chave neste computador. NASS não está integrado
  ao fluxo por coordenada. Não declarar essas integrações como concluídas.
- Referências verificadas como contexto dos cenários EXPLORATÓRIOS, não validação
  do calendário ou dos níveis simulados: UC Cooperative Extension, Fact Sheets
  21 e 22 (2024), disponíveis em:
  https://agric.ucdavis.edu/sites/g/files/dgvnsk12316/files/inline-files/Fact%20Sheet_21%20Selecting%20Cover%20Crops.pdf
  e https://agric.ucdavis.edu/sites/g/files/dgvnsk12316/files/inline-files/Fact%20Sheet_22%20Cover%20Cropping%20Considerations.pdf

Os detalhes abaixo são pesquisa anterior; requisitos e cobertura ainda devem ser
verificados por produto/versão antes de usá-los como fundamento de recomendações.

> Referência expandida do `CLAUDE.md`. Pesquisa original: Julya.

Os links marcados como **Link oficial** são os que a página do desafio indica para cada base.

**Cobertura geográfica:** muitas bases da lista oficial cobrem **apenas os EUA**. Se o projeto focar no Brasil, as bases marcadas como 🌎 **Global** são as que funcionam aqui.

## Quem fornece cada base: NASA x outras instituições

A página do desafio agrupa 24 bases em "NASA Data & Resources" e 2 em "Space Agency Partner Resources". Mas só **10 das 26 são produzidas pela NASA**; as outras são de outras instituições e foram recomendadas pela NASA como complemento. Na submissão, a seção de dados pede quais bases **NASA** e de **parceiros** foram usadas, então vale saber a diferença.

### Bases da NASA (10)

| Base | Quem produz | Cobertura |
|---|---|---|
| SMAP | NASA (JPL) | 🌎 Global |
| GPM / IMERG | NASA e JAXA (Japão) | 🌎 Global |
| Landsat | NASA e USGS | 🌎 Global |
| MODIS | NASA (satélites Terra e Aqua) | 🌎 Global |
| VIIRS | NASA e NOAA | 🌎 Global |
| NASA POWER | NASA (Langley) | 🌎 Global |
| SRTM | NASA e NGA | 🌎 Global |
| ECOSTRESS | NASA (JPL, na Estação Espacial) | 🌎 Quase global |
| NLDAS / GLDAS | NASA (Goddard); NLDAS em parceria com NOAA | NLDAS: América do Norte · GLDAS: 🌎 Global |
| GEDI | NASA e Universidade de Maryland | 🌎 51,6°N–51,6°S |

### Agências espaciais parceiras (2)

| Base | Quem produz | Cobertura |
|---|---|---|
| Sentinel-2 | ESA / Programa Copernicus (União Europeia) | 🌎 Global |
| ERA5 | ECMWF / Copernicus (União Europeia) | 🌎 Global |

### Outras instituições (14)

| Base | Quem produz | Cobertura |
|---|---|---|
| USDA Ag Data Commons | USDA (Biblioteca Nacional de Agricultura) | EUA (majoritariamente) |
| Web Soil Survey | USDA NRCS | EUA |
| SSURGO / STATSGO2 | USDA NRCS | EUA |
| Cropland Data Layer | USDA NASS | EUA |
| NASS QuickStats | USDA NASS | EUA |
| NAIP | USDA (Farm Production and Conservation) | EUA |
| AMS Market News | USDA AMS | EUA |
| NLCD | USGS | EUA |
| USGS NWIS | USGS | EUA |
| LANDFIRE | Serviço Florestal dos EUA (USFS) e Departamento do Interior | EUA |
| PRISM | Oregon State University | EUA |
| CoCoRaHS | Rede de voluntários (Colorado Climate Center) | América do Norte |
| OpenET | Consórcio de instituições, com participação da NASA | Oeste dos EUA |
| FAO GAEZ | FAO (ONU) e IIASA | 🌎 Global |

**Resumo para o Brasil:** todas as 10 bases da NASA e as 2 das parceiras funcionam aqui (no NLDAS/GLDAS, só o GLDAS). Das outras 14, só a **FAO GAEZ** cobre o Brasil.

## Onde buscar cada tema

Guia rápido de quais links usar para cada assunto. Algumas bases aparecem em mais de um tema. **Só EUA** indica que a base não cobre o Brasil.

| Tema | Bases (links oficiais) |
|---|---|
| 💧 Umidade do solo e seca | [SMAP](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap) · [NLDAS/GLDAS](https://www.earthdata.nasa.gov/) (buscar "GLDAS") · [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) |
| 🌧️ Chuva | [GPM/IMERG](https://gpm.nasa.gov/data) · [NASA POWER](https://power.larc.nasa.gov/) · [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) · [PRISM](https://prism.oregonstate.edu/) (só EUA) · [CoCoRaHS](https://www.cocorahs.org/Maps) (só América do Norte) |
| 🌡️ Clima, temperatura e geada | [NASA POWER](https://power.larc.nasa.gov/) · [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) · [NLDAS/GLDAS](https://www.earthdata.nasa.gov/) · [PRISM](https://prism.oregonstate.edu/) (só EUA) |
| 🌱 Saúde da lavoura e vegetação (NDVI, estresse) | [Sentinel-2](https://dataspace.copernicus.eu/) (10 m) · [Landsat](https://earthexplorer.usgs.gov/) (30 m) · [MODIS](https://lpdaac.usgs.gov/products/) · [VIIRS](https://search.earthdata.nasa.gov/search?q=VIIRS) · [GEDI](https://gedi.umd.edu/data) · [NAIP](https://naip-usdaonline.hub.arcgis.com/) (só EUA) |
| 🔥 Calor e consumo de água da planta (evapotranspiração) | [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) · [NASA POWER](https://power.larc.nasa.gov/) · [OpenET](https://openetdata.org/) (só oeste dos EUA) |
| 🟫 Propriedades do solo | [FAO GAEZ](https://gaez.fao.org/) · [Web Soil Survey](https://websoilsurvey.nrcs.usda.gov/app/) (só EUA) · [SSURGO/STATSGO2](https://www.nrcs.usda.gov/resources/data-and-reports/soils) (só EUA) · [Ag Data Commons](https://www.nal.usda.gov/services/agdatacommons) (maioria EUA) |
| ⛰️ Relevo e erosão | [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) · [Web Soil Survey](https://websoilsurvey.nrcs.usda.gov/app/) e [SSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/soils) (só EUA) |
| 🌾 Que culturas plantar (aptidão) | [FAO GAEZ](https://gaez.fao.org/), a fonte principal deste tema |
| 🔄 Histórico de culturas e rotações praticadas | [Cropland Data Layer](https://nassgeodata.gmu.edu/CropScape/) (só EUA) · [NASS QuickStats](https://quickstats.nass.usda.gov/) (só EUA) · [Ag Data Commons](https://www.nal.usda.gov/services/agdatacommons) |
| 🗺️ Uso da terra e paisagem | [NLCD](https://www.usgs.gov/centers/eros/science/national-land-cover-database) (só EUA) · [LANDFIRE](https://www.landfire.gov/) (só EUA) · [GEDI](https://gedi.umd.edu/data) |
| 🚰 Água para irrigação (rios e aquíferos) | [USGS NWIS](https://waterdata.usgs.gov/nwis) (só EUA) |
| 💰 Mercado e preços | [USDA AMS Market News](https://www.ams.usda.gov/market-news) (só EUA) |

### Para um projeto no Brasil

- **Bases da lista oficial que cobrem o Brasil:** NASA POWER, SMAP, GPM/IMERG, Sentinel-2, Landsat, MODIS/VIIRS, SRTM, ECOSTRESS, GEDI, GLDAS, ERA5 e FAO GAEZ.
- **Temas sem fonte brasileira na lista oficial:** histórico de rotações, água para irrigação e mercado. Fontes nacionais equivalentes, que **não fazem parte da lista oficial**:
  - Produção agrícola por município: IBGE SIDRA (https://sidra.ibge.gov.br)
  - Safras e preços: Conab (https://www.conab.gov.br)
  - Recursos hídricos: ANA (https://www.gov.br/ana)
  - Uso e cobertura da terra, incluindo culturas por ano: MapBiomas (https://brasil.mapbiomas.org)

## Visão geral

| Base | Cobertura | Resolução espacial | O que mede |
|---|---|---|---|
| SMAP | 🌎 Global | ~9–36 km | Umidade do solo, congelamento |
| GPM / IMERG | 🌎 Global (60°N–60°S) | ~10 km, a cada 30 min | Chuva |
| Landsat | 🌎 Global | 30 m | Reflectância, NDVI |
| MODIS / VIIRS | 🌎 Global | 250–1000 m, diária | Reflectância, NDVI, vegetação |
| NASA POWER | 🌎 Global | ~0,5° (~50 km) | Clima e agroclimatologia por ponto |
| SRTM | 🌎 Global (60°N–56°S) | 30 m | Elevação, relevo |
| ECOSTRESS | 🌎 Quase global (órbita da ISS) | ~70 m | Temperatura da superfície, evapotranspiração |
| GEDI | 🌎 51,6°N–51,6°S | Pontos de ~25 m | Altura do dossel, biomassa |
| NLDAS / GLDAS | NLDAS: América do Norte · GLDAS: 🌎 Global | 1/8° · 0,25° | Clima e umidade do solo modelados |
| FAO GAEZ | 🌎 Global | ~1–10 km | Aptidão agrícola por cultura |
| Sentinel-2 (ESA) | 🌎 Global | 10–20 m, a cada ~5 dias | Imagem multiespectral |
| ERA5 (ECMWF) | 🌎 Global | ~0,25° (~31 km), horária | Reanálise climática |
| USDA Ag Data Commons | EUA (majoritariamente) | Variável | Conjuntos de dados agrícolas |
| Web Soil Survey | EUA | Escala de campo | Mapas e propriedades de solo |
| Cropland Data Layer | EUA | 30 m, anual | Tipo de cultura plantada |
| PRISM | EUA | 800 m – 4 km | Clima com efeito do relevo |
| SSURGO / STATSGO2 | EUA | Campo / regional | Atributos de solo |
| NAIP | EUA | ~1 m | Foto aérea |
| NLCD | EUA | 30 m | Uso e cobertura da terra |
| CoCoRaHS | América do Norte | Pontos (voluntários) | Chuva medida no solo |
| USGS NWIS | EUA | Estações | Rios, aquíferos, qualidade da água |
| USDA AMS Market News | EUA | Mercados | Preços de commodities |
| USDA NASS QuickStats | EUA | Condado / estado | Estatísticas de produção |
| OpenET | Oeste dos EUA | 30 m | Evapotranspiração por campo |
| USFS LANDFIRE | EUA | 30 m | Vegetação e combustível |

## Dados da NASA

#### SMAP (Soil Moisture Active Passive)
- **O que tem:** umidade do solo na superfície e estado de congelamento/descongelamento, no mundo todo, a cada 2–3 dias. O produto **L4** também estima a umidade na zona das raízes (0–100 cm) numa grade de 9 km.
- **Para que serve no projeto:** identificar estresse por seca, água disponível, capacidade de infiltração e sinais precoces de estresse da cultura; avaliar culturas de rotação que aumentem a eficiência no uso da água ou a resistência à seca.
- **Atenção:** a grade de 9 km não mostra diferenças dentro de um mesmo campo.
- **Link oficial:** https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap
- **Acesso:** NASA Earthdata Search (precisa de login gratuito no Earthdata) ou AppEEARS.

#### GPM e IMERG (Global Precipitation Measurement)
- **O que tem:** taxa e acumulado de chuva estimados por satélite, para o mundo todo.
- **Para que serve:** avaliar a regularidade das chuvas, a frequência de tempestades extremas, o risco de erosão, a entrada de água no solo e as tendências de umidade no longo prazo; comparar estratégias de rotação em diferentes cenários de chuva.
- **Link oficial:** https://gpm.nasa.gov/data
- **Acesso:** Earthdata Search. As camadas IMERG do **NASA Worldview** podem ser baixadas direto como imagens de alta resolução.

#### Landsat e MODIS/VIIRS (reflectância, NDVI e índices de vegetação)
- **O que tem:** reflectância corrigida, NDVI, índices de vegetação e indicadores de estresse vegetal, solo exposto e mudanças sazonais. Landsat tem 30 m de resolução; MODIS/VIIRS têm 250–1000 m, mas passam todo dia.
- **Para que serve:** mapear o vigor da lavoura, acompanhar as transições entre estações, detectar períodos de estresse e comparar opções de rotação visualmente.
- **Links oficiais:** Landsat — https://earthexplorer.usgs.gov/ · MODIS — https://lpdaac.usgs.gov/products/ · VIIRS — https://search.earthdata.nasa.gov/search?q=VIIRS
- **Acesso:** também por AppEEARS e Worldview.

#### NASA POWER (agroclimatologia e meteorologia)
- **O que tem:** dados solares, meteorológicos e climatológicos voltados à agricultura: temperatura, umidade, radiação e indicadores derivados. Séries históricas de várias décadas.
- **Para que serve:** estimar o consumo de água da cultura, as condições da safra, o risco de geada e a aptidão climática das culturas candidatas à rotação.
- **Link oficial:** https://power.larc.nasa.gov/
- **Acesso:** API gratuita, sem login, consultada por latitude e longitude. **É a base mais fácil de integrar.**

#### SRTM (Shuttle Radar Topography Mission)
- **O que tem:** modelo global de elevação do terreno.
- **Para que serve:** calcular declividade, escoamento, risco de erosão, fluxo de água e estresse ligado ao relevo; indicar culturas de rotação que melhorem a infiltração, reduzam a erosão ou estabilizem o solo em encostas.
- **Link oficial:** https://www.earthdata.nasa.gov/data/instruments/srtm
- **Acesso:** Earthdata Search ou USGS EarthExplorer.

#### ECOSTRESS
- **O que tem:** temperatura da superfície (LST) e evapotranspiração (ET) em alta resolução, medidas a partir da Estação Espacial Internacional.
- **Para que serve:** detectar focos de estresse vegetal, exposição ao calor, vulnerabilidade de raízes rasas e demanda de água da cultura; identificar quando a cultura atual está ficando mais vulnerável; mapear diferenças de microclima dentro da propriedade.
- **Atenção:** a órbita da ISS faz as passagens acontecerem em horários e intervalos irregulares.
- **Link oficial:** https://ecostress.jpl.nasa.gov/data
- **Acesso:** Earthdata Search ou AppEEARS.

#### NLDAS / GLDAS (Land Data Assimilation Systems)
- **O que tem:** grades que combinam observações de satélite e de estações para gerar temperatura, chuva, umidade do solo, indicadores de evapotranspiração, radiação e outras variáveis de superfície, com resolução menor que um dia. NLDAS cobre a América do Norte; GLDAS cobre o mundo todo.
- **Para que serve:** estudar o início de secas, déficits de umidade, transições da safra e condições de estresse; fornecer séries temporais contínuas como entrada para modelos de IA.
- **Link oficial:** https://www.earthdata.nasa.gov/
- **Acesso:** Earthdata Search, buscando "NLDAS" ou "GLDAS".

#### GEDI (Global Ecosystem Dynamics Investigation)
- **O que tem:** medições a laser da estrutura da vegetação: altura do dossel, índice de área foliar e biomassa acima do solo (produtos Level-4).
- **Para que serve:** entender a densidade da vegetação, o estresse do dossel e as mudanças de longo prazo no entorno das áreas agrícolas. Funciona melhor em vegetação alta, como matas e florestas, e complementa SMAP, Landsat e MODIS.
- **Link oficial:** https://gedi.umd.edu/data
- **Acesso:** Earthdata Search.

## Dados agrícolas e de solo (outras fontes)

#### USDA Ag Data Commons
- **O que tem:** conjuntos de dados agrícolas abertos sobre solo, culturas, clima, manejo, fenologia, qualidade da água e condições ecológicas.
- **Para que serve:** trazer contexto de campo para complementar o satélite: informações locais de culturas, medições de solo, práticas de manejo e pesquisas agrícolas, alinhando os indicadores da NASA com as restrições reais da propriedade.
- **Link oficial:** https://www.nal.usda.gov/services/agdatacommons

#### Web Soil Survey (WSS)
- **O que tem:** dados oficiais de solo dos EUA, mantidos pelo NRCS: mapas detalhados, propriedades, classes de drenagem, risco de erosão, classificação hidrológica e aptidão para diferentes usos.
- **Para que serve:** obter características do solo de cada campo (matéria orgânica, textura, infiltração, risco de compactação) para melhorar as recomendações de rotação.
- **Link oficial:** https://websoilsurvey.nrcs.usda.gov/app/

#### Cropland Data Layer (CDL) / CropScape
- **O que tem:** classificação anual das lavouras dos EUA em 30 m, identificando a cultura plantada (milho, soja, algodão, trigo, alfafa e outras).
- **Para que serve:** reconstruir as rotações já praticadas, acompanhar mudanças entre safras, identificar campos sem cobertura e comparar padrões locais com as condições ambientais vistas pela NASA. Também serve como dado rotulado para treinar modelos de IA.
- **Link oficial:** https://nassgeodata.gmu.edu/CropScape/

#### SSURGO / STATSGO2 (USDA NRCS)
- **O que tem:** atributos detalhados de solo: textura, matéria orgânica, classe de drenagem, grupo hidrológico, fatores de erosão, camadas restritivas e capacidade de retenção de água. SSURGO é na escala de campo; STATSGO2 é regional.
- **Para que serve:** avaliar, para cada local, a saúde do solo, o potencial de erosão, a infiltração e a aptidão das culturas, tornando as sugestões de rotação agronomicamente fundamentadas.
- **Link oficial:** https://www.nrcs.usda.gov/resources/data-and-reports/soils
- **Acesso:** também pelo Web Soil Survey.

#### FAO GAEZ (Global Agro-Ecological Zones)
- **O que tem:** camadas globais de aptidão agroclimática para dezenas de culturas, restrições de solo, indicadores de disponibilidade de água, potencial de produtividade e avaliações de produtividade da terra.
- **Para que serve:** verificar se as culturas de rotação propostas combinam com o clima e o solo do local; comparar cenários de rotação de forma global. **É uma das principais fontes de aptidão agrícola que funciona para o Brasil.**
- **Link oficial:** https://gaez.fao.org/

#### OpenET
- **O que tem:** evapotranspiração por campo, estimada com modelos baseados em satélite, para estados do oeste dos EUA.
- **Para que serve:** avaliar a demanda de água da cultura, o momento da irrigação, a eficiência no uso da água e campos sob estresse térmico ou hídrico; serve como referência para comparar com ECOSTRESS e NASA POWER.
- **Link oficial:** https://openetdata.org/

## Clima e água (outras fontes)

#### PRISM (Oregon State University)
- **O que tem:** clima dos EUA em escala diária, mensal e normais de 30 anos: chuva, temperatura, ponto de orvalho, datas de geada e mais. Leva em conta o efeito do relevo.
- **Para que serve:** avaliar tendências climáticas de longo prazo, alinhar a rotação ao histórico local de temperatura e chuva e validar indicadores de estresse derivados de satélite.
- **Link oficial:** https://prism.oregonstate.edu/

#### CoCoRaHS (Community Collaborative Rain, Hail & Snow Network)
- **O que tem:** medições diárias de chuva e neve feitas por voluntários na América do Norte.
- **Para que serve:** validar estimativas de chuva por satélite (como o IMERG), detectar chuvas extremas muito localizadas e refinar previsões de estresse hídrico ou de momento de irrigação.
- **Link oficial:** https://www.cocorahs.org/Maps

#### USGS NWIS (National Water Information System)
- **O que tem:** séries longas de nível de aquíferos, vazão e nível de rios e qualidade da água.
- **Para que serve:** avaliar a água disponível para irrigação, identificar estresse hidrológico, entender riscos de erosão rio abaixo e comparar a umidade vista pela NASA com medições em campo.
- **Link oficial:** https://waterdata.usgs.gov/nwis

## Paisagem e imagens (outras fontes)

#### NAIP (National Agriculture Imagery Program)
- **O que tem:** fotos aéreas dos EUA com cerca de 1 m de resolução, tiradas durante a safra.
- **Para que serve:** delimitar talhões, detectar períodos de solo exposto, acompanhar o desenvolvimento da lavoura, monitorar mudanças de manejo e avaliar a cobertura vegetal em detalhe; treinar modelos de IA que precisam de mais detalhe que o satélite ou validar padrões vistos pela NASA.
- **Link oficial:** https://naip-usdaonline.hub.arcgis.com/
- **Acesso:** também pelo USGS EarthExplorer.

#### USGS NLCD (National Land Cover Database)
- **O que tem:** classificação de uso e cobertura da terra em 30 m, para várias décadas.
- **Para que serve:** identificar lavouras, pastagens, florestas, corpos d'água, áreas úmidas e zonas urbanas perto das propriedades; entender como a paisagem influencia microclima, água, erosão e pragas; analisar mudanças de cobertura ao longo do tempo.
- **Link oficial:** https://www.usgs.gov/centers/eros/science/national-land-cover-database
- **Acesso:** os arquivos também ficam em https://www.mrlc.gov

#### USFS LANDFIRE
- **O que tem:** tipo e condição da vegetação, modelos de combustível e características da paisagem nos EUA.
- **Para que serve:** entender ecossistemas locais, cobertura perene, interações entre árvores e lavouras e feições da paisagem que afetam microclima, fluxo de água, erosão e biodiversidade.
- **Link oficial:** https://www.landfire.gov/

## Mercado e estatísticas agrícolas

#### USDA AMS Market News
- **O que tem:** preços de commodities, tendências de demanda e condições de mercado de culturas e pecuária.
- **Para que serve:** verificar se as culturas de rotação propostas têm mercado local ou regional, uma restrição importante para o agricultor.
- **Link oficial:** https://www.ams.usda.gov/market-news

#### USDA NASS QuickStats
- **O que tem:** estatísticas agrícolas por condado e por estado: produtividade, área plantada, histórico de produção e frequência de culturas.
- **Para que serve:** calibrar modelos com o desempenho histórico, comparar possibilidades de rotação e explorar tendências agrícolas de longo prazo.
- **Link oficial:** https://quickstats.nass.usda.gov/
- **Acesso:** tem API com chave gratuita.

## Agências espaciais parceiras

#### Copernicus Sentinel-2 (ESA)
- **O que tem:** imagens multiespectrais gratuitas de 10–20 m, com revisita frequente, e bandas feitas para análise de vegetação (red-edge, infravermelho próximo e SWIR).
- **Para que serve:** calcular NDVI/EVI, mapear solo exposto, detectar estresse da lavoura e acompanhar a safra em detalhe. Tem resolução melhor que Landsat e MODIS, bom para análise por talhão.
- **Link oficial:** https://dataspace.copernicus.eu/ (Copernicus Data Space Ecosystem)

#### ERA5 (reanálise do ECMWF)
- **O que tem:** reanálise climática global com variáveis horárias: temperatura, chuva, vento, umidade, temperatura do solo e radiação, desde 1940.
- **Para que serve:** preencher lacunas onde há poucas estações meteorológicas, analisar tendências climáticas de longo prazo, criar variáveis temporais para modelos de IA e dar contexto contínuo às observações da NASA.
- **Link oficial:** https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview
- **Acesso:** Copernicus Climate Data Store, com login gratuito.

## Observações práticas

- **Login do NASA Earthdata:** SMAP, GPM, ECOSTRESS, GEDI e NLDAS/GLDAS exigem uma conta gratuita em https://urs.earthdata.nasa.gov.
- **Caminho mais rápido para um protótipo:** NASA POWER, consultado por coordenada sem login, mais FAO GAEZ para a aptidão das culturas. As duas cobrem o Brasil.
- **AppEEARS** (https://appeears.earthdatacloud.nasa.gov) recorta SMAP, MODIS, Landsat e ECOSTRESS para um ponto ou área e devolve CSV, o que evita baixar arquivos enormes.
