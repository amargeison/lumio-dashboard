'use client'

// ─── Coach portal — Video & Audio department ─────────────────────────────────
// Phase A of the GPS/Video split. Holds the Lumio Vision clip review (moved out
// of the old GPS & Video view) plus a placeholder Audio tab for the Phase-B
// recordings library. Same player+session picker pattern as the GPS side; reads
// session.clips from gps-video-data.ts. Demo only — no devices, no API.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS } from '../_lib/coach-data'
import { GPS_VIDEO_DATA } from '../_lib/gps-video-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const COURT_SURFACE = '#b45309'

// Tennis court outline — clip-thumbnail backdrop.
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

// Connected-device status (Lumio Vision for video, Lumio GPS for parity).
function DeviceStatus({ T }: { T: ThemeTokens }) {
  const card = (icon: string, name: string, meta: string) => (
    <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px' }}>
      <Icon name={icon} size={16} stroke={1.7} style={{ color: T.text2 }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{name}</span>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.good }} />
      <span style={{ fontSize: 11, color: T.good }}>Connected</span>
      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{meta}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {card('eye', 'Lumio Vision', '127 shots logged')}
      {card('mic', 'Lumio Mic', 'Audio capture · ready')}
    </div>
  )
}

export function VideoAudioView({ T, accent, density }: Common) {
  const firstWithData = PLAYERS.find(p => GPS_VIDEO_DATA[p.id])?.id ?? PLAYERS[0].id
  const [playerId, setPlayerId] = useState(firstWithData)

  const data = GPS_VIDEO_DATA[playerId]
  const sessions = (data?.sessions ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))

  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '')
  const [tab, setTab] = useState<'video' | 'audio'>('video')

  const session = sessions.find(s => s.id === sessionId) ?? sessions[0]
  const player = PLAYERS.find(p => p.id === playerId)

  const onPlayer = (id: string) => {
    const ns = (GPS_VIDEO_DATA[id]?.sessions ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))
    setPlayerId(id)
    setSessionId(ns[0]?.id ?? '')
  }

  const selectStyle: CSSProperties = {
    appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9,
    color: T.text, fontSize: 13, padding: '9px 30px 9px 12px', fontFamily: FONT, outline: 'none', cursor: 'pointer', width: '100%',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const tabBtn = (id: 'video' | 'audio', label: string) => (
    <button key={id} onClick={() => setTab(id)}
      style={{ appearance: 'none', border: tab === id ? `1px solid ${accent.border}` : '1px solid transparent', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Video &amp; Audio</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Lumio Vision highlight clips and session audio — per player, per session.</p>
      </div>

      {/* Player + session picker */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 200 }}>
          <label style={labelStyle}>Player</label>
          <select style={selectStyle} value={playerId} onChange={e => onPlayer(e.target.value)}>
            {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.name}{GPS_VIDEO_DATA[p.id] ? '' : ' — no data'}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 260 }}>
          <label style={labelStyle}>Session</label>
          <select style={selectStyle} value={sessionId} onChange={e => setSessionId(e.target.value)} disabled={sessions.length === 0}>
            {sessions.length === 0 && <option>—</option>}
            {sessions.map(s => <option key={s.id} value={s.id}>{s.date} · {s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
        {tabBtn('video', 'Video')}
        {tabBtn('audio', 'Audio')}
      </div>

      {!session ? (
        <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: density.radius, padding: '40px 20px', textAlign: 'center' }}>
          <Icon name="play" size={26} stroke={1.4} style={{ color: T.text3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No sessions logged for {player?.name ?? 'this player'} yet</div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>Clips and recordings appear here once this player has trained or played with Lumio Vision.</div>
        </div>
      ) : tab === 'video' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <DeviceStatus T={T} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Highlight Clips</div>
              <div style={{ fontSize: 11, color: T.text3 }}>Lumio Vision auto-tagged moments from this session.</div>
            </div>
            <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>{session.clips.length} clips</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: density.gap }}>
            {session.clips.map((v, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: T.panel, border: `1px solid ${T.border}` }}>
                <div style={{ padding: '7px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.text2 }}>{v.ctx}</div>
                <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: `linear-gradient(135deg, ${v.tint}55, ${v.tint}11)` }}>
                  <svg viewBox="0 0 300 540" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}>
                    <CourtBase />
                  </svg>
                  <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="play" size={18} stroke={1.8} style={{ color: '#fff' }} />
                  </div>
                  <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontFamily: FONT_MONO, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>{v.time}</span>
                  <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: accent.dim, color: accent.hex, border: `1px solid ${accent.border}` }}>{v.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Audio tab — Phase A placeholder; the real recordings library is Phase B.
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: density.radius, padding: '40px 20px', textAlign: 'center' }}>
            <Icon name="mic" size={26} stroke={1.5} style={{ color: accent.hex }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>Audio session recordings</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 4, maxWidth: 460, marginInline: 'auto', lineHeight: 1.5 }}>
              Coming in the recordings library — capture and tag voice notes and on-court audio to a session, with auto-match to the player. Arriving in the next phase.
            </div>
            <span style={{ display: 'inline-block', marginTop: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 999, background: accent.dim, color: accent.hex, border: `1px solid ${accent.border}` }}>Phase B</span>
          </div>
        </div>
      )}
    </div>
  )
}
