import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'creolabs.testEnvironment3.roadmap.v1'

const SYSTEM_MANAGED_PROGRESS = {
  'p1-t1': 'done',
  'p1-t2': 'done',
  'p1-t3': 'done',
  'p2-t1': 'done',
  'p2-t2': 'done',
  'p2-t3': 'done',
  'p2-t4': 'done',
  'p2-t5': 'in-progress',
  'p3-t1': 'done',
  'p3-t2': 'done',
  'p3-t3': 'done',
  'p4-t1': 'done',
  'p4-t2': 'todo',
  'p4-r1': 'done',
  'p4-r2': 'done',
  'p4-r4': 'done',
  'p4-r5': 'done',
  'p5-t1': 'done',
  'p5-t2': 'done',
  'p5-t3': 'done',
  'p5-r1': 'done',
  'p5-r2': 'done',
  'p5-r3': 'done',
  'p5-r4': 'done',
  'p5-r5': 'done',
  'p5-r6': 'done',
}

const SYSTEM_PROGRESS_NOTE =
  'Aggiornamento automatico Copilot: avviata configurazione live-sync DB Live per test environment 3.0 (scheduler 15 minuti + sync artifact locale da sorgente live quando disponibile).'

const ROADMAP_STEPS = [
  {
    id: 'phase-1',
    title: 'Foundation and Data Contracts',
    goal: 'Definire il perimetro operativo, schema dati, policy di qualita e tracciabilita prima dello sviluppo.',
    outcome: 'Specifica tecnica approvata per ingestione live Creolabs + API serving + reporting.',
    tasks: [
      {
        id: 'p1-t1',
        title: 'Definire modello dati target',
        description:
          'Tabelle raw, curated e aggregate con campi chiave (clientId, timestamps, source, runId, hash).',
      },
      {
        id: 'p1-t2',
        title: 'Definire strategia provenienza campi',
        description:
          'Regole ufficiali per enrichmentSources e audit trail su affiliateId/clientLogin/clientName.',
      },
      {
        id: 'p1-t3',
        title: 'Definire SLA e KPI runtime',
        description:
          'Freshness target, timeout massimi, soglie retry, criteri di qualita e allarmi.',
      },
    ],
  },
  {
    id: 'phase-2',
    title: 'Ingestion Live Pipeline',
    goal: 'Costruire il motore che importa dati Creolabs in micro-batch in modo resiliente e osservabile.',
    outcome: 'Pipeline schedulata stabile con delta sync, retry controllato e dedup affidabile.',
    tasks: [
      {
        id: 'p2-t1',
        title: 'Implementare scheduler micro-batch',
        description: 'Esecuzione ogni 15 minuti con lock per evitare overlap e corse concorrenti.',
      },
      {
        id: 'p2-t2',
        title: 'Implementare delta sync e watermark',
        description:
          'Carico incrementale su finestre temporali e fallback a full reconciliation giornaliera.',
      },
      {
        id: 'p2-t3',
        title: 'Implementare dedup e merge per recency',
        description:
          'Unificazione per clientId con backfill campi mancanti e priorita sorgenti esplicita.',
      },
      {
        id: 'p2-t4',
        title: 'Persistenza metadati di run',
        description:
          'Durata, esito, record processati, errori, retries, sourceMode, cache hit/miss.',
      },
      {
        id: 'p2-t5',
        title: 'Live sync 15 minuti + refresh artifact locale',
        description:
          'Scheduler background ogni 15 minuti con scrittura snapshot locale aggiornato dalla sorgente live, per evitare chiamate dirette live ad ogni apertura pagina.',
      },
    ],
  },
  {
    id: 'phase-3',
    title: 'Serving API Query-First',
    goal: 'Servire tabelle e analisi dal nostro DB con API veloci e controllate.',
    outcome: 'Endpoint robusti con limit, cursor, sort, filter e payload ridotto.',
    tasks: [
      {
        id: 'p3-t1',
        title: 'Endpoint con cursor pagination',
        description:
          'Navigazione stabile tramite next/prev cursor, niente pagine numeriche fragili.',
      },
      {
        id: 'p3-t2',
        title: 'Sorting e filtering whitelisted',
        description:
          'Sort multi-criterio e filtri controllati per evitare query non sicure o lente.',
      },
      {
        id: 'p3-t3',
        title: 'Response contracts e metadata',
        description: 'Aggiungere meta coerente (freshness, total, sourceBreakdown, diagnostics).',
      },
    ],
  },
  {
    id: 'phase-4',
    title: 'Reports and Automation',
    goal: 'Automatizzare output operativi e manageriali su snapshot affidabili.',
    outcome: 'Report schedulati (PDF/XLSX) e tabelle operative alimentate da dati consistenti.',
    tasks: [
      {
        id: 'p4-t1',
        title: 'Template report operativi',
        description: 'Set iniziale di report mensili e weekly per finance, retention e management.',
      },
      {
        id: 'p4-t2',
        title: 'Integrazione Qlik Reports API',
        description:
          'Generazione asincrona con status polling, download outputs e gestione errori.',
      },
      {
        id: 'p4-t3',
        title: 'Canale distribuzione report',
        description:
          'Esportazione endpoint/download e invio controllato ai destinatari autorizzati.',
      },
      {
        id: 'p4-r1',
        title: 'Definire sezione Creolabs Report (routing + menu + registry)',
        description:
          'Aggiungere view dedicata Creolabs Report, voce sidebar e voce section finder separando chiaramente DB Live (solo dati) da reporting.',
      },
      {
        id: 'p4-r2',
        title: 'Spostare UI report fuori da DB Live',
        description:
          'Rimuovere blocchi report/templates/job monitor da DB Live e ricrearli nella nuova pagina Creolabs Report mantenendo UX e controlli equivalenti.',
      },
      {
        id: 'p4-r3',
        title: 'Riallineare API report su namespace dedicato',
        description:
          'Instradare endpoint report sotto scope Creolabs Report con backward compatibility temporanea e deprecazione esplicita degli hook legacy su DB Live.',
      },
      {
        id: 'p4-r4',
        title: 'Pulizia DB Live a perimetro database-only',
        description:
          'Lasciare in DB Live solo ingestion, status, export e query-first dati; eliminare dipendenze report dal contratto pagina.',
      },
      {
        id: 'p4-r5',
        title: 'Validazione post-migrazione Creolabs Report',
        description:
          'Eseguire smoke su route/menu/API e verificare che DB Live resti focalizzato su dati mentre Creolabs Report gestisce interamente i flussi report.',
      },
    ],
  },
  {
    id: 'phase-5',
    title: 'Quality, Security and Go-Live',
    goal: 'Chiudere il progetto con robustezza tecnica, sicurezza e runbook operativo.',
    outcome: 'Sistema pronto per produzione con monitoraggio, alerting e rollback plan.',
    tasks: [
      {
        id: 'p5-t1',
        title: 'Test suite end-to-end',
        description: 'Test su ingestione, dedup, API response, pagination e coerenza numerica.',
      },
      {
        id: 'p5-t2',
        title: 'Security e access policy',
        description: 'Controllo credenziali, segregazione ruoli, sanitizzazione query e audit log.',
      },
      {
        id: 'p5-t3',
        title: 'Runbook e handover',
        description:
          'Manuale operativo con playbook incidenti, checklist deploy e fallback procedure.',
      },
      {
        id: 'p5-r1',
        title: 'DB Live accesso read-only (no bootstrap-on-read)',
        description:
          'Disattivare l avvio ingestione al semplice accesso pagina: la GET DB Live deve leggere stato/snapshot senza triggerare update automatici.',
      },
      {
        id: 'p5-r2',
        title: 'Badge ultimo aggiornamento e modalita sorgente',
        description:
          'Mostrare in UI ultimo aggiornamento, eta dati e modalita sorgente (live/snapshot/no-source) per rendere chiara l affidabilita del numero visto.',
      },
      {
        id: 'p5-r3',
        title: 'Strict-live mode per DB Live',
        description:
          'Introdurre opzione strict-live: se la sorgente upstream non e disponibile, bloccare il risultato con errore operativo esplicito invece di servire snapshot persistito.',
      },
      {
        id: 'p5-r4',
        title: 'Fallback identity sicuro (UNMAPPED)',
        description:
          'Quando affiliateId o clientLogin mancano, applicare policy esplicita UNMAPPED (toggle query/UI) per evitare vuoti silenziosi e rendere il gap operativo immediatamente visibile.',
      },
      {
        id: 'p5-r5',
        title: 'Azione repair-identity su store DB Live',
        description:
          'Aggiungere action ingestion-control dedicata al reprocessing dei soli client con identity incompleta usando fallback da dataset/cached meta/identity key univoca.',
      },
      {
        id: 'p5-r6',
        title: 'Quality gate su missing identity',
        description:
          'Introdurre warning critico e metrica quality quando il rapporto di identity mancante supera soglia definita (alert rosso in pagina DB Live).',
      },
    ],
  },
]

function getDefaultStatuses() {
  const map = {}
  for (const phase of ROADMAP_STEPS) {
    for (const task of phase.tasks) {
      map[task.id] = 'todo'
    }
  }
  return map
}

function loadStatuses() {
  const rank = {
    todo: 0,
    'in-progress': 1,
    done: 2,
  }
  const applySystemProgress = (base) => {
    const next = { ...base }
    for (const [taskId, status] of Object.entries(SYSTEM_MANAGED_PROGRESS)) {
      const current = next[taskId] || 'todo'
      if ((rank[status] || 0) > (rank[current] || 0)) {
        next[taskId] = status
      }
    }
    return next
  }

  if (typeof window === 'undefined') return applySystemProgress(getDefaultStatuses())
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return applySystemProgress(getDefaultStatuses())
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return applySystemProgress(getDefaultStatuses())

    const defaults = getDefaultStatuses()
    for (const key of Object.keys(defaults)) {
      if (parsed[key] === 'done' || parsed[key] === 'in-progress' || parsed[key] === 'todo') {
        defaults[key] = parsed[key]
      }
    }
    return applySystemProgress(defaults)
  } catch {
    return applySystemProgress(getDefaultStatuses())
  }
}

function statusStyle(status) {
  if (status === 'done') {
    return {
      background: 'rgba(34,197,94,0.16)',
      border: '1px solid rgba(34,197,94,0.45)',
      color: '#bbf7d0',
      label: 'Done',
    }
  }
  if (status === 'in-progress') {
    return {
      background: 'rgba(251,191,36,0.16)',
      border: '1px solid rgba(251,191,36,0.45)',
      color: '#fde68a',
      label: 'In Progress',
    }
  }
  return {
    background: 'rgba(148,163,184,0.16)',
    border: '1px solid rgba(148,163,184,0.45)',
    color: '#e2e8f0',
    label: 'Todo',
  }
}

const cardStyle = {
  borderRadius: 14,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.48))',
}

const actionButton = {
  appearance: 'none',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.36)',
  background: 'rgba(30,41,59,0.82)',
  color: '#e2e8f0',
  padding: '7px 11px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

function formatDateTime(value) {
  const ms = Date.parse(String(value || ''))
  if (!Number.isFinite(ms)) return 'n/a'
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(ms))
}

function formatMinutes(ms) {
  const value = Number(ms)
  if (!Number.isFinite(value) || value <= 0) return 'n/a'
  return `${Math.round(value / 60000)} min`
}

export default function CreolabsTestEnvironment3Page() {
  const [taskStatuses, setTaskStatuses] = useState(() => loadStatuses())
  const [runtime, setRuntime] = useState({ loading: true, error: '', data: null })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskStatuses))
    } catch {
      // Ignore storage write failures.
    }
  }, [taskStatuses])

  useEffect(() => {
    let cancelled = false

    const loadRuntime = async () => {
      try {
        const res = await fetch('/api/qlik/creolabs/db-live-ingestion-status', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const payload = await res.json()
        if (!payload?.ok) throw new Error(payload?.error || 'Invalid ingestion status payload')
        if (cancelled) return
        setRuntime({ loading: false, error: '', data: payload.data || null })
      } catch (error) {
        if (cancelled) return
        setRuntime({
          loading: false,
          error: error instanceof Error ? error.message : 'Status fetch failed',
          data: null,
        })
      }
    }

    loadRuntime()
    const timer = window.setInterval(loadRuntime, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const allTasks = useMemo(() => ROADMAP_STEPS.flatMap((phase) => phase.tasks), [])

  const metrics = useMemo(() => {
    const total = allTasks.length
    const done = allTasks.filter((task) => taskStatuses[task.id] === 'done').length
    const inProgress = allTasks.filter((task) => taskStatuses[task.id] === 'in-progress').length
    const todo = total - done - inProgress
    const completion = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, inProgress, todo, completion }
  }, [allTasks, taskStatuses])

  const runtimeSummary = useMemo(() => {
    const status = runtime?.data || {}
    const freshness = status?.freshness || {}
    const lastRun = status?.lastRun || {}
    const localArtifactSync = lastRun?.localArtifactSync || {}

    return {
      sourceMode: String(lastRun?.sourceMode || 'n/a'),
      interval: formatMinutes(freshness?.intervalMs),
      lastSuccessAt: formatDateTime(status?.lastSuccessAt),
      lastRunAt: formatDateTime(status?.lastRunAt),
      localArtifact: localArtifactSync?.written
        ? `updated (${localArtifactSync?.rowCount || 0} rows)`
        : localArtifactSync?.reason || 'n/a',
      localArtifactPath: String(localArtifactSync?.filePath || 'n/a'),
    }
  }, [runtime])

  const setStatus = (taskId, status) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [taskId]: status,
    }))
  }

  const markPhaseDone = (phase) => {
    setTaskStatuses((prev) => {
      const next = { ...prev }
      for (const task of phase.tasks) next[task.id] = 'done'
      return next
    })
  }

  const resetRoadmap = () => {
    setTaskStatuses(getDefaultStatuses())
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          ...cardStyle,
          padding: 18,
          background:
            'radial-gradient(circle at 92% 12%, rgba(14,165,233,0.2), transparent 42%), linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.62))',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#f8fafc' }}>
          Creolabs Test Environment 3.0
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            color: '#cbd5e1',
            maxWidth: 980,
            lineHeight: 1.5,
            fontSize: 13,
          }}
        >
          Mappa d azione per costruire un database live Creolabs orientato ad analisi, tabelle
          operative e report. Ogni task puo passare da Todo a In Progress a Done durante l
          esecuzione del progetto.
        </p>
        <p
          style={{
            margin: '8px 0 0',
            color: '#93c5fd',
            maxWidth: 980,
            lineHeight: 1.5,
            fontSize: 12,
          }}
        >
          {SYSTEM_PROGRESS_NOTE}
        </p>

        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <div style={{ ...cardStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>
              Total tasks
            </div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>
              {metrics.total}
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>Done</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#86efac' }}>
              {metrics.done}
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>
              In progress
            </div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#fde68a' }}>
              {metrics.inProgress}
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>Todo</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>
              {metrics.todo}
            </div>
          </div>
          <div style={{ ...cardStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>
              Completion
            </div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#93c5fd' }}>
              {metrics.completion}%
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>
            Runtime monitor (auto refresh 15s)
          </div>
          {runtime.loading ? (
            <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 13 }}>
              Loading ingestion status...
            </div>
          ) : runtime.error ? (
            <div style={{ marginTop: 6, color: '#fca5a5', fontSize: 13 }}>
              Status error: {runtime.error}
            </div>
          ) : (
            <div
              style={{
                marginTop: 8,
                display: 'grid',
                gap: 8,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <div style={{ color: '#e2e8f0', fontSize: 12 }}>
                Source mode: {runtimeSummary.sourceMode}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 12 }}>
                Scheduler interval: {runtimeSummary.interval}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 12 }}>
                Last success: {runtimeSummary.lastSuccessAt}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 12 }}>
                Last run: {runtimeSummary.lastRunAt}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 12 }}>
                Artifact sync: {runtimeSummary.localArtifact}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 12 }}>
                Artifact path: {runtimeSummary.localArtifactPath}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={actionButton} onClick={resetRoadmap}>
            Reset all to Todo
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {ROADMAP_STEPS.map((phase, idx) => {
          const doneCount = phase.tasks.filter((task) => taskStatuses[task.id] === 'done').length
          const progressCount = phase.tasks.filter(
            (task) => taskStatuses[task.id] === 'in-progress'
          ).length
          const todoCount = phase.tasks.length - doneCount - progressCount

          return (
            <section key={phase.id} style={{ ...cardStyle, padding: 14 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: 900 }}>
                  <div style={{ fontSize: 11, color: '#7dd3fc', textTransform: 'uppercase' }}>
                    Step {idx + 1}
                  </div>
                  <h3
                    style={{ margin: '6px 0 0', color: '#f8fafc', fontSize: 17, fontWeight: 800 }}
                  >
                    {phase.title}
                  </h3>
                  <p
                    style={{ margin: '8px 0 0', color: '#cbd5e1', lineHeight: 1.45, fontSize: 13 }}
                  >
                    Goal: {phase.goal}
                  </p>
                  <p
                    style={{ margin: '6px 0 0', color: '#93c5fd', lineHeight: 1.45, fontSize: 13 }}
                  >
                    Final outcome: {phase.outcome}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: 8, minWidth: 210 }}>
                  <div
                    style={{
                      ...cardStyle,
                      padding: 10,
                      fontSize: 12,
                      color: '#cbd5e1',
                    }}
                  >
                    Done {doneCount} / {phase.tasks.length} - In Progress {progressCount} - Todo{' '}
                    {todoCount}
                  </div>
                  <button type="button" style={actionButton} onClick={() => markPhaseDone(phase)}>
                    Mark phase as Done
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                {phase.tasks.map((task) => {
                  const status = taskStatuses[task.id] || 'todo'
                  const style = statusStyle(status)

                  return (
                    <article
                      key={task.id}
                      style={{
                        borderRadius: 12,
                        border: style.border,
                        background: style.background,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ maxWidth: 860 }}>
                          <div
                            style={{ fontSize: 11, color: '#bfdbfe', textTransform: 'uppercase' }}
                          >
                            {task.id}
                          </div>
                          <h4
                            style={{
                              margin: '5px 0 0',
                              color: '#f8fafc',
                              fontSize: 14,
                              fontWeight: 800,
                            }}
                          >
                            {task.title}
                          </h4>
                          <p
                            style={{
                              margin: '7px 0 0',
                              color: '#e2e8f0',
                              fontSize: 13,
                              lineHeight: 1.45,
                            }}
                          >
                            {task.description}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gap: 6, minWidth: 180 }}>
                          <div
                            style={{
                              borderRadius: 999,
                              border: style.border,
                              background: style.background,
                              color: style.color,
                              textAlign: 'center',
                              fontSize: 11,
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              padding: '5px 8px',
                            }}
                          >
                            {style.label}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              style={actionButton}
                              onClick={() => setStatus(task.id, 'todo')}
                            >
                              Todo
                            </button>
                            <button
                              type="button"
                              style={actionButton}
                              onClick={() => setStatus(task.id, 'in-progress')}
                            >
                              In Progress
                            </button>
                            <button
                              type="button"
                              style={actionButton}
                              onClick={() => setStatus(task.id, 'done')}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
