"""Transporte para consultas de leitura, com no máximo uma repetição limitada."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def requisitar(metodo, url, **kwargs):
    # POST somente para endpoints de CONSULTA USDA/OpenET; não usar em escrita.
    tentativas = Retry(
        total=1,
        connect=1,
        read=0,
        status=1,
        status_forcelist=(429, 502, 503, 504),
        allowed_methods=frozenset(("GET", "POST")),
        backoff_factor=0.2,
        respect_retry_after_header=False,
        raise_on_status=False,
    )
    with requests.Session() as sessao:
        sessao.mount("https://", HTTPAdapter(max_retries=tentativas))
        return sessao.request(metodo, url, **kwargs)
