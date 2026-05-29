const WHATSAPP_NUMBER = '35799514794'

const WHATSAPP_TEXT = {
  en: 'Hi Bullwaves, I would like help with the next step on my account.',
  it: 'Ciao Bullwaves, vorrei supporto per il prossimo passo sul mio account.',
}

function getLocalizedSupportUrl(locale = 'en') {
  const normalizedLocale = locale === 'it' ? 'it' : 'en'
  return (
    'https://wa.me/' +
    WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent(WHATSAPP_TEXT[normalizedLocale])
  )
}

export const SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS = {
  cta_url: 'https://portal.bullwaves.com/login',
  account_manager_name: 'The Bullwaves Team',
}

export const sendgridTemplateRegistryGeneratedAt = '2026-05-27T12:03:20.550Z'

export const sendgridTemplateRegistry = {
  'acuity-bullwaves-46-en': {
    en: {
      a: {
        templateId: 'd-374d71b1d6844f1f82079e4914bc7f6e',
        versionId: '2962f245-8578-443a-b713-6e26ce7422ba',
        name: 'Bullwaves Acuity Visual #46',
        subject: 'Key Moves Traders Should Watch This Week',
        timing: null,
        delay: null,
      },
    },
  },
}

export function getSendgridTemplateMapping(localTemplateId, locale = 'en', variant = 'a') {
  return sendgridTemplateRegistry?.[localTemplateId]?.[locale]?.[variant] || null
}

export function buildSendgridDynamicTemplateData(overrides = {}) {
  const locale = overrides?.locale === 'it' ? 'it' : 'en'
  return Object.fromEntries(
    Object.entries({
      ...SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS,
      support_url: overrides?.support_url ?? getLocalizedSupportUrl(locale),
      ...overrides,
    }).filter(([, value]) => value !== undefined)
  )
}
