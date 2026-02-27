import { useEffect, useMemo } from 'react'

import { useI18n } from '../../../i18n/I18nContext'
import InvestmentsDashboard from '../components/InvestmentsDashboard'

function readQueryParams() {
  if (typeof window === 'undefined') return {}
  try {
    const sp = new window.URLSearchParams(window.location.search || '')
    return {
      year: String(sp.get('year') || '').trim(),
      month: String(sp.get('month') || '').trim(),
      search: String(sp.get('search') || '').trim(),
      source: String(sp.get('source') || '').trim(),
      mode: String(sp.get('mode') || '').trim(),
    }
  } catch {
    return {}
  }
}

export default function PublicAffiliatePayoutSummarySharePage() {
  const { t } = useI18n()
  const params = useMemo(() => readQueryParams(), [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = `${t('investments.header.title')} (Public)`
  }, [t])

  return (
    <InvestmentsDashboard
      initialSelectedYear={params.year || 'all'}
      initialSelectedMonth={params.month || 'all'}
      initialSearch={params.search || ''}
      initialSource={params.source || ''}
      initialViewMode={params.mode || ''}
      hideTimelineChart
      isPublicShare
    />
  )
}
