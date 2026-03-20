/*
Generate a read-only Trustpilot guidance dataset.

Goal:
- Start from Trustpilot CSV and compute a simple, intuitive decision guide.
- No DB writes, no state persistence, just deterministic guidance output files.

Input:
- Trustpilot/TrustPilot Review Tracker.csv
- public/support_users_index.json (optional, for identity/trading context)
- public/Registrations Report.csv (optional, used as fallback for identity lookup)

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
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return Array.isArray(parsed.data) ? parsed.data : []
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
  for (const k of Object.keys(row)) map[k.toLowerCase()] = k
  for (const c of candidates) {
    const mk = map[String(c).toLowerCase()]
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

function classifyAction({ priority, matchStatus, stars, issueType, actionNeeded, summary }) {
  const reasons = []
  const issue = normalizeKey(issueType)
  const action = normalizeKey(actionNeeded)
  const text = `${normalizeKey(summary)} ${action} ${issue}`

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

function main() {
  if (!fs.existsSync(TRUSTPILOT_PATH)) {
    console.error('Trustpilot CSV not found:', TRUSTPILOT_PATH)
    process.exit(1)
  }

  const trustRows = parseCsv(TRUSTPILOT_PATH)
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
    const followupNotes = pick(row, ['Follow-up Notes'])
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
      trustpilotCsv: path.relative(ROOT, TRUSTPILOT_PATH),
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
      trustpilotRows: trustRows.length,
      supportRows: supportRows.length,
      registrationRows: regRows.length,
    },
  }

  fs.mkdirSync(path.dirname(OUT_GUIDE_PATH), { recursive: true })
  fs.mkdirSync(path.dirname(OUT_REPORT_PATH), { recursive: true })

  fs.writeFileSync(OUT_GUIDE_PATH, JSON.stringify(guideOut, null, 2), 'utf8')
  fs.writeFileSync(OUT_REPORT_PATH, JSON.stringify(reportOut, null, 2), 'utf8')

  console.log(`Wrote ${path.relative(ROOT, OUT_GUIDE_PATH)}`)
  console.log(`Wrote ${path.relative(ROOT, OUT_REPORT_PATH)}`)
}

main()