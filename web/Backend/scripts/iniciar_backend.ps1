$ErrorActionPreference = 'Stop'
$raizProjeto = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$pythonProjeto = Join-Path $raizProjeto '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $pythonProjeto)) { throw 'Crie o ambiente virtual conforme o README.' }
Push-Location (Join-Path $raizProjeto 'web/Backend')
try {
    & $pythonProjeto -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log
} finally { Pop-Location }
