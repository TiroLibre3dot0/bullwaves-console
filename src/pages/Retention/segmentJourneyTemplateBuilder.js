const WHATSAPP_HREF =
  'https://wa.me/35799514794?text=Hi%20Bullwaves%2C%20I%20would%20like%20help%20with%20the%20next%20step%20on%20my%20account.'

const DEFAULT_CTA_URL = 'https://portal.bullwaves.com/custom/webtrader'
const BULLWAVES_LOGO_URL =
  'http://cdn.mcauto-images-production.sendgrid.net/c49e37cd579f1c08/60bf128f-a2f3-4d7d-a307-a75921400431/1185x1185.png'

function getLanguageContent(lang) {
  if (lang === 'it') {
    return {
      legalBrandSubtitle: 'Informazioni normative e avvertenza essenziale sui rischi',
      legalCompanyTitle: 'Informazioni sulla societa',
      legalRiskTitle: 'Avvertenza sui rischi',
      legalCompanyCopy:
        'Bullwaves e un marchio commerciale utilizzato da piu entita autorizzate in diverse giurisdizioni, tra cui Equitex Capital Limited (Registration No. 8434948-1), societa autorizzata e regolamentata dalla Financial Services Authority (FSA, licence no. SD185), e Moonance LLC, societa regolamentata da MISA nelle Isole Comore.',
      legalRiskCopy:
        'I derivati over-the-counter sono strumenti complessi e comportano un elevato rischio di perdere rapidamente il capitale iniziale a causa della leva finanziaria. Dovresti valutare se comprendi il funzionamento dei derivati over-the-counter e se puoi permetterti di sostenere un livello di rischio cosi elevato sul tuo capitale. Investire in derivati over-the-counter comporta rischi significativi e non e adatto a tutti gli investitori.',
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
      panelTitle: 'Perche questo passaggio conta adesso',
      ratingLabel: 'Valutazione 4.5',
      footerNote:
        'Questo footer resta fisso nel master template per mantenere coerenti logo, note legali e avvertenze sui rischi.',
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
    footerNote:
      'This footer stays fixed across the master template so logo, legal and risk notices remain consistent.',
    logoAlt: 'Bullwaves Logo',
  }
}

function buildLegalFooterHtml(mode, content) {
  const unsubscribeHref = mode === 'sendgrid' ? '{{{unsubscribe}}}' : '#'
  const unsubscribePreferencesHref = mode === 'sendgrid' ? '{{{unsubscribe_preferences}}}' : '#'

  return `
    <div class="legal-shell">
      <div class="legal-brand-row">
        <img src="${BULLWAVES_LOGO_URL}" width="54" alt="${content.logoAlt}" class="legal-logo" />
        <div class="legal-brand-copy">
          <div class="legal-brand-title">Bullwaves</div>
          <div class="legal-brand-subtitle">${content.legalBrandSubtitle}</div>
        </div>
      </div>

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
  return {
    first_name: 'Alex',
    cta_url: DEFAULT_CTA_URL,
    support_url: WHATSAPP_HREF,
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
  const normalizedSkin = skin === 'dark' ? 'dark' : 'light'
  const isDark = normalizedSkin === 'dark'
  const content = getLanguageContent(lang)
  const ctaHref = mode === 'sendgrid' ? '{{cta_url}}' : DEFAULT_CTA_URL
  const supportHref = mode === 'sendgrid' ? '{{support_url}}' : WHATSAPP_HREF
  const eyebrowHtml = eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''
  const personalMarker =
    mode === 'sendgrid'
      ? `<div class="hero-personal">{{#if first_name}}${content.preparedFor} {{first_name}}{{else}}${content.preparedFallback}{{/if}}</div>`
      : ''
  const greetingLead =
    mode === 'sendgrid'
      ? `<p class="greeting">{{#if first_name}}${content.greetingWithName} {{first_name}},{{else}}${content.greetingFallback}{{/if}}</p>`
      : ''
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
  const brandBarBackground = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
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
  const logoBarBackground = isDark
    ? 'linear-gradient(180deg, #12233a 0%, #102033 100%)'
    : 'linear-gradient(180deg, #f8fbff 0%, #eff5ff 100%)'
  const logoBarBorder = isDark ? '#223754' : '#dbe5f3'
  const logoBarTitleColor = isDark ? '#f5f8fe' : '#102033'
  const logoBarNoteColor = isDark ? '#a8bdd4' : '#62758c'

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>

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
    max-width:620px;
    margin:0 auto;
    background:${containerBackground};
    border-radius:24px;
    overflow:hidden;
    box-shadow:${containerShadow};
  }
  .hero-shell {
    padding:26px 28px;
    background:${heroShellBackground};
  }
  .hero-card {
    border-radius:20px;
    padding:20px 20px 18px;
    background:${heroCardBackground};
    border:1px solid ${heroCardBorder};
  }
  .brand-bar {
    display:flex;
    align-items:center;
    gap:14px;
    padding:14px 16px;
    border-radius:18px;
    background:${brandBarBackground};
    border:1px solid ${brandBarBorder};
  }
  .brand-logo {
    display:block;
    width:54px;
    height:auto;
    flex:0 0 auto;
  }
  .brand-copy {
    min-width:0;
  }
  .brand-name {
    color:#ffffff;
    font-size:18px;
    line-height:1.1;
    font-weight:700;
    letter-spacing:0.02em;
  }
  .brand-tagline {
    margin-top:4px;
    color:#dbe8ff;
    font-size:11px;
    line-height:1.4;
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
    margin-top:16px;
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
    margin:12px 0 0;
    font-size:26px;
    line-height:1.14;
    font-weight:700;
  }
  .hero-subtitle {
    color:#dbe8ff;
    margin:8px 0 0;
    font-size:13px;
    line-height:1.52;
  }
  .hero-metrics {
    margin-top:14px;
  }
  .metric-chip {
    display:inline-block;
    margin:0 6px 6px 0;
    padding:8px 13px;
    border-radius:999px;
    background:${metricChipBackground};
    border:1px solid ${metricChipBorder};
    color:${metricChipText};
    font-size:10px;
    line-height:1;
    font-weight:700;
    letter-spacing:0.04em;
    text-transform:uppercase;
  }
  .pad {
    padding:28px 24px 22px;
  }
  .main-title {
    font-size:20px;
    line-height:1.3;
    font-weight:700;
    color:${mainTitleColor};
    margin:0 0 12px;
  }
  .lead {
    font-size:14px;
    line-height:1.62;
    color:${leadText};
    margin:0 0 14px;
  }
  .greeting {
    font-size:14px;
    line-height:1.5;
    color:${bodyText};
    font-weight:700;
    margin:0 0 10px;
  }
  .body-copy {
    font-size:13px;
    line-height:1.62;
    color:${bodyCopy};
    margin:0 0 10px;
  }
  .highlight-panel {
    margin:20px 0;
    padding:18px;
    border-radius:18px;
    background:${panelBackground};
    border:1px solid ${panelBorder};
  }
  .panel-title {
    font-size:11px;
    color:${panelTitle};
    text-transform:uppercase;
    letter-spacing:0.08em;
    font-weight:700;
    margin:0 0 14px;
  }
  .mini-steps td {
    width:33.33%;
    vertical-align:top;
    padding:0 4px;
  }
  .step-card {
    border-radius:18px;
    background:${stepCardBackground};
    border:1px solid ${stepCardBorder};
    box-shadow:${stepCardShadow};
    padding:18px 12px 16px;
    min-height:138px;
  }
  .step-icon {
    width:56px;
    height:56px;
    line-height:56px;
    text-align:center;
    border-radius:18px;
    margin:0 auto 12px;
    background:${stepIconBackground};
    border:1px solid ${stepIconBorder};
    box-shadow:${stepIconShadow};
    color:#23486f;
    font-size:18px;
    font-weight:700;
    overflow:hidden;
  }
  .step-icon img {
    display:block;
    width:32px;
    height:32px;
    margin:11px auto;
    object-fit:contain;
  }
  .step-title {
    font-size:12px;
    font-weight:700;
    color:${stepTitleColor};
    margin-bottom:5px;
    text-align:center;
    line-height:1.3;
  }
  .step-copy {
    font-size:11px;
    color:${stepCopyColor};
    line-height:1.4;
    text-align:center;
  }
  .cta-wrap {
    margin:24px 0 8px;
    text-align:center;
    padding:20px 18px;
    border-radius:20px;
    background:linear-gradient(180deg, #0c1830 0%, #11254b 100%);
  }
  .btn {
    display:inline-block;
    background:linear-gradient(135deg, #2e79ff 0%, #0f39dd 100%);
    color:#ffffff !important;
    text-decoration:none;
    padding:15px 24px;
    border-radius:999px;
    font-weight:700;
    font-size:14px;
    box-shadow:0 14px 30px rgba(15,57,221,0.28);
  }
  .helper {
    margin-top:10px;
    font-size:11px;
    line-height:1.45;
    color:#c8d8f8;
  }
  .secondary-link {
    display:inline-block;
    margin-top:12px;
    color:#ffffff !important;
    text-decoration:none;
    font-size:12px;
    font-weight:700;
    opacity:0.82;
  }
  .secondary-helper {
    margin-top:6px;
    font-size:10px;
    line-height:1.45;
    color:#91a9d2;
  }
  .rating {
    margin-top:14px;
    font-size:13px;
    color:#f7fbff;
  }
  .signature {
    font-size:13px;
    color:${signatureColor};
    margin-top:22px;
    line-height:1.65;
  }
  .logo-bar {
    margin-top:24px;
    padding:18px;
    border-radius:18px;
    background:${logoBarBackground};
    border:1px solid ${logoBarBorder};
    display:flex;
    align-items:center;
    gap:14px;
  }
  .logo-bar-copy {
    min-width:0;
  }
  .logo-bar-title {
    color:${logoBarTitleColor};
    font-size:16px;
    line-height:1.15;
    font-weight:700;
  }
  .logo-bar-note {
    margin-top:4px;
    color:${logoBarNoteColor};
    font-size:12px;
    line-height:1.55;
  }
  .legal {
    padding:0 24px 26px;
  }
  .legal-shell {
    padding:18px;
    border-radius:20px;
    background:linear-gradient(180deg, #f5f8fc 0%, #edf3fa 100%);
    border:1px solid #d8e2ef;
  }
  .legal-brand-row {
    display:flex;
    align-items:center;
    gap:12px;
    margin-bottom:16px;
  }
  .legal-logo {
    display:block;
    width:54px;
    height:auto;
    flex:0 0 auto;
  }
  .legal-brand-title {
    color:#102033;
    font-size:16px;
    line-height:1.15;
    font-weight:700;
  }
  .legal-brand-subtitle {
    margin-top:4px;
    color:#62758c;
    font-size:12px;
    line-height:1.5;
  }
  .legal-card {
    padding:14px 16px;
    border-radius:16px;
    background:#ffffff;
    border:1px solid #dde6f2;
  }
  .legal-card + .legal-card {
    margin-top:12px;
  }
  .legal-card--risk {
    background:linear-gradient(180deg, #fffaf2 0%, #fff5e7 100%);
    border-color:#f3dfb7;
  }
  .legal-section-title {
    color:#102033;
    font-size:11px;
    line-height:1.2;
    font-weight:700;
    letter-spacing:0.08em;
    text-transform:uppercase;
    margin-bottom:8px;
  }
  .legal-copy {
    margin:0;
    font-size:11px;
    color:#6f8093;
    line-height:1.62;
  }
  .legal-links {
    margin-top:14px;
    font-size:11px;
    line-height:1.6;
    color:#6f8093;
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
    .hero-shell { padding:18px 16px; }
    .hero-card { padding:18px 16px 16px; }
    .hero-title { font-size:21px; line-height:1.16; }
    .hero-subtitle { font-size:12px; line-height:1.45; }
    .hero-metrics { margin-top:12px; }
    .pad { padding:24px 18px 18px; }
    .legal { padding:0 18px 22px; }
    .mini-steps td { display:block; width:100%; padding:0 0 8px; }
    .step-card { min-height:auto; }
    .brand-bar,
    .logo-bar,
    .legal-brand-row { align-items:flex-start; }
    .brand-logo,
    .legal-logo { width:48px; }
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
    <div class="brand-bar">
      <img src="${BULLWAVES_LOGO_URL}" alt="${content.logoAlt}" class="brand-logo" />
      <div class="brand-copy">
        <div class="brand-name">Bullwaves</div>
        <div class="brand-tagline">${content.brandTagline}</div>
      </div>
    </div>
    ${eyebrowHtml}
    ${personalMarker}
    <div class="hero-grid">
      <h1 class="hero-title">${heroTitle}</h1>
      <p class="hero-subtitle">${heroSubtitle}</p>
    </div>
    <div class="hero-metrics">
      <span class="metric-chip">${content.metricChips[0]}</span>
      <span class="metric-chip">${content.metricChips[1]}</span>
      <span class="metric-chip">${content.metricChips[2]}</span>
    </div>
  </div>
</td>
</tr>

<tr>
<td class="pad">
${greetingLead}
<p class="main-title">${mainTitle}</p>
<p class="lead">${introLead}</p>
<p class="body-copy">${bodyOne}</p>
<p class="body-copy">${bodyTwo}</p>

<div class="highlight-panel">
  <p class="panel-title">${content.panelTitle}</p>
  <table width="100%" class="mini-steps">
    <tr>
      <td>
        <div class="step-card">
          <div class="step-icon">${boxOneIconUrl ? `<img src="${boxOneIconUrl}" alt="" />` : '01'}</div>
          <div class="step-title">${boxOneTitle}</div>
          <div class="step-copy">${boxOneCopy}</div>
        </div>
      </td>
      <td>
        <div class="step-card">
          <div class="step-icon">${boxTwoIconUrl ? `<img src="${boxTwoIconUrl}" alt="" />` : '02'}</div>
          <div class="step-title">${boxTwoTitle}</div>
          <div class="step-copy">${boxTwoCopy}</div>
        </div>
      </td>
      <td>
        <div class="step-card">
          <div class="step-icon">${boxThreeIconUrl ? `<img src="${boxThreeIconUrl}" alt="" />` : '03'}</div>
          <div class="step-title">${boxThreeTitle}</div>
          <div class="step-copy">${boxThreeCopy}</div>
        </div>
      </td>
    </tr>
  </table>
</div>

<p class="body-copy">${bodyThree}</p>
<p class="body-copy">${bodyFour}</p>

<div class="cta-wrap">
  <a href="${ctaHref}" class="btn">${ctaLabel}</a>
  <div class="helper">${ctaHelper}</div>
  <a href="${supportHref}" class="secondary-link">${supportLabel}</a>
  <div class="secondary-helper">${supportHelper}</div>
  <div class="rating"><strong>${content.ratingLabel}</strong> <span style="color:#ffd15c;">★★★★☆</span></div>
</div>

<p class="signature">
${content.signatureClosing}<br>
<strong>${signatureName}</strong>
</p>

<div class="logo-bar">
  <img src="${BULLWAVES_LOGO_URL}" width="54" alt="${content.logoAlt}" />
  <div class="logo-bar-copy">
    <div class="logo-bar-title">Bullwaves</div>
    <div class="logo-bar-note">${content.footerNote}</div>
  </div>
</div>
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
  return {
    name: spec.name,
    description: spec.description,
    subject: spec.subject,
    html: buildSegmentEmailHtml(spec.html),
    sendgridSubject: buildSendgridSubjectTemplate(spec.subject),
    sendgridHtml: buildSegmentEmailHtml(spec.html, { mode: 'sendgrid' }),
    sendgridTestData: buildDefaultSendgridTestData(spec.sendgridTestData),
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
