# Dicionário de dados — Field Shift

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

## Metadados por variável (sempre presentes na resposta da API)

| Campo | Tipo | Descrição |
|---|---|---|
| `fonte` | string | Identificador da fonte (`nasa_power`, `usda_soil_data_access`, `gpm`, `smap`, `srtm`, `ecostress`) |
| `tipo_acesso` | string | `ao_vivo` ou `pre_processado` — ver convenção seção 7 |
| `data` | string (`YYYY-MM-DD`) ou `null` | Data da observação; `null` quando a variável não tem dimensão temporal (ex. solo) |
| `valor` | float ou `null` | `null` = ausência de medição, nunca convertido pra zero |

Pendente: definir campos do motor de decisão (estratégias de rotação) quando ele existir — hoje a API só coleta e abstrai dado, não recomenda nada.
