import { useCallback, useEffect, useMemo, useState } from 'react'
import { ALL_TEMPLATES_CATALOG } from '../data/allTemplatesCatalog'
import marketingCampaignPreview from '../../../../reports/bonus_preview_converted_by_currency.json'

const CAMPAIGN_TRACKING_STORAGE_KEY = 'bullwaves:campaign:mail-tracking:v1'
const CAMPAIGN_TRACKING_REFRESH_MS = 20000

function getDisplayTemplateName(item) {
  const baseName = String(item?.name || '').trim()
  const html = String(item?.html || '')
  const hasGlobalLink = /https?:\/\/[^"'\s]*global/i.test(html)

  if (!baseName) return baseName
  if (!hasGlobalLink) return baseName
  if (!/^bullwaves\b/i.test(baseName)) return baseName
  if (/^bullwaves\s+global\b/i.test(baseName)) return baseName

  return baseName.replace(/^bullwaves\b/i, 'Bullwaves Global')
}

function getTemplateBrand(item) {
  const html = String(item?.html || '')
  if (/https?:\/\/[^"'\s]*bullwaves\.global/i.test(html)) {
    return { id: 'global', label: 'BG' }
  }
  return { id: 'portal', label: 'BP' }
}

function brandBadgeStyle(brandId) {
  if (brandId === 'global') {
    return {
      border: '1px solid rgba(56,189,248,0.5)',
      color: '#7dd3fc',
      background: 'rgba(56,189,248,0.14)',
    }
  }
  return {
    border: '1px solid rgba(34,197,94,0.42)',
    color: '#9af0b2',
    background: 'rgba(34,197,94,0.12)',
  }
}

function getTemplateLinks(item) {
  const html = String(item?.html || '')
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi
  const links = []
  let match

  const includeLink = (href) => {
    const normalized = href.toLowerCase()

    // Exclude non-CTA support channels
    if (
      normalized.startsWith('mailto:') ||
      normalized.includes('wa.me') ||
      normalized.includes('whatsapp') ||
      normalized.includes('livechat')
    ) {
      return false
    }

    // Keep only login/access and account verification CTAs
    return (
      normalized.includes('login') ||
      normalized.includes('webtrader') ||
      normalized.includes('email-confirmation') ||
      normalized.includes('verify') ||
      normalized.includes('verification') ||
      normalized.includes('confirm') ||
      normalized.includes('new-password') ||
      normalized.includes('reset-password') ||
      normalized.includes('pwd_reset_token')
    )
  }

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = String(match[1] || '').trim()
    if (!href) continue
    if (!includeLink(href)) continue
    if (links.includes(href)) continue
    links.push(href)
  }

  return links
}

function cardStyle(active) {
  return {
    width: '100%',
    textAlign: 'left',
    borderRadius: 16,
    border: active ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.1)',
    background: active
      ? 'linear-gradient(160deg, rgba(56,189,248,0.2), rgba(15,23,42,0.95))'
      : 'rgba(15,23,42,0.72)',
    color: '#e7eff8',
    padding: 16,
    cursor: 'pointer',
  }
}

function TemplateCard({ item, active, onClick }) {
  const displayName = getDisplayTemplateName(item)
  const brand = getTemplateBrand(item)
  const links = getTemplateLinks(item)

  return (
    <button type="button" style={cardStyle(active)} onClick={onClick}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{displayName}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#9fb4c9' }}>{item.subject}</div>
        </div>
        <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderRadius: 999,
              padding: '5px 8px',
              ...brandBadgeStyle(brand.id),
            }}
          >
            {brand.label}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
        {links.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9fb4c9' }}>Nessun link trovato</div>
        ) : (
          links.map((link) => (
            <a
              key={`${item.id}-${link}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, lineHeight: 1.4, color: '#7dd3fc', wordBreak: 'break-all' }}
              onClick={(event) => event.stopPropagation()}
            >
              {link}
            </a>
          ))
        )}
      </div>
    </button>
  )
}

function getMailStatusStyle(status) {
  const normalized = String(status || '').toLowerCase()

  if (
    normalized === 'sent' ||
    normalized === 'delivered' ||
    normalized === 'open' ||
    normalized === 'click'
  ) {
    return {
      background: 'rgba(22,163,74,0.18)',
      color: '#86efac',
      border: '1px solid rgba(22,163,74,0.4)',
    }
  }

  if (
    normalized === 'failed' ||
    normalized === 'bounce' ||
    normalized === 'dropped' ||
    normalized === 'blocked'
  ) {
    return {
      background: 'rgba(220,38,38,0.18)',
      color: '#fca5a5',
      border: '1px solid rgba(220,38,38,0.4)',
    }
  }

  if (normalized === 'accepted' || normalized === 'processed') {
    return {
      background: 'rgba(56,189,248,0.16)',
      color: '#7dd3fc',
      border: '1px solid rgba(56,189,248,0.42)',
    }
  }

  return {
    background: 'rgba(251,191,36,0.16)',
    color: '#fde68a',
    border: '1px solid rgba(251,191,36,0.38)',
  }
}

function normalizeMailStatus(value) {
  return (
    String(value || 'pending')
      .trim()
      .toLowerCase() || 'pending'
  )
}

function formatDateTime(value) {
  const parsed = Date.parse(String(value || ''))
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildMailFlowSteps(row) {
  const steps = []
  const status = normalizeMailStatus(row?.mailStatus)
  const openCount = Number(row?.mailOpenCount || 0)
  const clickCount = Number(row?.mailClickCount || 0)

  if (status !== 'pending') {
    steps.push('Accepted')
  }
  if (
    status === 'delivered' ||
    row?.mailLastEvent === 'delivered' ||
    openCount > 0 ||
    clickCount > 0
  ) {
    steps.push('Delivered')
  }
  if (openCount > 0 || row?.mailLastEvent === 'open') {
    steps.push(openCount > 0 ? `Opened (${openCount})` : 'Opened')
  }
  if (clickCount > 0 || row?.mailLastEvent === 'click') {
    steps.push(clickCount > 0 ? `Clicked (${clickCount})` : 'Clicked')
  }

  return steps.length ? steps : ['—']
}

function moneyWithCurrency(value, currencyCode) {
  if (!currencyCode) return '—'
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}

function roundToNearestThousand(value) {
  return Math.round(Number(value || 0) / 1000) * 1000
}

function toCampaignRowKey(row) {
  return `${String(row?.tradingAccount || '')}:${String(row?.email || '')}`
}

function extractFirstName(fullName) {
  const raw = String(fullName || '').trim()
  if (!raw) return 'Trader'
  return raw.split(/\s+/)[0] || 'Trader'
}

function buildCampaignTemplateHtml(html, campaignRow) {
  const source = String(html || '')
  if (!source || !campaignRow) return source

  const firstName = extractFirstName(campaignRow.name)
  const bonusAmount = moneyWithCurrency(
    roundToNearestThousand(campaignRow.bonusAccountCurrencyRaw || 0),
    campaignRow.accountCurrency
  )
  const tradingAccount = String(campaignRow.tradingAccount || '').trim() || '—'

  return source
    .replaceAll('[First Name]', firstName)
    .replaceAll('[Bonus Amount]', bonusAmount)
    .replaceAll('[Trading Account ID]', tradingAccount)
}

function buildCampaignSubject(baseSubject, campaignRow) {
  const fallback = String(baseSubject || '').trim() || 'Your exclusive tradable bonus is ready'
  if (!campaignRow) return fallback

  const firstName = extractFirstName(campaignRow.name)
  const bonusAmount = moneyWithCurrency(
    roundToNearestThousand(campaignRow.bonusAccountCurrencyRaw || 0),
    campaignRow.accountCurrency
  )
  const tradingAccount = String(campaignRow.tradingAccount || '').trim()

  if (!tradingAccount) {
    return `${firstName}, your exclusive tradable bonus of ${bonusAmount} is ready`
  }

  return `${firstName}, your exclusive tradable bonus of ${bonusAmount} is ready - Acc ${tradingAccount}`
}

function MarketingCampaignSection({
  rows,
  selectedCampaignRowKey,
  onSelectCampaignRow,
  trackingMeta,
}) {
  const totals = useMemo(() => {
    const totalBonus = rows.reduce(
      (sum, row) => sum + roundToNearestThousand(row.bonusAccountCurrencyRaw || 0),
      0
    )
    const delivered = rows.filter(
      (row) => normalizeMailStatus(row.mailStatus) === 'delivered'
    ).length
    const failed = rows.filter((row) => normalizeMailStatus(row.mailStatus) === 'failed').length
    const engaged = rows.filter(
      (row) => Number(row.mailOpenCount || 0) > 0 || Number(row.mailClickCount || 0) > 0
    ).length
    return {
      totalRows: rows.length,
      totalBonus,
      delivered,
      failed,
      engaged,
    }
  }, [rows])

  return (
    <section
      style={{
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(180deg, rgba(2,6,23,0.9), rgba(15,23,42,0.84))',
        padding: 18,
        display: 'grid',
        gap: 14,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 800, letterSpacing: '0.08em' }}>
            SALES / MARKETING CAMPAIGN
          </div>
          <h2 style={{ margin: '6px 0 4px', fontSize: 22, color: '#f5f9ff' }}>
            Marketing campaign
          </h2>
          <p style={{ margin: 0, color: '#bdd0e4', lineHeight: 1.5 }}>
            Snapshot iniziale con i clienti selezionati, bonus calcolato e colonna stato mail pronta
            per i prossimi invii.
          </p>
          <p style={{ margin: '8px 0 0', color: '#9ec3df', fontSize: 12, lineHeight: 1.4 }}>
            Tracker auto-refresh: every 20s
            {trackingMeta?.lastSyncAt
              ? ` · Last sync ${formatDateTime(trackingMeta.lastSyncAt)}`
              : ''}
            {trackingMeta?.error ? ` · ${trackingMeta.error}` : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <div style={{ fontSize: 12, color: '#93acc5', fontWeight: 700 }}>Rows</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fcff' }}>{totals.totalRows}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            borderRadius: 14,
            padding: 14,
            background: 'rgba(15,23,42,0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontSize: 12, color: '#93acc5', fontWeight: 800 }}>Total bonus</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: '#f8fcff' }}>
            {moneyWithCurrency(roundToNearestThousand(totals.totalBonus), 'USD')}
          </div>
        </div>
        <div
          style={{
            borderRadius: 14,
            padding: 14,
            background: 'rgba(15,23,42,0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontSize: 12, color: '#93acc5', fontWeight: 800 }}>Mail status</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: '#f8fcff' }}>
            {totals.delivered} delivered · {totals.failed} failed
          </div>
        </div>
        <div
          style={{
            borderRadius: 14,
            padding: 14,
            background: 'rgba(15,23,42,0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontSize: 12, color: '#93acc5', fontWeight: 800 }}>Engaged clients</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: '#f8fcff' }}>
            {totals.engaged}
            <span style={{ marginLeft: 8, color: '#93acc5', fontSize: 12, fontWeight: 700 }}>
              FX {String(marketingCampaignPreview?.fxSource || 'live-fx')}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(2,6,23,0.5)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <div style={{ overflow: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1250 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: 'rgba(15,23,42,0.98)' }}>
                {[
                  'Rank',
                  'Name',
                  'Email',
                  'Trading Account',
                  'User',
                  'Currency',
                  'Net Deposits USD',
                  'Net Deposits Account',
                  'Bonus',
                  'Mail status',
                  'Engagement',
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      fontSize: 11,
                      color: '#93acc5',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const statusStyle = getMailStatusStyle(row.mailStatus)
                const rowKey = toCampaignRowKey(row)
                const isActive = rowKey === selectedCampaignRowKey
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onSelectCampaignRow?.(rowKey)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(125,211,252,0.12)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 14px', color: '#f8fcff', fontWeight: 800 }}>
                      {row.rank}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f8fcff', fontWeight: 700 }}>
                      {row.name}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4' }}>{row.email}</td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4' }}>{row.tradingAccount}</td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4' }}>
                      {row.user || 'Unassigned'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4' }}>
                      {row.accountCurrency}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4' }}>
                      {moneyWithCurrency(row.netDepositsUsd, 'USD')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4' }}>
                      {moneyWithCurrency(row.netDepositsAccountCurrency, row.accountCurrency)}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f8fcff', fontWeight: 800 }}>
                      {moneyWithCurrency(
                        roundToNearestThousand(row.bonusAccountCurrencyRaw || 0),
                        row.accountCurrency
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 999,
                          padding: '5px 10px',
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          ...statusStyle,
                        }}
                      >
                        {row.mailStatus}
                      </span>
                      {row.mailUpdatedAt ? (
                        <div style={{ marginTop: 5, fontSize: 10, color: '#89a7c3' }}>
                          {formatDateTime(row.mailUpdatedAt)}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#bdd0e4', fontSize: 12 }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <div style={{ color: '#d9ecff', fontWeight: 700 }}>
                          {buildMailFlowSteps(row).join(' → ')}
                        </div>
                        <div style={{ color: '#89a7c3', fontSize: 11 }}>
                          Last event: {row.mailLastEvent || '—'}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default function AllTemplatesPage() {
  const campaignSourceRows = useMemo(
    () => (Array.isArray(marketingCampaignPreview?.rows) ? marketingCampaignPreview.rows : []),
    []
  )

  const [campaignTrackingByRowKey, setCampaignTrackingByRowKey] = useState(() => {
    if (typeof window === 'undefined') return {}

    try {
      const raw = window.localStorage.getItem(CAMPAIGN_TRACKING_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const [campaignTrackingMeta, setCampaignTrackingMeta] = useState({
    lastSyncAt: '',
    error: '',
  })

  const campaignRows = useMemo(() => {
    return campaignSourceRows.map((row, index) => {
      const rowKey = toCampaignRowKey(row)
      const tracking = campaignTrackingByRowKey[rowKey] || null

      return {
        ...row,
        rank: index + 1,
        mailStatus: normalizeMailStatus(tracking?.status || row.mailStatus || 'pending'),
        mailMessageId: tracking?.messageId || null,
        mailUpdatedAt: tracking?.updatedAt || null,
        mailLastEvent: tracking?.lastEvent || null,
        mailOpenCount: Number(tracking?.openCount || 0),
        mailClickCount: Number(tracking?.clickCount || 0),
      }
    })
  }, [campaignSourceRows, campaignTrackingByRowKey])

  const defaultCampaignRowKey = campaignRows.length ? toCampaignRowKey(campaignRows[0]) : ''
  const visibleTemplates = useMemo(
    () => ALL_TEMPLATES_CATALOG.filter((item) => item.id !== 'acuity-bullwaves-46-en'),
    []
  )
  const bonusTemplateId = 'bullwaves-global-exclusive-tradable-bonus-en'
  const bonusTemplate = useMemo(
    () => visibleTemplates.find((item) => item.id === bonusTemplateId) || null,
    [visibleTemplates]
  )
  const [selectedId, setSelectedId] = useState(visibleTemplates[0]?.id || '')
  const [contentMode, setContentMode] = useState('preview')
  const [copyStatus, setCopyStatus] = useState('idle')
  const [selectedCampaignRowKey, setSelectedCampaignRowKey] = useState(defaultCampaignRowKey)
  const [isCampaignPreviewOpen, setCampaignPreviewOpen] = useState(false)
  const [campaignMailState, setCampaignMailState] = useState({
    phase: 'idle',
    message: '',
    messageId: '',
    error: '',
  })

  const selectedCampaignRow = useMemo(
    () =>
      campaignRows.find((row) => toCampaignRowKey(row) === selectedCampaignRowKey) ||
      campaignRows[0] ||
      null,
    [campaignRows, selectedCampaignRowKey]
  )

  const selectedTemplate = useMemo(
    () => visibleTemplates.find((item) => item.id === selectedId) || visibleTemplates[0],
    [selectedId, visibleTemplates]
  )
  const selectedTemplateDisplayName = getDisplayTemplateName(selectedTemplate)
  const selectedTemplateHtml = String(selectedTemplate?.html || '')
  const campaignPreviewHtml = useMemo(
    () => buildCampaignTemplateHtml(bonusTemplate?.html || '', selectedCampaignRow),
    [bonusTemplate, selectedCampaignRow]
  )
  const campaignPreviewSubject = useMemo(
    () => buildCampaignSubject(bonusTemplate?.subject || '', selectedCampaignRow),
    [bonusTemplate, selectedCampaignRow]
  )

  const handleSelectCampaignRow = (rowKey) => {
    setSelectedCampaignRowKey(rowKey)
    const existing = campaignTrackingByRowKey[rowKey] || null
    setCampaignMailState({
      phase: existing?.status || 'idle',
      message: existing?.status ? `Stato attuale: ${existing.status}` : '',
      messageId: existing?.messageId || '',
      error: '',
    })
    setCampaignPreviewOpen(true)
  }

  const applyCampaignTracking = (rowKey, tracking) => {
    if (!rowKey || !tracking) return
    setCampaignTrackingByRowKey((prev) => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || {}),
        ...tracking,
      },
    }))
  }

  const refreshCampaignTrackingFromBackend = useCallback(async () => {
    try {
      const response = await fetch('/api/email/status', {
        method: 'GET',
        headers: {
          'x-bullwaves-user-email': 'paolo.v@bullwaves.com',
        },
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
        throw new Error(data?.error || 'Tracker refresh failed')
      }

      const items = data.items
      const byMessageId = new Map(
        items.filter((item) => item?.messageId).map((item) => [String(item.messageId).trim(), item])
      )
      const byRecipient = new Map()

      for (const item of items) {
        const recipient = String(item?.to || '')
          .trim()
          .toLowerCase()
        if (!recipient) continue
        const existing = byRecipient.get(recipient)
        const currentTs = Date.parse(String(item?.updatedAt || '')) || 0
        const existingTs = Date.parse(String(existing?.updatedAt || '')) || 0
        if (!existing || currentTs >= existingTs) {
          byRecipient.set(recipient, item)
        }
      }

      setCampaignTrackingByRowKey((prev) => {
        const next = { ...(prev || {}) }
        let changed = false

        for (const sourceRow of campaignSourceRows) {
          const rowKey = toCampaignRowKey(sourceRow)
          const current = next[rowKey] || {}
          const currentMessageId = String(current?.messageId || '').trim()
          const recipient = String(sourceRow?.email || '')
            .trim()
            .toLowerCase()

          const backendTracking =
            (currentMessageId ? byMessageId.get(currentMessageId) : null) ||
            (recipient ? byRecipient.get(recipient) : null)

          if (!backendTracking) continue

          const normalizedStatus = normalizeMailStatus(backendTracking.status || current.status)
          const messageId = String(backendTracking.messageId || currentMessageId || '').trim()
          const updatedAt = String(backendTracking.updatedAt || current.updatedAt || '')
          const lastEvent = backendTracking.lastEvent || current.lastEvent || null
          const openCount = Number(backendTracking.openCount || current.openCount || 0)
          const clickCount = Number(backendTracking.clickCount || current.clickCount || 0)

          if (
            normalizedStatus !== normalizeMailStatus(current.status) ||
            messageId !== currentMessageId ||
            updatedAt !== String(current.updatedAt || '') ||
            String(lastEvent || '') !== String(current.lastEvent || '') ||
            openCount !== Number(current.openCount || 0) ||
            clickCount !== Number(current.clickCount || 0)
          ) {
            next[rowKey] = {
              ...current,
              status: normalizedStatus,
              messageId,
              updatedAt,
              lastEvent,
              openCount,
              clickCount,
            }
            changed = true
          }
        }

        return changed ? next : prev
      })

      setCampaignTrackingMeta({
        lastSyncAt: new Date().toISOString(),
        error: '',
      })
    } catch (error) {
      setCampaignTrackingMeta((prev) => ({
        ...prev,
        error: error?.message || 'Tracker refresh failed',
      }))
    }
  }, [campaignSourceRows])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        CAMPAIGN_TRACKING_STORAGE_KEY,
        JSON.stringify(campaignTrackingByRowKey || {})
      )
    } catch {
      // Ignore quota/storage issues; tracking still works in-memory.
    }
  }, [campaignTrackingByRowKey])

  useEffect(() => {
    refreshCampaignTrackingFromBackend()
    const intervalId = window.setInterval(() => {
      refreshCampaignTrackingFromBackend()
    }, CAMPAIGN_TRACKING_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [refreshCampaignTrackingFromBackend])

  useEffect(() => {
    const rowTracking = campaignTrackingByRowKey[selectedCampaignRowKey]
    if (!rowTracking) return

    setCampaignMailState((prev) => ({
      ...prev,
      phase: normalizeMailStatus(rowTracking.status || prev.phase),
      messageId: String(rowTracking.messageId || prev.messageId || '').trim(),
      message: rowTracking.status
        ? `Stato attuale: ${normalizeMailStatus(rowTracking.status)}`
        : prev.message,
      error: prev.phase === 'failed' ? prev.error : '',
    }))
  }, [campaignTrackingByRowKey, selectedCampaignRowKey])

  const handleSendCampaignTest = async () => {
    if (!selectedCampaignRow || !campaignPreviewHtml) return

    setCampaignMailState({
      phase: 'sending',
      message: 'Invio in corso...',
      messageId: '',
      error: '',
    })

    const firstName = extractFirstName(selectedCampaignRow.name)
    const bonusAmount = moneyWithCurrency(
      roundToNearestThousand(selectedCampaignRow.bonusAccountCurrencyRaw || 0),
      selectedCampaignRow.accountCurrency
    )

    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-bullwaves-user-email': 'paolo.v@bullwaves.com',
        },
        body: JSON.stringify({
          viewerEmail: 'paolo.v@bullwaves.com',
          to: 'paolo.v@bullwaves.com',
          subject: campaignPreviewSubject,
          html: campaignPreviewHtml,
          text: `Hi ${firstName}, your exclusive tradable bonus is ready: ${bonusAmount}.`,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Invio test non riuscito')
      }

      const messageId = String(data?.messageId || '').trim()
      const nextTracking = {
        status: 'accepted',
        messageId,
        updatedAt: new Date().toISOString(),
        lastEvent: 'accepted',
        openCount: 0,
        clickCount: 0,
      }

      applyCampaignTracking(selectedCampaignRowKey, nextTracking)
      refreshCampaignTrackingFromBackend()

      setCampaignMailState({
        phase: 'accepted',
        message: 'Mail accettata da SendGrid.',
        messageId,
        error: '',
      })
    } catch (error) {
      setCampaignMailState({
        phase: 'failed',
        message: '',
        messageId: '',
        error: error?.message || 'Errore invio test',
      })
    }
  }

  const handleRefreshCampaignStatus = async () => {
    const activeMessageId = String(
      campaignMailState?.messageId || selectedCampaignRow?.mailMessageId || ''
    ).trim()
    if (!activeMessageId) return

    setCampaignMailState((prev) => ({
      ...prev,
      phase: 'checking',
      message: 'Controllo stato dal tracker...',
      error: '',
    }))

    try {
      const response = await fetch(`/api/email/status/${encodeURIComponent(activeMessageId)}`, {
        method: 'GET',
        headers: {
          'x-bullwaves-user-email': 'paolo.v@bullwaves.com',
        },
      })

      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok || !data?.tracking) {
        throw new Error(data?.error || 'Stato non disponibile')
      }

      const tracking = data.tracking
      const nextTracking = {
        status: String(tracking.status || 'pending').toLowerCase(),
        messageId: tracking.messageId || activeMessageId,
        updatedAt: tracking.updatedAt || new Date().toISOString(),
        lastEvent: tracking.lastEvent || null,
        openCount: Number(tracking.openCount || 0),
        clickCount: Number(tracking.clickCount || 0),
      }

      applyCampaignTracking(selectedCampaignRowKey, nextTracking)

      setCampaignMailState({
        phase: normalizeMailStatus(nextTracking.status),
        message: `Stato aggiornato: ${nextTracking.status}`,
        messageId: nextTracking.messageId,
        error: '',
      })
      refreshCampaignTrackingFromBackend()
    } catch (error) {
      setCampaignMailState((prev) => ({
        ...prev,
        phase: 'failed',
        error: error?.message || 'Errore controllo stato',
      }))
    }
  }

  const handleCopyHtml = async () => {
    const html = String(selectedTemplateHtml || '')
    if (!html) return

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(html)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }

    setTimeout(() => setCopyStatus('idle'), 1800)
  }

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        gap: 18,
        height: 'calc(100vh - 170px)',
        minHeight: 760,
        overflow: 'auto',
      }}
    >
      <header
        style={{
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(120deg, rgba(2,132,199,0.18), rgba(15,23,42,0.96))',
          padding: 20,
        }}
      >
        <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 800, letterSpacing: '0.08em' }}>
          SALES / ALL TEMPLATES
        </div>
        <h1 style={{ margin: '6px 0 4px', fontSize: 24, color: '#f5f9ff' }}>All templates</h1>
        <p style={{ margin: 0, color: '#bdd0e4' }}>
          Seleziona una card per aprire la preview grafica o il sorgente HTML dell&apos;email.
        </p>
      </header>

      <MarketingCampaignSection
        rows={campaignRows}
        selectedCampaignRowKey={selectedCampaignRowKey}
        onSelectCampaignRow={handleSelectCampaignRow}
        trackingMeta={campaignTrackingMeta}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 380px) minmax(0, 1fr)',
          gap: 16,
          minHeight: 0,
        }}
      >
        <aside
          style={{
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15,23,42,0.82)',
            padding: 14,
            display: 'grid',
            gap: 10,
            alignContent: 'start',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {visibleTemplates.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              active={item.id === selectedTemplate?.id}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </aside>

        <article
          style={{
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15,23,42,0.82)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div
              style={{ fontSize: 12, color: '#93acc5', letterSpacing: '0.07em', fontWeight: 800 }}
            >
              CONTENUTO CENTRALE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  borderRadius: 999,
                  padding: 4,
                  gap: 4,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(2,6,23,0.5)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setContentMode('preview')}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: contentMode === 'preview' ? '#04111d' : '#b7c7d8',
                    background: contentMode === 'preview' ? '#7dd3fc' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('html')}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: contentMode === 'html' ? '#04111d' : '#b7c7d8',
                    background: contentMode === 'html' ? '#7dd3fc' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  HTML
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyHtml}
                style={{
                  border: '1px solid rgba(125,211,252,0.55)',
                  borderRadius: 999,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#dff6ff',
                  background:
                    copyStatus === 'copied'
                      ? 'rgba(22,163,74,0.25)'
                      : copyStatus === 'error'
                        ? 'rgba(220,38,38,0.25)'
                        : 'rgba(125,211,252,0.16)',
                  cursor: 'pointer',
                }}
              >
                {copyStatus === 'copied'
                  ? 'Copiato'
                  : copyStatus === 'error'
                    ? 'Errore copia'
                    : 'Copia HTML'}
              </button>
            </div>
          </div>

          <div>
            <div
              style={{ fontSize: 12, color: '#93acc5', letterSpacing: '0.07em', fontWeight: 800 }}
            >
              SUBJECT
            </div>
            <div style={{ marginTop: 4, color: '#f8fcff', fontWeight: 700 }}>
              {selectedTemplate?.subject}
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: 12, color: '#93acc5', letterSpacing: '0.07em', fontWeight: 800 }}
            >
              DESCRIPTION
            </div>
            <div style={{ marginTop: 4, color: '#d3deea', lineHeight: 1.5 }}>
              {selectedTemplate?.description}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              minHeight: 0,
              flex: 1,
              background: contentMode === 'preview' ? '#f5f7fa' : '#0a1220',
            }}
          >
            {contentMode === 'preview' ? (
              <iframe
                title={selectedTemplateDisplayName || 'Template preview'}
                srcDoc={selectedTemplateHtml || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 0,
                  border: 0,
                  background: '#f5f7fa',
                  display: 'block',
                }}
                scrolling="yes"
                sandbox="allow-same-origin"
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  height: '100%',
                  minHeight: 0,
                  overflow: 'auto',
                  padding: 16,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#cfe0f1',
                  fontSize: 12,
                  lineHeight: 1.5,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                }}
              >
                {selectedTemplateHtml || ''}
              </pre>
            )}
          </div>
        </article>
      </div>

      {isCampaignPreviewOpen ? (
        <div
          onClick={() => setCampaignPreviewOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(2,6,23,0.72)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1100px, 96vw)',
              height: 'min(86vh, 900px)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(15,23,42,0.98)',
              boxShadow: '0 30px 80px rgba(2,6,23,0.7)',
              display: 'grid',
              gridTemplateRows: 'auto auto 1fr',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(2,6,23,0.74)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: '#93acc5',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                  }}
                >
                  MARKETING CAMPAIGN PREVIEW
                </div>
                <div style={{ color: '#e6f3ff', fontWeight: 700, marginTop: 2 }}>
                  {selectedCampaignRow?.name || 'Cliente'} · Account{' '}
                  {selectedCampaignRow?.tradingAccount || '—'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleSendCampaignTest}
                  disabled={campaignMailState.phase === 'sending'}
                  style={{
                    border: '1px solid rgba(74,222,128,0.45)',
                    background: 'rgba(74,222,128,0.16)',
                    color: '#dcfce7',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '7px 12px',
                    cursor: campaignMailState.phase === 'sending' ? 'wait' : 'pointer',
                    opacity: campaignMailState.phase === 'sending' ? 0.7 : 1,
                  }}
                >
                  {campaignMailState.phase === 'sending' ? 'Invio...' : 'Invia test'}
                </button>

                <button
                  type="button"
                  onClick={handleRefreshCampaignStatus}
                  disabled={!campaignMailState.messageId || campaignMailState.phase === 'checking'}
                  style={{
                    border: '1px solid rgba(125,211,252,0.45)',
                    background: 'rgba(125,211,252,0.16)',
                    color: '#dff6ff',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '7px 12px',
                    cursor:
                      !campaignMailState.messageId || campaignMailState.phase === 'checking'
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      !campaignMailState.messageId || campaignMailState.phase === 'checking'
                        ? 0.6
                        : 1,
                  }}
                >
                  {campaignMailState.phase === 'checking' ? 'Controllo...' : 'Aggiorna stato'}
                </button>

                <button
                  type="button"
                  onClick={() => setCampaignPreviewOpen(false)}
                  style={{
                    border: '1px solid rgba(125,211,252,0.45)',
                    background: 'rgba(125,211,252,0.16)',
                    color: '#dff6ff',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '7px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Chiudi
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(9,14,28,0.9)',
              }}
            >
              <div
                style={{ fontSize: 11, color: '#8fa9c2', fontWeight: 800, letterSpacing: '0.08em' }}
              >
                SUBJECT
              </div>
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: '#eaf6ff' }}>
                {campaignPreviewSubject}
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    ...getMailStatusStyle(
                      campaignMailState.phase === 'idle'
                        ? selectedCampaignRow?.mailStatus
                        : campaignMailState.phase
                    ),
                  }}
                >
                  {String(
                    campaignMailState.phase === 'idle'
                      ? selectedCampaignRow?.mailStatus || 'pending'
                      : campaignMailState.phase
                  )}
                </span>

                {campaignMailState.messageId ? (
                  <span style={{ fontSize: 11, color: '#9ec3df' }}>
                    Message ID: {campaignMailState.messageId}
                  </span>
                ) : null}

                {campaignMailState.message ? (
                  <span style={{ fontSize: 11, color: '#cfe7ff' }}>
                    {campaignMailState.message}
                  </span>
                ) : null}

                {campaignMailState.error ? (
                  <span style={{ fontSize: 11, color: '#fca5a5' }}>{campaignMailState.error}</span>
                ) : null}
              </div>
            </div>

            {bonusTemplate ? (
              <iframe
                title="Campaign template preview"
                srcDoc={campaignPreviewHtml || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  background: '#f5f7fa',
                  display: 'block',
                }}
                scrolling="yes"
                sandbox="allow-same-origin"
              />
            ) : (
              <div style={{ padding: 18, color: '#c6d8ea' }}>
                Template bonus non trovato nel catalogo.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
