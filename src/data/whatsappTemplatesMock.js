const now = new Date()

const daysAgo = (days) => {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// Template library - solo template approvati e attivi su Convrs.
// Aggiungere qui nuovi template reali man mano che vengono configurati.

export const whatsappTemplatesMock = [
  {
    id: 'tpl-reengagement-soft',
    name: 'Dormant Account',
    category: 're-engagement',
    status: 'active',
    tone: 'friendly',
    createdBy: 'Bullwaves',
    createdAt: daysAgo(140),
    updatedAt: daysAgo(0),
    snippet: 'Still interested in restarting? I can prepare a simpler setup path for you.',
    message:
      'Hi [Name], just checking in. If you still want to restart, I can prepare a simpler path based on your profile so you do not lose time.',
    variables: ['[Name]', '[Agent]', '[SupportLink]'],
    usageNotes: 'Use for dormant contacts inactive for 14-45 days.',
    targetAudience: 'Dormant registered users',
    objective: 'Recover conversation and qualify renewed intent',
    followUpTiming: 'First nudge after 14 days inactivity, second after 5 days',
    performanceLabel: '-',
    isFavorite: false,
    templateScore: 0,
    stats: {
      sent: 0,
      delivered: 0,
      read: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
      conversionRate: 0,
      avgReplyTime: '-',
      trend: {
        last7Days: Array.from({ length: 7 }, (_, i) => ({ day: `D-${6 - i}`, replyRate: 0 })),
        last30Days: Array.from({ length: 30 }, (_, i) => ({ day: `D-${29 - i}`, replyRate: 0 })),
      },
      previousPeriodReplyRate: 0,
      previousPeriodConversionRate: 0,
      bestAudience: '-',
      worstAudience: '-',
      bestHour: '-',
      bestDay: '-',
      topCountry: '-',
      bestAccountType: '-',
    },
    variants: [],
  },
]

export const whatsappFilterOptions = {
  categories: [
    'all',
    're-engagement',
  ],
  statuses: ['all', 'active', 'draft', 'archived'],
  tones: ['all', 'friendly'],
  sortOptions: [
    { value: 'most-recent', label: 'Most recent' },
    { value: 'highest-reply-rate', label: 'Highest reply rate' },
    { value: 'highest-conversion-rate', label: 'Highest conversion rate' },
    { value: 'alphabetical', label: 'Alphabetical' },
  ],
}
