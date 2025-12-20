import React, { useEffect, useState } from 'react';
import {
  loadCsvRows,
  searchUsers,
  computePriority,
  logAudit,
  getAuditLog
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

export default function SupportUserCheck() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [env] = useState('PROD');

  useEffect(() => {
    loadCsvRows().catch(e => setError(e.message));
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
  };

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
      {selected && (
        <div className="user-decision-card">
          <div className="card-columns">
            <div className="card">
              <h2>Identity & Status</h2>
              <div><b>Name:</b> {getMapped(selected).name}</div>
              <div><b>User ID:</b> {getMapped(selected).userId}</div>
              <div><b>MT5 Account:</b> {getMapped(selected).mt5}</div>
              <div><b>Country:</b> {getMapped(selected).country}</div>
              <div><b>Registration Date:</b> {getMapped(selected).regDate}</div>
              <div><b>Status:</b> <span className={`badge status ${getMapped(selected).status?.toLowerCase()}`}>{getMapped(selected).status}</span></div>
              <div><b>Risk:</b> <span className={`badge risk ${getRiskLevel(getMapped(selected)).toLowerCase()}`}>{getRiskLevel(getMapped(selected))}</span></div>
              <div><b>Priority:</b> <span className="badge priority">{getPriority(getMapped(selected))}</span></div>
              <div><b>Churn Risk:</b> <span className="badge churn">{getChurnRisk(getMapped(selected))}</span></div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(getMapped(selected).userId)}>Copy IDs</button>
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(getMapped(selected), null, 2))}>Copy user summary</button>
              </div>
            </div>
            <div className="card">
              <h2>Financial Snapshot</h2>
              <div><b>First Deposit:</b> {getMapped(selected).firstDeposit || 'Not available (CSV source)'}</div>
              <div><b>First Deposit Date:</b> {getMapped(selected).firstDepositDate || 'Not available (CSV source)'}</div>
              <div><b>Deposit Count:</b> {getMapped(selected).depositCount || 'Not available (CSV source)'}</div>
              <div><b>Total Deposits:</b> {getMapped(selected).totalDeposits || 'Not available (CSV source)'}</div>
              <div><b>Net Deposits:</b> {getMapped(selected).netDeposits || 'Not available (CSV source)'}</div>
              <div><b>Withdrawals:</b> {getMapped(selected).withdrawals || 'Not available (CSV source)'}</div>
              <div><b>Net PL:</b> {getMapped(selected).netPL || 'Not available (CSV source)'}</div>
            </div>
            <div className="card">
              <h2>Activity Signals</h2>
              <div><b>Volume:</b> {getMapped(selected).volume || 'Not available (CSV source)'}</div>
              <div><b>LOTS:</b> {getMapped(selected).lots || 'Not available (CSV source)'}</div>
              <div><b>ROI:</b> {getMapped(selected).roi || 'Not available (CSV source)'}</div>
              <div><b>Last Activity Date:</b> {getMapped(selected).lastActivity || 'Not available (CSV source)'}</div>
            </div>
            <div className="card">
              <h2>Affiliate / Commercial</h2>
              <div><b>Affiliate ID:</b> {getMapped(selected).affiliateId || 'Not available (CSV source)'}</div>
              <div><b>Affiliate Commissions:</b> {getMapped(selected).affiliateCommissions || 'Not available (CSV source)'}</div>
              <div><b>Commission Model:</b> {getCommissionModel(getMapped(selected))}</div>
              <div><b>Affiliate-driven:</b> {getMapped(selected).affiliateId ? 'Yes' : 'No'}</div>
            </div>
            <div className="card">
              <h2>Risk & Flags</h2>
              <div><b>Fraud/Chargeback:</b> {getMapped(selected).fraud || 'None'}</div>
              <div><b>Action:</b> {getMapped(selected).action || 'None'}</div>
            </div>
          </div>
          <div className="card support-insight">
            <h2>Support Insight</h2>
            <textarea value={getSupportInsight(getMapped(selected))} readOnly rows={6} style={{ width: '100%' }} />
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigator.clipboard.writeText(getSupportInsight(getMapped(selected)))}>Copy recommended response</button>
            </div>
          </div>
          <div className="card next-actions">
            <h2>Next Actions (Read-only Escalation)</h2>
            <button onClick={() => alert('Escalate to Ops\n' + getMapped(selected).userId)}>Escalate to Ops</button>
            <button onClick={() => alert('Escalate to Tech\n' + getMapped(selected).userId)}>Escalate to Tech</button>
            <button onClick={() => alert('Escalate to Compliance\n' + getMapped(selected).userId)}>Escalate to Compliance</button>
          </div>
        </div>
      )}
    </div>
  );
}
