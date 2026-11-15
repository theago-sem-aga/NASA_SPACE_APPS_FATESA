# Backend — piloto Fresno

FastAPI + PostgreSQL/PostGIS, com ingestão existente preservada e contratos
snake_case compartilhados com `web/Frontend/src/api/tipos.ts`.

## Executar neste computador

Na raiz do projeto (PowerShell):

```powershell
& ./web/Backend/scripts/iniciar_backend.ps1
```

API: http://127.0.0.1:8000 · Swagger: http://127.0.0.1:8000/docs.
O script não abre acesso público e omite o access log para não registrar coordenadas
de query strings. Ctrl+C encerra a API, sem parar o serviço PostgreSQL.

Frontend, em outro terminal:

```powershell
cd web/Frontend
npm.cmd run dev
```

Neste dispositivo o `.env.local` do frontend foi configurado como `api` e o beta
local foi habilitado em `web/.env`. Nenhuma credencial é versionada.
O catálogo só habilita `milho` para explorar cenários simulados; ele não declara
aptidão regional nem uma lista de culturas aprovada para produção.
Na busca, use `Califórnia` ou `Fresno`. GPS brasileiro fica fora do piloto.

## Instalação reproduzível

Requisitos: Python compatível com as wheels científicas, Node para o frontend,
PostgreSQL com PostGIS. Ambiente validado: Python 3.14, PostgreSQL 17, PostGIS 3.7.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r web/Backend/requirements_lock.txt
```

O lock contém as versões efetivamente instaladas, incluindo ferramentas de teste.
Alternativa para resolver versões: `requirements_dev.txt`.
Copie `web/.env.example` para `web/.env` se ele não existir e configure DATABASE_URL.
Não sobrescreva um `.env` existente. Banco normal é PostgreSQL, sem fallback SQLite.
SQLite só é usado isoladamente em testes de persistência.

Na pasta `web/Backend`:

```powershell
..\..\.venv\Scripts\python.exe -m app.preparar_banco
..\..\.venv\Scripts\python.exe -m pytest -q
..\..\.venv\Scripts\python.exe -m app.verificar_demo
```

Preparar banco cria o banco se ausente (exige privilégio de criação), habilita
PostGIS, aplica Alembic e importa o manifesto existente (60 células no momento).
Reexecutar não remove análises nem datasets. Em produção, executar migrações com
credencial administrativa separada, e conceder à aplicação somente os acessos necessários.
`verificar_demo` usa fontes externas reais, grava uma análise e testa sua recuperação;
o relatório local fica em `.cache/analise_demo.json` e não entra no Git.

## Rotas

| Método | Caminho | Resultado |
|---|---|---|
| GET | `/api/v1/health` | Processo disponível |
| GET | `/api/v1/prontidao` | Persistência disponível e migrada |
| GET | `/api/v1/culturas` | Catálogo e disponibilidade do beta |
| GET | `/api/v1/locais?latitude=36.6&longitude=-119.7` | Identificação do recorte piloto |
| GET | `/api/v1/municipios?busca=california&limite=8` | Uma referência piloto, não cadastro brasileiro |
| GET | `/api/v1/analises?latitude=36.6&longitude=-119.7` | Variáveis reais e indisponibilidades por fonte |
| POST | `/api/v1/analises` | Análise persistida (201), com ou sem cenários beta |
| GET | `/api/v1/analises/{analise_id}` | Snapshot salvo, sem novas consultas externas |

Exemplo de entrada:

```json
{
  "latitude": 36.6,
  "longitude": -119.7,
  "origem_local": "gps",
  "codigo_ibge": null,
  "cultura_atual_id": "milho",
  "problemas": [],
  "recursos_disponiveis": {
    "maquinas_graos": "nao_sei",
    "comprador_graos": "nao_sei",
    "irrigacao": "nao_sei"
  },
  "prioridades": ["reducao_erosao", "materia_organica"],
  "correcoes": {}
}
```

## Dados e limites

POWER histórico: 1991–2020 por padrão, configurável. Série mensal original,
metadados, extração e hash ficam preservados no cache local e no snapshot salvo.
Chuva média diária mensal (`mm/day`) é multiplicada pelo número de dias do mês
de cada ano, inclusive bissextos, antes de calcular a média dos acumulados.
Um mês só ganha valor se todos os anos solicitados forem válidos. Umidade
radicular, declividade e classes de risco ficam null até existir método validado.

As fontes são consultadas concorrentemente. Cada consulta tem timeout configurável
e no máximo uma repetição de conexão/status temporário; não se repete timeout de
leitura. USDA pode fazer duas consultas sequenciais. Cache limita chamadas repetidas.
Primeira consulta pode demorar; pré-aqueça com `app.verificar_demo` antes da demo.
Não há fila nem contrato de jobs assíncronos nesta versão.

`HABILITAR_CENARIOS_BETA=false` é o padrão distribuído: nenhuma estratégia é
fabricada. `true` ativa três hipóteses para testar as telas, com `eh_mock=true`,
confiança baixa e avisos de simulação. Calendário e níveis não são recomendações
locais; a referência marcada `eh_pratica_atual` é explicitamente hipotética,
pois o formulário ainda não coleta o manejo atual.
O clima real é comparado ao calendário hipotético apenas por aritmética da chuva.

OpenET exige chave local. NASS permanece sem integração por coordenada.
Sem login/autorização, manter a API restrita à demonstração local.

## Organização

`api`/`schemas`: HTTP e contratos; `services`: orquestração e cache;
`domain`: cenários determinísticos; `repositories`: banco/arquivos;
`integrations`: consultas externas; `pipelines`: ingestão existente;
`migrations`: evolução das tabelas do produto; `tests`: verificações automatizadas.

Pendências detalhadas: [docs/pendencias_backend.md](../../docs/pendencias_backend.md).

## Verificação executada nesta entrega

- 26 testes automatizados aprovados; Ruff passou no escopo da entrega (API, domínio,
  repositórios, schemas, serviços, configuração, clientes alterados, testes e migrações).
  A checagem geral ainda aponta 13 problemas nos pipelines legados e no cliente NASS.
  A checagem de dependências passou.
- Preparação do banco repetida sem alterar datasets: 60 células no PostGIS.
- POST e GET por ID verificados com fontes/banco reais e também por HTTP local;
  resposta 201, CORS presente e snapshot recuperado.
- Série POWER de 1991–2020: 12 meses com 30 valores anuais válidos por mês.
- Resultado JSON gerado compilou contra Analise do frontend; build React passou.
- OpenET sem chave e SMAP fora da célula do ponto exato foram reportados como
  indisponíveis. Não houve teste de UI no navegador nem validação agronômica.
- A biblioteca atual de testes emite aviso de depreciação sobre TestClient/httpx;
  os testes passaram, mas essa combinação deve ser revista em atualização futura.

## Acompanhamento por satélite e dados de São José do Rio Preto (Matheus)

- `GET /api/v1/acompanhamento?latitude=&longitude=` — fotos Sentinel-2 do ponto do GPS (não precisa de banco nem de chave; primeira consulta de um ponto ~30 s, depois cache por 3 dias). Ver `docs/contrato_api.md`.
- Pipelines e modelos de São José do Rio Preto (`REGIAO_PILOTO=sjrp`), motor de decisão com ZARC e modelo produtividade x clima: `app/pipelines/`, `app/modelos/`, testes em `tests/test_motor_decisao.py` e `tests/test_produtividade_clima.py`.
