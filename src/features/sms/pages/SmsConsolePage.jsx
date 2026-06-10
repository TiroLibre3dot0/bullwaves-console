import { useCallback, useEffect, useMemo, useState } from 'react'

const panel = {
  border: '1px solid rgba(148, 163, 184, 0.28)',
  borderRadius: 18,
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  boxShadow: '0 16px 40px rgba(2, 6, 23, 0.08)',
}

const input = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  lineHeight: 1.4,
  outline: 'none',
}

const primaryButton = {
  border: '1px solid rgba(37, 99, 235, 0.3)',
  background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
  color: '#fff',
  borderRadius: 12,
  padding: '9px 14px',
  fontWeight: 700,
  cursor: 'pointer',
}

const softButton = {
  border: '1px solid rgba(51, 65, 85, 0.18)',
  background: '#fff',
  color: '#0f172a',
  borderRadius: 10,
  padding: '7px 12px',
  fontWeight: 600,
  cursor: 'pointer',
}

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value || '')
  }
}

function statusLabel(row) {
  const txt = String(row?.statusText || '')
    .trim()
    .toLowerCase()
  if (txt) return txt
  const n = Number(row?.statusCode)
  if (!Number.isFinite(n)) return 'unknown'
  if (n === 0) return 'queued'
  if (n === 1) return 'processing'
  if (n === 2) return 'delivered'
  if (n === 3) return 'failed'
  if (n === 4) return 'rejected'
  return `status-${n}`
}

function statusTone(value) {
  const v = String(value || '').toLowerCase()
  if (v === 'delivered') return { fg: '#166534', bg: '#dcfce7', bd: '#86efac' }
  if (v === 'queued' || v === 'processing' || v === 'submitted') {
    return { fg: '#92400e', bg: '#fef3c7', bd: '#fcd34d' }
  }
  if (v === 'failed' || v === 'rejected') return { fg: '#991b1b', bg: '#fee2e2', bd: '#fca5a5' }
  return { fg: '#334155', bg: '#e2e8f0', bd: '#cbd5e1' }
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

function shortId(value) {
  const text = String(value || '').trim()
  if (!text) return '-'
  if (text.length <= 18) return text
  return `${text.slice(0, 8)}...${text.slice(-6)}`
}

export default function SmsConsolePage() {
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError] = useState('')

  const [sendForm, setSendForm] = useState({
    phoneNumber: '',
    sender: 'Bullwaves',
    message: 'Hello from Bullwaves SMS Console.',
  })
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResult, setSendResult] = useState(null)

  const [statusId, setStatusId] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [statusResult, setStatusResult] = useState(null)

  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyItems, setHistoryItems] = useState([])
  const [historyUpdatedAt, setHistoryUpdatedAt] = useState(null)
  const [refreshingHistory, setRefreshingHistory] = useState(false)

  const [activityLog, setActivityLog] = useState([])

  const appendLog = useCallback((entry) => {
    setActivityLog((prev) => [{ at: new Date().toISOString(), ...entry }, ...prev].slice(0, 24))
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const response = await fetch('/api/sms/history?limit=100', { method: 'GET' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || `History request failed (${response.status})`)
      }
      const items = Array.isArray(payload?.items) ? payload.items : []
      setHistoryItems(items)
      setHistoryUpdatedAt(payload?.updatedAt || null)
    } catch (error) {
      setHistoryError(error?.message || 'History request failed')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const refreshHistoryStatuses = useCallback(async () => {
    setRefreshingHistory(true)
    setHistoryError('')
    try {
      const response = await fetch('/api/sms/history/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max: 40 }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || `Refresh failed (${response.status})`)
      }
      setHistoryItems(Array.isArray(payload?.items) ? payload.items : [])
      setHistoryUpdatedAt(payload?.updatedAt || null)
      appendLog({
        type: 'history-refresh',
        ok: true,
        details: `Refreshed ${payload?.refreshed || 0} messages`,
      })
    } catch (error) {
      const msg = error?.message || 'Refresh failed'
      setHistoryError(msg)
      appendLog({ type: 'history-refresh', ok: false, details: msg })
    } finally {
      setRefreshingHistory(false)
    }
  }, [appendLog])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadHistory()
    }, 30000)
    return () => window.clearInterval(timer)
  }, [loadHistory])

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true)
    setHealthError('')
    try {
      const response = await fetch('/api/sms/health', { method: 'GET' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || `Health check failed (${response.status})`)
      }
      setHealth(payload)
      appendLog({ type: 'health', ok: true, details: 'Health check completed' })
    } catch (error) {
      const msg = error?.message || 'Health check failed'
      setHealthError(msg)
      appendLog({ type: 'health', ok: false, details: msg })
    } finally {
      setHealthLoading(false)
    }
  }, [appendLog])

  const sendTestSms = useCallback(async () => {
    const payload = {
      phoneNumber: String(sendForm.phoneNumber || '').trim(),
      sender: String(sendForm.sender || '').trim(),
      message: String(sendForm.message || '').trim(),
    }

    if (!payload.phoneNumber || !payload.message) {
      setSendError('phoneNumber e message sono obbligatori')
      return
    }

    setSendLoading(true)
    setSendError('')
    try {
      const response = await fetch('/api/sms/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body?.error || `Send failed (${response.status})`)
      }

      setSendResult(body)
      const sentId = String(body?.providerMessageId || body?.response || '').trim()
      if (sentId) setStatusId(sentId)

      appendLog({
        type: 'send',
        ok: true,
        details: `SMS accepted by provider for ${payload.phoneNumber} (delivery pending)`,
      })
      loadHistory()
    } catch (error) {
      const msg = error?.message || 'SMS send failed'
      setSendError(msg)
      appendLog({ type: 'send', ok: false, details: msg })
    } finally {
      setSendLoading(false)
    }
  }, [appendLog, loadHistory, sendForm.message, sendForm.phoneNumber, sendForm.sender])

  const fetchStatus = useCallback(async () => {
    const id = String(statusId || '').trim()
    if (!id) {
      setStatusError('Message id is required')
      return
    }

    setStatusLoading(true)
    setStatusError('')
    try {
      const response = await fetch(`/api/sms/status/${encodeURIComponent(id)}`, { method: 'GET' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body?.error || `Status lookup failed (${response.status})`)
      }
      setStatusResult(body)
      appendLog({ type: 'status', ok: true, details: `Status loaded for ${id}` })
      loadHistory()
    } catch (error) {
      const msg = error?.message || 'Status lookup failed'
      setStatusError(msg)
      appendLog({ type: 'status', ok: false, details: msg })
    } finally {
      setStatusLoading(false)
    }
  }, [appendLog, loadHistory, statusId])

  const latestMessageId = useMemo(() => {
    const raw = String(sendResult?.providerMessageId || sendResult?.response || '').trim()
    return raw || '-'
  }, [sendResult])

  return (
    <div style={{ padding: '20px 22px 28px', color: '#0f172a' }}>
      <div
        style={{
          ...panel,
          padding: '18px 18px 16px',
          marginBottom: 14,
          background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 36%, #f8fafc 100%)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#1e3a8a',
            fontWeight: 800,
          }}
        >
          Sales / Messaging
        </div>
        <h1
          style={{ margin: '8px 0 4px', fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          SMS Console
        </h1>
        <p style={{ margin: 0, color: '#334155', fontSize: 14 }}>
          Pannello moderno per Dynamic Messaging: invio test, monitor stato e storico persistente.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        <section style={{ ...panel, padding: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17 }}>Provider Health</h2>
            <button
              type="button"
              style={primaryButton}
              onClick={runHealthCheck}
              disabled={healthLoading}
            >
              {healthLoading ? 'Checking...' : 'Run check'}
            </button>
          </div>

          {healthError ? (
            <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 600 }}>{healthError}</div>
          ) : null}

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
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
                  fontSize: 12,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Configured
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
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
                  fontSize: 12,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                API base
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{health?.apiBaseUrl || '-'}</div>
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
                  fontSize: 12,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Token preview
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{health?.tokenPreview || '-'}</div>
            </div>
          </div>
        </section>

        <section style={{ ...panel, padding: 16 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Send Test SMS</h2>

          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155' }}>
            Recipient phone number
            <input
              style={{ ...input, marginTop: 5 }}
              placeholder="+393000000000"
              value={sendForm.phoneNumber}
              onChange={(e) => setSendForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155' }}>
            Sender
            <input
              style={{ ...input, marginTop: 5 }}
              value={sendForm.sender}
              onChange={(e) => setSendForm((prev) => ({ ...prev, sender: e.target.value }))}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155' }}>
            Message
            <textarea
              style={{ ...input, marginTop: 5, minHeight: 94, resize: 'vertical' }}
              value={sendForm.message}
              onChange={(e) => setSendForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={primaryButton}
              onClick={sendTestSms}
              disabled={sendLoading}
            >
              {sendLoading ? 'Sending...' : 'Send test SMS'}
            </button>
            <span style={{ fontSize: 12, color: '#475569' }}>
              Last message id: <strong>{latestMessageId}</strong>
            </span>
          </div>

          {sendError ? (
            <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 600 }}>{sendError}</div>
          ) : null}
          {sendResult ? (
            <div
              style={{
                marginTop: 10,
                border: '1px solid #bfdbfe',
                borderRadius: 12,
                background: 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)',
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13, color: '#1e3a8a' }}>
                  Accepted by provider
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#1e3a8a',
                    border: '1px solid #93c5fd',
                    borderRadius: 999,
                    padding: '2px 8px',
                    background: '#dbeafe',
                  }}
                >
                  Dynamic Messaging
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #dbeafe',
                    borderRadius: 10,
                    padding: '7px 8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Recipient
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{sendForm.phoneNumber || '-'}</div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #dbeafe',
                    borderRadius: 10,
                    padding: '7px 8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Sender
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{sendForm.sender || '-'}</div>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: '#334155' }}>
                Message id:{' '}
                <strong title={String(sendResult?.providerMessageId || sendResult?.response || '')}>
                  {shortId(sendResult?.providerMessageId || sendResult?.response)}
                </strong>
              </div>

              <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
                This confirms API acceptance only. Final delivery is shown in status/history.
              </div>

              <details style={{ marginTop: 8 }}>
                <summary
                  style={{ cursor: 'pointer', color: '#1d4ed8', fontSize: 12, fontWeight: 700 }}
                >
                  Show technical response
                </summary>
                <pre
                  style={{
                    marginTop: 8,
                    background: '#0b1220',
                    color: '#d6e5ff',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.45,
                    maxHeight: 170,
                    overflow: 'auto',
                  }}
                >
                  {prettyJson(sendResult)}
                </pre>
              </details>
            </div>
          ) : null}
        </section>

        <section style={{ ...panel, padding: 16 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>Lookup Status</h2>

          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#334155' }}>
            Message id
            <input
              style={{ ...input, marginTop: 5 }}
              placeholder="UUID returned by send-test"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
            />
          </label>

          <button
            type="button"
            style={primaryButton}
            onClick={fetchStatus}
            disabled={statusLoading}
          >
            {statusLoading ? 'Loading...' : 'Load status'}
          </button>

          {statusError ? (
            <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 600 }}>{statusError}</div>
          ) : null}
          {statusResult ? (
            <div
              style={{
                marginTop: 10,
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#f8fafc',
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Current status
              </div>
              <div style={{ marginTop: 5 }}>
                {(() => {
                  const label = statusLabel(statusResult)
                  const tone = statusTone(label)
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        border: `1px solid ${tone.bd}`,
                        background: tone.bg,
                        color: tone.fg,
                        fontWeight: 700,
                        fontSize: 12,
                        padding: '3px 10px',
                      }}
                    >
                      {label}
                    </span>
                  )
                })()}
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: '#334155' }}>
                Message id: <strong title={statusId}>{shortId(statusId)}</strong>
              </div>

              <details style={{ marginTop: 8 }}>
                <summary
                  style={{ cursor: 'pointer', color: '#1d4ed8', fontSize: 12, fontWeight: 700 }}
                >
                  Show technical details
                </summary>
                <pre
                  style={{
                    marginTop: 8,
                    background: '#0b1220',
                    color: '#d6e5ff',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.45,
                    maxHeight: 220,
                    overflow: 'auto',
                  }}
                >
                  {prettyJson(statusResult)}
                </pre>
              </details>
            </div>
          ) : null}
        </section>

        <section style={{ ...panel, padding: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17 }}>Session Activity</h2>
            <span style={{ fontSize: 12, color: '#64748b' }}>{activityLog.length} events</span>
          </div>
          {!activityLog.length ? (
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>No activity yet.</div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 8,
                marginTop: 8,
                maxHeight: 250,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {activityLog.map((item, idx) => (
                <div
                  key={`${item.at}-${idx}`}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '8px 10px',
                    background: item.ok ? '#f8fffb' : '#fff7f7',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#64748b' }}>{formatDate(item.at)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                    {String(item.type || '').toUpperCase()} {item.ok ? 'OK' : 'FAILED'}
                  </div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{item.details}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section style={{ ...panel, marginTop: 16, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Persisted History
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 18 }}>Sent Messages and Status</h2>
            <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
              Last update: {historyUpdatedAt ? formatDate(historyUpdatedAt) : '-'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={softButton}
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading ? 'Loading...' : 'Reload'}
            </button>
            <button
              type="button"
              style={primaryButton}
              onClick={refreshHistoryStatuses}
              disabled={refreshingHistory}
            >
              {refreshingHistory ? 'Refreshing...' : 'Refresh statuses'}
            </button>
          </div>
        </div>

        {historyError ? (
          <div style={{ padding: '10px 16px', color: '#b91c1c', fontWeight: 600 }}>
            {historyError}
          </div>
        ) : null}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr
                style={{
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Sent at
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Phone
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Sender
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Message
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  Message id
                </th>
              </tr>
            </thead>
            <tbody>
              {!historyItems.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: '#64748b' }}>
                    No messages in history yet.
                  </td>
                </tr>
              ) : (
                historyItems.map((row) => {
                  const label = statusLabel(row)
                  const tone = statusTone(label)
                  const text = String(row?.message || '')
                  return (
                    <tr key={String(row?.providerMessageId || row?.requestId || Math.random())}>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(row?.submittedAt)}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row?.phoneNumber || '-'}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          maxWidth: 380,
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#334155',
                          }}
                          title={text || '-'}
                        >
                          {text || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: 999,
                            border: `1px solid ${tone.bd}`,
                            background: tone.bg,
                            color: tone.fg,
                            fontWeight: 700,
                            fontSize: 12,
                            padding: '3px 9px',
                          }}
                        >
                          {label}
                        </span>
                        {row?.error ? (
                          <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                            {row.error}
                          </div>
                        ) : null}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          fontSize: 12,
                          color: '#334155',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setStatusId(String(row?.providerMessageId || ''))}
                          style={{
                            ...softButton,
                            fontSize: 12,
                            padding: '5px 8px',
                            marginRight: 8,
                          }}
                        >
                          Use
                        </button>
                        <span>{row?.providerMessageId || '-'}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
