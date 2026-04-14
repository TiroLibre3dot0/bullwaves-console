import { getEmailJourneyIconMetaByUrl } from './emailJourneyIconRegistry.js'

const WHATSAPP_NUMBER = '35799514794'
const PORTAL_LOGIN_URL = 'https://portal.bullwaves.com/login'
const DEPOSIT_PAGE_URL = 'https://my.bullwaves.global/deposit'
const WHATSAPP_TEXT = {
  en: 'Hi Bullwaves, I would like help with the next step on my account.',
  it: 'Ciao Bullwaves, vorrei supporto per il prossimo passo sul mio account.',
}

function getWhatsAppHref(lang = 'en') {
  const normalizedLang = lang === 'it' ? 'it' : 'en'
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT[normalizedLang])}`
}

function getContextualSupportWhatsAppHref(lang = 'en', context = {}) {
  const normalizedLang = lang === 'it' ? 'it' : 'en'
  const contextLabel = String(
    context?.heroTitle || context?.mainTitle || context?.title || ''
  ).trim()

  if (!contextLabel) return getWhatsAppHref(normalizedLang)

  const message =
    normalizedLang === 'it'
      ? `Ciao Bullwaves, ho bisogno di supporto sulla mail "${contextLabel}". Vorrei aiuto per il prossimo passo sul mio account.`
      : `Hi Bullwaves, I need support regarding the email "${contextLabel}". I would like help with the next step on my account.`

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

function getJourneyIconHref(iconUrl, lang = 'en', context = {}) {
  if (!iconUrl) return ''

  const meta = getEmailJourneyIconMetaByUrl(iconUrl)
  if (meta?.hrefBehavior === 'support') return getContextualSupportWhatsAppHref(lang, context)
  if (meta?.hrefBehavior === 'deposit') return DEPOSIT_PAGE_URL
  return PORTAL_LOGIN_URL
}

function renderStepIcon(iconUrl, href, fallbackLabel) {
  if (!iconUrl) return `<span class="journey-step-icon-fallback">${fallbackLabel}</span>`

  const imageHtml = `<img src="${iconUrl}" alt="" width="24" height="24" class="journey-step-icon-image" />`
  if (!href) return imageHtml

  return `<a href="${href}" class="step-icon-link">${imageHtml}</a>`
}

const DEFAULT_CTA_URL = PORTAL_LOGIN_URL
const SENDGRID_CTA_HREF = `{{insert cta_url "default=${DEFAULT_CTA_URL}"}}`
const SENDGRID_GROUP_UNSUBSCRIBE_RAW_URL = '<%asm_group_unsubscribe_raw_url%>'
const SENDGRID_PREFERENCES_RAW_URL = '<%asm_preferences_raw_url%>'
const SENDGRID_BULLWAVES_ICON_URL =
  'https://cdn.mcauto-images-production.sendgrid.net/c49e37cd579f1c08/60bf128f-a2f3-4d7d-a307-a75921400431/1185x1185.png'
const BULLWAVES_WORDMARK_URL = 'https://bullwaves-console.vercel.app/Group%202087330250.svg'
const STATIC_BULLWAVES_ICON_URL = '/Group%202087330261.svg'

function getBullwavesBrandAssets(mode = 'static') {
  if (mode === 'sendgrid') {
    return {
      iconUrl: SENDGRID_BULLWAVES_ICON_URL,
      wordmarkUrl: BULLWAVES_WORDMARK_URL,
    }
  }

  return {
    iconUrl: STATIC_BULLWAVES_ICON_URL,
    wordmarkUrl: BULLWAVES_WORDMARK_URL,
  }
}

const ITALIAN_TEXT_REPLACEMENTS = [
  [/ÃƒÂ¨/g, 'Ã¨'],
  [/ÃƒÂ/g, 'Ã'],
  [/ÃƒÂ©/g, 'Ã©'],
  [/ÃƒÂ¬/g, 'Ã¬'],
  [/ÃƒÂ²/g, 'Ã²'],
  [/ÃƒÂ¹/g, 'Ã¹'],
  [/ÃƒË†/g, 'Ãˆ'],
  [/Ãƒâ€°/g, 'Ã‰'],
  [/Ã¢â‚¬â„¢/g, "'"],
  [/Ã¢â‚¬Ëœ/g, "'"],
  [/\bc e\b/g, "c'Ã¨"],
  [/\bC e\b/g, "C'Ã¨"],
  [/\be abbastanza\b/g, 'Ã¨ abbastanza'],
  [/\bE abbastanza\b/g, 'Ãˆ abbastanza'],
  [/\b e pronta\b/g, ' Ã¨ pronta'],
  [/\b E pronta\b/g, ' Ãˆ pronta'],
  [/\b e ancora\b/g, ' Ã¨ ancora'],
  [/\b E ancora\b/g, ' Ãˆ ancora'],
  [/\b e ora\b/g, ' Ã¨ ora'],
  [/\b E ora\b/g, ' Ãˆ ora'],
  [/\b si e\b/g, ' si Ã¨'],
  [/\b Si e\b/g, ' Si Ã¨'],
  [/\bl account\b/g, "l'account"],
  [/\bL account\b/g, "L'account"],
  [/\bl area\b/g, "l'area"],
  [/\bL area\b/g, "L'area"],
  [/\bnell area\b/g, "nell'area"],
  [/\bNell area\b/g, "Nell'area"],
  [/\bdall ingresso\b/g, "dall'ingresso"],
  [/\bDall ingresso\b/g, "Dall'ingresso"],
  [/\bl ambiente\b/g, "l'ambiente"],
  [/\bL ambiente\b/g, "L'ambiente"],
  [/\bl engagement\b/g, "l'engagement"],
  [/\bL engagement\b/g, "L'engagement"],
  [/\bl obiettivo\b/g, "l'obiettivo"],
  [/\bL obiettivo\b/g, "L'obiettivo"],
  [/\bl ultimo\b/g, "l'ultimo"],
  [/\bL ultimo\b/g, "L'ultimo"],
  [/\bpiu\b/g, 'piÃ¹'],
  [/\bPiu\b/g, 'PiÃ¹'],
  [/\bpuo\b/g, 'puÃ²'],
  [/\bPuo\b/g, 'PuÃ²'],
  [/\bcosi\b/g, 'cosÃ¬'],
  [/\bCosi\b/g, 'CosÃ¬'],
  [/\bgia\b/g, 'giÃ'],
  [/\bGia\b/g, 'GiÃ'],
  [/\bperche\b/g, 'perchÃ©'],
  [/\bPerche\b/g, 'PerchÃ©'],
  [/\bsocieta\b/g, 'societÃ'],
  [/\bSocieta\b/g, 'SocietÃ'],
  [/\battivita\b/g, 'attivitÃ'],
  [/\bAttivita\b/g, 'AttivitÃ'],
  [/\bpriorita\b/g, 'prioritÃ'],
  [/\bPriorita\b/g, 'PrioritÃ'],
  [/\bcontinuita\b/g, 'continuitÃ'],
  [/\bContinuita\b/g, 'ContinuitÃ'],
  [/\bsemplicita\b/g, 'semplicitÃ'],
  [/\bSemplicita\b/g, 'SemplicitÃ'],
  [/\bidentita\b/g, 'identitÃ'],
  [/\bIdentita\b/g, 'IdentitÃ'],
  [/\bstabilita\b/g, 'stabilitÃ'],
  [/\bStabilita\b/g, 'StabilitÃ'],
  [/\bopportunita\b/g, 'opportunitÃ'],
  [/\bOpportunita\b/g, 'OpportunitÃ'],
  [/\bqualita\b/g, 'qualitÃ'],
  [/\bQualita\b/g, 'QualitÃ'],
  [/\brealta\b/g, 'realtÃ'],
  [/\bRealta\b/g, 'RealtÃ'],
  [/\bvarieta\b/g, 'varietÃ'],
  [/\bVarieta\b/g, 'VarietÃ'],
  [/\bIl tuo account e\b/g, 'Il tuo account Ã¨'],
  [/\bIl tuo profilo e\b/g, 'Il tuo profilo Ã¨'],
  [/\bIl prossimo passo e\b/g, 'Il prossimo passo Ã¨'],
  [/\bLa registrazione e\b/g, 'La registrazione Ã¨'],
  [/\bLa mossa principale e\b/g, 'La mossa principale Ã¨'],
  [/\bLa mossa migliore e\b/g, 'La mossa migliore Ã¨'],
  [/\bQuesto badge non e\b/g, 'Questo badge non Ã¨'],
  [/\bQuesto messaggio esiste perche\b/g, 'Questo messaggio esiste perchÃ©'],
  [/\bQuesto e il ruolo\b/g, 'Questo Ã¨ il ruolo'],
  [/\bIl punto e\b/g, 'Il punto Ã¨'],
  [/\bLa costanza e\b/g, 'La costanza Ã¨'],
  [/\bIl tuo pattern e\b/g, 'Il tuo pattern Ã¨'],
  [/\bCosa ti da\b/g, 'Cosa ti dÃ'],
  [/\bfinche\b/g, 'finchÃ©'],
  [/\bFinche\b/g, 'FinchÃ©'],
  [/\bperche li\b/g, 'perchÃ© lÃ¬'],
  [/\bPerche li\b/g, 'PerchÃ© lÃ¬'],
  [/\bperchÃ© li\b/g, 'perchÃ© lÃ¬'],
  [/\bPerchÃ© li\b/g, 'PerchÃ© lÃ¬'],
  [/\bverso l alto\b/g, "verso l'alto"],
  [/\bVerso l alto\b/g, "Verso l'alto"],
  [/\bun altra\b/g, "un'altra"],
  [/\bUn altra\b/g, "Un'altra"],
  [/\bl abitudine\b/g, "l'abitudine"],
  [/\bL abitudine\b/g, "L'abitudine"],
  [/\bnell interpretare\b/g, "nell'interpretare"],
  [/\bNell interpretare\b/g, "Nell'interpretare"],
  [/\bun interpretazione\b/g, "un'interpretazione"],
  [/\bUn interpretazione\b/g, "Un'interpretazione"],
  [/\bL offerta\b/g, "L'offerta"],
  [/\bl offerta\b/g, "l'offerta"],
  [/\bdell offerta\b/g, "dell'offerta"],
  [/\bl account\b/g, "l'account"],
  [/\bL account\b/g, "L'account"],
  [/\bnell account\b/g, "nell'account"],
  [/\bNell account\b/g, "Nell'account"],
  [/\ball azione\b/g, "all'azione"],
  [/\bAll azione\b/g, "All'azione"],
  [/\bL aiuto\b/g, "L'aiuto"],
  [/\bl aiuto\b/g, "l'aiuto"],
  [/\bdall area\b/g, "dall'area"],
  [/\bDall area\b/g, "Dall'area"],
  [/\bnon e\b/g, 'non Ã¨'],
  [/\bNon e\b/g, 'Non Ã¨'],
  [/\bE un ambiente\b/g, 'Ãˆ un ambiente'],
  [/\bE un meccanismo\b/g, 'Ãˆ un meccanismo'],
  [/\bE continuita\b/g, 'Ãˆ continuitÃ'],
  [/\bE continuitÃ\b/g, 'Ãˆ continuitÃ'],
  [/\bQuesto e il momento\b/g, 'Questo Ã¨ il momento'],
  [/\bIl punto migliore spesso e\b/g, 'Il punto migliore spesso Ã¨'],
  [/\bOra che l account e\b/g, "Ora che l'account Ã¨"],
  [/\bora che l account e\b/g, "ora che l'account Ã¨"],
  [/\bla mossa migliore e\b/g, 'la mossa migliore Ã¨'],
  [/\bLa mossa migliore e\b/g, 'La mossa migliore Ã¨'],
  [/\bIl valore della prima operazione e\b/g, 'Il valore della prima operazione Ã¨'],
  [
    /\bIl supporto resta secondario rispetto all azione\b/g,
    "Il supporto resta secondario rispetto all'azione",
  ],
  [/\bE un rientro chiaro\b/g, 'Ã¨ un rientro chiaro'],
  [/\bil deposito e piu semplice\b/g, 'il deposito Ã¨ piÃ¹ semplice'],
  [/\bIl deposito e piu semplice\b/g, 'Il deposito Ã¨ piÃ¹ semplice'],
  [/\bQuesto loop e\b/g, 'Questo loop Ã¨'],
  [/\bQuesta migrazione e\b/g, 'Questa migrazione Ã¨'],
  [/\bQuesto e il tuo\b/g, 'Questo Ã¨ il tuo'],
  [/\bIl supporto e opzionale\b/g, 'Il supporto Ã¨ opzionale'],
  [/\bIl supporto umano e opzionale\b/g, 'Il supporto umano Ã¨ opzionale'],
  [/\bIl supporto umano e\b/g, 'Il supporto umano Ã¨'],
  [/\bL upgrade\b/g, "L'upgrade"],
  [/\bl upgrade\b/g, "l'upgrade"],
  [/\bl azione\b/g, "l'azione"],
  [/\bL azione\b/g, "L'azione"],
  [/\bda al\b/g, 'dÃ al'],
  [/\be per trader\b/g, 'Ã¨ per trader'],
  [/\bstoria e finita\b/g, 'storia Ã¨ finita'],
  [/\bla mossa giusta e\b/g, 'la mossa giusta Ã¨'],
  [
    /\bIl supporto c'Ã¨ se utile, ma l area cliente viene prima\.\b/g,
    "Il supporto c'Ã¨ se utile, ma l'area cliente viene prima.",
  ],
  [
    /\bIl supporto c'Ã¨ solo se aiuta a sbloccare il ritorno\.\b/g,
    "Il supporto c'Ã¨ solo se aiuta a sbloccare il ritorno.",
  ],
  [
    /\bIl supporto c'Ã¨ se utile, ma la piattaforma deve restare al primo posto\.\b/g,
    "Il supporto c'Ã¨ se utile, ma la piattaforma deve restare al primo posto.",
  ],
  [
    /\bIl supporto c'Ã¨ se utile, ma il passo dopo resta sbloccare l account\.\b/g,
    "Il supporto c'Ã¨ se utile, ma il passo dopo resta sbloccare l'account.",
  ],
  [/\bWhatsApp e\b/g, 'WhatsApp Ã¨'],
  [
    /\bIl tuo comportamento recente ti colloca tra i profili da trattenere con piu attenzione\.\b/g,
    'Il tuo comportamento recente ti colloca tra i profili da trattenere con piÃ¹ attenzione.',
  ],
]

function normalizeLocalizedText(lang, value) {
  if (lang !== 'it' || typeof value !== 'string' || !value) return value

  return ITALIAN_TEXT_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value
  )
}

function getLanguageContent(lang) {
  if (lang === 'it') {
    return {
      legalBrandSubtitle: 'Informazioni normative e avvertenza essenziale sui rischi',
      legalCompanyTitle: 'Informazioni sulla societÃ',
      legalRiskTitle: 'Avvertenza sui rischi',
      legalCompanyCopy:
        'Bullwaves Ã¨ un marchio commerciale utilizzato da piÃ¹ entitÃ autorizzate in diverse giurisdizioni, tra cui Equitex Capital Limited (Registration No. 8434948-1), societÃ autorizzata e regolamentata dalla Financial Services Authority (FSA, licence no. SD185), e Moonance LLC, societÃ regolamentata da MISA nelle Isole Comore.',
      legalRiskCopy:
        'I derivati over-the-counter sono strumenti complessi e comportano un elevato rischio di perdere rapidamente il capitale iniziale a causa della leva finanziaria. Dovresti valutare se comprendi il funzionamento dei derivati over-the-counter e se puoi permetterti di sostenere un livello di rischio cosÃ¬ elevato sul tuo capitale. Investire in derivati over-the-counter comporta rischi significativi e non Ã¨ adatto a tutti gli investitori.',
      unsubscribe: 'Disiscriviti',
      unsubscribePreferences: 'Preferenze di disiscrizione',
      preparedFor: 'Preparato per',
      preparedFallback: 'Preparato per il tuo prossimo passo con Bullwaves',
      greetingWithName: 'Gentile Cliente',
      greetingFallback: 'Gentile Cliente,',
      signatureClosing: 'Cordiali saluti,',
      signatureFallback: 'Il team Bullwaves',
      brandTagline: 'Bonus 100%. Account Manager. AI Tools in arrivo.',
      metricChips: ['Bonus 100%', 'Account Manager', 'AI Tools (presto)'],
      panelTitle: 'PerchÃ© questo passaggio conta adesso',
      offerTitle: 'Cosa puoi attivare oggi',
      offerBody:
        'In questo momento la proposta concreta include bonus 100%, account manager dedicato e accesso prioritario ai trading tools avanzati con intelligenza artificiale in arrivo a breve.',
      ratingLabel: 'Valutazione 4.5',
      logoAlt: 'Logo Bullwaves',
    }
  }

  return {
    legalBrandSubtitle: 'Regulatory information and essential risk notice',
    legalCompanyTitle: 'Company Information',
    legalRiskTitle: 'Risk Disclaimer',
    legalCompanyCopy:
      'Bullwaves is a brand name and trading name used by multiple entities authorised in various jurisdictions, including Equitex Capital Limited (Registration No. 8434948-1), a company authorised and regulated by the Financial Services Authority (FSA, licence no. SD185), and Moonance LLC, a company regulated by MISA in Comoros Island.',
    legalRiskCopy:
      'Over-the-counter derivatives are complex instruments and come with a high risk of losing your initial capital rapidly due to leverage. You should consider whether you understand how over-the-counter derivatives work and whether you can afford to take the high level of risk to your capital. Investing in over-the-counter derivatives carries significant risks and is not suitable for all investors.',
    unsubscribe: 'Unsubscribe',
    unsubscribePreferences: 'Unsubscribe Preferences',
    preparedFor: 'Prepared for',
    preparedFallback: 'Prepared for your next Bullwaves step',
    greetingWithName: 'Dear Valued Client',
    greetingFallback: 'Dear Valued Client,',
    signatureClosing: 'Best regards,',
    signatureFallback: 'The Bullwaves Team',
    brandTagline: '100% Bonus. Account Manager. AI Tools coming soon.',
    metricChips: ['100% Bonus', 'Account Manager', 'AI Tools (soon)'],
    panelTitle: 'Why this step matters now',
    offerTitle: 'What you can activate today',
    offerBody:
      'Right now, the concrete offer includes a 100% bonus, a dedicated account manager, and priority access to advanced AI trading tools launching soon.',
    ratingLabel: 'Rated 4.5',
    logoAlt: 'Bullwaves Logo',
  }
}

function buildLegalFooterHtml(mode, content) {
  const unsubscribeHref = mode === 'sendgrid' ? SENDGRID_GROUP_UNSUBSCRIBE_RAW_URL : '#'
  const unsubscribePreferencesHref = mode === 'sendgrid' ? SENDGRID_PREFERENCES_RAW_URL : '#'
  const { iconUrl } = getBullwavesBrandAssets(mode)

  return `
    <div class="legal-shell">
      <table width="100%" role="presentation" class="legal-brand-table">
        <tr>
          <td width="74" valign="middle" class="legal-brand-logo-cell">
            <div class="legal-logo-badge">
              <img src="${iconUrl}" width="42" alt="${content.logoAlt}" class="legal-logo" />
            </div>
          </td>
          <td valign="middle" class="legal-brand-copy-cell">
            <div class="legal-kicker">Bullwaves</div>
            <div class="legal-brand-title">Bullwaves</div>
            <div class="legal-brand-subtitle">${content.legalBrandSubtitle}</div>
          </td>
        </tr>
      </table>

      <div class="legal-card">
        <div class="legal-section-title">${content.legalCompanyTitle}</div>
        <p class="legal-copy">${content.legalCompanyCopy}</p>
      </div>

      <div class="legal-card legal-card--risk">
        <div class="legal-section-title">${content.legalRiskTitle}</div>
        <p class="legal-copy">${content.legalRiskCopy}</p>
      </div>

      <div class="legal-links">
        <a href="${unsubscribeHref}">${content.unsubscribe}</a>
        <span class="legal-link-divider">Â·</span>
        <a href="${unsubscribePreferencesHref}">${content.unsubscribePreferences}</a>
      </div>
    </div>
  `
}

function buildSendgridSubjectTemplate(subject) {
  return String(subject || '')
    .replace(/\{\{#if\s+first_name\}\}\{\{first_name\}\},?\s*\{\{\/if\}\}/g, '')
    .trim()
}

function buildDefaultSendgridTestData(overrides = {}) {
  const locale = overrides?.locale === 'it' ? 'it' : 'en'
  return {
    cta_url: DEFAULT_CTA_URL,
    support_url: getWhatsAppHref(locale),
    account_manager_name: 'The Bullwaves Team',
    ...overrides,
  }
}

function inferSegmentBucket(templateKey) {
  const key = String(templateKey || '')
    .trim()
    .toLowerCase()
  if (!key) return 'default'
  if (key.startsWith('churned_high_value_')) return 'churned'
  if (key.startsWith('reward_candidates_')) return 'reward'
  if (key.startsWith('rising_')) return 'rising'
  if (key.startsWith('dormant_')) return 'dormant'
  return 'default'
}

function getOfferMessaging(lang, templateKey) {
  const bucket = inferSegmentBucket(templateKey)

  if (lang === 'it') {
    if (bucket === 'churned') {
      return {
        offerTitle: 'Offerta rientro ad alto valore',
        offerBody:
          'Ora puoi valutare una proposta concreta: bonus 100%, account manager dedicato e accesso prioritario ai trading tools avanzati con intelligenza artificiale in arrivo a breve.',
        metricChips: ['Bonus 100%', 'Account Manager', 'AI Tools (presto)'],
      }
    }

    if (bucket === 'reward') {
      return {
        offerTitle: 'Offerta reward concreta',
        offerBody:
          'La base commerciale attivabile oggi include bonus 100% e account manager dedicato; in aggiunta, avrai priorita sui nuovi trading tools avanzati con intelligenza artificiale in uscita a breve.',
        metricChips: ['Bonus 100%', 'Account Manager', 'Priorita AI Tools'],
      }
    }

    if (bucket === 'rising') {
      return {
        offerTitle: 'Offerta per accelerare la crescita',
        offerBody:
          'Per sostenere la fase di crescita, l offerta reale e chiara: bonus 100%, account manager dedicato e accesso prioritario ai trading tools avanzati con intelligenza artificiale in arrivo a breve.',
        metricChips: ['Bonus 100%', 'Manager dedicato', 'AI Tools (coming soon)'],
      }
    }

    if (bucket === 'dormant') {
      return {
        offerTitle: 'Offerta concreta di riattivazione',
        offerBody:
          'Per il tuo ritorno, la proposta reale resta semplice e concreta: bonus 100%, account manager dedicato e accesso prioritario ai trading tools avanzati con intelligenza artificiale in arrivo a breve.',
        metricChips: ['Bonus 100%', 'Account Manager', 'AI Tools (presto)'],
      }
    }

    return {
      offerTitle: 'Cosa puoi attivare oggi',
      offerBody:
        'In questo momento la proposta concreta include bonus 100%, account manager dedicato e accesso prioritario ai trading tools avanzati con intelligenza artificiale in arrivo a breve.',
      metricChips: ['Bonus 100%', 'Account Manager', 'AI Tools (presto)'],
    }
  }

  if (bucket === 'churned') {
    return {
      offerTitle: 'High-value return offer',
      offerBody:
        'You can now review a concrete offer: 100% bonus, a dedicated account manager, and priority access to advanced AI trading tools launching soon.',
      metricChips: ['100% Bonus', 'Account Manager', 'AI Tools (soon)'],
    }
  }

  if (bucket === 'reward') {
    return {
      offerTitle: 'Concrete reward offer',
      offerBody:
        'The practical offer you can activate now includes a 100% bonus and a dedicated account manager, plus priority access to advanced AI trading tools launching soon.',
      metricChips: ['100% Bonus', 'Account Manager', 'AI Tools Priority'],
    }
  }

  if (bucket === 'rising') {
    return {
      offerTitle: 'Growth acceleration offer',
      offerBody:
        'To support your growth phase, the real offer is straightforward: 100% bonus, a dedicated account manager, and priority access to advanced AI trading tools launching soon.',
      metricChips: ['100% Bonus', 'Dedicated Manager', 'AI Tools (soon)'],
    }
  }

  if (bucket === 'dormant') {
    return {
      offerTitle: 'Reactivation offer',
      offerBody:
        'For your return, the practical offer stays clear: 100% bonus, a dedicated account manager, and priority access to advanced AI trading tools launching soon.',
      metricChips: ['100% Bonus', 'Account Manager', 'AI Tools (soon)'],
    }
  }

  return {
    offerTitle: 'What you can activate today',
    offerBody:
      'Right now, the concrete offer includes a 100% bonus, a dedicated account manager, and priority access to advanced AI trading tools launching soon.',
    metricChips: ['100% Bonus', 'Account Manager', 'AI Tools (soon)'],
  }
}

export function buildSegmentEmailHtml(
  {
    lang,
    skin = 'light',
    title,
    eyebrow = '',
    heroTitle,
    heroSubtitle,
    mainTitle,
    introLead,
    bodyOne,
    bodyTwo,
    boxOneTitle,
    boxOneCopy,
    boxOneIconUrl,
    boxTwoTitle,
    boxTwoCopy,
    boxTwoIconUrl,
    boxThreeTitle,
    boxThreeCopy,
    boxThreeIconUrl,
    bodyThree,
    bodyFour,
    ctaLabel,
    ctaUrl,
  },
  options = {}
) {
  const mode = options?.mode === 'sendgrid' ? 'sendgrid' : 'static'
  const templateKey = String(options?.templateKey || '').trim()
  const { wordmarkUrl } = getBullwavesBrandAssets(mode)
  const normalizedSkin = skin === 'dark' ? 'dark' : 'light'
  const isDark = normalizedSkin === 'dark'
  const content = getLanguageContent(lang)
  const normalize = (value) => normalizeLocalizedText(lang, value)
  const normalizedTitle = normalize(title)
  const normalizedEyebrow = normalize(eyebrow)
  const normalizedHeroTitle = normalize(heroTitle)
  const normalizedHeroSubtitle = normalize(heroSubtitle)
  const normalizedMainTitle = normalize(mainTitle)
  const normalizedIntroLead = normalize(introLead)
  const normalizedBodyOne = normalize(bodyOne)
  const normalizedBodyTwo = normalize(bodyTwo)
  const normalizedBoxOneTitle = normalize(boxOneTitle)
  const normalizedBoxOneCopy = normalize(boxOneCopy)
  const normalizedBoxTwoTitle = normalize(boxTwoTitle)
  const normalizedBoxTwoCopy = normalize(boxTwoCopy)
  const normalizedBoxThreeTitle = normalize(boxThreeTitle)
  const normalizedBoxThreeCopy = normalize(boxThreeCopy)
  const normalizedBodyThree = normalize(bodyThree)
  const normalizedBodyFour = normalize(bodyFour)
  const normalizedCtaLabel = normalize(ctaLabel)
  const offerMessaging = getOfferMessaging(lang, templateKey)
  const ctaHref = ctaUrl ? ctaUrl : mode === 'sendgrid' ? SENDGRID_CTA_HREF : DEFAULT_CTA_URL
  const iconContext = {
    title: normalizedTitle,
    heroTitle: normalizedHeroTitle,
    mainTitle: normalizedMainTitle,
  }
  const boxOneHref = getJourneyIconHref(boxOneIconUrl, lang, iconContext)
  const boxTwoHref = getJourneyIconHref(boxTwoIconUrl, lang, iconContext)
  const boxThreeHref = getJourneyIconHref(boxThreeIconUrl, lang, iconContext)
  const eyebrowLabel = normalizedEyebrow || 'Bullwaves'
  const eyebrowHtml = `<div class="minimal-eyebrow">${eyebrowLabel}</div>`
  const greetingLead = `<p class="minimal-copy"><strong>${content.greetingFallback}</strong></p>`
  const signatureName =
    mode === 'sendgrid'
      ? `{{#if account_manager_name}}{{account_manager_name}}{{else}}${content.signatureFallback}{{/if}}`
      : content.signatureFallback
  const legalFooter = buildLegalFooterHtml(mode, content)
  const bodyBackground = isDark ? '#050b15' : '#c9d9ec'
  const wrapperBackground = isDark
    ? 'linear-gradient(180deg, #061123 0%, #0c1c35 100%)'
    : 'radial-gradient(circle at top left, rgba(20, 81, 197, 0.32), transparent 32%), linear-gradient(180deg, #dce8f8 0%, #cfdeef 100%)'
  const containerBackground = isDark ? '#0d1728' : '#ffffff'
  const containerBorder = isDark ? '#2f4b74' : '#9eb8db'
  const containerShadow = isDark
    ? '0 26px 76px rgba(0, 0, 0, 0.52)'
    : '0 26px 76px rgba(6, 23, 44, 0.2)'
  const bodyText = isDark ? '#f3f7ff' : '#071321'
  const copyText = isDark ? '#e7f0ff' : '#0f1d2e'
  const mutedText = isDark ? '#d5e4fb' : '#1f3247'
  const subtleText = isDark ? '#bdd2ef' : '#314a66'
  const titleText = isDark ? '#ffffff' : '#071321'
  const headerBackground = isDark
    ? 'linear-gradient(180deg, #040913 0%, #081b38 45%, #1543ad 100%)'
    : 'linear-gradient(180deg, #081022 0%, #0b1433 45%, #1632b7 100%)'
  const headerText = isDark ? '#f1f7ff' : '#e4eeff'
  const ctaPanelBackground = isDark
    ? 'linear-gradient(180deg, #163053 0%, #19375d 100%)'
    : 'linear-gradient(180deg, #e1ecff 0%, #d6e6ff 100%)'
  const ctaPanelBorder = isDark ? '#5e82bd' : '#8caad1'
  const signatureColor = isDark ? '#d2e2fa' : '#243b57'
  const eyebrowColor = isDark ? '#9ec0ff' : '#2949d4'
  const supportLinkColor = isDark ? '#9ec0ff' : '#2d4bd5'
  const legalShellBackground = isDark
    ? 'linear-gradient(180deg, #142b4a 0%, #122744 100%)'
    : 'linear-gradient(180deg, #e9f1fb 0%, #dfebf9 100%)'
  const legalShellBorder = isDark ? '#5678ad' : '#a7c0dd'
  const legalBrandSeparator = isDark ? '#4e71a8' : '#b4c9e3'
  const legalLogoBadgeBackground = isDark
    ? 'linear-gradient(180deg, #1b3153 0%, #152a47 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #edf3fb 100%)'
  const legalLogoBadgeBorder = isDark ? '#5a7cb2' : '#acc4de'
  const legalKickerColor = isDark ? '#d2e3fb' : '#2d4869'
  const legalBrandTitleColor = isDark ? '#f2f7ff' : '#102033'
  const legalBrandSubtitleColor = isDark ? '#deebff' : '#365677'
  const legalCardBackground = isDark
    ? 'linear-gradient(180deg, #1a355b 0%, #17314f 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #eef5ff 100%)'
  const legalCardBorder = isDark ? '#6389c3' : '#abc3de'
  const legalCardRiskBackground = isDark
    ? 'linear-gradient(180deg, #3a2e1a 0%, #2f2516 100%)'
    : 'linear-gradient(180deg, #fffaf2 0%, #fff2de 100%)'
  const legalCardRiskBorder = isDark ? '#ad8646' : '#d8b171'
  const legalSectionTitleColor = isDark ? '#e4efff' : '#1b3453'
  const legalCopyColor = isDark ? '#e5efff' : '#1f3a59'
  const legalLinksColor = isDark ? '#d0e2ff' : '#2f4e70'
  const legalLinkDividerColor = isDark ? '#aec5e7' : '#587699'
  const legalLinkColor = isDark ? '#b8cdff' : '#2e49c7'
  const primaryTitle = normalizedHeroTitle || normalizedMainTitle || normalizedTitle
  const supportingIntro = normalizedHeroSubtitle || normalizedIntroLead
  const introParagraph =
    normalizedIntroLead && normalizedIntroLead !== supportingIntro ? normalizedIntroLead : ''
  const bodyOneHtml = normalizedBodyOne ? `<p class="minimal-copy">${normalizedBodyOne}</p>` : ''
  const bodyTwoHtml = normalizedBodyTwo
    ? `<p class="minimal-copy minimal-copy--compact"><strong>${normalizedBodyTwo}</strong></p>`
    : ''
  const bodyThreeHtml = normalizedBodyThree
    ? `<p class="minimal-copy minimal-copy--muted">${normalizedBodyThree}</p>`
    : ''
  const offerStripHtml = `
<div class="offer-strip">
  <div class="offer-strip-title">${offerMessaging.offerTitle}</div>
  <p class="offer-strip-copy">${offerMessaging.offerBody}</p>
  <div class="offer-strip-chips">
    ${offerMessaging.metricChips.map((chip) => `<span class="offer-chip">${chip}</span>`).join('')}
  </div>
</div>`

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${mode === 'sendgrid' ? 'Bullwaves' : normalizedTitle}</title>

<style>
  body {
    margin:0;
    padding:0;
    background:${bodyBackground};
    font-family:Arial, Helvetica, sans-serif;
    color:${bodyText};
  }
  table { border-collapse:collapse; }
  .wrapper {
    width:100%;
    background:${wrapperBackground};
  }
  .container {
    width:100%;
    max-width:700px;
    margin:0 auto;
    background:${containerBackground};
    border:1px solid ${containerBorder};
    border-radius:28px;
    overflow:hidden;
    box-shadow:${containerShadow};
  }
  .minimal-header {
    padding:28px;
    background:${headerBackground};
    color:#ffffff;
  }
  .header-logo {
    display:block;
    width:170px;
    max-width:170px;
    border:0;
    filter:brightness(0) invert(1);
  }
  .minimal-brand-line {
    margin-top:8px;
    font-size:11px;
    line-height:15px;
    letter-spacing:0.10em;
    text-transform:uppercase;
    font-weight:700;
    color:${headerText};
  }
  .legal-brand-table {
    width:100%;
    border-collapse:collapse;
  }
  .minimal-body {
    padding:28px;
  }
  .minimal-eyebrow {
    display:inline-block;
    margin:0 0 16px;
    font-size:12px;
    line-height:16px;
    letter-spacing:0.12em;
    text-transform:uppercase;
    font-weight:700;
    color:${eyebrowColor};
  }
  .minimal-title {
    margin:0 0 14px;
    font-size:38px;
    line-height:1.08;
    letter-spacing:-0.04em;
    font-weight:700;
    color:${titleText};
  }
  .minimal-copy {
    margin:0 0 16px;
    font-size:18px;
    line-height:1.7;
    color:${copyText};
  }
  .minimal-copy strong,
  .step-copy strong {
    color:${titleText};
    font-weight:700;
  }
  .minimal-copy--compact {
    margin-bottom:14px;
  }
  .minimal-copy--muted {
    color:${subtleText};
  }
  .minimal-feature-list {
    margin-top:26px;
    display:grid;
    gap:16px;
  }
  .minimal-feature-list + .minimal-copy--muted {
    margin-top:18px;
  }
  .minimal-feature-item {
    display:grid;
    grid-template-columns:34px 1fr;
    gap:14px;
    align-items:start;
  }
  .minimal-feature-icon {
    width:24px;
    height:24px;
    display:block;
    color:${titleText};
    text-align:center;
  }
  .step-icon-link {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    color:inherit !important;
    text-decoration:none;
  }
  .journey-step-icon-image {
    display:block;
    width:24px;
    height:24px;
    object-fit:contain;
  }
  .journey-step-icon-fallback {
    display:inline-block;
    width:24px;
    text-align:center;
    font-size:14px;
    line-height:24px;
    font-weight:700;
    color:${titleText};
  }
  .step-title {
    font-size:16px;
    font-weight:700;
    color:${titleText};
    margin-bottom:6px;
    line-height:1.3;
  }
  .step-copy {
    font-size:15px;
    color:${mutedText};
    line-height:1.7;
  }
  .offer-strip {
    margin:18px 0 0;
    padding:14px 14px 12px;
    border-radius:14px;
    background:${isDark ? 'rgba(30,58,95,0.42)' : 'rgba(30,64,175,0.08)'};
    border:1px solid ${isDark ? '#5f83bd' : '#a6bce0'};
  }
  .offer-strip-title {
    margin:0 0 6px;
    font-size:12px;
    font-weight:800;
    letter-spacing:0.04em;
    text-transform:uppercase;
    color:${titleText};
  }
  .offer-strip-copy {
    margin:0;
    font-size:13px;
    line-height:1.55;
    color:${mutedText};
  }
  .offer-strip-chips {
    margin-top:10px;
    display:flex;
    flex-wrap:wrap;
    gap:6px;
  }
  .offer-chip {
    display:inline-flex;
    align-items:center;
    padding:4px 8px;
    border-radius:999px;
    font-size:10px;
    font-weight:800;
    letter-spacing:0.03em;
    text-transform:uppercase;
    color:${isDark ? '#dbeafe' : '#1e3a8a'};
    background:${isDark ? 'rgba(30,64,175,0.44)' : 'rgba(59,130,246,0.14)'};
    border:1px solid ${isDark ? '#6e93cd' : '#aac4ea'};
  }
  .cta-wrap {
    margin:22px 0 0;
    text-align:center;
    padding:20px 18px;
    border-radius:22px;
    background:${ctaPanelBackground};
    border:1px solid ${ctaPanelBorder};
  }
  .btn {
    display:inline-block;
    background:linear-gradient(135deg, #225ee6 0%, #0c34c0 100%);
    color:#ffffff !important;
    text-decoration:none;
    padding:16px 28px;
    border-radius:999px;
    font-weight:700;
    font-size:15px;
    box-shadow:0 14px 30px rgba(9,43,164,0.36);
  }
  .helper {
    margin-top:12px;
    color:${subtleText};
    font-size:13px;
    line-height:1.6;
  }
  .support-link {
    display:inline-block;
    margin-top:12px;
    color:${supportLinkColor} !important;
    text-decoration:underline;
    font-size:13px;
    font-weight:700;
  }
  .support-helper {
    margin-top:6px;
    color:${subtleText};
    font-size:12px;
    line-height:1.6;
  }
  .signature {
    font-size:14px;
    color:${signatureColor};
    margin-top:18px;
    line-height:1.7;
  }
  .legal {
    padding:0 24px 26px;
  }
  .legal-shell {
    padding:18px;
    border-radius:22px;
    background:${legalShellBackground};
    border:1px solid ${legalShellBorder};
    box-shadow:inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)'};
  }
  .legal-brand-table {
    margin-bottom:16px;
    padding-bottom:14px;
    border-bottom:1px solid ${legalBrandSeparator};
  }
  .legal-brand-logo-cell {
    padding-right:14px;
  }
  .legal-logo-badge {
    width:56px;
    height:56px;
    line-height:56px;
    text-align:center;
    border-radius:18px;
    background:${legalLogoBadgeBackground};
    border:1px solid ${legalLogoBadgeBorder};
    box-shadow:0 10px 24px ${isDark ? 'rgba(0,0,0,0.28)' : 'rgba(21,44,79,0.10)'};
  }
  .legal-logo {
    display:inline-block;
    vertical-align:middle;
    width:34px;
    height:auto;
  }
  .legal-kicker {
    color:${legalKickerColor};
    font-size:10px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:0.12em;
    text-transform:uppercase;
    margin-bottom:5px;
  }
  .legal-brand-title {
    color:${legalBrandTitleColor};
    font-size:18px;
    line-height:1.1;
    font-weight:700;
  }
  .legal-brand-subtitle {
    margin-top:5px;
    color:${legalBrandSubtitleColor};
    font-size:12px;
    line-height:1.55;
  }
  .legal-card {
    padding:15px 17px;
    border-radius:18px;
    background:${legalCardBackground};
    border:1px solid ${legalCardBorder};
    box-shadow:0 8px 18px ${isDark ? 'rgba(0,0,0,0.24)' : 'rgba(21,44,79,0.06)'};
  }
  .legal-card + .legal-card {
    margin-top:12px;
  }
  .legal-card--risk {
    background:${legalCardRiskBackground};
    border-color:${legalCardRiskBorder};
  }
  .legal-section-title {
    color:${legalSectionTitleColor};
    font-size:11px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:0.1em;
    text-transform:uppercase;
    margin-bottom:9px;
  }
  .legal-copy {
    margin:0;
    font-size:11px;
    color:${legalCopyColor};
    line-height:1.68;
  }
  .legal-links {
    margin-top:16px;
    font-size:11px;
    line-height:1.6;
    color:${legalLinksColor};
    text-align:left;
  }
  .legal-link-divider {
    margin:0 6px;
    color:${legalLinkDividerColor};
  }
  .legal a {
    color:${legalLinkColor};
    text-decoration:none;
  }
  @media only screen and (max-width: 620px) {
    .minimal-header { padding:24px 20px; }
    .header-logo { width:152px !important; max-width:152px !important; }
    .minimal-body { padding:24px 20px; }
    .minimal-title { font-size:30px; line-height:1.12; }
    .minimal-copy { font-size:16px; }
    .legal { padding:0 18px 22px; }
    .legal-shell { padding:16px; }
    .legal-brand-table { padding-bottom:12px; }
    .legal-brand-logo-cell { width:68px !important; padding-right:12px; }
    .legal-logo-badge { width:50px; height:50px; line-height:50px; border-radius:16px; }
    .legal-logo { width:30px; }
    .legal-brand-title { font-size:16px; }
    .legal-brand-subtitle { font-size:11px; }
  }
</style>
</head>

<body>
<table width="100%" class="wrapper">
<tr>
<td align="center" style="padding:20px 10px;">

<table class="container" data-skin="${normalizedSkin}">
<tr>
<td class="minimal-header">
  <img src="${wordmarkUrl}" width="170" alt="${content.logoAlt}" class="header-logo" style="display:block; width:170px; max-width:170px; height:auto; border:0; filter:brightness(0) invert(1);" />
  <div class="minimal-brand-line">Bullwaves Client Communication</div>
</td>
</tr>

<tr>
<td class="minimal-body">
${eyebrowHtml}
<h1 class="minimal-title">${primaryTitle}</h1>
${supportingIntro ? `<p class="minimal-copy minimal-copy--muted">${supportingIntro}</p>` : ''}
${greetingLead}
${introParagraph ? `<p class="minimal-copy">${introParagraph}</p>` : ''}
${bodyOneHtml}
${bodyTwoHtml}

<div class="minimal-feature-list">
  <div class="minimal-feature-item">
    <div class="minimal-feature-icon">${renderStepIcon(boxOneIconUrl, boxOneHref, '01')}</div>
    <div>
      <div class="step-title">${normalizedBoxOneTitle}</div>
      <div class="step-copy">${normalizedBoxOneCopy}</div>
    </div>
  </div>
  <div class="minimal-feature-item">
    <div class="minimal-feature-icon">${renderStepIcon(boxTwoIconUrl, boxTwoHref, '02')}</div>
    <div>
      <div class="step-title">${normalizedBoxTwoTitle}</div>
      <div class="step-copy">${normalizedBoxTwoCopy}</div>
    </div>
  </div>
  <div class="minimal-feature-item">
    <div class="minimal-feature-icon">${renderStepIcon(boxThreeIconUrl, boxThreeHref, '03')}</div>
    <div>
      <div class="step-title">${normalizedBoxThreeTitle}</div>
      <div class="step-copy">${normalizedBoxThreeCopy}</div>
    </div>
  </div>
</div>

${bodyThreeHtml}
${offerStripHtml}

<div class="cta-wrap">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center" style="border-radius:999px; background:#1f56f0;">
        <a href="${ctaHref}" class="btn" style="display:inline-block; background:#1f56f0; color:#ffffff !important; text-decoration:none; padding:16px 28px; border-radius:999px; font-weight:700; font-size:15px; line-height:1.2;">${normalizedCtaLabel}</a>
      </td>
    </tr>
  </table>
</div>

<p class="signature">
${content.signatureClosing}<br>
<strong>${signatureName}</strong>
</p>
</td>
</tr>

<tr>
<td class="legal">
${legalFooter}
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>`
}

function makeVariant(spec, templateKey) {
  const lang = spec?.html?.lang || 'en'
  const normalizedDescription = normalizeLocalizedText(lang, spec.description)
  const normalizedSubject = normalizeLocalizedText(lang, spec.subject)
  const iconGuide = spec?.iconGuide || spec?.html?.iconGuide || null

  return {
    name: spec.name,
    description: normalizedDescription,
    subject: normalizedSubject,
    iconGuide,
    html: buildSegmentEmailHtml(spec.html, { templateKey }),
    sendgridSubject: buildSendgridSubjectTemplate(normalizedSubject),
    sendgridHtml: buildSegmentEmailHtml(spec.html, { mode: 'sendgrid', templateKey }),
    sendgridTestData: buildDefaultSendgridTestData({
      locale: lang,
      ...(spec.sendgridTestData || {}),
    }),
  }
}

export function makeLocaleVariants(a, b, templateKey = '') {
  return {
    variants: {
      a: makeVariant(a, templateKey),
      b: makeVariant(b, templateKey),
    },
  }
}
