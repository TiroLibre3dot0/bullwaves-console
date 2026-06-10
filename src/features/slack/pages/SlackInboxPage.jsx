import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'

const panel = {
  border: '1px solid rgba(148, 163, 184, 0.28)',
  borderRadius: 18,
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  boxShadow: '0 16px 40px rgba(2, 6, 23, 0.08)',
}

const input = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '8px 10px',
  fontSize: 13,
  lineHeight: 1.4,
  outline: 'none',
}

const primaryButton = {
  border: '1px solid rgba(3, 105, 161, 0.3)',
  background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
  color: '#fff',
  borderRadius: 10,
  padding: '8px 12px',
  fontWeight: 700,
  cursor: 'pointer',
}

const softButton = {
  border: '1px solid rgba(51, 65, 85, 0.18)',
  background: '#fff',
  color: '#0f172a',
  borderRadius: 10,
  padding: '7px 11px',
  fontWeight: 600,
  cursor: 'pointer',
}

function formatDate(value) {
  const ts = Date.parse(String(value || ''))
  if (!Number.isFinite(ts)) return '-'
  return new Date(ts).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function trimText(value, max = 240) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max - 3)}...`
}

function toneForPriority(value) {
  const p = String(value || '').toLowerCase()
  if (p === 'high') return { fg: '#991b1b', bg: '#fee2e2', bd: '#fca5a5' }
  if (p === 'medium') return { fg: '#92400e', bg: '#fef3c7', bd: '#fcd34d' }
  return { fg: '#1e3a8a', bg: '#dbeafe', bd: '#93c5fd' }
}

function toneForStatus(value) {
  const s = String(value || 'open').toLowerCase()
  if (s === 'done') return { fg: '#166534', bg: '#dcfce7', bd: '#86efac' }
  return { fg: '#7c2d12', bg: '#ffedd5', bd: '#fdba74' }
}

export default function SlackInboxPage() {
  const { user } = useAuth()

  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState('')
  const [healthLoading, setHealthLoading] = useState(false)

  const [channels, setChannels] = useState([])
  const [selectedChannels, setSelectedChannels] = useState([])
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [channelsError, setChannelsError] = useState('')

  const [inbox, setInbox] = useState([])
  const [summary, setSummary] = useState(null)
  const [inboxUpdatedAt, setInboxUpdatedAt] = useState(null)
  const [inboxSyncedAt, setInboxSyncedAt] = useState(null)
  const [inboxLoading, setInboxLoading] = useState(false)
  const [inboxError, setInboxError] = useState('')

  const [refreshLoading, setRefreshLoading] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const [statusFilter, setStatusFilter] = useState('open')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [searchFilter, setSearchFilter] = useState('')

  const [inlineOwnerById, setInlineOwnerById] = useState({})
  const [inlineNoteById, setInlineNoteById] = useState({})

  const viewerEmail = String(user?.email || '')
    .trim()
    .toLowerCase()

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true)
    setHealthError('')
    try {
      const response = await fetch('/api/slack/health')
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || `Health failed (${response.status})`)
      setHealth(payload)
    } catch (error) {
      setHealthError(error?.message || 'Health failed')
    } finally {
      setHealthLoading(false)
    }
  }, [])

  const fetchChannels = useCallback(async () => {
    setChannelsLoading(true)
    setChannelsError('')
    try {
      const response = await fetch('/api/slack/channels', {
        headers: {
          'x-bullwaves-user-email': viewerEmail,
        },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || `Channels failed (${response.status})`)

      const nextChannels = Array.isArray(payload?.channels) ? payload.channels : []
      setChannels(nextChannels)
      setSelectedChannels((prev) => {
        if (prev.length) return prev
        return nextChannels.slice(0, 8).map((c) => c.id)
      })
    } catch (error) {
      setChannelsError(error?.message || 'Channels failed')
    } finally {
      setChannelsLoading(false)
    }
  }, [viewerEmail])

  const fetchInbox = useCallback(async () => {
    setInboxLoading(true)
    setInboxError('')
    try {
      const params = new window.URLSearchParams()
      params.set('limit', '300')
      if (statusFilter) params.set('status', statusFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      if (channelFilter && channelFilter !== 'all') params.set('channelId', channelFilter)
      if (searchFilter.trim()) params.set('search', searchFilter.trim())

      const response = await fetch(`/api/slack/inbox?${params.toString()}`)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || `Inbox failed (${response.status})`)

      setInbox(Array.isArray(payload?.items) ? payload.items : [])
      setSummary(payload?.summary || null)
      setInboxUpdatedAt(payload?.updatedAt || null)
      setInboxSyncedAt(payload?.syncedAt || null)

      const channelCatalog = Array.isArray(payload?.channels) ? payload.channels : []
      if (channelCatalog.length) {
        setChannels(channelCatalog)
      }
    } catch (error) {
      setInboxError(error?.message || 'Inbox failed')
    } finally {
      setInboxLoading(false)
    }
  }, [channelFilter, priorityFilter, searchFilter, statusFilter])

  const refreshInbox = useCallback(async () => {
    setRefreshLoading(true)
    setRefreshError('')
    try {
      const response = await fetch('/api/slack/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bullwaves-user-email': viewerEmail,
        },
        body: JSON.stringify({
          channelIds: selectedChannels,
          perChannelLimit: 60,
          includeBots: false,
          viewerEmail,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || `Refresh failed (${response.status})`)
      await fetchInbox()
      await fetchHealth()
    } catch (error) {
      setRefreshError(error?.message || 'Refresh failed')
    } finally {
      setRefreshLoading(false)
    }
  }, [fetchHealth, fetchInbox, selectedChannels, viewerEmail])

  const updateItemStatus = useCallback(
    async (item, status) => {
      const owner = String(inlineOwnerById[item.id] ?? item.owner ?? '').trim()
      const note = String(inlineNoteById[item.id] ?? item.note ?? '').trim()

      const response = await fetch('/api/slack/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bullwaves-user-email': viewerEmail,
        },
        body: JSON.stringify({
          itemId: item.id,
          status,
          owner,
          note,
          viewerEmail,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || `Update failed (${response.status})`)
      }

      setInbox((prev) =>
        prev.map((row) => (row.id === item.id ? payload?.item || { ...row, status } : row))
      )
      if (payload?.summary) setSummary(payload.summary)
    },
    [inlineNoteById, inlineOwnerById, viewerEmail]
  )

  useEffect(() => {
    fetchHealth()
    fetchChannels()
  }, [fetchChannels, fetchHealth])

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  const channelMap = useMemo(() => {
    const map = new Map()
    channels.forEach((c) => map.set(c.id, c))
    return map
  }, [channels])

  const selectedCount = selectedChannels.length

  return (
    <div style={{ padding: '20px 22px 28px', color: '#0f172a' }}>
      <div
        style={{
          ...panel,
          padding: '18px 18px 16px',
          marginBottom: 14,
          background: 'radial-gradient(circle at top left, #e0f2fe 0%, #f0f9ff 35%, #f8fafc 100%)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#075985',
            fontWeight: 800,
          }}
        >
          Sales / Collaboration
        </div>
        <h1
          style={{ margin: '8px 0 4px', fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          Slack Inbox Console
        </h1>
        <p style={{ margin: 0, color: '#334155', fontSize: 14 }}>
          Vista centralizzata dei canali Slack con triage operativo: priorita, ownership e stato
          gestito.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        }}
      >
        <section style={{ ...panel, padding: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Slack Health</h2>
            <button
              type="button"
              style={primaryButton}
              onClick={fetchHealth}
              disabled={healthLoading}
            >
              {healthLoading ? 'Checking...' : 'Check'}
            </button>
          </div>

          {healthError ? (
            <div style={{ marginTop: 8, color: '#b91c1c', fontWeight: 600 }}>{healthError}</div>
          ) : null}

          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Configured
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {health?.configured ? 'Yes' : 'No'}
              </div>
            </div>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Last sync
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {formatDate(health?.lastSyncAt || inboxSyncedAt)}
              </div>
            </div>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Inbox items
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {summary?.total ?? health?.inboxCount ?? 0}
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...panel, padding: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Channel Selection</h2>
            <button
              type="button"
              style={softButton}
              onClick={fetchChannels}
              disabled={channelsLoading}
            >
              {channelsLoading ? 'Loading...' : 'Reload'}
            </button>
          </div>

          {channelsError ? (
            <div style={{ marginTop: 8, color: '#b91c1c', fontWeight: 600 }}>{channelsError}</div>
          ) : null}

          <div
            style={{
              marginTop: 10,
              maxHeight: 220,
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 8,
            }}
          >
            {channels.length ? (
              channels.map((ch) => {
                const checked = selectedChannels.includes(ch.id)
                return (
                  <label
                    key={ch.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        setSelectedChannels((prev) => {
                          if (isChecked) return Array.from(new Set([...prev, ch.id]))
                          return prev.filter((id) => id !== ch.id)
                        })
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>#{ch.name || ch.id}</span>
                    {ch.isPrivate ? (
                      <span style={{ fontSize: 11, color: '#64748b' }}>(private)</span>
                    ) : null}
                  </label>
                )
              })
            ) : (
              <div style={{ color: '#475569', fontSize: 13 }}>No channels loaded.</div>
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              style={primaryButton}
              onClick={refreshInbox}
              disabled={refreshLoading || selectedCount === 0}
            >
              {refreshLoading ? 'Refreshing...' : 'Refresh Inbox'}
            </button>
            <span style={{ fontSize: 12, color: '#334155' }}>
              {selectedCount} channels selected
            </span>
          </div>

          {refreshError ? (
            <div style={{ marginTop: 8, color: '#b91c1c', fontWeight: 600 }}>{refreshError}</div>
          ) : null}
        </section>
      </div>

      <section style={{ ...panel, padding: 14, marginTop: 14 }}>
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <label style={{ fontSize: 12, color: '#334155' }}>
            Status
            <select
              style={{ ...input, marginTop: 4 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label style={{ fontSize: 12, color: '#334155' }}>
            Priority
            <select
              style={{ ...input, marginTop: 4 }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label style={{ fontSize: 12, color: '#334155' }}>
            Channel
            <select
              style={{ ...input, marginTop: 4 }}
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="all">All</option>
              {Array.from(channelMap.values()).map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.name || ch.id}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 12, color: '#334155' }}>
            Search
            <input
              style={{ ...input, marginTop: 4 }}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="keyword"
            />
          </label>
        </div>

        <div
          style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
        >
          <button type="button" style={softButton} onClick={fetchInbox} disabled={inboxLoading}>
            {inboxLoading ? 'Loading...' : 'Apply filters'}
          </button>
          <span style={{ fontSize: 12, color: '#334155' }}>
            Updated: {formatDate(inboxUpdatedAt)} | Synced: {formatDate(inboxSyncedAt)}
          </span>
        </div>

        {summary ? (
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            }}
          >
            <div
              style={{
                padding: 8,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
              <div style={{ fontWeight: 800 }}>{summary.total}</div>
            </div>
            <div
              style={{
                padding: 8,
                border: '1px solid #fed7aa',
                borderRadius: 10,
                background: '#fff7ed',
              }}
            >
              <div style={{ fontSize: 11, color: '#9a3412' }}>Open</div>
              <div style={{ fontWeight: 800 }}>{summary.open}</div>
            </div>
            <div
              style={{
                padding: 8,
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                background: '#f0fdf4',
              }}
            >
              <div style={{ fontSize: 11, color: '#166534' }}>Done</div>
              <div style={{ fontWeight: 800 }}>{summary.done}</div>
            </div>
            <div
              style={{
                padding: 8,
                border: '1px solid #fecaca',
                borderRadius: 10,
                background: '#fef2f2',
              }}
            >
              <div style={{ fontSize: 11, color: '#991b1b' }}>High</div>
              <div style={{ fontWeight: 800 }}>{summary.high}</div>
            </div>
          </div>
        ) : null}

        {inboxError ? (
          <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 600 }}>{inboxError}</div>
        ) : null}

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {inbox.length ? (
            inbox.map((item) => {
              const pt = toneForPriority(item.priority)
              const st = toneForStatus(item.status)

              return (
                <article
                  key={item.id}
                  style={{
                    border: '1px solid #dbeafe',
                    borderRadius: 12,
                    padding: 12,
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13, color: '#0f172a' }}>
                      #{item.channelName || item.channelId}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: pt.fg,
                        background: pt.bg,
                        border: `1px solid ${pt.bd}`,
                        borderRadius: 999,
                        padding: '2px 8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.priority}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: st.fg,
                        background: st.bg,
                        border: `1px solid ${st.bd}`,
                        borderRadius: 999,
                        padding: '2px 8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.status || 'open'}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{ margin: '8px 0 0', color: '#1e293b', lineHeight: 1.45, fontSize: 13 }}
                  >
                    {trimText(item.text || '(empty message)', 420)}
                  </p>

                  <div
                    style={{
                      marginTop: 8,
                      display: 'grid',
                      gap: 8,
                      gridTemplateColumns: '1fr 1.6fr auto auto',
                    }}
                  >
                    <input
                      style={input}
                      placeholder="Owner"
                      value={inlineOwnerById[item.id] ?? item.owner ?? ''}
                      onChange={(e) =>
                        setInlineOwnerById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                    <input
                      style={input}
                      placeholder="Note"
                      value={inlineNoteById[item.id] ?? item.note ?? ''}
                      onChange={(e) =>
                        setInlineNoteById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      style={softButton}
                      onClick={() => updateItemStatus(item, 'open')}
                    >
                      Reopen
                    </button>
                    <button
                      type="button"
                      style={primaryButton}
                      onClick={() => updateItemStatus(item, 'done')}
                    >
                      Mark done
                    </button>
                  </div>
                </article>
              )
            })
          ) : (
            <div style={{ color: '#475569', fontSize: 13 }}>No messages for current filters.</div>
          )}
        </div>
      </section>
    </div>
  )
}
