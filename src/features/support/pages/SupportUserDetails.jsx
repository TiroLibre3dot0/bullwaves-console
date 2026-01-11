import React, { useMemo, useState } from 'react'
import FullPageLoader from '../../../components/FullPageLoader'
import {
  buildSupportDecision,
  buildSupportDecisions,
  getAffiliateOverview,
  computeActivityIntelligence,
  getAffiliateMovesForUser,
} from '../services/supportUserCheckService'
import { useI18n } from '../../../i18n/I18nContext'

// Decision Card Component for displaying support decisions
function DecisionCard({ title, decision, category, bonusInputs, onChangeBonusInputs }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { t } = useI18n()

  if (!decision) return null

  const getStatusColor = (status) => {
    const colors = {
      ELIGIBLE: '#10b981', // green
      NOT_ELIGIBLE: '#ef4444', // red
      NEEDS_VERIFICATION: '#f59e0b', // amber
      WORKAROUND_RECOMMENDED: '#8b5cf6', // violet
      MANUAL_APPROVAL_REQUIRED: '#f97316', // orange
      APPROVED_WITH_CONDITIONS: '#06b6d4', // cyan
      NOT_APPROVED: '#ef4444', // red
      NEEDS_NEW_ACCOUNT: '#f59e0b', // amber
      NEEDS_MANUAL_REVIEW: '#f97316', // orange
      ELIGIBLE_AGAIN: '#10b981', // green
      NEEDS_CONTEXT: '#6b7280', // gray
      STANDARD_PROCESS: '#10b981', // green
      PAYMENT_METHOD_LOCK: '#ef4444', // red
      NEEDS_PSP_CHECK: '#f59e0b', // amber
      HIGH_RISK: '#ef4444', // red
      MODERATE_RISK: '#f59e0b', // amber
      PROFITABLE: '#10b981', // green
      NEUTRAL: '#6b7280', // gray
      CRITICAL_RISK: '#dc2626', // red-600
    }
    return colors[status] || '#6b7280'
  }

  const statusColor = getStatusColor(decision.status)
  const statusKey = decision?.status ? `support.decision.status.${decision.status}` : ''
  const statusLabelRaw = statusKey ? t(statusKey) : ''
  const statusLabel =
    statusKey && statusLabelRaw !== statusKey
      ? statusLabelRaw
      : (decision.status || '').replace(/_/g, ' ')

  // Defensive defaults to avoid runtime errors when shape is incomplete
  const why = decision?.whyKey
    ? t(decision.whyKey, decision.whyParams || {})
    : decision && decision.why !== undefined && decision.why !== null
      ? decision.why
      : '—'
  const nextActionsRaw = Array.isArray(decision?.nextActionsI18n)
    ? decision.nextActionsI18n
    : Array.isArray(decision && decision.nextActions)
      ? decision.nextActions
      : decision && decision.nextActions
        ? [String(decision.nextActions)]
        : []
  const nextActions = nextActionsRaw.map((item) => {
    if (item && typeof item === 'object' && item.key) return t(item.key, item.params || {})
    return String(item)
  })
  const signalsRaw = Array.isArray(decision?.signalsI18n)
    ? decision.signalsI18n
    : Array.isArray(decision && decision.signals)
      ? decision.signals
      : decision && decision.signals
        ? [String(decision.signals)]
        : []
  const signals = signalsRaw.map((item) => {
    if (item && typeof item === 'object' && item.key) return t(item.key, item.params || {})
    return String(item)
  })

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--surface)',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              flexShrink: 0,
            }}
          />
          <h4
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h4>
          <span
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-secondary)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {statusLabel}
          </span>
        </div>
        <div
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          ▼
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface-secondary)',
            padding: '16px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              {t('support.details.decision.why')}:
            </strong>
            <p
              style={{
                margin: '4px 0 0 0',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.4',
              }}
            >
              {why || '—'}
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              {t('support.details.decision.nextActions')}:
            </strong>
            {nextActions.length === 0 ? (
              <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>—</div>
            ) : (
              <ul
                style={{
                  margin: '4px 0 0 0',
                  paddingLeft: '20px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  lineHeight: '1.4',
                }}
              >
                {nextActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            )}
          </div>

          {signals && signals.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {t('support.details.decision.signals')}:
              </strong>
              <div
                style={{
                  marginTop: '4px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {signals.map((signal, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {category === 'bonus' && bonusInputs && typeof onChangeBonusInputs === 'function' && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 12,
                  marginBottom: 10,
                  color: 'var(--text-primary)',
                }}
              >
                BONUS DECISION
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Deposit amount
                  </div>
                  <input
                    type="number"
                    value={bonusInputs.depositAmount ?? 0}
                    onChange={(e) =>
                      onChangeBonusInputs((p) => ({
                        ...p,
                        depositAmount: Number(e.target.value || 0),
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Requested bonus %
                  </div>
                  <input
                    type="number"
                    value={bonusInputs.requestedBonusPercentage ?? 0}
                    onChange={(e) =>
                      onChangeBonusInputs((p) => ({
                        ...p,
                        requestedBonusPercentage: Number(e.target.value || 0),
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Requested bonus amount
                  </div>
                  <input
                    type="number"
                    value={bonusInputs.requestedBonusAmount ?? 0}
                    onChange={(e) =>
                      onChangeBonusInputs((p) => ({
                        ...p,
                        requestedBonusAmount: Number(e.target.value || 0),
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Trading history score (0–100)
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bonusInputs.tradingHistoryScore ?? 0}
                    onChange={(e) =>
                      onChangeBonusInputs((p) => ({
                        ...p,
                        tradingHistoryScore: Number(e.target.value || 0),
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Affiliate risk level
                  </div>
                  <select
                    value={bonusInputs.affiliateRiskLevel || 'medium'}
                    onChange={(e) =>
                      onChangeBonusInputs((p) => ({ ...p, affiliateRiskLevel: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Previous bonuses count
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={bonusInputs.previousBonusesCount ?? 0}
                    onChange={(e) =>
                      onChangeBonusInputs((p) => ({
                        ...p,
                        previousBonusesCount: Number(e.target.value || 0),
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
              </div>

              {decision?.bonusDecision && (
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    background: 'var(--surface)',
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800 }}>
                      {decision.bonusDecision.status}
                    </div>
                    {decision.bonusDecision.status === 'Approved – Dealing approval required' && (
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#f97316' }}>
                        DEALING APPROVAL REQUIRED
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {decision.bonusDecision.rationale}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SupportUserDetails({
  selected,
  affiliateName,
  affiliateKpi,
  paymentsLoaded,
  mediaLoaded,
  fmtEuro,
  suggestedReply,
  copyToClipboard,
  computePriority,
  onBack,
}) {
  const { t } = useI18n()

  const [affiliateMoves, setAffiliateMoves] = useState([])
  const [affiliateMovesLoading, setAffiliateMovesLoading] = useState(false)

  // Derived UI values (computed once)
  const mapped = selected || { raw: {} }
  const displayName = mapped.name || mapped.userId || '—'
  const accountId = mapped.userId || '—'
  const mt5 = mapped.mt5 || '—'
  const country = mapped.country || '—'
  const totalDeposits = fmtEuro(mapped.totalDeposits)
  const withdrawals = fmtEuro(mapped.withdrawals)
  const netDeposits = fmtEuro(mapped.netDeposits)
  const volume = mapped.volume || '—'
  const plRaw = mapped.pl || ''
  const affiliateId = mapped.affiliateId || ''
  const affiliateLabel = affiliateName?.affiliateName || '—'
  const commissions = mapped.affiliateCommissions || mapped.commissions || ''
  const priority = computePriority(mapped.raw || {})
  const suggested = selected
    ? suggestedReply(mapped, affiliateName, paymentsLoaded, mediaLoaded)
    : ''

  function toPartnerCustomerId(id) {
    const s = String(id || '').trim()
    if (!s || s === '—') return null
    const lower = s.toLowerCase()
    if (lower.startsWith('bullwaves-')) {
      const digits = s.slice('bullwaves-'.length).replace(/\D+/g, '')
      return digits ? `bullwaves-${digits}` : null
    }
    const digits = s.replace(/\D+/g, '')
    return digits ? `bullwaves-${digits}` : null
  }

  const partnerCustomerId = toPartnerCustomerId(accountId)
  const partnerProfileUrl = partnerCustomerId
    ? `https://partner.trackingaffiliates.com/v2/adminv2/#!/app/customer-profile/${encodeURIComponent(partnerCustomerId)}`
    : null

  function initialsForName(v) {
    const s = String(v || '').trim()
    if (!s || s === '—') return 'BW'
    const parts = s.split(/\s+/).filter(Boolean)
    const first = (parts[0] || '')[0] || ''
    const second = (parts[1] || '')[0] || (parts[0] || '')[1] || ''
    const out = `${first}${second}`.toUpperCase()
    return out || 'BW'
  }

  const partnerInitials = initialsForName(displayName)

  React.useEffect(() => {
    let cancelled = false
    async function run() {
      const uid = mapped.userId || ''
      if (!uid) {
        setAffiliateMoves([])
        return
      }
      setAffiliateMovesLoading(true)
      try {
        const moves = await getAffiliateMovesForUser(uid)
        if (!cancelled) setAffiliateMoves(Array.isArray(moves) ? moves : [])
      } catch {
        if (!cancelled) setAffiliateMoves([])
      } finally {
        if (!cancelled) setAffiliateMovesLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [mapped.userId])

  // BONUS decision inputs (additive only; used by isolated bonus engine)
  const [bonusInputs, setBonusInputs] = useState(() => ({
    clientId: accountId,
    depositAmount: 0,
    requestedBonusPercentage: 0,
    requestedBonusAmount: 0,
    tradingHistoryScore: 0,
    affiliateRiskLevel: 'medium',
    previousBonusesCount: 0,
  }))

  // Normalize helper for comparing affiliate names
  function normalizeKey(s) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '')
  }
  // Compute affiliate display and flags for sidebar (raw row is available lower in file)
  // rawAffiliateName, affiliateDisplay, affiliateMappingMissing and affiliateNameMismatch
  // will be computed after `raw` is defined to avoid temporal dead zone errors.

  // Timeline & metrics derived values
  function parseDate(v) {
    if (v instanceof Date) return v
    if (!v && v !== 0) return null
    // numeric timestamps
    if (typeof v === 'number' || /^[0-9]+$/.test(String(v))) {
      const n = Number(v)
      if (!Number.isFinite(n)) return null
      // handle unix timestamps in seconds (10 digits) vs ms (13 digits)
      const ms = n < 1e12 ? n * 1000 : n
      const d = new Date(ms)
      if (Number.isNaN(d.getTime())) return null
      return d
    }
    const s = String(v || '').trim()
    if (!s) return null
    // dd/mm/yyyy HH:mm -> convert
    const dm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?$/)
    if (dm) {
      const [, dd, mm, yyyy, hh = '00', mi = '00'] = dm
      const d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00`)
      if (Number.isNaN(d.getTime())) return null
      return d
    }
    // try native parser
    const d2 = new Date(s)
    if (Number.isNaN(d2.getTime())) return null
    return d2
  }

  function fmtDate(v) {
    const d = parseDate(v)
    if (!d) return null
    const pad = (n) => String(n).padStart(2, '0')
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const hours = pad(d.getHours())
    const mins = pad(d.getMinutes())
    const year = d.getFullYear()
    // Compact format but include year: DD/MM/YYYY HH:mm
    return `${day}/${month}/${year} ${hours}:${mins}`
  }

  function pickRawField(raw, candidates) {
    if (!raw) return null
    for (const k of candidates) {
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== '') return raw[k]
    }
    return null
  }

  // Source dates from the mapped object/raw row (try several common keys)
  const regCandidates = [
    'regdate',
    'registrationdate',
    'registered',
    'externaldate',
    'registration',
  ]
  const firstDepositCandidates = [
    'firstdeposit',
    'first_deposit',
    'firstdepositdate',
    'firstdeposit_at',
    'firstdepositdate',
  ]
  const ftdCandidates = ['ftd', 'firsttrade', 'first_trade', 'firsttradedate', 'first_trade_date']
  const qftdCandidates = ['qualificationdate', 'qualification_date', 'qualifydate', 'qftd']
  const withdrawalDateCandidates = [
    'firstwithdrawal',
    'first_withdrawal',
    'withdrawaldate',
    'firstwithdrawaldate',
  ]

  const raw = mapped.raw || {}

  const regAt =
    mapped.regDate || pickRawField(raw, regCandidates) || mapped.registrationdate || null
  // First deposit: the report often contains only an amount (not a date).
  // Extract amount separately and look for a dedicated date field if present.
  const firstDepositAmountCandidates = [
    'firstdeposit',
    'first_deposit',
    'firstDeposit',
    'firstDepositAmount',
    'first_deposit_amount',
  ]
  const firstDepositAmountRaw =
    mapped.firstDeposit ||
    pickRawField(raw, firstDepositAmountCandidates) ||
    mapped.firstdeposit ||
    null
  const firstDepositAt =
    pickRawField(raw, ['firstdepositdate', 'first_deposit_date', 'firstDepositDate']) ||
    mapped.firstDepositDate ||
    null
  const ftdAt = mapped.ftd || pickRawField(raw, ftdCandidates) || null
  const qftdAt = mapped.qualificationDate || pickRawField(raw, qftdCandidates) || null
  const firstWithdrawalAt = pickRawField(raw, withdrawalDateCandidates) || null

  const regAtFmt = fmtDate(regAt)
  const firstDepositAtFmt = fmtDate(firstDepositAt)
  const ftdAtFmt = fmtDate(ftdAt)
  const qftdAtFmt = fmtDate(qftdAt)
  const firstWithdrawalAtFmt = fmtDate(firstWithdrawalAt)

  // Compute affiliate display and flags for sidebar (safe now that `raw` is defined)
  const rawAffiliateName = pickRawField(raw, ['affiliate', 'affiliatename', 'name']) || null
  const affiliateDisplay = (() => {
    const name = affiliateName?.affiliateName
    if (name && affiliateId) return `${name} · ${affiliateId}`
    if (name) return name
    if (affiliateId) return String(affiliateId)
    return t('support.details.noAffiliate')
  })()
  const affiliateMappingMissing = Boolean(
    mapped.affiliateId && (!affiliateName || !affiliateName.affiliateName)
  )
  const affiliateNameMismatch = Boolean(
    rawAffiliateName &&
    affiliateName &&
    affiliateName.affiliateName &&
    normalizeKey(rawAffiliateName) !== normalizeKey(affiliateName.affiliateName)
  )

  const regDateObj = parseDate(regAt)
  const firstDepositDateObj = parseDate(firstDepositAt)
  const ftdDateObj = parseDate(ftdAt)
  const qftdDateObj = parseDate(qftdAt)
  const firstWithdrawalDateObj = parseDate(firstWithdrawalAt)

  const depositsCountVal = mapped.depositCount != null ? Number(mapped.depositCount) || 0 : null
  // withdrawals count may be in raw fields; try common keys
  const withdrawalCountCandidates = [
    'withdrawalcount',
    'withdrawalscount',
    'withdrawal_count',
    'withdrawals_count',
  ]
  const withdrawalsCountVal =
    mapped.withdrawalsCount != null
      ? Number(mapped.withdrawalsCount) || 0
      : Number(pickRawField(mapped.raw || {}, withdrawalCountCandidates)) || null
  const avgDeposit =
    depositsCountVal && depositsCountVal > 0 && mapped.totalDeposits != null
      ? fmtEuro(Number(mapped.totalDeposits) / depositsCountVal)
      : null
  const avgWithdrawal =
    withdrawalsCountVal && withdrawalsCountVal > 0 && mapped.withdrawals != null
      ? fmtEuro(Number(mapped.withdrawals) / withdrawalsCountVal)
      : null
  const netCashFlow = mapped.netDeposits != null ? fmtEuro(mapped.netDeposits) : null
  const tradingDaysVal = mapped.tradingDays != null ? Number(mapped.tradingDays) || 0 : null

  // ROI: P/L divided by total deposits (percentage)
  const totalDepositsNum = Number(
    String((mapped.totalDeposits || '').toString().replace(/[^0-9.-]+/g, '')) || 0
  )
  const withdrawalsNum = Number(
    String((mapped.withdrawals || '').toString().replace(/[^0-9.-]+/g, '')) || 0
  )
  const plNum = Number(String((mapped.pl || '').toString().replace(/[^0-9.-]+/g, '')) || 0)
  const plDisplay = plRaw ? (fmtEuro ? fmtEuro(plNum) : plNum.toFixed(2)) : '—'
  const roiVal = totalDepositsNum ? `${((plNum / totalDepositsNum) * 100).toFixed(2)}%` : null

  const withdrawalRatioVal =
    totalDepositsNum > 0 && withdrawalsNum >= 0
      ? `${((withdrawalsNum / Math.max(totalDepositsNum, 1)) * 100).toFixed(0)}%`
      : null

  const withdrawalRatioPct =
    totalDepositsNum > 0 && withdrawalsNum >= 0
      ? (withdrawalsNum / Math.max(totalDepositsNum, 1)) * 100
      : null
  const withdrawalRatioTone = (() => {
    if (withdrawalRatioPct == null) return 'neutral'
    if (withdrawalRatioPct >= 105) return 'critical'
    if (withdrawalRatioPct >= 90) return 'high'
    if (withdrawalRatioPct >= 70) return 'warn'
    return 'ok'
  })()
  const withdrawalPill = (() => {
    const base = {
      padding: '6px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 950,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    }
    if (withdrawalRatioTone === 'critical')
      return {
        ...base,
        color: '#fee2e2',
        background: 'rgba(239,68,68,0.16)',
        border: '1px solid rgba(239,68,68,0.32)',
      }
    if (withdrawalRatioTone === 'high')
      return {
        ...base,
        color: '#fecaca',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.24)',
      }
    if (withdrawalRatioTone === 'warn')
      return {
        ...base,
        color: '#fff7ed',
        background: 'rgba(245,158,11,0.14)',
        border: '1px solid rgba(245,158,11,0.26)',
      }
    if (withdrawalRatioTone === 'ok')
      return {
        ...base,
        color: '#e2e8f0',
        background: 'rgba(59,130,246,0.10)',
        border: '1px solid rgba(59,130,246,0.20)',
      }
    return {
      ...base,
      color: 'rgba(255,255,255,0.78)',
      background: 'rgba(148,163,184,0.10)',
      border: '1px solid rgba(148,163,184,0.18)',
    }
  })()

  // Keep bonus input defaults aligned to the currently selected user.
  const firstDepositAmountNum = parseNumberField(firstDepositAmountRaw)
  React.useEffect(() => {
    const fallbackDeposit = firstDepositAmountNum > 0 ? firstDepositAmountNum : totalDepositsNum
    setBonusInputs((p) => ({
      ...p,
      clientId: accountId,
      depositAmount: p.depositAmount ? p.depositAmount : fallbackDeposit || 0,
    }))
  }, [accountId])

  // Commissions breakdown: sum of affiliate + sub-affiliate + revshare + other
  function parseNumberField(v) {
    if (v == null || v === '') return 0
    const s = String(v)
    const n = Number(s.replace(/[^0-9.-]+/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const affiliateComm = parseNumberField(
    mapped.affiliateCommissions ||
      mapped.affiliateCommission ||
      mapped.affiliate_commissions ||
      mapped['Affiliate Commissions'] ||
      mapped['Affiliate Commission']
  )
  const subAffiliateComm = parseNumberField(
    mapped.subAffiliateCommissions ||
      mapped.sub_affiliate_commissions ||
      mapped.subAffiliateCommission ||
      mapped['Sub Affiliate Commissions'] ||
      mapped['Sub Affiliate Commission']
  )
  const revshareComm = parseNumberField(
    mapped.revshareCommission ||
      mapped.revshare_commission ||
      mapped.revshare ||
      mapped['Revshare Commission']
  )
  const cpaComm = parseNumberField(
    mapped.cpaCommission ||
      mapped.cpa_commission ||
      mapped['CPA Commission'] ||
      mapped.CPA ||
      mapped.cpa ||
      0
  )
  const cplComm = parseNumberField(
    mapped.cplCommission ||
      mapped.cpl_commission ||
      mapped['CPL Commission'] ||
      mapped.CPL ||
      mapped.cpl ||
      0
  )
  const otherComm = parseNumberField(
    mapped.otherCommissions ||
      mapped.other_commissions ||
      mapped.otherCommission ||
      mapped['Other Commissions']
  )

  // Heuristic: if there is no explicit CPA field but Affiliate value exists,
  // treat Affiliate as CPA (many reports use the Affiliate field to carry CPA).
  const hasExplicitCpa = Boolean(
    pickRawField(raw, ['CPA Commission', 'CPA', 'cpaCommission', 'cpa_commission']) ||
    mapped.cpaCommission ||
    mapped.cpa_commission ||
    mapped.CPA ||
    mapped.cpa
  )
  let affiliateEffective = affiliateComm
  let cpaEffective = cpaComm
  if (!hasExplicitCpa && affiliateComm > 0 && cpaComm === 0) {
    // move affiliate amount into CPA
    cpaEffective = cpaComm + affiliateComm
    affiliateEffective = 0
  }

  // If the report already provides a total 'Commissions' field, prefer it as the authoritative total
  const totalCommField = parseNumberField(
    mapped.commissions ||
      mapped.Commissions ||
      mapped['Commissions'] ||
      pickRawField(raw, ['Commissions', 'commissions'])
  )
  const commissionsTotalNum =
    totalCommField > 0
      ? totalCommField
      : affiliateEffective + subAffiliateComm + revshareComm + cpaEffective + cplComm + otherComm
  const commissionsTotal = fmtEuro ? fmtEuro(commissionsTotalNum) : String(commissionsTotalNum)

  // First deposit amount formatted
  const firstDepositAmount = firstDepositAmountNum
    ? fmtEuro
      ? fmtEuro(firstDepositAmountNum)
      : String(firstDepositAmountNum)
    : firstDepositAmountRaw
      ? String(firstDepositAmountRaw)
      : null

  // Reusable metric card style to keep sizing consistent
  const metricCardStyle = {
    padding: 10,
    minHeight: 68,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }

  // Trade activities
  const volumeVal = mapped.volume != null ? mapped.volume : mapped.Volume || mapped.VOLUME || null
  const lotsVal = mapped.lots != null ? mapped.lots : mapped.LOTS || mapped.Lot || null
  const spreadVal = mapped.spread != null ? mapped.spread : mapped.Spread || null
  const positionCountRaw =
    mapped.positionCount != null
      ? mapped.positionCount
      : pickRawField(raw, ['positioncount', 'position_count', 'Position Count'])
  const positionCountNum =
    positionCountRaw != null && String(positionCountRaw).trim() !== ''
      ? Number(String(positionCountRaw).replace(/[^0-9.-]+/g, ''))
      : null
  const positionCountVal = Number.isFinite(positionCountNum) ? Math.trunc(positionCountNum) : null

  const activityIntel = useMemo(() => computeActivityIntelligence(raw), [raw])
  const ppdTooltip = t('support.activity.tooltip.positionsPerDay')

  // Support Decision Engine
  const supportDecisions = useMemo(() => {
    return buildSupportDecisions({
      ...mapped,
      paymentsLoaded,
      mediaLoaded,
      ...bonusInputs,
    })
  }, [mapped, paymentsLoaded, mediaLoaded, bonusInputs])

  // Action panel state
  const [replyText, setReplyText] = useState(suggested)
  const [targetAffiliateId, setTargetAffiliateId] = useState('')
  const [statusHelpOpen, setStatusHelpOpen] = useState(false)

  // UI: focus mode (widen center content by hiding side columns)
  const [isFocusCenter, setIsFocusCenter] = useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('bw_support_details_focus_center')
      if (saved === '1') setIsFocusCenter(true)
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('bw_support_details_focus_center', isFocusCenter ? '1' : '0')
    } catch {
      // ignore
    }
  }, [isFocusCenter])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (e) => {
      if (e.defaultPrevented) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const key = String(e.key || '').toLowerCase()
      if (key !== 'f') return

      const el = document.activeElement
      const tag = el && el.tagName ? String(el.tagName).toLowerCase() : ''
      const isEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' || (el && el.isContentEditable)
      if (isEditable) return

      e.preventDefault()
      setIsFocusCenter((v) => !v)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Desktop optimization: collapse left identity column after scrolling
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const isLeftCollapsedRef = React.useRef(false)

  // Affiliate overview data - now async
  const [currentAffiliateOverview, setCurrentAffiliateOverview] = useState(null)
  const [targetAffiliateOverview, setTargetAffiliateOverview] = useState(null)
  const [affiliateLoading, setAffiliateLoading] = useState(false)

  // Load affiliate overview data
  React.useEffect(() => {
    const loadCurrentAffiliate = async () => {
      if (affiliateId) {
        setAffiliateLoading(true)
        try {
          const overview = await getAffiliateOverview(affiliateId)
          setCurrentAffiliateOverview(overview)
        } catch (error) {
          console.error('Error loading affiliate overview:', error)
          setCurrentAffiliateOverview(null)
        } finally {
          setAffiliateLoading(false)
        }
      } else {
        setCurrentAffiliateOverview(null)
      }
    }
    loadCurrentAffiliate()
  }, [affiliateId])

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const scrolledClass = 'support-details-scrolled'
    const scrollEl = document.querySelector('.dashboard-content')

    const getScrollTop = () => {
      if (scrollEl && typeof scrollEl.scrollTop === 'number') return scrollEl.scrollTop
      return window.scrollY || 0
    }

    const isMobile = () =>
      window.matchMedia?.('(max-width: 880px)')?.matches ?? window.innerWidth <= 880

    const onScroll = () => {
      const scrollTop = getScrollTop()
      const mobile = isMobile()

      // Mobile: collapse as soon as scrolling starts. Desktop: keep the previous threshold.
      const thresholdPx = mobile ? 1 : 140
      const nextCollapsed = scrollTop > thresholdPx
      if (isLeftCollapsedRef.current !== nextCollapsed) {
        isLeftCollapsedRef.current = nextCollapsed
        setIsLeftCollapsed(nextCollapsed)
      }

      if (mobile) {
        document.body.classList.toggle(scrolledClass, scrollTop > 0)
      } else {
        document.body.classList.remove(scrolledClass)
      }
    }

    onScroll()

    const target = scrollEl || window
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.body.classList.remove(scrolledClass)
    }
  }, [])

  React.useEffect(() => {
    const loadTargetAffiliate = async () => {
      if (targetAffiliateId) {
        setAffiliateLoading(true)
        try {
          const overview = await getAffiliateOverview(targetAffiliateId)
          setTargetAffiliateOverview(overview)
        } catch (error) {
          console.error('Error loading target affiliate overview:', error)
          setTargetAffiliateOverview(null)
        } finally {
          setAffiliateLoading(false)
        }
      } else {
        setTargetAffiliateOverview(null)
      }
    }
    loadTargetAffiliate()
  }, [targetAffiliateId])

  // Update reply text when support decisions change
  React.useEffect(() => {
    // For now, use the suggested reply - can be enhanced later with decision-specific templates
    setReplyText(suggested)
  }, [suggested])

  React.useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.add('support-details-mode')
    return () => {
      document.body.classList.remove('support-details-mode')
    }
  }, [])

  // Only decide what to render after all hooks have run (Rules of Hooks).
  const detailsProgress = (paymentsLoaded ? 50 : 0) + (mediaLoaded ? 50 : 0)
  if (!selected) return null
  if (!paymentsLoaded || !mediaLoaded) {
    return (
      <FullPageLoader
        progress={detailsProgress}
        subtitle={t('support.details.loader.userDetails')}
      />
    )
  }

  function handleCopy() {
    copyToClipboard(replyText)
  }
  function handleEscalate(kind) {
    if (!window.confirm(t('support.details.confirmEscalate', { accountId, kind }))) return
    console.log('escalate', { userId: accountId, kind, selected: mapped })
  }

  return (
    <div className="support-user-details-page">
      {/* Top per-user timeline removed: keep the compact horizontal timeline below */}
      {/* Top bar */}
      <div className="support-details-topbar">
        <div className="support-details-inner">
          <div className="support-details-topbar-row">
            <div className="support-details-topbar-left">
              <button
                type="button"
                className="support-back-btn"
                onClick={onBack}
                aria-label={t('support.details.backToResults')}
                title={t('support.details.backToResults')}
              >
                <span aria-hidden>←</span>
              </button>
              <div className="support-details-topbar-basic">
                <div
                  className="support-details-topbar-name"
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span
                    style={{
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                  {partnerProfileUrl ? (
                    <a
                      className="support-partner-pill"
                      href={partnerProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={t('support.details.partnerProfile.hint', {
                        customerId: partnerCustomerId,
                      })}
                      aria-label={t('support.details.partnerProfile.hint', {
                        customerId: partnerCustomerId,
                      })}
                    >
                      <span className="support-partner-pill-initials">{partnerInitials}</span>
                      <span className="support-partner-pill-text">
                        {t('support.details.partnerProfile.label')}
                      </span>
                      <span aria-hidden className="support-partner-pill-ext">
                        ↗
                      </span>
                    </a>
                  ) : null}
                </div>
                <div className="support-details-topbar-meta">
                  {accountId}
                  {mt5 ? ` · ${mt5}` : ''}
                </div>
              </div>
            </div>

            <div className="support-details-topbar-actions">
              <button
                type="button"
                className={`support-topbar-btn${isFocusCenter ? ' is-active' : ''}`}
                onClick={() => setIsFocusCenter((v) => !v)}
                title={t('support.details.focusCenter.hint')}
                aria-label={t('support.details.focusCenter.hint')}
              >
                {isFocusCenter
                  ? t('support.details.focusCenter.exit')
                  : t('support.details.focusCenter.enter')}
              </button>
            </div>
          </div>

          <div className="support-details-topbar-affiliate">
            {t('support.details.affiliate')}: {affiliateDisplay}
          </div>
        </div>
      </div>

      {/* Dashboard layout: left identity card, center content, right Support Decision Engine */}
      <div className="support-details-inner">
        <div
          className={`support-detail-grid support-detail-grid--3col${isLeftCollapsed ? ' is-left-collapsed' : ''}${isFocusCenter ? ' is-focus-center' : ''}`}
        >
          <aside
            className="identity-card card min-w-0"
            style={{ textAlign: 'left', alignSelf: 'stretch' }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {partnerProfileUrl ? (
                <a
                  className="support-partner-avatar-link"
                  href={partnerProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={t('support.details.partnerProfile.hint', {
                    customerId: partnerCustomerId,
                  })}
                  aria-label={t('support.details.partnerProfile.hint', {
                    customerId: partnerCustomerId,
                  })}
                >
                  <div
                    className="support-partner-avatar"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg,#06b6d4,#7c3aed)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {partnerInitials}
                    <span aria-hidden className="support-partner-avatar-ext">
                      ↗
                    </span>
                  </div>
                </a>
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg,#06b6d4,#7c3aed)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {partnerInitials}
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{displayName}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
                  {country} · {mt5}
                </div>
                {mapped.status ? (
                  <div style={{ marginTop: 8 }} className="status-help-wrap">
                    <button
                      type="button"
                      className={`badge status status-help-trigger${statusHelpOpen ? ' is-open' : ''}`}
                      onClick={() => setStatusHelpOpen((v) => !v)}
                      onBlur={() => setStatusHelpOpen(false)}
                      aria-label={t('support.details.statusHelp.aria', { status: mapped.status })}
                      aria-expanded={statusHelpOpen ? 'true' : 'false'}
                    >
                      {mapped.status}
                    </button>
                    <div
                      className={`status-help-popover${statusHelpOpen ? ' is-open' : ''}`}
                      role="tooltip"
                    >
                      {(() => {
                        const rawStatus = String(mapped.status || '').trim()
                        const key = rawStatus.toLowerCase()
                        const map = {
                          duplicate: 'support.details.statusHelp.duplicate',
                          new: 'support.details.statusHelp.new',
                          active: 'support.details.statusHelp.active',
                          blocked: 'support.details.statusHelp.blocked',
                        }
                        const tk = map[key] || 'support.details.statusHelp.default'
                        return t(tk)
                      })()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t('support.details.account')}
              </div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>{accountId}</div>
              <div style={{ height: 12 }} />
              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  marginTop: 12,
                  paddingTop: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {t('support.details.affiliate')}
                </div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>
                  {affiliateDisplay || t('support.details.noAffiliate')}
                  {affiliateMappingMissing && (
                    <span style={{ color: 'orange', fontSize: 10, marginLeft: 8 }}>
                      ({t('support.details.affiliateNameMissing')})
                    </span>
                  )}
                  {affiliateNameMismatch && (
                    <span style={{ color: 'red', fontSize: 10, marginLeft: 8 }}>
                      ({t('support.details.affiliateNameMismatch')})
                    </span>
                  )}
                </div>
              </div>

              {/* Affiliate move history (from comments report) */}
              <div
                style={{
                  marginTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  paddingTop: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {t('support.details.affiliateMoves.title')}
                </div>
                {affiliateMovesLoading ? (
                  <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>
                    {t('support.details.affiliateMoves.loading')}
                  </div>
                ) : affiliateMoves && affiliateMoves.length ? (
                  <div style={{ marginTop: 8, display: 'grid', gap: 8, fontSize: 13 }}>
                    {affiliateMoves.slice(0, 3).map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          alignItems: 'baseline',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: 'var(--text)' }}>
                          {String(m.fromAffiliateId || '—')} → {String(m.toAffiliateId || '—')}
                        </div>
                        {m.createdOn ? (
                          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                            {String(m.createdOn)}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {affiliateMoves.length > 3 ? (
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {t('support.details.affiliateMoves.more', {
                          count: affiliateMoves.length - 3,
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>
                    {t('support.details.affiliateMoves.none')}
                  </div>
                )}
              </div>

              {/* Commissions detail inserted into left sidebar */}
              <div
                style={{
                  marginTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  paddingTop: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {t('support.details.commissions.title')}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>
                  {commissionsTotal}
                </div>
                <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--muted)',
                    }}
                  >
                    <div>{t('support.details.commissions.revshare')}</div>
                    <div>
                      {revshareComm
                        ? fmtEuro
                          ? fmtEuro(revshareComm)
                          : String(revshareComm)
                        : '—'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--muted)',
                    }}
                  >
                    <div>{t('support.details.commissions.cpa')}</div>
                    <div>
                      {cpaEffective
                        ? fmtEuro
                          ? fmtEuro(cpaEffective)
                          : String(cpaEffective)
                        : '—'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--muted)',
                    }}
                  >
                    <div>{t('support.details.commissions.cpl')}</div>
                    <div>{cplComm ? (fmtEuro ? fmtEuro(cplComm) : String(cplComm)) : '—'}</div>
                  </div>
                  {affiliateEffective ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--muted)',
                      }}
                    >
                      <div>{t('support.details.commissions.affiliate')}</div>
                      <div>
                        {fmtEuro ? fmtEuro(affiliateEffective) : String(affiliateEffective)}
                      </div>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--muted)',
                    }}
                  >
                    <div>{t('support.details.commissions.subAffiliate')}</div>
                    <div>
                      {subAffiliateComm
                        ? fmtEuro
                          ? fmtEuro(subAffiliateComm)
                          : String(subAffiliateComm)
                        : '—'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--muted)',
                    }}
                  >
                    <div>{t('support.details.commissions.other')}</div>
                    <div>
                      {otherComm ? (fmtEuro ? fmtEuro(otherComm) : String(otherComm)) : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Behaviour & Risk removed as requested */}
            </div>
          </aside>

          <div className="center-col min-w-0 w-full max-w-none">
            <div style={{ maxWidth: 'none', margin: 0, width: '100%' }}>
              <section
                style={{
                  marginBottom: 12,
                  padding: '8px 6px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>
                  {t('support.details.userTimeline.title')}
                </div>
                <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="timeline"
                      style={{
                        padding: 8,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxShadow: '0 6px 12px rgba(2,6,23,0.45)',
                      }}
                    >
                      <div
                        className="timeline-item"
                        style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}
                      >
                        <div className="timeline-dot-wrapper">
                          <div
                            className={`timeline-dot ${regDateObj ? 'reached milestone-reg' : ''}`}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>
                            {t('support.details.userTimeline.registration')}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                            {regAtFmt ? (
                              regAtFmt
                            ) : (
                              <span className="text-muted">
                                {t('support.details.userTimeline.notReached')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {regDateObj && (firstDepositAt || qftdDateObj) && (
                        <div
                          className="timeline-gap"
                          style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 8 }}
                        >
                          {firstDepositAt
                            ? t('support.details.userTimeline.daysDelta', {
                                days: Math.max(
                                  0,
                                  Math.round(
                                    (parseDate(firstDepositAt) - regDateObj) / (1000 * 60 * 60 * 24)
                                  )
                                ),
                              })
                            : ''}
                        </div>
                      )}

                      <div
                        className="timeline-item"
                        style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}
                      >
                        <div className="timeline-dot-wrapper">
                          <div
                            className={`timeline-dot ${parseDate(firstDepositAt) ? 'reached milestone-dep' : ''}`}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>
                            {t('support.details.userTimeline.depositDate')}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                            {firstDepositAtFmt ? (
                              firstDepositAtFmt
                            ) : (
                              <span className="text-muted">
                                {t('support.details.userTimeline.notReached')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {parseDate(firstDepositAt) && qftdDateObj && (
                        <div
                          className="timeline-gap"
                          style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 8 }}
                        >
                          {t('support.details.userTimeline.daysDelta', {
                            days: Math.max(
                              0,
                              Math.round(
                                (qftdDateObj - parseDate(firstDepositAt)) / (1000 * 60 * 60 * 24)
                              )
                            ),
                          })}
                        </div>
                      )}

                      <div
                        className="timeline-item"
                        style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                      >
                        <div className="timeline-dot-wrapper">
                          <div
                            className={`timeline-dot ${qftdDateObj ? 'reached milestone-qftd' : ''}`}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>
                            {t('support.details.userTimeline.qualification')}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                            {qftdAtFmt ? (
                              qftdAtFmt
                            ) : (
                              <span className="text-muted">
                                {t('support.details.userTimeline.notReached')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right-hand timeline details removed to avoid repeated status/dates — timeline is authoritative */}
                </div>
              </section>

              <section style={{ marginTop: 8, marginBottom: 8 }}>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                    {t('support.details.financialSummary.title')}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.totalDeposits')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
                        {totalDeposits}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.netDeposits')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
                        {netDeposits}
                      </div>
                    </div>

                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.netCashFlow')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
                        {netCashFlow != null ? netCashFlow : '—'}
                      </div>
                    </div>

                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.withdrawals')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
                        {withdrawals}
                      </div>
                    </div>

                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.withdrawalRatio')}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {withdrawalRatioVal != null ? (
                          <span
                            style={withdrawalPill}
                            title={t('support.activity.tooltip.withdrawalRatio')}
                          >
                            {withdrawalRatioVal}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 800 }}>
                            —
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.depositsCount')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
                        {depositsCountVal != null ? depositsCountVal : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.financialSummary.firstDeposit')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>
                        {firstDepositAmount ? firstDepositAmount : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section style={{ marginTop: 6, marginBottom: 12 }}>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                    {t('support.details.tradingPerformance.title')}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.tradingPerformance.volume')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                        {volumeVal != null ? volumeVal : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.tradingPerformance.lots')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                        {lotsVal != null ? lotsVal : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.tradingPerformance.spread')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                        {spreadVal != null ? spreadVal : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.tradingPerformance.positionCount')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                        {positionCountVal != null ? positionCountVal : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }} title={ppdTooltip}>
                        {t('support.activity.metrics.positionsPerDay')}
                      </div>
                      <div
                        style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}
                        title={ppdTooltip}
                      >
                        {activityIntel?.ageDays != null
                          ? activityIntel.positionsPerDay.toFixed(1)
                          : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.tradingPerformance.pl')}
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          marginTop: 6,
                          color: plRaw ? (plNum < 0 ? '#f87171' : '#22c55e') : 'var(--text)',
                        }}
                      >
                        {plDisplay}
                      </div>
                    </div>
                    <div className="card" style={{ ...metricCardStyle, gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.details.tradingPerformance.roi')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                        {roiVal != null ? roiVal : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section style={{ marginTop: 6, marginBottom: 12 }}>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                    {t('support.activity.title')}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.activity.metrics.ageDays')}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                        {activityIntel?.ageDays != null ? activityIntel.ageDays : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.activity.metrics.tier')}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 15, marginTop: 6 }}>
                        {activityIntel?.tier
                          ? t(`support.activity.tier.${activityIntel.tier}`)
                          : '—'}
                      </div>
                    </div>
                    <div className="card" style={metricCardStyle}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {t('support.activity.metrics.botFlag')}
                      </div>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: 15,
                          marginTop: 6,
                          color: activityIntel?.isPotentialBot
                            ? '#fca5a5'
                            : 'rgba(255,255,255,0.75)',
                        }}
                      >
                        {activityIntel?.isPotentialBot
                          ? t('support.activity.botFlag.yes')
                          : t('support.activity.botFlag.no')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activityIntel?.signals?.length ? (
                      activityIntel.signals.map((s) => {
                        const color =
                          s.severity === 'high'
                            ? '#ef4444'
                            : s.severity === 'medium'
                              ? '#f59e0b'
                              : '#60a5fa'
                        return (
                          <div
                            key={s.id}
                            className="card"
                            style={{
                              padding: '10px 12px',
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.06)',
                              background:
                                'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
                              display: 'flex',
                              gap: 10,
                              alignItems: 'flex-start',
                            }}
                          >
                            <span
                              aria-hidden
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                marginTop: 4,
                                background: color,
                                boxShadow: `0 0 0 4px ${color}22`,
                                flex: '0 0 auto',
                              }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 900, fontSize: 13 }}>
                                {t(s.titleKey, s.params || {})}
                              </div>
                              <div
                                style={{
                                  marginTop: 2,
                                  color: 'var(--muted)',
                                  fontSize: 12,
                                  lineHeight: 1.35,
                                }}
                              >
                                {t(s.bodyKey, s.params || {})}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {t('support.activity.signals.none')}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Activity Metrics removed — key metrics moved into Financial Summary to avoid duplication. */}
            </div>
          </div>
          {/* end center-col */}

          {/* Support Decision Engine - Right Column */}
          <aside className="decision-engine min-w-0" style={{ alignSelf: 'stretch' }}>
            <div
              style={{
                padding: 12,
                background: 'var(--bg)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 8,
                boxShadow: '0 6px 12px rgba(2,6,23,0.45)',
              }}
            >
              {/* Affiliate Overview Section */}
              {affiliateId && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
                    {t('support.details.affiliateOverview.title')}
                  </div>

                  {affiliateLoading ? (
                    <FullPageLoader
                      minHeight={180}
                      progress={60}
                      subtitle={t('support.details.affiliateOverview.loading')}
                    />
                  ) : currentAffiliateOverview ? (
                    <>
                      {/* Target Affiliate Input */}
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: 6,
                          }}
                        >
                          {t('support.details.affiliateOverview.compareLabel')}
                        </div>
                        <input
                          type="text"
                          value={targetAffiliateId}
                          onChange={(e) => setTargetAffiliateId(e.target.value)}
                          placeholder={t('support.details.affiliateOverview.enterPlaceholder')}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            fontSize: 11,
                          }}
                        />
                      </div>

                      {/* Comparison Card */}
                      <div
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--surface)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: targetAffiliateOverview ? '1fr 1fr' : '1fr',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                          }}
                        >
                          <div
                            style={{
                              padding: '8px 12px',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              textAlign: 'center',
                              borderRight: targetAffiliateOverview
                                ? '1px solid var(--border)'
                                : 'none',
                            }}
                          >
                            {t('support.details.affiliateOverview.currentPrefix')}:{' '}
                            {currentAffiliateOverview.name}
                          </div>
                          {targetAffiliateOverview && (
                            <div
                              style={{
                                padding: '8px 12px',
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                textAlign: 'center',
                              }}
                            >
                              {t('support.details.affiliateOverview.targetPrefix')}:{' '}
                              {targetAffiliateOverview.name}
                            </div>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: targetAffiliateOverview ? '1fr 1fr' : '1fr',
                          }}
                        >
                          {/* Current Affiliate Metrics */}
                          <div
                            style={{
                              padding: '12px',
                              borderRight: targetAffiliateOverview
                                ? '1px solid var(--border)'
                                : 'none',
                            }}
                          >
                            <div
                              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                            >
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {t('support.details.affiliateOverview.metrics.traffic')}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                {currentAffiliateOverview.clicks?.toLocaleString() || '—'}
                              </div>

                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {t('support.details.affiliateOverview.metrics.registrations')}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                {currentAffiliateOverview.registrations?.toLocaleString() || '—'}
                              </div>

                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {t('support.details.affiliateOverview.metrics.ftd')}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                {currentAffiliateOverview.ftd?.toLocaleString() || '—'}
                              </div>

                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {t('support.details.affiliateOverview.metrics.revenue')}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                {fmtEuro(currentAffiliateOverview.revenue)}
                              </div>

                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {t('support.details.affiliateOverview.metrics.ecpa')}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                {currentAffiliateOverview.ecpa
                                  ? fmtEuro(currentAffiliateOverview.ecpa)
                                  : '—'}
                              </div>

                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                {t('support.details.affiliateOverview.metrics.roi')}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  textAlign: 'right',
                                  color:
                                    (currentAffiliateOverview.roi || 0) >= 0
                                      ? '#10b981'
                                      : '#ef4444',
                                }}
                              >
                                {currentAffiliateOverview.roi
                                  ? `${currentAffiliateOverview.roi.toFixed(1)}%`
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          {/* Target Affiliate Metrics */}
                          {targetAffiliateOverview && (
                            <div style={{ padding: '12px' }}>
                              <div
                                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                              >
                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                  {t('support.details.affiliateOverview.metrics.traffic')}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                  {targetAffiliateOverview.clicks?.toLocaleString() || '—'}
                                </div>

                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                  {t('support.details.affiliateOverview.metrics.registrations')}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                  {targetAffiliateOverview.registrations?.toLocaleString() || '—'}
                                </div>

                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                  {t('support.details.affiliateOverview.metrics.ftd')}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                  {targetAffiliateOverview.ftd?.toLocaleString() || '—'}
                                </div>

                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                  {t('support.details.affiliateOverview.metrics.revenue')}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                  {fmtEuro(targetAffiliateOverview.revenue)}
                                </div>

                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                  {t('support.details.affiliateOverview.metrics.ecpa')}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
                                  {targetAffiliateOverview.ecpa
                                    ? fmtEuro(targetAffiliateOverview.ecpa)
                                    : '—'}
                                </div>

                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                                  {t('support.details.affiliateOverview.metrics.roi')}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    color:
                                      (targetAffiliateOverview.roi || 0) >= 0
                                        ? '#10b981'
                                        : '#ef4444',
                                  }}
                                >
                                  {targetAffiliateOverview.roi
                                    ? `${targetAffiliateOverview.roi.toFixed(1)}%`
                                    : '—'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {t('support.details.affiliateOverview.noData')}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>
                {t('support.details.supportDecisions.title')}
              </div>

              {supportDecisions ? (
                <div>
                  <DecisionCard
                    title={t('support.details.supportDecisions.affiliateSwitch')}
                    decision={supportDecisions.affiliateSwitch}
                    category="affiliateSwitch"
                  />
                  <DecisionCard
                    title={t('support.details.supportDecisions.accountTypeChange')}
                    decision={supportDecisions.accountTypeChange}
                    category="accountTypeChange"
                  />
                  <DecisionCard
                    title={t('support.details.supportDecisions.bonus')}
                    decision={supportDecisions.bonus}
                    category="bonus"
                    bonusInputs={bonusInputs}
                    onChangeBonusInputs={setBonusInputs}
                  />
                  <DecisionCard
                    title={t('support.details.supportDecisions.withdrawals')}
                    decision={supportDecisions.withdrawals}
                    category="withdrawals"
                  />
                  <DecisionCard
                    title={t('support.details.supportDecisions.revenueShare')}
                    decision={supportDecisions.revenueShare}
                    category="revenueShare"
                  />
                </div>
              ) : (
                <FullPageLoader
                  minHeight={220}
                  progress={55}
                  subtitle={t('support.details.loader.decisionEngine')}
                />
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                  {t('support.details.suggestedReply.title')}
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    padding: 12,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                  placeholder={t('support.details.suggestedReply.placeholder')}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={handleCopy} style={{ fontSize: 12 }}>
                    {t('support.details.copyToClipboard')}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {/* end support-detail-grid wrapper */}

      {/* Behaviour & Risk and Affiliate Impact removed (moved/aggregated into identity card). */}
    </div>
  )
}
