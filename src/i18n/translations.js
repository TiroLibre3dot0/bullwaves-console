export const SUPPORTED_LOCALES = [
  { id: 'en', label: 'EN' },
  { id: 'it', label: 'IT' },
  { id: 'sr', label: 'SR' },
]

export const translations = {
  en: {
    // Global
    'app.tools': 'Tools',
    'app.admin': 'Admin',
    'app.logout': 'Logout',
    'app.version': 'v1.0.0',
    'app.uploadLeaveConfirm': 'Upload in progress. Leave this page?',

    // Data status
    'dataStatus.updated': 'Data is up to date',
    'dataStatus.outdated': 'Data may be outdated',
    'dataStatus.noData': 'No data available',
    'dataStatus.unknown': 'Unknown status',

    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.ops': 'Ops',
    'sidebar.overview': 'Overview',
    'sidebar.executiveSuite': 'Executive Suite',
    'sidebar.executive.summary': 'Summary',
    'sidebar.executive.view': 'View',
    'sidebar.marketingPlan': 'Marketing Execution',
    'sidebar.affiliate': 'Affiliate',
    'sidebar.affiliate.analysis': 'Analysis',
    'sidebar.affiliate.payments': 'Payments',
    'sidebar.affiliate.payments2': 'Payments 2.0',
    'sidebar.affiliate.cohort': 'Cohort',
    'sidebar.analysis': 'Report Analysis',
    'sidebar.fraud': 'Fraud Monitoring',
    'sidebar.traderPoints': 'Trader Points',

    // Share — Affiliate Analysis (board report)
    'shareAffiliateAnalysis.header.eyebrow': 'Board report',
    'shareAffiliateAnalysis.header.title': 'Affiliate Performance — Board View',
    'shareAffiliateAnalysis.header.subtitle':
      'Select an affiliate to open the final performance report.',
    'shareAffiliateAnalysis.period.monthly': 'Monthly',
    'shareAffiliateAnalysis.period.quarterly': 'Quarterly',
    'shareAffiliateAnalysis.period.semiAnnual': 'Semi-annual',
    'shareAffiliateAnalysis.period.annual': 'Annual',
    'shareAffiliateAnalysis.entry.selectedPeriod': 'Period: {period}',
    'shareAffiliateAnalysis.entry.noPeriod': 'Period: —',
    'shareAffiliateAnalysis.card.reference': 'Ref. period',
    'shareAffiliateAnalysis.card.profit': 'Profit',
    'shareAffiliateAnalysis.card.netDeposits': 'Net Deposits',
    'shareAffiliateAnalysis.card.roi': 'ROI',
    'shareAffiliateAnalysis.footer.note':
      'Read-only share link. Values reflect the latest available uploaded reports.',
    'shareAffiliateAnalysis.back': '← Back to affiliates',
    'shareAffiliateAnalysis.status.performing': 'Performing',
    'shareAffiliateAnalysis.status.stable': 'Stable',
    'shareAffiliateAnalysis.status.underperforming': 'Underperforming',
    'shareAffiliateAnalysis.accessDenied.title': 'Access denied',
    'shareAffiliateAnalysis.accessDenied.subtitle': 'This share link is invalid or has expired.',
    'shareAffiliateAnalysis.error.title': 'Unable to load data',
    'shareAffiliateAnalysis.report.eyebrow': 'Final report',
    'shareAffiliateAnalysis.report.title': 'Affiliate Performance Report — {affiliate}',
    'shareAffiliateAnalysis.report.subtitle': 'Board-level summary. Read-only.',
    'shareAffiliateAnalysis.report.executiveSnapshot': 'Executive snapshot',
    'shareAffiliateAnalysis.report.performanceOverview': 'Performance overview',
    'shareAffiliateAnalysis.report.trendReading': 'Trend & reading',
    'shareAffiliateAnalysis.report.periodComparison': 'Period comparison',
    'shareAffiliateAnalysis.report.boardInterpretation': 'Board interpretation',
    'shareAffiliateAnalysis.report.decisionLayer': 'Decision layer',
    'shareAffiliateAnalysis.report.periodLabel': 'All available data',
    'shareAffiliateAnalysis.report.disclaimer':
      'This report uses the same underlying analysis as the internal console, presented in board-level format.',
    'shareAffiliateAnalysis.metric.referencePeriod': 'Reference period',
    'shareAffiliateAnalysis.metric.periodType': 'Period type',
    'shareAffiliateAnalysis.metric.status': 'Status',
    'shareAffiliateAnalysis.metric.profit': 'Profit',
    'shareAffiliateAnalysis.metric.roi': 'ROI',
    'shareAffiliateAnalysis.metric.registrations': 'Registrations',
    'shareAffiliateAnalysis.metric.ftd': 'FTD',
    'shareAffiliateAnalysis.metric.qftd': 'Qualified FTD',
    'shareAffiliateAnalysis.metric.netDeposits': 'Net Deposits',
    'shareAffiliateAnalysis.metric.pl': 'P&L',
    'shareAffiliateAnalysis.metric.payments': 'Payments',
    'shareAffiliateAnalysis.trend.notEnoughData':
      'Not enough history to calculate month-over-month changes.',
    'shareAffiliateAnalysis.trend.profit': 'Profit',
    'shareAffiliateAnalysis.trend.netDeposits': 'Net deposits',
    'shareAffiliateAnalysis.trend.ftd': 'FTD',
    'shareAffiliateAnalysis.comparison.profit': 'Profit',
    'shareAffiliateAnalysis.comparison.netDeposits': 'Net deposits',
    'shareAffiliateAnalysis.comparison.ftd': 'FTD',
    'shareAffiliateAnalysis.comparison.up': 'Up',
    'shareAffiliateAnalysis.comparison.down': 'Down',
    'shareAffiliateAnalysis.comparison.flat': 'Flat',
    'shareAffiliateAnalysis.comparison.vsLabel': 'Compared to: {prev}',
    'shareAffiliateAnalysis.interpretation.positive':
      'Overall performance is healthy: contribution is positive and deposits are present.',
    'shareAffiliateAnalysis.interpretation.negative':
      'Performance needs attention: contribution is negative for the selected period.',
    'shareAffiliateAnalysis.interpretation.neutral':
      'Performance is stable: monitor for persistence of results over time.',
    'shareAffiliateAnalysis.interpretation.profitUp':
      'Compared to the previous period, profitability improved.',
    'shareAffiliateAnalysis.interpretation.profitDown':
      'Compared to the previous period, profitability weakened.',
    'shareAffiliateAnalysis.interpretation.profitFlat':
      'Compared to the previous period, profitability is broadly unchanged.',
    'shareAffiliateAnalysis.decision.whatThisMeans': 'What this means: {status} for {ref}.',
    'shareAffiliateAnalysis.decision.option.scale':
      'Scale selectively: increase volume while keeping payout efficiency.',
    'shareAffiliateAnalysis.decision.option.maintainQuality':
      'Maintain quality: protect traffic quality and conversion.',
    'shareAffiliateAnalysis.decision.option.monitor':
      'Monitor monthly: confirm that profit and deposits remain stable.',
    'shareAffiliateAnalysis.decision.option.improveLeadQuality':
      'Improve lead quality: prioritize sources with stronger conversion and value.',
    'shareAffiliateAnalysis.decision.option.focusRetention':
      'Focus on retention: improve post-registration activation to lift net deposits.',

    // Share — Board login
    'shareBoardLogin.eyebrow': 'Board access',
    'shareBoardLogin.title': 'Open shared report',
    'shareBoardLogin.subtitle':
      'Enter the access code to view the shared board report in read-only mode.',
    'shareBoardLogin.badge.readOnly': 'Read-only',
    'shareBoardLogin.field.accessCode': 'Access code',
    'shareBoardLogin.field.placeholder': 'Paste the access code (e.g. share_...)',
    'shareBoardLogin.helper': 'Tip: access codes usually start with “share_” or “share_local_”.',
    'shareBoardLogin.cta': 'Continue',
    'shareBoardLogin.clear': 'Clear saved code',
    'shareBoardLogin.note':
      'This access code grants read-only access to the shared report area. It does not grant access to internal dashboards.',
    'shareBoardLogin.error.missing': 'Please enter an access code.',
    'shareBoardLogin.error.invalid': 'Invalid or expired access code.',
    'shareBoardLogin.error.network': 'Network error. Please try again.',

    // Share — Affiliate Reports (board view, v2)
    'shareAffiliateReports.header.title': 'Affiliate Performance — Board View',
    'shareAffiliateReports.header.subtitle': 'Read-only executive summary',
    'shareAffiliateReports.header.note':
      'Top affiliates by commissions. Click an affiliate to open the full report.',
    'shareAffiliateReports.header.changeAffiliate': 'Change affiliate',
    'shareAffiliateReports.header.selectAffiliate': 'Select an affiliate to open another report',
    'shareAffiliateReports.card.netDeposits': 'Net Deposits',
    'shareAffiliateReports.card.pl': 'P&L',
    'shareAffiliateReports.card.weight': 'Weight',
    'shareAffiliateReports.footer.note':
      'Board view is read-only. Data source: internal Affiliate → Analysis.',
    'shareAffiliateReports.period.sinceEver': 'Since Ever',
    'shareAffiliateReports.period.ytd': 'Year to date',
    'shareAffiliateReports.period.label': 'Period',
    'shareAffiliateReports.report.eyebrow': 'Affiliate report',
    'shareAffiliateReports.section.execSnapshot': 'Executive snapshot',
    'shareAffiliateReports.exec.selectedPeriod': 'Selected period',
    'shareAffiliateReports.section.kpiPerformance': 'KPI performance',
    'shareAffiliateReports.kpi.rank': 'Rank',
    'shareAffiliateReports.metric.cr': 'CR%',
    'shareAffiliateReports.section.aggregates': 'Aggregates',
    'shareAffiliateReports.section.kpis': 'KPIs',
    'shareAffiliateReports.metric.ftd': 'FTD',
    'shareAffiliateReports.metric.qftd': 'QFTD',
    'shareAffiliateReports.metric.deposits': 'Deposits',
    'shareAffiliateReports.metric.withdrawals': 'Withdrawals',
    'shareAffiliateReports.metric.profit': 'Profit',
    'shareAffiliateReports.metric.arpu': 'ARPU',
    'shareAffiliateReports.metric.cpa': 'CPA',
    'shareAffiliateReports.metric.avgDepositsPerUser': 'Avg deposits / FTD user',
    'shareAffiliateReports.metric.affiliateRegistrations': 'Affiliate registrations',
    'shareAffiliateReports.metric.companyRegistrations': 'Company registrations',
    'shareAffiliateReports.metric.companyRegistrations.hint': 'Comparable scale indicator',
    'shareAffiliateReports.metric.ftdClients': 'FTD clients',
    'shareAffiliateReports.metric.qftdClients': 'QFTD clients',
    'shareAffiliateReports.metric.depositsCount': 'Deposits count',
    'shareAffiliateReports.metric.loginRatio': 'Login ratio%',
    'shareAffiliateReports.metric.avgDepositsCountPerFtdUser': 'Avg deposits count / FTD user',
    'shareAffiliateReports.metric.positionsCount': 'Positions count',
    'shareAffiliateReports.section.cohortPulse': 'Cohort financial pulse',
    'shareAffiliateReports.section.cohortPulse.note':
      'Net Deposits (absolute) — same dataset as /cohort.',
    'shareAffiliateReports.section.cohortPulse.error': 'Unable to load cohort data',
    'shareAffiliateReports.compare.label': 'Compare with',
    'shareAffiliateReports.compare.placeholder': 'Type affiliate name…',
    'shareAffiliateReports.compare.clear': 'Clear',
    'shareAffiliateReports.compare.notFound': 'Affiliate not found',
    'shareAffiliateReports.compare.same': 'Same affiliate selected',
    'shareAffiliateReports.compare.delta': 'Δ',
    'shareAffiliateReports.chart.title': 'Platform growth (cumulative)',
    'shareAffiliateReports.chart.noData': 'No data for chart',
    'shareAffiliateReports.chart.aria.cumulative': 'Affiliate growth cumulative chart',
    'shareAffiliateReports.chart.legend.ftd': 'FTD (cum.)',
    'shareAffiliateReports.chart.legend.regs': 'Regs (cum.)',
    'shareAffiliateReports.chart.legend.qftd': 'QFTD (cum.)',
    'shareAffiliateReports.chart.tooltip.regs': 'Regs',
    'shareAffiliateReports.chart.tooltip.ftd': 'FTD',
    'shareAffiliateReports.chart.tooltip.qftd': 'QFTD',
    'shareAffiliateReports.section.weightOnTotal': 'Weight on total',
    'shareAffiliateReports.rank.ofTop20': 'of Top 20 net deposits',
    'shareAffiliateReports.weight.payments': 'Commissions weight (Top 20)',
    'shareAffiliateReports.weight.netDeposits': 'Net Deposits weight (Top 20)',
    'shareAffiliateReports.weight.pl': 'P&L weight (Top 20)',
    'shareAffiliateReports.section.periodComparison': 'Period comparison',
    'shareAffiliateReports.interpretation.positive':
      'Strong value creation with meaningful contribution.',
    'shareAffiliateReports.interpretation.actionablePositive':
      'Maintain exposure and scale selectively if consistency persists.',
    'shareAffiliateReports.interpretation.negative':
      'Value creation is negative in the selected period.',
    'shareAffiliateReports.interpretation.actionableNegative':
      'Constrain exposure until efficiency improves.',
    'shareAffiliateReports.interpretation.mixed':
      'Contribution is mixed; prioritize quality and monitor closely.',
    'shareAffiliateReports.section.weightRanking': 'Weight & ranking',
    'shareAffiliateReports.rank.roi': 'ROI',
    'shareAffiliateReports.rank.deposits': 'Deposits',
    'shareAffiliateReports.rank.pl': 'P&L',
    'shareAffiliateReports.rank.payments': 'Payments',
    'shareAffiliateReports.rank.ofTotal': 'of total',
    'shareAffiliateReports.rank.vsPrevious': 'vs previous period',
    'shareAffiliateReports.rank.noData': 'Ranking is not available for the selected period.',
    'shareAffiliateReports.section.trend': 'Trend & period comparison',
    'shareAffiliateReports.trend.sinceEver': 'Since Ever view has no previous equivalent period.',
    'shareAffiliateReports.trend.profit': 'Profit',
    'shareAffiliateReports.trend.netDeposits': 'Net Deposits',
    'shareAffiliateReports.trend.ftd': 'FTD',
    'shareAffiliateReports.trend.vsPrevious': 'vs previous period',
    'shareAffiliateReports.section.decision': 'Board-level implications',
    'shareAffiliateReports.section.scale': 'Scale',
    'shareAffiliateReports.section.efficiency': 'Efficiency',
    'shareAffiliateReports.weight.shareOfTop20': 'Share of Top 20 affiliates',
    'shareAffiliateReports.periodHint.volumeDriven': ' (volume-driven)',
    'shareAffiliateReports.periodHint.marginDriven': ' (margin-driven)',
    'shareAffiliateReports.periodHint.efficiencyImproved': ' (efficiency improved)',
    'shareAffiliateReports.periodHint.efficiencyWorsened': ' (efficiency weakened)',
    'shareAffiliateReports.board.block.status': 'Status',
    'shareAffiliateReports.board.block.attention': 'Attention / risk',
    'shareAffiliateReports.board.block.actionBias': 'Action bias',
    'shareAffiliateReports.board.status.healthy': 'Healthy',
    'shareAffiliateReports.board.status.negative': 'Value negative',
    'shareAffiliateReports.board.status.neutral': 'Mixed',
    'shareAffiliateReports.board.attention.profitNegative': 'Profit negative',
    'shareAffiliateReports.board.attention.roiNegative': 'ROI negative',
    'shareAffiliateReports.board.attention.netDepositsNegative': 'Net deposits negative',
    'shareAffiliateReports.board.attention.monitor': 'Monitor',
    'shareAffiliateReports.board.action.scaleSelectively': 'Scale',
    'shareAffiliateReports.board.action.optimizeBeforeScaling': 'Optimize',
    'shareAffiliateReports.board.action.reduceExposure': 'Reduce',
    'shareAffiliateReports.board.action.monitorNoIntervention': 'Monitor',
    'shareAffiliateReports.chart.guided': 'Guided trajectory (cumulative)',

    // Share — Affiliate Reports (text feedback)
    'shareAffiliateReports.feedback.whatItMeans': 'What it means:',
    'shareAffiliateReports.feedback.nextStep': 'Next step:',
    'shareAffiliateReports.feedback.impact': 'Impact:',
    'shareAffiliateReports.feedback.trendReading': 'Trend reading:',

    'shareAffiliateReports.kpiFeedback.meaning.negativeBoth': 'Net deposits and P&L are negative.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveDepositsNegativePl':
      'Net deposits are positive but P&L is negative.',
    'shareAffiliateReports.kpiFeedback.meaning.positivePlNegativeDeposits':
      'P&L is positive but net deposits are negative.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveButRoiNegative':
      'Net deposits and P&L are positive but ROI is negative.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveSoftening':
      'Results are positive but trends are weakening.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveStable': 'Results are positive and stable.',

    'shareAffiliateReports.kpiFeedback.next.stopScaling':
      'Stop scaling and review sources and costs.',
    'shareAffiliateReports.kpiFeedback.next.holdCutCosts': 'Hold spend and reduce costs.',
    'shareAffiliateReports.kpiFeedback.next.checkQuality':
      'Check deposit quality and monitor withdrawals.',
    'shareAffiliateReports.kpiFeedback.next.fixRoi': 'Keep spend flat and fix ROI before scaling.',
    'shareAffiliateReports.kpiFeedback.next.monitorBeforeScale':
      'Maintain exposure and monitor the next period.',
    'shareAffiliateReports.kpiFeedback.next.scaleCarefully':
      'Maintain exposure and scale carefully.',

    'shareAffiliateReports.weightFeedback.impact.high':
      'This affiliate drives a large share of total net deposits.',
    'shareAffiliateReports.weightFeedback.impact.low':
      'This affiliate has a small share of total net deposits.',
    'shareAffiliateReports.weightFeedback.next.protectChannel':
      'Protect this channel and review quality regularly.',
    'shareAffiliateReports.weightFeedback.next.keepLean':
      'Keep spend lean and scale only after results improve.',

    'shareAffiliateReports.chartFeedback.trend.risingAll': 'Registrations and FTD keep rising.',
    'shareAffiliateReports.chartFeedback.trend.risingRegsFlatFtd':
      'Registrations rise but FTD is flat.',
    'shareAffiliateReports.chartFeedback.trend.risingFtdFlatRegs':
      'FTD rises while registrations are flat.',
    'shareAffiliateReports.chartFeedback.trend.flat': 'The curve is flat.',
    'shareAffiliateReports.chartFeedback.trend.limited': 'The curve has limited history.',
    'shareAffiliateReports.chartFeedback.trend.noData': 'The chart is not available.',

    'shareAffiliateReports.chartFeedback.next.watchConversion':
      'Watch conversion and costs and confirm stability.',
    'shareAffiliateReports.chartFeedback.next.checkLeadQuality':
      'Check lead quality and adjust sources.',
    'shareAffiliateReports.chartFeedback.next.monitorPlateau':
      'Monitor for a plateau and decide on scaling.',
    'shareAffiliateReports.chartFeedback.next.checkData':
      'Check the data upload and monitor the next period.',

    'shareAffiliateReports.finalSummary.overallAssessment': 'Overall assessment:',
    'shareAffiliateReports.finalSummary.keyStrength': 'Key strength:',
    'shareAffiliateReports.finalSummary.keyRisk': 'Key risk:',
    'shareAffiliateReports.finalSummary.recommendedAction': 'Recommended action:',

    'shareAffiliateReports.finalSummary.value.healthy': 'Performance is healthy.',
    'shareAffiliateReports.finalSummary.value.mixed': 'Performance is mixed.',
    'shareAffiliateReports.finalSummary.value.needsAction': 'Performance needs action.',
    'shareAffiliateReports.finalSummary.value.softening': 'Performance is stable but softening.',

    'shareAffiliateReports.finalSummary.strength.scaleGrowing': 'Net deposits are growing.',
    'shareAffiliateReports.finalSummary.strength.efficiencyImproving': 'ROI is improving.',
    'shareAffiliateReports.finalSummary.strength.stableProfit': 'P&L is stable.',

    'shareAffiliateReports.finalSummary.risk.plNegative': 'P&L is negative.',
    'shareAffiliateReports.finalSummary.risk.roiNegative': 'ROI is negative.',
    'shareAffiliateReports.finalSummary.risk.withdrawalPressure':
      'Withdrawals are high versus deposits.',
    'shareAffiliateReports.finalSummary.risk.none': 'No material risk detected.',

    'shareAffiliateReports.finalSummary.action.pauseFix': 'Pause scaling and fix efficiency.',
    'shareAffiliateReports.finalSummary.action.holdImprove':
      'Keep spend flat and improve conversion.',
    'shareAffiliateReports.finalSummary.action.monitor': 'Maintain exposure and monitor closely.',
    'shareAffiliateReports.finalSummary.action.maintainScale':
      'Maintain exposure and scale carefully.',
    'shareAffiliateReports.decisionOverview.title': 'Decision overview',
    'shareAffiliateReports.decisionOverview.trajectory': 'Trajectory',
    'shareAffiliateReports.decisionOverview.growthQuality': 'Growth quality',
    'shareAffiliateReports.decisionOverview.riskSignal': 'Risk signal',
    'shareAffiliateReports.decisionOverview.positioning': 'Positioning',
    'shareAffiliateReports.decisionOverview.nextReview': 'Next review',
    'shareAffiliateReports.decisionOverview.value.improving': 'Improving',
    'shareAffiliateReports.decisionOverview.value.stable': 'Stable',
    'shareAffiliateReports.decisionOverview.value.deteriorating': 'Deteriorating',
    'shareAffiliateReports.decisionOverview.value.volumeDriven': 'Volume-driven',
    'shareAffiliateReports.decisionOverview.value.efficiencyDriven': 'Efficiency-driven',
    'shareAffiliateReports.decisionOverview.value.mixed': 'Mixed',
    'shareAffiliateReports.decisionOverview.value.noMaterialRisk': 'No material risk detected',
    'shareAffiliateReports.decisionOverview.value.conversionPressure':
      'Conversion pressure detected',
    'shareAffiliateReports.decisionOverview.value.withdrawalPressure':
      'Withdrawal pressure detected',
    'shareAffiliateReports.decisionOverview.value.profitabilityPressure':
      'Profitability pressure detected',
    'shareAffiliateReports.decisionOverview.value.aboveAvg': 'Above Top 20 average',
    'shareAffiliateReports.decisionOverview.value.inlineAvg': 'In line with Top 20 average',
    'shareAffiliateReports.decisionOverview.value.belowAvg': 'Below Top 20 average',
    'shareAffiliateReports.decisionOverview.value.review30': 'Review in 30 days',
    'shareAffiliateReports.decisionOverview.value.review60': 'Review in 60 days',
    'shareAffiliateReports.decisionOverview.value.review90': 'Review in 90 days',
    'shareAffiliateReports.decisionNotes.verdictLabel': 'Executive verdict',
    'shareAffiliateReports.decisionNotes.driversLabel': 'Performance drivers',
    'shareAffiliateReports.decisionNotes.risksLabel': 'Risks & conditions',
    'shareAffiliateReports.decisionNotes.actionLabel': 'Action guidance',
    'shareAffiliateReports.decisionNotes.verdict.template':
      '{impact} contributor with {efficiency} and {profitability}.',
    'shareAffiliateReports.decisionNotes.verdict.templateMonitor':
      '{impact} contributor with {efficiency} under monitoring.',
    'shareAffiliateReports.decisionNotes.fragment.impact.highImpact': 'High-impact',
    'shareAffiliateReports.decisionNotes.fragment.impact.solid': 'Solid',
    'shareAffiliateReports.decisionNotes.fragment.impact.moderate': 'Moderate',
    'shareAffiliateReports.decisionNotes.fragment.efficiency.strong': 'strong efficiency',
    'shareAffiliateReports.decisionNotes.fragment.efficiency.mixed': 'mixed efficiency',
    'shareAffiliateReports.decisionNotes.fragment.efficiency.weak': 'weak efficiency',
    'shareAffiliateReports.decisionNotes.fragment.profitability.stable': 'stable profitability',
    'shareAffiliateReports.decisionNotes.fragment.profitability.underPressure':
      'profitability under pressure',
    'shareAffiliateReports.decisionNotes.driver.netDepositsHigh': 'High net deposits share',
    'shareAffiliateReports.decisionNotes.driver.netDepositsMeaningful':
      'Meaningful net deposits share',
    'shareAffiliateReports.decisionNotes.driver.netDepositsModerate': 'Moderate net deposits share',
    'shareAffiliateReports.decisionNotes.driver.efficiencyAbove': 'Efficiency above peer average',
    'shareAffiliateReports.decisionNotes.driver.efficiencyInline':
      'Efficiency in line with peer average',
    'shareAffiliateReports.decisionNotes.driver.efficiencyBelow': 'Efficiency below peer average',
    'shareAffiliateReports.decisionNotes.driver.trajectory': 'Trajectory {value}',
    'shareAffiliateReports.decisionNotes.risk.rankSoftening': 'Rank softening',
    'shareAffiliateReports.decisionNotes.action.scaleSelectively':
      'Scale selectively while maintaining traffic quality',
    'shareAffiliateReports.decisionNotes.action.maintainMonitor':
      'Maintain exposure and monitor efficiency',
    'shareAffiliateReports.decisionNotes.action.delayConversion':
      'Delay scaling pending conversion improvement',
    'shareAffiliateReports.decisionNotes.action.holdProfitability':
      'Hold scaling pending profitability stabilization',
    'shareAffiliateReports.decisionNotes.action.monitorWithdrawals':
      'Maintain exposure and monitor withdrawal pressure',
    'shareAffiliateReports.decisionNotes.action.holdMonitor': 'Hold scaling and monitor closely',

    // Report Analysis
    'analysis.header.label': 'Analysis',
    'analysis.header.title': 'Analysis',
    'analysis.header.subtitle': 'Select analysis and apply year/month filters.',
    'analysis.tabs.comments': 'Comment Report',
    'analysis.tabs.bots': 'Bot Users',
    'analysis.kpi.validTransfers': 'Valid transfers',
    'analysis.kpi.uniqueUsers': 'Unique users',
    'analysis.kpi.affiliatesInvolved': 'Affiliates involved',
    'analysis.kpi.economicImpact': 'Economic impact (from {id})',
    'analysis.kpi.economicImpactHelper': '{count} users × {cpa}',
    'analysis.chart.ranking': 'Ranking',
    'analysis.chart.top10Inbound': 'Top 10 Inbound',
    'analysis.chart.top10InboundSubtitle': 'Affiliates that received most users',
    'analysis.chart.top10Outbound': 'Top 10 Outbound',
    'analysis.chart.top10OutboundSubtitle': 'Affiliates that lost most users',
    'analysis.chart.top10Net': 'Top 10 Net',
    'analysis.chart.top10NetSubtitle': 'User balance per affiliate',
    'analysis.chart.top15Flows': 'Top 15 flows from → to',
    'analysis.chart.top15FlowsSubtitle': 'Main transfer pairs',
    'analysis.bots.eyebrow': 'Bots',
    'analysis.bots.title': 'Bot Users Analysis',
    'analysis.bots.description':
      'Ready layout: connect the bot dataset here to replicate KPIs and Top 10.',
    'analysis.bots.details':
      'Connect the bot file/endpoint to calculate bot users, volumes and flows. We can reuse the same schema (year/month filters, Top10 with charts and economic impact) as soon as the dataset is available.',
    'analysis.loading': 'Loading analysis…',
    'analysis.error.parsing': 'Error parsing comments.csv file',
    'analysis.error.loading': 'Error loading comments.csv',
    'analysis.noData': 'No data available.',
    'sidebar.roadmap': 'Mega-Stories',
    'sidebar.weeklyMap': 'Weekly Map',
    'sidebar.weeklyExecutionHistory': 'Weekly Execution History',
    'sidebar.orgChart': 'Org Chart',
    'sidebar.supportUserCheck': 'Support • User Check',
    'sidebar.upload': 'Upload',

    // Weekly Execution History
    'weeklyExecutionHistory.header.label': 'Ops memory',
    'weeklyExecutionHistory.header.title': 'Weekly Execution History',
    'weeklyExecutionHistory.header.subtitle':
      'Read-only log of planned vs completed work, week by week.',
    'weeklyExecutionHistory.header.weekRange': 'Week {start} → {end}',
    'weeklyExecutionHistory.filters.week': 'Week',
    'weeklyExecutionHistory.filters.currentBadge': '(current)',
    'weeklyExecutionHistory.sections.planned': 'Planned',
    'weeklyExecutionHistory.sections.done': 'Done',
    'weeklyExecutionHistory.empty': 'No history entries.',

    // Login
    'login.pill': 'Management + Finance + Support access',
    'login.title': 'Bullwaves Intelligence',
    'login.subtitle': 'Enter your work email to continue. Passwords are not required.',
    'login.workEmail': 'Work email',
    'login.placeholder': 'you@bullwaves.com',
    'login.hint':
      'Only Management, Finance, or Support emails from the org chart will be accepted.',
    'login.continue': 'Continue',
    'login.viewOrgChart': 'View Organization Chart ↗',
    'login.allowlistDepartments': 'Departments that can log in',
    'login.allowlistDepartmentsAria': 'Allowlisted departments',

    'login.typing.welcome': 'Welcome to Bullwaves Intelligence',
    'login.typing.access': 'Management + Finance + Support access',
    'login.typing.allowlist': 'Email allowlist enforced',
    'login.error.unable': 'Unable to log in.',

    // Auth
    'auth.emailNotAllowlisted':
      'Email not found in the allowlist (Management + Finance + Support).',

    // Languages
    'lang.label': 'Language',

    // Common
    'common.show': 'Show',
    'common.viewDetails': 'View details',
    'common.hide': 'Hide',
    'common.all': 'All',
    'common.info': 'Info',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.resetFilters': 'Reset filters',
    'common.selectEllipsis': 'Select…',
    'common.month': 'month',
    'common.months': 'months',
    'common.na': 'N/A',
    'common.loading': 'Please wait…',

    // Trader Points
    'traderPoints.page.title': 'Trader Points — Simulation and impact',
    'traderPoints.page.subtitle': 'Activity · Risk · Retention',
    'traderPoints.dataSource.label': 'Data source',
    'traderPoints.dataSource.console': 'Console',
    'traderPoints.dataSource.csv': 'CSV (diagnostic)',
    'traderPoints.console.loading': 'Loading…',
    'traderPoints.console.supportSource': 'Support (user check) · {count} users',
    'traderPoints.console.mockSource': 'Fallback mock · {count} users',
    'traderPoints.console.mockBadge': 'Using mock data (index unavailable)',
    'traderPoints.console.loadErrorFallback': 'Unable to load support user index',
    'traderPoints.chips.spread': 'Avg spread 0.1 pips',
    'traderPoints.chips.leverage': 'Leverage 1:500',

    'traderPoints.exec.title': 'Executive Summary — Decision View',
    'traderPoints.exec.retention.label': 'RETENTION',
    'traderPoints.exec.activity.label': 'ACTIVITY',
    'traderPoints.exec.risk.label': 'RISK',
    'traderPoints.exec.retention.unitDays': 'days',
    'traderPoints.exec.retention.caption': 'Users stay active longer',
    'traderPoints.exec.activity.value': '≈ unchanged',
    'traderPoints.exec.activity.caption': 'Trading pace remains stable',
    'traderPoints.exec.risk.value': 'Controlled',
    'traderPoints.exec.risk.caption': 'No increase in high-risk behavior',
    'traderPoints.exec.causal.line1':
      'The increase in total value comes from users staying active longer,',
    'traderPoints.exec.causal.line2': 'not from trading more aggressively.',
    'traderPoints.exec.mechanics.1': 'Same daily activity → no pressure on users',
    'traderPoints.exec.mechanics.2': 'Longer journey → more completed goals',
    'traderPoints.exec.mechanics.3': 'Commission-linked rewards → predictable cost',
    'traderPoints.exec.takeaway.title': 'Executive takeaway',
    'traderPoints.exec.takeaway.text':
      'At equal cost, goal-based incentives improve retention by increasing participation, not intensity.',

    'traderPoints.deepDive.title': 'Deep dive',
    'traderPoints.section.whatChanges': 'What changes',
    'traderPoints.deltaVs': 'Δ vs {baseline} · {oneLiner}',
    'traderPoints.baseline.label': 'Baseline',
    'traderPoints.baseline.noIncentive': 'No incentive',
    'traderPoints.baseline.classicBonus': 'Classic bonus',
    'traderPoints.baseline.tpDefault': 'Trader Points (default)',
    'traderPoints.baseline.oneLiner.classicBonus':
      'The classic bonus tends to create a short-term activity spike with fast decay.',
    'traderPoints.baseline.oneLiner.noIncentive': 'Observed baseline (historical).',
    'traderPoints.baseline.oneLiner.tpDefault': 'Goal-based baseline (progressive engagement).',
    'traderPoints.baseline.tooltip.label': 'Baseline definitions',
    'traderPoints.baseline.tooltip.title': 'Baseline',
    'traderPoints.baseline.tooltip.noIncentive.title': 'No incentive',
    'traderPoints.baseline.tooltip.noIncentive.desc': 'Observed behavior (historical).',
    'traderPoints.baseline.tooltip.classicBonus.title': 'Classic bonus',
    'traderPoints.baseline.tooltip.classicBonus.desc':
      'Rule-based spike+decay assumptions (not derived from regressions).',
    'traderPoints.baseline.tooltip.tp.title': 'Trader Points',
    'traderPoints.baseline.tooltip.tp.desc': 'Goal-based baseline with progressive engagement.',

    'traderPoints.narrativeBridge.title': 'Same pace, longer journey',
    'traderPoints.narrativeBridge.line1': 'Daily activity stays almost unchanged.',
    'traderPoints.narrativeBridge.line2': 'What changes is how long users remain active.',
    'traderPoints.narrativeBridge.line3': 'Time × consistency drive total points.',
    'traderPoints.narrativeBridge.formula.totalPoints': 'Total Points',
    'traderPoints.narrativeBridge.formula.dailyActivity': 'Daily Activity',
    'traderPoints.narrativeBridge.formula.activeDays': 'Active Days',

    'traderPoints.scenarioControls.title': 'Scenario controls',
    'traderPoints.scenarioControls.subtitle': 'Tune incentives and guardrails.',
    'traderPoints.chart.ppdTitle': 'Positions/day distribution',

    'traderPoints.economicLogic.title': 'Economic logic (constant cost)',
    'traderPoints.economicLogic.bullet1': 'Bonuses are earned via commissions, not gifted',
    'traderPoints.economicLogic.bullet2': 'Progress speed changes reachability, not bonus value',
    'traderPoints.economicLogic.bullet3': 'Retention grows from participation, not pressure',

    'traderPoints.why.title': 'Why it happens',
    'traderPoints.why.tooltip.label': 'Why goal-based incentives work',
    'traderPoints.why.tooltip.title': 'Why goal-based incentives work',
    'traderPoints.why.tooltip.desc': 'Compare behaviors and goal reachability.',
    'traderPoints.why.heading': 'Why goal-based incentives work',
    'traderPoints.why.bullet1': 'More users enter the goal-based journey',
    'traderPoints.why.bullet2': 'Fewer users drop out before completion',
    'traderPoints.why.bullet3': 'Retention grows from participation, not pressure',

    'traderPoints.reachability.micro': 'Makes the goal feel reachable',

    'traderPoints.whyDynamic.guardrail':
      'In this scenario, high-risk users are excluded from unlock eligibility.',
    'traderPoints.whyDynamic.faster': 'In this scenario, progress “feels” faster (×{mult}).',
    'traderPoints.whyDynamic.slower': 'In this scenario, progress “feels” slower (×{mult}).',
    'traderPoints.whyDynamic.targetCloser':
      'In this scenario, the goal “feels” closer (faster gratification).',
    'traderPoints.whyDynamic.targetFarther':
      'In this scenario, the goal “feels” farther (longer journey).',
    'traderPoints.whyDynamic.unlockRate':
      'In this scenario, ~{pct}% of users are assumed to be targeted by the goal.',
    'traderPoints.whyDynamic.bonusValue':
      'In this scenario, the final reward value is set to {amount}.',
    'traderPoints.whyDynamic.default':
      'In this scenario, goal reachability and target distance are close to the baseline.',

    'traderPoints.optional.reliability': 'Reliability (optional)',
    'traderPoints.optional.datasetOverview': 'Dataset overview (optional)',
    'traderPoints.optional.tables': 'Deep-dive tables (optional)',
    'traderPoints.optional.export': 'Export (optional)',

    'traderPoints.export.snapshotCsv': 'Export snapshot (CSV)',
    'traderPoints.export.snapshotJson': 'Export snapshot (JSON)',
    'traderPoints.export.ppdCsv': 'Export PPD (CSV)',

    // Scenario Controls
    'traderPoints.controls.preset.title': 'Preset',
    'traderPoints.controls.preset.micro': 'Logic: goal is commission-linked.',
    'traderPoints.controls.preset.custom': 'Custom',
    'traderPoints.controls.preset.commissionOnly': 'Commission-only',
    'traderPoints.controls.preset.commissionOnly.sub':
      'Baseline: commission-linked goal (€200) with standard guardrails.',
    'traderPoints.controls.preset.goal500': 'Goal €500',
    'traderPoints.controls.preset.goal500.sub':
      'Higher goal (€500) with moderate reachability boost (×1.5) and wider participation.',
    'traderPoints.controls.preset.acceleratedPromo': 'Accelerated promo',
    'traderPoints.controls.preset.acceleratedPromo.sub':
      'Promotional acceleration (×4) with €500 goal; shows upper-bound reachability effect.',
    'traderPoints.controls.preset.tooltip.label': 'Preset',
    'traderPoints.controls.preset.tooltip.title': 'Preset',
    'traderPoints.controls.preset.tooltip.desc':
      'These presets change only scenario controls and UI copy.',
    'traderPoints.controls.preset.whatMeans': 'What it means:',

    'traderPoints.controls.reachability.label': 'Goal reachability',
    'traderPoints.controls.reachability.tooltip.desc':
      'It does NOT change how points are earned. It only changes perceived goal reachability.',
    'traderPoints.controls.reachability.delta.more':
      'With ×{mult}, about {pct}% more users reach the goal threshold (before unlock rate).',
    'traderPoints.controls.reachability.delta.less':
      'With ×{mult}, about {pct}% fewer users reach the goal threshold (before unlock rate).',

    'traderPoints.controls.goal.label': 'Goal (Trader Points)',
    'traderPoints.controls.goal.tooltip.label': 'Required points',
    'traderPoints.controls.goal.tooltip.title': 'Goal threshold',
    'traderPoints.controls.goal.tooltip.line1':
      'Trader Points represent real commissions generated by the user.',
    'traderPoints.controls.goal.tooltip.line2': 'Example: €200 bonus → 200 Trader Points goal.',
    'traderPoints.controls.goal.micro':
      'The goal is commission-linked (1 TP ≈ €1). Higher goals reduce reachability.',
    'traderPoints.controls.goal.linkLabel': 'Link goal and bonus cost',

    'traderPoints.controls.bonus.label': 'Bonus amount',
    'traderPoints.controls.bonus.tooltip.label': 'Bonus amount',
    'traderPoints.controls.bonus.tooltip.title': 'Bonus amount',
    'traderPoints.controls.bonus.tooltip.line1': 'The bonus is the economic cost (e.g. €200).',
    'traderPoints.controls.bonus.tooltip.line2':
      'In the classic setup, goal points match the bonus (commission-linked).',
    'traderPoints.controls.bonus.micro':
      'The bonus is earned by generating equivalent commissions (Trader Points).',

    'traderPoints.controls.unlockRate.label': 'Unlock rate (%)',
    'traderPoints.controls.unlockRate.tooltip.label': 'Unlock rate',
    'traderPoints.controls.unlockRate.tooltip.title': 'Unlock rate (%)',
    'traderPoints.controls.unlockRate.tooltip.line1': 'Share of users targeted by the goal.',
    'traderPoints.controls.unlockRate.tooltip.line2':
      'Used for behavioral simulation, not for real payout.',
    'traderPoints.controls.unlockRate.helper.base':
      '{pct}% of users are assumed to be targeted by the goal.',
    'traderPoints.controls.unlockRate.helper.guardrail':
      '{base} Guardrail reduces eligibility for high-risk users.',
    'traderPoints.controls.unlockRate.helper.baseline': '{base} Baseline participation share.',
    'traderPoints.controls.unlockRate.helper.wider':
      '{base} Broader participation → larger system-level effect.',
    'traderPoints.controls.unlockRate.helper.narrower':
      '{base} Narrower participation → smaller system-level effect.',

    'traderPoints.controls.guardrail.label': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.label': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.title': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.line1': 'Avoids incentivizing high-risk behavior.',
    'traderPoints.controls.guardrail.tooltip.line2':
      'High-risk users are excluded from unlock eligibility (internal risk proxy).',
    'traderPoints.controls.guardrail.badge': 'Scenario filtered by risk',
    'traderPoints.controls.guardrail.micro.on':
      'High-risk users are excluded from unlock eligibility.',
    'traderPoints.controls.guardrail.micro.off': 'All eligible users are considered for unlock.',

    // CSV Uploader
    'traderPoints.csvUploader.title': '1. Upload positions report',
    'traderPoints.csvUploader.rowsLoaded': 'Rows loaded: {count}',
    'traderPoints.csvUploader.rowsSkipped': ' | Rows skipped: {count}',

    // KPI Cards
    'traderPoints.kpi.activity.label': 'Average activity',
    'traderPoints.kpi.activity.unit': 'trades/day',
    'traderPoints.kpi.retention.label': 'Average retention',
    'traderPoints.kpi.retention.unit': 'days',
    'traderPoints.kpi.risk.label': 'Average risk',
    'traderPoints.kpi.risk.unit': 'risk',
    'traderPoints.kpi.deltaLine': 'Δ vs {baseline} · New {value} {delta}',
    'traderPoints.kpi.activity.line': 'Users trade more consistently when progress feels real.',
    'traderPoints.kpi.retention.line': 'Users stay longer when progress toward a goal is visible.',
    'traderPoints.kpi.risk.line.guardrail': 'Guardrails avoid incentivizing high-risk behavior.',
    'traderPoints.kpi.risk.line.noGuardrail':
      'Risk can rise when stronger incentives increase exposure.',

    // Legacy (CSV mode)
    'traderPoints.legacy.avgTradesPerUser': 'Avg trades/user',
    'traderPoints.legacy.riskIndicator': 'Risk indicator',
    'traderPoints.legacy.activeDays': 'Active days',

    // Working set
    'traderPoints.workingSet.activeSample': 'Active sample',
    'traderPoints.workingSet.tooltip.rules.label': 'Working set rules',
    'traderPoints.workingSet.tooltip.rules.title': 'Active users filter',
    'traderPoints.workingSet.tooltip.rules.deposits': 'deposits > 0',
    'traderPoints.workingSet.tooltip.rules.positions': 'positions > 0',
    'traderPoints.workingSet.tooltip.rules.age': 'account age > 1 day',
    'traderPoints.workingSet.avgPositions': 'Average positions (count)',
    'traderPoints.workingSet.tooltip.positions.label': 'Positions count info',
    'traderPoints.workingSet.tooltip.positions.title': 'What are “positions”?',
    'traderPoints.workingSet.tooltip.positions.desc':
      'It is the report column with the total historical positions/trades count, not “open positions right now”.',
    'traderPoints.workingSet.medianLabel': 'Median {value}',
    'traderPoints.workingSet.ppdMedianZone': 'Positions/day (median zone)',
    'traderPoints.workingSet.tooltip.ppd.label': 'Positions/day definitions',
    'traderPoints.workingSet.tooltip.ppd.title': 'Positions/day',
    'traderPoints.workingSet.tooltip.ppd.formula':
      'PPD = positions / daysSince(qualification or first deposit)',
    'traderPoints.workingSet.tooltip.ppd.zone':
      'The “median zone” keeps values near the median (Gauss-like via MAD σ) to reduce outlier impact.',
    'traderPoints.workingSet.keptLine': 'Kept {keptPct}% · Median {median}',
    'traderPoints.workingSet.rawLine': 'Raw mean {rawMean} · Global {globalMean}',
    'traderPoints.workingSet.lifetime': 'Lifetime (days)',
    'traderPoints.workingSet.tooltip.lifetime.label': 'Lifetime definitions',
    'traderPoints.workingSet.tooltip.lifetime.title': 'Definitions',
    'traderPoints.workingSet.tooltip.lifetime.account':
      'Account lifetime: days since registration.',
    'traderPoints.workingSet.tooltip.lifetime.trader':
      'Trader lifetime: days since qualification/first deposit (if available).',
    'traderPoints.workingSet.traderLifetimeLine': 'Trader lifetime {days} · {pct}% available',

    // Regression Summary
    'traderPoints.regression.title': 'Signal reliability (directional)',
    'traderPoints.regression.tooltip.label': 'Signal reliability',
    'traderPoints.regression.tooltip.title': 'Signal reliability (directional)',
    'traderPoints.regression.tooltip.desc':
      'These estimates are for direction and relative impact, not for point forecasting.',
    'traderPoints.regression.tooltip.note': 'Decision support — not per-user estimation.',
    'traderPoints.regression.metric.activity': 'Activity',
    'traderPoints.regression.metric.risk': 'Risk',
    'traderPoints.regression.metric.retention': 'Retention',
    'traderPoints.regression.r2Label.low': 'Low signal — direction only',
    'traderPoints.regression.r2Label.weak': 'Weak',
    'traderPoints.regression.r2Label.medium': 'Medium',
    'traderPoints.regression.r2Label.strong': 'Strong',
    'traderPoints.regression.avgError': 'Average error (real units): {value}',
    'traderPoints.regression.maeText.activity': '±{value} trades/day',
    'traderPoints.regression.maeText.retention': '±{value} days',
    'traderPoints.regression.maeText.risk': '±{value} risk units',

    // Impact Breakdown
    'traderPoints.impact.whereRetentionTitle': 'Where retention actually comes from',
    'traderPoints.impact.micro': 'How average retention changes when goal reachability increases.',
    'traderPoints.impact.howCalc.label': 'How it is calculated',
    'traderPoints.impact.howCalc.title': 'How this number is calculated',
    'traderPoints.impact.howCalc.step1': '1) Some users reach the goal threshold (eligible).',
    'traderPoints.impact.howCalc.step2':
      '2) A share of eligible users enters the goal journey (unlock rate).',
    'traderPoints.impact.howCalc.step3':
      '3) Average retention grows mainly because more users participate in the goal journey, not because users become more “intense” or take more risk.',
    'traderPoints.impact.reachability': 'Reachability',
    'traderPoints.impact.eligibleUsers': 'Eligible users',
    'traderPoints.impact.eligibleDesc': 'Reach the goal threshold at the current pace.',
    'traderPoints.impact.unlockedUsers': 'Unlocked users',
    'traderPoints.impact.unlockedDesc': 'Enter the goal journey.',
    'traderPoints.impact.definitions':
      'Definitions: eligible = reach the threshold. unlocked = eligible who enter the goal journey (unlock rate).',
    'traderPoints.impact.retention': 'Retention',
    'traderPoints.impact.retentionBaseline': 'Average retention (baseline)',
    'traderPoints.impact.retentionScenario': 'Average retention (scenario)',
    'traderPoints.impact.retentionUplift': 'Average retention uplift',
    'traderPoints.impact.compositionTitle': 'Uplift from unlocked share (composition effect)',
    'traderPoints.impact.compositionDesc': 'With more speed, more users enter the goal journey.',
    'traderPoints.impact.perUserTitle': 'Uplift on already-unlocked users (per-user effect)',
    'traderPoints.impact.perUserDesc':
      'Users who would have unlocked even at ×1 still feel closer to completion.',
    'traderPoints.impact.sanity.title': 'Model sanity check (optional)',
    'traderPoints.impact.sanity.note':
      'Audit-only: verifies internal consistency of the scenario math.',
    'traderPoints.impact.sanity.avgPointsBefore': 'Avg points (before)',
    'traderPoints.impact.sanity.avgPointsAfter': 'Avg points (after)',
    'traderPoints.impact.sanity.aboveThreshold1x': 'Above threshold (×1)',
    'traderPoints.impact.sanity.aboveThresholdMx': 'Above threshold (×{mult})',
    'traderPoints.impact.sanity.footer':
      'Before/after use the same threshold and unlock rate; only reachability changes.',

    // Tables
    'traderPoints.tables.unknownUser': 'Unknown',
    'traderPoints.tables.idPrefix': 'ID',
    'traderPoints.tables.symbolsTop': 'Top symbols',
    'traderPoints.tables.symbolsTooltip.label': 'Symbols context',
    'traderPoints.tables.symbolsTooltip.title': 'How it is calculated',
    'traderPoints.tables.symbolsTooltip.line1':
      'In user-centric mode we use a global symbols distribution (weight %).',
    'traderPoints.tables.symbolsTooltip.line2':
      '“Estimated points” is a proportional estimate based on the symbol weight.',
    'traderPoints.tables.col.symbol': 'Symbol',
    'traderPoints.tables.col.weight': 'Weight',
    'traderPoints.tables.col.estimatedPoints': 'Estimated points',
    'traderPoints.tables.usersTop': 'Top users',
    'traderPoints.tables.topByPositions': 'Top by positions',
    'traderPoints.tables.usersLow': 'Low users',
    'traderPoints.tables.col.user': 'User',
    'traderPoints.tables.col.positions': 'Positions',
    'traderPoints.tables.col.points': 'Points',
    'traderPoints.tables.pointsFloored': '(floored to 0)',

    // Chart tooltip/aria
    'traderPoints.chart.tooltip.label': 'Chart details',
    'traderPoints.chart.tooltip.title': 'What it shows',
    'traderPoints.chart.tooltip.line1':
      'The curve is a smooth reference built from the median and a robust dispersion estimate.',
    'traderPoints.chart.tooltip.line2':
      'The X axis is clipped (p1–p99 or around the median) so long tails do not squash the histogram.',
    'traderPoints.chart.stats': 'N={n} · median≈{mu} · dispersion≈{sigma}',
    'traderPoints.chart.aria': 'Histogram of positions per day with gaussian curve',
    'traderPoints.chart.medianLabel': 'median',

    'common.keys.enter': 'Enter',

    // Report
    'report.loader.data': 'Loading report data…',
    'report.period.global': 'Global',
    'report.period.annual': 'Annual {year}',
    'report.period.monthly': 'Monthly {month}',
    'report.period.monthlyFallback': 'Monthly',

    'report.header.label': 'Report',
    'report.header.title': 'Quick period report',
    'report.header.subtitle': 'A compact overview by period. KPIs + top affiliates.',

    'report.modes.monthly': 'Monthly',
    'report.modes.annual': 'Annual',
    'report.modes.global': 'Global',

    'report.filters.month': 'Month',
    'report.filters.noMonths': 'No months available',

    'report.summary.periodLabel': 'Period',
    'report.summary.rowsLine': '{media} media rows · {payments} payments',
    'report.summary.sourceLine': 'Source: Media Report + Payments/Commissions',

    'report.kpis.cpaHint': 'Payments / FTD',
    'report.kpis.arpuHint': 'PL / registrations',
    'report.kpis.profitHint': 'PL - payments',
    'report.kpis.roiHint': 'Profit / payments',
    'report.kpis.volumeHint': 'Registrations and FTD',

    'report.topAffiliates.title': 'Top affiliates (8)',
    'report.topAffiliates.subtitle': 'Ordered by profit · Source: media+payments',

    'report.table.headers.affiliate': 'Affiliate',
    'report.table.headers.reg': 'Reg',
    'report.table.headers.ftd': 'FTD',
    'report.table.headers.cpa': 'CPA',
    'report.table.headers.arpu': 'ARPU',
    'report.table.headers.roi': 'ROI',
    'report.table.headers.profit': 'Profit',
    'report.table.headers.breakEven': 'Break-even',
    'report.table.empty.noDataForPeriod': 'No data for the selected period',
    'report.table.breakEvenMonths': '{count} months',

    'report.exportNotes.title': 'Export notes',
    'report.exportNotes.subtitle': 'Layout base ready to add an export button',
    'report.exportNotes.item1': 'Clear layout and table already sorted by profit.',
    'report.exportNotes.item2':
      'Period filter: global (all data), annual (current year), monthly (selected month).',
    'report.exportNotes.item3':
      'Key metrics: CPA, ARPU, profit, volume (reg/FTD), estimated break-even.',
    'report.exportNotes.item4':
      'Ready to connect an export button (PDF/CSV) without redesigning the layout.',

    // Departments
    'departments.Infrastructure': 'Infrastructure',
    'departments.Product': 'Product',
    'departments.Data': 'Data',
    'departments.Compliance': 'Compliance',
    'departments.UX': 'UX',
    'departments.Partners': 'Partners',

    // Ongoing (Execution Board)
    'ongoing.confirm.resetToSeed':
      'This will overwrite local changes and reset to seed data. Continue?',
    'ongoing.placeholder.example': 'e.g., Net deposits, registrations, churn',

    'ongoing.header.layerLabel': 'Execution layer',
    'ongoing.header.title': 'Execution Board',
    'ongoing.header.subtitle': 'Active tasks tied to 2026 Roadmap mega-stories and stories.',

    'ongoing.counters.active': '{count} active',
    'ongoing.counters.blocked': '{count} blocked',
    'ongoing.counters.done': '{count} done',

    'ongoing.actions.resetToSeed': 'Reset to seed',
    'ongoing.actions.markAsDone': 'Mark as done',

    'ongoing.toggle.active': 'Active',
    'ongoing.toggle.done': 'Done',

    'ongoing.kpis.activeExecution': 'Active execution',
    'ongoing.kpis.active': 'Active',
    'ongoing.kpis.blocked': 'Blocked',
    'ongoing.kpis.doneHistory': 'Done / History',

    'ongoing.filters.megaStory': 'Mega-Story',
    'ongoing.filters.story': 'Story',
    'ongoing.filters.department': 'Department',
    'ongoing.filters.platformArea': 'Platform area',
    'ongoing.filters.status': 'Status',

    'ongoing.feed.historyLabel': 'History',
    'ongoing.feed.executionFeedLabel': 'Execution feed',
    'ongoing.feed.completedTasksTitle': 'Completed tasks',
    'ongoing.feed.activeExecutionTitle': 'Active execution',
    'ongoing.feed.itemsCount': '{count} items',

    'ongoing.card.created': 'Created {date}',
    'ongoing.card.completed': 'Completed {date}',

    'ongoing.labels.nextStep': 'Next step',
    'ongoing.labels.blocker': 'Blocker',
    'ongoing.labels.impact': 'Impact',

    'ongoing.empty.noTasksMatchFilters': 'No tasks match the current filters.',

    'ongoing.details.title': 'Details',
    'ongoing.details.panelTitle': 'Details panel',
    'ongoing.details.selectTask': 'Select a task to see details.',
    'ongoing.details.objective': 'Objective',
    'ongoing.details.nextStep': 'Next step',
    'ongoing.details.dependenciesBlockers': 'Dependencies / blockers',
    'ongoing.details.created': 'Created',
    'ongoing.details.impact': 'Impact',
    'ongoing.details.capturedWhenDone': 'Captured when marked done.',
    'ongoing.details.kpi': 'KPI',
    'ongoing.details.note': 'Note',
    'ongoing.details.completedOn': 'Completed on {date}',

    'ongoing.modal.title': 'Mark as done',
    'ongoing.modal.impactType': 'Impact type',
    'ongoing.modal.selectImpactType': 'Select impact type',
    'ongoing.modal.impactedDepartment': 'Impacted department',
    'ongoing.modal.selectDepartment': 'Select department',
    'ongoing.modal.impactedPlatformArea': 'Impacted platform area',
    'ongoing.modal.selectPlatformArea': 'Select area',
    'ongoing.modal.impactedKpi': 'Impacted KPI',
    'ongoing.modal.impactNoteOptional': 'Impact note (optional)',
    'ongoing.modal.saveImpactClose': 'Save impact & close',

    'ongoing.triage.needsTriage': 'Needs triage',
    'ongoing.triage.mappingFixesRequired': 'Mapping fixes required',
    'ongoing.triage.selectMegaStory': 'Select mega-story',
    'ongoing.triage.selectStory': 'Select story',
    'ongoing.triage.saveMapping': 'Save mapping',
    'ongoing.triage.noMega': 'no mega',
    'ongoing.triage.noStory': 'no story',
    'ongoing.triage.reasonLabel': 'Reason',
    'ongoing.triage.noTasks': 'No tasks need triage.',
    'ongoing.triage.reason.unknownMegaStoryId': 'Unknown megaStoryId',
    'ongoing.triage.reason.unknownStoryId': 'Unknown storyId',
    'ongoing.triage.reason.storyNotUnderMegaStoryId': 'storyId not under megaStoryId',

    'ongoing.status.active': 'Active',
    'ongoing.status.blocked': 'Blocked',
    'ongoing.status.done': 'Done',

    'ongoing.priority.high': 'High',
    'ongoing.priority.medium': 'Medium',
    'ongoing.priority.low': 'Low',

    'ongoing.impactType.revenue': 'Revenue',
    'ongoing.impactType.retention': 'Retention',
    'ongoing.impactType.risk_reduction': 'Risk reduction',
    'ongoing.impactType.efficiency': 'Efficiency',

    'ongoing.platformArea.Trading': 'Trading',
    'ongoing.platformArea.Analytics': 'Analytics',
    'ongoing.platformArea.Payments': 'Payments',
    'ongoing.platformArea.Infra': 'Infra',
    'ongoing.platformArea.Profile': 'Profile',
    'ongoing.platformArea.Internal': 'Internal',

    // Topbar
    'topbar.aria.toggleNavMenu': 'Toggle navigation menu',
    'topbar.aria.toggleSidebar': 'Toggle sidebar',

    // Support (page-level)
    'support.loader.page': 'Loading support page…',

    // Investments
    'investments.loader.data': 'Loading investments data…',
    'investments.header.title': 'Affiliate Payments – Affiliate Payout Ledger',
    'investments.header.subtitle':
      'End-of-month affiliate costs based on Qualified FTD, CPA and ROI.',
    'investments.filters.month': 'Month',
    'investments.filters.allMonths': 'All months',
    'investments.badge.monthlyRows': '{count} monthly rows',

    'investments.kpi.totalQftd': 'Total QFTD',
    'investments.kpi.avgCpa': 'Avg CPA',
    'investments.kpi.totalCommissions': 'Total commissions',
    'investments.kpi.commissionPayable': 'Commission payable',
    'investments.kpi.commissionsDeferred': 'Commissions deferred',
    'investments.kpi.roi': 'ROI',
    'investments.kpi.paid': 'Paid',

    'investments.section.payoutTimeline': 'Payout timeline',
    'investments.section.affiliatePayoutSummary': 'Affiliate payout summary',

    'investments.search.placeholder': 'Search affiliate',
    'investments.search.aria': 'Search affiliate',

    'investments.table.header.affiliate': 'Affiliate',
    'investments.table.header.cpa': 'CPA',
    'investments.table.header.totalQftd': 'Total QFTD',
    'investments.table.header.paidFiltered': 'Paid (filtered)',
    'investments.table.header.pl': 'PL',
    'investments.table.header.currentMonthCommission': 'Current month comm.',
    'investments.table.header.financeConfirmed': 'Finance confirmed',
    'investments.table.header.lastMonth': 'Last month',
    'investments.table.header.details': 'Details',
    'investments.table.title.paidFiltered': 'Paid amounts within current filters',
    'investments.table.row.totals': 'Totals (filters)',

    'investments.input.title.overrideCpa': 'Override CPA for this affiliate',
    'investments.checkbox.title.financeConfirmed': 'Mark as confirmed by finance',
    'investments.button.details': 'Details',

    'investments.details.header.month': 'Month',
    'investments.details.header.reg': 'Reg',
    'investments.details.header.ftd': 'FTD',
    'investments.details.header.qftd': 'QFTD',
    'investments.details.header.netDeposits': 'Net Deposits',
    'investments.details.header.commissions': 'Commissions',
    'investments.details.header.pl': 'PL',
    'investments.details.header.roi': 'ROI',
    'investments.details.header.cpa': 'CPA',
    'investments.details.header.commExpected': 'Comm expected',
    'investments.details.header.commActual': 'Comm actual',
    'investments.details.header.commPayable': 'Comm payable',
    'investments.details.header.commDeferred': 'Comm deferred',
    'investments.details.header.paid': 'Paid',
    'investments.details.header.paymentDate': 'Payment date',
    'investments.details.header.details': 'Details',

    'investments.details.title.roiFormula': 'ROI = Net Deposits / Commission',
    'investments.details.title.commExpected': 'Expected = commission from Media Report',
    'investments.details.title.commActual':
      'Actual uses ROI guardrail: if ROI >= 1.5 use expected, else Net Deposits / 1.5',
    'investments.details.title.commPayable': 'Payable = min(expected, actual)',
    'investments.details.title.commDeferred': 'Deferred = expected − payable',
    'investments.details.empty.noMonthlyRows': 'No monthly rows.',
    'investments.table.empty.noAffiliates': 'No affiliates for current filters.',
    'investments.button.showTop10': 'Show top 10',
    'investments.button.showAll': 'Show all ({count})',

    // Weekly map
    'weeklyMap.placeholders.weeklyTaskTitle': 'Weekly task title',
    'weeklyMap.placeholders.owner': 'Owner',
    'weeklyMap.placeholders.expectedImpact': 'Why it matters this week',

    'weeklyMap.columns.planned': 'Planned',
    'weeklyMap.columns.inProgress': 'In progress',
    'weeklyMap.columns.blocked': 'Blocked',
    'weeklyMap.columns.done': 'Done',

    'weeklyMap.confirm.deleteTask': 'Delete this weekly task?',

    'weeklyMap.header.filteredTitle': 'Weekly Map — filtered by Mega-Story',
    'weeklyMap.header.allTitle': 'Weekly Map (All Mega-Stories)',
    'weeklyMap.header.executionContract': 'Execution contract for the week',
    'weeklyMap.header.weekRange': 'Week {start} → {end}',
    'weeklyMap.header.currentWeekBadge': '(CURRENT WEEK)',
    'weeklyMap.header.archivedReadOnlyBadge': '(archived, read-only)',
    'weeklyMap.header.executionCommitments': 'Execution commitments',
    'weeklyMap.header.tasksCount': '{count} tasks',

    'weeklyMap.filters.week': 'Week',
    'weeklyMap.filters.currentBadge': '(current)',

    'weeklyMap.modal.readOnlyHint': 'Read-only focus mode — use this to prepare decisions.',

    'weeklyMap.card.mega': 'Mega',
    'weeklyMap.card.dept': 'Dept',
    'weeklyMap.card.story': 'Story',

    'weeklyMap.empty.noTasks': 'No tasks',

    'weeklyMap.actions.addCommitmentHint': 'Add a new commitment (current week only)',
    'weeklyMap.actions.hideForm': 'Hide form',
    'weeklyMap.actions.addCommitment': 'Add commitment',
    'weeklyMap.actions.shareLink': 'Share link',
    'weeklyMap.actions.copied': 'Copied',

    'weeklyMap.form.megaStory': 'Mega-Story',
    'weeklyMap.form.title': 'Title',
    'weeklyMap.form.storyOptional': 'Story (optional)',
    'weeklyMap.form.department': 'Department',
    'weeklyMap.form.owner': 'Owner',
    'weeklyMap.form.expectedImpactMandatory': 'Expected impact (mandatory)',

    'weeklyMap.validation.expectedImpactRequired':
      'Without Expected impact, the task can’t be saved.',

    'weeklyMap.checklists.prepareSolitics.title': 'Prepare Solitics call — Checklist',
    'weeklyMap.checklists.prepareStamatis.title': 'Prepare call with Stamatis — Checklist',

    'weeklyMap.checklists.common.useCases.title': 'USE CASES',
    'weeklyMap.checklists.common.dataIntegration.title': 'DATA & INTEGRATION',
    'weeklyMap.checklists.common.decisionMaking.title': 'DECISION-MAKING',
    'weeklyMap.checklists.common.ownershipLimits.title': 'OWNERSHIP & LIMITS',
    'weeklyMap.checklists.common.priorities.title': 'PRIORITIES',
    'weeklyMap.checklists.common.governance.title': 'GOVERNANCE',
    'weeklyMap.checklists.common.roleAutonomy.title': 'ROLE & AUTONOMY',
    'weeklyMap.checklists.common.closure.title': 'CLOSURE',

    'weeklyMap.checklists.common.currentStatus.title': 'CURRENT STATUS',
    'weeklyMap.checklists.common.strategicAlignment.title': 'STRATEGIC ALIGNMENT',
    'weeklyMap.checklists.common.ownershipModel.title': 'OWNERSHIP MODEL',
    'weeklyMap.checklists.common.nextSteps.title': 'NEXT STEPS',

    'weeklyMap.checklists.prepareSolitics.useCases.item1':
      'What concrete user behaviors are we trying to detect?',
    'weeklyMap.checklists.prepareSolitics.useCases.item2':
      'Which retention or churn scenarios matter most right now?',
    'weeklyMap.checklists.prepareSolitics.data.item1':
      'What is the minimum dataset needed to generate value?',
    'weeklyMap.checklists.prepareSolitics.data.item2': 'What can be excluded safely?',
    'weeklyMap.checklists.prepareSolitics.decisions.item1':
      'What decisions should Solitics actively support?',
    'weeklyMap.checklists.prepareSolitics.decisions.item2': 'What remains internal decision logic?',
    'weeklyMap.checklists.prepareSolitics.ownership.item1': 'What Solitics should NOT do?',
    'weeklyMap.checklists.prepareSolitics.ownership.item2':
      'How do we measure success after 30 days?',

    'weeklyMap.checklists.soliticsDecisionSummary.title':
      'Solitics call + decision summary — Notes',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item1':
      'Replica access confirmed; extra Skale sync still pending (owner + timeline).',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item2':
      'Solitics onboarding/dashboard work in progress — NOT live yet.',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item3':
      'Roman is the main interface for execution + follow-ups.',
    'weeklyMap.checklists.soliticsDecisionSummary.alignment.item1':
      'Primary lever: retention (segments + triggers), not generic “nice-to-have” automation.',
    'weeklyMap.checklists.soliticsDecisionSummary.alignment.item2':
      'Success = LTV / repeat deposits / trading activity improvements (start with MVP scope).',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item1':
      'Internal: data/integration, governance, and decision/segment rules (source of truth).',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item2':
      'Marketing: campaign execution, offers/bonuses, messaging, and operational loops.',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item3':
      'Solitics: automation engine + dashboards; no ownership of core business logic.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item1':
      'Confirm final Skale alignment and required data fields.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item2':
      'Share first segments, KPIs, and reporting expectations with Solitics.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item3':
      'Set weekly cadence with Roman + Marketing to close the loop.',

    'weeklyMap.checklists.prepareStamatis.priorities.item1':
      'What is the single top priority for the next 30–60 days?',
    'weeklyMap.checklists.prepareStamatis.priorities.item2':
      'What can explicitly be deprioritized?',
    'weeklyMap.checklists.prepareStamatis.governance.item1':
      'Who decides what enters or exits the roadmap?',
    'weeklyMap.checklists.prepareStamatis.governance.item2':
      'What defines success or failure of an initiative?',
    'weeklyMap.checklists.prepareStamatis.autonomy.item1':
      'Which decisions can be taken autonomously?',
    'weeklyMap.checklists.prepareStamatis.autonomy.item2': 'When is escalation required?',
    'weeklyMap.checklists.prepareStamatis.closure.item1':
      'What concrete decisions must be taken in this call?',
    'weeklyMap.checklists.prepareStamatis.closure.item2':
      'What follow-up is required after the call?',

    // Affiliate analysis
    'affiliateAnalysis.common.thisAffiliate': 'this affiliate',
    'affiliateAnalysis.common.na': 'N/A',
    'affiliateAnalysis.period.thisPeriod': 'This period',
    'affiliateAnalysis.period.previousMonth': 'previous month',

    'affiliateAnalysis.badge.healthy': 'Healthy',
    'affiliateAnalysis.badge.watch': 'Watch',
    'affiliateAnalysis.badge.atRisk': 'At risk',
    'affiliateAnalysis.badgeWithProfit': '{label} · Profit {value}',

    'affiliateAnalysis.topAffiliates.title': 'Top 10 Affiliates (by Profit)',
    'affiliateAnalysis.topAffiliates.subtitle': 'Select an affiliate to view its analysis',
    'affiliateAnalysis.topAffiliates.profit': 'Profit {value}',
    'affiliateAnalysis.topAffiliates.cohortYes': 'Cohort ✓',
    'affiliateAnalysis.topAffiliates.cohortNo': 'No Cohort',

    'affiliateAnalysis.button.backToTopAffiliates': '← Back to Top Affiliates',

    'affiliateAnalysis.share.button': 'Share report',
    'affiliateAnalysis.share.creating': 'Creating…',
    'affiliateAnalysis.share.copied': 'Copied',
    'affiliateAnalysis.share.hint': 'Creates a public, read-only board report link',
    'affiliateAnalysis.share.error': 'Unable to create share link',

    'affiliateAnalysis.header.title': 'Affiliate Analysis – {affiliate}',
    'affiliateAnalysis.header.subtitle': 'Performance overview · Period: {period}',

    'affiliateAnalysis.filters.affiliate': 'Affiliate',
    'affiliateAnalysis.filters.selectAffiliate': 'Select affiliate…',

    'affiliateAnalysis.kpi.netDeposits': 'Net Deposits',
    'affiliateAnalysis.kpi.pl': 'PL',
    'affiliateAnalysis.kpi.profit': 'Profit',
    'affiliateAnalysis.kpi.roi': 'ROI',
    'affiliateAnalysis.kpi.payments': 'Payments',
    'affiliateAnalysis.kpi.ftdPerReg': 'FTD / Reg',

    'affiliateAnalysis.kpiHelper.totalPnL': 'Total P&L',
    'affiliateAnalysis.kpiHelper.plMinusPayments': 'PL − payments',
    'affiliateAnalysis.kpiHelper.profitDivPayments': 'Profit / payments',
    'affiliateAnalysis.kpiHelper.commissionPayouts': 'Commission / payouts',
    'affiliateAnalysis.kpiHelper.firstDepositsVsRegistrations': 'First deposits vs registrations',

    'affiliateAnalysis.sections.financialMetrics.title': 'Financial metrics',
    'affiliateAnalysis.sections.financialMetrics.subtitle': 'Efficiency snapshots',
    'affiliateAnalysis.sections.allKeyMetrics.title': 'All Key Metrics for this Affiliate',
    'affiliateAnalysis.sections.allKeyMetrics.subtitle': 'Full KPI snapshot for this affiliate',
    'affiliateAnalysis.sections.monthlyTrends.title': 'Monthly trends',
    'affiliateAnalysis.sections.monthlyTrends.subtitle': 'Net Deposits, PL, Profit',

    'affiliateAnalysis.financial.paybackVsDeposits': 'Payback vs deposits',
    'affiliateAnalysis.financial.payoutRatio': 'Payout ratio',
    'affiliateAnalysis.financial.plPerFtd': 'PL per FTD',
    'affiliateAnalysis.financial.profitPerUser': 'Profit per user',
    'affiliateAnalysis.financial.helper.profitDivNetDeposits': 'Profit / net deposits',
    'affiliateAnalysis.financial.helper.paymentsDivNetDeposits': 'Payments / net deposits',
    'affiliateAnalysis.financial.helper.plDivFtd': 'PL / FTD',
    'affiliateAnalysis.financial.helper.profitDivUsers': 'Profit / users',

    'affiliateAnalysis.chart.netDeposits': 'Net Deposits',
    'affiliateAnalysis.chart.pl': 'PL',
    'affiliateAnalysis.chart.profit': 'Profit',

    'affiliateAnalysis.empty.selectAffiliate': 'Select an affiliate to view its analysis',

    'affiliateAnalysis.cohort.monthLabel': 'Month {index}',

    'affiliateAnalysis.metrics.cpa': 'CPA',
    'affiliateAnalysis.metrics.arpu': 'ARPU',
    'affiliateAnalysis.metrics.ltvPerUser': 'LTV / user',
    'affiliateAnalysis.metrics.profitMargin': 'Profit margin',
    'affiliateAnalysis.metrics.churnPct': 'Churn %',
    'affiliateAnalysis.metrics.conversionRate': 'Conversion rate',
    'affiliateAnalysis.metrics.ftdRatio': 'FTD ratio',
    'affiliateAnalysis.metrics.qftdRatio': 'QFTD ratio',
    'affiliateAnalysis.metrics.withdrawals': 'Withdrawals',
    'affiliateAnalysis.metrics.bestMonth': 'Best Month',
    'affiliateAnalysis.metrics.worstMonth': 'Worst Month',
    'affiliateAnalysis.metrics.helper.paymentsDivFtd': 'Payments / FTD',
    'affiliateAnalysis.metrics.helper.plDivRegistrations': 'PL / registrations',
    'affiliateAnalysis.metrics.helper.plDivUsers': 'PL / users',
    'affiliateAnalysis.metrics.helper.profitVsPl': 'Profit vs PL',
    'affiliateAnalysis.metrics.helper.weightedChurnPct': 'Weighted churn %',
    'affiliateAnalysis.metrics.helper.registrationsDivVisitors': 'Registrations / visitors',
    'affiliateAnalysis.metrics.helper.ftdDivRegistrations': 'FTD / registrations',
    'affiliateAnalysis.metrics.helper.qftdDivFtd': 'QFTD / FTD',
    'affiliateAnalysis.metrics.helper.totalWithdrawals': 'Total withdrawals',
    'affiliateAnalysis.metrics.helper.byProfit': 'By profit',

    'affiliateAnalysis.engine.empty.title': 'Analysis Engine — Automated Insights',
    'affiliateAnalysis.engine.empty.subtitle': 'Deterministic insights built from KPIs',
    'affiliateAnalysis.engine.empty.body':
      'Select an affiliate and date window to generate insights.',

    'affiliateAnalysis.engine.sections.riskSignals': '📉 Risk Signals',
    'affiliateAnalysis.engine.sections.upsideOpportunities': '🎯 Upside Opportunities',
    'affiliateAnalysis.engine.sections.currentOutlook': '🧭 Current Outlook',

    'affiliateAnalysis.engine.profitTrend.subtitle':
      'Current vs previous month: {current} vs {previous}',

    'affiliateAnalysis.engine.cohort.notReached': 'Not reached',
    'affiliateAnalysis.engine.cohort.notAvailable': 'Cohort not available',
    'affiliateAnalysis.engine.cohort.monthsValue': '{value} months',
    'affiliateAnalysis.engine.cohort.helper.avgTimeToNetProfit':
      'Average time to reach net profit (Top 10 Cohort PL)',
    'affiliateAnalysis.engine.cohort.helper.noData':
      'Top 10 Cohort PL report has no data for this affiliate',

    'affiliateAnalysis.engine.title': 'Affiliate Performance Outlook — {affiliate}',
    'affiliateAnalysis.engine.subtitle': 'Signals for {period}',

    'affiliateAnalysis.engine.kpi.periodProfit': 'Period Profit',
    'affiliateAnalysis.engine.kpi.roi': 'ROI',
    'affiliateAnalysis.engine.kpi.profitTrendLatestMonth': 'Profit trend (latest month)',
    'affiliateAnalysis.engine.kpi.cohortBreakEven': 'Cohort Break Even',
    'affiliateAnalysis.engine.kpiHelper.profitDivPayments': 'Profit / payments',

    'affiliateAnalysis.engine.headings.performanceRecap': 'Performance Recap',
    'affiliateAnalysis.engine.headings.narrativeSignals': 'Narrative Signals',
    'affiliateAnalysis.engine.headings.recommendedActions': 'Recommended Actions',
    'affiliateAnalysis.engine.recommendedActions.nextSteps': 'Next Steps',

    // Affiliate payments 2.0
    'affiliatePayments2.loader.data': 'Loading payments data…',

    // Investments (legacy)
    'investmentsLegacy.subtitle.commissionsFilter':
      'Commissions from commissions.csv, filterable by month and affiliate.',

    // Fraud
    'fraud.loader.commissions': 'Loading commissions…',
    'fraud.filters.search.placeholder': 'Search name / affiliate / text',
    'fraud.filters.severity.all': 'All severities',
    'fraud.filters.severity.critical': 'Critical',
    'fraud.filters.severity.high': 'High',
    'fraud.filters.severity.medium': 'Medium',
    'fraud.filters.severity.low': 'Low',
    'fraud.filters.affiliateId.placeholder': 'Affiliate id',
    'fraud.filters.groupByNameCountry': 'Use name+country groups',
    'fraud.filters.minCount': 'Min count',
    'fraud.chart.aria.platformGrowthCumulative': 'Platform growth cumulative chart',
    'fraud.loader.dashboardData': 'Loading dashboard data…',

    // Dashboard
    'dashboard.monthLabel': 'Month {index}',

    'dashboard.kpiCards.retainedM1': 'Retained Month 1',
    'dashboard.kpiCards.retainedM3': 'Retained Month 3',
    'dashboard.kpiCards.retainedM6': 'Retained Month 6',
    'dashboard.kpiCards.health': 'Cohort health',
    'dashboard.kpiCards.retained.helper': 'Primary metric: retained {metric} vs Month 0',
    'dashboard.kpiCards.health.helper': 'Rule-based: retained value, half-life, lifetime',

    'dashboard.health.noData': 'No data',
    'dashboard.health.green': 'Green',
    'dashboard.health.orange': 'Orange',
    'dashboard.health.red': 'Red',

    'dashboard.cohortHealth.title': 'Cohort health',
    'dashboard.cohortHealth.whyLabel': 'Why',
    'dashboard.cohortHealth.meaningLabel': 'Meaning',
    'dashboard.cohortHealth.nextCheckLabel': 'Next check',
    'dashboard.cohortHealth.noData': 'No cohort data available for this selection.',
    'dashboard.cohortHealth.interpretationUnavailable': 'Interpretation not available.',
    'dashboard.cohortHealth.recheckFallback': 'Re-check M1 and M3 retained value.',
    'dashboard.cohortHealth.why.noData': 'No cohort data available for this selection.',
    'dashboard.cohortHealth.why.green': 'Value stays strong beyond Month 0.',
    'dashboard.cohortHealth.why.early': 'Most value is generated in Month 0.',
    'dashboard.cohortHealth.why.r1Low': 'Value drops sharply after Month 0.',
    'dashboard.cohortHealth.why.r3Low': 'Value fades quickly by Month 3.',
    'dashboard.cohortHealth.why.default': 'Value declines after Month 0.',
    'dashboard.cohortHealth.meaning.noData': 'There is not enough data to assess cohort health.',
    'dashboard.cohortHealth.meaning.green':
      'Recurring activity sustains value across multiple months.',
    'dashboard.cohortHealth.meaning.orange':
      'Some repeat activity exists, but it weakens over time.',
    'dashboard.cohortHealth.meaning.red':
      'Business depends heavily on first-month activity and weak repeat usage.',
    'dashboard.cohortHealth.nextCheck.noData':
      'Wait for more months of activity and re-check M1/M3 retained value.',
    'dashboard.cohortHealth.nextCheck.default':
      'After retention actions, focus on improving M1 and M3 retained value.',
    'dashboard.cohortHealth.valueConcentration':
      'Value concentration: {pct}% of total value generated in Month 0',
    'dashboard.cohortHealth.halfLife.label': 'Economic half-life',
    'dashboard.cohortHealth.halfLife.notReached': 'not reached (retained stays above 50%)',
    'dashboard.cohortHealth.halfLife.reached': '~{months} {unit} (retained value falls below 50%)',
    'dashboard.cohortHealth.lifetime.label': 'Economic lifetime',
    'dashboard.cohortHealth.lifetime.notReached': 'not reached (retained stays above 10%)',
    'dashboard.cohortHealth.lifetime.reached': '~{months} {unit} (retained value falls below 10%)',

    'dashboard.monthlyAggregates.title': 'Monthly aggregates',
    'dashboard.monthlyAggregates.infoAria': 'Info about data',
    'dashboard.monthlyAggregates.infoText':
      '{cohortMetricLabel} and cohort size come from the selected cohort file; commissions paid are taken from the Balance Report and assigned to the cohort acquisition month; P&L is aggregated by first deposit date (same cohort logic).',
    'dashboard.monthlyAggregates.cohortLabel': 'Cohort (FD month)',
    'dashboard.monthlyAggregates.cohort.all': 'All cohorts',
    'dashboard.monthlyAggregates.cohort.q1': 'Q1 (Jan–Mar)',
    'dashboard.monthlyAggregates.cohort.q2': 'Q2 (Apr–Jun)',
    'dashboard.monthlyAggregates.cohort.q3': 'Q3 (Jul–Sep)',
    'dashboard.monthlyAggregates.cohort.q4': 'Q4 (Oct–Dec)',
    'dashboard.monthlyAggregates.cohort.s1': 'S1 (Jan–Jun)',
    'dashboard.monthlyAggregates.cohort.s2': 'S2 (Jul–Dec)',
    'dashboard.monthlyAggregates.affiliateLabel': 'Affiliate',
    'dashboard.monthlyAggregates.affiliate.all': 'All in cohort',
    'dashboard.monthlyAggregates.affiliate.noneAvailable': 'No affiliate available',
    'dashboard.monthlyAggregates.affiliate.top10Label': 'Top 10',
    'dashboard.monthlyAggregates.tableAutoFillHint':
      'The table is auto-filled with {cohortMetricLabel} and Cohort size for the selection.',

    'dashboard.loader.cohort': 'Loading cohort dashboard…',
    'dashboard.pulse.title': 'Cohort financial pulse',
    'dashboard.pulse.subtitle':
      '{retainedMetricLabel} (%) shows how much Month 0 {cohortMetric} remains over time.',
    'dashboard.pulse.filter.metricLabel': 'Metric',
    'dashboard.pulse.filter.calendarYearLabel': 'Calendar year',
    'dashboard.pulse.filter.affiliateLabel': 'Affiliate',
    'dashboard.metric.netDeposits': 'Net deposits',
    'dashboard.metric.deposits': 'Deposits',
    'dashboard.metric.depositsCount': 'Number of deposits',
    'dashboard.metric.withdrawals': 'Withdrawals',
    'dashboard.years.all': 'All years',
    'dashboard.affiliates.all': 'All affiliates',
    'dashboard.cohortKpis.title': 'Cohort KPIs',
    'dashboard.cohortKpis.infoAria': 'Info about cohort KPIs',
    'dashboard.cohortKpis.infoText':
      'Users = cohort size; Active users = users*(1-churn) cumulative; Marketing & Commissions mapped to acquisition month; Cohort cost = marketing + commissions; CPA = cost/users; LTV = P&L/users; ROI = (P&L - cost)/cost; Net dep/Commission: if < 1.5, commissions are postponed to the affiliate; Break-even = first month with cum. P&L - cum. commissions >= 0.',

    'dashboard.table.metric': 'Metric',
    'dashboard.table.total': 'Total',
    'dashboard.table.breakEven': 'Break even',

    'dashboard.cohortDb.infoAria': 'Info about cohort DB',
    'dashboard.cohortDb.infoText':
      'Select a cohort (first deposit month) and apply it to the dashboard Net deposits (from Net deposits Cohort 2025.csv). P&L follows the same logic by first deposit date.',
    'dashboard.cohortDb.toggle.show': 'Show Cohort DB',
    'dashboard.cohortDb.toggle.hide': 'Hide Cohort DB',
    'dashboard.cohortDb.affiliates.toggle.show': 'Show affiliate details',
    'dashboard.cohortDb.affiliates.toggle.hide': 'Hide affiliate details',
    'dashboard.cohortDb.table.monthFd': 'FD month',
    'dashboard.cohortDb.table.cohortSize': 'Cohort size',
    'dashboard.cohortDb.table.month0': 'Month 0',
    'dashboard.cohortDb.table.month1': 'Month 1',
    'dashboard.cohortDb.table.month2': 'Month 2',
    'dashboard.cohortDb.affiliates.title': 'Affiliate details (first 15)',
    'dashboard.cohortDb.affiliates.table.affiliate': 'Affiliate',
    'dashboard.cohortDb.affiliates.table.month': 'Month',
    'dashboard.cohortDb.affiliates.table.size': 'Size',

    'dashboard.breakEven.title': 'Break-even analysis',
    'dashboard.breakEven.infoAria': 'Info about break-even',
    'dashboard.breakEven.infoText':
      'Formula: cumulative P&L (from "PL Cohort Analysis.csv") minus cumulative Commissions paid (negative). The break-even month is the first index where the curve becomes >= 0.',

    'dashboard.pnlTrend.title': 'P&L trend',

    'dashboard.topAffiliates.title': 'Top Performing Affiliates',
    'dashboard.topAffiliates.none': 'No affiliates available for the current selection.',
    'dashboard.topAffiliates.table.rank': '#',
    'dashboard.topAffiliates.table.affiliate': 'Affiliate',
    'dashboard.topAffiliates.table.registrationsShort': 'R',
    'dashboard.topAffiliates.table.registrationsTitle': 'Registrations',
    'dashboard.topAffiliates.table.registrationsPctShort': '%R',
    'dashboard.topAffiliates.table.registrationsPctTitle': '% Registrations',
    'dashboard.topAffiliates.table.plShort': 'P',
    'dashboard.topAffiliates.table.plTitle': 'P&L',
    'dashboard.topAffiliates.table.plPctShort': '%P',
    'dashboard.topAffiliates.table.plPctTitle': '% P&L',
    'dashboard.topAffiliates.table.roiSymbol': 'ROI',
    'dashboard.topAffiliates.table.roiTitle': 'ROI',

    'dashboard.autoReport.infoAria': 'Info about auto report',
    'dashboard.autoReport.infoText':
      'Generate a short summary now; later we can connect OpenAI for comments and next steps.',
    'dashboard.autoReport.generate': 'Generate local report',
    'dashboard.autoReport.generating': 'Generating…',
    'dashboard.autoReport.clear': 'Clear',
    'dashboard.autoReport.placeholder': 'Report will appear here…',

    // Upload
    'upload.title': 'Upload reports',
    'upload.description.line1':
      'Upload a CSV or XLSX and the system will sanitize it and update the reports.',
    'upload.description.line2':
      'Choose the report type explicitly to avoid relying on the file name.',
    'upload.type.registrations': 'Registrations',
    'upload.type.payments': 'Payments',
    'upload.type.media': 'Media',
    'upload.type.comments': 'Comments',
    'upload.button.upload': 'Upload',
    'upload.button.uploading': 'Uploading…',
    'upload.label.selected': 'Selected',
    'upload.progress.upload': 'Upload',
    'upload.progress.server': 'Server',
    'upload.response.title': 'Response',
    'upload.emptyDash': '—',

    'upload.status.uploadingShort': 'Uploading…',
    'upload.status.uploadingPrefix': 'Uploading',
    'upload.status.processingOnServer': 'Processing on server…',
    'upload.status.done': 'Done.',
    'upload.status.failed': 'Failed',
    'upload.status.networkError': 'Upload failed (network error).',

    'upload.result.ok': 'OK',
    'upload.result.type': 'Type',
    'upload.result.updated': 'Updated',
    'upload.result.rawBackup': 'Raw backup',
    'upload.result.sanitizer': 'Sanitizer',
    'upload.result.summary': 'Summary',
    'upload.result.summary.existing': 'Existing',
    'upload.result.summary.added': 'Added',
    'upload.result.summary.duplicates': 'Duplicates',
    'upload.result.summary.affiliateUpdates': 'Affiliate updates',
    'upload.result.summary.fieldUpdates': 'Field updates',
    'upload.result.lastLogs': 'Last logs',
    'upload.result.warningsErrors': 'Warnings/Errors',

    // Support
    'support.loader.tools': 'Loading support tools…',
    'support.loader.results': 'Loading results…',
    'support.search.placeholder': 'Search by name, user id or MT5',
    'support.search.ariaLabel': 'Search users',

    'support.userCheck.title': 'Support — User check',
    'support.userCheck.subtitle': 'Quick identification and operational handling of a user.',
    'support.userCheck.hint.instant': 'Instant results while typing',
    'support.userCheck.hint.press': 'Press',
    'support.userCheck.hint.toFocus': 'to focus',
    'support.userCheck.hint.toRun': 'to run',
    'support.userCheck.badge.top': 'Top',
    'support.userCheck.deposits': '{count} deposits',
    'support.userCheck.noResults': 'No results',
    'support.userCheck.openInPartner': 'Open in Partner',

    'support.reply.fallback': "Thanks {name} — we're reviewing and will follow up shortly.",

    'support.details.affiliateMoves.title': 'Affiliate moves',
    'support.details.affiliateMoves.loading': 'Loading…',
    'support.details.affiliateMoves.none': 'No affiliate moves detected.',
    'support.details.affiliateMoves.more': '+{count} more',
    'support.reply.customerFallback': "Thanks — we're reviewing and will follow up shortly.",
    'support.reply.caseType.DATA_INCOMPLETE':
      "Thanks — we're checking your account details and will update you shortly.",
    'support.reply.caseType.WITHDRAWAL_REQUEST':
      "Thanks — your withdrawal request is in review. We'll confirm once checks are completed.",
    'support.reply.caseType.POTENTIAL_ABUSE':
      'Thanks — we need additional verification before proceeding. Our team will contact you if needed.',
    'support.reply.caseType.HIGH_VALUE_USER':
      "Thanks — we'll prioritize your request and confirm next steps shortly.",
    'support.reply.caseType.NO_DEPOSIT':
      'Thanks — your account is active. If you need help funding, we can guide you.',
    'support.reply.caseType.ACTIVE_USER':
      "Thanks — we're reviewing your request and will update you shortly.",
    'support.reply.caseType.UNKNOWN': "Thanks — we're reviewing and will follow up shortly.",

    'support.decision.status.ELIGIBLE': 'Eligible',
    'support.decision.status.NOT_ELIGIBLE': 'Not eligible',
    'support.decision.status.NEEDS_CONTEXT': 'Needs context',
    'support.decision.status.NEEDS_MANUAL_REVIEW': 'Needs manual review',
    'support.decision.status.APPROVED_WITH_CONDITIONS': 'Approved with conditions',
    'support.decision.status.NEEDS_VERIFICATION': 'Needs verification',
    'support.decision.status.HIGH_RISK': 'High risk',
    'support.decision.status.NEEDS_PSP_CHECK': 'Needs PSP check',
    'support.decision.status.STANDARD_PROCESS': 'Standard process',
    'support.decision.status.CRITICAL_RISK': 'Critical risk',
    'support.decision.status.NEUTRAL': 'Neutral',
    'support.decision.status.PROFITABLE': 'Profitable',

    'support.decision.affiliateSwitch.noAffiliate.why': 'No affiliate assigned on this account.',
    'support.decision.affiliateSwitch.noAffiliate.action.verifyCrm':
      'Verify CRM affiliate attribution.',
    'support.decision.affiliateSwitch.noAffiliate.action.openNewAccount':
      'If user wants a new affiliate, open a NEW account via affiliate link.',

    'support.decision.affiliateSwitch.hasCommissions.why':
      'Account already generated affiliate commissions. Switching would create cost/attribution issues.',
    'support.decision.affiliateSwitch.hasCommissions.action.doNotSwitch':
      'Do NOT switch the existing account.',
    'support.decision.affiliateSwitch.hasCommissions.action.openNewAccount':
      'If user insists, propose opening a NEW account under the requested affiliate link (min deposit may apply).',
    'support.decision.affiliateSwitch.hasCommissions.action.escalate':
      'Escalate to Emanuele for final approval if needed.',

    'support.decision.affiliateSwitch.noCommissions.why':
      'No affiliate commissions generated on current account. Switch has no attribution cost.',
    'support.decision.affiliateSwitch.noCommissions.action.proceedSwitch':
      'Proceed with switch (CRM + Skale).',
    'support.decision.affiliateSwitch.noCommissions.action.confirmUpdated':
      'Confirm affiliate updated consistently in both systems.',

    'support.decision.accountTypeChange.highWithdrawalRatio.why':
      'High withdrawal ratio suggests potential abuse; manual review required before account type change.',
    'support.decision.accountTypeChange.highWithdrawalRatio.action.escalateRisk':
      'Escalate to risk team for manual review.',
    'support.decision.accountTypeChange.highWithdrawalRatio.action.holdChange':
      'Hold account type change until clearance.',

    'support.decision.accountTypeChange.approvedWithConditions.why':
      'Account type change allowed with operational checks.',
    'support.decision.accountTypeChange.approvedWithConditions.action.requireKycPsp':
      'Require KYC/PSP check before changing type',
    'support.decision.accountTypeChange.approvedWithConditions.action.allowWithChecks':
      'Allow account type change with conditions: verify KYC and PSP status.',

    'support.decision.bonus.hasCommissionsAndDeposits.why':
      'Account has affiliate commissions and deposits — bonus allocation requires verification to avoid double-cost.',
    'support.decision.bonus.hasCommissionsAndDeposits.action.verifyOwnership':
      'Verify affiliate commission ownership and marketing agreement before granting bonus.',
    'support.decision.bonus.hasCommissionsAndDeposits.action.recordCrm':
      'If approved, record reason in CRM.',

    'support.decision.bonus.noDeposits.why':
      'No deposits on account — bonus requires deposit activity.',
    'support.decision.bonus.noDeposits.action.informFunding':
      'Inform user about funding options and minimum deposit requirements.',

    'support.decision.bonus.highValue.why': 'High-value user eligible for bonus, subject to KYC.',
    'support.decision.bonus.highValue.action.proceedKyc':
      'Proceed with bonus offer and initiate KYC if not present.',

    'support.decision.bonus.standard.why': 'User eligible for standard promotional offers.',
    'support.decision.bonus.standard.action.offerStandard':
      'Offer standard bonus per promotions catalogue.',

    'support.decision.withdrawals.highRisk.why': 'High withdrawal ratio vs deposits.',
    'support.decision.withdrawals.highRisk.action.holdInvestigate': 'Hold and investigate.',
    'support.decision.withdrawals.highRisk.action.checkPspKyc':
      'Check PSP/KYC, trading activity, and payment methods.',

    'support.decision.withdrawals.needsPspCheck.why':
      'Withdrawals detected — verify PSP and KYC before processing.',
    'support.decision.withdrawals.needsPspCheck.action.verifyPsp': 'Verify PSP status.',
    'support.decision.withdrawals.needsPspCheck.action.confirmKyc': 'Confirm KYC.',
    'support.decision.withdrawals.needsPspCheck.action.processSla': 'Process according to SLA.',

    'support.decision.withdrawals.standardProcess.why':
      'No withdrawals; follow standard processing.',
    'support.decision.withdrawals.standardProcess.action.noAction': 'No action required.',

    'support.decision.revenueShare.criticalRisk.why':
      'Large negative P/L relative to deposits indicating potential retention/abuse risk.',
    'support.decision.revenueShare.criticalRisk.action.reviewRetention':
      'Review retention strategy and fraud indicators.',
    'support.decision.revenueShare.criticalRisk.action.considerLimits':
      'Consider special handling or limits.',

    'support.decision.revenueShare.profitAndWithdrawals.why':
      'User shows profit and has withdrawals — monitor for churn/cashout.',
    'support.decision.revenueShare.profitAndWithdrawals.action.monitor':
      'Monitor cashout behavior.',
    'support.decision.revenueShare.profitAndWithdrawals.action.ensureCompliance':
      'Ensure tax/compliance reporting if needed.',

    'support.decision.revenueShare.noDeposits.why': 'No deposits — revenue impact is neutral.',
    'support.decision.revenueShare.noDeposits.action.noAction': 'No revenue actions required.',

    'support.decision.revenueShare.netLoss.why':
      'User is net-loss (negative P/L) which may be beneficial for revenue share depending on contract.',
    'support.decision.revenueShare.netLoss.action.reviewContract':
      'Review contract terms and retention options.',

    'support.decision.revenueShare.noIndicators.why': 'No significant revenue indicators.',
    'support.decision.revenueShare.noIndicators.action.noAction': 'No action required.',

    'support.decision.signal.commissionsGt0': 'Commissions > 0',
    'support.decision.signal.commissionsEq0': 'Commissions = 0',
    'support.decision.signal.highWithdrawalRatio': 'High withdrawal ratio',
    'support.decision.signal.withdrawalsGt0': 'Withdrawals > 0',
    'support.decision.signal.highValueUser': 'High value user',
    'support.decision.signal.depositsEq': 'Deposits = {value}',
    'support.decision.signal.pl': 'P/L',
    'support.decision.signal.plEq': 'PL={value}',
    'support.decision.signal.depositsEqNoSpace': 'Deposits={value}',
    'support.decision.signal.plPositive': 'P/L positive',
    'support.decision.signal.plNegative': 'P/L negative',
    'support.decision.signal.withdrawalsDetected': 'Withdrawals detected',

    // Roadmap
    'roadmap.header.title': 'Mega-Stories Board',
    'roadmap.header.subtitle': 'Strategic mega-stories with execution drill-down.',
    'roadmap.subView.megaStories': 'Mega Stories',
    'roadmap.subView.weeklyMap': 'Weekly Map',
    'roadmap.subView.weeklyMapFiltered': 'Weekly Map (filtered)',

    'roadmap.viewMode.active': 'Active',
    'roadmap.viewMode.done': 'Done',

    'roadmap.counter.active': '{count} active',
    'roadmap.counter.blocked': '{count} blocked',
    'roadmap.counter.done': '{count} done',

    'roadmap.reset.button': 'Reset to seed',
    'roadmap.reset.confirm': 'This will overwrite local changes and reset to seed data. Continue?',

    'roadmap.filters.all': 'All',
    'roadmap.filters.megaStory': 'Mega-Story',
    'roadmap.filters.story': 'Story',
    'roadmap.filters.department': 'Department',
    'roadmap.filters.platformArea': 'Platform area',
    'roadmap.filters.status': 'Status',

    'roadmap.status.active': 'Active',
    'roadmap.status.blocked': 'Blocked',
    'roadmap.status.done': 'Done',

    'roadmap.priority.high': 'High',
    'roadmap.priority.medium': 'Medium',
    'roadmap.priority.low': 'Low',

    'roadmap.department.infrastructure': 'Infrastructure',
    'roadmap.department.product': 'Product',
    'roadmap.department.data': 'Data',
    'roadmap.department.compliance': 'Compliance',
    'roadmap.department.ux': 'UX',
    'roadmap.department.partners': 'Partners',

    'roadmap.platformArea.trading': 'Trading',
    'roadmap.platformArea.analytics': 'Analytics',
    'roadmap.platformArea.payments': 'Payments',
    'roadmap.platformArea.infra': 'Infra',
    'roadmap.platformArea.profile': 'Profile',
    'roadmap.platformArea.internal': 'Internal',

    'roadmap.impactType.revenue': 'Revenue',
    'roadmap.impactType.retention': 'Retention',
    'roadmap.impactType.risk_reduction': 'Risk reduction',
    'roadmap.impactType.efficiency': 'Efficiency',
    'roadmap.impactType.impact': 'Impact',

    'roadmap.mega.tag': 'Mega-story',
    'roadmap.mega.totalTasks': '{count} tasks',
    'roadmap.mega.progress.donePct': '{done} done ({pct}%)',
    'roadmap.mega.progress.inFlight': '{count} in flight',
    'roadmap.mega.departments': 'Departments',
    'roadmap.mega.platform': 'Platform',
    'roadmap.mega.lastImpact': 'Last impact',
    'roadmap.mega.lastImpactValue': '{impactType} - {department} - {area}',
    'roadmap.mega.impact.unknownDepartment': 'dept',
    'roadmap.mega.impact.unknownArea': 'area',
    'roadmap.mega.noImpactYet': 'No impact captured yet',
    'roadmap.mega.focusLabel': 'Mega-Story',

    'roadmap.feed.items': '{count} items',

    'roadmap.story.areaTbd': 'Area TBD',
    'roadmap.story.deptTbd': 'Dept TBD',
    'roadmap.story.tasksCount': '{count} tasks',

    'roadmap.task.createdAt': 'Created {date}',
    'roadmap.task.completedAt': 'Completed {date}',
    'roadmap.task.nextStep': 'Next step',
    'roadmap.task.blocker': 'Blocker',
    'roadmap.task.impact': 'Impact',

    'roadmap.empty.noTasksForStory': 'No tasks for this story under current filters.',
    'roadmap.empty.noStoriesForMega': 'No stories mapped to this mega-story yet.',
    'roadmap.empty.selectMega': 'Select a mega-story to drill down.',

    'roadmap.details.title': 'Details',
    'roadmap.details.panelTitle': 'Details panel',
    'roadmap.details.selectTask': 'Select a task to see details.',
    'roadmap.details.storyFocus': 'Story focus: {story}',
    'roadmap.details.objective': 'Objective',
    'roadmap.details.dependencies': 'Dependencies / blockers',
    'roadmap.details.created': 'Created',

    'roadmap.impact.capturedOnDone': 'Captured when marked done.',
    'roadmap.impact.kpi': 'KPI: {kpi}',
    'roadmap.impact.note': 'Note: {note}',
    'roadmap.impact.completedOn': 'Completed on {date}',

    'roadmap.markDone.button': 'Mark as done',
    'roadmap.markDone.title': 'Mark as done',
    'roadmap.markDone.impactType': 'Impact type',
    'roadmap.markDone.selectImpactType': 'Select impact type',
    'roadmap.markDone.impactedDepartment': 'Impacted department',
    'roadmap.markDone.selectDepartment': 'Select department',
    'roadmap.markDone.impactedPlatformArea': 'Impacted platform area',
    'roadmap.markDone.selectArea': 'Select area',
    'roadmap.markDone.impactedKpi': 'Impacted KPI',
    'roadmap.markDone.kpiPlaceholder': 'Example: Payout SLA compliance',
    'roadmap.markDone.impactNoteOptional': 'Impact note (optional)',
    'roadmap.markDone.saveAndClose': 'Save impact & close',

    'roadmap.common.close': 'Close',
    'roadmap.common.cancel': 'Cancel',

    'roadmap.triage.needsTriage': 'Needs triage',
    'roadmap.triage.mappingFixesRequired': 'Mapping fixes required',
    'roadmap.triage.reason': 'Reason',
    'roadmap.triage.noTasks': 'No tasks need triage.',
    'roadmap.triage.selectMegaStory': 'Select mega-story',
    'roadmap.triage.selectStory': 'Select story',
    'roadmap.triage.saveMapping': 'Save mapping',
    'roadmap.triage.noMega': 'no mega',
    'roadmap.triage.noStory': 'no story',

    'roadmap.validation.unknownMegaStoryId': 'Unknown megaStoryId',
    'roadmap.validation.unknownStoryId': 'Unknown storyId',
    'roadmap.validation.storyNotUnderMega': 'storyId not under megaStoryId',

    // Support • User Details
    'support.details.loader.userDetails': 'Loading user details…',
    'support.details.loader.decisionEngine': 'Loading decision engine…',
    'support.details.backToResults': 'Back to results',
    'support.details.focusCenter.enter': 'Focus',
    'support.details.focusCenter.exit': 'Exit focus',
    'support.details.focusCenter.hint': 'Toggle focus mode (F) — hide side panels',
    'support.details.partnerProfile.label': 'Customer profile',
    'support.details.partnerProfile.hint': 'Open partner customer profile ({customerId})',
    'support.details.statusHelp.aria': 'Status: {status}. Tap for explanation.',
    'support.details.statusHelp.default': 'Status value coming from the source report.',
    'support.details.statusHelp.duplicate':
      'Duplicate: the record appears more than once in the source data (same user/account).',
    'support.details.statusHelp.new':
      'New: the account is marked as newly registered / recently created in the report.',
    'support.details.statusHelp.active': 'Active: the account is marked as active in the report.',
    'support.details.statusHelp.blocked':
      'Blocked: the account is marked as blocked/disabled in the report.',
    'support.details.priority.high': 'High',
    'support.details.priority.medium': 'Medium',
    'support.details.priority.normal': 'Normal',
    'support.details.priority.unknown': 'Unknown',
    'support.details.statusFallback': 'Status',
    'support.details.account': 'Account',
    'support.details.affiliate': 'Affiliate',
    'support.details.noAffiliate': 'No affiliate',
    'support.details.affiliateNameMissing': 'Name missing',
    'support.details.affiliateNameMismatch': 'Mismatch',
    'support.details.commissions.title': 'Commissions',
    'support.details.commissions.revshare': 'Revshare',
    'support.details.commissions.cpa': 'CPA',
    'support.details.commissions.cpl': 'CPL',
    'support.details.commissions.affiliate': 'Affiliate',
    'support.details.commissions.subAffiliate': 'Sub-affiliate',
    'support.details.commissions.other': 'Other',
    'support.details.userTimeline.title': 'User Timeline & Status',
    'support.details.userTimeline.registration': 'Registration',
    'support.details.userTimeline.depositDate': 'Deposit date',
    'support.details.userTimeline.qualification': 'Qualification',
    'support.details.userTimeline.notReached': 'Not reached',
    'support.details.userTimeline.daysDelta': '+{days}d',
    'support.details.financialSummary.title': 'Financial Summary',
    'support.details.financialSummary.totalDeposits': 'Total deposits',
    'support.details.financialSummary.netDeposits': 'Net deposits',
    'support.details.financialSummary.netCashFlow': 'Net cash flow',
    'support.details.financialSummary.withdrawals': 'Withdrawals',
    'support.details.financialSummary.withdrawalRatio': 'Withdrawal ratio',
    'support.details.financialSummary.depositsCount': '# Deposits',
    'support.details.financialSummary.firstDeposit': 'First deposit',
    'support.details.tradingPerformance.title': 'Trading Performance',
    'support.details.tradingPerformance.volume': 'Volume',
    'support.details.tradingPerformance.lots': 'Lots',
    'support.details.tradingPerformance.spread': 'Spread',
    'support.details.tradingPerformance.positionCount': 'Position Count',
    'support.details.tradingPerformance.pl': 'P/L',
    'support.details.tradingPerformance.roi': 'ROI',

    'support.activity.title': 'Activity Intelligence',
    'support.activity.metrics.ageDays': 'Age (days)',
    'support.activity.metrics.positions': 'Positions',
    'support.activity.metrics.positionsPerDay': 'Positions/day',
    'support.activity.metrics.withdrawals': 'Withdrawals',
    'support.activity.metrics.withdrawalRatio': 'Withdrawal ratio',
    'support.activity.metrics.tier': 'Tier',
    'support.activity.metrics.botFlag': 'Potential Bot (EA)',
    'support.activity.botFlag.yes': 'YES',
    'support.activity.botFlag.no': 'NO',
    'support.activity.tier.inactive': 'Inactive',
    'support.activity.tier.low': 'Low',
    'support.activity.tier.active': 'Active',
    'support.activity.tier.high': 'High',
    'support.activity.tier.hyper': 'Hyper',
    'support.activity.tooltip.positionsPerDay':
      'Tier thresholds (positions/day): Inactive=0, Low<1, Active 1–5, High 5–20, Hyper≥20. Bot alert: Age≤7 and (Positions≥200 or Positions/day≥30).',
    'support.activity.tooltip.withdrawalRatio':
      'Withdrawal ratio thresholds: Warn ≥70%, High ≥90%, Critical ≥105% (withdrawals exceed deposits). Use with context (account age, activity, chargebacks).',
    'support.activity.signals.none': 'No notable activity alerts.',
    'support.activity.signal.earlyHyper.title': 'Early hyper-activity',
    'support.activity.signal.earlyHyper.body':
      'Very high trading frequency early in the lifecycle (age={ageDays}d, positions={positions}, {ppd}/day). Possible EA/bot or high-risk behavior.',
    'support.activity.signal.fundedNoTrading.title': 'Funded but not trading',
    'support.activity.signal.fundedNoTrading.body':
      'Deposits present but Position Count is zero. Churn-risk / needs activation.',
    'support.activity.signal.activeHeavyLosses.title': 'Active user with heavy losses',
    'support.activity.signal.activeHeavyLosses.body':
      'High activity combined with strong negative performance (ROI {roi}). Retention-risk / risk-management needed.',
    'support.activity.signal.withdrawalHeavyLowTrading.title': 'Withdrawal-heavy with low trading',
    'support.activity.signal.withdrawalHeavyLowTrading.body':
      'Withdrawals are high vs deposits ({ratio}) while trading activity is low. Potential abuse pattern; verify PSP/KYC.',
    'support.activity.signal.withdrawalsWithoutDeposits.title': 'Withdrawals without deposits',
    'support.activity.signal.withdrawalsWithoutDeposits.body':
      'Withdrawals detected ({withdrawals}) but total deposits are zero. Potential reporting inconsistency or abuse; verify PSP/KYC and source data.',
    'support.activity.signal.withdrawalsExceedDeposits.title': 'Withdrawals exceed deposits',
    'support.activity.signal.withdrawalsExceedDeposits.body':
      'Withdrawal ratio is {ratio} (withdrawals higher than deposits). High-risk pattern; investigate immediately.',
    'support.activity.signal.highCashoutActive.title': 'High cash-out while active',
    'support.activity.signal.highCashoutActive.body':
      'Withdrawal ratio {ratio} within {ageDays} days while trading is active. Could be fast profit-taking or bonus abuse; review context.',
    'support.activity.signal.mismatchPositionsNoVolume.title': 'Data mismatch',
    'support.activity.signal.mismatchPositionsNoVolume.body':
      'Position Count > 0 but Volume/LOTS are zero. Possible reporting/mapping inconsistency.',

    'support.userCheck.botList.title': 'Potential Bot / EA aggressive — top 50',
    'support.userCheck.botList.subtitle': 'Fast triage list ranked by intensity vs account age.',
    'support.userCheck.botList.ppdChip': 'P/day',
    'support.userCheck.botList.shortcuts': 'Shortcuts: / focus · Enter open',
    'support.userCheck.botList.share.label': 'Share',
    'support.userCheck.botList.share.copied': 'Link copied',
    'support.userCheck.botList.share.hint':
      'Create a public link that opens only this table (no dashboard).',
    'support.userCheck.botList.positionCountBadge.tooltip':
      'Anti-regression check: the report must include Position Count',
    'support.userCheck.botList.positionCountBadge.checking': 'Position Count: checking…',
    'support.userCheck.botList.positionCountBadge.ok': 'Position Count: OK',
    'support.userCheck.botList.positionCountBadge.missing': 'Position Count: missing',
    'support.userCheck.botList.loading': 'Computing candidates…',
    'support.userCheck.botList.empty': 'No strong bot candidates found in the current report.',
    'support.userCheck.botList.missingPositionCount.title': 'Position Count missing in report',
    'support.userCheck.botList.missingPositionCount.body':
      'This Registrations Report does not include a reliable Position Count (number of positions). Upload/export a report that includes it to enable the bot/EA intensity list.',
    'support.userCheck.botList.openHint': 'Open trader details',
    'support.userCheck.botList.riskScore': 'Risk score',
    'support.userCheck.botList.badge.bot': 'Bot',
    'support.userCheck.botList.badge.fill': 'Rank',
    'support.userCheck.botList.badge.botHint': 'Flagged as potential bot (rules + score)',
    'support.userCheck.botList.badge.fillHint': 'Not flagged as bot: included as high score',
    'support.details.affiliateOverview.title': 'Affiliate Overview',
    'support.details.affiliateOverview.loading': 'Loading affiliate data…',
    'support.details.affiliateOverview.compareLabel': 'Compare with Affiliate ID:',
    'support.details.affiliateOverview.enterPlaceholder': 'Enter affiliate ID...',
    'support.details.affiliateOverview.currentPrefix': 'Current',
    'support.details.affiliateOverview.targetPrefix': 'Target',
    'support.details.affiliateOverview.noData': 'No affiliate data available',
    'support.details.affiliateOverview.metrics.traffic': 'Traffic',
    'support.details.affiliateOverview.metrics.registrations': 'Registrations',
    'support.details.affiliateOverview.metrics.ftd': 'FTD',
    'support.details.affiliateOverview.metrics.revenue': 'Revenue',
    'support.details.affiliateOverview.metrics.ecpa': 'eCPA',
    'support.details.affiliateOverview.metrics.roi': 'ROI',
    'support.details.supportDecisions.title': 'Support Decisions Engine',
    'support.details.supportDecisions.affiliateSwitch': 'Affiliate Switch Eligibility',
    'support.details.supportDecisions.accountTypeChange': 'Account Type Change',
    'support.details.supportDecisions.bonus': 'Bonus/Credit Eligibility',
    'support.details.supportDecisions.withdrawals': 'Withdrawal/Refund Handling',
    'support.details.supportDecisions.revenueShare': 'Revenue Share Analysis',
    'support.details.decision.why': 'Why',
    'support.details.decision.nextActions': 'Next Best Actions',
    'support.details.decision.signals': 'Decision Signals',
    'support.details.suggestedReply.title': 'Suggested Reply',
    'support.details.suggestedReply.placeholder': 'Support reply template...',
    'support.details.copyToClipboard': 'Copy to Clipboard',
    'support.details.confirmEscalate': 'Escalate {accountId} to {kind}?',

    // Org Chart
    'orgChart.structure': 'Structure',
    'orgChart.title': 'Company Organizational Chart',
    'orgChart.description':
      'Hierarchy, responsibility layer, and department rosters with job title, division, department, region, and email per person.',
    'orgChart.search.placeholder': 'Search by name and press Enter',
    'orgChart.search.submit': 'Go to team',
    'orgChart.toc.ariaLabel': 'Table of contents',
    'orgChart.toc.all': 'All',
    'orgChart.toc.management': 'Management',
    'orgChart.toc.areaLayer': 'Area Layer',
    'orgChart.toc.support': 'Support',
    'orgChart.toc.operations': 'Operations',
    'orgChart.toc.affiliation': 'Affiliation',
    'orgChart.toc.businessDev': 'Business Dev',
    'orgChart.toc.marketing': 'Marketing',
    'orgChart.toc.finance': 'Finance',
    'orgChart.toc.payments': 'Payments',
    'orgChart.toc.compliance': 'Compliance',
    'orgChart.toc.dealing': 'Dealing Desk',
    'orgChart.hierarchy.ariaLabel': 'Hierarchy',
    'orgChart.hierarchy.title': 'Hierarchy',
    'orgChart.hierarchy.subtitle': 'CEO / Leadership cascading to operational teams.',
    'orgChart.role.division': 'Division',
    'orgChart.role.dept': 'Dept',
    'orgChart.role.region': 'Region',
    'orgChart.role.email': 'Email',
    'orgChart.hierarchyItem.ceo': 'CEO / Leadership',
    'orgChart.hierarchyItem.management': 'Management Team',
    'orgChart.hierarchyItem.areaLayer': 'Area Responsibility Layer',
    'orgChart.hierarchyItem.support': 'Support Team',
    'orgChart.hierarchyItem.operations': 'Operations',
    'orgChart.hierarchyItem.dealing': 'Dealing / PSP',
    'orgChart.hierarchyItem.affiliation': 'Affiliation',
    'orgChart.hierarchyItem.businessDev': 'Business Development',
    'orgChart.hierarchyItem.marketing': 'Marketing',
    'orgChart.hierarchyItem.financePayments': 'Finance & Payments',
    'orgChart.hierarchyItem.compliance': 'Compliance',
    'orgChart.sectionTitle.management-team': 'Management Team',
    'orgChart.sectionTitle.area-responsibility': 'Area Responsibility Layer',
    'orgChart.sectionTitle.support-team': 'Support Team',
    'orgChart.sectionTitle.operations': 'Operations',
    'orgChart.sectionTitle.dealing': 'Dealing Desk / PSP / Risk',
    'orgChart.sectionTitle.affiliation': 'Affiliation / Partner Management',
    'orgChart.sectionTitle.business-development': 'Business Development / Sales',
    'orgChart.sectionTitle.marketing': 'Marketing',
    'orgChart.sectionTitle.finance': 'Finance',
    'orgChart.sectionTitle.payments': 'Payments / PSP',
    'orgChart.sectionTitle.compliance': 'Compliance',
  },

  it: {
    'app.tools': 'Strumenti',
    'app.admin': 'Admin',
    'app.logout': 'Esci',
    'app.version': 'v1.0.0',
    'app.uploadLeaveConfirm': 'Upload in corso. Vuoi lasciare questa pagina?',

    'dataStatus.updated': 'Dati aggiornati',
    'dataStatus.outdated': 'Dati potenzialmente non aggiornati',
    'dataStatus.noData': 'Nessun dato disponibile',
    'dataStatus.unknown': 'Stato sconosciuto',

    'sidebar.dashboard': 'Dashboard',
    'sidebar.ops': 'Ops',
    'sidebar.overview': 'Overview',
    'sidebar.executiveSuite': 'Executive Suite',
    'sidebar.executive.summary': 'Summary',
    'sidebar.executive.view': 'View',
    'sidebar.marketingPlan': 'Esecuzione Marketing',
    'sidebar.affiliate': 'Affiliate',
    'sidebar.affiliate.analysis': 'Analysis',
    'sidebar.affiliate.payments': 'Pagamenti',
    'sidebar.affiliate.payments2': 'Pagamenti 2.0',
    'sidebar.affiliate.cohort': 'Cohort',
    'sidebar.analysis': 'Analisi Report',
    'sidebar.fraud': 'Monitoraggio Frodi',
    'sidebar.traderPoints': 'Trader Points',

    // Share — Affiliate Analysis (board report)
    'shareAffiliateAnalysis.header.eyebrow': 'Report board',
    'shareAffiliateAnalysis.header.title': 'Performance Affiliati — Vista Board',
    'shareAffiliateAnalysis.header.subtitle':
      'Seleziona un affiliato per aprire il report finale di performance.',
    'shareAffiliateAnalysis.period.monthly': 'Mensile',
    'shareAffiliateAnalysis.period.quarterly': 'Trimestrale',
    'shareAffiliateAnalysis.period.semiAnnual': 'Semestrale',
    'shareAffiliateAnalysis.period.annual': 'Annuale',
    'shareAffiliateAnalysis.entry.selectedPeriod': 'Periodo: {period}',
    'shareAffiliateAnalysis.entry.noPeriod': 'Periodo: —',
    'shareAffiliateAnalysis.card.reference': 'Periodo rif.',
    'shareAffiliateAnalysis.card.profit': 'Profitto',
    'shareAffiliateAnalysis.card.netDeposits': 'Depositi netti',
    'shareAffiliateAnalysis.card.roi': 'ROI',
    'shareAffiliateAnalysis.footer.note':
      'Link condiviso in sola lettura. I valori riflettono gli ultimi report caricati.',
    'shareAffiliateAnalysis.back': '← Torna agli affiliati',
    'shareAffiliateAnalysis.status.performing': 'Performante',
    'shareAffiliateAnalysis.status.stable': 'Stabile',
    'shareAffiliateAnalysis.status.underperforming': 'Sottoperformante',
    'shareAffiliateAnalysis.accessDenied.title': 'Accesso negato',
    'shareAffiliateAnalysis.accessDenied.subtitle': 'Questo link non è valido o è scaduto.',
    'shareAffiliateAnalysis.error.title': 'Impossibile caricare i dati',
    'shareAffiliateAnalysis.report.eyebrow': 'Report finale',
    'shareAffiliateAnalysis.report.title': 'Report Performance Affiliato — {affiliate}',
    'shareAffiliateAnalysis.report.subtitle': 'Sintesi per il board. Sola lettura.',
    'shareAffiliateAnalysis.report.executiveSnapshot': 'Executive snapshot',
    'shareAffiliateAnalysis.report.performanceOverview': 'Panoramica performance',
    'shareAffiliateAnalysis.report.trendReading': 'Trend & lettura',
    'shareAffiliateAnalysis.report.periodComparison': 'Confronto periodo',
    'shareAffiliateAnalysis.report.boardInterpretation': 'Interpretazione board',
    'shareAffiliateAnalysis.report.decisionLayer': 'Decisioni',
    'shareAffiliateAnalysis.report.periodLabel': 'Tutti i dati disponibili',
    'shareAffiliateAnalysis.report.disclaimer':
      'Questo report usa la stessa analisi della console interna, presentata in formato board-level.',
    'shareAffiliateAnalysis.metric.referencePeriod': 'Periodo di riferimento',
    'shareAffiliateAnalysis.metric.periodType': 'Tipo periodo',
    'shareAffiliateAnalysis.metric.status': 'Stato',
    'shareAffiliateAnalysis.metric.profit': 'Profitto',
    'shareAffiliateAnalysis.metric.roi': 'ROI',
    'shareAffiliateAnalysis.metric.registrations': 'Registrazioni',
    'shareAffiliateAnalysis.metric.ftd': 'FTD',
    'shareAffiliateAnalysis.metric.qftd': 'FTD qualificati',
    'shareAffiliateAnalysis.metric.netDeposits': 'Net Deposits',
    'shareAffiliateAnalysis.metric.pl': 'P&L',
    'shareAffiliateAnalysis.metric.payments': 'Pagamenti',
    'shareAffiliateAnalysis.trend.notEnoughData':
      'Storico insufficiente per calcolare il mese su mese.',
    'shareAffiliateAnalysis.trend.profit': 'Profitto',
    'shareAffiliateAnalysis.trend.netDeposits': 'Depositi netti',
    'shareAffiliateAnalysis.trend.ftd': 'FTD',
    'shareAffiliateAnalysis.comparison.profit': 'Profitto',
    'shareAffiliateAnalysis.comparison.netDeposits': 'Depositi netti',
    'shareAffiliateAnalysis.comparison.ftd': 'FTD',
    'shareAffiliateAnalysis.comparison.up': 'Su',
    'shareAffiliateAnalysis.comparison.down': 'Giù',
    'shareAffiliateAnalysis.comparison.flat': 'Stabile',
    'shareAffiliateAnalysis.comparison.vsLabel': 'Confronto con: {prev}',
    'shareAffiliateAnalysis.interpretation.positive':
      'Performance complessiva sana: contributo positivo e depositi presenti.',
    'shareAffiliateAnalysis.interpretation.negative':
      'Performance da attenzionare: contributo negativo nel periodo selezionato.',
    'shareAffiliateAnalysis.interpretation.neutral':
      'Performance stabile: monitorare la continuità dei risultati nel tempo.',
    'shareAffiliateAnalysis.interpretation.profitUp':
      'Rispetto al periodo precedente, la profittabilità è migliorata.',
    'shareAffiliateAnalysis.interpretation.profitDown':
      'Rispetto al periodo precedente, la profittabilità è peggiorata.',
    'shareAffiliateAnalysis.interpretation.profitFlat':
      'Rispetto al periodo precedente, la profittabilità è sostanzialmente invariata.',
    'shareAffiliateAnalysis.decision.whatThisMeans': 'Cosa significa: {status} per {ref}.',
    'shareAffiliateAnalysis.decision.option.scale':
      'Scalare con criterio: aumentare il volume mantenendo l’efficienza delle commissioni.',
    'shareAffiliateAnalysis.decision.option.maintainQuality':
      'Mantenere qualità: proteggere qualità del traffico e conversione.',
    'shareAffiliateAnalysis.decision.option.monitor':
      'Monitorare mensilmente: verificare stabilità di profitto e depositi.',
    'shareAffiliateAnalysis.decision.option.improveLeadQuality':
      'Migliorare la qualità dei lead: privilegiare fonti con conversione e valore migliori.',
    'shareAffiliateAnalysis.decision.option.focusRetention':
      'Focus sulla retention: migliorare l’attivazione post-registrazione per aumentare i depositi netti.',

    // Share — Board login
    'shareBoardLogin.eyebrow': 'Accesso board',
    'shareBoardLogin.title': 'Apri report condiviso',
    'shareBoardLogin.subtitle':
      'Inserisci il codice di accesso per visualizzare il report board in sola lettura.',
    'shareBoardLogin.badge.readOnly': 'Sola lettura',
    'shareBoardLogin.field.accessCode': 'Codice di accesso',
    'shareBoardLogin.field.placeholder': 'Incolla il codice (es. share_...)',
    'shareBoardLogin.helper':
      'Suggerimento: i codici iniziano spesso con “share_” o “share_local_”.',
    'shareBoardLogin.cta': 'Continua',
    'shareBoardLogin.clear': 'Rimuovi codice salvato',
    'shareBoardLogin.note':
      'Questo codice abilita l’accesso in sola lettura all’area report condivisi. Non abilita l’accesso alle dashboard interne.',
    'shareBoardLogin.error.missing': 'Inserisci un codice di accesso.',
    'shareBoardLogin.error.invalid': 'Codice non valido o scaduto.',
    'shareBoardLogin.error.network': 'Errore di rete. Riprova.',

    // Share — Affiliate Reports (board view, v2)
    'shareAffiliateReports.header.title': 'Performance Affiliate — Vista Board',
    'shareAffiliateReports.header.subtitle': 'Sintesi esecutiva in sola lettura',
    'shareAffiliateReports.header.note':
      'Top affiliate per commissioni. Clicca un affiliate per aprire il report completo.',
    'shareAffiliateReports.header.changeAffiliate': 'Cambia affiliate',
    'shareAffiliateReports.header.selectAffiliate':
      'Seleziona un affiliate per aprire un altro report',
    'shareAffiliateReports.card.netDeposits': 'Net Deposits',
    'shareAffiliateReports.card.pl': 'P&L',
    'shareAffiliateReports.card.weight': 'Peso',
    'shareAffiliateReports.footer.note':
      'La vista Board è in sola lettura. Fonte dati: Affiliate → Analysis interno.',
    'shareAffiliateReports.period.sinceEver': 'Da sempre',
    'shareAffiliateReports.period.ytd': 'Da inizio anno',
    'shareAffiliateReports.period.label': 'Periodo',
    'shareAffiliateReports.report.eyebrow': 'Report finale',
    'shareAffiliateReports.section.execSnapshot': 'Sintesi esecutiva',
    'shareAffiliateReports.exec.selectedPeriod': 'Periodo selezionato',
    'shareAffiliateReports.section.kpiPerformance': 'Performance KPI',
    'shareAffiliateReports.kpi.rank': 'Posizione',
    'shareAffiliateReports.metric.cr': 'CR%',
    'shareAffiliateReports.section.aggregates': 'Aggregati',
    'shareAffiliateReports.section.kpis': 'KPI',
    'shareAffiliateReports.metric.ftd': 'FTD',
    'shareAffiliateReports.metric.qftd': 'QFTD',
    'shareAffiliateReports.metric.deposits': 'Depositi',
    'shareAffiliateReports.metric.withdrawals': 'Prelievi',
    'shareAffiliateReports.metric.profit': 'Profitto',
    'shareAffiliateReports.metric.arpu': 'ARPU',
    'shareAffiliateReports.metric.cpa': 'CPA',
    'shareAffiliateReports.metric.avgDepositsPerUser': 'Depositi medi / utente FTD',
    'shareAffiliateReports.metric.affiliateRegistrations': 'Registrazioni affiliate',
    'shareAffiliateReports.metric.companyRegistrations': 'Registrazioni azienda',
    'shareAffiliateReports.metric.companyRegistrations.hint': 'Indicatore su scala comparabile',
    'shareAffiliateReports.metric.ftdClients': 'Clienti FTD',
    'shareAffiliateReports.metric.qftdClients': 'Clienti QFTD',
    'shareAffiliateReports.metric.depositsCount': 'Numero depositi',
    'shareAffiliateReports.metric.loginRatio': 'Login ratio%',
    'shareAffiliateReports.metric.avgDepositsCountPerFtdUser':
      'Media depositi (count) / utente FTD',
    'shareAffiliateReports.metric.positionsCount': 'Numero posizioni',
    'shareAffiliateReports.section.cohortPulse': 'Polso finanziario cohort',
    'shareAffiliateReports.section.cohortPulse.note':
      'Net Deposits (valori assoluti) — stesso dataset di /cohort.',
    'shareAffiliateReports.section.cohortPulse.error': 'Impossibile caricare i dati cohort',
    'shareAffiliateReports.compare.label': 'Confronta con',
    'shareAffiliateReports.compare.placeholder': 'Scrivi il nome affiliate…',
    'shareAffiliateReports.compare.clear': 'Pulisci',
    'shareAffiliateReports.compare.notFound': 'Affiliate non trovato',
    'shareAffiliateReports.compare.same': 'Hai selezionato lo stesso affiliate',
    'shareAffiliateReports.compare.delta': 'Δ',
    'shareAffiliateReports.chart.title': 'Crescita (cumulata)',
    'shareAffiliateReports.chart.noData': 'Nessun dato per il grafico',
    'shareAffiliateReports.chart.aria.cumulative': 'Grafico crescita cumulata dell’affiliate',
    'shareAffiliateReports.chart.legend.ftd': 'FTD (cum.)',
    'shareAffiliateReports.chart.legend.regs': 'Registrazioni (cum.)',
    'shareAffiliateReports.chart.legend.qftd': 'QFTD (cum.)',
    'shareAffiliateReports.chart.tooltip.regs': 'Registrazioni',
    'shareAffiliateReports.chart.tooltip.ftd': 'FTD',
    'shareAffiliateReports.chart.tooltip.qftd': 'QFTD',
    'shareAffiliateReports.section.weightOnTotal': 'Peso sul totale',
    'shareAffiliateReports.weight.payments': 'Peso commissioni (Top 20)',
    'shareAffiliateReports.weight.netDeposits': 'Peso Depositi netti (Top 20)',
    'shareAffiliateReports.weight.pl': 'Peso P&L (Top 20)',
    'shareAffiliateReports.section.periodComparison': 'Confronto periodo',
    'shareAffiliateReports.interpretation.positive':
      'Forte creazione di valore con contributo significativo.',
    'shareAffiliateReports.interpretation.actionablePositive':
      'Mantenere esposizione e scalare selettivamente se la consistenza continua.',
    'shareAffiliateReports.interpretation.negative':
      'Creazione di valore negativa nel periodo selezionato.',
    'shareAffiliateReports.interpretation.actionableNegative':
      'Ridurre l’esposizione finché l’efficienza non migliora.',
    'shareAffiliateReports.interpretation.mixed':
      'Contributo misto; privilegiare la qualità e monitorare da vicino.',
    'shareAffiliateReports.section.weightRanking': 'Peso e ranking',
    'shareAffiliateReports.rank.roi': 'ROI',
    'shareAffiliateReports.rank.deposits': 'Depositi',
    'shareAffiliateReports.rank.pl': 'P&L',
    'shareAffiliateReports.rank.payments': 'Pagamenti',
    'shareAffiliateReports.rank.ofTotal': 'del totale',
    'shareAffiliateReports.rank.ofTop20': 'dei Top 20 net deposits',
    'shareAffiliateReports.rank.vsPrevious': 'vs periodo precedente',
    'shareAffiliateReports.rank.noData': 'Il ranking non è disponibile per il periodo selezionato.',
    'shareAffiliateReports.section.trend': 'Trend e confronto periodo',
    'shareAffiliateReports.trend.sinceEver':
      'La vista “Da sempre” non ha un periodo precedente equivalente.',
    'shareAffiliateReports.trend.profit': 'Profitto',
    'shareAffiliateReports.trend.netDeposits': 'Net Deposits',
    'shareAffiliateReports.trend.ftd': 'FTD',
    'shareAffiliateReports.trend.vsPrevious': 'vs periodo precedente',
    'shareAffiliateReports.section.decision': 'Implicazioni per il Board',
    'shareAffiliateReports.section.scale': 'Scala',
    'shareAffiliateReports.section.efficiency': 'Efficienza',
    'shareAffiliateReports.weight.shareOfTop20': 'Quota sui Top 20 affiliati',
    'shareAffiliateReports.periodHint.volumeDriven': ' (guidato dal volume)',
    'shareAffiliateReports.periodHint.marginDriven': ' (guidato dal margine)',
    'shareAffiliateReports.periodHint.efficiencyImproved': ' (efficienza in aumento)',
    'shareAffiliateReports.periodHint.efficiencyWorsened': ' (efficienza in calo)',
    'shareAffiliateReports.board.block.status': 'Stato',
    'shareAffiliateReports.board.block.attention': 'Attenzione / rischio',
    'shareAffiliateReports.board.block.actionBias': 'Orientamento azione',
    'shareAffiliateReports.board.status.healthy': 'Sano',
    'shareAffiliateReports.board.status.negative': 'Valore negativo',
    'shareAffiliateReports.board.status.neutral': 'Misto',
    'shareAffiliateReports.board.attention.profitNegative': 'Profitto negativo',
    'shareAffiliateReports.board.attention.roiNegative': 'ROI negativo',
    'shareAffiliateReports.board.attention.netDepositsNegative': 'Net deposits negativi',
    'shareAffiliateReports.board.attention.monitor': 'Monitorare',
    'shareAffiliateReports.board.action.scaleSelectively': 'Scalare',
    'shareAffiliateReports.board.action.optimizeBeforeScaling': 'Ottimizzare',
    'shareAffiliateReports.board.action.reduceExposure': 'Ridurre',
    'shareAffiliateReports.board.action.monitorNoIntervention': 'Monitorare',
    'shareAffiliateReports.chart.guided': 'Traiettoria guidata (cumulata)',

    // Share — Affiliate Reports (feedback testuale)
    'shareAffiliateReports.feedback.whatItMeans': 'Cosa significa:',
    'shareAffiliateReports.feedback.nextStep': 'Prossimo passo:',
    'shareAffiliateReports.feedback.impact': 'Impatto:',
    'shareAffiliateReports.feedback.trendReading': 'Lettura trend:',

    'shareAffiliateReports.kpiFeedback.meaning.negativeBoth': 'Net deposits e P&L sono negativi.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveDepositsNegativePl':
      'Net deposits sono positivi ma il P&L è negativo.',
    'shareAffiliateReports.kpiFeedback.meaning.positivePlNegativeDeposits':
      'Il P&L è positivo ma i net deposits sono negativi.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveButRoiNegative':
      'Net deposits e P&L sono positivi ma il ROI è negativo.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveSoftening':
      'I risultati sono positivi ma stanno peggiorando.',
    'shareAffiliateReports.kpiFeedback.meaning.positiveStable':
      'I risultati sono positivi e stabili.',

    'shareAffiliateReports.kpiFeedback.next.stopScaling':
      'Fermare lo scale e rivedere fonti e costi.',
    'shareAffiliateReports.kpiFeedback.next.holdCutCosts':
      'Tenere la spesa ferma e ridurre i costi.',
    'shareAffiliateReports.kpiFeedback.next.checkQuality':
      'Verificare la qualità dei depositi e monitorare i prelievi.',
    'shareAffiliateReports.kpiFeedback.next.fixRoi':
      'Tenere la spesa ferma e sistemare il ROI prima di scalare.',
    'shareAffiliateReports.kpiFeedback.next.monitorBeforeScale':
      'Mantenere l’esposizione e monitorare il prossimo periodo.',
    'shareAffiliateReports.kpiFeedback.next.scaleCarefully':
      'Mantenere l’esposizione e scalare con cautela.',

    'shareAffiliateReports.weightFeedback.impact.high':
      'Questo affiliate pesa molto sui net deposits totali.',
    'shareAffiliateReports.weightFeedback.impact.low':
      'Questo affiliate pesa poco sui net deposits totali.',
    'shareAffiliateReports.weightFeedback.next.protectChannel':
      'Proteggere questo canale e rivedere la qualità regolarmente.',
    'shareAffiliateReports.weightFeedback.next.keepLean':
      'Tenere la spesa leggera e scalare solo dopo un miglioramento.',

    'shareAffiliateReports.chartFeedback.trend.risingAll':
      'Registrazioni e FTD continuano a crescere.',
    'shareAffiliateReports.chartFeedback.trend.risingRegsFlatFtd':
      'Le registrazioni crescono ma gli FTD sono fermi.',
    'shareAffiliateReports.chartFeedback.trend.risingFtdFlatRegs':
      'Gli FTD crescono mentre le registrazioni sono ferme.',
    'shareAffiliateReports.chartFeedback.trend.flat': 'La curva è piatta.',
    'shareAffiliateReports.chartFeedback.trend.limited': 'La curva ha poca storia.',
    'shareAffiliateReports.chartFeedback.trend.noData': 'Il grafico non è disponibile.',

    'shareAffiliateReports.chartFeedback.next.watchConversion':
      'Monitorare conversione e costi e confermare la stabilità.',
    'shareAffiliateReports.chartFeedback.next.checkLeadQuality':
      'Verificare la qualità dei lead e correggere le fonti.',
    'shareAffiliateReports.chartFeedback.next.monitorPlateau':
      'Monitorare un possibile plateau e decidere sullo scale.',
    'shareAffiliateReports.chartFeedback.next.checkData':
      'Verificare il caricamento dati e monitorare il prossimo periodo.',

    'shareAffiliateReports.finalSummary.overallAssessment': 'Valutazione complessiva:',
    'shareAffiliateReports.finalSummary.keyStrength': 'Punto di forza:',
    'shareAffiliateReports.finalSummary.keyRisk': 'Rischio chiave:',
    'shareAffiliateReports.finalSummary.recommendedAction': 'Azione consigliata:',

    'shareAffiliateReports.finalSummary.value.healthy': 'La performance è sana.',
    'shareAffiliateReports.finalSummary.value.mixed': 'La performance è mista.',
    'shareAffiliateReports.finalSummary.value.needsAction': 'La performance richiede azione.',
    'shareAffiliateReports.finalSummary.value.softening':
      'La performance è stabile ma si sta indebolendo.',

    'shareAffiliateReports.finalSummary.strength.scaleGrowing': 'I net deposits stanno crescendo.',
    'shareAffiliateReports.finalSummary.strength.efficiencyImproving': 'Il ROI sta migliorando.',
    'shareAffiliateReports.finalSummary.strength.stableProfit': 'Il P&L è stabile.',

    'shareAffiliateReports.finalSummary.risk.plNegative': 'Il P&L è negativo.',
    'shareAffiliateReports.finalSummary.risk.roiNegative': 'Il ROI è negativo.',
    'shareAffiliateReports.finalSummary.risk.withdrawalPressure':
      'I prelievi sono alti rispetto ai depositi.',
    'shareAffiliateReports.finalSummary.risk.none': 'Nessun rischio materiale rilevato.',

    'shareAffiliateReports.finalSummary.action.pauseFix':
      'Mettere in pausa lo scale e correggere l’efficienza.',
    'shareAffiliateReports.finalSummary.action.holdImprove':
      'Tenere la spesa ferma e migliorare la conversione.',
    'shareAffiliateReports.finalSummary.action.monitor':
      'Mantenere l’esposizione e monitorare da vicino.',
    'shareAffiliateReports.finalSummary.action.maintainScale':
      'Mantenere l’esposizione e scalare con cautela.',
    'shareAffiliateReports.decisionOverview.title': 'Decision overview',
    'shareAffiliateReports.decisionOverview.trajectory': 'Traiettoria',
    'shareAffiliateReports.decisionOverview.growthQuality': 'Qualità crescita',
    'shareAffiliateReports.decisionOverview.riskSignal': 'Segnale rischio',
    'shareAffiliateReports.decisionOverview.positioning': 'Posizionamento',
    'shareAffiliateReports.decisionOverview.nextReview': 'Prossima review',
    'shareAffiliateReports.decisionOverview.value.improving': 'In miglioramento',
    'shareAffiliateReports.decisionOverview.value.stable': 'Stabile',
    'shareAffiliateReports.decisionOverview.value.deteriorating': 'In peggioramento',
    'shareAffiliateReports.decisionOverview.value.volumeDriven': 'Guidata dal volume',
    'shareAffiliateReports.decisionOverview.value.efficiencyDriven': 'Guidata dall’efficienza',
    'shareAffiliateReports.decisionOverview.value.mixed': 'Mista',
    'shareAffiliateReports.decisionOverview.value.noMaterialRisk': 'Nessun rischio materiale',
    'shareAffiliateReports.decisionOverview.value.conversionPressure': 'Pressione conversione',
    'shareAffiliateReports.decisionOverview.value.withdrawalPressure': 'Pressione prelievi',
    'shareAffiliateReports.decisionOverview.value.profitabilityPressure':
      'Pressione profittabilità',
    'shareAffiliateReports.decisionOverview.value.aboveAvg': 'Sopra la media Top 20',
    'shareAffiliateReports.decisionOverview.value.inlineAvg': 'In linea con la media Top 20',
    'shareAffiliateReports.decisionOverview.value.belowAvg': 'Sotto la media Top 20',
    'shareAffiliateReports.decisionOverview.value.review30': 'Review in 30 giorni',
    'shareAffiliateReports.decisionOverview.value.review60': 'Review in 60 giorni',
    'shareAffiliateReports.decisionOverview.value.review90': 'Review in 90 giorni',
    'shareAffiliateReports.decisionNotes.verdictLabel': 'Verdetto esecutivo',
    'shareAffiliateReports.decisionNotes.driversLabel': 'Driver performance',
    'shareAffiliateReports.decisionNotes.risksLabel': 'Rischi e condizioni',
    'shareAffiliateReports.decisionNotes.actionLabel': 'Guida azione',
    'shareAffiliateReports.decisionNotes.verdict.template':
      '{impact} contributor con {efficiency} e {profitability}.',
    'shareAffiliateReports.decisionNotes.verdict.templateMonitor':
      '{impact} contributor con {efficiency} in monitoraggio.',
    'shareAffiliateReports.decisionNotes.fragment.impact.highImpact': 'Ad alto impatto',
    'shareAffiliateReports.decisionNotes.fragment.impact.solid': 'Solido',
    'shareAffiliateReports.decisionNotes.fragment.impact.moderate': 'Moderato',
    'shareAffiliateReports.decisionNotes.fragment.efficiency.strong': 'efficienza forte',
    'shareAffiliateReports.decisionNotes.fragment.efficiency.mixed': 'efficienza mista',
    'shareAffiliateReports.decisionNotes.fragment.efficiency.weak': 'efficienza debole',
    'shareAffiliateReports.decisionNotes.fragment.profitability.stable': 'profittabilità stabile',
    'shareAffiliateReports.decisionNotes.fragment.profitability.underPressure':
      'profittabilità sotto pressione',
    'shareAffiliateReports.decisionNotes.driver.netDepositsHigh': 'Quota net deposits alta',
    'shareAffiliateReports.decisionNotes.driver.netDepositsMeaningful':
      'Quota net deposits rilevante',
    'shareAffiliateReports.decisionNotes.driver.netDepositsModerate': 'Quota net deposits moderata',
    'shareAffiliateReports.decisionNotes.driver.efficiencyAbove':
      'Efficienza sopra la media dei pari',
    'shareAffiliateReports.decisionNotes.driver.efficiencyInline':
      'Efficienza in linea con la media dei pari',
    'shareAffiliateReports.decisionNotes.driver.efficiencyBelow':
      'Efficienza sotto la media dei pari',
    'shareAffiliateReports.decisionNotes.driver.trajectory': 'Traiettoria {value}',
    'shareAffiliateReports.decisionNotes.risk.rankSoftening': 'Posizionamento in calo',
    'shareAffiliateReports.decisionNotes.action.scaleSelectively':
      'Scalare selettivamente mantenendo qualità del traffico',
    'shareAffiliateReports.decisionNotes.action.maintainMonitor':
      'Mantenere esposizione e monitorare efficienza',
    'shareAffiliateReports.decisionNotes.action.delayConversion':
      'Rinviare lo scale finché la conversione non migliora',
    'shareAffiliateReports.decisionNotes.action.holdProfitability':
      'Sospendere lo scale finché la profittabilità non si stabilizza',
    'shareAffiliateReports.decisionNotes.action.monitorWithdrawals':
      'Mantenere esposizione e monitorare pressione prelievi',
    'shareAffiliateReports.decisionNotes.action.holdMonitor':
      'Sospendere lo scale e monitorare da vicino',

    // Report Analysis
    'analysis.header.label': 'Analisi',
    'analysis.header.title': 'Analisi',
    'analysis.header.subtitle': "Seleziona l'analisi e applica filtri anno/mese.",
    'analysis.tabs.comments': 'Comment Report',
    'analysis.tabs.bots': 'Bot Users',
    'analysis.kpi.validTransfers': 'Trasferimenti validi',
    'analysis.kpi.uniqueUsers': 'Utenti unici',
    'analysis.kpi.affiliatesInvolved': 'Affiliati coinvolti',
    'analysis.kpi.economicImpact': 'Impatto economico (from {id})',
    'analysis.kpi.economicImpactHelper': '{count} utenti × {cpa}',
    'analysis.chart.ranking': 'Ranking',
    'analysis.chart.top10Inbound': 'Top 10 Inbound',
    'analysis.chart.top10InboundSubtitle': 'Affiliati che hanno ricevuto più utenti',
    'analysis.chart.top10Outbound': 'Top 10 Outbound',
    'analysis.chart.top10OutboundSubtitle': 'Affiliati che hanno perso più utenti',
    'analysis.chart.top10Net': 'Top 10 Net',
    'analysis.chart.top10NetSubtitle': 'Saldo utenti per affiliato',
    'analysis.chart.top15Flows': 'Top 15 flussi da → a',
    'analysis.chart.top15FlowsSubtitle': 'Principali coppie di spostamento',
    'analysis.bots.eyebrow': 'Bots',
    'analysis.bots.title': 'Bot Users Analysis',
    'analysis.bots.description':
      'Layout pronto: collega qui il dataset bot per replicare KPI e Top 10.',
    'analysis.bots.details':
      'Connetti il file/endpoint dei bot per calcolare utenti bot, volumi e flussi. Possiamo riutilizzare lo stesso schema (filtri anno/mese, Top10 con grafici e impatto economico) non appena il dataset è disponibile.',
    'analysis.loading': 'Caricamento analisi…',
    'analysis.error.parsing': 'Errore nel parsing del file comments.csv',
    'analysis.error.loading': 'Errore nel caricamento di comments.csv',
    'analysis.noData': 'Nessun dato disponibile.',
    'sidebar.roadmap': 'Mega-Stories',
    'sidebar.weeklyMap': 'Weekly Map',
    'sidebar.weeklyExecutionHistory': 'Storico esecuzione settimanale',
    'sidebar.orgChart': 'Org Chart',
    'sidebar.supportUserCheck': 'Support • User Check',
    'sidebar.upload': 'Upload',

    // Weekly Execution History
    'weeklyExecutionHistory.header.label': 'Memoria operativa',
    'weeklyExecutionHistory.header.title': 'Storico esecuzione settimanale',
    'weeklyExecutionHistory.header.subtitle':
      'Registro in sola lettura: pianificato vs completato, settimana per settimana.',
    'weeklyExecutionHistory.header.weekRange': 'Settimana {start} → {end}',
    'weeklyExecutionHistory.filters.week': 'Settimana',
    'weeklyExecutionHistory.filters.currentBadge': '(corrente)',
    'weeklyExecutionHistory.sections.planned': 'Pianificato',
    'weeklyExecutionHistory.sections.done': 'Completato',
    'weeklyExecutionHistory.empty': 'Nessuna voce nello storico.',

    'login.pill': 'Accesso Management + Finance + Support',
    'login.title': 'Bullwaves Intelligence',
    'login.subtitle':
      'Inserisci la tua email di lavoro per continuare. Nessuna password richiesta.',
    'login.workEmail': 'Email di lavoro',
    'login.placeholder': 'nome@bullwaves.com',
    'login.hint':
      'Sono accettate solo email di Management, Finance o Support presenti nell’org chart.',
    'login.continue': 'Continua',
    'login.viewOrgChart': 'Apri Organization Chart ↗',
    'login.allowlistDepartments': 'Dipartimenti abilitati al login',
    'login.allowlistDepartmentsAria': 'Dipartimenti autorizzati',

    'login.typing.welcome': 'Benvenuto in Bullwaves Intelligence',
    'login.typing.access': 'Accesso Management + Finance + Support',
    'login.typing.allowlist': 'Allowlist email attiva',
    'login.error.unable': 'Impossibile effettuare il login.',

    'auth.emailNotAllowlisted':
      'Email non presente nella allowlist (Management + Finance + Support).',

    'lang.label': 'Lingua',

    // Common
    'common.show': 'Mostra',
    'common.viewDetails': 'Vedi dettagli',
    'common.hide': 'Nascondi',
    'common.all': 'Tutti',
    'common.info': 'Info',
    'common.close': 'Chiudi',
    'common.save': 'Salva',
    'common.delete': 'Elimina',
    'common.cancel': 'Annulla',
    'common.resetFilters': 'Reset filtri',
    'common.selectEllipsis': 'Seleziona…',
    'common.month': 'mese',
    'common.months': 'mesi',
    'common.na': 'N/D',
    'common.loading': 'Attendi un momento…',

    // Trader Points
    'traderPoints.page.title': 'Trader Points — simulazione e impatto',
    'traderPoints.page.subtitle': 'Attività · Rischio · Retention',
    'traderPoints.dataSource.label': 'Fonte dati',
    'traderPoints.dataSource.console': 'Console',
    'traderPoints.dataSource.csv': 'CSV (diagnostico)',
    'traderPoints.console.loading': 'Caricamento…',
    'traderPoints.console.supportSource': 'Support (user check) · {count} utenti',
    'traderPoints.console.mockSource': 'Mock di fallback · {count} utenti',
    'traderPoints.console.mockBadge': 'Dati mock (indice non disponibile)',
    'traderPoints.console.loadErrorFallback': 'Impossibile caricare l’indice utenti di supporto',
    'traderPoints.chips.spread': 'Spread medio 0.1 pips',
    'traderPoints.chips.leverage': 'Leva 1:500',

    'traderPoints.exec.title': 'Sintesi esecutiva — vista decisionale',
    'traderPoints.exec.retention.label': 'RITENZIONE',
    'traderPoints.exec.activity.label': 'ATTIVITÀ',
    'traderPoints.exec.risk.label': 'RISCHIO',
    'traderPoints.exec.retention.unitDays': 'giorni',
    'traderPoints.exec.retention.caption': 'Gli utenti restano attivi più a lungo',
    'traderPoints.exec.activity.value': '≈ invariata',
    'traderPoints.exec.activity.caption': 'Il ritmo di trading resta stabile',
    'traderPoints.exec.risk.value': 'Controllato',
    'traderPoints.exec.risk.caption': 'Nessun aumento di comportamenti ad alto rischio',
    'traderPoints.exec.causal.line1':
      'L’aumento del valore totale deriva dal fatto che gli utenti restano attivi più a lungo,',
    'traderPoints.exec.causal.line2': 'non dal fatto che facciano trading in modo più aggressivo.',
    'traderPoints.exec.mechanics.1': 'Stessa attività giornaliera → nessuna pressione sugli utenti',
    'traderPoints.exec.mechanics.2': 'Percorso più lungo → più obiettivi completati',
    'traderPoints.exec.mechanics.3': 'Reward legato alle commissioni → costo prevedibile',
    'traderPoints.exec.takeaway.title': 'Takeaway esecutivo',
    'traderPoints.exec.takeaway.text':
      'A parità di costo, gli incentivi a obiettivo migliorano la retention aumentando la partecipazione, non l’intensità.',

    'traderPoints.deepDive.title': 'Approfondimento',
    'traderPoints.section.whatChanges': 'Cosa cambia',
    'traderPoints.deltaVs': 'Δ vs {baseline} · {oneLiner}',
    'traderPoints.baseline.label': 'Baseline',
    'traderPoints.baseline.noIncentive': 'Nessun incentivo',
    'traderPoints.baseline.classicBonus': 'Bonus classico',
    'traderPoints.baseline.tpDefault': 'Trader Points (default)',
    'traderPoints.baseline.oneLiner.classicBonus':
      'Il bonus classico tende a creare un picco di attività a breve termine con rapido decadimento.',
    'traderPoints.baseline.oneLiner.noIncentive': 'Baseline osservata (storico).',
    'traderPoints.baseline.oneLiner.tpDefault': 'Baseline a obiettivo (engagement progressivo).',
    'traderPoints.baseline.tooltip.label': 'Definizioni baseline',
    'traderPoints.baseline.tooltip.title': 'Baseline',
    'traderPoints.baseline.tooltip.noIncentive.title': 'Nessun incentivo',
    'traderPoints.baseline.tooltip.noIncentive.desc': 'Comportamento osservato (storico).',
    'traderPoints.baseline.tooltip.classicBonus.title': 'Bonus classico',
    'traderPoints.baseline.tooltip.classicBonus.desc':
      'Assunzioni spike+decay basate su regole (non derivate da regressioni).',
    'traderPoints.baseline.tooltip.tp.title': 'Trader Points',
    'traderPoints.baseline.tooltip.tp.desc': 'Baseline a obiettivo con engagement progressivo.',

    'traderPoints.narrativeBridge.title': 'Stesso ritmo, percorso più lungo',
    'traderPoints.narrativeBridge.line1': 'L’attività giornaliera resta quasi invariata.',
    'traderPoints.narrativeBridge.line2':
      'Ciò che cambia è per quanto tempo gli utenti rimangono attivi.',
    'traderPoints.narrativeBridge.line3': 'Tempo × costanza guidano i punti totali.',
    'traderPoints.narrativeBridge.formula.totalPoints': 'Punti totali',
    'traderPoints.narrativeBridge.formula.dailyActivity': 'Attività giornaliera',
    'traderPoints.narrativeBridge.formula.activeDays': 'Giorni attivi',

    'traderPoints.scenarioControls.title': 'Controlli scenario',
    'traderPoints.scenarioControls.subtitle': 'Regola incentivi e guardrail.',
    'traderPoints.chart.ppdTitle': 'Distribuzione posizioni/giorno',

    'traderPoints.economicLogic.title': 'Logica economica (costo costante)',
    'traderPoints.economicLogic.bullet1':
      'I bonus si guadagnano tramite commissioni, non vengono regalati',
    'traderPoints.economicLogic.bullet2':
      'La velocità di progress cambia la raggiungibilità, non il valore del bonus',
    'traderPoints.economicLogic.bullet3':
      'La retention cresce dalla partecipazione, non dalla pressione',

    'traderPoints.why.title': 'Perché succede',
    'traderPoints.why.tooltip.label': 'Perché gli incentivi a obiettivo funzionano',
    'traderPoints.why.tooltip.title': 'Perché gli incentivi a obiettivo funzionano',
    'traderPoints.why.tooltip.desc': 'Confronta comportamenti e raggiungibilità dell’obiettivo.',
    'traderPoints.why.heading': 'Perché gli incentivi a obiettivo funzionano',
    'traderPoints.why.bullet1': 'Più utenti entrano nel percorso a obiettivo',
    'traderPoints.why.bullet2': 'Meno utenti abbandonano prima del completamento',
    'traderPoints.why.bullet3': 'La retention cresce dalla partecipazione, non dalla pressione',

    'traderPoints.reachability.micro': 'Rende l’obiettivo percepito come raggiungibile',

    'traderPoints.whyDynamic.guardrail':
      'In questo scenario, gli utenti ad alto rischio sono esclusi dall’eligibilità allo sblocco.',
    'traderPoints.whyDynamic.faster':
      'In questo scenario, il progress “sembra” più veloce (×{mult}).',
    'traderPoints.whyDynamic.slower':
      'In questo scenario, il progress “sembra” più lento (×{mult}).',
    'traderPoints.whyDynamic.targetCloser':
      'In questo scenario, l’obiettivo “sembra” più vicino (gratificazione più rapida).',
    'traderPoints.whyDynamic.targetFarther':
      'In questo scenario, l’obiettivo “sembra” più lontano (percorso più lungo).',
    'traderPoints.whyDynamic.unlockRate':
      'In questo scenario, ~{pct}% degli utenti si assume sia target dell’obiettivo.',
    'traderPoints.whyDynamic.bonusValue':
      'In questo scenario, il valore del reward finale è {amount}.',
    'traderPoints.whyDynamic.default':
      'In questo scenario, raggiungibilità e distanza dall’obiettivo sono vicine alla baseline.',

    'traderPoints.optional.reliability': 'Affidabilità (opzionale)',
    'traderPoints.optional.datasetOverview': 'Panoramica dataset (opzionale)',
    'traderPoints.optional.tables': 'Tabelle di dettaglio (opzionale)',
    'traderPoints.optional.export': 'Export (opzionale)',

    'traderPoints.export.snapshotCsv': 'Esporta snapshot (CSV)',
    'traderPoints.export.snapshotJson': 'Esporta snapshot (JSON)',
    'traderPoints.export.ppdCsv': 'Esporta PPD (CSV)',

    // Scenario Controls
    'traderPoints.controls.preset.title': 'Preset',
    'traderPoints.controls.preset.micro': 'Logica: obiettivo legato alle commissioni.',
    'traderPoints.controls.preset.custom': 'Personalizzato',
    'traderPoints.controls.preset.commissionOnly': 'Solo commissioni',
    'traderPoints.controls.preset.commissionOnly.sub':
      'Baseline: obiettivo commission-linked (€200) con guardrail standard.',
    'traderPoints.controls.preset.goal500': 'Obiettivo €500',
    'traderPoints.controls.preset.goal500.sub':
      'Obiettivo più alto (€500) con boost moderato di raggiungibilità (×1.5) e partecipazione più ampia.',
    'traderPoints.controls.preset.acceleratedPromo': 'Promo accelerata',
    'traderPoints.controls.preset.acceleratedPromo.sub':
      'Accelerazione promozionale (×4) con obiettivo €500; mostra un upper-bound dell’effetto reachability.',
    'traderPoints.controls.preset.tooltip.label': 'Preset',
    'traderPoints.controls.preset.tooltip.title': 'Preset',
    'traderPoints.controls.preset.tooltip.desc':
      'Questi preset cambiano solo i controlli scenario e il testo UI.',
    'traderPoints.controls.preset.whatMeans': 'Cosa significa:',

    'traderPoints.controls.reachability.label': 'Raggiungibilità obiettivo',
    'traderPoints.controls.reachability.tooltip.desc':
      'NON cambia come si guadagnano i punti. Cambia solo la raggiungibilità percepita dell’obiettivo.',
    'traderPoints.controls.reachability.delta.more':
      'Con ×{mult}, circa {pct}% di utenti in più raggiunge la soglia (prima dell’unlock rate).',
    'traderPoints.controls.reachability.delta.less':
      'Con ×{mult}, circa {pct}% di utenti in meno raggiunge la soglia (prima dell’unlock rate).',

    'traderPoints.controls.goal.label': 'Obiettivo (Trader Points)',
    'traderPoints.controls.goal.tooltip.label': 'Punti richiesti',
    'traderPoints.controls.goal.tooltip.title': 'Soglia obiettivo',
    'traderPoints.controls.goal.tooltip.line1':
      'I Trader Points rappresentano commissioni reali generate dall’utente.',
    'traderPoints.controls.goal.tooltip.line2':
      'Esempio: bonus €200 → obiettivo 200 Trader Points.',
    'traderPoints.controls.goal.micro':
      'L’obiettivo è legato alle commissioni (1 TP ≈ €1). Obiettivi più alti riducono la raggiungibilità.',
    'traderPoints.controls.goal.linkLabel': 'Collega obiettivo e costo bonus',

    'traderPoints.controls.bonus.label': 'Importo bonus',
    'traderPoints.controls.bonus.tooltip.label': 'Importo bonus',
    'traderPoints.controls.bonus.tooltip.title': 'Importo bonus',
    'traderPoints.controls.bonus.tooltip.line1': 'Il bonus è il costo economico (es. €200).',
    'traderPoints.controls.bonus.tooltip.line2':
      'Nel setup classico, i punti obiettivo corrispondono al bonus (commission-linked).',
    'traderPoints.controls.bonus.micro':
      'Il bonus si guadagna generando commissioni equivalenti (Trader Points).',

    'traderPoints.controls.unlockRate.label': 'Unlock rate (%)',
    'traderPoints.controls.unlockRate.tooltip.label': 'Unlock rate',
    'traderPoints.controls.unlockRate.tooltip.title': 'Unlock rate (%)',
    'traderPoints.controls.unlockRate.tooltip.line1': 'Quota di utenti target dell’obiettivo.',
    'traderPoints.controls.unlockRate.tooltip.line2':
      'Usato per la simulazione, non per payout reali.',
    'traderPoints.controls.unlockRate.helper.base':
      '{pct}% degli utenti si assume sia target dell’obiettivo.',
    'traderPoints.controls.unlockRate.helper.guardrail':
      '{base} Il guardrail riduce l’eligibilità degli utenti ad alto rischio.',
    'traderPoints.controls.unlockRate.helper.baseline': '{base} Quota partecipazione baseline.',
    'traderPoints.controls.unlockRate.helper.wider':
      '{base} Partecipazione più ampia → effetto di sistema maggiore.',
    'traderPoints.controls.unlockRate.helper.narrower':
      '{base} Partecipazione più stretta → effetto di sistema minore.',

    'traderPoints.controls.guardrail.label': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.label': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.title': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.line1':
      'Evita di incentivare comportamenti ad alto rischio.',
    'traderPoints.controls.guardrail.tooltip.line2':
      'Gli utenti ad alto rischio sono esclusi dall’eligibilità allo sblocco (proxy rischio interno).',
    'traderPoints.controls.guardrail.badge': 'Scenario filtrato per rischio',
    'traderPoints.controls.guardrail.micro.on':
      'Gli utenti ad alto rischio sono esclusi dall’eligibilità allo sblocco.',
    'traderPoints.controls.guardrail.micro.off':
      'Tutti gli utenti idonei sono considerati per lo sblocco.',

    // CSV Uploader
    'traderPoints.csvUploader.title': '1. Carica report posizioni',
    'traderPoints.csvUploader.rowsLoaded': 'Righe caricate: {count}',
    'traderPoints.csvUploader.rowsSkipped': ' | Righe scartate: {count}',

    // KPI Cards
    'traderPoints.kpi.activity.label': 'Attività media',
    'traderPoints.kpi.activity.unit': 'trades/giorno',
    'traderPoints.kpi.retention.label': 'Retention media',
    'traderPoints.kpi.retention.unit': 'giorni',
    'traderPoints.kpi.risk.label': 'Rischio medio',
    'traderPoints.kpi.risk.unit': 'rischio',
    'traderPoints.kpi.deltaLine': 'Δ vs {baseline} · Nuovo {value} {delta}',
    'traderPoints.kpi.activity.line':
      'Gli utenti fanno trading in modo più costante quando il progress è percepito reale.',
    'traderPoints.kpi.retention.line':
      'Gli utenti restano più a lungo quando l’avanzamento verso un obiettivo è visibile.',
    'traderPoints.kpi.risk.line.guardrail':
      'I guardrail evitano di incentivare comportamenti ad alto rischio.',
    'traderPoints.kpi.risk.line.noGuardrail':
      'Il rischio può aumentare quando incentivi più forti aumentano l’esposizione.',

    // Legacy (modalità CSV)
    'traderPoints.legacy.avgTradesPerUser': 'Trade medi/utente',
    'traderPoints.legacy.riskIndicator': 'Indicatore rischio',
    'traderPoints.legacy.activeDays': 'Giorni attivi',

    // Working set
    'traderPoints.workingSet.activeSample': 'Campione attivo',
    'traderPoints.workingSet.tooltip.rules.label': 'Regole working set',
    'traderPoints.workingSet.tooltip.rules.title': 'Filtro utenti attivi',
    'traderPoints.workingSet.tooltip.rules.deposits': 'depositi > 0',
    'traderPoints.workingSet.tooltip.rules.positions': 'posizioni > 0',
    'traderPoints.workingSet.tooltip.rules.age': 'età account > 1 giorno',
    'traderPoints.workingSet.avgPositions': 'Posizioni medie (conteggio)',
    'traderPoints.workingSet.tooltip.positions.label': 'Info conteggio posizioni',
    'traderPoints.workingSet.tooltip.positions.title': 'Cosa sono le “posizioni”?',
    'traderPoints.workingSet.tooltip.positions.desc':
      'È la colonna del report con il totale storico di posizioni/trade, non le “posizioni aperte ora”.',
    'traderPoints.workingSet.medianLabel': 'Mediana {value}',
    'traderPoints.workingSet.ppdMedianZone': 'Posizioni/giorno (zona mediana)',
    'traderPoints.workingSet.tooltip.ppd.label': 'Definizioni posizioni/giorno',
    'traderPoints.workingSet.tooltip.ppd.title': 'Posizioni/giorno',
    'traderPoints.workingSet.tooltip.ppd.formula':
      'PPD = posizioni / giorniDa(qualifica o primo deposito)',
    'traderPoints.workingSet.tooltip.ppd.zone':
      'La “zona mediana” mantiene i valori vicini alla mediana (Gauss-like via MAD σ) per ridurre l’impatto degli outlier.',
    'traderPoints.workingSet.keptLine': 'Tenuti {keptPct}% · Mediana {median}',
    'traderPoints.workingSet.rawLine': 'Media grezza {rawMean} · Globale {globalMean}',
    'traderPoints.workingSet.lifetime': 'Lifetime (giorni)',
    'traderPoints.workingSet.tooltip.lifetime.label': 'Definizioni lifetime',
    'traderPoints.workingSet.tooltip.lifetime.title': 'Definizioni',
    'traderPoints.workingSet.tooltip.lifetime.account':
      'Lifetime account: giorni dalla registrazione.',
    'traderPoints.workingSet.tooltip.lifetime.trader':
      'Lifetime trader: giorni dalla qualifica/primo deposito (se disponibile).',
    'traderPoints.workingSet.traderLifetimeLine': 'Lifetime trader {days} · {pct}% disponibile',

    // Regression Summary
    'traderPoints.regression.title': 'Affidabilità del segnale (direzionale)',
    'traderPoints.regression.tooltip.label': 'Affidabilità segnale',
    'traderPoints.regression.tooltip.title': 'Affidabilità del segnale (direzionale)',
    'traderPoints.regression.tooltip.desc':
      'Queste stime servono per direzione e impatto relativo, non per fare previsioni puntuali.',
    'traderPoints.regression.tooltip.note': 'Supporto decisionale — non stima per singolo utente.',
    'traderPoints.regression.metric.activity': 'Attività',
    'traderPoints.regression.metric.risk': 'Rischio',
    'traderPoints.regression.metric.retention': 'Retention',
    'traderPoints.regression.r2Label.low': 'Segnale basso — solo direzione',
    'traderPoints.regression.r2Label.weak': 'Debole',
    'traderPoints.regression.r2Label.medium': 'Medio',
    'traderPoints.regression.r2Label.strong': 'Forte',
    'traderPoints.regression.avgError': 'Errore medio (unità reali): {value}',
    'traderPoints.regression.maeText.activity': '±{value} trades/giorno',
    'traderPoints.regression.maeText.retention': '±{value} giorni',
    'traderPoints.regression.maeText.risk': '±{value} unità rischio',

    // Impact Breakdown
    'traderPoints.impact.whereRetentionTitle': 'Da dove viene davvero la retention',
    'traderPoints.impact.micro':
      'Come cambia la retention media quando aumenta la raggiungibilità.',
    'traderPoints.impact.howCalc.label': 'Come si calcola',
    'traderPoints.impact.howCalc.title': 'Come si calcola questo numero',
    'traderPoints.impact.howCalc.step1': '1) Alcuni utenti raggiungono la soglia (eligibili).',
    'traderPoints.impact.howCalc.step2':
      '2) Una quota degli eligibili entra nel percorso obiettivo (unlock rate).',
    'traderPoints.impact.howCalc.step3':
      '3) La retention media cresce soprattutto perché più utenti partecipano al percorso obiettivo, non perché diventano più “intensi” o aumentano il rischio.',
    'traderPoints.impact.reachability': 'Raggiungibilità',
    'traderPoints.impact.eligibleUsers': 'Utenti eligibili',
    'traderPoints.impact.eligibleDesc': 'Raggiungono la soglia al ritmo attuale.',
    'traderPoints.impact.unlockedUsers': 'Utenti sbloccati',
    'traderPoints.impact.unlockedDesc': 'Entrano nel percorso obiettivo.',
    'traderPoints.impact.definitions':
      'Definizioni: eligibile = raggiunge la soglia. sbloccato = eligibile che entra nel percorso (unlock rate).',
    'traderPoints.impact.retention': 'Retention',
    'traderPoints.impact.retentionBaseline': 'Retention media (baseline)',
    'traderPoints.impact.retentionScenario': 'Retention media (scenario)',
    'traderPoints.impact.retentionUplift': 'Incremento retention media',
    'traderPoints.impact.compositionTitle':
      'Incremento dalla quota sbloccata (effetto composizione)',
    'traderPoints.impact.compositionDesc':
      'Con più velocità, più utenti entrano nel percorso obiettivo.',
    'traderPoints.impact.perUserTitle':
      'Incremento sugli utenti già sbloccati (effetto per-utente)',
    'traderPoints.impact.perUserDesc':
      'Gli utenti che avrebbero sbloccato anche a ×1 si sentono più vicini al completamento.',
    'traderPoints.impact.sanity.title': 'Sanity check del modello (opzionale)',
    'traderPoints.impact.sanity.note':
      'Solo audit: verifica la consistenza interna dei calcoli scenario.',
    'traderPoints.impact.sanity.avgPointsBefore': 'Punti medi (prima)',
    'traderPoints.impact.sanity.avgPointsAfter': 'Punti medi (dopo)',
    'traderPoints.impact.sanity.aboveThreshold1x': 'Sopra soglia (×1)',
    'traderPoints.impact.sanity.aboveThresholdMx': 'Sopra soglia (×{mult})',
    'traderPoints.impact.sanity.footer':
      'Prima/dopo usano la stessa soglia e unlock rate; cambia solo la raggiungibilità.',

    // Tables
    'traderPoints.tables.unknownUser': 'Sconosciuto',
    'traderPoints.tables.idPrefix': 'ID',
    'traderPoints.tables.symbolsTop': 'Top simboli',
    'traderPoints.tables.symbolsTooltip.label': 'Contesto simboli',
    'traderPoints.tables.symbolsTooltip.title': 'Come si calcola',
    'traderPoints.tables.symbolsTooltip.line1':
      'In modalità user-centric usiamo una distribuzione globale dei simboli (peso %).',
    'traderPoints.tables.symbolsTooltip.line2':
      '“Punti stimati” è una stima proporzionale basata sul peso del simbolo.',
    'traderPoints.tables.col.symbol': 'Simbolo',
    'traderPoints.tables.col.weight': 'Peso',
    'traderPoints.tables.col.estimatedPoints': 'Punti stimati',
    'traderPoints.tables.usersTop': 'Top utenti',
    'traderPoints.tables.topByPositions': 'Top per posizioni',
    'traderPoints.tables.usersLow': 'Utenti bassi',
    'traderPoints.tables.col.user': 'Utente',
    'traderPoints.tables.col.positions': 'Posizioni',
    'traderPoints.tables.col.points': 'Punti',
    'traderPoints.tables.pointsFloored': '(troncati a 0)',

    // Chart tooltip/aria
    'traderPoints.chart.tooltip.label': 'Dettagli grafico',
    'traderPoints.chart.tooltip.title': 'Cosa mostra',
    'traderPoints.chart.tooltip.line1':
      'La curva è un riferimento “smooth” costruito da mediana e una stima robusta della dispersione.',
    'traderPoints.chart.tooltip.line2':
      'L’asse X è “clippato” (p1–p99 o intorno alla mediana) così le code lunghe non schiacciano l’istogramma.',
    'traderPoints.chart.stats': 'N={n} · mediana≈{mu} · dispersione≈{sigma}',
    'traderPoints.chart.aria': 'Istogramma posizioni per giorno con curva gaussiana',
    'traderPoints.chart.medianLabel': 'mediana',

    'common.keys.enter': 'Invio',

    // Report
    'report.loader.data': 'Caricamento dati report…',
    'report.period.global': 'Globale',
    'report.period.annual': 'Annuale {year}',
    'report.period.monthly': 'Mensile {month}',
    'report.period.monthlyFallback': 'Mensile',

    'report.header.label': 'Report',
    'report.header.title': 'Report rapido per periodo',
    'report.header.subtitle': 'Una panoramica compatta per periodo. KPI + top affiliati.',

    'report.modes.monthly': 'Mensile',
    'report.modes.annual': 'Annuale',
    'report.modes.global': 'Globale',

    'report.filters.month': 'Mese',
    'report.filters.noMonths': 'Nessun mese disponibile',

    'report.summary.periodLabel': 'Periodo',
    'report.summary.rowsLine': '{media} righe media · {payments} pagamenti',
    'report.summary.sourceLine': 'Fonte: Media Report + Payments/Commissions',

    'report.kpis.cpaHint': 'Pagamenti / FTD',
    'report.kpis.arpuHint': 'PL / registrazioni',
    'report.kpis.profitHint': 'PL - pagamenti',
    'report.kpis.roiHint': 'Profit / pagamenti',
    'report.kpis.volumeHint': 'Registrazioni e FTD',

    'report.topAffiliates.title': 'Top affiliati (8)',
    'report.topAffiliates.subtitle': 'Ordine per profitto · Fonte: media+payments',

    'report.table.headers.affiliate': 'Affiliate',
    'report.table.headers.reg': 'Reg',
    'report.table.headers.ftd': 'FTD',
    'report.table.headers.cpa': 'CPA',
    'report.table.headers.arpu': 'ARPU',
    'report.table.headers.roi': 'ROI',
    'report.table.headers.profit': 'Profit',
    'report.table.headers.breakEven': 'Break-even',
    'report.table.empty.noDataForPeriod': 'Nessun dato nel periodo selezionato',
    'report.table.breakEvenMonths': '{count} mesi',

    'report.exportNotes.title': 'Note per export',
    'report.exportNotes.subtitle': 'Base layout pronta per aggiungere pulsante export',
    'report.exportNotes.item1': 'Layout chiaro e tabella già ordinata per profitto.',
    'report.exportNotes.item2':
      'Filtro periodo: globale (tutti i dati), annuale (anno corrente), mensile (mese selezionato).',
    'report.exportNotes.item3':
      'Metriche chiave: CPA, ARPU, profit, volume (reg/FTD), break-even stimato.',
    'report.exportNotes.item4':
      'Pronto a collegare un bottone di export (PDF/CSV) senza stravolgere il layout.',

    // Departments
    'departments.Infrastructure': 'Infrastructure',
    'departments.Product': 'Product',
    'departments.Data': 'Data',
    'departments.Compliance': 'Compliance',
    'departments.UX': 'UX',
    'departments.Partners': 'Partners',

    // Ongoing (Execution Board)
    'ongoing.confirm.resetToSeed':
      'Questo sovrascriverà le modifiche locali e ripristinerà i dati iniziali. Continuare?',
    'ongoing.placeholder.example': 'es. Depositi netti, registrazioni, churn',

    'ongoing.header.layerLabel': 'Livello di esecuzione',
    'ongoing.header.title': 'Bacheca di esecuzione',
    'ongoing.header.subtitle':
      'Attività attive collegate alle mega-stories e stories della Roadmap 2026.',

    'ongoing.counters.active': '{count} attive',
    'ongoing.counters.blocked': '{count} bloccate',
    'ongoing.counters.done': '{count} completate',

    'ongoing.actions.resetToSeed': 'Ripristina seed',
    'ongoing.actions.markAsDone': 'Segna come completata',

    'ongoing.toggle.active': 'Attive',
    'ongoing.toggle.done': 'Completate',

    'ongoing.kpis.activeExecution': 'Esecuzione attiva',
    'ongoing.kpis.active': 'Attive',
    'ongoing.kpis.blocked': 'Bloccate',
    'ongoing.kpis.doneHistory': 'Completate / Storico',

    'ongoing.filters.megaStory': 'Mega-Story',
    'ongoing.filters.story': 'Story',
    'ongoing.filters.department': 'Dipartimento',
    'ongoing.filters.platformArea': 'Area piattaforma',
    'ongoing.filters.status': 'Stato',

    'ongoing.feed.historyLabel': 'Storico',
    'ongoing.feed.executionFeedLabel': 'Feed esecuzione',
    'ongoing.feed.completedTasksTitle': 'Attività completate',
    'ongoing.feed.activeExecutionTitle': 'Esecuzione attiva',
    'ongoing.feed.itemsCount': '{count} elementi',

    'ongoing.card.created': 'Creata {date}',
    'ongoing.card.completed': 'Completata {date}',

    'ongoing.labels.nextStep': 'Prossimo step',
    'ongoing.labels.blocker': 'Blocco',
    'ongoing.labels.impact': 'Impatto',

    'ongoing.empty.noTasksMatchFilters': 'Nessuna attività corrisponde ai filtri correnti.',

    'ongoing.details.title': 'Dettagli',
    'ongoing.details.panelTitle': 'Pannello dettagli',
    'ongoing.details.selectTask': 'Seleziona un’attività per vedere i dettagli.',
    'ongoing.details.objective': 'Obiettivo',
    'ongoing.details.nextStep': 'Prossimo step',
    'ongoing.details.dependenciesBlockers': 'Dipendenze / blocchi',
    'ongoing.details.created': 'Creata',
    'ongoing.details.impact': 'Impatto',
    'ongoing.details.capturedWhenDone': 'Acquisito quando segnata come completata.',
    'ongoing.details.kpi': 'KPI',
    'ongoing.details.note': 'Nota',
    'ongoing.details.completedOn': 'Completata il {date}',

    'ongoing.modal.title': 'Segna come completata',
    'ongoing.modal.impactType': 'Tipo impatto',
    'ongoing.modal.selectImpactType': 'Seleziona tipo impatto',
    'ongoing.modal.impactedDepartment': 'Dipartimento impattato',
    'ongoing.modal.selectDepartment': 'Seleziona dipartimento',
    'ongoing.modal.impactedPlatformArea': 'Area piattaforma impattata',
    'ongoing.modal.selectPlatformArea': 'Seleziona area',
    'ongoing.modal.impactedKpi': 'KPI impattata',
    'ongoing.modal.impactNoteOptional': 'Nota impatto (opzionale)',
    'ongoing.modal.saveImpactClose': 'Salva impatto e chiudi',

    'ongoing.triage.needsTriage': 'Da verificare',
    'ongoing.triage.mappingFixesRequired': 'Correzioni mapping necessarie',
    'ongoing.triage.selectMegaStory': 'Seleziona mega-story',
    'ongoing.triage.selectStory': 'Seleziona story',
    'ongoing.triage.saveMapping': 'Salva mapping',
    'ongoing.triage.noMega': 'nessuna mega',
    'ongoing.triage.noStory': 'nessuna story',
    'ongoing.triage.reasonLabel': 'Motivo',
    'ongoing.triage.noTasks': 'Nessuna attività richiede verifica.',
    'ongoing.triage.reason.unknownMegaStoryId': 'megaStoryId sconosciuto',
    'ongoing.triage.reason.unknownStoryId': 'storyId sconosciuto',
    'ongoing.triage.reason.storyNotUnderMegaStoryId': 'storyId non sotto megaStoryId',

    'ongoing.status.active': 'Attivo',
    'ongoing.status.blocked': 'Bloccato',
    'ongoing.status.done': 'Fatto',

    'ongoing.priority.high': 'Alta',
    'ongoing.priority.medium': 'Media',
    'ongoing.priority.low': 'Bassa',

    'ongoing.impactType.revenue': 'Ricavi',
    'ongoing.impactType.retention': 'Retention',
    'ongoing.impactType.risk_reduction': 'Riduzione rischio',
    'ongoing.impactType.efficiency': 'Efficienza',

    'ongoing.platformArea.Trading': 'Trading',
    'ongoing.platformArea.Analytics': 'Analytics',
    'ongoing.platformArea.Payments': 'Pagamenti',
    'ongoing.platformArea.Infra': 'Infra',
    'ongoing.platformArea.Profile': 'Profilo',
    'ongoing.platformArea.Internal': 'Interno',

    // Topbar
    'topbar.aria.toggleNavMenu': 'Apri/chiudi menu di navigazione',
    'topbar.aria.toggleSidebar': 'Apri/chiudi sidebar',

    // Support (page-level)
    'support.loader.page': 'Caricamento pagina support…',

    // Investments
    'investments.loader.data': 'Caricamento dati investimenti…',
    'investments.header.title': 'Pagamenti Affiliati – Registro Payout Affiliati',
    'investments.header.subtitle':
      'Costi affiliati a fine mese basati su QFTD qualificati, CPA e ROI.',
    'investments.filters.month': 'Mese',
    'investments.filters.allMonths': 'Tutti i mesi',
    'investments.badge.monthlyRows': '{count} righe mensili',

    'investments.kpi.totalQftd': 'QFTD totali',
    'investments.kpi.avgCpa': 'CPA medio',
    'investments.kpi.totalCommissions': 'Commissioni totali',
    'investments.kpi.commissionPayable': 'Commissioni pagabili',
    'investments.kpi.commissionsDeferred': 'Commissioni differite',
    'investments.kpi.roi': 'ROI',
    'investments.kpi.paid': 'Pagato',

    'investments.section.payoutTimeline': 'Timeline pagamenti',
    'investments.section.affiliatePayoutSummary': 'Riepilogo payout affiliati',

    'investments.search.placeholder': 'Cerca affiliato',
    'investments.search.aria': 'Cerca affiliato',

    'investments.table.header.affiliate': 'Affiliato',
    'investments.table.header.cpa': 'CPA',
    'investments.table.header.totalQftd': 'QFTD totali',
    'investments.table.header.paidFiltered': 'Pagato (filtrato)',
    'investments.table.header.pl': 'P/L',
    'investments.table.header.currentMonthCommission': 'Comm. mese corrente',
    'investments.table.header.financeConfirmed': 'Confermato finance',
    'investments.table.header.lastMonth': 'Ultimo mese',
    'investments.table.header.details': 'Dettagli',
    'investments.table.title.paidFiltered': 'Importi pagati entro i filtri correnti',
    'investments.table.row.totals': 'Totali (filtri)',

    'investments.input.title.overrideCpa': 'Sovrascrivi CPA per questo affiliato',
    'investments.checkbox.title.financeConfirmed': 'Segna come confermato dal finance',
    'investments.button.details': 'Dettagli',

    'investments.details.header.month': 'Mese',
    'investments.details.header.reg': 'Reg',
    'investments.details.header.ftd': 'FTD',
    'investments.details.header.qftd': 'QFTD',
    'investments.details.header.netDeposits': 'Depositi netti',
    'investments.details.header.commissions': 'Commissioni',
    'investments.details.header.pl': 'P/L',
    'investments.details.header.roi': 'ROI',
    'investments.details.header.cpa': 'CPA',
    'investments.details.header.commExpected': 'Comm. attesa',
    'investments.details.header.commActual': 'Comm. reale',
    'investments.details.header.commPayable': 'Comm. pagabile',
    'investments.details.header.commDeferred': 'Comm. differita',
    'investments.details.header.paid': 'Pagato',
    'investments.details.header.paymentDate': 'Data pagamento',
    'investments.details.header.details': 'Dettagli',

    'investments.details.title.roiFormula': 'ROI = Depositi netti / Commissione',
    'investments.details.title.commExpected': 'Attesa = commissione dal Media Report',
    'investments.details.title.commActual':
      'Reale usa una guardrail ROI: se ROI >= 1.5 usa l’attesa, altrimenti Depositi netti / 1.5',
    'investments.details.title.commPayable': 'Pagabile = min(attesa, reale)',
    'investments.details.title.commDeferred': 'Differita = attesa − pagabile',
    'investments.details.empty.noMonthlyRows': 'Nessuna riga mensile.',
    'investments.table.empty.noAffiliates': 'Nessun affiliato per i filtri correnti.',
    'investments.button.showTop10': 'Mostra top 10',
    'investments.button.showAll': 'Mostra tutti ({count})',

    // Weekly map
    'weeklyMap.placeholders.weeklyTaskTitle': 'Titolo attività settimanale',
    'weeklyMap.placeholders.owner': 'Owner',
    'weeklyMap.placeholders.expectedImpact': 'Perché è importante questa settimana',

    'weeklyMap.columns.planned': 'Pianificato',
    'weeklyMap.columns.inProgress': 'In corso',
    'weeklyMap.columns.blocked': 'Bloccato',
    'weeklyMap.columns.done': 'Fatto',

    'weeklyMap.confirm.deleteTask': 'Eliminare questa attività settimanale?',

    'weeklyMap.header.filteredTitle': 'Weekly Map — filtrata per Mega-Story',
    'weeklyMap.header.allTitle': 'Weekly Map (Tutte le Mega-Stories)',
    'weeklyMap.header.executionContract': 'Contratto di esecuzione per la settimana',
    'weeklyMap.header.weekRange': 'Settimana {start} → {end}',
    'weeklyMap.header.currentWeekBadge': '(SETTIMANA CORRENTE)',
    'weeklyMap.header.archivedReadOnlyBadge': '(archiviata, sola lettura)',
    'weeklyMap.header.executionCommitments': 'Impegni di esecuzione',
    'weeklyMap.header.tasksCount': '{count} attività',

    'weeklyMap.filters.week': 'Settimana',
    'weeklyMap.filters.currentBadge': '(corrente)',

    'weeklyMap.modal.readOnlyHint':
      'Modalità focus in sola lettura — usala per preparare le decisioni.',

    'weeklyMap.card.mega': 'Mega',
    'weeklyMap.card.dept': 'Dept',
    'weeklyMap.card.story': 'Story',

    'weeklyMap.empty.noTasks': 'Nessuna attività',

    'weeklyMap.actions.addCommitmentHint': 'Aggiungi un nuovo impegno (solo settimana corrente)',
    'weeklyMap.actions.hideForm': 'Nascondi form',
    'weeklyMap.actions.addCommitment': 'Aggiungi impegno',
    'weeklyMap.actions.shareLink': 'Condividi link',
    'weeklyMap.actions.copied': 'Copiato',

    'weeklyMap.form.megaStory': 'Mega-Story',
    'weeklyMap.form.title': 'Titolo',
    'weeklyMap.form.storyOptional': 'Story (opzionale)',
    'weeklyMap.form.department': 'Dipartimento',
    'weeklyMap.form.owner': 'Owner',
    'weeklyMap.form.expectedImpactMandatory': 'Impatto atteso (obbligatorio)',

    'weeklyMap.validation.expectedImpactRequired':
      'Senza Impatto atteso, l’attività non può essere salvata.',

    'weeklyMap.checklists.prepareSolitics.title': 'Prepara call Solitics — Checklist',
    'weeklyMap.checklists.prepareStamatis.title': 'Prepara call con Stamatis — Checklist',

    'weeklyMap.checklists.common.useCases.title': 'USE CASES',
    'weeklyMap.checklists.common.dataIntegration.title': 'DATI & INTEGRAZIONE',
    'weeklyMap.checklists.common.decisionMaking.title': 'DECISIONI',
    'weeklyMap.checklists.common.ownershipLimits.title': 'OWNERSHIP & LIMITI',
    'weeklyMap.checklists.common.priorities.title': 'PRIORITÀ',
    'weeklyMap.checklists.common.governance.title': 'GOVERNANCE',
    'weeklyMap.checklists.common.roleAutonomy.title': 'RUOLO & AUTONOMIA',
    'weeklyMap.checklists.common.closure.title': 'CHIUSURA',

    'weeklyMap.checklists.common.currentStatus.title': 'STATO ATTUALE',
    'weeklyMap.checklists.common.strategicAlignment.title': 'ALLINEAMENTO STRATEGICO',
    'weeklyMap.checklists.common.ownershipModel.title': 'MODELLO DI OWNERSHIP',
    'weeklyMap.checklists.common.nextSteps.title': 'PROSSIMI STEP',

    'weeklyMap.checklists.prepareSolitics.useCases.item1':
      'Quali comportamenti concreti degli utenti stiamo cercando di rilevare?',
    'weeklyMap.checklists.prepareSolitics.useCases.item2':
      'Quali scenari di retention o churn contano di più in questo momento?',
    'weeklyMap.checklists.prepareSolitics.data.item1':
      'Qual è il dataset minimo necessario per generare valore?',
    'weeklyMap.checklists.prepareSolitics.data.item2': 'Cosa può essere escluso in sicurezza?',
    'weeklyMap.checklists.prepareSolitics.decisions.item1':
      'Quali decisioni dovrebbe supportare attivamente Solitics?',
    'weeklyMap.checklists.prepareSolitics.decisions.item2':
      'Cosa rimane logica decisionale interna?',
    'weeklyMap.checklists.prepareSolitics.ownership.item1': 'Cosa NON dovrebbe fare Solitics?',
    'weeklyMap.checklists.prepareSolitics.ownership.item2':
      'Come misuriamo il successo dopo 30 giorni?',

    'weeklyMap.checklists.soliticsDecisionSummary.title': 'Call Solitics + decision summary — Note',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item1':
      'Accesso alla replica confermato; sincronizzazione Skale aggiuntiva ancora in sospeso (owner + timeline).',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item2':
      'Onboarding/dashboard Solitics in corso — NON ancora live.',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item3':
      'Roman è l’interfaccia principale per esecuzione e follow-up.',
    'weeklyMap.checklists.soliticsDecisionSummary.alignment.item1':
      'Leva primaria: retention (segmenti + trigger), non automazioni “nice-to-have”.',
    'weeklyMap.checklists.soliticsDecisionSummary.alignment.item2':
      'Successo = miglioramento LTV / repeat deposits / attività di trading (partire con scope MVP).',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item1':
      'Interno: dati/integrazione, governance, e regole decisionali/segmentazione (source of truth).',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item2':
      'Marketing: esecuzione campagne, offerte/bonus, messaggistica e loop operativi.',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item3':
      'Solitics: motore di automazione + dashboard; non owner della business logic core.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item1':
      'Confermare l’allineamento finale con Skale e i campi dati necessari.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item2':
      'Condividere con Solitics i primi segmenti, KPI e aspettative di reporting.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item3':
      'Impostare una cadenza settimanale con Roman + Marketing per chiudere il loop.',

    'weeklyMap.checklists.prepareStamatis.priorities.item1':
      'Qual è la singola priorità n.1 per i prossimi 30–60 giorni?',
    'weeklyMap.checklists.prepareStamatis.priorities.item2':
      'Cosa possiamo esplicitamente de-prioritizzare?',
    'weeklyMap.checklists.prepareStamatis.governance.item1':
      'Chi decide cosa entra o esce dalla roadmap?',
    'weeklyMap.checklists.prepareStamatis.governance.item2':
      'Cosa definisce successo o fallimento di un’iniziativa?',
    'weeklyMap.checklists.prepareStamatis.autonomy.item1':
      'Quali decisioni possono essere prese in autonomia?',
    'weeklyMap.checklists.prepareStamatis.autonomy.item2': 'Quando è necessaria un’escalation?',
    'weeklyMap.checklists.prepareStamatis.closure.item1':
      'Quali decisioni concrete devono essere prese in questa call?',
    'weeklyMap.checklists.prepareStamatis.closure.item2':
      'Quale follow-up è richiesto dopo la call?',

    // Affiliate analysis
    'affiliateAnalysis.common.thisAffiliate': 'questo affiliato',
    'affiliateAnalysis.common.na': 'N/D',
    'affiliateAnalysis.period.thisPeriod': 'Questo periodo',
    'affiliateAnalysis.period.previousMonth': 'mese precedente',

    'affiliateAnalysis.badge.healthy': 'Sano',
    'affiliateAnalysis.badge.watch': 'Da monitorare',
    'affiliateAnalysis.badge.atRisk': 'A rischio',
    'affiliateAnalysis.badgeWithProfit': '{label} · Profitto {value}',

    'affiliateAnalysis.topAffiliates.title': 'Top 10 Affiliati (per Profitto)',
    'affiliateAnalysis.topAffiliates.subtitle': 'Seleziona un affiliato per vedere l’analisi',
    'affiliateAnalysis.topAffiliates.profit': 'Profitto {value}',
    'affiliateAnalysis.topAffiliates.cohortYes': 'Cohort ✓',
    'affiliateAnalysis.topAffiliates.cohortNo': 'Nessuna cohort',

    'affiliateAnalysis.button.backToTopAffiliates': '← Torna alla Top Affiliati',

    'affiliateAnalysis.share.button': 'Condividi report',
    'affiliateAnalysis.share.creating': 'Creazione…',
    'affiliateAnalysis.share.copied': 'Copiato',
    'affiliateAnalysis.share.hint': 'Crea un link pubblico in sola lettura per il board',
    'affiliateAnalysis.share.error': 'Impossibile creare il link di condivisione',

    'affiliateAnalysis.header.title': 'Analisi affiliato – {affiliate}',
    'affiliateAnalysis.header.subtitle': 'Panoramica performance · Periodo: {period}',

    'affiliateAnalysis.filters.affiliate': 'Affiliato',
    'affiliateAnalysis.filters.selectAffiliate': 'Seleziona affiliato…',

    'affiliateAnalysis.kpi.netDeposits': 'Depositi netti',
    'affiliateAnalysis.kpi.pl': 'P/L',
    'affiliateAnalysis.kpi.profit': 'Profitto',
    'affiliateAnalysis.kpi.roi': 'ROI',
    'affiliateAnalysis.kpi.payments': 'Pagamenti',
    'affiliateAnalysis.kpi.ftdPerReg': 'FTD / Reg',

    'affiliateAnalysis.kpiHelper.totalPnL': 'P&L totale',
    'affiliateAnalysis.kpiHelper.plMinusPayments': 'P/L − pagamenti',
    'affiliateAnalysis.kpiHelper.profitDivPayments': 'Profitto / pagamenti',
    'affiliateAnalysis.kpiHelper.commissionPayouts': 'Commissioni / payout',
    'affiliateAnalysis.kpiHelper.firstDepositsVsRegistrations': 'Primi depositi vs registrazioni',

    'affiliateAnalysis.sections.financialMetrics.title': 'Metriche finanziarie',
    'affiliateAnalysis.sections.financialMetrics.subtitle': 'Snapshot di efficienza',
    'affiliateAnalysis.sections.allKeyMetrics.title':
      'Tutte le metriche chiave per questo affiliato',
    'affiliateAnalysis.sections.allKeyMetrics.subtitle':
      'Snapshot KPI completo per questo affiliato',
    'affiliateAnalysis.sections.monthlyTrends.title': 'Trend mensili',
    'affiliateAnalysis.sections.monthlyTrends.subtitle': 'Depositi netti, P/L, Profitto',

    'affiliateAnalysis.financial.paybackVsDeposits': 'Payback vs depositi',
    'affiliateAnalysis.financial.payoutRatio': 'Payout ratio',
    'affiliateAnalysis.financial.plPerFtd': 'P/L per FTD',
    'affiliateAnalysis.financial.profitPerUser': 'Profitto per utente',
    'affiliateAnalysis.financial.helper.profitDivNetDeposits': 'Profitto / depositi netti',
    'affiliateAnalysis.financial.helper.paymentsDivNetDeposits': 'Pagamenti / depositi netti',
    'affiliateAnalysis.financial.helper.plDivFtd': 'P/L / FTD',
    'affiliateAnalysis.financial.helper.profitDivUsers': 'Profitto / utenti',

    'affiliateAnalysis.chart.netDeposits': 'Depositi netti',
    'affiliateAnalysis.chart.pl': 'P/L',
    'affiliateAnalysis.chart.profit': 'Profitto',

    'affiliateAnalysis.empty.selectAffiliate': 'Seleziona un affiliato per vedere l’analisi',

    'affiliateAnalysis.cohort.monthLabel': 'Mese {index}',

    'affiliateAnalysis.metrics.cpa': 'CPA',
    'affiliateAnalysis.metrics.arpu': 'ARPU',
    'affiliateAnalysis.metrics.ltvPerUser': 'LTV / utente',
    'affiliateAnalysis.metrics.profitMargin': 'Margine di profitto',
    'affiliateAnalysis.metrics.churnPct': 'Churn %',
    'affiliateAnalysis.metrics.conversionRate': 'Tasso di conversione',
    'affiliateAnalysis.metrics.ftdRatio': 'Rapporto FTD',
    'affiliateAnalysis.metrics.qftdRatio': 'Rapporto QFTD',
    'affiliateAnalysis.metrics.withdrawals': 'Prelievi',
    'affiliateAnalysis.metrics.bestMonth': 'Mese migliore',
    'affiliateAnalysis.metrics.worstMonth': 'Mese peggiore',
    'affiliateAnalysis.metrics.helper.paymentsDivFtd': 'Pagamenti / FTD',
    'affiliateAnalysis.metrics.helper.plDivRegistrations': 'P/L / registrazioni',
    'affiliateAnalysis.metrics.helper.plDivUsers': 'P/L / utenti',
    'affiliateAnalysis.metrics.helper.profitVsPl': 'Profitto vs P/L',
    'affiliateAnalysis.metrics.helper.weightedChurnPct': 'Churn % pesato',
    'affiliateAnalysis.metrics.helper.registrationsDivVisitors': 'Registrazioni / visitatori',
    'affiliateAnalysis.metrics.helper.ftdDivRegistrations': 'FTD / registrazioni',
    'affiliateAnalysis.metrics.helper.qftdDivFtd': 'QFTD / FTD',
    'affiliateAnalysis.metrics.helper.totalWithdrawals': 'Prelievi totali',
    'affiliateAnalysis.metrics.helper.byProfit': 'Per profitto',

    'affiliateAnalysis.engine.empty.title': 'Analysis Engine — Insight automatici',
    'affiliateAnalysis.engine.empty.subtitle': 'Insight deterministici costruiti da KPI',
    'affiliateAnalysis.engine.empty.body':
      'Seleziona un affiliato e una finestra temporale per generare gli insight.',

    'affiliateAnalysis.engine.sections.riskSignals': '📉 Segnali di rischio',
    'affiliateAnalysis.engine.sections.upsideOpportunities': '🎯 Opportunità di crescita',
    'affiliateAnalysis.engine.sections.currentOutlook': '🧭 Outlook attuale',

    'affiliateAnalysis.engine.profitTrend.subtitle':
      'Attuale vs mese precedente: {current} vs {previous}',

    'affiliateAnalysis.engine.cohort.notReached': 'Non raggiunto',
    'affiliateAnalysis.engine.cohort.notAvailable': 'Cohort non disponibile',
    'affiliateAnalysis.engine.cohort.monthsValue': '{value} mesi',
    'affiliateAnalysis.engine.cohort.helper.avgTimeToNetProfit':
      'Tempo medio per raggiungere profitto netto (Top 10 Cohort PL)',
    'affiliateAnalysis.engine.cohort.helper.noData':
      'Il report Top 10 Cohort PL non ha dati per questo affiliato',

    'affiliateAnalysis.engine.title': 'Outlook performance affiliato — {affiliate}',
    'affiliateAnalysis.engine.subtitle': 'Segnali per {period}',

    'affiliateAnalysis.engine.kpi.periodProfit': 'Profitto periodo',
    'affiliateAnalysis.engine.kpi.roi': 'ROI',
    'affiliateAnalysis.engine.kpi.profitTrendLatestMonth': 'Trend profitto (ultimo mese)',
    'affiliateAnalysis.engine.kpi.cohortBreakEven': 'Break even cohort',
    'affiliateAnalysis.engine.kpiHelper.profitDivPayments': 'Profitto / pagamenti',

    'affiliateAnalysis.engine.headings.performanceRecap': 'Riepilogo performance',
    'affiliateAnalysis.engine.headings.narrativeSignals': 'Segnali narrativi',
    'affiliateAnalysis.engine.headings.recommendedActions': 'Azioni consigliate',
    'affiliateAnalysis.engine.recommendedActions.nextSteps': 'Prossimi passi',

    // Affiliate payments 2.0
    'affiliatePayments2.loader.data': 'Caricamento dati pagamenti…',

    // Investments (legacy)
    'investmentsLegacy.subtitle.commissionsFilter':
      'Commissioni da commissions.csv filtrabili per mese e affiliato.',

    // Fraud
    'fraud.loader.commissions': 'Caricamento commissioni…',
    'fraud.filters.search.placeholder': 'Cerca nome / affiliate / testo',
    'fraud.filters.severity.all': 'Tutte le severità',
    'fraud.filters.severity.critical': 'Critica',
    'fraud.filters.severity.high': 'Alta',
    'fraud.filters.severity.medium': 'Media',
    'fraud.filters.severity.low': 'Bassa',
    'fraud.filters.affiliateId.placeholder': 'Affiliate id',
    'fraud.filters.groupByNameCountry': 'Raggruppa per nome+paese',
    'fraud.filters.minCount': 'Conteggio minimo',
    'fraud.chart.aria.platformGrowthCumulative': 'Grafico cumulativo crescita piattaforma',
    'fraud.loader.dashboardData': 'Caricamento dati dashboard…',

    // Dashboard
    'dashboard.monthLabel': 'Mese {index}',

    'dashboard.kpiCards.retainedM1': 'Retained Mese 1',
    'dashboard.kpiCards.retainedM3': 'Retained Mese 3',
    'dashboard.kpiCards.retainedM6': 'Retained Mese 6',
    'dashboard.kpiCards.health': 'Salute cohort',
    'dashboard.kpiCards.retained.helper': 'Metrica principale: retained {metric} vs Mese 0',
    'dashboard.kpiCards.health.helper': 'Basato su regole: retained, half-life, lifetime',

    'dashboard.health.noData': 'Nessun dato',
    'dashboard.health.green': 'Verde',
    'dashboard.health.orange': 'Arancione',
    'dashboard.health.red': 'Rosso',

    'dashboard.cohortHealth.title': 'Salute cohort',
    'dashboard.cohortHealth.whyLabel': 'Perché',
    'dashboard.cohortHealth.meaningLabel': 'Significato',
    'dashboard.cohortHealth.nextCheckLabel': 'Prossimo check',
    'dashboard.cohortHealth.noData': 'Nessun dato cohort disponibile per questa selezione.',
    'dashboard.cohortHealth.interpretationUnavailable': 'Interpretazione non disponibile.',
    'dashboard.cohortHealth.recheckFallback': 'Ricontrolla retained M1 e M3.',
    'dashboard.cohortHealth.why.noData': 'Nessun dato cohort disponibile per questa selezione.',
    'dashboard.cohortHealth.why.green': 'Il valore resta forte oltre il Mese 0.',
    'dashboard.cohortHealth.why.early': 'La maggior parte del valore è generata nel Mese 0.',
    'dashboard.cohortHealth.why.r1Low': 'Il valore cala bruscamente dopo il Mese 0.',
    'dashboard.cohortHealth.why.r3Low': 'Il valore si esaurisce rapidamente entro il Mese 3.',
    'dashboard.cohortHealth.why.default': 'Il valore diminuisce dopo il Mese 0.',
    'dashboard.cohortHealth.meaning.noData':
      'Non ci sono abbastanza dati per valutare la salute della cohort.',
    'dashboard.cohortHealth.meaning.green':
      'L’attività ricorrente sostiene il valore per più mesi.',
    'dashboard.cohortHealth.meaning.orange': 'C’è attività ripetuta, ma si indebolisce nel tempo.',
    'dashboard.cohortHealth.meaning.red':
      'Il business dipende molto dal primo mese e da poca attività ripetuta.',
    'dashboard.cohortHealth.nextCheck.noData':
      'Attendi più mesi di attività e ricontrolla il valore retained M1/M3.',
    'dashboard.cohortHealth.nextCheck.default':
      'Dopo azioni di retention, concentrati sul migliorare retained M1 e M3.',
    'dashboard.cohortHealth.valueConcentration':
      'Concentrazione valore: {pct}% del valore totale generato in Mese 0',
    'dashboard.cohortHealth.halfLife.label': 'Half-life economica',
    'dashboard.cohortHealth.halfLife.notReached': 'non raggiunta (retained resta sopra 50%)',
    'dashboard.cohortHealth.halfLife.reached': '~{months} {unit} (retained scende sotto 50%)',
    'dashboard.cohortHealth.lifetime.label': 'Lifetime economica',
    'dashboard.cohortHealth.lifetime.notReached': 'non raggiunta (retained resta sopra 10%)',
    'dashboard.cohortHealth.lifetime.reached': '~{months} {unit} (retained scende sotto 10%)',

    'dashboard.monthlyAggregates.title': 'Aggregati mensili',
    'dashboard.monthlyAggregates.infoAria': 'Info sui dati',
    'dashboard.monthlyAggregates.infoText':
      '{cohortMetricLabel} e cohort size arrivano dal file di cohort selezionato; le commissioni pagate vengono prese dal Balance Report e assegnate al mese di acquisizione della cohort; il P&L è aggregato per data di first deposit (stessa logica delle cohort).',
    'dashboard.monthlyAggregates.cohortLabel': 'Cohort (mese FD)',
    'dashboard.monthlyAggregates.cohort.all': 'Tutte le cohort',
    'dashboard.monthlyAggregates.cohort.q1': 'Q1 (Gen–Mar)',
    'dashboard.monthlyAggregates.cohort.q2': 'Q2 (Apr–Giu)',
    'dashboard.monthlyAggregates.cohort.q3': 'Q3 (Lug–Set)',
    'dashboard.monthlyAggregates.cohort.q4': 'Q4 (Ott–Dic)',
    'dashboard.monthlyAggregates.cohort.s1': 'S1 (Gen–Giu)',
    'dashboard.monthlyAggregates.cohort.s2': 'S2 (Lug–Dic)',
    'dashboard.monthlyAggregates.affiliateLabel': 'Affiliate',
    'dashboard.monthlyAggregates.affiliate.all': 'Tutti nella cohort',
    'dashboard.monthlyAggregates.affiliate.noneAvailable': 'Nessun affiliato disponibile',
    'dashboard.monthlyAggregates.affiliate.top10Label': 'Top 10',
    'dashboard.monthlyAggregates.tableAutoFillHint':
      'La tabella viene popolata automaticamente con {cohortMetricLabel} e Cohort size della selezione.',

    'dashboard.loader.cohort': 'Caricamento dashboard cohort…',
    'dashboard.pulse.title': 'Polso finanziario cohort',
    'dashboard.pulse.subtitle':
      '{retainedMetricLabel} (%) mostra quanta parte del {cohortMetric} del Mese 0 resta nel tempo.',
    'dashboard.pulse.filter.metricLabel': 'Metrica',
    'dashboard.pulse.filter.calendarYearLabel': 'Anno calendario',
    'dashboard.pulse.filter.affiliateLabel': 'Affiliate',
    'dashboard.metric.netDeposits': 'Net deposits',
    'dashboard.metric.deposits': 'Deposits',
    'dashboard.metric.depositsCount': 'Numero di depositi',
    'dashboard.metric.withdrawals': 'Withdrawals',
    'dashboard.years.all': 'Tutti gli anni',
    'dashboard.affiliates.all': 'Tutti gli affiliate',
    'dashboard.cohortKpis.title': 'KPI Cohort',
    'dashboard.cohortKpis.infoAria': 'Info KPI cohort',
    'dashboard.cohortKpis.infoText':
      'Users = cohort size; Active users = users*(1-churn) cumulati; Marketing & Commissions mappati per mese di acquisizione; Cohort cost = marketing + commissions; CPA = cost/users; LTV = P&L/users; ROI = (P&L - cost)/cost; Net dep/Commission: se < 1.5 le commissioni sono posticipate all’affiliato; Break-even = primo mese con cum. P&L - cum. commissions >= 0.',

    'dashboard.table.metric': 'Metrica',
    'dashboard.table.total': 'Totale',
    'dashboard.table.breakEven': 'Break even',

    'dashboard.cohortDb.infoAria': 'Info Cohort DB',
    'dashboard.cohortDb.infoText':
      'Seleziona un cohort (mese di first deposit) e applicalo ai Net deposits del dashboard (dati da Net deposits Cohort 2025.csv). P&L segue la stessa logica per data di first deposit.',
    'dashboard.cohortDb.toggle.show': 'Mostra Cohort DB',
    'dashboard.cohortDb.toggle.hide': 'Nascondi Cohort DB',
    'dashboard.cohortDb.affiliates.toggle.show': 'Mostra dettaglio affiliati',
    'dashboard.cohortDb.affiliates.toggle.hide': 'Nascondi dettaglio affiliati',
    'dashboard.cohortDb.table.monthFd': 'Mese FD',
    'dashboard.cohortDb.table.cohortSize': 'Cohort size',
    'dashboard.cohortDb.table.month0': 'Mese 0',
    'dashboard.cohortDb.table.month1': 'Mese 1',
    'dashboard.cohortDb.table.month2': 'Mese 2',
    'dashboard.cohortDb.affiliates.title': 'Dettaglio affiliati (primi 15)',
    'dashboard.cohortDb.affiliates.table.affiliate': 'Affiliate',
    'dashboard.cohortDb.affiliates.table.month': 'Mese',
    'dashboard.cohortDb.affiliates.table.size': 'Size',

    'dashboard.breakEven.title': 'Analisi break-even',
    'dashboard.breakEven.infoAria': 'Info break-even',
    'dashboard.breakEven.infoText':
      'Formula: P&L cumulato (da "PL Cohort Analysis.csv") meno Commissions paid cumulato (negativo). Il break-even month è il primo indice in cui la curva diventa >= 0.',

    'dashboard.pnlTrend.title': 'Trend P&L',

    'dashboard.topAffiliates.title': 'Top affiliate',
    'dashboard.topAffiliates.none': 'Nessun affiliato disponibile per la selezione corrente.',
    'dashboard.topAffiliates.table.rank': '#',
    'dashboard.topAffiliates.table.affiliate': 'Affiliate',
    'dashboard.topAffiliates.table.registrationsShort': 'R',
    'dashboard.topAffiliates.table.registrationsTitle': 'Registrations',
    'dashboard.topAffiliates.table.registrationsPctShort': '%R',
    'dashboard.topAffiliates.table.registrationsPctTitle': '% Registrations',
    'dashboard.topAffiliates.table.plShort': 'P',
    'dashboard.topAffiliates.table.plTitle': 'P&L',
    'dashboard.topAffiliates.table.plPctShort': '%P',
    'dashboard.topAffiliates.table.plPctTitle': '% P&L',
    'dashboard.topAffiliates.table.roiSymbol': 'ROI',
    'dashboard.topAffiliates.table.roiTitle': 'ROI',

    'dashboard.autoReport.infoAria': 'Info auto report',
    'dashboard.autoReport.infoText':
      'Genera un breve riepilogo ora; in seguito potremo collegare OpenAI per commenti e next steps.',
    'dashboard.autoReport.generate': 'Genera report locale',
    'dashboard.autoReport.generating': 'Generazione…',
    'dashboard.autoReport.clear': 'Pulisci',
    'dashboard.autoReport.placeholder': 'Report pronto qui…',

    // Upload
    'upload.title': 'Carica report',
    'upload.description.line1':
      'Carica un CSV o XLSX e il sistema lo sanitizzerà e aggiornerà i report.',
    'upload.description.line2':
      'Scegli esplicitamente il tipo di report per non dipendere dal nome del file.',
    'upload.type.registrations': 'Registrations',
    'upload.type.payments': 'Payments',
    'upload.type.media': 'Media',
    'upload.type.comments': 'Comments',
    'upload.button.upload': 'Carica',
    'upload.button.uploading': 'Caricamento…',
    'upload.label.selected': 'Selezionato',
    'upload.progress.upload': 'Upload',
    'upload.progress.server': 'Server',
    'upload.response.title': 'Risposta',
    'upload.emptyDash': '—',

    'upload.status.uploadingShort': 'Caricamento…',
    'upload.status.uploadingPrefix': 'Caricamento',
    'upload.status.processingOnServer': 'Elaborazione sul server…',
    'upload.status.done': 'Fatto.',
    'upload.status.failed': 'Fallito',
    'upload.status.networkError': 'Upload fallito (errore di rete).',

    'upload.result.ok': 'OK',
    'upload.result.type': 'Tipo',
    'upload.result.updated': 'Aggiornato',
    'upload.result.rawBackup': 'Backup raw',
    'upload.result.sanitizer': 'Sanitizer',
    'upload.result.summary': 'Riepilogo',
    'upload.result.summary.existing': 'Esistenti',
    'upload.result.summary.added': 'Aggiunte',
    'upload.result.summary.duplicates': 'Duplicate',
    'upload.result.summary.affiliateUpdates': 'Aggiornamenti affiliati',
    'upload.result.summary.fieldUpdates': 'Aggiornamenti campi',
    'upload.result.lastLogs': 'Ultimi log',
    'upload.result.warningsErrors': 'Warning/Errori',

    // Support
    'support.loader.tools': 'Caricamento strumenti support…',
    'support.loader.results': 'Caricamento risultati…',
    'support.search.placeholder': 'Cerca per nome, user id o MT5',
    'support.search.ariaLabel': 'Cerca utenti',

    'support.userCheck.title': 'Supporto — Verifica utente',
    'support.userCheck.subtitle': 'Identificazione rapida e gestione operativa di un utente.',
    'support.userCheck.hint.instant': 'Risultati immediati durante la digitazione',
    'support.userCheck.hint.press': 'Premi',
    'support.userCheck.hint.toFocus': 'per mettere a fuoco',
    'support.userCheck.hint.toRun': 'per eseguire',
    'support.userCheck.badge.top': 'Top',
    'support.userCheck.deposits': '{count} depositi',
    'support.userCheck.noResults': 'Nessun risultato',
    'support.userCheck.openInPartner': 'Apri in Partner',

    'support.reply.fallback': 'Grazie {name} — stiamo verificando e ti aggiorneremo a breve.',

    'support.details.affiliateMoves.title': 'Spostamenti affiliato',
    'support.details.affiliateMoves.loading': 'Caricamento…',
    'support.details.affiliateMoves.none': 'Nessuno spostamento affiliato rilevato.',
    'support.details.affiliateMoves.more': '+{count} altri',
    'support.reply.customerFallback': 'Grazie — stiamo verificando e ti aggiorneremo a breve.',
    'support.reply.caseType.DATA_INCOMPLETE':
      'Grazie — stiamo verificando i dettagli del tuo account e ti aggiorneremo a breve.',
    'support.reply.caseType.WITHDRAWAL_REQUEST':
      'Grazie — la tua richiesta di prelievo è in revisione. Confermeremo appena i controlli saranno completati.',
    'support.reply.caseType.POTENTIAL_ABUSE':
      'Grazie — serve una verifica aggiuntiva prima di procedere. Il nostro team ti contatterà se necessario.',
    'support.reply.caseType.HIGH_VALUE_USER':
      'Grazie — daremo priorità alla tua richiesta e confermeremo i prossimi passi a breve.',
    'support.reply.caseType.NO_DEPOSIT':
      'Grazie — il tuo account è attivo. Se ti serve aiuto per depositare, possiamo guidarti.',
    'support.reply.caseType.ACTIVE_USER':
      'Grazie — stiamo esaminando la tua richiesta e ti aggiorneremo a breve.',
    'support.reply.caseType.UNKNOWN': 'Grazie — stiamo verificando e ti aggiorneremo a breve.',

    'support.decision.status.ELIGIBLE': 'Idoneo',
    'support.decision.status.NOT_ELIGIBLE': 'Non idoneo',
    'support.decision.status.NEEDS_CONTEXT': 'Serve contesto',
    'support.decision.status.NEEDS_MANUAL_REVIEW': 'Serve revisione manuale',
    'support.decision.status.APPROVED_WITH_CONDITIONS': 'Approvato con condizioni',
    'support.decision.status.NEEDS_VERIFICATION': 'Serve verifica',
    'support.decision.status.HIGH_RISK': 'Alto rischio',
    'support.decision.status.NEEDS_PSP_CHECK': 'Serve controllo PSP',
    'support.decision.status.STANDARD_PROCESS': 'Processo standard',
    'support.decision.status.CRITICAL_RISK': 'Rischio critico',
    'support.decision.status.NEUTRAL': 'Neutro',
    'support.decision.status.PROFITABLE': 'Profittevole',

    'support.decision.affiliateSwitch.noAffiliate.why':
      'Nessun affiliato assegnato a questo account.',
    'support.decision.affiliateSwitch.noAffiliate.action.verifyCrm':
      'Verifica l’attribuzione dell’affiliato in CRM.',
    'support.decision.affiliateSwitch.noAffiliate.action.openNewAccount':
      'Se l’utente vuole un nuovo affiliato, apri un NUOVO account tramite link affiliato.',

    'support.decision.affiliateSwitch.hasCommissions.why':
      'L’account ha già generato commissioni affiliate. Il cambio creerebbe problemi di costo/attribuzione.',
    'support.decision.affiliateSwitch.hasCommissions.action.doNotSwitch':
      'NON cambiare l’account esistente.',
    'support.decision.affiliateSwitch.hasCommissions.action.openNewAccount':
      'Se l’utente insiste, proponi un NUOVO account sotto il link affiliato richiesto (può applicarsi un deposito minimo).',
    'support.decision.affiliateSwitch.hasCommissions.action.escalate':
      'Se necessario, escalation a Emanuele per approvazione finale.',

    'support.decision.affiliateSwitch.noCommissions.why':
      'Nessuna commissione affiliata generata sull’account corrente. Il cambio non ha costo di attribuzione.',
    'support.decision.affiliateSwitch.noCommissions.action.proceedSwitch':
      'Procedi con lo switch (CRM + Skale).',
    'support.decision.affiliateSwitch.noCommissions.action.confirmUpdated':
      'Conferma che l’affiliato sia aggiornato in modo coerente in entrambi i sistemi.',

    'support.decision.accountTypeChange.highWithdrawalRatio.why':
      'Un alto rapporto prelievi/depositi suggerisce possibile abuso; serve revisione manuale prima del cambio tipo account.',
    'support.decision.accountTypeChange.highWithdrawalRatio.action.escalateRisk':
      'Escalation al team risk per revisione manuale.',
    'support.decision.accountTypeChange.highWithdrawalRatio.action.holdChange':
      'Blocca il cambio tipo account finché non c’è clearance.',

    'support.decision.accountTypeChange.approvedWithConditions.why':
      'Cambio tipo account consentito con controlli operativi.',
    'support.decision.accountTypeChange.approvedWithConditions.action.requireKycPsp':
      'Richiedi controllo KYC/PSP prima di cambiare tipo',
    'support.decision.accountTypeChange.approvedWithConditions.action.allowWithChecks':
      'Consenti il cambio tipo account con condizioni: verifica KYC e stato PSP.',

    'support.decision.bonus.hasCommissionsAndDeposits.why':
      'L’account ha commissioni affiliate e depositi — l’assegnazione bonus richiede verifica per evitare doppio costo.',
    'support.decision.bonus.hasCommissionsAndDeposits.action.verifyOwnership':
      'Verifica ownership delle commissioni e accordo marketing prima di concedere il bonus.',
    'support.decision.bonus.hasCommissionsAndDeposits.action.recordCrm':
      'Se approvato, registra il motivo in CRM.',

    'support.decision.bonus.noDeposits.why':
      'Nessun deposito sull’account — il bonus richiede attività di deposito.',
    'support.decision.bonus.noDeposits.action.informFunding':
      'Informa l’utente sulle opzioni di deposito e sui requisiti di deposito minimo.',

    'support.decision.bonus.highValue.why': 'Utente high-value idoneo al bonus, soggetto a KYC.',
    'support.decision.bonus.highValue.action.proceedKyc':
      'Procedi con l’offerta bonus e avvia KYC se non presente.',

    'support.decision.bonus.standard.why': 'Utente idoneo alle promozioni standard.',
    'support.decision.bonus.standard.action.offerStandard':
      'Offri bonus standard secondo il catalogo promozioni.',

    'support.decision.withdrawals.highRisk.why': 'Alto rapporto prelievi rispetto ai depositi.',
    'support.decision.withdrawals.highRisk.action.holdInvestigate': 'Metti in hold e indaga.',
    'support.decision.withdrawals.highRisk.action.checkPspKyc':
      'Controlla PSP/KYC, attività di trading e metodi di pagamento.',

    'support.decision.withdrawals.needsPspCheck.why':
      'Prelievi rilevati — verifica PSP e KYC prima di processare.',
    'support.decision.withdrawals.needsPspCheck.action.verifyPsp': 'Verifica stato PSP.',
    'support.decision.withdrawals.needsPspCheck.action.confirmKyc': 'Conferma KYC.',
    'support.decision.withdrawals.needsPspCheck.action.processSla': 'Processa secondo SLA.',

    'support.decision.withdrawals.standardProcess.why':
      'Nessun prelievo; segui il processo standard.',
    'support.decision.withdrawals.standardProcess.action.noAction': 'Nessuna azione richiesta.',

    'support.decision.revenueShare.criticalRisk.why':
      'P/L negativo molto elevato rispetto ai depositi: possibile rischio retention/abuso.',
    'support.decision.revenueShare.criticalRisk.action.reviewRetention':
      'Rivedi strategia di retention e indicatori frode.',
    'support.decision.revenueShare.criticalRisk.action.considerLimits':
      'Valuta gestione speciale o limiti.',

    'support.decision.revenueShare.profitAndWithdrawals.why':
      'L’utente è in profitto e ha prelievi — monitorare churn/cashout.',
    'support.decision.revenueShare.profitAndWithdrawals.action.monitor':
      'Monitora comportamento di cashout.',
    'support.decision.revenueShare.profitAndWithdrawals.action.ensureCompliance':
      'Assicurati reporting fiscale/compliance se necessario.',

    'support.decision.revenueShare.noDeposits.why': 'Nessun deposito — impatto revenue neutro.',
    'support.decision.revenueShare.noDeposits.action.noAction': 'Nessuna azione revenue richiesta.',

    'support.decision.revenueShare.netLoss.why':
      'Utente net-loss (P/L negativo) potenzialmente positivo per revshare a seconda del contratto.',
    'support.decision.revenueShare.netLoss.action.reviewContract':
      'Rivedi termini contrattuali e opzioni di retention.',

    'support.decision.revenueShare.noIndicators.why': 'Nessun indicatore revenue significativo.',
    'support.decision.revenueShare.noIndicators.action.noAction': 'Nessuna azione richiesta.',

    'support.decision.signal.commissionsGt0': 'Commissioni > 0',
    'support.decision.signal.commissionsEq0': 'Commissioni = 0',
    'support.decision.signal.highWithdrawalRatio': 'Alto rapporto prelievi',
    'support.decision.signal.withdrawalsGt0': 'Prelievi > 0',
    'support.decision.signal.highValueUser': 'Utente high value',
    'support.decision.signal.depositsEq': 'Depositi = {value}',
    'support.decision.signal.pl': 'P/L',
    'support.decision.signal.plEq': 'PL={value}',
    'support.decision.signal.depositsEqNoSpace': 'Depositi={value}',
    'support.decision.signal.plPositive': 'P/L positivo',
    'support.decision.signal.plNegative': 'P/L negativo',
    'support.decision.signal.withdrawalsDetected': 'Prelievi rilevati',

    // Roadmap
    'roadmap.header.title': 'Board Mega-Stories',
    'roadmap.header.subtitle': 'Mega-storie strategiche con drill-down di esecuzione.',
    'roadmap.subView.megaStories': 'Mega Stories',
    'roadmap.subView.weeklyMap': 'Mappa settimanale',
    'roadmap.subView.weeklyMapFiltered': 'Mappa settimanale (filtrata)',

    'roadmap.viewMode.active': 'Attive',
    'roadmap.viewMode.done': 'Completate',

    'roadmap.counter.active': '{count} attive',
    'roadmap.counter.blocked': '{count} bloccate',
    'roadmap.counter.done': '{count} completate',

    'roadmap.reset.button': 'Ripristina seed',
    'roadmap.reset.confirm':
      'Questo sovrascriverà le modifiche locali e ripristinerà i dati seed. Continuare?',

    'roadmap.filters.all': 'Tutte',
    'roadmap.filters.megaStory': 'Mega-storia',
    'roadmap.filters.story': 'Storia',
    'roadmap.filters.department': 'Dipartimento',
    'roadmap.filters.platformArea': 'Area piattaforma',
    'roadmap.filters.status': 'Stato',

    'roadmap.status.active': 'Attiva',
    'roadmap.status.blocked': 'Bloccata',
    'roadmap.status.done': 'Completata',

    'roadmap.priority.high': 'Alta',
    'roadmap.priority.medium': 'Media',
    'roadmap.priority.low': 'Bassa',

    'roadmap.department.infrastructure': 'Infrastruttura',
    'roadmap.department.product': 'Prodotto',
    'roadmap.department.data': 'Dati',
    'roadmap.department.compliance': 'Compliance',
    'roadmap.department.ux': 'UX',
    'roadmap.department.partners': 'Partner',

    'roadmap.platformArea.trading': 'Trading',
    'roadmap.platformArea.analytics': 'Analytics',
    'roadmap.platformArea.payments': 'Pagamenti',
    'roadmap.platformArea.infra': 'Infra',
    'roadmap.platformArea.profile': 'Profilo',
    'roadmap.platformArea.internal': 'Interno',

    'roadmap.impactType.revenue': 'Ricavi',
    'roadmap.impactType.retention': 'Retention',
    'roadmap.impactType.risk_reduction': 'Riduzione rischio',
    'roadmap.impactType.efficiency': 'Efficienza',
    'roadmap.impactType.impact': 'Impatto',

    'roadmap.mega.tag': 'Mega-storia',
    'roadmap.mega.totalTasks': '{count} task',
    'roadmap.mega.progress.donePct': '{done} completate ({pct}%)',
    'roadmap.mega.progress.inFlight': '{count} in corso',
    'roadmap.mega.departments': 'Dipartimenti',
    'roadmap.mega.platform': 'Piattaforma',
    'roadmap.mega.lastImpact': 'Ultimo impatto',
    'roadmap.mega.lastImpactValue': '{impactType} - {department} - {area}',
    'roadmap.mega.impact.unknownDepartment': 'dip.',
    'roadmap.mega.impact.unknownArea': 'area',
    'roadmap.mega.noImpactYet': 'Nessun impatto ancora registrato',
    'roadmap.mega.focusLabel': 'Mega-storia',

    'roadmap.feed.items': '{count} elementi',

    'roadmap.story.areaTbd': 'Area da definire',
    'roadmap.story.deptTbd': 'Dip. da definire',
    'roadmap.story.tasksCount': '{count} task',

    'roadmap.task.createdAt': 'Creata {date}',
    'roadmap.task.completedAt': 'Completata {date}',
    'roadmap.task.nextStep': 'Prossimo passo',
    'roadmap.task.blocker': 'Blocco',
    'roadmap.task.impact': 'Impatto',

    'roadmap.empty.noTasksForStory': 'Nessun task per questa storia con i filtri correnti.',
    'roadmap.empty.noStoriesForMega': 'Nessuna storia mappata a questa mega-storia.',
    'roadmap.empty.selectMega': 'Seleziona una mega-storia per approfondire.',

    'roadmap.details.title': 'Dettagli',
    'roadmap.details.panelTitle': 'Pannello dettagli',
    'roadmap.details.selectTask': 'Seleziona un task per vedere i dettagli.',
    'roadmap.details.storyFocus': 'Focus storia: {story}',
    'roadmap.details.objective': 'Obiettivo',
    'roadmap.details.dependencies': 'Dipendenze / blocchi',
    'roadmap.details.created': 'Creata',

    'roadmap.impact.capturedOnDone': 'Registrato quando marcato completato.',
    'roadmap.impact.kpi': 'KPI: {kpi}',
    'roadmap.impact.note': 'Nota: {note}',
    'roadmap.impact.completedOn': 'Completato il {date}',

    'roadmap.markDone.button': 'Segna come completato',
    'roadmap.markDone.title': 'Segna come completato',
    'roadmap.markDone.impactType': 'Tipo di impatto',
    'roadmap.markDone.selectImpactType': 'Seleziona tipo di impatto',
    'roadmap.markDone.impactedDepartment': 'Dipartimento impattato',
    'roadmap.markDone.selectDepartment': 'Seleziona dipartimento',
    'roadmap.markDone.impactedPlatformArea': 'Area piattaforma impattata',
    'roadmap.markDone.selectArea': 'Seleziona area',
    'roadmap.markDone.impactedKpi': 'KPI impattato',
    'roadmap.markDone.kpiPlaceholder': 'Esempio: conformità SLA pagamenti',
    'roadmap.markDone.impactNoteOptional': 'Nota impatto (opzionale)',
    'roadmap.markDone.saveAndClose': 'Salva impatto e chiudi',

    'roadmap.common.close': 'Chiudi',
    'roadmap.common.cancel': 'Annulla',

    'roadmap.triage.needsTriage': 'Da sistemare',
    'roadmap.triage.mappingFixesRequired': 'Correzioni mapping richieste',
    'roadmap.triage.reason': 'Motivo',
    'roadmap.triage.noTasks': 'Nessun task da sistemare.',
    'roadmap.triage.selectMegaStory': 'Seleziona mega-storia',
    'roadmap.triage.selectStory': 'Seleziona storia',
    'roadmap.triage.saveMapping': 'Salva mapping',
    'roadmap.triage.noMega': 'nessuna mega',
    'roadmap.triage.noStory': 'nessuna storia',

    'roadmap.validation.unknownMegaStoryId': 'megaStoryId sconosciuto',
    'roadmap.validation.unknownStoryId': 'storyId sconosciuto',
    'roadmap.validation.storyNotUnderMega': 'storyId non sotto megaStoryId',

    // Support • User Details
    'support.details.loader.userDetails': 'Caricamento dettagli utente…',
    'support.details.loader.decisionEngine': 'Caricamento decision engine…',
    'support.details.backToResults': 'Torna ai risultati',
    'support.details.focusCenter.enter': 'Focus',
    'support.details.focusCenter.exit': 'Esci focus',
    'support.details.focusCenter.hint': 'Modalità focus (F) — nasconde i pannelli laterali',
    'support.details.partnerProfile.label': 'Customer profile',
    'support.details.partnerProfile.hint': 'Apri profilo cliente partner ({customerId})',
    'support.details.statusHelp.aria': 'Stato: {status}. Tocca per la spiegazione.',
    'support.details.statusHelp.default': 'Valore di stato proveniente dal report sorgente.',
    'support.details.statusHelp.duplicate':
      'Duplicate: la riga appare più di una volta nei dati sorgente (stesso utente/account).',
    'support.details.statusHelp.new':
      'New: account segnalato come nuovo / registrato di recente nel report.',
    'support.details.statusHelp.active': 'Active: account segnalato come attivo nel report.',
    'support.details.statusHelp.blocked':
      'Blocked: account segnalato come bloccato/disabilitato nel report.',
    'support.details.priority.high': 'Alta',
    'support.details.priority.medium': 'Media',
    'support.details.priority.normal': 'Normale',
    'support.details.priority.unknown': 'Sconosciuta',
    'support.details.statusFallback': 'Stato',
    'support.details.account': 'Account',
    'support.details.affiliate': 'Affiliate',
    'support.details.noAffiliate': 'Nessun affiliato',
    'support.details.affiliateNameMissing': 'Nome mancante',
    'support.details.affiliateNameMismatch': 'Non corrisponde',
    'support.details.commissions.title': 'Commissioni',
    'support.details.commissions.revshare': 'Revshare',
    'support.details.commissions.cpa': 'CPA',
    'support.details.commissions.cpl': 'CPL',
    'support.details.commissions.affiliate': 'Affiliate',
    'support.details.commissions.subAffiliate': 'Sub-affiliate',
    'support.details.commissions.other': 'Altro',
    'support.details.userTimeline.title': 'Timeline utente e stato',
    'support.details.userTimeline.registration': 'Registrazione',
    'support.details.userTimeline.depositDate': 'Data deposito',
    'support.details.userTimeline.qualification': 'Qualificazione',
    'support.details.userTimeline.notReached': 'Non raggiunto',
    'support.details.userTimeline.daysDelta': '+{days}g',
    'support.details.financialSummary.title': 'Riepilogo finanziario',
    'support.details.financialSummary.totalDeposits': 'Depositi totali',
    'support.details.financialSummary.netDeposits': 'Depositi netti',
    'support.details.financialSummary.netCashFlow': 'Flusso di cassa netto',
    'support.details.financialSummary.withdrawals': 'Prelievi',
    'support.details.financialSummary.withdrawalRatio': 'Rapporto prelievi',
    'support.details.financialSummary.depositsCount': '# Depositi',
    'support.details.financialSummary.firstDeposit': 'Primo deposito',
    'support.details.tradingPerformance.title': 'Performance di trading',
    'support.details.tradingPerformance.volume': 'Volume',
    'support.details.tradingPerformance.lots': 'Lotti',
    'support.details.tradingPerformance.spread': 'Spread',
    'support.details.tradingPerformance.positionCount': 'Numero posizioni',
    'support.details.tradingPerformance.pl': 'P/L',
    'support.details.tradingPerformance.roi': 'ROI',

    'support.activity.title': 'Activity Intelligence',
    'support.activity.metrics.ageDays': 'Età (giorni)',
    'support.activity.metrics.positions': 'Posizioni',
    'support.activity.metrics.positionsPerDay': 'Posizioni/giorno',
    'support.activity.metrics.withdrawals': 'Prelievi',
    'support.activity.metrics.withdrawalRatio': 'Rapporto prelievi',
    'support.activity.metrics.tier': 'Tier',
    'support.activity.metrics.botFlag': 'Possibile Bot (EA)',
    'support.activity.botFlag.yes': 'SÌ',
    'support.activity.botFlag.no': 'NO',
    'support.activity.tier.inactive': 'Inattivo',
    'support.activity.tier.low': 'Basso',
    'support.activity.tier.active': 'Attivo',
    'support.activity.tier.high': 'Alto',
    'support.activity.tier.hyper': 'Iper',
    'support.activity.tooltip.positionsPerDay':
      'Soglie tier (posizioni/giorno): Inattivo=0, Basso<1, Attivo 1–5, Alto 5–20, Iper≥20. Alert bot: Età≤7 e (Posizioni≥200 o Posizioni/giorno≥30).',
    'support.activity.tooltip.withdrawalRatio':
      'Soglie rapporto prelievi: Warn ≥70%, High ≥90%, Critical ≥105% (prelievi > depositi). Usare con contesto (età account, attività, chargeback).',
    'support.activity.signals.none': 'Nessun alert di attività rilevante.',
    'support.activity.signal.earlyHyper.title': 'Iper-attività precoce',
    'support.activity.signal.earlyHyper.body':
      'Frequenza di trading molto alta a inizio ciclo (età={ageDays}gg, posizioni={positions}, {ppd}/giorno). Possibile EA/bot o comportamento ad alto rischio.',
    'support.activity.signal.fundedNoTrading.title': 'Depositato ma non tradante',
    'support.activity.signal.fundedNoTrading.body':
      'Depositi presenti ma Position Count è zero. Rischio churn / serve attivazione.',
    'support.activity.signal.activeHeavyLosses.title': 'Molto attivo con perdite elevate',
    'support.activity.signal.activeHeavyLosses.body':
      'Attività alta con performance negativa importante (ROI {roi}). Rischio retention / serve gestione rischio.',
    'support.activity.signal.withdrawalHeavyLowTrading.title': 'Prelievi alti e poco trading',
    'support.activity.signal.withdrawalHeavyLowTrading.body':
      'Prelievi alti rispetto ai depositi ({ratio}) con attività bassa. Possibile abuso; verificare PSP/KYC.',
    'support.activity.signal.withdrawalsWithoutDeposits.title': 'Prelievi senza depositi',
    'support.activity.signal.withdrawalsWithoutDeposits.body':
      'Rilevati prelievi ({withdrawals}) ma i depositi totali sono zero. Possibile incoerenza dati o abuso; verificare PSP/KYC e sorgente.',
    'support.activity.signal.withdrawalsExceedDeposits.title': 'Prelievi superiori ai depositi',
    'support.activity.signal.withdrawalsExceedDeposits.body':
      'Il rapporto prelievi è {ratio} (prelievi maggiori dei depositi). Pattern ad alto rischio; investigare subito.',
    'support.activity.signal.highCashoutActive.title': 'Cash-out alto con attività',
    'support.activity.signal.highCashoutActive.body':
      'Rapporto prelievi {ratio} entro {ageDays} giorni con trading attivo. Potrebbe essere profitto rapido o bonus abuse; verificare il contesto.',
    'support.activity.signal.mismatchPositionsNoVolume.title': 'Incoerenza dati',
    'support.activity.signal.mismatchPositionsNoVolume.body':
      'Position Count > 0 ma Volume/LOTS sono zero. Possibile incoerenza report/mapping.',

    'support.userCheck.botList.title': 'Possibile Bot / EA aggressivo — top 50',
    'support.userCheck.botList.subtitle': 'Lista rapida ordinata per intensità vs età account.',
    'support.userCheck.botList.ppdChip': 'P/g',
    'support.userCheck.botList.shortcuts': 'Scorciatoie: / focus · Invio apri',
    'support.userCheck.botList.share.label': 'Condividi',
    'support.userCheck.botList.share.copied': 'Link copiato',
    'support.userCheck.botList.share.hint':
      'Crea un link pubblico che apre solo questa tabella (senza dashboard).',
    'support.userCheck.botList.positionCountBadge.tooltip':
      'Anti-regressione: il report deve includere Position Count',
    'support.userCheck.botList.positionCountBadge.checking': 'Position Count: verifica…',
    'support.userCheck.botList.positionCountBadge.ok': 'Position Count: OK',
    'support.userCheck.botList.positionCountBadge.missing': 'Position Count: mancante',
    'support.userCheck.botList.loading': 'Calcolo candidati…',
    'support.userCheck.botList.empty': 'Nessun forte candidato bot nel report corrente.',
    'support.userCheck.botList.missingPositionCount.title': 'Position Count mancante nel report',
    'support.userCheck.botList.missingPositionCount.body':
      'Questo Registrations Report non include un Position Count affidabile (numero posizioni). Esporta/carica un report che lo contenga per abilitare la lista intensità bot/EA.',
    'support.userCheck.botList.openHint': 'Apri dettagli trader',
    'support.userCheck.botList.riskScore': 'Risk score',
    'support.userCheck.botList.badge.bot': 'Bot',
    'support.userCheck.botList.badge.fill': 'Rank',
    'support.userCheck.botList.badge.botHint': 'Segnalato come potenziale bot (regole + punteggio)',
    'support.userCheck.botList.badge.fillHint':
      'Non segnalato come bot: incluso per punteggio alto',
    'support.details.affiliateOverview.title': 'Panoramica affiliato',
    'support.details.affiliateOverview.loading': 'Caricamento dati affiliato…',
    'support.details.affiliateOverview.compareLabel': 'Confronta con Affiliate ID:',
    'support.details.affiliateOverview.enterPlaceholder': 'Inserisci affiliate ID...',
    'support.details.affiliateOverview.currentPrefix': 'Attuale',
    'support.details.affiliateOverview.targetPrefix': 'Target',
    'support.details.affiliateOverview.noData': 'Nessun dato affiliato disponibile',
    'support.details.affiliateOverview.metrics.traffic': 'Traffico',
    'support.details.affiliateOverview.metrics.registrations': 'Registrazioni',
    'support.details.affiliateOverview.metrics.ftd': 'FTD',
    'support.details.affiliateOverview.metrics.revenue': 'Ricavi',
    'support.details.affiliateOverview.metrics.ecpa': 'eCPA',
    'support.details.affiliateOverview.metrics.roi': 'ROI',
    'support.details.supportDecisions.title': 'Support Decisions Engine',
    'support.details.supportDecisions.affiliateSwitch': 'Idoneità cambio affiliato',
    'support.details.supportDecisions.accountTypeChange': 'Cambio tipo account',
    'support.details.supportDecisions.bonus': 'Idoneità bonus/credito',
    'support.details.supportDecisions.withdrawals': 'Gestione prelievi/rimborsi',
    'support.details.supportDecisions.revenueShare': 'Analisi revenue share',
    'support.details.decision.why': 'Perché',
    'support.details.decision.nextActions': 'Azioni consigliate',
    'support.details.decision.signals': 'Segnali decisionali',
    'support.details.suggestedReply.title': 'Risposta suggerita',
    'support.details.suggestedReply.placeholder': 'Template risposta support...',
    'support.details.copyToClipboard': 'Copia negli appunti',
    'support.details.confirmEscalate': 'Escalare {accountId} a {kind}?',

    // Org Chart
    'orgChart.structure': 'Struttura',
    'orgChart.title': 'Organigramma aziendale',
    'orgChart.description':
      'Gerarchia, layer di responsabilità e roster dei reparti con job title, divisione, dipartimento, regione ed email per persona.',
    'orgChart.search.placeholder': 'Cerca per nome e premi Invio',
    'orgChart.search.submit': 'Vai al reparto',
    'orgChart.toc.ariaLabel': 'Indice dei contenuti',
    'orgChart.toc.all': 'Tutti',
    'orgChart.toc.management': 'Management',
    'orgChart.toc.areaLayer': 'Area Layer',
    'orgChart.toc.support': 'Support',
    'orgChart.toc.operations': 'Operations',
    'orgChart.toc.affiliation': 'Affiliation',
    'orgChart.toc.businessDev': 'Business Dev',
    'orgChart.toc.marketing': 'Marketing',
    'orgChart.toc.finance': 'Finance',
    'orgChart.toc.payments': 'Payments',
    'orgChart.toc.compliance': 'Compliance',
    'orgChart.toc.dealing': 'Dealing Desk',
    'orgChart.hierarchy.ariaLabel': 'Gerarchia',
    'orgChart.hierarchy.title': 'Gerarchia',
    'orgChart.hierarchy.subtitle': 'CEO / Leadership a cascata verso i team operativi.',
    'orgChart.role.division': 'Divisione',
    'orgChart.role.dept': 'Reparto',
    'orgChart.role.region': 'Regione',
    'orgChart.role.email': 'Email',
    'orgChart.hierarchyItem.ceo': 'CEO / Leadership',
    'orgChart.hierarchyItem.management': 'Management Team',
    'orgChart.hierarchyItem.areaLayer': 'Area Responsibility Layer',
    'orgChart.hierarchyItem.support': 'Support Team',
    'orgChart.hierarchyItem.operations': 'Operations',
    'orgChart.hierarchyItem.dealing': 'Dealing / PSP',
    'orgChart.hierarchyItem.affiliation': 'Affiliation',
    'orgChart.hierarchyItem.businessDev': 'Business Development',
    'orgChart.hierarchyItem.marketing': 'Marketing',
    'orgChart.hierarchyItem.financePayments': 'Finance & Payments',
    'orgChart.hierarchyItem.compliance': 'Compliance',
    'orgChart.sectionTitle.management-team': 'Management Team',
    'orgChart.sectionTitle.area-responsibility': 'Area Responsibility Layer',
    'orgChart.sectionTitle.support-team': 'Support Team',
    'orgChart.sectionTitle.operations': 'Operations',
    'orgChart.sectionTitle.dealing': 'Dealing Desk / PSP / Risk',
    'orgChart.sectionTitle.affiliation': 'Affiliation / Partner Management',
    'orgChart.sectionTitle.business-development': 'Business Development / Sales',
    'orgChart.sectionTitle.marketing': 'Marketing',
    'orgChart.sectionTitle.finance': 'Finance',
    'orgChart.sectionTitle.payments': 'Payments / PSP',
    'orgChart.sectionTitle.compliance': 'Compliance',
  },

  sr: {
    // Serbian (Belgrade) - Latin
    'app.tools': 'Alati',
    'app.admin': 'Admin',
    'app.logout': 'Odjava',
    'app.version': 'v1.0.0',
    'app.uploadLeaveConfirm': 'Otpremanje je u toku. Napustiti ovu stranicu?',

    'dataStatus.updated': 'Podaci su ažurni',
    'dataStatus.outdated': 'Podaci mogu biti zastareli',
    'dataStatus.noData': 'Nema dostupnih podataka',
    'dataStatus.unknown': 'Nepoznat status',

    'sidebar.dashboard': 'Kontrolna tabla',
    'sidebar.ops': 'Operacije',
    'sidebar.overview': 'Pregled',
    'sidebar.executiveSuite': 'Executive Suite',
    'sidebar.executive.summary': 'Sažetak',
    'sidebar.executive.view': 'Prikaz',
    'sidebar.marketingPlan': 'Marketing Execution',
    'sidebar.affiliate': 'Affiliate',
    'sidebar.affiliate.analysis': 'Analiza',
    'sidebar.affiliate.payments': 'Uplate',
    'sidebar.affiliate.payments2': 'Uplate 2.0',
    'sidebar.affiliate.cohort': 'Kohorta',
    'sidebar.analysis': 'Analiza Izveštaja',
    'sidebar.fraud': 'Nadzor prevara',
    'sidebar.traderPoints': 'Trader Points',

    // Share — Affiliate Analysis (board report)
    'shareAffiliateAnalysis.header.eyebrow': 'Board izveštaj',
    'shareAffiliateAnalysis.header.title': 'Učinak Afiliata — Board prikaz',
    'shareAffiliateAnalysis.header.subtitle':
      'Izaberite afiliata da otvorite završni izveštaj učinka.',
    'shareAffiliateAnalysis.period.monthly': 'Mesečno',
    'shareAffiliateAnalysis.period.quarterly': 'Kvartalno',
    'shareAffiliateAnalysis.period.semiAnnual': 'Polugodišnje',
    'shareAffiliateAnalysis.period.annual': 'Godišnje',
    'shareAffiliateAnalysis.entry.selectedPeriod': 'Period: {period}',
    'shareAffiliateAnalysis.entry.noPeriod': 'Period: —',
    'shareAffiliateAnalysis.card.reference': 'Referentni period',
    'shareAffiliateAnalysis.card.profit': 'Profit',
    'shareAffiliateAnalysis.card.netDeposits': 'Net depoziti',
    'shareAffiliateAnalysis.card.roi': 'ROI',
    'shareAffiliateAnalysis.footer.note':
      'Read-only link. Vrednosti odražavaju poslednje učitane izveštaje.',
    'shareAffiliateAnalysis.back': '← Nazad na afiliate',
    'shareAffiliateAnalysis.status.performing': 'Dobar učinak',
    'shareAffiliateAnalysis.status.stable': 'Stabilno',
    'shareAffiliateAnalysis.status.underperforming': 'Slab učinak',
    'shareAffiliateAnalysis.accessDenied.title': 'Pristup odbijen',
    'shareAffiliateAnalysis.accessDenied.subtitle': 'Ovaj link nije validan ili je istekao.',
    'shareAffiliateAnalysis.error.title': 'Ne mogu da učitam podatke',
    'shareAffiliateAnalysis.report.eyebrow': 'Završni izveštaj',
    'shareAffiliateAnalysis.report.title': 'Izveštaj učinka afiliata — {affiliate}',
    'shareAffiliateAnalysis.report.subtitle': 'Sažetak za board. Read-only.',
    'shareAffiliateAnalysis.report.executiveSnapshot': 'Executive snapshot',
    'shareAffiliateAnalysis.report.performanceOverview': 'Pregled učinka',
    'shareAffiliateAnalysis.report.trendReading': 'Trend i tumačenje',
    'shareAffiliateAnalysis.report.periodComparison': 'Poređenje perioda',
    'shareAffiliateAnalysis.report.boardInterpretation': 'Tumačenje za board',
    'shareAffiliateAnalysis.report.decisionLayer': 'Sloj odluke',
    'shareAffiliateAnalysis.report.periodLabel': 'Svi dostupni podaci',
    'shareAffiliateAnalysis.report.disclaimer':
      'Ovaj izveštaj koristi istu analizu kao interna konzola, u board formatu.',
    'shareAffiliateAnalysis.metric.referencePeriod': 'Referentni period',
    'shareAffiliateAnalysis.metric.periodType': 'Tip perioda',
    'shareAffiliateAnalysis.metric.status': 'Status',
    'shareAffiliateAnalysis.metric.profit': 'Profit',
    'shareAffiliateAnalysis.metric.roi': 'ROI',
    'shareAffiliateAnalysis.metric.registrations': 'Registracije',
    'shareAffiliateAnalysis.metric.ftd': 'FTD',
    'shareAffiliateAnalysis.metric.qftd': 'Kvalifikovani FTD',
    'shareAffiliateAnalysis.metric.netDeposits': 'Net depoziti',
    'shareAffiliateAnalysis.metric.pl': 'P&L',
    'shareAffiliateAnalysis.metric.payments': 'Isplate',
    'shareAffiliateAnalysis.trend.notEnoughData': 'Nema dovoljno istorije za mesečno poređenje.',
    'shareAffiliateAnalysis.trend.profit': 'Profit',
    'shareAffiliateAnalysis.trend.netDeposits': 'Net depoziti',
    'shareAffiliateAnalysis.trend.ftd': 'FTD',
    'shareAffiliateAnalysis.comparison.profit': 'Profit',
    'shareAffiliateAnalysis.comparison.netDeposits': 'Net depoziti',
    'shareAffiliateAnalysis.comparison.ftd': 'FTD',
    'shareAffiliateAnalysis.comparison.up': 'Gore',
    'shareAffiliateAnalysis.comparison.down': 'Dole',
    'shareAffiliateAnalysis.comparison.flat': 'Stabilno',
    'shareAffiliateAnalysis.comparison.vsLabel': 'U poređenju sa: {prev}',
    'shareAffiliateAnalysis.interpretation.positive':
      'Ukupan učinak je dobar: doprinos je pozitivan i depoziti postoje.',
    'shareAffiliateAnalysis.interpretation.negative':
      'Potrebna pažnja: doprinos je negativan u izabranom periodu.',
    'shareAffiliateAnalysis.interpretation.neutral':
      'Učinak je stabilan: pratiti kontinuitet rezultata kroz vreme.',
    'shareAffiliateAnalysis.interpretation.profitUp':
      'U odnosu na prethodni period, profitabilnost je bolja.',
    'shareAffiliateAnalysis.interpretation.profitDown':
      'U odnosu na prethodni period, profitabilnost je slabija.',
    'shareAffiliateAnalysis.interpretation.profitFlat':
      'U odnosu na prethodni period, profitabilnost je približno ista.',
    'shareAffiliateAnalysis.decision.whatThisMeans': 'Šta to znači: {status} za {ref}.',
    'shareAffiliateAnalysis.decision.option.scale':
      'Selektivno skalirati: povećati obim uz zadržavanje efikasnosti isplata.',
    'shareAffiliateAnalysis.decision.option.maintainQuality':
      'Održati kvalitet: zaštititi kvalitet saobraćaja i konverziju.',
    'shareAffiliateAnalysis.decision.option.monitor':
      'Pratiti mesečno: potvrditi stabilnost profita i depozita.',
    'shareAffiliateAnalysis.decision.option.improveLeadQuality':
      'Poboljšati kvalitet leadova: fokus na izvore sa boljom konverzijom i vrednošću.',
    'shareAffiliateAnalysis.decision.option.focusRetention':
      'Fokus na zadržavanje: poboljšati aktivaciju nakon registracije radi većih net depozita.',

    // Share — Board login
    'shareBoardLogin.eyebrow': 'Board pristup',
    'shareBoardLogin.title': 'Otvori deljeni izveštaj',
    'shareBoardLogin.subtitle':
      'Unesite pristupni kod da biste videli deljeni board izveštaj (samo za čitanje).',
    'shareBoardLogin.badge.readOnly': 'Samo za čitanje',
    'shareBoardLogin.field.accessCode': 'Pristupni kod',
    'shareBoardLogin.field.placeholder': 'Nalepite pristupni kod (npr. share_...)',
    'shareBoardLogin.helper': 'Savet: kodovi obično počinju sa “share_” ili “share_local_”.',
    'shareBoardLogin.cta': 'Nastavi',
    'shareBoardLogin.clear': 'Ukloni sačuvani kod',
    'shareBoardLogin.note':
      'Ovaj kod daje samo read-only pristup deljenoj zoni izveštaja. Ne daje pristup internim dashboard-ovima.',
    'shareBoardLogin.error.missing': 'Unesite pristupni kod.',
    'shareBoardLogin.error.invalid': 'Nevažeći ili istekao pristupni kod.',
    'shareBoardLogin.error.network': 'Greška mreže. Pokušajte ponovo.',

    // Report Analysis
    'analysis.header.label': 'Analiza',
    'analysis.header.title': 'Analiza',
    'analysis.header.subtitle': 'Izaberite analizu i primenite filtere godina/mesec.',
    'analysis.tabs.comments': 'Comment Report',
    'analysis.tabs.bots': 'Bot Users',
    'analysis.kpi.validTransfers': 'Validni transferi',
    'analysis.kpi.uniqueUsers': 'Jedinstveni korisnici',
    'analysis.kpi.affiliatesInvolved': 'Uključeni afiliati',
    'analysis.kpi.economicImpact': 'Ekonomski uticaj (from {id})',
    'analysis.kpi.economicImpactHelper': '{count} korisnika × {cpa}',
    'analysis.chart.ranking': 'Ranking',
    'analysis.chart.top10Inbound': 'Top 10 Inbound',
    'analysis.chart.top10InboundSubtitle': 'Afiliati koji su primili najviše korisnika',
    'analysis.chart.top10Outbound': 'Top 10 Outbound',
    'analysis.chart.top10OutboundSubtitle': 'Afiliati koji su izgubili najviše korisnika',
    'analysis.chart.top10Net': 'Top 10 Net',
    'analysis.chart.top10NetSubtitle': 'Bilans korisnika po afilijatu',
    'analysis.chart.top15Flows': 'Top 15 tokova od → do',
    'analysis.chart.top15FlowsSubtitle': 'Glavni parovi prenosa',
    'analysis.bots.eyebrow': 'Bots',
    'analysis.bots.title': 'Bot Users Analysis',
    'analysis.bots.description':
      'Spreman layout: povežite dataset botova ovde za replikaciju KPI i Top 10.',
    'analysis.bots.details':
      'Povežite bot fajl/endpoint za izračunavanje bot korisnika, obima i tokova. Možemo ponovo koristiti istu šemu (filteri godina/mesec, Top10 sa grafikonima i ekonomski uticaj) čim bude dostupan dataset.',
    'analysis.loading': 'Učitavanje analize…',
    'analysis.error.parsing': 'Greška pri parsiranju comments.csv fajla',
    'analysis.error.loading': 'Greška pri učitavanju comments.csv',
    'analysis.noData': 'Nema dostupnih podataka.',
    'sidebar.roadmap': 'Mega-storiji',
    'sidebar.weeklyMap': 'Weekly Map',
    'sidebar.weeklyExecutionHistory': 'Nedeljna istorija izvršenja',
    'sidebar.orgChart': 'Org chart',
    'sidebar.supportUserCheck': 'Support • Provera korisnika',
    'sidebar.upload': 'Upload',

    // Weekly Execution History
    'weeklyExecutionHistory.header.label': 'Operativna memorija',
    'weeklyExecutionHistory.header.title': 'Nedeljna istorija izvršenja',
    'weeklyExecutionHistory.header.subtitle':
      'Samo za čitanje: planirano naspram završenog, po nedeljama.',
    'weeklyExecutionHistory.header.weekRange': 'Nedelja {start} → {end}',
    'weeklyExecutionHistory.filters.week': 'Nedelja',
    'weeklyExecutionHistory.filters.currentBadge': '(trenutna)',
    'weeklyExecutionHistory.sections.planned': 'Planirano',
    'weeklyExecutionHistory.sections.done': 'Završeno',
    'weeklyExecutionHistory.empty': 'Nema unosa u istoriji.',

    'login.pill': 'Pristup: Management + Finance + Support',
    'login.title': 'Bullwaves Intelligence',
    'login.subtitle': 'Unesite poslovni email da nastavite. Lozinka nije potrebna.',
    'login.workEmail': 'Poslovni email',
    'login.placeholder': 'ti@bullwaves.com',
    'login.hint': 'Prihvaćeni su samo emailovi iz org charta (Management, Finance ili Support).',
    'login.continue': 'Nastavi',
    'login.viewOrgChart': 'Prikaži Org Chart ↗',
    'login.allowlistDepartments': 'Odeljenja koja mogu da se prijave',
    'login.allowlistDepartmentsAria': 'Dozvoljeni timovi',

    'login.typing.welcome': 'Dobrodošli u Bullwaves Intelligence',
    'login.typing.access': 'Pristup: Management + Finance + Support',
    'login.typing.allowlist': 'Email allowlist je aktivan',
    'login.error.unable': 'Nije moguće prijaviti se.',

    'auth.emailNotAllowlisted': 'Email nije na allowlisti (Management + Finance + Support).',

    'lang.label': 'Jezik',

    // Common
    'common.show': 'Prikaži',
    'common.hide': 'Sakrij',
    'common.all': 'Svi',
    'common.info': 'Info',
    'common.close': 'Zatvori',
    'common.save': 'Sačuvaj',
    'common.delete': 'Obriši',
    'common.cancel': 'Otkaži',
    'common.resetFilters': 'Resetuj filtere',
    'common.selectEllipsis': 'Izaberi…',
    'common.month': 'mesec',
    'common.months': 'meseci',
    'common.na': 'N/A',
    'common.loading': 'Molimo sačekajte…',

    // Trader Points
    'traderPoints.page.title': 'Trader Points — simulacija i uticaj',
    'traderPoints.page.subtitle': 'Aktivnost · Rizik · Retencija',
    'traderPoints.dataSource.label': 'Izvor podataka',
    'traderPoints.dataSource.console': 'Konzola',
    'traderPoints.dataSource.csv': 'CSV (dijagnostika)',
    'traderPoints.console.loading': 'Učitavanje…',
    'traderPoints.console.supportSource': 'Support (provera korisnika) · {count} korisnika',
    'traderPoints.console.mockSource': 'Rezervni mock · {count} korisnika',
    'traderPoints.console.mockBadge': 'Koriste se mock podaci (indeks nije dostupan)',
    'traderPoints.console.loadErrorFallback': 'Nije moguće učitati indeks korisnika za support',
    'traderPoints.chips.spread': 'Prosečan spread 0.1 pips',
    'traderPoints.chips.leverage': 'Poluga 1:500',

    'traderPoints.exec.title': 'Izvršni rezime — prikaz za odluke',
    'traderPoints.exec.retention.label': 'RETENCIJA',
    'traderPoints.exec.activity.label': 'AKTIVNOST',
    'traderPoints.exec.risk.label': 'RIZIK',
    'traderPoints.exec.retention.unitDays': 'dana',
    'traderPoints.exec.retention.caption': 'Korisnici ostaju aktivni duže',
    'traderPoints.exec.activity.value': '≈ nepromenjeno',
    'traderPoints.exec.activity.caption': 'Tempo trgovanja ostaje stabilan',
    'traderPoints.exec.risk.value': 'Kontrolisano',
    'traderPoints.exec.risk.caption': 'Bez rasta visokorizičnog ponašanja',
    'traderPoints.exec.causal.line1':
      'Rast ukupne vrednosti dolazi od toga što korisnici ostaju aktivni duže,',
    'traderPoints.exec.causal.line2': 'ne od toga da trguju agresivnije.',
    'traderPoints.exec.mechanics.1': 'Ista dnevna aktivnost → bez pritiska na korisnike',
    'traderPoints.exec.mechanics.2': 'Duže putovanje → više završenih ciljeva',
    'traderPoints.exec.mechanics.3': 'Nagrada vezana za provizije → predvidiv trošak',
    'traderPoints.exec.takeaway.title': 'Izvršni zaključak',
    'traderPoints.exec.takeaway.text':
      'Uz isti trošak, incentivi zasnovani na cilju povećavaju retenciju kroz veću participaciju, ne kroz veći intenzitet.',

    'traderPoints.deepDive.title': 'Detaljna analiza',
    'traderPoints.section.whatChanges': 'Šta se menja',
    'traderPoints.deltaVs': 'Δ u odnosu na {baseline} · {oneLiner}',
    'traderPoints.baseline.label': 'Bazna linija',
    'traderPoints.baseline.noIncentive': 'Bez incentiva',
    'traderPoints.baseline.classicBonus': 'Klasični bonus',
    'traderPoints.baseline.tpDefault': 'Trader Points (podrazumevano)',
    'traderPoints.baseline.oneLiner.classicBonus':
      'Klasični bonus često pravi kratkotrajan skok aktivnosti sa brzim opadanjem.',
    'traderPoints.baseline.oneLiner.noIncentive': 'Posmatrana bazna linija (istorijski).',
    'traderPoints.baseline.oneLiner.tpDefault': 'Bazna linija sa ciljem (progresivni engagement).',
    'traderPoints.baseline.tooltip.label': 'Definicije bazne linije',
    'traderPoints.baseline.tooltip.title': 'Bazna linija',
    'traderPoints.baseline.tooltip.noIncentive.title': 'Bez incentiva',
    'traderPoints.baseline.tooltip.noIncentive.desc': 'Posmatrano ponašanje (istorijski).',
    'traderPoints.baseline.tooltip.classicBonus.title': 'Klasični bonus',
    'traderPoints.baseline.tooltip.classicBonus.desc':
      'Pretpostavke spike+decay po pravilima (nije iz regresija).',
    'traderPoints.baseline.tooltip.tp.title': 'Trader Points',
    'traderPoints.baseline.tooltip.tp.desc': 'Bazna linija sa ciljem i progresivnim engagementom.',

    'traderPoints.narrativeBridge.title': 'Isti tempo, duže putovanje',
    'traderPoints.narrativeBridge.line1': 'Dnevna aktivnost ostaje skoro nepromenjena.',
    'traderPoints.narrativeBridge.line2': 'Menja se koliko dugo korisnici ostaju aktivni.',
    'traderPoints.narrativeBridge.line3': 'Vreme × doslednost pokreću ukupne poene.',
    'traderPoints.narrativeBridge.formula.totalPoints': 'Ukupno poena',
    'traderPoints.narrativeBridge.formula.dailyActivity': 'Dnevna aktivnost',
    'traderPoints.narrativeBridge.formula.activeDays': 'Aktivni dani',

    'traderPoints.scenarioControls.title': 'Kontrole scenarija',
    'traderPoints.scenarioControls.subtitle': 'Podešavanje incentiva i guardrail-a.',
    'traderPoints.chart.ppdTitle': 'Distribucija pozicija/dan',

    'traderPoints.economicLogic.title': 'Ekonomska logika (konstantan trošak)',
    'traderPoints.economicLogic.bullet1': 'Bonusi se zarađuju kroz provizije, ne poklanjaju se',
    'traderPoints.economicLogic.bullet2': 'Brzina progresa menja dostižnost, ne vrednost bonusa',
    'traderPoints.economicLogic.bullet3': 'Retencija raste kroz participaciju, ne kroz pritisak',

    'traderPoints.why.title': 'Zašto se dešava',
    'traderPoints.why.tooltip.label': 'Zašto incentivi zasnovani na cilju funkcionišu',
    'traderPoints.why.tooltip.title': 'Zašto incentivi zasnovani na cilju funkcionišu',
    'traderPoints.why.tooltip.desc': 'Uporedite ponašanja i dostižnost cilja.',
    'traderPoints.why.heading': 'Zašto incentivi zasnovani na cilju funkcionišu',
    'traderPoints.why.bullet1': 'Više korisnika ulazi u putanju sa ciljem',
    'traderPoints.why.bullet2': 'Manje korisnika odustaje pre završetka',
    'traderPoints.why.bullet3': 'Retencija raste kroz participaciju, ne kroz pritisak',

    'traderPoints.reachability.micro': 'Cilj deluje dostižno',

    'traderPoints.whyDynamic.guardrail':
      'U ovom scenariju, visokorizični korisnici su isključeni iz uslova za otključavanje.',
    'traderPoints.whyDynamic.faster': 'U ovom scenariju, progres “deluje” brže (×{mult}).',
    'traderPoints.whyDynamic.slower': 'U ovom scenariju, progres “deluje” sporije (×{mult}).',
    'traderPoints.whyDynamic.targetCloser':
      'U ovom scenariju, cilj “deluje” bliže (brža gratifikacija).',
    'traderPoints.whyDynamic.targetFarther':
      'U ovom scenariju, cilj “deluje” dalje (duže putovanje).',
    'traderPoints.whyDynamic.unlockRate':
      'U ovom scenariju, pretpostavlja se da je ~{pct}% korisnika targetirano ciljem.',
    'traderPoints.whyDynamic.bonusValue': 'U ovom scenariju, vrednost finalne nagrade je {amount}.',
    'traderPoints.whyDynamic.default':
      'U ovom scenariju, dostižnost i udaljenost cilja su blizu bazne linije.',

    'traderPoints.optional.reliability': 'Pouzdanost (opciono)',
    'traderPoints.optional.datasetOverview': 'Pregled skupa podataka (opciono)',
    'traderPoints.optional.tables': 'Detaljne tabele (opciono)',
    'traderPoints.optional.export': 'Izvoz (opciono)',

    'traderPoints.export.snapshotCsv': 'Izvezi snapshot (CSV)',
    'traderPoints.export.snapshotJson': 'Izvezi snapshot (JSON)',
    'traderPoints.export.ppdCsv': 'Izvezi PPD (CSV)',

    // Scenario Controls
    'traderPoints.controls.preset.title': 'Preset',
    'traderPoints.controls.preset.micro': 'Logika: cilj je vezan za provizije.',
    'traderPoints.controls.preset.custom': 'Prilagođeno',
    'traderPoints.controls.preset.commissionOnly': 'Samo provizije',
    'traderPoints.controls.preset.commissionOnly.sub':
      'Bazna linija: cilj vezan za provizije (€200) uz standardne guardrail-e.',
    'traderPoints.controls.preset.goal500': 'Cilj €500',
    'traderPoints.controls.preset.goal500.sub':
      'Viši cilj (€500) uz umereno povećanje dostižnosti (×1.5) i šire učešće.',
    'traderPoints.controls.preset.acceleratedPromo': 'Ubrzana promo',
    'traderPoints.controls.preset.acceleratedPromo.sub':
      'Promotivno ubrzanje (×4) sa ciljem €500; prikazuje gornju granicu efekta dostižnosti.',
    'traderPoints.controls.preset.tooltip.label': 'Preset',
    'traderPoints.controls.preset.tooltip.title': 'Preset',
    'traderPoints.controls.preset.tooltip.desc':
      'Ovi preset-i menjaju samo kontrole scenarija i UI tekst.',
    'traderPoints.controls.preset.whatMeans': 'Šta znači:',

    'traderPoints.controls.reachability.label': 'Dostižnost cilja',
    'traderPoints.controls.reachability.tooltip.desc':
      'NE menja način zarađivanja poena. Menja samo percepciju dostižnosti cilja.',
    'traderPoints.controls.reachability.delta.more':
      'Sa ×{mult}, oko {pct}% više korisnika dostiže prag cilja (pre unlock rate-a).',
    'traderPoints.controls.reachability.delta.less':
      'Sa ×{mult}, oko {pct}% manje korisnika dostiže prag cilja (pre unlock rate-a).',

    'traderPoints.controls.goal.label': 'Cilj (Trader Points)',
    'traderPoints.controls.goal.tooltip.label': 'Potrebni poeni',
    'traderPoints.controls.goal.tooltip.title': 'Prag cilja',
    'traderPoints.controls.goal.tooltip.line1':
      'Trader Points predstavljaju realne provizije koje generiše korisnik.',
    'traderPoints.controls.goal.tooltip.line2': 'Primer: bonus €200 → cilj 200 Trader Points.',
    'traderPoints.controls.goal.micro':
      'Cilj je vezan za provizije (1 TP ≈ €1). Veći ciljevi smanjuju dostižnost.',
    'traderPoints.controls.goal.linkLabel': 'Poveži cilj i trošak bonusa',

    'traderPoints.controls.bonus.label': 'Iznos bonusa',
    'traderPoints.controls.bonus.tooltip.label': 'Iznos bonusa',
    'traderPoints.controls.bonus.tooltip.title': 'Iznos bonusa',
    'traderPoints.controls.bonus.tooltip.line1': 'Bonus je ekonomski trošak (npr. €200).',
    'traderPoints.controls.bonus.tooltip.line2':
      'U klasičnom setapu, poeni cilja odgovaraju bonusu (vezano za provizije).',
    'traderPoints.controls.bonus.micro':
      'Bonus se zarađuje generisanjem ekvivalentnih provizija (Trader Points).',

    'traderPoints.controls.unlockRate.label': 'Unlock rate (%)',
    'traderPoints.controls.unlockRate.tooltip.label': 'Unlock rate',
    'traderPoints.controls.unlockRate.tooltip.title': 'Unlock rate (%)',
    'traderPoints.controls.unlockRate.tooltip.line1': 'Udeo korisnika koji su targetirani ciljem.',
    'traderPoints.controls.unlockRate.tooltip.line2':
      'Koristi se za simulaciju, ne za realnu isplatu.',
    'traderPoints.controls.unlockRate.helper.base':
      'Pretpostavlja se da je {pct}% korisnika targetirano ciljem.',
    'traderPoints.controls.unlockRate.helper.guardrail':
      '{base} Guardrail smanjuje uslovnost za visokorizične korisnike.',
    'traderPoints.controls.unlockRate.helper.baseline': '{base} Bazni udeo participacije.',
    'traderPoints.controls.unlockRate.helper.wider':
      '{base} Šira participacija → veći sistemski efekat.',
    'traderPoints.controls.unlockRate.helper.narrower':
      '{base} Uža participacija → manji sistemski efekat.',

    'traderPoints.controls.guardrail.label': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.label': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.title': 'Guardrail',
    'traderPoints.controls.guardrail.tooltip.line1':
      'Sprečava podsticanje visokorizičnog ponašanja.',
    'traderPoints.controls.guardrail.tooltip.line2':
      'Visokorizični korisnici su isključeni iz uslova za otključavanje (interni risk proxy).',
    'traderPoints.controls.guardrail.badge': 'Scenario filtriran po riziku',
    'traderPoints.controls.guardrail.micro.on':
      'Visokorizični korisnici su isključeni iz uslova za otključavanje.',
    'traderPoints.controls.guardrail.micro.off':
      'Svi podobni korisnici se razmatraju za otključavanje.',

    // CSV Uploader
    'traderPoints.csvUploader.title': '1. Upload izveštaja o pozicijama',
    'traderPoints.csvUploader.rowsLoaded': 'Učitano redova: {count}',
    'traderPoints.csvUploader.rowsSkipped': ' | Preskočeno redova: {count}',

    // KPI Cards
    'traderPoints.kpi.activity.label': 'Prosečna aktivnost',
    'traderPoints.kpi.activity.unit': 'trgovanja/dan',
    'traderPoints.kpi.retention.label': 'Prosečna retencija',
    'traderPoints.kpi.retention.unit': 'dana',
    'traderPoints.kpi.risk.label': 'Prosečan rizik',
    'traderPoints.kpi.risk.unit': 'rizik',
    'traderPoints.kpi.deltaLine': 'Δ u odnosu na {baseline} · Novo {value} {delta}',
    'traderPoints.kpi.activity.line': 'Korisnici trguju konzistentnije kada progres deluje realno.',
    'traderPoints.kpi.retention.line': 'Korisnici ostaju duže kada je napredak ka cilju vidljiv.',
    'traderPoints.kpi.risk.line.guardrail':
      'Guardrail-i sprečavaju podsticanje visokorizičnog ponašanja.',
    'traderPoints.kpi.risk.line.noGuardrail':
      'Rizik može porasti kada jači incentivi povećaju izloženost.',

    // Legacy (CSV mod)
    'traderPoints.legacy.avgTradesPerUser': 'Prosečno trgovanja/korisnik',
    'traderPoints.legacy.riskIndicator': 'Indikator rizika',
    'traderPoints.legacy.activeDays': 'Aktivni dani',

    // Working set
    'traderPoints.workingSet.activeSample': 'Aktivni uzorak',
    'traderPoints.workingSet.tooltip.rules.label': 'Pravila working seta',
    'traderPoints.workingSet.tooltip.rules.title': 'Filter aktivnih korisnika',
    'traderPoints.workingSet.tooltip.rules.deposits': 'depoziti > 0',
    'traderPoints.workingSet.tooltip.rules.positions': 'pozicije > 0',
    'traderPoints.workingSet.tooltip.rules.age': 'starost naloga > 1 dan',
    'traderPoints.workingSet.avgPositions': 'Prosečan broj pozicija (count)',
    'traderPoints.workingSet.tooltip.positions.label': 'Info o broju pozicija',
    'traderPoints.workingSet.tooltip.positions.title': 'Šta su “pozicije”?',
    'traderPoints.workingSet.tooltip.positions.desc':
      'To je kolona iz izveštaja sa ukupnim istorijskim brojem pozicija/trade-ova, ne “otvorene pozicije sada”.',
    'traderPoints.workingSet.medianLabel': 'Medijana {value}',
    'traderPoints.workingSet.ppdMedianZone': 'Pozicije/dan (zona medijane)',
    'traderPoints.workingSet.tooltip.ppd.label': 'Definicije pozicije/dan',
    'traderPoints.workingSet.tooltip.ppd.title': 'Pozicije/dan',
    'traderPoints.workingSet.tooltip.ppd.formula':
      'PPD = pozicije / daniOd(kvalifikacije ili prvog depozita)',
    'traderPoints.workingSet.tooltip.ppd.zone':
      '“Zona medijane” zadržava vrednosti blizu medijane (Gauss-like preko MAD σ) da smanji uticaj outlier-a.',
    'traderPoints.workingSet.keptLine': 'Zadržano {keptPct}% · Medijana {median}',
    'traderPoints.workingSet.rawLine': 'Sirovi prosek {rawMean} · Globalno {globalMean}',
    'traderPoints.workingSet.lifetime': 'Lifetime (dani)',
    'traderPoints.workingSet.tooltip.lifetime.label': 'Definicije lifetime-a',
    'traderPoints.workingSet.tooltip.lifetime.title': 'Definicije',
    'traderPoints.workingSet.tooltip.lifetime.account': 'Lifetime naloga: dani od registracije.',
    'traderPoints.workingSet.tooltip.lifetime.trader':
      'Lifetime trgovca: dani od kvalifikacije/prvog depozita (ako je dostupno).',
    'traderPoints.workingSet.traderLifetimeLine': 'Lifetime trgovca {days} · dostupno {pct}%',

    // Regression Summary
    'traderPoints.regression.title': 'Pouzdanost signala (direkcioni)',
    'traderPoints.regression.tooltip.label': 'Pouzdanost signala',
    'traderPoints.regression.tooltip.title': 'Pouzdanost signala (direkcioni)',
    'traderPoints.regression.tooltip.desc':
      'Ove procene služe za smer i relativni uticaj, ne za precizno prognoziranje.',
    'traderPoints.regression.tooltip.note': 'Podrška odlučivanju — ne procena po korisniku.',
    'traderPoints.regression.metric.activity': 'Aktivnost',
    'traderPoints.regression.metric.risk': 'Rizik',
    'traderPoints.regression.metric.retention': 'Retencija',
    'traderPoints.regression.r2Label.low': 'Slab signal — samo smer',
    'traderPoints.regression.r2Label.weak': 'Slabo',
    'traderPoints.regression.r2Label.medium': 'Srednje',
    'traderPoints.regression.r2Label.strong': 'Jako',
    'traderPoints.regression.avgError': 'Prosečna greška (realne jedinice): {value}',
    'traderPoints.regression.maeText.activity': '±{value} trgovanja/dan',
    'traderPoints.regression.maeText.retention': '±{value} dana',
    'traderPoints.regression.maeText.risk': '±{value} jedinica rizika',

    // Impact Breakdown
    'traderPoints.impact.whereRetentionTitle': 'Odakle zaista dolazi retencija',
    'traderPoints.impact.micro': 'Kako se prosečna retencija menja kada dostižnost poraste.',
    'traderPoints.impact.howCalc.label': 'Kako se računa',
    'traderPoints.impact.howCalc.title': 'Kako se ovaj broj računa',
    'traderPoints.impact.howCalc.step1': '1) Neki korisnici dostižu prag cilja (podobni).',
    'traderPoints.impact.howCalc.step2': '2) Deo podobnih ulazi u putanju cilja (unlock rate).',
    'traderPoints.impact.howCalc.step3':
      '3) Prosečna retencija raste uglavnom zato što više korisnika učestvuje, ne zato što postaju “intenzivniji” ili preuzimaju veći rizik.',
    'traderPoints.impact.reachability': 'Dostižnost',
    'traderPoints.impact.eligibleUsers': 'Podobni korisnici',
    'traderPoints.impact.eligibleDesc': 'Dostižu prag cilja uz trenutni tempo.',
    'traderPoints.impact.unlockedUsers': 'Otključani korisnici',
    'traderPoints.impact.unlockedDesc': 'Ulaze u putanju cilja.',
    'traderPoints.impact.definitions':
      'Definicije: podobni = dostižu prag. otključani = podobni koji ulaze u putanju (unlock rate).',
    'traderPoints.impact.retention': 'Retencija',
    'traderPoints.impact.retentionBaseline': 'Prosečna retencija (bazna linija)',
    'traderPoints.impact.retentionScenario': 'Prosečna retencija (scenario)',
    'traderPoints.impact.retentionUplift': 'Povećanje prosečne retencije',
    'traderPoints.impact.compositionTitle': 'Povećanje zbog učešća (efekat kompozicije)',
    'traderPoints.impact.compositionDesc':
      'Sa većom brzinom, više korisnika ulazi u putanju cilja.',
    'traderPoints.impact.perUserTitle': 'Povećanje kod već otključanih (efekat po korisniku)',
    'traderPoints.impact.perUserDesc':
      'Korisnici koji bi otključali i na ×1 deluju bliže završetku.',
    'traderPoints.impact.sanity.title': 'Provera modela (opciono)',
    'traderPoints.impact.sanity.note':
      'Samo audit: proverava internu konzistentnost računice scenarija.',
    'traderPoints.impact.sanity.avgPointsBefore': 'Prosek poena (pre)',
    'traderPoints.impact.sanity.avgPointsAfter': 'Prosek poena (posle)',
    'traderPoints.impact.sanity.aboveThreshold1x': 'Iznad praga (×1)',
    'traderPoints.impact.sanity.aboveThresholdMx': 'Iznad praga (×{mult})',
    'traderPoints.impact.sanity.footer':
      'Pre/posle koriste isti prag i unlock rate; menja se samo dostižnost.',

    // Tables
    'traderPoints.tables.unknownUser': 'Nepoznato',
    'traderPoints.tables.idPrefix': 'ID',
    'traderPoints.tables.symbolsTop': 'Top simboli',
    'traderPoints.tables.symbolsTooltip.label': 'Kontekst simbola',
    'traderPoints.tables.symbolsTooltip.title': 'Kako se računa',
    'traderPoints.tables.symbolsTooltip.line1':
      'U user-centric modu koristimo globalnu distribuciju simbola (težina %).',
    'traderPoints.tables.symbolsTooltip.line2':
      '“Procenjeni poeni” je proporcionalna procena na osnovu težine simbola.',
    'traderPoints.tables.col.symbol': 'Simbol',
    'traderPoints.tables.col.weight': 'Težina',
    'traderPoints.tables.col.estimatedPoints': 'Procenjeni poeni',
    'traderPoints.tables.usersTop': 'Top korisnici',
    'traderPoints.tables.topByPositions': 'Top po pozicijama',
    'traderPoints.tables.usersLow': 'Niski korisnici',
    'traderPoints.tables.col.user': 'Korisnik',
    'traderPoints.tables.col.positions': 'Pozicije',
    'traderPoints.tables.col.points': 'Poeni',
    'traderPoints.tables.pointsFloored': '(zaokruženo na 0)',

    // Chart tooltip/aria
    'traderPoints.chart.tooltip.label': 'Detalji grafikona',
    'traderPoints.chart.tooltip.title': 'Šta prikazuje',
    'traderPoints.chart.tooltip.line1':
      'Kriva je glatka referenca izgrađena iz medijane i robustne procene disperzije.',
    'traderPoints.chart.tooltip.line2':
      'X osa je “odsečena” (p1–p99 ili oko medijane) da dugi repovi ne spljošte histogram.',
    'traderPoints.chart.stats': 'N={n} · medijana≈{mu} · disperzija≈{sigma}',
    'traderPoints.chart.aria': 'Histogram pozicija po danu sa gausovom krivom',
    'traderPoints.chart.medianLabel': 'medijana',

    'common.keys.enter': 'Enter',

    // Report
    'report.loader.data': 'Učitavanje podataka izveštaja…',
    'report.period.global': 'Globalno',
    'report.period.annual': 'Godišnje {year}',
    'report.period.monthly': 'Mesečno {month}',
    'report.period.monthlyFallback': 'Mesečno',

    'report.header.label': 'Izveštaj',
    'report.header.title': 'Brzi izveštaj po periodu',
    'report.header.subtitle': 'Kompaktan pregled po periodu. KPI + top afiliati.',

    'report.modes.monthly': 'Mesečno',
    'report.modes.annual': 'Godišnje',
    'report.modes.global': 'Globalno',

    'report.filters.month': 'Mesec',
    'report.filters.noMonths': 'Nema dostupnih meseci',

    'report.summary.periodLabel': 'Period',
    'report.summary.rowsLine': '{media} media redova · {payments} plaćanja',
    'report.summary.sourceLine': 'Izvor: Media Report + Payments/Commissions',

    'report.kpis.cpaHint': 'Plaćanja / FTD',
    'report.kpis.arpuHint': 'PL / registracije',
    'report.kpis.profitHint': 'PL - plaćanja',
    'report.kpis.roiHint': 'Profit / plaćanja',
    'report.kpis.volumeHint': 'Registracije i FTD',

    'report.topAffiliates.title': 'Top afiliati (8)',
    'report.topAffiliates.subtitle': 'Sortirano po profitu · Izvor: media+payments',

    'report.table.headers.affiliate': 'Affiliate',
    'report.table.headers.reg': 'Reg',
    'report.table.headers.ftd': 'FTD',
    'report.table.headers.cpa': 'CPA',
    'report.table.headers.arpu': 'ARPU',
    'report.table.headers.roi': 'ROI',
    'report.table.headers.profit': 'Profit',
    'report.table.headers.breakEven': 'Break-even',
    'report.table.empty.noDataForPeriod': 'Nema podataka za izabrani period',
    'report.table.breakEvenMonths': '{count} meseci',

    'report.exportNotes.title': 'Napomene za izvoz',
    'report.exportNotes.subtitle': 'Osnovni raspored spreman za dodavanje dugmeta za izvoz',
    'report.exportNotes.item1': 'Jasan raspored i tabela već sortirana po profitu.',
    'report.exportNotes.item2':
      'Filter perioda: globalno (svi podaci), godišnje (tekuća godina), mesečno (izabrani mesec).',
    'report.exportNotes.item3':
      'Ključne metrike: CPA, ARPU, profit, obim (reg/FTD), procenjeni break-even.',
    'report.exportNotes.item4':
      'Spremno za povezivanje dugmeta za izvoz (PDF/CSV) bez promene rasporeda.',

    // Departments
    'departments.Infrastructure': 'Infrastruktura',
    'departments.Product': 'Proizvod',
    'departments.Data': 'Podaci',
    'departments.Compliance': 'Usklađenost',
    'departments.UX': 'UX',
    'departments.Partners': 'Partneri',

    // Ongoing (Execution Board)
    'ongoing.confirm.resetToSeed':
      'Ovo će prepisati lokalne izmene i vratiti početne podatke. Nastaviti?',
    'ongoing.placeholder.example': 'npr. neto depoziti, registracije, churn',

    'ongoing.header.layerLabel': 'Sloj izvršenja',
    'ongoing.header.title': 'Tabla izvršenja',
    'ongoing.header.subtitle': 'Aktivni zadaci vezani za mega-storije i storije Roadmap-a 2026.',

    'ongoing.counters.active': '{count} aktivnih',
    'ongoing.counters.blocked': '{count} blokiranih',
    'ongoing.counters.done': '{count} završenih',

    'ongoing.actions.resetToSeed': 'Resetuj na početne podatke',
    'ongoing.actions.markAsDone': 'Označi kao završeno',

    'ongoing.toggle.active': 'Aktivno',
    'ongoing.toggle.done': 'Završeno',

    'ongoing.kpis.activeExecution': 'Aktivno izvršenje',
    'ongoing.kpis.active': 'Aktivno',
    'ongoing.kpis.blocked': 'Blokirano',
    'ongoing.kpis.doneHistory': 'Završeno / Istorija',

    'ongoing.filters.megaStory': 'Mega-story',
    'ongoing.filters.story': 'Story',
    'ongoing.filters.department': 'Odeljenje',
    'ongoing.filters.platformArea': 'Oblast platforme',
    'ongoing.filters.status': 'Status',

    'ongoing.feed.historyLabel': 'Istorija',
    'ongoing.feed.executionFeedLabel': 'Feed izvršenja',
    'ongoing.feed.completedTasksTitle': 'Završeni zadaci',
    'ongoing.feed.activeExecutionTitle': 'Aktivno izvršenje',
    'ongoing.feed.itemsCount': '{count} stavki',

    'ongoing.card.created': 'Kreirano {date}',
    'ongoing.card.completed': 'Završeno {date}',

    'ongoing.labels.nextStep': 'Sledeći korak',
    'ongoing.labels.blocker': 'Bloker',
    'ongoing.labels.impact': 'Uticaj',

    'ongoing.empty.noTasksMatchFilters': 'Nijedan zadatak ne odgovara trenutnim filterima.',

    'ongoing.details.title': 'Detalji',
    'ongoing.details.panelTitle': 'Panel detalja',
    'ongoing.details.selectTask': 'Izaberi zadatak da vidiš detalje.',
    'ongoing.details.objective': 'Cilj',
    'ongoing.details.nextStep': 'Sledeći korak',
    'ongoing.details.dependenciesBlockers': 'Zavisnosti / blokade',
    'ongoing.details.created': 'Kreirano',
    'ongoing.details.impact': 'Uticaj',
    'ongoing.details.capturedWhenDone': 'Zabeleženo kada je označeno kao završeno.',
    'ongoing.details.kpi': 'KPI',
    'ongoing.details.note': 'Napomena',
    'ongoing.details.completedOn': 'Završeno {date}',

    'ongoing.modal.title': 'Označi kao završeno',
    'ongoing.modal.impactType': 'Tip uticaja',
    'ongoing.modal.selectImpactType': 'Izaberi tip uticaja',
    'ongoing.modal.impactedDepartment': 'Pogođeno odeljenje',
    'ongoing.modal.selectDepartment': 'Izaberi odeljenje',
    'ongoing.modal.impactedPlatformArea': 'Pogođena oblast platforme',
    'ongoing.modal.selectPlatformArea': 'Izaberi oblast',
    'ongoing.modal.impactedKpi': 'Pogođeni KPI',
    'ongoing.modal.impactNoteOptional': 'Napomena o uticaju (opciono)',
    'ongoing.modal.saveImpactClose': 'Sačuvaj uticaj i zatvori',

    'ongoing.triage.needsTriage': 'Potrebna provera',
    'ongoing.triage.mappingFixesRequired': 'Potrebne ispravke mapiranja',
    'ongoing.triage.selectMegaStory': 'Izaberi mega-story',
    'ongoing.triage.selectStory': 'Izaberi story',
    'ongoing.triage.saveMapping': 'Sačuvaj mapiranje',
    'ongoing.triage.noMega': 'nema mega',
    'ongoing.triage.noStory': 'nema story',
    'ongoing.triage.reasonLabel': 'Razlog',
    'ongoing.triage.noTasks': 'Nema zadataka za proveru.',
    'ongoing.triage.reason.unknownMegaStoryId': 'nepoznat megaStoryId',
    'ongoing.triage.reason.unknownStoryId': 'nepoznat storyId',
    'ongoing.triage.reason.storyNotUnderMegaStoryId': 'storyId nije pod megaStoryId',

    'ongoing.status.active': 'Aktivno',
    'ongoing.status.blocked': 'Blokirano',
    'ongoing.status.done': 'Završeno',

    'ongoing.priority.high': 'Visok',
    'ongoing.priority.medium': 'Srednji',
    'ongoing.priority.low': 'Nizak',

    'ongoing.impactType.revenue': 'Prihod',
    'ongoing.impactType.retention': 'Zadržavanje',
    'ongoing.impactType.risk_reduction': 'Smanjenje rizika',
    'ongoing.impactType.efficiency': 'Efikasnost',

    'ongoing.platformArea.Trading': 'Trading',
    'ongoing.platformArea.Analytics': 'Analitika',
    'ongoing.platformArea.Payments': 'Uplate',
    'ongoing.platformArea.Infra': 'Infra',
    'ongoing.platformArea.Profile': 'Profil',
    'ongoing.platformArea.Internal': 'Interno',

    // Topbar
    'topbar.aria.toggleNavMenu': 'Uključi/isključi navigacioni meni',
    'topbar.aria.toggleSidebar': 'Uključi/isključi bočni meni',

    // Support (page-level)
    'support.loader.page': 'Učitavanje support stranice…',

    // Investments
    'investments.loader.data': 'Učitavanje podataka o investicijama…',
    'investments.header.title': 'Isplate afilijata – Ledger isplata',
    'investments.header.subtitle':
      'Troškovi afilijata na kraju meseca na osnovu kvalifikovanih QFTD, CPA i ROI.',
    'investments.filters.month': 'Mesec',
    'investments.filters.allMonths': 'Svi meseci',
    'investments.badge.monthlyRows': '{count} mesečnih redova',

    'investments.kpi.totalQftd': 'Ukupno QFTD',
    'investments.kpi.avgCpa': 'Prosečan CPA',
    'investments.kpi.totalCommissions': 'Ukupne provizije',
    'investments.kpi.commissionPayable': 'Provizija za isplatu',
    'investments.kpi.commissionsDeferred': 'Odložene provizije',
    'investments.kpi.roi': 'ROI',
    'investments.kpi.paid': 'Isplaćeno',

    'investments.section.payoutTimeline': 'Vremenska linija isplata',
    'investments.section.affiliatePayoutSummary': 'Pregled isplata afilijata',

    'investments.search.placeholder': 'Pretraži afilijata',
    'investments.search.aria': 'Pretraži afilijata',

    'investments.table.header.affiliate': 'Afilijat',
    'investments.table.header.cpa': 'CPA',
    'investments.table.header.totalQftd': 'Ukupno QFTD',
    'investments.table.header.paidFiltered': 'Isplaćeno (filtrirano)',
    'investments.table.header.pl': 'P/L',
    'investments.table.header.currentMonthCommission': 'Provizija tekućeg meseca',
    'investments.table.header.financeConfirmed': 'Potvrđeno od finansija',
    'investments.table.header.lastMonth': 'Prošli mesec',
    'investments.table.header.details': 'Detalji',
    'investments.table.title.paidFiltered': 'Isplaćeni iznosi unutar trenutnih filtera',
    'investments.table.row.totals': 'Ukupno (filteri)',

    'investments.input.title.overrideCpa': 'Promeni CPA za ovog afilijata',
    'investments.checkbox.title.financeConfirmed': 'Označi kao potvrđeno od finansija',
    'investments.button.details': 'Detalji',

    'investments.details.header.month': 'Mesec',
    'investments.details.header.reg': 'Reg',
    'investments.details.header.ftd': 'FTD',
    'investments.details.header.qftd': 'QFTD',
    'investments.details.header.netDeposits': 'Neto depoziti',
    'investments.details.header.commissions': 'Provizije',
    'investments.details.header.pl': 'P/L',
    'investments.details.header.roi': 'ROI',
    'investments.details.header.cpa': 'CPA',
    'investments.details.header.commExpected': 'Oček. provizija',
    'investments.details.header.commActual': 'Stvarna provizija',
    'investments.details.header.commPayable': 'Isplativa provizija',
    'investments.details.header.commDeferred': 'Odložena provizija',
    'investments.details.header.paid': 'Isplaćeno',
    'investments.details.header.paymentDate': 'Datum isplate',
    'investments.details.header.details': 'Detalji',

    'investments.details.title.roiFormula': 'ROI = Neto depoziti / Provizija',
    'investments.details.title.commExpected': 'Očekivano = provizija iz Media Report-a',
    'investments.details.title.commActual':
      'Stvarno koristi ROI guardrail: ako je ROI >= 1.5 koristi očekivano, inače Neto depoziti / 1.5',
    'investments.details.title.commPayable': 'Isplativo = min(očekivano, stvarno)',
    'investments.details.title.commDeferred': 'Odloženo = očekivano − isplativo',
    'investments.details.empty.noMonthlyRows': 'Nema mesečnih redova.',
    'investments.table.empty.noAffiliates': 'Nema afilijata za trenutne filtere.',
    'investments.button.showTop10': 'Prikaži top 10',
    'investments.button.showAll': 'Prikaži sve ({count})',

    // Weekly map
    'weeklyMap.placeholders.weeklyTaskTitle': 'Naslov nedeljnog zadatka',
    'weeklyMap.placeholders.owner': 'Vlasnik',
    'weeklyMap.placeholders.expectedImpact': 'Zašto je važno ove nedelje',

    'weeklyMap.columns.planned': 'Planirano',
    'weeklyMap.columns.inProgress': 'U toku',
    'weeklyMap.columns.blocked': 'Blokirano',
    'weeklyMap.columns.done': 'Završeno',

    'weeklyMap.confirm.deleteTask': 'Obrisati ovaj nedeljni zadatak?',

    'weeklyMap.header.filteredTitle': 'Weekly Map — filtrirano po Mega-storiju',
    'weeklyMap.header.allTitle': 'Weekly Map (Svi Mega-storiji)',
    'weeklyMap.header.executionContract': 'Plan izvršenja za nedelju',
    'weeklyMap.header.weekRange': 'Nedelja {start} → {end}',
    'weeklyMap.header.currentWeekBadge': '(TEKUĆA NEDELJA)',
    'weeklyMap.header.archivedReadOnlyBadge': '(arhivirano, samo za čitanje)',
    'weeklyMap.header.executionCommitments': 'Obaveze izvršenja',
    'weeklyMap.header.tasksCount': '{count} zadataka',

    'weeklyMap.filters.week': 'Nedelja',
    'weeklyMap.filters.currentBadge': '(tekuća)',

    'weeklyMap.modal.readOnlyHint': 'Fokus režim (samo čitanje) — koristi za pripremu odluka.',

    'weeklyMap.card.mega': 'Mega',
    'weeklyMap.card.dept': 'Tim',
    'weeklyMap.card.story': 'Story',

    'weeklyMap.empty.noTasks': 'Nema zadataka',

    'weeklyMap.actions.addCommitmentHint': 'Dodaj novu obavezu (samo tekuća nedelja)',
    'weeklyMap.actions.hideForm': 'Sakrij formu',
    'weeklyMap.actions.addCommitment': 'Dodaj obavezu',
    'weeklyMap.actions.shareLink': 'Podeli link',
    'weeklyMap.actions.copied': 'Kopirano',

    'weeklyMap.form.megaStory': 'Mega-story',
    'weeklyMap.form.title': 'Naslov',
    'weeklyMap.form.storyOptional': 'Story (opciono)',
    'weeklyMap.form.department': 'Odeljenje',
    'weeklyMap.form.owner': 'Vlasnik',
    'weeklyMap.form.expectedImpactMandatory': 'Očekivani uticaj (obavezno)',

    'weeklyMap.validation.expectedImpactRequired':
      'Bez očekivanog uticaja, zadatak se ne može sačuvati.',

    'weeklyMap.checklists.prepareSolitics.title': 'Pripremi Solitics poziv — Checklist',
    'weeklyMap.checklists.prepareStamatis.title': 'Pripremi poziv sa Stamatisom — Checklist',

    'weeklyMap.checklists.common.useCases.title': 'USE CASES',
    'weeklyMap.checklists.common.dataIntegration.title': 'PODACI & INTEGRACIJA',
    'weeklyMap.checklists.common.decisionMaking.title': 'DONOŠENJE ODLUKA',
    'weeklyMap.checklists.common.ownershipLimits.title': 'ODGOVORNOST & GRANICE',
    'weeklyMap.checklists.common.priorities.title': 'PRIORITETI',
    'weeklyMap.checklists.common.governance.title': 'GOVERNANCE',
    'weeklyMap.checklists.common.roleAutonomy.title': 'ULOGA & AUTONOMIJA',
    'weeklyMap.checklists.common.closure.title': 'ZATVARANJE',

    'weeklyMap.checklists.common.currentStatus.title': 'TRENUTNI STATUS',
    'weeklyMap.checklists.common.strategicAlignment.title': 'STRATEŠKO USKLAĐIVANJE',
    'weeklyMap.checklists.common.ownershipModel.title': 'MODEL ODGOVORNOSTI',
    'weeklyMap.checklists.common.nextSteps.title': 'SLEDEĆI KORACI',

    'weeklyMap.checklists.prepareSolitics.useCases.item1':
      'Koja konkretna ponašanja korisnika pokušavamo da detektujemo?',
    'weeklyMap.checklists.prepareSolitics.useCases.item2':
      'Koji scenariji zadržavanja ili churn-a su trenutno najvažniji?',
    'weeklyMap.checklists.prepareSolitics.data.item1':
      'Koji je minimalni dataset potreban da se dobije vrednost?',
    'weeklyMap.checklists.prepareSolitics.data.item2': 'Šta se može bezbedno isključiti?',
    'weeklyMap.checklists.prepareSolitics.decisions.item1':
      'Koje odluke bi Solitics trebalo aktivno da podrži?',
    'weeklyMap.checklists.prepareSolitics.decisions.item2':
      'Šta ostaje interna logika odlučivanja?',
    'weeklyMap.checklists.prepareSolitics.ownership.item1': 'Šta Solitics NE bi trebalo da radi?',
    'weeklyMap.checklists.prepareSolitics.ownership.item2': 'Kako merimo uspeh nakon 30 dana?',

    'weeklyMap.checklists.soliticsDecisionSummary.title':
      'Solitics poziv + decision summary — Beleške',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item1':
      'Pristup replici potvrđen; dodatna Skale sinhronizacija još uvek na čekanju (vlasnik + rok).',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item2':
      'Solitics onboarding/dashboard u toku — još uvek NIJE live.',
    'weeklyMap.checklists.soliticsDecisionSummary.status.item3':
      'Roman je glavna kontakt tačka za izvršenje i follow-up.',
    'weeklyMap.checklists.soliticsDecisionSummary.alignment.item1':
      'Glavna poluga: retention (segmenti + okidači), ne generična “nice-to-have” automatizacija.',
    'weeklyMap.checklists.soliticsDecisionSummary.alignment.item2':
      'Uspeh = bolji LTV / ponovljeni depoziti / trading aktivnost (krenuti sa MVP scope-om).',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item1':
      'Interno: podaci/integracija, governance, i pravila odlučivanja/segmentacije (source of truth).',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item2':
      'Marketing: izvršenje kampanja, ponude/bonusi, poruke i operativne petlje.',
    'weeklyMap.checklists.soliticsDecisionSummary.ownership.item3':
      'Solitics: motor automatizacije + dashboard-i; bez ownership-a nad core business logikom.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item1':
      'Potvrditi finalno usklađivanje sa Skale i potrebna data polja.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item2':
      'Podeliti prve segmente, KPI-jeve i očekivanja za reporting sa Solitics-om.',
    'weeklyMap.checklists.soliticsDecisionSummary.next.item3':
      'Postaviti nedeljnu kadencu sa Romanom + Marketingom da se zatvori loop.',

    'weeklyMap.checklists.prepareStamatis.priorities.item1':
      'Koji je jedini prioritet broj 1 za narednih 30–60 dana?',
    'weeklyMap.checklists.prepareStamatis.priorities.item2':
      'Šta možemo eksplicitno da de-prioritizujemo?',
    'weeklyMap.checklists.prepareStamatis.governance.item1':
      'Ko odlučuje šta ulazi ili izlazi iz roadmap-a?',
    'weeklyMap.checklists.prepareStamatis.governance.item2':
      'Šta definiše uspeh ili neuspeh inicijative?',
    'weeklyMap.checklists.prepareStamatis.autonomy.item1':
      'Koje odluke mogu da se donesu autonomno?',
    'weeklyMap.checklists.prepareStamatis.autonomy.item2': 'Kada je potrebna eskalacija?',
    'weeklyMap.checklists.prepareStamatis.closure.item1':
      'Koje konkretne odluke moraju biti donete na ovom pozivu?',
    'weeklyMap.checklists.prepareStamatis.closure.item2':
      'Koji follow-up je potreban nakon poziva?',

    // Affiliate analysis
    'affiliateAnalysis.common.thisAffiliate': 'ovaj afilijat',
    'affiliateAnalysis.common.na': 'N/A',
    'affiliateAnalysis.period.thisPeriod': 'Ovaj period',
    'affiliateAnalysis.period.previousMonth': 'prethodni mesec',

    'affiliateAnalysis.badge.healthy': 'Zdravo',
    'affiliateAnalysis.badge.watch': 'Pratiti',
    'affiliateAnalysis.badge.atRisk': 'Rizično',
    'affiliateAnalysis.badgeWithProfit': '{label} · Profit {value}',

    'affiliateAnalysis.topAffiliates.title': 'Top 10 afilijata (po profitu)',
    'affiliateAnalysis.topAffiliates.subtitle': 'Izaberi afilijata da vidiš analizu',
    'affiliateAnalysis.topAffiliates.profit': 'Profit {value}',
    'affiliateAnalysis.topAffiliates.cohortYes': 'Kohorta ✓',
    'affiliateAnalysis.topAffiliates.cohortNo': 'Nema kohorte',

    'affiliateAnalysis.button.backToTopAffiliates': '← Nazad na Top Afilijate',

    'affiliateAnalysis.share.button': 'Podeli izveštaj',
    'affiliateAnalysis.share.creating': 'Kreiranje…',
    'affiliateAnalysis.share.copied': 'Kopirano',
    'affiliateAnalysis.share.hint': 'Pravi javni (read-only) board link',
    'affiliateAnalysis.share.error': 'Ne mogu da napravim share link',

    'affiliateAnalysis.header.title': 'Analiza afilijata – {affiliate}',
    'affiliateAnalysis.header.subtitle': 'Pregled performansi · Period: {period}',

    'affiliateAnalysis.filters.affiliate': 'Afilijat',
    'affiliateAnalysis.filters.selectAffiliate': 'Izaberi afilijata…',

    'affiliateAnalysis.kpi.netDeposits': 'Neto depoziti',
    'affiliateAnalysis.kpi.pl': 'P/L',
    'affiliateAnalysis.kpi.profit': 'Profit',
    'affiliateAnalysis.kpi.roi': 'ROI',
    'affiliateAnalysis.kpi.payments': 'Isplate',
    'affiliateAnalysis.kpi.ftdPerReg': 'FTD / Reg',

    'affiliateAnalysis.kpiHelper.totalPnL': 'Ukupni P&L',
    'affiliateAnalysis.kpiHelper.plMinusPayments': 'P/L − isplate',
    'affiliateAnalysis.kpiHelper.profitDivPayments': 'Profit / isplate',
    'affiliateAnalysis.kpiHelper.commissionPayouts': 'Provizija / payout',
    'affiliateAnalysis.kpiHelper.firstDepositsVsRegistrations': 'Prvi depoziti vs registracije',

    'affiliateAnalysis.sections.financialMetrics.title': 'Finansijske metrike',
    'affiliateAnalysis.sections.financialMetrics.subtitle': 'Snapshot efikasnosti',
    'affiliateAnalysis.sections.allKeyMetrics.title': 'Sve ključne metrike za ovog afilijata',
    'affiliateAnalysis.sections.allKeyMetrics.subtitle': 'Kompletan KPI snapshot za ovog afilijata',
    'affiliateAnalysis.sections.monthlyTrends.title': 'Mesečni trendovi',
    'affiliateAnalysis.sections.monthlyTrends.subtitle': 'Neto depoziti, P/L, Profit',

    'affiliateAnalysis.financial.paybackVsDeposits': 'Payback vs depoziti',
    'affiliateAnalysis.financial.payoutRatio': 'Payout odnos',
    'affiliateAnalysis.financial.plPerFtd': 'P/L po FTD',
    'affiliateAnalysis.financial.profitPerUser': 'Profit po korisniku',
    'affiliateAnalysis.financial.helper.profitDivNetDeposits': 'Profit / neto depoziti',
    'affiliateAnalysis.financial.helper.paymentsDivNetDeposits': 'Isplate / neto depoziti',
    'affiliateAnalysis.financial.helper.plDivFtd': 'P/L / FTD',
    'affiliateAnalysis.financial.helper.profitDivUsers': 'Profit / korisnici',

    'affiliateAnalysis.chart.netDeposits': 'Neto depoziti',
    'affiliateAnalysis.chart.pl': 'P/L',
    'affiliateAnalysis.chart.profit': 'Profit',

    'affiliateAnalysis.empty.selectAffiliate': 'Izaberi afilijata da vidiš analizu',

    'affiliateAnalysis.cohort.monthLabel': 'Mesec {index}',

    'affiliateAnalysis.metrics.cpa': 'CPA',
    'affiliateAnalysis.metrics.arpu': 'ARPU',
    'affiliateAnalysis.metrics.ltvPerUser': 'LTV / korisnik',
    'affiliateAnalysis.metrics.profitMargin': 'Profitna marža',
    'affiliateAnalysis.metrics.churnPct': 'Churn %',
    'affiliateAnalysis.metrics.conversionRate': 'Stopa konverzije',
    'affiliateAnalysis.metrics.ftdRatio': 'FTD odnos',
    'affiliateAnalysis.metrics.qftdRatio': 'QFTD odnos',
    'affiliateAnalysis.metrics.withdrawals': 'Isplate (withdrawals)',
    'affiliateAnalysis.metrics.bestMonth': 'Najbolji mesec',
    'affiliateAnalysis.metrics.worstMonth': 'Najgori mesec',
    'affiliateAnalysis.metrics.helper.paymentsDivFtd': 'Isplate / FTD',
    'affiliateAnalysis.metrics.helper.plDivRegistrations': 'P/L / registracije',
    'affiliateAnalysis.metrics.helper.plDivUsers': 'P/L / korisnici',
    'affiliateAnalysis.metrics.helper.profitVsPl': 'Profit vs P/L',
    'affiliateAnalysis.metrics.helper.weightedChurnPct': 'Ponderisan churn %',
    'affiliateAnalysis.metrics.helper.registrationsDivVisitors': 'Registracije / posetioci',
    'affiliateAnalysis.metrics.helper.ftdDivRegistrations': 'FTD / registracije',
    'affiliateAnalysis.metrics.helper.qftdDivFtd': 'QFTD / FTD',
    'affiliateAnalysis.metrics.helper.totalWithdrawals': 'Ukupno withdrawals',
    'affiliateAnalysis.metrics.helper.byProfit': 'Po profitu',

    'affiliateAnalysis.engine.empty.title': 'Analysis Engine — Automatski uvidi',
    'affiliateAnalysis.engine.empty.subtitle': 'Deterministički uvidi iz KPI-ja',
    'affiliateAnalysis.engine.empty.body':
      'Izaberi afilijata i vremenski prozor da generišeš uvide.',

    'affiliateAnalysis.engine.sections.riskSignals': '📉 Signali rizika',
    'affiliateAnalysis.engine.sections.upsideOpportunities': '🎯 Prilike za rast',
    'affiliateAnalysis.engine.sections.currentOutlook': '🧭 Trenutni outlook',

    'affiliateAnalysis.engine.profitTrend.subtitle':
      'Trenutno vs prethodni mesec: {current} vs {previous}',

    'affiliateAnalysis.engine.cohort.notReached': 'Nije dostignuto',
    'affiliateAnalysis.engine.cohort.notAvailable': 'Kohorta nije dostupna',
    'affiliateAnalysis.engine.cohort.monthsValue': '{value} meseci',
    'affiliateAnalysis.engine.cohort.helper.avgTimeToNetProfit':
      'Prosečno vreme do neto profita (Top 10 Cohort PL)',
    'affiliateAnalysis.engine.cohort.helper.noData':
      'Top 10 Cohort PL izveštaj nema podatke za ovog afilijata',

    'affiliateAnalysis.engine.title': 'Outlook performansi afilijata — {affiliate}',
    'affiliateAnalysis.engine.subtitle': 'Signali za {period}',

    'affiliateAnalysis.engine.kpi.periodProfit': 'Profit perioda',
    'affiliateAnalysis.engine.kpi.roi': 'ROI',
    'affiliateAnalysis.engine.kpi.profitTrendLatestMonth': 'Trend profita (poslednji mesec)',
    'affiliateAnalysis.engine.kpi.cohortBreakEven': 'Kohorta break-even',
    'affiliateAnalysis.engine.kpiHelper.profitDivPayments': 'Profit / isplate',

    'affiliateAnalysis.engine.headings.performanceRecap': 'Pregled performansi',
    'affiliateAnalysis.engine.headings.narrativeSignals': 'Narativni signali',
    'affiliateAnalysis.engine.headings.recommendedActions': 'Preporučene akcije',
    'affiliateAnalysis.engine.recommendedActions.nextSteps': 'Sledeći koraci',

    // Affiliate payments 2.0
    'affiliatePayments2.loader.data': 'Učitavanje podataka o isplatama…',

    // Investments (legacy)
    'investmentsLegacy.subtitle.commissionsFilter':
      'Provizije iz commissions.csv (filtriranje po mesecu i afilijatu).',

    // Fraud
    'fraud.loader.commissions': 'Učitavanje provizija…',
    'fraud.filters.search.placeholder': 'Pretraga: ime / affiliate / tekst',
    'fraud.filters.severity.all': 'Sve ozbiljnosti',
    'fraud.filters.severity.critical': 'Kritično',
    'fraud.filters.severity.high': 'Visoko',
    'fraud.filters.severity.medium': 'Srednje',
    'fraud.filters.severity.low': 'Nisko',
    'fraud.filters.affiliateId.placeholder': 'Affiliate id',
    'fraud.filters.groupByNameCountry': 'Grupiši po ime+država',
    'fraud.filters.minCount': 'Min. broj',
    'fraud.chart.aria.platformGrowthCumulative': 'Kumulativni grafikon rasta platforme',
    'fraud.loader.dashboardData': 'Učitavanje podataka za dashboard…',

    // Dashboard
    'dashboard.monthLabel': 'Mesec {index}',

    'dashboard.kpiCards.retainedM1': 'Zadržano Mesec 1',
    'dashboard.kpiCards.retainedM3': 'Zadržano Mesec 3',
    'dashboard.kpiCards.retainedM6': 'Zadržano Mesec 6',
    'dashboard.kpiCards.health': 'Zdravlje kohorte',
    'dashboard.kpiCards.retained.helper': 'Primarna metrika: zadržano {metric} vs Mesec 0',
    'dashboard.kpiCards.health.helper': 'Pravila: zadržavanje, half-life, lifetime',

    'dashboard.health.noData': 'Nema podataka',
    'dashboard.health.green': 'Zeleno',
    'dashboard.health.orange': 'Narandžasto',
    'dashboard.health.red': 'Crveno',

    'dashboard.cohortHealth.title': 'Zdravlje kohorte',
    'dashboard.cohortHealth.whyLabel': 'Zašto',
    'dashboard.cohortHealth.meaningLabel': 'Značenje',
    'dashboard.cohortHealth.nextCheckLabel': 'Sledeća provera',
    'dashboard.cohortHealth.noData': 'Nema cohort podataka za ovaj izbor.',
    'dashboard.cohortHealth.interpretationUnavailable': 'Tumačenje nije dostupno.',
    'dashboard.cohortHealth.recheckFallback': 'Ponovo proveri zadržano M1 i M3.',
    'dashboard.cohortHealth.why.noData': 'Nema cohort podataka za ovaj izbor.',
    'dashboard.cohortHealth.why.green': 'Vrednost ostaje jaka i nakon Meseca 0.',
    'dashboard.cohortHealth.why.early': 'Većina vrednosti se generiše u Mesecu 0.',
    'dashboard.cohortHealth.why.r1Low': 'Vrednost naglo opada nakon Meseca 0.',
    'dashboard.cohortHealth.why.r3Low': 'Vrednost brzo opada do Meseca 3.',
    'dashboard.cohortHealth.why.default': 'Vrednost opada nakon Meseca 0.',
    'dashboard.cohortHealth.meaning.noData': 'Nema dovoljno podataka za procenu zdravlja kohorte.',
    'dashboard.cohortHealth.meaning.green':
      'Ponavljajuća aktivnost održava vrednost kroz više meseci.',
    'dashboard.cohortHealth.meaning.orange': 'Postoji ponovljena aktivnost, ali slabi vremenom.',
    'dashboard.cohortHealth.meaning.red':
      'Biznis zavisi od aktivnosti u prvom mesecu i slabog ponavljanja.',
    'dashboard.cohortHealth.nextCheck.noData':
      'Sačekaj još meseci aktivnosti i ponovo proveri zadržano M1/M3.',
    'dashboard.cohortHealth.nextCheck.default':
      'Nakon retention akcija, fokusiraj se na poboljšanje zadržanog M1 i M3.',
    'dashboard.cohortHealth.valueConcentration':
      'Koncentracija vrednosti: {pct}% ukupne vrednosti u Mesecu 0',
    'dashboard.cohortHealth.halfLife.label': 'Ekonomski half-life',
    'dashboard.cohortHealth.halfLife.notReached': 'nije dostignuto (zadržano ostaje iznad 50%)',
    'dashboard.cohortHealth.halfLife.reached': '~{months} {unit} (zadržano pada ispod 50%)',
    'dashboard.cohortHealth.lifetime.label': 'Ekonomski lifetime',
    'dashboard.cohortHealth.lifetime.notReached': 'nije dostignuto (zadržano ostaje iznad 10%)',
    'dashboard.cohortHealth.lifetime.reached': '~{months} {unit} (zadržano pada ispod 10%)',

    'dashboard.monthlyAggregates.title': 'Mesečni agregati',
    'dashboard.monthlyAggregates.infoAria': 'Informacije o podacima',
    'dashboard.monthlyAggregates.infoText':
      '{cohortMetricLabel} i veličina kohorte dolaze iz izabranog cohort fajla; plaćene provizije se uzimaju iz Balance Report-a i dodeljuju mesecu akvizicije kohorte; P&L je agregiran po datumu prvog depozita (ista cohort logika).',
    'dashboard.monthlyAggregates.cohortLabel': 'Kohorta (FD mesec)',
    'dashboard.monthlyAggregates.cohort.all': 'Sve kohorte',
    'dashboard.monthlyAggregates.cohort.q1': 'Q1 (Jan–Mar)',
    'dashboard.monthlyAggregates.cohort.q2': 'Q2 (Apr–Jun)',
    'dashboard.monthlyAggregates.cohort.q3': 'Q3 (Jul–Sep)',
    'dashboard.monthlyAggregates.cohort.q4': 'Q4 (Okt–Dec)',
    'dashboard.monthlyAggregates.cohort.s1': 'S1 (Jan–Jun)',
    'dashboard.monthlyAggregates.cohort.s2': 'S2 (Jul–Dec)',
    'dashboard.monthlyAggregates.affiliateLabel': 'Affiliate',
    'dashboard.monthlyAggregates.affiliate.all': 'Svi u kohorti',
    'dashboard.monthlyAggregates.affiliate.noneAvailable': 'Nema dostupnih affiliate-a',
    'dashboard.monthlyAggregates.affiliate.top10Label': 'Top 10',
    'dashboard.monthlyAggregates.tableAutoFillHint':
      'Tabela se automatski popunjava sa {cohortMetricLabel} i veličinom kohorte za izbor.',

    'dashboard.loader.cohort': 'Učitavanje cohort dashboard-a…',
    'dashboard.pulse.title': 'Finansijski puls kohorte',
    'dashboard.pulse.subtitle':
      '{retainedMetricLabel} (%) pokazuje koliko {cohortMetric} iz Meseca 0 ostaje kroz vreme.',
    'dashboard.pulse.filter.metricLabel': 'Metrika',
    'dashboard.pulse.filter.calendarYearLabel': 'Kalendarska godina',
    'dashboard.pulse.filter.affiliateLabel': 'Affiliate',
    'dashboard.metric.netDeposits': 'Net deposits',
    'dashboard.metric.deposits': 'Deposits',
    'dashboard.metric.depositsCount': 'Broj depozita',
    'dashboard.metric.withdrawals': 'Withdrawals',
    'dashboard.years.all': 'Sve godine',
    'dashboard.affiliates.all': 'Svi affiliate-i',
    'dashboard.cohortKpis.title': 'KPI Kohorte',
    'dashboard.cohortKpis.infoAria': 'Info o KPI kohorte',
    'dashboard.cohortKpis.infoText':
      'Users = veličina kohorte; Active users = users*(1-churn) kumulativno; Marketing & Commissions mapirani na mesec akvizicije; Cohort cost = marketing + commissions; CPA = cost/users; LTV = P&L/users; ROI = (P&L - cost)/cost; Net dep/Commission: ako < 1.5, provizije se odlažu affiliate-u; Break-even = prvi mesec sa kum. P&L - kum. commissions >= 0.',

    'dashboard.table.metric': 'Metrika',
    'dashboard.table.total': 'Ukupno',
    'dashboard.table.breakEven': 'Break-even',

    'dashboard.cohortDb.infoAria': 'Info o Cohort DB',
    'dashboard.cohortDb.infoText':
      'Izaberite kohortu (mesec prvog depozita) i primenite je na Net deposits na dashboard-u (iz Net deposits Cohort 2025.csv). P&L prati istu logiku po datumu prvog depozita.',
    'dashboard.cohortDb.toggle.show': 'Prikaži Cohort DB',
    'dashboard.cohortDb.toggle.hide': 'Sakrij Cohort DB',
    'dashboard.cohortDb.affiliates.toggle.show': 'Prikaži detalje affiliate-a',
    'dashboard.cohortDb.affiliates.toggle.hide': 'Sakrij detalje affiliate-a',
    'dashboard.cohortDb.table.monthFd': 'FD mesec',
    'dashboard.cohortDb.table.cohortSize': 'Veličina kohorte',
    'dashboard.cohortDb.table.month0': 'Mesec 0',
    'dashboard.cohortDb.table.month1': 'Mesec 1',
    'dashboard.cohortDb.table.month2': 'Mesec 2',
    'dashboard.cohortDb.affiliates.title': 'Detalji affiliate-a (prvih 15)',
    'dashboard.cohortDb.affiliates.table.affiliate': 'Affiliate',
    'dashboard.cohortDb.affiliates.table.month': 'Mesec',
    'dashboard.cohortDb.affiliates.table.size': 'Veličina',

    'dashboard.breakEven.title': 'Break-even analiza',
    'dashboard.breakEven.infoAria': 'Info o break-even',
    'dashboard.breakEven.infoText':
      'Formula: kumulativni P&L (iz "PL Cohort Analysis.csv") minus kumulativno Commissions paid (negativno). Break-even mesec je prvi indeks gde kriva postane >= 0.',

    'dashboard.pnlTrend.title': 'P&L trend',

    'dashboard.topAffiliates.title': 'Najbolji affiliate-i',
    'dashboard.topAffiliates.none': 'Nema affiliate-a za trenutni izbor.',
    'dashboard.topAffiliates.table.rank': '#',
    'dashboard.topAffiliates.table.affiliate': 'Affiliate',
    'dashboard.topAffiliates.table.registrationsShort': 'R',
    'dashboard.topAffiliates.table.registrationsTitle': 'Registracije',
    'dashboard.topAffiliates.table.registrationsPctShort': '%R',
    'dashboard.topAffiliates.table.registrationsPctTitle': '% Registracije',
    'dashboard.topAffiliates.table.plShort': 'P',
    'dashboard.topAffiliates.table.plTitle': 'P&L',
    'dashboard.topAffiliates.table.plPctShort': '%P',
    'dashboard.topAffiliates.table.plPctTitle': '% P&L',
    'dashboard.topAffiliates.table.roiSymbol': 'ROI',
    'dashboard.topAffiliates.table.roiTitle': 'ROI',

    'dashboard.autoReport.infoAria': 'Info o auto izveštaju',
    'dashboard.autoReport.infoText':
      'Generišite kratak sažetak sada; kasnije možemo povezati OpenAI za komentare i sledeće korake.',
    'dashboard.autoReport.generate': 'Generiši lokalni izveštaj',
    'dashboard.autoReport.generating': 'Generisanje…',
    'dashboard.autoReport.clear': 'Očisti',
    'dashboard.autoReport.placeholder': 'Izveštaj će se pojaviti ovde…',

    // Upload
    'upload.title': 'Otpremanje izveštaja',
    'upload.description.line1':
      'Otpremite CSV ili XLSX i sistem će ga očistiti i ažurirati izveštaje.',
    'upload.description.line2': 'Izaberite tip izveštaja da se ne oslanjate na naziv fajla.',
    'upload.type.registrations': 'Registrations',
    'upload.type.payments': 'Payments',
    'upload.type.media': 'Media',
    'upload.type.comments': 'Comments',
    'upload.button.upload': 'Otpremi',
    'upload.button.uploading': 'Otpremanje…',
    'upload.label.selected': 'Izabrano',
    'upload.progress.upload': 'Upload',
    'upload.progress.server': 'Server',
    'upload.response.title': 'Odgovor',
    'upload.emptyDash': '—',

    'upload.status.uploadingShort': 'Otpremanje…',
    'upload.status.uploadingPrefix': 'Otpremanje',
    'upload.status.processingOnServer': 'Obrada na serveru…',
    'upload.status.done': 'Gotovo.',
    'upload.status.failed': 'Neuspešno',
    'upload.status.networkError': 'Otpremanje neuspešno (mrežna greška).',

    'upload.result.ok': 'OK',
    'upload.result.type': 'Tip',
    'upload.result.updated': 'Ažurirano',
    'upload.result.rawBackup': 'Raw backup',
    'upload.result.sanitizer': 'Sanitizer',
    'upload.result.summary': 'Sažetak',
    'upload.result.summary.existing': 'Postojeće',
    'upload.result.summary.added': 'Dodato',
    'upload.result.summary.duplicates': 'Duplikati',
    'upload.result.summary.affiliateUpdates': 'Affiliate izmene',
    'upload.result.summary.fieldUpdates': 'Izmene polja',
    'upload.result.lastLogs': 'Poslednji logovi',
    'upload.result.warningsErrors': 'Upozorenja/Greške',

    // Support
    'support.loader.tools': 'Učitavanje support alata…',
    'support.loader.results': 'Učitavanje rezultata…',
    'support.search.placeholder': 'Pretraga po imenu, user id ili MT5',
    'support.search.ariaLabel': 'Pretraga korisnika',

    'support.userCheck.title': 'Podrška — Provera korisnika',
    'support.userCheck.subtitle': 'Brza identifikacija i operativno postupanje sa korisnikom.',
    'support.userCheck.hint.instant': 'Rezultati odmah dok kucaš',
    'support.userCheck.hint.press': 'Pritisni',
    'support.userCheck.hint.toFocus': 'za fokus',
    'support.userCheck.hint.toRun': 'za pokretanje',
    'support.userCheck.badge.top': 'Top',
    'support.userCheck.deposits': '{count} depozita',
    'support.userCheck.noResults': 'Nema rezultata',

    'support.reply.fallback': 'Hvala {name} — proveravamo i javićemo se uskoro.',

    'support.details.affiliateMoves.title': 'Promene affiliate-a',
    'support.details.affiliateMoves.loading': 'Učitavanje…',
    'support.details.affiliateMoves.none': 'Nema detektovanih promena affiliate-a.',
    'support.details.affiliateMoves.more': '+{count} više',
    'support.reply.customerFallback': 'Hvala — proveravamo i javićemo se uskoro.',
    'support.reply.caseType.DATA_INCOMPLETE':
      'Hvala — proveravamo detalje naloga i uskoro ćemo vas obavestiti.',
    'support.reply.caseType.WITHDRAWAL_REQUEST':
      'Hvala — vaš zahtev za isplatu je u proveri. Potvrdićemo čim se kontrole završe.',
    'support.reply.caseType.POTENTIAL_ABUSE':
      'Hvala — potrebna je dodatna verifikacija pre nastavka. Naš tim će vas kontaktirati ako bude potrebno.',
    'support.reply.caseType.HIGH_VALUE_USER':
      'Hvala — daćemo prioritet vašem zahtevu i uskoro potvrditi sledeće korake.',
    'support.reply.caseType.NO_DEPOSIT':
      'Hvala — vaš nalog je aktivan. Ako vam treba pomoć oko depozita, možemo vas uputiti.',
    'support.reply.caseType.ACTIVE_USER':
      'Hvala — razmatramo vaš zahtev i uskoro ćemo vas obavestiti.',
    'support.reply.caseType.UNKNOWN': 'Hvala — proveravamo i javićemo se uskoro.',

    'support.decision.status.ELIGIBLE': 'Ispunjava uslove',
    'support.decision.status.NOT_ELIGIBLE': 'Ne ispunjava uslove',
    'support.decision.status.NEEDS_CONTEXT': 'Potreban kontekst',
    'support.decision.status.NEEDS_MANUAL_REVIEW': 'Potrebna ručna provera',
    'support.decision.status.APPROVED_WITH_CONDITIONS': 'Odobreno uz uslove',
    'support.decision.status.NEEDS_VERIFICATION': 'Potrebna verifikacija',
    'support.decision.status.HIGH_RISK': 'Visok rizik',
    'support.decision.status.NEEDS_PSP_CHECK': 'Potrebna PSP provera',
    'support.decision.status.STANDARD_PROCESS': 'Standardni proces',
    'support.decision.status.CRITICAL_RISK': 'Kritičan rizik',
    'support.decision.status.NEUTRAL': 'Neutralno',
    'support.decision.status.PROFITABLE': 'Profitabilno',

    'support.decision.affiliateSwitch.noAffiliate.why': 'Na ovom nalogu nije dodeljen affiliate.',
    'support.decision.affiliateSwitch.noAffiliate.action.verifyCrm':
      'Proveri CRM atribuciju affiliate-a.',
    'support.decision.affiliateSwitch.noAffiliate.action.openNewAccount':
      'Ako korisnik želi novog affiliate-a, otvori NOV nalog preko affiliate link-a.',

    'support.decision.affiliateSwitch.hasCommissions.why':
      'Nalog je već generisao affiliate provizije. Promena bi napravila problem troška/atribucije.',
    'support.decision.affiliateSwitch.hasCommissions.action.doNotSwitch':
      'NE menjaj postojeći nalog.',
    'support.decision.affiliateSwitch.hasCommissions.action.openNewAccount':
      'Ako korisnik insistira, predloži NOV nalog pod traženim affiliate link-om (može važiti minimalni depozit).',
    'support.decision.affiliateSwitch.hasCommissions.action.escalate':
      'Po potrebi eskaliraj Emanuele-u za konačno odobrenje.',

    'support.decision.affiliateSwitch.noCommissions.why':
      'Nema generisanih affiliate provizija na trenutnom nalogu. Promena nema trošak atribucije.',
    'support.decision.affiliateSwitch.noCommissions.action.proceedSwitch':
      'Nastavi sa promenom (CRM + Skale).',
    'support.decision.affiliateSwitch.noCommissions.action.confirmUpdated':
      'Potvrdi da je affiliate ažuriran dosledno u oba sistema.',

    'support.decision.accountTypeChange.highWithdrawalRatio.why':
      'Visok odnos isplata/depozita ukazuje na moguću zloupotrebu; potrebna je ručna provera pre promene tipa naloga.',
    'support.decision.accountTypeChange.highWithdrawalRatio.action.escalateRisk':
      'Eskaliraj risk timu za ručnu proveru.',
    'support.decision.accountTypeChange.highWithdrawalRatio.action.holdChange':
      'Zadrži promenu tipa naloga dok se ne dobije odobrenje.',

    'support.decision.accountTypeChange.approvedWithConditions.why':
      'Promena tipa naloga je dozvoljena uz operativne provere.',
    'support.decision.accountTypeChange.approvedWithConditions.action.requireKycPsp':
      'Zahtevaj KYC/PSP proveru pre promene tipa',
    'support.decision.accountTypeChange.approvedWithConditions.action.allowWithChecks':
      'Dozvoli promenu tipa naloga uz uslove: proveri KYC i PSP status.',

    'support.decision.bonus.hasCommissionsAndDeposits.why':
      'Nalog ima affiliate provizije i depozite — dodela bonusa zahteva verifikaciju da se izbegne dupli trošak.',
    'support.decision.bonus.hasCommissionsAndDeposits.action.verifyOwnership':
      'Proveri vlasništvo provizija i marketing dogovor pre dodele bonusa.',
    'support.decision.bonus.hasCommissionsAndDeposits.action.recordCrm':
      'Ako je odobreno, zabeleži razlog u CRM-u.',

    'support.decision.bonus.noDeposits.why':
      'Nema depozita na nalogu — bonus zahteva depozitnu aktivnost.',
    'support.decision.bonus.noDeposits.action.informFunding':
      'Informiši korisnika o opcijama depozita i minimalnim zahtevima.',

    'support.decision.bonus.highValue.why':
      'High-value korisnik ispunjava uslove za bonus, uz KYC.',
    'support.decision.bonus.highValue.action.proceedKyc':
      'Nastavi sa bonus ponudom i pokreni KYC ako nije prisutan.',

    'support.decision.bonus.standard.why': 'Korisnik ispunjava uslove za standardne promocije.',
    'support.decision.bonus.standard.action.offerStandard':
      'Ponudi standardni bonus prema katalogu promocija.',

    'support.decision.withdrawals.highRisk.why': 'Visok odnos isplata u odnosu na depozite.',
    'support.decision.withdrawals.highRisk.action.holdInvestigate': 'Zadrži i istraži.',
    'support.decision.withdrawals.highRisk.action.checkPspKyc':
      'Proveri PSP/KYC, trading aktivnost i metode plaćanja.',

    'support.decision.withdrawals.needsPspCheck.why':
      'Detektovane isplate — proveri PSP i KYC pre obrade.',
    'support.decision.withdrawals.needsPspCheck.action.verifyPsp': 'Proveri PSP status.',
    'support.decision.withdrawals.needsPspCheck.action.confirmKyc': 'Potvrdi KYC.',
    'support.decision.withdrawals.needsPspCheck.action.processSla': 'Obradi prema SLA.',

    'support.decision.withdrawals.standardProcess.why': 'Nema isplata; prati standardni proces.',
    'support.decision.withdrawals.standardProcess.action.noAction': 'Nema potrebne akcije.',

    'support.decision.revenueShare.criticalRisk.why':
      'Veliki negativan P/L u odnosu na depozite ukazuje na retention/abuse rizik.',
    'support.decision.revenueShare.criticalRisk.action.reviewRetention':
      'Pregledaj retention strategiju i indikatore prevare.',
    'support.decision.revenueShare.criticalRisk.action.considerLimits':
      'Razmotri posebnu obradu ili limite.',

    'support.decision.revenueShare.profitAndWithdrawals.why':
      'Korisnik je u profitu i ima isplate — prati churn/cashout.',
    'support.decision.revenueShare.profitAndWithdrawals.action.monitor': 'Prati cashout ponašanje.',
    'support.decision.revenueShare.profitAndWithdrawals.action.ensureCompliance':
      'Obezbedi poresko/compliance izveštavanje ako je potrebno.',

    'support.decision.revenueShare.noDeposits.why': 'Nema depozita — revenue uticaj je neutralan.',
    'support.decision.revenueShare.noDeposits.action.noAction': 'Nema revenue akcija.',

    'support.decision.revenueShare.netLoss.why':
      'Korisnik je net-loss (negativan P/L), što može biti povoljno za revshare u zavisnosti od ugovora.',
    'support.decision.revenueShare.netLoss.action.reviewContract':
      'Pregledaj uslove ugovora i opcije zadržavanja.',

    'support.decision.revenueShare.noIndicators.why': 'Nema značajnih revenue indikatora.',
    'support.decision.revenueShare.noIndicators.action.noAction': 'Nema potrebne akcije.',

    'support.decision.signal.commissionsGt0': 'Provizije > 0',
    'support.decision.signal.commissionsEq0': 'Provizije = 0',
    'support.decision.signal.highWithdrawalRatio': 'Visok odnos isplata',
    'support.decision.signal.withdrawalsGt0': 'Isplate > 0',
    'support.decision.signal.highValueUser': 'High value korisnik',
    'support.decision.signal.depositsEq': 'Depoziti = {value}',
    'support.decision.signal.pl': 'P/L',
    'support.decision.signal.plEq': 'PL={value}',
    'support.decision.signal.depositsEqNoSpace': 'Depoziti={value}',
    'support.decision.signal.plPositive': 'Pozitivan P/L',
    'support.decision.signal.plNegative': 'Negativan P/L',
    'support.decision.signal.withdrawalsDetected': 'Detektovane isplate',

    // Roadmap
    'roadmap.header.title': 'Tabla mega-priča',
    'roadmap.header.subtitle': 'Strateške mega-priče sa uvidom u izvršenje.',
    'roadmap.subView.megaStories': 'Mega-priče',
    'roadmap.subView.weeklyMap': 'Nedeljna mapa',
    'roadmap.subView.weeklyMapFiltered': 'Nedeljna mapa (filtrirano)',

    'roadmap.viewMode.active': 'Aktivno',
    'roadmap.viewMode.done': 'Završeno',

    'roadmap.counter.active': '{count} aktivno',
    'roadmap.counter.blocked': '{count} blokirano',
    'roadmap.counter.done': '{count} završeno',

    'roadmap.reset.button': 'Resetuj na seed',
    'roadmap.reset.confirm': 'Ovo će prepisati lokalne izmene i vratiti seed podatke. Nastaviti?',

    'roadmap.filters.all': 'Sve',
    'roadmap.filters.megaStory': 'Mega-priča',
    'roadmap.filters.story': 'Priča',
    'roadmap.filters.department': 'Tim',
    'roadmap.filters.platformArea': 'Oblast platforme',
    'roadmap.filters.status': 'Status',

    'roadmap.status.active': 'Aktivno',
    'roadmap.status.blocked': 'Blokirano',
    'roadmap.status.done': 'Završeno',

    'roadmap.priority.high': 'Visok',
    'roadmap.priority.medium': 'Srednji',
    'roadmap.priority.low': 'Nizak',

    'roadmap.department.infrastructure': 'Infrastruktura',
    'roadmap.department.product': 'Proizvod',
    'roadmap.department.data': 'Podaci',
    'roadmap.department.compliance': 'Usklađenost',
    'roadmap.department.ux': 'UX',
    'roadmap.department.partners': 'Partneri',

    'roadmap.platformArea.trading': 'Trading',
    'roadmap.platformArea.analytics': 'Analitika',
    'roadmap.platformArea.payments': 'Isplate',
    'roadmap.platformArea.infra': 'Infra',
    'roadmap.platformArea.profile': 'Profil',
    'roadmap.platformArea.internal': 'Interno',

    'roadmap.impactType.revenue': 'Prihod',
    'roadmap.impactType.retention': 'Zadržavanje',
    'roadmap.impactType.risk_reduction': 'Smanjenje rizika',
    'roadmap.impactType.efficiency': 'Efikasnost',
    'roadmap.impactType.impact': 'Uticaj',

    'roadmap.mega.tag': 'Mega-priča',
    'roadmap.mega.totalTasks': '{count} zadataka',
    'roadmap.mega.progress.donePct': '{done} završeno ({pct}%)',
    'roadmap.mega.progress.inFlight': '{count} u toku',
    'roadmap.mega.departments': 'Timovi',
    'roadmap.mega.platform': 'Platforma',
    'roadmap.mega.lastImpact': 'Poslednji uticaj',
    'roadmap.mega.lastImpactValue': '{impactType} - {department} - {area}',
    'roadmap.mega.impact.unknownDepartment': 'tim',
    'roadmap.mega.impact.unknownArea': 'oblast',
    'roadmap.mega.noImpactYet': 'Još nema zabeleženog uticaja',
    'roadmap.mega.focusLabel': 'Mega-priča',

    'roadmap.feed.items': '{count} stavki',

    'roadmap.story.areaTbd': 'Oblast TBD',
    'roadmap.story.deptTbd': 'Tim TBD',
    'roadmap.story.tasksCount': '{count} zad.',

    'roadmap.task.createdAt': 'Kreirano {date}',
    'roadmap.task.completedAt': 'Završeno {date}',
    'roadmap.task.nextStep': 'Sledeći korak',
    'roadmap.task.blocker': 'Blokada',
    'roadmap.task.impact': 'Uticaj',

    'roadmap.empty.noTasksForStory': 'Nema zadataka za ovu priču sa trenutnim filterima.',
    'roadmap.empty.noStoriesForMega': 'Još nema priča mapiranih na ovu mega-priču.',
    'roadmap.empty.selectMega': 'Izaberi mega-priču za pregled.',

    'roadmap.details.title': 'Detalji',
    'roadmap.details.panelTitle': 'Panel detalja',
    'roadmap.details.selectTask': 'Izaberi zadatak za detalje.',
    'roadmap.details.storyFocus': 'Fokus priče: {story}',
    'roadmap.details.objective': 'Cilj',
    'roadmap.details.dependencies': 'Zavisnosti / blokade',
    'roadmap.details.created': 'Kreirano',

    'roadmap.impact.capturedOnDone': 'Unosi se kada se označi kao završeno.',
    'roadmap.impact.kpi': 'KPI: {kpi}',
    'roadmap.impact.note': 'Napomena: {note}',
    'roadmap.impact.completedOn': 'Završeno {date}',

    'roadmap.markDone.button': 'Označi kao završeno',
    'roadmap.markDone.title': 'Označi kao završeno',
    'roadmap.markDone.impactType': 'Tip uticaja',
    'roadmap.markDone.selectImpactType': 'Izaberi tip uticaja',
    'roadmap.markDone.impactedDepartment': 'Pogođeni tim',
    'roadmap.markDone.selectDepartment': 'Izaberi tim',
    'roadmap.markDone.impactedPlatformArea': 'Pogođena oblast platforme',
    'roadmap.markDone.selectArea': 'Izaberi oblast',
    'roadmap.markDone.impactedKpi': 'Pogođeni KPI',
    'roadmap.markDone.kpiPlaceholder': 'Primer: usklađenost SLA isplata',
    'roadmap.markDone.impactNoteOptional': 'Napomena (opciono)',
    'roadmap.markDone.saveAndClose': 'Sačuvaj uticaj i zatvori',

    'roadmap.common.close': 'Zatvori',
    'roadmap.common.cancel': 'Otkaži',

    'roadmap.triage.needsTriage': 'Potrebna korekcija',
    'roadmap.triage.mappingFixesRequired': 'Potrebne korekcije mapiranja',
    'roadmap.triage.reason': 'Razlog',
    'roadmap.triage.noTasks': 'Nema zadataka za korekciju.',
    'roadmap.triage.selectMegaStory': 'Izaberi mega-priču',
    'roadmap.triage.selectStory': 'Izaberi priču',
    'roadmap.triage.saveMapping': 'Sačuvaj mapiranje',
    'roadmap.triage.noMega': 'nema mega',
    'roadmap.triage.noStory': 'nema priče',

    'roadmap.validation.unknownMegaStoryId': 'Nepoznat megaStoryId',
    'roadmap.validation.unknownStoryId': 'Nepoznat storyId',
    'roadmap.validation.storyNotUnderMega': 'storyId nije pod megaStoryId',

    // Support • User Details
    'support.details.loader.userDetails': 'Učitavanje detalja korisnika…',
    'support.details.loader.decisionEngine': 'Učitavanje decision engine-a…',
    'support.details.backToResults': 'Nazad na rezultate',
    'support.details.focusCenter.enter': 'Fokus',
    'support.details.focusCenter.exit': 'Izađi iz fokusa',
    'support.details.focusCenter.hint': 'Fokus režim (F) — sakriva bočne panele',
    'support.details.partnerProfile.label': 'Customer profile',
    'support.details.partnerProfile.hint': 'Otvori partner profil korisnika ({customerId})',
    'support.details.statusHelp.aria': 'Status: {status}. Dodirni za objašnjenje.',
    'support.details.statusHelp.default': 'Vrednost statusa dolazi iz izvornog izveštaja.',
    'support.details.statusHelp.duplicate':
      'Duplicate: zapis se pojavljuje više puta u izvornim podacima (isti korisnik/nalog).',
    'support.details.statusHelp.new':
      'New: nalog je označen kao nov / nedavno kreiran u izveštaju.',
    'support.details.statusHelp.active': 'Active: nalog je označen kao aktivan u izveštaju.',
    'support.details.statusHelp.blocked':
      'Blocked: nalog je označen kao blokiran/onemogućen u izveštaju.',
    'support.details.priority.high': 'Visok',
    'support.details.priority.medium': 'Srednji',
    'support.details.priority.normal': 'Normalan',
    'support.details.priority.unknown': 'Nepoznat',
    'support.details.statusFallback': 'Status',
    'support.details.account': 'Nalog',
    'support.details.affiliate': 'Affiliate',
    'support.details.noAffiliate': 'Nema affiliate-a',
    'support.details.affiliateNameMissing': 'Nedostaje naziv',
    'support.details.affiliateNameMismatch': 'Ne poklapa se',
    'support.details.commissions.title': 'Provizije',
    'support.details.commissions.revshare': 'Revshare',
    'support.details.commissions.cpa': 'CPA',
    'support.details.commissions.cpl': 'CPL',
    'support.details.commissions.affiliate': 'Affiliate',
    'support.details.commissions.subAffiliate': 'Sub-affiliate',
    'support.details.commissions.other': 'Ostalo',
    'support.details.userTimeline.title': 'Timeline korisnika i status',
    'support.details.userTimeline.registration': 'Registracija',
    'support.details.userTimeline.depositDate': 'Datum depozita',
    'support.details.userTimeline.qualification': 'Kvalifikacija',
    'support.details.userTimeline.notReached': 'Nije dostignuto',
    'support.details.userTimeline.daysDelta': '+{days}d',
    'support.details.financialSummary.title': 'Finansijski sažetak',
    'support.details.financialSummary.totalDeposits': 'Ukupni depoziti',
    'support.details.financialSummary.netDeposits': 'Neto depoziti',
    'support.details.financialSummary.netCashFlow': 'Neto tok gotovine',
    'support.details.financialSummary.withdrawals': 'Povlačenja',
    'support.details.financialSummary.withdrawalRatio': 'Odnos povlačenja',
    'support.details.financialSummary.depositsCount': 'Broj depozita',
    'support.details.financialSummary.firstDeposit': 'Prvi depozit',
    'support.details.tradingPerformance.title': 'Trading performanse',
    'support.details.tradingPerformance.volume': 'Volume',
    'support.details.tradingPerformance.lots': 'Lotovi',
    'support.details.tradingPerformance.spread': 'Spread',
    'support.details.tradingPerformance.positionCount': 'Broj pozicija',
    'support.details.tradingPerformance.pl': 'P/L',
    'support.details.tradingPerformance.roi': 'ROI',

    'support.activity.title': 'Activity Intelligence',
    'support.activity.metrics.ageDays': 'Starost (dani)',
    'support.activity.metrics.positions': 'Pozicije',
    'support.activity.metrics.positionsPerDay': 'Pozicija/dan',
    'support.activity.metrics.withdrawals': 'Povlačenja',
    'support.activity.metrics.withdrawalRatio': 'Odnos povlačenja',
    'support.activity.metrics.tier': 'Tier',
    'support.activity.metrics.botFlag': 'Mogući Bot (EA)',
    'support.activity.botFlag.yes': 'DA',
    'support.activity.botFlag.no': 'NE',
    'support.activity.tier.inactive': 'Neaktivan',
    'support.activity.tier.low': 'Nizak',
    'support.activity.tier.active': 'Aktivan',
    'support.activity.tier.high': 'Visok',
    'support.activity.tier.hyper': 'Hiper',
    'support.activity.tooltip.positionsPerDay':
      'Tier pragovi (pozicija/dan): Inactive=0, Low<1, Active 1–5, High 5–20, Hyper≥20. Bot alert: Age≤7 i (Positions≥200 ili Positions/day≥30).',
    'support.activity.tooltip.withdrawalRatio':
      'Pragovi odnosa povlačenja: Warn ≥70%, High ≥90%, Critical ≥105% (povlačenja > depoziti). Koristiti uz kontekst.',
    'support.activity.signals.none': 'Nema značajnih activity upozorenja.',
    'support.activity.signal.earlyHyper.title': 'Rana hiper-aktivnost',
    'support.activity.signal.earlyHyper.body':
      'Vrlo visoka frekvencija trgovanja rano u životnom ciklusu (age={ageDays}d, positions={positions}, {ppd}/dan). Mogući EA/bot ili rizično ponašanje.',
    'support.activity.signal.fundedNoTrading.title': 'Uplaćeno bez trgovanja',
    'support.activity.signal.fundedNoTrading.body':
      'Depoziti postoje ali Position Count je 0. Rizik od churn-a / potrebna aktivacija.',
    'support.activity.signal.activeHeavyLosses.title': 'Aktivan korisnik sa velikim gubicima',
    'support.activity.signal.activeHeavyLosses.body':
      'Visoka aktivnost uz snažno negativne performanse (ROI {roi}). Retention/risk signal.',
    'support.activity.signal.withdrawalHeavyLowTrading.title': 'Visoka povlačenja i malo trgovanja',
    'support.activity.signal.withdrawalHeavyLowTrading.body':
      'Povlačenja su visoka u odnosu na depozite ({ratio}) uz nisku aktivnost. Mogući abuse; proveriti PSP/KYC.',
    'support.activity.signal.withdrawalsWithoutDeposits.title': 'Povlačenja bez depozita',
    'support.activity.signal.withdrawalsWithoutDeposits.body':
      'Detektovana povlačenja ({withdrawals}) ali ukupni depoziti su 0. Moguća nedoslednost ili abuse; proveriti PSP/KYC i izvor podataka.',
    'support.activity.signal.withdrawalsExceedDeposits.title': 'Povlačenja veća od depozita',
    'support.activity.signal.withdrawalsExceedDeposits.body':
      'Odnos povlačenja je {ratio} (povlačenja veća od depozita). Visok rizik; odmah istražiti.',
    'support.activity.signal.highCashoutActive.title': 'Visok cash-out uz aktivnost',
    'support.activity.signal.highCashoutActive.body':
      'Odnos povlačenja {ratio} u roku od {ageDays} dana uz aktivno trgovanje. Mogući brzi profit ili bonus abuse; proveriti kontekst.',
    'support.activity.signal.mismatchPositionsNoVolume.title': 'Neslaganje podataka',
    'support.activity.signal.mismatchPositionsNoVolume.body':
      'Position Count > 0 ali Volume/LOTS su 0. Moguća nedoslednost izveštaja/mappinga.',

    'support.userCheck.botList.title': 'Potential Bot / EA aggressive — top 50',
    'support.userCheck.botList.subtitle': 'Brza lista rangirana po intenzitetu vs starost naloga.',
    'support.userCheck.botList.ppdChip': 'P/dan',
    'support.userCheck.botList.shortcuts': 'Prečice: / fokus · Enter otvori',
    'support.userCheck.botList.positionCountBadge.tooltip':
      'Anti-regresija: izveštaj mora sadržati Position Count',
    'support.userCheck.botList.positionCountBadge.checking': 'Position Count: provera…',
    'support.userCheck.botList.positionCountBadge.ok': 'Position Count: OK',
    'support.userCheck.botList.positionCountBadge.missing': 'Position Count: nedostaje',
    'support.userCheck.botList.loading': 'Računam kandidate…',
    'support.userCheck.botList.empty': 'Nema jakih bot kandidata u trenutnom izveštaju.',
    'support.userCheck.botList.missingPositionCount.title': 'Position Count nedostaje u izveštaju',
    'support.userCheck.botList.missingPositionCount.body':
      'Ovaj Registrations Report ne sadrži pouzdan Position Count (broj pozicija). Učitaj/izvezi izveštaj koji ga sadrži da bi se omogućila lista intenziteta bot/EA.',
    'support.userCheck.botList.openHint': 'Otvori detalje trgovca',
    'support.userCheck.botList.riskScore': 'Risk score',
    'support.userCheck.botList.badge.bot': 'Bot',
    'support.userCheck.botList.badge.fill': 'Rank',
    'support.userCheck.botList.badge.botHint': 'Označeno kao potencijalni bot (pravila + skor)',
    'support.userCheck.botList.badge.fillHint':
      'Nije označeno kao bot: uključeno zbog visokog skora',
    'support.details.affiliateOverview.title': 'Pregled affiliate-a',
    'support.details.affiliateOverview.loading': 'Učitavanje affiliate podataka…',
    'support.details.affiliateOverview.compareLabel': 'Uporedi sa Affiliate ID:',
    'support.details.affiliateOverview.enterPlaceholder': 'Unesite affiliate ID...',
    'support.details.affiliateOverview.currentPrefix': 'Trenutni',
    'support.details.affiliateOverview.targetPrefix': 'Target',
    'support.details.affiliateOverview.noData': 'Nema dostupnih affiliate podataka',
    'support.details.affiliateOverview.metrics.traffic': 'Saobraćaj',
    'support.details.affiliateOverview.metrics.registrations': 'Registracije',
    'support.details.affiliateOverview.metrics.ftd': 'FTD',
    'support.details.affiliateOverview.metrics.revenue': 'Prihod',
    'support.details.affiliateOverview.metrics.ecpa': 'eCPA',
    'support.details.affiliateOverview.metrics.roi': 'ROI',
    'support.details.supportDecisions.title': 'Support Decisions Engine',
    'support.details.supportDecisions.affiliateSwitch': 'Podobnost za promenu affiliate-a',
    'support.details.supportDecisions.accountTypeChange': 'Promena tipa naloga',
    'support.details.supportDecisions.bonus': 'Podobnost za bonus/kredit',
    'support.details.supportDecisions.withdrawals': 'Postupanje za isplate/refund',
    'support.details.supportDecisions.revenueShare': 'Analiza revenue share-a',
    'support.details.decision.why': 'Zašto',
    'support.details.decision.nextActions': 'Sledeće najbolje akcije',
    'support.details.decision.signals': 'Signali odluke',
    'support.details.suggestedReply.title': 'Predložen odgovor',
    'support.details.suggestedReply.placeholder': 'Šablon support odgovora...',
    'support.details.copyToClipboard': 'Kopiraj u clipboard',
    'support.details.confirmEscalate': 'Eskalirati {accountId} na {kind}?',

    // Org Chart
    'orgChart.structure': 'Struktura',
    'orgChart.title': 'Organizaciona šema kompanije',
    'orgChart.description':
      'Hijerarhija, sloj odgovornosti i rosteri timova sa titulom, divizijom, odeljenjem, regionom i emailom po osobi.',
    'orgChart.search.placeholder': 'Pretraži po imenu i pritisni Enter',
    'orgChart.search.submit': 'Idi na tim',
    'orgChart.toc.ariaLabel': 'Sadržaj',
    'orgChart.toc.all': 'Svi',
    'orgChart.toc.management': 'Management',
    'orgChart.toc.areaLayer': 'Area Layer',
    'orgChart.toc.support': 'Support',
    'orgChart.toc.operations': 'Operations',
    'orgChart.toc.affiliation': 'Affiliation',
    'orgChart.toc.businessDev': 'Business Dev',
    'orgChart.toc.marketing': 'Marketing',
    'orgChart.toc.finance': 'Finance',
    'orgChart.toc.payments': 'Payments',
    'orgChart.toc.compliance': 'Compliance',
    'orgChart.toc.dealing': 'Dealing Desk',
    'orgChart.hierarchy.ariaLabel': 'Hijerarhija',
    'orgChart.hierarchy.title': 'Hijerarhija',
    'orgChart.hierarchy.subtitle': 'CEO / Leadership kaskadno do operativnih timova.',
    'orgChart.role.division': 'Divizija',
    'orgChart.role.dept': 'Odeljenje',
    'orgChart.role.region': 'Region',
    'orgChart.role.email': 'Email',
    'orgChart.hierarchyItem.ceo': 'CEO / Leadership',
    'orgChart.hierarchyItem.management': 'Management Team',
    'orgChart.hierarchyItem.areaLayer': 'Area Responsibility Layer',
    'orgChart.hierarchyItem.support': 'Support Team',
    'orgChart.hierarchyItem.operations': 'Operations',
    'orgChart.hierarchyItem.dealing': 'Dealing / PSP',
    'orgChart.hierarchyItem.affiliation': 'Affiliation',
    'orgChart.hierarchyItem.businessDev': 'Business Development',
    'orgChart.hierarchyItem.marketing': 'Marketing',
    'orgChart.hierarchyItem.financePayments': 'Finance & Payments',
    'orgChart.hierarchyItem.compliance': 'Compliance',
    'orgChart.sectionTitle.management-team': 'Management Team',
    'orgChart.sectionTitle.area-responsibility': 'Area Responsibility Layer',
    'orgChart.sectionTitle.support-team': 'Support Team',
    'orgChart.sectionTitle.operations': 'Operations',
    'orgChart.sectionTitle.dealing': 'Dealing Desk / PSP / Risk',
    'orgChart.sectionTitle.affiliation': 'Affiliation / Partner Management',
    'orgChart.sectionTitle.business-development': 'Business Development / Sales',
    'orgChart.sectionTitle.marketing': 'Marketing',
    'orgChart.sectionTitle.finance': 'Finance',
    'orgChart.sectionTitle.payments': 'Payments / PSP',
    'orgChart.sectionTitle.compliance': 'Compliance',
  },
}

export function translate(locale, key, params) {
  const lang = translations[locale] ? locale : 'en'
  const template = translations[lang]?.[key] ?? translations.en?.[key] ?? key

  if (!params || typeof template !== 'string') return template

  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const v = params[name]
    return v === undefined || v === null ? `{${name}}` : String(v)
  })
}
