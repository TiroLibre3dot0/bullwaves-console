export const SCORE_WEIGHTS = {
  replyRate: 0.62,
  conversionRate: 0.38,
}

export function computeTemplateScore(replyRate = 0, conversionRate = 0) {
  const safeReply = Number.isFinite(Number(replyRate)) ? Number(replyRate) : 0
  const safeConversion = Number.isFinite(Number(conversionRate)) ? Number(conversionRate) : 0

  const replyComponent = Math.min(100, (safeReply / 40) * 100)
  const conversionComponent = Math.min(100, (safeConversion / 20) * 100)

  return Math.round(
    replyComponent * SCORE_WEIGHTS.replyRate + conversionComponent * SCORE_WEIGHTS.conversionRate
  )
}

export function withDerivedScore(template) {
  if (!template) return template
  const score = computeTemplateScore(template?.stats?.replyRate, template?.stats?.conversionRate)
  return {
    ...template,
    templateScore: Number.isFinite(template?.templateScore) ? template.templateScore : score,
  }
}

export function deriveOverviewStats(templates = []) {
  if (!templates.length) {
    return {
      totalTemplates: 0,
      activeTemplates: 0,
      averageReplyRate: 0,
      bestPerformingTemplate: 'N/A',
      avgSent: 0,
      avgConversionRate: 0,
    }
  }

  const activeTemplates = templates.filter((item) => item.status === 'active').length
  const averageReplyRate =
    templates.reduce((sum, item) => sum + Number(item?.stats?.replyRate || 0), 0) / templates.length
  const avgSent = templates.reduce((sum, item) => sum + Number(item?.stats?.sent || 0), 0) / templates.length
  const avgConversionRate =
    templates.reduce((sum, item) => sum + Number(item?.stats?.conversionRate || 0), 0) / templates.length

  const bestTemplate = [...templates].sort(
    (a, b) => Number(b?.templateScore || 0) - Number(a?.templateScore || 0)
  )[0]

  return {
    totalTemplates: templates.length,
    activeTemplates,
    averageReplyRate,
    bestPerformingTemplate: bestTemplate?.name || 'N/A',
    avgSent,
    avgConversionRate,
  }
}

export function filterAndSortTemplates(templates = [], filters) {
  const safeFilters = filters || {}
  const search = String(safeFilters.search || '')
    .trim()
    .toLowerCase()

  const filtered = templates.filter((template) => {
    const text = `${template.name} ${template.snippet} ${template.message}`.toLowerCase()
    const searchOk = !search || text.includes(search)
    const categoryOk = safeFilters.category === 'all' || template.category === safeFilters.category
    const statusOk = safeFilters.status === 'all' || template.status === safeFilters.status
    const toneOk = safeFilters.tone === 'all' || template.tone === safeFilters.tone
    return searchOk && categoryOk && statusOk && toneOk
  })

  return filtered.sort((a, b) => {
    switch (safeFilters.sortBy) {
      case 'highest-reply-rate':
        return Number(b?.stats?.replyRate || 0) - Number(a?.stats?.replyRate || 0)
      case 'highest-conversion-rate':
        return Number(b?.stats?.conversionRate || 0) - Number(a?.stats?.conversionRate || 0)
      case 'alphabetical':
        return String(a.name || '').localeCompare(String(b.name || ''))
      case 'most-recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })
}

export function buildRecommendations(template, overview) {
  if (!template) return []

  const stats = template.stats || {}
  const recommendations = []

  if (stats.replyRate >= (overview?.averageReplyRate || 0)) {
    recommendations.push('This template performs well with newly registered users.')
  } else {
    recommendations.push('Reply rate is below workspace average. Test a stronger opening line.')
  }

  if (stats.replyRate >= 22 && stats.conversionRate < (overview?.avgConversionRate || 0)) {
    recommendations.push('Reply rate is strong, but conversion is below average.')
  }

  if (String(template.message || '').length > 290) {
    recommendations.push('This template may be too long for first outreach.')
  }

  if (stats.conversionRate < 8) {
    recommendations.push('Consider testing a stronger CTA and explicit next action.')
  } else {
    recommendations.push('CTA clarity is good. Consider scaling this template on similar audiences.')
  }

  return recommendations
}

export function formatPercent(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`
}

export function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getDelta(current, previous) {
  const c = Number(current || 0)
  const p = Number(previous || 0)
  const delta = c - p
  return {
    value: delta,
    label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp`,
    positive: delta >= 0,
  }
}
