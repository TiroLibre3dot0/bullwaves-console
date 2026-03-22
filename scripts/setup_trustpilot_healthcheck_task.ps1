param(
  [string]$TaskName = 'Bullwaves-Trustpilot-HealthCheck',
  [string]$StartTime = '08:30'
)

$ErrorActionPreference = 'Stop'

if ($StartTime -notmatch '^([01]\d|2[0-3]):[0-5]\d$') {
  throw 'StartTime must be in HH:mm 24h format, e.g. 08:30.'
}

$checkScriptPath = Resolve-Path (Join-Path $PSScriptRoot 'check_trustpilot_source.ps1')

function Format-CmdQuoted([string]$value) {
  return '"' + ($value -replace '"', '\"') + '"'
}

$taskCommand = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File ' + (Format-CmdQuoted $checkScriptPath)

Write-Host "[Trustpilot Healthcheck Task] Creating or updating daily task '$TaskName' at $StartTime."

& schtasks.exe /Create /F /SC DAILY /ST $StartTime /TN $TaskName /TR $taskCommand | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Failed to create healthcheck scheduled task. Exit code: $LASTEXITCODE"
}

Write-Host '[Trustpilot Healthcheck Task] Task created/updated.'
Write-Host '[Trustpilot Healthcheck Task] Query output:'
& schtasks.exe /Query /TN $TaskName /FO LIST /V | Out-Host

Write-Host ''
Write-Host '[Trustpilot Healthcheck Task] To remove it later:'
Write-Host "schtasks /Delete /TN \"$TaskName\" /F"
