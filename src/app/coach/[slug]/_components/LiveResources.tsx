'use client'

// Live Resource Centre — the demo over real data. Tabs by category, cards with
// format / level / racket / tags and a live action (Watch video / Open pdf…),
// plus Add resource. The Lumio starter library is loaded via onboarding or
// Settings; an empty library still shows the tabs.

import { useRef, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { stageWords } from '../_lib/stage-words'
import { useCoachTable, RACKET_STAGES } from '../_lib/coach-db'
import { isPrintable, openPrintable } from '../_lib/resource-printables'
import { DrillLibrary } from './DrillLibrary'
import { useCoachSettings } from '../_lib/use-settings'
import { isLumioResource } from '../_lib/lumio-resources'
import { resourceHref, resourceFileName, isResourceFile, normaliseWebLink, RESOURCE_FILE_ACCEPT, RESOURCE_FILE_MAX_MB, RESOURCE_FILE_TOO_BIG, RESOURCE_FILE_PREFIX } from '@/lib/coach/resource-files'
import { invalidateCoachTable, sb } from '../_lib/coach-db'
import { useAskBeforeClose } from '../_lib/ask-before-close'

// Upload a file for a resource. With an id it is attached to that resource
// straight away; without one (a resource still being written) the caller keeps
// the returned "file:…" url and saves it with the rest of the form.
async function uploadResourceFile(file: File, resourceId?: string): Promise<string> {
  // Said at once, before a second of uploading: the same limit the server keeps.
  if (file.size > RESOURCE_FILE_MAX_MB * 1048576) throw new Error(RESOURCE_FILE_TOO_BIG)
  const fd = new FormData()
  fd.append('file', file)
  if (resourceId) fd.append('resourceId', resourceId)
  const r = await fetch('/api/coach/resources/file', { method: 'POST', body: fd })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || !d.url) throw new Error(d.error || 'Could not upload that file.')
  return d.url as string
}
import { BookShelf, RecommendModal, type Rec } from './BookShelf'

// Hand back uploaded files that are finished with — the file of a deleted
// resource, one replaced or taken off in the form, one uploaded and then
// cancelled. They used to stay in storage for good. The server removes only
// those that no resource still uses, so offering one that is in use is harmless.
function tidyResourceFiles(urls: (string | null | undefined)[]) {
  const paths = [...new Set(urls.filter(isResourceFile).map(u => String(u).slice(RESOURCE_FILE_PREFIX.length)))]
  if (!paths.length) return
  void fetch('/api/coach/resources/file', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths }) })
    .catch(() => { /* a file left behind is tidied the next time it is offered */ })
}

type Res = { id: string; title: string; category?: string | null; format?: string | null; level?: string | null; duration?: string | null; racket?: string | null; tags?: string | null; url?: string | null; notes?: string | null; given_only?: boolean | null }
// "Guides" is Lumio's own written material — the parent guides, the cheat
// sheets, the reading notes. "Books" is a shelf of real published books, which
// is what a coach means when they say "read this". They were the same tab, and
// the result was a Books tab full of worksheets.
const TABS: [string, string][] = [['all', 'All'], ['Drill Library', 'Drill Library'], ['Drill', 'Drill'], ['Technique', 'Technique'], ['Training plan', 'Training plan'], ['Fitness', 'Fitness'], ['Mental', 'Mental'], ['Guides', 'Guides'], ['Books', 'Books']]
const fmtIcon = (f?: string | null) => f === 'Video' ? '▶' : f === 'Plan' ? '📅' : f === 'Worksheet' ? '📝' : '📄'
const actionLabel = (f?: string | null) => f === 'Video' ? 'Watch video' : f === 'Plan' ? 'Open plan' : f === 'Worksheet' ? 'Open worksheet' : 'Open pdf'

export function LiveResources({ T, accent, density, asCoach = false }: { T: ThemeTokens; accent: AccentTokens; density: Density; asCoach?: boolean }) {
  const resources = useCoachTable<Res>('coach_resources')
  // Settings → Resource Centre → Lumio starter library. Off means off: Lumio's
  // resources, its drill library and its book shelf all leave the page, and the
  // coach sees only what they added. Nothing is deleted — switch it back on and
  // it all returns.
  const lumioOn = useCoachSettings().resourcesPreloaded !== false
  const rows = lumioOn ? resources.rows : resources.rows.filter(r => !isLumioResource(r))
  const tabs = lumioOn ? TABS : TABS.filter(([id]) => id !== 'Drill Library' && id !== 'Books')
  const [tab, setTab] = useState('all')
  const [edit, setEdit] = useState<Res | 'new' | null>(null)
  // "Give to a player": one resource, for one player, on their own page —
  // rather than everybody on a racket colour.
  const { rows: players } = useCoachTable<{ id: string; name: string }>('coach_players')
  const recs = useCoachTable<Rec>('coach_player_resources')
  const [giving, setGiving] = useState<Res | null>(null)
  const givenTo = (id: string) => recs.rows.filter(r => r.kind === 'resource' && r.ref_id === id)
  const [q, setQ] = useState('')
  const [racket, setRacket] = useState('all')
  // "+ Add the file" on a card: one hidden picker, pointed at whichever card
  // asked for it.
  const picker = useRef<HTMLInputElement>(null)
  const [fileFor, setFileFor] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [fileErr, setFileErr] = useState<{ id: string; msg: string } | null>(null)
  const askForFile = (id: string) => { setFileFor(id); setFileErr(null); picker.current?.click() }
  // "+ Add link" on a card opens a box right there — most coaches point at a
  // YouTube video or a Google Doc rather than upload a file.
  const [linkFor, setLinkFor] = useState<string | null>(null)
  const [linkDraft, setLinkDraft] = useState('')
  const saveLink = async (id: string) => {
    const url = normaliseWebLink(linkDraft)
    if (!url) { setFileErr({ id, msg: 'That isn’t a web address — paste the link from your browser, e.g. youtube.com/watch?v=…' }); return }
    setUploading(id); setFileErr(null)
    try { await resources.edit(id, { url }); setLinkFor(null); setLinkDraft('') }
    catch { setFileErr({ id, msg: 'Could not save that link — try again.' }) }
    finally { setUploading(null) }
  }
  const onPicked = async (f: File | undefined) => {
    const id = fileFor
    if (picker.current) picker.current.value = ''
    if (!f || !id) return
    setUploading(id)
    try { await uploadResourceFile(f, id); invalidateCoachTable('coach_resources'); await resources.reload() }
    catch (e) { setFileErr({ id, msg: e instanceof Error ? e.message : 'Could not upload that file.' }) }
    finally { setUploading(null); setFileFor(null) }
  }

  const levelColour = (l?: string | null) => l === 'Beginner' ? T.good : l === 'Intermediate' ? '#3A8EE0' : l === 'Advanced' ? T.bad : T.text3
  const needle = q.trim().toLowerCase()
  const filtered = rows.filter(r => {
    if (!(tab === 'all' ? true : r.category === tab)) return false
    if (racket !== 'all' && r.racket !== racket) return false
    if (needle) {
      const hay = [r.title, r.category, r.format, r.level, r.tags, r.notes, RACKET_STAGES.find(s => s.id === r.racket)?.name].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })

  const input: CSSProperties = { appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 13, padding: '9px 12px 9px 34px', fontFamily: FONT, outline: 'none', width: '100%' }
  const Chip = ({ id, label, colour }: { id: string; label: string; colour?: string }) => {
    const on = racket === id
    return (
      <button onClick={() => setRacket(id)} style={{ appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: FONT }}>
        {colour && <span style={{ width: 11, height: 8, borderRadius: 2, background: colour, border: '1px solid rgba(128,128,128,0.4)' }} />}
        {label}
      </button>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Resource Centre</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>{lumioOn
            ? <>Your drill library, technique videos, training plans, worksheets and recommended reading — tagged to the {stageWords().noun} ladder.</>
            : <>Your own drills, videos, plans and documents — links or files, tagged to the {stageWords().noun} ladder and shared to your players&rsquo; app.</>}</p>
        </div>
        {/* The library is the academy's: the head coach adds to it and changes
            it, an invited coach reads it and gives things to their players. The
            button used to be offered to them and Save was refused without a word. */}
        {!asCoach && <button onClick={() => setEdit('new')} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add resource</button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: `1px solid ${tab === id ? accent.border : T.border}`, padding: '6px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: FONT, background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>{id === 'Drill Library' ? '🎾 ' : ''}{label}</button>)}
      </div>

      {tab === 'Books' && lumioOn ? (
        // A shelf, not a file list — covers, who each book is for, and why.
        <BookShelf T={T} accent={accent} density={density} />
      ) : tab === 'Drill Library' && lumioOn ? (
        // The flagship Lumio drill library — search, racket filter, grouped sections, printable drill sheets.
        <DrillLibrary T={T} accent={accent} density={density} />
      ) : (
      <>
      {/* Search + racket filter */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Icon name="search" size={15} stroke={1.7} style={{ position: 'absolute', left: 11, top: 10, color: T.text3 }} />
          <input style={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search resources — title, tag or racket…" />
        </div>
        {filtered.length > 0 && <div style={{ fontSize: 11.5, color: T.text3 }}>{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <Chip id="all" label="All rackets" />
        {RACKET_STAGES.map(s => <Chip key={s.id} id={s.id} label={s.name} colour={s.colour} />)}
      </div>

      <input ref={picker} type="file" accept={RESOURCE_FILE_ACCEPT} style={{ display: 'none' }} onChange={e => { void onPicked(e.target.files?.[0]) }} />
      {!asCoach && rows.some(r => !isPrintable(r.url) && !resourceHref(r.url)) && (
        <div style={{ fontSize: 12, color: T.text2, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '9px 13px', marginBottom: 14, lineHeight: 1.5 }}>
          {(() => { const n = rows.filter(r => !isPrintable(r.url) && !resourceHref(r.url)).length; return `${n} resource${n === 1 ? ' has' : 's have'} nothing to open yet.` })()} Press <strong style={{ color: T.text }}>+ Add link</strong> or <strong style={{ color: T.text }}>Upload file</strong> on the card — players can open it from their app straight away.
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          {/* The Resource Centre is the ACADEMY's, shared by everyone in it. A coach
              cannot load the Lumio library or reach Settings → Resource Centre, so
              pointing them there is an instruction they cannot follow. */}
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{rows.length === 0 ? 'No resources yet' : needle || racket !== 'all' ? 'Nothing matches' : 'Nothing in this category yet'}</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4, lineHeight: 1.6 }}>
            {rows.length > 0 ? (needle || racket !== 'all' ? 'No resource matches that search or racket. Clear them to see everything.' : 'Add a resource to this category.')
              : asCoach ? 'Your head coach hasn\u2019t added the academy\u2019s library yet. Anything they add appears here straight away.'
              : 'Add your own, or load the Lumio starter library in Settings \u2192 Resource Centre.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(r => {
            const st = RACKET_STAGES.find(s => s.id === r.racket)
            // A tag typed as "#volley" is the tag "volley" — the # is added on display.
            const tags = (r.tags || '').split(',').map(s => s.trim().replace(/^#+/, '').trim()).filter(Boolean)
            return (
              <div key={r.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{fmtIcon(r.format)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Three lines at most: a very long title used to make one card a screen tall. The whole of it is on the tooltip and in the form. */}
                    <div title={r.title} style={{ fontSize: 13.5, fontWeight: 700, color: T.text, cursor: 'pointer', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', ...(asCoach ? { cursor: 'default' } : {}) }} onClick={asCoach ? undefined : () => setEdit(r)}>{r.title}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{[r.category, r.format, r.duration].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
                {r.notes && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 10, lineHeight: 1.45, flex: 1 }}>{r.notes}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {r.level && <span style={{ fontSize: 8.5, fontWeight: 700, color: levelColour(r.level), background: `${levelColour(r.level)}22`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{r.level}</span>}
                  {st && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.text3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: st.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{st.name}</span>}
                  {tags.map(t => <span key={t} style={{ fontSize: 10, color: T.text3 }}>#{t}</span>)}
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  {/* Three states, in priority order: a Lumio printable (real
                      content, opens a print-ready A4 page), an external link, or
                      nothing yet. */}
                  {isPrintable(r.url)
                    ? <button onClick={() => openPrintable(r)} style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, fontSize: 12, fontWeight: 600, color: accent.hex, cursor: 'pointer', fontFamily: 'inherit' }}>▸ Open printable →</button>
                    : resourceHref(r.url)
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <a href={resourceHref(r.url)!} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: accent.hex, textDecoration: 'none' }}>▸ {isResourceFile(r.url) ? 'Open file' : actionLabel(r.format)} →</a>
                          {isResourceFile(r.url) && !asCoach && <button onClick={() => askForFile(r.id)} disabled={uploading === r.id} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', padding: 0, fontSize: 11, color: T.text3, cursor: 'pointer', fontFamily: 'inherit' }}>{uploading === r.id ? 'Uploading…' : 'Replace file'}</button>}
                        </div>
                      // Nothing to open yet — a resource added by hand or
                      // imported from a spreadsheet, whose file was never
                      // attached. Say so, and let the head coach add it here.
                      : asCoach
                        ? <span style={{ fontSize: 11.5, color: T.text3 }}>▸ Nothing attached yet</span>
                        : linkFor === r.id
                          ? <div style={{ display: 'flex', gap: 6 }}>
                              <input autoFocus value={linkDraft} onChange={e => setLinkDraft(e.target.value)} placeholder="Paste a link — youtube.com/…"
                                onKeyDown={e => { if (e.key === 'Enter') void saveLink(r.id); if (e.key === 'Escape') { setLinkFor(null); setFileErr(null) } }}
                                style={{ flex: 1, minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '6px 9px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                              <button onClick={() => void saveLink(r.id)} disabled={uploading === r.id} style={{ flexShrink: 0, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{uploading === r.id ? '…' : 'Save'}</button>
                              <button onClick={() => { setLinkFor(null); setFileErr(null) }} aria-label="Cancel" style={{ flexShrink: 0, appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 15, cursor: 'pointer', padding: '0 2px' }}>×</button>
                            </div>
                          : <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button onClick={() => { setLinkFor(r.id); setLinkDraft(''); setFileErr(null) }}
                                style={{ appearance: 'none', border: `1px dashed ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add link</button>
                              <button onClick={() => askForFile(r.id)} disabled={uploading === r.id}
                                style={{ appearance: 'none', border: `1px dashed ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: uploading === r.id ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                                {uploading === r.id ? 'Uploading…' : '⬆ Upload file'}
                              </button>
                            </div>}
                  {fileErr?.id === r.id && <div role="alert" style={{ fontSize: 11, color: T.bad, marginTop: 6 }}>{fileErr.msg}</div>}
                  {(() => {
                    const names = givenTo(r.id).map(g => players.find(p => p.id === g.player_id)?.name).filter(Boolean) as string[]
                    return (
                      <button onClick={() => setGiving(r)} style={{ display: 'block', marginTop: 8, appearance: 'none', border: 0, background: 'transparent', padding: 0, fontSize: 11, color: names.length ? T.good : T.text3, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        {names.length ? `✓ ${r.given_only ? 'Only for' : 'Given to'} ${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''} · change` : r.given_only ? 'Not on any player’s page · give to a player' : '+ Give to a player'}
                      </button>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}

      {giving && <RecommendModal T={T} accent={accent} players={players}
        item={{ kind: 'resource', refId: giving.id, title: giving.title, why: giving.notes || '' }}
        existing={givenTo(giving.id)}
        everyone={(() => {
          // Who else has this on their page because of its level. A resource
          // with a racket colour was put there on purpose, so it starts ticked;
          // "All levels" is only the form's default, so the first time one is
          // given it starts unticked — given to Ben means for Ben.
          const who = giving.racket ? `every ${RACKET_STAGES.find(s => s.id === giving.racket)?.name || giving.racket} racket player`
            : String(giving.level || '').toLowerCase().startsWith('all') ? 'every player' : ''
          if (!who) return undefined
          const on = !giving.given_only
          return {
            who, on,
            start: giving.racket || givenTo(giving.id).length ? on : false,
            set: async (show: boolean) => { await resources.edit(giving.id, { given_only: !show }) },
          }
        })()}
        onClose={() => setGiving(null)}
        onDone={() => { setGiving(null); recs.reload(); resources.reload() }} />}

      {edit && <ResourceForm T={T} accent={accent} res={edit === 'new' ? null : edit} canUpload={!asCoach}
        onClose={() => setEdit(null)}
        onDelete={edit !== 'new' ? async () => {
          await resources.remove(edit.id)
          // What was given to players goes with it (the link is by id, with
          // nothing in the database to clear it), and so does its file.
          await sb().from('coach_player_resources').delete().eq('kind', 'resource').eq('ref_id', edit.id)
          recs.reload()
          setEdit(null)
        } : undefined}
        onSave={async v => { if (edit === 'new') await resources.add(v); else await resources.edit(edit.id, v); setEdit(null) }} />}
    </div>
  )
}

function ResourceForm({ T, accent, res, canUpload, onClose, onSave, onDelete }: { T: ThemeTokens; accent: AccentTokens; res: Res | null; canUpload: boolean; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ title: res?.title || '', category: res?.category || 'Drill', format: res?.format || 'Video', level: res?.level || 'All levels', racket: res?.racket || '', duration: res?.duration || '', tags: res?.tags || '', url: res?.url || '', notes: res?.notes || '' })
  const [saving, setSaving] = useState(false)
  const [up, setUp] = useState<'idle' | 'busy' | string>('idle')
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: string, v: any) => { setErr(''); setD(p => ({ ...p, [k]: v })) }
  // Every file this form has had to do with: the one the resource arrived
  // with, and any uploaded while it was open. When the form closes — saved,
  // deleted or cancelled — they are all offered for tidying, and the server
  // keeps whichever one the resource still uses.
  const files = useRef<string[]>(res?.url ? [res.url] : [])
  const tidy = () => tidyResourceFiles(files.current)
  const cancel = () => { tidy(); onClose() }
  const closeOutside = useAskBeforeClose(JSON.stringify(d), cancel)
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const attach = async (f: File | undefined) => {
    if (fileRef.current) fileRef.current.value = ''
    if (!f) return
    setUp('busy')
    try { const url = await uploadResourceFile(f); files.current.push(url); set('url', url); if (d.format === 'Video') set('format', /\.pdf$/i.test(f.name) ? 'PDF' : 'Worksheet'); setUp('idle') }
    catch (e) { setUp(e instanceof Error ? e.message : 'Could not upload that file.') }
  }
  const hasFile = isResourceFile(d.url)
  const save = async () => {
    if (!String(d.title).trim() || saving || up === 'busy') return
    setSaving(true); setErr('')
    try {
      await onSave({ title: String(d.title).trim(), category: d.category, format: d.format, level: d.level, racket: d.racket || null, duration: d.duration, tags: d.tags, url: isResourceFile(d.url) ? d.url : (normaliseWebLink(d.url) || (String(d.url || '').trim() ? d.url : '')), notes: d.notes })
      tidy()
    } catch { setErr('That was not saved. Check your connection and try again.') }
    finally { setSaving(false) }
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{res ? 'Edit resource' : 'Add resource'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Title *</label><input value={d.title} onChange={e => set('title', e.target.value)} maxLength={160} style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Category</label><select value={d.category} onChange={e => set('category', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Drill', 'Technique', 'Training plan', 'Fitness', 'Mental', 'Guides'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={lab}>Format</label><select value={d.format} onChange={e => set('format', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Video', 'PDF', 'Plan', 'Worksheet'].map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Level</label><select value={d.level} onChange={e => set('level', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label style={lab}>Racket</label><select value={d.racket} onChange={e => set('racket', e.target.value)} style={{ ...field, cursor: 'pointer' }}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label style={lab}>Duration</label><input value={d.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 6 min" style={field} /></div>
          </div>
          <div><label style={lab}>Tags (comma separated)</label><input value={d.tags} onChange={e => set('tags', e.target.value)} placeholder="volley, net" style={field} /></div>
          {/* A file of their own, or a link — one or the other. */}
          <div>
            <label style={lab}>File or link</label>
            {hasFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...field }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.text }}>📎 {resourceFileName(d.url) || 'File attached'}</span>
                {canUpload && <button type="button" onClick={() => fileRef.current?.click()} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: 0 }}>Replace</button>}
                <button type="button" onClick={() => set('url', '')} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 12, cursor: 'pointer', fontFamily: FONT, padding: 0 }}>Remove</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={d.url} onChange={e => set('url', e.target.value)} placeholder="Paste a link — https://…" style={{ ...field, flex: 1 }} />
                {canUpload && <button type="button" onClick={() => fileRef.current?.click()} disabled={up === 'busy'}
                  style={{ flexShrink: 0, appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '0 12px', fontSize: 12.5, fontWeight: 600, cursor: up === 'busy' ? 'wait' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                  {up === 'busy' ? 'Uploading…' : '⬆ Upload a file'}
                </button>}
              </div>
            )}
            <input ref={fileRef} type="file" accept={RESOURCE_FILE_ACCEPT} style={{ display: 'none' }} onChange={e => { void attach(e.target.files?.[0]) }} />
            {up !== 'idle' && up !== 'busy' && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 5 }}>{up}</div>}
            {!hasFile && d.url && !resourceHref(d.url) && <div style={{ fontSize: 11.5, color: T.warn, marginTop: 5 }}>That isn&rsquo;t a web address, so it won&rsquo;t open. Upload the file instead, or paste the link to where it lives online.</div>}
            {!hasFile && !d.url && <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>Paste a link (YouTube, Google Drive, your website) or upload a PDF, Word, PowerPoint, Excel or image file of up to {RESOURCE_FILE_MAX_MB}MB. Players open it from their app.</div>}
          </div>
          <div><label style={lab}>Description</label><textarea value={d.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...field, resize: 'vertical' }} /></div>
        </div>
        {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 12 }}>{err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          {onDelete && <button onClick={async () => { if (confirm('Delete this resource?')) { try { await onDelete(); tidy() } catch { setErr('That was not deleted. Try again.') } } }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
          <button onClick={cancel} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!String(d.title).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.title).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
