// Real-time countdown helper for the match-day hero. Takes the
// kickoffISO from JUNIOR_NEXT_FIXTURE and returns hours / minutes /
// seconds remaining until kick-off. Clamps to zero once kick-off
// has passed so the hero can swap "TO KICK-OFF" → "KICK-OFF".

export function computeCountdown(kickoffISO: string): { h: number; m: number; s: number } {
  const now = Date.now()
  const target = new Date(kickoffISO).getTime()
  const diff = Math.max(0, target - now)
  const totalSeconds = Math.floor(diff / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return { h, m, s }
}
