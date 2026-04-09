export const OPERATIONAL_STACK_GROUPS = [
  {
    id: 'crm',
    label: 'CRM',
    description: 'Client lifecycle, acquisition routing, and account operations.',
    tools: [
      {
        id: 'skale',
        label: 'SKALE',
        functionLabel: 'CRM operations',
        invoiceProviderKey: 'skale',
        providerAliases: ['skale'],
      },
      {
        id: 'cellxpert',
        label: 'CELLXPERT',
        functionLabel: 'Affiliate CRM',
        invoiceProviderKey: 'cellxpert',
        providerAliases: ['cellxpert', 'cell xpert'],
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Outbound messaging, live support, email, and SMS infrastructure.',
    tools: [
      {
        id: 'convrs',
        label: 'CONVRS',
        functionLabel: 'Messaging platform',
        invoiceProviderKey: 'convrs',
        providerAliases: ['convrs', 'conv.rs'],
      },
      {
        id: 'livechat',
        label: 'LIVECHAT',
        functionLabel: 'Live support',
        invoiceProviderKey: 'livechat',
        providerAliases: ['livechat', 'live chat'],
      },
      {
        id: 'sendgrid',
        label: 'SENDGRID',
        functionLabel: 'Mail provider',
        invoiceProviderKey: 'sendgrid',
        providerAliases: ['sendgrid', 'twilio sendgrid'],
      },
      {
        id: 'dynamic-messaging',
        label: 'DYNAMIC MESSAGING',
        functionLabel: 'SMS provider',
        invoiceProviderKey: 'dynamic-messaging',
        providerAliases: ['dynamic messaging', 'dynamicmessaging'],
      },
    ],
  },
  {
    id: 'bi-analytics',
    label: 'BI / Analytics',
    description: 'Reporting, campaign orchestration, and operational intelligence.',
    tools: [
      {
        id: 'creolabs',
        label: 'CREOLABS',
        functionLabel: 'Business intelligence',
        invoiceProviderKey: 'creolabs',
        providerAliases: ['creolabs', 'creo labs'],
      },
      {
        id: 'solitics',
        label: 'SOLITICS',
        functionLabel: 'Journey automation',
        invoiceProviderKey: 'solitics',
        providerAliases: ['solitics'],
      },
    ],
  },
  {
    id: 'trading-core-ops',
    label: 'Trading / Core Ops',
    description: 'Core trading intelligence and broker-side operating systems.',
    tools: [
      {
        id: 'acuity',
        label: 'ACUITY',
        functionLabel: 'Trading tool',
        invoiceProviderKey: 'acuity',
        providerAliases: ['acuity'],
      },
      {
        id: 'brokeree',
        label: 'BROKEREE',
        functionLabel: 'Broker infrastructure',
        invoiceProviderKey: 'brokeree',
        providerAliases: ['brokeree'],
      },
      {
        id: 'funderpro',
        label: 'FUNDERPRO',
        functionLabel: 'Program operations',
        invoiceProviderKey: 'funderpro',
        providerAliases: ['funderpro', 'funder pro'],
      },
    ],
  },
  {
    id: 'compliance-verification',
    label: 'Compliance / Verification',
    description: 'Identity checks and compliance-critical verification flows.',
    tools: [
      {
        id: 'sumsub',
        label: 'SUMSUB',
        functionLabel: 'Identity verification',
        invoiceProviderKey: 'sumsub',
        providerAliases: ['sumsub'],
      },
    ],
  },
]

function addCurrencyTotal(currencyTotals, currency, amount) {
  if (!currency || !Number.isFinite(amount)) return currencyTotals
  return {
    ...currencyTotals,
    [currency]: Number(currencyTotals[currency] || 0) + amount,
  }
}

function pickLatestInvoice(invoiceCatalog, providerKey) {
  const providerInvoices = invoiceCatalog?.[providerKey]
  if (!providerInvoices || typeof providerInvoices !== 'object') return null
  const monthKeys = Object.keys(providerInvoices).sort()
  if (!monthKeys.length) return null
  const monthKey = monthKeys.at(-1)
  const invoiceMeta = providerInvoices?.[monthKey] || null
  if (!invoiceMeta) return null
  return { monthKey, invoiceMeta }
}

function getEffectiveMonthlyCost(invoiceMeta) {
  const explicitMonthly = Number(invoiceMeta?.monthlyTotal)
  if (Number.isFinite(explicitMonthly)) return explicitMonthly

  const total = Number(invoiceMeta?.total)
  if (!Number.isFinite(total)) return null

  const billingMonths = Number(invoiceMeta?.billingMonths)
  if (Number.isFinite(billingMonths) && billingMonths > 1) return total / billingMonths

  return total
}

export function resolveOperationalStackGroups(invoiceCatalog, locale, monthLabelFromKey) {
  return OPERATIONAL_STACK_GROUPS.map((group) => {
    let currencyTotals = {}
    let missingCostCount = 0

    const tools = group.tools.map((tool) => {
      const latestInvoice = pickLatestInvoice(invoiceCatalog, tool.invoiceProviderKey)
      const invoiceMeta = latestInvoice?.invoiceMeta || null
      const monthlyCost = getEffectiveMonthlyCost(invoiceMeta)
      const hasKnownCost = Number.isFinite(monthlyCost)
      const currency = hasKnownCost ? String(invoiceMeta?.currency || '').toUpperCase() : ''

      if (hasKnownCost) {
        currencyTotals = addCurrencyTotal(currencyTotals, currency, monthlyCost)
      } else {
        missingCostCount += 1
      }

      return {
        ...tool,
        monthlyCost: hasKnownCost ? monthlyCost : null,
        currency: currency || null,
        invoiceFound: hasKnownCost,
        invoiceMeta,
        invoiceHref: invoiceMeta?.href || '',
        invoiceTotal: Number.isFinite(Number(invoiceMeta?.total))
          ? Number(invoiceMeta.total)
          : null,
        billingMonths:
          Number.isFinite(Number(invoiceMeta?.billingMonths)) &&
          Number(invoiceMeta.billingMonths) > 0
            ? Number(invoiceMeta.billingMonths)
            : 1,
        invoiceCoverageLabel: String(invoiceMeta?.reference || '').trim(),
        invoiceMonthKey: latestInvoice?.monthKey || '',
        invoiceMonthLabel:
          latestInvoice?.monthKey && typeof monthLabelFromKey === 'function'
            ? monthLabelFromKey(latestInvoice.monthKey, locale)
            : '',
      }
    })

    return {
      ...group,
      tools,
      toolCount: tools.length,
      mappedToolsCount: tools.length - missingCostCount,
      missingCostCount,
      currencyTotals,
    }
  })
}

export function buildOperationalStackSummary(groups) {
  return (groups || []).reduce(
    (accumulator, group) => {
      const nextCurrencyTotals = { ...(accumulator.currencyTotals || {}) }
      for (const [currency, amount] of Object.entries(group?.currencyTotals || {})) {
        nextCurrencyTotals[currency] =
          Number(nextCurrencyTotals[currency] || 0) + Number(amount || 0)
      }

      return {
        totalTools: accumulator.totalTools + Number(group?.toolCount || 0),
        mappedToolsCount: accumulator.mappedToolsCount + Number(group?.mappedToolsCount || 0),
        missingCostCount: accumulator.missingCostCount + Number(group?.missingCostCount || 0),
        currencyTotals: nextCurrencyTotals,
      }
    },
    {
      totalTools: 0,
      mappedToolsCount: 0,
      missingCostCount: 0,
      currencyTotals: {},
    }
  )
}
