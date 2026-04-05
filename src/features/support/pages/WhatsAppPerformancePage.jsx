import { useMemo, useState } from 'react'

import { useI18n } from '../../../i18n/I18nContext'
import useCsvData from '../../shared/hooks/useCsvData'

const CANDIDATE_PATHS = ['/raw/whatsapp_performance_allchats_2.csv']

const COPY = {
  en: {
    eyebrow: 'Support Analytics',
    title: 'WhatsApp Performance',
    badge: 'CSV-backed monitoring',
    subtitle:
      'See at a glance which conversations started from an agent, which started from a user, and which outbound contacts got a reply or stayed unanswered.',
    sourceLabel: 'Channel scope',
    sourceOptions: {
      whatsapp: 'WhatsApp only',
      all: 'All channels',
      webchat: 'Web Chat only',
    },
    agentLabel: 'Agent filter',
    allAgents: 'All agents',
    cards: {
      total: 'Chats in scope',
      agentStarted: 'Started by agent',
      userStarted: 'Started by user',
      agentNoReply: 'Agent started, no reply',
      agentReplyRate: 'Agent reply rate',
    },
    hints: {
      total: 'Rows after channel and agent filters.',
      agentStarted: 'Outbound-first or supervise chat follow-up.',
      userStarted: 'Inbound-first conversations.',
      agentNoReply: 'Outbound present, inbound missing.',
      agentReplyRate: 'Agent-started chats that received a reply.',
    },
    glanceEyebrow: 'One glance',
    glanceTitle: 'Conversation start and reply status',
    glanceSubtitle:
      'The four blocks below reflect the operational categories used in the CSV classification logic.',
    segments: {
      agentNoReply: 'Agent start · no reply',
      agentReply: 'Agent start · with reply',
      userNoReply: 'User start · no reply',
      userReply: 'User start · with reply',
    },
    agentTableEyebrow: 'Team view',
    agentTableTitle: 'Breakdown by agent',
    recentEyebrow: 'Recent chats',
    recentTitle: 'Latest conversations in scope',
    columns: {
      agent: 'Agent',
      total: 'Total',
      noReply: 'No reply',
      withReply: 'With reply',
      userStarted: 'User started',
      name: 'Name',
      channel: 'Channel',
      startedBy: 'Started by',
      status: 'Status',
      lastActive: 'Last active',
    },
    startedBy: {
      agent: 'Agent',
      user: 'User',
    },
    empty: 'No conversations match the selected filters.',
    loading: 'Loading WhatsApp performance…',
    error: 'Unable to load the WhatsApp CSV.',
  },
  it: {
    eyebrow: 'Analytics Support',
    title: 'Performance WhatsApp',
    badge: 'Monitoraggio basato su CSV',
    subtitle:
      'Vedi a colpo d’occhio quali conversazioni sono partite da un agente, quali da un utente e quali contatti outbound hanno ricevuto risposta oppure sono rimasti senza risposta.',
    sourceLabel: 'Perimetro canale',
    sourceOptions: {
      whatsapp: 'Solo WhatsApp',
      all: 'Tutti i canali',
      webchat: 'Solo Web Chat',
    },
    agentLabel: 'Filtro agente',
    allAgents: 'Tutti gli agenti',
    cards: {
      total: 'Chat nel perimetro',
      agentStarted: 'Partite da agente',
      userStarted: 'Partite da utente',
      agentNoReply: 'Agente partito, senza risposta',
      agentReplyRate: 'Reply rate agente',
    },
    hints: {
      total: 'Righe dopo i filtri canale e agente.',
      agentStarted: 'Outbound-first o follow-up con supervise chat.',
      userStarted: 'Conversazioni inbound-first.',
      agentNoReply: 'Outbound presente, inbound assente.',
      agentReplyRate: 'Chat avviate da agente che hanno ricevuto risposta.',
    },
    glanceEyebrow: 'Colpo d’occhio',
    glanceTitle: 'Avvio conversazione e stato risposta',
    glanceSubtitle:
      'I quattro blocchi sotto riflettono le categorie operative usate nella logica di classificazione del CSV.',
    segments: {
      agentNoReply: 'Avvio agente · senza risposta',
      agentReply: 'Avvio agente · con risposta',
      userNoReply: 'Avvio utente · senza risposta',
      userReply: 'Avvio utente · con risposta',
    },
    agentTableEyebrow: 'Vista team',
    agentTableTitle: 'Breakdown per agente',
    recentEyebrow: 'Chat recenti',
    recentTitle: 'Ultime conversazioni nel perimetro',
    columns: {
      agent: 'Agente',
      total: 'Totale',
      noReply: 'Senza risposta',
      withReply: 'Con risposta',
      userStarted: 'Partite da utente',
      name: 'Nome',
      channel: 'Canale',
      startedBy: 'Avvio',
      status: 'Stato',
      lastActive: 'Ultima attività',
    },
    startedBy: {
      agent: 'Agente',
      user: 'Utente',
    },
    empty: 'Nessuna conversazione corrisponde ai filtri selezionati.',
    loading: 'Caricamento performance WhatsApp…',
    error: 'Impossibile caricare il CSV WhatsApp.',
  },
}

function normalizeBot(bot = '') {
  const value = String(bot || '').trim()
  if (/whatsapp api/i.test(value)) return 'whatsapp'
  if (/web chat/i.test(value)) return 'webchat'
  return 'other'
}

function mapRow(row) {
  return {
    name: String(row.Name || '').trim(),
    location: String(row.Location || '').trim(),
    bot: String(row.Bot || '').trim(),
    channel: normalizeBot(row.Bot),
    agent: String(row.Agent || '').trim() || 'Unassigned',
    lastActive: String(row['Last Active'] || '').trim(),
    outbound: String(row.Outbound || '').trim(),
    inbound: String(row.Inbound || '').trim(),
    reasonClosed: String(row['Reason Closed'] || '').trim(),
    action: String(row.Actions || '').trim(),
  }
}

function parseTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const parts = raw.match(/^(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2})$/)
  if (!parts) return null
  const [, day, month, year, hh, mm] = parts
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hh), Number(mm))
}

function classifyConversation(row) {
  const inbound = Boolean(row.inbound)
  const outbound = Boolean(row.outbound)
  const action = row.action.toLowerCase()

  if (inbound && !outbound) {
    return {
      key: 'userNoReply',
      startedBy: 'user',
      replied: false,
      statusClass: 'user-no-reply',
    }
  }

  if (outbound && !inbound) {
    return {
      key: 'agentNoReply',
      startedBy: 'agent',
      replied: false,
      statusClass: 'agent-no-reply',
    }
  }

  if (inbound && outbound) {
    if (action === 'supervise chat') {
      return {
        key: 'agentReply',
        startedBy: 'agent',
        replied: true,
        statusClass: 'agent-reply',
      }
    }
    return {
      key: 'userReply',
      startedBy: 'user',
      replied: true,
      statusClass: 'user-reply',
    }
  }

  return {
    key: 'other',
    startedBy: 'other',
    replied: false,
    statusClass: 'user-no-reply',
  }
}

function formatPct(value) {
  return `${Math.round(value)}%`
}

export default function WhatsAppPerformancePage() {
  const { locale } = useI18n()
  const lang = locale === 'it' ? 'it' : 'en'
  const copy = COPY[lang]
  const { data, loading, error, sourcePath } = useCsvData(CANDIDATE_PATHS, mapRow)
  const [channelFilter, setChannelFilter] = useState('whatsapp')
  const [agentFilter, setAgentFilter] = useState('all')

  const agents = useMemo(() => {
    const values = Array.from(new Set((data || []).map((row) => row.agent).filter(Boolean)))
    return values.sort((a, b) => a.localeCompare(b))
  }, [data])

  const filteredRows = useMemo(() => {
    return (data || []).filter((row) => {
      if (channelFilter !== 'all' && row.channel !== channelFilter) return false
      if (agentFilter !== 'all' && row.agent !== agentFilter) return false
      return true
    })
  }, [agentFilter, channelFilter, data])

  const dashboard = useMemo(() => {
    const counters = {
      total: filteredRows.length,
      agentNoReply: 0,
      agentReply: 0,
      userNoReply: 0,
      userReply: 0,
    }

    const agentMap = new Map()
    const recentRows = filteredRows
      .map((row) => ({
        ...row,
        lastActiveTs: parseTime(row.lastActive)?.getTime() || 0,
        classification: classifyConversation(row),
      }))
      .sort((a, b) => b.lastActiveTs - a.lastActiveTs)

    for (const row of recentRows) {
      const key = row.classification.key
      if (Object.prototype.hasOwnProperty.call(counters, key)) counters[key] += 1

      const bucket = agentMap.get(row.agent) || {
        agent: row.agent,
        total: 0,
        agentNoReply: 0,
        agentReply: 0,
        userStarted: 0,
      }

      bucket.total += 1
      if (key === 'agentNoReply') bucket.agentNoReply += 1
      if (key === 'agentReply') bucket.agentReply += 1
      if (key === 'userNoReply' || key === 'userReply') bucket.userStarted += 1
      agentMap.set(row.agent, bucket)
    }

    const agentStarted = counters.agentNoReply + counters.agentReply
    const userStarted = counters.userNoReply + counters.userReply
    const agentReplyRate = agentStarted ? (counters.agentReply / agentStarted) * 100 : 0

    return {
      counters,
      agentStarted,
      userStarted,
      agentReplyRate,
      recentRows: recentRows.slice(0, 18),
      agentRows: Array.from(agentMap.values()).sort((a, b) => b.total - a.total),
      sourcePath,
    }
  }, [filteredRows, sourcePath])

  if (loading) {
    return (
      <div className="page-shell wa-performance-page">
        <div className="card card-global wa-performance-empty">{copy.loading}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell wa-performance-page">
        <div className="card card-global wa-performance-error">{copy.error}</div>
      </div>
    )
  }

  return (
    <div className="page-shell wa-performance-page">
      <div className="wa-performance-page__inner">
        <section className="card card-global wa-performance-page__hero">
          <div className="wa-performance-page__eyebrow">{copy.eyebrow}</div>
          <div className="wa-performance-page__titleRow">
            <h1 className="wa-performance-page__title">{copy.title}</h1>
            <div className="wa-performance-page__badge">{copy.badge}</div>
          </div>
          <p className="wa-performance-page__subtitle">{copy.subtitle}</p>
          <div className="wa-performance-page__filters" style={{ marginTop: 14 }}>
            <label className="wa-performance-page__filter">
              <span className="wa-performance-page__filterLabel">{copy.sourceLabel}</span>
              <select
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value)}
              >
                <option value="whatsapp">{copy.sourceOptions.whatsapp}</option>
                <option value="all">{copy.sourceOptions.all}</option>
                <option value="webchat">{copy.sourceOptions.webchat}</option>
              </select>
            </label>
            <label className="wa-performance-page__filter">
              <span className="wa-performance-page__filterLabel">{copy.agentLabel}</span>
              <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
                <option value="all">{copy.allAgents}</option>
                {agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="wa-performance-kpis">
          <div className="card card-global wa-performance-kpi wa-performance-kpi--muted">
            <div className="wa-performance-kpi__label">{copy.cards.total}</div>
            <div className="wa-performance-kpi__value">{dashboard.counters.total}</div>
            <div className="wa-performance-kpi__hint">{copy.hints.total}</div>
          </div>
          <div className="card card-global wa-performance-kpi">
            <div className="wa-performance-kpi__label">{copy.cards.agentStarted}</div>
            <div className="wa-performance-kpi__value">{dashboard.agentStarted}</div>
            <div className="wa-performance-kpi__hint">{copy.hints.agentStarted}</div>
          </div>
          <div className="card card-global wa-performance-kpi">
            <div className="wa-performance-kpi__label">{copy.cards.userStarted}</div>
            <div className="wa-performance-kpi__value">{dashboard.userStarted}</div>
            <div className="wa-performance-kpi__hint">{copy.hints.userStarted}</div>
          </div>
          <div className="card card-global wa-performance-kpi wa-performance-kpi--warning">
            <div className="wa-performance-kpi__label">{copy.cards.agentNoReply}</div>
            <div className="wa-performance-kpi__value">{dashboard.counters.agentNoReply}</div>
            <div className="wa-performance-kpi__hint">{copy.hints.agentNoReply}</div>
          </div>
          <div className="card card-global wa-performance-kpi wa-performance-kpi--reply">
            <div className="wa-performance-kpi__label">{copy.cards.agentReplyRate}</div>
            <div className="wa-performance-kpi__value">{formatPct(dashboard.agentReplyRate)}</div>
            <div className="wa-performance-kpi__hint">{copy.hints.agentReplyRate}</div>
          </div>
        </section>

        {dashboard.counters.total === 0 ? (
          <div className="card card-global wa-performance-empty">{copy.empty}</div>
        ) : (
          <div className="wa-performance-page__grid">
            <div className="wa-performance-page__col">
              <section className="card card-global wa-performance-glance">
                <div className="wa-performance-card__eyebrow">{copy.glanceEyebrow}</div>
                <h2 className="wa-performance-card__title">{copy.glanceTitle}</h2>
                <div className="wa-performance-card__subtitle">{copy.glanceSubtitle}</div>
                <div className="wa-performance-glance__bar">
                  <div className="wa-performance-glance__segment wa-performance-glance__segment--agent-no-reply">
                    <div className="wa-performance-glance__segmentLabel">
                      {copy.segments.agentNoReply}
                    </div>
                    <div className="wa-performance-glance__segmentValue">
                      {dashboard.counters.agentNoReply}
                    </div>
                    <div className="wa-performance-glance__segmentMeta">
                      {dashboard.counters.total
                        ? formatPct(
                            (dashboard.counters.agentNoReply / dashboard.counters.total) * 100
                          )
                        : '0%'}
                    </div>
                  </div>
                  <div className="wa-performance-glance__segment wa-performance-glance__segment--agent-reply">
                    <div className="wa-performance-glance__segmentLabel">
                      {copy.segments.agentReply}
                    </div>
                    <div className="wa-performance-glance__segmentValue">
                      {dashboard.counters.agentReply}
                    </div>
                    <div className="wa-performance-glance__segmentMeta">
                      {dashboard.counters.total
                        ? formatPct(
                            (dashboard.counters.agentReply / dashboard.counters.total) * 100
                          )
                        : '0%'}
                    </div>
                  </div>
                  <div className="wa-performance-glance__segment wa-performance-glance__segment--user-no-reply">
                    <div className="wa-performance-glance__segmentLabel">
                      {copy.segments.userNoReply}
                    </div>
                    <div className="wa-performance-glance__segmentValue">
                      {dashboard.counters.userNoReply}
                    </div>
                    <div className="wa-performance-glance__segmentMeta">
                      {dashboard.counters.total
                        ? formatPct(
                            (dashboard.counters.userNoReply / dashboard.counters.total) * 100
                          )
                        : '0%'}
                    </div>
                  </div>
                  <div className="wa-performance-glance__segment wa-performance-glance__segment--user-reply">
                    <div className="wa-performance-glance__segmentLabel">
                      {copy.segments.userReply}
                    </div>
                    <div className="wa-performance-glance__segmentValue">
                      {dashboard.counters.userReply}
                    </div>
                    <div className="wa-performance-glance__segmentMeta">
                      {dashboard.counters.total
                        ? formatPct((dashboard.counters.userReply / dashboard.counters.total) * 100)
                        : '0%'}
                    </div>
                  </div>
                </div>
              </section>

              <section className="card card-global">
                <div className="wa-performance-card__eyebrow">{copy.recentEyebrow}</div>
                <h2 className="wa-performance-card__title">{copy.recentTitle}</h2>
                <table className="wa-performance-table">
                  <thead>
                    <tr>
                      <th>{copy.columns.name}</th>
                      <th>{copy.columns.channel}</th>
                      <th>{copy.columns.startedBy}</th>
                      <th>{copy.columns.status}</th>
                      <th>{copy.columns.lastActive}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentRows.map((row) => {
                      const labelMap = {
                        agentNoReply: copy.segments.agentNoReply,
                        agentReply: copy.segments.agentReply,
                        userNoReply: copy.segments.userNoReply,
                        userReply: copy.segments.userReply,
                      }
                      return (
                        <tr
                          key={`${row.name}-${row.lastActive}-${row.agent}-${row.outbound}-${row.inbound}`}
                        >
                          <td>
                            <div style={{ fontWeight: 700 }}>{row.name || '—'}</div>
                            <div style={{ color: '#94a3b8', fontSize: 12 }}>{row.agent}</div>
                          </td>
                          <td>{row.channel}</td>
                          <td>{copy.startedBy[row.classification.startedBy] || '—'}</td>
                          <td>
                            <span
                              className={`wa-performance-pill wa-performance-pill--${row.classification.statusClass}`}
                            >
                              {labelMap[row.classification.key] || row.classification.key}
                            </span>
                          </td>
                          <td>{row.lastActive || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>
            </div>

            <div className="wa-performance-page__col">
              <section className="card card-global">
                <div className="wa-performance-card__eyebrow">{copy.agentTableEyebrow}</div>
                <h2 className="wa-performance-card__title">{copy.agentTableTitle}</h2>
                <table className="wa-performance-list">
                  <thead>
                    <tr>
                      <th>{copy.columns.agent}</th>
                      <th>{copy.columns.total}</th>
                      <th>{copy.columns.noReply}</th>
                      <th>{copy.columns.withReply}</th>
                      <th>{copy.columns.userStarted}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.agentRows.map((row) => (
                      <tr key={row.agent}>
                        <td>{row.agent}</td>
                        <td>{row.total}</td>
                        <td>{row.agentNoReply}</td>
                        <td>{row.agentReply}</td>
                        <td>{row.userStarted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="card card-global">
                <div className="wa-performance-card__eyebrow">CSV</div>
                <h2 className="wa-performance-card__title">Data source</h2>
                <div className="wa-performance-card__subtitle">
                  {dashboard.sourcePath || CANDIDATE_PATHS[0]}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
