import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '../../../i18n/I18nContext'
import { encodeSharePayload } from '../../../utils/shareCodec'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'
import FinanceToolOrgChartBoard from '../components/FinanceToolOrgChartBoard'
import { INVOICE_CATALOG } from '../invoiceCatalog'
import { resolveOperationalStackGroups } from '../operationalStackConfig'

function monthLabelFromKey(key, locale) {
  const [year, month] = String(key || '').split('-')
  const yyyy = Number(year)
  const mm = Number(month)
  if (!Number.isInteger(yyyy) || !Number.isInteger(mm)) return key

  try {
    return new Intl.DateTimeFormat(locale || 'en', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(yyyy, mm - 1, 1))
  } catch {
    return key
  }
}

function formatMoneyCurrency(value, currency) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '?'

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: String(currency || 'USD').toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${String(currency || '').toUpperCase()} ${amount.toFixed(0)}`.trim()
  }
}

function formatCurrencyBreakdown(currencyTotals) {
  const entries = Object.entries(currencyTotals || {}).filter(([, amount]) =>
    Number.isFinite(Number(amount))
  )

  if (!entries.length) return '?'

  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => formatMoneyCurrency(amount, currency))
    .join(' + ')
}

function isValidSharePayload(payload) {
  return (
    payload &&
    payload.v === 1 &&
    payload.k === 'finance_tool_organigram' &&
    Array.isArray(payload?.data?.groups)
  )
}

export default function FinanceToolOrganigramPage({ publicMode = false, sharePayload = null }) {
  const { t, locale } = useI18n()
  const [shareCopied, setShareCopied] = useState(false)
  const [viewMode, setViewMode] = useState(() =>
    sharePayload?.data?.viewMode === 'details' ? 'details' : 'overview'
  )

  useEffect(() => {
    setViewMode(sharePayload?.data?.viewMode === 'details' ? 'details' : 'overview')
  }, [sharePayload])

  const operationalGroups = useMemo(() => {
    if (isValidSharePayload(sharePayload)) {
      return sharePayload.data.groups
    }

    return resolveOperationalStackGroups(INVOICE_CATALOG, locale, monthLabelFromKey).map(
      (group) => ({
        ...group,
        knownCostLabel: formatCurrencyBreakdown(group.currencyTotals),
        tools: group.tools.map((tool) => ({
          ...tool,
          costLabel: tool.invoiceFound ? formatMoneyCurrency(tool.monthlyCost, tool.currency) : '?',
        })),
      })
    )
  }, [locale, sharePayload])

  const buildShareHref = () => {
    const origin = getPublicShareOrigin()
    const payload = {
      k: 'finance_tool_organigram',
      v: 1,
      generatedAt: new Date().toISOString(),
      data: {
        groups: operationalGroups,
        viewMode,
      },
    }
    const token = encodeSharePayload(payload)
    if (!origin || !token) return ''
    return `${origin}/share/finance-tool-organigram/${token}`
  }

  const handleOpenShare = () => {
    const href = buildShareHref()
    if (!href || typeof window === 'undefined') return
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const handleCopyShare = async () => {
    const href = buildShareHref()
    if (!href || typeof window === 'undefined') return

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(href)
      } else {
        window.prompt(
          t('platformUsageBilling.operational.share.copyPrompt') || 'Copy the link:',
          href
        )
      }
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1800)
    } catch {
      window.prompt(
        t('platformUsageBilling.operational.share.copyPrompt') || 'Copy the link:',
        href
      )
    }
  }

  return (
    <div className="page-shell" style={{ display: 'grid', gap: 16 }}>
      <section className="card-block" style={{ padding: 18 }}>
        <div
          className="card-block-header"
          style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {!publicMode ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" className="pill-tab" onClick={handleOpenShare}>
                {t('platformUsageBilling.operational.share.open') || 'Open public page'}
              </button>
              <button type="button" className="pill-tab" onClick={handleCopyShare}>
                {shareCopied
                  ? t('platformUsageBilling.operational.share.copied') || 'Link copied'
                  : t('platformUsageBilling.operational.share.copy') || 'Copy public link'}
              </button>
            </div>
          ) : null}
        </div>

        <FinanceToolOrgChartBoard
          groups={operationalGroups}
          t={t}
          mode={viewMode}
          onModeChange={setViewMode}
        />
      </section>
    </div>
  )
}
