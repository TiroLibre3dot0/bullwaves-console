import { useEffect, useMemo } from 'react'
import { decodeSharePayload } from '../../../utils/shareCodec'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import { trackPublicShareOpen } from '../../../utils/analytics'

type SharePayload = {
  v: 1
  generatedAt: string
  scenario: 'conservative' | 'base' | 'aggressive'
  plan: any
  metrics?: any
}

function fmt(n: any, digits = 0) {
  const num = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(num)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(num)
}

function scenarioLabel(key: string) {
  switch (key) {
    case 'conservative':
      return 'Conservativo'
    case 'base':
      return 'Base'
    case 'aggressive':
      return 'Aggressivo'
    default:
      return String(key)
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'Planned':
      return 'Pianificata'
    case 'In progress':
      return 'In corso'
    case 'Live':
      return 'Attiva'
    case 'Optimizing':
      return 'Ottimizzazione'
    default:
      return String(status)
  }
}

export default function PublicMarketingPlanSharePage({ token }: { token: string }) {
  const decoded = useMemo(() => decodeSharePayload(token) as SharePayload | null, [token])

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Piano Marketing — Vista Board',
      description: 'Vista di sola lettura a livello board: obiettivi strategici, iniziative, stato, KPI e previsioni.',
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [])

  useEffect(() => {
    if (!decoded || decoded.v !== 1 || !decoded.plan) return
    trackPublicShareOpen({
      kind: 'marketing_plan',
      token,
      generatedAt: decoded.generatedAt,
    })
  }, [token, decoded?.v, decoded?.plan, decoded?.generatedAt])

  if (!decoded || decoded.v !== 1 || !decoded.plan) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text)' }}>Link non valido</h2>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>
          Il link condiviso del piano marketing è mancante o non valido.
        </p>
      </div>
    )
  }

  const plan = decoded.plan
  const metrics = decoded.metrics || {}
  const initiatives = Array.isArray(plan.initiatives) ? plan.initiatives : []
  const objectives = Array.isArray(plan.objectives) ? plan.objectives : []

  const scenario = decoded.scenario || 'base'

  const totals = initiatives.reduce(
    (acc: any, i: any) => {
      const f = i?.forecast?.[scenario] || {}
      acc.users += Number(f.usersDelta || 0)
      acc.deposits += Number(f.depositsDelta || 0)
      acc.retention += Number(f.retentionDeltaPct || 0)
      acc.revenue += Number(f.revenueDelta || 0)
      return acc
    },
    { users: 0, deposits: 0, retention: 0, revenue: 0 }
  )

  const statusCounts = initiatives.reduce(
    (acc: any, i: any) => {
      const s = String(i?.status || 'Planned')
      acc[s] = (acc[s] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Bullwaves · Esecuzione Marketing
            </div>
            <h1 style={{ color: 'var(--text)', fontSize: 30, margin: '6px 0 6px 0' }}>Vista board</h1>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Condivisione in sola lettura · Generato {new Date(decoded.generatedAt).toLocaleString()} · Scenario: {scenario}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: 14, minWidth: 220 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Baseline (attuale)</div>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>{fmt(metrics?.baseline?.registrationsTotal)}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Registrazioni</div>
            </div>
            <div className="card" style={{ padding: 14, minWidth: 220 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Baseline (attuale)</div>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>{fmt(metrics?.baseline?.depositUsersTotal)}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Utenti depositanti</div>
            </div>
            <div className="card" style={{ padding: 14, minWidth: 220 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Baseline (attuale)</div>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>
                {metrics?.baseline?.depositRetentionM1Pct == null
                  ? '—'
                  : `${fmt(metrics?.baseline?.depositRetentionM1Pct, 1)}%`}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Ritenzione depositi (proxy M1)</div>
            </div>
            <div className="card" style={{ padding: 14, minWidth: 220 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Incremento previsto (somma)</div>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>+{fmt(totals.users)}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Utenti</div>
            </div>
            <div className="card" style={{ padding: 14, minWidth: 220 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Incremento previsto (somma)</div>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>+{fmt(totals.deposits)}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Depositi</div>
            </div>
            <div className="card" style={{ padding: 14, minWidth: 220 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Incremento previsto (somma)</div>
              <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 800 }}>+{fmt(totals.retention, 1)}%</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Ritenzione (pp, somma)</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Obiettivi strategici</h2>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {objectives.map((o: any) => (
                <div key={o.id} style={{ padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>{o.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{o.timeframe}</div>
                  <div style={{ color: 'var(--text)', fontSize: 13, marginTop: 8, opacity: 0.92 }}>{o.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Stato di esecuzione</h2>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              {Object.keys(statusCounts)
                .sort()
                .map((k) => (
                  <div key={k} style={{ padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }} title={k}>
                      {statusLabel(k)}
                    </div>
                    <div style={{ color: 'var(--text)', fontSize: 18, fontWeight: 800 }}>{fmt(statusCounts[k])}</div>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 12 }}>
              Nota KPI: quando l'attribuzione non è disponibile, i risultati sono trattati come assunzioni e tracciati tramite baseline globali Bullwaves.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Iniziative chiave</h2>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              Totale iniziative: {initiatives.length} · Scenario previsione: {scenarioLabel(String(scenario))}
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {initiatives.map((i: any) => {
              const f = i?.forecast?.[scenario] || {}
              return (
                <div key={i.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 900, color: 'var(--text)' }}>{i.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }} title={String(i.status)}>
                      {statusLabel(String(i.status))}
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>{i.ownerRole}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, color: 'var(--text)' }}>
                      +{fmt(f.usersDelta)} utenti
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, color: 'var(--text)' }}>
                      +{fmt(f.depositsDelta)} depositi
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, color: 'var(--text)' }}>
                      +{fmt(f.retentionDeltaPct, 1)}% ritenzione
                    </div>
                  </div>
                  {String(i?.strategicGoal || '').trim() && (
                    <div style={{ marginTop: 10, color: 'var(--text)', opacity: 0.9, fontSize: 13 }}>
                      {i.strategicGoal}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 18, color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
          Questa è una vista condivisa in sola lettura. Non è richiesto login.
        </div>
      </div>
    </div>
  )
}
