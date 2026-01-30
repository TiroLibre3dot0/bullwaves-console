const severityStyle = (severity) => {
  if (severity === 'high')
    return {
      border: 'rgba(248,113,113,0.35)',
      bg: 'rgba(248,113,113,0.10)',
      fg: '#fecaca',
      chipBg: 'rgba(248,113,113,0.18)',
    }
  if (severity === 'medium')
    return {
      border: 'rgba(234,179,8,0.30)',
      bg: 'rgba(234,179,8,0.10)',
      fg: '#fde68a',
      chipBg: 'rgba(234,179,8,0.16)',
    }
  if (severity === 'low')
    return {
      border: 'rgba(148,163,184,0.25)',
      bg: 'rgba(148,163,184,0.08)',
      fg: '#e2e8f0',
      chipBg: 'rgba(148,163,184,0.12)',
    }
  if (severity === 'good')
    return {
      border: 'rgba(34,197,94,0.30)',
      bg: 'rgba(34,197,94,0.10)',
      fg: '#bbf7d0',
      chipBg: 'rgba(34,197,94,0.16)',
    }
  return {
    border: 'rgba(255,255,255,0.10)',
    bg: 'rgba(2,6,23,0.25)',
    fg: '#e2e8f0',
    chipBg: 'rgba(148,163,184,0.12)',
  }
}

function Chip({ children, severity }) {
  const s = severityStyle(severity)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        background: s.chipBg,
        border: `1px solid ${s.border}`,
        color: s.fg,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function BulletList({ items, max }) {
  const list = (Array.isArray(items) ? items : []).filter(Boolean).slice(0, max)
  if (!list.length) return null
  return (
    <ul
      style={{
        margin: '6px 0 0 16px',
        padding: 0,
        color: 'rgba(226,232,240,0.85)',
        fontSize: 12,
        lineHeight: 1.35,
      }}
    >
      {list.map((x, idx) => (
        <li key={`${idx}-${x}`} style={{ marginBottom: 4 }}>
          {x}
        </li>
      ))}
    </ul>
  )
}

export default function InsightsPanel({ insights = [], mode = 'executive' }) {
  const list = Array.isArray(insights) ? insights : []
  if (!list.length) {
    return (
      <div style={{ color: 'rgba(203,213,225,0.7)', fontSize: 12 }}>
        No insights available (insufficient eligible months).
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 10 }}>
      {list.map((ins) => {
        const s = severityStyle(ins.severity)
        const isExec = mode === 'executive'

        return (
          <div
            key={ins.id}
            style={{
              border: `1px solid ${s.border}`,
              borderRadius: 12,
              padding: '12px 14px',
              background: s.bg,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 118,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontWeight: 900, color: '#e2e8f0', fontSize: 13 }}>{ins.title}</div>
              <Chip severity={ins.severity}>{String(ins.severity || '').toUpperCase()}</Chip>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'rgba(203,213,225,0.75)', fontWeight: 800 }}>
                Why
              </div>
              <BulletList items={ins.why} max={3} />
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'rgba(203,213,225,0.75)', fontWeight: 800 }}>
                Do now
              </div>
              <BulletList items={ins.do_now} max={isExec ? 2 : 3} />
            </div>

            {!isExec ? (
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(203,213,225,0.75)', fontWeight: 800 }}>
                    Expected impact
                  </div>
                  <BulletList items={ins.expected_impact} max={2} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(203,213,225,0.75)', fontWeight: 800 }}>
                    Owner / next check
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(226,232,240,0.85)' }}>
                    <div>
                      <b style={{ color: '#e2e8f0' }}>{ins.owner || '—'}</b>
                    </div>
                    <div style={{ color: 'rgba(226,232,240,0.75)' }}>{ins.next_check || '—'}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
