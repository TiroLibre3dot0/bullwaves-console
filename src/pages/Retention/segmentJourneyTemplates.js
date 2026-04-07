import { makeLocaleVariants } from './segmentJourneyTemplateBuilder.js'
import { additionalSegmentJourneyTemplatesById } from './additionalSegmentJourneyTemplates.js'
import { EMAIL_JOURNEY_ICON_URLS } from './emailJourneyIconRegistry.js'

const {
  customerService,
  creditCard,
  financialSuccessSecurity,
  riskManagementControl,
  successfulInvestmentReward,
  successGrowthCertificate,
  secureAccess,
  secureDepositCard,
} = EMAIL_JOURNEY_ICON_URLS

const UNFUNDED_ICON_SETS = {
  welcomeTrust: {
    boxOneIconUrl: secureAccess,
    boxTwoIconUrl: secureDepositCard,
    boxThreeIconUrl: customerService,
  },
  welcomeValue: {
    boxOneIconUrl: secureAccess,
    boxTwoIconUrl: creditCard,
    boxThreeIconUrl: financialSuccessSecurity,
  },
  frictionClarity: {
    boxOneIconUrl: financialSuccessSecurity,
    boxTwoIconUrl: secureDepositCard,
    boxThreeIconUrl: customerService,
  },
  frictionRelief: {
    boxOneIconUrl: secureAccess,
    boxTwoIconUrl: creditCard,
    boxThreeIconUrl: customerService,
  },
  accountActivationReminder: {
    boxOneIconUrl: secureAccess,
    boxTwoIconUrl: financialSuccessSecurity,
    boxThreeIconUrl: customerService,
  },
  postLoginDepositActivation: {
    boxOneIconUrl: secureDepositCard,
    boxTwoIconUrl: successfulInvestmentReward,
    boxThreeIconUrl: customerService,
  },
  intentRecovery: {
    boxOneIconUrl: secureAccess,
    boxTwoIconUrl: secureDepositCard,
    boxThreeIconUrl: financialSuccessSecurity,
  },
  depositPush: {
    boxOneIconUrl: successfulInvestmentReward,
    boxTwoIconUrl: secureAccess,
    boxThreeIconUrl: customerService,
  },
  depositMomentum: {
    boxOneIconUrl: successfulInvestmentReward,
    boxTwoIconUrl: successGrowthCertificate,
    boxThreeIconUrl: customerService,
  },
  firstTradeStructured: {
    boxOneIconUrl: successfulInvestmentReward,
    boxTwoIconUrl: successGrowthCertificate,
    boxThreeIconUrl: riskManagementControl,
  },
  firstTradeConfidence: {
    boxOneIconUrl: financialSuccessSecurity,
    boxTwoIconUrl: successfulInvestmentReward,
    boxThreeIconUrl: riskManagementControl,
  },
  reentrySoft: {
    boxOneIconUrl: secureAccess,
    boxTwoIconUrl: financialSuccessSecurity,
    boxThreeIconUrl: customerService,
  },
  reentryOpportunity: {
    boxOneIconUrl: successGrowthCertificate,
    boxTwoIconUrl: financialSuccessSecurity,
    boxThreeIconUrl: customerService,
  },
}

export const segmentJourneyTemplatesById = {
  unfunded_newcomers_welcome_value_email: {
    id: 'unfunded_newcomers_welcome_value_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Welcome + Value Proposition A',
          description:
            'Trust-first welcome variant that presents funding as the natural step to unlock the client area and platform access.',
          subject: 'Your Bullwaves account is ready. Funding it takes just one step.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your Bullwaves account is ready',
            heroTitle: 'Your account is ready',
            heroSubtitle: 'A secure deposit unlocks your Bullwaves access.',
            mainTitle: 'You already completed the first step: registration.',
            introLead:
              'Your account is active. Funding unlocks your client area, tools, and support.',
            bodyOne:
              'The path is simple: secure payments, guided onboarding, and help if you need it.',
            bodyTwo: 'Here is the value you get immediately once you move forward:',
            boxOneTitle: 'Security',
            boxOneCopy: 'Protected access',
            boxTwoTitle: 'Funding',
            boxTwoCopy: 'Fast payment options',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Real human guidance',
            ...UNFUNDED_ICON_SETS.welcomeTrust,
            bodyThree:
              'A first deposit simply unlocks the full environment so you can evaluate it properly.',
            bodyFour:
              'If you need help, support is there, but the next move is to unlock the account.',
            ctaLabel: 'Open Your Client Area',
            ctaHelper: 'Review the account and continue',
            supportLabel: 'Need help first? Chat on WhatsApp',
            supportHelper: 'Use support only for a quick answer',
          },
        },
        {
          name: 'Unfunded Newcomers - Welcome + Value Proposition B',
          description:
            'Benefit-led welcome variant focused on access, onboarding simplicity, and reduced hesitation before the first deposit.',
          subject: 'Your registration is done. Unlock the next step on Bullwaves.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Unlock the next step',
            heroTitle: 'You are almost inside',
            heroSubtitle: 'Registration is done. Activate your access.',
            mainTitle: 'The setup is already behind you.',
            introLead: 'Your profile is ready. Funding opens the real Bullwaves experience.',
            bodyOne:
              'The next step is simpler than it looks: open the area, review the path, and proceed.',
            bodyTwo: 'What you unlock once you continue:',
            boxOneTitle: 'Access',
            boxOneCopy: 'Client area ready',
            boxTwoTitle: 'Simplicity',
            boxTwoCopy: 'Clear next step',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Support if needed',
            ...UNFUNDED_ICON_SETS.welcomeValue,
            bodyThree:
              'This is about momentum, not pressure. Acting now keeps the process lighter.',
            bodyFour:
              'If anything is unclear, support stays available, but activating the account comes first.',
            ctaLabel: 'Unlock Your Access',
            ctaHelper: 'Enter your area and continue',
            supportLabel: 'Prefer a quick clarification on WhatsApp?',
            supportHelper: 'Use support only for a quick answer',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Welcome + Proposta di Valore A',
          description:
            'Variante trust-first che presenta il funding come passaggio naturale per sbloccare area personale e accesso alla piattaforma.',
          subject: 'Il tuo account Bullwaves è pronto. Ti manca solo un passo.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo account Bullwaves è pronto',
            heroTitle: 'Il tuo account è pronto',
            heroSubtitle: 'Un deposito sicuro sblocca il tuo accesso Bullwaves.',
            mainTitle: 'Hai già completato il primo passo: la registrazione.',
            introLead:
              'Il tuo account è attivo. Il deposito sblocca area personale, strumenti e supporto.',
            bodyOne: 'Il percorso è semplice: pagamenti sicuri, guida chiara e aiuto se serve.',
            bodyTwo: 'Ecco il valore che ottieni subito appena procedi:',
            boxOneTitle: 'Sicurezza',
            boxOneCopy: 'Accesso protetto',
            boxTwoTitle: 'Deposito',
            boxTwoCopy: 'Metodi rapidi',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Guida umana reale',
            ...UNFUNDED_ICON_SETS.welcomeTrust,
            bodyThree:
              "Il primo deposito serve solo a sbloccare l'ambiente completo e valutarlo meglio.",
            bodyFour:
              "Se ti serve aiuto, il supporto c'è, ma il passo dopo resta sbloccare l'account.",
            ctaLabel: 'Apri la tua Area Personale',
            ctaHelper: "Controlla l'account e continua",
            supportLabel: 'Hai bisogno di aiuto prima? Scrivici su WhatsApp',
            supportHelper: 'Usa il supporto solo per un chiarimento rapido',
          },
        },
        {
          name: 'Unfunded Newcomers - Welcome + Proposta di Valore B',
          description:
            "Variante benefit-led orientata ad accesso, semplicità di onboarding e riduzione dell'esitazione prima del primo deposito.",
          subject: 'Registrazione completata. Sblocca il prossimo passaggio su Bullwaves.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Sblocca il prossimo passaggio',
            heroTitle: 'Sei quasi dentro',
            heroSubtitle: 'La registrazione è fatta. Attiva il tuo accesso.',
            mainTitle: 'La parte più tecnica è già alle spalle.',
            introLead:
              'Il tuo profilo è pronto. Finanziare il conto apre la vera esperienza Bullwaves.',
            bodyOne:
              'Il prossimo passo è più semplice di quanto sembri: entri, valuti il percorso e procedi.',
            bodyTwo: 'Cosa sblocchi appena continui:',
            boxOneTitle: 'Accesso',
            boxOneCopy: 'Area personale pronta',
            boxTwoTitle: 'Semplicità',
            boxTwoCopy: 'Prossimo passaggio chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Supporto se serve',
            ...UNFUNDED_ICON_SETS.welcomeValue,
            bodyThree:
              'Qui conta lo slancio, non la pressione. Muoversi ora rende tutto più lineare.',
            bodyFour:
              "Se qualcosa non è chiaro, il supporto resta disponibile, ma attivare l'account viene prima.",
            ctaLabel: 'Sblocca il tuo Accesso',
            ctaHelper: 'Entra nella tua area e continua',
            supportLabel: 'Preferisci un chiarimento veloce su WhatsApp?',
            supportHelper: 'Usa il supporto solo per una risposta rapida',
          },
        }
      ),
    },
  },
  unfunded_newcomers_friction_reduction_email: {
    id: 'unfunded_newcomers_friction_reduction_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Friction Reduction A',
          description:
            'Objection-removal variant focused on clarifying payments and reducing uncertainty before funding.',
          subject: 'Questions before funding? Here is the fastest way forward.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Questions before funding?',
            heroTitle: 'Make funding easier',
            heroSubtitle: 'A few clear answers can move you forward.',
            mainTitle: 'Most first deposits stop because of one simple doubt.',
            introLead:
              'Usually it is not lack of interest. It is doubt around payment, timing, or what happens next.',
            bodyOne:
              'That is why we simplified the path: clearer routes, fewer doubts, and a direct next action.',
            bodyTwo: 'Here are the three points that matter most before your first deposit:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'Simple answers first',
            boxTwoTitle: 'Payments',
            boxTwoCopy: 'Trusted routes',
            boxThreeTitle: 'Guidance',
            boxThreeCopy: 'Available if needed',
            ...UNFUNDED_ICON_SETS.frictionClarity,
            bodyThree:
              'You can review the funding path first and decide after. Often that is enough to move.',
            bodyFour:
              'The priority is simple: review the path, confirm it works, and continue in platform.',
            ctaLabel: 'Review Deposit Options',
            ctaHelper: 'Open the platform and check the route',
            supportLabel: 'Need clarification on WhatsApp?',
            supportHelper: 'Human help stays secondary to the platform',
          },
        },
        {
          name: 'Unfunded Newcomers - Friction Reduction B',
          description:
            'Reassurance-led variant that lowers emotional resistance and frames support as backup rather than the main path.',
          subject: 'Still hesitating? The deposit step may be simpler than you think.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Still hesitating?',
            heroTitle: 'A lighter path is here',
            heroSubtitle: 'If funding felt heavy before, this path makes it lighter.',
            mainTitle: 'You may not need more time. You may just need less friction.',
            introLead: 'Users often pause here because the next step feels bigger than it is.',
            bodyOne: 'The best next move is to reopen the funding path with a simpler frame.',
            bodyTwo: 'What this clearer route gives you:',
            boxOneTitle: 'Less doubt',
            boxOneCopy: 'Answers before action',
            boxTwoTitle: 'Less effort',
            boxTwoCopy: 'Cleaner payment flow',
            boxThreeTitle: 'Less pressure',
            boxThreeCopy: 'Support in the background',
            ...UNFUNDED_ICON_SETS.frictionRelief,
            bodyThree:
              'Go back into the account, review the route, and use support only for one blocker.',
            bodyFour:
              'That keeps the next step focused instead of adding extra conversations too early.',
            ctaLabel: 'Reopen the Funding Path',
            ctaHelper: 'Check the route again with a simpler frame',
            supportLabel: 'Have one specific blocker? Ask on WhatsApp',
            supportHelper: 'WhatsApp is backup, not the main path',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Riduzione Attriti A',
          description:
            'Variante focalizzata sulla rimozione delle obiezioni con maggiore chiarezza su pagamenti e passaggi di funding.',
          subject: 'Hai dubbi prima di depositare? Ecco il modo più semplice per procedere.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Hai dubbi prima di depositare?',
            heroTitle: 'Rendiamo il deposito semplice',
            heroSubtitle: 'Poche risposte chiare possono farti andare avanti.',
            mainTitle: 'Molti primi depositi si fermano per un dubbio molto semplice.',
            introLead:
              'Di solito non manca interesse. Manca chiarezza su pagamento, tempi o passaggi successivi.',
            bodyOne:
              'Per questo il percorso è più lineare: più chiarezza, meno dubbi, un passo diretto.',
            bodyTwo: 'Ecco i tre punti che contano di più prima del primo deposito:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Risposte semplici',
            boxTwoTitle: 'Pagamenti',
            boxTwoCopy: 'Percorsi affidabili',
            boxThreeTitle: 'Guida',
            boxThreeCopy: 'Disponibile se serve',
            ...UNFUNDED_ICON_SETS.frictionClarity,
            bodyThree:
              'Puoi controllare prima il percorso e decidere dopo. Spesso basta questo per muoverti.',
            bodyFour:
              'La priorità resta semplice: rivedere il percorso e procedere dalla piattaforma.',
            ctaLabel: 'Controlla le Opzioni di Deposito',
            ctaHelper: 'Apri la piattaforma e verifica il percorso',
            supportLabel: 'Ti serve un chiarimento su WhatsApp?',
            supportHelper: "L'aiuto umano resta secondario alla piattaforma",
          },
        },
        {
          name: 'Unfunded Newcomers - Riduzione Attriti B',
          description:
            'Variante reassurance-led che abbassa la resistenza emotiva e lascia il supporto come backup invece che come percorso principale.',
          subject: 'Sei ancora indeciso? Il deposito potrebbe essere più semplice di quanto pensi.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Sei ancora indeciso?',
            heroTitle: 'Esiste un percorso leggero',
            heroSubtitle: 'Se prima sembrava pesante, ora il deposito è più semplice.',
            mainTitle: 'Forse non ti serve più tempo. Ti serve meno attrito.',
            introLead:
              'Quando un utente si ferma qui, spesso il passo dopo sembra più grande di quanto sia.',
            bodyOne:
              'La mossa migliore è riaprire il percorso di deposito con un criterio più semplice.',
            bodyTwo: 'Cosa ti offre questo percorso più chiaro:',
            boxOneTitle: 'Meno dubbi',
            boxOneCopy: 'Risposte prima di agire',
            boxTwoTitle: 'Meno sforzo',
            boxTwoCopy: 'Flusso più pulito',
            boxThreeTitle: 'Meno pressione',
            boxThreeCopy: 'Supporto sullo sfondo',
            ...UNFUNDED_ICON_SETS.frictionRelief,
            bodyThree:
              "Rientra nell'account, rivedi il percorso e usa il supporto solo per un blocco preciso.",
            bodyFour: 'Così il prossimo passaggio resta focalizzato, senza conversazioni inutili.',
            ctaLabel: 'Riapri il Percorso di Deposito',
            ctaHelper: 'Riguarda il percorso con un criterio più semplice',
            supportLabel: 'Hai un blocco preciso? Scrivici su WhatsApp',
            supportHelper: 'WhatsApp resta un supporto di riserva',
          },
        }
      ),
    },
  },
  unfunded_newcomers_account_activation_reminder_email: {
    id: 'unfunded_newcomers_account_activation_reminder_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Account Activation Reminder A',
          description:
            'No-login reminder variant focused on getting the user back into the portal before speaking about deposit urgency.',
          subject: 'Your Bullwaves account is waiting. Log in and complete your setup.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your account is waiting',
            heroTitle: 'Log in to continue',
            heroSubtitle: 'Your Bullwaves profile is ready. The next move is simply to enter.',
            mainTitle: 'You already registered. Now complete the access step.',
            introLead:
              'Before funding becomes relevant, the account has to become familiar. The first action is logging in and reviewing your client area.',
            bodyOne:
              'Users often stop here not because of rejection, but because they did not take the first real in-platform step.',
            bodyTwo: 'What logging in gives you immediately:',
            boxOneTitle: 'Access',
            boxOneCopy: 'See your area clearly',
            boxTwoTitle: 'Orientation',
            boxTwoCopy: 'Understand the next step',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Ask only if blocked',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree:
              'Enter first, review the environment, and only then decide how to proceed with funding.',
            bodyFour: 'This keeps the process lighter and gives context before any payment step.',
            ctaLabel: 'Log In to Your Account',
            ctaHelper: 'Enter the portal and review your next step',
            supportLabel: 'Need help accessing the area?',
            supportHelper: 'Use WhatsApp only if access is blocked',
          },
        },
        {
          name: 'Unfunded Newcomers - Account Activation Reminder B',
          description:
            'Portal-entry reminder variant that frames login as the lowest-friction action and keeps deposit messaging in the background.',
          subject: 'Do not leave your Bullwaves access unused. Enter your account now.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Use the access you already created',
            heroTitle: 'Your next step is small',
            heroSubtitle: 'Logging in is enough to restart the journey clearly.',
            mainTitle: 'You do not need to decide everything now. You only need to enter.',
            introLead:
              'Once you are inside the portal, the next action becomes more concrete and less abstract.',
            bodyOne:
              'That is why this reminder is not about pressure. It is about taking the first operational step inside your account.',
            bodyTwo: 'Why this step matters:',
            boxOneTitle: 'Simplicity',
            boxOneCopy: 'One easy action',
            boxTwoTitle: 'Visibility',
            boxTwoCopy: 'See the path directly',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Move with context',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree:
              'Open the account, look around, and let the next decision come from clarity rather than hesitation.',
            bodyFour:
              'Support is available if needed, but portal access stays the main destination.',
            ctaLabel: 'Enter Your Bullwaves Area',
            ctaHelper: 'Re-enter the portal and restart with context',
            supportLabel: 'Have an access issue?',
            supportHelper: 'Use WhatsApp only for a specific login blocker',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Reminder Attivazione Account A',
          description:
            "Variante no-login focalizzata sul riportare l'utente nel portale prima di parlare di urgenza sul deposito.",
          subject: 'Il tuo account Bullwaves ti aspetta. Entra e completa la configurazione.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo account ti aspetta',
            heroTitle: 'Entra per continuare',
            heroSubtitle:
              'Il tuo profilo Bullwaves è pronto. Il prossimo passo è semplicemente entrare.',
            mainTitle: 'Ti sei già registrato. Ora completa il passaggio di accesso.',
            introLead:
              "Prima che il deposito diventi rilevante, l'account deve diventare familiare. La prima azione è fare login e guardare l'area personale.",
            bodyOne:
              'Molti utenti si fermano qui non per rifiuto, ma perché non fanno il primo vero passo dentro la piattaforma.',
            bodyTwo: 'Cosa ottieni subito entrando:',
            boxOneTitle: 'Accesso',
            boxOneCopy: 'Vedi la tua area',
            boxTwoTitle: 'Orientamento',
            boxTwoCopy: 'Capisci il prossimo step',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Chiedi solo se bloccato',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree:
              "Prima entra, guarda l'ambiente, poi decidi con calma come procedere sul funding.",
            bodyFour:
              'Così il processo resta più leggero e il passaggio di pagamento arriva con più contesto.',
            ctaLabel: 'Accedi al tuo Account',
            ctaHelper: 'Entra nel portale e guarda il prossimo passaggio',
            supportLabel: 'Hai bisogno di aiuto per accedere?',
            supportHelper: "Usa WhatsApp solo se l'accesso è bloccato",
          },
        },
        {
          name: 'Unfunded Newcomers - Reminder Attivazione Account B',
          description:
            'Variante portal-entry che presenta il login come azione a più basso attrito e lascia il deposito sullo sfondo.',
          subject: 'Non lasciare inutilizzato il tuo accesso Bullwaves. Entra ora nel tuo account.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: "Usa l'accesso che hai già creato",
            heroTitle: 'Il tuo prossimo passo è piccolo',
            heroSubtitle: 'Fare login basta per riavviare il percorso con chiarezza.',
            mainTitle: 'Non devi decidere tutto adesso. Devi solo entrare.',
            introLead:
              'Una volta dentro il portale, il passaggio successivo diventa più concreto e meno astratto.',
            bodyOne:
              'Per questo promemoria non si parla di pressione. Si parla del primo passo operativo dentro il tuo account.',
            bodyTwo: 'Perché questo passaggio conta:',
            boxOneTitle: 'Semplicità',
            boxOneCopy: 'Un azione semplice',
            boxTwoTitle: 'Visibilità',
            boxTwoCopy: 'Vedi il percorso',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Ti muovi con contesto',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree:
              "Apri l'account, guarda il percorso e lascia che la decisione successiva nasca dalla chiarezza, non dall'esitazione.",
            bodyFour:
              "Il supporto resta disponibile se serve, ma la destinazione principale resta l'accesso al portale.",
            ctaLabel: 'Entra nella tua Area Bullwaves',
            ctaHelper: 'Rientra nel portale e riparti con contesto',
            supportLabel: 'Hai un problema di accesso?',
            supportHelper: 'Usa WhatsApp solo per un blocco specifico sul login',
          },
        }
      ),
    },
  },
  unfunded_newcomers_post_login_deposit_activation_email: {
    id: 'unfunded_newcomers_post_login_deposit_activation_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Post-login Deposit Activation A',
          description:
            'Post-login activation variant designed for users who entered the portal but have not yet started the funding route.',
          subject: 'You are already inside. Open the funding path now.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'You are already inside',
            heroTitle: 'Turn access into action',
            heroSubtitle: 'Now that you logged in, the next step is opening the funding path.',
            mainTitle: 'The hardest mental step is already done: you entered the account.',
            introLead:
              'At this point the best move is not more explanation. It is moving from access to deposit intent while the session is still warm.',
            bodyOne:
              'Open the cashier, review the payment routes, and keep the path practical and short.',
            bodyTwo: 'What this next step should give you:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'Open the right route',
            boxTwoTitle: 'Progress',
            boxTwoCopy: 'Move toward first deposit',
            boxThreeTitle: 'Assistance',
            boxThreeCopy: 'Available only if needed',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyThree:
              'Do not stop at account access. Use that momentum to enter the funding flow while the process feels familiar.',
            bodyFour:
              'If one blocker appears, support can help, but the main path remains the cashier and payment route.',
            ctaLabel: 'Open the Deposit Path',
            ctaHelper: 'Go directly to the cashier and review your payment options',
            supportLabel: 'Need help with one blocker?',
            supportHelper: 'Use WhatsApp only for a specific funding issue',
          },
        },
        {
          name: 'Unfunded Newcomers - Post-login Deposit Activation B',
          description:
            'Action-led post-login variant focused on keeping momentum high once the user has returned to the portal.',
          subject: 'Your next step is already visible. Start the deposit flow.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Your next step is visible',
            heroTitle: 'Stay in motion',
            heroSubtitle: 'You logged in. Now move straight into the funding flow.',
            mainTitle: 'Once the portal is open, the right move is to keep going.',
            introLead:
              'Stopping after login often recreates hesitation. Opening the funding route keeps the process operational.',
            bodyOne:
              'This is why the message is simple: do not just visit the account. Advance to the cashier and inspect the route.',
            bodyTwo: 'Keep the next action anchored to three things:',
            boxOneTitle: 'Momentum',
            boxOneCopy: 'Act while warm',
            boxTwoTitle: 'Visibility',
            boxTwoCopy: 'See deposit options clearly',
            boxThreeTitle: 'Clarity',
            boxThreeCopy: 'Resolve only real blockers',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyThree:
              'The goal is not a long conversation. The goal is one concrete move toward first deposit.',
            bodyFour: 'Keep the platform first. Use support only if the route stops you.',
            ctaLabel: 'Start the Funding Flow',
            ctaHelper: 'Open the cashier and take the next clear step',
            supportLabel: 'Blocked by one detail?',
            supportHelper: 'Use WhatsApp only for the last unresolved obstacle',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Attivazione Deposito Post-login A',
          description:
            'Variante post-login pensata per utenti che sono entrati nel portale ma non hanno ancora avviato il percorso di funding.',
          subject: 'Sei già dentro. Apri ora il percorso di deposito.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Sei già dentro',
            heroTitle: "Trasforma l'accesso in azione",
            heroSubtitle:
              'Ora che hai fatto login, il prossimo passo è aprire il percorso di funding.',
            mainTitle: "Il passaggio mentale più difficile è già fatto: sei entrato nell'account.",
            introLead:
              "A questo punto la mossa migliore non è un'altra spiegazione. È passare dall'accesso all'intento di deposito mentre la sessione è ancora calda.",
            bodyOne:
              'Apri il cashier, controlla i percorsi di pagamento e tieni il flusso pratico e corto.',
            bodyTwo: 'Cosa ti deve dare questo prossimo passaggio:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Apri il percorso giusto',
            boxTwoTitle: 'Progresso',
            boxTwoCopy: 'Vai verso il primo deposito',
            boxThreeTitle: 'Assistenza',
            boxThreeCopy: 'Disponibile solo se serve',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyThree:
              "Non fermarti all'accesso. Usa questo slancio per entrare nel flusso di funding mentre il processo ti è ancora familiare.",
            bodyFour:
              'Se compare un blocco, il supporto può aiutarti, ma il percorso principale resta cashier e pagamento.',
            ctaLabel: 'Apri il Percorso di Deposito',
            ctaHelper: 'Vai direttamente al cashier e guarda le opzioni di pagamento',
            supportLabel: 'Hai bisogno di aiuto su un blocco specifico?',
            supportHelper: 'Usa WhatsApp solo per un problema preciso sul funding',
          },
        },
        {
          name: 'Unfunded Newcomers - Attivazione Deposito Post-login B',
          description:
            'Variante action-led post-login focalizzata sul mantenere alto il momentum dopo il rientro nel portale.',
          subject: 'Il tuo prossimo passo è già visibile. Avvia il flusso di deposito.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Il tuo prossimo passo è visibile',
            heroTitle: 'Resta in movimento',
            heroSubtitle: 'Hai fatto login. Ora entra direttamente nel flusso di funding.',
            mainTitle: 'Quando il portale è aperto, la mossa giusta è continuare.',
            introLead:
              'Fermarsi subito dopo il login ricrea esitazione. Aprire il funding mantiene il processo operativo.',
            bodyOne:
              "Per questo il messaggio è semplice: non limitarti a visitare l'account. Avanza verso il cashier e guarda il percorso.",
            bodyTwo: 'Tieni la prossima azione ancorata a tre cose:',
            boxOneTitle: 'Slancio',
            boxOneCopy: 'Agisci mentre sei caldo',
            boxTwoTitle: 'Visibilità',
            boxTwoCopy: 'Vedi chiaramente le opzioni',
            boxThreeTitle: 'Chiarezza',
            boxThreeCopy: 'Risolvi solo i blocchi reali',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyThree:
              "L'obiettivo non è una conversazione lunga. L'obiettivo è un passo concreto verso il primo deposito.",
            bodyFour:
              'Metti la piattaforma al primo posto. Usa il supporto solo se il percorso si blocca.',
            ctaLabel: 'Avvia il Flusso di Funding',
            ctaHelper: 'Apri il cashier e fai il prossimo passaggio chiaro',
            supportLabel: 'Sei bloccato da un dettaglio?',
            supportHelper: 'Usa WhatsApp solo per l ultimo ostacolo non risolto',
          },
        }
      ),
    },
  },
  unfunded_newcomers_deposit_intent_recovery_email: {
    id: 'unfunded_newcomers_deposit_intent_recovery_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Deposit Intent Recovery A',
          description:
            'Recovery variant for users who accessed the account but did not open cashier, payment routes, or KYC steps.',
          subject: 'You entered the account, but the next step is still open.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'The next step is still open',
            heroTitle: 'Turn attention into intent',
            heroSubtitle: 'You came back to the account. Now open the funding route clearly.',
            mainTitle: 'Interest existed, but no deposit-intent event followed.',
            introLead:
              'That usually means the user needs a cleaner handoff into the cashier or KYC path, not more generic persuasion.',
            bodyOne:
              'This message exists to make the next action visible: open the deposit route, inspect the steps, and decide from there.',
            bodyTwo: 'What this recovery touch should do:',
            boxOneTitle: 'Reframe',
            boxOneCopy: 'Show the next action',
            boxTwoTitle: 'Reduce friction',
            boxTwoCopy: 'Keep the route short',
            boxThreeTitle: 'Clarify',
            boxThreeCopy: 'Remove practical doubt',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              'If no intent event happened yet, the problem is usually not value. It is route visibility and hesitation.',
            bodyFour:
              'Go back in, open the path, and use support only if one concrete obstacle remains.',
            ctaLabel: 'Reopen the Deposit Route',
            ctaHelper: 'Open the funding path and review the next operational step',
            supportLabel: 'Need help removing one obstacle?',
            supportHelper: 'Use WhatsApp only for one practical blocker',
          },
        },
        {
          name: 'Unfunded Newcomers - Deposit Intent Recovery B',
          description:
            'No-intent follow-up variant that restores momentum after a portal visit without any strong funding signal.',
          subject: 'You came back once. Use that momentum to open the funding path.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Do not let the visit stay passive',
            heroTitle: 'Use the return properly',
            heroSubtitle: 'Coming back matters only if it leads to a concrete step.',
            mainTitle: 'The account revisit was useful. Now it needs a follow-through action.',
            introLead:
              'The missing signal is not account access anymore. It is deposit intent. That is the gap this message closes.',
            bodyOne:
              'Move from portal visit to route exploration, and keep the process active instead of observational.',
            bodyTwo: 'This touch is built to create three things:',
            boxOneTitle: 'Intent',
            boxOneCopy: 'Open the cashier',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'Do not reset momentum',
            boxThreeTitle: 'Control',
            boxThreeCopy: 'Ask help only if blocked',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              'Think of this as the moment where interest becomes an observable event inside the journey.',
            bodyFour:
              'Open the funding route first. Only after that should support enter the picture.',
            ctaLabel: 'Open the Cashier Now',
            ctaHelper: 'Generate a clear deposit-intent action from your account',
            supportLabel: 'Still blocked after reopening the path?',
            supportHelper: 'Use WhatsApp only after checking the route',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Recupero Intento Deposito A',
          description:
            "Variante di recupero per utenti che hanno aperto l'account ma non hanno ancora aperto cashier, pagamenti o step KYC.",
          subject: "Sei entrato nell'account, ma il prossimo passo è ancora aperto.",
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il prossimo passo è ancora aperto',
            heroTitle: 'Trasforma attenzione in intento',
            heroSubtitle:
              "Sei rientrato nell'account. Ora apri con chiarezza il percorso di funding.",
            mainTitle: "C'è stato interesse, ma non è seguito nessun evento di intento deposito.",
            introLead:
              'Questo di solito significa che serve un passaggio più pulito verso cashier o KYC, non altra persuasione generica.',
            bodyOne:
              'Questo messaggio serve a rendere visibile la prossima azione: aprire il percorso di deposito, guardare i passaggi e decidere da lì.',
            bodyTwo: 'Cosa deve fare questo touch di recupero:',
            boxOneTitle: 'Riformulare',
            boxOneCopy: 'Mostra il prossimo step',
            boxTwoTitle: 'Ridurre attrito',
            boxTwoCopy: 'Tieni il percorso corto',
            boxThreeTitle: 'Chiarire',
            boxThreeCopy: 'Rimuovi il dubbio pratico',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              "Se l'evento di intento non è ancora avvenuto, il problema di solito non è il valore. È la visibilità del percorso e l'esitazione.",
            bodyFour:
              'Rientra, apri il percorso e usa il supporto solo se resta un ostacolo concreto.',
            ctaLabel: 'Riapri il Percorso di Deposito',
            ctaHelper: 'Apri il funding e guarda il prossimo passaggio operativo',
            supportLabel: 'Hai bisogno di rimuovere un ostacolo?',
            supportHelper: 'Usa WhatsApp solo per un blocco pratico',
          },
        },
        {
          name: 'Unfunded Newcomers - Recupero Intento Deposito B',
          description:
            'Variante no-intent che ripristina il momentum dopo una visita al portale senza segnali forti di funding.',
          subject: 'Sei già tornato una volta. Usa quello slancio per aprire il funding.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Non lasciare passiva la visita',
            heroTitle: 'Usa bene il rientro',
            heroSubtitle: 'Tornare conta solo se porta a un passo concreto.',
            mainTitle: "La rivisita dell'account è stata utile. Ora serve un'azione coerente.",
            introLead:
              "Il segnale che manca non è più l'accesso all'account. È l'intento deposito. Questo messaggio chiude proprio quel gap.",
            bodyOne:
              "Passa dalla visita del portale all'esplorazione del percorso e mantieni il processo attivo invece che osservativo.",
            bodyTwo: 'Questo touch è costruito per creare tre cose:',
            boxOneTitle: 'Intento',
            boxOneCopy: 'Apri il cashier',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Non azzerare lo slancio',
            boxThreeTitle: 'Controllo',
            boxThreeCopy: 'Chiedi aiuto solo se bloccato',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              "Pensa a questo come al momento in cui l'interesse diventa un segnale concreto dentro il percorso.",
            bodyFour:
              'Apri prima il percorso di funding. Solo dopo dovrebbe entrare in gioco il supporto.',
            ctaLabel: 'Apri Ora il Cashier',
            ctaHelper: 'Trasforma il rientro in un segnale chiaro di interesse al deposito',
            supportLabel: 'Sei ancora bloccato dopo aver riaperto il percorso?',
            supportHelper: 'Usa WhatsApp solo dopo aver controllato il percorso',
          },
        }
      ),
    },
  },
  unfunded_newcomers_first_deposit_push_email: {
    id: 'unfunded_newcomers_first_deposit_push_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - First Deposit Push A',
          description:
            'Urgency-led conversion variant that pushes immediate action with the platform as the main destination.',
          subject: 'Your Bullwaves access is almost unlocked. Complete your first deposit now.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Complete your first deposit',
            heroTitle: 'One step from full access',
            heroSubtitle: 'Complete your first deposit and unlock the platform.',
            mainTitle: 'Everything is ready. Only the funding step is missing.',
            introLead: 'Your account is set up. The next stage starts with the first deposit.',
            bodyOne:
              'This is the moment to move from interest to activation and unlock the platform.',
            bodyTwo: 'To make the next step easier, focus on these three points:',
            boxOneTitle: 'Timing',
            boxOneCopy: 'Take action now',
            boxTwoTitle: 'Access',
            boxTwoCopy: 'Unlock full experience',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Available if needed',
            ...UNFUNDED_ICON_SETS.depositPush,
            bodyThree:
              'If you are ready, go straight to the platform and complete the deposit flow.',
            bodyFour: 'Delaying adds hesitation. Acting now keeps the process simpler.',
            ctaLabel: 'Complete Your First Deposit',
            ctaHelper: 'Open the platform and finish the funding step now',
            supportLabel: 'Need help only if something blocks you?',
            supportHelper: 'Use WhatsApp only for a specific issue',
          },
        },
        {
          name: 'Unfunded Newcomers - First Deposit Push B',
          description:
            'Momentum-led variant focused on reducing delay and making the cost of waiting visible without sounding heavy.',
          subject: 'Do not lose momentum. Finish the funding step today.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Do not lose momentum',
            heroTitle: 'Keep your momentum',
            heroSubtitle: 'The next step is easiest while your setup is still fresh.',
            mainTitle: 'Waiting makes the decision heavier than it needs to be.',
            introLead:
              'You already did the setup work. Completing the deposit now keeps the path light.',
            bodyOne:
              'The strongest move is often the simplest one: go back in, complete the step, and move on.',
            bodyTwo: 'What matters most right now:',
            boxOneTitle: 'Momentum',
            boxOneCopy: 'Act while ready',
            boxTwoTitle: 'Progress',
            boxTwoCopy: 'Move to activation',
            boxThreeTitle: 'Backup',
            boxThreeCopy: 'Support if blocked',
            ...UNFUNDED_ICON_SETS.depositMomentum,
            bodyThree: 'Treat this as the completion of setup, not as a separate decision.',
            bodyFour:
              'If one blocker remains, support is there, but reopening the platform stays first.',
            ctaLabel: 'Finish the Funding Step',
            ctaHelper: 'Return to the platform and complete the account setup',
            supportLabel: 'One blocker left? Use WhatsApp support',
            supportHelper: 'Support is secondary and removes only the last obstacle',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Primo Deposito A',
          description:
            'Variante conversion-focused con urgenza controllata e piattaforma come destinazione principale.',
          subject: 'Il tuo accesso Bullwaves è quasi sbloccato. Completa ora il primo deposito.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Completa il tuo primo deposito',
            heroTitle: "A un passo dall'accesso completo",
            heroSubtitle: 'Completa il primo deposito e sblocca la piattaforma.',
            mainTitle: 'È tutto pronto. Manca solo il passaggio di deposito.',
            introLead: 'Il tuo account è configurato. La fase successiva parte dal primo deposito.',
            bodyOne:
              "Questo è il momento di passare dall'interesse all'attivazione e sbloccare la piattaforma.",
            bodyTwo:
              'Per rendere il prossimo passaggio più semplice, concentrati su questi tre punti:',
            boxOneTitle: 'Tempismo',
            boxOneCopy: 'Agisci adesso',
            boxTwoTitle: 'Accesso',
            boxTwoCopy: 'Sblocca l esperienza',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Disponibile se serve',
            ...UNFUNDED_ICON_SETS.depositPush,
            bodyThree: 'Se sei pronto, entra in piattaforma e completa il flusso di deposito.',
            bodyFour: "Rimandare aumenta l'esitazione. Muoversi ora rende tutto più semplice.",
            ctaLabel: 'Completa il Primo Deposito',
            ctaHelper: 'Apri la piattaforma e chiudi ora il passaggio di deposito',
            supportLabel: 'Ti serve aiuto solo se qualcosa ti blocca?',
            supportHelper: 'Usa WhatsApp solo per un problema preciso',
          },
        },
        {
          name: 'Unfunded Newcomers - Primo Deposito B',
          description:
            'Variante momentum-led che riduce il rinvio e rende visibile il costo dell attesa senza appesantire il tono.',
          subject: 'Non perdere slancio. Completa oggi il deposito del tuo account.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Non perdere slancio',
            heroTitle: 'Mantieni lo slancio',
            heroSubtitle: 'Il prossimo passo è più facile finché la configurazione è fresca.',
            mainTitle: 'Aspettare rende la decisione più pesante del necessario.',
            introLead:
              'Hai già completato la configurazione. Completare il deposito ora rende tutto più leggero.',
            bodyOne:
              'Il punto migliore spesso è il più semplice: rientrare, completare il deposito e proseguire.',
            bodyTwo: 'Cosa conta di più adesso:',
            boxOneTitle: 'Slancio',
            boxOneCopy: 'Agisci mentre sei pronto',
            boxTwoTitle: 'Progresso',
            boxTwoCopy: "Passa all'attivazione",
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Supporto se bloccato',
            ...UNFUNDED_ICON_SETS.depositMomentum,
            bodyThree:
              'Tratta questo passaggio come il completamento naturale della configurazione.',
            bodyFour:
              "Se resta un blocco preciso, il supporto c'è, ma il percorso principale resta la piattaforma.",
            ctaLabel: 'Completa il Deposito',
            ctaHelper: 'Rientra in piattaforma e completa la configurazione del tuo account',
            supportLabel: 'Hai ancora un blocco? Usa il supporto WhatsApp',
            supportHelper: "Il supporto resta secondario e rimuove l'ultimo ostacolo",
          },
        }
      ),
    },
  },
  unfunded_newcomers_first_trade_onboarding_email: {
    id: 'unfunded_newcomers_first_trade_onboarding_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - First Trade Onboarding A',
          description:
            'Post-FTD onboarding variant that makes the first trade feel structured, simple, and immediately actionable.',
          subject: 'Your account is funded. Now make your first move.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Your account is funded',
            heroTitle: 'One step away',
            heroSubtitle: 'Your account is funded. Now place your first move.',
            mainTitle: 'You have already completed the most important step.',
            introLead:
              'Your account is funded and ready. The only thing missing now is your first trade.',
            bodyOne:
              'Every trade follows the same structure, so the first one does not need to be complex.',
            bodyTwo: 'Focus on these three elements when you place your first position:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'Up or down',
            boxTwoTitle: 'Entry',
            boxTwoCopy: 'Open position',
            boxThreeTitle: 'Risk',
            boxThreeCopy: 'Set your limit',
            ...UNFUNDED_ICON_SETS.firstTradeStructured,
            bodyThree:
              'Starting small is often the best way to learn the platform and build confidence.',
            bodyFour:
              'If you need support, it is there, but the next move is to enter the platform and trade.',
            ctaLabel: 'Open Your Platform',
            ctaHelper: 'Place your first trade when you are ready',
            supportLabel: 'Need guidance before trading?',
            supportHelper: 'WhatsApp stays secondary',
          },
        },
        {
          name: 'Unfunded Newcomers - First Trade Onboarding B',
          description:
            'Confidence-led onboarding variant that lowers fear around the first position and frames action as a learning step.',
          subject: 'Your first trade does not need to be complicated.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your first trade can stay simple',
            heroTitle: 'Keep the first step simple',
            heroSubtitle: 'Your first position is about flow, not perfection.',
            mainTitle: 'A simple first trade is often the smartest one.',
            introLead:
              'Now that the account is funded, the best next move is a small and clear first action.',
            bodyOne:
              'You do not need a perfect setup. You need a clear structure and an easy first move.',
            bodyTwo: 'Keep your first move anchored to these three basics:',
            boxOneTitle: 'Bias',
            boxOneCopy: 'Pick a direction',
            boxTwoTitle: 'Action',
            boxTwoCopy: 'Enter the trade',
            boxThreeTitle: 'Control',
            boxThreeCopy: 'Define the risk',
            ...UNFUNDED_ICON_SETS.firstTradeConfidence,
            bodyThree:
              'The value of the first trade is also the confidence you build from the full flow.',
            bodyFour:
              'If one question remains, support is there, but the main path stays simple: open the platform.',
            ctaLabel: 'Place Your First Trade',
            ctaHelper: 'Use a simple first setup and get familiar with the flow',
            supportLabel: 'Need one quick answer before starting?',
            supportHelper: 'Support stays secondary to the platform action',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Onboarding Primo Trade A',
          description:
            'Variante post-FTD che rende il primo trade semplice, strutturato e subito azionabile.',
          subject: 'Il tuo account è finanziato. Ora fai il tuo primo passo.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Il tuo account è finanziato',
            heroTitle: 'A un passo',
            heroSubtitle: 'Il tuo account è finanziato. Ora fai il primo movimento.',
            mainTitle: 'Hai già completato il passaggio più importante.',
            introLead:
              'Il tuo account è finanziato ed è pronto. Ora manca solo la prima operazione.',
            bodyOne:
              'Ogni operazione segue la stessa struttura, quindi la prima non va complicata.',
            bodyTwo: 'Concentrati su questi tre elementi quando apri la tua prima posizione:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Su o giù',
            boxTwoTitle: 'Ingresso',
            boxTwoCopy: 'Apri posizione',
            boxThreeTitle: 'Rischio',
            boxThreeCopy: 'Imposta il limite',
            ...UNFUNDED_ICON_SETS.firstTradeStructured,
            bodyThree:
              'Partire in piccolo è spesso il modo migliore per capire la piattaforma e prendere confidenza.',
            bodyFour: "Se ti serve supporto, c'è, ma la mossa principale resta entrare e operare.",
            ctaLabel: 'Apri la Piattaforma',
            ctaHelper: 'Inserisci la tua prima operazione quando vuoi',
            supportLabel: 'Hai bisogno di guida prima di operare?',
            supportHelper: 'WhatsApp resta un supporto secondario',
          },
        },
        {
          name: 'Unfunded Newcomers - Onboarding Primo Trade B',
          description:
            'Variante confidence-led che riduce la paura della prima posizione e presenta l azione come passaggio di apprendimento.',
          subject: 'La tua prima operazione non deve essere complicata.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'La tua prima operazione può restare semplice',
            heroTitle: 'Tieni semplice il primo passo',
            heroSubtitle: 'La prima posizione serve a prendere familiarità con il flusso.',
            mainTitle: 'Una prima operazione semplice è spesso la più intelligente.',
            introLead:
              "Ora che l'account è finanziato, la mossa migliore è una prima azione piccola e chiara.",
            bodyOne:
              'Non ti serve una configurazione perfetta. Ti serve una struttura chiara e semplice.',
            bodyTwo: 'Tieni il primo movimento ancorato a queste tre basi:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Scegli una direzione',
            boxTwoTitle: 'Azione',
            boxTwoCopy: "Apri l'operazione",
            boxThreeTitle: 'Controllo',
            boxThreeCopy: 'Definisci il rischio',
            ...UNFUNDED_ICON_SETS.firstTradeConfidence,
            bodyThree:
              'Il valore della prima operazione è anche la fiducia che costruisci sul flusso.',
            bodyFour:
              "Se resta un dubbio, il supporto c'è, ma il percorso principale resta aprire la piattaforma.",
            ctaLabel: 'Fai la Prima Operazione',
            ctaHelper: 'Usa una configurazione semplice e prendi confidenza con il flusso',
            supportLabel: 'Ti serve una risposta rapida prima di iniziare?',
            supportHelper: "Il supporto resta secondario rispetto all'azione in piattaforma",
          },
        }
      ),
    },
  },
  unfunded_newcomers_reentry_nurture_email: {
    id: 'unfunded_newcomers_reentry_nurture_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Re-entry Nurture A',
          description:
            'Soft reactivation variant that reopens the path with lower pressure and clearer relevance.',
          subject: 'Still considering Bullwaves? Let us make the next step easier.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Still considering Bullwaves?',
            heroTitle: 'The next step can stay simple',
            heroSubtitle: 'If the timing was off before, you can restart clearly.',
            mainTitle: 'You do not need to start over. You only need a better angle.',
            introLead:
              'If you looked at the platform but did not deposit, interest is likely there but timing was off.',
            bodyOne:
              'This follow-up reopens the path without pressure and gives you a cleaner way forward.',
            bodyTwo: 'What changes in this restart approach:',
            boxOneTitle: 'Simpler',
            boxOneCopy: 'Less friction',
            boxTwoTitle: 'Relevant',
            boxTwoCopy: 'A fresher angle',
            boxThreeTitle: 'Supported',
            boxThreeCopy: 'Help if needed',
            ...UNFUNDED_ICON_SETS.reentrySoft,
            bodyThree:
              'You can revisit your area, review the route, and move only when it feels clear.',
            bodyFour:
              'If one obstacle remains, support can help, but re-entering the account stays first.',
            ctaLabel: 'Reopen Your Client Area',
            ctaHelper: 'Take another look with a simpler path in mind',
            supportLabel: 'Need help removing one blocker?',
            supportHelper: 'Use WhatsApp only for one specific issue',
          },
        },
        {
          name: 'Unfunded Newcomers - Re-entry Nurture B',
          description:
            'Renewed-opportunity variant focused on restoring momentum rather than pushing urgency.',
          subject: 'Your opportunity is still open. Re-enter with a clearer path.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Your opportunity is still open',
            heroTitle: 'You can still restart easily',
            heroSubtitle: 'A missed step earlier does not reset everything.',
            mainTitle: 'The path is still there. It just needs a cleaner restart.',
            introLead:
              'If you paused earlier, the next move is not to rebuild everything. It is simply to return clearly.',
            bodyOne:
              'That keeps the process lighter while still giving you a practical way to continue.',
            bodyTwo: 'What this restart gives you:',
            boxOneTitle: 'Reset',
            boxOneCopy: 'Fresh perspective',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'One clear next step',
            boxThreeTitle: 'Backup',
            boxThreeCopy: 'Support if blocked',
            ...UNFUNDED_ICON_SETS.reentryOpportunity,
            bodyThree:
              'Go back into the account, recheck the path, and continue only if it now feels natural.',
            bodyFour:
              'If something still blocks you, support is there, but reopening the platform stays first.',
            ctaLabel: 'Return to Your Account',
            ctaHelper: 'Re-enter with a clearer, lighter next step',
            supportLabel: 'Still blocked? Use WhatsApp support',
            supportHelper: 'Human support stays secondary to the platform restart',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Riattivazione Soft A',
          description:
            'Variante soft reactivation che riapre il percorso con meno pressione e maggiore rilevanza percepita.',
          subject: 'Stai ancora valutando Bullwaves? Rendiamo il prossimo passo più semplice.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Stai ancora valutando Bullwaves?',
            heroTitle: 'Il prossimo passo può restare semplice',
            heroSubtitle: 'Se prima non era il momento, puoi ripartire con chiarezza.',
            mainTitle: 'Non devi ripartire da zero. Ti serve solo un angolo migliore.',
            introLead:
              "Se hai guardato la piattaforma ma non hai depositato, l'interesse c'è, ma il momento non era giusto.",
            bodyOne: 'Questo follow-up riapre il percorso senza pressione e con più chiarezza.',
            bodyTwo: 'Cosa cambia in questo nuovo tentativo:',
            boxOneTitle: 'Più semplice',
            boxOneCopy: 'Meno attrito',
            boxTwoTitle: 'Più rilevante',
            boxTwoCopy: 'Angolo più fresco',
            boxThreeTitle: 'Più assistito',
            boxThreeCopy: 'Aiuto se serve',
            ...UNFUNDED_ICON_SETS.reentrySoft,
            bodyThree:
              'Puoi rientrare, rivedere il percorso e muoverti solo quando tutto ti sembra chiaro.',
            bodyFour:
              "Se resta un ostacolo, il supporto può aiutarti, ma rientrare nell'account resta il primo passo.",
            ctaLabel: 'Riapri la tua Area Personale',
            ctaHelper: 'Rientra con un percorso più semplice in mente',
            supportLabel: 'Hai bisogno di rimuovere un blocco?',
            supportHelper: 'Usa WhatsApp solo per un problema specifico',
          },
        },
        {
          name: 'Unfunded Newcomers - Riattivazione Soft B',
          description:
            "Variante renewed-opportunity orientata a ripristinare il momentum piuttosto che spingere l'urgenza.",
          subject: 'La tua opportunità è ancora aperta. Rientra con un percorso più chiaro.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'La tua opportunità è ancora aperta',
            heroTitle: 'Puoi ancora ripartire facilmente',
            heroSubtitle: 'Un passaggio mancato non ti riporta a zero.',
            mainTitle: 'Il percorso esiste ancora. Serve solo una ripartenza più pulita.',
            introLead:
              'Se ti sei fermato prima, la mossa successiva non è rifare tutto. È rientrare con più chiarezza.',
            bodyOne:
              'Questo approccio rende il processo più leggero e ti lascia un modo pratico per proseguire.',
            bodyTwo: 'Cosa ti offre questa ripartenza:',
            boxOneTitle: 'Reset',
            boxOneCopy: 'Prospettiva nuova',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Un solo passaggio chiaro',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Supporto se bloccato',
            ...UNFUNDED_ICON_SETS.reentryOpportunity,
            bodyThree:
              "Rientra nell'account, ricontrolla il percorso e continua solo se ora ti sembra naturale.",
            bodyFour:
              "Se qualcosa ti blocca ancora, il supporto c'è, ma la mossa migliore resta riaprire la piattaforma.",
            ctaLabel: 'Torna al tuo Account',
            ctaHelper: 'Rientra con un prossimo passaggio più leggero e più chiaro',
            supportLabel: 'Sei ancora bloccato? Usa il supporto WhatsApp',
            supportHelper: 'Il supporto umano resta secondario rispetto al riavvio in piattaforma',
          },
        }
      ),
    },
  },
  ...additionalSegmentJourneyTemplatesById,
}
