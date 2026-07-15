'use client'

// ─── Coach portal — Media field-test recorder ────────────────────────────────
// A REAL recorder (browser MediaRecorder API) used as an on-court field-test
// aid, in two modes: Audio only (mic test) and Video + Audio (validates the
// stand/framing AND the mic in one clip, rear camera). Record → play back →
// download. Deliberately NOT wired to any pipeline — no transcription, no AI,
// no upload, no Supabase. One shared component, mounted in the Session Planner
// and both tabs of Video & Audio.
//
// Reliability mitigations for phone/on-court use:
//   • Screen Wake Lock during recording (a suspended video recording loses
//     everything).
//   • ALL MediaStream tracks (audio AND video) stopped on stop AND unmount —
//     so the camera light and mic indicator turn OFF (a left-on camera is the
//     worst leak: visible, privacy-alarming, battery).
//   • mime type feature-detected per mode (Safari → mp4, Chrome → webm).

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
type Mode = 'audio' | 'video'
type Status = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'

// Minimal Wake Lock typing (not in all TS lib.dom versions).
type WakeLockSentinelLike = { release: () => Promise<void> }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } }

// First supported MediaRecorder mime for the mode. Safari prefers mp4; Chrome/
// Firefox webm. Returns mime + file ext ('' mime → let the browser default).
function pickMime(mode: Mode): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = mode === 'video'
    ? [
        { mime: 'video/mp4', ext: 'mp4' },
        { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
        { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
        { mime: 'video/webm', ext: 'webm' },
      ]
    : [
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
  return { mime: '', ext: mode === 'video' ? 'webm' : 'webm' }
}

const pad = (n: number) => String(n).padStart(2, '0')
const mmss = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`

export function MediaFieldRecorder({ T, accent, density, sessionLabel, defaultMode = 'audio', lockMode = false }: Common & { sessionLabel?: string; defaultMode?: Mode; lockMode?: boolean }) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [format, setFormat] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const extRef = useRef('webm')
  const mimeRef = useRef('')
  const modeRef = useRef<Mode>(defaultMode)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeRef = useRef<WakeLockSentinelLike | null>(null)
  const urlRef = useRef<string | null>(null)
  const previewRef = useRef<HTMLVideoElement | null>(null)

  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  // ── cleanup helpers ─────────────────────────────────────────────────────────
  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())   // turns camera light + mic OFF
    streamRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
  }
  const releaseWake = () => { wakeRef.current?.release().catch(() => {}); wakeRef.current = null }
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  useEffect(() => () => {
    try { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() } catch { /* ignore */ }
    clearTimer(); stopTracks(); releaseWake()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  // Bind the live stream to the preview <video> once recording starts (video mode).
  useEffect(() => {
    if (status === 'recording' && modeRef.current === 'video' && previewRef.current && streamRef.current) {
      previewRef.current.srcObject = streamRef.current
      previewRef.current.play?.().catch(() => {})
    }
  }, [status])

  // ── actions ─────────────────────────────────────────────────────────────────
  const start = async () => {
    setErrorMsg('')
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error'); setErrorMsg('Recording isn’t supported in this browser.'); return
    }
    modeRef.current = mode
    setStatus('requesting')

    const constraints: MediaStreamConstraints = mode === 'video'
      ? { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true }
      : { audio: true }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (e) {
      const name = (e as DOMException)?.name
      setStatus('error')
      setErrorMsg(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? `${mode === 'video' ? 'Camera/microphone' : 'Microphone'} permission was denied. Allow access in your browser settings and try again.`
          : name === 'NotFoundError'
          ? `No ${mode === 'video' ? 'camera' : 'microphone'} was found on this device.`
          : 'Couldn’t start recording. Check permissions and that you’re on HTTPS.',
      )
      return
    }
    streamRef.current = stream

    const { mime, ext } = pickMime(mode)
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
      const blob = new Blob(chunksRef.current, { type: mimeRef.current || recorder.mimeType || (modeRef.current === 'video' ? 'video/webm' : 'audio/webm') })
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setMediaUrl(url)
      setStatus('recorded')
      clearTimer(); stopTracks(); releaseWake()
    }
    recorder.start()
    setStatus('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    try {
      const nav = navigator as WakeLockNavigator
      if (nav.wakeLock) wakeRef.current = await nav.wakeLock.request('screen')
    } catch { /* degrade silently — "keep screen on" note covers this */ }
  }

  const stop = () => {
    try { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() } catch { /* ignore */ }
    clearTimer()
  }

  const reset = () => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null }
    setMediaUrl(null); setSeconds(0); setErrorMsg(''); setStatus('idle')
  }

  const download = () => {
    if (!mediaUrl) return
    const d = new Date()
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
    const slug = (sessionLabel || 'test').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'test'
    const a = document.createElement('a')
    a.href = mediaUrl
    a.download = `lumio-session-${modeRef.current}_${slug}_${stamp}.${extRef.current}`
    document.body.appendChild(a); a.click(); a.remove()
  }

  // ── styles ──────────────────────────────────────────────────────────────────
  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow }
  const primaryBtn: CSSProperties = { appearance: 'none', border: 0, padding: '9px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }
  const ghostBtn: CSSProperties = { appearance: 'none', padding: '9px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }
  const seg = (on: boolean): CSSProperties => ({ appearance: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, display: 'inline-flex', alignItems: 'center', gap: 6 })
  const bars = [0.5, 0.85, 0.4, 1, 0.6, 0.35, 0.9, 0.55, 0.75, 0.45, 1, 0.6, 0.8, 0.5, 0.7]
  const isVideo = mode === 'video'

  return (
    <div style={card}>
      <style>{`@keyframes mfrPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
        @keyframes mfrWave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: accent.dim, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={isVideo ? 'play' : 'mic'} size={14} stroke={1.8} style={{ color: accent.hex }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Record {isVideo ? 'video + audio' : 'audio'}{sessionLabel ? ` — ${sessionLabel}` : ''}</div>
          <div style={{ fontSize: 10.5, color: T.text3 }}>Field-test capture · record, play back &amp; download. No upload or AI.</div>
        </div>
      </div>

      {/* mode toggle — only when idle (mode locks once recording). When lockMode
          is set (from a single V&A tab), only that tab's capture mode is shown. */}
      {status === 'idle' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {(lockMode ? [mode] : (['audio', 'video'] as Mode[])).map(m => (
            <button key={m} onClick={() => { if (!lockMode) setMode(m) }} style={seg(mode === m)}>
              <Icon name={m === 'audio' ? 'mic' : 'play'} size={12} stroke={1.9} /> {m === 'audio' ? 'Audio' : 'Video + Audio'}
            </button>
          ))}
        </div>
      )}

      {/* idle */}
      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>
            {isVideo
              ? `Records the rear camera (points at the court) + mic. ${wakeLockSupported ? 'The screen stays awake while recording.' : 'Keep the screen on while recording.'} Test rig — keep clips short (10–15 min); video files are large and download-only.`
              : `Records through this device’s mic. ${wakeLockSupported ? 'The screen is kept awake while recording.' : 'Keep the screen on during recording.'}`}
          </div>
          <div><button onClick={start} style={primaryBtn}><Icon name={isVideo ? 'play' : 'mic'} size={14} stroke={2} /> Record {isVideo ? 'video' : 'audio'}</button></div>
        </div>
      )}

      {/* requesting */}
      {status === 'requesting' && (
        <div style={{ fontSize: 12, color: T.text2, marginTop: 12 }}>Requesting {isVideo ? 'camera & microphone' : 'microphone'} permission…</div>
      )}

      {/* recording */}
      {status === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 12 }}>
          {isVideo && (
            <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
              <video ref={previewRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 10, background: '#000', aspectRatio: '16 / 9', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', padding: '3px 8px', borderRadius: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e0464a', animation: 'mfrPulse 1.1s ease-in-out infinite' }} />
                <span className="tnum" style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: FONT_MONO }}>{mmss(seconds)}</span>
              </div>
            </div>
          )}
          {!isVideo && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0464a', animation: 'mfrPulse 1.1s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#e0464a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recording</span>
              </div>
              <div className="tnum" style={{ fontSize: 30, fontWeight: 700, color: T.text, fontFamily: FONT_MONO, letterSpacing: '0.02em' }}>{mmss(seconds)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 34 }}>
                {bars.map((h, i) => <span key={i} style={{ width: 3, height: 30, borderRadius: 2, background: accent.hex, transformOrigin: 'center', transform: `scaleY(${h})`, animation: `mfrWave ${0.7 + (i % 5) * 0.13}s ease-in-out ${i * 0.06}s infinite` }} />)}
              </div>
            </>
          )}
          <button onClick={stop} style={{ ...primaryBtn, background: '#e0464a', color: '#fff' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#fff' }} /> Stop</button>
          {!wakeLockSupported && <div style={{ fontSize: 10, color: T.text3 }}>Tip: keep the screen on so recording isn’t interrupted.</div>}
        </div>
      )}

      {/* recorded */}
      {status === 'recorded' && mediaUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: T.text2 }}>
            <Icon name="check" size={13} stroke={2.2} style={{ color: T.good }} /> Recorded {mmss(seconds)} · format {format}
          </div>
          {isVideo
            ? <video controls playsInline src={mediaUrl} style={{ width: '100%', maxWidth: 480, borderRadius: 10, background: '#000' }} />
            : <audio controls src={mediaUrl} style={{ width: '100%' }} />}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={download} style={primaryBtn}><Icon name="cloud" size={14} stroke={1.9} /> Download recording</button>
            <button onClick={reset} style={ghostBtn}><Icon name={isVideo ? 'play' : 'mic'} size={14} stroke={1.8} /> Record again</button>
          </div>
        </div>
      )}

      {/* error */}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: T.bad, lineHeight: 1.5 }}>{errorMsg}</div>
          <div><button onClick={() => setStatus('idle')} style={ghostBtn}><Icon name="chevron-right" size={14} stroke={1.8} /> Back</button></div>
        </div>
      )}
    </div>
  )
}
