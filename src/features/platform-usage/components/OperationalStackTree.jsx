function CostBadge({ value, tone, unknown = false }) {
  return (
    <div
      style={{
        minWidth: 74,
        padding: '6px 8px',
        borderRadius: 10,
        textAlign: 'right',
        fontWeight: 900,
        fontSize: 11,
        lineHeight: 1.1,
        color: tone,
        border: unknown ? '1px dashed rgba(255,255,255,0.18)' : '1px solid rgba(56,189,248,0.2)',
        background: unknown ? 'rgba(255,255,255,0.03)' : 'rgba(56,189,248,0.08)',
      }}
    >
      {value}
    </div>
  )
}

function StatusChip({ label, tone = 'var(--text-muted)' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 7px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        color: tone,
      }}
    >
      {label}
    </span>
  )
}

function CompactMetric({ label, value, tone = 'var(--text-primary)' }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: '10px 12px',
        display: 'grid',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          lineHeight: 1.2,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, lineHeight: 1.1, fontWeight: 900, color: tone }}>{value}</div>
    </div>
  )
}

function summarizeGroups(groups) {
  return (groups || []).reduce(
    (accumulator, group) => {
      accumulator.toolCount += Number(group?.toolCount || group?.tools?.length || 0)
      accumulator.missingCostCount += Number(group?.missingCostCount || 0)

      for (const [currency, amount] of Object.entries(group?.currencyTotals || {})) {
        const numericAmount = Number(amount)
        if (!Number.isFinite(numericAmount)) continue
        accumulator.currencyTotals[currency] =
          (accumulator.currencyTotals[currency] || 0) + numericAmount
      }

      return accumulator
    },
    { toolCount: 0, missingCostCount: 0, currencyTotals: {} }
  )
}

function formatCurrencyBreakdown(currencyTotals) {
  const entries = Object.entries(currencyTotals || {}).filter(([, amount]) =>
    Number.isFinite(Number(amount))
  )

  if (!entries.length) return '?'

  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      } catch {
        return `${currency} ${Number(amount).toFixed(0)}`
      }
    })
    .join(' + ')
}

export default function OperationalStackTree({ groups, t }) {
  const overall = summarizeGroups(groups)
  const overallKnownCost = formatCurrencyBreakdown(overall.currencyTotals)

  return (
    <div
      className="card-block"
      style={{
        padding: 14,
        background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.92) 100%)',
      }}
    >
      <div
        style={{
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'radial-gradient(circle at top, rgba(20,184,166,0.14), transparent 28%), rgba(255,255,255,0.025)',
          padding: 12,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(180px, 220px) minmax(0, 1fr)',
            gap: 12,
            alignItems: 'stretch',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(20,184,166,0.34)',
              background: 'linear-gradient(180deg, rgba(4,47,46,0.96), rgba(15,23,42,0.96))',
              boxShadow: '0 14px 34px rgba(4,47,46,0.18)',
              padding: 12,
              display: 'grid',
              gap: 6,
              alignContent: 'center',
            }}
          >
            <div className="eyebrow" style={{ fontSize: 10, marginBottom: 2 }}>
              {t('platformUsageBilling.operational.financeNodeEyebrow') || 'Macro Area'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>FINANCE</div>
            <div className="muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
              {t('platformUsageBilling.operational.financeNodeSubtitle') ||
                'Tool cost governance, invoice visibility, and operational cost control.'}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            <CompactMetric
              label={t('platformUsageBilling.operational.summary.totalTools') || 'Total tools'}
              value={overall.toolCount}
            />
            <CompactMetric
              label={t('platformUsageBilling.operational.summary.knownTotal') || 'Total'}
              value={overallKnownCost}
              tone="var(--success)"
            />
            <CompactMetric
              label={t('platformUsageBilling.operational.summary.missingCosts') || 'Missing costs'}
              value={overall.missingCostCount}
              tone="var(--warning)"
            />
            <CompactMetric
              label={t('platformUsageBilling.operational.financeSectionLabel') || 'Section'}
              value={t('platformUsageBilling.operational.financeSectionValue') || 'Ops Stack'}
              tone="var(--accent-secondary)"
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {groups.map((group) => (
            <section key={group.id} style={{ position: 'relative', minWidth: 0 }}>
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: 10,
                  display: 'grid',
                  gap: 8,
                  height: '100%',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>
                      {group.label}
                    </div>
                    <StatusChip
                      label={`${group.toolCount} ${
                        t('platformUsageBilling.operational.group.tools') || 'tools'
                      }`}
                    />
                  </div>

                  <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
                    {group.description}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <StatusChip
                      label={`${t('platformUsageBilling.operational.group.knownTotal') || 'Known total'} · ${formatCurrencyBreakdown(group.currencyTotals)}`}
                      tone="var(--accent-secondary)"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    <StatusChip
                      label={`${group.mappedToolsCount} ${
                        t('platformUsageBilling.operational.group.mapped') || 'mapped'
                      }`}
                      tone="var(--success)"
                    />
                    {group.missingCostCount ? (
                      <StatusChip
                        label={`${group.missingCostCount} ${
                          t('platformUsageBilling.operational.group.missing') || 'missing'
                        }`}
                        tone="var(--warning)"
                      />
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: 8,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  {group.tools.map((tool) => {
                    const invoiceStatus = tool.invoiceFound
                      ? `${t('platformUsageBilling.operational.tool.invoiceFound') || 'Invoice found'}${
                          tool.invoiceCoverageLabel
                            ? ` · ${tool.invoiceCoverageLabel}`
                            : tool.invoiceMonthLabel
                              ? ` · ${tool.invoiceMonthLabel}`
                              : ''
                        }`
                      : t('platformUsageBilling.operational.tool.invoicePending') ||
                        'Invoice mapping pending'

                    return (
                      <div
                        key={tool.id}
                        style={{
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(15,23,42,0.56)',
                          padding: '8px 9px',
                          display: 'grid',
                          gap: 5,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.2 }}>
                              {tool.label}
                            </div>
                            <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                              {tool.functionLabel}
                            </div>
                          </div>

                          <CostBadge
                            value={tool.costLabel}
                            tone={
                              tool.invoiceFound ? 'var(--accent-secondary)' : 'var(--text-primary)'
                            }
                            unknown={!tool.invoiceFound}
                          />
                        </div>

                        <div className="muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
                          {invoiceStatus}
                        </div>

                        {tool.invoiceFound &&
                        tool.billingMonths > 1 &&
                        tool.invoiceTotal != null ? (
                          <div className="muted" style={{ fontSize: 10, lineHeight: 1.35 }}>
                            {`${formatCurrencyBreakdown({ [tool.currency]: tool.invoiceTotal })} invoice total / ${tool.billingMonths} months`}
                          </div>
                        ) : null}

                        {tool.invoiceFound && tool.invoiceHref ? (
                          <div>
                            <a
                              href={tool.invoiceHref}
                              target="_blank"
                              rel="noreferrer"
                              className="pill-tab"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                            >
                              {t('platformUsageBilling.operational.tool.openInvoice') ||
                                'Open invoice'}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
