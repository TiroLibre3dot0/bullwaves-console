/*
Generate a sanitized people index for the public share org chart.

Why:
- The internal org chart data (src/pages/orgChartData.js) includes private fields (e.g. emails).
- Importing it in a public page would bundle those fields into the client JS.

This script extracts ONLY the minimal fields needed for mapping and display:
- section.id
- role.name
- role.title
- role.division
- role.department

Output:
- public/share/org-chart-people.json

Run via:
- node scripts/generate_share_org_people_index.mjs
(Also invoked by scripts/generate_all_indexes.js)
*/

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

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

function sanitizeSections(sections) {
  if (!Array.isArray(sections)) throw new Error('Extracted sections is not an array')

  return sections
    .filter((s) => s && typeof s === 'object')
    .map((s) => {
      const roles = Array.isArray(s.roles) ? s.roles : []
      return {
        id: s.id,
        title: s.title,
        roles: roles
          .filter((r) => r && typeof r === 'object')
          .map((r) => ({
            name: r.name,
            title: r.title,
            division: r.division,
            department: r.department,
          })),
      }
    })
}

function main() {
  const inputPath = path.join(ROOT, 'src', 'pages', 'orgChartData.js')
  const outputPath = path.join(ROOT, 'public', 'share', 'org-chart-people.json')

  const sourceText = fs.readFileSync(inputPath, 'utf8')
  const arrayLiteralText = findSectionsArrayLiteral(sourceText)
  const sections = evaluateSections(arrayLiteralText)
  const sanitized = sanitizeSections(sections)

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'src/pages/orgChartData.js',
    sections: sanitized,
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  process.stdout.write(`Generated ${path.relative(ROOT, outputPath)} (${sanitized.length} sections)\n`)
}

main()
