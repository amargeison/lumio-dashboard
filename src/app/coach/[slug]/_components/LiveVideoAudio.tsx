'use client'

// Live Video & Audio — the demo recordings library over real data. Player filter,
// Video/Audio tabs, live Record (video+audio or audio-only) and Upload, with
// playback + download. Clips live in coach_media (the same private bucket as the
// AI lesson recordings) but here it's a raw review library — NO transcription/AI.

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, sb, dbUpdate } from '../_lib/coach-db'

type Media = { id: string; kind?: string | null; title?: string | null; player_name?: string | null; duration_seconds?: number | null; created_at?: string }
const mmss = (s?: number | null) => { if (!s && s !== 0) return ''; const m = Math.floor((s || 0) / 60); return `${m}:${String(Math.round((s || 0) % 60)).padStart(2, '0')}` }
const fmtDate = (d?: string) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '' }

export function LiveVideoAudio({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const media = useCoachTable<Media>('coach_media')
  const { rows: players } = useCoachTable<{ id: string; name: string }>('coach_players')
  const [tab, setTab] = useState<'video' | 'audio'>('video')
  const [playerFilter, setPlayerFilter] = useState('')
  const [recKind, setRecKind] = useState<'audio' | 'video'>('video')
  const [phase, setPhase] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [secs, setSecs] = useState(0)
  const [err, setErr] = useState('')
  const [play, setPlay] = useState<{ url: string; kind: string; title: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { stopTracks(); if (timerRef.current) clearInterval(timerRef.current) }, [])
  const stopTracks = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null }

  const clips = media.rows.filter(m => (m.kind || 'video') === tab && (!playerFilter || (m.player_name || '') === playerFilter))
  const videoCount = media.rows.filter(m => (m.kind || 'video') === 'video').length
  const audioCount = media.rows.filter(m => m.kind === 'audio').length

  // Upload a clip to coach_media WITHOUT triggering the AI process route.
  const uploadOne = async (blob: Blob, name: string, title: string, duration?: number) => {
    const isVideo = blob.type.startsWith('video') || (!blob.type && recKind === 'video')
    const sign = await fetch('/api/coach/media/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: isVideo ? 'video' : 'audio', playerName: playerFilter || null, fileName: name }) })
    if (sign.status === 401) throw new Error('Uploading needs a signed-in coach account.')
    const sd = await sign.json().catch(() => ({}))
    if (!sign.ok) throw new Error(sd.error || `Upload failed (${sign.status})`)
    const up = await sb().storage.from('coach-media').uploadToSignedUrl(sd.path, sd.token, blob, { contentType: blob.type || undefined })
    if (up.error) throw new Error('Storage upload failed: ' + up.error.message)
    await dbUpdate('coach_media', sd.id, { title, duration_seconds: duration ?? null, status: 'done' }).catch(() => {})
  }

  const runUploads = async (items: { blob: Blob; name: string; title: string; duration?: number }[]) => {
    setPhase('uploading'); setErr('')
    try { for (const it of items) await uploadOne(it.blob, it.name, it.title, it.duration); media.reload() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed') }
    setPhase('idle')
  }

  const startRecording = async () => {
    setErr('')
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setErr('Recording is not supported in this browser.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(recKind === 'video' ? { audio: true, video: true } : { audio: true })
      streamRef.current = stream; chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const mime = rec.mimeType || (recKind === 'video' ? 'video/webm' : 'audio/webm')
        const blob = new Blob(chunksRef.current, { type: mime })
        const dur = secs
        stopTracks()
        const ext = mime.includes('mp4') ? (recKind === 'video' ? 'mp4' : 'm4a') : 'webm'
        runUploads([{ blob, name: `recording.${ext}`, title: `Court recording · ${new Date().toLocaleDateString('en-GB')}`, duration: dur }])
      }
      recRef.current = rec; rec.start(); setPhase('recording'); setSecs(0)
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    } catch { setErr('Could not access the camera/microphone — check permissions.') }
  }
  const stopRecording = () => { if (timerRef.current) clearInterval(timerRef.current); if (recRef.current?.state !== 'inactive') recRef.current?.stop() }

  const onPick = (files: File[]) => { if (files.length) runUploads(files.map(f => ({ blob: f as Blob, name: f.name, title: f.name.replace(/\.[a-z0-9]+$/i, '') }))) }

  const openPlay = async (m: Media) => {
    try { const r = await fetch(`/api/coach/media/${m.id}`); const j = await r.json(); if (j.url) setPlay({ url: j.url, kind: m.kind || 'video', title: m.title || 'Clip' }) } catch { /* ignore */ }
  }

  const recMm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Video &amp; Audio</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Your recordings library — court clips and session audio for review.</p>
      </div>

      {/* Player filter */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.text3, marginBottom: 5 }}>Player</label>
        <select value={playerFilter} onChange={e => setPlayerFilter(e.target.value)} style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, minWidth: 220, cursor: 'pointer' }}>
          <option value="">All players</option>
          {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 14, width: 'fit-content' }}>
        {(['video', 'audio'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: FONT, textTransform: 'capitalize', background: tab === t ? T.panel : 'transparent', color: tab === t ? T.text : T.text2, fontWeight: tab === t ? 600 : 400, boxShadow: tab === t ? `0 0 0 1px ${T.border}` : 'none' }}>{t} · {t === 'video' ? videoCount : audioCount}</button>)}
      </div>

      {/* Lumio Vision status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>👁 Lumio Vision</span>
        <span style={{ fontSize: 11.5, color: T.good }}>● Connected</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{media.rows.length} clip{media.rows.length === 1 ? '' : 's'} logged</span>
      </div>

      {/* Record + upload */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Record video + audio</div>
        <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>Field-test capture — record, play back &amp; download. No upload to AI.</div>
        {phase === 'recording' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <span style={{ fontSize: 13, color: T.bad, fontWeight: 700 }}>● Recording {recKind}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{recMm}</span>
            <button onClick={stopRecording} style={{ appearance: 'none', border: 0, background: T.bad, color: '#fff', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>⏹ Stop &amp; save</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
              {(['audio', 'video'] as const).map(k => <button key={k} onClick={() => setRecKind(k)} style={{ appearance: 'none', border: `1px solid ${recKind === k ? accent.border : T.border}`, background: recKind === k ? accent.dim : 'transparent', color: recKind === k ? accent.hex : T.text2, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{k === 'audio' ? '🎙️ Audio only' : '🎬 Video + Audio'}</button>)}
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>Records the rear camera (point at the court) + mic. Keep clips short (10–15 min); video files are large.</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={startRecording} disabled={phase === 'uploading'} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{recKind === 'video' ? '▶ Record video' : '🎙️ Record audio'}</button>
              <button onClick={() => fileRef.current?.click()} disabled={phase === 'uploading'} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>⬆ Upload {tab === 'audio' ? 'audio' : 'video'}</button>
              <input ref={fileRef} type="file" accept={tab === 'audio' ? 'audio/*' : 'video/*'} multiple style={{ display: 'none' }} onChange={e => onPick(Array.from(e.target.files || []))} />
              {phase === 'uploading' && <span style={{ fontSize: 12, color: T.text3, alignSelf: 'center' }}>Uploading…</span>}
            </div>
            {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 8 }}>{err}</div>}
          </>
        )}
      </div>

      {/* Clips grid */}
      {clips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12, fontSize: 12.5, color: T.text3 }}>No {tab} clips yet — record or upload one above.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {clips.map(m => (
            <div key={m.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div onClick={() => openPlay(m)} style={{ position: 'relative', height: 124, background: `linear-gradient(135deg, ${accent.dim}, ${T.panel2})`, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16 }}>▷</span>
                {m.duration_seconds != null && <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 5px' }}>{mmss(m.duration_seconds)}</span>}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title || 'Clip'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: T.text3, flex: 1 }}>{[m.player_name, fmtDate(m.created_at)].filter(Boolean).join(' · ')}</span>
                  <button onClick={() => { if (confirm('Delete this clip?')) fetch(`/api/coach/media/${m.id}`, { method: 'DELETE' }).then(() => media.reload()) }} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 13 }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {play && (
        <div onClick={() => setPlay(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, fontFamily: FONT }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{play.title}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <a href={play.url} download style={{ textDecoration: 'none', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>⬇ Download</a>
                <button onClick={() => setPlay(null)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 8, width: 30, height: 30, fontSize: 15, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            {play.kind === 'audio'
              ? <audio src={play.url} controls autoPlay style={{ width: '100%' }} />
              : <video src={play.url} controls autoPlay style={{ width: '100%', maxHeight: '70vh', borderRadius: 8, background: '#000' }} />}
          </div>
        </div>
      )}
    </div>
  )
}
