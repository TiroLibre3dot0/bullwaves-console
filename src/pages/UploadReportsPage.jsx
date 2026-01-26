import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { track } from '../utils/analytics'

export default function UploadReportsPage() {
  const { t } = useI18n()

  const [file, setFile] = useState(null)
  const [reportType, setReportType] = useState('payments')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [serverProgress, setServerProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [resultText, setResultText] = useState('')
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
          savedAt: Date.now(),
        })
      )
    } catch {
      // ignore
    }
  }, [reportType, uploadProgress, serverProgress, status, resultText])

  useEffect(() => {
    track('page_view', { page: 'UploadReports', access: 'console' })
  }, [])

  const sizeLabel = useMemo(() => {
    if (!file) return ''
    const mb = file.size / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }, [file])

  const formatResult = (data) => {
    if (!data) return ''
    const lines = []
    const typeLabel = data.type || reportType
    lines.push(t('upload.result.ok'))
    lines.push(`${t('upload.result.type')}: ${typeLabel}`)
    if (data.dest) lines.push(`${t('upload.result.updated')}: ${data.dest}`)
    if (data.rawBackup) lines.push(`${t('upload.result.rawBackup')}: ${data.rawBackup}`)
    if (data.sanitizer) lines.push(`${t('upload.result.sanitizer')}: ${data.sanitizer}`)

    const s = data.summary
    if (
      s &&
      (typeof s.existing === 'number' ||
        typeof s.added === 'number' ||
        typeof s.duplicates === 'number')
    ) {
      lines.push('')
      lines.push(`${t('upload.result.summary')}:`)
      if (typeof s.existing === 'number')
        lines.push(`- ${t('upload.result.summary.existing')}: ${s.existing}`)
      if (typeof s.added === 'number')
        lines.push(`- ${t('upload.result.summary.added')}: ${s.added}`)
      if (typeof s.duplicates === 'number')
        lines.push(`- ${t('upload.result.summary.duplicates')}: ${s.duplicates}`)
      if (typeof s.affiliateUpdates === 'number')
        lines.push(`- ${t('upload.result.summary.affiliateUpdates')}: ${s.affiliateUpdates}`)
      if (typeof s.fieldUpdates === 'number')
        lines.push(`- ${t('upload.result.summary.fieldUpdates')}: ${s.fieldUpdates}`)
    }

    // Append a short stdout tail for troubleshooting (kept compact)
    const out = String(data.stdout || '').trim()
    if (out) {
      const outLines = out.split(/\r?\n/).filter(Boolean)
      const tail = outLines.slice(-20).join('\n')
      lines.push('')
      lines.push(`${t('upload.result.lastLogs')}:`)
      lines.push(tail)
    }

    const err = String(data.stderr || '').trim()
    if (err) {
      lines.push('')
      lines.push(`${t('upload.result.warningsErrors')}:`)
      lines.push(err)
    }

    return lines.join('\n')
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!file || isUploading) return

    setIsUploading(true)
    setUploadProgress(0)
    setServerProgress(0)
    setResultText('')
    setStatus(`${t('upload.status.uploadingPrefix')}: 0% (0 / ${sizeLabel})`)

    const fd = new FormData()
    fd.append('type', reportType)
    // Keep backward compatibility: current upload server infers the sanitizer from the uploaded filename.
    // Override filename so the selected type is always respected even if the user's file is named differently.
    const lower = String(file && file.name ? file.name : '').toLowerCase()
    const ext = lower.endsWith('.xlsx') ? '.xlsx' : lower.endsWith('.xls') ? '.xls' : '.csv'
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
          } else if (msg.type === 'result') {
            sawTerminalMessage = true
            setResultText(formatResult(msg.data || msg))
          } else if (msg.type === 'error') {
            sawTerminalMessage = true
            setResultText(JSON.stringify(msg, null, 2))
          }
        } catch (e) {
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
          if (msg.type === 'result') setResultText(formatResult(msg.data || msg))
          else setResultText(JSON.stringify(msg, null, 2))
        } catch (e) {
          // If server didn't stream JSON (or something went wrong), show raw response
          setResultText(xhr.responseText || '')
        }
      } else if (!sawTerminalMessage) {
        setResultText(xhr.responseText || '')
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
              accept=".csv,.xlsx,.xls"
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
        <h3 style={{ marginBottom: 8 }}>{t('upload.response.title')}</h3>
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
          {resultText || t('upload.emptyDash')}
        </pre>
      </div>
    </div>
  )
}
