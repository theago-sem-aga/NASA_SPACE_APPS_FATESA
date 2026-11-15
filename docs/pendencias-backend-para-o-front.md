# BACKEND: o que o front já mostra, mas o back ainda não manda

> Levantamento da Julya (front) em 15/11/2026, rodando o site em modo `api` com o back local na versão `79c8d0b` da `features-tentativa`.
> Nada foi alterado em `web/Backend`. Cada item diz o que falta, onde o front usa e o que aparece hoje na tela.
> A proposta sobre os problemas marcados (praga/nematoide etc.) está em `docs/proposta-motor-problemas.md`.

## Teste usado

`POST /api/v1/analises` com `origem_local=municipio` e prioridade "tratar o gado", em três pontos:

| Campo de `talhao` | S. J. do Rio Preto (-20,82, -49,38; cana) | Olímpia (-20,70, -48,96; cana) | Ames, EUA (42,10, -93,65; milho) |
|---|---|---|---|
| `textura_solo` | `media` | **null** | **null** |
| `relevo` | **null** | **null** | **null** |
| `declividade_pct` | **null** | **null** | **null** |
| `risco_erosao` | **null** | **null** | **null** |
| `risco_seca` | `nenhum` | `medio` | `nenhum` |
| `risco_geada` | `baixo` | `baixo` | `alto` |

## Pendências

1. **`estresse_termico` (Calor)**: proposta de contrato em `web/Frontend/src/api/tipos.ts` (`EstresseTermico`, `CalorMensal`).
   - O front tem o item **Calor** (maior máxima de cada mês, meses de risco) e usa o campo em **Meses de atenção**.
   - Hoje o back não manda o campo. No modo `api` o Calor some do carrossel, e "Meses de atenção" fica sem os meses de calor.
   - Referência do cálculo: `calorMock.ts`, com NASA POWER T2M_MAX 1995–2025, dias acima de 35 °C por mês e meses de risco quando há calor forte em pelo menos metade dos anos. **O limiar de 35 °C é proposta, sem fonte agronômica por cultura.**
2. **`relevo` e `declividade_pct` sempre null**, inclusive no Brasil. O histórico registra "declividade real (USGS 3DEP)", que cobre só os EUA, mas veio null também em Ames. Falta o relevo pelo SRTM no Brasil, e conferir o 3DEP nos EUA.
3. **`risco_erosao` sempre null.** O próprio back avisa: "Risco de erosão ainda não tem regra validada". O front mostra "Sem dado". Como erosão é um problema-alvo do desafio, vale ter uma regra explicável, por exemplo declividade × textura × chuva forte, marcada como estimativa.
4. **`textura_solo` null em Olímpia e em Ames.** Veio só em São José do Rio Preto. Conferir a cobertura do SoilGrids no Brasil e a do USDA Soil Data Access nos EUA.
5. **`estresse_vegetal` (NDVI) ausente em Ames.** No Brasil funciona. Conferir o MODIS/ORNL para coordenadas dos EUA fora de Fresno.

## O que o front faz enquanto isso

- Campo null aparece como **"Sem dado"**. Nas fichas de tipo de terra e relevo, o ícone é cinza ("sem dado") em vez de "?".
- Item do carrossel do clima sem dado **não aparece**, como Calor e NDVI.
- Quando o back mandar os campos, o front mostra sozinho, sem precisar mudar nada.
