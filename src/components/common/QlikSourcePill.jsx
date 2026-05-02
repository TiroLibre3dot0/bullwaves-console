/**
 * QlikSourcePill – shows "● Live" (green) or "⚠ Local" (amber) based on
 * the data source used by a Qlik-backed section.
 *
 * Props:
 *   source: 'api' | 'local' | null
 */
export default function QlikSourcePill({ source }) {
  if (!source) return null

  const isLive = source === 'api'

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    border: `1px solid ${isLive ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)'}`,
    background: isLive ? 'rgba(52,211,153,0.10)' : 'rgba(251,191,36,0.10)',
    color: isLive ? '#34d399' : '#fbbf24',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  }

  const dotStyle = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: isLive ? '#34d399' : '#fbbf24',
    flexShrink: 0,
  }

  const label = isLive ? 'Live' : 'Local'
  const title = isLive
    ? 'Data source: Qlik API (real-time)'
    : 'Data source: local file (API unavailable)'

  return (
    <span style={style} title={title}>
      <span style={dotStyle} />
      {label}
    </span>
  )
}
