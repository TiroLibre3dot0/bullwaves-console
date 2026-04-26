import React from 'react'
import { Handle, Position } from '../reactflowCompat'

function TriggerIcon({ color = '#9ca3af' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 20 7.5V16.5L12 21 4 16.5V7.5L12 3Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 9v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function normalizeTriggerLabel(label) {
  const raw = String(label || '').trim()
  if (!raw) return ''

  return raw
    .replace(/\?+$/g, '')
    .replace(/^Visited\s+/i, 'Visit ')
    .replace(/^Started\s+/i, 'Start ')
    .replace(/^Completed\s+/i, 'Complete ')
    .replace(/^Registered\s+/i, 'Register ')
    .replace(/^Opened\s+/i, 'Open ')
}

export default function DecisionNode({ data }) {
  const isPrimary = data?.kind === 'primary'
  const isHorizontal = data?.flowDirection === 'horizontal'
  const isSolitics = data?.theme === 'solitics'
  const showDetails = Boolean(data?.showDetails)
  const label = (data?.label ?? '').toString()
  const subLabel = (data?.subLabel ?? '').toString()
  const triggerLabel = normalizeTriggerLabel(label)
  const contentLen = label.length + (subLabel ? subLabel.length : 0)

  const textScale = contentLen > 90 ? 0.84 : contentLen > 70 ? 0.88 : contentLen > 55 ? 0.92 : 1
  const labelFontSize =
    contentLen > 90
      ? isPrimary
        ? 10
        : 9
      : contentLen > 55
        ? isPrimary
          ? 11
          : 10
        : isPrimary
          ? 12
          : 11
  const subLabelFontSize = contentLen > 90 ? 8 : contentLen > 55 ? 9 : 10
  const textMaxWidth = contentLen > 90 ? 126 : contentLen > 70 ? 136 : 144
  const cardBackground = isSolitics
    ? 'linear-gradient(180deg, #ffffff, #eef2f7)'
    : isPrimary
      ? 'rgba(15, 23, 42, 0.96)'
      : 'rgba(15, 23, 42, 0.9)'
  const cardBorder = isSolitics
    ? '1px solid #9ca3af'
    : isPrimary
      ? '1px solid rgba(226,232,240,0.26)'
      : '1px solid rgba(148, 163, 184, 0.28)'
  const cardShadow = isSolitics
    ? '0 12px 24px rgba(15,23,42,0.12)'
    : '0 14px 28px rgba(15,23,42,0.2)'

  if (isSolitics) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: 'linear-gradient(180deg, #edf3fc, #dde8f7)',
            border: '1px solid #a8bdd9',
            boxShadow: '0 10px 22px rgba(15,23,42,0.10)',
          }}
        />

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
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TriggerIcon />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#b91c1c',
                lineHeight: 1,
              }}
            >
              Condition
            </div>
            <div
              style={{
                marginTop: 6,
                maxWidth: '100%',
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.22,
                color: '#111827',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {triggerLabel || label}
            </div>
            {showDetails && subLabel ? (
              <div
                style={{
                  marginTop: 5,
                  maxWidth: '100%',
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: '#374151',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subLabel}
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
          style={{ left: isHorizontal ? '26%' : undefined, opacity: 0 }}
        />
        <Handle
          type="target"
          position={isHorizontal ? Position.Bottom : Position.Right}
          id="in-right"
          style={{ left: isHorizontal ? '74%' : undefined, opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Left}
          id="out-left"
          style={isHorizontal ? { top: '24%', opacity: 0 } : { opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="out-right"
          style={isHorizontal ? { top: '76%', opacity: 0 } : { opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out"
          style={{ opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out-center"
          style={isHorizontal ? { top: '50%', opacity: 0 } : { left: '50%', opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out-b1"
          style={isHorizontal ? { top: '22%', opacity: 0 } : { left: '25%', opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out-b2"
          style={isHorizontal ? { top: '50%', opacity: 0 } : { left: '50%', opacity: 0 }}
        />
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          id="out-b3"
          style={isHorizontal ? { top: '78%', opacity: 0 } : { left: '75%', opacity: 0 }}
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: cardBackground,
          border: cardBorder,
          borderRadius: 18,
          boxShadow: cardShadow,
        }}
      />

      {isSolitics ? (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            padding: '4px 8px',
            borderRadius: 999,
            background: '#dbeafe',
            color: '#1d4ed8',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Condition
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: isSolitics ? '26px 12px 12px' : 6,
          transform: isSolitics ? `scale(${textScale})` : `rotate(-45deg) scale(${textScale})`,
          color: isSolitics ? '#111827' : '#e5e7eb',
          fontWeight: 900,
          fontSize: labelFontSize,
          letterSpacing: 0.2,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            maxWidth: textMaxWidth,
            padding: '8px 10px',
            background: isSolitics ? 'transparent' : 'rgba(255,255,255,0.06)',
            border: isSolitics ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: isSolitics ? 0 : 12,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            hyphens: 'auto',
          }}
        >
          <div
            style={{
              lineHeight: 1.08,
              textShadow: isSolitics ? 'none' : '0 1px 1px rgba(0,0,0,0.22)',
            }}
          >
            {label}
          </div>
          {data?.subLabel ? (
            <div
              style={{
                fontSize: subLabelFontSize,
                fontWeight: 700,
                color: isSolitics ? '#4b5563' : 'rgba(226,232,240,0.74)',
                lineHeight: 1.15,
              }}
            >
              {subLabel}
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
        style={{ left: isHorizontal ? '26%' : undefined, opacity: 0 }}
      />
      <Handle
        type="target"
        position={isHorizontal ? Position.Bottom : Position.Right}
        id="in-right"
        style={{ left: isHorizontal ? '74%' : undefined, opacity: 0 }}
      />

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Left}
        id="out-left"
        style={isHorizontal ? { top: '24%', opacity: 0 } : { opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-right"
        style={isHorizontal ? { top: '76%', opacity: 0 } : { opacity: 0 }}
      />

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out"
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out-center"
        style={isHorizontal ? { top: '50%', opacity: 0 } : { left: '50%', opacity: 0 }}
      />

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out-b1"
        style={isHorizontal ? { top: '22%', opacity: 0 } : { left: '25%', opacity: 0 }}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out-b2"
        style={isHorizontal ? { top: '50%', opacity: 0 } : { left: '50%', opacity: 0 }}
      />
      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        id="out-b3"
        style={isHorizontal ? { top: '78%', opacity: 0 } : { left: '75%', opacity: 0 }}
      />
    </div>
  )
}
