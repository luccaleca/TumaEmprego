# Verifica se o stage contém arquivos locais de dados/ (fora dos templates).
# Uso: powershell -File scripts/verify-staged-safe.ps1

$ErrorActionPreference = "Stop"

$allowedDados = @(
  "dados/README.md",
  "dados/conteudo/banco.example.yml",
  "dados/cv-base.example.md",
  "dados/config/profile.example.yml",
  "dados/config/busca.example.yml",
  "dados/config/formacao.example.yml",
  "dados/config/tecnologias.example.yml",
  "dados/respostas/padrao.example.yml",
  "dados/respostas/comportamental.example.yml",
  "dados/curriculo/ativo.example.yml",
  "dados/curriculo/adaptacao-prompt.example.md",
  "dados/curriculo/modelo.md",
  "dados/resultados/exemplo.yml"
)

$allowedPrefixes = @(
  "dados/busca/.gitkeep",
  "dados/candidaturas/.gitkeep",
  "dados/curriculo/.gitkeep",
  "dados/curriculo/vagas/.gitkeep",
  "dados/fotos/.gitkeep",
  "dados/pdfs/.gitkeep",
  "dados/respostas/.gitkeep",
  "dados/resultados/.gitkeep",
  "dados/templates/.gitkeep"
)

$staged = @(git diff --cached --name-only 2>$null)
if (-not $staged.Count) {
  Write-Host "Nenhum arquivo no stage."
  exit 0
}

$blocked = @()
foreach ($path in $staged) {
  $normalized = $path -replace "\\", "/"
  if ($normalized -notlike "dados/*") { continue }

  if ($allowedDados -contains $normalized) { continue }
  if ($allowedPrefixes -contains $normalized) { continue }
  if ($normalized -like "*.example.*") { continue }
  if ($normalized -like "*/.gitkeep") { continue }

  $blocked += $normalized
}

if ($blocked.Count) {
  Write-Host "ERRO: arquivo local de dados/ no stage (use apenas templates *.example):" -ForegroundColor Red
  $blocked | ForEach-Object { Write-Host "  $_" }
  exit 1
}

Write-Host "OK: stage compativel com templates de dados/."
exit 0
