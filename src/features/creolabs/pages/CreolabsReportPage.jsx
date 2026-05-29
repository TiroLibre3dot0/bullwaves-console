import { useEffect, useState } from 'react'

const DEFAULT_FROM = '2026-05-01'
const DEFAULT_TO = '2026-05-31'

const primaryButtonStyle = {
  appearance: 'none',
  border: '1px solid rgba(56,189,248,0.35)',
  background: 'linear-gradient(180deg, rgba(14,165,233,0.22), rgba(2,132,199,0.16))',
  color: '#e0f2fe',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(30,41,59,0.72)',
  color: '#e2e8f0',
}

export default function CreolabsReportPage() {
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)

  const [reportTemplates, setReportTemplates] = useState([])
  const [reportTemplatesError, setReportTemplatesError] = useState('')
  const [reportTemplateId, setReportTemplateId] = useState('')
  const [reportFormat, setReportFormat] = useState('xlsx')
  const [reportJob, setReportJob] = useState(null)
  const [reportJobBusy, setReportJobBusy] = useState(false)
  const [reportJobError, setReportJobError] = useState('')
  const [reportRawRequest, setReportRawRequest] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadReportTemplates = async () => {
      try {
        const res = await fetch('/api/qlik/creolabs/db-live-report-templates', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`db-live-report-templates failed (${res.status})`)

        const payload = await res.json()
        if (!payload?.ok)
          throw new Error(payload?.error || 'Invalid db-live-report-templates payload')

        if (cancelled) return
        const templates = Array.isArray(payload?.data?.templates) ? payload.data.templates : []
        setReportTemplates(templates)
        if (!reportTemplateId && templates.length) {
          setReportTemplateId(String(templates[0]?.id || ''))
        }
        setReportTemplatesError('')
      } catch (e) {
        if (cancelled) return
        setReportTemplates([])
        setReportTemplatesError(e?.message || 'Unable to load DB Live report templates')
      }
    }

    loadReportTemplates()
    return () => {
      cancelled = true
    }
  }, [reportTemplateId])

  const fetchReportJobStatus = async (jobId) => {
    const res = await fetch(`/api/qlik/creolabs/reports/jobs/${encodeURIComponent(jobId)}/status`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    const payload = await res.json()
    if (!res.ok) {
      throw new Error(payload?.error || `report status failed (${res.status})`)
    }
    if (!payload?.ok) throw new Error(payload?.error || 'Invalid report status payload')
    return payload?.data?.job || null
  }

  const runReportJob = async () => {
    setReportJobBusy(true)
    setReportJobError('')
    try {
      let manualRequest = null
      if (reportRawRequest.trim()) {
        try {
          manualRequest = JSON.parse(reportRawRequest)
        } catch {
          throw new Error('Raw request JSON is invalid')
        }
      }

      const res = await fetch('/api/qlik/creolabs/reports/jobs', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: reportTemplateId,
          format: reportFormat,
          from,
          to,
          request: manualRequest,
        }),
      })
      const payload = await res.json()
      if (!res.ok) {
        const details = String(payload?.details || '').trim()
        throw new Error(
          details
            ? `${payload?.error || `report job failed (${res.status})`} - ${details}`
            : payload?.error || `report job failed (${res.status})`
        )
      }
      if (!payload?.ok) throw new Error(payload?.error || 'Invalid report job payload')

      setReportJob(payload?.data?.job || null)
    } catch (e) {
      setReportJobError(e?.message || 'Unable to create report job')
    } finally {
      setReportJobBusy(false)
    }
  }

  useEffect(() => {
    const jobId = String(reportJob?.id || '').trim()
    const status = String(reportJob?.status || '').toLowerCase()
    if (!jobId) return
    if (status === 'completed' || status === 'failed') return

    let cancelled = false
    const timer = setInterval(async () => {
      try {
        const nextJob = await fetchReportJobStatus(jobId)
        if (cancelled || !nextJob) return
        setReportJob(nextJob)
      } catch (e) {
        if (!cancelled) {
          setReportJobError(e?.message || 'Unable to poll report job status')
        }
      }
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [reportJob?.id, reportJob?.status])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.24)',
          background: 'rgba(15,23,42,0.55)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Creolabs Report</h2>
        <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 13 }}>
          Sezione dedicata ai report Creolabs (template, job run, polling stato, output download).
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#cbd5e1' }}>
          From
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ borderRadius: 8, border: '1px solid #334155', padding: '8px 10px' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#cbd5e1' }}>
          To
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ borderRadius: 8, border: '1px solid #334155', padding: '8px 10px' }}
          />
        </label>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.24)',
          background: 'rgba(15,23,42,0.55)',
          padding: 12,
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 14 }}>
          Operational report templates
        </div>
        <div style={{ color: '#93c5fd', fontSize: 12 }}>
          Endpoint: /api/qlik/creolabs/db-live-report-templates
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#cbd5e1' }}>
            Template
            <select
              value={reportTemplateId}
              onChange={(e) => setReportTemplateId(e.target.value)}
              style={{
                borderRadius: 8,
                border: '1px solid #334155',
                padding: '8px 10px',
                background: '#0f172a',
                color: '#e2e8f0',
              }}
            >
              {!reportTemplates.length ? <option value="">No templates</option> : null}
              {reportTemplates.map((tpl) => (
                <option key={String(tpl?.id || '')} value={String(tpl?.id || '')}>
                  {String(tpl?.name || tpl?.id || 'Template')}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#cbd5e1' }}>
            Format
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(String(e.target.value || 'xlsx'))}
              style={{
                borderRadius: 8,
                border: '1px solid #334155',
                padding: '8px 10px',
                background: '#0f172a',
                color: '#e2e8f0',
              }}
            >
              <option value="xlsx">xlsx</option>
              <option value="pdf">pdf</option>
            </select>
          </label>
          <button
            type="button"
            onClick={runReportJob}
            disabled={reportJobBusy || !reportTemplateId}
            style={{ ...primaryButtonStyle, alignSelf: 'end' }}
          >
            {reportJobBusy ? 'Starting report...' : 'Run report job'}
          </button>
        </div>

        <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#cbd5e1' }}>
          Raw Qlik request JSON (optional override)
          <textarea
            value={reportRawRequest}
            onChange={(e) => setReportRawRequest(e.target.value)}
            placeholder='{"appId":"...","output":{"format":"xlsx"}}'
            rows={6}
            style={{
              borderRadius: 8,
              border: '1px solid #334155',
              padding: '8px 10px',
              background: '#0f172a',
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 12,
            }}
          />
        </label>

        {reportJobError ? (
          <div style={{ color: '#fecaca', fontSize: 12 }}>{reportJobError}</div>
        ) : null}

        {reportJob ? (
          <div
            style={{
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(30,41,59,0.55)',
              padding: 10,
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>
              Job {String(reportJob?.id || '-')}
            </div>
            <div style={{ color: '#93c5fd', fontSize: 12 }}>
              Status: {String(reportJob?.status || 'unknown')} | Format:{' '}
              {String(reportJob?.format || reportFormat)}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: 12 }}>
              Updated: {String(reportJob?.updatedAt || '-')}
            </div>
            {reportJob?.downloadUrl ? (
              <a
                href={String(reportJob.downloadUrl)}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#67e8f9', fontSize: 12, fontWeight: 700 }}
              >
                Open output download URL
              </a>
            ) : null}
          </div>
        ) : null}

        {reportTemplatesError ? (
          <div style={{ color: '#fecaca', fontSize: 12 }}>{reportTemplatesError}</div>
        ) : null}

        {!reportTemplatesError && !reportTemplates.length ? (
          <div style={{ color: '#94a3b8', fontSize: 12 }}>No templates available.</div>
        ) : null}

        {reportTemplates.map((tpl, index) => (
          <div
            key={String(tpl?.id || `template-${index}`)}
            style={{
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(30,41,59,0.55)',
              padding: 10,
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>
              {String(tpl?.name || 'Unnamed template')}
            </div>
            <div style={{ color: '#93c5fd', fontSize: 12 }}>
              Cadence: {String(tpl?.cadence || 'n/a')} | Output:{' '}
              {Array.isArray(tpl?.output) ? tpl.output.join(', ') : 'n/a'}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: 12 }}>{String(tpl?.objective || '')}</div>
          </div>
        ))}
      </div>

      <div style={{ color: '#93c5fd', fontSize: 12 }}>
        DB Live resta dedicata ai dati, ingestione, status ed export database.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a
          href="/creolabs/db-live"
          style={{
            ...secondaryButtonStyle,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Open DB Live
        </a>
      </div>
    </div>
  )
}
