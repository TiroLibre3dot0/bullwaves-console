import React, { useEffect, useMemo, useState } from 'react'
import { segmentJourneyTemplateExtrasById } from './segmentJourneyTemplateExtras'
import { isRecentlyUpdatedSegmentTemplate } from './segmentJourneyTemplates'
import {
  EMAIL_ICON_GROUP_LABELS,
  getEmailJourneyIconMetaByKey,
  getEmailJourneyIconsForGroup,
} from './emailJourneyIconRegistry.js'

const EXCLUDED_TEMPLATE_PLACEHOLDERS = new Set(['account_manager_name'])
const HANDLEBARS_CONTROL_KEYWORDS = new Set(['if', 'else'])

function extractTemplateLinks(html) {
  if (!html) return []

  const matches = html.matchAll(/href="([^"]+)"/g)
  const links = []
  const seen = new Set()

  for (const match of matches) {
    const href = String(match?.[1] || '').trim()
    if (!href || seen.has(href)) continue
    seen.add(href)
    links.push(href)
  }

  return links
}

function extractTemplatePlaceholders(...sources) {
  const found = new Set()

  for (const source of sources) {
    const value = String(source || '')
    if (!value) continue

    const matches = value.matchAll(/{{{?([^{}]+)}?}}/g)
    for (const match of matches) {
      const expression = String(match?.[1] || '').trim()
      if (!expression) continue

      const normalized = expression.replace(/^#/, '').replace(/^\//, '').trim()
      const parts = normalized.split(/\s+/).filter(Boolean)
      if (!parts.length) continue

      let candidate = ''
      if (parts[0] === 'if') {
        candidate = parts[1] || ''
      } else if (!HANDLEBARS_CONTROL_KEYWORDS.has(parts[0])) {
        candidate = parts[0]
      }

      if (!candidate) continue
      if (HANDLEBARS_CONTROL_KEYWORDS.has(candidate)) continue
      if (EXCLUDED_TEMPLATE_PLACEHOLDERS.has(candidate)) continue

      found.add(candidate)
    }
  }

  return Array.from(found)
}

function localeLabel(locale) {
  return locale === 'it' ? 'Italiano' : 'English'
}

function IconGuideCard({ title, meta }) {
  if (!meta) return null

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">{title}</div>
      <div className="mt-2 flex items-start gap-3">
        <img
          src={meta.url}
          alt={meta.label}
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-300 bg-slate-100 p-1.5"
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-800">{meta.label}</div>
          <div className="mt-1 text-xs font-semibold text-blue-700">{meta.category}</div>
          <div className="mt-1 text-xs leading-5 text-gray-600">{meta.usage}</div>
        </div>
      </div>
    </div>
  )
}

function NewBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-cyan-300/70 bg-cyan-200/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 animate-pulse">
      (new)
    </span>
  )
}

export default function SegmentContentPreviewModal({ isOpen, onClose, template }) {
  const [tab, setTab] = useState('preview')
  const [locale, setLocale] = useState('it')
  const [variant, setVariant] = useState('a')
  const [channel, setChannel] = useState('email')
  const [copied, setCopied] = useState(false)
  const safeTemplate = template || null
  const templateIsRecent = isRecentlyUpdatedSegmentTemplate(safeTemplate?.id)

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
  const templateLinks = useMemo(
    () => (activeChannel === 'email' ? extractTemplateLinks(rawValue) : []),
    [activeChannel, rawValue]
  )
  const templatePlaceholders = useMemo(
    () => (activeChannel === 'email' ? extractTemplatePlaceholders(subject, rawValue) : []),
    [activeChannel, subject, rawValue]
  )
  const iconGuide = localized?.iconGuide || null
  const currentIconCards = useMemo(() => {
    if (!iconGuide) return []

    return [
      { title: 'Box 1', meta: getEmailJourneyIconMetaByKey(iconGuide.boxOneKey) },
      { title: 'Box 2', meta: getEmailJourneyIconMetaByKey(iconGuide.boxTwoKey) },
      { title: 'Box 3', meta: getEmailJourneyIconMetaByKey(iconGuide.boxThreeKey) },
    ].filter((entry) => entry.meta)
  }, [iconGuide])
  const recommendedGroups = useMemo(() => {
    if (!iconGuide?.recommendedGroups?.length) return []

    return iconGuide.recommendedGroups
      .map((groupKey) => ({
        key: groupKey,
        label: EMAIL_ICON_GROUP_LABELS[groupKey] || groupKey,
        icons: getEmailJourneyIconsForGroup(groupKey),
      }))
      .filter((entry) => entry.icons.length)
  }, [iconGuide])

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
              <div className="mt-2 flex items-center gap-2 text-blue-100 text-sm">
                <span>Journey step content preview</span>
                {templateIsRecent ? <NewBadge /> : null}
              </div>
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
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-white text-gray-600 border-slate-300 hover:bg-slate-50'
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
                    : 'bg-white text-gray-600 border-slate-300 hover:bg-slate-50'
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
                    : 'bg-white text-gray-600 border-slate-300 hover:bg-slate-50'
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
                  : 'bg-white text-gray-600 border-slate-300 hover:bg-slate-50'
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
                  : 'bg-white text-gray-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {activeChannel === 'sms' ? 'Raw Text' : 'Raw HTML'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={doCopy}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 text-gray-600 hover:bg-slate-50"
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
            <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 h-fit">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Nome
              </div>
              <div className="mt-1 text-sm font-bold text-gray-800">{localized?.name || '—'}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Descrizione
              </div>
              <div className="mt-1 text-sm text-gray-600 leading-6">
                {localized?.description || '—'}
              </div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Subject
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-800">{subject}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Timing
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-800">{timing}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Delay
              </div>
              <div className="mt-1 text-sm text-gray-600 leading-6">{delay}</div>

              <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Channel
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-800">
                {activeChannel.toUpperCase()}
              </div>

              {activeChannel === 'email' ? (
                <>
                  {currentIconCards.length ? (
                    <>
                      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <span className="inline-flex items-center gap-2">
                          <span>Icone attive</span>
                          {templateIsRecent ? <NewBadge /> : null}
                        </span>
                      </div>
                      <div className="mt-2 space-y-3">
                        {currentIconCards.map((entry) => (
                          <IconGuideCard key={entry.title} title={entry.title} meta={entry.meta} />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {recommendedGroups.length ? (
                    <>
                      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <span className="inline-flex items-center gap-2">
                          <span>Selezione guidata</span>
                          {templateIsRecent ? <NewBadge /> : null}
                        </span>
                      </div>
                      {iconGuide?.rationale ? (
                        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
                          {iconGuide.rationale}
                        </div>
                      ) : null}
                      <div className="mt-3 space-y-3">
                        {recommendedGroups.map((group) => (
                          <div
                            key={group.key}
                            className="rounded-xl border border-slate-300 bg-white p-3"
                          >
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                              {group.label}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.icons.map((icon) => (
                                <div
                                  key={icon.key}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-gray-700"
                                >
                                  <img
                                    src={icon.url}
                                    alt={icon.label}
                                    className="h-5 w-5 shrink-0"
                                  />
                                  <span>{icon.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Placeholders
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {templatePlaceholders.length ? (
                      templatePlaceholders.map((entry) => (
                        <span
                          key={entry}
                          className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 border border-slate-300"
                        >
                          {entry}
                        </span>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">—</div>
                    )}
                  </div>

                  <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Links
                  </div>
                  <div className="mt-2 space-y-2">
                    {templateLinks.length ? (
                      templateLinks.map((entry) => (
                        <a
                          key={entry}
                          href={entry.startsWith('{{') ? undefined : entry}
                          target={entry.startsWith('{{') ? undefined : '_blank'}
                          rel={entry.startsWith('{{') ? undefined : 'noreferrer'}
                          className="block rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-gray-700 break-all"
                        >
                          {entry}
                        </a>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">—</div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div>
              {tab === 'preview' ? (
                activeChannel === 'sms' ? (
                  <div className="w-full h-[620px] rounded-xl border border-slate-300 bg-slate-100 p-6">
                    <div className="mx-auto max-w-[520px]">
                      <div className="inline-block rounded-2xl rounded-tl-sm bg-white border border-slate-300 px-4 py-3 shadow-sm">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
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
                <pre className="w-full h-[620px] overflow-auto rounded-xl border border-slate-300 bg-slate-100 p-3 text-xs font-mono text-gray-800 whitespace-pre-wrap wrap-break-word">
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
