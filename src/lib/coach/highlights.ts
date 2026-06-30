// Server-only — V1 video highlights from a session recording.
//
// The AI already transcribes what the coach SAYS, with timestamps. A coach who
// narrates ("right, serves now… good forehand") gives us everything we need to
// cut per-shot highlight clips — no computer vision required. We scan the
// transcript segments for shot keywords, build sensible clip windows around each
// mention, then cut them out of the original video with ffmpeg.

import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import type { TranscriptSegment } from './transcribe'

const execFileP = promisify(execFile)
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'

export type ShotType = 'serve' | 'forehand' | 'backhand' | 'volley' | 'smash'
export type Mention = { shot: ShotType; t: number; confidence?: number }
export type ClipPlan = { shot: ShotType; start: number; end: number }
export type CutClip = ClipPlan & { buffer: Buffer }

// Audio cross-check: when the visual model is low-confidence (or its label
// conflicts with what the coach said), fall back to the coach's narration at
// that moment — the spoken shot name is a strong signal. Visual keeps the timing;
// narration corrects the label. If there's no visual at all, narration is used.
const FUSE_CONF = 0.65   // visual confidence below this → trust the coach's words
const FUSE_WINDOW = 4    // seconds: how close a spoken shot must be to count
export function fuseWithNarration(visual: Mention[], narration: Mention[]): Mention[] {
  if (!visual.length) return narration
  if (!narration.length) return visual
  return visual.map(v => {
    let near: Mention | null = null, bestDt = Infinity
    for (const n of narration) { const dt = Math.abs(n.t - v.t); if (dt <= FUSE_WINDOW && dt < bestDt) { near = n; bestDt = dt } }
    if (!near) return v
    // Coach named a shot here. Adopt it if the visual was unsure or disagreed;
    // otherwise keep visual but mark it confirmed by the audio.
    if ((v.confidence ?? 1) < FUSE_CONF || near.shot !== v.shot) return { shot: near.shot, t: v.t, confidence: 0.9 }
    return { ...v, confidence: 0.95 }
  })
}

const SHOT_PATTERNS: { shot: ShotType; re: RegExp }[] = [
  { shot: 'serve',    re: /\b(serve|serves|serving|service)\b/i },
  { shot: 'smash',    re: /\b(smash|smashes|overhead|overheads)\b/i },   // before volley/fore so "overhead" wins
  { shot: 'volley',   re: /\b(volley|volleys|volleying)\b/i },
  { shot: 'forehand', re: /\b(forehand|forehands|fore[- ]?hand)\b/i },
  { shot: 'backhand', re: /\b(backhand|backhands|back[- ]?hand)\b/i },
]

// Clip-window tuning (seconds). The coach usually names the shot just before or
// as the player plays it, so we centre slightly before the mention.
const PRE = 3, POST = 3, MIN_GAP = 12, MAX_CLIPS = 12, MIN_LEN = 2

// Find the first shot keyword in each segment → {shot, timestamp}.
export function parseShotMentions(segments: TranscriptSegment[]): { shot: ShotType; t: number }[] {
  const out: { shot: ShotType; t: number }[] = []
  for (const s of segments) {
    const text = s.text || ''
    for (const { shot, re } of SHOT_PATTERNS) {
      if (re.test(text)) { out.push({ shot, t: s.start }); break }
    }
  }
  return out
}

// Build clip windows: chronological, dedupe mentions closer than MIN_GAP, clamp
// to the media duration, cap the count.
export function planClips(mentions: { shot: ShotType; t: number }[], durationSeconds?: number): ClipPlan[] {
  const sorted = [...mentions].sort((a, b) => a.t - b.t)
  const dur = durationSeconds && durationSeconds > 0 ? durationSeconds : Infinity
  const clips: ClipPlan[] = []
  let lastT = -Infinity
  for (const m of sorted) {
    if (m.t - lastT < MIN_GAP) continue
    const start = Math.max(0, m.t - PRE)
    const end = Math.min(dur, m.t + POST)
    if (end - start < MIN_LEN) continue
    clips.push({ shot: m.shot, start, end })
    lastT = m.t
    if (clips.length >= MAX_CLIPS) break
  }
  return clips
}

// Cut each planned window out of the original video with ffmpeg (input-seek +
// re-encode = fast and reasonably frame-accurate for short clips).
export async function cutClips(videoBuffer: Buffer, ext: string, plan: ClipPlan[]): Promise<CutClip[]> {
  if (!plan.length) return []
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lumio-clips-'))
  const out: CutClip[] = []
  try {
    const srcPath = path.join(dir, `src.${ext || 'mp4'}`)
    await fs.writeFile(srcPath, videoBuffer)
    for (let i = 0; i < plan.length; i++) {
      const c = plan[i]
      const clipPath = path.join(dir, `clip-${i}.mp4`)
      const dur = Math.max(MIN_LEN, c.end - c.start)
      try {
        await ffmpeg(['-ss', String(c.start), '-i', srcPath, '-t', String(dur),
          '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
          '-c:a', 'aac', '-movflags', '+faststart', '-y', clipPath])
        out.push({ ...c, buffer: await fs.readFile(clipPath) })
      } catch (e) {
        console.warn('[highlights] clip cut failed', i, e)
      }
    }
    return out
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function ffmpeg(args: string[]) {
  await execFileP(FFMPEG_BIN, ['-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 64 * 1024 * 1024 })
}

export const SHOT_LABEL: Record<ShotType, string> = {
  serve: 'Serve', forehand: 'Forehand', backhand: 'Backhand', volley: 'Volley', smash: 'Smash',
}
