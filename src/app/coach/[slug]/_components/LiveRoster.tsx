'use client'

// Live Player Roster — mirrors the demo roster (cards, filters, Welcome pack)
// and the player detail modal (stat tiles, goal, Development / Contact / Lessons
// tabs, racket journey) but wired to the coach's own data. Fields not yet
// captured show a clear placeholder.

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, currentIdentity, type CoachIdentity, dbInsert, dbUpdate, dbRemove, dbList, invalidateCoachTable, rowsChanged, PLAYER_TABLES, RACKET_STAGES, RACKET_SKILLS, SKILLS_BY_STAGE, SKILL_LEVELS, skillLevelColour, setSkillScore, useCoachProfile } from '../_lib/coach-db'
import { WatchConnectPanel } from './WatchConnectPanel'
import { fileToAvatarDataUrl, avatarSrc } from '@/lib/avatar'
import { getSettings, setSettings, subscribe as subscribeSettings, PLAYER_LEVELS, PAYMENT_METHODS } from '../_lib/settings-store'
import { stageWords } from '../_lib/stage-words'
import { studentAudience } from '@/lib/student/bundle'
import { formatPounds } from '@/lib/coach/money'

// v1: Effort & Rewards is manual-only — smartwatch QR pairing is hidden until v2.
const SHOW_WATCH_PAIRING: boolean = false

// Generate a fresh opaque watch token client-side (matches the DB default shape).
function newWatchToken() {
  const r = () => (crypto.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, '')
  return (r() + r()).slice(0, 64)
}

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const CATEGORIES = ['Junior', 'Performance', 'Adult'] as const

// The first letter of the first two words. Taken by whole character, and
// letters or digits only: an emoji is two code units, and half of one prints as
// a broken box. A name padded with spaces used to give an empty avatar.
const initials = (n: string) => {
  const firsts = (n || '').trim().split(/\s+/).map(w => Array.from(w).find(ch => /[\p{L}\p{N}]/u.test(ch)) || '').filter(Boolean)
  return firsts.slice(0, 2).join('').toUpperCase() || '?'
}
// Search ignores accents ("emile" finds Émile) and case.
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const digitsOf = (s: string) => s.replace(/\D/g, '')
const todayIso = () => new Date().toLocaleDateString('en-CA')
// The shared money text, so a sum reads "£1,027.42" here as it does in Payments.
const pounds = (n: number) => formatPounds(n)
const count = (n: number, one: string, many = `${one}s`) => `${n === 1 ? (/^[aeiou]/i.test(one) ? 'an' : 'a') : n} ${n === 1 ? one : many}`

// A half-filled Add/Edit form, kept outside the component. Turning a tablet (or
// narrowing the window) swaps the portal between its desktop and phone layouts,
// which rebuilds this screen from scratch — and used to throw the form away
// with everything typed into it. Cleared when the form is saved or closed.
let formDraft: { initial: any | null; d: Record<string, any> } | null = null
function stageOf(id?: string | null) {
  const idx = RACKET_STAGES.findIndex(s => s.id === id)
  return { idx, stage: idx >= 0 ? RACKET_STAGES[idx] : null, pct: idx >= 0 ? Math.round(((idx + 1) / RACKET_STAGES.length) * 100) : 0 }
}

// ── The same person, four times ─────────────────────────────────────────────
// A name typed into a booking, a lesson summary or a recording used to create a
// player without checking properly, so a coach could end up with four profiles
// for one man — his camp on one, his XP on another, his lessons on a third, and
// a dropdown showing four identical names with no way to tell them apart. The
// creation side is fixed (see ensureRosterPlayer); this is for the duplicates
// already sitting in the roster.
//
// It only ever offers a merge, never performs one on its own: which profile is
// the real one is the coach's call, even when one of them obviously holds
// everything. The suggestion is marked, and it is only a suggestion.
function DuplicatePlayers({ T, accent, players, skills, attendance, onMerged }: {
  T: ThemeTokens; accent: AccentTokens
  players: any[]; skills: any[]; attendance: any[]
  onMerged: () => void
}) {
  const [openName, setOpenName] = useState<string | null>(null)
  const [keepId, setKeepId] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // "Different people" is remembered on the account, not just while this screen
  // is open — it used to come back every time the coach returned to the roster,
  // so two genuinely different namesakes were offered for merging for ever (and
  // "Merge all" would have merged them). Remembered by who is in the group: if
  // another profile with the same name turns up later, the question is asked again.
  const [dismissed, setDismissed] = useState<string[]>(() => getSettings().notDuplicates || [])
  useEffect(() => subscribeSettings(() => setDismissed(getSettings().notDuplicates || [])), [])
  const groupKey = (group: any[]) => group.map(p => String(p.id)).sort().join('+')
  const dismiss = (group: any[]) => {
    const next = Array.from(new Set([...(getSettings().notDuplicates || []), groupKey(group)])).slice(-300)
    setDismissed(next); setSettings({ notDuplicates: next })
  }
  const [all, setAll] = useState<{ done: number; total: number } | null>(null)
  const [allErr, setAllErr] = useState('')

  const groups = new Map<string, any[]>()
  for (const p of players) {
    const key = String(p.name || '').trim().toLowerCase()
    if (!key) continue
    groups.set(key, [...(groups.get(key) || []), p])
  }
  const dupes = [...groups.entries()].filter(([, v]) => v.length > 1 && !dismissed.includes(groupKey(v)))
  if (!dupes.length) return null

  // How much a profile actually holds — the one to keep is almost always the one
  // with the history on it, so that is the one pre-selected.
  const weight = (p: any) => {
    const filled = ['avatar_url', 'racket_stage', 'age', 'level', 'category', 'goal', 'email', 'parent_email', 'phone']
      .filter(k => p[k] !== null && p[k] !== undefined && String(p[k]).trim() !== '').length
    const sk = skills.filter(x => x.player_id === p.id).length
    const att = attendance.filter(x => x.player_id === p.id).length
    return filled + sk * 2 + att + (Number(p.xp_total) || 0 ? 3 : 0)
  }
  const describe = (p: any) => {
    const sk = skills.filter(x => x.player_id === p.id).length
    const att = attendance.filter(x => x.player_id === p.id).length
    return [
      p.racket_stage ? stageOf(p.racket_stage).stage?.name : 'no colour',
      p.age ? `age ${p.age}` : '',
      sk ? `${sk} skill${sk === 1 ? '' : 's'} graded` : '',
      att ? `${att} session${att === 1 ? '' : 's'} logged` : '',
      Number(p.xp_total) ? `${p.xp_total} XP` : '',
      p.avatar_url ? 'photo' : '',
    ].filter(Boolean).join(' · ')
  }

  const merge = async (name: string, group: any[]) => {
    const keep = keepId || [...group].sort((a, b) => weight(b) - weight(a))[0]?.id
    if (!keep || busy) return
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/coach/players/merge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepId: keep, mergeIds: group.map(p => p.id).filter(id => id !== keep) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not merge those profiles.')
      setOpenName(null); setKeepId('')
      onMerged()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not merge those profiles.') }
    setBusy(false)
  }

  // Merge every remaining name in one go. After a big import a coach can have
  // dozens of these, and opening each one to press the same button is no way
  // to spend an evening. Each name keeps its suggested (fullest) profile —
  // exactly what pressing "Merge them" and accepting the suggestion does — and
  // names already marked "Different people" are left alone. One at a time, so
  // a failure stops at that name with everything before it safely merged.
  const mergeAll = async () => {
    if (busy || all) return
    const todo = dupes.map(([, group]) => group)
    const extra = todo.reduce((n, g) => n + g.length - 1, 0)
    if (!confirm(`Merge all ${todo.length} names? For each one the fullest profile is kept and the other${extra === 1 ? '' : 's'} (${extra} in total) merged into it.\n\nIf two different people share a name, press Cancel and mark them "Different people" first. This cannot be undone.`)) return
    setBusy(true); setErr(''); setAllErr(''); setOpenName(null)
    let done = 0
    try {
      for (const group of todo) {
        setAll({ done, total: todo.length })
        const sorted = [...group].sort((a, b) => weight(b) - weight(a))
        const keep = sorted[0].id
        const rest = sorted.slice(1).map(p => p.id)
        // The merge call takes up to 20 at a time.
        for (let i = 0; i < rest.length; i += 20) {
          const res = await fetch('/api/coach/players/merge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keepId: keep, mergeIds: rest.slice(i, i + 20) }),
          })
          const d = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(`${group[0].name}: ${d.error || 'could not merge'}`)
        }
        done++
      }
    } catch (e) {
      setAllErr(`Stopped after ${done} of ${todo.length} — ${e instanceof Error ? e.message : 'could not merge'}. The ones already merged are saved; press Merge all to carry on.`)
    }
    setAll(null); setBusy(false); setKeepId('')
    onMerged()
  }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.warn}55`, borderLeft: `3px solid ${T.warn}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
          {dupes.length === 1 ? 'One name appears more than once' : `${dupes.length} names appear more than once`}
        </span>
        <span style={{ fontSize: 11.5, color: T.text3 }}>
          Merging keeps one profile and moves every booking, lesson, camp place and skill onto it.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 11 }}>
        {dupes.map(([key, group]) => {
          const open = openName === key
          const suggested = [...group].sort((a, b) => weight(b) - weight(a))[0]
          return (
            <div key={key} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{group[0].name}</span>
                <span style={{ fontSize: 11.5, color: T.text3 }}>{group.length} profiles</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
                  <button onClick={() => { setOpenName(open ? null : key); setKeepId(suggested?.id || ''); setErr('') }}
                    style={{ appearance: 'none', border: 0, borderRadius: 8, padding: '6px 12px', background: accent.hex, color: T.btnText, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                    {open ? 'Close' : 'Merge them'}
                  </button>
                  <button onClick={() => dismiss(group)}
                    style={{ appearance: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', background: 'transparent', color: T.text3, fontSize: 11.5, cursor: 'pointer' }}>
                    Different people
                  </button>
                </span>
              </div>

              {open && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: T.text3, marginBottom: 7 }}>Which one do you want to keep?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...group].sort((a, b) => weight(b) - weight(a)).map(p => {
                      const on = (keepId || suggested?.id) === p.id
                      return (
                        <button key={p.id} onClick={() => setKeepId(p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', appearance: 'none', cursor: 'pointer', background: on ? accent.dim : 'transparent', border: `1px solid ${on ? accent.hex : T.border}`, borderRadius: 9, padding: '8px 10px' }}>
                          <Avatar accent={accent} name={p.name} size={26} url={p.avatar_url} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 12, color: T.text, fontWeight: 600 }}>
                              {p.name}{p.id === suggested?.id ? ' · suggested' : ''}
                            </span>
                            <span style={{ display: 'block', fontSize: 10.5, color: T.text3 }}>{describe(p) || 'nothing recorded yet'}</span>
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: on ? accent.hex : T.text4 }}>{on ? 'KEEP' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                  {!!err && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>{err}</div>}
                  <button onClick={() => merge(key, group)} disabled={busy}
                    style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '9px 14px', marginTop: 10, background: busy ? T.hover : T.warn, color: busy ? T.text3 : '#1a1d29', fontSize: 12, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
                    {busy ? 'Merging…' : `Merge ${group.length - 1} profile${group.length - 1 === 1 ? '' : 's'} into the one above`}
                  </button>
                  <div style={{ fontSize: 10.5, color: T.text3, marginTop: 7, lineHeight: 1.5 }}>
                    Nothing is deleted until everything has moved across. A photo, age or colour the other profiles hold is copied onto the one you keep, and XP is added together.
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {(dupes.length > 1 || !!allErr) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => { void mergeAll() }} disabled={busy}
            style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '9px 14px', background: busy ? T.hover : T.warn, color: busy ? T.text3 : '#1a1d29', fontSize: 12, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
            {all ? `Merging ${all.done + 1} of ${all.total}…` : `Merge all ${dupes.length}`}
          </button>
          <span style={{ flex: 1, minWidth: 200, fontSize: 10.5, color: T.text3, lineHeight: 1.5 }}>
            Keeps the suggested (fullest) profile for every name above. Two different people with the same name? Mark them “Different people” first.
          </span>
          {!!allErr && <div style={{ flexBasis: '100%', fontSize: 11.5, color: T.bad }}>{allErr}</div>}
        </div>
      )}
    </div>
  )
}

function Avatar({ accent, name, size = 40, url }: { accent: AccentTokens; name: string; size?: number; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarSrc(url)} alt={name} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', background: accent.dim }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700 }}>
      {initials(name)}
    </div>
  )
}
function RacketChip({ stage, T }: { stage: { name: string; colour: string } | null; T: ThemeTokens }) {
  if (!stage) return <span style={{ fontSize: 11, color: T.text3 }}>No stage</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.text }}>
      <span style={{ width: 18, height: 11, borderRadius: 3, background: stage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
      {stage.name}
    </span>
  )
}

export function LiveRoster({ T, accent, density }: Common) {
  const players = useCoachTable<any>('coach_players')
  const skills = useCoachTable<any>('coach_player_skills')
  const attendance = useCoachTable<any>('coach_attendance')
  const wpProfile = useCoachProfile()
  // Logo priority: the academy logo uploaded at onboarding (DB), then any logo set
  // in Settings (localStorage), then the Lumio tennis mark so a pack is never
  // completely unbranded.
  const wpLogo = wpProfile.brand_logo_url
    || getSettings().brandLogo
    || (typeof window !== 'undefined' ? `${window.location.origin}/tennis_transparent_logo.png` : '')
  const wpOrg = { academy: wpProfile.brand_name || 'Lumio Tennis Academy', coach: wpProfile.display_name || 'Your Coach', logo: wpLogo }
  const [group, setGroup] = useState<'All' | typeof CATEGORIES[number] | 'No category'>('All')
  const [sort, setSort] = useState<'newest' | 'name' | 'colour'>('newest')
  const [query, setQuery] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const setSel = (p: any | null) => setSelId(p ? p.id : null)
  // The open card always shows the roster's current row, so a new photo or an
  // edit made from the card is on it straight away.
  const sel = selId ? players.rows.find(x => x.id === selId) ?? null : null
  // undefined = closed. Starts from a form that was open when the layout changed.
  const [editing, setEditing] = useState<any | null | undefined>(() => formDraft ? formDraft.initial : undefined)
  // Head coach or assistant — decides which "no players" story is the true one.
  const [me, setMe] = useState<CoachIdentity | null>(null)
  useEffect(() => { let alive = true; currentIdentity().then(v => { if (alive) setMe(v) }); return () => { alive = false } }, [])

  // Deep-link: another screen (e.g. dashboard "Needs attention") can ask the roster
  // to open straight onto a specific player's card.
  useEffect(() => {
    if (players.loading) return
    let id: string | null = null
    try { id = sessionStorage.getItem('lumio_open_player') } catch { /* ignore */ }
    if (!id) return
    try { sessionStorage.removeItem('lumio_open_player') } catch { /* ignore */ }
    const p = players.rows.find(x => x.id === id)
    if (p) setSel(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.loading])

  // A player with no category used to appear under "All" and nowhere else.
  const known = (p: any) => (CATEGORIES as readonly string[]).includes(p.category)
  const inTab = (t: string) => t === 'All' ? players.rows : t === 'No category' ? players.rows.filter(p => !known(p)) : players.rows.filter(p => p.category === t)
  const inGroup = inTab(group)
  // Search by the player's name, or by the parent's — a coach is as likely to
  // remember "Mrs Campbell's boy" as the boy. Every word typed has to match.
  // Accents are ignored, and a run of digits is matched against phone numbers
  // however they were spaced when typed in.
  const terms = fold(query.trim()).split(/\s+/).filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hay = (p: any) => fold([p.name, p.parent_name, p.email, p.parent_email, p.assigned_coach, p.phone].filter(Boolean).join(' '))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phones = (p: any) => digitsOf([p.phone, p.contact_phone, p.parent_phone].filter(Boolean).join(' '))
  const found = terms.length ? inGroup.filter(p => {
    const h = hay(p), ph = phones(p)
    return terms.every(t => h.includes(t) || (digitsOf(t).length >= 3 && digitsOf(t) === t.replace(/[+()-]/g, '') && ph.includes(digitsOf(t))))
  }) : inGroup
  const stageIdx = (p: any) => RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
  const list = sort === 'newest' ? found
    : [...found].sort((a, b) => (sort === 'colour' ? stageIdx(b) - stageIdx(a) : 0)
      || String(a.name || '').trim().localeCompare(String(b.name || '').trim(), 'en', { sensitivity: 'base' }))
  const tabs = ['All', ...CATEGORIES, ...(players.rows.some(p => !known(p)) ? ['No category' as const] : [])] as const
  // Two profiles with one name: history that carries only a name cannot be told
  // apart, so it is shown on neither (see PlayerDetail).
  const nameShared = (p: any) => players.rows.filter(x => fold(String(x.name || '').trim()) === fold(String(p.name || '').trim())).length > 1

  const skillMapFor = (pid: string) => Object.fromEntries(skills.rows.filter(s => s.player_id === pid).map(s => [s.skill, s.score])) as Record<string, number>
  const progressFor = (p: any) => {
    const st = stageOf(p.racket_stage); if (st.idx < 0) return 0
    const list = SKILLS_BY_STAGE[st.stage!.id] || []; if (!list.length) return 0
    const m = skillMapFor(p.id)
    return Math.round(list.filter(s => (m[s] || 0) >= 4).length / list.length * 100)
  }
  const attendanceFor = (pid: string): number | null => {
    const recs = attendance.rows.filter(a => a.player_id === pid)
    if (!recs.length) return null
    return Math.round(recs.filter(a => a.present).length / recs.length * 100)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Player Roster</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>
            Everyone you coach, at a glance.
            {!players.loading && players.rows.length > 0 && <> {terms.length || group !== 'All' ? `Showing ${list.length} of ${players.rows.length} players.` : `${players.rows.length} player${players.rows.length === 1 ? '' : 's'}.`}</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: 2, background: T.hover, borderRadius: 8 }}>
            {tabs.map(t => (
              <button key={t} className="cm-tap" onClick={() => setGroup(t)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: group === t ? T.panel : 'transparent', color: group === t ? T.text : T.text2, fontWeight: group === t ? 600 : 400 }}>{t}{players.loading ? '' : <span style={{ color: T.text3, fontWeight: 400 }}> · {inTab(t).length}</span>}</button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="Sort players"
            style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: '7px 9px', color: T.text2, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="colour">Colour, highest first</option>
          </select>
          <div style={{ position: 'relative' }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search players…" aria-label="Search players"
              onKeyDown={e => { if (e.key === 'Escape') setQuery('') }}
              style={{ width: 200, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: '7px 28px 7px 11px', color: T.text, fontSize: 12.5, outline: 'none' }} />
            {!!query && <button onClick={() => setQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '2px 6px' }}>×</button>}
          </div>
          <button onClick={() => setEditing(null)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            <Icon name="plus" size={14} stroke={2} /> Add player
          </button>
        </div>
      </div>

      {!players.loading && (
        <DuplicatePlayers T={T} accent={accent} players={players.rows}
          skills={skills.rows} attendance={attendance.rows}
          // A merge moves bookings, lessons, payments and messages onto the kept
          // player too — every screen and the right-hand rail read them again.
          onMerged={() => { rowsChanged(...PLAYER_TABLES) }} />
      )}

      {players.loading ? (
        <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      ) : terms.length && list.length === 0 && inGroup.length > 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No players match “{query.trim()}”</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>{group === 'All' ? 'Check the spelling, or search by a parent’s name.' : `Searching ${group} players only — try All.`}</p>
          <button onClick={() => setQuery('')} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear search</button>
        </div>
      ) : list.length === 0 && me && !me.isHead ? (
        // An assistant coach sees only players assigned to them (migration 166).
        // "No players yet — add your first" is the wrong story here: the academy
        // may have three hundred, none of them theirs. Telling them to add one
        // sends them to create a duplicate of a player who already exists.
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No players assigned to you yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>Your head coach decides which players are yours. Once they assign some,<br />they&rsquo;ll appear here straight away — no need to sign in again.</p>
          <button onClick={() => setEditing(null)} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add a player of your own</button>
        </div>
      ) : list.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No players yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Add the players you coach and they appear here as cards.</p>
          <button onClick={() => setEditing(null)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add your first player</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: density.gap }}>
          {list.map(p => {
            const s = stageOf(p.racket_stage)
            const prog = progressFor(p)
            const att = attendanceFor(p.id)
            return (
              <div key={p.id} onClick={() => setSel(p)} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar accent={accent} name={p.name} size={40} url={p.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.category || p.level || 'Player'}{p.age ? ` · Age ${p.age}` : ''}{p.assigned_coach ? ` · 🧑‍🏫 ${p.assigned_coach}` : ''}</div>
                  </div>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <RacketChip stage={s.stage} T={T} />
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{prog}% to next</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: T.hover, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${prog}%`, height: '100%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: T.text2 }}>
                  <span><span style={{ color: T.text3 }}>Attendance</span> {att !== null ? `${att}%` : '—'}</span>
                  <span><span style={{ color: T.text3 }}>Stage</span> {s.idx >= 0 ? `${s.idx + 1}/${RACKET_STAGES.length}` : '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.text3, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {p.goal || 'No goal set'}</span>
                  <span style={{ color: accent.hex, fontWeight: 600, whiteSpace: 'nowrap' }}>View →</span>
                </div>
                {!p.consent_photo && <div style={{ fontSize: 10.5, color: '#EF4444', marginTop: 6 }}>⚠ No photo/video consent</div>}
                <button onClick={e => { e.stopPropagation(); printWelcomePack(p, wpOrg) }} style={{ width: '100%', marginTop: 8, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="note" size={13} stroke={1.8} style={{ color: accent.hex }} /> Welcome pack
                </button>
              </div>
            )
          })}
        </div>
      )}

      {sel && (
        <PlayerDetail key={sel.id} T={T} accent={accent} density={density} player={sel}
          nameShared={nameShared(sel)} isHead={!!me?.isHead}
          skillMap={skillMapFor(sel.id)}
          attendanceRows={attendance.rows.filter(a => a.player_id === sel.id)}
          onSkillChange={async (skill, score) => { await setSkillScore(sel.id, skill, score); skills.reload() }}
          onAttendanceSet={async (date, present) => {
            // One record per player per day: a second tap on the same day
            // changes that day's record instead of adding another.
            const existing = attendance.rows.find(a => a.player_id === sel.id && String(a.session_date || '').slice(0, 10) === date)
            if (existing) await dbUpdate('coach_attendance', existing.id, { present })
            else await dbInsert('coach_attendance', { player_id: sel.id, session_date: date, present })
            attendance.reload()
          }}
          onAttendanceRemove={async (id) => { await dbRemove('coach_attendance', id); attendance.reload() }}
          onChanged={() => { players.reload() }}
          onClose={() => setSel(null)}
          onEdit={() => { setEditing(sel); setSel(null) }}
          onDelete={async () => {
            // Say what goes with them BEFORE asking. It used to be a bare
            // "Delete Sam?" that removed one row and left the bookings, the
            // money owed and the parent's login behind.
            const first = String(sel.name || 'This player').trim().split(/\s+/)[0]
            let has: DeleteImpact | null = null
            try { const r = await fetch(`/api/coach/players/delete?id=${encodeURIComponent(sel.id)}`); if (r.ok) has = (await r.json()).has } catch { /* handled below */ }
            if (!has) { alert(`We could not check what ${first} has on record, so nothing was deleted. Please try again.`); return }
            if (!confirm(deleteQuestion(String(sel.name || 'this player').trim(), has))) return
            try {
              const r = await fetch('/api/coach/players/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sel.id }) })
              const d = await r.json().catch(() => ({}))
              if (!r.ok) { alert(d.error || 'The player could not be deleted, so nothing was changed. Please try again.'); return }
            } catch { alert('The player could not be deleted — you appear to be offline. Nothing was changed.'); return }
            // Bookings, lessons, payments and messages changed too, on screens
            // that keep their own copy.
            invalidateCoachTable()
            setSel(null); players.reload(); skills.reload(); attendance.reload()
          }} />
      )}
      {editing !== undefined && (
        <PlayerForm T={T} accent={accent} initial={editing}
          onClose={() => { formDraft = null; setEditing(undefined) }}
          onSaved={() => { formDraft = null; setEditing(undefined); players.reload() }} />
      )}
    </div>
  )
}

// ── Deleting: what the coach is told first ──────────────────────────────────
type DeleteImpact = { familyLogins: number; upcomingBookings: number; lessons: number; unpaidPayments: number; unpaidTotal: number; paidPayments: number; campPlaces: number; messages: number; recordings: number; plans?: number }
function deleteQuestion(name: string, has: DeleteImpact): string {
  const first = name.split(/\s+/)[0]
  const goes = [
    has.upcomingBookings ? count(has.upcomingBookings, 'upcoming booking') : '',
    has.lessons ? count(has.lessons, 'lesson summary', 'lesson summaries') : '',
    has.plans ? count(has.plans, 'session plan') : '',
    has.messages ? count(has.messages, 'message') : '',
    has.recordings ? count(has.recordings, 'recording') : '',
    has.familyLogins ? count(has.familyLogins, 'parent or player login') : '',
  ].filter(Boolean)
  const money = [
    has.unpaidPayments ? `${count(has.unpaidPayments, 'unpaid invoice')} (${pounds(has.unpaidTotal)})` : '',
    has.paidPayments ? count(has.paidPayments, 'paid payment') : '',
  ].filter(Boolean)
  const list = (parts: string[]) => parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
  return [
    `Delete ${name}?`,
    goes.length
      ? `${first} has ${list(goes)}. These are deleted with the profile, along with past bookings, the photo, skills and attendance.`
      : `This deletes the profile with any past bookings, the photo, skills and attendance.`,
    money.length ? `${list(money).replace(/^./, c => c.toUpperCase())} ${has.unpaidPayments + has.paidPayments === 1 ? 'stays' : 'stay'} in Payments as “Removed player”, without the name${has.unpaidPayments ? ' — collect or cancel what is owed first if you need to' : ''}.` : '',
    has.campPlaces ? `${count(has.campPlaces, 'camp place').replace(/^./, c => c.toUpperCase())}: a place that has been paid for stays on the camp’s books without the name; an unpaid place is removed.` : '',
    'This cannot be undone.',
  ].filter(Boolean).join('\n\n')
}

// ── Add / edit form ─────────────────────────────────────────────────────────
function PlayerForm({ T, accent, initial, onClose, onSaved }: { T: ThemeTokens; accent: AccentTokens; initial: any | null; onClose: () => void; onSaved: () => void }) {
  // Picks up where it left off if the layout changed underneath it (see formDraft).
  const [d, setD] = useState<Record<string, any>>(() => (formDraft && (formDraft.initial?.id ?? null) === (initial?.id ?? null) ? formDraft.d : initial ?? {}))
  useEffect(() => { formDraft = { initial, d } }, [initial, d])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [photo, setPhoto] = useState<string | null>(null) // newly-picked data URL (uploaded on save)
  const [dropPhoto, setDropPhoto] = useState(false)        // remove the existing photo on save
  // The stored value is a storage path, not an address a browser can load —
  // shown raw it was a broken image. avatarSrc turns it into one.
  const current = !dropPhoto && initial?.avatar_url ? avatarSrc(initial.avatar_url) : null
  const preview = photo || current
  const pickPhoto = async (file?: File | null) => {
    if (!file) return
    try { setPhoto(await fileToAvatarDataUrl(file)); setDropPhoto(false) } catch { setErr('That file is not a photo we can use. Choose a JPG or PNG.') }
  }
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const { rows: staffRows } = useCoachTable<{ id: string; name: string; role?: string | null; email?: string | null; is_head?: boolean | null }>('coach_staff')
  const { rows: rosterRows } = useCoachTable<any>('coach_players')
  // The coach is chosen by who they are, not by their name: two coaches can
  // share a name, and the database follows the id (migration 165).
  const staffLabel = (c: { id: string; name: string; role?: string | null; email?: string | null }) =>
    staffRows.filter(x => x.name === c.name).length > 1 ? `${c.name} (${c.email || c.role || 'coach'})` : c.name
  // An invited coach's players are their own: the list of coaches is the head
  // coach's to read, so for them the field used to offer only "Head coach" —
  // the opposite of where the player is filed. It shows their own name instead.
  const [me, setMe] = useState<CoachIdentity | null>(null)
  useEffect(() => { let alive = true; currentIdentity().then(v => { if (alive) setMe(v) }); return () => { alive = false } }, [])
  const startStaff = initial?.staff_id ?? ''
  const staffValue: string = d.staff_id !== undefined && d.staff_id !== null ? d.staff_id
    : d.staff_id === null ? ''
    // An older row that has a coach's name and no id yet.
    : (staffRows.find(c => c.name === (d.assigned_coach || '')) ?.id ?? '')

  // Somebody of this name is already on the roster. Not a block — two families
  // really can both have a Sophia — but the second profile for one player is how
  // a coach ends up with his camp on one and his lessons on another, and by then
  // it takes a merge to undo.
  const typed = String(d.name ?? '').trim().toLowerCase()
  // The same is said when a player is RENAMED onto a name somebody else has:
  // card charges, GPS sessions and stand-alone plans are filed by name alone, so
  // once two players share one those rows cannot be told apart again.
  const clash = typed && (!initial?.id || typed !== String(initial.name ?? '').trim().toLowerCase())
    ? rosterRows.filter(p => p.id !== initial?.id && String(p.name || '').trim().toLowerCase() === typed)
    : []

  // Closing a form with something typed into it asks first. A stray click on
  // the dark margin (or a thumb, on a phone) used to throw the lot away.
  const dirty = !!photo || dropPhoto || Object.keys({ ...(initial ?? {}), ...d }).some(k => String(d[k] ?? '') !== String((initial ?? {})[k] ?? ''))
  const close = () => {
    if (saving) return
    if (dirty && !confirm('Close without saving? What you have typed will be lost.')) return
    onClose()
  }
  const closeRef = useRef(close)
  useEffect(() => { closeRef.current = close })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // What is wrong with the form, in words — or '' if it can be saved. Checked
  // here so the coach never sees the database's own message for a bad age.
  const problem = (): string => {
    const name = String(d.name ?? '').trim()
    if (!name) return 'Enter the player’s name.'
    if (name.length > 80) return 'That name is too long. Names can be up to 80 characters.'
    const age = String(d.age ?? '').trim()
    if (age && !(/^\d{1,3}$/.test(age) && Number(age) >= 1 && Number(age) <= 120)) return 'Age must be a whole number between 1 and 120. Leave it blank if you do not know it.'
    for (const [k, label] of [['email', 'email address'], ['parent_email', 'parent’s email address']] as const) {
      const v = String(d[k] ?? '').trim()
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return `The ${label} does not look right. Check it, or leave it blank.`
    }
    const phone = String(d.phone ?? '').trim()
    if (phone && !(/^[+\d][\d\s().-]*$/.test(phone) && digitsOf(phone).length >= 7 && digitsOf(phone).length <= 15)) return 'The phone number does not look right. Use digits, for example 07700 900123, or leave it blank.'
    if (d.consent_date && String(d.consent_date).slice(0, 10) > todayIso()) return 'The consent date cannot be in the future.'
    return ''
  }

  const save = async () => {
    const wrong = problem()
    if (wrong) { setErr(wrong); return }
    setSaving(true); setErr('')
    try {
      const text = (k: string) => String(d[k] ?? '').trim() || null
      const row: Record<string, any> = {
        name: String(d.name).trim().replace(/\s+/g, ' '), category: d.category || null, age: d.age === '' || d.age == null ? null : Number(d.age), parent_name: text('parent_name'), parent_email: text('parent_email')?.toLowerCase() ?? null, racket_stage: d.racket_stage || null, goal: text('goal'), level: d.level || null, email: text('email')?.toLowerCase() ?? null, phone: text('phone'), notes: text('notes'), payment_method: d.payment_method || null,
        consent_data: !!d.consent_data, consent_photo: !!d.consent_photo, consent_medical: !!d.consent_medical, consent_wearable: !!d.consent_wearable, consent_by: text('consent_by'), consent_date: d.consent_date || null, medical_notes: text('medical_notes'),
      }
      // The coach is sent only when it was changed. Sent as the id AND the name:
      // the form used to send the name alone, the database re-derived the name
      // from the id that was still set, and the change was silently undone. Left
      // out when untouched so a new player added by an assistant coach is still
      // filed under that coach.
      if (staffValue !== startStaff && !(staffValue === '' && !initial?.staff_id && !initial?.assigned_coach)) {
        row.staff_id = staffValue || null
        row.assigned_coach = staffRows.find(c => c.id === staffValue)?.name ?? null
      }
      let playerId = initial?.id as string | undefined
      if (initial?.id) await dbUpdate('coach_players', initial.id, row)
      else { const created = await dbInsert('coach_players', row); playerId = created?.id }
      // The player is saved. A photo that could not be saved is said, not
      // swallowed — but it must not look as though the player was not saved.
      if (playerId && (photo || dropPhoto)) {
        const r = await fetch('/api/coach/avatar', { method: photo ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(photo ? { playerId, dataUrl: photo } : { playerId }) }).catch(() => null)
        if (!r?.ok) {
          const why = r ? ((await r.json().catch(() => ({}))).error as string | undefined) : undefined
          alert(`The player was saved, but the photo was not ${photo ? 'saved' : 'removed'}. ${why || 'Please try again from the player’s card.'}`)
        }
      }
      onSaved()
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      // Offline has its own sentence (from the data layer); anything else from
      // the database is not something a coach should have to read.
      setErr(/^That was not saved/.test(m) ? m : 'That could not be saved. Please check the details and try again.')
      setSaving(false)
    }
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const field = (k: string, label: string, type = 'text', ph?: string) => (
    <div><label style={lbl}>{label}</label><input type={type} value={d[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder={ph} style={input} /></div>
  )

  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) close() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={initial?.id ? 'Edit player' : 'Add player'} style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>{initial?.id ? 'Edit player' : 'Add player'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <label title="Add a photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            {preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 20 }}>📷</div>}
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: '50%', background: accent.hex, color: T.btnText, fontSize: 11, display: 'grid', placeItems: 'center', border: `2px solid ${T.panel}` }}>✎</span>
            <input type="file" accept="image/*" onChange={e => { void pickPhoto(e.target.files?.[0]); e.target.value = '' }} style={{ display: 'none' }} />
          </label>
          <div style={{ fontSize: 12, color: T.text3 }}>
            {photo ? 'New photo — saved when you press Save.' : current ? 'Current photo. Tap it to choose a different one.' : dropPhoto ? 'The photo is removed when you press Save.' : 'Add a profile photo (optional).'}
            {(photo || current) && (
              <button type="button" onClick={() => { if (photo) setPhoto(null); else setDropPhoto(true) }}
                style={{ display: 'block', marginTop: 4, appearance: 'none', border: 0, background: 'transparent', padding: 0, color: '#EF4444', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                {photo ? 'Do not use this photo' : 'Remove photo'}
              </button>
            )}
          </div>
        </div>
        {clash.length > 0 && (
          <div style={{ background: `${T.warn}18`, border: `1px solid ${T.warn}55`, borderRadius: 10, padding: '9px 12px', marginBottom: 12, fontSize: 11.5, color: T.text2, lineHeight: 1.55 }}>
            <strong style={{ color: T.warn }}>You already have {clash.length === 1 ? 'a player' : `${clash.length} players`} called {clash[0].name}.</strong>{' '}
            {initial?.id
              ? 'If these are two different people, add a middle initial or surname so they can be told apart — card charges and session plans are filed by name.'
              : 'If this is the same person, close this and open their card instead — a second profile splits their bookings, lessons and camp places across two records.'}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('name', 'Name', 'text', 'Player name')}
          <div><label style={lbl}>Category</label><select value={d.category ?? ''} onChange={e => set('category', e.target.value)} style={input}><option value="">—</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          {field('age', 'Age', 'number')}
          {field('parent_name', 'Parent / guardian')}
          {/* Where a junior's invite goes. There was no field for it, so the
              parent's address had to be typed in as the child's own. */}
          {field('parent_email', 'Parent email', 'email', 'For the parent’s invite')}
          <div><label style={lbl}>Colour</label><select value={d.racket_stage ?? ''} onChange={e => set('racket_stage', e.target.value)} style={input}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          {me && !me.isHead
            ? <div><label style={lbl}>Coach</label><input value={me.displayName || 'You'} readOnly disabled aria-label="Coach" style={input} /></div>
            : <div><label style={lbl}>Coach</label><select value={staffValue} onChange={e => set('staff_id', e.target.value || null)} style={input}><option value="">Head coach</option>{staffRows.filter(c => !c.is_head).map(c => <option key={c.id} value={c.id}>{staffLabel(c)}</option>)}</select></div>}
          <div><label style={lbl}>Level</label>
            <select value={d.level ?? ''} onChange={e => set('level', e.target.value)} style={input}>
              <option value="">—</option>
              {/* Whatever is already on the row stays selectable even if it predates
                  the fixed list, so opening an old player and saving cannot quietly
                  wipe or rewrite their level. */}
              {Array.from(new Set([d.level, ...PLAYER_LEVELS].filter(Boolean))).map((l: string) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {field('email', 'Email', 'email')}
          {field('phone', 'Phone', 'tel')}
          <div><label style={lbl}>How they pay</label>
            <select value={d.payment_method ?? ''} onChange={e => set('payment_method', e.target.value)} style={input}>
              <option value="">— Not set —</option>
              {/* Whatever is already on the row stays selectable, so a method
                  typed before this list existed is never silently rewritten. */}
              {Array.from(new Set([d.payment_method, ...PAYMENT_METHODS].filter(Boolean))).map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>{field('goal', 'Goal', 'text', 'e.g. First serve over the net consistently')}</div>
        <div style={{ marginTop: 12 }}><label style={lbl}>Notes</label><textarea value={d.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} /></div>

        {/* Consent & medical (GDPR) */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Consent &amp; medical</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
            {([['consent_data', 'Data processing'], ['consent_photo', 'Photo / video'], ['consent_medical', 'Hold medical info'], ['consent_wearable', 'Wearable / heart-rate']] as const).map(([k, label]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!d[k]} onChange={e => set(k, e.target.checked)} /> {label}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('consent_by', 'Consent given by', 'text', 'Parent / guardian name')}
            {field('consent_date', 'Consent date', 'date')}
          </div>
          <div style={{ marginTop: 12 }}><label style={lbl}>Medical / emergency notes</label><textarea value={d.medical_notes ?? ''} onChange={e => set('medical_notes', e.target.value)} rows={2} placeholder="Allergies, conditions, emergency contact…" style={{ ...input, resize: 'vertical' }} /></div>
        </div>
        {err && <p role="alert" style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={close} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Player detail modal ──────────────────────────────────────────────────────
type PortalLogin = { id: string; email: string; role: string; status: string; signedIn: boolean }

function PlayerDetail({ T, accent, density, player, nameShared, isHead, skillMap, attendanceRows, onSkillChange, onAttendanceSet, onAttendanceRemove, onChanged, onClose, onEdit, onDelete }: Common & {
  player: any; nameShared: boolean; isHead: boolean; skillMap: Record<string, number>; attendanceRows: any[]
  onSkillChange: (skill: string, score: number) => Promise<void>
  onAttendanceSet: (date: string, present: boolean) => Promise<void>
  onAttendanceRemove: (id: string) => Promise<void>
  onChanged: () => void
  onClose: () => void; onEdit: () => void; onDelete: () => void | Promise<void>
}) {
  const [tab, setTab] = useState<'dev' | 'contact' | 'lessons' | 'attendance' | 'consent'>('dev')
  const [lessons, setLessons] = useState<any[]>([])
  const [nextSession, setNextSession] = useState<string>('—')
  // Starts on today: a register is nearly always taken on the day, and a
  // record with no date at all used to be saved if the box was left empty.
  const [attDate, setAttDate] = useState(todayIso)
  const [attMsg, setAttMsg] = useState('')
  const [attBusy, setAttBusy] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const avatarUrl: string | null = player.avatar_url || null
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMsg, setPhotoMsg] = useState('')
  // The roster is re-read after a change so the card behind this one, and every
  // other screen, shows the new photo straight away. Each upload has an address
  // of its own (see the avatar route), so a replaced photo is not served stale.
  const onPhoto = async (file?: File | null) => {
    if (!file || photoBusy) return
    setPhotoBusy(true); setPhotoMsg('')
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      const r = await fetch('/api/coach/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: player.id, dataUrl }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) onChanged(); else setPhotoMsg(d.error || 'The photo could not be saved. Please try again.')
    } catch { setPhotoMsg('That file is not a photo we can use. Choose a JPG or PNG.') } finally { setPhotoBusy(false) }
  }
  const removePhoto = async () => {
    if (photoBusy || !confirm(`Remove ${player.name}’s photo? It is deleted, not just hidden.`)) return
    setPhotoBusy(true); setPhotoMsg('')
    try {
      const r = await fetch('/api/coach/avatar', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: player.id }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) onChanged(); else setPhotoMsg(d.error || 'The photo could not be removed. Please try again.')
    } catch { setPhotoMsg('The photo could not be removed. Please try again.') } finally { setPhotoBusy(false) }
  }
  // An adult is not somebody's child. Inviting a 45-year-old and calling them
  // a parent is a small thing that tells them the product was not built with
  // them in mind — and it sends them an email addressed to the wrong person.
  // The same rule the player app uses to decide whose page it is.
  const audience = studentAudience(player)
  const invitesPlayer = audience === 'adult'
  const inviteLabel = invitesPlayer ? 'Invite player' : 'Invite parent'
  // A junior's invite goes to the parent's address when there is one.
  const inviteEmail = invitesPlayer ? (player.email || player.parent_email) : (player.parent_email || player.email)

  // Who can sign in to this player's page, and taking that away. Head coach
  // only (the server decides); for anyone else the list is not asked for.
  const [logins, setLogins] = useState<PortalLogin[]>([])
  const loadLogins = useCallback(async () => {
    if (!isHead) return
    try {
      const r = await fetch(`/api/portal/access?playerId=${encodeURIComponent(player.id)}`)
      if (r.ok) setLogins(((await r.json()).members || []) as PortalLogin[])
    } catch { /* the list is left as it was */ }
  }, [player.id, isHead])
  useEffect(() => { void loadLogins() }, [loadLogins])
  const removeAccess = async (m: PortalLogin) => {
    if (!confirm(`Remove ${m.email}’s access to ${player.name}’s page?\n\nThey are signed out straight away. You can invite them again later.`)) return
    try {
      const r = await fetch('/api/portal/access', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: m.id }) })
      const d = await r.json().catch(() => ({}))
      setInviteMsg(r.ok ? `✓ Access removed for ${m.email}` : (d.error || 'Access could not be removed. Please try again.'))
    } catch { setInviteMsg('Access could not be removed. Please try again.') }
    void loadLogins()
  }

  const invitePortal = async () => {
    // One press, one email: the button is out of use until the first press has
    // been answered. A double-click used to send two.
    if (inviteBusy) return
    if (!inviteEmail) { setInviteMsg(invitesPlayer ? 'Add their email first — press Edit.' : 'Add the parent’s email first — press Edit.'); return }
    setInviteBusy(true); setInviteMsg('')
    try {
      const r = await fetch('/api/portal/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: invitesPlayer ? 'student' : 'parent', scopePlayerId: player.id, name: invitesPlayer ? player.name : (player.parent_name || player.name) }) })
      // The route says why when it refuses (the player app is off, the address
      // is not valid, only the head coach can invite) — show that, not a shrug.
      const d = await r.json().catch(() => ({}))
      setInviteMsg(r.ok ? `✓ Invite sent to ${inviteEmail}` : (d.error || 'The invite could not be sent. Please try again.'))
    } catch { setInviteMsg('The invite could not be sent — check your connection and try again.') }
    setInviteBusy(false)
    void loadLogins()
  }
  const s = stageOf(player.racket_stage)
  const stageSkills = s.stage ? (SKILLS_BY_STAGE[s.stage.id] || []) : []
  const racketProgress = stageSkills.length ? Math.round(stageSkills.filter(sk => (skillMap[sk] || 0) >= 4).length / stageSkills.length * 100) : 0
  const attPct = attendanceRows.length ? Math.round(attendanceRows.filter(a => a.present).length / attendanceRows.length * 100) : null

  // This player's rows in a table: the ones linked to them, plus older rows that
  // carry only a name — but only when nobody else on the roster has that name.
  // Matching on the name alone showed two namesakes each other's lessons, and
  // gave a new player the history of a deleted one.
  const mine = useCallback((rows: any[]) => {
    const name = fold(String(player.name || '').trim())
    return rows.filter(r => r.player_id ? r.player_id === player.id : (!nameShared && !!name && fold(String(r.player_name || '').trim()) === name))
  }, [player.id, player.name, nameShared])

  const load = useCallback(async () => {
    const [sess, books, plans] = await Promise.all([dbList('coach_sessions'), dbList('coach_bookings'), dbList('coach_session_plans')])
    setLessons(mine(sess).sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? ''))))
    const today = todayIso()
    // A session that is over is not the next one: finished from the planner, or
    // past its end time today. Judged on the date alone, this morning's lesson
    // was still "next" in the evening.
    const done = new Set(plans.filter((pl: any) => pl.booking_id && pl.completed_at).map((pl: any) => String(pl.booking_id)))
    const nowM = new Date().getHours() * 60 + new Date().getMinutes()   // this device's clock, like todayIso above
    const over = (b: any) => {
      if (String(b.booking_date ?? '').slice(0, 10) !== today) return false
      if (done.has(String(b.id))) return true
      const t = /^(\d{1,2}):(\d{2})/.exec(String(b.start_time ?? ''))
      return !!t && Number(t[1]) * 60 + Number(t[2]) + (Number(b.duration_min) > 0 ? Number(b.duration_min) : 60) <= nowM
    }
    const up = mine(books).filter(b => (b.booking_date ?? '') >= today && b.status !== 'cancelled' && !over(b))
      .sort((a, b) => (String(a.booking_date).slice(0, 10) + String(a.start_time ?? '')).localeCompare(String(b.booking_date).slice(0, 10) + String(b.start_time ?? '')))[0]
    setNextSession(up ? `${new Date(up.booking_date).toLocaleDateString('en-GB')}${up.start_time ? ' ' + String(up.start_time).slice(0, 5) : ''}` : '—')
  }, [mine])
  useEffect(() => { load() }, [load])

  // Escape closes the card, the same as the × does.
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const markAttendance = async (present: boolean) => {
    if (attBusy) return
    if (!attDate) { setAttMsg('Choose the date of the session first.'); return }
    if (attDate > todayIso()) { setAttMsg('That date is in the future. Attendance can only be recorded for a session that has happened.'); return }
    setAttBusy(true); setAttMsg('')
    try { await onAttendanceSet(attDate, present) }
    catch (e) {
      // The database has the same three rules and says them in plain words.
      const m = e instanceof Error ? e.message : ''
      setAttMsg(/^(Choose the date|That date is in the future|Attendance is already recorded|That was not saved)/.test(m) ? m : 'That could not be saved. Please try again.')
    }
    setAttBusy(false)
  }
  const attOnDay = attendanceRows.find(a => String(a.session_date || '').slice(0, 10) === attDate)

  const tile = (label: string, value: React.ReactNode, color?: string, small?: boolean) => (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
      <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: small ? 12.5 : 15, fontWeight: 600, color: color ?? T.text, marginTop: 3 }}>{value}</div>
    </div>
  )

  const sectOff = getSettings().sectionsOff?.roster || []
  const showSec = (k: string) => !sectOff.includes(k)
  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={player.name} style={{ width: '100%', maxWidth: 780, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: `${density.pad + 2}px ${density.pad + 4}px`, borderBottom: `1px solid ${T.border}` }}>
          <label title="Change photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            <Avatar key={avatarUrl || 'none'} accent={accent} name={player.name} size={50} url={avatarUrl} />
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: accent.hex, color: T.btnText, fontSize: 10, display: 'grid', placeItems: 'center', border: `2px solid ${T.panel}` }}>{photoBusy ? '…' : '✎'}</span>
            <input type="file" accept="image/*" onChange={e => { void onPhoto(e.target.files?.[0]); e.target.value = '' }} style={{ display: 'none' }} />
          </label>
          <div style={{ minWidth: 0, flex: '1 1 180px' }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.text, overflowWrap: 'anywhere' }}>{player.name}</div>
            <div style={{ fontSize: 12, color: T.text3, overflowWrap: 'anywhere' }}>{player.category || player.level || 'Player'}{player.age ? ` · Age ${player.age}` : ''}{player.parent_name ? ` · Parent: ${player.parent_name}` : ''}</div>
            {/* A photo could only ever be replaced. Needed when a family
                withdraws photo consent. */}
            {avatarUrl && <button onClick={removePhoto} disabled={photoBusy} style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, marginTop: 3, color: T.text3, fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}>Remove photo</button>}
            {photoMsg && <div role="alert" style={{ fontSize: 11, color: T.bad, marginTop: 3 }}>{photoMsg}</div>}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {inviteMsg && <span role="status" style={{ fontSize: 11, color: inviteMsg.startsWith('✓') ? T.good : T.text3, maxWidth: 220 }}>{inviteMsg}</span>}
            <button onClick={invitePortal} disabled={inviteBusy} title={invitesPlayer ? 'Invite this player to their own portal' : 'Invite the parent to a portal for this player'} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: inviteBusy ? 'wait' : 'pointer', opacity: inviteBusy ? 0.6 : 1, padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>🔑 {inviteBusy ? 'Sending…' : inviteLabel}</button>
            <button onClick={onEdit} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>Edit</button>
            <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 32, height: 32, fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Who can sign in to this player's page. There was no way to take
            access away again — not after a separation, not when a family left. */}
        {logins.length > 0 && (
          <div style={{ padding: `8px ${density.pad + 4}px`, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Portal access</div>
            {logins.map(m => {
              const state = m.status === 'revoked' ? 'Access removed' : m.status === 'active' && m.signedIn ? 'Signed in' : 'Invited, not signed in yet'
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                  <span style={{ color: T.text, overflowWrap: 'anywhere' }}>{m.email}</span>
                  <span style={{ color: T.text3 }}>· {m.role === 'student' ? 'Player' : 'Parent'} · </span>
                  <span style={{ color: m.status === 'revoked' ? T.bad : m.signedIn ? T.good : T.text3, fontWeight: 600 }}>{state}</span>
                  {m.status !== 'revoked' && (
                    <button onClick={() => { void removeAccess(m) }} style={{ marginLeft: 'auto', appearance: 'none', background: 'transparent', border: `1px solid rgba(239,68,68,0.4)`, color: '#EF4444', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Remove access</button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ padding: `${density.pad}px ${density.pad + 4}px ${density.pad + 4}px` }}>
          {/* stat tiles */}
          <div style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
            {/* Colour, not racket. The roster belongs to every academy; only
                the ones running the reward ladder have rackets. Same rule as
                Player Development — see LiveDevelopment.tsx. */}
            {tile('Current colour', <RacketChip stage={s.stage} T={T} />)}
            {tile('Colour progress', `${racketProgress}%`, accent.hex)}
            {tile('Attendance', attPct !== null ? `${attPct}%` : '—', attPct === null ? T.text3 : attPct >= 90 ? T.good : attPct >= 80 ? T.warn : T.bad, attPct === null)}
            {tile('Lessons', String(lessons.length))}
            {tile('Next session', nextSession, undefined, true)}
          </div>

          {/* goal */}
          <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '8px 12px', display: showSec('goal') ? 'flex' : 'none', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="flag" size={13} stroke={1.8} style={{ color: accent.hex }} />
            <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Goal</span>
            <span style={{ fontSize: 12.5, color: T.text }}>{player.goal || 'No goal set yet — add one when you edit this player.'}</span>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14, padding: 2, background: T.hover, borderRadius: 9, width: 'fit-content', maxWidth: '100%' }}>
            {([['dev', 'Development'], ['contact', 'Contact'], ['lessons', `Lessons · ${lessons.length}`], ['attendance', `Attendance · ${attendanceRows.length}`], ['consent', 'Consent']] as const).map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? T.panel : 'transparent', color: tab === id ? T.text : T.text2, fontWeight: tab === id ? 600 : 400 }}>{l}</button>
            ))}
          </div>

          {tab === 'dev' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working on · {s.stage ? s.stage.name : '—'}</span>
                  <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>{racketProgress}%</span>
                </div>
                {stageSkills.length === 0 ? (
                  <p style={{ fontSize: 12, color: T.text3 }}>Set a colour for this player to track their skills.</p>
                ) : stageSkills.map(skill => {
                  const score = skillMap[skill] || 0
                  return (
                    <div key={skill} style={{ marginBottom: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.text }}>{skill}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: skillLevelColour(score), fontWeight: 600 }}>{SKILL_LEVELS[score]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(lv => (
                          <button key={lv} title={SKILL_LEVELS[lv]} onClick={() => onSkillChange(skill, score === lv ? lv - 1 : lv)}
                            style={{ flex: 1, height: 9, borderRadius: 3, border: 0, padding: 0, cursor: 'pointer', background: lv <= score ? skillLevelColour(score) : T.hover }} />
                        ))}
                      </div>
                    </div>
                  )
                })}
                <p style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>Tap a bar to mark mastery. Four bars (Consistent) = mastered.</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Colour journey</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {RACKET_STAGES.map((b, bi) => {
                    const state = s.idx < 0 ? 'locked' : bi < s.idx ? 'done' : bi === s.idx ? 'current' : 'locked'
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: state === 'locked' ? 0.4 : 1 }}>
                        <span style={{ width: 20, height: 12, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                        <span style={{ fontSize: 11.5, color: T.text, fontWeight: state === 'current' ? 700 : 500, flex: 1 }}>{b.name}</span>
                        {state === 'done' && <Icon name="check" size={12} stroke={2.2} style={{ color: T.good }} />}
                        {state === 'current' && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>now</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Email', player.email], ['Phone', player.phone], ['Parent / guardian', player.parent_name], ['Parent email', player.parent_email], ['Level', player.level]].map(([l, v]) => (
                <div key={l as string} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                  <div style={{ fontSize: 13, color: v ? T.text : T.text3, marginTop: 3, overflowWrap: 'anywhere' }}>{v || '—'}</div>
                </div>
              ))}
              {player.notes && <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{player.notes}</div>}
              <div style={{ gridColumn: '1 / -1' }}>
                <button disabled={deleting} onClick={async () => { if (deleting) return; setDeleting(true); try { await onDelete() } finally { setDeleting(false) } }} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.4)`, color: '#EF4444', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.6 : 1 }}>{deleting ? 'Checking…' : 'Delete player'}</button>
              </div>
            </div>
          )}

          {tab === 'lessons' && (
            <div>
              {lessons.length === 0 ? (
                <p style={{ fontSize: 12.5, color: T.text3 }}>No lessons logged for this player yet. Log them in the Lesson Summaries module.</p>
              ) : lessons.map((l, i) => (
                <div key={l.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontSize: 10.5, color: T.text3, width: 86, flexShrink: 0, paddingTop: 2 }}>{l.session_date ? new Date(l.session_date).toLocaleDateString('en-GB') : '—'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{l.focus || 'Session'}{l.rating ? ` · ${l.rating}/5` : ''}</div>
                    {l.summary && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 3 }}>{l.summary}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'attendance' && (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                <input type="date" aria-label="Session date" value={attDate} max={todayIso()} onChange={e => { setAttDate(e.target.value); setAttMsg('') }} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.text, fontSize: 12.5 }} />
                <button disabled={attBusy} onClick={() => { void markAttendance(true) }} style={{ border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.1)', color: '#22C55E', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Present</button>
                <button disabled={attBusy} onClick={() => { void markAttendance(false) }} style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Absent</button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: T.text3 }}>{attPct !== null ? `${attPct}% present (${attendanceRows.filter(a => a.present).length}/${attendanceRows.length})` : 'No records yet'}</span>
              </div>
              {attMsg && <p role="alert" style={{ fontSize: 12, color: T.bad, margin: '-6px 0 12px' }}>{attMsg}</p>}
              {!attMsg && attOnDay && <p style={{ fontSize: 11.5, color: T.text3, margin: '-6px 0 12px' }}>Already marked {attOnDay.present ? 'present' : 'absent'} on that day — pressing a button changes it.</p>}
              {attendanceRows.length === 0 ? (
                <p style={{ fontSize: 12.5, color: T.text3 }}>No attendance logged yet. Pick a date and mark the player present or absent.</p>
              ) : [...attendanceRows].sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? ''))).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.text2, width: 100 }}>{a.session_date ? new Date(a.session_date).toLocaleDateString('en-GB') : 'No date'}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: a.present ? '#22C55E' : '#EF4444' }}>{a.present ? 'Present' : 'Absent'}</span>
                  <button onClick={() => onAttendanceRemove(a.id)} aria-label="Remove this record" title="Remove this record" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'consent' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
                {([['Data processing', player.consent_data], ['Photo / video', player.consent_photo], ['Medical info', player.consent_medical], ['Wearable / heart-rate', player.consent_wearable]] as const).map(([l, ok]) => (
                  <div key={l} style={{ background: T.panel2, border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)'}`, borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ok ? '#22C55E' : '#EF4444', marginTop: 3 }}>{ok ? '✓ Given' : '✗ Not given'}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: T.text2, marginBottom: 6 }}>
                {player.consent_by ? `Consent given by ${player.consent_by}` : 'No consent giver recorded'}{player.consent_date ? ` · ${new Date(player.consent_date).toLocaleDateString('en-GB')}` : ''}
              </div>
              {player.medical_notes && <div style={{ fontSize: 12.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}><b style={{ color: T.text }}>Medical / emergency:</b> {player.medical_notes}</div>}
              {!player.consent_photo && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠ No photo/video consent — do not capture footage of this player.{avatarUrl && <> This player has a profile photo: <button onClick={removePhoto} style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, color: '#EF4444', fontSize: 12, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>remove it</button>.</>}</div>}
              {!player.consent_wearable && <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 12 }}>⚠ No wearable/heart-rate consent — smartwatch effort tracking is blocked for this player.</div>}
              <p style={{ fontSize: 11.5, color: T.text3, margin: '0 0 12px', lineHeight: 1.55 }}>Record or change consent using <b style={{ color: T.text2 }}>Edit</b>. Use Export to fulfil a data-access request: the file holds everything recorded about this player. For a right-to-erasure request use Delete (Contact tab): it erases the profile, photo, bookings, lesson summaries, messages and recordings. Payment records are kept, as a business must, with the name removed.</p>
              <button disabled={exporting} onClick={async () => { if (exporting) return; setExporting(true); try { await exportPlayerData(player, nameShared, skillMap, attendanceRows, logins) } catch { alert('The export could not be put together. Please try again.') } setExporting(false) }} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.6 : 1 }}>{exporting ? 'Preparing…' : <>⬇ Export this player&apos;s data</>}</button>

              {SHOW_WATCH_PAIRING && (
                <div style={{ marginTop: 16 }}>
                  <WatchConnectPanel
                    T={T} accent={accent}
                    token={player.watch_token || ''}
                    playerName={(player.name || '').split(' ')[0]}
                    consentOk={!!player.consent_wearable}
                    onReset={async () => { const nt = newWatchToken(); await dbUpdate('coach_players', player.id, { watch_token: nt }); return nt }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Everything held about one player, for a data-access request.
//
// It used to be the profile row, lesson summaries matched by name, and
// attendance — and the profile row included the smartwatch pairing token. A
// person asking for their data is owed all of it, and none of our plumbing.
const EXPORT_INTERNAL = new Set([
  'id', 'coach_id', 'player_id', 'staff_id', 'venue_id', 'camp_id', 'plan_id', 'lesson_id', 'booking_id', 'clip_of',
  'tp_school_id', 'tp_programme_id', 'watch_token', 'form_token', 'token', 'storage_path', 'thread_key', 'external_id', 'results',
  'stripe_session_id', 'stripe_checkout_session_id', 'stripe_payment_intent_id', 'told_state', 'told_to',
  'discord_channel_id', 'discord_channel_name',
])
const forExport = (row: any) => Object.fromEntries(Object.entries(row || {}).filter(([k]) => !EXPORT_INTERNAL.has(k)))

async function exportPlayerData(player: any, nameShared: boolean, skillMap: Record<string, number>, attendance: any[], logins: PortalLogin[]) {
  const name = fold(String(player.name || '').trim())
  // Linked rows, plus name-only rows when the name is this player's alone —
  // the same rule the card uses.
  const mine = (rows: any[], nameKey = 'player_name') => rows.filter(r => r.player_id ? r.player_id === player.id : (!nameShared && !!name && fold(String(r[nameKey] || '').trim()) === name))
  const [bookings, lessons, payments, effort, messages, campPlaces, camps, recordings, development, recommendations, gps] = await Promise.all([
    dbList('coach_bookings'), dbList('coach_sessions'), dbList('coach_payments'), dbList('coach_watch_sessions'), dbList('coach_messages'),
    dbList('coach_camp_attendees'), dbList('coach_camps'), dbList('coach_media'), dbList('coach_development'), dbList('coach_player_resources'), dbList('coach_gps_sessions'),
  ])
  const campName = (id: string) => (camps as any[]).find(c => c.id === id)?.name ?? null
  const data = {
    exported_at: new Date().toISOString(),
    player: forExport(player),
    skills: Object.entries(skillMap).map(([skill, score]) => ({ skill, score, level: SKILL_LEVELS[score] ?? null })),
    attendance: attendance.map(forExport),
    bookings: mine(bookings).map(forExport),
    lessons: mine(lessons).map(forExport),
    payments: mine(payments).map(forExport),
    effort_sessions: (effort as any[]).filter(r => r.player_id === player.id).map(forExport),
    gps_sessions: nameShared ? [] : (gps as any[]).filter(r => fold(String(r.player_name || '').trim()) === name).map(forExport),
    messages: (messages as any[]).filter(r => r.player_id === player.id).map(forExport),
    camp_places: mine(campPlaces).map(r => ({ camp: campName(r.camp_id), ...forExport(r) })),
    recordings: mine(recordings).map(forExport),
    development_notes: mine(development).map(forExport),
    recommendations: (recommendations as any[]).filter(r => r.player_id === player.id).map(forExport),
    portal_logins: logins.map(m => ({ email: m.email, role: m.role, status: m.status, signed_in: m.signedIn })),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${(String(player.name || '').trim() || 'player').replace(/\s+/g, '-').toLowerCase()}-data.json`; a.click()
  URL.revokeObjectURL(url)
}

// ── Welcome pack (printable) ─────────────────────────────────────────────────
const WP_THEME: Record<string, string> = { white: 'Foundations', yellow: 'Rallying', orange: 'Net & Touch', green: 'The Serve', blue: 'Spin & Shape', purple: 'Specialty Shots', brown: 'Weapons', red: 'Tactics', black: 'Mastery' }

// Rich 3-page printable welcome pack — welcome letter, starting action plan, and
// an onboarding questionnaire (mirrors the demo, over live data).
async function printWelcomePack(p: any, org?: { academy: string; coach: string; logo?: string }) {
  // The window is opened synchronously, before the await. Open it after and
  // every browser blocks it as a non-gesture pop-up.
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to open the welcome pack.'); return }
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome Pack</title></head><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;padding:60px;text-align:center;color:#555">Lumio Coach is writing the welcome pack…</body></html>')
  w.document.close()

  // The four-week plan, written for THIS player. If Lumio Coach can't be
  // reached the pack still prints — a family waiting on a welcome pack should
  // not be told to come back later — but with the generic plan, and the pack
  // says so rather than passing it off as written for them.
  let plan: { welcome?: string; weeks?: { week: string; focus: string }[]; first_session?: string; parent_note?: string } | null = null
  try {
    const r = await fetch('/api/coach/welcome-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: p.id }),
    })
    if (r.ok) { const d = await r.json(); if (d?.weeks?.length) plan = d }
  } catch { /* fall through to the generic plan */ }

  if (typeof window === 'undefined') return
  const academy = org?.academy || 'Lumio Tennis Academy', coach = org?.coach || 'Your Coach'
  // White plate behind the mark so a dark or transparent logo still reads on the
  // coloured band.
  const logoChip = org?.logo
    ? `<img src="${org.logo}" alt="" style="height:58px;max-width:150px;object-fit:contain;background:#fff;border-radius:10px;padding:8px;flex-shrink:0" />`
    : ''
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fill = (w = '100%') => `<span style="display:inline-block;border-bottom:1px dashed #b9bdca;min-width:${w};height:15px"></span>`
  const line = '<div style="border-bottom:1px dashed #b9bdca;height:22px;margin:6px 0"></div>'
  const s = stageOf(p.racket_stage)
  const stage = s.stage || RACKET_STAGES[0]
  const idx = s.idx >= 0 ? s.idx : 0
  const theme = WP_THEME[stage.id] || 'Foundations'
  const next = RACKET_STAGES[Math.min(idx + 1, RACKET_STAGES.length - 1)]
  const skills = (RACKET_SKILLS[stage.id] || []).map(sk => `<li>${esc(sk.name)} — <span style="color:#6b7280">${esc(sk.note)}</span></li>`).join('')
  const first = String(p.name || '').trim().split(/\s+/)[0] || 'there'
  // "Racket" is the word for the reward ladder. An academy that does not run it
  // has colours and nothing to hand over, so its pack talks about colours.
  const sw = stageWords()

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome Pack — ${esc(p.name)}</title>
  <style>*{box-sizing:border-box}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative;page-break-after:always}.page:last-child{page-break-after:auto}
  .band{background:linear-gradient(120deg,#1f6fd6,#3A8EE0);color:#fff;border-radius:14px;padding:22px 26px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#1f6fd6;margin:22px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
  p{font-size:12.5px;line-height:1.7;color:#374151}ul,ol{margin:0;padding-left:20px}li{font-size:12px;line-height:1.6;color:#374151;margin-bottom:4px}
  .accentbox{border:1px solid #d6e6fb;border-left:4px solid #3A8EE0;border-radius:0 10px 10px 0;background:#f3f8ff;padding:12px 16px;margin-top:10px}
  .q{margin:0 0 12px}.q .lbl{font-size:12px;font-weight:600;color:#1a1d29;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:6px}td,th{font-size:12px;padding:6px 8px;border-bottom:1px solid #f0f1f6;text-align:left;vertical-align:top}th{color:#9099ad;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}@page{size:A4;margin:0}</style></head><body>

  <div class="page">
    <div class="band" style="display:flex;align-items:center;justify-content:space-between;gap:16px">
      <div>
        <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Welcome Pack</div>
        <div style="font-size:30px;font-weight:800;margin-top:6px">Welcome, ${esc(first)}! 🎾</div>
        <div style="opacity:.9;margin-top:4px">${esc(academy)}</div>
      </div>
      ${logoChip}
    </div>
    <p style="margin-top:18px">Hi ${esc(first)},</p>
    <p>A warm welcome to ${esc(academy)} — we're really pleased to have you on board. Whether you're brand new to tennis or coming back to it, our job is to help you improve, enjoy your tennis and hit some clear goals along the way.</p>
    <p>${sw.racket
      ? `We coach using a <strong>racket progression system</strong> (like martial arts) — you'll work through clear skills at each racket, earn certificates as you progress, and always know what you're working towards. It keeps things fun, structured and motivating.`
      : `We coach in <strong>colour stages</strong> — you'll work through a clear set of skills at each colour, and always know what you're working towards. It keeps things fun, structured and motivating.`}</p>
    <h2>What happens next</h2>
    <ol><li><strong>Complete the onboarding questions</strong> (page 3) and bring them to your first session — this helps us place you at exactly the right ${sw.noun}.</li><li><strong>First session = assessment &amp; a hit</strong> — relaxed, no pressure, just so we can see your game.</li><li><strong>We agree your goals</strong> and set your starting ${sw.noun} and a simple plan.</li></ol>
    <h2>Handy to know</h2>
    <ul><li>Bring: trainers/tennis shoes, water, and a racket if you have one (we can lend one).</li><li>Wear comfortable sports clothing for the weather.</li><li>Lessons, progress and homework are shared through the Lumio Coach app.</li></ul>
    <p style="margin-top:14px">See you on court,<br/><strong style="font-family:Georgia,serif;font-style:italic;font-size:15px">${esc(coach)}</strong></p>
    <div class="foot"><span>${esc(academy)}</span><span>Welcome pack for ${esc(p.name)}</span></div>
  </div>

  <div class="page">
    <h2 style="margin-top:0">Your starting action plan</h2>
    <div class="accentbox" style="display:flex;align-items:center;gap:12px"><span style="width:40px;height:25px;border-radius:5px;background:${stage.colour};border:1px solid rgba(0,0,0,.25)"></span><div><div style="font-size:16px;font-weight:700">${esc(sw.stage(stage.name))} — ${esc(theme)}</div><div style="font-size:11px;color:#6b7280">Your suggested starting point — confirmed after your first session</div></div></div>
    <h2>Skills you'll work on first</h2><ul>${skills}</ul>
    ${p.goal ? `<h2>Your goal</h2><p>${esc(p.goal)}</p>` : ''}
    ${plan?.welcome ? `<p style="font-size:13px;line-height:1.65">${esc(plan.welcome)}</p>` : ''}
    <h2>First four weeks</h2>
    <table><thead><tr><th style="width:70px">Week</th><th>Focus</th></tr></thead><tbody>
      ${plan?.weeks?.length
        ? plan.weeks.slice(0, 4).map(wk => `<tr><td>${esc(wk.week)}</td><td>${esc(wk.focus)}</td></tr>`).join('')
        : `<tr><td>Week 1</td><td>Assessment &amp; getting to know your game — set your ${sw.noun} and goal</td></tr>
           <tr><td>Week 2</td><td>Foundations of ${esc(theme.toLowerCase())}</td></tr>
           <tr><td>Week 3</td><td>Build &amp; repeat — take the new skills into rallies and games</td></tr>
           <tr><td>Week 4</td><td>First progress check — celebrate the wins and set the next target (${esc(next.name)})</td></tr>`}
    </tbody></table>
    ${plan?.first_session ? `<h2>Your first session</h2><p style="font-size:13px;line-height:1.65">${esc(plan.first_session)}</p>` : ''}
    ${plan?.parent_note ? `<div class="accentbox" style="margin-top:12px"><strong>For parents:</strong> ${esc(plan.parent_note)}</div>` : ''}
    ${plan ? '' : '<p style="font-size:10px;color:#9099ad;margin-top:10px">General starting plan — your coach will tailor it after the first session.</p>'}
    <div class="foot"><span>${esc(academy)}</span><span>${esc(coach)}</span></div>
  </div>

  <div class="page">
    <h2 style="margin-top:0">Onboarding — tell us about your tennis</h2>
    <p style="margin-top:0">Please complete and bring to your first session. This helps us place you at the right ${sw.noun} from day one.</p>
    <table><tbody><tr><td style="width:50%">Player name: ${fill('120px')}</td><td>Date of birth: ${fill('110px')}</td></tr><tr><td>Parent/guardian (if junior): ${fill('100px')}</td><td>Best contact number: ${fill('110px')}</td></tr></tbody></table>
    <h2>Your tennis history</h2>
    <div class="q"><div class="lbl">How long have you been playing tennis?</div>${fill('200px')} years / months</div>
    <div class="q"><div class="lbl">Have you had coaching before? Where, and for how long?</div>${line}${line}</div>
    <div class="q"><div class="lbl">What level have you played at? (club, school, county, ratings)</div>${line}${line}</div>
    <div class="q"><div class="lbl">Do you compete, or would you like to?</div>${line}</div>
    <h2>Your goals</h2>
    <div class="q"><div class="lbl">What are you looking to achieve from these sessions?</div>${line}${line}${line}</div>
    <div class="q"><div class="lbl">Which parts of your game do you most want to improve?</div>${line}${line}</div>
    <h2>Practical</h2>
    <div class="q"><div class="lbl">Which days / times generally suit you?</div>${line}</div>
    <div class="q"><div class="lbl">Any injuries, medical conditions or things we should know?</div>${line}${line}</div>
    <div class="accentbox" style="margin-top:14px"><strong>For the coach:</strong> suggested starting ${sw.noun} after review: ${fill('150px')} &nbsp; Date: ${fill('90px')}</div>
    <div class="foot"><span>${esc(academy)}</span><span>Onboarding · ${esc(p.name)}</span></div>
  </div>
  </body></html>`
  w.document.open(); w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual */ } }, 350)
}
