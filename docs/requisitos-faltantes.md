# Requisitos faltantes — comparação com o descritivo oficial do desafio

> Base: texto oficial do desafio "Field Shift: Adapting Farms with NASA Data" (colado pelo Tiago em 14/11/2026). Cada item diz se é citado como **obrigatório** (objetivo principal do desafio) ou **opcional** ("Considerações Potenciais" — "você pode, mas não é obrigado"), e o estado real no código hoje (não no que foi planejado).

## 1. Fontes de dados citadas no desafio

| Fonte | O que ela traz | Estado real |
|---|---|---|
| SMAP | Umidade do solo (superfície e, no produto L4, zona de raízes) e estado de congelamento, global, a cada 2–3 dias | ✅ Indexada (cobertura esparsa — nem toda célula tem dado) |
| ECOSTRESS | Temperatura da superfície (LST) e evapotranspiração, alta resolução (~70 m), medida pela ISS | ✅ Indexada — hoje só a LST é extraída; a evapotranspiração do próprio ECOSTRESS não é usada (usamos OpenET pra isso) |
| GPM | Precipitação (taxa e acumulado), global, ~10 km, a cada 30 min | ✅ Indexada |
| Landsat | Reflectância, NDVI, índices de vegetação, solo exposto, 30 m | ✅ Indexado (via HLS), só o NDVI é calculado — não a reflectância completa por banda |
| MODIS | Reflectância/NDVI diário, 250 m–1 km, mesma finalidade do Landsat com revisita maior | ⚠️ **Retomado via API (2026-11-15)** — o arquivo HDF4 segue ilegível no nosso GDAL, mas a API REST do ORNL DAAC devolve o NDVI do pixel em JSON, sem login (`app/integrations/modis_ornl.py`, MOD13Q1 250 m/16 dias, 2000–hoje, em blocos de 10 datas concatenados; cache incremental em `pipelines/ingestao_modis_ndvi.py`). Falta a anomalia (estresse vegetal) |
| NASA POWER | Clima agrícola por ponto (temperatura, umidade, radiação, precipitação), série histórica de décadas, sem login | ✅ Ao vivo (consulta recente) e também histórico mensal (1991–2020) |
| **GRACE / GRACE-FO** | Variação do armazenamento total de água (inclui água subterrânea), por medição de gravidade, resolução grossa (~300 km), mensal | ✅ **Implementado (15/11).** Mascons do JPL via PO.DAAC: série mensal completa da missão (abril/2002–presente, 261 meses) baixada numa chamada, fator de escala do filtro CRI aplicado, indexada por célula de 0,1° (fan-out: um pixel nativo de 0,5° cobre ~25 das nossas células — limitação real, documentada no pipeline, não dá mais detalhe espacial que isso). Variável `armazenamento_agua_anomalia_cm` |
| SRTM | Elevação do terreno, 30 m, levantamento único (1999, não muda com o tempo) | ✅ Indexado |

## 2. Análises sugeridas pelo desafio

Pra cada análise que o desafio sugere, a tabela mostra qual variável deveria representá-la e de qual(is) fonte(s) ela deveria vir — e se isso já está sendo calculado de verdade.

| Análise | Variável(is) que a representam | Fonte(s) que deveriam alimentar | Estado real |
|---|---|---|---|
| Padrões de temperatura | `temperatura_media_c`, `temperatura_maxima_c`, `temperatura_minima_c`, `temperatura_superficie_media_c` | NASA POWER (ponto, ao vivo) + ECOSTRESS (superfície, indexado) | ✅ As duas variáveis existem e vêm das fontes certas |
| Estresse térmico | Seria uma comparação de `temperatura_maxima_c`/`temperatura_superficie_media_c` contra um limiar por cultura (ex.: acima de X°C na fase sensível) | NASA POWER + ECOSTRESS | ⚠️ As variáveis de entrada existem; o cálculo do índice de estresse não existe em lugar nenhum |
| Precipitação | `precipitacao_acumulada_mm` | NASA POWER (ao vivo) + GPM (indexado) | ✅ Existe das duas fontes |
| Umidade do solo | `umidade_solo_cm3_cm3` | SMAP (indexado) | ✅ Existe, mas cobertura esparsa (poucas células com dado válido) |
| Evaporação/evapotranspiração | `evapotranspiracao_mm` | OpenET (ao vivo) — ECOSTRESS também mede isso, mas não extraímos essa variável dele | ✅ Existe via OpenET, só nos EUA (cobertura da fonte) |
| **Risco de geada** | Frequência mensal de noites com `temperatura_minima_c` <= 2 °C (ar a 2 m; geada forte <= 0 °C) nos anos completos da série | NASA POWER (cache local diário ou ao vivo) | ✅ `app/domain/geada.py` + `services/geada.py`; vai em `talhao.risco_geada` e `Analise.geada`, exibido no painel "Sua terra, pelos mapas" e no resumo. Cada probabilidade traz faixa de incerteza (Wilson 90%, pelo número de anos) e `nivel_min`/`nivel_max`. Limiar 2 °C e cortes 10%/33% **pendentes de fonte** |
| **Precipitação extrema** | `dias_chuva_extrema_30d`, `limiar_chuva_extrema_mm_dia` | NASA POWER (cache diário local ou ao vivo) | ✅ **Implementado (15/11).** `app/modelos/precipitacao_extrema.py`: limiar = percentil 95 da chuva diária do mesmo mês sobre todo o histórico real; conta quantos dos últimos 30 dias passaram dele. `services/precipitacao_extrema.py` é multi-regional — usa o cache local se existir, senão busca ao vivo só o recorte necessário, funciona em qualquer coordenada |
| **Estresse vegetal** | Seria uma anomalia de `ndvi_medio` em relação à média esperada pra época do ano | Landsat (via HLS) | ❌ Temos o valor pontual de NDVI; nenhuma classificação de anomalia/estresse |
| **Tendências hídricas de longo prazo** | Chuva anual (`precipitacao_acumulada_mm` somada por ano completo) | NASA POWER (cache diário local ou ao vivo) | ✅ `app/domain/tendencia_hidrica.py` (Mann-Kendall 5% + inclinação de Sen) + `services/tendencia_hidrica.py`; vai em `Analise.tendencia_hidrica` e no painel "Sua terra, pelos mapas" com gráfico de barras e reta. SJRP: −174 mm/década (p < 0,001); Fresno: sem tendência (p = 0,89). Umidade do solo (SMAP/GPM) ainda sem série |

## 3. Informação local a combinar

### Solo
Citada no desafio. ✅ Resolvido: USDA Soil Data Access (EUA, ao vivo) e SoilGrids (Brasil, indexado) trazem textura, matéria orgânica e propriedades físicas por coordenada. **Atualização (15/11):** essa textura agora está de fato conectada ao relatório — antes o dado existia mas nenhuma função o usava, `talhao.textura_solo` ficava sempre `null` (ou o valor fixo do mock). `app/domain/solo.py` classifica em 3 faixas (areia/argila), `app/services/solo.py` tenta USDA e, se não cobrir o ponto, cai pra SoilGrids — nunca inventa valor, nunca sobrescreve correção do produtor.

### Prioridades do agricultor
Citada no desafio (uso de água, valor de forragem, fixação de nitrogênio, redução de erosão, matéria orgânica, adequação ao mercado). ✅ Resolvido: modelado como enum `prioridades` nos dois motores de decisão que existem hoje.

### Características da cultura — o problema real, territorial

Aqui está o ponto que o Tiago levantou e que merece destaque: **rotação de cultura não é um conceito transportável entre territórios**. "Cana-de-açúcar, feijão e abóbora" é uma combinação que faz sentido em São José do Rio Preto e não significa nada em Fresno — o catálogo que o Matheus construiu (`catalogo_reforma_cana.json`) é especificamente sobre reforma de canavial, não generaliza pra outro lugar.

**A pergunta que importa: dá pra definir isso a partir dos dados que já recebemos do banco e das APIs?**

Resposta: **parcialmente, e hoje só pro Brasil.** Existem dois tipos de dado real que, juntos, respondem "quais culturas fazem sentido num território" sem precisar de um catálogo escrito à mão pra cada lugar:

1. **O que já se planta ali, de fato (histórico observado).** No Brasil, o **MapBiomas** (já integrado pelo Matheus) mostra o uso real da terra ano a ano, incluindo culturas. Nos EUA, o equivalente seria o **Cropland Data Layer/CropScape** — que já testamos, funciona (foi o que revelou que o ponto piloto de Fresno é um pomar de amêndoa), mas foi descartado do projeto por decisão anterior.
2. **O que é climaticamente viável ali, segundo um órgão oficial (aptidão agroclimática).** No Brasil, o **ZARC** (zoneamento do governo, já integrado no motor do Matheus) diz quais culturas podem ser plantadas, em qual janela, com qual risco, por município. Não existe um ZARC fora do Brasil, mas a **FAO GAEZ** (citada em `docs/fontes-dados.md`, nunca implementada) faz o mesmo papel de forma global — inclusive pros EUA.

**Conclusão prática:** pro Brasil, já temos as duas pontas (histórico real + viabilidade oficial) conectadas num motor de decisão. Pros EUA, não temos nenhuma das duas ativas hoje — o motor da Califórnia não sabe, de nenhum dado real, o que pode ser plantado em Fresno; ele só lida com o que o agricultor digita em texto livre. As variáveis de clima/solo que já coletamos (temperatura, chuva, umidade, NDVI, elevação) descrevem **condições**, não dizem **qual cultura** — essa segunda parte depende de uma fonte de identidade de cultura (CDL/MapBiomas) ou de aptidão (ZARC/GAEZ), que é um tipo de dado diferente do que coletamos até agora.

## 4. O que a ferramenta deveria destacar

**Janelas de campo vazio** — período do ano em que o campo fica sem nenhuma cobertura vegetal entre uma cultura e a próxima. Importa porque solo exposto erode mais fácil com chuva direta e perde mais água por evaporação; identificar quando isso acontece ajuda a decidir se vale colocar uma cultura de cobertura nesse intervalo.
Estado real: ⚠️ só existe no calendário **simulado** do motor da Califórnia — não deriva de nenhum dado real de plantio, é um exemplo fixo no código.

**Estações de maior vulnerabilidade da cultura atual** — em quais meses a cultura já plantada corre mais risco (ex.: fase de maior demanda de água coincidindo com seca histórica, ou pico de calor coincidindo com floração). Ajuda o agricultor a saber onde prestar atenção.
Estado real: ❌ não calculado — nenhuma pontuação de vulnerabilidade sazonal existe hoje.

**Rotações que interrompem ciclo de pragas** — pragas e doenças de solo tendem a se acumular quando a mesma cultura (ou família de culturas) se repete no mesmo campo ano após ano; alternar pra uma cultura de família diferente quebra esse ciclo biológico.
Estado real: ⚠️ existe o campo `quebra_pragas` nos dois motores, mas é **zero fixo** no da Califórnia e **atribuído manualmente** (não calculado) no catálogo do Brasil.

**Redução de demanda de água** — algumas opções de rotação consomem menos água que a cultura principal ou que deixar o campo descoberto; relevante em região com estresse hídrico.
Estado real: ⚠️ existe como atributo (`demanda_agua`) nos dois motores, mas é um rótulo estático — não é calculado a partir da umidade do solo (SMAP) ou evapotranspiração (OpenET) reais que já coletamos.

**Melhoria de infiltração** — cobertura vegetal e sistemas de raiz ajudam a água da chuva penetrar no solo em vez de escoar pela superfície, o que reduz erosão e aumenta a água disponível.
Estado real: ❌ não modelado em lugar nenhum.

**Renda suplementar** — algumas opções de rotação podem gerar receita extra no intervalo entre safras da cultura principal, em vez do campo ficar sem retorno financeiro nesse período.
Estado real: ⚠️ existe o atributo `renda_direta`, mas não usa os dados reais de mercado/produção que já temos implementados (USDA NASS QuickStats) — eles não estão conectados a esse cálculo.

**≥3 estratégias de rotação incluindo a atual, cada uma com motivo, evidência, benefício, lacuna e risco** — pra cada opção sugerida: por que foi sugerida, que dado apoia a sugestão, que benefício ela traz, o que ainda não se sabe sobre ela, e que risco exigiria revisão de um especialista ou do próprio agricultor antes de decidir.
Estado real: ✅ Esse é o entregável central do desafio, e a estrutura (schema) existe nos dois motores — todos esses campos aparecem na resposta. A ressalva fica no **conteúdo**, não na forma: ver seção 6 sobre a veracidade do que preenche esses campos hoje.

**A ferramenta é apoio, não substitui o julgamento do agricultor/especialista** — a recomendação é um ponto de partida pra conversa com quem conhece a terra, nunca uma decisão automática pra seguir sem revisão humana.
Estado real: ✅ bem resolvido — `confianca`, `lacunas`, `pergunta_especialista` e avisos de simulação aparecem em toda resposta.

## 5. Considerações potenciais (explicitamente opcionais no desafio)

| Consideração | Estado real |
|---|---|
| Explicar termos científicos (evapotranspiração, anomalia de umidade, NDVI, geada, balanço hídrico) | ⚠️ Existe glossário (`accessibility/glossario.ts`), mas cobre termos agronômicos/de cana — **não cobre nenhum desses termos científicos específicos** citados pelo desafio |
| Diferenciar observação de satélite x medição em estação | ✅ Feito — entrada `satelite_estacao` no glossário |
| Comparar abordagens de modelagem/estatística | ❌ Existe só uma abordagem (regressão linear), e nem está conectada a nada ao vivo |
| **Harmonizar fontes de resoluções diferentes numa grade comum** | ✅ **Já feito** — é exatamente o que a grade de 0,1° do índice espacial faz (SMAP, GPM, Landsat, ECOSTRESS agregados na mesma célula) |
| Mapear rotação x prioridade do agricultor | ✅ Feito — é o mecanismo central dos dois motores de pontuação |
| Explicar como leguminosa/cobertura/raiz profunda/tolerante a seca ajuda o solo | ⚠️ Parcial — só como texto estático pra algumas culturas do catálogo de cana, não é um conceito geral |
| Mapas interativos (tendência de umidade, ondas de calor, queda de água) | ❌ Explicitamente adiado (ver `docs/convencao_programacao.md`, seção "Planejado para evoluções") |
| Visualização de vulnerabilidade por campo (zonas de erosão, pontos de estresse hídrico, risco de geada) | ❌ Não implementado |
| Linhas do tempo, sobreposições, sliders de cenário | ❌ Não implementado |
| Design centrado no agricultor (interpretável, baixa familiaridade técnica) | ✅ Bem resolvido — telas em linguagem simples, pictogramas, narração, roteiros, entrada de prioridades/restrições do próprio agricultor |

## 6. A pergunta mais importante: de onde vêm os "diagnósticos" e qual a veracidade

Hoje existem **três sistemas de recomendação desconectados entre si**, em níveis de rigor bem diferentes:

1. **Motor genérico/beta** (`web/Backend/app/domain/motor.py`, Ghabriel) — o único **conectado ao endpoint real** (`POST /api/v1/analises`). Gera **3 cenários com texto fixo** ("referência", "gramínea", "leguminosa"); a única coisa que varia por usuário é a ordem (contagem de prioridades que coincidem com uma lista fixa por cenário — sem peso científico). Calendário, níveis de atributo e textos de motivo/benefício/risco são **todos estáticos**, escritos no código. **Atualização (15/11):** o gate geográfico (só caixa de Fresno) e de cultura (só milho) foi removido do endpoint — o motor roda pra qualquer coordenada e cultura agora, inclusive Brasil. Isso **não mudou o rigor do conteúdo**: continua o mesmo cenário genérico simulado, só deixou de estar artificialmente restrito a um ponto. Liga com `HABILITAR_CENARIOS_BETA=true`; o próprio código já rotula `eh_mock=true` e diz textualmente "não são recomendações validadas".

2. **Motor de São José do Rio Preto** (`web/Backend/app/modelos/motor_decisao.py`, Matheus) — **nunca chamado pelo backend real**. Roda só como script offline que gera uma tabela estática (`estrategiasMotor.ts`) que o **frontend consulta direto, sem servidor**. É tecnicamente mais rigoroso: usa um catálogo curado de práticas reais (pousio, amendoim, crotalária etc.) e filtra pelo **ZARC** (zoneamento agroclimático oficial do governo brasileiro) — isso é dado real e oficial, não simulado. Mas o próprio código avisa: os **níveis de atributo do catálogo ainda não foram conferidos com um técnico/agrônomo**. O comentário do próprio Matheus no código diz literalmente: *"quando existir POST /api/v1/analises, ele deve chamar motor_decisao.sugerir"* — ou seja, mesmo o autor sabia que isso devia estar no backend e não está.

3. **Painel "Sua colheita"** (`web/Backend/app/modelos/painel_producao.py`) — o mais bem fundamentado em dado real: compara rendimento do IBGE (PAM) ano a ano, clima real da NASA POWER, e usa previsão **oficial** do INMET/INPE/FUNCEME (não é previsão própria). Mas também não é uma rota viva — é um script que gera um arquivo estático pro front.

**Achado extra, honesto e não usado em nada:** existe um modelo de regressão real (`produtividade_clima.py`) que tentou prever variação de rendimento a partir de clima, com validação estatística correta (separação por ano, bootstrap). Resultado registrado pelo próprio autor: **R² ≈ 0 — não serve como previsor**, só dois efeitos específicos (amendoim x calor, milho x seca) se sustentam estatisticamente. Esse resultado não alimenta nenhum diagnóstico hoje.

**Resumindo a veracidade:** nenhuma recomendação de rotação mostrada ao agricultor hoje é uma conclusão científica validada. A Califórnia é simulação de teste de integração (e está desligada). O Brasil tem uma base real (ZARC) mas atributos ainda não conferidos por especialista, e roda fora do backend. Este levantamento é baseado em leitura direta do código (`domain/motor.py`, `modelos/motor_decisao.py`, `modelos/produtividade_clima.py`, `services/analises.py`), cruzado com o texto oficial do desafio.

## 7. Prioridade sugerida (não é decisão, é proposta)

1. Decidir **um único motor de decisão** chamado pelo backend (hoje são dois, desconectados) — provavelmente o do Matheus, por ter o filtro ZARC real, generalizado além da cana. **Ainda não feito.**
2. Fazer os atributos do catálogo serem conferidos por alguém com conhecimento agronômico, ou rotular explicitamente "estimativa não validada" em cada atributo. **Ainda não feito.**
3. ~~Avaliar se dá tempo de implementar GRACE/GRACE-FO~~ ✅ **feito (15/11)** — ver seção 1.
4. ~~Decidir se vale calcular ao menos um indicador real por análise faltante~~ ✅ **feito** — risco de geada (seção 2) e precipitação extrema (15/11, seção 2) calculados a partir de dado real, sem fonte nova.
5. Revisar o glossário pra cobrir os termos científicos que o próprio desafio pede pra explicar (evapotranspiração, anomalia de umidade, NDVI, geada, balanço hídrico). **Ainda não feito.**
