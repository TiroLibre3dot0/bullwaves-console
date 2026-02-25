/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const root = path.resolve(__dirname, '..')

const num = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return 0
  const cleaned = s.replace(/[^0-9\.-]/g, '')
  const f = Number(cleaned)
  return Number.isFinite(f) ? f : 0
}

// Parses month labels like "1/2026" into a UTC timestamp (1st of month)
const parseMediaMonthTs = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const mmyyyy = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (mmyyyy) {
    const mo = Number(mmyyyy[1])
    const y = Number(mmyyyy[2])
    if (Number.isFinite(mo) && Number.isFinite(y) && mo >= 1 && mo <= 12) {
      return Date.UTC(y, mo - 1, 1)
    }
  }
  const parsed = Date.parse(s)
  return Number.isNaN(parsed) ? null : parsed
}

const parseRegTs = (row) => {
  const raw =
    row.registration_date ||
    row.registrationdate ||
    row.reg_date ||
    row.date ||
    row.created_at ||
    row.createdat ||
    row.external_date ||
    row.externaldate ||
    ''
  const s = String(raw ?? '').trim()
  if (!s) return null
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : t
}

const cleanId = (v) => {
  const s = String(v ?? '').trim()
  if (!s) return ''
  return s.replace(/^\"+|\"+$/g, '')
}

const usage = () => {
  console.error('Usage: node scripts/diagnose_registration_gap_month.js <year> <month(1-12)>')
}

const year = Number(process.argv[2])
const month = Number(process.argv[3])
if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
  usage()
  process.exit(1)
}

const mediaPath = path.join(root, 'public', 'Media Report.csv')
const regsPath = path.join(root, 'public', 'Registrations Report.csv')

let mediaRows = 0
let mediaRowsInMonth = 0
let mediaRegsSum = 0

Papa.parse(fs.createReadStream(mediaPath), {
  header: true,
  skipEmptyLines: true,
  step: (res) => {
    const r = res.data || {}
    mediaRows += 1

    const ts = parseMediaMonthTs(r.month || r.Month || r.date || r.Date || r.month_year || '')
    if (ts == null) return
    const d = new Date(ts)
    if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) return

    mediaRowsInMonth += 1
    mediaRegsSum += num(r.registrations)
  },
  complete: () => {
    let regRows = 0
    let regTsMissing = 0
    let regRowsInMonth = 0

    const uniqueIdsRaw = new Set()
    const uniqueIdsCleaned = new Set()

    Papa.parse(fs.createReadStream(regsPath), {
      header: true,
      skipEmptyLines: true,
      step: (res) => {
        const r = res.data || {}
        regRows += 1

        const t = parseRegTs(r)
        if (t == null) {
          regTsMissing += 1
          return
        }
        const d = new Date(t)
        if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) return

        regRowsInMonth += 1

        const rawId = r.user_id || r.userid || r.mt5_account || r.mt5account || ''
        const id = String(rawId ?? '').trim()
        if (id) uniqueIdsRaw.add(id)
        const cleaned = cleanId(id)
        if (cleaned) uniqueIdsCleaned.add(cleaned)
      },
      complete: () => {
        const out = {
          year,
          month,
          media: {
            rowsTotal: mediaRows,
            rowsInMonth: mediaRowsInMonth,
            registrationsSumInMonth: Math.round(mediaRegsSum),
          },
          registrations: {
            rowsTotal: regRows,
            tsMissing: regTsMissing,
            rowsInMonth: regRowsInMonth,
            uniqueIdsInMonthRaw: uniqueIdsRaw.size,
            uniqueIdsInMonthCleaned: uniqueIdsCleaned.size,
          },
          computed: {
            gap_mediaMinusUniqueCleanedInMonth: Math.round(mediaRegsSum - uniqueIdsCleaned.size),
          },
        }
        console.log(JSON.stringify(out, null, 2))
      },
    })
  },
})
