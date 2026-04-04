import type { CRMDeal, CRMActivity } from './types'

export function calculateARIAScore(deal: CRMDeal, activities: CRMActivity[]): number {
  const engagement = calculateEngagementScore(activities)
  const stakeholder = deal.stakeholder_score || 50
  const momentum = calculateMomentumScore(deal.days_in_stage)
  const risk = calculateRiskScore(deal, activities)

  // Weighted average
  const score = Math.round(
    engagement * 0.35 +
    stakeholder * 0.20 +
    momentum * 0.25 +
    (100 - risk) * 0.20
  )
  return Math.max(0, Math.min(100, score))
}

function calculateEngagementScore(activities: CRMActivity[]): number {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const recentActivities = activities.filter(
    a => new Date(a.created_at) >= twoWeeksAgo && ['call', 'email', 'meeting'].includes(a.type)
  )
  // 0 activities = 10, 1 = 30, 2 = 50, 3 = 70, 4 = 85, 5+ = 95
  const counts = [10, 30, 50, 70, 85, 95]
  return counts[Math.min(recentActivities.length, 5)]
}

function calculateMomentumScore(daysInStage: number): number {
  if (daysInStage <= 3) return 95
  if (daysInStage <= 7) return 80
  if (daysInStage <= 14) return 65
  if (daysInStage <= 21) return 45
  if (daysInStage <= 30) return 25
  return 10
}

function calculateRiskScore(deal: CRMDeal, activities: CRMActivity[]): number {
  let risk = 0
  if (deal.days_in_stage > 25) risk += 30
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const hasRecentActivity = activities.some(a => new Date(a.created_at) >= twoWeeksAgo)
  if (!hasRecentActivity) risk += 30
  // Additional risk from score fields on deal
  risk += Math.max(0, deal.risk_score || 0)
  return Math.min(100, risk)
}

export function isGhostDeal(deal: CRMDeal, activities: CRMActivity[]): boolean {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const hasRecentActivity = activities.some(a => new Date(a.created_at) >= twoWeeksAgo)
  if (deal.days_in_stage > 25 && !hasRecentActivity) return true
  if (deal.aria_score < 40) return true
  return false
}
