import React, { useEffect, useMemo, useState } from 'react'
import CardSection from '../../components/common/CardSection'
import { fetchCsvRowsCached, withReportsVersion } from '../../lib/fetchCache'
import { useI18n } from '../../i18n/I18nContext'
import { seedStories } from '../stories-kanban/storiesSeed'

function formatInt(n, locale) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat(locale || undefined).format(Math.round(x))
  } catch {
    return String(Math.round(x))
  }
}

function formatCurrencyEUR(n, locale) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(x)
  } catch {
    return `€${Math.round(x)}`
  }
}

function formatPct01(n, locale) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(x)
  } catch {
    return `${Math.round(x * 100)}%`
  }
}

function numLoose(s) {
  return parseFloat(String(s || '').replace(/[^0-9\.-]/g, '')) || 0
}

function numMaybe(s) {
  const raw = String(s ?? '').trim()
  if (!raw) return null
  const x = parseFloat(raw.replace(/[^0-9\.-]/g, ''))
  return Number.isFinite(x) ? x : null
}

function parseCohortDateLoose(s) {
  const raw = String(s ?? '')
    .trim()
    .replace(/^"|"$/g, '')
  if (!raw) return null
  const [datePart] = raw.split(' ')
  const bits = String(datePart || '')
    .split('/')
    .map((v) => Number(v))
  if (bits.length === 3 && bits.every((v) => Number.isFinite(v))) {
    const [m, d, y] = bits
    if (y >= 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d)
  }
  const t = Date.parse(raw)
  if (!Number.isNaN(t)) return new Date(t)
  return null
}

function formatMonthYear(d, locale) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat(locale || undefined, { month: 'short', year: 'numeric' }).format(
      d
    )
  } catch {
    return `${d.getMonth() + 1}/${d.getFullYear()}`
  }
}

function isSameLocalDay(a, b) {
  if (!(a instanceof Date) || Number.isNaN(a.getTime())) return false
  if (!(b instanceof Date) || Number.isNaN(b.getTime())) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0)
}

function formatWeekdayShort(d, locale) {
  try {
    return new Intl.DateTimeFormat(locale || undefined, { weekday: 'short' }).format(d)
  } catch {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] || ''
  }
}

function formatMonthDay(d, locale) {
  try {
    return new Intl.DateTimeFormat(locale || undefined, { day: '2-digit', month: 'short' }).format(
      d
    )
  } catch {
    return `${d.getDate()}/${d.getMonth() + 1}`
  }
}

function getValRow(r, keys) {
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(r, k)) return r[k]
  return ''
}

function toneAccent(tone) {
  // Strict 3-state system; we only show color when attention/risk is present.
  if (tone === 'critical') return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (tone === 'warning') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return null
}

const SENSITIVE_BLUR_STYLE = {
  filter: 'blur(7px)',
  opacity: 0.32,
  userSelect: 'none',
}

function MacroCard({
  label,
  primary,
  secondary,
  tone,
  onClick,
  hint,
  obscure = false,
  obscureLabel = 'Obscured',
}) {
  const accent = toneAccent(tone)
  const shouldObscurePrimary = obscure && primary != null && String(primary) !== '—'
  const shouldObscureSecondary = obscure && secondary != null && String(secondary) !== '—'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        width: '100%',
        borderRadius: 16,
        padding: 14,
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        position: 'relative',
        overflow: 'hidden',
      }}
      title={hint || label}
    >
      {accent ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderLeft: `3px solid ${accent.color}`,
            background: accent.bg,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            color: 'rgba(148,163,184,0.95)',
            fontSize: 11,
            fontWeight: 950,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 10,
            color: 'rgba(241,245,249,0.98)',
            fontSize: 26,
            fontWeight: 990,
            lineHeight: 1.05,
          }}
        >
          <span style={shouldObscurePrimary ? SENSITIVE_BLUR_STYLE : undefined}>{primary}</span>
        </div>
        <div
          style={{ marginTop: 8, color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 750 }}
        >
          <span style={shouldObscureSecondary ? SENSITIVE_BLUR_STYLE : undefined}>{secondary}</span>
        </div>
        {obscure ? (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.22)',
              background: 'rgba(2,6,23,0.35)',
              color: 'rgba(148,163,184,0.92)',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              pointerEvents: 'none',
            }}
          >
            {obscureLabel}
          </div>
        ) : null}
      </div>
    </button>
  )
}

function ProgressBar({ value }) {
  const v = Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : 0
  return (
    <div
      style={{
        height: 8,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(v * 100)}%`,
          height: '100%',
          background: 'rgba(226,232,240,0.22)',
        }}
      />
    </div>
  )
}

function riskTone(risk) {
  const r = String(risk || '').toLowerCase()
  if (r.includes('high')) return 'critical'
  return null
}

function StoryCard({ story, onOpenKanban, onOpenProjectBoard, labels }) {
  const tone = riskTone(story?.risk)
  const accent = toneAccent(tone)
  const pct = Number.isFinite(Number(story?.progress))
    ? Math.max(0, Math.min(1, Number(story.progress)))
    : 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenKanban?.(story?.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenKanban?.(story?.id)
        }
      }}
      style={{
        textAlign: 'left',
        width: '100%',
        borderRadius: 14,
        padding: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      title={story?.title}
    >
      {accent ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderLeft: `3px solid ${accent.color}`,
            background: accent.bg,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div
            style={{
              color: 'rgba(241,245,249,0.96)',
              fontWeight: 950,
              fontSize: 13,
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
            }}
          >
            {story?.title || '—'}
          </div>
          <div
            style={{ marginTop: 6, color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 750 }}
          >
            {labels?.owner || 'Owner'}: {story?.owner || '—'}
          </div>
        </div>

        <div>
          <ProgressBar value={pct} />
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              color: 'rgba(148,163,184,0.92)',
              fontSize: 12,
              fontWeight: 750,
            }}
          >
            <div>
              {labels?.progress
                ? labels.progress(Math.round(pct * 100))
                : `${Math.round(pct * 100)}% progress`}
            </div>
            {onOpenProjectBoard ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProjectBoard()
                }}
                style={{
                  padding: '6px 8px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'rgba(226,232,240,0.92)',
                  fontWeight: 850,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {labels?.openTasks || 'Open Tasks'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CommandCenterCockpit({
  onDrillDown,
  onOpenKanban,
  onOpenProjectBoard,
  embedded = false,
  publicMode = false,
}) {
  const { t, locale } = useI18n()
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [metrics, setMetrics] = useState(() => ({
    ftd: null,
    qftd: null,
    avgCpa: null,
    deposits: null,
    withdrawals: null,
    netDeposits: null,
    retentionCohort: null,
    retentionM1: null,
    retentionM3: null,
    reactivationCohort: null,
    reactivationM6: null,
    reactivationM9: null,
    updatedAt: null,
  }))

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const mediaUrl = withReportsVersion('/Media Report.csv')
        const rows = await fetchCsvRowsCached(mediaUrl, { force: false })
        if (cancelled) return

        if (!Array.isArray(rows) || !rows.length) return

        let ftdSum = 0
        let qftdSum = 0
        let totalCpa = 0
        let totalDeposits = 0
        let totalWithdrawals = 0
        let totalNetDeposits = 0

        rows.forEach((r) => {
          ftdSum += numLoose(getValRow(r, ['FTD', 'Ftd', 'ftd', 'ftd_count']))
          qftdSum += numLoose(getValRow(r, ['QFTD', 'Qftd', 'qftd']))
          totalCpa += numLoose(
            getValRow(r, ['CPA Commission', 'CPA_Commission', 'cpa_commission', 'cpa commission'])
          )
          totalDeposits += numLoose(getValRow(r, ['Deposits', 'deposits']))
          totalWithdrawals += numLoose(getValRow(r, ['Withdrawals', 'withdrawals']))
          totalNetDeposits += numLoose(
            getValRow(r, [
              'Net Deposits',
              'Net_Deposits',
              'net_deposits',
              'netDeposits',
              'NetDeposits',
            ])
          )
        })

        const avgCpa = ftdSum > 0 ? totalCpa / ftdSum : null

        setMetrics((prev) => ({
          ...prev,
          ftd: ftdSum,
          qftd: qftdSum,
          avgCpa,
          deposits: totalDeposits,
          withdrawals: totalWithdrawals,
          netDeposits: totalNetDeposits,
          updatedAt: new Date().toISOString(),
        }))
      } catch {
        // If Media Report isn't available, keep metrics in standby.
      }

      try {
        const cohortUrl = withReportsVersion(
          '/Cohort Analysis per churn analysis deposits count since 2024.csv'
        )
        const rows = await fetchCsvRowsCached(cohortUrl, { force: false })
        if (cancelled) return

        if (Array.isArray(rows) && rows.length) {
          const parsed = rows
            .map((r) => ({
              r,
              d: parseCohortDateLoose(getValRow(r, ['Cohort Date', 'CohortDate', 'cohort_date'])),
            }))
            .filter((x) => x.d && !Number.isNaN(x.d.getTime()))
            .sort((a, b) => b.d.getTime() - a.d.getTime())

          const getMonth = (row, idx) => {
            const v = getValRow(row, [`Month ${idx}`, `month ${idx}`, `Month${idx}`, `month${idx}`])
            return numMaybe(v)
          }

          const findLatestWith = (neededMonths) => {
            for (const x of parsed) {
              const m0 = getMonth(x.r, 0)
              if (m0 == null || m0 <= 0) continue
              let ok = true
              for (const k of neededMonths) {
                const mv = getMonth(x.r, k)
                if (mv == null) {
                  ok = false
                  break
                }
              }
              if (ok) return x
            }
            return null
          }

          const retentionRow = findLatestWith([1, 3])
          const reactivationRow = findLatestWith([6, 9])

          const buildRate = (x, monthIdx) => {
            if (!x) return null
            const m0 = getMonth(x.r, 0)
            const mk = getMonth(x.r, monthIdx)
            if (m0 == null || m0 <= 0) return null
            if (mk == null || mk < 0) return null
            return mk / m0
          }

          setMetrics((prev) => ({
            ...prev,
            retentionCohort: retentionRow ? formatMonthYear(retentionRow.d, locale) : null,
            retentionM1: buildRate(retentionRow, 1),
            retentionM3: buildRate(retentionRow, 3),
            reactivationCohort: reactivationRow ? formatMonthYear(reactivationRow.d, locale) : null,
            reactivationM6: buildRate(reactivationRow, 6),
            reactivationM9: buildRate(reactivationRow, 9),
            updatedAt: new Date().toISOString(),
          }))
        }
      } catch {
        // If cohort file isn't available, keep retention/reactivation in standby.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [locale])

  const stories = useMemo(() => seedStories({ locale }), [locale])

  const executionBuckets = useMemo(() => {
    const live = []
    const next = []
    const inProgress = []

    for (const s of stories) {
      const p = Number.isFinite(Number(s?.progress)) ? Number(s.progress) : 0
      const risk = String(s?.risk || '').toLowerCase()

      if (risk.includes('high')) {
        inProgress.push(s)
        continue
      }

      if (p >= 0.45) live.push(s)
      else if (p < 0.25) next.push(s)
      else inProgress.push(s)
    }

    const byProgressDesc = (a, b) =>
      (Number(b?.progress || 0) || 0) - (Number(a?.progress || 0) || 0)

    return {
      live: live.sort(byProgressDesc).slice(0, 2),
      next: next.sort(byProgressDesc).slice(0, 2),
      inProgress: inProgress.sort(byProgressDesc).slice(0, 3),
    }
  }, [stories])

  const withdrawalRatio = useMemo(() => {
    const dep = Number(metrics.deposits)
    const wd = Number(metrics.withdrawals)
    if (!Number.isFinite(dep) || dep <= 0) return null
    if (!Number.isFinite(wd) || wd < 0) return null
    return wd / dep
  }, [metrics.deposits, metrics.withdrawals])

  const qualifyRate = useMemo(() => {
    const f = Number(metrics.ftd)
    const q = Number(metrics.qftd)
    if (!Number.isFinite(f) || f <= 0) return null
    if (!Number.isFinite(q) || q < 0) return null
    return q / f
  }, [metrics.ftd, metrics.qftd])

  const macro = useMemo(() => {
    const cashflowTone =
      Number.isFinite(Number(withdrawalRatio)) && withdrawalRatio >= 1
        ? 'critical'
        : Number.isFinite(Number(withdrawalRatio)) && withdrawalRatio >= 0.8
          ? 'warning'
          : null

    const qualityTone =
      Number.isFinite(Number(qualifyRate)) && qualifyRate < 0.05 ? 'warning' : null

    return [
      {
        id: 'acq',
        label: t('commandCenter.macro.acq.label'),
        primary: formatInt(metrics.ftd, locale),
        secondary: t('commandCenter.macro.acq.secondary', {
          cpa: Number.isFinite(Number(metrics.avgCpa))
            ? formatCurrencyEUR(metrics.avgCpa, locale)
            : '—',
        }),
        tone: qualityTone,
        onClick: onDrillDown || onOpenKanban,
        hint: t('commandCenter.macro.acq.hint'),
      },
      {
        id: 'ret',
        label: t('commandCenter.macro.ret.label'),
        primary: metrics.retentionM1 == null ? '—' : formatPct01(metrics.retentionM1, locale),
        secondary: t('commandCenter.macro.ret.secondary', {
          m3: metrics.retentionM3 == null ? '—' : formatPct01(metrics.retentionM3, locale),
        }),
        tone: null,
        onClick: onDrillDown || onOpenKanban,
        hint: t('commandCenter.macro.ret.hint', {
          cohort: metrics.retentionCohort || '—',
        }),
      },
      {
        id: 'react',
        label: t('commandCenter.macro.reactivation.label'),
        primary: metrics.reactivationM6 == null ? '—' : formatPct01(metrics.reactivationM6, locale),
        secondary: t('commandCenter.macro.reactivation.secondary', {
          m9: metrics.reactivationM9 == null ? '—' : formatPct01(metrics.reactivationM9, locale),
        }),
        tone: null,
        onClick: onDrillDown || onOpenKanban,
        hint: t('commandCenter.macro.reactivation.hint', {
          cohort: metrics.reactivationCohort || '—',
        }),
      },
      {
        id: 'ops',
        label: t('commandCenter.macro.ops.label'),
        primary: formatCurrencyEUR(metrics.netDeposits, locale),
        secondary: t('commandCenter.macro.ops.secondary', {
          ratio: withdrawalRatio == null ? '—' : formatPct01(withdrawalRatio, locale),
        }),
        tone: cashflowTone,
        onClick: onDrillDown || onOpenKanban,
        hint: t('commandCenter.macro.ops.hint'),
      },
    ]
  }, [metrics, onDrillDown, onOpenKanban, qualifyRate, withdrawalRatio, t, locale])

  const timeline = useMemo(() => {
    const now = new Date(nowTs)
    const day = now.getDay() // 0 Sun ... 6 Sat

    // Anchor to the real workweek (Mon..Fri). If weekend, show next week's Mon..Fri.
    const base = new Date(now)
    if (day === 6) base.setDate(base.getDate() + 2)
    else if (day === 0) base.setDate(base.getDate() + 1)

    const baseDay = base.getDay() // 1..5 now
    const monday = new Date(base)
    monday.setDate(base.getDate() - (baseDay - 1))

    const schedule = [
      { key: 'mon', title: t('commandCenter.timeline.mon'), type: 'review' },
      { key: 'tue', title: t('commandCenter.timeline.tue'), type: 'approval' },
      { key: 'wed', title: t('commandCenter.timeline.wed'), type: 'delivery' },
      { key: 'thu', title: t('commandCenter.timeline.thu'), type: 'risk' },
      { key: 'fri', title: t('commandCenter.timeline.fri'), type: 'recap' },
    ]

    return schedule.map((s, idx) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + idx)
      return {
        ...s,
        date: d,
        label: formatWeekdayShort(d, locale),
        dateLabel: formatMonthDay(d, locale),
      }
    })
  }, [nowTs, t, locale])

  const controlTower = useMemo(() => {
    const signals = []

    if (Number.isFinite(Number(metrics.netDeposits)) && Number(metrics.netDeposits) < 0) {
      signals.push({
        tone: 'critical',
        text: t('commandCenter.control.signals.netDepositsNegative', {
          value: formatCurrencyEUR(metrics.netDeposits, locale),
        }),
      })
    }

    if (withdrawalRatio != null && withdrawalRatio >= 1) {
      signals.push({
        tone: 'critical',
        text: t('commandCenter.control.signals.withdrawalExceeded', {
          value: formatPct01(withdrawalRatio, locale),
        }),
      })
    } else if (withdrawalRatio != null && withdrawalRatio >= 0.8) {
      signals.push({
        tone: 'warning',
        text: t('commandCenter.control.signals.withdrawalHigh', {
          value: formatPct01(withdrawalRatio, locale),
        }),
      })
    }

    if (qualifyRate != null && qualifyRate < 0.05) {
      signals.push({
        tone: 'warning',
        text: t('commandCenter.control.signals.qualifyLow', {
          value: formatPct01(qualifyRate, locale),
        }),
      })
    }

    const atRisk = stories.filter((s) =>
      String(s?.risk || '')
        .toLowerCase()
        .includes('high')
    )
    if (atRisk.length) {
      signals.push({
        tone: 'critical',
        text: t('commandCenter.control.signals.executionAtRisk', {
          title: String(atRisk[0]?.title || '—'),
        }),
      })
    }

    const actions = []
    const orderedStories = [...stories].sort((a, b) => {
      const ar = String(a?.risk || '')
        .toLowerCase()
        .includes('high')
        ? 0
        : 1
      const br = String(b?.risk || '')
        .toLowerCase()
        .includes('high')
        ? 0
        : 1
      if (ar !== br) return ar - br
      return (Number(b?.progress || 0) || 0) - (Number(a?.progress || 0) || 0)
    })

    for (const s of orderedStories) {
      const dec = Array.isArray(s?.decisions) ? s.decisions : []
      for (const d of dec) {
        actions.push({
          tone: String(s?.risk || '')
            .toLowerCase()
            .includes('high')
            ? 'critical'
            : null,
          decision: String(d?.text || d || '').trim(),
          owner: String(d?.owner || '—').trim(),
          story: String(s?.title || '—').trim(),
        })
      }
    }

    return {
      signals: signals.slice(0, 3),
      actions: actions.slice(0, 3),
    }
  }, [metrics.netDeposits, qualifyRate, stories, withdrawalRatio, t, locale])

  return (
    <div style={{ padding: embedded ? 0 : 24 }}>
      {embedded ? null : (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              color: 'rgba(148,163,184,0.95)',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.2,
            }}
          >
            {t('commandCenter.header.topline')}
          </div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#fff' }}>
            {t('commandCenter.header.title')}
          </div>
          <div
            style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 650, fontSize: 12 }}
          >
            {t('commandCenter.header.subtitle')}
          </div>
        </div>
      )}

      {/* 1) SYSTEM STATUS */}
      <CardSection
        title={t('commandCenter.sections.systemStatus.title')}
        subtitle={t('commandCenter.sections.systemStatus.subtitle')}
        background="rgba(255,255,255,0.00)"
      >
        <div
          className="cc-macro-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          {macro.map((m) => (
            <MacroCard
              key={m.id}
              label={m.label}
              primary={m.primary}
              secondary={m.secondary}
              tone={m.tone}
              onClick={m.onClick}
              hint={m.hint}
              obscure={publicMode}
              obscureLabel={t('common.obscured')}
            />
          ))}
        </div>
        <div
          style={{ marginTop: 10, color: 'rgba(148,163,184,0.82)', fontSize: 12, fontWeight: 650 }}
        >
          {t('commandCenter.updated')}{' '}
          {metrics.updatedAt
            ? new Date(metrics.updatedAt).toLocaleString(locale || undefined)
            : '—'}
        </div>
      </CardSection>

      {/* 2) STRATEGIC EXECUTION */}
      <div style={{ marginTop: 12 }}>
        <CardSection
          title={t('commandCenter.sections.execution.title')}
          subtitle={t('commandCenter.sections.execution.subtitle')}
          background="rgba(255,255,255,0.00)"
        >
          <div
            className="cc-exec-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}
          >
            {[
              {
                key: 'live',
                label: t('commandCenter.executionBuckets.live'),
                items: executionBuckets.live,
              },
              {
                key: 'next',
                label: t('commandCenter.executionBuckets.next'),
                items: executionBuckets.next,
              },
              {
                key: 'ip',
                label: t('commandCenter.executionBuckets.inProgress'),
                items: executionBuckets.inProgress,
              },
            ].map((col) => (
              <div
                key={col.key}
                style={{
                  borderRadius: 16,
                  padding: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <div
                  style={{
                    color: 'rgba(148,163,184,0.95)',
                    fontSize: 11,
                    fontWeight: 950,
                    letterSpacing: 0.6,
                  }}
                >
                  {col.label}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(col.items || []).map((s) => (
                    <StoryCard
                      key={s.id}
                      story={s}
                      onOpenKanban={onOpenKanban || onDrillDown}
                      onOpenProjectBoard={onOpenProjectBoard}
                      labels={{
                        owner: t('common.owner'),
                        progress: (pct) => t('commandCenter.story.progress', { pct }),
                        openTasks: t('commandCenter.story.openTasks'),
                      }}
                    />
                  ))}
                  {(col.items || []).length ? null : (
                    <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 750 }}>
                      —
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardSection>
      </div>

      {/* 3) WEEKLY TIMELINE */}
      <div style={{ marginTop: 12 }}>
        <CardSection
          title={t('commandCenter.sections.timeline.title')}
          subtitle={t('commandCenter.sections.timeline.subtitle')}
          background="rgba(255,255,255,0.00)"
        >
          <div
            className="cc-timeline-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            {timeline.map((day) => {
              const now = new Date(nowTs)
              const isToday = isSameLocalDay(day.date, now)
              const isDecisionDay = day.type === 'approval' || day.type === 'risk'
              const accent =
                isToday && isDecisionDay
                  ? day.type === 'risk'
                    ? toneAccent('critical')
                    : toneAccent('warning')
                  : null
              const todayNeutralAccent =
                isToday && !accent
                  ? { color: 'rgba(226,232,240,0.55)', bg: 'rgba(226,232,240,0.06)' }
                  : null

              const dayProgress = (() => {
                if (!isToday) return null
                const start = startOfLocalDay(now)
                const end = endOfLocalDay(now)
                const denom = end.getTime() - start.getTime()
                if (denom <= 0) return null
                const v = (now.getTime() - start.getTime()) / denom
                return Math.max(0, Math.min(1, v))
              })()

              return (
                <div
                  key={day.key}
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    border: isToday
                      ? '1px solid rgba(226,232,240,0.60)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: isToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)',
                    boxShadow: isToday ? '0 14px 42px rgba(0,0,0,0.35)' : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {accent ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderLeft: `3px solid ${accent.color}`,
                        background: accent.bg,
                        pointerEvents: 'none',
                      }}
                    />
                  ) : todayNeutralAccent ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderLeft: `3px solid ${todayNeutralAccent.color}`,
                        background: todayNeutralAccent.bg,
                        pointerEvents: 'none',
                      }}
                    />
                  ) : null}
                  <div style={{ position: 'relative' }}>
                    <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                      {day.label} · {day.dateLabel}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        color: 'rgba(241,245,249,0.96)',
                        fontSize: 13,
                        fontWeight: 900,
                        lineHeight: 1.2,
                      }}
                    >
                      {day.title}
                    </div>
                    {isToday ? (
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{ color: 'rgba(226,232,240,0.92)', fontSize: 12, fontWeight: 950 }}
                        >
                          Today
                        </div>
                        <div
                          style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 850 }}
                        >
                          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : null}

                    {isToday && dayProgress != null ? (
                      <div style={{ marginTop: 10 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              color: 'rgba(148,163,184,0.92)',
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          >
                            {t('commandCenter.timeline.dayProgressLabel')}
                          </div>
                          <div
                            style={{
                              color: 'rgba(226,232,240,0.60)',
                              fontSize: 11,
                              fontWeight: 900,
                            }}
                          >
                            {Math.round(dayProgress * 100)}%
                          </div>
                        </div>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.10)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                            marginTop: 6,
                          }}
                          aria-hidden="true"
                        >
                          <div
                            style={{
                              width: `${Math.round(dayProgress * 100)}%`,
                              height: '100%',
                              background: 'rgba(226,232,240,0.55)',
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardSection>
      </div>

      {/* 4) CONTROL TOWER */}
      <div style={{ marginTop: 12 }}>
        <CardSection
          title={t('commandCenter.sections.control.title')}
          subtitle={t('commandCenter.sections.control.subtitle')}
          background="rgba(255,255,255,0.00)"
        >
          <div
            className="cc-control-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div
              style={{
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <div
                style={{
                  color: 'rgba(148,163,184,0.95)',
                  fontSize: 11,
                  fontWeight: 950,
                  letterSpacing: 0.6,
                }}
              >
                {t('commandCenter.control.criticalSignals')}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {controlTower.signals.length ? (
                  controlTower.signals.map((s, idx) => {
                    const accent = toneAccent(s.tone)
                    const isSensitiveSignal = publicMode && /[0-9]|€|%/.test(String(s?.text || ''))
                    return (
                      <div
                        key={idx}
                        style={{
                          borderRadius: 14,
                          padding: 10,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.02)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {accent ? (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderLeft: `3px solid ${accent.color}`,
                              background: accent.bg,
                              pointerEvents: 'none',
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            position: 'relative',
                            color: 'rgba(241,245,249,0.92)',
                            fontSize: 12,
                            fontWeight: 800,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          <span style={isSensitiveSignal ? SENSITIVE_BLUR_STYLE : undefined}>
                            {s.text}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 750 }}>
                    —
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              <div
                style={{
                  color: 'rgba(148,163,184,0.95)',
                  fontSize: 11,
                  fontWeight: 950,
                  letterSpacing: 0.6,
                }}
              >
                {t('commandCenter.control.actionsRequired')}
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {controlTower.actions.length ? (
                  controlTower.actions.map((a, idx) => {
                    const accent = toneAccent(a.tone)
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => (onOpenKanban || onDrillDown)?.()}
                        style={{
                          textAlign: 'left',
                          borderRadius: 14,
                          padding: 10,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {accent ? (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderLeft: `3px solid ${accent.color}`,
                              background: accent.bg,
                              pointerEvents: 'none',
                            }}
                          />
                        ) : null}
                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              color: 'rgba(241,245,249,0.96)',
                              fontSize: 12,
                              fontWeight: 900,
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {a.decision || '—'}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              color: 'rgba(148,163,184,0.92)',
                              fontSize: 12,
                              fontWeight: 750,
                            }}
                          >
                            {t('common.owner')}: {a.owner} • {t('commandCenter.control.linked')}:{' '}
                            {a.story}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 750 }}>
                    —
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardSection>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .cc-macro-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .cc-exec-grid { grid-template-columns: 1fr !important; }
          .cc-timeline-grid { grid-template-columns: 1fr !important; }
          .cc-control-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
