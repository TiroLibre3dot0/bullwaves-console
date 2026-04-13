import { useMemo } from 'react'
import { getConsoleToolByKey } from '../../../config/tools'

const INTERNAL_REPORTS = [
  { label: 'Creolabs Breakdown', href: '/creolabs' },
  { label: 'Solitics Journey Report', href: '/solitics' },
  { label: 'Trustpilot Guide', href: '/trustpilot-guide' },
  { label: 'Overview Dashboard', href: '/overview' },
]

function openInternal(pathname) {
  if (typeof window === 'undefined') return
  if (!pathname) return
  if (window.location.pathname === pathname) return
  window.location.assign(pathname)
}

export default function ExternalReportsHubPage() {
  const qlikTool = useMemo(() => getConsoleToolByKey('qlik'), [])

  const qlikHref = String(qlikTool?.href || '').trim()
  const likelyBlockedByCsp = useMemo(() => {
    const lower = qlikHref.toLowerCase()
    return lower.includes('qlik.com')
  }, [qlikHref])

  const openQlikExternal = () => {
    if (typeof window === 'undefined') return
    if (!qlikHref) return
    window.open(qlikHref, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-label">REPORTS</p>
          <h1 className="page-title">Reports Hub</h1>
          <p className="page-subtitle">
            Centro unico per aprire Creolabs e i principali report direttamente dentro la console.
          </p>
        </div>
      </header>

      <section className="card-block" style={{ marginBottom: 20 }}>
        <div className="card-block-header">
          <div>
            <p className="eyebrow">External Report</p>
            <h3>Creolabs · Qlik Cloud</h3>
            <p className="muted">
              Qlik blocca l'embed in iframe con policy CSP su questo dominio. Apri il report in
              nuova scheda oppure usa il report Creolabs interno alla console.
            </p>
          </div>
          <div>
            <button type="button" className="btn" onClick={openQlikExternal}>
              Apri in nuova scheda
            </button>
          </div>
        </div>

        {!qlikHref ? (
          <p className="muted">Link Qlik non configurato in config tools.</p>
        ) : (
          <div
            style={{
              border: '1px solid var(--panel-border, #2a2f40)',
              borderRadius: 12,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.4)',
            }}
          >
            <p className="muted" style={{ margin: 0 }}>
              Connessione negata da myqlik.qlik.com: la direttiva CSP frame-ancestors consente solo
              self, quindi il browser blocca qualsiasi iframe esterno.
            </p>
            {likelyBlockedByCsp ? (
              <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Stato: embed disattivato automaticamente per evitare errori runtime in console.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="card-block">
        <div className="card-block-header">
          <div>
            <p className="eyebrow">Internal Reports</p>
            <h3>Report disponibili in console</h3>
            <p className="muted">
              Accesso rapido ai report interni gia presenti nella piattaforma.
            </p>
          </div>
        </div>

        <div className="card-columns" role="list">
          {INTERNAL_REPORTS.map((report) => (
            <button
              key={report.href}
              type="button"
              className="card card-global"
              style={{ textAlign: 'left' }}
              onClick={() => openInternal(report.href)}
              role="listitem"
            >
              <div className="eyebrow">Report</div>
              <h4 style={{ margin: '6px 0 0' }}>{report.label}</h4>
              <p className="muted" style={{ marginTop: 8 }}>
                {report.href}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
