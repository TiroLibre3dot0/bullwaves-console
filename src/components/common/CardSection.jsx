import React from 'react'

export default function CardSection({ title, subtitle, actions, children, background }) {
  return (
    <div
      className="card card-global"
      style={{
        background: background || undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
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
