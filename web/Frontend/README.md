# Frontend — protótipo visual

React + TypeScript + Vite, conforme [docs/convencao_programacao.md](../../docs/convencao_programacao.md).
Adaptado do protótipo HTML "Rotação Viva", com tom mais sóbrio, fotos reais com licença livre e acessibilidade revisada.

## Rodar

```bash
cd web/Frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # verifica tipos e gera dist/
```

Precisa do Node.js 20 ou mais recente.

## Estado atual

- **Somente dados fictícios (mock).** Ainda não há backend, banco nem consulta à NASA.
- **Avisos de "dados de exemplo" ficam desligados por padrão**, para avaliar o visual final. Ligue com `VITE_SINALIZAR_MOCK=true` em qualquer apresentação pública com mock (convenção §0.3: mock não pode parecer observação real).
- **Visual para quem lê pouco:** toda escolha e todo resultado têm pictograma + palavra curta (`src/components/Pictograma.tsx`, desenhos próprios). Rotação em faixa de figuras (`FaixaRotacao`), medidores de 3 tracinhos (`Medidor`), rosca da chuva (`GraficoRosca`) e resumo visual (`ResumoVisual`), também usado na impressão.
- A fonte dos dados é escolhida por `VITE_FONTE_DADOS` (`mock` ou `api`). Veja `.env.example`.
- Para ver os estados de tela no mock, acrescente à URL: `?simular=erro`, `?simular=dados_insuficientes`, `?simular=lento` ou `?simular=sem_gps`.
- O front **não** ordena nem pontua estratégias e **não** aplica regra agronômica. Ele só exibe o que a API devolver. A única conta feita no front é a soma da chuva nos meses de solo descoberto.

## Fluxo

1. **Início = localização.** Um botão grande, "Usar onde estou agora", que só pede o GPS depois do toque. Enquanto o navegador pergunta, aparece uma linha simples embaixo do botão: "Se o celular perguntar, toque em Permitir." Embaixo, um link discreto: "Prefiro escrever a cidade".
2. **Confirmação:** "Você está perto de Olímpia (SP). É aqui que fica a plantação?" Se não for, ou se o GPS falhar ou for negado, abre a busca de cidade, que não exige acento, com uma mensagem tranquila.
3. **Uma pergunta por tela, e tocar já avança:** cultura → tem máquina? → tem para quem vender? → tem irrigação? → algum problema (praga, produção caindo, preço) → o que é mais importante (até 2). Bolinhas no topo mostram "3 de 6".
4. **Resultado:** "O que os mapas mostram aí" (terra, terreno, risco de erosão e de seca, vindos dos dados). Com "Não é bem assim" o produtor corrige, e a análise é refeita. Depois vêm os caminhos, a comparação, o detalhe, a chuva e o resumo para imprimir.

Solo e relevo **não são mais perguntados**: vêm dos dados.

Telas de resultado enxutas: o essencial fica à mostra (faixa da rotação, 4 pontos, o que ganha, cuidados, pergunta ao agrônomo) e o resto fica em sanfonas fechadas (`Sanfona`). A comparação mostra 5 linhas e "Ver mais pontos". O resumo na tela é compacto; o impresso continua completo.

Narração ("Ouvir"): os roteiros são escritos à mão para serem ouvidos (`src/accessibility/roteiros.ts`). A fala é quebrada em frases, porque o Chrome corta fala longa, e usa uma voz pt-BR quando o aparelho tem.

## O que o back precisa fazer

Tudo está marcado no código com `BACKEND:`. Para achar:

```bash
grep -rn "BACKEND:" src
```

Resumo:

| Rota | Para quê |
|---|---|
| `GET /api/v1/culturas` | Lista de culturas; `tem_demonstracao=false` aparece como "Em breve". |
| `GET /api/v1/locais?latitude=&longitude=` | **Nova.** Coordenada do GPS → município (malha IBGE no PostGIS). 404 `fora_da_cobertura` fora do Brasil. |
| `GET /api/v1/municipios?busca=&limite=8` | **Nova.** Busca por nome, ignorando acento; devolve o centro do município. |
| `POST /api/v1/analises` | Recebe `AnaliseEntrada` (sem solo/relevo; com `origem_local`, `codigo_ibge` e `correcoes`) e devolve `Analise` com o novo bloco `talhao` (textura, relevo, declividade, risco de erosão e de seca, bases usadas). |

Exemplos completos de resposta: `src/api/mock/dadosMock.ts`. Os textos das estratégias são lidos em voz alta, por isso precisam ser escritos como fala de técnico de campo (ver o comentário em `Estrategia` em `src/api/tipos.ts`).

## Estrutura

```text
src/
├── api/              # tipos do contrato (snake_case), cliente e mock
│   ├── tipos.ts      # PROPOSTA de contrato: aprovar com o backend
│   ├── cliente.ts
│   └── mock/dadosMock.ts
├── accessibility/    # narração opcional e roteiros falados
├── components/       # componentes reutilizáveis
├── features/fluxo/   # telas e estado do fluxo
├── App.tsx
└── estilos.css
public/imagens/       # fotos; licenças em CREDITOS.md
```

## Pendências reais

- `docs/contrato_api.md` e `docs/dicionario_dados.md` ainda não existem. Os campos de `src/api/tipos.ts` são proposta e precisam ser aprovados por Ghabriel e Julya. Novidades desta versão: rotas `/locais` e `/municipios`, tipo `Local`, campos `origem_local`, `codigo_ibge`, `correcoes` e o bloco `talhao`; `textura_solo` e `relevo` saíram da entrada.
- Faltam fotos de amendoim e de erosão em solo brasileiro. O amendoim usa provisoriamente a foto orbital.
- Nome do produto, região e lista de culturas não estão definidos. O mock usa cana-de-açúcar só como exemplo.
- Os textos agronômicos do mock precisam de fonte (IAC, CATI, Embrapa, ZARC).
- O GPS no celular só funciona em site HTTPS (localhost funciona). A demo pública precisa estar hospedada com HTTPS.
- A narração ("Ouvir") é item futuro na convenção. Ela está aqui como opcional e precisa de aprovação para entrar no MVP.
- Não há testes automatizados ainda.
