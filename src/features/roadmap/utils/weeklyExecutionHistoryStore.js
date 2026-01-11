const STORAGE_KEY = 'bw_weekly_execution_history_v1'

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function toIsoDate(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

const URL_BY_DONE_TEXT = {
  'Solitics kick-off completed; onboarding activated':
    'https://solitics-ltd.monday.com/boards/5089697723/views/41153755',
  'Trading platform overview shared via email':
    'https://trading-platform-self-two.vercel.app/trade',
  'Support User Check tool': 'https://bullwaves-console.vercel.app/support/user-check',
  'Designed and implemented the Support User Check tool':
    'https://bullwaves-console.vercel.app/support/user-check',
  'Completed MetaTrader Web integration': 'https://portal.bullwaves.com/custom/webtrader',
  'Completed Social Trading integration':
    'https://portal.bullwaves.com/brokeree-social-trading-three',
}

export function getHistoryWeekEnd(weekStart) {
  return addDays(weekStart, 6)
}

function normalizeEntry(item) {
  if (!item) return null
  if (typeof item === 'string') return { text: item }
  if (typeof item === 'object') {
    const text = String(item.text || '').trim()
    if (!text) return null
    const url = item.url ? String(item.url).trim() : ''
    if (url) return { text, url }

    const enrichedUrl = URL_BY_DONE_TEXT[text]
    return enrichedUrl ? { text, url: enrichedUrl } : { text }
  }
  return null
}

export const DEFAULT_WEEKLY_EXECUTION_HISTORY = {
  version: 1,
  weeks: {
    // Week starting Monday, 8 December 2025
    '2025-12-08': {
      week_start: '2025-12-08',
      week_end: '2025-12-14',
      planned: ['Review existing reports and understand data flows'],
      done: [
        'Downloaded and analyzed Media, Registration, and Payment reports',
        'Built an internal console to process data',
        'Extracted initial affiliate KPIs for internal visibility',
      ],
    },

    // Week starting Monday, 15 December 2025
    '2025-12-15': {
      week_start: '2025-12-15',
      week_end: '2025-12-21',
      planned: ['Platform integrations (trading)'],
      done: [
        {
          text: 'Completed MetaTrader Web integration',
          url: 'https://portal.bullwaves.com/custom/webtrader',
        },
        {
          text: 'Completed Social Trading integration',
          url: 'https://portal.bullwaves.com/brokeree-social-trading-three',
        },
        'Coordinated with Scale and Brokeree to resolve integration complexities',
      ],
    },

    // Week starting Monday, 22 December 2025
    '2025-12-22': {
      week_start: '2025-12-22',
      week_end: '2025-12-28',
      planned: ['Improve operational visibility for support'],
      done: [
        {
          text: 'Designed and implemented the Support User Check tool',
          url: 'https://bullwaves-console.vercel.app/support/user-check',
        },
        'Integrated it into the operational workflow',
      ],
    },

    // Week starting Sunday, 4 January 2026 (kept aligned with operational week selector style)
    '2026-01-04': {
      week_start: '2026-01-04',
      week_end: '2026-01-10',
      planned: ['Solitics onboarding and retention setup', 'AML and compliance execution'],
      done: [
        {
          text: 'Solitics kick-off completed; onboarding activated',
          url: 'https://solitics-ltd.monday.com/boards/5089697723/views/41153755',
        },
        'Retention alignment completed; owners and next steps defined',
        'Compliance sync completed (risk scoring + KYC improvements)',
        {
          text: 'Trading platform overview shared via email',
          url: 'https://trading-platform-self-two.vercel.app/trade',
        },
        'First month invoice issued and sent',
      ],
    },
  },
}

export function loadWeeklyExecutionHistory() {
  if (typeof window === 'undefined') return DEFAULT_WEEKLY_EXECUTION_HISTORY

  const raw = window.localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? safeJsonParse(raw, null) : null

  const merged = {
    ...(DEFAULT_WEEKLY_EXECUTION_HISTORY || { version: 1, weeks: {} }),
    ...(parsed && typeof parsed === 'object' ? parsed : {}),
    version: 1,
    weeks: {
      ...(DEFAULT_WEEKLY_EXECUTION_HISTORY.weeks || {}),
      ...((parsed && parsed.weeks && typeof parsed.weeks === 'object' && parsed.weeks) || {}),
    },
  }

  // Ensure every entry has an end date.
  Object.keys(merged.weeks || {}).forEach((weekStart) => {
    const w = merged.weeks[weekStart]
    if (!w) return
    merged.weeks[weekStart] = {
      ...w,
      week_start: w.week_start || weekStart,
      week_end: w.week_end || getHistoryWeekEnd(w.week_start || weekStart),
      planned: Array.isArray(w.planned) ? w.planned.map(normalizeEntry).filter(Boolean) : [],
      done: Array.isArray(w.done) ? w.done.map(normalizeEntry).filter(Boolean) : [],
    }
  })

  saveWeeklyExecutionHistory(merged)
  return merged
}

export function saveWeeklyExecutionHistory(store) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

export function listHistoryWeeks(store) {
  const weeks = store?.weeks
  if (!weeks || typeof weeks !== 'object') return []
  return Object.keys(weeks)
    .sort((a, b) => b.localeCompare(a))
    .map((k) => weeks[k])
    .filter(Boolean)
}
