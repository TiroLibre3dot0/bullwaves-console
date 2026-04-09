export const INVOICE_CATALOG = {
  skale: {
    '2026-03': {
      href: '/providers/skale/invoice.pdf',
      invoiceNo: 'INV-1234',
      invoiceDate: '2026-02-25',
      dueDate: '2026-02-25',
      reference: 'March 2026 - May 2026',
      currency: 'USD',
      billingMonths: 3,
      total: 20275,
      monthlyTotal: 20275 / 3,
      vatPercent: 0,
      items: [
        {
          description: 'Premium Package - Bullwaves',
          qty: 3,
          unitPrice: 2000,
          amount: 6000,
        },
        {
          description: 'CRM users - 45 chargeable users across 3 months',
          qty: 135,
          unitPrice: 65,
          amount: 8775,
        },
        {
          description: 'Additional Brand - Bullwaves Global',
          qty: 3,
          unitPrice: 1800,
          amount: 5400,
        },
        {
          description: 'Additional Plugins - Bullwaves Global',
          qty: 1,
          unitPrice: 100,
          amount: 100,
        },
      ],
    },
  },
  cellxpert: {
    '2026-02': {
      href: new URL('../../../Invoice providers/Cellxpert- 10827.pdf', import.meta.url).href,
      invoiceNo: '10827',
      invoiceDate: '2026-02-14',
      dueDate: '2026-02-24',
      currency: 'EUR',
      total: 3150,
      vatPercent: 0,
      items: [
        { description: 'Affiliate Software - February 2026', amount: 3000 },
        { description: 'Active Tracking URL - February 2026', amount: 150 },
      ],
    },
  },
  creolabs: {
    '2026-02': {
      href: new URL('../../../Invoice providers/CreoLabs-40085.pdf', import.meta.url).href,
      invoiceNo: '40085',
      invoiceDate: '2026-02-02',
      dueDate: '2026-02-28',
      currency: 'USD',
      total: 5500,
      vatPercent: 0,
      items: [
        {
          sku: '50',
          description: 'BI Professional Services',
          qty: 27.5,
          unitPrice: 200,
          amount: 5500,
        },
      ],
    },
  },
}
