import { Fragment, useEffect, useMemo, useState } from 'react'

import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'
import { parseCsv } from '../../../lib/csv'
import { sections as orgSections } from '../../../pages/orgChartData'
import { INVOICE_CATALOG } from '../invoiceCatalog'

const PROVIDERS = [
  { key: 'skale', label: 'Skale', active: true, hasUsageCsv: true, invoiceMode: 'single' },
  {
    key: 'cellxpert',
    label: 'Cellxpert',
    active: true,
    hasUsageCsv: false,
    invoiceMode: 'byMonth',
  },
  { key: 'creolabs', label: 'CreoLabs', active: true, hasUsageCsv: false, invoiceMode: 'byMonth' },
  { key: 'voiso', label: 'Voiso', active: false, hasUsageCsv: false, invoiceMode: 'byMonth' },
  { key: 'solitics', label: 'Solitics', active: false, hasUsageCsv: false, invoiceMode: 'byMonth' },
]

const PERIODS = [
  { key: 'last7', label: 'Last 7 days', days: 7 },
  { key: 'last15', label: 'Last 15 days', days: 15 },
  { key: 'last30', label: 'Last 30 days', days: 30 },
  { key: 'last60', label: 'Last 60 days', days: 60 },
]

const BILLING_USD_PER_USER = 65
const DEFAULT_ACTIVE_DAYS_WINDOW = 30

function normalizeEmail(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase()
  if (!s || s === '—') return ''
  return s
}

function parseSkaleDate(value) {
  const raw = String(value || '').trim()
  if (!raw || raw === '—') return null

  const cleaned = raw.replace(/(^"|"$)/g, '').trim()
  if (!cleaned) return null

  // Common export format: "YYYY-MM-DD HH:mm:ss".
  const candidate = cleaned.includes('T') ? cleaned : cleaned.replace(' ', 'T')
  const d = new Date(candidate)
  if (!Number.isFinite(d.getTime())) return null
  return d
}

function daysSince(date) {
  if (!date) return Infinity
  const ms = Date.now() - date.getTime()
  if (!Number.isFinite(ms)) return Infinity
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function usageLevelForDays(days) {
  if (!Number.isFinite(days)) return 'Dormant'
  if (days < 7) return 'High'
  if (days <= 30) return 'Medium'
  if (days <= 60) return 'Low'
  return 'Dormant'
}

function isBoardishRole(role) {
  const t = String(role?.title || '')
  const d = String(role?.division || '')
  const dep = String(role?.department || '')
  return /(shareholder|director|board)/i.test(`${t} ${d} ${dep}`)
}

function scoreRole(role, sectionId) {
  if (!role) return 999
  let score = 0
  if (isBoardishRole(role)) score += 100
  const dep = String(role.department || '').toLowerCase()
  if (dep === 'shareholder') score += 50
  if (sectionId === 'management-team') score += 5
  return score
}

function pickTeamLeader(roles = []) {
  const candidates = roles
    .filter((r) => r && typeof r === 'object')
    .filter((r) => !isBoardishRole(r))

  const priority = (title) => {
    const t = String(title || '')
    if (/\bcoo\b/i.test(t)) return 0
    if (/\bhead of\b/i.test(t)) return 1
    if (/\bteam lead\b/i.test(t) || /\blead\b/i.test(t)) return 2
    if (/\bmanager\b/i.test(t)) return 3
    return 9
  }

  const sorted = [...candidates].sort((a, b) => priority(a.title) - priority(b.title))
  const best = sorted.find((r) => priority(r.title) < 9)
  if (!best) return null

  return {
    name: String(best.name || '').trim(),
    title: String(best.title || '').trim(),
    email: normalizeEmail(best.email),
  }
}

function formatMoneyUSD(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '$0'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `$${Math.round(n)}`
  }
}

function formatMoneyCurrency(value, currency, options) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const c = String(currency || 'USD').toUpperCase()
  const maximumFractionDigits =
    options && Number.isFinite(Number(options.maximumFractionDigits))
      ? Number(options.maximumFractionDigits)
      : 0
  const minimumFractionDigits =
    options && Number.isFinite(Number(options.minimumFractionDigits))
      ? Number(options.minimumFractionDigits)
      : 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: c,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(n)
  } catch {
    return `${c} ${Math.round(n)}`
  }
}

function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function invoiceLineAmount(line) {
  if (!line) return null
  const explicit = safeNumber(line.amount)
  if (explicit != null) return explicit
  const qty = safeNumber(line.qty)
  const unit = safeNumber(line.unitPrice)
  if (qty == null || unit == null) return null
  return qty * unit
}

function monthKeyFromDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function monthLabelFromKey(key, locale) {
  const m = String(key || '')
    .trim()
    .match(/^(\d{4})-(\d{2})$/)
  if (!m) return String(key || '—')
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = new Date(Date.UTC(y, mo - 1, 1))
  const loc = locale === 'it' ? 'it-IT' : locale === 'sr' ? 'sr-RS' : 'en-US'
  try {
    return new Intl.DateTimeFormat(loc, { month: 'short', year: 'numeric' }).format(d)
  } catch {
    return key
  }
}

function formatDateTime(date) {
  if (!date) return '—'
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return String(date)
  }
}

function compactUserRowKey(u) {
  return `${u.email || 'no-email'}-${u.userId || 'no-id'}-${u.displayName}`
}

export default function PlatformUsageBillingPage() {
  const { t, locale } = useI18n()
  const [providerKey, setProviderKey] = useState('skale')
  const activeProvider = PROVIDERS.find((p) => p.key === providerKey) || PROVIDERS[0]
  const usageEnabled = Boolean(activeProvider?.hasUsageCsv)
  const invoiceByMonthEnabled = activeProvider?.invoiceMode === 'byMonth'

  const [periodKey, setPeriodKey] = useState('last30')
  const activePeriod = PERIODS.find((p) => p.key === periodKey) || PERIODS[0]
  const activeDaysWindow = Number(activePeriod?.days) || DEFAULT_ACTIVE_DAYS_WINDOW

  const usersPath = `/providers/${providerKey}/users.csv`
  const invoicePath = `/providers/${providerKey}/invoice.pdf`

  const [billingMonthKey, setBillingMonthKey] = useState(() => monthKeyFromDate(new Date()))

  useEffect(() => {
    if (!invoiceByMonthEnabled) return
    const keys = Object.keys(INVOICE_CATALOG?.[providerKey] || {})
    if (!keys.length) return
    const latest = [...keys].sort().at(-1)
    if (latest) setBillingMonthKey(latest)
  }, [providerKey, invoiceByMonthEnabled])

  const invoiceMonthLabel = monthLabelFromKey(billingMonthKey, locale)
  const invoiceMeta = invoiceByMonthEnabled
    ? INVOICE_CATALOG?.[providerKey]?.[billingMonthKey] || null
    : null
  const invoiceHref = invoiceByMonthEnabled ? invoiceMeta?.href || '' : invoicePath

  useEffect(() => {
    if (!usageEnabled) setError('')
  }, [usageEnabled, providerKey])

  const [selectedOrgNode, setSelectedOrgNode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawRows, setRawRows] = useState([])

  useEffect(() => {
    let cancelled = false

    setError('')
    setRawRows([])
    setSelectedOrgNode('')

    if (!activeProvider?.active || !usageEnabled) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)
    fetch(usersPath, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Unable to load users.csv (${res.status})`)
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        const parsed = parseCsv(text)
        setRawRows(Array.isArray(parsed) ? parsed : [])
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e?.message || e || 'Failed to load users.csv'))
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [usersPath, activeProvider?.key, activeProvider?.active, usageEnabled])

  const roleByEmail = useMemo(() => {
    const out = new Map()
    for (const section of orgSections || []) {
      if (!section || typeof section !== 'object') continue
      if (section.id === 'area-responsibility') continue
      const roles = Array.isArray(section.roles) ? section.roles : []
      for (const role of roles) {
        const email = normalizeEmail(role?.email)
        if (!email) continue
        const existing = out.get(email)
        if (!existing) {
          out.set(email, { role, sectionId: section.id })
          continue
        }
        const existingScore = scoreRole(existing.role, existing.sectionId)
        const nextScore = scoreRole(role, section.id)
        if (nextScore < existingScore) out.set(email, { role, sectionId: section.id })
      }
    }
    return out
  }, [])

  const leaderByOrgNode = useMemo(() => {
    const rolesByDepartment = new Map()
    for (const section of orgSections || []) {
      if (!section || typeof section !== 'object') continue
      if (section.id === 'area-responsibility') continue
      const roles = Array.isArray(section.roles) ? section.roles : []
      for (const role of roles) {
        const dep = String(role?.department || '').trim()
        if (!dep) continue
        if (!rolesByDepartment.has(dep)) rolesByDepartment.set(dep, [])
        rolesByDepartment.get(dep).push(role)
      }
    }

    const out = new Map()
    for (const [dep, roles] of rolesByDepartment.entries()) {
      const leader = pickTeamLeader(roles)
      if (!leader?.name) continue
      out.set(dep, leader.title ? `${leader.name} — ${leader.title}` : leader.name)
    }
    return out
  }, [])

  const users = useMemo(() => {
    const rows = Array.isArray(rawRows) ? rawRows : []
    return rows
      .map((r, idx) => {
        const userId = String(r?.['User ID'] || r?.userId || idx + 1).trim()
        const userName = String(r?.['User Name'] || r?.userName || '').trim()
        const firstName = String(r?.['First Name'] || r?.firstName || '').trim()
        const lastName = String(r?.['Last Name'] || r?.lastName || '').trim()
        const primaryEmail = normalizeEmail(r?.['Primary Email'] || r?.primaryEmail)
        const secondaryEmail = normalizeEmail(r?.['Secondary Email'] || r?.secondaryEmail)
        const otherEmail = normalizeEmail(r?.['Other Email'] || r?.otherEmail)
        const email =
          primaryEmail ||
          secondaryEmail ||
          otherEmail ||
          (userName.includes('@') ? normalizeEmail(userName) : '')

        const role = String(r?.Role || r?.role || '').trim() || '—'
        const status = String(r?.Status || r?.status || '').trim() || '—'
        const lastLogin = parseSkaleDate(r?.['Last Login'] || r?.lastLogin)
        const days = daysSince(lastLogin)
        const usageLevel = usageLevelForDays(days)

        const displayName =
          userName ||
          [firstName, lastName].filter(Boolean).join(' ') ||
          email ||
          String(userId || '').trim() ||
          '—'

        const org = email ? roleByEmail.get(email) : null
        const department = String(org?.role?.department || '').trim()
        const orgNode = String(org?.role?.department || org?.role?.division || '').trim() || '—'

        return {
          userId,
          displayName,
          email,
          role,
          status,
          lastLogin,
          daysSinceLogin: days,
          usageLevel,
          department,
          orgNode,
        }
      })
      .filter((u) => u && typeof u === 'object')
  }, [rawRows, roleByEmail])

  const kpis = useMemo(() => {
    const totalUsers = users.length
    const systemActive = users.filter((u) => /^active$/i.test(String(u.status || ''))).length
    const activeLast30 = users.filter((u) => u.daysSinceLogin <= activeDaysWindow).length
    const activeNoLoginOver30 = users.filter(
      (u) =>
        /^active$/i.test(String(u.status || '')) &&
        (u.daysSinceLogin > activeDaysWindow || !Number.isFinite(u.daysSinceLogin))
    ).length

    const dormantOver30 = users.filter(
      (u) => u.daysSinceLogin > activeDaysWindow || !Number.isFinite(u.daysSinceLogin)
    ).length

    return {
      totalUsers,
      systemActive,
      activeLast30,
      activeNoLoginOver30,
      dormantOver30,
    }
  }, [users, activeDaysWindow])

  const orgImpactRows = useMemo(() => {
    const byNode = new Map()
    for (const u of users) {
      const key = String(u.department || '').trim()
      if (!key) continue
      if (!byNode.has(key)) {
        byNode.set(key, {
          orgNode: key,
          teamLeader: leaderByOrgNode.get(key) || '—',
          totalUsers: 0,
          activeLast30: 0,
          dormantOver30: 0,
          billableDormantOver30: 0,
        })
      }
      const row = byNode.get(key)
      row.totalUsers += 1

      const isActiveLast30 = u.daysSinceLogin <= activeDaysWindow
      if (isActiveLast30) row.activeLast30 += 1
      if (!isActiveLast30) row.dormantOver30 += 1

      const isSystemActive = /^active$/i.test(String(u.status || ''))
      if (isSystemActive && !isActiveLast30) row.billableDormantOver30 += 1
    }

    const rows = Array.from(byNode.values()).map((r) => {
      let suggestedAction = 'OK'
      if (r.billableDormantOver30 > 0) suggestedAction = 'Deactivate unused active users'
      else if (r.dormantOver30 > 0) suggestedAction = 'Audit inactive accounts'

      return {
        ...r,
        suggestedAction,
      }
    })

    rows.sort((a, b) => {
      if (b.billableDormantOver30 !== a.billableDormantOver30)
        return b.billableDormantOver30 - a.billableDormantOver30
      if (b.dormantOver30 !== a.dormantOver30) return b.dormantOver30 - a.dormantOver30
      return String(a.orgNode).localeCompare(String(b.orgNode))
    })
    return rows
  }, [users, leaderByOrgNode, activeDaysWindow])

  const selectedUsers = useMemo(() => {
    if (!selectedOrgNode) return []
    return users.filter((u) => String(u.department) === String(selectedOrgNode))
  }, [users, selectedOrgNode])

  const selectedUsersActive = useMemo(() => {
    return selectedUsers
      .filter((u) => u.daysSinceLogin <= activeDaysWindow)
      .sort((a, b) => a.daysSinceLogin - b.daysSinceLogin)
  }, [selectedUsers, activeDaysWindow])

  const selectedUsersNotActive = useMemo(() => {
    return selectedUsers
      .filter((u) => !(u.daysSinceLogin <= activeDaysWindow))
      .sort((a, b) => b.daysSinceLogin - a.daysSinceLogin)
  }, [selectedUsers, activeDaysWindow])

  const billing = useMemo(() => {
    const dormantBillable = kpis.activeNoLoginOver30
    const monthly = dormantBillable * BILLING_USD_PER_USER
    const quarterly = monthly * 3
    const yearly = monthly * 12
    return {
      dormantBillable,
      monthly,
      quarterly,
      yearly,
    }
  }, [kpis.activeNoLoginOver30])

  if (usageEnabled && loading && !users.length) {
    return (
      <FullPageLoader
        progress={40}
        subtitle={t('platformUsageBilling.loading') || 'Loading users…'}
      />
    )
  }

  return (
    <div className="page-shell">
      <header
        className="page-header ranking-header"
        style={{
          alignItems: 'stretch',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '16px 0 12px',
          margin: '-20px 0 0',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div>
          <p className="page-label">Console</p>
          <h1 className="page-title">
            {t('platformUsageBilling.title') || 'Platform Usage & Billing'}
          </h1>
          <p className="page-subtitle">
            {usageEnabled
              ? t('platformUsageBilling.subtitle') ||
                'Monitor provider usage and connect active accounts to the org chart.'
              : t('platformUsageBilling.subtitleBillingOnly') ||
                'Financial view: monthly invoices (no org chart mapping yet).'}
          </p>

          <div
            className="card-block"
            style={{
              marginTop: 12,
              padding: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="eyebrow" style={{ margin: 0 }}>
                  {t('platformUsageBilling.provider') || 'Provider'}
                </div>
                <select
                  value={providerKey}
                  onChange={(e) => setProviderKey(e.target.value)}
                  aria-label={t('platformUsageBilling.provider') || 'Provider'}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 12,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    minWidth: 180,
                  }}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.key} value={p.key} disabled={!p.active}>
                      {p.active ? p.label : `${p.label} (inactive)`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="eyebrow" style={{ margin: 0 }}>
                  {t('platformUsageBilling.period') || 'Period'}
                </div>
                <select
                  value={periodKey}
                  onChange={(e) => setPeriodKey(e.target.value)}
                  aria-label={t('platformUsageBilling.period') || 'Period'}
                  disabled={!usageEnabled}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 12,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    minWidth: 180,
                    opacity: usageEnabled ? 1 : 0.55,
                  }}
                >
                  {PERIODS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {t(`platformUsageBilling.period.${p.key}`) || p.label}
                    </option>
                  ))}
                </select>
              </div>

              {invoiceByMonthEnabled ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="eyebrow" style={{ margin: 0 }}>
                    {t('platformUsageBilling.month') || 'Month'}
                  </div>
                  <select
                    value={billingMonthKey}
                    onChange={(e) => setBillingMonthKey(e.target.value)}
                    aria-label={t('platformUsageBilling.month') || 'Month'}
                    style={{
                      height: 36,
                      padding: '0 12px',
                      borderRadius: 12,
                      border: '1px solid var(--border-primary)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      minWidth: 180,
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const d = new Date()
                      d.setDate(1)
                      d.setMonth(d.getMonth() - idx)
                      const key = monthKeyFromDate(d)
                      return (
                        <option key={key} value={key}>
                          {monthLabelFromKey(key, locale)}
                        </option>
                      )
                    })}
                  </select>
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 12 }}>
                {t('platformUsageBilling.dataSource') || 'Data source:'}{' '}
                {usageEnabled ? (
                  <>
                    <a
                      href={usersPath}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-secondary)', fontWeight: 800 }}
                    >
                      users.csv
                    </a>
                    <span className="muted" style={{ margin: '0 6px' }}>
                      |
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 800 }}>
                      {t('platformUsageBilling.usersNotAvailable') || 'users.csv not available'}
                    </span>
                    <span className="muted" style={{ margin: '0 6px' }}>
                      |
                    </span>
                  </>
                )}
                {invoiceByMonthEnabled ? (
                  invoiceMeta?.href ? (
                    <a
                      href={invoiceMeta.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent-secondary)', fontWeight: 800 }}
                    >
                      {t('platformUsageBilling.invoiceForMonth', { month: invoiceMonthLabel }) ||
                        `Invoice (${invoiceMonthLabel})`}
                    </a>
                  ) : (
                    <span style={{ fontWeight: 800 }}>
                      {t('platformUsageBilling.dataNotAvailable') || 'Data not available'}
                    </span>
                  )
                ) : (
                  <a
                    href={invoiceHref}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-secondary)', fontWeight: 800 }}
                  >
                    invoice.pdf
                  </a>
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="card-block">
          <h3 style={{ margin: 0, marginBottom: 6 }}>Error</h3>
          <p className="muted" style={{ margin: 0 }}>
            {error}
          </p>
        </div>
      ) : null}

      {!activeProvider?.active ? (
        <div className="card-block">
          <h3 style={{ margin: 0, marginBottom: 6 }}>
            {t('platformUsageBilling.providerInactive') || 'Provider not active yet.'}
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            {t('platformUsageBilling.providerInactiveHint') || 'Switch back to Skale to view data.'}
          </p>
        </div>
      ) : null}

      {activeProvider?.active && usageEnabled ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--accent-secondary)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              KPI
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{kpis.totalUsers}</div>
            <div className="muted">{t('platformUsageBilling.kpi.totalUsers') || 'Total Users'}</div>
          </div>

          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--success)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              KPI
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {kpis.systemActive}
            </div>
            <div className="muted">
              {t('platformUsageBilling.kpi.systemActive') || 'Active CRM Users'}
            </div>
          </div>

          <div className="card-block" style={{ padding: 12, borderLeft: '3px solid var(--info)' }}>
            <div className="eyebrow" style={{ fontSize: 11 }}>
              KPI
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {kpis.activeLast30}
            </div>
            <div className="muted">
              {t('platformUsageBilling.kpi.active30', { days: activeDaysWindow }) ||
                `Users active in last ${activeDaysWindow} days`}
            </div>
          </div>

          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--warning)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              KPI
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {kpis.dormantOver30}
            </div>
            <div className="muted">
              {t('platformUsageBilling.kpi.activeNoLogin30', { days: activeDaysWindow }) ||
                `Dormant Users (>${activeDaysWindow} days no login)`}
            </div>
          </div>

          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--warning)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.billing.title') || 'Potential Billing Optimization'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {billing.dormantBillable}
            </div>
            <div className="muted">
              {t('platformUsageBilling.billing.dormantBillable') || 'Dormant Users'}
            </div>
          </div>

          <div className="card-block" style={{ padding: 12, borderLeft: '3px solid var(--info)' }}>
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.billing.title') || 'Potential Billing Optimization'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {formatMoneyUSD(billing.monthly)}
            </div>
            <div className="muted">
              {t('platformUsageBilling.billing.monthly') || 'Monthly impact'}
            </div>
          </div>

          <div className="card-block" style={{ padding: 12, borderLeft: '3px solid var(--info)' }}>
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.billing.title') || 'Potential Billing Optimization'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {formatMoneyUSD(billing.quarterly)}
            </div>
            <div className="muted">
              {t('platformUsageBilling.billing.quarterly') || 'Quarterly impact'}
            </div>
          </div>

          <div className="card-block" style={{ padding: 12, borderLeft: '3px solid var(--info)' }}>
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.billing.title') || 'Potential Billing Optimization'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {formatMoneyUSD(billing.yearly)}
            </div>
            <div className="muted">
              {t('platformUsageBilling.billing.yearly') || 'Yearly impact'}
            </div>
          </div>
        </div>
      ) : null}

      {activeProvider?.active && !usageEnabled ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--accent-secondary)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.invoice.month') || 'Invoice month'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
              {invoiceMonthLabel}
            </div>
            <div className="muted">{activeProvider.label}</div>
          </div>

          <div className="card-block" style={{ padding: 12, borderLeft: '3px solid var(--info)' }}>
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.invoice.total') || 'Total payable'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
              {invoiceMeta ? formatMoneyCurrency(invoiceMeta.total, invoiceMeta.currency) : '—'}
            </div>
            <div className="muted">
              {invoiceMeta
                ? `${t('platformUsageBilling.invoice.invoiceNo') || 'Invoice'} #${invoiceMeta.invoiceNo}`
                : t('platformUsageBilling.dataNotAvailable') || 'Data not available'}
            </div>
          </div>

          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--border-primary)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.invoice.date') || 'Invoice date'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
              {invoiceMeta?.invoiceDate || '—'}
            </div>
            <div className="muted">
              {t('platformUsageBilling.invoice.due') || 'Due'}: {invoiceMeta?.dueDate || '—'}
            </div>
          </div>

          <div
            className="card-block"
            style={{ padding: 12, borderLeft: '3px solid var(--border-primary)' }}
          >
            <div className="eyebrow" style={{ fontSize: 11 }}>
              {t('platformUsageBilling.invoice.vat') || 'VAT'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
              {invoiceMeta ? `${invoiceMeta.vatPercent}%` : '—'}
            </div>
            <div className="muted">{invoiceMeta ? invoiceMeta.currency : '—'}</div>
          </div>

          <div className="card-block" style={{ padding: 12, gridColumn: '1 / -1' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div className="eyebrow" style={{ fontSize: 11 }}>
                  {t('platformUsageBilling.invoice.items') || 'Line items'}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {invoiceMeta
                    ? ''
                    : t('platformUsageBilling.dataNotAvailable') || 'Data not available'}
                </div>
              </div>
              {invoiceMeta?.href ? (
                <a
                  href={invoiceMeta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="pill-tab"
                  style={{ padding: '6px 10px' }}
                >
                  {t('platformUsageBilling.invoiceLink') || 'Invoice PDF'}
                </a>
              ) : null}
            </div>

            {invoiceMeta?.items?.length
              ? (() => {
                  const hasBreakdown = invoiceMeta.items.some(
                    (it) =>
                      String(it?.sku || '').trim() ||
                      safeNumber(it?.qty) != null ||
                      safeNumber(it?.unitPrice) != null
                  )

                  if (!hasBreakdown) {
                    return (
                      <div
                        style={{
                          marginTop: 10,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {invoiceMeta.items.map((it, idx) => (
                          <div
                            key={`${it.description}-${idx}`}
                            className="card-block"
                            style={{ padding: 12 }}
                          >
                            <div style={{ fontWeight: 900 }}>{it.description}</div>
                            <div className="muted" style={{ marginTop: 4 }}>
                              {formatMoneyCurrency(
                                invoiceLineAmount(it) ?? it.amount,
                                invoiceMeta.currency
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  return (
                    <div style={{ marginTop: 10, overflowX: 'auto' }}>
                      <table className="data-table" style={{ minWidth: 760 }}>
                        <thead>
                          <tr>
                            <th>{t('platformUsageBilling.invoice.sku') || 'SKU'}</th>
                            <th>{t('platformUsageBilling.invoice.items') || 'Line items'}</th>
                            <th style={{ textAlign: 'right' }}>
                              {t('platformUsageBilling.invoice.qty') || 'QTY'}
                            </th>
                            <th style={{ textAlign: 'right' }}>
                              {t('platformUsageBilling.invoice.unitPrice') || 'Unit price'}
                            </th>
                            <th style={{ textAlign: 'right' }}>
                              {t('platformUsageBilling.invoice.amount') || 'Amount'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceMeta.items.map((it, idx) => {
                            const qty = safeNumber(it?.qty)
                            const unitPrice = safeNumber(it?.unitPrice)
                            const amount = invoiceLineAmount(it)
                            return (
                              <tr key={`${it.description}-${idx}`}>
                                <td style={{ fontWeight: 900 }}>{String(it?.sku || '—')}</td>
                                <td>{String(it?.description || '—')}</td>
                                <td style={{ textAlign: 'right' }}>{qty == null ? '—' : qty}</td>
                                <td style={{ textAlign: 'right' }}>
                                  {unitPrice == null
                                    ? '—'
                                    : formatMoneyCurrency(unitPrice, invoiceMeta.currency, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 900 }}>
                                  {amount == null
                                    ? '—'
                                    : formatMoneyCurrency(amount, invoiceMeta.currency, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })()
              : null}
          </div>
        </div>
      ) : null}

      {activeProvider?.active && usageEnabled ? (
        <section className="card-block table-card" style={{ marginTop: 14 }}>
          <div className="card-block-header">
            <div>
              <p className="eyebrow">
                {t('platformUsageBilling.orgImpact.eyebrow') || 'Org Chart Impact'}
              </p>
              <h3>{t('platformUsageBilling.orgImpact.title') || 'Org Chart Impact Table'}</h3>
              <p className="muted">{t('platformUsageBilling.orgImpact.clickHint') || ''}</p>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'right' }}>
              <div style={{ fontWeight: 800 }}>Rows</div>
              <div className="muted">{orgImpactRows.length}</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>{t('platformUsageBilling.orgImpact.orgNode') || 'Department'}</th>
                  <th>{t('platformUsageBilling.orgImpact.teamLeader') || 'Team Leader'}</th>
                  <th>{t('platformUsageBilling.orgImpact.total') || 'Total Users'}</th>
                  <th>
                    {t('platformUsageBilling.orgImpact.active30', { days: activeDaysWindow }) ||
                      `Active in last ${activeDaysWindow} days`}
                  </th>
                  <th>
                    {t('platformUsageBilling.orgImpact.dormant', { days: activeDaysWindow }) ||
                      `Dormant users (>${activeDaysWindow} days)`}
                  </th>
                  <th>{t('platformUsageBilling.orgImpact.action') || 'Suggested Action'}</th>
                </tr>
              </thead>
              <tbody>
                {orgImpactRows.map((r) => {
                  const activePct =
                    r.totalUsers > 0 ? Math.round((r.activeLast30 / r.totalUsers) * 100) : 0
                  const isOpen = selectedOrgNode === r.orgNode

                  return (
                    <Fragment key={r.orgNode}>
                      <tr
                        onClick={() =>
                          setSelectedOrgNode((prev) => (prev === r.orgNode ? '' : r.orgNode))
                        }
                        style={{
                          cursor: 'pointer',
                          background: isOpen ? 'var(--bg-tertiary)' : undefined,
                        }}
                        aria-label={`${t('platformUsageBilling.orgImpact.openDepartment') || 'Open department'}: ${r.orgNode}`}
                      >
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 800 }}>{r.orgNode}</td>
                        <td>{r.teamLeader}</td>
                        <td>{r.totalUsers}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                            >
                              <span style={{ fontWeight: 800 }}>{r.activeLast30}</span>
                              <span className="muted" style={{ fontSize: 12 }}>
                                {activePct}%
                              </span>
                            </div>
                            <div
                              aria-hidden="true"
                              style={{
                                height: 6,
                                borderRadius: 999,
                                background: 'var(--bg-secondary)',
                                overflow: 'hidden',
                                border: '1px solid var(--border-primary)',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${activePct}%`,
                                  background: 'var(--success-light)',
                                  borderRadius: 999,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            fontWeight: 800,
                            color: r.dormantOver30 > 0 ? 'var(--warning-light)' : undefined,
                          }}
                        >
                          {r.dormantOver30}
                        </td>
                        <td>{r.suggestedAction}</td>
                      </tr>

                      {isOpen ? (
                        <tr style={{ borderTop: '1px solid var(--border-primary)' }}>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: 12 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 10,
                                  marginBottom: 10,
                                }}
                              >
                                <div>
                                  <div className="eyebrow">
                                    {t('platformUsageBilling.departmentDetails.eyebrow') ||
                                      'Department details'}
                                  </div>
                                  <div style={{ fontWeight: 900 }}>
                                    {r.orgNode}
                                    {r.teamLeader && r.teamLeader !== '—' ? (
                                      <span
                                        className="muted"
                                        style={{ marginLeft: 8, fontWeight: 800 }}
                                      >
                                        · {r.teamLeader}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrgNode('')}
                                  className="pill-tab"
                                  style={{ padding: '6px 10px' }}
                                >
                                  {t('platformUsageBilling.departmentDetails.clear') || 'Clear'}
                                </button>
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                                  gap: 12,
                                }}
                              >
                                <div
                                  className="card-block table-card"
                                  style={{ padding: 12, minWidth: 0 }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: 10,
                                      alignItems: 'baseline',
                                      marginBottom: 10,
                                    }}
                                  >
                                    <div>
                                      <div className="eyebrow">
                                        {t('platformUsageBilling.departmentDetails.active') ||
                                          'Active Users'}
                                      </div>
                                      <div
                                        className="muted"
                                        style={{ fontSize: 12, fontWeight: 800 }}
                                      >
                                        {selectedUsersActive.length} / {selectedUsers.length}
                                      </div>
                                    </div>
                                    <div className="muted" style={{ fontSize: 12 }}>
                                      {activeDaysWindow}d
                                    </div>
                                  </div>

                                  <div
                                    style={{ maxHeight: 360, overflow: 'auto' }}
                                    className="hide-scrollbar"
                                  >
                                    <table className="simple-table">
                                      <thead>
                                        <tr>
                                          <th>User</th>
                                          <th>Status</th>
                                          <th>Last login</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedUsersActive.length ? (
                                          selectedUsersActive.map((u) => (
                                            <tr key={compactUserRowKey(u)}>
                                              <td>
                                                <div style={{ fontWeight: 800 }}>
                                                  {u.displayName}
                                                </div>
                                                <div className="muted" style={{ fontSize: 12 }}>
                                                  {u.email || '—'}
                                                </div>
                                              </td>
                                              <td>{u.status}</td>
                                              <td>{formatDateTime(u.lastLogin)}</td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={3} className="muted">
                                              —
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div
                                  className="card-block table-card"
                                  style={{ padding: 12, minWidth: 0 }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: 10,
                                      alignItems: 'baseline',
                                      marginBottom: 10,
                                    }}
                                  >
                                    <div>
                                      <div className="eyebrow">
                                        {t('platformUsageBilling.departmentDetails.notActive') ||
                                          'Inactive Users'}
                                      </div>
                                      <div
                                        className="muted"
                                        style={{ fontSize: 12, fontWeight: 800 }}
                                      >
                                        {selectedUsersNotActive.length} / {selectedUsers.length}
                                      </div>
                                    </div>
                                    <div className="muted" style={{ fontSize: 12 }}>
                                      &gt; {activeDaysWindow}d
                                    </div>
                                  </div>

                                  <div
                                    style={{ maxHeight: 360, overflow: 'auto' }}
                                    className="hide-scrollbar"
                                  >
                                    <table className="simple-table">
                                      <thead>
                                        <tr>
                                          <th>User</th>
                                          <th>Status</th>
                                          <th>Last login</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedUsersNotActive.length ? (
                                          selectedUsersNotActive.map((u) => (
                                            <tr key={compactUserRowKey(u)}>
                                              <td>
                                                <div style={{ fontWeight: 800 }}>
                                                  {u.displayName}
                                                </div>
                                                <div className="muted" style={{ fontSize: 12 }}>
                                                  {u.email || '—'}
                                                </div>
                                                <div className="muted" style={{ fontSize: 12 }}>
                                                  {u.usageLevel}{' '}
                                                  {Number.isFinite(u.daysSinceLogin)
                                                    ? `· ${u.daysSinceLogin}d`
                                                    : ''}
                                                </div>
                                              </td>
                                              <td>{u.status}</td>
                                              <td>{formatDateTime(u.lastLogin)}</td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={3} className="muted">
                                              —
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
