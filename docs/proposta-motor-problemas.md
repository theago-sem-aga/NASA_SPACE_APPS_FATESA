# BACKEND: o motor de decisão ainda não usa os problemas marcados

> Proposta da Julya (front) para o Tiago (backend). Nada foi alterado em `web/Backend`. A decisão sobre a regra é do backend.

## O problema (visto testando o site)

- A tela "problemas" pergunta: *A cana está produzindo menos*, *Tem praga ou nematoide*, *O preço está ruim*.
- `motor_decisao.sugerir(prioridades, recursos, codigo_ibge)` **não recebe os problemas**. A tabela do modo sem servidor (`estrategiasMotor.ts`, chave `prioridades|recursos|ibge`) também não.
- Resultado: marcar um problema não muda nenhum caminho. Exemplo: **praga/nematoide + "tratar o gado"** devolve sorgo (quebra de pragas `baixo`) e milheto (`medio`). A crotalária, que tem quebra de pragas `alto` e é citada no próprio catálogo para baixar nematoide, fica de fora.
- Para quem usa o site, isso parece "sempre a mesma resposta, não resolve meu problema".

## O que o front já faz (só exibição, sem mudar a escolha)

- Em cada cartão de caminho, mostra se ele ajuda no problema marcado, lendo o atributo que já vem do catálogo:

  | Problema | Atributo lido |
  |---|---|
  | `nematoides_pragas` | `quebra_pragas` |
  | `solo_cansado` | `materia_organica` |
  | `preco_baixo` | `renda_direta` |

  A tradução para o texto é: `alto` = "ajuda bastante", `medio` = "ajuda", `baixo` = "ajuda pouco", `nenhum` = "não ajuda".
- A prática atual (pousio) aparece **por último**, com a etiqueta "O jeito de hoje, para comparar". Os outros caminhos mantêm a ordem do motor.

## Proposta para o motor

1. **Entrada:** adicionar `problemas: list[str]` a `sugerir(...)` e ao `POST /api/v1/analises`. O campo já existe em `AnaliseEntrada.problemas` no front.
2. **Pontuação:** cada problema soma pontos pelo atributo ligado a ele, igual às prioridades. Por exemplo, `PROBLEMA_ATRIBUTO = {"nematoides_pragas": "quebra_pragas", "solo_cansado": "materia_organica", "preco_baixo": "renda_direta"}`, com o mesmo `nivel()`.
3. **Garantia mínima (sugestão):** se marcou `nematoides_pragas`, pelo menos um dos caminhos sugeridos (fora o atual) deve ter `quebra_pragas >= medio`. Se nenhum dos escolhidos tiver, troca o último pelo melhor nisso que não foi excluído por recurso ou ZARC.
4. **Explicação:** devolver `problemas_que_contam` por caminho, igual a `prioridades_que_contam`, para o texto "Combina com o que você escolheu".
5. **Tabela do modo sem servidor:** incluir os problemas na chave, por exemplo `prioridades|problemas|recursos|ibge`. Hoje são 352 chaves; com os 3 problemas viram até 8 vezes mais. Se ficar grande demais, dá para limitar o efeito a `nematoides_pragas`.

## Cuidados

- O peso de cada problema e a garantia mínima são **proposta**, sem fonte agronômica. Precisam de validação com especialista, como os outros limiares.
- O caminho atual continua sempre presente, como pede o desafio (≥ 3 estratégias, incluindo a atual).
