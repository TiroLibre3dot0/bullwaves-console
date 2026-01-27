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
]

export default function CommandCenter({ onDrillDown, embedded = false }) {
  return (
    <div style={{ padding: 24 }}>
      {embedded ? null : (
        <>
          <div
            style={{
              color: 'rgba(148,163,184,0.95)',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.2,
            }}
          >
            Strategic Execution
          </div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#fff' }}>
            Command Center
          </div>
          <div
            style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 650, fontSize: 12 }}
          >
            Executive KPIs, active initiatives, blockers and decision queue.
          </div>
        </>
      )}

      {/* SECTION 1 — SYSTEM HEALTH */}
      <CardSection title="System Health" subtitle="Live KPIs by strategic area">
        <div style={{ display: 'flex', gap: 24 }}>
          {SYSTEM_HEALTH.map((block) => {
            const deptColor = departmentColors[block.label] || block.color || '#e5e7eb'
            return (
              <div
                key={block.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: deptColor, fontSize: 15 }}>
                    {block.label}
                  </span>
                  <span style={{ fontSize: 15, color: deptColor, opacity: 0.7 }}>{'●'}</span>
                  <span
                    style={{
                      fontSize: 15,
                      color:
                        block.trend === 'up'
                          ? '#22c55e'
                          : block.trend === 'down'
                            ? '#ef4444'
                            : '#b3b3b3',
                      fontWeight: 600,
                      opacity: 0.7,
                    }}
                  >
                    {block.trend === 'up' && '↑'}
                    {block.trend === 'down' && '↓'}
                    {block.trend === 'flat' && '→'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {block.kpis.map((m) => (
                    <KpiCard
                      key={m.label}
                      label={m.label}
                      value={m.value}
                      tone={deptColor}
                      helper={m.delta !== undefined ? `Δ ${m.delta}` : undefined}
                      size="sm"
                      style={{ minWidth: 80 }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(148,163,184,0.75)',
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  Referent:{' '}
                  <span style={{ color: deptColor, fontWeight: 600, opacity: 0.8 }}>
                    {block.label === 'RETENTION'
                      ? 'Francesco Ceccarini'
                      : block.label === 'ACQUISITION'
                        ? 'Stefan Popovski'
                        : block.label === 'REACTIVATION'
                          ? 'Daniel'
                          : '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardSection>

      {/* SECTION 2 — STRATEGIC FOCUS */}
      <CardSection title="Strategic Focus (Now)" subtitle="Current live initiatives">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {INITIATIVES.map((init) => {
            const deptColor = departmentColors[init.department] || '#e5e7eb'
            return (
              <div
                key={init.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  borderRadius: 999,
                  background: 'rgba(2,6,23,0.92)',
                  border: '1px solid rgba(226,232,240,0.18)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.30)',
                  padding: '8px 18px',
                  fontSize: 14,
                }}
                onClick={() => onDrillDown && onDrillDown(init.id)}
              >
                <span style={{ fontSize: 16, color: deptColor, opacity: 0.7 }}>●</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{init.epic}</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{init.title}</span>
                <span style={{ fontWeight: 500, color: '#b3b3b3' }}>{init.status}</span>
                <span style={{ fontWeight: 400, color: '#94a3b8' }}>Referent:</span>
                <span style={{ fontWeight: 600, color: deptColor, opacity: 0.8 }}>
                  {init.referent}
                </span>
              </div>
            )
          })}
        </div>
      </CardSection>

      {/* SECTION 3 — ALERTS & BLOCKERS */}
      <CardSection title="Alerts & Blockers" subtitle="Critical issues requiring attention">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALERTS.map((alert, i) => (
            <div
              key={i}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderRadius: 12,
                padding: '10px 12px',
                fontWeight: 650,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(226,232,240,0.92)',
                boxShadow: 'none',
                transform: 'none',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#fecaca',
                  background: 'rgba(239,68,68,0.14)',
                  border: '1px solid rgba(239,68,68,0.28)',
                }}
              >
                !
              </span>
              <span style={{ flex: 1 }}>{alert}</span>
            </div>
          ))}
        </div>
      </CardSection>

      {/* SECTION 4 — DECISION ZONE */}
      <CardSection title="Decision Zone" subtitle="Pending executive actions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DECISION_ZONE.map((decision, i) => (
            <div
              key={i}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderRadius: 12,
                padding: '10px 12px',
                fontWeight: 650,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(226,232,240,0.92)',
                boxShadow: 'none',
                transform: 'none',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#bae6fd',
                  background: 'rgba(56,189,248,0.12)',
                  border: '1px solid rgba(56,189,248,0.22)',
                }}
              >
                →
              </span>
              <span style={{ flex: 1 }}>{decision}</span>
            </div>
          ))}
        </div>
      </CardSection>
    </div>
  )
}
