export const departmentColors = {
  'Support Team': '#0ea5e9',
  Operations: '#22c55e',
  HR: '#a855f7',
  'Sales - Conversion': '#f59e0b',
  'Sales - Retention': '#f59e0b',
  'Sales - Dubai': '#f59e0b',
  'Affiliate Manager': '#ef4444',
  Marketing: '#ec4899',
  Finance: '#14b8a6',
  Reconciliation: '#14b8a6',
  PSP: '#6366f1',
  Compliance: '#6b7280',
  Dealing: '#8b5cf6',
  Technology: '#3b82f6',
}

export const divisionColors = {
  Operations: '#22c55e',
  Acquisition: '#f97316',
  Finance: '#14b8a6',
  Compliance: '#6b7280',
  Trading: '#8b5cf6',
  Dealing: '#8b5cf6',
  'Trading & Dealing': '#8b5cf6',
  Shareholder: '#eab308',
  Support: '#0ea5e9',
  Technology: '#3b82f6',
}

export function getFlagData(region = '') {
  const key = region.trim().toLowerCase()
  const map = {
    israel: { emoji: '🇮🇱', iso: 'il' },
    il: { emoji: '🇮🇱', iso: 'il' },
    italy: { emoji: '🇮🇹', iso: 'it' },
    it: { emoji: '🇮🇹', iso: 'it' },
    cyprus: { emoji: '🇨🇾', iso: 'cy' },
    cy: { emoji: '🇨🇾', iso: 'cy' },
    dubai: { emoji: '🇦🇪', iso: 'ae' },
    uae: { emoji: '🇦🇪', iso: 'ae' },
    ae: { emoji: '🇦🇪', iso: 'ae' },
    uk: { emoji: '🇬🇧', iso: 'gb' },
    gb: { emoji: '🇬🇧', iso: 'gb' },
    'united kingdom': { emoji: '🇬🇧', iso: 'gb' },
    bangladesh: { emoji: '🇧🇩', iso: 'bd' },
    bd: { emoji: '🇧🇩', iso: 'bd' },
    bulgaria: { emoji: '🇧🇬', iso: 'bg' },
    bg: { emoji: '🇧🇬', iso: 'bg' },
    pakistan: { emoji: '🇵🇰', iso: 'pk' },
    pk: { emoji: '🇵🇰', iso: 'pk' },
    ghana: { emoji: '🇬🇭', iso: 'gh' },
    gh: { emoji: '🇬🇭', iso: 'gh' },
    serbia: { emoji: '🇷🇸', iso: 'rs' },
    rs: { emoji: '🇷🇸', iso: 'rs' },
  }

  if (map[key]) return map[key]

  const candidate = key.slice(0, 2)
  if (map[candidate]) return map[candidate]

  return { emoji: '', iso: '' }
}

export const sections = [
  {
    id: 'management-team',
    title: 'Management Team',
    roles: [
      { name: 'Emanuele Braha', title: 'COO', division: 'Operations', department: 'Operations', region: 'Israel', email: 'affiliates@bullwaves.com', focus: 'Operations leadership', duties: 'Sales & Support oversight; monitoring performance, weekly catch-ups; Italian affiliates.' },
      { name: 'Francesco Ceccarini', title: 'Shareholder', division: 'Operations', department: 'Operations', region: 'Israel', email: 'francesco@bullwaves.com', focus: 'Operations', duties: 'CRM/softphone/livechat issues, emergency topics, withdrawals, crypto deposits.' },
      { name: 'Filippo', title: 'Shareholder', division: 'Shareholder', department: 'Shareholder', region: '—', email: 'filippo@bullwaves.com', focus: 'Governance', duties: 'Shareholder governance.' },
      { name: 'Renato Pezzi', title: 'Shareholder', division: 'Shareholder', department: 'Shareholder', region: 'Italy', email: 'renato@bullwaves.com', focus: 'Dealing & PSPs', duties: 'Trading issues, abusers, payouts, PSP problems.' },
      { name: 'Stefan Popovski', title: 'Shareholder', division: 'Shareholder', department: 'Shareholder', region: 'Dubai', email: 'partners@bullwaves.com', focus: 'Affiliation', duties: 'Affiliate strategy and partner oversight.' },
      { name: 'Filippo De Rosa', title: 'Non Executive Director', division: 'Shareholder', department: 'Shareholder', region: '—', email: 'filippo@bullwaves.com', focus: 'Non-Executive Director', duties: 'Strategic oversight and governance.' },
      { name: 'Tamara Popovic Yakimov', title: 'Head of Support', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'tamara@bullwaves.com', focus: 'Support / Operations', duties: 'Team funding, KYC approval, CRM management, PSP/Banking issues; Support leadership.' },
      { name: 'Paolo Vullo', title: 'Head of Operations', division: 'Operations', department: 'Operations', region: 'Italy', email: 'paolo.v@bullwaves.com', focus: 'Operations', duties: 'Operations leadership and coordination.' },
    ],
  },
  {
    id: 'area-responsibility',
    title: 'Area Responsibility Layer',
    roles: [
      { name: 'Operations (Area)', title: 'Responsible: Francesco', division: 'Operations', department: 'Operations', region: '—', email: 'francesco@bullwaves.com', focus: 'Ops scope', duties: 'CRM automation, CRM troubleshooting, CX tracking, partner deal setup, commission triggers, software ecosystem (Sumsub, CommPeak, Sendgrid, Helpdesk), project coordination, sales assignment, copy trading.' },
      { name: 'Support (Area)', title: 'Responsible: Emanuele + Tamara + Sonja + Nevena', division: 'Operations', department: 'Support Team', region: '—', email: 'affiliates@bullwaves.com', focus: 'Support scope', duties: 'FX Tickets, Prop Tickets, Livechat/Slack, KYC execution, FX withdrawals, Prop payouts, Trustpilot, WA partner groups, deposit issues (crypto, CC failed, bank wire).' },
      { name: 'Dealing & Risk (Area)', title: 'Responsible: Renato', division: 'Dealing', department: 'Dealing', region: '—', email: 'renato@bullwaves.com', focus: 'Risk & platforms', duties: 'Risk monitoring, abuse detection, FXCubic, Nullpoint, Netshop, MT5 configuration, profitability. Dealing Ops/Truviam: bonuses, password changes, fake accounts, enabling/disabling accounts, prop payouts.' },
      { name: 'Affiliation (Area)', title: 'Responsible: Stefan', division: 'Acquisition', department: 'Affiliate Manager', region: '—', email: 'partners@bullwaves.com', focus: 'Affiliation scope', duties: 'Tracking issues, affiliate questions, partner WhatsApp groups, KPI monitoring.' },
      { name: 'Payments / PSP (Area)', title: 'Responsible: Tamara', division: 'Finance', department: 'PSP', region: '—', email: 'tamara@bullwaves.com', focus: 'PSP scope', duties: 'PSP applications, reconciliation, chargebacks, PSP management. Need PSP Specialist to reduce overload.' },
      { name: 'Compliance (Area)', title: 'Responsible: Terina', division: 'Compliance', department: 'Compliance', region: '—', email: '—', focus: 'Compliance scope', duties: 'KYC monitoring, EDD, compliance reports. Need an additional Compliance Officer.' },
      { name: 'Business Development (Area)', title: 'Responsible: Imran / Straninja', division: 'Acquisition', department: 'Sales', region: '—', email: 'imran.hossain@bullwaves.com', focus: 'BD scope', duties: 'Sales conversion, retention, partner management.' },
      { name: 'Marketing (Area)', title: 'Responsible: Daniel', division: 'Acquisition', department: 'Marketing', region: '—', email: '—', focus: 'Marketing scope', duties: 'Social media, email marketing, giveaways, comparison websites, online review campaigns.' },
      { name: 'Finance (Area)', title: 'Responsible: (Unassigned)', division: 'Finance', department: 'Finance', region: '—', email: '—', focus: 'Finance scope', duties: 'Accounting, controlling, reporting, B2B payments, affiliate payments. Leadership missing.' },
    ],
  },
  {
    id: 'support-team',
    title: 'Support Team',
    roles: [
      { name: 'Tamara Popovic Yakimov', title: 'Head of Support', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'tamara@bullwaves.com', focus: 'Leadership', duties: 'Leads support; PSP/banking issues, team funding, KYC approval, CRM management.' },
      { name: 'Nevena Milosavljevic', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'neve.milos@bullwaves.com', focus: 'Prop + PSP', duties: 'Prop tickets, payouts, WhatsApp partner support, PSP issues, FunderPro tickets.' },
      { name: 'Sonja Djuric', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'sonja.djuric@bullwaves.com', focus: 'Forex', duties: 'Forex tickets, WhatsApp support, KYC, Trustpilot, livechat, DEFI Slack, PSP issues, incoming calls.' },
      { name: 'Natalija Stefanovic', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'natalia.stefanovic@bullwaves.com', focus: 'Forex & Prop', duties: 'Tickets, WA support, KYC, Trustpilot, PSP issues; late shifts; supports Forex and Prop.' },
      { name: 'Violeta Lukovic', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'viola.lukovic@bullwaves.com', focus: 'Weekend coverage', duties: 'Weekend tickets/support coverage.' },
      { name: 'Jelena Milovanovic', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'jelena.milovanovic@bullwaves.com', focus: 'Support', duties: 'Support tickets and WA groups.' },
      { name: 'Nikola Eric', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'nikola.eric@bullwaves.com', focus: 'Support', duties: 'Support tickets and WA groups.' },
      { name: 'Milica Stricevic', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'milica.stricevic@bullwaves.com', focus: 'Support', duties: 'Support tickets and WA groups.' },
      { name: 'Tamara Aramovic', title: 'Support Team', division: 'Operations', department: 'Support Team', region: 'Serbia', email: 'tamara.aramovic@bullwaves.com', focus: 'Support', duties: 'Support tickets and WA groups.' },
      { name: 'Ivana Jelic', title: 'Hybrid - operation & support', division: 'Technology', department: 'Support Team', region: 'Serbia', email: 'ivana.jelic@bullwaves.com', focus: 'Hybrid ops/support', duties: 'Operations-support hybrid coverage.' },
      { name: 'DEFI Creators', title: '24/7 Livechat (Slack)', division: 'Support', department: 'Support Team', region: '—', email: '—', focus: 'Livechat', duties: '24/7 livechat on Slack (no CRM access).' },
      { name: 'Support Backfills', title: 'Incoming hires', division: 'Operations', department: 'Support Team', region: 'Serbia', email: '—', focus: 'Pipeline', duties: 'Anela joining in 2 weeks; weekend support (Violeta) and livechat/Slack role already added.' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    roles: [
      { name: 'Paolo Vullo', title: 'Head of Operations', division: 'Operations', department: 'Operations', region: 'Italy', email: 'paolo.v@bullwaves.com', focus: 'Ops leadership', duties: 'Operational oversight and coordination.' },
      { name: 'Marina Christoforou', title: 'HR Manager', division: 'Operations', department: 'HR', region: 'Cyprus', email: 'marina.christoforou@bullwaves.com', focus: 'HR', duties: 'People operations and HR support.' },
      { name: 'Operations Scope', title: 'Scope (Area Layer)', division: 'Operations', department: 'Operations', region: '—', email: 'francesco@bullwaves.com', focus: 'Processes', duties: 'CRM automation/troubleshooting, CX tracking, partner deal setup, commission triggers, project coordination, sales assignment, software ecosystem management (Sumsub, CommPeak, Sendgrid, Helpdesk), copy trading.' },
    ],
  },
  {
    id: 'business-development',
    title: 'Business Development / Sales',
    roles: [
      { name: 'Roberta Jovanovic', title: 'Business Development Coordinator', division: 'Acquisition', department: 'Sales - Conversion', region: 'Cyprus', email: 'roberta.jovanovic@bullwaves.com', focus: 'Conversion', duties: 'Sales conversion coordination.' },
      { name: 'Jake Morgan', title: 'Sales Manager', division: 'Acquisition', department: 'Sales - Conversion', region: 'UK', email: 'jake.m@bullwaves.com', focus: 'Sales', duties: 'Sales management for conversion.' },
      { name: 'Imran Hossain', title: 'Business Development Manager', division: 'Acquisition', department: 'Sales - Conversion', region: 'Bangladesh', email: 'imran.hossain@bullwaves.com', focus: 'BD Manager', duties: 'Sales conversion and partner management.' },
      { name: 'Orlin Simovonyan', title: 'Business Development Coordinator', division: 'Acquisition', department: 'Sales - Retention', region: 'Bulgaria', email: 'orlin.simovonyan@bullwaves.com', focus: 'Retention', duties: 'Retention coordination.' },
      { name: 'Gabriela Yordanova', title: 'Business Development Coordinator', division: 'Acquisition', department: 'Sales - Retention', region: 'Bulgaria', email: 'gabriela.yordanova@bullwaves.com', focus: 'Retention', duties: 'Retention coordination.' },
      { name: 'Ghassan Zaghdoud', title: 'Head of MENA', division: 'Acquisition', department: 'Sales - Dubai', region: 'Dubai', email: 'ghassan.z@bullwaves.com', focus: 'Sales - Dubai', duties: 'Sales leadership for MENA/Dubai.' },
    ],
  },
  {
    id: 'affiliation',
    title: 'Affiliation / Partner Management',
    roles: [
      { name: 'Stefan Popovski', title: 'Shareholder / Affiliation Lead', division: 'Shareholder', department: 'Affiliate Manager', region: 'Dubai', email: 'partners@bullwaves.com', focus: 'Affiliation lead', duties: 'Tracking issues, affiliate questions, partner WhatsApp groups, KPI monitoring.' },
      { name: 'Saad Shahzad', title: 'Affiliate Marketing Manager', division: 'Acquisition', department: 'Affiliate Manager', region: 'Pakistan', email: 'saad.shahzad@bullwaves.com', focus: 'Affiliate marketing', duties: 'Affiliate marketing and partner support.' },
      { name: 'Oscar Agyemang', title: 'Marketing Manager', division: 'Acquisition', department: 'Affiliate Manager', region: 'Ghana', email: 'oscar@bullwaves.com', focus: 'Affiliate marketing', duties: 'Affiliate marketing and campaign support.' },
      { name: 'Davide Levy', title: 'Affiliate Marketing Manager', division: 'Acquisition', department: 'Affiliate Manager', region: 'Israel', email: 'davide.levy@bullwaves.com', focus: 'Affiliate marketing', duties: 'Affiliate marketing and partner management.' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing',
    roles: [
      { name: 'Daniel', title: 'Marketing Lead', division: 'Acquisition', department: 'Marketing', region: '—', email: '—', focus: 'Marketing lead', duties: 'Social media, email marketing, giveaways, comparison websites, online review campaigns.' },
      { name: 'DEFI Creators', title: 'Creators', division: 'Support', department: 'Support Team', region: '—', email: '—', focus: 'Content/Livechat', duties: 'Content and creative collaboration; 24/7 livechat on Slack (no CRM access).' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    roles: [
      { name: 'Rodoula Xenofontos', title: 'Senior Controller', division: 'Finance', department: 'Finance', region: 'Cyprus', email: 'rodoula.xenofontos@bullwaves.com', focus: 'Controlling', duties: 'Senior controlling and finance oversight.' },
      { name: 'Georgia Kleovoulou', title: 'Finance Officer', division: 'Finance', department: 'Reconciliation', region: 'Cyprus', email: 'georgia.kleovoulou@bullwaves.com', focus: 'Reconciliation', duties: 'Reconciliation and finance operations.' },
      { name: 'Finance Scope', title: 'Scope (Area Layer)', division: 'Finance', department: 'Finance', region: '—', email: '—', focus: 'Finance processes', duties: 'Accounting, controlling, reporting, B2B payments, affiliate payments (lead missing).' },
    ],
  },
  {
    id: 'payments',
    title: 'Payments / PSP',
    roles: [
      { name: 'Tamara Popovic Yakimov', title: 'Head of Support / PSP Oversight', division: 'Operations', department: 'PSP', region: 'Serbia', email: 'tamara@bullwaves.com', focus: 'PSP oversight', duties: 'PSP applications, reconciliation, chargebacks, PSP management.' },
      { name: 'Konstantina Zafeiropoulou', title: 'PSP Specialist', division: 'Finance', department: 'PSP', region: 'Cyprus', email: 'konstantina.zafeiropoulou@bullwaves.com', focus: 'PSP specialist', duties: 'PSP specialist support and execution.' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance',
    roles: [
      { name: 'Stamatis Daravanis', title: 'Back Office & Compliance Specialist', division: 'Compliance', department: 'Compliance', region: 'Cyprus', email: 'stamatis.daravanis@bullwaves.com', focus: 'Compliance', duties: 'Compliance reports, back office, EDD support.' },
      { name: 'Terina', title: 'Compliance Officer', division: 'Compliance', department: 'Compliance', region: '—', email: '—', focus: 'Compliance officer', duties: 'KYC monitoring, EDD, compliance reports.' },
    ],
  },
  {
    id: 'dealing',
    title: 'Dealing Desk / PSP / Risk',
    roles: [
      { name: 'Renato Pezzi', title: 'Shareholder (Dealing & PSPs)', division: 'Shareholder', department: 'Dealing', region: 'Italy', email: 'renato@bullwaves.com', focus: 'Dealing leadership', duties: 'Trading issues, abusers, payouts, PSP problems.' },
      { name: 'Chris Psomas', title: 'Head of Operations (Trading & Dealing)', division: 'Trading & Dealing', department: 'Dealing', region: 'Cyprus', email: 'chris.psomas@bullwaves.com', focus: 'Dealing operations', duties: 'FXCubic, Nullpoint, Netshop, MT5 configuration, risk monitoring, profitability.' },
      { name: 'Dealing Operations / Truviam', title: 'Operations', division: 'Dealing', department: 'Dealing', region: '—', email: '—', focus: 'Dealing Ops', duties: 'Bonuses, password changes, fake accounts creation, enabling/disabling accounts, prop payouts.' },
    ],
  },
]
