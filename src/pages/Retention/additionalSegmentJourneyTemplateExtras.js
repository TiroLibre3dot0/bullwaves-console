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
}
