export interface RagBreakdown {
  engagement: number
  onboarding: number
  integrations: number
  featureAdoption: number
  total: number
  band: 'green' | 'amber' | 'red'
}

export function calculateRag(opts: {
  lastLogin?: string | null
  onboardingComplete?: boolean
  integrationsCount?: number
  departmentsUsedThisWeek?: number
}): RagBreakdown {
  let engagement = 0
  if (opts.lastLogin) {
    const daysSince = (Date.now() - new Date(opts.lastLogin).getTime()) / 86400000
    if (daysSince <= 2) engagement = 40
    else if (daysSince <= 7) engagement = 25
    else if (daysSince <= 14) engagement = 10
  }

  let onboarding = 0
  if (opts.onboardingComplete) onboarding = 20
  else if (opts.lastLogin) onboarding = 10 // started but not complete

  let integrations = 0
  const ic = opts.integrationsCount ?? 0
  if (ic >= 3) integrations = 20
  else if (ic >= 1) integrations = 10

  let featureAdoption = 0
  const du = opts.departmentsUsedThisWeek ?? 0
  if (du >= 5) featureAdoption = 20
  else if (du >= 3) featureAdoption = 12
  else if (du >= 1) featureAdoption = 5

  const total = engagement + onboarding + integrations + featureAdoption
  const band = total >= 70 ? 'green' : total >= 40 ? 'amber' : 'red'

  return { engagement, onboarding, integrations, featureAdoption, total, band }
}

export function ragColor(band: 'green' | 'amber' | 'red') {
  return { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[band]
}

export function ragBg(band: 'green' | 'amber' | 'red') {
  return { green: 'rgba(34,197,94,0.1)', amber: 'rgba(245,158,11,0.1)', red: 'rgba(239,68,68,0.1)' }[band]
}

export function ragEmoji(band: 'green' | 'amber' | 'red') {
  return { green: '🟢', amber: '🟡', red: '🔴' }[band]
}
