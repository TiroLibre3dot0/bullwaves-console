import React, { useMemo, useState } from 'react'
import { buildSupportDecision } from '../services/supportUserCheckService'

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
  onBack
}) {
  if (!selected) return null

  // Derived UI values (computed once)
  const mapped = selected
  const displayName = mapped.name || mapped.userId || '—'
  const accountId = mapped.userId || '—'
  const mt5 = mapped.mt5 || '—'
  const country = mapped.country || '—'
  const totalDeposits = fmtEuro(mapped.totalDeposits)
  const withdrawals = fmtEuro(mapped.withdrawals)
  const netDeposits = fmtEuro(mapped.netDeposits)
  const volume = mapped.volume || '—'
  const plRaw = mapped.pl || ''
  const pl = plRaw ? String(plRaw) : '—'
  const affiliateId = mapped.affiliateId || ''
  const affiliateLabel = paymentsLoaded ? (affiliateName || '—') : 'Loading affiliate…'
  const commissions = mapped.affiliateCommissions || mapped.commissions || ''
  const priority = computePriority(mapped.raw)
  const suggested = suggestedReply(mapped, affiliateName)

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
  const regCandidates = ['regdate', 'registrationdate', 'registered', 'externaldate', 'registration']
  const firstDepositCandidates = ['firstdeposit', 'first_deposit', 'firstdepositdate', 'firstdeposit_at', 'firstdepositdate']
  const ftdCandidates = ['ftd', 'firsttrade', 'first_trade', 'firsttradedate', 'first_trade_date']
  const qftdCandidates = ['qualificationdate', 'qualification_date', 'qualifydate', 'qftd']
  const withdrawalDateCandidates = ['firstwithdrawal', 'first_withdrawal', 'withdrawaldate', 'firstwithdrawaldate']

  const raw = mapped.raw || {}

  const regAt = mapped.regDate || pickRawField(raw, regCandidates) || mapped.registrationdate || null
  // First deposit: the report often contains only an amount (not a date).
  // Extract amount separately and look for a dedicated date field if present.
  const firstDepositAmountCandidates = ['firstdeposit', 'first_deposit', 'firstDeposit', 'firstDepositAmount', 'first_deposit_amount']
  const firstDepositAmountRaw = mapped.firstDeposit || pickRawField(raw, firstDepositAmountCandidates) || mapped.firstdeposit || null
  const firstDepositAt = pickRawField(raw, ['firstdepositdate', 'first_deposit_date', 'firstDepositDate']) || mapped.firstDepositDate || null
  const ftdAt = mapped.ftd || pickRawField(raw, ftdCandidates) || null
  const qftdAt = mapped.qualificationDate || pickRawField(raw, qftdCandidates) || null
  const firstWithdrawalAt = pickRawField(raw, withdrawalDateCandidates) || null

  const regAtFmt = fmtDate(regAt)
  const firstDepositAtFmt = fmtDate(firstDepositAt)
  const ftdAtFmt = fmtDate(ftdAt)
  const qftdAtFmt = fmtDate(qftdAt)
  const firstWithdrawalAtFmt = fmtDate(firstWithdrawalAt)

  const regDateObj = parseDate(regAt)
  const firstDepositDateObj = parseDate(firstDepositAt)
  const ftdDateObj = parseDate(ftdAt)
  const qftdDateObj = parseDate(qftdAt)
  const firstWithdrawalDateObj = parseDate(firstWithdrawalAt)

  const depositsCountVal = mapped.depositCount != null ? (Number(mapped.depositCount) || 0) : null
  // withdrawals count may be in raw fields; try common keys
  const withdrawalCountCandidates = ['withdrawalcount', 'withdrawalscount', 'withdrawal_count', 'withdrawals_count']
  const withdrawalsCountVal = mapped.withdrawalsCount != null ? (Number(mapped.withdrawalsCount) || 0) : (Number(pickRawField(mapped.raw || {}, withdrawalCountCandidates)) || null)
  const avgDeposit = (depositsCountVal && depositsCountVal > 0 && mapped.totalDeposits != null) ? fmtEuro(Number(mapped.totalDeposits) / depositsCountVal) : null
  const avgWithdrawal = (withdrawalsCountVal && withdrawalsCountVal > 0 && mapped.withdrawals != null) ? fmtEuro(Number(mapped.withdrawals) / withdrawalsCountVal) : null
  const netCashFlow = mapped.netDeposits != null ? fmtEuro(mapped.netDeposits) : null
  const tradingDaysVal = mapped.tradingDays != null ? (Number(mapped.tradingDays) || 0) : null

  // ROI: P/L divided by total deposits (percentage)
  const totalDepositsNum = Number(String((mapped.totalDeposits || '').toString().replace(/[^0-9.-]+/g, '')) || 0)
  const plNum = Number(String((mapped.pl || '').toString().replace(/[^0-9.-]+/g, '')) || 0)
  const roiVal = totalDepositsNum ? `${((plNum / totalDepositsNum) * 100).toFixed(2)}%` : null

  // Commissions breakdown: sum of affiliate + sub-affiliate + revshare + other
  function parseNumberField(v) {
    if (v == null || v === '') return 0
    const s = String(v)
    const n = Number(s.replace(/[^0-9.-]+/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const affiliateComm = parseNumberField(mapped.affiliateCommissions || mapped.affiliateCommission || mapped.affiliate_commissions || mapped['Affiliate Commissions'] || mapped['Affiliate Commission'])
  const subAffiliateComm = parseNumberField(mapped.subAffiliateCommissions || mapped.sub_affiliate_commissions || mapped.subAffiliateCommission || mapped['Sub Affiliate Commissions'] || mapped['Sub Affiliate Commission'])
  const revshareComm = parseNumberField(mapped.revshareCommission || mapped.revshare_commission || mapped.revshare || mapped['Revshare Commission'])
  const cpaComm = parseNumberField(mapped.cpaCommission || mapped.cpa_commission || mapped['CPA Commission'] || mapped.CPA || mapped.cpa || 0)
  const cplComm = parseNumberField(mapped.cplCommission || mapped.cpl_commission || mapped['CPL Commission'] || mapped.CPL || mapped.cpl || 0)
  const otherComm = parseNumberField(mapped.otherCommissions || mapped.other_commissions || mapped.otherCommission || mapped['Other Commissions'])

  // Heuristic: if there is no explicit CPA field but Affiliate value exists,
  // treat Affiliate as CPA (many reports use the Affiliate field to carry CPA).
  const hasExplicitCpa = Boolean(pickRawField(raw, ['CPA Commission', 'CPA', 'cpaCommission', 'cpa_commission']) || mapped.cpaCommission || mapped.cpa_commission || mapped.CPA || mapped.cpa)
  let affiliateEffective = affiliateComm
  let cpaEffective = cpaComm
  if (!hasExplicitCpa && affiliateComm > 0 && cpaComm === 0) {
    // move affiliate amount into CPA
    cpaEffective = cpaComm + affiliateComm
    affiliateEffective = 0
  }

  // If the report already provides a total 'Commissions' field, prefer it as the authoritative total
  const totalCommField = parseNumberField(mapped.commissions || mapped.Commissions || mapped['Commissions'] || pickRawField(raw, ['Commissions', 'commissions']))
  const commissionsTotalNum = totalCommField > 0 ? totalCommField : (affiliateEffective + subAffiliateComm + revshareComm + cpaEffective + cplComm + otherComm)
  const commissionsTotal = fmtEuro ? fmtEuro(commissionsTotalNum) : String(commissionsTotalNum)

  // First deposit amount formatted
  const firstDepositAmountNum = parseNumberField(firstDepositAmountRaw)
  const firstDepositAmount = firstDepositAmountNum ? (fmtEuro ? fmtEuro(firstDepositAmountNum) : String(firstDepositAmountNum)) : (firstDepositAmountRaw ? String(firstDepositAmountRaw) : null)

  // Reusable metric card style to keep sizing consistent
  const metricCardStyle = { padding: 10, minHeight: 68, display: 'flex', flexDirection: 'column', justifyContent: 'center' }

  // Trade activities
  const volumeVal = mapped.volume != null ? mapped.volume : (mapped.Volume || mapped.VOLUME || null)
  const lotsVal = mapped.lots != null ? mapped.lots : (mapped.LOTS || mapped.Lot || null)
  const spreadVal = mapped.spread != null ? mapped.spread : (mapped.Spread || null)

  // Behaviour & risk rules
  const rules = useMemo(() => {
    const out = []
    const dNum = Number(String((mapped.totalDeposits || '').toString().replace(/[^0-9.-]+/g, '')) || 0)
    const wNum = Number(String((mapped.withdrawals || '').toString().replace(/[^0-9.-]+/g, '')) || 0)
    const vNum = Number(String((mapped.volume || '').toString().replace(/[^0-9.-]+/g, '')) || 0)
    const plNum = Number(String((mapped.pl || '').toString().replace(/[^0-9.-]+/g, '')) || 0)

    if (dNum > 0 && wNum > 0) out.push('Withdrawals detected after deposit')
    if (dNum > 0 && vNum === 0) out.push('Deposit with no trading activity')
    if (vNum > 0 && Math.abs(plNum) < Math.max(1, vNum * 0.02)) out.push('High volume with low/neutral P/L')
    if (plNum < 0 && Math.abs(plNum) > Math.max(1, vNum * 0.05)) out.push('Negative P/L relative to volume')
    if (affiliateId) out.push('Affiliate-driven account')
    return out
  }, [mapped, affiliateId])

  // Support Decision Engine
  const supportDecision = useMemo(() => {
    return buildSupportDecision({
      ...mapped,
      paymentsLoaded,
      mediaLoaded
    })
  }, [mapped, paymentsLoaded, mediaLoaded])

  // Action panel state
  const [replyText, setReplyText] = useState(supportDecision?.replyTemplate || suggested)

  // Update reply text when support decision changes
  React.useEffect(() => {
    if (supportDecision?.replyTemplate) {
      setReplyText(supportDecision.replyTemplate)
    }
  }, [supportDecision?.replyTemplate])

  function handleCopy() { copyToClipboard(replyText) }
  function handleEscalate(kind) {
    if (!confirm(`Escalate ${accountId} to ${kind}?`)) return
    console.log('escalate', { userId: accountId, kind, selected: mapped })
  }

  return (
    <div className="w-full px-6 2xl:px-10">
      {/* Top per-user timeline removed: keep the compact horizontal timeline below */}
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={onBack}>← Back to results</button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{displayName}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="badge priority" style={{ fontWeight: 800 }}>{priority || 'Medium'}</div>
        </div>
      </div>

      {/* Dashboard layout: left identity card, center content, right Support Decision Engine */}
      <div className="support-detail-grid" style={{ display: 'grid', gridTemplateColumns: '[left] 360px [center] minmax(0, 1fr) [right] 480px', gap: 48, alignItems: 'start', width: '100%' }}>
        <aside className="identity-card card min-w-0" style={{ padding: '12px 12px', textAlign: 'left', alignSelf: 'stretch', position: 'sticky', top: 12, borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16 }}>{(displayName||'?').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{displayName}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{country} · {mt5}</div>
              <div style={{ marginTop: 8 }} className="badge status">{mapped.status || 'Status'}</div>
            </div>
          </div>
            <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Account</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>{accountId}</div>
            <div style={{ height: 12 }} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: 12, paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Affiliate</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>
                {affiliateId 
                  ? (String(affiliateId).replace(/\D+/g, '') === '2287' 
                      ? `${affiliateId} — Default affiliate (No affiliate)` 
                      : `${affiliateId} — ${affiliateName || 'Unknown'}`)
                  : 'No affiliate'}
              </div>
            </div>

            {/* Commissions detail inserted into left sidebar */}
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Commissions</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>{commissionsTotal}</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><div>Revshare</div><div>{revshareComm ? (fmtEuro ? fmtEuro(revshareComm) : String(revshareComm)) : '—'}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><div>CPA</div><div>{cpaEffective ? (fmtEuro ? fmtEuro(cpaEffective) : String(cpaEffective)) : '—'}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><div>CPL</div><div>{cplComm ? (fmtEuro ? fmtEuro(cplComm) : String(cplComm)) : '—'}</div></div>
                {affiliateEffective ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><div>Affiliate</div><div>{fmtEuro ? fmtEuro(affiliateEffective) : String(affiliateEffective)}</div></div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><div>Sub-affiliate</div><div>{subAffiliateComm ? (fmtEuro ? fmtEuro(subAffiliateComm) : String(subAffiliateComm)) : '—'}</div></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><div>Other</div><div>{otherComm ? (fmtEuro ? fmtEuro(otherComm) : String(otherComm)) : '—'}</div></div>
              </div>
            </div>

            {/* Behaviour & Risk removed as requested */}
          </div>
        </aside>

        <div className="center-col min-w-0 w-full max-w-none">
          <section style={{ marginBottom: 12, padding: '8px 6px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>User Timeline & Status</div>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="timeline" style={{ padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 6px 12px rgba(2,6,23,0.45)' }}>
                  <div className="timeline-item" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${regDateObj ? 'reached milestone-reg' : ''}`} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>Registration</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{regAtFmt ? regAtFmt : <span className="text-muted">Not reached</span>}</div>
                    </div>
                  </div>

                  {regDateObj && (firstDepositAt || qftdDateObj) && <div className="timeline-gap" style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 8 }}>{firstDepositAt ? `+${Math.max(0, Math.round((parseDate(firstDepositAt) - regDateObj) / (1000*60*60*24)))}d` : ''}</div>}

                  <div className="timeline-item" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${parseDate(firstDepositAt) ? 'reached milestone-dep' : ''}`} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>Deposit date</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{firstDepositAtFmt ? firstDepositAtFmt : <span className="text-muted">Not reached</span>}</div>
                    </div>
                  </div>

                  {parseDate(firstDepositAt) && qftdDateObj && <div className="timeline-gap" style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 8 }}>+{Math.max(0, Math.round((qftdDateObj - parseDate(firstDepositAt)) / (1000*60*60*24)))}d</div>}

                  <div className="timeline-item" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${qftdDateObj ? 'reached milestone-qftd' : ''}`} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>Qualification</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{qftdAtFmt ? qftdAtFmt : <span className="text-muted">Not reached</span>}</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right-hand timeline details removed to avoid repeated status/dates — timeline is authoritative */}
            </div>
          </section>

          <section style={{ marginTop: 8, marginBottom: 8 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Financial Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total deposits</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{totalDeposits}</div>
                </div>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Net deposits</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{netDeposits}</div>
                </div>
                
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Net cash flow</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{netCashFlow != null ? netCashFlow : '—'}</div>
                </div>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}># Deposits</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{depositsCountVal != null ? depositsCountVal : '—'}</div>
                </div>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>First deposit</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{firstDepositAmount ? firstDepositAmount : '—'}</div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginTop: 6, marginBottom: 12 }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Trading Performance</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Volume</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{volumeVal != null ? volumeVal : '—'}</div>
                </div>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Lots</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{lotsVal != null ? lotsVal : '—'}</div>
                </div>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Spread</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{spreadVal != null ? spreadVal : '—'}</div>
                </div>
                <div className="card" style={metricCardStyle}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>P/L</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6, color: Number(String((mapped.pl||'').toString().replace(/[^0-9.-]+/g,'')||0)) < 0 ? '#f87171' : '#22c55e' }}>{pl}</div>
                </div>
                <div className="card" style={{ ...metricCardStyle, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>ROI</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{roiVal != null ? roiVal : '—'}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Metrics removed — key metrics moved into Financial Summary to avoid duplication. */}

        </div>{/* end center-col */}

        {/* Support Decision Engine - Right Column */}
        <aside className="decision-engine min-w-0" style={{ alignSelf: 'stretch', position: 'sticky', top: 12 }}>
          <div style={{ padding: 12, background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, boxShadow: '0 6px 12px rgba(2,6,23,0.45)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Support Decision Engine</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Case Type</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6, textTransform: 'capitalize' }}>
                  {supportDecision?.caseType?.replace(/_/g, ' ').toLowerCase() || 'Unknown'}
                </div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Risk Level</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>
                  <span className={`badge ${supportDecision?.riskLevel === 'high' ? 'danger' : supportDecision?.riskLevel === 'medium' ? 'warning' : 'success'}`}>
                    {supportDecision?.riskLevel?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                {supportDecision?.riskExplanation && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Reason:</div>
                    <div style={{ marginBottom: 4 }}>{supportDecision.riskExplanation.reason}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Impact:</div>
                    <div>{supportDecision.riskExplanation.impact}</div>
                  </div>
                )}
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Bonus Eligibility</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>
                  <span className={`badge ${supportDecision?.bonusDecision?.status === 'ELIGIBLE' ? 'success' : supportDecision?.bonusDecision?.status === 'NEEDS_APPROVAL' ? 'warning' : 'danger'}`}>
                    {supportDecision?.bonusDecision?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                  </span>
                </div>
                {supportDecision?.bonusExplanation && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Reason:</div>
                    <div style={{ marginBottom: 4 }}>{supportDecision.bonusExplanation.reason}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Impact:</div>
                    <div>{supportDecision.bonusExplanation.impact}</div>
                  </div>
                )}
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Affiliate Switch Eligibility</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>
                  <span className={`badge ${supportDecision?.affiliateSwitchDecision?.status === 'ELIGIBLE' ? 'success' : supportDecision?.affiliateSwitchDecision?.status === 'NOT_ELIGIBLE' ? 'danger' : 'warning'}`}>
                    {supportDecision?.affiliateSwitchDecision?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                  </span>
                </div>
                {supportDecision?.affiliateSwitchExplanation && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Reason:</div>
                    <div style={{ marginBottom: 4 }}>{supportDecision.affiliateSwitchExplanation.reason}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Impact:</div>
                    <div>{supportDecision.affiliateSwitchExplanation.impact}</div>
                  </div>
                )}
              </div>
            </div>

            {supportDecision?.blockingConditions?.length > 0 && (
              <div style={{ marginBottom: 12, padding: 8, background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706', marginBottom: 4 }}>Blocking condition</div>
                <div style={{ fontSize: 12, color: '#92400e' }}>
                  {supportDecision.blockingConditions.join(', ')}
                </div>
              </div>
            )}

            {supportDecision?.flags?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Flags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {supportDecision.flags.map((flag, idx) => (
                    <span key={idx} className="badge info">{flag}</span>
                  ))}
                </div>
              </div>
            )}

            {supportDecision?.explanations?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Analysis</div>
                <ul style={{ fontSize: 13, color: 'var(--text)', paddingLeft: 20 }}>
                  {supportDecision.explanations.map((exp, idx) => (
                    <li key={idx}>{exp}</li>
                  ))}
                </ul>
              </div>
            )}

            {supportDecision?.suggestedActions?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Suggested Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {supportDecision.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      className={`btn ${action.includes('Escalate') ? 'btn-warning' : 'btn-secondary'}`}
                      style={{ fontSize: 12, padding: '6px 12px' }}
                      onClick={() => {
                        if (action.includes('Escalate')) {
                          handleEscalate(action.replace('Escalate to ', '').toLowerCase())
                        } else if (action === 'Copy reply') {
                          handleCopy()
                        }
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Suggested Reply</div>
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
                  resize: 'vertical'
                }}
                placeholder="Support reply template..."
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleCopy} style={{ fontSize: 12 }}>
                  Copy to Clipboard
                </button>
                {supportDecision?.bonusDecision?.reason && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>
                    {supportDecision.bonusDecision.reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

      </div>{/* end support-detail-grid */}

      {/* Behaviour & Risk and Affiliate Impact removed (moved/aggregated into identity card). */}
    </div>
  )
}
