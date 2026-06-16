// ─── Coach portal — recordings library (Phase B) ─────────────────────────────
// One model behind both the Video and Audio tabs of Video & Audio. Video
// recordings are flattened from the existing per-session clips (gps-video-data);
// audio recordings are net-new canned records. Each can be tagged to a planner
// session; an untagged recording can be auto-matched (suggest-and-confirm) to a
// session by player + date + nearest start time. Demo only — no real files.

import { GPS_VIDEO_DATA } from './gps-video-data'
import { PLAYERS, type TodaySession } from './coach-data'
import { allKnownSessions } from './schedule'

export type Recording = {
  id: string
  playerId: string
  player: string
  date: string                 // 'YYYY-MM-DD' — capture date
  time: string                 // 'HH:MM' — capture start
  kind: 'video' | 'audio'
  durationMins: number
  sessionId?: string           // planner session id (ts…) once tagged; undefined until then
  label: string
  // video-only (mirror the VideoClip fields so the clip grid renders unchanged)
  ctx?: string
  clipTime?: string            // the clip's own length, e.g. '1:24'
  tint?: string
  // audio-only
  summary?: string             // canned one-line summary / teaser
}

const playerName = (id: string) => PLAYERS.find(p => p.id === id)?.name ?? id

// Video recordings — flattened from each player's session clips. Carry the
// player + session date so they live in the shared library. Left untagged this
// pass (video review/tagging is light; the audio flow is the Phase-B headline).
const VIDEO_SEED: Recording[] = Object.entries(GPS_VIDEO_DATA).flatMap(([pid, data]) =>
  data.sessions.flatMap((s, si) => s.clips.map((c, ci) => ({
    id: `vid-${s.id}-${ci}`,
    playerId: pid,
    player: playerName(pid),
    date: s.date,
    time: ['09:00', '10:30', '16:00', '18:00'][si % 4],
    kind: 'video' as const,
    durationMins: 1,
    label: c.label,
    ctx: c.ctx,
    clipTime: c.time,
    tint: c.tint,
  }))),
)

// Audio recordings — net-new, canned. Mix of:
//   • untagged + matches a real planner session (auto-match suggestion fires)
//   • already tagged (shows the linked session + "Run review")
//   • untagged + no matching session (manual "Tag to session" only)
const AUDIO_SEED: Recording[] = [
  { id: 'aud-mia-1',    playerId: 'p1', player: playerName('p1'), date: '2026-06-11', time: '09:05', kind: 'audio', durationMins: 44, label: 'On-court session audio', summary: 'Voice notes over the first-serve block — cues on toss height and contact point.' },
  { id: 'aud-tom-1',    playerId: 'p2', player: playerName('p2'), date: '2026-06-11', time: '10:30', kind: 'audio', durationMins: 58, label: 'On-court session audio', summary: 'Serve+1 patterns — running commentary on the inside-out forehand target.' },
  { id: 'aud-daniel-1', playerId: 'p6', player: playerName('p6'), date: '2026-06-11', time: '18:00', kind: 'audio', durationMins: 73, sessionId: 'ts6', label: 'Match-play audio', summary: 'Between-points coaching during competitive sets.' },
  { id: 'aud-ava-1',    playerId: 'p3', player: playerName('p3'), date: '2026-06-09', time: '15:00', kind: 'audio', durationMins: 41, label: 'Voice note', summary: 'Quick post-session voice memo — rally tolerance is improving, set homework.' },
  { id: 'aud-tom-2',    playerId: 'p2', player: playerName('p2'), date: '2026-06-06', time: '16:00', kind: 'audio', durationMins: 52, label: 'Voice note', summary: 'Reflection after the Saturday hit — second-serve kick needs more height.' },
]

export const RECORDINGS_SEED: Recording[] = [...AUDIO_SEED, ...VIDEO_SEED]

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Suggest-only auto-match: the closest same-player, same-date planner session
// whose start time is within tolerance of the recording's capture time. Returns
// undefined when already tagged or nothing plausible matches — never auto-tags.
const MATCH_TOLERANCE_MINS = 60
export function suggestSessionForRecording(rec: Recording, added: TodaySession[]): TodaySession | undefined {
  if (rec.sessionId) return undefined
  const candidates = allKnownSessions(added).filter(s => s.playerId === rec.playerId && s.date === rec.date)
  if (!candidates.length) return undefined
  const recMin = toMin(rec.time)
  let best: TodaySession | undefined
  let bestDiff = Infinity
  for (const s of candidates) {
    const diff = Math.abs(toMin(s.time) - recMin)
    if (diff < bestDiff) { bestDiff = diff; best = s }
  }
  return bestDiff <= MATCH_TOLERANCE_MINS ? best : undefined
}

// Manual tag candidates: every planner session for this recording's player.
export function sessionsForRecordingPlayer(rec: Recording, added: TodaySession[]): TodaySession[] {
  return allKnownSessions(added)
    .filter(s => s.playerId === rec.playerId)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
}
