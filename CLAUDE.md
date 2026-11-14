# FATESA — NASA Space Apps 2026
**Desafio:** [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/)

## Objetivo
Transformar 25+ anos de observações da Terra (NASA) + solo local + características de culturas + prioridades do agricultor em **estratégias de rotação de culturas ranqueadas e explicáveis** para uma fazenda específica.

## Problemas-alvo
- Fazenda: escassez de água, erosão, esgotamento de nutrientes.
- Cultura atual: consumo excessivo de água, doenças, conflito com mercado local, fora da janela ideal de plantio.

## Fontes de dados
SMAP (umidade do solo) · GPM/IMERG (precipitação) · ECOSTRESS (temp. superfície/estresse hídrico) · Landsat/MODIS/VIIRS (uso do solo e vegetação) · NASA POWER (clima) · GRACE/GRACE-FO (água subterrânea) · SRTM (topografia) · USDA SSURGO/CDL/NASS, PRISM, FAO GAEZ (contexto agrícola local). Lista completa de recursos: [tab=resources](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources).

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

## Regras deste markdown
- Manter conciso: listas e tabelas, sem prosa longa.
- Qualquer decisão estrutural nova (branch, dataset, critério de submissão) deve ser refletida aqui, substituindo o que ficou obsoleto — não acumular histórico.
