$ErrorActionPreference = "Continue"

$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psql)) {
  Write-Error "psql não encontrado em $psql"
}

if (-not $env:POSTGRES_ADMIN_PASSWORD) {
  Write-Error "Defina POSTGRES_ADMIN_PASSWORD com a senha do usuário postgres"
}

$env:PGPASSWORD = $env:POSTGRES_ADMIN_PASSWORD

& $psql -U postgres -h localhost -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tuma') THEN CREATE ROLE tuma LOGIN PASSWORD 'tuma'; END IF; END `$`$;"

$dbExists = (& $psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = 'tuma_emprego'")
if (-not $dbExists) { $dbExists = "" }
$dbExists = $dbExists.Trim()
if ($dbExists -ne "1") {
  & $psql -U postgres -h localhost -c "CREATE DATABASE tuma_emprego OWNER tuma;"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$env:PGPASSWORD = "tuma"
& $psql -U tuma -h localhost -d tuma_emprego -c "GRANT ALL ON SCHEMA public TO tuma;"

Write-Host "Banco tuma_emprego pronto (usuario tuma / senha tuma)"
