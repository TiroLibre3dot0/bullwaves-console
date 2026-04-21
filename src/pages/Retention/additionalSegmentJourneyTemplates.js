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
            'Softer return opening built around practical value and a better client experience.',
          subject: 'A more tailored Bullwaves return plan is ready for you.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A more supportive return path is ready',
            heroTitle: 'We prepared a calmer way back in',
            heroSubtitle:
              'With a 100% bonus, dedicated account manager support, and AI trading tools coming soon.',
            mainTitle: 'A stronger return starts with clearer support.',
            introLead:
              'If the timing was not right before, you can now review a simpler and more supportive way back.',
            bodyOne:
              'We have prepared a more reassuring return path built around practical value, not pressure.',
            bodyTwo: 'What you can review now:',
            boxOneTitle: '100% Bonus',
            boxOneCopy: 'A concrete bonus option for eligible return activation',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'One direct contact for practical guidance and alignment',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Priority access to the new AI tools launching soon',
            bodyThree:
              'Open your client area to review what is currently available and decide your next step calmly.',
            bodyFour:
              'The goal is simple: make your return feel more useful, more supported, and easier to activate.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Comeback Touch B',
          description:
            'Client-friendly re-entry variant focused on support, bonus, and upcoming tools.',
          subject: 'Your dedicated Bullwaves review is open in your client area.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Return with a cleaner setup',
            heroTitle: 'A better return starts with the right support',
            heroSubtitle: 'The next step can now feel lighter, clearer, and more relevant to you.',
            mainTitle: 'You do not need pressure. You need a return path that feels right.',
            introLead:
              'This is a practical opportunity to review a calmer and more concrete way back into the platform.',
            bodyOne:
              'Use this window to review the available support and restart from a stronger client experience.',
            bodyTwo: 'In this phase, you can review:',
            boxOneTitle: '100% Bonus',
            boxOneCopy: 'Bonus options currently available for eligible accounts',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Direct follow-up for a practical next-step review',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'A first look at the new tools launching soon',
            bodyThree:
              'Re-enter your client area to see the available options and confirm the next practical move.',
            bodyFour:
              'Everything here stays concrete: better support, bonus review, and priority on new tools.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_step1_email',
        {
          name: 'Churned High Value - Comeback Touch A IT',
          description:
            'Apertura di rientro più morbida, costruita su valore concreto e migliore esperienza cliente.',
          subject: 'Per il tuo rientro abbiamo preparato una proposta Bullwaves più su misura.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'È pronto un percorso di rientro più curato',
            heroTitle: 'Abbiamo preparato un modo più semplice per tornare',
            heroSubtitle:
              'Con bonus del 100%, account manager dedicato e accesso prioritario ai nuovi trading tools con AI in arrivo.',
            mainTitle: 'Un ritorno migliore parte da più chiarezza e dal supporto giusto.',
            introLead:
              'Se prima il momento non era quello giusto, oggi puoi valutare un rientro più semplice, più utile e meglio accompagnato.',
            bodyOne:
              'Abbiamo preparato un percorso di rientro più rassicurante, basato su valore concreto e non su pressione.',
            bodyTwo: 'Cosa puoi valutare ora:',
            boxOneTitle: 'Bonus 100%',
            boxOneCopy: 'Una proposta concreta di bonus per i profili idonei al rientro',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Un referente diretto per guidarti nel prossimo passo in modo pratico',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Priorità sui nuovi strumenti con AI in arrivo a breve',
            bodyThree:
              'Apri la tua area cliente per rivedere ciò che è disponibile oggi e scegliere con calma il prossimo passo.',
            bodyFour:
              'L’obiettivo è semplice: rendere il tuo ritorno più supportato, più utile e più facile da attivare.',
            ctaLabel: 'Apri la mia area cliente',
          },
        },
        {
          name: 'Churned High Value - Comeback Touch B IT',
          description:
            'Variante di rientro orientata a supporto, bonus e nuovi strumenti in arrivo.',
          subject: 'La tua revisione dedicata Bullwaves è aperta nella tua area cliente.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Rientra con un setup più pulito',
            heroTitle: 'Un ritorno migliore parte dal supporto giusto',
            heroSubtitle:
              'Il prossimo passo può ora essere più leggero, più chiaro e più rilevante per te.',
            mainTitle: 'Non serve pressione. Serve un percorso di rientro che ti convinca davvero.',
            introLead:
              'Qui puoi valutare un modo più morbido e concreto per rientrare in piattaforma.',
            bodyOne:
              'Usa questa finestra per rivedere il supporto disponibile e ripartire da un’esperienza cliente più forte.',
            bodyTwo: 'In questa fase puoi valutare:',
            boxOneTitle: 'Bonus 100%',
            boxOneCopy: 'Le opzioni bonus oggi disponibili per i profili idonei',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Follow-up diretto per allineare in modo pratico il prossimo passo',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Un primo accesso ai nuovi strumenti in arrivo',
            bodyThree:
              'Rientra dalla tua area cliente per vedere le opzioni disponibili e confermare la prossima mossa pratica.',
            bodyFour:
              'Tutto resta concreto: migliore supporto, revisione bonus e priorità sui nuovi tools.',
            ctaLabel: 'Apri la mia area cliente',
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
          description:
            'Positive follow-up after the client completed a deposit or concrete restart action.',
          subject: 'Your Bullwaves deposit is confirmed. Here is the next supported step.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your return is now active',
            heroTitle: 'Thank you for your recent deposit',
            heroSubtitle:
              'Now the focus shifts to support, continuity, and a clearer next step for your account.',
            mainTitle: 'You have already taken an important step. Now make the most of it.',
            introLead:
              'Your recent activity is a positive sign, and this is the right moment to move forward with more clarity and support.',
            bodyOne:
              'We are now ready to help you turn that step into a steadier and more valuable return experience.',
            bodyTwo: 'From here, prioritize:',
            boxOneTitle: '100% Bonus',
            boxOneCopy:
              'Use the available bonus review to strengthen the restart you already triggered',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Confirm the next practical move with direct guidance',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Keep priority visibility on the new AI tools coming soon',
            bodyThree:
              'Open your client area and confirm the best next action after the deposit already completed.',
            bodyFour:
              'The next phase is about keeping this positive momentum stable, supported, and worthwhile.',
            ctaLabel: 'Continue My Return',
          },
        },
        {
          name: 'Churned High Value - Return Package B',
          description:
            'Deposit-confirmed variant focused on keeping the account moving after the first positive action.',
          subject: 'You already restarted the path. Let’s keep it moving.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A positive step has already happened',
            heroTitle: 'Your deposit reopened the relationship',
            heroSubtitle:
              'This follow-up helps you turn that action into a steadier and more supported return.',
            mainTitle: 'Now the right move is continuity, not another pause.',
            introLead:
              'You have already shown concrete intent. The next step is to keep the account experience stable, clear, and worthwhile.',
            bodyOne:
              'Use this phase to confirm the support available to you and avoid losing the progress created by the recent deposit.',
            bodyTwo: 'Keep attention on:',
            boxOneTitle: 'Bonus review',
            boxOneCopy: 'Make the return offer tangible and easy to use',
            boxTwoTitle: 'Direct support',
            boxTwoCopy: 'Use your manager to align the next action quickly',
            boxThreeTitle: 'Upcoming tools',
            boxThreeCopy: 'Stay in priority position for the new AI tools launch',
            bodyThree:
              'Re-enter from your client area and continue from the positive action already completed.',
            bodyFour: 'This touch is here to reinforce momentum, not to restart it from zero.',
            ctaLabel: 'Keep My Return Active',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_step2_email',
        {
          name: 'Churned High Value - Return Package A IT',
          description:
            'Follow-up positivo dopo un deposito o una riattivazione concreta già completata dal cliente.',
          subject: 'Il tuo deposito Bullwaves è confermato. Ecco il prossimo passo supportato.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo ritorno è ora attivo',
            heroTitle: 'Grazie per il deposito recente',
            heroSubtitle:
              'Ora il focus passa al supporto, alla continuità e a un prossimo passo più chiaro per il tuo account.',
            mainTitle: 'Hai già compiuto un passo importante. Adesso valorizzalo al meglio.',
            introLead:
              'La tua recente attività è un segnale positivo, e questo è il momento giusto per proseguire con più chiarezza e supporto.',
            bodyOne:
              'Ora possiamo aiutarti a trasformare quel passo in un ritorno più stabile, più ordinato e più utile.',
            bodyTwo: 'Da qui in avanti, dai priorità a:',
            boxOneTitle: 'Bonus 100%',
            boxOneCopy:
              'Usa la review bonus disponibile per rafforzare il rientro che hai già attivato',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Conferma il prossimo passo pratico con una guida diretta',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Mantieni visibilità prioritaria sui nuovi AI tools in arrivo',
            bodyThree:
              'Apri la tua area cliente e conferma la prossima azione migliore dopo il deposito già completato.',
            bodyFour:
              'La prossima fase serve a mantenere questo slancio positivo stabile, supportato e più utile nel tempo.',
            ctaLabel: 'Continua Il Mio Ritorno',
          },
        },
        {
          name: 'Churned High Value - Return Package B IT',
          description:
            'Variante dopo deposito confermato, orientata a mantenere il conto in movimento dopo il primo segnale positivo.',
          subject: 'Hai già riattivato il percorso. Ora mantienilo in movimento.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'C’è già stato un passo positivo',
            heroTitle: 'Il tuo deposito ha riaperto la relazione',
            heroSubtitle:
              'Questo follow-up ti aiuta a trasformare quell’azione in un ritorno più stabile e meglio supportato.',
            mainTitle: 'Ora la mossa giusta è la continuità, non una nuova pausa.',
            introLead:
              'Hai già mostrato un intento concreto. Il prossimo passo è mantenere l’esperienza sul conto stabile, chiara e utile.',
            bodyOne:
              'Usa questa fase per confermare il supporto oggi disponibile ed evitare di perdere il progresso creato dal deposito recente.',
            bodyTwo: 'Mantieni l’attenzione su:',
            boxOneTitle: 'Review bonus',
            boxOneCopy: 'Rendi concreta e semplice da usare la proposta di rientro',
            boxTwoTitle: 'Supporto diretto',
            boxTwoCopy: 'Usa il manager per allineare rapidamente la prossima azione',
            boxThreeTitle: 'Nuovi tools',
            boxThreeCopy: 'Resta in posizione prioritaria per il lancio dei nuovi AI tools',
            bodyThree:
              'Rientra dalla tua area cliente e continua dal segnale positivo che hai già generato.',
            bodyFour: 'Questo touch serve a rinforzare lo slancio, non a ripartire da zero.',
            ctaLabel: 'Mantieni Attivo Il Mio Ritorno',
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
            'Continuity touch after the deposit, designed to stabilize the restarted account.',
          subject: 'After your deposit, Bullwaves can now support the next phase more completely.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Strengthen the deposit you already made',
            heroTitle: 'Your deposit reopened the account path',
            heroSubtitle:
              'Now the right mix of support and value can help this return remain active and useful.',
            mainTitle: 'You already acted. Now make the restart more stable.',
            introLead:
              'Because the deposit step has already happened, this is the right moment to protect the momentum and keep the relationship moving forward.',
            bodyOne:
              'Use this phase to confirm the support around your account and avoid falling back into a new pause after the deposit.',
            bodyTwo: 'What helps most now:',
            boxOneTitle: '100% Bonus',
            boxOneCopy: 'Keep the return offer clear and concrete',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Maintain direct guidance for the next step',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Stay in priority position for the new tools coming soon',
            bodyThree:
              'Open your client area to confirm the final priorities for your bonus, support, and upcoming AI tools access.',
            bodyFour: 'This last step is here to make the return easier to maintain.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Active Return Consolidation B',
          description:
            'Softer post-deposit consolidation variant focused on keeping the return stable after the action was completed.',
          subject: 'Your deposit restarted the path. A final supportive review is now available.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Complete the return with more continuity',
            heroTitle: 'Your deposit moved the account back into motion',
            heroSubtitle:
              'A short final review can help the restart remain stable, supported, and worthwhile.',
            mainTitle: 'The important thing now is continuity after the action already taken.',
            introLead:
              'You have already completed the deposit, and now you can continue with a steadier and more supported path forward.',
            bodyOne:
              'Complete this phase and keep the relationship aligned with the better support now available to you.',
            bodyTwo: 'Focus now on:',
            boxOneTitle: 'Useful support',
            boxOneCopy: 'Clear guidance for the next action after the deposit',
            boxTwoTitle: 'Stable rhythm',
            boxTwoCopy: 'Avoid another long pause after the restart',
            boxThreeTitle: 'Priority tools',
            boxThreeCopy: 'Keep access to bonus review and AI tools visibility',
            bodyThree:
              'Continue from your client area and confirm the final mix of bonus, manager support, and new tools access.',
            bodyFour: 'Support remains available if you want one final practical confirmation.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_step3_email',
        {
          name: 'Churned High Value - Consolidamento Ritorno Attivo A IT',
          description:
            'Touch di continuità dopo il deposito, pensato per stabilizzare il ritorno già riattivato.',
          subject:
            'Dopo il tuo deposito, Bullwaves può supportare in modo più completo la prossima fase.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Rafforza il deposito che hai già effettuato',
            heroTitle: 'Il tuo deposito ha riaperto il percorso account',
            heroSubtitle:
              'Ora il giusto equilibrio tra supporto e valore può aiutare questo ritorno a restare attivo e utile.',
            mainTitle: 'Hai già agito. Ora rendi più stabile la ripartenza.',
            introLead:
              'Poiché il deposito è già avvenuto, questo è il momento giusto per proteggere lo slancio e portare avanti la relazione in modo positivo.',
            bodyOne:
              'Usa questa fase per confermare il supporto attorno al tuo account ed evitare una nuova pausa dopo il deposito.',
            bodyTwo: 'Cosa aiuta di più adesso:',
            boxOneTitle: 'Bonus 100%',
            boxOneCopy: 'Mantieni chiara e concreta la proposta di rientro',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Conserva una guida diretta per il prossimo passo',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Resta in posizione prioritaria sui nuovi strumenti in arrivo',
            bodyThree:
              'Apri la tua area cliente per confermare le priorità finali tra bonus, supporto e accesso ai nuovi AI tools.',
            bodyFour: 'Questo ultimo step serve a rendere il ritorno più facile da mantenere.',
            ctaLabel: 'Apri la mia area cliente',
          },
        },
        {
          name: 'Churned High Value - Consolidamento Ritorno Attivo B IT',
          description:
            'Variante post-deposito più morbida, pensata per mantenere stabile il ritorno dopo l’azione già compiuta.',
          subject:
            'Il tuo deposito ha riattivato il percorso. Ora è disponibile una review finale più supportiva.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Completa il ritorno con più continuità',
            heroTitle: 'Il tuo deposito ha rimesso in moto il conto',
            heroSubtitle:
              'Una breve review finale può aiutare la ripartenza a restare stabile, supportata e più utile.',
            mainTitle: 'Ora conta la continuità dopo l’azione che hai già compiuto.',
            introLead:
              'Hai già completato il deposito, e ora puoi proseguire con un percorso più stabile e meglio supportato.',
            bodyOne:
              'Completa questa fase e mantieni la relazione allineata al migliore supporto oggi disponibile per te.',
            bodyTwo: 'Ora concentrati su:',
            boxOneTitle: 'Supporto utile',
            boxOneCopy: 'Guida chiara per la prossima azione dopo il deposito',
            boxTwoTitle: 'Ritmo stabile',
            boxTwoCopy: 'Evita una nuova pausa dopo la ripartenza',
            boxThreeTitle: 'Tools prioritari',
            boxThreeCopy: 'Mantieni bonus review e visibilità sui nuovi strumenti',
            bodyThree:
              'Continua dalla tua area cliente e conferma il mix finale tra bonus, supporto del manager e accesso ai nuovi tools.',
            bodyFour: 'Il supporto resta disponibile se desideri un’ultima conferma pratica.',
            ctaLabel: 'Apri la mia area cliente',
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
            'Positive continuity follow-up after the client completed the deposit and reactivated the account.',
          subject: 'Good news: your deposit has reactivated the Bullwaves path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your return is back on track',
            heroTitle: 'The deposit has restarted the relationship',
            heroSubtitle: 'Now the focus is keeping it simple, stable, and well supported.',
            mainTitle: 'You completed the action. Now protect the continuity.',
            introLead:
              'This confirmation is a good sign. The next step is to keep the return consistent and useful over time after the deposit already made.',
            bodyOne:
              'Continue from your current setup and use the available support to keep the rhythm steady.',
            bodyTwo: 'To stay on track, prioritize:',
            boxOneTitle: 'Consistency',
            boxOneCopy: 'Keep account activity regular after the restart',
            boxTwoTitle: 'Guidance',
            boxTwoCopy: 'Use your account-manager support when helpful',
            boxThreeTitle: 'Next-phase value',
            boxThreeCopy: 'Stay aligned with bonus review and new AI tools access',
            bodyThree:
              'Open your client area and continue from the return path now reactivated for you.',
            bodyFour: 'If useful, support is available for one quick alignment on the next step.',
            ctaLabel: 'Continue My Return Path',
          },
        },
        {
          name: 'Churned High Value - Positive Follow-up B',
          description:
            'Warm continuity variant for preserving momentum after the deposit and recovery signal.',
          subject: 'Your return is moving in the right direction after the recent deposit.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Keep this positive rhythm active',
            heroTitle: 'Your restart is working',
            heroSubtitle: 'The strongest result now is a stable and well-supported continuation.',
            mainTitle: 'You are back in motion after acting. Keep the next phase clear and calm.',
            introLead:
              'Use this window to preserve momentum and keep the account experience positive.',
            bodyOne:
              'A clear cadence, direct support, and relevant offers can keep this new start moving forward after the deposit has already happened.',
            bodyTwo: 'Maintain:',
            boxOneTitle: 'Regular rhythm',
            boxOneCopy: 'Simple and steady account activity',
            boxTwoTitle: 'Practical direction',
            boxTwoCopy: 'Clear next actions without friction',
            boxThreeTitle: 'Support quality',
            boxThreeCopy: 'Manager help and visibility on new AI tools',
            bodyThree:
              'Continue from your area and keep the current trajectory supported and active.',
            bodyFour: 'Support remains available if you want one quick tactical review.',
            ctaLabel: 'Keep My Return Active',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_followup_retained_email',
        {
          name: 'Churned High Value - Positive Follow-up A IT',
          description:
            'Follow-up positivo di continuità dopo un deposito già completato e una riattivazione riuscita.',
          subject: 'Buone notizie: il tuo deposito ha riattivato il percorso Bullwaves.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo ritorno è tornato sulla strada giusta',
            heroTitle: 'Il deposito ha riattivato la relazione',
            heroSubtitle: 'Ora conta mantenerla semplice, stabile e ben supportata.',
            mainTitle: 'Hai completato l’azione. Adesso proteggi la continuità.',
            introLead:
              'Questa conferma è un ottimo segnale. Il prossimo passo è rendere il ritorno coerente e utile nel tempo dopo il deposito già effettuato.',
            bodyOne:
              'Continua dal setup attuale e usa il supporto disponibile per mantenere stabile il ritmo.',
            bodyTwo: 'Per restare in carreggiata, dai priorità a:',
            boxOneTitle: 'Costanza',
            boxOneCopy: 'Mantieni regolare l’attività del conto dopo la ripartenza',
            boxTwoTitle: 'Guida',
            boxTwoCopy: 'Usa il supporto del tuo account manager quando serve',
            boxThreeTitle: 'Valore della prossima fase',
            boxThreeCopy: 'Resta allineato a bonus review e nuovi AI tools',
            bodyThree:
              'Apri la tua area cliente e continua dal percorso di ritorno ora riattivato per te.',
            bodyFour:
              'Se utile, il supporto è disponibile per un rapido allineamento sul prossimo passo.',
            ctaLabel: 'Continua Il Mio Percorso Di Ritorno',
          },
        },
        {
          name: 'Churned High Value - Positive Follow-up B IT',
          description:
            'Variante calda di continuità per preservare lo slancio dopo il deposito e il segnale di recovery.',
          subject:
            'Il tuo ritorno si sta muovendo nella direzione giusta dopo il deposito recente.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Mantieni attivo questo ritmo positivo',
            heroTitle: 'La tua ripartenza sta funzionando',
            heroSubtitle: 'Il risultato migliore ora è una continuità stabile e ben supportata.',
            mainTitle:
              'Sei di nuovo in movimento dopo esserti attivato. Mantieni la prossima fase chiara e serena.',
            introLead:
              'Usa questa finestra per preservare lo slancio e mantenere positiva l’esperienza sul conto.',
            bodyOne:
              'Una cadenza chiara, supporto diretto e offerte rilevanti possono far proseguire bene questo nuovo inizio dopo il deposito già effettuato.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Ritmo regolare',
            boxOneCopy: 'Attività semplice e costante',
            boxTwoTitle: 'Direzione pratica',
            boxTwoCopy: 'Prossime azioni chiare e senza attrito',
            boxThreeTitle: 'Qualità del supporto',
            boxThreeCopy: 'Aiuto del manager e visibilità sui nuovi AI tools',
            bodyThree:
              'Continua dalla tua area e mantieni la traiettoria attuale supportata e attiva.',
            bodyFour: 'Il supporto resta disponibile se vuoi una rapida review tattica.',
            ctaLabel: 'Mantieni Attivo Il Mio Ritorno',
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
          description:
            'Warm reactivation follow-up for users who still have not completed the deposit or restart action.',
          subject: 'No deposit yet? The Bullwaves reactivation path is still open.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A calmer reactivation route is still available',
            heroTitle: 'You have not completed the next action yet',
            heroSubtitle:
              'This path keeps the relationship open and gives you a simpler way to reactivate.',
            mainTitle: 'If no deposit happened yet, the opportunity is still open.',
            introLead:
              'If you have not completed the next step yet, the opportunity is still open and the return can now feel simpler and more supported.',
            bodyOne:
              'Use this option when you feel ready and restart from a more reassuring setup.',
            bodyTwo: 'This reactivation path gives you:',
            boxOneTitle: '100% Bonus',
            boxOneCopy: 'A concrete review of the return offer still available to you',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Direct support for a guided next step',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Priority visibility on the new tools coming soon',
            bodyThree: 'Open your client area and relaunch from the lighter return route.',
            bodyFour: 'Support remains available if you want one guided restart checkpoint.',
            ctaLabel: 'Open My Client Area',
          },
        },
        {
          name: 'Churned High Value - Return Follow-up B',
          description:
            'Low-pressure variant for clients who still have not taken action and need a fresh reactivation push.',
          subject:
            'Still no action? A lighter Bullwaves return option is available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart with less pressure',
            heroTitle: 'A softer comeback can work better when no action has happened yet',
            heroSubtitle:
              'Sometimes the best return is the one that feels simple and well supported.',
            mainTitle: 'A practical and lower-pressure way back is still available.',
            introLead:
              'If the deposit has not been completed yet, you can still return through a simpler and more reassuring next step.',
            bodyOne:
              'Use the lighter path to reactivate step by step and come back with more confidence.',
            bodyTwo: 'Focus on:',
            boxOneTitle: 'Simple next action',
            boxOneCopy: 'One clear move at a time',
            boxTwoTitle: 'Useful support',
            boxTwoCopy: 'Direct guidance when you need it',
            boxThreeTitle: 'Relevant value',
            boxThreeCopy: 'Bonus review and new AI tools visibility',
            bodyThree: 'Re-enter from your area and continue with the softer recovery option.',
            bodyFour: 'Support is available for one quick practical clarification.',
            ctaLabel: 'Open My Client Area',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'churned_high_value_followup_recovery_email',
        {
          name: 'Churned High Value - Return Follow-up A IT',
          description:
            'Follow-up di riattivazione per utenti che non hanno ancora completato il deposito o l’azione di rientro.',
          subject:
            'Nessun deposito ancora? Il percorso di riattivazione Bullwaves è ancora aperto.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'È ancora disponibile un percorso di riattivazione più sereno',
            heroTitle: 'Non hai ancora completato la prossima azione',
            heroSubtitle:
              'Questo percorso mantiene aperta la relazione e ti offre un modo più semplice per riattivarti.',
            mainTitle: 'Se il deposito non è ancora avvenuto, l’opportunità resta aperta.',
            introLead:
              'Se non hai ancora completato il prossimo passo, l’opportunità resta aperta e il rientro può ora essere più semplice e meglio supportato.',
            bodyOne:
              'Usa questa opzione quando ti senti pronto e riparti da un setup più rassicurante.',
            bodyTwo: 'Questo percorso di riattivazione ti offre:',
            boxOneTitle: 'Bonus 100%',
            boxOneCopy:
              'Una revisione concreta della proposta di rientro ancora disponibile per te',
            boxTwoTitle: 'Account Manager',
            boxTwoCopy: 'Supporto diretto per un prossimo passo guidato',
            boxThreeTitle: 'AI Trading Tools',
            boxThreeCopy: 'Visibilità prioritaria sui nuovi strumenti in arrivo',
            bodyThree: 'Apri la tua area cliente e riparti dal percorso di ritorno più leggero.',
            bodyFour:
              'Il supporto resta disponibile se desideri un checkpoint guidato di ripartenza.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        },
        {
          name: 'Churned High Value - Return Follow-up B IT',
          description:
            'Variante a bassa pressione per clienti che non hanno ancora compiuto un’azione e necessitano di una nuova spinta di riattivazione.',
          subject:
            'Ancora nessuna azione? Per il tuo account è disponibile una opzione Bullwaves più leggera.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti con meno pressione',
            heroTitle:
              'Un ritorno più morbido può funzionare meglio quando non c’è ancora stata azione',
            heroSubtitle:
              'A volte la ripartenza migliore è quella che si sente semplice e ben supportata.',
            mainTitle: 'È ancora disponibile un modo pratico e più leggero per rientrare.',
            introLead:
              'Se il deposito non è ancora arrivato, puoi ancora valutare un prossimo passo più semplice, più chiaro e meno impegnativo.',
            bodyOne:
              'Usa il percorso più leggero per riattivarti passo dopo passo e tornare con maggiore fiducia.',
            bodyTwo: 'Concentrati su:',
            boxOneTitle: 'Prossima azione semplice',
            boxOneCopy: 'Un passo chiaro alla volta',
            boxTwoTitle: 'Supporto utile',
            boxTwoCopy: 'Guida diretta quando ne hai bisogno',
            boxThreeTitle: 'Valore rilevante',
            boxThreeCopy: 'Bonus review e visibilità sui nuovi AI tools',
            bodyThree: 'Rientra dalla tua area e continua con l’opzione recovery più morbida.',
            bodyFour: 'Il supporto è disponibile per un chiarimento pratico rapido.',
            ctaLabel: 'Apri La Mia Area Cliente',
          },
        }
      ),
    },
  },
  dormant_120d_bonus_step1_email: {
    id: 'dormant_120d_bonus_step1_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_step1_email',
        {
          name: 'Dormant 120d - Free Bonus Invite A',
          description:
            'Reactivation opener for deeply inactive users built around a 100 USD free-bonus experience requested on WhatsApp.',
          subject: 'A 100 USD Bullwaves bonus can now help you restart.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'A lighter way back is open',
            heroTitle: 'You can restart with a 100 USD free bonus',
            heroSubtitle:
              'Your account manager can guide the request directly on WhatsApp with one simple keyword.',
            mainTitle: 'Return without needing to fund the first step yourself.',
            introLead:
              'If your account has been inactive for a long time, this is a practical way to test the platform again with lower friction.',
            bodyOne:
              'Eligible clients can request a 100 USD bonus to trade again in a more relaxed and supported way.',
            bodyTwo: 'What this includes:',
            boxOneTitle: '100 USD Bonus',
            boxOneCopy: 'A free-bonus trading experience activated by your manager',
            boxTwoTitle: 'Profit Withdrawal',
            boxTwoCopy: 'If results are positive, profits can be withdrawn',
            boxThreeTitle: 'WhatsApp Request',
            boxThreeCopy: 'Send the keyword BONUS100 to your account manager',
            bodyThree:
              'To request it, contact your account manager on WhatsApp and send the keyword BONUS100.',
            bodyFour:
              'This is designed to make your return simpler, more concrete, and worth trying again.',
            ctaLabel: 'Message My Manager On WhatsApp',
          },
        },
        {
          name: 'Dormant 120d - Free Bonus Invite B',
          description:
            'Alternative re-entry angle focused on a no-pressure 100 USD bonus and direct manager support.',
          subject: 'Your account is eligible for a 100 USD reactivation bonus.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Restart with more confidence',
            heroTitle: 'A free-bonus experience is available for your account',
            heroSubtitle:
              'A simple WhatsApp message can reopen the conversation and activate your next step.',
            mainTitle:
              'Sometimes the easiest return is the one that feels risk-light and well supported.',
            introLead:
              'This invitation is for clients who have been away for a while and want a simpler reason to come back.',
            bodyOne:
              'With the 100 USD bonus, you can explore a fresh trading experience without extra pressure and with direct manager guidance.',
            bodyTwo: 'Your re-entry path includes:',
            boxOneTitle: 'Free Bonus Access',
            boxOneCopy: 'A concrete 100 USD restart opportunity',
            boxTwoTitle: 'Manager Support',
            boxTwoCopy: 'One direct WhatsApp contact for the activation',
            boxThreeTitle: 'Keyword BONUS100',
            boxThreeCopy: 'One message is enough to start the request',
            bodyThree:
              'Open the conversation on WhatsApp with your account manager and send BONUS100 to request the offer.',
            bodyFour:
              'It is a simple way to return, test the platform again, and see whether this is the right time to reactivate.',
            ctaLabel: 'Request My Bonus On WhatsApp',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_step1_email',
        {
          name: 'Dormant 120d - Invito Bonus Gratuito A IT',
          description:
            'Apertura di riattivazione per utenti molto inattivi basata su un bonus gratuito da 100 USD richiedibile su WhatsApp.',
          subject: 'Un bonus Bullwaves da 100 USD puo aiutarti a ripartire.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'E disponibile un rientro piu leggero',
            heroTitle: 'Puoi ripartire con un bonus gratuito da 100 USD',
            heroSubtitle:
              'Il tuo account manager puo guidare la richiesta direttamente su WhatsApp con una parola chiave molto semplice.',
            mainTitle: 'Rientra senza dover finanziare subito il primo passo con fondi tuoi.',
            introLead:
              'Se il tuo account e fermo da tempo, questa puo essere una modalita pratica per provare di nuovo la piattaforma con meno attrito.',
            bodyOne:
              'I clienti idonei possono richiedere un bonus da 100 USD per tornare a fare esperienza di trading in modo piu sereno e supportato.',
            bodyTwo: 'Cosa include questa proposta:',
            boxOneTitle: 'Bonus 100 USD',
            boxOneCopy: 'Una esperienza di trading supportata e attivata dal manager',
            boxTwoTitle: 'Profitti Prelevabili',
            boxTwoCopy: 'Se il risultato e positivo, i profitti possono essere prelevati',
            boxThreeTitle: 'Richiesta WhatsApp',
            boxThreeCopy: 'Invia la keyword BONUS100 al tuo account manager',
            bodyThree:
              'Per richiederlo, contatta il tuo account manager su WhatsApp e invia la keyword BONUS100.',
            bodyFour:
              'L idea e rendere il tuo ritorno piu semplice, piu concreto e piu facile da valutare.',
            ctaLabel: 'Scrivi Al Mio Manager Su WhatsApp',
          },
        },
        {
          name: 'Dormant 120d - Invito Bonus Gratuito B IT',
          description:
            'Variante di rientro orientata a bonus gratuito da 100 USD e supporto diretto del manager.',
          subject: 'Per il tuo account e disponibile un bonus di riattivazione da 100 USD.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Riparti con piu fiducia',
            heroTitle: 'Per il tuo account e disponibile una esperienza con bonus gratuito',
            heroSubtitle:
              'Un semplice messaggio WhatsApp puo riaprire la conversazione e attivare il tuo prossimo passo.',
            mainTitle:
              'A volte il rientro migliore e quello che si sente leggero e ben supportato.',
            introLead:
              'Questo invito e pensato per clienti che sono stati lontani per un po e vogliono un motivo semplice e concreto per tornare.',
            bodyOne:
              'Con il bonus da 100 USD puoi fare una nuova esperienza di trading con meno pressione e con il supporto diretto del manager.',
            bodyTwo: 'Il percorso include:',
            boxOneTitle: 'Accesso Bonus',
            boxOneCopy: 'Una opportunita concreta di ripartenza da 100 USD',
            boxTwoTitle: 'Supporto Manager',
            boxTwoCopy: 'Un contatto WhatsApp diretto per attivare la richiesta',
            boxThreeTitle: 'Keyword BONUS100',
            boxThreeCopy: 'Un solo messaggio basta per iniziare',
            bodyThree:
              'Apri la conversazione su WhatsApp con il tuo account manager e invia BONUS100 per richiedere l offerta.',
            bodyFour:
              'E un modo semplice per rientrare, riprovare la piattaforma e capire se questo e il momento giusto per riattivarti.',
            ctaLabel: 'Richiedi Il Mio Bonus Su WhatsApp',
          },
        }
      ),
    },
  },
  dormant_120d_bonus_step2_email: {
    id: 'dormant_120d_bonus_step2_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_step2_email',
        {
          name: 'Dormant 120d - Bonus Activation Reminder A',
          description:
            'Reminder explaining how to request the 100 USD bonus through the account manager on WhatsApp.',
          subject: 'To request the 100 USD bonus, send BONUS100 on WhatsApp.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your bonus request is one message away',
            heroTitle: 'Send BONUS100 to your account manager',
            heroSubtitle:
              'That simple WhatsApp message is enough to ask for your 100 USD bonus activation.',
            mainTitle: 'This is the easiest way to restart the experience.',
            introLead:
              'If you want to come back without a heavy first step, this manager-led route is the cleanest option available now.',
            bodyOne:
              'There is no complex process: just contact your manager on WhatsApp and send the keyword BONUS100.',
            bodyTwo: 'Why this route works:',
            boxOneTitle: 'Fast Request',
            boxOneCopy: 'One keyword starts the conversation',
            boxTwoTitle: 'Manager Guidance',
            boxTwoCopy: 'You are supported from request to activation',
            boxThreeTitle: 'Useful Experience',
            boxThreeCopy: 'You can test the platform again with a practical bonus',
            bodyThree:
              'If approved, the bonus can be used for a fresh trading experience and positive results may be withdrawn.',
            bodyFour: 'If you were waiting for a simple reason to return, this is it.',
            ctaLabel: 'Send BONUS100 On WhatsApp',
          },
        },
        {
          name: 'Dormant 120d - Bonus Activation Reminder B',
          description:
            'Alternative reminder focused on simplicity, manager support, and profit-withdrawal upside.',
          subject: 'A simpler return starts with one WhatsApp keyword: BONUS100.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your manager can activate the next step',
            heroTitle: 'The 100 USD route is still open for you',
            heroSubtitle:
              'Message your account manager on WhatsApp and use BONUS100 to request the reactivation offer.',
            mainTitle: 'A return becomes easier when the first step is already prepared.',
            introLead:
              'This reminder is here to keep the path clear, simple, and worth considering again.',
            bodyOne:
              'The bonus offer is designed to let you re-enter in a lighter way and see whether a new cycle feels right for you.',
            bodyTwo: 'Remember:',
            boxOneTitle: '100 USD Available',
            boxOneCopy: 'A concrete bonus can be requested now',
            boxTwoTitle: 'WhatsApp Only',
            boxTwoCopy: 'The request goes directly through your manager',
            boxThreeTitle: 'Profits Can Stay Yours',
            boxThreeCopy: 'If the outcome is positive, profits may be withdrawn',
            bodyThree:
              'Start with one message, get the guidance you need, and decide your next step with more confidence.',
            bodyFour: 'Send BONUS100 and let your manager guide the rest.',
            ctaLabel: 'Contact My Manager Now',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_step2_email',
        {
          name: 'Dormant 120d - Reminder Attivazione Bonus A IT',
          description:
            'Reminder che spiega come richiedere il bonus da 100 USD tramite account manager su WhatsApp.',
          subject: 'Per richiedere il bonus da 100 USD, invia BONUS100 su WhatsApp.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'La tua richiesta bonus e a un messaggio di distanza',
            heroTitle: 'Invia BONUS100 al tuo account manager',
            heroSubtitle:
              'Quel semplice messaggio WhatsApp basta per chiedere l attivazione del bonus da 100 USD.',
            mainTitle: 'E il modo piu semplice per ripartire con una nuova esperienza.',
            introLead:
              'Se vuoi tornare senza un primo passo troppo impegnativo, questa via guidata dal manager e oggi una delle opzioni piu chiare.',
            bodyOne:
              'Non c e un processo complicato: contatta il tuo manager su WhatsApp e invia la keyword BONUS100.',
            bodyTwo: 'Perche funziona:',
            boxOneTitle: 'Richiesta Rapida',
            boxOneCopy: 'Una keyword basta per aprire la conversazione',
            boxTwoTitle: 'Guida Del Manager',
            boxTwoCopy: 'Sei seguito dalla richiesta fino alla possibile attivazione',
            boxThreeTitle: 'Esperienza Utile',
            boxThreeCopy: 'Puoi riprovare la piattaforma con un bonus pratico',
            bodyThree:
              'Se approvato, il bonus puo essere usato per una nuova esperienza di trading e gli eventuali risultati positivi possono essere prelevati.',
            bodyFour:
              'Se aspettavi un motivo semplice per tornare, questo e un buon punto di ripartenza.',
            ctaLabel: 'Invia BONUS100 Su WhatsApp',
          },
        },
        {
          name: 'Dormant 120d - Reminder Attivazione Bonus B IT',
          description:
            'Variante reminder focalizzata su semplicita, supporto manager e lato positivo del bonus.',
          subject: 'Un rientro piu semplice parte da una keyword WhatsApp: BONUS100.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo manager puo attivare il prossimo passo',
            heroTitle: 'La route da 100 USD e ancora aperta per te',
            heroSubtitle:
              'Scrivi al tuo account manager su WhatsApp e usa BONUS100 per richiedere l offerta di riattivazione.',
            mainTitle: 'Il ritorno diventa piu facile quando il primo passo e gia pronto.',
            introLead:
              'Questo reminder serve a tenere il percorso chiaro, semplice e concreto da valutare.',
            bodyOne:
              'L offerta bonus e pensata per farti rientrare in modo piu leggero e capire se un nuovo ciclo puo essere interessante per te.',
            bodyTwo: 'Ricorda:',
            boxOneTitle: '100 USD Disponibili',
            boxOneCopy: 'Un bonus concreto puo essere richiesto ora',
            boxTwoTitle: 'Solo Su WhatsApp',
            boxTwoCopy: 'La richiesta passa direttamente dal tuo manager',
            boxThreeTitle: 'Profitti Prelevabili',
            boxThreeCopy: 'Se il risultato e positivo, i profitti possono essere prelevati',
            bodyThree:
              'Inizia con un solo messaggio, ottieni la guida necessaria e valuta il tuo prossimo passo con piu fiducia.',
            bodyFour: 'Invia BONUS100 e lascia che il manager ti accompagni nel resto.',
            ctaLabel: 'Contatta Il Mio Manager Ora',
          },
        }
      ),
    },
  },
  dormant_120d_bonus_step3_email: {
    id: 'dormant_120d_bonus_step3_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_step3_email',
        {
          name: 'Dormant 120d - Last Call Bonus Support A',
          description: 'Final supportive re-entry touch for the 100 USD dormant-bonus journey.',
          subject: 'If you want a low-friction return, your 100 USD bonus path is still open.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your easiest return option is still available',
            heroTitle: 'The bonus invitation is still open',
            heroSubtitle:
              'A simple WhatsApp request can still unlock the 100 USD experience for your account.',
            mainTitle: 'If you want to test the waters again, this is the cleanest way to do it.',
            introLead:
              'There is still time to come back with a lighter first step and direct support from your manager.',
            bodyOne:
              'The purpose of this offer is simple: give you a practical reason to restart without unnecessary pressure.',
            bodyTwo: 'Why it is worth considering:',
            boxOneTitle: 'Low-Frictions Start',
            boxOneCopy: 'A simpler comeback route after a long pause',
            boxTwoTitle: 'Manager Contact',
            boxTwoCopy: 'Direct WhatsApp support when you are ready',
            boxThreeTitle: 'Real Upside',
            boxThreeCopy: 'Positive trading results may be withdrawn',
            bodyThree:
              'If you want the activation, message your account manager now and send BONUS100.',
            bodyFour:
              'Sometimes one simple conversation is enough to put the account back in motion.',
            ctaLabel: 'Activate My WhatsApp Request',
          },
        },
        {
          name: 'Dormant 120d - Last Call Bonus Support B',
          description:
            'Alternative closing touch for long-inactive users who still have not claimed the manager-led bonus.',
          subject: 'The 100 USD bonus offer is still available for your account.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Do not overcomplicate your comeback',
            heroTitle: 'A simple manager-led return is still on the table',
            heroSubtitle:
              'Your next step can begin with a WhatsApp message instead of a heavy commitment.',
            mainTitle: 'This is a practical way to see whether you are ready to reactivate.',
            introLead:
              'If the timing feels better now, your manager can still help you access the 100 USD bonus route.',
            bodyOne:
              'You do not need a complex plan to start again. You only need one clear action and the right support.',
            bodyTwo: 'The route stays simple:',
            boxOneTitle: 'Message BONUS100',
            boxOneCopy: 'Use the keyword on WhatsApp',
            boxTwoTitle: 'Receive Support',
            boxTwoCopy: 'Let your manager guide the request',
            boxThreeTitle: 'Try The Experience',
            boxThreeCopy: 'Use the bonus and evaluate your return calmly',
            bodyThree:
              'The opportunity is still available if you want to take a fresh look at the market with lower friction.',
            bodyFour: 'Send BONUS100 whenever you are ready.',
            ctaLabel: 'Take The First Step On WhatsApp',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_step3_email',
        {
          name: 'Dormant 120d - Supporto Finale Bonus A IT',
          description:
            'Ultimo touch di supporto per il journey dormant legato al bonus da 100 USD.',
          subject:
            'Se vuoi un rientro piu leggero, il tuo percorso bonus da 100 USD e ancora aperto.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'La tua opzione di ritorno piu semplice e ancora disponibile',
            heroTitle: 'L invito bonus e ancora aperto',
            heroSubtitle:
              'Una semplice richiesta su WhatsApp puo ancora sbloccare la esperienza da 100 USD per il tuo account.',
            mainTitle:
              'Se vuoi riprovare senza appesantire il primo passo, questa e la via piu pulita.',
            introLead:
              'Hai ancora tempo per tornare con un approccio piu leggero e con il supporto diretto del tuo manager.',
            bodyOne:
              'L obiettivo di questa proposta e semplice: darti un motivo pratico per ripartire senza pressione inutile.',
            bodyTwo: 'Perche puo valerne la pena:',
            boxOneTitle: 'Partenza Leggera',
            boxOneCopy: 'Un percorso di ritorno piu semplice dopo una lunga pausa',
            boxTwoTitle: 'Contatto Manager',
            boxTwoCopy: 'Supporto diretto su WhatsApp quando vuoi',
            boxThreeTitle: 'Lato Positivo',
            boxThreeCopy: 'Gli eventuali risultati positivi possono essere prelevati',
            bodyThree: 'Se vuoi l attivazione, scrivi ora al tuo account manager e invia BONUS100.',
            bodyFour: 'A volte basta una conversazione semplice per rimettere in moto il conto.',
            ctaLabel: 'Attiva La Mia Richiesta Su WhatsApp',
          },
        },
        {
          name: 'Dormant 120d - Supporto Finale Bonus B IT',
          description:
            'Variante finale per utenti molto inattivi che non hanno ancora richiesto il bonus tramite manager.',
          subject: 'Per il tuo account il bonus da 100 USD e ancora disponibile.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Non complicare il tuo rientro',
            heroTitle: 'E ancora disponibile un ritorno semplice guidato dal manager',
            heroSubtitle:
              'Il tuo prossimo passo puo iniziare da un messaggio WhatsApp invece che da un impegno pesante.',
            mainTitle: 'E un modo pratico per capire se sei pronto a riattivarti.',
            introLead:
              'Se oggi il timing ti sembra migliore, il tuo manager puo ancora aiutarti ad accedere al percorso bonus da 100 USD.',
            bodyOne:
              'Non serve un piano complesso per ricominciare. Serve solo un azione chiara e il supporto giusto.',
            bodyTwo: 'Il percorso resta semplice:',
            boxOneTitle: 'Invia BONUS100',
            boxOneCopy: 'Usa la keyword su WhatsApp',
            boxTwoTitle: 'Ricevi Supporto',
            boxTwoCopy: 'Lascia che il manager guidi la richiesta',
            boxThreeTitle: 'Prova L Esperienza',
            boxThreeCopy: 'Usa il bonus e valuta il ritorno con calma',
            bodyThree:
              'L opportunita e ancora disponibile se vuoi guardare al mercato con piu leggerezza e meno attrito.',
            bodyFour: 'Invia BONUS100 quando ti senti pronto.',
            ctaLabel: 'Fai Il Primo Passo Su WhatsApp',
          },
        }
      ),
    },
  },
  dormant_120d_bonus_followup_retained_email: {
    id: 'dormant_120d_bonus_followup_retained_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_followup_retained_email',
        {
          name: 'Dormant 120d - Bonus Request Confirmed A',
          description:
            'Positive follow-up after the user responds to the WhatsApp bonus invitation or reopens the conversation.',
          subject: 'Your Bullwaves bonus request has reopened the path.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your return is moving again',
            heroTitle: 'The conversation is active again',
            heroSubtitle:
              'Your manager can now guide the next steps around the 100 USD bonus and your comeback path.',
            mainTitle: 'A positive signal is already there. Now keep it moving.',
            introLead:
              'By replying or reopening the conversation, you have already taken the most important first step.',
            bodyOne:
              'From here, the goal is simple: make the activation smooth and turn the bonus opportunity into a useful return experience.',
            bodyTwo: 'What matters now:',
            boxOneTitle: 'Manager Follow-Through',
            boxOneCopy: 'Keep the WhatsApp conversation active',
            boxTwoTitle: 'Bonus Activation',
            boxTwoCopy: 'Confirm the practical details of your request',
            boxThreeTitle: 'Fresh Experience',
            boxThreeCopy: 'Use the bonus to test the platform again with confidence',
            bodyThree:
              'Stay in contact with your manager and complete the activation in the simplest possible way.',
            bodyFour: 'This is the best moment to turn initial interest into a real comeback.',
            ctaLabel: 'Continue With My Manager',
          },
        },
        {
          name: 'Dormant 120d - Bonus Request Confirmed B',
          description:
            'Warm continuation touch after the dormant user accepts the manager-led bonus path.',
          subject: 'Good news: your bonus path is now back in motion.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'You are already back in the conversation',
            heroTitle: 'Your bonus route is now open again',
            heroSubtitle:
              'Keep the momentum simple and let your manager guide the remaining steps.',
            mainTitle: 'The hardest part is already done: you reopened the door.',
            introLead:
              'This positive follow-up is here to keep the path warm and help you complete the experience calmly.',
            bodyOne:
              'Use this phase to confirm the bonus request, review the next step, and decide how you want to re-enter.',
            bodyTwo: 'Keep attention on:',
            boxOneTitle: 'Clarity',
            boxOneCopy: 'One simple step at a time',
            boxTwoTitle: 'Support',
            boxTwoCopy: 'Direct manager contact for quick answers',
            boxThreeTitle: 'Opportunity',
            boxThreeCopy: 'A fresh trading experience with practical upside',
            bodyThree:
              'You are now much closer to reactivation than before. Keep the dialogue active and complete the route.',
            bodyFour: 'A small follow-through now can create a much stronger restart.',
            ctaLabel: 'Keep My Return Active',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_followup_retained_email',
        {
          name: 'Dormant 120d - Richiesta Bonus Confermata A IT',
          description:
            'Follow-up positivo dopo la risposta alla proposta bonus su WhatsApp o la riapertura della conversazione.',
          subject: 'La tua richiesta bonus Bullwaves ha riaperto il percorso.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo ritorno si sta rimettendo in moto',
            heroTitle: 'La conversazione e di nuovo attiva',
            heroSubtitle:
              'Il tuo manager puo ora guidarti nei prossimi passi legati al bonus da 100 USD e al tuo rientro.',
            mainTitle: 'C e gia un segnale positivo. Adesso mantienilo vivo.',
            introLead:
              'Rispondendo o riaprendo la conversazione hai gia compiuto il passo piu importante.',
            bodyOne:
              'Da qui in avanti l obiettivo e semplice: rendere fluida la richiesta e trasformare il bonus in una esperienza di ritorno davvero utile.',
            bodyTwo: 'Ora conta soprattutto:',
            boxOneTitle: 'Follow-Through Manager',
            boxOneCopy: 'Mantieni attiva la conversazione su WhatsApp',
            boxTwoTitle: 'Attivazione Bonus',
            boxTwoCopy: 'Conferma i dettagli pratici della richiesta',
            boxThreeTitle: 'Nuova Esperienza',
            boxThreeCopy: 'Usa il bonus per riprovare la piattaforma con piu fiducia',
            bodyThree:
              'Resta in contatto con il tuo manager e completa l attivazione nel modo piu semplice possibile.',
            bodyFour:
              'Questo e il momento migliore per trasformare un primo interesse in un ritorno reale.',
            ctaLabel: 'Continua Con Il Mio Manager',
          },
        },
        {
          name: 'Dormant 120d - Richiesta Bonus Confermata B IT',
          description:
            'Variante di continuita dopo che l utente accetta il percorso bonus guidato dal manager.',
          subject: 'Buone notizie: il tuo percorso bonus si e rimesso in moto.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Sei gia tornato nella conversazione',
            heroTitle: 'La tua route bonus e di nuovo aperta',
            heroSubtitle:
              'Mantieni lo slancio semplice e lascia che il tuo manager ti guidi nei passaggi rimanenti.',
            mainTitle: 'La parte piu difficile e gia fatta: hai riaperto la porta.',
            introLead:
              'Questo follow-up positivo serve a mantenere caldo il percorso e aiutarti a completare l esperienza con calma.',
            bodyOne:
              'Usa questa fase per confermare la richiesta bonus, rivedere il prossimo passo e decidere come vuoi rientrare.',
            bodyTwo: 'Mantieni attenzione su:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Un passo semplice alla volta',
            boxTwoTitle: 'Supporto',
            boxTwoCopy: 'Contatto diretto del manager per risposte rapide',
            boxThreeTitle: 'Opportunita',
            boxThreeCopy: 'Una nuova esperienza di trading con un lato positivo concreto',
            bodyThree:
              'Ora sei molto piu vicino alla riattivazione. Tieni vivo il dialogo e completa il percorso.',
            bodyFour: 'Un piccolo follow-through oggi puo creare una ripartenza molto piu solida.',
            ctaLabel: 'Mantieni Attivo Il Mio Ritorno',
          },
        }
      ),
    },
  },
  dormant_120d_bonus_followup_recovery_email: {
    id: 'dormant_120d_bonus_followup_recovery_email',
    channel: 'email',
    locales: {
      en: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_followup_recovery_email',
        {
          name: 'Dormant 120d - Bonus Recovery Follow-up A',
          description:
            'Low-pressure recovery follow-up when the user has not yet claimed the 100 USD bonus.',
          subject: 'Your 100 USD WhatsApp bonus route is still available.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'The free-bonus invitation is still open',
            heroTitle: 'You can still request the 100 USD route',
            heroSubtitle:
              'If you have not replied yet, a simple WhatsApp message can still reopen the account path.',
            mainTitle: 'The opportunity is still here if you want a lighter re-entry.',
            introLead:
              'There is still time to contact your manager, send BONUS100, and explore a simpler way back.',
            bodyOne:
              'This follow-up keeps the offer clear and low-pressure for clients who have been away for a longer time.',
            bodyTwo: 'What remains available:',
            boxOneTitle: '100 USD Offer',
            boxOneCopy: 'The bonus route can still be requested',
            boxTwoTitle: 'WhatsApp Contact',
            boxTwoCopy: 'Your manager remains available to help',
            boxThreeTitle: 'Extra Experience',
            boxThreeCopy: 'A practical chance to test the platform again',
            bodyThree: 'If you want to use it, message your manager on WhatsApp and send BONUS100.',
            bodyFour: 'One simple message can be enough to restart the relationship.',
            ctaLabel: 'Request The Bonus Now',
          },
        },
        {
          name: 'Dormant 120d - Bonus Recovery Follow-up B',
          description:
            'Alternative recovery continuation for long-inactive users needing one more low-friction prompt.',
          subject: 'Still inactive? Your manager-led 100 USD bonus option remains open.',
          html: {
            lang: 'en',
            eyebrow: 'Bullwaves',
            title: 'Your comeback can still begin from WhatsApp',
            heroTitle: 'A smaller first step is still possible',
            heroSubtitle:
              'The simplest route back is still to contact your manager and ask for BONUS100.',
            mainTitle: 'There is no need to overthink the restart.',
            introLead:
              'If you want to give the platform another look, this bonus route keeps the pressure low and the value clear.',
            bodyOne:
              'The offer was created for exactly this moment: when the user is interested in returning but wants a more accessible first move.',
            bodyTwo: 'You still have access to:',
            boxOneTitle: 'Manager Help',
            boxOneCopy: 'Direct human support for the request',
            boxTwoTitle: 'Bonus Experience',
            boxTwoCopy: 'A practical re-entry option without a heavy start',
            boxThreeTitle: 'Potential Upside',
            boxThreeCopy: 'If results are positive, profits may be withdrawn',
            bodyThree:
              'Whenever you are ready, send BONUS100 on WhatsApp and let your manager do the rest.',
            bodyFour: 'The route remains open for you.',
            ctaLabel: 'Open WhatsApp And Start',
          },
        }
      ),
      it: makeAdditionalLocaleVariants(
        'dormant_120d_bonus_followup_recovery_email',
        {
          name: 'Dormant 120d - Follow-up Recovery Bonus A IT',
          description:
            'Follow-up recovery a bassa pressione quando il bonus da 100 USD non e ancora stato richiesto.',
          subject: 'Il tuo percorso bonus da 100 USD su WhatsApp e ancora disponibile.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'L invito al bonus gratuito e ancora aperto',
            heroTitle: 'Puoi ancora richiedere la route da 100 USD',
            heroSubtitle:
              'Se non hai ancora risposto, un semplice messaggio WhatsApp puo ancora riaprire il percorso account.',
            mainTitle: 'L opportunita e ancora qui se vuoi un rientro piu leggero.',
            introLead:
              'Hai ancora tempo per contattare il tuo manager, inviare BONUS100 e valutare un modo piu semplice per tornare.',
            bodyOne:
              'Questo follow-up mantiene l offerta chiara e senza pressione per clienti che sono stati lontani piu a lungo.',
            bodyTwo: 'Cosa resta disponibile:',
            boxOneTitle: 'Offerta 100 USD',
            boxOneCopy: 'Il percorso bonus puo ancora essere richiesto',
            boxTwoTitle: 'Contatto WhatsApp',
            boxTwoCopy: 'Il tuo manager resta disponibile per aiutarti',
            boxThreeTitle: 'Esperienza Extra',
            boxThreeCopy: 'Una occasione pratica per riprovare la piattaforma',
            bodyThree: 'Se vuoi usarla, scrivi al tuo manager su WhatsApp e invia BONUS100.',
            bodyFour: 'Un messaggio semplice puo bastare per riavviare la relazione.',
            ctaLabel: 'Richiedi Il Bonus Ora',
          },
        },
        {
          name: 'Dormant 120d - Follow-up Recovery Bonus B IT',
          description:
            'Continuazione recovery per utenti molto inattivi che hanno bisogno di un ultimo invito semplice.',
          subject:
            'Ancora inattivo? La tua opzione bonus da 100 USD guidata dal manager e ancora aperta.',
          html: {
            lang: 'it',
            eyebrow: 'Bullwaves',
            title: 'Il tuo ritorno puo ancora iniziare da WhatsApp',
            heroTitle: 'E ancora possibile un primo passo piu leggero',
            heroSubtitle:
              'La via piu semplice per tornare resta contattare il manager e chiedere BONUS100.',
            mainTitle: 'Non serve complicare la ripartenza.',
            introLead:
              'Se vuoi dare un altra occhiata alla piattaforma, questa route bonus mantiene bassa la pressione e chiaro il valore.',
            bodyOne:
              'L offerta e stata creata proprio per questo momento: quando c e curiosita di tornare ma serve un primo passo piu accessibile.',
            bodyTwo: 'Hai ancora accesso a:',
            boxOneTitle: 'Aiuto Del Manager',
            boxOneCopy: 'Supporto umano diretto per la richiesta',
            boxTwoTitle: 'Esperienza Bonus',
            boxTwoCopy: 'Una opzione di rientro concreta e piu leggera',
            boxThreeTitle: 'Potenziale Positivo',
            boxThreeCopy: 'Se il risultato e positivo, i profitti possono essere prelevati',
            bodyThree:
              'Quando vuoi, invia BONUS100 su WhatsApp e lascia che il manager ti accompagni nel resto.',
            bodyFour: 'Il percorso resta aperto per te.',
            ctaLabel: 'Apri WhatsApp E Inizia',
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
            skin: 'light',
            eyebrow: 'Bullwaves',
            title: 'È aperto un percorso semplice di ritorno',
            heroTitle: 'Il tuo account merita ancora di essere riattivato',
            heroSubtitle: 'Questo è un touch pratico per aiutarti a ripartire senza pressione.',
            mainTitle: 'Un profilo dormant può tornare attivo con un passo chiaro.',
            introLead:
              'La tua attività passata ha mostrato valore. Questo messaggio serve a riaprire la relazione in modo utile e ordinato.',
            bodyOne:
              'L’obiettivo è aiutarti a rientrare, rivedere l’account e ripartire da una struttura più leggera.',
            bodyTwo: 'Questo touch ti aiuta a recuperare:',
            boxOneTitle: 'Chiarezza',
            boxOneCopy: 'Un prossimo passo visibile da fare ora',
            boxTwoTitle: 'Continuità',
            boxTwoCopy: 'Un rientro più semplice in piattaforma',
            boxThreeTitle: 'Slancio',
            boxThreeCopy: 'Una ripartenza più stabile',
            bodyThree: 'Apri la tua area cliente e rivedi il percorso di riattivazione.',
            bodyFour: 'Se serve, il supporto resta disponibile per un check rapido.',
            ctaLabel: 'Apri la Mia Area Cliente',
          },
        },
        {
          name: 'Dormant Value - Reactivation Touch B IT',
          description: 'Variante di ritorno per utenti value che si sono raffreddati.',
          subject: 'È disponibile un modo più chiaro per ripartire con Bullwaves.',
          html: {
            lang: 'it',
            skin: 'light',
            eyebrow: 'Bullwaves',
            title: 'Riparti con meno attrito',
            heroTitle: 'Il miglior ritorno è semplice e pratico',
            heroSubtitle: 'Non serve un reset duro, ma un percorso di rientro più chiaro.',
            mainTitle: 'Il tuo account può ancora recuperare valore da qui.',
            introLead:
              'Questo aggiornamento è pensato per profili che hanno mostrato potenziale ma hanno perso continuità recente.',
            bodyOne:
              'Usa questa fase per ripartire dalla piattaforma e ricostruire un ritmo account più regolare.',
            bodyTwo: 'Ora concentrati su:',
            boxOneTitle: 'Rientro',
            boxOneCopy: 'Torna con un’azione semplice',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Riduci il pattern a intermittenza',
            boxThreeTitle: 'Recovery',
            boxThreeCopy: 'Preserva il valore della relazione',
            bodyThree: 'Rientra nella tua area cliente e riparti dal percorso attuale.',
            bodyFour: 'Il supporto c’è se un dettaglio richiede più contesto.',
            ctaLabel: 'Riattiva il Mio Percorso',
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
          subject: 'Il tuo piano guidato di ritorno è pronto dentro Bullwaves.',
          html: {
            lang: 'it',
            skin: 'light',
            eyebrow: 'Bullwaves Return Plan',
            title: 'Il tuo piano guidato di ritorno è pronto',
            heroTitle: 'Riparti con una sequenza chiara',
            heroSubtitle:
              'Un percorso semplice aiuta i profili dormant a tornare con più continuità.',
            mainTitle: 'Il prossimo passo funziona meglio quando è strutturato.',
            introLead:
              'Questo piano riduce l’incertezza e rende il tuo rientro più facile da completare.',
            bodyOne:
              'Segui i prossimi step in piattaforma per riallacciare il rapporto con l’account in modo più pratico.',
            bodyTwo: 'Questo piano migliora:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Una sequenza di rientro più pulita',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Meno rumore nelle prossime azioni',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Maggiore probabilità di restare attivo',
            bodyThree: 'Apri la tua area cliente e rivedi il piano guidato di ritorno.',
            bodyFour: 'Il supporto è disponibile se vuoi confermare il primo passo.',
            ctaLabel: 'Vedi il Mio Piano di Rientro',
          },
        },
        {
          name: 'Dormant Value - Guided Return Plan B IT',
          description: 'Variante execution-led per trader dormant value.',
          subject:
            'Il tuo percorso di ritorno Bullwaves è ancora aperto e ora è più facile da seguire.',
          html: {
            lang: 'it',
            skin: 'light',
            eyebrow: 'Bullwaves Return Plan',
            title: 'È attiva una via di ritorno più chiara',
            heroTitle: 'Riduci l’incertezza e riparti bene',
            heroSubtitle: 'Il percorso di ritorno ora è più pratico e più semplice da usare.',
            mainTitle: 'Le prossime azioni devono sentirsi più leggere, non più pesanti.',
            introLead: 'Questa sequenza ti aiuta a ricollegarti con più direzione e meno attrito.',
            bodyOne: 'Usala per recuperare continuità ed evitare un ciclo dormant più lungo.',
            bodyTwo: 'Ti supporta su:',
            boxOneTitle: 'Semplicità',
            boxOneCopy: 'Una ripartenza più leggera',
            boxTwoTitle: 'Coerenza',
            boxTwoCopy: 'Un ritmo account più stabile',
            boxThreeTitle: 'Chiarezza',
            boxThreeCopy: 'Prossime azioni chiare in piattaforma',
            bodyThree: 'Torna dalla tua area cliente e continua dal piano aggiornato.',
            bodyFour: 'Il supporto resta opzionale se vuoi un chiarimento rapido.',
            ctaLabel: 'Continua il Mio Ritorno',
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
            skin: 'light',
            eyebrow: 'Bullwaves Continuity',
            title: 'Proteggi lo slancio del tuo ritorno',
            heroTitle: 'Non lasciare che la ripartenza si raffreddi di nuovo',
            heroSubtitle:
              'Una breve azione finale può mantenere il tuo account in una fascia attiva migliore.',
            mainTitle: 'Ora conta soprattutto la continuità.',
            introLead:
              'Dopo il primo segnale positivo, la mossa migliore è tenere il percorso account stabile e semplice.',
            bodyOne:
              'Questo rinforzo ti aiuta a evitare un altro ciclo stop and go e sostiene una retention migliore.',
            bodyTwo: 'Ora dai priorità a:',
            boxOneTitle: 'Regolarità',
            boxOneCopy: 'Mantieni l’account attivo in sequenza',
            boxTwoTitle: 'Attenzione',
            boxTwoCopy: 'Segui chiaramente il prossimo checkpoint',
            boxThreeTitle: 'Stabilità',
            boxThreeCopy: 'Evita il raffreddamento dopo il ritorno',
            bodyThree: 'Apri la piattaforma e conferma il prossimo step di continuità.',
            bodyFour: 'Il supporto può aiutarti se vuoi un ultimo orientamento rapido.',
            ctaLabel: 'Mantieni Attivo il Mio Account',
          },
        },
        {
          name: 'Dormant Value - Continuity Reinforcement B IT',
          description:
            'Promemoria focalizzato sulla stabilità per profili dormant value in recovery.',
          subject: 'Il tuo ritorno Bullwaves sta migliorando. Ora rendilo più costante.',
          html: {
            lang: 'it',
            skin: 'light',
            eyebrow: 'Bullwaves Continuity',
            title: 'Stabilizza il percorso che hai riavviato',
            heroTitle: 'Un buon ritorno diventa utile solo se dura',
            heroSubtitle: 'Questo step ti aiuta a non perdere troppo presto il progresso fatto.',
            mainTitle: 'Usa lo slancio attuale per fissare la continuità.',
            introLead:
              'Un pattern account stabile si preserva meglio quando il prossimo passo è semplice e visibile.',
            bodyOne:
              'Continua ora dalla piattaforma e mantieni il recovery allineato a una cadenza più pulita.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Direzione',
            boxOneCopy: 'Prossime azioni chiare',
            boxTwoTitle: 'Ritmo',
            boxTwoCopy: 'Attività account regolare',
            boxThreeTitle: 'Qualità recovery',
            boxThreeCopy: 'Un ritorno più forte',
            bodyThree:
              'Rientra nella tua area cliente e mantieni il percorso account in movimento.',
            bodyFour: 'Il supporto resta disponibile per un check tattico se utile.',
            ctaLabel: 'Continua il Mio Recovery',
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
          subject: 'Buona notizia: il tuo account Bullwaves è tornato in linea.',
          html: {
            lang: 'it',
            skin: 'light',
            eyebrow: 'Bullwaves',
            title: 'Il tuo recupero è confermato',
            heroTitle: 'Hai rimesso in movimento il tuo account',
            heroSubtitle: 'Il prossimo obiettivo è mantenere attiva questa continuità nel tempo.',
            mainTitle: 'Il ritorno ha funzionato. Ora mantieni il ritmo stabile.',
            introLead: 'Questo follow-up conferma un esito positivo del tuo percorso di recovery.',
            bodyOne:
              'Continua dalla tua area cliente e usa lo slancio attuale per preservare attività regolare.',
            bodyTwo: 'Mantieni il focus su:',
            boxOneTitle: 'Coerenza',
            boxOneCopy: 'Resta regolare nelle prossime azioni',
            boxTwoTitle: 'Chiarezza',
            boxTwoCopy: 'Segui il percorso in piattaforma passo dopo passo',
            boxThreeTitle: 'Retention',
            boxThreeCopy: 'Tieni l’account fuori dalla dormancy',
            bodyThree: 'Apri la tua area cliente e continua dal percorso confermato.',
            bodyFour: 'Il supporto resta disponibile se vuoi un check rapido di direzione.',
            ctaLabel: 'Continua il Mio Percorso Attivo',
          },
        },
        {
          name: 'Dormant Value - Positive Follow-up B IT',
          description: 'Messaggio di continuità dopo recovery riuscito.',
          subject: 'La tua riattivazione è confermata. Mantieni il tuo account in movimento.',
          html: {
            lang: 'it',
            skin: 'light',
            eyebrow: 'Bullwaves',
            title: 'Proteggi il ritorno che hai creato',
            heroTitle: 'Un account stabile è sempre più facile da far crescere',
            heroSubtitle: 'La prossima mossa migliore è mantenere il profilo attivo e semplice.',
            mainTitle: 'Usa questa fase positiva per costruire continuità.',
            introLead:
              'Hai già recuperato dalla dormancy. Il prossimo valore arriva dal comportamento regolare.',
            bodyOne: 'Mantieni la cadenza pulita, le azioni chiare e continua dalla piattaforma.',
            bodyTwo: 'Mantieni:',
            boxOneTitle: 'Ritmo',
            boxOneCopy: 'Attività regolare con meno attrito',
            boxTwoTitle: 'Focus',
            boxTwoCopy: 'Prossime decisioni chiare',
            boxThreeTitle: 'Stabilità',
            boxThreeCopy: 'Continuità attiva più lunga',
            bodyThree: 'Continua dalla tua area cliente e mantieni il percorso attuale.',
            bodyFour: 'Il supporto è opzionale se vuoi un chiarimento veloce.',
            ctaLabel: 'Mantieni il Mio Slancio',
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
