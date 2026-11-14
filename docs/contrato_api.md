# Contrato de API — Field Shift

> Primeira versão real, implementada (não é só proposta). Ver `docs/convencao_programacao.md` seção 6 para as regras gerais e seção 10 para o registro da decisão de quem implementou o quê.

## GET /api/v1/health

Verificação simples de que a API está no ar.

**Response 200:**
```json
{"status": "ok"}
```

## GET /api/v1/analises

Recebe uma coordenada e devolve todas as variáveis disponíveis (ao vivo + pré-indexadas), **abstraídas num formato único** — o chamador não precisa saber de qual fonte cada variável vem para correlacionar entre elas (ex.: cruzar `precipitacao_acumulada_mm` com `umidade_solo_cm3_cm3`).

**Request (query params):**
| Campo | Tipo | Obrigatório | Faixa |
|---|---|---|---|
| `latitude` | float | sim | -90 a 90 |
| `longitude` | float | sim | -180 a 180 |

**Response 200:**
```json
{
  "latitude": 36.6,
  "longitude": -119.7,
  "variaveis": [
    {
      "nome": "temperatura_media_c",
      "fonte": "nasa_power",
      "tipo_acesso": "ao_vivo",
      "data": "2026-11-07",
      "valor": 18.4
    },
    {
      "nome": "precipitacao_acumulada_mm",
      "fonte": "gpm",
      "tipo_acesso": "pre_processado",
      "data": "2023-01-01",
      "valor": 7.245
    }
  ],
  "fontes_indisponiveis": [
    {"fonte": "smap", "motivo": "fora_da_regiao_pre_processada"}
  ]
}
```

- `variaveis[].valor` pode ser `null` quando a fonte não tem a medição naquele dia (ex.: preenchimento ausente da NASA POWER) — **nunca** é convertido pra zero.
- `variaveis[].tipo_acesso` é `"ao_vivo"` (NASA POWER, USDA Soil Data Access) ou `"pre_processado"` (GPM, SMAP, SRTM, ECOSTRESS).
- `fontes_indisponiveis[].motivo` é `"fora_da_regiao_pre_processada"` (coordenada fora da célula indexada) ou `"fora_da_cobertura"` (fora da área que a fonte ao vivo cobre, ex. fora dos EUA pro Soil Data Access).

**Response 422 (coordenada inválida):**
```json
{
  "erro": {
    "codigo": "coordenada_invalida",
    "mensagem": "latitude deve estar entre -90 e 90, longitude entre -180 e 180.",
    "detalhes": [],
    "requisicao_id": null
  }
}
```

## GET /api/v1/producao  (PROPOSTA — rota ainda não existe)

Painel "Como foi a colheita" para produtores com pouca leitura. **A resposta já é montada** por `montar_painel(codigo_ibge)` em `web/Backend/app/modelos/painel_producao.py`; falta só expor a rota. Enquanto isso, o front usa a cópia gerada pelo mesmo script (`web/Frontend/src/api/mock/producaoMunicipio.ts`, números reais congelados em `gerado_em`).

- **Query:** `codigo_ibge` (obrigatório). Hoje só `3549805` (São José do Rio Preto) tem dados.
- **Sucesso 200:** `PainelProducao` (tipos em `web/Frontend/src/api/tipos.ts`): `culturas[]` com `situacao` (`acima`/`normal`/`abaixo`/`sem_plantio`, último ano vs média dos 5 anteriores, limiar 5%), `clima` (último ano vs média 1995–2024, com `situacao_chuva`, `gotas_em_10`, `situacao_calor`, `graus_de_diferenca`), `cenarios[]` (`seco`/`normal`/`chuvoso`, `sacos_em_100` = de 100 sacos quantos ganha/perde; `null` = sem efeito confiável no modelo), `fontes`, `limitacoes`, `tipo_dado`, `gerado_em`.
- **Erro 404:** `{"erro": {"codigo": "dados_insuficientes", ...}}` para município sem dados pré-processados.
- Toda regra (situação, classificação do clima, cenários) fica no backend; o front só desenha.

## Pendente / não implementado ainda

- `GET /api/v1/culturas`, `POST /api/v1/analises`, `GET /api/v1/analises/{id}` — ainda apenas propostos (ver convenção seção 6), não implementados.
- Motor de decisão (gerar estratégias de rotação a partir das variáveis) — este endpoint só coleta e abstrai os dados, não recomenda nada ainda.
- Autenticação, CORS para produção, rate limit.
