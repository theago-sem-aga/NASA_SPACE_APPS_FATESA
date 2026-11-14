# Frontend — protótipo visual

React + TypeScript + Vite, conforme [docs/convencao_programacao.md](../docs/convencao_programacao.md).
Adaptado do protótipo HTML "Rotação Viva", com tom mais sóbrio, fotos reais com licença livre e acessibilidade revisada.

## Rodar

```bash
cd front
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
- Para ver os estados de tela no mock, acrescente à URL: `?simular=erro`, `?simular=dados_insuficientes` ou `?simular=lento`.
- O front **não** ordena nem pontua estratégias e **não** aplica regra agronômica. Ele só exibe o que a API devolver. A única conta feita no front é a soma da chuva nos meses de solo descoberto.

## Fluxo (10 telas)

Início → onde fica → o que está plantado → **como é o talhão** (solo, relevo, problemas, máquina/comprador/irrigação) → o que importa (2 das 6 prioridades do desafio) → caminhos (≥3, incluindo a prática atual) → **comparação lado a lado** → detalhe → chuva do local → antes de decidir (com **resumo para imprimir/PDF**).

O detalhe de cada caminho mostra: por que apareceu, para que serve, calendário de cobertura do solo, o que precisa ter (cruzado com as respostas do produtor), em que se baseia, o que pode ganhar, o que pode dar errado, **o que a ferramenta ainda não sabe**, **nível de confiança** e referências a conferir.

Termos técnicos têm um botão "?" com explicação curta (`src/accessibility/glossario.ts`).

Os textos do mock imitam a conversa com um técnico de campo e citam práticas reais da reforma de canavial em SP (amendoim, crotalária, pousio). Ainda são **placeholders**: as referências **não foram verificadas** (ver comentário no topo de `src/api/mock/dadosMock.ts`).

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

- `docs/contrato_api.md` e `docs/dicionario_dados.md` ainda não existem. Os campos de `src/api/tipos.ts` são proposta e precisam ser aprovados por Ghabriel e Julya. Campos novos nesta versão: `textura_solo`, `relevo`, `problemas`, `recursos_disponiveis`, `motivos`, `lacunas`, `confianca`, `explicacao_confianca`, `requisitos`, `atributos`, `referencias`, `etapas_rotacao`.
- Faltam fotos de amendoim e de erosão em solo brasileiro. O amendoim usa provisoriamente a foto orbital.
- Nome do produto, região e lista de culturas não estão definidos. O mock usa cana-de-açúcar só como exemplo.
- Os textos agronômicos do mock precisam de fonte (IAC, CATI, Embrapa, ZARC).
- A narração ("Ouvir esta tela") é item futuro na convenção. Ela está aqui como opcional e precisa de aprovação para entrar no MVP.
- Não há testes automatizados ainda.
