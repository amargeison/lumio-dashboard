'use client'

// Settings → Welcome pack: what this org gives each child, and its Activity Booklet.
// A new org starts empty. "Use the example pack" copies the fictional demo pack in
// for the org to edit.

import React, { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, BookOpen, FileUp, Gift, Pencil, Plus, X } from 'lucide-react'
import { Card, Modal, Pill, SectionTitle, buttonPrimary, buttonSecondary, formField, formLabel } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { currentHq } from '@/lib/impact/org-scope'
import { amountOrNull, reorderItems, saveBooklet, saveItem, useExamplePack, type ItemDraft } from '@/lib/impact/pack-actions'
import { pounds, type Booklet, type BookletWarmUp, type PackItem } from '@/lib/impact/packs'
import { sb, usePackAccess } from './PackIssue'
import BookletPdfCard from './BookletPdfCard'
import { MAX_BOOKLET_JSON_BYTES, httpsUrl, readBookletJson } from '@/lib/impact/booklet-import'

const small: React.CSSProperties = { ...buttonSecondary, padding: '5px 8px', fontSize: 11 }
const blankBooklet = (): Booklet => ({ title: '', intro: '', weeks: Array.from({ length: 10 }, (_, i) => ({ week: i + 1, title: '', focus: '', home_task: '' })), stickers: [] })

function ItemDialog({ item, nextSort, onClose }: { item: PackItem | null; nextSort: number; onClose: () => void }) {
  const { reload } = usePackAccess()
  const [name, setName] = useState(item?.name ?? '')
  const [kind, setKind] = useState<PackItem['kind']>(item?.kind ?? 'included')
  const [price, setPrice] = useState(item?.price_pence ? String(item.price_pence / 100) : '')
  const [hasSizes, setHasSizes] = useState(item?.has_sizes ?? false)
  const [sizes, setSizes] = useState((item?.sizes ?? []).join(', '))
  const [low, setLow] = useState(String(item?.low_stock ?? 10))
  const [cost, setCost] = useState(item?.unit_cost_pence ? String(item.unit_cost_pence / 100) : '')
  const [active, setActive] = useState(item?.active ?? true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function save() {
    setBusy(true); setErr('')
    const draft: ItemDraft = {
      name, kind, price_pence: amountOrNull(price), has_sizes: hasSizes, sizes: hasSizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      low_stock: Math.max(0, Math.round(Number(low)) || 0), unit_cost_pence: amountOrNull(cost), sort: item?.sort ?? nextSort, active,
    }
    try { const db = sb(); await saveItem(db, await currentHq(db), item?.id ?? null, draft); reload(); onClose() }
    catch (e) { setErr(e instanceof Error ? e.message : 'The item could not be saved.'); setBusy(false) }
  }
  return (
    <Modal title={item ? `Edit ${item.name}` : 'Add an item'} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <label><span style={formLabel}>Name</span><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. T-shirt" style={formField} /></label>
        <label><span style={formLabel}>Given or paid</span><select value={kind} onChange={e => setKind(e.target.value as PackItem['kind'])} style={formField}><option value="included">Included in the pack</option><option value="paid">Paid extra</option></select></label>
        {kind === 'paid' && <label><span style={formLabel}>Price (£)</span><input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" style={formField} /></label>}
        <label><span style={formLabel}>Low-stock level</span><input value={low} onChange={e => setLow(e.target.value)} inputMode="numeric" style={formField} /></label>
        <label><span style={formLabel}>Unit cost (£, optional)</span><input value={cost} onChange={e => setCost(e.target.value)} inputMode="decimal" style={formField} /></label>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, color: TP_DARK }}><input type="checkbox" checked={hasSizes} onChange={e => setHasSizes(e.target.checked)} /> Comes in sizes</label>
      {hasSizes && <label style={{ display: 'block', marginTop: 8 }}><span style={formLabel}>Sizes, separated by commas</span><input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="5-6, 7-8, 9-10, 11-12" style={formField} /></label>}
      {item && <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, color: TP_DARK }}><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Still part of the pack</label>}
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={buttonSecondary}>Cancel</button>
        <button onClick={save} disabled={busy} style={buttonPrimary}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>
  )
}

function ImportDialog({ booklet, onConfirm, onClose, busy, error }: { booklet: Booklet; onConfirm: () => void; onClose: () => void; busy: boolean; error: string }) {
  const facts: [string, string][] = [
    ['Title', booklet.title], ['Motto', booklet.motto ?? ''], ['Values', booklet.values ?? ''], ['Website', booklet.website ?? ''],
    ['Weeks', `${booklet.weeks.length}: ${booklet.weeks.map(w => w.title || `Week ${w.week}`).join(', ')}`],
    ['Stickers', `${booklet.stickers.length}: ${booklet.stickers.map(s => s.label).join(', ')}`],
    ['Warm-up', booklet.warm_up?.title ?? ''], ['Scorecard', booklet.weeks.some(w => w.scorecard) ? 'Yes' : ''],
  ]
  return (
    <Modal title="Import this booklet?" onClose={onClose}>
      <div style={{ display: 'grid', gap: 6, fontSize: 12.5, color: TP_DARK }}>
        {facts.filter(([, v]) => v).map(([k, v]) => <div key={k}><strong>{k}:</strong> {v}</div>)}
      </div>
      <div style={{ fontSize: 12, color: '#6B6560', marginTop: 10 }}>This replaces the booklet’s text, weeks and stickers. Your PDF stays, and so do your video links unless the file has its own.</div>
      {error && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={buttonSecondary}>Cancel</button>
        <button onClick={onConfirm} disabled={busy} style={buttonPrimary}>{busy ? 'Importing…' : 'Import booklet'}</button>
      </div>
    </Modal>
  )
}

function BookletEditor({ canEdit }: { canEdit: boolean }) {
  const { packs, reload } = usePackAccess()
  const [b, setB] = useState<Booklet>(() => packs.booklet ?? blankBooklet())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const saved = packs.booklet
  // The example arrives through a reload, after this has mounted.
  useEffect(() => { if (saved) setB(saved) }, [saved])
  const weeks = b.weeks.length ? b.weeks : blankBooklet().weeks
  const setWeek = (i: number, k: 'title' | 'focus' | 'home_task' | 'top_tip' | 'did_you_know' | 'video', v: string) => setB(x => ({ ...x, weeks: weeks.map((w, n) => n === i ? { ...w, [k]: v } : w) }))
  const setScorecard = (i: number, on: boolean) => setB(x => ({ ...x, weeks: weeks.map((w, n) => n === i ? { ...w, scorecard: on } : w) }))
  const setText = (k: 'motto' | 'values' | 'website' | 'hashtag' | 'completion' | 'tenors' | 'notes_prompt', v: string) => setB(x => ({ ...x, [k]: v }))
  const warm = b.warm_up ?? {}
  const setWarm = (patch: Partial<BookletWarmUp>) => setB(x => ({ ...x, warm_up: { ...x.warm_up, ...patch } }))
  // One link per video the weeks name, plus any already saved.
  const videoKeys = [...new Set([...weeks.map(w => w.video?.trim()).filter((k): k is string => !!k), ...Object.keys(b.videos ?? {})])]
  const setVideo = (k: string, url: string) => setB(x => ({ ...x, videos: { ...x.videos, [k]: url } }))
  const picker = useRef<HTMLInputElement>(null)
  const [incoming, setIncoming] = useState<Booklet | null>(null)
  const [importError, setImportError] = useState('')
  const [fileProblems, setFileProblems] = useState<string[]>([])
  async function chooseFile(file: File | undefined) {
    setFileProblems([]); setImportError('')
    if (picker.current) picker.current.value = ''
    if (!file) return
    if (file.size > MAX_BOOKLET_JSON_BYTES) { setFileProblems(['That file is too big to be a booklet.']); return }
    const { booklet, problems } = readBookletJson(await file.text())
    if (booklet) setIncoming(booklet); else setFileProblems(problems)
  }
  async function confirmImport() {
    if (!incoming) return
    setBusy(true); setImportError('')
    try {
      const db = sb()
      await saveBooklet(db, await currentHq(db), { ...incoming, videos: incoming.videos ?? b.videos ?? {} })
      setIncoming(null); setMsg({ text: '✓ Booklet imported.' }); reload()
    } catch (e) { setImportError(e instanceof Error ? e.message : 'The booklet could not be imported.') }
    setBusy(false)
  }
  const setSticker = (i: number, k: 'label' | 'description', v: string) => setB(x => ({ ...x, stickers: x.stickers.map((s, n) => n === i ? { ...s, [k]: v } : s) }))
  async function save() {
    setMsg(null)
    const links = Object.fromEntries(Object.entries(b.videos ?? {}).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
    const bad = Object.entries(links).find(([, v]) => !httpsUrl(v))
    if (bad) { setMsg({ text: `The ${bad[0]} video needs a link starting https://`, bad: true }); return }
    setBusy(true)
    try { const db = sb(); await saveBooklet(db, await currentHq(db), { ...b, weeks, videos: links, warm_up: { ...warm, did_you_know: (warm.did_you_know ?? []).map(f => f.trim()).filter(Boolean) } }); setMsg({ text: '✓ Booklet saved.' }); reload() }
    catch (e) { setMsg({ text: e instanceof Error ? e.message : 'The booklet could not be saved.', bad: true }) }
    setBusy(false)
  }
  return (
    <fieldset disabled={!canEdit} style={{ border: 'none', padding: 0, margin: '16px 0 0', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="What families see, week by week"><BookOpen size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Activity Booklet</SectionTitle>
        {canEdit && <button onClick={() => picker.current?.click()} style={buttonSecondary}><FileUp size={13} /> Import booklet JSON</button>}
        <input ref={picker} type="file" accept="application/json,.json" aria-label="Booklet JSON" onChange={e => chooseFile(e.target.files?.[0])} style={{ display: 'none' }} />
      </div>
      {fileProblems.length > 0 && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginBottom: 10 }}><strong>That file wasn’t imported.</strong>{fileProblems.slice(0, 8).map(p => <div key={p}>{p}</div>)}{fileProblems.length > 8 && <div>And {fileProblems.length - 8} more.</div>}</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        <label><span style={formLabel}>Title</span><input value={b.title} onChange={e => setB(x => ({ ...x, title: e.target.value }))} style={formField} /></label>
        <label><span style={formLabel}>Introduction</span><textarea value={b.intro} onChange={e => setB(x => ({ ...x, intro: e.target.value }))} rows={2} style={formField} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          <label><span style={formLabel}>Motto</span><input value={b.motto ?? ''} onChange={e => setText('motto', e.target.value)} style={formField} /></label>
          <label><span style={formLabel}>Values</span><input value={b.values ?? ''} onChange={e => setText('values', e.target.value)} style={formField} /></label>
          <label><span style={formLabel}>Website</span><input value={b.website ?? ''} onChange={e => setText('website', e.target.value)} style={formField} /></label>
          <label><span style={formLabel}>Hashtag</span><input value={b.hashtag ?? ''} onChange={e => setText('hashtag', e.target.value)} style={formField} /></label>
        </div>
        <div style={formLabel}>Warm-up</div>
        <label><span style={formLabel}>Heading</span><input value={warm.title ?? ''} onChange={e => setWarm({ title: e.target.value })} style={formField} /></label>
        <label><span style={formLabel}>Text</span><textarea value={warm.text ?? ''} onChange={e => setWarm({ text: e.target.value })} rows={2} style={formField} /></label>
        <label><span style={formLabel}>Did you know? One per line</span><textarea value={(warm.did_you_know ?? []).join('\n')} onChange={e => setWarm({ did_you_know: e.target.value.split('\n') })} rows={2} style={formField} /></label>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {weeks.map((w, i) => (
          <div key={w.week} style={{ display: 'grid', gridTemplateColumns: '58px repeat(auto-fit, minmax(150px, 1fr))', gap: 6, alignItems: 'center', borderBottom: '1px solid #F0EBE5', paddingBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK }}>Week {w.week}</span>
            <input aria-label={`Week ${w.week} title`} value={w.title} onChange={e => setWeek(i, 'title', e.target.value)} placeholder="Title" style={formField} />
            <input aria-label={`Week ${w.week} focus`} value={w.focus} onChange={e => setWeek(i, 'focus', e.target.value)} placeholder="Focus" style={formField} />
            <input aria-label={`Week ${w.week} home task`} value={w.home_task} onChange={e => setWeek(i, 'home_task', e.target.value)} placeholder="Home task" style={formField} />
            <input aria-label={`Week ${w.week} top tip`} value={w.top_tip ?? ''} onChange={e => setWeek(i, 'top_tip', e.target.value)} placeholder="Top tip" style={formField} />
            <input aria-label={`Week ${w.week} did you know`} value={w.did_you_know ?? ''} onChange={e => setWeek(i, 'did_you_know', e.target.value)} placeholder="Did you know?" style={formField} />
            <input aria-label={`Week ${w.week} video`} value={w.video ?? ''} onChange={e => setWeek(i, 'video', e.target.value)} placeholder="Video, such as forehand" style={formField} />
            {w.week === 10 && <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: TP_DARK }}><input type="checkbox" checked={w.scorecard === true} onChange={e => setScorecard(i, e.target.checked)} /> Festival scorecard</label>}
          </div>
        ))}
      </div>
      {videoKeys.length > 0 && <>
        <div style={{ ...formLabel, marginTop: 14 }}>Video links</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {videoKeys.map(k => <label key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, alignItems: 'center', fontSize: 12, color: TP_DARK }}>{k}<input aria-label={`${k} video link`} value={b.videos?.[k] ?? ''} onChange={e => setVideo(k, e.target.value)} placeholder="https://" style={formField} /></label>)}
        </div>
      </>}
      <div style={{ ...formLabel, marginTop: 14 }}>Stickers</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {b.stickers.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input aria-label="Sticker name" value={s.label} onChange={e => setSticker(i, 'label', e.target.value)} placeholder="Name" style={formField} />
            <input aria-label="Sticker description" value={s.description} onChange={e => setSticker(i, 'description', e.target.value)} placeholder="What earns it" style={formField} />
            <button aria-label={`Remove ${s.label || 'sticker'}`} onClick={() => setB(x => ({ ...x, stickers: x.stickers.filter((_, n) => n !== i) }))} style={small}><X size={12} /></button>
          </div>
        ))}
      </div>
      <button onClick={() => setB(x => ({ ...x, stickers: [...x.stickers, { id: crypto.randomUUID(), label: '', description: '' }] }))} style={{ ...small, marginTop: 8 }}><Plus size={12} /> Add sticker</button>
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        <label><span style={formLabel}>When they finish</span><textarea value={b.completion ?? ''} onChange={e => setText('completion', e.target.value)} rows={2} style={formField} /></label>
        <label><span style={formLabel}>Volunteering note</span><textarea value={b.tenors ?? ''} onChange={e => setText('tenors', e.target.value)} rows={2} style={formField} /></label>
        <label><span style={formLabel}>Notes prompt</span><input value={b.notes_prompt ?? ''} onChange={e => setText('notes_prompt', e.target.value)} style={formField} /></label>
      </div>
      {msg && <div role="status" style={{ fontSize: 12, color: msg.bad ? TP_RED : '#187A3C', marginTop: 10 }}>{msg.text}</div>}
      {canEdit && <div style={{ marginTop: 12 }}><button onClick={save} disabled={busy} style={buttonPrimary}>{busy ? 'Saving…' : 'Save booklet'}</button></div>}
      <div style={{ marginTop: 16 }}><BookletPdfCard bare title="Printed booklet (PDF)" /></div>
      {incoming && <ImportDialog booklet={incoming} onConfirm={confirmImport} onClose={() => setIncoming(null)} busy={busy} error={importError} />}
    </fieldset>
  )
}

export default function WelcomePackSettings() {
  const { on, packs, canEdit, reload } = usePackAccess()
  const [editing, setEditing] = useState<PackItem | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!on) return null
  const items = [...packs.items].sort((a, b) => a.sort - b.sort)
  const isEmpty = !items.length && !packs.booklet

  async function move(i: number, by: number) {
    const next = [...items]; const [it] = next.splice(i, 1); next.splice(i + by, 0, it)
    setErr('')
    try { await reorderItems(sb(), next); reload() } catch (e) { setErr(e instanceof Error ? e.message : 'The order could not be saved.') }
  }
  async function useExample() {
    setBusy(true); setErr('')
    try {
      const { EXAMPLE_ITEMS, exampleBooklet } = await import('@/lib/impact/pack-example')
      const db = sb()
      await useExamplePack(db, await currentHq(db), EXAMPLE_ITEMS, exampleBooklet())
      reload()
    } catch (e) { setErr(e instanceof Error ? e.message : 'The example could not be added.') }
    setBusy(false)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <SectionTitle sub="What each child receives, what can be bought, and when to reorder"><Gift size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Welcome pack</SectionTitle>
        {canEdit && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isEmpty && <button onClick={useExample} disabled={busy} style={buttonSecondary}>{busy ? 'Adding…' : 'Use the example pack'}</button>}
          <button onClick={() => setEditing('new')} style={buttonPrimary}><Plus size={13} /> Add item</button>
        </div>}
      </div>
      {!items.length && <div style={{ fontSize: 12.5, color: '#6B6560' }}>No items yet. Add your own, or start from the example and edit it.</div>}
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((it, i) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F5F2', borderRadius: 9, padding: '8px 10px', flexWrap: 'wrap', opacity: it.active ? 1 : 0.6 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{it.name}</div>
              <div style={{ fontSize: 10.5, color: '#6B6560' }}>{[it.has_sizes ? it.sizes.join(', ') : null, `Low at ${it.low_stock}`, it.active ? null : 'No longer in the pack'].filter(Boolean).join(' · ')}</div>
            </div>
            <Pill tone={it.kind === 'paid' ? 'amber' : 'grey'}>{it.kind === 'paid' ? pounds(it.price_pence ?? 0) : 'INCLUDED'}</Pill>
            {canEdit && <>
              <button aria-label={`Move ${it.name} up`} onClick={() => move(i, -1)} disabled={i === 0} style={small}><ArrowUp size={12} /></button>
              <button aria-label={`Move ${it.name} down`} onClick={() => move(i, 1)} disabled={i === items.length - 1} style={small}><ArrowDown size={12} /></button>
              <button aria-label={`Edit ${it.name}`} onClick={() => setEditing(it)} style={small}><Pencil size={12} /></button>
            </>}
          </div>
        ))}
      </div>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <BookletEditor canEdit={canEdit} />
      {editing && <ItemDialog item={editing === 'new' ? null : editing} nextSort={items.length} onClose={() => setEditing(null)} />}
    </Card>
  )
}
