import React from 'react'
import { Handle, Position } from '../reactflowCompat'

export default function OutcomeNode({ data }) {
  const tone = data?.kind
  const isLink = Boolean(data?.linkToFlow)
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
          bgA: 'rgba(16,185,129,0.18)',
          bgB: 'rgba(34,211,238,0.10)',
          border: 'rgba(16,185,129,0.58)',
          dot: 'rgba(16,185,129,0.95)',
          dotGlow: 'rgba(16,185,129,0.26)',
          ring: 'rgba(16,185,129,0.10)',
          glow: 'rgba(16,185,129,0.12)',
          label: 'rgba(167,243,208,0.95)',
          text: 'rgba(236,253,245,0.95)',
        }
    }
  }
  const borderByTone = {
    positive: 'rgba(34,197,94,0.35)',
    neutral: 'rgba(148,163,184,0.28)',
    negative: 'rgba(239,68,68,0.32)',
  }

  const linkAccent = isLink
    ? {
        cursor: 'pointer',
        border: '1px solid rgba(56, 189, 248, 0.70)',
        outline: '2px solid rgba(34, 211, 238, 0.16)',
        outlineOffset: 2,
        boxShadow:
          '0 10px 30px rgba(0,0,0,0.24), 0 0 0 4px rgba(56, 189, 248, 0.08), 0 0 20px rgba(34, 211, 238, 0.14)',
      }
    : null

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'visible',
        padding: '10px 12px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: `1px solid ${borderByTone[tone] || 'rgba(148, 163, 184, 0.25)'}`,
        borderRadius: 999,
        boxShadow: '0 10px 30px rgba(0,0,0,0.24)',
        color: '#e5e7eb',
        fontWeight: 900,
        fontSize: 12,
        textAlign: 'center',
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
            const mt = isLive ? metricTone(k.metricKey) : null
            const liveStyle = isLive
              ? {
                  background: `linear-gradient(135deg, ${mt.bgA}, ${mt.bgB})`,
                  border: `1px solid ${mt.border}`,
                  color: mt.text,
                  boxShadow: `0 10px 24px rgba(0,0,0,0.20), 0 0 0 3px ${mt.ring}, 0 0 18px ${mt.glow}`,
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
                      background: mt.dot,
                      boxShadow: `0 0 0 3px ${mt.ring}, 0 0 10px ${mt.dotGlow}`,
                      flex: '0 0 auto',
                    }}
                  />
                ) : null}
                {k.label ? (
                  <span
                    style={{
                      color: isLive ? mt.label : 'rgba(148,163,184,0.95)',
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
            top: 7,
            right: 10,
            fontSize: 11,
            fontWeight: 950,
            color: 'rgba(56, 189, 248, 0.95)',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ↗
        </div>
      ) : null}
      <div style={{ lineHeight: 1.2 }}>{data?.label}</div>

      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out" style={{ opacity: 0 }} />
    </div>
  )
}
