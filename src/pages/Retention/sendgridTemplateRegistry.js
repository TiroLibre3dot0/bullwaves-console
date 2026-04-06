const WHATSAPP_NUMBER = '35799514794'

const WHATSAPP_TEXT = {
  en: 'Hi Bullwaves, I would like help with the next step on my account.',
  it: 'Ciao Bullwaves, vorrei supporto per il prossimo passo sul mio account.',
}

function getLocalizedSupportUrl(locale = 'en') {
  const normalizedLocale = locale === 'it' ? 'it' : 'en'
  return (
    'https://wa.me/' +
    WHATSAPP_NUMBER +
    '?text=' +
    encodeURIComponent(WHATSAPP_TEXT[normalizedLocale])
  )
}

export const SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS = {
  cta_url: 'https://portal.bullwaves.com/login',
  account_manager_name: 'The Bullwaves Team',
}

export const sendgridTemplateRegistryGeneratedAt = '2026-04-06T16:15:00.982Z'

export const sendgridTemplateRegistry = {
  most_consistent_badge_award_email: {
    en: {
      a: {
        templateId: 'd-31642f9a4e79418a8b485a9a53f37622',
        versionId: 'a685f89f-7bf1-4570-b852-3ee1c80b5ce3',
        name: 'Most Consistent - Badge Award A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}You earned your Bullwaves consistency badge.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-8d6e8e0b3f434106a774d66fceb292df',
        versionId: 'a27c7985-b374-447f-8fb4-8f6eb7373c1e',
        name: 'Most Consistent - Badge Award B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your consistency is now a growth asset on Bullwaves.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-2f823bcbf61f48c79db0ef3f4c3af94f',
        versionId: '0aa5cfb3-eb8d-4180-97e9-70ab34964f8c',
        name: 'Most Consistent - Badge Award A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Hai ottenuto il tuo badge Bullwaves di consistenza.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
      b: {
        templateId: 'd-21af5f4b88d34859ad0536a4dafc2852',
        versionId: 'c56db601-e4d4-4530-9ccd-47e9af90509d',
        name: 'Most Consistent - Badge Award B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua costanza è ora un asset di crescita su Bullwaves.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
    },
  },
  most_consistent_cycle_restart_email: {
    en: {
      a: {
        templateId: 'd-d8d39c76dbe54711952e24fcc53d3a6c',
        versionId: '87e07cb2-3d52-476f-afcd-7d59102348ac',
        name: 'Most Consistent - Cycle Restart A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Restart your Bullwaves cycle with a cleaner challenge path.',
        timing: 'D30',
        delay: '+30 days after last low-engagement cycle',
      },
      b: {
        templateId: 'd-0e32d4c45f384bd4a926a5939df0015c',
        versionId: '75ebb36a-4153-4cba-94e2-99efb434a833',
        name: 'Most Consistent - Cycle Restart B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}A cleaner Bullwaves restart is still available to you.',
        timing: 'D30',
        delay: '+30 days after last low-engagement cycle',
      },
    },
    it: {
      a: {
        templateId: 'd-4d6d048959974f4fb6c2ff8121f8d216',
        versionId: '3be17999-a17d-4f6d-b04a-35ff8d2bcf0b',
        name: 'Most Consistent - Cycle Restart A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Riavvia il tuo ciclo Bullwaves con un percorso challenge più chiaro.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
      },
      b: {
        templateId: 'd-fdf04137cd3644fc8acc9bd1e6fd993b',
        versionId: 'def6ad4c-858d-40df-bfbc-bccb347dab76',
        name: 'Most Consistent - Cycle Restart B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Una ripartenza Bullwaves più pulita è ancora disponibile per te.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
      },
    },
  },
  most_consistent_growth_roadmap_email: {
    en: {
      a: {
        templateId: 'd-e3c7e6faa68a4d37b34fc804a74b7950',
        versionId: '56170400-61e0-4eb2-9053-ac19a215bbdb',
        name: 'Most Consistent - Growth Roadmap A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your Bullwaves roadmap is ready. Let consistency become growth.',
        timing: 'D7',
        delay: '+7 days after badge award',
      },
      b: {
        templateId: 'd-f803cc4f9a614b39a22015c7ccf451a2',
        versionId: 'cff42208-f92e-4167-b6c7-ab175d3153a9',
        name: 'Most Consistent - Growth Roadmap B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}A steadier trader should never feel directionless.',
        timing: 'D7',
        delay: '+7 days after badge award',
      },
    },
    it: {
      a: {
        templateId: 'd-7e47782868a04b89b3b5a16b8c7e1d87',
        versionId: 'd02c72e1-ff13-4518-9fe0-a2a2bf6aab2b',
        name: 'Most Consistent - Growth Roadmap A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua roadmap Bullwaves è pronta. Trasforma la costanza in crescita.',
        timing: 'D7',
        delay: '+7 giorni dopo il badge',
      },
      b: {
        templateId: 'd-eec3580790fe44df947628c9111c13fb',
        versionId: '2a224bca-f8b8-46cd-befd-5f0467aab0c6',
        name: 'Most Consistent - Growth Roadmap B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Un trader più costante non dovrebbe mai sentirsi senza direzione.',
        timing: 'D7',
        delay: '+7 giorni dopo il badge',
      },
    },
  },
  most_consistent_loyalty_reward_email: {
    en: {
      a: {
        templateId: 'd-7f3727ece96046629caa4bc2fb43ddce',
        versionId: 'd0e4f30e-ee82-46d2-ae1c-a78ea6fff5c1',
        name: 'Most Consistent - Loyalty Reward A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your consistency is unlocking a Bullwaves loyalty reward.',
        timing: 'D21',
        delay: '+14 days after growth roadmap',
      },
      b: {
        templateId: 'd-5b37b38c4b814231834658060ba062bb',
        versionId: '3fe59f2b-ae9c-4ff7-aa21-90b93b07471d',
        name: 'Most Consistent - Loyalty Reward B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Stable effort deserves a stronger Bullwaves reward signal.',
        timing: 'D21',
        delay: '+14 days after growth roadmap',
      },
    },
    it: {
      a: {
        templateId: 'd-bd8b42b3070648bb9d343d63c1423151',
        versionId: '835c668d-09f3-400d-96de-b7b61b3dabe8',
        name: 'Most Consistent - Loyalty Reward A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua costanza sta sbloccando una loyalty reward Bullwaves.',
        timing: 'D21',
        delay: '+14 giorni dopo la roadmap',
      },
      b: {
        templateId: 'd-150de87c87274b0c8679f68e18ab76b6',
        versionId: '84ebd387-6c61-486e-bb3c-5092b9adfff9',
        name: 'Most Consistent - Loyalty Reward B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Uno sforzo stabile merita un segnale reward Bullwaves più forte.',
        timing: 'D21',
        delay: '+14 giorni dopo la roadmap',
      },
    },
  },
  most_consistent_top_performers_onboarding_email: {
    en: {
      a: {
        templateId: 'd-b5ab537b3fb548cfb956bd2d816a08ba',
        versionId: '80cbb0e0-e1cf-4820-ba24-c6bdd1b1112c',
        name: 'Most Consistent - Top Performers Onboarding A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}You are ready for the Bullwaves Top Performers path.',
        timing: 'PROMO +0d',
        delay: 'Immediately after promotion to Top Performers',
      },
      b: {
        templateId: 'd-b948c7539266423f9f76f06624e1b100',
        versionId: '1f32fa72-7af1-4490-afe7-a6d47a9fcd49',
        name: 'Most Consistent - Top Performers Onboarding B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your Bullwaves profile is moving into a stronger segment.',
        timing: 'PROMO +0d',
        delay: 'Immediately after promotion to Top Performers',
      },
    },
    it: {
      a: {
        templateId: 'd-e7b555b8e1c64d39855244af288f8ec0',
        versionId: 'aea27c33-46bb-49a6-b146-6cb4e211c92b',
        name: 'Most Consistent - Top Performers Onboarding A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Sei pronto per il percorso Bullwaves Top Performers.',
        timing: 'PROMO +0d',
        delay: 'Immediatamente dopo la promozione a Top Performers',
      },
      b: {
        templateId: 'd-aa8a53658af448d89007f1daf5c8bdf3',
        versionId: '4289a624-0104-4a8c-bd09-183c5b0a167d',
        name: 'Most Consistent - Top Performers Onboarding B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Il tuo profilo Bullwaves sta entrando in un segmento più forte.',
        timing: 'PROMO +0d',
        delay: 'Immediatamente dopo la promozione a Top Performers',
      },
    },
  },
  top_performing_advanced_tools_email: {
    en: {
      a: {
        templateId: 'd-fd315c32b0c3473f871c502aed0ae704',
        versionId: '09beae2a-0788-4e78-b1a4-eecc0a590a87',
        name: 'Top Performing - Advanced Tools A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}A stronger trader should have a sharper support stack.',
        timing: 'D3',
        delay: '+3 days after VIP recognition',
      },
      b: {
        templateId: 'd-ff0ba92ab7c84d099ca890eb106bf6f9',
        versionId: 'efac0a60-ba7a-4d2f-8f36-85de855234b8',
        name: 'Top Performing - Advanced Tools B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Protecting edge often starts with a better operating environment.',
        timing: 'D3',
        delay: '+3 days after VIP recognition',
      },
    },
    it: {
      a: {
        templateId: 'd-80fc5e3936de468f8434803d0405064d',
        versionId: '0aa22212-af3c-4395-9f08-039a039ac983',
        name: 'Top Performing - Advanced Tools A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Un trader più forte dovrebbe avere un support stack più affilato.',
        timing: 'D3',
        delay: '+3 giorni dopo il touch VIP',
      },
      b: {
        templateId: 'd-7d6f773744f949a2a2c05abb0b6c64e6',
        versionId: '4c2e636e-3b07-4b46-9d93-ef6f8ebd8161',
        name: 'Top Performing - Advanced Tools B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Proteggere il vantaggio spesso inizia da un ambiente operativo migliore.',
        timing: 'D3',
        delay: '+3 giorni dopo il touch VIP',
      },
    },
  },
  top_performing_loyalty_upgrade_email: {
    en: {
      a: {
        templateId: 'd-643b3ce425064a4ab7e2c74f2e20c685',
        versionId: 'e41afa3d-dd9d-430d-a3be-f30eb413af3f',
        name: 'Top Performing - Loyalty Upgrade A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your consistency is opening premium loyalty treatment.',
        timing: 'D10',
        delay: '+7 days after advanced tools offer',
      },
      b: {
        templateId: 'd-dae73318a0d24bc190fa649ec89d4939',
        versionId: '8dfaf5ed-1108-4fac-82e3-dce7f05d0bfd',
        name: 'Top Performing - Loyalty Upgrade B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}A stronger loyalty tier is ready for your Bullwaves profile.',
        timing: 'D10',
        delay: '+7 days after advanced tools offer',
      },
    },
    it: {
      a: {
        templateId: 'd-c1b95ab7257c4fc28269fffee2655995',
        versionId: 'b6b8aef1-62ef-4a3b-91fe-405249e2b0de',
        name: 'Top Performing - Loyalty Upgrade A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua continuità sta aprendo un trattamento loyalty premium.',
        timing: 'D10',
        delay: '+7 giorni dopo l offerta strumenti avanzati',
      },
      b: {
        templateId: 'd-ca5d71a32d57464bbd89dc167d60f2d8',
        versionId: '28508bba-89a4-42d7-9c81-1bc244b14811',
        name: 'Top Performing - Loyalty Upgrade B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Un loyalty tier più forte e pronto per il tuo profilo Bullwaves.',
        timing: 'D10',
        delay: '+7 giorni dopo l offerta strumenti avanzati',
      },
    },
  },
  top_performing_premium_nurture_email: {
    en: {
      a: {
        templateId: 'd-e9f088fc7afb4674a9208f6d2c55f2bb',
        versionId: '139c5f5c-6665-4ece-af63-409b72b4b4fd',
        name: 'Top Performing - Premium Nurture A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Keep your Bullwaves premium momentum alive.',
        timing: 'D30',
        delay: '+30 days after last premium touch',
      },
      b: {
        templateId: 'd-ad718748095f41ef9105242132d1f9a0',
        versionId: '3ac1cac2-b00a-4344-8989-d561501330c8',
        name: 'Top Performing - Premium Nurture B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}A premium relationship stays strong through intelligent continuity.',
        timing: 'D30',
        delay: '+30 days after last premium touch',
      },
    },
    it: {
      a: {
        templateId: 'd-e6b25ed95940492fbfa993a3c0a90423',
        versionId: 'c8b4da45-23ea-4c59-a938-2ba17d52c75d',
        name: 'Top Performing - Premium Nurture A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Mantieni vivo il tuo premium momentum su Bullwaves.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo touch premium',
      },
      b: {
        templateId: 'd-b3c2ee22965c43ac92f6c92d80b45bdf',
        versionId: '7097607f-3a8c-4ca0-92c8-750a6ca51d66',
        name: 'Top Performing - Premium Nurture B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Una relazione premium resta forte con continuità intelligente.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo touch premium',
      },
    },
  },
  top_performing_vip_recognition_email: {
    en: {
      a: {
        templateId: 'd-972402e449914928b86750bd6527c12d',
        versionId: 'fa891cc3-a7e9-423e-84d4-9d0298569252',
        name: 'Top Performing - VIP Recognition A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}You are among Bullwaves top performers. We built your next step accordingly.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-cf74cddc846c4e5ba909aca69102fa5b',
        versionId: '7ff45206-c84d-4ef2-a47f-b015c0942a03',
        name: 'Top Performing - VIP Recognition B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your trading profile unlocked a more tailored Bullwaves path.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-0a7145f002b44f97aebbeec84b918bf1',
        versionId: 'a08f0ca8-802e-48a2-98fe-c66bc80eec26',
        name: 'Top Performing - VIP Recognition A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Sei tra i top performer Bullwaves. Il prossimo step e costruito di conseguenza.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
      b: {
        templateId: 'd-644aaf5d6af64564993d198279aba9dd',
        versionId: '26484d89-5a76-4d87-8fd7-8ebe872b720d',
        name: 'Top Performing - VIP Recognition B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Il tuo profilo trading ha sbloccato un percorso Bullwaves più su misura.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
    },
  },
  top_performing_vip_review_email: {
    en: {
      a: {
        templateId: 'd-2343c2b7227143c98239ce0893015e9c',
        versionId: 'afe6bede-8deb-4e80-9831-fc19d61dab55',
        name: 'Top Performing - VIP Review A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your quarterly Bullwaves VIP review is ready.',
        timing: 'Q+0d',
        delay: 'At the start of the quarterly review cycle',
      },
      b: {
        templateId: 'd-7cb0344af4a044f5965e4aba6d99c5b4',
        versionId: 'c25bbf54-b1f4-4f02-8e77-6ec00b5fb2d8',
        name: 'Top Performing - VIP Review B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}A stronger next quarter starts with a sharper review now.',
        timing: 'Q+0d',
        delay: 'At the start of the quarterly review cycle',
      },
    },
    it: {
      a: {
        templateId: 'd-6e515e09b751404a95792537cd5deb56',
        versionId: 'c4e2f5af-9fa6-4f30-860c-f2425f847357',
        name: 'Top Performing - VIP Review A IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua review VIP trimestrale Bullwaves è pronta.',
        timing: 'Q+0d',
        delay: 'All inizio del ciclo review trimestrale',
      },
      b: {
        templateId: 'd-7e10afc6245d4089b124e0662ec996e7',
        versionId: 'e24ead62-951d-4d17-86c6-d8b19955e5cc',
        name: 'Top Performing - VIP Review B IT',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Un prossimo trimestre più forte parte da una review più lucida oggi.',
        timing: 'Q+0d',
        delay: 'All inizio del ciclo review trimestrale',
      },
    },
  },
  unfunded_newcomers_first_deposit_push_email: {
    en: {
      a: {
        templateId: 'd-92da8490d8264618be2e00775aec4629',
        versionId: '4d6a8306-2269-4ee4-a2e5-b42f24b0e036',
        name: 'Unfunded Newcomers - First Deposit Push A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your Bullwaves access is almost unlocked. Complete your first deposit now.',
        timing: 'D5',
        delay: '+3 days after friction-reduction message',
      },
      b: {
        templateId: 'd-7b47f5e61780443799ee40a531568b38',
        versionId: 'ece7d409-5b24-42b4-a2b5-5d003de3a822',
        name: 'Unfunded Newcomers - First Deposit Push B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Do not lose momentum. Finish the funding step today.',
        timing: 'D5',
        delay: '+3 days after friction-reduction message',
      },
    },
    it: {
      a: {
        templateId: 'd-c010b6bf217b4177b61707a8c557cbee',
        versionId: '05cf59b6-9cc9-4783-a550-a9faa3305626',
        name: 'Unfunded Newcomers - Primo Deposito A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Il tuo accesso Bullwaves e quasi sbloccato. Completa ora il primo deposito.',
        timing: 'D5',
        delay: '+3 giorni dopo il messaggio di riduzione attriti',
      },
      b: {
        templateId: 'd-0fe9ba896386456b95b5c53b76a88268',
        versionId: '2d89beee-9287-47c1-8237-58c62f0be736',
        name: 'Unfunded Newcomers - Primo Deposito B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Non perdere slancio. Completa oggi il deposito del tuo account.',
        timing: 'D5',
        delay: '+3 giorni dopo il messaggio di riduzione attriti',
      },
    },
  },
  unfunded_newcomers_first_trade_onboarding_email: {
    en: {
      a: {
        templateId: 'd-192758b6508240d89507053f69f9ca9b',
        versionId: '567f50be-6dd8-4120-a7d4-87ed1ab67417',
        name: 'Unfunded Newcomers - First Trade Onboarding A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your account is funded. Now make your first move.',
        timing: 'FTD +0d',
        delay: 'Immediately after successful first deposit',
      },
      b: {
        templateId: 'd-33fe70fd80864e70b6eae74a4553fa07',
        versionId: '65c51c8e-41ca-4f32-8ba0-2d93b79ba0fb',
        name: 'Unfunded Newcomers - First Trade Onboarding B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your first trade does not need to be complicated.',
        timing: 'FTD +0d',
        delay: 'Immediately after successful first deposit',
      },
    },
    it: {
      a: {
        templateId: 'd-662382ac8cc146fa9f3f7fc67a0b77df',
        versionId: 'b2122d15-7135-4cf9-b5cb-77b887b5bd77',
        name: 'Unfunded Newcomers - Onboarding Primo Trade A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Il tuo account è finanziato. Ora fai il tuo primo passo.',
        timing: 'FTD +0d',
        delay: 'Immediatamente dopo il primo deposito riuscito',
      },
      b: {
        templateId: 'd-b9dc4454a1e1468988bf4e3e3ce336b1',
        versionId: 'f998b653-f80b-48a8-afd3-fc4e7643926c',
        name: 'Unfunded Newcomers - Onboarding Primo Trade B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua prima operazione non deve essere complicata.',
        timing: 'FTD +0d',
        delay: 'Immediatamente dopo il primo deposito riuscito',
      },
    },
  },
  unfunded_newcomers_friction_reduction_email: {
    en: {
      a: {
        templateId: 'd-070656e9654c4cda8b3388c4840c1a6e',
        versionId: '7d929f01-6cf0-42be-989c-dd368e5e67e5',
        name: 'Unfunded Newcomers - Friction Reduction A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Questions before funding? Here is the fastest way forward.',
        timing: 'D2',
        delay: '+2 days after welcome message',
      },
      b: {
        templateId: 'd-7e2d3e8aa47b45dbbc161d0e2d5cf044',
        versionId: '7b381c67-9b72-4193-8f88-935b07931072',
        name: 'Unfunded Newcomers - Friction Reduction B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Still hesitating? The deposit step may be simpler than you think.',
        timing: 'D2',
        delay: '+2 days after welcome message',
      },
    },
    it: {
      a: {
        templateId: 'd-4bd5fd578c7f4d6f933da6670c20e8b6',
        versionId: 'df257034-2601-4f6e-8d62-7f67addf055c',
        name: 'Unfunded Newcomers - Riduzione Attriti A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Hai dubbi prima di depositare? Ecco il modo più semplice per procedere.',
        timing: 'D2',
        delay: '+2 giorni dopo il welcome message',
      },
      b: {
        templateId: 'd-1f46366f7120412dab51635e793f5827',
        versionId: '2f0e6d0c-c3c8-465b-9354-97d8423c16a4',
        name: 'Unfunded Newcomers - Riduzione Attriti B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Sei ancora indeciso? Il deposito potrebbe essere più semplice di quanto pensi.',
        timing: 'D2',
        delay: '+2 giorni dopo il welcome message',
      },
    },
  },
  unfunded_newcomers_reentry_nurture_email: {
    en: {
      a: {
        templateId: 'd-16dec51da32a4f82827b8992b253f193',
        versionId: 'cf39ee05-5e3d-4117-892f-02ff01c33735',
        name: 'Unfunded Newcomers - Re-entry Nurture A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Still considering Bullwaves? Let us make the next step easier.',
        timing: 'D21',
        delay: '+21 days after last non-converted step',
      },
      b: {
        templateId: 'd-3d042316676145358bf4ab756802e645',
        versionId: '492adbf6-da7b-4b4e-8728-6bcd15a6be43',
        name: 'Unfunded Newcomers - Re-entry Nurture B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your opportunity is still open. Re-enter with a clearer path.',
        timing: 'D21',
        delay: '+21 days after last non-converted step',
      },
    },
    it: {
      a: {
        templateId: 'd-6e3163dc104c4c0a93199ff9d4b2fdf7',
        versionId: '276a02fb-2a34-490a-892d-b825866784bf',
        name: 'Unfunded Newcomers - Riattivazione Soft A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Stai ancora valutando Bullwaves? Rendiamo il prossimo passo più semplice.',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
      b: {
        templateId: 'd-ba0178bae6f342038ad4f550dc06a1ef',
        versionId: '580994e6-a223-431b-9029-c21ffa6a4879',
        name: 'Unfunded Newcomers - Riattivazione Soft B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}La tua opportunità è ancora aperta. Rientra con un percorso più chiaro.',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
    },
  },
  unfunded_newcomers_welcome_value_email: {
    en: {
      a: {
        templateId: 'd-6dbc11007c244c8ab87e2d4d8fa015e4',
        versionId: '8f3f5fac-a2d8-4042-90e1-08b7fa82e8bb',
        name: 'Unfunded Newcomers - Welcome + Value Proposition A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your Bullwaves account is ready. Funding it takes just one step.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-26cf50cb8d944f58ae436eb14a13d687',
        versionId: '756f8692-e74b-4452-af58-9b6eb32e1bb1',
        name: 'Unfunded Newcomers - Welcome + Value Proposition B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Your registration is done. Unlock the next step on Bullwaves.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-48d554bff2534e92a62f33b936cd51ce',
        versionId: 'd6e95aeb-f3b0-4b51-9720-bb53c74461aa',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore A',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Il tuo account Bullwaves e pronto. Ti manca solo un passo.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
      b: {
        templateId: 'd-260c34d7c84c4ef280ee7dfd8538bf99',
        versionId: '6259cffa-0173-4176-a40f-6f1ccc1f05a5',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore B',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Registrazione completata. Sblocca il prossimo passaggio su Bullwaves.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
    },
  },
}

export function getSendgridTemplateMapping(localTemplateId, locale = 'en', variant = 'a') {
  return sendgridTemplateRegistry?.[localTemplateId]?.[locale]?.[variant] || null
}

export function buildSendgridDynamicTemplateData(overrides = {}) {
  const locale = overrides?.locale === 'it' ? 'it' : 'en'
  return Object.fromEntries(
    Object.entries({
      ...SENDGRID_DYNAMIC_TEMPLATE_DEFAULTS,
      support_url: overrides?.support_url ?? getLocalizedSupportUrl(locale),
      ...overrides,
    }).filter(([, value]) => value !== undefined)
  )
}
