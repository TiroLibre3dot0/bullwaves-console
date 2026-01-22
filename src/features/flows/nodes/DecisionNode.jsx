import React from 'react'
import { Handle, Position } from '../reactflowCompat'

export default function DecisionNode({ data }) {
  const isPrimary = data?.kind === 'primary'
  const label = (data?.label ?? '').toString()
  const subLabel = (data?.subLabel ?? '').toString()
  const contentLen = label.length + (subLabel ? subLabel.length : 0)

  const diamondSizePct = contentLen > 55 ? 66 : 62
  const textScale = contentLen > 90 ? 0.78 : contentLen > 70 ? 0.84 : contentLen > 55 ? 0.86 : 0.96
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
  const textMaxWidth = contentLen > 90 ? 108 : contentLen > 70 ? 116 : 120

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${diamondSizePct}%`,
          height: `${diamondSizePct}%`,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          background: isPrimary ? 'rgba(2, 6, 23, 0.78)' : 'rgba(15, 23, 42, 0.72)',
          border: isPrimary
            ? '1px solid rgba(226,232,240,0.22)'
            : '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: 10,
          boxShadow: '0 8px 22px rgba(0,0,0,0.24)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 6,
          transform: `rotate(-45deg) scale(${textScale})`,
          color: '#e5e7eb',
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
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            hyphens: 'auto',
          }}
        >
          <div style={{ lineHeight: 1.06 }}>{label}</div>
          {data?.subLabel ? (
            <div
              style={{
                fontSize: subLabelFontSize,
                fontWeight: 700,
                color: 'rgba(148,163,184,0.95)',
                lineHeight: 1.05,
              }}
            >
              {subLabel}
            </div>
          ) : null}
        </div>
      </div>

      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="in-left" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="in-right" style={{ opacity: 0 }} />

      <Handle type="source" position={Position.Left} id="out-left" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="out-right" style={{ opacity: 0 }} />

      <Handle type="source" position={Position.Bottom} id="out" style={{ opacity: 0 }} />

      <Handle
        type="source"
        position={Position.Bottom}
        id="out-b1"
        style={{ left: '25%', opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out-b2"
        style={{ left: '50%', opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out-b3"
        style={{ left: '75%', opacity: 0 }}
      />
    </div>
  )
}
