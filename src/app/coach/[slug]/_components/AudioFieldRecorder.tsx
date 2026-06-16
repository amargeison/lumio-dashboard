'use client'

// ─── Coach portal — Audio field-test recorder ────────────────────────────────
// A REAL recorder (browser MediaRecorder API) used as an on-court mic field-test
// aid: record → play back → download a real audio file. Deliberately NOT wired
// to any pipeline — no transcription, no AI, no upload, no Supabase. One shared
// component, mounted in the Session Planner and the Video & Audio Audio tab.
//
// Reliability mitigations for phone/on-court use:
//   • Screen Wake Lock during recording (fights iOS auto-lock suspending it).
//   • All MediaStream tracks stopped on stop AND unmount (or the phone keeps the
//     mic "live" / the orange recording dot stays on — classic leak).
//   • mime type feature-detected (Safari → mp4/aac, Chrome → webm/opus).

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
type Status = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'

// Minimal Wake Lock typing (not in all TS lib.dom versions).
type WakeLockSentinelLike = { release: () => Promise<void> }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } }

// Pick the first MediaRecorder mime the browser supports. Safari historically
// prefers mp4/aac; Chrome/Firefox webm/opus. Returns the mime + a file ext.
function pickMime(): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = [
    { mime: 'audio/mp4', ext: 'm4a' },
    { mime: 'audio/webm;codecs=opus', ext: 'webm' },
    { mime: 'audio/webm', ext: 'webm' },
    { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
  ]
  if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
    for (const c of candidates) {
      try { if (MediaRecorder.isTypeSupported(c.mime)) return c } catch { /* keep trying */ }
    }
  }
  return { mime: '', ext: 'webm' }   // let the browser choose a default container
}

const pad = (n: number) => String(n).padStart(2, '0')
const mmss = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`

export function AudioFieldRecorder({ T, accent, density, sessionLabel }: Common & { sessionLabel?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [format, setFormat] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const extRef = useRef('webm')
  const mimeRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeRef = useRef<WakeLockSentinelLike | null>(null)
  const urlRef = useRef<string | null>(null)

  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  // ── cleanup helpers ─────────────────────────────────────────────────────────
  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())   // turns the mic light OFF
    streamRef.current = null
  }
  const releaseWake = () => { wakeRef.current?.release().catch(() => {}); wakeRef.current = null }
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  // Stop everything on unmount (don't leave the mic hot if the user navigates away).
  useEffect(() => () => {
    try { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() } catch { /* ignore */ }
    clearTimer(); stopTracks(); releaseWake()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  // ── actions ─────────────────────────────────────────────────────────────────
  const start = async () => {
    setErrorMsg('')
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error'); setErrorMsg('Audio recording isn’t supported in this browser.'); return
    }
    setStatus('requesting')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      const name = (e as DOMException)?.name
      setStatus('error')
      setErrorMsg(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone permission was denied. Allow mic access in your browser settings and try again.'
          : name === 'NotFoundError'
          ? 'No microphone was found on this device.'
          : 'Couldn’t start recording. Check microphone permissions and that you’re on HTTPS.',
      )
      return
    }
    streamRef.current = stream

    const { mime, ext } = pickMime()
    mimeRef.current = mime; extRef.current = ext
    setFormat(mime || 'browser default')

    let recorder: MediaRecorder
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    } catch {
      recorder = new MediaRecorder(stream)
    }
    recorderRef.current = recorder
    chunksRef.current = []
    recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current || recorder.mimeType || 'audio/webm' })
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setAudioUrl(url)
      setStatus('recorded')
      clearTimer(); stopTracks(); releaseWake()
    }
    recorder.start()
    setStatus('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    // Best-effort screen wake lock — degrade silently if unsupported/denied.
    try {
      const nav = navigator as WakeLockNavigator
      if (nav.wakeLock) wakeRef.current = await nav.wakeLock.request('screen')
    } catch { /* ignore — the "keep screen on" note covers this */ }
  }

  const stop = () => {
    try { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() } catch { /* ignore */ }
    // onstop does the blob assembly + cleanup; guard in case it doesn't fire.
    clearTimer()
  }

  const reset = () => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    setAudioUrl(null); setSeconds(0); setErrorMsg(''); setStatus('idle')
  }

  const download = () => {
    if (!audioUrl) return
    const d = new Date()
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
    const slug = (sessionLabel || 'test').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'test'
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `lumio-session-audio_${slug}_${stamp}.${extRef.current}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // ── styles ──────────────────────────────────────────────────────────────────
  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow }
  const primaryBtn: CSSProperties = { appearance: 'none', border: 0, padding: '9px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }
  const ghostBtn: CSSProperties = { appearance: 'none', padding: '9px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }
  const bars = [0.5, 0.85, 0.4, 1, 0.6, 0.35, 0.9, 0.55, 0.75, 0.45, 1, 0.6, 0.8, 0.5, 0.7]

  return (
    <div style={card}>
      <style>{`@keyframes afrPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
        @keyframes afrWave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: accent.dim, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="mic" size={14} stroke={1.8} style={{ color: accent.hex }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Record audio{sessionLabel ? ` — ${sessionLabel}` : ''}</div>
          <div style={{ fontSize: 10.5, color: T.text3 }}>Field-test capture · record, play back &amp; download. No upload or AI.</div>
        </div>
      </div>

      {/* idle */}
      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>
            Records through this device’s mic. {wakeLockSupported ? 'The screen is kept awake while recording.' : 'Keep the screen on during recording.'}
          </div>
          <div><button onClick={start} style={primaryBtn}><Icon name="mic" size={14} stroke={2} /> Record audio</button></div>
        </div>
      )}

      {/* requesting */}
      {status === 'requesting' && (
        <div style={{ fontSize: 12, color: T.text2, marginTop: 12 }}>Requesting microphone permission…</div>
      )}

      {/* recording */}
      {status === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0464a', animation: 'afrPulse 1.1s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e0464a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recording</span>
          </div>
          <div className="tnum" style={{ fontSize: 30, fontWeight: 700, color: T.text, fontFamily: FONT_MONO, letterSpacing: '0.02em' }}>{mmss(seconds)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 34 }}>
            {bars.map((h, i) => <span key={i} style={{ width: 3, height: 30, borderRadius: 2, background: accent.hex, transformOrigin: 'center', transform: `scaleY(${h})`, animation: `afrWave ${0.7 + (i % 5) * 0.13}s ease-in-out ${i * 0.06}s infinite` }} />)}
          </div>
          <button onClick={stop} style={{ ...primaryBtn, background: '#e0464a', color: '#fff' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#fff' }} /> Stop</button>
          {!wakeLockSupported && <div style={{ fontSize: 10, color: T.text3 }}>Tip: keep the screen on so recording isn’t interrupted.</div>}
        </div>
      )}

      {/* recorded */}
      {status === 'recorded' && audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: T.text2 }}>
            <Icon name="check" size={13} stroke={2.2} style={{ color: T.good }} /> Recorded {mmss(seconds)} · format {format}
          </div>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={download} style={primaryBtn}><Icon name="cloud" size={14} stroke={1.9} /> Download recording</button>
            <button onClick={reset} style={ghostBtn}><Icon name="mic" size={14} stroke={1.8} /> Record again</button>
          </div>
        </div>
      )}

      {/* error */}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: T.bad, lineHeight: 1.5 }}>{errorMsg}</div>
          <div><button onClick={start} style={ghostBtn}><Icon name="mic" size={14} stroke={1.8} /> Try again</button></div>
        </div>
      )}
    </div>
  )
}
