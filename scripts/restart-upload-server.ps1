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

# Basic health check
Start-Sleep -Milliseconds 700
try {
  $resp = Invoke-WebRequest -UseBasicParsing ("http://127.0.0.1:{0}/health" -f $Port)
  Write-Output $resp.Content
} catch {
  Write-Output ("Health check failed: {0}" -f $_.Exception.Message)
}
