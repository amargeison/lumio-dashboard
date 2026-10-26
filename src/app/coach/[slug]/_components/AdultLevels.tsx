'use client'

// Adult levels — the academy's own ladder for adult players. Each level has a
// short video (a YouTube or Vimeo link) and a checklist to pass it. The coach
// ticks items off as a player shows them, and moves the player up when the
// checklist is complete. Families see their level, its video and the checklist
// on their page. See lib/coach/adult-levels.ts.

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, currentIdentity, rowsChanged } from '../_lib/coach-db'
import { STARTER_LEVELS, checklistFrom, tidyChecklist, videoEmbed, VIDEO_HELP, levelProgress, ordered, isAdultPlayer, type AdultLevel, type AdultPass } from '@/lib/coach/adult-levels'
import { ukDate } from '@/lib/coach/uk-date'

type LevelRow = AdultLevel & { checklist: unknown }
type Player = { id: string; name: string; category?: string | null; age?: number | null; adult_level_id?: string | null; staff_id?: string | null }
type PassRow = AdultPass & { id: string }

export function AdultLevels({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const levelsT = useCoachTable<LevelRow>('coach_adult_levels')
  const playersT = useCoachTable<Player>('coach_players')
  const passesT = useCoachTable<PassRow>('coach_adult_passes')
  const [isHead, setIsHead] = useState(true)
  useEffect(() => { let on = true; void currentIdentity().then(me => { if (on) setIsHead(me?.isHead ?? true) }).catch(() => {}); return () => { on = false } }, [])
  const levels = useMemo(() => ordered(levelsT.rows.map(l => ({ ...l, checklist: tidyChecklist(l.checklist) }))), [levelsT.rows])
  const adults = useMemo(() => playersT.rows.filter(isAdultPlayer).sort((a, b) => a.name.localeCompare(b.name)), [playersT.rows])
  const [openPlayer, setOpenPlayer] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)   // level id, or 'new'
  const [watching, setWatching] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState<'all' | 'on' | 'none'>('all')

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }
  const btn: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
  const primary: CSSProperties = { ...btn, border: 0, background: accent.hex, color: T.btnText }
  const fail = (e: unknown, what: string) => setErr(e instanceof Error && e.message ? e.message : what)

  const useStarter = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try { for (const [i, l] of STARTER_LEVELS.entries()) await dbInsert('coach_adult_levels', { position: i + 1, name: l.name, summary: l.summary, checklist: l.checklist, video_url: null }) }
    catch (e) { fail(e, 'The levels could not be set up.') }
    setBusy(false)
  }

  const levelOf = (p: Player) => levels.find(l => l.id === p.adult_level_id) || null
  const owner = (p: Player) => (p.staff_id ? { staff_id: p.staff_id } : {})
  const toggle = async (p: Player, level: AdultLevel, itemId: string, on: boolean) => {
    setErr('')
    try {
      if (on) await dbInsert('coach_adult_passes', { player_id: p.id, level_id: level.id, item_id: itemId, passed_on: ukDate(), ...owner(p) })
      else for (const x of passesT.rows.filter(r => r.player_id === p.id && r.level_id === level.id && r.item_id === itemId)) await dbRemove('coach_adult_passes', x.id)
    } catch (e) { fail(e, 'That was not saved.') }
  }
  const setLevel = async (p: Player, levelId: string | null, ask?: string) => {
    if (ask && !confirm(ask)) return
    setErr('')
    try { await dbUpdate('coach_players', p.id, { adult_level_id: levelId }) } catch (e) { fail(e, 'That was not saved.') }
  }

  const visible = adults.filter(p => show === 'all' || (show === 'on' ? !!levelOf(p) : !levelOf(p)))

  return (
    <div data-testid="adult-levels" style={{ fontFamily: FONT }}>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.text3, lineHeight: 1.55, maxWidth: 760 }}>
        Your own levels for adult players. Each one has a short video and a checklist to pass it. Tick items off as a player shows them; when the checklist is complete, move them up. Players see their level, its video and the checklist on their page.
      </p>
      {err && <div role="alert" style={{ background: `${T.bad}14`, border: `1px solid ${T.bad}44`, borderRadius: 9, padding: '9px 12px', fontSize: 12.5, color: T.bad, marginBottom: 12 }}>{err}</div>}

      {levels.length === 0 ? (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Set up your adult levels</div>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, lineHeight: 1.55, maxWidth: 640 }}>
            Start from six levels (Starter, Improver, Club, Club+, Team and Advanced), each with a five-item checklist, and change anything to match how you coach. Or start with one level and build your own.
          </div>
          {isHead ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={useStarter} disabled={busy} style={primary}>{busy ? 'Setting up…' : 'Use the six starter levels'}</button>
              <button onClick={() => setEditing('new')} style={btn}>Start with one level</button>
            </div>
          ) : <div style={{ fontSize: 12, color: T.text3, marginTop: 10 }}>Your head coach sets up the levels.</div>}
          {editing === 'new' && <LevelEditor T={T} accent={accent} position={1} onDone={() => setEditing(null)} onError={setErr} />}
        </div>
      ) : (
        <>
          {/* ── Players ─────────────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Adult players</div>
              <span style={{ fontSize: 11, color: T.text3 }}>{adults.filter(p => levelOf(p)).length} of {adults.length} on a level</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {([['all', 'Everyone'], ['on', 'On a level'], ['none', 'No level yet']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setShow(k)} style={{ ...btn, padding: '3px 9px', fontSize: 11, borderColor: show === k ? accent.hex : T.border, color: show === k ? accent.hex : T.text3, background: show === k ? accent.dim : 'transparent' }}>{l}</button>
                ))}
              </span>
            </div>
            {visible.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>{adults.length ? 'Nobody here.' : 'No adult players on your roster yet. A player counts as an adult when their category is Adult or they are 18 or over.'}</div> : visible.map(p => {
              const lv = levelOf(p)
              const idx = lv ? levels.findIndex(l => l.id === lv.id) : -1
              const next = idx >= 0 ? levels[idx + 1] : undefined
              const pr = lv ? levelProgress(lv, passesT.rows, p.id) : null
              const open = openPlayer === p.id
              return (
                <div key={p.id} data-testid="adult-player" style={{ borderTop: `1px solid ${T.border}`, padding: '9px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ flex: '1 1 140px', fontSize: 13, color: T.text, fontWeight: 600 }}>{p.name}</span>
                    <select value={lv?.id || ''} aria-label={`Level for ${p.name}`} onChange={e => void setLevel(p, e.target.value || null)} style={{ background: T.panel2, color: T.text2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 8px', fontSize: 12, fontFamily: FONT }}>
                      <option value="">No level yet</option>
                      {levels.map((l, i) => <option key={l.id} value={l.id}>{i + 1}. {l.name}</option>)}
                    </select>
                    {pr && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: 130 }}>
                        <span style={{ flex: 1, height: 6, borderRadius: 3, background: T.hover, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pr.total ? (pr.done / pr.total) * 100 : 0}%`, background: pr.ready ? T.good : accent.hex }} /></span>
                        <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: pr.ready ? T.good : T.text3 }}>{pr.done}/{pr.total}</span>
                      </span>
                    )}
                    {lv && <button onClick={() => setOpenPlayer(open ? null : p.id)} aria-expanded={open} style={btn}>{open ? 'Close' : 'Checklist'}</button>}
                  </div>
                  {open && lv && pr && (
                    <div style={{ marginTop: 9, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 6 }}>{lv.name}{lv.summary ? ` · ${lv.summary}` : ''}</div>
                      {lv.checklist.length === 0 ? <div style={{ fontSize: 12, color: T.text3 }}>This level has no checklist yet. Add one under Levels below.</div> : lv.checklist.map(it => {
                        const on = pr.passed.has(it.id)
                        const when = passesT.rows.find(r => r.player_id === p.id && r.level_id === lv.id && r.item_id === it.id)?.passed_on
                        return (
                          <label key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '5px 0', fontSize: 12.5, color: on ? T.text : T.text2, cursor: 'pointer' }}>
                            <input type="checkbox" checked={on} onChange={e => void toggle(p, lv, it.id, e.target.checked)} style={{ marginTop: 2 }} />
                            <span style={{ flex: 1 }}>{it.text}</span>
                            {on && when && <span style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap' }}>{new Date(`${when}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</span>}
                          </label>
                        )
                      })}
                      {pr.ready && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12.5, color: T.good, fontWeight: 700 }}>✓ {lv.name} passed</span>
                          {next
                            ? <button onClick={() => void setLevel(p, next.id, `Move ${p.name} up to ${next.name}?`)} style={primary}>Move up to {next.name}</button>
                            : <span style={{ fontSize: 12, color: T.text3 }}>That is the top level.</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Levels ──────────────────────────────────────────────────── */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Levels</div>
              {!isHead && <span style={{ fontSize: 11, color: T.text3 }}>Your head coach changes these.</span>}
            </div>
            {levels.map((l, i) => {
              const vid = videoEmbed(l.video_url)
              const count = adults.filter(p => p.adult_level_id === l.id).length
              return (
                <div key={l.id} data-testid="adult-level" style={{ borderTop: `1px solid ${T.border}`, padding: '11px 0' }}>
                  {editing === l.id ? (
                    <LevelEditor T={T} accent={accent} level={l} position={l.position} onDone={() => setEditing(null)} onError={setErr} />
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: accent.hex, fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{l.name}</span>
                        <span style={{ fontSize: 11.5, color: T.text3 }}>{count} player{count === 1 ? '' : 's'} · {l.checklist.length} to pass</span>
                        {isHead && (
                          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            <button onClick={() => setEditing(l.id)} style={btn}>Edit</button>
                            <button disabled={i === 0} aria-label={`Move ${l.name} up`} onClick={() => void swap(levels, i, i - 1).catch(e => fail(e, 'The order was not saved.'))} style={{ ...btn, opacity: i === 0 ? 0.4 : 1 }}>↑</button>
                            <button disabled={i === levels.length - 1} aria-label={`Move ${l.name} down`} onClick={() => void swap(levels, i, i + 1).catch(e => fail(e, 'The order was not saved.'))} style={{ ...btn, opacity: i === levels.length - 1 ? 0.4 : 1 }}>↓</button>
                            <button onClick={() => { if (confirm(`Delete the ${l.name} level?${count ? ` The ${count} player${count === 1 ? '' : 's'} on it will have no level, and their ticks for it are deleted.` : ''}`)) void dbRemove('coach_adult_levels', l.id).then(() => rowsChanged('coach_players', 'coach_adult_passes')).catch(e => fail(e, 'The level was not deleted.')) }} style={{ ...btn, color: T.bad }}>Delete</button>
                          </span>
                        )}
                      </div>
                      {l.summary && <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4 }}>{l.summary}</div>}
                      <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <ul style={{ margin: 0, paddingLeft: 18, flex: '1 1 260px' }}>
                          {l.checklist.map(it => <li key={it.id} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{it.text}</li>)}
                          {l.checklist.length === 0 && <li style={{ fontSize: 12.5, color: T.text3, listStyle: 'none', marginLeft: -18 }}>No checklist yet.</li>}
                        </ul>
                        <div style={{ flex: '0 1 300px', minWidth: 0 }}>
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
                </div>
              )
            })}
            {isHead && (editing === 'new'
              ? <LevelEditor T={T} accent={accent} position={(levels[levels.length - 1]?.position || 0) + 1} onDone={() => setEditing(null)} onError={setErr} />
              : <button onClick={() => setEditing('new')} style={{ ...btn, marginTop: 10, borderStyle: 'dashed', color: accent.hex }}>+ Add a level</button>)}
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
