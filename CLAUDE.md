# FATESA — NASA Space Apps 2026

**Desafio:** [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) · **Evento:** 14–15/11/2026 (48h) · [Evento local — São José do Rio Preto](https://www.spaceappschallenge.org/2026/local-events/sao-jose-do-rio-preto/) · [Página da equipe](https://www.spaceappschallenge.org/2026/find-a-team/fatesa/)

> Carregado automaticamente em toda sessão (Claude ou Codex) aberta no repositório. Mantenha conciso — detalhe extenso vai em `/docs`.

## Objetivo
Transformar 25+ anos de observações da Terra (NASA) + solo local + características de culturas + prioridades do agricultor em **estratégias de rotação de culturas ranqueadas e explicáveis** para uma fazenda específica, resilientes a mudanças de temperatura, chuva e água.

## Problemas-alvo
- Fazenda: escassez de água, erosão, esgotamento de nutrientes.
- Cultura atual: consumo excessivo de água, doenças, conflito com mercado local, fora da janela ideal de plantio.

## Fontes de dados
Tabela completa, guia por tema e descrição de cada base: [`docs/fontes-dados.md`](docs/fontes-dados.md).
**Origem:** das 26 bases oficiais, 10 são da NASA, 2 de agências parceiras (ESA/Copernicus: Sentinel-2, ERA5) e 14 de outras instituições (USDA, USGS, FAO etc.). Lista em `docs/fontes-dados.md`.
**Atenção Brasil:** várias bases oficiais cobrem só os EUA — priorizar as 🌎 Global (SMAP, GPM/IMERG, Landsat, MODIS/VIIRS, NASA POWER, SRTM, ECOSTRESS, GEDI, GLDAS, FAO GAEZ, Sentinel-2, ERA5). Caminho mais rápido para protótipo: **NASA POWER** (sem login) + **FAO GAEZ**. Para histórico de rotações, água e mercado (sem fonte brasileira na lista oficial) usar fontes nacionais: IBGE SIDRA, Conab, ANA, MapBiomas — detalhe em `docs/fontes-dados.md`.

## Análises exigidas
- Temperatura, estresse térmico, risco de geada.
- Precipitação (normal e extrema), tendência hídrica de longo prazo.
- Umidade do solo, evapotranspiração, estresse vegetal.
- Cruzar característica da cultura x prioridade do agricultor: uso de água, valor de forragem, fixação de N, redução de erosão, matéria orgânica, adequação ao mercado.

## Entregável da solução
- Apontar janelas vazias no campo e estações de maior vulnerabilidade da cultura atual.
- **≥3 estratégias de rotação** (incluindo a atual existente), cada uma com: objetivo, evidência, benefícios, riscos que exigem validação local (agricultor/especialista).

## Macro-visão do planejamento
- **Objetivo principal:** motor de decisão que ranqueia ≥3 estratégias de rotação explicáveis para a fazenda piloto, apontando janelas vazias e vulnerabilidade sazonal.
- **Objetivos opcionais:** dashboard/mapa interativo · múltiplas fazendas/regiões · explicação em linguagem natural via IA generativa · projeção de tendências futuras (2040/2050) · cruzamento com fontes nacionais (MapBiomas, Conab, IBGE SIDRA, ANA) · relatório exportável para o agricultor.
- **Requisitos:** fazenda piloto com coordenadas reais · prioridades do agricultor definidas · pipeline de ingestão ativo (NASA POWER é o mais rápido) · scoring explicável (sem caixa-preta) · UI mostrando objetivo/evidência/benefício/risco por estratégia · conformidade com a submissão Space Apps · fluxo Git funcionando sem conflito entre os cinco.
- **Obstáculos:** bases oficiais majoritariamente só EUA · login Earthdata exigido por SMAP/GPM/ECOSTRESS/GEDI/GLDAS · equipe com Claude e Codex em paralelo (risco de conflito de merge, já ocorrido) · equilíbrio explicabilidade x complexidade do modelo · validação agronômica dos riscos depende de revisão humana especializada que o time pode não ter.

## Submissão Space Apps
- **High-Level Summary:** nome do projeto, o que foi feito, abordagem, por que importa.
- **Project Details:** o que faz, como funciona, benefícios, impacto esperado, stack usado.
- **Use of AI:** onde/como/qual IA foi usada (não altera dados oficiais da NASA).
- **Dados e referências:** quais dados NASA/parceiros foram usados, como, que insight trouxeram + outras referências (inclusive open source).
- **Demo + Project:** links públicos e abertos (YouTube/Canva/Drive/GitHub). Demo = pitch de 30s ou 7 slides.
- **Júri local** avalia o projeto como um todo (sem ranking/perguntas/feedback individual): Impact, Creativity, Validity, Relevance, Presentation.

## Equipe
| Pessoa | Assistente IA |
|---|---|
| Tiago | Claude |
| Julya | Claude |
| Thiago | Claude |
| Matheus | Claude |
| Ghabriel | Codex |

> Estas regras valem para **qualquer agente** (Claude ou Codex) que trabalhe neste repositório.

## Fluxo Git
- `main` → **produção**. Só recebe merge via PR vindo de `homolog`.
- `homolog` → **homologação**. Integra as branches de feature para teste conjunto antes de ir pra produção.
- `feature/<pessoa>` → **uma única branch por pessoa** (ex.: `feature/tiago`), reaproveitada para tudo que ela fizer. **Não criar uma branch nova por tarefa** — isso fragmenta o trabalho e gera branches demais.

Fluxo padrão: cada pessoa comita na sua `feature/<pessoa>` → PR para `homolog` → validação → PR → `main`. Sempre que terminar algo relevante, abrir PR de `feature/<pessoa>` para `homolog` em vez de deixar acumulando.
Nunca commitar direto em `main` ou `homolog`.
**Proibido `git push --force`** (ou qualquer variante, incluindo `--force-with-lease`) em qualquer branch — sobrescreve trabalho de outra pessoa/agente sem aviso. Se o push for rejeitado (`fetch first`), sempre `git fetch` + `merge` antes de reenviar.

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/), português, imperativo, curto.
Prefixos: `feat:` `fix:` `data:` `docs:` `chore:` `refactor:`.

## Dados
- Datasets brutos: `/data/raw`. Tratados: `/data/processed`.
- Não versionar arquivos >100MB sem Git LFS — preferir script de download à cópia do dataset.

## Outros links úteis
[FAQ dos participantes](https://www.spaceappschallenge.org/resources/participant-faqs/) · [Recursos gerais](https://www.spaceappschallenge.org/resources/) · [Agências parceiras 2026](https://www.spaceappschallenge.org/2026/space-agency-partners/) · [Ofertas globais](https://www.spaceappschallenge.org/2026/global-offers/) · [Space Apps Connect (GitHub)](https://github.com/nasa/spaceapps) · [Vencedores de 2025](https://www.spaceappschallenge.org/2025/awards/global-winners/)

## Convenção de programação
**Estrutura atual:** `web/Frontend/` tem o protótipo React + TS + Vite, com modo API. `web/Backend/` contém FastAPI, ingestão, repositórios PostgreSQL/PostGIS, Alembic, histórico mensal POWER e cenários beta opt-in. `web/API/` aponta para esse servidor, não é outro serviço. Primeiro piloto: Califórnia, confirmado por Ghabriel; Brasil depois. Ver `web/Backend/README.md`. Cenários beta são simulados e identificados; culturas e regras agronômicas de produção seguem pendentes.
Convenções de código e direção de arquitetura: [`docs/convencao_programacao.md`](docs/convencao_programacao.md). Ler antes de criar, alterar ou refatorar código; respeitar a distinção entre decisões e propostas futuras.

## Histórico sumário
Toda ação **relevante** deve ganhar uma linha em [`docs/historico_sumario.md`](docs/historico_sumario.md): data, pessoa/agente e descrição curta.
- **Relevante** (registrar): implementar um módulo (ex.: módulo de voz), decisão de arquitetura, integração de uma fonte de dados, mudança no fluxo de scoring, alteração estrutural do projeto.
- **Irrelevante** (não registrar): sincronizar repositório, ajuste de formatação, typo, commits triviais.

## Regras deste markdown
- Manter conciso: listas e tabelas, sem prosa longa. Detalhe extenso (ex.: descrição completa de cada fonte de dados) vai em `/docs`, não aqui.
- Qualquer decisão estrutural nova (branch, dataset, critério de submissão) deve ser refletida aqui, substituindo o que ficou obsoleto — não acumular histórico.
