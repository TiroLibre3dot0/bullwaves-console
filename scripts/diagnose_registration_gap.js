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

const mediaPath = path.join(root, 'public', 'Media Report.csv')
const regsPath = path.join(root, 'public', 'Registrations Report.csv')

let mediaRows = 0
let mediaRegsSum = 0
let mediaMinTs = Infinity
let mediaMaxTs = -Infinity

Papa.parse(fs.createReadStream(mediaPath), {
  header: true,
  skipEmptyLines: true,
  step: (res) => {
    const r = res.data || {}
    mediaRows += 1
    mediaRegsSum += num(r.registrations)

    const ts = parseMediaMonthTs(r.month || r.Month || r.date || r.Date || r.month_year || '')
    if (ts != null) {
      if (ts < mediaMinTs) mediaMinTs = ts
      if (ts > mediaMaxTs) mediaMaxTs = ts
    }
  },
  complete: () => {
    if (mediaMinTs === Infinity) {
      console.error('Could not infer media min/max month timestamps')
      process.exitCode = 1
      return
    }

    let regRows = 0
    let regInMediaRange = 0
    let regInMediaRangeWithAffiliate = 0
    let regInMediaRangeWithoutAffiliate = 0

    // allow end-of-month range inclusive (month labels represent a whole month)
    const rangeStart = mediaMinTs
    const rangeEnd = mediaMaxTs + 32 * 24 * 3600 * 1000

    Papa.parse(fs.createReadStream(regsPath), {
      header: true,
      skipEmptyLines: true,
      step: (res) => {
        const r = res.data || {}
        regRows += 1
        const t = parseRegTs(r)
        if (t != null && t >= rangeStart && t <= rangeEnd) {
          regInMediaRange += 1
          const aff = String(r.affiliate_id ?? r.affiliate ?? '').trim()
          if (aff) regInMediaRangeWithAffiliate += 1
          else regInMediaRangeWithoutAffiliate += 1
        }
      },
      complete: () => {
        const out = {
          media: {
            rows: mediaRows,
            registrationsSum: Math.round(mediaRegsSum),
            minMonthISO: new Date(mediaMinTs).toISOString().slice(0, 10),
            maxMonthISO: new Date(mediaMaxTs).toISOString().slice(0, 10),
          },
          registrations: {
            rows: regRows,
            rowsInMediaRange: regInMediaRange,
            rowsInMediaRangeWithAffiliate: regInMediaRangeWithAffiliate,
            rowsInMediaRangeWithoutAffiliate: regInMediaRangeWithoutAffiliate,
          },
          computed: {
            gap_allScope_mediaMinusRegsRows: Math.round(mediaRegsSum - regRows),
            gap_sameMediaRange_mediaMinusRegsRows: Math.round(mediaRegsSum - regInMediaRange),
            gap_sameMediaRange_mediaMinusRegsRowsWithAffiliate: Math.round(
              mediaRegsSum - regInMediaRangeWithAffiliate
            ),
          },
        }

        console.log(JSON.stringify(out, null, 2))
      },
    })
  },
})
