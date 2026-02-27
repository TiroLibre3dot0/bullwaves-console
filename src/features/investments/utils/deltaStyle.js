// Delta tone thresholds.
// Requested UX:
// - abs(deltaPct) in [0, 5] -> GREEN
// - above that: YELLOW (small), ORANGE (medium), RED (large)
const DEFAULT_THRESHOLDS = {
  okPct: 5,
  minorPct: 10,
  warningPct: 20,

  // Absolute fallback (used when deltaPct is n/a or missing).
  okAbsEur: 100,
  minorAbsEur: 500,
  warningAbsEur: 2000,
}

// Tones are ordered by severity.
// ok: green, minor: yellow, warning: orange, danger: red

function toneFromAbsPct(absPct, thresholds) {
  if (absPct <= thresholds.okPct) return 'ok'
  if (absPct <= thresholds.minorPct) return 'minor'
  if (absPct <= thresholds.warningPct) return 'warning'
  return 'danger'
}

function toneFromAbsAbs(absAbs, thresholds) {
  if (absAbs <= thresholds.okAbsEur) return 'ok'
  if (absAbs <= thresholds.minorAbsEur) return 'minor'
  if (absAbs <= thresholds.warningAbsEur) return 'warning'
  return 'danger'
}

export function getDeltaTone({
  deltaAbs = 0,
  deltaPct = 0,
  deltaPctIsNa = false,
  thresholds = DEFAULT_THRESHOLDS,
}) {
  const absAbs = Math.abs(Number(deltaAbs) || 0)
  const absPct = Number.isFinite(Number(deltaPct)) ? Math.abs(Number(deltaPct)) : null

  // When percent is n/a (base=0, other>0), treat as severe discrepancy.
  if (deltaPctIsNa && absAbs > 0) return 'danger'

  if (absPct != null) return toneFromAbsPct(absPct, thresholds)
  return toneFromAbsAbs(absAbs, thresholds)
}

export function getDeltaPillStyle(tone) {
  if (tone === 'ok') {
    return {
      border: '1px solid rgba(52,211,153,0.35)',
      background: 'rgba(52,211,153,0.12)',
      color: '#34d399',
    }
  }
  if (tone === 'minor') {
    return {
      border: '1px solid rgba(251,191,36,0.40)',
      background: 'rgba(251,191,36,0.12)',
      color: '#fbbf24',
    }
  }
  if (tone === 'danger') {
    return {
      border: '1px solid rgba(248,113,113,0.35)',
      background: 'rgba(248,113,113,0.12)',
      color: '#f87171',
    }
  }
  if (tone === 'warning') {
    // Use existing orange (already used in charts).
    return {
      border: '1px solid rgba(249,115,22,0.40)',
      background: 'rgba(249,115,22,0.12)',
      color: '#f97316',
    }
  }
  return {
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text)',
  }
}
