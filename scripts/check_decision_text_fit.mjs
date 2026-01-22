import fs from 'node:fs'

const flowFiles = [
  'src/flows/registrationFlow.js',
  'src/flows/navigationFlow.js',
  'src/flows/retentionFlow.js',
]

function calcAutoFit(label, subLabel, isPrimary) {
  const safeLabel = (label ?? '').toString()
  const safeSubLabel = (subLabel ?? '').toString()
  const contentLen = safeLabel.length + (safeSubLabel ? safeSubLabel.length : 0)

  const diamondSizePct = contentLen > 55 ? 66 : 62
  const textScale = contentLen > 90 ? 0.78 : contentLen > 70 ? 0.84 : contentLen > 55 ? 0.86 : 0.96
  const labelFontSize =
    contentLen > 90 ? (isPrimary ? 10 : 9) : contentLen > 55 ? (isPrimary ? 11 : 10) : isPrimary ? 12 : 11
  const subLabelFontSize = contentLen > 90 ? 8 : contentLen > 55 ? 9 : 10
  const textMaxWidth = contentLen > 90 ? 108 : contentLen > 70 ? 116 : 120

  return {
    contentLen,
    diamondSizePct,
    textScale,
    labelFontSize,
    subLabelFontSize,
    textMaxWidth,
  }
}

function extractDecisionNodesFromText(fileText) {
  const lines = fileText.split(/\r?\n/)
  const matches = []

  function findDecisionId(lineIndex) {
    // Scan backwards until we hit the start of the object (`{`) and pick the nearest `id:`.
    for (let j = lineIndex; j >= 0 && j >= lineIndex - 25; j--) {
      const idMatch = lines[j].match(/id:\s*'([^']+)'/)
      if (idMatch) return idMatch[1]
      if (lines[j].trim() === '{') break
    }
    return '(unknown)'
  }

  function extractDataBlock(lineIndex) {
    // Find `data: { ... }` after the decision line, then capture balanced braces.
    let start = -1
    for (let j = lineIndex; j < lines.length && j <= lineIndex + 40; j++) {
      if (lines[j].includes('data:')) {
        start = j
        break
      }
    }
    if (start === -1) return ''

    let braceCount = 0
    let started = false
    const collected = []
    for (let j = start; j < lines.length && j <= start + 80; j++) {
      const ln = lines[j]
      collected.push(ln)
      for (const ch of ln) {
        if (ch === '{') {
          braceCount++
          started = true
        }
        if (ch === '}') braceCount--
      }
      if (started && braceCount <= 0) break
    }
    return collected.join('\n')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.includes("type: 'decision'")) continue

    const id = findDecisionId(i)
    const dataBlock = extractDataBlock(i)
    const labelMatch = dataBlock.match(/label:\s*'([^']+)'/)
    const subLabelMatch = dataBlock.match(/subLabel:\s*'([^']+)'/)

    matches.push({
      id,
      label: labelMatch ? labelMatch[1] : '',
      subLabel: subLabelMatch ? subLabelMatch[1] : '',
    })
  }

  // de-dup by id in case chunks overlap
  const seen = new Set()
  return matches.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

function getDecisionW(fileText) {
  const m = fileText.match(/const\s+decisionW\s*=\s*(\d+)/)
  return m ? Number(m[1]) : null
}

let total = 0
for (const flowFile of flowFiles) {
  const text = fs.readFileSync(flowFile, 'utf8')
  const decisionW = getDecisionW(text)
  const decisions = extractDecisionNodesFromText(text)

  if (decisions.length === 0) continue

  console.log(`\n${flowFile} (decisionW=${decisionW ?? 'n/a'})`)
  for (const d of decisions) {
    total++
    const c = calcAutoFit(d.label, d.subLabel, true)
    console.log(`- ${d.id}`)
    console.log(`  label:    "${d.label}" (len=${d.label.length})`)
    console.log(`  subLabel: "${d.subLabel}" (len=${d.subLabel.length})`)
    console.log(
      `  auto-fit: contentLen=${c.contentLen} diamond=${c.diamondSizePct}% scale=${c.textScale} font=${c.labelFontSize}/${c.subLabelFontSize} maxW=${c.textMaxWidth}`
    )
  }
}

console.log(`\nTotal decision nodes scanned: ${total}`)
