/*
Clean local build artifacts.

Why:
- `dist/` can become huge because Vite copies everything from `public/`.
- On Windows, some subfolders can remain locked; we retry deletes.

Usage:
  node scripts/clean_dist.js
  npm run clean:dist
*/

const fs = require('fs')
const path = require('path')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function rmWithRetries(targetPath, retries = 6) {
  if (!fs.existsSync(targetPath)) return { removed: false, path: targetPath }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true })
      return { removed: true, path: targetPath }
    } catch (err) {
      const code = err && err.code
      const retryable = code === 'ENOTEMPTY' || code === 'EPERM' || code === 'EBUSY'
      if (!retryable || attempt === retries) {
        throw err
      }
      await sleep(120 * attempt)
    }
  }

  return { removed: false, path: targetPath }
}

async function main() {
  const repoRoot = path.join(__dirname, '..')
  const targets = [path.join(repoRoot, 'dist'), path.join(repoRoot, 'dev-dist')]

  for (const p of targets) {
    const res = await rmWithRetries(p)
    if (res.removed) console.log('[clean:dist] removed', p)
    else console.log('[clean:dist] skip (not found)', p)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
