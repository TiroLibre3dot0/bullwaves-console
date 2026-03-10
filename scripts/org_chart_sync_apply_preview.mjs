#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())
const DEFAULT_IN = path.join(ROOT, 'org-chart-sync-proposed-updates.json')
const DEFAULT_OUT = path.join(ROOT, 'org-chart-sync-apply-preview.md')

function argValue(args, name, fallback = null) {
  const idx = args.indexOf(name)
  if (idx === -1) return fallback
  const next = args[idx + 1]
  if (!next || next.startsWith('--')) return fallback
  return next
}

function hasFlag(args, name) {
  return args.includes(name)
}

function mdEscape(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function mdTable(headers, rows) {
  const h = `| ${headers.map(mdEscape).join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((r) => `| ${r.map((c) => mdEscape(c)).join(' | ')} |`).join('\n')
  return [h, sep, body].filter(Boolean).join('\n')
}

function levenshtein(a, b) {
  const s = String(a ?? '')
  const t = String(b ?? '')
  if (s === t) return 0
  if (!s.length) return t.length
  if (!t.length) return s.length

  const v0 = new Array(t.length + 1)
  const v1 = new Array(t.length + 1)
  for (let i = 0; i < v0.length; i++) v0[i] = i

  for (let i = 0; i < s.length; i++) {
    v1[0] = i + 1
    for (let j = 0; j < t.length; j++) {
      const cost = s[i] === t[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j]
  }

  return v1[t.length]
}

function classifyFieldChange(field, orgVal, csvVal) {
  if (field === 'name') return { level: 'safe', note: 'name normalization' }
  if (field === 'region' && !String(orgVal ?? '').trim() && String(csvVal ?? '').trim()) {
    return { level: 'safe', note: 'fill missing region' }
  }

  if (field === 'email') {
    const orgEmail = String(orgVal ?? '').trim().toLowerCase()
    const csvEmail = String(csvVal ?? '').trim().toLowerCase()
    const orgDomain = orgEmail.split('@')[1] || ''
    const csvDomain = csvEmail.split('@')[1] || ''
    const orgLocal = orgEmail.split('@')[0] || ''
    const csvLocal = csvEmail.split('@')[0] || ''
    const dist = levenshtein(orgLocal, csvLocal)
    const typoHint = orgDomain && orgDomain === csvDomain && dist > 0 && dist <= 2
    return {
      level: 'review',
      note: typoHint ? `email differs by small edit distance (possible typo, d=${dist})` : 'email change',
    }
  }

  if (field === 'title' || field === 'division' || field === 'department') {
    return { level: 'review', note: 'role metadata change' }
  }

  return { level: 'review', note: 'field change' }
}

function main() {
  const args = process.argv.slice(2)
  const inArg = argValue(args, '--in', null)
  const outArg = argValue(args, '--out', null)
  const onlySafe = hasFlag(args, '--only-safe')

  const inPath = inArg ? path.resolve(ROOT, inArg) : DEFAULT_IN
  const outPath = outArg ? path.resolve(ROOT, outArg) : DEFAULT_OUT

  const payload = JSON.parse(fs.readFileSync(inPath, 'utf8'))

  const lines = []
  lines.push(`# Org Chart Sync Apply Preview (Dry Run)\n`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`\nInput: ${path.relative(ROOT, inPath).replace(/\\/g, '/')}`)
  lines.push(`\nOrg source: ${payload.orgSource}`)
  lines.push(`CSV source: ${payload.csvSource}`)

  const updates = Array.isArray(payload.proposedUpdates) ? payload.proposedUpdates : []
  const adds = Array.isArray(payload.proposedAdds) ? payload.proposedAdds : []
  const removals = Array.isArray(payload.candidateRemovals) ? payload.candidateRemovals : []
  const duplicates = Array.isArray(payload.confirmedDuplicates) ? payload.confirmedDuplicates : []

  const updateRows = []
  for (const u of updates) {
    const sectionId = u?.orgMeta?.sectionId || u?.sectionId || ''
    const roleIndex = Number.isFinite(u?.orgMeta?.roleIndex) ? String(u.orgMeta.roleIndex) : ''
    const name = u?.org?.name || ''
    const email = u?.org?.email || ''

    const changed = Array.isArray(u?.changedFields) ? u.changedFields : []
    for (const c of changed) {
      const field = c?.field || ''
      const orgVal = c?.org
      const csvVal = c?.csv
      const cls = classifyFieldChange(field, orgVal, csvVal)
      if (onlySafe && cls.level !== 'safe') continue

      updateRows.push([
        sectionId,
        roleIndex,
        name,
        email,
        field,
        String(orgVal ?? ''),
        String(csvVal ?? ''),
        `${cls.level}: ${cls.note}`,
        `${u?.matchKind || ''} (${u?.confidence ?? ''})`,
      ])
    }
  }

  lines.push(`\n## Proposed Updates (${onlySafe ? 'safe-only' : 'all'})\n`)
  if (!updateRows.length) {
    lines.push('No updates to show with current filters.')
  } else {
    lines.push(
      mdTable(
        ['Section', 'RoleIndex', 'Name', 'Email', 'Field', 'Org', 'CSV', 'Safety', 'Match'],
        updateRows
      )
    )
  }

  lines.push(`\n## Proposed Adds\n`)
  if (!adds.length) {
    lines.push('No missing employees detected.')
  } else {
    lines.push(
      mdTable(
        ['Name', 'Title', 'Division', 'Department', 'Region', 'Email', 'Suggested Section', 'Placement'],
        adds.map((a) => [
          a.name,
          a.title,
          a.division,
          a.department,
          a.region,
          a.email,
          a.suggestedSectionId,
          a.placementNote,
        ])
      )
    )
  }

  lines.push(`\n## Candidate Removals (Preview Only)\n`)
  if (!removals.length) {
    lines.push('No candidate removals detected.')
  } else {
    lines.push(
      mdTable(
        ['Section', 'Name', 'Title', 'Email', 'Classification'],
        removals.map((r) => [r.sectionId, r.name, r.title, r.email, r.classification])
      )
    )
  }

  lines.push(`\n## Confirmed Duplicates / Multi-role Entries (Preserve)\n`)
  if (!duplicates.length) {
    lines.push('No duplicate/multi-role entries detected.')
  } else {
    lines.push(
      mdTable(
        ['Section', 'Name', 'Title', 'Email', 'Classification'],
        duplicates.map((r) => [r.sectionId, r.name, r.title, r.email, r.classification])
      )
    )
  }

  lines.push(`\n---\n`)
  lines.push(`This is a dry-run preview. It does not modify ${payload.orgSource}.`) 
  lines.push(`Use the pointers (Section + RoleIndex) to apply edits manually inside orgChartData.js.`)

  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8')
  process.stdout.write(`Wrote apply preview: ${path.relative(ROOT, outPath).replace(/\\/g, '/')}\n`)
}

main()
