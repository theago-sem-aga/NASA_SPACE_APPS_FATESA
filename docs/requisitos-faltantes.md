# Requisitos faltantes — lista simples

> Base: texto oficial do desafio "Field Shift". Atualizado em 15/11/2026.

## Implementado (real, não é mock)

- Geada (risco de geada, NASA POWER) — qualquer coordenada do mundo
- Precipitação extrema (percentil 95 da chuva diária do mês) — qualquer coordenada
- Tendência hídrica de longo prazo (Mann-Kendall + inclinação de Sen, chuva anual) — qualquer coordenada
- Estresse vegetal (NDVI do MODIS pela API do ORNL, sem HDF4, vs. o normal da mesma época) — só onde a série já foi baixada (SJRP e Fresno): a série longa levou de 8 a 20 min por ponto no ORNL (medido em 15/11/2026). Os pontos baixados são lavoura (confirmado pelo Thiago). Faixas do NDVI, limiar de 0,2 e causas de queda seguem o artigo da EOSDA sobre NDVI; os cortes 10/25/90% seguem sem fonte agronômica
- GRACE/GRACE-FO (armazenamento de água) — qualquer coordenada do mundo (lê o pixel direto do arquivo global da NASA, não só nos pontos piloto)
- Risco de seca (90 dias de chuva vs. média histórica do mesmo período, NASA POWER) — qualquer coordenada
- Declividade/relevo real (5 pontos via USGS 3DEP) — só EUA (cobertura do USGS). Fora dos EUA o campo fica vazio (sem dado) a menos que o produtor digite o relevo manualmente — por decisão de projeto, não por falta de implementação: o SRTM indexado tem célula de 0,1° (~11 km), grande demais pra representar a declividade real de um talhão, então não é usado como substituto. Confirmado vazio em SJRP e Olímpia (SP)
- Textura do solo (USDA nos EUA, SoilGrids no Brasil) — conectada no relatório
- SMAP, GPM, ECOSTRESS, Landsat — indexados, só nos pontos piloto (Fresno, SJRP)
- NASA POWER, USDA Soil Data Access, OpenET — ao vivo, em qualquer coordenada dentro da cobertura de cada um
- Busca de município e localização por coordenada — qualquer lugar do Brasil (base real do IBGE)
- `POST /analises` funciona em qualquer coordenada e cultura (o gate de Fresno/milho foi removido)
- Painel de colheita dos EUA (geocodificação do Census + NASS QuickStats) e do Brasil (IBGE/SIDRA, qualquer município) — `GET /producao`
- Catálogo real do ZARC do Matheus conectado no backend para cana-de-açúcar (`estado_recomendacoes=catalogo_real`); as demais culturas seguem no motor beta genérico simulado
- Prioridades do agricultor (uso de água, forragem, nitrogênio, erosão, matéria orgânica, mercado)
- Harmonização de fontes numa grade comum (célula de 0,1°)
- Avisos de simulação, confiança, lacunas e pergunta ao especialista em toda resposta

## Faltante

> Ordenado do mais fácil pro mais difícil de implementar (pra quem for pegar tarefa rápida, comece de cima).

- Glossário com os termos científicos que o desafio pede (evapotranspiração, anomalia de umidade, NDVI, geada, balanço hídrico) — só texto, sem fonte de dado nova nem backend
- Estresse térmico — a variável já existe, falta só calcular o índice (parecido com o que já foi feito pro risco de seca)
- Busca de local nos EUA por nome (digitar cidade/condado) — a tela de localização só busca por nome no Brasil hoje; nos EUA é só GPS ou coordenada digitada. O painel de colheita (`GET /producao`) já geocodifica a coordenada pro condado via Census, mas isso é depois de o usuário já ter um ponto. Dá pra seguir o mesmo padrão da base de municípios do Brasil (IBGE), só que com a lista de condados dos EUA (Census)
- Conversão do rendimento dos EUA (NASS, em BU/ACRE, LB/ACRE etc.) pra kg/ha — deixado de lado por variar o peso do bushel por cultura; só é seguro de fazer achando uma tabela oficial (USDA/NIST) de peso padrão do bushel por cultura, senão é inventar dado
- Vulnerabilidade sazonal da cultura atual — não calculado; precisa decidir a fórmula/janela antes de codar
- Redução de demanda de água calculada (hoje é rótulo estático) — precisa de uma referência real de consumo de água por cultura de cobertura; risco de inventar número sem fonte
- Janelas de campo vazio reais (hoje só no calendário simulado) — precisa de um calendário agrícola real por região (tipo CONAB ou USDA), não só a data
- Quebra de ciclo de pragas e renda direta calculadas para as culturas fora do catálogo real (hoje é fixo ou atribuído manualmente no motor beta) — exigiria montar um catálogo curado tipo o do Matheus pra cada cultura/região, trabalho grande de levantamento de dado
- Melhoria de infiltração — não modelado; precisa de um modelo científico e ainda não tem fonte confiável escolhida
- Erosão (RUSLE) — deixado de lado por não ter fonte confiável pro fator K do solo sem arriscar inventar dado
- Comparação de abordagens de modelagem (só existe regressão linear, com resultado nulo — R² ≈ 0 — e não está em uso) — exigiria treinar/validar outro(s) modelo(s) do zero
- Um único motor de decisão — hoje são dois:
  - motor beta genérico (todas as culturas exceto cana-de-açúcar; texto simulado)
  - catálogo real do ZARC do Matheus (só cana-de-açúcar; mais rigoroso, mas ainda não cobre as outras culturas)
  - unificar exigiria o catálogo real cobrir toda cultura/região, não é só código
- Catálogo do ZARC revisado por agrônomo (atributos ainda não conferidos) — não é tarefa de código, depende de revisão humana de um agrônomo
- Mapas interativos, visualização por campo, linha do tempo/slider — explicitamente adiados; feature grande de GIS/frontend, maior esforço da lista
