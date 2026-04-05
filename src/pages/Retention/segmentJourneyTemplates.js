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
          subject: 'Il tuo account Bullwaves e pronto. Ti manca solo un passo.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo account Bullwaves e pronto',
            heroTitle: 'Il tuo account e pronto',
            heroSubtitle: 'Un deposito sicuro sblocca il tuo accesso Bullwaves.',
            mainTitle: 'Hai gia completato il primo passo: la registrazione.',
            introLead:
              'Il tuo account e attivo. Il deposito sblocca area personale, strumenti e supporto.',
            bodyOne: 'Il percorso e semplice: pagamenti sicuri, guida chiara e aiuto se serve.',
            bodyTwo: 'Ecco il valore che ottieni subito appena procedi:',
            boxOneTitle: 'Sicurezza',
            boxOneCopy: 'Accesso protetto',
            boxTwoTitle: 'Deposito',
            boxTwoCopy: 'Metodi rapidi',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Guida umana reale',
            ...UNFUNDED_ICON_SETS.welcomeTrust,
            bodyThree:
              'Il primo deposito serve solo a sbloccare l ambiente completo e valutarlo meglio.',
            bodyFour:
              'Se ti serve aiuto, il supporto c e, ma il passo dopo resta sbloccare l account.',
            ctaLabel: 'Apri la tua Area Personale',
            ctaHelper: 'Controlla l account e continua',
            supportLabel: 'Hai bisogno di aiuto prima? Scrivici su WhatsApp',
            supportHelper: 'Usa il supporto solo per un chiarimento rapido',
          },
        },
        {
          name: 'Unfunded Newcomers - Welcome + Proposta di Valore B',
          description:
            'Variante benefit-led orientata ad accesso, semplicita di onboarding e riduzione dell esitazione prima del primo deposito.',
          subject: 'Registrazione completata. Sblocca il prossimo passaggio su Bullwaves.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Sblocca il prossimo passaggio',
            heroTitle: 'Sei quasi dentro',
            heroSubtitle: 'La registrazione e fatta. Attiva il tuo accesso.',
            mainTitle: 'La parte piu tecnica e gia alle spalle.',
            introLead:
              'Il tuo profilo e pronto. Finanziare il conto apre la vera esperienza Bullwaves.',
            bodyOne:
              'Il prossimo passo e piu semplice di quanto sembri: entri, valuti il percorso e procedi.',
            bodyTwo: 'Cosa sblocchi appena continui:',
            boxOneTitle: 'Accesso',
            boxOneCopy: 'Area personale pronta',
            boxTwoTitle: 'Semplicita',
            boxTwoCopy: 'Prossimo passaggio chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Supporto se serve',
            ...UNFUNDED_ICON_SETS.welcomeValue,
            bodyThree:
              'Qui conta lo slancio, non la pressione. Muoversi ora rende tutto piu lineare.',
            bodyFour:
              'Se qualcosa non e chiaro, il supporto resta disponibile, ma attivare l account viene prima.',
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
          subject: 'Hai dubbi prima di depositare? Ecco il modo piu semplice per procedere.',
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
              'Per questo il percorso e piu lineare: piu chiarezza, meno dubbi, un passo diretto.',
            bodyTwo: 'Ecco i tre punti che contano di piu prima del primo deposito:',
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
              'La priorita resta semplice: rivedere il percorso e procedere dalla piattaforma.',
            ctaLabel: 'Controlla le Opzioni di Deposito',
            ctaHelper: 'Apri la piattaforma e verifica il percorso',
            supportLabel: 'Ti serve un chiarimento su WhatsApp?',
            supportHelper: 'L aiuto umano resta secondario alla piattaforma',
          },
        },
        {
          name: 'Unfunded Newcomers - Riduzione Attriti B',
          description:
            'Variante reassurance-led che abbassa la resistenza emotiva e lascia il supporto come backup invece che come percorso principale.',
          subject: 'Sei ancora indeciso? Il deposito potrebbe essere piu semplice di quanto pensi.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Sei ancora indeciso?',
            heroTitle: 'Esiste un percorso leggero',
            heroSubtitle: 'Se prima sembrava pesante, ora il deposito e piu semplice.',
            mainTitle: 'Forse non ti serve piu tempo. Ti serve meno attrito.',
            introLead:
              'Quando un utente si ferma qui, spesso il passo dopo sembra piu grande di quanto sia.',
            bodyOne:
              'La mossa migliore e riaprire il percorso di deposito con un criterio piu semplice.',
            bodyTwo: 'Cosa ti offre questo percorso piu chiaro:',
            boxOneTitle: 'Meno dubbi',
            boxOneCopy: 'Risposte prima di agire',
            boxTwoTitle: 'Meno sforzo',
            boxTwoCopy: 'Flusso piu pulito',
            boxThreeTitle: 'Meno pressione',
            boxThreeCopy: 'Supporto sullo sfondo',
            ...UNFUNDED_ICON_SETS.frictionRelief,
            bodyThree:
              'Rientra nell account, rivedi il percorso e usa il supporto solo per un blocco preciso.',
            bodyFour: 'Cosi il prossimo passaggio resta focalizzato, senza conversazioni inutili.',
            ctaLabel: 'Riapri il Percorso di Deposito',
            ctaHelper: 'Riguarda il percorso con un criterio piu semplice',
            supportLabel: 'Hai un blocco preciso? Scrivici su WhatsApp',
            supportHelper: 'WhatsApp resta un supporto di riserva',
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
          subject: 'Il tuo accesso Bullwaves e quasi sbloccato. Completa ora il primo deposito.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Completa il tuo primo deposito',
            heroTitle: 'A un passo dall accesso completo',
            heroSubtitle: 'Completa il primo deposito e sblocca la piattaforma.',
            mainTitle: 'E tutto pronto. Manca solo il passaggio di deposito.',
            introLead: 'Il tuo account e configurato. La fase successiva parte dal primo deposito.',
            bodyOne:
              'Questo e il momento di passare dall interesse all attivazione e sbloccare la piattaforma.',
            bodyTwo:
              'Per rendere il prossimo passaggio piu semplice, concentrati su questi tre punti:',
            boxOneTitle: 'Tempismo',
            boxOneCopy: 'Agisci adesso',
            boxTwoTitle: 'Accesso',
            boxTwoCopy: 'Sblocca l esperienza',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Disponibile se serve',
            ...UNFUNDED_ICON_SETS.depositPush,
            bodyThree: 'Se sei pronto, entra in piattaforma e completa il flusso di deposito.',
            bodyFour: 'Rimandare aumenta l esitazione. Muoversi ora rende tutto piu semplice.',
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
            heroSubtitle: 'Il prossimo passo e piu facile finche la configurazione e fresca.',
            mainTitle: 'Aspettare rende la decisione piu pesante del necessario.',
            introLead:
              'Hai gia completato la configurazione. Completare il deposito ora rende tutto piu leggero.',
            bodyOne:
              'Il punto migliore spesso e il piu semplice: rientrare, completare il deposito e proseguire.',
            bodyTwo: 'Cosa conta di piu adesso:',
            boxOneTitle: 'Slancio',
            boxOneCopy: 'Agisci mentre sei pronto',
            boxTwoTitle: 'Progresso',
            boxTwoCopy: 'Passa all attivazione',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Supporto se bloccato',
            ...UNFUNDED_ICON_SETS.depositMomentum,
            bodyThree:
              'Tratta questo passaggio come il completamento naturale della configurazione.',
            bodyFour:
              'Se resta un blocco preciso, il supporto c e, ma il percorso principale resta la piattaforma.',
            ctaLabel: 'Completa il Deposito',
            ctaHelper: 'Rientra in piattaforma e completa la configurazione del tuo account',
            supportLabel: 'Hai ancora un blocco? Usa il supporto WhatsApp',
            supportHelper: 'Il supporto resta secondario e rimuove l ultimo ostacolo',
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
          subject: 'Il tuo account e finanziato. Ora fai il tuo primo passo.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Il tuo account e finanziato',
            heroTitle: 'A un passo',
            heroSubtitle: 'Il tuo account e finanziato. Ora fai il primo movimento.',
            mainTitle: 'Hai gia completato il passaggio piu importante.',
            introLead: 'Il tuo account e finanziato e pronto. Ora manca solo la prima operazione.',
            bodyOne:
              'Ogni operazione segue la stessa struttura, quindi la prima non va complicata.',
            bodyTwo: 'Concentrati su questi tre elementi quando apri la tua prima posizione:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Su o giu',
            boxTwoTitle: 'Ingresso',
            boxTwoCopy: 'Apri posizione',
            boxThreeTitle: 'Rischio',
            boxThreeCopy: 'Imposta il limite',
            ...UNFUNDED_ICON_SETS.firstTradeStructured,
            bodyThree:
              'Partire in piccolo e spesso il modo migliore per capire la piattaforma e prendere confidenza.',
            bodyFour: 'Se ti serve supporto, c e, ma la mossa principale resta entrare e operare.',
            ctaLabel: 'Apri la Piattaforma',
            ctaHelper: 'Inserisci la tua prima operazione quando vuoi',
            supportLabel: 'Hai bisogno di guida prima di operare?',
            supportHelper: 'WhatsApp resta un supporto secondario',
          },
        },
        {
          name: 'Unfunded Newcomers - Onboarding Primo Trade B',
          description:
            'Variante confidence-led che riduce la paura della prima posizione e presenta l azione come step di apprendimento.',
          subject: 'La tua prima operazione non deve essere complicata.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'La tua prima operazione puo restare semplice',
            heroTitle: 'Tieni semplice il primo passo',
            heroSubtitle: 'La prima posizione serve a prendere familiarita col flusso.',
            mainTitle: 'Una prima operazione semplice e spesso la piu intelligente.',
            introLead:
              'Ora che l account e finanziato, la mossa migliore e una prima azione piccola e chiara.',
            bodyOne:
              'Non ti serve una configurazione perfetta. Ti serve una struttura chiara e semplice.',
            bodyTwo: 'Tieni il primo movimento ancorato a queste tre basi:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Scegli una direzione',
            boxTwoTitle: 'Azione',
            boxTwoCopy: 'Apri l operazione',
            boxThreeTitle: 'Controllo',
            boxThreeCopy: 'Definisci il rischio',
            ...UNFUNDED_ICON_SETS.firstTradeConfidence,
            bodyThree:
              'Il valore della prima operazione e anche la fiducia che costruisci sul flusso.',
            bodyFour:
              'Se resta un dubbio, il supporto c e, ma il percorso principale resta aprire la piattaforma.',
            ctaLabel: 'Fai la Prima Operazione',
            ctaHelper: 'Usa una configurazione semplice e prendi confidenza con il flusso',
            supportLabel: 'Ti serve una risposta rapida prima di iniziare?',
            supportHelper: 'Il supporto resta secondario rispetto all azione in piattaforma',
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
          subject: 'Stai ancora valutando Bullwaves? Rendiamo il prossimo passo piu semplice.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Stai ancora valutando Bullwaves?',
            heroTitle: 'Il prossimo passo puo restare semplice',
            heroSubtitle: 'Se prima non era il momento, puoi ripartire con chiarezza.',
            mainTitle: 'Non devi ripartire da zero. Ti serve solo un angolo migliore.',
            introLead:
              'Se hai guardato la piattaforma ma non hai depositato, l interesse c e ma il momento non era giusto.',
            bodyOne: 'Questo follow-up riapre il percorso senza pressione e con piu chiarezza.',
            bodyTwo: 'Cosa cambia in questo nuovo tentativo:',
            boxOneTitle: 'Piu semplice',
            boxOneCopy: 'Meno attrito',
            boxTwoTitle: 'Piu rilevante',
            boxTwoCopy: 'Angolo piu fresco',
            boxThreeTitle: 'Piu assistito',
            boxThreeCopy: 'Aiuto se serve',
            ...UNFUNDED_ICON_SETS.reentrySoft,
            bodyThree:
              'Puoi rientrare, rivedere il percorso e muoverti solo quando tutto ti sembra chiaro.',
            bodyFour:
              'Se resta un ostacolo, il supporto puo aiutarti, ma rientrare nell account resta il primo passo.',
            ctaLabel: 'Riapri la tua Area Personale',
            ctaHelper: 'Rientra con un percorso piu semplice in mente',
            supportLabel: 'Hai bisogno di rimuovere un blocco?',
            supportHelper: 'Usa WhatsApp solo per un problema specifico',
          },
        },
        {
          name: 'Unfunded Newcomers - Riattivazione Soft B',
          description:
            'Variante renewed-opportunity orientata a ripristinare il momentum piuttosto che spingere l urgenza.',
          subject: 'La tua opportunita e ancora aperta. Rientra con un percorso piu chiaro.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'La tua opportunita e ancora aperta',
            heroTitle: 'Puoi ancora ripartire facilmente',
            heroSubtitle: 'Un passaggio mancato non ti riporta a zero.',
            mainTitle: 'Il percorso esiste ancora. Serve solo una ripartenza piu pulita.',
            introLead:
              'Se ti sei fermato prima, la mossa successiva non e rifare tutto. E rientrare con piu chiarezza.',
            bodyOne:
              'Questo approccio rende il processo piu leggero e ti lascia un modo pratico per proseguire.',
            bodyTwo: 'Cosa ti offre questa ripartenza:',
            boxOneTitle: 'Reset',
            boxOneCopy: 'Prospettiva nuova',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Un solo passaggio chiaro',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Supporto se bloccato',
            ...UNFUNDED_ICON_SETS.reentryOpportunity,
            bodyThree:
              'Rientra nell account, ricontrolla il percorso e continua solo se ora ti sembra naturale.',
            bodyFour:
              'Se qualcosa ti blocca ancora, il supporto c e, ma la mossa migliore resta riaprire la piattaforma.',
            ctaLabel: 'Torna al tuo Account',
            ctaHelper: 'Rientra con un prossimo passaggio piu leggero e piu chiaro',
            supportLabel: 'Sei ancora bloccato? Usa il supporto WhatsApp',
            supportHelper: 'Il supporto umano resta secondario rispetto al riavvio in piattaforma',
          },
        }
      ),
    },
  },
  ...additionalSegmentJourneyTemplatesById,
}
