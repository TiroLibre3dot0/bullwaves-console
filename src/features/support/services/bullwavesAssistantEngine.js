const CONTACTS = {
  support: 'support@bullwaves.com',
  compliance: 'compliance@bullwaves.com',
  partners: 'partners@bullwaves.com',
  prime: 'prime@bullwaves.com',
}

const QUICK_REPLIES = {
  en: [
    'How do I open a live account?',
    'How do I verify my account?',
    'How can I deposit?',
    'What is Bullwaves Prime?',
    'When can I request my first payout?',
  ],
  it: [
    'Come apro un conto live?',
    'Come verifico il mio account?',
    'Come posso depositare?',
    "Che cos'è Bullwaves Prime?",
    'Quando posso richiedere il primo payout?',
  ],
}

const UI_COPY = {
  en: {
    title: 'Bullwaves AI Assistant',
    eyebrow: 'Support Workspace',
    badge: 'WhatsApp-ready support logic',
    subtitle:
      'A native support chat for Bullwaves Broker and Bullwaves Prime. It keeps answers short, separates Broker from Prime, and escalates sensitive cases instead of inventing rules.',
    chips: [
      'Auto language detection',
      'Broker / Prime split',
      'Safe escalations',
      'No financial advice',
    ],
    inputPlaceholder: 'Ask about registration, KYC, MT5, Prime challenge, payouts, or partners…',
    send: 'Send',
    typing: 'Bullwaves AI Assistant is typing',
    inputHint: 'Press Enter to send. Use Shift+Enter for a new line.',
    railPolicyTitle: 'Operating rules',
    railPolicyText:
      'This assistant helps with general support topics only. It will not give financial advice, confirm account-specific outcomes, or invent unclear Prime rules.',
    railEscalationTitle: 'Escalate when needed',
    railEscalations: [
      'EA, bots, automation, trade copiers, and mirrored setups',
      'Rule breaches, payout disputes, failed challenge appeals',
      'Restricted countries, compliance, KYC, deposits, or withdrawals tied to a specific account',
    ],
    railContactsTitle: 'Routing contacts',
    contacts: {
      support: 'General support',
      compliance: 'Compliance / complaints',
      partners: 'Partners / IB / affiliates',
      prime: 'Prime team',
    },
    welcome:
      "Hi, I'm Bullwaves AI Assistant. I can help with Bullwaves Broker and Bullwaves Prime in English or Italian. Ask me a question and I'll keep the answer short and safe.",
    clarify:
      'I can help, but I need a bit more context. Is your question about Bullwaves Broker or Bullwaves Prime?',
  },
  it: {
    title: 'Bullwaves AI Assistant',
    eyebrow: 'Workspace Support',
    badge: 'Logica supporto pronta per WhatsApp',
    subtitle:
      'Una chat di supporto nativa per Bullwaves Broker e Bullwaves Prime. Mantiene risposte brevi, separa Broker da Prime e fa escalation nei casi sensibili invece di inventare regole.',
    chips: [
      'Rilevamento automatico lingua',
      'Split Broker / Prime',
      'Escalation sicure',
      'Nessuna consulenza finanziaria',
    ],
    inputPlaceholder:
      'Fai una domanda su registrazione, KYC, MT5, challenge Prime, payout o partner…',
    send: 'Invia',
    typing: 'Bullwaves AI Assistant sta scrivendo',
    inputHint: 'Premi Invio per inviare. Usa Shift+Invio per andare a capo.',
    railPolicyTitle: 'Regole operative',
    railPolicyText:
      'Questo assistente aiuta solo su temi di supporto generale. Non fornisce consulenza finanziaria, non conferma esiti account-specific e non inventa regole Prime non chiare.',
    railEscalationTitle: 'Quando fare escalation',
    railEscalations: [
      'EA, bot, automazioni, trade copier e setup di trading specchiato',
      'Violazioni regole, dispute payout, challenge fallite e richieste di review',
      'Paesi soggetti a restrizioni, compliance, KYC, depositi o prelievi legati a un account specifico',
    ],
    railContactsTitle: 'Contatti di routing',
    contacts: {
      support: 'Supporto generale',
      compliance: 'Compliance / reclami',
      partners: 'Partner / IB / affiliati',
      prime: 'Team Prime',
    },
    welcome:
      'Ciao, sono Bullwaves AI Assistant. Posso aiutarti su Bullwaves Broker e Bullwaves Prime in inglese o italiano. Fai pure una domanda e ti risponderò in modo breve e sicuro.',
    clarify:
      'Posso aiutarti, ma mi serve un po’ più di contesto. La tua domanda riguarda Bullwaves Broker oppure Bullwaves Prime?',
  },
}

const RESPONSE_LIBRARY = {
  whatIsBullwaves: {
    en: 'Bullwaves is a multi-asset broker with MT5, MT5 Web Trader, and 24/7 support. It also offers account types such as Classic, VIP, and ECN.',
    it: 'Bullwaves è un broker multi-asset con MT5, MT5 Web Trader e supporto 24/7. Offre anche conti come Classic, VIP ed ECN.',
  },
  whatIsPrime: {
    en: 'Bullwaves Prime is the prop and challenge side of the business. Traders can buy an evaluation, complete the challenge, and potentially move to a funded stage.',
    it: 'Bullwaves Prime è il lato prop e challenge del business. I trader possono acquistare una valutazione, completare la challenge e potenzialmente passare alla fase funded.',
  },
  brokerVsPrime: {
    en: 'Bullwaves Broker is for live or demo trading accounts, deposits, verification, MT5, and account support. Bullwaves Prime is for challenges, funded accounts, drawdown, payouts, and challenge rules.',
    it: 'Bullwaves Broker riguarda conti live o demo, depositi, verifica, MT5 e supporto account. Bullwaves Prime riguarda challenge, account funded, drawdown, payout e regole della challenge.',
  },
  registration: {
    en: 'Go to Bullwaves, click Open Live Account, complete your details, verify your email, and then log in to the dashboard. If you want, I can guide you step by step.',
    it: 'Vai su Bullwaves, clicca su Open Live Account, completa i tuoi dati, verifica l’email e poi accedi alla dashboard. Posso anche guidarti passo passo.',
  },
  login: {
    en: 'Use the same email and password you created during registration to log in from the Bullwaves portal. If you did not receive the verification email, please check spam or contact support.',
    it: 'Usa la stessa email e password create durante la registrazione per accedere dal portale Bullwaves. Se non hai ricevuto l’email di verifica, controlla spam o contatta il supporto.',
  },
  deposit: {
    en: 'Log in to your dashboard, open the balance section, click Deposit, choose the account, enter the amount, and select the payment method. Bullwaves materials mention card options and bank transfer.',
    it: 'Accedi alla dashboard, apri la sezione del saldo, clicca su Deposit, scegli il conto, inserisci l’importo e seleziona il metodo di pagamento. Nei materiali Bullwaves compaiono carta e bonifico bancario.',
  },
  depositMethods: {
    en: 'Bullwaves materials mention Visa, Mastercard, credit card options, and bank transfer. Bank transfer is usually described as taking around 3 to 5 business days.',
    it: 'Nei materiali Bullwaves compaiono Visa, Mastercard, opzioni con carta di credito e bonifico bancario. Il bonifico viene in genere descritto come pari a circa 3-5 giorni lavorativi.',
  },
  verification: {
    en: 'Usually you need a valid ID and a proof of residence. Examples include passport or ID card, plus a recent utility bill or bank statement.',
    it: 'In genere servono un documento di identità valido e una prova di residenza. Per esempio passaporto o carta d’identità, più una bolletta recente o un estratto conto.',
  },
  verificationRejected: {
    en: `For account-specific verification issues, support should review your case directly. Please contact ${CONTACTS.support} or the live chat so they can check your documents safely.`,
    it: `Per problemi di verifica legati al tuo account, il supporto deve controllare il caso direttamente. Contatta ${CONTACTS.support} o la live chat così potranno verificare i documenti in sicurezza.`,
  },
  accountTypes: {
    en: 'Bullwaves presents Classic, VIP, and ECN account types. The Classic account is positioned for beginners, while VIP and ECN are aimed at more experienced traders.',
    it: 'Bullwaves presenta conti Classic, VIP ed ECN. Il conto Classic è posizionato per principianti, mentre VIP ed ECN sono pensati per trader più esperti.',
  },
  platforms: {
    en: 'Bullwaves offers MetaTrader 5, including MT5 Web Trader. Bullwaves Prime also uses MT5 for its challenge and funded environment.',
    it: 'Bullwaves offre MetaTrader 5, incluso MT5 Web Trader. Anche Bullwaves Prime usa MT5 per l’ambiente challenge e funded.',
  },
  partner: {
    en: `Bullwaves has a partnership program with CPA, IB, revenue share, and hybrid models. For partner onboarding or exact terms, you can contact ${CONTACTS.partners}.`,
    it: `Bullwaves ha un programma partnership con modelli CPA, IB, revenue share e ibridi. Per onboarding partner o termini esatti, puoi contattare ${CONTACTS.partners}.`,
  },
  supportContacts: {
    en: `For general support you can use ${CONTACTS.support}. Complaints and compliance requests can be routed to ${CONTACTS.compliance}, while partner questions can go to ${CONTACTS.partners}.`,
    it: `Per supporto generale puoi usare ${CONTACTS.support}. Reclami e richieste compliance possono essere inviati a ${CONTACTS.compliance}, mentre le domande partner possono andare a ${CONTACTS.partners}.`,
  },
  challengeSizes: {
    en: 'Bullwaves Prime challenge sizes mentioned are $10,000, $25,000, $50,000, $100,000, and $200,000. Prime materials also mention MT5, unlimited evaluation time, and a minimum of 15 trading days.',
    it: 'Le challenge Bullwaves Prime menzionate sono da 10.000$, 25.000$, 50.000$, 100.000$ e 200.000$. I materiali Prime citano anche MT5, tempo illimitato per la valutazione e minimo 15 giorni di trading.',
  },
  tradingDays: {
    en: 'Prime materials mention a minimum of 15 separate trading days. A trading day counts when a position is opened, even if it is later closed on the same day.',
    it: 'I materiali Prime menzionano un minimo di 15 giorni di trading separati. Un giorno di trading conta quando viene aperta una posizione, anche se poi viene chiusa nello stesso giorno.',
  },
  profitTarget: {
    en: 'Bullwaves Prime materials mention an 8% target for step 1 and 5% for step 2 in the 2-step model, while the 1-step model is described with a 10% target. If you want, I can also explain the difference between the two formats.',
    it: 'I materiali Bullwaves Prime menzionano un target dell’8% per step 1 e del 5% per step 2 nel modello 2-step, mentre il modello 1-step viene descritto con target del 10%. Se vuoi, posso anche spiegarti la differenza tra i due formati.',
  },
  leverage: {
    en: 'Bullwaves Prime materials mention 1:50 leverage for all accounts. For account-specific confirmation, the Prime team should verify your exact setup.',
    it: 'I materiali Bullwaves Prime menzionano leva 1:50 per tutti i conti. Per una conferma legata al tuo account, il team Prime dovrebbe verificare il setup esatto.',
  },
  drawdown: {
    en: 'Prime materials mention 5% daily and 10% total drawdown for the 2-step model, and 4% daily plus 8% total drawdown for the 1-step model. For rule-sensitive scenarios, the Prime team should confirm the exact calculation on your account.',
    it: 'I materiali Prime menzionano 5% giornaliero e 10% totale di drawdown per il modello 2-step, e 4% giornaliero più 8% totale per l’1-step. Per scenari sensibili legati alle regole, il team Prime dovrebbe confermare il calcolo esatto sul tuo account.',
  },
  weekendHolding: {
    en: 'Prime materials state that holding positions over the weekend is allowed, and simulated crypto trading is also available during the weekend. For rule-sensitive cases, the Prime team can confirm your exact scenario.',
    it: 'I materiali Prime indicano che mantenere posizioni nel weekend è consentito, e che il trading simulato crypto è disponibile anche nel weekend. Per casi sensibili legati alle regole, il team Prime può confermare il tuo scenario esatto.',
  },
  payoutMethods: {
    en: 'Prime materials mention payouts by bank wire or USDT-ERC20, with a minimum payout of $50. Bank wire is described with a flat $30 fee.',
    it: 'I materiali Prime menzionano payout tramite bonifico bancario o USDT-ERC20, con payout minimo di 50$. Il bonifico viene descritto con una commissione fissa di 30$.',
  },
  firstPayout: {
    en: 'Bullwaves Prime materials mention first payout eligibility after 15 days from the first trade for 1-step and after 5 days for 2-step. For account-specific confirmation, the Prime team should verify your case.',
    it: 'I materiali Bullwaves Prime indicano l’idoneità al primo payout dopo 15 giorni dal primo trade per la 1-step e dopo 5 giorni per la 2-step. Per una conferma legata al tuo account, il team Prime dovrebbe verificare il tuo caso.',
  },
  payoutTiming: {
    en: 'Prime materials indicate payout review and processing in around 2 to 5 business days. All positions should be closed before the payout request is made.',
    it: 'I materiali Prime indicano revisione e processamento payout in circa 2-5 giorni lavorativi. Tutte le posizioni dovrebbero essere chiuse prima della richiesta payout.',
  },
  primeKyc: {
    en: 'Before the funded stage, Bullwaves Prime requires KYC with a valid ID and proof of address. Activation after verification is described as taking roughly 48 business hours to 3 business days.',
    it: 'Prima della fase funded, Bullwaves Prime richiede KYC con documento valido e prova di indirizzo. L’attivazione dopo la verifica viene descritta come pari a circa 48 ore lavorative fino a 3 giorni lavorativi.',
  },
  restrictedCountries: {
    en: `Some countries are restricted for Bullwaves Prime, including the United States and other prohibited jurisdictions mentioned in the materials. For compliance eligibility, the safest option is to confirm directly with the Prime team at ${CONTACTS.prime}.`,
    it: `Alcuni paesi sono soggetti a restrizioni per Bullwaves Prime, inclusi gli Stati Uniti e altre giurisdizioni proibite menzionate nei materiali. Per l’idoneità compliance, l’opzione più sicura è confermare direttamente con il team Prime su ${CONTACTS.prime}.`,
  },
  accountSpecificDeposit: {
    en: `I can help with the general deposit flow, but for an account-specific deposit or withdrawal issue the support team should review it directly. Please contact ${CONTACTS.support} or live chat so they can check your case safely.`,
    it: `Posso aiutarti con il flusso generale di deposito, ma per un problema di deposito o prelievo legato al tuo account il team di supporto deve controllarlo direttamente. Contatta ${CONTACTS.support} o la live chat così potranno verificare il caso in sicurezza.`,
  },
  automation: {
    en: `This is a rule-sensitive topic. For cases involving EAs, bots, automation, or trade copiers, the safest option is to have the Prime team confirm your exact setup before you proceed at ${CONTACTS.prime}.`,
    it: `Questo è un tema sensibile dal punto di vista delle regole. Per casi che riguardano EA, bot, automazioni o trade copier, la scelta più sicura è far confermare il setup esatto dal team Prime prima di procedere su ${CONTACTS.prime}.`,
  },
  payoutDispute: {
    en: `I can share the general payout rule, but payout approvals, rejections, or account-specific reviews must be checked by the Prime team. Please contact ${CONTACTS.prime} or live chat for a secure review.`,
    it: `Posso condividere la regola generale sui payout, ma approvazioni, rifiuti o revisioni account-specific devono essere controllati dal team Prime. Contatta ${CONTACTS.prime} o la live chat per una verifica sicura.`,
  },
  breachDispute: {
    en: `I can help with the general rule, but breaches, failed challenges, and account termination disputes must be reviewed by the Prime team. Please contact ${CONTACTS.prime} so they can verify the exact case.`,
    it: `Posso aiutarti con la regola generale, ma breach, challenge fallite e dispute sulla terminazione dell’account devono essere rivisti dal team Prime. Contatta ${CONTACTS.prime} così potranno verificare il caso esatto.`,
  },
  financialAdvice: {
    en: 'Bullwaves does not provide financial advice, so I cannot tell you what to buy, sell, or trade. I can help with platform, account, and support information only.',
    it: 'Bullwaves non fornisce consulenza finanziaria, quindi non posso dirti cosa comprare, vendere o tradare. Posso aiutarti solo con informazioni su piattaforma, account e supporto.',
  },
  fallback: {
    en: 'I can help with the general rule, but I do not want to give you an inaccurate answer on a rule-sensitive case. If you want, tell me whether this is about Bullwaves Broker or Bullwaves Prime.',
    it: 'Posso aiutarti con la regola generale, ma non voglio darti una risposta imprecisa su un caso sensibile. Se vuoi, dimmi se la domanda riguarda Bullwaves Broker o Bullwaves Prime.',
  },
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword))
}

function detectLanguage(message, fallbackLocale = 'en') {
  const text = normalize(message)
  if (!text) return fallbackLocale === 'it' ? 'it' : 'en'

  const italianSignals = [
    ' come ',
    ' posso ',
    ' voglio ',
    ' conto ',
    ' verifica ',
    ' registrazione ',
    ' bonifico ',
    ' deposito ',
    ' prelievo ',
    ' payout ',
    ' challenge ',
    ' perche ',
    ' qual ',
    ' quando ',
    ' che cos',
    ' supporto ',
    ' documento ',
    ' account ',
    ' posso',
    ' come',
    ' ciao',
    'salve',
  ]
  const englishSignals = [
    ' how ',
    ' can i ',
    ' account ',
    ' deposit ',
    ' withdraw ',
    ' verification ',
    ' login ',
    ' challenge ',
    ' payout ',
    ' support ',
    ' documents ',
    ' what is ',
    ' hi ',
    'hello ',
  ]

  const padded = ` ${text} `
  const italianScore = italianSignals.reduce(
    (score, signal) => score + (padded.includes(signal) ? 1 : 0),
    0
  )
  const englishScore = englishSignals.reduce(
    (score, signal) => score + (padded.includes(signal) ? 1 : 0),
    0
  )

  if (italianScore > englishScore) return 'it'
  return fallbackLocale === 'it' ? 'it' : 'en'
}

function getUiCopy(locale) {
  return UI_COPY[locale] || UI_COPY.en
}

function getQuickReplies(locale) {
  return QUICK_REPLIES[locale] || QUICK_REPLIES.en
}

function resolveTemplate(key, lang) {
  return (
    RESPONSE_LIBRARY[key]?.[lang] || RESPONSE_LIBRARY[key]?.en || RESPONSE_LIBRARY.fallback[lang]
  )
}

function includesAccountSpecific(text) {
  return hasAny(text, [
    'my account',
    'my payout',
    'my challenge',
    'my deposit',
    'my withdrawal',
    'review my case',
    'my kyc',
    'my verification',
    'my credentials',
    'my login',
    'il mio account',
    'il mio payout',
    'la mia challenge',
    'il mio deposito',
    'il mio prelievo',
    'controllare il mio caso',
    'il mio kyc',
    'la mia verifica',
    'le mie credenziali',
    'il mio login',
    'mio account',
  ])
}

function getIntent(message) {
  const text = normalize(message)

  if (!text.trim()) return 'fallback'

  if (
    hasAny(text, [
      'what should i trade',
      'what to trade',
      'buy or sell',
      'trading signal',
      'best pair',
      'cosa devo tradare',
      'cosa tradare',
      'comprare o vendere',
      'segnale',
      'strategia',
      'which market should i',
      'invest',
      'investment advice',
      'consulenza finanziaria',
    ])
  ) {
    return 'financialAdvice'
  }

  if (
    hasAny(text, [
      'difference between',
      'broker or prime',
      'broker vs prime',
      'differenza',
      'broker e prime',
    ])
  ) {
    return 'brokerVsPrime'
  }

  if (
    hasAny(text, [
      'what is bullwaves prime',
      'bullwaves prime',
      'prop firm',
      'prime challenge',
      'che cos e bullwaves prime',
    ])
  ) {
    return 'whatIsPrime'
  }

  if (
    hasAny(text, ['what is bullwaves', 'about bullwaves', 'cos e bullwaves', 'che cos e bullwaves'])
  ) {
    return 'whatIsBullwaves'
  }

  if (hasAny(text, ['partner', 'affiliate', 'ib', 'cpa', 'revenue share'])) return 'partner'
  if (
    hasAny(text, [
      'support email',
      'contact support',
      'contact',
      'complaint',
      'compliance',
      'contattare il supporto',
      'reclamo',
    ])
  )
    return 'supportContacts'

  if (
    hasAny(text, [
      'open a live account',
      'register',
      'registration',
      'sign up',
      'aprire un conto',
      'registrazione',
    ])
  )
    return 'registration'
  if (
    hasAny(text, [
      'log in',
      'login',
      'sign in',
      'accesso',
      'accedere',
      'email verification',
      'verify my email',
      'verifica email',
    ])
  )
    return 'login'
  if (
    hasAny(text, [
      'deposit method',
      'visa',
      'mastercard',
      'bank transfer',
      'metodi di pagamento',
      'bonifico',
      'carta',
    ])
  )
    return 'depositMethods'
  if (hasAny(text, ['deposit', 'fund account', 'add funds', 'depositare', 'deposito']))
    return 'deposit'
  if (
    hasAny(text, [
      'verify my account',
      'verification',
      'kyc',
      'documents',
      'proof of residence',
      'verifica',
      'documenti',
      'prova di residenza',
    ])
  )
    return 'verification'
  if (hasAny(text, ['account type', 'classic', 'vip', 'ecn', 'tipi di conto', 'conto classic']))
    return 'accountTypes'
  if (hasAny(text, ['platform', 'mt5', 'metatrader', 'web trader', 'piattaforma']))
    return 'platforms'

  if (
    hasAny(text, [
      'challenge size',
      '$10,000',
      '$25,000',
      '$50,000',
      '$100,000',
      '$200,000',
      'challenge disponibili',
      'dimensioni challenge',
    ])
  )
    return 'challengeSizes'
  if (hasAny(text, ['minimum trading days', 'trading days', 'giorni di trading']))
    return 'tradingDays'
  if (hasAny(text, ['profit target', 'target', '8%', '5%', '10%'])) return 'profitTarget'
  if (hasAny(text, ['leverage', '1:50', 'leva'])) return 'leverage'
  if (hasAny(text, ['drawdown', 'daily drawdown', 'total drawdown'])) return 'drawdown'
  if (
    hasAny(text, [
      'weekend',
      'hold trades',
      'crypto during weekend',
      'weekend crypto',
      'nel weekend',
    ])
  )
    return 'weekendHolding'
  if (hasAny(text, ['first payout', 'when can i request my first payout', 'primo payout']))
    return 'firstPayout'
  if (hasAny(text, ['payout method', 'bank wire', 'usdt', 'erc20', 'metodi payout']))
    return 'payoutMethods'
  if (
    hasAny(text, [
      'payout review',
      'how long do payouts take',
      'quanto tempo richiede payout',
      '2-5 business days',
    ])
  )
    return 'payoutTiming'
  if (
    hasAny(text, [
      'funded stage',
      'funded account',
      'prime kyc',
      'kyc before funded',
      'fase funded',
    ])
  )
    return 'primeKyc'
  if (
    hasAny(text, [
      'restricted country',
      'country restriction',
      'compliance eligibility',
      'paesi soggetti a restrizioni',
      'restricted jurisdictions',
    ])
  )
    return 'restrictedCountries'

  if (
    hasAny(text, [
      'ea',
      'bot',
      'automation',
      'automazione',
      'trade copier',
      'copy trading',
      'copier',
      'mirrored trading',
    ])
  )
    return 'automation'
  if (
    hasAny(text, [
      'payout rejected',
      'payout approval',
      'payout dispute',
      'rejected payout',
      'payout rifiutato',
      'approvazione payout',
    ])
  )
    return 'payoutDispute'
  if (
    hasAny(text, [
      'breach',
      'violation',
      'violazione',
      'failed challenge',
      'challenge failed',
      'account terminated',
      'my account was breached',
    ])
  )
    return 'breachDispute'

  return 'fallback'
}

export function getAssistantReply(message, fallbackLocale = 'en') {
  const language = detectLanguage(message, fallbackLocale)
  const text = normalize(message)
  const accountSpecific = includesAccountSpecific(text)
  const intent = getIntent(message)

  if (accountSpecific && hasAny(text, ['kyc', 'verification', 'document', 'documenti'])) {
    return { language, text: resolveTemplate('verificationRejected', language), kind: 'escalation' }
  }

  if (
    accountSpecific &&
    hasAny(text, [
      'deposit',
      'withdraw',
      'prelievo',
      'deposito',
      'card',
      'bank transfer',
      'bonifico',
    ])
  ) {
    return {
      language,
      text: resolveTemplate('accountSpecificDeposit', language),
      kind: 'escalation',
    }
  }

  if (
    intent === 'restrictedCountries' ||
    intent === 'automation' ||
    intent === 'payoutDispute' ||
    intent === 'breachDispute'
  ) {
    return { language, text: resolveTemplate(intent, language), kind: 'escalation' }
  }

  if (
    accountSpecific &&
    hasAny(text, ['account', 'payout', 'challenge', 'review', 'case', 'caso'])
  ) {
    const key =
      language === 'it'
        ? `Posso aiutarti con la regola generale, ma per una conferma legata al tuo account il team dovrebbe verificare il tuo caso preciso. Contatta ${CONTACTS.prime} per Bullwaves Prime o ${CONTACTS.support} per Bullwaves Broker.`
        : `I can help with the general rule, but for account-specific confirmation the team should review your exact case. Please contact ${CONTACTS.prime} for Bullwaves Prime or ${CONTACTS.support} for Bullwaves Broker.`
    return { language, text: key, kind: 'escalation' }
  }

  if (intent === 'fallback') {
    return { language, text: resolveTemplate('fallback', language), kind: 'fallback' }
  }

  return {
    language,
    text: resolveTemplate(intent, language),
    kind: intent.includes('payout') || intent.includes('drawdown') ? 'cautious' : 'answer',
  }
}

export { CONTACTS, detectLanguage, getQuickReplies, getUiCopy }
