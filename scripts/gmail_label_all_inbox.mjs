import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { google } from 'googleapis'

dotenv.config({ path: path.join(process.cwd(), '.env.server.local'), override: false })
dotenv.config({ path: path.join(process.cwd(), '.env.server'), override: false })

const TOKEN_STORE_PATH = path.join(process.cwd(), 'uploads', 'gmail_oauth_tokens.json')
const DEFAULT_REDIRECT_URI = 'http://localhost:4000/api/gmail/oauth/callback'

const TRACKED_LABELS = [
  'AI Call System',
  'Finance',
  'Affiliates',
  'Skale',
  'Support',
  'Projects',
  'Marketing',
  'Vendors',
]

const RULES = [
  { id: 'ai', contains: 'ai call system', label: 'AI Call System', star: true, markRead: false },
  { id: 'finance-subj', contains: 'invoice', label: 'Finance', star: false, markRead: false },
  { id: 'finance-from', fromIncludes: 'invoice@', label: 'Finance', star: false, markRead: false },
  { id: 'affiliate', contains: 'affiliate', label: 'Affiliates', star: false, markRead: false },
  { id: 'skale', contains: 'skale', label: 'Skale', star: false, markRead: false },
  { id: 'support', contains: 'support', label: 'Support', star: false, markRead: false },
  { id: 'project', contains: 'project', label: 'Projects', star: false, markRead: false },
  { id: 'marketing', contains: 'marketing', label: 'Marketing', star: false, markRead: false },
  { id: 'vendor', contains: 'activation payment', label: 'Vendors', star: false, markRead: false },
]

function norm(v) {
  return String(v || '').trim().toLowerCase()
}

function extractHeader(headers, name) {
  const key = String(name || '').toLowerCase()
  const h = (headers || []).find((x) => String(x?.name || '').toLowerCase() === key)
  return String(h?.value || '').trim()
}

function matchesRule(message, rule) {
  const subject = norm(extractHeader(message?.payload?.headers, 'Subject'))
  const from = norm(extractHeader(message?.payload?.headers, 'From'))
  const snippet = norm(message?.snippet || '')
  const probe = `${subject} ${snippet}`

  const containsOk = rule.contains ? probe.includes(rule.contains) : true
  const fromOk = rule.fromIncludes ? from.includes(rule.fromIncludes) : true
  return containsOk && fromOk
}

async function listMessageIds(gmail, query) {
  const ids = []
  let pageToken = ''
  let guard = 0
  do {
    const listed = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 500,
      ...(pageToken ? { pageToken } : {}),
    })

    const page = Array.isArray(listed?.data?.messages) ? listed.data.messages : []
    for (const m of page) {
      if (m?.id) ids.push(m.id)
    }
    pageToken = String(listed?.data?.nextPageToken || '').trim()
    guard += 1
  } while (pageToken && guard < 200)

  return ids
}

async function ensureLabelId(gmail, labelName, cache) {
  const normalized = String(labelName || '').trim()
  if (!normalized) return ''
  if (cache.has(normalized)) return cache.get(normalized)

  const listed = await gmail.users.labels.list({ userId: 'me' })
  const labels = Array.isArray(listed?.data?.labels) ? listed.data.labels : []
  const existing = labels.find((label) => String(label?.name || '').trim().toLowerCase() === normalized.toLowerCase())
  if (existing?.id) {
    cache.set(normalized, existing.id)
    return existing.id
  }

  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: normalized,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    },
  })

  const id = created?.data?.id || ''
  if (id) cache.set(normalized, id)
  return id
}

async function main() {
  const clientId = String(process.env.GMAIL_OAUTH_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.GMAIL_OAUTH_CLIENT_SECRET || '').trim()
  const redirectUri = String(process.env.GMAIL_OAUTH_REDIRECT_URI || '').trim() || DEFAULT_REDIRECT_URI

  if (!clientId || !clientSecret) throw new Error('Missing Gmail OAuth env vars')
  if (!fs.existsSync(TOKEN_STORE_PATH)) throw new Error('Missing Gmail token store')

  const store = JSON.parse(fs.readFileSync(TOKEN_STORE_PATH, 'utf8'))
  if (!store?.tokens) throw new Error('Missing Gmail OAuth tokens')

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  auth.setCredentials(store.tokens)
  const gmail = google.gmail({ version: 'v1', auth })

  const inboxIds = await listMessageIds(gmail, 'in:inbox')

  const cache = new Map()
  const opsByMessage = new Map()

  for (const rule of RULES) {
    const queryParts = ['in:inbox']
    if (rule.contains) {
      queryParts.push(`"${rule.contains}"`)
    }
    if (rule.fromIncludes) {
      queryParts.push(`from:${rule.fromIncludes}`)
    }

    const matchedIds = await listMessageIds(gmail, queryParts.join(' '))
    if (!matchedIds.length) continue

    let labelId = ''
    if (rule.label) {
      labelId = await ensureLabelId(gmail, rule.label, cache)
    }

    for (const id of matchedIds) {
      if (!opsByMessage.has(id)) {
        opsByMessage.set(id, { add: new Set(), remove: new Set() })
      }

      const ops = opsByMessage.get(id)
      if (labelId) ops.add.add(labelId)
      if (rule.star) ops.add.add('STARRED')
      if (rule.markRead) ops.remove.add('UNREAD')
    }
  }

  let changedCount = 0
  for (const [id, ops] of opsByMessage.entries()) {
    const addLabelIds = [...ops.add]
    const removeLabelIds = [...ops.remove]
    if (!addLabelIds.length && !removeLabelIds.length) continue

    await gmail.users.messages.modify({
      userId: 'me',
      id,
      requestBody: { addLabelIds, removeLabelIds },
    })
    changedCount += 1
  }

  const labelsResp = await gmail.users.labels.list({ userId: 'me' })
  const labels = Array.isArray(labelsResp?.data?.labels) ? labelsResp.data.labels : []
  const trackedStats = labels
    .filter((l) => TRACKED_LABELS.includes(String(l?.name || '')))
    .map((l) => ({
      name: l.name,
      messagesTotal: l.messagesTotal || 0,
      messagesUnread: l.messagesUnread || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  console.log(
    JSON.stringify(
      {
        ok: true,
        inboxScanned: inboxIds.length,
        changedCount,
        labels: trackedStats,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }, null, 2))
  process.exit(1)
})
