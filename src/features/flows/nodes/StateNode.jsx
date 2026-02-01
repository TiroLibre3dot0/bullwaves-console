import React from 'react'
import { Handle, Position } from '../reactflowCompat'

export default function StateNode({ data }) {
  const isPrimary = data?.kind === 'primary'
  const branching = Boolean(data?.branching)
  const isLink = Boolean(data?.linkToFlow)
  const linkVariant = isLink && data?.kind === 'influence' ? 'influence' : 'step'

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

  const linkAccent = isLink
    ? {
        cursor: 'pointer',
        border: `1px solid ${linkPalette.border}`,
        outline: `2px solid ${linkPalette.outline}`,
        outlineOffset: 2,
        boxShadow: `0 12px 34px rgba(0,0,0,0.28), 0 0 0 4px ${linkPalette.ring}, 0 0 24px ${linkPalette.glow}`,
      }
    : null

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
          bgA: 'rgba(16,185,129,0.20)',
          bgB: 'rgba(34,211,238,0.12)',
          border: 'rgba(16,185,129,0.62)',
          dot: 'rgba(16,185,129,0.95)',
          dotGlow: 'rgba(16,185,129,0.30)',
          ring: 'rgba(16,185,129,0.10)',
          glow: 'rgba(16,185,129,0.14)',
          label: 'rgba(167,243,208,0.95)',
          text: 'rgba(236,253,245,0.95)',
        }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'visible',
        padding: isPrimary ? '12px 14px' : '10px 12px',
        paddingRight: isLink ? (isPrimary ? 40 : 38) : undefined,
        background: isPrimary ? 'rgba(2, 6, 23, 0.78)' : 'rgba(15, 23, 42, 0.65)',
        border: isPrimary
          ? '1px solid rgba(226,232,240,0.22)'
          : '1px solid rgba(148, 163, 184, 0.22)',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        color: '#e5e7eb',
        fontWeight: 800,
        fontSize: isPrimary ? 13 : 12,
        letterSpacing: 0.2,
        ...(linkAccent || {}),
      }}
    >
      {kpis.length ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '100%',
            marginLeft: 12,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
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
      {isLink ? (
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
        <div style={{ lineHeight: 1.15 }}>{data?.label}</div>
        {data?.subLabel ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.95)' }}>
            {data.subLabel}
          </div>
        ) : null}
      </div>

      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out" style={{ opacity: 0 }} />

      {branching ? (
        <Handle type="source" position={Position.Right} id="out-right" style={{ opacity: 0 }} />
      ) : null}
    </div>
  )
}
