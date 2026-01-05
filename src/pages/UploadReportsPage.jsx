import React, { useEffect, useMemo, useState } from 'react'

export default function UploadReportsPage() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem('bw_upload_state_v1', JSON.stringify({
        reportType,
        uploadProgress,
        serverProgress,
        status,
        resultText,
        savedAt: Date.now(),
      }))
    } catch {
      // ignore
    }
  }, [reportType, uploadProgress, serverProgress, status, resultText])

  const sizeLabel = useMemo(() => {
    if (!file) return ''
    const mb = file.size / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }, [file])

  const formatResult = (data) => {
    if (!data) return ''
    const lines = []
    const typeLabel = data.type || reportType
    lines.push('OK')
    lines.push(`Type: ${typeLabel}`)
    if (data.dest) lines.push(`Updated: ${data.dest}`)
    if (data.rawBackup) lines.push(`Raw backup: ${data.rawBackup}`)
    if (data.sanitizer) lines.push(`Sanitizer: ${data.sanitizer}`)

    const s = data.summary
    if (s && (typeof s.existing === 'number' || typeof s.added === 'number' || typeof s.duplicates === 'number')) {
      lines.push('')
      lines.push('Summary:')
      if (typeof s.existing === 'number') lines.push(`- Existing: ${s.existing}`)
      if (typeof s.added === 'number') lines.push(`- Added: ${s.added}`)
      if (typeof s.duplicates === 'number') lines.push(`- Duplicates: ${s.duplicates}`)
      if (typeof s.affiliateUpdates === 'number') lines.push(`- Affiliate updates: ${s.affiliateUpdates}`)
      if (typeof s.fieldUpdates === 'number') lines.push(`- Field updates: ${s.fieldUpdates}`)
    }

    // Append a short stdout tail for troubleshooting (kept compact)
    const out = String(data.stdout || '').trim()
    if (out) {
      const outLines = out.split(/\r?\n/).filter(Boolean)
      const tail = outLines.slice(-20).join('\n')
      lines.push('')
      lines.push('Last logs:')
      lines.push(tail)
    }

    const err = String(data.stderr || '').trim()
    if (err) {
      lines.push('')
      lines.push('Warnings/Errors:')
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
    setStatus(`Uploading: 0% (0 / ${sizeLabel})`)

    const fd = new FormData()
    fd.append('type', reportType)
    // Keep backward compatibility: current upload server infers the sanitizer from the uploaded filename.
    // Override filename so the selected type is always respected even if the user's file is named differently.
    const forcedName = reportType === 'registrations'
      ? 'Registrations Report.csv'
      : (reportType === 'media' ? 'Media Report.csv' : 'Payments Report.csv')
    fd.append('file', file, forcedName)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload-stream', true)

    // Stream parsing state
    let lastLen = 0
    let pending = ''
    let sawTerminalMessage = false

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) {
        setStatus('Uploading…')
        return
      }
      const pct = (ev.loaded / ev.total) * 100
      setUploadProgress(pct)
      const loadedMB = (ev.loaded / (1024 * 1024)).toFixed(1)
      const totalMB = (ev.total / (1024 * 1024)).toFixed(1)
      setStatus(`Uploading: ${pct.toFixed(1)}% (${loadedMB} / ${totalMB} MB)`)
    }

    xhr.upload.onload = () => {
      setUploadProgress(100)
      setStatus('Processing on server…')
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
            if (typeof msg.pct === 'number') setServerProgress(msg.pct)
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
      setStatus(ok ? 'Done.' : `Failed (HTTP ${xhr.status}).`)

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
      setStatus('Upload failed (network error).')
    }

    xhr.send(fd)
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 12px' }}>
      <div className="card card-global" style={{ marginBottom: 12 }}>
        <h2 style={{ marginBottom: 6 }}>Upload reports</h2>
        <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.35 }}>
          Upload a CSV and the system will sanitize it and update the reports.
          <div style={{ marginTop: 6 }}>
            Choose the report type explicitly to avoid relying on the file name.
          </div>
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
              <option value="registrations">Registrations</option>
              <option value="payments">Payments</option>
              <option value="media">Media</option>
            </select>
            <input
              type="file"
              accept=".csv"
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
              style={{ opacity: (!file || isUploading) ? 0.6 : 1 }}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>

          {file && (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>
              Selected: <span style={{ color: 'var(--text)' }}>{file.name}</span> ({sizeLabel})
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{status}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>Upload {Math.round(uploadProgress)}% • Server {Math.round(serverProgress)}%</div>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, uploadProgress))}%`, background: 'rgba(34, 211, 238, 0.75)' }} />
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, serverProgress))}%`, background: 'rgba(34, 211, 238, 0.75)' }} />
            </div>
          </div>
        </form>
      </div>

      <div className="card card-global">
        <h3 style={{ marginBottom: 8 }}>Response</h3>
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 12,
          minHeight: 90,
        }}>
          {resultText || '—'}
        </pre>
      </div>
    </div>
  )
}
