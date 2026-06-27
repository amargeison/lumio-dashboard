'use client'

// Record-or-upload a lesson recording → it's transcribed (Whisper) and turned
// into a full AI lesson summary (Claude). Used by the "Add audio / Add video"
// buttons on Lesson Summaries and in Video & Audio. The coach types nothing —
// the summary is built from the recording. Talks to /api/coach/media/*.

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

export type LessonReview = {
  focus?: string; covered?: string[]; takeaways?: string[]; drills?: string[]
  homework?: string; nextFocus?: string; coachNote?: string; rating?: number
}
type Phase = 'choose' | 'recording' | 'uploading' | 'processing' | 'done' | 'error'

// Canned result for the demo simulation (no real upload/transcription). Mirrors
// the demo's Tom Okafor second-serve lesson so the flow feels real to prospects.
const DEMO_REVIEW: LessonReview = {
  focus: 'Second serve — kick & reliability',
  covered: [
    'Service toss height & consistency — slightly more over the head for kick',
    'Brushing up the back of the ball 7→1 o’clock for topspin',
    'Targeting the backhand side of the ad court',
    'Live points starting from second serve only',
  ],
  takeaways: ['Kick serve clearing the net by 1m+ — much safer margin', 'When rushed, the toss drifts forward → flatter, riskier serve'],
  drills: ['Spin-only serve ladder (10 in a row)', 'Target cones — ad-court backhand', 'Second-serve-only points to 11'],
  homework: 'Shadow-serve 30 reps/day focusing on the up-and-over brush; film one set.',
  nextFocus: 'Carry the kick serve into serve+1 forehand patterns.',
  coachNote: 'Real progress today — confidence on the second ball is the difference-maker at his level. Hold him to the higher toss.',
  rating: 5,
}

export function MediaCaptureModal({ T, accent, onClose, onSummary, defaultKind = 'audio', playerName, demo = false }: {
  T: ThemeTokens; accent: AccentTokens; onClose: () => void
  onSummary?: (review: LessonReview, transcript: string) => void
  defaultKind?: 'audio' | 'video'; playerName?: string; demo?: boolean
}) {
  const [kind, setKind] = useState<'audio' | 'video'>(defaultKind)
  const [phase, setPhase] = useState<Phase>('choose')
  const [err, setErr] = useState('')
  const [secs, setSecs] = useState(0)
  const [review, setReview] = useState<LessonReview | null>(null)
  const [transcript, setTranscript] = useState('')
  const [uploadInfo, setUploadInfo] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { stopTracks(); if (timerRef.current) clearInterval(timerRef.current); if (pollRef.current) clearInterval(pollRef.current) }, [])
  const stopTracks = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null }

  // ── Record ──────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setErr('')
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setErr('Recording is not supported in this browser.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'video' ? { audio: true, video: true } : { audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => { const blob = new Blob(chunksRef.current, { type: rec.mimeType || (kind === 'video' ? 'video/webm' : 'audio/webm') }); stopTracks(); uploadAll([{ blob, name: `recording.${(rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'}` }]) }
      recRef.current = rec
      rec.start()
      setPhase('recording'); setSecs(0)
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    } catch { setErr('Could not access the microphone/camera — check permissions.') }
  }
  const stopRecording = () => { if (timerRef.current) clearInterval(timerRef.current); recRef.current?.state !== 'inactive' && recRef.current?.stop() }

  // ── Upload (recorded blob or one-or-more picked files) ────────────────────────
  // A coach can pick several files for one lesson (recorded in sections); they're
  // uploaded, then transcribed + summarised together into a single summary.
  const onPickFiles = (files: File[]) => {
    if (!files.length) return
    setKind(files.some(f => f.type.startsWith('video')) ? 'video' : 'audio')
    uploadAll(files.map(f => ({ blob: f as Blob, name: f.name })))
  }

  const uploadOne = async (blob: Blob, name: string): Promise<string> => {
    const fd = new FormData()
    fd.append('file', blob, name)
    fd.append('kind', blob.type.startsWith('video') ? 'video' : kind)
    if (playerName) fd.append('playerName', playerName)
    const up = await fetch('/api/coach/media/upload', { method: 'POST', body: fd })
    const upJson = await up.json().catch(() => ({}))
    if (up.status === 401) throw new Error('Uploading recordings needs a signed-in coach account. The demo runs on sample data — sign up for founder access to add your own audio/video.')
    if (!up.ok) throw new Error(upJson.error || `Upload failed (${up.status})`)
    return upJson.id as string
  }

  const uploadAll = async (items: { blob: Blob; name: string }[]) => {
    setPhase('uploading'); setErr('')
    try {
      const ids: string[] = []
      for (let i = 0; i < items.length; i++) {
        setUploadInfo(items.length > 1 ? `Uploading ${i + 1} of ${items.length}…` : '')
        ids.push(await uploadOne(items[i].blob, items[i].name))
      }
      await fetch('/api/coach/media/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
      setPhase('processing')
      poll(ids[0])
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed'); setPhase('error') }
  }

  const poll = (id: string) => {
    let tries = 0
    pollRef.current = setInterval(async () => {
      tries++
      try {
        const r = await fetch(`/api/coach/media/${id}`)
        const j = await r.json().catch(() => ({}))
        if (j.status === 'done') { clearInterval(pollRef.current!); setReview(j.review || {}); setTranscript(j.transcript || ''); setPhase('done') }
        else if (j.status === 'error') { clearInterval(pollRef.current!); setErr(j.error || 'Processing failed'); setPhase('error') }
      } catch { /* keep polling */ }
      if (tries > 150) { clearInterval(pollRef.current!); setErr('Still processing — check Lesson Summaries shortly.'); setPhase('error') }
    }, 4000)
  }

  const save = () => { if (review) onSummary?.(review, transcript); onClose() }

  // Demo simulation: no real upload — show the flow then a canned summary.
  const runDemo = () => { setPhase('processing'); setErr(''); setTimeout(() => { setReview(DEMO_REVIEW); setTranscript(''); setPhase('done') }, 1800) }

  // ── UI ───────────────────────────────────────────────────────────────────────
  const btn = (bg: string, color: string): CSSProperties => ({ appearance: 'none', border: 0, borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', background: bg, color })
  const mm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div onClick={e => { if (e.target === e.currentTarget && phase !== 'processing' && phase !== 'uploading') onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 540, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 20 }}>{kind === 'video' ? '🎬' : '🎙️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Add {kind} → AI lesson summary</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>Record now or upload a recording — we transcribe it and write the summary.</div>
          </div>
          <button onClick={onClose} disabled={phase === 'processing' || phase === 'uploading'} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 16, opacity: phase === 'processing' || phase === 'uploading' ? 0.4 : 1 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {phase === 'choose' && demo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>See the full flow — a recording becomes a shareable AI lesson summary in seconds. <b style={{ color: T.text }}>This is a demo.</b> Founder accounts can upload their own audio/video (single or multiple files per lesson).</div>
              <button onClick={runDemo} style={{ ...btn(accent.hex, T.btnText), padding: '22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 26 }}>▶</span> Upload a demo clip &amp; see the AI summary
              </button>
              <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>Want to summarise your own lessons? Sign up for founder access.</p>
            </div>
          )}
          {phase === 'choose' && !demo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, background: T.hover, borderRadius: 9, padding: 3, width: 'fit-content' }}>
                {(['audio', 'video'] as const).map(k => (
                  <button key={k} onClick={() => setKind(k)} style={{ ...btn(kind === k ? T.panel : 'transparent', kind === k ? T.text : T.text2), padding: '6px 14px', boxShadow: kind === k ? `0 0 0 1px ${T.border}` : 'none' }}>{k === 'audio' ? '🎙️ Audio' : '🎬 Video'}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={startRecording} style={{ ...btn(accent.hex, T.btnText), padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 26 }}>⏺</span> Record now
                </button>
                <button onClick={() => fileRef.current?.click()} style={{ ...btn(T.panel2, accent.hex), border: `1px dashed ${accent.border}`, padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 26 }}>⬆</span> Upload file(s)
                </button>
              </div>
              <input ref={fileRef} type="file" accept="audio/*,video/*" multiple style={{ display: 'none' }} onChange={e => onPickFiles(Array.from(e.target.files || []))} />
              <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>Recorded the lesson in sections, or on a clip-on mic? Select <b>multiple files</b> — they’re combined into one summary. Long files are compressed automatically.</p>
            </div>
          )}

          {phase === 'recording' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 13, color: T.bad, fontWeight: 700, marginBottom: 8 }}>● Recording {kind}</div>
              <div className="tnum" style={{ fontSize: 40, fontWeight: 700, color: T.text, fontFamily: FONT }}>{mm}</div>
              <button onClick={stopRecording} style={{ ...btn(T.bad, '#fff'), marginTop: 16 }}>⏹ Stop &amp; build summary</button>
            </div>
          )}

          {(phase === 'uploading' || phase === 'processing') && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{phase === 'uploading' ? '⬆' : '✨'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{phase === 'uploading' ? (uploadInfo || 'Uploading…') : 'Transcribing & writing the summary…'}</div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 6 }}>{phase === 'processing' ? 'A long lesson can take a couple of minutes. You can keep working — it’ll appear in Lesson Summaries when ready.' : 'Sending your recording securely.'}</div>
            </div>
          )}

          {phase === 'done' && review && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.good }}>✓ Summary ready</div>
              {review.focus && <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Focus</div><div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginTop: 2 }}>{review.focus}</div></div>}
              {!!review.covered?.length && <Section T={T} title="Covered" items={review.covered} />}
              {!!review.takeaways?.length && <Section T={T} title="Key takeaways" items={review.takeaways} />}
              {review.homework && <div style={{ fontSize: 12.5, color: T.text2 }}><b style={{ color: T.text }}>Homework:</b> {review.homework}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={save} style={{ ...btn(accent.hex, T.btnText), flex: 1 }}>Save as lesson summary</button>
                <button onClick={onClose} style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}` }}>Discard</button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 13, color: T.bad, marginBottom: 12 }}>{err}</div>
              <button onClick={() => { setPhase('choose'); setErr('') }} style={btn(T.panel2, T.text)}>Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ T, title, items }: { T: ThemeTokens; title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>{items.map((c, i) => <li key={i} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{c}</li>)}</ul>
    </div>
  )
}
