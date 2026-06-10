import { useState, useCallback, useEffect } from 'react'

// ─── Test contacts (management, excl. Filippo & Tamara) ───────────────────────

const TEST_CONTACTS = [
  { id: 'emanuele', name: 'Emanuele Braha', email: 'affiliates@bullwaves.com', role: 'COO' },
  {
    id: 'francesco',
    name: 'Francesco Ceccarini',
    email: 'francesco@bullwaves.com',
    role: 'Shareholder',
  },
  { id: 'renato', name: 'Renato Pezzi', email: 'renato@bullwaves.com', role: 'Shareholder' },
  { id: 'stefan', name: 'Stefan Popovski', email: 'partners@bullwaves.com', role: 'Shareholder' },
  { id: 'paolo', name: 'Paolo Vullo', email: 'paolo.v@bullwaves.com', role: 'Head of Operations' },
  { id: 'daniel', name: 'Daniel', email: 'daniel.t@bullwaves.com', role: 'Marketing' },
  {
    id: 'chrystalla',
    name: 'Chrystalla',
    email: 'chrystalla.zezou@bullwaves.com',
    role: 'Marketing',
  },
]

// ─── Data ────────────────────────────────────────────────────────────────────

const JOURNEYS = [
  {
    id: 'acuity-visual-46',
    name: 'Acuity Visual #46',
    cadence: 'Editoriale · Manuale / Sync SendGrid',
    description:
      'Template visuale Acuity con 4 pannelli stacked e CTA al portale Bullwaves, ora gestito direttamente dentro Acuity Lab.',
    trigger: 'Manuale – campaign launch o resend da Acuity Lab',
    channel: 'Email',
    source: ['Acuity image pack', 'Portal CTAs', 'SendGrid'],
    tags: ['acuity', 'visual', 'campaign'],
    color: 'sky',
    steps: [
      { label: 'Carica visual', note: 'Logo + 4 pannelli Acuity', icon: 'fetch' },
      { label: 'Verifica CTA', note: 'analysis, news, assets, calendar', icon: 'filter' },
      { label: 'Preview HTML', note: 'Controllo rendering email', icon: 'compose' },
      { label: 'Sync SendGrid', note: 'Template pronto per invio', icon: 'send' },
    ],
    template: {
      subject: 'Key Moves Traders Should Watch This Week',
      preview: 'Hero Acuity + 4 insight panels con CTA al portale Bullwaves',
      body: [
        { type: 'header', text: 'Acuity campaign layout' },
        {
          type: 'text',
          text: 'Template visuale statico con immagini Acuity Trading, footer compliance e CTA dirette al portale Bullwaves.',
        },
        {
          type: 'cta',
          text: 'Access Insights Now',
          note: '→ portal.bullwaves.com/acuity/analysis-iq',
        },
        { type: 'cta', text: 'Spot the Trends', note: '→ portal.bullwaves.com/acuity/news-iq' },
        {
          type: 'cta',
          text: 'Access the Charts',
          note: '→ portal.bullwaves.com/acuity/assets-overview',
        },
        {
          type: 'cta',
          text: "See This Week's Calendar",
          note: '→ portal.bullwaves.com/acuity/calendar',
        },
      ],
    },
  },
  {
    id: 'acuity-calendar',
    name: 'Acuity Calendar',
    cadence: 'Editoriale · Manuale / Sync SendGrid',
    description:
      'Template visuale statico dedicato al calendario Acuity, con sequenza stacked di pannelli e branding Bullwaves.',
    trigger: 'Manuale – campaign launch o resend da Acuity Lab',
    channel: 'Email',
    source: ['Acuity image pack', 'Calendar visuals', 'SendGrid'],
    tags: ['acuity', 'calendar', 'visual'],
    color: 'sky',
    steps: [
      { label: 'Carica visual', note: 'Logo + 5 pannelli calendario', icon: 'fetch' },
      { label: 'Verifica ordine', note: 'Sequenza logo, 2, 4, 6, 8, 10', icon: 'filter' },
      { label: 'Preview HTML', note: 'Controllo rendering email', icon: 'compose' },
      { label: 'Sync SendGrid', note: 'Template pronto per invio', icon: 'send' },
    ],
    template: {
      subject: "This Week's Market Calendar at a Glance",
      preview: 'Logo Bullwaves + 5 pannelli verticali del calendario Acuity',
      body: [
        { type: 'header', text: 'Acuity calendar layout' },
        {
          type: 'text',
          text: 'Template visuale statico con pack immagini Acuity dedicato al calendario, ottimizzato per preview e sync diretto da Acuity Lab.',
        },
        {
          type: 'text',
          text: 'Stack immagini: logo, 2.png, 4.png, 6.png, 8.png, 10.png.',
        },
      ],
    },
  },
  {
    id: 'market-pulse',
    name: 'Market Pulse',
    cadence: 'Giornaliero · 08:30',
    description:
      "Digest quotidiano con la news più rilevante del giorno e il sentiment sull'asset più discusso.",
    trigger: 'Scheduled – ogni giorno feriale alle 08:30',
    channel: 'Email',
    source: ['AcuityNews', 'Sentiments'],
    tags: ['news', 'sentiment'],
    color: 'sky',
    steps: [
      { label: 'Trigger', note: '08:30 ogni giorno feriale', icon: 'clock' },
      { label: 'Fetch AcuityNews', note: 'Top news in lingua EN/IT', icon: 'fetch' },
      { label: 'Fetch Sentiments', note: 'Score Bullishness asset top', icon: 'fetch' },
      { label: 'Componi template', note: 'Inietta variabili in SendGrid', icon: 'compose' },
      { label: 'Invia email', note: 'Lista: All Active Traders', icon: 'send' },
    ],
    template: {
      subject: '📈 Market Pulse – {{date}}',
      preview: 'Il mercato oggi: {{news_title}}',
      body: [
        { type: 'header', text: 'Il mercato oggi' },
        { type: 'variable-block', label: '{{news_title}}', desc: 'AcuityNews → title' },
        { type: 'text', text: "Ecco il riassunto dell'analisi di oggi:" },
        {
          type: 'variable-block',
          label: '{{news_summary}}',
          desc: 'AcuityNews → summary (≤220 char)',
        },
        { type: 'divider' },
        {
          type: 'sentiment-chip',
          asset: '{{asset_ticker}}',
          score: '{{sentiment_score}}',
          label: '{{sentiment_label}}',
        },
        { type: 'cta', text: 'Apri il Dashboard →', note: '→ bullwaves.com/dashboard' },
      ],
    },
  },
  {
    id: 'trade-alert',
    name: 'Trade Alert',
    cadence: 'Event-driven · real-time',
    description:
      'Email immediata quando un segnale BUY/SELL supera la soglia di probabilità configurata.',
    trigger: 'Webhook – MarketAlerts probability ≥ 75%',
    channel: 'Email',
    source: ['MarketAlerts', 'SignalCentre'],
    tags: ['alert', 'signal'],
    color: 'amber',
    steps: [
      { label: 'Trigger', note: 'Webhook su MarketAlerts stream', icon: 'zap' },
      { label: 'Filtra soglia', note: 'probability ≥ 75% AND direction ≠ prev', icon: 'filter' },
      { label: 'Fetch SignalCentre', note: 'entry / TP / SL per asset', icon: 'fetch' },
      { label: 'Componi alert', note: 'Template con direzione + livelli', icon: 'compose' },
      { label: 'Invia email', note: 'Lista: Traders con asset in watchlist', icon: 'send' },
    ],
    template: {
      subject: '🚨 Trade Alert: {{alert_direction}} {{alert_asset}} ({{alert_probability}}%)',
      preview: 'Nuovo segnale su {{alert_asset}} – probabilità {{alert_probability}}%',
      body: [
        { type: 'alert-badge', direction: '{{alert_direction}}', asset: '{{alert_asset}}' },
        {
          type: 'signal-levels',
          entry: '{{signal_entry}}',
          tp: '{{signal_tp}}',
          sl: '{{signal_sl}}',
          period: '{{signal_period}}',
        },
        { type: 'text', text: 'Segnale generato da SignalCentre · periodo {{signal_period}}' },
        {
          type: 'variable-block',
          label: '{{alert_probability}}%',
          desc: 'MarketAlerts → probability',
        },
        {
          type: 'cta',
          text: 'Vedi analisi completa →',
          note: '→ bullwaves.com/markets/{{alert_asset}}',
        },
      ],
    },
  },
  {
    id: 'weekly-opportunity',
    name: 'Weekly Opportunity',
    cadence: 'Settimanale · Lunedì 09:00',
    description:
      'Recap settimanale con i top 3 asset per opportunity score e il consensus degli analisti.',
    trigger: 'Scheduled – ogni lunedì alle 09:00',
    channel: 'Email',
    source: ['OpportunityScore', 'AnalystRatings', 'PercentagePositivity'],
    tags: ['weekly', 'opportunity'],
    color: 'emerald',
    steps: [
      { label: 'Trigger', note: 'Lunedì ore 09:00', icon: 'clock' },
      { label: 'Fetch OpportunityScore', note: 'Top 3 asset per score', icon: 'fetch' },
      { label: 'Fetch AnalystRatings', note: 'Consensus buy/sell/hold', icon: 'fetch' },
      { label: 'Fetch Positivity', note: '% bullish per asset', icon: 'fetch' },
      { label: 'Componi digest', note: 'Template 3 card asset', icon: 'compose' },
      { label: 'Invia email', note: 'Lista: All Registered Users', icon: 'send' },
    ],
    template: {
      subject: '🔭 Top Opportunità della Settimana – {{week_label}}',
      preview:
        '{{asset_1_ticker}} · {{asset_2_ticker}} · {{asset_3_ticker}} i più interessanti questa settimana',
      body: [
        { type: 'header', text: 'Le opportunità della settimana' },
        {
          type: 'opportunity-card',
          rank: '1',
          ticker: '{{asset_1_ticker}}',
          score: '{{asset_1_score}}',
          rating: '{{asset_1_rating}}',
          positivity: '{{asset_1_positivity}}',
        },
        {
          type: 'opportunity-card',
          rank: '2',
          ticker: '{{asset_2_ticker}}',
          score: '{{asset_2_score}}',
          rating: '{{asset_2_rating}}',
          positivity: '{{asset_2_positivity}}',
        },
        {
          type: 'opportunity-card',
          rank: '3',
          ticker: '{{asset_3_ticker}}',
          score: '{{asset_3_score}}',
          rating: '{{asset_3_rating}}',
          positivity: '{{asset_3_positivity}}',
        },
        { type: 'cta', text: 'Esplora tutti i mercati →', note: '→ bullwaves.com/markets' },
      ],
    },
  },
]

const COLOR = {
  sky: {
    pill: 'bg-sky-500/10 border-sky-400/30 text-sky-300',
    dot: 'bg-sky-400',
    ring: 'ring-sky-500/20',
    step: 'bg-sky-500/10 border-sky-500/30',
    stepText: 'text-sky-300',
  },
  amber: {
    pill: 'bg-amber-500/10 border-amber-400/30 text-amber-300',
    dot: 'bg-amber-400',
    ring: 'ring-amber-500/20',
    step: 'bg-amber-500/10 border-amber-500/30',
    stepText: 'text-amber-300',
  },
  emerald: {
    pill: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-500/20',
    step: 'bg-emerald-500/10 border-emerald-500/30',
    stepText: 'text-emerald-300',
  },
}

const VARIABLE_MAP = {
  'market-pulse': [
    { variable: '{{news_title}}', source: 'AcuityNews', field: 'title' },
    { variable: '{{news_summary}}', source: 'AcuityNews', field: 'summary (≤220 char)' },
    { variable: '{{asset_ticker}}', source: 'Sentiments', field: 'assetId → ticker' },
    { variable: '{{sentiment_score}}', source: 'Sentiments', field: 'value (0–100)' },
    {
      variable: '{{sentiment_label}}',
      source: 'Sentiments',
      field: '"Bullish" / "Bearish" / "Neutral"',
    },
    { variable: '{{date}}', source: 'system', field: 'toLocaleDateString("it")' },
  ],
  'trade-alert': [
    { variable: '{{alert_direction}}', source: 'MarketAlerts', field: 'direction (BUY / SELL)' },
    { variable: '{{alert_asset}}', source: 'MarketAlerts', field: 'asset ticker' },
    { variable: '{{alert_probability}}', source: 'MarketAlerts', field: 'probability (%)' },
    { variable: '{{signal_entry}}', source: 'SignalCentre', field: 'entryPrice' },
    { variable: '{{signal_tp}}', source: 'SignalCentre', field: 'takeProfit' },
    { variable: '{{signal_sl}}', source: 'SignalCentre', field: 'stopLoss' },
    {
      variable: '{{signal_period}}',
      source: 'SignalCentre',
      field: '"intraday" / "short" / "medium"',
    },
  ],
  'weekly-opportunity': [
    { variable: '{{week_label}}', source: 'system', field: '"Settimana del DD/MM"' },
    { variable: '{{asset_N_ticker}}', source: 'OpportunityScore', field: 'asset.ticker (top 3)' },
    { variable: '{{asset_N_score}}', source: 'OpportunityScore', field: 'score (0–100)' },
    { variable: '{{asset_N_rating}}', source: 'AnalystRatings', field: 'consensus label' },
    { variable: '{{asset_N_positivity}}', source: 'PercentagePositivity', field: 'positivity (%)' },
  ],
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function Icon({ type, size = 14 }) {
  const s = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (type === 'clock')
    return (
      <svg {...s}>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4v4l2.5 2" />
      </svg>
    )
  if (type === 'zap')
    return (
      <svg {...s}>
        <path d="M9 1 4 9h5l-2 6 7-8h-5z" />
      </svg>
    )
  if (type === 'fetch')
    return (
      <svg {...s}>
        <path d="M8 1v10M4 7l4 4 4-4" />
        <path d="M2 13h12" />
      </svg>
    )
  if (type === 'filter')
    return (
      <svg {...s}>
        <path d="M1 3h14M4 8h8M6 13h4" />
      </svg>
    )
  if (type === 'compose')
    return (
      <svg {...s}>
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M5 6h6M5 9h4" />
      </svg>
    )
  if (type === 'send')
    return (
      <svg {...s}>
        <path d="M14 2 2 7.5 7 9m7-7L9 14l-2-5m7-7L7 9" />
      </svg>
    )
  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FlowStep({ step, color, isLast }) {
  const c = COLOR[color]
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs ${c.step}`}
      >
        <span className={c.stepText}>
          <Icon type={step.icon} size={12} />
        </span>
        <div>
          <div className="font-semibold text-gray-200">{step.label}</div>
          <div className="text-gray-500">{step.note}</div>
        </div>
      </div>
      {!isLast && <div className="h-4 w-px bg-gray-600" />}
    </div>
  )
}

function TemplateBody({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        if (item.type === 'header')
          return (
            <div key={i} className="text-sm font-bold text-gray-100">
              {item.text}
            </div>
          )
        if (item.type === 'text')
          return (
            <div key={i} className="text-xs text-gray-400">
              {item.text}
            </div>
          )
        if (item.type === 'divider') return <hr key={i} className="border-gray-700" />
        if (item.type === 'variable-block')
          return (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2"
            >
              <span className="rounded border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[11px] text-sky-300 shrink-0">
                {item.label}
              </span>
              <span className="text-[11px] text-gray-500">{item.desc}</span>
            </div>
          )
        if (item.type === 'sentiment-chip')
          return (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-3 py-2"
            >
              <span className="font-mono text-[11px] text-emerald-300">{item.asset}</span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                {item.score}
              </span>
              <span className="text-[11px] text-gray-400">{item.label}</span>
            </div>
          )
        if (item.type === 'alert-badge')
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2.5"
            >
              <span className="rounded border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                {item.direction}
              </span>
              <span className="font-mono text-sm font-semibold text-gray-100">{item.asset}</span>
            </div>
          )
        if (item.type === 'signal-levels')
          return (
            <div key={i} className="grid grid-cols-3 gap-2">
              {[
                { label: 'Entry', val: item.entry, cls: 'text-gray-200' },
                { label: 'TP', val: item.tp, cls: 'text-emerald-300' },
                { label: 'SL', val: item.sl, cls: 'text-red-400' },
              ].map((l) => (
                <div
                  key={l.label}
                  className="rounded border border-gray-600 bg-gray-900/50 px-2 py-1.5 text-center"
                >
                  <div className="text-[10px] text-gray-500">{l.label}</div>
                  <div className={`font-mono text-xs font-semibold ${l.cls}`}>{l.val}</div>
                </div>
              ))}
            </div>
          )
        if (item.type === 'opportunity-card')
          return (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-700 text-[10px] font-bold text-gray-300">
                {item.rank}
              </span>
              <span className="font-mono text-xs font-semibold text-gray-100">{item.ticker}</span>
              <div className="ml-auto flex items-center gap-2 text-[11px]">
                <span className="rounded border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300">
                  {item.score}
                </span>
                <span className="text-gray-400">{item.rating}</span>
                <span className="text-sky-400">{item.positivity}</span>
              </div>
            </div>
          )
        if (item.type === 'cta')
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-600 bg-gray-800/60 px-3 py-2"
            >
              <span className="text-xs font-semibold text-gray-200">{item.text}</span>
              <span className="text-[11px] text-gray-500">{item.note}</span>
            </div>
          )
        return null
      })}
    </div>
  )
}

function TestSendPanel({ activeId, onClose }) {
  const [selected, setSelected] = useState(() => new Set(TEST_CONTACTS.map((c) => c.id)))
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [results, setResults] = useState(null)

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () => {
    if (selected.size === TEST_CONTACTS.length) setSelected(new Set())
    else setSelected(new Set(TEST_CONTACTS.map((c) => c.id)))
  }

  const handleSend = async () => {
    const recipients = TEST_CONTACTS.filter((c) => selected.has(c.id)).map((c) => ({
      email: c.email,
      name: c.name,
    }))
    if (recipients.length === 0) return
    setStatus('sending')
    setResults(null)
    try {
      const res = await fetch('/api/acuity/templates/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: activeId, recipients }),
      })
      const data = await res.json()
      setResults(data.results || [])
      setStatus(data.ok ? 'done' : 'error')
    } catch (err) {
      setResults([{ email: '—', ok: false, error: err.message }])
      setStatus('error')
    }
  }

  const journey = JOURNEYS.find((j) => j.id === activeId)

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
            Test Send
          </span>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300 font-mono">
            {journey?.name}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs px-2">
          ✕
        </button>
      </div>

      {/* Contact list */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-400">Seleziona destinatari</span>
          <button onClick={toggleAll} className="text-[10px] text-indigo-400 hover:text-indigo-300">
            {selected.size === TEST_CONTACTS.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        </div>
        {TEST_CONTACTS.map((contact) => (
          <label
            key={contact.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
              selected.has(contact.id)
                ? 'border-indigo-500/40 bg-indigo-500/10'
                : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(contact.id)}
              onChange={() => toggle(contact.id)}
              className="accent-indigo-500 w-3.5 h-3.5"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-200">{contact.name}</span>
              <span className="ml-2 text-[10px] text-gray-500">{contact.role}</span>
            </div>
            <span className="font-mono text-[10px] text-gray-400 shrink-0">{contact.email}</span>
          </label>
        ))}
      </div>

      {/* Send button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSend}
          disabled={status === 'sending' || selected.size === 0}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            status === 'sending'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : status === 'done'
                ? 'bg-indigo-800 text-indigo-300'
                : status === 'error'
                  ? 'bg-red-900 text-red-300'
                  : selected.size === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {status === 'sending'
            ? 'Invio…'
            : status === 'done'
              ? '✓ Inviato'
              : status === 'error'
                ? '✗ Errore'
                : `Invia test a ${selected.size} destinatar${selected.size === 1 ? 'io' : 'i'}`}
        </button>
        {(status === 'done' || status === 'error') && (
          <button
            onClick={() => {
              setStatus('idle')
              setResults(null)
            }}
            className="text-[10px] text-gray-500 hover:text-gray-300"
          >
            Reset
          </button>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-1 border-t border-gray-700 pt-3">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className={r.ok ? 'text-emerald-400' : 'text-red-400'}>{r.ok ? '✓' : '✗'}</span>
              <span className="font-mono text-gray-300">{r.email}</span>
              {!r.ok && <span className="text-red-400 truncate">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function JourneyCard({ journey, isActive, onClick }) {
  const c = COLOR[journey.color]
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all ${
        isActive
          ? `border-gray-500 bg-gray-700/70 ring-1 ${c.ring}`
          : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
            <span className="text-sm font-semibold text-gray-100">{journey.name}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400">{journey.cadence}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c.pill}`}
        >
          {journey.channel}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-400 leading-relaxed">{journey.description}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {journey.source.map((s) => (
          <span
            key={s}
            className="rounded-full border border-gray-600 bg-gray-700/60 px-2 py-0.5 font-mono text-[10px] text-gray-300"
          >
            {s}
          </span>
        ))}
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Sync state ──────────────────────────────────────────────────────────────

const SYNC_IDLE = 'idle'
const SYNC_LOADING = 'loading'
const SYNC_OK = 'ok'
const SYNC_ERROR = 'error'

export default function AcuityLabPage() {
  const [activeId, setActiveId] = useState('acuity-visual-46')
  const [tab, setTab] = useState('journey') // 'journey' | 'preview' | 'html'
  // always live — no sample toggle
  const [syncState, setSyncState] = useState(SYNC_IDLE)
  const [syncResults, setSyncResults] = useState(null)
  const [testOpen, setTestOpen] = useState(false)
  const [htmlState, setHtmlState] = useState({ status: 'idle', value: '', error: '' })
  const [copyState, setCopyState] = useState('idle')

  const journey = JOURNEYS.find((j) => j.id === activeId)
  const c = COLOR[journey.color]
  const vars = VARIABLE_MAP[activeId] || []

  useEffect(() => {
    if (tab !== 'html') return

    let cancelled = false
    setHtmlState((current) =>
      current.value && current.status === 'ready'
        ? current
        : { status: 'loading', value: '', error: '' }
    )

    fetch(`/api/acuity/templates/source/${activeId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to load template HTML')
        }
        if (!cancelled) {
          setHtmlState({ status: 'ready', value: data.html || '', error: '' })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setHtmlState({ status: 'error', value: '', error: err.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeId, tab])

  const handleSync = useCallback(async () => {
    setSyncState(SYNC_LOADING)
    setSyncResults(null)
    try {
      const res = await fetch('/api/acuity/templates/sync', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setSyncState(SYNC_OK)
        setSyncResults(data.results)
      } else {
        setSyncState(SYNC_ERROR)
        setSyncResults([{ id: 'error', ok: false, error: data.error }])
      }
    } catch (err) {
      setSyncState(SYNC_ERROR)
      setSyncResults([{ id: 'error', ok: false, error: err.message }])
    }
  }, [])

  const handleCopyHtml = useCallback(async () => {
    const html = String(htmlState.value || '')
    if (!html) return

    try {
      await navigator.clipboard.writeText(html)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }

    window.setTimeout(() => setCopyState('idle'), 1800)
  }, [htmlState.value])

  const syncLabel = {
    [SYNC_IDLE]: 'Sync a SendGrid',
    [SYNC_LOADING]: 'Sincronizzazione…',
    [SYNC_OK]: '✓ Sincronizzato',
    [SYNC_ERROR]: '✗ Errore sync',
  }[syncState]

  const syncClass = {
    [SYNC_IDLE]: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    [SYNC_LOADING]: 'bg-gray-600 text-gray-300 cursor-not-allowed',
    [SYNC_OK]: 'bg-emerald-800 text-emerald-300',
    [SYNC_ERROR]: 'bg-red-900 text-red-300',
  }[syncState]

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-gray-100">Acuity · Email Journeys</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Template Acuity Trading e visual email pronti per preview HTML e sync SendGrid
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestOpen((o) => !o)}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
              testOpen
                ? 'border-indigo-500/60 bg-indigo-600 text-white'
                : 'border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50'
            }`}
          >
            ✉ Test
          </button>
          <button
            onClick={handleSync}
            disabled={syncState === SYNC_LOADING}
            className={`rounded-lg border border-transparent px-4 py-2 text-xs font-semibold transition-colors ${syncClass}`}
          >
            {syncLabel}
          </button>
        </div>
      </div>

      {/* Sync results */}
      {syncResults && (
        <div className="rounded-xl border border-gray-600 bg-gray-800/60 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Risultati sync
          </p>
          <div className="space-y-1.5">
            {syncResults.map((r) => (
              <div key={r.id} className="flex items-start gap-3 text-[11px]">
                <span className={r.ok ? 'text-emerald-400' : 'text-red-400'}>
                  {r.ok ? '✓' : '✗'}
                </span>
                {r.ok ? (
                  <>
                    <span className="text-gray-300 font-medium">{r.name}</span>
                    <span className="ml-auto font-mono text-gray-500">{r.sendgridTemplateId}</span>
                  </>
                ) : (
                  <span className="text-red-400">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test send panel */}
      {testOpen && <TestSendPanel activeId={activeId} onClose={() => setTestOpen(false)} />}

      <div className="grid grid-cols-[280px_1fr] gap-4 items-start">
        {/* Sidebar */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
            Journey disponibili
          </p>
          {JOURNEYS.map((j) => (
            <JourneyCard
              key={j.id}
              journey={j}
              isActive={j.id === activeId}
              onClick={() => {
                setActiveId(j.id)
                setTab('journey')
              }}
            />
          ))}
        </div>

        {/* Detail */}
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl border border-gray-600 bg-gray-700/60 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${c.dot}`} />
              <h2 className="text-base font-semibold text-gray-100">{journey.name}</h2>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.pill}`}
              >
                {journey.cadence}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">{journey.description}</p>
            <div className="mt-3 rounded-lg border border-gray-600 bg-gray-900/40 px-3 py-2 text-[11px] text-gray-400">
              <span className="font-semibold text-gray-300">Trigger: </span>
              {journey.trigger}
            </div>
          </div>

          {/* Tab bar + live toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 rounded-lg border border-gray-600 bg-gray-800/50 p-1">
              {[
                { id: 'journey', label: 'Journey & Template' },
                { id: 'preview', label: '👁 Anteprima HTML' },
                { id: 'html', label: '</> HTML' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tab === t.id ? `${c.pill} border` : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'preview' && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Acuity
              </div>
            )}

            {tab === 'html' && (
              <button
                onClick={handleCopyHtml}
                disabled={htmlState.status !== 'ready' || !htmlState.value}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  htmlState.status !== 'ready' || !htmlState.value
                    ? 'border-gray-700 bg-gray-800/60 text-gray-500 cursor-not-allowed'
                    : copyState === 'copied'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : copyState === 'error'
                        ? 'border-red-500/50 bg-red-500/10 text-red-300'
                        : 'border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15'
                }`}
              >
                {copyState === 'copied'
                  ? 'Copiato'
                  : copyState === 'error'
                    ? 'Errore copia'
                    : 'Copia HTML'}
              </button>
            )}
          </div>

          {tab === 'preview' ? (
            <div className="rounded-xl border border-gray-600 overflow-hidden">
              <iframe
                key={activeId}
                src={`/api/acuity/templates/preview/${activeId}`}
                title={`Preview ${journey.name}`}
                className="w-full"
                style={{ height: '640px', border: 'none', display: 'block' }}
              />
            </div>
          ) : tab === 'html' ? (
            <div className="rounded-xl border border-gray-600 bg-[#0b1220] overflow-hidden">
              {htmlState.status === 'loading' ? (
                <div className="px-4 py-6 text-sm text-gray-400">Caricamento HTML…</div>
              ) : htmlState.status === 'error' ? (
                <div className="px-4 py-6 text-sm text-red-300">{htmlState.error}</div>
              ) : (
                <pre className="m-0 max-h-[640px] overflow-auto p-4 text-[12px] leading-5 text-slate-200 whitespace-pre-wrap break-words">
                  {htmlState.value}
                </pre>
              )}
            </div>
          ) : (
            <>
              {/* Flow + Template */}
              <div className="grid grid-cols-[190px_1fr] gap-4 items-start">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Flow
                  </p>
                  {journey.steps.map((step, i) => (
                    <FlowStep
                      key={i}
                      step={step}
                      color={journey.color}
                      isLast={i === journey.steps.length - 1}
                    />
                  ))}
                </div>

                <div className="rounded-xl border border-gray-600 bg-gray-700/60 p-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Template email
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2">
                      <span className="shrink-0 mt-0.5 text-[10px] font-semibold uppercase text-gray-500">
                        Subject
                      </span>
                      <span className="font-mono text-[11px] text-gray-200">
                        {journey.template.subject}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2">
                      <span className="shrink-0 mt-0.5 text-[10px] font-semibold uppercase text-gray-500">
                        Preview
                      </span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {journey.template.preview}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-600 bg-gray-900/40 p-3">
                    <TemplateBody items={journey.template.body} />
                  </div>
                </div>
              </div>

              {/* Variable map */}
              <div className="rounded-xl border border-gray-600 bg-gray-700/60 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Mapping variabili → Acuity API
                </p>
                {vars.length > 0 ? (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="pb-2 text-left font-semibold text-gray-400 pr-4 w-44">
                          Variabile template
                        </th>
                        <th className="pb-2 text-left font-semibold text-gray-400 pr-4 w-40">
                          Endpoint Acuity
                        </th>
                        <th className="pb-2 text-left font-semibold text-gray-400">
                          Campo risposta
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {vars.map((v) => (
                        <tr key={v.variable}>
                          <td className="py-1.5 pr-4">
                            <span className="rounded border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-sky-300">
                              {v.variable}
                            </span>
                          </td>
                          <td className="py-1.5 pr-4">
                            <span className="rounded border border-gray-600 bg-gray-700/60 px-1.5 py-0.5 font-mono text-gray-300">
                              {v.source}
                            </span>
                          </td>
                          <td className="py-1.5 text-gray-400">{v.field}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="rounded-lg border border-gray-600 bg-gray-900/40 px-3 py-3 text-xs text-gray-400">
                    Questo template è statico: non usa variabili runtime Acuity oltre al placeholder
                    di unsubscribe gestito in fase di sync SendGrid.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
