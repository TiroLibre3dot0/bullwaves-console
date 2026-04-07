import React from 'react'
import { Handle, Position } from '../reactflowCompat'

function EnvelopeIcon({ color = '#ffffff' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6.5" width="16" height="11" rx="1.8" stroke={color} strokeWidth="1.8" />
      <path
        d="m5.5 8 6.5 4.8L18.5 8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SegmentIcon({ color = '#ffffff' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="10" r="2.2" stroke={color} strokeWidth="1.8" />
      <circle cx="15.3" cy="8.8" r="1.8" stroke={color} strokeWidth="1.8" />
      <path
        d="M5.6 17.5c.8-1.95 2.3-2.95 4-2.95 1.7 0 3.2 1 4 2.95"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.7 16.7c.45-1.1 1.2-1.7 2.15-1.7.8 0 1.5.38 1.95 1.1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StepIcon({ color = '#ffffff' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke={color} strokeWidth="1.8" />
      <path d="M9 12h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon({ color = '#94a3b8' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
      <path
        d="M12 7.8v4.7l3 1.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChatIcon({ color = '#ffffff' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 7.5h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6.7l-3.8 2.9V16.5H6.5A1.5 1.5 0 0 1 5 15V9a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getUtilityIcon(label) {
  const text = String(label || '').toLowerCase()
  if (text.includes('wait') || text.includes('day')) return <ClockIcon />
  if (text.includes('message')) return <ChatIcon color="#94a3b8" />
  return <StepIcon color="#94a3b8" />
}

export default function StateNode({ data }) {
  const isPrimary = data?.kind === 'primary'
  const branching = Boolean(data?.branching)
  const isLink = Boolean(data?.linkToFlow)
  const isTemplate = Boolean(data?.templateId)
  const isClickable = isLink || isTemplate
  const isHorizontal = data?.flowDirection === 'horizontal'
  const isSolitics = data?.theme === 'solitics'
  const isEntryNode = data?.flowRole === 'entry'
  const linkVariant = isClickable && data?.kind === 'influence' ? 'influence' : 'step'
  const timingBadge = String(data?.timingBadge || '').trim()

  const allKpis = Array.isArray(data?.kpis)
    ? data.kpis
        .filter((k) => k && (k.label || k.value))
        .slice(0, 3)
        .map((k) => ({
          label: k?.label,
          value: k?.value,
          metricKey: k?.metricKey,
        }))
    : []

  const hasSegmentEntryBadge = allKpis.some((kpi) => kpi?.metricKey === 'segmentEntry')
  const kpis = allKpis.filter((kpi) => kpi?.metricKey !== 'segmentEntry')

  const linkPalette =
    linkVariant === 'influence'
      ? {
          border: 'rgba(168, 85, 247, 0.70)',
          outline: 'rgba(168, 85, 247, 0.18)',
          ring: 'rgba(168, 85, 247, 0.10)',
          glow: 'rgba(168, 85, 247, 0.18)',
          icon: 'rgba(192, 132, 252, 0.95)',
        }
      : {
          border: 'rgba(56, 189, 248, 0.72)',
          outline: 'rgba(34, 211, 238, 0.18)',
          ring: 'rgba(56, 189, 248, 0.10)',
          glow: 'rgba(34, 211, 238, 0.18)',
          icon: 'rgba(56, 189, 248, 0.95)',
        }

  const linkAccent = isClickable
    ? {
        cursor: 'pointer',
        border: `1px solid ${linkPalette.border}`,
        outline: `2px solid ${linkPalette.outline}`,
        outlineOffset: 2,
        boxShadow: `0 12px 34px rgba(0,0,0,0.28), 0 0 0 4px ${linkPalette.ring}, 0 0 24px ${linkPalette.glow}`,
      }
    : null

  const baseSurface = isSolitics
    ? isEntryNode
      ? 'linear-gradient(180deg, #0f172a, #1e293b)'
      : isPrimary
        ? 'linear-gradient(180deg, #ffffff, #f8fafc)'
        : 'linear-gradient(180deg, #f8fafc, #eef2f7)'
    : isPrimary
      ? 'rgba(15, 23, 42, 0.94)'
      : 'rgba(15, 23, 42, 0.88)'

  const baseBorder = isSolitics
    ? isEntryNode
      ? '1px solid #0f172a'
      : isPrimary
        ? '1px solid #94a3b8'
        : '1px solid #cbd5e1'
    : isPrimary
      ? '1px solid rgba(226,232,240,0.28)'
      : '1px solid rgba(148, 163, 184, 0.28)'

  const baseColor = isSolitics ? (isEntryNode ? '#ffffff' : '#0f172a') : '#f8fafc'
  const subLabelColor = isSolitics
    ? isEntryNode
      ? '#cbd5e1'
      : '#475569'
    : 'rgba(226,232,240,0.78)'
  const nodeShadow = isSolitics
    ? isEntryNode
      ? '0 14px 28px rgba(15,23,42,0.18)'
      : '0 12px 24px rgba(15,23,42,0.12)'
    : '0 14px 32px rgba(15,23,42,0.22)'

  if (isSolitics) {
    const isUtilityNode = !isEntryNode && !data?.templateId
    const stateLabel = String(data?.label || '')
    const waitPattern = /wait|attendi|delay|day|giorn|hour|ora/i
    const isWaitNode =
      isUtilityNode || waitPattern.test(stateLabel) || waitPattern.test(timingBadge)
    const eyebrow = isEntryNode ? 'Entry' : isWaitNode ? 'Wait' : 'Action'
    const icon = isEntryNode ? (
      <SegmentIcon />
    ) : isWaitNode ? (
      <ClockIcon color="#ffffff" />
    ) : (
      <EnvelopeIcon />
    )
    const iconBackground = isEntryNode ? '#14b8a6' : isWaitNode ? '#94a3b8' : '#0f766e'
    const cardBackground = isEntryNode
      ? 'linear-gradient(180deg, #0f172a, #1e293b)'
      : isWaitNode
        ? 'linear-gradient(180deg, #f8fafc, #eef2f7)'
        : 'linear-gradient(180deg, #ffffff, #f8fafc)'
    const cardBorder = isEntryNode
      ? '1px solid #0f172a'
      : isWaitNode
        ? '1px dashed #cbd5e1'
        : '1px solid #cbd5e1'
    const titleColor = isEntryNode ? '#ffffff' : '#0f172a'
    const metaColor = isEntryNode ? '#cbd5e1' : '#64748b'
    const eyebrowColor = isEntryNode ? '#99f6e4' : isWaitNode ? '#94a3b8' : '#0f766e'
    const shadow = isEntryNode
      ? '0 12px 28px rgba(15,23,42,0.18)'
      : '0 10px 22px rgba(15,23,42,0.10)'

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: cardBackground,
            border: cardBorder,
            boxShadow: shadow,
          }}
        />

        {timingBadge ? (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '4px 8px',
              borderRadius: 999,
              background: isEntryNode ? 'rgba(255,255,255,0.10)' : 'rgba(241,245,249,0.96)',
              border: isEntryNode ? '1px solid rgba(255,255,255,0.14)' : '1px solid #dbe4ee',
              color: isEntryNode ? '#e2e8f0' : '#64748b',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {timingBadge}
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            inset: 12,
            display: 'grid',
            gridTemplateColumns: '38px minmax(0, 1fr)',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: iconBackground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            {isUtilityNode && !isWaitNode ? getUtilityIcon(data?.label) : icon}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: eyebrowColor,
                lineHeight: 1,
              }}
            >
              {hasSegmentEntryBadge ? 'Segment Entry' : eyebrow}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 800,
                color: titleColor,
                lineHeight: 1.22,
                maxWidth: '100%',
              }}
            >
              {data?.label}
            </div>
            {data?.subLabel ? (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  color: metaColor,
                  lineHeight: 1.2,
                  maxWidth: '100%',
                  opacity: data?.showDetails ? 1 : 0.82,
                }}
              >
                {data?.showDetails ? data.subLabel : null}
              </div>
            ) : null}
          </div>
        </div>

        <Handle
          type="target"
          position={isHorizontal ? Position.Left : Position.Top}
          id="in"
          style={{ opacity: 0 }}
        />
        <Handle
          type="target"
          position={isHorizontal ? Position.Top : Position.Left}
          id="in-left"
          style={{ left: isHorizontal ? '24%' : undefined, opacity: 0 }}
        />
        <Handle
          type="target"
          position={isHorizontal ? Position.Bottom : Position.Right}
          id="in-right"
          style={{ left: isHorizontal ? '76%' : undefined, opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out"
          style={{ opacity: 0 }}
        />
        {branching ? (
          <Handle
            type="source"
            position={isHorizontal ? Position.Bottom : Position.Right}
            id="out-right"
            style={isHorizontal ? { left: '72%', opacity: 0 } : { opacity: 0 }}
          />
        ) : null}
      </div>
    )
  }

  function metricTone(metricKey) {
    switch (metricKey) {
      case 'uniqueVisitors':
      case 'visitors':
        return {
          bgA: 'rgba(14,165,233,0.20)',
          bgB: 'rgba(34,211,238,0.12)',
          border: 'rgba(56,189,248,0.62)',
          dot: 'rgba(56,189,248,0.95)',
          dotGlow: 'rgba(56,189,248,0.30)',
          ring: 'rgba(56,189,248,0.10)',
          glow: 'rgba(34,211,238,0.14)',
          label: 'rgba(186,230,253,0.95)',
          text: 'rgba(240,249,255,0.96)',
        }
      case 'registrations':
        return {
          bgA: 'rgba(59,130,246,0.18)',
          bgB: 'rgba(99,102,241,0.10)',
          border: 'rgba(96,165,250,0.62)',
          dot: 'rgba(96,165,250,0.95)',
          dotGlow: 'rgba(96,165,250,0.30)',
          ring: 'rgba(59,130,246,0.10)',
          glow: 'rgba(99,102,241,0.12)',
          label: 'rgba(191,219,254,0.95)',
          text: 'rgba(239,246,255,0.96)',
        }
      case 'depositsCount':
      case 'deposits':
        return {
          bgA: 'rgba(148,163,184,0.18)',
          bgB: 'rgba(59,130,246,0.08)',
          border: 'rgba(148,163,184,0.60)',
          dot: 'rgba(148,163,184,0.95)',
          dotGlow: 'rgba(148,163,184,0.28)',
          ring: 'rgba(148,163,184,0.10)',
          glow: 'rgba(148,163,184,0.12)',
          label: 'rgba(226,232,240,0.92)',
          text: 'rgba(241,245,249,0.96)',
        }
      case 'fts':
        return {
          bgA: 'rgba(34,197,94,0.18)',
          bgB: 'rgba(16,185,129,0.10)',
          border: 'rgba(74,222,128,0.62)',
          dot: 'rgba(74,222,128,0.95)',
          dotGlow: 'rgba(74,222,128,0.30)',
          ring: 'rgba(34,197,94,0.10)',
          glow: 'rgba(16,185,129,0.14)',
          label: 'rgba(187,247,208,0.95)',
          text: 'rgba(240,253,244,0.96)',
        }
      case 'ftd':
        return {
          bgA: 'rgba(245,158,11,0.18)',
          bgB: 'rgba(234,179,8,0.10)',
          border: 'rgba(251,191,36,0.62)',
          dot: 'rgba(251,191,36,0.95)',
          dotGlow: 'rgba(251,191,36,0.32)',
          ring: 'rgba(245,158,11,0.10)',
          glow: 'rgba(234,179,8,0.14)',
          label: 'rgba(254,243,199,0.95)',
          text: 'rgba(255,251,235,0.96)',
        }
      case 'qftd':
        return {
          bgA: 'rgba(168,85,247,0.18)',
          bgB: 'rgba(236,72,153,0.10)',
          border: 'rgba(192,132,252,0.62)',
          dot: 'rgba(192,132,252,0.95)',
          dotGlow: 'rgba(192,132,252,0.30)',
          ring: 'rgba(168,85,247,0.10)',
          glow: 'rgba(192,132,252,0.14)',
          label: 'rgba(233,213,255,0.95)',
          text: 'rgba(250,245,255,0.96)',
        }
      default:
        return {
          bgA: 'rgba(59,130,246,0.20)',
          bgB: 'rgba(14,165,233,0.12)',
          border: 'rgba(59,130,246,0.62)',
          dot: 'rgba(59,130,246,0.95)',
          dotGlow: 'rgba(59,130,246,0.30)',
          ring: 'rgba(59,130,246,0.10)',
          glow: 'rgba(14,165,233,0.14)',
          label: 'rgba(191,219,254,0.95)',
          text: 'rgba(239,246,255,0.96)',
        }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'visible',
        padding: isPrimary ? '12px 14px' : '10px 12px',
        paddingTop: timingBadge ? (isPrimary ? 32 : 28) : undefined,
        paddingRight: isClickable ? (isPrimary ? 40 : 38) : undefined,
        background: baseSurface,
        border: baseBorder,
        borderRadius: isEntryNode ? 24 : 14,
        boxShadow: nodeShadow,
        color: baseColor,
        fontWeight: 800,
        fontSize: isPrimary ? 13 : 12,
        letterSpacing: 0.2,
        minWidth: isEntryNode ? 210 : undefined,
        ...(linkAccent || {}),
      }}
    >
      {timingBadge ? (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 12,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(253,224,71,0.95), rgba(251,146,60,0.92))',
            color: 'rgba(67,20,7,0.96)',
            fontSize: 10,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 0.5,
            boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
            border: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          {timingBadge}
        </div>
      ) : null}

      {kpis.length ? (
        <div
          style={{
            position: 'absolute',
            top: isHorizontal ? '100%' : '50%',
            left: isHorizontal ? 12 : '100%',
            marginTop: isHorizontal ? 14 : 0,
            marginLeft: isHorizontal ? 0 : 12,
            transform: isHorizontal ? 'none' : 'translateY(-50%)',
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column',
            flexWrap: isHorizontal ? 'wrap' : 'nowrap',
            gap: 6,
            alignItems: 'flex-start',
            pointerEvents: 'none',
            maxWidth: isHorizontal ? 240 : undefined,
          }}
        >
          {kpis.map((k, idx) => {
            const isLive = Boolean(k.metricKey)
            const tone = isLive ? metricTone(k.metricKey) : null
            const liveStyle = isLive
              ? {
                  background: `linear-gradient(135deg, ${tone.bgA}, ${tone.bgB})`,
                  border: `1px solid ${tone.border}`,
                  color: tone.text,
                  boxShadow: `0 10px 26px rgba(0,0,0,0.22), 0 0 0 3px ${tone.ring}, 0 0 18px ${tone.glow}`,
                }
              : {
                  background: 'rgba(148,163,184,0.10)',
                  border: '1px solid rgba(148,163,184,0.18)',
                  color: 'rgba(226,232,240,0.92)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                }

            return (
              <div
                key={`${idx}-${k.label || ''}-${k.value || ''}`}
                title={isLive ? 'Live metric (User Behavior)' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 900,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  ...liveStyle,
                }}
              >
                {isLive ? (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: tone.dot,
                      boxShadow: `0 0 0 3px ${tone.ring}, 0 0 10px ${tone.dotGlow}`,
                      flex: '0 0 auto',
                    }}
                  />
                ) : null}
                {k.label ? (
                  <span
                    style={{
                      color: isLive ? tone.label : 'rgba(148,163,184,0.95)',
                    }}
                  >
                    {k.label}
                  </span>
                ) : null}
                {k.value ? <span>{k.value}</span> : null}
              </div>
            )
          })}
        </div>
      ) : null}
      {isClickable ? (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontSize: 12,
            fontWeight: 900,
            color: linkPalette.icon,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ↗
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            lineHeight: 1.18,
            textShadow: isSolitics ? 'none' : '0 1px 1px rgba(0,0,0,0.25)',
          }}
        >
          {data?.label}
        </div>
        {data?.subLabel ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: subLabelColor, lineHeight: 1.3 }}>
            {data.subLabel}
          </div>
        ) : null}
      </div>

      {hasSegmentEntryBadge ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translate(-50%, 12px)',
            padding: '6px 12px',
            borderRadius: 999,
            background: '#0f172a',
            color: '#ffffff',
            border: '1px solid #1e3a8a',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 20px rgba(15,23,42,0.18)',
          }}
        >
          Segment Entry
        </div>
      ) : null}

      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        id="in"
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={isHorizontal ? Position.Top : Position.Left}
        id="in-left"
        style={{ left: isHorizontal ? '24%' : undefined, opacity: 0 }}
      />
      <Handle
        type="target"
        position={isHorizontal ? Position.Bottom : Position.Right}
        id="in-right"
        style={{ left: isHorizontal ? '76%' : undefined, opacity: 0 }}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out"
        style={{ opacity: 0 }}
      />

      {branching ? (
        <Handle
          type="source"
          position={isHorizontal ? Position.Bottom : Position.Right}
          id="out-right"
          style={isHorizontal ? { left: '72%', opacity: 0 } : { opacity: 0 }}
        />
      ) : null}
    </div>
  )
}
