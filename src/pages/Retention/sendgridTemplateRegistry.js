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

export const sendgridTemplateRegistryGeneratedAt = '2026-06-11T14:15:38.720Z'

export const sendgridTemplateRegistry = {
  'bullwaves-welcome-after-confirmation-new': {
    en: {
      a: {
        templateId: 'd-22ccc9c8d3e849d19274fcda5b19e97a',
        versionId: '9c27d8b6-9591-4478-9b1c-cfea6a7ae5fb',
        name: 'Bullwaves - Welcome mail after confirmation - New',
        subject: 'Welcome to Bullwaves: your account is ready to fund and trade',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-account-created-en': {
    en: {
      a: {
        templateId: 'd-009f155242c94d149aac0331d83d54ff',
        versionId: '7a02ee6c-d3c0-48da-9000-35bc850f5124',
        name: 'Bullwaves Account Created',
        subject: 'Welcome to Bullwaves: your trading account is now active',
        timing: null,
        delay: null,
      },
    },
  },
  'acuity-bullwaves-46-en': {
    en: {
      a: {
        templateId: 'd-374d71b1d6844f1f82079e4914bc7f6e',
        versionId: '2962f245-8578-443a-b713-6e26ce7422ba',
        name: 'Bullwaves Acuity Visual #46',
        subject: 'Key Moves Traders Should Watch This Week',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-email-verification-en': {
    en: {
      a: {
        templateId: 'd-cc97d9acd4d741f6afe11d751c2e2074',
        versionId: 'f985dc23-42f3-4ca9-a094-54ca5de051e4',
        name: 'Bullwaves Email Verification',
        subject: 'Verify your Bullwaves email to activate your account',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-global-exclusive-tradable-bonus-en': {
    en: {
      a: {
        templateId: 'd-a85d95d1d2174eb8b62a6d4ce48d9fa0',
        versionId: '7e02bc53-dddc-4bf4-88d3-3cd725aecff7',
        name: 'Bullwaves Global Exclusive Tradable Bonus',
        subject: 'A June exclusive, 20% of your losses credited back.',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-global-forgot-password-password-token': {
    en: {
      a: {
        templateId: 'd-b0885bcf87c04dfb8cf69cb105efa467',
        versionId: 'd4ffac1f-124c-472b-b56d-21a10570ee6c',
        name: 'Bullwaves Global Forgot Password - Password Token',
        subject: 'Bullwaves Global Forgot Password - Password Token',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-forgot-password-en': {
    en: {
      a: {
        templateId: 'd-7ddd508f526f4e72b8b793a0c6fd688b',
        versionId: '99cdc266-4894-417e-aa2a-b4a84bed04f1',
        name: 'Bullwaves Password Changed - English',
        subject: 'Bullwaves Forgot Password - EN',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-send-email-additional-account-english': {
    en: {
      a: {
        templateId: 'd-2c697668b79f43188bd22d301273d904',
        versionId: '5818574b-7829-4fa7-9efc-2345df3044e3',
        name: 'Bullwaves Send Email - Additional Account - English',
        subject: 'Bullwaves Send Email - Additional Account - English',
        timing: null,
        delay: null,
      },
    },
  },
  'bullwaves-send-email-demo-account-english': {
    en: {
      a: {
        templateId: 'd-1aef00f8a4eb4e259cfc09f450918e14',
        versionId: 'fba6548a-3e34-48ad-a373-f6e3aff9dade',
        name: 'Bullwaves Send Email - Demo Account - English',
        subject: 'Bullwaves Send Email - Demo Account - English',
        timing: null,
        delay: null,
      },
    },
  },
  churned_high_value_step3_email: {
    en: {
      a: {
        templateId: 'd-ba5fe0036e0e4c4b83584d7bf562956a',
        versionId: 'de764457-d349-45dd-8ac0-aa0bc4c2a5ab',
        name: 'Churned High Value - Active Return Consolidation A',
        subject: 'After your deposit, Bullwaves can now support the next phase more completely.',
        timing: 'D7',
        delay: '+4 days after step 2',
      },
      b: {
        templateId: 'd-288c014121994e9baeba8bd304133fc2',
        versionId: '1eeedf54-cf06-4d38-b955-605ef5093418',
        name: 'Churned High Value - Active Return Consolidation B',
        subject: 'Your deposit restarted the path. A final supportive review is now available.',
        timing: 'D7',
        delay: '+4 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-485d8386111f42fb80b9dcdd2b7318d5',
        versionId: '54028f41-5cb4-4e9c-b641-1d8e476e8160',
        name: 'Churned High Value - Consolidamento Ritorno Attivo A IT',
        subject:
          'Dopo il tuo deposito, Bullwaves può supportare in modo più completo la prossima fase.',
        timing: 'D7',
        delay: '+4 giorni dopo step 2',
      },
      b: {
        templateId: 'd-6f52bdeded6147c7ac99cc84e6f9ed8b',
        versionId: 'e02b9552-3aac-4f3a-b7a9-ef3379fc1289',
        name: 'Churned High Value - Consolidamento Ritorno Attivo B IT',
        subject:
          'Il tuo deposito ha riattivato il percorso. Ora è disponibile una review finale più supportiva.',
        timing: 'D7',
        delay: '+4 giorni dopo step 2',
      },
    },
  },
  churned_high_value_step1_email: {
    en: {
      a: {
        templateId: 'd-432851595bb94c6bb94ba65ef754dec1',
        versionId: 'f1a5e4f0-1f50-4385-8b93-2cacb2f761a5',
        name: 'Churned High Value - Comeback Touch A',
        subject: 'A more tailored Bullwaves return plan is ready for you.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-e2fb0bbaab1c4c62aec43f623ce25937',
        versionId: 'dfb0b08e-4b33-4c00-9156-0257aec631e0',
        name: 'Churned High Value - Comeback Touch B',
        subject: 'Your dedicated Bullwaves review is open in your client area.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-51d319bcaaf140b1b47613a5010397ad',
        versionId: '6040fdf9-9ba8-4429-b873-a97483ad494e',
        name: 'Churned High Value - Comeback Touch A IT',
        subject: 'Per il tuo rientro abbiamo preparato una proposta Bullwaves più su misura.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-34929bca976245a0800b9cdfd2bc900c',
        versionId: 'd31c769c-5868-4407-aa11-052e4bc43146',
        name: 'Churned High Value - Comeback Touch B IT',
        subject: 'La tua revisione dedicata Bullwaves è aperta nella tua area cliente.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  churned_high_value_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-d84df6d5134146c88798d1f0145f75f4',
        versionId: '22f9c85c-69c7-48a1-95c7-ec1489c07880',
        name: 'Churned High Value - Positive Follow-up A',
        subject: 'Good news: your deposit has reactivated the Bullwaves path.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-f30373f4a232446a94b8066d776fb55c',
        versionId: '5c0e9e3a-d2e9-4a5d-89e3-7d454ed59af3',
        name: 'Churned High Value - Positive Follow-up B',
        subject: 'Your return is moving in the right direction after the recent deposit.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-301993119ad14cdbbf5af29da113ecbd',
        versionId: 'c56f8717-ef74-45c6-add9-091265fb7e1d',
        name: 'Churned High Value - Positive Follow-up A IT',
        subject: 'Buone notizie: il tuo deposito ha riattivato il percorso Bullwaves.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-617f450b491d46bc85eb091d8c3c6d9c',
        versionId: '3ad79055-39bc-4ae8-a8c3-fc8332fe66af',
        name: 'Churned High Value - Positive Follow-up B IT',
        subject: 'Il tuo ritorno si sta muovendo nella direzione giusta dopo il deposito recente.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
    },
  },
  churned_high_value_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-14b73d2f0ce445fab09b572a88f9ab48',
        versionId: '4c8b1721-29ea-48ca-9ea8-a09ccf91712d',
        name: 'Churned High Value - Return Follow-up A',
        subject: 'No deposit yet? The Bullwaves reactivation path is still open.',
        timing: 'D14',
        delay: '+7 days after missed outcome',
      },
      b: {
        templateId: 'd-6495562edd1a45a38bd40bc80fb37444',
        versionId: '9d9cf131-de96-4700-8305-e4495e3ed38a',
        name: 'Churned High Value - Return Follow-up B',
        subject:
          'Still no action? A lighter Bullwaves return option is available for your account.',
        timing: 'D14',
        delay: '+7 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-0df4cbf901e24daf9674e81494572fbe',
        versionId: '60627cb3-c4e3-402b-9b3f-cb91c017e16b',
        name: 'Churned High Value - Return Follow-up A IT',
        subject: 'Nessun deposito ancora? Il percorso di riattivazione Bullwaves è ancora aperto.',
        timing: 'D14',
        delay: '+7 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-89f73fd02b4843e19f98b481ae963cbc',
        versionId: '74844644-05b9-43e3-a3e3-51808579ecad',
        name: 'Churned High Value - Return Follow-up B IT',
        subject:
          'Ancora nessuna azione? Per il tuo account è disponibile una opzione Bullwaves più leggera.',
        timing: 'D14',
        delay: '+7 giorni dopo esito non centrato',
      },
    },
  },
  churned_high_value_step2_email: {
    en: {
      a: {
        templateId: 'd-f3901e26c7ec46ca9217a2006f9c16ce',
        versionId: 'bd545ac3-8630-44a9-9ead-48c56955f53a',
        name: 'Churned High Value - Return Package A',
        subject: 'Your Bullwaves deposit is confirmed. Here is the next supported step.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
      b: {
        templateId: 'd-f1dd1cd027dd4c628f1fc1c988d7987b',
        versionId: '28f61f7d-984f-46bf-be9b-d1baa1ada422',
        name: 'Churned High Value - Return Package B',
        subject: 'You already restarted the path. Let’s keep it moving.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-6c120dcc37db472e93415466107d53e8',
        versionId: '17b2d1c9-0a33-4c71-9167-63e91fbe9bba',
        name: 'Churned High Value - Return Package A IT',
        subject: 'Il tuo deposito Bullwaves è confermato. Ecco il prossimo passo supportato.',
        timing: 'D3',
        delay: '+3 giorni dopo step 1',
      },
      b: {
        templateId: 'd-4e28fda05065441994d000f02099a64f',
        versionId: '0bcc277f-0a40-4ce0-9408-b69b9451a748',
        name: 'Churned High Value - Return Package B IT',
        subject: 'Hai già riattivato il percorso. Ora mantienilo in movimento.',
        timing: 'D3',
        delay: '+3 giorni dopo step 1',
      },
    },
  },
  dormant_120d_bonus_step2_email: {
    en: {
      a: {
        templateId: 'd-128acc3695c947219a49b9d764606726',
        versionId: 'ea53b2b0-dca2-44b7-b0ea-d2cf002c0d34',
        name: 'Dormant 120d - Bonus Activation Reminder A',
        subject: 'To request the 100 USD bonus, send BONUS100 on WhatsApp.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
      b: {
        templateId: 'd-bccdd4ea28fd4e339371303e22139ed8',
        versionId: 'ab560239-b905-458d-9ab9-00ceba90232e',
        name: 'Dormant 120d - Bonus Activation Reminder B',
        subject: 'A simpler return starts with one WhatsApp keyword: BONUS100.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-450735ff8e1f4b3abe6e11dbd3e8951c',
        versionId: '91ef8e79-ccc1-49b9-afd9-4d89e016301d',
        name: 'Dormant 120d - Reminder Attivazione Bonus A IT',
        subject: 'Per richiedere il bonus da 100 USD, invia BONUS100 su WhatsApp.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
      b: {
        templateId: 'd-9652dfdc40254f27996d4d52a012c199',
        versionId: '940b93ba-6a52-43c6-b183-1ae6288da2af',
        name: 'Dormant 120d - Reminder Attivazione Bonus B IT',
        subject: 'Un rientro più semplice parte da una keyword WhatsApp: BONUS100.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
    },
  },
  dormant_120d_bonus_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-949a4757ebe043a7852c62083d3c9a5e',
        versionId: 'cc8a359e-7346-4085-8a22-930ef38ea8a1',
        name: 'Dormant 120d - Bonus Recovery Follow-up A',
        subject: 'Your 100 USD WhatsApp bonus route is still available.',
        timing: 'D21',
        delay: '+11 days after missed outcome',
      },
      b: {
        templateId: 'd-bed11b7cf9d641fab5748b5bca60f244',
        versionId: 'ac7e4b78-c29c-4996-95d5-a7894e346443',
        name: 'Dormant 120d - Bonus Recovery Follow-up B',
        subject: 'Still inactive? Your manager-led 100 USD bonus option remains open.',
        timing: 'D21',
        delay: '+11 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-c843e0e173784a008cc792205189948e',
        versionId: '832bb35a-d24d-49e2-96c2-c9ef4ff1492a',
        name: 'Dormant 120d - Follow-up Recovery Bonus A IT',
        subject: 'Il tuo percorso bonus da 100 USD su WhatsApp è ancora disponibile.',
        timing: 'D21',
        delay: '+11 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-67752a0f33df480cb85fbe3f8e011e45',
        versionId: '5b69f8d0-5d33-483d-9b90-266f4b95cb24',
        name: 'Dormant 120d - Follow-up Recovery Bonus B IT',
        subject:
          'Ancora inattivo? La tua opzione bonus da 100 USD guidata dal manager e ancora aperta.',
        timing: 'D21',
        delay: '+11 giorni dopo esito non centrato',
      },
    },
  },
  dormant_120d_bonus_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-1d84d9b7439e4ae7a289cdcb25686f79',
        versionId: 'd11ced89-b687-4a08-9bbf-4f5e5fbdfee8',
        name: 'Dormant 120d - Bonus Request Confirmed A',
        subject: 'Your Bullwaves bonus request has reopened the path.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-8347be54c72b4ff98e4827f2c0ebfd1e',
        versionId: '5012f923-9033-4358-9b75-cf8df0120bef',
        name: 'Dormant 120d - Bonus Request Confirmed B',
        subject: 'Good news: your bonus path is now back in motion.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-9d6be2dd50164bafb2a5dbdd87b16c02',
        versionId: '9200963b-0883-4bac-95ca-188201cac20a',
        name: 'Dormant 120d - Richiesta Bonus Confermata A IT',
        subject: 'La tua richiesta bonus Bullwaves ha riaperto il percorso.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-8b4ec1c8625d4399a0d87f631c0c0d27',
        versionId: '64017d08-f589-4988-8fff-7382a24da225',
        name: 'Dormant 120d - Richiesta Bonus Confermata B IT',
        subject: 'Buone notizie: il tuo percorso bonus si e rimesso in moto.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
    },
  },
  dormant_120d_bonus_step1_email: {
    en: {
      a: {
        templateId: 'd-e736f2f5d4b44e87b5b2b91f6335a5df',
        versionId: 'e668f8c0-534c-4c5b-b002-8a1c4bb52a4a',
        name: 'Dormant 120d - Free Bonus Invite A',
        subject: 'A 100 USD Bullwaves bonus can now help you restart.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-78e737d20e5c428288d1755d10c80df2',
        versionId: '8afed3db-799b-4d1b-97cc-686a675aa955',
        name: 'Dormant 120d - Free Bonus Invite B',
        subject: 'Your account is eligible for a 100 USD reactivation bonus.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-9312b38410014a9d99a0025dd651644b',
        versionId: '8c1cfc8b-78e8-4602-982a-3f044111ea46',
        name: 'Dormant 120d - Invito Bonus Gratuito A IT',
        subject: 'Un bonus Bullwaves da 100 USD può aiutarti a ripartire.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-42cd1d12d75c4e55806bbdacac076bb4',
        versionId: 'f0de3ad8-0af9-4dc5-8fed-fea5787e6711',
        name: 'Dormant 120d - Invito Bonus Gratuito B IT',
        subject: 'Per il tuo account e disponibile un bonus di riattivazione da 100 USD.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  dormant_120d_bonus_step3_email: {
    en: {
      a: {
        templateId: 'd-233dd5638d464308bf10a1baf45b6f3a',
        versionId: 'f2eadf15-5cd7-4a0f-ae5f-835af56ab3f7',
        name: 'Dormant 120d - Last Call Bonus Support A',
        subject: 'If you want a low-friction return, your 100 USD bonus path is still open.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
      b: {
        templateId: 'd-14e08b67af4f497398cff4b0c1d4eae1',
        versionId: '0c2e2507-f355-4c67-8544-d7852985be6b',
        name: 'Dormant 120d - Last Call Bonus Support B',
        subject: 'The 100 USD bonus offer is still available for your account.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-42cc6742ddf748058ff5d721855e4f89',
        versionId: '145f42ac-f1bc-43fa-9e5e-e350a647501c',
        name: 'Dormant 120d - Supporto Finale Bonus A IT',
        subject:
          'Se vuoi un rientro più leggero, il tuo percorso bonus da 100 USD e ancora aperto.',
        timing: 'D10',
        delay: '+6 giorni dopo step 2',
      },
      b: {
        templateId: 'd-3370b9509e7048fe9d9e6d4c2e2b4778',
        versionId: 'be33647f-e86a-49aa-a5bf-2fe9c8cf7013',
        name: 'Dormant 120d - Supporto Finale Bonus B IT',
        subject: 'Per il tuo account il bonus da 100 USD e ancora disponibile.',
        timing: 'D10',
        delay: '+6 giorni dopo step 2',
      },
    },
  },
  dormant_low_step3_email: {
    en: {
      a: {
        templateId: 'd-be5df25add8e440988859c0a68002f86',
        versionId: '29c0adf7-f917-4398-ab9e-e2739272e4bf',
        name: 'Dormant Low - Light Continuity Nurture A',
        subject: 'Keep your Bullwaves restart active with one light next step.',
        timing: 'D15',
        delay: '+9 days after step 2',
      },
      b: {
        templateId: 'd-96a2ba0ee95445488f25daf558aaa854',
        versionId: 'a81429a0-6895-4824-ac16-3c377ab0dba3',
        name: 'Dormant Low - Light Continuity Nurture B',
        subject: 'Your Bullwaves account is moving again. Keep the next step simple.',
        timing: 'D15',
        delay: '+9 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-116a530b9e8d45b79d3c05d4f690873f',
        versionId: '2adc4052-1882-49df-b428-ac5e783958cb',
        name: 'Dormant Low - Light Continuity Nurture A IT',
        subject: 'Mantieni attiva la tua ripartenza Bullwaves con un leggero passo in più.',
        timing: 'D15',
        delay: '+9 giorni dopo step 2',
      },
      b: {
        templateId: 'd-161c81f8d57749a39976975363401d7d',
        versionId: '8d6df17e-6714-4e39-8dcc-330e83d04cc4',
        name: 'Dormant Low - Light Continuity Nurture B IT',
        subject:
          'Il tuo account Bullwaves si sta muovendo di nuovo. Mantieni semplice il prossimo passo.',
        timing: 'D15',
        delay: '+9 giorni dopo step 2',
      },
    },
  },
  dormant_low_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-e3a43a4f817644cba16ca647bfc47d80',
        versionId: '60acc6d5-319e-47c2-a932-4ab205cb70eb',
        name: 'Dormant Low - Positive Follow-up A',
        subject: 'Good news: your Bullwaves restart is working.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-86f836045da04e4680280f7aa094c0cc',
        versionId: '4a65661b-edf3-4d23-971b-78ce7eb7b402',
        name: 'Dormant Low - Positive Follow-up B',
        subject: 'Your account is active again. Keep the next steps light and clear.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-69fd598347fe45df966fba921f9cb0c3',
        versionId: 'fdff141a-d3b2-4953-a0dc-7280e6c9d2c6',
        name: 'Dormant Low - Positive Follow-up A IT',
        subject: 'Buona notizia: la tua ripartenza Bullwaves sta funzionando.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-9f36d358d3f7468db1895153d4663c3e',
        versionId: '1f3deee8-6e58-4133-ab84-8e2f02b4a988',
        name: 'Dormant Low - Positive Follow-up B IT',
        subject: 'Il tuo account è di nuovo attivo. Mantieni leggeri e chiari i prossimi step.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
    },
  },
  dormant_low_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-952cb25a9983474786c1116fdb886bac',
        versionId: 'c1fd791b-62ac-4d8d-8c59-46f36aef33f0',
        name: 'Dormant Low - Recovery Follow-up A',
        subject: 'Your Bullwaves account can still restart from a lighter path.',
        timing: 'D21',
        delay: '+6 days after missed outcome',
      },
      b: {
        templateId: 'd-ff7a7f8ee2334a15bb47f00715444bac',
        versionId: '2275369e-6ee2-4134-9b0b-f583e6dcf9bd',
        name: 'Dormant Low - Recovery Follow-up B',
        subject: 'A softer Bullwaves re-entry path is ready for you.',
        timing: 'D21',
        delay: '+6 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-8a7f053a3e36475d98fe3c2c42495d5e',
        versionId: '132f6e4a-4721-4e70-8d83-1e328b1f436b',
        name: 'Dormant Low - Recovery Follow-up A IT',
        subject: 'Il tuo account Bullwaves può ancora ripartire da un percorso più leggero.',
        timing: 'D21',
        delay: '+6 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-b709ee9940bd49da8695ef4fae229208',
        versionId: '36d1a64c-2447-4511-a875-0aa368cfe508',
        name: 'Dormant Low - Recovery Follow-up B IT',
        subject: 'Per te e pronto un percorso Bullwaves di rientro più morbido.',
        timing: 'D21',
        delay: '+6 giorni dopo esito non centrato',
      },
    },
  },
  dormant_low_step2_email: {
    en: {
      a: {
        templateId: 'd-6c09d9687fd947558f0f47a4fade7c87',
        versionId: 'f173236b-6c4b-4500-9872-1b87105c7e3d',
        name: 'Dormant Low - Simple Restart Path A',
        subject: 'Your simple Bullwaves restart path is ready.',
        timing: 'D6',
        delay: '+6 days after step 1',
      },
      b: {
        templateId: 'd-43c89e634d584831a229e1b962e48f75',
        versionId: '3ce89ceb-15b1-4a77-aead-625b906e3a1c',
        name: 'Dormant Low - Simple Restart Path B',
        subject: 'A lighter Bullwaves recovery plan is now available for your account.',
        timing: 'D6',
        delay: '+6 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-9235c7881a0249299b11439f42cc0213',
        versionId: 'da1748fb-38a3-47f2-b54b-9d6aebe36d13',
        name: 'Dormant Low - Simple Restart Path A IT',
        subject: 'Il tuo percorso semplice di ripartenza Bullwaves e pronto.',
        timing: 'D6',
        delay: '+6 giorni dopo step 1',
      },
      b: {
        templateId: 'd-f0574e87b4e14b4b8c19f781ab58d429',
        versionId: '9f9f7145-34e9-4a0b-a64f-6cfa6ad57e8b',
        name: 'Dormant Low - Simple Restart Path B IT',
        subject: 'Per il tuo account e ora disponibile un piano Bullwaves di recovery più leggero.',
        timing: 'D6',
        delay: '+6 giorni dopo step 1',
      },
    },
  },
  dormant_low_step1_email: {
    en: {
      a: {
        templateId: 'd-0099e8c8db344f0d967b626536cac8f9',
        versionId: '4c6c8b19-07e3-4e0b-9786-a0529a6de34f',
        name: 'Dormant Low - Soft Re-entry Touch A',
        subject: 'A simple Bullwaves restart path is available whenever you are ready.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-b776d4a0b9f64262a1facf4613e4156b',
        versionId: '170fcf5c-520d-4e43-8f44-82dd294e2f74',
        name: 'Dormant Low - Soft Re-entry Touch B',
        subject: 'Your Bullwaves account can restart from a lighter step.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-2049d0f36ef042e092471da0380d13d9',
        versionId: 'd5d77f4f-eede-4971-9084-e1db430d8ae1',
        name: 'Dormant Low - Soft Re-entry Touch A IT',
        subject: 'E disponibile un percorso Bullwaves di ripartenza semplice quando vuoi.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-c665862406ad4ee49fa407d98918d6e2',
        versionId: '4afedb56-4b69-4f86-af2f-9b3c1e5605bc',
        name: 'Dormant Low - Soft Re-entry Touch B IT',
        subject: 'Il tuo account Bullwaves può ripartire da un passo più leggero.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  dormant_mid_step3_email: {
    en: {
      a: {
        templateId: 'd-5688a8bc42874b429aeefaefc5eba191',
        versionId: '9bc7bf6f-ed1f-4969-98eb-b9c14735c2e4',
        name: 'Dormant Mid - Manager Continuity Touch A',
        subject: 'Keep your Bullwaves recovery stable with one more step.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
      b: {
        templateId: 'd-7e9af578b8cf4d0db506b02c36ca3e33',
        versionId: '720e7906-72c4-40cb-9f34-bbee5fb07cbd',
        name: 'Dormant Mid - Manager Continuity Touch B',
        subject: 'Your Bullwaves return can still become a stable active path.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-34c9ed852df04a569687b6f11dae1df4',
        versionId: '7ef98fd3-e9f9-47ad-b53f-2b953b9252f1',
        name: 'Dormant Mid - Manager Continuity Touch A IT',
        subject: 'Mantieni stabile il tuo recovery Bullwaves con un altro step.',
        timing: 'D10',
        delay: '+6 giorni dopo step 2',
      },
      b: {
        templateId: 'd-ba207f6d2c52409aa21d33876833ef61',
        versionId: '7583c3b7-41dc-4d41-a065-204b2e402bbd',
        name: 'Dormant Mid - Manager Continuity Touch B IT',
        subject: 'Il tuo ritorno Bullwaves può ancora diventare un percorso attivo stabile.',
        timing: 'D10',
        delay: '+6 giorni dopo step 2',
      },
    },
  },
  dormant_mid_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-273ef992d9c745efa877699282ecd290',
        versionId: 'c03df2c2-1654-4f62-91b3-bf59e2c1110f',
        name: 'Dormant Mid - Positive Follow-up A',
        subject: 'Your Bullwaves recovery is confirmed and back on track.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-bfbcc1a9f0e140a396b3b8fa54ba651b',
        versionId: 'b2d241a0-ec75-4583-8d4f-b4d9fd63eff4',
        name: 'Dormant Mid - Positive Follow-up B',
        subject: 'Good result: your Bullwaves account is moving again.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-ff8b2c14ecae4e3f950abe553855cfde',
        versionId: '4d11d361-769a-4986-b081-1910a3711093',
        name: 'Dormant Mid - Positive Follow-up A IT',
        subject: 'Il tuo recovery Bullwaves e confermato ed e tornato in linea.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-ca0bf4bcfce5413cb75725130103773e',
        versionId: 'd3c36151-a7b2-497f-8d47-faf4e647627d',
        name: 'Dormant Mid - Positive Follow-up B IT',
        subject: 'Buon risultato: il tuo account Bullwaves si e rimesso in movimento.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
    },
  },
  dormant_mid_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-2b591078024a4f0b9feedf4304741c67',
        versionId: '70771f4a-754e-4682-9235-3135307537f9',
        name: 'Dormant Mid - Recovery Follow-up A',
        subject: 'Your Bullwaves comeback is still possible from a cleaner path.',
        timing: 'D18',
        delay: '+8 days after missed outcome',
      },
      b: {
        templateId: 'd-c1435b7c57124999bee82896ea9a2ab1',
        versionId: '809f894a-8d9c-4cf1-827a-a770053e181d',
        name: 'Dormant Mid - Recovery Follow-up B',
        subject: 'A lighter Bullwaves re-entry path is available for your account.',
        timing: 'D18',
        delay: '+8 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-750e04a0507345919e09bf68e39722d8',
        versionId: '311efb00-2492-418f-acbf-a73c16a5a485',
        name: 'Dormant Mid - Recovery Follow-up A IT',
        subject: 'Il tuo comeback Bullwaves e ancora possibile da un percorso più pulito.',
        timing: 'D18',
        delay: '+8 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-f561bb7343614c56b4196305bded307f',
        versionId: 'fb4a712e-d87d-40d8-98af-abbaf86442a0',
        name: 'Dormant Mid - Recovery Follow-up B IT',
        subject: 'Per il tuo account e disponibile un percorso Bullwaves di rientro più leggero.',
        timing: 'D18',
        delay: '+8 giorni dopo esito non centrato',
      },
    },
  },
  dormant_mid_step2_email: {
    en: {
      a: {
        templateId: 'd-247adab9a4a04c699dba9224375ec76a',
        versionId: 'e398ae97-6bdf-4587-b5ca-11f6e9589766',
        name: 'Dormant Mid - Relaunch Value Path A',
        subject: 'Your Bullwaves relaunch path is ready for review.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
      b: {
        templateId: 'd-da327fde6266468e9e383e0ef1924ba3',
        versionId: 'ae0bda8d-221e-4769-9dbf-679c1cb03b2e',
        name: 'Dormant Mid - Relaunch Value Path B',
        subject: 'A clearer Bullwaves recovery plan is now active for your account.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-a3764aa2fb894e6caa66fbaccad267bc',
        versionId: '2919e229-4497-4031-bbdf-0aee8f74a5f9',
        name: 'Dormant Mid - Relaunch Value Path A IT',
        subject: 'Il tuo percorso Bullwaves di rilancio e pronto da rivedere.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
      b: {
        templateId: 'd-e785e6a228f54ca49166ca8099c8937f',
        versionId: '02230ece-7728-4825-9456-311e45ba5c16',
        name: 'Dormant Mid - Relaunch Value Path B IT',
        subject: 'Per il tuo account e ora attivo un piano Bullwaves di recovery più chiaro.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
    },
  },
  dormant_mid_step1_email: {
    en: {
      a: {
        templateId: 'd-2066a23a7056471499250a2ee782ba9e',
        versionId: '685ca6a3-ee33-49c2-b407-f7ed1e40c8f1',
        name: 'Dormant Mid - Winback Touch A',
        subject: 'A stronger Bullwaves return path is available for your account.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-f61fa94c924a492080947ffbf7050d2e',
        versionId: '00abfd79-3ad7-4f42-8068-e3ce9e759cc9',
        name: 'Dormant Mid - Winback Touch B',
        subject: 'Your Bullwaves profile is ready for a more structured comeback.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-c57fedcdd2fe4fcf95df81bf4dad7226',
        versionId: 'dea2a976-5b42-44e3-8f11-e0f78e4fdca1',
        name: 'Dormant Mid - Winback Touch A IT',
        subject: 'Per il tuo account e disponibile un percorso Bullwaves di ritorno più forte.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-a45acf33a2a14c8fbc3838ea36bc27b7',
        versionId: 'ebf5db2c-80a7-4c74-be63-cf1d56485a00',
        name: 'Dormant Mid - Winback Touch B IT',
        subject: 'Il tuo profilo Bullwaves e pronto per un comeback più strutturato.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  dormant_value_step3_email: {
    en: {
      a: {
        templateId: 'd-9d3d21c9e720417dae4befcc62fbd415',
        versionId: '3fc20c4f-0e02-4d0a-a3eb-9c9b89ceffae',
        name: 'Dormant Value - Continuity Reinforcement A',
        subject: 'Keep your reactivation stable with one final Bullwaves step.',
        timing: 'D9',
        delay: '+6 days after step 2',
      },
      b: {
        templateId: 'd-b7a3385a5f554123ac6fff4d3890a837',
        versionId: '1e339b45-74a4-4f9e-93f5-98489936d411',
        name: 'Dormant Value - Continuity Reinforcement B',
        subject: 'Your Bullwaves return is improving. Now keep it consistent.',
        timing: 'D9',
        delay: '+6 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-94499a9144594fa3ba603c2b11f60d17',
        versionId: '2e2f4a62-4843-43fa-9e6e-3bc8f73dc4ea',
        name: 'Dormant Value - Continuity Reinforcement A IT',
        subject: 'Mantieni stabile la tua riattivazione con un ultimo step Bullwaves.',
        timing: 'D9',
        delay: '+6 giorni dopo step 2',
      },
      b: {
        templateId: 'd-9e536e22005a46daab3a2c1b2bb06bd0',
        versionId: '2ef0721f-6086-4c62-83fd-829ddb502d56',
        name: 'Dormant Value - Continuity Reinforcement B IT',
        subject: 'Il tuo ritorno Bullwaves sta migliorando. Ora rendilo più costante.',
        timing: 'D9',
        delay: '+6 giorni dopo step 2',
      },
    },
  },
  dormant_value_step2_email: {
    en: {
      a: {
        templateId: 'd-6dee1f2d348b42cdaff2a85962d04023',
        versionId: '0bde40bf-15b9-4bac-99af-f6f160c3b48d',
        name: 'Dormant Value - Guided Return Plan A',
        subject: 'Your guided return plan is ready inside Bullwaves.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
      b: {
        templateId: 'd-8fb08b3931544ad9afe13f9443032c77',
        versionId: 'be371172-3386-4cbd-9ef9-22f599d48cea',
        name: 'Dormant Value - Guided Return Plan B',
        subject: 'Your Bullwaves return path is still open and easier to follow now.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-9a392fa13d91450fbab1f43af11bf944',
        versionId: 'c51f9783-d296-4117-b40f-69851f413adf',
        name: 'Dormant Value - Guided Return Plan A IT',
        subject: 'Il tuo piano guidato di ritorno è pronto dentro Bullwaves.',
        timing: 'D3',
        delay: '+3 giorni dopo step 1',
      },
      b: {
        templateId: 'd-1f52b0a95bb740b58d0d8f04850b278e',
        versionId: '536d172a-f044-4dd7-8fe2-16cc016ad628',
        name: 'Dormant Value - Guided Return Plan B IT',
        subject:
          'Il tuo percorso di ritorno Bullwaves è ancora aperto e ora è più facile da seguire.',
        timing: 'D3',
        delay: '+3 giorni dopo step 1',
      },
    },
  },
  dormant_value_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-e1db92d45bf94e7b80e11e196896db01',
        versionId: '13260c69-b4f6-4787-ba06-160ca837df96',
        name: 'Dormant Value - Positive Follow-up A',
        subject: 'Good news: your Bullwaves account is back on track.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-d17a5171e44d49f182db49a9f748cf98',
        versionId: '3149b850-3939-42da-a65f-a617f5931d56',
        name: 'Dormant Value - Positive Follow-up B',
        subject: 'Your reactivation is confirmed. Keep your account moving.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-2e047842b78a4a36ab1c518a0365743d',
        versionId: 'bd3fd203-9ec6-4c96-afa1-25603d4d5bcd',
        name: 'Dormant Value - Positive Follow-up A IT',
        subject: 'Buona notizia: il tuo account Bullwaves è tornato in linea.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-4701549389f04c188fe77ae2da308155',
        versionId: '83225e30-97ea-4706-952b-0b42e57dbba4',
        name: 'Dormant Value - Positive Follow-up B IT',
        subject: 'La tua riattivazione è confermata. Mantieni il tuo account in movimento.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
    },
  },
  dormant_value_step1_email: {
    en: {
      a: {
        templateId: 'd-95d93b4cb6c749f4a100ec43bf5fbb85',
        versionId: 'd6597e81-9cdb-4206-90e1-c1f460d23f91',
        name: 'Dormant Value - Reactivation Touch A',
        subject: 'Your Bullwaves account still has value ready to reactivate.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-4d87700db900433ebe11316f76a5fae8',
        versionId: '464710b1-74bf-435e-9f09-0f37ba4e28d5',
        name: 'Dormant Value - Reactivation Touch B',
        subject: 'A clearer way to restart your Bullwaves activity is available.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-51217f9e77c64cfe89d9f171c34c683b',
        versionId: '9c00a281-b682-4ff3-9bcc-00cb15499110',
        name: 'Dormant Value - Reactivation Touch A IT',
        subject: 'Il tuo account Bullwaves ha ancora valore da riattivare.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-d5ce3c4253be41dfaffae3b26063db4e',
        versionId: 'f7ace6fb-a35f-4430-9b55-920398cd5088',
        name: 'Dormant Value - Reactivation Touch B IT',
        subject: 'È disponibile un modo più chiaro per ripartire con Bullwaves.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  dormant_value_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-d1827962ba124cd49b559d02148c08b7',
        versionId: '79d2b2d1-4f9c-4b44-84af-5e65086fcf18',
        name: 'Dormant Value - Recovery Follow-up A',
        subject: 'Your Bullwaves return path is still open.',
        timing: 'D18',
        delay: '+9 days after missed outcome',
      },
      b: {
        templateId: 'd-f115537427754af7a794df35efb4befc',
        versionId: 'f1accaca-8375-4268-8873-94415bc3cf17',
        name: 'Dormant Value - Recovery Follow-up B',
        subject: 'A simpler Bullwaves restart option is available for your account.',
        timing: 'D18',
        delay: '+9 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-d56bb6dbdc6942279861abf0eba5988f',
        versionId: '9aa1ec7c-c06e-437a-9f01-879d8bd185e4',
        name: 'Dormant Value - Recovery Follow-up A IT',
        subject: 'Il tuo percorso di ritorno Bullwaves e ancora aperto.',
        timing: 'D18',
        delay: '+9 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-6c353f1d1aa94caab2e3791247af274d',
        versionId: '31bc322b-33b9-4b99-9711-26b1caf38fb4',
        name: 'Dormant Value - Recovery Follow-up B IT',
        subject:
          'Per il tuo account e disponibile una opzione Bullwaves di ripartenza più semplice.',
        timing: 'D18',
        delay: '+9 giorni dopo esito non centrato',
      },
    },
  },
  'bullwaves-global-email-confirmation-en': {
    en: {
      a: {
        templateId: 'd-5ae8ce97a7fe49d0815e2d7db5b3fb7a',
        versionId: '5301780a-2a9c-4cb5-bc05-a0663f4b34a9',
        name: 'Email confirmation',
        subject: 'Email confirmation',
        timing: null,
        delay: null,
      },
    },
  },
  'forgot-password-password-token': {
    en: {
      a: {
        templateId: 'd-5ae98fa92cfe4c378f7073e74c0af86e',
        versionId: 'b1125cca-dd81-4252-8460-7b0545f2396e',
        name: 'Forgot Password - Password Token',
        subject: 'Forgot Password - Password Token',
        timing: null,
        delay: null,
      },
    },
  },
  most_consistent_badge_award_email: {
    en: {
      a: {
        templateId: 'd-db752b98ac464e6f831a30012d82bd6b',
        versionId: 'e4a59d82-5747-4c67-a033-2d3a8b1001fc',
        name: 'Most Consistent - Badge Award A',
        subject: 'You earned your Bullwaves consistency badge.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-0bd843de8b8b46c1bffa1f6cb8d18330',
        versionId: 'b720bc4e-17e7-4946-9bf0-1d15244020c7',
        name: 'Most Consistent - Badge Award B',
        subject: 'Your consistency is now a growth asset on Bullwaves.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-843a913f5248420eb261a747c113e8ef',
        versionId: '5786c9ae-60c1-483e-ab91-1e4cf35a7909',
        name: 'Most Consistent - Badge Award A IT',
        subject: 'Hai ottenuto il tuo badge Bullwaves di consistenza.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-ca6e01629202418a9010416e831c77ed',
        versionId: '2b5897e1-d346-40c8-a5bd-90bd5f06776c',
        name: 'Most Consistent - Badge Award B IT',
        subject: 'La tua costanza è ora un asset di crescita su Bullwaves.',
        timing: 'D0',
        delay: '0 giorni dall ingresso nel segmento',
      },
    },
  },
  most_consistent_cycle_restart_email: {
    en: {
      a: {
        templateId: 'd-4906a7dce7ac41fc96d6f8f11797b69c',
        versionId: 'a0f557e9-0b8d-4167-b559-bc4dd94f5c27',
        name: 'Most Consistent - Cycle Restart A',
        subject: 'Restart your Bullwaves cycle with a cleaner challenge path.',
        timing: 'D30',
        delay: '+30 days after last low-engagement cycle',
      },
      b: {
        templateId: 'd-a643dc8f955b401e817f79ceedcc8936',
        versionId: '20ecb424-6f54-4d6b-b899-44d726d15085',
        name: 'Most Consistent - Cycle Restart B',
        subject: 'A cleaner Bullwaves restart is still available to you.',
        timing: 'D30',
        delay: '+30 days after last low-engagement cycle',
      },
    },
    it: {
      a: {
        templateId: 'd-c8d5dfb1d8ce482bbffae12a91694a9d',
        versionId: '54caaa75-ce7e-4374-8330-aaf6565156ab',
        name: 'Most Consistent - Cycle Restart A IT',
        subject: 'Riavvia il tuo ciclo Bullwaves con un percorso challenge più chiaro.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
      },
      b: {
        templateId: 'd-cce4cab7303747b5b5fa31c7cf054821',
        versionId: '94ac6a29-b1a3-41e4-ae21-2f586551f4ad',
        name: 'Most Consistent - Cycle Restart B IT',
        subject: 'Una ripartenza Bullwaves più pulita è ancora disponibile per te.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
      },
    },
  },
  most_consistent_growth_roadmap_email: {
    en: {
      a: {
        templateId: 'd-600d262cfabd4b7b93428cd5a242c15d',
        versionId: 'f8e0ac31-fb73-4d8d-8eca-48d0ffe3c9f8',
        name: 'Most Consistent - Growth Roadmap A',
        subject: 'Your Bullwaves roadmap is ready. Let consistency become growth.',
        timing: 'D7',
        delay: '+7 days after badge award',
      },
      b: {
        templateId: 'd-20bcdb180b484e728494abac70cc9454',
        versionId: '612626c5-e656-40aa-ab7f-3c388edec634',
        name: 'Most Consistent - Growth Roadmap B',
        subject: 'A steadier trader should never feel directionless.',
        timing: 'D7',
        delay: '+7 days after badge award',
      },
    },
    it: {
      a: {
        templateId: 'd-9e5cfdcfe3624bf69c75d3c416b53722',
        versionId: 'b033a852-145a-4882-af0f-44c7c5e990c3',
        name: 'Most Consistent - Growth Roadmap A IT',
        subject: 'Il tuo piano di crescita Bullwaves è pronto. Trasforma la costanza in crescita.',
        timing: 'D7',
        delay: '+7 giorni dopo il badge',
      },
      b: {
        templateId: 'd-8734c3f587874f80a43d83398081276b',
        versionId: '53c0e05a-b655-407d-a554-66dc61fec224',
        name: 'Most Consistent - Growth Roadmap B IT',
        subject: 'Un trader più costante non dovrebbe mai sentirsi senza direzione.',
        timing: 'D7',
        delay: '+7 giorni dopo il badge',
      },
    },
  },
  most_consistent_loyalty_reward_email: {
    en: {
      a: {
        templateId: 'd-7e4dd65ae7054f9182600afe62a5ee9e',
        versionId: 'db607b21-a3ec-4c92-8fdf-8b1b8c211b03',
        name: 'Most Consistent - Loyalty Reward A',
        subject: 'Your consistency is unlocking a Bullwaves loyalty reward.',
        timing: 'D21',
        delay: '+14 days after growth roadmap',
      },
      b: {
        templateId: 'd-5b3bcb9fc3614d01b8bc3507c45d3233',
        versionId: '48079e9f-9d13-45dc-8c91-3811f4904641',
        name: 'Most Consistent - Loyalty Reward B',
        subject: 'Stable effort deserves a stronger Bullwaves reward signal.',
        timing: 'D21',
        delay: '+14 days after growth roadmap',
      },
    },
    it: {
      a: {
        templateId: 'd-5bc86c26d0b940ddbaa2cdccf33e90d6',
        versionId: '4e15834d-7f6f-42bf-82d3-7560bbbe4ca5',
        name: 'Most Consistent - Loyalty Reward A IT',
        subject: 'La tua costanza sta sbloccando un premio fedeltà Bullwaves.',
        timing: 'D21',
        delay: '+14 giorni dopo la roadmap',
      },
      b: {
        templateId: 'd-861a7a42dfff4f4eb9380e301c70f0d7',
        versionId: 'aba0d44e-6791-467a-80e7-493a1b288f12',
        name: 'Most Consistent - Loyalty Reward B IT',
        subject: 'Uno sforzo stabile merita un riconoscimento Bullwaves più forte.',
        timing: 'D21',
        delay: '+14 giorni dopo la roadmap',
      },
    },
  },
  most_consistent_top_performers_onboarding_email: {
    en: {
      a: {
        templateId: 'd-9e2930ae7a184d749bc90ee1b639c321',
        versionId: 'b45ed341-f723-4cb7-ac15-3a88897022ef',
        name: 'Most Consistent - Top Performers Onboarding A',
        subject: 'You are ready for the Bullwaves Top Performers path.',
        timing: 'PROMO +0d',
        delay: 'Immediately after promotion to Top Performers',
      },
      b: {
        templateId: 'd-4d67de6465f447fea7481393a73de823',
        versionId: 'f6b918e7-9c9b-43a9-9d2b-6d4afb6fc9da',
        name: 'Most Consistent - Top Performers Onboarding B',
        subject: 'Your Bullwaves profile is moving into a stronger segment.',
        timing: 'PROMO +0d',
        delay: 'Immediately after promotion to Top Performers',
      },
    },
    it: {
      a: {
        templateId: 'd-aafe02ef13444d77a1db9a71e1d376c1',
        versionId: '21de03e6-d188-428f-84c7-8119430e5a91',
        name: 'Most Consistent - Top Performers Onboarding A IT',
        subject: 'Sei pronto per il percorso Bullwaves Top Performers.',
        timing: 'PROMO +0d',
        delay: 'Immediatamente dopo la promozione a Top Performers',
      },
      b: {
        templateId: 'd-550d69168a6845298807fbcd2c639b4a',
        versionId: 'b875aa06-a3dd-4dca-886f-95efb9af190e',
        name: 'Most Consistent - Top Performers Onboarding B IT',
        subject: 'Il tuo profilo Bullwaves sta entrando in un segmento più forte.',
        timing: 'PROMO +0d',
        delay: 'Immediatamente dopo la promozione a Top Performers',
      },
    },
  },
  reward_candidates_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-1c0dca38e0cc44788cbfeaed4880ecb7',
        versionId: '71a41f22-c472-4990-81d8-8e04d6637f64',
        name: 'Reward Candidates - Retained Follow-up A',
        subject: 'Great news: your account review is confirmed and your premium setup continues.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive checkpoint',
      },
      b: {
        templateId: 'd-9c17beecbc1547f18da49802696e82f5',
        versionId: 'd96a667f-a570-4260-a622-1b3a6974613c',
        name: 'Reward Candidates - Retained Follow-up B',
        subject: 'Review completed successfully. Keep your momentum active.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive checkpoint',
      },
    },
    it: {
      a: {
        templateId: 'd-89c08428ebe74ca6baa55fc2195454f8',
        versionId: 'bd4d68d5-fda7-4c36-8746-7e076e28dd20',
        name: 'Reward Candidates - Retained Follow-up A IT',
        subject: 'Ottima notizia: la tua review account è confermata e il setup premium continua.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo checkpoint positivo',
      },
      b: {
        templateId: 'd-cd1cb7b19b8c4fadbc91c1b5a754a121',
        versionId: 'd1384caa-5fb1-487f-a548-fa313a68b1c8',
        name: 'Reward Candidates - Retained Follow-up B IT',
        subject: 'Review completata con successo. Mantieni attivo il tuo slancio.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo checkpoint positivo',
      },
    },
  },
  reward_candidates_step3_email: {
    en: {
      a: {
        templateId: 'd-0856e65a4c0e4ca098062b6f8e3b18ca',
        versionId: 'c9880a5a-937a-449d-8a75-93cbf191d543',
        name: 'Reward Candidates - Retention Commitment A',
        subject: 'Before your next account review, there is one final step to complete.',
        timing: 'D14',
        delay: '+9 days after step 2',
      },
      b: {
        templateId: 'd-9c852cdacc4a4a62929f8f153312c102',
        versionId: 'b0b75d6f-17df-414c-aa95-e0722426090d',
        name: 'Reward Candidates - Retention Commitment B',
        subject: 'Your account review is approaching. Confirm the final setup now.',
        timing: 'D14',
        delay: '+9 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-1d31bccab01b4b67b30932eb97cf1905',
        versionId: '5f4135ec-b798-482b-bf54-b2cb1b667c5c',
        name: 'Reward Candidates - Retention Commitment A IT',
        subject: 'Prima della prossima review account c è un ultimo passaggio da completare.',
        timing: 'D14',
        delay: '+9 giorni dopo step 2',
      },
      b: {
        templateId: 'd-12eaa065fdc545a7b44037e710ba572c',
        versionId: 'a74513b6-a3d7-4953-97c1-d5cff1d24d44',
        name: 'Reward Candidates - Retention Commitment B IT',
        subject: 'La review account è vicina. Conferma ora il setup finale.',
        timing: 'D14',
        delay: '+9 giorni dopo step 2',
      },
    },
  },
  reward_candidates_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-cf570e1afe6c4111916d4b2eb24160f2',
        versionId: 'e3c4af38-0783-490f-b1e4-5a38a70a45d9',
        name: 'Reward Candidates - Return Follow-up A',
        subject: 'Your account can restart from a simpler and clearer path.',
        timing: 'D21',
        delay: '+7 days after missed checkpoint outcome',
      },
      b: {
        templateId: 'd-264741935280443093bb04e220e2a7c0',
        versionId: '3a8d0dd7-d878-4b84-b35c-b26c56d125d8',
        name: 'Reward Candidates - Return Follow-up B',
        subject: 'A lighter restart option is now active in your Bullwaves account.',
        timing: 'D21',
        delay: '+7 days after missed checkpoint outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-44ea059a9e054966979be664beb07773',
        versionId: 'd4f59573-6360-4b06-8b3d-ba17e13263af',
        name: 'Reward Candidates - Return Follow-up A IT',
        subject: 'Il tuo account può ripartire da un percorso più chiaro e più semplice.',
        timing: 'D21',
        delay: '+7 giorni dopo esito checkpoint non centrato',
      },
      b: {
        templateId: 'd-71827073d8c44ae3bbed0df169d89f86',
        versionId: '4ad13933-4a73-4ad6-800c-ce195020ef0e',
        name: 'Reward Candidates - Return Follow-up B IT',
        subject: 'Nel tuo account Bullwaves è attiva una opzione di ripartenza più leggera.',
        timing: 'D21',
        delay: '+7 giorni dopo esito checkpoint non centrato',
      },
    },
  },
  reward_candidates_step2_email: {
    en: {
      a: {
        templateId: 'd-318a71eccfe146bd9443ca7d5c911faf',
        versionId: '81e52cc5-24a7-48da-838b-1d285df49a5f',
        name: 'Reward Candidates - Reward Ladder A',
        subject: 'Your next Bullwaves steps are ready in your account.',
        timing: 'D5',
        delay: '+5 days after step 1',
      },
      b: {
        templateId: 'd-897d0d64a2064208a957bc4d7d91b251',
        versionId: '902c7c19-2c99-474a-b545-f0549fdaee28',
        name: 'Reward Candidates - Reward Ladder B',
        subject: 'A clearer progression plan is now active in your Bullwaves account.',
        timing: 'D5',
        delay: '+5 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-287827f89fd04b18941f71420832f29f',
        versionId: 'd5597f3e-bb8d-4191-b3b0-9a97bb9d5f11',
        name: 'Reward Candidates - Reward Ladder A IT',
        subject: 'I tuoi prossimi passi Bullwaves sono pronti nel tuo account.',
        timing: 'D5',
        delay: '+5 giorni dopo step 1',
      },
      b: {
        templateId: 'd-5d3cece7186049d489920c21d00f52be',
        versionId: '2eb1d575-5dce-4f0d-8b5e-00749b20018d',
        name: 'Reward Candidates - Reward Ladder B IT',
        subject: 'Nel tuo account Bullwaves è attivo un piano di progressione più chiaro.',
        timing: 'D5',
        delay: '+5 giorni dopo step 1',
      },
    },
  },
  reward_candidates_step1_email: {
    it: {
      a: {
        templateId: 'd-6af89db58dab476784fa69457ff22b36',
        versionId: 'd25cabdd-11c1-432e-9c42-156e05d612a9',
        name: 'Reward Candidates - Segnale Reward VIP A IT',
        subject: 'Il tuo profilo Bullwaves ha sbloccato vantaggi premium.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-58f05fc125a1431e9b2741142aa0878a',
        versionId: '27bb1487-d5b0-4f7a-8784-c3d8c3590360',
        name: 'Reward Candidates - Segnale Reward VIP B IT',
        subject: 'Per il tuo profilo è attiva un esperienza Bullwaves più su misura.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
    en: {
      a: {
        templateId: 'd-4ae430b7e21a45b6a1bef4e93e3153bc',
        versionId: 'f1465a1f-5cff-4b6e-a6c9-f708aaf3231a',
        name: 'Reward Candidates - VIP Reward Signal A',
        subject: 'Your Bullwaves profile unlocked premium benefits.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-8caee96c208d4e0ca15ef6f623a456e6',
        versionId: '66616141-b891-437c-b1a3-eca7c1927d92',
        name: 'Reward Candidates - VIP Reward Signal B',
        subject: 'You now have access to a more tailored Bullwaves experience.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
  },
  rising_step2_email: {
    en: {
      a: {
        templateId: 'd-3c98eaf87b6d4f5187a6d3136c933851',
        versionId: 'c913f4ab-9314-4c1a-9adc-8d7baf1cac91',
        name: 'Rising - Milestone Sprint Plan A',
        subject: 'Your next milestones are ready. Keep your growth structured.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
      b: {
        templateId: 'd-1253b993191d4c1a8e3edbe2ab273d83',
        versionId: '34734254-3572-4978-a551-4b03947b03e4',
        name: 'Rising - Milestone Sprint Plan B',
        subject: 'A clearer account plan is now active for your next phase.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-278db5d1047b40df85bdae44bd831c32',
        versionId: 'e4e1395c-7917-4f98-b127-eb6e7882c3dd',
        name: 'Rising - Milestone Sprint Plan A IT',
        subject: 'I tuoi prossimi traguardi sono pronti. Mantieni la crescita strutturata.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
      b: {
        templateId: 'd-b53600bef19b4b7c90cf3affb2aa200d',
        versionId: 'fbd63a56-830f-4bac-930e-8b83337e4a44',
        name: 'Rising - Milestone Sprint Plan B IT',
        subject: 'Nel tuo account e attivo un piano più chiaro per la prossima fase.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
    },
  },
  rising_step1_email: {
    en: {
      a: {
        templateId: 'd-3d03d1a43e414d2dbdeef66f5d7e5d2d',
        versionId: '1c02e401-f04c-4d40-8633-f4d36450bc58',
        name: 'Rising - Momentum Accelerator A',
        subject: 'Your Bullwaves activity is growing. Keep this momentum active.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-436cb16870ed4a81be204171dc71c378',
        versionId: '82ede969-4ddc-4340-a057-84abd993678f',
        name: 'Rising - Momentum Accelerator B',
        subject: 'You are gaining pace on Bullwaves. Keep your next steps clear.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-9ac3b56da884431c94791895c761bb57',
        versionId: 'f21cd31c-0cda-4000-a3f5-fd8a05bdcc7b',
        name: 'Rising - Momentum Accelerator A IT',
        subject: 'La tua attività Bullwaves sta crescendo. Mantieni attivo questo slancio.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-9ea506c98fea4800bc26eb2b607e2760',
        versionId: '89ec6174-376f-4d8a-a23d-b9afcf2762d5',
        name: 'Rising - Momentum Accelerator B IT',
        subject: 'Stai aumentando il ritmo su Bullwaves. Mantieni chiari i prossimi passi.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  rising_followup_retained_email: {
    en: {
      a: {
        templateId: 'd-fdcb5afa8d6647eaab4fe22f836eabb0',
        versionId: '87860a3b-1ed3-4620-8c2d-c9a53517e192',
        name: 'Rising - Positive Follow-up A',
        subject: 'Great result: your progress is confirmed. Keep moving forward.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-8f48e9117ccd4079b5ea98d3556e7c26',
        versionId: '2acaeff2-185f-4591-9ea5-2e4d3b145e33',
        name: 'Rising - Positive Follow-up B',
        subject: 'Your account is on track. Keep this pace in the next phase.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-a5bd6d7482ea42fd9a7a9c2a5b1c966b',
        versionId: '3c430233-e141-4763-a8b8-ae94f5528c9e',
        name: 'Rising - Positive Follow-up A IT',
        subject: 'Ottimo risultato: la tua progressione e confermata. Continua così.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-6d468e52cd704352b73701e9afbdcee1',
        versionId: 'dfc4829e-6bd5-4ab9-aae7-7ef3b9afdacf',
        name: 'Rising - Positive Follow-up B IT',
        subject: 'Il tuo account è in linea. Mantieni questo ritmo nella prossima fase.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
    },
  },
  rising_followup_recovery_email: {
    en: {
      a: {
        templateId: 'd-5e729ff9549b48cca2dc3bd853d534da',
        versionId: 'd7cc794f-cb75-426d-a32f-36857b7c2795',
        name: 'Rising - Return Follow-up A',
        subject: 'Your momentum can restart from a simpler Bullwaves path.',
        timing: 'D21',
        delay: '+9 days after missed outcome',
      },
      b: {
        templateId: 'd-5e9b9b910ea24d42b9f661ff6631b8d4',
        versionId: '115fdcf9-6aab-4fcd-9aff-9f2c749efb6a',
        name: 'Rising - Return Follow-up B',
        subject: 'A lighter path is active to help you resume your Bullwaves activity.',
        timing: 'D21',
        delay: '+9 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-4ed93ea1ef1a4bd4bb6aac76fe0b553f',
        versionId: '4936b911-0450-454b-beef-8906daa29a6a',
        name: 'Rising - Return Follow-up A IT',
        subject: 'Il tuo slancio può ripartire da un percorso Bullwaves più semplice.',
        timing: 'D21',
        delay: '+9 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-e2c26a6d5c79443e92a46e9bc2ca1f50',
        versionId: 'd2bf1767-ae61-4f63-940a-896a1cebca36',
        name: 'Rising - Return Follow-up B IT',
        subject: 'E attivo un percorso più leggero per riprendere la tua attività Bullwaves.',
        timing: 'D21',
        delay: '+9 giorni dopo esito non centrato',
      },
    },
  },
  rising_step3_email: {
    en: {
      a: {
        templateId: 'd-e4c07dc11d3e4bd9a115e2268489a0e8',
        versionId: '77a4def3-8e4e-4712-a4bf-8a4c7ffc872c',
        name: 'Rising - Tier-up Preparation A',
        subject: 'Your profile is close to an account upgrade. Complete this final preparation.',
        timing: 'D12',
        delay: '+8 days after step 2',
      },
      b: {
        templateId: 'd-c6e49b0e388e4e2fbbecbde5b760024a',
        versionId: '84bca25e-b1a4-4e6c-8b06-3d2a20f849dd',
        name: 'Rising - Tier-up Preparation B',
        subject: 'Before your next account review, confirm your final setup.',
        timing: 'D12',
        delay: '+8 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-c21978314bc14ffd8462c190a6a2f08f',
        versionId: '5fdbb960-225c-440e-994d-a3aae6bc9ea2',
        name: 'Rising - Tier-up Preparation A IT',
        subject:
          'Il tuo profilo è vicino a un upgrade account. Completa questa preparazione finale.',
        timing: 'D12',
        delay: '+8 giorni dopo step 2',
      },
      b: {
        templateId: 'd-291e1cc70a754b65a8fd61db80145185',
        versionId: '8c1b2e34-f165-4849-b175-7a55101d1ed2',
        name: 'Rising - Tier-up Preparation B IT',
        subject: 'Prima della prossima review account, conferma il setup finale.',
        timing: 'D12',
        delay: '+8 giorni dopo step 2',
      },
    },
  },
  'send-email-live-account-english': {
    en: {
      a: {
        templateId: 'd-261a19730b654706bbc72f2b7b70a4a0',
        versionId: '70fd60cd-e2ab-4e4c-9f50-797d958777e6',
        name: 'Send Email - Live Account - English',
        subject: 'Your Real Account is ready - access WebTrader now',
        timing: null,
        delay: null,
      },
    },
  },
  top_performing_advanced_tools_email: {
    en: {
      a: {
        templateId: 'd-c429c4ee61a541c1a93bb3067bfd1b80',
        versionId: '0e44aca5-414d-46b1-b454-a8ee40c2510d',
        name: 'Top Performing - Advanced Tools A',
        subject: 'A stronger trader should have a sharper support stack.',
        timing: 'D3',
        delay: '+3 days after VIP recognition',
      },
      b: {
        templateId: 'd-08a7f955ffbe40edaf977eb131be13d7',
        versionId: '7b675b42-f6a4-4299-aacd-bb2ed9a8963d',
        name: 'Top Performing - Advanced Tools B',
        subject: 'Protecting edge often starts with a better operating environment.',
        timing: 'D3',
        delay: '+3 days after VIP recognition',
      },
    },
    it: {
      a: {
        templateId: 'd-f03115f26bff4ee1bcb1b54747ab628d',
        versionId: 'bcd1a0e8-359c-42a6-b0aa-802d572cbd32',
        name: 'Top Performing - Advanced Tools A IT',
        subject: 'Un trader più forte dovrebbe avere un supporto più preciso.',
        timing: 'D3',
        delay: '+3 giorni dopo il touch VIP',
      },
      b: {
        templateId: 'd-9452b9797bb547d1ae4881ab366a2020',
        versionId: '9455c1db-5deb-43ce-9c75-e13744930430',
        name: 'Top Performing - Advanced Tools B IT',
        subject: 'Proteggere il vantaggio spesso inizia da un ambiente operativo migliore.',
        timing: 'D3',
        delay: '+3 giorni dopo il touch VIP',
      },
    },
  },
  top_performing_loyalty_upgrade_email: {
    en: {
      a: {
        templateId: 'd-a19070deaa3d410a9e7baca76a72533a',
        versionId: '705270f1-2933-4aa1-aaf7-027dbaf5ad49',
        name: 'Top Performing - Loyalty Upgrade A',
        subject: 'Your consistency is opening premium loyalty treatment.',
        timing: 'D10',
        delay: '+7 days after advanced tools offer',
      },
      b: {
        templateId: 'd-aa4bf44bcef9469ab6d4bfe563fed8c3',
        versionId: '7b8ab1d5-85a8-4be7-b2c6-faca5736ccd9',
        name: 'Top Performing - Loyalty Upgrade B',
        subject: 'A stronger loyalty tier is ready for your Bullwaves profile.',
        timing: 'D10',
        delay: '+7 days after advanced tools offer',
      },
    },
    it: {
      a: {
        templateId: 'd-744a20031d9a477f83fb5e457874172a',
        versionId: 'ec4c610f-14d6-4963-8c0b-d89aa24625a8',
        name: 'Top Performing - Loyalty Upgrade A IT',
        subject: 'La tua continuità sta aprendo un percorso loyalty premium.',
        timing: 'D10',
        delay: "+7 giorni dopo l'offerta strumenti avanzati",
      },
      b: {
        templateId: 'd-9cdfe45675c142799fd00a31f8dae057',
        versionId: 'fe35bc6f-c66d-4740-b51c-a4f5aa22d6ff',
        name: 'Top Performing - Loyalty Upgrade B IT',
        subject: 'Un livello loyalty più forte è pronto per il tuo profilo Bullwaves.',
        timing: 'D10',
        delay: "+7 giorni dopo l'offerta strumenti avanzati",
      },
    },
  },
  top_performing_premium_nurture_email: {
    en: {
      a: {
        templateId: 'd-efc0da19c9a4476ca3a91279f470fd36',
        versionId: '52a4b6b3-a267-45f4-adbd-e41f69426977',
        name: 'Top Performing - Premium Nurture A',
        subject: 'Keep your Bullwaves premium momentum alive.',
        timing: 'D30',
        delay: '+30 days after last premium touch',
      },
      b: {
        templateId: 'd-305e5634329a4ac1b88c4574ced922dc',
        versionId: 'ac23ddad-7a41-4419-8d27-b9be928eaed7',
        name: 'Top Performing - Premium Nurture B',
        subject: 'A premium relationship stays strong through intelligent continuity.',
        timing: 'D30',
        delay: '+30 days after last premium touch',
      },
    },
    it: {
      a: {
        templateId: 'd-2d70f9922269462caf91e673028711a4',
        versionId: '227ac85d-a39b-4427-a04b-88e90c1d3348',
        name: 'Top Performing - Premium Nurture A IT',
        subject: 'Mantieni vivo il tuo slancio premium su Bullwaves.',
        timing: 'D30',
        delay: "+30 giorni dopo l'ultimo touch premium",
      },
      b: {
        templateId: 'd-23cea9f4d5c947eaa22fa68e2226114b',
        versionId: '780288bf-3541-4ca6-83bd-53c6bd1fc460',
        name: 'Top Performing - Premium Nurture B IT',
        subject: 'Una relazione premium resta forte con continuità intelligente.',
        timing: 'D30',
        delay: "+30 giorni dopo l'ultimo touch premium",
      },
    },
  },
  top_performing_vip_recognition_email: {
    en: {
      a: {
        templateId: 'd-facde08614f04f56ae41098b1d259790',
        versionId: 'fbb49def-3dcd-4959-846b-e88652b65426',
        name: 'Top Performing - VIP Recognition A',
        subject: 'You are among Bullwaves top performers. We built your next step accordingly.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-2dfe9f0f7765431fa7f3959ad3565e3d',
        versionId: '58075aec-8e05-4140-950f-b8c559deee56',
        name: 'Top Performing - VIP Recognition B',
        subject: 'Your trading profile unlocked a more tailored Bullwaves path.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-bc1d08258d954cf898600618d932fb92',
        versionId: '571e7f7e-0797-42de-8e50-49b102e2f64c',
        name: 'Top Performing - VIP Recognition A IT',
        subject: 'Sei tra i top performer Bullwaves. Il prossimo passo è costruito di conseguenza.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-8356912bf6134d2bb36722c42bf2173d',
        versionId: 'e17d67b0-7adb-432e-952e-a7f69a8ce191',
        name: 'Top Performing - VIP Recognition B IT',
        subject: 'Il tuo profilo trading ha sbloccato un percorso Bullwaves più su misura.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
  },
  top_performing_vip_review_email: {
    en: {
      a: {
        templateId: 'd-d4fec930a9d04fd98bd42a5750044e46',
        versionId: '82d6553c-b8f0-4620-978e-acd045dd12d3',
        name: 'Top Performing - VIP Review A',
        subject: 'Your quarterly Bullwaves VIP review is ready.',
        timing: 'Q+0d',
        delay: 'At the start of the quarterly review cycle',
      },
      b: {
        templateId: 'd-a24766ea18da4b09a4c8c922dffc77ec',
        versionId: '3743f280-0333-4fd5-a337-8f5d4aaf624e',
        name: 'Top Performing - VIP Review B',
        subject: 'A stronger next quarter starts with a sharper review now.',
        timing: 'Q+0d',
        delay: 'At the start of the quarterly review cycle',
      },
    },
    it: {
      a: {
        templateId: 'd-bc1cdc19d09b4aa5a679cee6deeb6608',
        versionId: 'f1ae3127-a431-4809-a702-23d30a416c59',
        name: 'Top Performing - VIP Review A IT',
        subject: 'La tua review VIP trimestrale Bullwaves è pronta.',
        timing: 'Q+0d',
        delay: 'All inizio del ciclo review trimestrale',
      },
      b: {
        templateId: 'd-340d300b319141e5a5c713b536c9d5af',
        versionId: '57bb9e38-8b89-4025-a858-939f1fbd4c62',
        name: 'Top Performing - VIP Review B IT',
        subject: 'Un prossimo trimestre più forte parte da una review più lucida oggi.',
        timing: 'Q+0d',
        delay: 'All inizio del ciclo review trimestrale',
      },
    },
  },
  unfunded_newcomers_post_login_deposit_activation_email: {
    it: {
      a: {
        templateId: 'd-9d4a617450cb4e85a01c5269442518a4',
        versionId: '06d8d3af-ad0c-4d00-a412-b4991418ecb7',
        name: 'Unfunded Newcomers - +48h Deposito + Trade A',
        subject: 'Il tuo account è attivo. Il tuo account manager dedicato è ora disponibile.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
      b: {
        templateId: 'd-11de40d7b27345e791ba42457c7d87a0',
        versionId: '8c0e50d1-96d0-4434-9d2a-761327a60d06',
        name: 'Unfunded Newcomers - +48h Deposito + Trade B',
        subject: 'La tua prima operatività è avviata. Ora hai una guida dedicata.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
      c: {
        templateId: 'd-bf339b4872004db2bf953c151bdf9413',
        versionId: '6980fde0-7044-4dd3-8178-1faf5fcc9bf5',
        name: 'Unfunded Newcomers - +48h Deposito + Trade C',
        subject: 'Il tuo primo trade è aperto. Incontra il tuo account manager.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
    },
    en: {
      a: {
        templateId: 'd-92a5d540684e4d9cb85f9b8770e6038b',
        versionId: '2a2ca20c-cbfd-4ace-a471-c6149c651ff3',
        name: 'Unfunded Newcomers - +48hr Deposit + Trade A',
        subject: 'Your account is active. Your dedicated account manager is now available.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
      b: {
        templateId: 'd-c1f5cb7c884241c9aa16f769cfd24ec4',
        versionId: '4f2a4bf1-c230-4acc-9b13-616b9af958d4',
        name: 'Unfunded Newcomers - +48hr Deposit + Trade B',
        subject: 'Your first activity is in place. Dedicated guidance is now available.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
      c: {
        templateId: 'd-47aaed8bae5240c0a7117183ebca8951',
        versionId: '6806a74f-7141-4d5f-9261-eb9a7ff8a153',
        name: 'Unfunded Newcomers - +48hr Deposit + Trade C',
        subject: 'Your First Trade is Open. Meet Your Account Manager.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
    },
  },
  unfunded_newcomers_account_activation_reminder_email: {
    it: {
      a: {
        templateId: 'd-2307346007b54fab8ce9992209242aa7',
        versionId: '8169fc46-e88e-4c09-b9af-7384831e9607',
        name: 'Unfunded Newcomers - +48h Nessun Deposito A',
        subject: 'Il deposito non è ancora stato completato. Il prossimo passo è ancora aperto.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
      b: {
        templateId: 'd-c08883a15b5e4d3b8cd6bfacc1ee0d0b',
        versionId: 'ecc77dc5-4640-4272-b0d7-6189aaeb1a1f',
        name: 'Unfunded Newcomers - +48h Nessun Deposito B',
        subject: 'Il tuo account è pronto. Il passaggio di deposito è ancora da completare.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
      c: {
        templateId: 'd-68ca4eaa85b7431abf471d20535b5115',
        versionId: 'dc81f391-d515-40f9-94ed-e7464929e1b6',
        name: 'Unfunded Newcomers - +48h Nessun Deposito C',
        subject: 'Effettua Oggi il Tuo Primo Deposito e Lo Raddoppieremo',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
    },
    en: {
      a: {
        templateId: 'd-9e29971d2dba4169af30bede59905311',
        versionId: 'da0c9aa4-85ac-4319-ba93-447344e4a65c',
        name: 'Unfunded Newcomers - +48hr No Deposit A',
        subject: 'No deposit has been completed yet. Your next step is still open.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
      b: {
        templateId: 'd-3a9f63c305774a58809e5ea61e9371c9',
        versionId: '87db75e3-dc9b-42ae-9a9e-c9cb94763760',
        name: 'Unfunded Newcomers - +48hr No Deposit B',
        subject: 'Your account is ready. The deposit step is still pending.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
      c: {
        templateId: 'd-c2aabf5c713c4aed95fa2af95e645d6c',
        versionId: '3987ee95-a139-4104-b9d9-0abd312f5477',
        name: 'Unfunded Newcomers - +48hr No Deposit C',
        subject: 'Make Your First Deposit Today & We Will Double it',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
    },
  },
  unfunded_newcomers_deposit_intent_recovery_email: {
    en: {
      a: {
        templateId: 'd-8827359ed0f247fca15385dc923b0c9e',
        versionId: '27c3beb7-c2ca-4077-bca0-fe8c5ad64815',
        name: 'Unfunded Newcomers - Deposit Intent Recovery A',
        subject: 'Your account is ready to continue. The deposit path is still open.',
        timing: '+3d',
        delay: '+3 days after the no-deposit follow-up',
      },
      b: {
        templateId: 'd-02f31ec08ff74572905509b24fc6f60b',
        versionId: '4801f28f-f300-41f4-8ff0-23f64e54bce2',
        name: 'Unfunded Newcomers - Deposit Intent Recovery B',
        subject: 'Your return is a good sign. The deposit path is still available.',
        timing: '+3d',
        delay: '+3 days after the no-deposit follow-up',
      },
      c: {
        templateId: 'd-f8990f48b83d40edae64023fb50df0a4',
        versionId: 'fb51c31c-c6fe-418f-b65c-80b9baa8a36f',
        name: 'Unfunded Newcomers - Deposit Intent Recovery C',
        subject: 'Your account is ready to continue. The deposit path is still open.',
        timing: '+3d',
        delay: '+3 days after the no-deposit follow-up',
      },
    },
    it: {
      a: {
        templateId: 'd-315b0dffc5f144af98c59cdb20ca57c6',
        versionId: 'b3855930-c930-4e3e-8a19-8a6aec7e80f4',
        name: 'Unfunded Newcomers - Recupero Intento Deposito A',
        subject: 'Il tuo account è pronto per continuare. Il percorso di deposito è ancora aperto.',
        timing: '+3g',
        delay: '+3 giorni dopo il touch no-deposito',
      },
      b: {
        templateId: 'd-538d84691d514767b4150d388e7c4bc6',
        versionId: 'fe6d539b-9063-4d4f-ad10-ab532849acbf',
        name: 'Unfunded Newcomers - Recupero Intento Deposito B',
        subject:
          'Il tuo rientro è un segnale positivo. Il percorso di deposito è ancora disponibile.',
        timing: '+3g',
        delay: '+3 giorni dopo il touch no-deposito',
      },
      c: {
        templateId: 'd-8f8d715f96a94c4caa99ab68ae43af5b',
        versionId: '2c14ef27-e366-48a6-889e-c2a174df5ac6',
        name: 'Unfunded Newcomers - Recupero Intento Deposito C',
        subject: 'Il Tuo Account È Pronto. Il Percorso di Deposito È Ancora Aperto.',
        timing: '+3g',
        delay: '+3 giorni dopo il touch no-deposito',
      },
    },
  },
  unfunded_newcomers_first_deposit_push_email: {
    en: {
      a: {
        templateId: 'd-4477fc824cc5465a9b56c986877310fb',
        versionId: 'f87b25a9-c70b-4b47-b502-36e41acaddba',
        name: 'Unfunded Newcomers - First Deposit Push A',
        subject:
          'Your first deposit is complete. Your Bullwaves account is ready for the next step.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediately after successful deposit confirmation',
      },
      b: {
        templateId: 'd-9bdb7870f0cb4634be396a2947fc938f',
        versionId: '30c7024d-5086-4d6f-bf25-2ae5384e4da0',
        name: 'Unfunded Newcomers - First Deposit Push B',
        subject: 'Your account is funded. Now continue with the next active step.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediately after successful deposit confirmation',
      },
      c: {
        templateId: 'd-40e6de549390471eb8cb86d0a683d4bc',
        versionId: 'c72fa1c4-042b-4a5c-94da-b8fafe9e76db',
        name: 'Unfunded Newcomers - First Deposit Push C',
        subject: 'Trade with real-time AI market intelligence.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediately after successful deposit confirmation',
      },
    },
    it: {
      a: {
        templateId: 'd-8a24c0b859d34448b6d6842f97692b39',
        versionId: '7962e2ae-a37f-4a73-8cf8-63988b4c8daa',
        name: 'Unfunded Newcomers - Primo Deposito A',
        subject:
          'Il tuo primo deposito è completato. Il tuo account Bullwaves è pronto per il prossimo passo.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediatamente dopo la conferma del deposito',
      },
      b: {
        templateId: 'd-9ab42207c2aa4905bb498952a7dd3fa1',
        versionId: '6424e373-f704-4a8b-be67-ecbc1f0b2686',
        name: 'Unfunded Newcomers - Primo Deposito B',
        subject: 'Il tuo account è finanziato. Ora continua con il prossimo passo operativo.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediatamente dopo la conferma del deposito',
      },
      c: {
        templateId: 'd-e43a229b8f164758950ca5d06cb6b394',
        versionId: 'f9bf2f89-c9e7-4fa5-9d4b-8ea41c935fdb',
        name: 'Unfunded Newcomers - Primo Deposito C',
        subject: 'Fai Trading con l’Intelligenza di Mercato AI in Tempo Reale',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediatamente dopo la conferma del deposito',
      },
    },
  },
  unfunded_newcomers_first_trade_onboarding_email: {
    en: {
      a: {
        templateId: 'd-3329c8ea34be4de8b32cccc8f04d8fdb',
        versionId: 'f19b195f-9a9d-462e-b15c-445776fc86b5',
        name: 'Unfunded Newcomers - First Trade Onboarding A',
        subject: 'Your first deposit is complete. Your dedicated account manager is available.',
        timing: 'FTD +0d',
        delay: 'Immediately after successful first deposit',
      },
      b: {
        templateId: 'd-eb17316de65a497ea42cff68d736fd63',
        versionId: 'be191919-4066-48f7-a407-754ea56fd773',
        name: 'Unfunded Newcomers - First Trade Onboarding B',
        subject: 'Your account is now funded. Dedicated support is available for the next step.',
        timing: 'FTD +0d',
        delay: 'Immediately after successful first deposit',
      },
      c: {
        templateId: 'd-847ccd5ae36946a88cc46a4d29c35536',
        versionId: '746651db-256e-44c0-9bab-f6fb3e17de3c',
        name: 'Unfunded Newcomers - First Trade Onboarding C',
        subject: 'Your first deposit is complete. Meet your account manager.',
        timing: 'FTD +0d',
        delay: 'Immediately after successful first deposit',
      },
    },
    it: {
      a: {
        templateId: 'd-ddffe6ad701d431aa740166844ce8110',
        versionId: '01f0635b-bf56-4d9d-99b4-b378fd18e649',
        name: 'Unfunded Newcomers - Onboarding Primo Trade A',
        subject:
          'Il tuo primo deposito è completato. Il tuo account manager dedicato è disponibile.',
        timing: 'FTD +0d',
        delay: 'Immediatamente dopo il primo deposito riuscito',
      },
      b: {
        templateId: 'd-0c60023f73d140948e4b1f6d419dc512',
        versionId: 'e8479ca0-4d01-488e-a178-5ac2ddb88d31',
        name: 'Unfunded Newcomers - Onboarding Primo Trade B',
        subject: 'Il tuo account è ora finanziato. Hai un supporto dedicato per il prossimo passo.',
        timing: 'FTD +0d',
        delay: 'Immediatamente dopo il primo deposito riuscito',
      },
      c: {
        templateId: 'd-ba4e710530284a5f9f742aef8016b2da',
        versionId: '88efcfb7-640e-452a-a2be-97a22d0c81b6',
        name: 'Unfunded Newcomers - Onboarding Primo Trade C',
        subject: 'Il Tuo Primo Deposito È Completato. Incontra il Tuo Account Manager.',
        timing: 'FTD +0d',
        delay: 'Immediatamente dopo il primo deposito riuscito',
      },
    },
  },
  unfunded_newcomers_friction_reduction_email: {
    en: {
      a: {
        templateId: 'd-8a7a4d439aa1464f9cc748b5274b9a14',
        versionId: '9784b0ce-7ac5-4f6e-914b-21c5af62a847',
        name: 'Unfunded Newcomers - Friction Reduction A',
        subject: 'If you have questions before funding, here is a clearer way forward.',
        timing: 'D2',
        delay: '+2 days after welcome message',
      },
      b: {
        templateId: 'd-416de086e9b24168acb7180073e89470',
        versionId: '66434700-61b1-4ab6-b05e-187c31a5363a',
        name: 'Unfunded Newcomers - Friction Reduction B',
        subject: 'The deposit step may be simpler than it seems.',
        timing: 'D2',
        delay: '+2 days after welcome message',
      },
    },
    it: {
      a: {
        templateId: 'd-e2098132b8ef49ee802c79a8fc98b955',
        versionId: 'a4c088c5-369f-4078-aa79-8f0c1626866e',
        name: 'Unfunded Newcomers - Riduzione Attriti A',
        subject: 'Se hai dubbi prima di depositare, ecco un modo più chiaro per procedere.',
        timing: 'D2',
        delay: '+2 giorni dopo il welcome message',
      },
      b: {
        templateId: 'd-906eaba785fb483f8a3710af3ff70160',
        versionId: '89d69cef-f5fc-4f3e-9f97-589fb67f6644',
        name: 'Unfunded Newcomers - Riduzione Attriti B',
        subject: 'Il deposito potrebbe essere più semplice di quanto sembri.',
        timing: 'D2',
        delay: '+2 giorni dopo il welcome message',
      },
    },
  },
  unfunded_newcomers_reentry_nurture_email: {
    en: {
      a: {
        templateId: 'd-ad561478c20a450f93c71cc99c22fff0',
        versionId: '2ed106ee-4d31-4115-95b8-ff7eb40340e8',
        name: 'Unfunded Newcomers - Re-entry Nurture A',
        subject: 'If you are still considering Bullwaves, returning can be simpler than expected.',
        timing: 'D21',
        delay: '+21 days after last non-converted step',
      },
      b: {
        templateId: 'd-46e2360d1ff74065b620cfd014a543d7',
        versionId: 'cc6414a7-7c0d-478c-8d90-da0ea009f549',
        name: 'Unfunded Newcomers - Re-entry Nurture B',
        subject: 'Your Bullwaves opportunity is still open. You can return with greater clarity.',
        timing: 'D21',
        delay: '+21 days after last non-converted step',
      },
      c: {
        templateId: 'd-e1697cd621a3437096aab03a997f981d',
        versionId: 'f4e4b9af-834e-4735-aa29-48f58e01985f',
        name: 'Unfunded Newcomers - Re-entry Nurture C',
        subject: 'Still considering Bullwaves? It is easier than you think.',
        timing: 'D21',
        delay: '+21 days after last non-converted step',
      },
    },
    it: {
      a: {
        templateId: 'd-3f9800300de44fda8b592b0c26326312',
        versionId: 'e5e8d412-90b5-4704-b0b2-da06d91169e9',
        name: 'Unfunded Newcomers - Riattivazione Soft A',
        subject:
          'Se stai ancora valutando Bullwaves, tornare può essere più semplice di quanto sembri.',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
      b: {
        templateId: 'd-58f46370970b4c27915d43d6d6355538',
        versionId: '95a8823d-161f-43d9-ab9d-a584171fb25d',
        name: 'Unfunded Newcomers - Riattivazione Soft B',
        subject:
          'La tua opportunità con Bullwaves è ancora aperta. Puoi rientrare con maggiore chiarezza.',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
      c: {
        templateId: 'd-7967c399fada4390bd76e4f67fe877ad',
        versionId: '41fb0c0e-e931-424b-9370-56c4a29c5e02',
        name: 'Unfunded Newcomers - Riattivazione Soft C',
        subject: 'Stai Ancora Valutando Bullwaves? È Più Semplice di Quanto Pensi',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
    },
  },
  unfunded_newcomers_welcome_value_email: {
    it: {
      a: {
        templateId: 'd-ce5888a4570d470ca8622d137fd6e67d',
        versionId: 'ee9ed1e8-8410-49f5-ab44-7b08a8b88f06',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore A',
        subject: 'Il tuo account Bullwaves è pronto. Il prossimo passo è disponibile quando vuoi.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-be776716ff8d4d7fabcfe500f668c84c',
        versionId: '98a29c08-0078-467d-9679-1bc19e8e144c',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore B',
        subject:
          'Registrazione completata. Il tuo account Bullwaves è pronto per il prossimo passo.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      c: {
        templateId: 'd-f8efa051f24941eaab901cdb4953ebf4',
        versionId: '73810739-7454-4f5f-9919-bf9308df3464',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore C',
        subject:
          '{{#if first_name}}{{first_name}}, {{/if}}Il Tuo Account È Pronto Per Fare Trading.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
    en: {
      a: {
        templateId: 'd-3d420139066641ceae1baf58d5560fb6',
        versionId: 'b0ebe51c-427e-497f-8056-2f3faa3fbc25',
        name: 'Unfunded Newcomers - Welcome + Value Proposition A',
        subject: 'Your Bullwaves account is ready. The next step is available whenever you are.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-7e99295ac2ab46e0a2c7af7ac85ba507',
        versionId: '60e900f9-3cb2-40e2-9abb-d9c986af378e',
        name: 'Unfunded Newcomers - Welcome + Value Proposition B',
        subject:
          'Your registration is complete. Your Bullwaves account is ready for the next step.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      c: {
        templateId: 'd-5897730b0c164d5eab09e854c34aad08',
        versionId: '9f65fcc4-0ebb-49b9-bd05-9d4ee27a70a2',
        name: 'Unfunded Newcomers - Welcome + Value Proposition C',
        subject: '{{#if first_name}}{{first_name}}, {{/if}}Your Account Is Ready to Trade.',
        timing: 'D0',
        delay: '0 days from segment entry',
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
