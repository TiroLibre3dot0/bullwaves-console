import { makeLocaleVariants } from './segmentJourneyTemplateBuilder.js'
import { createJourneyIconSelection } from './emailJourneyIconRegistry.js'

const ADDITIONAL_JOURNEY_ICON_SETS = {
  top_performing_vip_recognition_email: createJourneyIconSelection({
    boxOneKey: 'strongerExperience',
    boxTwoKey: 'premiumAccess',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale:
      'VIP recognition should use premium and experience-led icons instead of generic legacy security badges.',
  }),
  top_performing_advanced_tools_email: createJourneyIconSelection({
    boxOneKey: 'secureApproval',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['trading', 'onboarding'],
    rationale:
      'Advanced-tools journeys should look like a stronger environment, not a generic access reminder.',
  }),
  top_performing_loyalty_upgrade_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale:
      'Upgrade journeys should keep the visual focus on higher-tier value and product quality.',
  }),
  top_performing_vip_review_email: createJourneyIconSelection({
    boxOneKey: 'readyToTrade',
    boxTwoKey: 'premiumAccess',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['trading'],
    rationale:
      'VIP review journeys should prioritize active trading context and premium environment cues.',
  }),
  top_performing_premium_nurture_email: createJourneyIconSelection({
    boxOneKey: 'strongerExperience',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['trading'],
    rationale: 'Premium nurture should look curated and high-value, not operationally generic.',
  }),
  most_consistent_badge_award_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'secureApproval',
    recommendedGroups: ['trading', 'onboarding'],
    rationale:
      'Badge-award journeys should combine recognition, stronger experience, and verified-status cues.',
  }),
  most_consistent_growth_roadmap_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['onboarding', 'trading'],
    rationale:
      'Roadmap journeys should use milestone and next-step iconography, not generic support symbols.',
  }),
  most_consistent_loyalty_reward_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Loyalty rewards should feel earned, premium, and forward-looking.',
  }),
  most_consistent_top_performers_onboarding_email: createJourneyIconSelection({
    boxOneKey: 'activateAccount',
    boxTwoKey: 'premiumAccess',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['account', 'trading'],
    rationale:
      'Migration into top performers should combine activation with higher-tier access and readiness.',
  }),
  most_consistent_cycle_restart_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding', 'trading'],
    rationale:
      'Cycle-restart journeys should privilege timing, return-to-market, and a smoother experience.',
  }),
  reward_candidates_step1_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Reward-candidate opening should feel premium, selective, and progression-driven.',
  }),
  reward_candidates_step2_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'premiumAccess',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['trading', 'onboarding'],
    rationale: 'Reward roadmap touches should show structured path and execution readiness.',
  }),
  reward_candidates_step3_email: createJourneyIconSelection({
    boxOneKey: 'strongerExperience',
    boxTwoKey: 'premiumAccess',
    boxThreeKey: 'secureApproval',
    recommendedGroups: ['trading'],
    rationale: 'Commitment touches should reinforce trust, continuity, and account quality.',
  }),
  reward_candidates_followup_retained_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['trading'],
    rationale: 'Retained follow-up should reinforce progression and premium relationship.',
  }),
  reward_candidates_followup_recovery_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Recovery follow-up should reduce friction and guide controlled re-entry.',
  }),
  rising_step1_email: createJourneyIconSelection({
    boxOneKey: 'marketOpportunities',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['trading'],
    rationale: 'Rising opening should signal momentum, action, and a stronger setup.',
  }),
  rising_step2_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Milestone step should communicate structure, opportunities, and progression.',
  }),
  rising_step3_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'secureApproval',
    recommendedGroups: ['trading'],
    rationale: 'Preparation step should feel premium, solid, and reliable.',
  }),
  rising_followup_retained_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['trading'],
    rationale: 'Positive follow-up should reinforce continuity and next growth target.',
  }),
  rising_followup_recovery_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'onboardingTimeline',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Recovery follow-up should keep pressure low and path clear.',
  }),
  churned_high_value_step1_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['trading'],
    rationale:
      'High-value comeback opening should signal relevance, quality, and immediate re-entry.',
  }),
  churned_high_value_step2_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Return package should look structured, selective, and value-focused.',
  }),
  churned_high_value_step3_email: createJourneyIconSelection({
    boxOneKey: 'strongerExperience',
    boxTwoKey: 'secureApproval',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['trading'],
    rationale: 'Executive reactivation should reinforce trust, control, and premium continuity.',
  }),
  churned_high_value_followup_retained_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Positive follow-up should lock continuity and return user into active rhythm.',
  }),
  churned_high_value_followup_recovery_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'onboardingTimeline',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Recovery follow-up should reduce friction and preserve relationship value.',
  }),
  dormant_value_step1_email: createJourneyIconSelection({
    boxOneKey: 'strongerExperience',
    boxTwoKey: 'noTimeLoss',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['trading', 'onboarding'],
    rationale: 'Dormant value opening should feel useful, credible, and low-friction.',
  }),
  dormant_value_step2_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Dormant value restart should show a clear and practical return sequence.',
  }),
  dormant_value_step3_email: createJourneyIconSelection({
    boxOneKey: 'secureApproval',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Continuity reinforcement should protect the first recovery signal.',
  }),
  dormant_value_followup_retained_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Positive recovery should reinforce active continuity and confidence.',
  }),
  dormant_value_followup_recovery_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'onboardingTimeline',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Fallback return should reduce pressure and keep the relationship open.',
  }),
  dormant_mid_step1_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Dormant mid opening should feel more tailored and value-aware.',
  }),
  dormant_mid_step2_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Mid-value relaunch should balance structure, relevance, and action.',
  }),
  dormant_mid_step3_email: createJourneyIconSelection({
    boxOneKey: 'secureApproval',
    boxTwoKey: 'premiumAccess',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['trading'],
    rationale: 'Manager continuity should look stable, useful, and supportive.',
  }),
  dormant_mid_followup_retained_email: createJourneyIconSelection({
    boxOneKey: 'premiumAccess',
    boxTwoKey: 'marketOpportunities',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['trading'],
    rationale: 'Recovered mid-value profiles should feel back on a stronger path.',
  }),
  dormant_mid_followup_recovery_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'onboardingTimeline',
    boxThreeKey: 'premiumAccess',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Extended winback should keep re-entry simple and credible.',
  }),
  dormant_low_step1_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'readyToTrade',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding', 'trading'],
    rationale: 'Dormant low re-entry should stay simple, calm, and easy to understand.',
  }),
  dormant_low_step2_email: createJourneyIconSelection({
    boxOneKey: 'onboardingTimeline',
    boxTwoKey: 'noTimeLoss',
    boxThreeKey: 'readyToTrade',
    recommendedGroups: ['onboarding'],
    rationale: 'Simple restart should reduce complexity and emphasize one next action.',
  }),
  dormant_low_step3_email: createJourneyIconSelection({
    boxOneKey: 'strongerExperience',
    boxTwoKey: 'secureApproval',
    boxThreeKey: 'noTimeLoss',
    recommendedGroups: ['onboarding'],
    rationale: 'Light nurture should protect continuity without feeling too heavy.',
  }),
  dormant_low_followup_retained_email: createJourneyIconSelection({
    boxOneKey: 'readyToTrade',
    boxTwoKey: 'strongerExperience',
    boxThreeKey: 'marketOpportunities',
    recommendedGroups: ['trading'],
    rationale: 'Positive low-value recovery should reinforce a clean active rhythm.',
  }),
  dormant_low_followup_recovery_email: createJourneyIconSelection({
    boxOneKey: 'noTimeLoss',
    boxTwoKey: 'onboardingTimeline',
    boxThreeKey: 'strongerExperience',
    recommendedGroups: ['onboarding'],
    rationale: 'Long-tail winback should preserve low pressure and clarity.',
  }),
}

function makeAdditionalLocaleVariants(templateId, variantA, variantB) {
  const iconSet = ADDITIONAL_JOURNEY_ICON_SETS[templateId] || {}

  return makeLocaleVariants(
    {
      ...variantA,
      html: {
        ...variantA.html,
        ...iconSet,
      },
    },
    {
      ...variantB,
      html: {
        ...variantB.html,
        ...iconSet,
      },
    },
    templateId
  )
}

export const additionalSegmentJourneyTemplatesById = {
  top_performing_vip_recognition_email: {
    id: 'top_performing_vip_recognition_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'top_performing_vip_recognition_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'top_performing_vip_recognition_email',
        {
          name: 'Top Performing - VIP Recognition A IT',
          description:
            'Touch di riconoscimento che presenta il trader come relazione premium da proteggere.',
          subject:
            'Sei tra i top performer Bullwaves. Il prossimo passo è costruito di conseguenza.',
          html: {
            lang: 'it',
            eyebrow: 'Percorso VIP',
            title: 'Riconoscimento top performer',
            heroTitle: 'La tua performance è stata notata',
            heroSubtitle: 'Questo messaggio premium protegge slancio e valore.',
            mainTitle: 'Non sei in un percorso di comunicazione standard.',
            introLead:
              'Il tuo comportamento recente ti colloca tra i profili da trattenere con più attenzione.',
            bodyOne:
              'Per questo il primo messaggio parte dal riconoscimento: valorizzare la performance e rendere meritato il passo dopo.',
            bodyTwo: 'Cosa cambia a questo livello:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Percorso più esclusivo',
            boxTwoTitle: 'Accesso',
            boxTwoCopy: 'Supporto di mercato più rilevante',
            boxThreeTitle: 'Copertura',
            boxThreeCopy: 'Contatto umano più rapido',
            bodyThree:
              "La mossa principale è semplice: rientra nell'area trading e continua con il supporto giusto.",
            bodyFour:
              'WhatsApp resta disponibile se serve, ma la piattaforma resta il percorso primario.',
            ctaLabel: 'Apri la tua Area Premium',
          },
        },
        {
          name: 'Top Performing - VIP Recognition B IT',
          description:
            'Variante status-led che trasforma il riconoscimento in segnale di retention premium.',
          subject: 'Il tuo profilo trading ha sbloccato un percorso Bullwaves più su misura.',
          html: {
            lang: 'it',
            eyebrow: 'Percorso VIP',
            title: 'Un percorso più su misura',
            heroTitle: 'Un trader ad alto valore merita un percorso su misura',
            heroSubtitle: "Il tuo profilo ora merita un'esperienza più curata.",
            mainTitle: 'Questo messaggio esiste perché la tua attività si distingue.',
            introLead:
              'Quando un trader mostra performance più forti, la mossa migliore è calibrare meglio il percorso.',
            bodyOne:
              'Questa sequenza tiene alto lo slancio e rende la relazione più intenzionale e premium.',
            bodyTwo: 'Su cosa si fonda questo percorso evoluto:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Comunicazione più adatta',
            boxTwoTitle: 'Priorità',
            boxTwoCopy: 'Servicing più forte',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Proteggere il comportamento profittevole',
            bodyThree:
              'La mossa migliore è continuare dalla piattaforma mentre il percorso premium sostiene la continuità.',
            bodyFour: "Il supporto c'è se utile, ma l'area cliente viene prima.",
            ctaLabel: 'Continua con Bullwaves',
          },
        }
      ),
    },
  },
  top_performing_advanced_tools_email: {
    id: 'top_performing_advanced_tools_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'top_performing_advanced_tools_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'top_performing_advanced_tools_email',
        {
          name: 'Top Performing - Advanced Tools A IT',
          description: 'Variante value expansion su insight premium e supporto operativo.',
          subject: 'Un trader più forte dovrebbe avere un supporto più preciso.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Value Expansion',
            title: 'Offerta strumenti avanzati',
            heroTitle: 'Aggiungi strumenti più forti alla performance',
            heroSubtitle: 'Una migliore esecuzione spesso migliora anche la fedeltà.',
            mainTitle: 'Qui si parla di supporto migliore, non di più rumore.',
            introLead:
              'Hai già trazione di trading. Il livello successivo migliora il contesto attorno alle decisioni.',
            bodyOne:
              'Questo significa più contesto, supporto più utile e una struttura che protegge il comportamento profittevole.',
            bodyTwo: 'Cosa punta a migliorare questa proposta:',
            boxOneTitle: 'Insight',
            boxOneCopy: "Più contesto prima dell'azione",
            boxTwoTitle: 'Operatività',
            boxTwoCopy: 'Flusso operativo più pulito',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Protezione del valore più lunga',
            bodyThree:
              "La piattaforma resta l'ambiente principale. Questa offerta la rende più utile per il tuo profilo.",
            bodyFour:
              "Se vuoi un checkpoint umano c'è, ma la mossa principale resta rientrare e usare il supporto evoluto.",
            ctaLabel: 'Scopri gli Strumenti Premium',
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
            heroTitle: 'Il tuo vantaggio merita più supporto',
            heroSubtitle: 'I trader premium perdono slancio quando il supporto resta indietro.',
            mainTitle: 'Il segnale lo hai già costruito. Ora va difeso.',
            introLead:
              'Il prossimo step non è un messaggio più forte. È un ambiente più intelligente attorno a come operi.',
            bodyOne:
              "Questo è il ruolo dell'offerta: migliorare la precisione del supporto senza rallentarti.",
            bodyTwo: "L'offerta ruota su tre leve:",
            boxOneTitle: 'Precisione',
            boxOneCopy: 'Guida più adatta',
            boxTwoTitle: 'Velocità',
            boxTwoCopy: 'Supporto premium più rapido',
            boxThreeTitle: 'Continuità',
            boxThreeCopy: 'Meno calo di engagement',
            bodyThree: 'Apri la piattaforma, rivedi il supporto evoluto e decidi quanto usarlo.',
            bodyFour:
              "Il supporto c'è se vuoi dettaglio, ma la piattaforma resta il primo passaggio.",
            ctaLabel: 'Valuta il Supporto Evoluto',
          },
        }
      ),
    },
  },
  top_performing_loyalty_upgrade_email: {
    id: 'top_performing_loyalty_upgrade_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'top_performing_loyalty_upgrade_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'top_performing_loyalty_upgrade_email',
        {
          name: 'Top Performing - Loyalty Upgrade A IT',
          description: 'Variante reward-led per comportamento profittevole sostenuto.',
          subject: 'La tua continuità sta aprendo un percorso loyalty premium.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Loyalty Layer',
            title: 'Upgrade livello loyalty',
            heroTitle: 'La continuità dovrebbe sentirsi premiata',
            heroSubtitle: 'Questo step trasforma il buon comportamento in valore visibile.',
            mainTitle: 'Un profilo premium deve vedere una progressione premium.',
            introLead:
              'Quando la performance resta forte nel tempo, la retention funziona meglio se il progresso si percepisce.',
            bodyOne:
              'Questo è il ruolo di questo passaggio loyalty: rendere la relazione più preziosa e più visibile.',
            bodyTwo: 'Cosa rafforza questo upgrade:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Progressi resi visibili',
            boxTwoTitle: 'Vantaggi',
            boxTwoCopy: 'Trattamento premium più rilevante',
            boxThreeTitle: 'Fedeltà',
            boxThreeCopy: 'Rischio churn più basso',
            bodyThree:
              "Il prossimo passo migliore resta dentro la piattaforma, dove l'upgrade diventa concreto.",
            bodyFour: 'Il supporto resta opzionale se vuoi una conferma umana del percorso.',
            ctaLabel: 'Attiva la Vista Upgrade',
          },
        },
        {
          name: 'Top Performing - Loyalty Upgrade B IT',
          description: 'Variante retention-led centrata su esclusività e continuità.',
          subject: 'Un livello loyalty più forte è pronto per il tuo profilo Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Loyalty Layer',
            title: 'Progressione premium',
            heroTitle: 'Mantieni il comportamento premium sul binario giusto',
            heroSubtitle: 'Il percorso migliore include un riconoscimento visibile.',
            mainTitle: 'Questo non è un programma premi generico.',
            introLead:
              'È un meccanismo di continuità per trader il cui valore deve continuare a crescere.',
            bodyOne:
              "L'upgrade rafforza la percezione che il tuo livello sia riconosciuto e supportato.",
            bodyTwo: 'Tre cose che questo livello punta a rafforzare:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Il tuo livello è visto',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Più motivo per restare attivo',
            boxThreeTitle: 'Relazione',
            boxThreeCopy: 'Legame premium più forte',
            bodyThree:
              'Rivedi la vista evoluta dalla piattaforma e usala come ancora per il prossimo periodo.',
            bodyFour:
              "Se vuoi supporto diretto c'è, ma il percorso principale resta la piattaforma.",
            ctaLabel: 'Rivedi il tuo Livello',
          },
        }
      ),
    },
  },
  top_performing_vip_review_email: {
    id: 'top_performing_vip_review_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'top_performing_vip_review_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'top_performing_vip_review_email',
        {
          name: 'Top Performing - VIP Review A IT',
          description:
            'Touch trimestrale focalizzato su qualità della relazione e continuità account.',
          subject: 'La tua review VIP trimestrale Bullwaves è pronta.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Review Cycle',
            title: 'Review VIP trimestrale',
            heroTitle: 'Una relazione premium va rivista',
            heroSubtitle: 'Questo follow-up allinea valore, supporto e prossimi passi.',
            mainTitle: 'La review trimestrale è dove la retention diventa intenzionale.',
            introLead:
              'Una relazione cliente ad alto valore non dovrebbe andare in autopilota. Va controllata e mantenuta rilevante.',
            bodyOne:
              'Questa review tiene calibrati ambiente di trading, servicing e opportunità del prossimo periodo.',
            bodyTwo: 'La review ruota attorno a tre punti:',
            boxOneTitle: 'Performance',
            boxOneCopy: 'Cosa sta ancora funzionando',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Cosa va migliorato',
            boxThreeTitle: 'Piano',
            boxThreeCopy: 'Cosa viene dopo',
            bodyThree:
              'Usa la piattaforma come primo punto di review, poi sali a una conversazione umana solo se aggiunge valore.',
            bodyFour: 'Così il percorso account resta più pulito e intenzionale.',
            ctaLabel: 'Apri la tua VIP Review',
          },
        },
        {
          name: 'Top Performing - VIP Review B IT',
          description:
            'Follow-up strategico presentato come account planning premium invece che semplice check-in.',
          subject: 'Un prossimo trimestre più forte parte da una review più lucida oggi.',
          html: {
            lang: 'it',
            eyebrow: 'VIP Review Cycle',
            title: 'Pianifica il prossimo trimestre',
            heroTitle: 'Tratta il prossimo trimestre come un vantaggio',
            heroSubtitle: 'I trader premium rendono meglio con una relazione strategica.',
            mainTitle: 'Qui si parla meno di check-in e più di pianificazione.',
            introLead:
              "L'obiettivo è usare ciò che già funziona e capire dove Bullwaves può servirti meglio.",
            bodyOne:
              "Questo significa più chiarezza su opportunità, supporto e adattamento dell'account management.",
            bodyTwo: 'Questa review aiuta ad allineare:',
            boxOneTitle: 'Segnale',
            boxOneCopy: 'Cosa dice oggi la tua attività',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Dove il servizio va affinato',
            boxThreeTitle: 'Direzione',
            boxThreeCopy: 'Cosa deve puntare il prossimo ciclo',
            bodyThree:
              "Parti dall'area cliente e lascia che il flusso review guidi la fase successiva con più precisione.",
            bodyFour:
              'Il follow-up umano è disponibile solo se vuoi approfondire la conversazione.',
            ctaLabel: 'Rivedi il Prossimo Trimestre',
          },
        }
      ),
    },
  },
  top_performing_premium_nurture_email: {
    id: 'top_performing_premium_nurture_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'top_performing_premium_nurture_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'top_performing_premium_nurture_email',
        {
          name: 'Top Performing - Premium Nurture A IT',
          description: 'Loop premium leggero focalizzato su continuità e soft re-engagement.',
          subject: 'Mantieni vivo il tuo slancio premium su Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Premium Nurture Loop',
            title: 'Percorso premium leggero',
            heroTitle: 'I profili forti hanno bisogno di continuità',
            heroSubtitle: 'Questo loop leggero tiene il valore caldo tra i momenti forti.',
            mainTitle: 'Non ogni mossa retention deve usare urgenza.',
            introLead:
              'A volte la mossa giusta è restare abbastanza rilevanti da non far raffreddare il valore.',
            bodyOne:
              'Questo è il ruolo di questo presidio premium: tenere calda la relazione senza forzare il passo dopo.',
            bodyTwo: 'Il loop protegge tre cose:',
            boxOneTitle: 'Memoria',
            boxOneCopy: 'Restare ben presenti',
            boxTwoTitle: 'Valore',
            boxTwoCopy: 'Tenere viva la rilevanza',
            boxThreeTitle: 'Ritorno',
            boxThreeCopy: 'Meno drop-off passivo',
            bodyThree:
              'Usa la piattaforma come punto fermo e lascia che questo presidio lavori intorno in modo discreto.',
            bodyFour:
              'WhatsApp resta disponibile se vuoi un tocco umano, ma deve restare secondario.',
            ctaLabel: 'Riapri il Flusso Premium',
          },
        },
        {
          name: 'Top Performing - Premium Nurture B IT',
          description:
            "Variante soft continuity costruita per ridurre il disimpegno senza forzare l'azione.",
          subject: 'Una relazione premium resta forte con continuità intelligente.',
          html: {
            lang: 'it',
            eyebrow: 'Premium Nurture Loop',
            title: 'Continuità intelligente',
            heroTitle: 'Tieni calda la relazione',
            heroSubtitle:
              'I trader ad alto valore si allontanano quando la relazione non sembra più attuale.',
            mainTitle: 'Questo loop esiste per evitare il raffreddamento silenzioso.',
            introLead:
              'La mossa migliore qui non è la pressione. È continuità discreta e un rientro chiaro in piattaforma.',
            bodyOne: 'Così il profilo resta coinvolto senza che la relazione sembri ripetitiva.',
            bodyTwo: 'Questo loop più leggero aiuta a preservare:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Presenza premium utile',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Ritmo account continuo',
            boxThreeTitle: 'Accesso',
            boxThreeCopy: 'Rientro semplice',
            bodyThree:
              'Rientra prima in piattaforma. Lascia che questo presidio accompagni solo il ritorno.',
            bodyFour: "Il supporto umano c'è solo se aggiunge un valore chiaro.",
            ctaLabel: 'Torna in Piattaforma',
          },
        }
      ),
    },
  },
  most_consistent_badge_award_email: {
    id: 'most_consistent_badge_award_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'most_consistent_badge_award_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'most_consistent_badge_award_email',
        {
          name: 'Most Consistent - Badge Award A IT',
          description: 'Apertura recognition-led per engagement basato sulla costanza.',
          subject: 'Hai ottenuto il tuo badge Bullwaves di consistenza.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'Badge consistenza assegnato',
            heroTitle: 'La costanza merita riconoscimento',
            heroSubtitle: 'Questo primo touch trasforma la stabilità in identità e slancio.',
            mainTitle: 'Hai già fatto la cosa più difficile: restare attivo con continuità.',
            introLead:
              'Questo badge non è cosmetico. Mostra che il tuo comportamento è abbastanza strutturato da costruirci sopra.',
            bodyOne:
              'Il punto è rendere il progresso visibile e dare al prossimo mese una narrativa più chiara.',
            bodyTwo: 'Questo riconoscimento rafforza:',
            boxOneTitle: 'Identità',
            boxOneCopy: 'Sei un trader costante',
            boxTwoTitle: 'Slancio',
            boxTwoCopy: 'Il tuo percorso ha trazione',
            boxThreeTitle: 'Prossimo step',
            boxThreeCopy: 'La crescita ora sembra naturale',
            bodyThree:
              'La piattaforma resta il posto migliore per continuare perché lì il tuo progresso diventa misurabile.',
            bodyFour:
              "Il supporto c'è se utile, ma deve restare secondario rispetto al tuo ritmo in piattaforma.",
            ctaLabel: 'Guarda il tuo Percorso Badge',
          },
        },
        {
          name: 'Most Consistent - Badge Award B IT',
          description: "Variante momentum-led che trasforma la costanza in movimento verso l'alto.",
          subject: 'La tua costanza è ora un asset di crescita su Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'La costanza diventa leva',
            heroTitle: 'La crescita vera nasce dalla costanza',
            heroSubtitle: 'Questo riconosce il pattern che hai mantenuto nel tempo.',
            mainTitle: 'Questo la rende un segnale più forte di una vittoria isolata.',
            introLead:
              'La costanza è uno dei segnali più utili del valore di un trader nel medio periodo.',
            bodyOne:
              'Questo riconoscimento ti aiuta a continuare con più fiducia e una direzione più chiara.',
            bodyTwo: 'Cosa ti dà questo badge adesso:',
            boxOneTitle: 'Segnale',
            boxOneCopy: 'Il tuo pattern è visibile',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'La crescita ha un percorso più chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Il progresso si percepisce meritato',
            bodyThree: 'Apri la piattaforma e usa questo slancio finché è ancora fresco.',
            bodyFour:
              "Se vuoi un confronto umano c'è, ma la piattaforma deve restare al primo posto.",
            ctaLabel: 'Apri il Percorso di Crescita',
          },
        }
      ),
    },
  },
  most_consistent_growth_roadmap_email: {
    id: 'most_consistent_growth_roadmap_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'most_consistent_growth_roadmap_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'most_consistent_growth_roadmap_email',
        {
          name: 'Most Consistent - Growth Roadmap A IT',
          description: 'Touch strutturato che canalizza la costanza in milestone chiare.',
          subject:
            'Il tuo piano di crescita Bullwaves è pronto. Trasforma la costanza in crescita.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'Piano di crescita inviato',
            heroTitle: 'Trasforma la costanza in crescita',
            heroSubtitle: 'I trader stabili scalano più velocemente con traguardi chiari.',
            mainTitle: 'Questo piano esiste per ridurre la deriva.',
            introLead:
              'La costanza da sola ha valore, ma con tappe chiare diventa crescita reale nel tempo.',
            bodyOne: 'Il piano dà struttura a questa fase senza complicare il tuo ritmo.',
            bodyTwo: 'Serve ad affinare tre aspetti:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'Milestone successiva chiara',
            boxTwoTitle: 'Disciplina',
            boxTwoCopy: 'Ritmo mensile migliore',
            boxThreeTitle: 'Upgrade',
            boxThreeCopy: 'Percorso verso segmenti più forti',
            bodyThree:
              'Usa la piattaforma per rivedere il piano e lascia che guidi le prossime settimane di attività.',
            bodyFour: "Il supporto è opzionale solo se vuoi aiuto nell'interpretare il percorso.",
            ctaLabel: 'Apri il tuo Piano',
          },
        },
        {
          name: 'Most Consistent - Growth Roadmap B IT',
          description: "Variante milestone-led pensata per far percepire movimento verso l'alto.",
          subject: 'Un trader più costante non dovrebbe mai sentirsi senza direzione.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Growth Journey',
            title: 'Una direzione più chiara',
            heroTitle: 'La crescita è più semplice su un percorso chiaro',
            heroSubtitle: 'Questo piano rende lo sforzo ripetuto più direzionale.',
            mainTitle: 'Senza milestone, la costanza può sembrare piatta.',
            introLead:
              'Questo piano rende il tuo progresso più leggibile e più facile da spingere avanti.',
            bodyOne:
              'Mantiene il percorso pratico: indicatori chiari, direzione più pulita e più motivi per restare coinvolto.',
            bodyTwo: 'Cosa aiuta a creare questo piano:',
            boxOneTitle: 'Misura',
            boxOneCopy: 'Il progresso si vede meglio',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Meno deriva comportamentale',
            boxThreeTitle: 'Ambizione',
            boxThreeCopy: 'Target successivo più adatto',
            bodyThree:
              'Apri la piattaforma e usa il piano come riferimento per il prossimo periodo.',
            bodyFour:
              "Se un dettaglio richiede contesto, il supporto c'è, ma deve restare in seconda posizione.",
            ctaLabel: 'Rivedi il Piano',
          },
        }
      ),
    },
  },
  most_consistent_loyalty_reward_email: {
    id: 'most_consistent_loyalty_reward_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'most_consistent_loyalty_reward_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'most_consistent_loyalty_reward_email',
        {
          name: 'Most Consistent - Loyalty Reward A IT',
          description: 'Touch reward collegato a challenge completata e ritmo sostenuto.',
          subject: 'La tua costanza sta sbloccando un premio fedeltà Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Reward Layer',
            title: 'Premio fedeltà inviato',
            heroTitle: 'La costanza dovrebbe produrre valore',
            heroSubtitle: 'Questo premio rinforza il tuo comportamento prima che rallenti.',
            mainTitle: 'Il premio giusto rende la costanza più duratura.',
            introLead:
              'Quando i trader vedono un riconoscimento concreto di un comportamento stabile, è più probabile che mantengano quel pattern.',
            bodyOne:
              'Questo touch collega il tuo ritmo attuale con un motivo in più per restare coinvolto.',
            bodyTwo: 'Il premio rafforza:',
            boxOneTitle: 'Comportamento',
            boxOneCopy: 'Resta sul pattern migliore',
            boxTwoTitle: 'Motivazione',
            boxTwoCopy: 'Tieni viva la challenge',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Meno rischio di drop-off',
            bodyThree:
              'Usa la piattaforma per rivedere il contesto del premio e mantenere allineate le prossime azioni.',
            bodyFour: "Il supporto c'è solo se vuoi un checkpoint consulenziale.",
            ctaLabel: 'Rivedi il tuo Premio',
          },
        },
        {
          name: 'Most Consistent - Loyalty Reward B IT',
          description: "Variante progress-led centrata su continuità e migrazione verso l'alto.",
          subject: 'Uno sforzo stabile merita un riconoscimento Bullwaves più forte.',
          html: {
            lang: 'it',
            eyebrow: 'Consistency Reward Layer',
            title: 'Premia il pattern giusto',
            heroTitle: 'Il progresso dovrebbe sentirsi rinforzato',
            heroSubtitle: 'Questo premio dà più peso al tuo percorso attuale.',
            mainTitle:
              'La costanza cresce più velocemente quando viene riconosciuta in modo concreto.',
            introLead:
              'Un reward ben temporizzato può rendere un pattern stabile più durevole e facilitare il prossimo upgrade.',
            bodyOne:
              "Qui si tratta di tenere vivo il tuo ritmo e rendere più meritato il percorso verso l'alto.",
            bodyTwo: 'Cosa punta a rafforzare questo reward:',
            boxOneTitle: 'Valore',
            boxOneCopy: 'Lo sforzo si sente riconosciuto',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: "L'abitudine resta attiva",
            boxThreeTitle: 'Promozione',
            boxThreeCopy: 'Più vicino ai livelli più forti',
            bodyThree: 'Apri la piattaforma e usa il premio come rinforzo della fase successiva.',
            bodyFour: 'Il supporto umano è opzionale se vuoi una lettura più consulenziale.',
            ctaLabel: 'Apri la sezione Premi',
          },
        }
      ),
    },
  },
  most_consistent_top_performers_onboarding_email: {
    id: 'most_consistent_top_performers_onboarding_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'most_consistent_top_performers_onboarding_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'most_consistent_top_performers_onboarding_email',
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
              'Se sei arrivato qui, il prossimo step corretto è entrare in un percorso con aspettative più alte e supporto migliore.',
            bodyOne: 'Questo touch onboarding rende la migrazione naturale e meritata.',
            bodyTwo: 'Cosa cambia con la promozione:',
            boxOneTitle: 'Livello',
            boxOneCopy: 'Entri in un segmento più forte',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Servicing più premium',
            boxThreeTitle: 'Potenziale',
            boxThreeCopy: 'Percorso di valore superiore',
            bodyThree:
              'Apri la piattaforma e tratta questo passaggio come ingresso nel tuo prossimo ambiente.',
            bodyFour:
              "Il supporto c'è se vuoi un ponte umano verso il nuovo livello, ma la piattaforma resta prima.",
            ctaLabel: 'Entra nel Percorso Top Performers',
          },
        },
        {
          name: 'Most Consistent - Top Performers Onboarding B IT',
          description:
            'Variante confidence-led focalizzata su escalation meritata e retention di livello superiore.',
          subject: 'Il tuo profilo Bullwaves sta entrando in un segmento più forte.',
          html: {
            lang: 'it',
            eyebrow: 'Upward Migration Journey',
            title: 'Passa al livello successivo',
            heroTitle: 'Hai costruito il comportamento. Entra nel livello più forte.',
            heroSubtitle: 'Questa migrazione è il risultato naturale di una costanza duratura.',
            mainTitle: "L'upgrade giusto deve sentirsi meritato e chiaro anche operativamente.",
            introLead:
              'Questo è il tuo handoff in un segmento con attenzione più premium e un percorso più strategico.',
            bodyOne:
              'Il passaggio conta perché dà al tuo pattern un ambiente migliore in cui crescere.',
            bodyTwo: 'Il nuovo livello ti offre:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Hai superato il vecchio percorso',
            boxTwoTitle: 'Ambiente',
            boxTwoCopy: 'Un modello di supporto più forte',
            boxThreeTitle: 'Traiettoria',
            boxThreeCopy: 'Più upside nel prossimo ciclo',
            bodyThree:
              'Usa la piattaforma come punto in cui il vecchio pattern passa il testimone al nuovo.',
            bodyFour: "Il supporto umano c'è solo se vuoi una transizione più consulenziale.",
            ctaLabel: 'Apri il Nuovo Livello',
          },
        }
      ),
    },
  },
  most_consistent_cycle_restart_email: {
    id: 'most_consistent_cycle_restart_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'most_consistent_cycle_restart_email',
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
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'most_consistent_cycle_restart_email',
        {
          name: 'Most Consistent - Cycle Restart A IT',
          description:
            'Loop di rientro per trader costanti che hanno bisogno di una ripartenza più pulita.',
          subject: 'Riavvia il tuo ciclo Bullwaves con un percorso challenge più chiaro.',
          html: {
            lang: 'it',
            eyebrow: 'Cycle Restart Journey',
            title: 'Riavvio ciclo',
            heroTitle: "Una ripartenza più morbida può preservare l'abitudine",
            heroSubtitle: 'Questo loop è per trader che hanno bisogno di un reset più chiaro.',
            mainTitle: 'Non ogni rallentamento significa che la storia è finita.',
            introLead:
              'A volte un trader costante ha solo bisogno di una nuova impostazione e di un modo più leggero per ripartire.',
            bodyOne:
              'Questo è il ruolo del messaggio: riavviare il ritmo senza far sembrare il percorso pesante.',
            bodyTwo: 'La ripartenza aiuta a recuperare:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'Un prossimo step più pulito',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Pattern di engagement rinnovato',
            boxThreeTitle: 'Potenziale',
            boxThreeCopy: "Un'altra occasione per scalare",
            bodyThree:
              'Riapri la piattaforma e lascia che il prossimo ciclo parta da un assetto più semplice.',
            bodyFour:
              'Il supporto umano resta disponibile se vuoi un punto di ripartenza più consulenziale.',
            ctaLabel: 'Riavvia il Ciclo',
          },
        },
        {
          name: 'Most Consistent - Cycle Restart B IT',
          description: 'Variante low-pressure che tiene viva la relazione account.',
          subject: 'Una ripartenza Bullwaves più pulita è ancora disponibile per te.',
          html: {
            lang: 'it',
            eyebrow: 'Cycle Restart Journey',
            title: 'Una ripartenza più pulita',
            heroTitle: 'Riparti senza appesantire il passo dopo',
            heroSubtitle: 'Un reset migliore spesso batte una spinta più dura.',
            mainTitle: 'Qui si tratta di preservare la relazione, non di forzarla.',
            introLead:
              "Se l'engagement si è raffreddato, la mossa più intelligente può essere ridurre la pressione e chiarire il percorso.",
            bodyOne:
              'Questo percorso di ripartenza serve esattamente a quello, mantenendo vivo il tuo potenziale di crescita.',
            bodyTwo: 'Punta a recuperare:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Rendere attuale il prossimo step',
            boxTwoTitle: 'Semplicità',
            boxTwoCopy: 'Meno attrito al rientro',
            boxThreeTitle: 'Continuità',
            boxThreeCopy: 'Tenere aperta la relazione',
            bodyThree:
              'Torna prima dalla piattaforma e lascia che il percorso challenge più leggero faccia il resto.',
            bodyFour: "Il supporto c'è solo se aiuta a sbloccare il ritorno.",
            ctaLabel: 'Apri il Percorso di Ripartenza',
          },
        }
      ),
    },
  },
  reward_candidates_step1_email: {
    id: 'reward_candidates_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'reward_candidates_step1_email',
        {
          name: 'Reward Candidates - VIP Reward Signal A',
          description: 'Premium opening for users eligible to a higher-value commercial path.',
          subject: 'Your Bullwaves profile unlocked premium benefits.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Premium Update',
            title: 'A premium update for your account',
            heroTitle: 'Your profile now qualifies for a higher-value path',
            heroSubtitle: 'You can now access a more tailored level of support and benefits.',
            mainTitle: 'This update is designed to strengthen your account experience.',
            introLead:
              'Your recent activity confirms a profile that can benefit from a more structured and premium setup.',
            bodyOne:
              'The goal is simple: maintain continuity, improve account quality, and give you a clearer next step.',
            bodyTwo: 'What this update brings you now:',
            boxOneTitle: 'Recognition',
            boxOneCopy: 'Your profile has been upgraded',
            boxTwoTitle: 'Relevance',
            boxTwoCopy: 'More tailored account communication',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Priority help when needed',
            bodyThree: 'Open your client area to review and activate your premium update.',
            bodyFour: 'If you want a quick confirmation, our team is available.',
            ctaLabel: 'Open My Premium Update',
          },
        },
        {
          name: 'Reward Candidates - VIP Reward Signal B',
          description: 'Status-led premium opening with a commercial and operational angle.',
          subject: 'You now have access to a more tailored Bullwaves experience.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Premium Update',
            title: 'Your account has been upgraded',
            heroTitle: 'A stronger setup is now active for your profile',
            heroSubtitle:
              'This update is intended to keep your account experience more consistent and relevant.',
            mainTitle: 'A more tailored path is now available inside your client area.',
            introLead:
              'You have reached a level where a generic approach is no longer the best fit.',
            bodyOne:
              'From now on, communication and support are oriented to your profile quality and account behavior.',
            bodyTwo: 'You can expect:',
            boxOneTitle: 'Higher relevance',
            boxOneCopy: 'Messages that match your profile',
            boxTwoTitle: 'Clearer progression',
            boxTwoCopy: 'A better-defined next step',
            boxThreeTitle: 'Priority coverage',
            boxThreeCopy: 'Faster assistance when needed',
            bodyThree: 'Enter your client area and continue from your upgraded setup.',
            bodyFour: 'Our support team remains available for any quick clarification.',
            ctaLabel: 'Continue From My Upgrade',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'reward_candidates_step1_email',
        {
          name: 'Reward Candidates - Segnale Reward VIP A IT',
          description:
            'Apertura premium per utenti idonei a un percorso commerciale di maggiore valore.',
          subject: 'Il tuo profilo Bullwaves ha sbloccato vantaggi premium.',
          html: {
            lang: 'it',
            eyebrow: 'Aggiornamento Premium Bullwaves',
            title: 'Un aggiornamento premium per il tuo account',
            heroTitle: 'Il tuo profilo ora accede a un livello superiore',
            heroSubtitle: 'Da oggi hai un supporto più mirato e vantaggi più rilevanti.',
            mainTitle: 'Questo aggiornamento serve a migliorare la tua esperienza operativa.',
            introLead:
              'La tua attività recente conferma un profilo adatto a una gestione più personalizzata.',
            bodyOne:
              'L obiettivo è chiaro: mantenere continuità, aumentare qualità account e darti un prossimo passo più semplice.',
            bodyTwo: 'Cosa ricevi da questo aggiornamento:',
            boxOneTitle: 'Riconoscimento',
            boxOneCopy: 'Profilo aggiornato',
            boxTwoTitle: 'Rilevanza',
            boxTwoCopy: 'Comunicazione più adatta al tuo livello',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Assistenza prioritaria quando serve',
            bodyThree: 'Apri la tua area cliente per vedere e attivare il nuovo setup premium.',
            bodyFour: 'Se vuoi una conferma rapida, il team è disponibile.',
            ctaLabel: 'Apri il Mio Aggiornamento Premium',
          },
        },
        {
          name: 'Reward Candidates - Segnale Reward VIP B IT',
          description: 'Variante status-led premium con taglio operativo e commerciale.',
          subject: 'Per il tuo profilo è attiva un esperienza Bullwaves più su misura.',
          html: {
            lang: 'it',
            eyebrow: 'Aggiornamento Premium Bullwaves',
            title: 'Il tuo account è stato aggiornato',
            heroTitle: 'Per te è attivo un setup più evoluto',
            heroSubtitle: 'L aggiornamento mantiene il tuo percorso più coerente e più utile.',
            mainTitle: 'Nel tuo account è ora disponibile un percorso più personalizzato.',
            introLead:
              'Hai raggiunto un livello in cui un approccio standard non è più la soluzione migliore.',
            bodyOne:
              'Da ora comunicazioni e supporto sono calibrati meglio sul tuo comportamento account.',
            bodyTwo: 'Cosa ottieni in pratica:',
            boxOneTitle: 'Più rilevanza',
            boxOneCopy: 'Messaggi più coerenti con il tuo profilo',
            boxTwoTitle: 'Progressione più chiara',
            boxTwoCopy: 'Prossimi passi meglio definiti',
            boxThreeTitle: 'Copertura prioritaria',
            boxThreeCopy: 'Supporto più rapido quando necessario',
            bodyThree: 'Entra in area cliente e continua dal tuo nuovo setup.',
            bodyFour: 'Il supporto resta disponibile per eventuali chiarimenti rapidi.',
            ctaLabel: 'Continua Dal Mio Aggiornamento',
          },
        }
      ),
    },
  },
  reward_candidates_step2_email: {
    id: 'reward_candidates_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'reward_candidates_step2_email',
        {
          name: 'Reward Candidates - Reward Ladder A',
          description: 'Operational roadmap update with clear next actions.',
          subject: 'Your next Bullwaves steps are ready in your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Update',
            title: 'Your next-step plan is available',
            heroTitle: 'A clearer structure helps you move better',
            heroSubtitle: 'You now have a practical plan to continue with consistency.',
            mainTitle: 'Your next phase is organized and ready to use.',
            introLead:
              'This update gives you a cleaner sequence of actions, so you can move forward without friction.',
            bodyOne:
              'The objective is to keep your account progression stable and easier to manage.',
            bodyTwo: 'This plan improves:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'A clearer next move',
            boxTwoTitle: 'Consistency',
            boxTwoCopy: 'A stronger operating rhythm',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'A more stable account path',
            bodyThree: 'Open your client area and review your next-step plan.',
            bodyFour: 'If needed, support can help you confirm the first action.',
            ctaLabel: 'View My Next Steps',
          },
        },
        {
          name: 'Reward Candidates - Reward Ladder B',
          description: 'Execution-oriented variant with practical account guidance.',
          subject: 'A clearer progression plan is now active in your Bullwaves account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Update',
            title: 'A clearer way to continue',
            heroTitle: 'Keep momentum with a better structure',
            heroSubtitle: 'Your account now includes a more practical progression plan.',
            mainTitle: 'When steps are clear, results are easier to sustain.',
            introLead:
              'This update helps you continue with less confusion and better account continuity.',
            bodyOne:
              'You can use it to stay aligned, reduce uncertainty, and act with better timing.',
            bodyTwo: 'This setup helps you with:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'Clear next actions',
            boxTwoTitle: 'Execution',
            boxTwoCopy: 'Cleaner account rhythm',
            boxThreeTitle: 'Focus',
            boxThreeCopy: 'More relevant follow-up',
            bodyThree: 'Continue from your client area and follow the updated plan.',
            bodyFour: 'Support is available if one point needs extra context.',
            ctaLabel: 'Open My Updated Plan',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'reward_candidates_step2_email',
        {
          name: 'Reward Candidates - Reward Ladder A IT',
          description: 'Aggiornamento operativo con prossimi passi chiari.',
          subject: 'I tuoi prossimi passi Bullwaves sono pronti nel tuo account.',
          html: {
            lang: 'it',
            eyebrow: 'Aggiornamento Account Bullwaves',
            title: 'Il tuo piano dei prossimi passi è disponibile',
            heroTitle: 'Una struttura più chiara ti aiuta a muoverti meglio',
            heroSubtitle: 'Ora hai un piano pratico per proseguire con continuità.',
            mainTitle: 'La tua prossima fase è organizzata e pronta da usare.',
            introLead:
              'Questo aggiornamento ti offre una sequenza più semplice di azioni, per continuare senza attrito.',
            bodyOne:
              'L obiettivo è mantenere stabile la progressione account e rendere più semplice la gestione delle prossime azioni.',
            bodyTwo: 'Questo piano migliora:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Prossimo passo più chiaro',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Ritmo operativo più solido',
            boxThreeTitle: 'Stabilità',
            boxThreeCopy: 'Percorso account più regolare',
            bodyThree: 'Apri la tua area cliente e rivedi il piano dei prossimi passi.',
            bodyFour: 'Se serve, il supporto può aiutarti a confermare la prima azione.',
            ctaLabel: 'Vedi i Miei Prossimi Passi',
          },
        },
        {
          name: 'Reward Candidates - Reward Ladder B IT',
          description: 'Variante orientata all esecuzione con guida operativa concreta.',
          subject: 'Nel tuo account Bullwaves è attivo un piano di progressione più chiaro.',
          html: {
            lang: 'it',
            eyebrow: 'Aggiornamento Account Bullwaves',
            title: 'Un modo più chiaro per continuare',
            heroTitle: 'Mantieni slancio con una struttura migliore',
            heroSubtitle: 'Il tuo account include ora un piano più pratico per proseguire.',
            mainTitle: 'Quando i passaggi sono chiari, i risultati sono più stabili.',
            introLead:
              'Questo aggiornamento ti aiuta a continuare con meno incertezza e più continuità operativa.',
            bodyOne:
              'Puoi usarlo per restare allineato, ridurre i dubbi e agire con timing migliore.',
            bodyTwo: 'Questo setup ti aiuta su:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Azioni successive ben definite',
            boxTwoTitle: 'Esecuzione',
            boxTwoCopy: 'Ritmo account più pulito',
            boxThreeTitle: 'Focus',
            boxThreeCopy: 'Follow-up più rilevante',
            bodyThree: 'Continua dalla tua area cliente seguendo il piano aggiornato.',
            bodyFour: 'Il supporto resta disponibile se un punto richiede più contesto.',
            ctaLabel: 'Apri il Mio Piano Aggiornato',
          },
        }
      ),
    },
  },
  reward_candidates_step3_email: {
    id: 'reward_candidates_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'reward_candidates_step3_email',
        {
          name: 'Reward Candidates - Retention Commitment A',
          description: 'Pre-review operational reminder to keep account quality stable.',
          subject: 'Before your next account review, there is one final step to complete.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Reminder',
            title: 'Final step before review',
            heroTitle: 'Complete this phase with a clean final action',
            heroSubtitle: 'A short final alignment helps keep your account path stable.',
            mainTitle: 'You are close to completing this account phase.',
            introLead:
              'Before the next review, a final structured step helps maintain continuity and quality.',
            bodyOne:
              'Completing this now keeps your profile more consistent and improves the next account evaluation.',
            bodyTwo: 'This final action helps with:',
            boxOneTitle: 'Stability',
            boxOneCopy: 'More regular account behavior',
            boxTwoTitle: 'Readiness',
            boxTwoCopy: 'Better preparation for review',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'A smoother next cycle',
            bodyThree: 'Open the platform and complete this final step.',
            bodyFour: 'If needed, your account team can support a quick final alignment.',
            ctaLabel: 'Complete Final Step',
          },
        },
        {
          name: 'Reward Candidates - Retention Commitment B',
          description: 'Readiness reminder before account review.',
          subject: 'Your account review is approaching. Confirm the final setup now.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Reminder',
            title: 'Review readiness update',
            heroTitle: 'Prepare your account before the next review',
            heroSubtitle: 'A simple final alignment now can improve your next cycle quality.',
            mainTitle: 'This is the best moment to close remaining items.',
            introLead:
              'A clean setup before review helps your account stay consistent and easier to manage.',
            bodyOne:
              'Completing this phase now improves continuity and keeps your next progression step clear.',
            bodyTwo: 'Focus on these final points:',
            boxOneTitle: 'Order',
            boxOneCopy: 'Close open items clearly',
            boxTwoTitle: 'Consistency',
            boxTwoCopy: 'Keep account behavior stable',
            boxThreeTitle: 'Continuation',
            boxThreeCopy: 'Start the next phase smoothly',
            bodyThree: 'Open your client area and finalize this setup.',
            bodyFour: 'Support remains available if you want a quick confirmation.',
            ctaLabel: 'Finalize My Setup',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'reward_candidates_step3_email',
        {
          name: 'Reward Candidates - Retention Commitment A IT',
          description: 'Promemoria operativo pre-review per mantenere stabile la qualità account.',
          subject: 'Prima della prossima review account c è un ultimo passaggio da completare.',
          html: {
            lang: 'it',
            eyebrow: 'Promemoria Account Bullwaves',
            title: 'Ultimo passaggio prima della review',
            heroTitle: 'Completa questa fase con un azione finale chiara',
            heroSubtitle:
              'Un allineamento finale rapido aiuta a mantenere stabile il tuo percorso account.',
            mainTitle: 'Sei vicino alla chiusura di questa fase.',
            introLead:
              'Prima della prossima review, un ultimo step ordinato migliora continuità e qualità operativa.',
            bodyOne:
              'Completarlo ora rende il profilo più coerente e migliora la valutazione della fase successiva.',
            bodyTwo: 'Questo passaggio finale aiuta su:',
            boxOneTitle: 'Stabilità',
            boxOneCopy: 'Comportamento account più regolare',
            boxTwoTitle: 'Preparazione',
            boxTwoCopy: 'Review più ordinata',
            boxThreeTitle: 'Continuità',
            boxThreeCopy: 'Passaggio più fluido al ciclo successivo',
            bodyThree: 'Apri la piattaforma e completa questo ultimo passaggio.',
            bodyFour:
              'Se serve, il team account può supportarti con un allineamento finale rapido.',
            ctaLabel: 'Completa Ultimo Passaggio',
          },
        },
        {
          name: 'Reward Candidates - Retention Commitment B IT',
          description: 'Promemoria di readiness prima della review account.',
          subject: 'La review account è vicina. Conferma ora il setup finale.',
          html: {
            lang: 'it',
            eyebrow: 'Promemoria Account Bullwaves',
            title: 'Aggiornamento readiness review',
            heroTitle: 'Prepara il tuo account prima della prossima review',
            heroSubtitle: 'Un allineamento finale semplice migliora la qualità del prossimo ciclo.',
            mainTitle: 'Questo è il momento migliore per chiudere i punti aperti.',
            introLead:
              'Un setup pulito prima della review aiuta il tuo account a restare più coerente e gestibile.',
            bodyOne:
              'Completare questa fase ora migliora continuità e rende più chiaro il prossimo passo.',
            bodyTwo: 'Concentrati su questi ultimi punti:',
            boxOneTitle: 'Ordine',
            boxOneCopy: 'Chiudi i passaggi aperti',
            boxTwoTitle: 'Coerenza',
            boxTwoCopy: 'Mantieni stabilità operativa',
            boxThreeTitle: 'Prosecuzione',
            boxThreeCopy: 'Avvio più fluido della prossima fase',
            bodyThree: 'Apri la tua area cliente e finalizza questo setup.',
            bodyFour: 'Il supporto resta disponibile se vuoi una conferma rapida.',
            ctaLabel: 'Finalizza Il Mio Setup',
          },
        }
      ),
    },
  },
  reward_candidates_followup_retained_email: {
    id: 'reward_candidates_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'reward_candidates_followup_retained_email',
        {
          name: 'Reward Candidates - Retained Follow-up A',
          description: 'Positive follow-up after successful account review.',
          subject: 'Great news: your account review is confirmed and your premium setup continues.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Premium Follow-up',
            title: 'Your premium setup is confirmed',
            heroTitle: 'You passed this review phase successfully',
            heroSubtitle: 'Now you can continue with stronger continuity and account support.',
            mainTitle: 'Your account remains in an upgraded profile.',
            introLead:
              'This follow-up confirms that your recent progression is validated and active.',
            bodyOne:
              'The best next move is to continue with regular activity from your client area.',
            bodyTwo: 'This confirmation gives you:',
            boxOneTitle: 'Stability',
            boxOneCopy: 'Your profile remains in good standing',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'A clear path for the next period',
            boxThreeTitle: 'Support quality',
            boxThreeCopy: 'Priority assistance when needed',
            bodyThree: 'Open your client area and continue from your current premium setup.',
            bodyFour: 'Support is available if you want to confirm your next step.',
            ctaLabel: 'Continue My Premium Setup',
          },
        },
        {
          name: 'Reward Candidates - Retained Follow-up B',
          description: 'Commercial continuity follow-up after successful confirmation.',
          subject: 'Review completed successfully. Keep your momentum active.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Premium Follow-up',
            title: 'Continue from a confirmed result',
            heroTitle: 'Your account remains in a strong position',
            heroSubtitle: 'After a positive review, continuity is the key to keep value active.',
            mainTitle: 'Now focus on consistency and clear next actions.',
            introLead:
              'You now have a solid base to continue with a more effective account rhythm.',
            bodyOne:
              'Use this phase to keep your progress stable and prepare the next account objective.',
            bodyTwo: 'Prioritize:',
            boxOneTitle: 'Consistency',
            boxOneCopy: 'Maintain regular account activity',
            boxTwoTitle: 'Execution',
            boxTwoCopy: 'Follow a clean and simple path',
            boxThreeTitle: 'Preparation',
            boxThreeCopy: 'Get ready for the next upgrade stage',
            bodyThree: 'Continue from your client area and keep your account momentum active.',
            bodyFour: 'Support remains available if you need one quick direction check.',
            ctaLabel: 'Keep My Momentum Active',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'reward_candidates_followup_retained_email',
        {
          name: 'Reward Candidates - Retained Follow-up A IT',
          description: 'Follow-up positivo dopo review account superata.',
          subject:
            'Ottima notizia: la tua review account è confermata e il setup premium continua.',
          html: {
            lang: 'it',
            eyebrow: 'Follow-up Premium Bullwaves',
            title: 'Il tuo setup premium è confermato',
            heroTitle: 'Hai superato con successo questa fase di review',
            heroSubtitle: 'Ora puoi continuare con più continuità e supporto account.',
            mainTitle: 'Il tuo account resta in un profilo evoluto.',
            introLead: 'Questo follow-up conferma che la progressione recente è valida e attiva.',
            bodyOne: 'La mossa migliore ora è continuare con regolarità dalla tua area cliente.',
            bodyTwo: 'Questa conferma ti offre:',
            boxOneTitle: 'Stabilità',
            boxOneCopy: 'Profilo account in buona tenuta',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Percorso chiaro per il prossimo periodo',
            boxThreeTitle: 'Qualità supporto',
            boxThreeCopy: 'Assistenza prioritaria quando serve',
            bodyThree: 'Apri area cliente e continua dal setup premium attuale.',
            bodyFour: 'Il supporto è disponibile se vuoi confermare il prossimo passo.',
            ctaLabel: 'Continua il Mio Setup Premium',
          },
        },
        {
          name: 'Reward Candidates - Retained Follow-up B IT',
          description: 'Follow-up commerciale di continuità dopo conferma positiva.',
          subject: 'Review completata con successo. Mantieni attivo il tuo slancio.',
          html: {
            lang: 'it',
            eyebrow: 'Follow-up Premium Bullwaves',
            title: 'Continua da un risultato confermato',
            heroTitle: 'Il tuo account resta in una posizione solida',
            heroSubtitle:
              'Dopo una review positiva, la continuità è la chiave per mantenere il valore.',
            mainTitle: 'Ora punta su coerenza e prossimi passi chiari.',
            introLead: 'Hai una base solida da cui proseguire con un ritmo account più efficace.',
            bodyOne:
              'Usa questa fase per mantenere stabile la progressione e preparare il prossimo obiettivo account.',
            bodyTwo: 'Dai priorità a:',
            boxOneTitle: 'Continuità',
            boxOneCopy: 'Attività account regolare',
            boxTwoTitle: 'Esecuzione',
            boxTwoCopy: 'Percorso pulito e semplice',
            boxThreeTitle: 'Preparazione',
            boxThreeCopy: 'Pronto per il prossimo livello',
            bodyThree: 'Continua dalla tua area cliente e mantieni attivo lo slancio.',
            bodyFour: 'Il supporto resta disponibile se ti serve un check rapido di direzione.',
            ctaLabel: 'Mantieni Attivo Il Mio Slancio',
          },
        }
      ),
    },
  },
  reward_candidates_followup_recovery_email: {
    id: 'reward_candidates_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'reward_candidates_followup_recovery_email',
        {
          name: 'Reward Candidates - Return Follow-up A',
          description: 'Return follow-up for users who need a clean restart path.',
          subject: 'Your account can restart from a simpler and clearer path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A clear restart path is available',
            heroTitle: 'You can continue from a simpler setup',
            heroSubtitle: 'If the last step was missed, your account can still recover smoothly.',
            mainTitle: 'Your path remains open with a cleaner re-entry.',
            introLead:
              'This message is designed to help you restart without pressure and with clear next actions.',
            bodyOne:
              'The objective is to restore continuity quickly and keep your account progression active.',
            bodyTwo: 'This restart gives you:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'A visible next step',
            boxTwoTitle: 'Simplicity',
            boxTwoCopy: 'Lower friction to continue',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'A new chance to move forward',
            bodyThree: 'Open the platform and continue from the return path.',
            bodyFour: 'Support is available if you want a guided restart.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Reward Candidates - Return Follow-up B',
          description: 'Low-pressure return variant to restore active continuity.',
          subject: 'A lighter restart option is now active in your Bullwaves account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A lighter way to restart',
            heroTitle: 'Re-enter with less pressure and more clarity',
            heroSubtitle: 'A simple reset often works better than a forced push.',
            mainTitle: 'The best next move is a clean restart.',
            introLead:
              'This option is for users who need a simpler path to resume account activity.',
            bodyOne: 'Use this path to regain rhythm and reduce the risk of extended inactivity.',
            bodyTwo: 'This helps you restore:',
            boxOneTitle: 'Engagement',
            boxOneCopy: 'Bring account activity back',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Follow a clear next action',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Continue with less uncertainty',
            bodyThree: 'Open your client area and relaunch from the return option.',
            bodyFour: 'Support remains available if you need one quick clarification.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'reward_candidates_followup_recovery_email',
        {
          name: 'Reward Candidates - Return Follow-up A IT',
          description:
            'Follow-up di ritorno per utenti che devono ripartire da un percorso più semplice.',
          subject: 'Il tuo account può ripartire da un percorso più chiaro e più semplice.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'È disponibile un percorso di ripartenza chiaro',
            heroTitle: 'Puoi continuare da un setup più semplice',
            heroSubtitle:
              'Se l ultimo passaggio non è stato completato, puoi ripartire senza difficoltà.',
            mainTitle: 'Il tuo percorso resta aperto con un rientro più lineare.',
            introLead:
              'Questo messaggio serve a riattivare il percorso senza pressione e con prossime azioni chiare.',
            bodyOne:
              'L obiettivo è recuperare continuità rapidamente e mantenere attiva la progressione account.',
            bodyTwo: 'Questa ripartenza ti offre:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Un prossimo passo visibile',
            boxTwoTitle: 'Semplicità',
            boxTwoCopy: 'Meno attrito per continuare',
            boxThreeTitle: 'Continuità',
            boxThreeCopy: 'Una nuova possibilità di avanzare',
            bodyThree: 'Apri la piattaforma e continua dal percorso di ritorno.',
            bodyFour: 'Il supporto è disponibile se vuoi una ripartenza guidata.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Reward Candidates - Return Follow-up B IT',
          description: 'Variante di ritorno a bassa pressione per recuperare continuita account.',
          subject: 'Nel tuo account Bullwaves è attiva una opzione di ripartenza più leggera.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Un modo più leggero per ripartire',
            heroTitle: 'Rientra con meno pressione e più chiarezza',
            heroSubtitle: 'Un reset semplice spesso funziona meglio di una spinta forzata.',
            mainTitle: 'La mossa migliore ora è una ripartenza pulita.',
            introLead:
              'Questa opzione è pensata per chi ha bisogno di un percorso più semplice per riattivare l account.',
            bodyOne:
              'Usa questa modalità per recuperare ritmo e ridurre il rischio di inattività prolungata.',
            bodyTwo: 'Ti aiuta a ristabilire:',
            boxOneTitle: 'Coinvolgimento',
            boxOneCopy: 'Riattivare operatività account',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Seguire un prossimo passo chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Continuare con meno incertezza',
            bodyThree: 'Apri la tua area cliente e riparti dall opzione di ritorno.',
            bodyFour: 'Il supporto resta disponibile se ti serve un chiarimento veloce.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  rising_step1_email: {
    id: 'rising_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'rising_step1_email',
        {
          name: 'Rising - Momentum Accelerator A',
          description: 'Opening message for users showing early growth momentum.',
          subject: 'Your Bullwaves activity is growing. Keep this momentum active.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Growth Update',
            title: 'Your account is moving in the right direction',
            heroTitle: 'Strong start detected',
            heroSubtitle:
              'Your recent activity shows clear momentum. This is the right time to build on it.',
            mainTitle: 'You are in a favorable growth phase.',
            introLead:
              'When momentum appears early, a clear next step helps turn it into consistent results.',
            bodyOne:
              'This update is designed to help you continue with confidence, structure, and better account continuity.',
            bodyTwo: 'What this gives you now:',
            boxOneTitle: 'Timing',
            boxOneCopy: 'Act while momentum is active',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'A clearer next action',
            boxThreeTitle: 'Support',
            boxThreeCopy: 'Help available when needed',
            bodyThree: 'Open your client area and continue from your current growth phase.',
            bodyFour: 'If you want a quick check, support can confirm your next move.',
            ctaLabel: 'Continue My Growth Phase',
          },
        },
        {
          name: 'Rising - Momentum Accelerator B',
          description: 'Performance-led opening focused on preserving early velocity.',
          subject: 'You are gaining pace on Bullwaves. Keep your next steps clear.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Growth Update',
            title: 'Your pace is improving',
            heroTitle: 'You are building real traction',
            heroSubtitle:
              'A good phase becomes durable when the next actions stay simple and focused.',
            mainTitle: 'Momentum is active. Continuity is now the priority.',
            introLead:
              'This message helps you avoid dispersion and keep your account behavior aligned.',
            bodyOne:
              'The objective is to keep your growth rhythm stable and reduce uncertainty in the next steps.',
            bodyTwo: 'Focus now on:',
            boxOneTitle: 'Consistency',
            boxOneCopy: 'Keep account activity regular',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Follow clear next actions',
            boxThreeTitle: 'Execution',
            boxThreeCopy: 'Maintain a clean operating rhythm',
            bodyThree: 'Enter your client area and continue from your current pace.',
            bodyFour: 'Support remains available for a quick orientation if needed.',
            ctaLabel: 'Keep My Pace Active',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'rising_step1_email',
        {
          name: 'Rising - Momentum Accelerator A IT',
          description: 'Messaggio iniziale per utenti con crescita operativa in accelerazione.',
          subject: 'La tua attivita Bullwaves sta crescendo. Mantieni attivo questo slancio.',
          html: {
            lang: 'it',
            eyebrow: 'Aggiornamento Crescita Bullwaves',
            title: 'Il tuo account sta andando nella direzione giusta',
            heroTitle: 'Avvio forte rilevato',
            heroSubtitle:
              'La tua attivita recente mostra slancio chiaro. Questo e il momento giusto per consolidarlo.',
            mainTitle: 'Sei in una fase favorevole di crescita.',
            introLead:
              'Quando lo slancio parte presto, un prossimo passo chiaro aiuta a trasformarlo in risultati piu stabili.',
            bodyOne:
              'Questo aggiornamento ti aiuta a continuare con piu fiducia, struttura e continuita account.',
            bodyTwo: 'Cosa ottieni ora:',
            boxOneTitle: 'Timing',
            boxOneCopy: 'Agire mentre lo slancio e attivo',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Prossimo passo piu definito',
            boxThreeTitle: 'Supporto',
            boxThreeCopy: 'Aiuto disponibile quando serve',
            bodyThree: 'Apri la tua area cliente e continua dalla fase attuale di crescita.',
            bodyFour: 'Se vuoi un check rapido, il supporto puo confermare il prossimo passo.',
            ctaLabel: 'Continua La Mia Fase Di Crescita',
          },
        },
        {
          name: 'Rising - Momentum Accelerator B IT',
          description: 'Variante performance-led focalizzata a preservare velocita iniziale.',
          subject: 'Stai aumentando il ritmo su Bullwaves. Mantieni chiari i prossimi passi.',
          html: {
            lang: 'it',
            eyebrow: 'Aggiornamento Crescita Bullwaves',
            title: 'Il tuo ritmo sta migliorando',
            heroTitle: 'Stai costruendo una trazione reale',
            heroSubtitle:
              'Una fase positiva diventa duratura quando le prossime azioni restano semplici e focalizzate.',
            mainTitle: 'Lo slancio e attivo. Ora conta la continuita.',
            introLead:
              'Questo messaggio ti aiuta a evitare dispersione e a mantenere allineato il comportamento account.',
            bodyOne:
              'L obiettivo e tenere stabile il ritmo di crescita e ridurre incertezza nelle prossime azioni.',
            bodyTwo: 'Ora dai priorita a:',
            boxOneTitle: 'Continuita',
            boxOneCopy: 'Attivita account regolare',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Prossimi passi chiari',
            boxThreeTitle: 'Esecuzione',
            boxThreeCopy: 'Ritmo operativo piu pulito',
            bodyThree: 'Entra in area cliente e continua dal ritmo che hai gia attivato.',
            bodyFour: 'Il supporto resta disponibile per un orientamento rapido se serve.',
            ctaLabel: 'Mantieni Attivo Il Mio Ritmo',
          },
        }
      ),
    },
  },
  rising_step2_email: {
    id: 'rising_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'rising_step2_email',
        {
          name: 'Rising - Milestone Sprint Plan A',
          description: 'Mid-phase message with practical short milestones.',
          subject: 'Your next milestones are ready. Keep your growth structured.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Plan',
            title: 'Your short milestone plan is available',
            heroTitle: 'Small milestones keep momentum stable',
            heroSubtitle: 'You now have a simple plan to continue with stronger consistency.',
            mainTitle: 'A clear sequence helps avoid early slowdowns.',
            introLead:
              'This phase is about keeping progress measurable and practical, without adding complexity.',
            bodyOne:
              'Use the updated plan to organize your next actions and maintain your current growth rhythm.',
            bodyTwo: 'This plan supports:',
            boxOneTitle: 'Structure',
            boxOneCopy: 'Clear short milestones',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'Less dispersion in activity',
            boxThreeTitle: 'Progress',
            boxThreeCopy: 'More visible account evolution',
            bodyThree: 'Open your client area and review your milestone plan.',
            bodyFour: 'If needed, support can help you interpret the first step.',
            ctaLabel: 'View My Milestones',
          },
        },
        {
          name: 'Rising - Milestone Sprint Plan B',
          description: 'Execution-focused milestone message with operational clarity.',
          subject: 'A clearer account plan is now active for your next phase.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Plan',
            title: 'A clearer path for your next phase',
            heroTitle: 'Keep growth practical and measurable',
            heroSubtitle:
              'Your plan now includes short milestones to keep pace and direction aligned.',
            mainTitle: 'The key is continuity with clear actions.',
            introLead:
              'This update helps you continue with better rhythm and fewer uncertain decisions.',
            bodyOne:
              'Following short milestones makes progression easier to manage and more stable over time.',
            bodyTwo: 'Prioritize:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'One clear step at a time',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Regular operating cadence',
            boxThreeTitle: 'Consistency',
            boxThreeCopy: 'Reliable account progression',
            bodyThree: 'Continue from your client area and follow the updated plan.',
            bodyFour: 'Support remains available for quick directional checks.',
            ctaLabel: 'Open My Updated Plan',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'rising_step2_email',
        {
          name: 'Rising - Milestone Sprint Plan A IT',
          description: 'Messaggio di fase centrale con milestone brevi e operative.',
          subject: 'I tuoi prossimi traguardi sono pronti. Mantieni la crescita strutturata.',
          html: {
            lang: 'it',
            eyebrow: 'Piano Account Bullwaves',
            title: 'Il tuo piano a traguardi brevi e disponibile',
            heroTitle: 'Piccoli traguardi mantengono stabile lo slancio',
            heroSubtitle: 'Ora hai un piano semplice per continuare con maggiore continuita.',
            mainTitle: 'Una sequenza chiara aiuta a evitare rallentamenti precoci.',
            introLead:
              'Questa fase serve a mantenere il progresso misurabile e pratico, senza complicazioni inutili.',
            bodyOne:
              'Usa il piano aggiornato per organizzare le prossime azioni e mantenere il ritmo di crescita attuale.',
            bodyTwo: 'Questo piano supporta:',
            boxOneTitle: 'Struttura',
            boxOneCopy: 'Traguardi brevi e chiari',
            boxTwoTitle: 'Continuita',
            boxTwoCopy: 'Meno dispersione nell attivita',
            boxThreeTitle: 'Progresso',
            boxThreeCopy: 'Evoluzione account piu visibile',
            bodyThree: 'Apri la tua area cliente e rivedi il piano milestone.',
            bodyFour: 'Se serve, il supporto puo aiutarti a interpretare il primo passaggio.',
            ctaLabel: 'Vedi I Miei Traguardi',
          },
        },
        {
          name: 'Rising - Milestone Sprint Plan B IT',
          description: 'Variante execution-focused con chiarezza operativa.',
          subject: 'Nel tuo account e attivo un piano piu chiaro per la prossima fase.',
          html: {
            lang: 'it',
            eyebrow: 'Piano Account Bullwaves',
            title: 'Un percorso piu chiaro per la prossima fase',
            heroTitle: 'Mantieni la crescita pratica e misurabile',
            heroSubtitle:
              'Il tuo piano include ora traguardi brevi per allineare ritmo e direzione.',
            mainTitle: 'La chiave e continuita con azioni chiare.',
            introLead:
              'Questo aggiornamento ti aiuta a proseguire con ritmo migliore e meno decisioni incerte.',
            bodyOne:
              'Seguire traguardi brevi rende la progressione piu facile da gestire e piu stabile nel tempo.',
            bodyTwo: 'Dai priorita a:',
            boxOneTitle: 'Focus',
            boxOneCopy: 'Un passo chiaro alla volta',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Cadenza operativa regolare',
            boxThreeTitle: 'Coerenza',
            boxThreeCopy: 'Progressione account affidabile',
            bodyThree: 'Continua dalla tua area cliente e segui il piano aggiornato.',
            bodyFour: 'Il supporto resta disponibile per verifiche rapide di direzione.',
            ctaLabel: 'Apri Il Mio Piano Aggiornato',
          },
        }
      ),
    },
  },
  rising_step3_email: {
    id: 'rising_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'rising_step3_email',
        {
          name: 'Rising - Tier-up Preparation A',
          description: 'Preparation touch before profile upgrade review.',
          subject: 'Your profile is close to an account upgrade. Complete this final preparation.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Preparation',
            title: 'Final preparation before upgrade review',
            heroTitle: 'You are close to the next account level',
            heroSubtitle:
              'A final alignment now helps your profile stay strong in the next review.',
            mainTitle: 'This is the moment to close remaining setup actions.',
            introLead:
              'You are approaching an important account transition. A clean final setup improves continuity.',
            bodyOne:
              'Complete this phase to keep your profile stable and ready for the next level evaluation.',
            bodyTwo: 'This preparation improves:',
            boxOneTitle: 'Readiness',
            boxOneCopy: 'Better profile preparation',
            boxTwoTitle: 'Stability',
            boxTwoCopy: 'More consistent account behavior',
            boxThreeTitle: 'Progression',
            boxThreeCopy: 'Smoother move to the next stage',
            bodyThree: 'Open your client area and finalize the current setup.',
            bodyFour: 'If useful, support can provide one quick final check.',
            ctaLabel: 'Finalize My Preparation',
          },
        },
        {
          name: 'Rising - Tier-up Preparation B',
          description: 'Readiness variant focused on clean final execution.',
          subject: 'Before your next account review, confirm your final setup.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Account Preparation',
            title: 'Review readiness update',
            heroTitle: 'Prepare your account for the next evaluation',
            heroSubtitle: 'A short final alignment can make your progression more stable.',
            mainTitle: 'Close this phase with a clear final action.',
            introLead:
              'You already built good momentum. Now it is time to complete the setup with consistency.',
            bodyOne:
              'A well-closed phase improves your account quality and supports stronger continuity.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Order',
            boxOneCopy: 'Close open actions clearly',
            boxTwoTitle: 'Consistency',
            boxTwoCopy: 'Keep behavior regular',
            boxThreeTitle: 'Continuation',
            boxThreeCopy: 'Enable smoother next steps',
            bodyThree: 'Open your client area and confirm the final setup.',
            bodyFour: 'Support remains available for one practical confirmation.',
            ctaLabel: 'Confirm My Final Setup',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'rising_step3_email',
        {
          name: 'Rising - Tier-up Preparation A IT',
          description: 'Touch di preparazione prima della review per upgrade account.',
          subject:
            'Il tuo profilo e vicino a un upgrade account. Completa questa preparazione finale.',
          html: {
            lang: 'it',
            eyebrow: 'Preparazione Account Bullwaves',
            title: 'Preparazione finale prima della review upgrade',
            heroTitle: 'Sei vicino al prossimo livello account',
            heroSubtitle:
              'Un allineamento finale ora aiuta il profilo a restare forte nella prossima review.',
            mainTitle: 'Questo e il momento giusto per chiudere i passaggi aperti.',
            introLead:
              'Ti stai avvicinando a una transizione importante. Un setup finale pulito migliora la continuita.',
            bodyOne:
              'Completa questa fase per mantenere il profilo stabile e pronto alla valutazione del livello successivo.',
            bodyTwo: 'Questa preparazione migliora:',
            boxOneTitle: 'Preparazione',
            boxOneCopy: 'Profilo piu pronto alla review',
            boxTwoTitle: 'Stabilita',
            boxTwoCopy: 'Comportamento account piu coerente',
            boxThreeTitle: 'Progressione',
            boxThreeCopy: 'Passaggio piu fluido alla fase successiva',
            bodyThree: 'Apri la tua area cliente e finalizza il setup corrente.',
            bodyFour: 'Se utile, il supporto puo darti un ultimo check rapido.',
            ctaLabel: 'Finalizza La Mia Preparazione',
          },
        },
        {
          name: 'Rising - Tier-up Preparation B IT',
          description: 'Variante readiness focalizzata su esecuzione finale pulita.',
          subject: 'Prima della prossima review account, conferma il setup finale.',
          html: {
            lang: 'it',
            eyebrow: 'Preparazione Account Bullwaves',
            title: 'Aggiornamento readiness review',
            heroTitle: 'Prepara il tuo account alla prossima valutazione',
            heroSubtitle: 'Un allineamento finale breve puo rendere la progressione piu stabile.',
            mainTitle: 'Chiudi questa fase con un ultima azione chiara.',
            introLead:
              'Hai gia costruito un buon slancio. Ora va completato il setup con continuita.',
            bodyOne:
              'Una fase ben chiusa migliora la qualita account e sostiene una continuita piu forte.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Ordine',
            boxOneCopy: 'Chiudere chiaramente le azioni aperte',
            boxTwoTitle: 'Coerenza',
            boxTwoCopy: 'Mantenere comportamento regolare',
            boxThreeTitle: 'Prosecuzione',
            boxThreeCopy: 'Abilitare prossimi passi piu fluidi',
            bodyThree: 'Apri area cliente e conferma il setup finale.',
            bodyFour: 'Il supporto resta disponibile per una conferma pratica.',
            ctaLabel: 'Conferma Il Mio Setup Finale',
          },
        }
      ),
    },
  },
  rising_followup_retained_email: {
    id: 'rising_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'rising_followup_retained_email',
        {
          name: 'Rising - Positive Follow-up A',
          description: 'Positive follow-up after successful phase confirmation.',
          subject: 'Great result: your progress is confirmed. Keep moving forward.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Growth Follow-up',
            title: 'Your progress has been confirmed',
            heroTitle: 'You completed this phase successfully',
            heroSubtitle: 'Now the goal is to keep your account momentum active and consistent.',
            mainTitle: 'Your account remains in a positive progression state.',
            introLead: 'This confirmation gives you a strong base for the next period of activity.',
            bodyOne: 'Continue from your current setup and keep your operating rhythm regular.',
            bodyTwo: 'This confirmation supports:',
            boxOneTitle: 'Continuity',
            boxOneCopy: 'Keep momentum active',
            boxTwoTitle: 'Confidence',
            boxTwoCopy: 'Progress path remains solid',
            boxThreeTitle: 'Next step readiness',
            boxThreeCopy: 'Prepare the next objective',
            bodyThree: 'Open your client area and continue from your current profile.',
            bodyFour: 'Support is available if you want one quick strategic check.',
            ctaLabel: 'Continue My Progress',
          },
        },
        {
          name: 'Rising - Positive Follow-up B',
          description: 'Commercial continuity follow-up with next-step focus.',
          subject: 'Your account is on track. Keep this pace in the next phase.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Growth Follow-up',
            title: 'Stay on your current pace',
            heroTitle: 'Your recent phase closed with a positive result',
            heroSubtitle: 'The next value comes from consistency in the coming weeks.',
            mainTitle: 'Keep your account behavior stable and focused.',
            introLead:
              'You now have a confirmed base to continue with stronger quality and continuity.',
            bodyOne: 'A regular cadence and clear actions will help you preserve this advantage.',
            bodyTwo: 'Prioritize:',
            boxOneTitle: 'Regularity',
            boxOneCopy: 'Keep a stable account rhythm',
            boxTwoTitle: 'Execution',
            boxTwoCopy: 'Follow clear next actions',
            boxThreeTitle: 'Preparation',
            boxThreeCopy: 'Build toward next progression target',
            bodyThree: 'Continue from your client area with your current account setup.',
            bodyFour: 'Support remains available for one quick direction check.',
            ctaLabel: 'Keep My Pace',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'rising_followup_retained_email',
        {
          name: 'Rising - Positive Follow-up A IT',
          description: 'Follow-up positivo dopo conferma della fase completata.',
          subject: 'Ottimo risultato: la tua progressione e confermata. Continua cosi.',
          html: {
            lang: 'it',
            eyebrow: 'Follow-up Crescita Bullwaves',
            title: 'La tua progressione e stata confermata',
            heroTitle: 'Hai completato questa fase con esito positivo',
            heroSubtitle: 'Ora il focus e mantenere attivo e coerente lo slancio account.',
            mainTitle: 'Il tuo account resta in una fase positiva di progressione.',
            introLead: 'Questa conferma ti da una base solida per il prossimo periodo operativo.',
            bodyOne: 'Continua dal setup attuale e mantieni regolare il tuo ritmo operativo.',
            bodyTwo: 'Questa conferma supporta:',
            boxOneTitle: 'Continuita',
            boxOneCopy: 'Mantenere attivo lo slancio',
            boxTwoTitle: 'Fiducia',
            boxTwoCopy: 'Percorso di progresso stabile',
            boxThreeTitle: 'Preparazione prossima fase',
            boxThreeCopy: 'Avvicinarsi al prossimo obiettivo',
            bodyThree: 'Apri area cliente e continua dal profilo account attuale.',
            bodyFour: 'Il supporto e disponibile se vuoi un check strategico rapido.',
            ctaLabel: 'Continua La Mia Progressione',
          },
        },
        {
          name: 'Rising - Positive Follow-up B IT',
          description: 'Follow-up commerciale di continuita con focus sui prossimi passi.',
          subject: 'Il tuo account e in linea. Mantieni questo ritmo nella prossima fase.',
          html: {
            lang: 'it',
            eyebrow: 'Follow-up Crescita Bullwaves',
            title: 'Mantieni il ritmo attuale',
            heroTitle: 'La fase recente si e chiusa con esito positivo',
            heroSubtitle: 'Il prossimo valore arriva dalla continuita nelle prossime settimane.',
            mainTitle: 'Mantieni il comportamento account stabile e focalizzato.',
            introLead:
              'Ora hai una base confermata da cui continuare con maggiore qualita e continuita.',
            bodyOne:
              'Una cadenza regolare e azioni chiare ti aiuteranno a preservare questo vantaggio.',
            bodyTwo: 'Dai priorita a:',
            boxOneTitle: 'Regolarita',
            boxOneCopy: 'Ritmo account piu stabile',
            boxTwoTitle: 'Esecuzione',
            boxTwoCopy: 'Prossime azioni ben definite',
            boxThreeTitle: 'Preparazione',
            boxThreeCopy: 'Costruire il prossimo obiettivo',
            bodyThree: 'Continua dalla tua area cliente con il setup attuale.',
            bodyFour: 'Il supporto resta disponibile per un rapido check di direzione.',
            ctaLabel: 'Mantieni Il Mio Ritmo',
          },
        }
      ),
    },
  },
  rising_followup_recovery_email: {
    id: 'rising_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'rising_followup_recovery_email',
        {
          name: 'Rising - Return Follow-up A',
          description: 'Return follow-up for users who slowed down after early growth.',
          subject: 'Your momentum can restart from a simpler Bullwaves path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A cleaner restart is available',
            heroTitle: 'You can recover pace without pressure',
            heroSubtitle:
              'If your activity slowed down, a simpler path can help you resume quickly.',
            mainTitle: 'Your account can still progress from here.',
            introLead:
              'This update gives you a practical restart option to recover continuity and confidence.',
            bodyOne: 'The best move is a clean re-entry with clear actions and low friction.',
            bodyTwo: 'This return option supports:',
            boxOneTitle: 'Restart clarity',
            boxOneCopy: 'A visible way back',
            boxTwoTitle: 'Simplicity',
            boxTwoCopy: 'Lower effort to continue',
            boxThreeTitle: 'Momentum rebuild',
            boxThreeCopy: 'Recover account cadence',
            bodyThree: 'Open your client area and continue from the return option.',
            bodyFour: 'Support is available if you want a guided restart.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Rising - Return Follow-up B',
          description: 'Low-pressure return follow-up for early momentum profiles.',
          subject: 'A lighter path is active to help you resume your Bullwaves activity.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Resume with a lighter setup',
            heroTitle: 'Re-enter with less friction',
            heroSubtitle:
              'A simple restart can help you recover pace faster and with more confidence.',
            mainTitle: 'The objective now is a clear and steady return to active rhythm.',
            introLead:
              'This option is built to reduce pressure and help you return to a regular rhythm.',
            bodyOne: 'Use this phase to recover continuity and avoid a longer inactivity gap.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Engagement',
            boxOneCopy: 'Bring activity back gradually',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Follow one clear next step',
            boxThreeTitle: 'Confidence',
            boxThreeCopy: 'Continue with less uncertainty',
            bodyThree: 'Open your client area and relaunch from the restart option.',
            bodyFour: 'Support remains available for a quick clarification.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'rising_followup_recovery_email',
        {
          name: 'Rising - Return Follow-up A IT',
          description:
            'Follow-up di ritorno per utenti che hanno rallentato dopo una crescita iniziale.',
          subject: 'Il tuo slancio puo ripartire da un percorso Bullwaves piu semplice.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E disponibile una ripartenza piu pulita',
            heroTitle: 'Puoi recuperare ritmo senza pressione',
            heroSubtitle:
              'Se l attivita e rallentata, un percorso piu semplice puo aiutarti a ripartire rapidamente.',
            mainTitle: 'Il tuo account puo ancora progredire da qui.',
            introLead:
              'Questo aggiornamento ti offre una opzione pratica per recuperare continuita e fiducia.',
            bodyOne: 'La mossa migliore e un rientro pulito con azioni chiare e basso attrito.',
            bodyTwo: 'Questa opzione di ritorno supporta:',
            boxOneTitle: 'Chiarezza ripartenza',
            boxOneCopy: 'Un rientro ben visibile',
            boxTwoTitle: 'Semplicita',
            boxTwoCopy: 'Meno sforzo per continuare',
            boxThreeTitle: 'Recupero slancio',
            boxThreeCopy: 'Riprendere cadenza account',
            bodyThree: 'Apri area cliente e continua dall opzione di ritorno.',
            bodyFour: 'Il supporto e disponibile se vuoi una ripartenza guidata.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Rising - Return Follow-up B IT',
          description:
            'Follow-up a bassa pressione per riattivazione di profili in crescita iniziale.',
          subject: 'E attivo un percorso piu leggero per riprendere la tua attivita Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riprendi con un setup piu leggero',
            heroTitle: 'Rientra con meno attrito',
            heroSubtitle:
              'Una ripartenza semplice puo aiutarti a recuperare ritmo piu velocemente e con piu fiducia.',
            mainTitle: 'L obiettivo ora e un ritorno chiaro e costante al ritmo attivo.',
            introLead:
              'Questa opzione e pensata per ridurre pressione e aiutarti a tornare a un ritmo regolare.',
            bodyOne:
              'Usa questa fase per recuperare continuita ed evitare un periodo lungo di inattivita.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Coinvolgimento',
            boxOneCopy: 'Riattivare gradualmente attivita',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Seguire un prossimo passo chiaro',
            boxThreeTitle: 'Fiducia',
            boxThreeCopy: 'Continuare con meno incertezza',
            bodyThree: 'Apri area cliente e rilancia dalla opzione di ripartenza.',
            bodyFour: 'Il supporto resta disponibile per un chiarimento rapido.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  churned_high_value_step1_email: {
    id: 'churned_high_value_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'churned_high_value_step1_email',
        {
          name: 'Churned High Value - Comeback Touch A',
          description:
            'Premium reactivation opening for previously high-value users who went inactive.',
          subject: 'Dedicated return review for your Bullwaves profile.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A high-value comeback path is open',
            heroTitle: 'You were one of our strongest active profiles',
            heroSubtitle: 'This message is your direct route back into an active trading rhythm.',
            mainTitle: 'Re-entry should feel clear, relevant, and worth your time.',
            introLead:
              'Your past account behavior placed you in a high-value tier. The goal now is to reactivate that level without friction.',
            bodyOne:
              'This is not a generic reminder. It is a focused comeback route built for users with proven value history.',
            bodyTwo: 'What you can access right away:',
            boxOneTitle: 'Bonus',
            boxOneCopy: 'Dedicated bonus options based on your current eligibility',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Direct contact with your account manager for priority alignment',
            boxThreeTitle: 'Priority',
            boxThreeCopy: 'Priority handling on key support requests',
            bodyThree:
              'Open your client area to review what is currently available for your profile and choose your next step.',
            bodyFour:
              'The practical objective is clear: manager follow-up, bonus options, and access to new trading tools.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Comeback Touch B',
          description:
            'Executive-style comeback variant focused on restoring active status quickly.',
          subject: 'Your return review is open in your Bullwaves client area.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Return with a clearer operating setup',
            heroTitle: 'Your profile can return to active quickly',
            heroSubtitle: 'The next step is structured to reduce noise and restore consistency.',
            mainTitle: 'The objective is simple: bring your account back to active quality.',
            introLead:
              'You already proved your profile value in the past. This touch is designed to recover that trajectory with precision.',
            bodyOne:
              'Use this comeback window to re-enter with focused actions and avoid another inactive cycle.',
            bodyTwo: 'In this phase, review:',
            boxOneTitle: 'Bonus',
            boxOneCopy: 'Bonus options currently applicable to your profile',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Direct manager follow-up for practical alignment',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Access conditions to new trading tools',
            bodyThree:
              'Re-enter your client area to review available options and confirm the next practical action.',
            bodyFour:
              'No over-promises: this touch is for a concrete review of manager support, bonus, and tools.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_step1_email',
        {
          name: 'Churned High Value - Comeback Touch A IT',
          description:
            'Apertura premium di riattivazione per utenti ad alto valore diventati inattivi.',
          subject: 'Revisione dedicata al rientro per il tuo profilo Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E aperto un percorso di rientro ad alto valore',
            heroTitle: 'Sei stato uno dei profili attivi piu forti',
            heroSubtitle:
              'Questo messaggio e il tuo accesso diretto a un ritmo operativo di nuovo attivo.',
            mainTitle: 'Il rientro deve essere chiaro, utile e senza attrito.',
            introLead:
              'Il tuo comportamento passato ti aveva portato in una fascia ad alto valore. Ora il focus e riattivare quel livello in modo rapido.',
            bodyOne:
              'Non e un promemoria generico. E un percorso mirato per profili con storico di valore comprovato.',
            bodyTwo: 'Cosa puoi attivare subito:',
            boxOneTitle: 'Bonus',
            boxOneCopy: 'Opzioni bonus dedicate in base alla tua idoneita attuale',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Contatto diretto con il tuo account manager per allineamento prioritario',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Condizioni di accesso ai nuovi trading tools',
            bodyThree:
              'Apri la tua area cliente per verificare cosa e attualmente disponibile sul tuo profilo e scegliere il prossimo passo.',
            bodyFour:
              'Obiettivo pratico: supporto del manager, opzioni bonus e accesso ai nuovi trading tools.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Churned High Value - Comeback Touch B IT',
          description:
            'Variante executive orientata a riportare rapidamente l utente in stato attivo.',
          subject: 'La tua revisione di rientro e aperta nell area cliente Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Rientra con un setup operativo piu chiaro',
            heroTitle: 'Il tuo profilo puo tornare attivo rapidamente',
            heroSubtitle:
              'Il prossimo passo e strutturato per ridurre rumore e recuperare continuita.',
            mainTitle: 'L obiettivo e semplice: riportare il tuo account a qualita attiva.',
            introLead:
              'In passato hai gia dimostrato valore. Questo touch serve a recuperare quella traiettoria con precisione.',
            bodyOne:
              'Usa questa finestra di rientro per riattivarti con azioni mirate ed evitare un nuovo ciclo di inattivita.',
            bodyTwo: 'In questa fase valuta:',
            boxOneTitle: 'Bonus',
            boxOneCopy: 'Opzioni bonus applicabili al tuo profilo',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Follow-up diretto del manager per allineamento pratico',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Condizioni di accesso ai nuovi trading tools',
            bodyThree:
              'Rientra dalla tua area cliente per rivedere le opzioni disponibili e confermare il prossimo passo pratico.',
            bodyFour:
              'Nessuna promessa generica: questo touch serve a verificare in modo concreto manager, bonus e tools.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  churned_high_value_step2_email: {
    id: 'churned_high_value_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'churned_high_value_step2_email',
        {
          name: 'Churned High Value - Return Package A',
          description: 'Structured return package to convert intent into stable active behavior.',
          subject: 'Your return review continues in your Bullwaves client area.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your high-value return package is ready',
            heroTitle: 'Turn comeback intent into active continuity',
            heroSubtitle: 'This package gives you a practical route to re-enter and stay active.',
            mainTitle: 'A strong return needs structure, not pressure.',
            introLead:
              'You are already in a return window. The next move is to follow a clear sequence that restores activity quality.',
            bodyOne:
              'This package was built to reduce uncertainty and move you from passive return to active account rhythm.',
            bodyTwo: 'In this review, focus on:',
            boxOneTitle: 'Account Manager',
            boxOneCopy: 'Define a practical follow-up with your manager',
            boxTwoTitle: 'Bonus',
            boxTwoCopy: 'Review bonus options and current eligibility',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Review access to new tools relevant to your profile',
            bodyThree:
              'Open your client area to review available options and select your next action.',
            bodyFour: 'This message does not promise outcomes: it frames what can be reviewed now.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Return Package B',
          description: 'Execution-led variant focused on a rapid return to active status.',
          subject: 'Second return review touch for your Bullwaves profile.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Reactivate with a cleaner sequence',
            heroTitle: 'Bring your account back into active range',
            heroSubtitle: 'You have a focused path to restore rhythm and account quality.',
            mainTitle: 'The best return is measured, structured, and consistent.',
            introLead:
              'This phase is designed to recover active behavior quickly while preserving your profile value.',
            bodyOne:
              'Follow the sequence now and use each step to rebuild continuity without unnecessary complexity.',
            bodyTwo: 'Prioritize this review on:',
            boxOneTitle: 'Account Manager',
            boxOneCopy: 'Confirm manager follow-up cadence',
            boxTwoTitle: 'Bonus',
            boxTwoCopy: 'Check bonus options currently available',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Assess access to the next tool set',
            bodyThree: 'Re-enter from your area and confirm which option to activate next.',
            bodyFour: 'The objective stays concrete: manager, bonus, and tools.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_step2_email',
        {
          name: 'Churned High Value - Return Package A IT',
          description:
            'Pacchetto di rientro strutturato per trasformare intenzione in attivita concreta.',
          subject: 'La revisione di rientro prosegue nella tua area cliente Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo pacchetto di rientro ad alto valore e pronto',
            heroTitle: 'Trasforma il rientro in continuita attiva',
            heroSubtitle:
              'Questo pacchetto ti offre un percorso pratico per rientrare e restare attivo.',
            mainTitle: 'Un rientro forte richiede struttura, non pressione.',
            introLead:
              'Sei gia in una finestra di ritorno. Il prossimo passo e seguire una sequenza chiara per ripristinare qualita operativa.',
            bodyOne:
              'Questo pacchetto riduce incertezza e ti porta da rientro passivo a ritmo account attivo.',
            bodyTwo: 'In questa revisione concentrati su:',
            boxOneTitle: 'Account Manager',
            boxOneCopy: 'Definisci un follow-up pratico con il manager',
            boxTwoTitle: 'Bonus',
            boxTwoCopy: 'Verifica opzioni bonus e idoneita attuale',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Verifica accesso ai nuovi strumenti coerenti col profilo',
            bodyThree:
              'Apri la tua area cliente per rivedere le opzioni disponibili e scegliere il prossimo passo.',
            bodyFour: 'Questo messaggio non promette esiti: definisce cosa puoi verificare ora.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Churned High Value - Return Package B IT',
          description: 'Variante execution-led orientata a tornare rapidamente in stato attivo.',
          subject: 'Secondo touch di revisione rientro per il tuo profilo Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riattivati con una sequenza piu pulita',
            heroTitle: 'Riporta il tuo account in fascia attiva',
            heroSubtitle: 'Hai un percorso focalizzato per recuperare ritmo e qualita account.',
            mainTitle: 'Il miglior rientro e misurato, strutturato e continuo.',
            introLead:
              'Questa fase serve a recuperare rapidamente comportamento attivo preservando il valore del profilo.',
            bodyOne:
              'Segui ora la sequenza e usa ogni step per ricostruire continuita senza complessita inutile.',
            bodyTwo: 'In questa revisione dai priorita a:',
            boxOneTitle: 'Account Manager',
            boxOneCopy: 'Conferma la cadenza di follow-up col manager',
            boxTwoTitle: 'Bonus',
            boxTwoCopy: 'Controlla le opzioni bonus disponibili',
            boxThreeTitle: 'Trading Tools',
            boxThreeCopy: 'Valuta l accesso al prossimo set di strumenti',
            bodyThree:
              'Rientra dalla tua area e conferma quale opzione attivare nel prossimo passo.',
            bodyFour: 'L obiettivo resta concreto: manager, bonus e trading tools.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  churned_high_value_step3_email: {
    id: 'churned_high_value_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'churned_high_value_step3_email',
        {
          name: 'Churned High Value - Active Return Consolidation A',
          description:
            'High-level touch to stabilize returning high-value users into active continuity.',
          subject: 'Final return review touch for your Bullwaves profile.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Stabilize your return',
            heroTitle: 'Now protect your return momentum',
            heroSubtitle:
              'This phase keeps your comeback from fading after the first return signal.',
            mainTitle: 'Your return creates value only when it stays consistent.',
            introLead:
              'You already restarted movement. This touch helps convert return intent into stable active behavior.',
            bodyOne:
              'Use this final consolidation phase to protect rhythm and avoid another inactive cycle.',
            bodyTwo: 'Stability now depends on:',
            boxOneTitle: 'Continuity',
            boxOneCopy: 'Keep account behavior regular',
            boxTwoTitle: 'Control',
            boxTwoCopy: 'Follow clear operating checkpoints',
            boxThreeTitle: 'Progress quality',
            boxThreeCopy: 'Build active consistency over time',
            bodyThree:
              'Open your client area to confirm final priorities for manager follow-up, bonus options, and trading tools access.',
            bodyFour: 'Support is available if you want one final strategic check.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Active Return Consolidation B',
          description: 'Precision-focused variant to secure active status by the next checkpoint.',
          subject: 'Final checkpoint review in your Bullwaves client area.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Secure your active profile',
            heroTitle: 'You are close to a full active return',
            heroSubtitle:
              'A short final phase now can protect your return and restore full account quality.',
            mainTitle: 'The objective is to convert comeback into active durability.',
            introLead:
              'This step is designed to close your return with stronger consistency and less future volatility.',
            bodyOne:
              'Complete the phase in account and keep your return aligned with active-profile standards.',
            bodyTwo: 'Focus now on:',
            boxOneTitle: 'Execution quality',
            boxOneCopy: 'Clear and regular actions',
            boxTwoTitle: 'Behavior stability',
            boxTwoCopy: 'Avoid stop-and-go pattern',
            boxThreeTitle: 'Active qualification',
            boxThreeCopy: 'Re-enter active tier with confidence',
            bodyThree:
              'Continue from your client area and confirm the final priority mix: manager follow-up, bonus options, and trading tools access.',
            bodyFour: 'Support remains available for one practical final confirmation.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_step3_email',
        {
          name: 'Churned High Value - Consolidamento Ritorno Attivo A IT',
          description:
            'Touch executive per stabilizzare utenti riattivati e riportarli in continuita attiva.',
          subject: 'Touch finale di revisione rientro per il tuo profilo Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Stabilizza il tuo ritorno',
            heroTitle: 'Ora proteggi lo slancio del tuo ritorno',
            heroSubtitle:
              'Questa fase evita che il rientro si disperda dopo i primi segnali positivi.',
            mainTitle: 'Il ritorno crea valore solo se resta continuo.',
            introLead:
              'Hai gia riavviato il movimento. Questo touch converte il rientro in comportamento attivo stabile.',
            bodyOne:
              'Usa questa fase finale per consolidare ritmo ed evitare un nuovo ciclo di inattivita.',
            bodyTwo: 'La stabilita ora dipende da:',
            boxOneTitle: 'Continuita',
            boxOneCopy: 'Comportamento account regolare',
            boxTwoTitle: 'Controllo',
            boxTwoCopy: 'Checkpoint operativi chiari',
            boxThreeTitle: 'Qualita progresso',
            boxThreeCopy: 'Coerenza attiva nel tempo',
            bodyThree:
              'Apri la tua area cliente per confermare le priorita finali su follow-up manager, opzioni bonus e accesso ai trading tools.',
            bodyFour: 'Il supporto e disponibile se vuoi un ultimo check strategico.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Churned High Value - Consolidamento Ritorno Attivo B IT',
          description: 'Variante precision-focused per consolidare stato attivo al checkpoint.',
          subject: 'Revisione finale checkpoint nella tua area cliente Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Consolida il tuo profilo attivo',
            heroTitle: 'Sei vicino a un ritorno pienamente attivo',
            heroSubtitle:
              'Una breve fase finale ora puo proteggere il rientro e ripristinare piena qualita account.',
            mainTitle: 'L obiettivo e trasformare il rientro in continuita attiva duratura.',
            introLead:
              'Questo step chiude il ritorno con maggiore coerenza e minore volatilita futura.',
            bodyOne:
              'Completa la fase in account e mantieni il rientro allineato agli standard di profilo attivo.',
            bodyTwo: 'Ora concentrati su:',
            boxOneTitle: 'Qualita esecuzione',
            boxOneCopy: 'Azioni chiare e regolari',
            boxTwoTitle: 'Stabilita comportamento',
            boxTwoCopy: 'Evita pattern stop-and-go',
            boxThreeTitle: 'Qualifica attiva',
            boxThreeCopy: 'Rientra in fascia attiva con fiducia',
            bodyThree:
              'Continua dalla tua area cliente e conferma il mix finale di priorita: manager, bonus e trading tools.',
            bodyFour: 'Il supporto resta disponibile per una conferma pratica finale.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  churned_high_value_followup_retained_email: {
    id: 'churned_high_value_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'churned_high_value_followup_retained_email',
        {
          name: 'Churned High Value - Positive Follow-up A',
          description:
            'Positive follow-up after confirmed reactivation to keep user in active tier.',
          subject: 'Excellent: your account is back in active progression.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your active return is confirmed',
            heroTitle: 'You are back in an active account rhythm',
            heroSubtitle: 'Now the focus is keeping this continuity stable over the next cycle.',
            mainTitle: 'Your comeback worked. Protect the rhythm from here.',
            introLead:
              'This confirmation marks a successful re-entry into active behavior. The next goal is durability.',
            bodyOne:
              'Continue from your current setup and keep operating with regular, high-quality cadence.',
            bodyTwo: 'To stay active, prioritize:',
            boxOneTitle: 'Regularity',
            boxOneCopy: 'Keep behavior consistent week by week',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Follow clear next actions',
            boxThreeTitle: 'Progress discipline',
            boxThreeCopy: 'Protect profile quality over time',
            bodyThree: 'Open your client area and continue from your confirmed active path.',
            bodyFour: 'Support is available for one quick strategic alignment if useful.',
            ctaLabel: 'Continue My Active Path',
          },
        },
        {
          name: 'Churned High Value - Positive Follow-up B',
          description: 'Continuity variant for preserving active behavior after recovery.',
          subject: 'Your active status is restored. Keep this momentum clean and stable.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Keep your active status stable',
            heroTitle: 'Reactivation is complete. Continuity starts now.',
            heroSubtitle: 'The strongest result is not return alone, but sustained active quality.',
            mainTitle: 'You are back in range. Keep the next phase disciplined.',
            introLead: 'Use this window to preserve momentum and avoid a new cooling cycle.',
            bodyOne:
              'A clean cadence and practical next actions will keep your profile in the active tier.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Consistency',
            boxOneCopy: 'Regular account activity',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Clear execution priorities',
            boxThreeTitle: 'Retention quality',
            boxThreeCopy: 'Longer active continuity',
            bodyThree: 'Continue from your area and keep your current trajectory active.',
            bodyFour: 'Support remains available for one tactical check.',
            ctaLabel: 'Protect My Active Momentum',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_followup_retained_email',
        {
          name: 'Churned High Value - Positive Follow-up A IT',
          description:
            'Follow-up positivo dopo riattivazione confermata per mantenere l utente in fascia attiva.',
          subject: 'Ottimo: il tuo account e tornato in progressione attiva.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo ritorno attivo e confermato',
            heroTitle: 'Sei tornato in un ritmo account attivo',
            heroSubtitle: 'Ora il focus e mantenere questa continuita stabile nel prossimo ciclo.',
            mainTitle: 'Il rientro ha funzionato. Da qui proteggi il ritmo.',
            introLead:
              'Questa conferma segna un rientro riuscito in comportamento attivo. Il prossimo obiettivo e la durata.',
            bodyOne: 'Continua dal setup corrente e mantieni una cadenza regolare e di qualita.',
            bodyTwo: 'Per restare attivo, dai priorita a:',
            boxOneTitle: 'Regolarita',
            boxOneCopy: 'Comportamento costante settimana dopo settimana',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Prossime azioni chiare',
            boxThreeTitle: 'Disciplina progresso',
            boxThreeCopy: 'Proteggi la qualita del profilo nel tempo',
            bodyThree: 'Apri area cliente e continua dal percorso attivo confermato.',
            bodyFour: 'Il supporto e disponibile per un allineamento strategico rapido se utile.',
            ctaLabel: 'Continua Il Mio Percorso Attivo',
          },
        },
        {
          name: 'Churned High Value - Positive Follow-up B IT',
          description: 'Variante di continuita per preservare stato attivo dopo recovery.',
          subject: 'Il tuo stato attivo e ripristinato. Mantieni ritmo pulito e stabile.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Mantieni stabile il tuo stato attivo',
            heroTitle: 'Riattivazione completata. Ora inizia la continuita.',
            heroSubtitle:
              'Il risultato migliore non e solo il ritorno, ma una qualita attiva duratura.',
            mainTitle: 'Sei rientrato in fascia. Mantieni disciplinata la prossima fase.',
            introLead:
              'Usa questa finestra per preservare slancio ed evitare un nuovo ciclo di raffreddamento.',
            bodyOne:
              'Una cadenza pulita e azioni pratiche tengono il tuo profilo in fascia attiva.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Coerenza',
            boxOneCopy: 'Attivita account regolare',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Priorita esecutive chiare',
            boxThreeTitle: 'Qualita retention',
            boxThreeCopy: 'Continuita attiva piu lunga',
            bodyThree: 'Continua dalla tua area e mantieni attiva la traiettoria corrente.',
            bodyFour: 'Il supporto resta disponibile per un check tattico.',
            ctaLabel: 'Proteggi Il Mio Slancio Attivo',
          },
        }
      ),
    },
  },
  churned_high_value_followup_recovery_email: {
    id: 'churned_high_value_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'churned_high_value_followup_recovery_email',
        {
          name: 'Churned High Value - Return Follow-up A',
          description: 'Follow-up when a full active return was not reached yet.',
          subject: 'Your high-value return is still possible. A cleaner path is open.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A return route is still open',
            heroTitle: 'Your profile can still return to active range',
            heroSubtitle: 'This path keeps the relationship open and lowers re-entry friction.',
            mainTitle: 'Missing one checkpoint does not close your comeback opportunity.',
            introLead:
              'You still have a practical route to recover momentum and move back into active behavior.',
            bodyOne:
              'Use this restart option now to avoid deeper inactivity and preserve account value.',
            bodyTwo: 'This return path helps you with:',
            boxOneTitle: 'Re-entry clarity',
            boxOneCopy: 'One visible next step',
            boxTwoTitle: 'Lower friction',
            boxTwoCopy: 'Simpler way back to activity',
            boxThreeTitle: 'Value preservation',
            boxThreeCopy: 'Protect profile quality while restarting',
            bodyThree: 'Open your client area and relaunch from the return route.',
            bodyFour: 'Support remains available if you want a guided restart checkpoint.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Return Follow-up B',
          description:
            'Low-pressure variant to keep high-value relationship alive after missed recovery.',
          subject: 'A lighter return option is now available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart with a lighter frame',
            heroTitle: 'Reduce pressure and recover continuity',
            heroSubtitle: 'A simpler comeback setup can work better after a missed checkpoint.',
            mainTitle: 'The objective now is a clean, practical re-entry.',
            introLead:
              'This option is designed to keep your return viable and prevent a full churn confirmation.',
            bodyOne:
              'Use the lighter path to reactivate step by step and rebuild active rhythm gradually.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Simple actions',
            boxOneCopy: 'One clear move at a time',
            boxTwoTitle: 'Steady rhythm',
            boxTwoCopy: 'Rebuild continuity progressively',
            boxThreeTitle: 'Comeback viability',
            boxThreeCopy: 'Keep the active-return option open',
            bodyThree: 'Re-enter from your area and continue with the lighter recovery option.',
            bodyFour: 'Support is available for one quick tactical clarification.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_followup_recovery_email',
        {
          name: 'Churned High Value - Return Follow-up A IT',
          description:
            'Follow-up di ritorno quando non e stato ancora raggiunto uno stato pienamente attivo.',
          subject:
            'Il tuo ritorno ad alto valore e ancora possibile. E aperto un percorso piu pulito.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E ancora aperto un percorso di ritorno',
            heroTitle: 'Il tuo profilo puo ancora rientrare in fascia attiva',
            heroSubtitle:
              'Questo percorso mantiene aperta la relazione e riduce attrito di rientro.',
            mainTitle: 'Mancare un checkpoint non chiude la tua opportunita di ritorno.',
            introLead:
              'Hai ancora un percorso pratico per recuperare slancio e tornare in comportamento attivo.',
            bodyOne:
              'Usa ora questa opzione di ripartenza per evitare inattivita piu profonda e preservare valore account.',
            bodyTwo: 'Questo percorso di ritorno ti aiuta con:',
            boxOneTitle: 'Chiarezza rientro',
            boxOneCopy: 'Un prossimo passo ben visibile',
            boxTwoTitle: 'Attrito ridotto',
            boxTwoCopy: 'Ritorno all attivita piu semplice',
            boxThreeTitle: 'Preservazione valore',
            boxThreeCopy: 'Proteggi qualita profilo durante il riavvio',
            bodyThree: 'Apri area cliente e rilancia dal percorso di ritorno.',
            bodyFour: 'Il supporto resta disponibile se vuoi un checkpoint guidato di ripartenza.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Churned High Value - Return Follow-up B IT',
          description:
            'Variante a bassa pressione per mantenere viva la relazione ad alto valore dopo checkpoint mancato.',
          subject: 'Per il tuo account e disponibile una opzione di ritorno piu leggera.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti con una impostazione piu leggera',
            heroTitle: 'Riduci pressione e recupera continuita',
            heroSubtitle:
              'Dopo un checkpoint mancato, un setup piu semplice puo funzionare meglio.',
            mainTitle: 'L obiettivo ora e un rientro pratico e pulito.',
            introLead:
              'Questa opzione mantiene possibile il ritorno ed evita conferma completa di churn.',
            bodyOne:
              'Usa il percorso leggero per riattivarti passo dopo passo e ricostruire gradualmente il ritmo attivo.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Azioni semplici',
            boxOneCopy: 'Un passo chiaro alla volta',
            boxTwoTitle: 'Ritmo stabile',
            boxTwoCopy: 'Ricostruisci continuita progressiva',
            boxThreeTitle: 'Rientro possibile',
            boxThreeCopy: 'Mantieni aperta opzione di ritorno attivo',
            bodyThree: 'Rientra dalla tua area e continua con l opzione recovery piu leggera.',
            bodyFour: 'Il supporto e disponibile per un chiarimento tattico rapido.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  dormant_value_step1_email: {
    id: 'dormant_value_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_value_step1_email',
        {
          name: 'Dormant Value - Reactivation Touch A',
          description: 'Low-friction wake-up message for dormant value traders.',
          subject: 'Your Bullwaves account still has value ready to reactivate.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A simple return path is open',
            heroTitle: 'Your account is still worth reactivating',
            heroSubtitle: 'This is a practical touch to help you restart without pressure.',
            mainTitle: 'A dormant profile can return with one clear next step.',
            introLead:
              'Your previous activity showed value. This message is meant to reopen the relationship in a clean and useful way.',
            bodyOne:
              'The goal is to help you log back in, review your account, and restart from a lighter structure.',
            bodyTwo: 'This touch helps you recover:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'A visible next action to take now',
            boxTwoTitle: 'Continuity',
            boxTwoCopy: 'A smoother way back into the platform',
            boxThreeTitle: 'Momentum',
            boxThreeCopy: 'A more stable restart rhythm',
            bodyThree: 'Open your client area and review your reactivation path.',
            bodyFour: 'If needed, support remains available for a quick checkpoint.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Dormant Value - Reactivation Touch B',
          description: 'Return-oriented variant for value users cooling down.',
          subject: 'A clearer way to restart your Bullwaves activity is available.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart with less friction',
            heroTitle: 'The best comeback is simple and practical',
            heroSubtitle: 'You do not need a hard reset, only a clearer route back.',
            mainTitle: 'Your account can still recover value from here.',
            introLead:
              'This update is designed for profiles that showed potential but lost recent continuity.',
            bodyOne:
              'Use this phase to restart from the platform and rebuild a more regular account rhythm.',
            bodyTwo: 'Focus now on:',
            boxOneTitle: 'Re-entry',
            boxOneCopy: 'Come back through one simple action',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Reduce stop-and-go behavior',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Preserve the relationship value',
            bodyThree: 'Re-enter your client area and restart from the current path.',
            bodyFour: 'Support is there if one detail needs context.',
            ctaLabel: 'Restart My Account Path',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_value_step1_email',
        {
          name: 'Dormant Value - Reactivation Touch A IT',
          description: 'Touch di riattivazione a basso attrito per trader dormant con valore.',
          subject: 'Il tuo account Bullwaves ha ancora valore da riattivare.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E aperto un percorso semplice di ritorno',
            heroTitle: 'Il tuo account merita ancora una riattivazione',
            heroSubtitle: 'Questo e un touch pratico per aiutarti a ripartire senza pressione.',
            mainTitle: 'Un profilo dormant puo tornare attivo con un passo chiaro.',
            introLead:
              'La tua attivita passata ha mostrato valore. Questo messaggio serve a riaprire la relazione in modo utile e ordinato.',
            bodyOne:
              'L obiettivo e aiutarti a rientrare, rivedere l account e ripartire da una struttura piu leggera.',
            bodyTwo: 'Questo touch ti aiuta a recuperare:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Un prossimo passo visibile da fare ora',
            boxTwoTitle: 'Continuita',
            boxTwoCopy: 'Un rientro piu semplice in piattaforma',
            boxThreeTitle: 'Slancio',
            boxThreeCopy: 'Una ripartenza piu stabile',
            bodyThree: 'Apri la tua area cliente e rivedi il percorso di riattivazione.',
            bodyFour: 'Se serve, il supporto resta disponibile per un check rapido.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Value - Reactivation Touch B IT',
          description: 'Variante di ritorno per utenti value che si sono raffreddati.',
          subject: 'E disponibile un modo piu chiaro per ripartire con Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti con meno attrito',
            heroTitle: 'Il miglior ritorno e semplice e pratico',
            heroSubtitle: 'Non serve un reset duro, ma un percorso di rientro piu chiaro.',
            mainTitle: 'Il tuo account puo ancora recuperare valore da qui.',
            introLead:
              'Questo aggiornamento e pensato per profili che hanno mostrato potenziale ma perso continuita recente.',
            bodyOne:
              'Usa questa fase per ripartire dalla piattaforma e ricostruire un ritmo account piu regolare.',
            bodyTwo: 'Ora concentrati su:',
            boxOneTitle: 'Rientro',
            boxOneCopy: 'Torna con un azione semplice',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Riduci il pattern a intermittenza',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Preserva il valore della relazione',
            bodyThree: 'Rientra nella tua area cliente e riparti dal percorso attuale.',
            bodyFour: 'Il supporto c e se un dettaglio richiede piu contesto.',
            ctaLabel: 'Riattiva Il Mio Percorso',
          },
        }
      ),
    },
  },
  dormant_value_step2_email: {
    id: 'dormant_value_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_value_step2_email',
        {
          name: 'Dormant Value - Guided Return Plan A',
          description: 'Structured restart plan for dormant value users.',
          subject: 'Your guided return plan is ready inside Bullwaves.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Return Plan',
            title: 'Your guided return plan is ready',
            heroTitle: 'Restart with a clear sequence',
            heroSubtitle: 'A simple path helps dormant profiles come back with more consistency.',
            mainTitle: 'The next move works better when it is structured.',
            introLead:
              'This plan is built to reduce uncertainty and make your return easier to complete.',
            bodyOne:
              'Follow the next steps in platform to reconnect with your account in a more practical way.',
            bodyTwo: 'This plan improves:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'A cleaner restart sequence',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Less noise in the next actions',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'A stronger chance to stay active',
            bodyThree: 'Open your client area and review the guided return plan.',
            bodyFour: 'Support is available if you want help confirming the first step.',
            ctaLabel: 'View My Return Plan',
          },
        },
        {
          name: 'Dormant Value - Guided Return Plan B',
          description: 'Execution-led restart plan for dormant value traders.',
          subject: 'Your Bullwaves return path is still open and easier to follow now.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Return Plan',
            title: 'A clearer route back is active',
            heroTitle: 'Reduce uncertainty and restart well',
            heroSubtitle: 'The return path is now more practical and easier to use.',
            mainTitle: 'Your next actions should feel lighter, not heavier.',
            introLead:
              'This sequence helps you reconnect with a better sense of direction and less friction.',
            bodyOne: 'Use it to recover continuity and avoid a longer dormant cycle.',
            bodyTwo: 'It supports:',
            boxOneTitle: 'Simplicity',
            boxOneCopy: 'A lighter restart experience',
            boxTwoTitle: 'Consistency',
            boxTwoCopy: 'A steadier account rhythm',
            boxThreeTitle: 'Clarity',
            boxThreeCopy: 'Clear next actions in platform',
            bodyThree: 'Return through your client area and continue from the updated plan.',
            bodyFour: 'Support remains optional if you want one quick clarification.',
            ctaLabel: 'Continue My Return',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_value_step2_email',
        {
          name: 'Dormant Value - Guided Return Plan A IT',
          description: 'Piano di rientro strutturato per utenti dormant con valore.',
          subject: 'Il tuo piano guidato di ritorno e pronto dentro Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Return Plan',
            title: 'Il tuo piano guidato di ritorno e pronto',
            heroTitle: 'Riparti con una sequenza chiara',
            heroSubtitle:
              'Un percorso semplice aiuta i profili dormant a tornare con piu continuita.',
            mainTitle: 'Il prossimo passo funziona meglio quando e strutturato.',
            introLead:
              'Questo piano riduce incertezza e rende il tuo rientro piu facile da completare.',
            bodyOne:
              'Segui i prossimi step in piattaforma per riallacciare il rapporto con l account in modo piu pratico.',
            bodyTwo: 'Questo piano migliora:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Una sequenza di rientro piu pulita',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Meno rumore nelle prossime azioni',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Maggiore chance di restare attivo',
            bodyThree: 'Apri la tua area cliente e rivedi il piano guidato di ritorno.',
            bodyFour: 'Il supporto e disponibile se vuoi confermare il primo passo.',
            ctaLabel: 'Vedi Il Mio Piano Di Rientro',
          },
        },
        {
          name: 'Dormant Value - Guided Return Plan B IT',
          description: 'Variante execution-led per trader dormant value.',
          subject:
            'Il tuo percorso di ritorno Bullwaves e ancora aperto ed ora e piu facile da seguire.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Return Plan',
            title: 'E attiva una via di ritorno piu chiara',
            heroTitle: 'Riduci l incertezza e riparti bene',
            heroSubtitle: 'Il percorso di ritorno ora e piu pratico e piu semplice da usare.',
            mainTitle: 'Le prossime azioni devono sentirsi piu leggere, non piu pesanti.',
            introLead: 'Questa sequenza ti aiuta a ricollegarti con piu direzione e meno attrito.',
            bodyOne: 'Usala per recuperare continuita ed evitare un ciclo dormant piu lungo.',
            bodyTwo: 'Ti supporta su:',
            boxOneTitle: 'Semplicita',
            boxOneCopy: 'Una ripartenza piu leggera',
            boxTwoTitle: 'Coerenza',
            boxTwoCopy: 'Un ritmo account piu stabile',
            boxThreeTitle: 'Chiarezza',
            boxThreeCopy: 'Prossime azioni chiare in piattaforma',
            bodyThree: 'Torna dalla tua area cliente e continua dal piano aggiornato.',
            bodyFour: 'Il supporto resta opzionale se vuoi un chiarimento rapido.',
            ctaLabel: 'Continua Il Mio Ritorno',
          },
        }
      ),
    },
  },
  dormant_value_step3_email: {
    id: 'dormant_value_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_value_step3_email',
        {
          name: 'Dormant Value - Continuity Reinforcement A',
          description: 'Final reinforcement touch after first return signal.',
          subject: 'Keep your reactivation stable with one final Bullwaves step.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Continuity',
            title: 'Protect your return momentum',
            heroTitle: 'Do not let the restart cool again',
            heroSubtitle: 'A short final action can keep your account in a better active range.',
            mainTitle: 'The important part now is continuity.',
            introLead:
              'After the first positive signal, the best move is to keep the account path stable and simple.',
            bodyOne:
              'This reinforcement helps you avoid another stop and go cycle and supports better retention quality.',
            bodyTwo: 'Prioritize now:',
            boxOneTitle: 'Regularity',
            boxOneCopy: 'Keep the account active in sequence',
            boxTwoTitle: 'Attention',
            boxTwoCopy: 'Follow the next checkpoint clearly',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'Avoid cooling after comeback',
            bodyThree: 'Open the platform and confirm your next continuity step.',
            bodyFour: 'Support can help if you want one quick final orientation.',
            ctaLabel: 'Keep My Account Active',
          },
        },
        {
          name: 'Dormant Value - Continuity Reinforcement B',
          description: 'Stability-focused reminder for recovering dormant value profiles.',
          subject: 'Your Bullwaves return is improving. Now keep it consistent.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Continuity',
            title: 'Stabilize the path you restarted',
            heroTitle: 'A good return becomes valuable only when it lasts',
            heroSubtitle: 'This step helps you keep the progress from fading too early.',
            mainTitle: 'Use the current momentum to lock in continuity.',
            introLead:
              'A stable account pattern is easier to preserve when the next move is simple and visible.',
            bodyOne:
              'Continue now from platform and keep your recovery aligned with a cleaner cadence.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'Clear next actions',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Regular account activity',
            boxThreeTitle: 'Recovery quality',
            boxThreeCopy: 'A stronger return profile',
            bodyThree: 'Re-enter your client area and keep your account path moving.',
            bodyFour: 'Support remains available for one tactical check if useful.',
            ctaLabel: 'Continue My Recovery',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_value_step3_email',
        {
          name: 'Dormant Value - Continuity Reinforcement A IT',
          description: 'Touch finale di rinforzo dopo il primo segnale di ritorno.',
          subject: 'Mantieni stabile la tua riattivazione con un ultimo step Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Continuity',
            title: 'Proteggi lo slancio del tuo ritorno',
            heroTitle: 'Non lasciare che la ripartenza si raffreddi di nuovo',
            heroSubtitle:
              'Una breve azione finale puo mantenere il tuo account in una fascia attiva migliore.',
            mainTitle: 'Ora conta soprattutto la continuita.',
            introLead:
              'Dopo il primo segnale positivo, la mossa migliore e tenere il percorso account stabile e semplice.',
            bodyOne:
              'Questo rinforzo ti aiuta a evitare un altro ciclo stop and go e sostiene una retention migliore.',
            bodyTwo: 'Ora dai priorita a:',
            boxOneTitle: 'Regolarita',
            boxOneCopy: 'Mantieni l account attivo in sequenza',
            boxTwoTitle: 'Attenzione',
            boxTwoCopy: 'Segui chiaramente il prossimo checkpoint',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Evita il raffreddamento dopo il ritorno',
            bodyThree: 'Apri la piattaforma e conferma il prossimo step di continuita.',
            bodyFour: 'Il supporto puo aiutarti se vuoi un ultimo orientamento rapido.',
            ctaLabel: 'Mantieni Attivo Il Mio Account',
          },
        },
        {
          name: 'Dormant Value - Continuity Reinforcement B IT',
          description:
            'Promemoria focalizzato sulla stabilita per profili dormant value in recovery.',
          subject: 'Il tuo ritorno Bullwaves sta migliorando. Ora rendilo piu costante.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Continuity',
            title: 'Stabilizza il percorso che hai riavviato',
            heroTitle: 'Un buon ritorno diventa utile solo se dura',
            heroSubtitle: 'Questo step ti aiuta a non perdere troppo presto il progresso fatto.',
            mainTitle: 'Usa lo slancio attuale per fissare la continuita.',
            introLead:
              'Un pattern account stabile si preserva meglio quando il prossimo passo e semplice e visibile.',
            bodyOne:
              'Continua ora dalla piattaforma e mantieni il recovery allineato a una cadenza piu pulita.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Prossime azioni chiare',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Attivita account regolare',
            boxThreeTitle: 'Qualita recovery',
            boxThreeCopy: 'Un ritorno piu forte',
            bodyThree:
              'Rientra nella tua area cliente e mantieni il percorso account in movimento.',
            bodyFour: 'Il supporto resta disponibile per un check tattico se utile.',
            ctaLabel: 'Continua Il Mio Recovery',
          },
        }
      ),
    },
  },
  dormant_value_followup_retained_email: {
    id: 'dormant_value_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_value_followup_retained_email',
        {
          name: 'Dormant Value - Positive Follow-up A',
          description: 'Confirmation follow-up after dormant value recovery.',
          subject: 'Good news: your Bullwaves account is back on track.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your recovery is confirmed',
            heroTitle: 'You brought your account back into motion',
            heroSubtitle: 'The next goal is to keep this continuity active over time.',
            mainTitle: 'The return worked. Now keep the rhythm stable.',
            introLead: 'This follow-up confirms a positive outcome in your recovery path.',
            bodyOne:
              'Continue from your client area and use the current momentum to preserve regular activity.',
            bodyTwo: 'Keep focus on:',
            boxOneTitle: 'Consistency',
            boxOneCopy: 'Stay regular in your next actions',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'Follow the platform path step by step',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Keep the account out of dormancy',
            bodyThree: 'Open your client area and continue from the confirmed path.',
            bodyFour: 'Support remains available if you want one quick direction check.',
            ctaLabel: 'Continue My Active Path',
          },
        },
        {
          name: 'Dormant Value - Positive Follow-up B',
          description: 'Continuity message after successful dormant recovery.',
          subject: 'Your reactivation is confirmed. Keep your account moving.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Protect the return you created',
            heroTitle: 'A steady account is always easier to grow',
            heroSubtitle: 'The best next move is to keep your profile active and simple.',
            mainTitle: 'Use this positive phase to build continuity.',
            introLead:
              'You already recovered from dormancy. The next value comes from regular behavior.',
            bodyOne:
              'Keep the cadence clean, keep the actions visible, and continue from platform.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Rhythm',
            boxOneCopy: 'Regular activity with less friction',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Clear next decisions',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'Longer active continuity',
            bodyThree: 'Continue from your client area and maintain your current path.',
            bodyFour: 'Support is optional if you want one quick clarification.',
            ctaLabel: 'Keep My Momentum',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_value_followup_retained_email',
        {
          name: 'Dormant Value - Positive Follow-up A IT',
          description: 'Follow-up di conferma dopo il recupero del segmento dormant value.',
          subject: 'Buona notizia: il tuo account Bullwaves e tornato in linea.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo recupero e confermato',
            heroTitle: 'Hai rimesso in movimento il tuo account',
            heroSubtitle: 'Il prossimo obiettivo e mantenere attiva questa continuita nel tempo.',
            mainTitle: 'Il ritorno ha funzionato. Ora mantieni il ritmo stabile.',
            introLead: 'Questo follow-up conferma un esito positivo del tuo percorso di recovery.',
            bodyOne:
              'Continua dalla tua area cliente e usa lo slancio attuale per preservare attivita regolare.',
            bodyTwo: 'Mantieni focus su:',
            boxOneTitle: 'Coerenza',
            boxOneCopy: 'Resta regolare nelle prossime azioni',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Segui il percorso in piattaforma passo dopo passo',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Tieni l account fuori dalla dormancy',
            bodyThree: 'Apri la tua area cliente e continua dal percorso confermato.',
            bodyFour: 'Il supporto resta disponibile se vuoi un check rapido di direzione.',
            ctaLabel: 'Continua Il Mio Percorso Attivo',
          },
        },
        {
          name: 'Dormant Value - Positive Follow-up B IT',
          description: 'Messaggio di continuita dopo recovery riuscito.',
          subject: 'La tua riattivazione e confermata. Mantieni il tuo account in movimento.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Proteggi il ritorno che hai creato',
            heroTitle: 'Un account stabile e sempre piu facile da far crescere',
            heroSubtitle: 'La prossima mossa migliore e mantenere il profilo attivo e semplice.',
            mainTitle: 'Usa questa fase positiva per costruire continuita.',
            introLead:
              'Hai gia recuperato dalla dormancy. Il prossimo valore arriva dal comportamento regolare.',
            bodyOne: 'Mantieni la cadenza pulita, le azioni chiare e continua dalla piattaforma.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Ritmo',
            boxOneCopy: 'Attivita regolare con meno attrito',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Prossime decisioni chiare',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Continuita attiva piu lunga',
            bodyThree: 'Continua dalla tua area cliente e mantieni il percorso attuale.',
            bodyFour: 'Il supporto e opzionale se vuoi un chiarimento veloce.',
            ctaLabel: 'Mantieni Il Mio Slancio',
          },
        }
      ),
    },
  },
  dormant_value_followup_recovery_email: {
    id: 'dormant_value_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_value_followup_recovery_email',
        {
          name: 'Dormant Value - Recovery Follow-up A',
          description: 'Extended reactivation nurture for unresolved dormant value users.',
          subject: 'Your Bullwaves return path is still open.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'You can still restart from a lighter path',
            heroTitle: 'The account is still recoverable',
            heroSubtitle: 'A missed checkpoint does not close the relationship.',
            mainTitle: 'The best next step is a cleaner re-entry.',
            introLead: 'This follow-up keeps your return option active and easier to restart.',
            bodyOne:
              'Use the lighter path now to avoid a deeper dormant cycle and recover continuity gradually.',
            bodyTwo: 'This option helps with:',
            boxOneTitle: 'Re-entry',
            boxOneCopy: 'A simple way back into the account',
            boxTwoTitle: 'Confidence',
            boxTwoCopy: 'Restart without heavy pressure',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'Keep the return option alive',
            bodyThree: 'Open your client area and relaunch from the return option.',
            bodyFour: 'Support stays available if you want a guided restart.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Dormant Value - Recovery Follow-up B',
          description: 'Low-pressure recovery continuation for dormant value profiles.',
          subject: 'A simpler Bullwaves restart option is available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart with a more practical setup',
            heroTitle: 'Less pressure can produce a better return',
            heroSubtitle: 'A softer path often works better than forcing activity too soon.',
            mainTitle: 'The objective now is a practical return to continuity.',
            introLead:
              'This path is designed to keep the relationship open and reduce restart friction.',
            bodyOne:
              'Continue step by step from platform and recover the account rhythm more gradually.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Small actions',
            boxOneCopy: 'One clear step at a time',
            boxTwoTitle: 'Rhythm rebuild',
            boxTwoCopy: 'Recover activity progressively',
            boxThreeTitle: 'Return quality',
            boxThreeCopy: 'A more stable comeback path',
            bodyThree: 'Re-enter your client area and start from the lighter recovery route.',
            bodyFour: 'Support is available for a quick tactical check if useful.',
            ctaLabel: 'Restart My Path',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_value_followup_recovery_email',
        {
          name: 'Dormant Value - Recovery Follow-up A IT',
          description:
            'Nurture di riattivazione estesa per utenti dormant value non ancora recuperati.',
          subject: 'Il tuo percorso di ritorno Bullwaves e ancora aperto.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Puoi ancora ripartire da un percorso piu leggero',
            heroTitle: 'L account e ancora recuperabile',
            heroSubtitle: 'Un checkpoint mancato non chiude la relazione.',
            mainTitle: 'La prossima mossa migliore e un rientro piu pulito.',
            introLead:
              'Questo follow-up mantiene attiva l opzione di ritorno e la rende piu semplice da riavviare.',
            bodyOne:
              'Usa ora il percorso leggero per evitare un ciclo dormant piu profondo e recuperare continuita in modo graduale.',
            bodyTwo: 'Questa opzione ti aiuta con:',
            boxOneTitle: 'Rientro',
            boxOneCopy: 'Un modo semplice per tornare in account',
            boxTwoTitle: 'Fiducia',
            boxTwoCopy: 'Ripartenza senza pressione pesante',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Tenere viva l opzione di ritorno',
            bodyThree: 'Apri la tua area cliente e rilancia dal percorso di ritorno.',
            bodyFour: 'Il supporto resta disponibile se vuoi una ripartenza guidata.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Value - Recovery Follow-up B IT',
          description: 'Continuazione recovery a bassa pressione per profili dormant value.',
          subject:
            'Per il tuo account e disponibile una opzione Bullwaves di ripartenza piu semplice.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti con un setup piu pratico',
            heroTitle: 'Meno pressione puo produrre un ritorno migliore',
            heroSubtitle:
              'Un percorso piu morbido spesso funziona meglio che forzare subito l attivita.',
            mainTitle: 'L obiettivo ora e un ritorno pratico alla continuita.',
            introLead:
              'Questo percorso e pensato per tenere aperta la relazione e ridurre l attrito di ripartenza.',
            bodyOne:
              'Continua passo dopo passo dalla piattaforma e recupera il ritmo account in modo graduale.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Piccole azioni',
            boxOneCopy: 'Un passo chiaro alla volta',
            boxTwoTitle: 'Ricostruzione ritmo',
            boxTwoCopy: 'Recupera attivita progressiva',
            boxThreeTitle: 'Qualita ritorno',
            boxThreeCopy: 'Un comeback piu stabile',
            bodyThree: 'Rientra dalla tua area cliente e avvia il recovery piu leggero.',
            bodyFour: 'Il supporto e disponibile per un check tattico rapido se utile.',
            ctaLabel: 'Riattiva Il Mio Percorso',
          },
        }
      ),
    },
  },
  dormant_mid_step1_email: {
    id: 'dormant_mid_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_mid_step1_email',
        {
          name: 'Dormant Mid - Winback Touch A',
          description: 'Practical winback opener for dormant mid-value users.',
          subject: 'A stronger Bullwaves return path is available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A practical winback path is open',
            heroTitle: 'Your account can return with a stronger setup',
            heroSubtitle:
              'This touch is designed for mid-value profiles that should not stay dormant.',
            mainTitle: 'The objective is a useful comeback, not a generic reminder.',
            introLead:
              'Your profile already showed enough value to justify a more focused return path.',
            bodyOne:
              'Use this phase to reopen the relationship with clearer priorities and a more credible next step.',
            bodyTwo: 'This winback gives you:',
            boxOneTitle: 'Relevance',
            boxOneCopy: 'A return path suited to your profile',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'A clearer sequence to follow',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'A better chance to restore rhythm',
            bodyThree: 'Open your client area and review the current return path.',
            bodyFour: 'Support is available if one detail needs a quick confirmation.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Dormant Mid - Winback Touch B',
          description: 'Slightly stronger reactivation opener for mid dormant profiles.',
          subject: 'Your Bullwaves profile is ready for a more structured comeback.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Come back with more direction',
            heroTitle: 'A better return starts from a better plan',
            heroSubtitle: 'This path helps you restart with more clarity and less friction.',
            mainTitle: 'The right next step should feel practical and timely.',
            introLead:
              'Instead of waiting longer, you can now return through a sequence built for your profile level.',
            bodyOne:
              'Use the platform as the main point of re-entry and rebuild a steadier account cadence.',
            bodyTwo: 'Prioritize:',
            boxOneTitle: 'Timing',
            boxOneCopy: 'Re-enter while the path is open',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'Follow visible next actions',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Restore account continuity faster',
            bodyThree: 'Re-enter from your client area and begin the comeback route.',
            bodyFour: 'Support remains optional if you want extra context.',
            ctaLabel: 'Start My Return Path',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_mid_step1_email',
        {
          name: 'Dormant Mid - Winback Touch A IT',
          description: 'Apertura winback pratica per utenti dormant mid-value.',
          subject: 'Per il tuo account e disponibile un percorso Bullwaves di ritorno piu forte.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E aperto un percorso winback pratico',
            heroTitle: 'Il tuo account puo tornare con un setup piu forte',
            heroSubtitle:
              'Questo touch e pensato per profili mid-value che non devono restare dormant.',
            mainTitle: 'L obiettivo e un comeback utile, non un promemoria generico.',
            introLead:
              'Il tuo profilo ha gia mostrato abbastanza valore da giustificare un percorso di ritorno piu focalizzato.',
            bodyOne:
              'Usa questa fase per riaprire la relazione con priorita piu chiare e un prossimo passo piu credibile.',
            bodyTwo: 'Questo winback ti offre:',
            boxOneTitle: 'Rilevanza',
            boxOneCopy: 'Un percorso adatto al tuo profilo',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Una sequenza piu chiara da seguire',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Maggiore chance di ripristinare ritmo',
            bodyThree: 'Apri la tua area cliente e rivedi il percorso attuale di ritorno.',
            bodyFour: 'Il supporto e disponibile se un dettaglio richiede conferma rapida.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Mid - Winback Touch B IT',
          description: 'Variante di riattivazione leggermente piu forte per profili mid dormant.',
          subject: 'Il tuo profilo Bullwaves e pronto per un comeback piu strutturato.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Torna con piu direzione',
            heroTitle: 'Un ritorno migliore parte da un piano migliore',
            heroSubtitle: 'Questo percorso ti aiuta a ripartire con piu chiarezza e meno attrito.',
            mainTitle: 'Il prossimo passo giusto deve essere pratico e tempestivo.',
            introLead:
              'Invece di aspettare ancora, puoi rientrare ora da una sequenza costruita per il tuo livello di profilo.',
            bodyOne:
              'Usa la piattaforma come punto principale di rientro e ricostruisci una cadenza account piu stabile.',
            bodyTwo: 'Dai priorita a:',
            boxOneTitle: 'Timing',
            boxOneCopy: 'Rientra mentre il percorso e aperto',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Segui azioni successive visibili',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Recupera continuita piu velocemente',
            bodyThree: 'Rientra dalla tua area cliente e avvia il percorso di comeback.',
            bodyFour: 'Il supporto resta opzionale se vuoi piu contesto.',
            ctaLabel: 'Avvia Il Mio Ritorno',
          },
        }
      ),
    },
  },
  dormant_mid_step2_email: {
    id: 'dormant_mid_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_mid_step2_email',
        {
          name: 'Dormant Mid - Relaunch Value Path A',
          description: 'Structured relaunch sequence for mid dormant users.',
          subject: 'Your Bullwaves relaunch path is ready for review.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Relaunch',
            title: 'Your relaunch path is now active',
            heroTitle: 'Come back through a clearer account sequence',
            heroSubtitle: 'A stronger mid-value recovery needs more direction and less confusion.',
            mainTitle: 'This step is about rebuilding useful continuity.',
            introLead: 'The relaunch path helps you restart with a cleaner operating framework.',
            bodyOne:
              'Follow the plan inside your client area to restore a more stable and credible account rhythm.',
            bodyTwo: 'This relaunch helps you with:',
            boxOneTitle: 'Direction',
            boxOneCopy: 'A more ordered next phase',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Clearer actions to restart',
            boxThreeTitle: 'Progress',
            boxThreeCopy: 'A better chance to recover value',
            bodyThree: 'Open your client area and review the relaunch path prepared for you.',
            bodyFour: 'Support can help if you want a quick confirmation of the first step.',
            ctaLabel: 'View My Relaunch Path',
          },
        },
        {
          name: 'Dormant Mid - Relaunch Value Path B',
          description: 'Execution-led relaunch plan for mid-value dormant accounts.',
          subject: 'A clearer Bullwaves recovery plan is now active for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Relaunch',
            title: 'A clearer recovery route is ready',
            heroTitle: 'Restart with more confidence and less guesswork',
            heroSubtitle: 'Your next steps are now easier to read and easier to follow.',
            mainTitle: 'A good recovery starts from a simpler structure.',
            introLead:
              'This phase is designed to bring your account back into motion without overcomplicating the return.',
            bodyOne:
              'Use the updated sequence to reduce friction and recover mid-value continuity more effectively.',
            bodyTwo: 'It improves:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'See what matters now',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Recover regular activity',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'Avoid another cooling cycle',
            bodyThree: 'Continue from your client area and review the current recovery plan.',
            bodyFour: 'Support remains there if one practical point needs context.',
            ctaLabel: 'Continue My Recovery',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_mid_step2_email',
        {
          name: 'Dormant Mid - Relaunch Value Path A IT',
          description: 'Sequenza di rilancio strutturata per utenti dormant mid.',
          subject: 'Il tuo percorso Bullwaves di rilancio e pronto da rivedere.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Relaunch',
            title: 'Il tuo percorso di rilancio e ora attivo',
            heroTitle: 'Torna attraverso una sequenza account piu chiara',
            heroSubtitle:
              'Un recovery mid-value piu forte ha bisogno di piu direzione e meno confusione.',
            mainTitle: 'Questo step serve a ricostruire continuita utile.',
            introLead:
              'Il percorso di rilancio ti aiuta a ripartire con un framework operativo piu pulito.',
            bodyOne:
              'Segui il piano nella tua area cliente per ripristinare un ritmo account piu stabile e credibile.',
            bodyTwo: 'Questo rilancio ti aiuta con:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Una prossima fase piu ordinata',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Azioni piu chiare per ripartire',
            boxThreeTitle: 'Progresso',
            boxThreeCopy: 'Maggiore chance di recuperare valore',
            bodyThree:
              'Apri la tua area cliente e rivedi il percorso di rilancio preparato per te.',
            bodyFour: 'Il supporto puo aiutarti se vuoi confermare rapidamente il primo passo.',
            ctaLabel: 'Vedi Il Mio Percorso Di Rilancio',
          },
        },
        {
          name: 'Dormant Mid - Relaunch Value Path B IT',
          description: 'Piano di rilancio execution-led per account mid-value dormant.',
          subject: 'Per il tuo account e ora attivo un piano Bullwaves di recovery piu chiaro.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Relaunch',
            title: 'E pronto un percorso recovery piu chiaro',
            heroTitle: 'Riparti con piu fiducia e meno incertezza',
            heroSubtitle: 'I tuoi prossimi step ora sono piu facili da leggere e da seguire.',
            mainTitle: 'Un buon recovery parte da una struttura piu semplice.',
            introLead:
              'Questa fase e pensata per rimettere in movimento l account senza complicare troppo il ritorno.',
            bodyOne:
              'Usa la sequenza aggiornata per ridurre attrito e recuperare continuita mid-value in modo piu efficace.',
            bodyTwo: 'Migliora:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Vedi cosa conta adesso',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Recupera attivita regolare',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Evita un nuovo ciclo di raffreddamento',
            bodyThree: 'Continua dalla tua area cliente e rivedi il piano recovery attuale.',
            bodyFour: 'Il supporto resta presente se un punto pratico richiede contesto.',
            ctaLabel: 'Continua Il Mio Recovery',
          },
        }
      ),
    },
  },
  dormant_mid_step3_email: {
    id: 'dormant_mid_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_mid_step3_email',
        {
          name: 'Dormant Mid - Manager Continuity Touch A',
          description: 'Continuity touch to stabilize the recovery of mid dormant profiles.',
          subject: 'Keep your Bullwaves recovery stable with one more step.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Continuity',
            title: 'Stabilize your recovery now',
            heroTitle: 'A positive return needs a stable follow-through',
            heroSubtitle: 'This phase keeps your progress from cooling again too early.',
            mainTitle: 'The important part now is making the comeback last.',
            introLead:
              'After initial recovery, a cleaner continuity step can protect the result and keep the path active.',
            bodyOne:
              'Use this moment to confirm the next action and keep your account behavior more regular.',
            bodyTwo: 'Now prioritize:',
            boxOneTitle: 'Regularity',
            boxOneCopy: 'Stay active with a cleaner cadence',
            boxTwoTitle: 'Visibility',
            boxTwoCopy: 'Know the next checkpoint',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'Reduce the risk of cooling again',
            bodyThree: 'Open your client area and confirm your next continuity action.',
            bodyFour: 'Support remains available if you want a quick account check.',
            ctaLabel: 'Keep My Recovery Active',
          },
        },
        {
          name: 'Dormant Mid - Manager Continuity Touch B',
          description: 'Follow-through reminder for dormant mid users coming back.',
          subject: 'Your Bullwaves return can still become a stable active path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Continuity',
            title: 'Turn recovery into stable continuity',
            heroTitle: 'The strongest comeback is the one that stays regular',
            heroSubtitle: 'A final alignment now can protect your recent return signals.',
            mainTitle: 'Use the current momentum to avoid a second slowdown.',
            introLead:
              'This touch helps you convert good intent into a more durable account pattern.',
            bodyOne:
              'Continue from platform and keep your return sequence aligned with a practical routine.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'One visible next action',
            boxTwoTitle: 'Cadence',
            boxTwoCopy: 'Regular activity behavior',
            boxThreeTitle: 'Retention quality',
            boxThreeCopy: 'Longer recovery durability',
            bodyThree: 'Re-enter your client area and keep your account path consistent.',
            bodyFour: 'Support is there if you want a tactical clarification.',
            ctaLabel: 'Protect My Return',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_mid_step3_email',
        {
          name: 'Dormant Mid - Manager Continuity Touch A IT',
          description: 'Touch di continuita per stabilizzare il recovery dei profili dormant mid.',
          subject: 'Mantieni stabile il tuo recovery Bullwaves con un altro step.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Continuity',
            title: 'Stabilizza ora il tuo recovery',
            heroTitle: 'Un ritorno positivo ha bisogno di continuita stabile',
            heroSubtitle: 'Questa fase evita che il progresso si raffreddi di nuovo troppo presto.',
            mainTitle: 'Ora conta far durare il comeback.',
            introLead:
              'Dopo il primo recovery, uno step di continuita piu pulito puo proteggere il risultato e tenere attivo il percorso.',
            bodyOne:
              'Usa questo momento per confermare la prossima azione e rendere il comportamento account piu regolare.',
            bodyTwo: 'Ora dai priorita a:',
            boxOneTitle: 'Regolarita',
            boxOneCopy: 'Resta attivo con una cadenza piu pulita',
            boxTwoTitle: 'Visibilita',
            boxTwoCopy: 'Conosci il prossimo checkpoint',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Riduci il rischio di nuovo raffreddamento',
            bodyThree: 'Apri la tua area cliente e conferma la prossima azione di continuita.',
            bodyFour: 'Il supporto resta disponibile se vuoi un check rapido account.',
            ctaLabel: 'Mantieni Attivo Il Mio Recovery',
          },
        },
        {
          name: 'Dormant Mid - Manager Continuity Touch B IT',
          description: 'Promemoria di follow-through per utenti dormant mid in ritorno.',
          subject: 'Il tuo ritorno Bullwaves puo ancora diventare un percorso attivo stabile.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Continuity',
            title: 'Trasforma il recovery in continuita stabile',
            heroTitle: 'Il comeback piu forte e quello che resta regolare',
            heroSubtitle: 'Un allineamento finale ora puo proteggere i segnali recenti di ritorno.',
            mainTitle: 'Usa lo slancio attuale per evitare un secondo rallentamento.',
            introLead:
              'Questo touch ti aiuta a convertire il buon intent in un pattern account piu duraturo.',
            bodyOne:
              'Continua dalla piattaforma e mantieni la sequenza di ritorno allineata a una routine pratica.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Un prossimo passo visibile',
            boxTwoTitle: 'Cadenza',
            boxTwoCopy: 'Comportamento attivo regolare',
            boxThreeTitle: 'Qualita retention',
            boxThreeCopy: 'Recovery piu duraturo',
            bodyThree: 'Rientra nella tua area cliente e mantieni coerente il percorso account.',
            bodyFour: 'Il supporto e presente se vuoi un chiarimento tattico.',
            ctaLabel: 'Proteggi Il Mio Ritorno',
          },
        }
      ),
    },
  },
  dormant_mid_followup_retained_email: {
    id: 'dormant_mid_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_mid_followup_retained_email',
        {
          name: 'Dormant Mid - Positive Follow-up A',
          description: 'Confirmation touch after mid dormant recovery succeeds.',
          subject: 'Your Bullwaves recovery is confirmed and back on track.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your return is confirmed',
            heroTitle: 'You moved back into a healthier account range',
            heroSubtitle: 'Now the objective is to keep the profile active and consistent.',
            mainTitle: 'Use this positive phase to protect the result.',
            introLead:
              'A recovered mid-value profile has the best chance to hold when continuity stays clear and practical.',
            bodyOne: 'Continue from the platform and keep the next steps simple and regular.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Consistency',
            boxOneCopy: 'Keep the rhythm active',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'Follow visible next steps',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'Avoid a fresh cooldown',
            bodyThree: 'Open your client area and continue from the confirmed route.',
            bodyFour: 'Support remains available if you want one quick check.',
            ctaLabel: 'Continue My Active Route',
          },
        },
        {
          name: 'Dormant Mid - Positive Follow-up B',
          description: 'Continuity follow-up after a successful mid-value comeback.',
          subject: 'Good result: your Bullwaves account is moving again.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Keep your account in motion',
            heroTitle: 'The comeback worked. Now make it durable.',
            heroSubtitle: 'A regular next phase helps preserve the value you recovered.',
            mainTitle: 'The best growth now comes from continuity.',
            introLead:
              'You already restarted the account. The next step is protecting the new rhythm.',
            bodyOne:
              'Keep the account path simple and continue from your client area without breaking the cadence.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Rhythm',
            boxOneCopy: 'Regular account activity',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Clear next actions',
            boxThreeTitle: 'Progress',
            boxThreeCopy: 'Longer active continuity',
            bodyThree: 'Continue from your client area and keep this positive path active.',
            bodyFour: 'Support is optional if you want a fast clarification.',
            ctaLabel: 'Keep My Path Active',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_mid_followup_retained_email',
        {
          name: 'Dormant Mid - Positive Follow-up A IT',
          description: 'Touch di conferma dopo recovery riuscito del dormant mid.',
          subject: 'Il tuo recovery Bullwaves e confermato ed e tornato in linea.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo ritorno e confermato',
            heroTitle: 'Sei rientrato in una fascia account piu sana',
            heroSubtitle: 'Ora l obiettivo e mantenere il profilo attivo e coerente.',
            mainTitle: 'Usa questa fase positiva per proteggere il risultato.',
            introLead:
              'Un profilo mid-value recuperato ha piu chance di tenere quando la continuita resta chiara e pratica.',
            bodyOne: 'Continua dalla piattaforma e mantieni i prossimi step semplici e regolari.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Coerenza',
            boxOneCopy: 'Mantieni attivo il ritmo',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Segui i prossimi step visibili',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Evita un nuovo raffreddamento',
            bodyThree: 'Apri la tua area cliente e continua dal percorso confermato.',
            bodyFour: 'Il supporto resta disponibile se vuoi un check rapido.',
            ctaLabel: 'Continua Il Mio Percorso Attivo',
          },
        },
        {
          name: 'Dormant Mid - Positive Follow-up B IT',
          description: 'Follow-up di continuita dopo comeback mid-value riuscito.',
          subject: 'Buon risultato: il tuo account Bullwaves si e rimesso in movimento.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Mantieni il tuo account in movimento',
            heroTitle: 'Il comeback ha funzionato. Ora rendilo duraturo.',
            heroSubtitle: 'Una prossima fase regolare aiuta a preservare il valore recuperato.',
            mainTitle: 'La crescita migliore ora arriva dalla continuita.',
            introLead:
              'Hai gia riavviato l account. Il prossimo passo e proteggere il nuovo ritmo.',
            bodyOne:
              'Mantieni semplice il percorso account e continua dalla tua area cliente senza spezzare la cadenza.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Ritmo',
            boxOneCopy: 'Attivita account regolare',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Prossime azioni chiare',
            boxThreeTitle: 'Progresso',
            boxThreeCopy: 'Continuita attiva piu lunga',
            bodyThree:
              'Continua dalla tua area cliente e mantieni attivo questo percorso positivo.',
            bodyFour: 'Il supporto e opzionale se vuoi un chiarimento veloce.',
            ctaLabel: 'Mantieni Attivo Il Mio Percorso',
          },
        }
      ),
    },
  },
  dormant_mid_followup_recovery_email: {
    id: 'dormant_mid_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_mid_followup_recovery_email',
        {
          name: 'Dormant Mid - Recovery Follow-up A',
          description: 'Extended winback when mid dormant users are still unresolved.',
          subject: 'Your Bullwaves comeback is still possible from a cleaner path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A return route is still open',
            heroTitle: 'You can still recover the account from here',
            heroSubtitle:
              'A softer, clearer route is available if the first attempt did not convert.',
            mainTitle: 'The next goal is a practical re-entry, not a forced push.',
            introLead:
              'This message keeps the return viable and reduces pressure on the next action.',
            bodyOne:
              'Use the lighter route to reactivate the account gradually and preserve relationship value.',
            bodyTwo: 'This option helps with:',
            boxOneTitle: 'Restart clarity',
            boxOneCopy: 'One simpler way back',
            boxTwoTitle: 'Confidence',
            boxTwoCopy: 'Less pressure on the next move',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Keep the comeback option open',
            bodyThree: 'Open your client area and restart from the current recovery option.',
            bodyFour: 'Support remains available if you want guided help.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Dormant Mid - Recovery Follow-up B',
          description: 'Low-pressure extended winback for mid dormant accounts.',
          subject: 'A lighter Bullwaves re-entry path is available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart with a lighter recovery setup',
            heroTitle: 'Reduce friction and come back step by step',
            heroSubtitle: 'This route is designed to make the return easier to complete.',
            mainTitle: 'The important thing now is to resume continuity cleanly.',
            introLead:
              'A simpler recovery path often works better for mid dormant profiles that need clearer pacing.',
            bodyOne: 'Continue from platform and rebuild your account rhythm one action at a time.',
            bodyTwo: 'Prioritize:',
            boxOneTitle: 'Simple actions',
            boxOneCopy: 'One visible step now',
            boxTwoTitle: 'Rhythm rebuild',
            boxTwoCopy: 'Recover regular activity slowly',
            boxThreeTitle: 'Return viability',
            boxThreeCopy: 'Preserve the comeback opportunity',
            bodyThree: 'Re-enter your client area and keep the recovery path moving.',
            bodyFour: 'Support is optional if you want one quick clarification.',
            ctaLabel: 'Restart My Recovery',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_mid_followup_recovery_email',
        {
          name: 'Dormant Mid - Recovery Follow-up A IT',
          description: 'Winback esteso quando gli utenti dormant mid non sono ancora risolti.',
          subject: 'Il tuo comeback Bullwaves e ancora possibile da un percorso piu pulito.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E ancora aperta una via di ritorno',
            heroTitle: 'Puoi ancora recuperare l account da qui',
            heroSubtitle:
              'Se il primo tentativo non ha convertito, c e un percorso piu morbido e piu chiaro.',
            mainTitle: 'Il prossimo obiettivo e un rientro pratico, non una spinta forzata.',
            introLead:
              'Questo messaggio mantiene possibile il ritorno e riduce la pressione sulla prossima azione.',
            bodyOne:
              'Usa il percorso leggero per riattivare gradualmente l account e preservare il valore della relazione.',
            bodyTwo: 'Questa opzione ti aiuta con:',
            boxOneTitle: 'Chiarezza ripartenza',
            boxOneCopy: 'Una via di rientro piu semplice',
            boxTwoTitle: 'Fiducia',
            boxTwoCopy: 'Meno pressione sul prossimo passo',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Mantieni aperta l opportunita di comeback',
            bodyThree: 'Apri la tua area cliente e riparti dalla recovery attuale.',
            bodyFour: 'Il supporto resta disponibile se vuoi un aiuto guidato.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Mid - Recovery Follow-up B IT',
          description: 'Winback esteso a bassa pressione per account dormant mid.',
          subject: 'Per il tuo account e disponibile un percorso Bullwaves di rientro piu leggero.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti con un setup recovery piu leggero',
            heroTitle: 'Riduci attrito e torna passo dopo passo',
            heroSubtitle:
              'Questo percorso e pensato per rendere il ritorno piu facile da completare.',
            mainTitle: 'Ora conta riprendere la continuita in modo pulito.',
            introLead:
              'Un percorso recovery piu semplice spesso funziona meglio per profili dormant mid che hanno bisogno di cadenza piu chiara.',
            bodyOne:
              'Continua dalla piattaforma e ricostruisci il ritmo account un azione alla volta.',
            bodyTwo: 'Dai priorita a:',
            boxOneTitle: 'Azioni semplici',
            boxOneCopy: 'Un passo visibile ora',
            boxTwoTitle: 'Ricostruzione ritmo',
            boxTwoCopy: 'Recupera attivita regolare lentamente',
            boxThreeTitle: 'Ritorno possibile',
            boxThreeCopy: 'Preserva l opportunita di comeback',
            bodyThree: 'Rientra nella tua area cliente e mantieni vivo il percorso recovery.',
            bodyFour: 'Il supporto e opzionale se vuoi un chiarimento rapido.',
            ctaLabel: 'Riavvia Il Mio Recovery',
          },
        }
      ),
    },
  },
  dormant_low_step1_email: {
    id: 'dormant_low_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_low_step1_email',
        {
          name: 'Dormant Low - Soft Re-entry Touch A',
          description: 'Gentle re-entry opener for low-value dormant accounts.',
          subject: 'A simple Bullwaves restart path is available whenever you are ready.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A soft return path is open',
            heroTitle: 'Restart without pressure',
            heroSubtitle: 'This touch is meant to make the next step easier, not heavier.',
            mainTitle: 'A lighter comeback can still bring the account back to life.',
            introLead:
              'If your activity slowed down, the smartest move may be to simplify the restart.',
            bodyOne:
              'Use this path to re-enter platform and rebuild a small but steady account rhythm.',
            bodyTwo: 'This helps you with:',
            boxOneTitle: 'Simplicity',
            boxOneCopy: 'An easier way back',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'One clear action to take now',
            boxThreeTitle: 'Momentum',
            boxThreeCopy: 'A gentler restart of activity',
            bodyThree: 'Open your client area and continue from the simple return path.',
            bodyFour: 'Support stays optional if you want one quick question answered.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Dormant Low - Soft Re-entry Touch B',
          description: 'Low-pressure restart for dormant low users.',
          subject: 'Your Bullwaves account can restart from a lighter step.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A lighter way back is ready',
            heroTitle: 'Come back with one simple move',
            heroSubtitle: 'A smaller step now can be better than a bigger push later.',
            mainTitle: 'The important part is resuming the account path.',
            introLead:
              'This message is designed to reduce friction and keep the relationship open.',
            bodyOne:
              'Use the platform to restart gradually and avoid a longer period of inactivity.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Ease',
            boxOneCopy: 'A softer way to re-enter',
            boxTwoTitle: 'Direction',
            boxTwoCopy: 'A visible next step',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'A more regular account rhythm',
            bodyThree: 'Re-enter your client area and keep the restart simple.',
            bodyFour: 'Support is there only if you want extra clarity.',
            ctaLabel: 'Restart My Account',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_low_step1_email',
        {
          name: 'Dormant Low - Soft Re-entry Touch A IT',
          description: 'Apertura gentile di rientro per account dormant low-value.',
          subject: 'E disponibile un percorso Bullwaves di ripartenza semplice quando vuoi.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E aperto un percorso soft di ritorno',
            heroTitle: 'Riparti senza pressione',
            heroSubtitle:
              'Questo touch serve a rendere il prossimo passo piu facile, non piu pesante.',
            mainTitle: 'Un comeback piu leggero puo comunque rimettere in vita l account.',
            introLead:
              'Se l attivita si e rallentata, la mossa piu intelligente puo essere semplificare la ripartenza.',
            bodyOne:
              'Usa questo percorso per rientrare in piattaforma e ricostruire un ritmo account piccolo ma stabile.',
            bodyTwo: 'Ti aiuta con:',
            boxOneTitle: 'Semplicita',
            boxOneCopy: 'Un modo piu facile di tornare',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Un azione chiara da fare ora',
            boxThreeTitle: 'Slancio',
            boxThreeCopy: 'Una ripartenza piu dolce dell attivita',
            bodyThree: 'Apri la tua area cliente e continua dal percorso semplice di ritorno.',
            bodyFour: 'Il supporto resta opzionale se vuoi una domanda veloce.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Low - Soft Re-entry Touch B IT',
          description: 'Ripartenza a bassa pressione per utenti dormant low.',
          subject: 'Il tuo account Bullwaves puo ripartire da un passo piu leggero.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E pronto un modo piu leggero per tornare',
            heroTitle: 'Rientra con una mossa semplice',
            heroSubtitle:
              'Un passo piu piccolo ora puo essere meglio di una spinta maggiore piu avanti.',
            mainTitle: 'La parte importante e riprendere il percorso account.',
            introLead:
              'Questo messaggio e pensato per ridurre attrito e tenere aperta la relazione.',
            bodyOne:
              'Usa la piattaforma per ripartire gradualmente ed evitare un periodo piu lungo di inattivita.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Facilita',
            boxOneCopy: 'Un rientro piu morbido',
            boxTwoTitle: 'Direzione',
            boxTwoCopy: 'Un prossimo passo visibile',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Un ritmo account piu regolare',
            bodyThree: 'Rientra nella tua area cliente e mantieni la ripartenza semplice.',
            bodyFour: 'Il supporto c e solo se vuoi piu chiarezza.',
            ctaLabel: 'Riattiva Il Mio Account',
          },
        }
      ),
    },
  },
  dormant_low_step2_email: {
    id: 'dormant_low_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_low_step2_email',
        {
          name: 'Dormant Low - Simple Restart Path A',
          description: 'Simple restart plan for low dormant accounts.',
          subject: 'Your simple Bullwaves restart path is ready.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Restart',
            title: 'Your simple restart path is active',
            heroTitle: 'A cleaner route makes returning easier',
            heroSubtitle: 'This plan is built to keep the account moving again with less friction.',
            mainTitle: 'The next step should be simple enough to complete now.',
            introLead:
              'A low-pressure return works best when the next action is clear and immediate.',
            bodyOne:
              'Use the path in platform to restart your account in a more practical and visible way.',
            bodyTwo: 'This restart helps with:',
            boxOneTitle: 'Ease',
            boxOneCopy: 'A lighter sequence to follow',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'Know what to do next',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Bring the account back gradually',
            bodyThree: 'Open your client area and review the simple restart plan.',
            bodyFour: 'Support is available if you want one quick confirmation.',
            ctaLabel: 'View My Restart Plan',
          },
        },
        {
          name: 'Dormant Low - Simple Restart Path B',
          description: 'Practical low-friction route to resume activity.',
          subject: 'A lighter Bullwaves recovery plan is now available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Restart',
            title: 'A lighter plan to resume activity',
            heroTitle: 'Restart step by step from a clearer base',
            heroSubtitle: 'Your return does not need complexity. It needs a visible next step.',
            mainTitle: 'Use the platform to make the restart more manageable.',
            introLead: 'This path is designed to keep pressure low and completion easier.',
            bodyOne:
              'Continue through your client area and rebuild your account rhythm more gradually.',
            bodyTwo: 'It helps you with:',
            boxOneTitle: 'Low friction',
            boxOneCopy: 'A simpler way back',
            boxTwoTitle: 'Progress',
            boxTwoCopy: 'Small but steady recovery',
            boxThreeTitle: 'Direction',
            boxThreeCopy: 'Clear next actions',
            bodyThree: 'Continue from your client area and keep the restart path active.',
            bodyFour: 'Support remains optional if you want extra help.',
            ctaLabel: 'Continue My Restart',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_low_step2_email',
        {
          name: 'Dormant Low - Simple Restart Path A IT',
          description: 'Piano di ripartenza semplice per account low dormant.',
          subject: 'Il tuo percorso semplice di ripartenza Bullwaves e pronto.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Restart',
            title: 'Il tuo percorso semplice di ripartenza e attivo',
            heroTitle: 'Una via piu pulita rende il ritorno piu facile',
            heroSubtitle:
              'Questo piano e pensato per rimettere in moto l account con meno attrito.',
            mainTitle: 'Il prossimo passo deve essere abbastanza semplice da completare ora.',
            introLead:
              'Un ritorno a bassa pressione funziona meglio quando la prossima azione e chiara e immediata.',
            bodyOne:
              'Usa il percorso in piattaforma per riattivare l account in modo piu pratico e visibile.',
            bodyTwo: 'Questa ripartenza ti aiuta con:',
            boxOneTitle: 'Facilita',
            boxOneCopy: 'Una sequenza piu leggera da seguire',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Sapere cosa fare dopo',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Rimettere in moto l account gradualmente',
            bodyThree: 'Apri la tua area cliente e rivedi il piano semplice di ripartenza.',
            bodyFour: 'Il supporto e disponibile se vuoi una conferma veloce.',
            ctaLabel: 'Vedi Il Mio Piano Di Ripartenza',
          },
        },
        {
          name: 'Dormant Low - Simple Restart Path B IT',
          description: 'Percorso pratico a basso attrito per riprendere attivita.',
          subject:
            'Per il tuo account e ora disponibile un piano Bullwaves di recovery piu leggero.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Restart',
            title: 'Un piano piu leggero per riprendere attivita',
            heroTitle: 'Riparti passo dopo passo da una base piu chiara',
            heroSubtitle:
              'Il tuo ritorno non ha bisogno di complessita. Ha bisogno di un prossimo passo visibile.',
            mainTitle: 'Usa la piattaforma per rendere la ripartenza piu gestibile.',
            introLead:
              'Questo percorso e pensato per tenere bassa la pressione e piu facile il completamento.',
            bodyOne:
              'Continua dalla tua area cliente e ricostruisci il ritmo account in modo graduale.',
            bodyTwo: 'Ti aiuta con:',
            boxOneTitle: 'Basso attrito',
            boxOneCopy: 'Un modo piu semplice per tornare',
            boxTwoTitle: 'Progresso',
            boxTwoCopy: 'Recovery piccolo ma stabile',
            boxThreeTitle: 'Direzione',
            boxThreeCopy: 'Prossime azioni chiare',
            bodyThree:
              'Continua dalla tua area cliente e mantieni attivo il percorso di ripartenza.',
            bodyFour: 'Il supporto resta opzionale se vuoi un aiuto extra.',
            ctaLabel: 'Continua La Mia Ripartenza',
          },
        }
      ),
    },
  },
  dormant_low_step3_email: {
    id: 'dormant_low_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_low_step3_email',
        {
          name: 'Dormant Low - Light Continuity Nurture A',
          description: 'Gentle reminder to keep low dormant users from cooling again.',
          subject: 'Keep your Bullwaves restart active with one light next step.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Continuity',
            title: 'Keep the return going',
            heroTitle: 'A light continuation can make the restart last',
            heroSubtitle:
              'This step keeps the account from slipping back into dormancy too quickly.',
            mainTitle: 'The next move should be simple and regular.',
            introLead: 'A gentle cadence often works best for low dormant profiles coming back.',
            bodyOne:
              'Use this touch to keep the account warm and maintain a clearer continuity path.',
            bodyTwo: 'Now focus on:',
            boxOneTitle: 'Regularity',
            boxOneCopy: 'Stay present without pressure',
            boxTwoTitle: 'Visibility',
            boxTwoCopy: 'Know the next action',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'Avoid falling dormant again',
            bodyThree: 'Open your client area and keep the restart active.',
            bodyFour: 'Support is there only if you need a quick clarification.',
            ctaLabel: 'Keep My Restart Active',
          },
        },
        {
          name: 'Dormant Low - Light Continuity Nurture B',
          description: 'Low-pressure continuity reminder after a first restart signal.',
          subject: 'Your Bullwaves account is moving again. Keep the next step simple.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves Continuity',
            title: 'Make the restart more stable',
            heroTitle: 'The account only needs one more clear move',
            heroSubtitle: 'A simple continuation can protect the progress already made.',
            mainTitle: 'Now focus on keeping the path open and active.',
            introLead:
              'The best recovery for low-value dormant profiles is often the easiest one to maintain.',
            bodyOne: 'Continue from the platform and keep the cadence light but visible.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Ease',
            boxOneCopy: 'Keep the next action simple',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Small but regular activity',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Prevent another cooldown',
            bodyThree: 'Re-enter your client area and keep your account path alive.',
            bodyFour: 'Support remains optional if needed.',
            ctaLabel: 'Continue My Account Path',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_low_step3_email',
        {
          name: 'Dormant Low - Light Continuity Nurture A IT',
          description:
            'Promemoria gentile per evitare che utenti dormant low si raffreddino di nuovo.',
          subject: 'Mantieni attiva la tua ripartenza Bullwaves con un leggero passo in piu.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Continuity',
            title: 'Mantieni vivo il ritorno',
            heroTitle: 'Una continuazione leggera puo far durare la ripartenza',
            heroSubtitle: 'Questo step evita che l account torni in dormancy troppo velocemente.',
            mainTitle: 'La prossima mossa deve essere semplice e regolare.',
            introLead:
              'Una cadenza gentile spesso funziona meglio per profili low dormant che stanno tornando.',
            bodyOne:
              'Usa questo touch per tenere caldo l account e mantenere un percorso di continuita piu chiaro.',
            bodyTwo: 'Ora concentrati su:',
            boxOneTitle: 'Regolarita',
            boxOneCopy: 'Resta presente senza pressione',
            boxTwoTitle: 'Visibilita',
            boxTwoCopy: 'Conosci la prossima azione',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Evita di tornare dormant',
            bodyThree: 'Apri la tua area cliente e mantieni attiva la ripartenza.',
            bodyFour: 'Il supporto c e solo se hai bisogno di un chiarimento veloce.',
            ctaLabel: 'Mantieni Attiva La Mia Ripartenza',
          },
        },
        {
          name: 'Dormant Low - Light Continuity Nurture B IT',
          description:
            'Promemoria di continuita a bassa pressione dopo il primo segnale di ripartenza.',
          subject:
            'Il tuo account Bullwaves si sta muovendo di nuovo. Mantieni semplice il prossimo passo.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves Continuity',
            title: 'Rendi la ripartenza piu stabile',
            heroTitle: 'L account ha bisogno solo di un altro passo chiaro',
            heroSubtitle: 'Una continuazione semplice puo proteggere il progresso gia fatto.',
            mainTitle: 'Ora punta a mantenere aperto e attivo il percorso.',
            introLead:
              'Il miglior recovery per profili low dormant e spesso quello piu facile da mantenere.',
            bodyOne: 'Continua dalla piattaforma e mantieni la cadenza leggera ma visibile.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Facilita',
            boxOneCopy: 'Tieni semplice la prossima azione',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Attivita piccola ma regolare',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Evita un nuovo raffreddamento',
            bodyThree: 'Rientra nella tua area cliente e mantieni vivo il percorso account.',
            bodyFour: 'Il supporto resta opzionale se serve.',
            ctaLabel: 'Continua Il Mio Percorso Account',
          },
        }
      ),
    },
  },
  dormant_low_followup_retained_email: {
    id: 'dormant_low_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_low_followup_retained_email',
        {
          name: 'Dormant Low - Positive Follow-up A',
          description: 'Confirmation after low dormant account reactivation.',
          subject: 'Good news: your Bullwaves restart is working.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your restart is confirmed',
            heroTitle: 'You brought your account back into motion',
            heroSubtitle: 'Now the key is keeping that motion simple and regular.',
            mainTitle: 'The return worked. Keep the next phase easy to maintain.',
            introLead:
              'A confirmed recovery is best preserved through small but consistent actions.',
            bodyOne:
              'Continue from your client area and maintain your active path with a lighter cadence.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Regularity',
            boxOneCopy: 'Small actions done consistently',
            boxTwoTitle: 'Clarity',
            boxTwoCopy: 'Know the next simple step',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'Keep dormancy away',
            bodyThree: 'Open your client area and continue from the confirmed route.',
            bodyFour: 'Support remains available if you need one quick check.',
            ctaLabel: 'Continue My Active Route',
          },
        },
        {
          name: 'Dormant Low - Positive Follow-up B',
          description: 'Light continuity message after a successful low dormant recovery.',
          subject: 'Your account is active again. Keep the next steps light and clear.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Keep the path open and active',
            heroTitle: 'A small steady rhythm can protect the comeback',
            heroSubtitle: 'The goal now is not speed, but continuity.',
            mainTitle: 'Keep the account moving with simple actions.',
            introLead:
              'You already restarted the profile. Now keep the next phase practical and stable.',
            bodyOne: 'Use the platform to keep your rhythm alive and avoid another slowdown.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Ease',
            boxOneCopy: 'Low-pressure continuity',
            boxTwoTitle: 'Rhythm',
            boxTwoCopy: 'Small but regular activity',
            boxThreeTitle: 'Stability',
            boxThreeCopy: 'A calmer active pattern',
            bodyThree: 'Continue from your client area and keep the account path active.',
            bodyFour: 'Support stays optional if one detail needs context.',
            ctaLabel: 'Keep My Account Moving',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_low_followup_retained_email',
        {
          name: 'Dormant Low - Positive Follow-up A IT',
          description: 'Conferma dopo riattivazione dell account dormant low.',
          subject: 'Buona notizia: la tua ripartenza Bullwaves sta funzionando.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'La tua ripartenza e confermata',
            heroTitle: 'Hai rimesso in movimento il tuo account',
            heroSubtitle: 'Ora la chiave e mantenere quel movimento semplice e regolare.',
            mainTitle: 'Il ritorno ha funzionato. Mantieni la prossima fase facile da sostenere.',
            introLead: 'Un recovery confermato si preserva meglio con azioni piccole ma costanti.',
            bodyOne:
              'Continua dalla tua area cliente e mantieni il percorso attivo con una cadenza piu leggera.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Regolarita',
            boxOneCopy: 'Piccole azioni fatte con continuita',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Sapere il prossimo passo semplice',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Tieni lontana la dormancy',
            bodyThree: 'Apri la tua area cliente e continua dal percorso confermato.',
            bodyFour: 'Il supporto resta disponibile se ti serve un check rapido.',
            ctaLabel: 'Continua Il Mio Percorso Attivo',
          },
        },
        {
          name: 'Dormant Low - Positive Follow-up B IT',
          description: 'Messaggio di continuita leggero dopo recovery low dormant riuscito.',
          subject: 'Il tuo account e di nuovo attivo. Mantieni leggeri e chiari i prossimi step.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Mantieni aperto e attivo il percorso',
            heroTitle: 'Un piccolo ritmo costante puo proteggere il comeback',
            heroSubtitle: 'Ora l obiettivo non e la velocita, ma la continuita.',
            mainTitle: 'Tieni l account in movimento con azioni semplici.',
            introLead:
              'Hai gia riavviato il profilo. Ora mantieni la prossima fase pratica e stabile.',
            bodyOne:
              'Usa la piattaforma per tenere vivo il ritmo ed evitare un nuovo rallentamento.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Facilita',
            boxOneCopy: 'Continuita a bassa pressione',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Attivita piccola ma regolare',
            boxThreeTitle: 'Stabilita',
            boxThreeCopy: 'Un pattern attivo piu calmo',
            bodyThree: 'Continua dalla tua area cliente e mantieni attivo il percorso account.',
            bodyFour: 'Il supporto resta opzionale se un dettaglio richiede contesto.',
            ctaLabel: 'Mantieni In Movimento Il Mio Account',
          },
        }
      ),
    },
  },
  dormant_low_followup_recovery_email: {
    id: 'dormant_low_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_low_followup_recovery_email',
        {
          name: 'Dormant Low - Recovery Follow-up A',
          description: 'Extended light reactivation for low dormant accounts.',
          subject: 'Your Bullwaves account can still restart from a lighter path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A simple restart is still available',
            heroTitle: 'You can still come back without pressure',
            heroSubtitle: 'If the first attempt did not work, the lighter route remains open.',
            mainTitle: 'The next goal is simply to resume the account path.',
            introLead:
              'This follow-up keeps the relationship open and makes the comeback easier to try again.',
            bodyOne:
              'Use the lighter option to restart gradually and rebuild a small but stable rhythm.',
            bodyTwo: 'This supports:',
            boxOneTitle: 'Ease',
            boxOneCopy: 'A softer route back',
            boxTwoTitle: 'Confidence',
            boxTwoCopy: 'Try again without extra pressure',
            boxThreeTitle: 'Continuity',
            boxThreeCopy: 'Keep the profile engaged',
            bodyThree: 'Open your client area and relaunch from the simple return path.',
            bodyFour: 'Support remains there if you want one quick answer.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Dormant Low - Recovery Follow-up B',
          description: 'Soft extended recovery for low-value dormant users.',
          subject: 'A softer Bullwaves re-entry path is ready for you.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart from a lighter recovery route',
            heroTitle: 'A softer return can work better now',
            heroSubtitle: 'The easiest next step is often the most useful one.',
            mainTitle: 'Keep the account path alive with one clear action.',
            introLead: 'This option is designed to lower friction and keep the comeback realistic.',
            bodyOne:
              'Continue from platform and reactivate your account one simple move at a time.',
            bodyTwo: 'Prioritize:',
            boxOneTitle: 'Simple action',
            boxOneCopy: 'One visible move now',
            boxTwoTitle: 'Low pressure',
            boxTwoCopy: 'A gentler way to return',
            boxThreeTitle: 'Steady recovery',
            boxThreeCopy: 'Rebuild continuity slowly',
            bodyThree: 'Re-enter your client area and restart from the lighter path.',
            bodyFour: 'Support stays optional if you need help.',
            ctaLabel: 'Restart My Recovery',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_low_followup_recovery_email',
        {
          name: 'Dormant Low - Recovery Follow-up A IT',
          description: 'Riattivazione estesa e leggera per account low dormant.',
          subject: 'Il tuo account Bullwaves puo ancora ripartire da un percorso piu leggero.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Una ripartenza semplice e ancora disponibile',
            heroTitle: 'Puoi ancora tornare senza pressione',
            heroSubtitle:
              'Se il primo tentativo non ha funzionato, il percorso piu leggero resta aperto.',
            mainTitle: 'Il prossimo obiettivo e semplicemente riprendere il percorso account.',
            introLead:
              'Questo follow-up mantiene aperta la relazione e rende il comeback piu facile da riprovare.',
            bodyOne:
              'Usa l opzione leggera per ripartire gradualmente e ricostruire un ritmo piccolo ma stabile.',
            bodyTwo: 'Ti supporta su:',
            boxOneTitle: 'Facilita',
            boxOneCopy: 'Una via di ritorno piu morbida',
            boxTwoTitle: 'Fiducia',
            boxTwoCopy: 'Riprovare senza pressione extra',
            boxThreeTitle: 'Continuita',
            boxThreeCopy: 'Tieni il profilo coinvolto',
            bodyThree: 'Apri la tua area cliente e rilancia dal percorso semplice di ritorno.',
            bodyFour: 'Il supporto resta presente se vuoi una risposta veloce.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Low - Recovery Follow-up B IT',
          description: 'Recovery esteso e morbido per utenti dormant low-value.',
          subject: 'Per te e pronto un percorso Bullwaves di rientro piu morbido.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti da un recovery piu leggero',
            heroTitle: 'Un ritorno piu morbido puo funzionare meglio adesso',
            heroSubtitle: 'Il prossimo passo piu facile e spesso anche il piu utile.',
            mainTitle: 'Mantieni vivo il percorso account con un azione chiara.',
            introLead:
              'Questa opzione e pensata per abbassare attrito e rendere realistico il comeback.',
            bodyOne:
              'Continua dalla piattaforma e riattiva il tuo account una mossa semplice alla volta.',
            bodyTwo: 'Dai priorita a:',
            boxOneTitle: 'Azione semplice',
            boxOneCopy: 'Un passo visibile ora',
            boxTwoTitle: 'Bassa pressione',
            boxTwoCopy: 'Un modo piu dolce di tornare',
            boxThreeTitle: 'Recovery stabile',
            boxThreeCopy: 'Ricostruisci continuita lentamente',
            bodyThree: 'Rientra nella tua area cliente e riparti dal percorso piu leggero.',
            bodyFour: 'Il supporto resta opzionale se hai bisogno di aiuto.',
            ctaLabel: 'Riavvia Il Mio Recovery',
          },
        }
      ),
    },
  },
}
