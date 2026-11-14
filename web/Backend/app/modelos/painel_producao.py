"""Painel "Sua colheita": como vai a producao de um municipio, em linguagem simples.

Monta a resposta da rota proposta GET /api/v1/producao?codigo_ibge=... (ver
docs/contrato_api.md). Toda regra fica aqui, no backend -- o front so exibe:
  - situacao de cada cultura: rendimento do ultimo ano vs media dos 5 anteriores
    (acima/abaixo se passar de 5%);
  - clima do ultimo ano vs media 1995-2024 (NASA POWER, celula do municipio);
  - previsao dos proximos meses: prognostico OFICIAL INMET/INPE/FUNCEME,
    transcrito em data/processed/inmet/prognostico_<codigo_ibge>.json (sem
    arquivo -> previsao None). E previsao, nao observacao (convencao secao 7).

Enquanto a rota nao existe, o CLI grava uma copia local para o front:
  python painel_producao.py [codigo_ibge=3549805]
  -> web/Frontend/src/api/mock/producaoMunicipio.ts
"""

from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[4]
PROCESSADOS = RAIZ / "data" / "processed"
SAIDA_FRONT = RAIZ / "web" / "Frontend" / "src" / "api" / "mock" / "producaoMunicipio.ts"

# Celula 0,1 grau do centro de cada municipio com dados (ver pipelines/regioes.py).
MUNICIPIOS = {
    "3549805": {"municipio": "São José do Rio Preto", "uf": "SP", "celula_power": "-209_-494"},
}

# cultura_id do front (src/components/Pictograma.tsx) -> (nome na PAM, nome no modelo, nome curto)
CULTURAS = {
    "cana_de_acucar": ("Cana-de-açúcar", "cana", "Cana"),
    "soja": ("Soja (em grão)", "soja", "Soja"),
    "milho": ("Milho (em grão)", "milho", "Milho"),
    "mandioca": ("Mandioca", "mandioca", "Mandioca"),
}
LIMIAR_SITUACAO_PCT = 5
ANOS_MEDIA = 5



def _situacao(serie: pd.DataFrame) -> dict:
    serie = serie.sort_values("ano")
    ultimo = serie.iloc[-1]
    if not ultimo["area_plantada_ha"] or pd.isna(ultimo["rendimento_medio"]) or ultimo["rendimento_medio"] == 0:
        return {"situacao": "sem_plantio", "ano": int(ultimo["ano"]), "area_plantada_ha": None,
                "rendimento_kg_ha": None, "rendimento_medio_anterior_kg_ha": None}
    anteriores = serie.iloc[-1 - ANOS_MEDIA:-1]["rendimento_medio"].replace(0, pd.NA).dropna()
    media = float(anteriores.mean())
    dif = (ultimo["rendimento_medio"] / media - 1) * 100
    situacao = "acima" if dif > LIMIAR_SITUACAO_PCT else "abaixo" if dif < -LIMIAR_SITUACAO_PCT else "normal"
    return {"situacao": situacao, "ano": int(ultimo["ano"]), "area_plantada_ha": float(ultimo["area_plantada_ha"]),
            "rendimento_kg_ha": float(ultimo["rendimento_medio"]), "rendimento_medio_anterior_kg_ha": round(media)}


def _previsao(codigo_ibge: str) -> dict | None:
    """Prognostico oficial transcrito; os trechos originais ficam no arquivo, nao vao para a tela."""
    caminho = PROCESSADOS / "inmet" / f"prognostico_{codigo_ibge}.json"
    if not caminho.exists():
        return None
    p = json.loads(caminho.read_text(encoding="utf-8"))
    return {
        "periodo": p["periodo"],
        "chuva": p["chuva"],
        "temperatura": p["temperatura"],
        "meses": [{k: m[k] for k in ("mes", "nome", "chuva")} for m in p["meses"]],
        "dicas": [{k: d[k] for k in ("figura", "frase")} for d in p["dicas"]],
        "fonte": p["fonte"],
        "url_fonte": p["url_fonte"],
        "publicado_em": p["publicado_em"],
        "tipo_dado": "previsao",
    }


def _clima(anual: pd.DataFrame, ano: int) -> dict:
    chuva, chuva_normal = float(anual.at[ano, "chuva"]), float(anual["chuva"].mean())
    tmax, tmax_normal = float(anual.at[ano, "tmax"]), float(anual["tmax"].mean())
    proporcao = chuva / chuva_normal
    graus = tmax - tmax_normal
    return {
        "ano": ano,
        "chuva_mm": round(chuva),
        "chuva_normal_mm": round(chuva_normal),
        # 15% abaixo/acima da media = pouca/muita chuva.
        "situacao_chuva": "pouca" if proporcao <= 0.85 else "muita" if proporcao >= 1.15 else "normal",
        # Para o desenho de gotas: de cada 10 de um ano normal, quantas cairam.
        "gotas_em_10": int(round(proporcao * 10)),
        "tmax_c": round(tmax, 1),
        "tmax_normal_c": round(tmax_normal, 1),
        "situacao_calor": "mais_quente" if graus >= 1 else "mais_frio" if graus <= -1 else "normal",
        "graus_de_diferenca": int(round(graus)),
        "periodo_normal": f"{int(anual.index.min())}-{ano}",
    }


def montar_painel(codigo_ibge: str) -> dict:
    if codigo_ibge not in MUNICIPIOS:
        raise LookupError(f"sem dados pre-processados para o municipio {codigo_ibge}")
    m = MUNICIPIOS[codigo_ibge]
    pam = pd.read_parquet(PROCESSADOS / "ibge_pam" / f"municipio_{codigo_ibge}.parquet")
    pam = pam.pivot_table(index=["produto", "ano"], columns="variavel", values="valor").reset_index()

    culturas = []
    for cultura_id, (nome_pam, _, nome) in CULTURAS.items():
        serie = pam[pam["produto"] == nome_pam]
        if serie.empty:
            continue
        culturas.append({"cultura_id": cultura_id, "nome": nome, **_situacao(serie)})

    clima = pd.read_parquet(PROCESSADOS / "nasa_power" / f"{m['celula_power']}.parquet")
    clima["ano"] = clima["data"].str[:4].astype(int)
    anual = clima.groupby("ano").agg(chuva=("precipitacao_acumulada_mm", "sum"),
                                     tmax=("temperatura_maxima_c", "mean"))
    ultimo_ano = int(anual.index.max())

    return {
        "codigo_ibge": codigo_ibge,
        "municipio": m["municipio"],
        "uf": m["uf"],
        "culturas": culturas,
        "clima": _clima(anual, ultimo_ano),
        "previsao": _previsao(codigo_ibge),
        "fontes": ["IBGE – Produção Agrícola Municipal (tabela 5457)", "NASA POWER (MERRA-2)",
                   "INMET, INPE e FUNCEME – prognóstico climático trimestral"],
        "limitacoes": [
            "Números da cidade toda, não da sua roça.",
            "A previsão vale para os próximos 3 meses. Ninguém consegue prever a chuva de um ano inteiro.",
        ],
        "tipo_dado": "observacao_historica",
        "gerado_em": dt.date.today().isoformat(),
    }


def gravar_copia_front(codigo_ibge: str) -> Path:
    painel = montar_painel(codigo_ibge)
    corpo = json.dumps({codigo_ibge: painel}, ensure_ascii=False, indent=2)
    SAIDA_FRONT.write_text(
        "// GERADO por web/Backend/app/modelos/painel_producao.py -- nao editar a mao.\n"
        "// Copia local da rota proposta GET /api/v1/producao enquanto o backend nao a tem.\n"
        "// Numeros REAIS (IBGE + NASA POWER) e previsao oficial (INMET), congelados em `gerado_em`.\n"
        "import type { PainelProducao } from '../tipos';\n\n"
        f"export const PAINEIS_PRODUCAO: Record<string, PainelProducao> = {corpo};\n",
        encoding="utf-8",
    )
    return SAIDA_FRONT


if __name__ == "__main__":
    print(gravar_copia_front(sys.argv[1] if len(sys.argv) > 1 else "3549805"))
