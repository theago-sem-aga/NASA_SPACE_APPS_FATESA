# Decisões de arquitetura

## 2026-11-14 — entrega beta do backend

- Ghabriel confirmou Califórnia como primeira entrega; adaptação do frontend e
  Brasil ficam para depois. Pediu avançar o máximo no backend e listar pendências.
- Codex mantém API e ingestão em `web/Backend`, com módulos de domínio,
  integração e repositórios. Nenhum segundo servidor em `web/API`.
- GET de variáveis preservado; POST e recuperação por UUID acrescentados.
- PostgreSQL/PostGIS para operação real; SQLAlchemy e Alembic para persistência
  e evolução do produto. SQLite exclusivamente em testes isolados.
- Cenários exploratórios locais são opt-in, `eh_mock=true`; sem ativação, não há
  recomendações inventadas. Não aprova culturas, limiares ou regras de produção.
- Referência piloto retorna CA e código IBGE vazio; não inventa município
  brasileiro para coordenadas da Califórnia. Front mantém os mesmos nomes JSON.
- Versão do motor, entrada, coleta, clima e resposta são preservados no snapshot.
- Proposta técnica de agregação histórica: média dos totais mensais POWER, com
  verificação explícita de unidade e completude, período padrão 1991–2020.
- Instalações locais autorizadas pelo pedido: ambiente virtual, dependências,
  PostgreSQL 17 e PostGIS 3.7. Credencial aleatória somente em `.env` ignorado.

Alternativas adiadas: microserviços, fila, geocodificação externa e malha IBGE.
Impacto no frontend: rotas descobertas via OpenAPI passam a responder; dados
simulados seguem sinalizados. A decisão agronômica final permanece pendente.
