// GERADO por web/Backend/app/modelos/painel_producao.py -- nao editar a mao.
// Copia local da rota proposta GET /api/v1/producao enquanto o backend nao a tem.
// Numeros REAIS (IBGE + NASA POWER) e previsao oficial (INMET), congelados em `gerado_em`.
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
    "previsao": {
      "abrangencia": "Região de São José do Rio Preto (noroeste paulista)",
      "periodo": "novembro de 2026 a janeiro de 2027",
      "chuva": "acima",
      "temperatura": "acima",
      "meses": [
        {
          "mes": "2026-11",
          "nome": "Novembro",
          "chuva": "irregular"
        },
        {
          "mes": "2026-12",
          "nome": "Dezembro",
          "chuva": "melhora"
        },
        {
          "mes": "2027-01",
          "nome": "Janeiro",
          "chuva": "excesso"
        }
      ],
      "dicas": [
        {
          "figura": "soja",
          "frase": "Novembro é bom para plantar soja e milho"
        },
        {
          "figura": "cana",
          "frase": "A chuva deve ajudar a cana a crescer"
        },
        {
          "figura": "pragas",
          "frase": "Calor com umidade: olho na doença e na praga"
        },
        {
          "figura": "trator",
          "frase": "Em janeiro, chuva demais pode atrapalhar a colheita"
        }
      ],
      "fonte": "INMET, INPE e FUNCEME – Boletim Agroclimatológico de novembro de 2026",
      "url_fonte": "https://portal.inmet.gov.br/uploads/boletinsAgroclimatologicos/Boletim_AGRO_Novembro_2026.pdf",
      "publicado_em": "2026-11",
      "tipo_dado": "previsao"
    },
    "fontes": [
      "IBGE – Produção Agrícola Municipal (tabela 5457)",
      "NASA POWER (MERRA-2)",
      "INMET, INPE e FUNCEME – prognóstico climático trimestral"
    ],
    "limitacoes": [
      "Números da cidade toda, não da sua roça.",
      "A previsão vale para os próximos 3 meses. Ninguém consegue prever a chuva de um ano inteiro."
    ],
    "tipo_dado": "observacao_historica",
    "gerado_em": "2026-11-14"
  }
};
