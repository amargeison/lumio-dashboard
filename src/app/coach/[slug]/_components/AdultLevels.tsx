'use client'

// Adult levels — the academy's own ladder for adult players. Each level has a
// short video (a YouTube or Vimeo link) and a checklist to pass it. The coach
// ticks items off as a player shows them, and moves the player up when the
// checklist is complete. Families see their level, its video and the checklist
// on their page. See lib/coach/adult-levels.ts.
//
// Laid out like the junior rackets beside it (LiveRacketProgression.tsx): the
// ladder as coloured cards, the chosen level opened underneath with its
// checklist as cards, then every adult on a matrix of the levels. The colours
// come from the level's place on the ladder (adultColour), never the junior
// colours, so an adult never looks like a junior on Blue.
//
// It lives in Player Development (the source of truth, there for every
// academy). Racket Progression shows the same page with readOnly: the ladder,
// the levels and where everyone is, with nothing to change there.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, currentIdentity, rowsChanged } from '../_lib/coach-db'
import { STARTER_LEVELS, checklistFrom, tidyChecklist, videoEmbed, VIDEO_HELP, levelProgress, ordered, isAdultPlayer, adultColour, type AdultLevel, type AdultPass } from '@/lib/coach/adult-levels'
import { ukDate } from '@/lib/coach/uk-date'
import { avatarSrc } from '@/lib/avatar'
import { askConfirm } from '../_lib/ask'

type LevelRow = AdultLevel & { checklist: unknown }
type Player = { id: string; name: string; category?: string | null; age?: number | null; adult_level_id?: string | null; staff_id?: string | null; avatar_url?: string | null }
type PassRow = AdultPass & { id: string }

const initials = (n: string) => (n || '').trim().split(/\s+/).map(w => Array.from(w).find(ch => /[\p{L}\p{N}]/u.test(ch)) || '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
const shortDay = (d?: string | null) => d ? new Date(`${String(d).slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : ''

/** A level's colour as a small bar, the way a racket colour is drawn. */
export function LevelSwatch({ colour, w = 20, h = 12, T }: { colour: string | null; w?: number; h?: number; T: ThemeTokens }) {
  return <span aria-hidden style={{ display: 'inline-block', width: w, height: h, borderRadius: Math.min(5, h / 3), background: colour || 'transparent', border: `1px solid ${colour ? 'rgba(128,128,128,0.4)' : T.border}`, flexShrink: 0 }} />
}

export function AdultLevels({ T, accent, readOnly = false, onOpenDevelopment }: { T: ThemeTokens; accent: AccentTokens; readOnly?: boolean; onOpenDevelopment?: () => void }) {
  const levelsT = useCoachTable<LevelRow>('coach_adult_levels')
  const playersT = useCoachTable<Player>('coach_players')
  const passesT = useCoachTable<PassRow>('coach_adult_passes')
  const [headSeat, setIsHead] = useState(true)
  useEffect(() => { let on = true; void currentIdentity().then(me => { if (on) setIsHead(me?.isHead ?? true) }).catch(() => {}); return () => { on = false } }, [])
  // Read-only (Racket Progression): nothing here changes a level or a player.
  const isHead = headSeat && !readOnly
  const levels = useMemo(() => ordered(levelsT.rows.map(l => ({ ...l, checklist: tidyChecklist(l.checklist) }))), [levelsT.rows])
  const adults = useMemo(() => playersT.rows.filter(isAdultPlayer).sort((a, b) => a.name.localeCompare(b.name)), [playersT.rows])
  const [openPlayer, setOpenPlayer] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)   // level id, or 'new'
  const [watching, setWatching] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState<'all' | 'on' | 'none'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const openIdx = Math.max(0, levels.findIndex(l => l.id === openId))
  const openLevel = levels[openIdx] || null

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }
  const btn: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
  const primary: CSSProperties = { ...btn, border: 0, background: accent.hex, color: T.btnText }
  const fail = (e: unknown, what: string) => setErr(e instanceof Error && e.message ? e.message : what)
  const sectionHead = (title: string, right?: ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</div>
      {right && <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{right}</div>}
    </div>
  )

  const useStarter = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try { for (const [i, l] of STARTER_LEVELS.entries()) await dbInsert('coach_adult_levels', { position: i + 1, name: l.name, summary: l.summary, checklist: l.checklist, video_url: null }) }
    catch (e) { fail(e, 'The levels could not be set up.') }
    setBusy(false)
  }

  const idxOf = (p: Player) => levels.findIndex(l => l.id === p.adult_level_id)
  const owner = (p: Player) => (p.staff_id ? { staff_id: p.staff_id } : {})
  const toggle = async (p: Player, level: AdultLevel, itemId: string, on: boolean) => {
    setErr('')
    try {
      if (on) await dbInsert('coach_adult_passes', { player_id: p.id, level_id: level.id, item_id: itemId, passed_on: ukDate(), ...owner(p) })
      else for (const x of passesT.rows.filter(r => r.player_id === p.id && r.level_id === level.id && r.item_id === itemId)) await dbRemove('coach_adult_passes', x.id)
    } catch (e) { fail(e, 'That was not saved.') }
  }
  const setLevel = async (p: Player, levelId: string | null) => {
    setErr('')
    try { await dbUpdate('coach_players', p.id, { adult_level_id: levelId }) } catch (e) { fail(e, 'That was not saved.') }
  }
  /** Moving up one level is asked once; moving down or skipping levels says so. Ticks are kept either way. */
  const moveTo = async (p: Player, to: number) => {
    const from = idxOf(p)
    if (to === from) return
    const target = levels[to]
    if (!target) return
    const question = from < 0 ? `Put ${p.name} on ${to + 1}. ${target.name}?`
      : to < from ? `Move ${p.name} back down from ${levels[from].name} to ${target.name}?\n\nTheir ticks are kept.`
      : to > from + 1 ? `Move ${p.name} from ${levels[from].name} straight to ${target.name}, skipping ${levels.slice(from + 1, to).map(l => l.name).join(', ')}?`
      : `Move ${p.name} up from ${levels[from].name} to ${target.name}?`
    if (await askConfirm(question, { yes: from < 0 ? 'Start' : 'Move' })) await setLevel(p, target.id)
  }

  const visible = adults.filter(p => show === 'all' || (show === 'on' ? idxOf(p) >= 0 : idxOf(p) < 0))
  const totalItems = levels.reduce((n, l) => n + l.checklist.length, 0)

  return (
    <div data-testid="adult-levels" style={{ fontFamily: FONT }}>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.text3, lineHeight: 1.55, maxWidth: 760 }}>
        {readOnly
          ? 'Your adult levels and where every adult is on them. The levels, their checklists and who is on which level are set in Player Development.'
          : 'Your own levels for adult players. Each one has a short video and a checklist to pass it. Tick items off as a player shows them; when the checklist is complete, move them up. Players see their level, its video and the checklist on their page.'}
      </p>
      {readOnly && onOpenDevelopment && (
        <button onClick={onOpenDevelopment} style={{ ...btn, marginBottom: 14, border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, fontWeight: 700 }}>Change levels and tick checklists in Player Development →</button>
      )}
      {err && <div role="alert" style={{ background: `${T.bad}14`, border: `1px solid ${T.bad}44`, borderRadius: 9, padding: '9px 12px', fontSize: 12.5, color: T.bad, marginBottom: 12 }}>{err}</div>}

      {levels.length === 0 ? (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Set up your adult levels</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
            {STARTER_LEVELS.map((l, i) => <span key={l.name} title={l.name} style={{ flex: '0 0 34px', height: 12, borderRadius: 3, background: adultColour(i), border: '1px solid rgba(128,128,128,0.4)' }} />)}
          </div>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 10, lineHeight: 1.55, maxWidth: 640 }}>
            Start from six levels (Starter, Improver, Club, Club+, Team and Advanced), each with a five-item checklist, and change anything to match how you coach. Or start with one level and build your own.
          </div>
          {isHead ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={useStarter} disabled={busy} style={primary}>{busy ? 'Setting up…' : 'Use the six starter levels'}</button>
              <button onClick={() => setEditing('new')} style={btn}>Start with one level</button>
            </div>
          ) : <div style={{ fontSize: 12, color: T.text3, marginTop: 10 }}>{readOnly ? 'Levels are set up in Player Development → Adult levels.' : 'Your head coach sets up the levels.'}</div>}
          {editing === 'new' && <LevelEditor T={T} accent={accent} position={1} onDone={() => setEditing(null)} onError={setErr} />}
        </div>
      ) : (
        <>
          {/* ── The ladder ──────────────────────────────────────────────── */}
          <div style={card}>
            {sectionHead('The ladder', <span style={{ fontFamily: FONT_MONO }}>{levels[0].name} → {levels[levels.length - 1].name} · {totalItems} to pass</span>)}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {levels.map((l, i) => {
                const on = openLevel?.id === l.id && editing !== 'new'
                const count = adults.filter(p => p.adult_level_id === l.id).length
                const c = adultColour(i)
                return (
                  <button key={l.id} data-testid="adult-level" onClick={() => { setOpenId(l.id); if (editing && editing !== l.id) setEditing(null) }} aria-pressed={on}
                    style={{ appearance: 'none', fontFamily: FONT, flex: '1 1 110px', cursor: 'pointer', padding: '10px 8px', borderRadius: 8, background: on ? accent.dim : T.panel2, border: `1px solid ${on ? accent.border : T.border}`, textAlign: 'center', minWidth: 0 }}>
                    <div style={{ height: 22, borderRadius: 4, background: c, border: '1px solid rgba(128,128,128,0.4)', marginBottom: 6 }} />
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text, overflowWrap: 'anywhere' }}>{i + 1}. {l.name}</div>
                    <div style={{ fontSize: 9.5, color: T.text3, marginTop: 1, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 26 }}>{l.summary || `${l.checklist.length} to pass`}</div>
                    <div style={{ marginTop: 5, display: 'inline-block', fontSize: 9, fontWeight: 700, color: c, background: `${c}1f`, border: `1px solid ${c}44`, padding: '2px 7px', borderRadius: 999, lineHeight: 1.3 }}>{count} player{count === 1 ? '' : 's'}</div>
                  </button>
                )
              })}
              {isHead && (
                <button onClick={() => setEditing('new')} aria-pressed={editing === 'new'}
                  style={{ appearance: 'none', fontFamily: FONT, flex: '1 1 110px', cursor: 'pointer', padding: '10px 8px', borderRadius: 8, background: editing === 'new' ? accent.dim : 'transparent', border: `1px dashed ${editing === 'new' ? accent.hex : T.border}`, color: accent.hex, fontSize: 12, fontWeight: 700, minHeight: 96 }}>
                  + Add a level
                </button>
              )}
            </div>
            {!isHead && !readOnly && <div style={{ fontSize: 11, color: T.text3, marginTop: 10 }}>Your head coach changes the levels.</div>}
          </div>

          {/* ── The chosen level, opened ────────────────────────────────── */}
          <div style={card}>
            {editing === 'new' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <LevelSwatch colour={adultColour(levels.length)} w={40} h={26} T={T} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>New level · {levels.length + 1}</div>
                </div>
                <LevelEditor T={T} accent={accent} position={(levels[levels.length - 1]?.position || 0) + 1} onDone={() => setEditing(null)} onError={setErr} />
              </>
            ) : openLevel && (() => {
              const l = openLevel, i = openIdx
              const vid = videoEmbed(l.video_url)
              const onIt = adults.filter(p => p.adult_level_id === l.id)
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <LevelSwatch colour={adultColour(i)} w={40} h={26} T={T} />
                    <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, overflowWrap: 'anywhere' }}>{i + 1}. {l.name}</div>
                      <div style={{ fontSize: 11.5, color: T.text3 }}>Level {i + 1} of {levels.length}{l.summary ? ` · ${l.summary}` : ''}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '4px 10px' }}>{l.checklist.length} to pass</div>
                  </div>
                  {editing === l.id ? (
                    <LevelEditor T={T} accent={accent} level={l} position={l.position} onDone={() => setEditing(null)} onError={setErr} />
                  ) : (
                    <>
                      {isHead && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                          <button onClick={() => setEditing(l.id)} style={btn}>Edit level</button>
                          <button disabled={i === 0} aria-label={`Move ${l.name} earlier`} onClick={() => void swap(levels, i, i - 1).catch(e => fail(e, 'The order was not saved.'))} style={{ ...btn, opacity: i === 0 ? 0.4 : 1 }}>← Earlier</button>
                          <button disabled={i === levels.length - 1} aria-label={`Move ${l.name} later`} onClick={() => void swap(levels, i, i + 1).catch(e => fail(e, 'The order was not saved.'))} style={{ ...btn, opacity: i === levels.length - 1 ? 0.4 : 1 }}>Later →</button>
                          <button onClick={async () => { const count = onIt.length; if (await askConfirm(`Delete the ${l.name} level?${count ? ` The ${count} player${count === 1 ? '' : 's'} on it will have no level, and their ticks for it are deleted.` : ''}`, { yes: 'Delete' })) { setOpenId(null); void dbRemove('coach_adult_levels', l.id).then(() => rowsChanged('coach_players', 'coach_adult_passes')).catch(e => fail(e, 'The level was not deleted.')) } }} style={{ ...btn, color: T.bad, marginLeft: 'auto' }}>Delete</button>
                        </div>
                      )}
                      {l.checklist.length === 0
                        ? <div style={{ fontSize: 12.5, color: T.text3, marginBottom: 12 }}>No checklist yet.{isHead ? ' Edit the level to add one.' : ''}</div>
                        : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, max(160px, 40%)), 1fr))', gap: 10, marginBottom: 12 }}>
                            {l.checklist.map(it => {
                              const passedBy = onIt.filter(p => passesT.rows.some(r => r.player_id === p.id && r.level_id === l.id && r.item_id === it.id)).length
                              return (
                                <div key={it.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{it.text}</div>
                                  <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{onIt.length ? `${passedBy} of ${onIt.length} on this level passed` : 'Nobody on this level yet'}</div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.text3, marginBottom: 6 }}>On this level</div>
                          {onIt.length === 0 ? <div style={{ fontSize: 12, color: T.text3 }}>Nobody yet.</div> : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {onIt.map(p => {
                                const pr = levelProgress(l, passesT.rows, p.id)
                                return <span key={p.id} style={{ fontSize: 11.5, color: T.text, background: T.panel2, border: `1px solid ${pr.ready ? `${T.good}66` : T.border}`, borderRadius: 999, padding: '3px 10px' }}>{p.name} <span style={{ fontFamily: FONT_MONO, color: pr.ready ? T.good : T.text3 }}>{pr.done}/{pr.total}</span></span>
                              })}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: '0 1 320px', minWidth: 0 }}>
                          {vid ? (
                            watching === l.id ? (
                              <div>
                                <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 9, overflow: 'hidden', background: '#000' }}>
                                  <iframe src={vid.embed} title={`${l.name} video`} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                                </div>
                                <button onClick={() => setWatching(null)} style={{ ...btn, marginTop: 6 }}>Close video</button>
                              </div>
                            ) : <button onClick={() => setWatching(l.id)} style={btn}>▶ Watch the {vid.provider === 'youtube' ? 'YouTube' : 'Vimeo'} video</button>
                          ) : <span style={{ fontSize: 12, color: T.text3 }}>{l.video_url ? 'That video link is not a YouTube or Vimeo link.' : 'No video yet.'}</span>}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )
            })()}
          </div>

          {/* ── Adult players, on a matrix of the levels ────────────────── */}
          <div style={card}>
            {sectionHead('Adult players', (
              <>
                <span>{adults.filter(p => idxOf(p) >= 0).length} of {adults.length} on a level</span>
                {([['all', 'Everyone'], ['on', 'On a level'], ['none', 'No level yet']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setShow(k)} style={{ ...btn, padding: '3px 9px', fontSize: 11, borderColor: show === k ? accent.hex : T.border, color: show === k ? accent.hex : T.text3, background: show === k ? accent.dim : 'transparent' }}>{l}</button>
                ))}
              </>
            ))}
            {visible.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>{adults.length ? 'Nobody here.' : 'No adult players on your roster yet. A player counts as an adult when their category is Adult or they are 18 or over.'}</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 300 + levels.length * 38 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Player</th>
                      {levels.map((l, i) => <th key={l.id} style={{ padding: '6px 4px' }}><div title={`${i + 1}. ${l.name}`} style={{ width: 20, height: 12, borderRadius: 2, background: adultColour(i), border: '1px solid rgba(128,128,128,0.4)', margin: '0 auto' }} /></th>)}
                      <th style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', textAlign: 'left' }}>Now</th>
                      <th style={{ fontSize: 10.5, color: T.text3, fontWeight: 600, padding: '6px 8px', textTransform: 'uppercase', textAlign: 'right' }}>Checklist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(p => {
                      const cur = idxOf(p)
                      const lv = cur >= 0 ? levels[cur] : null
                      const pr = lv ? levelProgress(lv, passesT.rows, p.id) : null
                      const next = cur >= 0 ? levels[cur + 1] : undefined
                      const open = openPlayer === p.id && !!lv
                      return [
                        <tr key={p.id} data-testid="adult-player" style={{ borderTop: `1px solid ${T.border}` }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {p.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={avatarSrc(p.avatar_url)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                : <span style={{ width: 24, height: 24, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, border: `1px solid ${accent.border}`, flexShrink: 0 }}>{initials(p.name)}</span>}
                              <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{p.name}</span>
                            </div>
                          </td>
                          {levels.map((l, bi) => {
                            const isDone = cur >= 0 && bi < cur
                            const isNow = bi === cur
                            return (
                              <td key={l.id} style={{ textAlign: 'center', padding: '4px 2px' }}>
                                <button className="cm-tap" onClick={readOnly ? undefined : () => void moveTo(p, bi)} disabled={readOnly}
                                  title={isNow ? `${p.name} is on ${l.name} — ${pr?.done}/${pr?.total} passed` : `Move ${p.name} to ${l.name}`}
                                  aria-label={isNow ? `${p.name} is on ${l.name}` : `Move ${p.name} to ${l.name}`}
                                  style={{ appearance: 'none', cursor: readOnly ? 'default' : 'pointer', fontFamily: FONT, width: 34, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', margin: '0 auto',
                                    border: `1px solid ${isNow ? accent.hex : isDone ? `${T.good}44` : 'transparent'}`,
                                    background: isNow ? accent.dim : isDone ? `${T.good}14` : 'transparent',
                                    color: isNow ? accent.hex : isDone ? T.good : T.text4, fontSize: isNow ? 9.5 : 12, fontWeight: 800 }}>
                                  {isDone ? '✓' : isNow ? <span style={{ fontFamily: FONT_MONO }}>{pr?.done}/{pr?.total}</span> : '·'}
                                </button>
                              </td>
                            )
                          })}
                          <td style={{ padding: '8px 10px' }}>
                            {lv ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <LevelSwatch colour={adultColour(cur)} w={14} h={14} T={T} />{lv.name}
                              </span>
                            ) : <span style={{ fontSize: 11.5, color: T.text3, whiteSpace: 'nowrap' }}>No level yet</span>}
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                            {readOnly ? (
                              <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', color: pr?.ready ? T.good : T.text3 }}>{!lv ? '—' : pr?.ready ? '✓ Ready to move up' : `${pr?.done}/${pr?.total} passed`}</span>
                            ) : lv ? (
                              <button onClick={() => setOpenPlayer(open ? null : p.id)} aria-expanded={open}
                                style={{ ...btn, padding: '4px 9px', fontSize: 11, whiteSpace: 'nowrap', border: `1px solid ${pr?.ready ? accent.hex : T.border}`, background: pr?.ready ? accent.hex : 'transparent', color: pr?.ready ? T.btnText : accent.hex }}>
                                {open ? 'Close' : pr?.ready ? '✓ Ready to move up' : 'Tick off'}
                              </button>
                            ) : <button onClick={() => void moveTo(p, 0)} style={{ ...btn, padding: '4px 9px', fontSize: 11, whiteSpace: 'nowrap', color: accent.hex }}>▶ Start on {levels[0].name}</button>}
                          </td>
                        </tr>,
                        open && !readOnly && lv && pr ? (
                          <tr key={`${p.id}-list`}>
                            <td colSpan={levels.length + 3} style={{ padding: '0 10px 10px' }}>
                              <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${adultColour(cur)}`, borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 6 }}>{cur + 1}. {lv.name}{lv.summary ? ` · ${lv.summary}` : ''}</div>
                                {lv.checklist.length === 0 ? <div style={{ fontSize: 12, color: T.text3 }}>This level has no checklist yet.</div> : lv.checklist.map(it => {
                                  const on = pr.passed.has(it.id)
                                  const when = passesT.rows.find(r => r.player_id === p.id && r.level_id === lv.id && r.item_id === it.id)?.passed_on
                                  return (
                                    <label key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '5px 0', fontSize: 12.5, color: on ? T.text : T.text2, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={on} onChange={e => void toggle(p, lv, it.id, e.target.checked)} style={{ marginTop: 2, accentColor: accent.hex }} />
                                      <span style={{ flex: 1 }}>{it.text}</span>
                                      {on && when && <span style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap' }}>{shortDay(when)}</span>}
                                    </label>
                                  )
                                })}
                                {pr.ready && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 12.5, color: T.good, fontWeight: 700 }}>✓ {lv.name} passed</span>
                                    {next
                                      ? <button onClick={async () => { if (await askConfirm(`Move ${p.name} up to ${next.name}?`, { yes: 'Move up' })) await setLevel(p, next.id) }} style={primary}>Move up to {next.name}</button>
                                      : <span style={{ fontSize: 12, color: T.text3 }}>That is the top level.</span>}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null,
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: T.good, fontWeight: 800 }}>✓</span> level passed</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700 }}>3/5</span> checklist on the level they are on</span>
              <span>{readOnly ? 'Levels are set in Player Development' : <>Tap any level in a player&rsquo;s row to move them onto it — you are asked first</>}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

async function swap(levels: AdultLevel[], a: number, b: number) {
  const x = levels[a], y = levels[b]
  if (!x || !y) return
  // Positions are rewritten for the whole list, so two levels never share one.
  const order = levels.map(l => l.id)
  ;[order[a], order[b]] = [order[b], order[a]]
  for (const [i, id] of order.entries()) {
    const l = levels.find(z => z.id === id)!
    if (l.position !== i + 1) await dbUpdate('coach_adult_levels', id, { position: i + 1 })
  }
}

function LevelEditor({ T, accent, level, position, onDone, onError }: { T: ThemeTokens; accent: AccentTokens; level?: AdultLevel; position: number; onDone: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState(level?.name || '')
  const [summary, setSummary] = useState(level?.summary || '')
  const [video, setVideo] = useState(level?.video_url || '')
  const [items, setItems] = useState((level?.checklist || []).map(i => i.text).join('\n'))
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const input: CSSProperties = { width: '100%', boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.text3, display: 'block', marginBottom: 4 }
  const vidOk = !video.trim() || !!videoEmbed(video)

  const save = async () => {
    if (busy) return
    if (!name.trim()) { setMsg('Give the level a name.'); return }
    if (!vidOk) { setMsg('That video link is not one Lumio can play. Use a YouTube or Vimeo link starting https://'); return }
    setBusy(true); setMsg('')
    const row = { name: name.trim().slice(0, 60), summary: summary.trim().slice(0, 300) || null, video_url: video.trim() || null, checklist: checklistFrom(items, level?.checklist || []) }
    try {
      if (level) await dbUpdate('coach_adult_levels', level.id, row)
      else await dbInsert('coach_adult_levels', { ...row, position })
      onDone()
    } catch (e) { onError(e instanceof Error ? e.message : 'The level was not saved.'); setBusy(false) }
  }

  return (
    <div data-testid="level-editor" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: T.panel2, border: `1px solid ${accent.hex}55`, borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <label><span style={lbl}>Name</span><input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Club" style={input} /></label>
        <label><span style={lbl}>Video link</span><input value={video} onChange={e => setVideo(e.target.value)} placeholder="https://youtu.be/…" style={{ ...input, borderColor: vidOk ? T.border : T.bad }} /></label>
      </div>
      <div style={{ fontSize: 11, color: vidOk ? T.text3 : T.bad, marginTop: -4 }}>{vidOk ? VIDEO_HELP : 'Use a YouTube or Vimeo link starting https://'}</div>
      <label><span style={lbl}>What this level is about</span><input value={summary} onChange={e => setSummary(e.target.value)} maxLength={300} placeholder="Holding your own in club doubles." style={input} /></label>
      <label><span style={lbl}>Checklist to pass (one per line)</span><textarea value={items} onChange={e => setItems(e.target.value)} rows={Math.max(4, items.split('\n').length + 1)} placeholder={'Second serve with spin, 7 out of 10\nReturn of serve back deep, 6 out of 10'} style={{ ...input, resize: 'vertical', lineHeight: 1.55 }} /></label>
      {level && <div style={{ fontSize: 11, color: T.text3, marginTop: -4 }}>Ticks stay on items whose words you leave as they are. Rewording an item starts it again.</div>}
      {msg && <div role="alert" style={{ fontSize: 12, color: T.bad }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={busy} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{busy ? 'Saving…' : level ? 'Save level' : 'Add level'}</button>
        <button onClick={onDone} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
      </div>
    </div>
  )
}
