function MetricTile({ label, value, tone = 'var(--accent-secondary)', hint }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: 14,
        display: 'grid',
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, lineHeight: 1.1, fontWeight: 900, color: tone }}>{value}</div>
      {hint ? (
        <div className="muted" style={{ fontSize: 12 }}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

export default function OperationalCostSummary({ summary, t }) {
  return (
    <div
      className="card-block"
      style={{
        padding: 18,
        background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.9) 100%)',
      }}
    >
      <div className="card-block-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            {t('platformUsageBilling.operational.summaryEyebrow') || 'Cost Summary'}
          </p>
          <h3 style={{ marginBottom: 6 }}>
            {t('platformUsageBilling.operational.summaryTitle') || 'Operational machine cost'}
          </h3>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {t('platformUsageBilling.operational.summarySubtitle') ||
              'Known totals stay invoice-true. Unknown tools remain visible until mapped.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <MetricTile
          label={t('platformUsageBilling.operational.summary.totalTools') || 'Total tools'}
          value={summary.totalTools}
        />
        <MetricTile
          label={
            t('platformUsageBilling.operational.summary.knownMonthlyCost') || 'Known monthly cost'
          }
          value={summary.knownCostLabel}
          tone="var(--success)"
          hint={
            t('platformUsageBilling.operational.summary.knownMonthlyCostHint') ||
            'Summed only from mapped invoice totals.'
          }
        />
        <MetricTile
          label={t('platformUsageBilling.operational.summary.missingCosts') || 'Missing costs'}
          value={summary.missingCostCount}
          tone="var(--warning)"
          hint={
            t('platformUsageBilling.operational.summary.missingCostsHint') ||
            'Tools still waiting for invoice mapping.'
          }
        />
        <MetricTile
          label={
            t('platformUsageBilling.operational.summary.machineCost') || 'Operational machine cost'
          }
          value={summary.operationalMachineLabel}
          tone="var(--accent-secondary)"
          hint={`${t('platformUsageBilling.operational.summary.knownTotal') || 'Known total'}: ${summary.knownCostLabel}`}
        />
      </div>

      <div
        style={{
          marginTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 12,
          display: 'grid',
          gap: 4,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 800 }}>
          {t('platformUsageBilling.operational.summary.knownTotal') || 'Known total'}:{' '}
          <span style={{ color: 'var(--text-primary)' }}>{summary.knownCostLabel}</span>
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          {(
            t('platformUsageBilling.operational.summary.missingCount') ||
            'Missing costs: {count} tools'
          ).replace('{count}', String(summary.missingCostCount))}
        </div>
      </div>
    </div>
  )
}
