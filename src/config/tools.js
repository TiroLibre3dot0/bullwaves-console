// Shared list of console tools (same links as the Bullwaves logo menu in Topbar)

export const CONSOLE_TOOLS = [
  {
    key: 'qlik',
    name: 'Creolabs · Qlik Cloud',
    href: 'https://login.qlik.com/login?state=hKFo2SBsNGtYOEs4eXM0MTQyal9qZlZZd2JxVUxGRTNvOFk4eKFupWxvZ2luo3RpZNkgSTRORnUzNW5iSl9YR2NXVTZmQ0pKV1VkeVVJeXZFMDSjY2lk2SBQRjVZa0Nhem9qUGQ2OGhHVGhXVHhMNk4wcWw3RUVKYQ&client=PF5YkCazojPd68hGThWTxL6N0ql7EEJa&protocol=oauth2&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fqlk6ufzb2vk9dn9.uk.qlikcloud.com%2Flogin%2Fcallback&nonce=cMBZFdQmCwCyxd61Cz3Ios9DY-kDPwRIHfL0PgmmhYU&code_challenge=hHRAyjfogYyP8cEyDbZGNxEG8OiGaRulBWTmBBqH-G0&code_challenge_method=S256',
  },
  {
    key: 'trading_platform',
    name: 'Trading Platform',
    href: 'https://trading-platform-self-two.vercel.app/trade',
  },
  {
    key: 'cellxpert',
    name: 'CellXpert · Affiliate Hub',
    href: 'https://partner.trackingaffiliates.com/v2/login/admin-login/',
  },
  {
    key: 'skale_crm',
    name: 'Skale CRM · Console',
    href: 'https://bul934907.skalecrm.com/index.php',
  },
  {
    key: 'skale_brand_manager',
    name: 'Skale App · Brand Manager',
    href: 'https://fbom.skaleapps.io/company-management/brands',
  },
  {
    key: 'brokeree',
    name: 'Brokeree · Social Trading',
    href: 'http://77.76.9.111:8080/admin/',
  },
  {
    key: 'bullwavesprime',
    name: 'BullwavesPrime · Prop Admin',
    href: 'https://bwpadmin.bullwaves.com/login',
  },
]

const BY_KEY = new Map(CONSOLE_TOOLS.map((t) => [t.key, t]))

export function getConsoleToolByKey(key) {
  return BY_KEY.get(String(key || '').trim()) || null
}

export function findConsoleToolByToken(token) {
  const raw = String(token || '').trim()
  if (!raw) return null
  const lower = raw.toLowerCase()

  // direct key match
  if (BY_KEY.has(lower)) return BY_KEY.get(lower)

  // common aliases
  if (lower === 'trading' || lower === 'platform' || lower === 'trading platform') return BY_KEY.get('trading_platform')
  if (lower === 'cx' || lower === 'cell expert' || lower === 'cellexpert' || lower === 'affiliate hub') return BY_KEY.get('cellxpert')
  if (lower === 'qlik cloud' || lower === 'qlik') return BY_KEY.get('qlik')
  if (lower === 'skale' || lower === 'skale crm') return BY_KEY.get('skale_crm')
  if (lower === 'brand manager' || lower === 'skale app') return BY_KEY.get('skale_brand_manager')
  if (lower === 'brokeree') return BY_KEY.get('brokeree')
  if (lower === 'bwp' || lower === 'bullwavesprime') return BY_KEY.get('bullwavesprime')

  // name fuzzy contains
  for (const tool of CONSOLE_TOOLS) {
    if (tool.name.toLowerCase().includes(lower)) return tool
  }

  return null
}
