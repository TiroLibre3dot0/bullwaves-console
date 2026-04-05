import React, { useEffect, useMemo, useState } from 'react'
import { segmentJourneyTemplateExtrasById } from './segmentJourneyTemplateExtras'

function localeLabel(locale) {
  return locale === 'it' ? 'Italiano' : 'English'
}

export default function SegmentContentPreviewModal({ isOpen, onClose, template }) {
  const [tab, setTab] = useState('preview')
  const [locale, setLocale] = useState('it')
  const [variant, setVariant] = useState('a')
  const [channel, setChannel] = useState('email')
  const [copied, setCopied] = useState(false)
  const safeTemplate = template || null

  useEffect(() => {
    if (!isOpen) return
    setTab('preview')
    setChannel('email')
    setCopied(false)
  }, [isOpen, template?.id])

  const availableLocales = useMemo(() => {
    const locales = Object.keys(safeTemplate?.locales || {})
    if (!locales.length) return ['it', 'en']
    return locales.includes('it') ? locales : ['it', ...locales]
  }, [safeTemplate])

  const activeLocale = availableLocales.includes(locale) ? locale : availableLocales[0]
  const localizedRoot = safeTemplate?.locales?.[activeLocale] || null
  const extrasRoot =
    segmentJourneyTemplateExtrasById?.[safeTemplate?.id]?.locales?.[activeLocale] || null

  const availableVariants = useMemo(
    () => Object.keys(localizedRoot?.variants || {}),
    [localizedRoot]
  )

  const activeVariant = availableVariants.includes(variant) ? variant : availableVariants[0]
  const localized = localizedRoot?.variants?.[activeVariant] || localizedRoot
  const extraVariant = extrasRoot?.variants?.[activeVariant] || null
  const availableChannels = ['email', ...(extraVariant?.smsText ? ['sms'] : [])]
  const activeChannel = availableChannels.includes(channel) ? channel : availableChannels[0]
  const rawValue = activeChannel === 'sms' ? extraVariant?.smsText || '' : localized?.html || ''
  const timing = extraVariant?.timing || '—'
  const delay = extraVariant?.delay || '—'
  const subject = activeChannel === 'email' ? localized?.subject || '—' : '—'

  useEffect(() => {
    if (!availableLocales.includes(locale)) {
      setLocale(availableLocales[0] || 'it')
    }
  }, [availableLocales, locale])

  useEffect(() => {
    if (!availableVariants.length) return
    if (!availableVariants.includes(variant)) {
      setVariant(availableVariants[0])
    }
  }, [availableVariants, variant])

  useEffect(() => {
    if (!availableChannels.length) return
    if (!availableChannels.includes(channel)) {
      setChannel(availableChannels[0])
    }
  }, [availableChannels, channel])

  if (!isOpen || !safeTemplate) return null

  const doCopy = async () => {
    try {
      if (!rawValue) return
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawValue)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      }
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] max-h-[86vh] overflow-hidden">
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">
                {localized?.name || 'Template Preview'}
              </h2>
              <div className="text-blue-100 text-sm mt-2">Journey step content preview</div>
            </div>

            <button
              type="button"
              onClick={onClose}
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

        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {availableLocales.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setLocale(entry)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  activeLocale === entry
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {localeLabel(entry)}
              </button>
            ))}

            {availableVariants.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setVariant(entry)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  activeVariant === entry
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {String(entry || '').toUpperCase()}
              </button>
            ))}

            {availableChannels.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setChannel(entry)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  activeChannel === entry
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {entry.toUpperCase()}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                tab === 'preview'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
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
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {activeChannel === 'sms' ? 'Raw Text' : 'Raw HTML'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={doCopy}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
              disabled={!rawValue}
            >
              {copied ? 'Copied' : activeChannel === 'sms' ? 'Copy Text' : 'Copy HTML'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(86vh - 162px)' }}>
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 h-fit">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nome
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">{localized?.name || '—'}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descrizione
              </div>
              <div className="mt-1 text-sm text-slate-700 leading-6">
                {localized?.description || '—'}
              </div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subject
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{subject}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timing
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{timing}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Delay
              </div>
              <div className="mt-1 text-sm text-slate-700 leading-6">{delay}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Channel
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {activeChannel.toUpperCase()}
              </div>
            </div>

            <div>
              {tab === 'preview' ? (
                activeChannel === 'sms' ? (
                  <div className="w-full h-[620px] rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mx-auto max-w-[520px]">
                      <div className="inline-block rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-3 shadow-sm">
                        <div className="text-sm text-slate-800 whitespace-pre-wrap">
                          {rawValue || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    title="Segment content preview"
                    sandbox=""
                    srcDoc={rawValue}
                    className="w-full h-[620px] rounded-xl border border-slate-200 bg-white"
                  />
                )
              ) : (
                <pre className="w-full h-[620px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 whitespace-pre-wrap wrap-break-word">
                  {rawValue || '—'}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
