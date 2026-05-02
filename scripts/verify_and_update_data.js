/*
Verify + auto-update generated data artifacts for the Bullwaves console.

Goal:
- Ensure the UI never reads stale JSON artifacts after CSV/XLSX uploads.
- If something is missing/stale/mismatching, automatically regenerate and re-verify.

This script is intentionally resilient:
- It should NOT crash on the first problem.
- It attempts to fix issues by running generators.

Exit codes:
  0 = OK (or skipped due to missing optional sources)
  2 = still stale/mismatching after auto-update attempt
  1 = unexpected internal error in this script
*/

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const CREOLABS_DIR = path.join(ROOT, 'CREOLABS')
const ORG_DATA = path.join(ROOT, 'src', 'pages', 'orgChartData.js')

const TRADERS_REWARDS_XLSX = path.join(CREOLABS_DIR, 'Traders Ranking Rewards.xlsx')
const PRIME_CLIENTS_RANKING_XLSX = path.join(CREOLABS_DIR, 'Prime Clients Ranking.xlsx')

function listCreolabsSources() {
  return safeStat(TRADERS_REWARDS_XLSX).exists ? [TRADERS_REWARDS_XLSX] : []
}

function parseArgs(argv) {
  const out = { verbose: false }
  for (const raw of argv || []) {
    const s = String(raw || '').trim()
    if (!s) continue
    if (s === '--verbose' || s === '-v') out.verbose = true
  }
  return out
}

function safeStat(p) {
  try {
    const st = fs.statSync(p)
    return { exists: true, mtimeMs: st.mtimeMs || 0, size: st.size || 0 }
  } catch {
    return { exists: false, mtimeMs: 0, size: 0 }
  }
}

function listFilesRecursive(dir) {
  const out = []
  let items = []
  try {
    items = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const ent of items) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...listFilesRecursive(p))
    else if (ent.isFile()) out.push(p)
  }
  return out
}

function maxMtime(paths) {
  let m = 0
  for (const p of paths || []) {
    const st = safeStat(p)
    if (st.exists && st.mtimeMs > m) m = st.mtimeMs
  }
  return m
}

function fmtRel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/')
}

function logVerbose(opts, ...args) {
  if (opts.verbose) console.log(...args)
}

function runNodeScript(scriptRelPath, args = [], { label } = {}) {
  const scriptPath = path.join(__dirname, scriptRelPath)
  const nice = label || path.basename(scriptRelPath)
  console.log(`\n==> ${nice}`)
  const res = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    windowsHide: true,
  })
  const code = typeof res.status === 'number' ? res.status : 1
  if (code !== 0) console.warn(`WARN ${nice} exited with code ${code}`)
  return code
}

function shouldUpdateArtifact(artifactPath, sourcePaths, opts) {
  const art = safeStat(artifactPath)
  if (!art.exists) return { needs: true, reason: 'missing' }
  const newestSrc = maxMtime(sourcePaths)
  if (!newestSrc) return { needs: false, reason: 'no-sources' }

  // Small grace window for FS timestamp rounding.
  if (art.mtimeMs + 500 < newestSrc) {
    logVerbose(opts, `STALE ${fmtRel(artifactPath)}: artifact older than sources`)
    return { needs: true, reason: 'stale' }
  }
  return { needs: false, reason: 'fresh' }
}

function main() {
  const opts = parseArgs(process.argv.slice(2))

  const problems = []
  const notes = []
  let updateAttempted = false

  // Sources (optional ones are handled gracefully).
  const sourceRegistrations = path.join(PUBLIC, 'Registrations Report.csv')
  const sourcePayments = path.join(PUBLIC, 'Payments Report.csv')
  const sourceMedia = path.join(PUBLIC, 'Media Report.csv')
  const sourceKpi = path.join(PUBLIC, 'KPI Report.csv')
  const sourceFraud = path.join(PUBLIC, 'Fraud Report.csv')
  const sourceChargebacks = path.join(PUBLIC, 'Chargebacks Report.csv')
  const sourceComments = path.join(PUBLIC, 'comments.csv')
  const sourceTrustpilot = path.join(ROOT, 'Trustpilot', 'TrustPilot Review Tracker.csv')
  const trustpilotRemoteSourceUrl = String(process.env.TRUSTPILOT_SOURCE_URL || '').trim()
  const hasTrustpilotSource = safeStat(sourceTrustpilot).exists || Boolean(trustpilotRemoteSourceUrl)
  const sourceCreolabs = listCreolabsSources()

  const allTopLevelPublicFiles = fs.existsSync(PUBLIC) ? fs.readdirSync(PUBLIC).map((n) => path.join(PUBLIC, n)) : []
  const publicCsvFiles = allTopLevelPublicFiles.filter((p) => /\.csv$/i.test(p))

  const artifacts = {
    reportsMeta: path.join(PUBLIC, 'reports_meta.json'),
    affiliateIndex: path.join(PUBLIC, 'affiliate_index.json'),
    supportUsersIndex: path.join(PUBLIC, 'support_users_index.json'),
    trustpilotGuidance: path.join(PUBLIC, 'trustpilot_guidance.json'),
    fraudPatternsIndex: path.join(PUBLIC, 'fraud_patterns_index.json'),
    affiliateKpiIndex: path.join(PUBLIC, 'affiliate_kpi_index.json'),
    rankingsIndex: path.join(PUBLIC, 'rankings_index.json'),
    rankingsUsersTable: path.join(PUBLIC, 'rankings_users_table.json'),
    creolabsIndex: path.join(PUBLIC, 'creolabs_index.json'),
    creolabsClientsTable: path.join(PUBLIC, 'creolabs_clients_table.json'),
    creolabsAffiliateMonth: path.join(PUBLIC, 'creolabs_affiliate_month.json'),
    cellxAffiliateMonth: path.join(PUBLIC, 'cellx_affiliate_month.json'),
    tradersRankingRewardsTable: path.join(PUBLIC, 'traders_ranking_rewards_table.json'),
    primeClientsRankingTable: path.join(PUBLIC, 'prime_clients_ranking_table.json'),
    primeContestEmbed: path.join(PUBLIC, 'embed', 'prime-contest.json'),
    shareOrgPeople: path.join(PUBLIC, 'share', 'org-chart-people.json'),
    fraudSummary: path.join(PUBLIC, 'fraud_monitor_summary.json'),
    fraudUserFlagsCsv: path.join(PUBLIC, 'fraud_monitor_user_flags.csv'),
    fraudNameGroupsJson: path.join(PUBLIC, 'fraud_monitor_name_groups.json'),
    fraudNameGroupsCsv: path.join(PUBLIC, 'fraud_monitor_name_groups.csv'),
    fraudDashboardHtml: path.join(PUBLIC, 'fraud_dashboard.html'),
  }

  // 1) Decide whether we need regeneration.
  let needsUpdate = false

  // Global signal: reports_meta should be >= any public CSV/JSON artifact.
  // If a CSV changes after meta generation, the frontend cache-busting won't trigger reliably.
  const publicDataFiles = listFilesRecursive(PUBLIC).filter((p) => {
    const base = path.basename(p).toLowerCase()
    if (base === 'reports_meta.json') return false
    return base.endsWith('.csv') || base.endsWith('.json')
  })

  const newestPublicData = maxMtime(publicDataFiles)
  const metaStat = safeStat(artifacts.reportsMeta)
  if (!metaStat.exists) {
    needsUpdate = true
    problems.push(`Missing ${fmtRel(artifacts.reportsMeta)}`)
  } else if (metaStat.mtimeMs + 500 < newestPublicData) {
    needsUpdate = true
    problems.push('reports_meta.json is older than at least one public data file')
  }

  // Targeted checks (missing/stale vs their primary sources).
  const checks = [
    { artifact: artifacts.affiliateIndex, sources: [sourcePayments], name: 'affiliate_index.json' },
    { artifact: artifacts.supportUsersIndex, sources: [sourceRegistrations], name: 'support_users_index.json' },
    {
      artifact: artifacts.trustpilotGuidance,
      sources: [sourceTrustpilot, sourceRegistrations],
      name: 'trustpilot_guidance.json',
      optional: true,
    },
    { artifact: artifacts.affiliateKpiIndex, sources: [sourcePayments, sourceKpi], name: 'affiliate_kpi_index.json' },
    { artifact: artifacts.fraudPatternsIndex, sources: [sourceFraud, sourceChargebacks], name: 'fraud_patterns_index.json' },
    { artifact: artifacts.rankingsIndex, sources: [sourceRegistrations], name: 'rankings_index.json' },
    { artifact: artifacts.rankingsUsersTable, sources: [sourceRegistrations], name: 'rankings_users_table.json' },
    {
      artifact: artifacts.creolabsIndex,
      sources: sourceCreolabs,
      name: 'creolabs_index.json',
      optional: true,
    },
    {
      artifact: artifacts.creolabsClientsTable,
      sources: sourceCreolabs,
      name: 'creolabs_clients_table.json',
      optional: true,
    },
    {
      artifact: artifacts.creolabsAffiliateMonth,
      sources: sourceCreolabs,
      name: 'creolabs_affiliate_month.json',
      optional: true,
    },
    { artifact: artifacts.cellxAffiliateMonth, sources: [sourceMedia], name: 'cellx_affiliate_month.json' },
    { artifact: artifacts.shareOrgPeople, sources: [ORG_DATA], name: 'share/org-chart-people.json' },
    {
      artifact: artifacts.tradersRankingRewardsTable,
      sources: [TRADERS_REWARDS_XLSX],
      name: 'traders_ranking_rewards_table.json',
      optional: true,
    },
    {
      artifact: artifacts.primeClientsRankingTable,
      sources: [PRIME_CLIENTS_RANKING_XLSX],
      name: 'prime_clients_ranking_table.json',
      optional: true,
    },
    {
      artifact: artifacts.primeContestEmbed,
      sources: [PRIME_CLIENTS_RANKING_XLSX],
      name: 'embed/prime-contest.json',
      optional: true,
    },
    {
      artifact: artifacts.fraudSummary,
      sources: [sourceRegistrations, sourcePayments, sourceMedia].filter((p) => safeStat(p).exists),
      name: 'fraud_monitor_summary.json',
      optional: true,
    },
  ]

  for (const c of checks) {
    const sourcesExisting = (c.sources || []).filter((p) => safeStat(p).exists)
    if (!sourcesExisting.length) {
      if (c.optional) {
        notes.push(`SKIP ${c.name} (missing optional sources)`)
        continue
      }
      // If required sources are missing, we can't verify freshness; treat as a note.
      notes.push(`SKIP ${c.name} (missing sources)`)
      continue
    }

    const res = shouldUpdateArtifact(c.artifact, sourcesExisting, opts)
    if (res.needs) {
      needsUpdate = true
      problems.push(`${c.name} is ${res.reason}`)
    }
  }

  // Consistency check for the Investments artifacts (Media CSV <-> CellX JSON).
  const mediaExists = safeStat(sourceMedia).exists
  if (mediaExists) {
    const investmentsCode = runNodeScript('verify_investments_artifacts.js', [], { label: 'Verify Investments artifacts' })
    if (investmentsCode !== 0) {
      needsUpdate = true
      problems.push('Investments artifacts mismatch/stale (see output above)')
    }
  } else {
    notes.push('SKIP Investments verifier (missing Media Report.csv)')
  }

  // 2) Attempt auto-update if needed.
  if (needsUpdate) {
    updateAttempted = true
    console.log('\nDetected stale/missing artifacts. Regenerating...')

    // Run generators individually (resilient mode: do not abort on one failure).
    const genScripts = [
      { p: 'generate_affiliate_index.js', label: 'Generate affiliate index' },
      { p: 'generate_support_users_index.js', label: 'Generate support users index' },
      { p: 'generate_fraud_patterns_index.js', label: 'Generate fraud patterns index' },
      { p: 'generate_affiliate_kpi_index.js', label: 'Generate affiliate KPI index' },
      { p: 'generate_rankings_index.js', label: 'Generate rankings index' },
      { p: 'generate_creolabs_index.js', label: 'Generate Creolabs artifacts' },
      { p: 'generate_traders_ranking_rewards_table.js', label: 'Generate Traders Ranking Rewards artifact' },
      { p: 'generate_prime_clients_ranking_table.js', label: 'Generate Prime Clients Ranking artifact' },
      { p: 'generate_prime_contest_embed.js', label: 'Generate Prime Contest embed feed' },
      { p: 'generate_cellx_affiliate_month.js', label: 'Generate CellX monthly artifact' },
      { p: 'generate_share_org_people_index.mjs', label: 'Generate share org people index' },
      { p: 'generate_reports_meta.js', label: 'Generate reports meta (pre-fraud-monitor)' },
    ]

    if (hasTrustpilotSource) {
      genScripts.splice(2, 0, {
        p: 'generate_trustpilot_guidance.js',
        label: 'Generate trustpilot guidance',
      })
    } else {
      notes.push('SKIP generate_trustpilot_guidance.js (missing local CSV and TRUSTPILOT_SOURCE_URL)')
    }

    const generatorFailures = []
    for (const g of genScripts) {
      const code = runNodeScript(g.p, [], { label: g.label })
      if (code !== 0) generatorFailures.push({ script: g.p, code })
    }

    // Fraud monitor is optional but nice to keep updated.
    if (safeStat(sourceRegistrations).exists) {
      const fmCode = runNodeScript('fraud_monitor.js', [], { label: 'Run fraud monitor (optional)' })
      if (fmCode !== 0) generatorFailures.push({ script: 'fraud_monitor.js', code: fmCode })
      // Meta LAST again so cache-busting reflects fraud-monitor outputs too.
      runNodeScript('generate_reports_meta.js', [], { label: 'Generate reports meta (final)' })
    } else {
      notes.push('SKIP fraud_monitor.js (missing Registrations Report.csv)')
    }

    if (generatorFailures.length) {
      console.warn('\nSome generators failed (continuing to re-verify):')
      for (const f of generatorFailures) console.warn(` - ${f.script} (code ${f.code})`)
    }
  } else {
    console.log('\nAll artifacts look fresh. No regeneration needed.')
  }

  // 3) Re-verify after update attempt.
  const finalProblems = []

  // Check meta freshness again.
  const publicDataFiles2 = listFilesRecursive(PUBLIC).filter((p) => {
    const base = path.basename(p).toLowerCase()
    if (base === 'reports_meta.json') return false
    return base.endsWith('.csv') || base.endsWith('.json')
  })
  const newestPublicData2 = maxMtime(publicDataFiles2)
  const metaStat2 = safeStat(artifacts.reportsMeta)
  if (!metaStat2.exists) {
    finalProblems.push(`Missing ${fmtRel(artifacts.reportsMeta)}`)
  } else if (metaStat2.mtimeMs + 500 < newestPublicData2) {
    finalProblems.push('reports_meta.json is still older than at least one public data file')
  }

  // Re-run investments verifier only if we regenerated something.
  // (Initial run already validated in the no-op path.)
  if (updateAttempted && mediaExists) {
    const investmentsCode2 = runNodeScript('verify_investments_artifacts.js', [], { label: 'Re-verify Investments artifacts' })
    if (investmentsCode2 !== 0) finalProblems.push('Investments artifacts still mismatch/stale')
  }

  // Basic existence checks for core artifacts when their main sources exist.
  const requiredWhenSourcePresent = [
    { source: sourcePayments, artifact: artifacts.affiliateIndex },
    { source: sourceRegistrations, artifact: artifacts.supportUsersIndex },
    { source: sourceRegistrations, artifact: artifacts.rankingsIndex },
    { source: sourceMedia, artifact: artifacts.cellxAffiliateMonth },
  ]
  for (const r of requiredWhenSourcePresent) {
    if (!safeStat(r.source).exists) continue
    if (!safeStat(r.artifact).exists) finalProblems.push(`Missing ${fmtRel(r.artifact)} (source present)`)
  }

  if (notes.length) {
    console.log(`\nNotes${opts.verbose ? ' (verbose)' : ''}:`)
    for (const n of notes) console.log(' -', n)
  }

  if (!finalProblems.length) {
    console.log(`\nOK Data artifacts are consistent${updateAttempted ? ' (auto-updated)' : ''}.`)
    process.exit(0)
  }

  console.error('\nERR Data artifacts are still inconsistent after auto-update attempt:')
  for (const p of finalProblems) console.error(' -', p)
  process.exit(2)
}

try {
  main()
} catch (e) {
  console.error('ERR verify_and_update_data failed unexpectedly')
  console.error(e)
  process.exit(1)
}
