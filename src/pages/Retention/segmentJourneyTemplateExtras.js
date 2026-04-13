import { additionalSegmentJourneyTemplateExtrasById } from './additionalSegmentJourneyTemplateExtras.js'

function localeVariants(a, b) {
  return {
    variants: {
      a,
      b,
    },
  }
}

export const segmentJourneyTemplateExtrasById = {
  unfunded_newcomers_welcome_value_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your account is ready. Complete the next step and unlock your access. Open your client area to continue.',
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: registration done. Your next step is activating access. Enter your client area and continue when ready.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            "Bullwaves: il tuo account è pronto. Completa il prossimo step e sblocca l'accesso. Entra nella tua area personale per continuare.",
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            "Bullwaves: registrazione completata. Il prossimo step è attivare l'accesso. Entra nella tua area e continua quando vuoi.",
        }
      ),
    },
  },
  unfunded_newcomers_friction_reduction_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D2',
          delay: '+2 days after welcome message',
          smsText:
            'Bullwaves: if one doubt is stopping your first deposit, reopen the funding path now. Support is available only if you need it.',
        },
        {
          timing: 'D2',
          delay: '+2 days after welcome message',
          smsText:
            'Bullwaves: the funding step may be easier than it looks. Reopen the path and review it with a simpler frame.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D2',
          delay: '+2 giorni dopo il welcome message',
          smsText:
            "Bullwaves: se un dubbio ti sta fermando sul primo deposito, riapri ora il percorso di deposito. Il supporto c'è solo se ti serve.",
        },
        {
          timing: 'D2',
          delay: '+2 giorni dopo il welcome message',
          smsText:
            'Bullwaves: il passaggio di funding può essere più semplice di quanto sembri. Riapri il percorso e riguardalo con un approccio più leggero.',
        }
      ),
    },
  },
  unfunded_newcomers_account_activation_reminder_email: {
    locales: {
      en: localeVariants(
        {
          timing: '+48hr',
          delay: '+48 hours after welcome message',
          smsText:
            'Bullwaves: your account is ready, but the first deposit is still pending. Reopen the deposit path when you are ready to continue.',
        },
        {
          timing: '+48hr',
          delay: '+48 hours after welcome message',
          smsText:
            'Bullwaves: your account is ready. The deposit step is still open and can be completed whenever you are ready.',
        }
      ),
      it: localeVariants(
        {
          timing: '+48h',
          delay: '+48 ore dopo il welcome message',
          smsText:
            'Bullwaves: il tuo account è pronto, ma il primo deposito è ancora da completare. Riapri il percorso di deposito quando vuoi continuare.',
        },
        {
          timing: '+48h',
          delay: '+48 ore dopo il welcome message',
          smsText:
            'Bullwaves: il tuo account è pronto. Il passaggio di deposito è ancora aperto e può essere completato quando vuoi.',
        }
      ),
    },
  },
  unfunded_newcomers_post_login_deposit_activation_email: {
    locales: {
      en: localeVariants(
        {
          timing: '+48hr',
          delay: '+48 hours after welcome message',
          smsText:
            'Bullwaves: your account is active. Your dedicated account manager is now available for your next step.',
        },
        {
          timing: '+48hr',
          delay: '+48 hours after welcome message',
          smsText:
            'Bullwaves: your first activity is in place. Dedicated guidance is available whenever you need it.',
        }
      ),
      it: localeVariants(
        {
          timing: '+48h',
          delay: '+48 ore dopo il welcome message',
          smsText:
            'Bullwaves: il tuo account è attivo. Il tuo account manager dedicato è ora disponibile per il prossimo passo.',
        },
        {
          timing: '+48h',
          delay: '+48 ore dopo il welcome message',
          smsText:
            'Bullwaves: la tua prima operatività è avviata. Hai una guida dedicata disponibile quando serve.',
        }
      ),
    },
  },
  unfunded_newcomers_deposit_intent_recovery_email: {
    locales: {
      en: localeVariants(
        {
          timing: '+3d',
          delay: '+3 days after the no-deposit follow-up',
          smsText:
            'Bullwaves: your next step is still open. Reopen the deposit path and review it with clarity.',
        },
        {
          timing: '+3d',
          delay: '+3 days after the no-deposit follow-up',
          smsText:
            'Bullwaves: your return is a positive sign. Reopen the deposit path and keep the process moving.',
        }
      ),
      it: localeVariants(
        {
          timing: '+3g',
          delay: '+3 giorni dopo il touch no-deposito',
          smsText:
            'Bullwaves: il tuo prossimo passo è ancora aperto. Riapri il percorso di deposito e riguardalo con chiarezza.',
        },
        {
          timing: '+3g',
          delay: '+3 giorni dopo il touch no-deposito',
          smsText:
            'Bullwaves: il tuo rientro è un segnale positivo. Riapri il percorso di deposito e mantieni attivo il processo.',
        }
      ),
    },
  },
  unfunded_newcomers_first_deposit_push_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D5',
          delay: '+3 days after friction-reduction message',
          smsText:
            'Bullwaves: your account is ready. Complete your first deposit to move from setup into activation.',
        },
        {
          timing: 'D5',
          delay: '+3 days after friction-reduction message',
          smsText:
            'Bullwaves: your setup is complete. The first deposit is the only step remaining.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D5',
          delay: '+3 giorni dopo il messaggio di riduzione attriti',
          smsText:
            'Bullwaves: il tuo account è pronto. Completa il primo deposito per passare dal setup all attivazione.',
        },
        {
          timing: 'D5',
          delay: '+3 giorni dopo il messaggio di riduzione attriti',
          smsText: 'Bullwaves: la configurazione è completa. Resta solo il primo deposito.',
        }
      ),
    },
  },
  unfunded_newcomers_first_trade_onboarding_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'FTD +0d',
          delay: 'Immediately after successful first deposit',
          smsText:
            'Bullwaves: your first deposit is complete. Your dedicated account manager is available for the next step.',
        },
        {
          timing: 'FTD +0d',
          delay: 'Immediately after successful first deposit',
          smsText:
            'Bullwaves: your account is now funded. Dedicated support is available to help you move forward clearly.',
        }
      ),
      it: localeVariants(
        {
          timing: 'FTD +0d',
          delay: 'Immediatamente dopo il primo deposito riuscito',
          smsText:
            'Bullwaves: il tuo primo deposito è completato. Il tuo account manager dedicato è disponibile per il prossimo passo.',
        },
        {
          timing: 'FTD +0d',
          delay: 'Immediatamente dopo il primo deposito riuscito',
          smsText:
            'Bullwaves: il tuo account è ora finanziato. Hai un supporto dedicato per andare avanti con chiarezza.',
        }
      ),
    },
  },
  unfunded_newcomers_reentry_nurture_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'D21',
          delay: '+21 days after last non-converted step',
          smsText:
            'Bullwaves: if you are still considering it, returning can be simpler than expected. Reopen your client area when ready.',
        },
        {
          timing: 'D21',
          delay: '+21 days after last non-converted step',
          smsText:
            'Bullwaves: your Bullwaves opportunity is still open. Return to your account with a clearer next step.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D21',
          delay: '+21 giorni dopo l ultimo step non convertito',
          smsText:
            'Bullwaves: se stai ancora valutando, tornare può essere più semplice di quanto sembri. Riapri la tua area personale quando vuoi.',
        },
        {
          timing: 'D21',
          delay: '+21 giorni dopo l ultimo step non convertito',
          smsText:
            'Bullwaves: la tua opportunità con Bullwaves è ancora aperta. Torna nel tuo account con maggiore chiarezza.',
        }
      ),
    },
  },
  ...additionalSegmentJourneyTemplateExtrasById,
}
