import { useEffect, useState } from 'react'
import { fetchQlikItems } from '../reportsHub/services/qlikConsoleService'

const QLIK_TENANT = 'https://creolabs.uk.qlikcloud.com'

export default function CreolabsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchQlikItems(50)
      .then((res) => {
        if (cancelled) return
        const rows = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : []
        setApps(rows.filter((r) => r.resourceType === 'app'))
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Errore durante il caricamento delle app Qlik')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-label">CREOLABS</p>
          <h1 className="page-title">Qlik Cloud</h1>
          <p className="page-subtitle">
            App analitiche disponibili nel tenant Creolabs. Clic su una card per aprirla in Qlik
            Cloud.
          </p>
        </div>
      </header>

      <section className="card-block">
        <div className="card-block-header">
          <div>
            <p className="eyebrow">App disponibili</p>
            <h3>CREOLABS · {loading ? '…' : apps.length} app</h3>
          </div>
        </div>

        {error ? (
          <div
            style={{
              border: '1px solid rgba(239,68,68,0.45)',
              borderRadius: 12,
              padding: 14,
              background: 'rgba(127,29,29,0.25)',
              color: '#fecaca',
            }}
          >
            {error}
          </div>
        ) : loading ? (
          <p className="muted">Caricamento app in corso…</p>
        ) : apps.length === 0 ? (
          <p className="muted">Nessuna app trovata. Verifica la connessione Qlik.</p>
        ) : (
          <div className="card-columns" role="list">
            {apps.map((app) => (
              <a
                key={app.resourceId}
                href={`${QLIK_TENANT}/sense/app/${app.resourceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-global"
                style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}
                role="listitem"
              >
                <div className="eyebrow">Qlik App</div>
                <h4 style={{ margin: '6px 0 4px' }}>{app.name}</h4>
                <p
                  className="muted"
                  style={{ marginTop: 6, fontSize: '0.76rem', wordBreak: 'break-all' }}
                >
                  {app.resourceId}
                </p>
                <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
                  Apri in Qlik Cloud →
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
