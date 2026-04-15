import { makeLocaleVariants } from './segmentJourneyTemplateBuilder.js'
import { additionalSegmentJourneyTemplatesById } from './additionalSegmentJourneyTemplates.js'
import { createJourneyIconSelection } from './emailJourneyIconRegistry.js'

const UNFUNDED_ICON_SETS = {
  welcomeTrust: createJourneyIconSelection({
    boxOneKey: 'secure_approval_badge',
    boxTwoKey: 'funding_hand_transfer',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['onboarding', 'account'],
    rationale:
      'Welcome trust: sicurezza, funding e presenza account devono restare immediati e coerenti.',
  }),
  welcomeValue: createJourneyIconSelection({
    boxOneKey: 'user_account_profile',
    boxTwoKey: 'onboarding_calendar',
    boxThreeKey: 'secure_approval_badge',
    recommendedGroups: ['account', 'onboarding'],
    rationale:
      'Welcome value: accesso, semplicità e fiducia seguono una sequenza account, orientamento, rassicurazione.',
  }),
  frictionClarity: createJourneyIconSelection({
    boxOneKey: 'onboarding_calendar',
    boxTwoKey: 'funding_hand_transfer',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['onboarding', 'account'],
    rationale:
      'Riduzione attrito: chiarezza del percorso, pagamenti e guida restano nell’area onboarding/account.',
  }),
  frictionRelief: createJourneyIconSelection({
    boxOneKey: 'secure_approval_badge',
    boxTwoKey: 'funding_hand_transfer',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['onboarding', 'account'],
    rationale:
      'Friction relief: rassicurazione, funding chiaro e supporto leggero, senza introdurre urgenza visiva.',
  }),
  accountActivationReminder: createJourneyIconSelection({
    boxOneKey: 'user_account_profile',
    boxTwoKey: 'onboarding_calendar',
    boxThreeKey: 'secure_approval_badge',
    recommendedGroups: ['account', 'onboarding'],
    rationale:
      'Reminder accesso: account, orientamento e fiducia devono restare leggibili al primo sguardo.',
  }),
  postLoginDepositActivation: createJourneyIconSelection({
    boxOneKey: 'funding_hand_transfer',
    boxTwoKey: 'market_growth_chart',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['account', 'trading'],
    rationale:
      'Post-login deposit: funding, progresso e aiuto account devono spingere avanti senza cambiare linguaggio visivo.',
  }),
  intentRecovery: createJourneyIconSelection({
    boxOneKey: 'onboarding_calendar',
    boxTwoKey: 'funding_hand_transfer',
    boxThreeKey: 'secure_approval_badge',
    recommendedGroups: ['onboarding', 'account'],
    rationale:
      'Intent recovery: il focus è rendere visibile il prossimo passo con chiarezza e fiducia.',
  }),
  depositPush: createJourneyIconSelection({
    boxOneKey: 'time_recovery_clock',
    boxTwoKey: 'user_account_profile',
    boxThreeKey: 'funding_hand_transfer',
    recommendedGroups: ['onboarding', 'account'],
    rationale:
      'First deposit push: tempo, accesso e funding devono essere immediati e riconoscibili.',
  }),
  depositMomentum: createJourneyIconSelection({
    boxOneKey: 'time_recovery_clock',
    boxTwoKey: 'market_growth_chart',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['onboarding', 'trading', 'account'],
    rationale:
      'Momentum: tempo, progresso e supporto leggero devono restare i tre segnali principali.',
  }),
  firstTradeStructured: createJourneyIconSelection({
    boxOneKey: 'market_growth_chart',
    boxTwoKey: 'trading_setup_controls',
    boxThreeKey: 'trading_setup_controls',
    recommendedGroups: ['trading'],
    rationale:
      'First trade structured: direzione, entrata e rischio devono vivere tutte nella stessa grammatica trading.',
  }),
  firstTradeConfidence: createJourneyIconSelection({
    boxOneKey: 'market_growth_chart',
    boxTwoKey: 'trading_setup_controls',
    boxThreeKey: 'secure_approval_badge',
    recommendedGroups: ['trading', 'onboarding'],
    rationale:
      'First trade confidence: direzione, azione e controllo devono restare chiari, con una chiusura più rassicurante.',
  }),
  reentrySoft: createJourneyIconSelection({
    boxOneKey: 'onboarding_calendar',
    boxTwoKey: 'experience_star',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['onboarding', 'trading', 'account'],
    rationale:
      'Re-entry soft: semplicità, esperienza più chiara e supporto discreto devono restare coerenti.',
  }),
  reentryOpportunity: createJourneyIconSelection({
    boxOneKey: 'market_growth_chart',
    boxTwoKey: 'onboarding_calendar',
    boxThreeKey: 'user_account_profile',
    recommendedGroups: ['trading', 'onboarding', 'account'],
    rationale:
      'Re-entry opportunity: opportunità, focus e account guidance devono parlare la stessa lingua.',
  }),
}

export const RECENTLY_UPDATED_SEGMENT_TEMPLATE_IDS = new Set([
  'unfunded_newcomers_welcome_value_email',
  'unfunded_newcomers_friction_reduction_email',
  'unfunded_newcomers_account_activation_reminder_email',
  'unfunded_newcomers_post_login_deposit_activation_email',
  'unfunded_newcomers_deposit_intent_recovery_email',
  'unfunded_newcomers_first_deposit_push_email',
  'unfunded_newcomers_first_trade_onboarding_email',
  'unfunded_newcomers_reentry_nurture_email',
])

export function isRecentlyUpdatedSegmentTemplate(templateId) {
  return RECENTLY_UPDATED_SEGMENT_TEMPLATE_IDS.has(String(templateId || '').trim())
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
            'Empathetic welcome variant that reassures the user and frames funding as a clear next step, without pressure.',
          subject: 'Your Bullwaves account is ready. The next step is available whenever you are.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your Bullwaves account is ready',
            heroTitle: 'Your account is ready',
            heroSubtitle:
              'You completed <strong>registration</strong>. The next step is <strong>clear</strong>.',
            mainTitle: 'Your registration is complete and your account is waiting for you.',
            introLead: 'Your account is active. Funding opens your client area and tools.',
            bodyOne: 'We kept it simple: secure payments, one clear step, support only if needed.',
            bodyTwo: 'Here is what helps most when you decide to move forward:',
            boxOneTitle: 'Security',
            boxOneCopy: 'Protected access',
            boxTwoTitle: 'Funding',
            boxTwoCopy: 'Fast payment options',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Real human guidance',
            ...UNFUNDED_ICON_SETS.welcomeTrust,
            bodyThree: 'A first deposit opens the full platform and your trading tools.',
            ctaLabel: 'Open Your Client Area',
            ctaHelper: 'Enter your area and take the next step',
          },
        },
        {
          name: 'Unfunded Newcomers - Welcome + Value Proposition B',
          description:
            'Softer welcome variant focused on access, simplicity, and helping the user continue without friction.',
          subject:
            'Your registration is complete. Your Bullwaves account is ready for the next step.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Unlock the next step',
            heroTitle: 'You are almost inside',
            heroSubtitle: '<strong>Registration</strong> is done. Your next step is ready.',
            mainTitle: 'The hardest part is already behind you.',
            introLead:
              'Your profile is ready. Continuing now makes the experience more <strong>complete</strong>.',
            bodyOne:
              'You do not need to do everything now. Open your area, review the path, and continue.',
            bodyTwo: 'What becomes clearer once you continue:',
            boxOneTitle: 'Access',
            boxOneCopy: 'Client area ready',
            boxTwoTitle: 'Simplicity',
            boxTwoCopy: 'Clear next step',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Support if needed',
            ...UNFUNDED_ICON_SETS.welcomeValue,
            ctaLabel: 'Unlock Your Access',
            ctaHelper: 'Enter your area and take the first step',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Welcome + Proposta di Valore A',
          description:
            'Variante welcome più empatica che rassicura l’utente e presenta il funding come passo naturale, senza pressione.',
          subject:
            'Il tuo account Bullwaves è pronto. Il prossimo passo è disponibile quando vuoi.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo account Bullwaves è pronto',
            heroTitle: 'Il tuo account è pronto',
            heroSubtitle:
              'Hai completato la <strong>registrazione</strong>. Il prossimo passo è <strong>chiaro</strong>.',
            mainTitle: 'La registrazione è completata e il tuo account ti sta aspettando.',
            introLead:
              'Il tuo account è attivo. Il deposito apre area personale e strumenti utili.',
            bodyOne:
              'Abbiamo tenuto tutto semplice: pagamenti sicuri, un passo chiaro, supporto solo se serve.',
            bodyTwo: 'Ecco cosa ti aiuta di più quando decidi di andare avanti:',
            boxOneTitle: 'Sicurezza',
            boxOneCopy: 'Accesso protetto',
            boxTwoTitle: 'Deposito',
            boxTwoCopy: 'Metodi rapidi',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Guida umana reale',
            ...UNFUNDED_ICON_SETS.welcomeTrust,
            bodyThree: 'Il primo deposito apre la piattaforma completa e gli strumenti di trading.',
            ctaLabel: 'Apri la tua Area Personale',
            ctaHelper: 'Entra nella tua area e fai il prossimo passo',
          },
        },
        {
          name: 'Unfunded Newcomers - Welcome + Proposta di Valore B',
          description:
            'Variante welcome più morbida, centrata su accesso, semplicità e continuità del percorso.',
          subject:
            'Registrazione completata. Il tuo account Bullwaves è pronto per il prossimo passo.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Sblocca il prossimo passaggio',
            heroTitle: 'Sei quasi dentro',
            heroSubtitle: 'La <strong>registrazione</strong> è fatta. Il prossimo passo è pronto.',
            mainTitle: 'La parte più tecnica è già alle spalle.',
            introLead:
              'Il tuo profilo è pronto. Continuare adesso rende l’esperienza più <strong>chiara</strong>.',
            bodyOne:
              'Non serve capire tutto subito. Entra nella tua area, guarda il percorso e decidi da lì.',
            bodyTwo: 'Cosa diventa più chiaro quando continui:',
            boxOneTitle: 'Accesso',
            boxOneCopy: 'Area personale pronta',
            boxTwoTitle: 'Semplicità',
            boxTwoCopy: 'Prossimo passaggio chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Supporto se serve',
            ...UNFUNDED_ICON_SETS.welcomeValue,
            ctaLabel: 'Sblocca il tuo Accesso',
            ctaHelper: 'Entra nella tua area e fai il primo passo',
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
            'Empathetic friction-reduction variant focused on reducing uncertainty before funding without sounding heavy.',
          subject: 'If you have questions before funding, here is a clearer way forward.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Questions before funding?',
            heroTitle: 'Make funding easier',
            heroSubtitle: 'A few <strong>clear answers</strong> can move you forward.',
            mainTitle: 'Most first deposits stop because of one simple doubt.',
            introLead:
              'Usually it is not lack of interest. It is one practical doubt about <strong>payment</strong>, timing, or the next step.',
            bodyOne:
              'That is why we simplified the path: clearer routes, fewer doubts, one visible action.',
            bodyTwo: 'These are the three points that usually help most before the first deposit:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'Simple answers first',
            boxTwoTitle: 'Payments',
            boxTwoCopy: 'Trusted routes',
            boxThreeTitle: 'Guidance',
            boxThreeCopy: 'Available if needed',
            ...UNFUNDED_ICON_SETS.frictionClarity,
            bodyThree: 'Review the deposit route first. That alone removes most hesitation.',
            ctaLabel: 'Review Deposit Options',
            ctaHelper: 'Open the platform and check the route',
          },
        },
        {
          name: 'Unfunded Newcomers - Friction Reduction B',
          description:
            'Reassurance-led variant that lowers emotional resistance and frames support as backup rather than the main path.',
          subject: 'The deposit step may be simpler than it seems.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Still hesitating?',
            heroTitle: 'A lighter path is here',
            heroSubtitle:
              'If funding felt heavy before, this path makes it <strong>lighter</strong>.',
            mainTitle: 'You may not need more time. You may just need less friction.',
            introLead: 'Users often pause here because the next step feels bigger than it is.',
            bodyOne: 'The best next move is simple: reopen the funding path with a lighter frame.',
            bodyTwo: 'What this clearer route gives you:',
            boxOneTitle: 'Less doubt',
            boxOneCopy: 'Answers before action',
            boxTwoTitle: 'Less effort',
            boxTwoCopy: 'Cleaner payment flow',
            boxThreeTitle: 'Less pressure',
            boxThreeCopy: 'Support in the background',
            ...UNFUNDED_ICON_SETS.frictionRelief,
            bodyThree:
              'Go back in, check the route once, and use support only for a concrete <strong>blocker</strong>.',
            ctaLabel: 'Reopen the Funding Path',
            ctaHelper: 'Check the route and move forward',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Riduzione Attriti A',
          description:
            'Variante più empatica per ridurre l’incertezza prima del funding senza appesantire il tono.',
          subject: 'Se hai dubbi prima di depositare, ecco un modo più chiaro per procedere.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Hai dubbi prima di depositare?',
            heroTitle: 'Rendiamo il deposito semplice',
            heroSubtitle: 'Poche <strong>risposte chiare</strong> possono farti andare avanti.',
            mainTitle: 'Molti primi depositi si fermano per un dubbio molto semplice.',
            introLead:
              'Di solito non manca interesse. C’è solo un dubbio pratico su <strong>pagamento</strong>, tempi o passaggio successivo.',
            bodyOne:
              'Per questo il percorso è più lineare: più chiarezza, meno dubbi, un solo passo visibile.',
            bodyTwo:
              'Questi sono i tre punti che di solito aiutano di più prima del primo deposito:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Risposte semplici',
            boxTwoTitle: 'Pagamenti',
            boxTwoCopy: 'Percorsi affidabili',
            boxThreeTitle: 'Guida',
            boxThreeCopy: 'Disponibile se serve',
            ...UNFUNDED_ICON_SETS.frictionClarity,
            bodyThree:
              'Controlla prima il percorso di deposito. Spesso è sufficiente per muoversi.',
            ctaLabel: 'Controlla le Opzioni di Deposito',
            ctaHelper: 'Apri la piattaforma e controlla il percorso',
          },
        },
        {
          name: 'Unfunded Newcomers - Riduzione Attriti B',
          description:
            'Variante reassurance-led che abbassa la resistenza emotiva e lascia il supporto come backup invece che come percorso principale.',
          subject: 'Il deposito potrebbe essere più semplice di quanto sembri.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Sei ancora indeciso?',
            heroTitle: 'Esiste un percorso leggero',
            heroSubtitle:
              'Se prima sembrava pesante, ora il deposito è più <strong>semplice</strong>.',
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
              'Rientra, controlla il percorso e usa il supporto solo per un <strong>blocco</strong> preciso.',
            ctaLabel: 'Riapri il Percorso di Deposito',
            ctaHelper: 'Controlla il percorso e porta avanti il prossimo passo',
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
          name: 'Unfunded Newcomers - +48hr No Deposit A',
          description:
            'Follow-up for users with no deposit after 48 hours. Direct, action-first variant.',
          subject: 'No deposit has been completed yet. Your next step is still open.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'No deposit in the first 48 hours',
            heroTitle: 'Now take one concrete step',
            heroSubtitle: 'Your account is ready. Start funding and move from setup to action.',
            mainTitle: 'The journey is still open because no deposit was completed yet.',
            introLead: 'You do not need a complex plan. You need one practical move today.',
            bodyOne: 'Open the deposit section, choose a method, and complete the step.',
            bodyTwo: 'Why acting now matters:',
            boxOneTitle: 'Momentum',
            boxOneCopy: 'You keep the flow active',
            boxTwoTitle: 'Progress',
            boxTwoCopy: 'You unlock full account usage',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Available if one blocker appears',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree: 'This is the final step on your onboarding path.',
            bodyFour: 'If one practical issue blocks you, use WhatsApp and close it fast.',
            ctaLabel: 'Complete Your First Deposit',
            ctaHelper: 'Start funding and close the pending step',
          },
        },
        {
          name: 'Unfunded Newcomers - +48hr No Deposit B',
          description:
            'Follow-up for users with no deposit after 48 hours. Urgency-led variant with clear next move.',
          subject: 'Your account is ready. The deposit step is still pending.',
          html: {
            lang: 'en',
            skin: 'dark',
            title: 'Do not leave the first step open',
            heroTitle: 'Convert interest into action',
            heroSubtitle: 'At +48h, the right move is clear: start the deposit step.',
            mainTitle: 'Waiting adds friction. Action removes it.',
            introLead: 'The account is already set. Funding is the only missing checkpoint.',
            bodyOne: 'Open the deposit route now and complete one focused action.',
            bodyTwo: 'What this unlocks immediately:',
            boxOneTitle: 'Activation',
            boxOneCopy: 'From setup to live account',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'No reset of momentum',
            boxThreeTitle: 'Control',
            boxThreeCopy: 'Support only if needed',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree: 'This is where setup ends and active trading begins.',
            bodyFour: 'If one obstacle stays open, use WhatsApp and close it fast.',
            ctaLabel: 'Start Deposit Now',
            ctaHelper: 'Open the deposit section and complete the step',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - +48h Nessun Deposito A',
          description:
            'Follow-up per utenti senza deposito dopo 48 ore. Variante diretta, orientata all azione.',
          subject: 'Il deposito non è ancora stato completato. Il prossimo passo è ancora aperto.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Nessun deposito nelle prime 48 ore',
            heroTitle: 'Ora serve un passo concreto',
            heroSubtitle:
              'Il tuo account è pronto. Avvia il funding e passa dalla configurazione all azione.',
            mainTitle: 'Il journey è ancora aperto perché il deposito non è stato completato.',
            introLead: 'Non serve un piano complesso. Serve una mossa pratica oggi.',
            bodyOne: 'Apri la sezione deposito, scegli un metodo e completa il passaggio.',
            bodyTwo: 'Perché agire ora conta:',
            boxOneTitle: 'Slancio',
            boxOneCopy: 'Mantieni il processo attivo',
            boxTwoTitle: 'Progresso',
            boxTwoCopy: 'Sblocchi l account completo',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Disponibile se emerge un blocco',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree: "È l'ultimo passo del tuo percorso di onboarding.",
            bodyFour: 'Se un blocco pratico è rimasto aperto, usa WhatsApp e chiudilo subito.',
            ctaLabel: 'Completa il Primo Deposito',
            ctaHelper: 'Avvia il funding e chiudi il passaggio aperto',
          },
        },
        {
          name: 'Unfunded Newcomers - +48h Nessun Deposito B',
          description:
            'Follow-up per utenti senza deposito dopo 48 ore. Variante urgency-led con prossimo passo esplicito.',
          subject: 'Il tuo account è pronto. Il passaggio di deposito è ancora da completare.',
          html: {
            lang: 'it',
            skin: 'dark',
            title: 'Non lasciare aperto il primo passaggio',
            heroTitle: 'Trasforma interesse in azione',
            heroSubtitle: 'A +48h la mossa giusta è chiara: avvia il deposito.',
            mainTitle: 'Rimandare crea attrito. Agire lo rimuove.',
            introLead: 'L account è già configurato. Il funding è l unico checkpoint mancante.',
            bodyOne: 'Apri subito il percorso deposito e completa una sola azione mirata.',
            bodyTwo: 'Cosa sblocchi immediatamente:',
            boxOneTitle: 'Attivazione',
            boxOneCopy: 'Da setup a account live',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Non azzeri lo slancio',
            boxThreeTitle: 'Controllo',
            boxThreeCopy: 'Supporto solo se serve',
            ...UNFUNDED_ICON_SETS.accountActivationReminder,
            bodyThree: 'Qui il setup si chiude e il trading reale inizia.',
            bodyFour: 'Se resta un ostacolo, usa WhatsApp e chiudilo subito.',
            ctaLabel: 'Avvia il Deposito Ora',
            ctaHelper: 'Apri la sezione deposito e completa il passaggio',
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
          name: 'Unfunded Newcomers - +48hr Deposit + Trade A',
          description:
            'Follow-up for users with deposit and open trade at +48h. Dedicated-manager support variant.',
          subject: 'Your account is active. Your dedicated account manager is now available.',
          html: {
            lang: 'en',
            skin: 'light',
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Hi Bullwaves, I completed my first deposit and opened my first trade. I would like to connect with my dedicated account manager.')}`,
            title: 'Strong start in the first 48 hours',
            heroTitle: 'Deposit completed. Trade opened.',
            heroSubtitle: 'You activated your account quickly and started trading.',
            mainTitle: 'From now on, you have dedicated one-to-one support.',
            introLead:
              'Your account manager can help you stay structured, focused, and consistent.',
            bodyOne: 'Use this support to review risk, timing, and next operational priorities.',
            bodyTwo: 'What this support gives you:',
            boxOneTitle: 'Dedicated contact',
            boxOneCopy: 'One manager for your account',
            boxTwoTitle: 'Practical guidance',
            boxTwoCopy: 'Clear next actions',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Fast answers when needed',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyFour: 'One message is enough. Your manager is ready to help with your next move.',
            ctaLabel: 'Contact Your Account Manager',
            ctaHelper: 'Open WhatsApp — your manager replies directly',
          },
        },
        {
          name: 'Unfunded Newcomers - +48hr Deposit + Trade B',
          description:
            'Follow-up for users with deposit and open trade at +48h. Continuity and planning variant.',
          subject: 'Your first activity is in place. Dedicated guidance is now available.',
          html: {
            lang: 'en',
            skin: 'dark',
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Hi Bullwaves, I completed my first deposit and opened my first trade. I would like to connect with my dedicated account manager.')}`,
            title: 'You activated fast',
            heroTitle: 'Now protect your momentum',
            heroSubtitle: 'Deposit and first trade are done. Next decisions matter more.',
            mainTitle: 'This is where dedicated guidance improves consistency.',
            introLead:
              'Your account manager can support you on structure, timing, and risk discipline.',
            bodyOne: 'Use this phase to stay consistent, not reactive.',
            bodyTwo: 'What dedicated support helps you secure:',
            boxOneTitle: 'Continuity',
            boxOneCopy: 'Keep your trading rhythm',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'Prioritize the right next move',
            boxThreeTitle: 'Control',
            boxThreeCopy: 'Handle issues without noise',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyFour: 'Start with one question. Your manager handles the rest.',
            ctaLabel: 'Speak with Your Account Manager',
            ctaHelper: 'Open WhatsApp — your manager replies directly',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - +48h Deposito + Trade A',
          description:
            'Follow-up per utenti con deposito e trade aperto a +48h. Variante supporto account manager dedicato.',
          subject: 'Il tuo account è attivo. Il tuo account manager dedicato è ora disponibile.',
          html: {
            lang: 'it',
            skin: 'light',
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Ciao Bullwaves, ho completato il primo deposito e aperto il primo trade. Vorrei essere messo in contatto con il mio account manager dedicato.')}`,
            title: 'Ottimo avvio nelle prime 48 ore',
            heroTitle: 'Deposito completato. Trade aperto.',
            heroSubtitle: 'Hai attivato l account rapidamente e hai già iniziato a operare.',
            mainTitle: 'Da ora hai un supporto dedicato one-to-one.',
            introLead:
              'Il tuo account manager può aiutarti a mantenere struttura, focus e continuità.',
            bodyOne: 'Usa questo supporto per allineare rischio, timing e priorità operative.',
            bodyTwo: 'Cosa ti offre questo supporto:',
            boxOneTitle: 'Contatto dedicato',
            boxOneCopy: 'Un manager per il tuo account',
            boxTwoTitle: 'Guida pratica',
            boxTwoCopy: 'Prossimi passi chiari',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Risposte rapide quando servono',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyFour:
              'Un messaggio è sufficiente. Il tuo manager è pronto a supportarti sul prossimo passo.',
            ctaLabel: 'Contatta il tuo Account Manager',
            ctaHelper: 'Apri WhatsApp — il tuo manager risponde direttamente',
          },
        },
        {
          name: 'Unfunded Newcomers - +48h Deposito + Trade B',
          description:
            'Follow-up per utenti con deposito e trade aperto a +48h. Variante continuità e pianificazione.',
          subject: 'La tua prima operatività è avviata. Ora hai una guida dedicata.',
          html: {
            lang: 'it',
            skin: 'dark',
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Ciao Bullwaves, ho completato il primo deposito e aperto il primo trade. Vorrei essere messo in contatto con il mio account manager dedicato.')}`,
            title: 'Hai attivato rapidamente il conto',
            heroTitle: 'Ora proteggi lo slancio',
            heroSubtitle:
              'Deposito e primo trade sono fatti. Le prossime decisioni contano di più.',
            mainTitle: 'Qui una guida dedicata migliora la continuità operativa.',
            introLead:
              'Il tuo account manager può supportarti su struttura, timing e disciplina del rischio.',
            bodyOne: 'Usa questa fase per restare coerente, non reattivo.',
            bodyTwo: 'Cosa protegge il supporto dedicato:',
            boxOneTitle: 'Continuità',
            boxOneCopy: 'Mantieni ritmo operativo',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Priorità sul prossimo passo',
            boxThreeTitle: 'Controllo',
            boxThreeCopy: 'Gestisci i blocchi senza rumore',
            ...UNFUNDED_ICON_SETS.postLoginDepositActivation,
            bodyFour: 'Inizia con una domanda. Il tuo manager fa il resto.',
            ctaLabel: 'Parla con il tuo Account Manager',
            ctaHelper: 'Apri WhatsApp — il tuo manager risponde direttamente',
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
            'Recovery variant for users who accessed the account but did not progress into the deposit path, payment routes, or verification steps.',
          subject: 'Your account is ready to continue. The deposit path is still open.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your next step is still open',
            heroTitle: 'A clear next move is available',
            heroSubtitle:
              'You came back to your account. The next useful step is to review the deposit path with clarity.',
            mainTitle: 'You do not need to restart. You only need one clear step forward.',
            introLead:
              'In most cases, the issue is not interest. It is simply lack of visibility on the next action.',
            bodyOne:
              'Open the deposit path, review the available options, and continue only when everything feels clear.',
            bodyTwo: 'What this step gives you:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'A visible next action',
            boxTwoTitle: 'Simplicity',
            boxTwoCopy: 'A shorter route forward',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Fewer practical doubts',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree: 'A quick review is often enough to make the next decision easier.',
            bodyFour: 'If one practical obstacle remains, you can resolve it quickly on WhatsApp.',
            ctaLabel: 'Reopen the Deposit Route',
            ctaHelper: 'Open the deposit path and review the next step',
          },
        },
        {
          name: 'Unfunded Newcomers - Deposit Intent Recovery B',
          description:
            'No-intent follow-up variant that restores momentum after a portal visit without any strong funding signal.',
          subject: 'Your return is a good sign. The deposit path is still available.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your return can now become progress',
            heroTitle: 'Turn the return into a real step',
            heroSubtitle: 'Coming back matters most when it leads to a clear action.',
            mainTitle:
              'The account revisit was meaningful. Now it needs a practical follow-through.',
            introLead:
              'What is missing is no longer access. It is a visible move into the deposit path.',
            bodyOne:
              'Reopen the deposit route, review the options, and keep the process moving in a simple way.',
            bodyTwo: 'What this follow-up is designed to restore:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'A clear route forward',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'Keep the process active',
            boxThreeTitle: 'Assurance',
            boxThreeCopy: 'Help if a blocker appears',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              'A return visit already shows intent. Opening the deposit path turns that intent into progress.',
            bodyFour:
              'If something specific slows you down, WhatsApp support can help without adding friction.',
            ctaLabel: 'Open the Deposit Route Now',
            ctaHelper: 'Open the deposit path and move the process forward',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Recupero Intento Deposito A',
          description:
            "Variante di recupero per utenti che hanno aperto l'account ma non hanno ancora avviato il percorso di deposito, i pagamenti o gli step di verifica.",
          subject:
            'Il tuo account è pronto per continuare. Il percorso di deposito è ancora aperto.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il prossimo passo è ancora aperto',
            heroTitle: 'Hai davanti un passo chiaro',
            heroSubtitle:
              "Sei rientrato nell'account. Il passo utile ora è rivedere con chiarezza il percorso di deposito.",
            mainTitle: 'Non devi ricominciare. Ti serve solo un passo chiaro in avanti.',
            introLead:
              'Nella maggior parte dei casi non manca interesse. Manca solo visibilità sul prossimo passaggio.',
            bodyOne:
              'Apri il percorso di deposito, guarda le opzioni disponibili e prosegui solo quando tutto ti è chiaro.',
            bodyTwo: 'Cosa ti offre questo passaggio:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Un prossimo passo visibile',
            boxTwoTitle: 'Semplicità',
            boxTwoCopy: 'Un percorso più lineare',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Meno dubbi pratici',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              'Spesso basta un controllo rapido del percorso per rendere il prossimo passo più semplice.',
            bodyFour: 'Se resta un ostacolo pratico, puoi risolverlo rapidamente su WhatsApp.',
            ctaLabel: 'Riapri il Percorso di Deposito',
            ctaHelper: 'Apri il percorso deposito e guarda il passaggio successivo',
          },
        },
        {
          name: 'Unfunded Newcomers - Recupero Intento Deposito B',
          description:
            'Variante no-intent che ripristina il momentum dopo una visita al portale senza segnali forti di funding.',
          subject:
            'Il tuo rientro è un segnale positivo. Il percorso di deposito è ancora disponibile.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo rientro può diventare progresso',
            heroTitle: 'Trasforma il rientro in un passo reale',
            heroSubtitle: 'Tornare conta soprattutto quando porta a un azione concreta.',
            mainTitle: "La rivisita dell'account è stata utile. Ora serve un seguito pratico.",
            introLead:
              "Quello che manca non è più l'accesso. Manca un passaggio visibile dentro il percorso di deposito.",
            bodyOne:
              'Riapri il percorso di deposito, guarda le opzioni e mantieni il processo in movimento con semplicità.',
            bodyTwo: 'Cosa vuole ripristinare questo follow-up:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Un percorso chiaro',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Mantieni il processo attivo',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Aiuto se compare un blocco',
            ...UNFUNDED_ICON_SETS.intentRecovery,
            bodyThree:
              'Il rientro mostra già interesse. Aprire il percorso di deposito lo trasforma in progresso.',
            bodyFour:
              'Se qualcosa ti rallenta davvero, WhatsApp può aiutarti senza appesantire il percorso.',
            ctaLabel: 'Apri Ora il Percorso Deposito',
            ctaHelper: 'Apri il percorso deposito e fai avanzare il processo',
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
            'Post-deposit activation variant for newly funded users who should now move into their first structured account actions.',
          subject:
            'Your first deposit is complete. Your Bullwaves account is ready for the next step.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your first deposit is complete',
            heroTitle: 'Your account is now funded',
            heroSubtitle: 'Now you can move from funding into activation with a clearer next step.',
            mainTitle: 'The deposit is done. Now the goal is to use it well.',
            introLead:
              'Your account has already crossed the funding step. This message helps you move into the next operational phase with more clarity.',
            bodyOne:
              'This is no longer about making a deposit. It is about activating the account in a simple, guided way.',
            bodyTwo: 'What opens for you now:',
            boxOneTitle: 'Activation',
            boxOneCopy: 'Move from funding into action',
            boxTwoTitle: 'Guidance',
            boxTwoCopy: 'Clear next-step orientation',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Available if you need practical help',
            ...UNFUNDED_ICON_SETS.depositPush,
            bodyThree:
              'Open your client area and continue from the account path that is already active.',
            bodyFour:
              'If one practical question remains, you can resolve it quickly and move forward.',
            ctaLabel: 'Continue from My Account',
            ctaHelper: 'Open the platform and continue from your funded account',
          },
        },
        {
          name: 'Unfunded Newcomers - First Deposit Push B',
          description:
            'Post-funding momentum variant focused on turning a completed deposit into a clean activation path.',
          subject: 'Your account is funded. Now continue with the next active step.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Keep the funded account moving',
            heroTitle: 'Your deposit is already confirmed',
            heroSubtitle: 'The next phase should now feel simpler, clearer, and more actionable.',
            mainTitle: 'Once the deposit is complete, the best move is a guided start.',
            introLead:
              'You already handled the key funding step. Now keep the path orderly and move into activation.',
            bodyOne:
              'The simplest next move is to reopen the platform and continue from the account that is now fully funded.',
            bodyTwo: 'What matters most at this stage:',
            boxOneTitle: 'Continuity',
            boxOneCopy: 'Keep the path active',
            boxTwoTitle: 'Activation',
            boxTwoCopy: 'Turn funding into action',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Available if needed',
            ...UNFUNDED_ICON_SETS.depositMomentum,
            bodyThree:
              'This is not about re-deciding the deposit. It is about using the funded account well.',
            bodyFour: 'If one specific point still needs clarification, support can help quickly.',
            ctaLabel: 'Continue the Activation Path',
            ctaHelper: 'Return to the platform and continue from your funded account',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Primo Deposito A',
          description:
            'Variante di attivazione post-deposito per utenti che hanno già completato il funding iniziale.',
          subject:
            'Il tuo primo deposito è completato. Il tuo account Bullwaves è pronto per il prossimo passo.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo primo deposito è completato',
            heroTitle: 'Il tuo account è ora finanziato',
            heroSubtitle:
              "Ora puoi passare dal funding all'attivazione con un prossimo passo più chiaro.",
            mainTitle: 'Il deposito è fatto. Adesso conta usarlo bene.',
            introLead:
              'Hai già completato il passaggio chiave del funding. Questo messaggio serve ad accompagnarti nella fase operativa successiva con più chiarezza.',
            bodyOne:
              'Non si tratta più di fare un deposito. Si tratta di attivare il conto in modo semplice e guidato.',
            bodyTwo: 'Cosa si apre per te adesso:',
            boxOneTitle: 'Attivazione',
            boxOneCopy: "Passa dal funding all'azione",
            boxTwoTitle: 'Guida',
            boxTwoCopy: 'Un prossimo passo più chiaro',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Disponibile se serve un aiuto pratico',
            ...UNFUNDED_ICON_SETS.depositPush,
            bodyThree:
              'Apri la tua area cliente e continua dal percorso già attivo sul tuo account.',
            bodyFour: 'Se resta un dubbio pratico, puoi risolverlo rapidamente e proseguire.',
            ctaLabel: 'Continua dal Mio Account',
            ctaHelper: 'Apri la piattaforma e continua dal tuo account già finanziato',
          },
        },
        {
          name: 'Unfunded Newcomers - Primo Deposito B',
          description:
            "Variante post-funding orientata a trasformare un deposito riuscito in un'attivazione ordinata.",
          subject: 'Il tuo account è finanziato. Ora continua con il prossimo passo operativo.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Mantieni in movimento il tuo account finanziato',
            heroTitle: 'Il deposito è già confermato',
            heroSubtitle:
              'La fase successiva può ora essere più semplice, più chiara e più concreta.',
            mainTitle:
              'Ora che il deposito è completato, la mossa migliore è iniziare in modo guidato.',
            introLead:
              "Hai già gestito il passaggio più importante. Adesso mantieni ordinato il percorso e passa all'attivazione.",
            bodyOne:
              'La mossa più semplice ora è rientrare in piattaforma e continuare dal conto già finanziato.',
            bodyTwo: 'Cosa conta di più in questa fase:',
            boxOneTitle: 'Continuità',
            boxOneCopy: 'Mantieni attivo il percorso',
            boxTwoTitle: 'Attivazione',
            boxTwoCopy: 'Trasforma il funding in operatività',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Disponibile se serve chiarezza',
            ...UNFUNDED_ICON_SETS.depositMomentum,
            bodyThree:
              'Non è più una decisione sul deposito. È il momento di usare bene il conto già attivo.',
            bodyFour:
              'Se resta un punto specifico da chiarire, il supporto può aiutarti rapidamente.',
            ctaLabel: 'Continua il Percorso Attivo',
            ctaHelper: 'Rientra in piattaforma e continua dal tuo account finanziato',
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
          subject: 'Your first deposit is complete. Your dedicated account manager is available.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your first deposit is complete',
            heroTitle: 'Your account is now funded',
            heroSubtitle: 'You can now move into your first trading decisions with more clarity.',
            mainTitle: 'Dedicated guidance is available for your next operational step.',
            introLead:
              'A dedicated account manager can help you approach the next phase with more structure and confidence.',
            bodyOne:
              'Use this support to review setup, risk boundaries, and the right timing for your next move.',
            bodyTwo: 'What this support gives you:',
            boxOneTitle: 'Guidance',
            boxOneCopy: 'One dedicated contact',
            boxTwoTitle: 'Structure',
            boxTwoCopy: 'Clear next decisions',
            boxThreeTitle: 'Clarity',
            boxThreeCopy: 'Fast answers when needed',
            ...UNFUNDED_ICON_SETS.firstTradeStructured,
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Hi Bullwaves, I completed my first deposit and would like support from my dedicated account manager on the next step in my account.')}`,
            bodyThree: 'A good start becomes stronger when the next step is taken with clarity.',
            ctaLabel: 'Contact Your Account Manager',
            ctaHelper: 'Open WhatsApp — your manager replies directly',
          },
        },
        {
          name: 'Unfunded Newcomers - First Trade Onboarding B',
          description:
            'Confidence-led onboarding variant that lowers fear around the first position and frames action as a learning step.',
          subject: 'Your account is now funded. Dedicated support is available for the next step.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Dedicated support is active',
            heroTitle: 'Move forward with a clear point of contact',
            heroSubtitle:
              'Your account manager can support the next decision with practical clarity.',
            mainTitle: 'Your account is funded. Keep the next step guided and well structured.',
            introLead:
              'When needed, you can rely on one dedicated manager for quick and focused support.',
            bodyOne:
              'Use this support to validate timing, setup, and your next operational move without noise.',
            bodyTwo: 'What this dedicated support delivers:',
            boxOneTitle: 'Context',
            boxOneCopy: 'Account-level guidance',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Actionable next move',
            boxThreeTitle: 'Speed',
            boxThreeCopy: 'Fast human support',
            ...UNFUNDED_ICON_SETS.firstTradeConfidence,
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Hi Bullwaves, I completed my first deposit and would like support from my dedicated account manager on the next step in my account.')}`,
            bodyThree:
              'The next step is easier when you can discuss it clearly and act with confidence.',
            ctaLabel: 'Speak with Your Account Manager',
            ctaHelper: 'Open WhatsApp — your manager replies directly',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Onboarding Primo Trade A',
          description:
            'Variante post-FTD che rende il primo trade semplice, strutturato e subito azionabile.',
          subject:
            'Il tuo primo deposito è completato. Il tuo account manager dedicato è disponibile.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Il tuo primo deposito è completato',
            heroTitle: 'Il tuo account è ora finanziato',
            heroSubtitle:
              'Adesso puoi affrontare i prossimi passaggi operativi con maggiore chiarezza.',
            mainTitle: 'Da questo momento hai una guida dedicata per il prossimo passo.',
            introLead:
              'Hai un account manager dedicato che può accompagnarti nella fase successiva con più struttura e sicurezza.',
            bodyOne:
              'Usa questo supporto per allineare setup, rischio e timing della prossima mossa con più chiarezza.',
            bodyTwo: 'Cosa ottieni da questo supporto:',
            boxOneTitle: 'Guida',
            boxOneCopy: 'Un referente dedicato',
            boxTwoTitle: 'Struttura',
            boxTwoCopy: 'Decisioni più chiare',
            boxThreeTitle: 'Chiarezza',
            boxThreeCopy: 'Risposte rapide quando servono',
            ...UNFUNDED_ICON_SETS.firstTradeStructured,
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Ciao Bullwaves, ho completato il mio primo deposito e vorrei supporto dal mio account manager dedicato sul prossimo passo del mio account.')}`,
            bodyThree:
              'Un buon avvio diventa più solido quando il prossimo passo viene affrontato con chiarezza.',
            ctaLabel: 'Contatta il tuo Account Manager',
            ctaHelper: 'Apri WhatsApp — il tuo manager risponde direttamente',
          },
        },
        {
          name: 'Unfunded Newcomers - Onboarding Primo Trade B',
          description:
            'Variante confidence-led che riduce la paura della prima posizione e presenta l azione come passaggio di apprendimento.',
          subject:
            'Il tuo account è ora finanziato. Hai un supporto dedicato per il prossimo passo.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Supporto dedicato attivo',
            heroTitle: 'Vai avanti con un riferimento chiaro',
            heroSubtitle:
              'Il tuo account manager può supportare la prossima decisione in modo pratico e ordinato.',
            mainTitle:
              'Il tuo account è finanziato. Mantieni il prossimo passo guidato e ben strutturato.',
            introLead: 'Quando serve, hai un referente dedicato per supporto rapido e mirato.',
            bodyOne:
              'Usa questo supporto per validare timing, setup e prossima azione senza rumore.',
            bodyTwo: 'Cosa offre questo supporto dedicato:',
            boxOneTitle: 'Contesto',
            boxOneCopy: 'Guida sul tuo account',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Prossima mossa chiara',
            boxThreeTitle: 'Rapidità',
            boxThreeCopy: 'Supporto umano veloce',
            ...UNFUNDED_ICON_SETS.firstTradeConfidence,
            ctaUrl: `https://wa.me/35799514794?text=${encodeURIComponent('Ciao Bullwaves, ho completato il mio primo deposito e vorrei supporto dal mio account manager dedicato sul prossimo passo del mio account.')}`,
            bodyThree:
              'Il prossimo passo è più semplice quando puoi confrontarti con chiarezza e muoverti con fiducia.',
            ctaLabel: 'Parla con il tuo Account Manager',
            ctaHelper: 'Apri WhatsApp — il tuo manager risponde direttamente',
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
          subject:
            'If you are still considering Bullwaves, returning can be simpler than expected.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Still considering Bullwaves?',
            heroTitle: 'The next step can stay simple',
            heroSubtitle:
              'If the timing was off before, you can restart with <strong>clarity</strong>.',
            mainTitle: 'You do not need to start over. You only need a clearer way back in.',
            introLead:
              'If you looked at the platform but did not deposit, the interest may still be there. The timing may simply have been off.',
            bodyOne:
              'This follow-up reopens the path without pressure and gives you a calmer way to continue.',
            bodyTwo: 'What changes in this restart approach:',
            boxOneTitle: 'Simpler',
            boxOneCopy: 'Less friction',
            boxTwoTitle: 'Relevant',
            boxTwoCopy: 'A fresher angle',
            boxThreeTitle: 'Supported',
            boxThreeCopy: 'Help if needed',
            ...UNFUNDED_ICON_SETS.reentrySoft,
            bodyThree:
              'You can revisit your area, review the route, and move only when it feels <strong>clear</strong>.',
            bodyFour: 'If one practical obstacle remains, WhatsApp can help you remove it quickly.',
            ctaLabel: 'Reopen Your Client Area',
            ctaHelper: 'Return with a clearer path',
          },
        },
        {
          name: 'Unfunded Newcomers - Re-entry Nurture B',
          description:
            'Renewed-opportunity variant focused on restoring momentum rather than pushing urgency.',
          subject: 'Your Bullwaves opportunity is still open. You can return with greater clarity.',
          html: {
            lang: 'en',
            skin: 'light',
            title: 'Your opportunity is still open',
            heroTitle: 'You can still restart easily',
            heroSubtitle: 'A missed step earlier does not reset <strong>everything</strong>.',
            mainTitle: 'The path is still open. It only needs a cleaner restart.',
            introLead:
              'If you paused earlier, the next move is not to rebuild everything. It is simply to return.',
            bodyOne: 'That keeps the process light while giving you a practical way to continue.',
            bodyTwo: 'What this restart gives you:',
            boxOneTitle: 'Reset',
            boxOneCopy: 'Fresh perspective',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'One clear next step',
            boxThreeTitle: 'Backup',
            boxThreeCopy: 'Support if blocked',
            ...UNFUNDED_ICON_SETS.reentryOpportunity,
            bodyThree:
              'Go back in, recheck the path, and continue only if it feels <strong>natural</strong>.',
            bodyFour: 'If something still blocks you, WhatsApp can help you resolve it quickly.',
            ctaLabel: 'Return to Your Account',
            ctaHelper: 'Re-enter with a lighter next step',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Unfunded Newcomers - Riattivazione Soft A',
          description:
            'Variante soft reactivation che riapre il percorso con meno pressione e maggiore rilevanza percepita.',
          subject:
            'Se stai ancora valutando Bullwaves, tornare può essere più semplice di quanto sembri.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'Stai ancora valutando Bullwaves?',
            heroTitle: 'Il prossimo passo può restare semplice',
            heroSubtitle: 'Se prima non era il momento, puoi ripartire con chiarezza.',
            mainTitle:
              'Non devi ripartire da zero. Ti serve solo un modo più chiaro per rientrare.',
            introLead:
              "Se hai guardato la piattaforma ma non hai depositato, è probabile che l'interesse ci sia ancora. Semplicemente, il momento non era quello giusto.",
            bodyOne: 'Questo follow-up riapre il percorso senza pressione e con più chiarezza.',
            bodyTwo: 'Cosa cambia in questo nuovo tentativo:',
            boxOneTitle: 'Più semplice',
            boxOneCopy: 'Meno attrito',
            boxTwoTitle: 'Più rilevante',
            boxTwoCopy: 'Angolo più fresco',
            boxThreeTitle: 'Più assistito',
            boxThreeCopy: 'Aiuto se serve',
            ...UNFUNDED_ICON_SETS.reentrySoft,
            bodyThree: 'Rientra, rivedi il percorso e muoviti solo quando tutto ti sembra chiaro.',
            bodyFour:
              'Se resta un ostacolo pratico, WhatsApp può aiutarti a rimuoverlo rapidamente.',
            ctaLabel: 'Riapri la tua Area Personale',
            ctaHelper: 'Rientra con un percorso più semplice',
          },
        },
        {
          name: 'Unfunded Newcomers - Riattivazione Soft B',
          description:
            "Variante renewed-opportunity orientata a ripristinare il momentum piuttosto che spingere l'urgenza.",
          subject:
            'La tua opportunità con Bullwaves è ancora aperta. Puoi rientrare con maggiore chiarezza.',
          html: {
            lang: 'it',
            skin: 'light',
            title: 'La tua opportunità è ancora aperta',
            heroTitle: 'Puoi ancora ripartire facilmente',
            heroSubtitle: 'Un passaggio mancato non ti riporta a zero.',
            mainTitle: 'Il percorso è ancora aperto. Serve solo una ripartenza più pulita.',
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
              'Rientra, ricontrolla il percorso e continua solo se ora ti sembra naturale.',
            bodyFour:
              'Se qualcosa ti blocca ancora, WhatsApp può aiutarti a risolverlo rapidamente.',
            ctaLabel: 'Torna al tuo Account',
            ctaHelper: 'Rientra con un passo più leggero',
          },
        }
      ),
    },
  },
  ...additionalSegmentJourneyTemplatesById,
}
