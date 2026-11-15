# BACKEND: regra para o ranking atender às necessidades do agricultor

> Para: **Tiago** (e Ghabriel). Proposta da Julya (front), 15/11/2026. **Nada foi alterado em `web/Backend`.**
> A implementação e a decisão final são do back. Os pesos são **proposta da equipe, sem fonte agronômica**, e precisam de
> validação de agrônomo, como os outros limiares. Complementa `docs/proposta-motor-problemas.md`.

## Princípio

1. **A necessidade do agricultor vem primeiro.** O que ele escolheu (prioridades) e o que marcou (problemas) decide a
   ordem. Os dados da área **só desempatam ou invertem quando a diferença é pequena**: nunca devem colocar à frente um
   caminho que não atende ao que ele pediu.
2. **Todo caminho sugerido precisa atender a algo que o agricultor escolheu.** Se não houver caminhos suficientes, o que
   completa a lista aparece **marcado como "não atende diretamente"**, em vez de parecer resposta.
3. **O ranking tem de ser explicável:** a pontuação e o motivo de cada parte vão para a tela.

## O que acontece hoje (`motor_decisao.sugerir`, testado com o catálogo real)

- Pontos = nível do atributo ligado a cada prioridade (0 a 3), +1 se o catálogo marca a prioridade como "indicada".
- **Não entram:** problemas marcados, dados da área (terreno, seca, chuva forte, calor), pontos ruins do caminho.
- **Não há mínimo:** "Ter renda" sem máquina sugere milheto com **0 ponto de renda** como se atendesse.
- **Áreas diferentes dão o mesmo ranking:** S. J. do Rio Preto (5,7% de declividade) e Olímpia (9,7%, ondulado).
- Desempate final pela ordem do arquivo; pontuação não vai para a tela.

## Regra proposta

**Entradas** (todas já existem no POST ou na análise): `prioridades`, `problemas`, `recursos_disponiveis`, `codigo_ibge`
(ZARC), `talhao.declividade_pct`, `talhao.risco_seca`, `precipitacao_extrema.meses_com_risco`, `tendencia_hidrica.tendencia`,
`clima_mensal` (chuva de cada mês) e o calendário de cada caminho.

**Pontuação de cada caminho** (o pousio continua fora da conta e sempre presente, como hoje):

| Parte | Pontos | Por quê |
|---|---|---|
| Cada **prioridade** escolhida | **3 × nível** do atributo ligado (0–3) **+ 1** se o catálogo a marca como indicada | Pesa mais que tudo; o +1 guarda a curadoria (ex.: milheto e sorgo aguentam veranico) |
| Cada **problema** marcado | **2 × nível** do atributo ligado: praga/nematoide → `quebra_pragas`; produção caindo → `materia_organica`; preço ruim → `renda_direta` | Necessidade dita pelo agricultor, um pouco abaixo da prioridade |
| **Área: terreno ou chuva forte** (declividade ≥ 8% ou meses de chuva extrema) | **+ nível** de `protecao_solo` | Contexto real: terreno inclinado pede cobertura |
| **Área: seca** (`risco_seca` médio/alto ou tendência "secando") | **+ (3 − nível)** de `demanda_agua` | Contexto real: área secando pede caminho que gasta pouca água |
| **Desconto: trabalho e gasto alto** | **−1** | O lado ruim passa a contar mesmo sem ser escolhido |
| **Desconto: terra descoberta em mês de chuva forte** (≥ 100 mm no mês, pela chuva real do lugar) | **−1 por mês**, até −2 | Erosão no período mais perigoso |

**Mínimo para entrar:** a soma das partes de **prioridade + problema** tem de ser **≥ 3**. Quem não alcança só entra
para completar a lista, com `atende_ao_agricultor = false` e o motivo "não atende diretamente ao que você escolheu".

**Garantia de praga:** se marcou praga/nematoide, pelo menos um caminho sugerido (fora o pousio) tem `quebra_pragas ≥ médio`
(como em `proposta-motor-problemas.md`).

**Desempate**, nesta ordem: menos trabalho e gasto → menor risco de perda do ZARC → mais confiança → `estrategia_id`
(não a ordem do arquivo).

**Saída explicável** (campos novos sugeridos em `Estrategia`, o front passa a mostrar):
`pontuacao` (número), `pontuacao_detalhe` (lista `{motivo, pontos}`), `atende_ao_agricultor` (bool),
`problemas_que_contam` (igual a `prioridades_que_contam`).

## Testes esperados (protótipo da regra rodado com o catálogo real e os dados reais da área)

| Caso | Hoje | Proposta | Por que faz sentido |
|---|---|---|---|
| Ter renda (SJRP) | amendoim 4, soja 4 | **amendoim 9, soja 9** | Os dois que dão renda continuam na frente, mesmo com os descontos |
| Ter renda **sem máquina** (SJRP) | sorgo 2, milheto **0** | **sorgo 7** (atende); milheto **marcado "não atende diretamente"** | Não finge que o milheto dá renda |
| Tratar o gado (SJRP) | sorgo 4, milheto 3 | **sorgo 11, milheto 9** | Sorgo é o caminho do gado |
| Tratar o gado (**Olímpia**, 9,7%) | sorgo 4, milheto 3 (igual a SJRP) | **sorgo 13, milheto 12** | Terreno ondulado aproxima o milheto, que segura mais a terra; a área passa a contar |
| Tratar o gado + **praga/nematoide** (SJRP) | sorgo 4, milheto 3 (praga ignorada) | **milheto 13, sorgo 13** (desempate: menos trabalho) | Milheto atende o gado e ajuda mais contra praga |
| Gastar menos adubo + produção caindo (SJRP) | crotalária 4, mucuna 4 | **crotalária 18, mucuna 18** | Leguminosas e mais matéria orgânica |
| Aguentar a seca (SJRP) | milheto 3, sorgo 3 | **milheto 9, crotalária 8** | Sorgo perde 1 por deixar a terra descoberta em fevereiro, mês de chuva forte |
| Nenhuma prioridade (Olímpia) | milheto 8, crotalária 8 | milheto 25, crotalária 25 | Igual a hoje: padrão segurar a terra + terra mais rica |

Detalhe de um caso (Tratar o gado + praga, SJRP): milheto = prioridade +7, praga +4, seca +2 = **13**;
sorgo = prioridade +10, praga +2, seca +2, terra descoberta em fevereiro −1 = **13**; crotalária = 0 + 6 + 2 = **8**.

## Limites e o que precisa de validação

- Pesos (3, 2, 1), mínimo 3, corte de 8% de declividade e 100 mm de chuva forte são **proposta, sem fonte agronômica**.
- Os níveis do catálogo continuam atribuídos à mão; a regra só fica tão boa quanto eles.
- Para as culturas do motor beta (fora a cana) a regra não se aplica até existir catálogo real.
- Quando implementar, regenerar a tabela do modo sem servidor (`estrategiasMotor.ts`) a partir da mesma regra.
