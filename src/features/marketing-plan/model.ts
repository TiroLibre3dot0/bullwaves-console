export type InitiativeStatus = 'Planned' | 'In progress' | 'Live' | 'Optimizing'

export type Timeframe =
  | { type: 'days'; days: 30 | 60 | 90 }
  | { type: 'quarter'; year: number; quarter: 1 | 2 | 3 | 4 }
  | { type: 'custom'; startDate: string; endDate: string }

export type MetricKey =
  | 'registrations'
  | 'deposit_users'
  | 'deposit_count'
  | 'total_deposits'
  | 'net_deposits'
  | 'deposit_retention_m1'

export type ScenarioKey = 'conservative' | 'base' | 'aggressive'

export interface ImpactModel {
  usersDelta?: number
  depositsDelta?: number
  retentionDeltaPct?: number
  revenueDelta?: number
  notes?: string
}

export interface InitiativeForecast {
  conservative: ImpactModel
  base: ImpactModel
  aggressive: ImpactModel
}

export interface InitiativeActuals {
  usersActual?: number
  depositsActual?: number
  retentionActualPct?: number
  revenueActual?: number
  notes?: string
  source?: 'bullwaves-data' | 'manual'
}

export interface MarketingInitiative {
  id: string
  name: string
  strategicGoal: string
  timeframe: Timeframe
  ownerRole: string
  status: InitiativeStatus
  keyActions: string[]
  assumptions: string[]
  connectedMetrics: MetricKey[]
  forecast: InitiativeForecast
  actuals: InitiativeActuals
  decisionNotes?: string
}

export interface StrategicObjective {
  id: string
  title: string
  description: string
  timeframe: string
  kpis: Array<{ key: MetricKey | 'primary_users_target'; label: string; target: string }>
}

export interface MarketingPlanV1 {
  version: 1
  updatedAt: string
  objectives: StrategicObjective[]
  initiatives: MarketingInitiative[]
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function defaultMarketingPlan(now = new Date()): MarketingPlanV1 {
  const year = now.getFullYear()

  const objectiveGrowth: StrategicObjective = {
    id: 'obj_growth',
    title: 'Reach 150–200K users',
    description:
      'Primary objective: scale the user base to 150–200K, while protecting unit economics and retention. This plan is only “complete” when execution + measurement + forecast deltas exist.',
    timeframe: `${year} (quarterly execution cadence)`,
    kpis: [
      { key: 'primary_users_target', label: 'Target users', target: '150–200K' },
      { key: 'registrations', label: 'Registrations (baseline + uplift)', target: 'Board-tracked' },
      { key: 'deposit_users', label: 'Depositing users', target: 'Board-tracked' },
    ],
  }

  const objectiveRetention: StrategicObjective = {
    id: 'obj_retention',
    title: 'Improve retention & activity',
    description:
      'Retention and activity improvement goals (measured via Bullwaves deposits, repeat deposits, and cohort reactivation). Where attribution is not available, we mark assumptions explicitly.',
    timeframe: `${year} (30/60/90 execution loops)`,
    kpis: [
      { key: 'deposit_retention_m1', label: 'Deposit retention (Month 1)', target: 'Increase vs baseline' },
      { key: 'deposit_count', label: 'Deposit count', target: 'Increase vs baseline' },
      { key: 'net_deposits', label: 'Net deposits', target: 'Increase vs baseline' },
    ],
  }

  const initiatives: MarketingInitiative[] = [
    {
      id: 'init_education_hub',
      name: 'Education Hub',
      strategicGoal: 'Acquire users via education-led funnels + improve activation.',
      timeframe: { type: 'days', days: 90 },
      ownerRole: 'Content Lead + SEO',
      status: 'Planned',
      keyActions: [
        'Define 10 pillar topics (trading basics → prop challenges → risk management)',
        'Ship 20 SEO pages + internal linking to conversion CTAs',
        'Add lead magnet + email capture tied to CRM journeys',
      ],
      assumptions: [
        'Assumption: education pages convert to registration at 0.8–1.5%',
        'Assumption: 20 pages reach 10–40K monthly impressions within 90 days',
      ],
      connectedMetrics: ['registrations', 'deposit_users'],
      forecast: {
        conservative: { usersDelta: 1500, depositsDelta: 250, notes: 'SEO ramp is slower; limited distribution.' },
        base: { usersDelta: 4500, depositsDelta: 700, notes: 'Pillar SEO + CRM capture works as expected.' },
        aggressive: { usersDelta: 9000, depositsDelta: 1400, notes: 'Strong ranking + high-quality lead magnet.' },
      },
      actuals: { source: 'manual', notes: 'Actuals pending: connect to timeframe view.' },
      decisionNotes: 'Need: owner confirmation + publishing cadence + Solitics segmentation.',
    },
    {
      id: 'init_youtube',
      name: 'YouTube & Video Content',
      strategicGoal: 'Scale awareness, trust, and conversion with repeatable video formats.',
      timeframe: { type: 'days', days: 90 },
      ownerRole: 'Video Producer + Host',
      status: 'Planned',
      keyActions: [
        'Define 2 recurring formats (education + strategy breakdowns)',
        'Publish 2 videos/week + 10 shorts/week',
        'Repurpose to socials + embed in Education Hub',
      ],
      assumptions: [
        'Assumption: video → site CTR 0.3–0.8%',
        'Assumption: registration conversion from video traffic 1.0–2.0%',
      ],
      connectedMetrics: ['registrations'],
      forecast: {
        conservative: { usersDelta: 1000, notes: 'Slow channel growth' },
        base: { usersDelta: 3500, notes: 'Consistent publishing + repurposing' },
        aggressive: { usersDelta: 8000, notes: 'One breakout series + partnerships' },
      },
      actuals: { source: 'manual' },
    },
    {
      id: 'init_crm_solitics',
      name: 'Email Marketing & CRM (Solitics)',
      strategicGoal: 'Increase activation + retention through lifecycle journeys.',
      timeframe: { type: 'days', days: 90 },
      ownerRole: 'CRM Manager + Solitics',
      status: 'In progress',
      keyActions: [
        'Implement onboarding journey (D0/D1/D3/D7)',
        'Build reactivation journeys by inactivity bucket',
        'Set up KPI dashboard: activation, deposit, retention',
      ],
      assumptions: [
        'Assumption: journey uplift +10–25% on deposits among engaged cohort',
        'Assumption: deliverability + segmentation data is available',
      ],
      connectedMetrics: ['deposit_users', 'deposit_retention_m1', 'deposit_count'],
      forecast: {
        conservative: { depositsDelta: 300, retentionDeltaPct: 1.0 },
        base: { depositsDelta: 900, retentionDeltaPct: 2.5 },
        aggressive: { depositsDelta: 1800, retentionDeltaPct: 4.0 },
      },
      actuals: { source: 'manual', notes: 'If Solitics reporting exists, enter actual uplift here.' },
    },
    {
      id: 'init_influencers',
      name: 'Influencer & Partnerships',
      strategicGoal: 'Acquire qualified users through trusted distribution.',
      timeframe: { type: 'days', days: 90 },
      ownerRole: 'Partnerships Lead',
      status: 'Planned',
      keyActions: [
        'Shortlist 30 creators (tiered) + outreach',
        'Define compensation model (CPA / Revshare) + compliance checks',
        'Launch 5 pilots → scale winners',
      ],
      assumptions: [
        'Assumption: CPA efficiency similar to historical affiliate performance',
        'Assumption: pilot conversion rate 1.0–3.0%',
      ],
      connectedMetrics: ['registrations', 'deposit_users', 'net_deposits'],
      forecast: {
        conservative: { usersDelta: 2000, depositsDelta: 300 },
        base: { usersDelta: 6000, depositsDelta: 900 },
        aggressive: { usersDelta: 12000, depositsDelta: 2000 },
      },
      actuals: { source: 'manual' },
    },
    {
      id: 'init_seo_pr',
      name: 'SEO & PR',
      strategicGoal: 'Increase inbound demand and authority; reduce CAC over time.',
      timeframe: { type: 'quarter', year, quarter: 1 },
      ownerRole: 'SEO Lead + PR Agency',
      status: 'Planned',
      keyActions: ['Technical SEO fixes', 'PR pipeline (2 placements/month)', 'Backlink strategy'],
      assumptions: ['Assumption: authority growth compounds; measurable after 6–12 weeks'],
      connectedMetrics: ['registrations'],
      forecast: {
        conservative: { usersDelta: 1200 },
        base: { usersDelta: 3500 },
        aggressive: { usersDelta: 7000 },
      },
      actuals: { source: 'manual' },
    },
    {
      id: 'init_community',
      name: 'Community & Social',
      strategicGoal: 'Improve retention and repeat engagement via community loops.',
      timeframe: { type: 'days', days: 60 },
      ownerRole: 'Community Manager',
      status: 'Planned',
      keyActions: ['Launch Discord/Telegram structure', 'Weekly live sessions', 'Ambassador program'],
      assumptions: ['Assumption: community increases repeat deposits via engagement'],
      connectedMetrics: ['deposit_retention_m1', 'deposit_count'],
      forecast: {
        conservative: { retentionDeltaPct: 0.5 },
        base: { retentionDeltaPct: 1.5 },
        aggressive: { retentionDeltaPct: 3.0 },
      },
      actuals: { source: 'manual' },
    },
    {
      id: 'init_reactivation',
      name: 'Reactivation Engine',
      strategicGoal: 'Recover dormant users into active/depositing cohorts.',
      timeframe: { type: 'days', days: 30 },
      ownerRole: 'CRM + Ops',
      status: 'Planned',
      keyActions: ['Define inactivity buckets', 'Offer matrix + compliance', 'Run weekly reactivation batches'],
      assumptions: ['Assumption: 3–8% reactivation on reachable dormant cohort'],
      connectedMetrics: ['deposit_users', 'deposit_count'],
      forecast: {
        conservative: { depositsDelta: 150 },
        base: { depositsDelta: 400 },
        aggressive: { depositsDelta: 900 },
      },
      actuals: { source: 'manual' },
    },
    {
      id: 'init_loyalty',
      name: 'Loyalty / Gamification',
      strategicGoal: 'Increase retention and lifetime value via structured incentives.',
      timeframe: { type: 'quarter', year, quarter: 2 },
      ownerRole: 'Product + Marketing',
      status: 'Planned',
      keyActions: ['Define loyalty tiers', 'Rewards budget + ROI model', 'Ship v1 rewards dashboard'],
      assumptions: ['Assumption: incentives increase retention without increasing risk'],
      connectedMetrics: ['deposit_retention_m1', 'net_deposits'],
      forecast: {
        conservative: { retentionDeltaPct: 0.5, depositsDelta: 200 },
        base: { retentionDeltaPct: 1.8, depositsDelta: 700 },
        aggressive: { retentionDeltaPct: 3.0, depositsDelta: 1500 },
      },
      actuals: { source: 'manual' },
    },
  ]

  return {
    version: 1,
    updatedAt: now.toISOString(),
    objectives: [objectiveGrowth, objectiveRetention],
    initiatives,
  }
}

export function clonePlan(plan: MarketingPlanV1): MarketingPlanV1 {
  return JSON.parse(JSON.stringify(plan))
}

export function upsertInitiative(plan: MarketingPlanV1, initiative: MarketingInitiative): MarketingPlanV1 {
  const next = clonePlan(plan)
  const idx = next.initiatives.findIndex((i) => i.id === initiative.id)
  if (idx >= 0) next.initiatives[idx] = initiative
  else next.initiatives.push({ ...initiative, id: initiative.id || makeId('init') })
  next.updatedAt = new Date().toISOString()
  return next
}
