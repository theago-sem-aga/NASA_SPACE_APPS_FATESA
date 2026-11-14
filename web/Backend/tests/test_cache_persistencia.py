import json
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import pytest

from app.repositories.banco import normalizar_json
from app.services.cache import com_cache


def test_cache_coalesce_e_nao_vaza_mutacoes():
    chamadas = []
    chave = ("teste_coalescencia", object())

    def buscar():
        chamadas.append(1)
        return {"valores": [1]}

    with ThreadPoolExecutor(max_workers=8) as executor:
        respostas = list(executor.map(lambda _: com_cache(chave, 60, buscar), range(20)))
    assert len(chamadas) == 1
    respostas[0]["valores"].append(9)
    assert com_cache(chave, 60, buscar) == {"valores": [1]}


def test_cache_nao_guarda_excecao():
    chave = ("teste_excecao", object())

    def falhar():
        raise ValueError("falhou")

    with pytest.raises(ValueError):
        com_cache(chave, 60, falhar)
    assert com_cache(chave, 60, lambda: 7) == 7


def test_evidencia_json_sem_nan_e_datas():
    dados = normalizar_json(
        {"serie": [{"valor": float("nan"), "data": date(2020, 2, 29)}], "zero": 0}
    )
    assert json.loads(json.dumps(dados, allow_nan=False))["serie"][0] == {
        "valor": None,
        "data": "2020-02-29",
    }
    assert dados["zero"] == 0
