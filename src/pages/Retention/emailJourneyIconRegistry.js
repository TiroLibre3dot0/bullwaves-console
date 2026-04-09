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

import {
  RETENTION_ICON_GROUP_LABELS,
  RETENTION_ICON_GROUPS,
  RETENTION_ICON_LIBRARY,
  RETENTION_ICON_ORDER,
  RETENTION_ICON_URLS,
} from './icons.js'

const ICON_ALIASES = {
  fasterVerification: 'verification_document_check',
  secureApproval: 'secure_approval_badge',
  marketOpportunities: 'market_growth_chart',
  fundingAccess: 'funding_hand_transfer',
  readyToTrade: 'trading_setup_controls',
  onboardingTimeline: 'onboarding_calendar',
  premiumAccess: 'premium_platform_crown',
  strongerExperience: 'experience_star',
  noTimeLoss: 'time_recovery_clock',
  activateAccount: 'user_account_profile',
}

export const EMAIL_JOURNEY_ICON_URLS = {
  ...RETENTION_ICON_URLS,
  ...Object.fromEntries(
    Object.entries(ICON_ALIASES).map(([aliasKey, canonicalKey]) => [
      aliasKey,
      RETENTION_ICON_URLS[canonicalKey],
    ])
  ),
}

export const EMAIL_MASTER_ICON_GROUPS = RETENTION_ICON_GROUPS
export const EMAIL_MASTER_ICON_ORDER = RETENTION_ICON_ORDER
export const EMAIL_ICON_GROUP_LABELS = RETENTION_ICON_GROUP_LABELS

export const EMAIL_JOURNEY_ICON_LIBRARY = {
  ...RETENTION_ICON_LIBRARY,
  ...Object.fromEntries(
    Object.entries(ICON_ALIASES).map(([aliasKey, canonicalKey]) => {
      const meta = RETENTION_ICON_LIBRARY[canonicalKey]
      return [
        aliasKey,
        {
          ...meta,
          key: aliasKey,
          canonicalKey,
        },
      ]
    })
  ),
}

const EMAIL_ICON_LIBRARY_BY_URL = new Map(
  Object.values(EMAIL_JOURNEY_ICON_LIBRARY).map((entry) => [entry.url, entry])
)

export function getEmailJourneyIconMetaByKey(key) {
  return EMAIL_JOURNEY_ICON_LIBRARY[key] || null
}

export function getEmailJourneyIconMetaByUrl(url) {
  return EMAIL_ICON_LIBRARY_BY_URL.get(url) || null
}

export function getEmailJourneyIconsForGroup(groupKey) {
  const keys = EMAIL_MASTER_ICON_GROUPS[groupKey] || []
  return keys.map((key) => getEmailJourneyIconMetaByKey(key)).filter(Boolean)
}

export function createJourneyIconSelection({
  boxOneKey,
  boxTwoKey,
  boxThreeKey,
  recommendedGroups = [],
  rationale = '',
}) {
  return {
    boxOneIconUrl: EMAIL_JOURNEY_ICON_URLS[boxOneKey] || '',
    boxTwoIconUrl: EMAIL_JOURNEY_ICON_URLS[boxTwoKey] || '',
    boxThreeIconUrl: EMAIL_JOURNEY_ICON_URLS[boxThreeKey] || '',
    iconGuide: {
      boxOneKey,
      boxTwoKey,
      boxThreeKey,
      recommendedGroups,
      rationale,
    },
  }
}
