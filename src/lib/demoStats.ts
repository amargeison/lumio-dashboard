// ═══════════════════════════════════════════════════════════════════════════════
// CENTRAL DEMO STATS — single source of truth for all department pages
// Import { DEMO_STATS } or use getDemoStat() for localStorage-backed overrides
// ═══════════════════════════════════════════════════════════════════════════════

export const DEMO_STATS = {
  // COMPANY
  companyName: 'Lumio Dev',

  // PEOPLE / HR
  totalEmployees: 187,
  activeOnboardings: 8,
  leaveRequestsPending: 14,
  overdueReviews: 3,
  openRoles: 2,
  staffWellbeingScore: 7.4,

  // FINANCE / ACCOUNTS
  monthlyMRR: 41999,
  mrrFormatted: '£41,999',
  mrrGrowth: '+12%',
  totalARR: 503988,
  arrFormatted: '£503,988',
  cashPosition: 284000,
  cashFormatted: '£284,000',
  outstandingInvoices: 14,
  outstandingValue: 48200,
  runwayMonths: 18,
  grossMargin: 77,

  // CUSTOMERS / SUCCESS
  totalCustomers: 173,
  healthyCustomers: 132,
  atRiskCustomers: 29,
  criticalCustomers: 10,
  churnRate: 2.1,
  npsScore: 67,
  csatScore: 4.6,
  avgOnboardingDays: 14,

  // SALES
  openDeals: 34,
  pipelineValue: 2400000,
  pipelineFormatted: '£2.4M',
  winRate: 23,
  avgDealSize: 17800,
  avgDealFormatted: '£17,800',
  dealsClosingThisWeek: 2,

  // OPERATIONS / WORKFLOWS
  activeWorkflows: 44,
  workflowRuns30d: 1844,
  systemUptime: 99.8,
  automationHoursSaved: 47,

  // MARKETING
  websiteTrafficGrowth: 34,
  emailOpenRate: 42,
  conversionRate: 3.2,
  activeLeads: 89,
  newLeadsThisMonth: 34,

  // SUPPORT
  openTickets: 23,
  avgFirstResponseHrs: 1.8,
  slaCompliance: 91,
  ticketsResolvedToday: 8,

  // TRIALS
  activeTrialAccounts: 12,
  trialsConvertedThisMonth: 4,
  trialToConversionRate: 34,
  trialsExpiringSoon: 3,

  // PARTNERS
  activePartners: 5,
  partnerPipelineValue: 847000,
  partnerPipelineFormatted: '£847k',
  topPartnerWinRate: 68,

  // IT
  openITTickets: 7,
  licencesManaged: 89,
  securityScore: 94,
  devicesManaged: 94,
} as const

export type DemoStatKey = keyof typeof DEMO_STATS

export function formatCurrency(n: number): string {
  if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `£${(n / 1000).toFixed(0)}k`
  return `£${n.toLocaleString()}`
}

export function getDemoStat<K extends DemoStatKey>(key: K): (typeof DEMO_STATS)[K] {
  try {
    if (typeof window === 'undefined') return DEMO_STATS[key]
    const overrides = JSON.parse(localStorage.getItem('lumio_demo_stats') || '{}')
    return key in overrides ? overrides[key] : DEMO_STATS[key]
  } catch {
    return DEMO_STATS[key]
  }
}

export function setDemoStat(key: DemoStatKey, value: number | string): void {
  try {
    const overrides = JSON.parse(localStorage.getItem('lumio_demo_stats') || '{}')
    overrides[key] = value
    localStorage.setItem('lumio_demo_stats', JSON.stringify(overrides))
    window.dispatchEvent(new CustomEvent('lumio-stat-changed', { detail: { key, value } }))
  } catch {}
}

export function resetDemoStats(): void {
  try {
    localStorage.removeItem('lumio_demo_stats')
    window.dispatchEvent(new CustomEvent('lumio-stats-reset'))
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS_DEMO — structured demo data for department insights and notifications
// ═══════════════════════════════════════════════════════════════════════════════

export const BUSINESS_DEMO = {
  company: {
    name: 'Lumio Dev',
    slug: 'lumio-dev',
    industry: 'SaaS / Technology',
    founded: 2021,
    size: '10-50 employees',
    hq: 'London, UK',
    website: 'lumiocms.com',
  },

  stats: {
    meetings: 4,
    tasks: 7,
    urgent: 2,
    emails: 12,
    revenue: DEMO_STATS.cashPosition,
    revenueTarget: 320000,
    mrr: DEMO_STATS.monthlyMRR,
    mrrGrowth: 12,
    customers: DEMO_STATS.totalCustomers,
    churnRisk: DEMO_STATS.criticalCustomers,
    nps: DEMO_STATS.npsScore,
    leads: 24,
    hotLeads: 4,
    trialConversions: DEMO_STATS.trialsConvertedThisMonth,
    openTickets: DEMO_STATS.openTickets,
    avgResponseTime: '2.4h',
    csat: 94,
  },

  departments: {
    hr: {
      headcount: DEMO_STATS.totalEmployees,
      openRoles: DEMO_STATS.openRoles,
      onboardingActive: DEMO_STATS.activeOnboardings,
      leaveRequestsPending: DEMO_STATS.leaveRequestsPending,
      expensesPending: 6,
      performanceReviewsDue: DEMO_STATS.overdueReviews,
      trainingCompleted: 78,
      absenceToday: 1,
    },
    sales: {
      pipeline: DEMO_STATS.pipelineValue,
      hotLeads: 4,
      meetingsBooked: 12,
      proposalsSent: 7,
      closedThisMonth: 3,
      conversionRate: 12,
      avgDealSize: DEMO_STATS.avgDealSize,
      forecastQ2: 96000,
    },
    finance: {
      mrr: DEMO_STATS.monthlyMRR,
      arr: DEMO_STATS.totalARR,
      cashRunway: DEMO_STATS.runwayMonths,
      burnRate: 42000,
      invoicesPending: DEMO_STATS.outstandingInvoices,
      expensesAwaitingApproval: 6,
      budgetUsed: 67,
      revenueVsForecast: 89,
    },
    marketing: {
      leadsThisMonth: DEMO_STATS.newLeadsThisMonth,
      websiteVisitors: 3840,
      conversionRate: DEMO_STATS.conversionRate,
      emailOpenRate: DEMO_STATS.emailOpenRate,
      campaignsActive: 3,
      contentPiecesPublished: 7,
      socialFollowers: 2840,
      paidAdSpend: 3200,
    },
    support: {
      openTickets: DEMO_STATS.openTickets,
      avgResponseTime: '2.4h',
      csat: 94,
      ticketsResolvedToday: DEMO_STATS.ticketsResolvedToday,
      escalations: 1,
      slaBreaches: 0,
      knowledgeBaseArticles: 84,
    },
    success: {
      customers: DEMO_STATS.totalCustomers,
      churnRisk: DEMO_STATS.criticalCustomers,
      healthScoreAvg: 72,
      nps: DEMO_STATS.npsScore,
      qbrsDue: 4,
      onboardingActive: 5,
      expansionOpportunities: 3,
    },
    operations: {
      projectsActive: 8,
      tasksOverdue: 3,
      processesDocumented: 67,
      vendorContracts: 12,
      complianceChecks: 2,
      systemUptime: DEMO_STATS.systemUptime,
    },
    it: {
      openTickets: DEMO_STATS.openITTickets,
      systemUptime: DEMO_STATS.systemUptime,
      securityAlerts: 0,
      devicesManaged: DEMO_STATS.devicesManaged,
      softwareLicences: DEMO_STATS.licencesManaged,
      backupStatus: 'healthy',
    },
    trials: {
      activeTrials: DEMO_STATS.activeTrialAccounts,
      trialConversions: DEMO_STATS.trialsConvertedThisMonth,
      avgTrialLength: 12,
      trialChurn: 4,
      demoBooked: 6,
      trialHealthAvg: 64,
    },
    accounts: {
      invoicesPending: DEMO_STATS.outstandingInvoices,
      overdue: 2,
      mrr: DEMO_STATS.monthlyMRR,
      churnedThisMonth: 1,
      expansionRevenue: 4200,
      refundRequests: 0,
    },
  },

  notifications: [
    { id: 1, type: 'urgent', icon: '🔴', title: 'Churn risk — Bramble Hill', body: 'Health score dropped to 28 — intervention needed today', time: '12 mins ago', unread: true, dept: 'success' },
    { id: 2, type: 'alert', icon: '💰', title: 'Invoice overdue — TechCorp', body: '£4,200 — 14 days overdue', time: '28 mins ago', unread: true, dept: 'finance' },
    { id: 3, type: 'info', icon: '🎯', title: '4 hot leads scored 80+', body: 'SA-02 flagged — two visited pricing twice', time: '45 mins ago', unread: true, dept: 'sales' },
    { id: 4, type: 'info', icon: '📋', title: 'Expense claim pending', body: '6 claims awaiting finance approval', time: '1 hr ago', unread: true, dept: 'hr' },
    { id: 5, type: 'alert', icon: '🎫', title: 'SLA at risk — ticket #1847', body: 'Response due in 23 mins — unassigned', time: '1 hr ago', unread: true, dept: 'support' },
    { id: 6, type: 'info', icon: '📊', title: 'Trial health low', body: '4 trials below 50% health score this week', time: '2 hrs ago', unread: true, dept: 'trials' },
    { id: 7, type: 'info', icon: '📅', title: 'QBR due this week', body: '4 customers due quarterly business review', time: '2 hrs ago', unread: false, dept: 'success' },
    { id: 8, type: 'info', icon: '📝', title: 'Proposal sent — Greenfield', body: 'Opened 3 times — follow up recommended', time: '3 hrs ago', unread: false, dept: 'sales' },
    { id: 9, type: 'info', icon: '👥', title: 'New hire starts Monday', body: 'Sarah Chen — onboarding checklist ready', time: '3 hrs ago', unread: false, dept: 'hr' },
    { id: 10, type: 'info', icon: '🚀', title: 'Trial converted', body: 'Apex Digital upgraded to Business plan', time: 'Yesterday', unread: false, dept: 'trials' },
  ],
} as const
