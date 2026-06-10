import { additionalSegmentJourneyTemplateExtrasById } from './additionalSegmentJourneyTemplateExtras.js'

function localeVariants(a, b, c = null) {
  const variants = {
    a,
    b,
  }

  if (c) {
    variants.c = c
  }

  return {
    variants,
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
        },
        {
          timing: 'D0',
          delay: '0 days from segment entry',
          smsText:
            'Bullwaves: your account is ready to trade. Fund your account now to unlock bonus, manager support, and full platform access.',
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
        },
        {
          timing: 'D0',
          delay: "0 giorni dall'ingresso nel segmento",
          smsText:
            'Bullwaves: il tuo account è pronto per fare trading. Finanzia ora il conto per sbloccare bonus, supporto manager e pieno accesso alla piattaforma.',
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
        },
        {
          timing: '+48hr',
          delay: '+48 hours after welcome message',
          smsText:
            'Bullwaves: make your first deposit today and we will double it with a 100% bonus. Open your account and complete the deposit step now.',
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
        },
        {
          timing: '+48h',
          delay: '+48 ore dopo il welcome message',
          smsText:
            'Bullwaves: effettua oggi il tuo primo deposito e lo raddoppieremo con un bonus del 100%. Apri il tuo account e completa subito il passaggio di deposito.',
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
        },
        {
          timing: '+48hr',
          delay: '+48 hours after welcome message',
          smsText:
            'Bullwaves: your first trade is open and your account manager is ready to help. Open WhatsApp to continue with support.',
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
        },
        {
          timing: '+48h',
          delay: '+48 ore dopo il welcome message',
          smsText:
            'Bullwaves: il tuo primo trade è aperto e il tuo account manager è pronto ad aiutarti. Apri WhatsApp per continuare con il supporto.',
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
        },
        {
          timing: '+3d',
          delay: '+3 days after the no-deposit follow-up',
          smsText:
            'Bullwaves: a clear next move is still available. Open the deposit route and continue with more clarity.',
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
        },
        {
          timing: '+3g',
          delay: '+3 giorni dopo il touch no-deposito',
          smsText:
            'Bullwaves: hai ancora a disposizione una prossima mossa chiara. Apri il percorso di deposito e continua con più chiarezza.',
        }
      ),
    },
  },
  unfunded_newcomers_first_deposit_push_email: {
    locales: {
      en: localeVariants(
        {
          timing: 'DEPOSIT OK +0d',
          delay: 'Immediately after successful deposit confirmation',
          smsText:
            'Bullwaves: your first deposit is complete. Open your client area and continue with the next activation step.',
        },
        {
          timing: 'DEPOSIT OK +0d',
          delay: 'Immediately after successful deposit confirmation',
          smsText:
            'Bullwaves: your account is funded. Re-enter the platform and continue from the next active step.',
        },
        {
          timing: 'DEPOSIT OK +0d',
          delay: 'Immediately after successful deposit confirmation',
          smsText:
            'Bullwaves: use real-time AI market intelligence to guide your next move. Open the platform and continue from your funded account.',
        }
      ),
      it: localeVariants(
        {
          timing: 'DEPOSIT OK +0d',
          delay: 'Immediatamente dopo la conferma del deposito',
          smsText:
            'Bullwaves: il tuo primo deposito è completato. Apri la tua area cliente e continua con il prossimo step di attivazione.',
        },
        {
          timing: 'DEPOSIT OK +0d',
          delay: 'Immediatamente dopo la conferma del deposito',
          smsText:
            'Bullwaves: il tuo account è finanziato. Rientra in piattaforma e continua dal prossimo passo operativo.',
        },
        {
          timing: 'DEPOSIT OK +0d',
          delay: 'Immediatamente dopo la conferma del deposito',
          smsText:
            'Bullwaves: usa l intelligence di mercato AI in tempo reale per guidare il tuo prossimo passo. Apri la piattaforma e continua dal tuo account finanziato.',
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
        },
        {
          timing: 'FTD +0d',
          delay: 'Immediately after successful first deposit',
          smsText:
            'Bullwaves: your first deposit is complete. Real-time AI market intelligence and dedicated support are ready for your next step.',
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
        },
        {
          timing: 'FTD +0d',
          delay: 'Immediatamente dopo il primo deposito riuscito',
          smsText:
            'Bullwaves: il tuo primo deposito è completato. L intelligence di mercato AI in tempo reale e il supporto dedicato sono pronti per il tuo prossimo passo.',
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
        },
        {
          timing: 'D21',
          delay: '+21 days after last non-converted step',
          smsText:
            'Bullwaves: your account is still active. Log in now and continue from where you left off.',
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
        },
        {
          timing: 'D21',
          delay: '+21 giorni dopo l ultimo step non convertito',
          smsText:
            'Bullwaves: il tuo account è ancora attivo. Accedi ora e continua da dove avevi lasciato.',
        }
      ),
    },
  },
  ...additionalSegmentJourneyTemplateExtrasById,
}
