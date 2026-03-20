import React, { useEffect, useMemo, useRef, useState } from 'react'

import { withReportsVersion } from '../../../lib/fetchCache'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'
import { loadCreolabsClientsTable } from '../../creolabs/services/creolabsService'
import { useI18n } from '../../../i18n/I18nContext'

const UI_TEXT = {
  en: {
    title: 'Trustpilot Guide',
    subtitle:
      'Read-only mode: the tool suggests what to do for each review, without saving changes.',
    readOnlyBadge: 'READ-ONLY DECISION SUPPORT',
    publicBadge: 'PUBLIC SHARED VIEW',
    shareCta: 'Share (public link)',
    shareUnavailable: 'Public share is not available in this environment.',
    loadingGuide: 'Loading Trustpilot guide...',
    missingGuide:
      'Trustpilot guide not found. Run npm run generate:trustpilot-guidance to generate the read-only file.',
    metrics: {
      total: 'Total reviews',
      direct: 'Direct contact',
      publicReply: 'Public reply',
      noContact: 'No contact',
      manual: 'Manual review',
    },
    filter: {
      searchPlaceholder: 'Search review, user, issue, link...',
      action: {
        all: 'Action: all',
        direct_contact: 'Action: direct contact',
        public_reply: 'Action: public reply',
        no_contact: 'Action: no contact',
        manual_review: 'Action: manual review',
      },
      stars: {
        all: 'Stars: all',
        s5: 'Stars: 5',
        s4: 'Stars: 4',
        s3: 'Stars: 3',
        s2: 'Stars: 2',
        s1: 'Stars: 1',
        unknown: 'Stars: missing',
      },
      match: {
        all: 'Match: all',
        exact: 'Match: exact',
        candidate: 'Match: candidate',
        unmatched: 'Match: unmatched',
      },
      priority: {
        all: 'Priority: all',
        high: 'Priority: high',
        medium: 'Priority: medium',
        low: 'Priority: low',
      },
    },
    table: {
      line: '#',
      reviewer: 'Reviewer',
      stars: 'Stars',
      manager: 'Account manager',
      issue: 'Issue',
      match: 'Match',
      action: 'Action',
      priority: 'Priority',
    },
    labels: {
      action: {
        direct_contact: 'Direct contact',
        public_reply: 'Public reply',
        no_contact: 'No contact',
        manual_review: 'Manual review',
      },
      match: {
        exact: 'Exact',
        candidate: 'Candidate',
        unmatched: 'Unmatched',
      },
      priority: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      severity: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
    },
    detail: {
      review: 'Review #{line}',
      unknownReviewer: 'Unknown reviewer',
      summaryTitle: 'Review summary',
      summaryEmpty: 'No summary available.',
      followUpTitle: 'Follow-up tracking',
      followUpDone: 'Already followed up',
      followUpPending: 'Follow-up pending',
      assignedToTitle: 'Assigned to',
      statusTitle: 'Status',
      followUpNotesTitle: 'Follow-up notes',
      followUpNotesEmpty: 'No follow-up notes yet.',
      flowTitle: 'Execution flow',
      flowDone: 'Completed',
      flowCurrent: 'In progress',
      flowPending: 'To do',
      flowStepIntake: 'Review intake and triage',
      flowStepIdentity: 'Identity and risk validation',
      flowStepAction: 'Execute recommended action',
      flowStepFollowup: 'Register follow-up outcome',
      reasonTitle: 'Why this action',
      reasonEmpty: 'n/a',
      templateTitle: 'Suggested template',
      templateEmpty: 'Template not available.',
      checklistTitle: 'Operational checklist',
      candidateUsersTitle: 'Candidate users',
      internalProfilesTitle: 'Internal profiles',
      internalProfilesHint: 'Open the Creolabs profile in modal without leaving this section.',
      openProfile: 'Open profile: {userId}',
      tradingContextTitle: 'Trading context (read-only)',
      tradingContextMeta: 'User: {user} | MT5: {mt5} | Net deposits: {netDeposits}',
      openTrustpilot: 'Open review on Trustpilot',
      noRows: 'No review matches active filters.',
      noChecklist: 'No checklist available.',
    },
    template: {
      template_manual_review_hold:
        'Thanks for the feedback. The case is under review by the dedicated team, we will update you shortly.',
      template_direct_recovery:
        'We are sorry for the experience. We contacted you privately to handle the case quickly and safely.',
      template_direct_followup:
        'Thanks for the report. We will contact you directly to provide personalized support.',
      template_positive_ack:
        'Thanks for the positive review, your feedback is very important to us.',
      template_public_recovery:
        'We are sorry for the situation. Please contact us privately through the verified support channel so we can help right away.',
      template_public_standard:
        'Thanks for the feedback. Our support team is available to review the case securely.',
      contactSuffix: 'Reference contacts: WhatsApp support | support email | live chat.',
    },
    footerReadOnly: 'View generated from CSV: no changes are saved in this tool.',
    modal: {
      title: 'Creolabs client profile',
      userId: 'User ID: {userId}',
      close: 'Close',
      loading: 'Loading Creolabs profile...',
      loadError: 'Error while loading Creolabs data.',
      sections: {
        summary: 'Overview',
        identity: 'Client identity',
        totals: 'Aggregated totals',
        timeline: 'Period timeline',
      },
      summary: {
        confidence: 'Match confidence',
        periods: 'Periods covered',
        rating: 'Selected rating',
        lowest: 'lowest',
        inactivityDays: 'Inactivity days',
        score: 'Match score',
      },
      creolabs: {
        noData: 'No Creolabs data available.',
        noMatch: 'No match found in Creolabs clients table.',
        lowPrecision: 'Creolabs match exists but is not precise enough.',
        unavailable: 'Creolabs data unavailable or not generated yet.',
        clientId: 'Client ID',
        clientLogin: 'Client Login',
        clientName: 'Client Name',
        affiliateId: 'Affiliate ID',
        manager: 'Manager',
        country: 'Country',
        brand: 'Brand',
        lastPeriod: 'Latest period',
        totDeposit: 'Total deposit',
        totWithdrawals: 'Total withdrawals',
        totNet: 'Total net',
        totPl: 'Total P/L',
        totTrades: 'Total trades',
        criteria: 'Match criteria: {reasons} | Score: {score}',
        period: 'Period',
        deposit: 'Deposit',
        withdrawals: 'Withdrawals',
        net: 'Net',
        pl: 'P/L',
        trades: 'Trades',
      },
      timeline: {
        empty: 'No period rows available for this client.',
      },
      matchesFound: 'Rows matched in Creolabs: {count}.',
      notAvailable: 'N/A',
      noValue: '—',
      noConfidence: 'NO',
    },
  },
  it: {
    title: 'Guida Trustpilot',
    subtitle:
      'Modalita sola lettura: il tool suggerisce cosa fare su ogni review, senza salvare modifiche.',
    readOnlyBadge: 'SUPPORTO DECISIONALE IN SOLA LETTURA',
    publicBadge: 'VISTA PUBBLICA CONDIVISA',
    shareCta: 'Condividi (link pubblico)',
    shareUnavailable: 'Condivisione pubblica non disponibile in questo ambiente.',
    loadingGuide: 'Caricamento guida Trustpilot...',
    missingGuide:
      'Guida Trustpilot non trovata. Esegui npm run generate:trustpilot-guidance per generare il file read-only.',
    metrics: {
      total: 'Review totali',
      direct: 'Contatto diretto',
      publicReply: 'Risposta pubblica',
      noContact: 'No contatto',
      manual: 'Revisione manuale',
    },
    filter: {
      searchPlaceholder: 'Cerca review, utente, issue, link...',
      action: {
        all: 'Azione: tutte',
        direct_contact: 'Azione: contatto diretto',
        public_reply: 'Azione: risposta pubblica',
        no_contact: 'Azione: no contatto',
        manual_review: 'Azione: revisione manuale',
      },
      stars: {
        all: 'Stars: tutte',
        s5: 'Stars: 5',
        s4: 'Stars: 4',
        s3: 'Stars: 3',
        s2: 'Stars: 2',
        s1: 'Stars: 1',
        unknown: 'Stars: mancanti',
      },
      match: {
        all: 'Match: tutti',
        exact: 'Match: preciso',
        candidate: 'Match: candidato',
        unmatched: 'Match: non associato',
      },
      priority: {
        all: 'Priorita: tutte',
        high: 'Priorita: alta',
        medium: 'Priorita: media',
        low: 'Priorita: bassa',
      },
    },
    table: {
      line: '#',
      reviewer: 'Reviewer',
      stars: 'Stars',
      manager: 'Account manager',
      issue: 'Issue',
      match: 'Match',
      action: 'Azione',
      priority: 'Priorita',
    },
    labels: {
      action: {
        direct_contact: 'Contatto diretto',
        public_reply: 'Risposta pubblica',
        no_contact: 'Nessun contatto',
        manual_review: 'Revisione manuale',
      },
      match: {
        exact: 'Preciso',
        candidate: 'Candidato',
        unmatched: 'Non associato',
      },
      priority: {
        high: 'Alta',
        medium: 'Media',
        low: 'Bassa',
      },
      severity: {
        high: 'Alta',
        medium: 'Media',
        low: 'Bassa',
      },
    },
    detail: {
      review: 'Review #{line}',
      unknownReviewer: 'Reviewer sconosciuto',
      summaryTitle: 'Sintesi review',
      summaryEmpty: 'Nessuna sintesi disponibile.',
      followUpTitle: 'Tracciamento follow-up',
      followUpDone: 'Follow-up gia gestito',
      followUpPending: 'Follow-up da gestire',
      assignedToTitle: 'Assegnato a',
      statusTitle: 'Stato',
      followUpNotesTitle: 'Note follow-up',
      followUpNotesEmpty: 'Nessuna nota follow-up disponibile.',
      flowTitle: 'Flusso operativo',
      flowDone: 'Completato',
      flowCurrent: 'In corso',
      flowPending: 'Da fare',
      flowStepIntake: 'Presa in carico e triage review',
      flowStepIdentity: 'Validazione identita e rischio',
      flowStepAction: 'Esecuzione azione raccomandata',
      flowStepFollowup: 'Registrazione esito follow-up',
      reasonTitle: 'Perche questa azione',
      reasonEmpty: 'n/a',
      templateTitle: 'Template suggerito',
      templateEmpty: 'Template non disponibile.',
      checklistTitle: 'Checklist operativa',
      candidateUsersTitle: 'Utenti candidati',
      internalProfilesTitle: 'Profili interni',
      internalProfilesHint: 'Apri il profilo Creolabs in modale senza cambiare sezione.',
      openProfile: 'Apri profilo: {userId}',
      tradingContextTitle: 'Contesto trading (sola lettura)',
      tradingContextMeta: 'Utente: {user} | MT5: {mt5} | Depositi netti: {netDeposits}',
      openTrustpilot: 'Apri review su Trustpilot',
      noRows: 'Nessuna review corrisponde ai filtri attivi.',
      noChecklist: 'Nessuna checklist disponibile.',
    },
    template: {
      template_manual_review_hold:
        'Grazie per il feedback. Il caso e in verifica con il team dedicato, ti aggiorniamo appena possibile.',
      template_direct_recovery:
        "Ci dispiace per l'esperienza. Ti abbiamo contattato in privato per gestire il caso in modo rapido e sicuro.",
      template_direct_followup:
        'Grazie per la segnalazione. Ti contattiamo direttamente per darti supporto personalizzato.',
      template_positive_ack:
        'Grazie per la recensione positiva, il tuo feedback e molto importante per noi.',
      template_public_recovery:
        'Ci dispiace per la situazione. Scrivici in privato tramite il canale supporto verificato cosi possiamo aiutarti subito.',
      template_public_standard:
        'Grazie per il feedback. Il nostro team supporto e disponibile per approfondire il caso in modo sicuro.',
      contactSuffix: 'Contatti di riferimento: supporto WhatsApp | email supporto | live chat.',
    },
    footerReadOnly: 'Vista generata da CSV: nessuna modifica viene salvata in questo tool.',
    modal: {
      title: 'Profilo cliente Creolabs',
      userId: 'User ID: {userId}',
      close: 'Chiudi',
      loading: 'Caricamento profilo Creolabs...',
      loadError: 'Errore nel caricamento dati Creolabs.',
      sections: {
        summary: 'Panoramica',
        identity: 'Identita cliente',
        totals: 'Totali aggregati',
        timeline: 'Timeline periodi',
      },
      summary: {
        confidence: 'Confidenza match',
        periods: 'Periodi coperti',
        rating: 'Rating selezionato',
        lowest: 'piu basso',
        inactivityDays: 'Giorni di inattivita',
        score: 'Punteggio match',
      },
      creolabs: {
        noData: 'Nessun dato Creolabs disponibile.',
        noMatch: 'Nessun match trovato nel clients table Creolabs.',
        lowPrecision: 'Match Creolabs presente ma non abbastanza preciso.',
        unavailable: 'Creolabs non disponibile o non ancora generato.',
        clientId: 'Client ID',
        clientLogin: 'Client Login',
        clientName: 'Client Name',
        affiliateId: 'Affiliate ID',
        manager: 'Manager',
        country: 'Country',
        brand: 'Brand',
        lastPeriod: 'Ultimo periodo',
        totDeposit: 'Tot deposit',
        totWithdrawals: 'Tot withdrawals',
        totNet: 'Tot net',
        totPl: 'Tot P/L',
        totTrades: 'Tot trades',
        criteria: 'Criteri match: {reasons} | Score: {score}',
        period: 'Periodo',
        deposit: 'Deposit',
        withdrawals: 'Withdrawals',
        net: 'Net',
        pl: 'P/L',
        trades: 'Trades',
      },
      timeline: {
        empty: 'Nessuna riga periodale disponibile per questo cliente.',
      },
      matchesFound: 'Righe Creolabs trovate: {count}.',
      notAvailable: 'N/A',
      noValue: '—',
      noConfidence: 'NO',
    },
  },
}

function badgeStyle(kind, value) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.01em',
    textTransform: 'uppercase',
  }

  if (kind === 'priority') {
    if (value === 'high') return { ...base, background: '#3f1d1d', color: '#fca5a5' }
    if (value === 'medium') return { ...base, background: '#3a2b14', color: '#fcd34d' }
    return { ...base, background: '#1f2937', color: '#93c5fd' }
  }

  if (kind === 'match') {
    if (value === 'exact') return { ...base, background: '#102a1b', color: '#86efac' }
    if (value === 'candidate') return { ...base, background: '#2e2212', color: '#fcd34d' }
    return { ...base, background: '#2b1b1b', color: '#fca5a5' }
  }

  if (kind === 'action') {
    if (value === 'direct_contact') return { ...base, background: '#0f2540', color: '#93c5fd' }
    if (value === 'public_reply') return { ...base, background: '#1f2937', color: '#cbd5e1' }
    if (value === 'manual_review') return { ...base, background: '#3a1616', color: '#fca5a5' }
    return { ...base, background: '#213126', color: '#86efac' }
  }

  return base
}

function rowMatches(row, query) {
  if (!query) return true
  const q = query.toLowerCase()
  const bag = [
    row.reviewerName,
    row.reviewSummary,
    row.issueType,
    row.category,
    row.assignedTo,
    row.trustpilotLink,
    row.matchedUserIds?.join(' '),
    row.recommendedAction,
    row.accountManager,
  ]
    .join(' ')
    .toLowerCase()
  return bag.includes(q)
}

function normalizeStarRating(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!raw) return ''
  const m = raw.match(/\d(?:[\.,]\d+)?/)
  if (!m) return ''
  const parsed = Number(String(m[0]).replace(',', '.'))
  if (!Number.isFinite(parsed)) return ''
  const rounded = Math.round(parsed)
  if (rounded < 1 || rounded > 5) return ''
  return String(rounded)
}

function formatRatingStars(starValue, txt) {
  const normalized = normalizeStarRating(starValue)
  if (!normalized) return txt.modal.notAvailable
  const value = Number(normalized)
  const full = '★'.repeat(value)
  const empty = '☆'.repeat(Math.max(0, 5 - value))
  const lowestTag = value === 1 ? ` - ${txt.modal.summary.lowest}` : ''
  return `${full}${empty} (${value}/5${lowestTag})`
}

function hasFollowUpDone(statusValue, notesValue) {
  const notes = String(notesValue || '').trim()
  if (notes) return true
  const status = String(statusValue || '')
    .toLowerCase()
    .trim()
  if (!status) return false
  const hints = [
    'reviewed',
    'replied',
    'resolved',
    'done',
    'completed',
    'closed',
    'risposto',
    'chiuso',
    'completato',
    'gestito',
  ]
  return hints.some((hint) => status.includes(hint))
}

function managerFromCreolabsRow(row) {
  const manager = String(row?.user || row?.manager || '').trim()
  if (!manager || manager === '—') return ''
  return manager
}

function addManagerCandidate(map, key, row) {
  if (!key) return
  const manager = managerFromCreolabsRow(row)
  if (!manager) return
  const entry = {
    manager,
    periodScore: parseCreolabsPeriodScore(row?.periodId),
  }
  const prev = map.get(key)
  if (prev) {
    prev.push(entry)
    return
  }
  map.set(key, [entry])
}

function pickBestManager(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return ''
  const sorted = candidates
    .filter((x) => x?.manager)
    .sort((a, b) => (b?.periodScore || -1) - (a?.periodScore || -1))
  return String(sorted[0]?.manager || '').trim()
}

function buildCreolabsManagerLookup(sourceRows) {
  const byClientId = new Map()
  const byLogin = new Map()
  const byName = new Map()

  for (const row of sourceRows || []) {
    addManagerCandidate(byClientId, normalizeDigits(row?.clientId), row)
    for (const token of extractLoginTokens(row?.clientLogin))
      addManagerCandidate(byLogin, token, row)
    addManagerCandidate(byName, normalizeNameKey(row?.clientName), row)
  }

  return { byClientId, byLogin, byName }
}

function resolveAccountManagerForGuideRow(row, managerLookup) {
  if (!row || !managerLookup) return ''

  const pool = []
  const candidateIds = []
  if (Array.isArray(row.matchedUserIds)) {
    for (const id of row.matchedUserIds) candidateIds.push(String(id || '').trim())
  }
  const tradingUserId = String(row?.tradingContext?.userid || '').trim()
  if (tradingUserId) candidateIds.push(tradingUserId)

  for (const candidate of candidateIds) {
    const digits = normalizeDigits(candidate)
    if (!digits) continue
    pool.push(...(managerLookup.byClientId.get(digits) || []))
    pool.push(...(managerLookup.byLogin.get(digits) || []))
  }

  const reviewerKey = normalizeNameKey(row?.reviewerName)
  if (reviewerKey) pool.push(...(managerLookup.byName.get(reviewerKey) || []))

  return pickBestManager(pool)
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D+/g, '')
}

const CREOLABS_MONTH_MAP = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
}

function parseCreolabsPeriodScore(periodId) {
  const raw = String(periodId || '').trim()
  const m = raw.match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!m) return -1
  const year = Number(m[1])
  const month = CREOLABS_MONTH_MAP[m[2]] || 0
  if (!Number.isFinite(year) || !Number.isFinite(month) || month <= 0) return -1
  return year * 100 + month
}

function parseCreolabsPeriodBounds(periodId) {
  const raw = String(periodId || '').trim()
  const m = raw.match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = CREOLABS_MONTH_MAP[m[2]] || 0
  if (!Number.isFinite(year) || !Number.isFinite(month) || month <= 0) return null

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return null

  return { start, end }
}

function computeInactivityDays(periodId) {
  const bounds = parseCreolabsPeriodBounds(periodId)
  if (!bounds?.end) return null
  const now = new Date()
  const diff = now.getTime() - bounds.end.getTime()
  if (!Number.isFinite(diff)) return null
  if (diff <= 0) return 0
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

function normalizeNameKey(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function extractLoginTokens(value) {
  return String(value || '')
    .split(/[|,;/\s]+/)
    .map((x) => normalizeDigits(x))
    .filter(Boolean)
}

function toNum(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function addMapRow(map, key, row) {
  if (!key) return
  const prev = map.get(key)
  if (prev) {
    prev.push(row)
    return
  }
  map.set(key, [row])
}

function formatNumber(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return '—'
  const parsed = Number(raw.replace(/,/g, ''))
  if (!Number.isFinite(parsed)) return raw
  return parsed.toLocaleString('it-IT', { maximumFractionDigits: 2 })
}

function computeCreolabsRowScore(row, { targetDigits, targetNameKey }) {
  let score = 0
  const reasons = []
  const rowClientIdDigits = normalizeDigits(row?.clientId)
  const rowNameKey = normalizeNameKey(row?.clientName)
  const loginTokens = extractLoginTokens(row?.clientLogin)

  if (targetDigits && rowClientIdDigits && rowClientIdDigits === targetDigits) {
    score += 120
    reasons.push('clientId')
  }

  if (targetDigits && loginTokens.includes(targetDigits)) {
    score += 90
    reasons.push('login')
  }

  if (targetNameKey && rowNameKey && rowNameKey === targetNameKey) {
    score += 45
    reasons.push('nameExact')
  } else if (
    targetNameKey &&
    rowNameKey &&
    (rowNameKey.includes(targetNameKey) || targetNameKey.includes(rowNameKey))
  ) {
    score += 25
    reasons.push('namePartial')
  }

  return { score, reasons }
}

function aggregateCreolabsMatches(matches) {
  if (!Array.isArray(matches) || !matches.length) return null

  const grouped = new Map()
  for (const item of matches) {
    const row = item.row || {}
    const identityKey =
      normalizeDigits(row.clientId) ||
      extractLoginTokens(row.clientLogin)[0] ||
      normalizeNameKey(row.clientName) ||
      `${row.clientName || 'row'}|${row.periodId || 'n/a'}`

    const prev = grouped.get(identityKey)
    if (!prev) {
      grouped.set(identityKey, {
        rows: [row],
        bestScore: item.score,
        reasons: new Set(item.reasons || []),
      })
      continue
    }

    prev.rows.push(row)
    prev.bestScore = Math.max(prev.bestScore, item.score)
    for (const r of item.reasons || []) prev.reasons.add(r)
  }

  const groups = Array.from(grouped.values())
  groups.sort((a, b) => b.bestScore - a.bestScore)
  const best = groups[0]
  if (!best) return null

  const rows = best.rows
  const periodSet = new Set()

  const timeline = rows
    .map((row) => {
      const period = String(row?.periodId || '').trim() || '—'
      periodSet.add(period)
      return {
        period,
        periodScore: parseCreolabsPeriodScore(period),
        deposit: toNum(row?.deposit),
        wd: toNum(row?.wd),
        net: toNum(row?.net),
        pl: toNum(row?.pl),
        trades: toNum(row?.trades),
        commission: toNum(row?.commission),
        sourceRow: row,
      }
    })
    .sort((a, b) => b.periodScore - a.periodScore)

  const latestRow = timeline[0]?.sourceRow || rows[0] || null

  const totals = {
    deposit: 0,
    wd: 0,
    net: 0,
    pl: 0,
    trades: 0,
    commission: 0,
  }

  for (const row of rows) {
    totals.deposit += toNum(row?.deposit)
    totals.wd += toNum(row?.wd)
    totals.net += toNum(row?.net)
    totals.pl += toNum(row?.pl)
    totals.trades += toNum(row?.trades)
    totals.commission += toNum(row?.commission)
  }

  let confidence = 'low'
  if (best.bestScore >= 120) confidence = 'high'
  else if (best.bestScore >= 80) confidence = 'medium'

  return {
    found: true,
    confidence,
    score: best.bestScore,
    reasons: Array.from(best.reasons.values()),
    candidates: groups.length,
    periods: periodSet.size,
    rowsMatched: rows.length,
    latestPeriod: latestRow?.periodId || '—',
    inactivityDays: computeInactivityDays(latestRow?.periodId),
    identity: {
      clientId: latestRow?.clientId || '—',
      clientLogin: latestRow?.clientLogin || '—',
      clientName: latestRow?.clientName || '—',
      affiliateId: latestRow?.affiliateId || '—',
      user: latestRow?.user || '—',
      country: latestRow?.country || '—',
      brand: latestRow?.brand || '—',
    },
    totals,
    timeline: timeline.map((item) => ({
      period: item.period,
      deposit: item.deposit,
      wd: item.wd,
      net: item.net,
      pl: item.pl,
      trades: item.trades,
      commission: item.commission,
    })),
  }
}

export default function TrustpilotGuidePage({ publicMode = false, sharePayload = null }) {
  const { locale } = useI18n()
  const txt = UI_TEXT[locale] || UI_TEXT.en

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guide, setGuide] = useState({ rows: [], summary: null })
  const [accountManagerByLine, setAccountManagerByLine] = useState({})
  const [selectedLine, setSelectedLine] = useState(null)

  const [actionFilter, setActionFilter] = useState('all')
  const [starsFilter, setStarsFilter] = useState('all')
  const [matchFilter, setMatchFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [query, setQuery] = useState('')

  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileTargetUserId, setProfileTargetUserId] = useState('')
  const [profileData, setProfileData] = useState(null)
  const profileRequestRef = useRef(0)
  const creolabsIndexRef = useRef(null)

  const actionLabel = (value) => txt.labels.action?.[value] || value || txt.modal.noValue
  const matchLabel = (value) => txt.labels.match?.[value] || value || txt.modal.noValue
  const priorityLabel = (value) => txt.labels.priority?.[value] || value || txt.modal.noValue
  const severityLabel = (value) => txt.labels.severity?.[value] || value || txt.modal.notAvailable
  const templateText = (templateKey) => {
    const base = txt.template?.[templateKey] || txt.detail.templateEmpty
    if (!base || base === txt.detail.templateEmpty) return base
    const suffix = String(txt.template?.contactSuffix || '').trim()
    return suffix ? `${base} ${suffix}` : base
  }

  useEffect(() => {
    let mounted = true

    async function loadGuide() {
      setLoading(true)
      setError('')

      if (publicMode && sharePayload && sharePayload.k === 'tpguide') {
        const sharedRows = Array.isArray(sharePayload.rows) ? sharePayload.rows : []
        if (!mounted) return
        setGuide({ rows: sharedRows, summary: sharePayload.summary || null })
        setSelectedLine(sharedRows[0]?.reviewLine || null)
        setLoading(false)
        return
      }

      try {
        const url = withReportsVersion('/trustpilot_guidance.json')
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!mounted) return
        const rows = Array.isArray(data?.rows) ? data.rows : []
        setGuide({ rows, summary: data?.summary || null })
        setSelectedLine(rows[0]?.reviewLine || null)
      } catch (e) {
        if (!mounted) return
        setError('missingGuide')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadGuide()
    return () => {
      mounted = false
    }
  }, [publicMode, sharePayload, txt.missingGuide])

  const rows = guide.rows || []

  useEffect(() => {
    let mounted = true

    async function loadAccountManagers() {
      if (!rows.length) {
        if (mounted) setAccountManagerByLine({})
        return
      }

      const alreadyEnriched = rows.every((row) => String(row?.accountManager || '').trim())
      if (alreadyEnriched) {
        if (mounted) {
          const next = {}
          for (const row of rows) {
            next[row.reviewLine] = String(row.accountManager || '').trim()
          }
          setAccountManagerByLine(next)
        }
        return
      }

      try {
        const payload = await loadCreolabsClientsTable({ force: false })
        const sourceRows = Array.isArray(payload?.rows) ? payload.rows : []
        const lookup = buildCreolabsManagerLookup(sourceRows)

        const resolved = {}
        for (const row of rows) {
          const embedded = String(row?.accountManager || '').trim()
          if (embedded) {
            resolved[row.reviewLine] = embedded
            continue
          }
          resolved[row.reviewLine] = resolveAccountManagerForGuideRow(row, lookup)
        }
        if (mounted) setAccountManagerByLine(resolved)
      } catch {
        if (mounted) setAccountManagerByLine({})
      }
    }

    loadAccountManagers()
    return () => {
      mounted = false
    }
  }, [rows])

  const rowsWithManagers = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        accountManager:
          String(row?.accountManager || '').trim() ||
          String(accountManagerByLine?.[row.reviewLine] || '').trim(),
      })),
    [rows, accountManagerByLine]
  )

  const filteredRows = useMemo(() => {
    return rowsWithManagers.filter((r) => {
      if (actionFilter !== 'all' && r.recommendedAction !== actionFilter) return false
      const normalizedStars = normalizeStarRating(r.starRating)
      if (starsFilter === 'unknown' && normalizedStars) return false
      if (starsFilter !== 'all' && starsFilter !== 'unknown' && normalizedStars !== starsFilter)
        return false
      if (matchFilter !== 'all' && r.matchStatus !== matchFilter) return false
      if (priorityFilter !== 'all' && r.priorityLevel !== priorityFilter) return false
      if (!rowMatches(r, query)) return false
      return true
    })
  }, [rowsWithManagers, actionFilter, starsFilter, matchFilter, priorityFilter, query])

  const selected = useMemo(() => {
    const fromFiltered = filteredRows.find((r) => r.reviewLine === selectedLine)
    return fromFiltered || filteredRows[0] || null
  }, [filteredRows, selectedLine])

  const selectedFollowUp = useMemo(() => {
    const followUpNotes = String(selected?.followupNotes || '').trim()
    const followUpStatus = String(selected?.status || '').trim()
    const assignedTo = String(selected?.assignedTo || '').trim()
    const hasFollowUp = hasFollowUpDone(followUpStatus, followUpNotes)
    return {
      followUpNotes,
      followUpStatus,
      assignedTo,
      hasFollowUp,
    }
  }, [selected])

  const selectedUserIds = useMemo(() => {
    if (!selected) return []
    const ids = Array.isArray(selected.matchedUserIds)
      ? selected.matchedUserIds.map((id) => String(id || '').trim()).filter(Boolean)
      : []
    return ids
  }, [selected])

  const profileCandidateIds = useMemo(() => {
    const ids = [...selectedUserIds]
    const tradingUserId = String(selected?.tradingContext?.userid || '').trim()
    if (tradingUserId) ids.push(tradingUserId)
    return Array.from(new Set(ids.filter(Boolean)))
  }, [selectedUserIds, selected?.tradingContext?.userid])

  useEffect(() => {
    if (!profileModalOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileModalOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [profileModalOpen])

  async function openProfileModal(userId) {
    const normalizedUserId = String(userId || '').trim()
    if (!normalizedUserId) return

    const reqId = Date.now()
    profileRequestRef.current = reqId
    setProfileModalOpen(true)
    setProfileLoading(true)
    setProfileError('')
    setProfileTargetUserId(normalizedUserId)
    setProfileData(null)

    try {
      const targetUserIdDigits = normalizeDigits(normalizedUserId)
      const targetNameKey = normalizeNameKey(normalizedUserId)

      async function ensureCreolabsIndex() {
        if (creolabsIndexRef.current) return creolabsIndexRef.current
        const payload = await loadCreolabsClientsTable({ force: false })
        const sourceRows = Array.isArray(payload?.rows) ? payload.rows : []

        const byClientId = new Map()
        const byLogin = new Map()
        const byName = new Map()

        for (const row of sourceRows) {
          addMapRow(byClientId, normalizeDigits(row?.clientId), row)
          const nameKey = normalizeNameKey(row?.clientName)
          if (nameKey) addMapRow(byName, nameKey, row)
          const loginTokens = extractLoginTokens(row?.clientLogin)
          for (const token of loginTokens) addMapRow(byLogin, token, row)
        }

        creolabsIndexRef.current = { byClientId, byLogin, byName }
        return creolabsIndexRef.current
      }

      async function resolveCreolabsMatch() {
        try {
          const lookup = await ensureCreolabsIndex()
          const pool = new Map()
          const pushRows = (rows) => {
            for (const row of rows || []) {
              if (!row || typeof row !== 'object') continue
              const key = `${row.periodId || ''}|${row.clientId || ''}|${row.clientLogin || ''}`
              pool.set(key, row)
            }
          }

          if (targetUserIdDigits) pushRows(lookup.byClientId.get(targetUserIdDigits))
          if (targetUserIdDigits) pushRows(lookup.byLogin.get(targetUserIdDigits))
          if (targetNameKey) pushRows(lookup.byName.get(targetNameKey))

          const candidates = Array.from(pool.values())
          if (!candidates.length) {
            return {
              found: false,
              message: txt.modal.creolabs.noMatch,
            }
          }

          const scored = candidates
            .map((row) => {
              const scoredRow = computeCreolabsRowScore(row, {
                targetDigits: targetUserIdDigits,
                targetNameKey,
              })
              return { row, ...scoredRow }
            })
            .filter((item) => item.score > 0)

          if (!scored.length) {
            return {
              found: false,
              message: txt.modal.creolabs.lowPrecision,
            }
          }

          return aggregateCreolabsMatches(scored)
        } catch (e) {
          return {
            found: false,
            message: txt.modal.creolabs.unavailable,
          }
        }
      }

      const creolabs = await resolveCreolabsMatch()

      if (profileRequestRef.current !== reqId) return

      setProfileData({
        queryUserId: normalizedUserId,
        queryDigits: targetUserIdDigits,
        creolabs,
      })
    } catch (e) {
      if (profileRequestRef.current !== reqId) return
      setProfileError(txt.modal.loadError)
    } finally {
      if (profileRequestRef.current === reqId) {
        setProfileLoading(false)
      }
    }
  }

  const summary = guide.summary || {
    total: rowsWithManagers.length,
    byMatchStatus: { exact: 0, candidate: 0, unmatched: 0 },
    byPriority: { high: 0, medium: 0, low: 0 },
    byRecommendedAction: {
      direct_contact: 0,
      public_reply: 0,
      no_contact: 0,
      manual_review: 0,
    },
  }

  async function createPublicLink() {
    if (publicMode) return

    const payload = {
      k: 'tpguide',
      v: 1,
      generatedAt: new Date().toISOString(),
      rows: rowsWithManagers,
      summary,
    }

    const shareOrigin = getPublicShareOrigin()
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(runtimeOrigin)

    let token = ''
    try {
      const resp = await fetch('/api/share/create-trustpilot-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const data = await resp.json().catch(() => null)
      if (resp.ok && data?.ok && data?.token) token = String(data.token)
      else throw new Error(data?.error || data?.message || 'share-not-available')
    } catch {
      if (!isLocalhost) {
        window.alert(txt.shareUnavailable)
        return
      }

      try {
        const bytes = new Uint8Array(12)
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues)
          window.crypto.getRandomValues(bytes)
        token = `share_local_${Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`
      } catch {
        token = `share_local_${Math.random().toString(16).slice(2)}`
      }

      try {
        window.localStorage.setItem(
          `bw_share_trustpilot_guide:${token}`,
          JSON.stringify({ payload })
        )
      } catch {
        // ignore
      }
    }

    const isKvToken = token.startsWith('share_') && !token.startsWith('share_local_')
    const href = isKvToken
      ? `${shareOrigin}/s/${encodeURIComponent(token)}`
      : `${shareOrigin}/share/trustpilot-guide/${encodeURIComponent(token)}`

    try {
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          border: '1px solid #1f2937',
          borderRadius: 12,
          background: '#0b1220',
          padding: 14,
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: 20 }}>{txt.title}</h2>
            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>{txt.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700 }}>
              {publicMode ? txt.publicBadge : txt.readOnlyBadge}
            </div>
            {!publicMode ? (
              <button
                type="button"
                onClick={createPublicLink}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 12,
                  background: 'rgba(59,130,246,0.14)',
                  border: '1px solid rgba(59,130,246,0.30)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {txt.shareCta}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? <div style={{ color: '#cbd5e1' }}>{txt.loadingGuide}</div> : null}

      {!loading && error ? (
        <div
          style={{
            border: '1px solid #7f1d1d',
            borderRadius: 10,
            background: '#2a1212',
            padding: 12,
            color: '#fecaca',
          }}
        >
          {error === 'missingGuide' ? txt.missingGuide : error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            <MetricCard title={txt.metrics.total} value={summary.total} color="#93c5fd" />
            <MetricCard
              title={txt.metrics.direct}
              value={summary.byRecommendedAction.direct_contact}
              color="#60a5fa"
            />
            <MetricCard
              title={txt.metrics.publicReply}
              value={summary.byRecommendedAction.public_reply}
              color="#cbd5e1"
            />
            <MetricCard
              title={txt.metrics.noContact}
              value={summary.byRecommendedAction.no_contact}
              color="#86efac"
            />
            <MetricCard
              title={txt.metrics.manual}
              value={summary.byRecommendedAction.manual_review}
              color="#fca5a5"
            />
          </div>

          <div
            style={{
              border: '1px solid #1f2937',
              borderRadius: 12,
              padding: 10,
              display: 'grid',
              gap: 8,
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={txt.filter.searchPlaceholder}
              style={{
                background: '#0b1220',
                color: '#e5e7eb',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            />
            <SelectFilter
              value={actionFilter}
              onChange={setActionFilter}
              options={[
                ['all', txt.filter.action.all],
                ['direct_contact', txt.filter.action.direct_contact],
                ['public_reply', txt.filter.action.public_reply],
                ['no_contact', txt.filter.action.no_contact],
                ['manual_review', txt.filter.action.manual_review],
              ]}
            />
            <SelectFilter
              value={starsFilter}
              onChange={setStarsFilter}
              options={[
                ['all', txt.filter.stars.all],
                ['5', txt.filter.stars.s5],
                ['4', txt.filter.stars.s4],
                ['3', txt.filter.stars.s3],
                ['2', txt.filter.stars.s2],
                ['1', txt.filter.stars.s1],
                ['unknown', txt.filter.stars.unknown],
              ]}
            />
            <SelectFilter
              value={matchFilter}
              onChange={setMatchFilter}
              options={[
                ['all', txt.filter.match.all],
                ['exact', txt.filter.match.exact],
                ['candidate', txt.filter.match.candidate],
                ['unmatched', txt.filter.match.unmatched],
              ]}
            />
            <SelectFilter
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                ['all', txt.filter.priority.all],
                ['high', txt.filter.priority.high],
                ['medium', txt.filter.priority.medium],
                ['low', txt.filter.priority.low],
              ]}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: publicMode
                ? 'minmax(860px, 1.75fr) minmax(520px, 1fr)'
                : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 12,
              alignItems: 'stretch',
              minHeight: 440,
              height: publicMode ? 'min(76vh, 900px)' : 'min(68vh, 760px)',
            }}
          >
            <div
              style={{
                border: '1px solid #1f2937',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      <Th>{txt.table.line}</Th>
                      <Th>{txt.table.reviewer}</Th>
                      <Th>{txt.table.stars}</Th>
                      <Th>{txt.table.manager}</Th>
                      <Th>{txt.table.issue}</Th>
                      <Th>{txt.table.match}</Th>
                      <Th>{txt.table.action}</Th>
                      <Th>{txt.table.priority}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.reviewLine}
                        onClick={() => setSelectedLine(row.reviewLine)}
                        style={{
                          cursor: 'pointer',
                          background:
                            row.reviewLine === selected?.reviewLine ? '#111827' : 'transparent',
                          borderTop: '1px solid #1f2937',
                        }}
                      >
                        <Td>{row.reviewLine}</Td>
                        <Td>{row.reviewerName || '—'}</Td>
                        <Td>{row.starRating || '—'}</Td>
                        <Td>{row.accountManager || txt.modal.noValue}</Td>
                        <Td>{row.issueType || '—'}</Td>
                        <Td>
                          <span style={badgeStyle('match', row.matchStatus)}>
                            {matchLabel(row.matchStatus)}
                          </span>
                        </Td>
                        <Td>
                          <span style={badgeStyle('action', row.recommendedAction)}>
                            {actionLabel(row.recommendedAction)}
                          </span>
                        </Td>
                        <Td>
                          <span style={badgeStyle('priority', row.priorityLevel)}>
                            {priorityLabel(row.priorityLevel)}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #1f2937',
                borderRadius: 12,
                padding: 12,
                background: '#0b1220',
                minHeight: 0,
                overflowY: 'auto',
              }}
            >
              {selected ? (
                <>
                  <div
                    style={{
                      marginBottom: 10,
                      border: '1px solid #1f2937',
                      borderRadius: 10,
                      background: '#0f172a',
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        color: '#cbd5e1',
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      {txt.detail.followUpTitle}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 8,
                        background: selectedFollowUp.hasFollowUp ? '#102a1b' : '#3a2b14',
                        color: selectedFollowUp.hasFollowUp ? '#86efac' : '#fcd34d',
                      }}
                    >
                      {selectedFollowUp.hasFollowUp
                        ? txt.detail.followUpDone
                        : txt.detail.followUpPending}
                    </span>

                    <Section
                      title={txt.detail.assignedToTitle}
                      value={selectedFollowUp.assignedTo || txt.modal.noValue}
                    />
                    <Section
                      title={txt.detail.statusTitle}
                      value={selectedFollowUp.followUpStatus || txt.modal.noValue}
                    />
                    <Section
                      title={txt.detail.followUpNotesTitle}
                      value={selectedFollowUp.followUpNotes || txt.detail.followUpNotesEmpty}
                    />
                  </div>

                  <h3 style={{ margin: '0 0 8px', color: '#e5e7eb' }}>
                    {txt.detail.review.replace('{line}', String(selected.reviewLine || ''))}
                  </h3>
                  <div style={{ color: '#93c5fd', fontSize: 13, marginBottom: 8 }}>
                    {selected.reviewerName || txt.detail.unknownReviewer}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={badgeStyle('match', selected.matchStatus)}>
                      {matchLabel(selected.matchStatus)}
                    </span>
                    <span style={badgeStyle('priority', selected.priorityLevel)}>
                      {priorityLabel(selected.priorityLevel)}
                    </span>
                    <span style={badgeStyle('action', selected.recommendedAction)}>
                      {actionLabel(selected.recommendedAction)}
                    </span>
                  </div>

                  <Section
                    title={txt.detail.summaryTitle}
                    value={selected.reviewSummary || txt.detail.summaryEmpty}
                  />
                  <Section
                    title={txt.detail.reasonTitle}
                    value={(selected.reasonCodes || []).join(', ') || txt.detail.reasonEmpty}
                  />
                  <Section
                    title={txt.detail.templateTitle}
                    value={templateText(selected.templateKey)}
                  />

                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700, marginBottom: 6 }}
                    >
                      {txt.detail.flowTitle}
                    </div>
                    <FlowDiagram
                      txt={txt}
                      steps={[
                        {
                          key: 'intake',
                          title: txt.detail.flowStepIntake,
                          detail: selected.issueType || txt.modal.noValue,
                          status: 'done',
                        },
                        {
                          key: 'identity',
                          title: txt.detail.flowStepIdentity,
                          detail: `${matchLabel(selected.matchStatus)} | ${priorityLabel(selected.priorityLevel)}`,
                          status: 'done',
                        },
                        {
                          key: 'action',
                          title: txt.detail.flowStepAction,
                          detail: actionLabel(selected.recommendedAction),
                          status: selectedFollowUp.hasFollowUp ? 'done' : 'current',
                        },
                        {
                          key: 'followup',
                          title: txt.detail.flowStepFollowup,
                          detail:
                            selectedFollowUp.followUpStatus ||
                            selectedFollowUp.followUpNotes ||
                            txt.detail.followUpNotesEmpty,
                          status: selectedFollowUp.hasFollowUp
                            ? 'done'
                            : selectedFollowUp.assignedTo || selectedFollowUp.followUpStatus
                              ? 'current'
                              : 'pending',
                        },
                      ]}
                    />
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700, marginBottom: 4 }}
                    >
                      {txt.detail.checklistTitle}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#94a3b8', fontSize: 13 }}>
                      {((selected.checklist || []).length
                        ? selected.checklist
                        : [txt.detail.noChecklist]
                      ).map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedUserIds.length ? (
                    <Section
                      title={txt.detail.candidateUsersTitle}
                      value={selectedUserIds.join(', ')}
                    />
                  ) : null}

                  {profileCandidateIds.length ? (
                    <div style={{ marginTop: 10 }}>
                      <div
                        style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700, marginBottom: 6 }}
                      >
                        {txt.detail.internalProfilesTitle}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {profileCandidateIds.map((userId) => (
                          <button
                            key={userId}
                            type="button"
                            onClick={() => openProfileModal(userId)}
                            style={{
                              background: '#102a43',
                              color: '#bfdbfe',
                              border: '1px solid #1d4ed8',
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            {txt.detail.openProfile.replace('{userId}', userId)}
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: 4, color: '#64748b', fontSize: 11 }}>
                        {txt.detail.internalProfilesHint}
                      </div>
                    </div>
                  ) : null}

                  {selected.tradingContext ? (
                    <div style={{ marginTop: 10 }}>
                      <div
                        style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700, marginBottom: 4 }}
                      >
                        {txt.detail.tradingContextTitle}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>
                        {txt.detail.tradingContextMeta
                          .replace('{user}', selected.tradingContext.userid || txt.modal.noValue)
                          .replace('{mt5}', selected.tradingContext.mt5account || txt.modal.noValue)
                          .replace(
                            '{netDeposits}',
                            selected.tradingContext.netdeposits || txt.modal.noValue
                          )}
                      </div>
                    </div>
                  ) : null}

                  {selected.trustpilotLink ? (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={selected.trustpilotLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#93c5fd', fontSize: 12 }}
                      >
                        {txt.detail.openTrustpilot}
                      </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ color: '#94a3b8' }}>{txt.detail.noRows}</div>
              )}
            </div>
          </div>

          <div style={{ color: '#64748b', fontSize: 12 }}>{txt.footerReadOnly}</div>

          {profileModalOpen ? (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setProfileModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.72)',
                backdropFilter: 'blur(4px)',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: 'min(1240px, 96vw)',
                  maxHeight: 'min(90vh, 980px)',
                  overflow: 'auto',
                  border: '1px solid #334155',
                  borderRadius: 14,
                  background: '#0b1220',
                  boxShadow: '0 18px 46px rgba(2, 6, 23, 0.55)',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 16px 12px',
                    borderBottom: '1px solid #1f2937',
                    background: '#0b1220',
                  }}
                >
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 800 }}>
                      {txt.modal.title}
                    </div>
                    <div style={{ color: '#93c5fd', fontSize: 12 }}>
                      {txt.modal.userId.replace(
                        '{userId}',
                        profileTargetUserId || txt.modal.noValue
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    style={{
                      border: '1px solid #334155',
                      background: '#111827',
                      color: '#cbd5e1',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {txt.modal.close}
                  </button>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                  {profileLoading ? (
                    <div style={{ color: '#cbd5e1', fontSize: 13 }}>{txt.modal.loading}</div>
                  ) : null}

                  {!profileLoading && profileError ? (
                    <div
                      style={{
                        border: '1px solid #7f1d1d',
                        borderRadius: 10,
                        background: '#2a1212',
                        padding: 10,
                        color: '#fecaca',
                        fontSize: 13,
                      }}
                    >
                      {profileError}
                    </div>
                  ) : null}

                  {!profileLoading && !profileError && profileData ? (
                    <>
                      {profileData.creolabs?.found ? (
                        <>
                          <ModalSection title={txt.modal.sections.summary}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                                gap: 8,
                              }}
                            >
                              <CompactMetric
                                label={txt.modal.summary.confidence}
                                value={severityLabel(profileData.creolabs.confidence)}
                              />
                              <CompactMetric
                                label={txt.modal.summary.periods}
                                value={profileData.creolabs.periods || 0}
                              />
                              <CompactMetric
                                label={txt.modal.summary.rating}
                                value={formatRatingStars(selected?.starRating, txt)}
                              />
                              <CompactMetric
                                label={txt.modal.summary.inactivityDays}
                                value={
                                  Number.isFinite(profileData.creolabs.inactivityDays)
                                    ? profileData.creolabs.inactivityDays
                                    : txt.modal.notAvailable
                                }
                              />
                              <CompactMetric
                                label={txt.modal.summary.score}
                                value={profileData.creolabs.score || 0}
                              />
                            </div>
                          </ModalSection>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                              gap: 12,
                            }}
                          >
                            <ModalSection title={txt.modal.sections.identity}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                                  gap: 8,
                                }}
                              >
                                <ProfileField
                                  label={txt.modal.creolabs.clientId}
                                  value={profileData.creolabs.identity.clientId}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.clientLogin}
                                  value={profileData.creolabs.identity.clientLogin}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.clientName}
                                  value={profileData.creolabs.identity.clientName}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.affiliateId}
                                  value={profileData.creolabs.identity.affiliateId}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.manager}
                                  value={profileData.creolabs.identity.user}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.country}
                                  value={profileData.creolabs.identity.country}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.brand}
                                  value={profileData.creolabs.identity.brand}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.lastPeriod}
                                  value={profileData.creolabs.latestPeriod}
                                />
                              </div>
                            </ModalSection>

                            <ModalSection title={txt.modal.sections.totals}>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                                  gap: 8,
                                }}
                              >
                                <ProfileField
                                  label={txt.modal.creolabs.totDeposit}
                                  value={formatNumber(profileData.creolabs.totals.deposit)}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.totWithdrawals}
                                  value={formatNumber(profileData.creolabs.totals.wd)}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.totNet}
                                  value={formatNumber(profileData.creolabs.totals.net)}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.totPl}
                                  value={formatNumber(profileData.creolabs.totals.pl)}
                                />
                                <ProfileField
                                  label={txt.modal.creolabs.totTrades}
                                  value={formatNumber(profileData.creolabs.totals.trades)}
                                />
                              </div>
                              <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>
                                {txt.modal.creolabs.criteria
                                  .replace(
                                    '{reasons}',
                                    (profileData.creolabs.reasons || []).join(', ') ||
                                      txt.modal.notAvailable
                                  )
                                  .replace('{score}', String(profileData.creolabs.score || 0))}
                              </div>
                            </ModalSection>
                          </div>

                          <ModalSection title={txt.modal.sections.timeline}>
                            {Array.isArray(profileData.creolabs.timeline) &&
                            profileData.creolabs.timeline.length ? (
                              <div
                                style={{
                                  border: '1px solid #1f2937',
                                  borderRadius: 10,
                                  overflow: 'auto',
                                }}
                              >
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#0b1220' }}>
                                      <Th>{txt.modal.creolabs.period}</Th>
                                      <Th>{txt.modal.creolabs.deposit}</Th>
                                      <Th>{txt.modal.creolabs.withdrawals}</Th>
                                      <Th>{txt.modal.creolabs.net}</Th>
                                      <Th>{txt.modal.creolabs.pl}</Th>
                                      <Th>{txt.modal.creolabs.trades}</Th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {profileData.creolabs.timeline.map((row) => (
                                      <tr
                                        key={row.period}
                                        style={{ borderTop: '1px solid #1f2937' }}
                                      >
                                        <Td>{row.period || txt.modal.noValue}</Td>
                                        <Td>{formatNumber(row.deposit)}</Td>
                                        <Td>{formatNumber(row.wd)}</Td>
                                        <Td>{formatNumber(row.net)}</Td>
                                        <Td>{formatNumber(row.pl)}</Td>
                                        <Td>{formatNumber(row.trades)}</Td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{ color: '#64748b', fontSize: 12 }}>
                                {txt.modal.timeline.empty}
                              </div>
                            )}
                          </ModalSection>

                          <div style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>
                            {txt.modal.matchesFound.replace(
                              '{count}',
                              String(profileData.creolabs.rowsMatched || 0)
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          {profileData.creolabs?.message || txt.modal.creolabs.noData}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function MetricCard({ title, value, color = '#93c5fd' }) {
  return (
    <div
      style={{
        border: '1px solid #1f2937',
        borderRadius: 12,
        padding: '10px 12px',
        background: '#0b1220',
        display: 'grid',
        gap: 4,
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{title}</div>
      <div style={{ color, fontSize: 20, lineHeight: 1.2, fontWeight: 800 }}>
        {formatNumber(value)}
      </div>
    </div>
  )
}

function SelectFilter({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: '#0b1220',
        color: '#e5e7eb',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '8px 10px',
      }}
    >
      {options.map(([optValue, label]) => (
        <option key={optValue} value={optValue}>
          {label}
        </option>
      ))}
    </select>
  )
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        fontSize: 12,
        color: '#94a3b8',
        padding: '8px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children }) {
  return (
    <td
      style={{
        padding: '8px 10px',
        fontSize: 12,
        color: '#d1d5db',
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  )
}

function Section({ title, value }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 13 }}>{value || '—'}</div>
    </div>
  )
}

function FlowDiagram({ txt, steps }) {
  const safeSteps = Array.isArray(steps) ? steps : []
  return (
    <div
      style={{
        border: '1px solid #1f2937',
        borderRadius: 10,
        background: '#0f172a',
        padding: 10,
      }}
    >
      {safeSteps.map((step, idx) => {
        const status = step?.status || 'pending'
        const colors = flowStatusColors(status)
        return (
          <div
            key={step?.key || idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr',
              gap: 10,
              marginBottom: idx === safeSteps.length - 1 ? 0 : 8,
            }}
          >
            <div style={{ display: 'grid', justifyItems: 'center' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {idx + 1}
              </div>
              {idx < safeSteps.length - 1 ? (
                <div style={{ width: 2, minHeight: 20, marginTop: 4, background: '#334155' }} />
              ) : null}
            </div>

            <div
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                borderRadius: 10,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <div style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 700 }}>{step?.title}</div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    border: `1px solid ${colors.border}`,
                    background: '#0b1220',
                    color: colors.text,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  {flowStatusLabel(status, txt)}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                {step?.detail || txt.modal.noValue}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function flowStatusLabel(status, txt) {
  if (status === 'done') return txt.detail.flowDone
  if (status === 'current') return txt.detail.flowCurrent
  return txt.detail.flowPending
}

function flowStatusColors(status) {
  if (status === 'done') {
    return {
      bg: '#0d2018',
      border: '#1f6f47',
      text: '#86efac',
    }
  }
  if (status === 'current') {
    return {
      bg: '#2a1f0f',
      border: '#7c5a1f',
      text: '#fcd34d',
    }
  }
  return {
    bg: '#111827',
    border: '#334155',
    text: '#cbd5e1',
  }
}

function ProfileField({ label, value }) {
  return (
    <div
      style={{
        border: '1px solid #1f2937',
        borderRadius: 10,
        padding: '8px 10px',
        background: '#0f172a',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 11 }}>{label}</div>
      <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600 }}>{value || '—'}</div>
    </div>
  )
}

function ModalSection({ title, children }) {
  return (
    <section
      style={{
        border: '1px solid #1f2937',
        borderRadius: 12,
        background: '#0f172a',
        padding: 10,
      }}
    >
      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </section>
  )
}

function CompactMetric({ label, value }) {
  return (
    <div
      style={{
        border: '1px solid #1f2937',
        borderRadius: 10,
        padding: '8px 10px',
        background: '#0b1220',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 11 }}>{label}</div>
      <div style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
