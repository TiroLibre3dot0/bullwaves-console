param(
  [string]$SourceUrl = $env:TRUSTPILOT_SOURCE_URL,
  [ValidateSet('remote-first', 'remote-only', 'local-only')]
  [string]$SourceMode = $(if ($env:TRUSTPILOT_SOURCE_MODE) { $env:TRUSTPILOT_SOURCE_MODE } else { 'remote-first' }),
  [switch]$RunVerifyData,
  [string]$ConfigPath
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm was not found in PATH. Install Node.js and retry.'
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..')

if (-not $ConfigPath) {
  $ConfigPath = Join-Path $PSScriptRoot 'trustpilot_sync.config.json'
}

if ((-not $SourceUrl) -and (Test-Path $ConfigPath)) {
  try {
    $cfg = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
    if ($cfg.sourceUrl) {
      $SourceUrl = [string]$cfg.sourceUrl
    }
    if ($cfg.sourceMode) {
      $SourceMode = [string]$cfg.sourceMode
    }
    if (($null -ne $cfg.runVerifyData) -and (-not $RunVerifyData)) {
      $RunVerifyData = [bool]$cfg.runVerifyData
    }
  } catch {
    throw "Invalid sync config file: $ConfigPath"
  }
}

if (-not $SourceUrl) {
  throw 'Missing SourceUrl. Provide -SourceUrl, set TRUSTPILOT_SOURCE_URL, or configure scripts/trustpilot_sync.config.json.'
}

$env:TRUSTPILOT_SOURCE_URL = $SourceUrl
$env:TRUSTPILOT_SOURCE_MODE = $SourceMode

Write-Host "[Trustpilot Sync] Root: $root"
Write-Host "[Trustpilot Sync] Source mode: $SourceMode"
Write-Host "[Trustpilot Sync] Running guidance generator..."

Push-Location $root
try {
  npm run generate:trustpilot-guidance
  if ($LASTEXITCODE -ne 0) {
    throw "generate:trustpilot-guidance failed with exit code $LASTEXITCODE"
  }

  if ($RunVerifyData) {
    Write-Host '[Trustpilot Sync] Running verify:data...'
    npm run verify:data
    if ($LASTEXITCODE -ne 0) {
      throw "verify:data failed with exit code $LASTEXITCODE"
    }
  }

  Write-Host '[Trustpilot Sync] Completed successfully.'
} finally {
  Pop-Location
}
