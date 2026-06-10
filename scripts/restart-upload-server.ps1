param(
  [int]$Port = 4000
)

$ErrorActionPreference = 'Stop'

$wd = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

Write-Output ("Restarting upload server on port {0}..." -f $Port)

# Stop existing listener on the port (if any)
try {
  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener -and $listener.OwningProcess) {
    $listenerPid = $listener.OwningProcess
    Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
    Write-Output ("Stopped PID={0}" -f $listenerPid)
    Start-Sleep -Milliseconds 300
  } else {
    Write-Output "No listener to stop"
  }
} catch {
  Write-Output ("Warning: failed to stop existing listener: {0}" -f $_.Exception.Message)
}

# Start server in background
$p = Start-Process -FilePath "node" -ArgumentList "scripts\\upload-server.js" -WorkingDirectory $wd -PassThru -WindowStyle Hidden
Write-Output ("Started PID={0}" -f $p.Id)

# Robust health check: poll long enough for Node bootstrap + any first-load work.
$healthUrl = "http://127.0.0.1:{0}/health" -f $Port
$deadline = [DateTime]::UtcNow.AddSeconds(25)
$healthy = $false

while ([DateTime]::UtcNow -lt $deadline) {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing $healthUrl -TimeoutSec 2
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
      Write-Output $resp.Content
      $healthy = $true
      break
    }
  } catch {
    # keep polling until timeout
  }

  if ($p.HasExited) {
    throw ("Upload server process exited immediately (PID={0}, ExitCode={1})" -f $p.Id, $p.ExitCode)
  }

  Start-Sleep -Milliseconds 350
}

if (-not $healthy) {
  throw ("Health check failed after restart (URL={0}, PID={1})" -f $healthUrl, $p.Id)
}
