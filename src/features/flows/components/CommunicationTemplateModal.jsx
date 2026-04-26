import React, { useEffect, useMemo, useState } from 'react'

function channelLabel(channel) {
  const c = String(channel || '').toLowerCase()
  if (c === 'email') return 'Email'
  if (c === 'whatsapp') return 'WhatsApp'
  return channel || '—'
}

function channelBadgeClass(channel) {
  const c = String(channel || '').toLowerCase()
  if (c === 'email') return 'bg-blue-100 text-blue-700'
  if (c === 'whatsapp') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

export default function CommunicationTemplateModal({ isOpen, onClose, template }) {
  const [tab, setTab] = useState('preview')
  const [copied, setCopied] = useState(false)

  const channel = template?.channel || ''
  const rawValue = useMemo(() => {
    if (!template) return ''
    if (String(channel).toLowerCase() === 'email') return template?.content?.html || ''
    return template?.content?.text || ''
  }, [template, channel])

  useEffect(() => {
    if (!isOpen) return
    setTab('preview')
    setCopied(false)
  }, [isOpen])

  if (!isOpen || !template) return null

  const doCopy = async () => {
    try {
      if (!rawValue) return
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawValue)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
        return
      }
    } catch {
      // ignore
    }
  }

  const close = () => {
    if (typeof onClose === 'function') onClose()
  }

  const isEmail = String(channel).toLowerCase() === 'email'
  const isWhatsApp = String(channel).toLowerCase() === 'whatsapp'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold truncate">{template.title || 'Template'}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${channelBadgeClass(channel)}`}
                >
                  {channelLabel(channel)}
                </span>
              </div>
              <div className="text-blue-100 text-sm mt-1">
                <span className="font-semibold">Trigger:</span> {template.trigger || '—'}
              </div>
              {isEmail ? (
                <div className="text-blue-100 text-sm mt-1">
                  <span className="font-semibold">Subject:</span> {template.subject || '—'}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={close}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                tab === 'preview'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-slate-50'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setTab('raw')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                tab === 'raw'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-slate-50'
              }`}
            >
              Raw
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={doCopy}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-slate-50"
              disabled={!rawValue}
              title={!rawValue ? 'No content to copy' : 'Copy raw content'}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(80vh - 172px)' }}>
          {tab === 'preview' ? (
            <div className="space-y-3">
              {isEmail ? (
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={template?.content?.html || ''}
                  className="w-full h-[420px] rounded-lg border border-gray-200 bg-white"
                />
              ) : null}

              {isWhatsApp ? (
                <div className="w-full rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <div className="max-w-[520px]">
                    <div className="inline-block rounded-2xl rounded-tl-sm bg-white border border-gray-200 px-4 py-3 shadow-sm">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {template?.content?.text || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isEmail && !isWhatsApp ? (
                <div className="text-sm text-slate-600">No preview available for this channel.</div>
              ) : null}
            </div>
          ) : (
            <pre className="w-full rounded-lg border border-gray-200 bg-slate-50 p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
              {rawValue || '—'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
