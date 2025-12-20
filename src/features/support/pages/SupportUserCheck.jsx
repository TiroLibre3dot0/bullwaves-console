import React, { useEffect, useState, useRef } from 'react';
import {
  loadCsvRows,
  searchUsers,
  computePriority,
  loadMediaReport,
  loadPaymentsReport,
  getPaymentAffiliateById,
  getAffiliateKpi
} from '../services/supportUserCheckService';

const NAME_KEYS = ['customername', 'customer_name', 'name', 'fullname']
const USERID_KEYS = ['userid', 'user_id', 'clientid', 'user']
const REGDATE_KEYS = ['registrationdate', 'regdate', 'externaldate']
const TOTAL_DEPOSITS_KEYS = ['totaldeposits', 'depositcount', 'deposits']
const AFF_KEYS = ['affiliateid', 'affiliate_id', 'affiliate']
const STATUS_KEYS = ['status']
const COUNTRY_KEYS = ['country']
const FRAUD_KEYS = ['fraud', 'fraudchargeback', 'fraud/chargeback']
const ACTION_KEYS = ['action']

function pickField(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim()
  }
  return ''
}

function getMapped(row) {
  return {
    name: pickField(row, NAME_KEYS),
    userId: pickField(row, USERID_KEYS),
    regDate: pickField(row, REGDATE_KEYS),
    totalDeposits: pickField(row, TOTAL_DEPOSITS_KEYS),
    affiliateId: pickField(row, AFF_KEYS),
    status: pickField(row, STATUS_KEYS),
    country: pickField(row, COUNTRY_KEYS),
    fraud: pickField(row, FRAUD_KEYS),
    action: pickField(row, ACTION_KEYS),
    raw: row
  }
}

export default function SupportUserCheck() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    // Warm up heavy CSVs but do not block UI
    loadMediaReport().then(() => setMediaLoaded(true)).catch(() => setMediaLoaded(false))
    loadPaymentsReport().then(() => setPaymentsLoaded(true)).catch(() => setPaymentsLoaded(false))
    // focus input
    if (inputRef.current) inputRef.current.focus()
  }, [])

  async function handleSearch(e) {
    if (e) e.preventDefault()
    if (!query || String(query).trim() === '') return
    setLoading(true)
    setSelected(null)
    try {
      const rows = await searchUsers(query)
      setResults(rows || [])
    } catch (err) {
      setResults([])
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function shortActivity(mapped) {
    if (!mapped) return ''
    if (mapped.totalDeposits && Number(mapped.totalDeposits) > 0) return `${mapped.totalDeposits} deposits`
    return 'No deposits · No recent activity'
  }

  function renderUserHeader(mapped) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{mapped.name || mapped.userId}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{[mapped.userId, mapped.country, mapped.regDate].filter(Boolean).join(' · ')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {mapped.status ? <span className="badge status">{mapped.status}</span> : null}
          <span className="badge priority">{computePriority(mapped.raw)}</span>
        </div>
      </div>
    )
  }

  function copyToClipboard(text) {
    try { navigator.clipboard.writeText(text) } catch (e) { console.warn('clipboard failed', e) }
  }

  return (
    <div style={{ padding: 18 }}>
      {/* Pre-search UI (kept compact and focused) */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
        <input
          ref={inputRef}
          placeholder="Search user by name, id or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '10px 12px', width: 420 }}
        />
        <button type="submit" className="btn-primary">Search</button>
        <div style={{ color: 'var(--muted)', marginLeft: 12 }}>Examples: "Oliver", "12345"</div>
      </form>

      {loading && <div style={{ color: 'var(--muted)' }}>Searching…</div>}

      {/* Search results list */}
      {!selected && results && (
        <div style={{ display: 'grid', gap: 8 }}>
          {results.length === 0 ? <div style={{ color: 'var(--muted)' }}>No results</div> : results.slice(0, 20).map((r, i) => {
            const mapped = getMapped(r)
            return (
              <div key={i} onClick={() => setSelected(r)} style={{ padding: 10, borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{mapped.name || mapped.userId}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{[mapped.userId, mapped.country, mapped.regDate].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{shortActivity(mapped)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected user view */}
      {selected && (() => {
        const mapped = getMapped(selected)
        const paymentAff = mapped.affiliateId ? getPaymentAffiliateById(mapped.affiliateId) : null
        const affiliateKpi = mapped.affiliateId ? getAffiliateKpi(mapped.affiliateId) : null
        const knownAffiliate = !!(mapped.affiliateId && paymentAff)

        return (
          <div style={{ marginTop: 12 }}>
            {/* Top: compact header */}
            <div style={{ marginBottom: 12 }}>{renderUserHeader(mapped)}</div>

            {/* Two-column layout */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* LEFT column: facts */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Account & Activity */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Account & Activity</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                    {mapped.regDate ? <span>Registered: {mapped.regDate}</span> : null}
                    <span style={{ marginLeft: mapped.regDate ? 12 : 0 }}>{shortActivity(mapped)}</span>
                  </div>
                </div>

                {/* Affiliate & Commercial */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Affiliate & Commercial</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mapped.affiliateId ? <div><b>Affiliate ID:</b> {mapped.affiliateId}</div> : null}
                    {paymentAff ? <div><b>Affiliate Name:</b> {paymentAff.name}</div> : (mapped.affiliateId ? <div style={{ color: '#f59e0b' }}>Affiliate ID present (not found in Payments)</div> : null)}

                    {/* KPI / Health */}
                    {affiliateKpi ? (
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                        {affiliateKpi.spend != null && <div style={{ color: 'var(--muted)' }}><small>Spend</small><div style={{ fontWeight: 700 }}>{Number(affiliateKpi.spend).toLocaleString()}</div></div>}
                        {affiliateKpi.clicks != null && <div style={{ color: 'var(--muted)' }}><small>Clicks</small><div style={{ fontWeight: 700 }}>{Number(affiliateKpi.clicks).toLocaleString()}</div></div>}
                        {affiliateKpi.ftd != null && <div style={{ color: 'var(--muted)' }}><small>FTD</small><div style={{ fontWeight: 700 }}>{Number(affiliateKpi.ftd).toLocaleString()}</div></div>}
                        {affiliateKpi.ROI != null && <div style={{ color: 'var(--muted)' }}><small>ROI</small><div style={{ fontWeight: 700 }}>{(affiliateKpi.ROI * 100).toFixed(1)}%</div></div>}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Risk & Flags */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Risk & Flags</div>
                  <div style={{ color: (mapped.fraud || mapped.action) ? '#dc2626' : 'var(--muted)' }}>
                    {mapped.fraud || mapped.action ? [mapped.fraud, mapped.action].filter(Boolean).join(' · ') : 'No major flags'}
                  </div>
                </div>
              </div>

              {/* RIGHT column: action */}
              <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>How to respond</div>
                  <div style={{ color: 'var(--muted)', marginBottom: 8 }}>{mapped.status ? `${mapped.status} · ${computePriority(mapped.raw)}` : computePriority(mapped.raw)}</div>

                  {/* Suggested reply */}
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ color: '#0f172a', marginBottom: 6, fontWeight: 700 }}>Suggested reply</div>
                    <div style={{ color: 'var(--muted)', marginBottom: 8 }}>{`Hi ${mapped.name || mapped.userId}, thanks for reaching out — we're reviewing your account.`}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={() => copyToClipboard(`Hi ${mapped.name || mapped.userId}, thanks for reaching out — we're reviewing your account.`)}>Copy reply</button>
                      <button className="btn-secondary" onClick={() => alert('Open conversation window stub')}>Open convo</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => alert('Escalate to Ops\n' + mapped.userId)}>Escalate to Ops</button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => alert('Escalate to Compliance\n' + mapped.userId)}>Escalate to Compliance</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
