import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { sections } from './orgChartData'

// ---------------------------------------------------------------------------
// Access level logic (mirrors AuthenticatedApp.jsx)
// ---------------------------------------------------------------------------
const ADMIN_EMAILS = new Set(['paolo.v@bullwaves.com'])
const MANAGEMENT_SECTIONS = ['Management Team', 'Management', 'C-Suite', 'Executive']

function isSalesDepartment(department = '') {
  const d = String(department || '')
    .trim()
    .toLowerCase()
  return d.startsWith('sales') || d.includes('business development')
}

function getAccessLevel(user) {
  const email = (user.email || '').toLowerCase()
  if (ADMIN_EMAILS.has(email)) return 'admin'
  const section = (user.section || '').trim()
  const isManagement = MANAGEMENT_SECTIONS.some((s) =>
    section.toLowerCase().includes(s.toLowerCase())
  )
  if (isManagement) return 'admin'
  const dept = (user.department || user.section || '').trim().toLowerCase()
  if (dept === 'support team') return 'support'
  if (isSalesDepartment(dept)) return 'sales'
  return 'full'
}

const ACCESS_LEVELS = {
  admin: {
    label: 'Admin',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.15)',
    tooltip: 'Accesso completo + Gestione Accessi, Custom Events, Email Templates',
  },
  full: {
    label: 'Accesso Completo',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.1)',
    tooltip: 'Accesso a tutte le sezioni della console',
  },
  support: {
    label: 'Support',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    tooltip:
      'Sezioni visibili: Home, User Check, AI Assistant, WhatsApp Perf., Trustpilot, Validazione Provvigioni, Organigramma, Upload Report',
  },
  sales: {
    label: 'Sales / BD',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.12)',
    tooltip:
      'Sezioni visibili: Home, User Check, AI Assistant, WhatsApp Perf., Trustpilot, Validazione Provvigioni, Organigramma (no Upload)',
  },
}

function AccessBadge({ level }) {
  const cfg = ACCESS_LEVELS[level] || ACCESS_LEVELS.full
  return (
    <span
      title={cfg.tooltip}
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 9px',
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        cursor: 'help',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

// Build the full allowlist from orgchart (all sections, all emails)
function buildFullAllowlist() {
  const deduped = new Map()
  sections.forEach((section) => {
    ;(section.roles || []).forEach((role) => {
      const email = (role.email || '').trim().toLowerCase()
      if (!email || email === '—') return
      if (deduped.has(email)) return
      deduped.set(email, {
        name: role.name || '',
        email,
        title: role.title || '',
        department: role.department || '',
        section: section.title || section.id,
      })
    })
  })
  return Array.from(deduped.values())
}

function EyeIcon({ open }) {
  return open ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

export default function AdminPasswordsPage() {
  const { token } = useAuth()
  const allowlist = useMemo(() => buildFullAllowlist(), [])

  const [users, setUsers] = useState([]) // { email, pwd, enabled }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visiblePwds, setVisiblePwds] = useState(new Set())
  const [copiedEmail, setCopiedEmail] = useState(null)
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)

  // Build lookup map: email → name/department from allowlist
  const metaMap = useMemo(() => {
    const m = new Map()
    allowlist.forEach((u) => m.set(u.email, u))
    return m
  }, [allowlist])

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  )

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Errore caricamento')
      setUsers(data.users || [])
    } catch (e) {
      setError(e.message || 'Errore di rete')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin/generate', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          allowlist: allowlist.map((u) => ({ email: u.email, name: u.name })),
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Errore generazione')
      setUsers(data.users || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleEnabled = async (email, enabled) => {
    setError('')
    try {
      const res = await fetch('/api/auth/admin/toggle-enabled', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ email, enabled }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Errore')
      setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, enabled } : u)))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRegenerate = async (email) => {
    if (
      !window.confirm(`Rigenerare la password per ${email}? Quella precedente non funzionerà più.`)
    )
      return
    setError('')
    try {
      const res = await fetch('/api/auth/admin/regenerate', {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Errore')
      setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, pwd: data.pwd } : u)))
      // Auto-show the new password
      setVisiblePwds((prev) => new Set([...prev, email]))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleCopy = (email, pwd) => {
    const text = `Email: ${email}\nPassword: ${pwd}`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    })
  }

  const toggleVisible = (email) => {
    setVisiblePwds((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  // Merge server data with allowlist meta, and add missing allowlist entries
  const merged = useMemo(() => {
    const serverMap = new Map(users.map((u) => [u.email, u]))
    // Users with a password (from server)
    const withPwd = users.map((u) => ({
      ...metaMap.get(u.email),
      ...u,
    }))
    // Allowlist users not yet in server store
    const missing = allowlist
      .filter((u) => !serverMap.has(u.email))
      .map((u) => ({
        ...u,
        pwd: null,
        enabled: null,
      }))
    return [...withPwd, ...missing]
  }, [users, allowlist, metaMap])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return merged
    return merged.filter(
      (u) =>
        u.email.includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
    )
  }, [merged, search])

  const totalWithPwd = users.length
  const totalAllowlist = allowlist.length
  const missing = totalAllowlist - totalWithPwd

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Gestione Accessi Console</h1>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 13 }}>
          Visibile solo a te. Rivela la password e condividila con la persona.
        </p>
      </div>

      {/* Access level legend */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 20,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#64748b',
            alignSelf: 'center',
            marginRight: 4,
          }}
        >
          LIVELLI ACCESSO:
        </span>
        {Object.entries(ACCESS_LEVELS).map(([key, cfg]) => (
          <span
            key={key}
            title={cfg.tooltip}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'help' }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: cfg.color,
                display: 'inline-block',
              }}
            />
            <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
            <span style={{ color: '#64748b' }}>—</span>
            <span style={{ color: '#94a3b8' }}>{cfg.tooltip}</span>
          </span>
        ))}
      </div>

      {/* Stats + actions */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <Chip label={`${totalWithPwd} con password`} color="#22c55e" />
          {missing > 0 && <Chip label={`${missing} senza password`} color="#f59e0b" />}
          <Chip
            label={`${users.filter((u) => u.enabled === false).length} disabilitati`}
            color="#ef4444"
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {missing > 0 && (
            <button
              className="btn"
              onClick={handleGenerate}
              disabled={generating}
              style={{ fontSize: 13, padding: '6px 14px' }}
            >
              {generating ? 'Generando...' : `Genera password per ${missing} utenti`}
            </button>
          )}
          <button
            className="btn"
            onClick={fetchUsers}
            style={{
              fontSize: 13,
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Aggiorna
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Cerca per nome, email, reparto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          maxWidth: 360,
          marginBottom: 16,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
          color: 'inherit',
          fontSize: 13,
        }}
      />

      {loading ? (
        <div style={{ color: 'var(--text-muted, #94a3b8)', fontSize: 14 }}>Caricamento...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                <th style={th}>Nome</th>
                <th style={th}>Email</th>
                <th style={th}>Reparto</th>
                <th style={th}>Accesso</th>
                <th style={th}>Password</th>
                <th style={th}>Stato</th>
                <th style={th}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isVisible = visiblePwds.has(u.email)
                const hasPwd = u.pwd !== null && u.pwd !== undefined
                const isCopied = copiedEmail === u.email
                const accessLevel = getAccessLevel(u)

                return (
                  <tr
                    key={u.email}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      opacity: u.enabled === false ? 0.5 : 1,
                    }}
                  >
                    <td style={td}>{u.name || '—'}</td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                      {u.email}
                    </td>
                    <td style={td}>{u.department || u.section || '—'}</td>
                    <td style={td}>
                      <AccessBadge level={accessLevel} />
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace', minWidth: 180 }}>
                      {hasPwd ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ letterSpacing: isVisible ? 0 : 2 }}>
                            {isVisible ? u.pwd : '•'.repeat(u.pwd.length)}
                          </span>
                          <button
                            onClick={() => toggleVisible(u.email)}
                            title={isVisible ? 'Nascondi' : 'Mostra'}
                            style={iconBtn}
                          >
                            <EyeIcon open={isVisible} />
                          </button>
                          <button
                            onClick={() => handleCopy(u.email, u.pwd)}
                            title="Copia email + password"
                            style={{ ...iconBtn, color: isCopied ? '#22c55e' : undefined }}
                          >
                            {isCopied ? '✓' : <CopyIcon />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: 12 }}>Nessuna password</span>
                      )}
                    </td>
                    <td style={td}>
                      {hasPwd ? (
                        <button
                          onClick={() => handleToggleEnabled(u.email, !(u.enabled !== false))}
                          style={{
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 999,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            background:
                              u.enabled !== false ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: u.enabled !== false ? '#4ade80' : '#f87171',
                          }}
                        >
                          {u.enabled !== false ? 'Abilitato' : 'Disabilitato'}
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={td}>
                      {hasPwd ? (
                        <button
                          onClick={() => handleRegenerate(u.email)}
                          title="Rigenera password"
                          style={{
                            ...iconBtn,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          <RefreshIcon />
                          Rigenera
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Styles ──
const th = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const td = {
  padding: '10px 12px',
  verticalAlign: 'middle',
}

const iconBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted, #94a3b8)',
  padding: 4,
  borderRadius: 4,
  display: 'inline-flex',
  alignItems: 'center',
}

function Chip({ label, color }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 999,
        background: `${color}20`,
        border: `1px solid ${color}40`,
        color,
      }}
    >
      {label}
    </span>
  )
}
