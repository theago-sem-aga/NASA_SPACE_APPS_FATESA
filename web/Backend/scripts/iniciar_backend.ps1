$ErrorActionPreference = 'Stop'
$raizProjeto = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$pythonProjeto = Join-Path $raizProjeto '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $pythonProjeto)) { throw 'Crie o ambiente virtual conforme o README.' }
Push-Location (Join-Path $raizProjeto 'web/Backend')
try {
    & $pythonProjeto -m app.sincronizar_bucket
    # Migra o manifesto (Parquet) pro indice espacial real em PostGIS -- sem
    # isso, celula nova (ex.: fonte adicionada por outra pessoa, baixada do
    # bucket acima) existe em disco mas a API nao acha ela no banco.
    # Idempotente (ON CONFLICT DO UPDATE); roda local, cada pessoa tem seu Postgres.
    & $pythonProjeto app/pipelines/indice_espacial_postgis.py
    & $pythonProjeto -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
} finally { Pop-Location }
