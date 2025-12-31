const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return Papa.parse(raw, { header: true, skipEmptyLines: true }).data
}

function toLowerKeys(obj) {
  const out = {}
  for (const k of Object.keys(obj)) out[k.toLowerCase()] = obj[k]
  return out
}

const base = path.join(__dirname, '..')
const regsFile = path.join(base, 'public', 'Registrations Report.csv')
const paymentsFile = path.join(base, 'public', 'Payments Report.csv')
const mediaFile = path.join(base, 'public', 'Media Report.csv')

if (!fs.existsSync(regsFile)) { console.error('Registrations file missing:', regsFile); process.exit(2) }
const regs = readCsv(regsFile).map(r => toLowerKeys(r))
const payments = fs.existsSync(paymentsFile) ? readCsv(paymentsFile).map(r => toLowerKeys(r)) : []
const media = fs.existsSync(mediaFile) ? readCsv(mediaFile).map(r => toLowerKeys(r)) : []

// Build maps
const paymentsByAccount = {}
for (const p of payments) {
  const acc = (p.mt5_account || p.account || '').toString().trim()
  if (!acc) continue
  paymentsByAccount[acc] = p
}

const mediaByAccount = {}
for (const m of media) {
  const acc = (m.mt5_account || m.account || '').toString().trim()
  if (!acc) continue
  mediaByAccount[acc] = m
}

// Group by user_id
const users = new Map()
for (const r of regs) {
  const user = (r.user_id || r.userid || '').toString().trim()
  const acc = (r.mt5_account || r.account || '').toString().trim()
  if (!user) continue
  if (!users.has(user)) users.set(user, { user_id: user, accounts: [] })
  users.get(user).accounts.push({ reg: r, account: acc })
}

// Analyze
let totalAccounts = 0
let usersWithMultiple = 0
let usersWithFTD = 0
let usersWithQFTD = 0
const sampleMulti = []
const userFlags = new Map()

for (const [userId, u] of users) {
  totalAccounts += u.accounts.length
  if (u.accounts.length > 1) {
    usersWithMultiple++
    if (sampleMulti.length < 20) sampleMulti.push(u)
  }
  // detect FTD/QFTD: check payments first, then registration fields
  let hasFTD = false
  let hasQFTD = false
  for (const a of u.accounts) {
    const acc = a.account
    const pay = paymentsByAccount[acc]
    if (pay) {
      const amt = parseFloat((pay.payment_amount || pay.first_deposit || '').toString().replace(/[, ]+/g, '')) || 0
      if (amt > 0) hasFTD = true
    }
    const m = mediaByAccount[acc]
    if (m) {
      if ((m.ftd || m.first_deposit || '').toString().trim()) hasFTD = true
      if ((m.qftd || m.qualification || '').toString().trim()) hasQFTD = true
    }
    // registrations fields fallback
    const r = a.reg
    if (!hasFTD) {
      const fd = (r.first_deposit || r.first_deposit_amount || '').toString().replace(/[, ]+/g, '')
      if (parseFloat(fd) > 0) hasFTD = true
      if ((r.external_ftd_date || r.first_deposit_date || '').toString().trim()) hasFTD = true
    }
    if (!hasQFTD) {
      if ((r.qualification_date || '').toString().toLowerCase().includes('qual')) hasQFTD = true
    }
  }
  if (hasFTD) usersWithFTD++
  if (hasQFTD) usersWithQFTD++
  userFlags.set(userId, { hasFTD, hasQFTD })
}

const summary = {
  total_users: users.size,
  total_accounts: totalAccounts,
  users_with_multiple_accounts: usersWithMultiple,
  users_with_ftd: usersWithFTD,
  users_with_qftd: usersWithQFTD
}

const outPath = path.join(base, 'public', 'fraud_monitor_summary.json')
fs.writeFileSync(outPath, JSON.stringify({ summary, sample_multi_users: sampleMulti.map(u => ({ user_id: u.user_id, accounts: u.accounts.map(a => a.account) })) }, null, 2))
console.log('Wrote summary to', outPath)
console.log(JSON.stringify(summary, null, 2))

// Export per-user flags to CSV to facilitate analysis
const userRows = []
for (const [userId, u] of users) {
  const flags = userFlags.get(userId) || { hasFTD: false, hasQFTD: false }
  const accounts = u.accounts.map(a => a.account || '').filter(Boolean)
  userRows.push({ user_id: userId, accounts_count: u.accounts.length, accounts: accounts.join('|'), has_ftd: flags.hasFTD ? '1' : '0', has_qftd: flags.hasQFTD ? '1' : '0' })
}
const usersCsv = Papa.unparse(userRows)
const usersCsvPath = path.join(base, 'public', 'fraud_monitor_user_flags.csv')
fs.writeFileSync(usersCsvPath, usersCsv)
console.log('Wrote per-user CSV to', usersCsvPath)

// Export name+country groups (one row per group)
// (groups CSV and dashboard will be generated after name+country grouping below)

// Group by normalized customer_name + country to find users sharing same name+country
function normName(s) {
  if (!s) return ''
  return s.toString().toLowerCase().replace(/\s+/g, ' ').trim()
}

const nameCountryMap = new Map()
for (const r of regs) {
  const name = normName(r.customer_name || r.customer || r.name || '')
  const country = (r.country || '').toString().toLowerCase().trim()
  if (!name) continue
  const key = `${name}||${country}`
  if (!nameCountryMap.has(key)) nameCountryMap.set(key, [])
  nameCountryMap.get(key).push({ user_id: r.user_id || r.userid || '', mt5_account: r.mt5_account || r.account || '' })
}

const multiNameGroups = []
for (const [k, arr] of nameCountryMap) {
  if (arr.length > 1) {
    const [name, country] = k.split('||')
    // enhance members with FTD/QFTD flags from userFlags
    const members = arr.map(m => {
      const flags = userFlags.get(m.user_id) || { hasFTD: false, hasQFTD: false }
      return { user_id: m.user_id, mt5_account: m.mt5_account, has_ftd: !!flags.hasFTD, has_qftd: !!flags.hasQFTD }
    })
    const groupHasFTD = members.some(x => x.has_ftd)
    const groupHasQFTD = members.some(x => x.has_qftd)
    multiNameGroups.push({ name, country, count: arr.length, has_ftd: groupHasFTD, has_qftd: groupHasQFTD, members })
  }
}

const groupsOut = path.join(base, 'public', 'fraud_monitor_name_groups.json')
fs.writeFileSync(groupsOut, JSON.stringify({ total_name_country_groups: nameCountryMap.size, multi_groups: multiNameGroups.length, groups: multiNameGroups }, null, 2))
console.log('Wrote name+country groups to', groupsOut)
console.log('Multi name+country groups found:', multiNameGroups.length)

// Now write groups CSV and the dashboard HTML (after groups have been built)
const groupRows = multiNameGroups.map(g => ({ name: g.name, country: g.country, count: g.count, members_user_ids: g.members.map(m => m.user_id).join('|'), members_accounts: g.members.map(m => m.mt5_account).join('|') }))
const groupsCsv = Papa.unparse(groupRows)
const groupsCsvPath = path.join(base, 'public', 'fraud_monitor_name_groups.csv')
fs.writeFileSync(groupsCsvPath, groupsCsv)
console.log('Wrote name+country groups CSV to', groupsCsvPath)

// Simple HTML dashboard for quick viewing
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Fraud Monitor Dashboard</title></head><body>
<h1>Fraud Monitor Summary</h1>
<div id="summary"></div>
<h2>Top multi name+country groups (first 50)</h2>
<table id="groups" border="1" cellpadding="4"></table>
<p><a href="/fraud_monitor_user_flags.csv">Download per-user CSV</a> | <a href="/fraud_monitor_name_groups.csv">Download groups CSV</a></p>
<script>
async function load(){
  const s = await fetch('/fraud_monitor_summary.json').then(r=>r.json())
  document.getElementById('summary').innerText = JSON.stringify(s.summary, null, 2)
  const g = await fetch('/fraud_monitor_name_groups.json').then(r=>r.json())
  const tbl = document.getElementById('groups')
  tbl.innerHTML = '<tr><th>Name</th><th>Country</th><th>Count</th><th>Members</th></tr>'
  (g.groups||[]).slice(0,50).forEach(gr=>{
    const tr = document.createElement('tr')
    tr.innerHTML = '<td>'+gr.name+'</td><td>'+gr.country+'</td><td>'+gr.count+'</td><td>'+ (gr.members.map(function(m){ return (m.user_id||'')+'('+ (m.mt5_account||'') +')' }).join(', ')) +'</td>'
    tbl.appendChild(tr)
  })
}
load().catch(e=>{document.getElementById('summary').innerText = 'Error loading data: '+e})
</script>
</body></html>`
fs.writeFileSync(path.join(base, 'public', 'fraud_dashboard.html'), html)
console.log('Wrote simple dashboard to public/fraud_dashboard.html')
