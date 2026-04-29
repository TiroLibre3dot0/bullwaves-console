import { useEffect, useMemo, useState } from 'react'
import { getPublicShareOrigin } from '../utils/publicShareOrigin'

const COMMISSION_SHEET_ID = '1QibZA-cpp7j6c_NTrQyQeAfh3vsC8g-s2L1Bx55bk24'
const COMMISSION_SHEET_GID = '1500578496'

const DEFAULT_RULES_SOURCE = {
  title: 'Deposit Validation Rules',
  sections: [
    {
      heading: 'Client Contact Requirement',
      lines: [
        'A deposit will be considered valid only if there has been contact with the client within 30 days.',
        'Exception: If the client has requested to be contacted at a later date, this must be properly documented.',
      ],
    },
    {
      heading: 'Accepted Proof of Contact',
      lines: [
        'Contact must be recorded through one of the following:',
        '- An effective call in Voiso lasting over 90 seconds',
        '- A message in Convrs',
        '- A personal WhatsApp message (must include a screenshot showing the client name/phone number, date, and time)',
      ],
    },
    {
      heading: 'Funded Accounts & Withdrawals',
      lines: [
        'If a client funds an account but later withdraws, the withdrawal will not be counted if the original deposit was not validated.',
      ],
    },
    {
      heading: 'Voicemail Policy',
      lines: [
        'Voicemails must not exceed 90 seconds.',
        'Leaving longer voicemails to qualify as an effective call will be considered an attempt to manipulate the system.',
        'In such cases, the commission will be reduced by 100%.',
        'If leaving a voicemail, ensure it is clear and short.',
      ],
    },
  ],
}

function buildSheetCsvUrl() {
  return `https://docs.google.com/spreadsheets/d/${COMMISSION_SHEET_ID}/export?format=csv&gid=${COMMISSION_SHEET_GID}`
}

function parseRulesFromCsvText(csvText) {
  const rows = String(csvText || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!rows.length) return null

  const title = rows[0]
  const sections = []
  let current = null

  const looksLikeHeading = (line) => {
    if (!line) return false
    if (line.startsWith('-')) return false
    if (line.includes(':')) return false
    if (line.length > 72) return false
    return true
  }

  for (const line of rows.slice(1)) {
    if (looksLikeHeading(line)) {
      if (current) sections.push(current)
      current = { heading: line, lines: [] }
      continue
    }

    if (!current) {
      current = { heading: 'Operational Notes', lines: [] }
    }
    current.lines.push(line)
  }

  if (current) sections.push(current)
  if (!sections.length) return null

  return { title, sections }
}

const KPI_CARDS = [
  { label: 'Valid Contact Window', value: '30 Days' },
  { label: 'Effective Call Threshold', value: '90+ sec' },
  { label: 'Approved Contact Channels', value: '3' },
  { label: 'Anti-Manipulation Policy', value: 'Active', tone: 'danger' },
]

const MATRIX_ROWS = [
  {
    channel: 'Voiso',
    qualifies: false,
    conditions:
      'Counts only when call is effective (>90 sec) and documented as two-way interaction.',
    example: '02m14s connected call with client response and CRM note.',
  },
  {
    channel: 'Convrs',
    qualifies: true,
    conditions: 'Documented engagement with two-way interaction in the same validation window.',
    example: 'Client asks follow-up question and agent confirms risk profile guidance.',
  },
  {
    channel: 'WhatsApp',
    qualifies: true,
    conditions: 'Personal WhatsApp proof with clear client reply and timestamped context.',
    example: 'Agent shares onboarding follow-up, client replies and confirms intent to fund.',
  },
]

const AUDIT_CARDS = [
  {
    title: 'Effective Call Verification',
    icon: '📞',
    text: 'Random and targeted checks on call duration, two-way interaction quality, and transcript coherence.',
  },
  {
    title: 'Contact Evidence Audit',
    icon: '🧾',
    text: 'Commission cases require auditable records linking agent touchpoint to funded event timeline.',
  },
  {
    title: 'Exception Review',
    icon: '🧠',
    text: 'Exception entries are cross-checked with context notes, timestamps, and manager authorization trails.',
  },
  {
    title: 'Manipulation Flags',
    icon: '🚨',
    text: 'Pattern controls detect inflated call behavior, repetitive voicemail abuse, and inconsistent contact claims.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'What if client deposits after 30 days?',
    a: 'Outside the valid contact window, the deposit is not automatically commission eligible unless a documented exception was approved.',
  },
  {
    q: 'What if client replied only once?',
    a: 'A single reply can support validation only when it is a clear documented two-way interaction with operational context.',
  },
  {
    q: 'Do withdrawals cancel commission?',
    a: 'Withdrawals are assessed under funded account and validation dependency rules. Validation still determines baseline eligibility.',
  },
  {
    q: 'How are exceptions approved?',
    a: 'Exceptions require documented rationale and explicit management confirmation in the operational review trail.',
  },
]

function RuleAccordion({ id, title, children, defaultOpen = false, alert = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <article id={id} className={`commission-rules__accordion ${alert ? 'is-alert' : ''}`}>
      <button
        type="button"
        className="commission-rules__accordionToggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <span aria-hidden="true" className="commission-rules__chevron">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? <div className="commission-rules__accordionBody">{children}</div> : null}
    </article>
  )
}

export default function CommissionValidationRulesPage({ publicMode = false }) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [faqOpen, setFaqOpen] = useState(() => new Set())
  const [isSharing, setIsSharing] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [rulesSource, setRulesSource] = useState(DEFAULT_RULES_SOURCE)
  const [rulesSourceLoading, setRulesSourceLoading] = useState(false)
  const [rulesSourceError, setRulesSourceError] = useState('')

  const futureMetrics = useMemo(
    () => [
      { label: 'Validated deposits %', value: '82%' },
      { label: 'Deposits pending validation', value: '14' },
      { label: 'Exceptions under review', value: '3' },
      { label: 'Manipulation alerts', value: '1' },
    ],
    []
  )

  const toggleFaq = (idx) => {
    setFaqOpen((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadRulesSource() {
      setRulesSourceLoading(true)
      setRulesSourceError('')

      try {
        const resp = await fetch(buildSheetCsvUrl(), { cache: 'no-store' })
        if (!resp.ok) throw new Error('Unable to load Google Sheet rules source')

        const text = await resp.text()
        const parsed = parseRulesFromCsvText(text)
        if (!parsed) throw new Error('Google Sheet rules source is empty or malformed')

        if (!cancelled) setRulesSource(parsed)
      } catch {
        if (!cancelled) {
          setRulesSource(DEFAULT_RULES_SOURCE)
          setRulesSourceError('Live source unavailable: using baseline rules snapshot.')
        }
      } finally {
        if (!cancelled) setRulesSourceLoading(false)
      }
    }

    loadRulesSource()
    return () => {
      cancelled = true
    }
  }, [])

  const navItems = [
    { id: 'commission-hero', label: 'Overview' },
    { id: 'commission-rules', label: 'Rules' },
    { id: 'commission-matrix', label: 'Channel Matrix' },
    { id: 'commission-audit', label: 'Audit & Controls' },
    { id: 'commission-faq', label: 'FAQ' },
    ...(!publicMode ? [{ id: 'commission-future', label: 'Future Widget' }] : []),
  ]

  const scrollToSection = (id) => {
    if (typeof window === 'undefined') return
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
  }

  async function createPublicShareLink() {
    if (publicMode || isSharing) return

    setIsSharing(true)
    setShareStatus('')

    let pendingWindow = null
    try {
      pendingWindow = window.open('', '_blank')
    } catch {
      pendingWindow = null
    }

    let token = ''
    const payload = {
      k: 'comval',
      v: 1,
      generatedAt: new Date().toISOString(),
      state: {
        acknowledged,
      },
    }

    const shareOrigin = getPublicShareOrigin()
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(runtimeOrigin)

    try {
      const resp = await fetch('/api/share/create-commission-validation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const data = await resp.json().catch(() => null)
      if (resp.ok && data?.ok && data?.token) {
        token = String(data.token)
      } else {
        throw new Error(data?.error || data?.message || 'share-not-available')
      }
    } catch {
      if (!isLocalhost) {
        setShareStatus('Public share is not available in this environment.')
        if (pendingWindow && !pendingWindow.closed) pendingWindow.close()
        setIsSharing(false)
        return
      }

      try {
        const bytes = new Uint8Array(12)
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
          window.crypto.getRandomValues(bytes)
          token = `share_local_${Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')}`
        } else {
          token = `share_local_${Math.random().toString(16).slice(2)}`
        }
      } catch {
        token = `share_local_${Math.random().toString(16).slice(2)}`
      }

      try {
        window.localStorage.setItem(
          `bw_share_commission_validation_rules:${token}`,
          JSON.stringify({ payload })
        )
      } catch {
        // ignore
      }
    }

    const isKvToken = token.startsWith('share_') && !token.startsWith('share_local_')
    const href = isKvToken
      ? `${shareOrigin}/s/${encodeURIComponent(token)}`
      : `${shareOrigin}/share/commission-validation-rules/${encodeURIComponent(token)}`

    try {
      if (pendingWindow && !pendingWindow.closed) {
        pendingWindow.location.href = href
      } else {
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    } catch {
      // ignore
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href)
        setShareStatus('Public link copied to clipboard.')
      } else {
        setShareStatus('Public link generated. Opened in a new tab.')
      }
    } catch {
      setShareStatus('Public link generated. Opened in a new tab.')
    }

    setIsSharing(false)
  }

  return (
    <section className="commission-rules page-shell">
      <div className="commission-rules__layout">
        <aside className="commission-rules__stickyNav" aria-label="Section navigation">
          <h3>Navigation</h3>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                scrollToSection(item.id)
              }}
            >
              {item.label}
            </a>
          ))}
        </aside>

        <div className="commission-rules__content">
          <article
            id="commission-hero"
            className="commission-rules__hero commission-rules__scrollTarget card-block"
          >
            <div className="commission-rules__heroText">
              <p className="page-label">Compliance Control</p>
              <h1 className="page-title">Sales Commission Validation Framework</h1>
              <p className="page-subtitle">
                Rules governing deposit commission eligibility based on documented sales engagement.
              </p>
              <div className="commission-rules__heroActions">
                {!publicMode ? (
                  <button
                    type="button"
                    className="commission-rules__shareBtn"
                    onClick={createPublicShareLink}
                    disabled={isSharing}
                  >
                    {isSharing ? 'Creating public link...' : 'Share Public Page'}
                  </button>
                ) : null}
                {shareStatus ? (
                  <span className="commission-rules__shareStatus">{shareStatus}</span>
                ) : null}
              </div>
            </div>
            <div className="commission-rules__kpiGrid">
              {KPI_CARDS.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`commission-rules__kpiCard ${kpi.tone === 'danger' ? 'is-danger' : ''}`}
                >
                  <p>{kpi.label}</p>
                  <strong>{kpi.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <section id="commission-rules" className="commission-rules__section">
            <div className="card-block">
              <div className="card-block-header">
                <div>
                  <p className="eyebrow">Policy Rules</p>
                  <h3>{rulesSource?.title || 'Operational Validation Logic'}</h3>
                  <p className="muted">
                    Source: Google Sheets commissions structure (live import with fallback).
                  </p>
                  {rulesSourceLoading ? (
                    <p className="muted" style={{ marginTop: 6 }}>
                      Syncing latest rules source...
                    </p>
                  ) : null}
                  {rulesSourceError ? (
                    <p className="muted" style={{ marginTop: 6 }}>
                      {rulesSourceError}
                    </p>
                  ) : null}
                </div>
              </div>

              {(rulesSource?.sections || []).map((section, idx) => {
                const lines = Array.isArray(section?.lines) ? section.lines : []
                const bulletLines = lines.filter((line) => String(line).trim().startsWith('-'))
                const textLines = lines.filter((line) => !String(line).trim().startsWith('-'))
                const isAlert = /voicemail|manipulation|forfeiture/i.test(
                  `${section?.heading || ''} ${lines.join(' ')}`
                )

                return (
                  <RuleAccordion
                    key={`${section?.heading || 'rule'}-${idx}`}
                    id={`rule-${idx + 1}`}
                    title={`Rule ${idx + 1} - ${section?.heading || `Policy ${idx + 1}`}`}
                    defaultOpen={idx === 0}
                    alert={isAlert}
                  >
                    {textLines.map((line, lineIdx) => (
                      <p key={`txt-${idx}-${lineIdx}`}>{line}</p>
                    ))}

                    {bulletLines.length ? (
                      <ul className="commission-rules__list">
                        {bulletLines.map((line, lineIdx) => (
                          <li key={`li-${idx}-${lineIdx}`}>{line.replace(/^\-\s*/, '')}</li>
                        ))}
                      </ul>
                    ) : null}
                  </RuleAccordion>
                )
              })}

              {/* ── Rule 5: Large Single-Client Deposit ── */}
              <RuleAccordion
                id="rule-5"
                title="Rule 5 - Large Single-Client Deposit (≥ €10,000)"
                defaultOpen={false}
              >
                <p>
                  When a single client makes a deposit (or cumulative deposits within the same
                  30-day window) totalling <strong>€10,000 or more</strong>, the commission is split
                  into an <em>immediate</em> portion and a <em>staged-release</em> portion. Multiple
                  deposits by the same client within the same 30-day window are aggregated for the
                  purpose of this rule.
                </p>

                <div className="commission-rules__noteBox">
                  <strong>Formula</strong>
                  <ul className="commission-rules__list" style={{ marginTop: 8 }}>
                    <li>
                      <strong>Immediate commission</strong> = commission on{' '}
                      <code>min(totalDeposit, €10,000)</code> — paid at the normal settlement date.
                    </li>
                    <li>
                      <strong>Pending amount</strong> = commission on{' '}
                      <code>max(totalDeposit − €10,000, 0)</code> — held and released in two
                      milestones.
                    </li>
                  </ul>
                </div>

                <p style={{ marginTop: 16 }}>
                  <strong>Staged release milestones for the pending portion:</strong>
                </p>
                <table className="simple-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Milestone</th>
                      <th>Release</th>
                      <th>Required conditions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Day 7</td>
                      <td>50 % of pending</td>
                      <td>
                        Second documented two-way contact on a <em>different calendar day</em> from
                        the first + no manipulation flags.
                      </td>
                    </tr>
                    <tr>
                      <td>Day 30</td>
                      <td>Remaining 50 %</td>
                      <td>
                        No early full withdrawal (≥ 80 % of deposit) + no open manipulation flags.
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ marginTop: 16 }}>
                  <strong>Automatic cancellation of pending amount if:</strong>
                </p>
                <ul className="commission-rules__list">
                  <li>A manipulation flag is raised at any point before full release.</li>
                  <li>
                    Required contact evidence is missing or cannot be verified by the audit team.
                  </li>
                  <li>Client withdraws ≥ 80 % of the deposit before the Day-30 milestone.</li>
                </ul>

                <div className="commission-rules__examples" style={{ marginTop: 20 }}>
                  <div className="commission-rules__example is-valid">
                    <strong>Example A — deposit above threshold (€50,000)</strong>
                    <ul className="commission-rules__list" style={{ marginTop: 6 }}>
                      <li>Total deposit: €50,000</li>
                      <li>Immediate portion: commission on €10,000 → paid at normal settlement.</li>
                      <li>Pending portion: commission on €40,000 → held.</li>
                      <li>
                        Day-7 release: 50 % of pending commission (on €20,000) if second contact
                        verified + no flags.
                      </li>
                      <li>
                        Day-30 release: remaining 50 % of pending commission (on €20,000) if no
                        early withdrawal + no flags.
                      </li>
                    </ul>
                  </div>

                  <div className="commission-rules__example is-valid">
                    <strong>Example B — deposit below threshold (€8,000)</strong>
                    <ul className="commission-rules__list" style={{ marginTop: 6 }}>
                      <li>Total deposit: €8,000 (below the €10,000 threshold).</li>
                      <li>
                        Rule 5 does <em>not</em> apply — standard commission rules (Rules 1–4)
                        govern this deposit.
                      </li>
                      <li>
                        Full commission is eligible immediately, subject to normal validation.
                      </li>
                    </ul>
                  </div>
                </div>
              </RuleAccordion>
            </div>
          </section>

          <section id="commission-matrix" className="commission-rules__section">
            <article className="card-block table-card">
              <div className="card-block-header">
                <div>
                  <p className="eyebrow">Validation Matrix</p>
                  <h3>Contact Channel Validation Matrix</h3>
                </div>
              </div>

              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Counts for Validation</th>
                    <th>Conditions</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row) => (
                    <tr key={row.channel}>
                      <td>{row.channel}</td>
                      <td>
                        <span
                          className={`commission-rules__status ${row.qualifies ? 'is-ok' : 'is-no'}`}
                        >
                          {row.qualifies ? 'Yes' : 'Conditional / No'}
                        </span>
                      </td>
                      <td>{row.conditions}</td>
                      <td>{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>

          <section id="commission-audit" className="commission-rules__section">
            <article className="card-block">
              <div className="card-block-header">
                <div>
                  <p className="eyebrow">Monitoring Layer</p>
                  <h3>Audit & Controls</h3>
                </div>
              </div>

              <div className="commission-rules__auditGrid">
                {AUDIT_CARDS.map((card) => (
                  <div key={card.title} className="commission-rules__auditCard">
                    <span className="commission-rules__auditIcon" aria-hidden="true">
                      {card.icon}
                    </span>
                    <h4>{card.title}</h4>
                    <p>{card.text}</p>
                  </div>
                ))}
              </div>

              <div className="commission-rules__fraudFlag">Long voicemail anomaly detected</div>
            </article>
          </section>

          <section id="commission-faq" className="commission-rules__section">
            <article className="card-block">
              <div className="card-block-header">
                <div>
                  <p className="eyebrow">Decision Support</p>
                  <h3>FAQ / Edge Cases</h3>
                </div>
              </div>

              <div className="commission-rules__faqList">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = faqOpen.has(idx)
                  return (
                    <div key={item.q} className="commission-rules__faqItem">
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        aria-expanded={isOpen}
                        className="commission-rules__faqBtn"
                      >
                        <span>{item.q}</span>
                        <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen ? <p>{item.a}</p> : null}
                    </div>
                  )
                })}
              </div>
            </article>
          </section>

          {!publicMode ? (
            <section id="commission-future" className="commission-rules__section">
              <article className="card-block">
                <div className="card-block-header">
                  <div>
                    <p className="eyebrow">Future Integration</p>
                    <h3>Compliance Dashboard (Backend Ready)</h3>
                    <p className="muted">
                      Placeholder structure prepared for future API-driven compliance signals.
                    </p>
                  </div>
                </div>

                <div className="commission-rules__futureGrid">
                  {futureMetrics.map((metric) => (
                    <div key={metric.label} className="commission-rules__futureCard">
                      <p>{metric.label}</p>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          <section className="commission-rules__section">
            <article className="card-block commission-rules__actions">
              {!publicMode ? (
                <label className="commission-rules__acknowledge">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <span>I have read and understood the Commission Validation Rules</span>
                </label>
              ) : (
                <div className="commission-rules__publicFootnote">Read-only public snapshot</div>
              )}

              <button
                type="button"
                className="commission-rules__exportBtn"
                onClick={() => window.print()}
              >
                Export to PDF
              </button>
            </article>
          </section>
        </div>
      </div>
    </section>
  )
}
