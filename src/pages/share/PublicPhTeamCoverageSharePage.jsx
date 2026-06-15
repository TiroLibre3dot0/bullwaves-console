import { useEffect, useMemo, useState } from 'react'

const PH_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const PH_DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PH_DAY_LABEL = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}
const PH_GRID_START = 4
const PH_GRID_END = 22
const PH_HOUR_PX = 24
const PH_GRID_HEIGHT = (PH_GRID_END - PH_GRID_START) * PH_HOUR_PX

const PH_AGENTS = [
  {
    id: 1,
    name: 'Agent 1',
    color: '#3b82f6',
    light: '#eff6ff',
    role: 'Night Coverage',
    weeklyHours: 45,
    schedule: {
      mon: { s: 19, e: 28 },
      tue: { s: 19, e: 28 },
      wed: { s: 19, e: 28 },
      thu: { s: 19, e: 28 },
      fri: null,
      sat: null,
      sun: { s: 19, e: 28 },
    },
  },
  {
    id: 2,
    name: 'Agent 2',
    color: '#059669',
    light: '#ecfdf5',
    role: 'Early Morning Coverage',
    weeklyHours: 45,
    schedule: {
      mon: { s: 4, e: 13 },
      tue: { s: 4, e: 13 },
      wed: { s: 4, e: 13 },
      thu: { s: 4, e: 13 },
      fri: { s: 4, e: 13 },
      sat: null,
      sun: null,
    },
  },
  {
    id: 3,
    name: 'Agent 3',
    color: '#d97706',
    light: '#fffbeb',
    role: 'Main Business Hours',
    weeklyHours: 45,
    schedule: {
      mon: { s: 10, e: 19 },
      tue: { s: 10, e: 19 },
      wed: { s: 10, e: 19 },
      thu: { s: 10, e: 19 },
      fri: { s: 10, e: 19 },
      sat: null,
      sun: { s: 10, e: 19 },
    },
  },
  {
    id: 4,
    name: 'Agent 4',
    color: '#7c3aed',
    light: '#f5f3ff',
    role: 'Night Coverage (Tue-Sat)',
    weeklyHours: 45,
    schedule: {
      mon: null,
      tue: { s: 19, e: 28 },
      wed: { s: 19, e: 28 },
      thu: { s: 19, e: 28 },
      fri: { s: 19, e: 28 },
      sat: { s: 19, e: 28 },
      sun: null,
    },
  },
  {
    id: 5,
    name: 'Agent 5',
    color: '#dc2626',
    light: '#fef2f2',
    role: 'Day Coverage (Mon-Sat)',
    weeklyHours: 45,
    schedule: {
      mon: { s: 10, e: 19 },
      tue: { s: 10, e: 19 },
      wed: { s: 10, e: 19 },
      thu: { s: 10, e: 19 },
      fri: { s: 10, e: 19 },
      sat: { s: 10, e: 19 },
      sun: null,
    },
  },
]

function phShiftPos(shift, hourPx = PH_HOUR_PX) {
  if (!shift) return null
  const s = Math.max(shift.s, PH_GRID_START)
  const e = Math.min(shift.e, PH_GRID_END)
  if (e <= s) return null
  return {
    topPx: (s - PH_GRID_START) * hourPx,
    heightPx: (e - s) * hourPx,
    clipped: shift.e > PH_GRID_END,
    startLabel: `${String(shift.s % 24).padStart(2, '0')}:00`,
    endLabel: `${String(shift.e % 24).padStart(2, '0')}:00`,
  }
}

function phCoverageAt(day, hour) {
  return PH_AGENTS.filter((agent) => {
    const sh = agent.schedule[day]
    return sh != null && hour >= sh.s && hour < sh.e
  }).length
}

function phHeatColor(count) {
  if (count <= 0) return '#fecaca'
  if (count === 1) return '#fde68a'
  if (count === 2) return '#86efac'
  return '#22c55e'
}

export default function PublicPhTeamCoverageSharePage() {
  const [view, setView] = useState('calendar')
  const [hoveredShift, setHoveredShift] = useState(null)
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') return { w: 1440, h: 900 }
    return { w: window.innerWidth, h: window.innerHeight }
  })
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1080
  })
  const [isWideDesktop, setIsWideDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1480
  })
  const [isUltraWide, setIsUltraWide] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 1900
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight })
      setIsDesktop(window.innerWidth >= 1080)
      setIsWideDesktop(window.innerWidth >= 1480)
      setIsUltraWide(window.innerWidth >= 1900)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const hourPx = useMemo(() => {
    const slots = PH_GRID_END - PH_GRID_START
    const reservedHeight = isDesktop ? 250 : 330
    const fitPx = Math.floor((viewport.h - reservedHeight) / slots)
    if (isDesktop) {
      const maxPx = isUltraWide ? 28 : isWideDesktop ? 26 : 24
      return Math.max(18, Math.min(maxPx, fitPx))
    }
    return Math.max(14, Math.min(20, fitPx))
  }, [viewport, isDesktop, isWideDesktop, isUltraWide])

  const gridHeight = useMemo(() => (PH_GRID_END - PH_GRID_START) * hourPx, [hourPx])

  useEffect(() => {
    if (view !== 'calendar') setHoveredShift(null)
  }, [view])

  const kpis = useMemo(() => {
    const totalHours = PH_AGENTS.reduce((acc, agent) => acc + Number(agent.weeklyHours || 0), 0)
    const weekendAgents = PH_AGENTS.filter((agent) => {
      return phShiftPos(agent.schedule.sat) || phShiftPos(agent.schedule.sun)
    }).length

    let coveredSlots = 0
    const totalSlots = PH_DAYS.length * (PH_GRID_END - PH_GRID_START)
    PH_DAYS.forEach((day) => {
      for (let h = PH_GRID_START; h < PH_GRID_END; h += 1) {
        if (phCoverageAt(day, h) > 0) coveredSlots += 1
      }
    })

    return [
      { label: 'Agents', value: String(PH_AGENTS.length) },
      { label: 'Total Weekly Hours', value: `${totalHours}h` },
      { label: 'Weekend Agents', value: String(weekendAgents) },
      { label: 'Coverage Slots', value: `${coveredSlots}/${totalSlots}` },
    ]
  }, [])

  const selectedShift = useMemo(() => {
    if (!hoveredShift?.agent || !hoveredShift?.day) return null
    const pos = phShiftPos(hoveredShift.agent.schedule[hoveredShift.day], hourPx)
    if (!pos) return null

    const startHour = Number(String(pos.startLabel).split(':')[0] || 0)
    return {
      agentName: hoveredShift.agent.name,
      role: hoveredShift.agent.role,
      weeklyHours: hoveredShift.agent.weeklyHours,
      dayLabel: PH_DAY_LABEL[hoveredShift.day] || hoveredShift.day,
      startLabel: pos.startLabel,
      endLabel: pos.endLabel,
      clipped: pos.clipped,
      coverageAtStart: phCoverageAt(hoveredShift.day, startHour),
      color: hoveredShift.agent.color,
      light: hoveredShift.agent.light,
    }
  }, [hoveredShift, hourPx])

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#ffffff',
        padding: isDesktop ? 14 : 10,
        fontFamily: 'Manrope, Segoe UI, system-ui, sans-serif',
        color: '#1f2937',
      }}
    >
      <div style={{ width: '100%', margin: '0 auto', display: 'grid', gap: 14 }}>
        <header
          style={{
            border: '1px solid #334155',
            borderRadius: 16,
            background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 100%)',
            padding: isDesktop ? '16px 18px' : '14px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            boxShadow: '0 10px 26px rgba(2,6,23,0.42)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/Logo.png"
              alt="Bullwaves"
              style={{
                height: isDesktop ? 30 : 24,
                width: 'auto',
                display: 'block',
                opacity: 0.95,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                flexShrink: 0,
              }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                PH Team Coverage
              </h1>
              <div style={{ marginTop: 5, fontSize: 12, color: '#a5b4c7', fontWeight: 600 }}>
                Public read-only view of schedule coverage
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              gap: 6,
              border: '1px solid #334155',
              borderRadius: 12,
              padding: 4,
              background: '#0b1220',
            }}
          >
            <button
              type="button"
              onClick={() => setView('calendar')}
              style={{
                border: '1px solid transparent',
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                background: view === 'calendar' ? '#1e3a8a' : 'transparent',
                color: view === 'calendar' ? '#dbeafe' : '#9fb0c7',
              }}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setView('heatmap')}
              style={{
                border: '1px solid transparent',
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                background: view === 'heatmap' ? '#14532d' : 'transparent',
                color: view === 'heatmap' ? '#dcfce7' : '#9fb0c7',
              }}
            >
              Heatmap
            </button>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: isDesktop
              ? isWideDesktop
                ? 'minmax(0, 1fr) 340px'
                : 'minmax(0, 1fr) 300px'
              : '1fr',
            alignItems: 'start',
          }}
        >
          <section
            style={{
              border: '1px solid #6b7a90',
              borderRadius: 24,
              background:
                'linear-gradient(180deg, rgba(247,250,255,0.98) 0%, rgba(232,239,248,0.96) 100%)',
              padding: isDesktop ? 18 : 12,
              boxShadow: '0 24px 50px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            {view === 'calendar' ? (
              <div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <div style={{ width: isDesktop ? 46 : 40, flexShrink: 0, paddingTop: 28 }}>
                      {Array.from({ length: PH_GRID_END - PH_GRID_START }, (_, i) => {
                        const h = PH_GRID_START + i
                        return (
                          <div
                            key={i}
                            style={{
                              height: hourPx,
                              display: 'flex',
                              alignItems: 'flex-start',
                              paddingTop: 2,
                              justifyContent: 'flex-end',
                              paddingRight: 6,
                              fontSize: 9,
                              color: '#8ea0b5',
                              fontWeight: 700,
                              boxSizing: 'border-box',
                            }}
                          >
                            {i % 2 === 0 ? `${String(h).padStart(2, '0')}:00` : ''}
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                      {PH_DAYS.map((day, di) => {
                        const dayAgents = PH_AGENTS.filter(
                          (a) => phShiftPos(a.schedule[day], hourPx) != null
                        )
                        const isWeekend = di >= 5
                        return (
                          <div key={day} style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                height: 36,
                                textAlign: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                                color: isWeekend ? '#5b21b6' : '#1f2f46',
                                background: isWeekend
                                  ? 'linear-gradient(180deg, #f3effd 0%, #e6ddfb 100%)'
                                  : 'linear-gradient(180deg, #edf3fb 0%, #dfe8f4 100%)',
                                borderTop: `1px solid ${isWeekend ? '#c4b5fd' : '#d8e3f0'}`,
                                borderLeft: '1px solid #7a889c',
                                borderBottom: '1px solid rgba(255,255,255,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {PH_DAY_SHORT[di]}
                            </div>
                            <div
                              style={{
                                position: 'relative',
                                height: gridHeight,
                                borderLeft: '1px solid #7a889c',
                                background: isWeekend
                                  ? 'linear-gradient(180deg, #faf8ff 0%, #f1ecff 100%)'
                                  : 'linear-gradient(180deg, #fbfdff 0%, #f3f7fc 100%)',
                              }}
                            >
                              {Array.from({ length: PH_GRID_END - PH_GRID_START }, (_, i) => (
                                <div
                                  key={i}
                                  style={{
                                    position: 'absolute',
                                    top: i * hourPx,
                                    left: 0,
                                    right: 0,
                                    borderTop:
                                      i % 2 === 0
                                        ? '1px solid rgba(201, 213, 228, 0.72)'
                                        : '1px solid rgba(229, 237, 246, 0.78)',
                                  }}
                                />
                              ))}
                              {dayAgents.map((agent, ai) => {
                                const pos = phShiftPos(agent.schedule[day], hourPx)
                                if (!pos) return null
                                const isHov =
                                  hoveredShift &&
                                  hoveredShift.agentId === agent.id &&
                                  hoveredShift.day === day
                                const colW = 100 / dayAgents.length
                                return (
                                  <div
                                    key={agent.id}
                                    onMouseEnter={() =>
                                      setHoveredShift({ agentId: agent.id, day, agent })
                                    }
                                    onMouseLeave={() => setHoveredShift(null)}
                                    style={{
                                      position: 'absolute',
                                      top: pos.topPx + 1,
                                      height: Math.max(pos.heightPx - 2, 20),
                                      left: `calc(${ai * colW}% + 1px)`,
                                      width: `calc(${colW}% - 2px)`,
                                      background: agent.light,
                                      border: `1px solid ${agent.color}`,
                                      borderRadius: 12,
                                      padding: '4px 6px',
                                      fontSize: 9,
                                      color: agent.color,
                                      fontWeight: 800,
                                      overflow: 'hidden',
                                      cursor: 'default',
                                      zIndex: isHov ? 20 : 2,
                                      opacity: hoveredShift && !isHov ? 0.35 : 1,
                                      boxShadow: isHov
                                        ? `0 14px 28px ${agent.color}33`
                                        : '0 4px 10px rgba(15,23,42,0.06)',
                                      transition:
                                        'opacity 110ms ease, box-shadow 110ms ease, transform 110ms ease',
                                      transform: isHov ? 'translateY(-1px)' : 'translateY(0)',
                                      boxSizing: 'border-box',
                                    }}
                                  >
                                    <div
                                      style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {agent.name}
                                    </div>
                                    {pos.heightPx >= 48 ? (
                                      <div style={{ fontSize: 8, opacity: 0.85, marginTop: 1 }}>
                                        {pos.startLabel}-{pos.endLabel}
                                        {pos.clipped ? '+' : ''}
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                {hoveredShift ? null : null}
              </div>
            ) : null}

            {view === 'heatmap' ? (
              <div>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <div style={{ width: isDesktop ? 46 : 40, flexShrink: 0, paddingTop: 28 }}>
                      {Array.from({ length: PH_GRID_END - PH_GRID_START }, (_, i) => {
                        const h = PH_GRID_START + i
                        return (
                          <div
                            key={i}
                            style={{
                              height: hourPx,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              paddingRight: 6,
                              fontSize: 9,
                              color: '#8ea0b5',
                              fontWeight: 700,
                              boxSizing: 'border-box',
                            }}
                          >
                            {i % 2 === 0 ? `${String(h).padStart(2, '0')}:00` : ''}
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                      {PH_DAYS.map((day, di) => {
                        const isWeekend = di >= 5
                        return (
                          <div key={day} style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                height: 34,
                                textAlign: 'center',
                                fontSize: 11,
                                fontWeight: 800,
                                color: isWeekend ? '#5b21b6' : '#1f2f46',
                                background: isWeekend
                                  ? 'linear-gradient(180deg, #f3effd 0%, #e6ddfb 100%)'
                                  : 'linear-gradient(180deg, #edf3fb 0%, #dfe8f4 100%)',
                                borderTop: `1px solid ${isWeekend ? '#c4b5fd' : '#d8e3f0'}`,
                                borderLeft: '1px solid #7a889c',
                                borderBottom: '1px solid rgba(255,255,255,0.55)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {PH_DAY_SHORT[di]}
                            </div>
                            {Array.from({ length: PH_GRID_END - PH_GRID_START }, (_, i) => {
                              const hour = PH_GRID_START + i
                              const count = phCoverageAt(day, hour)
                              return (
                                <div
                                  key={i}
                                  title={`${String(hour).padStart(2, '0')}:00 - ${count} agent${count !== 1 ? 's' : ''} on duty`}
                                  style={{
                                    height: hourPx,
                                    background: phHeatColor(count),
                                    borderBottom: '1px solid rgba(255,255,255,0.55)',
                                    borderLeft: '1px solid rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color:
                                      count === 0 ? '#991b1b' : count === 1 ? '#78350f' : '#14532d',
                                  }}
                                >
                                  {count > 0 ? count : '-'}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 10,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: '#5b6d84',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Coverage level
                  </span>
                  {[
                    { label: 'No coverage', color: '#fca5a5' },
                    { label: '1 agent', color: '#fde68a' },
                    { label: '2 agents', color: '#86efac' },
                    { label: '3+ agents', color: '#22c55e' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          background: item.color,
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#475569' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside
            style={{
              display: 'grid',
              gap: 12,
              alignSelf: 'stretch',
              position: isDesktop ? 'sticky' : 'relative',
              top: isDesktop ? 12 : 'auto',
            }}
          >
            <div
              style={{
                border: '1px solid #6b7a90',
                borderRadius: 22,
                background:
                  'linear-gradient(180deg, rgba(244,248,255,0.98) 0%, rgba(226,235,246,0.96) 100%)',
                padding: isDesktop ? '16px 16px 18px' : '13px 13px 15px',
                boxShadow: '0 18px 34px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.75)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: '#5c6f87',
                  letterSpacing: '0.14em',
                  marginBottom: 10,
                }}
              >
                SCHEDULE SUMMARY
              </div>
              <div style={{ display: 'grid', gap: 7 }}>
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    style={{
                      border: '1px solid #7a889c',
                      borderRadius: 16,
                      background: 'linear-gradient(180deg, #ffffff 0%, #f3f7fd 100%)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#52657f', fontWeight: 700 }}>
                      {kpi.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: '#0f172a',
                        textAlign: 'right',
                      }}
                    >
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: selectedShift ? `1px solid ${selectedShift.color}88` : '1px solid #6b7a90',
                borderRadius: 22,
                background: selectedShift
                  ? `linear-gradient(180deg, ${selectedShift.light} 0%, #ffffff 100%)`
                  : 'linear-gradient(180deg, #f7faff 0%, #eef4fc 100%)',
                padding: '14px 16px',
                minHeight: isDesktop ? 188 : 168,
                transition: 'all 140ms ease',
                boxShadow: selectedShift
                  ? `0 16px 30px ${selectedShift.color}18`
                  : '0 18px 34px rgba(15,23,42,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: selectedShift ? selectedShift.color : '#4e627c',
                  letterSpacing: '0.14em',
                  marginBottom: 10,
                }}
              >
                SELECTED SHIFT
              </div>

              {selectedShift ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 6,
                    minHeight: isDesktop ? 134 : 118,
                    alignContent: 'start',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                    {selectedShift.agentName}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    {selectedShift.role}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    {selectedShift.dayLabel} · {selectedShift.startLabel}-{selectedShift.endLabel}
                    {selectedShift.clipped ? ' (overnight)' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    Weekly hours: <strong>{selectedShift.weeklyHours}h</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    Coverage at shift start:{' '}
                    <strong>{selectedShift.coverageAtStart} agent(s)</strong>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: '#546883',
                    lineHeight: 1.45,
                    minHeight: isDesktop ? 134 : 118,
                  }}
                >
                  Hover a shift in the calendar to see contextual details here.
                </div>
              )}
            </div>

            <div
              style={{
                border: '1px solid #5fa77a',
                borderRadius: 22,
                background: 'linear-gradient(180deg, #f4fff7 0%, #eafbf0 100%)',
                padding: '14px 16px',
                boxShadow: '0 16px 30px rgba(21,128,61,0.06)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: '#15803d',
                  letterSpacing: '0.14em',
                  marginBottom: 10,
                }}
              >
                COVERED PERIODS
              </div>
              {[
                'Night Coverage (19:00-04:00)',
                'Early Morning Coverage (04:00-10:00)',
                'Main European Trading Hours (10:00-19:00)',
                'Weekend Coverage (Sat & Sun)',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 12,
                    color: '#166534',
                    marginBottom: 6,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: '#dcfce7',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    OK
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <footer
          style={{
            border: '1px solid #334155',
            borderRadius: 24,
            background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 100%)',
            padding: isDesktop ? '18px 22px' : '16px 16px',
            boxShadow: '0 10px 26px rgba(2,6,23,0.42)',
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isDesktop ? '1.1fr 1fr 1fr' : '1fr',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/Logo.png"
                alt="Bullwaves"
                style={{
                  height: 24,
                  width: 'auto',
                  display: 'block',
                  opacity: 0.95,
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                  flexShrink: 0,
                }}
              />
              <div
                style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}
              >
                PH Team Coverage
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#a5b4c7', lineHeight: 1.6, maxWidth: 320 }}>
              Public read-only schedule snapshot for the Philippines support team, aligned with
              internal planning.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div
              style={{ fontSize: 10, fontWeight: 900, color: '#c8d4e4', letterSpacing: '0.16em' }}
            >
              TEAM SCOPE
            </div>
            <div style={{ fontSize: 12, color: '#d8e1ec', lineHeight: 1.65 }}>
              Coverage window: 04:00-22:00
            </div>
            <div style={{ fontSize: 12, color: '#d8e1ec', lineHeight: 1.65 }}>
              Weekend coverage included
            </div>
            <div style={{ fontSize: 12, color: '#d8e1ec', lineHeight: 1.65 }}>
              Night and business-hours handover visibility
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div
              style={{ fontSize: 10, fontWeight: 900, color: '#c8d4e4', letterSpacing: '0.16em' }}
            >
              OWNERSHIP
            </div>
            <div style={{ fontSize: 12, color: '#d8e1ec', lineHeight: 1.65 }}>
              Bullwaves PH Operations Team
            </div>
            <div style={{ fontSize: 12, color: '#d8e1ec', lineHeight: 1.65 }}>
              Schedule aligned with internal coverage planning
            </div>
            <div style={{ fontSize: 12, color: '#93a4ba', lineHeight: 1.65 }}>
              Read-only public view
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
