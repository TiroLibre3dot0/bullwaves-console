/*
Generate a read-only Trustpilot guidance dataset.

Goal:
- Start from Trustpilot CSV and compute a simple, intuitive decision guide.
- No DB writes, no state persistence, just deterministic guidance output files.

Input:
- Trustpilot/TrustPilot Review Tracker.csv
- public/support_users_index.json (optional, for identity/trading context)
- public/Registrations Report.csv (optional, used as fallback for identity lookup)

Optional remote source:
- TRUSTPILOT_SOURCE_URL=<Google Sheet URL or direct CSV URL>
- TRUSTPILOT_SOURCE_MODE=remote-first|remote-only|local-only

Output:
- public/trustpilot_guidance.json
- artifacts/raw/trustpilot_guidance_report.json

Usage:
  node scripts/generate_trustpilot_guidance.js
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const ROOT = path.join(__dirname, '..')
const TRUSTPILOT_PATH = path.join(ROOT, 'Trustpilot', 'TrustPilot Review Tracker.csv')
const SUPPORT_INDEX_PATH = path.join(ROOT, 'public', 'support_users_index.json')
const REGISTRATIONS_PATH = path.join(ROOT, 'public', 'Registrations Report.csv')

const OUT_GUIDE_PATH = path.join(ROOT, 'public', 'trustpilot_guidance.json')
const OUT_REPORT_PATH = path.join(ROOT, 'artifacts', 'raw', 'trustpilot_guidance_report.json')

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase()
}

function toNumber(value) {
  const s = String(value || '').replace(/[^0-9.-]+/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function parseCsv(pathname) {
  if (!fs.existsSync(pathname)) return []
  const raw = fs.readFileSync(pathname, 'utf8')
  return parseCsvRaw(raw)
}

function parseCsvRaw(raw) {
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return Array.isArray(parsed.data) ? parsed.data : []
}

function normalizeHttpUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return ''
}

function toGoogleSheetsCsvExportUrl(inputUrl) {
  const source = normalizeHttpUrl(inputUrl)
  if (!source) return ''

  let parsed
  try {
    parsed = new URL(source)
  } catch {
    return source
  }

  const isGoogleHost = /(^|\.)docs\.google\.com$/i.test(parsed.hostname)
  if (!isGoogleHost) return source

  const pathMatch = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/i)
  if (!pathMatch) return source

  const sheetId = pathMatch[1]
  let gid = parsed.searchParams.get('gid') || ''

  if (!gid && parsed.hash) {
    const hm = String(parsed.hash).match(/gid=(\d+)/i)
    if (hm) gid = hm[1]
  }

  const out = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`)
  out.searchParams.set('format', 'csv')
  if (gid) out.searchParams.set('gid', gid)
  return out.toString()
}

async function fetchText(url) {
  const source = normalizeHttpUrl(url)
  if (!source) throw new Error('Invalid remote URL')

  if (typeof fetch === 'function') {
    const res = await fetch(source, {
      method: 'GET',
      headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8' },
    })
    if (!res.ok) throw new Error(`Remote source HTTP ${res.status}`)
    return await res.text()
  }

  throw new Error('Global fetch is not available in this Node runtime')
}

function resolveSourceMode(rawMode, hasRemote) {
  const mode = normalizeKey(rawMode)
  if (mode === 'remote-only') return 'remote-only'
  if (mode === 'local-only') return 'local-only'
  if (mode === 'remote-first') return 'remote-first'
  return hasRemote ? 'remote-first' : 'local-only'
}

async function loadTrustpilotRows() {
  const sourceUrlRaw = normalizeText(process.env.TRUSTPILOT_SOURCE_URL)
  const remoteUrl = toGoogleSheetsCsvExportUrl(sourceUrlRaw)
  const sourceMode = resolveSourceMode(process.env.TRUSTPILOT_SOURCE_MODE, Boolean(remoteUrl))

  let remoteError = ''

  if (remoteUrl && sourceMode !== 'local-only') {
    try {
      const remoteRaw = await fetchText(remoteUrl)
      const remoteRows = parseCsvRaw(remoteRaw)
      if (!remoteRows.length) {
        throw new Error('Remote source returned 0 data rows')
      }

      return {
        rows: remoteRows,
        sourceKind: 'remote',
        sourceRef: remoteUrl,
        sourceOriginalUrl: sourceUrlRaw || remoteUrl,
        remoteError: null,
      }
    } catch (e) {
      remoteError = String(e?.message || e || 'Unknown remote source error')
      if (sourceMode === 'remote-only') {
        throw new Error(`Remote source failed in remote-only mode: ${remoteError}`)
      }
    }
  }

  if (fs.existsSync(TRUSTPILOT_PATH)) {
    return {
      rows: parseCsv(TRUSTPILOT_PATH),
      sourceKind: 'local',
      sourceRef: TRUSTPILOT_PATH,
      sourceOriginalUrl: sourceUrlRaw || null,
      remoteError: remoteError || null,
    }
  }

  if (remoteError) {
    throw new Error(`Local fallback not found and remote source failed: ${remoteError}`)
  }

  throw new Error(`Trustpilot CSV not found: ${TRUSTPILOT_PATH}`)
}

function readJson(pathname, fallback) {
  try {
    if (!fs.existsSync(pathname)) return fallback
    return JSON.parse(fs.readFileSync(pathname, 'utf8'))
  } catch {
    return fallback
  }
}

function pick(row, candidates) {
  if (!row) return ''
  const map = {}
  for (const k of Object.keys(row)) map[normalizeKey(k)] = k
  for (const c of candidates) {
    const mk = map[normalizeKey(c)]
    if (!mk) continue
    const v = normalizeText(row[mk])
    if (v) return v
  }
  return ''
}

function buildSupportNameIndex(rows) {
  const byName = new Map()
  for (const row of rows || []) {
    const name = normalizeKey(row.customername)
    const userId = normalizeText(row.userid)
    if (!name || !userId) continue
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(row)
  }
  return byName
}

function buildRegistrationNameIndex(rows) {
  const byName = new Map()
  for (const row of rows || []) {
    const name = normalizeKey(row.customer_name)
    const userId = normalizeText(row.user_id).replace(/["\\]+$/g, '')
    if (!name || !userId) continue
    if (!byName.has(name)) byName.set(name, new Set())
    byName.get(name).add(userId)
  }
  return byName
}

function classifyPriority(stars, issueType, actionNeeded) {
  const issue = normalizeKey(issueType)
  const action = normalizeKey(actionNeeded)

  if (stars <= 2) return 'high'
  if (stars === 3) return 'medium'

  if (issue === 'withdrawal' || issue === 'trading') return 'medium'
  if (action.includes('urgent') || action.includes('escalat')) return 'high'
  return 'low'
}

function inferMatchStatus(supportCandidates, registrationIds) {
  const supportCount = supportCandidates.length
  const regCount = registrationIds.size

  if (supportCount === 1) return 'exact'
  if (supportCount > 1) return 'candidate'
  if (regCount > 0) return 'candidate'
  return 'unmatched'
}

function classifyAction({
  priority,
  matchStatus,
  stars,
  issueType,
  actionNeeded,
  summary,
  contacted,
  contactOutcome,
  clientSentiment,
  reviewStatus,
  followUpNeeded,
}) {
  const reasons = []
  const issue = normalizeKey(issueType)
  const action = normalizeKey(actionNeeded)
  const text = `${normalizeKey(summary)} ${action} ${issue}`

  const contactedKey = normalizeKey(contacted)
  const contactOutcomeKey = normalizeKey(contactOutcome)
  const clientSentimentKey = normalizeKey(clientSentiment)
  const reviewStatusKey = normalizeKey(reviewStatus)
  const followUpNeededKey = normalizeKey(followUpNeeded)

  const hasDirectTouch =
    contactedKey.includes('yes') ||
    contactedKey.includes('si') ||
    contactedKey.includes('true') ||
    contactOutcomeKey.includes('reached') ||
    contactOutcomeKey.includes('contact') ||
    contactOutcomeKey.includes('resolved') ||
    contactOutcomeKey.includes('done') ||
    contactOutcomeKey.includes('closed')

  const isClosedLike =
    reviewStatusKey.includes('closed') ||
    reviewStatusKey.includes('done') ||
    reviewStatusKey.includes('resolved') ||
    reviewStatusKey.includes('replied') ||
    reviewStatusKey.includes('reviewed')

  const followUpBlocked =
    followUpNeededKey.includes('yes') ||
    followUpNeededKey.includes('si') ||
    followUpNeededKey.includes('urgent') ||
    reviewStatusKey.includes('pending') ||
    reviewStatusKey.includes('escalat')

  if (hasDirectTouch && isClosedLike && !followUpBlocked) {
    reasons.push('already_followed_up')
    reasons.push('status_closed_like')
    return { recommendedAction: 'no_contact', reasons }
  }

  if (followUpBlocked && (priority === 'high' || reviewStatusKey.includes('escalat'))) {
    reasons.push('followup_needed')
    reasons.push('status_requires_review')
    return { recommendedAction: 'manual_review', reasons }
  }

  if (hasDirectTouch && clientSentimentKey.includes('positive') && !followUpBlocked) {
    reasons.push('contact_already_done')
    reasons.push('positive_sentiment')
    return { recommendedAction: 'no_contact', reasons }
  }

  if (
    text.includes('legal') ||
    text.includes('lawyer') ||
    text.includes('threat') ||
    text.includes('abuse')
  ) {
    reasons.push('compliance_sensitivity')
    return { recommendedAction: 'manual_review', reasons }
  }

  if (stars >= 4 && !action && (!issue || issue === 'other')) {
    reasons.push('positive_low_risk_review')
    return { recommendedAction: 'no_contact', reasons }
  }

  if (matchStatus === 'exact' && (priority === 'high' || priority === 'medium')) {
    reasons.push('exact_user_match')
    reasons.push('trading_context_available')
    if (priority === 'high') reasons.push('high_priority_issue')
    return { recommendedAction: 'direct_contact', reasons }
  }

  if (matchStatus === 'candidate') {
    reasons.push('identity_not_confirmed')
    reasons.push('request_secure_verification')
    return { recommendedAction: 'public_reply', reasons }
  }

  reasons.push('trustpilot_only_case')
  return { recommendedAction: 'public_reply', reasons }
}

function buildChecklist(action) {
  if (action === 'direct_contact') {
    return [
      'Respond on Trustpilot with neutral acknowledgment.',
      'Open direct contact channel with verified user identity.',
      'Use internal trading context to tailor the outreach message.',
    ]
  }
  if (action === 'manual_review') {
    return [
      'Do not send a public detailed reply yet.',
      'Escalate to compliance/senior reviewer.',
      'Publish only approved wording after review.',
    ]
  }
  if (action === 'no_contact') {
    return [
      'No direct outreach required.',
      'Optionally post a short gratitude reply on Trustpilot.',
      'Keep for trend monitoring only.',
    ]
  }
  return [
    'Reply publicly on Trustpilot using neutral support wording.',
    'Invite user to secure support channel for identity verification.',
    'Avoid exposing internal account data in public response.',
  ]
}

function buildTemplateKey(action, stars) {
  if (action === 'manual_review') return 'template_manual_review_hold'
  if (action === 'direct_contact') return stars <= 2 ? 'template_direct_recovery' : 'template_direct_followup'
  if (action === 'no_contact') return 'template_positive_ack'
  return stars <= 2 ? 'template_public_recovery' : 'template_public_standard'
}

function summarize(rows) {
  const out = {
    total: rows.length,
    byMatchStatus: { exact: 0, candidate: 0, unmatched: 0 },
    byPriority: { high: 0, medium: 0, low: 0 },
    byRecommendedAction: {
      direct_contact: 0,
      public_reply: 0,
      no_contact: 0,
      manual_review: 0,
    },
  }

  for (const r of rows) {
    if (out.byMatchStatus[r.matchStatus] != null) out.byMatchStatus[r.matchStatus] += 1
    if (out.byPriority[r.priorityLevel] != null) out.byPriority[r.priorityLevel] += 1
    if (out.byRecommendedAction[r.recommendedAction] != null) {
      out.byRecommendedAction[r.recommendedAction] += 1
    }
  }

  return out
}

async function main() {
  const trustpilotDataset = await loadTrustpilotRows()
  const trustRows = trustpilotDataset.rows
  const supportBlob = readJson(SUPPORT_INDEX_PATH, { rows: [] })
  const supportRows = Array.isArray(supportBlob?.rows) ? supportBlob.rows : []
  const regRows = parseCsv(REGISTRATIONS_PATH)

  const supportByName = buildSupportNameIndex(supportRows)
  const registrationsByName = buildRegistrationNameIndex(regRows)

  const guidanceRows = trustRows.map((row, idx) => {
    const line = idx + 2
    const reviewerName = pick(row, ['Reviewer Name', 'Name'])
    const reviewSummary = pick(row, ['Review Summary'])
    const issueType = pick(row, ['Issue Type'])
    const category = pick(row, ['Category'])
    const actionNeeded = pick(row, ['Action Needed'])
    const assignedTo = pick(row, ['Assigned To'])
    const status = pick(row, ['Status'])
    const trustpilotLink = pick(row, ['Trustpilot Link', 'Link'])
    const dateReviewed = pick(row, ['Date Reviewed'])
    const contacted = pick(row, ['Contacted'])
    const contactChannel = pick(row, ['Contact Channel'])
    const contactOutcome = pick(row, ['Contact Outcome'])
    const clientSentiment = pick(row, ['Client Sentiment'])
    const mainIssue = pick(row, ['Main Issue'])
    const actionTaken = pick(row, ['Action Taken'])
    const reviewStatus = pick(row, ['Review Status'])
    const followUpNeeded = pick(row, ['Follow-up Needed'])
    const additionalNotes = pick(row, ['Additional Notes'])
    const followupNotes = pick(row, ['Follow-up Notes', 'Additional Notes'])
    const potentialLead = pick(row, ['Potential Lead'])
    const country = pick(row, ['Country'])
    const starRatingRaw = pick(row, ['Star Rating'])
    const starRating = toNumber(starRatingRaw) || 0

    const nameKey = normalizeKey(reviewerName)
    const supportCandidates = supportByName.get(nameKey) || []
    const regIds = registrationsByName.get(nameKey) || new Set()

    const matchStatus = inferMatchStatus(supportCandidates, regIds)
    const priorityLevel = classifyPriority(starRating, issueType, actionNeeded)
    const { recommendedAction, reasons } = classifyAction({
      priority: priorityLevel,
      matchStatus,
      stars: starRating,
      issueType,
      actionNeeded,
      summary: reviewSummary,
      contacted,
      contactOutcome,
      clientSentiment,
      reviewStatus,
      followUpNeeded,
    })

    const matchedUserIds = []
    for (const s of supportCandidates.slice(0, 6)) {
      const uid = normalizeText(s.userid)
      if (uid && !matchedUserIds.includes(uid)) matchedUserIds.push(uid)
    }
    for (const uid of regIds) {
      if (matchedUserIds.length >= 6) break
      if (!matchedUserIds.includes(uid)) matchedUserIds.push(uid)
    }

    const sampleUser = supportCandidates[0] || null
    const tradingContext = sampleUser
      ? {
          userid: normalizeText(sampleUser.userid),
          mt5account: normalizeText(sampleUser.mt5account),
          totaldeposits: normalizeText(sampleUser.totaldeposits),
          netdeposits: normalizeText(sampleUser.netdeposits),
          withdrawals: normalizeText(sampleUser.withdrawals),
          volume: normalizeText(sampleUser.volume),
          lots: normalizeText(sampleUser.lots),
          pl: normalizeText(sampleUser.pl),
          status: normalizeText(sampleUser.status),
          country: normalizeText(sampleUser.country),
        }
      : null

    return {
      reviewLine: line,
      reviewerName,
      country,
      starRating,
      issueType,
      category,
      potentialLead,
      assignedTo,
      status,
      dateReviewed,
      trustpilotLink,
      reviewSummary,
      actionNeeded,
      followupNotes,
      contacted,
      contactChannel,
      contactOutcome,
      clientSentiment,
      mainIssue,
      actionTaken,
      reviewStatus,
      followUpNeeded,
      additionalNotes,

      matchStatus,
      matchedUserIds,
      priorityLevel,
      recommendedAction,
      reasonCodes: reasons,
      templateKey: buildTemplateKey(recommendedAction, starRating),
      checklist: buildChecklist(recommendedAction),
      tradingContext,
    }
  })

  const summary = summarize(guidanceRows)
  const generatedAt = new Date().toISOString()

  const guideOut = {
    version: 1,
    generatedAt,
    source: {
      trustpilotSourceKind: trustpilotDataset.sourceKind,
      trustpilotCsv:
        trustpilotDataset.sourceKind === 'local' ? path.relative(ROOT, TRUSTPILOT_PATH) : null,
      trustpilotRemoteUrl:
        trustpilotDataset.sourceKind === 'remote' ? trustpilotDataset.sourceRef : null,
      trustpilotOriginalUrl: trustpilotDataset.sourceOriginalUrl,
      trustpilotRemoteFallbackError: trustpilotDataset.remoteError,
      supportIndex: fs.existsSync(SUPPORT_INDEX_PATH)
        ? path.relative(ROOT, SUPPORT_INDEX_PATH)
        : null,
      registrationsCsv: fs.existsSync(REGISTRATIONS_PATH)
        ? path.relative(ROOT, REGISTRATIONS_PATH)
        : null,
    },
    summary,
    rows: guidanceRows,
  }

  const reportOut = {
    generatedAt,
    summary,
    diagnostics: {
      trustpilotSourceKind: trustpilotDataset.sourceKind,
      trustpilotSourceRef:
        trustpilotDataset.sourceKind === 'local'
          ? path.relative(ROOT, TRUSTPILOT_PATH)
          : trustpilotDataset.sourceRef,
      trustpilotRemoteFallbackError: trustpilotDataset.remoteError,
      trustpilotRows: trustRows.length,
      supportRows: supportRows.length,
      registrationRows: regRows.length,
    },
  }

  fs.mkdirSync(path.dirname(OUT_GUIDE_PATH), { recursive: true })
  fs.mkdirSync(path.dirname(OUT_REPORT_PATH), { recursive: true })

  fs.writeFileSync(OUT_GUIDE_PATH, JSON.stringify(guideOut, null, 2), 'utf8')
  fs.writeFileSync(OUT_REPORT_PATH, JSON.stringify(reportOut, null, 2), 'utf8')

  console.log(
    `Trustpilot source: ${trustpilotDataset.sourceKind} (${trustpilotDataset.sourceKind === 'local' ? path.relative(ROOT, TRUSTPILOT_PATH) : trustpilotDataset.sourceRef})`
  )
  if (trustpilotDataset.remoteError) {
    console.warn(`Remote source fallback note: ${trustpilotDataset.remoteError}`)
  }
  console.log(`Wrote ${path.relative(ROOT, OUT_GUIDE_PATH)}`)
  console.log(`Wrote ${path.relative(ROOT, OUT_REPORT_PATH)}`)
}

main().catch((e) => {
  console.error('Failed to generate trustpilot guidance:', e?.message || e)
  process.exit(1)
})