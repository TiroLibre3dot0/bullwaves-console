import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'

const UI_TEXT = {
  en: {
    hubBadge: 'Customer.io Workspace Hub',
    heroTitle: 'Catalog, Segments and Journeys',
    heroSubtitle: 'Quick selection on the left with immediate center preview.',
    refresh: 'Refresh templates',
    refreshing: 'Refreshing...',
    templatesStat: 'Templates',
    liveSyncedStat: 'Live synced',
    plannedModulesStat: 'Planned modules',
    workspaceStat: 'Workspace',
    loadCatalogError: 'Unable to load template catalog',
    workspaceNavigator: 'Workspace Navigator',
    templatesTab: 'Templates',
    segmentsTab: 'Segments',
    journeysTab: 'Journeys',
    templateList: 'Template List',
    segmentList: 'Segment List',
    journeyList: 'Journey List',
    live: 'Live',
    draft: 'Draft',
    planned: 'Planned',
    cioId: 'CIO ID',
    templatePreview: 'Template Preview',
    segmentPreview: 'Segment Preview',
    journeyPreview: 'Journey Preview',
    editor: 'Editor',
    subject: 'Subject',
    preheader: 'Preheader',
    localBody: 'Local body',
    empty: 'empty',
    chars: 'chars',
    noTemplateSelected: 'Select a template to preview.',
    plannedRules: 'Planned Rules',
    plannedSteps: 'Planned Steps',
    noBodyAvailable: 'No body available',
    searchTemplates: 'Search templates',
    noResults: 'No templates match your filter.',
    sourceLabel: 'Source',
    updatedAt: 'Updated',
    linksUsed: 'Links used',
    noLinks: 'No links in template',
    hoverToPreview: 'Hover an icon to preview URL',
  },
  it: {
    hubBadge: 'Hub Workspace Customer.io',
    heroTitle: 'Catalogo, Segmenti e Journey',
    heroSubtitle: 'Selezione rapida a sinistra con anteprima centrale immediata.',
    refresh: 'Aggiorna template',
    refreshing: 'Aggiornamento...',
    templatesStat: 'Template',
    liveSyncedStat: 'Sincronizzati live',
    plannedModulesStat: 'Moduli pianificati',
    workspaceStat: 'Workspace',
    loadCatalogError: 'Impossibile caricare il catalogo template',
    workspaceNavigator: 'Navigatore Workspace',
    templatesTab: 'Template',
    segmentsTab: 'Segmenti',
    journeysTab: 'Journey',
    templateList: 'Lista Template',
    segmentList: 'Lista Segmenti',
    journeyList: 'Lista Journey',
    live: 'Attivo',
    draft: 'Bozza',
    planned: 'Pianificato',
    cioId: 'ID CIO',
    templatePreview: 'Anteprima Template',
    segmentPreview: 'Anteprima Segmento',
    journeyPreview: 'Anteprima Journey',
    editor: 'Editor',
    subject: 'Oggetto',
    preheader: 'Preheader',
    localBody: 'Corpo locale',
    empty: 'vuoto',
    chars: 'caratteri',
    noTemplateSelected: 'Seleziona un template per vedere l anteprima.',
    plannedRules: 'Regole Previste',
    plannedSteps: 'Step Previsti',
    noBodyAvailable: 'Nessun contenuto disponibile',
    searchTemplates: 'Cerca template',
    noResults: 'Nessun template corrisponde al filtro.',
    sourceLabel: 'Sorgente',
    updatedAt: 'Aggiornato',
    linksUsed: 'Link usati',
    noLinks: 'Nessun link nel template',
    hoverToPreview: 'Passa sopra un icona per vedere URL',
  },
}

function extractTemplateLinks(bodyHtml) {
  const input = String(bodyHtml || '')
  if (!input.trim()) return []

  const links = []
  const seen = new Set()
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi
  let match

  while ((match = hrefRegex.exec(input)) !== null) {
    const raw = String(match[1] || '').trim()
    if (!raw) continue
    if (raw.toLowerCase().startsWith('javascript:')) continue
    if (seen.has(raw)) continue
    seen.add(raw)
    links.push(raw)
  }

  return links
}

const SEGMENT_BLUEPRINTS = [
  {
    key: 'seg_onboarding_new_signups',
    label: 'seg_onboarding_new_signups',
    summary: {
      en: 'New signups to activate with progressive onboarding.',
      it: 'Nuovi iscritti da attivare con onboarding progressivo.',
    },
    status: 'planned',
    rules: [
      {
        en: 'Event signup_completed in the last 7 days',
        it: 'Evento signup_completed negli ultimi 7 giorni',
      },
      {
        en: 'No deposit_completed',
        it: 'Nessun deposit_completed',
      },
      {
        en: 'Acquisition channel is populated',
        it: 'Canale acquisizione valorizzato',
      },
    ],
  },
  {
    key: 'seg_funded_no_trade',
    label: 'seg_funded_no_trade',
    summary: {
      en: 'Funded clients without first trade yet.',
      it: 'Clienti con deposito ma senza primo trade.',
    },
    status: 'planned',
    rules: [
      {
        en: 'Event deposit_completed exists',
        it: 'Evento deposit_completed presente',
      },
      {
        en: 'No first_trade_completed',
        it: 'Nessun first_trade_completed',
      },
      {
        en: 'Last login within 14 days',
        it: 'Ultimo login entro 14 giorni',
      },
    ],
  },
]

const JOURNEY_BLUEPRINTS = [
  {
    key: 'journey_onboarding_core',
    label: 'journey_onboarding_core',
    summary: {
      en: 'Onboarding flow from signup to first funding.',
      it: 'Percorso onboarding da signup a primo funding.',
    },
    status: 'planned',
    stages: [
      {
        en: 'Trigger signup_completed',
        it: 'Trigger signup_completed',
      },
      {
        en: 'KYC reminder if not completed',
        it: 'Reminder KYC se non completato',
      },
      {
        en: 'Deposit push using tx_deposit_confirmed template',
        it: 'Push deposit con template tx_deposit_confirmed',
      },
    ],
  },
  {
    key: 'journey_funded_activation',
    label: 'journey_funded_activation',
    summary: {
      en: 'Funded trader activation with operational nurturing.',
      it: 'Attivazione trader funded con nurturing operativo.',
    },
    status: 'planned',
    stages: [
      {
        en: 'Trigger deposit_completed',
        it: 'Trigger deposit_completed',
      },
      {
        en: 'Trading education follow-up',
        it: 'Follow-up education trading',
      },
      {
        en: 'Exit on first_trade_completed',
        it: 'Exit su first_trade_completed',
      },
    ],
  },
]

async function callJson(url, options) {
  const resp = await fetch(url, options)
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new Error(String(data?.error || `Request failed (${resp.status})`))
  }
  return data
}

export default function CustomerIoConsolePage() {
  const { locale } = useI18n()
  const uiLocale = locale === 'it' ? 'it' : 'en'
  const text = UI_TEXT[uiLocale]

  const [catalog, setCatalog] = useState(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [selectedCatalogTemplate, setSelectedCatalogTemplate] = useState('')
  const [selectedSegmentKey, setSelectedSegmentKey] = useState(SEGMENT_BLUEPRINTS[0].key)
  const [selectedJourneyKey, setSelectedJourneyKey] = useState(JOURNEY_BLUEPRINTS[0].key)
  const [templateSearch, setTemplateSearch] = useState('')

  const selectedCatalogEntry = useMemo(() => {
    if (!catalog || !Array.isArray(catalog.templates) || !selectedCatalogTemplate) return null
    return catalog.templates.find((item) => item.name === selectedCatalogTemplate) || null
  }, [catalog, selectedCatalogTemplate])

  const selectedSegmentEntry = useMemo(
    () => SEGMENT_BLUEPRINTS.find((item) => item.key === selectedSegmentKey) || SEGMENT_BLUEPRINTS[0],
    [selectedSegmentKey]
  )

  const selectedJourneyEntry = useMemo(
    () => JOURNEY_BLUEPRINTS.find((item) => item.key === selectedJourneyKey) || JOURNEY_BLUEPRINTS[0],
    [selectedJourneyKey]
  )

  const previewSrcDoc = useMemo(() => {
    const bodyHtml = selectedCatalogEntry?.local?.body_html || `<p style="padding:16px">${text.noBodyAvailable}</p>`
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        background: #ffffff;
      }
      img, table, div, section {
        max-width: 100%;
      }
      table {
        width: 100% !important;
      }
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`
  }, [selectedCatalogEntry, text.noBodyAvailable])

  const [activeTab, setActiveTab] = useState('templates')

  const filteredCatalogTemplates = useMemo(() => {
    const list = Array.isArray(catalog?.templates) ? catalog.templates : []
    const query = String(templateSearch || '').trim().toLowerCase()
    if (!query) return list

    return list.filter((item) => {
      const haystack = [item?.name, item?.description, item?.cio_id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [catalog, templateSearch])

  const templateLinksByName = useMemo(() => {
    const map = new Map()
    const list = Array.isArray(catalog?.templates) ? catalog.templates : []

    for (const item of list) {
      map.set(item?.name, extractTemplateLinks(item?.local?.body_html || ''))
    }

    return map
  }, [catalog])

  const catalogStats = useMemo(() => {
    const templateCount = Array.isArray(catalog?.templates) ? catalog.templates.length : 0
    const liveCount = Array.isArray(catalog?.templates)
      ? catalog.templates.filter((item) => Boolean(item?.live?.has_body)).length
      : 0

    return {
      templateCount,
      liveCount,
      plannedCount: 2,
      workspaceId: catalog?.transactional_live?.workspace_id || '222579',
      fetchedAt: catalog?.transactional_live?.fetched_at || '',
    }
  }, [catalog])

  const loadCatalog = async () => {
    setLoadingCatalog(true)
    setCatalogError('')
    try {
      const data = await callJson('/api/analytics/customerio/catalog', { method: 'GET' })
      setCatalog(data)
      const firstName = Array.isArray(data?.templates) && data.templates[0]?.name ? data.templates[0].name : ''
      setSelectedCatalogTemplate((prev) => prev || firstName)
    } catch (e) {
      setCatalog(null)
      setCatalogError(e?.message || text.loadCatalogError)
    } finally {
      setLoadingCatalog(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 14,
        boxSizing: 'border-box',
        background:
          'radial-gradient(1200px 540px at 12% -10%, rgba(14,116,144,0.32), transparent 60%), radial-gradient(980px 560px at 100% 0%, rgba(180,83,9,0.24), transparent 56%), linear-gradient(180deg, #071423 0%, #0d2238 48%, #0a1930 100%)',
        color: '#e2e8f0',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1720,
          margin: '0 auto',
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 10,
            color: '#f8fafc',
            padding: '4px 6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 2 }}>
              <div style={{ fontSize: 10, color: '#7dd3fc', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                {text.hubBadge}
              </div>
              <h2 style={{ margin: 0, fontSize: 26, lineHeight: 1.15, letterSpacing: -0.02 }}>
                {text.heroTitle}
              </h2>
              <div style={{ fontSize: 13, color: '#93c5fd' }}>{text.heroSubtitle}</div>
            </div>

            <button
              type="button"
              onClick={loadCatalog}
              disabled={loadingCatalog}
              style={{
                border: '1px solid rgba(45, 212, 191, 0.45)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.24), rgba(8, 145, 178, 0.2))',
                color: '#fff',
                borderRadius: 999,
                padding: '9px 14px',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {loadingCatalog ? text.refreshing : text.refresh}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { label: text.templatesStat, value: catalogStats.templateCount },
              { label: text.liveSyncedStat, value: catalogStats.liveCount },
              { label: text.plannedModulesStat, value: catalogStats.plannedCount },
              { label: text.workspaceStat, value: catalogStats.workspaceId },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'grid',
                  gap: 3,
                  borderRadius: 16,
                  padding: '11px 12px',
                  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(2, 132, 199, 0.12) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <span style={{ fontSize: 11, color: '#bae6fd', letterSpacing: 0.4, textTransform: 'uppercase' }}>{item.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {catalogError ? <div style={{ borderRadius: 14, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{catalogError}</div> : null}

        <section
          style={{
            borderRadius: 20,
            border: '1px solid rgba(148,163,184,0.22)',
            background: 'linear-gradient(145deg, rgba(11, 20, 33, 0.92), rgba(8, 32, 54, 0.9))',
            padding: 16,
            boxShadow: '0 18px 46px rgba(2, 6, 23, 0.34)',
            display: 'grid',
            gap: 16,
            minHeight: 'calc(100vh - 210px)',
            alignContent: 'start',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {text.workspaceNavigator}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'templates', label: text.templatesTab },
                { key: 'segments', label: text.segmentsTab },
                { key: 'journeys', label: text.journeysTab },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    minHeight: 38,
                    borderRadius: 999,
                    padding: '0 16px',
                    border: activeTab === tab.key ? '1px solid rgba(45,212,191,0.55)' : '1px solid rgba(148,163,184,0.35)',
                    background:
                      activeTab === tab.key
                        ? 'linear-gradient(135deg, rgba(20,184,166,0.32), rgba(14,116,144,0.35))'
                        : 'rgba(15,23,42,0.45)',
                    color: activeTab === tab.key ? '#e2f3ff' : '#cbd5e1',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', minHeight: 0 }}>
            <div
              style={{
                flex: '1 1 320px',
                maxWidth: 380,
                minWidth: 280,
                display: 'grid',
                gap: 10,
                alignContent: 'start',
                minHeight: 0,
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                {activeTab === 'templates' ? text.templateList : activeTab === 'segments' ? text.segmentList : text.journeyList}
              </div>

              {activeTab === 'templates' ? (
                <input
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder={text.searchTemplates}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid rgba(56,189,248,0.35)',
                    background: 'rgba(2, 6, 23, 0.42)',
                    color: '#e2e8f0',
                    padding: '10px 12px',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : null}

              <div style={{ display: 'grid', gap: 9, maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', paddingRight: 6 }}>

              {activeTab === 'templates'
                ? filteredCatalogTemplates.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedCatalogTemplate(item.name)}
                      style={{
                        textAlign: 'left',
                        border: selectedCatalogTemplate === item.name ? '1px solid rgba(45,212,191,0.7)' : '1px solid rgba(148,163,184,0.28)',
                        borderRadius: 14,
                        padding: 12,
                        background:
                          selectedCatalogTemplate === item.name
                            ? 'linear-gradient(180deg, rgba(17,94,89,0.36) 0%, rgba(15,23,42,0.8) 100%)'
                            : 'rgba(15,23,42,0.5)',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        display: 'grid',
                        gap: 5,
                      }}
                    >
                      {(() => {
                        const links = templateLinksByName.get(item.name) || []
                        return (
                          <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{item.name}</div>
                        <span style={{ borderRadius: 999, padding: '3px 8px', background: item?.live?.has_body ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)', color: item?.live?.has_body ? '#86efac' : '#cbd5e1', fontSize: 11, fontWeight: 700 }}>
                          {item?.live?.has_body ? text.live : text.draft}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#cbd5e1' }}>{item.description}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{text.cioId} {item.cio_id || '-'}</div>
                      <div style={{ fontSize: 11, color: '#7dd3fc', fontWeight: 700 }}>{text.linksUsed}</div>
                      {links.length ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {links.map((url, idx) => (
                              <a
                                key={`${item.name}-${url}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                title={url}
                                aria-label={`${text.linksUsed} ${idx + 1}: ${url}`}
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 999,
                                  border: '1px solid rgba(56,189,248,0.55)',
                                  background: 'linear-gradient(180deg, rgba(14,116,144,0.34) 0%, rgba(30,64,175,0.22) 100%)',
                                  color: '#e0f2fe',
                                  textDecoration: 'none',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 10px rgba(2,6,23,0.25)',
                                }}
                              >
                                L
                              </a>
                            ))}
                          </div>
                          <div style={{ fontSize: 10, color: '#93c5fd' }}>{text.hoverToPreview}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{text.noLinks}</div>
                      )}
                          </>
                        )
                      })()}
                    </button>
                  ))
                : activeTab === 'segments'
                  ? SEGMENT_BLUEPRINTS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedSegmentKey(item.key)}
                        style={{
                          textAlign: 'left',
                          border: selectedSegmentKey === item.key ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(148,163,184,0.28)',
                          borderRadius: 14,
                          padding: 11,
                          background: selectedSegmentKey === item.key ? 'linear-gradient(180deg, rgba(30,58,138,0.35) 0%, rgba(15,23,42,0.8) 100%)' : 'rgba(15,23,42,0.5)',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          display: 'grid',
                          gap: 5,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{item.label}</div>
                          <span style={{ borderRadius: 999, padding: '3px 8px', background: 'rgba(56,189,248,0.2)', color: '#bae6fd', fontSize: 11, fontWeight: 700 }}>
                            {text.planned}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>{item.summary[uiLocale]}</div>
                      </button>
                    ))
                  : JOURNEY_BLUEPRINTS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedJourneyKey(item.key)}
                        style={{
                          textAlign: 'left',
                          border: selectedJourneyKey === item.key ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(148,163,184,0.28)',
                          borderRadius: 14,
                          padding: 11,
                          background: selectedJourneyKey === item.key ? 'linear-gradient(180deg, rgba(30,58,138,0.35) 0%, rgba(15,23,42,0.8) 100%)' : 'rgba(15,23,42,0.5)',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          display: 'grid',
                          gap: 5,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{item.label}</div>
                          <span style={{ borderRadius: 999, padding: '3px 8px', background: 'rgba(56,189,248,0.2)', color: '#bae6fd', fontSize: 11, fontWeight: 700 }}>
                            {text.planned}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>{item.summary[uiLocale]}</div>
                      </button>
                    ))}
                {activeTab === 'templates' && filteredCatalogTemplates.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed rgba(148,163,184,0.45)',
                      borderRadius: 12,
                      padding: 12,
                      color: '#94a3b8',
                      fontSize: 13,
                    }}
                  >
                    {text.noResults}
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                flex: '2 1 640px',
                minHeight: 560,
                borderRadius: 16,
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(15,23,42,0.62)',
                boxShadow: '0 18px 40px rgba(2,6,23,0.25)',
                padding: 16,
                display: 'grid',
                gap: 14,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              {activeTab === 'templates' ? (
                selectedCatalogEntry ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{text.templatePreview}</div>
                        <h3 style={{ margin: '6px 0 0', fontSize: 20 }}>{selectedCatalogEntry.name}</h3>
                      </div>
                      <span style={{ borderRadius: 999, padding: '4px 10px', background: 'rgba(79,70,229,0.26)', color: '#c7d2fe', fontSize: 12, fontWeight: 700 }}>
                        {text.editor} {selectedCatalogEntry?.live?.editor || '-'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 8, color: '#cbd5e1', fontSize: 13, minWidth: 0 }}>
                      <div style={{ overflowWrap: 'anywhere' }}><strong>{text.subject}:</strong> {selectedCatalogEntry?.local?.subject || `(${text.empty})`}</div>
                      <div style={{ overflowWrap: 'anywhere' }}><strong>{text.preheader}:</strong> {selectedCatalogEntry?.local?.preheader || `(${text.empty})`}</div>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: 495,
                        border: '1px solid #dbe3ee',
                        borderRadius: 12,
                        background: '#fff',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
                      }}
                    >
                      <iframe
                        title={`preview-${selectedCatalogEntry.name}`}
                        style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }}
                        srcDoc={previewSrcDoc}
                      />
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8' }}>{text.noTemplateSelected}</p>
                )
              ) : activeTab === 'segments' ? (
                <>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{text.segmentPreview}</div>
                    <h3 style={{ margin: '6px 0 0', fontSize: 20 }}>{selectedSegmentEntry?.label}</h3>
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>{selectedSegmentEntry?.summary[uiLocale]}</p>
                  <div style={{ border: '1px solid rgba(148,163,184,0.3)', borderRadius: 12, background: 'rgba(15,23,42,0.5)', padding: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{text.plannedRules}</div>
                    {selectedSegmentEntry?.rules?.map((rule, idx) => (
                      <div key={`${selectedSegmentEntry?.key}-rule-${idx}`} style={{ fontSize: 13, color: '#cbd5e1', padding: '4px 0' }}>
                        - {rule[uiLocale]}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{text.journeyPreview}</div>
                    <h3 style={{ margin: '6px 0 0', fontSize: 20 }}>{selectedJourneyEntry?.label}</h3>
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>{selectedJourneyEntry?.summary[uiLocale]}</p>
                  <div style={{ border: '1px solid rgba(148,163,184,0.3)', borderRadius: 12, background: 'rgba(15,23,42,0.5)', padding: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{text.plannedSteps}</div>
                    {selectedJourneyEntry?.stages?.map((stage, idx) => (
                      <div key={`${selectedJourneyEntry?.key}-stage-${idx}`} style={{ fontSize: 13, color: '#cbd5e1', padding: '4px 0' }}>
                        - {stage[uiLocale]}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
