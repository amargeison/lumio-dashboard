'use client'

// The player & parent portal.
//
// The page itself is now the SHARED player view — the same component the coach
// previews through their role switcher — fed by /api/portal/player, which is
// fenced to exactly one player in one academy. Before this, the portal and the
// coach's preview were two hand-written implementations of "the same" page, and
// they had already drifted: different sections, different wording, different
// ideas about what a racket meant. What a coach shows a family and what the
// family opens are now the same file.
//
// What stays here is what only a parent can do, which the coach's preview has no
// business rendering: change the child's photo, log a session by hand, and
// message the coach.

import { useEffect, useState, useCallback } from 'react'
import { fileToAvatarDataUrl } from '@/lib/avatar'
import { LiveStudentView, type StudentTheme } from '@/components/student/LiveStudentView'
import { studentFraming, type StudentBundle } from '@/lib/student/bundle'

const BG = '#0B0F17', CARD = '#0F1623', PANEL2 = '#0B1220', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0'

// The player view's tokens, in the portal's palette. The coach portal builds
// the same object from its theme — which is how one component sits inside two
// very different shells without either one bending to the other.
const ST: StudentTheme = {
  text: TEXT, text2: '#C7D2E0', text3: MUTED, text4: '#5A6B80',
  panel: CARD, panel2: PANEL2, border: BORDER,
  good: '#3FB37F', warn: '#E0A23A', bad: '#E06B6B', hover: 'rgba(255,255,255,0.06)',
  accent: ACCENT, accentDim: 'rgba(58,142,224,0.16)', accentBorder: 'rgba(58,142,224,0.4)',
  btnText: '#06223f',
  gap: 14, pad: 16, radius: 14,
}

type Raw = {
  player: Record<string, unknown> & { id: string; name: string }
  skills?: { skill: string; score: number }[]
  lessons?: unknown[]
  highlights?: unknown[]
  media?: Record<string, unknown>[]
  messages?: { id: string; direction: string; body: string; created_at: string }[]
  coaches?: unknown[]
  campThreads?: unknown[]
  watch?: unknown[]
  camps?: unknown[]
  nextSession?: unknown
  features?: Record<string, boolean> | null
  resources?: unknown[]
  books?: unknown[]
  sectionsOff?: string[]
  awardThreshold?: number
}

const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginTop: 14 }
const h2: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }

/** One page this account may open: a player, and the academy they are at. */
export type PortalPlayer = {
  playerId: string; name: string; role: string; academyId: string; academyName: string
  /** The academy's own name, logo and accent colour (from /api/portal/me). */
  look?: { name: string; logoUrl: string | null; accent: string } | null
}

// The academy's accent colour, worked into the tokens the page is drawn with.
// The page used to be Lumio blue whatever the academy had chosen, although the
// set-up wizard says the colour "runs through the player app". Anything that is
// not a plain six-digit colour falls back to the Lumio blue.
function lookTheme(hex?: string | null): { st: StudentTheme; accent: string; dim: string; edge: string; onAccent: string } {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || ''))
  if (!m) return { st: ST, accent: ACCENT, dim: 'rgba(58,142,224,0.16)', edge: 'rgba(58,142,224,0.6)', onAccent: '#06223f' }
  const [r, g, b] = [m[1], m[2], m[3]].map(x => parseInt(x, 16))
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`
  // Words on a button in this colour: dark on a light colour, white on a dark one.
  const onAccent = (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0B0F17' : '#FFFFFF'
  const accent = `#${m[1]}${m[2]}${m[3]}`
  return { st: { ...ST, accent, accentDim: rgba(0.16), accentBorder: rgba(0.4), btnText: onAccent }, accent, dim: rgba(0.16), edge: rgba(0.6), onAccent }
}

export function StudentPortal({ onSignOut, players, playerId, onSelect }: {
  onSignOut: () => void
  /** Every player this account has access to — more than one for a parent of
      siblings, or with children at two academies. */
  players: PortalPlayer[]
  /** The one being looked at. Sent with every request; the server checks it. */
  playerId: string
  onSelect: (id: string) => void
}) {
  const look = players.find(p => p.playerId === playerId)?.look || null
  const lk = lookTheme(look?.accent)
  const [raw, setRaw] = useState<Raw | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [photoMsg, setPhotoMsg] = useState('')

  const load = useCallback(() => {
    return fetch(`/api/portal/player?player=${encodeURIComponent(playerId)}`)
      .then(async r => {
        if (r.ok) { setRaw(await r.json()); setLoadErr('') }
        else { const d = await r.json().catch(() => ({})); setRaw(null); setLoadErr(d.error || 'This page could not be loaded. Please try again in a moment.') }
        setLoading(false)
      })
      .catch(() => { setLoadErr('This page could not be loaded. Check your connection and try again.'); setLoading(false) })
  }, [playerId])
  // A different child is a different page: clear the last one first, so one
  // child's details are never on screen under the other's name.
  useEffect(() => { setRaw(null); setAvatar(null); setPhotoMsg(''); setLoading(true); load() }, [load])

  const picker = players.length > 1 ? (
    <Picker players={players} playerId={playerId} onSelect={onSelect} />
  ) : null

  const onPhoto = async (file?: File | null) => {
    if (!file) return
    setPhotoMsg('')
    const help = 'Choose a photo (JPG or PNG, up to 3MB).'
    // Show the local preview at once, then reload so the bundle's signed URL
    // takes over — the avatars bucket is private and the raw path is no use here.
    let data = ''
    try { data = await fileToAvatarDataUrl(file) } catch { setPhotoMsg(`That file is not a photo we can use. ${help}`); return }
    try {
      const r = await fetch('/api/portal/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl: data, playerId }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.url) { setAvatar(data); setPhotoMsg('Photo updated.'); load() }
      else setPhotoMsg(d.error || `The photo could not be saved. ${help}`)
    } catch { setPhotoMsg('The photo could not be saved. Check your connection and try again.') }
  }

  // Manual session log — the watch-free way to earn XP, which matters because
  // most juniors do not have a smartwatch and being locked out of the rewards
  // for that reason is its own small unfairness.
  const [logOpen, setLogOpen] = useState(false)
  const [logDur, setLogDur] = useState('45')
  const [logRpe, setLogRpe] = useState(6)
  const [logDist, setLogDist] = useState('')
  const [logNote, setLogNote] = useState('')
  const [logBusy, setLogBusy] = useState(false)
  const [logErr, setLogErr] = useState('')
  const [logXp, setLogXp] = useState<number | null>(null)
  const submitLog = async () => {
    if (logBusy) return
    // Say what is wrong before sending: a distance that is not a number used to
    // be dropped without a word.
    const mins = Number(logDur)
    if (!logDur.trim() || !Number.isFinite(mins)) { setLogErr('Enter how many minutes the session lasted.'); return }
    const km = logDist.trim() ? Number(logDist.trim().replace(',', '.')) : null
    if (km !== null && (!Number.isFinite(km) || km < 0)) { setLogErr('Distance should be a number of kilometres, for example 2.4. Leave it empty if you are not sure.'); return }
    setLogErr(''); setLogBusy(true)
    try {
      const r = await fetch('/api/portal/watch/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          duration_min: mins,
          perceived_effort: logRpe,
          distance_m: km !== null ? Math.round(km * 1000) : undefined,
          note: logNote.trim() || undefined,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.ok) { setLogXp(d.xp_awarded ?? null); setLogNote(''); load(); setTimeout(() => { setLogOpen(false); setLogXp(null) }, 1400) }
      else setLogErr(d.error || 'Could not save')
    } catch { setLogErr('Could not save') } finally { setLogBusy(false) }
  }

  // A message now carries who it is for: a named coach, a reply to a particular
  // message, or the camp everyone is on. The route re-checks all three — nothing
  // here is taken on trust — but the family gets to say it.
  const send = async (body: string, opts?: { toName?: string; replyTo?: string; campId?: string; channel?: string }) => {
    const r = await fetch('/api/portal/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, ...opts, playerId }),
    })
    if (!r.ok) throw new Error('Could not send')
    load()
  }

  const react = async (id: string, reaction: string | null) => {
    await fetch('/api/portal/message', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reaction, playerId }),
    }).catch(() => {})
    load()
  }

  if (loading) return <Shell onSignOut={onSignOut} look={look} accent={lk.accent}>{picker}<div style={{ color: MUTED, fontSize: 13 }}>Loading…</div></Shell>
  if (!raw?.player) return (
    <Shell onSignOut={onSignOut} look={look} accent={lk.accent}>
      {picker}
      <div style={{ ...card, marginTop: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6 }}>This page is not available</div>
        <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>{loadErr || 'There is nothing to show for this player yet.'}</div>
      </div>
    </Shell>
  )

  // The server's payload, in the shape the view expects. Voice notes are the
  // audio recordings the coach saved; clips are the confirmed highlights.
  const p = raw.player as Record<string, unknown>
  const media = (raw.media || []) as Record<string, unknown>[]
  const bundle: StudentBundle = {
    player: {
      id: String(p.id), name: String(p.name || ''),
      nickname: (p.nickname as string) ?? null,
      age: (p.age as number) ?? null,
      category: (p.category as string) ?? null,
      level: (p.level as string) ?? null,
      racket_stage: (p.racket_stage as string) ?? null,
      goal: (p.goal as string) ?? null,
      avatar_url: avatar || ((p.avatar_url as string) ?? null),
      parent_name: (p.parent_name as string) ?? null,
      parent_email: (p.parent_email as string) ?? null,
      xp_total: (p.xp_total as number) ?? null,
    },
    skills: raw.skills || [],
    lessons: (raw.lessons || []) as StudentBundle['lessons'],
    clips: (raw.highlights || []) as StudentBundle['clips'],
    voiceNotes: media
      .filter(m => m.kind === 'audio')
      .map(m => ({ id: String(m.id), title: (m.title as string) ?? null, created_at: (m.created_at as string) ?? null, duration_seconds: (m.duration_seconds as number) ?? null, url: (m.url as string) ?? null })),
    watch: (raw.watch || []) as StudentBundle['watch'],
    resources: (raw.resources || []) as StudentBundle['resources'],
    camps: (raw.camps || []) as StudentBundle['camps'],
    nextSession: (raw.nextSession || null) as StudentBundle['nextSession'],
    features: (raw.features || null) as StudentBundle['features'],
    books: (raw.books || []) as StudentBundle['books'],
    messages: (raw.messages || []) as StudentBundle['messages'],
    coaches: (raw.coaches || []) as StudentBundle['coaches'],
    campThreads: (raw.campThreads || []) as StudentBundle['campThreads'],
    sectionsOff: raw.sectionsOff || [],
    awardThreshold: raw.awardThreshold ?? 3,
  }
  const f = studentFraming(bundle.player)

  return (
    <Shell onSignOut={onSignOut} look={look} accent={lk.accent}>
      {picker}
      {/* The photo control belongs to the player, so it sits above the shared
          view rather than inside it — the coach's preview must not offer to
          change a child's picture from a page that is meant to be read-only. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <label title="Change photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
          {bundle.player.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={bundle.player.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: lk.dim, color: lk.accent, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>
                {bundle.player.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>}
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: lk.accent, color: lk.onAccent, fontSize: 10, display: 'grid', placeItems: 'center', border: `2px solid ${BG}` }}>✎</span>
          <input type="file" accept="image/*" onChange={e => { onPhoto(e.target.files?.[0]); e.target.value = '' }} style={{ display: 'none' }} />
        </label>
        <div style={{ fontSize: 12, color: MUTED }} role="status">{photoMsg || 'Tap the photo to change it.'}</div>
      </div>

      {/* Messages are a section of the shared view now, so the coach previewing
          this page sees the same conversation the player does. Only the player
          gets a box to type in — that is what onSendMessage is. */}
      <LiveStudentView T={lk.st} bundle={bundle} onSendMessage={send} onReact={react} />

      {/* ── Log a session ───────────────────────────────────────────────── */}
      <div style={card}>
        <p style={h2}>Log a session</p>
        {!logOpen ? (
          <>
            <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>
              No watch needed — add how long {f.audience === 'adult' ? 'you played' : `${f.first} played`} and how hard it felt, and it counts towards XP.
            </div>
            <button onClick={() => setLogOpen(true)} style={{ appearance: 'none', border: 0, background: lk.accent, color: lk.onAccent, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Log a session</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: MUTED }}>
              Minutes on court
              <input value={logDur} onChange={e => setLogDur(e.target.value)} inputMode="numeric"
                style={{ width: '100%', marginTop: 4, background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 9, color: TEXT, padding: '9px 11px', fontSize: 13, boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: 12, color: MUTED }}>
              How hard did it feel? <strong style={{ color: TEXT }}>{logRpe}/10</strong>
              <input type="range" min={1} max={10} value={logRpe} onChange={e => setLogRpe(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
            </label>
            <label style={{ fontSize: 12, color: MUTED }}>
              Distance in km <span style={{ color: '#5A6B80' }}>(optional)</span>
              <input value={logDist} onChange={e => setLogDist(e.target.value)} inputMode="decimal" placeholder="e.g. 2.4"
                style={{ width: '100%', marginTop: 4, background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 9, color: TEXT, padding: '9px 11px', fontSize: 13, boxSizing: 'border-box' }} />
            </label>
            <textarea value={logNote} onChange={e => setLogNote(e.target.value)} rows={2} placeholder="Anything to tell your coach about it?"
              style={{ background: PANEL2, border: `1px solid ${BORDER}`, borderRadius: 9, color: TEXT, padding: '9px 11px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
            {!!logErr && <div style={{ fontSize: 12, color: '#E06B6B' }}>{logErr}</div>}
            {logXp !== null && <div style={{ fontSize: 12.5, color: '#3FB37F', fontWeight: 700 }}>✓ Saved · {logXp} XP</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submitLog} disabled={logBusy} style={{ appearance: 'none', border: 0, background: lk.accent, color: lk.onAccent, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: logBusy ? 0.6 : 1 }}>{logBusy ? 'Saving…' : 'Save session'}</button>
              <button onClick={() => { setLogOpen(false); setLogErr('') }} style={{ appearance: 'none', border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 10, padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

    </Shell>
  )
}

// Whose page this is, when the account has more than one. Always visible at the
// top, with the academy under each name — two children can share a first name,
// and one child can be at two clubs.
function Picker({ players, playerId, onSelect }: { players: PortalPlayer[]; playerId: string; onSelect: (id: string) => void }) {
  const manyAcademies = new Set(players.map(p => p.academyId)).size > 1
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Whose page</div>
      <div role="tablist" aria-label="Choose a player" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {players.map(p => {
          const on = p.playerId === playerId
          return (
            <button key={p.playerId} role="tab" aria-selected={on} onClick={() => { if (!on) onSelect(p.playerId) }}
              style={{ appearance: 'none', cursor: on ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', minHeight: 44,
                background: on ? 'rgba(58,142,224,0.16)' : CARD, border: `1px solid ${on ? 'rgba(58,142,224,0.6)' : BORDER}`,
                color: on ? TEXT : '#C7D2E0', borderRadius: 12, padding: '8px 14px', maxWidth: '100%' }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: on ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              {manyAcademies && <span style={{ display: 'block', fontSize: 11, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.academyName}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Shell({ children, onSignOut, look, accent = ACCENT }: { children: React.ReactNode; onSignOut: () => void; look?: PortalPlayer['look']; accent?: string }) {
  // The academy's own logo and name. "Lumio" only when the academy has neither.
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {look?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={look.logoUrl} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ height: 28, maxWidth: 96, objectFit: 'contain', flexShrink: 0 }} />
          )}
          <span style={look?.name
            ? { fontSize: 14, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
            : { fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>{look?.name || 'Lumio'}</span>
        </span>
        <button onClick={onSignOut} style={{ appearance: 'none', border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 18 }}>{children}</div>
    </div>
  )
}
