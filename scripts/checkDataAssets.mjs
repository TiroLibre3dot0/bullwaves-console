import { execSync } from 'node:child_process'

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()
}

function splitLines(text) {
  return text ? text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : []
}

function unique(list) {
  return [...new Set(list)]
}

const csvGlobs = ['public/*.csv']

let modifiedCsv = []
let untrackedCsv = []

try {
  modifiedCsv = splitLines(run(`git diff --name-only HEAD -- ${csvGlobs.join(' ')}`))
  untrackedCsv = splitLines(run(`git ls-files --others --exclude-standard -- ${csvGlobs.join(' ')}`))
} catch (err) {
  // If we're not in a git repo (or git isn't available), don't block.
  process.exit(0)
}

const offenders = unique([...modifiedCsv, ...untrackedCsv])

if (offenders.length === 0) {
  process.exit(0)
}

console.error('\n[DATA CHECK] Public CSVs changed but not committed.')
console.error('These files must be committed so deploy matches local data:\n')
for (const filePath of offenders) console.error(`- ${filePath}`)
console.error(
  '\nFix: git add public/*.csv && git commit -m "Data: update public CSV reports"\n'
)
process.exit(1)
