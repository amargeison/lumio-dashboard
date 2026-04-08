// ═══════════════════════════════════════════════════════════════════════════════
// Club comparison engine — pure functions, never throws.
// ═══════════════════════════════════════════════════════════════════════════════

export interface ComparisonMetric {
  key: string
  label: string
  ourValue: number | null
  comparedValue: number | null
  benchmarkValue: number | null
  unit: string
  higherIsBetter: boolean
  ourRating: 'above' | 'average' | 'below' | null
  difference: number | null
  percentageDiff: number | null
}

export interface ComparisonReport {
  ourClub: string
  comparedClub: string
  season: string
  metrics: ComparisonMetric[]
  overallAdvantage: 'us' | 'them' | 'even'
  strengthAreas: string[]
  weaknessAreas: string[]
  summary: string
}

const AVG_THRESHOLD_PCT = 5

function num(v: any): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function rate(value: number | null, benchmark: number | null, higherIsBetter: boolean): 'above' | 'average' | 'below' | null {
  if (value == null || benchmark == null || benchmark === 0) return null
  const pct = ((value - benchmark) / Math.abs(benchmark)) * 100
  if (Math.abs(pct) <= AVG_THRESHOLD_PCT) return 'average'
  if (higherIsBetter) return pct > 0 ? 'above' : 'below'
  return pct > 0 ? 'below' : 'above'
}

function ppg(stats: any): number | null {
  const points = num(stats?.points)
  const played = num(stats?.played)
  if (points == null || played == null || played === 0) return null
  return Math.round((points / played) * 100) / 100
}

export function buildComparisonReport(
  ourStats: any,
  comparedStats: any,
  benchmarks: any,
  ourClubName: string
): ComparisonReport {
  try {
    const comparedName = comparedStats?.compared_team_name ?? comparedStats?.teamName ?? 'Comparison'

    const metricDefs: { key: string; label: string; ours: number | null; theirs: number | null; bench: number | null; unit: string; higherIsBetter: boolean }[] = [
      { key: 'rank', label: 'Position', ours: num(ourStats?.rank), theirs: num(comparedStats?.rank), bench: null, unit: '', higherIsBetter: false },
      { key: 'points', label: 'Points', ours: num(ourStats?.points), theirs: num(comparedStats?.points), bench: null, unit: '', higherIsBetter: true },
      { key: 'ppg', label: 'PPG', ours: ppg(ourStats), theirs: ppg(comparedStats), bench: num(benchmarks?.avg_points_per_game), unit: '', higherIsBetter: true },
      { key: 'played', label: 'Played', ours: num(ourStats?.played), theirs: num(comparedStats?.played), bench: null, unit: '', higherIsBetter: true },
      { key: 'won', label: 'Won', ours: num(ourStats?.won), theirs: num(comparedStats?.won), bench: null, unit: '', higherIsBetter: true },
      { key: 'drawn', label: 'Drawn', ours: num(ourStats?.drawn), theirs: num(comparedStats?.drawn), bench: null, unit: '', higherIsBetter: false },
      { key: 'lost', label: 'Lost', ours: num(ourStats?.lost), theirs: num(comparedStats?.lost), bench: null, unit: '', higherIsBetter: false },
      { key: 'goalsFor', label: 'Goals For', ours: num(ourStats?.goalsFor ?? ourStats?.goals_for), theirs: num(comparedStats?.goalsFor ?? comparedStats?.goals_for), bench: null, unit: '', higherIsBetter: true },
      { key: 'goalsAgainst', label: 'Goals Against', ours: num(ourStats?.goalsAgainst ?? ourStats?.goals_against), theirs: num(comparedStats?.goalsAgainst ?? comparedStats?.goals_against), bench: null, unit: '', higherIsBetter: false },
      { key: 'gd', label: 'Goal Diff', ours: num(ourStats?.gd ?? ourStats?.goal_difference), theirs: num(comparedStats?.gd ?? comparedStats?.goal_difference), bench: null, unit: '', higherIsBetter: true },
      { key: 'homeWon', label: 'Home Wins', ours: num(ourStats?.homeWon ?? ourStats?.home_won), theirs: num(comparedStats?.homeWon ?? comparedStats?.home_won), bench: null, unit: '', higherIsBetter: true },
      { key: 'awayWon', label: 'Away Wins', ours: num(ourStats?.awayWon ?? ourStats?.away_won), theirs: num(comparedStats?.awayWon ?? comparedStats?.away_won), bench: null, unit: '', higherIsBetter: true },
      { key: 'cleanSheets', label: 'Clean Sheets', ours: num(ourStats?.cleanSheets ?? ourStats?.clean_sheets), theirs: num(comparedStats?.cleanSheets ?? comparedStats?.clean_sheets), bench: null, unit: '', higherIsBetter: true },
    ]

    const metrics: ComparisonMetric[] = metricDefs.map((m) => {
      const diff = m.ours != null && m.theirs != null ? m.ours - m.theirs : null
      const pctDiff = m.ours != null && m.theirs != null && m.theirs !== 0 ? ((m.ours - m.theirs) / Math.abs(m.theirs)) * 100 : null
      return {
        key: m.key,
        label: m.label,
        ourValue: m.ours,
        comparedValue: m.theirs,
        benchmarkValue: m.bench,
        unit: m.unit,
        higherIsBetter: m.higherIsBetter,
        ourRating: rate(m.ours, m.bench, m.higherIsBetter),
        difference: diff,
        percentageDiff: pctDiff != null ? Math.round(pctDiff * 10) / 10 : null,
      }
    })

    let usWin = 0
    let themWin = 0
    const strengthAreas: string[] = []
    const weaknessAreas: string[] = []
    metrics.forEach((m) => {
      if (m.ourValue == null || m.comparedValue == null) return
      const usBetter = m.higherIsBetter ? m.ourValue > m.comparedValue : m.ourValue < m.comparedValue
      const themBetter = m.higherIsBetter ? m.ourValue < m.comparedValue : m.ourValue > m.comparedValue
      if (usBetter) { usWin++; strengthAreas.push(m.label) }
      else if (themBetter) { themWin++; weaknessAreas.push(m.label) }
    })

    const overallAdvantage: 'us' | 'them' | 'even' = usWin > themWin ? 'us' : themWin > usWin ? 'them' : 'even'
    const summary =
      overallAdvantage === 'us'
        ? `${ourClubName} leads on ${usWin} of ${metrics.length} metrics vs ${comparedName}.`
        : overallAdvantage === 'them'
          ? `${comparedName} leads on ${themWin} of ${metrics.length} metrics vs ${ourClubName}.`
          : `${ourClubName} and ${comparedName} are evenly matched.`

    return {
      ourClub: ourClubName,
      comparedClub: comparedName,
      season: String(comparedStats?.season ?? new Date().getFullYear()),
      metrics,
      overallAdvantage,
      strengthAreas,
      weaknessAreas,
      summary,
    }
  } catch (err) {
    console.error('[buildComparisonReport]', err)
    return {
      ourClub: ourClubName,
      comparedClub: 'Unknown',
      season: '',
      metrics: [],
      overallAdvantage: 'even',
      strengthAreas: [],
      weaknessAreas: [],
      summary: 'Comparison unavailable',
    }
  }
}

export function getRadarScores(stats: any, benchmarks: any): Record<string, number> {
  const empty = { Attack: 50, Defence: 50, HomeForm: 50, AwayForm: 50, Consistency: 50, Form: 50 }
  if (!stats) return empty
  try {
    const played = num(stats.played) ?? 0
    if (played === 0) return empty
    const goalsFor = num(stats.goalsFor ?? stats.goals_for) ?? 0
    const goalsAgainst = num(stats.goalsAgainst ?? stats.goals_against) ?? 0
    const homeWon = num(stats.homeWon ?? stats.home_won) ?? 0
    const awayWon = num(stats.awayWon ?? stats.away_won) ?? 0
    const drawn = num(stats.drawn) ?? 0
    const lost = num(stats.lost) ?? 0
    const form = String(stats.form ?? '').slice(-5)

    const benchGoals = num(benchmarks?.avg_goals_scored) ?? 1.4
    const benchConceded = num(benchmarks?.avg_goals_conceded) ?? 1.4
    const benchHomeWinPct = num(benchmarks?.avg_home_wins_pct) ?? 42
    const benchAwayWinPct = num(benchmarks?.avg_away_wins_pct) ?? 28

    const goalsPerGame = goalsFor / played
    const concededPerGame = goalsAgainst / played
    const halfPlayed = Math.max(1, played / 2)
    const homeWinPct = (homeWon / halfPlayed) * 100
    const awayWinPct = (awayWon / halfPlayed) * 100
    const consistency = 100 - Math.min(100, (drawn / played) * 100 + (lost / played) * 50)
    const formScore =
      (form.split('').reduce((a, c) => a + (c === 'W' ? 20 : c === 'D' ? 10 : 0), 0) / Math.max(1, form.length)) * 5

    const norm = (val: number, bench: number, cap = 100) => Math.max(0, Math.min(cap, Math.round((val / bench) * 50)))
    const invNorm = (val: number, bench: number, cap = 100) => Math.max(0, Math.min(cap, Math.round((bench / Math.max(0.1, val)) * 50)))

    return {
      Attack: norm(goalsPerGame, benchGoals),
      Defence: invNorm(concededPerGame, benchConceded),
      HomeForm: norm(homeWinPct, benchHomeWinPct),
      AwayForm: norm(awayWinPct, benchAwayWinPct),
      Consistency: Math.round(consistency),
      Form: Math.min(100, Math.round(formScore)),
    }
  } catch (err) {
    console.error('[getRadarScores]', err)
    return empty
  }
}
