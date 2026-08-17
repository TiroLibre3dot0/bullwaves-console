import React, { useState, useEffect, useMemo, useRef } from 'react'
import Papa from 'papaparse'
import FullPageLoader from './FullPageLoader'
import { useI18n } from '../i18n/I18nContext'
import { resolveLiveReportPath } from '../lib/fetchCache'

let __bwFraudMediaCache = null
let __bwFraudRegistrationsCache = null

function normalizeHolderKey(name) {
  const s = String(name || '').trim()
  if (!s) return ''
  return s.toLowerCase().split(/\s+/).join(' ')
}

function getReportsVersion() {
  try {
    return String(
      localStorage.getItem('bw_reports_version') ||
        localStorage.getItem('bw_reports_meta_generatedAt') ||
        ''
    )
  } catch {
    return ''
  }
}

function buildVersionedCsvUrl(path) {
  const v = getReportsVersion()

  const rawPath = String(path || '')
  const encodedPath = encodeURI(resolveLiveReportPath(rawPath))
  const sep = encodedPath.includes('?') ? '&' : '?'
  const withVersion = v ? `${encodedPath}${sep}v=${encodeURIComponent(String(v))}` : encodedPath

  // PapaParse with { download: true, worker: true } runs XHR inside a blob worker.
  // Relative URLs can break there; prefer absolute URLs.
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      // If it's already absolute (http/https), keep it.
      if (/^https?:\/\//i.test(withVersion)) return withVersion
      return new URL(withVersion, window.location.origin).toString()
    }
  } catch {
    // fall through
  }

  return withVersion
}

// New, cleaner Fraud Monitoring Dashboard
export default function FraudMonitoringDashboard() {
  const { t } = useI18n()
  const [reportsVersionKey, setReportsVersionKey] = useState(() => getReportsVersion())
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('ALL')
  const [affiliateFilter, setAffiliateFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [modalCase, setModalCase] = useState(null)
  const [isCommissionsModalOpen, setIsCommissionsModalOpen] = useState(false)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [nameGroups, setNameGroups] = useState([])
  const [useNameGroups, setUseNameGroups] = useState(false)
  const [groupMinCount, setGroupMinCount] = useState(9)
  const [mediaSummary, setMediaSummary] = useState({ ftd: 0, qftd: 0, totalCpa: 0 })
  const [avgCostPerUser, setAvgCostPerUser] = useState(0)
  const [mediaSeries, setMediaSeries] = useState([])
  const [regSeries, setRegSeries] = useState([])
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [mediaData, setMediaData] = useState([])
  const [chartRange, setChartRange] = useState('since2024') // 'all' or 'since2024'
  const [yearFilter, setYearFilter] = useState('all') // 'all' or '2024' etc
  // registrations CSV state (declare before effects that reference it)
  const [csvLoaded, setCsvLoaded] = useState(false)
  const [csvRecap, setCsvRecap] = useState(null)
  const [csvAccounts, setCsvAccounts] = useState([])
  const [regCommissionsSummary, setRegCommissionsSummary] = useState(null)
  const [regCommissionsByYear, setRegCommissionsByYear] = useState(null)
  const [regIndex, setRegIndex] = useState(null)
  const [hoverSource, setHoverSource] = useState(null)
  const [hoverXY, setHoverXY] = useState(null)
  const [ftdUpliftFeb, setFtdUpliftFeb] = useState(5)
  const [ftdUpliftMar, setFtdUpliftMar] = useState(5)
  const [qftdUpliftFeb, setQftdUpliftFeb] = useState(5)
  const [qftdUpliftMar, setQftdUpliftMar] = useState(5)
  const [useMtdScaling, setUseMtdScaling] = useState(true)

  // When uploads complete, the app bumps bw_reports_version and emits an event.
  // React to it so Fraud Monitoring reloads without requiring a hard refresh.
  useEffect(() => {
    const sync = () => {
      const v = getReportsVersion()
      setReportsVersionKey((prev) => {
        if (prev === v) return prev
        // Clear module caches so the next effects re-parse.
        __bwFraudMediaCache = null
        __bwFraudRegistrationsCache = null
        // Reset loading flags/state for a clean re-load.
        setMediaLoaded(false)
        setCsvLoaded(false)
        setNameGroups([])
        return v
      })
    }

    const onStorage = (e) => {
      if (!e || e.key === 'bw_reports_version') sync()
    }

    window.addEventListener('bw-reports-updated', sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('bw-reports-updated', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Heavy analysis (can freeze UI on very large CSVs). Auto-enable only for smaller datasets.
  const [enableClusterCases, setEnableClusterCases] = useState(false)
  const [clusterAutoDecided, setClusterAutoDecided] = useState(false)

  // Requirement: only show cases with more than 8 accounts.
  const MIN_ACCOUNTS_FOR_CASE = 9

  const sum = (arr) => arr.reduce((a, b) => a + b, 0)

  const initialLoading = useMemo(() => {
    // Name groups are a large optional enrichment; do not block the primary dashboard render on them.
    return !!loading || !mediaLoaded || !csvLoaded
  }, [loading, mediaLoaded, csvLoaded])

  const initialProgress = useMemo(() => {
    const steps = [
      { done: !loading },
      { done: !!mediaLoaded },
      { done: !!csvLoaded },
      { done: true },
    ]
    const doneCount = steps.reduce((s, x) => s + (x.done ? 1 : 0), 0)
    return (doneCount / steps.length) * 100
  }, [loading, mediaLoaded, csvLoaded])

  // persist MTD scaling preference
  useEffect(() => {
    try {
      const saved =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('bullwaves_fraud_mtd_scaling')
          : null
      if (saved === '0') setUseMtdScaling(false)
      if (saved === '1') setUseMtdScaling(true)
    } catch (e) {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.setItem('bullwaves_fraud_mtd_scaling', useMtdScaling ? '1' : '0')
    } catch (e) {
      /* ignore */
    }
  }, [useMtdScaling])

  useEffect(() => {
    // seed sample cases (replace with real analysis later)
    const seed = [
      {
        id: 1,
        title: 'Multi-Accounting Estremo',
        severity: 'CRITICAL',
        type: 'MULTI_ACCOUNT',
        description: '15 account con identico nome',
        details: {
          name: 'Anusha Todurkar',
          affiliate: '2287',
          country: 'UK',
          accountCount: 15,
          totalDeposits: '€15000',
          depositCount: 45,
          avgEquity: 1200,
          avgProfit: 250,
          avgLoss: -120,
          riskFactors: ['Stesso nome', 'Stesso IP', 'Stesso affiliate'],
        },
        riskScore: 98,
        priority: 'URGENTE',
      },
      {
        id: 2,
        title: 'Affiliate Clustering',
        severity: 'HIGH',
        type: 'AFFILIATE_CLUSTERING',
        description: 'Concentrazione account su affiliate 2287',
        details: {
          name: 'Affiliate cluster 2287',
          affiliate: '2287',
          country: 'UK',
          accountCount: 50,
          totalDeposits: '€50000',
          depositCount: 200,
          avgEquity: 800,
          avgProfit: 120,
          avgLoss: -80,
        },
        riskScore: 82,
        priority: 'ALTA',
      },
      {
        id: 3,
        title: 'Deposito Elevato Rapido',
        severity: 'MEDIUM',
        type: 'HIGH_DEPOSIT',
        description: 'Primo deposito elevato subito dopo registrazione',
        details: {
          name: 'Connor Fitton',
          affiliate: '35272',
          country: 'UK',
          accountCount: 1,
          totalDeposits: '€4013',
          depositCount: 1,
          avgEquity: 4000,
          avgProfit: 300,
          avgLoss: -50,
        },
        riskScore: 72,
        priority: 'MEDIA',
      },
      {
        id: 4,
        title: 'Cross-Border Activity',
        severity: 'MEDIUM',
        type: 'CROSS_BORDER',
        description: 'Stesso nome in paesi diversi',
        details: {
          name: 'Akram Abdul Raheem',
          affiliate: '35197',
          country: 'MV',
          accountCount: 2,
          totalDeposits: '€0',
          depositCount: 0,
          avgEquity: 10,
          avgProfit: 0,
          avgLoss: 0,
        },
        riskScore: 65,
        priority: 'MEDIA',
      },
      {
        id: 5,
        title: 'Pattern Nomi Sospetti',
        severity: 'LOW',
        type: 'SUSPICIOUS_NAMING',
        description: 'Nomi automatizzati/test',
        details: {
          name: 'Pattern test',
          affiliate: '',
          country: 'Multi',
          accountCount: 10,
          totalDeposits: '€0',
          depositCount: 0,
          avgEquity: 5,
          avgProfit: 0,
          avgLoss: 0,
        },
        riskScore: 40,
        priority: 'BASSA',
      },
    ]
    setCases(seed)
    setLoading(false)
  }, [])

  // Decide default for heavy analysis once registrations CSV is available.
  useEffect(() => {
    if (clusterAutoDecided) return
    if (!csvLoaded) return
    const count = Array.isArray(csvAccounts) ? csvAccounts.length : 0
    // Keep UI responsive on large datasets; user can opt-in manually.
    setEnableClusterCases(count > 0 && count <= 8000)
    setClusterAutoDecided(true)
  }, [csvLoaded, csvAccounts, clusterAutoDecided])

  // load Media Report and compute aggregates (FTD/QFTD, registrations, visitors, commissions)
  useEffect(() => {
    const url = buildVersionedCsvUrl('/Media Report.csv')

    if (__bwFraudMediaCache && __bwFraudMediaCache.url === url) {
      setMediaData(__bwFraudMediaCache.rows || [])
      setMediaSeries(__bwFraudMediaCache.series || [])
      setMediaLoaded(true)
      return
    }

    Papa.parse(url, {
      download: true,
      worker: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data || []

        // precompute year/timestamp once for fast filtering later
        rows.forEach((r) => {
          try {
            const d = parseRowToDate(r)
            if (d && !isNaN(d.getTime())) {
              r.__bwYear = d.getUTCFullYear()
              r.__bwTs = d.getTime()
            }
          } catch {
            // ignore
          }
        })

        setMediaData(rows)
        // build mediaSeries only (keep summary computation reactive to `yearFilter`)
        const seriesMap = {}
        rows.forEach((r, idx) => {
          const getVal = (keys) => {
            for (const k of keys) if (Object.prototype.hasOwnProperty.call(r, k)) return r[k]
            return ''
          }
          const n = (s) => parseFloat(String(s || '').replace(/[^0-9\.-]/g, '')) || 0
          const rowFtd = n(getVal(['FTD', 'Ftd', 'ftd', 'ftd_count']))
          const rowQftd = n(getVal(['QFTD', 'Qftd', 'qftd']))
          const rowRegs = n(
            getVal(['Registrations', 'registrations', 'registrazione', 'registration_count'])
          )
          const dateLabel = String(
            getVal(['Month', 'Date', 'month', 'date', 'month_year']) || `r${idx}`
          ).trim()
          if (!seriesMap[dateLabel]) seriesMap[dateLabel] = { ftd: 0, qftd: 0, registrations: 0 }
          seriesMap[dateLabel].ftd += rowFtd
          seriesMap[dateLabel].qftd += rowQftd
          seriesMap[dateLabel].registrations += rowRegs
        })
        const mSeries = Object.keys(seriesMap).map((k) => ({ date: k, ...seriesMap[k] }))
        const parsedM = mSeries.map((s) => {
          // Prefer our month-aware parser so labels like "1/2026" become valid timestamps
          const parsed = parseRowToDate({ Month: s.date, month: s.date, date: s.date })
          if (parsed && !isNaN(parsed.getTime()))
            return { ...s, _ts: parsed.getTime(), dateISO: parsed.toISOString().slice(0, 10) }
          const d = new Date(s.date)
          if (!isNaN(d.getTime()))
            return { ...s, _ts: d.getTime(), dateISO: d.toISOString().slice(0, 10) }
          const alt = Date.parse(s.date)
          if (!isNaN(alt))
            return { ...s, _ts: alt, dateISO: new Date(alt).toISOString().slice(0, 10) }
          return { ...s, _ts: null }
        })
        parsedM.sort((a, b) => (a._ts || 0) - (b._ts || 0))
        setMediaSeries(parsedM)
        __bwFraudMediaCache = { url, rows, series: parsedM }
        setMediaLoaded(true)
      },
      error: (err) => {
        console.warn('Media parse error', err)
        setMediaSummary({
          ftd: 0,
          qftd: 0,
          totalCpa: 0,
          registrations: 0,
          uniqueVisitors: 0,
          visitors: 0,
          leads: 0,
          totalCommission: 0,
          totalPL: 0,
        })
        setMediaLoaded(true)
      },
    })
  }, [reportsVersionKey])

  // diagnostic logging for load sequence (helps track what updates layout)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('FraudDashboard state:', {
        mediaLoaded,
        csvLoaded,
        mediaSeriesLen: mediaSeries.length,
        regSeriesLen: regSeries.length,
      })
    }
  }, [mediaLoaded, csvLoaded, mediaSeries, regSeries])

  // compute avg cost per user once both media summary and csvRecap are ready
  useEffect(() => {
    if (!csvRecap) return
    const regs = csvRecap.totalAccounts || 0
    const avg = regs > 0 ? (mediaSummary.totalCpa || 0) / regs : 0
    setAvgCostPerUser(avg)
  }, [mediaSummary, csvRecap])

  // load registrations CSV and compute platform-wide recap
  useEffect(() => {
    const url = buildVersionedCsvUrl('/Registrations Report.csv')

    if (__bwFraudRegistrationsCache && __bwFraudRegistrationsCache.url === url) {
      setCsvAccounts(__bwFraudRegistrationsCache.accounts || [])
      setCsvRecap(__bwFraudRegistrationsCache.recap || null)
      setRegCommissionsSummary(__bwFraudRegistrationsCache.regCommissionsSummary || null)
      setRegCommissionsByYear(__bwFraudRegistrationsCache.regCommissionsByYear || null)
      setRegIndex(__bwFraudRegistrationsCache.regIndex || null)
      setRegSeries(__bwFraudRegistrationsCache.regSeries || [])
      setCsvLoaded(true)
      return
    }

    Papa.parse(url, {
      download: true,
      worker: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        try {
          const normalizeKey = (k) =>
            String(k || '')
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '')

          const parseRegistrationTs = (value) => {
            const s = String(value ?? '').trim()
            if (!s) return null
            // MM/YYYY or M/YYYY
            const mmyyyy = s.match(/^\s*(\d{1,2})\/(\d{4})\s*$/)
            if (mmyyyy) {
              const mo = Number(mmyyyy[1])
              const y = Number(mmyyyy[2])
              if (!isNaN(y) && mo >= 1 && mo <= 12) return Date.UTC(y, mo - 1, 1)
            }
            // M/D/YYYY [HH:mm[:ss]] (Registrations Report common export)
            const mdy = s.match(
              /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2})(?::(\d{2}))(?::(\d{2}))?)?\s*$/
            )
            if (mdy) {
              const mo = Number(mdy[1])
              const d = Number(mdy[2])
              const y = Number(mdy[3])
              const hh = mdy[4] ? Number(mdy[4]) : 0
              const mm = mdy[5] ? Number(mdy[5]) : 0
              const ss = mdy[6] ? Number(mdy[6]) : 0
              if (
                !isNaN(y) &&
                mo >= 1 &&
                mo <= 12 &&
                !isNaN(d) &&
                d >= 1 &&
                d <= 31 &&
                !isNaN(hh) &&
                hh >= 0 &&
                hh <= 23 &&
                !isNaN(mm) &&
                mm >= 0 &&
                mm <= 59 &&
                !isNaN(ss) &&
                ss >= 0 &&
                ss <= 59
              ) {
                return Date.UTC(y, mo - 1, d, hh, mm, ss)
              }
            }
            // YYYY-MM or YYYY/MM or YYYY-MM-DD
            const ymd = s.match(/^\s*(\d{4})[\-\/](\d{1,2})(?:[\-\/](\d{1,2}))?\s*$/)
            if (ymd) {
              const y = Number(ymd[1])
              const mo = Number(ymd[2])
              const d = ymd[3] ? Number(ymd[3]) : 1
              if (!isNaN(y) && !isNaN(mo) && mo >= 1 && mo <= 12 && !isNaN(d) && d >= 1 && d <= 31)
                return Date.UTC(y, mo - 1, d)
            }
            const parsed = Date.parse(s)
            if (!isNaN(parsed)) return parsed
            return null
          }

          const fields =
            (res && res.meta && Array.isArray(res.meta.fields) && res.meta.fields) ||
            (res && Array.isArray(res.data) && res.data.length ? Object.keys(res.data[0]) : [])

          const normToOrig = new Map()
          for (const f of fields) {
            const nk = normalizeKey(f)
            if (nk && !normToOrig.has(nk)) normToOrig.set(nk, f)
          }

          const pickNormKey = (candidates) => candidates.find((k) => normToOrig.has(k)) || null
          const get = (row, normKey) => {
            const orig = normToOrig.get(normKey)
            return orig ? row?.[orig] : ''
          }

          // detect possible keys (normalized)
          const acctKeys = [
            'account_id',
            'accountid',
            'accountnumber',
            'account',
            'id',
            'clientid',
            // Registrations Report canonical columns
            'user_id',
            'userid',
            'mt5_account',
            'mt5account',
          ]
          const nameKeys = [
            'fullname',
            'full_name',
            'name',
            'client_name',
            // Registrations Report canonical columns
            'customername',
            'customer_name',
          ]
          const dateKeys = [
            'registration_date',
            'registrationdate',
            'reg_date',
            'date',
            'created_at',
            'createdat',
            'external_date',
            'externaldate',
          ]
          const depositCountKeys = [
            'deposit_count',
            'deposits_count',
            'num_deposits',
            'depositcount',
          ]
          const equityKeys = ['equity', 'balance', 'account_balance']
          const profitKeys = ['profit', 'netprofit', 'pnl']
          const lossKeys = ['loss', 'netloss']
          const plKeys = ['net_pl', 'pl', 'profit_loss', 'profitloss']
          const affiliateKeys = [
            'affiliate',
            'affiliate_id',
            'affiliateid',
            'affiliate_code',
            'affiliate_ref',
          ]
          const countryKeys = ['country', 'country_code', 'nation', 'paese']
          const commKeys = [
            'commissions',
            'affiliate_commissions',
            'sub_affiliate_commissions',
            'cpa_commission',
            'cpl_commission',
            'revshare_commission',
            'other_commissions',
          ]

          const acctKey = pickNormKey(acctKeys)
          const nameKey = pickNormKey(nameKeys)
          // IMPORTANT: when Registrations Report has `registration_date`, treat it as the
          // authoritative registration timestamp (matches console totals). `external_date`
          // is often present but can represent a different system/event and may shift year counts.
          const dateKeysFound = normToOrig.has('registration_date')
            ? ['registration_date']
            : dateKeys.filter((k) => normToOrig.has(k))
          const depositKey = pickNormKey(depositCountKeys)
          const equityKey = pickNormKey(equityKeys)
          const plKey = pickNormKey(plKeys)
          const profitKey = pickNormKey(profitKeys)
          const lossKey = pickNormKey(lossKeys)
          const affiliateKey = pickNormKey(affiliateKeys)
          const countryKey = pickNormKey(countryKeys)

          const commKeysFound = commKeys.filter((k) => normToOrig.has(k))
          const hasCommissionsCol = normToOrig.has('commissions')

          const parseStrictNonNegInt = (v) => {
            const s = String(v ?? '').trim()
            if (!s) return 0
            const cleaned = s.replace(/[^0-9\.-]/g, '')
            const f = Number(cleaned)
            if (!Number.isFinite(f)) return 0
            const r = Math.round(f)
            if (r < 0) return 0
            // Accept only values that are effectively integers (e.g. 1, 1.0000)
            if (Math.abs(f - r) > 1e-6) return 0
            return r
          }

          const cleanAccountId = (v) => {
            const s = String(v ?? '').trim()
            if (!s) return ''
            // Remove CSV-escape artifacts like leading/trailing quotes from malformed rows
            return s.replace(/^"+|"+$/g, '')
          }

          const parseNum = (v) => Number(String(v || '').replace(/[^0-9\.-]/g, '')) || 0
          const getFirstNonEmpty = (row, normKeys) => {
            for (const nk of normKeys) {
              const v = get(row, nk)
              if (String(v ?? '').trim()) return v
            }
            return ''
          }
          const breakdown = Object.create(null)
          commKeys.forEach((k) => {
            breakdown[k] = 0
          })
          const perYearAgg = Object.create(null)
          const regIdToTs = new Map()
          const allIndexIds = new Set()

          const data = Array.isArray(res.data) ? res.data : []
          const accounts = new Array(data.length)

          for (let idx = 0; idx < data.length; idx++) {
            const row = data[idx]

            const rawId = acctKey ? get(row, acctKey) : ''
            const cleanedId = cleanAccountId(rawId)
            const fallbackId = String(rawId ?? '').trim()
            const accountId = cleanedId || fallbackId || `row-${idx}`

            const holder = nameKey ? String(get(row, nameKey) || '').trim() || '—' : '—'

            const dateVal = dateKeysFound.length ? getFirstNonEmpty(row, dateKeysFound) : ''
            const regTs = parseRegistrationTs(dateVal)
            const regYear = regTs != null ? new Date(regTs).getUTCFullYear() : undefined

            const depositCount = depositKey ? parseStrictNonNegInt(get(row, depositKey)) : 0
            const equity = equityKey
              ? Number(String(get(row, equityKey)).replace(/[^0-9\-\.]/g, '')) || 0
              : 0

            let profit = 0
            let loss = 0
            if (plKey) {
              const pl = Number(String(get(row, plKey)).replace(/[^0-9\-\.]/g, '')) || 0
              if (pl >= 0) profit = pl
              else loss = Math.abs(pl)
            } else {
              profit = profitKey
                ? Number(String(get(row, profitKey)).replace(/[^0-9\-\.]/g, '')) || 0
                : 0
              loss = lossKey ? Number(String(get(row, lossKey)).replace(/[^0-9\-\.]/g, '')) || 0 : 0
            }

            const affiliate = affiliateKey ? String(get(row, affiliateKey) || '').trim() : ''
            const country = countryKey ? String(get(row, countryKey) || '').trim() : ''

            accounts[idx] = {
              accountId,
              holder,
              depositCount,
              equity,
              profit,
              loss,
              affiliate,
              country,
              __regYear: typeof regYear === 'number' ? regYear : undefined,
              __regTs: typeof regTs === 'number' ? regTs : undefined,
            }

            // Index unique account IDs by earliest registration timestamp.
            // Prefer skipping synthetic IDs derived from row index.
            const idForIndex = cleanedId || fallbackId
            if (idForIndex) allIndexIds.add(idForIndex)
            if (regTs != null) {
              if (idForIndex) {
                const prev = regIdToTs.get(idForIndex)
                if (prev == null || regTs < prev) regIdToTs.set(idForIndex, regTs)
              }
            }

            // Commissions aggregates (keep semantics based on raw rows)
            let rowSum = 0
            for (const k of commKeysFound) {
              const v = parseNum(get(row, k))
              breakdown[k] += v
              rowSum += v
            }

            if (typeof regYear === 'number') {
              const key = String(regYear)
              let yAgg = perYearAgg[key]
              if (!yAgg) {
                const yBreak = Object.create(null)
                commKeys.forEach((k) => {
                  yBreak[k] = 0
                })
                yAgg = { breakdown: yBreak, payingCount: 0 }
                perYearAgg[key] = yAgg
              }
              for (const k of commKeysFound) {
                yAgg.breakdown[k] += parseNum(get(row, k))
              }
              if (hasCommissionsCol) {
                const c = parseNum(get(row, 'commissions'))
                if (c > 0) yAgg.payingCount += 1
              } else {
                if (rowSum > 0) yAgg.payingCount += 1
              }
            }
          }

          setCsvAccounts(accounts)

          const commTotal = hasCommissionsCol
            ? breakdown['commissions']
            : Object.values(breakdown).reduce((s, v) => s + v, 0)

          let payingCount = 0
          if (hasCommissionsCol) {
            payingCount = data.reduce(
              (c, row) => c + (parseNum(get(row, 'commissions')) > 0 ? 1 : 0),
              0
            )
          } else {
            payingCount = data.reduce((c, row) => {
              const sum = commKeysFound.reduce((s, k) => s + parseNum(get(row, k)), 0)
              return c + (sum > 0 ? 1 : 0)
            }, 0)
          }
          const avgCpaRegistrations = payingCount ? commTotal / payingCount : 0
          const allRegCommissions = {
            total: commTotal,
            breakdown,
            payingCount,
            avgPerPayingAccount: avgCpaRegistrations,
          }
          setRegCommissionsSummary(allRegCommissions)

          const perYearSummary = Object.create(null)
          for (const [year, agg] of Object.entries(perYearAgg)) {
            const yBreakdown = agg.breakdown || Object.create(null)
            const total = hasCommissionsCol
              ? yBreakdown['commissions'] || 0
              : Object.values(yBreakdown).reduce((s, v) => s + (Number(v) || 0), 0)
            const yPaying = Number(agg.payingCount || 0)
            perYearSummary[year] = {
              total,
              breakdown: yBreakdown,
              payingCount: yPaying,
              avgPerPayingAccount: yPaying ? total / yPaying : 0,
            }
          }
          setRegCommissionsByYear(perYearSummary)

          // build registration time series by month using UNIQUE account IDs
          // (raw row counts can be inflated by duplicates / malformed quoting)
          const pad2 = (n) => String(n).padStart(2, '0')
          const monthKeyFromTs = (ts) => {
            const d = new Date(Number(ts))
            if (isNaN(d.getTime())) return null
            return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`
          }

          const monthToCount = new Map()
          for (const ts of regIdToTs.values()) {
            const monthKey = monthKeyFromTs(ts)
            if (!monthKey) continue
            monthToCount.set(monthKey, (monthToCount.get(monthKey) || 0) + 1)
          }

          const parsedR = Array.from(monthToCount.entries())
            .map(([key, count]) => {
              const parts = key.split('-')
              const y = Number(parts[0])
              const mo = Number(parts[1])
              const ts = !isNaN(y) && !isNaN(mo) ? Date.UTC(y, mo - 1, 1) : null
              return { date: key, count: Number(count) || 0, _ts: ts, dateISO: `${key}-01` }
            })
            .filter((s) => s._ts != null)
            .sort((a, b) => (a._ts || 0) - (b._ts || 0))
          setRegSeries(parsedR)

          // Index registration timestamps for fast comparable-count queries
          const allTs = []
          const byYear = Object.create(null)
          let minTs = null
          let maxTs = null
          for (const ts of regIdToTs.values()) {
            if (typeof ts !== 'number') continue
            allTs.push(ts)
            if (minTs == null || ts < minTs) minTs = ts
            if (maxTs == null || ts > maxTs) maxTs = ts
            const y = new Date(ts).getUTCFullYear()
            const key = String(y)
            if (!byYear[key]) byYear[key] = []
            byYear[key].push(ts)
          }
          const totalUniqueIds = allIndexIds.size
          const uniqueIdsWithDate = regIdToTs.size
          const missingNoDateCount = Math.max(0, totalUniqueIds - uniqueIdsWithDate)
          const computedRegIndex = {
            allTs,
            byYear,
            minTs,
            maxTs,
            totalUniqueIds,
            missingNoDateCount,
          }
          setRegIndex(computedRegIndex)

          const totalAccounts = accounts.length
          const accountIdSet = new Set()
          const holderCounts = new Map()
          let withDeposit = 0
          let maxDeposits = 0
          let equitySum = 0
          let profitSum = 0
          let lossSum = 0
          let depositTotal = 0
          let depositMax = 0
          let depositMin = Infinity
          let depositorsCount = 0
          let totalPL = 0

          for (const a of accounts) {
            if (!a) continue
            accountIdSet.add(a.accountId)
            const holderKey = a.holder || '—'
            holderCounts.set(holderKey, (holderCounts.get(holderKey) || 0) + 1)

            const dep = Number(a.depositCount || 0)
            if (dep > 0) withDeposit += 1
            if (dep > maxDeposits) maxDeposits = dep
            depositTotal += dep
            if (dep > depositMax) depositMax = dep
            if (dep < depositMin) depositMin = dep
            if (dep > 0) depositorsCount += 1

            const eq = Number(a.equity || 0)
            const pr = Number(a.profit || 0)
            const ls = Number(a.loss || 0)
            equitySum += eq
            profitSum += pr
            lossSum += ls
            totalPL += pr - ls
          }

          const uniqueAccountIds = accountIdSet.size
          const uniqueHolders = holderCounts.size
          let singleAccountHolders = 0
          let multiAccountCount = 0
          for (const v of holderCounts.values()) {
            if (v === 1) singleAccountHolders += 1
            else if (v > 1) multiAccountCount += v
          }

          // deposit buckets (by count) size 5
          const maxBucket = Math.ceil(maxDeposits / 5)
          const buckets = {}
          for (let i = 1; i <= Math.max(1, maxBucket); i++) buckets[i] = 0
          for (const a of accounts) {
            const dep = Number(a?.depositCount || 0)
            if (dep > 0) {
              const idx = Math.floor((dep - 1) / 5) + 1
              buckets[idx] = (buckets[idx] || 0) + 1
            }
          }

          const avgEquity = totalAccounts ? equitySum / totalAccounts : 0
          const avgProfit = totalAccounts ? profitSum / totalAccounts : 0
          const avgLoss = totalAccounts ? lossSum / totalAccounts : 0
          const safeDepositMin = depositMin === Infinity ? 0 : depositMin
          const depositAvg = depositorsCount ? depositTotal / depositorsCount : 0

          const computedLosingRatio = mediaSummary.totalNetDeposits
            ? (mediaSummary.totalPL / mediaSummary.totalNetDeposits) * 100
            : 0
          setCsvRecap({
            totalAccounts,
            uniqueAccountIds,
            uniqueHolders,
            singleAccountHolders,
            multiAccountCount,
            withDeposit,
            buckets,
            avgEquity,
            avgProfit,
            avgLoss,
            depositStats: {
              total: depositTotal,
              max: depositMax,
              min: safeDepositMin,
              avg: depositAvg,
            },
            totalPL,
            payingUsers: withDeposit,
            losingUsersPercentage: computedLosingRatio,
          })
          setCsvLoaded(true)

          __bwFraudRegistrationsCache = {
            url,
            accounts,
            recap: {
              totalAccounts,
              uniqueAccountIds,
              uniqueHolders,
              singleAccountHolders,
              multiAccountCount,
              withDeposit,
              buckets,
              avgEquity,
              avgProfit,
              avgLoss,
              depositStats: {
                total: depositTotal,
                max: depositMax,
                min: safeDepositMin,
                avg: depositAvg,
              },
              totalPL,
              payingUsers: withDeposit,
              losingUsersPercentage: computedLosingRatio,
            },
            regCommissionsSummary: {
              total: commTotal,
              breakdown,
              payingCount,
              avgPerPayingAccount: avgCpaRegistrations,
            },
            regCommissionsByYear: perYearSummary,
            regIndex: computedRegIndex,
            regSeries: parsedR,
          }
        } catch (e) {
          console.error('CSV compute error', e)
          setCsvRecap(null)
          setCsvLoaded(true)
        }
      },
      error: (err) => {
        console.error('CSV parse error', err)
        setCsvLoaded(true)
      },
    })
  }, [reportsVersionKey])

  // Accounts used for KPI/case computations (respects yearFilter)
  const accountsForAnalysis = useMemo(() => {
    const list = Array.isArray(csvAccounts) ? csvAccounts : []
    if (!yearFilter || yearFilter === 'all') return list
    const y = Number(yearFilter)
    if (isNaN(y)) return list
    return list.filter((a) => (a && typeof a.__regYear === 'number' ? a.__regYear === y : false))
  }, [csvAccounts, yearFilter])

  // load precomputed name+country groups (generated by scripts/fraud_monitor.js)
  useEffect(() => {
    if (!useNameGroups) {
      setNameGroups([])
      return undefined
    }

    let done = false
    // eslint-disable-next-line no-undef
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeout = setTimeout(() => {
      if (done) return
      done = true
      try {
        controller?.abort()
      } catch {
        /* ignore */
      }
      setNameGroups([])
    }, 8000)

    const v = getReportsVersion()
    const groupsUrl = v
      ? `/fraud_monitor_name_groups.json?v=${encodeURIComponent(String(v))}`
      : '/fraud_monitor_name_groups.json'

    fetch(groupsUrl, controller ? { signal: controller.signal } : undefined)
      .then((r) => {
        if (!r.ok) throw new Error('no groups')
        return r.json()
      })
      .then((j) => {
        if (done) return
        done = true
        setNameGroups(j.groups || [])
      })
      .catch((err) => {
        if (done) return
        done = true
        console.warn('No name groups available', err)
        setNameGroups([])
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      clearTimeout(timeout)
      try {
        controller?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [reportsVersionKey, useNameGroups])

  // Lightweight, real data cases: only multi-account names (avoid 65k singletons).
  const multiAccountCases = useMemo(() => {
    if (!accountsForAnalysis || accountsForAnalysis.length === 0) return []

    const byName = new Map()
    for (const a of accountsForAnalysis) {
      const key = normalizeHolderKey(a.holder)
      if (!key || key === '—') continue
      let g = byName.get(key)
      if (!g) {
        g = {
          displayName: String(a.holder || '').trim() || key,
          accountCount: 0,
          affiliates: new Set(),
          countries: new Set(),
          totalDepositCount: 0,
          totalEquity: 0,
          totalProfit: 0,
          totalLoss: 0,
        }
        byName.set(key, g)
      }
      g.accountCount += 1
      if (a.affiliate) g.affiliates.add(String(a.affiliate))
      if (a.country) g.countries.add(String(a.country))
      g.totalDepositCount += Number(a.depositCount || 0)
      g.totalEquity += Number(a.equity || 0)
      g.totalProfit += Number(a.profit || 0)
      g.totalLoss += Number(a.loss || 0)
    }

    const groups = []
    for (const g of byName.values()) {
      if (g.accountCount < MIN_ACCOUNTS_FOR_CASE) continue
      groups.push(g)
    }

    // Highest-risk first: accountCount, then deposits.
    groups.sort(
      (a, b) => b.accountCount - a.accountCount || b.totalDepositCount - a.totalDepositCount
    )

    return groups.map((g, idx) => {
      const affiliatesCount = g.affiliates.size
      const countriesCount = g.countries.size
      let severity = 'LOW'
      if (g.accountCount >= 10 || (g.accountCount >= 3 && g.totalDepositCount >= 10))
        severity = 'CRITICAL'
      else if (g.accountCount >= 5 || (g.accountCount >= 3 && g.totalDepositCount > 0))
        severity = 'HIGH'
      else if (g.accountCount >= 2 && g.totalDepositCount > 0) severity = 'MEDIUM'

      const riskFactors = []
      riskFactors.push(`Same customer name across ${g.accountCount} accounts`)
      if (affiliatesCount <= 2) riskFactors.push('Low affiliate diversity')
      if (countriesCount > 1) riskFactors.push('Cross-country presence')
      if (g.totalDepositCount >= 10) riskFactors.push('High deposit count')

      const riskScore = Math.min(
        100,
        Math.round(
          g.accountCount * 7 +
            g.totalDepositCount * 3 +
            (affiliatesCount <= 2 ? 15 : 0) +
            (countriesCount > 1 ? 10 : 0)
        )
      )

      return {
        id: `multi-${idx}`,
        title: `Multi-account: ${g.displayName}`,
        severity,
        description: `${g.accountCount} accounts · ${g.totalDepositCount} deposits · ${affiliatesCount} affiliates · ${countriesCount} countries`,
        details: {
          name: g.displayName,
          accountCount: g.accountCount,
          totalDepositCount: g.totalDepositCount,
          totalDeposits: `${g.totalDepositCount} deposits`,
          affiliate: `${affiliatesCount} affiliates`,
          country: `${countriesCount} countries`,
          riskFactors,
        },
        riskScore,
        priority:
          severity === 'CRITICAL'
            ? 'URGENTE'
            : severity === 'HIGH'
              ? 'ALTA'
              : severity === 'MEDIUM'
                ? 'MEDIA'
                : 'BASSA',
        why: `Repeated name (${g.accountCount}x)`,
      }
    })
  }, [accountsForAnalysis, MIN_ACCOUNTS_FOR_CASE])

  // Build clusters by holder name (multi-account groups)
  const clusters = useMemo(() => {
    if (!enableClusterCases) return []
    if (!accountsForAnalysis || accountsForAnalysis.length === 0) return []
    const map = {}
    accountsForAnalysis.forEach((a) => {
      const name = (a.holder || '—').trim()
      if (!map[name])
        map[name] = {
          holder: name,
          accounts: [],
          affiliates: new Set(),
          countries: new Set(),
          totalDepositCount: 0,
          totalEquity: 0,
          totalProfit: 0,
          totalLoss: 0,
        }
      map[name].accounts.push(a)
      if (a.affiliate) map[name].affiliates.add(a.affiliate)
      if (a.country) map[name].countries.add(a.country)
      map[name].totalDepositCount += Number(a.depositCount || 0)
      map[name].totalEquity += Number(a.equity || 0)
      map[name].totalProfit += Number(a.profit || 0)
      map[name].totalLoss += Number(a.loss || 0)
    })
    // map to array and compute derived stats + risk
    const rows = Object.values(map).map((c) => {
      const accountCount = c.accounts.length
      const affiliatesCount = c.affiliates.size
      const countriesCount = c.countries.size
      // Risk rules (deterministic):
      // High: >=10 accounts OR (>=3 accounts AND totalDepositCount>=10) OR (>=3 accounts AND affiliatesCount<=2 AND totalDepositCount>0)
      // Medium: 2-4 accounts with some deposits
      // Low: >1 accounts with zero deposits
      let risk = 'LOW'
      if (
        accountCount >= 10 ||
        (accountCount >= 3 && c.totalDepositCount >= 10) ||
        (accountCount >= 3 && affiliatesCount <= 2 && c.totalDepositCount > 0)
      ) {
        risk = 'HIGH'
      } else if (accountCount >= 2 && c.totalDepositCount > 0) {
        risk = 'MEDIUM'
      } else if (accountCount > 1 && c.totalDepositCount === 0) {
        risk = 'LOW'
      }
      return {
        holder: c.holder,
        accountCount,
        affiliatesCount,
        countriesCount,
        totalDepositCount: c.totalDepositCount,
        totalEquity: c.totalEquity,
        totalProfit: c.totalProfit,
        totalLoss: c.totalLoss,
        accounts: c.accounts,
        risk,
      }
    })

    // sort high risk first
    rows.sort(
      (a, b) => (b.risk === 'HIGH') - (a.risk === 'HIGH') || b.accountCount - a.accountCount
    )
    return rows
  }, [accountsForAnalysis, enableClusterCases])

  // Cases derived from clusters (single source of truth)
  const derivedCases = useMemo(() => {
    if (!enableClusterCases) return []
    if (!clusters || clusters.length === 0) return []
    return clusters
      .filter((c) => Number(c.accountCount || 0) >= MIN_ACCOUNTS_FOR_CASE)
      .map((c, idx) => ({
        id: `cluster-${idx}`,
        title: `Cluster: ${c.holder}`,
        severity: c.risk === 'HIGH' ? 'CRITICAL' : c.risk === 'MEDIUM' ? 'HIGH' : 'LOW',
        description: c.totalDepositCount
          ? `${c.accountCount} accounts · ${c.totalDepositCount} deposits across ${c.affiliatesCount} affiliates`
          : `${c.accountCount} accounts · no deposits recorded`,
        details: {
          name: c.holder,
          affiliateSummary: c.affiliatesCount,
          countrySummary: c.countriesCount,
          accountCount: c.accountCount,
          totalDepositCount: c.totalDepositCount,
        },
        riskScore: Math.min(
          100,
          Math.round(
            c.accountCount * 8 + c.totalDepositCount * 3 + (c.affiliatesCount <= 2 ? 20 : 0)
          )
        ),
        priority: c.risk === 'HIGH' ? 'URGENTE' : c.risk === 'MEDIUM' ? 'ALTA' : 'BASSA',
        why:
          c.accountCount > 1
            ? `Same customer name across ${c.accountCount} accounts`
            : 'Single account',
      }))
  }, [clusters, enableClusterCases, MIN_ACCOUNTS_FOR_CASE])

  const displayedCases =
    enableClusterCases && derivedCases.length
      ? derivedCases
      : multiAccountCases.length
        ? multiAccountCases
        : cases

  // build cases from name+country groups when requested
  const nameGroupCases = useMemo(() => {
    if (!nameGroups || !Array.isArray(nameGroups)) return []
    return nameGroups
      .filter((g) => Number(g.count || 0) >= Number(groupMinCount || 0))
      .map((g, idx) => {
        const severity =
          g.count >= 20 ? 'CRITICAL' : g.count >= 10 ? 'HIGH' : g.count >= 4 ? 'MEDIUM' : 'LOW'
        const description = `${g.count} accounts · ${g.country || 'Unknown'}`
        const details = { name: g.name, accountCount: g.count, members: g.members }
        const riskScore = Math.min(100, g.count * 5 + (g.has_ftd ? 30 : 0))
        return {
          id: `ng-${idx}`,
          title: `Name group: ${g.name}`,
          severity,
          description,
          details,
          riskScore,
          priority: severity === 'CRITICAL' ? 'URGENTE' : severity === 'HIGH' ? 'ALTA' : 'BASSA',
          why: `Same name+country ${g.count} times`,
        }
      })
  }, [nameGroups, groupMinCount])

  // dynamic list of available years from media and registration series
  const availableYears = useMemo(() => {
    const years = new Set()
    const addFrom = (arr) => {
      if (!arr || !arr.forEach) return
      arr.forEach((it) => {
        try {
          const d =
            it &&
            (it.date instanceof Date
              ? it.date
              : it._ts
                ? new Date(Number(it._ts))
                : it.date
                  ? new Date(it.date)
                  : null)
          if (d && !isNaN(d.getTime())) years.add(d.getUTCFullYear())
        } catch (e) {
          /* ignore */
        }
      })
    }
    addFrom(mediaSeries)
    addFrom(regSeries)
    const arr = Array.from(years)
      .sort((a, b) => b - a)
      .map(String)
    return ['all', ...arr]
  }, [mediaSeries, regSeries])

  // helper to parse a row's date (tries month/date fields)
  const parseRowToDate = (r) => {
    if (!r) return null
    const v = r.month || r.Month || r.date || r.Date || r.month_year || ''
    const s = String(v || '').trim()
    if (!s) return null
    // MM/YYYY
    const mmy = s.match(/^(\d{1,2})[\/](\d{4})$/)
    if (mmy) {
      const mo = Number(mmy[1])
      const y = Number(mmy[2])
      if (mo >= 1 && mo <= 12) return new Date(Date.UTC(y, mo - 1, 1))
    }
    // YYYY-MM or YYYY/MM
    const ymd = s.match(/^(\d{4})[\-\/]?(\d{2})$/)
    if (ymd) {
      const y = Number(ymd[1])
      const mo = Number(ymd[2])
      if (!isNaN(y) && !isNaN(mo)) return new Date(Date.UTC(y, mo - 1, 1))
    }
    const parsed = Date.parse(s)
    if (!isNaN(parsed)) return new Date(parsed)
    return null
  }

  // filtered media data based on yearFilter
  const filteredMediaData = useMemo(() => {
    if (!mediaData || !mediaData.length) return []
    if (!yearFilter || yearFilter === 'all') return mediaData
    const y = Number(yearFilter)
    if (isNaN(y)) return mediaData
    return mediaData.filter((r) => (r && typeof r.__bwYear === 'number' ? r.__bwYear === y : false))
  }, [mediaData, yearFilter])

  const filteredCsvRecap = useMemo(() => {
    if (!yearFilter || yearFilter === 'all') return null
    const accounts = accountsForAnalysis
    const totalAccounts = accounts.length
    const accountIdSet = new Set()
    const holderCounts = new Map()
    let withDeposit = 0
    let maxDeposits = 0
    let equitySum = 0
    let profitSum = 0
    let lossSum = 0
    let depositTotal = 0
    let depositMax = 0
    let depositMin = Infinity
    let depositorsCount = 0
    let totalPL = 0

    for (const a of accounts) {
      if (!a) continue
      accountIdSet.add(a.accountId)
      const holderKey = a.holder || '—'
      holderCounts.set(holderKey, (holderCounts.get(holderKey) || 0) + 1)

      const dep = Number(a.depositCount || 0)
      if (dep > 0) withDeposit += 1
      if (dep > maxDeposits) maxDeposits = dep
      depositTotal += dep
      if (dep > depositMax) depositMax = dep
      if (dep < depositMin) depositMin = dep
      if (dep > 0) depositorsCount += 1

      const eq = Number(a.equity || 0)
      const pr = Number(a.profit || 0)
      const ls = Number(a.loss || 0)
      equitySum += eq
      profitSum += pr
      lossSum += ls
      totalPL += pr - ls
    }

    const uniqueAccountIds = accountIdSet.size
    const uniqueHolders = holderCounts.size
    let singleAccountHolders = 0
    let multiAccountCount = 0
    for (const v of holderCounts.values()) {
      if (v === 1) singleAccountHolders += 1
      else if (v > 1) multiAccountCount += v
    }

    const maxBucket = Math.ceil(maxDeposits / 5)
    const buckets = {}
    for (let i = 1; i <= Math.max(1, maxBucket); i++) buckets[i] = 0
    for (const a of accounts) {
      const dep = Number(a?.depositCount || 0)
      if (dep > 0) {
        const idx = Math.floor((dep - 1) / 5) + 1
        buckets[idx] = (buckets[idx] || 0) + 1
      }
    }

    const avgEquity = totalAccounts ? equitySum / totalAccounts : 0
    const avgProfit = totalAccounts ? profitSum / totalAccounts : 0
    const avgLoss = totalAccounts ? lossSum / totalAccounts : 0
    const safeDepositMin = depositMin === Infinity ? 0 : depositMin
    const depositAvg = depositorsCount ? depositTotal / depositorsCount : 0
    const losingUsersPercentage = mediaSummary.totalNetDeposits
      ? (mediaSummary.totalPL / mediaSummary.totalNetDeposits) * 100
      : 0
    return {
      totalAccounts,
      uniqueAccountIds,
      uniqueHolders,
      singleAccountHolders,
      multiAccountCount,
      withDeposit,
      buckets,
      avgEquity,
      avgProfit,
      avgLoss,
      depositStats: {
        total: depositTotal,
        max: depositMax,
        min: safeDepositMin,
        avg: depositAvg,
      },
      totalPL,
      payingUsers: withDeposit,
      losingUsersPercentage,
    }
  }, [accountsForAnalysis, mediaSummary, yearFilter])

  // display recap depending on yearFilter
  const displayCsvRecap = yearFilter && yearFilter !== 'all' ? filteredCsvRecap : csvRecap
  const displayCsvAccounts = accountsForAnalysis

  // Comparable registrations count: unique account IDs within the same month-range as the Media report
  // This avoids comparing Media month aggregates against the entire historical registrations export.
  const comparableRegistrationsCount = useMemo(() => {
    if (!mediaLoaded || !csvLoaded) return null
    const m = filteredMediaData || []
    if (!m.length) return null

    let minTs = Infinity
    let maxTs = -Infinity
    for (const r of m) {
      const t = typeof r?.__bwTs === 'number' ? r.__bwTs : null
      if (t == null) continue
      if (t < minTs) minTs = t
      if (t > maxTs) maxTs = t
    }
    if (minTs === Infinity || maxTs === -Infinity) return null

    // Month labels represent a whole month; use whole-month boundaries (UTC)
    const toUtcMonthStart = (ts) => {
      const d = new Date(Number(ts))
      if (isNaN(d.getTime())) return null
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
    }
    const toUtcMonthEnd = (ts) => {
      const d = new Date(Number(ts))
      if (isNaN(d.getTime())) return null
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)
    }

    const rangeStart = toUtcMonthStart(minTs)
    const rangeEnd = toUtcMonthEnd(maxTs)
    if (rangeStart == null || rangeEnd == null) return null

    const idx = regIndex
    if (!idx) return 0

    let tsList = Array.isArray(idx.allTs) ? idx.allTs : []
    if (yearFilter && yearFilter !== 'all') {
      const y = Number(yearFilter)
      if (!isNaN(y)) {
        const byYear = idx.byYear || {}
        const list = byYear[String(y)]
        tsList = Array.isArray(list) ? list : []
      }
    }

    let count = 0
    for (const ts of tsList) {
      if (typeof ts !== 'number') continue
      if (ts >= rangeStart && ts <= rangeEnd) count += 1
    }

    // If we're looking at the all-years view, and the Media range fully covers the span of
    // *dated* registrations, we can safely include unique IDs that have no parseable date.
    // Otherwise we'd risk attributing undated accounts to a narrower range.
    const idxMin = typeof idx.minTs === 'number' ? idx.minTs : null
    const idxMax = typeof idx.maxTs === 'number' ? idx.maxTs : null
    const canIncludeUndated =
      (!yearFilter || yearFilter === 'all') &&
      idxMin != null &&
      idxMax != null &&
      idxMin >= rangeStart &&
      idxMax <= rangeEnd

    if (canIncludeUndated) {
      const total = Number(idx.totalUniqueIds)
      if (Number.isFinite(total) && total > 0) return Math.round(total)
      const missing = Number(idx.missingNoDateCount || 0)
      return count + (Number.isFinite(missing) ? missing : 0)
    }

    return count
  }, [mediaLoaded, csvLoaded, filteredMediaData, regIndex, yearFilter])

  // filtered commissions summary
  const filteredRegCommissionsSummary = useMemo(() => {
    if (!yearFilter || yearFilter === 'all') return null
    const y = Number(yearFilter)
    if (isNaN(y)) return null
    const m = regCommissionsByYear || null
    if (!m) return null
    return m[String(y)] || null
  }, [regCommissionsByYear, yearFilter])

  const displayRegCommissionsSummary =
    yearFilter && yearFilter !== 'all' ? filteredRegCommissionsSummary : regCommissionsSummary

  // compute mediaSummary from filtered data so the Year filter affects all aggregates
  useEffect(() => {
    const rows = filteredMediaData || []
    let ftd = 0,
      qftd = 0,
      totalCpa = 0,
      registrations = 0,
      uniqueVisitors = 0,
      visitors = 0,
      leads = 0,
      totalCommission = 0,
      totalPL = 0,
      totalNetDeposits = 0,
      totalDeposits = 0,
      totalWithdrawals = 0
    const getVal = (r, keys) => {
      for (const k of keys) if (Object.prototype.hasOwnProperty.call(r, k)) return r[k]
      return ''
    }
    const n = (s) => parseFloat(String(s || '').replace(/[^0-9\.-]/g, '')) || 0
    rows.forEach((r) => {
      ftd += n(getVal(r, ['FTD', 'Ftd', 'ftd', 'ftd_count']))
      qftd += n(getVal(r, ['QFTD', 'Qftd', 'qftd']))
      totalCpa += n(
        getVal(r, ['CPA Commission', 'CPA_Commission', 'cpa_commission', 'cpa commission'])
      )
      registrations += n(
        getVal(r, ['Registrations', 'registrations', 'registrazione', 'registration_count'])
      )
      uniqueVisitors += n(
        getVal(r, [
          'Unique Visitors',
          'Unique_Visitors',
          'unique_visitors',
          'unique_visitors_count',
        ])
      )
      visitors += n(getVal(r, ['Visitors', 'visitors']))
      leads += n(getVal(r, ['Leads', 'leads']))
      totalCommission += n(getVal(r, ['Commission', 'commission', 'total_commission']))
      totalPL += n(getVal(r, ['PL', 'pl', 'Profit Loss', 'profit_loss']))
      totalNetDeposits += n(
        getVal(r, ['Net Deposits', 'Net_Deposits', 'net_deposits', 'netDeposits', 'NetDeposits'])
      )
      totalDeposits += n(getVal(r, ['Deposits', 'deposits']))
      totalWithdrawals += n(getVal(r, ['Withdrawals', 'withdrawals']))
    })
    setMediaSummary({
      ftd,
      qftd,
      totalCpa,
      registrations,
      uniqueVisitors,
      visitors,
      leads,
      totalCommission,
      totalPL,
      totalNetDeposits,
      totalDeposits,
      totalWithdrawals,
    })
  }, [filteredMediaData])

  // update csvRecap losingUsersPercentage when mediaSummary changes
  useEffect(() => {
    if (!csvRecap) return
    const next = mediaSummary.totalNetDeposits
      ? (mediaSummary.totalPL / mediaSummary.totalNetDeposits) * 100
      : 0
    setCsvRecap((prev) => {
      if (!prev) return prev
      if (Math.abs((prev.losingUsersPercentage || 0) - next) < 1e-9) return prev
      return { ...prev, losingUsersPercentage: next }
    })
  }, [mediaSummary, csvRecap])

  // filtered media series for chart
  const filteredMediaSeries = useMemo(() => {
    if (!mediaSeries || !mediaSeries.length) return []
    if (!yearFilter || yearFilter === 'all') return mediaSeries
    const y = Number(yearFilter)
    if (isNaN(y)) return mediaSeries
    return mediaSeries.filter((s) => s._ts && new Date(s._ts).getUTCFullYear() === y)
  }, [mediaSeries, yearFilter])

  // filtered reg series for chart
  const filteredRegSeries = useMemo(() => {
    if (!regSeries || !regSeries.length) return []
    if (!yearFilter || yearFilter === 'all') return regSeries
    const y = Number(yearFilter)
    if (isNaN(y)) return regSeries
    return regSeries.filter((s) => s._ts && new Date(s._ts).getUTCFullYear() === y)
  }, [regSeries, yearFilter])

  // choose which source to display
  const effectiveDisplayedCases = useMemo(() => {
    if (useNameGroups && nameGroupCases && nameGroupCases.length) return nameGroupCases
    if (enableClusterCases && derivedCases.length) return derivedCases
    if (multiAccountCases && multiAccountCases.length) return multiAccountCases
    return cases
  }, [useNameGroups, nameGroupCases, enableClusterCases, derivedCases, multiAccountCases, cases])

  const palette = {
    surface: '#071025',
    card: '#0b1724',
    muted: '#9ca3af',
    danger: '#ef4444',
    warning: '#fb923c',
    info: '#60a5fa',
    success: '#10b981',
    accent: '#7c3aed',
  }

  // small neutral icon style for top cards
  const iconBase = {
    width: 18,
    height: 18,
    borderRadius: 4,
    background: '#6b7280',
    display: 'inline-block',
    marginRight: 8,
  }

  // format large financial numbers with K / M and no decimals
  const formatShort = (value) => {
    const n = Number(value) || 0
    const sign = n < 0 ? '-' : ''
    const abs = Math.abs(Math.round(n))
    if (abs >= 1000000) return `${sign}${Math.round(abs / 1000000)}M`
    if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}K`
    return `${sign}${abs}`
  }

  // Build cumulative series from monthly incremental data (month-key-based)
  // Returns { ok: boolean, series: Array, message?: string }
  const cumulativeInfo = useMemo(() => {
    const totalsObj = { totalRegs: 0, totalFtd: 0, totalQftd: 0 }
    if (
      (!filteredMediaSeries || filteredMediaSeries.length === 0) &&
      (!filteredRegSeries || filteredRegSeries.length === 0)
    )
      return { ok: false, series: [], message: 'No source data available', totals: totalsObj }

    // Helpers: strict month-key functions (YYYY-MM) and conversion to Date (UTC first-of-month)
    const pad2 = (n) => String(n).padStart(2, '0')
    const monthKey = (d) => {
      if (!d) return null
      const D = d instanceof Date ? d : new Date(d)
      if (isNaN(D.getTime())) return null
      return `${D.getUTCFullYear()}-${pad2(D.getUTCMonth() + 1)}`
    }
    const monthKeyToDate = (key) => {
      if (!key || typeof key !== 'string') return null
      const m = key.split('-')
      if (m.length !== 2) return null
      const y = Number(m[0])
      const mo = Number(m[1])
      if (isNaN(y) || isNaN(mo)) return null
      return new Date(Date.UTC(y, mo - 1, 1))
    }

    // Strict parse: accept Date objects, numeric ts, ISO date strings, YYYY-MM and MM/YYYY formats.
    const tryParseDate = (item) => {
      if (!item) return null
      // accept objects with _ts or date
      if (item && typeof item === 'object' && item._ts) {
        const n = Number(item._ts)
        if (!isNaN(n)) return new Date(n)
      }
      const raw = item && item.date != null ? item.date : item
      if (!raw && raw !== 0) return null
      // if already a Date
      if (raw instanceof Date) return raw
      const s = String(raw).trim()
      // numeric timestamp
      if (/^\d+$/.test(s)) {
        const n = Number(s)
        const d = new Date(n)
        if (!isNaN(d.getTime())) return d
      }
      // ISO parse
      const iso = Date.parse(s)
      if (!isNaN(iso)) return new Date(iso)
      // MM/YYYY or M/YYYY (e.g. 12/2025)
      const mmyyyy = s.match(/^(\d{1,2})[\/](\d{4})$/)
      if (mmyyyy) {
        const mo = Number(mmyyyy[1])
        const y = Number(mmyyyy[2])
        if (mo >= 1 && mo <= 12 && !isNaN(y)) return new Date(Date.UTC(y, mo - 1, 1))
      }
      // YYYY-MM or YYYY/MM
      const m = s.match(/^(\d{4})[\-\/]?(\d{2})$/)
      if (m) {
        const y = Number(m[1])
        const mo = Number(m[2])
        // Use UTC to avoid timezone shifting the month key (critical for projection/MTD scaling).
        if (!isNaN(y) && !isNaN(mo)) return new Date(Date.UTC(y, mo - 1, 1))
      }
      return null
    }

    // collect per-month counts into maps keyed by YYYY-MM
    const regByMonth = {}
    filteredRegSeries.forEach((r) => {
      const d = tryParseDate(r)
      if (!d) return
      const key = monthKey(d)
      if (!key) return
      regByMonth[key] = (regByMonth[key] || 0) + Number(r.count || 0)
    })

    const ftdByMonth = {}
    const qftdByMonth = {}
    filteredMediaSeries.forEach((m) => {
      const d = tryParseDate(m)
      if (!d) return
      const key = monthKey(d)
      if (!key) return
      ftdByMonth[key] = (ftdByMonth[key] || 0) + Number(m.ftd || 0)
      qftdByMonth[key] = (qftdByMonth[key] || 0) + Number(m.qftd || 0)
    })

    // Determine rangeStart and rangeEnd based on chartRange, yearFilter and available data
    const allKeys = new Set([
      ...Object.keys(regByMonth),
      ...Object.keys(ftdByMonth),
      ...Object.keys(qftdByMonth),
    ])
    // find min/max keys from data
    const sortedKeys = Array.from(allKeys).sort()
    const now = new Date()
    const defaultStart =
      chartRange === 'since2024'
        ? new Date(Date.UTC(2024, 0, 1))
        : sortedKeys.length
          ? monthKeyToDate(sortedKeys[0])
          : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const defaultEnd = sortedKeys.length
      ? monthKeyToDate(sortedKeys[sortedKeys.length - 1])
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    // For 'since2024' we start from September 2024 per request
    let rangeStart =
      chartRange === 'since2024'
        ? new Date(Date.UTC(2024, 8, 1))
        : defaultStart || new Date(Date.UTC(2024, 0, 1))
    // end should be latest between available data and current month
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    let rangeEnd = defaultEnd && defaultEnd > currentMonth ? defaultEnd : currentMonth

    // If a specific year is selected, override rangeStart/rangeEnd to that year
    if (yearFilter && yearFilter !== 'all') {
      const yy = Number(yearFilter)
      if (!isNaN(yy)) {
        rangeStart = new Date(Date.UTC(yy, 0, 1))
        rangeEnd = new Date(Date.UTC(yy, 11, 1))
      }
    }

    // build list of month keys between rangeStart and rangeEnd inclusive
    const months = []
    let cur = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1))
    const lastMonth = new Date(Date.UTC(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), 1))
    while (cur <= lastMonth) {
      months.push(monthKey(cur))
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1))
    }

    // build monthly counts arrays aligned to months list
    const monthlyRegs = months.map((k) => regByMonth[k] || 0)
    const monthlyFtd = months.map((k) => ftdByMonth[k] || 0)
    const monthlyQftd = months.map((k) => qftdByMonth[k] || 0)

    // compute totals
    const totalRegs = monthlyRegs.reduce((s, v) => s + v, 0)
    const totalFtd = monthlyFtd.reduce((s, v) => s + v, 0)
    const totalQftd = monthlyQftd.reduce((s, v) => s + v, 0)

    // cumulative builder per spec
    const buildCumulativeSeries = (monthlyValues) => {
      let sum = 0
      return monthlyValues.map((v) => {
        sum += Number(v || 0)
        return sum
      })
    }

    const cumRegs = buildCumulativeSeries(monthlyRegs)
    const cumFtd = buildCumulativeSeries(monthlyFtd)
    const cumQftd = buildCumulativeSeries(monthlyQftd)

    // assemble final series entries
    const monthKeyToEndTs = (key) => {
      const d = monthKeyToDate(key)
      if (!d) return null
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999))
      return end.getTime()
    }

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

    const series = months.map((k, i) => {
      const d = monthKeyToDate(k)
      // hasData=true when at least one source has an explicit row/month for this key.
      // This is important to avoid treating future months (filled with zeros by range) as real data.
      const hasData = hasOwn(regByMonth, k) || hasOwn(ftdByMonth, k) || hasOwn(qftdByMonth, k)
      return {
        date: d,
        key: k,
        _ts: monthKeyToEndTs(k),
        cumRegs: cumRegs[i],
        cumFTD: cumFtd[i],
        cumQFTD: cumQftd[i],
        regs: monthlyRegs[i],
        ftd: monthlyFtd[i],
        qftd: monthlyQftd[i],
        hasData,
      }
    })

    // Dev-only concise debug log
    try {
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.debug('Cumulative build', {
          rangeStart: rangeStart.toISOString().slice(0, 10),
          rangeEnd: rangeEnd.toISOString().slice(0, 10),
          first: series[0],
          last: series[series.length - 1],
          totals: { totalRegs, totalFtd, totalQftd },
        })
      }
    } catch (e) {
      /* ignore */
    }

    // Validation against expected totals (non-blocking) — compare only real-data end (no projection)
    const expected = { regs: 73473, ftd: 26215, qftd: 21657 }
    const last = series[series.length - 1] || { cumRegs: 0, cumFTD: 0, cumQFTD: 0 }
    const relErr = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b))
    const matches =
      relErr(last.cumRegs, expected.regs) <= 0.01 &&
      relErr(last.cumFTD, expected.ftd) <= 0.01 &&
      relErr(last.cumQFTD, expected.qftd) <= 0.01
    const deltas = {
      regs: last.cumRegs - expected.regs,
      ftd: last.cumFTD - expected.ftd,
      qftd: last.cumQFTD - expected.qftd,
    }
    if (!matches) {
      console.warn('Cumulative totals differ (computed vs expected)', {
        computed: { regs: last.cumRegs, ftd: last.cumFTD, qftd: last.cumQFTD },
        expected,
        deltas,
      })
    }

    const message = matches
      ? 'OK'
      : `Note: totals differ by ${deltas.regs >= 0 ? '+' : ''}${deltas.regs} regs, ${deltas.ftd >= 0 ? '+' : ''}${deltas.ftd} ftd, ${deltas.qftd >= 0 ? '+' : ''}${deltas.qftd} qftd (data source mismatch)`
    const noteExplain =
      'Registrations are sourced from Registrations Report; FTD/QFTD are from Media Report. Small deltas may be due to reporting windows, timezone adjustments, or upstream corrections.'

    return {
      ok: matches,
      series,
      message,
      noteExplain,
      deltas,
      totals: { totalRegs, totalFtd, totalQftd },
      last,
    }
  }, [filteredMediaSeries, filteredRegSeries, chartRange, yearFilter])

  // Linear regression helper (ordinary least squares) on monthly incremental series
  const forecastTo2026 = (series) => {
    if (!series || series.length < 2) return null

    // Extract monthly increments
    const regsM = series.map((s) => Number(s.regs != null ? s.regs : s.regsM != null ? s.regsM : 0))
    const ftdM = series.map((s) => Number(s.ftd != null ? s.ftd : s.ftdM != null ? s.ftdM : 0))
    const qftdM = series.map((s) => Number(s.qftd != null ? s.qftd : s.qftdM != null ? s.qftdM : 0))

    // When data arrives asynchronously across sources (e.g. Media Report updated for Jan 2026
    // but Registrations Report still ends in 2025), the last month may have regs=0.
    // The forecast uses caps based on prevRegsM, so we must anchor to the last meaningful month.
    const lastIndexWhere = (arr, pred) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (pred(arr[i], i)) return i
      }
      return -1
    }
    const lastRegsIdx = lastIndexWhere(regsM, (v) => Number(v) > 0)
    const lastFtdIdx = lastIndexWhere(ftdM, (v) => Number(v) > 0)
    const lastQftdIdx = lastIndexWhere(qftdM, (v) => Number(v) > 0)
    const anchorIdx = Math.max(0, lastRegsIdx !== -1 ? lastRegsIdx : series.length - 1)

    // Helper: EWMA
    const ewma = (arr, alpha = 0.35) => {
      if (!arr.length) return []
      const res = [arr[0]]
      for (let i = 1; i < arr.length; i++) {
        res.push(alpha * arr[i] + (1 - alpha) * res[i - 1])
      }
      return res
    }

    // Helper: rolling median
    const rollingMedian = (arr, window = 3) => {
      const res = []
      for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - Math.floor(window / 2))
        const end = Math.min(arr.length, i + Math.floor(window / 2) + 1)
        const slice = arr.slice(start, end).sort((a, b) => a - b)
        const mid = Math.floor(slice.length / 2)
        res.push(slice[mid])
      }
      return res
    }

    // Compute baselines
    const regsEwma = ewma(regsM)
    const ftdEwma = ewma(ftdM)
    const qftdEwma = ewma(qftdM)

    const regsMedian = rollingMedian(regsM)
    const ftdMedian = rollingMedian(ftdM)
    const qftdMedian = rollingMedian(qftdM)

    const regsBaseline = regsEwma.map((e, i) => 0.6 * e + 0.4 * regsMedian[i])
    const ftdBaseline = ftdEwma.map((e, i) => 0.6 * e + 0.4 * ftdMedian[i])
    const qftdBaseline = qftdEwma.map((e, i) => 0.6 * e + 0.4 * qftdMedian[i])

    // Seasonality: month factors
    const monthFactors = { regs: {}, ftd: {}, qftd: {} }
    series.forEach((s, i) => {
      const month = s.date.getUTCMonth() + 1 // 1-12
      const regsFactor = regsM[i] / Math.max(1, regsBaseline[i])
      const ftdFactor = ftdM[i] / Math.max(1, ftdBaseline[i])
      const qftdFactor = qftdM[i] / Math.max(1, qftdBaseline[i])
      if (!monthFactors.regs[month]) monthFactors.regs[month] = []
      if (!monthFactors.ftd[month]) monthFactors.ftd[month] = []
      if (!monthFactors.qftd[month]) monthFactors.qftd[month] = []
      monthFactors.regs[month].push(regsFactor)
      monthFactors.ftd[month].push(ftdFactor)
      monthFactors.qftd[month].push(qftdFactor)
    })
    Object.keys(monthFactors.regs).forEach((m) => {
      monthFactors.regs[m] = Math.max(
        0.85,
        Math.min(1.2, monthFactors.regs[m].reduce((a, b) => a + b, 0) / monthFactors.regs[m].length)
      )
    })
    Object.keys(monthFactors.ftd).forEach((m) => {
      monthFactors.ftd[m] = Math.max(
        0.85,
        Math.min(1.2, monthFactors.ftd[m].reduce((a, b) => a + b, 0) / monthFactors.ftd[m].length)
      )
    })
    Object.keys(monthFactors.qftd).forEach((m) => {
      monthFactors.qftd[m] = Math.max(
        0.85,
        Math.min(1.2, monthFactors.qftd[m].reduce((a, b) => a + b, 0) / monthFactors.qftd[m].length)
      )
    })

    // Trend: slope from last 6 months
    const last6 = (arr) => arr.slice(Math.max(0, arr.length - 6))
    const slope = (arr) => {
      if (arr.length < 2) return 0
      const deltas = []
      for (let i = 1; i < arr.length; i++) deltas.push(arr[i] - arr[i - 1])
      deltas.sort((a, b) => a - b)
      return deltas[Math.floor(deltas.length / 2)] // median delta
    }
    const regsSlope = slope(last6(regsEwma))
    const ftdSlope = slope(last6(ftdEwma))
    const qftdSlope = slope(last6(qftdEwma))

    // Conversion rates
    const ftdRates = ftdM.map((f, i) => f / Math.max(1, regsM[i]))
    const qftdRates = qftdM.map((q, i) => q / Math.max(1, ftdM[i]))
    const ftdRateEwma = ewma(ftdRates)
    const qftdRateEwma = ewma(qftdRates)

    // Historical max rates for caps
    const maxOf = (arr) => {
      let m = 0
      for (let i = 0; i < arr.length; i++) {
        const v = Number(arr[i] || 0)
        if (v > m) m = v
      }
      return m
    }
    const histMaxFtdRate = Math.min(0.45, maxOf(ftdRates) * 1.1)
    const histMaxQftdRate = Math.min(0.9, maxOf(qftdRates) * 1.1)

    const parseYYYYMMUtc = (yyyymm) => {
      const m = String(yyyymm || '')
        .trim()
        .match(/^(\d{4})-(\d{2})$/)
      if (!m) return null
      const y = Number(m[1])
      const mo = Number(m[2])
      if (isNaN(y) || isNaN(mo) || mo < 1 || mo > 12) return null
      return new Date(Date.UTC(y, mo - 1, 1))
    }

    // Milestones (uplifts (%) wired to the overlay inputs)
    // Note: Solitics is postponed to March 2026.
    const milestones = [
      { key: 'solitics', date: '2026-03', upliftFtd: 0.03, upliftQftd: 0.02 },
      {
        key: 'ui_rollout_feb',
        date: '2026-02',
        upliftFtd: (Number(ftdUpliftFeb) || 0) / 100,
        upliftQftd: (Number(qftdUpliftFeb) || 0) / 100,
      },
      {
        key: 'ui_rollout_mar',
        date: '2026-03',
        upliftFtd: (Number(ftdUpliftMar) || 0) / 100,
        upliftQftd: (Number(qftdUpliftMar) || 0) / 100,
      },
      { key: 'marketing', date: '2026-04', upliftFtd: 0.05, upliftQftd: 0.03 },
    ]

    // Ramp function
    const ramp = (t, start, duration) => Math.max(0, Math.min(1, (t - start) / duration))

    // Projection setup
    const lastDate = series[series.length - 1].date
    const startProj = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth() + 1, 1))
    const endProj = new Date(Date.UTC(2026, 11, 1))
    const projected = []

    let runRegs = series[series.length - 1].cumRegs || 0
    let runFtd = series[series.length - 1].cumFTD || 0
    let runQftd = series[series.length - 1].cumQFTD || 0

    let prevRegsM = lastRegsIdx !== -1 ? regsM[lastRegsIdx] : regsM[regsM.length - 1] || 0
    let prevFtdM = lastFtdIdx !== -1 ? ftdM[lastFtdIdx] : ftdM[ftdM.length - 1] || 0
    let prevQftdM = lastQftdIdx !== -1 ? qftdM[lastQftdIdx] : qftdM[qftdM.length - 1] || 0

    const lastValidFtdRateIdx = lastIndexWhere(
      regsM,
      (v, i) => Number(v) > 0 && Number(ftdM[i]) >= 0
    )
    const lastValidQftdRateIdx = lastIndexWhere(
      ftdM,
      (v, i) => Number(v) > 0 && Number(qftdM[i]) >= 0
    )
    let prevFtdRate =
      lastValidFtdRateIdx !== -1
        ? Number(ftdM[lastValidFtdRateIdx]) / Math.max(1, Number(regsM[lastValidFtdRateIdx]))
        : ftdRateEwma[ftdRateEwma.length - 1] || 0
    let prevQftdRate =
      lastValidQftdRateIdx !== -1
        ? Number(qftdM[lastValidQftdRateIdx]) / Math.max(1, Number(ftdM[lastValidQftdRateIdx]))
        : qftdRateEwma[qftdRateEwma.length - 1] || 0

    const lastBaselineRegs =
      regsBaseline[anchorIdx] != null
        ? regsBaseline[anchorIdx]
        : regsBaseline[regsBaseline.length - 1]
    const lastBaselineFtd =
      ftdBaseline[Math.max(0, lastFtdIdx !== -1 ? lastFtdIdx : anchorIdx)] != null
        ? ftdBaseline[Math.max(0, lastFtdIdx !== -1 ? lastFtdIdx : anchorIdx)]
        : ftdBaseline[ftdBaseline.length - 1]
    const lastBaselineQftd =
      qftdBaseline[Math.max(0, lastQftdIdx !== -1 ? lastQftdIdx : anchorIdx)] != null
        ? qftdBaseline[Math.max(0, lastQftdIdx !== -1 ? lastQftdIdx : anchorIdx)]
        : qftdBaseline[qftdBaseline.length - 1]

    let monthIdx = 0
    for (
      let d = new Date(startProj);
      d <= endProj;
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    ) {
      const month = d.getUTCMonth() + 1
      const year = d.getUTCFullYear()

      // Baseline forecast with trend
      const regsBaselinePred = Math.max(0, lastBaselineRegs + regsSlope * monthIdx)
      const ftdBaselinePred = Math.max(0, lastBaselineFtd + ftdSlope * monthIdx)
      const qftdBaselinePred = Math.max(0, lastBaselineQftd + qftdSlope * monthIdx)

      // Seasonality
      const regsSeason = monthFactors.regs[month] || 1
      const ftdSeason = monthFactors.ftd[month] || 1
      const qftdSeason = monthFactors.qftd[month] || 1

      // Milestones ramp
      let ftdUplift = 0
      let qftdUplift = 0
      milestones.forEach((m) => {
        const mDate = parseYYYYMMUtc(m.date)
        if (!mDate) return
        const monthsSince =
          (year - mDate.getUTCFullYear()) * 12 + (month - (mDate.getUTCMonth() + 1))
        const rampVal = ramp(monthsSince, 0, 3) // 3-month ramp
        ftdUplift += m.upliftFtd * rampVal
        qftdUplift += m.upliftQftd * rampVal
      })

      // Forecast regs
      let regsM_pred = Math.max(0, regsBaselinePred * regsSeason)
      regsM_pred = Math.max(regsM_pred, prevRegsM * 0.8) // min 80% of prev
      regsM_pred = Math.min(regsM_pred, prevRegsM * 1.15) // max 115% growth

      // Forecast rates with smoothing and uplifts
      let ftdRate_pred =
        prevFtdRate * 0.7 + (ftdM[ftdM.length - 1] / Math.max(1, regsM[regsM.length - 1])) * 0.3
      let qftdRate_pred =
        prevQftdRate * 0.7 + (qftdM[qftdM.length - 1] / Math.max(1, ftdM[ftdM.length - 1])) * 0.3

      ftdRate_pred *= 1 + ftdUplift
      qftdRate_pred *= 1 + qftdUplift

      ftdRate_pred = Math.max(0, Math.min(histMaxFtdRate, ftdRate_pred))
      qftdRate_pred = Math.max(0, Math.min(histMaxQftdRate, qftdRate_pred))

      // Derive FTD/QFTD from regs and rates
      let ftdM_pred = regsM_pred * ftdRate_pred
      let qftdM_pred = ftdM_pred * qftdRate_pred

      // Apply caps and smoothing
      ftdM_pred = Math.max(0, Math.min(ftdM_pred, prevFtdM * 1.15))
      qftdM_pred = Math.max(0, Math.min(qftdM_pred, prevQftdM * 1.15))

      // Ensure qftd <= ftd
      qftdM_pred = Math.min(qftdM_pred, ftdM_pred)

      // Round
      regsM_pred = Math.round(regsM_pred)
      ftdM_pred = Math.round(ftdM_pred)
      qftdM_pred = Math.round(qftdM_pred)

      runRegs += regsM_pred
      runFtd += ftdM_pred
      runQftd += qftdM_pred

      projected.push({
        date: new Date(d),
        key: `${year}-${String(month).padStart(2, '0')}`,
        _ts: Date.UTC(year, month - 1, 1),
        regsM: regsM_pred,
        ftdM: ftdM_pred,
        qftdM: qftdM_pred,
        regsCum: runRegs,
        ftdCum: runFtd,
        qftdCum: runQftd,
        ftdRate: ftdRate_pred,
        qftdRate: qftdRate_pred,
      })

      prevRegsM = regsM_pred
      prevFtdM = ftdM_pred
      prevQftdM = qftdM_pred
      prevFtdRate = ftdRate_pred
      prevQftdRate = qftdRate_pred
      monthIdx++
    }

    return { projected }
  }

  // Executive-grade cumulative chart component
  function ExecutiveCumulativeChart({
    data,
    height = 320,
    colors = { regs: '#60a5fa', ftd: '#10b981', qftd: '#f59e0b' },
  }) {
    if (!data || data.length === 0) return null

    const computeSizing = () => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1400
      // Rough breakpoints aligned to common desktop widths:
      // 27" (often 1920+; sometimes 2560+) -> allow a larger max chart
      // 22" (often ~1366-1920) -> medium max chart
      // small desktop/laptop -> compact max chart
      const maxWidthPx =
        vw >= 2100 ? 1400 : vw >= 1600 ? 1200 : vw >= 1200 ? 1000 : vw >= 980 ? 900 : 760
      const responsiveHeight =
        vw >= 2100
          ? Math.max(height, 360)
          : vw >= 1600
            ? Math.max(height, 340)
            : vw >= 1200
              ? Math.max(height, 320)
              : Math.min(height, 280)
      return { maxWidthPx, responsiveHeight }
    }

    const [chartSizing, setChartSizing] = useState(() => computeSizing())

    useEffect(() => {
      const onResize = () => setChartSizing(computeSizing())
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [])

    // Expect `data` to be an ordered array of monthly entries produced by cumulativeInfo:
    // { date: Date, key: 'YYYY-MM', _ts: monthEndTs, regs: monthly, ftd: monthly, qftd: monthly, cumRegs, cumFTD, cumQFTD }
    const series = data
      .map((d) => {
        const ts = d._ts != null ? Number(d._ts) : d.date ? Date.parse(d.date) : NaN
        const dateObj = d.date instanceof Date ? d.date : isNaN(ts) ? null : new Date(ts)
        return {
          date: dateObj,
          _ts: ts,
          regsM: Number(d.regs || 0),
          ftdM: Number(d.ftd || 0),
          qftdM: Number(d.qftd || 0),
          regsCum: Number(d.cumRegs || d.regs || 0),
          ftdCum: Number(d.cumFTD || d.ftd || 0),
          qftdCum: Number(d.cumQFTD || d.qftd || 0),
          ftdRate: d.ftdRate || 0,
          qftdRate: d.qftdRate || 0,
        }
      })
      .filter((s) => s.date && !isNaN(s._ts))
      .sort((a, b) => a._ts - b._ts)
    if (!series.length) return null

    // hover state and refs for interactive tooltip
    const svgRef = useRef(null)
    const [hoverIndex, setHoverIndex] = useState(null)
    const [hoverXY, setHoverXY] = useState(null)

    // hover handlers are defined after fullSeries is computed so they can use totalCount

    // Projection (model-based) up to Dec 2026.
    // IMPORTANT:
    // 1) Ignore trailing months with no source rows (they appear as zeros due to range extension).
    // 2) If MTD scaling is OFF: exclude the current month from model-fitting.
    // 3) If MTD scaling is ON: include the current month, but scale its MTD values to a full-month estimate
    //    (this changes the slope/baseline, as it did previously).
    const dataForForecast = (() => {
      if (!data || data.length < 2) return data

      const pad2 = (n) => String(n).padStart(2, '0')
      const now = new Date()
      const currentKey = `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`

      const sliceToLastHasData = (opts = { excludeCurrentMonth: false }) => {
        const excludeCurrentMonth = !!opts.excludeCurrentMonth

        for (let i = data.length - 1; i >= 0; i--) {
          const row = data[i]
          if (!row || !row.hasData || !row.key) continue
          if (excludeCurrentMonth && row.key === currentKey) continue
          return data.slice(0, i + 1)
        }

        // fallback to whatever we have
        return data
      }

      const base = sliceToLastHasData({ excludeCurrentMonth: !useMtdScaling })
      if (!useMtdScaling) return base

      // Apply MTD scaling to the current month *inside the forecast input*.
      const daysElapsed = now.getUTCDate()
      const daysInMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
      ).getUTCDate()
      if (!daysElapsed || !daysInMonth || daysElapsed <= 0) return base
      if (daysElapsed >= daysInMonth) return base

      const idx = base.findIndex((d) => d && d.key === currentKey && d.hasData)
      if (idx === -1) return base

      const scale = daysInMonth / Math.max(1, daysElapsed)

      // Rebuild a consistent series (monthly increments + cumulative) for the forecaster.
      let runRegs = 0
      let runFtd = 0
      let runQftd = 0
      return base.map((d, i) => {
        const regs = Number(d?.regs || 0)
        const ftd = Number(d?.ftd || 0)
        const qftd = Number(d?.qftd || 0)

        const scaledRegs = i === idx ? Math.round(regs * scale) : regs
        const scaledFtd = i === idx ? Math.round(ftd * scale) : ftd
        const scaledQftd = i === idx ? Math.round(qftd * scale) : qftd

        runRegs += Number(scaledRegs || 0)
        runFtd += Number(scaledFtd || 0)
        runQftd += Number(scaledQftd || 0)

        return {
          ...d,
          regs: scaledRegs,
          ftd: scaledFtd,
          qftd: Math.min(scaledQftd, scaledFtd),
          cumRegs: runRegs,
          cumFTD: runFtd,
          cumQFTD: Math.min(runQftd, runFtd),
          hasData: true,
        }
      })
    })()
    const projInfo = forecastTo2026(dataForForecast)
    const proj =
      projInfo && projInfo.projected && projInfo.projected.length ? projInfo.projected : []

    let maxRegs = 1
    let maxRight = 1
    for (let i = 0; i < series.length; i++) {
      const s = series[i]
      const r = Number(s?.regsCum || 0)
      if (r > maxRegs) maxRegs = r
      const right = Math.max(Number(s?.ftdCum || 0), Number(s?.qftdCum || 0))
      if (right > maxRight) maxRight = right
    }
    for (let i = 0; i < proj.length; i++) {
      const p = proj[i]
      const r = Number(p?.regsCum || 0)
      if (r > maxRegs) maxRegs = r
      const right = Math.max(Number(p?.ftdCum || 0), Number(p?.qftdCum || 0))
      if (right > maxRight) maxRight = right
    }

    const nice = (v) => {
      const exp = Math.pow(10, Math.floor(Math.log10(v)))
      const n = v / exp
      const cap = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
      return cap * exp
    }

    // Clamp primary (left) axis maximum to 250k for executive view
    const rawTopLeft = nice(Math.ceil(maxRegs * 1.08))
    const topLeft = Math.min(rawTopLeft, 250000)
    const topRight = nice(Math.ceil(maxRight * 1.08))

    // SVG sizing: fixed coordinate system; scaled responsively via CSS wrapper
    const W = 1200
    const H = chartSizing.responsiveHeight
    const padL = 88
    const padR = 120
    const padT = 40
    const padB = 68

    const yLeft = (v) => padT + (H - padT - padB) * (1 - v / topLeft)
    const yRight = (v) => padT + (H - padT - padB) * (1 - v / topRight)

    const xFor = (i, totalCountOverride) => {
      const denom = Math.max(
        1,
        typeof totalCountOverride === 'number' ? totalCountOverride : Math.max(1, series.length - 1)
      )
      return padL + (i * (W - padL - padR)) / denom
    }

    // build path (smoothed) from points
    const buildPath = (ptsXY) => {
      if (!ptsXY.length) return ''
      if (ptsXY.length === 1) return `M ${ptsXY[0].x} ${ptsXY[0].y}`
      let d = `M ${ptsXY[0].x} ${ptsXY[0].y}`
      for (let i = 0; i < ptsXY.length - 1; i++) {
        const p0 = i === 0 ? ptsXY[0] : ptsXY[i - 1]
        const p1 = ptsXY[i]
        const p2 = ptsXY[i + 1]
        const p3 = i + 2 < ptsXY.length ? ptsXY[i + 2] : p2
        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
      }
      return d
    }

    // Build full series (real + projected) for consistent x scale and hover
    let projMapped = proj.map((p) => ({
      key: p.key,
      date: p.date,
      _ts: p._ts,
      regsM: p.regsM,
      ftdM: p.ftdM,
      qftdM: p.qftdM,
      regsCum: p.regsCum,
      ftdCum: p.ftdCum,
      qftdCum: p.qftdCum,
      ftdRate: p.ftdRate || 0,
      qftdRate: p.qftdRate || 0,
    }))

    // Month extension (legacy mode): only needed when the forecast *excludes* current month from fitting.
    // If useMtdScaling is ON we now include a scaled current-month point in `dataForForecast`,
    // so projecting the current month and offsetting cumulatives would double-apply.
    ;(() => {
      if (useMtdScaling) return
      if (!projMapped || projMapped.length === 0) return
      const pad2 = (n) => String(n).padStart(2, '0')
      const now = new Date()
      const currentKey = `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`
      const daysElapsed = now.getUTCDate()
      const daysInMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
      ).getUTCDate()
      if (!daysElapsed || daysElapsed <= 0 || !daysInMonth) return
      // if we're at (or beyond) month end, don't scale
      if (daysElapsed >= daysInMonth) return

      const actual = (data || []).find((d) => d && d.key === currentKey && d.hasData)
      if (!actual) return

      const projIdx = projMapped.findIndex((p) => p && p.key === currentKey)
      if (projIdx === -1) return

      const scale = daysInMonth / Math.max(1, daysElapsed)
      const est = {
        regsM: actual.regs != null ? Math.round(Number(actual.regs || 0) * scale) : null,
        ftdM: actual.ftd != null ? Math.round(Number(actual.ftd || 0) * scale) : null,
        qftdM: actual.qftd != null ? Math.round(Number(actual.qftd || 0) * scale) : null,
      }

      const prev =
        projIdx === 0 ? series[series.length - 1] || null : projMapped[projIdx - 1] || null
      if (!prev) return

      const old = projMapped[projIdx]
      const prevRegsCum = Number(prev.regsCum || 0)
      const prevFtdCum = Number(prev.ftdCum || 0)
      const prevQftdCum = Number(prev.qftdCum || 0)

      const newRegsM = est.regsM != null && !isNaN(est.regsM) ? Math.max(0, est.regsM) : old.regsM
      const newFtdM = est.ftdM != null && !isNaN(est.ftdM) ? Math.max(0, est.ftdM) : old.ftdM
      const newQftdM =
        est.qftdM != null && !isNaN(est.qftdM)
          ? Math.max(0, Math.min(est.qftdM, newFtdM))
          : old.qftdM

      const newRegsCum = prevRegsCum + Number(newRegsM || 0)
      const newFtdCum = prevFtdCum + Number(newFtdM || 0)
      const newQftdCum = prevQftdCum + Number(newQftdM || 0)

      const dRegs = newRegsCum - Number(old.regsCum || 0)
      const dFtd = newFtdCum - Number(old.ftdCum || 0)
      const dQftd = newQftdCum - Number(old.qftdCum || 0)

      // apply adjustment: rewrite this month, then offset all future cumulatives
      projMapped = projMapped.map((p, i) => {
        if (!p) return p
        if (i < projIdx) return p
        if (i === projIdx) {
          return {
            ...p,
            regsM: newRegsM,
            ftdM: newFtdM,
            qftdM: newQftdM,
            regsCum: newRegsCum,
            ftdCum: newFtdCum,
            qftdCum: newQftdCum,
          }
        }
        return {
          ...p,
          regsCum: Number(p.regsCum || 0) + dRegs,
          ftdCum: Number(p.ftdCum || 0) + dFtd,
          qftdCum: Number(p.qftdCum || 0) + dQftd,
        }
      })
    })()
    const fullSeries = [...series, ...projMapped]
    const totalCount = Math.max(1, fullSeries.length - 1)

    // hover handlers use fullSeries and totalCount so they map across projections too
    const onMouseMove = (e) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const xRel = e.clientX - rect.left
      const xInView = (xRel / rect.width) * W
      let best = 0,
        bestDist = Infinity
      fullSeries.forEach((s, i) => {
        const dx = Math.abs(xInView - xFor(i, totalCount))
        if (dx < bestDist) {
          bestDist = dx
          best = i
        }
      })
      const s = fullSeries[best]
      setHoverIndex(best)
      setHoverXY({
        x: xFor(best, totalCount),
        regsY: yLeft(s.regsCum),
        ftdY: yRight(s.ftdCum),
        qftdY: yRight(s.qftdCum),
        clientX: xRel,
        clientY: e.clientY - rect.top,
        isProjected: best >= series.length,
      })
    }
    const onMouseLeave = () => {
      setHoverIndex(null)
      setHoverXY(null)
    }

    const regsPts = series.map((s, i) => ({ x: xFor(i, totalCount), y: yLeft(s.regsCum) }))
    const ftdPts = series.map((s, i) => ({ x: xFor(i, totalCount), y: yRight(s.ftdCum) }))
    const qftdPts = series.map((s, i) => ({ x: xFor(i, totalCount), y: yRight(s.qftdCum) }))

    const projRegsPts = projMapped.map((p, j) => ({
      x: xFor(series.length + j, totalCount),
      y: yLeft(p.regsCum),
    }))
    const projFtdPts = projMapped.map((p, j) => ({
      x: xFor(series.length + j, totalCount),
      y: yRight(p.ftdCum),
    }))
    const projQftdPts = projMapped.map((p, j) => ({
      x: xFor(series.length + j, totalCount),
      y: yRight(p.qftdCum),
    }))

    // X labels: show up to 8 ticks evenly spaced
    const maxXlabels = 8
    const step = Math.max(1, Math.ceil(series.length / maxXlabels))

    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ padding: 6, position: 'relative', flex: '1 1 980px', minWidth: 320 }}>
          <div
            style={{
              width: '100%',
              maxWidth: chartSizing.maxWidthPx,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <div style={{ width: '100%', aspectRatio: `${W} / ${H}` }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', height: '100%', display: 'block' }}
                role="img"
                aria-label={t('fraud.chart.aria.platformGrowthCumulative')}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
              >
                {/* subtle horizontal guides for left axis only */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const v = Math.round(i * (topLeft / 3))
                  const y = yLeft(v)
                  return (
                    <line
                      key={i}
                      x1={padL}
                      x2={W - padR}
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.03)"
                    />
                  )
                })}

                {/* lines */}
                <path
                  d={buildPath(regsPts)}
                  fill="none"
                  stroke={colors.regs}
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={buildPath(ftdPts)}
                  fill="none"
                  stroke={colors.ftd}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={buildPath(qftdPts)}
                  fill="none"
                  stroke={colors.qftd}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* projected (dashed) */}
                {projRegsPts.length > 0 && (
                  <path
                    d={buildPath([regsPts[regsPts.length - 1], ...projRegsPts])}
                    fill="none"
                    stroke={colors.regs}
                    strokeWidth={2.4}
                    strokeDasharray="6 6"
                    opacity={0.7}
                  />
                )}
                {projFtdPts.length > 0 && (
                  <path
                    d={buildPath([ftdPts[ftdPts.length - 1], ...projFtdPts])}
                    fill="none"
                    stroke={colors.ftd}
                    strokeWidth={1.8}
                    strokeDasharray="6 6"
                    opacity={0.9}
                  />
                )}
                {projQftdPts.length > 0 && (
                  <path
                    d={buildPath([qftdPts[qftdPts.length - 1], ...projQftdPts])}
                    fill="none"
                    stroke={colors.qftd}
                    strokeWidth={1.8}
                    strokeDasharray="6 6"
                    opacity={0.9}
                  />
                )}

                {/* curve end labels */}
                {projFtdPts.length > 0 &&
                  (() => {
                    const last = projFtdPts[projFtdPts.length - 1]
                    return (
                      <text
                        x={last.x + 10}
                        y={last.y}
                        fontSize={12}
                        fill={colors.ftd}
                        fontWeight={600}
                      >
                        FTD
                      </text>
                    )
                  })()}
                {projQftdPts.length > 0 &&
                  (() => {
                    const last = projQftdPts[projQftdPts.length - 1]
                    return (
                      <text
                        x={last.x + 10}
                        y={last.y + 15}
                        fontSize={12}
                        fill={colors.qftd}
                        fontWeight={600}
                      >
                        QFTD
                      </text>
                    )
                  })()}

                {/* forecast separator */}
                {projMapped.length > 0 &&
                  (() => {
                    const leftLastX = xFor(series.length - 1, totalCount)
                    const nextX = xFor(series.length, totalCount)
                    const sepX = leftLastX + (nextX - leftLastX) / 2
                    return (
                      <g>
                        <line
                          x1={sepX}
                          x2={sepX}
                          y1={padT - 6}
                          y2={H - padB + 6}
                          stroke="rgba(255,255,255,0.04)"
                          strokeDasharray="4 6"
                        />
                        <text x={sepX + 6} y={padT - 12} fontSize={12} fill="#9ca3af">
                          Forecast
                        </text>
                      </g>
                    )
                  })()}

                {/* milestone markers */}
                {(() => {
                  const milestones = [
                    {
                      month: 2,
                      year: 2026,
                      label: 'New user portal / UI rollout',
                      color: '#3b82f6',
                    },
                    {
                      month: 3,
                      year: 2026,
                      label: 'Solitics live (Retention tool)',
                      color: '#10b981',
                    },
                    { month: 4, year: 2026, label: 'Marketing team operational', color: '#f59e0b' },
                  ]
                  return milestones.map((m, idx) => {
                    const targetDate = new Date(Date.UTC(m.year, m.month - 1, 1))
                    const idxInFull = fullSeries.findIndex(
                      (s) => s.date && s.date.getTime() === targetDate.getTime()
                    )
                    if (idxInFull === -1) return null
                    const x = xFor(idxInFull, totalCount)
                    const yTop = padT + 20 + idx * 30
                    return (
                      <g key={`milestone-${idx}`}>
                        <line
                          x1={x}
                          x2={x}
                          y1={padT}
                          y2={H - padB}
                          stroke={m.color}
                          strokeWidth={1.5}
                          strokeDasharray="2 4"
                          opacity={0.8}
                        />
                        <circle cx={x} cy={yTop} r={4} fill={m.color} />
                        <rect
                          x={x + 8}
                          y={yTop - 12}
                          width={m.label.length * 6 + 10}
                          height={20}
                          fill="rgba(0,0,0,0.7)"
                          rx={4}
                        />
                        <text x={x + 12} y={yTop + 3} fontSize={11} fill="#fff">
                          {m.label}
                        </text>
                      </g>
                    )
                  })
                })()}

                {/* hover markers */}
                {hoverIndex !== null && hoverXY && (
                  <g>
                    <line
                      x1={hoverXY.x}
                      x2={hoverXY.x}
                      y1={padT}
                      y2={H - padB}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="3 4"
                    />
                    <circle
                      cx={hoverXY.x}
                      cy={hoverXY.regsY}
                      r={4.5}
                      fill={colors.regs}
                      stroke="#000"
                      strokeWidth={0.8}
                    />
                    <circle
                      cx={hoverXY.x}
                      cy={hoverXY.ftdY}
                      r={3.5}
                      fill={colors.ftd}
                      stroke="#000"
                      strokeWidth={0.6}
                    />
                    <circle
                      cx={hoverXY.x}
                      cy={hoverXY.qftdY}
                      r={3.5}
                      fill={colors.qftd}
                      stroke="#000"
                      strokeWidth={0.6}
                    />
                  </g>
                )}

                {/* X axis ticks and labels (cover real + projected months) */}
                {(() => {
                  const stepFull = Math.max(1, Math.ceil(fullSeries.length / maxXlabels))
                  return fullSeries.map((s, i) => {
                    if (i % stepFull !== 0 && i !== fullSeries.length - 1) return null
                    const x = xFor(i, totalCount)
                    const label =
                      s && s.date
                        ? s.date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                        : ''
                    return (
                      <g key={`xl-${i}`}>
                        <line
                          x1={x}
                          x2={x}
                          y1={H - padB + 2}
                          y2={H - padB + 8}
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <text
                          x={x}
                          y={H - padB + 26}
                          fontSize={11}
                          fill="#9ca3af"
                          textAnchor="middle"
                        >
                          {label}
                        </text>
                      </g>
                    )
                  })
                })()}

                {/* left axis labels */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const v = Math.round(i * (topLeft / 3))
                  const y = yLeft(v)
                  return (
                    <text
                      key={`ly-${i}`}
                      x={padL - 14}
                      y={y + 4}
                      fontSize={12}
                      fill="#9ca3af"
                      textAnchor="end"
                    >
                      {formatShort(v)}
                    </text>
                  )
                })}

                {/* right axis labels */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const v = Math.round(i * (topRight / 3))
                  const y = yRight(v)
                  return (
                    <text
                      key={`ry-${i}`}
                      x={W - padR + 14}
                      y={y + 4}
                      fontSize={12}
                      fill="#9ca3af"
                      textAnchor="start"
                    >
                      {formatShort(v)}
                    </text>
                  )
                })}

                {/* Bullwaves logo watermark */}
                <image
                  href="/Logo.png"
                  x={padL + 10}
                  y={padT}
                  width={120}
                  height={120}
                  opacity={0.25}
                />
              </svg>
            </div>

            {/* floating tooltip box (HTML) */}
            {hoverIndex !== null &&
              hoverXY &&
              svgRef.current &&
              (() => {
                const rect = svgRef.current.getBoundingClientRect()
                const left = Math.min(Math.max(hoverXY.clientX + 12, 8), rect.width - 200)
                const top = Math.min(Math.max(hoverXY.clientY - 60, 8), rect.height - 120)
                const s = fullSeries[hoverIndex]
                const isProj = hoverXY && hoverXY.isProjected
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: left,
                      top: top,
                      background: palette.card,
                      color: '#e6eef8',
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      pointerEvents: 'none',
                      boxShadow: '0 6px 18px rgba(2,6,23,0.7)',
                      minWidth: 200,
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                      {s.date
                        ? s.date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
                        : ''}{' '}
                      {isProj ? '(Projected)' : ''}
                    </div>
                    {(() => {
                      const milestones = [
                        { month: 2, year: 2026, label: 'New user portal / UI rollout' },
                        { month: 3, year: 2026, label: 'Solitics live (Retention tool)' },
                        { month: 4, year: 2026, label: 'Marketing team operational' },
                      ]
                      const m = milestones.find(
                        (mil) =>
                          mil.month === (s.date ? s.date.getUTCMonth() + 1 : 0) &&
                          mil.year === (s.date ? s.date.getUTCFullYear() : 0)
                      )
                      return m ? (
                        <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 4 }}>
                          🚀 {m.label}
                        </div>
                      ) : null
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ color: '#9ca3af' }}>Registrations (cum)</div>
                      <div style={{ fontWeight: 800 }}>{(s.regsCum || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ color: '#9ca3af' }}>Registrations (month)</div>
                      <div style={{ fontWeight: 700 }}>{(s.regsM || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ color: '#9ca3af' }}>FTD (cum)</div>
                      <div style={{ fontWeight: 800, color: colors.ftd }}>
                        {s.ftdCum.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ color: '#9ca3af' }}>QFTD (cum)</div>
                      <div style={{ fontWeight: 800, color: colors.qftd }}>
                        {s.qftdCum.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ height: 6 }} />
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}
                    >
                      <div style={{ fontSize: 12 }}>Regs (month)</div>
                      <div style={{ fontWeight: 700 }}>{s.regsM.toLocaleString()}</div>
                    </div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}
                    >
                      <div style={{ fontSize: 12 }}>FTD (month)</div>
                      <div style={{ fontWeight: 700 }}>{s.ftdM.toLocaleString()}</div>
                    </div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}
                    >
                      <div style={{ fontSize: 12 }}>QFTD (month)</div>
                      <div style={{ fontWeight: 700 }}>{s.qftdM.toLocaleString()}</div>
                    </div>
                    {s.ftdRate != null && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#9ca3af',
                        }}
                      >
                        <div style={{ fontSize: 12 }}>FTD Rate</div>
                        <div style={{ fontWeight: 700 }}>{(s.ftdRate * 100).toFixed(1)}%</div>
                      </div>
                    )}
                    {s.qftdRate != null && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#9ca3af',
                        }}
                      >
                        <div style={{ fontSize: 12 }}>QFTD Rate</div>
                        <div style={{ fontWeight: 700 }}>{(s.qftdRate * 100).toFixed(1)}%</div>
                      </div>
                    )}
                    {proj &&
                      proj.length > 0 &&
                      (() => {
                        const lastProj = proj[proj.length - 1]
                        return (
                          <div
                            style={{
                              marginTop: 8,
                              borderTop: '1px dashed rgba(255,255,255,0.04)',
                              paddingTop: 8,
                            }}
                          >
                            <div style={{ color: '#9ca3af', fontSize: 12 }}>
                              Projected (Dec 2026)
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 6,
                              }}
                            >
                              <div style={{ color: '#9ca3af' }}>Regs</div>
                              <div style={{ fontWeight: 800 }}>
                                {(lastProj.regsCum || 0).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ color: '#9ca3af' }}>FTD</div>
                              <div style={{ fontWeight: 800, color: colors.ftd }}>
                                {(lastProj.ftdCum || 0).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ color: '#9ca3af' }}>QFTD</div>
                              <div style={{ fontWeight: 800, color: colors.qftd }}>
                                {(lastProj.qftdCum || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                  </div>
                )
              })()}
          </div>

          {/* Legend — clear, in requested order (placed under the chart) */}
          <div
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              marginTop: 12,
              color: '#cbd5e1',
              fontSize: 13,
              justifyContent: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, background: colors.regs }} /> Registrations
              (cumulative)
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, background: colors.ftd }} /> FTD (cumulative)
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, background: colors.qftd }} /> QFTD (cumulative)
            </div>
          </div>
        </div>

        {/* Controls (kept out of the chart area to avoid overlap) */}
        <div style={{ flex: '0 0 220px', minWidth: 220, padding: 6 }}>
          <div
            style={{
              background: palette.card,
              color: '#fff',
              padding: 10,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Uplifts (%)</div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                color: '#e2e8f0',
              }}
            >
              <input
                type="checkbox"
                checked={useMtdScaling}
                onChange={(e) => setUseMtdScaling(!!e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                MTD scaling (estendi mese corrente)
              </span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#9ca3af', fontSize: 11 }}>FTD Feb</label>
                <input
                  type="number"
                  value={ftdUpliftFeb}
                  onChange={(e) => setFtdUpliftFeb(Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    padding: '6px 8px',
                    borderRadius: 6,
                    width: '100%',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#9ca3af', fontSize: 11 }}>FTD Mar</label>
                <input
                  type="number"
                  value={ftdUpliftMar}
                  onChange={(e) => setFtdUpliftMar(Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    padding: '6px 8px',
                    borderRadius: 6,
                    width: '100%',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#9ca3af', fontSize: 11 }}>QFTD Feb</label>
                <input
                  type="number"
                  value={qftdUpliftFeb}
                  onChange={(e) => setQftdUpliftFeb(Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    padding: '6px 8px',
                    borderRadius: 6,
                    width: '100%',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#9ca3af', fontSize: 11 }}>QFTD Mar</label>
                <input
                  type="number"
                  value={qftdUpliftMar}
                  onChange={(e) => setQftdUpliftMar(Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    padding: '6px 8px',
                    borderRadius: 6,
                    width: '100%',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const MAX_VISIBLE_CASES = 300
  const visible = useMemo(() => {
    const out = []
    const q = query ? query.toLowerCase() : ''
    for (const c of effectiveDisplayedCases || []) {
      if (severity !== 'ALL' && c.severity !== severity) continue
      if (
        affiliateFilter &&
        String(c.details?.affiliate || c.details?.affiliateSummary || '').indexOf(
          affiliateFilter
        ) === -1
      )
        continue
      if (q) {
        const matches =
          (c.title || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.details?.name || '').toLowerCase().includes(q) ||
          String(c.details?.affiliate || c.details?.affiliateSummary || '').includes(q)
        if (!matches) continue
      }
      out.push(c)
      if (out.length >= MAX_VISIBLE_CASES) break
    }
    return out
  }, [effectiveDisplayedCases, severity, affiliateFilter, query])

  const casesAreCapped = useMemo(() => {
    const total = (effectiveDisplayedCases && effectiveDisplayedCases.length) || 0
    return total > MAX_VISIBLE_CASES && visible.length >= MAX_VISIBLE_CASES
  }, [effectiveDisplayedCases, visible])

  // Expand displayed cases into per-account records for recap calculations
  const accounts = useMemo(() => {
    const a = []
    const MAX_ACCOUNTS_EXPAND = 5000
    ;(visible || []).forEach((c) => {
      const count = c.details?.accountCount || 1
      const depositCountTotal = c.details?.depositCount || c.details?.totalDepositCount || 0
      const avgEquity =
        c.details?.avgEquity ||
        (c.details?.totalEquity
          ? c.details.totalEquity / Math.max(1, c.details.accountCount || 1)
          : 0)
      const avgProfit = c.details?.avgProfit || 0
      const avgLoss = c.details?.avgLoss || 0
      for (let i = 0; i < count; i++) {
        if (a.length >= MAX_ACCOUNTS_EXPAND) break
        // distribute depositCount across accounts evenly (approx)
        const perAccountDeposits = count > 0 ? Math.round(depositCountTotal / count) : 0
        a.push({
          id: `${c.id}-${i}`,
          holderName: c.details?.name || '—',
          affiliate: c.details?.affiliate || c.details?.affiliateSummary || '',
          depositCount: perAccountDeposits,
          equity: avgEquity,
          profit: avgProfit,
          loss: avgLoss,
        })
      }
    })
    return a
  }, [visible])

  // Recap metrics
  const recap = useMemo(() => {
    const totalAccounts = accounts.length
    const holders = {}
    accounts.forEach((acc) => {
      holders[acc.holderName] = (holders[acc.holderName] || 0) + 1
    })
    const uniqueHolders = Object.keys(holders).length
    const singleAccountHolders = Object.values(holders).filter((v) => v === 1).length
    const accountsAssociatedSameName = Object.values(holders)
      .filter((v) => v > 1)
      .reduce((s, v) => s + v, 0)
    const withDeposit = accounts.filter((a) => a.depositCount > 0).length

    // deposit buckets of size 5: 1-5,6-10,...
    const maxDeposits = Math.max(0, ...accounts.map((a) => a.depositCount))
    const maxBucket = Math.ceil(maxDeposits / 5)
    const buckets = {}
    for (let i = 1; i <= Math.max(1, maxBucket); i++) buckets[i] = 0
    accounts.forEach((a) => {
      if (a.depositCount <= 0) return
      const idx = Math.floor((a.depositCount - 1) / 5) + 1
      buckets[idx] = (buckets[idx] || 0) + 1
    })

    const avgEquity = accounts.length
      ? accounts.reduce((s, a) => s + (Number(a.equity) || 0), 0) / accounts.length
      : 0
    const avgProfit = accounts.length
      ? accounts.reduce((s, a) => s + (Number(a.profit) || 0), 0) / accounts.length
      : 0
    const avgLoss = accounts.length
      ? accounts.reduce((s, a) => s + (Number(a.loss) || 0), 0) / accounts.length
      : 0

    // Calculate losing users (users with negative profit or positive loss)
    const losingUsersCount = accounts.filter(
      (a) => (Number(a.profit) || 0) < 0 || (Number(a.loss) || 0) > 0
    ).length
    const losingUsersPercentage = totalAccounts > 0 ? (losingUsersCount / totalAccounts) * 100 : 0

    return {
      totalAccounts,
      uniqueHolders,
      singleAccountHolders,
      accountsAssociatedSameName,
      withDeposit,
      buckets,
      avgEquity,
      avgProfit,
      avgLoss,
      losingUsersCount,
      losingUsersPercentage,
    }
  }, [accounts])

  const extendedMediaSummary = useMemo(() => {
    if (!filteredMediaData) return {}
    const getVal = (obj, keys) => {
      for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k]
      return ''
    }
    const n = (s) => parseFloat(String(s || '').replace(/[^0-9\.-]/g, '')) || 0
    const deposits = sum(filteredMediaData.map((r) => n(getVal(r, ['Deposits', 'deposits']))))
    const withdrawals = sum(
      filteredMediaData.map((r) => n(getVal(r, ['Withdrawals', 'withdrawals'])))
    )
    const netDeposits = sum(
      filteredMediaData.map((r) => n(getVal(r, ['Net Deposits', 'net_deposits', 'NetDeposits'])))
    )
    const pl = sum(filteredMediaData.map((r) => n(getVal(r, ['PL', 'pl']))))
    const commissions = sum(
      filteredMediaData.map((r) => n(getVal(r, ['Commission', 'commission'])))
    )
    const payingUsers = displayCsvRecap ? displayCsvRecap.payingUsers : 0
    const arpu = payingUsers > 0 ? pl / payingUsers : 0
    const cpa = payingUsers > 0 ? commissions / payingUsers : 0
    return { deposits, withdrawals, netDeposits, pl, commissions, arpu, cpa }
  }, [filteredMediaData, displayCsvRecap])

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  function markReviewed(id) {
    setReviewedIds((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }
  function bulkMarkReviewed() {
    setReviewedIds((prev) => {
      const s = new Set(prev)
      selectedIds.forEach((id) => s.add(id))
      return s
    })
    setSelectedIds([])
  }
  function exportSelected() {
    if (import.meta.env.DEV) {
      console.log(
        'Export',
        (effectiveDisplayedCases || []).filter((c) => selectedIds.includes(c.id))
      )
    }
    alert(`Exporting ${selectedIds.length} cases (console).`)
  }

  function openModal(c) {
    setModalCase(c)
  }
  function closeModal() {
    setModalCase(null)
  }
  function openCommissionsModal() {
    setIsCommissionsModalOpen(true)
  }
  function closeCommissionsModal() {
    setIsCommissionsModalOpen(false)
  }

  if (initialLoading) {
    return (
      <FullPageLoader
        progress={initialProgress}
        subtitle={t('fraud.loader.dashboardData')}
        colors={{
          surface: palette.surface,
          muted: palette.muted,
          accent: palette.info,
          barBg: 'rgba(255,255,255,0.08)',
        }}
      />
    )
  }

  return (
    <div style={{ padding: 16, color: '#dbeafe' }}>
      {/* Top recap cards from Registrations Report (always reserve space to avoid layout shift) */}
      <div style={{ fontWeight: 800, marginBottom: 6 }}>User Behavior</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div
          onMouseEnter={() => setHoverSource('Media Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
              Unique Visitors (Media)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {mediaLoaded ? Math.round(mediaSummary.uniqueVisitors || 0) : '—'}
            </div>
          </div>
        </div>

        <div
          onMouseEnter={() => setHoverSource('Media Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M19 8v6m3-3h-6"></path>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
              Registrations (Media)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {mediaLoaded ? Math.round(mediaSummary.registrations || 0) : '—'}
            </div>
          </div>
        </div>

        <div
          onMouseEnter={() => setHoverSource('Registrations Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05))',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            style={{ marginRight: 12 }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
              Unique registered accounts (app)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {csvLoaded && displayCsvRecap ? displayCsvRecap.uniqueAccountIds : '—'}
            </div>
          </div>
        </div>
        {/* Removed: Avg cost / registered user (app) - hidden per spec */}
        <div
          onMouseEnter={() => setHoverSource('Registration Gap')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(139, 69, 19, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 210,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b4513"
            strokeWidth="2"
            style={{ marginRight: 12 }}
          >
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Registration Gap</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {mediaLoaded && csvLoaded && displayCsvRecap
                ? Math.round(
                    (mediaSummary.registrations || 0) -
                      (comparableRegistrationsCount ?? displayCsvRecap.uniqueAccountIds ?? 0)
                  )
                : '—'}
            </div>
          </div>
        </div>
        <div
          onMouseEnter={() => setHoverSource('Media Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05))',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 170,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            style={{ marginRight: 12 }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8"></path>
            <path d="M12 18V6"></path>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>FTD (Media)</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {mediaLoaded ? Math.round(mediaSummary.ftd || 0) : '—'}
            </div>
          </div>
        </div>
        <div
          onMouseEnter={() => setHoverSource('Media Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 170,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            style={{ marginRight: 12 }}
          >
            <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"></polygon>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>QFTD (Media)</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {mediaLoaded ? Math.round(mediaSummary.qftd || 0) : '—'}
            </div>
          </div>
        </div>
        <div
          onMouseEnter={() => setHoverSource('Losing ratio')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"></path>
            <path d="M9 5a2 2 0 1 2 2 2v2H5V7a2 2 0 0 1 2-2z"></path>
            <path d="M21 5a2 2 0 1 2 2 2v2h-4V7a2 2 0 0 1 2-2z"></path>
            <path d="M21 19v-6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"></path>
            <line x1="12" y1="3" x2="12" y2="21"></line>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Losing ratio %</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {csvLoaded && displayCsvRecap
                ? displayCsvRecap.losingUsersPercentage.toFixed(1) + '%'
                : '—'}
            </div>
          </div>
        </div>
        <div
          onMouseEnter={() => setHoverSource('Registrations Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
              Total deposits (count)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {csvLoaded && displayCsvRecap && displayCsvRecap.depositStats
                ? displayCsvRecap.depositStats.total
                : '—'}
            </div>
          </div>
        </div>
        <div
          onMouseEnter={() => setHoverSource('Registrations Report.csv')}
          onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
          onMouseLeave={() => {
            setHoverSource(null)
            setHoverXY(null)
          }}
          style={{
            background:
              'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            padding: 12,
            borderRadius: 12,
            minWidth: 200,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            style={{ marginRight: 10 }}
          >
            <path d="M3 3v18h18"></path>
            <path d="M18 9l-5 5-3-3-5 5"></path>
          </svg>
          <div>
            <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
              Avg deposits (depositors)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
              {csvLoaded && displayCsvRecap && displayCsvRecap.depositStats
                ? formatShort(Number(displayCsvRecap.depositStats.avg || 0))
                : '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, marginBottom: 16 }}>
        <div style={{ color: palette.muted, marginBottom: 8 }}>Financial Summary</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div
            onMouseEnter={() => setHoverSource('Media Report.csv')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8m-4-4v8"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Total Deposits</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.deposits || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('Media Report.csv')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
                Total Withdrawals
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.withdrawals || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('Media Report.csv')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8m-4-4v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Net Deposits</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.netDeposits || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('Media Report.csv')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <path d="M3 3v18h18"></path>
              <path d="M18 9l-5 5-3-3-5 5"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Total PL</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.pl || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('ARPU')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(103, 232, 249, 0.05))',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M16 11l2 2 4-4"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>ARPU</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.arpu || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
          <div
            onClick={() => {
              if (displayRegCommissionsSummary) openCommissionsModal()
            }}
            onMouseEnter={() => setHoverSource('Registrations Report.csv')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: displayRegCommissionsSummary ? 'pointer' : 'default',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
                Total Commissions
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {displayRegCommissionsSummary
                  ? `${formatShort(displayRegCommissionsSummary.total || 0)} EUR`
                  : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('Media Report.csv')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <path d="M12 1v22"></path>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>
                Total Commissions (Media)
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.commissions || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('Commissions Gap')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(139, 69, 19, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8b4513"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Commissions Gap</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded && displayRegCommissionsSummary
                  ? `${formatShort((extendedMediaSummary.commissions || 0) - (displayRegCommissionsSummary.total || 0))} EUR`
                  : '—'}
              </div>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoverSource('Avg CPA (paying accounts)')}
            onMouseMove={(e) => setHoverXY({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoverSource(null)
              setHoverXY(null)
            }}
            style={{
              background:
                'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(139, 69, 19, 0.2)',
              padding: 12,
              borderRadius: 12,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8b4513"
              strokeWidth="2"
              style={{ marginRight: 10 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Avg CPA</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#dbeafe' }}>
                {mediaLoaded ? `${formatShort(extendedMediaSummary.cpa || 0)} EUR` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hoverSource && hoverXY && (
        <div
          style={{
            position: 'fixed',
            left: hoverXY.x + 12,
            top: hoverXY.y + 12,
            background: palette.card,
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 12,
            color: '#cbd5e1',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {hoverSource === 'Registration Gap' ? (
            <div>
              <div>Source: Media Report.csv & Registrations Report.csv</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>
                Calculation: Media registrations (month-aggregated) − unique registrations within
                the same Media month range.
              </div>
            </div>
          ) : hoverSource === 'Avg CPA (paying accounts)' ? (
            <div>
              <div>Source: Media Report.csv & Registrations Report.csv</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>
                Cost Per Acquisition (paying accounts only). Total commissions ÷ users with
                deposits.
              </div>
              <div style={{ marginTop: 4, fontSize: 11 }}>
                Value: {mediaLoaded ? formatShort(extendedMediaSummary.cpa || 0) : '—'} EUR (
                {mediaLoaded ? formatShort(extendedMediaSummary.commissions || 0) : '—'} ÷{' '}
                {displayCsvRecap ? displayCsvRecap.payingUsers : 1})
              </div>
            </div>
          ) : hoverSource === 'Total PL' ? (
            <div>
              <div>Source: Media Report.csv</div>
            </div>
          ) : hoverSource === 'ARPU' ? (
            <div>
              <div>Source: Media Report.csv & Registrations Report.csv</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>
                Average Revenue Per User (paying accounts only). Total PL ÷ users with deposits.
              </div>
              <div style={{ marginTop: 4, fontSize: 11 }}>
                Value: {mediaLoaded ? formatShort(extendedMediaSummary.arpu || 0) : '—'} EUR (
                {mediaLoaded ? formatShort(extendedMediaSummary.pl || 0) : '—'} ÷{' '}
                {displayCsvRecap ? displayCsvRecap.payingUsers : 1})
              </div>
            </div>
          ) : hoverSource === 'Total Deposits' ? (
            <div>
              <div>Source: Media Report.csv</div>
            </div>
          ) : hoverSource === 'Total Withdrawals' ? (
            <div>
              <div>Source: Media Report.csv</div>
            </div>
          ) : hoverSource === 'Net Deposits' ? (
            <div>
              <div>Source: Media Report.csv</div>
            </div>
          ) : hoverSource === 'Losing ratio' ? (
            <div>
              <div>Source: Media Report.csv</div>
              <div>Calculation: Total PL / Total Net Deposits * 100</div>
            </div>
          ) : hoverSource === 'Media Report.csv' ? (
            <div>
              <div>Source: Media Report.csv</div>
            </div>
          ) : (
            <div>Source: {hoverSource}</div>
          )}
        </div>
      )}

      {/* cumulative chart */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ color: palette.muted }}>Platform growth (cumulative)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: palette.muted, fontSize: 13 }}>Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ background: palette.card, color: '#fff', padding: 6, borderRadius: 6 }}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y === 'all' ? 'All' : y}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* inputs moved inside chart as overlay */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {(() => {
              const start2025 = Date.UTC(2025, 0, 1) // Jan 2025 start
              const info = cumulativeInfo || {
                ok: false,
                series: [],
                message: 'No cumulative data',
              }
              let chartSeries = info.series || []
              if (chartRange === 'since2024' && yearFilter === 'all') {
                const filtered = chartSeries.filter((s) => {
                  const ts = (s && s._ts) || Date.parse(s && s.date) || 0
                  return ts >= start2025
                })
                if (filtered && filtered.length > 0) chartSeries = filtered
              }
              const warning = !info.ok
              return chartSeries && chartSeries.length > 0 ? (
                <div>
                  <ExecutiveCumulativeChart data={chartSeries} height={320} />
                </div>
              ) : (
                <div
                  style={{
                    height: 220,
                    width: '100%',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: palette.muted,
                  }}
                >
                  No data for chart
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('fraud.filters.search.placeholder')}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'transparent',
              color: '#cbd5e1',
            }}
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            style={{ padding: '8px', borderRadius: 8, background: palette.card, color: '#fff' }}
          >
            <option value="ALL">{t('fraud.filters.severity.all')}</option>
            <option value="CRITICAL">{t('fraud.filters.severity.critical')}</option>
            <option value="HIGH">{t('fraud.filters.severity.high')}</option>
            <option value="MEDIUM">{t('fraud.filters.severity.medium')}</option>
            <option value="LOW">{t('fraud.filters.severity.low')}</option>
          </select>
          <input
            value={affiliateFilter}
            onChange={(e) => setAffiliateFilter(e.target.value)}
            placeholder={t('fraud.filters.affiliateId.placeholder')}
            style={{
              padding: '8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'transparent',
              color: '#cbd5e1',
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={useNameGroups}
              onChange={(e) => setUseNameGroups(e.target.checked)}
            />{' '}
            {t('fraud.filters.groupByNameCountry')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('fraud.filters.minCount')}
            <input
              type="number"
              value={groupMinCount}
              onChange={(e) => setGroupMinCount(Number(e.target.value || 0))}
              style={{
                width: 80,
                padding: '6px',
                borderRadius: 6,
                background: palette.card,
                color: '#fff',
              }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={enableClusterCases}
              onChange={(e) => setEnableClusterCases(e.target.checked)}
            />{' '}
            Clusters (heavy)
          </label>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <main>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Cases</div>
              <div style={{ fontSize: 13, color: palette.muted }}>
                {visible.length}
                {casesAreCapped ? '+' : ''} matching
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={bulkMarkReviewed}
                disabled={selectedIds.length === 0}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: selectedIds.length ? palette.success : '#111',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Mark Reviewed
              </button>
              <button
                onClick={exportSelected}
                disabled={selectedIds.length === 0}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#111',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Export
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {visible.map((c) => {
              const isReviewed =
                (reviewedIds && reviewedIds.has && reviewedIds.has(c.id)) || c.reviewed
              return (
                <article
                  key={c.id}
                  style={{
                    background: palette.card,
                    padding: 12,
                    borderRadius: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    opacity: isReviewed ? 0.65 : 1,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: palette.accent,
                        borderRadius: 8,
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff',
                        fontWeight: 800,
                      }}
                    >
                      {c.title
                        .split(' ')
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.title}</div>
                      <div style={{ color: palette.muted, fontSize: 13 }}>{c.description}</div>
                      {/* User & financial summary */}
                      <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontSize: 13, color: '#e6eef8' }}>
                          User: <span style={{ fontWeight: 700 }}>{c.details?.name || '—'}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                          Deposits:{' '}
                          <span style={{ fontWeight: 700 }}>{c.details?.totalDeposits || '—'}</span>
                        </div>
                        <div style={{ fontSize: 12, color: palette.muted }}>
                          Aff: {c.details?.affiliate || '—'}
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <div
                          style={{
                            fontSize: 12,
                            padding: '4px 8px',
                            borderRadius: 999,
                            background:
                              c.severity === 'CRITICAL'
                                ? palette.danger
                                : c.severity === 'HIGH'
                                  ? palette.warning
                                  : c.severity === 'MEDIUM'
                                    ? palette.info
                                    : palette.success,
                            color: '#fff',
                          }}
                        >
                          {c.severity}
                        </div>
                        <div style={{ fontSize: 12, color: palette.muted }}>
                          Risk {c.riskScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => openModal(c)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: palette.accent,
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => markReviewed(c.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: isReviewed ? palette.success : 'transparent',
                        color: isReviewed ? '#fff' : '#cbd5e1',
                      }}
                    >
                      {isReviewed ? 'Reviewed' : 'Mark'}
                    </button>
                  </div>
                </article>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: palette.muted }}>
                No matching cases
              </div>
            )}
          </div>
        </main>
      </section>

      {modalCase && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: 'rgba(2,6,23,0.7)',
            padding: 'clamp(10px, 3vw, 16px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            zIndex: 60,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            style={{
              width: 'min(1000px, 95%)',
              maxHeight: 'calc(100dvh - 32px)',
              overflow: 'auto',
              overscrollBehavior: 'contain',
              background: palette.surface,
              color: '#e6eef8',
              borderRadius: 12,
              overflowX: 'hidden',
              overflowWrap: 'anywhere',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, overflowWrap: 'anywhere' }}>
                  {modalCase.title}
                </div>
                <div style={{ color: palette.muted, overflowWrap: 'anywhere' }}>
                  {modalCase.description}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{modalCase.riskScore}%</div>
                  <div style={{ color: palette.muted, fontSize: 12 }}>{modalCase.priority}</div>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#fff',
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ padding: 16, minWidth: 0, flex: '2 1 560px' }}>
                <h4 style={{ marginTop: 0 }}>Details</h4>
                <div style={{ color: palette.muted, marginBottom: 12 }}>
                  Affiliate: {modalCase.details?.affiliate || '—'} · Country:{' '}
                  {modalCase.details?.country || '—'}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Accounts & Financials</strong>
                  <div style={{ marginTop: 8, color: palette.muted }}>
                    <div>
                      Accounts:{' '}
                      <span style={{ fontWeight: 700 }}>
                        {modalCase.details?.accountCount ?? '—'}
                      </span>
                    </div>
                    <div>
                      Deposits:{' '}
                      <span style={{ fontWeight: 700 }}>
                        {modalCase.details?.totalDeposits ?? '—'}
                      </span>
                    </div>
                    {modalCase.details?.netDeposit && (
                      <div>
                        Net deposit:{' '}
                        <span style={{ fontWeight: 700 }}>{modalCase.details.netDeposit}</span>
                      </div>
                    )}
                    {modalCase.details?.lastDeposit && (
                      <div>
                        Last deposit:{' '}
                        <span style={{ fontWeight: 700 }}>{modalCase.details.lastDeposit}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <strong>Risk Factors</strong>
                  <ul>
                    {(modalCase.details?.riskFactors || []).map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <aside
                style={{
                  padding: 16,
                  minWidth: 0,
                  flex: '1 1 280px',
                  borderLeft: '1px solid rgba(255,255,255,0.03)',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  background: '#071428',
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <strong>Suggested Actions</strong>
                  <ul style={{ marginTop: 8 }}>
                    <li>Check KYC & PSP</li>
                    <li>Review IP & payment trace</li>
                    <li>Escalate if PII mismatch</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      markReviewed(modalCase.id)
                      closeModal()
                    }}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      background: palette.success,
                      color: '#fff',
                    }}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent',
                      color: '#fff',
                    }}
                  >
                    Escalate
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {isCommissionsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: 'rgba(2,6,23,0.7)',
            padding: 'clamp(10px, 3vw, 16px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            zIndex: 70,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCommissionsModal()
          }}
        >
          <div
            style={{
              width: 'min(720px, 95%)',
              maxHeight: 'calc(100dvh - 32px)',
              overflow: 'auto',
              overscrollBehavior: 'contain',
              background: palette.surface,
              color: '#e6eef8',
              borderRadius: 12,
              overflowX: 'hidden',
              overflowWrap: 'anywhere',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Commissions Breakdown</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>
                  Source: Registrations Report.csv
                </div>
              </div>
              <button
                onClick={closeCommissionsModal}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#fff',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 16 }}>
              {displayRegCommissionsSummary ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: 10,
                      background:
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 197, 253, 0.08))',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 14 }}>
                      Total Commissions
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: '#dbeafe' }}>
                      {formatShort(displayRegCommissionsSummary.total || 0)} EUR
                    </div>
                  </div>

                  <div
                    style={{
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        color: '#9ca3af',
                        fontSize: 12,
                      }}
                    >
                      Breakdown
                    </div>
                    <div style={{ maxHeight: 360, overflow: 'auto' }}>
                      {Object.entries(displayRegCommissionsSummary.breakdown).map(([k, v], i) => (
                        <div
                          key={k}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                          }}
                        >
                          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>
                            {k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#fbbf24' }}>
                            {formatShort(v || 0)} EUR
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <FullPageLoader
                  minHeight={220}
                  progress={60}
                  subtitle={t('fraud.loader.commissions')}
                  colors={{
                    surface: palette.card,
                    muted: palette.muted,
                    accent: palette.info,
                    barBg: 'rgba(255,255,255,0.08)',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
