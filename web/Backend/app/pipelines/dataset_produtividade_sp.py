"""Dataset produtividade x clima para todos os municipios de SP.

Junta, por municipio e ano de colheita:
  - rendimento (kg/ha) e area plantada da PAM/IBGE (tabela 5457), 2000-2025;
  - clima da safra da NASA POWER (endpoint mensal), no ponto da grade
    MERRA-2 mais proximo do centroide do municipio.

Serve de entrada para app/modelos/produtividade_clima.py. Nao e
recomendacao: so mede quanto o rendimento historico variou com o clima.

Saida: data/processed/modelo_produtividade/dataset_sp.parquet
Cache: data/raw/power_mensal/<lat>_<lon>.json (reexecucao nao rebaixa)
Uso:   python dataset_produtividade_sp.py
"""

from __future__ import annotations

import calendar
import json
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
import requests

from indice_espacial import RAIZ_DADOS_PROCESSADOS

UF_IBGE = "35"
ANO_INI, ANO_FIM = 2000, 2025
PASTA_POWER = RAIZ_DADOS_PROCESSADOS.parent / "raw" / "power_mensal"
SAIDA = RAIZ_DADOS_PROCESSADOS / "modelo_produtividade" / "dataset_sp.parquet"

# cultura -> (codigo PAM c782, meses da safra relativos ao ano de colheita).
# Mes <= 0 = ano anterior (0 = dez, -2 = out). Janelas aproximadas do
# calendario paulista; milho e feijao da PAM somam 1a e 2a safra.
CULTURAS = {
    "amendoim": ("40101", list(range(-2, 4))),   # out-mar
    "soja": ("40124", list(range(-2, 4))),       # out-mar
    "milho": ("40122", list(range(-2, 7))),      # out-jun (1a + safrinha)
    "feijao": ("40112", list(range(-2, 7))),     # out-jun
    "sorgo": ("40125", list(range(2, 8))),       # fev-jul (safrinha)
    "cana": ("40106", list(range(-2, 10))),      # out-set (ciclo anual)
    "mandioca": ("40119", list(range(-2, 10))),  # out-set
    "laranja": ("40151", list(range(-2, 10))),   # out-set
}
MES_SECO_MM = 50  # mes da safra com menos que isso conta como "seco"


# ---------- municipios e centroides ----------

def _centroide(anel: list) -> tuple[float, float]:
    x, y = np.array(anel).T[:2]
    a = x[:-1] * y[1:] - x[1:] * y[:-1]
    area = a.sum() / 2
    return float(((y[:-1] + y[1:]) * a).sum() / (6 * area)), float(((x[:-1] + x[1:]) * a).sum() / (6 * area))


def municipios() -> pd.DataFrame:
    malha = requests.get(
        f"https://servicodados.ibge.gov.br/api/v3/malhas/estados/{UF_IBGE}",
        params={"intrarregiao": "municipio", "formato": "application/vnd.geo+json", "qualidade": "minima"},
        timeout=120,
    ).json()
    linhas = []
    for f in malha["features"]:
        geom = f["geometry"]
        poligonos = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        maior = max((p[0] for p in poligonos), key=len)  # anel externo do maior poligono
        lat, lon = _centroide(maior)
        linhas.append({"geocodigo_ibge": f["properties"]["codarea"], "lat": lat, "lon": lon})
    df = pd.DataFrame(linhas)
    # Grade nativa da POWER (MERRA-2): 0,5 lat x 0,625 lon. Municipios no
    # mesmo ponto compartilham a serie -- evita centenas de requisicoes iguais.
    df["power_lat"] = (np.round((df["lat"] + 90) / 0.5) * 0.5 - 90).round(3)
    df["power_lon"] = (np.round((df["lon"] + 180) / 0.625) * 0.625 - 180).round(3)
    return df


# ---------- clima (NASA POWER mensal) ----------

def _power_mensal(lat: float, lon: float) -> pd.DataFrame:
    cache = PASTA_POWER / f"{lat}_{lon}.json"
    if cache.exists():
        corpo = json.loads(cache.read_text())
    else:
        r = requests.get(
            "https://power.larc.nasa.gov/api/temporal/monthly/point",
            params={"parameters": "PRECTOTCORR,T2M_MAX", "community": "AG", "latitude": lat,
                    "longitude": lon, "start": ANO_INI - 1, "end": 2024, "format": "JSON"},
            timeout=120,
        )
        r.raise_for_status()
        corpo = r.json()
        cache.write_text(json.dumps(corpo))
    p = corpo["properties"]["parameter"]
    linhas = []
    for chave, chuva_mm_dia in p["PRECTOTCORR"].items():
        ano, mes = int(chave[:4]), int(chave[4:])
        if mes == 13:  # media anual
            continue
        tmax = p["T2M_MAX"][chave]
        linhas.append({
            "ano": ano, "mes": mes,
            # POWER mensal da chuva em mm/dia -> total do mes.
            "chuva_mm": None if chuva_mm_dia < -900 else chuva_mm_dia * calendar.monthrange(ano, mes)[1],
            "tmax_c": None if tmax < -900 else tmax,
        })
    return pd.DataFrame(linhas).assign(power_lat=lat, power_lon=lon)


def clima(pontos: pd.DataFrame) -> pd.DataFrame:
    PASTA_POWER.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:  # educado com a API publica
        partes = list(pool.map(lambda lp: _power_mensal(*lp), pontos.itertuples(index=False, name=None)))
    return pd.concat(partes, ignore_index=True)


def clima_da_safra(mensal: pd.DataFrame, meses: list[int]) -> pd.DataFrame:
    """Agrega o clima mensal na janela da safra de cada ano de colheita."""
    m = mensal.copy()
    partes = []
    for ano_colheita in range(ANO_INI, 2025):
        alvo = [(ano_colheita + (mes - 1) // 12, (mes - 1) % 12 + 1) for mes in meses]
        sel = m[[(a, me) in alvo for a, me in zip(m["ano"], m["mes"])]]
        g = sel.groupby(["power_lat", "power_lon"]).agg(
            chuva_safra_mm=("chuva_mm", "sum"),
            tmax_safra_c=("tmax_c", "mean"),
            meses_secos=("chuva_mm", lambda s: int((s < MES_SECO_MM).sum())),
        ).reset_index()
        partes.append(g.assign(ano=ano_colheita))
    return pd.concat(partes, ignore_index=True)


# ---------- produtividade (PAM) ----------

def _valor(v: str) -> float | None:
    return None if v in ("-", "X", "..", "...", "") else float(v)


def pam(codigo_cultura: str) -> pd.DataFrame:
    r = requests.get(
        f"https://apisidra.ibge.gov.br/values/t/5457/n6/in%20n3%20{UF_IBGE}/v/112,8331"
        f"/p/{ANO_INI}-{ANO_FIM}/c782/{codigo_cultura}",
        timeout=300,
    )
    r.raise_for_status()
    df = pd.DataFrame([{
        "geocodigo_ibge": x["D1C"], "ano": int(x["D3N"]),
        "variavel": {"112": "rendimento_kg_ha", "8331": "area_plantada_ha"}[x["D2C"]],
        "valor": _valor(x["V"]),
    } for x in r.json()[1:]])
    return df.pivot_table(index=["geocodigo_ibge", "ano"], columns="variavel", values="valor").reset_index()


def montar() -> pd.DataFrame:
    mun = municipios()
    pontos = mun[["power_lat", "power_lon"]].drop_duplicates()
    print(f"municipios={len(mun)} pontos_power={len(pontos)}")
    mensal = clima(pontos)

    partes = []
    for cultura, (codigo, meses) in CULTURAS.items():
        prod = pam(codigo).merge(mun, on="geocodigo_ibge")
        cl = clima_da_safra(mensal, meses)
        df = prod.merge(cl, on=["power_lat", "power_lon", "ano"]).assign(cultura=cultura)
        partes.append(df)
        print(f"  {cultura}: {len(df)} municipio-anos")
    dataset = pd.concat(partes, ignore_index=True)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_parquet(SAIDA, index=False)
    print(f"dataset={len(dataset)} linhas -> {SAIDA}")
    return dataset


if __name__ == "__main__":
    montar()
