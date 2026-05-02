import { useEffect, useMemo, useState } from 'react'
import { getConsoleToolByKey } from '../../../config/tools'
import { fetchQlikSnapshot } from '../services/qlikConsoleService'

const INTERNAL_REPORTS = [
  { label: 'Traders Ranking Rewards', href: '/creolabs' },
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
  const [loadingQlik, setLoadingQlik] = useState(false)
  const [qlikError, setQlikError] = useState('')
  const [qlikSnapshot, setQlikSnapshot] = useState(null)

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

  const refreshQlikSnapshot = async () => {
    setLoadingQlik(true)
    setQlikError('')
    try {
      const data = await fetchQlikSnapshot(15)
      setQlikSnapshot(data)
    } catch (e) {
      setQlikError(e instanceof Error ? e.message : 'Errore durante il test Qlik API')
    } finally {
      setLoadingQlik(false)
    }
  }

  useEffect(() => {
    refreshQlikSnapshot()
  }, [])

  const health = qlikSnapshot?.health || null
  const configured = Boolean(health?.configured)
  const mode = String(health?.mode || '').trim() || 'n/a'
  const itemRows = Array.isArray(qlikSnapshot?.items?.data?.data)
    ? qlikSnapshot.items.data.data
    : Array.isArray(qlikSnapshot?.items?.data)
      ? qlikSnapshot.items.data
      : []
  const appRows = Array.isArray(qlikSnapshot?.apps?.data?.data)
    ? qlikSnapshot.apps.data.data
    : Array.isArray(qlikSnapshot?.apps?.data)
      ? qlikSnapshot.apps.data
      : []
  const qlikMissing = health?.missing && typeof health.missing === 'object' ? health.missing : {}
  const missingKeys = Object.keys(qlikMissing).filter((k) => qlikMissing[k])

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

      <section className="card-block" style={{ marginBottom: 20 }}>
        <div className="card-block-header">
          <div>
            <p className="eyebrow">Qlik API Connection</p>
            <h3>Stato integrazione live</h3>
            <p className="muted">
              Verifica real-time della connessione server-side a Qlik (OAuth M2M o API key).
            </p>
          </div>
          <div>
            <button
              type="button"
              className="btn"
              onClick={refreshQlikSnapshot}
              disabled={loadingQlik}
            >
              {loadingQlik ? 'Test in corso...' : 'Ricarica stato API'}
            </button>
          </div>
        </div>

        {qlikError ? (
          <div
            style={{
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: 12,
              padding: 12,
              background: 'rgba(127, 29, 29, 0.25)',
              color: '#fecaca',
              marginBottom: 12,
            }}
          >
            {qlikError}
          </div>
        ) : null}

        <div className="card-columns" role="list" style={{ marginBottom: 12 }}>
          <div className="card card-global" role="listitem">
            <div className="eyebrow">Auth Mode</div>
            <h4 style={{ margin: '6px 0 0' }}>{mode}</h4>
            <p className="muted" style={{ marginTop: 8 }}>
              Stato connessione: {configured ? 'configurata' : 'non configurata'}
            </p>
          </div>

          <div className="card card-global" role="listitem">
            <div className="eyebrow">Items</div>
            <h4 style={{ margin: '6px 0 0' }}>{itemRows.length}</h4>
            <p className="muted" style={{ marginTop: 8 }}>
              Risorse lette da /api/qlik/items
            </p>
          </div>

          <div className="card card-global" role="listitem">
            <div className="eyebrow">Apps</div>
            <h4 style={{ margin: '6px 0 0' }}>{appRows.length}</h4>
            <p className="muted" style={{ marginTop: 8 }}>
              App lette da /api/qlik/apps
            </p>
          </div>
        </div>

        {!configured && missingKeys.length ? (
          <div
            style={{
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              padding: 12,
              background: 'rgba(15, 23, 42, 0.35)',
            }}
          >
            <p className="muted" style={{ marginBottom: 8 }}>
              Variabili mancanti lato server:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {missingKeys.map((k) => (
                <li key={k} className="muted">
                  {k}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="card-block" style={{ marginBottom: 20 }}>
        <div className="card-block-header">
          <div>
            <p className="eyebrow">Macrosection</p>
            <h3>CREOLABS</h3>
            <p className="muted">
              App Qlik Cloud disponibili nel tenant Creolabs. Clic su una card per aprire l'app in
              nuova scheda.
            </p>
          </div>
        </div>

        {loadingQlik ? (
          <p className="muted">Caricamento app in corso…</p>
        ) : itemRows.filter((r) => r.resourceType === 'app').length === 0 ? (
          <p className="muted">Nessuna app disponibile (verifica la connessione Qlik).</p>
        ) : (
          <div className="card-columns" role="list">
            {itemRows
              .filter((r) => r.resourceType === 'app')
              .map((app) => (
                <a
                  key={app.resourceId}
                  href={`https://creolabs.uk.qlikcloud.com/sense/app/${app.resourceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-global"
                  style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}
                  role="listitem"
                >
                  <div className="eyebrow">Qlik App</div>
                  <h4 style={{ margin: '6px 0 0' }}>{app.name}</h4>
                  <p className="muted" style={{ marginTop: 8, fontSize: '0.78rem' }}>
                    {app.resourceId}
                  </p>
                </a>
              ))}
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
