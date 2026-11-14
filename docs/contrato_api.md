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
- **Sucesso 200:** `PainelProducao` (tipos em `web/Frontend/src/api/tipos.ts`): `culturas[]` com `situacao` (`acima`/`normal`/`abaixo`/`sem_plantio`, último ano vs média dos 5 anteriores, limiar 5%), `clima` (último ano vs média 1995–2024, com `situacao_chuva`, `gotas_em_10`, `situacao_calor`, `graus_de_diferenca`), `previsao` (prognóstico oficial INMET/INPE/FUNCEME dos próximos ~3 meses, transcrito em `data/processed/inmet/prognostico_<codigo_ibge>.json`: `chuva` e `temperatura` em `acima`/`normal`/`abaixo`, `meses[]` com `chuva` `irregular`/`melhora`/`normal`/`excesso`, `dicas[]` com `figura` e `frase`, `fonte`, `url_fonte`, `publicado_em`, `tipo_dado: "previsao"`; `null` se não houver), `fontes`, `limitacoes`, `tipo_dado`, `gerado_em`.
- **Erro 404:** `{"erro": {"codigo": "dados_insuficientes", ...}}` para município sem dados pré-processados.
- Toda regra (situação, classificação do clima) fica no backend; o front só desenha. A previsão é transcrita do boletim mensal do INMET e precisa ser atualizada a cada mês.

## GET /api/v1/acompanhamento  (PROPOSTA — rota ainda não existe)

Acompanhamento da área pelo satélite, no fim do fluxo (botão no resumo). **A resposta já é montada** por `acompanhar(codigo_ibge, lat, lon)` em `web/Backend/app/pipelines/acompanhamento_sentinel2.py` (Sentinel-2 L2A, catálogo público Earth Search, sem login). Pela convenção §7 é fonte pré-processada: a rota deve servir o último processamento do ponto, não baixar imagem na requisição. Enquanto isso, o front usa a cópia gerada pelo script: **talhão de exemplo** por município (`ponto_exemplo: true`), porque o centro da cidade mostraria casas.

- **Query:** `latitude`, `longitude` (o ponto do GPS ou do cadastro).
- **Sucesso 200:** `Acompanhamento` (tipos em `web/Frontend/src/api/tipos.ts`): `fotos[]` (mais nova primeiro, só sem nuvem sobre o talhão: `data`, `ndvi`, `estado` = `terra_descoberta` < 0,25 ≤ `pouca_planta` < 0,50 ≤ `planta_verde`, `imagem`), `confere_por_cobertura` (para cada `CoberturaSolo` do calendário das estratégias, se a última foto combina; `null` sem foto), `lado_talhao_m`, `fonte`, `atribuicao` (obrigatória: "Contém dados Copernicus Sentinel-2 modificados"), `tipo_dado`, `gerado_em`.
- **Erro 404:** `dados_insuficientes` quando não há fotos processadas para o ponto.
- O front escolhe o mês atual no calendário do caminho escolhido e mostra `confere_por_cobertura[cobertura]`; a regra de conferir é do backend.

## Pendente / não implementado ainda

- `GET /api/v1/culturas`, `POST /api/v1/analises`, `GET /api/v1/analises/{id}` — ainda apenas propostos (ver convenção seção 6), não implementados.
- Motor de decisão (gerar estratégias de rotação a partir das variáveis) — este endpoint só coleta e abstrai os dados, não recomenda nada ainda.
- Autenticação, CORS para produção, rate limit.
