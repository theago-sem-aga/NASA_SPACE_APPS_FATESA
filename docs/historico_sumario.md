# Histórico sumário

Log de ações relevantes do projeto, em ordem cronológica. Cada entrada é curta — detalhe fica no commit/PR, não aqui.

Formato: `- **AAAA-MM-DD** _pessoa (agente)_: descrição da ação.`

---

- **2026-11-14** _Julya (Claude)_: cria o `CLAUDE.md`, arquivo de contexto compartilhado do projeto, com resumo do desafio Field Shift e descrição das 26 bases de dados oficiais (conteúdo, uso no projeto, cobertura e resolução).
- **2026-11-14** _Julya (Claude)_: adiciona os links oficiais do desafio Field Shift, do evento local (São José do Rio Preto), da página da equipe e de cada base de dados.
- **2026-11-14** _Tiago (Claude)_: estrutura o contexto do projeto no `CLAUDE.md` (desafio, dados, objetivo, problemas-alvo, análises exigidas, entregável, submissão, equipe) e define o fluxo Git `feature/*` → `homolog` → `main`.
- **2026-11-14** _Julya (Claude)_: mapeia as fontes de dados por tema, priorizando bases globais, e adiciona fontes brasileiras para temas sem cobertura na lista oficial (IBGE SIDRA, Conab, ANA, MapBiomas).
- **2026-11-14** _Tiago (Claude)_: move o detalhe das fontes de dados para `docs/fontes-dados.md`, deixando o `CLAUDE.md` enxuto.
- **2026-11-14** _Julya (Claude)_: classifica as 26 bases por origem: 10 da NASA, 2 de agências parceiras (ESA/Copernicus) e 14 de outras instituições.
- **2026-11-14** _Tiago (Claude)_: define a macro-visão do planejamento no `CLAUDE.md` (objetivo principal, opcionais, requisitos e obstáculos).
- **2026-11-14** _Tiago (Claude)_: cria este histórico sumário e a regra de registro de ações relevantes para todos os agentes.
- **2026-11-14** _Ghabriel (Codex)_: organiza o contexto de convenções de programação e arquitetura em `docs/convencao_programacao.md` e adiciona referência no `CLAUDE.md`.
- **2026-11-14** _Tiago (Claude)_: proíbe `git push --force` (inclusive `--force-with-lease`) no fluxo Git; push rejeitado deve ser resolvido com `fetch` + `merge`.
- **2026-11-14** _Ghabriel (Codex)_: adiciona placeholders documentados em `web/`, `front/` e `back/` para compartilhar a estrutura inicial com a equipe, sem aplicação implementada.
- **2026-11-14** _Ghabriel (Codex)_: corrige os placeholders para as pastas existentes `web/Frontend/` e `web/Backend/` e inclui `web/API/`.
- **2026-11-14** _Tiago (Claude)_: define regiao piloto do prototipo (Condado de Fresno, CA) e a estrategia de indexacao espacial (recorte na ingestao + PostGIS), registradas em docs/convencao_programacao.md.
- **2026-11-14** _Tiago (Claude)_: documenta em docs/convencao_programacao.md a estrategia de acesso a dados (API ao vivo x arquivo pre-indexado), o contrato entre ingestao e API, e atualiza a tabela de responsaveis (Thiago no frontend).
- **2026-11-14** _Tiago (Claude)_: implementa cliente ao vivo da NASA POWER e o pipeline de indexacao espacial (0,1 grau, Parquet); ingere GPM real para a regiao piloto (16 celulas, Fresno County) apos autorizar o app GESDISC no Earthdata.
- **2026-11-14** _Tiago (Claude)_: corrige fluxo git no CLAUDE.md para uma branch persistente por pessoa (nao uma por tarefa); apaga branches ja mescladas e renomeia feature/<pessoa>/setup para feature/<pessoa>.
- **2026-11-14** _Tiago (Claude)_: implementa ingestao do SMAP (umidade do solo, grade EASE-2) para a regiao piloto, apos destravar autenticacao via .netrc (usuario/senha) no NSIDC/Earthdata Cloud; 1 celula real gravada para 2023-01-01.
- **2026-11-14** _Tiago (Claude)_: instala e configura PostgreSQL 17 + PostGIS 3.6 localmente (corrige DLL libwinpthread-1 faltante), cria o banco fatesa e a tabela indice_espacial real; migra o manifesto em Parquet para ela e corrige a consulta de ST_Contains para ST_Intersects (coordenadas redondas caem na borda da celula).
- **2026-11-14** _Tiago (Claude)_: implementa ingestao do SRTM (elevacao) para a regiao piloto; corrige bug de performance (registrar_celula sendo chamado por pixel em vez de por celula) que travava o pipeline; 20 celulas reais migradas para o PostGIS.
- **2026-11-14** _Thiago (Claude)_: cria o protótipo visual do front em `web/Frontend/` (React + TypeScript + Vite) a partir do HTML "Rotação Viva": 8 telas, mock rotulado com contrato proposto em `src/api/tipos.ts`, fotos reais com licença livre, estados de carregando/erro/dados insuficientes e acessibilidade revisada.
- **2026-11-14** _Thiago (Claude)_: amplia o protótipo do front para cobrir lacunas do desafio: tela do talhão (solo, relevo, problemas, recursos), por que/lacunas/confiança por estratégia, comparação lado a lado, glossário "?", resumo imprimível e textos humanizados com referências a conferir.
- **2026-11-14** _Thiago (Claude)_: deixa o front mais visual para usuários com pouca leitura: pictogramas próprios em todas as escolhas e resultados, faixa da rotação, painel "num olhar", rosca da chuva e resumo visual (tela e impressão). Avisos de mock passam a depender de `VITE_SINALIZAR_MOCK`.
