# Dicionário de dados — Field Shift

## Extensão beta — 14/11/2026

DTOs de entrada e resultado seguem web/Frontend/src/api/tipos.ts e são validados
por Pydantic. As propriedades JSON não têm aliases camelCase.

- analise_id: UUID serializado como string; criado pelo servidor.
- criada_em_utc: instante ISO 8601 UTC.
- versao_motor: versão da interpretação, inclusive simulação beta.
- estado_recomendacoes: simulacao_beta ou dados_insuficientes.
- eh_mock: true se estratégias/calendários/níveis contêm hipóteses simuladas,
  mesmo quando o clima foi obtido de fonte real.
- origem_local: gps ou municipio; municipio é referência aproximada, não talhão.
- codigo_ibge: null em entrada da Califórnia; string vazia em Local da Califórnia.
- correcoes: textura_solo/relevo opcionais, autorrelatados, não observação NASA.
- recursos_disponiveis: maquinas_graos/comprador_graos/irrigacao: sim|nao|nao_sei.
- prioridades: 1–2 valores distintos do enum do frontend.
- problemas: até 3 valores distintos do enum do frontend; não são diagnósticos.
- clima_mensal: 12 meses, chuva em mm/mês (média dos acumulados mensais de
  anos completos válidos). Nunca substituir meses incompletos por zero.
- umidade_solo no clima mensal: null enquanto não existir transformação validada
  para o índice de zona radicular esperado pelo frontend. SMAP superficial não é esse índice.
- fonte_clima.periodo_inicio/fim: período realmente solicitado, documentado no resultado.
- declividade_pct: null enquanto não houver derivação espacial validada; amplitude
  de elevação não é declividade.
- textura_solo/relevo/risco_erosao/risco_seca: null se sem método aprovado;
  correções do produtor podem preencher textura e relevo com origem identificada.
- atributos, calendário e confiança dos cenários beta: valores de simulação para
  teste de integração, não classes agronômicas validadas nem probabilidades.
- fontes_indisponiveis: fonte e motivo técnico/científico documentado no contrato.

Catálogo beta não constitui decisão sobre culturas suportadas em produção.
Persistência: analises guarda entrada, resposta e coleta em JSON, versão e criação;
as coordenadas ficam no registro da análise, sem histórico independente de GPS.

> Campos em uso real na API (não propostas). Nomes em português sem acento, `snake_case`, conforme `docs/convencao_programacao.md` seção 5.

| Campo | Unidade | Fonte(s) | Descrição |
|---|---|---|---|
| `temperatura_media_c` | °C | nasa_power | Temperatura média diária a 2 m |
| `temperatura_maxima_c` | °C | nasa_power | Temperatura máxima diária a 2 m |
| `temperatura_minima_c` | °C | nasa_power | Temperatura mínima diária a 2 m |
| `precipitacao_acumulada_mm` | mm | nasa_power, gpm | Precipitação acumulada no dia |
| `umidade_relativa_pct` | % | nasa_power | Umidade relativa a 2 m |
| `velocidade_vento_ms` | m/s | nasa_power | Velocidade do vento a 2 m |
| `radiacao_solar_kwh_m2` | kWh/m²/dia | nasa_power | Radiação solar incidente |
| `materia_organica_pct` | % | usda_soil_data_access | Matéria orgânica na camada superficial do solo |
| `areia_pct` / `argila_pct` / `silte_pct` | % | usda_soil_data_access | Textura do solo (camada superficial) |
| `condutividade_hidraulica_micrometros_s` | µm/s | usda_soil_data_access | Condutividade hidráulica saturada (Ksat) |
| `capacidade_agua_disponivel_cm_cm` | cm/cm | usda_soil_data_access | Capacidade de água disponível |
| `umidade_solo_cm3_cm3` | cm³/cm³ | smap | Umidade volumétrica do solo |
| `elevacao_media_m` / `elevacao_min_m` / `elevacao_max_m` | m | srtm | Elevação agregada por célula (0,1°) |
| `temperatura_superficie_media_c` | °C | ecostress | Temperatura da superfície (LST), agregada por célula |
| `ndvi_medio` | adimensional (-1 a 1) | landsat | Índice de vegetação (NDVI), via bandas vermelho/infravermelho próximo (HLS L30), agregado por célula |
| `evapotranspiracao_mm` | mm/mês | openet | Evapotranspiração mensal (modelo Ensemble, referência gridMET) |

## Metadados por variável (sempre presentes na resposta da API)

| Campo | Tipo | Descrição |
|---|---|---|
| `fonte` | string | Identificador da fonte (`nasa_power`, `usda_soil_data_access`, `gpm`, `smap`, `srtm`, `ecostress`) |
| `tipo_acesso` | string | `ao_vivo` ou `pre_processado` — ver convenção seção 7 |
| `data` | string (`YYYY-MM-DD`) ou `null` | Data da observação; `null` quando a variável não tem dimensão temporal (ex. solo) |
| `valor` | float ou `null` | `null` = ausência de medição, nunca convertido pra zero |

Campos do motor beta constam no OpenAPI e na extensão acima. Pendente validar
seu significado agronômico: a implementação atual entrega cenários simulados,
não recomendações científicas homologadas.
