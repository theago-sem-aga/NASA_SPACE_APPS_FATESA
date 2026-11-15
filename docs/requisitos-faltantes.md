# Requisitos faltantes — lista simples

> Base: texto oficial do desafio "Field Shift". Atualizado em 15/11/2026.

## Implementado (real, não é mock)

- Geada (risco de geada, NASA POWER) — qualquer coordenada do mundo
- Precipitação extrema (percentil 95 da chuva diária do mês) — qualquer coordenada
- Tendência hídrica de longo prazo (Mann-Kendall + inclinação de Sen, chuva anual) — qualquer coordenada
- Estresse vegetal (NDVI do MODIS pela API do ORNL, sem HDF4, vs. o normal da mesma época) — só onde a série já foi baixada (SJRP e Fresno): a série longa leva de minutos a horas no ORNL
- GRACE/GRACE-FO (armazenamento de água) — só nos pontos já ingeridos (Fresno, SJRP)
- Textura do solo (USDA nos EUA, SoilGrids no Brasil) — conectada no relatório
- SMAP, GPM, SRTM, ECOSTRESS, Landsat — indexados, só nos pontos piloto (Fresno, SJRP)
- NASA POWER, USDA Soil Data Access, OpenET — ao vivo, em qualquer coordenada dentro da cobertura de cada um
- Busca de município e localização por coordenada — qualquer lugar do Brasil (base real do IBGE)
- `POST /analises` funciona em qualquer coordenada e cultura (o gate de Fresno/milho foi removido)
- Prioridades do agricultor (uso de água, forragem, nitrogênio, erosão, matéria orgânica, mercado)
- Harmonização de fontes numa grade comum (célula de 0,1°)
- Avisos de simulação, confiança, lacunas e pergunta ao especialista em toda resposta

## Faltante

- Estresse térmico — a variável existe, falta calcular o índice
- Um único motor de decisão — hoje são dois, desconectados:
  - motor beta genérico (no ar, mas sempre o mesmo texto simulado)
  - catálogo real do ZARC do Matheus (mais rigoroso, mas só gera mock pro front, nunca foi chamado pelo backend)
- Catálogo do ZARC revisado por agrônomo (atributos ainda não conferidos)
- Janelas de campo vazio reais (hoje só no calendário simulado)
- Vulnerabilidade sazonal da cultura atual — não calculado
- Quebra de ciclo de pragas calculada (hoje é fixo ou atribuído manualmente)
- Redução de demanda de água calculada (hoje é rótulo estático)
- Melhoria de infiltração — não modelado
- Renda suplementar ligada ao NASS QuickStats (fonte implementada, não conectada)
- Glossário com os termos científicos que o desafio pede (evapotranspiração, anomalia de umidade, NDVI, geada, balanço hídrico)
- Comparação de abordagens de modelagem (só existe regressão linear, com resultado nulo — R² ≈ 0 — e não está em uso)
- Mapas interativos, visualização por campo, linha do tempo/slider — explicitamente adiados
- Busca de local nos EUA (município/condado) — só o Brasil tem isso hoje; GPS e coordenada digitada funcionam em qualquer lugar, mas sem nome de cidade
