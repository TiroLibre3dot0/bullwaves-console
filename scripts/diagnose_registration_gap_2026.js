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

const mediaPath = path.join(root, 'public', 'Media Report.csv')
const regsPath = path.join(root, 'public', 'Registrations Report.csv')

const year = Number(process.argv[2] || 2026)
if (!Number.isFinite(year)) {
  console.error('Usage: node scripts/diagnose_registration_gap_2026.js <year>')
  process.exit(1)
}

let mediaRows = 0
let mediaRegsSum = 0
let mediaRowsWithTs = 0
let mediaRowsYear = 0

Papa.parse(fs.createReadStream(mediaPath), {
  header: true,
  skipEmptyLines: true,
  step: (res) => {
    const r = res.data || {}
    mediaRows += 1

    const ts = parseMediaMonthTs(r.month || r.Month || r.date || r.Date || r.month_year || '')
    if (ts != null) {
      mediaRowsWithTs += 1
      const y = new Date(ts).getUTCFullYear()
      if (y === year) {
        mediaRowsYear += 1
        mediaRegsSum += num(r.registrations)
      }
    }
  },
  complete: () => {
    let regRows = 0
    let regTsMissing = 0
    let regRowsYear = 0

    const uniqueIdsYearRaw = new Set()
    const uniqueIdsYearCleaned = new Set()

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
        const y = new Date(t).getUTCFullYear()
        if (y !== year) return
        regRowsYear += 1

        const rawId = r.user_id || r.userid || r.mt5_account || r.mt5account || ''
        const id = String(rawId ?? '').trim()
        if (id) uniqueIdsYearRaw.add(id)
        const cleaned = cleanId(id)
        if (cleaned) uniqueIdsYearCleaned.add(cleaned)
      },
      complete: () => {
        const out = {
          year,
          media: {
            rowsTotal: mediaRows,
            rowsWithMonthParsed: mediaRowsWithTs,
            rowsInYear: mediaRowsYear,
            registrationsSumInYear: Math.round(mediaRegsSum),
          },
          registrations: {
            rowsTotal: regRows,
            tsMissing: regTsMissing,
            rowsInYear: regRowsYear,
            uniqueIdsInYearRaw: uniqueIdsYearRaw.size,
            uniqueIdsInYearCleaned: uniqueIdsYearCleaned.size,
          },
          computed: {
            gap_mediaMinusUniqueCleanedInYear: Math.round(mediaRegsSum - uniqueIdsYearCleaned.size),
          },
        }
        console.log(JSON.stringify(out, null, 2))
      },
    })
  },
})
