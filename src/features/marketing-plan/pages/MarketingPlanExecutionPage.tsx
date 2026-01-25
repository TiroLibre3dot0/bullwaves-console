import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { encodeSharePayload } from '../../../utils/shareCodec.js'
import { loadMarketingPlan, resetMarketingPlan, saveMarketingPlan } from '../store/marketingPlanStore'
import {
  addMarketingExecutionSnapshot,
  clearMarketingExecutionHistory,
  loadMarketingExecutionHistory,
} from '../store/marketingExecutionHistoryStore'
import {
  MarketingInitiative,
  MarketingPlanV1,
  ScenarioKey,
  InitiativeStatus,
  MetricKey,
  defaultMarketingPlan,
} from '../model'
import { loadMarketingBaseline, computeActualsForLastDays } from '../services/marketingMetrics'

function fmt(n: any, digits = 0) {
  const num = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(num)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(num)
}

function badgeColor(status: InitiativeStatus) {
  switch (status) {
    case 'Live':
      return 'rgba(34,211,238,0.22)'
    case 'Optimizing':
      return 'rgba(96,165,250,0.18)'
    case 'In progress':
      return 'rgba(250,204,21,0.14)'
    default:
      return 'rgba(255,255,255,0.06)'
  }
}

function metricLabel(key: MetricKey) {
  switch (key) {
    case 'registrations':
      return 'Registrazioni'
    case 'deposit_users':
      return 'Utenti depositanti'
    case 'deposit_count':
      return 'Numero depositi'
    case 'total_deposits':
      return 'Totale depositi'
    case 'net_deposits':
      return 'Depositi netti'
    case 'deposit_retention_m1':
      return 'Retention depositi (Mese 1)'
    default:
      return key
  }
}

function scenarioLabel(key: ScenarioKey) {
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

function statusLabel(status: InitiativeStatus) {
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

function IconTarget({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Zm0-12a4 4 0 1 0 4 4 4.004 4.004 0 0 0-4-4Zm0 6a2 2 0 1 1 2-2 2.002 2.002 0 0 1-2 2Z"
        fill={color}
        opacity="0.9"
      />
    </svg>
  )
}

function IconChart({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19h16v2H2V3h2v16Zm4-2H6v-6h2v6Zm5 0h-2V7h2v10Zm5 0h-2v-9h2v9Z"
        fill={color}
        opacity="0.9"
      />
    </svg>
  )
}

function IconDelta({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 2 21h20L12 3Zm0 4.7L18.4 19H5.6L12 7.7Z" fill={color} opacity="0.9" />
    </svg>
  )
}

function deltaTone(n: number) {
  if (!Number.isFinite(n)) return 'neutral'
  if (n > 0) return 'good'
  if (n < 0) return 'bad'
  return 'neutral'
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ScenarioMiniBars({
  title,
  values,
  color,
}: {
  title: string
  values: { conservative: number; base: number; aggressive: number }
  color: string
}) {
  const max = Math.max(1, values.conservative, values.base, values.aggressive)
  const items: Array<{ k: 'conservative' | 'base' | 'aggressive'; label: string; v: number }> = [
    { k: 'conservative', label: 'Cons.', v: values.conservative },
    { k: 'base', label: 'Base', v: values.base },
    { k: 'aggressive', label: 'Agg.', v: values.aggressive },
  ]

  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {items.map((it) => {
          const h = clamp((it.v / max) * 38, 2, 38)
          return (
            <div
              key={it.k}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 10,
                background: 'rgba(255,255,255,0.02)',
              }}
              title={`${scenarioLabel(it.k as ScenarioKey)}: ${fmt(it.v)}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 900 }}>{fmt(it.v)}</div>
              </div>
              <div
                style={{
                  height: 42,
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <div
                  style={{
                    height: h,
                    width: '100%',
                    borderRadius: 10,
                    background: color,
                    opacity: 0.65,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InitiativeBars({
  title,
  items,
  color,
  valueFormatter,
}: {
  title: string
  items: Array<{ id: string; name: string; value: number }>
  color: string
  valueFormatter?: (n: number) => string
}) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)))
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((it) => {
          const w = clamp((Math.abs(it.value) / max) * 100, 2, 100)
          return (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 110px', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {it.name}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 10,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    style={{
                      width: `${w}%`,
                      height: '100%',
                      background: color,
                      opacity: 0.55,
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text)', fontWeight: 900 }}>
                {valueFormatter ? valueFormatter(it.value) : fmt(it.value)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TextListEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const text = (value || []).join('\n')
  return (
    <textarea
      className="search-input"
      style={{ minHeight: 120, maxWidth: '100%' }}
      value={text}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))}
    />
  )
}

export default function MarketingPlanExecutionPage() {
  const { t } = useI18n()
  const [plan, setPlan] = useState<MarketingPlanV1>(() => {
    try {
      return loadMarketingPlan()
    } catch {
      return defaultMarketingPlan()
    }
  })

  const [selectedId, setSelectedId] = useState<string>(() => plan.initiatives[0]?.id || '')
  const [scenario, setScenario] = useState<ScenarioKey>('base')
  const selected = useMemo(
    () => plan.initiatives.find((i) => i.id === selectedId) || null,
    [plan.initiatives, selectedId]
  )

  const [baseline, setBaseline] = useState<any>(null)
  const [baselineLoading, setBaselineLoading] = useState(true)
  const [baselineError, setBaselineError] = useState<any>(null)

  const [snapshotWindowDays, setSnapshotWindowDays] = useState<30 | 60 | 90>(90)
  const [history, setHistory] = useState<any[]>(() => {
    try {
      return loadMarketingExecutionHistory()
    } catch {
      return []
    }
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setBaselineLoading(true)
      setBaselineError(null)
      try {
        const b = await loadMarketingBaseline()
        if (!cancelled) setBaseline(b)
      } catch (e) {
        if (!cancelled) setBaselineError(e)
      } finally {
        if (!cancelled) setBaselineLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totals = useMemo(() => {
    return plan.initiatives.reduce(
      (acc, i) => {
        const f = i.forecast?.[scenario] || {}
        acc.users += Number(f.usersDelta || 0)
        acc.deposits += Number(f.depositsDelta || 0)
        acc.revenue += Number(f.revenueDelta || 0)
        return acc
      },
      { users: 0, deposits: 0, revenue: 0 }
    )
  }, [plan.initiatives, scenario])

  const totalsByScenario = useMemo(() => {
    const acc: Record<ScenarioKey, { users: number; deposits: number; revenue: number; retention: number }> = {
      conservative: { users: 0, deposits: 0, revenue: 0, retention: 0 },
      base: { users: 0, deposits: 0, revenue: 0, retention: 0 },
      aggressive: { users: 0, deposits: 0, revenue: 0, retention: 0 },
    }
    for (const i of plan.initiatives) {
      for (const s of ['conservative', 'base', 'aggressive'] as ScenarioKey[]) {
        const f = i.forecast?.[s] || {}
        acc[s].users += Number(f.usersDelta || 0)
        acc[s].deposits += Number(f.depositsDelta || 0)
        acc[s].revenue += Number(f.revenueDelta || 0)
        acc[s].retention += Number(f.retentionDeltaPct || 0)
      }
    }
    return acc
  }, [plan.initiatives])

  const statusCounts = useMemo(() => {
    const counts: Record<InitiativeStatus, number> = {
      Planned: 0,
      'In progress': 0,
      Live: 0,
      Optimizing: 0,
    }
    for (const i of plan.initiatives) counts[i.status] = (counts[i.status] || 0) + 1
    return counts
  }, [plan.initiatives])

  const retentionTotalsDeltaPct = useMemo(() => {
    return plan.initiatives.reduce((acc, i) => {
      const f = i.forecast?.[scenario] || {}
      return acc + Number(f.retentionDeltaPct || 0)
    }, 0)
  }, [plan.initiatives, scenario])

  const updateInitiative = (patch: Partial<MarketingInitiative>) => {
    if (!selected) return
    const next = {
      ...selected,
      ...patch,
    }
    const nextPlan: MarketingPlanV1 = {
      ...plan,
      initiatives: plan.initiatives.map((i) => (i.id === next.id ? next : i)),
      updatedAt: new Date().toISOString(),
    }
    setPlan(nextPlan)
    saveMarketingPlan(nextPlan)
  }

  const handleGenerateShare = async () => {
    // Istantanea del piano + baseline per un link board self-contained (senza login)
    const payload: any = {
      k: 'mplan',
      v: 1,
      generatedAt: new Date().toISOString(),
      scenario,
      plan,
      metrics: {
        baseline,
      },
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(origin)

    let token = ''
    try {
      const resp = await fetch('/api/share/create-marketing-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const data = await resp.json().catch(() => null)
      if (resp.ok && data?.ok && data?.token) token = String(data.token)
      else throw new Error(data?.error || data?.message || 'share-not-available')
    } catch {
      if (!isLocalhost) {
        window.alert('Share link non disponibile (storage share non configurato).')
        return
      }

      // Local fallback (dev only): store snapshot in localStorage (same browser/device only)
      try {
        const bytes = new Uint8Array(12)
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes)
        token = `share_local_${Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`
      } catch {
        token = `share_local_${Math.random().toString(16).slice(2)}`
      }
      try {
        window.localStorage.setItem(`bw_share_marketing_plan:${token}`, JSON.stringify({ payload }))
      } catch {
        // ignore
      }
    }

    const href = token.startsWith('share_')
      ? `${origin}/s/${encodeURIComponent(token)}`
      : `${origin}/share/marketing-plan/${encodeURIComponent(token)}`
    try {
      await navigator.clipboard.writeText(href)
      window.alert('Link board copiato negli appunti')
    } catch {
      window.prompt('Copia il link board:', href)
    }
  }

  const handleAutoActuals = async () => {
    if (!selected) return
    if (selected.timeframe.type !== 'days') {
      window.alert('Il riempimento automatico è supportato solo per timeframe 30/60/90 giorni.')
      return
    }
    const res = await computeActualsForLastDays(selected.timeframe.days)
    updateInitiative({
      actuals: {
        ...selected.actuals,
        usersActual: res.usersActual,
        depositsActual: res.depositsActual,
        source: 'bullwaves-data',
        notes:
          'Compilato automaticamente dal file Registrations Report (proxy globale; non attribuito alla singola iniziativa).',
      },
    })
  }

  const handleSnapshot = async () => {
    const actuals = await computeActualsForLastDays(snapshotWindowDays)
    const retentionDeltaPct = plan.initiatives.reduce((acc, i) => {
      const f = i.forecast?.[scenario] || {}
      return acc + Number(f.retentionDeltaPct || 0)
    }, 0)

    const next = addMarketingExecutionSnapshot({
      windowDays: snapshotWindowDays,
      scenario,
      forecastTotals: {
        usersDelta: totals.users,
        depositsDelta: totals.deposits,
        retentionDeltaPct,
        revenueDelta: totals.revenue,
      },
      actualsProxy: actuals,
      notes:
        'I risultati reali sono un proxy globale dal file Registrations Report (non attribuito). Usare per trend a livello board.',
    })
    setHistory(next)
  }

  return (
    <div className="support-user-check-page" style={{ padding: 18 }}>
      <style>{`
        .marketing-exec-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
          gap: 14px;
        }

        .marketing-exec-panel {
          min-width: 0;
        }

        @media (max-width: 980px) {
          .marketing-exec-grid {
            grid-template-columns: 1fr;
          }
        }

        .mp-legend {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .mp-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          font-size: 12px;
          color: var(--text);
        }

        .mp-accent-forecast { border-color: rgba(34,211,238,0.35); background: rgba(34,211,238,0.06); }
        .mp-accent-actual { border-color: rgba(168,85,247,0.35); background: rgba(168,85,247,0.06); }
        .mp-accent-delta { border-color: rgba(250,204,21,0.30); background: rgba(250,204,21,0.05); }

        .mp-callout {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          color: var(--muted);
          font-size: 12px;
          line-height: 1.35;
        }

        .mp-card-title {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          font-weight: 900;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Sistema di Esecuzione Marketing
          </div>
          <h1 style={{ margin: '6px 0 6px 0', fontSize: 26, color: 'var(--text)' }}>
            Piano Marketing Bullwaves — Livello di Esecuzione
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Esecuzione + misurazione + previsioni. Non è “finito” finché non è condivisibile a livello board.
          </div>
          <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
            Vista interna di esecuzione — la vista board astrae questo livello.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="search-input"
            style={{ maxWidth: 190 }}
            value={String(snapshotWindowDays)}
            onChange={(e) => setSnapshotWindowDays(Number(e.target.value) as any)}
            title="Finestra istantanea"
          >
            <option value="30">Istantanea: ultimi 30g</option>
            <option value="60">Istantanea: ultimi 60g</option>
            <option value="90">Istantanea: ultimi 90g</option>
          </select>
          <select
            className="search-input"
            style={{ maxWidth: 220 }}
            value={scenario}
            onChange={(e) => setScenario(e.target.value as ScenarioKey)}
          >
            <option value="conservative">Conservativo</option>
            <option value="base">Base</option>
            <option value="aggressive">Aggressivo</option>
          </select>
          <button type="button" className="btn-primary" onClick={handleGenerateShare}>
            Genera link board
          </button>
          <button type="button" className="btn-secondary" onClick={handleSnapshot}>
            Istantanea previsione vs reale
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const ok = window.confirm('Ripristinare il Piano Marketing ai valori predefiniti?')
              if (!ok) return
              const next = resetMarketingPlan()
              setPlan(next)
              setSelectedId(next.initiatives[0]?.id || '')
            }}
          >
            Ripristina
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Istantanea esecuzione
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="tab" style={{ padding: '5px 10px', fontSize: 12 }}>
                finestra {snapshotWindowDays}g
              </span>
              <span className="tab" style={{ padding: '5px 10px', fontSize: 12 }}>
                Scenario: {scenarioLabel(scenario)}
              </span>
              {baseline ? (
                <span
                  className="tab"
                  style={{ padding: '5px 10px', fontSize: 12, opacity: 0.72 }}
                  title="Baseline attuale estratta dai dati Bullwaves"
                >
                  Baseline: {fmt(baseline.registrationsTotal)} registrazioni · {fmt(baseline.depositUsersTotal)} utenti depositanti
                </span>
              ) : (
                <span className="tab" style={{ padding: '5px 10px', fontSize: 12, opacity: 0.6 }}>
                  Baseline: {baselineLoading ? 'caricamento…' : '—'}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="tab" style={{ padding: '6px 10px', fontSize: 12 }}>
              Obiettivo: +{fmt(totals.users)} utenti
            </span>
            <span className="tab" style={{ padding: '6px 10px', fontSize: 12 }}>
              +{fmt(totals.deposits)} depositi
            </span>
            <span className="tab" style={{ padding: '6px 10px', fontSize: 12 }}>
              +{fmt(retentionTotalsDeltaPct, 1)}% ritenzione
            </span>
            <span className="tab" style={{ padding: '6px 10px', fontSize: 12 }}>
              +{fmt(totals.revenue)} ricavi
            </span>
          </div>
        </div>

        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text)', fontSize: 13, fontWeight: 900 }}>
            Come funzionano le proiezioni
          </summary>
          <div className="mp-callout">
            <div style={{ fontWeight: 900, color: 'var(--text)' }}>Modello mentale</div>
            <div style={{ marginTop: 6 }}>
              Le proiezioni sono <b>Δ (differenze)</b> che inserisci per ogni iniziativa <b>per lo scenario selezionato</b>.
              I numeri “Obiettivo” in alto sono calcolati così:
              <span style={{ color: 'var(--text)' }}> totale = somma(di tutte le iniziative forecast[scenario]).</span>
            </div>
            <div style={{ marginTop: 8 }}>
              La baseline è estratta automaticamente dai dati globali Bullwaves; è mostrata solo come contesto.
            </div>
            <div style={{ marginTop: 8 }}>
              “Istantanea previsione vs reale” confronta le Δ previste con un <b>proxy globale dei risultati reali</b>
              degli ultimi N giorni (non attribuito a una specifica iniziativa).
            </div>
            <div style={{ marginTop: 8 }} className="mp-legend">
              <span className="mp-chip mp-accent-forecast" title="Cosa ci aspettiamo (modificabile)">
                <IconChart color="rgba(34,211,238,0.95)" /> Previsione
              </span>
              <span className="mp-chip mp-accent-actual" title="Cosa è successo (manuale o proxy)">
                <IconTarget color="rgba(168,85,247,0.95)" /> Reale
              </span>
              <span className="mp-chip mp-accent-delta" title="Reale − Previsione (calcolato)">
                <IconDelta color="rgba(250,204,21,0.95)" /> Scostamento
              </span>
            </div>
          </div>
        </details>
      </div>

      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        <div style={{ fontWeight: 900, color: 'var(--text)' }}>Input del modello (Δ) — inizia da qui</div>
        <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12, lineHeight: 1.35 }}>
          Seleziona un’iniziativa e modifica i numeri nella card <b>Impatto atteso (previsione)</b> (turchese).
          Subito dopo puoi rivedere l’effetto in “Panoramica piano marketing”.
        </div>
      </div>

      <div className="marketing-exec-grid" style={{ marginTop: 12 }}>
        <div className="card marketing-exec-panel" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
            <h2 style={{ margin: 0 }}>Iniziative marketing</h2>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{plan.initiatives.length} schede</div>
          </div>

          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {plan.initiatives.map((i) => {
              const f = i.forecast?.[scenario] || {}
              const active = i.id === selectedId
              return (
                <button
                  key={i.id}
                  type="button"
                  className={`card ${active ? 'active' : ''}`}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 12,
                    border: active ? '1px solid rgba(34,211,238,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'linear-gradient(180deg, rgba(34,211,238,0.06), rgba(255,255,255,0.02))' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedId(i.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>{i.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text)',
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: badgeColor(i.status),
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {statusLabel(i.status)}
                    </div>
                  </div>
                  {active ? (
                    <>
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{i.ownerRole}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="tab" style={{ padding: '5px 10px', fontSize: 12 }}>
                          +{fmt(f.usersDelta)} utenti
                        </span>
                        <span className="tab" style={{ padding: '5px 10px', fontSize: 12 }}>
                          +{fmt(f.depositsDelta)} depositi
                        </span>
                      </div>
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="card marketing-exec-panel" style={{ padding: 14 }}>
          {!selected ? (
            <div style={{ color: 'var(--muted)' }}>Seleziona un'iniziativa per modificare i dettagli di esecuzione.</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{selected.name}</h2>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{selected.strategicGoal}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    className="search-input"
                    style={{ maxWidth: 220 }}
                    value={selected.status}
                    onChange={(e) => updateInitiative({ status: e.target.value as InitiativeStatus })}
                  >
                    <option value="Planned">Pianificata</option>
                    <option value="In progress">In corso</option>
                    <option value="Live">Attiva</option>
                    <option value="Optimizing">Ottimizzazione</option>
                  </select>
                  <button type="button" className="btn-secondary" onClick={handleAutoActuals}>
                    Compila risultati (proxy)
                  </button>
                </div>
              </div>

              <div className="card" style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
                <div style={{ fontWeight: 900 }}>Impatto e risultati</div>
                <div style={{ marginTop: 8 }} className="mp-legend">
                  <span className="mp-chip mp-accent-forecast">
                    <IconChart color="rgba(34,211,238,0.95)" /> Previsione (modificabile)
                  </span>
                  <span className="mp-chip mp-accent-actual">
                    <IconTarget color="rgba(168,85,247,0.95)" /> Reale (manuale/proxy)
                  </span>
                  <span className="mp-chip mp-accent-delta">
                    <IconDelta color="rgba(250,204,21,0.95)" /> Scostamento = Reale − Previsione
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div
                    className="card"
                    style={{
                      padding: 12,
                      border: '1px solid rgba(34,211,238,0.28)',
                      background: 'rgba(34,211,238,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div className="mp-card-title">
                        <IconChart color="rgba(34,211,238,0.95)" /> Impatto atteso (previsione)
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>Scenario: {scenarioLabel(scenario)}</div>
                    </div>
                    <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
                      <b style={{ color: 'var(--text)' }}>Modificabile:</b> cambia questi numeri per modificare la proiezione.
                      (Sono Δ rispetto al baseline, per lo scenario selezionato.)
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Δ utenti</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(34,211,238,0.35)' }}
                          value={String(selected.forecast?.[scenario]?.usersDelta ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              forecast: {
                                ...selected.forecast,
                                [scenario]: { ...selected.forecast[scenario], usersDelta: n },
                              } as any,
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Δ depositi</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(34,211,238,0.35)' }}
                          value={String(selected.forecast?.[scenario]?.depositsDelta ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              forecast: {
                                ...selected.forecast,
                                [scenario]: { ...selected.forecast[scenario], depositsDelta: n },
                              } as any,
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Δ ritenzione (%)</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(34,211,238,0.35)' }}
                          value={String(selected.forecast?.[scenario]?.retentionDeltaPct ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              forecast: {
                                ...selected.forecast,
                                [scenario]: { ...selected.forecast[scenario], retentionDeltaPct: n },
                              } as any,
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Δ ricavi</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(34,211,238,0.35)' }}
                          value={String(selected.forecast?.[scenario]?.revenueDelta ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              forecast: {
                                ...selected.forecast,
                                [scenario]: { ...selected.forecast[scenario], revenueDelta: n },
                              } as any,
                            })
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
                      Lo scostamento è calcolato quando esistono risultati reali.
                    </div>
                  </div>

                  <div
                    className="card"
                    style={{
                      padding: 12,
                      border: '1px solid rgba(168,85,247,0.28)',
                      background: 'rgba(168,85,247,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div className="mp-card-title">
                        <IconTarget color="rgba(168,85,247,0.95)" /> Risultati reali
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{selected.actuals?.source || 'manual'}</div>
                    </div>
                    <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
                      Usa “Compila risultati (proxy)” per un proxy globale Bullwaves.
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Utenti reali</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(168,85,247,0.35)' }}
                          value={String(selected.actuals?.usersActual ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              actuals: { ...selected.actuals, usersActual: n, source: 'manual' },
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Depositi reali</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(168,85,247,0.35)' }}
                          value={String(selected.actuals?.depositsActual ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              actuals: { ...selected.actuals, depositsActual: n, source: 'manual' },
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Ritenzione reale (%)</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(168,85,247,0.35)' }}
                          value={String(selected.actuals?.retentionActualPct ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              actuals: { ...selected.actuals, retentionActualPct: n, source: 'manual' },
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Ricavi reali</div>
                        <input
                          className="search-input"
                          style={{ borderColor: 'rgba(168,85,247,0.35)' }}
                          value={String(selected.actuals?.revenueActual ?? '')}
                          onChange={(e) => {
                            const v = e.target.value
                            const n = v.trim() ? Number(v) : undefined
                            updateInitiative({
                              actuals: { ...selected.actuals, revenueActual: n, source: 'manual' },
                            })
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 12,
                        background: 'rgba(250,204,21,0.04)',
                        border: '1px solid rgba(250,204,21,0.22)',
                      }}
                    >
                      <div style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <IconDelta color="rgba(250,204,21,0.95)" /> Scostamento vs previsione (scenario: {scenarioLabel(scenario)})
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {(() => {
                          const f = selected.forecast?.[scenario] || {}
                          const a = selected.actuals || {}
                          const du = (Number(a.usersActual) || 0) - (Number(f.usersDelta) || 0)
                          const dd = (Number(a.depositsActual) || 0) - (Number(f.depositsDelta) || 0)
                          const tone = deltaTone(du + dd)
                          const toneColor =
                            tone === 'good'
                              ? 'rgba(34,197,94,0.95)'
                              : tone === 'bad'
                                ? 'rgba(248,113,113,0.95)'
                                : 'var(--text)'
                          return (
                            <>
                              <span style={{ fontSize: 13, color: toneColor }}>
                                Utenti: <b>{fmt(du)}</b>
                              </span>
                              <span style={{ fontSize: 13, color: toneColor }}>
                                Depositi: <b>{fmt(dd)}</b>
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
                      Suggerimento: usa “Compila risultati (proxy)” per recuperare un proxy globale dai dati Bullwaves.
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
                <div style={{ fontWeight: 900 }}>Logica di esecuzione</div>
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Responsabile / ruolo</div>
                    <input
                      className="search-input"
                      value={selected.ownerRole}
                      onChange={(e) => updateInitiative({ ownerRole: e.target.value })}
                    />
                  </div>

                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Orizzonte</div>
                    <select
                      className="search-input"
                      value={selected.timeframe.type === 'days' ? String(selected.timeframe.days) : selected.timeframe.type}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '30' || v === '60' || v === '90') {
                          updateInitiative({ timeframe: { type: 'days', days: Number(v) as any } })
                        } else {
                          updateInitiative({ timeframe: { type: 'days', days: 90 } })
                        }
                      }}
                    >
                      <option value="30">30 giorni</option>
                      <option value="60">60 giorni</option>
                      <option value="90">90 giorni</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Azioni chiave</div>
                    <TextListEditor
                      value={selected.keyActions}
                      onChange={(next) => updateInitiative({ keyActions: next })}
                      placeholder={'Una azione per riga. Deve essere eseguibile (non solo un’idea).'}
                    />
                  </div>

                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Assunzioni (esplicite)</div>
                    <TextListEditor
                      value={selected.assumptions}
                      onChange={(next) => updateInitiative({ assumptions: next })}
                      placeholder={'Una assunzione per riga. Collega a previsione e KPI.'}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Dati Bullwaves collegati</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(
                      [
                        'registrations',
                        'deposit_users',
                        'deposit_count',
                        'total_deposits',
                        'net_deposits',
                        'deposit_retention_m1',
                      ] as MetricKey[]
                    ).map((mk) => {
                      const checked = selected.connectedMetrics.includes(mk)
                      return (
                        <label
                          key={mk}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...selected.connectedMetrics, mk]))
                                : selected.connectedMetrics.filter((x) => x !== mk)
                              updateInitiative({ connectedMetrics: next })
                            }}
                          />
                          <span style={{ fontSize: 12 }}>{metricLabel(mk)}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
                <InitiativeBars
                  title="Cosa guida i totali (scenario selezionato)"
                  items={plan.initiatives
                    .map((i) => ({
                      id: i.id,
                      name: i.name,
                      value: Number(i.forecast?.[scenario]?.usersDelta || 0),
                    }))
                    .slice(0, 8)}
                  color="rgba(34,211,238,0.95)"
                  valueFormatter={(n) => `+${fmt(n)}`}
                />
                <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
                  Nota: questi grafici sono in sola lettura; modifica i campi di Previsione sopra per cambiarli.
                </div>
              </div>

              <div className="card" style={{ padding: 12, border: '1px solid rgba(255,255,255,0.06)', marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900 }}>Registro gestionale</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Note decisioni / blocchi</div>
                </div>
                <textarea
                  className="search-input"
                  style={{ minHeight: 90, maxWidth: '100%', marginTop: 10 }}
                  value={selected.decisionNotes || ''}
                  onChange={(e) => updateInitiative({ decisionNotes: e.target.value })}
                  placeholder={'Quali decisioni servono? Cosa sta bloccando l’esecuzione?'}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <h2 style={{ margin: 0 }}>Panoramica piano marketing</h2>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            {plan.initiatives.length} iniziative · aggiornato{' '}
            {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : '—'}
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['Planned', 'In progress', 'Live', 'Optimizing'] as InitiativeStatus[]).map((st) => (
            <span
              key={st}
              className="tab"
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 999, background: badgeColor(st) }}
              title="Distribuzione stati"
            >
              <b style={{ marginRight: 6 }}>{statusCounts[st] || 0}</b>
              {statusLabel(st)}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
            <ScenarioMiniBars
              title="Confronto scenari — Δ utenti"
              values={{
                conservative: totalsByScenario.conservative.users,
                base: totalsByScenario.base.users,
                aggressive: totalsByScenario.aggressive.users,
              }}
              color="rgba(34,211,238,0.9)"
            />
          </div>
          <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
            <ScenarioMiniBars
              title="Confronto scenari — Δ depositi"
              values={{
                conservative: totalsByScenario.conservative.deposits,
                base: totalsByScenario.base.deposits,
                aggressive: totalsByScenario.aggressive.deposits,
              }}
              color="rgba(168,85,247,0.9)"
            />
          </div>
        </div>

        <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
          Dove cambiare le proiezioni: entra nelle iniziative e modifica i numeri nella card <b>Previsione (turchese)</b>.
          I campi <b>Reale (viola)</b> sono risultati (manuali o proxy) e non cambiano la proiezione.
        </div>
      </div>

      <div className="card-columns" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 14 }}>
          <h2 style={{ margin: 0 }}>Obiettivi strategici</h2>
          <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
            Vista compatta. Passa il mouse su un “pill” per i dettagli.
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {plan.objectives.map((o) => (
              <span
                key={o.id}
                className="tab"
                title={`${o.timeframe}\n\n${o.description}`}
                style={{ padding: '6px 10px', fontSize: 12, cursor: 'help' }}
              >
                <span style={{ fontWeight: 900 }}>{o.title}</span>
                <span style={{ marginLeft: 8, color: 'var(--muted)' }}>{o.timeframe}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <h2 style={{ margin: 0 }}>Baseline attuale (auto-estratta)</h2>
          <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
            Fonte: /Registrations Report.csv
          </div>

          {baselineLoading && <div style={{ marginTop: 10 }}>{t('common.loading')}</div>}
          {baselineError && (
            <div style={{ marginTop: 10, color: '#fca5a5' }}>
              Impossibile caricare la baseline: {String(baselineError?.message || baselineError)}
            </div>
          )}

          {baseline && (
            <>
              <div
                style={{
                  marginTop: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Registrazioni</div>
                  <div style={{ marginTop: 4, color: 'var(--text)', fontSize: 18, fontWeight: 900 }}>
                    {fmt(baseline.registrationsTotal)}
                  </div>
                </div>

                <div
                  style={{
                    padding: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Utenti depositanti</div>
                  <div style={{ marginTop: 4, color: 'var(--text)', fontSize: 18, fontWeight: 900 }}>
                    {fmt(baseline.depositUsersTotal)}
                  </div>
                </div>

                <div
                  style={{
                    padding: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Numero depositi</div>
                  <div style={{ marginTop: 4, color: 'var(--text)', fontSize: 18, fontWeight: 900 }}>
                    {fmt(baseline.depositCountTotal)}
                  </div>
                </div>

                <div
                  style={{
                    padding: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Depositi netti</div>
                  <div style={{ marginTop: 4, color: 'var(--text)', fontSize: 18, fontWeight: 900 }}>
                    {fmt(baseline.netDepositsSum)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
                Ultimo aggiornamento:{' '}
                {baseline.lastExternalDate ? new Date(baseline.lastExternalDate).toLocaleDateString() : '—'}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Previsione vs reale (nel tempo)</h2>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
                Le istantanee creano uno storico “board-friendly”. I reali usano un proxy dai dati globali Bullwaves.
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const ok = window.confirm('Cancellare lo storico delle istantanee?')
                if (!ok) return
                clearMarketingExecutionHistory()
                setHistory([])
              }}
            >
              Cancella storico
            </button>
          </div>

          {!history.length ? (
            <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>
              Nessuna istantanea ancora. Usa “Istantanea previsione vs reale”.
            </div>
          ) : (
            <div style={{ marginTop: 12, overflowX: 'auto' }}>
              <table className="results-list" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Quando</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Finestra</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Scenario</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px' }}>Previsione Δ utenti</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px' }}>Utenti reali (proxy)</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px' }}>Scostamento vs previsione</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px' }}>Previsione Δ depositi</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px' }}>Depositi reali (proxy)</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px' }}>Scostamento vs previsione</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => {
                    const du = Number(h?.actualsProxy?.usersActual || 0) - Number(h?.forecastTotals?.usersDelta || 0)
                    const dd = Number(h?.actualsProxy?.depositsActual || 0) - Number(h?.forecastTotals?.depositsDelta || 0)
                    return (
                      <tr key={h.id}>
                        <td style={{ padding: '10px 8px', color: 'var(--text)' }}>
                          {new Date(h.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 8px', color: 'var(--muted)' }}>{h.windowDays}d</td>
                        <td style={{ padding: '10px 8px', color: 'var(--muted)' }} title={String(h.scenario)}>
                          {scenarioLabel(h.scenario as ScenarioKey)}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>+{fmt(h?.forecastTotals?.usersDelta)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(h?.actualsProxy?.usersActual)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(du)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>+{fmt(h?.forecastTotals?.depositsDelta)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(h?.actualsProxy?.depositsActual)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(dd)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
