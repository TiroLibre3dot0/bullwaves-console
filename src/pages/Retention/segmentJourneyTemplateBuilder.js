const WHATSAPP_NUMBER = '35799514794'
const WHATSAPP_TEXT = {
  en: 'Hi Bullwaves, I would like help with the next step on my account.',
  it: 'Ciao Bullwaves, vorrei supporto per il prossimo passo sul mio account.',
}

function getWhatsAppHref(lang = 'en') {
  const normalizedLang = lang === 'it' ? 'it' : 'en'
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT[normalizedLang])}`
}

const DEFAULT_CTA_URL = 'https://portal.bullwaves.com/custom/webtrader'
const SENDGRID_BULLWAVES_ICON_URL =
  'https://cdn.mcauto-images-production.sendgrid.net/c49e37cd579f1c08/60bf128f-a2f3-4d7d-a307-a75921400431/1185x1185.png'
const SENDGRID_BULLWAVES_WORDMARK_URL = 'https://bullwaves-console.vercel.app/Logo.png'
const STATIC_BULLWAVES_ICON_URL = '/Group%202087330261.svg'
const STATIC_BULLWAVES_WORDMARK_URL = '/Group%202087330250.svg'

function getBullwavesBrandAssets(mode = 'static') {
  if (mode === 'sendgrid') {
    return {
      iconUrl: SENDGRID_BULLWAVES_ICON_URL,
      wordmarkUrl: SENDGRID_BULLWAVES_WORDMARK_URL,
    }
  }

  return {
    iconUrl: STATIC_BULLWAVES_ICON_URL,
    wordmarkUrl: STATIC_BULLWAVES_WORDMARK_URL,
  }
}

const ITALIAN_TEXT_REPLACEMENTS = [
  [/\bc e\b/g, "c'è"],
  [/\bC e\b/g, "C'è"],
  [/\be abbastanza\b/g, 'è abbastanza'],
  [/\bE abbastanza\b/g, 'È abbastanza'],
  [/\b e pronta\b/g, ' è pronta'],
  [/\b E pronta\b/g, ' È pronta'],
  [/\b e ancora\b/g, ' è ancora'],
  [/\b E ancora\b/g, ' È ancora'],
  [/\b e ora\b/g, ' è ora'],
  [/\b E ora\b/g, ' È ora'],
  [/\b si e\b/g, ' si è'],
  [/\b Si e\b/g, ' Si è'],
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
  [/\bpiu\b/g, 'più'],
  [/\bPiu\b/g, 'Più'],
  [/\bpuo\b/g, 'può'],
  [/\bPuo\b/g, 'Può'],
  [/\bcosi\b/g, 'così'],
  [/\bCosi\b/g, 'Così'],
  [/\bgia\b/g, 'già'],
  [/\bGia\b/g, 'Già'],
  [/\bperche\b/g, 'perché'],
  [/\bPerche\b/g, 'Perché'],
  [/\bsocieta\b/g, 'società'],
  [/\bSocieta\b/g, 'Società'],
  [/\battivita\b/g, 'attività'],
  [/\bAttivita\b/g, 'Attività'],
  [/\bpriorita\b/g, 'priorità'],
  [/\bPriorita\b/g, 'Priorità'],
  [/\bcontinuita\b/g, 'continuità'],
  [/\bContinuita\b/g, 'Continuità'],
  [/\bsemplicita\b/g, 'semplicità'],
  [/\bSemplicita\b/g, 'Semplicità'],
  [/\bidentita\b/g, 'identità'],
  [/\bIdentita\b/g, 'Identità'],
  [/\bstabilita\b/g, 'stabilità'],
  [/\bStabilita\b/g, 'Stabilità'],
  [/\bopportunita\b/g, 'opportunità'],
  [/\bOpportunita\b/g, 'Opportunità'],
  [/\bqualita\b/g, 'qualità'],
  [/\bQualita\b/g, 'Qualità'],
  [/\brealta\b/g, 'realtà'],
  [/\bRealta\b/g, 'Realtà'],
  [/\bvarieta\b/g, 'varietà'],
  [/\bVarieta\b/g, 'Varietà'],
  [/\bIl tuo account e\b/g, 'Il tuo account è'],
  [/\bIl tuo profilo e\b/g, 'Il tuo profilo è'],
  [/\bIl prossimo passo e\b/g, 'Il prossimo passo è'],
  [/\bLa registrazione e\b/g, 'La registrazione è'],
  [/\bLa mossa principale e\b/g, 'La mossa principale è'],
  [/\bLa mossa migliore e\b/g, 'La mossa migliore è'],
  [/\bQuesto badge non e\b/g, 'Questo badge non è'],
  [/\bQuesto messaggio esiste perche\b/g, 'Questo messaggio esiste perché'],
  [/\bQuesto e il ruolo\b/g, 'Questo è il ruolo'],
  [/\bIl punto e\b/g, 'Il punto è'],
  [/\bLa costanza e\b/g, 'La costanza è'],
  [/\bIl tuo pattern e\b/g, 'Il tuo pattern è'],
  [/\bCosa ti da\b/g, 'Cosa ti dà'],
  [/\bfinche\b/g, 'finché'],
  [/\bFinche\b/g, 'Finché'],
  [/\bperche li\b/g, 'perché lì'],
  [/\bPerche li\b/g, 'Perché lì'],
  [/\bperché li\b/g, 'perché lì'],
  [/\bPerché li\b/g, 'Perché lì'],
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
  [/\bnon e\b/g, 'non è'],
  [/\bNon e\b/g, 'Non è'],
  [/\bE un ambiente\b/g, 'È un ambiente'],
  [/\bE un meccanismo\b/g, 'È un meccanismo'],
  [/\bE continuita\b/g, 'È continuità'],
  [/\bE continuità\b/g, 'È continuità'],
  [/\bQuesto e il momento\b/g, 'Questo è il momento'],
  [/\bIl punto migliore spesso e\b/g, 'Il punto migliore spesso è'],
  [/\bOra che l account e\b/g, "Ora che l'account è"],
  [/\bora che l account e\b/g, "ora che l'account è"],
  [/\bla mossa migliore e\b/g, 'la mossa migliore è'],
  [/\bLa mossa migliore e\b/g, 'La mossa migliore è'],
  [/\bIl valore della prima operazione e\b/g, 'Il valore della prima operazione è'],
  [
    /\bIl supporto resta secondario rispetto all azione\b/g,
    "Il supporto resta secondario rispetto all'azione",
  ],
  [/\bE un rientro chiaro\b/g, 'è un rientro chiaro'],
  [/\bil deposito e piu semplice\b/g, 'il deposito è più semplice'],
  [/\bIl deposito e piu semplice\b/g, 'Il deposito è più semplice'],
  [/\bQuesto loop e\b/g, 'Questo loop è'],
  [/\bQuesta migrazione e\b/g, 'Questa migrazione è'],
  [/\bQuesto e il tuo\b/g, 'Questo è il tuo'],
  [/\bIl supporto e opzionale\b/g, 'Il supporto è opzionale'],
  [/\bIl supporto umano e opzionale\b/g, 'Il supporto umano è opzionale'],
  [/\bIl supporto umano e\b/g, 'Il supporto umano è'],
  [/\bL upgrade\b/g, "L'upgrade"],
  [/\bl upgrade\b/g, "l'upgrade"],
  [/\bl azione\b/g, "l'azione"],
  [/\bL azione\b/g, "L'azione"],
  [/\bda al\b/g, 'dà al'],
  [/\be per trader\b/g, 'è per trader'],
  [/\bstoria e finita\b/g, 'storia è finita'],
  [/\bla mossa giusta e\b/g, 'la mossa giusta è'],
  [
    /\bIl supporto c'è se utile, ma l area cliente viene prima\.\b/g,
    "Il supporto c'è se utile, ma l'area cliente viene prima.",
  ],
  [
    /\bIl supporto c'è solo se aiuta a sbloccare il ritorno\.\b/g,
    "Il supporto c'è solo se aiuta a sbloccare il ritorno.",
  ],
  [
    /\bIl supporto c'è se utile, ma la piattaforma deve restare al primo posto\.\b/g,
    "Il supporto c'è se utile, ma la piattaforma deve restare al primo posto.",
  ],
  [
    /\bIl supporto c'è se utile, ma il passo dopo resta sbloccare l account\.\b/g,
    "Il supporto c'è se utile, ma il passo dopo resta sbloccare l'account.",
  ],
  [/\bWhatsApp e\b/g, 'WhatsApp è'],
  [
    /\bIl tuo comportamento recente ti colloca tra i profili da trattenere con piu attenzione\.\b/g,
    'Il tuo comportamento recente ti colloca tra i profili da trattenere con più attenzione.',
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
      legalCompanyTitle: 'Informazioni sulla società',
      legalRiskTitle: 'Avvertenza sui rischi',
      legalCompanyCopy:
        'Bullwaves è un marchio commerciale utilizzato da più entità autorizzate in diverse giurisdizioni, tra cui Equitex Capital Limited (Registration No. 8434948-1), società autorizzata e regolamentata dalla Financial Services Authority (FSA, licence no. SD185), e Moonance LLC, società regolamentata da MISA nelle Isole Comore.',
      legalRiskCopy:
        'I derivati over-the-counter sono strumenti complessi e comportano un elevato rischio di perdere rapidamente il capitale iniziale a causa della leva finanziaria. Dovresti valutare se comprendi il funzionamento dei derivati over-the-counter e se puoi permetterti di sostenere un livello di rischio così elevato sul tuo capitale. Investire in derivati over-the-counter comporta rischi significativi e non è adatto a tutti gli investitori.',
      unsubscribe: 'Disiscriviti',
      unsubscribePreferences: 'Preferenze di disiscrizione',
      preparedFor: 'Preparato per',
      preparedFallback: 'Preparato per il tuo prossimo passo con Bullwaves',
      greetingWithName: 'Ciao',
      greetingFallback: 'Buongiorno,',
      signatureClosing: 'Cordiali saluti,',
      signatureFallback: 'Il team Bullwaves',
      brandTagline: 'Accesso sicuro. Supporto reale.',
      metricChips: ['Sicurezza', 'Accesso', 'Supporto'],
      panelTitle: 'Perché questo passaggio conta adesso',
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
    greetingWithName: 'Hi',
    greetingFallback: 'Hello,',
    signatureClosing: 'Best regards,',
    signatureFallback: 'The Bullwaves Team',
    brandTagline: 'Secure access. Real support.',
    metricChips: ['Security', 'Access', 'Support'],
    panelTitle: 'Why this step matters now',
    ratingLabel: 'Rated 4.5',
    logoAlt: 'Bullwaves Logo',
  }
}

function buildLegalFooterHtml(mode, content) {
  const unsubscribeHref = mode === 'sendgrid' ? '{{{unsubscribe}}}' : '#'
  const unsubscribePreferencesHref = mode === 'sendgrid' ? '{{{unsubscribe_preferences}}}' : '#'
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
        <span class="legal-link-divider">·</span>
        <a href="${unsubscribePreferencesHref}">${content.unsubscribePreferences}</a>
      </div>
    </div>
  `
}

function buildSendgridSubjectTemplate(subject) {
  return `{{#if first_name}}{{first_name}}, {{/if}}${subject}`
}

function buildDefaultSendgridTestData(overrides = {}) {
  const locale = overrides?.locale === 'it' ? 'it' : 'en'
  return {
    first_name: 'Alex',
    cta_url: DEFAULT_CTA_URL,
    support_url: getWhatsAppHref(locale),
    account_manager_name: 'The Bullwaves Team',
    ...overrides,
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
    ctaHelper,
    supportLabel,
    supportHelper,
  },
  options = {}
) {
  const mode = options?.mode === 'sendgrid' ? 'sendgrid' : 'static'
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
  const normalizedCtaHelper = normalize(ctaHelper)
  const normalizedSupportLabel = normalize(supportLabel)
  const normalizedSupportHelper = normalize(supportHelper)
  const ctaHref = mode === 'sendgrid' ? '{{cta_url}}' : DEFAULT_CTA_URL
  const supportHref = mode === 'sendgrid' ? '{{support_url}}' : getWhatsAppHref(lang)
  const eyebrowHtml = ''
  const personalMarker = mode === 'sendgrid' ? '' : ''
  const greetingLead = ''
  const signatureName =
    mode === 'sendgrid'
      ? `{{#if account_manager_name}}{{account_manager_name}}{{else}}${content.signatureFallback}{{/if}}`
      : content.signatureFallback
  const legalFooter = buildLegalFooterHtml(mode, content)
  const bodyBackground = isDark ? '#07111f' : '#eef2f8'
  const wrapperBackground = isDark
    ? 'radial-gradient(circle at top left, rgba(91,155,255,0.12), transparent 32%), linear-gradient(180deg, #07111f 0%, #0c1728 100%)'
    : 'radial-gradient(circle at top left, rgba(18,67,255,0.12), transparent 32%), linear-gradient(180deg, #eef2f8 0%, #e8eef7 100%)'
  const containerBackground = isDark ? '#0e1b2f' : '#ffffff'
  const containerShadow = isDark
    ? '0 28px 80px rgba(2,8,20,0.44)'
    : '0 28px 80px rgba(16,32,51,0.14)'
  const heroShellBackground = isDark
    ? 'radial-gradient(circle at top right, rgba(91,155,255,0.22), transparent 28%), linear-gradient(135deg, #040b16 0%, #0d1a2f 42%, #163865 100%)'
    : 'radial-gradient(circle at top right, rgba(90,170,255,0.32), transparent 28%), linear-gradient(135deg, #081a33 0%, #1036d1 56%, #2e79ff 100%)'
  const heroCardBackground = isDark
    ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))'
  const heroCardBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)'
  const brandBarBackground = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)'
  const brandBarBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)'
  const bodyText = isDark ? '#e7eef8' : '#102033'
  const leadText = isDark ? '#cbd7e8' : '#30465e'
  const bodyCopy = isDark ? '#b6c5d8' : '#47607a'
  const panelBackground = isDark
    ? 'linear-gradient(180deg, #12243b 0%, #102032 100%)'
    : 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)'
  const panelBorder = isDark ? '#223754' : '#dce8f8'
  const panelTitle = isDark ? '#9fb6d4' : '#5d738c'
  const metricChipBackground = isDark ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.94)'
  const metricChipBorder = isDark ? 'rgba(177,202,232,0.28)' : 'rgba(138,169,210,0.24)'
  const metricChipText = isDark ? '#17304f' : '#27486f'
  const mainTitleColor = isDark ? '#f5f8fe' : '#102033'
  const stepCardBackground = '#ffffff'
  const stepCardBorder = isDark ? '#d6e1ee' : '#dfe8f2'
  const stepCardShadow = isDark
    ? '0 12px 28px rgba(2,8,20,0.18)'
    : '0 12px 28px rgba(16,32,51,0.08)'
  const stepIconBackground = '#ffffff'
  const stepIconBorder = isDark ? '#d7e3f1' : '#dce7f4'
  const stepIconShadow = isDark
    ? '0 12px 24px rgba(9,22,42,0.12)'
    : '0 12px 24px rgba(31,58,94,0.10)'
  const stepTitleColor = '#102033'
  const stepCopyColor = '#597087'
  const signatureColor = isDark ? '#b6c5d8' : '#556b82'

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
    font-family:Verdana, Geneva, sans-serif;
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
    border-radius:24px;
    overflow:hidden;
    box-shadow:${containerShadow};
  }
  .hero-shell {
    padding:22px 26px;
    background:${heroShellBackground};
  }
  .hero-card {
    border-radius:20px;
    padding:24px 22px 20px;
    background:${heroCardBackground};
    border:1px solid ${heroCardBorder};
    text-align:center;
  }
  .brand-bar {
    width:100%;
    padding:0;
    background:transparent;
    border:none;
  }
  .brand-bar-table,
  .legal-brand-table {
    width:100%;
    border-collapse:collapse;
  }
  .brand-logo-cell,
  .legal-brand-logo-cell {
    padding-right:12px;
  }
  .brand-center {
    text-align:center;
  }
  .brand-stage {
    display:inline-block;
    width:100%;
    max-width:340px;
    padding:16px 22px 14px;
    border-radius:22px;
    background:linear-gradient(180deg, rgba(7,19,44,0.24) 0%, rgba(43,100,228,0.12) 100%);
    border:1px solid rgba(255,255,255,0.12);
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 28px rgba(3,10,26,0.12);
  }
  .brand-lockup {
    width:100%;
    max-width:220px;
    margin:0 auto;
  }
  .brand-logo {
    display:block;
    width:100%;
    height:auto;
    margin:0 auto;
    filter:drop-shadow(0 14px 24px rgba(4,12,30,0.28));
  }
  .eyebrow {
    display:inline-block;
    margin-top:16px;
    padding:7px 12px;
    border-radius:999px;
    background:rgba(255,255,255,0.16);
    color:#d9e6ff;
    font-size:11px;
    font-weight:700;
    letter-spacing:0.08em;
    text-transform:uppercase;
  }
  .hero-grid {
    margin-top:18px;
    max-width:520px;
    margin-left:auto;
    margin-right:auto;
  }
  .hero-personal {
    margin-top:14px;
    color:#f7fbff;
    font-size:11px;
    font-weight:700;
    letter-spacing:0.04em;
    text-transform:uppercase;
  }
  .hero-title {
    color:#ffffff;
    margin:0;
    font-size:34px;
    line-height:1.06;
    font-weight:700;
  }
  .hero-subtitle {
    color:#dbe8ff;
    margin:12px 0 0;
    font-size:16px;
    line-height:1.48;
  }
  .pad {
    padding:28px 30px 22px;
    text-align:center;
  }
  .main-title {
    font-size:22px;
    line-height:1.26;
    font-weight:700;
    color:${mainTitleColor};
    margin:0 auto 12px;
    max-width:520px;
  }
  .lead {
    font-size:15px;
    line-height:1.62;
    color:${leadText};
    margin:0 auto 18px;
    max-width:520px;
  }
  .greeting {
    font-size:15px;
    line-height:1.55;
    color:${bodyText};
    font-weight:700;
    margin:0 0 12px;
  }
  .body-copy {
    font-size:15px;
    line-height:1.72;
    color:${bodyCopy};
    margin:0 0 12px;
  }
  .highlight-panel {
    margin:22px 0;
    padding:18px 18px 14px;
    border-radius:20px;
    background:${panelBackground};
    border:1px solid ${panelBorder};
    text-align:left;
  }
  .mini-steps td {
    width:33.33%;
    vertical-align:top;
    padding:0 8px;
  }
  .step-card {
    border-radius:20px;
    background:${stepCardBackground};
    border:1px solid ${stepCardBorder};
    box-shadow:${stepCardShadow};
    padding:24px 18px 20px;
    min-height:198px;
  }
  .step-icon {
    width:108px;
    height:108px;
    line-height:108px;
    text-align:center;
    border-radius:30px;
    margin:0 auto 16px;
    background:${stepIconBackground};
    border:1px solid ${stepIconBorder};
    box-shadow:${stepIconShadow};
    color:#23486f;
    font-size:24px;
    font-weight:700;
    overflow:hidden;
  }
  .step-icon img {
    display:block;
    width:72px;
    height:72px;
    margin:18px auto;
    object-fit:contain;
  }
  .step-title {
    font-size:15px;
    font-weight:700;
    color:${stepTitleColor};
    margin-bottom:6px;
    text-align:center;
    line-height:1.3;
  }
  .step-copy {
    font-size:13px;
    color:${stepCopyColor};
    line-height:1.5;
    text-align:center;
  }
  .cta-wrap {
    margin:22px 0 8px;
    text-align:center;
    padding:18px 18px;
    border-radius:22px;
    background:linear-gradient(180deg, #0c1830 0%, #11254b 100%);
  }
  .btn {
    display:inline-block;
    background:linear-gradient(135deg, #2e79ff 0%, #0f39dd 100%);
    color:#ffffff !important;
    text-decoration:none;
    padding:16px 28px;
    border-radius:999px;
    font-weight:700;
    font-size:15px;
    box-shadow:0 14px 30px rgba(15,57,221,0.28);
  }
  .secondary-link {
    display:none;
    margin-top:12px;
    color:#ffffff !important;
    text-decoration:none;
    font-size:13px;
    font-weight:700;
    opacity:0.82;
  }
  .signature {
    font-size:14px;
    color:${signatureColor};
    margin-top:24px;
    line-height:1.7;
  }
  .legal {
    padding:0 24px 26px;
  }
  .legal-shell {
    padding:18px;
    border-radius:22px;
    background:linear-gradient(180deg, #f7fafd 0%, #eef4fb 100%);
    border:1px solid #d9e4f1;
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.65);
  }
  .legal-brand-table {
    margin-bottom:16px;
    padding-bottom:14px;
    border-bottom:1px solid #dde7f2;
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
    background:linear-gradient(180deg, #ffffff 0%, #f3f7fd 100%);
    border:1px solid #d7e3f0;
    box-shadow:0 10px 24px rgba(21,44,79,0.08);
  }
  .legal-logo {
    display:inline-block;
    vertical-align:middle;
    width:34px;
    height:auto;
  }
  .legal-kicker {
    color:#5d7390;
    font-size:10px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:0.12em;
    text-transform:uppercase;
    margin-bottom:5px;
  }
  .legal-brand-title {
    color:#102033;
    font-size:18px;
    line-height:1.1;
    font-weight:700;
  }
  .legal-brand-subtitle {
    margin-top:5px;
    color:#667b93;
    font-size:12px;
    line-height:1.55;
  }
  .legal-card {
    padding:15px 17px;
    border-radius:18px;
    background:linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
    border:1px solid #dde7f3;
    box-shadow:0 8px 18px rgba(21,44,79,0.04);
  }
  .legal-card + .legal-card {
    margin-top:12px;
  }
  .legal-card--risk {
    background:linear-gradient(180deg, #fffaf2 0%, #fff4e5 100%);
    border-color:#f1ddb5;
  }
  .legal-section-title {
    color:#20344f;
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
    color:#6b7f95;
    line-height:1.68;
  }
  .legal-links {
    margin-top:16px;
    font-size:11px;
    line-height:1.6;
    color:#73869c;
    text-align:left;
  }
  .legal-link-divider {
    margin:0 6px;
    color:#93a4b7;
  }
  .legal a {
    color:#3c5fe0;
    text-decoration:none;
  }
  @media only screen and (max-width: 620px) {
    .hero-shell { padding:16px 14px; }
    .hero-card { padding:16px 14px 14px; }
    .hero-title { font-size:26px; line-height:1.12; }
    .hero-subtitle { font-size:14px; line-height:1.52; }
    .pad { padding:26px 18px 18px; }
    .legal { padding:0 18px 22px; }
    .mini-steps td { display:block; width:100%; padding:0 0 8px; }
    .step-card { min-height:auto; }
    .brand-stage { max-width:270px; padding:14px 18px 12px; border-radius:20px; }
    .brand-lockup { max-width:188px; }
    .brand-logo { width:100%; }
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
<td class="hero-shell">
  <div class="hero-card">
    <div class="brand-bar brand-center">
      <div class="brand-stage">
        <div class="brand-lockup">
          <img src="${wordmarkUrl}" width="220" alt="${content.logoAlt}" class="brand-logo" />
        </div>
      </div>
    </div>
    ${eyebrowHtml}
    ${personalMarker}
    <div class="hero-grid">
      <h1 class="hero-title">${normalizedHeroTitle}</h1>
    </div>
  </div>
</td>
</tr>

<tr>
<td class="pad">
${greetingLead}
<p class="main-title">${normalizedMainTitle}</p>
<p class="lead">${normalizedIntroLead}</p>
<div class="highlight-panel">
  <table width="100%" class="mini-steps">
    <tr>
      <td>
        <div class="step-card">
          <div class="step-icon">${boxOneIconUrl ? `<img src="${boxOneIconUrl}" alt="" width="72" height="72" />` : '01'}</div>
          <div class="step-title">${normalizedBoxOneTitle}</div>
          <div class="step-copy">${normalizedBoxOneCopy}</div>
        </div>
      </td>
      <td>
        <div class="step-card">
          <div class="step-icon">${boxTwoIconUrl ? `<img src="${boxTwoIconUrl}" alt="" width="72" height="72" />` : '02'}</div>
          <div class="step-title">${normalizedBoxTwoTitle}</div>
          <div class="step-copy">${normalizedBoxTwoCopy}</div>
        </div>
      </td>
      <td>
        <div class="step-card">
          <div class="step-icon">${boxThreeIconUrl ? `<img src="${boxThreeIconUrl}" alt="" width="72" height="72" />` : '03'}</div>
          <div class="step-title">${normalizedBoxThreeTitle}</div>
          <div class="step-copy">${normalizedBoxThreeCopy}</div>
        </div>
      </td>
    </tr>
  </table>
</div>

<div class="cta-wrap">
  <a href="${ctaHref}" class="btn">${normalizedCtaLabel}</a>
  <a href="${supportHref}" class="secondary-link">${normalizedSupportLabel}</a>
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

function makeVariant(spec) {
  const lang = spec?.html?.lang || 'en'
  const normalizedDescription = normalizeLocalizedText(lang, spec.description)
  const normalizedSubject = normalizeLocalizedText(lang, spec.subject)

  return {
    name: spec.name,
    description: normalizedDescription,
    subject: normalizedSubject,
    html: buildSegmentEmailHtml(spec.html),
    sendgridSubject: buildSendgridSubjectTemplate(normalizedSubject),
    sendgridHtml: buildSegmentEmailHtml(spec.html, { mode: 'sendgrid' }),
    sendgridTestData: buildDefaultSendgridTestData({
      locale: lang,
      ...(spec.sendgridTestData || {}),
    }),
  }
}

export function makeLocaleVariants(a, b) {
  return {
    variants: {
      a: makeVariant(a),
      b: makeVariant(b),
    },
  }
}
