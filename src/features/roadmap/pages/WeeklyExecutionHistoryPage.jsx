import React, { useMemo } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { listHistoryWeeks, loadWeeklyExecutionHistory } from '../utils/weeklyExecutionHistoryStore'

export default function WeeklyExecutionHistoryPage({ storeOverride = null }) {
  const { t } = useI18n()

  const store = useMemo(() => storeOverride || loadWeeklyExecutionHistory(), [storeOverride])
  const weeks = useMemo(() => listHistoryWeeks(store), [store])

  const weeksAsc = useMemo(() => {
    return [...weeks].sort((a, b) => String(a.week_start).localeCompare(String(b.week_start)))
  }, [weeks])

  const linkMeta = (url, text) => {
    const u = String(url || '').toLowerCase()
    const tText = String(text || '').toLowerCase()

    if (u.includes('monday.com') || tText.includes('solitics')) {
      return { label: 'Solitics', color: 'var(--success)', shadow: 'var(--shadow-glow-success)' }
    }
    if (u.includes('trading-platform') || u.includes('/trade')) {
      return { label: 'Trading', color: 'var(--accent-primary)', shadow: 'var(--shadow-glow)' }
    }
    if (u.includes('/support/user-check')) {
      return { label: 'Console', color: 'var(--warning)', shadow: 'var(--shadow-glow-warning)' }
    }
    if (u.includes('/custom/webtrader')) {
      return { label: 'MT Web', color: 'var(--info)', shadow: 'var(--shadow-glow)' }
    }
    if (u.includes('brokeree-social-trading')) {
      return { label: 'Social', color: 'var(--accent-secondary)', shadow: 'var(--shadow-glow)' }
    }

    return { label: 'Open', color: 'var(--accent-secondary)', shadow: 'var(--shadow-glow)' }
  }

  const pillStyle = (color, shadow) => ({
    padding: '6px 10px',
    fontSize: 12,
    lineHeight: 1.2,
    borderRadius: 999,
    border: `1px solid color-mix(in srgb, ${color} 45%, rgba(255,255,255,0.08))`,
    background: `linear-gradient(135deg, color-mix(in srgb, ${color} 35%, var(--card)) 0%, color-mix(in srgb, ${color} 12%, var(--card)) 100%)`,
    color: 'var(--text)',
    boxShadow: shadow,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  })

  const sectionStyle = (accent) => ({
    padding: 12,
    borderRadius: 14,
    border: `1px solid color-mix(in srgb, ${accent} 35%, var(--border))`,
    background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 12%, var(--card)) 0%, var(--card) 70%)`,
  })

  const renderEntry = (entry) => {
    const item = typeof entry === 'string' ? { text: entry } : entry
    const text = String(item?.text || '').trim()
    const url = item?.url ? String(item.url).trim() : ''
    if (!text) return null

    const meta = url ? linkMeta(url, text) : null

    return (
      <div
        key={url ? `${text}|${url}` : text}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'color-mix(in srgb, var(--accent) 6%, var(--card))',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45, flex: '1 1 auto' }}>
          • {text}
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ ...pillStyle(meta.color, meta.shadow), flex: '0 0 auto' }}
          >
            {meta.label}
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <p className="ongoing-label">{t('weeklyExecutionHistory.header.label')}</p>
          <h3 className="ongoing-feed-title" style={{ marginBottom: 2 }}>
            {t('weeklyExecutionHistory.header.title')}
          </h3>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {t('weeklyExecutionHistory.header.subtitle')}
          </div>
        </div>
      </div>

      {!weeksAsc.length ? (
        <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 13 }}>
          {t('weeklyExecutionHistory.empty')}
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {weeksAsc.map((week, idx) => {
            const ordinal = `${idx + 1}°`
            return (
              <div
                key={week.week_start}
                className="card"
                style={{
                  padding: 14,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background:
                    'linear-gradient(135deg, rgba(34,211,238,0.05), rgba(34,211,238,0.01))',
                  borderRadius: 16,
                }}
              >
                <div
                  className="ongoing-counter-pill"
                  style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center' }}
                >
                  <span className="pill-dot dot-progress" aria-hidden="true" />
                  <span style={{ fontWeight: 900 }}>{ordinal}</span>
                  <span className="pill-sep">&middot;</span>
                  <span>
                    {t('weeklyExecutionHistory.header.weekRange', {
                      start: week.week_start,
                      end: week.week_end,
                    })}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 12,
                    alignItems: 'start',
                  }}
                >
                  <section className="card" style={sectionStyle('var(--info)')}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>
                      {t('weeklyExecutionHistory.sections.planned')}
                    </div>
                    {week.planned?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {week.planned.map(renderEntry)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>—</div>
                    )}
                  </section>

                  <section className="card" style={sectionStyle('var(--success)')}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>
                      {t('weeklyExecutionHistory.sections.done')}
                    </div>
                    {week.done?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {week.done.map(renderEntry)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>—</div>
                    )}
                  </section>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
