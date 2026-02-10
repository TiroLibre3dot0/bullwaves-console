import { useEffect, useMemo } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { trackPublicShareOpen } from '../../../utils/analytics'
import RankingPage from './RankingPage'

function readQueryParams() {
  if (typeof window === 'undefined') return {}
  try {
    const sp = new window.URLSearchParams(window.location.search || '')
    return {
      period: String(sp.get('period') || '').trim(),
      board: String(sp.get('board') || '').trim(),
      q: String(sp.get('q') || '').trim(),
    }
  } catch {
    return {}
  }
}

export default function PublicRankingSharePage() {
  const { t } = useI18n()

  const params = useMemo(() => readQueryParams(), [])

  useEffect(() => {
    trackPublicShareOpen({
      kind: 'ranking',
      token: '',
      generatedAt: '',
      extra: { period: params.period || '', board: params.board || '' },
    })
  }, [params.period, params.board])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = `${t('ranking.title')} (Public)`
  }, [t])

  return (
    <RankingPage
      publicMode
      initialPeriodId={params.period}
      initialBoardId={params.board}
      initialQuery={params.q}
    />
  )
}
