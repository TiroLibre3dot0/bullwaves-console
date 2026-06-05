import { useEffect, useMemo, useRef, useState } from 'react'

const SKALE_USER_COLUMNS = [
  { key: 'created_time', label: 'Created Time', source: 'GetLeadStatus' },
  { key: 'primary_email', label: 'Primary Email', source: 'derived' },
  { key: 'primary_phone', label: 'Primary Phone', source: 'derived' },
  { key: 'skale_status', label: 'SKALE Status', source: 'meta' },
  { key: 'skale_status_code', label: 'SKALE Status Code', source: 'meta' },
  { key: 'skale_message', label: 'SKALE Message', source: 'meta' },
  { key: 'skale_error', label: 'SKALE Error', source: 'meta' },
  { key: 'skale_error_code', label: 'SKALE Error Code', source: 'meta' },
  { key: 'skale_current_ip', label: 'SKALE Current IP', source: 'meta' },

  { key: 'mt4_account', label: 'MT4 Account', source: 'GetAccountDetails' },
  {
    key: 'original_retention_owner',
    label: 'Original Retention Owner',
    source: 'GetAccountDetails',
  },
  { key: 'accountname', label: 'Account Name', source: 'GetAccountDetails' },
  { key: 'first_name', label: 'First Name', source: 'GetAccountDetails' },
  { key: 'last_name', label: 'Last Name', source: 'GetAccountDetails' },
  { key: 'email', label: 'Email', source: 'GetAccountDetails' },
  { key: 'country', label: 'Country', source: 'GetAccountDetails' },
  { key: 'phone', label: 'Phone', source: 'GetAccountDetails' },
  { key: 'city', label: 'City', source: 'GetAccountDetails' },
  { key: 'state', label: 'State', source: 'GetAccountDetails' },
  { key: 'zip', label: 'Zip', source: 'GetAccountDetails' },
  { key: 'address', label: 'Address', source: 'GetAccountDetails' },
  { key: 'crm_account_id', label: 'CRM Account ID', source: 'GetAccountDetails' },
  { key: 'ip', label: 'IP', source: 'GetAccountDetails' },
  { key: 'lead_id', label: 'Lead ID', source: 'GetAccountDetails' },
  { key: 'external_lead_id', label: 'External Lead ID', source: 'GetAccountDetails' },
  { key: 'registration_country', label: 'Registration Country', source: 'GetAccountDetails' },
  { key: 'crm_tp_account_id', label: 'CRM TP Account ID', source: 'GetAccountDetails' },
  { key: 'date_of_birth', label: 'Date Of Birth', source: 'GetAccountDetails' },
  { key: 'ftd_date', label: 'FTD Date', source: 'GetAccountDetails' },
  { key: 'id_type', label: 'ID Type', source: 'GetAccountDetails' },
  { key: 'national_number', label: 'National Number', source: 'GetAccountDetails' },
  { key: 'currency', label: 'Currency', source: 'GetAccountDetails' },
  { key: 'equity', label: 'Equity', source: 'GetAccountDetails' },
  { key: 'last_login', label: 'Last Login', source: 'GetAccountDetails' },
  { key: 'last_modified_date', label: 'Last Modified Date', source: 'GetAccountDetails' },
  { key: 'balance', label: 'Balance', source: 'GetAccountDetails' },
  { key: 'margin_free', label: 'Margin Free', source: 'GetAccountDetails' },

  { key: 'udbe.accountid', label: 'UDBE Account ID', source: 'GetUserDetailsByEmail' },
  { key: 'udbe.crm_account_id', label: 'UDBE CRM Account ID', source: 'GetUserDetailsByEmail' },
  { key: 'udbe.accountname', label: 'UDBE Account Name', source: 'GetUserDetailsByEmail' },
  { key: 'udbe.email1', label: 'UDBE Email', source: 'GetUserDetailsByEmail' },
  {
    key: 'udbe.verification_status',
    label: 'Verification Status',
    source: 'GetUserDetailsByEmail',
  },
  { key: 'udbe.provider_name', label: 'Verification Provider', source: 'GetUserDetailsByEmail' },
  {
    key: 'udbe.additional_information',
    label: 'Additional Information',
    source: 'GetUserDetailsByEmail',
  },
  { key: 'udbe.phone', label: 'UDBE Phone', source: 'GetUserDetailsByEmail' },
  { key: 'udbe.affiliate_id', label: 'Affiliate ID', source: 'GetUserDetailsByEmail' },

  { key: 'udbe.crm_entity.crmid', label: 'CRM Entity ID', source: 'GetUserDetailsByEmail' },
  {
    key: 'udbe.crm_entity.createdtime',
    label: 'CRM Entity Created Time',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.crm_entity.modifiedtime',
    label: 'CRM Entity Modified Time',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.crm_entity.smownerid',
    label: 'CRM Entity Owner ID',
    source: 'GetUserDetailsByEmail',
  },
  { key: 'udbe.crm_entity.user.id', label: 'CRM Owner User ID', source: 'GetUserDetailsByEmail' },
  {
    key: 'udbe.crm_entity.user.user_name',
    label: 'CRM Owner Username',
    source: 'GetUserDetailsByEmail',
  },

  {
    key: 'udbe.account_bill_ads_general.accountaddressid',
    label: 'Bill Address ID',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_city',
    label: 'Bill City',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_code',
    label: 'Bill Code',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_country',
    label: 'Bill Country',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_state',
    label: 'Bill State',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_street',
    label: 'Bill Street',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_pobox',
    label: 'Bill PO Box',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.account_bill_ads_general.bill_country_code',
    label: 'Bill Country Code',
    source: 'GetUserDetailsByEmail',
  },

  {
    key: 'udbe.tp_accounts_general_info[0].tradingplatformaccountsid',
    label: 'TP General Account SID',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].account_name',
    label: 'TP General Account Name',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].acc',
    label: 'TP General ACC',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].account_type',
    label: 'TP General Account Type',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].currency',
    label: 'TP General Currency',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].platformname',
    label: 'TP General Platform',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].mt4_group',
    label: 'TP General MT4 Group',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].tp_accountstatus',
    label: 'TP General Account Status',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_general_info[0].provides_balance_history',
    label: 'TP General Provides Balance History',
    source: 'GetUserDetailsByEmail',
  },

  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].tradingplatformaccountsid',
    label: 'TP Snapshot Account SID',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].account_name',
    label: 'TP Snapshot Account Name',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].platformname',
    label: 'TP Snapshot Platform',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].acc',
    label: 'TP Snapshot ACC',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].account_type',
    label: 'TP Snapshot Account Type',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].leverage',
    label: 'TP Snapshot Leverage',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].balance',
    label: 'TP Snapshot Balance',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].credit',
    label: 'TP Snapshot Credit',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].equity',
    label: 'TP Snapshot Equity',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].margin',
    label: 'TP Snapshot Margin',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].margin_free',
    label: 'TP Snapshot Margin Free',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].margin_level',
    label: 'TP Snapshot Margin Level',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].closed_pnl',
    label: 'TP Snapshot Closed PnL',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].open_pnl',
    label: 'TP Snapshot Open PnL',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].account_type_requested',
    label: 'TP Snapshot Requested Account Type',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].provides_balance_history',
    label: 'TP Snapshot Provides Balance History',
    source: 'GetUserDetailsByEmail',
  },
  {
    key: 'udbe.tp_accounts_last_snapshot_info[0].tp_account_scf.tradingplatformaccountsid',
    label: 'TP Snapshot SCF Account SID',
    source: 'GetUserDetailsByEmail',
  },
]

function toPathSegments(path) {
  return String(path || '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
}

function readPath(obj, path) {
  const segs = toPathSegments(path)
  let cursor = obj
  for (const seg of segs) {
    if (cursor == null) return undefined
    cursor = cursor[seg]
  }
  return cursor
}

function formatValue(value) {
  if (value == null) return '--'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  const text = String(value).trim()
  return text || '--'
}

function resolveColumnValue(row, key) {
  const accountPayload = row?.accountDetails || null
  const accountObject = accountPayload?.object || null
  const leadPayload = row?.leadStatus || null
  const leadObject = leadPayload?.object || null
  const userPayload = row?.userDetails || null
  const userRoot =
    Array.isArray(userPayload?.data) && userPayload.data.length ? userPayload.data[0] : null

  if (key === 'primary_email') {
    return accountObject?.email || userRoot?.email1 || row?.email || ''
  }
  if (key === 'primary_phone') {
    return accountObject?.phone || userRoot?.phone || ''
  }

  if (key === 'skale_status') {
    return accountPayload?.status || userPayload?.status || leadPayload?.status || row?.error || ''
  }
  if (key === 'skale_status_code') {
    return accountPayload?.status_code || userPayload?.status_code || leadPayload?.status_code || ''
  }
  if (key === 'skale_message') {
    return accountPayload?.message || userPayload?.message || leadPayload?.message || ''
  }
  if (key === 'skale_error') {
    return accountPayload?.error || userPayload?.error || leadPayload?.error || row?.error || ''
  }
  if (key === 'skale_error_code') {
    return accountPayload?.code || userPayload?.code || leadPayload?.code || ''
  }
  if (key === 'skale_current_ip') {
    return accountPayload?.current_ip || userPayload?.current_ip || ''
  }

  if (key.startsWith('udbe.')) {
    return readPath(userRoot, key.slice(5))
  }

  return readPath(accountObject, key) ?? readPath(leadObject, key)
}

export default function SkalePage() {
  const [sampleRows, setSampleRows] = useState([])
  const [sampleMeta, setSampleMeta] = useState(null)
  const [dataSource, setDataSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [nowTs, setNowTs] = useState(Date.now())
  const [showReconnected, setShowReconnected] = useState(false)
  const reconnectTimerRef = useRef(null)

  useEffect(() => {
    let ignore = false
    let timer = null

    async function loadSample(showLoading = false) {
      if (showLoading) setLoading(true)
      try {
        const sources = [
          '/api/skale/live',
          '/skale/skale-users-db.json',
          '/skale/skale-users-sample.json',
        ]
        let payload = null
        let sourceUsed = ''
        for (const src of sources) {
          try {
            const resp = await fetch(src, { cache: 'no-store' })
            if (!resp.ok) continue
            const contentType = String(resp.headers.get('content-type') || '').toLowerCase()
            if (!contentType.includes('application/json')) continue
            payload = await resp.json()
            const rows = Array.isArray(payload?.rows) ? payload.rows : []
            if (rows.length === 0) continue
            sourceUsed = src
            break
          } catch {
            continue
          }
        }
        if (!payload) throw new Error('No Skale data file found')
        if (ignore) return
        setSampleRows(Array.isArray(payload?.rows) ? payload.rows : [])
        setSampleMeta(payload || null)
        setDataSource(sourceUsed)
        setLoadError('')
      } catch (err) {
        if (ignore) return
        // Keep previous rows on polling failures to avoid table flicker.
        if (showLoading) {
          setLoadError(err?.message || 'Unable to load sample data')
          setSampleRows([])
          setSampleMeta(null)
          setDataSource('')
        }
      } finally {
        if (!ignore && showLoading) setLoading(false)
      }
    }

    loadSample(true)
    timer = setInterval(() => {
      loadSample(false)
    }, 8000)

    return () => {
      ignore = true
      if (timer) clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const sourceCounts = useMemo(() => {
    return SKALE_USER_COLUMNS.reduce((acc, col) => {
      const k = col.source
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
  }, [])

  const lastSyncText = useMemo(() => {
    const raw = sampleMeta?.generatedAt
    if (!raw) return 'n/a'
    const dt = new Date(raw)
    if (Number.isNaN(dt.getTime())) return raw
    return dt.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }, [sampleMeta?.generatedAt])

  const sortedRows = useMemo(() => {
    const parseTs = (value) => {
      const text = String(value || '').trim()
      if (!text) return 0
      const normalized = text.includes('T') ? text : text.replace(' ', 'T')
      const withZone = /Z$|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}Z`
      const ms = Date.parse(withZone)
      return Number.isFinite(ms) ? ms : 0
    }

    const rowTs = (row) => {
      const leadObj = row?.leadStatus?.object || null
      return parseTs(leadObj?.created_time) || parseTs(row?.fetchedAt)
    }

    return [...sampleRows].sort((a, b) => rowTs(b) - rowTs(a))
  }, [sampleRows])

  const orderedColumns = useMemo(() => {
    const pinned = [
      'created_time',
      'accountname',
      'primary_email',
      'primary_phone',
      'udbe.affiliate_id',
    ]
    const byKey = new Map(SKALE_USER_COLUMNS.map((col) => [col.key, col]))
    const counts = new Map(SKALE_USER_COLUMNS.map((col) => [col.key, 0]))

    for (const row of sortedRows) {
      for (const col of SKALE_USER_COLUMNS) {
        const value = resolveColumnValue(row, col.key)
        if (String(value ?? '').trim() !== '') {
          counts.set(col.key, (counts.get(col.key) || 0) + 1)
        }
      }
    }

    const head = pinned.map((k) => byKey.get(k)).filter(Boolean)
    const tail = SKALE_USER_COLUMNS.filter((col) => !pinned.includes(col.key)).sort((a, b) => {
      const diff = (counts.get(b.key) || 0) - (counts.get(a.key) || 0)
      if (diff !== 0) return diff
      return a.label.localeCompare(b.label)
    })

    return [...head, ...tail]
  }, [sortedRows])

  const runtimeInfo = sampleMeta?.runtime || null
  const phaseLabel = String(runtimeInfo?.phase || 'idle').toUpperCase()
  const phaseProgress = runtimeInfo?.total
    ? `${runtimeInfo?.current || 0}/${runtimeInfo.total}`
    : '--'
  const phaseRunning = Boolean(runtimeInfo?.isRunning)
  const runtimeCurrent = Number(runtimeInfo?.current || 0)
  const runtimeTotal = Number(runtimeInfo?.total || 0)
  const runtimePercent =
    runtimeTotal > 0
      ? Math.max(0, Math.min(100, Math.round((runtimeCurrent / runtimeTotal) * 100)))
      : 0
  const runtimeUpdatedAtMs = Date.parse(String(runtimeInfo?.updatedAt || '')) || 0
  const heartbeatSec = runtimeUpdatedAtMs
    ? Math.max(0, Math.floor((nowTs - runtimeUpdatedAtMs) / 1000))
    : null
  const isStaleHeartbeat = phaseRunning && heartbeatSec != null && heartbeatSec > 20
  const serverRatePerMin = Number(runtimeInfo?.metrics?.phaseRatePerMin)
  const processRate =
    Number.isFinite(serverRatePerMin) && serverRatePerMin > 0 ? serverRatePerMin : null
  const etaText = runtimeInfo?.metrics?.etaText || 'n/a'
  const runId = String(runtimeInfo?.runId || '').trim()
  const runIdShort = runId ? runId.slice(0, 14) : 'n/a'
  const spinnerFrames = ['|', '/', '-', '\\']
  const spinner = phaseRunning ? spinnerFrames[Math.floor(nowTs / 150) % spinnerFrames.length] : 'o'

  useEffect(() => {
    if (!runId) return undefined

    const storageKey = 'skale:last-run-id'
    let previousRunId = ''
    try {
      previousRunId = String(window.localStorage.getItem(storageKey) || '')
      window.localStorage.setItem(storageKey, runId)
    } catch {
      previousRunId = ''
    }

    const isReconnect = phaseRunning && previousRunId === runId
    if (!isReconnect) {
      setShowReconnected(false)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      return undefined
    }

    setShowReconnected(true)
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    reconnectTimerRef.current = setTimeout(() => {
      setShowReconnected(false)
      reconnectTimerRef.current = null
    }, 7000)

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [runId, phaseRunning])

  const rateText = processRate
    ? `${processRate.toFixed(1)} ${phaseLabel === 'ENRICH' ? 'accounts' : 'steps'}/min`
    : 'calculating...'

  const monitorTiles = [
    { label: 'Phase', value: phaseLabel },
    { label: 'Speed', value: rateText },
    { label: 'ETA', value: etaText },
    {
      label: 'Heartbeat',
      value: heartbeatSec == null ? 'n/a' : `${heartbeatSec}s ago`,
      warn: isStaleHeartbeat,
    },
    { label: 'Success', value: String(sampleMeta?.totals?.success ?? 0) },
    {
      label: 'Failed',
      value: String(sampleMeta?.totals?.failed ?? 0),
      warn: Number(sampleMeta?.totals?.failed ?? 0) > 0,
    },
    {
      label: 'Skipped',
      value: String(sampleMeta?.totals?.skippedIncomplete ?? 0),
      warn: Number(sampleMeta?.totals?.skippedIncomplete ?? 0) > 0,
    },
    { label: 'Rows Loaded', value: String(sortedRows.length) },
  ]

  const tileAccents = {
    Phase: ['#0ea5e9', '#22d3ee'],
    Speed: ['#22c55e', '#14b8a6'],
    ETA: ['#6366f1', '#06b6d4'],
    Heartbeat: ['#f59e0b', '#f97316'],
    Success: ['#16a34a', '#10b981'],
    Failed: ['#ef4444', '#f97316'],
    Skipped: ['#f59e0b', '#eab308'],
    'Rows Loaded': ['#3b82f6', '#06b6d4'],
  }

  const tileStyleFor = (tile, idx) => {
    const [c1, c2] = tileAccents[tile.label] || ['#64748b', '#94a3b8']
    const active = phaseRunning || tile.label === 'Rows Loaded'
    const wave = Math.sin(nowTs / 360 + idx)
    const lift = active ? Math.max(0, wave) * 1.5 : 0
    const glow = active ? 0.18 + Math.max(0, wave) * 0.08 : 0.1

    return {
      display: 'grid',
      gap: 4,
      padding: '10px 12px',
      borderRadius: 10,
      background: `linear-gradient(155deg, rgba(15,23,42,0.9), rgba(15,23,42,0.72) 68%, ${c1}2B)`,
      backgroundSize: '220% 220%',
      backgroundPosition: `${50 + Math.sin(nowTs / 700 + idx) * 8}% 50%`,
      border: `1px solid ${tile.warn ? '#f59e0b80' : `${c1}6B`}`,
      boxShadow: tile.warn
        ? '0 0 0 1px rgba(245,158,11,0.2), 0 10px 20px rgba(245,158,11,0.16)'
        : `0 ${6 + lift}px ${14 + lift * 2}px rgba(2,6,23,0.34), 0 0 0 1px rgba(255,255,255,${glow}) inset`,
      transform: `translateY(${-lift}px)`,
      transition: 'transform 220ms ease, box-shadow 260ms ease, border-color 220ms ease',
      borderLeft: `3px solid ${tile.warn ? '#f59e0b' : c1}`,
      position: 'relative',
      overflow: 'hidden',
      willChange: 'transform, box-shadow, background-position',
    }
  }

  const statusTone = isStaleHeartbeat ? '#f59e0b' : phaseRunning ? '#22c55e' : '#64748b'
  const progressTrackBg = 'rgba(30,41,59,0.35)'
  const progressBarBg = isStaleHeartbeat
    ? 'linear-gradient(90deg, rgba(245,158,11,0.9), rgba(251,191,36,0.9))'
    : 'linear-gradient(90deg, rgba(14,165,233,0.92), rgba(34,197,94,0.92))'

  return (
    <section className="page-shell" style={{ display: 'grid', gap: 14 }}>
      <style>{`
        @keyframes skale-progress-glow {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.12); }
          100% { filter: brightness(1); }
        }

        @keyframes skale-tile-in {
          0% { opacity: 0; transform: translateY(8px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes skale-tile-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        @keyframes skale-dot-pulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.42); }
          70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className="page-title">Skale</h1>
          <p className="page-subtitle">First user table scaffold for local Skale DB ingestion.</p>
          {showReconnected ? (
            <div
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 10px',
                borderRadius: 999,
                border: '1px solid rgba(34,197,94,0.45)',
                background: 'rgba(34,197,94,0.16)',
                color: '#bbf7d0',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.01em',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              Reconnected to active run
            </div>
          ) : null}
        </div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: `1px solid ${statusTone}55`,
            background: 'linear-gradient(140deg, rgba(15,23,42,0.55), rgba(30,41,59,0.45))',
            boxShadow: `0 8px 20px ${statusTone}22`,
            minWidth: 250,
            textAlign: 'right',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            Last sync
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>{lastSyncText}</div>
          <div
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              color: '#e2e8f0',
              background: phaseRunning ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)',
              border: phaseRunning
                ? '1px solid rgba(34,197,94,0.45)'
                : '1px solid rgba(100,116,139,0.35)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: phaseRunning ? '#22c55e' : '#64748b',
                boxShadow: phaseRunning ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none',
                animation: phaseRunning ? 'skale-dot-pulse 1.8s ease-out infinite' : 'none',
              }}
            />
            {spinner} Phase: {phaseLabel} {phaseProgress !== '--' ? `(${phaseProgress})` : ''}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: 700,
              color: isStaleHeartbeat ? '#fbbf24' : '#94a3b8',
            }}
          >
            Heartbeat: {heartbeatSec == null ? 'n/a' : `${heartbeatSec}s fa`}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: 700,
              color: '#7dd3fc',
            }}
          >
            Run: {runIdShort}
          </div>
        </div>
      </header>

      <div
        className="card"
        style={{
          padding: 14,
          display: 'grid',
          gap: 10,
          background:
            'linear-gradient(125deg, rgba(8,47,73,0.38), rgba(30,58,138,0.28) 45%, rgba(6,95,70,0.26))',
          border: '1px solid rgba(56,189,248,0.22)',
          borderRadius: 14,
          boxShadow: '0 16px 32px rgba(15,23,42,0.22)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <strong style={{ letterSpacing: '0.02em', color: '#e2e8f0' }}>
            Columns ready: {orderedColumns.length}
          </strong>
          {Object.entries(sourceCounts).map(([source, count]) => (
            <span
              key={source}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                background: 'rgba(15,23,42,0.35)',
                border: '1px solid rgba(148,163,184,0.3)',
                color: '#cbd5e1',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {source}: {count}
            </span>
          ))}
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(14,165,233,0.22)',
              border: '1px solid rgba(14,165,233,0.45)',
              color: '#e0f2fe',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Rows loaded: {sortedRows.length}
          </span>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(245,158,11,0.22)',
              border: '1px solid rgba(245,158,11,0.45)',
              color: '#fef3c7',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Skipped: {sampleMeta?.totals?.skippedIncomplete ?? 0}
          </span>
        </div>
        <p style={{ margin: 0, opacity: 0.96, color: '#cbd5e1' }}>
          Slow bootstrap from Skale API only. Source: {dataSource || 'n/a'}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            padding: 12,
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(2,6,23,0.26)',
          }}
        >
          {monitorTiles.map((tile, idx) => (
            <div
              key={tile.label}
              style={{
                ...tileStyleFor(tile, idx),
                animation: phaseRunning
                  ? 'skale-tile-in 360ms cubic-bezier(0.2, 0.65, 0.2, 1) both, skale-tile-shimmer 3.4s ease-in-out infinite alternate'
                  : 'skale-tile-in 360ms cubic-bezier(0.2, 0.65, 0.2, 1) both',
                animationDelay: phaseRunning ? `${idx * 45}ms, 0ms` : `${idx * 45}ms`,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#93c5fd',
                  fontWeight: 700,
                }}
              >
                {tile.label}
              </span>
              <span
                style={{
                  fontSize: 20,
                  lineHeight: 1.1,
                  fontWeight: 900,
                  color: tile.warn ? '#fbbf24' : '#f8fafc',
                  textShadow: '0 1px 0 rgba(2,6,23,0.35)',
                }}
              >
                {tile.value}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#e2e8f0',
            }}
          >
            <span>Process progress</span>
            <span>
              {runtimeTotal > 0
                ? `${runtimeCurrent}/${runtimeTotal} (${runtimePercent}%)`
                : phaseRunning
                  ? 'Starting...'
                  : 'Idle'}
            </span>
          </div>
          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: progressTrackBg,
              overflow: 'hidden',
              border: '1px solid rgba(148,163,184,0.25)',
            }}
          >
            <div
              style={{
                width: `${runtimePercent}%`,
                height: '100%',
                background: progressBarBg,
                backgroundSize: '180% 100%',
                transition: 'width 0.35s ease, filter 0.35s ease',
                animation: phaseRunning
                  ? 'skale-progress-glow 1.6s ease-in-out infinite, skale-tile-shimmer 2.8s ease-in-out infinite alternate'
                  : 'none',
              }}
            />
          </div>
        </div>
        {sampleMeta?.generatedAt ? (
          <p style={{ margin: 0, opacity: 0.9, fontSize: 12, color: '#cbd5e1' }}>
            Generated at: {sampleMeta.generatedAt} | Success: {sampleMeta?.totals?.success ?? 0} |
            Partial: {sampleMeta?.totals?.partial ?? 0} | Failed: {sampleMeta?.totals?.failed ?? 0}
          </p>
        ) : null}
      </div>

      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.25)',
        }}
      >
        <div
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: '65vh',
            background: 'linear-gradient(180deg, rgba(248,250,252,0.6), rgba(255,255,255,0.95))',
          }}
        >
          <table
            style={{ width: '100%', minWidth: 2600, borderCollapse: 'separate', borderSpacing: 0 }}
          >
            <thead>
              <tr>
                {orderedColumns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: 12,
                      letterSpacing: '0.02em',
                      background: 'rgba(15,23,42,0.96)',
                      color: '#e2e8f0',
                      borderBottom: '1px solid rgba(148,163,184,0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 2 }}>
                      <span style={{ fontWeight: 800 }}>{col.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>{col.source}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length}
                    style={{ padding: '14px 12px', color: '#334155' }}
                  >
                    Loading Skale sample data...
                  </td>
                </tr>
              ) : null}

              {!loading && loadError ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length}
                    style={{ padding: '14px 12px', color: '#b91c1c' }}
                  >
                    Failed to load data: {loadError}
                  </td>
                </tr>
              ) : null}

              {!loading && !loadError && !sortedRows.length ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length}
                    style={{ padding: '14px 12px', color: '#334155' }}
                  >
                    No rows available in sample yet.
                  </td>
                </tr>
              ) : null}

              {!loading && !loadError
                ? sortedRows.map((row, idx) => (
                    <tr key={`${row?.login || 'unknown'}-${idx}`}>
                      {orderedColumns.map((col) => (
                        <td
                          key={`${col.key}-${idx}`}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid rgba(148,163,184,0.2)',
                            color: '#334155',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                            maxWidth: 260,
                            background:
                              idx % 2 === 0 ? 'rgba(255,255,255,0.78)' : 'rgba(248,250,252,0.92)',
                          }}
                          title={formatValue(resolveColumnValue(row, col.key))}
                        >
                          {formatValue(resolveColumnValue(row, col.key))}
                        </td>
                      ))}
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
