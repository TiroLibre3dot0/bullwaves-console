import {
  convrsTemplateCatalog,
  normalizeConvrsTemplateName,
  templateIdToConvrsTemplate,
} from '../config/convrsTemplateSettings'

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function emptyTrend() {
  return {
    last7Days: [],
    last30Days: [],
  }
}

export async function fetchConvrsLiveStats(signal) {
  const response = await fetch('/api/convrs/whatsapp-templates/stats', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Live stats request failed (${response.status})`)
  }

  const payload = await response.json()
  if (!payload?.ok) {
    throw new Error(payload?.error || 'Unable to load live stats')
  }

  return payload
}

export function mergeTemplatesWithLiveStats(templates = [], livePayload) {
  const byId = livePayload?.live?.templates?.byTemplateId || {}
  const byName = livePayload?.live?.templates?.byTemplateName || {}

  return templates.map((template) => {
    const idKey = normalizeKey(template.id)
    const nameKey = normalizeKey(template.name)
    const mappedConvrsName = normalizeConvrsTemplateName(templateIdToConvrsTemplate[template.id] || '')
    const live = byId[idKey] || byName[mappedConvrsName] || byName[nameKey] || null
    if (!live) return template

    const sent = toNumber(live.sent, template.stats.sent)
    const delivered = toNumber(live.delivered, template.stats.delivered)
    const read = toNumber(live.read, template.stats.read)
    const replies = toNumber(live.replies, template.stats.replies)
    const replyRate = sent > 0 ? Number(((replies / sent) * 100).toFixed(1)) : 0

    return {
      ...template,
      stats: {
        ...template.stats,
        sent,
        delivered,
        read,
        replies,
        replyRate,
        trend: emptyTrend(),
        previousPeriodReplyRate: null,
        previousPeriodConversionRate: null,
        bestAudience: null,
        worstAudience: null,
        bestHour: null,
        bestDay: null,
        topCountry: null,
        bestAccountType: null,
      },
      updatedAt: live.updatedAt || template.updatedAt,
    }
  })
}

function guessCategoryFromConvrsName(name) {
  const n = normalizeConvrsTemplateName(name)
  if (n.includes('kyc') || n.includes('application')) return 'onboarding'
  if (n.includes('promo') || n.includes('market') || n.includes('welcome')) return 'bonus'
  if (n.includes('survey') || n.includes('recap') || n.includes('call')) return 'support follow-up'
  if (n.includes('dormant') || n.includes('reach_out')) return 're-engagement'
  return 'support follow-up'
}

function guessToneFromConvrsName(name) {
  const n = normalizeConvrsTemplateName(name)
  if (n.includes('decline') || n.includes('accept')) return 'consultative'
  if (n.includes('promo') || n.includes('market')) return 'direct'
  if (n.includes('dormant')) return 'reactivation'
  if (n.includes('quick')) return 'urgent'
  return 'friendly'
}

function fallbackPerformanceLabel(replyRate) {
  if (replyRate >= 28) return 'Best performer'
  if (replyRate >= 20) return 'Good engagement'
  if (replyRate >= 12) return 'Needs review'
  return 'Low reply rate'
}

function buildGenericTemplate(convrsName, liveStats) {
  const sent = toNumber(liveStats?.sent, 0)
  const delivered = toNumber(liveStats?.delivered, 0)
  const read = toNumber(liveStats?.read, 0)
  const replies = toNumber(liveStats?.replies, 0)
  const replyRate = sent > 0 ? Number(((replies / sent) * 100).toFixed(1)) : 0

  return {
    id: `convrs-${normalizeConvrsTemplateName(convrsName)}`,
    name: convrsName,
    category: guessCategoryFromConvrsName(convrsName),
    status: 'active',
    tone: guessToneFromConvrsName(convrsName),
    createdBy: 'Convrs',
    createdAt: new Date().toISOString(),
    updatedAt: liveStats?.updatedAt || new Date().toISOString(),
    snippet: `Template synced from Convrs: ${convrsName}`,
    message: `This template is managed in Convrs as ${convrsName}. Open Convrs to edit final copy and components.`,
    variables: ['[Name]'],
    usageNotes: 'Managed on Convrs side. Keep mapping aligned for live KPI attribution.',
    targetAudience: 'Convrs outbound audience',
    objective: 'Track template effectiveness in Bullwaves console.',
    followUpTiming: 'Based on Convrs campaign strategy',
    performanceLabel: fallbackPerformanceLabel(replyRate),
    isFavorite: false,
    stats: {
      sent,
      delivered,
      read,
      replies,
      replyRate,
      conversions: null,
      conversionRate: null,
      avgReplyTime: 'N/A',
      trend: emptyTrend(),
      previousPeriodReplyRate: null,
      previousPeriodConversionRate: null,
      bestAudience: null,
      worstAudience: null,
      bestHour: null,
      bestDay: null,
      topCountry: null,
      bestAccountType: null,
    },
    variants: [
      { id: `${convrsName}-a`, label: 'Version A', message: `Convrs variant A for ${convrsName}` },
      { id: `${convrsName}-b`, label: 'Version B', message: `Convrs variant B for ${convrsName}` },
    ],
  }
}

export function buildConvrsTemplateLibrary(baseTemplates = [], livePayload) {
  const byName = livePayload?.live?.templates?.byTemplateName || {}

  const reverseMapping = Object.entries(templateIdToConvrsTemplate).reduce((acc, [id, convrsName]) => {
    acc[normalizeConvrsTemplateName(convrsName)] = id
    return acc
  }, {})

  return convrsTemplateCatalog.map((convrsName) => {
    const key = normalizeConvrsTemplateName(convrsName)
    const mappedTemplateId = reverseMapping[key]
    const mappedTemplate = mappedTemplateId
      ? baseTemplates.find((item) => item.id === mappedTemplateId)
      : null

    const liveStats = byName[key] || null
    if (!mappedTemplate) {
      return buildGenericTemplate(convrsName, liveStats)
    }

    if (!liveStats) {
      return {
        ...mappedTemplate,
        name: convrsName,
      }
    }

    const sent = toNumber(liveStats.sent, mappedTemplate.stats.sent)
    const delivered = toNumber(liveStats.delivered, mappedTemplate.stats.delivered)
    const read = toNumber(liveStats.read, mappedTemplate.stats.read)
    const replies = toNumber(liveStats.replies, mappedTemplate.stats.replies)
    const replyRate = sent > 0 ? Number(((replies / sent) * 100).toFixed(1)) : 0

    return {
      ...mappedTemplate,
      name: convrsName,
      updatedAt: liveStats.updatedAt || mappedTemplate.updatedAt,
      performanceLabel: fallbackPerformanceLabel(replyRate),
      stats: {
        ...mappedTemplate.stats,
        sent,
        delivered,
        read,
        replies,
        replyRate,
        trend: emptyTrend(),
        previousPeriodReplyRate: null,
        previousPeriodConversionRate: null,
        bestAudience: null,
        worstAudience: null,
        bestHour: null,
        bestDay: null,
        topCountry: null,
        bestAccountType: null,
      },
    }
  })
}
