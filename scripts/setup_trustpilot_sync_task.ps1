param(
  [string]$TaskName = 'Bullwaves-Trustpilot-Sync',
  [int]$IntervalMinutes = 15,
  [string]$SourceUrl = $env:TRUSTPILOT_SOURCE_URL,
  [ValidateSet('remote-first', 'remote-only', 'local-only')]
  [string]$SourceMode = $(if ($env:TRUSTPILOT_SOURCE_MODE) { $env:TRUSTPILOT_SOURCE_MODE } else { 'remote-first' }),
  [switch]$RunVerifyData
)

$ErrorActionPreference = 'Stop'

if ($IntervalMinutes -lt 1 -or $IntervalMinutes -gt 1440) {
  throw 'IntervalMinutes must be between 1 and 1440.'
}

if (-not $SourceUrl) {
  throw 'Missing SourceUrl. Provide -SourceUrl or set TRUSTPILOT_SOURCE_URL.'
}

$syncScriptPath = Resolve-Path (Join-Path $PSScriptRoot 'sync_trustpilot_guidance.ps1')
$configPath = Resolve-Path $PSScriptRoot | ForEach-Object { Join-Path $_ 'trustpilot_sync.config.json' }

$config = [ordered]@{
  sourceUrl = $SourceUrl
  sourceMode = $SourceMode
  runVerifyData = [bool]$RunVerifyData
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
  (Format-CmdQuoted $syncScriptPath)
)

$taskCommand = 'powershell.exe ' + ($taskArgs -join ' ')
$startTime = (Get-Date).AddMinutes(1).ToString('HH:mm')

Write-Host "[Trustpilot Task] Creating or updating task '$TaskName' every $IntervalMinutes minute(s)."
Write-Host "[Trustpilot Task] Config file: $configPath"

& schtasks.exe /Create /F /SC MINUTE /MO $IntervalMinutes /ST $startTime /TN $TaskName /TR $taskCommand | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Failed to create scheduled task. Exit code: $LASTEXITCODE"
}

Write-Host "[Trustpilot Task] Task created/updated."
Write-Host "[Trustpilot Task] Query output:"
& schtasks.exe /Query /TN $TaskName /FO LIST /V | Out-Host

Write-Host ''
Write-Host '[Trustpilot Task] To remove it later:'
Write-Host "schtasks /Delete /TN \"$TaskName\" /F"
