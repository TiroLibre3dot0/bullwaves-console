import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Read API key from .env.sendgrid.local
const envLines = readFileSync(join(ROOT, '.env.sendgrid.local'), 'utf8').split('\n')
const keyLine = envLines.find((l) => l.startsWith('SENDGRID_API_KEY='))
const API_KEY = keyLine ? keyLine.replace('SENDGRID_API_KEY=', '').trim() : ''

if (!API_KEY) {
  console.error('SENDGRID_API_KEY not found in .env.sendgrid.local')
  process.exit(1)
}

// Query all recent messages — no On-Behalf-Of, main account
const FROM = 'support@bullwaves.com'
const CAMPAIGN_SUBJECT = 'A June exclusive, 20% of your losses credited back.'
const url = `https://api.sendgrid.com/v3/messages?limit=1000&query=${encodeURIComponent(`from_email="${FROM}"`)}`

console.log('Querying SendGrid Activity API...')
console.log('Filter from:', FROM)
console.log()

const res = await fetch(url, {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
})

if (!res.ok) {
  const body = await res.text()
  console.error(`SendGrid API error ${res.status}:`, body)
  process.exit(1)
}

const data = await res.json()
const allMsgs = Array.isArray(data.messages) ? data.messages : []

console.log(`All messages from sender: ${allMsgs.length}`)

// Show date range
if (allMsgs.length > 0) {
  // Sort by date descending
  const sorted = [...allMsgs].sort((a, b) => new Date(b.last_event_time) - new Date(a.last_event_time))
  console.log(`Most recent:  ${sorted[0].last_event_time}  subject: "${sorted[0].subject}"`)
  console.log(`Oldest:       ${sorted[sorted.length - 1].last_event_time}  subject: "${sorted[sorted.length - 1].subject}"`)
}

// Show unique subjects to find the June campaign
const subjectCounts = {}
for (const m of allMsgs) {
  const s = m.subject || '(no subject)'
  subjectCounts[s] = (subjectCounts[s] || 0) + 1
}
const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])
console.log()
console.log('=== SUBJECTS FOUND ===')
for (const [subj, count] of sortedSubjects) {
  console.log(`  (${String(count).padStart(3)}) ${subj}`)
}
console.log()

// Filter to only the June campaign
const msgs = allMsgs.filter((m) => m.subject === CAMPAIGN_SUBJECT)
console.log(`June campaign messages ("${CAMPAIGN_SUBJECT}"): ${msgs.length}`)
console.log()

if (msgs.length > 0) {
  console.log('Sample message fields:', Object.keys(msgs[0]).join(', '))
  console.log('Sample id fields:', {
    msg_id: msgs[0].msg_id || null,
    message_id: msgs[0].message_id || null,
    sg_message_id: msgs[0].sg_message_id || null,
    status: msgs[0].status || null,
    last_event_time: msgs[0].last_event_time || null,
  })
  console.log()
}

// Group by status
const byStatus = {}
for (const m of msgs) {
  const s = m.status || 'unknown'
  if (!byStatus[s]) byStatus[s] = []
  byStatus[s].push(m)
}

// Engagement metrics are exposed as numeric counters, not as status values.
const deliveredCount = msgs.filter((m) => String(m.status || '').toLowerCase() === 'delivered').length
const notDeliveredCount = msgs.filter((m) => String(m.status || '').toLowerCase() === 'not_delivered').length
const totalOpens = msgs.reduce((sum, m) => sum + Number(m.opens_count || 0), 0)
const totalClicks = msgs.reduce((sum, m) => sum + Number(m.clicks_count || 0), 0)
const openedRecipients = msgs.filter((m) => Number(m.opens_count || 0) > 0).length
const clickedRecipients = msgs.filter((m) => Number(m.clicks_count || 0) > 0).length

console.log('=== STATUS BREAKDOWN ===')
const statusOrder = ['delivered', 'processed', 'opened', 'clicked', 'not_delivered', 'bounce', 'blocked', 'spam_report', 'deferred', 'pending', 'unknown']
const allStatuses = [...new Set([...statusOrder, ...Object.keys(byStatus)])]
for (const status of allStatuses) {
  if (byStatus[status]) {
    console.log(`  ${status.padEnd(20)} : ${byStatus[status].length}`)
  }
}
console.log()

console.log('=== ENGAGEMENT ===')
console.log(`  delivered recipients    : ${deliveredCount}`)
console.log(`  not_delivered recipients: ${notDeliveredCount}`)
console.log(`  recipients with opens   : ${openedRecipients}`)
console.log(`  recipients with clicks  : ${clickedRecipients}`)
console.log(`  total opens             : ${totalOpens}`)
console.log(`  total clicks            : ${totalClicks}`)
console.log()

// Show problematic ones
const problematic = msgs.filter((m) =>
  ['not_delivered', 'bounce', 'blocked', 'spam_report', 'deferred', 'pending'].includes(m.status)
)

if (problematic.length > 0) {
  console.log(`=== PROBLEMATIC (${problematic.length}) ===`)
  for (const m of problematic) {
    console.log(`  [${m.status}] ${m.to_email} — ${m.subject?.slice(0, 40) || ''}`)
  }
  console.log()
}

// Still pending / not confirmed delivered
const pendingOrUnknown = msgs.filter((m) => !['delivered', 'opened', 'clicked'].includes(m.status))
if (pendingOrUnknown.length > 0) {
  console.log(`=== NOT YET CONFIRMED DELIVERED (${pendingOrUnknown.length}) ===`)
  for (const m of pendingOrUnknown) {
    console.log(`  [${m.status}] ${m.to_email}`)
  }
} else {
  console.log('All messages confirmed delivered, opened or clicked.')
}
