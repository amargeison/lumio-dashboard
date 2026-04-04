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
