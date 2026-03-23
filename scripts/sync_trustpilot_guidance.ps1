param(
  [string]$SourceUrl = $env:TRUSTPILOT_SOURCE_URL,
  [ValidateSet('remote-first', 'remote-only', 'local-only')]
  [string]$SourceMode = $(if ($env:TRUSTPILOT_SOURCE_MODE) { $env:TRUSTPILOT_SOURCE_MODE } else { 'remote-first' }),
  [switch]$RunVerifyData,
  [string]$ConfigPath,
  [string]$LogPath
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
    if ((-not $LogPath) -and $cfg.logPath) {
      $LogPath = [string]$cfg.logPath
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

function Append-Log([string]$message) {
  if (-not $LogPath) { return }
  $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  try {
    Add-Content -Path $LogPath -Value "[$ts] $message"
  } catch {
    # ignore log append failures
  }
}

$transcriptStarted = $false
if ($LogPath) {
  $logDir = Split-Path -Path $LogPath -Parent
  if ($logDir) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  }

  try {
    Start-Transcript -Path $LogPath -Append | Out-Null
    $transcriptStarted = $true
    Append-Log 'Transcript logging enabled.'
  } catch {
    Append-Log "Transcript unavailable: $($_.Exception.Message)"
    Write-Warning "Unable to start transcript log at '$LogPath': $($_.Exception.Message)"
  }
}

Write-Host "[Trustpilot Sync] Root: $root"
Write-Host "[Trustpilot Sync] Source mode: $SourceMode"
Write-Host "[Trustpilot Sync] Running guidance generator..."
Append-Log "Sync start. root=$root mode=$SourceMode"

Push-Location $root
try {
  npm run generate:trustpilot-guidance
  if ($LASTEXITCODE -ne 0) {
    Append-Log "generate:trustpilot-guidance failed with exit code $LASTEXITCODE"
    throw "generate:trustpilot-guidance failed with exit code $LASTEXITCODE"
  }
  Append-Log 'generate:trustpilot-guidance completed successfully.'

  if ($RunVerifyData) {
    Write-Host '[Trustpilot Sync] Running verify:data...'
    Append-Log 'verify:data start.'
    npm run verify:data
    if ($LASTEXITCODE -ne 0) {
      Append-Log "verify:data failed with exit code $LASTEXITCODE"
      throw "verify:data failed with exit code $LASTEXITCODE"
    }
    Append-Log 'verify:data completed successfully.'
  }

  Write-Host '[Trustpilot Sync] Completed successfully.'
  Append-Log 'Sync completed successfully.'
} finally {
  Pop-Location
  if ($transcriptStarted) {
    try {
      Stop-Transcript | Out-Null
    } catch {
      # ignore transcript stop errors
    }
  }
  Append-Log 'Sync end.'
}
