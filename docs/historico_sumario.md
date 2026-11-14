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
