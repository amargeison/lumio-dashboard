'use client'

// The player & parent portal.
//
// The page itself is now the SHARED student view — the same component the coach
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
import { fileToAvatarDataUrl, uploadAvatar } from '@/lib/avatar'
import { LiveStudentView, type StudentTheme } from '@/components/student/LiveStudentView'
import { studentFraming, type StudentBundle } from '@/lib/student/bundle'

const BG = '#0B0F17', CARD = '#0F1623', PANEL2 = '#0B1220', BORDER = '#1E293B', TEXT = '#F4F7FB', MUTED = '#93A1B5', ACCENT = '#3A8EE0'

// The student view's tokens, in the portal's palette. The coach portal builds
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
  watch?: unknown[]
  camps?: unknown[]
  resources?: unknown[]
  books?: unknown[]
  sectionsOff?: string[]
  awardThreshold?: number
}

const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginTop: 14 }
const h2: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }

export function StudentPortal({ onSignOut }: { onSignOut: () => void }) {
  const [raw, setRaw] = useState<Raw | null>(null)
  const [loading, setLoading] = useState(true)
  const [avatar, setAvatar] = useState<string | null>(null)

  const load = useCallback(() => {
    return fetch('/api/portal/player')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { setRaw(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const onPhoto = async (file?: File | null) => {
    if (!file) return
    // Show the local preview at once, then reload so the bundle's signed URL
    // takes over — the avatars bucket is private and the raw path is no use here.
    try {
      const data = await fileToAvatarDataUrl(file)
      const url = await uploadAvatar('/api/portal/avatar', { dataUrl: data })
      if (url) { setAvatar(data); load() }
    } catch { /* ignore */ }
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
    setLogErr(''); setLogBusy(true)
    try {
      const r = await fetch('/api/portal/watch/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_min: Number(logDur),
          perceived_effort: logRpe,
          distance_m: logDist ? Math.round(Number(logDist) * 1000) : undefined,
          note: logNote.trim() || undefined,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.ok) { setLogXp(d.xp_awarded ?? null); setLogNote(''); load(); setTimeout(() => { setLogOpen(false); setLogXp(null) }, 1400) }
      else setLogErr(d.error || 'Could not save')
    } catch { setLogErr('Could not save') } finally { setLogBusy(false) }
  }

  const send = async (body: string) => {
    const r = await fetch('/api/portal/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
    if (!r.ok) throw new Error('Could not send')
    load()
  }

  if (loading) return <Shell onSignOut={onSignOut}><div style={{ color: MUTED, fontSize: 13 }}>Loading…</div></Shell>
  if (!raw?.player) return <Shell onSignOut={onSignOut}><div style={{ color: MUTED, fontSize: 13 }}>No player data available yet.</div></Shell>

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
    books: (raw.books || []) as StudentBundle['books'],
    messages: (raw.messages || []) as StudentBundle['messages'],
    sectionsOff: raw.sectionsOff || [],
    awardThreshold: raw.awardThreshold ?? 3,
  }
  const f = studentFraming(bundle.player)

  return (
    <Shell onSignOut={onSignOut}>
      {/* The photo control belongs to the family, so it sits above the shared
          view rather than inside it — the coach's preview must not offer to
          change a child's picture from a page that is meant to be read-only. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <label title="Change photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
          {bundle.player.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={bundle.player.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(58,142,224,0.2)', color: ACCENT, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>
                {bundle.player.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>}
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: ACCENT, color: '#06223f', fontSize: 10, display: 'grid', placeItems: 'center', border: `2px solid ${BG}` }}>✎</span>
          <input type="file" accept="image/*" onChange={e => onPhoto(e.target.files?.[0])} style={{ display: 'none' }} />
        </label>
        <div style={{ fontSize: 12, color: MUTED }}>Tap the photo to change it.</div>
      </div>

      {/* Messages are a section of the shared view now, so the coach previewing
          this page sees the same conversation the family does. Only the family
          gets a box to type in — that is what onSendMessage is. */}
      <LiveStudentView T={ST} bundle={bundle} onSendMessage={send} />

      {/* ── Log a session ───────────────────────────────────────────────── */}
      <div style={card}>
        <p style={h2}>Log a session</p>
        {!logOpen ? (
          <>
            <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>
              No watch needed — add how long {f.audience === 'adult' ? 'you played' : `${f.first} played`} and how hard it felt, and it counts towards XP.
            </div>
            <button onClick={() => setLogOpen(true)} style={{ appearance: 'none', border: 0, background: ACCENT, color: '#06223f', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Log a session</button>
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
              <button onClick={submitLog} disabled={logBusy} style={{ appearance: 'none', border: 0, background: ACCENT, color: '#06223f', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: logBusy ? 0.6 : 1 }}>{logBusy ? 'Saving…' : 'Save session'}</button>
              <button onClick={() => { setLogOpen(false); setLogErr('') }} style={{ appearance: 'none', border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 10, padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

    </Shell>
  )
}

function Shell({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: BG, zIndex: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>Lumio</span>
        <button onClick={onSignOut} style={{ appearance: 'none', border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Sign out</button>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 18 }}>{children}</div>
    </div>
  )
}
