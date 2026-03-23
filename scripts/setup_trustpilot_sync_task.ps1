param(
  [string]$TaskName = 'Bullwaves-Trustpilot-Sync',
  [int]$IntervalMinutes = 15,
  [string]$SourceUrl = $env:TRUSTPILOT_SOURCE_URL,
  [ValidateSet('remote-first', 'remote-only', 'local-only')]
  [string]$SourceMode = $(if ($env:TRUSTPILOT_SOURCE_MODE) { $env:TRUSTPILOT_SOURCE_MODE } else { 'remote-first' }),
  [switch]$RunVerifyData,
  [string]$LogPath,
  [switch]$RunAsSystem
)

$ErrorActionPreference = 'Stop'

if ($IntervalMinutes -lt 1 -or $IntervalMinutes -gt 1440) {
  throw 'IntervalMinutes must be between 1 and 1440.'
}

$syncScriptPath = Resolve-Path (Join-Path $PSScriptRoot 'sync_trustpilot_guidance.ps1')
$configPath = Resolve-Path $PSScriptRoot | ForEach-Object { Join-Path $_ 'trustpilot_sync.config.json' }

if (Test-Path $configPath) {
  try {
    $existing = Get-Content -Path $configPath -Raw | ConvertFrom-Json
    if ((-not $SourceUrl) -and $existing.sourceUrl) {
      $SourceUrl = [string]$existing.sourceUrl
    }
    if (($SourceMode -eq 'remote-first') -and $existing.sourceMode) {
      $SourceMode = [string]$existing.sourceMode
    }
    if ((-not $RunVerifyData) -and ($null -ne $existing.runVerifyData)) {
      $RunVerifyData = [bool]$existing.runVerifyData
    }
    if ((-not $LogPath) -and $existing.logPath) {
      $LogPath = [string]$existing.logPath
    }
  } catch {
    throw "Invalid existing sync config file: $configPath"
  }
}

if (-not $SourceUrl) {
  throw 'Missing SourceUrl. Provide -SourceUrl, set TRUSTPILOT_SOURCE_URL, or configure scripts/trustpilot_sync.config.json.'
}

if (-not $LogPath) {
  $LogPath = Join-Path (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'artifacts') 'logs\trustpilot_sync.log'
}

$logDir = Split-Path -Path $LogPath -Parent
if ($logDir) {
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}

if (-not (Test-Path $LogPath)) {
  New-Item -ItemType File -Path $LogPath -Force | Out-Null
}

$config = [ordered]@{
  sourceUrl = $SourceUrl
  sourceMode = $SourceMode
  runVerifyData = [bool]$RunVerifyData
  logPath = $LogPath
}

$config | ConvertTo-Json | Set-Content -Path $configPath -Encoding UTF8

function Format-CmdQuoted([string]$value) {
  return '"' + ($value -replace '"', '\"') + '"'
}

$taskArgs = @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  (Format-CmdQuoted $syncScriptPath),
  '-ConfigPath',
  (Format-CmdQuoted $configPath)
)

$taskCommand = 'powershell.exe ' + ($taskArgs -join ' ')
$startTime = (Get-Date).AddMinutes(1).ToString('HH:mm')

Write-Host "[Trustpilot Task] Creating or updating task '$TaskName' every $IntervalMinutes minute(s)."
Write-Host "[Trustpilot Task] Config file: $configPath"
Write-Host "[Trustpilot Task] Log file: $LogPath"

if ($RunAsSystem) {
  & schtasks.exe /Create /F /SC MINUTE /MO $IntervalMinutes /ST $startTime /TN $TaskName /TR $taskCommand /RU SYSTEM /RL HIGHEST | Out-Host
} else {
  & schtasks.exe /Create /F /SC MINUTE /MO $IntervalMinutes /ST $startTime /TN $TaskName /TR $taskCommand | Out-Host
}
if ($LASTEXITCODE -ne 0) {
  throw "Failed to create scheduled task. Exit code: $LASTEXITCODE"
}

Write-Host "[Trustpilot Task] Task created/updated."
Write-Host "[Trustpilot Task] Query output:"
& schtasks.exe /Query /TN $TaskName /FO LIST /V | Out-Host

Write-Host ''
Write-Host '[Trustpilot Task] To remove it later:'
Write-Host "schtasks /Delete /TN \"$TaskName\" /F"
