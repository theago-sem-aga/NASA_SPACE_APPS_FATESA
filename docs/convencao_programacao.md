# Convenção de Programação e Arquitetura — Field Shift (NASA Space Apps 2026)

> **Versão:** 1.0 — 14/11/2026  
> **Status:** documento de referência compartilhado entre Ghabriel, Julya, Codex e Claude.  
> **Regra principal:** este documento é a fonte de verdade das decisões **já combinadas**. O que estiver marcado como *proposta* ou *futuro* **não está aprovado nem implementado**.  
> **Idioma do produto:** português do Brasil (`pt-BR`), com possibilidade futura de internacionalização.

## 0. Instruções obrigatórias para agentes de IA

1. **Leia este arquivo inteiro antes de criar, alterar ou refatorar código.** Consulte também o código e a documentação já existentes; **não presuma que o repositório está vazio**.
2. Respeite contratos, nomes e responsabilidades. **Nunca invente um campo diferente para representar a mesma informação.** Se a API expõe `umidade_solo`, o frontend consome `umidade_solo`, e não `umidadeSolo`, `aguaseca` ou `agua_seca` sem mapeamento formal aprovado.
3. Se faltarem definições (região, culturas, fontes já integradas, regras agronômicas), registre a pendência. **Não preencha lacunas com suposições silenciosas.** Para protótipos, dados fictícios devem estar rotulados como `mock` e não podem aparecer como observações reais.
4. Antes de alterar um contrato público, atualize a especificação em `docs/contrato_api.md` e a definição em `docs/dicionario_dados.md`, comunicando a quebra de compatibilidade aos dois responsáveis. Não altere o contrato unilateralmente.
5. **Não implemente automaticamente itens FUTUROS.** Prepare limites de arquitetura para a evolução, mas priorize um MVP web funcional e demonstrável.
6. Mudanças em arquivos da outra frente devem ser coordenadas. Não sobrescreva trabalho existente; não faça `git push --force`, não apague datasets e não instale serviços sem necessidade.
7. Ao concluir uma tarefa, informe: arquivos alterados, decisões tomadas, endpoints/campos afetados, testes executados e pendências reais. Nunca declare testes ou integrações como realizados sem executá-los.

## 1. Contexto, pessoas e objetivo

### Evento e desafio

- **Evento:** NASA International Space Apps Challenge 2026, 14 e 15 de novembro de 2026.
- **Desafio escolhido:** **Field Shift: Adapting Farms with NASA Data**.
- **Página oficial:** https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/
- **Objetivo oficial (síntese):** criar uma ferramenta de **apoio à decisão sobre rotação de culturas**, combinando observações da Terra da NASA com características locais do solo, características de culturas e prioridades do produtor. O foco é explorar estratégias que possam favorecer saúde do solo, conservação de água e adaptação a condições climáticas variáveis.
- **Não é:** um sistema de previsões infalíveis, substituto de agrônomo ou ferramenta que garanta produtividade, lucratividade ou segurança agrícola.

### Responsáveis

| Pessoa | Principal responsabilidade | Ferramenta de IA de apoio |
|---|---|---|
| **Ghabriel** | Backend, API, integração/modelagem de dados e coordenação dos contratos; também define princípios de experiência do usuário em conjunto com Julya | **Codex** |
| **Julya** | Implementação do frontend, componentes, responsividade, acessibilidade e integração com a API; decisões visuais/fluxos em conjunto com Ghabriel | **Claude** |
| **Thiago** | Implementação do frontend, junto com Julya | **Claude** |
| **Tiago** | Protótipo de ingestão e indexação espacial dos dados de satélite (recorte por região, lookup por coordenada) em `web/Backend`; coordenado com Ghabriel para não conflitar com o contrato de API | **Claude** |

Outros integrantes e atribuições podem existir; **não assumir nomes, papéis ou aprovações não informados**. Codex e Claude são assistentes de desenvolvimento, não responsáveis humanos finais.

### Público-alvo e filosofia do produto

O usuário final primário é o **produtor rural** que precisa compreender opções de rotação de culturas e riscos relacionados ao clima, à água e ao solo. Agrônomos e consultores são **usuários secundários possíveis**, não uma obrigação do enunciado. **Ainda não existe uma região ou uma lista definitiva de culturas definida pela equipe.**

Princípios de UX:
- Um agricultor com pouca familiaridade digital deve conseguir seguir o fluxo sem aprender jargões de geoprocessamento.
- Perguntas curtas, linguagem comum, valores e unidades explícitos; oferecer mais detalhes apenas quando necessário.
- Explicações claras sobre *por que* o sistema pede um dado e *de onde* vem uma conclusão.
- Toda função importante deve poder ser utilizada sem depender exclusivamente de áudio, cor ou mapa.
- Respostas científicas devem comunicar cobertura, incertezas, limitações e dados ausentes.

## 2. Decisões de tecnologia (aprovadas como direção técnica; verificar o repositório antes de migrar)

| Camada | Direção adotada | Por quê |
|---|---|---|
| **Frontend web** | **React + TypeScript + Vite** | Interface responsiva, componentes reutilizáveis, facilidade de integrar com contratos tipados e evolução mobile/desktop. |
| **Backend/API** | **Python + FastAPI** | Serviços HTTP claros, tipagem/validação via Pydantic, OpenAPI automático e bom ecossistema científico NASA. |
| **Banco central web** | **PostgreSQL** | Relacionamentos, consistência, consultas e armazenamento das informações estruturadas do produto. |
| **Geoespacial** | **PostGIS, quando exigido por dados geográficos reais** | Geometrias e consultas espaciais; **não pressupor polígonos nem mapas já definidos**. |
| **Processamento científico** | **Python** e bibliotecas somente quando necessárias | Integração, limpeza, agregação e análise de dados NASA e agrícolas. |
| **Arquivos brutos/pesados** | Arquivos versionados/catalogados fora das tabelas transacionais | NetCDF/HDF/GeoTIFF/Parquet/imagens podem ser enormes: armazenar arquivos e referências, não simplesmente tudo como BLOB no PostgreSQL. |
| **Contrato entre agentes** | **OpenAPI/JSON + documentos Markdown** | A API é a fronteira comum entre Codex e Claude, sem renomear campos de improviso. |

**Não são requisitos:** PHP, MCP, microserviços, Kubernetes, filas, processamento distribuído, DuckDB, mapa ou IA generativa. Eles só entram se houver uma necessidade comprovada e aprovação humana.

**Observação:** PostgreSQL é o banco do servidor web; **não** significa que uma versão desktop offline dependerá de um servidor PostgreSQL na fazenda.

## 3. Visão de arquitetura e fronteiras

```text
                       USUÁRIO / AGRICULTOR
                                |
                                v
                  [ Frontend React + TypeScript ]
              formulário guiado, acessibilidade e resultados
                                |
                        HTTPS / JSON
                                v
                       [ API FastAPI ]
             validação, autorização, serviços, contratos
                                |
              +-----------------+------------------+
              |                 |                  |
              v                 v                  v
      [Motor de decisões] [Repositórios] [Catálogo/proveniência]
      Python puro,      PostgreSQL      fontes, unidades, datas,
      testável          (PostGIS         qualidade, cobertura
                        se necessário)
              ^
              |
      [Dados já processados e padronizados]
              ^
              |
       [Pipelines de ingestão científica]
              ^
              |
       [APIs, portais e arquivos externos]
           NASA e fontes complementares
```

### Responsabilidades sem ambiguidade

- **Frontend:** coletar entradas, apresentar resultados, explicar termos, gerenciar estado visual, interação e acessibilidade. **Não** executa SQL, não implementa regras agronômicas críticas duplicadas e não consulta fontes NASA diretamente em componentes de tela.
- **API:** validar entrada, orquestrar caso de uso, chamar motor de decisão e repositórios, devolver respostas estruturadas, erros claros e metadados. **Não** contém regras de interface.
- **Motor de decisão:** funções/serviços independentes da interface e, preferencialmente, de um banco específico; recebe dados padronizados e produz alternativas, justificativas, restrições e grau de confiabilidade. **Não** inventa recomendações.
- **Pipelines:** buscar/ler fontes, validar amostras, converter unidades/CRS/tempos, marcar ausências, persistir dados tratados e preservar o histórico da origem.
- **Banco:** armazenar dados estruturados do produto. Dados científicos grandes devem ser agregados, particionados ou mantidos em arquivos, conforme necessidade real.

**Regra de projeto:** não consultar dezenas de sites externos em tempo real a cada interação do agricultor; preferir datasets previamente ingeridos, agregados e cacheados, com data de referência visível.

## 4. Escopo por fase — NÃO confundir desejo com entrega

### MVP WEB — prioridade atual

1. Um fluxo navegável e responsivo para coletar os dados mínimos que a equipe conseguir fundamentar.
2. Contratos de API documentados; integração real entre frontend/backend, mesmo que inicialmente exista um conjunto pequeno e verificável de dados.
3. Catálogo de fontes e rastreabilidade de qualquer número mostrado como real.
4. Apresentação compreensível de cenários de rotação de culturas **somente quando existirem regras e dados suficientes**; caso contrário, deixar claro o limite do demonstrador.
5. Estados de carregamento, ausência de dados, erro, sucesso e dados insuficientes.
6. Apoio ao usuário com textos explicativos e navegação por teclado. Ajuda contextual e narração podem entrar se não ameaçarem o fluxo principal.

### Planejado para evoluções (NÃO implementar agora sem solicitação)

- **Mapas interativos:** seleção por mapa, marcadores, polígonos de talhões, camadas geoespaciais; possível React Leaflet/MapLibre. **Regiões e área geográfica NÃO foram definidas.** Hoje, aceitar uma localização abstrata/validada pelo backend; nunca inventar mapas, cobertura ou latitudes fixas como padrão do produto.
- **Ajuda contextual (F2):** explicação do campo focado e botão `?` acessível no mobile; não depender somente de teclas de função.
- **Narração em áudio:** recurso opt-in “Ouvir esta tela”, texto escrito para narração, síntese de voz por dispositivo quando suportada, controles de pausar/repetir/velocidade. A Web Speech API pode ser utilizada, **mas voz offline não é garantida**. **Não capturar microfone** apenas para ler telas. Não usar F5 como atalho porque normalmente atualiza páginas.
- **Web offline parcial/PWA:** cache seletivo de interface e dados previamente autorizados, indicação de desatualização; não prometer execução de APIs remotas sem internet.
- **Desktop offline:** interface reutilizada via Tauri (direção sugerida), execução do motor Python local por sidecar/serviço local, banco SQLite local, pacotes de dados regionais com metadados. Deve operar sem conexão após instalação e carga do pacote; sincronização é outro projeto.
- **Android:** reaproveitamento da interface por Capacitor (direção sugerida); para offline completo, prever armazenamento e um motor local adaptado. Python/FastAPI **não são automaticamente portáveis** ao Android.
- **Internacionalização:** manter textos de interface centralizados; idioma inicial pt-BR.

### Requisitos de arquitetura para não bloquear as evoluções

- Isolar acesso ao banco em repositórios; evitar SQL/PostGIS em regras de negócio.
- Encapsular proveniência, consulta de dados e algoritmo atrás de interfaces/serviços.
- Não acoplar a captura de localização a um mapa: permitir entrada por endereço/coordenadas se apropriado e disponível.
- Não acoplar a narração a uma API externa paga; manter conteúdo textual acessível.
- Separar dados de configuração geográfica do código-fonte. Região, culturas e formatos disponíveis serão definidas depois de inspeção das fontes.

## 5. Convenções obrigatórias de código, nomenclatura e unidades

### Nomes

| Contexto | Convenção | Exemplo |
|---|---|---|
| Campos JSON da API | `snake_case`, sem acento, **estável** | `umidade_solo`, `cultura_atual_id` |
| Tabelas/colunas/índices SQL | `snake_case`, sem acento | `fontes_dados`, `data_observacao` |
| Variáveis/funções/módulos Python | `snake_case` | `calcular_indicadores()` |
| Classes Python | `PascalCase` | `AnaliseEntrada` |
| Propriedades dos DTOs TypeScript que espelham JSON | **exatamente `snake_case`**, sem tradução automática | `resultado.umidade_solo` |
| Variáveis/funções internas TypeScript/JS | `camelCase` | `carregarAnalise()` |
| Componentes, tipos e interfaces React/TS | `PascalCase` | `ResumoAnalise`, `PerfilPropriedade` |
| Arquivos de componentes React | `PascalCase.tsx` | `AjudaContextual.tsx` |
| CSS classes | `kebab-case` | `.botao-ajuda` |
| Diretórios e arquivos de documentação | `snake_case` | `docs/contrato_api.md` |
| Endpoints HTTP | minúsculas, substantivos plurais, prefixo versionado | `/api/v1/analises` |
| Constantes e variáveis de ambiente | `UPPER_SNAKE_CASE` | `DATABASE_URL` |

**Regra fundamental:** JSON da API e os respectivos tipos TS devem usar as **mesmas chaves**. Não usar camelCase automático na serialização (por exemplo, via alias do Pydantic), a menos que ambos os responsáveis aprovem e atualizem toda a especificação.

O idioma dos identificadores de domínio será **português sem acentos**. Nomes próprios de ferramentas/produtos e identificadores externos podem permanecer no idioma de origem dentro dos adaptadores. Não criar sinônimos concorrentes: `umidade_solo` é um possível atributo; `agua_seca` é ambíguo e não deve surgir sem uma definição de negócio clara. **Os campos de negócio concretos precisam entrar no dicionário de dados antes do código de produção.**

### Valores, unidades e ausências

- Serialização numérica em JSON: número real, ponto decimal; não usar `"12,5"` como número.
- Campos medidos precisam de unidade inequívoca. Ex.: `temperatura_media_c`, `precipitacao_acumulada_mm`, `area_ha`; mencionar **período de agregação**.
- Datas de calendário: `YYYY-MM-DD`; instantes: ISO 8601 com fuso/UTC (`...Z`). Armazenar instantes em UTC e formatar no frontend para o usuário.
- Localização pontual: `latitude` e `longitude` em graus decimais WGS84 quando esse for o CRS adotado; faixas `[-90,90]` e `[-180,180]`.
- GeoJSON (se futuramente usado): coordenadas na ordem **[longitude, latitude]**, nunca invertidas.
- Ausência de medição: `null` com motivo/qualidade quando necessário. **Nunca converter ausência em zero** e nunca gerar números científicos artificiais sem rotular como simulação.
- Enum em JSON: `snake_case` minúsculo, com domínio documentado; não depender do texto da UI.
- IDs: escolher estratégia consistente em `docs/contrato_api.md`; não misturar IDs de bancos com rótulos apresentados ao usuário.

### Exemplos de nomes — PROPOSTAS, NÃO CONTRATOS DEFINITIVOS

`propriedade_id`, `latitude`, `longitude`, `cultura_atual_id`, `prioridades`, `fonte_id`, `periodo_inicio`, `periodo_fim`, `data_coleta_utc`, `precipitacao_acumulada_mm`, `temperatura_media_c`, `umidade_solo`, `resolucao_espacial_m`, `qualidade_dado`, `analise_id`.

A equipe deverá registrar definições, unidades, validade e obrigatoriedade antes de congelar qualquer um desses campos.

## 6. Contrato API-first: ponto de encontro entre Codex e Claude

- Especificação em **`docs/contrato_api.md`** (exemplos e estados) e **OpenAPI gerado pelo FastAPI** (`/openapi.json`) assim que existir backend. O OpenAPI executável é a definição de rotas/schemas em produção; divergências com o documento devem ser corrigidas.
- Para cada endpoint documentar: método, URL, objetivo, request, response de sucesso, erros, tipos, obrigatoriedade, unidades, validações e exemplos.
- Respostas de uma operação devem usar JSON consistente; não variar formatos entre situações normais.
- Esqueleto sugerido para erros (pendente de aprovação):

```json
{
  "erro": {
    "codigo": "dados_insuficientes",
    "mensagem": "Não há dados suficientes para esta análise.",
    "detalhes": [],
    "requisicao_id": null
  }
}
```

- Códigos HTTP coerentes: `400` sintaxe inválida, `422` validação semântica, `404` inexistente, `409` conflito, `500` inesperado; distinguir ausência científica de falha técnica.
- Se a execução é demorada, não bloquear o navegador indefinidamente; combinar contrato de processamento e consulta de status antes da implementação.
- **Endpoints apenas propostos, não aprovados:** `GET /api/v1/health`, `GET /api/v1/culturas`, `POST /api/v1/analises`, `GET /api/v1/analises/{analise_id}`. Escolher os mínimos após inspecionar código existente.
- **Não usar o nome de campo visível na tela como identificador de API.** A UI pode exibir “Água disponível”, mas consumir um identificador técnico único documentado.
- Mock frontend deve ter exatamente o mesmo schema da API, estar explicitamente identificado e ser removível por configuração.
- Preferir tipos TypeScript gerados a partir de OpenAPI quando houver tempo; caso contrário, escrever tipos equivalentes e testes simples de contrato.

### Sequência de trabalho dos agentes

1. Inspecionar árvore do projeto e contratos existentes; listar riscos de incompatibilidade.
2. Propor/atualizar `docs/dicionario_dados.md` e `docs/contrato_api.md` com **somente campos e endpoints necessários para a primeira demonstração**.
3. Alinhar formato do JSON, erros e estados entre Ghabriel e Julya (registrar a decisão).
4. Codex implementa backend e testes; Claude implementa frontend e mocks conformes ao contrato.
5. Testar integração ponta a ponta; não declarar êxito com mocks apresentados como dados reais.

## 7. Dados científicos: governança, integração e precisão

O desafio lista **26 recursos/portais de referência**, mas nem todos são APIs e nem todos serão integrados. Alguns dependem de credenciais, arquivos especiais, downloads por área, produtos americanos ou formatos complexos. **O acesso a links foi investigado pela equipe, mas este documento não certifica que todas as fontes estejam acessíveis ou integradas.**

Para cada fonte efetivamente usada, registrar em `docs/fontes_dados.md`:

- `nome_fonte`, `url_origem`, agência/fornecedor, produto/versão, licença/atribuição, requisitos de login.
- Variáveis e unidades, período de cobertura, resolução temporal/espacial e sistema de referência geográfica.
- Data/hora de extração, método de transformação/agregação, chaves de localização e limites de uso.
- Campos ausentes, filtros de qualidade, confiabilidade e restrições para recomendações.
- Caminho do arquivo bruto, arquivo tratado, hash/versionamento ou outro mecanismo de reprodutibilidade.

Princípios obrigatórios:

- **Observação histórica ≠ previsão meteorológica ≠ hipótese de simulação.** Rótulos diferentes na UI e na API.
- Não afirmar causalidade a partir de correlação nem adequação agronômica a partir de um indicador isolado.
- Comparar dados somente quando unidades, datas, resoluções e áreas geográficas forem compatíveis.
- Ter um caminho que funcione sem consulta ao vivo de fontes externas (amostras reais previamente baixadas e atribuídas).
- Nunca colocar segredos/credenciais NASA ou bancos no Git; usar `.env` fora do versionamento e `.env.example` sem segredos.
- Evitar Git para arquivos brutos grandes; dados de teste pequenos, legalmente reutilizáveis e com proveniência podem entrar em `tests/fixtures`.

### Estratégia de acesso aos dados: API ao vivo x arquivo pré-indexado

Toda fonte usada no produto se encaixa em **exatamente uma** destas duas categorias — o backend não deve tratar nenhuma fonte de um jeito ambíguo ou híbrido:

1. **API ao vivo.** Hoje só a **NASA POWER** se qualifica: endpoint HTTP público, sem login, cobertura global. É chamada diretamente a cada requisição do usuário, com a coordenada recebida no momento.
2. **Arquivo pré-indexado.** Todas as fontes de arquivo de satélite (SMAP, GPM, ECOSTRESS, Landsat, MODIS, SRTM e qualquer outra que exija login Earthdata ou arquivo bruto grande). **Nunca** são buscadas ao vivo durante o uso do produto — o backend não faz requisição de rede pra NASA/USGS/etc. no caminho de uma resposta ao usuário. Em vez disso:
   - Um pipeline de ingestão (offline, executado antes do deploy/demo, fora do fluxo de requisição do usuário) baixa o arquivo bruto, recorta pra região piloto e agrega por célula.
   - Célula = grade fixa de **0,1° × 0,1°** (ver seção 10). Cada célula gera um **Parquet** por fonte/variável, referenciado por uma linha no **PostGIS** com a geometria da célula.
   - Na requisição do usuário, o backend resolve a coordenada recebida pra célula (`ST_Intersects` -- não `ST_Contains`, porque coordenadas em número redondo caem exatamente na borda da célula) e lê o Parquet referenciado.
   - Se a coordenada cair fora de qualquer célula pré-processada, a resposta da API deve dizer isso explicitamente (campo de disponibilidade/metadado), **nunca** tentar buscar ao vivo ou inventar valor.

**Contrato entre ingestão e API** (o que o backend pode assumir sem reimplementar a ingestão):
- Existe uma tabela/índice no PostGIS com, no mínimo, `fonte`, geometria da célula e caminho do Parquet correspondente.
- Os arquivos Parquet ficam em um caminho previsível em disco (ex.: `data/processed/<fonte>/<celula_id>.parquet`), nunca no Git.
- O esquema de colunas dentro de cada Parquet (nomes de variável, unidades) segue as convenções de nomenclatura da seção 5 e deve ser formalizado em `docs/dicionario_dados.md` conforme a ingestão for implementada.
- Cada resposta da API deve rotular, por fonte, se o valor veio **ao vivo** ou do **índice pré-processado** — rastreabilidade já exigida pelos princípios desta seção.

**Responsabilidade:** o pipeline de ingestão/indexação (download, recorte, Parquet, carga no PostGIS) é de **Tiago/Claude**; o endpoint que consome esse índice e a chamada ao vivo da NASA POWER são de **Ghabriel/Codex**, dentro do contrato de `docs/contrato_api.md`. Mudança em qualquer lado desse contrato (nome de tabela, caminho de arquivo, esquema do Parquet) precisa ser coordenada entre os dois antes de implementar.

### Os 26 links encontrados na aba Resources (referência, não fontes integradas)

1. SMAP — https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap
2. GPM/IMERG — https://gpm.nasa.gov/data
3. Landsat — https://earthexplorer.usgs.gov/
4. MODIS — https://lpdaac.usgs.gov/products/
5. VIIRS — https://search.earthdata.nasa.gov/search?q=VIIRS
6. NASA POWER — https://power.larc.nasa.gov/
7. SRTM — https://www.earthdata.nasa.gov/data/instruments/srtm
8. ECOSTRESS — https://ecostress.jpl.nasa.gov/data
9. USDA Ag Data Commons — https://www.nal.usda.gov/services/agdatacommons
10. Web Soil Survey — https://websoilsurvey.nrcs.usda.gov/app/
11. CropScape/CDL — https://nassgeodata.gmu.edu/CropScape/
12. PRISM — https://prism.oregonstate.edu/
13. USDA SSURGO/STATSGO2 — https://www.nrcs.usda.gov/resources/data-and-reports/soils
14. NAIP — https://naip-usdaonline.hub.arcgis.com/
15. NLCD — https://www.usgs.gov/centers/eros/science/national-land-cover-database
16. NLDAS/GLDAS — https://www.earthdata.nasa.gov/
17. FAO GAEZ — https://gaez.fao.org/
18. CoCoRaHS — https://www.cocorahs.org/Maps
19. USGS NWIS — https://waterdata.usgs.gov/nwis
20. USDA AMS Market News — https://www.ams.usda.gov/market-news
21. USDA NASS QuickStats — https://quickstats.nass.usda.gov/
22. OpenET — https://openetdata.org/
23. LANDFIRE — https://www.landfire.gov/
24. GEDI — https://gedi.umd.edu/data
25. Copernicus Sentinel-2 — https://dataspace.copernicus.eu/
26. ERA5 — https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview

**Atenção geográfica:** parte significativa desses serviços é centrada nos Estados Unidos. Como **a região de demonstração ainda não foi definida**, verificar a cobertura antes de escolher fonte e não declarar disponibilidade global por pressuposto.

## 8. Estrutura sugerida de repositório (adaptar, não destruir)

```text
/
├── AGENTS.md                      # instruções de entrada para Codex
├── CLAUDE.md                      # instruções de entrada para Claude
├── backend/
│   ├── app/
│   │   ├── api/v1/               # rotas e contratos HTTP
│   │   ├── schemas/              # Pydantic / DTOs
│   │   ├── domain/               # regras de negócio independentes
│   │   ├── services/             # orquestração
│   │   ├── repositories/         # persistência e abstrações
│   │   ├── integrations/         # adaptadores para NASA/terceiros
│   │   ├── pipelines/            # ingestão e transformação
│   │   └── main.py
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/                  # cliente e DTOs do contrato
│       ├── components/           # componentes reutilizáveis
│       ├── features/             # fluxos de usuário
│       ├── accessibility/        # ajuda, narração e preferências
│       └── pages/
├── docs/
│   ├── convencao_programacao.md   # este documento
│   ├── contrato_api.md
│   ├── dicionario_dados.md
│   ├── fontes_dados.md
│   └── decisoes_arquitetura.md
└── data/
    └── README.md                # instruções; sem dados gigantes no Git
```

Se já houver uma arquitetura funcional no repositório, **preservá-la** e seguir estas regras de separação sem refatoração massiva durante o hackathon. Se frontend e backend forem repositórios separados, **manter cópias sincronizadas e versionadas deste documento**, com a versão explicitada no topo.

## 9. Qualidade, UX, segurança e testes

**Acessibilidade e UX:**
- Padrão visual inicialmente pt-BR; componentes semânticos, labels, mensagens de erro específicas, foco visível, operação por teclado e contraste adequado.
- Progressão guiada, possibilidade de voltar sem perda de dados, explicação de siglas, texto alternativo para gráficos e indicação das unidades.
- Ajuda contextual disponível por ícone; F2 pode ser um atalho adicional; **nunca** tornar uma ação essencial exclusiva do teclado de desktop.
- Narração nunca obrigatória; texto e compatibilidade com leitores de tela são fundamentais. Preferir roteiros explicativos a simplesmente ler o HTML inteiro.
- Responsividade desde o MVP; não presumir celular sempre conectado.

**Qualidade e segurança:**
- Validar entradas nas duas camadas, com a API como autoridade final. Nunca confiar em dados de usuário ou externos.
- Queries SQL parametrizadas/ORM; sem senhas no código; `CORS` limitado ao domínio do frontend quando houver deploy.
- Logs técnicos sem dados sensíveis desnecessários; mensagens amigáveis no frontend.
- Requisições externas com timeout, retries limitados e cache; tratar erros e autenticação explicitamente.
- Testar motor de recomendação com casos determinísticos e extremos; testar parsing/normalização; teste básico de contrato frontend ↔ backend.
- Registrar fontes e origem dos dados em resultado e demonstração; não esconder dados incompletos.

**Entrega mínima verificável:** interface abre, API responde, dados demonstrados são rastreáveis, um fluxo ponta a ponta pode ser repetido, erros são tratados, comando de execução está documentado. Se houver componente incompleto, identificá-lo como tal.

## 10. Registro de decisões e pendências em aberto

### Decisões já tomadas

- Desafio: **Field Shift** (e não Earth System Trend Detective).
- Primeiro produto: **web**, com backend de **Ghabriel/Codex** e frontend de **Julya/Claude**.
- Direção de stack: **Python/FastAPI + React/TypeScript + PostgreSQL**.
- Separação entre interfaces, API, motor de decisão, ingestão e armazenamento.
- Preocupação central com acessibilidade e experiência de agricultores com variados níveis de familiaridade digital.
- Suporte arquitetural futuro a desktop sem internet e Android, mas sem implementá-los agora.
- **Região piloto do protótipo:** Condado de Fresno, Califórnia, EUA (Vale de San Joaquin) — coordenada de referência `36.6, -119.7`. Escolhida por concentrar sinal forte em quase todas as fontes oficiais (estresse hídrico/aquífero documentado por GRACE/GRACE-FO, OpenET, diversidade de culturas via CDL, relevo variado próximo à Sierra Nevada) e por estar nos EUA, onde a maioria das 14 fontes "de outras instituições" tem cobertura.
- **Localização do usuário:** capturada via `navigator.geolocation` do navegador (não é mapa clicável livre). Fora da região piloto pré-processada, o app assume a limitação explicitamente (sem dados detalhados de satélite) em vez de buscar ao vivo.
- **Indexação espacial dos arquivos grandes:** recorte na ingestão (uma vez, offline) por região/célula, armazenado com índice espacial em PostGIS (`ST_Intersects`); a requisição busca pela coordenada, nunca varre o arquivo bruto. As fontes de arquivo grande (SMAP, GPM, ECOSTRESS, Landsat, MODIS, SRTM) só respondem para a região já pré-processada.
- **Fontes de API ao vivo (sem pré-indexação):** NASA POWER (clima, global) · USDA Soil Data Access (propriedades do solo, só EUA) · USDA CropScape/CDL (histórico de cultura por ano, só EUA — coordenada precisa ser reprojetada pra EPSG:5070 antes da chamada). Todas sem login. Fora da cobertura (ex. fora dos EUA), retornam `disponivel=False`, nunca inventam valor. Clientes em `web/Backend/app/integrations/`.
- **Achado real relevante pro produto:** no ponto piloto (Fresno County), o CropScape mostra **a mesma cultura (amêndoa) todos os anos de 2018 a 2022** — é pomar perene, não rotação anual. Isso é esperado agronomicamente, mas significa que esse ponto exato não ilustra bem "estratégias de rotação" — vale escolher um ponto de cultura anual (ex. algodão/tomate/alfafa) pra demo, ou ajustar a narrativa do pitch pra "quando vale migrar de um pomar perene".
- **PostgreSQL + PostGIS 3.6 rodando de verdade** (local, Windows), banco `fatesa`, tabela `indice_espacial` (`fonte`, `celula_id`, `geom` poligono 4326, `caminho_parquet`), com índice GIST. Esquema em `web/Backend/app/pipelines/schema_postgis.sql`. Credencial de conexão fica em `web/.env` (`DATABASE_URL`), nunca no Git.
- **Tamanho de cada célula do índice:** grade fixa de **0,1° × 0,1°** (~11 km × 11 km nesta latitude) — casa com a resolução nativa das fontes mais grosseiras que ainda assim são úteis ao vivo (GPM ~10 km, SMAP ~9–36 km), sem desperdiçar granularidade que essas fontes não têm. O Condado de Fresno (~180 km × 100 km) cobre, nessa grade, algo em torno de 230 células. Fontes de resolução mais fina (Landsat/SRTM 30 m, ECOSTRESS ~70 m) são agregadas (média/mín/máx) dentro da célula, não guardadas pixel a pixel — a UI não desenha mapa de pixel neste MVP.
- **Tipo de arquivo do dado processado:** **Parquet** por célula (uma linha por combinação fonte/variável/data), referenciado pelo PostGIS — não BLOB no banco. Parquet porque o conteúdo final é tabular/série temporal (não imagem), é colunar (leitura rápida de poucas variáveis), comprime bem e tem suporte nativo em Python (pandas/pyarrow), que é a stack escolhida para os pipelines. Se algum dia for necessário servir um recorte visual (ex.: mapa de NDVI), aí sim o formato seria GeoTIFF (preferencialmente Cloud-Optimized GeoTIFF) em vez de Parquet — não é o caso do MVP atual.
- Protótipo de ingestão/indexação sob responsabilidade de **Tiago/Claude**, em `web/Backend`, coordenado com Ghabriel/Codex para não colidir com o contrato de API.

### NÃO definidos / dependem de decisão humana e evidência

- Nome comercial do produto, logo, identidade visual, repositório definitivo, hospedagem e autenticação.
- Cobertura/região de **produção** final (a região piloto acima vale só para o protótipo do hackathon).
- Culturas suportadas, safras e calendário agrícola.
- Quais dos 26 recursos serão efetivamente integrados e quais estão disponíveis no ambiente atual.
- Regras científicas de comparação, pesos, limites agronômicos, validação e interpretação de resultados.
- Tabelas, payloads e endpoints exatos de produção além das convenções e propostas deste arquivo.
- Se os recursos F2 e narração estarão no MVP ou numa etapa seguinte.
- Empacotamento, mapa offline, sincronização e armazenamento do desktop e Android.

**Regra para decisões novas:** acrescentar uma entrada datada em `docs/decisoes_arquitetura.md` com decisão, motivo, alternativas, impacto em backend/frontend e responsáveis que aprovaram. Atualizar este arquivo quando a decisão tornar-se permanente.

---

> **Lembrete final aos dois agentes:** o objetivo não é construir a maior plataforma agrícola em 48 horas. É demonstrar uma ferramenta coerente, acessível, tecnicamente honesta e baseada em dados reais. Priorize uma jornada completa e verificável. **Não crie por conta própria região, cultivo, score, campo JSON ou promessa de recurso offline.**
