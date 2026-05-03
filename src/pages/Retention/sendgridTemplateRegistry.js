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

export const sendgridTemplateRegistryGeneratedAt = '2026-05-03T17:00:59.855Z'

export const sendgridTemplateRegistry = {
  churned_high_value_step3_email: {
    en: {
      a: {
        templateId: 'd-84f36e5884ee44e48b3343ed93606976',
        versionId: 'ce833a4a-7726-4943-b729-e210b2afdb6d',
        name: 'Churned High Value - Active Return Consolidation A',
        subject: 'After your deposit, Bullwaves can now support the next phase more completely.',
        timing: 'D7',
        delay: '+4 days after step 2',
      },
      b: {
        templateId: 'd-38fc5030729249dbb21ec5cc04c50140',
        versionId: '8ad8ffc8-0793-4530-9012-9b8f48d398e6',
        name: 'Churned High Value - Active Return Consolidation B',
        subject: 'Your deposit restarted the path. A final supportive review is now available.',
        timing: 'D7',
        delay: '+4 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-ddd47a8a7df74da4bd75fe6f21d652df',
        versionId: '476ba331-4e1f-453d-95ad-1a150a187f6e',
        name: 'Churned High Value - Consolidamento Ritorno Attivo A IT',
        subject:
          'Dopo il tuo deposito, Bullwaves può supportare in modo più completo la prossima fase.',
        timing: 'D7',
        delay: '+4 giorni dopo step 2',
      },
      b: {
        templateId: 'd-570b03891c3d4d398ee28cd2bec5fa2e',
        versionId: 'a544a6a4-96f7-420e-99fe-c6bd31d23dbe',
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
        templateId: 'd-d7e44349a97f4f399db7891b4b825c8c',
        versionId: 'd9d1f4b7-d545-4d43-8192-da87b578b2a1',
        name: 'Churned High Value - Comeback Touch A',
        subject: 'A more tailored Bullwaves return plan is ready for you.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-46d62f83ddba47b99c68d362d3d54995',
        versionId: 'bdec7232-a679-446a-8d5c-1fe79d247306',
        name: 'Churned High Value - Comeback Touch B',
        subject: 'Your dedicated Bullwaves review is open in your client area.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-67937e426c814150b621fae97f273234',
        versionId: '827ddcc9-2857-41fa-b160-e0cdfe9f7e71',
        name: 'Churned High Value - Comeback Touch A IT',
        subject: 'Per il tuo rientro abbiamo preparato una proposta Bullwaves più su misura.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-efac67dd9f8d4098934b1d21acbacef1',
        versionId: '9d9a344e-4585-4c32-9a63-685bfd7f4c4a',
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
        templateId: 'd-b321bbd9b55c4527aacc3264f7447823',
        versionId: 'bf2af812-97ea-4bd2-8757-bf78e156d577',
        name: 'Churned High Value - Positive Follow-up A',
        subject: 'Good news: your deposit has reactivated the Bullwaves path.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-d77e4d7b92314f45aa7193dd239dcc0c',
        versionId: '859578cb-858e-4283-aba6-af9fe7702fed',
        name: 'Churned High Value - Positive Follow-up B',
        subject: 'Your return is moving in the right direction after the recent deposit.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-14235d7d91a1420b869a9379771c732f',
        versionId: 'c4e14fa5-322c-4cc0-b453-2fa6e24fb596',
        name: 'Churned High Value - Positive Follow-up A IT',
        subject: 'Buone notizie: il tuo deposito ha riattivato il percorso Bullwaves.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-0fc1a9467ec241d98eb6c4d1489f0982',
        versionId: '4056f86e-d286-49ce-ab7c-002579f52e93',
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
        templateId: 'd-3f695226e923416f901a1b65d3915235',
        versionId: '89682190-2eeb-49d5-ada0-089209ac7942',
        name: 'Churned High Value - Return Follow-up A',
        subject: 'No deposit yet? The Bullwaves reactivation path is still open.',
        timing: 'D14',
        delay: '+7 days after missed outcome',
      },
      b: {
        templateId: 'd-6487472321da43db9a26d426bc7ad601',
        versionId: '31ddfd7a-221e-479c-89fe-f76c0f478527',
        name: 'Churned High Value - Return Follow-up B',
        subject:
          'Still no action? A lighter Bullwaves return option is available for your account.',
        timing: 'D14',
        delay: '+7 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-e0e9acc11edc4ed28116f48a85a19b1d',
        versionId: '25948319-f9a9-4125-a9cb-4f968f332ccb',
        name: 'Churned High Value - Return Follow-up A IT',
        subject: 'Nessun deposito ancora? Il percorso di riattivazione Bullwaves è ancora aperto.',
        timing: 'D14',
        delay: '+7 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-22abe1a885ac4752814421ff0125336b',
        versionId: 'a7022b07-f00f-4f65-9239-c9801a69daf7',
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
        templateId: 'd-78875ecc4d30479aaf2e6fc4cfb386b1',
        versionId: '00d80574-81e3-457c-8060-991547bb3fd5',
        name: 'Churned High Value - Return Package A',
        subject: 'Your Bullwaves deposit is confirmed. Here is the next supported step.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
      b: {
        templateId: 'd-c3932e97d2ea41f29169001897790e22',
        versionId: '7c7ea9ea-d370-4713-8c0b-309a2c145fa7',
        name: 'Churned High Value - Return Package B',
        subject: 'You already restarted the path. Let’s keep it moving.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-a6134fb137314158bee5d8e090546f80',
        versionId: 'a7957eb8-e211-4c11-9f17-a3ac1056dbef',
        name: 'Churned High Value - Return Package A IT',
        subject: 'Il tuo deposito Bullwaves è confermato. Ecco il prossimo passo supportato.',
        timing: 'D3',
        delay: '+3 giorni dopo step 1',
      },
      b: {
        templateId: 'd-b59a3a8587f042a1ad3ef8d7821af8e3',
        versionId: '8330ace9-1d9f-4875-adab-c12e1a76edaf',
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
        templateId: 'd-eabdc1cf8e5048c4acbdc8bf8d0556c4',
        versionId: '680667bd-60d6-496b-9c46-f5eafaf5b66c',
        name: 'Dormant 120d - Bonus Activation Reminder A',
        subject: 'To request the 100 USD bonus, send BONUS100 on WhatsApp.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
      b: {
        templateId: 'd-51f7cf54a416430f95d2915a2f826bcc',
        versionId: 'b707f6b0-12a4-443d-b69a-df371bdff956',
        name: 'Dormant 120d - Bonus Activation Reminder B',
        subject: 'A simpler return starts with one WhatsApp keyword: BONUS100.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-7a52fde54eec4a64b0c3ae9f97d6c813',
        versionId: 'e3c26fa7-d331-4267-8cd7-87b3d89eaa85',
        name: 'Dormant 120d - Reminder Attivazione Bonus A IT',
        subject: 'Per richiedere il bonus da 100 USD, invia BONUS100 su WhatsApp.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
      b: {
        templateId: 'd-b8c62e3f366a41449ec634db33b799ef',
        versionId: '815339ec-93a3-4afc-ae4f-3868dab65adb',
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
        templateId: 'd-34cc971807154d84876c4dca22ca6738',
        versionId: 'f8f2e1b5-0c8a-44aa-a78d-2ff49e2b9cb3',
        name: 'Dormant 120d - Bonus Recovery Follow-up A',
        subject: 'Your 100 USD WhatsApp bonus route is still available.',
        timing: 'D21',
        delay: '+11 days after missed outcome',
      },
      b: {
        templateId: 'd-f3e00b8bfd694ac99ac4787df61e3514',
        versionId: 'ea189fe1-edc6-4e7b-a956-04c6eaf72979',
        name: 'Dormant 120d - Bonus Recovery Follow-up B',
        subject: 'Still inactive? Your manager-led 100 USD bonus option remains open.',
        timing: 'D21',
        delay: '+11 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-b9242ab7311d46b2ba8e97a8eed67ebc',
        versionId: 'b80dbdcb-bdeb-4399-a945-65d93bc8cd10',
        name: 'Dormant 120d - Follow-up Recovery Bonus A IT',
        subject: 'Il tuo percorso bonus da 100 USD su WhatsApp è ancora disponibile.',
        timing: 'D21',
        delay: '+11 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-b1cdcd7215e4489cba1cb76bfeb1758d',
        versionId: 'e57b889f-b1a8-49cd-a5ad-47f67648226e',
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
        templateId: 'd-46a63ee0e4384d36a01573f60a628fa3',
        versionId: 'c79e0a78-e3ba-4340-98bb-dd8f47e9eb37',
        name: 'Dormant 120d - Bonus Request Confirmed A',
        subject: 'Your Bullwaves bonus request has reopened the path.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-7d10d6a1f57644aaa5cb1d9b3c4d4294',
        versionId: 'a4025724-8ac8-46d6-aac4-b34410ab9dd5',
        name: 'Dormant 120d - Bonus Request Confirmed B',
        subject: 'Good news: your bonus path is now back in motion.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-0c73b85891624635aa69f63f2921dad5',
        versionId: '475ab307-e03a-4e9b-a74a-c561b354997c',
        name: 'Dormant 120d - Richiesta Bonus Confermata A IT',
        subject: 'La tua richiesta bonus Bullwaves ha riaperto il percorso.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-ad04a1be286d4bd697c8636cb0145608',
        versionId: '2e8898e4-ce91-4aa8-bd1f-7c2fac6dd9df',
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
        templateId: 'd-0c8a1f3998eb44bbb81086efd7337e8f',
        versionId: '71bba433-1b43-4a1b-bc8a-a888294f82d2',
        name: 'Dormant 120d - Free Bonus Invite A',
        subject: 'A 100 USD Bullwaves bonus can now help you restart.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-735d94ce982e4902a2bbe875fb5faca3',
        versionId: '0e35c73c-7195-44b6-8186-6775da00e73d',
        name: 'Dormant 120d - Free Bonus Invite B',
        subject: 'Your account is eligible for a 100 USD reactivation bonus.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-943b0291b40544b09b5308ec75fcab3d',
        versionId: 'a506dc1f-8803-4e4e-bc41-141ecbcd5da4',
        name: 'Dormant 120d - Invito Bonus Gratuito A IT',
        subject: 'Un bonus Bullwaves da 100 USD può aiutarti a ripartire.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-07d226c2e2294b3da02c3d5dd0caabd9',
        versionId: '0684d369-f019-4348-936f-05fedbf14210',
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
        templateId: 'd-91ac45b307d84bdbb40ef50f9af53ac9',
        versionId: '60aa6ae5-f06d-48c6-994a-e932311dd420',
        name: 'Dormant 120d - Last Call Bonus Support A',
        subject: 'If you want a low-friction return, your 100 USD bonus path is still open.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
      b: {
        templateId: 'd-15a384553e5046d5b9de119f34aac3cb',
        versionId: 'e58760e8-3d5c-4977-a2a9-b3b026ea671a',
        name: 'Dormant 120d - Last Call Bonus Support B',
        subject: 'The 100 USD bonus offer is still available for your account.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-3d1db2828cc2440f8c8c8bb107043c9c',
        versionId: '26d99f8b-09e5-4792-b135-2c42c8975955',
        name: 'Dormant 120d - Supporto Finale Bonus A IT',
        subject:
          'Se vuoi un rientro più leggero, il tuo percorso bonus da 100 USD e ancora aperto.',
        timing: 'D10',
        delay: '+6 giorni dopo step 2',
      },
      b: {
        templateId: 'd-8d12a97bae6b4391a16105007d4eac4f',
        versionId: 'c589e715-5e15-4333-80e3-6b7cf0869642',
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
        templateId: 'd-61085bb539664c6eb0ef42b0a412222b',
        versionId: 'e9e071f6-7841-42f4-9971-ff75efe22a95',
        name: 'Dormant Low - Light Continuity Nurture A',
        subject: 'Keep your Bullwaves restart active with one light next step.',
        timing: 'D15',
        delay: '+9 days after step 2',
      },
      b: {
        templateId: 'd-03386e463fc44a33bc0962b33f485a88',
        versionId: '012d885a-8ce8-4864-bbbf-6934d4360acf',
        name: 'Dormant Low - Light Continuity Nurture B',
        subject: 'Your Bullwaves account is moving again. Keep the next step simple.',
        timing: 'D15',
        delay: '+9 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-600a4dd1da7d4cc883961a5e494ff1b3',
        versionId: '2008a050-4947-4250-862e-605057f02765',
        name: 'Dormant Low - Light Continuity Nurture A IT',
        subject: 'Mantieni attiva la tua ripartenza Bullwaves con un leggero passo in più.',
        timing: 'D15',
        delay: '+9 giorni dopo step 2',
      },
      b: {
        templateId: 'd-de8c40a3355b43c989ca7186e7c7b6b4',
        versionId: 'f63544c4-f76d-449a-81b3-a1b402a832cc',
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
        templateId: 'd-362cdc1a229b4b5e9198fd0cbd08b92b',
        versionId: '415e3549-004b-4a5b-b41b-2ea3c5b87b18',
        name: 'Dormant Low - Positive Follow-up A',
        subject: 'Good news: your Bullwaves restart is working.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-8af0ca8fdd944133b6a63c485f7e8295',
        versionId: 'd0a0dbbc-35da-4bfb-938b-dff3398ba366',
        name: 'Dormant Low - Positive Follow-up B',
        subject: 'Your account is active again. Keep the next steps light and clear.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-9e26cb6b9efe47baa3f3725050ea09b4',
        versionId: 'f6f8b398-2981-49b6-a518-ec8828e0da03',
        name: 'Dormant Low - Positive Follow-up A IT',
        subject: 'Buona notizia: la tua ripartenza Bullwaves sta funzionando.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-045980272c6641879dfd0d699fdca78f',
        versionId: '56e5d54a-a63b-4bcb-b2f5-dbbb969cce37',
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
        templateId: 'd-7a492ca5170f4b2d9cf90e67de64f9b9',
        versionId: '0f32afe0-97e5-4abc-9650-b48d62cb2bb1',
        name: 'Dormant Low - Recovery Follow-up A',
        subject: 'Your Bullwaves account can still restart from a lighter path.',
        timing: 'D21',
        delay: '+6 days after missed outcome',
      },
      b: {
        templateId: 'd-231405cf859d455198f99f49f7e19862',
        versionId: 'a0e783f1-bc2b-4ca5-9803-71b25b4c8917',
        name: 'Dormant Low - Recovery Follow-up B',
        subject: 'A softer Bullwaves re-entry path is ready for you.',
        timing: 'D21',
        delay: '+6 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-c5bab62bd656496cb604cc4d86a28064',
        versionId: '068d58e2-25e9-431f-b98c-afa4e962598d',
        name: 'Dormant Low - Recovery Follow-up A IT',
        subject: 'Il tuo account Bullwaves può ancora ripartire da un percorso più leggero.',
        timing: 'D21',
        delay: '+6 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-1bc10b76bf3a435faeb35e33c9580322',
        versionId: '77e6c5a6-96d3-4166-959d-fe51403c5a4d',
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
        templateId: 'd-a802ed2f030346b9a8a063abddd35512',
        versionId: 'e40e46e5-272d-42d0-917c-b8cf84e22c19',
        name: 'Dormant Low - Simple Restart Path A',
        subject: 'Your simple Bullwaves restart path is ready.',
        timing: 'D6',
        delay: '+6 days after step 1',
      },
      b: {
        templateId: 'd-71620c4d2d694023987205d3a13d7149',
        versionId: 'fd6c64a3-8b35-4d42-9fff-df03b0c28ca2',
        name: 'Dormant Low - Simple Restart Path B',
        subject: 'A lighter Bullwaves recovery plan is now available for your account.',
        timing: 'D6',
        delay: '+6 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-e83a99be634f421e84c7d7e08fcc8086',
        versionId: 'f4e75a7e-4e34-4455-b929-db939871ea11',
        name: 'Dormant Low - Simple Restart Path A IT',
        subject: 'Il tuo percorso semplice di ripartenza Bullwaves e pronto.',
        timing: 'D6',
        delay: '+6 giorni dopo step 1',
      },
      b: {
        templateId: 'd-bb296783bf95436f84b7040a57901785',
        versionId: '0fba3381-8f3e-46b1-9967-013e1d83001c',
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
        templateId: 'd-0966e03794184eb5b47e10d9fbded55c',
        versionId: '9324abfc-ef0d-4199-9626-612ba631e9e5',
        name: 'Dormant Low - Soft Re-entry Touch A',
        subject: 'A simple Bullwaves restart path is available whenever you are ready.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-e5ed1e0317164297a8f2f02fbb43371b',
        versionId: '988246d4-19a1-4757-af7c-e7ca57680afc',
        name: 'Dormant Low - Soft Re-entry Touch B',
        subject: 'Your Bullwaves account can restart from a lighter step.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-b7eb65abe6d1453f9b020640bef80e10',
        versionId: 'a8d93cc1-e7b9-4184-8577-8f488bc9392d',
        name: 'Dormant Low - Soft Re-entry Touch A IT',
        subject: 'E disponibile un percorso Bullwaves di ripartenza semplice quando vuoi.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-1a1187b4e0054dec9cacfb43ca7aa457',
        versionId: 'c9c824d6-ec45-42be-9006-2d0e932c0a4d',
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
        templateId: 'd-52c010ba7462401e887bfe7ab059e268',
        versionId: '2d28902f-a590-4d51-8814-fc287b8a3358',
        name: 'Dormant Mid - Manager Continuity Touch A',
        subject: 'Keep your Bullwaves recovery stable with one more step.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
      b: {
        templateId: 'd-f61b3db5fd8245e9aa40d1072da0d4f1',
        versionId: 'a53742a6-9fec-420d-a681-7bccbfb5e233',
        name: 'Dormant Mid - Manager Continuity Touch B',
        subject: 'Your Bullwaves return can still become a stable active path.',
        timing: 'D10',
        delay: '+6 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-95d3a3e89d2d43648264bf8892fd8edc',
        versionId: '0d09ea9b-8369-4746-920b-ec83a33bde0b',
        name: 'Dormant Mid - Manager Continuity Touch A IT',
        subject: 'Mantieni stabile il tuo recovery Bullwaves con un altro step.',
        timing: 'D10',
        delay: '+6 giorni dopo step 2',
      },
      b: {
        templateId: 'd-0f8e7f0781724efab6f67c0986661d0d',
        versionId: '7d423d40-f359-4d8d-abbd-d2f236003dea',
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
        templateId: 'd-9caf88d0edaa453483350093904a76c3',
        versionId: '616f5134-aeb9-4377-81f9-7ddb3931497e',
        name: 'Dormant Mid - Positive Follow-up A',
        subject: 'Your Bullwaves recovery is confirmed and back on track.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-a0ac78e6382b4a279bd10a69989b8b0c',
        versionId: 'd8b9d6ea-8550-4e6c-ac2d-3818378e9128',
        name: 'Dormant Mid - Positive Follow-up B',
        subject: 'Good result: your Bullwaves account is moving again.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-a6bf28ffb46342538da414adfff7e974',
        versionId: '8035de5b-e7dd-4bc6-90de-45adcff29f25',
        name: 'Dormant Mid - Positive Follow-up A IT',
        subject: 'Il tuo recovery Bullwaves e confermato ed e tornato in linea.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-2a25868af3cc404d8981598a996896b5',
        versionId: 'e14f67a4-d57b-43a5-9bc4-07d1f7767fb1',
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
        templateId: 'd-e71bf963b9d14007a5dbc0cc57a701b7',
        versionId: 'b8e93b68-d5a2-4060-a480-d84a956fa4a1',
        name: 'Dormant Mid - Recovery Follow-up A',
        subject: 'Your Bullwaves comeback is still possible from a cleaner path.',
        timing: 'D18',
        delay: '+8 days after missed outcome',
      },
      b: {
        templateId: 'd-2ae3ed94d5f0469686bea40fe357173f',
        versionId: '5d1e29da-4f95-4a1c-821b-61f98a422ca2',
        name: 'Dormant Mid - Recovery Follow-up B',
        subject: 'A lighter Bullwaves re-entry path is available for your account.',
        timing: 'D18',
        delay: '+8 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-fd4ae7954e334b89b1d58d80a0229080',
        versionId: 'd54633a1-4959-4714-ba37-2436fa17c014',
        name: 'Dormant Mid - Recovery Follow-up A IT',
        subject: 'Il tuo comeback Bullwaves e ancora possibile da un percorso più pulito.',
        timing: 'D18',
        delay: '+8 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-a7c5742e1243431a8bc3543bfa2544aa',
        versionId: 'fedf1b85-4ea1-42a4-9607-608183630432',
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
        templateId: 'd-4649ea5b76724be89c51e2caa5eba860',
        versionId: '5c2691b0-6de6-4090-9215-9951f99f26fd',
        name: 'Dormant Mid - Relaunch Value Path A',
        subject: 'Your Bullwaves relaunch path is ready for review.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
      b: {
        templateId: 'd-729444d5681b4c7ca0da2f3ae745c260',
        versionId: 'aea67244-e854-448e-b7a8-3249dc8653de',
        name: 'Dormant Mid - Relaunch Value Path B',
        subject: 'A clearer Bullwaves recovery plan is now active for your account.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-2d06fa2848784fe7a307838f8e8b5d10',
        versionId: 'a9d160e0-124b-4011-a7cf-3969d2439ce5',
        name: 'Dormant Mid - Relaunch Value Path A IT',
        subject: 'Il tuo percorso Bullwaves di rilancio e pronto da rivedere.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
      b: {
        templateId: 'd-c9d0406f1a8a48e797e89c67bdc40599',
        versionId: '8172f75e-0498-46f4-8e41-49faa87b9e8e',
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
        templateId: 'd-3a12027294fb4959874349a0acfb3a3b',
        versionId: 'e2ac54a7-eeed-4ae9-8848-0f81f52dbeba',
        name: 'Dormant Mid - Winback Touch A',
        subject: 'A stronger Bullwaves return path is available for your account.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-20492ed200fc409b9a53b99121df6a82',
        versionId: 'ed3bdcd9-be97-4130-9325-daef02919695',
        name: 'Dormant Mid - Winback Touch B',
        subject: 'Your Bullwaves profile is ready for a more structured comeback.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-f1378bbc467547afa59e019984ca57fe',
        versionId: 'dd935648-fd45-4bd6-8964-ea017cbd98fc',
        name: 'Dormant Mid - Winback Touch A IT',
        subject: 'Per il tuo account e disponibile un percorso Bullwaves di ritorno più forte.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-98ba8399e8364060bd5f2e9e10df10e2',
        versionId: '607b64aa-1427-4658-b430-b6e699ba66dc',
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
        templateId: 'd-4bfdcc74977e48dda321a9f03377ae03',
        versionId: '5a0242a4-ec71-409c-aded-a7239076e6cf',
        name: 'Dormant Value - Continuity Reinforcement A',
        subject: 'Keep your reactivation stable with one final Bullwaves step.',
        timing: 'D9',
        delay: '+6 days after step 2',
      },
      b: {
        templateId: 'd-4ba41c198e224233b1877413b8fc75e8',
        versionId: '7ae123a4-3eec-498b-b6b0-f0a5b3d795c2',
        name: 'Dormant Value - Continuity Reinforcement B',
        subject: 'Your Bullwaves return is improving. Now keep it consistent.',
        timing: 'D9',
        delay: '+6 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-a6e5c59de45e4860bf1eaa6e14250490',
        versionId: '8018c681-2575-484c-bb34-b789a6a10a2b',
        name: 'Dormant Value - Continuity Reinforcement A IT',
        subject: 'Mantieni stabile la tua riattivazione con un ultimo step Bullwaves.',
        timing: 'D9',
        delay: '+6 giorni dopo step 2',
      },
      b: {
        templateId: 'd-39146b7d908c4f148b941a0f4c19c21c',
        versionId: 'fbbe64d7-90cf-434d-b420-ff8784d1b810',
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
        templateId: 'd-a05833876db04192bb061086f4403239',
        versionId: 'a527f4fa-4e9b-4e8b-9e1c-389041a9df83',
        name: 'Dormant Value - Guided Return Plan A',
        subject: 'Your guided return plan is ready inside Bullwaves.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
      b: {
        templateId: 'd-9d9bc8c9b26c4d9b9c422a0a180d91d6',
        versionId: '7be73c50-1dfa-4485-8f85-6b56647823c7',
        name: 'Dormant Value - Guided Return Plan B',
        subject: 'Your Bullwaves return path is still open and easier to follow now.',
        timing: 'D3',
        delay: '+3 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-060170e76274424db50f14f2edfdbf22',
        versionId: 'b6ee6a92-b5ff-40ec-8962-5c9b830d2136',
        name: 'Dormant Value - Guided Return Plan A IT',
        subject: 'Il tuo piano guidato di ritorno è pronto dentro Bullwaves.',
        timing: 'D3',
        delay: '+3 giorni dopo step 1',
      },
      b: {
        templateId: 'd-dfe973a3ddd449fdb45f600ffa8857f0',
        versionId: 'db980ca9-a226-4136-9efc-315a12b62c79',
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
        templateId: 'd-a1cf536f689c415c91e3ae6f334e1fd6',
        versionId: 'e97be384-c78f-4b07-ba5a-8f185e2f8310',
        name: 'Dormant Value - Positive Follow-up A',
        subject: 'Good news: your Bullwaves account is back on track.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-42040cb2dbae43d794bf8fb24b034d8d',
        versionId: '39dff04b-3a83-4420-9713-0cad7e185efb',
        name: 'Dormant Value - Positive Follow-up B',
        subject: 'Your reactivation is confirmed. Keep your account moving.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-7428a2e1452d495ab6b0392a3bd19ac7',
        versionId: '354e153a-fdf2-4f54-92c4-6a66d42d3882',
        name: 'Dormant Value - Positive Follow-up A IT',
        subject: 'Buona notizia: il tuo account Bullwaves è tornato in linea.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-c8cb4d45a2bc433eb300d21b91a9ab2a',
        versionId: 'e23d06db-5e00-4dcb-8dd0-91fbc35c4c83',
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
        templateId: 'd-114bb95131e74a35bda5a41a34012fd1',
        versionId: 'a2b0d7fc-4c62-4cab-9ba7-aa17fca11abe',
        name: 'Dormant Value - Reactivation Touch A',
        subject: 'Your Bullwaves account still has value ready to reactivate.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-07bf302efae741bba1c96df2fa724866',
        versionId: '250c9a21-8ee2-4612-beac-e497a29e9633',
        name: 'Dormant Value - Reactivation Touch B',
        subject: 'A clearer way to restart your Bullwaves activity is available.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-95da0eacc6154e218697d8690518b76e',
        versionId: '8d469898-33df-46b3-a237-97644efa02ef',
        name: 'Dormant Value - Reactivation Touch A IT',
        subject: 'Il tuo account Bullwaves ha ancora valore da riattivare.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-0d7f6fd74e6143288544031018284ecc',
        versionId: '45869a3c-6f2b-4d12-828e-8799965d0bce',
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
        templateId: 'd-f47daf96bd6e4f4fbb64d34510429be9',
        versionId: '6cfbb173-1775-4890-ba80-7f19f7531956',
        name: 'Dormant Value - Recovery Follow-up A',
        subject: 'Your Bullwaves return path is still open.',
        timing: 'D18',
        delay: '+9 days after missed outcome',
      },
      b: {
        templateId: 'd-9c8bcaea9c2e479198c9971f4a910c2a',
        versionId: '7b9399c4-2f3d-4af9-bd63-b1be5aaa23ca',
        name: 'Dormant Value - Recovery Follow-up B',
        subject: 'A simpler Bullwaves restart option is available for your account.',
        timing: 'D18',
        delay: '+9 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-ac5569ac633e44c6b67261b440adec87',
        versionId: 'e1c1581a-2969-4d45-91f7-af00072f1edd',
        name: 'Dormant Value - Recovery Follow-up A IT',
        subject: 'Il tuo percorso di ritorno Bullwaves e ancora aperto.',
        timing: 'D18',
        delay: '+9 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-495d8ed8ca6b458e80753fb00cad6a39',
        versionId: 'fda440cc-6574-49b6-9c51-383173b28b4a',
        name: 'Dormant Value - Recovery Follow-up B IT',
        subject:
          'Per il tuo account e disponibile una opzione Bullwaves di ripartenza più semplice.',
        timing: 'D18',
        delay: '+9 giorni dopo esito non centrato',
      },
    },
  },
  most_consistent_badge_award_email: {
    en: {
      a: {
        templateId: 'd-31642f9a4e79418a8b485a9a53f37622',
        versionId: 'a685f89f-7bf1-4570-b852-3ee1c80b5ce3',
        name: 'Most Consistent - Badge Award A',
        subject: 'You earned your Bullwaves consistency badge.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-8d6e8e0b3f434106a774d66fceb292df',
        versionId: 'a27c7985-b374-447f-8fb4-8f6eb7373c1e',
        name: 'Most Consistent - Badge Award B',
        subject: 'Your consistency is now a growth asset on Bullwaves.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-2f823bcbf61f48c79db0ef3f4c3af94f',
        versionId: '0aa5cfb3-eb8d-4180-97e9-70ab34964f8c',
        name: 'Most Consistent - Badge Award A IT',
        subject: 'Hai ottenuto il tuo badge Bullwaves di consistenza.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-21af5f4b88d34859ad0536a4dafc2852',
        versionId: 'c56db601-e4d4-4530-9ccd-47e9af90509d',
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
        templateId: 'd-d8d39c76dbe54711952e24fcc53d3a6c',
        versionId: '87e07cb2-3d52-476f-afcd-7d59102348ac',
        name: 'Most Consistent - Cycle Restart A',
        subject: 'Restart your Bullwaves cycle with a cleaner challenge path.',
        timing: 'D30',
        delay: '+30 days after last low-engagement cycle',
      },
      b: {
        templateId: 'd-0e32d4c45f384bd4a926a5939df0015c',
        versionId: '75ebb36a-4153-4cba-94e2-99efb434a833',
        name: 'Most Consistent - Cycle Restart B',
        subject: 'A cleaner Bullwaves restart is still available to you.',
        timing: 'D30',
        delay: '+30 days after last low-engagement cycle',
      },
    },
    it: {
      a: {
        templateId: 'd-4d6d048959974f4fb6c2ff8121f8d216',
        versionId: '3be17999-a17d-4f6d-b04a-35ff8d2bcf0b',
        name: 'Most Consistent - Cycle Restart A IT',
        subject: 'Riavvia il tuo ciclo Bullwaves con un percorso challenge più chiaro.',
        timing: 'D30',
        delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
      },
      b: {
        templateId: 'd-fdf04137cd3644fc8acc9bd1e6fd993b',
        versionId: 'def6ad4c-858d-40df-bfbc-bccb347dab76',
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
        templateId: 'd-e3c7e6faa68a4d37b34fc804a74b7950',
        versionId: '56170400-61e0-4eb2-9053-ac19a215bbdb',
        name: 'Most Consistent - Growth Roadmap A',
        subject: 'Your Bullwaves roadmap is ready. Let consistency become growth.',
        timing: 'D7',
        delay: '+7 days after badge award',
      },
      b: {
        templateId: 'd-f803cc4f9a614b39a22015c7ccf451a2',
        versionId: 'cff42208-f92e-4167-b6c7-ab175d3153a9',
        name: 'Most Consistent - Growth Roadmap B',
        subject: 'A steadier trader should never feel directionless.',
        timing: 'D7',
        delay: '+7 days after badge award',
      },
    },
    it: {
      a: {
        templateId: 'd-7e47782868a04b89b3b5a16b8c7e1d87',
        versionId: 'd02c72e1-ff13-4518-9fe0-a2a2bf6aab2b',
        name: 'Most Consistent - Growth Roadmap A IT',
        subject: 'Il tuo piano di crescita Bullwaves è pronto. Trasforma la costanza in crescita.',
        timing: 'D7',
        delay: '+7 giorni dopo il badge',
      },
      b: {
        templateId: 'd-eec3580790fe44df947628c9111c13fb',
        versionId: '2a224bca-f8b8-46cd-befd-5f0467aab0c6',
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
        templateId: 'd-7f3727ece96046629caa4bc2fb43ddce',
        versionId: 'd0e4f30e-ee82-46d2-ae1c-a78ea6fff5c1',
        name: 'Most Consistent - Loyalty Reward A',
        subject: 'Your consistency is unlocking a Bullwaves loyalty reward.',
        timing: 'D21',
        delay: '+14 days after growth roadmap',
      },
      b: {
        templateId: 'd-5b37b38c4b814231834658060ba062bb',
        versionId: '3fe59f2b-ae9c-4ff7-aa21-90b93b07471d',
        name: 'Most Consistent - Loyalty Reward B',
        subject: 'Stable effort deserves a stronger Bullwaves reward signal.',
        timing: 'D21',
        delay: '+14 days after growth roadmap',
      },
    },
    it: {
      a: {
        templateId: 'd-bd8b42b3070648bb9d343d63c1423151',
        versionId: '835c668d-09f3-400d-96de-b7b61b3dabe8',
        name: 'Most Consistent - Loyalty Reward A IT',
        subject: 'La tua costanza sta sbloccando un premio fedeltà Bullwaves.',
        timing: 'D21',
        delay: '+14 giorni dopo la roadmap',
      },
      b: {
        templateId: 'd-150de87c87274b0c8679f68e18ab76b6',
        versionId: '84ebd387-6c61-486e-bb3c-5092b9adfff9',
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
        templateId: 'd-b5ab537b3fb548cfb956bd2d816a08ba',
        versionId: '80cbb0e0-e1cf-4820-ba24-c6bdd1b1112c',
        name: 'Most Consistent - Top Performers Onboarding A',
        subject: 'You are ready for the Bullwaves Top Performers path.',
        timing: 'PROMO +0d',
        delay: 'Immediately after promotion to Top Performers',
      },
      b: {
        templateId: 'd-b948c7539266423f9f76f06624e1b100',
        versionId: '1f32fa72-7af1-4490-afe7-a6d47a9fcd49',
        name: 'Most Consistent - Top Performers Onboarding B',
        subject: 'Your Bullwaves profile is moving into a stronger segment.',
        timing: 'PROMO +0d',
        delay: 'Immediately after promotion to Top Performers',
      },
    },
    it: {
      a: {
        templateId: 'd-e7b555b8e1c64d39855244af288f8ec0',
        versionId: 'aea27c33-46bb-49a6-b146-6cb4e211c92b',
        name: 'Most Consistent - Top Performers Onboarding A IT',
        subject: 'Sei pronto per il percorso Bullwaves Top Performers.',
        timing: 'PROMO +0d',
        delay: 'Immediatamente dopo la promozione a Top Performers',
      },
      b: {
        templateId: 'd-aa8a53658af448d89007f1daf5c8bdf3',
        versionId: '4289a624-0104-4a8c-bd09-183c5b0a167d',
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
        templateId: 'd-fd61306da7ba4906950213db44004d4f',
        versionId: 'e2fea8f2-f784-4ff9-b2d4-bf1e8dca9c10',
        name: 'Reward Candidates - Retained Follow-up A',
        subject: 'Great news: your account review is confirmed and your premium setup continues.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive checkpoint',
      },
      b: {
        templateId: 'd-1df07c6f8fe0432998389e1985100e8d',
        versionId: 'c62a5bb0-a41a-4b2b-a7b5-c9af8675a7a1',
        name: 'Reward Candidates - Retained Follow-up B',
        subject: 'Review completed successfully. Keep your momentum active.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive checkpoint',
      },
    },
    it: {
      a: {
        templateId: 'd-168fa7937d5549858c1c81a49f5b62e0',
        versionId: '9cbb7503-a42c-4fd9-9377-a1b8acf2a3ba',
        name: 'Reward Candidates - Retained Follow-up A IT',
        subject: 'Ottima notizia: la tua review account è confermata e il setup premium continua.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo checkpoint positivo',
      },
      b: {
        templateId: 'd-52f5701c27bb4b39ba4ce895807d50fb',
        versionId: 'ee81014e-48f4-47d9-9f77-925b652e011c',
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
        templateId: 'd-a373f874d0614e2081ca6a6815e14715',
        versionId: '61e3ac24-8781-404b-b2e8-bd674c8c816e',
        name: 'Reward Candidates - Retention Commitment A',
        subject: 'Before your next account review, there is one final step to complete.',
        timing: 'D14',
        delay: '+9 days after step 2',
      },
      b: {
        templateId: 'd-0b09bfbf33f143328f14d508a907e9ce',
        versionId: '549a5d85-c7a4-435e-8ad2-aa4b817678f5',
        name: 'Reward Candidates - Retention Commitment B',
        subject: 'Your account review is approaching. Confirm the final setup now.',
        timing: 'D14',
        delay: '+9 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-5649db208346431e8111bc82a2b5547f',
        versionId: 'b2ea6e1f-6e40-4572-ba48-e4a0f72a27b8',
        name: 'Reward Candidates - Retention Commitment A IT',
        subject: 'Prima della prossima review account c è un ultimo passaggio da completare.',
        timing: 'D14',
        delay: '+9 giorni dopo step 2',
      },
      b: {
        templateId: 'd-3d6e689f7dca4956b0c7e7ebc7cda2a9',
        versionId: '8ff975dd-8a27-4da7-ac06-68f1b10278bf',
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
        templateId: 'd-874b98df443c4ed68543448afa8d2294',
        versionId: 'f383505b-046a-4bdd-96a3-7b593a70ffbb',
        name: 'Reward Candidates - Return Follow-up A',
        subject: 'Your account can restart from a simpler and clearer path.',
        timing: 'D21',
        delay: '+7 days after missed checkpoint outcome',
      },
      b: {
        templateId: 'd-50846d5eeb5442eda5ac440e64be4e7f',
        versionId: '45ccba3e-3e9d-419d-b0ef-2ca20e19a8d1',
        name: 'Reward Candidates - Return Follow-up B',
        subject: 'A lighter restart option is now active in your Bullwaves account.',
        timing: 'D21',
        delay: '+7 days after missed checkpoint outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-9e304695255148c2b4fe4d09053805e3',
        versionId: 'd5515723-37d4-4d55-a7eb-54609464c4c0',
        name: 'Reward Candidates - Return Follow-up A IT',
        subject: 'Il tuo account può ripartire da un percorso più chiaro e più semplice.',
        timing: 'D21',
        delay: '+7 giorni dopo esito checkpoint non centrato',
      },
      b: {
        templateId: 'd-fc6f7e5db01c4d1ba681b7d61aae3f6b',
        versionId: 'b661a61b-8ce6-4a28-8960-6e442b13cb0f',
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
        templateId: 'd-3ff9f66cc54d45e5b5713fbc2fc94054',
        versionId: 'a36ef77d-b506-4513-90dd-d4a33fc61b5d',
        name: 'Reward Candidates - Reward Ladder A',
        subject: 'Your next Bullwaves steps are ready in your account.',
        timing: 'D5',
        delay: '+5 days after step 1',
      },
      b: {
        templateId: 'd-0bcc930448774d0ba3d2a197f65f1805',
        versionId: '914e1276-039e-4973-b2b3-b24d1f867480',
        name: 'Reward Candidates - Reward Ladder B',
        subject: 'A clearer progression plan is now active in your Bullwaves account.',
        timing: 'D5',
        delay: '+5 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-d29c2e66dfdd4724a23ad892810ad830',
        versionId: 'a6e2cb99-3327-40b7-af26-a15d2eaa628a',
        name: 'Reward Candidates - Reward Ladder A IT',
        subject: 'I tuoi prossimi passi Bullwaves sono pronti nel tuo account.',
        timing: 'D5',
        delay: '+5 giorni dopo step 1',
      },
      b: {
        templateId: 'd-06ac8fd657dc4662bbe31bfc9f688e27',
        versionId: '456371a4-e07b-4824-b45d-35ad7631769a',
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
        templateId: 'd-d6e2befa541f41b996dabdb6eb6a9d2d',
        versionId: 'c285bb36-136c-4291-bee1-6afcf7ad648e',
        name: 'Reward Candidates - Segnale Reward VIP A IT',
        subject: 'Il tuo profilo Bullwaves ha sbloccato vantaggi premium.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-a1d4275847604053aac705b39a62a109',
        versionId: 'b581186f-46e6-4e2c-8718-6988c78d2a83',
        name: 'Reward Candidates - Segnale Reward VIP B IT',
        subject: 'Per il tuo profilo è attiva un esperienza Bullwaves più su misura.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
    en: {
      a: {
        templateId: 'd-80a0729e322c462f9557c9f82211aa7b',
        versionId: '1752bbaa-9b2b-419a-b1e0-2393a6372f99',
        name: 'Reward Candidates - VIP Reward Signal A',
        subject: 'Your Bullwaves profile unlocked premium benefits.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-5e1a3b226fd649169df46c147ee8c605',
        versionId: 'b89f8e27-e781-4968-a681-6766b365e7de',
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
        templateId: 'd-dd475780cf7f466191b090ad1df84d8e',
        versionId: 'cf2aa8b6-d899-4fa0-a1b6-6e9da0598780',
        name: 'Rising - Milestone Sprint Plan A',
        subject: 'Your next milestones are ready. Keep your growth structured.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
      b: {
        templateId: 'd-044ea35f4c604177bd01cda4fe4822f6',
        versionId: '763d4dc3-5855-4e07-b949-eb140360356e',
        name: 'Rising - Milestone Sprint Plan B',
        subject: 'A clearer account plan is now active for your next phase.',
        timing: 'D4',
        delay: '+4 days after step 1',
      },
    },
    it: {
      a: {
        templateId: 'd-ca88b6186f4c4732a619263776fa7ed8',
        versionId: '28465b6b-da23-4a95-ab48-36682688dfff',
        name: 'Rising - Milestone Sprint Plan A IT',
        subject: 'I tuoi prossimi traguardi sono pronti. Mantieni la crescita strutturata.',
        timing: 'D4',
        delay: '+4 giorni dopo step 1',
      },
      b: {
        templateId: 'd-dafde70772044ac68717f5ac25e3011d',
        versionId: '613d3c06-fc9b-406a-b1ad-145745a78f79',
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
        templateId: 'd-43184addcc5c4f03abaaf559efab1eab',
        versionId: '46d0df4a-0aa0-435d-8113-6f8bcb1358ce',
        name: 'Rising - Momentum Accelerator A',
        subject: 'Your Bullwaves activity is growing. Keep this momentum active.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-1a7107d4ef0541bf9968b7ddfef301b0',
        versionId: '9ef746a9-b6cc-49b3-8e2c-d70b429c16c3',
        name: 'Rising - Momentum Accelerator B',
        subject: 'You are gaining pace on Bullwaves. Keep your next steps clear.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-ff0c192cf6fc4a4e85b9dd98a3aad391',
        versionId: 'e8614f99-323e-44e1-8b39-2e65bad93bf9',
        name: 'Rising - Momentum Accelerator A IT',
        subject: 'La tua attività Bullwaves sta crescendo. Mantieni attivo questo slancio.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-933b74cd958643a28b1b03abbe28f009',
        versionId: '8bca8ba4-00bb-4100-8145-e3b7d49e9923',
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
        templateId: 'd-cf92bc9897154f20b6587b2cb223722e',
        versionId: '995f683d-5616-41ec-b1b9-4fff95c1e172',
        name: 'Rising - Positive Follow-up A',
        subject: 'Great result: your progress is confirmed. Keep moving forward.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
      b: {
        templateId: 'd-97a8c0ed219740649d530dd94826dc29',
        versionId: 'b4eff611-f9a3-40eb-adf0-716bb60d124e',
        name: 'Rising - Positive Follow-up B',
        subject: 'Your account is on track. Keep this pace in the next phase.',
        timing: 'CHECKPOINT +0d',
        delay: 'Immediate follow-up after positive outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-eca48b828eab44449bd2de7d8f5c191c',
        versionId: '7a6d596e-bf58-4d4b-90c0-8c2bc83df7e1',
        name: 'Rising - Positive Follow-up A IT',
        subject: 'Ottimo risultato: la tua progressione e confermata. Continua così.',
        timing: 'CHECKPOINT +0d',
        delay: 'Follow-up immediato dopo esito positivo',
      },
      b: {
        templateId: 'd-25af551d91bc40c5a5cc563893e9b260',
        versionId: '25796212-aed7-4201-b90b-26cff19077c9',
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
        templateId: 'd-85dc1ad9e8cc4e968c07d3b839eb45b0',
        versionId: '296d9c5b-628e-49da-9249-997a81e71cf5',
        name: 'Rising - Return Follow-up A',
        subject: 'Your momentum can restart from a simpler Bullwaves path.',
        timing: 'D21',
        delay: '+9 days after missed outcome',
      },
      b: {
        templateId: 'd-35340c8c5de34c008cca2f579d93bf25',
        versionId: 'ce66fa63-f38d-4704-87c1-d62aba9260f3',
        name: 'Rising - Return Follow-up B',
        subject: 'A lighter path is active to help you resume your Bullwaves activity.',
        timing: 'D21',
        delay: '+9 days after missed outcome',
      },
    },
    it: {
      a: {
        templateId: 'd-1b88a63440384969b1269d7badb21f89',
        versionId: '730e17e9-6149-49b0-8d11-b9efddedb6ff',
        name: 'Rising - Return Follow-up A IT',
        subject: 'Il tuo slancio può ripartire da un percorso Bullwaves più semplice.',
        timing: 'D21',
        delay: '+9 giorni dopo esito non centrato',
      },
      b: {
        templateId: 'd-189b7373d10742eeb0907c2dd4f2ed8e',
        versionId: 'b840d8db-25ec-4e8a-8aff-b63d93e3b85d',
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
        templateId: 'd-19ee9f3cb0384615aa76931622356328',
        versionId: '87f8597b-ebda-4755-9a3a-77c8448008f0',
        name: 'Rising - Tier-up Preparation A',
        subject: 'Your profile is close to an account upgrade. Complete this final preparation.',
        timing: 'D12',
        delay: '+8 days after step 2',
      },
      b: {
        templateId: 'd-c3c12d37f03e49988da12a480aff121e',
        versionId: '0c51d23f-f3b0-4349-b05d-0fd830996d8c',
        name: 'Rising - Tier-up Preparation B',
        subject: 'Before your next account review, confirm your final setup.',
        timing: 'D12',
        delay: '+8 days after step 2',
      },
    },
    it: {
      a: {
        templateId: 'd-8d578b682a9e4e269264a509a2391154',
        versionId: '23426561-4ca0-4684-9758-32f0cbfefa2e',
        name: 'Rising - Tier-up Preparation A IT',
        subject:
          'Il tuo profilo è vicino a un upgrade account. Completa questa preparazione finale.',
        timing: 'D12',
        delay: '+8 giorni dopo step 2',
      },
      b: {
        templateId: 'd-53b7d35f4f484cd6931ec7e168231549',
        versionId: '9792e531-fc05-4fbc-9c2a-3dc8ae13865d',
        name: 'Rising - Tier-up Preparation B IT',
        subject: 'Prima della prossima review account, conferma il setup finale.',
        timing: 'D12',
        delay: '+8 giorni dopo step 2',
      },
    },
  },
  top_performing_advanced_tools_email: {
    en: {
      a: {
        templateId: 'd-fd315c32b0c3473f871c502aed0ae704',
        versionId: '09beae2a-0788-4e78-b1a4-eecc0a590a87',
        name: 'Top Performing - Advanced Tools A',
        subject: 'A stronger trader should have a sharper support stack.',
        timing: 'D3',
        delay: '+3 days after VIP recognition',
      },
      b: {
        templateId: 'd-ff0ba92ab7c84d099ca890eb106bf6f9',
        versionId: 'efac0a60-ba7a-4d2f-8f36-85de855234b8',
        name: 'Top Performing - Advanced Tools B',
        subject: 'Protecting edge often starts with a better operating environment.',
        timing: 'D3',
        delay: '+3 days after VIP recognition',
      },
    },
    it: {
      a: {
        templateId: 'd-80fc5e3936de468f8434803d0405064d',
        versionId: '0aa22212-af3c-4395-9f08-039a039ac983',
        name: 'Top Performing - Advanced Tools A IT',
        subject: 'Un trader più forte dovrebbe avere un supporto più preciso.',
        timing: 'D3',
        delay: '+3 giorni dopo il touch VIP',
      },
      b: {
        templateId: 'd-7d6f773744f949a2a2c05abb0b6c64e6',
        versionId: '4c2e636e-3b07-4b46-9d93-ef6f8ebd8161',
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
        templateId: 'd-643b3ce425064a4ab7e2c74f2e20c685',
        versionId: 'e41afa3d-dd9d-430d-a3be-f30eb413af3f',
        name: 'Top Performing - Loyalty Upgrade A',
        subject: 'Your consistency is opening premium loyalty treatment.',
        timing: 'D10',
        delay: '+7 days after advanced tools offer',
      },
      b: {
        templateId: 'd-dae73318a0d24bc190fa649ec89d4939',
        versionId: '8dfaf5ed-1108-4fac-82e3-dce7f05d0bfd',
        name: 'Top Performing - Loyalty Upgrade B',
        subject: 'A stronger loyalty tier is ready for your Bullwaves profile.',
        timing: 'D10',
        delay: '+7 days after advanced tools offer',
      },
    },
    it: {
      a: {
        templateId: 'd-c1b95ab7257c4fc28269fffee2655995',
        versionId: 'b6b8aef1-62ef-4a3b-91fe-405249e2b0de',
        name: 'Top Performing - Loyalty Upgrade A IT',
        subject: 'La tua continuità sta aprendo un percorso loyalty premium.',
        timing: 'D10',
        delay: "+7 giorni dopo l'offerta strumenti avanzati",
      },
      b: {
        templateId: 'd-ca5d71a32d57464bbd89dc167d60f2d8',
        versionId: '28508bba-89a4-42d7-9c81-1bc244b14811',
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
        templateId: 'd-e9f088fc7afb4674a9208f6d2c55f2bb',
        versionId: '139c5f5c-6665-4ece-af63-409b72b4b4fd',
        name: 'Top Performing - Premium Nurture A',
        subject: 'Keep your Bullwaves premium momentum alive.',
        timing: 'D30',
        delay: '+30 days after last premium touch',
      },
      b: {
        templateId: 'd-ad718748095f41ef9105242132d1f9a0',
        versionId: '3ac1cac2-b00a-4344-8989-d561501330c8',
        name: 'Top Performing - Premium Nurture B',
        subject: 'A premium relationship stays strong through intelligent continuity.',
        timing: 'D30',
        delay: '+30 days after last premium touch',
      },
    },
    it: {
      a: {
        templateId: 'd-e6b25ed95940492fbfa993a3c0a90423',
        versionId: 'c8b4da45-23ea-4c59-a938-2ba17d52c75d',
        name: 'Top Performing - Premium Nurture A IT',
        subject: 'Mantieni vivo il tuo slancio premium su Bullwaves.',
        timing: 'D30',
        delay: "+30 giorni dopo l'ultimo touch premium",
      },
      b: {
        templateId: 'd-b3c2ee22965c43ac92f6c92d80b45bdf',
        versionId: '7097607f-3a8c-4ca0-92c8-750a6ca51d66',
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
        templateId: 'd-972402e449914928b86750bd6527c12d',
        versionId: 'fa891cc3-a7e9-423e-84d4-9d0298569252',
        name: 'Top Performing - VIP Recognition A',
        subject: 'You are among Bullwaves top performers. We built your next step accordingly.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-cf74cddc846c4e5ba909aca69102fa5b',
        versionId: '7ff45206-c84d-4ef2-a47f-b015c0942a03',
        name: 'Top Performing - VIP Recognition B',
        subject: 'Your trading profile unlocked a more tailored Bullwaves path.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
    },
    it: {
      a: {
        templateId: 'd-0a7145f002b44f97aebbeec84b918bf1',
        versionId: 'a08f0ca8-802e-48a2-98fe-c66bc80eec26',
        name: 'Top Performing - VIP Recognition A IT',
        subject: 'Sei tra i top performer Bullwaves. Il prossimo passo è costruito di conseguenza.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-644aaf5d6af64564993d198279aba9dd',
        versionId: '26484d89-5a76-4d87-8fd7-8ebe872b720d',
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
        templateId: 'd-2343c2b7227143c98239ce0893015e9c',
        versionId: 'afe6bede-8deb-4e80-9831-fc19d61dab55',
        name: 'Top Performing - VIP Review A',
        subject: 'Your quarterly Bullwaves VIP review is ready.',
        timing: 'Q+0d',
        delay: 'At the start of the quarterly review cycle',
      },
      b: {
        templateId: 'd-7cb0344af4a044f5965e4aba6d99c5b4',
        versionId: 'c25bbf54-b1f4-4f02-8e77-6ec00b5fb2d8',
        name: 'Top Performing - VIP Review B',
        subject: 'A stronger next quarter starts with a sharper review now.',
        timing: 'Q+0d',
        delay: 'At the start of the quarterly review cycle',
      },
    },
    it: {
      a: {
        templateId: 'd-6e515e09b751404a95792537cd5deb56',
        versionId: 'c4e2f5af-9fa6-4f30-860c-f2425f847357',
        name: 'Top Performing - VIP Review A IT',
        subject: 'La tua review VIP trimestrale Bullwaves è pronta.',
        timing: 'Q+0d',
        delay: 'All inizio del ciclo review trimestrale',
      },
      b: {
        templateId: 'd-7e10afc6245d4089b124e0662ec996e7',
        versionId: 'e24ead62-951d-4d17-86c6-d8b19955e5cc',
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
        templateId: 'd-d9799893ebef49fc9a04e6c51936a68e',
        versionId: '33bae03a-d1ad-4fab-8113-97d0cb94a7db',
        name: 'Unfunded Newcomers - +48h Deposito + Trade A',
        subject: 'Il tuo account è attivo. Il tuo account manager dedicato è ora disponibile.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
      b: {
        templateId: 'd-f34c1fe855694bf18a2ce16809c7ae8c',
        versionId: '8b64e988-3d02-4077-9de7-4b1489a8e52a',
        name: 'Unfunded Newcomers - +48h Deposito + Trade B',
        subject: 'La tua prima operatività è avviata. Ora hai una guida dedicata.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
    },
    en: {
      a: {
        templateId: 'd-b973f2a405424420a5ab3d8da289b499',
        versionId: '2798fec1-4b60-4926-a288-d3b59430c2ab',
        name: 'Unfunded Newcomers - +48hr Deposit + Trade A',
        subject: 'Your account is active. Your dedicated account manager is now available.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
      b: {
        templateId: 'd-044bcad122d84f1787438495aa1a3e57',
        versionId: '6528dfe5-574e-4414-aa5a-9e61e9d4dee0',
        name: 'Unfunded Newcomers - +48hr Deposit + Trade B',
        subject: 'Your first activity is in place. Dedicated guidance is now available.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
    },
  },
  unfunded_newcomers_account_activation_reminder_email: {
    it: {
      a: {
        templateId: 'd-9e2bf1c75add478f93ddb6b248472882',
        versionId: 'ed5486ef-315b-494e-82a4-0e6c23db1c45',
        name: 'Unfunded Newcomers - +48h Nessun Deposito A',
        subject: 'Il deposito non è ancora stato completato. Il prossimo passo è ancora aperto.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
      b: {
        templateId: 'd-c546f893dba145568a8d793a8a925263',
        versionId: '3925fe30-fd44-4bdf-b0c4-3d839369332c',
        name: 'Unfunded Newcomers - +48h Nessun Deposito B',
        subject: 'Il tuo account è pronto. Il passaggio di deposito è ancora da completare.',
        timing: '+48h',
        delay: '+48 ore dopo il welcome message',
      },
    },
    en: {
      a: {
        templateId: 'd-3ed7a5ef517f4297b9fe81e8292cb9a6',
        versionId: '86ee0f3b-2479-4c06-87f2-2234f9ad5101',
        name: 'Unfunded Newcomers - +48hr No Deposit A',
        subject: 'No deposit has been completed yet. Your next step is still open.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
      b: {
        templateId: 'd-143b22351278478a82eb973f6350a254',
        versionId: 'e7bf3260-43b5-4ab0-94b6-cf3c9e2385cc',
        name: 'Unfunded Newcomers - +48hr No Deposit B',
        subject: 'Your account is ready. The deposit step is still pending.',
        timing: '+48hr',
        delay: '+48 hours after welcome message',
      },
    },
  },
  unfunded_newcomers_deposit_intent_recovery_email: {
    en: {
      a: {
        templateId: 'd-c2d2a0dd07b74e5bb0a558b46b96b89d',
        versionId: '3000e43d-5683-4944-a0f4-4a621a05c96b',
        name: 'Unfunded Newcomers - Deposit Intent Recovery A',
        subject: 'Your account is ready to continue. The deposit path is still open.',
        timing: '+3d',
        delay: '+3 days after the no-deposit follow-up',
      },
      b: {
        templateId: 'd-706dade977124b1195c3fb8be35ce037',
        versionId: 'd575f14a-a7c2-4f40-bc76-b855b3a8c095',
        name: 'Unfunded Newcomers - Deposit Intent Recovery B',
        subject: 'Your return is a good sign. The deposit path is still available.',
        timing: '+3d',
        delay: '+3 days after the no-deposit follow-up',
      },
    },
    it: {
      a: {
        templateId: 'd-130098ffa8d84e60be45b21116e9c8ad',
        versionId: '7a42467a-7c6d-4ce3-8bf5-cbe9396d2203',
        name: 'Unfunded Newcomers - Recupero Intento Deposito A',
        subject: 'Il tuo account è pronto per continuare. Il percorso di deposito è ancora aperto.',
        timing: '+3g',
        delay: '+3 giorni dopo il touch no-deposito',
      },
      b: {
        templateId: 'd-17eb6df60f89453caec0df23b260c2bf',
        versionId: '7a3ec722-b63d-4ff9-bc6e-6af64502092b',
        name: 'Unfunded Newcomers - Recupero Intento Deposito B',
        subject:
          'Il tuo rientro è un segnale positivo. Il percorso di deposito è ancora disponibile.',
        timing: '+3g',
        delay: '+3 giorni dopo il touch no-deposito',
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
          'Your first deposit is complete. Your Bullwaves account is ready for the next step.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediately after successful deposit confirmation',
      },
      b: {
        templateId: 'd-7b47f5e61780443799ee40a531568b38',
        versionId: 'ece7d409-5b24-42b4-a2b5-5d003de3a822',
        name: 'Unfunded Newcomers - First Deposit Push B',
        subject: 'Your account is funded. Now continue with the next active step.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediately after successful deposit confirmation',
      },
    },
    it: {
      a: {
        templateId: 'd-c010b6bf217b4177b61707a8c557cbee',
        versionId: '05cf59b6-9cc9-4783-a550-a9faa3305626',
        name: 'Unfunded Newcomers - Primo Deposito A',
        subject:
          'Il tuo primo deposito è completato. Il tuo account Bullwaves è pronto per il prossimo passo.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediatamente dopo la conferma del deposito',
      },
      b: {
        templateId: 'd-0fe9ba896386456b95b5c53b76a88268',
        versionId: '2d89beee-9287-47c1-8237-58c62f0be736',
        name: 'Unfunded Newcomers - Primo Deposito B',
        subject: 'Il tuo account è finanziato. Ora continua con il prossimo passo operativo.',
        timing: 'DEPOSIT OK +0d',
        delay: 'Immediatamente dopo la conferma del deposito',
      },
    },
  },
  unfunded_newcomers_first_trade_onboarding_email: {
    en: {
      a: {
        templateId: 'd-192758b6508240d89507053f69f9ca9b',
        versionId: '567f50be-6dd8-4120-a7d4-87ed1ab67417',
        name: 'Unfunded Newcomers - First Trade Onboarding A',
        subject: 'Your first deposit is complete. Your dedicated account manager is available.',
        timing: 'FTD +0d',
        delay: 'Immediately after successful first deposit',
      },
      b: {
        templateId: 'd-33fe70fd80864e70b6eae74a4553fa07',
        versionId: '65c51c8e-41ca-4f32-8ba0-2d93b79ba0fb',
        name: 'Unfunded Newcomers - First Trade Onboarding B',
        subject: 'Your account is now funded. Dedicated support is available for the next step.',
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
          'Il tuo primo deposito è completato. Il tuo account manager dedicato è disponibile.',
        timing: 'FTD +0d',
        delay: 'Immediatamente dopo il primo deposito riuscito',
      },
      b: {
        templateId: 'd-b9dc4454a1e1468988bf4e3e3ce336b1',
        versionId: 'f998b653-f80b-48a8-afd3-fc4e7643926c',
        name: 'Unfunded Newcomers - Onboarding Primo Trade B',
        subject: 'Il tuo account è ora finanziato. Hai un supporto dedicato per il prossimo passo.',
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
        subject: 'If you have questions before funding, here is a clearer way forward.',
        timing: 'D2',
        delay: '+2 days after welcome message',
      },
      b: {
        templateId: 'd-7e2d3e8aa47b45dbbc161d0e2d5cf044',
        versionId: '7b381c67-9b72-4193-8f88-935b07931072',
        name: 'Unfunded Newcomers - Friction Reduction B',
        subject: 'The deposit step may be simpler than it seems.',
        timing: 'D2',
        delay: '+2 days after welcome message',
      },
    },
    it: {
      a: {
        templateId: 'd-4bd5fd578c7f4d6f933da6670c20e8b6',
        versionId: 'df257034-2601-4f6e-8d62-7f67addf055c',
        name: 'Unfunded Newcomers - Riduzione Attriti A',
        subject: 'Se hai dubbi prima di depositare, ecco un modo più chiaro per procedere.',
        timing: 'D2',
        delay: '+2 giorni dopo il welcome message',
      },
      b: {
        templateId: 'd-1f46366f7120412dab51635e793f5827',
        versionId: '2f0e6d0c-c3c8-465b-9354-97d8423c16a4',
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
        templateId: 'd-16dec51da32a4f82827b8992b253f193',
        versionId: 'cf39ee05-5e3d-4117-892f-02ff01c33735',
        name: 'Unfunded Newcomers - Re-entry Nurture A',
        subject: 'If you are still considering Bullwaves, returning can be simpler than expected.',
        timing: 'D21',
        delay: '+21 days after last non-converted step',
      },
      b: {
        templateId: 'd-3d042316676145358bf4ab756802e645',
        versionId: '492adbf6-da7b-4b4e-8728-6bcd15a6be43',
        name: 'Unfunded Newcomers - Re-entry Nurture B',
        subject: 'Your Bullwaves opportunity is still open. You can return with greater clarity.',
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
          'Se stai ancora valutando Bullwaves, tornare può essere più semplice di quanto sembri.',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
      b: {
        templateId: 'd-ba0178bae6f342038ad4f550dc06a1ef',
        versionId: '580994e6-a223-431b-9029-c21ffa6a4879',
        name: 'Unfunded Newcomers - Riattivazione Soft B',
        subject:
          'La tua opportunità con Bullwaves è ancora aperta. Puoi rientrare con maggiore chiarezza.',
        timing: 'D21',
        delay: '+21 giorni dopo l ultimo step non convertito',
      },
    },
  },
  unfunded_newcomers_welcome_value_email: {
    it: {
      a: {
        templateId: 'd-48d554bff2534e92a62f33b936cd51ce',
        versionId: 'd6e95aeb-f3b0-4b51-9720-bb53c74461aa',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore A',
        subject: 'Il tuo account Bullwaves è pronto. Il prossimo passo è disponibile quando vuoi.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
      b: {
        templateId: 'd-260c34d7c84c4ef280ee7dfd8538bf99',
        versionId: '6259cffa-0173-4176-a40f-6f1ccc1f05a5',
        name: 'Unfunded Newcomers - Welcome + Proposta di Valore B',
        subject:
          'Registrazione completata. Il tuo account Bullwaves è pronto per il prossimo passo.',
        timing: 'D0',
        delay: "0 giorni dall'ingresso nel segmento",
      },
    },
    en: {
      a: {
        templateId: 'd-6dbc11007c244c8ab87e2d4d8fa015e4',
        versionId: '8f3f5fac-a2d8-4042-90e1-08b7fa82e8bb',
        name: 'Unfunded Newcomers - Welcome + Value Proposition A',
        subject: 'Your Bullwaves account is ready. The next step is available whenever you are.',
        timing: 'D0',
        delay: '0 days from segment entry',
      },
      b: {
        templateId: 'd-26cf50cb8d944f58ae436eb14a13d687',
        versionId: '756f8692-e74b-4452-af58-9b6eb32e1bb1',
        name: 'Unfunded Newcomers - Welcome + Value Proposition B',
        subject:
          'Your registration is complete. Your Bullwaves account is ready for the next step.',
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
