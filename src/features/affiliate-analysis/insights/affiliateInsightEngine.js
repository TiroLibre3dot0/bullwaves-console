import { AFFILIATE_INSIGHT_TEMPLATES } from './affiliateInsightTemplates'

/**
 * @typedef {{ text: string, emph?: boolean, tone?: 'risk'|'warn' }} Part
 * @typedef {{ lines: Part[][], nextStep: Part[] }} InsightBlock
 * @typedef {{ overall: Part[], strengths: Part[][], risk: Part[]|null, action: Part[] }} FinalBlock
 */

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const isNum = (v) => Number.isFinite(Number(v))

const normLocale = (locale) =>
  String(locale || '')
    .toLowerCase()
    .startsWith('it')
    ? 'it'
    : 'en'

const dirFromDelta = (delta, eps = 1e-9) => {
  const d = Number(delta)
  if (!Number.isFinite(d)) return 'flat'
  if (d > eps) return 'up'
  if (d < -eps) return 'down'
  return 'flat'
}

const kw = (text, tone) => ({ text, emph: true, ...(tone ? { tone } : {}) })
const tx = (text) => ({ text, emph: false })

const joinParts = (a, b) => [...a, ...b]

const calcLosingRatioPct = (pl, netDeposits) => {
  const pnl = Number(pl)
  const nd = Number(netDeposits)
  if (!Number.isFinite(pnl) || !Number.isFinite(nd) || nd === 0) return null
  return (pnl / Math.max(Math.abs(nd), 1)) * 100
}

const hashString = (s) => {
  // Deterministic small hash (djb2-ish), stable across runs.
  const str = String(s || '')
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i)
  return h >>> 0
}

const pickVariant = (key, variants, seed) => {
  const list = Array.isArray(variants) ? variants.filter(Boolean) : []
  if (!list.length) return null
  const idx = hashString(`${key}|${seed}`) % list.length
  return list[idx]
}

const buildSeed = ({ locale, ranks, deltas, shares, cohort, signals }) => {
  const parts = [
    `l=${locale}`,
    `ar=${ranks?.affiliateRank ?? ''}`,
    `cr=${ranks?.crRank ?? ''}`,
    `wr=${ranks?.withdrawalsRank ?? ''}`,
    `nd=${deltas?.netDepositsDir ?? ''}`,
    `pl=${deltas?.plDir ?? ''}`,
    `roi=${deltas?.roiDir ?? ''}`,
    `cw=${Number(shares?.netDepositsPct ?? '')}`,
    `cf=${String(cohort?.flag ?? '')}`,
    `sg=${(signals || []).join(',')}`,
  ]
  return parts.join('|')
}

const rankPhrase = (rank, total, locale) => {
  if (!rank || !total) return null
  const r = Number(rank)
  const t = Number(total)
  if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return null

  if (r <= 3) return locale === 'it' ? 'top-3' : 'top-3'
  if (r <= 5) return locale === 'it' ? 'top-5' : 'top-5'
  if (r >= t - 2) return locale === 'it' ? 'bottom-3' : 'bottom-3'
  if (r >= t - 4) return locale === 'it' ? 'bottom-5' : 'bottom-5'
  return locale === 'it' ? 'mid-pack' : 'mid-pack'
}

/**
 * Withdrawals ranking is INVERSE: lower withdrawals is better.
 * rank=1 => lowest withdrawals.
 */
const withdrawalsRankPhrase = (rank, total, locale) => {
  if (!rank || !total) return null
  const r = Number(rank)
  const t = Number(total)
  if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return null

  // rank 1 is best (lowest withdrawals)
  if (r <= 3) return locale === 'it' ? 'tra i più bassi' : 'among the lowest'
  if (r >= t - 2) return locale === 'it' ? 'tra i più alti' : 'among the highest'
  if (r >= t - 4) return locale === 'it' ? 'alti nel Top 20' : 'high in the Top 20'
  return locale === 'it' ? 'in linea' : 'in line'
}

const buildRanks = ({ rows, total, field, direction }) => {
  // direction: 'high' => higher is better (rank 1 is highest)
  // direction: 'low'  => lower is better (rank 1 is lowest)
  const list = (rows || [])
    .map((r) => ({ id: r?.id, v: Number(r?.[field]) }))
    .filter((r) => r.id && Number.isFinite(r.v))

  list.sort((a, b) => (direction === 'low' ? a.v - b.v : b.v - a.v))

  const rankById = new Map()
  list.forEach((r, idx) => rankById.set(r.id, idx + 1))

  return {
    total: Number(total || list.length || 0),
    getRank: (id) => rankById.get(id) || null,
  }
}

const dominantSignals = (signals) => {
  // signals is ordered already by priority
  return (signals || []).filter(Boolean).slice(0, 2)
}

const hasScaleImportance = ({ affiliateRank, shares }) => {
  const r = Number(affiliateRank || 0)
  if (r && r <= 3) return true

  const ndW = Number(shares?.netDepositsPct)
  const plW = Number(shares?.plPct)
  const payW = Number(shares?.paymentsPct)

  // Keep conservative: "meaningful weight" only when clearly material.
  if (Number.isFinite(ndW) && ndW >= 15) return true
  if (Number.isFinite(plW) && plW >= 15) return true
  if (Number.isFinite(payW) && payW >= 15) return true
  return false
}

const weightPhrase = ({ affiliateRank, shares, total, locale }) => {
  const r = Number(affiliateRank || 0)
  if (r && r <= 3) return locale === 'it' ? 'peso rilevante (top-3)' : 'meaningful weight (top-3)'

  const ndW = Number(shares?.netDepositsPct)
  if (Number.isFinite(ndW) && ndW >= 20)
    return locale === 'it' ? 'peso alto sui net deposits' : 'large share of net deposits'
  if (Number.isFinite(ndW) && ndW >= 12)
    return locale === 'it'
      ? 'peso significativo sui net deposits'
      : 'meaningful share of net deposits'

  const t = Number(total || 0)
  if (r && t) {
    const band = rankPhrase(r, t, locale)
    if (band === 'top-5')
      return locale === 'it' ? 'peso significativo (top-5)' : 'meaningful weight (top-5)'
  }

  return locale === 'it' ? 'peso moderato' : 'moderate weight'
}

const efficiencyPressureSignals = ({ crRank, total, cpaToArpu, roiDir }) => {
  const signals = []

  const crR = Number(crRank || 0)
  const t = Number(total || 0)
  if (crR && t && crR >= t - 4) signals.push('lowConversion')

  const ratio = Number(cpaToArpu)
  if (Number.isFinite(ratio) && ratio >= 1.15) signals.push('costAboveValue')

  if (roiDir === 'down') signals.push('roiDeteriorating')

  return signals
}

const riskSignals = ({ netDeposits, pl, roi, withdrawalsRank, total, withdrawalsDir }) => {
  const signals = []

  const nd = Number(netDeposits)
  const pnl = Number(pl)
  const r = Number(roi)

  if (
    (Number.isFinite(nd) && nd < 0) ||
    (Number.isFinite(pnl) && pnl < 0) ||
    (Number.isFinite(r) && r < 0)
  ) {
    signals.push('financialDownside')
  }

  const wR = Number(withdrawalsRank || 0)
  const t = Number(total || 0)
  if (wR && t && wR >= t - 4) signals.push('withdrawalsHigh')

  if (withdrawalsDir === 'up') signals.push('withdrawalsWorsening')

  return signals
}

const momentumSignals = ({ ndDir, plDir, roiDir }) => {
  const signals = []
  if (ndDir === 'up' && plDir === 'up') signals.push('momentumUp')
  else if (roiDir === 'up') signals.push('roiImproving')
  return signals
}

const stabilitySignals = ({ ndDir, plDir, roiDir }) => {
  if (ndDir === 'flat' && plDir === 'flat' && roiDir === 'flat') return ['stable']
  return []
}

const buildExecutive = ({
  locale,
  periodMeta,
  signals,
  importance,
  limitingFactor,
  unitEconomics,
  seed,
}) => {
  const isIt = locale === 'it'

  const what = (() => {
    if (signals.includes('financialDownside')) {
      return pickVariant(
        'exec.what.downside',
        isIt
          ? [
              [tx('Performance '), kw('da correggere', 'risk'), tx('.')],
              [tx('Quadro '), kw('critico', 'risk'), tx('.')],
              [tx('Risultati '), kw('sotto pressione', 'warn'), tx('.')],
            ]
          : [
              [tx('Overall performance '), kw('needs attention', 'risk'), tx('.')],
              [tx('Situation '), kw('needs a fix', 'risk'), tx('.')],
              [tx('Results are '), kw('under pressure', 'warn'), tx('.')],
            ],
        seed
      )
    }
    if (signals.includes('momentumUp') || signals.includes('roiImproving')) {
      return pickVariant(
        'exec.what.up',
        isIt
          ? [
              [tx('Performance in '), kw('miglioramento'), tx('.')],
              [tx('Trend '), kw('positivo'), tx('.')],
              [tx('Risultati in '), kw('ripresa'), tx('.')],
            ]
          : [
              [tx('Performance is '), kw('improving'), tx('.')],
              [tx('Trend looks '), kw('positive'), tx('.')],
              [tx('Results are '), kw('recovering'), tx('.')],
            ],
        seed
      )
    }
    return pickVariant(
      'exec.what.stable',
      isIt
        ? [
            [tx('Performance '), kw('stabile'), tx('.')],
            [tx('Quadro '), kw('senza scossoni'), tx('.')],
            [tx('Andamento '), kw('regolare'), tx('.')],
          ]
        : [
            [tx('Performance is '), kw('stable'), tx('.')],
            [tx('Situation is '), kw('steady'), tx('.')],
            [tx('Trend looks '), kw('even'), tx('.')],
          ],
      seed
    )
  })()

  const why = (() => {
    if (signals.includes('withdrawalsHigh') || signals.includes('withdrawalsWorsening')) {
      return isIt
        ? [kw('Prelievi', 'warn'), tx(' alti nel Top 20: rischio qualità.')]
        : [kw('Withdrawals', 'warn'), tx(' are high in the Top 20: quality risk.')]
    }
    if (signals.includes('lowConversion')) {
      return isIt
        ? [
            kw('Conversione'),
            tx(' tra le più basse nel Top 20: il funnel è il collo di bottiglia.'),
          ]
        : [
            kw('Conversion'),
            tx(' is among the lowest in the Top 20: the funnel is the bottleneck.'),
          ]
    }
    if (signals.includes('costAboveValue')) {
      if (unitEconomics?.losingRatioLow) {
        return isIt
          ? [
              kw('Losing ratio'),
              tx(' sotto 50%: trader più profittevoli (media ~75%). '),
              kw('ARPU'),
              tx(' tende a soffrire per Bullwaves.'),
            ]
          : [
              kw('Losing ratio'),
              tx(' is below 50%: traders are more profitable (avg ~75%). '),
              kw('ARPU'),
              tx(' tends to stay weak for Bullwaves.'),
            ]
      }
      return isIt
        ? [
            kw('ARPU'),
            tx(' sotto '),
            kw('CPA'),
            tx(': probabile tema di '),
            kw('retention/churn'),
            tx('.'),
          ]
        : [
            kw('ARPU'),
            tx(' below '),
            kw('CPA'),
            tx(': likely '),
            kw('retention/churn'),
            tx(' issue.'),
          ]
    }
    if (signals.includes('roiDeteriorating')) {
      return isIt
        ? [kw('ROI'), tx(' in calo: serve correzione prima di aumentare esposizione.')]
        : [kw('ROI'), tx(' is deteriorating: fix before increasing exposure.')]
    }
    // fallback: pick a single limiting factor if provided
    if (limitingFactor === 'conversion') {
      return isIt
        ? [kw('Conversione'), tx(' è il collo di bottiglia oggi.')]
        : [kw('Conversion'), tx(' is the bottleneck today.')]
    }
    return isIt
      ? pickVariant(
          'exec.why.none.it',
          [
            [tx('Nessun rischio evidente.')],
            [tx('Nessun segnale critico emerge.')],
            [tx('Nessun alert materiale.')],
          ],
          seed
        )
      : pickVariant(
          'exec.why.none.en',
          [
            [tx('No material risk stands out.')],
            [tx('No critical signal stands out.')],
            [tx('No major alert shows up.')],
          ],
          seed
        )
  })()

  const importanceLine = (() => {
    const label = importance || (isIt ? 'peso moderato' : 'moderate weight')
    return isIt
      ? [tx('Questo affiliate ha '), kw(label), tx(' nel Top 20.')]
      : [tx('This affiliate has '), kw(label), tx(' within Top 20.')]
  })()

  const nextStep = (() => {
    if (signals.includes('financialDownside')) {
      return isIt
        ? [
            tx('Blocca l’aumento di budget e correggi '),
            kw('costi'),
            tx(' e '),
            kw('qualità'),
            tx('.'),
          ]
        : [tx('Stop increasing spend and fix '), kw('costs'), tx(' and '), kw('quality'), tx('.')]
    }
    if (signals.includes('withdrawalsHigh') || signals.includes('withdrawalsWorsening')) {
      return isIt
        ? [tx('Riduci esposizione e verifica '), kw('prelievi'), tx(' e '), kw('sorgenti'), tx('.')]
        : [
            tx('Reduce exposure and review '),
            kw('withdrawals'),
            tx(' and '),
            kw('sources'),
            tx('.'),
          ]
    }
    if (signals.includes('lowConversion')) {
      return isIt
        ? [
            tx('Fai test rapidi su '),
            kw('offerta'),
            tx(' (incentivi/condizioni), '),
            kw('creative'),
            tx(' (messaggio/CTA) e '),
            kw('landing'),
            tx(' (meno frizione). Misura '),
            kw('click→registrazione'),
            tx(' e '),
            kw('registrazione→FTD'),
            tx('; scala solo la variante che migliora.'),
          ]
        : [
            tx('Run quick tests on '),
            kw('offer'),
            tx(' (incentives/terms), '),
            kw('creatives'),
            tx(' (message/CTA) and '),
            kw('landing'),
            tx(' (less friction). Track '),
            kw('click→signup'),
            tx(' and '),
            kw('signup→FTD'),
            tx('; scale only the variant that improves them.'),
          ]
    }
    if (signals.includes('costAboveValue') || signals.includes('roiDeteriorating')) {
      if (unitEconomics?.losingRatioLow) {
        return isIt
          ? [
              tx('Rinegozia '),
              kw('CPA'),
              tx(' e rivedi '),
              kw('QFTD'),
              tx(' (gate su qualità/attività) prima di aumentare budget.'),
            ]
          : [
              tx('Renegotiate '),
              kw('CPA'),
              tx(' and tighten '),
              kw('QFTD'),
              tx(' (quality/activity gates) before increasing spend.'),
            ]
      }
      return isIt
        ? [
            tx('Rinegozia '),
            kw('CPA'),
            tx(' e lavora su '),
            kw('retention'),
            tx(' prima di aumentare budget.'),
          ]
        : [
            tx('Renegotiate '),
            kw('CPA'),
            tx(' and improve '),
            kw('retention'),
            tx(' before increasing spend.'),
          ]
    }
    return isIt
      ? pickVariant(
          'exec.next.neutral.it',
          [
            [tx('Mantieni esposizione e ricontrolla al prossimo giro.')],
            [tx('Mantieni esposizione e ricontrolla alla prossima lettura.')],
            [tx('Mantieni esposizione e verifica di nuovo tra poco.')],
          ],
          seed
        )
      : pickVariant(
          'exec.next.neutral.en',
          [
            [tx('Maintain exposure and re-check on the next read.')],
            [tx('Maintain exposure and review again next time.')],
            [tx('Maintain exposure and validate on the next snapshot.')],
          ],
          seed
        )
  })()

  return {
    lines: [what, why, importanceLine],
    nextStep,
  }
}

const buildKpi = ({
  locale,
  signals,
  ranks,
  total,
  cpaToArpu,
  withdrawalsRank,
  unitEconomics,
  seed,
}) => {
  const isIt = locale === 'it'

  const limiter = (() => {
    if (signals.includes('lowConversion')) return 'conversion'
    if (signals.includes('costAboveValue') || signals.includes('roiDeteriorating')) return 'costs'
    if (signals.includes('withdrawalsHigh') || signals.includes('withdrawalsWorsening'))
      return 'quality'
    return 'none'
  })()

  const line1 = (() => {
    if (limiter === 'conversion') {
      return isIt
        ? [kw('Conversione'), tx(' tra le più basse nel Top 20.')]
        : [kw('Conversion'), tx(' is among the lowest in the Top 20.')]
    }
    if (limiter === 'costs') {
      if (unitEconomics?.losingRatioLow) {
        return isIt
          ? [
              kw('ARPU'),
              tx(' soffre e il '),
              kw('Losing ratio'),
              tx(
                ' è sotto 50% (media ~75%): trader più profittevoli → meno margine per Bullwaves.'
              ),
            ]
          : [
              kw('ARPU'),
              tx(' is weak and '),
              kw('Losing ratio'),
              tx(
                ' is below 50% (avg ~75%): traders are more profitable → less margin for Bullwaves.'
              ),
            ]
      }
      return isIt
        ? [kw('ARPU'), tx(' non copre '), kw('CPA'), tx(': rischio payback.')]
        : [kw('ARPU'), tx(' does not cover '), kw('CPA'), tx(': payback risk.')]
    }
    if (limiter === 'quality') {
      const wPhrase = withdrawalsRankPhrase(withdrawalsRank, total, locale)
      return isIt
        ? [kw('Prelievi', 'warn'), tx(' '), ...(wPhrase ? [tx(wPhrase)] : [tx('alti')]), tx('.')]
        : [
            kw('Withdrawals', 'warn'),
            tx(' are '),
            ...(wPhrase ? [tx(wPhrase)] : [tx('high')]),
            tx('.'),
          ]
    }
    return isIt
      ? [kw('Conversione'), tx(' e '), kw('costi'), tx(' sono in equilibrio.')]
      : [kw('Conversion'), tx(' and '), kw('costs'), tx(' are in balance.')]
  })()

  const line2 = (() => {
    if (limiter === 'conversion') {
      return isIt
        ? [tx('Check: dove si rompe il '), kw('funnel'), tx(' (landing→registrazione→FTD).')]
        : [tx('Check: where the '), kw('funnel'), tx(' breaks (landing→signup→FTD).')]
    }
    if (limiter === 'costs') {
      if (unitEconomics?.losingRatioLow) {
        return isIt
          ? [
              tx('Azione: rivedi incentivi e targeting (evita '),
              kw('pro traders'),
              tx('), oppure passa a modelli più legati a '),
              kw('qualità'),
              tx('.'),
            ]
          : [
              tx('Action: revisit incentives/targeting (avoid '),
              kw('pro traders'),
              tx('), or shift to models tied to '),
              kw('quality'),
              tx('.'),
            ]
      }
      return isIt
        ? [
            tx('Azione: lavora su '),
            kw('retention'),
            tx(' (secondo deposito, riattivazioni) per alzare '),
            kw('ARPU'),
            tx('.'),
          ]
        : [
            tx('Action: improve '),
            kw('retention'),
            tx(' (second deposit, reactivation) to lift '),
            kw('ARPU'),
            tx('.'),
          ]
    }
    if (limiter === 'quality') {
      return isIt
        ? [tx('Prelievi alti riducono '), kw('net deposits'), tx(' e margine.')]
        : [tx('High withdrawals reduce '), kw('net deposits'), tx(' and margin.')]
    }
    return isIt
      ? pickVariant(
          'kpi.line2.neutral.it',
          [
            [tx('Monitora se cambia il mix al prossimo giro.')],
            [tx('Controlla se il mix si muove alla prossima lettura.')],
            [tx('Monitora se il mix cambia nel prossimo check.')],
          ],
          seed
        )
      : pickVariant(
          'kpi.line2.neutral.en',
          [
            [tx('Monitor whether the mix changes on the next read.')],
            [tx('Check whether the mix shifts next time.')],
            [tx('Monitor whether the mix changes at the next check.')],
          ],
          seed
        )
  })()

  const nextStep = (() => {
    if (limiter === 'conversion') {
      return isIt
        ? [
            tx('Next step: test su '),
            kw('offerta'),
            tx(', '),
            kw('creative'),
            tx(' e '),
            kw('landing'),
            tx(' prima di aumentare esposizione.'),
          ]
        : [
            tx('Next step: test '),
            kw('offer'),
            tx(', '),
            kw('creatives'),
            tx(' and '),
            kw('landing'),
            tx(' before increasing exposure.'),
          ]
    }
    if (limiter === 'costs') {
      return isIt
        ? [
            tx('Next step: riduci '),
            kw('CPA'),
            tx(' o aumenta '),
            kw('ARPU'),
            tx(' prima di spingere budget.'),
          ]
        : [
            tx('Next step: reduce '),
            kw('CPA'),
            tx(' or lift '),
            kw('ARPU'),
            tx(' before pushing spend.'),
          ]
    }
    if (limiter === 'quality') {
      return isIt
        ? [
            tx('Next step: verifica '),
            kw('prelievi'),
            tx(' e '),
            kw('qualità'),
            tx(' delle sorgenti.'),
          ]
        : [tx('Next step: review '), kw('withdrawals'), tx(' and '), kw('source quality'), tx('.')]
    }
    return isIt
      ? pickVariant(
          'kpi.next.neutral.it',
          [
            [tx('Next step: mantieni esposizione e ricontrolla al prossimo giro.')],
            [tx('Next step: mantieni esposizione e ricontrolla alla prossima lettura.')],
            [tx('Next step: mantieni esposizione e verifica di nuovo tra poco.')],
          ],
          seed
        )
      : pickVariant(
          'kpi.next.neutral.en',
          [
            [tx('Next step: maintain exposure and re-check on the next read.')],
            [tx('Next step: maintain exposure and review again next time.')],
            [tx('Next step: maintain exposure and validate on the next snapshot.')],
          ],
          seed
        )
  })()

  return {
    lines: [line1, line2],
    nextStep,
  }
}

const buildCohort = ({ locale, cohort }) => {
  const isIt = locale === 'it'
  const flag = String(cohort?.flag || '').toUpperCase()

  const meaning = (() => {
    if (flag === 'GREEN') {
      return isIt
        ? [
            tx(`${AFFILIATE_INSIGHT_TEMPLATES.it.marketSignalPrefix}: `),
            kw('retention solida'),
            tx('.'),
          ]
        : [
            tx(`${AFFILIATE_INSIGHT_TEMPLATES.en.marketSignalPrefix}: `),
            kw('retention holds'),
            tx('.'),
          ]
    }
    if (flag === 'ORANGE') {
      return isIt
        ? [
            tx(`${AFFILIATE_INSIGHT_TEMPLATES.it.marketSignalPrefix}: `),
            kw('retention mista'),
            tx('.'),
          ]
        : [
            tx(`${AFFILIATE_INSIGHT_TEMPLATES.en.marketSignalPrefix}: `),
            kw('retention is mixed'),
            tx('.'),
          ]
    }
    if (flag === 'RED') {
      return isIt
        ? [
            tx(`${AFFILIATE_INSIGHT_TEMPLATES.it.marketSignalPrefix}: `),
            kw('decadimento rapido', 'warn'),
            tx('.'),
          ]
        : [
            tx(`${AFFILIATE_INSIGHT_TEMPLATES.en.marketSignalPrefix}: `),
            kw('fast decay', 'warn'),
            tx('.'),
          ]
    }
    return isIt
      ? [
          tx(`${AFFILIATE_INSIGHT_TEMPLATES.it.marketSignalPrefix}: `),
          kw('non conclusivo'),
          tx('.'),
        ]
      : [tx(`${AFFILIATE_INSIGHT_TEMPLATES.en.marketSignalPrefix}: `), kw('inconclusive'), tx('.')]
  })()

  const nextCheck = isIt
    ? [tx('Next check: verifica se le azioni recenti migliorano '), kw('M1–M3'), tx('.')]
    : [tx('Next check: verify whether recent work lifts '), kw('M1–M3'), tx('.')]

  return { meaning, nextCheck }
}

const buildFinal = ({ locale, signals, importance, seed }) => {
  const isIt = locale === 'it'

  const verdict = (() => {
    if (signals.includes('financialDownside')) {
      return isIt
        ? [tx('Verdetto: '), kw('da correggere', 'risk'), tx('.')]
        : [tx('Verdict: '), kw('needs action', 'risk'), tx('.')]
    }
    if (signals.includes('withdrawalsHigh') || signals.includes('withdrawalsWorsening')) {
      return isIt
        ? [tx('Verdetto: '), kw('rischio qualità', 'warn'), tx('.')]
        : [tx('Verdict: '), kw('quality risk', 'warn'), tx('.')]
    }
    if (
      signals.includes('lowConversion') ||
      signals.includes('costAboveValue') ||
      signals.includes('roiDeteriorating')
    ) {
      return isIt
        ? [tx('Verdetto: '), kw('sotto pressione'), tx(' su conversione/costi.')]
        : [tx('Verdict: '), kw('under pressure'), tx(' on conversion/costs.')]
    }
    if (signals.includes('momentumUp') || signals.includes('roiImproving')) {
      return isIt
        ? [tx('Verdetto: '), kw('in miglioramento'), tx('.')]
        : [tx('Verdict: '), kw('improving'), tx('.')]
    }
    return isIt
      ? [tx('Verdetto: '), kw('stabile'), tx('.')]
      : [tx('Verdict: '), kw('stable'), tx('.')]
  })()

  const strengths = (() => {
    const out = []
    if (importance) {
      out.push(
        isIt
          ? [kw('Peso'), tx(' '), kw(importance), tx(' nel Top 20.')]
          : [kw('Weight'), tx(' '), kw(importance), tx(' within Top 20.')]
      )
    }
    if (signals.includes('momentumUp') || signals.includes('roiImproving')) {
      out.push(isIt ? [kw('Momentum'), tx(' positivo.')] : [kw('Momentum'), tx(' is positive.')])
    }
    if (!out.length) {
      out.push(
        isIt
          ? pickVariant(
              'final.strength.stable.it',
              [
                [kw('Stabilità'), tx('.')],
                [kw('Tenuta'), tx('.')],
                [kw('Regolarità'), tx('.')],
              ],
              seed
            )
          : pickVariant(
              'final.strength.stable.en',
              [
                [kw('Stability'), tx('.')],
                [kw('Steadiness'), tx('.')],
                [kw('Consistency'), tx('.')],
              ],
              seed
            )
      )
    }
    return out.slice(0, 2)
  })()

  const risk = (() => {
    if (signals.includes('financialDownside')) {
      return isIt
        ? [kw('Downside', 'risk'), tx(' finanziario.')]
        : [kw('Financial downside', 'risk'), tx('.')]
    }
    if (signals.includes('withdrawalsHigh') || signals.includes('withdrawalsWorsening')) {
      return isIt
        ? [kw('Prelievi', 'warn'), tx(' alti nel Top 20.')]
        : [kw('Withdrawals', 'warn'), tx(' are high in the Top 20.')]
    }
    if (signals.includes('lowConversion')) {
      return isIt
        ? [kw('Conversione'), tx(' bassa nel Top 20.')]
        : [kw('Conversion'), tx(' is low in the Top 20.')]
    }
    if (signals.includes('costAboveValue') || signals.includes('roiDeteriorating')) {
      return isIt ? [kw('Costi'), tx(' sopra il valore.')] : [kw('Costs'), tx(' are above value.')]
    }
    return null
  })()

  const action = (() => {
    if (signals.includes('financialDownside')) {
      return isIt
        ? [kw('Azione'), tx(': budget fermo, correggi costi e qualità.')]
        : [kw('Action'), tx(': hold spend flat, fix costs and quality.')]
    }
    if (signals.includes('withdrawalsHigh') || signals.includes('withdrawalsWorsening')) {
      return isIt
        ? [kw('Azione'), tx(': riduci esposizione e controlla prelievi/sorgenti.')]
        : [kw('Action'), tx(': reduce exposure and review withdrawals/sources.')]
    }
    if (signals.includes('lowConversion')) {
      return isIt
        ? [kw('Azione'), tx(': alza conversione prima di aumentare esposizione.')]
        : [kw('Action'), tx(': lift conversion before increasing exposure.')]
    }
    if (signals.includes('costAboveValue') || signals.includes('roiDeteriorating')) {
      return isIt
        ? [kw('Azione'), tx(': riduci CPA o alza ARPU prima di spingere budget.')]
        : [kw('Action'), tx(': reduce CPA or lift ARPU before pushing spend.')]
    }
    return isIt
      ? pickVariant(
          'final.action.neutral.it',
          [
            [kw('Azione'), tx(': mantieni esposizione e ricontrolla al prossimo giro.')],
            [kw('Azione'), tx(': mantieni esposizione e ricontrolla alla prossima lettura.')],
            [kw('Azione'), tx(': mantieni esposizione e verifica di nuovo tra poco.')],
          ],
          seed
        )
      : pickVariant(
          'final.action.neutral.en',
          [
            [kw('Action'), tx(': maintain exposure and re-check on the next read.')],
            [kw('Action'), tx(': maintain exposure and review again next time.')],
            [kw('Action'), tx(': maintain exposure and validate on the next snapshot.')],
          ],
          seed
        )
  })()

  return { verdict, strengths, risk, action }
}

/**
 * Pure deterministic engine.
 * Input must be precomputed from existing UI data (no data fetch inside).
 */
export function buildAffiliateInsights({
  metrics,
  ranks,
  deltas,
  shares,
  periodMeta,
  locale,
  cohort,
}) {
  const lang = normLocale(locale)
  const total = Number(ranks?.total || 20)

  const ndDir = deltas?.netDepositsDir || 'flat'
  const plDir = deltas?.plDir || 'flat'
  const roiDir = deltas?.roiDir || 'flat'
  const withdrawalsDir = deltas?.withdrawalsDir || 'flat'

  const cpa = Number(metrics?.cpa)
  const arpu = Number(metrics?.arpu)
  const cpaToArpu = Number.isFinite(cpa) && Number.isFinite(arpu) && arpu > 0 ? cpa / arpu : null

  const losingRatioPct = isNum(metrics?.losingRatioPct)
    ? Number(metrics?.losingRatioPct)
    : calcLosingRatioPct(metrics?.pl, metrics?.netDeposits)
  // Heuristic: <50% suggests stronger trading activity vs a ~75% typical level.
  const losingRatioLow = Number.isFinite(losingRatioPct) ? losingRatioPct < 50 : false

  const importance = weightPhrase({
    affiliateRank: ranks?.affiliateRank,
    shares,
    total,
    locale: lang,
  })

  const risk = riskSignals({
    netDeposits: metrics?.netDeposits,
    pl: metrics?.pl,
    roi: metrics?.roi,
    withdrawalsRank: ranks?.withdrawalsRank,
    total,
    withdrawalsDir,
  })

  const eff = efficiencyPressureSignals({
    crRank: ranks?.crRank,
    total,
    cpaToArpu,
    roiDir,
  })

  const scale = hasScaleImportance({ affiliateRank: ranks?.affiliateRank, shares })
    ? ['scaleImportant']
    : []
  const mom = momentumSignals({ ndDir, plDir, roiDir })
  const stab = stabilitySignals({ ndDir, plDir, roiDir })

  // Priority: Risk > Efficiency > Scale > Momentum/Stability
  const executiveSignals = dominantSignals([...risk, ...eff, ...scale, ...mom, ...stab])
  const kpiSignals = dominantSignals([...eff, ...risk, ...mom, ...stab])
  const finalSignals = dominantSignals([...risk, ...eff, ...mom, ...stab, ...scale])

  const seed = buildSeed({
    locale: lang,
    ranks,
    deltas,
    shares,
    cohort,
    signals: [...executiveSignals, ...kpiSignals, ...finalSignals],
  })

  const executive = buildExecutive({
    locale: lang,
    periodMeta,
    signals: executiveSignals,
    importance,
    limitingFactor: eff.includes('lowConversion') ? 'conversion' : null,
    unitEconomics: { losingRatioLow, losingRatioPct, cpaToArpu },
    seed,
  })

  const kpi = buildKpi({
    locale: lang,
    signals: kpiSignals,
    ranks,
    total,
    cpaToArpu,
    withdrawalsRank: ranks?.withdrawalsRank,
    unitEconomics: { losingRatioLow, losingRatioPct, cpaToArpu },
    seed,
  })

  const cohortBlock = buildCohort({ locale: lang, cohort })

  const final = buildFinal({ locale: lang, signals: finalSignals, importance, seed })

  return {
    executive,
    kpi,
    cohort: cohortBlock,
    final,
  }
}
