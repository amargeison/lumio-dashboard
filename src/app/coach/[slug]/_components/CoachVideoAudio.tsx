'use client'

// ─── Coach portal — Video & Audio department ─────────────────────────────────
// Phase B: a real recordings LIBRARY behind both tabs (recordings-store).
//   • Video tab — clip grid of the player's video recordings.
//   • Audio tab — the library: list audio recordings, auto-match an untagged
//     one to a planner session (suggest-and-confirm only), manually tag any
//     recording, and "Run review" → the existing SessionReviewPanel in-place.
// Reuses SessionReviewPanel as-is (it already takes a session prop). Demo only —
// canned records, no real files, no transcription/AI calls, no Supabase.

import { useState, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS, type TodaySession } from '../_lib/coach-data'
import { allKnownSessions } from '../_lib/schedule'
import { getRecordings, subscribe as subscribeRecordings, tagRecording } from '../_lib/recordings-store'
import { suggestSessionForRecording, sessionsForRecordingPlayer, type Recording } from '../_lib/recordings-data'
import { getAddedSessions, subscribe as subscribeSessions } from '../_lib/sessions-store'
import { SessionReviewPanel } from './SessionReviewPanel'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const COURT_SURFACE = '#b45309'

function CourtBase() {
  return (
    <>
      <rect x="0" y="0" width="300" height="540" rx="4" fill={COURT_SURFACE} />
      <line x1="10" y1="10" x2="10" y2="530" stroke="white" strokeWidth="1.5" />
      <line x1="290" y1="10" x2="290" y2="530" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="10" x2="290" y2="10" stroke="white" strokeWidth="2" />
      <line x1="10" y1="530" x2="290" y2="530" stroke="white" strokeWidth="2" />
      <line x1="0" y1="270" x2="300" y2="270" stroke="white" strokeWidth="3" />
      <line x1="40" y1="140" x2="260" y2="140" stroke="white" strokeWidth="1" />
      <line x1="40" y1="400" x2="260" y2="400" stroke="white" strokeWidth="1" />
      <line x1="150" y1="140" x2="150" y2="270" stroke="white" strokeWidth="1" />
      <line x1="150" y1="270" x2="150" y2="400" stroke="white" strokeWidth="1" />
    </>
  )
}

function DeviceLine({ T, icon, name, meta }: { T: ThemeTokens; icon: string; name: string; meta: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px' }}>
      <Icon name={icon} size={16} stroke={1.7} style={{ color: T.text2 }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{name}</span>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.good }} />
      <span style={{ fontSize: 11, color: T.good }}>Connected</span>
      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{meta}</span>
    </div>
  )
}

// Decorative static waveform for an audio recording row.
function Waveform({ accent }: { accent: AccentTokens }) {
  const bars = [0.4, 0.7, 0.45, 0.9, 0.55, 1, 0.6, 0.35, 0.8, 0.5, 0.7, 0.4, 0.95, 0.6, 0.45, 0.85, 0.5, 0.65, 0.4, 0.75]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 26, flex: 1, minWidth: 60 }}>
      {bars.map((h, i) => <span key={i} style={{ flex: 1, height: `${h * 100}%`, background: accent.hex, opacity: 0.35 + h * 0.4, borderRadius: 1 }} />)}
    </div>
  )
}

export function VideoAudioView({ T, accent, density }: Common) {
  const firstWithRec = (() => {
    const recs = getRecordings()
    return PLAYERS.find(p => recs.some(r => r.playerId === p.id))?.id ?? PLAYERS[0].id
  })()
  const [playerId, setPlayerId] = useState(firstWithRec)
  const [tab, setTab] = useState<'video' | 'audio'>('video')

  const [recordings, setRecordings] = useState<Recording[]>(getRecordings())
  const [added, setAdded] = useState<TodaySession[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [reviewSession, setReviewSession] = useState<TodaySession | null>(null)

  useEffect(() => {
    const refreshRecs = () => setRecordings(getRecordings())
    const refreshSess = () => setAdded(getAddedSessions())
    refreshRecs(); refreshSess()
    const unR = subscribeRecordings(refreshRecs)
    const unS = subscribeSessions(refreshSess)
    return () => { unR(); unS() }
  }, [])

  const player = PLAYERS.find(p => p.id === playerId)
  const videoRecs = recordings.filter(r => r.kind === 'video' && r.playerId === playerId)
  const audioRecs = recordings.filter(r => r.kind === 'audio' && r.playerId === playerId)
  const sessionById = (id?: string) => (id ? allKnownSessions(added).find(s => s.id === id) : undefined)

  const selectStyle: CSSProperties = {
    appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9,
    color: T.text, fontSize: 13, padding: '9px 30px 9px 12px', fontFamily: FONT, outline: 'none', cursor: 'pointer', width: '100%',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }
  const chip = (text: string, color: string, bg: string): CSSProperties => ({ fontSize: 9.5, fontWeight: 700, color, background: bg, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' })

  const tabBtn = (id: 'video' | 'audio', label: string) => (
    <button key={id} onClick={() => setTab(id)}
      style={{ appearance: 'none', border: tab === id ? `1px solid ${accent.border}` : '1px solid transparent', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>
      {label}
    </button>
  )

  const sessionLabel = (s: TodaySession) => `${s.date} · ${s.time} · ${s.focus}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Video &amp; Audio</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Your recordings library — Lumio Vision clips and session audio, tagged to sessions for review.</p>
      </div>

      {/* Shared player filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 220 }}>
          <label style={labelStyle}>Player</label>
          <select style={selectStyle} value={playerId} onChange={e => setPlayerId(e.target.value)}>
            {PLAYERS.map(p => {
              const n = recordings.filter(r => r.playerId === p.id).length
              return <option key={p.id} value={p.id}>{p.name}{n ? '' : ' — no recordings'}</option>
            })}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
        {tabBtn('video', `Video${videoRecs.length ? ` · ${videoRecs.length}` : ''}`)}
        {tabBtn('audio', `Audio${audioRecs.length ? ` · ${audioRecs.length}` : ''}`)}
      </div>

      {/* VIDEO TAB — clip grid from the recordings store */}
      {tab === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <DeviceLine T={T} icon="eye" name="Lumio Vision" meta={`${videoRecs.length} clips logged`} />
          {videoRecs.length === 0 ? (
            <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: density.radius, padding: '40px 20px', textAlign: 'center' }}>
              <Icon name="play" size={26} stroke={1.4} style={{ color: T.text3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No video recordings for {player?.name ?? 'this player'} yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: density.gap }}>
              {videoRecs.map(v => (
                <div key={v.id} style={{ borderRadius: 12, overflow: 'hidden', background: T.panel, border: `1px solid ${T.border}` }}>
                  <div style={{ padding: '7px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.text2 }}>{v.ctx ?? v.date}</div>
                  <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: `linear-gradient(135deg, ${v.tint ?? accent.hex}55, ${v.tint ?? accent.hex}11)` }}>
                    <svg viewBox="0 0 300 540" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}>
                      <CourtBase />
                    </svg>
                    <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="play" size={18} stroke={1.8} style={{ color: '#fff' }} />
                    </div>
                    {v.clipTime && <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontFamily: FONT_MONO, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>{v.clipTime}</span>}
                    <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: accent.dim, color: accent.hex, border: `1px solid ${accent.border}` }}>{v.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUDIO TAB — the recordings library */}
      {tab === 'audio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <DeviceLine T={T} icon="mic" name="Lumio Mic" meta={`${audioRecs.length} recordings`} />
          {audioRecs.length === 0 ? (
            <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: density.radius, padding: '40px 20px', textAlign: 'center' }}>
              <Icon name="mic" size={26} stroke={1.5} style={{ color: T.text3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No audio recordings for {player?.name ?? 'this player'} yet</div>
            </div>
          ) : audioRecs.map(rec => {
            const tagged = sessionById(rec.sessionId)
            const suggestion = !rec.sessionId && !dismissed.has(rec.id) ? suggestSessionForRecording(rec, added) : undefined
            const manualOptions = sessionsForRecordingPlayer(rec, added)
            return (
              <div key={rec.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow }}>
                {/* header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}><Icon name="mic" size={16} stroke={1.7} style={{ color: accent.hex }} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{rec.label}</div>
                    <div style={{ fontSize: 11, color: T.text3 }}>{rec.player} · {rec.date} · {rec.time} · {rec.durationMins} min</div>
                  </div>
                  <Waveform accent={accent} />
                  {tagged
                    ? <span style={chip('Tagged', T.good, 'rgba(111,168,138,0.16)')}>Tagged</span>
                    : <span style={chip('Untagged', T.warn, 'rgba(201,160,107,0.16)')}>Untagged</span>}
                </div>

                {rec.summary && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 10, lineHeight: 1.5 }}>{rec.summary}</div>}

                {/* tagged → linked session + run review */}
                {tagged && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '10px 12px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, flexWrap: 'wrap' }}>
                    <Icon name="check" size={14} stroke={2.2} style={{ color: T.good }} />
                    <span style={{ fontSize: 12, color: T.text2, flex: 1, minWidth: 0 }}>Tagged to <strong style={{ color: T.text }}>{sessionLabel(tagged)}</strong></span>
                    <button onClick={() => setReviewSession(tagged)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                      <Icon name="sparkles" size={13} stroke={1.9} /> Run review
                    </button>
                  </div>
                )}

                {/* untagged → suggestion (suggest-and-confirm) */}
                {!tagged && suggestion && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '10px 12px', background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, flexWrap: 'wrap' }}>
                    <Icon name="sparkles" size={14} stroke={1.8} style={{ color: accent.hex }} />
                    <span style={{ fontSize: 12, color: T.text2, flex: 1, minWidth: 140 }}>Looks like this matches <strong style={{ color: T.text }}>{suggestion.player}</strong> {suggestion.time} — {suggestion.focus}. Tag it?</span>
                    <button onClick={() => tagRecording(rec.id, suggestion.id)} style={{ appearance: 'none', border: 0, padding: '7px 13px', borderRadius: 8, background: accent.hex, color: T.btnText, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>Confirm</button>
                    <button onClick={() => setDismissed(d => new Set(d).add(rec.id))} style={{ appearance: 'none', padding: '7px 13px', borderRadius: 8, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 11.5, cursor: 'pointer' }}>Dismiss</button>
                  </div>
                )}

                {/* untagged → manual tag picker */}
                {!tagged && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: T.text3 }}>{suggestion ? 'Or tag manually:' : 'Tag to session:'}</span>
                    <select
                      style={{ ...selectStyle, width: 'auto', minWidth: 240, flex: '1 1 240px' }}
                      value=""
                      onChange={e => { if (e.target.value) tagRecording(rec.id, e.target.value) }}
                      disabled={manualOptions.length === 0}
                    >
                      <option value="">{manualOptions.length ? '— choose a session —' : 'No sessions for this player'}</option>
                      {manualOptions.map(s => <option key={s.id} value={s.id}>{sessionLabel(s)}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* In-place review — reuses the Session Planner's SessionReviewPanel as-is */}
      {reviewSession && (
        <div onClick={e => { if (e.target === e.currentTarget) setReviewSession(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 640, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>Session review</div>
                <div style={{ fontSize: 11, color: T.text3 }}>{sessionLabel(reviewSession)}</div>
              </div>
              <button onClick={() => setReviewSession(null)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 17, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '4px 18px 18px' }}>
              <SessionReviewPanel T={T} accent={accent} density={density} session={reviewSession} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
