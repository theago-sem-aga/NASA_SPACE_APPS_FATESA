// GERADO por web/Backend/app/pipelines/acompanhamento_sentinel2.py -- nao editar a mao.
// Copia local da rota proposta GET /api/v1/acompanhamento. Fotos REAIS do Sentinel-2,
// de um talhao de EXEMPLO por municipio (o centro da cidade mostraria casas).
import type { Acompanhamento } from '../tipos';

export const ACOMPANHAMENTOS: Record<string, Acompanhamento> = {
  "3549805": {
    "codigo_ibge": "3549805",
    "latitude": -20.7343,
    "longitude": -49.4429,
    "fotos": [
      {
        "data": "2026-11-12",
        "ndvi": 0.12,
        "estado": "terra_descoberta",
        "imagem": "imagens/satelite/3549805_2026-11-12.png"
      },
      {
        "data": "2026-10-20",
        "ndvi": 0.12,
        "estado": "terra_descoberta",
        "imagem": "imagens/satelite/3549805_2026-10-20.png"
      },
      {
        "data": "2026-10-18",
        "ndvi": 0.12,
        "estado": "terra_descoberta",
        "imagem": "imagens/satelite/3549805_2026-10-18.png"
      },
      {
        "data": "2026-10-13",
        "ndvi": 0.12,
        "estado": "terra_descoberta",
        "imagem": "imagens/satelite/3549805_2026-10-13.png"
      }
    ],
    "confere_por_cobertura": {
      "solo_descoberto": true,
      "palhada": true,
      "cultura_principal": false,
      "cultura_intermediaria": false,
      "adubo_verde": false
    },
    "lado_talhao_m": 100,
    "fonte": "Sentinel-2 L2A (ESA/Copernicus), catálogo Earth Search (Element84)",
    "atribuicao": "Contém dados Copernicus Sentinel-2 modificados (2026)",
    "tipo_dado": "observacao_historica",
    "gerado_em": "2026-11-14"
  }
};
