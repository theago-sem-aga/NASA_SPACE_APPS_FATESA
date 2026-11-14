# FATESA — NASA Space Apps 2026

**Desafio:** [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) · **Evento:** 14–15/11/2026 (48h) · [Evento local — São José do Rio Preto](https://www.spaceappschallenge.org/2026/local-events/sao-jose-do-rio-preto/) · [Página da equipe](https://www.spaceappschallenge.org/2026/find-a-team/fatesa/)

> Carregado automaticamente em toda sessão (Claude ou Codex) aberta no repositório. Mantenha conciso — detalhe extenso vai em `/docs`.

## Objetivo
Transformar 25+ anos de observações da Terra (NASA) + solo local + características de culturas + prioridades do agricultor em **estratégias de rotação de culturas ranqueadas e explicáveis** para uma fazenda específica, resilientes a mudanças de temperatura, chuva e água.

## Problemas-alvo
- Fazenda: escassez de água, erosão, esgotamento de nutrientes.
- Cultura atual: consumo excessivo de água, doenças, conflito com mercado local, fora da janela ideal de plantio.

## Fontes de dados
Tabela completa + descrição de cada base: [`docs/fontes-dados.md`](docs/fontes-dados.md).
**Atenção Brasil:** várias bases oficiais cobrem só os EUA — priorizar as 🌎 Global (SMAP, GPM/IMERG, Landsat, MODIS/VIIRS, NASA POWER, SRTM, ECOSTRESS, GEDI, GLDAS, FAO GAEZ, Sentinel-2, ERA5). Caminho mais rápido para protótipo: **NASA POWER** (sem login) + **FAO GAEZ**.

## Análises exigidas
- Temperatura, estresse térmico, risco de geada.
- Precipitação (normal e extrema), tendência hídrica de longo prazo.
- Umidade do solo, evapotranspiração, estresse vegetal.
- Cruzar característica da cultura x prioridade do agricultor: uso de água, valor de forragem, fixação de N, redução de erosão, matéria orgânica, adequação ao mercado.

## Entregável da solução
- Apontar janelas vazias no campo e estações de maior vulnerabilidade da cultura atual.
- **≥3 estratégias de rotação** (incluindo a atual existente), cada uma com: objetivo, evidência, benefícios, riscos que exigem validação local (agricultor/especialista).

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
- `feature/<pessoa>/<descricao-curta>` → uma branch por pessoa/tarefa (ex.: `feature/tiago/ingestao-smap`).

Fluxo padrão: `feature/*` → PR → `homolog` → validação → PR → `main`.
Nunca commitar direto em `main` ou `homolog`.

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/), português, imperativo, curto.
Prefixos: `feat:` `fix:` `data:` `docs:` `chore:` `refactor:`.

## Dados
- Datasets brutos: `/data/raw`. Tratados: `/data/processed`.
- Não versionar arquivos >100MB sem Git LFS — preferir script de download à cópia do dataset.

## Outros links úteis
[FAQ dos participantes](https://www.spaceappschallenge.org/resources/participant-faqs/) · [Recursos gerais](https://www.spaceappschallenge.org/resources/) · [Agências parceiras 2026](https://www.spaceappschallenge.org/2026/space-agency-partners/) · [Ofertas globais](https://www.spaceappschallenge.org/2026/global-offers/) · [Space Apps Connect (GitHub)](https://github.com/nasa/spaceapps) · [Vencedores de 2025](https://www.spaceappschallenge.org/2025/awards/global-winners/)

## Regras deste markdown
- Manter conciso: listas e tabelas, sem prosa longa. Detalhe extenso (ex.: descrição completa de cada fonte de dados) vai em `/docs`, não aqui.
- Qualquer decisão estrutural nova (branch, dataset, critério de submissão) deve ser refletida aqui, substituindo o que ficou obsoleto — não acumular histórico.
