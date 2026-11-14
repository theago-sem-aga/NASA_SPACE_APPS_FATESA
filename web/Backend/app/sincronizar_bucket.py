"""Baixa a copia em nuvem (GCS) dos dados processados pro disco local.

Nao muda a forma como o backend le os dados (continua lendo o caminho
local gravado no PostGIS, ver indice_espacial_postgis.py) -- so garante
que esse disco local tenha a mesma copia que esta no bucket, antes do
servidor subir. Ver docs/convencao_programacao.md ("Copia em nuvem dos
dados processados").

Idempotente: so baixa/sobrescreve arquivos do bucket, nunca apaga nada
que exista localmente e nao esteja no bucket.

Executar da pasta web/Backend: python -m app.sincronizar_bucket
Sem efeito (sai cedo) se GCS_BUCKET nao estiver configurado em web/.env
-- continua funcionando so com o disco local, como ja funcionava antes.
"""

from __future__ import annotations

from pathlib import Path

from app.configuracao import RAIZ, configuracao


def sincronizar() -> int:
    bucket_nome = configuracao().get("gcs_bucket")
    if not bucket_nome:
        print("GCS_BUCKET nao configurado em web/.env -- usando so o disco local, nada a sincronizar.")
        return 0

    from google.cloud import storage

    cliente = storage.Client()
    bucket = cliente.bucket(bucket_nome)
    raiz_dados = RAIZ / "data"

    baixados = 0
    for blob in bucket.list_blobs(prefix="processed/"):
        if blob.name.endswith("/"):
            continue
        destino = raiz_dados / blob.name  # "processed/<fonte>/<celula_id>.parquet"
        destino.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(destino))
        baixados += 1

    print(f"sincronizado: {baixados} arquivos de gs://{bucket_nome}/processed/ para {raiz_dados / 'processed'}")
    return baixados


if __name__ == "__main__":
    sincronizar()
