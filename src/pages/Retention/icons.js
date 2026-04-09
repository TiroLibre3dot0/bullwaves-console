function buildSvgDataUri(svgMarkup) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup.trim())}`
}

const ICON_STROKE = '#000000'

function buildStrokeIcon(paths) {
  return buildSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${ICON_STROKE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${paths}
    </svg>
  `)
}

export const RETENTION_ICON_URLS = {
  verification_document_check: buildStrokeIcon(`
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
    <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
    <path d="m9 15 2 2 4-4"/>
  `),
  secure_approval_badge: buildStrokeIcon(`
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
    <path d="m9 12 2 2 4-4"/>
  `),
  market_growth_chart: buildStrokeIcon(`
    <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
    <path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/>
  `),
  funding_hand_transfer: buildStrokeIcon(`
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/>
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/>
    <path d="m2 16 6 6"/>
    <circle cx="16" cy="9" r="2.9"/>
    <circle cx="6" cy="5" r="3"/>
  `),
  trading_setup_controls: buildStrokeIcon(`
    <path d="M9 5v4"/>
    <rect width="4" height="6" x="7" y="9" rx="1"/>
    <path d="M9 15v2"/>
    <path d="M17 3v2"/>
    <rect width="4" height="8" x="15" y="5" rx="1"/>
    <path d="M17 13v3"/>
    <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
  `),
  onboarding_calendar: buildStrokeIcon(`
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <path d="M3 10h18"/>
    <path d="M8 14h.01"/>
    <path d="M12 14h.01"/>
    <path d="M16 14h.01"/>
    <path d="M8 18h.01"/>
    <path d="M12 18h.01"/>
    <path d="M16 18h.01"/>
  `),
  premium_platform_crown: buildStrokeIcon(`
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/>
    <path d="M5 21h14"/>
  `),
  experience_star: buildStrokeIcon(`
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
  `),
  time_recovery_clock: buildStrokeIcon(`
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  `),
  user_account_profile: buildStrokeIcon(`
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  `),
}

export const RETENTION_ICON_GROUPS = {
  onboarding: [
    'verification_document_check',
    'secure_approval_badge',
    'onboarding_calendar',
    'time_recovery_clock',
  ],
  trading: [
    'market_growth_chart',
    'trading_setup_controls',
    'premium_platform_crown',
    'experience_star',
  ],
  account: ['funding_hand_transfer', 'user_account_profile'],
}

export const RETENTION_ICON_GROUP_LABELS = {
  onboarding: 'Onboarding',
  trading: 'Trading',
  account: 'Account',
}

export const RETENTION_ICON_ORDER = [
  'verification_document_check',
  'secure_approval_badge',
  'market_growth_chart',
  'funding_hand_transfer',
  'trading_setup_controls',
  'onboarding_calendar',
  'premium_platform_crown',
  'experience_star',
  'time_recovery_clock',
  'user_account_profile',
]

export const RETENTION_ICON_CONCEPTS = {
  verification: 'verification_document_check',
  kyc: 'verification_document_check',
  approval: 'secure_approval_badge',
  trust: 'secure_approval_badge',
  security: 'secure_approval_badge',
  market: 'market_growth_chart',
  opportunities: 'market_growth_chart',
  growth: 'market_growth_chart',
  funding: 'funding_hand_transfer',
  deposit: 'funding_hand_transfer',
  cashier: 'funding_hand_transfer',
  trading: 'trading_setup_controls',
  setup: 'trading_setup_controls',
  controls: 'trading_setup_controls',
  risk: 'trading_setup_controls',
  onboarding: 'onboarding_calendar',
  timeline: 'onboarding_calendar',
  orientation: 'onboarding_calendar',
  premium: 'premium_platform_crown',
  vip: 'premium_platform_crown',
  experience: 'experience_star',
  value: 'experience_star',
  time: 'time_recovery_clock',
  momentum: 'time_recovery_clock',
  profile: 'user_account_profile',
  account: 'user_account_profile',
  access: 'user_account_profile',
  support: 'user_account_profile',
}

export const RETENTION_ICON_LIBRARY = {
  verification_document_check: {
    key: 'verification_document_check',
    url: RETENTION_ICON_URLS.verification_document_check,
    label: 'Verification document check',
    category: 'Onboarding',
    usage: 'Use for KYC, document flow, and profile verification steps.',
    hrefBehavior: 'default',
  },
  secure_approval_badge: {
    key: 'secure_approval_badge',
    url: RETENTION_ICON_URLS.secure_approval_badge,
    label: 'Secure approval badge',
    category: 'Onboarding',
    usage: 'Use for approval, security, trust, and verified-account reassurance.',
    hrefBehavior: 'default',
  },
  market_growth_chart: {
    key: 'market_growth_chart',
    url: RETENTION_ICON_URLS.market_growth_chart,
    label: 'Market growth chart',
    category: 'Trading',
    usage: 'Use for market opportunity, growth, and reactivation framing.',
    hrefBehavior: 'default',
  },
  funding_hand_transfer: {
    key: 'funding_hand_transfer',
    url: RETENTION_ICON_URLS.funding_hand_transfer,
    label: 'Funding hand transfer',
    category: 'Account',
    usage: 'Use for funding, deposit, cashier, and payment-route concepts.',
    hrefBehavior: 'deposit',
  },
  trading_setup_controls: {
    key: 'trading_setup_controls',
    url: RETENTION_ICON_URLS.trading_setup_controls,
    label: 'Trading setup controls',
    category: 'Trading',
    usage: 'Use for trading setup, risk control, structure, and first-trade execution.',
    hrefBehavior: 'default',
  },
  onboarding_calendar: {
    key: 'onboarding_calendar',
    url: RETENTION_ICON_URLS.onboarding_calendar,
    label: 'Onboarding calendar',
    category: 'Onboarding',
    usage: 'Use for next-step clarity, timing, milestones, and orientation.',
    hrefBehavior: 'default',
  },
  premium_platform_crown: {
    key: 'premium_platform_crown',
    url: RETENTION_ICON_URLS.premium_platform_crown,
    label: 'Premium platform crown',
    category: 'Trading',
    usage: 'Use for premium, VIP, and higher-tier platform value.',
    hrefBehavior: 'default',
  },
  experience_star: {
    key: 'experience_star',
    url: RETENTION_ICON_URLS.experience_star,
    label: 'Experience star',
    category: 'Trading',
    usage: 'Use for quality of experience, stronger environment, and recognition.',
    hrefBehavior: 'default',
  },
  time_recovery_clock: {
    key: 'time_recovery_clock',
    url: RETENTION_ICON_URLS.time_recovery_clock,
    label: 'Time recovery clock',
    category: 'Onboarding',
    usage: 'Use for timing, urgency, momentum, and quicker re-entry.',
    hrefBehavior: 'default',
  },
  user_account_profile: {
    key: 'user_account_profile',
    url: RETENTION_ICON_URLS.user_account_profile,
    label: 'User account profile',
    category: 'Account',
    usage: 'Use for account, profile, access, and user-guidance concepts.',
    hrefBehavior: 'default',
  },
}
