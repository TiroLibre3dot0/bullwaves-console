import React from 'react'

export default function FilterBar({ children, title, note }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {(title || note) && (
        <div style={{ minWidth: 200 }}>
          {title ? <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{title}</div> : null}
          {note ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{note}</div> : null}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}
