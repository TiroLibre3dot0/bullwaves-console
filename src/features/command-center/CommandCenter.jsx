import React from 'react'
import { departmentColors } from '../../pages/orgChartData'
import CardSection from '../../components/common/CardSection'
import KpiCard from '../../components/common/KpiCard'

// --- MOCK DATA FOR STRATEGIC FOCUS, ALERTS, DECISION ZONE ---
const INITIATIVES = [
  {
    id: 'init1',
    epic: 'Retention',
    title: 'Improve D30 Retention',
    status: 'Live',
    owner: 'Francesco',
    department: 'Operations',
    referent: 'Francesco Ceccarini',
  },
  {
    id: 'init2',
    epic: 'Acquisition',
    title: 'New Affiliate Program',
    status: 'Planned',
    owner: 'Stefan',
    department: 'Affiliate Manager',
    referent: 'Stefan Popovski',
  },
  {
    id: 'init3',
    epic: 'Reactivation',
    title: 'Cohort Reactivation Push',
    status: 'In progress',
    owner: 'Daniel',
    department: 'Marketing',
    referent: 'Daniel',
  },
]

const ALERTS = [
  'Retention below target for Q2',
  'Affiliate 2287 flagged for clustering',
  'High withdrawal ratio detected',
]

const DECISION_ZONE = [
  'Approve new affiliate onboarding',
  'Escalate retention initiative',
  'Review risk signals for flagged accounts',
]

// --- MODERN SYSTEM HEALTH DATA MODEL ---
const SYSTEM_HEALTH = [
  {
    id: 'retention',
    label: 'RETENTION',
    intensity: 0.78, // 0–1 scale
    trend: 'up',
    delta: 2.1,
    color: '#7fff00', // lime
    kpis: [
      { label: 'FTD→QFTD %', value: 34, delta: 1.2 },
      { label: 'D30 Retention %', value: 21, delta: 0.8 },
      { label: 'Reactivation %', value: 12, delta: 0.5 },
    ],
  },

  {
    id: 'acquisition',
    label: 'ACQUISITION',
    intensity: 0.62,
    trend: 'flat',
    delta: -0.4,
    color: '#38bdf8', // blue
    kpis: [
      { label: 'New Affiliates', value: 8, delta: 2 },
      { label: 'FTD Count', value: 120, delta: -5 },
      { label: 'CPA Cost', value: 210, delta: 10 },
    ],
  },
  {
    id: 'reactivation',
    label: 'REACTIVATION',
    intensity: 0.44,
    trend: 'down',
    delta: -1.1,
    color: '#fbbf24', // yellow
    kpis: [
      { label: 'Cohort Reactivation %', value: 7, delta: -0.3 },
      { label: 'Winback Count', value: 15, delta: 2 },
      { label: 'Winback Cost', value: 90, delta: 5 },
    ],
  },

  {
    id: 'platform_ops',
    label: 'PLATFORM / OPS',
    intensity: 0.71,
    trend: 'up',
    delta: 0.9,
    color: '#a78bfa', // violet
    kpis: [
      { label: 'Uptime %', value: 99.7, delta: 0.1 },
      { label: 'Support SLA %', value: 92, delta: 1.4 },
      { label: 'Ops Incidents', value: 3, delta: -1 },
    ],
  },
]

const EXECUTION_TIMELINE = [
  { day: 'Mon', title: 'Milestone review', type: 'review' },
  { day: 'Tue', title: 'Approval window', type: 'approval' },
  { day: 'Wed', title: 'Delivery checkpoint', type: 'delivery' },
  { day: 'Thu', title: 'Risk sync', type: 'risk' },
  { day: 'Fri', title: 'Executive recap', type: 'recap' },
]

function clamp01(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function trendMeta(trend) {
  if (trend === 'up') return { arrow: '↑', color: '#22c55e' }
  if (trend === 'down') return { arrow: '↓', color: '#ef4444' }
  return { arrow: '→', color: 'rgba(148,163,184,0.9)' }
}

function impactHint(text) {
  const s = String(text || '').toLowerCase()
  if (s.includes('retention')) return 'Revenue risk + churn pressure'
  if (s.includes('affiliate')) return 'Fraud / quality risk'
  if (s.includes('withdrawal')) return 'Cashflow + compliance risk'
  if (s.includes('platform') || s.includes('ops')) return 'Delivery risk'
  return 'System risk'
}

function urgencyHint(text) {
  const s = String(text || '').toLowerCase()
  if (s.includes('approve')) return { label: 'HIGH', color: '#38bdf8', bg: 'rgba(56,189,248,0.14)' }
  if (s.includes('escalate'))
    return { label: 'HIGH', color: '#fb7185', bg: 'rgba(251,113,133,0.14)' }
  return { label: 'MED', color: 'rgba(148,163,184,0.95)', bg: 'rgba(148,163,184,0.10)' }
}

function progressForStatus(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('live')) return 0.78
  if (s.includes('in progress')) return 0.46
  if (s.includes('planned') || s.includes('next')) return 0.18
  return 0.22
}

function microAlertForInitiative(init) {
  const s = String(init?.status || '').toLowerCase()
  if (s.includes('live')) return { label: 'On track', tone: 'ok' }
  if (s.includes('in progress')) return { label: 'Needs decision', tone: 'warn' }
  if (s.includes('planned')) return { label: 'Kickoff pending', tone: 'muted' }
  return { label: 'Monitor', tone: 'muted' }
}

function statusToKanban(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('live')) return 'Live'
  if (s.includes('planned') || s.includes('next')) return 'Next'
  if (s.includes('in progress')) return 'In Progress'
  return 'Next'
}

function Ring({ pct, color }) {
  const p = clamp01(pct)
  const deg = Math.round(p * 360)
  return (
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 999,
        background: `conic-gradient(${color} ${deg}deg, rgba(148,163,184,0.14) 0deg)`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 16px 34px rgba(0,0,0,0.35)`,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: 'linear-gradient(180deg, rgba(2,6,23,0.92), rgba(2,6,23,0.72))',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(226,232,240,0.95)',
          fontWeight: 950,
          fontSize: 12,
          letterSpacing: 0.2,
        }}
      >
        {Math.round(p * 100)}%
      </div>
    </div>
  )
}

export default function CommandCenter({
  onDrillDown,
  onOpenKanban,
  onOpenProjectBoard,
  embedded = false,
}) {
  const kanban = {
    Live: INITIATIVES.filter((i) => statusToKanban(i.status) === 'Live'),
    Next: INITIATIVES.filter((i) => statusToKanban(i.status) === 'Next'),
    'In Progress': INITIATIVES.filter((i) => statusToKanban(i.status) === 'In Progress'),
  }

  const goKanban = () => {
    if (typeof onOpenKanban === 'function') return onOpenKanban()
    if (typeof onDrillDown === 'function') return onDrillDown()
  }

  const goBoard = () => {
    if (typeof onOpenProjectBoard === 'function') return onOpenProjectBoard()
    if (typeof onDrillDown === 'function') return onDrillDown()
  }

  return (
    <div className="cc-root">
      {embedded ? null : (
        <>
          <div
            className="cc-eyebrow"
            style={{
              color: 'rgba(148,163,184,0.95)',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.2,
            }}
          >
            Strategic Execution
          </div>
          <div
            className="cc-title"
            style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#fff' }}
          >
            Command Center
          </div>
          <div
            className="cc-subtitle"
            style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 650, fontSize: 12 }}
          >
            Executive KPIs, active initiatives, blockers and decision queue.
          </div>
        </>
      )}

      {/* ZONE 1 — SYSTEM HEALTH (RADAR) */}
      <CardSection title="System Health" subtitle="System overview radar">
        <div
          className="cc-shell cc-radar-shell"
          style={{
            borderRadius: 18,
            padding: 18,
            background:
              'radial-gradient(900px 300px at 20% 0%, rgba(56,189,248,0.16), rgba(2,6,23,0.0) 60%), radial-gradient(760px 260px at 85% 0%, rgba(167,139,250,0.14), rgba(2,6,23,0.0) 60%), rgba(2,6,23,0.55)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="cc-zone1-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 14,
            }}
          >
            {SYSTEM_HEALTH.map((area) => {
              const deptColor = departmentColors[area.label] || area.color || '#e5e7eb'
              const tr = trendMeta(area.trend)
              const intensity = clamp01(area.intensity)
              return (
                <div
                  key={area.id}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.66), rgba(2,6,23,0.62))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: -120,
                      background: `radial-gradient(300px 220px at 20% 15%, ${deptColor}26, rgba(2,6,23,0) 55%)`,
                      pointerEvents: 'none',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 950,
                          letterSpacing: 0.3,
                          color: 'rgba(226,232,240,0.95)',
                        }}
                      >
                        {area.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ fontSize: 22, fontWeight: 950, color: deptColor }}>
                          {Math.round(intensity * 100)}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: 'rgba(148,163,184,0.95)',
                            }}
                          >
                            %
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: tr.color, fontWeight: 900 }}>{tr.arrow}</span>
                          <span
                            style={{
                              color: 'rgba(148,163,184,0.9)',
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            Δ {area.delta > 0 ? '+' : ''}
                            {area.delta}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Ring pct={intensity} color={deptColor} />
                  </div>

                  <div
                    className="cc-kpi-grid"
                    style={{
                      marginTop: 12,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 10,
                    }}
                  >
                    {area.kpis.map((m) => (
                      <KpiCard
                        key={m.label}
                        label={m.label}
                        value={m.value}
                        tone={deptColor}
                        helper={
                          m.delta !== undefined
                            ? `Δ ${m.delta > 0 ? '+' : ''}${m.delta}`
                            : undefined
                        }
                        size="sm"
                        style={{ minWidth: 0 }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardSection>

      {/* ZONE 2 — STRATEGIC FOCUS + EXECUTION TIMELINE */}
      <CardSection
        title="Strategic Focus + Execution Timeline"
        subtitle="Decision + time awareness"
      >
        <div
          className="cc-zone2-grid"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: 14 }}
        >
          {/* LEFT (70%) — Mini Kanban */}
          <div
            className="cc-shell"
            style={{
              borderRadius: 16,
              padding: 14,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.55), rgba(2,6,23,0.55))',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div
              className="cc-mini-kanban-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}
            >
              {['Live', 'Next', 'In Progress'].map((col) => (
                <div key={col} style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 950,
                        fontSize: 12,
                        letterSpacing: 0.2,
                        color: 'rgba(226,232,240,0.95)',
                      }}
                    >
                      {col}
                    </div>
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 11,
                        color: 'rgba(148,163,184,0.92)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {kanban[col].length}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {kanban[col].map((init) => {
                      const deptColor = departmentColors[init.department] || '#e5e7eb'
                      const p = progressForStatus(init.status)
                      const micro = microAlertForInitiative(init)
                      const preferBoard = col === 'In Progress' || micro.tone === 'warn'
                      const microTone =
                        micro.tone === 'ok'
                          ? { c: '#22c55e', bg: 'rgba(34,197,94,0.10)', b: 'rgba(34,197,94,0.20)' }
                          : micro.tone === 'warn'
                            ? {
                                c: '#fbbf24',
                                bg: 'rgba(251,191,36,0.10)',
                                b: 'rgba(251,191,36,0.22)',
                              }
                            : {
                                c: 'rgba(148,163,184,0.95)',
                                bg: 'rgba(148,163,184,0.08)',
                                b: 'rgba(148,163,184,0.18)',
                              }

                      return (
                        <button
                          key={init.id}
                          type="button"
                          onClick={() => (preferBoard ? goBoard() : goKanban())}
                          className="no-card-hover cc-mini-card"
                          style={{
                            textAlign: 'left',
                            width: '100%',
                            borderRadius: 14,
                            padding: 12,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background:
                              'linear-gradient(180deg, rgba(2,6,23,0.78), rgba(2,6,23,0.58))',
                            boxShadow: '0 16px 34px rgba(0,0,0,0.35)',
                            color: 'rgba(226,232,240,0.95)',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: 'rgba(148,163,184,0.92)',
                                }}
                              >
                                {init.epic}
                              </div>
                              <div
                                style={{
                                  marginTop: 2,
                                  fontSize: 13,
                                  fontWeight: 950,
                                  color: '#fff',
                                }}
                              >
                                {init.title}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {col === 'In Progress' ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    goBoard()
                                  }}
                                  className="cc-mini-open-board"
                                  style={{
                                    fontWeight: 950,
                                    fontSize: 11,
                                    color: 'rgba(226,232,240,0.95)',
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    border: '1px solid rgba(56,189,248,0.26)',
                                    background: 'rgba(56,189,248,0.12)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Open board
                                </button>
                              ) : null}
                              <div
                                className="cc-mini-chip"
                                style={{
                                  fontWeight: 950,
                                  fontSize: 11,
                                  color: microTone.c,
                                  padding: '3px 8px',
                                  borderRadius: 999,
                                  border: `1px solid ${microTone.b}`,
                                  background: microTone.bg,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {micro.label}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 999,
                                  background: deptColor,
                                  opacity: 0.85,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: 'rgba(148,163,184,0.95)',
                                }}
                              >
                                Owner:
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: 'rgba(226,232,240,0.95)',
                                }}
                              >
                                {init.owner}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: 'rgba(148,163,184,0.92)',
                              }}
                            >
                              {Math.round(p * 100)}%
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              height: 8,
                              borderRadius: 999,
                              background: 'rgba(148,163,184,0.16)',
                              overflow: 'hidden',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.round(p * 100)}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${deptColor}, rgba(56,189,248,0.92))`,
                                boxShadow: '0 0 18px rgba(56,189,248,0.16)',
                              }}
                            />
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              color: 'rgba(148,163,184,0.92)',
                              fontWeight: 700,
                            }}
                          >
                            Referent:{' '}
                            <span style={{ color: deptColor, fontWeight: 900 }}>
                              {init.referent}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT (30%) — Execution Timeline */}
          <div
            className="cc-shell"
            style={{
              borderRadius: 16,
              padding: 14,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.62), rgba(2,6,23,0.58))',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  color: 'rgba(226,232,240,0.95)',
                }}
              >
                Execution Timeline
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(148,163,184,0.92)' }}>
                This week
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EXECUTION_TIMELINE.map((item) => {
                const tone =
                  item.type === 'approval'
                    ? { c: '#38bdf8', bg: 'rgba(56,189,248,0.10)', b: 'rgba(56,189,248,0.22)' }
                    : item.type === 'risk'
                      ? { c: '#fb7185', bg: 'rgba(251,113,133,0.10)', b: 'rgba(251,113,133,0.22)' }
                      : item.type === 'delivery'
                        ? { c: '#22c55e', bg: 'rgba(34,197,94,0.10)', b: 'rgba(34,197,94,0.20)' }
                        : {
                            c: 'rgba(148,163,184,0.95)',
                            bg: 'rgba(148,163,184,0.08)',
                            b: 'rgba(148,163,184,0.18)',
                          }

                return (
                  <div
                    key={item.day + item.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 14,
                      border: `1px solid ${tone.b}`,
                      background: tone.bg,
                      color: 'rgba(226,232,240,0.95)',
                      boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(2,6,23,0.55)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: tone.c,
                        fontWeight: 950,
                        letterSpacing: 0.2,
                      }}
                    >
                      {item.day}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, fontSize: 12, color: '#fff' }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          fontWeight: 750,
                          fontSize: 12,
                          color: 'rgba(148,163,184,0.92)',
                        }}
                      >
                        Focus: {item.type}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardSection>

      {/* ZONE 3 — CONTROL TOWER */}
      <CardSection title="Control Tower" subtitle="Critical signals + actions required">
        <div
          className="cc-shell"
          style={{
            borderRadius: 18,
            padding: 16,
            background:
              'radial-gradient(900px 320px at 10% 0%, rgba(251,113,133,0.16), rgba(2,6,23,0.0) 58%), radial-gradient(860px 320px at 90% 0%, rgba(56,189,248,0.14), rgba(2,6,23,0.0) 60%), rgba(2,6,23,0.55)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="cc-zone3-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}
          >
            {/* Critical Signals */}
            <div
              style={{
                borderRadius: 16,
                padding: 14,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.55), rgba(2,6,23,0.55))',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              }}
            >
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  color: 'rgba(226,232,240,0.95)',
                }}
              >
                Critical Signals
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ALERTS.map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 14,
                      padding: '10px 12px',
                      border: '1px solid rgba(251,113,133,0.18)',
                      background: 'rgba(251,113,133,0.08)',
                      boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ fontWeight: 950, color: '#fff', fontSize: 12 }}>Signal</div>
                      <div
                        style={{
                          fontWeight: 950,
                          fontSize: 11,
                          color: '#fb7185',
                          background: 'rgba(251,113,133,0.12)',
                          border: '1px solid rgba(251,113,133,0.22)',
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        CRITICAL
                      </div>
                    </div>
                    <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.95)', fontWeight: 850 }}>
                      {a}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        color: 'rgba(148,163,184,0.92)',
                        fontWeight: 750,
                        fontSize: 12,
                      }}
                    >
                      Impact: {impactHint(a)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Required */}
            <div
              style={{
                borderRadius: 16,
                padding: 14,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.55), rgba(2,6,23,0.55))',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              }}
            >
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  color: 'rgba(226,232,240,0.95)',
                }}
              >
                Actions Required
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DECISION_ZONE.map((d, idx) => {
                  const urg = urgencyHint(d)
                  const linked = d.toLowerCase().includes('retention')
                    ? INITIATIVES.find((i) => String(i.epic).toLowerCase().includes('retention'))
                    : d.toLowerCase().includes('affiliate')
                      ? INITIATIVES.find((i) =>
                          String(i.epic).toLowerCase().includes('acquisition')
                        )
                      : INITIATIVES[0]

                  return (
                    <div
                      key={idx}
                      style={{
                        borderRadius: 14,
                        padding: '10px 12px',
                        border: '1px solid rgba(56,189,248,0.16)',
                        background: 'rgba(56,189,248,0.07)',
                        boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ fontWeight: 950, color: '#fff', fontSize: 12 }}>Decision</div>
                        <div
                          style={{
                            fontWeight: 950,
                            fontSize: 11,
                            color: urg.color,
                            background: urg.bg,
                            border: `1px solid ${urg.color}33`,
                            padding: '2px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {urg.label}
                        </div>
                      </div>
                      <div
                        style={{ marginTop: 6, color: 'rgba(226,232,240,0.95)', fontWeight: 850 }}
                      >
                        {d}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          color: 'rgba(148,163,184,0.92)',
                          fontWeight: 750,
                          fontSize: 12,
                        }}
                      >
                        Linked story:{' '}
                        <span style={{ color: '#e2e8f0', fontWeight: 900 }}>
                          {linked?.title || '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardSection>

      <style>{`
        .cc-root { padding: 24px; }
        .cc-kpi-grid { align-items: stretch; }
        @media (max-width: 1024px) {
          .cc-zone2-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .cc-zone1-grid { grid-template-columns: 1fr !important; }
          .cc-zone3-grid { grid-template-columns: 1fr !important; }
          .cc-mini-kanban-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .cc-root { padding: 14px; }
          .cc-shell { padding: 12px !important; }
          .cc-radar-shell { padding: 14px !important; }
          .cc-eyebrow { font-size: 11px !important; }
          .cc-title { margin-top: 4px !important; font-size: 18px !important; line-height: 1.1 !important; }
          .cc-subtitle { margin-top: 4px !important; font-size: 11px !important; line-height: 1.25 !important; }
          .cc-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }

          /* Mini-kanban cards: tighter tap targets without clutter */
          .cc-mini-card { padding: 10px !important; border-radius: 12px !important; }
          .cc-mini-open-board { padding: 2px 6px !important; font-size: 10px !important; }
          .cc-mini-chip { padding: 2px 6px !important; font-size: 10px !important; }
        }
      `}</style>
    </div>
  )
}
