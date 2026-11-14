// GERADO por web/Backend/app/modelos/painel_producao.py -- nao editar a mao.
// Copia local da rota proposta GET /api/v1/producao enquanto o backend nao a tem.
// Numeros REAIS (IBGE + NASA POWER + modelo), congelados na data de `gerado_em`.
import type { PainelProducao } from '../tipos';

export const PAINEIS_PRODUCAO: Record<string, PainelProducao> = {
  "3549805": {
    "codigo_ibge": "3549805",
    "municipio": "São José do Rio Preto",
    "uf": "SP",
    "culturas": [
      {
        "cultura_id": "cana_de_acucar",
        "nome": "Cana",
        "situacao": "normal",
        "ano": 2025,
        "area_plantada_ha": 4200.0,
        "rendimento_kg_ha": 90000.0,
        "rendimento_medio_anterior_kg_ha": 88000
      },
      {
        "cultura_id": "soja",
        "nome": "Soja",
        "situacao": "acima",
        "ano": 2025,
        "area_plantada_ha": 515.0,
        "rendimento_kg_ha": 3000.0,
        "rendimento_medio_anterior_kg_ha": 2640
      },
      {
        "cultura_id": "milho",
        "nome": "Milho",
        "situacao": "acima",
        "ano": 2025,
        "area_plantada_ha": 100.0,
        "rendimento_kg_ha": 6000.0,
        "rendimento_medio_anterior_kg_ha": 5480
      },
      {
        "cultura_id": "mandioca",
        "nome": "Mandioca",
        "situacao": "normal",
        "ano": 2025,
        "area_plantada_ha": 63.0,
        "rendimento_kg_ha": 18000.0,
        "rendimento_medio_anterior_kg_ha": 17600
      }
    ],
    "clima": {
      "ano": 2024,
      "chuva_mm": 909,
      "chuva_normal_mm": 1177,
      "situacao_chuva": "pouca",
      "gotas_em_10": 8,
      "tmax_c": 33.2,
      "tmax_normal_c": 30.2,
      "situacao_calor": "mais_quente",
      "graus_de_diferenca": 3,
      "periodo_normal": "1995-2024"
    },
    "cenarios": [
      {
        "cenario_id": "seco",
        "nome": "Ano seco",
        "culturas": [
          {
            "cultura_id": "cana_de_acucar",
            "sacos_em_100": null
          },
          {
            "cultura_id": "soja",
            "sacos_em_100": null
          },
          {
            "cultura_id": "milho",
            "sacos_em_100": -6
          },
          {
            "cultura_id": "mandioca",
            "sacos_em_100": null
          }
        ]
      },
      {
        "cenario_id": "normal",
        "nome": "Ano normal",
        "culturas": [
          {
            "cultura_id": "cana_de_acucar",
            "sacos_em_100": 0
          },
          {
            "cultura_id": "soja",
            "sacos_em_100": 0
          },
          {
            "cultura_id": "milho",
            "sacos_em_100": 0
          },
          {
            "cultura_id": "mandioca",
            "sacos_em_100": 0
          }
        ]
      },
      {
        "cenario_id": "chuvoso",
        "nome": "Ano chuvoso",
        "culturas": [
          {
            "cultura_id": "cana_de_acucar",
            "sacos_em_100": null
          },
          {
            "cultura_id": "soja",
            "sacos_em_100": null
          },
          {
            "cultura_id": "milho",
            "sacos_em_100": 6
          },
          {
            "cultura_id": "mandioca",
            "sacos_em_100": null
          }
        ]
      }
    ],
    "fontes": [
      "IBGE – Produção Agrícola Municipal (tabela 5457)",
      "NASA POWER (MERRA-2)",
      "Modelo produtividade x clima, 645 municípios de SP, 2000–2024"
    ],
    "limitacoes": [
      "Números da cidade toda, não da sua roça.",
      "O modelo só sabe dizer o efeito do clima quando ele é claro nos anos passados. Quando não é, a resposta é: ainda não sabemos."
    ],
    "tipo_dado": "observacao_historica",
    "gerado_em": "2026-11-14"
  }
};
