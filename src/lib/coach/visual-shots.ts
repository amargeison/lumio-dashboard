// Server-only — Phase 1b bridge to the self-hosted Modal shot detector.
//
// When MODAL_SHOTS_URL is set, highlight generation asks Modal to detect shots
// visually (pose-based), so clips work even when the coach doesn't narrate. If
// it's not configured or the call fails, the caller falls back to the V1
// narration parser. Modal downloads the video itself from a short-lived signed
// URL, so we never ship the bytes through our server.

import type { ShotType, Mention } from './highlights'

const VALID = new Set<ShotType>(['serve', 'forehand', 'backhand', 'volley', 'smash'])

export function visualShotsConfigured(): boolean {
  return !!process.env.MODAL_SHOTS_URL
}

export async function getVisualShots(videoUrl: string, targetFps = 5): Promise<Mention[]> {
  const url = process.env.MODAL_SHOTS_URL
  if (!url) return []
  const secret = process.env.MODAL_SHOTS_SECRET || ''
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12 * 60 * 1000) // generous: detection on a long video
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl, target_fps: targetFps, secret }),
      signal: ctrl.signal,
    })
    if (!r.ok) { console.warn('[visual-shots] modal', r.status); return [] }
    const d = await r.json().catch(() => ({})) as { shots?: Array<{ shot?: string; t?: number; confidence?: number }> }
    return (Array.isArray(d.shots) ? d.shots : [])
      .filter(s => typeof s.t === 'number' && VALID.has(s.shot as ShotType))
      .map(s => ({ shot: s.shot as ShotType, t: s.t as number, confidence: typeof s.confidence === 'number' ? s.confidence : undefined }))
  } catch (e) {
    console.warn('[visual-shots] failed', e)
    return []
  } finally {
    clearTimeout(timer)
  }
}
