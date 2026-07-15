'use client'

// Live Video & Audio — the demo recordings library over real data. Player filter,
// Video/Audio tabs, live Record (video+audio or audio-only) and Upload, with
// playback + download. Clips live in coach_media (the same private bucket as the
// AI lesson recordings) but here it's a raw review library — NO transcription/AI.

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, sb, dbUpdate } from '../_lib/coach-db'

type Media = { id: string; kind?: string | null; title?: string | null; player_name?: string | null; duration_seconds?: number | null; created_at?: string; clip_of?: string | null; shot_type?: string | null; shot_confirmed?: boolean | null }
const SHOT_OPTIONS = ['serve', 'forehand', 'backhand', 'volley', 'smash'] as const
const mmss = (s?: number | null) => { if (!s && s !== 0) return ''; const m = Math.floor((s || 0) / 60); return `${m}:${String(Math.round((s || 0) % 60)).padStart(2, '0')}` }
const fmtDate = (d?: string) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '' }

export function LiveVideoAudio({ T, accent, videoOn = true, audioOn = true }: { T: ThemeTokens; accent: AccentTokens; videoOn?: boolean; audioOn?: boolean }) {
  const media = useCoachTable<Media>('coach_media')
  const { rows: players } = useCoachTable<{ id: string; name: string }>('coach_players')
  const [tab, setTab] = useState<'video' | 'audio'>(videoOn ? 'video' : 'audio')
  const [playerFilter, setPlayerFilter] = useState('')
  const [recKind, setRecKind] = useState<'audio' | 'video'>(videoOn ? 'video' : 'audio')
  // Video/Audio can each be turned off in Settings — keep the active tab on an
  // enabled medium, and capture the medium that matches the active tab.
  useEffect(() => {
    if (tab === 'video' && !videoOn && audioOn) setTab('audio')
    if (tab === 'audio' && !audioOn && videoOn) setTab('video')
  }, [videoOn, audioOn, tab])
  useEffect(() => { setRecKind(tab) }, [tab])
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

  const inFilter = (m: Media) => (!playerFilter || (m.player_name || '') === playerFilter)
  // AI highlight clips (clip_of set, shot_type tag) live in the SAME library,
  // tagged — newest first so a session's clips sit near its recording.
  const clips = media.rows.filter(m => (m.kind || 'video') === tab && inFilter(m))
  const videoCount = media.rows.filter(m => (m.kind || 'video') === 'video').length
  const audioCount = media.rows.filter(m => m.kind === 'audio').length
  const bothOn = videoOn && audioOn

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

  // Confirm/correct an AI clip's shot tag. Marks it confirmed (so it stops being
  // overwritten) — these confirmed clips are the private training set.
  const confirmShot = async (m: Media, shot: string) => {
    try { await dbUpdate('coach_media', m.id, { shot_type: shot, shot_confirmed: true, title: `${shot.charAt(0).toUpperCase() + shot.slice(1)} · highlight` }); media.reload() } catch { /* ignore */ }
  }

  const recMm = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>{bothOn ? <>Video &amp; Audio</> : videoOn ? 'Video' : 'Audio'}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>{bothOn ? 'Your recordings library — court clips and session audio for review.' : videoOn ? 'Your recordings library — court clips for review.' : 'Your recordings library — session audio for review.'}</p>
      </div>

      {/* Hero switcher — the first control on the page (only when both media are on) */}
      {bothOn && (
        <div style={{ display: 'flex', gap: 8, padding: 5, background: T.hover, borderRadius: 12, marginBottom: 14 }}>
          {(['video', 'audio'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, appearance: 'none', border: `1px solid ${tab === t ? T.border : 'transparent'}`, padding: '14px 22px', borderRadius: 10, fontSize: 15, cursor: 'pointer', fontFamily: FONT, textTransform: 'capitalize', background: tab === t ? T.panel : 'transparent', color: tab === t ? T.text : T.text2, fontWeight: tab === t ? 700 : 500 }}>
              {t === 'video' ? '🎬' : '🎙️'} {t} · {t === 'video' ? videoCount : audioCount}{t === 'video' && <span style={{ fontSize: 8.5, fontWeight: 800, color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 999, padding: '1px 6px', letterSpacing: '0.05em' }}>BETA</span>}
            </button>
          ))}
        </div>
      )}

      {/* Player filter */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.text3, marginBottom: 5 }}>Player</label>
        <select value={playerFilter} onChange={e => setPlayerFilter(e.target.value)} style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, minWidth: 220, cursor: 'pointer' }}>
          <option value="">All players</option>
          {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {/* Lumio Vision status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>👁 Lumio Vision</span>
        <span style={{ fontSize: 11.5, color: T.good }}>● Connected</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{media.rows.length} clip{media.rows.length === 1 ? '' : 's'} logged</span>
      </div>

      {/* Auto highlights — Video only */}
      {tab === 'video' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: accent.dim, border: `1px solid ${accent.hex}44`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>✨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 7 }}>Auto highlights <span style={{ fontSize: 8.5, fontWeight: 800, color: accent.hex, background: T.panel, border: `1px solid ${accent.hex}55`, borderRadius: 999, padding: '1px 6px', letterSpacing: '0.05em' }}>BETA</span></div>
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>Court video is automatically clipped into shot highlights, linked to the right player, and pushed to their mobile app — ready to review and share.</div>
          </div>
        </div>
      )}

      {/* Record + upload */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{tab === 'audio' ? '🎙️' : '🎬'}</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{tab === 'audio' ? 'Record match audio' : 'Record court video'}</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{tab === 'audio' ? 'Capture session audio for review — record, play back &amp; download.' : 'Point at the court and capture the session — record, play back &amp; download.'}</div>
          </div>
        </div>
        {/* Capture mode — fixed to the active tab (Video tab = video+audio, Audio tab = audio) */}
        {phase !== 'recording' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: accent.hex, background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 8, padding: '7px 13px', fontFamily: FONT }}>{tab === 'audio' ? '🎙️ Audio' : '🎬 Video + Audio'}</span>
          </div>
        )}
        {phase === 'recording' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <span style={{ fontSize: 13, color: T.bad, fontWeight: 700 }}>● Recording {tab}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{recMm}</span>
            <button onClick={stopRecording} style={{ appearance: 'none', border: 0, background: T.bad, color: '#fff', borderRadius: 10, padding: '12px 22px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>⏹ Stop &amp; save</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11.5, color: T.text3, margin: '14px 0' }}>{tab === 'audio' ? 'Records the mic. Keep clips short.' : 'Records the rear camera (point at the court) + mic. Keep clips short (10–15 min); video files are large.'}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={startRecording} disabled={phase === 'uploading'} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 11, padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 4px 14px ${accent.hex}44` }}>{tab === 'audio' ? '🎙️ Record audio' : '▶ Record video'}</button>
              <button onClick={() => fileRef.current?.click()} disabled={phase === 'uploading'} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 11, padding: '14px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>⬆ Upload {tab === 'audio' ? 'audio' : 'video'}</button>
              <input ref={fileRef} type="file" accept={tab === 'audio' ? 'audio/*' : 'video/*'} multiple style={{ display: 'none' }} onChange={e => onPick(Array.from(e.target.files || []))} />
              {phase === 'uploading' && <span style={{ fontSize: 12, color: T.text3, alignSelf: 'center' }}>Uploading…</span>}
            </div>
            {err && <div style={{ fontSize: 12, color: T.bad, marginTop: 8 }}>{err}</div>}
          </>
        )}
      </div>

      {/* Clips grid — recordings + tagged AI highlight clips together */}
      {clips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12, fontSize: 12.5, color: T.text3 }}>No {tab} clips yet — record or upload one above.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {clips.map(m => (
            <div key={m.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div onClick={() => openPlay(m)} style={{ position: 'relative', height: 124, background: `linear-gradient(135deg, ${accent.dim}, ${T.panel2})`, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16 }}>▷</span>
                {m.duration_seconds != null && <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 5px' }}>{mmss(m.duration_seconds)}</span>}
                {m.shot_type && <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 9.5, fontWeight: 700, color: m.shot_confirmed ? T.good : accent.hex, background: m.shot_confirmed ? `${T.good}1f` : accent.dim, border: `1px solid ${(m.shot_confirmed ? T.good : accent.hex)}55`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{m.shot_confirmed ? '✓ ' : ''}{m.shot_type}</span>}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title || 'Clip'}</div>
                {m.clip_of && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <select value={m.shot_type || ''} onChange={e => confirmShot(m, e.target.value)} title="Correct the shot — your fix trains the model and publishes the clip" style={{ flex: 1, appearance: 'none', cursor: 'pointer', background: T.panel2, color: T.text, border: `1px solid ${m.shot_confirmed ? T.good : T.border}`, borderRadius: 7, padding: '4px 8px', fontSize: 11.5, fontFamily: FONT }}>
                      {!m.shot_type && <option value="">—</option>}
                      {SHOT_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    {m.shot_confirmed
                      ? <span style={{ fontSize: 10.5, color: T.good, fontWeight: 700, whiteSpace: 'nowrap' }} title="Shared with the player/parent">✓ Shared</span>
                      : <button onClick={() => m.shot_type && confirmShot(m, m.shot_type)} disabled={!m.shot_type} title="Publish this clip to the player/parent app" style={{ appearance: 'none', border: 0, cursor: m.shot_type ? 'pointer' : 'not-allowed', background: accent.hex, color: T.btnText, borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 700, fontFamily: FONT, opacity: m.shot_type ? 1 : 0.5, whiteSpace: 'nowrap' }}>Publish ✓</button>}
                  </div>
                )}
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
