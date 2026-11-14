# Contrato de API — Field Shift

## Extensão beta — 14/11/2026 (Ghabriel/Codex)

Piloto Califórnia confirmado por Ghabriel nesta sessão; Brasil fica para depois.
Preservar GET /analises. Implementar GET /culturas (Cultura[]), GET /locais
(Local do recorte piloto), GET /municipios (busca limitada ao piloto, sem malha
brasileira), POST /analises (AnaliseEntrada → Analise) e GET /analises/{analise_id}.
Tipos públicos mantêm as chaves de web/Frontend/src/api/tipos.ts.

No piloto, Local.codigo_ibge="", Local.uf="CA", municipio="Região piloto de Fresno".
O ponto da busca é a referência do piloto (36.6,-119.7), não centroide oficial.
O recorte é [36.4,36.8) × [-119.9,-119.5), não o limite administrativo do condado.
POST permite codigo_ibge=null. Não guardar código brasileiro para um ponto nos EUA.

POST valida coordenadas finitas, 1–2 prioridades distintas, enums e campos extras.
Culturas do protótipo permanecem identificadores de demonstração. Cenários beta são
opcionais (HABILITAR_CENARIOS_BETA=true), simulados e explicitamente eh_mock=true;
não são prescrições agronômicas. Sem eles, estratégias ficam vazias e o estado é
dados_insuficientes. Não gerar números climáticos para preencher lacunas.

Analise acrescenta versao_motor, criada_em_utc, fontes_indisponiveis e
estado_recomendacoes (simulacao_beta|dados_insuficientes). Resultado persistido
antes de responder, com UUID opaco; GET por UUID recupera a mesma versão.
Persistência indisponível: 503 banco_indisponivel; fora do recorte: 422
fora_da_cobertura; cultura desconhecida: 422 cultura_nao_suportada; UUID
inexistente: 404 analise_nao_encontrada. Erros usam o envelope erro.
GET /prontidao verifica banco e esquema (503 quando indisponíveis).
Erros de sintaxe JSON: 400; validação: 422; inesperados: 500 sem detalhes internos.

Cada fonte falha isoladamente. motivos adicionais: chave_nao_configurada,
falha_autenticacao, limite_requisicoes, timeout, falha_fonte,
banco_indisponivel, arquivo_indisponivel, sem_medicoes e dado_invalido.
Quando há múltiplos componentes de solo sem agregação aprovada, o motivo é
componentes_solo_ambiguos; os componentes originais ficam preservados no snapshot.
Fontes não precisam ter a mesma data; uma lista conjunta não autoriza correlação.
Sem autenticação, implantação deve ficar restrita à demonstração; UUID não substitui
autorização. Não persistir segredos. Não incluir entrada completa nos logs.

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

## Rotas acrescentadas na entrega beta

Schemas completos, campos obrigatórios, enums e respostas estão no
[OpenAPI exportado](openapi.json), gerado da aplicação. `/openapi.json` continua
sendo o contrato executável. Não há conversão camelCase.

| Método e caminho | Entrada | Resposta |
|---|---|---|
| GET `/api/v1/culturas` | nenhuma | 200, array de Cultura, ordem de exibição |
| GET `/api/v1/locais` | latitude/longitude finitas, obrigatórias, WGS84 | 200 Local; 404 fora_da_cobertura |
| GET `/api/v1/municipios` | busca string até 120 caracteres; limite inteiro 1–20, padrão 8 | 200 Local[]; menos de 2 caracteres retorna [] |
| POST `/api/v1/analises` | AnaliseEntrada; exemplo no README do backend | 201 Analise persistida; 422 entrada/cobertura/cultura; 503 armazenamento |
| GET `/api/v1/analises/{analise_id}` | UUID | 200 Analise salva; 404 analise_nao_encontrada; 422 UUID inválido |
| GET `/api/v1/prontidao` | nenhuma | 200 {status:ok,banco:disponivel}; 503 se indisponível |

Busca é normalizada sem acentos e caixa. Por enquanto só existe o item do piloto:

```json
{
  "codigo_ibge": "",
  "municipio": "Região piloto de Fresno",
  "uf": "CA",
  "latitude": 36.6,
  "longitude": -119.7
}
```

GET /locais conserva as coordenadas recebidas; GET /municipios devolve a referência
piloto. Nenhum dos dois afirma usar malha administrativa oficial.
AnaliseEntrada usa os enums do frontend. No beta, somente cultura_atual_id=milho;
isso habilita teste de integração, não atesta aptidão agrícola. Não aceitar código
IBGE na Califórnia. Correções são opcionais e têm fonte informado_produtor.

POST persiste entrada/coleta/resposta antes do 201. Recuperação não recalcula nem
consulta NASA. CORS local admite GET/POST e Content-Type, inclusive erros tratados;
X-Request-ID aparece no header e requisicao_id no erro.

Pendente: motor agronômico validado (o atual é simulação opt-in), autenticação,
CORS de produção, rate limit e eventual contrato de processamento assíncrono.
