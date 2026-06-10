import { useMemo, useState } from 'react'

function asText(value) {
  const text = String(value ?? '').trim()
  return text || '--'
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

function infoField(label, value) {
  return { label, value: asText(value) }
}

function isMeaningful(value) {
  const text = String(value ?? '').trim()
  return Boolean(text) && text !== '--'
}

function normalizeValueKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function buildProfile(item) {
  const summary = item?.summary || {}
  const account = item?.accountDetails?.object || {}
  const lead = item?.leadStatus?.object || {}
  const udbe =
    Array.isArray(item?.userDetails?.data) && item.userDetails.data.length
      ? item.userDetails.data[0]
      : {}
  const bill = udbe?.account_bill_ads_general || {}
  const crm = udbe?.crm_entity || {}
  const crmOwner = crm?.user || {}
  const tpGeneral =
    Array.isArray(udbe?.tp_accounts_general_info) && udbe.tp_accounts_general_info.length
      ? udbe.tp_accounts_general_info[0]
      : {}
  const tpSnapshot =
    Array.isArray(udbe?.tp_accounts_last_snapshot_info) &&
    udbe.tp_accounts_last_snapshot_info.length
      ? udbe.tp_accounts_last_snapshot_info[0]
      : {}

  return {
    identity: [
      infoField(
        'Name',
        firstNonEmpty(summary.name, account.accountname, udbe.accountname, lead.lead_name)
      ),
      infoField(
        'Email',
        firstNonEmpty(summary.email, account.email, udbe.email1, lead.email, lead.email1)
      ),
      infoField('Phone', firstNonEmpty(summary.phone, account.phone, udbe.phone)),
      infoField(
        'Country',
        firstNonEmpty(
          summary.country,
          account.country,
          bill.bill_country,
          lead.registration_country
        )
      ),
      infoField('City', firstNonEmpty(account.city, bill.bill_city)),
      infoField('Address', firstNonEmpty(account.address, bill.bill_street)),
    ],
    accountIds: [
      infoField(
        'MT Account',
        firstNonEmpty(summary.mtId, account.mt4_account, tpGeneral.acc, tpSnapshot.acc)
      ),
      infoField('Lead ID', firstNonEmpty(summary.leadId, account.lead_id, lead.id)),
      infoField(
        'CRM Account ID',
        firstNonEmpty(account.crm_account_id, udbe.crm_account_id, udbe.accountid)
      ),
      infoField('Affiliate ID', udbe.affiliate_id),
      infoField('External Lead ID', account.external_lead_id),
      infoField('IP', firstNonEmpty(account.ip, lead.ip)),
    ],
    compliance: [
      infoField('Verification Status', udbe.verification_status),
      infoField('Verification Provider', udbe.provider_name),
      infoField('Additional Info', udbe.additional_information),
      infoField('ID Type', account.id_type),
      infoField('National Number', account.national_number),
      infoField('Registration Country', account.registration_country),
    ],
    tradingProfile: [
      infoField('Platform', firstNonEmpty(tpGeneral.platformname, tpSnapshot.platformname)),
      infoField('Account Type', firstNonEmpty(tpGeneral.account_type, tpSnapshot.account_type)),
      infoField('Account Status', tpGeneral.tp_accountstatus),
      infoField('Currency', firstNonEmpty(tpGeneral.currency, account.currency)),
      infoField('Leverage', tpSnapshot.leverage),
      infoField('Group', tpGeneral.mt4_group),
    ],
    tradingSnapshot: [
      infoField('Balance', firstNonEmpty(tpSnapshot.balance, account.balance)),
      infoField('Equity', firstNonEmpty(tpSnapshot.equity, account.equity)),
      infoField('Margin', tpSnapshot.margin),
      infoField('Margin Free', firstNonEmpty(tpSnapshot.margin_free, account.margin_free)),
      infoField('Credit', tpSnapshot.credit),
      infoField('Open PnL', tpSnapshot.open_pnl),
      infoField('Closed PnL', tpSnapshot.closed_pnl),
      infoField('Margin Level', tpSnapshot.margin_level),
    ],
    ownership: [
      infoField('Owner', crmOwner.user_name),
      infoField('CRM Created', crm.createdtime),
      infoField('CRM Modified', crm.modifiedtime),
      infoField('Original Retention Owner', account.original_retention_owner),
      infoField('Last Login', account.last_login),
      infoField('Last Modified Date', account.last_modified_date),
    ],
    billing: [
      infoField('Billing Country', bill.bill_country),
      infoField('Billing City', bill.bill_city),
      infoField('Billing Street', bill.bill_street),
      infoField('Billing State', bill.bill_state),
      infoField('Billing Code', bill.bill_code),
      infoField('Billing PO Box', bill.bill_pobox),
    ],
  }
}

function SectionCard({ title, fields }) {
  if (!Array.isArray(fields) || fields.length === 0) return null

  return (
    <section
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.24)',
        background: 'rgba(2,6,23,0.62)',
        padding: 12,
        display: 'grid',
        gap: 8,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 13,
          color: '#bae6fd',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {fields.map((field) => (
          <div
            key={`${title}-${field.label}`}
            style={{
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.66)',
              padding: '8px 10px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#7dd3fc',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {field.label}
            </div>
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>{field.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ResultCard({ item, idx }) {
  const summary = item?.summary || {}
  const profile = buildProfile(item)
  const compactSections = useMemo(() => {
    const ordered = [
      { title: 'Client Profile', fields: profile.identity },
      { title: 'Account IDs', fields: profile.accountIds },
      { title: 'Trading Profile', fields: profile.tradingProfile },
      { title: 'Trading Snapshot', fields: profile.tradingSnapshot },
      { title: 'Compliance', fields: profile.compliance },
      { title: 'Ownership & Timeline', fields: profile.ownership },
      { title: 'Billing', fields: profile.billing },
    ]

    const seenValues = new Set()
    return ordered
      .map((section) => {
        const compactFields = (section.fields || []).filter((field) => {
          if (!isMeaningful(field?.value)) return false
          const valueKey = normalizeValueKey(field.value)
          if (seenValues.has(valueKey)) return false
          seenValues.add(valueKey)
          return true
        })
        return { ...section, fields: compactFields }
      })
      .filter((section) => section.fields.length > 0)
  }, [profile])

  return (
    <article
      style={{
        borderRadius: 14,
        border: '1px solid rgba(56,189,248,0.3)',
        background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95))',
        boxShadow: '0 18px 32px rgba(2,6,23,0.28)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          borderBottom: '1px solid rgba(148,163,184,0.2)',
          background: 'linear-gradient(90deg, rgba(14,165,233,0.15), rgba(34,197,94,0.1))',
        }}
      >
        <strong style={{ color: '#e2e8f0', fontSize: 14 }}>Result #{idx + 1}</strong>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 999,
            padding: '3px 8px',
            border: '1px solid rgba(59,130,246,0.42)',
            color: '#dbeafe',
            background: 'rgba(30,58,138,0.26)',
          }}
        >
          relevance {Number(item?.score || 0).toFixed(1)}
        </span>
      </div>

      <div style={{ padding: 14, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              border: '1px solid rgba(59,130,246,0.45)',
              background: 'rgba(30,58,138,0.2)',
              color: '#dbeafe',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {asText(summary.name)}
          </span>
          <span
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              border: '1px solid rgba(45,212,191,0.45)',
              background: 'rgba(13,148,136,0.2)',
              color: '#ccfbf1',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {asText(summary.email)}
          </span>
          <span
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'rgba(30,41,59,0.55)',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            MT {asText(summary.mtId)}
          </span>
          <span
            style={{
              padding: '4px 9px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'rgba(30,41,59,0.55)',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Lead {asText(summary.leadId)}
          </span>
        </div>

        {compactSections.map((section) => (
          <SectionCard key={section.title} title={section.title} fields={section.fields} />
        ))}
      </div>
    </article>
  )
}

export default function SkaleAccountPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState(null)

  const hints = useMemo(() => ['email', 'name', 'phone', 'MT ID', 'Lead ID', 'CRM account id'], [])

  async function onSearch(e) {
    e.preventDefault()
    const q = String(query || '').trim()
    if (!q) return

    setLoading(true)
    setError('')
    try {
      const resp = await fetch('/api/skale/account-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 8 }),
      })
      const payload = await resp.json()
      if (!resp.ok || payload?.ok === false) {
        throw new Error(payload?.message || payload?.error || 'Search failed')
      }
      setResponse(payload)
    } catch (err) {
      setResponse(null)
      setError(err?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-shell" style={{ display: 'grid', gap: 14 }}>
      <header>
        <h1 className="page-title">Skale Account</h1>
        <p className="page-subtitle">
          Search once and get a clean, business-friendly customer profile.
        </p>
      </header>

      <div
        className="card"
        style={{
          padding: 16,
          border: '1px solid rgba(56,189,248,0.28)',
          background:
            'linear-gradient(140deg, rgba(8,47,73,0.32), rgba(30,58,138,0.25) 45%, rgba(6,95,70,0.2))',
          boxShadow: '0 18px 36px rgba(2,6,23,0.25)',
          display: 'grid',
          gap: 12,
        }}
      >
        <form onSubmit={onSearch} style={{ display: 'grid', gap: 10 }}>
          <label
            htmlFor="skale-account-search"
            style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 13 }}
          >
            Search customer
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <input
              id="skale-account-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="email, full name, phone, MT account, lead ID..."
              style={{
                width: '100%',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.38)',
                background: 'rgba(2,6,23,0.72)',
                color: '#e2e8f0',
                padding: '12px 14px',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !String(query || '').trim()}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(56,189,248,0.5)',
                background: loading
                  ? 'rgba(30,41,59,0.6)'
                  : 'linear-gradient(135deg, #0284c7, #06b6d4)',
                color: '#f8fafc',
                padding: '0 16px',
                minHeight: 44,
                fontWeight: 800,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {hints.map((hint) => (
            <span
              key={hint}
              style={{
                padding: '4px 9px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: '#dbeafe',
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(15,23,42,0.35)',
              }}
            >
              {hint}
            </span>
          ))}
        </div>

        {error ? (
          <div
            style={{
              color: '#fecaca',
              background: 'rgba(127,29,29,0.45)',
              border: '1px solid rgba(239,68,68,0.55)',
              borderRadius: 10,
              padding: '10px 12px',
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      {response ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div
            className="card"
            style={{
              padding: 12,
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(2,6,23,0.58)',
              color: '#cbd5e1',
              fontWeight: 700,
            }}
          >
            Query: <span style={{ color: '#f8fafc' }}>{asText(response.query)}</span> | Profiles
            found: <span style={{ color: '#f8fafc' }}>{Number(response.count || 0)}</span>
          </div>

          {Array.isArray(response.results) && response.results.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {response.results.map((item, idx) => (
                <ResultCard
                  key={`${item?.summary?.leadId || 'lead'}-${item?.summary?.mtId || idx}-${idx}`}
                  item={item}
                  idx={idx}
                />
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{ padding: 18, color: '#94a3b8', border: '1px dashed rgba(148,163,184,0.4)' }}
            >
              No matches found for this query.
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
