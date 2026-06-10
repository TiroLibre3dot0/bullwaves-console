Set-Location 'C:\Syncthing\Workspace\Visionaryos_Mother\Bullwaves_clean'

$data = Get-Content 'src/features/sales/data/bonus_preview_converted_by_currency.json' -Raw | ConvertFrom-Json
$rows = @($data.rows | Where-Object { $_.user -eq 'Roberta Jovanovic' })
if (-not $rows -or $rows.Count -eq 0) { throw 'Nessun cliente trovato per Roberta Jovanovic.' }

$campaignName = 'Global Exclusive Tradable Bonus'
$agentName = 'Roberta Jovanovic'
$publicLink = "https://bullwaves-console.vercel.app/api/email/agent-clients?campaign=$([uri]::EscapeDataString($campaignName))&agent=$([uri]::EscapeDataString($agentName))"

$top = @($rows | Select-Object -First 8)
$items = ($top | ForEach-Object -Begin { $i = 0 } -Process {
  $i++
  "<tr><td style='padding:9px 8px;border-top:1px solid #e6ecf5;'>$i</td><td style='padding:9px 8px;border-top:1px solid #e6ecf5;font-weight:700;'>$($_.name)</td><td style='padding:9px 8px;border-top:1px solid #e6ecf5;'>$($_.email)</td><td style='padding:9px 8px;border-top:1px solid #e6ecf5;'>$($_.tradingAccount)</td><td style='padding:9px 8px;border-top:1px solid #e6ecf5;'>$($_.bonusAccountCurrencyFormatted)</td><td style='padding:9px 8px;border-top:1px solid #e6ecf5;'>$([math]::Round([double]$_.netDepositsUsd,0))</td><td style='padding:9px 8px;border-top:1px solid #e6ecf5;'>Roberta Jovanovic</td></tr>"
}) -join ''

$totalBonus = '{0:N0}' -f (($rows | Measure-Object -Property bonusAccountCurrencyRaw -Sum).Sum)

$html = @"
<div style='margin:0;padding:0;background:#f2f6ff;font-family:Arial,sans-serif;color:#0f172a;'>
<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f2f6ff;padding:20px 12px;'><tr><td align='center'>
<table role='presentation' width='900' cellpadding='0' cellspacing='0' style='max-width:900px;background:#ffffff;border:1px solid #dbe6f6;border-radius:20px;overflow:hidden;'>
<tr><td style='background:linear-gradient(135deg,#0b1b3a 0%,#15408a 100%);padding:20px 22px;'><img src='https://bullwaves-console.vercel.app/Logo.png' alt='Bullwaves' width='156' style='display:block;width:156px;max-width:156px;height:auto;border:0;' /><div style='margin-top:18px;color:#ffffff;font-size:28px;line-height:1.2;font-weight:800;'>Agent Action Required</div><div style='margin-top:8px;color:#cfe2ff;font-size:14px;line-height:1.5;max-width:680px;'>Global Exclusive Tradable Bonus is live. This communication supports structured reactivation for clients who slowed or stopped after losses.</div></td></tr>
<tr><td style='padding:18px 22px 8px;'><div style='font-size:16px;font-weight:800;color:#0f172a;'>Hi Roberta,</div><div style='margin-top:8px;font-size:14px;color:#334155;line-height:1.6;'>The bonus already visible in clients accounts represents only a small portion of prior losses. Your objective is to frame this as a guided restart opportunity and drive a disciplined return to activity.</div><div style='margin-top:8px;font-size:14px;color:#334155;line-height:1.6;'>In WhatsApp outreach, confirm bonus availability, explain the reactivation strategy, and recommend Acuity tools to improve timing, confidence, and decision quality.</div></td></tr>
<tr><td style='padding:10px 22px 4px;'><table role='presentation' width='100%'><tr><td style='padding:0 8px 8px 0;'><div style='background:#edf4ff;border:1px solid #d7e3fb;border-radius:12px;padding:12px 14px;'><div style='font-size:11px;color:#5b6d8b;letter-spacing:.06em;text-transform:uppercase;font-weight:700;'>Assigned Clients</div><div style='margin-top:6px;font-size:22px;color:#0b1b3a;font-weight:900;'>$($rows.Count)</div></div></td><td style='padding:0 0 8px 0;'><div style='background:#eefcf6;border:1px solid #ccefdc;border-radius:12px;padding:12px 14px;'><div style='font-size:11px;color:#416c54;letter-spacing:.06em;text-transform:uppercase;font-weight:700;'>Campaign Bonus</div><div style='margin-top:6px;font-size:22px;color:#114b2e;font-weight:900;'>$$$totalBonus</div></div></td></tr></table></td></tr>
<tr><td style='padding:8px 22px 8px;'><div style='background:#f8fbff;border:1px solid #dce8f8;border-radius:12px;padding:14px 16px;'><div style='font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#40608d;font-weight:800;'>WhatsApp Action Plan</div><ol style='margin:8px 0 0 18px;padding:0;color:#1e293b;font-size:13px;line-height:1.6;'><li>Contact every assigned client listed below.</li><li>Confirm the client already has the campaign bonus in account.</li><li>Explain this bonus covers only a small part of previous losses and the goal is structured reactivation.</li><li>Recommend Acuity as a practical trading support tool and guide the client to next action.</li></ol></div></td></tr>
<tr><td style='padding:8px 22px 8px;'><div style='background:#f5f9ff;border:1px dashed #bfd4f5;border-radius:12px;padding:14px 16px;'><div style='font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#40608d;font-weight:800;'>Public Client Table Link</div><div style='margin-top:8px;font-size:13px;color:#334155;line-height:1.6;'>Open the full client table from browser and share internally if needed.</div><div style='margin-top:12px;'><a href='$publicLink' style='display:inline-block;background:#0f2a57;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 14px;border-radius:10px;'>Open Full Client Table</a></div><div style='margin-top:10px;font-size:11px;color:#51617b;word-break:break-all;'>$publicLink</div></div></td></tr>
<tr><td style='padding:8px 22px 20px;'><div style='border:1px solid #dce6f5;border-radius:14px;overflow:hidden;'><table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;'><thead><tr style='background:#0f2a57;'><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>#</th><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>Client</th><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>Email</th><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>Account</th><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>Bonus</th><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>Net USD</th><th style='padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;'>Owner</th></tr></thead><tbody>$items</tbody></table></div></td></tr>
<tr><td style='padding:0 22px 24px;'><div style='background:#f8fbff;border:1px solid #dce8f8;border-radius:12px;padding:14px 16px;font-size:12px;color:#48617f;line-height:1.65;'><div style='font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#40608d;font-weight:800;margin-bottom:6px;'>Official Internal Communication</div>This message is an internal operational instruction from Bullwaves Marketing Operations for campaign execution and client reactivation workflow.<br/>Escalations: <a href='mailto:paolo.v@bullwaves.com' style='color:#0f2a57;font-weight:700;text-decoration:none;'>paolo.v@bullwaves.com</a> · Support: <a href='mailto:support@bullwaves.com' style='color:#0f2a57;font-weight:700;text-decoration:none;'>support@bullwaves.com</a><br/><span style='color:#6a7f99;'>Bullwaves LTD · Internal Use Only</span></div></td></tr>
</table></td></tr></table></div>
"@

$body = @{
  viewerEmail = 'paolo.v@bullwaves.com'
  to = 'paolo.v@bullwaves.com'
  cc = @('Paolovullo@hotmail.it')
  bcc = @('Paolo.vullo@tirolibre.it')
  subject = '[TEST] Roberta Report - Public Link Included'
  text = "Test template Roberta con link pubblico clienti: $publicLink"
  html = $html
} | ConvertTo-Json -Depth 20

Invoke-RestMethod -Uri 'http://localhost:4000/api/email/send-test' -Method Post -Headers @{ 'content-type'='application/json'; 'x-bullwaves-user-email'='paolo.v@bullwaves.com' } -Body $body | ConvertTo-Json -Depth 20
