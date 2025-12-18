import React, { useMemo, useState } from 'react'
import { getAllEvents, getUserStats, getSectionStats, getOnlineUsers } from '../services/trackingService'
import { sections } from '../pages/orgChartData'

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function getManagementUsers() {
  const management = sections.find((s) => s.id === 'management-team')
  return (management?.roles || [])
    .filter((r) => r.email && r.email !== '—')
    .map((r) => ({ name: r.name, email: r.email, role: r.title || r.department || '' }))
}

const sectionLabels = {
  overview: 'Overview',
  'executive-summary': 'Executive Summary',
  'affiliate-analysis': 'Affiliate Analysis',
  'marketing-expenses': 'Marketing Expenses',
  cohort: 'Cohort',
  'org-chart': 'Org Chart',
  summary: 'Summary Report',
  'admin-panel': 'Admin Panel',
}

export default function AdminPanel() {
  const events = useMemo(() => getAllEvents(), [])
  const userStats = useMemo(() => getUserStats(), [])
  const sectionStats = useMemo(() => getSectionStats(), [])
  const onlineUsers = useMemo(() => Array.from(getOnlineUsers(events, new Date(), 5)), [events])
  const managementUsers = useMemo(() => getManagementUsers(), [])
  const [showTools, setShowTools] = useState(false)

  const userStatsMap = useMemo(() => {
    const map = new Map()
    userStats.forEach((u) => map.set((u.email || '').toLowerCase(), u))
    return map
  }, [userStats])

  const onlineSet = useMemo(() => new Set(onlineUsers.map((u) => (u.email || '').toLowerCase())), [onlineUsers])

  const tools = [
    { name: 'Creolabs / Qlik', href: 'https://login.qlik.com/login?state=hKFo2SBsNGtYOEs4eXM0MTQyal9qZlZZd2JxVUxGRTNvOFk4eKFupWxvZ2luo3RpZNkgSTRORnUzNW5iSl9YR2NXVTZmQ0pKV1VkeVVJeXZFMDSjY2lk2SBQRjVZa0Nhem9qUGQ2OGhHVGhXVHhMNk4wcWw3RUVKYQ&client=PF5YkCazojPd68hGThWTxL6N0ql7EEJa&protocol=oauth2&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fqlk6ufzb2vk9dn9.uk.qlikcloud.com%2Flogin%2Fcallback&nonce=cMBZFdQmCwCyxd61Cz3Ios9DY-kDPwRIHfL0PgmmhYU&code_challenge=hHRAyjfogYyP8cEyDbZGNxEG8OiGaRulBWTmBBqH-G0&code_challenge_method=S256' },
    { name: 'CELLXPERT', href: 'https://partner.trackingaffiliates.com/v2/adminv2/#!/app/pending-affiliates/' },
    { name: 'SKALE', href: 'https://bul934907.skalecrm.com/index.php' },
    { name: 'BullwavesPrime Prop Admin', href: 'https://bwpadmin.bullwaves.com/login' },
  ]

  const openTool = (href) => {
    if (!href) return
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="grid-global"
      style={{
        marginTop: 12,
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <div className="stack" style={{ gap: 12 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Tools</h2>
            <button className="btn secondary" style={{ padding: '6px 10px' }} onClick={() => setShowTools((v) => !v)}>
              {showTools ? 'Hide' : 'Show'}
            </button>
          </div>
          {showTools && (
            <div className="stack" style={{ marginTop: 12 }}>
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  className="btn"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => openTool(tool.href)}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Online now (last 5 min)</h2>
          {onlineUsers.length === 0 ? (
            <div className="text-muted">No one online.</div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {onlineUsers.slice(0, 6).map((u) => (
                <div key={u.email} className="list-item" style={{ justifyContent: 'flex-start', gap: 10 }}>
                  <span className="status-dot online" aria-hidden="true" />
                  <div>
                    <div className="user-name">{u.name || u.email}</div>
                    <div className="text-muted small">{u.role || '—'}</div>
                    <div className="text-muted small" title={formatTime(u.lastSeen)}>
                      Last: {u.lastSection ? sectionLabels[u.lastSection] || u.lastSection : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Most visited sections</h2>
          {sectionStats.length === 0 ? (
            <div className="text-muted">No navigation events yet.</div>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              {sectionStats.map((s) => (
                <div key={s.sectionId} className="list-item" style={{ gap: 10, justifyContent: 'space-between' }}>
                  <div className="pill">{sectionLabels[s.sectionId] || s.sectionId}</div>
                  <div className="num">{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Users overview</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Sessions</th>
                  <th>Last seen</th>
                  <th>Last section</th>
                </tr>
              </thead>
              <tbody>
                {managementUsers.map((u) => {
                  const stats = userStatsMap.get((u.email || '').toLowerCase())
                  const isOnline = onlineSet.has((u.email || '').toLowerCase())
                  return (
                    <tr key={u.email} className={isOnline ? 'row-online' : ''}>
                      <td>
                        <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                          {isOnline && <span className="status-dot online" aria-hidden="true" />}
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{stats?.sessionsCount || 0}</td>
                      <td>{formatTime(stats?.lastSeen)}</td>
                      <td>{sectionLabels[stats?.lastSection] || stats?.lastSection || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Recent events</h2>
            <div className="text-muted small">Latest 25</div>
          </div>
          {events.length === 0 ? (
            <div className="text-muted">No events recorded yet.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Section</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .slice()
                    .reverse()
                    .slice(0, 25)
                    .map((ev, idx) => (
                      <tr key={`${ev.timestamp}-${idx}`}>
                        <td>{ev.type}</td>
                        <td>{ev.userName || ev.userEmail}</td>
                        <td>{ev.userRole || '—'}</td>
                        <td>{sectionLabels[ev.section] || ev.section || '—'}</td>
                        <td>{formatTime(ev.timestamp)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
