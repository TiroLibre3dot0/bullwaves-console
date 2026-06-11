import { useEffect, useMemo, useState } from 'react'
import { ALL_TEMPLATES_CATALOG } from '../data/allTemplatesCatalog'
import marketingCampaignPreview from '../data/bonus_preview_converted_by_currency.json'
import { sections as orgChartSections } from '../../../pages/orgChartData'

const PRIVATE_EMAIL = 'paolo.v@bullwaves.com'
const TRACKING_REFRESH_MS = 20000
const AGENT_MAIL_CC_VISIBLE = ['paolo.v@bullwaves.com', 'roberta.jovanovic@bullwaves.com']

// Virtual agents: clients are auto-assigned, not real sales agents.
// Their client lists are merged into a single email sent to the virtual recipient.
const VIRTUAL_AGENT_NAMES = new Set(['Roberta Jovanovic', 'Filippo Derosa'])
const VIRTUAL_AGENT_RECIPIENT = 'roberta.jovanovic@bullwaves.com'
const AGENT_MAIL_BCC_HIDDEN = [
  'affiliates@bullwaves.com',
  'francesco@bullwaves.com',
  'renato@bullwaves.com',
  'partners@bullwaves.com',
  'chrystalla.zezou@bullwaves.com',
  'daniel.t@bullwaves.com',
]

// Users provided by operations: they have not used the bonus yet.
const NO_ACTIVE_BONUS_LOGIN_IDS = new Set([
  '924551',
  '925369',
  '926213',
  '926470',
  '927845',
  '929815',
  '932079',
  '935969',
  '939833',
  '940087',
  '941972',
  '943296',
  '943532',
  '944327',
  '944413',
  '945151',
  '945773',
  '946346',
  '946450',
  '948196',
  '950584',
  '950923',
  '951727',
  '952259',
  '952510',
  '1202322',
  '1202813',
  '1204988',
  '1206059',
  '1206980',
  '1207469',
  '1208940',
  '1210957',
  '1211837',
  '1212143',
  '1213114',
  '1215781',
  '1215794',
  '1216049',
  '1219094',
  '1300884',
  '1301483',
  '1301508',
  '1302531',
  '1302592',
  '1302856',
  '1302920',
  '1303390',
  '1304452',
  '1305128',
  '1305168',
  '1309258',
  '1311304',
  '1314062',
  '1315915',
  '1316808',
  '1318349',
  '1319075',
  '1319388',
  '1320027',
  '3000607',
  '3000981',
  '3003168',
  '3005531',
  '3007797',
  '3010883',
])

const NO_ACTIVE_BONUS_EMAILS = new Set([
  'rayan@oasisrescue.co.uk',
  'fabianarmstrong84@gmail.com',
  'pastorian12000@yahoo.com',
  'tahmid.ahmed@raconsultants.co.uk',
  'h4m24h.m.is@hotmail.com',
  'robfackerell@icloud.com',
  'ishytellie@hotmail.co.uk',
  'musad@hotmail.co.uk',
  'luke.uae@icloud.com',
  'rodasurensoy@gmail.com',
  'nevillevoss@icloud.com',
  'h7buffer@gmail.com',
  'freddieharvey29@googlemail.com',
  'nazakat-ali@hotmail.co.uk',
  'sharpercarper_1@btinternet.com',
  'info@ultracontractinggroup.com',
  'pabss31100@gmail.com',
  'davidprenga@icloud.com',
  'taine.omxi@gmail.com',
  'jamescalland@ymail.com',
  'phillhoy@live.co.uk',
  'bryony_2000@hotmail.co.uk',
  'jahanshah2004@gmail.com',
  'blake.vollbrecht@yahoo.com',
  'mohdzaki.hamdan@gmail.com',
  'lsc1481@hotmail.com',
  'alexmccabe96@hotmail.com',
  'jamesneillsteven@gmail.com',
  'sabinonittolo@icloud.com',
  'arukmusic@outlook.com',
  'ishrak.ali@hotmail.com',
  'alextsiamp@icloud.com',
  'steveatha14@gmail.com',
  'binelai361@gmail.com',
  'matthewashurst@icloud.com',
  'levans9@hotmail.co.uk',
  'shahnawaz.bunglawala@gmail.com',
  'asad246@hotmail.co.uk',
  'hassansarwar_1997@outlook.com',
  'matshan199@icloud.com',
  'harries1198@live.co.uk',
  'ryan.senior23@outlook.com',
  'gavrau.boby@gmail.com',
  'damianandrukiewicz@gmail.com',
  'dexternorley@googlemail.com',
  'd.stojanoski98@hotmail.com',
  'gorsiaj@gmail.com',
  'ptsiampartas@gmail.com',
  'tahmidtk1@gmail.com',
  'j_mayer100@hotmail.com',
  'mohammed176@icloud.com',
  'sunnyhundal1@hotmail.com',
  'joravar.bisla@outlook.com',
  'samuelidah28@gmail.com',
  'deninet_13@msn.com',
  'bnawaz1@gmail.com',
  'i.danyal11@hotmail.co.uk',
  'lewis.malcolmpt@gmail.com',
  'oneillj2000@gmail.com',
  'sharp.tilers@gmail.com',
  'hunara543@gmail.com',
  'jaipatel12@hotmail.com',
  'apetku92@gmail.com',
  'sachin.dhingra@hotmail.co.uk',
  'oliveryao53@hotmail.com',
  'mp@mikerm.com',
])

function normalizeMailStatus(value) {
  return (
    String(value || 'pending')
      .trim()
      .toLowerCase() || 'pending'
  )
}

function formatDateTime(value) {
  const parsed = Date.parse(String(value || ''))
  if (!Number.isFinite(parsed)) return '—'
  return new Date(parsed).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toCampaignRowKey(row) {
  return `${String(row?.tradingAccount || '')}:${String(row?.email || '')}`
}

function extractFirstName(fullName) {
  const raw = String(fullName || '').trim()
  if (!raw) return 'Trader'
  return raw.split(/\s+/)[0] || 'Trader'
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

function roundToNearestThousand(value) {
  return Math.round(Number(value || 0) / 1000) * 1000
}

function normalizePersonKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getActivityStatus(row) {
  const login = String(row?.login || row?.tradingAccount || '').trim()
  const email = String(row?.email || '')
    .trim()
    .toLowerCase()
  const isNoActive = NO_ACTIVE_BONUS_LOGIN_IDS.has(login) || NO_ACTIVE_BONUS_EMAILS.has(email)
  return isNoActive ? 'no active' : 'active'
}

function buildAgentDirectory() {
  const byKey = new Map()

  for (const section of Array.isArray(orgChartSections) ? orgChartSections : []) {
    const roles = Array.isArray(section?.roles) ? section.roles : []
    for (const role of roles) {
      const name = String(role?.name || '').trim()
      const email = String(role?.email || '')
        .trim()
        .toLowerCase()
      if (!name || !email || !email.includes('@')) continue

      const key = normalizePersonKey(name)
      if (!key || byKey.has(key)) continue
      byKey.set(key, { name, email })
    }
  }

  return byKey
}

function buildAgentBriefSubject({ campaignName, agentName, totalClients, isAssignment = false }) {
  const _safeCampaign = String(campaignName || 'Marketing Campaign').trim()
  const safeAgent = String(agentName || 'Agent').trim()
  const _clients = Number(totalClients || 0)
  const agentFirstName = extractFirstName(safeAgent)
  if (isAssignment) return `Bullwaves Weekly Mission: Client Assignment Brief - ${agentFirstName}`
  return `Bullwaves Weekly Mission: Bonus Release Outreach - ${agentFirstName}`
}

function buildAgentBriefHtml({
  campaignName,
  agentName,
  clients,
  showSource = false,
  isAssignment = false,
  agentDistribution = [],
}) {
  const safeCampaign = String(campaignName || 'Marketing Campaign').trim()
  const safeAgent = String(agentName || 'Agent').trim()
  const logoUrl = 'https://bullwaves-console.vercel.app/Logo.png'
  const rows = Array.isArray(clients) ? clients : []

  const cumulativeBonusUsd = rows.reduce((sum, client) => {
    const rate = Number(client?.usdToAccountRate || 0)
    const raw =
      Number(client?.officialBonusAccountCurrencyRaw || 0) ||
      Number(client?.bonusAccountCurrencyRaw || 0)
    if (rate > 0) return sum + raw / rate
    return sum
  }, 0)
  const cumulativeBonusText = moneyWithCurrency(cumulativeBonusUsd, 'USD')

  const heroTagline = isAssignment
    ? `${safeAgent}, below is the list of unassigned clients for this week's campaign. Please review and redistribute to the appropriate agents.`
    : `${safeAgent}, the mission for this week is: complete outreach on your assigned client list.`

  const distributionTableHtml =
    isAssignment && agentDistribution.length
      ? `
      <tr>
        <td style="padding:8px 22px 8px;">
          <div style="background:#f0f5ff;border:1px solid #d0dcf5;border-radius:12px;padding:14px 16px;">
            <div style="font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#40608d;font-weight:800;margin-bottom:10px;">&#x1F4CA; Current Agent Distribution — ${safeCampaign}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
              <thead>
                <tr style="background:#0f2a57;">
                  <th style="padding:8px 10px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;border-radius:6px 0 0 0;">Agent</th>
                  <th style="padding:8px 10px;text-align:center;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Clients</th>
                  <th style="padding:8px 10px;text-align:right;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;border-radius:0 6px 0 0;">Bonus (USD)</th>
                </tr>
              </thead>
              <tbody>
                ${agentDistribution
                  .map(
                    (a, i) => `
                  <tr style="background:${i % 2 === 0 ? '#f8fbff' : '#ffffff'};">
                    <td style="padding:8px 10px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${String(a.name || '—')}</td>
                    <td style="padding:8px 10px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;text-align:center;font-weight:800;">${a.clients}</td>
                    <td style="padding:8px 10px;border-top:1px solid #e6ecf5;color:#114b2e;font-size:12px;text-align:right;font-weight:700;">${moneyWithCurrency(roundToNearestThousand(a.bonusUsd), 'USD')}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    `
      : ''

  const rowsHtml = rows
    .map((client, index) => {
      const tradingAccount = String(client?.tradingAccount || '—').trim() || '—'
      const officialBonusRaw =
        Number(client?.officialBonusAccountCurrencyRaw || 0) ||
        Number(client?.bonusAccountCurrencyRaw || 0)
      const bonus = moneyWithCurrency(officialBonusRaw, client?.accountCurrency)
      const contactChannel = String(client?.phone || '').trim()
        ? `WhatsApp / Phone (${String(client.phone).trim()})`
        : 'WhatsApp / Phone'
      const sourceCell = showSource
        ? `<td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#5b6d8b;font-size:11px;white-space:nowrap;">${String(client?._sourceAgent || '—')}</td>`
        : ''

      return `
        <tr>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;">${index + 1}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${String(client?.name || '—')}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#334155;font-size:12px;">${String(client?.email || '—')}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;">${tradingAccount}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#0f172a;font-size:12px;font-weight:700;">${bonus}</td>
          <td style="padding:10px 9px;border-top:1px solid #e6ecf5;color:#334155;font-size:12px;">${contactChannel}</td>
          ${sourceCell}
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
                      <div style="margin-top:18px;color:#ffffff;font-size:28px;line-height:1.2;font-weight:800;">
                        ${isAssignment ? 'Client Assignment Brief' : 'Weekly Mission Assignment'}
                      </div>
                      <div style="margin-top:8px;color:#cfe2ff;font-size:14px;line-height:1.5;max-width:680px;">
                        ${heroTagline}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 22px 8px;">
                      <div style="font-size:16px;font-weight:800;color:#0f172a;">Hi ${safeAgent},</div>
                      <div style="margin-top:8px;font-size:14px;color:#334155;line-height:1.6;">
                        ${
                          isAssignment
                            ? `This is the list of unassigned clients for <strong>${safeCampaign}</strong>. Please assign each client to the most appropriate agent based on current workload.`
                            : `This is your official assignment for ${safeCampaign}. Below is the client list and total bonus coverage.`
                        }
                      </div>
                      <div style="margin-top:8px;font-size:14px;color:#334155;line-height:1.6;">
                        <span style="font-weight:800;color:#0f2a57;">&#x1F3AF; Goal:</span> ${
                          isAssignment
                            ? 'assign each client to an agent and confirm distribution by end of week.'
                            : 'inform each client that we released a bonus to their account.'
                        }
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
                                <div style="font-size:11px;color:#5b6d8b;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">${isAssignment ? 'Clients to Assign' : 'Assigned Clients'}</div>
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

                  ${distributionTableHtml}

                  <tr>
                    <td style="padding:8px 22px 8px;">
                      <div style="background:#f8fbff;border:1px solid #dce8f8;border-radius:12px;padding:14px 16px;">
                        <div style="font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#40608d;font-weight:800;">${isAssignment ? 'Assignment Tasks (Week)' : 'Mission Tasks (Week)'}</div>
                        <ol style="margin:8px 0 0 18px;padding:0;color:#1e293b;font-size:13px;line-height:1.6;">
                          ${
                            isAssignment
                              ? '<li>Review current agent workload in the distribution table above.</li><li>Assign each client to the most suitable agent.</li><li>Confirm completed assignments by end of week.</li>'
                              : '<li>Contact 100% of assigned clients.</li><li>Use WhatsApp and phone for direct contact.</li><li>Complete mission by end of week and report blockers.</li>'
                          }
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
                              ${showSource ? '<th style="padding:11px 9px;text-align:left;font-size:11px;color:#dbe8ff;letter-spacing:0.05em;text-transform:uppercase;">Provenienza</th>' : ''}
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
                    <td style="padding:0 22px 24px;">
                      <div style="background:linear-gradient(135deg,#0a1d3f 0%,#123674 50%,#1d4f9e 100%);border:1px solid #2758a5;border-radius:14px;padding:16px 18px;font-size:12px;color:#f5f9ff;line-height:1.7;box-shadow:0 8px 22px rgba(10,29,63,0.28);">
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
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
}

function getAgentColor(agentName) {
  const colorPalette = [
    { bg: 'rgba(20,184,166,0.08)', accent: 'rgba(107,186,171,0.6)' }, // teal
    { bg: 'rgba(34,211,238,0.07)', accent: 'rgba(100,170,200,0.6)' }, // cyan
    { bg: 'rgba(59,130,246,0.07)', accent: 'rgba(100,140,200,0.6)' }, // blue
    { bg: 'rgba(168,85,247,0.07)', accent: 'rgba(150,110,180,0.6)' }, // purple
    { bg: 'rgba(251,146,60,0.08)', accent: 'rgba(170,130,80,0.6)' }, // warm
    { bg: 'rgba(244,63,94,0.07)', accent: 'rgba(160,110,130,0.6)' }, // mauve
  ]

  let hash = 0
  for (let i = 0; i < String(agentName).length; i++) {
    const char = String(agentName).charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return colorPalette[Math.abs(hash) % colorPalette.length]
}

function buildCampaignTemplateHtml(html, campaignRow) {
  const source = String(html || '')
  if (!source || !campaignRow) return source

  const firstName = extractFirstName(campaignRow.name)
  const officialBonusRaw =
    Number(campaignRow?.officialBonusAccountCurrencyRaw || 0) ||
    Number(campaignRow?.bonusAccountCurrencyRaw || 0)
  const bonusAmount = moneyWithCurrency(officialBonusRaw, campaignRow.accountCurrency)
  const tradingAccount = String(campaignRow.tradingAccount || '').trim() || '—'

  return source
    .replaceAll('[First Name]', firstName)
    .replaceAll('[Bonus Amount]', bonusAmount)
    .replaceAll('[Trading Account ID]', tradingAccount)
}

function buildCampaignSubject(campaignRow) {
  return 'A June exclusive, 20% of your losses credited back.'
}

function buildFollowUpSubject(campaignRow) {
  const firstName = extractFirstName(campaignRow?.name)
  return `${firstName}, quick follow-up on your exclusive credit bonus`
}

function buildFollowUpTemplateHtml(campaignRow) {
  if (!campaignRow) return ''

  const firstName = extractFirstName(campaignRow?.name)
  const officialBonusRaw =
    Number(campaignRow?.officialBonusAccountCurrencyRaw || 0) ||
    Number(campaignRow?.bonusAccountCurrencyRaw || 0)
  const bonusAmount = moneyWithCurrency(officialBonusRaw, campaignRow?.accountCurrency)
  const tradingAccount = String(campaignRow?.tradingAccount || '').trim() || '—'
  const accountCurrency = String(campaignRow?.accountCurrency || 'USD').trim() || 'USD'
  const expiryNote = 'Your credit bonus expires if not claimed and used within 90 days.'
  const logoUrl = 'https://bullwaves-console.vercel.app/Logo.png'

  return `
    <div style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef3fb;padding:24px 12px;">
        <tbody>
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:720px;background:#ffffff;border:1px solid #dbe6f6;border-radius:20px;overflow:hidden;box-shadow:0 12px 34px rgba(16,36,74,0.12);">
                <tbody>
                  <tr>
                    <td style="background:linear-gradient(135deg,#0b1b3a 0%,#15408a 100%);padding:20px 22px;">
                      <img src="${logoUrl}" alt="Bullwaves" width="150" style="display:block;width:150px;max-width:150px;height:auto;border:0;" />
                      <div style="margin-top:16px;color:#ffffff;font-size:24px;line-height:1.25;font-weight:800;">Follow-up: Your Credit Bonus Is Still Available</div>
                      <div style="margin-top:8px;color:#dbe8ff;font-size:13px;line-height:1.6;max-width:520px;">This is a reminder regarding your exclusive Bullwaves credit bonus and account details.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px;color:#1e293b;font-size:14px;line-height:1.7;">
                      <p style="margin:0 0 12px;">Hi ${firstName},</p>
                      <p style="margin:0 0 14px;">we are following up to remind you that your exclusive credit bonus is still available on your Bullwaves account.</p>

                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 14px;border:1px solid #dce6f5;border-radius:12px;overflow:hidden;background:#f8fbff;">
                        <tbody>
                          <tr>
                            <td style="padding:12px 14px;border-bottom:1px solid #dce6f5;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;color:#5a6f8f;font-weight:800;">Account Summary</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 14px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                                <tbody>
                                  <tr>
                                    <td style="padding:6px 0;color:#516684;font-size:12px;">Account ID</td>
                                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:800;text-align:right;">${tradingAccount}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:6px 0;color:#516684;font-size:12px;">Bonus Amount</td>
                                    <td style="padding:6px 0;color:#114b2e;font-size:13px;font-weight:900;text-align:right;">${bonusAmount}</td>
                                  </tr>
                                  <tr>
                                    <td style="padding:6px 0;color:#516684;font-size:12px;">Account Currency</td>
                                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:800;text-align:right;">${accountCurrency}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="margin:0 0 14px;">${expiryNote}</p>

                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 0;">
                        <tbody>
                          <tr>
                            <td>
                              <a href="https://my.bullwaves.com" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#0f2a57;color:#ffffff;text-decoration:none;font-weight:800;font-size:13px;line-height:1;padding:12px 18px;border-radius:999px;">Review Bonus In Account</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p style="margin:16px 0 0;color:#4b607d;font-size:12px;line-height:1.7;">If you need support, simply reply to this email and our team will assist you.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 22px 22px;">
                      <div style="background:linear-gradient(135deg,#0a1d3f 0%,#123674 50%,#1d4f9e 100%);border:1px solid #2758a5;border-radius:14px;padding:14px 16px;font-size:12px;color:#f5f9ff;line-height:1.7;">
                        <strong>Bullwaves LTD</strong><br/>
                        Internal Campaign Follow-up Communication<br/>
                        Support: support@bullwaves.com
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

function getMailStatusStyle(status) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'delivered' || normalized === 'open' || normalized === 'click') {
    return {
      background: 'rgba(22,163,74,0.18)',
      color: '#86efac',
      border: '1px solid rgba(22,163,74,0.4)',
    }
  }

  if (normalized === 'accepted' || normalized === 'processed') {
    return {
      background: 'rgba(56,189,248,0.16)',
      color: '#7dd3fc',
      border: '1px solid rgba(56,189,248,0.42)',
    }
  }

  if (normalized === 'failed' || normalized === 'bounce' || normalized === 'dropped') {
    return {
      background: 'rgba(220,38,38,0.18)',
      color: '#fca5a5',
      border: '1px solid rgba(220,38,38,0.4)',
    }
  }

  return {
    background: 'rgba(251,191,36,0.16)',
    color: '#fde68a',
    border: '1px solid rgba(251,191,36,0.38)',
  }
}

function normalizePhoneForWhatsApp(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const hasPlus = raw.startsWith('+')
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  return hasPlus ? `+${digits}` : digits
}

function parseDbNativeLogins(value) {
  return String(value || '')
    .split(/[|,]/)
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

const CONTACT_ENRICHMENT_CACHE_KEY = 'bw:marketing-campaign:contact-enrichment:v1'
const CONTACT_ENRICHMENT_CACHE_TTL_MS = 15 * 60 * 1000

function hasFreshContactEnrichmentCache(lastSyncAt, ttlMs = CONTACT_ENRICHMENT_CACHE_TTL_MS) {
  const parsed = Date.parse(String(lastSyncAt || ''))
  if (!Number.isFinite(parsed)) return false
  return Date.now() - parsed <= Number(ttlMs || 0)
}

function loadContactEnrichmentCache() {
  try {
    const raw = window.localStorage.getItem(CONTACT_ENRICHMENT_CACHE_KEY)
    if (!raw) return { phones: {}, countries: {}, metrics: {}, lastSyncAt: '' }
    const parsed = JSON.parse(raw)
    return {
      phones: typeof parsed?.phones === 'object' && parsed.phones ? parsed.phones : {},
      countries: typeof parsed?.countries === 'object' && parsed.countries ? parsed.countries : {},
      metrics: typeof parsed?.metrics === 'object' && parsed.metrics ? parsed.metrics : {},
      lastSyncAt: String(parsed?.lastSyncAt || '').trim(),
    }
  } catch {
    return { phones: {}, countries: {}, metrics: {}, lastSyncAt: '' }
  }
}

function saveContactEnrichmentCache({
  phones = {},
  countries = {},
  metrics = {},
  lastSyncAt = '',
}) {
  try {
    const payload = {
      phones,
      countries,
      metrics,
      lastSyncAt: String(lastSyncAt || '').trim(),
    }
    window.localStorage.setItem(CONTACT_ENRICHMENT_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures (private mode/quota)
  }
}

function inferLanguageFromCountry(value) {
  const country = String(value || '')
    .trim()
    .toLowerCase()
  if (!country) return ''

  if (
    /united kingdom|uk|england|scotland|wales|ireland|united states|usa|canada|australia|new zealand/.test(
      country
    )
  )
    return 'EN'
  if (/italy|italia/.test(country)) return 'IT'
  if (/spain|españa|espana|mexico|argentina|colombia|peru|chile|uruguay|venezuela/.test(country))
    return 'ES'
  if (/france|belgium|switzerland/.test(country)) return 'FR'
  if (/germany|austria/.test(country)) return 'DE'
  if (/portugal|brazil/.test(country)) return 'PT'
  if (/greece/.test(country)) return 'EL'
  if (/romania/.test(country)) return 'RO'
  if (/turkey/.test(country)) return 'TR'
  if (/poland/.test(country)) return 'PL'
  if (/czech/.test(country)) return 'CS'
  if (/hungary/.test(country)) return 'HU'
  if (/netherlands/.test(country)) return 'NL'
  if (/sweden/.test(country)) return 'SV'
  if (/norway/.test(country)) return 'NO'
  if (/denmark/.test(country)) return 'DA'
  if (/finland/.test(country)) return 'FI'
  if (/russia/.test(country)) return 'RU'
  if (/ukraine/.test(country)) return 'UK'
  if (/saudi|uae|emirates|qatar|kuwait|oman|bahrain|egypt|morocco|algeria|tunisia/.test(country))
    return 'AR'
  return ''
}

function parseSkaleMetricValue(value) {
  if (value == null || value === '') return null
  const n = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function toCountryInitials(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'
  const words = raw
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

function ContactPresenceIcon({ type = 'mail', active = false, title = '' }) {
  const stroke = active ? '#22c55e' : '#64748b'
  const glow = active ? 'rgba(34,197,94,0.18)' : 'rgba(100,116,139,0.18)'

  return (
    <span
      title={title}
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        border: `1px solid ${active ? 'rgba(34,197,94,0.45)' : 'rgba(100,116,139,0.45)'}`,
        background: glow,
        display: 'inline-grid',
        placeItems: 'center',
      }}
    >
      {type === 'phone' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5.2 3.8c.8-.8 2-.8 2.8 0l1.8 1.8c.7.7.8 1.8.2 2.6l-1.2 1.7c-.2.3-.2.7 0 1 .8 1.5 2 2.9 3.5 4 .3.2.8.2 1 0l1.8-1.2c.8-.6 1.9-.5 2.6.2l1.8 1.8c.8.8.8 2 0 2.8l-1 1c-1.1 1.1-2.9 1.5-4.4.9-2.8-1.1-5.3-3.1-7.3-5.9-1.8-2.4-2.9-4.8-3.2-7.2-.2-1.2.2-2.4 1.1-3.3l1.3-1.2Z"
            stroke={stroke}
            strokeWidth="1.6"
          />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16v12H4V6Z" stroke={stroke} strokeWidth="1.6" />
          <path d="m4 7 8 6 8-6" stroke={stroke} strokeWidth="1.6" />
        </svg>
      )}
    </span>
  )
}

function TemplatePreviewFrame({ html, title }) {
  return (
    <iframe
      title={title}
      srcDoc={html || ''}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        border: 0,
        background: '#f5f7fa',
        display: 'block',
      }}
      scrolling="yes"
      sandbox="allow-same-origin"
    />
  )
}

export default function MarketingCampaignPage() {
  const campaignSourceRows = useMemo(
    () => (Array.isArray(marketingCampaignPreview?.rows) ? marketingCampaignPreview.rows : []),
    []
  )
  const bonusTemplate = useMemo(
    () =>
      ALL_TEMPLATES_CATALOG.find(
        (item) => item.id === 'bullwaves-global-exclusive-tradable-bonus-en'
      ) || null,
    []
  )

  const [trackingByRowKey, setTrackingByRowKey] = useState({})
  const [trackingMeta, setTrackingMeta] = useState({ lastSyncAt: '', error: '' })
  const [phoneByRowKey, setPhoneByRowKey] = useState({})
  const [phoneByAccountId, setPhoneByAccountId] = useState({})
  const [countryByRowKey, setCountryByRowKey] = useState({})
  const [countryByAccountId, setCountryByAccountId] = useState({})
  const [skaleMetricsByRowKey, setSkaleMetricsByRowKey] = useState({})
  const [skaleMetricsByAccountId, setSkaleMetricsByAccountId] = useState({})
  const [skaleMetricsMeta, setSkaleMetricsMeta] = useState({
    lastSyncAt: '',
    error: '',
    source: '',
  })
  const [phoneMeta, setPhoneMeta] = useState({ lastSyncAt: '', error: '', source: '' })
  const [isSkaleRefreshRunning, setIsSkaleRefreshRunning] = useState(false)
  const [skaleRefreshRequest, setSkaleRefreshRequest] = useState({ nonce: 0, force: false })
  const [selectedRowKey, setSelectedRowKey] = useState(() =>
    campaignSourceRows.length ? toCampaignRowKey(campaignSourceRows[0]) : ''
  )
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState('campaign')
  const [activeAgentFilter, setActiveAgentFilter] = useState('')
  const [mailState, setMailState] = useState({
    phase: 'idle',
    message: '',
    messageId: '',
    error: '',
  })
  const [agentMailByName, setAgentMailByName] = useState({})
  const [agentMailModal, setAgentMailModal] = useState({ open: false, agentName: '' })

  const agentDirectoryByKey = useMemo(() => buildAgentDirectory(), [])

  const rows = useMemo(() => {
    return campaignSourceRows.map((row, index) => {
      const rowKey = toCampaignRowKey(row)
      const tradingAccountId = String(row?.tradingAccount || '').trim()
      const tracking = trackingByRowKey[rowKey] || null
      const skaleMetrics =
        skaleMetricsByRowKey[rowKey] || skaleMetricsByAccountId[tradingAccountId] || null
      return {
        ...row,
        rank: index + 1,
        phone: String(
          phoneByRowKey[rowKey] || phoneByAccountId[tradingAccountId] || row.phone || ''
        ).trim(),
        country: String(
          countryByRowKey[rowKey] || countryByAccountId[tradingAccountId] || row.country || ''
        ).trim(),
        activityStatus: getActivityStatus(row),
        mailStatus: normalizeMailStatus(tracking?.status || row.mailStatus || 'pending'),
        mailMessageId: tracking?.messageId || null,
        mailUpdatedAt: tracking?.updatedAt || null,
        mailLastEvent: tracking?.lastEvent || null,
        mailOpenCount: Number(tracking?.openCount || 0),
        mailClickCount: Number(tracking?.clickCount || 0),
        skaleClosedPl: parseSkaleMetricValue(skaleMetrics?.closedPl),
        skaleOpenPl: parseSkaleMetricValue(skaleMetrics?.openPl),
        skaleWd: parseSkaleMetricValue(skaleMetrics?.wd),
      }
    })
  }, [
    campaignSourceRows,
    trackingByRowKey,
    phoneByRowKey,
    phoneByAccountId,
    countryByRowKey,
    countryByAccountId,
    skaleMetricsByRowKey,
    skaleMetricsByAccountId,
  ])

  const visibleRows = useMemo(() => {
    if (!activeAgentFilter) return rows
    return rows.filter((row) => {
      const agentName = String(row.user || 'Unassigned').trim() || 'Unassigned'
      return agentName === activeAgentFilter
    })
  }, [rows, activeAgentFilter])

  const selectedRow = useMemo(
    () =>
      visibleRows.find((row) => toCampaignRowKey(row) === selectedRowKey) || visibleRows[0] || null,
    [visibleRows, selectedRowKey]
  )
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (!visibleRows.length) {
      if (previewOpen) setPreviewOpen(false)
      if (selectedRowKey) setSelectedRowKey('')
      return
    }

    const hasSelected = visibleRows.some((row) => toCampaignRowKey(row) === selectedRowKey)
    if (!hasSelected) setSelectedRowKey(toCampaignRowKey(visibleRows[0]))
  }, [visibleRows, selectedRowKey, previewOpen])

  const previewHtml = useMemo(() => {
    if (!selectedRow) return ''
    const base = String(bonusTemplate?.html || '')
    return buildCampaignTemplateHtml(base, selectedRow)
  }, [bonusTemplate, selectedRow])

  const previewSubject = useMemo(() => {
    if (!selectedRow) return ''
    return buildCampaignSubject(selectedRow)
  }, [selectedRow])

  const followUpSubject = useMemo(() => {
    if (!selectedRow) return ''
    return buildFollowUpSubject(selectedRow)
  }, [selectedRow])

  const followUpHtml = useMemo(() => {
    if (!selectedRow) return ''
    return buildFollowUpTemplateHtml(selectedRow)
  }, [selectedRow])

  const activePreviewSubject =
    selectedPreviewTemplate === 'followup' ? followUpSubject : previewSubject
  const activePreviewHtml = selectedPreviewTemplate === 'followup' ? followUpHtml : previewHtml
  const selectedPhone = normalizePhoneForWhatsApp(selectedRow?.phone)
  const selectedFirstName = extractFirstName(selectedRow?.name)
  const selectedBonusAmount = moneyWithCurrency(
    Number(selectedRow?.officialBonusAccountCurrencyRaw || 0) ||
      Number(selectedRow?.bonusAccountCurrencyRaw || 0),
    selectedRow?.accountCurrency
  )
  const whatsappMessage =
    selectedPreviewTemplate === 'followup'
      ? `Hi ${selectedFirstName}, quick follow-up on your exclusive credit bonus (${selectedBonusAmount}). If you need support, we can assist you now.`
      : `Hi ${selectedFirstName}, your exclusive credit bonus of ${selectedBonusAmount} is now available on your account. If you need assistance, we are here to help.`
  const whatsappLink = selectedPhone
    ? `https://wa.me/${selectedPhone.replace(/^\+/, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : ''

  useEffect(() => {
    if (!previewOpen) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') setPreviewOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previewOpen])

  useEffect(() => {
    if (!previewOpen) return
    setSelectedPreviewTemplate('campaign')
  }, [selectedRowKey, previewOpen])

  useEffect(() => {
    let cancelled = false

    async function loadPhonesFromSkale() {
      setIsSkaleRefreshRunning(true)
      try {
        const forceRefresh = Boolean(skaleRefreshRequest?.force)
        const cache = loadContactEnrichmentCache()
        const cachedPhones = typeof cache?.phones === 'object' && cache.phones ? cache.phones : {}
        const cachedCountries =
          typeof cache?.countries === 'object' && cache.countries ? cache.countries : {}
        const cachedMetrics =
          typeof cache?.metrics === 'object' && cache.metrics ? cache.metrics : {}

        const cachedPhonesByAccount = {}
        for (const [rowKey, value] of Object.entries(cachedPhones)) {
          const phone = String(value || '').trim()
          const accountId = String(rowKey || '').split(':')[0] || ''
          if (accountId && phone && !cachedPhonesByAccount[accountId])
            cachedPhonesByAccount[accountId] = phone
        }
        const cachedCountriesByAccount = {}
        for (const [rowKey, value] of Object.entries(cachedCountries)) {
          const country = String(value || '').trim()
          const accountId = String(rowKey || '').split(':')[0] || ''
          if (accountId && country && !cachedCountriesByAccount[accountId])
            cachedCountriesByAccount[accountId] = country
        }
        const cachedMetricsByAccount = {}
        for (const [rowKey, value] of Object.entries(cachedMetrics)) {
          const accountId = String(rowKey || '').split(':')[0] || ''
          if (accountId && !cachedMetricsByAccount[accountId]) {
            cachedMetricsByAccount[accountId] = {
              closedPl: parseSkaleMetricValue(value?.closedPl),
              openPl: parseSkaleMetricValue(value?.openPl),
              wd: parseSkaleMetricValue(value?.wd),
            }
          }
        }

        setPhoneByRowKey(cachedPhones)
        setPhoneByAccountId(cachedPhonesByAccount)
        setCountryByRowKey(cachedCountries)
        setCountryByAccountId(cachedCountriesByAccount)
        setSkaleMetricsByRowKey(cachedMetrics)
        setSkaleMetricsByAccountId(cachedMetricsByAccount)

        const payloadRows = campaignSourceRows
          .map((row) => ({
            rowKey: toCampaignRowKey(row),
            tradingAccount: String(row?.tradingAccount || '').trim(),
            email: String(row?.email || '')
              .trim()
              .toLowerCase(),
          }))
          .filter((row) => row.rowKey && (row.tradingAccount || row.email))

        if (payloadRows.length) {
          const cacheIsFresh = !forceRefresh && hasFreshContactEnrichmentCache(cache?.lastSyncAt)
          const cacheIsComplete = payloadRows.every((row) => {
            const phone = String(cachedPhones[row.rowKey] || '').trim()
            const country = String(cachedCountries[row.rowKey] || '').trim()
            const metrics = cachedMetrics[row.rowKey] || null
            const hasMetrics = metrics && (metrics.closedPl != null || metrics.openPl != null)
            return phone && country && hasMetrics
          })

          if (cacheIsFresh && cacheIsComplete) {
            const cachedAt = cache?.lastSyncAt || new Date().toISOString()
            setPhoneMeta({ lastSyncAt: cachedAt, error: '', source: 'cache' })
            setSkaleMetricsMeta({
              lastSyncAt: cachedAt,
              error: '',
              source: 'cache',
            })
            setIsSkaleRefreshRunning(false)
            return
          }

          async function fetchContactEnrichment(rowsToFetch, forceLive) {
            if (!rowsToFetch.length) {
              return { phones: {}, countries: {}, metrics: {}, sources: {} }
            }

            const response = await fetch('/api/skale/phones', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                rows: rowsToFetch,
                forceLive,
                includeMetrics: true,
                concurrency: forceLive ? 2 : 4,
              }),
            })
            const data = await response.json().catch(() => null)
            if (!response.ok || !data?.ok || typeof data?.phones !== 'object') {
              throw new Error(data?.message || data?.error || 'Skale phone lookup failed')
            }

            return {
              phones: typeof data?.phones === 'object' && data.phones ? data.phones : {},
              countries:
                typeof data?.countries === 'object' && data.countries ? data.countries : {},
              metrics: typeof data?.metrics === 'object' && data.metrics ? data.metrics : {},
              sources: typeof data?.sources === 'object' && data.sources ? data.sources : {},
            }
          }

          const snapshotPass = await fetchContactEnrichment(payloadRows, false)
          if (cancelled) return

          const missingAfterSnapshot = payloadRows.filter((row) => {
            const phone = String(snapshotPass.phones?.[row.rowKey] || '').trim()
            const country = String(snapshotPass.countries?.[row.rowKey] || '').trim()
            const metrics = snapshotPass.metrics?.[row.rowKey] || null
            const hasMetrics = metrics && (metrics.closedPl != null || metrics.openPl != null)
            return !phone || !country || !hasMetrics
          })

          let livePass = { phones: {}, countries: {}, metrics: {} }
          if (missingAfterSnapshot.length) {
            livePass = await fetchContactEnrichment(missingAfterSnapshot, true)
            if (cancelled) return
          }

          const mergedPhones = { ...cachedPhones }
          const mergedCountries = { ...cachedCountries }
          const normalized = {}
          const normalizedCountries = {}
          const mergedMetrics = { ...snapshotPass.metrics, ...livePass.metrics }
          const metricsByAccount = {}
          const byAccount = {}
          const byAccountCountry = {}
          const mergedFromApiPhones = { ...snapshotPass.phones, ...livePass.phones }
          const mergedFromApiCountries = { ...snapshotPass.countries, ...livePass.countries }

          for (const [rowKey, value] of Object.entries(mergedFromApiPhones || {})) {
            const phone = String(value || '').trim()
            mergedPhones[rowKey] = phone
            normalized[rowKey] = phone
            const accountId = String(rowKey || '').split(':')[0] || ''
            if (accountId && phone && !byAccount[accountId]) {
              byAccount[accountId] = phone
            }
          }
          for (const [rowKey, value] of Object.entries(mergedFromApiCountries || {})) {
            const country = String(value || '').trim()
            mergedCountries[rowKey] = country
            normalizedCountries[rowKey] = country
            const accountId = String(rowKey || '').split(':')[0] || ''
            if (accountId && country && !byAccountCountry[accountId]) {
              byAccountCountry[accountId] = country
            }
          }
          for (const [rowKey, value] of Object.entries(mergedMetrics || {})) {
            const accountId = String(rowKey || '').split(':')[0] || ''
            if (accountId && !metricsByAccount[accountId]) {
              metricsByAccount[accountId] = {
                closedPl: parseSkaleMetricValue(value?.closedPl),
                openPl: parseSkaleMetricValue(value?.openPl),
                wd: parseSkaleMetricValue(value?.wd),
              }
            }
          }

          const mergedPhoneByAccount = { ...cachedPhonesByAccount, ...byAccount }
          const mergedCountryByAccount = { ...cachedCountriesByAccount, ...byAccountCountry }
          const syncAt = new Date().toISOString()

          setPhoneByRowKey({ ...cachedPhones, ...normalized })
          setPhoneByAccountId(mergedPhoneByAccount)
          setCountryByRowKey({ ...cachedCountries, ...normalizedCountries })
          setCountryByAccountId(mergedCountryByAccount)
          setSkaleMetricsByRowKey(mergedMetrics)
          setSkaleMetricsByAccountId(metricsByAccount)
          setSkaleMetricsMeta({
            lastSyncAt: syncAt,
            error: '',
            source: 'live',
          })
          setPhoneMeta({ lastSyncAt: syncAt, error: '', source: 'live' })
          saveContactEnrichmentCache({
            phones: mergedPhones,
            countries: mergedCountries,
            metrics: mergedMetrics,
            lastSyncAt: syncAt,
          })
        }
      } catch (error) {
        if (cancelled) return
        setPhoneMeta({
          lastSyncAt: '',
          error: error?.message || 'Phone sync failed',
          source: '',
        })
        setSkaleMetricsMeta({
          lastSyncAt: '',
          error: error?.message || 'Skale metrics sync failed',
          source: '',
        })
      } finally {
        if (!cancelled) setIsSkaleRefreshRunning(false)
      }
    }

    loadPhonesFromSkale()
    return () => {
      cancelled = true
    }
  }, [campaignSourceRows, skaleRefreshRequest])

  function refreshSkaleData() {
    setSkaleRefreshRequest({ nonce: Date.now(), force: true })
  }

  useEffect(() => {
    let cancelled = false

    async function loadTracking() {
      try {
        const response = await fetch('/api/email/status', {
          cache: 'no-store',
          headers: {
            'x-bullwaves-user-email': PRIVATE_EMAIL,
          },
        })
        const data = await response.json().catch(() => null)
        if (cancelled || !response.ok || !data?.ok || !Array.isArray(data.items)) {
          throw new Error(data?.error || 'Tracker refresh failed')
        }

        const items = data.items

        const byMessageId = new Map(
          items
            .filter((item) => item?.messageId)
            .map((item) => [String(item.messageId).trim(), item])
        )
        const byRecipient = new Map()
        for (const item of items) {
          const recipient = String(item?.to || '')
            .trim()
            .toLowerCase()
          if (!recipient) continue
          const current = byRecipient.get(recipient)
          const currentTs = Date.parse(String(current?.updatedAt || '')) || 0
          const itemTs = Date.parse(String(item?.updatedAt || '')) || 0
          if (!current || itemTs >= currentTs) byRecipient.set(recipient, item)
        }

        setTrackingByRowKey((prev) => {
          const next = { ...prev }
          let changed = false

          for (const sourceRow of campaignSourceRows) {
            const rowKey = toCampaignRowKey(sourceRow)
            const current = next[rowKey] || {}
            const currentMessageId = String(current?.messageId || '').trim()
            const recipient = String(sourceRow?.email || '')
              .trim()
              .toLowerCase()
            const backendTracking =
              (currentMessageId ? byMessageId.get(currentMessageId) : null) ||
              (recipient ? byRecipient.get(recipient) : null)

            if (!backendTracking) continue

            const normalizedStatus = normalizeMailStatus(backendTracking.status || current.status)
            const messageId = String(backendTracking.messageId || currentMessageId || '').trim()
            const updatedAt = String(backendTracking.updatedAt || current.updatedAt || '')
            const lastEvent = backendTracking.lastEvent || current.lastEvent || null
            const openCount = Number(backendTracking.openCount || current.openCount || 0)
            const clickCount = Number(backendTracking.clickCount || current.clickCount || 0)

            if (
              normalizedStatus !== normalizeMailStatus(current.status) ||
              messageId !== currentMessageId ||
              updatedAt !== String(current.updatedAt || '') ||
              String(lastEvent || '') !== String(current.lastEvent || '') ||
              openCount !== Number(current.openCount || 0) ||
              clickCount !== Number(current.clickCount || 0)
            ) {
              next[rowKey] = {
                ...current,
                status: normalizedStatus,
                messageId,
                updatedAt,
                lastEvent,
                openCount,
                clickCount,
              }
              changed = true
            }
          }

          return changed ? next : prev
        })

        setTrackingMeta({ lastSyncAt: new Date().toISOString(), error: '' })
      } catch (error) {
        if (cancelled) return
        setTrackingMeta((prev) => ({
          ...prev,
          error: error?.message || 'Tracker refresh failed',
        }))
      }
    }

    loadTracking()
    const intervalId = window.setInterval(loadTracking, TRACKING_REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [campaignSourceRows])

  useEffect(() => {
    const rowTracking = trackingByRowKey[selectedRowKey]
    if (!rowTracking) return
    setMailState((prev) => ({
      ...prev,
      phase: normalizeMailStatus(rowTracking.status || prev.phase),
      messageId: String(rowTracking.messageId || prev.messageId || '').trim(),
      message: rowTracking.status
        ? `Stato attuale: ${normalizeMailStatus(rowTracking.status)}`
        : prev.message,
      error: prev.phase === 'failed' ? prev.error : '',
    }))
  }, [trackingByRowKey, selectedRowKey])

  async function sendTest() {
    if (!selectedRow || !activePreviewHtml) return

    setMailState({ phase: 'sending', message: 'Invio in corso...', messageId: '', error: '' })

    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-bullwaves-user-email': PRIVATE_EMAIL,
        },
        body: JSON.stringify({
          viewerEmail: PRIVATE_EMAIL,
          to: PRIVATE_EMAIL,
          subject: activePreviewSubject,
          html: activePreviewHtml,
          text:
            selectedPreviewTemplate === 'followup'
              ? `Hi ${extractFirstName(selectedRow.name)}, this is a follow-up regarding your exclusive credit bonus.`
              : `Hi ${extractFirstName(selectedRow.name)}, your exclusive tradable bonus is ready.`,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Invio test non riuscito')

      const messageId = String(data?.messageId || '').trim()
      const next = {
        status: 'accepted',
        messageId,
        updatedAt: new Date().toISOString(),
        lastEvent: 'accepted',
        openCount: 0,
        clickCount: 0,
      }
      setTrackingByRowKey((prev) => ({
        ...prev,
        [selectedRowKey]: { ...(prev[selectedRowKey] || {}), ...next },
      }))
      setMailState({
        phase: 'accepted',
        message: 'Mail accettata da SendGrid.',
        messageId,
        error: '',
      })
    } catch (error) {
      setMailState({
        phase: 'failed',
        message: '',
        messageId: '',
        error: error?.message || 'Errore invio test',
      })
    }
  }

  function openWhatsAppPreview() {
    if (!whatsappLink) return
    window.open(whatsappLink, '_blank', 'noopener,noreferrer')
  }

  async function refreshSelectedStatus() {
    const activeMessageId = String(mailState.messageId || selectedRow?.mailMessageId || '').trim()
    if (!activeMessageId) return

    setMailState((prev) => ({
      ...prev,
      phase: 'checking',
      message: 'Controllo stato dal tracker...',
      error: '',
    }))

    try {
      const response = await fetch(`/api/email/status/${encodeURIComponent(activeMessageId)}`, {
        headers: { 'x-bullwaves-user-email': PRIVATE_EMAIL },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok || !data?.tracking)
        throw new Error(data?.error || 'Stato non disponibile')

      const tracking = data.tracking
      const next = {
        status: String(tracking.status || 'pending').toLowerCase(),
        messageId: tracking.messageId || activeMessageId,
        updatedAt: tracking.updatedAt || new Date().toISOString(),
        lastEvent: tracking.lastEvent || null,
        openCount: Number(tracking.openCount || 0),
        clickCount: Number(tracking.clickCount || 0),
      }

      setTrackingByRowKey((prev) => ({
        ...prev,
        [selectedRowKey]: { ...(prev[selectedRowKey] || {}), ...next },
      }))
      setMailState({
        phase: next.status,
        message: `Stato aggiornato: ${next.status}`,
        messageId: next.messageId,
        error: '',
      })
    } catch (error) {
      setMailState((prev) => ({
        ...prev,
        phase: 'failed',
        error: error?.message || 'Errore controllo stato',
      }))
    }
  }

  const totals = useMemo(() => {
    return {
      totalRows: visibleRows.length,
      delivered: visibleRows.filter((row) => normalizeMailStatus(row.mailStatus) === 'delivered')
        .length,
      failed: visibleRows.filter((row) => normalizeMailStatus(row.mailStatus) === 'failed').length,
      pending: visibleRows.filter((row) => {
        const status = normalizeMailStatus(row.mailStatus)
        return status !== 'delivered' && status !== 'failed'
      }).length,
      active: visibleRows.filter((row) => String(row.activityStatus || '') === 'active').length,
      noActive: visibleRows.filter((row) => String(row.activityStatus || '') === 'no active')
        .length,
      engaged: visibleRows.filter(
        (row) => Number(row.mailOpenCount || 0) > 0 || Number(row.mailClickCount || 0) > 0
      ).length,
      closedPl: visibleRows.reduce((sum, row) => sum + Number(row.skaleClosedPl || 0), 0),
      openPl: visibleRows.reduce((sum, row) => sum + Number(row.skaleOpenPl || 0), 0),
      wdKnown: visibleRows.some((row) => row.skaleWd != null),
      wd: visibleRows.reduce((sum, row) => sum + Number(row.skaleWd || 0), 0),
    }
  }, [visibleRows])

  const agentCards = useMemo(() => {
    const byAgent = new Map()

    for (const row of rows) {
      const agentName = String(row.user || 'Unassigned').trim() || 'Unassigned'
      const accountCurrency = String(row.accountCurrency || 'USD').trim() || 'USD'
      const bonusAccount =
        Number(row.officialBonusAccountCurrencyRaw || 0) || Number(row.bonusAccountCurrencyRaw || 0)
      const usdToAccountRate = Number(row.usdToAccountRate || 0)
      const bonusUsd = usdToAccountRate > 0 ? bonusAccount / usdToAccountRate : 0

      const current = byAgent.get(agentName) || {
        name: agentName,
        clients: 0,
        bonusUsd: 0,
        bonusByCurrency: {},
      }

      current.clients += 1
      current.bonusUsd += bonusUsd
      current.bonusByCurrency[accountCurrency] =
        Number(current.bonusByCurrency[accountCurrency] || 0) + bonusAccount
      byAgent.set(agentName, current)
    }

    // Merge virtual agents: fold Filippo's stats into Roberta's card, hide Filippo
    const filippoKey = 'Filippo Derosa'
    const robertaKey = 'Roberta Jovanovic'
    if (byAgent.has(filippoKey) && byAgent.has(robertaKey)) {
      const filippo = byAgent.get(filippoKey)
      const roberta = byAgent.get(robertaKey)
      roberta.clients += filippo.clients
      roberta.bonusUsd += filippo.bonusUsd
      for (const [currency, amount] of Object.entries(filippo.bonusByCurrency)) {
        roberta.bonusByCurrency[currency] = Number(roberta.bonusByCurrency[currency] || 0) + amount
      }
      byAgent.set(robertaKey, roberta)
    }
    if (byAgent.has(filippoKey) && !byAgent.has(robertaKey)) {
      // Edge case: only Filippo exists — rename his card to Roberta for display
      const filippo = byAgent.get(filippoKey)
      byAgent.delete(filippoKey)
      byAgent.set(robertaKey, { ...filippo, name: robertaKey })
    } else {
      byAgent.delete(filippoKey)
    }

    return Array.from(byAgent.values())
      .sort((a, b) => b.clients - a.clients || b.bonusUsd - a.bonusUsd)
      .map((agent) => {
        const directoryMatch = agentDirectoryByKey.get(normalizePersonKey(agent.name)) || null
        const currencyBreakdown = Object.entries(agent.bonusByCurrency)
          .sort((a, b) => b[1] - a[1])
          .map(([currency, amount]) => moneyWithCurrency(amount, currency))
          .join(' · ')

        return {
          ...agent,
          orgName: directoryMatch?.name || '',
          email: directoryMatch?.email || '',
          bonusUsdFormatted: moneyWithCurrency(roundToNearestThousand(agent.bonusUsd), 'USD'),
          currencyBreakdown,
        }
      })
  }, [rows, agentDirectoryByKey])

  const activeAgentCard = useMemo(
    () => agentCards.find((agent) => agent.name === agentMailModal.agentName) || null,
    [agentCards, agentMailModal.agentName]
  )

  const isVirtualAgent = useMemo(
    () => VIRTUAL_AGENT_NAMES.has(agentMailModal.agentName),
    [agentMailModal.agentName]
  )

  const mergedVirtualAgentRows = useMemo(
    () =>
      rows
        .filter((row) => VIRTUAL_AGENT_NAMES.has(String(row.user || '').trim()))
        .map((row) => ({ ...row, _sourceAgent: String(row.user || '').trim() })),
    [rows]
  )

  const activeAgentRows = useMemo(() => {
    if (!activeAgentCard) return []
    if (isVirtualAgent) return mergedVirtualAgentRows
    return rows.filter(
      (row) => (String(row.user || 'Unassigned').trim() || 'Unassigned') === activeAgentCard.name
    )
  }, [rows, activeAgentCard, isVirtualAgent, mergedVirtualAgentRows])

  const activeAgentMailState = useMemo(
    () =>
      agentMailByName[agentMailModal.agentName] || {
        phase: 'idle',
        message: '',
        messageId: '',
        error: '',
      },
    [agentMailByName, agentMailModal.agentName]
  )

  const agentCampaignName = useMemo(() => {
    return String(bonusTemplate?.name || 'Global Exclusive Tradable Bonus').trim()
  }, [bonusTemplate])

  const realAgentDistribution = useMemo(
    () =>
      agentCards.filter((a) => !VIRTUAL_AGENT_NAMES.has(a.name) && a.name !== 'Roberta Jovanovic'),
    [agentCards]
  )

  const activeAgentMailSubject = useMemo(() => {
    if (!activeAgentCard) return ''
    const nameForSubject = isVirtualAgent ? 'Roberta' : activeAgentCard.name
    return buildAgentBriefSubject({
      campaignName: agentCampaignName,
      agentName: nameForSubject,
      totalClients: activeAgentRows.length,
      isAssignment: isVirtualAgent,
    })
  }, [activeAgentCard, activeAgentRows.length, agentCampaignName, isVirtualAgent])

  const activeAgentMailHtml = useMemo(() => {
    if (!activeAgentCard) return ''
    const nameForHtml = isVirtualAgent ? 'Roberta' : activeAgentCard.orgName || activeAgentCard.name
    return buildAgentBriefHtml({
      campaignName: agentCampaignName,
      agentName: nameForHtml,
      clients: activeAgentRows,
      showSource: isVirtualAgent,
      isAssignment: isVirtualAgent,
      agentDistribution: isVirtualAgent ? realAgentDistribution : [],
    })
  }, [activeAgentCard, activeAgentRows, agentCampaignName, isVirtualAgent, realAgentDistribution])

  const activeAgentRecipients = useMemo(() => {
    const toEmail = isVirtualAgent
      ? VIRTUAL_AGENT_RECIPIENT
      : String(activeAgentCard?.email || '')
          .trim()
          .toLowerCase()
    const cc = AGENT_MAIL_CC_VISIBLE.map((email) => String(email).trim().toLowerCase()).filter(
      (email) => email && email !== toEmail
    )
    const bcc = AGENT_MAIL_BCC_HIDDEN.map((email) => String(email).trim().toLowerCase()).filter(
      (email) => {
        return email && email !== toEmail && !cc.includes(email)
      }
    )

    return {
      to: toEmail,
      cc,
      bcc,
    }
  }, [activeAgentCard, isVirtualAgent])

  function openAgentMailModal(agentName) {
    setAgentMailModal({ open: true, agentName: String(agentName || '') })
  }

  function setAgentMailState(agentName, nextState) {
    const key = String(agentName || '')
    if (!key) return
    setAgentMailByName((prev) => ({ ...prev, [key]: nextState }))
  }

  async function sendAgentBrief() {
    if (!activeAgentCard || !activeAgentMailHtml || !activeAgentMailSubject) return
    if (!activeAgentCard.email) {
      setAgentMailState(activeAgentCard.name, {
        phase: 'failed',
        message: '',
        messageId: '',
        error: 'Missing agent email in org chart.',
      })
      return
    }

    setAgentMailState(activeAgentCard.name, {
      phase: 'sending',
      message: 'Invio in corso...',
      messageId: '',
      error: '',
    })

    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-bullwaves-user-email': PRIVATE_EMAIL,
        },
        body: JSON.stringify({
          viewerEmail: PRIVATE_EMAIL,
          to: activeAgentRecipients.to,
          cc: activeAgentRecipients.cc,
          bcc: activeAgentRecipients.bcc,
          subject: activeAgentMailSubject,
          html: activeAgentMailHtml,
          text: `Weekly mission for ${activeAgentCard.name}: ${activeAgentRows.length} assigned clients, cumulative bonus ${moneyWithCurrency(roundToNearestThousand(activeAgentCard.bonusUsd), 'USD')}. Complete outreach and follow-up within the week.`,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok)
        throw new Error(data?.error || 'Invio mail agente non riuscito')

      const messageId = String(data?.messageId || '').trim()
      setAgentMailState(activeAgentCard.name, {
        phase: 'accepted',
        message: 'Mail agente accettata da SendGrid.',
        messageId,
        error: '',
      })
    } catch (error) {
      setAgentMailState(activeAgentCard.name, {
        phase: 'failed',
        message: '',
        messageId: '',
        error: error?.message || 'Errore invio mail agente',
      })
    }
  }

  async function refreshAgentBriefStatus() {
    if (!activeAgentCard) return
    const activeMessageId = String(activeAgentMailState.messageId || '').trim()
    if (!activeMessageId) return

    setAgentMailState(activeAgentCard.name, {
      ...activeAgentMailState,
      phase: 'checking',
      message: 'Controllo stato dal tracker...',
      error: '',
    })

    try {
      const response = await fetch(`/api/email/status/${encodeURIComponent(activeMessageId)}`, {
        headers: { 'x-bullwaves-user-email': PRIVATE_EMAIL },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok || !data?.tracking)
        throw new Error(data?.error || 'Stato non disponibile')

      const tracking = data.tracking
      const nextStatus = String(tracking.status || 'pending').toLowerCase()
      const nextMessageId = String(tracking.messageId || activeMessageId).trim()
      setAgentMailState(activeAgentCard.name, {
        phase: nextStatus,
        message: `Stato aggiornato: ${nextStatus}`,
        messageId: nextMessageId,
        error: '',
      })
    } catch (error) {
      setAgentMailState(activeAgentCard.name, {
        ...activeAgentMailState,
        phase: 'failed',
        error: error?.message || 'Errore controllo stato',
      })
    }
  }

  const summaryCards = [
    { label: 'Total clients', value: totals.totalRows, tone: 'rgba(56,189,248,0.5)' },
    { label: 'Delivered', value: totals.delivered, tone: 'rgba(34,197,94,0.52)' },
    { label: 'Pending', value: totals.pending, tone: 'rgba(250,204,21,0.5)' },
    { label: 'Failed', value: totals.failed, tone: 'rgba(248,113,113,0.5)' },
    { label: 'Active', value: totals.active, tone: 'rgba(74,222,128,0.45)' },
    { label: 'No active', value: totals.noActive, tone: 'rgba(251,191,36,0.55)' },
    {
      label: 'Closed PL',
      value: moneyWithCurrency(totals.closedPl, selectedRow?.accountCurrency || 'USD'),
      tone: 'rgba(45,212,191,0.52)',
    },
    {
      label: 'Open PL',
      value: moneyWithCurrency(totals.openPl, selectedRow?.accountCurrency || 'USD'),
      tone: 'rgba(96,165,250,0.52)',
    },
    {
      label: 'WD',
      value: totals.wdKnown
        ? moneyWithCurrency(totals.wd, selectedRow?.accountCurrency || 'USD')
        : 'n/a',
      tone: 'rgba(251,146,60,0.52)',
    },
    { label: 'Engaged', value: totals.engaged, tone: 'rgba(251,191,36,0.42)' },
  ]

  const cardBaseStyle = {
    borderRadius: 12,
    padding: '9px 11px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'linear-gradient(180deg, rgba(17,31,58,0.94), rgba(10,20,39,0.9))',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  }

  return (
    <section style={{ display: 'grid', gap: 14, minHeight: 'calc(100vh - 120px)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
        }}
      >
        {summaryCards.map((card) => (
          <div key={card.label} style={{ ...cardBaseStyle, minHeight: 74 }}>
            <div
              style={{
                width: 28,
                height: 3,
                borderRadius: 999,
                background: card.tone,
                marginBottom: 6,
              }}
            />
            <div
              style={{ fontSize: 10, color: '#9bb2c9', fontWeight: 800, letterSpacing: '0.08em' }}
            >
              {card.label}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 22,
                lineHeight: 1,
                fontWeight: 900,
                color: '#f8fcff',
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 8,
        }}
      >
        {agentCards.map((agent) => {
          const agentColor = getAgentColor(agent.name)
          const isActive = agent.name === activeAgentFilter

          return (
            <div
              key={agent.name}
              onClick={() =>
                setActiveAgentFilter((prev) => (prev === agent.name ? '' : agent.name))
              }
              style={{
                ...cardBaseStyle,
                minHeight: 88,
                display: 'grid',
                gap: 4,
                background: `linear-gradient(180deg, ${agentColor.bg}, rgba(10,20,39,0.9))`,
                cursor: 'pointer',
                border: isActive ? `1px solid ${agentColor.accent}` : cardBaseStyle.border,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    color: '#f1f6ff',
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {agent.name}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    openAgentMailModal(agent.name)
                  }}
                  title="Apri mail agente"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 6h16v12H4V6Z" stroke="#dff6ff" strokeWidth="1.6" />
                    <path d="m4 7 8 6 8-6" stroke="#dff6ff" strokeWidth="1.6" />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, ${agentColor.accent}, transparent)`,
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  color: '#89a7c3',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {agent.email || 'No agent email in org chart'}
              </div>
              <div
                style={{
                  color: '#9bb2c9',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                Clienti: <span style={{ color: '#dff6ff' }}>{agent.clients}</span>
              </div>
              <div style={{ color: '#f8fcff', fontSize: 16, fontWeight: 900 }}>
                {agent.bonusUsdFormatted}
              </div>
              <div
                style={{
                  color: '#89a7c3',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {agent.currencyBreakdown}
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
      >
        <div style={{ color: '#9db4c9', fontSize: 12 }}>
          {trackingMeta.error ||
            (trackingMeta.lastSyncAt
              ? `Last sync ${formatDateTime(trackingMeta.lastSyncAt)}`
              : 'Refreshing tracking...')}
        </div>
        <div style={{ color: '#9db4c9', fontSize: 12 }}>
          {activeAgentFilter
            ? `Filtro: ${activeAgentFilter} (${visibleRows.length} clienti)`
            : selectedRow
              ? `${selectedRow.name} selected`
              : 'Select a client to open the preview'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={refreshSkaleData}
          disabled={isSkaleRefreshRunning}
          style={{
            border: '1px solid rgba(125,211,252,0.36)',
            color: '#dff6ff',
            background: isSkaleRefreshRunning
              ? 'rgba(30,64,175,0.18)'
              : 'linear-gradient(180deg, rgba(30,64,175,0.44), rgba(30,64,175,0.24))',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: isSkaleRefreshRunning ? 'wait' : 'pointer',
            opacity: isSkaleRefreshRunning ? 0.72 : 1,
          }}
        >
          {isSkaleRefreshRunning ? 'Aggiornamento dati...' : 'Aggiorna dati Skale'}
        </button>
      </div>

      <div style={{ color: phoneMeta.error ? '#fca5a5' : '#9db4c9', fontSize: 12 }}>
        {phoneMeta.error
          ? `Phone sync: ${phoneMeta.error}`
          : phoneMeta.lastSyncAt
            ? phoneMeta.source === 'cache'
              ? `Contact cache sync ${formatDateTime(phoneMeta.lastSyncAt)} (cache)`
              : `Contact cache sync ${formatDateTime(phoneMeta.lastSyncAt)}`
            : 'Contact cache sync in progress...'}
      </div>
      <div style={{ color: skaleMetricsMeta.error ? '#fca5a5' : '#9db4c9', fontSize: 12 }}>
        {skaleMetricsMeta.error
          ? `Skale metrics: ${skaleMetricsMeta.error}`
          : skaleMetricsMeta.lastSyncAt
            ? skaleMetricsMeta.source === 'cache'
              ? `Skale metrics sync ${formatDateTime(skaleMetricsMeta.lastSyncAt)} (cache)`
              : `Skale metrics sync ${formatDateTime(skaleMetricsMeta.lastSyncAt)}`
            : 'Skale metrics sync in progress...'}
      </div>

      <div
        style={{
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.82)',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        }}
      >
        <div style={{ maxHeight: '44vh', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1320 }}>
            <thead>
              <tr style={{ background: 'rgba(8,15,29,0.98)' }}>
                {[
                  '#',
                  'Client',
                  'Mail',
                  'Phone',
                  'Country',
                  'Status',
                  'Activity status',
                  'Tracking',
                  'Trading account',
                  'Closed PL',
                  'Open PL',
                  'WD',
                  'Assigned to',
                  'Currency',
                  'Net USD',
                  'Bonus',
                  'Official Bonus',
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      background: 'rgba(8,15,29,0.98)',
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: 10,
                      color: '#93acc5',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => {
                const rowKey = toCampaignRowKey(row)
                const active = rowKey === selectedRowKey
                return (
                  <tr
                    key={rowKey}
                    onClick={() => {
                      setSelectedRowKey(rowKey)
                      setPreviewOpen(true)
                    }}
                    style={{
                      background: active
                        ? 'rgba(125,211,252,0.08)'
                        : index % 2 === 0
                          ? 'rgba(255,255,255,0.018)'
                          : 'rgba(255,255,255,0.008)',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      borderLeft: active
                        ? `2px solid ${getAgentColor(row.user).accent}`
                        : '2px solid transparent',
                    }}
                  >
                    <td
                      style={{ padding: '7px 10px', color: '#dff6ff', fontWeight: 900, width: 52 }}
                    >
                      {row.rank}
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        color: '#f8fcff',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.name}
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                      <ContactPresenceIcon
                        type="mail"
                        active={Boolean(String(row.email || '').trim())}
                        title={row.email ? 'Email presente' : 'Email assente'}
                      />
                    </td>
                    <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                      <ContactPresenceIcon
                        type="phone"
                        active={Boolean(String(row.phone || '').trim())}
                        title={row.phone ? 'Phone presente' : 'Phone assente'}
                      />
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        color: '#d6e6f7',
                        whiteSpace: 'nowrap',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {toCountryInitials(row.country)}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          ...getMailStatusStyle(row.mailStatus),
                        }}
                      >
                        {row.mailStatus}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          background:
                            row.activityStatus === 'active'
                              ? 'rgba(22,163,74,0.18)'
                              : 'rgba(251,191,36,0.16)',
                          color: row.activityStatus === 'active' ? '#86efac' : '#fde68a',
                          border:
                            row.activityStatus === 'active'
                              ? '1px solid rgba(22,163,74,0.4)'
                              : '1px solid rgba(251,191,36,0.38)',
                        }}
                      >
                        {row.activityStatus}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        color: '#d9ecff',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                      }}
                    >
                      S{row.mailMessageId ? '1' : '0'} · O{Number(row.mailOpenCount || 0)} · C
                      {Number(row.mailClickCount || 0)}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#bdd0e4', whiteSpace: 'nowrap' }}>
                      {row.tradingAccount}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                      {row.skaleClosedPl == null
                        ? 'n/a'
                        : moneyWithCurrency(row.skaleClosedPl, row.accountCurrency)}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                      {row.skaleOpenPl == null
                        ? 'n/a'
                        : moneyWithCurrency(row.skaleOpenPl, row.accountCurrency)}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                      {row.skaleWd == null
                        ? 'n/a'
                        : moneyWithCurrency(row.skaleWd, row.accountCurrency)}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#bdd0e4', whiteSpace: 'nowrap' }}>
                      {row.user || 'Unassigned'}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#bdd0e4', whiteSpace: 'nowrap' }}>
                      {row.accountCurrency}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#bdd0e4', whiteSpace: 'nowrap' }}>
                      {moneyWithCurrency(row.netDepositsUsd, 'USD')}
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        color: '#f8fcff',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {moneyWithCurrency(
                        roundToNearestThousand(row.bonusAccountCurrencyRaw || 0),
                        row.accountCurrency
                      )}
                    </td>
                    <td
                      style={{
                        padding: '7px 10px',
                        color: '#9bf5c8',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {moneyWithCurrency(
                        row.officialBonusAccountCurrencyRaw || row.bonusAccountCurrencyRaw || 0,
                        row.accountCurrency
                      )}
                    </td>
                  </tr>
                )
              })}
              {!visibleRows.length ? (
                <tr>
                  <td
                    colSpan={17}
                    style={{
                      padding: '16px 12px',
                      color: '#9db4c9',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  >
                    Nessun cliente trovato per l'agente selezionato.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {previewOpen && selectedRow ? (
        <div
          role="presentation"
          onClick={() => setPreviewOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(2,6,23,0.72)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: 18,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Email preview"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1260px, 100%)',
              maxHeight: 'min(92vh, 980px)',
              borderRadius: 20,
              overflow: 'hidden',
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
              display: 'grid',
              gridTemplateRows: 'auto auto minmax(0, 1fr)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                padding: '16px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `2px solid ${getAgentColor(selectedRow.user).accent}`,
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ color: '#f8fcff', fontWeight: 900, fontSize: 16 }}>
                  {selectedRow.name}
                </div>
                <div style={{ color: '#9fb3c8', fontSize: 12 }}>
                  {selectedRow.email} · {selectedRow.tradingAccount}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={{
                  borderRadius: 999,
                  padding: '8px 12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2eefb',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Chiudi
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 8,
                padding: 12,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Template
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewTemplate('campaign')}
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      border:
                        selectedPreviewTemplate === 'campaign'
                          ? '1px solid rgba(125,211,252,0.55)'
                          : '1px solid rgba(148,163,184,0.3)',
                      background:
                        selectedPreviewTemplate === 'campaign'
                          ? 'rgba(125,211,252,0.16)'
                          : 'rgba(255,255,255,0.02)',
                      color: '#dff6ff',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Campaign Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewTemplate('followup')}
                    style={{
                      borderRadius: 999,
                      padding: '4px 10px',
                      border:
                        selectedPreviewTemplate === 'followup'
                          ? '1px solid rgba(251,191,36,0.55)'
                          : '1px solid rgba(148,163,184,0.3)',
                      background:
                        selectedPreviewTemplate === 'followup'
                          ? 'rgba(251,191,36,0.16)'
                          : 'rgba(255,255,255,0.02)',
                      color: '#fde68a',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Follow-up
                  </button>
                </div>
                <div style={{ marginTop: 6, color: '#93acc5', fontSize: 10 }}>
                  {selectedPreviewTemplate === 'followup'
                    ? 'Reminder version for second contact.'
                    : 'Main campaign email currently selected.'}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Subject
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {activePreviewSubject || '—'}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Status
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {selectedRow.mailStatus}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Tracking
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {selectedRow.mailOpenCount || 0} open · {selectedRow.mailClickCount || 0} click
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Closed PL
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {selectedRow.skaleClosedPl == null
                    ? 'n/a'
                    : moneyWithCurrency(selectedRow.skaleClosedPl, selectedRow.accountCurrency)}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Open PL
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {selectedRow.skaleOpenPl == null
                    ? 'n/a'
                    : moneyWithCurrency(selectedRow.skaleOpenPl, selectedRow.accountCurrency)}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  WD
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {selectedRow.skaleWd == null
                    ? 'n/a'
                    : moneyWithCurrency(selectedRow.skaleWd, selectedRow.accountCurrency)}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  WhatsApp
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {selectedPhone || 'No phone available'}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={sendTest}
                  style={{
                    borderRadius: 999,
                    padding: '8px 14px',
                    border: '1px solid rgba(74,222,128,0.45)',
                    background: 'rgba(74,222,128,0.16)',
                    color: '#dcfce7',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Invia test
                </button>
                <button
                  type="button"
                  onClick={openWhatsAppPreview}
                  disabled={!whatsappLink}
                  style={{
                    borderRadius: 999,
                    padding: '8px 14px',
                    border: whatsappLink
                      ? '1px solid rgba(34,197,94,0.5)'
                      : '1px solid rgba(148,163,184,0.3)',
                    background: whatsappLink ? 'rgba(34,197,94,0.16)' : 'rgba(148,163,184,0.08)',
                    color: whatsappLink ? '#dcfce7' : '#9fb3c8',
                    fontWeight: 800,
                    cursor: whatsappLink ? 'pointer' : 'not-allowed',
                  }}
                  title={
                    whatsappLink
                      ? 'Open WhatsApp with prefilled message'
                      : 'No phone number available for this client'
                  }
                >
                  Apri WhatsApp
                </button>
                <button
                  type="button"
                  onClick={refreshSelectedStatus}
                  style={{
                    borderRadius: 999,
                    padding: '8px 14px',
                    border: '1px solid rgba(125,211,252,0.45)',
                    background: 'rgba(125,211,252,0.16)',
                    color: '#dff6ff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Aggiorna stato
                </button>
              </div>
            </div>

            <div style={{ minHeight: 0, background: '#0b1222', padding: '14px 16px 18px' }}>
              <div
                style={{
                  margin: '0 auto',
                  width: 'min(720px, 100%)',
                  height: 'min(60vh, 760px)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#f5f7fa',
                }}
              >
                <TemplatePreviewFrame
                  html={activePreviewHtml}
                  title={activePreviewSubject || 'Campaign preview'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {agentMailModal.open && activeAgentCard ? (
        <div
          role="presentation"
          onClick={() => setAgentMailModal({ open: false, agentName: '' })}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(2,6,23,0.72)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: 18,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Agent campaign brief email preview"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1100px, 100%)',
              maxHeight: 'min(92vh, 980px)',
              borderRadius: 20,
              overflow: 'hidden',
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
              display: 'grid',
              gridTemplateRows: 'auto auto minmax(0, 1fr)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                padding: '16px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `2px solid ${getAgentColor(activeAgentCard.name).accent}`,
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ color: '#f8fcff', fontWeight: 900, fontSize: 16 }}>
                  Mail operativa agente: {activeAgentCard.name}
                </div>
                <div style={{ color: '#9fb3c8', fontSize: 12 }}>
                  To: {activeAgentCard.email || 'No email in org chart'} · Clienti:{' '}
                  {activeAgentRows.length}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAgentMailModal({ open: false, agentName: '' })}
                style={{
                  borderRadius: 999,
                  padding: '8px 12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2eefb',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Chiudi
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 8,
                padding: 12,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Subject
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {activeAgentMailSubject || '—'}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Tracking status
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  {activeAgentMailState.phase || 'idle'}
                  {activeAgentMailState.messageId ? ` · ${activeAgentMailState.messageId}` : ''}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Message
                </div>
                <div
                  style={{
                    marginTop: 4,
                    color: activeAgentMailState.error ? '#fca5a5' : '#d9ecff',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {activeAgentMailState.error || activeAgentMailState.message || 'Ready to send'}
                </div>
              </div>
              <div style={{ ...cardBaseStyle, borderRadius: 10, minHeight: 58 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#93acc5',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                  }}
                >
                  Recipients Preview
                </div>
                <div style={{ marginTop: 4, color: '#d9ecff', fontWeight: 700, fontSize: 12 }}>
                  To: {activeAgentRecipients.to || '—'}
                </div>
                <div style={{ marginTop: 2, color: '#9fb3c8', fontSize: 11 }}>
                  CC: {activeAgentRecipients.cc.length} · BCC: {activeAgentRecipients.bcc.length}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={sendAgentBrief}
                  style={{
                    borderRadius: 999,
                    padding: '8px 14px',
                    border: '1px solid rgba(74,222,128,0.45)',
                    background: 'rgba(74,222,128,0.16)',
                    color: '#dcfce7',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Invia mail agente
                </button>
                <button
                  type="button"
                  onClick={refreshAgentBriefStatus}
                  style={{
                    borderRadius: 999,
                    padding: '8px 14px',
                    border: '1px solid rgba(125,211,252,0.45)',
                    background: 'rgba(125,211,252,0.16)',
                    color: '#dff6ff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Aggiorna tracking
                </button>
              </div>
            </div>

            <div style={{ minHeight: 0, background: '#0b1222', padding: '14px 16px 18px' }}>
              <div
                style={{
                  margin: '0 auto',
                  width: 'min(900px, 100%)',
                  height: 'min(62vh, 780px)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#f5f7fa',
                }}
              >
                <TemplatePreviewFrame
                  html={activeAgentMailHtml}
                  title={activeAgentMailSubject || 'Agent campaign brief preview'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
