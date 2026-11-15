# BACKEND: o que o front já mostra, mas o back ainda não manda

> Para: **Tiago** e **Ghabriel**. Levantamento da Julya (front), atualizado em 15/11/2026, rodando o site em modo `api`
> com o back local na versão `e2988d1` da `features-tentativa` (já com as correções de solo, relevo e NDVI do Ghabriel).
> Nada foi alterado em `web/Backend`. A proposta sobre os problemas marcados (praga/nematoide etc.) está em
> `docs/proposta-motor-problemas.md`.

## Teste usado

`POST /api/v1/analises` com análise nova (sem reaproveitar resultado), prioridade "tratar o gado":

| Campo | S. J. do Rio Preto (-20,82, -49,38; cana) | Olímpia (-20,70, -48,96; cana) | Ames, EUA (42,10, -93,65; milho) |
|---|---|---|---|
| `talhao.textura_solo` | `media` | **null** | `media` ✅ |
| `talhao.relevo` | **null** | **null** | `suave_ondulado` ✅ |
| `talhao.declividade_pct` | **null** | **null** | `4.16` ✅ |
| `talhao.risco_erosao` | null (sem regra validada) | null | null |
| `estresse_vegetal` | ✅ | **ausente** (`sem_historico_pre_processado`) | ✅ |
| `estresse_termico` | **ausente** | **ausente** | **ausente** |
| `descricao_local` | **"Coordenada -20.8200, -49.3800"** | **"Coordenada -20.7000, -48.9600"** | "Coordenada 42.1000, -93.6500" |

`fontes_indisponiveis` relevantes: no Brasil, `srtm`, `soilgrids` e `grace` aparecem como `fora_da_regiao_pre_processada` para Olímpia; `openet:falha_fonte` nos dois pontos brasileiros (o OpenET cobre só os EUA, então talvez nem devesse ser consultado aqui).

## Pendências, por prioridade

1. **Relevo e declividade no Brasil** (Ghabriel/Tiago): nos EUA já vêm pelo USGS 3DEP. No Brasil continuam null. O SRTM está indexado, mas só na região pré-processada. Sugestão: declividade pelo SRTM (ou pela mesma lógica dos 5 pontos de elevação) para coordenadas brasileiras.
2. **`estresse_termico` (Calor)** (Tiago): contrato proposto em `web/Frontend/src/api/tipos.ts` (`EstresseTermico`, `CalorMensal`).
   - O front tem o item **Calor** e usa o campo em **Meses de atenção**; no modo `api` os dois ficam sem calor.
   - Referência de cálculo: `web/Frontend/src/api/mock/calorMock.ts` (NASA POWER T2M_MAX 1995–2025, dias acima de 35 °C por mês, meses de risco quando há calor forte em pelo menos metade dos anos). **O limiar de 35 °C é proposta, sem fonte agronômica por cultura.**
3. **`descricao_local` com o nome da cidade** (Ghabriel): mesmo com `codigo_ibge` e `origem_local=municipio`, volta "Coordenada …". O front mostra isso no topo e no resumo. Esperado: "Olímpia (SP)".
4. **Cobertura fora dos pontos preparados** (Tiago): em Olímpia, a ~45 km de S. J. do Rio Preto, faltam textura (SoilGrids), NDVI (MODIS) e GRACE (`fora_da_regiao_pre_processada` / `sem_historico_pre_processado`). Para a demonstração, vale pré-processar as cidades que vamos mostrar ou buscar ao vivo.
5. **`risco_erosao`**: continua null por falta de regra validada (o back avisa). Como erosão é problema-alvo do desafio, uma regra explicável marcada como estimativa (declividade × textura × chuva forte) ajudaria. Decisão de vocês.

6. **Textos do back na norma padrão** (Tiago): mensagens que aparecem na tela devem evitar "pra"/"pro". Exemplo em `web/Backend/app/services/analises.py`: "só existe catálogo real pra cana-de-açúcar" → "para cana-de-açúcar". O front já foi revisado ("Dá comida para o gado", sem "a gente").

## O que o front faz enquanto isso

- Campo null aparece como **"Sem dado"**; tipo de terra e relevo sem dado usam ícone cinza, não "?".
- Item do carrossel do clima sem dado **não aparece** (Calor; NDVI onde não há).
- Quando o back mandar os campos, o front mostra sozinho, sem mudar nada.
