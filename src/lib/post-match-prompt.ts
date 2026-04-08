// Shared prompt + parser for post-match report generation.
// Imported by /api/ai/post-match and /api/football/match-reports.

export const POST_MATCH_SYSTEM_PROMPT =
  'You are a professional football journalist and analyst who writes authoritative, engaging post-match reports for football clubs. ' +
  'Your reports are used for board communications, media releases, and club archives. Write in a professional but engaging tone. ' +
  'Always respond with valid JSON only — no preamble, no markdown.'

export function buildPostMatchUserPrompt(b: any): string {
  const arr = (a: unknown) => (Array.isArray(a) && a.length > 0 ? (a as string[]).join(', ') : 'none')
  return `Generate a comprehensive post-match report for ${b.clubName}.

Match details:
- Competition: ${b.competition}
- Opponent: ${b.opponent}
- Venue: ${b.venue}
- Result: ${b.clubName} ${b.ourScore} - ${b.opponentScore} ${b.opponent}
- Our formation: ${b.ourFormation}
- Opponent formation: ${b.opponentFormation ?? 'unknown'}
- Scorers: ${arr(b.scorers)}
- Assists: ${arr(b.assisters)}
- Yellow cards: ${arr(b.yellowCards)}
- Red cards: ${arr(b.redCards)}
- In-match injuries: ${arr(b.injuriesDuringMatch)}
- Man of the match: ${b.manOfTheMatch ?? 'not decided'}
- Attendance: ${b.attendanceNumber ?? 'not recorded'}
- Current league position: ${b.leaguePosition ?? 'unknown'}

Return a JSON object with exactly this structure:
{
  "headline": string (punchy match headline, max 10 words),
  "result": "Win" | "Draw" | "Loss",
  "matchSummary": string (3-4 sentence overview),
  "firstHalfSummary": string (2-3 sentences),
  "secondHalfSummary": string (2-3 sentences),
  "keyMoments": [
    { "minute": number, "type": "Goal" | "Red Card" | "Yellow Card" | "Injury" | "Substitution" | "Save" | "Chance", "description": string, "player": string }
  ] (4-6 moments),
  "playerRatings": [
    { "name": string, "position": string, "rating": number (1-10), "comment": string }
  ] (5 standout players),
  "manOfTheMatch": { "name": string, "rating": number, "reason": string (2 sentences) },
  "tacticalAnalysis": string (2-3 sentences),
  "managerQuote": string (1-2 sentences in quotes, plausible but fabricated),
  "lookingAhead": string (1-2 sentences),
  "performanceRating": number (1-10)
}

No other text.`
}

export function tryParsePostMatch(text: string): any | null {
  if (!text) return null
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch { return null }
    }
    return null
  }
}
