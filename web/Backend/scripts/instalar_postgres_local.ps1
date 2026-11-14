# Instala servidor local sem imprimir senha; executar somente quando não houver PostgreSQL.
$ErrorActionPreference = 'Stop'
$raizProjeto = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$arquivoEnv = Join-Path $raizProjeto 'web/.env'
$postgresBin = 'C:/Program Files/PostgreSQL/17/bin'
if (Test-Path -LiteralPath (Join-Path $postgresBin 'postgres.exe')) {
    throw 'PostgreSQL já existe. Configure DATABASE_URL para reutilizá-lo.'
}
if ((Test-Path -LiteralPath $arquivoEnv) -and ((Get-Content -LiteralPath $arquivoEnv) -match '^DATABASE_URL=.+')) {
    throw 'DATABASE_URL já configurada; não substituir credenciais existentes.'
}
$senhaLocal = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
# Credencial guardada antes do instalador para permitir recuperação se interrompido.
Add-Content -LiteralPath $arquivoEnv -Value "`nDATABASE_URL=postgresql://postgres:${senhaLocal}@localhost:5432/fatesa"
$opcoesInstalacao = "--mode unattended --unattendedmodeui none --superpassword $senhaLocal --servicename postgresql-fatesa-17 --serverport 5432 --enable-components server,commandlinetools --disable-components pgAdmin,stackbuilder"
& winget install --id PostgreSQL.PostgreSQL.17 --exact --source winget --silent --accept-package-agreements --accept-source-agreements --override $opcoesInstalacao
if ($LASTEXITCODE -ne 0) { throw 'Instalação não concluída; credencial preservada em web/.env.' }
Write-Output 'PostgreSQL instalado. Credencial local preservada em web/.env (não versionado).'
