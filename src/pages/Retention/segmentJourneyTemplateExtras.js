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
          delay: '0 giorni dall ingresso nel segmento',
          smsText:
            'Bullwaves: il tuo account e pronto. Completa il prossimo step e sblocca l accesso. Entra nella tua area personale per continuare.',
        },
        {
          timing: 'D0',
          delay: '0 giorni dall ingresso nel segmento',
          smsText:
            'Bullwaves: registrazione completata. Il prossimo step e attivare l accesso. Entra nella tua area e continua quando vuoi.',
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
            'Bullwaves: se un dubbio ti sta fermando sul primo deposito, riapri ora il percorso di funding. Il supporto c e solo se ti serve.',
        },
        {
          timing: 'D2',
          delay: '+2 giorni dopo il welcome message',
          smsText:
            'Bullwaves: il passaggio di funding puo essere piu semplice di quanto sembri. Riapri il percorso e riguardalo con un frame piu leggero.',
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
            'Bullwaves: your access is almost unlocked. Complete your first deposit now and move your account into activation.',
        },
        {
          timing: 'D5',
          delay: '+3 days after friction-reduction message',
          smsText:
            'Bullwaves: do not lose momentum. Finish the funding step today and complete your account setup.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D5',
          delay: '+3 giorni dopo il messaggio di riduzione attriti',
          smsText:
            'Bullwaves: il tuo accesso e quasi sbloccato. Completa ora il primo deposito e porta l account in attivazione.',
        },
        {
          timing: 'D5',
          delay: '+3 giorni dopo il messaggio di riduzione attriti',
          smsText:
            'Bullwaves: non perdere momentum. Completa oggi il funding e chiudi il setup del tuo account.',
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
            'Bullwaves: your account is funded. Open the platform and place your first trade when you are ready.',
        },
        {
          timing: 'FTD +0d',
          delay: 'Immediately after successful first deposit',
          smsText:
            'Bullwaves: your first trade can stay simple. Open the platform and take the next step with a small first move.',
        }
      ),
      it: localeVariants(
        {
          timing: 'FTD +0d',
          delay: 'Immediatamente dopo il primo deposito riuscito',
          smsText:
            'Bullwaves: il tuo account e finanziato. Apri la piattaforma e fai il tuo primo trade quando vuoi.',
        },
        {
          timing: 'FTD +0d',
          delay: 'Immediatamente dopo il primo deposito riuscito',
          smsText:
            'Bullwaves: il tuo primo trade puo restare semplice. Apri la piattaforma e fai il prossimo passo con un primo movimento piccolo.',
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
            'Bullwaves: still interested? Reopen your client area with a simpler path and continue only if the next step feels clear.',
        },
        {
          timing: 'D21',
          delay: '+21 days after last non-converted step',
          smsText:
            'Bullwaves: your opportunity is still open. Return to your account and restart with a clearer next step.',
        }
      ),
      it: localeVariants(
        {
          timing: 'D21',
          delay: '+21 giorni dopo l ultimo step non convertito',
          smsText:
            'Bullwaves: sei ancora interessato? Riapri la tua area personale con un percorso piu semplice e continua solo se il prossimo step ti e chiaro.',
        },
        {
          timing: 'D21',
          delay: '+21 giorni dopo l ultimo step non convertito',
          smsText:
            'Bullwaves: la tua opportunita e ancora aperta. Torna nel tuo account e riparti con un prossimo step piu chiaro.',
        }
      ),
    },
  },
  ...additionalSegmentJourneyTemplateExtrasById,
}
