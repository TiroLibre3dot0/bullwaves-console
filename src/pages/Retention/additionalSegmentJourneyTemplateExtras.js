function localeVariants(a, b) {
  return {
    variants: {
      a,
      b,
    },
  }
}

export const additionalSegmentJourneyTemplateExtrasById = {
  top_performing_vip_recognition_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your profile has entered our premium attention path. Reopen your client area and continue with the stronger support layer now active.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your recent performance unlocked a more tailored path. Open your client area and keep the momentum active.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: il tuo profilo è entrato in un percorso di attenzione premium. Riapri la tua area cliente e continua con il supporto dedicato già attivo.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: la tua performance recente ha sbloccato un percorso più su misura. Apri la tua area cliente e mantieni attivo lo slancio.',
        }
      ),
    },
  },
  top_performing_advanced_tools_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D3',
          delay: '+3 days after VIP recognition',
          smsText:
            'Bullwaves: your profile can now access a sharper support stack. Reopen the platform and review the premium toolkit prepared for you.',
        },
        {
          timing: 'D3',
          delay: '+3 days after VIP recognition',
          smsText:
            'Bullwaves: protecting edge starts with a better operating environment. Open the platform and review the upgraded support layer.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D3',
          delay: '+3 giorni dopo il touch VIP',
          smsText:
            'Bullwaves: il tuo profilo può accedere a un supporto più preciso. Riapri la piattaforma e guarda gli strumenti premium preparati per te.',
        },
        {
          timing: 'D3',
          delay: '+3 giorni dopo il touch VIP',
          smsText:
            'Bullwaves: proteggere il vantaggio parte da un ambiente operativo migliore. Apri la piattaforma e rivedi il supporto evoluto.',
        }
      ),
    },
  },
  top_performing_loyalty_upgrade_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D10',
          delay: '+7 days after advanced tools offer',
          smsText:
            'Bullwaves: your consistency is opening premium loyalty treatment. Review your tier from the client area and keep the path active.',
        },
        {
          timing: 'D10',
          delay: '+7 days after advanced tools offer',
          smsText:
            'Bullwaves: a stronger loyalty tier is now attached to your profile. Open the platform and review your premium progression.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D10',
          delay: "+7 giorni dopo l'offerta strumenti avanzati",
          smsText:
            "Bullwaves: la tua continuità sta aprendo un percorso loyalty premium. Rivedi il tuo livello dall'area cliente e mantieni attivo il percorso.",
        },
        {
          timing: 'D10',
          delay: "+7 giorni dopo l'offerta strumenti avanzati",
          smsText:
            'Bullwaves: un livello loyalty più forte è ora collegato al tuo profilo. Apri la piattaforma e guarda la tua progressione premium.',
        }
      ),
    },
  },
  top_performing_vip_review_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'Q+0d',
          delay: 'At the start of the quarterly review cycle',
          smsText:
            'Bullwaves: your quarterly VIP review is ready. Open your client area to frame the next account cycle with more precision.',
        },
        {
          timing: 'Q+0d',
          delay: 'At the start of the quarterly review cycle',
          smsText:
            'Bullwaves: the next quarter should be managed, not improvised. Review your VIP plan from the platform now.',
        }
      ),
      it: localeVariants(
        {
          timing: 'Q+0d',
          delay: 'All inizio del ciclo review trimestrale',
          smsText:
            'Bullwaves: la tua review VIP trimestrale è pronta. Apri la tua area cliente per impostare il prossimo ciclo account con più precisione.',
        },
        {
          timing: 'Q+0d',
          delay: 'All inizio del ciclo review trimestrale',
          smsText:
            'Bullwaves: il prossimo trimestre va gestito, non improvvisato. Rivedi ora il tuo piano VIP dalla piattaforma.',
        }
      ),
    },
  },
  top_performing_premium_nurture_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D30',
          delay: '+30 days after last premium touch',
          smsText:
            'Bullwaves: keeping your premium rhythm active matters. Reopen the platform and continue from the premium path already prepared for you.',
        },
        {
          timing: 'D30',
          delay: '+30 days after last premium touch',
          smsText:
            'Bullwaves: a high-value relationship cools only when it loses continuity. Re-enter the platform with a lighter premium path.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D30',
          delay: "+30 giorni dopo l'ultimo touch premium",
          smsText:
            'Bullwaves: tenere attivo il tuo ritmo premium conta. Riapri la piattaforma e continua dal percorso premium già preparato per te.',
        },
        {
          timing: 'D30',
          delay: "+30 giorni dopo l'ultimo touch premium",
          smsText:
            'Bullwaves: una relazione ad alto valore si raffredda solo quando perde continuità. Rientra in piattaforma con un percorso premium più leggero.',
        }
      ),
    },
  },
  most_consistent_badge_award_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: you earned your consistency badge. Open the platform and use this momentum as the base for your next growth step.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your consistency is now a visible growth asset. Reopen the platform and keep the upward rhythm active.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: hai ottenuto il tuo badge di consistenza. Apri la piattaforma e usa questo slancio come base del prossimo step di crescita.',
        },
        {
          timing: 'D0',
          delay: '0 giorni dall ingresso nel segmento',
          smsText:
            "Bullwaves: la tua costanza è ora un asset visibile di crescita. Riapri la piattaforma e mantieni attivo il ritmo verso l'alto.",
        }
      ),
    },
  },
  most_consistent_growth_roadmap_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D7',
          delay: '+7 days after badge award',
          smsText:
            'Bullwaves: your growth roadmap is ready. Open the platform and use the next milestones to keep your trading rhythm more intentional.',
        },
        {
          timing: 'D7',
          delay: '+7 days after badge award',
          smsText:
            'Bullwaves: steady traders grow faster when the next targets are clear. Review your roadmap now from the platform.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D7',
          delay: '+7 giorni dopo il badge',
          smsText:
            'Bullwaves: il tuo piano di crescita è pronto. Apri la piattaforma e usa le prossime tappe per rendere il tuo ritmo più intenzionale.',
        },
        {
          timing: 'D7',
          delay: '+7 giorni dopo il badge',
          smsText:
            'Bullwaves: i trader costanti crescono più velocemente quando i target successivi sono chiari. Rivedi ora il tuo piano dalla piattaforma.',
        }
      ),
    },
  },
  most_consistent_loyalty_reward_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D21',
          delay: '+14 days after growth roadmap',
          smsText:
            'Bullwaves: your consistency is unlocking a loyalty reward. Open the platform and keep the growth loop active from here.',
        },
        {
          timing: 'D21',
          delay: '+14 days after growth roadmap',
          smsText:
            'Bullwaves: stable effort now carries a stronger reward signal. Review it from the platform and keep progressing.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D21',
          delay: '+14 giorni dopo la roadmap',
          smsText:
            'Bullwaves: la tua costanza sta sbloccando un premio fedeltà. Apri la piattaforma e mantieni attivo da qui il percorso di crescita.',
        },
        {
          timing: 'D21',
          delay: '+14 giorni dopo la roadmap',
          smsText:
            'Bullwaves: uno sforzo stabile porta ora un riconoscimento più forte. Rivedilo dalla piattaforma e continua a crescere.',
        }
      ),
    },
  },
  most_consistent_top_performers_onboarding_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'PROMO +0d',
          delay: 'Immediately after promotion to Top Performers',
          smsText:
            'Bullwaves: you are ready for the Top Performers path. Open your client area and begin the upgraded segment journey now.',
        },
        {
          timing: 'PROMO +0d',
          delay: 'Immediately after promotion to Top Performers',
          smsText:
            'Bullwaves: your profile is moving into a stronger tier. Enter the platform and start the upgraded path from there.',
        }
      ),
      it: localeVariants(
        {
          timing: 'PROMO +0d',
          delay: 'Immediatamente dopo la promozione a Top Performers',
          smsText:
            'Bullwaves: sei pronto per il percorso Top Performers. Apri la tua area cliente e avvia ora il percorso del segmento evoluto.',
        },
        {
          timing: 'PROMO +0d',
          delay: 'Immediatamente dopo la promozione a Top Performers',
          smsText:
            'Bullwaves: il tuo profilo sta entrando in un livello più forte. Entra in piattaforma e avvia da lì il percorso evoluto.',
        }
      ),
    },
  },
  most_consistent_cycle_restart_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D30',
          delay: '+30 days after last low-engagement cycle',
          smsText:
            'Bullwaves: a cleaner restart path is ready for you. Reopen the platform and relaunch your next growth cycle from there.',
        },
        {
          timing: 'D30',
          delay: '+30 days after last low-engagement cycle',
          smsText:
            'Bullwaves: if momentum cooled, a softer restart can work better. Re-enter the client area and restart with a lighter frame.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D30',
          delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
          smsText:
            'Bullwaves: un percorso di ripartenza più pulito è pronto per te. Riapri la piattaforma e rilancia da lì il tuo prossimo ciclo di crescita.',
        },
        {
          timing: 'D30',
          delay: '+30 giorni dopo l ultimo ciclo a basso engagement',
          smsText:
            "Bullwaves: se lo slancio si è raffreddato, una ripartenza più morbida può funzionare meglio. Rientra nell'area cliente e riparti con un'impostazione più leggera.",
        }
      ),
    },
  },
  reward_candidates_step1_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your profile unlocked premium benefits. Open your client area to review your updated account setup.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: a more tailored account experience is now active. Enter the platform and continue from your update.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: il tuo profilo ha sbloccato vantaggi premium. Apri la tua area cliente e rivedi il setup aggiornato.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: è attiva un esperienza account più su misura. Entra in piattaforma e continua dal nuovo aggiornamento.',
        }
      ),
    },
  },
  reward_candidates_step2_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D5',
          delay: '+5 days after step 1',
          smsText:
            'Bullwaves: your next-step account plan is ready. Open the platform and review the actions prepared for you.',
        },
        {
          timing: 'D5',
          delay: '+5 days after step 1',
          smsText:
            'Bullwaves: a clearer progression plan is now active. Re-enter the platform and continue with the updated path.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D5',
          delay: '+5 giorni dopo step 1',
          smsText:
            'Bullwaves: il tuo piano dei prossimi passi è pronto. Apri la piattaforma e rivedi le azioni preparate per te.',
        },
        {
          timing: 'D5',
          delay: '+5 giorni dopo step 1',
          smsText:
            'Bullwaves: è attivo un piano di progressione più chiaro. Rientra in piattaforma e continua dal percorso aggiornato.',
        }
      ),
    },
  },
  reward_candidates_step3_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D14',
          delay: '+9 days after step 2',
          smsText:
            'Bullwaves: your account review is approaching. Open the platform and complete your final step.',
        },
        {
          timing: 'D14',
          delay: '+9 days after step 2',
          smsText:
            'Bullwaves: before your next review, confirm your final setup in the client area.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D14',
          delay: '+9 giorni dopo step 2',
          smsText:
            'Bullwaves: la tua review account è vicina. Apri la piattaforma e completa l ultimo passaggio.',
        },
        {
          timing: 'D14',
          delay: '+9 giorni dopo step 2',
          smsText:
            'Bullwaves: prima della prossima review, conferma il setup finale nella tua area cliente.',
        }
      ),
    },
  },
  reward_candidates_followup_retained_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive checkpoint',
          smsText:
            'Bullwaves: review confirmed. Continue from your premium setup and keep your account momentum active.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive checkpoint',
          smsText:
            'Bullwaves: great result. Open your client area and continue from your confirmed account profile.',
        }
      ),
      it: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo checkpoint positivo',
          smsText:
            'Bullwaves: review confermata. Continua dal tuo setup premium e mantieni attivo lo slancio account.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo checkpoint positivo',
          smsText:
            'Bullwaves: ottimo risultato. Apri la tua area cliente e continua dal profilo account confermato.',
        }
      ),
    },
  },
  reward_candidates_followup_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D21',
          delay: '+7 days after missed checkpoint outcome',
          smsText:
            'Bullwaves: a return option is ready. Re-enter the platform and restart from a simpler path.',
        },
        {
          timing: 'D21',
          delay: '+7 days after missed checkpoint outcome',
          smsText:
            'Bullwaves: a lighter restart path is active. Open your client area and relaunch your account continuity.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D21',
          delay: '+7 giorni dopo esito checkpoint non centrato',
          smsText:
            'Bullwaves: è pronta una opzione di ritorno. Rientra in piattaforma e riparti da un percorso più semplice.',
        },
        {
          timing: 'D21',
          delay: '+7 giorni dopo esito checkpoint non centrato',
          smsText:
            'Bullwaves: è attivo un percorso di ripartenza più leggero. Apri area cliente e rilancia la continuità account.',
        }
      ),
    },
  },
  rising_step1_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your recent activity is growing. Open your client area and continue from your updated account setup.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: you are gaining pace. Enter the platform and keep your next steps clear and consistent.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: la tua attivita recente sta crescendo. Apri area cliente e continua dal setup account aggiornato.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: stai aumentando il ritmo. Entra in piattaforma e mantieni chiari i prossimi passi.',
        }
      ),
    },
  },
  rising_step2_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D4',
          delay: '+4 days after step 1',
          smsText:
            'Bullwaves: your next milestones are ready. Open the platform and review your updated account plan.',
        },
        {
          timing: 'D4',
          delay: '+4 days after step 1',
          smsText:
            'Bullwaves: a clearer plan is now active. Re-enter your client area and continue with your next actions.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D4',
          delay: '+4 giorni dopo step 1',
          smsText:
            'Bullwaves: i tuoi prossimi traguardi sono pronti. Apri la piattaforma e rivedi il piano account aggiornato.',
        },
        {
          timing: 'D4',
          delay: '+4 giorni dopo step 1',
          smsText:
            'Bullwaves: e attivo un piano piu chiaro. Rientra in area cliente e continua con i prossimi passaggi.',
        }
      ),
    },
  },
  rising_step3_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D12',
          delay: '+8 days after step 2',
          smsText:
            'Bullwaves: your next account review is close. Open the platform and finalize your current setup.',
        },
        {
          timing: 'D12',
          delay: '+8 days after step 2',
          smsText:
            'Bullwaves: before the next evaluation, confirm your final setup in your client area.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D12',
          delay: '+8 giorni dopo step 2',
          smsText:
            'Bullwaves: la prossima review account e vicina. Apri la piattaforma e finalizza il setup corrente.',
        },
        {
          timing: 'D12',
          delay: '+8 giorni dopo step 2',
          smsText:
            'Bullwaves: prima della prossima valutazione, conferma il setup finale nella tua area cliente.',
        }
      ),
    },
  },
  rising_followup_retained_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: great result, your progress is confirmed. Continue from your client area and keep momentum active.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: your account is on track. Open your client area and continue from your confirmed setup.',
        }
      ),
      it: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: ottimo risultato, la tua progressione e confermata. Continua da area cliente e mantieni attivo lo slancio.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: il tuo account e in linea. Apri area cliente e continua dal setup confermato.',
        }
      ),
    },
  },
  rising_followup_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D21',
          delay: '+9 days after missed outcome',
          smsText:
            'Bullwaves: a return option is available. Re-enter the platform and restart from a simpler path.',
        },
        {
          timing: 'D21',
          delay: '+9 days after missed outcome',
          smsText:
            'Bullwaves: a lighter restart is now active. Open your client area and resume account activity.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D21',
          delay: '+9 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: e disponibile una opzione di ritorno. Rientra in piattaforma e riparti da un percorso piu semplice.',
        },
        {
          timing: 'D21',
          delay: '+9 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: e attiva una ripartenza piu leggera. Apri area cliente e riprendi l attivita account.',
        }
      ),
    },
  },
  churned_high_value_step1_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: we prepared a dedicated return review for your profile. In your area you can review manager support, bonus options, and trading tools access.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: a dedicated return review is available. Open your client area to evaluate manager support, bonus options, and trading tools access.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: abbiamo preparato una revisione dedicata al tuo rientro. Nella tua area puoi valutare supporto manager, opzioni bonus e accesso ai trading tools.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: e disponibile una revisione dedicata al ritorno. Apri la tua area cliente per valutare supporto manager, opzioni bonus e accesso ai trading tools.',
        }
      ),
    },
  },
  churned_high_value_step2_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D3',
          delay: '+3 days after step 1',
          smsText:
            'Bullwaves: reminder for your dedicated return review. Check manager support, bonus options, and available trading tools in your client area.',
        },
        {
          timing: 'D3',
          delay: '+3 days after step 1',
          smsText:
            'Bullwaves: dedicated return review still open. Enter your client area to evaluate manager support, bonus options, and trading tools access.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D3',
          delay: '+3 giorni dopo step 1',
          smsText:
            'Bullwaves: promemoria revisione dedicata al rientro. In area cliente puoi verificare supporto manager, opzioni bonus e trading tools disponibili.',
        },
        {
          timing: 'D3',
          delay: '+3 giorni dopo step 1',
          smsText:
            'Bullwaves: revisione dedicata al ritorno ancora aperta. Entra in area cliente per valutare supporto manager, opzioni bonus e accesso ai trading tools.',
        }
      ),
    },
  },
  churned_high_value_step3_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D7',
          delay: '+4 days after step 2',
          smsText:
            'Bullwaves: final review touch. Confirm from your client area whether to proceed with manager support, bonus options, and trading tools access.',
        },
        {
          timing: 'D7',
          delay: '+4 days after step 2',
          smsText:
            'Bullwaves: final review window open. Continue from your client area to confirm manager support, bonus options, and trading tools access.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D7',
          delay: '+4 giorni dopo step 2',
          smsText:
            'Bullwaves: touch finale di revisione. Conferma dalla tua area cliente se procedere con supporto manager, opzioni bonus e accesso ai trading tools.',
        },
        {
          timing: 'D7',
          delay: '+4 giorni dopo step 2',
          smsText:
            'Bullwaves: finestra finale di revisione aperta. Continua dalla tua area cliente per confermare supporto manager, opzioni bonus e accesso ai trading tools.',
        }
      ),
    },
  },
  churned_high_value_followup_retained_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: excellent, your active return is confirmed. Continue from your client area and keep continuity stable.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: your active status is restored. Open your account and keep this momentum disciplined.',
        }
      ),
      it: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: ottimo, il tuo ritorno attivo e confermato. Continua da area cliente e mantieni stabile la continuita.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: il tuo stato attivo e ripristinato. Apri account e mantieni questo slancio con disciplina.',
        }
      ),
    },
  },
  churned_high_value_followup_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D14',
          delay: '+7 days after missed outcome',
          smsText:
            'Bullwaves: your high-value return is still open. Re-enter the platform and relaunch from the return path.',
        },
        {
          timing: 'D14',
          delay: '+7 days after missed outcome',
          smsText:
            'Bullwaves: a lighter return route is now available. Open your client area and restart with less friction.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D14',
          delay: '+7 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: il tuo ritorno ad alto valore e ancora aperto. Rientra in piattaforma e rilancia dal percorso di ritorno.',
        },
        {
          timing: 'D14',
          delay: '+7 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: e disponibile un percorso di ritorno piu leggero. Apri area cliente e riparti con meno attrito.',
        }
      ),
    },
  },
  dormant_value_step1_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your account can restart from a stronger base. Open your client area and review the value reactivation path.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your profile is still worth a tailored return. Re-enter the platform and continue from a simpler setup.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: il tuo account puo ripartire da una base piu forte. Apri area cliente e rivedi il percorso di riattivazione.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: il tuo profilo merita ancora un ritorno su misura. Rientra in piattaforma e continua da un setup piu semplice.',
        }
      ),
    },
  },
  dormant_value_step2_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D3',
          delay: '+3 days after step 1',
          smsText:
            'Bullwaves: your guided return plan is ready. Open the platform and review the next actions prepared for you.',
        },
        {
          timing: 'D3',
          delay: '+3 days after step 1',
          smsText:
            'Bullwaves: a clearer restart path is active. Enter your client area and relaunch from the value plan.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D3',
          delay: '+3 giorni dopo step 1',
          smsText:
            'Bullwaves: il tuo piano guidato di ritorno e pronto. Apri la piattaforma e rivedi le prossime azioni.',
        },
        {
          timing: 'D3',
          delay: '+3 giorni dopo step 1',
          smsText:
            'Bullwaves: e attivo un percorso di ripartenza piu chiaro. Entra in area cliente e rilancia dal piano value.',
        }
      ),
    },
  },
  dormant_value_step3_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D9',
          delay: '+6 days after step 2',
          smsText:
            'Bullwaves: keep your return active. Open your client area and confirm the next continuity step.',
        },
        {
          timing: 'D9',
          delay: '+6 days after step 2',
          smsText:
            'Bullwaves: your comeback is still in progress. Re-enter the platform and secure the next step now.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D9',
          delay: '+6 giorni dopo step 2',
          smsText:
            'Bullwaves: mantieni attivo il tuo ritorno. Apri area cliente e conferma il prossimo passo di continuita.',
        },
        {
          timing: 'D9',
          delay: '+6 giorni dopo step 2',
          smsText:
            'Bullwaves: il tuo rientro e ancora in corso. Rientra in piattaforma e consolida ora il prossimo passo.',
        }
      ),
    },
  },
  dormant_value_followup_retained_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: great result, your dormant-value recovery is confirmed. Continue from your client area and keep the rhythm active.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: your account is back in motion. Open your area and protect this continuity.',
        }
      ),
      it: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: ottimo risultato, il recupero dormant value e confermato. Continua da area cliente e mantieni il ritmo attivo.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: il tuo account e tornato in movimento. Apri la tua area e proteggi questa continuita.',
        }
      ),
    },
  },
  dormant_value_followup_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D18',
          delay: '+9 days after missed outcome',
          smsText:
            'Bullwaves: your return path is still open. Re-enter the platform and restart from the simpler value route.',
        },
        {
          timing: 'D18',
          delay: '+9 days after missed outcome',
          smsText:
            'Bullwaves: a lighter reactivation option is ready. Open your client area and continue with less friction.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D18',
          delay: '+9 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: il tuo percorso di ritorno e ancora aperto. Rientra in piattaforma e riparti dalla route value piu semplice.',
        },
        {
          timing: 'D18',
          delay: '+9 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: e pronta una riattivazione piu leggera. Apri area cliente e continua con meno attrito.',
        }
      ),
    },
  },
  dormant_mid_step1_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your mid-value profile can return with a stronger setup. Open your client area and review the winback path.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: a more relevant return route is available. Re-enter the platform and continue from your updated path.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: il tuo profilo mid-value puo tornare con un setup piu forte. Apri area cliente e rivedi il winback path.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: e disponibile un percorso di ritorno piu rilevante. Rientra in piattaforma e continua dal percorso aggiornato.',
        }
      ),
    },
  },
  dormant_mid_step2_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D4',
          delay: '+4 days after step 1',
          smsText:
            'Bullwaves: your relaunch plan is ready. Open the platform and review the next actions for your profile.',
        },
        {
          timing: 'D4',
          delay: '+4 days after step 1',
          smsText:
            'Bullwaves: a clearer return structure is active. Enter your client area and continue from the relaunch path.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D4',
          delay: '+4 giorni dopo step 1',
          smsText:
            'Bullwaves: il tuo piano di rilancio e pronto. Apri la piattaforma e rivedi le prossime azioni per il tuo profilo.',
        },
        {
          timing: 'D4',
          delay: '+4 giorni dopo step 1',
          smsText:
            'Bullwaves: e attiva una struttura di ritorno piu chiara. Entra in area cliente e continua dal percorso relaunch.',
        }
      ),
    },
  },
  dormant_mid_step3_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D10',
          delay: '+6 days after step 2',
          smsText:
            'Bullwaves: keep your recovery stable. Open your client area and confirm the next managed step.',
        },
        {
          timing: 'D10',
          delay: '+6 days after step 2',
          smsText:
            'Bullwaves: your return is close to stabilization. Re-enter the platform and secure the next action now.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D10',
          delay: '+6 giorni dopo step 2',
          smsText:
            'Bullwaves: mantieni stabile il tuo recupero. Apri area cliente e conferma il prossimo passo guidato.',
        },
        {
          timing: 'D10',
          delay: '+6 giorni dopo step 2',
          smsText:
            'Bullwaves: il tuo ritorno e vicino alla stabilizzazione. Rientra in piattaforma e consolida il prossimo passo.',
        }
      ),
    },
  },
  dormant_mid_followup_retained_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: great result, your dormant-mid recovery is confirmed. Continue from your client area and keep the account active.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: your profile is back on track. Open the platform and continue from the stronger setup.',
        }
      ),
      it: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: ottimo risultato, il recupero dormant mid e confermato. Continua da area cliente e mantieni l account attivo.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: il tuo profilo e tornato in linea. Apri la piattaforma e continua dal setup piu forte.',
        }
      ),
    },
  },
  dormant_mid_followup_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D18',
          delay: '+8 days after missed outcome',
          smsText:
            'Bullwaves: your mid-value return is still open. Re-enter the platform and restart from the guided path.',
        },
        {
          timing: 'D18',
          delay: '+8 days after missed outcome',
          smsText:
            'Bullwaves: a lighter winback route is available. Open your client area and continue with lower friction.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D18',
          delay: '+8 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: il tuo ritorno mid-value e ancora aperto. Rientra in piattaforma e riparti dal percorso guidato.',
        },
        {
          timing: 'D18',
          delay: '+8 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: e disponibile un winback piu leggero. Apri area cliente e continua con meno attrito.',
        }
      ),
    },
  },
  dormant_low_step1_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: a simple return path is open for your account. Open your client area and take the first easy step.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: if you want to restart, the next step is still available. Re-enter the platform with a lighter setup.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: per il tuo account e aperto un percorso di ritorno semplice. Apri area cliente e fai il primo passo.',
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: se vuoi ripartire, il prossimo passo e ancora disponibile. Rientra in piattaforma con un setup piu leggero.',
        }
      ),
    },
  },
  dormant_low_step2_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D6',
          delay: '+6 days after step 1',
          smsText:
            'Bullwaves: your simple restart route is ready. Open the platform and continue from the easiest next action.',
        },
        {
          timing: 'D6',
          delay: '+6 days after step 1',
          smsText:
            'Bullwaves: a light re-entry option is still active. Open your client area and relaunch with less effort.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D6',
          delay: '+6 giorni dopo step 1',
          smsText:
            'Bullwaves: il tuo percorso semplice di restart e pronto. Apri la piattaforma e continua dal prossimo passo piu facile.',
        },
        {
          timing: 'D6',
          delay: '+6 giorni dopo step 1',
          smsText:
            'Bullwaves: una opzione di rientro leggera e ancora attiva. Apri area cliente e riparti con meno sforzo.',
        }
      ),
    },
  },
  dormant_low_step3_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D15',
          delay: '+9 days after step 2',
          smsText:
            'Bullwaves: keep the return active with one final light step. Open your client area and continue now.',
        },
        {
          timing: 'D15',
          delay: '+9 days after step 2',
          smsText:
            'Bullwaves: your restart path is still warm. Re-enter the platform and protect the momentum you rebuilt.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D15',
          delay: '+9 giorni dopo step 2',
          smsText:
            'Bullwaves: mantieni attivo il ritorno con un ultimo passo leggero. Apri area cliente e continua ora.',
        },
        {
          timing: 'D15',
          delay: '+9 giorni dopo step 2',
          smsText:
            'Bullwaves: il tuo percorso di restart e ancora caldo. Rientra in piattaforma e proteggi lo slancio.',
        }
      ),
    },
  },
  dormant_low_followup_retained_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: good result, your return is confirmed. Continue from your client area and keep the account in motion.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Immediate follow-up after positive outcome',
          smsText:
            'Bullwaves: your profile is active again. Open the platform and keep this simple rhythm going.',
        }
      ),
      it: localeVariants(
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: buon risultato, il tuo ritorno e confermato. Continua da area cliente e mantieni l account in movimento.',
        },
        {
          timing: 'CHECKPOINT +0d',
          delay: 'Follow-up immediato dopo esito positivo',
          smsText:
            'Bullwaves: il tuo profilo e di nuovo attivo. Apri la piattaforma e mantieni questo ritmo semplice.',
        }
      ),
    },
  },
  dormant_low_followup_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D21',
          delay: '+6 days after missed outcome',
          smsText:
            'Bullwaves: your return option is still open. Re-enter the platform and restart from the lighter path.',
        },
        {
          timing: 'D21',
          delay: '+6 days after missed outcome',
          smsText:
            'Bullwaves: a simpler comeback route is available. Open your client area and continue with less pressure.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D21',
          delay: '+6 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: la tua opzione di ritorno e ancora aperta. Rientra in piattaforma e riparti dal percorso piu leggero.',
        },
        {
          timing: 'D21',
          delay: '+6 giorni dopo esito non centrato',
          smsText:
            'Bullwaves: e disponibile una route di comeback piu semplice. Apri area cliente e continua con meno pressione.',
        }
      ),
    },
  },
}
