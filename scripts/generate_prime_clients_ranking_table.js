/*
Generate a JSON artifact consumed by the shared ranking pages.

Input:
  CREOLABS/Prime Clients Ranking.xlsx

Output:
  public/prime_clients_ranking_table.json

Notes:
  - Uses exceljs streaming reader to avoid OOM on larger XLSX files.
  - Reads the FIRST sheet only.
*/

const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')

const ROOT_DIR = path.join(__dirname, '..')
const CREOLABS_DIR = path.join(ROOT_DIR, 'CREOLABS')
const DEFAULT_INPUT_PATH = path.join(CREOLABS_DIR, 'Prime Clients Ranking.xlsx')
const OUT_PATH = path.join(ROOT_DIR, 'public', 'prime_clients_ranking_table.json')

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function writeFileAtomicWithRetry(
  filePath,
  content,
  { encoding = 'utf8', retries = 6, baseDelayMs = 80 } = {}
) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })

  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  let lastErr = null

  async function commitTmpToDest() {
    try {
      await fs.promises.rename(tmpPath, filePath)
      return
    } catch (e) {
      const code = String(e?.code || '')

      if (code === 'EXDEV') {
        await fs.promises.copyFile(tmpPath, filePath)
        await fs.promises.unlink(tmpPath)
        return
      }

      if (code === 'EPERM' || code === 'EACCES' || code === 'EEXIST') {
        try {
          await fs.promises.rm(filePath, { force: true })
        } catch {
          // ignore
        }

        try {
          await fs.promises.rename(tmpPath, filePath)
          return
        } catch (e2) {
          const code2 = String(e2?.code || '')
          if (code2 === 'EPERM' || code2 === 'EACCES') {
            await fs.promises.copyFile(tmpPath, filePath)
            await fs.promises.unlink(tmpPath)
            return
          }
          throw e2
        }
      }

      throw e
    }
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await fs.promises.writeFile(tmpPath, content, { encoding })
      await commitTmpToDest()
      return
    } catch (e) {
      lastErr = e
      try {
        await fs.promises.unlink(tmpPath)
      } catch {
        // ignore
      }

      const code = String(e?.code || '')
      const transient = code === 'UNKNOWN' || code === 'EBUSY' || code === 'EPERM' || code === 'EACCES'
      if (!transient || attempt === retries) break
      const delay = baseDelayMs * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  throw lastErr
}

function asString(v) {
  if (v == null) return ''
  if (typeof v === 'object' && v.text != null) return String(v.text)
  return String(v)
}

function normalizeHeader(h) {
  const raw = String(h ?? '').trim().toLowerCase()
  if (!raw) return ''
  const withUnderscore = raw.replace(/\s+/g, '_')
  const stripped = withUnderscore.replace(/[^a-z0-9_]/g, '')
  const collapsed = stripped.replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return collapsed
}

function ensureUniqueHeaders(headers) {
  const seen = new Map()
  return headers.map((h) => {
    const base = normalizeHeader(h)
    if (!base) return ''
    const c = seen.get(base) || 0
    seen.set(base, c + 1)
    return c === 0 ? base : `${base}_${c + 1}`
  })
}

function cellToJsonValue(v) {
  if (v == null) return ''
  if (typeof v === 'object' && v.text != null) return String(v.text)
  if (typeof v === 'object' && v.formula != null) return v.result ?? ''
  if (typeof v === 'object' && v.hyperlink != null) return v.text ?? ''
  if (v instanceof Date) return v.toISOString()
  return v
}

async function main() {
  const inputPath = DEFAULT_INPUT_PATH

  if (!fs.existsSync(inputPath)) {
    console.log(
      `SKIP Prime Clients Ranking generator (missing input): ${path.relative(ROOT_DIR, inputPath)}`
    )
    process.exit(0)
  }

  const rows = []
  let headers = null

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(inputPath, {
    entries: 'emit',
    sharedStrings: 'cache',
    styles: 'cache',
    worksheets: 'emit',
  })

  let sheetCount = 0

  for await (const worksheetReader of workbook) {
    sheetCount += 1
    if (sheetCount > 1) break

    for await (const row of worksheetReader) {
      const values = Array.isArray(row.values) ? row.values.slice(1) : []

      if (!headers) {
        const rawHeaders = values.map((v) => asString(v).trim())
        headers = ensureUniqueHeaders(rawHeaders)
        continue
      }

      let hasAny = false
      for (const v of values) {
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          hasAny = true
          break
        }
      }
      if (!hasAny) continue

      const compactRow = []
      for (let i = 0; i < headers.length; i += 1) {
        compactRow.push(cellToJsonValue(values[i]))
      }
      rows.push(compactRow)
    }
  }

  const out = {
    format: 'header-array-rows-v1',
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT_DIR, inputPath).replace(/\\/g, '/'),
    sheetIndex: 0,
    rowCount: rows.length,
    headers: headers || [],
    rows,
  }

  await writeFileAtomicWithRetry(OUT_PATH, JSON.stringify(out))

  console.log(`OK wrote ${path.relative(ROOT_DIR, OUT_PATH).replace(/\\/g, '/')} rows=${rows.length}`)
}

main().catch((e) => {
  console.error('ERR generate_prime_clients_ranking_table failed')
  console.error(e)
  process.exit(1)
})