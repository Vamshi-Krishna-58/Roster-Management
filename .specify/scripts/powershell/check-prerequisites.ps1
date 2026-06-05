$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$bashScript = Join-Path $repoRoot ".specify/scripts/bash/check-prerequisites.sh"
$bash = Get-Command bash -ErrorAction SilentlyContinue

if (-not $bash) {
  Write-Error "bash is required to run Spec Kit scripts. Install Git Bash or WSL."
  exit 1
}

Push-Location $repoRoot
try {
  & $bash.Source $bashScript @args
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
