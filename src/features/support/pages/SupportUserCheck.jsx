import React, { useEffect, useState } from 'react';
import { loadCsvRows, searchUsers, loadMediaReport, loadPaymentsReport } from '../services/supportUserCheckService';

export default function SupportUserCheck() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Warm up external CSV sources (non-blocking)
    loadMediaReport().catch(() => {});
    loadPaymentsReport().catch(() => {});
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Support • User Check</h2>
      <p style={{ color: 'var(--muted)' }}>Compact placeholder UI — original page is being restored.</p>
      <div style={{ marginTop: 12 }}>
        <input
          placeholder="Search user by name, id or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px 12px', width: 360 }}
          autoFocus
        />
        <button style={{ marginLeft: 8 }} onClick={() => alert('Search not implemented in placeholder')}>Search</button>
      </div>
      {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
      {error && <div style={{ marginTop: 12, color: '#dc2626' }}>{error}</div>}
    </div>
  );
}
