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
    'sidebar.affiliate': 'Affiliate',
    'sidebar.affiliate.analysis': 'Analysis',
    'sidebar.affiliate.payments': 'Payments',
    'sidebar.affiliate.payments2': 'Payments 2.0',
    'sidebar.affiliate.cohort': 'Cohort',
    'sidebar.analysis': 'Report Analysis',
    'sidebar.fraud': 'Fraud Monitoring',

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
    'common.hide': 'Hide',
    'common.all': 'All',
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
    'sidebar.affiliate': 'Affiliate',
    'sidebar.affiliate.analysis': 'Analysis',
    'sidebar.affiliate.payments': 'Pagamenti',
    'sidebar.affiliate.payments2': 'Pagamenti 2.0',
    'sidebar.affiliate.cohort': 'Cohort',
    'sidebar.analysis': 'Analisi Report',
    'sidebar.fraud': 'Monitoraggio Frodi',

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
    'common.hide': 'Nascondi',
    'common.all': 'Tutti',
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
    'sidebar.affiliate': 'Affiliate',
    'sidebar.affiliate.analysis': 'Analiza',
    'sidebar.affiliate.payments': 'Uplate',
    'sidebar.affiliate.payments2': 'Uplate 2.0',
    'sidebar.affiliate.cohort': 'Kohorta',
    'sidebar.analysis': 'Analiza Izveštaja',
    'sidebar.fraud': 'Nadzor prevara',

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
