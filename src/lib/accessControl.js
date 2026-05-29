const ADMIN_EMAILS = new Set(['paolo.v@bullwaves.com'])
const MANAGEMENT_SECTIONS = ['Management Team', 'Management', 'C-Suite', 'Executive']

const TRUSTPILOT_ONLY_USERS = [
  {
    name: 'Ernest Medalla Bautista',
    email: 'ernestmedallabautista96@gmail.com',
    department: 'Philippines Team',
    section: 'Philippines Team',
    title: 'Trustpilot Onboarding',
  },
  {
    email: 'cruiseljohn@gmail.com',
    department: 'Philippines Team',
    section: 'Philippines Team',
    title: 'Trustpilot Onboarding',
  },
  {
    email: 'jhunamae.masayon@gmail.com',
    department: 'Philippines Team',
    section: 'Philippines Team',
    title: 'Trustpilot Onboarding',
  },
  {
    email: 'santiagangelo.tabian@gmail.com',
    department: 'Philippines Team',
    section: 'Philippines Team',
    title: 'Trustpilot Onboarding',
  },
  {
    email: 'nicoangelo.calingasan2@gmail.com',
    department: 'Philippines Team',
    section: 'Philippines Team',
    title: 'Trustpilot Onboarding',
  },
  {
    email: 'kathygracesiva@gmail.com',
    department: 'Philippines Team',
    section: 'Philippines Team',
    title: 'Trustpilot Onboarding',
  },
]

const TRUSTPILOT_ONLY_EMAILS = new Set(
  TRUSTPILOT_ONLY_USERS.map((user) =>
    String(user.email || '')
      .trim()
      .toLowerCase()
  )
)

const SUPPORT_ALLOWED_VIEWS = new Set([
  'home',
  'supportUserCheck',
  'aiAssistant',
  'trustpilotGuide',
  'commissionValidationRules',
  'orgChart',
  'upload',
])

const SALES_ALLOWED_VIEWS = new Set([
  'home',
  'supportUserCheck',
  'aiAssistant',
  'trustpilotGuide',
  'commissionValidationRules',
  'emailMasterTemplate',
  'orgChart',
])

const TRUSTPILOT_ONLY_ALLOWED_VIEWS = new Set(['trustpilotGuide'])

function normalizeEmail(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function humanizeEmailName(email = '') {
  const localPart = String(email || '').split('@')[0] || ''
  if (!localPart) return ''
  return localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function isSalesDepartment(department = '') {
  const d = String(department || '')
    .trim()
    .toLowerCase()
  if (!d) return false
  return d.startsWith('sales') || d.includes('business development')
}

function isManagementSection(section = '') {
  const normalizedSection = String(section || '')
    .trim()
    .toLowerCase()
  if (!normalizedSection) return false
  return MANAGEMENT_SECTIONS.some((value) => normalizedSection.includes(value.toLowerCase()))
}

export function getSpecialAccessUsers() {
  return TRUSTPILOT_ONLY_USERS.map((user) => ({
    name: user.name || humanizeEmailName(user.email),
    email: user.email,
    division: user.division || 'Support',
    department: user.department || 'Philippines Team',
    section: user.section || 'Philippines Team',
    title: user.title || 'Trustpilot Onboarding',
    isManagementTeam: false,
  }))
}

export function augmentAllowlist(users = []) {
  const deduped = new Map()

  users.forEach((user) => {
    const email = normalizeEmail(user?.email)
    if (!email) return
    deduped.set(email, {
      ...user,
      email,
    })
  })

  getSpecialAccessUsers().forEach((user) => {
    const email = normalizeEmail(user.email)
    if (deduped.has(email)) return
    deduped.set(email, user)
  })

  return Array.from(deduped.values())
}

export function getAccessMode(user) {
  const email = normalizeEmail(user?.email)
  if (ADMIN_EMAILS.has(email)) return 'admin'
  if (user?.isManagementTeam || isManagementSection(user?.section)) return 'admin'
  if (TRUSTPILOT_ONLY_EMAILS.has(email)) return 'trustpilotOnly'

  const department = String(user?.department || user?.section || '')
    .trim()
    .toLowerCase()

  if (department === 'support team') return 'support'
  if (isSalesDepartment(department)) return 'sales'
  return 'full'
}

export function getAllowedViewsForAccessMode(mode) {
  if (mode === 'support') return new Set(SUPPORT_ALLOWED_VIEWS)
  if (mode === 'sales') return new Set(SALES_ALLOWED_VIEWS)
  if (mode === 'trustpilotOnly') return new Set(TRUSTPILOT_ONLY_ALLOWED_VIEWS)
  return null
}

export function getLandingViewForAccessMode(mode) {
  if (mode === 'trustpilotOnly') return 'trustpilotGuide'
  return 'home'
}

export function getDeniedViewForAccessMode(mode) {
  if (mode === 'trustpilotOnly') return 'trustpilotGuide'
  if (mode === 'support' || mode === 'sales') return 'supportUserCheck'
  return 'home'
}

export function isAdminEmail(email = '') {
  return ADMIN_EMAILS.has(normalizeEmail(email))
}
