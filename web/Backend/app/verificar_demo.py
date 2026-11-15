"""Verificação manual com banco e fontes reais, sem imprimir credenciais."""

import json

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.configuracao import RAIZ
from app.main import app
from app.repositories.banco import motor_banco


def verificar():
    with motor_banco().connect() as conexao:
        versao = conexao.execute(text("SELECT PostGIS_Lib_Version()")).scalar_one()
        contagens = dict(
            conexao.execute(text("SELECT fonte,count(*) FROM indice_espacial GROUP BY fonte")).all()
        )
    entrada = {
        "latitude": 36.6,
        "longitude": -119.7,
        "origem_local": "gps",
        "codigo_ibge": None,
        "cultura_atual_id": "milho",
        "problemas": [],
        "recursos_disponiveis": {
            "maquinas_graos": "nao_sei",
            "comprador_graos": "nao_sei",
            "irrigacao": "nao_sei",
        },
        "prioridades": ["reducao_erosao", "materia_organica"],
        "correcoes": {},
    }
    with TestClient(app) as cliente:
        pronto = cliente.get("/api/v1/prontidao")
        assert pronto.status_code == 200, pronto.text
        resultado = cliente.post("/api/v1/analises", json=entrada)
        assert resultado.status_code == 201, resultado.text
        analise = resultado.json()
        recuperada = cliente.get("/api/v1/analises/" + analise["analise_id"])
        assert recuperada.status_code == 200 and recuperada.json() == analise
        caminho = RAIZ / "web" / "Backend" / ".cache" / "analise_demo.json"
        caminho.parent.mkdir(parents=True, exist_ok=True)
        caminho.write_text(json.dumps(analise, ensure_ascii=False, indent=2), encoding="utf-8")
        # Compilação independente contra o DTO do frontend, sem mudar seus arquivos.
        campos_front = (
            "analise_id",
            "eh_mock",
            "descricao_local",
            "talhao",
            "fonte_clima",
            "clima_mensal",
            "geada",
            "tendencia_hidrica",
            "estrategias",
            "limitacoes",
        )
        contrato_ts = "import type { Analise } from '../../Frontend/src/api/tipos';\nconst analise: Analise = "
        contrato_ts += (
            json.dumps({k: analise[k] for k in campos_front}, ensure_ascii=False, indent=2)
            + ";\nvoid analise;\n"
        )
        caminho.with_name("contrato_frontend.ts").write_text(contrato_ts, encoding="utf-8")
        print(
            json.dumps(
                {
                    "postgis": versao,
                    "celulas_por_fonte": contagens,
                    "post_status": resultado.status_code,
                    "get_igual_ao_post": True,
                    "estado": analise["estado_recomendacoes"],
                    "eh_mock": analise["eh_mock"],
                    "estrategias": len(analise["estrategias"]),
                    "meses_chuva_real": sum(
                        m["precipitacao_acumulada_mm"] is not None for m in analise["clima_mensal"]
                    ),
                    "fontes_indisponiveis": analise["fontes_indisponiveis"],
                },
                ensure_ascii=True,
            )
        )


if __name__ == "__main__":
    verificar()
