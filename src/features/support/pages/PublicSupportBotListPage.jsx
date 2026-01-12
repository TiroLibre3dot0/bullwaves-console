import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { decodeSharePayload } from '../../../utils/shareCodec'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'

function fmtEuro2(n) {
  if (n == null || Number.isNaN(n)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `€${Number(n).toFixed(2)}`
  }
}

function toNum(v) {
  const s = String(v ?? '').trim()
  if (!s) return null
  const cleaned = s.replace(/[^0-9,.-]/g, '').replace(/,/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

function toInt(v) {
  const n = toNum(v)
  if (n == null) return null
  const i = Math.trunc(n)
  return Number.isFinite(i) ? i : null
}

function parseRegDate(value) {
  const raw = String(value || '').trim()
  if (!raw || raw === '—') return null
  // expected formats: dd/mm/yyyy or m/d/yyyy (we treat as dd/mm when first part > 12)
  const part = raw.split(/\s+/, 1)[0] || raw
  const p = part.split('/')
  if (p.length < 3) return null
  const a = parseInt(p[0], 10)
  const b = parseInt(p[1], 10)
  const yyyy = parseInt(p[2], 10)
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(yyyy)) return null
  let dd = a
  let mm = b
  if (a <= 12 && b <= 12) {
    // ambiguous; keep dd/mm (matches the app's formatted output)
    dd = a
    mm = b
  } else if (a <= 12 && b > 12) {
    // m/d
    mm = a
    dd = b
  } else if (a > 12 && b <= 12) {
    // d/m
    dd = a
    mm = b
  }
  const d = new Date(Date.UTC(yyyy, mm - 1, dd))
  return Number.isNaN(d.getTime()) ? null : d
}

function initialsFromName(name) {
  const seed = String(name || ' ? ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
  return seed || '—'
}

function tierMeta(t, translate) {
  const key = t ? `support.activity.tier.${t}` : null
  const label = key ? translate(key) : '—'

  if (t === 'inactive') {
    return {
      label,
      fg: 'rgba(255,255,255,0.72)',
      bg: 'rgba(148,163,184,0.12)',
      border: 'rgba(148,163,184,0.22)',
    }
  }
  if (t === 'low') {
    return { label, fg: '#e2e8f0', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)' }
  }
  if (t === 'active') {
    return { label, fg: '#dbeafe', bg: 'rgba(37,99,235,0.14)', border: 'rgba(37,99,235,0.26)' }
  }
  if (t === 'high') {
    return { label, fg: '#fff7ed', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)' }
  }
  if (t === 'hyper') {
    return { label, fg: '#fee2e2', bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.32)' }
  }
  return {
    label,
    fg: 'rgba(255,255,255,0.72)',
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.18)',
  }
}

function riskDotMeta(row) {
  const score = Number(row?.botScore || 0)
  if (row?.isPotentialBot) {
    return {
      level: 'high',
      color: '#ef4444',
      shadow: '0 0 0 4px rgba(239,68,68,0.18)',
    }
  }
  if (score >= 90) {
    return {
      level: 'medium',
      color: '#f59e0b',
      shadow: '0 0 0 4px rgba(245,158,11,0.16)',
    }
  }
  if (score >= 45) {
    return {
      level: 'low',
      color: '#22c55e',
      shadow: '0 0 0 4px rgba(34,197,94,0.14)',
    }
  }
  return {
    level: 'veryLow',
    color: 'rgba(148,163,184,0.55)',
    shadow: '0 0 0 4px rgba(148,163,184,0.10)',
  }
}

export default function PublicSupportBotListPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [payload, setPayload] = useState(null)
  const [copied, setCopied] = useState(false)
  const [affiliateFilter, setAffiliateFilter] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'rank', dir: 'asc' })

  const extractShareDescriptorFromLocation = () => {
    if (typeof window === 'undefined') return null
    const params = new window.URLSearchParams(window.location.search)
    const qp = params.get('d')
    if (qp) return { kind: 'encoded', value: qp }
    const prefix = '/share/support-botlist/'
    const p = String(window.location.pathname || '')
    if (p.startsWith(prefix)) {
      const rest = p.slice(prefix.length)
      if (!rest) return null
      const last = rest
        .split('/')
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .at(-1)
      if (!last) return null
      if (/^share_(local_)?[a-z0-9]{10,}$/i.test(last) && last.length <= 96) {
        return { kind: 'token', value: last }
      }
      return { kind: 'encoded', value: rest }
    }
    return null
  }

  const toRowsFromPayload = (p) => {
    if (!p) return []
    // v2 compact schema: payload.r = [ [userId, account, affiliateId, affiliateName, regDate, ageDays, positions, pl, ppd, tier, isPotentialBot, botScore], ... ]
    if (p.v === 2 && Array.isArray(p.r)) {
      return p.r
        .filter((row) => Array.isArray(row))
        .map((row, idx) => {
          return {
            rank: idx + 1,
            userId: row[0] ?? null,
            account: row[1] ?? null,
            affiliateId: row[2] ?? null,
            affiliateName: row[3] ?? null,
            regDate: row[4] ?? null,
            ageDays: row[5] ?? null,
            positions: row[6] ?? null,
            pl: row[7] ?? null,
            positionsPerDay: row[8] ?? null,
            tier: row[9] ?? null,
            isPotentialBot: Boolean(row[10]),
            botScore: row[11] ?? null,
          }
        })
    }
    // v1 legacy schema
    return Array.isArray(p.rows) ? p.rows : []
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setLoadError(null)

        const desc = extractShareDescriptorFromLocation()
        if (!desc) {
          setPayload(null)
          return
        }

        if (desc.kind === 'token') {
          const shareId = String(desc.value || '').trim()

          // Dev-only: local snapshots stored by the share button when Vercel functions are not available.
          if (/^share_local_/i.test(shareId)) {
            const key = `bw_share_support_botlist:${shareId}`
            const raw = window.localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : null
            const p = parsed?.payload
            if (!p) throw new Error('Missing local share snapshot')
            if (!cancelled) setPayload(p)
            return
          }

          const resp = await fetch('/api/share/support-botlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shareId }),
          })

          const data = await resp.json().catch(() => null)

          if (resp.status === 403) {
            throw new Error(data?.message || 'Invalid or expired share link')
          }

          const p = data?.data
          if (!resp.ok || !p) {
            throw new Error(data?.message || data?.error || 'Failed to load share')
          }

          if (!cancelled) setPayload(p)
          return
        }

        const decoded = decodeSharePayload(desc.value)
        if (!cancelled) setPayload(decoded)
      } catch (e) {
        if (!cancelled) {
          setPayload(null)
          setLoadError(e?.message || 'Failed to load share')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const title = payload?.title || t('support.userCheck.botList.title')
    setOpenGraphMeta({
      title,
      description: payload?.subtitle || t('support.userCheck.botList.subtitle'),
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [payload])

  const rows = useMemo(() => toRowsFromPayload(payload), [payload])

  const affiliates = useMemo(() => {
    const set = new Set()
    for (const r of rows) {
      const n = String(r?.affiliateName || '').trim()
      if (n) set.add(n)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const normalized = useMemo(() => {
    return rows.map((r, i) => {
      const account = r?.account || r?.userId || '—'
      const affiliateName = r?.affiliateName || ''
      const regDateLabel = r?.regDate || '—'
      const regDateObj = parseRegDate(regDateLabel)
      const positions = toInt(r?.positions)
      const ageDays = toInt(r?.ageDays)
      const plNum = toNum(r?.pl)
      const ppd = r?.positionsPerDay != null ? Number(r.positionsPerDay) : null
      return {
        _idx: i,
        rank: r?.rank ?? i + 1,
        userId: r?.userId || null,
        account,
        affiliateId: r?.affiliateId || null,
        affiliateName,
        regDate: regDateLabel,
        regDateObj,
        ageDays,
        positions,
        plRaw: r?.pl ?? null,
        plNum,
        positionsPerDay: Number.isFinite(ppd) ? ppd : null,
        tier: r?.tier ?? null,
        isPotentialBot: Boolean(r?.isPotentialBot),
        botScore: r?.botScore ?? null,
      }
    })
  }, [rows])

  const filteredAndSorted = useMemo(() => {
    const q = String(query || '')
      .trim()
      .toLowerCase()
    const aff = String(affiliateFilter || '')
      .trim()
      .toLowerCase()
    let list = normalized

    if (aff) {
      list = list.filter((r) => String(r.affiliateName || '').toLowerCase() === aff)
    }
    if (q) {
      list = list.filter((r) => {
        const a = String(r.account || '').toLowerCase()
        const u = String(r.userId || '').toLowerCase()
        return a.includes(q) || u.includes(q)
      })
    }

    const dirMul = sort.dir === 'desc' ? -1 : 1
    const cmp = (aa, bb) => {
      const a = aa ?? null
      const b = bb ?? null
      if (a == null && b == null) return 0
      if (a == null) return 1
      if (b == null) return -1
      if (a < b) return -1
      if (a > b) return 1
      return 0
    }

    const key = sort.key
    const pick = (r) => {
      if (key === 'rank') return r.rank
      if (key === 'account') return String(r.account || '').toLowerCase()
      if (key === 'affiliate') return String(r.affiliateName || '').toLowerCase()
      if (key === 'regDate') return r.regDateObj ? r.regDateObj.getTime() : null
      if (key === 'ageDays') return r.ageDays
      if (key === 'positions') return r.positions
      if (key === 'pl') return r.plNum
      if (key === 'ppd') return r.positionsPerDay
      if (key === 'tier') return String(r.tier || '').toLowerCase()
      if (key === 'risk') return Number(r.botScore || 0)
      return r.rank
    }

    const sorted = list.slice().sort((a, b) => {
      const primary = cmp(pick(a), pick(b)) * dirMul
      if (primary !== 0) return primary
      // stable fallback: original rank then original index
      const byRank = cmp(a.rank, b.rank)
      if (byRank !== 0) return byRank
      return cmp(a._idx, b._idx)
    })

    return sorted
  }, [normalized, affiliateFilter, query, sort])

  if (loading) {
    return (
      <div style={{ padding: 30 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ color: 'var(--muted)' }}>{t('common.loading')}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!payload) {
    return (
      <div style={{ padding: 30 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="card" style={{ padding: 18 }}>
            <h2 style={{ color: 'var(--text)', fontSize: 18, marginBottom: 8 }}>
              {t('common.accessDenied') || 'Access Denied'}
            </h2>
            <div style={{ color: 'var(--muted)' }}>
              {loadError || 'This share link is invalid or expired.'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const copyLink = async () => {
    try {
      const href = typeof window !== 'undefined' ? window.location.href : ''
      await navigator.clipboard.writeText(href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // ignore
    }
  }

  const title = payload?.title || t('support.userCheck.botList.title')
  const subtitle = payload?.subtitle || t('support.userCheck.botList.subtitle')
  const generatedAt = payload?.generatedAt ? String(payload.generatedAt) : null

  const sortLabel = (key, label) => {
    const is = sort.key === key
    const arrow = is ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
    return `${label}${arrow}`
  }

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'desc' }
      return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
    })
  }

  return (
    <div>
      {/* Fixed navbar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(2,6,23,0.72)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                fontWeight: 950,
                fontSize: 12,
                color: 'rgba(255,255,255,0.88)',
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(148,163,184,0.08)',
              }}
              title={title}
            >
              Shared table
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={affiliateFilter}
                onChange={(e) => setAffiliateFilter(e.target.value)}
                style={{
                  height: 32,
                  borderRadius: 999,
                  padding: '0 10px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(2,6,23,0.35)',
                  color: 'rgba(255,255,255,0.86)',
                  fontSize: 12,
                  outline: 'none',
                }}
                title={t('support.details.affiliate') || 'Affiliate'}
              >
                <option value="">All affiliates</option>
                {affiliates.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('support.search.placeholder') || 'Search account…'}
                style={{
                  height: 32,
                  borderRadius: 999,
                  padding: '0 12px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(2,6,23,0.35)',
                  color: 'rgba(255,255,255,0.86)',
                  fontSize: 12,
                  outline: 'none',
                  width: 220,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn secondary" onClick={copyLink}>
              {copied ? t('common.copied') || 'Copied' : t('common.copyLink') || 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 64, paddingLeft: 18, paddingRight: 18, paddingBottom: 18 }}>
        <div className="bot-top10-wrap" style={{ margin: '0 auto', maxWidth: 1380 }}>
          {!rows.length ? (
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--muted)',
              }}
            >
              Missing or invalid share payload.
            </div>
          ) : (
            <div
              className="card no-card-hover"
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(239,68,68,0.14)',
                background: 'linear-gradient(135deg, rgba(15,23,42,0.70), rgba(2,6,23,0.55))',
                boxShadow: '0 16px 38px rgba(2,6,23,0.60)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{title}</div>
                  <div style={{ marginTop: 4, color: 'var(--muted)', fontSize: 12, opacity: 0.9 }}>
                    {subtitle}
                  </div>
                  {generatedAt ? (
                    <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                      {generatedAt}
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.72)',
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(148,163,184,0.18)',
                      background: 'rgba(148,163,184,0.08)',
                    }}
                    title={t('support.userCheck.botList.riskScore')}
                  >
                    {filteredAndSorted.length} users
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  className="bot-top10-grid bot-top10-header"
                  style={{
                    padding: '10px 12px',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    color: 'rgba(255,255,255,0.55)',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('rank')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('rank')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    title="Sort"
                  >
                    <div style={{ width: 26, textAlign: 'center' }}>#</div>
                    <div aria-hidden style={{ width: 8, height: 8 }} />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('account')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('account')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minWidth: 0,
                      cursor: 'pointer',
                    }}
                    title="Sort"
                  >
                    <div aria-hidden style={{ width: 34, height: 34, flex: '0 0 auto' }} />
                    <div style={{ minWidth: 0 }}>
                      {sortLabel('account', t('support.details.account') || 'Account')}
                    </div>
                  </div>

                  <div
                    className="bot-top10-only-wide"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('affiliate')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('affiliate')}
                    style={{ cursor: 'pointer' }}
                    title="Sort"
                  >
                    {sortLabel('affiliate', t('support.details.affiliate') || 'Affiliate')}
                  </div>

                  <div
                    className="bot-top10-only-wide"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('regDate')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('regDate')}
                    style={{ cursor: 'pointer', textAlign: 'right' }}
                    title="Sort"
                  >
                    {sortLabel(
                      'regDate',
                      t('support.details.userTimeline.registration') || 'Registration'
                    )}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('ageDays')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('ageDays')}
                    style={{ textAlign: 'right', cursor: 'pointer' }}
                    title="Sort"
                  >
                    {sortLabel('ageDays', t('support.activity.metrics.ageDays') || 'Age (d)')}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('positions')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('positions')}
                    style={{ textAlign: 'right', cursor: 'pointer' }}
                    title="Sort"
                  >
                    {sortLabel('positions', t('support.activity.metrics.positions') || 'Positions')}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('pl')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('pl')}
                    style={{ textAlign: 'right', cursor: 'pointer' }}
                    title="Sort"
                  >
                    {sortLabel('pl', t('support.details.tradingPerformance.pl') || 'P/L')}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('ppd')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('ppd')}
                    style={{ textAlign: 'right', cursor: 'pointer' }}
                    title="Sort"
                  >
                    {sortLabel('ppd', t('support.activity.metrics.positionsPerDay') || 'P/day')}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('tier')}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort('tier')}
                    style={{ textAlign: 'right', cursor: 'pointer' }}
                    title="Sort"
                  >
                    {sortLabel('tier', t('support.activity.metrics.tier') || 'Tier')}
                  </div>
                </div>

                <div className="hide-scrollbar bot-top10-scroll">
                  {filteredAndSorted.map((r, idx) => {
                    const name = r.account || '—'
                    const dot = riskDotMeta(r)
                    const isBot = Boolean(r.isPotentialBot)
                    const plNum = r.plNum
                    const tm = tierMeta(r.tier, t)
                    const ppd = r.positionsPerDay

                    return (
                      <div
                        key={idx}
                        className="bot-top10-grid"
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 9,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 900,
                              color: 'rgba(255,255,255,0.8)',
                              background: 'rgba(148,163,184,0.10)',
                              border: '1px solid rgba(148,163,184,0.16)',
                            }}
                            title={`Original rank: ${r.rank}`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            aria-hidden
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              background: dot.color,
                              boxShadow: dot.shadow,
                            }}
                            title={`${t('support.userCheck.botList.riskScore')}: ${Number(r?.botScore || 0).toFixed(0)}`}
                          />
                        </div>

                        <div
                          style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: 12,
                              color: '#fff',
                              background:
                                'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(2,6,23,0.15))',
                              border: '1px solid rgba(99,102,241,0.22)',
                              flex: '0 0 auto',
                            }}
                          >
                            {initialsFromName(name)}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
                            >
                              <div
                                style={{
                                  fontWeight: 950,
                                  fontSize: 13,
                                  color: 'rgba(255,255,255,0.92)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0,
                                }}
                              >
                                {name}
                              </div>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 950,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  border: isBot
                                    ? '1px solid rgba(239,68,68,0.35)'
                                    : '1px solid rgba(148,163,184,0.24)',
                                  background: isBot
                                    ? 'rgba(239,68,68,0.12)'
                                    : 'rgba(148,163,184,0.10)',
                                  color: isBot ? '#fecaca' : 'rgba(255,255,255,0.70)',
                                  flex: '0 0 auto',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.35,
                                }}
                                title={
                                  isBot
                                    ? t('support.userCheck.botList.badge.botHint')
                                    : t('support.userCheck.botList.badge.fillHint')
                                }
                              >
                                {isBot
                                  ? t('support.userCheck.botList.badge.bot')
                                  : t('support.userCheck.botList.badge.fill')}
                              </span>
                            </div>

                            <div
                              className="bot-top10-only-compact"
                              style={{
                                marginTop: 2,
                                color: 'rgba(255,255,255,0.55)',
                                fontSize: 11,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {r?.affiliateName || t('support.details.noAffiliate') || '—'}
                              {r?.regDate ? ` · ${r.regDate}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="bot-top10-only-wide" style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.78)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {r?.affiliateName || '—'}
                          </div>
                        </div>
                        <div
                          className="bot-top10-only-wide"
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.70)',
                            fontWeight: 800,
                          }}
                        >
                          {r?.regDate || '—'}
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.80)',
                            fontWeight: 800,
                          }}
                        >
                          {r?.ageDays != null ? r.ageDays : '—'}
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.80)',
                            fontWeight: 800,
                          }}
                        >
                          {r?.positions == null ? '—' : Number(r.positions).toLocaleString()}
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            fontWeight: 900,
                            color:
                              plNum == null
                                ? 'rgba(255,255,255,0.55)'
                                : plNum > 0
                                  ? '#86efac'
                                  : plNum < 0
                                    ? '#fca5a5'
                                    : 'rgba(255,255,255,0.72)',
                          }}
                          title={t('support.details.tradingPerformance.pl') || 'P/L'}
                        >
                          {plNum == null ? '—' : fmtEuro2(plNum)}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontWeight: 950,
                              color:
                                r?.tier === 'hyper'
                                  ? '#fca5a5'
                                  : r?.tier === 'high'
                                    ? '#fde68a'
                                    : r?.tier === 'active'
                                      ? '#93c5fd'
                                      : 'rgba(255,255,255,0.72)',
                              fontSize: 13,
                              lineHeight: 1,
                            }}
                            title={t('support.activity.tooltip.positionsPerDay')}
                          >
                            {ppd == null || Number.isNaN(ppd) ? '—' : ppd.toFixed(1)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              padding: '5px 10px',
                              borderRadius: 999,
                              color: tm.fg,
                              background: tm.bg,
                              border: `1px solid ${tm.border}`,
                            }}
                          >
                            {tm.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 34,
                    background:
                      'linear-gradient(180deg, rgba(2,6,23,0.00), rgba(2,6,23,0.55) 55%, rgba(2,6,23,0.70))',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
