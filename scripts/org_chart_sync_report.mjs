/*
Org Chart Sync Report

Goal:
- Compare the existing org chart dataset (source of truth) against the HR CSV reference dataset.
- Produce a conservative, non-destructive preview report BEFORE applying any changes.

Source of truth (current org chart):
- src/pages/orgChartData.js -> export const sections = [...]

CSV reference (employees):
- Organigramma/Bullwaves Active Employees 2026 - Sheet1.csv

This script:
- Parses and normalizes both datasets
- Matches using priority: email (unique & non-generic) -> exact name -> high-confidence fuzzy name
- Classifies org chart nodes as employee vs structural/custom
- Writes:
  - org-chart-sync-report.md (human readable)
  - org-chart-sync-proposed-updates.json (machine readable)

Non-destructive by default:
- Does NOT modify orgChartData.js

Run:
- node scripts/org_chart_sync_report.mjs
- node scripts/org_chart_sync_report.mjs --csv "Organigramma/Bullwaves Active Employees 2026 - Sheet1.csv" --out org-chart-sync-report.md
*/

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const DEFAULT_CSV_PATH = path.join(ROOT, 'Organigramma', 'Bullwaves Active Employees 2026 - Sheet1.csv')
const DEFAULT_REPORT_PATH = path.join(ROOT, 'org-chart-sync-report.md')
const DEFAULT_UPDATES_PATH = path.join(ROOT, 'org-chart-sync-proposed-updates.json')
const ORG_DATA_PATH = path.join(ROOT, 'src', 'pages', 'orgChartData.js')

// Manual overrides where the org chart is intentionally more accurate than the HR CSV.
// These prevent the report from proposing “fixes” that would revert business-confirmed corrections.
const CSV_MANUAL_OVERRIDES_BY_EMAIL = {
  'roberta.jovanovic@bullwaves.com': {
    title: 'Sales Coordinator',
  },
  'orlin.simovonyan@bullwaves.com': {
    title: 'Sales Manager',
  },
  'alex.o@bullwaves.com': {
    department: 'Marketing',
  },
}

function argValue(args, key, fallback = null) {
  const idx = args.indexOf(key)
  if (idx === -1) return fallback
  const v = args[idx + 1]
  if (!v || v.startsWith('--')) return fallback
  return v
}

function toKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

function normSpaces(s) {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripDiacritics(s) {
  // Conservative: remove common diacritics for matching only.
  return String(s ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '')
}

function nameKey(raw) {
  const s = normSpaces(raw)
  // Keep apostrophes for display; remove punctuation for matching.
  const cleaned = stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned
}

function emailKey(raw) {
  const e = toKey(raw)
  if (!e || e === '—') return ''
  return e
}

function isProbablyGenericEmail(email) {
  const e = emailKey(email)
  if (!e.includes('@')) return false
  const local = e.split('@')[0]
  // Heuristic: shared inboxes that often map to multiple people/nodes.
  const generic = new Set([
    'info',
    'support',
    'help',
    'sales',
    'partners',
    'affiliate',
    'affiliates',
    'marketing',
    'hr',
    'finance',
    'payments',
    'compliance',
    'admin',
  ])
  return generic.has(local)
}

function safeValue(raw) {
  const s = normSpaces(raw)
  if (!s || s === '—') return ''
  return s
}

function parseCsvEmployees(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    delimiter: '',
    quoteChar: '"',
    escapeChar: '"',
    transformHeader: (h) => normSpaces(h).replace(/(^"|"$)/g, ''),
  })

  const rows = Array.isArray(parsed.data) ? parsed.data : []
  const cleaned = rows
    .filter((r) => r && typeof r === 'object')
    .map((r) => {
      let name = safeValue(r['Employee Name'])
      let title = safeValue(r['Job Title'])
      let division = safeValue(r['Division'])
      let department = safeValue(r['Department'])
      const region = safeValue(r['Region'])
      const email = safeValue(r['Email Address'])

      const manual = CSV_MANUAL_OVERRIDES_BY_EMAIL[emailKey(email)]
      if (manual) {
        if (manual.name) name = manual.name
        if (manual.title) title = manual.title
        if (manual.division) division = manual.division
        if (manual.department) department = manual.department
      }

      return {
        source: 'csv',
        raw: { name, title, division, department, region, email },
        norm: {
          nameKey: nameKey(name),
          emailKey: emailKey(email),
          titleKey: toKey(title),
          divisionKey: toKey(division),
          departmentKey: toKey(department),
          regionKey: toKey(region),
        },
      }
    })
    .filter((e) => e.raw.name || e.raw.email)

  const errors = Array.isArray(parsed.errors) ? parsed.errors : []
  return { employees: cleaned, parseWarnings: errors }
}

function findSectionsArrayLiteral(sourceText) {
  const marker = /export\s+const\s+sections\s*=\s*/g
  const match = marker.exec(sourceText)
  if (!match) throw new Error('Could not find "export const sections =" in orgChartData.js')

  const after = match.index + match[0].length
  const arrayStart = sourceText.indexOf('[', after)
  if (arrayStart === -1) throw new Error('Could not find sections array start "["')

  let depth = 0
  let inString = false
  let stringQuote = ''
  let escaped = false

  for (let i = arrayStart; i < sourceText.length; i++) {
    const ch = sourceText[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === stringQuote) {
        inString = false
        stringQuote = ''
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true
      stringQuote = ch
      escaped = false
      continue
    }

    if (ch === '[') depth++
    if (ch === ']') {
      depth--
      if (depth === 0) {
        return sourceText.slice(arrayStart, i + 1)
      }
    }
  }

  throw new Error('Could not find matching closing "]" for sections array')
}

function evaluateSections(arrayLiteralText) {
  const wrapped = `"use strict";\nconst sections = ${arrayLiteralText};\nsections;`
  return vm.runInNewContext(wrapped, {}, { timeout: 2000 })
}

function flattenOrgChart(sections) {
  const out = []
  for (const section of sections || []) {
    const sectionId = safeValue(section?.id)
    const sectionTitle = safeValue(section?.title)
    const roles = Array.isArray(section?.roles) ? section.roles : []

    for (let i = 0; i < roles.length; i++) {
      const r = roles[i] || {}
      const name = safeValue(r.name)
      const title = safeValue(r.title)
      const division = safeValue(r.division)
      const department = safeValue(r.department)
      const region = safeValue(r.region)
      const email = safeValue(r.email)
      const focus = safeValue(r.focus)
      const duties = safeValue(r.duties)

      out.push({
        source: 'org',
        meta: { sectionId, sectionTitle, roleIndex: i },
        raw: { name, title, division, department, region, email, focus, duties },
        norm: {
          nameKey: nameKey(name),
          emailKey: emailKey(email),
        },
      })
    }
  }
  return out
}

function isStructuralOrgNode(orgRole) {
  const sectionId = orgRole?.meta?.sectionId || ''
  const name = orgRole?.raw?.name || ''
  const title = orgRole?.raw?.title || ''
  const focus = orgRole?.raw?.focus || ''
  const nk = nameKey(name)
  const tk = toKey(title)
  const fk = toKey(focus)

  // Known structural section: area layer roles describe responsibilities (not employees)
  if (sectionId === 'area-responsibility') return true

  // Structural labels often contain parentheses, like "Operations (Area)"
  if (name.includes('(') && name.includes(')')) return true

  // Scope/group placeholders (non-employee nodes)
  if (tk.includes('scope') || nk.includes('scope')) return true
  if (nk.includes('backfills') || nk.includes('creators')) return true
  if (fk.includes('scope')) return true

  // Explicit known patterns
  if (nk.includes('area') && nk.includes('operations')) return true
  if (nk.includes('area') && nk.includes('support')) return true
  if (nk.includes('area') && nk.includes('payments')) return true

  return false
}

function isEmployeeCandidateOrgNode(orgRole) {
  if (!orgRole) return false
  if (isStructuralOrgNode(orgRole)) return false

  const name = orgRole.raw?.name || ''
  const email = orgRole.raw?.email || ''

  // Treat as a person entry if it looks like a person name.
  // Email may be missing in org chart, but name should exist.
  const nk = nameKey(name)
  if (!nk) return false

  // Exclude known non-person labels.
  const nonPeople = new Set([
    'defi creators',
    'support backfills',
    'operations scope',
    'finance scope',
    'dealing operations truviam',
  ])
  if (nonPeople.has(nk) && !email) return false

  // Avoid placeholders.
  const bad = new Set(['tbd', 'unassigned', 'n/a'])
  if (bad.has(nk)) return false

  // If there is an email and it is clearly not an email, downrank.
  if (email && email !== '—' && !email.includes('@')) return false

  return true
}

function lastNameToken(nk) {
  const parts = String(nk || '')
    .split(' ')
    .filter(Boolean)
  if (!parts.length) return ''
  return parts[parts.length - 1]
}

function levenshtein(a, b) {
  const s = String(a || '')
  const t = String(b || '')
  const n = s.length
  const m = t.length
  if (n === 0) return m
  if (m === 0) return n

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 0; i <= n; i++) dp[i][0] = i
  for (let j = 0; j <= m; j++) dp[0][j] = j

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  return dp[n][m]
}

function similarity(a, b) {
  const sa = String(a || '')
  const sb = String(b || '')
  const maxLen = Math.max(sa.length, sb.length)
  if (maxLen === 0) return 1
  const d = levenshtein(sa, sb)
  return 1 - d / maxLen
}

function indexBy(arr, keyFn) {
  const map = new Map()
  for (const item of arr) {
    const key = keyFn(item)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

function matchDatasets({ orgPeople, csvPeople }) {
  // Build indices
  const csvByEmail = indexBy(csvPeople, (e) => e.norm.emailKey)
  const csvByName = indexBy(csvPeople, (e) => e.norm.nameKey)

  const orgByEmail = indexBy(orgPeople, (r) => r.norm.emailKey)
  const orgByName = indexBy(orgPeople, (r) => r.norm.nameKey)

  // Precompute email uniqueness
  const csvEmailUnique = new Set(
    Array.from(csvByEmail.entries())
      .filter(([k, v]) => k && v.length === 1)
      .map(([k]) => k)
  )
  const orgEmailUnique = new Set(
    Array.from(orgByEmail.entries())
      .filter(([k, v]) => k && v.length === 1)
      .map(([k]) => k)
  )

  const matches = []
  const orgMatched = new Set()
  const csvMatched = new Set()
  const ambiguities = []

  function addMatch(kind, orgRole, csvEmp, confidence, reason) {
    matches.push({ kind, orgRole, csvEmp, confidence, reason })
    orgMatched.add(orgRole)
    csvMatched.add(csvEmp)
  }

  // Pass 1: email match
  // - Prefer unique, non-generic emails
  // - If org has multiple roles with same email, match by exact name inside the email bucket
  for (const [email, csvArr] of csvByEmail.entries()) {
    if (!email || !email.includes('@')) continue
    const orgArr = orgByEmail.get(email) || []
    if (!orgArr.length || !csvArr.length) continue

    // CSV duplicate email is always ambiguous
    if (csvArr.length > 1) {
      ambiguities.push({ kind: 'duplicate-email-in-csv', email, csvCandidates: csvArr.map((x) => x.raw) })
      continue
    }

    const csvEmp = csvArr[0]
    const generic = isProbablyGenericEmail(email)

    if (orgArr.length === 1 && !generic) {
      const orgRole = orgArr[0]
      if (!orgMatched.has(orgRole) && !csvMatched.has(csvEmp)) {
        addMatch('email', orgRole, csvEmp, 1.0, 'email match')
      }
      continue
    }

    // If email is generic OR appears on multiple org roles, require name confirmation
    const nk = csvEmp.norm.nameKey
    const nameMatches = orgArr.filter((r) => r?.norm?.nameKey && r.norm.nameKey === nk)
    if (nameMatches.length === 1) {
      const orgRole = nameMatches[0]
      if (!orgMatched.has(orgRole) && !csvMatched.has(csvEmp)) {
        addMatch('email+name', orgRole, csvEmp, generic ? 0.92 : 0.97, 'email bucket + exact name')
      }
    } else if (orgArr.length > 1) {
      ambiguities.push({
        kind: 'email-collision-in-org',
        email,
        generic,
        csv: csvEmp.raw,
        orgCandidates: orgArr.map((x) => ({ ...x.raw, sectionId: x.meta.sectionId })),
      })
    }
  }

  // Pass 2: exact name match (unique)
  for (const orgRole of orgPeople) {
    if (orgMatched.has(orgRole)) continue
    const nk = orgRole.norm.nameKey
    if (!nk) continue

    const orgNameCandidates = orgByName.get(nk) || []
    const csvNameCandidates = csvByName.get(nk) || []

    if (orgNameCandidates.length === 1 && csvNameCandidates.length === 1) {
      addMatch('name', orgRole, csvNameCandidates[0], 0.98, 'unique exact name match')
    } else if (csvNameCandidates.length > 1) {
      ambiguities.push({
        kind: 'duplicate-name-in-csv',
        nameKey: nk,
        csvCandidates: csvNameCandidates.map((x) => x.raw),
      })
    }
  }

  // Pass 3: fuzzy name match (high confidence, unique best)
  for (const orgRole of orgPeople) {
    if (orgMatched.has(orgRole)) continue
    const nk = orgRole.norm.nameKey
    if (!nk) continue

    const orgLast = lastNameToken(nk)
    const csvRemaining = csvPeople.filter((e) => !csvMatched.has(e))

    const scored = []
    for (const emp of csvRemaining) {
      const ek = emp.norm.nameKey
      if (!ek) continue
      const empLast = lastNameToken(ek)
      // Safety gates: same last name token, and first char matches.
      if (orgLast && empLast && orgLast !== empLast) continue
      if (nk[0] && ek[0] && nk[0] !== ek[0]) continue

      const score = similarity(nk, ek)
      if (score >= 0.93) scored.push({ emp, score })
    }

    scored.sort((a, b) => b.score - a.score)
    if (scored.length === 0) continue

    const best = scored[0]
    const second = scored[1]
    const gap = second ? best.score - second.score : 1

    if (best.score >= 0.96 && gap >= 0.03) {
      addMatch('fuzzy', orgRole, best.emp, best.score, 'high-confidence fuzzy name match')
    } else {
      ambiguities.push({
        kind: 'fuzzy-ambiguous',
        org: orgRole.raw,
        candidates: scored.slice(0, 5).map((x) => ({ score: x.score, csv: x.emp.raw })),
      })
    }
  }

  // Remaining ambiguous email collisions
  const emailCollisions = []
  for (const [e, csvArr] of csvByEmail.entries()) {
    if (!e || !e.includes('@')) continue
    const orgArr = orgByEmail.get(e) || []
    if (csvArr.length >= 1 && orgArr.length >= 1) {
      const isAmb = csvArr.length !== 1 || orgArr.length !== 1 || isProbablyGenericEmail(e)
      if (isAmb) {
        emailCollisions.push({
          email: e,
          csv: csvArr.map((x) => x.raw),
          org: orgArr.map((x) => ({ ...x.raw, sectionId: x.meta.sectionId })),
          generic: isProbablyGenericEmail(e),
        })
      }
    }
  }

  // Secondary confirmations: org roles that refer to already-matched employees (duplicates / multi-role assignments)
  const matchedCsvNameKeys = new Set(matches.map((m) => m.csvEmp?.norm?.nameKey).filter(Boolean))
  const matchedCsvEmailKeys = new Set(matches.map((m) => m.csvEmp?.norm?.emailKey).filter(Boolean))

  const unmatchedOrg = orgPeople.filter((r) => !orgMatched.has(r))
  const secondaryConfirmedOrg = unmatchedOrg.filter((r) => {
    const nk = r?.norm?.nameKey
    const ek = r?.norm?.emailKey
    return (nk && matchedCsvNameKeys.has(nk)) || (ek && matchedCsvEmailKeys.has(ek))
  })

  return {
    matches,
    ambiguities,
    emailCollisions,
    unmatchedOrg,
    secondaryConfirmedOrg,
    unmatchedCsv: csvPeople.filter((e) => !csvMatched.has(e)),
  }
}

function diffFields(orgRaw, csvRaw) {
  const fields = ['name', 'title', 'division', 'department', 'region', 'email']
  const changes = []
  for (const f of fields) {
    const a = safeValue(orgRaw?.[f])
    const b = safeValue(csvRaw?.[f])
    if (a !== b) changes.push({ field: f, org: a, csv: b })
  }
  return changes
}

function suggestPlacement(orgSections, emp) {
  // Conservative: infer only when there is an obvious *employee* section.
  const deptKey = toKey(emp?.raw?.department)
  const divKey = toKey(emp?.raw?.division)

  const sectionIds = new Set((orgSections || []).map((s) => safeValue(s?.id)).filter(Boolean))
  const has = (id) => id && sectionIds.has(id)

  // Never suggest structural sections as placement targets.
  const blocked = new Set(['area-responsibility'])

  const csvTitleKey = toKey(emp?.raw?.title)
  const isManagementLike =
    csvTitleKey.includes('shareholder') || csvTitleKey.includes('coo') || csvTitleKey.includes('ceo')

  const directMap = [
    { when: deptKey === 'support team', id: 'support-team', confidence: 'high', reason: 'department Support Team' },
    { when: deptKey === 'operations' || divKey === 'operations', id: 'operations', confidence: 'medium', reason: 'operations division/department' },
    { when: deptKey.startsWith('sales') || deptKey.includes('bdm'), id: 'business-development', confidence: 'medium', reason: 'sales/BDM department' },
    { when: deptKey.includes('affiliate'), id: 'affiliation', confidence: 'medium', reason: 'affiliate department' },
    { when: divKey === 'marketing' || deptKey.startsWith('marketing'), id: 'marketing', confidence: 'medium', reason: 'marketing division/department' },
    { when: divKey === 'finance' && deptKey === 'psp', id: 'payments', confidence: 'medium', reason: 'finance/PSP maps to payments' },
    { when: divKey === 'finance', id: 'finance', confidence: 'low', reason: 'finance division' },
    { when: divKey === 'compliance' || deptKey === 'compliance', id: 'compliance', confidence: 'medium', reason: 'compliance division/department' },
    { when: deptKey === 'dealing' || divKey.includes('trading'), id: 'dealing', confidence: 'medium', reason: 'dealing/trading' },
    { when: deptKey === 'hr', id: 'operations', confidence: 'low', reason: 'HR under operations (no dedicated section)' },
    { when: isManagementLike, id: 'management-team', confidence: 'medium', reason: 'management/shareholder title' },
  ]

  for (const rule of directMap) {
    if (!rule.when) continue
    if (!has(rule.id)) continue
    if (blocked.has(rule.id)) continue
    return { sectionId: rule.id, confidence: rule.confidence, reason: rule.reason }
  }

  // Minimal mapping; does not invent hierarchy.
  const candidates = []
  for (const s of orgSections) {
    const sid = safeValue(s?.id)
    if (!sid) continue

    if (blocked.has(sid)) continue
    if (sid === 'management-team' && !isManagementLike) continue

    // If section contains roles with same department label, it's a strong hint.
    const roles = Array.isArray(s?.roles) ? s.roles : []
    const hasDept = roles.some((r) => toKey(r?.department) === deptKey && deptKey)
    const hasDiv = roles.some((r) => toKey(r?.division) === divKey && divKey)

    if (hasDept) candidates.push({ sectionId: sid, reason: 'department match' })
    else if (hasDiv) candidates.push({ sectionId: sid, reason: 'division match' })
  }

  // Prefer department match
  const dept = candidates.find((c) => c.reason === 'department match')
  if (dept) return { sectionId: dept.sectionId, confidence: 'medium', reason: dept.reason }

  const div = candidates.find((c) => c.reason === 'division match')
  if (div) return { sectionId: div.sectionId, confidence: 'low', reason: div.reason }

  return { sectionId: '', confidence: 'none', reason: 'placement uncertain' }
}

function mdEscape(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function mdTable(headers, rows) {
  const h = `| ${headers.map(mdEscape).join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows
    .map((r) => `| ${r.map((c) => mdEscape(c)).join(' | ')} |`)
    .join('\n')
  return [h, sep, body].filter(Boolean).join('\n')
}

function writeReport({ orgAllRoles, orgPeople, orgStructural, csvEmployees, comparison, orgSections }) {
  const matched = comparison.matches
  const unmatchedOrg = comparison.unmatchedOrg
  const unmatchedCsv = comparison.unmatchedCsv

  const peopleToUpdate = []
  const confirmed = []

  for (const m of matched) {
    const changes = diffFields(m.orgRole.raw, m.csvEmp.raw)
    if (changes.length) {
      peopleToUpdate.push({ match: m, changes })
    } else {
      confirmed.push(m)
    }
  }

  const proposedUpdates = peopleToUpdate.map((u) => {
    return {
      matchKind: u.match.kind,
      confidence: u.match.confidence,
      sectionId: u.match.orgRole.meta.sectionId,
      orgMeta: { ...u.match.orgRole.meta },
      org: { ...u.match.orgRole.raw },
      csv: { ...u.match.csvEmp.raw },
      changedFields: u.changes,
      reason: u.match.reason,
    }
  })

  const removals = comparison.unmatchedOrg
    .filter((r) => !comparison.secondaryConfirmedOrg.includes(r))
    .map((r) => {
    const structural = isStructuralOrgNode(r)
    return {
      sectionId: r.meta.sectionId,
      name: r.raw.name,
      title: r.raw.title,
      email: r.raw.email,
      classification: structural
        ? 'custom org chart node to preserve'
        : r.raw.email
          ? 'candidate inactive/removed employee'
          : 'uncertain / manual review needed',
    }
  })

  const secondaryConfirmed = comparison.secondaryConfirmedOrg.map((r) => ({
    sectionId: r.meta.sectionId,
    name: r.raw.name,
    title: r.raw.title,
    email: r.raw.email,
    classification: 'confirmed by CSV (duplicate/multi-role entry) — preserve',
  }))

  const addList = unmatchedCsv.map((e) => {
    const placement = suggestPlacement(orgSections, e)
    return {
      ...e.raw,
      suggestedSectionId: placement.sectionId || '—',
      suggestedPlacement: placement,
      placementNote:
        placement.confidence === 'none'
          ? 'placement uncertain'
          : `suggested section: ${placement.sectionId} (${placement.reason}, ${placement.confidence})`,
    }
  })

  const now = new Date().toISOString()

  const lines = []
  lines.push(`# Org Chart Sync Report (Preview)\n`)
  lines.push(`Generated: ${now}`)
  lines.push(`\nReference CSV: Organigramma/Bullwaves Active Employees 2026 - Sheet1.csv`)
  lines.push(`\nCurrent org chart source of truth: src/pages/orgChartData.js`)

  lines.push(`\n## 1) Executive Summary\n`)
  lines.push(
    mdTable(
      ['Metric', 'Value'],
      [
        ['Total current org chart roles (all sections)', String(orgAllRoles.length)],
        ['Current org chart employee-candidate roles', String(orgPeople.length)],
        ['Current org chart structural/custom roles preserved', String(orgStructural.length)],
        ['Total CSV employees', String(csvEmployees.length)],
        ['Matched records', String(matched.length)],
        ['New people to add', String(addList.length)],
        ['Existing people to update', String(peopleToUpdate.length)],
        ['Candidate removals (unmatched org people)', String(removals.length)],
        ['Confirmed duplicates/multi-role entries', String(secondaryConfirmed.length)],
        ['Ambiguous matches', String(comparison.ambiguities.length)],
        ['Email collisions/warnings', String(comparison.emailCollisions.length)],
      ]
    )
  )

  lines.push(`\n## 2) People to Add\n`)
  if (!addList.length) {
    lines.push('No missing employees detected.')
  } else {
    lines.push(
      mdTable(
        [
          'Employee Name',
          'Job Title',
          'Division',
          'Department',
          'Region',
          'Email Address',
          'Suggested Placement',
        ],
        addList.map((p) => [
          p.name,
          p.title,
          p.division,
          p.department,
          p.region,
          p.email,
          p.placementNote,
        ])
      )
    )
  }

  lines.push(`\n## 3) People to Update\n`)
  if (!peopleToUpdate.length) {
    lines.push('No updates detected for matched people.')
  } else {
    for (const u of peopleToUpdate) {
      const org = u.match.orgRole
      const csv = u.match.csvEmp
      lines.push(`### ${org.raw.name || '(unnamed)'} (${org.meta.sectionId})`)
      lines.push(`Match: ${u.match.kind} · confidence=${u.match.confidence} · reason=${u.match.reason}`)
      lines.push(
        mdTable(
          ['Field', 'Current (org chart)', 'CSV'],
          u.changes.map((c) => [c.field, c.org || '—', c.csv || '—'])
        )
      )
      lines.push('')
    }
  }

  lines.push(`\n## 4) Candidate Removals\n`)
  lines.push(
    'These org chart entries were not found in the CSV. IMPORTANT: no deletions are performed; this is preview-only.'
  )
  if (!removals.length) {
    lines.push('No candidate removals detected.')
  } else {
    lines.push(
      mdTable(
        ['Section', 'Name/Label', 'Title', 'Email', 'Classification'],
        removals.map((r) => [r.sectionId, r.name, r.title, r.email, r.classification])
      )
    )
  }

  if (secondaryConfirmed.length) {
    lines.push(`\n### Confirmed duplicates / multi-role entries (preserve)\n`)
    lines.push(
      mdTable(
        ['Section', 'Name', 'Title', 'Email', 'Classification'],
        secondaryConfirmed.map((r) => [r.sectionId, r.name, r.title, r.email, r.classification])
      )
    )
  }

  lines.push(`\n## 5) Ambiguities and Warnings\n`)

  if (comparison.emailCollisions.length) {
    lines.push('### Email collisions / shared inboxes')
    lines.push(
      mdTable(
        ['Email', 'Generic?', 'CSV Count', 'Org Count'],
        comparison.emailCollisions.map((c) => [
          c.email,
          c.generic ? 'yes' : 'no',
          String(c.csv.length),
          String(c.org.length),
        ])
      )
    )
    lines.push('')
  }

  if (comparison.ambiguities.length) {
    lines.push('### Ambiguous matches')
    lines.push(
      mdTable(
        ['Kind', 'Details'],
        comparison.ambiguities.slice(0, 50).map((a) => [a.kind, JSON.stringify(a).slice(0, 180)])
      )
    )
    if (comparison.ambiguities.length > 50) {
      lines.push(`\n(Showing first 50 of ${comparison.ambiguities.length})\n`)
    }
  } else {
    lines.push('No ambiguities detected.')
  }

  lines.push(`\n## 6) Proposed Integration Plan\n`)
  lines.push('- Preserve existing org chart hierarchy and section structure by default.')
  lines.push('- Apply updates only for high-confidence matches (unique email or unique exact name).')
  lines.push('- Do not remove unmatched nodes automatically; keep them as candidate removals for manual review.')
  lines.push('- Add missing employees only with manual placement confirmation (CSV has no manager relationships).')
  lines.push('- Keep shared inbox emails as warnings; prefer name-based confirmation for those.')

  lines.push(`\n---\n`)
  lines.push('### Implementation notes (current org chart sources)')
  lines.push('- Internal org chart page: src/pages/OrgChart.jsx renders cards from sections in src/pages/orgChartData.js.')
  lines.push('- Public share people view: public/share/org-chart-people.json is generated from src/pages/orgChartData.js via scripts/generate_share_org_people_index.mjs and injected into an existing fixed structure (ShareOrgChartTrueTree).')
  lines.push('- Public diagram view: src/pages/share/ShareOrgChart.jsx builds a derived model via src/components/orgchart/orgModel.js (no emails).')

  return {
    markdown: lines.join('\n') + '\n',
    proposedUpdates,
    proposedAdds: addList,
    candidateRemovals: removals,
    confirmedDuplicates: secondaryConfirmed,
    ambiguities: comparison.ambiguities,
    emailCollisions: comparison.emailCollisions,
  }
}

function main() {
  const args = process.argv.slice(2)
  const csvArg = argValue(args, '--csv', null)
  const outArg = argValue(args, '--out', null)
  const updatesArg = argValue(args, '--updates', null)

  const csvPath = csvArg ? path.resolve(ROOT, csvArg) : DEFAULT_CSV_PATH
  const reportPath = outArg ? path.resolve(ROOT, outArg) : DEFAULT_REPORT_PATH
  const updatesPath = updatesArg ? path.resolve(ROOT, updatesArg) : DEFAULT_UPDATES_PATH

  const csvText = fs.readFileSync(csvPath, 'utf8')
  const { employees: csvEmployees } = parseCsvEmployees(csvText)

  const orgText = fs.readFileSync(ORG_DATA_PATH, 'utf8')
  const arrayLiteralText = findSectionsArrayLiteral(orgText)
  const orgSections = evaluateSections(arrayLiteralText)
  const orgAllRoles = flattenOrgChart(orgSections)

  const orgEmployeeCandidates = orgAllRoles.filter(isEmployeeCandidateOrgNode)
  const orgStructural = orgAllRoles.filter((r) => !isEmployeeCandidateOrgNode(r))

  const comparison = matchDatasets({ orgPeople: orgEmployeeCandidates, csvPeople: csvEmployees })

  const {
    markdown,
    proposedUpdates,
    proposedAdds,
    candidateRemovals,
    confirmedDuplicates,
    ambiguities,
    emailCollisions,
  } = writeReport({
    orgAllRoles,
    orgPeople: orgEmployeeCandidates,
    orgStructural,
    csvEmployees,
    comparison,
    orgSections,
  })

  fs.writeFileSync(reportPath, markdown, 'utf8')
  fs.writeFileSync(
    updatesPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        orgSource: 'src/pages/orgChartData.js',
        csvSource: path.relative(ROOT, csvPath).replace(/\\/g, '/'),
        proposedUpdates,
        proposedAdds,
        candidateRemovals,
        confirmedDuplicates,
        ambiguities,
        emailCollisions,
      },
      null,
      2
    ) + '\n',
    'utf8'
  )

  process.stdout.write(`Wrote report: ${path.relative(ROOT, reportPath)}\n`)
  process.stdout.write(`Wrote proposed updates: ${path.relative(ROOT, updatesPath)}\n`)
}

main()
