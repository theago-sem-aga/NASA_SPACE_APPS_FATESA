# BACKEND: o que o front já mostra, mas o back ainda não manda

> Para: **Tiago** e **Ghabriel**. Levantamento da Julya (front), atualizado em 15/11/2026, rodando o site em modo `api`
> com o back local na versão `e2988d1` da `features-tentativa` (já com as correções de solo, relevo e NDVI do Ghabriel).
> Nada foi alterado em `web/Backend`. A proposta sobre os problemas marcados (praga/nematoide etc.) está em
> `docs/proposta-motor-problemas.md`.

## Situação em 15/11/2026, 12h (conferida com análise nova no back local)

| Pendência | Situação | Quem |
|---|---|---|
| Calor (`estresse_termico`) | ✅ **Entregue.** Campos idênticos ao contrato do front; SJRP bate com o cálculo da equipe (alto, setembro, ago–nov, 39,5 dias/ano). Limiar de 35 °C segue provisório. | Tiago |
| Nome da cidade (`descricao_local`) | ✅ **Entregue.** "São José do Rio Preto (SP)", "Olímpia (SP)". Ponto do GPS sem cidade continua como coordenada. | Ghabriel |
| Relevo e declividade no Brasil | ✅ **Entregue.** 5 pontos de elevação do NASA SRTMGL1: SJRP suave ondulado (5,71%), Olímpia ondulado (9,74%). | Ghabriel |
| OpenET fora dos EUA | ✅ **Corrigido.** Agora aparece como "fora da cobertura", e não como falha. | Ghabriel |
| Continuar sem histórico de colheita | ✅ **Entregue** (botão na tela da colheita). | Ghabriel |
| Risco de erosão | ⛔ **Descartado** (sem fonte confiável para o fator do solo). O front mostra "Sem dado". | Tiago |
| Umidade da terra (SMAP) | ⛔ **Descartado** para o hackathon. O front tirou a opção do gráfico. | Equipe |
| Tipo de terra, NDVI e GRACE em Olímpia | ⏳ **Pendente** (pontos não pré-processados). | Tiago / Ghabriel |
| Motor usar os problemas marcados | ⏳ **Pendente** (`docs/proposta-motor-problemas.md`). | Back |
| Catálogo real para outras culturas (some o aviso de "Simulação") | ⏳ **Pendente.** Hoje só a cana tem catálogo real. | Back |
| Textos do back na norma padrão ("pra" → "para") | ⏳ **Pendente.** | Tiago |
> **NDVI resolvido em 15/11/2026:** a busca municipal de SJRP e Olímpia e a
> coordenada de Olímpia do relatório já têm séries próprias verificadas. Resultados
> e arquivos estão na última seção. Não houve alteração no ranking.

## Teste usado

**Atualização da entrega técnica — Ghabriel/Codex, 15/11/2026:** o teste original
abaixo foi preservado como histórico. Nesta entrega foram corrigidos nome da cidade,
relevo dos pontos brasileiros, continuidade sem colheita, mensagens de dados ausentes,
acompanhamento de coordenada digitada, tipos/comentários da integração e ausência
de cobertura do OpenET no hemisfério sul. Ver o estado detalhado no fim do arquivo.

`POST /api/v1/analises` com análise nova (sem reaproveitar resultado), prioridade "tratar o gado":

| Campo | S. J. do Rio Preto (-20,82, -49,38; cana) | Olímpia (-20,70, -48,96; cana) | Ames, EUA (42,10, -93,65; milho) |
|---|---|---|---|
| `talhao.textura_solo` | `media` | **null** | `media` ✅ |
| `talhao.relevo` | **null** | **null** | `suave_ondulado` ✅ |
| `talhao.declividade_pct` | **null** | **null** | `4.16` ✅ |
| `talhao.risco_erosao` | null (sem regra validada) | null | null |
| `estresse_vegetal` | ✅ | **ausente** (`sem_historico_pre_processado`) | ✅ |
| `estresse_termico` | **ausente** | **ausente** | **ausente** |
| `descricao_local` | **"Coordenada -20.8200, -49.3800"** | **"Coordenada -20.7000, -48.9600"** | "Coordenada 42.1000, -93.6500" |

`fontes_indisponiveis` relevantes: no Brasil, `srtm`, `soilgrids` e `grace` aparecem como `fora_da_regiao_pre_processada` para Olímpia; `openet:falha_fonte` nos dois pontos brasileiros (o OpenET cobre só os EUA, então talvez nem devesse ser consultado aqui).

## Pendências, por prioridade

1. **Relevo e declividade no Brasil** (Ghabriel/Tiago): nos EUA já vêm pelo USGS 3DEP. No Brasil continuam null. O SRTM está indexado, mas só na região pré-processada. Sugestão: declividade pelo SRTM (ou pela mesma lógica dos 5 pontos de elevação) para coordenadas brasileiras.
2. **`estresse_termico` (Calor)** (Tiago): contrato proposto em `web/Frontend/src/api/tipos.ts` (`EstresseTermico`, `CalorMensal`).
   - O front tem o item **Calor** e usa o campo em **Meses de atenção**; no modo `api` os dois ficam sem calor.
   - Referência de cálculo: `web/Frontend/src/api/mock/calorMock.ts` (NASA POWER T2M_MAX 1995–2025, dias acima de 35 °C por mês, meses de risco quando há calor forte em pelo menos metade dos anos). **O limiar de 35 °C é proposta, sem fonte agronômica por cultura.**
3. **`descricao_local` com o nome da cidade** (Ghabriel): mesmo com `codigo_ibge` e `origem_local=municipio`, volta "Coordenada …". O front mostra isso no topo e no resumo. Esperado: "Olímpia (SP)".
4. **Cobertura fora dos pontos preparados** (Tiago): em Olímpia, a ~45 km de S. J. do Rio Preto, faltam textura (SoilGrids), NDVI (MODIS) e GRACE (`fora_da_regiao_pre_processada` / `sem_historico_pre_processado`). Para a demonstração, vale pré-processar as cidades que vamos mostrar ou buscar ao vivo.
5. **`risco_erosao`**: continua null por falta de regra validada (o back avisa). Como erosão é problema-alvo do desafio, uma regra explicável marcada como estimativa (declividade × textura × chuva forte) ajudaria. Decisão de vocês.

6. **Textos do back na norma padrão** (Tiago): mensagens que aparecem na tela devem evitar "pra"/"pro". Exemplo em `web/Backend/app/services/analises.py`: "só existe catálogo real pra cana-de-açúcar" → "para cana-de-açúcar". O front já foi revisado ("Dá comida para o gado", sem "a gente").

## O que o front faz enquanto isso

- Campo null aparece como **"Sem dado"**; tipo de terra e relevo sem dado usam ícone cinza, não "?".
- Item do carrossel do clima sem dado **não aparece** (Calor; NDVI onde não há).
- Quando o back mandar os campos, o front mostra sozinho, sem mudar nada.

## Conferência do backend com o frontend — Ghabriel/Codex, 15/11/2026

Esta seção cruza o levantamento acima, `proposta-motor-problemas.md`, os comentários
`BACKEND:` do frontend, o código atual e o OpenAPI local. É uma análise para alinhamento;
as sugestões abaixo não aprovam novas regras agronômicas nem alteram o contrato.
Os contratos continuam exclusivamente nos schemas Pydantic e no OpenAPI.

### O que já existe e não deve ser implementado outra vez

- Catálogos, busca de municípios, localização aproximada, POST e recuperação de
  análises, persistência PostgreSQL/PostGIS, produção, previsão e acompanhamento
  já têm rotas. Os cabeçalhos que ainda os chamam de "PROPOSTA" em `api/tipos.ts`
  estão desatualizados; isso não significa que falte implementar essas rotas.
- `AnaliseEntrada.problemas` já existe no backend. A pendência é usar a informação
  no motor, não acrescentar novamente o campo ao POST.
- O catálogo de cana já é chamado por `services/analises.py`, via
  `modelos/motor_decisao.py`. A afirmação contrária em `requisitos-faltantes.md`
  está desatualizada. Outros cultivos continuam no motor beta genérico.
- NASS já alimenta o painel de produção dos EUA, via geocodificação do Census.
  Isso não significa que renda, preço ou rentabilidade estejam no motor.
- Glossário já existe no frontend. Mapas interativos, desktop offline e Android
  continuam adiados, não são requisitos autorizados desta etapa.
- Ames tem textura, relevo e NDVI conferidos. O relevo agora tem cache local de
  consultas completas, com prazo e indicação nas limitações. O NDVI desse ponto
  está versionado em `data/processed/modis_ndvi/421_-937.parquet`.

### Pendências confirmadas e critério para considerar cada uma resolvida

| Item | Situação verificada | Trabalho e alinhamento necessários |
|---|---|---|
| Nome do local | `services/analises.py` sempre monta `descricao_local` como coordenada, mesmo quando há código IBGE válido. | Usar o município já disponível em `services/locais.py`, preservando a coordenada e distinguindo aproximação municipal de GPS. Conferir nome/UF em análise nova e recuperada. Não inventar cidade quando não identificada. |
| Calor | `Analise.estresse_termico` não existe no OpenAPI; o frontend tem DTO e componentes preparados. | Definir indicador, período, completude e significado dos níveis antes de implementar. Distinguir frequência histórica de máximas elevadas de dano/estresse específico da cultura. Os 35 °C e metade dos anos são propostas, não regra aprovada. Alinhar os nomes já propostos, sem criar contrato paralelo. |
| Relevo no Brasil | A implementação atual consulta somente USGS 3DEP. Nesta máquina, SJRP e Olímpia não têm célula SRTM correspondente no índice. | Escolher fonte e preparar elevação na resolução necessária. O SRTM processado hoje fornece média/mínimo/máximo por célula, insuficientes para reproduzir os cinco pontos usados no cálculo da declividade. Não converter amplitude da célula em inclinação do talhão. |
| Cobertura de solo/NDVI | SJRP tem SoilGrids e MODIS; Olímpia não tem nenhum dos dois; Ames tem MODIS e textura USDA. | Definir os pontos da demonstração e preparar/verificar cada pacote. Implantar rastreabilidade de cobertura e atualização. Arquivo de um ponto não representa automaticamente o município inteiro ou a propriedade vizinha. A série longa MODIS deve continuar fora do POST interativo. |
| GRACE fora do piloto | O código aceita arquivo global bruto como alternativa, mas ele não está nesta máquina. O bucket sincroniza `processed/`, não `raw/`. | Decidir entre preparar recortes adicionais ou distribuir/baixar o arquivo global por pipeline. A implementação existente não garante disponibilidade em todos os ambientes. GRACE é contexto regional, não água medida no talhão. |
| Fontes fora da cobertura | OpenET é chamado também para pontos brasileiros; ausência geográfica pode aparecer como falha técnica. | Distinguir cobertura, autenticação, timeout, ausência e dado inválido. Usar cobertura documentada, sem inventar uma caixa geográfica. Conferir também a diferença entre ausência de relevo e falha de uma das cinco consultas. |
| Problemas do produtor | O catálogo recebe prioridades/recursos/município, mas não problemas. O beta só acrescenta ressalvas para pragas; isso não muda a escolha. | Alinhar o efeito de cada problema, pesos e explicação. Não copiar automaticamente a garantia mínima proposta pela Julya. Praga/nematoide sem identificação não basta para recomendar espécie ou prometer quebra de ciclo. Se aprovado, atualizar motor e tabela gerada do mock a partir da mesma regra. |
| Dois motores e uso das observações | Cana usa catálogo e filtro ZARC; demais culturas usam três hipóteses genéricas. Clima, solo e NDVI caracterizam a área, mas não são entradas efetivas do ranking do catálogo. | Definir primeiro um caso completo com cultura/região/manejo e evidência. Reutilizar a separação existente entre domínio, serviços, fontes e API. Não é necessário reescrever o backend ou ampliar culturas sem parâmetros. Unificar o fluxo de decisão progressivamente. |
| Janelas e vulnerabilidade por cultura | Calendários são fixos/simulados. O frontend reúne sinais climáticos gerais, sem cruzar fase fenológica. Pousio é tratado como referência atual sem confirmação do manejo do agricultor. | Definir os dados mínimos de calendário, cultura/cultivar, fases e manejo. Só então calcular janela vazia e vulnerabilidade, mantendo a comparação com uma prática atual confirmada ou explicitamente hipotética. |
| Água e retorno econômico | Há coleta de ET e dados de chuva/umidade, mas não balanço hídrico da cultura ou economia calculada. Atributos de água e renda são níveis do catálogo/beta. | Separar coleta de variáveis de estimativas de demanda, disponibilidade e retorno. Definir parâmetros e fontes antes de apresentar redução de água, renda ou infiltração como resultado calculado. |
| Erosão | `risco_erosao` permanece null e isso é declarado. | Continua separada por decisão de Ghabriel. Precisa de método, resolução, parâmetros e validação; a sugestão declividade × textura × chuva não constitui modelo aprovado. |
| Validação científica do catálogo | O próprio JSON declara todos os textos/níveis como placeholders; algumas estratégias exibem confiança alta e evidências prontas. O ZARC é filtrado pela janela fixa out–dez e resumido pelo menor risco por cultura. | Rever níveis, referências, confiança, abrangência, calendário e uso do ZARC por condições compatíveis. Catálogo conectado à API não equivale a recomendação validada. Geada, seca e NDVI também têm cortes que precisam de referências/revisão. |

### Ajustes conjuntos frontend/backend encontrados nos comentários

- **Ausência não pode virar segurança:** `MesesAtencao.tsx` pode mostrar "sem alerta"
  e "Nenhum mês com calor forte..." quando o calor está ausente. Em `AnoDaTerra.tsx`,
  a falta de chuva não entra na lista de meses perigosos. É preciso revisar a mensagem
  para distinguir falta de dado de ausência de risco.
- **Regras ainda no frontend:** `MesesAtencao.tsx` usa 50 mm/mês para pouca chuva e
  `AnoDaTerra.tsx` usa 100 mm/mês para chuva forte. Ambos são propostos e sem validação;
  não devem se tornar regras oficiais apenas por já estarem desenhados. Alinhar onde
  a interpretação deve ocorrer e como comunicar os limites.
- **Seca não é o método descrito no comentário:** `api/tipos.ts` menciona tendência
  e umidade POWER/SMAP, mas o backend compara chuva dos últimos 90 dias com o mesmo
  período histórico. A descrição pública precisa refletir o indicador real; decidir
  se haverá outro modelo de seca é uma decisão distinta.
- **Coordenada digitada é marcada como município:** `TelaLocal.tsx` passa pelo mesmo
  callback usado por busca municipal; `App.tsx` marca `origem_local='municipio'`.
  O cliente de acompanhamento só aceita GPS no modo API. Precisamos distinguir ponto
  explícito de centroide aproximado antes de prometer fotos do talhão para coordenada
  digitada. Uma eventual mudança no contrato deve ser alinhada entre as frentes.
- **Colheita complementar pode bloquear o fluxo:** `TelaProducao.tsx` permite continuar
  em `dados_insuficientes`, mas em falha de configuração/rede oferece apenas tentar
  novamente. Alinhar continuidade com aviso, sem substituir os dados por mock.
- **Precisão da localização:** o comentário pede malha IBGE/PostGIS, mas o serviço
  implementado escolhe centroide mais próximo dentro de uma caixa aproximada. Decidir
  se a aproximação documentada basta para a entrega; não afirmar limite municipal exato.
- **Tipos e comentários:** corrigir as anotações desatualizadas comparando-as ao OpenAPI.
  O backend também devolve proveniência/estado adicionais que o DTO TS de `Analise`
  não declara; a ausência no tipo não impede o JSON, mas dificulta usar esses avisos.

### Ordem sugerida para alinharmos antes de implementar

1. Fechar cultura, região e pontos concretos da demonstração; fazer uma matriz de
   cobertura por fonte e ambiente. Não assumir que todos os cinco cultivos liberados
   pelo beta já têm regras específicas.
2. Separar correções técnicas de baixo risco (nome do local, cobertura/erros, estado
   de dado ausente, origem da coordenada) de decisões científicas.
3. Alinhar o indicador de calor e seu contrato; a estrutura visual já está pronta.
4. Alinhar como problemas e dados observados influenciam um caso real do motor,
   sem pesos ou efeitos agronômicos inventados.
5. Planejar janelas/fases e validação do catálogo. Erosão continua uma decisão
   separada; recursos futuros permanecem adiados.

Verificação desta conferência: leitura dos comentários e módulos citados, consulta
ao OpenAPI local e inspeção das células/arquivos de SJRP, Olímpia e Ames e da ausência
do GRACE bruto. Não foram implementados os requisitos nem executadas novas ingestões
ou testes científicos nesta etapa. Os registros de consultas anteriores não devem
ser tratados como promessa de disponibilidade permanente dos serviços externos.

## Entrega técnica dos comentários e deste levantamento — 15/11/2026

Não inclui a implementação dos itens de `requisitos-faltantes.md`, atribuídos a
Tiago/Thiago. Não aprova pesos, limiares ou regras agronômicas novas.

| Pendência | Resultado desta entrega |
|---|---|
| Nome da cidade | Resolvido para código IBGE conhecido: `descricao_local` mostra nome e UF e é preservada na recuperação. Código desconhecido mantém coordenada, sem inventar nome. |
| Relevo no Brasil | Implementada leitura de grade SRTMGL1 v003, preservada em Parquet por célula. Cinco elevações locais alimentam o cálculo de declividade já existente. Não utiliza média/min/max de uma célula como inclinação. |
| Calor | Integrada a implementação de Tiago (`589c29a`), com schema Pydantic e os nomes já esperados pelo frontend. O campo chega no POST e falha isoladamente quando a fonte não responde. Limiares continuam sujeitos à validação, sem alteração da regra nesta integração. |
| Pontos de SJRP e Olímpia | Preparados quatro recortes, também cobrindo os centroides da busca municipal; manifesto e PostGIS com 135 entradas neste ambiente. Rasters originais e metadados de aquisição ficam em `data/raw/srtm/`; apenas os recortes pequenos são versionados. |
| Dataset preparado mas ainda fora do bucket | O importador do índice reincorpora os recortes locais SRTM reconhecidos. Um manifesto antigo baixado do GCS não faz esses recortes desaparecerem do índice. Não foi feito upload ao bucket nesta entrega. |
| Falha de produção bloqueia questionário | A tela continua oferecendo tentar novamente, mas permite continuar explicitamente sem o histórico. Nenhum mock substitui o dado indisponível. |
| Falta de dado apresentada como segurança | Meses de atenção indicam avaliação parcial/dados incompletos. Calendário com chuva ausente em meses descobertos não é descrito como sem exposição a chuva forte. Limiares anteriores não foram alterados. |
| Coordenada digitada e fotos | O cliente aceita a opção existente "Usar o ponto" (escolha manual sem código IBGE/UF), preservando as coordenadas. Busca municipal com centroide continua impedida de se passar por talhão. Sem novos valores no enum público; a precisão manual é declarada nas limitações. |
| Motivos de ausência | Textura ambígua/ausente e elevações ausentes são registradas explicitamente. No hemisfério sul, OpenET retorna ausência de cobertura sem gastar uma chamada; isso não é uma máscara global completa da cobertura. |
| Tipos/comentários | Corrigidos cabeçalhos que diziam que rotas existentes eram apenas propostas. Declarados os metadados adicionais já enviados pelo backend. O método de seca descrito no frontend agora corresponde ao indicador de chuva implementado. |
| Concorrência do cache | Corrigida possibilidade de travamento por colisão de travas entre consultas aninhadas; mantida a coalescência de requisições da mesma chave. Teste específico de regressão. |

Consultas reais do POST e recuperação persistida, nas coordenadas do relatório:

| Coordenada | Nome retornado | Declividade | Classe atual |
|---|---|---|---|
| -20.82, -49.38 | São José do Rio Preto (SP) | 5,71% | suave_ondulado |
| -20.70, -48.96 | Olímpia (SP) | 9,74% | ondulado |

Esses números são da coordenada, não de toda a cidade. A seleção pelo nome usa
outro ponto (centroide), portanto pode retornar outra declividade. SRTM é uma
superfície histórica; não substitui levantamento topográfico atual.

### O que permanece separado

- **Validação de calor:** a integração foi concluída com a implementação do Tiago;
  os limiares são os propostos pela equipe, não limites validados por cultura.
- **SoilGrids de Olímpia e GRACE fora dos recortes:** dependem de preparar e
  distribuir os respectivos dados (Tiago). A lacuna de NDVI dos pontos municipais
  e da coordenada de Olímpia foi resolvida na preparação documentada abaixo.
- **Erosão:** continua sem regra validada e sem valor fabricado.
- **Problemas no ranking e fases da cultura:** a proposta da Julya foi preservada;
  pesos, garantias e respostas específicas a pragas não foram adotados automaticamente.
- **Malha municipal exata:** continua a aproximação por centroide documentada. Não
  foi introduzida uma nova base geográfica ou serviço de geocodificação.

Para repetir a preparação do relevo em outros pontos, ver `web/Backend/README.md`.
Os computadores que atualizarem estes recortes pelo Git só precisam do startup
normal para importar o índice; não precisam baixar os HGT na requisição.

Validação final após integrar o calor do Tiago: **148 testes backend, 12 testes
frontend, build e Ruff dos arquivos alterados aprovados**. Conferidos POST e
recuperação persistida dos dois pontos brasileiros, leitura dos quatro recortes
e fluxo no navegador com falha de colheita simulada explicitamente no teste,
continuidade do questionário e POST real com nome, relevo e calor dos 12 meses.

## NDVI dos pontos municipais — preparação concluída em 15/11/2026

A pedido de Ghabriel, foram preparados apenas os dois casos de NDVI pendentes,
sem alterar o ranking ou as regras do indicador. Olímpia precisou de duas células
porque a coordenada do relatório e o ponto da busca por nome são diferentes.
Os dados vêm do MOD13Q1 pelo ORNL DAAC, não de outro município ou de um mock.

| Ponto solicitado | Arquivo em `data/processed/modis_ndvi/` | NDVI válido mais recente | Mediana histórica da mesma época | Classe existente |
|---|---|---|---|---|
| SJRP, busca municipal: -20.79727954007588, -49.35757989475737 | `-208_-494.parquet` | 0,350 | 0,285 | normal |
| Olímpia, busca municipal: -20.704914410497572, -48.959625634954804 | `-208_-490.parquet` | 0,537 | 0,430 | normal |
| Olímpia, relatório: -20.70, -48.96 | `-207_-490.parquet` | 0,572 | 0,514 | normal |

Cada série tem 614 datas únicas de 18/02/2000 a 16/10/2026, com NDVI e qualidade
do pixel preservados. Nos três casos, a observação válida mais recente é de
16/10/2026 e o indicador compara a mesma época em 26 anos anteriores. "Normal"
é a classe estatística já implementada, não uma declaração de ausência de problemas
agronômicos. O uso agrícola desses pontos municipais não foi verificado.

A coleta agora recebe as duas bandas juntas, em blocos de até dez datas, reduzindo
os pedidos de 124 para 62 por ponto. O pool compartilhado limita as consultas dos
blocos; a publicação do Parquet é atômica e preserva o arquivo anterior em falha.
Respostas sem ambas as bandas e arquivos vazios não são publicados.

Validação: faixas numéricas, qualidade, datas sem duplicação e coordenadas dos três
arquivos conferidas; POST real e recuperação persistida retornaram `estresse_vegetal`
nos três pontos. Séries incluídas no Git; o bucket ainda não contém esses três
arquivos, e não foi realizado upload. Não é necessário reiniciar o backend para
ler os arquivos, mas é necessário refazer a análise: resultados salvos anteriormente
não são alterados automaticamente.

Para atualizar: `web/Backend/README.md`, seção NDVI. Se o Thiago mudar os pontos
da localização municipal, conferir as novas células antes de declarar cobertura.
