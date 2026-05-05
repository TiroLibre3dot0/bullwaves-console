/**
 * acuityFetch.js
 * Server-side helper: authenticates with Acuity Trading API and fetches
 * live data for each email journey template.
 *
 * Auth: POST https://api.acuitytrading.com/token  (username + password → Bearer)
 * Token is cached in memory (valid 14 days; refreshed 1 h early on restart).
 *
 * Required env vars:
 *   ACUITY_API_USERNAME
 *   ACUITY_API_PASSWORD
 */

const dotenv = require('dotenv')
const path = require('path')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server.local'),
  override: false,
})

const ACUITY_BASE = 'https://api.acuitytrading.com'
const LANG_EN = 'en-gb'

// ─── Token cache ──────────────────────────────────────────────────────────────
let _token = null
let _tokenExpiry = 0

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token

  const username = process.env.ACUITY_API_USERNAME
  const password = process.env.ACUITY_API_PASSWORD
  if (!username || !password) {
    throw new Error('ACUITY_API_USERNAME / ACUITY_API_PASSWORD not set in env')
  }

  const body = `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  const res = await fetch(`${ACUITY_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Acuity auth failed: ${res.status} – ${text}`)
  }

  const data = await res.json()
  _token = data.access_token
  // Expire 1 hour before actual expiry to avoid edge cases
  _tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000
  return _token
}

async function acuityPost(endpoint, body) {
  const token = await getToken()
  const res = await fetch(`${ACUITY_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Acuity ${endpoint} → ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatPrice(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
}

function truncate(text, max = 220) {
  if (!text) return ''
  text = text.replace(/\s+/g, ' ').trim()
  return text.length <= max ? text : text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

/** Strip Acuity markdown artifacts (###, $$, **, __) from article text */
function stripAcuityMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s*/g, '')     // remove ### headers
    .replace(/\$\$+/g, ' — ')     // $$ separators → em dash
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')  // **bold**
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')    // __italic__
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ─── Per-journey fetchers ──────────────────────────────────────────────────────

/**
 * Market Pulse
 * → latest macroeconomic/FX article (Market Companion) + sentiment for top asset
 * 
 * Graceful fallback: if /api/marketinsights fails (403, etc.), 
 * continues with sentiment using default ticker (EURUSD)
 */
async function fetchMarketPulseData() {
  const start = daysAgo(7)
  // EndDate must be in the future: API filters by event_date, not publication date
  const end = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10) })()

  let newsTitle = '—'
  let newsSummary = '—'
  let rawTicker = 'EURUSD'
  let acuityId = 50  // EURUSD default
  let marketInsightsError = null

  // 1. Try to fetch latest macro/FX news article (Market Companion)
  try {
    const newsItems = await acuityPost('/api/marketinsights', {
      StartDate: start,
      EndDate: end,
      // Market Companion entitlement on Bullwaves account is EN-only.
      LanguageCode: LANG_EN,
      ArticleTypes: ['macroeconomicAsset'],
      Count: 5,
    })

    if (Array.isArray(newsItems) && newsItems.length > 0) {
      const article = newsItems[0]
      newsTitle = stripAcuityMarkdown(article.headline || article.summary?.slice(0, 100) || '—')
      newsSummary = truncate(stripAcuityMarkdown(article.summary || ''), 220)
      rawTicker = article.symbol || 'EURUSD'
      acuityId = article.acuity_id || 50
    }
  } catch (err) {
    // Market insights failed (403, etc.); log but continue with defaults
    marketInsightsError = err.message
    console.warn('[Market Pulse] /api/marketinsights unavailable:', marketInsightsError)
  }

  const assetTicker = rawTicker.replace('/', '')

  // 2. Fetch sentiment (Percentage Positivity – Bullish) for the asset
  let sentimentScore = '—'
  let sentimentLabel = '—'

  try {
    const sentData = await acuityPost('/api/percentagepositivity/multiassets', {
      AssetIds: [acuityId],
      SentimentTypeId: 13, // Bullish
      Period: 1,            // Daily
    })
    // Response is array: [{ AssetId, Value }]
    const row = Array.isArray(sentData) ? sentData[0] : null
    const rawVal = row?.Value ?? row?.LastIndex   // field name varies by endpoint
    if (rawVal != null) {
      sentimentScore = Math.round(rawVal).toString()
      sentimentLabel = rawVal >= 60 ? 'Bullish' : rawVal <= 40 ? 'Bearish' : 'Neutral'
    }
  } catch (_) {
    // Sentiment is optional; keep defaults
  }

  const result = {
    '{{date}}': formatDate(today()),
    '{{asset_ticker}}': assetTicker,
    '{{sentiment_score}}': sentimentScore,
    '{{sentiment_label}}': sentimentLabel,
    '{{unsubscribe}}': '#',
  }

  // Only include news fields if we actually got data (don't override SAMPLE with '—')
  if (!marketInsightsError) {
    result['{{news_title}}'] = newsTitle
    result['{{news_summary}}'] = newsSummary
  }

  return result
}

/**
 * Trade Alert
 * → most recent signal from SignalCentre (live or expired as fallback)
 *
 * Field mapping (confirmed via API):
 *   ticker      → r.market_id (e.g. 'LTCUSD')
 *   direction   → r.action_text ('BUY' / 'SELL')
 *   entry price → r.buy_entry_target_1 or r.sell_entry_target_1
 *   take profit → r.buy_target_1 or r.sell_target_1
 *   stop loss   → r.stop
 *   period      → s.Period.slug (top-level object, not r.period)
 */
async function fetchTradeAlertData() {
  // Widen to 30 days + include expired so there is always at least one signal
  const signals = await acuityPost('/api/signalcentrereports', {
    StartDate: daysAgo(30),
    EndDate: today(),
    LanguageCode: LANG_EN,
    Period: 'intraday',
    IncludeExpired: true,
    Count: 50,
  })

  if (!Array.isArray(signals) || signals.length === 0) {
    return null // No data at all; caller falls back to sample
  }

  // Prefer a non-expired signal (is_closed === 0); fall back to most recent
  const live = signals.find(s => s.Report && s.Report.is_closed === 0) || signals[0]

  if (!live || !live.Report) {
    return null
  }

  const r = live.Report
  const isBuy = r.action === 0
  const direction = r.action_text || (isBuy ? 'BUY' : 'SELL')
  const ticker = r.market_id || live.Product?.market_id_name || '—'
  const confidence = r.confidence != null ? Math.round(r.confidence) : '—'
  // Entry: direction-specific field; fall back to entry_lower_bound
  const entry = isBuy
    ? (r.buy_entry_target_1 ?? r.entry_lower_bound)
    : (r.sell_entry_target_1 ?? r.entry_upper_bound)
  const tp = isBuy ? r.buy_target_1 : r.sell_target_1
  const sl = r.stop
  const periodObj = live.Period || {}
  const period = periodObj.slug || periodObj.name || 'intraday'

  return {
    '{{alert_direction}}': direction,
    '{{alert_asset}}': ticker,
    '{{alert_probability}}': confidence.toString(),
    '{{signal_entry}}': formatPrice(entry),
    '{{signal_tp}}': formatPrice(tp),
    '{{signal_sl}}': formatPrice(sl),
    '{{signal_period}}': period,
    '{{unsubscribe}}': '#',
  }
}

/**
 * Weekly Opportunity
 * → top 3 most recent signals, one per asset (by signal confidence)
 *
 * Same field mapping as fetchTradeAlertData (market_id for ticker, etc.)
 */
async function fetchWeeklyOpportunityData() {
  const signals = await acuityPost('/api/signalcentrereports', {
    StartDate: daysAgo(30),
    EndDate: today(),
    LanguageCode: LANG_EN,
    Period: 'intraday',
    IncludeExpired: true,
    Count: 100,
  })

  if (!Array.isArray(signals) || signals.length === 0) return null

  // Deduplicate: one signal per ticker (market_id), pick highest confidence
  const byTicker = {}
  for (const s of signals) {
    if (!s.Report) continue
    const ticker = s.Report.market_id || s.Product?.market_id_name || ''
    if (!ticker) continue
    const conf = s.Report.confidence ?? 0
    if (!byTicker[ticker] || conf > byTicker[ticker].conf) {
      byTicker[ticker] = { s, conf }
    }
  }

  const top3 = Object.values(byTicker)
    .sort((a, b) => b.conf - a.conf)
    .slice(0, 3)
    .map(({ s }) => s)

  if (top3.length < 1) return null

  function assetVars(s, n) {
    if (!s) return { [`{{asset_${n}_ticker}}`]: '—', [`{{asset_${n}_score}}`]: '—', [`{{asset_${n}_rating}}`]: '—', [`{{asset_${n}_positivity}}`]: '—' }
    const r = s.Report
    return {
      [`{{asset_${n}_ticker}}`]: r.market_id || s.Product?.market_id_name || '—',
      [`{{asset_${n}_score}}`]: r.confidence != null ? Math.round(r.confidence).toString() : '—',
      [`{{asset_${n}_rating}}`]: r.action_text || (r.action === 0 ? 'BUY' : r.action === 1 ? 'SELL' : 'HOLD'),
      [`{{asset_${n}_positivity}}`]: r.confidence != null ? Math.round(r.confidence * 0.9).toString() : '—',
    }
  }

  const weekLabel = `Week of ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`

  return {
    '{{week_label}}': weekLabel,
    ...assetVars(top3[0], 1),
    ...assetVars(top3[1], 2),
    ...assetVars(top3[2], 3),
    '{{unsubscribe}}': '#',
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch live Acuity data for a given journey ID.
 * Returns a `{ '{{variable}}': 'value', ... }` map, or null if unavailable.
 */
async function fetchLiveData(journeyId) {
  switch (journeyId) {
    case 'market-pulse':
      return fetchMarketPulseData()
    case 'trade-alert':
      return fetchTradeAlertData()
    case 'weekly-opportunity':
      return fetchWeeklyOpportunityData()
    default:
      return null
  }
}

module.exports = { fetchLiveData }
