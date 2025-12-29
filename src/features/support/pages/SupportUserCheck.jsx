// src/features/support/pages/SupportUserCheck.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  searchUsers,
  loadPaymentsReport,
  resolveAffiliateName,
  buildAffiliateKpiMap,
  getAffiliateKpi,
  computePriority,
  buildSupportDecision
} from '../services/supportUserCheckService'
import SupportUserDetails from './SupportUserDetails'
import { checkDataStatus } from '../../../utils/dataStatusChecker'
import { useDataStatus } from '../../../context/DataStatusContext'

// Key lists
const NAME_KEYS = ['customername', 'customer_name', 'name', 'fullname']
const USERID_KEYS = ['userid', 'user_id', 'user id', 'user']
const MT5_KEYS = ['mt5account', 'mt5_account', 'mt5']
const REGDATE_KEYS = ['registrationdate', 'regdate', 'externaldate', 'registered', 'registration_date']
const FIRST_DEPOSIT_KEYS = ['firstdeposit', 'first_deposit', 'first deposit']
const QUALIFY_KEYS = ['qualificationdate', 'qualification_date', 'qualifydate']
const DEPOSIT_COUNT_KEYS = ['depositcount', 'deposit_count', 'depositscount', 'deposits_count']
const TOTAL_DEPOSITS_KEYS = ['totaldeposits', 'total_deposits', 'totaldeposit', 'total_deposit']
const NET_DEPOSITS_KEYS = ['netdeposits', 'net_deposits']
const WITHDRAWALS_KEYS = ['withdrawals', 'totalwithdrawals', 'total_withdrawals']
const AFF_KEYS = ['affiliateid', 'affiliate_id', 'affiliate']
const STATUS_KEYS = ['status']
const COUNTRY_KEYS = ['country']
const FRAUD_KEYS = ['fraud', 'fraudchargeback', 'fraud/chargeback']
const ACTION_KEYS = ['action']

// Trading / comms
const LOTS_KEYS = ['lots', 'total_lots']
const VOLUME_KEYS = ['volume', 'turnover']
const PL_KEYS = ['pl', 'profitloss', 'netpl', 'net_pl']
const SPREAD_KEYS = ['spread']
const ROI_KEYS = ['roi']
const COMMISSIONS_KEYS = ['commissions', 'affiliatecommissions', 'affiliate_commissions', 'comm']
const AFF_COMM_KEYS = ['affiliatecommissions', 'affiliate_commissions']
const SUB_AFF_COMM_KEYS = ['subaffiliatecommissions', 'sub_affiliate_commissions', 'sub_aff_commissions']
const CPA_KEYS = ['cpacommission', 'cpa_commission', 'cpa']
const CPL_KEYS = ['cplcommission', 'cpl_commission', 'cpl']
const REVSHARE_KEYS = ['revshare', 'revsharecommission', 'revshare_commission']

// helpers
function pickField(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    const v = row?.[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function getMapped(row) {
  if (!row) return null
  return {
    raw: row,
    name: pickField(row, NAME_KEYS),
    userId: pickField(row, USERID_KEYS),
    mt5: pickField(row, MT5_KEYS),
    regDate: pickField(row, REGDATE_KEYS),
    firstDeposit: pickField(row, FIRST_DEPOSIT_KEYS),
    qualificationDate: pickField(row, QUALIFY_KEYS),
    depositCount: pickField(row, DEPOSIT_COUNT_KEYS),
    totalDeposits: pickField(row, TOTAL_DEPOSITS_KEYS),
    depositNum: toNum(pickField(row, TOTAL_DEPOSITS_KEYS)),
    netDeposits: pickField(row, NET_DEPOSITS_KEYS),
    withdrawals: pickField(row, WITHDRAWALS_KEYS),
    affiliateId: pickField(row, AFF_KEYS),
    status: pickField(row, STATUS_KEYS),
    country: pickField(row, COUNTRY_KEYS),
    fraud: pickField(row, FRAUD_KEYS),
    action: pickField(row, ACTION_KEYS),
    lots: pickField(row, LOTS_KEYS),
    volume: pickField(row, VOLUME_KEYS),
    pl: pickField(row, PL_KEYS),
    spread: pickField(row, SPREAD_KEYS),
    roi: pickField(row, ROI_KEYS),
    commissions: pickField(row, COMMISSIONS_KEYS),
    affiliateCommissions: pickField(row, AFF_COMM_KEYS),
    subAffiliateCommissions: pickField(row, SUB_AFF_COMM_KEYS),
    commission_cpa: pickField(row, CPA_KEYS),
    commission_cpl: pickField(row, CPL_KEYS),
    revshare: pickField(row, REVSHARE_KEYS)
  }
}

function toNum(x) {
  if (x === null || x === undefined) return 0
  const n = Number(String(x).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

function fmtEuro(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const n = toNum(v)
  return `€${n.toLocaleString()}`
}

function fmtDollar(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const n = toNum(v)
  return `$${n.toLocaleString()}`
}

function fmtPercent(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const s = String(v).trim()
  if (s.includes('%')) return s
  const n = Number(String(s).replace(/[^0-9.-]+/g, ''))
  if (!Number.isFinite(n)) return s
  const out = Math.abs(n) < 1 ? n * 100 : n
  return `${out.toFixed(1)}%`
}

function colorForNumber(v) {
  const n = toNum(v)
  if (n > 0) return '#22c55e' // green
  if (n === 0) return '#f97316' // orange
  return '#f87171' // red
}

const sectionTitleStyle = { fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 8 }
const sectionContentStyle = { color: '#9aa4b2' }

export default function SupportUserCheck() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedRaw, setSelectedRaw] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [affiliateName, setAffiliateName] = useState(null)
  const [affiliateKpi, setAffiliateKpi] = useState(null)
  const [dataStatus, setDataStatus] = useState(null)
  const [showDataStatusPopup, setShowDataStatusPopup] = useState(false)

  const { setDataStatus: setGlobalDataStatus } = useDataStatus()

  const inputRef = useRef(null)
  const lastReqRef = useRef(0)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Carica dati iniziali per status
  useEffect(() => {
    console.log('Loading initial data for status');
    async function loadInitialData() {
      try {
        const resp = await fetch('/Registrations%20Report.csv')
        console.log('Fetch response', resp.ok);
        if (!resp.ok) return
        const text = await resp.text()
        // Parse CSV come nel service
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        if (lines.length < 2) return
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        const rows = lines.slice(1).map(line => {
          const cols = line.split(',').map(v => v.replace(/"/g, '').trim())
          const row = {}
          headers.forEach((h, idx) => {
            row[h] = cols[idx] || ''
          })
          return row
        })
        // Trova la colonna data usando REGDATE_KEYS
        const dateKey = headers.find(h => REGDATE_KEYS.includes(h.toLowerCase().replace(/[^a-z]/g, ''))) || headers[0]
        const status = checkDataStatus(rows, dateKey, 'Registrations Report')
        setDataStatus(status)
        setGlobalDataStatus(status)
        setShowDataStatusPopup(true)
      } catch (err) {
        console.error('Failed to load registrations for status', err)
      }
    }
    loadInitialData()
  }, [])

  // Focus shortcut: press '/' to focus the search input (UI enhancement only)
  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        // ignore if typing in inputs or editable fields
        const tag = document.activeElement && document.activeElement.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selected = useMemo(() => (selectedRaw ? getMapped(selectedRaw) : null), [selectedRaw])
  const mappedResults = useMemo(() => (results || []).map((r) => ({ raw: r, mapped: getMapped(r) })), [results])
  const cacheRef = useRef(new Map())
  const debounceRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  async function runSearch(q) {
    const trimmed = String(q || '').trim()
    if (!trimmed) {
      // when clearing, clear results and selection (user asked to hide results when input emptied)
      setResults([])
      setSearched(false)
      setSelectedRaw(null)
      setAffiliateName(null)
      setAffiliateKpi(null)
      setPaymentsLoaded(false)
      setMediaLoaded(false)
      setLoading(false)
      lastReqRef.current = (lastReqRef.current || 0) + 1
      return
    }

    const reqId = Date.now()
    lastReqRef.current = reqId
    setLoading(true)
    setSearched(true)

    try {
      // simple in-memory cache to avoid repeating heavy CSV parsing for recent queries
      if (cacheRef.current.has(trimmed)) {
        const cached = cacheRef.current.get(trimmed)
        if (lastReqRef.current !== reqId) return
        setResults(Array.isArray(cached) ? cached : [])
        return
      }

      const rows = await searchUsers(trimmed)
      if (lastReqRef.current !== reqId) return
      const out = Array.isArray(rows) ? rows : []
      cacheRef.current.set(trimmed, out)
      setResults(out)
    } catch (err) {
      console.error(err)
      if (lastReqRef.current !== reqId) return
      setResults([])
    } finally {
      if (lastReqRef.current === reqId) setLoading(false)
    }
  }

  // When query becomes empty we must clear selection and return to results list (if present).
  useEffect(() => {
    const trimmed = String(query || '').trim()

    if (!trimmed) {
      // clear visible results when input is emptied
      setResults([])
      setSearched(false)
      setSelectedRaw(null)
      setAffiliateName(null)
      setAffiliateKpi(null)
      setPaymentsLoaded(false)
      setMediaLoaded(false)
      setLoading(false)
      lastReqRef.current = (lastReqRef.current || 0) + 1
    }
  }, [query])

  // Lazy-load affiliate info only when a user is selected
  useEffect(() => {
    let mounted = true

    setAffiliateName(null)
    setAffiliateKpi(null)
    setPaymentsLoaded(false)
    setMediaLoaded(false)

    if (!selectedRaw) return

    ;(async () => {
      try { await loadPaymentsReport(); if (!mounted) return; setPaymentsLoaded(true) } catch (e) { if (!mounted) return; setPaymentsLoaded(true) }
      try { const res = await resolveAffiliateName(selectedRaw); if (!mounted) return; setAffiliateName(res?.name || null) } catch (e) { if (!mounted) return; setAffiliateName(null) }
      try { await buildAffiliateKpiMap(); if (!mounted) return; setMediaLoaded(true); const mapped = getMapped(selectedRaw); const k = mapped?.affiliateId ? getAffiliateKpi(mapped.affiliateId) : null; setAffiliateKpi(k || null) } catch (e) { if (!mounted) return; setMediaLoaded(true); setAffiliateKpi(null) }
    })()

    return () => { mounted = false }
  }, [selectedRaw])

  function onSelectUser(raw) { setSelectedRaw(raw) }

  // debounce query changes to avoid firing search on every keystroke
  useEffect(() => {
    const trimmed = String(query || '').trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // immediate search on Enter handled onKeyDown; debounce for typing
    debounceRef.current = setTimeout(() => {
      runSearch(trimmed)
    }, 140)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])
  // UI-only derived values
  const qTrim = String(query || '').trim()
  const showHero = !searched && qTrim === '' && !selected

  function initialsFor(mapped) {
    const seed = (mapped?.name || mapped?.userId || ' ? ').split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase()
    return seed
  }

  // sort mapped results by numeric total deposits (descending) to surface biggest depositors first
  const sortedResults = useMemo(() => {
    if (!mappedResults || mappedResults.length === 0) return []
    // create shallow copy and sort by mapped.depositNum (precomputed) falling back to parsed value
    return mappedResults.slice().sort((a, b) => {
      const aNum = (a?.mapped?.depositNum ?? toNum(a?.mapped?.totalDeposits)) || 0
      const bNum = (b?.mapped?.depositNum ?? toNum(b?.mapped?.totalDeposits)) || 0
      return bNum - aNum
    })
  }, [mappedResults])

  const resultsToShow = sortedResults.length > 0 ? sortedResults.slice(0, 15) : []

  // determine top-depositor threshold (top 10 results) for visual badge
  const topThreshold = useMemo(() => {
    if (!sortedResults || sortedResults.length === 0) return 0
    const idx = Math.min(9, sortedResults.length - 1)
    return (sortedResults[idx]?.mapped?.depositNum) || 0
  }, [sortedResults])

  // selected summary groups
  const selectedSummary = selected ? {
    account: {
      id: selected.userId || '—',
      mt5: selected.mt5 || '—',
      country: selected.country || '—'
    },
    deposits: {
      total: fmtEuro(selected.totalDeposits),
      count: selected.depositCount || '0',
      net: fmtEuro(selected.netDeposits),
      withdrawals: fmtEuro(selected.withdrawals)
    },
    affiliate: {
      id: selected.affiliateId || '—',
      name: affiliateName || '—'
    }
  } : null

  // If a user is selected, render the full-width Support Decision Page in-place
  if (selected) {
    return (
      <div className="support-user-check-page w-full px-6 2xl:px-10">
        <SupportUserDetails
          selected={selected}
          affiliateName={affiliateName}
          affiliateKpi={affiliateKpi}
          paymentsLoaded={paymentsLoaded}
          mediaLoaded={mediaLoaded}
          fmtEuro={fmtEuro}
          suggestedReply={suggestedReply}
          copyToClipboard={copyToClipboard}
          computePriority={computePriority}
          onBack={() => { setSelectedRaw(null); setSearched(results && results.length > 0) }}
        />
      </div>
    )
  }

  return (
    <div className="support-user-check-page w-full px-6 2xl:px-10">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: showHero ? 0 : 12, minHeight: showHero ? '68vh' : undefined, alignItems: showHero ? 'center' : undefined }}>
        <div style={{ width: '100%', paddingTop: showHero ? 0 : undefined }}>
          <header style={{ display: 'flex', flexDirection: 'column', gap: showHero ? 10 : 6, marginBottom: showHero ? 0 : 10, textAlign: showHero ? 'center' : 'left' }}>
            <div>
              <h1 className="support-hero-title" style={{ margin: 0, fontSize: showHero ? 26 : 20, fontWeight: 900, letterSpacing: '-0.2px' }}>Support — User check</h1>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: showHero ? 14 : 13, lineHeight: '1.35', opacity: showHero ? 0.55 : 1, marginTop: showHero ? 14 : 4, marginBottom: showHero ? 22 : 8 }}>
              Quick identification and operational handling of a user.
            </div>

            <div className={`search-bar ${showHero ? 'search-priority' : ''}`} style={{ marginTop: showHero ? 18 : 10, display: 'flex', justifyContent: 'center', transform: showHero ? 'translateY(-5vh)' : undefined }}>
              <div style={{ width: '100%', maxWidth: showHero ? 680 : 820, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: showHero ? 'transparent' : undefined, position: 'relative' }}>
                  <span className="search-icon" aria-hidden style={ showHero ? { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 4, opacity: 0.55 } : undefined }>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" /></svg>
                  </span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { if (debounceRef.current) clearTimeout(debounceRef.current); runSearch(query) } }}
                    placeholder="Search by name, user id or MT5"
                    className="search-input search-hero-input"
                    aria-label="Search users"
                    style={{ width: '100%', fontSize: 16, padding: showHero ? '16px 18px' : '12px 14px', paddingLeft: showHero ? '44px' : undefined }}
                  />
                </div>

                {/* helper line under input - subtle and small */}
                {showHero && (
                  <div style={{ marginTop: 32, color: 'var(--muted)', fontSize: 11, display: 'flex', justifyContent: 'center', gap: 18, opacity: 0.45 }}>
                    <div style={{ minWidth: 160, textAlign: 'center' }}>Instant results while typing</div>
                    <div style={{ minWidth: 160, textAlign: 'center' }}>Press <strong>/</strong> to focus · <strong>Enter</strong> to run</div>
                  </div>
                )}

                {/* secondary placeholder inside input - muted examples */}
                {/* examples removed as secondary placeholder per request */}
              </div>
            </div>
          </header>

          {/* results area (unchanged logic, compact presentation) */}
          {searched && (
            <div style={{ marginTop: 6 }}>
              {loading ? (
                <div style={{ padding: 12, textAlign: 'center' }}><span className="spinner" /> Loading…</div>
              ) : (
                <div className="support-list">
                  {resultsToShow.map(({ raw, mapped }, idx) => {
                    const isSel = selectedRaw === raw
                    const isHover = hoverIndex === idx
                    const initials = initialsFor(mapped)
                    return (
                      <div key={idx} className="support-list-item" style={{ marginBottom: 6 }}>
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') onSelectUser(raw) }}
                          onClick={() => onSelectUser(raw)}
                          onMouseEnter={() => setHoverIndex(idx)}
                          onMouseLeave={() => setHoverIndex(null)}
                          className="support-row"
                          style={{ border: isSel ? '1px solid rgba(99,102,241,0.9)' : undefined }}
                        >
                                <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{initials}</div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div className="name">{mapped.name || mapped.userId || '—'}</div>
                                      {(() => {
                                        const isTop = mapped?.depositNum && topThreshold > 0 && mapped.depositNum >= topThreshold
                                        return isTop ? <span className="badge top">Top</span> : null
                                      })()}
                                    </div>
                                    <div className="meta">{mapped.userId || ''}{mapped.mt5 ? ` · ${mapped.mt5}` : ''}{mapped.country ? ` · ${mapped.country}` : ''}</div>
                                  </div>
                                </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900 }}>{fmtEuro(mapped.totalDeposits)}</div>
                            <div className="deposits">{mapped.depositCount || '0'} deposits</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {mappedResults.length === 0 && <div className="neutral-card">No results</div>}
                </div>
              )}
            </div>
          )}

          {/* selected user handled via full-page SupportUserDetails when present */}
        </div>
      </div>
    </div>
  )
}

function suggestedReply(mapped, affiliateName) {
  if (!mapped) return ''
  
  // Use the Support Decision Engine for intelligent reply suggestions
  const decision = buildSupportDecision({
    ...mapped,
    paymentsLoaded: true, // Assume loaded for reply generation
    mediaLoaded: true
  })
  
  return decision?.replyTemplate || `Hi ${mapped.name || mapped.userId || 'customer'}, thanks for reaching out — we're reviewing your account.`
}

async function copyToClipboard(text) {
  try { await navigator.clipboard?.writeText(text) } catch (e) { /* ignore */ }
}

