import React, { useEffect, useState } from 'react';
import {
  loadCsvRows,
  searchUsers,
  computePriority,
  logAudit,
  getAuditLog,
  loadMediaReport,
  getAffiliateById
} from '../services/supportUserCheckService';

const FIELD_MAP = {
  name: ['customername', 'fullname', 'name'],
  userId: ['userid', 'clientid', 'user_id'],
  mt5: ['mt5account', 'accountid', 'mt5'],
  status: ['status'],
  country: ['country'],
  regDate: ['registrationdate', 'regdate'],
  firstDeposit: ['firstdeposit'],
  firstDepositDate: ['firstdepositdate'],
  depositCount: ['depositcount'],
  totalDeposits: ['totaldeposits'],
  netDeposits: ['netdeposits'],
  withdrawals: ['withdrawals'],
  netPL: ['netpl'],
  volume: ['volume'],
  lots: ['lots'],
  roi: ['roi'],
  lastActivity: ['externaldate', 'registrationdate'],
  affiliateId: ['affiliateid'],
  affiliateCommissions: ['affiliatecommissions'],
  cpa: ['cpacommission'],
  cpl: ['cplcommission'],
  revshare: ['revsharecommission'],
  fraud: ['fraud/chargeback'],
  action: ['action'],
};

function getField(row, keys) {
  for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k];
  return '';
}

function getMapped(row, map = FIELD_MAP) {
  const out = {};
  for (const key in map) out[key] = getField(row, map[key]);
  return out;
}

function getRiskLevel(mapped) {
  if (mapped.fraud) return 'HIGH';
  if (mapped.action) return 'MEDIUM';
  return 'LOW';
}

function getPriority(mapped) {
  if (Number(mapped.totalDeposits) > 0) return 'HIGH';
  if (Number(mapped.depositCount) >= 3) return 'VIP potential';
  if (mapped.affiliateId) return 'Affiliate user';
  return 'Normal';
}

function getChurnRisk(mapped) {
  if (Number(mapped.depositCount) === 1 && Number(mapped.netPL) < 0) return 'HIGH';
  if (Number(mapped.depositCount) === 0 && mapped.status?.toLowerCase() === 'new') return 'Low engagement';
  return 'Normal';
}

function getCommissionModel(mapped) {
  const models = [];
  if (mapped.cpa && Number(mapped.cpa) > 0) models.push('CPA');
  if (mapped.cpl && Number(mapped.cpl) > 0) models.push('CPL');
  if (mapped.revshare && Number(mapped.revshare) > 0) models.push('Revshare');
  return models.join(', ') || 'None';
}

function getSupportInsight(mapped) {
  const lines = [];
  lines.push(`User status: ${mapped.status || 'Unknown'}.`);
  lines.push(`Priority: ${getPriority(mapped)}.`);
  lines.push(`Risk level: ${getRiskLevel(mapped)}.`);
  lines.push(`Churn risk: ${getChurnRisk(mapped)}.`);
  if (mapped.affiliateId) lines.push('Affiliate-driven user.');
  if (mapped.fraud) lines.push('⚠️ Fraud/chargeback detected.');
  if (mapped.action) lines.push(`Action required: ${mapped.action}`);
  lines.push('Recommended response:');
  return lines.join('\n');
}

function generatePresets(mapped) {
  const presets = []
  const name = mapped.name || 'Customer'
  const priority = getPriority(mapped)
  const churn = getChurnRisk(mapped)
  const affiliate = mapped.affiliateId
  const deposits = Number(mapped.totalDeposits || mapped.firstDeposit || 0)
  const fraud = mapped.fraud
  const action = mapped.action

  if (fraud) {
    presets.push(`Immediate action required: Please escalate ${name} to Compliance — potential fraud/chargeback detected. Reference: ${mapped.userId || 'N/A'}.`)
  }

  if (action) {
    presets.push(`Action required: ${action}. Please follow the documented process and notify the owner. User: ${mapped.userId || 'N/A'}.`)
  }

  if (priority === 'HIGH' || deposits > 0) {
    presets.push(`Hi ${name}, thank you for your deposit. We see activity on your account and we're here to help — please let us know any issue you're facing.`)
  }

  if (affiliate) {
    presets.push(`Hi ${name}, we noted you joined via affiliate ${affiliate}. For commercial questions, we can connect you with their manager.`)
  }

  if (churn === 'HIGH') {
    presets.push(`Hi ${name}, we noticed limited activity and a negative P/L — would you like support to review your trades or offers to re-engage?`)
  }

  // Fallback / friendly
  if (presets.length === 0) {
    presets.push(`Hi ${name}, thanks for contacting support. Please provide more details about your request so we can assist you.`)
  }

  // Return up to 3 concise presets
  return presets.slice(0, 3)
}

export default function SupportUserCheck() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [showFinancial, setShowFinancial] = useState(false);
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [showRisk, setShowRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [env] = useState('PROD');

  useEffect(() => {
    loadCsvRows().catch(e => setError(e.message));
    // load media report in background (fail gracefully)
    loadMediaReport().then(() => setMediaLoaded(true)).catch(() => setMediaLoaded(false))
  }, []);

  const handleSearch = async () => {
    setError('');
    setLoading(true);
    setSelected(null);
    try {
      if (!query || (query.length < 3 && !/^\d+$/.test(query))) {
        setError('Enter at least 3 characters or a numeric ID.');
        setResults([]);
        setLoading(false);
        return;
      }
      const found = await searchUsers(query);
      logAudit('search', { query });
      setResults(found);
      if (found.length === 1) {
        setSelected(found[0]);
        logAudit('select', { userId: found[0].userid });
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setError('');
  };

  const handleSelect = (row) => {
    setSelected(row);
    logAudit('select', { userId: row.userid });
    const mapped = getMapped(row)
    // default collapse/expand rules
    setShowFinancial(false)
    setShowAffiliate(!!mapped.affiliateId)
    setShowRisk(!!(mapped.fraud || mapped.action))
  };

  function getShortSummary(mapped) {
    const full = getSupportInsight(mapped).split('\n')
    return full.slice(0, 3).join(' ')
  }

  function fmtValueLabel(value, labelWhenEmpty = 'Not available') {
    if (value === null || value === undefined || value === '') return labelWhenEmpty
    if (Number(value) === 0) return ''
    return value
  }

  // --- UI ---
  return (
    <div className="support-user-check-page">
      <header style={{ marginBottom: 16 }}>
        <h1>Support • User Check <span className="badge env">{env}</span> <span className="badge role">Read-only</span></h1>
        <div className="subtitle">Search a user and get an instant operational summary.</div>
      </header>
      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name, email, user ID, MT5 account…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={handleSearch} disabled={loading}>
          Search {loading && <span className="spinner" />}
        </button>
        <button className="btn-secondary" onClick={handleClear}>Clear</button>
      </div>
      {error && <div className="error">{error}</div>}
      {!selected && !error && results.length === 0 && <div className="neutral-card">No users found</div>}
      {!selected && results.length > 1 && (
        <div className="results-list">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>User ID</th><th>MT5</th><th>Status</th><th>Reg Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => {
                const mapped = getMapped(row);
                return (
                  <tr key={i} onClick={() => handleSelect(row)} className={selected === row ? 'selected' : ''} style={{ cursor: 'pointer' }}>
                    <td>{mapped.name}</td>
                    <td>{mapped.userId}</td>
                    <td>{mapped.mt5}</td>
                    <td><span className={`badge status ${mapped.status?.toLowerCase()}`}>{mapped.status}</span></td>
                    <td>{mapped.regDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {selected && (() => {
        const mapped = getMapped(selected)
        const affiliateMeta = getAffiliateById(mapped.affiliateId)
        const knownAffiliate = !!(mapped.affiliateId && affiliateMeta)
        const affiliatePresent = !!mapped.affiliateId
        const shortSummary = getShortSummary(mapped)
        const presets = generatePresets(mapped)

        return (
          <div className="user-decision-card decision-first">
            <div className="user-snapshot card">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{mapped.name}</div>
                  <div style={{ color: 'var(--muted)', marginTop: 4 }}>{mapped.userId} · {mapped.country}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge status">{mapped.status || 'Unknown'}</span>
                  <span className="badge priority">{getPriority(mapped)}</span>
                  <span className={`badge risk ${getRiskLevel(mapped).toLowerCase()}`}>{getRiskLevel(mapped)}</span>
                  <span className="badge churn">{getChurnRisk(mapped)}</span>
                </div>
              </div>
              <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }} title="Some data not available from CSV source">Some data not available from CSV source</div>
            </div>

            <div className="divider" />

            <div className="collapsible">
              <div className="section-header" onClick={() => setShowFinancial(s => !s)}>
                <strong>Financial & Activity</strong>
                <span>{showFinancial ? '–' : '+'}</span>
              </div>
              {!showFinancial ? (
                <div className="section-summary">{(mapped.totalDeposits && Number(mapped.totalDeposits) > 0) ? `${mapped.totalDeposits} deposits` : 'No deposits · No activity'}</div>
              ) : (
                <div className="section-body card">
                  <div><b>Deposits:</b> {fmtValueLabel(mapped.totalDeposits, 'No deposits') || 'No deposits'}</div>
                  <div><b>Net PL:</b> {fmtValueLabel(mapped.netPL, '—')}</div>
                  <div><b>Volume:</b> {fmtValueLabel(mapped.volume, '—')}</div>
                  <div><b>ROI:</b> {fmtValueLabel(mapped.roi, '—')}</div>
                  <div><b>Last Activity:</b> {mapped.lastActivity || '—'}</div>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="collapsible">
              <div className="section-header" onClick={() => setShowAffiliate(s => !s)}>
                <strong>Affiliate & Commercial</strong>
                <span>{showAffiliate ? '–' : '+'}</span>
              </div>
              {!showAffiliate ? (
                <div className="section-summary">{affiliatePresent ? `Affiliate ID: ${mapped.affiliateId}` : 'No affiliate'}</div>
              ) : (
                <div className="section-body card">
                  <div><b>Affiliate ID:</b> {mapped.affiliateId || '—'}</div>
                  <div><b>Affiliate Name:</b> {affiliateMeta ? affiliateMeta.name : (affiliatePresent ? 'Affiliate ID present (details not found)' : '—')}</div>
                  <div><b>Commission Model:</b> {getCommissionModel(mapped)}</div>
                  <div><b>Affiliate-driven:</b> {affiliatePresent ? 'Yes' : 'No'}</div>
                  {affiliatePresent && (knownAffiliate ? <span className="badge">Known affiliate</span> : <span className="badge status" style={{ background: '#f59e0b' }}>Affiliate not found in Media Report</span>)}
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="collapsible">
              <div className="section-header" onClick={() => setShowRisk(s => !s)}>
                <strong>Risk & Flags</strong>
                <span>{showRisk ? '–' : '+'}</span>
              </div>
              {!showRisk ? (
                <div className="section-summary">{mapped.fraud || mapped.action ? 'Flags present' : 'No major flags'}</div>
              ) : (
                <div className="section-body card">
                  <div><b>Fraud/Chargeback:</b> {mapped.fraud || 'None'}</div>
                  <div><b>Action:</b> {mapped.action || 'None'}</div>
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="how-to-respond card">
              <h2>How to respond</h2>
              <div style={{ marginBottom: 8, color: 'var(--muted)' }}>{shortSummary}</div>
              <div>
                {presets.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>{p}</div>
                    <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(p)}>Copy</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="next-actions card" style={{ marginTop: 12 }}>
              <button onClick={() => alert('Escalate to Ops\n' + mapped.userId)}>Escalate to Ops</button>
              <button onClick={() => alert('Escalate to Tech\n' + mapped.userId)}>Escalate to Tech</button>
              <button onClick={() => alert('Escalate to Compliance\n' + mapped.userId)}>Escalate to Compliance</button>
            </div>
          </div>
        )
      })()}
    </div>
  );
}
