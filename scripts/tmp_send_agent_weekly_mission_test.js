const fs = require('node:fs')
const path = require('node:path')

const SNAPSHOT_PATH = path.join(
  __dirname,
  '..',
  'src',
  'features',
  'sales',
  'data',
  'bonus_preview_converted_by_currency.json'
)
const SEND_TEST_URL = 'http://localhost:4000/api/email/send-test'

function roundToNearestThousand(value) {
  return Math.round(Number(value || 0) / 1000) * 1000
}

function moneyWithCurrency(value, currencyCode) {
  if (!currencyCode) return '—'
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}

function extractFirstName(fullName) {
  const raw = String(fullName || '').trim()
  if (!raw) return 'Trader'
  return raw.split(/\s+/)[0] || 'Trader'
}

function buildCampaignSubject(campaignRow) {
  const firstName = extractFirstName(campaignRow?.name)
  const bonusAmount = moneyWithCurrency(
    roundToNearestThousand(campaignRow?.bonusAccountCurrencyRaw || 0),
    campaignRow?.accountCurrency
  )
  const tradingAccount = String(campaignRow?.tradingAccount || '').trim()

  if (!tradingAccount) {
    return `${firstName}, your exclusive tradable bonus of ${bonusAmount} is ready`
  }

  return `${firstName}, your exclusive tradable bonus of ${bonusAmount} is ready - Acc ${tradingAccount}`
}

function buildAgentBriefSubject({ campaignName, agentName, totalClients }) {
  const _safeCampaign = String(campaignName || 'Marketing Campaign').trim()
  const safeAgent = String(agentName || 'Agent').trim()
  const _clients = Number(totalClients || 0)
  const agentFirstName = extractFirstName(safeAgent)
  return `Bullwaves Weekly Mission: Bonus Release Outreach - ${agentFirstName}`
}

function buildAgentBriefHtml({ campaignName, agentName, clients }) {
  const safeCampaign = String(campaignName || 'Marketing Campaign').trim()
  const safeAgent = String(agentName || 'Agent').trim()
  const logoUrl = 'https://bullwaves-console.vercel.app/Logo.png'
  const rows = Array.isArray(clients) ? clients : []

  const cumulativeBonusUsd = rows.reduce((sum, client) => {
    const rate = Number(client?.usdToAccountRate || 0)
    const raw = Number(client?.officialBonusAccountCurrencyRaw || 0) || Number(client?.bonusAccountCurrencyRaw || 0)
    if (rate > 0) return sum + raw / rate
    return sum
  }, 0)
  const cumulativeBonusText = moneyWithCurrency(cumulativeBonusUsd, 'USD')

  const rowsHtml = rows
    .map((client, index) => {
      const tradingAccount = String(client?.tradingAccount || '—').trim() || '—'
      const officialBonusRaw =
        Number(client?.officialBonusAccountCurrencyRaw || 0) || Number(client?.bonusAccountCurrencyRaw || 0)
      const bonus = moneyWithCurrency(officialBonusRaw, client?.accountCurrency)
      const contactChannel = String(client?.phone || '').trim() ? `WhatsApp / Phone (${String(client.phone).trim()})` : 'WhatsApp / Phone'

      return `
        <tr>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;">${index + 1}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${String(client?.name || '—')}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#334155;font-size:12px;">${String(client?.email || '—')}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;">${tradingAccount}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${bonus}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#334155;font-size:12px;">${contactChannel}</td>
        </tr>
      `
    })
    .join('')

  return `
    <div style="margin:0;padding:0;background:#f2f6ff;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f2f6ff;padding:22px 12px;">
        <tbody>
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:900px;background:#ffffff;border:1px solid #dbe6f6;border-radius:20px;overflow:hidden;">
                <tbody>
                  <tr>
                    <td style="background:linear-gradient(135deg,#0b1b3a 0%,#15408a 100%);padding:20px 22px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tbody>
                          <tr>
                            <td align="left" valign="middle">
                              <img src="${logoUrl}" alt="Bullwaves" width="156" style="display:block;width:156px;max-width:156px;height:auto;border:0;" />
                            </td>
                            <td align="right" valign="middle" style="color:#cfe2ff;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">
                              Weekly Mission
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style="margin-top:18px;color:#ffffff;font-size:28px;line-height:1.2;font-weight:800;">Weekly Mission Assignment</div>
                      <div style="margin-top:8px;color:#cfe2ff;font-size:14px;line-height:1.5;max-width:680px;">${safeAgent}, the mission for this week is: complete outreach on your assigned client list.</div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 22px 8px;">
                      <div style="font-size:16px;font-weight:800;color:#0f172a;">Hi ${safeAgent},</div>
                      <div style="margin-top:8px;font-size:14px;color:#334155;line-height:1.6;">This is your official assignment for ${safeCampaign}. Below is the client list and total bonus coverage.</div>
                      <div style="margin-top:8px;font-size:14px;color:#334155;line-height:1.6;"><span style="font-weight:800;color:#0f2a57;">&#x1F3AF; Goal:</span> inform each client that we released a bonus to their account.</div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 22px 4px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tbody>
                          <tr>
                            <td style="padding:0 8px 8px 0;">
                              <div style="background:#eef4ff;border:1px solid #d7e3fb;border-radius:12px;padding:12px 14px;">
                                <div style="font-size:11px;color:#5b6d8b;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">Assigned Clients</div>
                                <div style="margin-top:6px;font-size:22px;color:#0b1b3a;font-weight:900;">${rows.length}</div>
                              </div>
                            </td>
                            <td style="padding:0 8px 8px 0;">
                              <div style="background:#eefcf6;border:1px solid #ccefdc;border-radius:12px;padding:12px 14px;">
                                <div style="font-size:11px;color:#416c54;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">Cumulative Bonus</div>
                                <div style="margin-top:6px;font-size:22px;color:#114b2e;font-weight:900;">${cumulativeBonusText}</div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:8px 22px 8px;">
                      <div style="background:#f8fbff;border:1px solid #dce8f8;border-radius:12px;padding:14px 16px;">
                        <div style="font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#40608d;font-weight:800;">Mission Tasks (Week)</div>
                        <ol style="margin:8px 0 0 18px;padding:0;color:#1e293b;font-size:13px;line-height:1.6;">
                          <li>Contact 100% of assigned clients.</li>
                          <li>Use WhatsApp and phone for direct contact.</li>
                          <li>Complete mission by end of week and report blockers.</li>
                        </ol>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:8px 22px 20px;">
                      <div style="border:1px solid #dce6f5;border-radius:14px;overflow:hidden;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                          <thead>
                            <tr style="background:#0f2a57;">
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">#</th>
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Client</th>
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Email</th>
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Account</th>
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Bonus</th>
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Contact Channel</th>
                            </tr>
                          </thead>
                          <tbody>${rowsHtml}</tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 0 0;">
              <div style="max-width:900px;background:linear-gradient(135deg,#0a1d3f 0%,#123674 50%,#1d4f9e 100%);border:1px solid #2758a5;border-radius:14px;padding:16px 18px;font-size:12px;color:#f5f9ff;line-height:1.7;box-shadow:0 8px 22px rgba(10,29,63,0.28);">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <td valign="top" style="width:170px;padding:0 14px 0 0;">
                        <img src="${logoUrl}" alt="Bullwaves" width="138" style="display:block;width:138px;max-width:138px;height:auto;border:0;" />
                      </td>
                      <td valign="top" style="color:#f5f9ff;font-size:12px;line-height:1.7;">
                        Internal operational assignment linked to your client list for this week.<br/>
                        <span style="color:#d6e4ff;">Bullwaves LTD · Internal Use Only · Mission Window: Mon-Fri</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-bullwaves-user-email': 'paolo.v@bullwaves.com',
    },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({}))
  return { status: response.status, body: json }
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'))
  const allRows = Array.isArray(snapshot?.rows) ? snapshot.rows : []
  const rows = allRows.filter((row) => String(row?.user || '').trim() === 'Roberta Jovanovic')
  if (!rows.length) throw new Error('NO_AGENT_ROWS_FOUND')

  const campaignName = 'Bullwaves Global Exclusive Tradable Bonus'
  const agentName = 'Roberta Jovanovic'
  const subject = buildAgentBriefSubject({
    campaignName,
    agentName,
    totalClients: rows.length,
  })

  const html = buildAgentBriefHtml({
    campaignName,
    agentName,
    clients: rows,
  })

  const cumulativeBonusUsd = rows.reduce((sum, client) => {
    const rate = Number(client?.usdToAccountRate || 0)
    const raw = Number(client?.officialBonusAccountCurrencyRaw || 0) || Number(client?.bonusAccountCurrencyRaw || 0)
    if (rate > 0) return sum + raw / rate
    return sum
  }, 0)

  const payload = {
    viewerEmail: 'paolo.v@bullwaves.com',
    to: 'roberta.jovanovic@bullwaves.com',
    cc: ['paolo.v@bullwaves.com'],
    bcc: [
      'affiliates@bullwaves.com',
      'francesco@bullwaves.com',
      'renato@bullwaves.com',
      'partners@bullwaves.com',
      'chrystalla.zezou@bullwaves.com',
      'daniel.t@bullwaves.com',
    ],
    fromEmail: 'support@bullwaves.com',
    fromName: 'Bullwaves Exclusive',
    subject,
    html,
    text: `Weekly mission for ${agentName}: ${rows.length} assigned clients, cumulative bonus ${moneyWithCurrency(cumulativeBonusUsd, 'USD')}. Complete outreach and follow-up within the week.`,
  }

  const send = await postJson(SEND_TEST_URL, payload)
  const out = {
    ok: send.status >= 200 && send.status < 300 && Boolean(send?.body?.ok),
    sendStatus: send.status,
    sendBody: send.body,
    meta: {
      agentName,
      rows: rows.length,
      cumulativeBonusUsd: moneyWithCurrency(cumulativeBonusUsd, 'USD'),
    },
  }

  console.log(JSON.stringify(out, null, 2))
  if (!out.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
