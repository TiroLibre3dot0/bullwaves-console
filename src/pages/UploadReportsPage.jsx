import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { track } from '../utils/analytics'

export default function UploadReportsPage() {
  const { t } = useI18n()

  const [file, setFile] = useState(null)
  const [reportType, setReportType] = useState('payments')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [serverProgress, setServerProgress] = useState(0)
  const [status, setStatus] = useState('Ready to upload.')
  const [resultText, setResultText] = useState('')
  const [resultData, setResultData] = useState(null)
  const [errorData, setErrorData] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // Expose upload state globally so the app can guard navigation.
  useEffect(() => {
    window.__bwUploadInProgress = Boolean(isUploading)
    const onBeforeUnload = (e) => {
      if (!window.__bwUploadInProgress) return
      e.preventDefault()
      // Chrome requires returnValue to be set.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.__bwUploadInProgress = false
    }
  }, [isUploading])

  // Persist last result so accidental refresh/HMR doesn't lose the outcome.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bw_upload_state_v1')
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved && typeof saved === 'object') {
        if (typeof saved.reportType === 'string') setReportType(saved.reportType)
        if (typeof saved.uploadProgress === 'number') setUploadProgress(saved.uploadProgress)
        if (typeof saved.serverProgress === 'number') setServerProgress(saved.serverProgress)
        if (typeof saved.status === 'string') setStatus(saved.status)
        if (typeof saved.resultText === 'string') setResultText(saved.resultText)
        if (saved.resultData) setResultData(saved.resultData)
        if (saved.errorData) setErrorData(saved.errorData)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'bw_upload_state_v1',
        JSON.stringify({
          reportType,
          uploadProgress,
          serverProgress,
          status,
          resultText,
          resultData,
          errorData,
          savedAt: Date.now(),
        })
      )
    } catch {
      // ignore
    }
  }, [reportType, uploadProgress, serverProgress, status, resultText, resultData, errorData])

  useEffect(() => {
    track('page_view', { page: 'UploadReports', access: 'console' })
  }, [])

  const sizeLabel = useMemo(() => {
    if (!file) return ''
    const mb = file.size / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }, [file])

  const publicUrlFromAnyPath = (value) => {
    const s = String(value || '').trim()
    if (!s) return null
    const norm = s.replace(/\\/g, '/')
    const idx = norm.toLowerCase().lastIndexOf('/public/')
    if (idx >= 0) {
      const sub = norm.slice(idx + '/public'.length)
      return sub.startsWith('/') ? sub : `/${sub}`
    }
    const starts =
      norm.toLowerCase().startsWith('public/') || norm.toLowerCase().startsWith('public\\')
    if (starts) {
      const sub = norm.slice('public'.length).replace(/\\/g, '/')
      return sub.startsWith('/') ? sub : `/${sub}`
    }
    return null
  }

  const responseLogHref = useMemo(() => {
    const fromSuccess =
      resultData && resultData.logFile ? publicUrlFromAnyPath(resultData.logFile) : null
    if (fromSuccess) return fromSuccess
    const errData = errorData && (errorData.data || errorData)
    const fromError = errData && errData.logFile ? publicUrlFromAnyPath(errData.logFile) : null
    return fromError || null
  }, [resultData, errorData])

  const renderKv = (label, value, { href } = {}) => {
    const v = String(value || '').trim()
    return (
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          minWidth: 0,
        }}
      >
        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>{label}</div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text)', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {v || t('upload.emptyDash')}
          </a>
        ) : (
          <div style={{ color: 'var(--text)', fontSize: 13, wordBreak: 'break-word' }}>
            {v || t('upload.emptyDash')}
          </div>
        )}
      </div>
    )
  }

  const renderMetric = (label, value) => (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  )

  const renderResultCard = () => {
    const data = resultData
    if (!data) return null

    const typeLabel = data.type || reportType
    const destUrl = publicUrlFromAnyPath(data.dest)
    const rawUrl = publicUrlFromAnyPath(data.rawBackup)
    const logUrl = publicUrlFromAnyPath(data.logFile)

    const summary = data.summary || {}
    const hasAnySummary =
      typeof summary.existing === 'number' ||
      typeof summary.added === 'number' ||
      typeof summary.duplicates === 'number' ||
      typeof summary.updated === 'number' ||
      typeof summary.affiliateUpdates === 'number' ||
      typeof summary.fieldUpdates === 'number'

    const converted = data.normalized && data.normalized.converted
    const stdoutText = String(data.stdout || '').trim()
    const stderrText = String(data.stderr || '').trim()

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 12,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(34, 211, 238, 0.10)',
              color: 'var(--text)',
              fontWeight: 600,
            }}
          >
            {t('upload.result.ok')}
          </div>
          {data.logsTruncated ? (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {t('upload.result.logsSaved')}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {t('upload.result.verboseMode')}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {renderKv(t('upload.result.type'), typeLabel)}
          {data.dest ? renderKv(t('upload.result.updated'), data.dest, { href: destUrl }) : null}
          {data.rawBackup
            ? renderKv(t('upload.result.rawBackup'), data.rawBackup, { href: rawUrl })
            : null}
          {data.logFile
            ? renderKv(t('upload.result.logFile'), data.logFile, { href: logUrl })
            : null}
          {data.sanitizer ? renderKv(t('upload.result.sanitizer'), data.sanitizer) : null}
          {renderKv(
            t('upload.result.converted'),
            converted ? t('upload.result.yes') : t('upload.result.no')
          )}
          {converted && data.normalized && data.normalized.from
            ? renderKv(t('upload.result.convertedFrom'), data.normalized.from)
            : null}
          {converted && data.normalized && data.normalized.sheetName
            ? renderKv(t('upload.result.convertedSheet'), data.normalized.sheetName)
            : null}
        </div>

        {hasAnySummary ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>
              {t('upload.result.summary')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              {typeof summary.existing === 'number'
                ? renderMetric(t('upload.result.summary.existing'), summary.existing)
                : null}
              {typeof summary.added === 'number'
                ? renderMetric(t('upload.result.summary.added'), summary.added)
                : null}
              {typeof summary.updated === 'number'
                ? renderMetric(t('upload.result.summary.updated'), summary.updated)
                : null}
              {typeof summary.duplicates === 'number'
                ? renderMetric(t('upload.result.summary.duplicates'), summary.duplicates)
                : null}
              {typeof summary.affiliateUpdates === 'number'
                ? renderMetric(
                    t('upload.result.summary.affiliateUpdates'),
                    summary.affiliateUpdates
                  )
                : null}
              {typeof summary.fieldUpdates === 'number'
                ? renderMetric(t('upload.result.summary.fieldUpdates'), summary.fieldUpdates)
                : null}
            </div>
          </div>
        ) : null}

        {data.postProcessing ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>
              {t('upload.result.postProcessing')}
            </div>
            <div
              style={{
                padding: 10,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {t('upload.result.status')}
                </div>
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>
                  {data.postProcessing.ok ? t('upload.result.ok') : t('upload.result.failed')}
                </div>
              </div>
              {Array.isArray(data.postProcessing.results) && data.postProcessing.results.length ? (
                <details>
                  <summary style={{ cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}>
                    {t('upload.result.postProcessingDetails')}
                  </summary>
                  <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                    {data.postProcessing.results.map((r) => (
                      <div
                        key={r.script}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>
                          {r.script}
                        </div>
                        {r.stdoutPreview ? (
                          <pre
                            style={{
                              margin: '6px 0 0',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: 12,
                              color: 'var(--muted)',
                            }}
                          >
                            {String(r.stdoutPreview).trim()}
                          </pre>
                        ) : null}
                        {r.stderrPreview ? (
                          <pre
                            style={{
                              margin: '6px 0 0',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: 12,
                            }}
                          >
                            {String(r.stderrPreview).trim()}
                          </pre>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
              {!data.postProcessing.ok && data.postProcessing.error ? (
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
                  {String(data.postProcessing.error)}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {stdoutText || stderrText ? (
          <div style={{ marginTop: 12 }}>
            <details>
              <summary
                style={{ cursor: 'pointer', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}
              >
                {t('upload.result.logs')}
              </summary>
              {stdoutText ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
                    {t('upload.result.lastLogs')}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {stdoutText}
                  </pre>
                </div>
              ) : null}
              {stderrText ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
                    {t('upload.result.warningsErrors')}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {stderrText}
                  </pre>
                </div>
              ) : null}
            </details>
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>
              {t('upload.result.rawJson')}
            </summary>
            <pre
              style={{
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  const renderErrorCard = () => {
    const err = errorData
    if (!err) return null

    const title = err.message || err.error || t('upload.status.failed')
    const code = err.code
    const data = err.data || err
    const logUrl = publicUrlFromAnyPath(data.logFile)
    const rawUrl = publicUrlFromAnyPath(data.rawBackup)
    const stdoutText = String(data.stdout || '').trim()
    const stderrText = String(data.stderr || '').trim()

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 12,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--text)',
              fontWeight: 600,
            }}
          >
            {t('upload.status.failed')}
          </div>
          <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{String(title)}</div>
          {code ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>({code})</div> : null}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {data.type ? renderKv(t('upload.result.type'), data.type) : null}
          {data.sanitizer ? renderKv(t('upload.result.sanitizer'), data.sanitizer) : null}
          {data.rawBackup
            ? renderKv(t('upload.result.rawBackup'), data.rawBackup, { href: rawUrl })
            : null}
          {data.logFile
            ? renderKv(t('upload.result.logFile'), data.logFile, { href: logUrl })
            : null}
        </div>

        {stdoutText || stderrText ? (
          <div style={{ marginTop: 12 }}>
            <details open>
              <summary
                style={{ cursor: 'pointer', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}
              >
                {t('upload.result.logs')}
              </summary>
              {stdoutText ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
                    {t('upload.result.lastLogs')}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {stdoutText}
                  </pre>
                </div>
              ) : null}
              {stderrText ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
                    {t('upload.result.warningsErrors')}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {stderrText}
                  </pre>
                </div>
              ) : null}
            </details>
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>
              {t('upload.result.rawJson')}
            </summary>
            <pre
              style={{
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              {JSON.stringify(err, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!file || isUploading) return

    setIsUploading(true)
    setUploadProgress(0)
    setServerProgress(0)
    setResultText('')
    setResultData(null)
    setErrorData(null)
    setStatus(`${t('upload.status.uploadingPrefix')}: 0% (0 / ${sizeLabel})`)

    const fd = new FormData()
    fd.append('type', reportType)
    // Keep backward compatibility: current upload server infers the sanitizer from the uploaded filename.
    // Override filename so the selected type is always respected even if the user's file is named differently.
    const lower = String(file && file.name ? file.name : '').toLowerCase()
    const ext = lower.endsWith('.xlsx') ? '.xlsx' : '.csv'
    const forcedBase =
      reportType === 'registrations'
        ? 'Registrations Report'
        : reportType === 'media'
          ? 'Media Report'
          : reportType === 'comments'
            ? 'Comments Report'
            : 'Payments Report'
    const forcedName = `${forcedBase}${ext}`
    fd.append('file', file, forcedName)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload-stream', true)

    // Stream parsing state
    let lastLen = 0
    let pending = ''
    let sawTerminalMessage = false

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) {
        setStatus(t('upload.status.uploadingShort'))
        return
      }
      const pct = (ev.loaded / ev.total) * 100
      setUploadProgress(pct)
      const loadedMB = (ev.loaded / (1024 * 1024)).toFixed(1)
      const totalMB = (ev.total / (1024 * 1024)).toFixed(1)
      setStatus(
        `${t('upload.status.uploadingPrefix')}: ${pct.toFixed(1)}% (${loadedMB} / ${totalMB} MB)`
      )
    }

    xhr.upload.onload = () => {
      setUploadProgress(100)
      setStatus(t('upload.status.processingOnServer'))
    }

    xhr.onprogress = () => {
      // Parse incremental NDJSON lines from server
      const text = xhr.responseText || ''
      const chunk = text.slice(lastLen)
      lastLen = text.length
      if (!chunk) return
      pending += chunk
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() || ''

      for (const line of lines) {
        const s = String(line || '').trim()
        if (!s) continue
        try {
          const msg = JSON.parse(s)
          if (msg.type === 'progress') {
            if (typeof msg.pct === 'number') {
              const pct = Math.max(0, Math.min(100, msg.pct))
              setServerProgress(pct)
            }
            if (msg.message) setStatus(msg.message)
          } else if (msg.type === 'warning') {
            sawTerminalMessage = true
            if (msg.message) setStatus(`Warning: ${msg.message}`)
            const details = String(msg.details || '').trim()
            setResultText((prev) => {
              const base = String(prev || '').trim()
              const nextLine = details
                ? `WARNING: ${msg.message} (${details})`
                : `WARNING: ${msg.message}`
              return base ? `${base}\n${nextLine}` : nextLine
            })
          } else if (msg.type === 'result') {
            sawTerminalMessage = true
            setResultData(msg.data || msg)
            setResultText('')
          } else if (msg.type === 'error') {
            sawTerminalMessage = true
            setErrorData(msg)
            setResultText('')
          }
        } catch {
          // ignore malformed partial lines
        }
      }
    }

    xhr.onload = () => {
      setIsUploading(false)
      const ok = xhr.status >= 200 && xhr.status < 300
      // Ensure last buffered line is parsed
      const tail = (pending || '').trim()
      if (tail) {
        try {
          const msg = JSON.parse(tail)
          sawTerminalMessage = true
          if (msg.type === 'result') {
            setResultData(msg.data || msg)
            setErrorData(null)
            setResultText('')
          } else if (msg.type === 'error') {
            setErrorData(msg)
            setResultData(null)
            setResultText('')
          } else {
            setResultText(JSON.stringify(msg, null, 2))
          }
        } catch {
          // If server didn't stream JSON (or something went wrong), show raw response
          setResultText(xhr.responseText || '')
        }
      } else if (!sawTerminalMessage) {
        const raw = String(xhr.responseText || '').trim()
        if (raw) {
          setResultText(raw)
        } else if (ok) {
          setResultText('Upload completed, but the server returned an empty response body.')
        } else {
          setResultText('No response body received from server.')
        }
      }
      setStatus(ok ? t('upload.status.done') : `${t('upload.status.failed')} (HTTP ${xhr.status}).`)

      if (ok) {
        try {
          const v = String(Date.now())
          localStorage.setItem('bw_reports_version', v)
        } catch {
          // ignore
        }
        try {
          window.dispatchEvent(new Event('bw-reports-updated'))
        } catch {
          // ignore
        }
      }
    }

    xhr.onerror = () => {
      setIsUploading(false)
      setStatus(t('upload.status.networkError'))
    }

    xhr.send(fd)
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 12px' }}>
      <div className="card card-global" style={{ marginBottom: 12 }}>
        <h2 style={{ marginBottom: 6 }}>{t('upload.title')}</h2>
        <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.35 }}>
          {t('upload.description.line1')}
          <div style={{ marginTop: 6 }}>{t('upload.description.line2')}</div>
        </div>
      </div>

      <div className="card card-global" style={{ marginBottom: 12 }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <select
              className="upload-select"
              value={reportType}
              disabled={isUploading}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                minWidth: 220,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'var(--text)',
                padding: 10,
                borderRadius: 10,
                colorScheme: 'dark',
              }}
            >
              <option value="registrations">{t('upload.type.registrations')}</option>
              <option value="payments">{t('upload.type.payments')}</option>
              <option value="media">{t('upload.type.media')}</option>
              <option value="comments">{t('upload.type.comments')}</option>
            </select>
            <input
              type="file"
              accept=".csv,.xlsx"
              disabled={isUploading}
              onChange={(e) => setFile((e.target.files && e.target.files[0]) || null)}
              style={{
                flex: 1,
                minWidth: 280,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'var(--text)',
                padding: 10,
                borderRadius: 10,
              }}
            />
            <button
              type="submit"
              className="tab"
              disabled={!file || isUploading}
              style={{ opacity: !file || isUploading ? 0.6 : 1 }}
            >
              {isUploading ? t('upload.button.uploading') : t('upload.button.upload')}
            </button>
          </div>

          {file && (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              {t('upload.label.selected')}:{' '}
              <span style={{ color: 'var(--text)' }}>{file.name}</span> ({sizeLabel})
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{status}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                {t('upload.progress.upload')} {Math.round(uploadProgress)}% •{' '}
                {t('upload.progress.server')} {Math.round(serverProgress)}%
              </div>
            </div>
            <div
              style={{
                height: 10,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, uploadProgress))}%`,
                  background: 'rgba(34, 211, 238, 0.75)',
                }}
              />
            </div>
            <div
              style={{
                height: 8,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 999,
                overflow: 'hidden',
                marginTop: 8,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, serverProgress))}%`,
                  background: 'rgba(34, 211, 238, 0.75)',
                }}
              />
            </div>
          </div>
        </form>
      </div>

      <div className="card card-global">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>{t('upload.response.title')}</h3>
          {responseLogHref ? (
            <a
              href={responseLogHref}
              target="_blank"
              rel="noreferrer"
              className="tab"
              style={{ textDecoration: 'none' }}
            >
              {t('upload.response.openLog')}
            </a>
          ) : null}
        </div>
        {renderErrorCard()}
        {renderResultCard()}
        {!errorData && !resultData ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 12,
              minHeight: 90,
            }}
          >
            {resultText || 'No response yet. Upload a file to see details.'}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
