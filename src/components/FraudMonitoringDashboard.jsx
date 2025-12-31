import React, { useState, useEffect, useMemo, useRef } from 'react'
import Papa from 'papaparse'

// New, cleaner Fraud Monitoring Dashboard
export default function FraudMonitoringDashboard() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('ALL')
  const [affiliateFilter, setAffiliateFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [modalCase, setModalCase] = useState(null)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [nameGroups, setNameGroups] = useState(null)
  const [useNameGroups, setUseNameGroups] = useState(false)
  const [groupMinCount, setGroupMinCount] = useState(10)
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
  const [csvRawRows, setCsvRawRows] = useState([])
  const [regCommissionsSummary, setRegCommissionsSummary] = useState(null)
  const [hoverSource, setHoverSource] = useState(null)
  const [hoverXY, setHoverXY] = useState(null)
  const [ftdUpliftFeb, setFtdUpliftFeb] = useState(5)
  const [ftdUpliftMar, setFtdUpliftMar] = useState(5)
  const [qftdUpliftFeb, setQftdUpliftFeb] = useState(5)
  const [qftdUpliftMar, setQftdUpliftMar] = useState(5)

  const sum = (arr) => arr.reduce((a, b) => a + b, 0)

  useEffect(() => {
    // seed sample cases (replace with real analysis later)
    const seed = [
      { id: 1, title: 'Multi-Accounting Estremo', severity: 'CRITICAL', type: 'MULTI_ACCOUNT', description: '15 account con identico nome', details: { name: 'Anusha Todurkar', affiliate: '2287', country: 'UK', accountCount: 15, totalDeposits: '€15000', depositCount: 45, avgEquity: 1200, avgProfit: 250, avgLoss: -120, riskFactors: ['Stesso nome', 'Stesso IP', 'Stesso affiliate'] }, riskScore: 98, priority: 'URGENTE' },
      { id: 2, title: 'Affiliate Clustering', severity: 'HIGH', type: 'AFFILIATE_CLUSTERING', description: 'Concentrazione account su affiliate 2287', details: { name: 'Affiliate cluster 2287', affiliate: '2287', country: 'UK', accountCount: 50, totalDeposits: '€50000', depositCount: 200, avgEquity: 800, avgProfit: 120, avgLoss: -80 }, riskScore: 82, priority: 'ALTA' },
      { id: 3, title: 'Deposito Elevato Rapido', severity: 'MEDIUM', type: 'HIGH_DEPOSIT', description: 'Primo deposito elevato subito dopo registrazione', details: { name: 'Connor Fitton', affiliate: '35272', country: 'UK', accountCount: 1, totalDeposits: '€4013', depositCount: 1, avgEquity: 4000, avgProfit: 300, avgLoss: -50 }, riskScore: 72, priority: 'MEDIA' },
      { id: 4, title: 'Cross-Border Activity', severity: 'MEDIUM', type: 'CROSS_BORDER', description: 'Stesso nome in paesi diversi', details: { name: 'Akram Abdul Raheem', affiliate: '35197', country: 'MV', accountCount: 2, totalDeposits: '€0', depositCount: 0, avgEquity: 10, avgProfit: 0, avgLoss: 0 }, riskScore: 65, priority: 'MEDIA' },
      { id: 5, title: 'Pattern Nomi Sospetti', severity: 'LOW', type: 'SUSPICIOUS_NAMING', description: 'Nomi automatizzati/test', details: { name: 'Pattern test', affiliate: '', country: 'Multi', accountCount: 10, totalDeposits: '€0', depositCount: 0, avgEquity: 5, avgProfit: 0, avgLoss: 0 }, riskScore: 40, priority: 'BASSA' }
    ]
    setCases(seed)
    setLoading(false)
  }, [])

  // load Media Report and compute aggregates (FTD/QFTD, registrations, visitors, commissions)
  useEffect(() => {
    const url = encodeURI('/Media Report.csv')
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data || []
        setMediaData(rows)
        // build mediaSeries only (keep summary computation reactive to `yearFilter`)
        const seriesMap = {}
        rows.forEach((r, idx) => {
          const getVal = (keys) => {
            for (const k of keys) if (Object.prototype.hasOwnProperty.call(r, k)) return r[k]
            return ''
          }
          const n = s => parseFloat(String(s || '').replace(/[^0-9\.-]/g,'')) || 0
          const rowFtd = n(getVal(['FTD','Ftd','ftd','ftd_count']))
          const rowQftd = n(getVal(['QFTD','Qftd','qftd']))
          const rowRegs = n(getVal(['Registrations','registrations','registrazione','registration_count']))
          const dateLabel = String(getVal(['Month','Date','month','date','month_year']) || `r${idx}`).trim()
          if (!seriesMap[dateLabel]) seriesMap[dateLabel] = { ftd: 0, qftd: 0, registrations: 0 }
          seriesMap[dateLabel].ftd += rowFtd
          seriesMap[dateLabel].qftd += rowQftd
          seriesMap[dateLabel].registrations += rowRegs
        })
        const mSeries = Object.keys(seriesMap).map(k => ({ date: k, ...seriesMap[k] }))
        const parsedM = mSeries.map(s => {
          const d = new Date(s.date)
          if (!isNaN(d.getTime())) return { ...s, _ts: d.getTime(), dateISO: d.toISOString().slice(0,10) }
          const alt = Date.parse(s.date)
          if (!isNaN(alt)) return { ...s, _ts: alt, dateISO: new Date(alt).toISOString().slice(0,10) }
          return { ...s, _ts: null }
        })
        parsedM.sort((a,b) => (a._ts || 0) - (b._ts || 0))
        setMediaSeries(parsedM)
        setMediaLoaded(true)
      },
      error: (err) => { console.warn('Media parse error', err); setMediaSummary({ ftd:0,qftd:0,totalCpa:0, registrations:0, uniqueVisitors:0, visitors:0, leads:0, totalCommission:0, totalPL:0 }); setMediaLoaded(true) }
    })
  }, [])

  // diagnostic logging for load sequence (helps track what updates layout)
  useEffect(() => {
    console.debug('FraudDashboard state:', { mediaLoaded, csvLoaded, mediaSeriesLen: mediaSeries.length, regSeriesLen: regSeries.length })
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
    const url = encodeURI('/Registrations Report.csv')
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data || []).map(r => {
          const normalized = {}
          Object.keys(r).forEach(k => {
            const nk = String(k || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g,'')
            normalized[nk] = typeof r[k] === 'string' ? r[k].trim() : r[k]
          })
          return normalized
        })

        // detect possible keys
        const acctKeys = ['account_id','accountid','accountnumber','account','id','clientid']
        const nameKeys = ['fullname','full_name','name','client_name','customername']
        const depositCountKeys = ['deposit_count','deposits_count','num_deposits','deposits','depositcount']
        const equityKeys = ['equity','balance','account_balance']
        const profitKeys = ['profit','netprofit','pnl']
        const lossKeys = ['loss','netloss']

        const pickKey = (obj, candidates) => candidates.find(k => Object.prototype.hasOwnProperty.call(obj, k))

        const acctKey = rows.length ? pickKey(rows[0], acctKeys) : null
        const nameKey = rows.length ? pickKey(rows[0], nameKeys) : null
        const depositKey = rows.length ? pickKey(rows[0], depositCountKeys) : null
        const equityKey = rows.length ? pickKey(rows[0], equityKeys) : null
        const profitKey = rows.length ? pickKey(rows[0], profitKeys) : null
        const lossKey = rows.length ? pickKey(rows[0], lossKeys) : null
        const affiliateKeys = ['affiliate','affiliate_id','affiliateid','affiliate_code','affiliate_ref']
        const countryKeys = ['country','country_code','nation','paese']
        const affiliateKey = rows.length ? pickKey(rows[0], affiliateKeys) : null
        const countryKey = rows.length ? pickKey(rows[0], countryKeys) : null

        const accounts = rows.map((r, idx) => {
          const accountId = acctKey ? (r[acctKey] || `row-${idx}`) : `row-${idx}`
          const holder = nameKey ? (r[nameKey] || '—') : '—'
          const depositCount = depositKey ? Number(String(r[depositKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
          const equity = equityKey ? Number(String(r[equityKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
          const profit = profitKey ? Number(String(r[profitKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
          const loss = lossKey ? Number(String(r[lossKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
          const affiliate = affiliateKey ? (r[affiliateKey] || '') : ''
          const country = countryKey ? (r[countryKey] || '') : ''
          return { accountId, holder, depositCount, equity, profit, loss, affiliate, country }
        })
        setCsvAccounts(accounts)
        setCsvRawRows(rows)

        // compute commission aggregates from normalized rows
        const parseNum = v => Number(String(v || '').replace(/[^0-9\.-]/g,'')) || 0
        const commKeys = ['commissions','affiliate_commissions','sub_affiliate_commissions','cpa_commission','cpl_commission','revshare_commission','other_commissions']
        const breakdown = {}
        // compute per-key sums
        commKeys.forEach(k => { breakdown[k] = rows.reduce((s,r) => s + parseNum(r[k]), 0) })
        // if `commissions` column exists treat it as authoritative total, otherwise sum breakdown
        const hasCommissionsCol = rows.length && Object.prototype.hasOwnProperty.call(rows[0], 'commissions')
        const commTotal = hasCommissionsCol ? breakdown['commissions'] : Object.values(breakdown).reduce((s,v) => s+v, 0)

        // compute average CPA across accounts that generated commissions (exclude zero-commission accounts)
        let payingCount = 0
        if (hasCommissionsCol) {
          payingCount = rows.reduce((c,r) => c + (parseNum(r['commissions']) > 0 ? 1 : 0), 0)
        } else {
          payingCount = rows.reduce((c,r) => {
            const rowSum = commKeys.reduce((s,k) => s + parseNum(r[k]), 0)
            return c + (rowSum > 0 ? 1 : 0)
          }, 0)
        }
        const avgCpaRegistrations = payingCount ? (commTotal / payingCount) : 0
        setRegCommissionsSummary({ total: commTotal, breakdown, payingCount, avgPerPayingAccount: avgCpaRegistrations })

        // build registration time series (by registration date)
        const regSeriesMap = {}
        rows.forEach((r, idx) => {
          const dateVal = r['registration_date'] || r['registrationdate'] || r['reg_date'] || r['date'] || r['created_at'] || ''
          const label = String(dateVal || '').trim() || 'unknown'
          if (!regSeriesMap[label]) regSeriesMap[label] = 0
          regSeriesMap[label] += 1
        })
        const rSeries = Object.keys(regSeriesMap).map(k => ({ date: k, count: regSeriesMap[k] }))
        const parsedR = rSeries.map(s => {
          const d = new Date(s.date)
          if (!isNaN(d.getTime())) return { ...s, _ts: d.getTime(), dateISO: d.toISOString().slice(0,10) }
          const alt = Date.parse(s.date)
          if (!isNaN(alt)) return { ...s, _ts: alt, dateISO: new Date(alt).toISOString().slice(0,10) }
          return { ...s, _ts: null }
        })
        parsedR.sort((a,b) => (a._ts || 0) - (b._ts || 0))
        setRegSeries(parsedR)

        const totalAccounts = accounts.length
        const uniqueAccountIds = new Set(accounts.map(a => a.accountId)).size
        const holders = {}
        accounts.forEach(a => { holders[a.holder] = (holders[a.holder] || 0) + 1 })
        const uniqueHolders = Object.keys(holders).length
        const singleAccountHolders = Object.values(holders).filter(v => v === 1).length
        const multiAccountCount = Object.values(holders).filter(v => v > 1).reduce((s,v)=>s+v,0)
        const withDeposit = accounts.filter(a => a.depositCount > 0).length

        // deposit buckets (by count) size 5
        const maxDeposits = Math.max(0, ...accounts.map(a => a.depositCount))
        const maxBucket = Math.ceil(maxDeposits / 5)
        const buckets = {}
        for (let i = 1; i <= Math.max(1, maxBucket); i++) buckets[i] = 0
        accounts.forEach(a => { if (a.depositCount > 0) { const idx = Math.floor((a.depositCount-1)/5)+1; buckets[idx] = (buckets[idx]||0)+1 } })
        const avgEquity = accounts.length ? accounts.reduce((s,a)=>s+(a.equity||0),0)/accounts.length : 0
        const avgProfit = accounts.length ? accounts.reduce((s,a)=>s+(a.profit||0),0)/accounts.length : 0
        const avgLoss = accounts.length ? accounts.reduce((s,a)=>s+(a.loss||0),0)/accounts.length : 0

        // deposit_count stats (total, max, min, avg)
        const depositCounts = accounts.map(a => Number(a.depositCount || 0))
        const depositTotal = depositCounts.reduce((s,v) => s + v, 0)
        
        const depositMax = depositCounts.length ? Math.max(...depositCounts) : 0
        const depositMin = depositCounts.length ? Math.min(...depositCounts) : 0
        // average over accounts who deposited at least once
        const depositors = depositCounts.filter(v => Number(v) > 0)
        const depositAvg = depositors.length ? (depositTotal / depositors.length) : 0

        const totalPL = accounts.reduce((s,a) => s + (Number(a.profit || 0) - Number(a.loss || 0)), 0)

        setCsvRecap({ totalAccounts, uniqueAccountIds, uniqueHolders, singleAccountHolders, multiAccountCount, withDeposit, buckets, avgEquity, avgProfit, avgLoss, depositStats: { total: depositTotal, max: depositMax, min: depositMin, avg: depositAvg }, totalPL, payingUsers: withDeposit, losingUsersPercentage: 0 })
        setCsvLoaded(true)
      },
      error: (err) => { console.error('CSV parse error', err); setCsvLoaded(true) }
    })
  }, [])

  // load precomputed name+country groups (generated by scripts/fraud_monitor.js)
  useEffect(() => {
    fetch('/fraud_monitor_name_groups.json').then(r => {
      if (!r.ok) throw new Error('no groups')
      return r.json()
    }).then(j => setNameGroups(j.groups || [])).catch(err => { console.warn('No name groups available', err); setNameGroups([]) })
  }, [])

  // Build clusters by holder name (multi-account groups)
  const clusters = useMemo(() => {
    if (!csvAccounts || csvAccounts.length === 0) return []
    const map = {}
    csvAccounts.forEach(a => {
      const name = (a.holder || '—').trim()
      if (!map[name]) map[name] = { holder: name, accounts: [], affiliates: new Set(), countries: new Set(), totalDepositCount: 0, totalEquity: 0, totalProfit: 0, totalLoss: 0 }
      map[name].accounts.push(a)
      if (a.affiliate) map[name].affiliates.add(a.affiliate)
      if (a.country) map[name].countries.add(a.country)
      map[name].totalDepositCount += Number(a.depositCount || 0)
      map[name].totalEquity += Number(a.equity || 0)
      map[name].totalProfit += Number(a.profit || 0)
      map[name].totalLoss += Number(a.loss || 0)
    })
    // map to array and compute derived stats + risk
    const rows = Object.values(map).map(c => {
      const accountCount = c.accounts.length
      const affiliatesCount = c.affiliates.size
      const countriesCount = c.countries.size
      // Risk rules (deterministic):
      // High: >=10 accounts OR (>=3 accounts AND totalDepositCount>=10) OR (>=3 accounts AND affiliatesCount<=2 AND totalDepositCount>0)
      // Medium: 2-4 accounts with some deposits
      // Low: >1 accounts with zero deposits
      let risk = 'LOW'
      if (accountCount >= 10 || (accountCount >= 3 && c.totalDepositCount >= 10) || (accountCount >= 3 && affiliatesCount <= 2 && c.totalDepositCount > 0)) {
        risk = 'HIGH'
      } else if (accountCount >= 2 && c.totalDepositCount > 0) {
        risk = 'MEDIUM'
      } else if (accountCount > 1 && c.totalDepositCount === 0) {
        risk = 'LOW'
      }
      return { holder: c.holder, accountCount, affiliatesCount, countriesCount, totalDepositCount: c.totalDepositCount, totalEquity: c.totalEquity, totalProfit: c.totalProfit, totalLoss: c.totalLoss, accounts: c.accounts, risk }
    })

    // sort high risk first
    rows.sort((a,b) => (b.risk === 'HIGH') - (a.risk === 'HIGH') || b.accountCount - a.accountCount)
    return rows
  }, [csvAccounts])

  // Cases derived from clusters (single source of truth)
  const derivedCases = useMemo(() => {
    if (!clusters || clusters.length === 0) return []
    return clusters.map((c, idx) => ({
      id: `cluster-${idx}`,
      title: `Cluster: ${c.holder}`,
      severity: c.risk === 'HIGH' ? 'CRITICAL' : (c.risk === 'MEDIUM' ? 'HIGH' : 'LOW'),
      description: c.totalDepositCount ? `${c.accountCount} accounts · ${c.totalDepositCount} deposits across ${c.affiliatesCount} affiliates` : `${c.accountCount} accounts · no deposits recorded`,
      details: { name: c.holder, affiliateSummary: c.affiliatesCount, countrySummary: c.countriesCount, accountCount: c.accountCount, totalDepositCount: c.totalDepositCount },
      riskScore: Math.min(100, Math.round((c.accountCount * 8) + (c.totalDepositCount * 3) + (c.affiliatesCount <= 2 ? 20 : 0))),
      priority: c.risk === 'HIGH' ? 'URGENTE' : (c.risk === 'MEDIUM' ? 'ALTA' : 'BASSA'),
      why: c.accountCount > 1 ? `Same customer name across ${c.accountCount} accounts` : 'Single account'
    }))
  }, [clusters])

  const displayedCases = derivedCases.length ? derivedCases : cases

  // build cases from name+country groups when requested
  const nameGroupCases = useMemo(() => {
    if (!nameGroups || !Array.isArray(nameGroups)) return []
    return nameGroups.filter(g => Number(g.count || 0) >= Number(groupMinCount || 0)).map((g, idx) => {
      const severity = g.count >= 20 ? 'CRITICAL' : (g.count >= 10 ? 'HIGH' : (g.count >= 4 ? 'MEDIUM' : 'LOW'))
      const description = `${g.count} accounts · ${g.country || 'Unknown'}`
      const details = { name: g.name, accountCount: g.count, members: g.members }
      const riskScore = Math.min(100, (g.count * 5) + (g.has_ftd ? 30 : 0))
      return { id: `ng-${idx}`, title: `Name group: ${g.name}`, severity, description, details, riskScore, priority: severity === 'CRITICAL' ? 'URGENTE' : (severity === 'HIGH' ? 'ALTA' : 'BASSA'), why: `Same name+country ${g.count} times` }
    })
  }, [nameGroups, groupMinCount])

  // dynamic list of available years from media and registration series
  const availableYears = useMemo(() => {
    const years = new Set()
    const addFrom = (arr) => {
      if (!arr || !arr.forEach) return
      arr.forEach(it => {
        try {
          const d = it && (it.date instanceof Date ? it.date : (it._ts ? new Date(Number(it._ts)) : (it.date ? new Date(it.date) : null)))
          if (d && !isNaN(d.getTime())) years.add(d.getUTCFullYear())
        } catch (e) { /* ignore */ }
      })
    }
    addFrom(mediaSeries)
    addFrom(regSeries)
    const arr = Array.from(years).sort((a,b)=>b-a).map(String)
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
    if (mmy) { const mo = Number(mmy[1]); const y = Number(mmy[2]); if (mo>=1&&mo<=12) return new Date(Date.UTC(y, mo-1, 1)) }
    // YYYY-MM or YYYY/MM
    const ymd = s.match(/^(\d{4})[\-\/]?(\d{2})$/)
    if (ymd) { const y = Number(ymd[1]); const mo = Number(ymd[2]); if (!isNaN(y) && !isNaN(mo)) return new Date(Date.UTC(y, mo-1, 1)) }
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
    return mediaData.filter(r => {
      const d = parseRowToDate(r)
      return d && d.getUTCFullYear() === y
    })
  }, [mediaData, yearFilter])

  // filtered registration rows based on yearFilter
  const filteredCsvRows = useMemo(() => {
    if (!csvRawRows || !csvRawRows.length) return []
    if (!yearFilter || yearFilter === 'all') return csvRawRows
    const y = Number(yearFilter)
    if (isNaN(y)) return csvRawRows
    return csvRawRows.filter(r => {
      const v = r['registration_date'] || r['registrationdate'] || r['reg_date'] || r['date'] || r['created_at'] || r['createdAt'] || ''
      const s = String(v || '').trim()
      if (!s) return false
      const parsed = Date.parse(s)
      if (!isNaN(parsed)) return new Date(parsed).getUTCFullYear() === y
      // try MM/YYYY
      const mmy = s.match(/^(\d{1,2})[\/](\d{4})$/)
      if (mmy) { const mo = Number(mmy[1]); const yy = Number(mmy[2]); return yy === y }
      return false
    })
  }, [csvRawRows, yearFilter])

  // build filtered csv accounts and recap from filtered rows so Year influences all aggregates
  const filteredCsvAccounts = useMemo(() => {
    if (!filteredCsvRows || !filteredCsvRows.length) return []
    const rows = filteredCsvRows
    const acctKeys = ['account_id','accountid','accountnumber','account','id','clientid']
    const nameKeys = ['fullname','full_name','name','client_name','customername']
    const depositCountKeys = ['deposit_count','deposits_count','num_deposits','deposits','depositcount']
    const equityKeys = ['equity','balance','account_balance']
    const profitKeys = ['profit','netprofit','pnl']
    const lossKeys = ['loss','netloss']
    const pickKey = (obj, candidates) => candidates.find(k => Object.prototype.hasOwnProperty.call(obj, k))
    const acctKey = pickKey(rows[0], acctKeys)
    const nameKey = pickKey(rows[0], nameKeys)
    const depositKey = pickKey(rows[0], depositCountKeys)
    const equityKey = pickKey(rows[0], equityKeys)
    const profitKey = pickKey(rows[0], profitKeys)
    const lossKey = pickKey(rows[0], lossKeys)
    const affiliateKeys = ['affiliate','affiliate_id','affiliateid','affiliate_code','affiliate_ref']
    const countryKeys = ['country','country_code','nation','paese']
    const affiliateKey = pickKey(rows[0], affiliateKeys)
    const countryKey = pickKey(rows[0], countryKeys)
    const accounts = rows.map((r, idx) => {
      const accountId = acctKey ? (r[acctKey] || `row-${idx}`) : `row-${idx}`
      const holder = nameKey ? (r[nameKey] || '—') : '—'
      const depositCount = depositKey ? Number(String(r[depositKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
      const equity = equityKey ? Number(String(r[equityKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
      const profit = profitKey ? Number(String(r[profitKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
      const loss = lossKey ? Number(String(r[lossKey]).replace(/[^0-9\-\.]/g,'')) || 0 : 0
      const affiliate = affiliateKey ? (r[affiliateKey] || '') : ''
      const country = countryKey ? (r[countryKey] || '') : ''
      return { accountId, holder, depositCount, equity, profit, loss, affiliate, country }
    })
    return accounts
  }, [filteredCsvRows])

  const filteredCsvRecap = useMemo(() => {
    const accounts = filteredCsvAccounts
    const totalAccounts = accounts.length
    const uniqueAccountIds = new Set(accounts.map(a => a.accountId)).size
    const holders = {}
    accounts.forEach(a => { holders[a.holder] = (holders[a.holder] || 0) + 1 })
    const uniqueHolders = Object.keys(holders).length
    const singleAccountHolders = Object.values(holders).filter(v => v === 1).length
    const multiAccountCount = Object.values(holders).filter(v => v > 1).reduce((s,v)=>s+v,0)
    const withDeposit = accounts.filter(a => a.depositCount > 0).length
    const maxDeposits = Math.max(0, ...accounts.map(a => a.depositCount))
    const maxBucket = Math.ceil(maxDeposits / 5)
    const buckets = {}
    for (let i = 1; i <= Math.max(1, maxBucket); i++) buckets[i] = 0
    accounts.forEach(a => { if (a.depositCount > 0) { const idx = Math.floor((a.depositCount-1)/5)+1; buckets[idx] = (buckets[idx]||0)+1 } })
    const avgEquity = accounts.length ? accounts.reduce((s,a)=>s+(a.equity||0),0)/accounts.length : 0
    const avgProfit = accounts.length ? accounts.reduce((s,a)=>s+(a.profit||0),0)/accounts.length : 0
    const avgLoss = accounts.length ? accounts.reduce((s,a)=>s+(a.loss||0),0)/accounts.length : 0
    const depositCounts = accounts.map(a => Number(a.depositCount || 0))
    const depositTotal = depositCounts.reduce((s,v) => s + v, 0)
    const depositMax = depositCounts.length ? Math.max(...depositCounts) : 0
    const depositMin = depositCounts.length ? Math.min(...depositCounts) : 0
    const depositors = depositCounts.filter(v => Number(v) > 0)
    const depositAvg = depositors.length ? (depositTotal / depositors.length) : 0
    const totalPL = accounts.reduce((s,a) => s + (Number(a.profit || 0) - Number(a.loss || 0)), 0)
    const losingUsersPercentage = mediaSummary.totalNetDeposits ? (mediaSummary.totalPL / mediaSummary.totalNetDeposits) * 100 : 0
    return { totalAccounts, uniqueAccountIds, uniqueHolders, singleAccountHolders, multiAccountCount, withDeposit, buckets, avgEquity, avgProfit, avgLoss, depositStats: { total: depositTotal, max: depositMax, min: depositMin, avg: depositAvg }, totalPL, payingUsers: withDeposit, losingUsersPercentage }
  }, [filteredCsvAccounts])

  // display recap depending on yearFilter
  const displayCsvRecap = yearFilter && yearFilter !== 'all' ? filteredCsvRecap : csvRecap
  const displayCsvAccounts = yearFilter && yearFilter !== 'all' ? filteredCsvAccounts : csvAccounts

  // filtered commissions summary
  const filteredRegCommissionsSummary = useMemo(() => {
    if (!filteredCsvRows || !filteredCsvRows.length) return null
    const rows = filteredCsvRows
    const parseNum = v => Number(String(v || '').replace(/[^0-9\.-]/g,'')) || 0
    const commKeys = ['commissions','affiliate_commissions','sub_affiliate_commissions','cpa_commission','cpl_commission','revshare_commission','other_commissions']
    const breakdown = {}
    // compute per-key sums
    commKeys.forEach(k => { breakdown[k] = rows.reduce((s,r) => s + parseNum(r[k]), 0) })
    // if `commissions` column exists treat it as authoritative total, otherwise sum breakdown
    const hasCommissionsCol = rows.length && Object.prototype.hasOwnProperty.call(rows[0], 'commissions')
    const commTotal = hasCommissionsCol ? breakdown['commissions'] : Object.values(breakdown).reduce((s,v) => s+v, 0)

    // compute average CPA across accounts that generated commissions (exclude zero-commission accounts)
    let payingCount = 0
    if (hasCommissionsCol) {
      payingCount = rows.reduce((c,r) => c + (parseNum(r['commissions']) > 0 ? 1 : 0), 0)
    } else {
      payingCount = rows.reduce((c,r) => {
        const rowSum = commKeys.reduce((s,k) => s + parseNum(r[k]), 0)
        return c + (rowSum > 0 ? 1 : 0)
      }, 0)
    }
    const avgCpaRegistrations = payingCount ? (commTotal / payingCount) : 0
    return { total: commTotal, breakdown, payingCount, avgPerPayingAccount: avgCpaRegistrations }
  }, [filteredCsvRows])

  const displayRegCommissionsSummary = yearFilter && yearFilter !== 'all' ? filteredRegCommissionsSummary : regCommissionsSummary

  // compute mediaSummary from filtered data so the Year filter affects all aggregates
  useEffect(() => {
    const rows = filteredMediaData || []
    let ftd = 0, qftd = 0, totalCpa = 0, registrations = 0, uniqueVisitors = 0, visitors = 0, leads = 0, totalCommission = 0, totalPL = 0, totalNetDeposits = 0, totalDeposits = 0, totalWithdrawals = 0
    const getVal = (r, keys) => { for (const k of keys) if (Object.prototype.hasOwnProperty.call(r, k)) return r[k]; return '' }
    const n = s => parseFloat(String(s || '').replace(/[^0-9\.-]/g,'')) || 0
    rows.forEach(r => {
      ftd += n(getVal(r, ['FTD','Ftd','ftd','ftd_count']))
      qftd += n(getVal(r, ['QFTD','Qftd','qftd']))
      totalCpa += n(getVal(r, ['CPA Commission','CPA_Commission','cpa_commission','cpa commission']))
      registrations += n(getVal(r, ['Registrations','registrations','registrazione','registration_count']))
      uniqueVisitors += n(getVal(r, ['Unique Visitors','Unique_Visitors','unique_visitors','unique_visitors_count']))
      visitors += n(getVal(r, ['Visitors','visitors']))
      leads += n(getVal(r, ['Leads','leads']))
      totalCommission += n(getVal(r, ['Commission','commission','total_commission']))
      totalPL += n(getVal(r, ['PL','pl','Profit Loss','profit_loss']))
      totalNetDeposits += n(getVal(r, ['Net Deposits','Net_Deposits','net_deposits','netDeposits','NetDeposits']))
      totalDeposits += n(getVal(r, ['Deposits','deposits']))
      totalWithdrawals += n(getVal(r, ['Withdrawals','withdrawals']))
    })
    setMediaSummary({ ftd, qftd, totalCpa, registrations, uniqueVisitors, visitors, leads, totalCommission, totalPL, totalNetDeposits, totalDeposits, totalWithdrawals })
  }, [filteredMediaData])

  // update csvRecap losingUsersPercentage when mediaSummary changes
  useEffect(() => {
    setCsvRecap(prev => ({ ...prev, losingUsersPercentage: mediaSummary.totalNetDeposits ? (mediaSummary.totalPL / mediaSummary.totalNetDeposits) * 100 : 0 }))
  }, [mediaSummary])

  // filtered media series for chart
  const filteredMediaSeries = useMemo(() => {
    if (!mediaSeries || !mediaSeries.length) return []
    if (!yearFilter || yearFilter === 'all') return mediaSeries
    const y = Number(yearFilter)
    if (isNaN(y)) return mediaSeries
    return mediaSeries.filter(s => s._ts && new Date(s._ts).getUTCFullYear() === y)
  }, [mediaSeries, yearFilter])

  // filtered reg series for chart
  const filteredRegSeries = useMemo(() => {
    if (!regSeries || !regSeries.length) return []
    if (!yearFilter || yearFilter === 'all') return regSeries
    const y = Number(yearFilter)
    if (isNaN(y)) return regSeries
    return regSeries.filter(s => s._ts && new Date(s._ts).getUTCFullYear() === y)
  }, [regSeries, yearFilter])

  // choose which source to display
  const effectiveDisplayedCases = useMemo(() => {
    if (useNameGroups && nameGroupCases && nameGroupCases.length) return nameGroupCases
    return derivedCases.length ? derivedCases : cases
  }, [useNameGroups, nameGroupCases, derivedCases, cases])

  const palette = {
    surface: '#071025',
    card: '#0b1724',
    muted: '#94a3b8',
    danger: '#ef4444',
    warning: '#fb923c',
    info: '#60a5fa',
    success: '#10b981',
    accent: '#7c3aed'
  }

  // small neutral icon style for top cards
  const iconBase = { width: 18, height: 18, borderRadius: 4, background: '#6b7280', display: 'inline-block', marginRight: 8 }

  // format large financial numbers with K / M and no decimals
  const formatShort = (value) => {
    const n = Number(value) || 0
    const sign = n < 0 ? '-' : ''
    const abs = Math.abs(Math.round(n))
    if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000)}M`
    if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`
    return `${sign}${abs}`
  }

  // Build cumulative series from monthly incremental data (month-key-based)
  // Returns { ok: boolean, series: Array, message?: string }
  const cumulativeInfo = useMemo(() => {
    const totalsObj = { totalRegs: 0, totalFtd: 0, totalQftd: 0 }
    if ((!filteredMediaSeries || filteredMediaSeries.length === 0) && (!filteredRegSeries || filteredRegSeries.length === 0)) return { ok: false, series: [], message: 'No source data available', totals: totalsObj }

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
      const raw = (item && item.date != null) ? item.date : item
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
        if (!isNaN(y) && !isNaN(mo)) return new Date(y, mo - 1, 1)
      }
      return null
    }

    // collect per-month counts into maps keyed by YYYY-MM
    const regByMonth = {}
    filteredRegSeries.forEach(r => {
      const d = tryParseDate(r)
      if (!d) return
      const key = monthKey(d)
      if (!key) return
      regByMonth[key] = (regByMonth[key] || 0) + Number(r.count || 0)
    })

    const ftdByMonth = {}
    const qftdByMonth = {}
    filteredMediaSeries.forEach(m => {
      const d = tryParseDate(m)
      if (!d) return
      const key = monthKey(d)
      if (!key) return
      ftdByMonth[key] = (ftdByMonth[key] || 0) + Number(m.ftd || 0)
      qftdByMonth[key] = (qftdByMonth[key] || 0) + Number(m.qftd || 0)
    })

    // Determine rangeStart and rangeEnd based on chartRange, yearFilter and available data
    const allKeys = new Set([...Object.keys(regByMonth), ...Object.keys(ftdByMonth), ...Object.keys(qftdByMonth)])
    // find min/max keys from data
    const sortedKeys = Array.from(allKeys).sort()
    const now = new Date()
    const defaultStart = chartRange === 'since2024' ? new Date(Date.UTC(2024, 0, 1)) : (sortedKeys.length ? monthKeyToDate(sortedKeys[0]) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
    const defaultEnd = (sortedKeys.length ? monthKeyToDate(sortedKeys[sortedKeys.length - 1]) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
    // For 'since2024' we start from September 2024 per request
    let rangeStart = chartRange === 'since2024' ? new Date(Date.UTC(2024, 8, 1)) : (defaultStart || new Date(Date.UTC(2024, 0, 1)))
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
    const monthlyRegs = months.map(k => regByMonth[k] || 0)
    const monthlyFtd = months.map(k => ftdByMonth[k] || 0)
    const monthlyQftd = months.map(k => qftdByMonth[k] || 0)

    // compute totals
    const totalRegs = monthlyRegs.reduce((s, v) => s + v, 0)
    const totalFtd = monthlyFtd.reduce((s, v) => s + v, 0)
    const totalQftd = monthlyQftd.reduce((s, v) => s + v, 0)

    // cumulative builder per spec
    const buildCumulativeSeries = (monthlyValues) => {
      let sum = 0
      return monthlyValues.map(v => { sum += Number(v || 0); return sum })
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

    const series = months.map((k, i) => {
      const d = monthKeyToDate(k)
      return { date: d, key: k, _ts: monthKeyToEndTs(k), cumRegs: cumRegs[i], cumFTD: cumFtd[i], cumQFTD: cumQftd[i], regs: monthlyRegs[i], ftd: monthlyFtd[i], qftd: monthlyQftd[i] }
    })

    // Dev-only concise debug log
    try {
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.debug('Cumulative build', { rangeStart: rangeStart.toISOString().slice(0,10), rangeEnd: rangeEnd.toISOString().slice(0,10), first: series[0], last: series[series.length - 1], totals: { totalRegs, totalFtd, totalQftd } })
      }
    } catch (e) { /* ignore */ }

    // Validation against expected totals (non-blocking) — compare only real-data end (no projection)
    const expected = { regs: 73473, ftd: 26215, qftd: 21657 }
    const last = series[series.length - 1] || { cumRegs: 0, cumFTD: 0, cumQFTD: 0 }
    const relErr = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b))
    const matches = relErr(last.cumRegs, expected.regs) <= 0.01 && relErr(last.cumFTD, expected.ftd) <= 0.01 && relErr(last.cumQFTD, expected.qftd) <= 0.01
    const deltas = { regs: last.cumRegs - expected.regs, ftd: last.cumFTD - expected.ftd, qftd: last.cumQFTD - expected.qftd }
    if (!matches) {
      console.warn('Cumulative totals differ (computed vs expected)', { computed: { regs: last.cumRegs, ftd: last.cumFTD, qftd: last.cumQFTD }, expected, deltas })
    }

    const message = matches ? 'OK' : `Note: totals differ by ${deltas.regs >= 0 ? '+' : ''}${deltas.regs} regs, ${deltas.ftd >= 0 ? '+' : ''}${deltas.ftd} ftd, ${deltas.qftd >= 0 ? '+' : ''}${deltas.qftd} qftd (data source mismatch)`
    const noteExplain = 'Registrations are sourced from Registrations Report; FTD/QFTD are from Media Report. Small deltas may be due to reporting windows, timezone adjustments, or upstream corrections.'

    return { ok: matches, series, message, noteExplain, deltas, totals: { totalRegs, totalFtd, totalQftd }, last }
  }, [filteredMediaSeries, filteredRegSeries, chartRange, yearFilter])

  // Linear regression helper (ordinary least squares) on monthly incremental series
  const forecastTo2026 = (series) => {
    if (!series || series.length < 2) return null

    // Extract monthly increments
    const regsM = series.map(s => Number(s.regs != null ? s.regs : (s.regsM != null ? s.regsM : 0)))
    const ftdM = series.map(s => Number(s.ftd != null ? s.ftd : (s.ftdM != null ? s.ftdM : 0)))
    const qftdM = series.map(s => Number(s.qftd != null ? s.qftd : (s.qftdM != null ? s.qftdM : 0)))

    // Helper: EWMA
    const ewma = (arr, alpha = 0.35) => {
      if (!arr.length) return []
      const res = [arr[0]]
      for (let i = 1; i < arr.length; i++) {
        res.push(alpha * arr[i] + (1 - alpha) * res[i-1])
      }
      return res
    }

    // Helper: rolling median
    const rollingMedian = (arr, window = 3) => {
      const res = []
      for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - Math.floor(window / 2))
        const end = Math.min(arr.length, i + Math.floor(window / 2) + 1)
        const slice = arr.slice(start, end).sort((a,b) => a - b)
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
    Object.keys(monthFactors.regs).forEach(m => {
      monthFactors.regs[m] = Math.max(0.85, Math.min(1.20, monthFactors.regs[m].reduce((a,b)=>a+b,0) / monthFactors.regs[m].length))
    })
    Object.keys(monthFactors.ftd).forEach(m => {
      monthFactors.ftd[m] = Math.max(0.85, Math.min(1.20, monthFactors.ftd[m].reduce((a,b)=>a+b,0) / monthFactors.ftd[m].length))
    })
    Object.keys(monthFactors.qftd).forEach(m => {
      monthFactors.qftd[m] = Math.max(0.85, Math.min(1.20, monthFactors.qftd[m].reduce((a,b)=>a+b,0) / monthFactors.qftd[m].length))
    })

    // Trend: slope from last 6 months
    const last6 = (arr) => arr.slice(Math.max(0, arr.length - 6))
    const slope = (arr) => {
      if (arr.length < 2) return 0
      const deltas = []
      for (let i = 1; i < arr.length; i++) deltas.push(arr[i] - arr[i-1])
      deltas.sort((a,b) => a - b)
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
    const histMaxFtdRate = Math.min(0.45, Math.max(...ftdRates) * 1.1)
    const histMaxQftdRate = Math.min(0.90, Math.max(...qftdRates) * 1.1)

    // Milestones
    const milestones = [
      { key: 'solitics', date: '2026-01', upliftFtd: 0.03, upliftQftd: 0.02 },
      { key: 'ui_rollout', date: '2026-02', upliftFtd: 0.04, upliftQftd: 0.03 },
      { key: 'marketing', date: '2026-04', upliftFtd: 0.05, upliftQftd: 0.03 }
    ]

    // Ramp function
    const ramp = (t, start, duration) => Math.max(0, Math.min(1, (t - start) / duration))

    // Projection setup
    const lastDate = series[series.length-1].date
    const startProj = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth()+1, 1))
    const endProj = new Date(Date.UTC(2026, 11, 1))
    const projected = []

    let runRegs = series[series.length-1].cumRegs || 0
    let runFtd = series[series.length-1].cumFTD || 0
    let runQftd = series[series.length-1].cumQFTD || 0

    let prevRegsM = regsM[regsM.length-1] || 0
    let prevFtdM = ftdM[ftdM.length-1] || 0
    let prevQftdM = qftdM[qftdM.length-1] || 0

    let prevFtdRate = ftdRateEwma[ftdRateEwma.length-1] || 0
    let prevQftdRate = qftdRateEwma[qftdRateEwma.length-1] || 0

    const lastBaselineRegs = regsBaseline[regsBaseline.length-1]
    const lastBaselineFtd = ftdBaseline[ftdBaseline.length-1]
    const lastBaselineQftd = qftdBaseline[qftdBaseline.length-1]

    let monthIdx = 0
    for (let d = new Date(startProj); d <= endProj; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 1))) {
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
      milestones.forEach(m => {
        const mDate = new Date(m.date + '-01')
        const monthsSince = (year - mDate.getUTCFullYear()) * 12 + (month - mDate.getUTCMonth())
        const rampVal = ramp(monthsSince, 0, 3) // 3-month ramp
        ftdUplift += m.upliftFtd * rampVal
        qftdUplift += m.upliftQftd * rampVal
      })

      // Forecast regs
      let regsM_pred = Math.max(0, regsBaselinePred * regsSeason)
      regsM_pred = Math.max(regsM_pred, prevRegsM * 0.8) // min 80% of prev
      regsM_pred = Math.min(regsM_pred, prevRegsM * 1.15) // max 115% growth

      // Forecast rates with smoothing and uplifts
      let ftdRate_pred = prevFtdRate * 0.7 + (ftdM[ftdM.length-1] / Math.max(1, regsM[regsM.length-1])) * 0.3
      let qftdRate_pred = prevQftdRate * 0.7 + (qftdM[qftdM.length-1] / Math.max(1, ftdM[ftdM.length-1])) * 0.3

      ftdRate_pred *= (1 + ftdUplift)
      qftdRate_pred *= (1 + qftdUplift)

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
        key: `${year}-${String(month).padStart(2,'0')}`,
        _ts: Date.UTC(year, month-1, 1),
        regsM: regsM_pred,
        ftdM: ftdM_pred,
        qftdM: qftdM_pred,
        regsCum: runRegs,
        ftdCum: runFtd,
        qftdCum: runQftd,
        ftdRate: ftdRate_pred,
        qftdRate: qftdRate_pred
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
  function ExecutiveCumulativeChart({ data, height = 360, colors = { regs: '#60a5fa', ftd: '#10b981', qftd: '#f59e0b' } }) {
    if (!data || data.length === 0) return null

    // Expect `data` to be an ordered array of monthly entries produced by cumulativeInfo:
    // { date: Date, key: 'YYYY-MM', _ts: monthEndTs, regs: monthly, ftd: monthly, qftd: monthly, cumRegs, cumFTD, cumQFTD }
    const series = data.map(d => {
      const ts = d._ts != null ? Number(d._ts) : (d.date ? Date.parse(d.date) : NaN)
      const dateObj = d.date instanceof Date ? d.date : (isNaN(ts) ? null : new Date(ts))
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
        qftdRate: d.qftdRate || 0
      }
    }).filter(s => s.date && !isNaN(s._ts)).sort((a,b)=>a._ts - b._ts)
    if (!series.length) return null

    // hover state and refs for interactive tooltip
    const svgRef = useRef(null)
    const [hoverIndex, setHoverIndex] = useState(null)
    const [hoverXY, setHoverXY] = useState(null)

    // hover handlers are defined after fullSeries is computed so they can use totalCount

    // Projection (linear regression) up to Dec 2026
    const projInfo = forecastTo2026(data)
    const proj = projInfo && projInfo.projected && projInfo.projected.length ? projInfo.projected : []

    const maxRegs = Math.max(...series.map(s => s.regsCum), ...proj.map(p => p.regsCum), 1)
    const maxRight = Math.max(...series.map(s => Math.max(s.ftdCum, s.qftdCum)), ...proj.map(p => Math.max(p.ftdCum, p.qftdCum)), 1)

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

    // SVG sizing: prioritize width; allow horizontal scroll on small screens
    const W = 1100
    const H = height
    const padL = 88
    const padR = 120
    const padT = 40
    const padB = 68

    const yLeft = (v) => padT + (H - padT - padB) * (1 - v / topLeft)
    const yRight = (v) => padT + (H - padT - padB) * (1 - v / topRight)

    const xFor = (i, totalCountOverride) => {
      const denom = Math.max(1, (typeof totalCountOverride === 'number' ? totalCountOverride : Math.max(1, series.length - 1)))
      return padL + (i * (W - padL - padR) / denom)
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
    const projMapped = proj.map(p => ({ date: p.date, _ts: p._ts, regsM: p.regsM, ftdM: p.ftdM, qftdM: p.qftdM, regsCum: p.regsCum, ftdCum: p.ftdCum, qftdCum: p.qftdCum, ftdRate: p.ftdRate || 0, qftdRate: p.qftdRate || 0 }))
    const fullSeries = [...series, ...projMapped]
    const totalCount = Math.max(1, fullSeries.length - 1)

    // hover handlers use fullSeries and totalCount so they map across projections too
    const onMouseMove = (e) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const xRel = e.clientX - rect.left
      const xInView = (xRel / rect.width) * W
      let best = 0, bestDist = Infinity
      fullSeries.forEach((s, i) => {
        const dx = Math.abs(xInView - xFor(i, totalCount))
        if (dx < bestDist) { bestDist = dx; best = i }
      })
      const s = fullSeries[best]
      setHoverIndex(best)
      setHoverXY({ x: xFor(best, totalCount), regsY: yLeft(s.regsCum), ftdY: yRight(s.ftdCum), qftdY: yRight(s.qftdCum), clientX: xRel, clientY: e.clientY - rect.top, isProjected: best >= series.length })
    }
    const onMouseLeave = () => { setHoverIndex(null); setHoverXY(null) }

    const regsPts = series.map((s, i) => ({ x: xFor(i, totalCount), y: yLeft(s.regsCum) }))
    const ftdPts = series.map((s, i) => ({ x: xFor(i, totalCount), y: yRight(s.ftdCum) }))
    const qftdPts = series.map((s, i) => ({ x: xFor(i, totalCount), y: yRight(s.qftdCum) }))

    const projRegsPts = projMapped.map((p, j) => ({ x: xFor(series.length + j, totalCount), y: yLeft(p.regsCum) }))
    const projFtdPts = projMapped.map((p, j) => ({ x: xFor(series.length + j, totalCount), y: yRight(p.ftdCum) }))
    const projQftdPts = projMapped.map((p, j) => ({ x: xFor(series.length + j, totalCount), y: yRight(p.qftdCum) }))

    // X labels: show up to 8 ticks evenly spaced
    const maxXlabels = 8
    const step = Math.max(1, Math.floor(series.length / maxXlabels))

    return (
      <div style={{ overflowX: 'auto', padding: 6, position: 'relative' }}>
        <div style={{ display: 'block' }}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block' }} role="img" aria-label="Platform growth cumulative chart" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
          {/* subtle horizontal guides for left axis only */}
          {Array.from({ length: 4 }).map((_, i) => {
            const v = Math.round(i * (topLeft / 3))
            const y = yLeft(v)
            return <line key={i} x1={padL} x2={W - padR} y1={y} y2={y} stroke="rgba(255,255,255,0.03)" />
          })}

          {/* lines */}
          <path d={buildPath(regsPts)} fill="none" stroke={colors.regs} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={buildPath(ftdPts)} fill="none" stroke={colors.ftd} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={buildPath(qftdPts)} fill="none" stroke={colors.qftd} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          {/* projected (dashed) */}
          {projRegsPts.length > 0 && <path d={buildPath([regsPts[regsPts.length-1], ...projRegsPts])} fill="none" stroke={colors.regs} strokeWidth={2.4} strokeDasharray="6 6" opacity={0.7} />}
          {projFtdPts.length > 0 && <path d={buildPath([ftdPts[ftdPts.length-1], ...projFtdPts])} fill="none" stroke={colors.ftd} strokeWidth={1.8} strokeDasharray="6 6" opacity={0.9} />}
          {projQftdPts.length > 0 && <path d={buildPath([qftdPts[qftdPts.length-1], ...projQftdPts])} fill="none" stroke={colors.qftd} strokeWidth={1.8} strokeDasharray="6 6" opacity={0.9} />}

          {/* curve end labels */}
          {projFtdPts.length > 0 && (() => {
            const last = projFtdPts[projFtdPts.length - 1]
            return <text x={last.x + 10} y={last.y} fontSize={12} fill={colors.ftd} fontWeight={600}>FTD</text>
          })()}
          {projQftdPts.length > 0 && (() => {
            const last = projQftdPts[projQftdPts.length - 1]
            return <text x={last.x + 10} y={last.y + 15} fontSize={12} fill={colors.qftd} fontWeight={600}>QFTD</text>
          })()}

          {/* forecast separator */}
          {projMapped.length > 0 && (() => {
            const leftLastX = xFor(series.length - 1, totalCount)
            const nextX = xFor(series.length, totalCount)
            const sepX = leftLastX + (nextX - leftLastX) / 2
            return (
              <g>
                <line x1={sepX} x2={sepX} y1={padT - 6} y2={H - padB + 6} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 6" />
                <text x={sepX + 6} y={padT - 12} fontSize={12} fill="#94a3b8">Forecast</text>
              </g>
            )
          })()}

          {/* milestone markers */}
          {(() => {
            const milestones = [
              { month: 1, year: 2026, label: 'Solitics live (Retention tool)', color: '#10b981' },
              { month: 2, year: 2026, label: 'New user portal / UI rollout', color: '#3b82f6' },
              { month: 3, year: 2026, label: 'Marketing team operational', color: '#f59e0b' }
            ]
            return milestones.map((m, idx) => {
              const targetDate = new Date(Date.UTC(m.year, m.month - 1, 1))
              const idxInFull = fullSeries.findIndex(s => s.date && s.date.getTime() === targetDate.getTime())
              if (idxInFull === -1) return null
              const x = xFor(idxInFull, totalCount)
              const yTop = padT + 20 + idx * 30
              return (
                <g key={`milestone-${idx}`}>
                  <line x1={x} x2={x} y1={padT} y2={H - padB} stroke={m.color} strokeWidth={1.5} strokeDasharray="2 4" opacity={0.8} />
                  <circle cx={x} cy={yTop} r={4} fill={m.color} />
                  <rect x={x + 8} y={yTop - 12} width={m.label.length * 6 + 10} height={20} fill="rgba(0,0,0,0.7)" rx={4} />
                  <text x={x + 12} y={yTop + 3} fontSize={11} fill="#fff">{m.label}</text>
                </g>
              )
            })
          })()}

          {/* hover markers */}
          {hoverIndex !== null && hoverXY && (
            <g>
              <line x1={hoverXY.x} x2={hoverXY.x} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 4" />
              <circle cx={hoverXY.x} cy={hoverXY.regsY} r={4.5} fill={colors.regs} stroke="#000" strokeWidth={0.8} />
              <circle cx={hoverXY.x} cy={hoverXY.ftdY} r={3.5} fill={colors.ftd} stroke="#000" strokeWidth={0.6} />
              <circle cx={hoverXY.x} cy={hoverXY.qftdY} r={3.5} fill={colors.qftd} stroke="#000" strokeWidth={0.6} />
            </g>
          )}

          {/* X axis ticks and labels (cover real + projected months) */}
          {(() => {
            const stepFull = Math.max(1, Math.floor(fullSeries.length / maxXlabels))
            return fullSeries.map((s, i) => {
              if (i % stepFull !== 0 && i !== fullSeries.length - 1) return null
              const x = xFor(i, totalCount)
              const label = s && s.date ? s.date.toLocaleString('en-US', { month: 'short', year: 'numeric' }) : ''
              return (
                <g key={`xl-${i}`}>
                  <line x1={x} x2={x} y1={H - padB + 2} y2={H - padB + 8} stroke="rgba(255,255,255,0.06)" />
                  <text x={x} y={H - padB + 26} fontSize={11} fill="#94a3b8" textAnchor="middle">{label}</text>
                </g>
              )
            })
          })()}

          {/* left axis labels */}
          {Array.from({ length: 4 }).map((_, i) => {
            const v = Math.round(i * (topLeft / 3))
            const y = yLeft(v)
            return <text key={`ly-${i}`} x={padL - 14} y={y + 4} fontSize={12} fill="#94a3b8" textAnchor="end">{formatShort(v)}</text>
          })}

          {/* right axis labels */}
          {Array.from({ length: 4 }).map((_, i) => {
            const v = Math.round(i * (topRight / 3))
            const y = yRight(v)
            return <text key={`ry-${i}`} x={W - padR + 14} y={y + 4} fontSize={12} fill="#94a3b8" textAnchor="start">{formatShort(v)}</text>
          })}
          </svg>
          {/* overlay controls inside chart */}
          <div style={{ position: 'absolute', right: 18, top: 12, background: palette.card, color: '#fff', padding: 8, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Uplifts (%)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#94a3b8', fontSize: 11 }}>FTD Feb</label>
                <input type="number" value={ftdUpliftFeb} onChange={e => setFtdUpliftFeb(Number(e.target.value))} style={{ background: 'transparent', color: '#fff', padding: '6px 8px', borderRadius: 6, width: 80, border: '1px solid rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#94a3b8', fontSize: 11 }}>FTD Mar</label>
                <input type="number" value={ftdUpliftMar} onChange={e => setFtdUpliftMar(Number(e.target.value))} style={{ background: 'transparent', color: '#fff', padding: '6px 8px', borderRadius: 6, width: 80, border: '1px solid rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#94a3b8', fontSize: 11 }}>QFTD Feb</label>
                <input type="number" value={qftdUpliftFeb} onChange={e => setQftdUpliftFeb(Number(e.target.value))} style={{ background: 'transparent', color: '#fff', padding: '6px 8px', borderRadius: 6, width: 80, border: '1px solid rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#94a3b8', fontSize: 11 }}>QFTD Mar</label>
                <input type="number" value={qftdUpliftMar} onChange={e => setQftdUpliftMar(Number(e.target.value))} style={{ background: 'transparent', color: '#fff', padding: '6px 8px', borderRadius: 6, width: 80, border: '1px solid rgba(255,255,255,0.06)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* floating tooltip box (HTML) */}
        {hoverIndex !== null && hoverXY && svgRef.current && (
          (() => {
            const rect = svgRef.current.getBoundingClientRect()
            const left = Math.min(Math.max(hoverXY.clientX + 12, 8), rect.width - 200)
            const top = Math.min(Math.max(hoverXY.clientY - 60, 8), rect.height - 120)
            const s = fullSeries[hoverIndex]
            const isProj = hoverXY && hoverXY.isProjected
            return (
              <div style={{ position: 'absolute', left: left, top: top, background: palette.card, color: '#e6eef8', padding: '8px 10px', borderRadius: 8, fontSize: 12, pointerEvents: 'none', boxShadow: '0 6px 18px rgba(2,6,23,0.7)', minWidth: 200 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.date ? s.date.toLocaleString('en-US', { month: 'short', year: 'numeric' }) : ''} {isProj ? '(Projected)' : ''}</div>
              {(() => {
                const milestones = [
                  { month: 1, year: 2026, label: 'Solitics live (Retention tool)' },
                  { month: 2, year: 2026, label: 'New user portal / UI rollout' },
                  { month: 3, year: 2026, label: 'Marketing team operational' }
                ]
                const m = milestones.find(mil => mil.month === (s.date ? s.date.getUTCMonth() + 1 : 0) && mil.year === (s.date ? s.date.getUTCFullYear() : 0))
                return m ? <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 4 }}>🚀 {m.label}</div> : null
              })()}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ color: '#94a3b8' }}>Registrations (cum)</div><div style={{ fontWeight: 800 }}>{(s.regsCum||0).toLocaleString()}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ color: '#94a3b8' }}>Registrations (month)</div><div style={{ fontWeight: 700 }}>{(s.regsM||0).toLocaleString()}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ color: '#94a3b8' }}>FTD (cum)</div><div style={{ fontWeight: 800, color: colors.ftd }}>{s.ftdCum.toLocaleString()}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ color: '#94a3b8' }}>QFTD (cum)</div><div style={{ fontWeight: 800, color: colors.qftd }}>{s.qftdCum.toLocaleString()}</div></div>
                <div style={{ height: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><div style={{ fontSize: 12 }}>Regs (month)</div><div style={{ fontWeight: 700 }}>{s.regsM.toLocaleString()}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><div style={{ fontSize: 12 }}>FTD (month)</div><div style={{ fontWeight: 700 }}>{s.ftdM.toLocaleString()}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><div style={{ fontSize: 12 }}>QFTD (month)</div><div style={{ fontWeight: 700 }}>{s.qftdM.toLocaleString()}</div></div>
                {s.ftdRate != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><div style={{ fontSize: 12 }}>FTD Rate</div><div style={{ fontWeight: 700 }}>{(s.ftdRate * 100).toFixed(1)}%</div></div>}
                {s.qftdRate != null && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><div style={{ fontSize: 12 }}>QFTD Rate</div><div style={{ fontWeight: 700 }}>{(s.qftdRate * 100).toFixed(1)}%</div></div>}
                {proj && proj.length > 0 && (() => {
                  const lastProj = proj[proj.length - 1]
                  return (
                    <div style={{ marginTop: 8, borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: 8 }}>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>Projected (Dec 2026)</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><div style={{ color: '#94a3b8' }}>Regs</div><div style={{ fontWeight: 800 }}>{(lastProj.regsCum||0).toLocaleString()}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ color: '#94a3b8' }}>FTD</div><div style={{ fontWeight: 800, color: colors.ftd }}>{(lastProj.ftdCum||0).toLocaleString()}</div></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ color: '#94a3b8' }}>QFTD</div><div style={{ fontWeight: 800, color: colors.qftd }}>{(lastProj.qftdCum||0).toLocaleString()}</div></div>
                    </div>
                  )
                })()}
              </div>
            )
          })()
        )}

        {/* Legend — clear, in requested order (placed under the chart) */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 12, color: '#cbd5e1', fontSize: 13, justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width:12, height:12, background: colors.regs }} /> Registrations (cumulative)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width:12, height:12, background: colors.ftd }} /> FTD (cumulative)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ width:12, height:12, background: colors.qftd }} /> QFTD (cumulative)</div>
        </div>
      </div>
    )
  }

  const visible = useMemo(() => effectiveDisplayedCases.filter(c => {
    if (severity !== 'ALL' && c.severity !== severity) return false
    if (affiliateFilter && String(c.details?.affiliate || c.details?.affiliateSummary || '').indexOf(affiliateFilter) === -1) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (c.title||'').toLowerCase().includes(q) || (c.description||'').toLowerCase().includes(q) || (c.details?.name||'').toLowerCase().includes(q) || String(c.details?.affiliate||c.details?.affiliateSummary||'').includes(q)
  }), [effectiveDisplayedCases, severity, affiliateFilter, query])

  // Expand displayed cases into per-account records for recap calculations
  const accounts = useMemo(() => {
    const a = []
    effectiveDisplayedCases.forEach(c => {
      const count = c.details?.accountCount || 1
      const depositCountTotal = c.details?.depositCount || c.details?.totalDepositCount || 0
      const avgEquity = c.details?.avgEquity || (c.details?.totalEquity ? (c.details.totalEquity / Math.max(1, c.details.accountCount || 1)) : 0)
      const avgProfit = c.details?.avgProfit || 0
      const avgLoss = c.details?.avgLoss || 0
      for (let i = 0; i < count; i++) {
        // distribute depositCount across accounts evenly (approx)
        const perAccountDeposits = count > 0 ? Math.round(depositCountTotal / count) : 0
        a.push({
          id: `${c.id}-${i}`,
          holderName: c.details?.name || '—',
          affiliate: c.details?.affiliate || c.details?.affiliateSummary || '',
          depositCount: perAccountDeposits,
          equity: avgEquity,
          profit: avgProfit,
          loss: avgLoss
        })
      }
    })
    return a
  }, [displayedCases])

  // Recap metrics
  const recap = useMemo(() => {
    const totalAccounts = accounts.length
    const holders = {}
    accounts.forEach(acc => { holders[acc.holderName] = (holders[acc.holderName] || 0) + 1 })
    const uniqueHolders = Object.keys(holders).length
    const singleAccountHolders = Object.values(holders).filter(v => v === 1).length
    const accountsAssociatedSameName = Object.values(holders).filter(v => v > 1).reduce((s, v) => s + v, 0)
    const withDeposit = accounts.filter(a => a.depositCount > 0).length

    // deposit buckets of size 5: 1-5,6-10,...
    const maxDeposits = Math.max(0, ...accounts.map(a => a.depositCount))
    const maxBucket = Math.ceil(maxDeposits / 5)
    const buckets = {}
    for (let i = 1; i <= Math.max(1, maxBucket); i++) buckets[i] = 0
    accounts.forEach(a => {
      if (a.depositCount <= 0) return
      const idx = Math.floor((a.depositCount - 1) / 5) + 1
      buckets[idx] = (buckets[idx] || 0) + 1
    })

    const avgEquity = accounts.length ? accounts.reduce((s, a) => s + (Number(a.equity) || 0), 0) / accounts.length : 0
    const avgProfit = accounts.length ? accounts.reduce((s, a) => s + (Number(a.profit) || 0), 0) / accounts.length : 0
    const avgLoss = accounts.length ? accounts.reduce((s, a) => s + (Number(a.loss) || 0), 0) / accounts.length : 0

    // Calculate losing users (users with negative profit or positive loss)
    const losingUsersCount = accounts.filter(a => (Number(a.profit) || 0) < 0 || (Number(a.loss) || 0) > 0).length
    const losingUsersPercentage = totalAccounts > 0 ? (losingUsersCount / totalAccounts) * 100 : 0

    return { totalAccounts, uniqueHolders, singleAccountHolders, accountsAssociatedSameName, withDeposit, buckets, avgEquity, avgProfit, avgLoss, losingUsersCount, losingUsersPercentage }
  }, [accounts])

  const extendedMediaSummary = useMemo(() => {
    if (!filteredMediaData) return {};
    const getVal = (obj, keys) => {
      for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k]
      return ''
    }
    const n = s => parseFloat(String(s || '').replace(/[^0-9\.-]/g,'')) || 0
    const deposits = sum(filteredMediaData.map(r => n(getVal(r, ['Deposits','deposits']))));
    const withdrawals = sum(filteredMediaData.map(r => n(getVal(r, ['Withdrawals','withdrawals']))));
    const netDeposits = sum(filteredMediaData.map(r => n(getVal(r, ['Net Deposits','net_deposits','NetDeposits']))));
    const pl = sum(filteredMediaData.map(r => n(getVal(r, ['PL','pl']))));
    const commissions = sum(filteredMediaData.map(r => n(getVal(r, ['Commission','commission']))));
    const payingUsers = displayCsvRecap ? displayCsvRecap.payingUsers : 0;
    const arpu = payingUsers > 0 ? pl / payingUsers : 0;
    const cpa = payingUsers > 0 ? commissions / payingUsers : 0;
    return { deposits, withdrawals, netDeposits, pl, commissions, arpu, cpa };
  }, [filteredMediaData, displayCsvRecap])

  function toggleSelect(id) { setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]) }
  function markReviewed(id) {
    setReviewedIds(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }
  function bulkMarkReviewed() { setReviewedIds(prev => { const s = new Set(prev); selectedIds.forEach(id=>s.add(id)); return s }); setSelectedIds([]) }
  function exportSelected() { console.log('Export', displayedCases.filter(c=>selectedIds.includes(c.id))); alert(`Exporting ${selectedIds.length} cases (console).`); }

  function openModal(c) { setModalCase(c) }
  function closeModal() { setModalCase(null) }

  if (loading) return (<div style={{ padding: 40, color: palette.muted }}>Loading fraud scan…</div>)

  return (
    <div style={{ padding: 16, color: '#dbeafe' }}>
      {/* Top recap cards from Registrations Report (always reserve space to avoid layout shift) */}
      <div style={{ fontWeight: 800, marginBottom: 6 }}>User Behavior</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" style={{ marginRight: 12 }}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Unique visitors (Media)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? Math.round(mediaSummary.uniqueVisitors || 0) : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Registrations Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" style={{ marginRight: 12 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Total registered accounts (app)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{csvLoaded && displayCsvRecap ? displayCsvRecap.totalAccounts : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Losing ratio')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginRight: 12 }}>
            <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"></path>
            <path d="M9 5a2 2 0 1 2 2 2v2H5V7a2 2 0 0 1 2-2z"></path>
            <path d="M21 5a2 2 0 1 2 2 2v2h-4V7a2 2 0 0 1 2-2z"></path>
            <path d="M21 19v-6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"></path>
            <line x1="12" y1="3" x2="12" y2="21"></line>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Losing ratio %</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{csvLoaded && displayCsvRecap ? displayCsvRecap.losingUsersPercentage.toFixed(1) + '%' : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ marginRight: 12 }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M19 8v6m3-3h-6"></path>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Registrations (Media)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? Math.round(mediaSummary.registrations || 0) : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 16, borderRadius: 12, minWidth: 180, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ marginRight: 12 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8"></path>
            <path d="M12 18V6"></path>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>FTD (cum)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? Math.round(mediaSummary.ftd || 0) : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 12, minWidth: 180, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginRight: 12 }}>
            <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"></polygon>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>QFTD (cum)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? Math.round(mediaSummary.qftd || 0) : '—'}</div>
          </div>
        </div>
        {/* Removed: Avg cost / registered user (app) - hidden per spec */}
        <div onMouseEnter={() => setHoverSource('Registration Gap')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(139, 69, 19, 0.2)', padding: 16, borderRadius: 12, minWidth: 240, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b4513" strokeWidth="2" style={{ marginRight: 12 }}>
            <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Registration Gap</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{(mediaLoaded && csvLoaded && displayCsvRecap) ? Math.round((mediaSummary.registrations || 0) - (displayCsvRecap.totalAccounts || 0)) : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Registrations Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ marginRight: 12 }}>
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Total deposits (count)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{csvLoaded && displayCsvRecap && displayCsvRecap.depositStats ? displayCsvRecap.depositStats.total : '—'}</div>
          </div>
        </div>
        <div onMouseEnter={() => setHoverSource('Registrations Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" style={{ marginRight: 12 }}>
            <path d="M3 3v18h18"></path>
            <path d="M18 9l-5 5-3-3-5 5"></path>
          </svg>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Avg deposits (depositors)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{csvLoaded && displayCsvRecap && displayCsvRecap.depositStats ? formatShort(Number(displayCsvRecap.depositStats.avg || 0)) : '—'}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, marginBottom: 16 }}>
        <div style={{ color: palette.muted, marginBottom: 8 }}>Financial Summary</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ marginRight: 12 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8m-4-4v8"></path>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Total Deposits</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? `${formatShort(extendedMediaSummary.deposits || 0)} EUR` : '—'}</div>
            </div>
          </div>
          <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginRight: 12 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8"></path>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Total Withdrawals</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? `${formatShort(extendedMediaSummary.withdrawals || 0)} EUR` : '—'}</div>
            </div>
          </div>
          <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ marginRight: 12 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12h8m-4-4v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Net Deposits</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? `${formatShort(extendedMediaSummary.netDeposits || 0)} EUR` : '—'}</div>
            </div>
          </div>
          <div onMouseEnter={() => setHoverSource('Media Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(196, 181, 253, 0.05))', border: '1px solid rgba(168, 85, 247, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" style={{ marginRight: 12 }}>
              <path d="M3 3v18h18"></path>
              <path d="M18 9l-5 5-3-3-5 5"></path>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Total PL</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? `${formatShort(extendedMediaSummary.pl || 0)} EUR` : '—'}</div>
            </div>
          </div>
          <div onMouseEnter={() => setHoverSource('ARPU')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(103, 232, 249, 0.05))', border: '1px solid rgba(6, 182, 212, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" style={{ marginRight: 12 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M16 11l2 2 4-4"></path>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>ARPU</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? `${formatShort(extendedMediaSummary.arpu || 0)} EUR` : '—'}</div>
            </div>
          </div>
          <div onMouseEnter={() => setHoverSource('Registrations Report.csv')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05))', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ marginRight: 12 }}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Total Commissions</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{displayRegCommissionsSummary ? `${formatShort(displayRegCommissionsSummary.total || 0)} EUR` : '—'}</div>
            </div>
          </div>
          <div onMouseEnter={() => setHoverSource('Avg CPA (paying accounts)')} onMouseMove={e => setHoverXY({ x: e.clientX, y: e.clientY })} onMouseLeave={() => { setHoverSource(null); setHoverXY(null) }} style={{ background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(139, 69, 19, 0.2)', padding: 16, borderRadius: 12, minWidth: 220, display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b4513" strokeWidth="2" style={{ marginRight: 12 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>Avg CPA</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dbeafe' }}>{mediaLoaded ? `${formatShort(extendedMediaSummary.cpa || 0)} EUR` : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {hoverSource && hoverXY && (
        <div style={{ position: 'fixed', left: hoverXY.x + 12, top: hoverXY.y + 12, background: palette.card, padding: '6px 8px', borderRadius: 6, fontSize: 12, color: '#cbd5e1', pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          {hoverSource === 'Registration Gap' ? (
            <div>
              <div>Source: Media Report.csv & Registrations Report.csv</div>
            </div>
          ) : hoverSource === 'Avg CPA (paying accounts)' ? (
            <div>
              <div>Source: Media Report.csv & Registrations Report.csv</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>Cost Per Acquisition (paying accounts only). Total commissions ÷ users with deposits.</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>Value: {mediaLoaded ? formatShort(extendedMediaSummary.cpa || 0) : '—'} EUR ({mediaLoaded ? formatShort(extendedMediaSummary.commissions || 0) : '—'} ÷ {displayCsvRecap ? displayCsvRecap.payingUsers : 1})</div>
            </div>
          ) : hoverSource === 'Total PL' ? (
            <div>
              <div>Source: Media Report.csv</div>
            </div>
          ) : hoverSource === 'ARPU' ? (
            <div>
              <div>Source: Media Report.csv & Registrations Report.csv</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>Average Revenue Per User (paying accounts only). Total PL ÷ users with deposits.</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>Value: {mediaLoaded ? formatShort(extendedMediaSummary.arpu || 0) : '—'} EUR ({mediaLoaded ? formatShort(extendedMediaSummary.pl || 0) : '—'} ÷ {displayCsvRecap ? displayCsvRecap.payingUsers : 1})</div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: palette.muted }}>Platform growth (cumulative)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: palette.muted, fontSize: 13 }}>Year</label>
            <select value={yearFilter} onChange={e=>setYearFilter(e.target.value)} style={{ background: palette.card, color: '#fff', padding: 6, borderRadius: 6 }}>
              {availableYears.map(y => (
                <option key={y} value={y}>{y === 'all' ? 'All' : y}</option>
              ))}
            </select>
          </div>
        </div>
        {/* inputs moved inside chart as overlay */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {(() => {
              const start2025 = Date.UTC(2025,0,1) // Jan 2025 start
              const info = cumulativeInfo || { ok: false, series: [], message: 'No cumulative data' }
              let chartSeries = (info.series || [])
              if (chartRange === 'since2024' && yearFilter === 'all') {
                const filtered = chartSeries.filter(s => {
                  const ts = (s && s._ts) || Date.parse(s && s.date) || 0
                  return ts >= start2025
                })
                if (filtered && filtered.length > 0) chartSeries = filtered
              }
              const warning = !info.ok
              return (chartSeries && chartSeries.length > 0) ? (
                <div>
                  <ExecutiveCumulativeChart data={chartSeries} />
                </div>
              ) : (
                <div style={{ height: 220, width: '100%', borderRadius: 8, background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.muted }}>No data for chart</div>
              )
            })()}
          </div>
          <div style={{ width: 320, background: palette.card, padding: 12, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontWeight: 800, marginBottom: 12, color: '#dbeafe', fontSize: 16 }}>Commissions Breakdown</div>
            {displayRegCommissionsSummary ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 197, 253, 0.08))', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: 14 }}>Total Commissions</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#dbeafe' }}>{formatShort(displayRegCommissionsSummary.total||0)} EUR</div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
                  {Object.entries(displayRegCommissionsSummary.breakdown).map(([k,v], i) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', marginBottom: 4, transition: 'background 0.2s, transform 0.1s' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.transform = 'scale(1.02)'; }} onMouseLeave={(e) => { e.target.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'; e.target.style.transform = 'scale(1)'; }}>
                      <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>{k.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#fbbf24' }}>{formatShort(v||0)} EUR</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: palette.muted, textAlign: 'center', padding: 20, fontStyle: 'italic' }}>Loading commissions…</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name / affiliate / text" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#cbd5e1' }} />
          <select value={severity} onChange={e=>setSeverity(e.target.value)} style={{ padding: '8px', borderRadius: 8, background: palette.card, color: '#fff' }}>
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input value={affiliateFilter} onChange={e=>setAffiliateFilter(e.target.value)} placeholder="Affiliate id" style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#cbd5e1' }} />
          <label style={{ display:'flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={useNameGroups} onChange={e=>setUseNameGroups(e.target.checked)} /> Use name+country groups
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}>
            Min count
            <input type="number" value={groupMinCount} onChange={e=>setGroupMinCount(Number(e.target.value||0))} style={{ width:80, padding:'6px', borderRadius:6, background:palette.card, color:'#fff' }} />
          </label>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Cases</div>
              <div style={{ fontSize: 13, color: palette.muted }}>{visible.length} matching</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={bulkMarkReviewed} disabled={selectedIds.length===0} style={{ padding: '8px 12px', borderRadius: 8, background: selectedIds.length?palette.success:'#111', color: '#fff', border: 'none' }}>Mark Reviewed</button>
              <button onClick={exportSelected} disabled={selectedIds.length===0} style={{ padding: '8px 12px', borderRadius: 8, background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' }}>Export</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {visible.map(c => {
              const isReviewed = (reviewedIds && reviewedIds.has && reviewedIds.has(c.id)) || c.reviewed
              return (
              <article key={c.id} style={{ background: palette.card, padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', opacity: isReviewed?0.65:1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={()=>toggleSelect(c.id)} />
                  <div style={{ width: 48, height: 48, background: palette.accent, borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>{c.title.split(' ').slice(0,2).map(s=>s[0]).join('')}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.title}</div>
                    <div style={{ color: palette.muted, fontSize: 13 }}>{c.description}</div>
                    {/* User & financial summary */}
                    <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, color: '#e6eef8' }}>User: <span style={{ fontWeight: 700 }}>{c.details?.name || '—'}</span></div>
                      <div style={{ fontSize: 13, color: '#cbd5e1' }}>Deposits: <span style={{ fontWeight: 700 }}>{c.details?.totalDeposits || '—'}</span></div>
                      <div style={{ fontSize: 12, color: palette.muted }}>Aff: {c.details?.affiliate || '—'}</div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: c.severity==='CRITICAL'?palette.danger:(c.severity==='HIGH'?palette.warning:(c.severity==='MEDIUM'?palette.info:palette.success)), color: '#fff' }}>{c.severity}</div>
                      <div style={{ fontSize: 12, color: palette.muted }}>Risk {c.riskScore}%</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={()=>openModal(c)} style={{ padding: '8px 12px', borderRadius: 8, background: palette.accent, color: '#fff', border: 'none' }}>Details</button>
                  <button onClick={()=>markReviewed(c.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: isReviewed?palette.success:'transparent', color: isReviewed?'#fff':'#cbd5e1' }}>{isReviewed?'Reviewed':'Mark'}</button>
                </div>
              </article>
              )
            })}
            {visible.length === 0 && (<div style={{ textAlign: 'center', padding: 20, color: palette.muted }}>No matching cases</div>)}
          </div>
        </main>
      </section>

      {modalCase && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.7)', zIndex: 60 }} onClick={(e)=>{ if(e.target===e.currentTarget) closeModal() }}>
          <div style={{ width: 'min(1000px, 95%)', background: palette.surface, color: '#e6eef8', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{modalCase.title}</div>
                <div style={{ color: palette.muted }}>{modalCase.description}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{modalCase.riskScore}%</div>
                  <div style={{ color: palette.muted, fontSize: 12 }}>{modalCase.priority}</div>
                </div>
                <button onClick={closeModal} style={{ padding: 8, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>Close</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
              <div style={{ padding: 16 }}>
                <h4 style={{ marginTop: 0 }}>Details</h4>
                <div style={{ color: palette.muted, marginBottom: 12 }}>Affiliate: {modalCase.details?.affiliate || '—'} · Country: {modalCase.details?.country || '—'}</div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Accounts & Financials</strong>
                  <div style={{ marginTop: 8, color: palette.muted }}>
                    <div>Accounts: <span style={{ fontWeight: 700 }}>{modalCase.details?.accountCount ?? '—'}</span></div>
                    <div>Deposits: <span style={{ fontWeight: 700 }}>{modalCase.details?.totalDeposits ?? '—'}</span></div>
                    {modalCase.details?.netDeposit && <div>Net deposit: <span style={{ fontWeight: 700 }}>{modalCase.details.netDeposit}</span></div>}
                    {modalCase.details?.lastDeposit && <div>Last deposit: <span style={{ fontWeight: 700 }}>{modalCase.details.lastDeposit}</span></div>}
                  </div>
                </div>
                <div>
                  <strong>Risk Factors</strong>
                  <ul>
                    {(modalCase.details?.riskFactors || []).map((f, idx) => <li key={idx}>{f}</li>)}
                  </ul>
                </div>
              </div>
              <aside style={{ padding: 16, borderLeft: '1px solid rgba(255,255,255,0.03)', background: '#071428' }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Suggested Actions</strong>
                  <ul style={{ marginTop: 8 }}>
                    <li>Check KYC & PSP</li>
                    <li>Review IP & payment trace</li>
                    <li>Escalate if PII mismatch</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={()=>{ markReviewed(modalCase.id); closeModal() }} style={{ flex: 1, padding: 10, borderRadius: 8, background: palette.success, color: '#fff' }}>Mark Reviewed</button>
                  <button style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#fff' }}>Escalate</button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

