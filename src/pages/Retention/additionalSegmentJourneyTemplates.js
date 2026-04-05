import { makeLocaleVariants } from './segmentJourneyTemplateBuilder.js'

export const additionalSegmentJourneyTemplatesById = {
  top_performing_vip_recognition_email: {
    id: 'top_performing_vip_recognition_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Top Performing - VIP Recognition A',
          description:
            'Recognition-led touch that frames the trader as a premium relationship worth protecting.',
          subject: 'You are among Bullwaves top performers. We built your next step accordingly.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Retention Journey',
            title: 'Top performer recognition',
            heroTitle: 'Your performance has been noticed',
            heroSubtitle: 'This premium touch protects momentum and value.',
            mainTitle: 'You are not in a standard communication path.',
            introLead:
              'Your recent behavior places you among the profiles Bullwaves should retain more carefully.',
            bodyOne:
              'This touch starts with recognition: value performance, keep the relationship warm, and make the next step feel earned.',
            bodyTwo: 'What changes for you at this level:',
            boxOneTitle: 'Recognition',
            boxOneCopy: 'A more premium treatment',
            boxTwoTitle: 'Access',
            boxTwoCopy: 'More relevant market support',
            boxThreeTitle: 'Coverage',
            boxThreeCopy: 'Faster human follow-up',
            bodyThree:
              'The next move is simple: re-enter your trading area and keep operating with the right support.',
            bodyFour: 'WhatsApp stays available if needed, but the platform remains first.',
            ctaLabel: 'Open Your Premium Area',
            ctaHelper: 'Re-enter the platform with the premium setup active',
            supportLabel: 'Need your account manager in second line?',
            supportHelper: 'Use support only for a quick checkpoint',
          },
        },
        {
          name: 'Top Performing - VIP Recognition B',
          description:
            'Status-led variant that turns recognition into a retention signal and premium continuity message.',
          subject: 'Your trading profile unlocked a more tailored Bullwaves path.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Retention Journey',
            title: 'A more tailored path',
            heroTitle: 'High-value traders need tailored treatment',
            heroSubtitle: 'Your profile now qualifies for a more curated path.',
            mainTitle: 'This message exists because your activity stands out.',
            introLead:
              'When a trader shows stronger performance, the smartest move is a better-calibrated path.',
            bodyOne:
              'This sequence keeps momentum high and the relationship more intentional and premium.',
            bodyTwo: 'What this upgraded path is built around:',
            boxOneTitle: 'Relevance',
            boxOneCopy: 'Higher-fit communication',
            boxTwoTitle: 'Priority',
            boxTwoCopy: 'Stronger servicing logic',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Protect profitable behavior',
            bodyThree:
              'The next best move is to continue in platform while this premium layer supports consistency.',
            bodyFour: 'Support is there if useful, but the client area comes first.',
            ctaLabel: 'Continue with Bullwaves',
            ctaHelper: 'Open the platform and keep momentum active',
            supportLabel: 'Want a direct human follow-up?',
            supportHelper: 'Reach out only if you want extra guidance',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Top Performing - VIP Recognition A IT',
          description:
            'Touch di riconoscimento che presenta il trader come relazione premium da proteggere.',
          subject:
            'Sei tra i top performer Bullwaves. Il prossimo step e costruito di conseguenza.',
          html: {
            lang: 'it',
            eyebrow: 'Journey VIP Retention',
            title: 'Riconoscimento top performer',
            heroTitle: 'La tua performance e stata notata',
            heroSubtitle: 'Questo tocco premium protegge slancio e valore.',
            mainTitle: 'Non sei in un percorso di comunicazione standard.',
            introLead:
              'Il tuo comportamento recente ti colloca tra i profili da trattenere con piu attenzione.',
            bodyOne:
              'Per questo il primo touch parte dal riconoscimento: valorizzare la performance e rendere meritato il passo dopo.',
            bodyTwo: 'Cosa cambia a questo livello:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Trattamento piu premium',
            boxTwoTitle: 'Accesso',
            boxTwoCopy: 'Supporto market piu rilevante',
            boxThreeTitle: 'Copertura',
            boxThreeCopy: 'Follow-up umano piu rapido',
            bodyThree:
              'La mossa principale e semplice: rientra nell area trading e continua con il supporto giusto.',
            bodyFour:
              'WhatsApp resta disponibile se serve, ma la piattaforma resta il percorso primario.',
            ctaLabel: 'Apri la tua Area Premium',
            ctaHelper: 'Rientra in piattaforma con il setup premium attivo',
            supportLabel: 'Vuoi l account manager in seconda linea?',
            supportHelper: 'Usa il supporto solo per un checkpoint rapido',
          },
        },
        {
          name: 'Top Performing - VIP Recognition B IT',
          description:
            'Variante status-led che trasforma il riconoscimento in segnale di retention premium.',
          subject: 'Il tuo profilo trading ha sbloccato un percorso Bullwaves piu su misura.',
          html: {
            lang: 'it',
            eyebrow: 'Journey VIP Retention',
            title: 'Un percorso piu su misura',
            heroTitle: 'Un trader ad alto valore merita un percorso su misura',
            heroSubtitle: 'Il tuo profilo ora merita un esperienza piu curata.',
            mainTitle: 'Questo messaggio esiste perche la tua attivita si distingue.',
            introLead:
              'Quando un trader mostra performance piu forti, la mossa migliore e calibrare meglio il percorso.',
            bodyOne:
              'Questa sequenza tiene alto il momentum e rende la relazione piu intenzionale e premium.',
            bodyTwo: 'Su cosa si fonda questo percorso evoluto:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Comunicazione piu adatta',
            boxTwoTitle: 'Priorita',
            boxTwoCopy: 'Servicing piu forte',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Proteggere il comportamento profittevole',
            bodyThree:
              'La mossa migliore e continuare dalla piattaforma mentre il layer premium sostiene la continuita.',
            bodyFour: 'Il supporto c e se utile, ma l area cliente viene prima.',
            ctaLabel: 'Continua con Bullwaves',
            ctaHelper: 'Apri la piattaforma e mantieni attivo il momentum',
            supportLabel: 'Vuoi un follow-up umano diretto?',
            supportHelper: 'Scrivici solo se vuoi piu guida',
          },
        }
      ),
    },
  },
  top_performing_advanced_tools_email: {
    id: 'top_performing_advanced_tools_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Top Performing - Advanced Tools A',
          description: 'Value expansion variant around premium insights and execution support.',
          subject: 'A stronger trader should have a sharper support stack.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Value Expansion',
            title: 'Advanced tools offer',
            heroTitle: 'Add sharper tools to performance',
            heroSubtitle: 'Better execution often improves retention.',
            mainTitle: 'This is about better support, not more noise.',
            introLead:
              'You already have trading traction. The next layer improves the environment around your decisions.',
            bodyOne:
              'That means better context, more relevant support, and a structure that protects profitable behavior.',
            bodyTwo: 'What this layer is designed to improve:',
            boxOneTitle: 'Insight',
            boxOneCopy: 'Better context before action',
            boxTwoTitle: 'Execution',
            boxTwoCopy: 'Cleaner operating flow',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Longer value protection',
            bodyThree:
              'The platform remains the core environment. This offer makes that environment work harder for your profile.',
            bodyFour:
              'If you want a human checkpoint, it is available, but the main move is still to re-enter and use the upgraded layer.',
            ctaLabel: 'See the Premium Toolkit',
            ctaHelper: 'Open the platform and review the enhanced support layer',
            supportLabel: 'Need a quick premium consult?',
            supportHelper: 'WhatsApp stays secondary to the platform path',
          },
        },
        {
          name: 'Top Performing - Advanced Tools B',
          description:
            'Performance-led variant that positions premium tools as a way to defend edge.',
          subject: 'Protecting edge often starts with a better operating environment.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Value Expansion',
            title: 'Defend your edge',
            heroTitle: 'Your edge deserves better support',
            heroSubtitle: 'Premium traders lose momentum when support falls behind.',
            mainTitle: 'You already built the signal. Now defend it.',
            introLead:
              'The next step is not a louder message. It is a smarter environment around how you trade.',
            bodyOne:
              'That is the role of this offer: improve support precision without slowing you down.',
            bodyTwo: 'The offer is centered on three levers:',
            boxOneTitle: 'Precision',
            boxOneCopy: 'Higher-fit guidance',
            boxTwoTitle: 'Speed',
            boxTwoCopy: 'Faster premium support',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'Less drop in engagement',
            bodyThree:
              'Open the platform, review the upgraded layer, and decide how far to use it.',
            bodyFour: 'Support is available if you want detail, but the platform stays first.',
            ctaLabel: 'Review the Upgraded Layer',
            ctaHelper: 'Use the platform to activate the new support stack',
            supportLabel: 'Want one direct clarification?',
            supportHelper: 'Human support stays in second position',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Top Performing - Advanced Tools A IT',
          description: 'Variante value expansion su insight premium e supporto operativo.',
          subject: 'Un trader piu forte dovrebbe avere un support stack piu affilato.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Value Expansion',
            title: 'Offerta strumenti avanzati',
            heroTitle: 'Aggiungi strumenti piu forti alla performance',
            heroSubtitle: 'Una migliore esecuzione spesso migliora anche la fedelta.',
            mainTitle: 'Qui si parla di supporto migliore, non di piu rumore.',
            introLead:
              'Hai gia trazione di trading. Il livello successivo migliora il contesto attorno alle decisioni.',
            bodyOne:
              'Questo significa piu contesto, supporto piu utile e una struttura che protegge il comportamento profittevole.',
            bodyTwo: 'Cosa punta a migliorare questo layer:',
            boxOneTitle: 'Insight',
            boxOneCopy: 'Piu contesto prima dell azione',
            boxTwoTitle: 'Execution',
            boxTwoCopy: 'Flusso operativo piu pulito',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Protezione del valore piu lunga',
            bodyThree:
              'La piattaforma resta l ambiente principale. Questa offerta la rende piu utile per il tuo profilo.',
            bodyFour:
              'Se vuoi un checkpoint umano c e, ma la mossa principale resta rientrare e usare il layer evoluto.',
            ctaLabel: 'Scopri il Toolkit Premium',
            ctaHelper: 'Apri la piattaforma e valuta il layer di supporto',
            supportLabel: 'Ti serve un consulto rapido premium?',
            supportHelper: 'WhatsApp resta secondario rispetto al percorso in piattaforma',
          },
        },
        {
          name: 'Top Performing - Advanced Tools B IT',
          description:
            'Variante performance-led che presenta gli strumenti premium come difesa del vantaggio.',
          subject: 'Proteggere il vantaggio spesso inizia da un ambiente operativo migliore.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Value Expansion',
            title: 'Difendi il tuo vantaggio',
            heroTitle: 'Il tuo vantaggio merita piu supporto',
            heroSubtitle: 'I trader premium perdono slancio quando il supporto resta indietro.',
            mainTitle: 'Il segnale lo hai gia costruito. Ora va difeso.',
            introLead:
              'Il prossimo step non e un messaggio piu forte. E un ambiente piu intelligente attorno a come operi.',
            bodyOne:
              'Questo e il ruolo dell offerta: migliorare la precisione del supporto senza rallentarti.',
            bodyTwo: 'L offerta ruota su tre leve:',
            boxOneTitle: 'Precisione',
            boxOneCopy: 'Guida piu adatta',
            boxTwoTitle: 'Velocita',
            boxTwoCopy: 'Supporto premium piu rapido',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Meno calo di engagement',
            bodyThree: 'Apri la piattaforma, rivedi il layer evoluto e decidi quanto usarlo.',
            bodyFour:
              'Il supporto c e se vuoi dettaglio, ma la piattaforma resta il primo passaggio.',
            ctaLabel: 'Valuta il Layer Evoluto',
            ctaHelper: 'Usa la piattaforma per attivare il nuovo supporto',
            supportLabel: 'Vuoi un chiarimento diretto?',
            supportHelper: 'Il supporto umano resta in seconda posizione',
          },
        }
      ),
    },
  },
  top_performing_loyalty_upgrade_email: {
    id: 'top_performing_loyalty_upgrade_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Top Performing - Loyalty Upgrade A',
          description: 'Reward-led variant for sustained profitable behavior.',
          subject: 'Your consistency is opening premium loyalty treatment.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Loyalty Layer',
            title: 'Loyalty tier upgrade',
            heroTitle: 'Consistency should feel rewarded',
            heroSubtitle: 'This step turns strong behavior into visible value.',
            mainTitle: 'A premium profile should see premium progression.',
            introLead:
              'When performance stays strong over time, retention works better if progress feels concrete.',
            bodyOne:
              'That is the role of this loyalty touch: keep the relationship valuable, visible, and harder to replace.',
            bodyTwo: 'What the upgrade reinforces:',
            boxOneTitle: 'Status',
            boxOneCopy: 'Progress made visible',
            boxTwoTitle: 'Benefits',
            boxTwoCopy: 'More relevant premium treatment',
            boxThreeTitle: 'Stickiness',
            boxThreeCopy: 'Lower churn risk',
            bodyThree:
              'The best next step is still inside the platform, where the upgrade becomes concrete.',
            bodyFour: 'Support stays optional if you want human confirmation of the upgrade path.',
            ctaLabel: 'Activate the Upgrade View',
            ctaHelper: 'Review your premium progression',
            supportLabel: 'Need an AM checkpoint?',
            supportHelper: 'Ask only if you want human confirmation',
          },
        },
        {
          name: 'Top Performing - Loyalty Upgrade B',
          description: 'Retention-led upgrade variant centered on exclusivity and continuity.',
          subject: 'A stronger loyalty tier is ready for your Bullwaves profile.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Loyalty Layer',
            title: 'Premium progression',
            heroTitle: 'Keep premium behavior on track',
            heroSubtitle: 'The best retention path includes visible status.',
            mainTitle: 'This is not a generic reward layer.',
            introLead:
              'It is a continuity mechanism for traders whose value should keep compounding.',
            bodyOne: 'The upgrade reinforces that your current level is recognized and supported.',
            bodyTwo: 'Three things this tier is meant to strengthen:',
            boxOneTitle: 'Recognition',
            boxOneCopy: 'Your level is acknowledged',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'More reason to stay active',
            boxThreeTitle: 'Relationship',
            boxThreeCopy: 'Stronger premium bond',
            bodyThree:
              'Review the upgraded view from the platform and let that anchor the next period.',
            bodyFour:
              'If you want direct support, it is available, but the primary journey remains platform-first.',
            ctaLabel: 'Review Your Tier',
            ctaHelper: 'Open the client area and see your premium progression',
            supportLabel: 'Want a direct premium touch?',
            supportHelper: 'Use support only as a secondary validation layer',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Top Performing - Loyalty Upgrade A IT',
          description: 'Variante reward-led per comportamento profittevole sostenuto.',
          subject: 'La tua continuita sta aprendo un trattamento loyalty premium.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Loyalty Layer',
            title: 'Upgrade loyalty tier',
            heroTitle: 'La continuita dovrebbe sentirsi premiata',
            heroSubtitle: 'Questo step trasforma il buon comportamento in valore visibile.',
            mainTitle: 'Un profilo premium deve vedere una progressione premium.',
            introLead:
              'Quando la performance resta forte nel tempo, la retention funziona meglio se il progresso si percepisce.',
            bodyOne:
              'Questo e il ruolo del touch loyalty: rendere la relazione piu preziosa e piu visibile.',
            bodyTwo: 'Cosa rafforza questo upgrade:',
            boxOneTitle: 'Status',
            boxOneCopy: 'Progressi resi visibili',
            boxTwoTitle: 'Benefit',
            boxTwoCopy: 'Trattamento premium piu rilevante',
            boxThreeTitle: 'Stickiness',
            boxThreeCopy: 'Rischio churn piu basso',
            bodyThree:
              'Il prossimo passo migliore resta dentro la piattaforma, dove l upgrade diventa concreto.',
            bodyFour: 'Il supporto resta opzionale se vuoi una conferma umana del percorso.',
            ctaLabel: 'Attiva la Vista Upgrade',
            ctaHelper: 'Rivedi la tua progressione premium',
            supportLabel: 'Ti serve un checkpoint con AM?',
            supportHelper: 'Chiedilo solo se vuoi una conferma umana',
          },
        },
        {
          name: 'Top Performing - Loyalty Upgrade B IT',
          description: 'Variante retention-led centrata su esclusivita e continuita.',
          subject: 'Un loyalty tier piu forte e pronto per il tuo profilo Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Loyalty Layer',
            title: 'Progressione premium',
            heroTitle: 'Mantieni il comportamento premium sul binario giusto',
            heroSubtitle: 'Il percorso migliore include status visibile.',
            mainTitle: 'Questo non e un layer reward generico.',
            introLead:
              'E un meccanismo di continuita per trader il cui valore deve continuare a crescere.',
            bodyOne:
              'L upgrade rafforza la percezione che il tuo livello sia riconosciuto e supportato.',
            bodyTwo: 'Tre cose che questo tier punta a rafforzare:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Il tuo livello e visto',
            boxTwoTitle: 'Continuita',
            boxTwoCopy: 'Piu motivo per restare attivo',
            boxThreeTitle: 'Relazione',
            boxThreeCopy: 'Legame premium piu forte',
            bodyThree:
              'Rivedi la vista evoluta dalla piattaforma e usala come ancora per il prossimo periodo.',
            bodyFour: 'Se vuoi supporto diretto c e, ma il journey primario resta platform-first.',
            ctaLabel: 'Rivedi il tuo Tier',
            ctaHelper: 'Apri l area cliente e guarda la progressione premium',
            supportLabel: 'Vuoi un touch premium diretto?',
            supportHelper: 'Usa il supporto solo come livello secondario di validazione',
          },
        }
      ),
    },
  },
  top_performing_vip_review_email: {
    id: 'top_performing_vip_review_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Top Performing - VIP Review A',
          description:
            'Quarterly review touch focused on relationship quality and account continuity.',
          subject: 'Your quarterly Bullwaves VIP review is ready.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Review Cycle',
            title: 'Quarterly VIP review',
            heroTitle: 'A premium relationship should be reviewed',
            heroSubtitle: 'This follow-up keeps value, support, and next actions aligned.',
            mainTitle: 'Quarterly review is where retention becomes deliberate.',
            introLead:
              'A high-value client relationship should not run on autopilot. It should stay checked and relevant.',
            bodyOne:
              'This review touch keeps your trading environment, servicing, and next steps calibrated.',
            bodyTwo: 'The review is built around these three points:',
            boxOneTitle: 'Performance',
            boxOneCopy: 'What is still working',
            boxTwoTitle: 'Support',
            boxTwoCopy: 'What should improve',
            boxThreeTitle: 'Plan',
            boxThreeCopy: 'What comes next',
            bodyThree:
              'Use the platform as your first review point, then escalate to a human conversation only if it adds value.',
            bodyFour: 'That keeps the account journey cleaner and more intentional.',
            ctaLabel: 'Open Your VIP Review',
            ctaHelper: 'Use the client area to anchor the next phase',
            supportLabel: 'Need a direct review call-out?',
            supportHelper: 'Support remains optional and secondary',
          },
        },
        {
          name: 'Top Performing - VIP Review B',
          description:
            'Strategic follow-up framed as premium account planning rather than a routine check-in.',
          subject: 'A stronger next quarter starts with a sharper review now.',
          html: {
            lang: 'en',
            eyebrow: 'VIP Review Cycle',
            title: 'Plan the next quarter',
            heroTitle: 'Treat the next quarter as an advantage',
            heroSubtitle: 'Premium traders benefit when the relationship stays strategic.',
            mainTitle: 'This is less a check-in, more a planning layer.',
            introLead:
              'The goal is to use what is already working and identify where Bullwaves should serve you more precisely.',
            bodyOne:
              'That means better clarity on opportunities, support, and where account management should adapt.',
            bodyTwo: 'This review helps align:',
            boxOneTitle: 'Signal',
            boxOneCopy: 'What your activity says now',
            boxTwoTitle: 'Support',
            boxTwoCopy: 'Where service should sharpen',
            boxThreeTitle: 'Direction',
            boxThreeCopy: 'What the next cycle should target',
            bodyThree:
              'Start from the client area and let the review flow guide the next stage with more precision.',
            bodyFour: 'Human follow-up is available only if you want to deepen the conversation.',
            ctaLabel: 'Review the Next Quarter',
            ctaHelper: 'Open the platform and frame the next cycle',
            supportLabel: 'Want a direct strategic touch?',
            supportHelper: 'Use support only if you want to extend the review discussion',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Top Performing - VIP Review A IT',
          description:
            'Touch trimestrale focalizzato su qualita della relazione e continuita account.',
          subject: 'La tua review VIP trimestrale Bullwaves e pronta.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Review Cycle',
            title: 'Review VIP trimestrale',
            heroTitle: 'Una relazione premium va rivista',
            heroSubtitle: 'Questo follow-up allinea valore, supporto e prossimi passi.',
            mainTitle: 'La review trimestrale e dove la retention diventa intenzionale.',
            introLead:
              'Una relazione cliente ad alto valore non dovrebbe andare in autopilota. Va controllata e mantenuta rilevante.',
            bodyOne:
              'Questo touch review tiene calibrati ambiente di trading, servicing e opportunita del prossimo periodo.',
            bodyTwo: 'La review ruota attorno a tre punti:',
            boxOneTitle: 'Performance',
            boxOneCopy: 'Cosa sta ancora funzionando',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Cosa va migliorato',
            boxThreeTitle: 'Piano',
            boxThreeCopy: 'Cosa viene dopo',
            bodyThree:
              'Usa la piattaforma come primo punto di review, poi sali a una conversazione umana solo se aggiunge valore.',
            bodyFour: 'Cosi il journey account resta piu pulito e intenzionale.',
            ctaLabel: 'Apri la tua VIP Review',
            ctaHelper: 'Usa l area cliente per ancorare la prossima fase',
            supportLabel: 'Ti serve un richiamo review diretto?',
            supportHelper: 'Il supporto resta opzionale e secondario',
          },
        },
        {
          name: 'Top Performing - VIP Review B IT',
          description:
            'Follow-up strategico presentato come account planning premium invece che semplice check-in.',
          subject: 'Un prossimo trimestre piu forte parte da una review piu lucida oggi.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Review Cycle',
            title: 'Pianifica il prossimo trimestre',
            heroTitle: 'Tratta il prossimo trimestre come un vantaggio',
            heroSubtitle: 'I trader premium rendono meglio con una relazione strategica.',
            mainTitle: 'Qui si parla meno di check-in e piu di planning.',
            introLead:
              'L obiettivo e usare cio che gia funziona e capire dove Bullwaves puo servirti meglio.',
            bodyOne:
              'Questo significa piu chiarezza su opportunita, supporto e adattamento dell account management.',
            bodyTwo: 'Questa review aiuta ad allineare:',
            boxOneTitle: 'Segnale',
            boxOneCopy: 'Cosa dice oggi la tua attivita',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Dove il servizio va affinato',
            boxThreeTitle: 'Direzione',
            boxThreeCopy: 'Cosa deve puntare il prossimo ciclo',
            bodyThree:
              'Parti dall area cliente e lascia che il flusso review guidi la fase successiva con piu precisione.',
            bodyFour:
              'Il follow-up umano e disponibile solo se vuoi approfondire la conversazione.',
            ctaLabel: 'Rivedi il Prossimo Trimestre',
            ctaHelper: 'Apri la piattaforma e inquadra il prossimo ciclo',
            supportLabel: 'Vuoi un touch strategico diretto?',
            supportHelper: 'Usa il supporto solo se vuoi estendere la discussione review',
          },
        }
      ),
    },
  },
  top_performing_premium_nurture_email: {
    id: 'top_performing_premium_nurture_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Top Performing - Premium Nurture A',
          description: 'Light premium nurture loop focused on continuity and soft re-engagement.',
          subject: 'Keep your Bullwaves premium momentum alive.',
          html: {
            lang: 'en',
            eyebrow: 'Premium Nurture Loop',
            title: 'Premium nurture loop',
            heroTitle: 'Strong profiles need steady continuity',
            heroSubtitle: 'This light loop keeps value warm between bigger moments.',
            mainTitle: 'Not every retention move needs urgency.',
            introLead:
              'Sometimes the right move is simply to stay relevant and present enough that value does not cool down.',
            bodyOne:
              'That is what this premium nurture loop is for: keep the relationship warm without overselling.',
            bodyTwo: 'The loop protects three things:',
            boxOneTitle: 'Memory',
            boxOneCopy: 'Stay top of mind',
            boxTwoTitle: 'Value',
            boxTwoCopy: 'Keep relevance alive',
            boxThreeTitle: 'Return',
            boxThreeCopy: 'Lower passive drop-off',
            bodyThree:
              'Use the platform as the anchor and let the nurture layer work around it quietly.',
            bodyFour:
              'WhatsApp is available if you want a human nudge, but it should remain secondary.',
            ctaLabel: 'Reopen the Premium Flow',
            ctaHelper: 'Step back into the platform and keep the relationship active',
            supportLabel: 'Need a soft human nudge?',
            supportHelper: 'Use support only for an extra checkpoint',
          },
        },
        {
          name: 'Top Performing - Premium Nurture B',
          description:
            'Soft continuity variant built to reduce disengagement without forcing action.',
          subject: 'A premium relationship stays strong through intelligent continuity.',
          html: {
            lang: 'en',
            eyebrow: 'Premium Nurture Loop',
            title: 'Intelligent continuity',
            heroTitle: 'Keep the relationship warm',
            heroSubtitle: 'High-value traders drift when the relationship stops feeling current.',
            mainTitle: 'This loop exists to prevent silent cooling.',
            introLead:
              'The best move here is not pressure. It is quiet continuity and a clear path back into the platform.',
            bodyOne:
              'That keeps your profile engaged without making the relationship feel repetitive.',
            bodyTwo: 'This lighter-touch loop helps preserve:',
            boxOneTitle: 'Relevance',
            boxOneCopy: 'Useful premium presence',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'Ongoing account rhythm',
            boxThreeTitle: 'Access',
            boxThreeCopy: 'Simple re-entry path',
            bodyThree:
              'Re-enter the platform first. Let the nurture layer simply support the return.',
            bodyFour: 'Human support is there only if it adds clear value.',
            ctaLabel: 'Return to the Platform',
            ctaHelper: 'Use the client area as the main continuity point',
            supportLabel: 'Need one consultative touch?',
            supportHelper: 'Keep support in second position',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Top Performing - Premium Nurture A IT',
          description: 'Loop premium leggero focalizzato su continuita e soft re-engagement.',
          subject: 'Mantieni vivo il tuo premium momentum su Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Premium Nurture Loop',
            title: 'Loop nurture premium',
            heroTitle: 'I profili forti hanno bisogno di continuita',
            heroSubtitle: 'Questo loop leggero tiene il valore caldo tra i momenti forti.',
            mainTitle: 'Non ogni mossa retention deve usare urgenza.',
            introLead:
              'A volte la mossa giusta e restare abbastanza rilevanti da non far raffreddare il valore.',
            bodyOne:
              'Questo e il ruolo del premium nurture loop: tenere calda la relazione senza forzare il passo dopo.',
            bodyTwo: 'Il loop protegge tre cose:',
            boxOneTitle: 'Memoria',
            boxOneCopy: 'Restare top of mind',
            boxTwoTitle: 'Valore',
            boxTwoCopy: 'Tenere viva la rilevanza',
            boxThreeTitle: 'Ritorno',
            boxThreeCopy: 'Meno drop-off passivo',
            bodyThree:
              'Usa la piattaforma come ancora e lascia che il nurture layer lavori intorno in modo discreto.',
            bodyFour:
              'WhatsApp resta disponibile se vuoi un tocco umano, ma deve restare secondario.',
            ctaLabel: 'Riapri il Flusso Premium',
            ctaHelper: 'Rientra in piattaforma e mantieni attiva la relazione',
            supportLabel: 'Ti serve un tocco umano soft?',
            supportHelper: 'Usa il supporto solo per un checkpoint in piu',
          },
        },
        {
          name: 'Top Performing - Premium Nurture B IT',
          description:
            'Variante soft continuity costruita per ridurre il disimpegno senza forzare l azione.',
          subject: 'Una relazione premium resta forte con continuita intelligente.',
          html: {
            lang: 'it',
            eyebrow: 'Premium Nurture Loop',
            title: 'Continuita intelligente',
            heroTitle: 'Tieni calda la relazione',
            heroSubtitle:
              'I trader ad alto valore si allontanano quando la relazione non sembra piu attuale.',
            mainTitle: 'Questo loop esiste per evitare il raffreddamento silenzioso.',
            introLead:
              'La mossa migliore qui non e la pressione. E continuita discreta e un rientro chiaro in piattaforma.',
            bodyOne: 'Cosi il profilo resta coinvolto senza che la relazione sembri ripetitiva.',
            bodyTwo: 'Questo loop piu leggero aiuta a preservare:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Presenza premium utile',
            boxTwoTitle: 'Continuita',
            boxTwoCopy: 'Ritmo account continuo',
            boxThreeTitle: 'Accesso',
            boxThreeCopy: 'Rientro semplice',
            bodyThree:
              'Rientra prima in piattaforma. Lascia che il nurture layer supporti solo il ritorno.',
            bodyFour: 'Il supporto umano c e solo se aggiunge un valore chiaro.',
            ctaLabel: 'Torna in Piattaforma',
            ctaHelper: 'Usa l area cliente come punto principale di continuita premium',
            supportLabel: 'Ti serve un tocco consulenziale?',
            supportHelper: 'Mantieni il supporto in seconda posizione',
          },
        }
      ),
    },
  },
  most_consistent_badge_award_email: {
    id: 'most_consistent_badge_award_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Most Consistent - Badge Award A',
          description: 'Recognition-led launch for consistency-based engagement.',
          subject: 'You earned your Bullwaves consistency badge.',
          html: {
            lang: 'en',
            eyebrow: 'Consistency Growth Journey',
            title: 'Consistency badge awarded',
            heroTitle: 'Consistency deserves recognition',
            heroSubtitle: 'This first touch turns stable behavior into identity and momentum.',
            mainTitle: 'You have already done the hardest thing: stay active consistently.',
            introLead:
              'This badge is not cosmetic. It shows that your behavior is structured enough to build on.',
            bodyOne:
              'The point is to make progress visible and give your next month a cleaner narrative.',
            bodyTwo: 'This recognition is designed to reinforce:',
            boxOneTitle: 'Identity',
            boxOneCopy: 'You are a consistent trader',
            boxTwoTitle: 'Momentum',
            boxTwoCopy: 'Your path has traction',
            boxThreeTitle: 'Next step',
            boxThreeCopy: 'Growth now feels natural',
            bodyThree:
              'The platform remains the best place to continue because that is where your progress becomes measurable.',
            bodyFour:
              'Support is available if useful, but it should remain secondary to your platform rhythm.',
            ctaLabel: 'View Your Badge Path',
            ctaHelper: 'Open the platform and continue from a stronger position',
            supportLabel: 'Need one consultative check-in?',
            supportHelper: 'Use support only for a quick growth checkpoint',
          },
        },
        {
          name: 'Most Consistent - Badge Award B',
          description: 'Momentum-led recognition that turns consistency into upward movement.',
          subject: 'Your consistency is now a growth asset on Bullwaves.',
          html: {
            lang: 'en',
            eyebrow: 'Consistency Growth Journey',
            title: 'Consistency becomes leverage',
            heroTitle: 'Stable behavior builds real growth',
            heroSubtitle: 'This rewards the pattern you maintained over time.',
            mainTitle: 'That makes this a stronger signal than a one-off win.',
            introLead: 'Consistency is one of the clearest predictors of longer-term trader value.',
            bodyOne:
              'This recognition helps you continue with more confidence and a clearer upward path.',
            bodyTwo: 'What this badge gives you now:',
            boxOneTitle: 'Signal',
            boxOneCopy: 'Your pattern is visible',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Growth has a clearer path',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Progress feels earned',
            bodyThree: 'Open the platform and use that momentum while it is still fresh.',
            bodyFour: 'If you want a human layer, it is there, but the platform should stay first.',
            ctaLabel: 'Open the Growth Path',
            ctaHelper: 'Use your current rhythm as the base for the next phase',
            supportLabel: 'Want a quick human read?',
            supportHelper: 'WhatsApp is only a secondary support layer',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Most Consistent - Badge Award A IT',
          description: 'Apertura recognition-led per engagement basato sulla costanza.',
          subject: 'Hai ottenuto il tuo badge Bullwaves di consistenza.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'Badge consistenza assegnato',
            heroTitle: 'La costanza merita riconoscimento',
            heroSubtitle: 'Questo primo touch trasforma la stabilita in identita e slancio.',
            mainTitle: 'Hai gia fatto la cosa piu difficile: restare attivo con continuita.',
            introLead:
              'Questo badge non e cosmetico. Mostra che il tuo comportamento e abbastanza strutturato da costruirci sopra.',
            bodyOne:
              'Il punto e rendere il progresso visibile e dare al prossimo mese una narrativa piu chiara.',
            bodyTwo: 'Questo riconoscimento rafforza:',
            boxOneTitle: 'Identita',
            boxOneCopy: 'Sei un trader costante',
            boxTwoTitle: 'Momentum',
            boxTwoCopy: 'Il tuo percorso ha trazione',
            boxThreeTitle: 'Prossimo step',
            boxThreeCopy: 'La crescita ora sembra naturale',
            bodyThree:
              'La piattaforma resta il posto migliore per continuare perche li il tuo progresso diventa misurabile.',
            bodyFour:
              'Il supporto c e se utile, ma deve restare secondario rispetto al tuo ritmo in piattaforma.',
            ctaLabel: 'Guarda il tuo Percorso Badge',
            ctaHelper: 'Apri la piattaforma e continua da una posizione piu forte',
            supportLabel: 'Ti serve un checkpoint consulenziale?',
            supportHelper: 'Usa il supporto solo per un rapido checkpoint crescita',
          },
        },
        {
          name: 'Most Consistent - Badge Award B IT',
          description: 'Variante momentum-led che trasforma la costanza in movimento verso l alto.',
          subject: 'La tua costanza e ora un asset di crescita su Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'La costanza diventa leva',
            heroTitle: 'La crescita vera nasce dalla costanza',
            heroSubtitle: 'Questo riconosce il pattern che hai mantenuto nel tempo.',
            mainTitle: 'Questo la rende un segnale piu forte di una vittoria isolata.',
            introLead:
              'La costanza e uno dei segnali piu utili del valore di un trader nel medio periodo.',
            bodyOne:
              'Questo riconoscimento ti aiuta a continuare con piu fiducia e una direzione piu chiara.',
            bodyTwo: 'Cosa ti da questo badge adesso:',
            boxOneTitle: 'Segnale',
            boxOneCopy: 'Il tuo pattern e visibile',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'La crescita ha un percorso piu chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Il progresso si percepisce meritato',
            bodyThree: 'Apri la piattaforma e usa questo momentum finche e ancora fresco.',
            bodyFour: 'Se vuoi un layer umano c e, ma la piattaforma deve restare al primo posto.',
            ctaLabel: 'Apri il Percorso di Crescita',
            ctaHelper: 'Usa il tuo ritmo attuale come base della fase successiva',
            supportLabel: 'Vuoi un rapido punto umano?',
            supportHelper: 'WhatsApp e solo un layer secondario di supporto',
          },
        }
      ),
    },
  },
  most_consistent_growth_roadmap_email: {
    id: 'most_consistent_growth_roadmap_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Most Consistent - Growth Roadmap A',
          description:
            'Structured roadmap touch that channels consistency into clear next milestones.',
          subject: 'Your Bullwaves roadmap is ready. Let consistency become growth.',
          html: {
            lang: 'en',
            eyebrow: 'Consistency Growth Journey',
            title: 'Growth roadmap sent',
            heroTitle: 'Turn consistency into growth',
            heroSubtitle: 'Stable traders scale faster when milestones are clear.',
            mainTitle: 'This roadmap exists to reduce drift.',
            introLead:
              'Consistency alone has value, but consistency with milestones is what upgrades a trader over time.',
            bodyOne:
              'The roadmap gives structure to the next phase without overcomplicating your rhythm.',
            bodyTwo: 'It is designed to sharpen three things:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'Clear next milestone',
            boxTwoTitle: 'Discipline',
            boxTwoCopy: 'Better monthly rhythm',
            boxThreeTitle: 'Upgrade',
            boxThreeCopy: 'Path toward stronger segments',
            bodyThree:
              'Use the platform to review the roadmap and let that guide the next few weeks of activity.',
            bodyFour: 'Support is optional only if you want help interpreting the path.',
            ctaLabel: 'Open Your Roadmap',
            ctaHelper: 'Review the next milestones directly from the platform',
            supportLabel: 'Need one roadmap clarification?',
            supportHelper: 'Human guidance stays secondary',
          },
        },
        {
          name: 'Most Consistent - Growth Roadmap B',
          description: 'Milestone-led variant built to make steady traders feel upward movement.',
          subject: 'A steadier trader should never feel directionless.',
          html: {
            lang: 'en',
            eyebrow: 'Consistency Growth Journey',
            title: 'A clearer direction',
            heroTitle: 'Growth gets easier on a clear path',
            heroSubtitle: 'This roadmap makes repeated effort more directional.',
            mainTitle: 'Without milestones, consistency can feel flat.',
            introLead:
              'This roadmap makes your progress easier to read and extend into the next level.',
            bodyOne:
              'It keeps the journey practical: clear markers, cleaner direction, and more reason to stay engaged.',
            bodyTwo: 'What the roadmap helps create:',
            boxOneTitle: 'Measurement',
            boxOneCopy: 'Progress becomes visible',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Less behavioral drift',
            boxThreeTitle: 'Ambition',
            boxThreeCopy: 'Higher-fit next target',
            bodyThree: 'Open the platform and use the roadmap as your frame for the next period.',
            bodyFour:
              'If one detail needs context, support is available, but it should stay in second position.',
            ctaLabel: 'Review the Roadmap',
            ctaHelper: 'Use the roadmap to anchor your next cycle of activity',
            supportLabel: 'Need a quick checkpoint?',
            supportHelper: 'Use support only if one point needs interpretation',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Most Consistent - Growth Roadmap A IT',
          description: 'Touch strutturato che canalizza la costanza in milestone chiare.',
          subject: 'La tua roadmap Bullwaves e pronta. Trasforma la costanza in crescita.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'Roadmap crescita inviata',
            heroTitle: 'Trasforma la costanza in crescita',
            heroSubtitle: 'I trader stabili scalano piu velocemente con traguardi chiari.',
            mainTitle: 'Questa roadmap esiste per ridurre la deriva.',
            introLead:
              'La costanza da sola ha valore, ma con milestone chiare diventa crescita reale nel tempo.',
            bodyOne: 'La roadmap da struttura a questa fase senza complicare il tuo ritmo.',
            bodyTwo: 'Serve ad affinare tre aspetti:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'Milestone successiva chiara',
            boxTwoTitle: 'Disciplina',
            boxTwoCopy: 'Ritmo mensile migliore',
            boxThreeTitle: 'Upgrade',
            boxThreeCopy: 'Percorso verso segmenti piu forti',
            bodyThree:
              'Usa la piattaforma per rivedere la roadmap e lascia che guidi le prossime settimane di attivita.',
            bodyFour: 'Il supporto e opzionale solo se vuoi aiuto nell interpretare il percorso.',
            ctaLabel: 'Apri la tua Roadmap',
            ctaHelper: 'Rivedi le prossime milestone direttamente dalla piattaforma',
            supportLabel: 'Ti serve un chiarimento sulla roadmap?',
            supportHelper: 'La guida umana resta secondaria',
          },
        },
        {
          name: 'Most Consistent - Growth Roadmap B IT',
          description: 'Variante milestone-led pensata per far percepire movimento verso l alto.',
          subject: 'Un trader piu costante non dovrebbe mai sentirsi senza direzione.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'Una direzione piu chiara',
            heroTitle: 'La crescita e piu semplice su un percorso chiaro',
            heroSubtitle: 'Questa roadmap rende lo sforzo ripetuto piu direzionale.',
            mainTitle: 'Senza milestone, la costanza puo sembrare piatta.',
            introLead:
              'Questa roadmap rende il tuo progresso piu leggibile e piu facile da spingere avanti.',
            bodyOne:
              'Mantiene il journey pratico: marker chiari, direzione piu pulita e piu motivi per restare coinvolto.',
            bodyTwo: 'Cosa aiuta a creare la roadmap:',
            boxOneTitle: 'Misura',
            boxOneCopy: 'Il progresso si vede meglio',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Meno deriva comportamentale',
            boxThreeTitle: 'Ambizione',
            boxThreeCopy: 'Target successivo piu adatto',
            bodyThree: 'Apri la piattaforma e usa la roadmap come frame del prossimo periodo.',
            bodyFour:
              'Se un dettaglio richiede contesto, il supporto c e, ma deve restare in seconda posizione.',
            ctaLabel: 'Rivedi la Roadmap',
            ctaHelper: 'Usa la roadmap per ancorare il tuo prossimo ciclo di attivita',
            supportLabel: 'Ti serve un checkpoint rapido?',
            supportHelper: 'Usa il supporto solo se un punto richiede interpretazione',
          },
        }
      ),
    },
  },
  most_consistent_loyalty_reward_email: {
    id: 'most_consistent_loyalty_reward_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Most Consistent - Loyalty Reward A',
          description: 'Reward touch tied to challenge completion and sustained rhythm.',
          subject: 'Your consistency is unlocking a Bullwaves loyalty reward.',
          html: {
            lang: 'en',
            eyebrow: 'Consistency Reward Layer',
            title: 'Loyalty reward sent',
            heroTitle: 'Consistency should produce upside',
            heroSubtitle: 'This reward reinforces your behavior before it cools.',
            mainTitle: 'The right reward makes consistency stickier.',
            introLead:
              'When traders see a concrete payoff from stable behavior, they are more likely to keep the pattern going.',
            bodyOne:
              'This touch connects your current rhythm with a reason to stay engaged and keep progressing.',
            bodyTwo: 'The reward reinforces:',
            boxOneTitle: 'Behavior',
            boxOneCopy: 'Stay on the stronger pattern',
            boxTwoTitle: 'Motivation',
            boxTwoCopy: 'Keep the challenge alive',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Lower risk of drop-off',
            bodyThree:
              'Use the platform to review the reward context and keep the next actions aligned with your current path.',
            bodyFour: 'Support is there only if you want one consultative checkpoint.',
            ctaLabel: 'Review Your Reward',
            ctaHelper: 'Open the platform and keep the growth loop active',
            supportLabel: 'Need a quick reward clarification?',
            supportHelper: 'Support remains secondary',
          },
        },
        {
          name: 'Most Consistent - Loyalty Reward B',
          description: 'Progress-led reward variant centered on continuity and upward migration.',
          subject: 'Stable effort deserves a stronger Bullwaves reward signal.',
          html: {
            lang: 'en',
            eyebrow: 'Consistency Reward Layer',
            title: 'Reward the right pattern',
            heroTitle: 'Progress should feel reinforced',
            heroSubtitle: 'This reward gives your current path more weight.',
            mainTitle: 'Consistency grows faster when it gets acknowledged concretely.',
            introLead:
              'A well-timed reward can make a stable pattern more durable and the next upgrade easier.',
            bodyOne:
              'This is about keeping your rhythm alive and making the upward path feel earned.',
            bodyTwo: 'What the reward is meant to strengthen:',
            boxOneTitle: 'Value',
            boxOneCopy: 'Your effort feels recognized',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'The habit stays active',
            boxThreeTitle: 'Promotion',
            boxThreeCopy: 'Move closer to stronger tiers',
            bodyThree: 'Open the platform and use the reward as reinforcement for the next phase.',
            bodyFour: 'Human support is optional if you want a more consultative read.',
            ctaLabel: 'Open the Reward Layer',
            ctaHelper: 'Keep your current pattern moving toward the next level',
            supportLabel: 'Need a human interpretation?',
            supportHelper: 'Use WhatsApp only if you want extra context',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Most Consistent - Loyalty Reward A IT',
          description: 'Touch reward collegato a challenge completata e ritmo sostenuto.',
          subject: 'La tua costanza sta sbloccando una loyalty reward Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Reward Layer',
            title: 'Reward fedelta inviata',
            heroTitle: 'La costanza dovrebbe produrre valore',
            heroSubtitle: 'Questo premio rinforza il tuo comportamento prima che rallenti.',
            mainTitle: 'Il reward giusto rende la costanza piu sticky.',
            introLead:
              'Quando i trader vedono un payoff concreto di un comportamento stabile, e piu probabile che mantengano quel pattern.',
            bodyOne:
              'Questo touch collega il tuo ritmo attuale con un motivo in piu per restare coinvolto.',
            bodyTwo: 'Il reward rafforza:',
            boxOneTitle: 'Comportamento',
            boxOneCopy: 'Resta sul pattern migliore',
            boxTwoTitle: 'Motivazione',
            boxTwoCopy: 'Tieni viva la challenge',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Meno rischio di drop-off',
            bodyThree:
              'Usa la piattaforma per rivedere il contesto reward e mantenere allineate le prossime azioni.',
            bodyFour: 'Il supporto c e solo se vuoi un checkpoint consulenziale.',
            ctaLabel: 'Rivedi il tuo Reward',
            ctaHelper: 'Apri la piattaforma e mantieni attivo il loop di crescita',
            supportLabel: 'Ti serve un chiarimento rapido sul reward?',
            supportHelper: 'Il supporto resta secondario',
          },
        },
        {
          name: 'Most Consistent - Loyalty Reward B IT',
          description: 'Variante progress-led centrata su continuita e migrazione verso l alto.',
          subject: 'Uno sforzo stabile merita un segnale reward Bullwaves piu forte.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Reward Layer',
            title: 'Premia il pattern giusto',
            heroTitle: 'Il progresso dovrebbe sentirsi rinforzato',
            heroSubtitle: 'Questo premio da piu peso al tuo percorso attuale.',
            mainTitle:
              'La costanza cresce piu velocemente quando viene riconosciuta in modo concreto.',
            introLead:
              'Un reward ben temporizzato puo rendere un pattern stabile piu durevole e facilitare il prossimo upgrade.',
            bodyOne:
              'Qui si tratta di tenere vivo il tuo ritmo e rendere piu meritato il percorso verso l alto.',
            bodyTwo: 'Cosa punta a rafforzare questo reward:',
            boxOneTitle: 'Valore',
            boxOneCopy: 'Lo sforzo si sente riconosciuto',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'L abitudine resta attiva',
            boxThreeTitle: 'Promozione',
            boxThreeCopy: 'Piu vicino ai tier forti',
            bodyThree: 'Apri la piattaforma e usa il reward come rinforzo della fase successiva.',
            bodyFour: 'Il supporto umano e opzionale se vuoi una lettura piu consulenziale.',
            ctaLabel: 'Apri il Layer Reward',
            ctaHelper: 'Mantieni il pattern corrente in movimento verso il livello successivo',
            supportLabel: 'Ti serve un interpretazione umana?',
            supportHelper: 'Usa WhatsApp solo se vuoi contesto extra',
          },
        }
      ),
    },
  },
  most_consistent_top_performers_onboarding_email: {
    id: 'most_consistent_top_performers_onboarding_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Most Consistent - Top Performers Onboarding A',
          description: 'Escalation touch that frames promotion as the next deserved environment.',
          subject: 'You are ready for the Bullwaves Top Performers path.',
          html: {
            lang: 'en',
            eyebrow: 'Upward Migration Journey',
            title: 'Top Performers onboarding',
            heroTitle: 'Your consistency is earning an upgrade',
            heroSubtitle: 'Stable behavior is starting to look premium.',
            mainTitle: 'Promotion should feel like progression, not surprise.',
            introLead:
              'If you reached this point, the right next step is to enter a path with higher expectations and better support.',
            bodyOne: 'This onboarding touch makes that migration feel natural and deserved.',
            bodyTwo: 'What the promotion changes:',
            boxOneTitle: 'Level',
            boxOneCopy: 'You enter a stronger segment',
            boxTwoTitle: 'Support',
            boxTwoCopy: 'More premium servicing',
            boxThreeTitle: 'Potential',
            boxThreeCopy: 'Higher-value path ahead',
            bodyThree:
              'Open the platform and treat this as the handoff into your next environment.',
            bodyFour:
              'Support is available if you want a human bridge into the new tier, but the platform stays first.',
            ctaLabel: 'Enter the Top Performers Path',
            ctaHelper: 'Use the client area to begin the upgraded segment journey',
            supportLabel: 'Need a guided handoff?',
            supportHelper: 'WhatsApp remains secondary to the platform move',
          },
        },
        {
          name: 'Most Consistent - Top Performers Onboarding B',
          description:
            'Confidence-led promotion variant focused on earned escalation and next-level retention.',
          subject: 'Your Bullwaves profile is moving into a stronger segment.',
          html: {
            lang: 'en',
            eyebrow: 'Upward Migration Journey',
            title: 'Move into the next tier',
            heroTitle: 'You built the behavior. Enter the stronger tier.',
            heroSubtitle: 'This migration is the natural result of lasting consistency.',
            mainTitle: 'The right upgrade should feel earned and operationally clear.',
            introLead:
              'This is your handoff into a segment with more premium attention and a more strategic path.',
            bodyOne:
              'The move matters because it gives your current pattern a better environment to grow in.',
            bodyTwo: 'The new tier gives you:',
            boxOneTitle: 'Recognition',
            boxOneCopy: 'You outgrew the old path',
            boxTwoTitle: 'Environment',
            boxTwoCopy: 'A stronger support model',
            boxThreeTitle: 'Trajectory',
            boxThreeCopy: 'More upside in the next cycle',
            bodyThree:
              'Use the platform as the point where the old pattern hands off into the new one.',
            bodyFour: 'Human support is there only if you want a more consultative transition.',
            ctaLabel: 'Open the New Tier',
            ctaHelper: 'Start the upgraded segment path',
            supportLabel: 'Want a direct transition touch?',
            supportHelper: 'Keep support as a secondary layer',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Most Consistent - Top Performers Onboarding A IT',
          description:
            'Touch di escalation che presenta la promozione come prossimo ambiente meritato.',
          subject: 'Sei pronto per il percorso Bullwaves Top Performers.',
          html: {
            lang: 'it',
            eyebrow: 'Upward Migration Journey',
            title: 'Onboarding Top Performers',
            heroTitle: 'La tua costanza sta guadagnando un upgrade',
            heroSubtitle: 'Qui un comportamento stabile inizia a sembrare premium.',
            mainTitle: 'La promozione deve sentirsi progressione, non sorpresa.',
            introLead:
              'Se sei arrivato qui, il prossimo step corretto e entrare in un percorso con aspettative piu alte e supporto migliore.',
            bodyOne: 'Questo touch onboarding rende la migrazione naturale e meritata.',
            bodyTwo: 'Cosa cambia con la promozione:',
            boxOneTitle: 'Livello',
            boxOneCopy: 'Entri in un segmento piu forte',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Servicing piu premium',
            boxThreeTitle: 'Potenziale',
            boxThreeCopy: 'Percorso di valore superiore',
            bodyThree:
              'Apri la piattaforma e tratta questo passaggio come handoff nel tuo prossimo ambiente.',
            bodyFour:
              'Il supporto c e se vuoi un ponte umano verso il nuovo tier, ma la piattaforma resta prima.',
            ctaLabel: 'Entra nel Percorso Top Performers',
            ctaHelper: 'Usa l area cliente per iniziare il journey del segmento evoluto',
            supportLabel: 'Ti serve un handoff guidato?',
            supportHelper: 'WhatsApp resta secondario rispetto al passaggio in piattaforma',
          },
        },
        {
          name: 'Most Consistent - Top Performers Onboarding B IT',
          description:
            'Variante confidence-led focalizzata su escalation meritata e retention di livello superiore.',
          subject: 'Il tuo profilo Bullwaves sta entrando in un segmento piu forte.',
          html: {
            lang: 'it',
            eyebrow: 'Upward Migration Journey',
            title: 'Passa al tier successivo',
            heroTitle: 'Hai costruito il comportamento. Entra nel tier piu forte.',
            heroSubtitle: 'Questa migrazione e il risultato naturale di una costanza duratura.',
            mainTitle: 'L upgrade giusto deve sentirsi meritato e chiaro anche operativamente.',
            introLead:
              'Questo e il tuo handoff in un segmento con attenzione piu premium e un percorso piu strategico.',
            bodyOne:
              'Il passaggio conta perche da al tuo pattern un ambiente migliore in cui crescere.',
            bodyTwo: 'Il nuovo tier ti offre:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Hai superato il vecchio percorso',
            boxTwoTitle: 'Ambiente',
            boxTwoCopy: 'Un modello di supporto piu forte',
            boxThreeTitle: 'Traiettoria',
            boxThreeCopy: 'Piu upside nel prossimo ciclo',
            bodyThree:
              'Usa la piattaforma come punto in cui il vecchio pattern passa il testimone al nuovo.',
            bodyFour: 'Il supporto umano c e solo se vuoi una transizione piu consulenziale.',
            ctaLabel: 'Apri il Nuovo Tier',
            ctaHelper: 'Avvia il percorso di segmento evoluto',
            supportLabel: 'Vuoi un touch diretto sulla transizione?',
            supportHelper: 'Mantieni il supporto come layer secondario',
          },
        }
      ),
    },
  },
  most_consistent_cycle_restart_email: {
    id: 'most_consistent_cycle_restart_email',
    channel: 'email',
    locales: {
      en: makeLocaleVariants(
        {
          name: 'Most Consistent - Cycle Restart A',
          description: 'Re-entry loop for consistent traders who need a fresh structured restart.',
          subject: 'Restart your Bullwaves cycle with a cleaner challenge path.',
          html: {
            lang: 'en',
            eyebrow: 'Cycle Restart Journey',
            title: 'Cycle restart',
            heroTitle: 'A softer restart can preserve the habit',
            heroSubtitle: 'This loop is for traders who need a clearer reset.',
            mainTitle: 'Not every slowdown means the story is over.',
            introLead:
              'Sometimes a consistent trader simply needs a new frame and a lighter way to restart movement.',
            bodyOne:
              'That is what this touch is built for: restart the rhythm without making the journey feel heavy.',
            bodyTwo: 'The restart helps restore:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'A cleaner next step',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Renewed engagement pattern',
            boxThreeTitle: 'Potential',
            boxThreeCopy: 'Another chance to scale',
            bodyThree: 'Reopen the platform and let the next cycle begin from a simpler frame.',
            bodyFour: 'Human support remains available if you want one consultative restart point.',
            ctaLabel: 'Restart the Cycle',
            ctaHelper: 'Use the platform to relaunch your next loop',
            supportLabel: 'Need a soft restart assist?',
            supportHelper: 'Use support only if you want one extra point of clarity',
          },
        },
        {
          name: 'Most Consistent - Cycle Restart B',
          description: 'Low-pressure restart variant that keeps the account relationship alive.',
          subject: 'A cleaner Bullwaves restart is still available to you.',
          html: {
            lang: 'en',
            eyebrow: 'Cycle Restart Journey',
            title: 'A cleaner restart',
            heroTitle: 'Restart without extra weight',
            heroSubtitle: 'A better reset often beats a harder push.',
            mainTitle: 'This is about preserving the relationship, not forcing it.',
            introLead:
              'If engagement cooled, the smartest move may be to reduce pressure and create a cleaner way back.',
            bodyOne:
              'This restart loop is built to do exactly that while keeping your growth potential alive.',
            bodyTwo: 'It is meant to recover:',
            boxOneTitle: 'Relevance',
            boxOneCopy: 'Make the next step feel current again',
            boxTwoTitle: 'Simplicity',
            boxTwoCopy: 'Lower friction to re-entry',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'Keep the relationship open',
            bodyThree:
              'Return through the platform first and let the softer challenge path do the rest.',
            bodyFour: 'Support is there only if it helps unlock the return.',
            ctaLabel: 'Open the Restart Path',
            ctaHelper: 'Re-enter the client area with a lighter frame',
            supportLabel: 'Need one restart checkpoint?',
            supportHelper: 'Support stays secondary and optional',
          },
        }
      ),
      it: makeLocaleVariants(
        {
          name: 'Most Consistent - Cycle Restart A IT',
          description:
            'Loop di rientro per trader costanti che hanno bisogno di una ripartenza piu pulita.',
          subject: 'Riavvia il tuo ciclo Bullwaves con un percorso challenge piu chiaro.',
          html: {
            lang: 'it',
            eyebrow: 'Cycle Restart Journey',
            title: 'Riavvio ciclo',
            heroTitle: 'Una ripartenza piu soft puo preservare l abitudine',
            heroSubtitle: 'Questo loop e per trader che hanno bisogno di un reset piu chiaro.',
            mainTitle: 'Non ogni rallentamento significa che la storia e finita.',
            introLead:
              'A volte un trader costante ha solo bisogno di un nuovo frame e di un modo piu leggero per ripartire.',
            bodyOne:
              'Questo e il ruolo del touch: riavviare il ritmo senza far sembrare il journey pesante.',
            bodyTwo: 'Il restart aiuta a recuperare:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'Un prossimo step piu pulito',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Pattern di engagement rinnovato',
            boxThreeTitle: 'Potenziale',
            boxThreeCopy: 'Un altra occasione per scalare',
            bodyThree:
              'Riapri la piattaforma e lascia che il prossimo ciclo parta da un frame piu semplice.',
            bodyFour:
              'Il supporto umano resta disponibile se vuoi un punto di restart piu consulenziale.',
            ctaLabel: 'Riavvia il Ciclo',
            ctaHelper: 'Usa la piattaforma per rilanciare il tuo prossimo loop',
            supportLabel: 'Ti serve un assist soft alla ripartenza?',
            supportHelper: 'Usa il supporto solo se vuoi un punto di chiarezza in piu',
          },
        },
        {
          name: 'Most Consistent - Cycle Restart B IT',
          description: 'Variante low-pressure che tiene viva la relazione account.',
          subject: 'Una ripartenza Bullwaves piu pulita e ancora disponibile per te.',
          html: {
            lang: 'it',
            eyebrow: 'Cycle Restart Journey',
            title: 'Una ripartenza piu pulita',
            heroTitle: 'Riparti senza appesantire il passo dopo',
            heroSubtitle: 'Un reset migliore spesso batte una spinta piu dura.',
            mainTitle: 'Qui si tratta di preservare la relazione, non di forzarla.',
            introLead:
              'Se l engagement si e raffreddato, la mossa piu intelligente puo essere ridurre la pressione e chiarire il percorso.',
            bodyOne:
              'Questo restart loop serve esattamente a quello, mantenendo vivo il tuo potenziale di crescita.',
            bodyTwo: 'Punta a recuperare:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Rendere attuale il prossimo step',
            boxTwoTitle: 'Semplicita',
            boxTwoCopy: 'Meno attrito al rientro',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Tenere aperta la relazione',
            bodyThree:
              'Torna prima dalla piattaforma e lascia che il percorso challenge piu leggero faccia il resto.',
            bodyFour: 'Il supporto c e solo se aiuta a sbloccare il ritorno.',
            ctaLabel: 'Apri il Percorso Restart',
            ctaHelper: 'Rientra nell area cliente con un frame piu leggero',
            supportLabel: 'Ti serve un checkpoint restart?',
            supportHelper: 'Il supporto resta secondario e opzionale',
          },
        }
      ),
    },
  },
}
