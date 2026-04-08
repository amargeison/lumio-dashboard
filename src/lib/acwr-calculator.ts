// ═══════════════════════════════════════════════════════════════════════════════
// Acute:Chronic Workload Ratio calculator.
// Pure function — never throws, returns a typed result for any input.
// ═══════════════════════════════════════════════════════════════════════════════

export type ACWRRiskLevel =
  | 'Undertraining'
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Very High'

export interface ACWRResult {
  playerName: string
  acuteLoad: number
  chronicLoad: number
  acwrRatio: number
  riskLevel: ACWRRiskLevel
  flagged: boolean
}

function classify(ratio: number): ACWRRiskLevel {
  if (ratio <= 0) return 'Undertraining'
  if (ratio < 0.8) return 'Undertraining'
  if (ratio <= 1.3) return 'Low'
  if (ratio <= 1.5) return 'Moderate'
  if (ratio <= 2.0) return 'High'
  return 'Very High'
}

export function calculateACWR(
  playerName: string,
  _clubId: string,
  recentSessions: { session_date: string; training_load: number }[]
): ACWRResult {
  void _clubId
  const empty: ACWRResult = {
    playerName,
    acuteLoad: 0,
    chronicLoad: 0,
    acwrRatio: 0,
    riskLevel: 'Undertraining',
    flagged: true,
  }
  if (!Array.isArray(recentSessions) || recentSessions.length === 0) return empty

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const sevenDaysAgo = now - 7 * day
  const twentyEightDaysAgo = now - 28 * day

  let acuteLoad = 0
  let chronicSum = 0
  let chronicCount = 0

  for (const s of recentSessions) {
    const t = new Date(s.session_date).getTime()
    if (!Number.isFinite(t)) continue
    const load = Number(s.training_load) || 0
    if (t >= twentyEightDaysAgo) {
      chronicSum += load
      chronicCount += 1
      if (t >= sevenDaysAgo) acuteLoad += load
    }
  }

  if (chronicCount === 0) return empty

  const chronicLoad = chronicSum / chronicCount
  const acwrRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0
  const riskLevel = classify(acwrRatio)
  const flagged = riskLevel !== 'Low'

  return {
    playerName,
    acuteLoad: Math.round(acuteLoad * 100) / 100,
    chronicLoad: Math.round(chronicLoad * 100) / 100,
    acwrRatio: Math.round(acwrRatio * 100) / 100,
    riskLevel,
    flagged,
  }
}
