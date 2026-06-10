Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location 'C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_clean'

Write-Host '==> Build production'
npm run build

Write-Host '==> Deploy production (Vercel)'
npx vercel --prod --yes

$publicUrl = 'https://bullwaves-console.vercel.app/api/email/agent-clients?campaign=Global%20Exclusive%20Tradable%20Bonus&agent=Roberta%20Jovanovic&format=json'

Write-Host '==> Verify public endpoint'
$result = Invoke-RestMethod -Uri $publicUrl -Method Get

if (-not $result.ok) {
  throw 'Endpoint responded but not ok=true.'
}

$count = [int]($result.count)
Write-Host ("Public endpoint ok. count={0}" -f $count)

if ($count -le 0) {
  throw 'Public endpoint is reachable but returned zero rows.'
}

Write-Host '==> Optional: send test email with public link'
Write-Host "Run: powershell -ExecutionPolicy Bypass -File .\scripts\tmp_send_roberta_with_public_link.ps1"
