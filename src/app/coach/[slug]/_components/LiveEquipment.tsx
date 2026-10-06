'use client'

// Live Equipment & Kit — the demo over real data. Stats, grab-and-go "kit for
// each session type" checklists (coach_kit_items), and a categorised inventory
// (coach_equipment) with inline quantity/status editing. (The Restock list is
// intentionally left out of v1.)

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, currentIdentity, forgetIdentity, invalidateCoachTable, sb } from '../_lib/coach-db'
import { seedLumioEquipment, EQUIPMENT_KIT_CHOICES, EQUIPMENT_CATEGORY_CHOICES, stockState, stockNeedsAttention, STOCK_LABEL, MAX_STOCK, type StockState } from '../_lib/lumio-equipment'
import { SetupWizard } from './SetupWizard'
import { getSettings, setSettings, isDemoPortal } from '../_lib/settings-store'
import { useAskBeforeClose } from '../_lib/ask-before-close'

type Item = { id: string; item: string; category?: string | null; quantity?: number | null; status?: string | null; notes?: string | null; low_at?: number | null }
type Kit = { id: string; session_type: string; label: string }
const SESSION_TYPES = ['Private lesson', 'Group / squad', 'Cardio Tennis', 'Match play', 'Mini / red ball']
// What the coach can SAY about an item. What the item SHOWS is worked out from
// these and the count together — see stockState in _lib/lumio-equipment.ts.
const STATUSES: { v: string; l: string }[] = [{ v: 'in_stock', l: 'In stock' }, { v: 'low', l: 'Running low' }, { v: 'order', l: 'To order' }, { v: 'repair', l: 'Repair' }]

// A whole number from 0 to MAX_STOCK, or null when the box is empty. `undefined`
// means it is neither — "2.5", "-3", "lots" — and the form says so instead of
// sending it to a whole-number column that refuses it without a word.
function wholeNumber(raw: unknown): number | null | undefined {
  const t = String(raw ?? '').trim()
  if (!t) return null
  if (!/^\d+$/.test(t)) return undefined
  const n = Number(t)
  return n <= MAX_STOCK ? n : undefined
}

// ── A count that must not be lost when the page goes away ──────────────────
// Taps on − / + are saved after a short pause. Reloading or closing the tab
// inside that pause used to drop them: the screen had shown 22, the database
// kept 20. A request started while a page is closing is normally cancelled, so
// this one is sent "keepalive", which the browser finishes after the page has
// gone. It needs the sign-in token in hand BEFORE the page starts closing —
// there is no time to ask for it then — so it is fetched when a count is first
// changed.
let leaveToken: string | null = null
function readyToLeave() {
  if (isDemoPortal()) return
  void sb().auth.getSession()
    .then((r: { data: { session: { access_token?: string } | null } }) => { leaveToken = r.data.session?.access_token ?? null })
    .catch(() => { /* the ordinary save still runs */ })
}
function saveCountOnLeave(id: string, quantity: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (isDemoPortal() || !url || !anon || !leaveToken) return
  // Row level security applies exactly as it does to the ordinary save: this is
  // the coach's own token, and the row is found by id.
  void fetch(`${url}/rest/v1/coach_equipment?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', keepalive: true,
    headers: { apikey: anon, authorization: `Bearer ${leaveToken}`, 'content-type': 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify({ quantity, updated_at: new Date().toISOString() }),
  }).catch(() => { /* the page is closing — nothing left to tell */ })
}

export function LiveEquipment({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const items = useCoachTable<Item>('coach_equipment')
  const kits = useCoachTable<Kit>('coach_kit_items')
  const [edit, setEdit] = useState<Item | 'new' | null>(null)
  // The dashboard's "Kit needing attention" rows ask for that filter, so the
  // page opens on the same items the dashboard listed.
  const [filter, setFilter] = useState<'all' | 'attention'>(() => {
    try { if (sessionStorage.getItem('lumio_equipment_filter') === 'attention') return 'attention' } catch { /* ignore */ }
    return 'all'
  })
  // Used once: cleared after the page has mounted (not while reading it above,
  // because a first render can be thrown away and run again).
  useEffect(() => { try { sessionStorage.removeItem('lumio_equipment_filter') } catch { /* ignore */ } }, [])

  // First visit used to SILENTLY seed the full Lumio kit — 39 inventory items and
  // 28 kit lines — so a new coach's first view of this module was somebody else's
  // kit list, and their only route to their own was deleting things one at a time.
  // It now offers a choice instead (see SetupWizard). `equipmentSeeded` is reused
  // as "the coach has answered this", so choosing "start empty" is remembered and
  // they are not asked again every visit.
  //
  // The row check stays as the primary gate: it is RLS-scoped, so it is correct
  // per-account even before settings have hydrated from coach_settings.
  const [setupAnswered, setSetupAnswered] = useState(false)

  // ── An assistant coach's own kit ──────────────────────────────────────────
  // A coach with their own players and bookings but the club's uneditable kit
  // list is half a product — they carry their own balls and cones in the boot of
  // the car. So on first visit they choose: take a copy of the club's list, or
  // start their own from scratch. Either way it becomes theirs to edit, and the
  // club's disappears from their view.
  //
  // null while we are still finding out — the wizard must not flash up for a
  // head coach before the answer arrives.
  const [asCoach, setAsCoach] = useState<{ isHead: boolean; ownsKit: boolean } | null>(null)
  const [kitBusy, setKitBusy] = useState<'copy' | 'blank' | null>(null)
  const [kitErr, setKitErr] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const me = await currentIdentity()
      if (!alive) return
      if (!me || me.isHead) { setAsCoach({ isHead: true, ownsKit: true }); return }
      // equipmentOwn comes off their own staff row — it is the record of whether
      // they have already chosen, so an empty list they built on purpose does
      // not send them back through the wizard.
      setAsCoach({ isHead: false, ownsKit: !!me.equipmentOwn })
    })()
    return () => { alive = false }
  }, [])

  const chooseKit = async (mode: 'copy' | 'blank') => {
    setKitBusy(mode); setKitErr('')
    try {
      const r = await fetch('/api/coach/equipment-setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Could not set up your kit list.')
      setAsCoach(a => a ? { ...a, ownsKit: true } : a)
      // Which list this coach sees is decided from their identity, which is
      // remembered for the life of the page. It has just changed — they now
      // have their own — so drop it, or the reload below would fetch the
      // club's list again and show it as theirs.
      forgetIdentity()
      invalidateCoachTable('coach_equipment'); invalidateCoachTable('coach_kit_items')
      items.reload(); kits.reload()
    } catch (e) { setKitErr(e instanceof Error ? e.message : 'Could not set up your kit list.') }
    finally { setKitBusy(null) }
  }
  const showSetup = !isDemoPortal()
    && asCoach?.isHead !== false
    && !items.loading && !kits.loading
    && items.rows.length === 0 && kits.rows.length === 0
    && !setupAnswered && !getSettings().equipmentSeeded

  const finishSetup = () => { setSettings({ equipmentSeeded: true }); setSetupAnswered(true) }
  const applySetup = async (sel: Record<string, string[]>) => {
    await seedLumioEquipment({ kitTypes: sel.kits, categories: sel.inventory })
    finishSetup(); items.reload(); kits.reload()
  }
  const loadAllSetup = async () => { await seedLumioEquipment(); finishSetup(); items.reload(); kits.reload() }

  const stateColour = (s: StockState) => s === 'in_stock' ? T.good : s === 'order' ? '#3A8EE0' : s === 'repair' || s === 'out' ? T.bad : s === 'uncounted' ? T.text3 : T.warn
  // Every tile is counted from the same worked-out state the rows show, so
  // "In stock 10" can no longer sit above ten items with none left.
  const tiles: [string, number, string][] = [
    ['Items tracked', items.rows.length, T.text],
    ['In stock', items.rows.filter(i => stockState(i) === 'in_stock').length, T.good],
    ['Need attention', items.rows.filter(stockNeedsAttention).length, T.warn],
    ['On order', items.rows.filter(i => stockState(i) === 'order').length, '#3A8EE0'],
  ]

  // Inventory grouped by category.
  const cats = Array.from(new Set(items.rows.map(i => i.category || 'Uncategorised')))
  const shown = (i: Item) => filter === 'all' || stockNeedsAttention(i)
  const sectOff = getSettings().sectionsOff?.equipment || []
  const showSec = (k: string) => !sectOff.includes(k)

  // An assistant who has not chosen yet: the club's list is visible but read-only
  // behind this, so the choice is informed rather than blind.
  if (asCoach && !asCoach.isHead && !asCoach.ownsKit) {
    const btn = (primary: boolean): CSSProperties => ({
      appearance: 'none', cursor: kitBusy ? 'wait' : 'pointer', fontFamily: FONT,
      fontSize: 13, fontWeight: primary ? 700 : 600, borderRadius: 10, padding: '11px 18px',
      border: primary ? 0 : `1px solid ${T.border}`,
      background: primary ? accent.hex : 'transparent',
      color: primary ? T.btnText : T.text2, opacity: kitBusy ? 0.6 : 1,
    })
    return (
      <div style={{ fontFamily: FONT }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Equipment &amp; Kit</h1>
        <p style={{ margin: '4px 0 20px', fontSize: 13, color: T.text3 }}>Your own kit list — separate from the club&rsquo;s.</p>

        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 620 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Set up your kit list</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.text3, lineHeight: 1.65 }}>
            At the moment you&rsquo;re looking at the club&rsquo;s list, which you can&rsquo;t edit. Take a copy
            of it to change as you like, or start your own from scratch. Either way the club&rsquo;s list stays
            exactly as it is for everyone else — you just stop seeing it here.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button onClick={() => void chooseKit('copy')} disabled={!!kitBusy} style={btn(true)}>
              {kitBusy === 'copy' ? 'Copying…' : 'Start from the club\u2019s list'}
            </button>
            <button onClick={() => void chooseKit('blank')} disabled={!!kitBusy} style={btn(false)}>
              {kitBusy === 'blank' ? 'Setting up…' : 'Start empty'}
            </button>
          </div>
          {kitErr && <div style={{ fontSize: 12.5, color: T.bad, marginTop: 12 }}>{kitErr}</div>}

          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 16, lineHeight: 1.55 }}>
            {items.rows.length > 0
              ? `The club currently lists ${items.rows.length} item${items.rows.length === 1 ? '' : 's'} and ${kits.rows.length} kit line${kits.rows.length === 1 ? '' : 's'}.`
              : 'The club hasn\u2019t set up a kit list yet, so a copy would start empty either way.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Equipment &amp; Kit</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Everything you need on court — edit stock inline and build your session kits.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEdit('new')} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add item</button>
          <button onClick={() => printKit(SESSION_TYPES, kits.rows, items.rows)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>🖨️ Print kit list</button>
        </div>
      </div>

      {showSetup && (
        <div style={{ marginBottom: 16 }}>
          <SetupWizard T={T} accent={accent}
            title="Build your kit list"
            blurb="Pick the session kits and inventory categories you actually use — you can edit, add to or remove anything afterwards. Everything starts ticked, so untick what you don't need."
            groups={[
              { key: 'kits', title: 'Session kit checklists', hint: 'Grab-and-go lists per session type', options: EQUIPMENT_KIT_CHOICES },
              { key: 'inventory', title: 'Inventory categories', hint: 'Nothing is counted yet — you count your own stock in', options: EQUIPMENT_CATEGORY_CHOICES },
            ]}
            onApply={applySetup} onLoadAll={loadAllSetup} onSkip={finishSetup} />
        </div>
      )}

      {/* Stats */}
      <div style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(([l, v, c]) => (
          <div key={l} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Kit for each session type */}
      <div style={{ marginBottom: 18, display: showSec('kit') ? undefined : 'none' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 10 }}>Kit for each session type <span style={{ fontSize: 11, fontWeight: 400, color: T.text3 }}>· grab-and-go checklists</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
          {SESSION_TYPES.map(st => <KitCard key={st} T={T} accent={accent} type={st} items={kits.rows.filter(k => k.session_type === st)} reload={kits.reload} remove={kits.remove} />)}
        </div>
      </div>

      {/* Inventory */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Inventory <span style={{ fontSize: 11, fontWeight: 400, color: T.text3 }}>· tap − / + or type a number to update stock · tap a name for more</span></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8 }}>
          {(['all', 'attention'] as const).map(f => <button key={f} onClick={() => setFilter(f)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT, background: filter === f ? T.panel : 'transparent', color: filter === f ? T.text : T.text2, fontWeight: filter === f ? 600 : 400 }}>{f === 'all' ? 'All' : 'Needs attention'}</button>)}
        </div>
      </div>
      {items.rows.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3, padding: '8px 0' }}>No equipment yet — add your first item.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
          {cats.map(cat => {
            const catItems = items.rows.filter(i => (i.category || 'Uncategorised') === cat && shown(i))
            if (catItems.length === 0) return null
            return (
              <div key={cat} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  {/* A long category name wraps inside the card instead of running out of it. */}
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: T.text, overflowWrap: 'anywhere' }}>{cat}</div>
                  <div style={{ flexShrink: 0, fontSize: 11, color: T.text3 }}>{catItems.length}</div>
                </div>
                {catItems.map(i => (
                  // The count and the status are edited right here — a coach
                  // counting balls into the bag taps − / + or types the number,
                  // and never waits on a form. The name opens the full edit.
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: stateColour(stockState(i)), flexShrink: 0 }} />
                    {/* The name wraps rather than being cut to a dozen letters: there is
                        no tooltip to hover on a phone, and "Red / foam ba…" names nothing. */}
                    <button type="button" onClick={() => setEdit(i)} title={`${i.item}${i.notes ? ` · ${i.notes}` : ''} — tap to edit`}
                      style={{ flex: 1, minWidth: 0, appearance: 'none', border: 0, background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: FONT }}>
                      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{i.item}</div>
                      {i.notes && <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.notes}</div>}
                    </button>
                    <QtyStepper T={T} accent={accent} value={i.quantity ?? null} label={i.item}
                      onSave={q => items.edit(i.id, { quantity: q })}
                      onLeave={q => saveCountOnLeave(i.id, q)} />
                    <StatusPicker T={T} item={i} colour={stateColour(stockState(i))} label={i.item}
                      onSave={v => items.edit(i.id, { status: v })} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {edit && <ItemForm T={T} accent={accent} item={edit === 'new' ? null : edit}
        onClose={() => setEdit(null)}
        onDelete={edit !== 'new' ? async () => { await items.remove(edit.id); setEdit(null) } : undefined}
        onSave={async v => { if (edit === 'new') await items.add(v); else await items.edit(edit.id, v); setEdit(null) }} />}
    </div>
  )
}

// − [count] + on the row itself. Taps are counted locally and saved once the
// coach pauses, so ten quick taps are one save rather than ten reloads racing
// each other. A number typed in saves on Enter or when they click away.
//
// `value` is null for an item nobody has counted yet: the box is empty rather
// than showing a 0 that would read as "none left".
function QtyStepper({ T, accent, value, label, onSave, onLeave }: { T: ThemeTokens; accent: AccentTokens; value: number | null; label: string; onSave: (q: number) => Promise<void>; onLeave: (q: number) => void }) {
  const saved = value == null ? '' : String(value)
  const [q, setQ] = useState(saved)
  const [saving, setSaving] = useState(false)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The count that is on screen but not yet saved. Kept outside React state so
  // it can still be read at the two moments nothing can wait for: the coach
  // moving to another page of the portal, and the browser closing this one.
  const waiting = useRef<number | null>(null)
  const saveRef = useRef(onSave)
  const leaveRef = useRef(onLeave)
  useEffect(() => { saveRef.current = onSave; leaveRef.current = onLeave })
  // Follow the saved value when it changes elsewhere — but never over a number
  // the coach is part-way through typing or tapping.
  useEffect(() => { if (!dirty.current) setQ(saved) }, [saved])
  useEffect(() => {
    const drop = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
    // The page itself is going (reload, tab closed): hand the count to a
    // request the browser will finish on its own.
    const onHide = () => { if (waiting.current != null) { drop(); leaveRef.current(waiting.current); waiting.current = null } }
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      drop()
      // The coach has moved to another module inside the pause. The timer used
      // to be thrown away here and the taps with it; the count is saved instead.
      if (waiting.current != null) { const n = waiting.current; waiting.current = null; void saveRef.current(n).catch(() => { /* shown as unsaved next time the page opens */ }) }
    }
  }, [])

  const touch = () => { if (!dirty.current) { dirty.current = true; readyToLeave() } }
  // A typed "12.5" is 13, not 125: the number is read as a number and rounded,
  // rather than having everything that is not a digit stripped out of it.
  const whole = (raw: string): number | null => {
    const num = raw.trim() === '' ? NaN : Number(raw)
    return Number.isFinite(num) ? Math.max(0, Math.min(MAX_STOCK, Math.round(num))) : null
  }
  const commit = async (raw: string) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    waiting.current = null
    const n = whole(raw)
    // Not a number at all (or the box was emptied): put the saved count back.
    if (n == null) { dirty.current = false; setQ(saved); return }
    setQ(String(n))
    if (n === value) { dirty.current = false; return }
    setSaving(true)
    try { await onSave(n) } catch { setQ(saved) } finally { dirty.current = false; setSaving(false) }
  }
  const bump = (d: number) => {
    const n = Math.max(0, Math.min(MAX_STOCK, (whole(q) ?? 0) + d))
    touch()
    waiting.current = n
    setQ(String(n))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void commit(String(n)) }, 600)
  }
  const none = (whole(q) ?? 0) <= 0
  const btn: CSSProperties = { appearance: 'none', width: 24, height: 26, border: 0, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: 15, lineHeight: 1, fontFamily: FONT, padding: 0 }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, border: `1px solid ${saving ? accent.border : T.border}`, background: T.panel2, borderRadius: 7, opacity: saving ? 0.7 : 1 }}>
      <button type="button" aria-label={`One fewer ${label}`} onClick={() => bump(-1)} disabled={none} style={{ ...btn, opacity: none ? 0.35 : 1 }}>−</button>
      <input value={q} inputMode="numeric" aria-label={`How many ${label}`} placeholder="–"
        onChange={e => { touch(); const t = e.target.value.replace(/[^0-9.]/g, ''); setQ(t); waiting.current = whole(t) }}
        onFocus={e => e.target.select()}
        onBlur={() => { if (dirty.current) void commit(q) }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { dirty.current = false; waiting.current = null; setQ(saved); (e.target as HTMLInputElement).blur() } }}
        style={{ width: 34, textAlign: 'center', border: 0, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 12, fontWeight: 600, fontFamily: FONT, padding: '4px 0', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
      <button type="button" aria-label={`One more ${label}`} onClick={() => bump(1)} style={btn}>+</button>
    </div>
  )
}

// The status chip is a real dropdown — tap it, pick, done.
//
// It shows the item's worked-out state. Where the COUNT decides that (none
// left, or at/below the item's "low at"), the chip says so and the only things
// left to pick are the two a count cannot know: "To order" and "Repair". To
// make it "In stock" again the coach changes the count, which is the truth of
// the matter — picking "In stock" over a count of 0 would change nothing.
function StatusPicker({ T, item, colour, label, onSave }: { T: ThemeTokens; item: Item; colour: string; label: string; onSave: (v: string) => Promise<void> }) {
  const state = stockState(item)
  const byCount = stockState({ quantity: item.quantity, low_at: item.low_at, status: 'in_stock' })
  const countDecides = byCount === 'out' || byCount === 'low'
  const choices: { v: string; l: string; off?: boolean }[] = countDecides
    ? [{ v: 'in_stock', l: STOCK_LABEL[byCount] }, ...STATUSES.filter(x => x.v === 'order' || x.v === 'repair')]
    : [...(state === 'uncounted' ? [{ v: '', l: STOCK_LABEL.uncounted, off: true }] : []), ...STATUSES]
  const value = state === 'order' || state === 'repair' ? state : countDecides ? 'in_stock' : state === 'uncounted' ? '' : state
  const [v, setV] = useState(value)
  useEffect(() => { setV(value) }, [value])
  return (
    <select value={v} aria-label={`Status of ${label}`}
      title={countDecides && state === byCount ? `Worked out from the count. Change the count to change it.` : undefined}
      onChange={async e => { const next = e.target.value; if (!next) return; setV(next); try { await onSave(next) } catch { setV(value) } }}
      style={{ appearance: 'none', WebkitAppearance: 'none', flexShrink: 0, cursor: 'pointer', fontSize: 9, fontWeight: 700, color: colour, background: `${colour}22`, border: 0, padding: '3px 6px', borderRadius: 4, textTransform: 'uppercase', fontFamily: FONT, textAlign: 'center', outline: 'none' }}>
      {choices.map(s => <option key={s.v} value={s.v} disabled={s.off} style={{ color: T.text, background: T.panel, textTransform: 'none' }}>{s.l}</option>)}
    </select>
  )
}

function KitCard({ T, accent, type, items, reload, remove }: { T: ThemeTokens; accent: AccentTokens; type: string; items: Kit[]; reload: () => void; remove: (id: string) => Promise<void> }) {
  const [adding, setAdding] = useState('')
  // A ref, not state: a double-click lands twice before React has re-rendered,
  // so a state flag was still "not busy" for the second click and the line
  // went in twice.
  const busy = useRef(false)
  const [err, setErr] = useState(false)
  const add = async () => {
    const label = adding.trim()
    if (!label || busy.current) return
    busy.current = true; setErr(false)
    try { await dbInsert('coach_kit_items', { session_type: type, label }); setAdding(''); reload() }
    catch { setErr(true) }
    finally { busy.current = false }
  }
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 10 }}>{type}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(k => (
          <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: accent.hex, fontSize: 11 }}>•</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: T.text2, overflowWrap: 'anywhere' }}>{k.label}</span>
            <button onClick={() => remove(k.id).then(reload)} aria-label={`Remove ${k.label}`} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, width: '100%' }}>
        <input value={adding} onChange={e => setAdding(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void add() }} placeholder="Add item" maxLength={120} style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 9px', fontSize: 12, fontFamily: FONT, outline: 'none' }} />
        <button onClick={() => void add()} aria-label={`Add to ${type}`} style={{ flexShrink: 0, appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+</button>
      </div>
      {err && <div style={{ fontSize: 11, color: T.bad, marginTop: 6 }}>That was not added. Try again.</div>}
    </div>
  )
}

function ItemForm({ T, accent, item, onClose, onSave, onDelete }: { T: ThemeTokens; accent: AccentTokens; item: Item | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ item: item?.item || '', category: item?.category || '', quantity: item?.quantity ?? '', low_at: item?.low_at ?? '', status: item?.status || 'in_stock', notes: item?.notes || '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: string, v: any) => { setErr(''); setD(p => ({ ...p, [k]: v })) }
  // Tapping beside the form closes it at once if nothing was typed, and asks first if something was.
  const closeOutside = useAskBeforeClose(JSON.stringify(d), onClose)
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const quantity = wholeNumber(d.quantity)
  const lowAt = wholeNumber(d.low_at)
  const limit = MAX_STOCK.toLocaleString('en-GB')
  const save = async () => {
    if (!String(d.item).trim() || saving) return
    // Said here, in words. "2.5" and "99999999999" used to go to the database,
    // which refused them, and the form simply sat there.
    if (quantity === undefined) { setErr(`Quantity needs to be a whole number from 0 to ${limit}.`); return }
    if (lowAt === undefined) { setErr(`“Running low at” needs to be a whole number from 0 to ${limit}.`); return }
    setSaving(true); setErr('')
    try { await onSave({ item: String(d.item).trim(), category: d.category, quantity, low_at: lowAt, status: d.status, notes: d.notes }) }
    catch { setErr('That was not saved. Check your connection and try again.') }
    finally { setSaving(false) }
  }
  // What the row will show once saved, so the coach is not surprised when a
  // count of 0 turns their "In stock" into "Out of stock".
  const will = quantity === undefined || lowAt === undefined ? null : stockState({ quantity, low_at: lowAt, status: d.status })
  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 420, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{item ? 'Edit item' : 'Add item'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Item *</label><input value={d.item} onChange={e => set('item', e.target.value)} placeholder="e.g. Yellow balls" maxLength={120} style={field} /></div>
          <div><label style={lab}>Category</label><input value={d.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Balls & baskets" maxLength={60} style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Quantity</label><input inputMode="numeric" value={d.quantity} onChange={e => set('quantity', e.target.value)} placeholder="Not counted" style={field} /></div>
            <div><label style={lab}>Running low at</label><input inputMode="numeric" value={d.low_at} onChange={e => set('low_at', e.target.value)} placeholder="Optional" style={field} /></div>
          </div>
          <div><label style={lab}>Status</label><select value={d.status} onChange={e => set('status', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: -4 }}>
            {will && will !== d.status
              ? <>This will show as <strong style={{ color: T.text2 }}>{STOCK_LABEL[will]}</strong>, because of the count. </>
              : null}
            A quantity of 0 shows as out of stock. Set “Running low at” and the item is flagged when the count drops to it.
          </div>
          <div><label style={lab}>Notes / location</label><input value={d.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Main coaching bag" maxLength={200} style={field} /></div>
        </div>
        {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 12 }}>{err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          {onDelete && <button onClick={async () => { if (confirm('Delete this item?')) { try { await onDelete() } catch { setErr('That was not deleted. Try again.') } } }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!String(d.item).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.item).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function printKit(types: string[], kits: Kit[], items: Item[]) {
  if (typeof window === 'undefined') return
  const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  const kitBlocks = types.map(t => { const list = kits.filter(k => k.session_type === t); return list.length ? `<h3>${esc(t)}</h3><ul>${list.map(k => `<li>${esc(k.label)}</li>`).join('')}</ul>` : '' }).join('')
  const cats = Array.from(new Set(items.map(i => i.category || 'Uncategorised')))
  const inv = cats.map(c => `<h3>${esc(c)}</h3><ul>${items.filter(i => (i.category || 'Uncategorised') === c).map(i => `<li>${esc(i.item)}${i.quantity != null ? ` ×${i.quantity}` : ''} — ${esc(STOCK_LABEL[stockState(i)])}</li>`).join('')}</ul>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kit list</title><style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:720px;margin:32px auto;color:#111;padding:0 20px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#555;margin:16px 0 6px}ul{margin:0;padding-left:20px}li{margin:2px 0;font-size:13px}</style></head><body><h1>Kit list</h1><h2 style="color:#444">Session kits</h2>${kitBlocks}<h2 style="color:#444;margin-top:24px">Inventory</h2>${inv}</body></html>`
  const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300) }
}
