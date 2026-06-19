const PHASES = [
  {
    id: 'discovery',
    title: '1) Discovery and mapping',
    status: 'In progress',
    owner: 'Ops + Tech',
    points: [
      'Map legacy CRM fields to FXBO entities',
      'Confirm Acuity touchpoints and ownership split',
      'Freeze glossary and naming conventions',
    ],
  },
  {
    id: 'architecture',
    title: '2) Integration architecture',
    status: 'Pending',
    owner: 'Tech',
    points: [
      'REST API for server-to-server migration jobs',
      'Client API only for client-area user flows',
      'Define token, IP whitelist, and callback strategy',
    ],
  },
  {
    id: 'build',
    title: '3) Build and dry-run',
    status: 'Pending',
    owner: 'Tech + Data',
    points: [
      'Create migration adapter and retry-safe jobs',
      'Run dry-run on sample segments',
      'Track rejects and field-level validation errors',
    ],
  },
  {
    id: 'uat',
    title: '4) UAT and sign-off',
    status: 'Pending',
    owner: 'Ops + Compliance',
    points: [
      'Validate profile, account, and status parity',
      'Test Acuity data flow end-to-end',
      'Approve go-live checklist',
    ],
  },
  {
    id: 'cutover',
    title: '5) Cutover and monitoring',
    status: 'Pending',
    owner: 'Ops',
    points: [
      'Execute final delta sync',
      'Switch production integrations to FXBO',
      'Monitor KPIs, errors, and reconciliation',
    ],
  },
]

const CHECKLIST = [
  'API manager created with least-privilege REST methods',
  'Server secrets stored outside frontend code',
  'Acuity credentials and callbacks confirmed with FXBO support',
  'UAT dataset prepared (new, active, blocked, and edge-case users)',
  'Rollback procedure documented and tested',
  'Ownership matrix defined (FXBO, internal team, Acuity side)',
]

const OPEN_TICKETS = [
  {
    id: 64389,
    title: 'Acuity Integration Kickoff Request for Bullwaves',
    owner: 'Filippo De Rosa',
    category: 'General Inquiries',
    priority: 'P0',
    impact: 'blocking',
    updated: '7h ago',
  },
  {
    id: 64150,
    title: 'Database Structure & BI Integration Requirements',
    owner: 'Filippo De Rosa',
    category: 'General Inquiries',
    priority: 'P0',
    impact: 'blocking',
    updated: '6d ago',
  },
  {
    id: 63674,
    title: 'New Installation - Moonance LLC (Bullwaves SVG) - cid:1',
    owner: 'Olga',
    category: 'Installations',
    priority: 'P1',
    impact: 'at-risk',
    updated: '2h ago',
  },
  {
    id: 63371,
    title: 'New Installation - Equitex Capital Limited (Bullwaves Seychelles) - cid:0',
    owner: 'Anna A',
    category: 'Installations',
    priority: 'P1',
    impact: 'at-risk',
    updated: '2h ago',
  },
  {
    id: 64286,
    title: '[Feature request] - Instant Withdrawals',
    owner: 'Olga',
    category: 'Feature Requests',
    priority: 'P2',
    impact: 'monitor',
    updated: '1d ago',
  },
  {
    id: 64283,
    title: '[Feature request] - Mobile app',
    owner: 'Olga',
    category: 'Feature Requests',
    priority: 'P2',
    impact: 'monitor',
    updated: '3h ago',
  },
  {
    id: 64284,
    title: '[Feature request] - Brokeree Social Trading',
    owner: 'Olga',
    category: 'Feature Requests',
    priority: 'P2',
    impact: 'monitor',
    updated: '5d ago',
  },
  {
    id: 64357,
    title: 'Microsoft Teams with Cellxpert',
    owner: 'Renato Pezzi',
    category: 'General Inquiries',
    priority: 'P2',
    impact: 'monitor',
    updated: '4d ago',
  },
]

function statusTone(status) {
  if (status === 'In progress') return { bg: 'rgba(251,191,36,0.16)', fg: '#f59e0b' }
  if (status === 'Done') return { bg: 'rgba(16,185,129,0.16)', fg: '#10b981' }
  return { bg: 'rgba(148,163,184,0.16)', fg: '#94a3b8' }
}

function priorityTone(priority) {
  if (priority === 'P0') return { bg: 'rgba(248,113,113,0.18)', fg: '#fca5a5' }
  if (priority === 'P1') return { bg: 'rgba(251,191,36,0.16)', fg: '#fcd34d' }
  return { bg: 'rgba(96,165,250,0.16)', fg: '#93c5fd' }
}

function impactTone(impact) {
  if (impact === 'blocking') return { bg: 'rgba(239,68,68,0.2)', fg: '#fca5a5', label: 'blocking' }
  if (impact === 'at-risk') return { bg: 'rgba(245,158,11,0.2)', fg: '#fcd34d', label: 'at risk' }
  return { bg: 'rgba(16,185,129,0.2)', fg: '#86efac', label: 'monitor' }
}

export default function FxboMigrationPage() {
  const ticketKpis = {
    total: OPEN_TICKETS.length,
    blocking: OPEN_TICKETS.filter((ticket) => ticket.impact === 'blocking').length,
    atRisk: OPEN_TICKETS.filter((ticket) => ticket.impact === 'at-risk').length,
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'grid',
        gap: 18,
        color: '#e2e8f0',
      }}
    >
      <section
        style={{
          borderRadius: 20,
          border: '1px solid rgba(148,163,184,0.22)',
          background:
            'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(17,94,89,0.44) 52%, rgba(6,78,59,0.42) 100%)',
          padding: '22px 22px 20px',
          boxShadow: '0 20px 44px rgba(2,6,23,0.3)',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: 18,
            padding: '14px 14px 12px',
            borderRadius: 16,
            border: '1px solid rgba(110,231,183,0.26)',
            background:
              'radial-gradient(circle at 22% -20%, rgba(16,185,129,0.3), rgba(15,23,42,0) 54%), radial-gradient(circle at 86% 120%, rgba(59,130,246,0.26), rgba(15,23,42,0) 48%), rgba(2,6,23,0.56)',
            boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.08), 0 16px 36px rgba(2,6,23,0.26)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              overflowX: 'auto',
              paddingBottom: 8,
            }}
          >
            <img
              src="/fx-back-office-crm-1.png"
              alt="FXBO"
              style={{
                height: 72,
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
                maxWidth: '48vw',
                filter: 'drop-shadow(0 3px 8px rgba(2,6,23,0.35)) contrast(1.08) saturate(1.05)',
              }}
            />
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                lineHeight: 1,
                color: '#86efac',
                letterSpacing: '0.03em',
                flexShrink: 0,
                textShadow: '0 0 18px rgba(16,185,129,0.35)',
              }}
            >
              |
            </span>
            <img
              src="/Logo.png"
              alt="Bullwaves"
              style={{
                height: 72,
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
                maxWidth: '38vw',
                filter: 'drop-shadow(0 8px 20px rgba(56,189,248,0.22))',
              }}
            />
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#a7f3d0',
              textShadow: '0 0 14px rgba(16,185,129,0.35)',
              whiteSpace: 'normal',
            }}
          >
            FXBO | Bullwaves Migration Control Room
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 999,
                border: '1px solid rgba(110,231,183,0.36)',
                background: 'rgba(16,185,129,0.14)',
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6ee7b7',
              }}
            >
              Database
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(1.3rem, 2.8vw, 1.9rem)' }}>
              FXBO migration
            </h1>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.55 }}>
              Single operational view for the CRM migration stream, including Acuity integration,
              API strategy, rollout phases, and readiness checklist.
            </p>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.22)',
              background: 'rgba(2,6,23,0.34)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>
              Current objective
            </div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>
              Define official FXBO procedure and execute a safe staged migration
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#cbd5e1' }}>
              Focus: legacy CRM parity, Acuity continuity, and controlled cutover.
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        <article
          style={{
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.72)',
            padding: 14,
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>API strategy</h3>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
            Use REST API for server-side migration and admin operations. Use Client API only for
            client area interactions and client-facing flows.
          </div>
        </article>

        <article
          style={{
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.72)',
            padding: 14,
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Acuity stream</h3>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
            Reconfirm all Acuity credentials, callbacks, and ownership with FXBO support before UAT
            to avoid breaks during cutover.
          </div>
        </article>

        <article
          style={{
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.72)',
            padding: 14,
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Delivery model</h3>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
            Execute in phases: discovery, architecture, dry-run, UAT, then production cutover with
            post-launch monitoring.
          </div>
        </article>
      </section>

      <section
        style={{
          borderRadius: 16,
          border: '1px solid rgba(148,163,184,0.18)',
          background: 'rgba(2,6,23,0.62)',
          padding: 14,
        }}
      >
        <h2 style={{ margin: '2px 0 12px', fontSize: 17 }}>Migration phases</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {PHASES.map((phase) => {
            const tone = statusTone(phase.status)
            return (
              <article
                key={phase.id}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.16)',
                  background: 'rgba(15,23,42,0.56)',
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 14 }}>{phase.title}</h3>
                  <div
                    style={{
                      display: 'inline-flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '3px 8px',
                        background: tone.bg,
                        color: tone.fg,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {phase.status}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Owner: {phase.owner}</span>
                  </div>
                </div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#cbd5e1', lineHeight: 1.5 }}>
                  {phase.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      <section
        style={{
          borderRadius: 16,
          border: '1px solid rgba(148,163,184,0.18)',
          background: 'rgba(2,6,23,0.62)',
          padding: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17 }}>Open tickets</h2>
          <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 800,
                color: '#bfdbfe',
                background: 'rgba(59,130,246,0.18)',
              }}
            >
              Total: {ticketKpis.total}
            </span>
            <span
              style={{
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 800,
                color: '#fca5a5',
                background: 'rgba(239,68,68,0.2)',
              }}
            >
              Blocking: {ticketKpis.blocking}
            </span>
            <span
              style={{
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 800,
                color: '#fcd34d',
                background: 'rgba(245,158,11,0.2)',
              }}
            >
              At risk: {ticketKpis.atRisk}
            </span>
          </div>
        </div>

        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.14)',
            overflowX: 'auto',
            background: 'rgba(15,23,42,0.5)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: 'rgba(30,41,59,0.6)' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Impact</th>
                <th style={thStyle}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {OPEN_TICKETS.map((ticket) => {
                const priority = priorityTone(ticket.priority)
                const impact = impactTone(ticket.impact)
                return (
                  <tr key={ticket.id} style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                    <td style={tdStyle}>#{ticket.id}</td>
                    <td style={{ ...tdStyle, maxWidth: 380 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 360,
                          verticalAlign: 'bottom',
                        }}
                        title={ticket.title}
                      >
                        {ticket.title}
                      </span>
                    </td>
                    <td style={tdStyle}>{ticket.owner}</td>
                    <td style={tdStyle}>{ticket.category}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: priority.fg,
                          background: priority.bg,
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: impact.fg,
                          background: impact.bg,
                        }}
                      >
                        {impact.label}
                      </span>
                    </td>
                    <td style={tdStyle}>{ticket.updated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          borderRadius: 16,
          border: '1px solid rgba(148,163,184,0.18)',
          background: 'rgba(2,6,23,0.62)',
          padding: 14,
        }}
      >
        <h2 style={{ margin: '2px 0 10px', fontSize: 17 }}>Readiness checklist</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {CHECKLIST.map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.16)',
                background: 'rgba(15,23,42,0.54)',
                padding: '9px 10px',
                fontSize: 13,
                color: '#dbeafe',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  fontSize: 12,
  color: '#cbd5e1',
  fontWeight: 800,
  padding: '9px 10px',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  fontSize: 12,
  color: '#e2e8f0',
  padding: '9px 10px',
  verticalAlign: 'top',
}