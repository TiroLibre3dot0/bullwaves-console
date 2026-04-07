import React from 'react'
import { Handle, Position } from '../reactflowCompat'

function LightningIcon({ color = '#94a3b8' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2 6 13h4l-1 9 7-11h-4l1-9Z" fill={color} stroke={color} strokeLinejoin="round" />
    </svg>
  )
}

export default function CommunicationNode({ data }) {
  const isInfluence = data?.kind === 'influence'
  const isLink = Boolean(data?.linkToFlow)
  const isTemplate = Boolean(data?.templateId)
  const isClickable = isLink || isTemplate
  const isHorizontal = data?.flowDirection === 'horizontal'
  const isSolitics = data?.theme === 'solitics'
  const showDetails = Boolean(data?.showDetails)
  const linkVariant = isClickable && isInfluence ? 'influence' : 'step'

  const kpis = Array.isArray(data?.kpis)
    ? data.kpis
        .filter((k) => k && (k.label || k.value))
        .slice(0, 3)
        .map((k) => ({
          label: k?.label,
          value: k?.value,
          metricKey: k?.metricKey,
        }))
    : []

  const linkPalette =
    linkVariant === 'influence'
      ? {
          border: 'rgba(168, 85, 247, 0.62)',
          outline: 'rgba(168, 85, 247, 0.16)',
          ring: 'rgba(168, 85, 247, 0.08)',
          glow: 'rgba(168, 85, 247, 0.14)',
          icon: 'rgba(192, 132, 252, 0.95)',
        }
      : {
          border: 'rgba(56, 189, 248, 0.65)',
          outline: 'rgba(34, 211, 238, 0.16)',
          ring: 'rgba(56, 189, 248, 0.08)',
          glow: 'rgba(34, 211, 238, 0.14)',
          icon: 'rgba(56, 189, 248, 0.95)',
        }

  function metricTone(metricKey) {
    switch (metricKey) {
      case 'uniqueVisitors':
      case 'visitors':
        return {
          bgA: 'rgba(14,165,233,0.18)',
          bgB: 'rgba(34,211,238,0.10)',
          border: 'rgba(56,189,248,0.58)',
          dot: 'rgba(56,189,248,0.95)',
          dotGlow: 'rgba(56,189,248,0.26)',
          ring: 'rgba(56,189,248,0.10)',
          glow: 'rgba(34,211,238,0.12)',
          label: 'rgba(186,230,253,0.95)',
          text: 'rgba(240,249,255,0.96)',
        }
      case 'registrations':
        return {
          bgA: 'rgba(59,130,246,0.16)',
          bgB: 'rgba(99,102,241,0.10)',
          border: 'rgba(96,165,250,0.58)',
          dot: 'rgba(96,165,250,0.95)',
          dotGlow: 'rgba(96,165,250,0.26)',
          ring: 'rgba(59,130,246,0.10)',
          glow: 'rgba(99,102,241,0.12)',
          label: 'rgba(191,219,254,0.95)',
          text: 'rgba(239,246,255,0.96)',
        }
      case 'depositsCount':
      case 'deposits':
        return {
          bgA: 'rgba(148,163,184,0.16)',
          bgB: 'rgba(59,130,246,0.08)',
          border: 'rgba(148,163,184,0.56)',
          dot: 'rgba(148,163,184,0.95)',
          dotGlow: 'rgba(148,163,184,0.26)',
          ring: 'rgba(148,163,184,0.10)',
          glow: 'rgba(148,163,184,0.12)',
          label: 'rgba(226,232,240,0.92)',
          text: 'rgba(241,245,249,0.96)',
        }
      case 'fts':
        return {
          bgA: 'rgba(34,197,94,0.16)',
          bgB: 'rgba(16,185,129,0.10)',
          border: 'rgba(74,222,128,0.58)',
          dot: 'rgba(74,222,128,0.95)',
          dotGlow: 'rgba(74,222,128,0.26)',
          ring: 'rgba(34,197,94,0.10)',
          glow: 'rgba(16,185,129,0.12)',
          label: 'rgba(187,247,208,0.95)',
          text: 'rgba(240,253,244,0.96)',
        }
      case 'ftd':
        return {
          bgA: 'rgba(245,158,11,0.16)',
          bgB: 'rgba(234,179,8,0.10)',
          border: 'rgba(251,191,36,0.58)',
          dot: 'rgba(251,191,36,0.95)',
          dotGlow: 'rgba(251,191,36,0.28)',
          ring: 'rgba(245,158,11,0.10)',
          glow: 'rgba(234,179,8,0.12)',
          label: 'rgba(254,243,199,0.95)',
          text: 'rgba(255,251,235,0.96)',
        }
      case 'qftd':
        return {
          bgA: 'rgba(168,85,247,0.16)',
          bgB: 'rgba(236,72,153,0.10)',
          border: 'rgba(192,132,252,0.58)',
          dot: 'rgba(192,132,252,0.95)',
          dotGlow: 'rgba(192,132,252,0.26)',
          ring: 'rgba(168,85,247,0.10)',
          glow: 'rgba(192,132,252,0.12)',
          label: 'rgba(233,213,255,0.95)',
          text: 'rgba(250,245,255,0.96)',
        }
      default:
        return {
          bgA: 'rgba(59,130,246,0.18)',
          bgB: 'rgba(14,165,233,0.10)',
          border: 'rgba(59,130,246,0.58)',
          dot: 'rgba(59,130,246,0.95)',
          dotGlow: 'rgba(59,130,246,0.26)',
          ring: 'rgba(59,130,246,0.10)',
          glow: 'rgba(14,165,233,0.12)',
          label: 'rgba(191,219,254,0.95)',
          text: 'rgba(239,246,255,0.96)',
        }
    }
  }

  if (isSolitics) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 14,
            background: 'rgba(248,250,252,0.92)',
            border: '1px dashed #cbd5e1',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 10,
            display: 'grid',
            gridTemplateColumns: '30px minmax(0, 1fr)',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: 'rgba(241,245,249,0.9)',
              border: '1px solid #dbe4ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LightningIcon />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                lineHeight: 1,
              }}
            >
              Context
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 10,
                fontWeight: 700,
                color: '#64748b',
                lineHeight: 1.2,
                maxWidth: '100%',
              }}
            >
              {data?.label}
            </div>
            {showDetails && data?.subLabel ? (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#94a3b8',
                  lineHeight: 1.2,
                  maxWidth: '100%',
                }}
              >
                {data.subLabel}
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
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out"
          style={{ opacity: 0 }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'visible',
        padding: isInfluence ? '8px 10px' : '9px 12px',
        paddingRight: isClickable ? (isInfluence ? 34 : 36) : undefined,
        background: isSolitics
          ? isInfluence
            ? '#f8fafc'
            : '#ffffff'
          : isInfluence
            ? 'rgba(15, 23, 42, 0.28)'
            : 'rgba(15, 23, 42, 0.55)',
        border: isClickable
          ? `1px solid ${linkPalette.border}`
          : isInfluence
            ? isSolitics
              ? '1px dashed #94a3b8'
              : '1px dashed rgba(148, 163, 184, 0.38)'
            : isSolitics
              ? '1px dashed #cbd5e1'
              : '1px dashed rgba(148, 163, 184, 0.55)',
        outline: isClickable ? `2px solid ${linkPalette.outline}` : 'none',
        outlineOffset: isClickable ? 2 : 0,
        borderRadius: 10,
        color: isSolitics
          ? '#334155'
          : isInfluence
            ? 'rgba(226,232,240,0.68)'
            : 'rgba(226,232,240,0.95)',
        fontWeight: isInfluence ? 750 : 800,
        fontSize: isInfluence ? 11 : 12,
        letterSpacing: 0.2,
        opacity: isSolitics ? 1 : isInfluence ? 0.72 : 1,
        cursor: isClickable ? 'pointer' : 'default',
        boxShadow: isClickable
          ? `0 0 0 4px ${linkPalette.ring}, 0 0 22px ${linkPalette.glow}`
          : isSolitics
            ? '0 8px 18px rgba(15,23,42,0.08)'
            : 'none',
      }}
    >
      {kpis.length ? (
        <div
          style={{
            position: 'absolute',
            top: isHorizontal ? '100%' : '50%',
            left: isHorizontal ? 12 : '100%',
            marginTop: isHorizontal ? 12 : 0,
            marginLeft: isHorizontal ? 0 : 12,
            transform: isHorizontal ? 'none' : 'translateY(-50%)',
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column',
            flexWrap: isHorizontal ? 'wrap' : 'nowrap',
            gap: 6,
            alignItems: 'flex-start',
            pointerEvents: 'none',
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
                  boxShadow: `0 10px 24px rgba(0,0,0,0.22), 0 0 0 3px ${tone.ring}, 0 0 18px ${tone.glow}`,
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
                  padding: '4px 9px',
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
            top: 7,
            right: 9,
            fontSize: 11,
            fontWeight: 950,
            color: linkPalette.icon,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ↗
        </div>
      ) : null}
      <div style={{ lineHeight: 1.15 }}>{data?.label}</div>

      {data?.subLabel ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            fontWeight: 800,
            color: isSolitics ? '#64748b' : 'rgba(148,163,184,0.9)',
          }}
        >
          {data.subLabel}
        </div>
      ) : null}

      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        id="in"
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
