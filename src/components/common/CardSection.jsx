import React from 'react'

export default function CardSection({ title, subtitle, actions, children, background, sticky = false, stickyTop = 8 }) {
  const stickyStyles = sticky
    ? {
        position: 'sticky',
        top: stickyTop,
        zIndex: 20,
        boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
        background: background || 'rgba(9, 16, 28, 0.96)',
        backdropFilter: 'blur(6px)',
      }
    : {}

  return (
    <div
      className="card card-global"
      style={{
        background: background || undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...stickyStyles,
      }}
    >
      {(title || subtitle || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div>
            {title ? <h3 style={{ margin: 0 }}>{title}</h3> : null}
            {subtitle ? <p style={{ margin: 0, fontSize: 12, color: '#9fb3c8' }}>{subtitle}</p> : null}
          </div>
          {actions ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  )
}
