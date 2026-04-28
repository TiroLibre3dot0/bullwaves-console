import { useMemo, useState } from 'react'
import { getPublicShareOrigin } from '../utils/publicShareOrigin'

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

function Tooltip({ label, text }) {
  return (
    <span className="commission-rules__tooltip" role="img" aria-label={label} title={text}>
      i
    </span>
  )
}

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
          <a href="#commission-hero">Overview</a>
          <a href="#commission-rules">Rules</a>
          <a href="#commission-matrix">Channel Matrix</a>
          <a href="#commission-audit">Audit & Controls</a>
          <a href="#commission-faq">FAQ</a>
          <a href="#commission-future">Future Widget</a>
        </aside>

        <div className="commission-rules__content">
          <article id="commission-hero" className="commission-rules__hero card-block">
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
                ) : (
                  <span className="commission-rules__publicBadge">Public Shared View</span>
                )}
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
                  <h3>Operational Validation Logic</h3>
                  <p className="muted">
                    Use these rules as the operational source of truth for eligibility and
                    governance.
                  </p>
                </div>
              </div>

              <RuleAccordion
                id="rule-1"
                title="Rule 1 - Deposit Validation Requirement"
                defaultOpen
              >
                <ul className="commission-rules__list">
                  <li>
                    documented contact within 30 days{' '}
                    <Tooltip
                      label="Validation window"
                      text="Contact evidence must be within a rolling 30-day period before deposit."
                    />
                  </li>
                  <li>accepted validation methods:</li>
                  <li className="commission-rules__subpoint">Voiso effective calls (&gt;90 sec)</li>
                  <li className="commission-rules__subpoint">
                    Convrs documented engagement (two-way interaction)
                  </li>
                  <li className="commission-rules__subpoint">Personal WhatsApp proof</li>
                </ul>

                <div className="commission-rules__examples">
                  <div className="commission-rules__example is-valid">
                    <p>Valid example</p>
                    <span>
                      Agent call on Voiso lasts 01m52s, client asks clarifying question, follow-up
                      note is timestamped before deposit.
                    </span>
                  </div>
                  <div className="commission-rules__example is-invalid">
                    <p>Invalid example</p>
                    <span>
                      Missed call with no response and no two-way evidence marked as validated
                      contact.
                    </span>
                  </div>
                </div>
              </RuleAccordion>

              <RuleAccordion id="rule-2" title="Rule 2 - Exceptions">
                <p>
                  Documented exception handling applies when standard validation timing cannot be
                  met but traceable client intent exists.
                </p>
                <p className="commission-rules__inlineExample">
                  Example: “Client asked to be contacted next month” → eligible if recorded.
                </p>
                <span className="commission-rules__badge">Management Review Override</span>
              </RuleAccordion>

              <RuleAccordion id="rule-3" title="Rule 3 - Funded Accounts & Withdrawals">
                <p>
                  Funded account commission treatment remains dependent on validation status.
                  Withdrawal activity does not bypass validation requirements.
                </p>
                <div className="commission-rules__noteBox">
                  Deposits not validated under policy do not generate commission eligibility.
                </div>
              </RuleAccordion>

              <RuleAccordion id="rule-4" title="Rule 4 - Voicemail Policy" alert>
                <div className="commission-rules__fraudHeader">
                  <span className="commission-rules__alertBadge">Anti-Manipulation Control</span>
                </div>
                <ul className="commission-rules__list">
                  <li>Voicemail does not qualify as effective call</li>
                  <li>Must remain brief</li>
                  <li>Long voicemail manipulation triggers 100% forfeiture on affected cases</li>
                </ul>

                <div className="commission-rules__examples">
                  <div className="commission-rules__example is-valid">
                    <p>✅ acceptable voicemail</p>
                    <span>
                      12-second courtesy voicemail noting call-back availability, followed by proper
                      two-way interaction in a separate contact.
                    </span>
                  </div>
                  <div className="commission-rules__example is-invalid">
                    <p>❌ manipulation example</p>
                    <span>
                      Repeated long voicemail drops logged as “effective calls” to force commission
                      validation status.
                    </span>
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
                          {row.qualifies ? '🟢 Yes' : '🔴 Conditional / No'}
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
