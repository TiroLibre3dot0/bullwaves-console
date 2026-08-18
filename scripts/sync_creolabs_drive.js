/*
Sync CREOLABS CSV exports from a Google Drive folder.

Default source:
  https://drive.google.com/drive/folders/1RB_C-oZQuBtdxL5zY25vZcn6shlnYKDE

The CRM console already expects these local filenames:
  CREOLABS/Traders Ranking Rewards.csv
  CREOLABS/CreoLabs Breakdown.csv
  CREOLABS/Prime Ranking.csv

This script intentionally supports a public Drive folder with no credentials.
If the folder becomes private, replace listPublicFolder() with authenticated
Drive API access or add a small auth branch using the existing googleapis dep.
*/

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const CREOLABS_DIR = path.join(ROOT, 'CREOLABS')
const DEFAULT_FOLDER_ID = '1RB_C-oZQuBtdxL5zY25vZcn6shlnYKDE'
const DOWNLOAD_IDLE_TIMEOUT_MS = 60_000
const DOWNLOAD_PROGRESS_STEP_BYTES = 10 * 1024 * 1024

const FILE_TARGETS = [
  {
    label: 'Traders Ranking Rewards',
    match: /traders\s+ranking\s+rewards/i,
    target: 'Traders Ranking Rewards.csv',
  },
  {
    label: 'CreoLabs Breakdown',
    match: /creolabs\s+breakdown/i,
    target: 'CreoLabs Breakdown.csv',
  },
  {
    label: 'Prime Ranking',
    match: /prime\s+ranking/i,
    target: 'Prime Ranking.csv',
  },
]

function argValue(name, fallback = '') {
  const prefix = `${name}=`
  const found = process.argv.find((arg) => arg === name || arg.startsWith(prefix))
  if (!found) return fallback
  if (found === name) return '1'
  return found.slice(prefix.length)
}

function normalizeHtmlText(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function stripOprPrefix(name) {
  return String(name || '').replace(/^\s*\[OPR\]\s*\d+\s*-\s*/i, '').trim()
}

async function fetchText(url) {
  const resp = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Bullwaves-Creolabs-Drive-Sync/1.0',
    },
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} while reading ${url}`)
  return resp.text()
}

async function listPublicFolder(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#list`
  const html = await fetchText(url)
  const files = []
  const re =
    /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>[\s\S]*?<div class="flip-entry-last-modified"><div>([^<]*)/g

  let match = null
  while ((match = re.exec(html))) {
    files.push({
      id: match[1],
      name: normalizeHtmlText(match[2]),
      canonicalName: stripOprPrefix(normalizeHtmlText(match[2])),
      modifiedLabel: normalizeHtmlText(match[3]),
    })
  }

  if (!files.length) {
    throw new Error('No files found in public Google Drive folder. Check folder sharing/access.')
  }

  return files
}

function selectLatestByTarget(files) {
  return FILE_TARGETS.map((target) => {
    const matches = files.filter((file) => target.match.test(file.canonicalName || file.name))
    if (!matches.length) return { ...target, file: null }

    // The embedded Drive listing is ordered newest first for duplicate names.
    return { ...target, file: matches[0], duplicates: matches.slice(1) }
  })
}

function parseCookie(setCookieHeaders) {
  if (!setCookieHeaders) return ''
  const raw = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders]
  return raw
    .map((entry) => String(entry).split(';')[0])
    .filter(Boolean)
    .join('; ')
}

async function resolveDownloadResponse(fileId) {
  const base = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
  const first = await fetch(base, { redirect: 'follow' })
  const contentType = String(first.headers.get('content-type') || '').toLowerCase()

  if (!contentType.includes('text/html')) return first

  const html = await first.text()
  const cookie = parseCookie(first.headers.get('set-cookie'))
  const confirmMatch =
    html.match(/href="([^"]*uc\?export=download[^"]*confirm=[^"]+)"/) ||
    html.match(/confirm=([0-9A-Za-z_-]+)&amp;id=/)

  if (!confirmMatch) {
    throw new Error(`Google Drive returned an HTML page instead of file content for ${fileId}`)
  }

  const href = confirmMatch[1].startsWith('http')
    ? confirmMatch[1]
    : confirmMatch[1].startsWith('/')
      ? `https://drive.google.com${confirmMatch[1]}`
      : `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${encodeURIComponent(fileId)}`

  return fetch(href.replace(/&amp;/g, '&'), {
    redirect: 'follow',
    headers: cookie ? { cookie } : undefined,
  })
}

async function downloadFile(file, targetPath) {
  const resp = await resolveDownloadResponse(file.id)
  if (!resp.ok) throw new Error(`HTTP ${resp.status} while downloading ${file.name}`)
  if (!resp.body) throw new Error(`Empty response body while downloading ${file.name}`)

  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  const tmpPath = `${targetPath}.tmp-${process.pid}`
  const stream = fs.createWriteStream(tmpPath)
  stream.setMaxListeners(0)
  const reader = resp.body.getReader()
  const total = Number(resp.headers.get('content-length') || 0)
  let received = 0
  let nextProgress = DOWNLOAD_PROGRESS_STEP_BYTES
  let idleTimer = null

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      reader.cancel().catch(() => {})
      stream.destroy(new Error(`Download stalled for ${Math.round(DOWNLOAD_IDLE_TIMEOUT_MS / 1000)}s`))
    }, DOWNLOAD_IDLE_TIMEOUT_MS)
  }

  try {
    resetIdleTimer()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      resetIdleTimer()
      received += value.length

      if (!stream.write(Buffer.from(value))) {
        await new Promise((resolve, reject) => {
          stream.once('drain', resolve)
          stream.once('error', reject)
        })
      }

      if (received >= nextProgress) {
        const pct = total ? ` / ${Math.round((received / total) * 100)}%` : ''
        console.log(`[creolabs-drive] downloading ${file.name}: ${received.toLocaleString('en-US')} bytes${pct}`)
        nextProgress += DOWNLOAD_PROGRESS_STEP_BYTES
      }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer)
  }

  await new Promise((resolve, reject) => {
    stream.end((err) => (err ? reject(err) : resolve()))
    stream.once('error', reject)
  })

  const size = fs.statSync(tmpPath).size
  if (size <= 0) throw new Error(`Downloaded empty file for ${file.name}`)
  fs.renameSync(tmpPath, targetPath)
  return size
}

function runVerifyData() {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'verify_and_update_data.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    const reason = result.error?.message || result.signal || result.status
    throw new Error(`verify:data failed with exit code ${reason}`)
  }
}

async function main() {
  const folderId = argValue('--folder-id', process.env.CREOLABS_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID)
  const dryRun = process.argv.includes('--dry-run')
  const verify = process.argv.includes('--verify')

  console.log(`[creolabs-drive] Reading folder ${folderId}`)
  const files = await listPublicFolder(folderId)
  const selected = selectLatestByTarget(files)
  const missing = selected.filter((entry) => !entry.file)

  console.log(
    `[creolabs-drive] Found ${files.length} file entries; selected ${selected.length - missing.length}/${FILE_TARGETS.length}`
  )

  for (const entry of selected) {
    if (!entry.file) {
      console.log(`[creolabs-drive] MISSING ${entry.label} -> ${entry.target}`)
      continue
    }

    const targetPath = path.join(CREOLABS_DIR, entry.target)
    const dupeText = entry.duplicates?.length ? ` (+${entry.duplicates.length} older duplicate)` : ''
    console.log(
      `[creolabs-drive] ${entry.file.name} [${entry.file.modifiedLabel || 'n/a'}] -> ${path.relative(ROOT, targetPath)}${dupeText}`
    )

    if (!dryRun) {
      const size = await downloadFile(entry.file, targetPath)
      console.log(`[creolabs-drive] saved ${entry.target} (${size.toLocaleString('en-US')} bytes)`)
    }
  }

  if (missing.length) {
    throw new Error(`Missing required Creolabs exports: ${missing.map((entry) => entry.label).join(', ')}`)
  }

  if (verify && !dryRun) {
    runVerifyData()
  }

  console.log(`[creolabs-drive] ${dryRun ? 'dry-run complete' : 'sync complete'}`)
}

main().catch((err) => {
  console.error(`[creolabs-drive] ${err?.message || String(err)}`)
  process.exit(1)
})
