const fs = require('node:fs')
const path = require('node:path')

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'features', 'sales', 'data', 'allTemplatesCatalog.js')
const SNAPSHOT_PATH = path.join(
  __dirname,
  '..',
  'src',
  'features',
  'sales',
  'data',
  'bonus_preview_converted_by_currency.json'
)
const TEMPLATE_ID = 'bullwaves-global-exclusive-tradable-bonus-en'
const SEND_TEST_URL = 'http://localhost:4000/api/email/send-test'

function extractTemplateHtml(catalogText, templateId) {
  const idNeedle = `id: '${templateId}'`
  const idPos = catalogText.indexOf(idNeedle)
  if (idPos < 0) return ''

  const htmlStartMarker = 'html: `'
  const htmlStart = catalogText.indexOf(htmlStartMarker, idPos)
  if (htmlStart < 0) return ''

  const contentStart = htmlStart + htmlStartMarker.length
  const contentEnd = catalogText.indexOf('`', contentStart)
  if (contentEnd < 0) return ''

  return catalogText.slice(contentStart, contentEnd)
}

function extractFirstName(fullName) {
  const raw = String(fullName || '').trim()
  if (!raw) return 'Trader'
  return raw.split(/\s+/)[0] || 'Trader'
}

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

function buildCampaignTemplateHtml(html, campaignRow) {
  const source = String(html || '')
  if (!source || !campaignRow) return source

  const firstName = extractFirstName(campaignRow.name)
  const bonusAmount = moneyWithCurrency(
    roundToNearestThousand(campaignRow.bonusAccountCurrencyRaw || 0),
    campaignRow.accountCurrency
  )
  const tradingAccount = String(campaignRow.tradingAccount || '').trim() || '—'

  return source
    .replaceAll('[First Name]', firstName)
    .replaceAll('[Bonus Amount]', bonusAmount)
    .replaceAll('[Trading Account ID]', tradingAccount)
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

function sanitizeTemplatePreviewHtml(value) {
  return String(value || '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>/gi, '')
    .replace(/<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .trim()
}

function buildAgentBriefSubject({ campaignName, agentName, totalClients }) {
  const safeCampaign = String(campaignName || 'Marketing Campaign').trim()
  const safeAgent = String(agentName || 'Agent').trim()
  const clients = Number(totalClients || 0)
  return `[Action Required] ${safeCampaign} - WhatsApp outreach (${clients}) - ${safeAgent}`
}

function buildAgentBriefHtml({ campaignName, agentName, clients, templateHtml }) {
  const safeCampaign = String(campaignName || 'Marketing Campaign').trim()
  const safeAgent = String(agentName || 'Agent').trim()
  const logoUrl = 'https://bullwaves-console.vercel.app/Logo.png'
  const templateSource = String(templateHtml || '').trim()
  const rows = Array.isArray(clients) ? clients : []

  const previewBlocksHtml = rows
    .slice(0, Math.min(rows.length, 3))
    .map((client, index) => {
      const exactPreview = sanitizeTemplatePreviewHtml(buildCampaignTemplateHtml(templateSource, client))
      const exactSubject = buildCampaignSubject(client)
      return `
        <div style="margin-top:${index === 0 ? 0 : 16}px;border:1px solid #dce6f5;border-radius:16px;overflow:hidden;background:#ffffff;">
          <div style="padding:12px 14px;background:#f8fbff;border-bottom:1px solid #dce6f5;">
            <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#40608d;font-weight:800;">Exact Console Template Preview</div>
            <div style="margin-top:6px;font-size:14px;font-weight:800;color:#0f172a;">${String(client?.name || '—')}</div>
            <div style="margin-top:4px;font-size:12px;color:#52637d;">Subject: ${exactSubject}</div>
          </div>
          <div style="padding:0;background:#ffffff;">${exactPreview}</div>
        </div>
      `
    })
    .join('')

  const rowsHtml = rows
    .map((client, index) => {
      const tradingAccount = String(client?.tradingAccount || '—').trim() || '—'
      const bonus = moneyWithCurrency(roundToNearestThousand(client?.bonusAccountCurrencyRaw || 0), client?.accountCurrency)
      const subject = buildCampaignSubject(client)

      return `
        <tr>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;">${index + 1}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${String(client?.name || '—')}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#334155;font-size:12px;">${String(client?.email || '—')}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;">${tradingAccount}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${bonus}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#334155;font-size:12px;">${subject}</td>
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
                              Client Template Reference
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style="margin-top:18px;color:#ffffff;font-size:28px;line-height:1.2;font-weight:800;">
                        Client List For Agent Sending
                      </div>
                      <div style="margin-top:8px;color:#cfe2ff;font-size:14px;line-height:1.5;max-width:680px;">
                        Below you will find the exact client list and the exact client-facing template currently configured in console, without internal reinterpretation.
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 22px 8px;">
                      <div style="font-size:16px;font-weight:800;color:#0f172a;">Hi ${safeAgent},</div>
                      <div style="margin-top:8px;font-size:14px;color:#334155;line-height:1.6;">
                        This email contains the clients assigned to you for ${safeCampaign} and the exact template that clients receive from Bullwaves.
                      </div>
                      <div style="margin-top:8px;font-size:14px;color:#334155;line-height:1.6;">
                        Use this as the reference to keep the outbound communication perfectly aligned with what is visible on the console and what is sent to the client.
                      </div>
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
                              <div style="background:#f8fbff;border:1px solid #dce8f8;border-radius:12px;padding:12px 14px;">
                                <div style="font-size:11px;color:#40608d;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">Template Source</div>
                                <div style="margin-top:6px;font-size:15px;color:#0f2a57;font-weight:800;">Exact console template</div>
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
                        <div style="font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#40608d;font-weight:800;">Reference Rule</div>
                        <ol style="margin:8px 0 0 18px;padding:0;color:#1e293b;font-size:13px;line-height:1.6;">
                          <li>Use the exact client-facing template shown below as the reference.</li>
                          <li>Do not rewrite or reinterpret the marketing content in this internal email.</li>
                          <li>Use the client list table to match recipient, account, bonus amount, and subject.</li>
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
                              <th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Client Subject</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${rowsHtml}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 22px 20px;">
                      ${previewBlocksHtml}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 22px 24px;">
                      <div style="background:#f8fbff;border:1px solid #dce8f8;border-radius:12px;padding:14px 16px;font-size:12px;color:#48617f;line-height:1.65;">
                        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#40608d;font-weight:800;margin-bottom:6px;">Official Internal Communication</div>
                        This message is an internal reference email containing the exact client template currently configured in console together with the assigned client list.<br/>
                        For escalations: <a href="mailto:paolo.v@bullwaves.com" style="color:#0f2a57;font-weight:700;text-decoration:none;">paolo.v@bullwaves.com</a> ·
                        Support: <a href="mailto:support@bullwaves.com" style="color:#0f2a57;font-weight:700;text-decoration:none;">support@bullwaves.com</a><br/>
                        <span style="color:#6a7f99;">Bullwaves LTD · Internal Use Only</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
  const catalogText = fs.readFileSync(CATALOG_PATH, 'utf8')
  const templateHtml = extractTemplateHtml(catalogText, TEMPLATE_ID)
  if (!templateHtml) throw new Error('TEMPLATE_NOT_FOUND')

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
    templateHtml,
  })

  const payload = {
    viewerEmail: 'paolo.v@bullwaves.com',
    to: 'paolo.v@bullwaves.com',
    cc: ['Paolovullo@hotmail.it'],
    bcc: ['Paolo.vullo@tirolibre.it'],
    fromEmail: 'support@bullwaves.com',
    fromName: 'Bullwaves Exclusive',
    subject: `[TEST] ${subject}`,
    html,
    text: `Agent list test for ${agentName}. Total clients: ${rows.length}. Exact client template previews included.`,
  }

  const send = await postJson(SEND_TEST_URL, payload)
  const out = {
    ok: send.status >= 200 && send.status < 300 && Boolean(send?.body?.ok),
    sendStatus: send.status,
    sendBody: send.body,
    meta: {
      agentName,
      rows: rows.length,
      sampleClientsIncludedInPreview: Math.min(rows.length, 3),
    },
  }

  console.log(JSON.stringify(out, null, 2))
  if (!out.ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
