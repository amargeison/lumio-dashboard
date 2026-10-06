'use client'

import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachSettings } from '../_lib/use-settings'
import { useCoachProfile, saveCoachProfile, sb, currentCoachId, invalidateCoachTable, useCoachTable } from '../_lib/coach-db'
import { setSettings, getSettings, resetSettings, getHeadProfile, setHeadProfile, ACCENT_PRESETS, ACCREDITATIONS, DEFAULT_SETTINGS, LIVE_DEFAULT_SETTINGS, MODULE_SECTIONS, setSectionOff, type AccentKey } from '../_lib/settings-store'
import { STUDENT_TOGGLEABLE } from '@/lib/student/sections'
import { COACH_SIDEBAR, COACH_GROUPS, VENUES, COACH_ORG } from '../_lib/coach-data'
import { getAddedVenues } from '../_lib/venues-store'
import { AddVenueModal } from './AddVenueModal'
import { getHidden, setHidden as setMenuHidden, ALWAYS_VISIBLE, subscribe as subscribeMenu } from '../_lib/menu-visibility'
import { getFlags, setFlag, subscribe as subscribeFeatures, DEMO_FLAGS, NEW_ACCOUNT_TIER } from '../_lib/feature-flags'
import { IntegrationsPanel } from './IntegrationsPanel'
import { CoachContactSettings, EMAIL_OK, phoneOk } from './CoachContactSettings'
import { readHours } from '@/lib/coach/bookable-hours'
import { CoachVenuesSettings } from './CoachVenuesSettings'
import { CoachDevelopmentSettings } from './CoachDevelopmentSettings'
import { TakePayments } from './TakePayments'
import { CoachCompliance } from './CoachCompliance'
import { CoachImport, ImportPendingDialog, type PendingImport } from './CoachImport'
import { seedLumioResources, LUMIO_RESOURCES, isLumioResource } from '../_lib/lumio-resources'
import { seedLumioEquipment, EQUIPMENT_KIT_CHOICES, EQUIPMENT_CATEGORY_CHOICES } from '../_lib/lumio-equipment'
import { seedLumioPackages, LUMIO_PACKAGES } from '../_lib/lumio-packages'
import { V2_LABEL, V2_NOTES } from '@/lib/coach/v2'
import { parseAmount, formatPounds } from '@/lib/coach/money'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── small form primitives ───────────────────────────────────────────────────
function Field({ T, label, children, hint }: { T: ThemeTokens; label: string; children: ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}
function input(T: ThemeTokens): CSSProperties {
  return { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
}
// Said when a chosen logo cannot be read as a picture (a PDF, or a text file
// renamed .png). The upload used to do nothing at all.
const LOGO_NOT_IMAGE = 'That file is not a picture we can use. Choose a PNG, JPG or SVG image.'
// Resize a logo to a <=max px data URL (keeps aspect ratio — no square crop).
function fileToLogoDataUrl(file: File, max = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('no ctx'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
// Persist the club logo to the coach's profile so it survives across devices.
async function saveBrandLogo(dataUrl: string | null) {
  // The partner sign-in page is the academy's logo on a page of its own, and
  // cannot be switched on without one — so it goes off when the logo goes.
  setSettings({ brandLogo: dataUrl || '', ...(dataUrl ? {} : { partnerLogin: false }) })
  try { const uid = await currentCoachId(); if (uid) await sb().from('sports_profiles').update({ brand_logo_url: dataUrl }).eq('id', uid) } catch { /* local still applied */ }
}
function Seg<V extends string | number>({ T, accent, options, value, onChange }: { T: ThemeTokens; accent: AccentTokens; options: { v: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  return (
    <div style={{ display: 'inline-flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9 }}>
      {options.map(o => {
        const on = o.v === value
        return <button key={String(o.v)} onClick={() => onChange(o.v)} style={{ appearance: 'none', border: 0, padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: on ? accent.hex : 'transparent', color: on ? T.btnText : T.text2, fontWeight: on ? 600 : 400 }}>{o.label}</button>
      })}
    </div>
  )
}
function Toggle({ T, accent, on, onChange, label, desc }: { T: ThemeTokens; accent: AccentTokens; on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: '100%', appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 10.5, color: T.text3 }}>{desc}</div>}
      </div>
      <div style={{ width: 38, height: 22, borderRadius: 11, background: on ? accent.hex : T.hover, position: 'relative', flexShrink: 0, transition: 'background .15s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
      </div>
    </button>
  )
}
function Modal({ T, accent, title, sub, onClose, children, readOnly = false, wide = false }: { T: ThemeTokens; accent: AccentTokens; title: string; sub?: string; onClose: () => void; children: ReactNode; readOnly?: boolean; wide?: boolean }) {
  // Escape closes the card, the same as the × and Done.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: wide ? 680 : 480, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: T.text3 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 17, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 18 }}>
          {readOnly && <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 9, background: T.panel2, border: `1px solid ${T.border}`, fontSize: 11.5, color: T.text3 }}>🔒 This is a demo — settings are read-only.</div>}
          <div style={readOnly ? { pointerEvents: 'none', opacity: 0.6 } : undefined}>{children}</div>
        </div>
        <div style={{ padding: '0 18px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10.5, color: readOnly ? T.text3 : accent.hex, display: 'flex', alignItems: 'center', gap: 5 }}>{readOnly ? '🔒 Read-only in the demo' : <><Icon name="check" size={12} stroke={2.2} /> Changes save & apply instantly</>}</span>
          <button onClick={onClose} style={{ appearance: 'none', border: 0, padding: '8px 18px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  )
}

// "Start again" for an import that went wrong.
//
// A coach who imports the wrong file, or the right file twice, used to have one
// way back: open each player and delete them, 380 times. This removes whole
// lists in one go so the import can be run again cleanly.
//
// It covers every list an import can fill — an import that went wrong has to be
// fully undoable, or the second attempt lands on top of the first (84 payments
// become 168). Two things are never taken: the head coach's own staff row, and
// any coach who has a portal login (their access hangs off that row — remove
// those one by one in Coaches & Staff). It takes ticking the list AND typing
// DELETE. Only the head coach ever sees Settings → Import, and it is hidden in
// the demo.
//
// Each list is emptied on its own and reports on its own. One list failing used
// to stop every list after it, so "Tick everything" removed the players and
// left the rest, with one error to explain it all.
type StartAgainTable = 'coach_players' | 'coach_staff' | 'coach_courts' | 'coach_venues' | 'coach_camps' | 'coach_equipment' | 'coach_payments' | 'coach_resources'
const START_AGAIN: { key: string; table: StartAgainTable; label: string; one: string; many: string; note: string }[] = [
  // Players go the same way as Delete on the roster (see run below), so what is
  // said here is what that does.
  { key: 'players', table: 'coach_players', label: 'Players', one: 'player', many: 'players', note: 'with their skills, attendance, bookings, lesson summaries, messages, recordings and family logins. Their payments and paid camp places are kept, with the name removed' },
  { key: 'staff', table: 'coach_staff', label: 'Coaches & staff', one: 'coach', many: 'coaches', note: 'not you, and not anyone with a portal login' },
  { key: 'camps', table: 'coach_camps', label: 'Camps', one: 'camp', many: 'camps', note: 'with their attendee lists and camp messages' },
  { key: 'courts', table: 'coach_courts', label: 'Courts', one: 'court', many: 'courts', note: 'every court at every venue' },
  { key: 'venues', table: 'coach_venues', label: 'Venues', one: 'venue', many: 'venues', note: 'with the courts at them, including your home venue — add it again in Court Planner' },
  { key: 'equipment', table: 'coach_equipment', label: 'Equipment', one: 'equipment item', many: 'equipment items', note: 'the club’s list only; each coach’s own list and kit bags stay' },
  { key: 'payments', table: 'coach_payments', label: 'Payments', one: 'payment', many: 'payments', note: 'every invoice and assigned package, paid or not' },
  { key: 'resources', table: 'coach_resources', label: 'Resources', one: 'resource', many: 'resources', note: 'including the Lumio library — switch it back on in Resource settings' },
]
type StartAgainResult = { key: string; label: string; ok: boolean; text: string }
function ImportStartAgain({ T }: { T: ThemeTokens }) {
  const [shown, setShown] = useState(false)
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [word, setWord] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | { results: StartAgainResult[] }>('idle')
  const [progress, setProgress] = useState('')

  const loadCounts = async () => {
    const uid = await currentCoachId()
    if (!uid) return
    const out: Record<string, number> = {}
    for (const t of START_AGAIN) {
      // A count that cannot be read leaves that one line at "…"; the others
      // still show.
      try {
        if (t.table === 'coach_staff') { out[t.key] = (await removableStaff(uid)).length; continue }
        let q = sb().from(t.table).select('id', { count: 'exact', head: true }).eq('coach_id', uid)
        // Equipment: the club's list only. A coach's own kit list sits in the
        // same table under their staff_id and is not the head coach's to empty.
        if (t.table === 'coach_equipment') q = q.is('staff_id', null)
        const { count, error } = await q
        if (!error) out[t.key] = count ?? 0
      } catch { /* left at "…" */ }
    }
    setCounts(out)
  }
  // Coaches who can sign in. Their coach_staff row is what their login is tied
  // to, so a bulk delete must step round them.
  const staffToKeep = async (uid: string): Promise<string[]> => {
    const { data } = await sb().from('coach_members').select('staff_id').eq('academy_id', uid).not('staff_id', 'is', null)
    return [...new Set(((data ?? []) as { staff_id: string | null }[]).map(r => r.staff_id).filter((x): x is string => !!x))]
  }
  // The staff rows that may go: read first, then deleted by id. Asking the
  // database to "delete everyone who is not the head coach" in one request was
  // refused outright (it will not filter a delete on a column it is not also
  // returning), so this list was never emptied.
  const removableStaff = async (uid: string): Promise<string[]> => {
    const keep = new Set(await staffToKeep(uid))
    const { data, error } = await sb().from('coach_staff').select('id, is_head').eq('coach_id', uid)
    if (error) throw new Error(error.message)
    return ((data ?? []) as { id: string; is_head: boolean | null }[]).filter(r => !r.is_head && !keep.has(r.id)).map(r => r.id)
  }
  const openUp = () => { setShown(true); setState('idle'); setWord(''); setPicked([]); void loadCounts() }

  // Players are removed the way Delete on the roster removes them — through the
  // server, one at a time — so their family logins, photos, recordings and
  // calendar entries go too, and their payments are kept without the name. A
  // plain delete of the rows left all of that behind.
  const erasePlayers = async (uid: string, say: (done: number, of: number) => void): Promise<{ done: number; failed: number }> => {
    const { data, error } = await sb().from('coach_players').select('id').eq('coach_id', uid)
    if (error) throw new Error(error.message)
    const ids = ((data ?? []) as { id: string }[]).map(r => r.id)
    let done = 0, failed = 0
    const todo = [...ids]
    const worker = async () => {
      while (todo.length) {
        const id = todo.shift()!
        try {
          const res = await fetch('/api/coach/players/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
          if (res.ok) done++; else failed++
        } catch { failed++ }
        say(done + failed, ids.length)
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker))
    return { done, failed }
  }

  const run = async () => {
    if (state === 'busy' || !picked.length || word.trim().toUpperCase() !== 'DELETE') return
    setState('busy'); setProgress('')
    const results: StartAgainResult[] = []
    const n = (count: number, t: { one: string; many: string }) => `${count} ${count === 1 ? t.one : t.many}`
    const uid = await currentCoachId().catch(() => null)
    if (!uid) {
      setState({ results: [{ key: 'signin', label: 'Nothing was deleted', ok: false, text: 'you are signed out. Sign in again and retry.' }] })
      return
    }
    for (const t of START_AGAIN.filter(x => picked.includes(x.key))) {
      setProgress(`Deleting ${t.label.toLowerCase()}…`)
      // Each list is its own attempt: a failure is recorded against that list
      // and the next one still runs.
      try {
        if (t.table === 'coach_players') {
          const { done, failed } = await erasePlayers(uid, (d, of) => setProgress(`Deleting players… ${d} of ${of}`))
          results.push(failed
            ? { key: t.key, label: t.label, ok: false, text: `${n(done, t)} deleted, ${failed} could not be deleted. Press Delete again to retry those.` }
            : { key: t.key, label: t.label, ok: true, text: `${n(done, t)} deleted.` })
          continue
        }
        // Scoped to this academy to match RLS; .select() returns what was
        // deleted so the coach gets a real number back.
        let del = sb().from(t.table).delete().eq('coach_id', uid)
        // Same rule as the count above: only the club's own list, never a
        // coach's own kit (the head coach's sign-in is allowed to delete those,
        // so it has to be said here).
        if (t.table === 'coach_equipment') del = del.is('staff_id', null)
        if (t.table === 'coach_staff') {
          const ids = await removableStaff(uid)
          if (!ids.length) { results.push({ key: t.key, label: t.label, ok: true, text: 'nobody to delete. You and coaches with a portal login are kept.' }); continue }
          del = del.in('id', ids)
        }
        const { data, error } = await del.select('id')
        if (error) throw new Error(error.message)
        results.push({ key: t.key, label: t.label, ok: true, text: `${n((data ?? []).length, t)} deleted.` })
        // The Lumio library went with the rest, so its toggle must stop reading "on".
        if (t.table === 'coach_resources') setSettings({ resourcesPreloaded: false })
        if (t.table === 'coach_camps') {
          // Same clean-up a single camp delete does: take it off the connected calendar.
          for (const row of (data ?? []) as { id: string }[]) {
            fetch(`/api/coach/camps/sync?campId=${encodeURIComponent(row.id)}`, { method: 'DELETE' }).catch(() => { /* the camp is gone either way */ })
          }
        }
      } catch (e) {
        console.error('[start again]', t.table, e)
        results.push({ key: t.key, label: t.label, ok: false, text: 'could not be deleted, so this list was left as it is. Try again, and if it keeps happening contact Lumio support.' })
      }
    }
    invalidateCoachTable()   // every cached list — rosters, attendance, skills all hang off these
    setProgress('')
    // Anything that failed stays ticked so it can be retried; the rest is done.
    setState({ results }); setWord(''); setPicked(results.filter(r => !r.ok && r.key !== 'signin').map(r => r.key))
    void loadCounts()
  }

  const ready = picked.length > 0 && word.trim().toUpperCase() === 'DELETE' && state !== 'busy'
  const total = picked.reduce((n, k) => n + (counts?.[k] ?? 0), 0)
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.bad, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Start again</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 12px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>Delete imported data</div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2, lineHeight: 1.5 }}>Imported the wrong file, or the same one twice? Empty a whole list in one go, then import again. There is no undo.</div>
        {!shown ? (
          <button onClick={openUp}
            style={{ marginTop: 10, appearance: 'none', background: 'transparent', color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
            Choose what to delete…
          </button>
        ) : (
          <div style={{ marginTop: 10 }}>
            <button onClick={() => { const all = START_AGAIN.filter(t => (counts?.[t.key] ?? 0) > 0).map(t => t.key); setPicked(p => p.length === all.length ? [] : all) }} disabled={state === 'busy' || !counts}
              style={{ appearance: 'none', background: 'transparent', border: 0, padding: 0, margin: '0 0 8px', color: T.text2, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', textDecoration: 'underline' }}>
              {picked.length > 0 && picked.length === START_AGAIN.filter(t => (counts?.[t.key] ?? 0) > 0).length ? 'Untick all' : 'Tick everything'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {START_AGAIN.map(t => {
                const n = counts?.[t.key]
                const on = picked.includes(t.key)
                const none = n === 0
                return (
                  <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, border: `1px solid ${on ? T.bad : T.border}`, cursor: none ? 'default' : 'pointer', opacity: none ? 0.5 : 1 }}>
                    <input type="checkbox" checked={on} disabled={none || state === 'busy'}
                      onChange={e => setPicked(p => e.target.checked ? [...p, t.key] : p.filter(k => k !== t.key))} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{t.label}</span>
                      <span style={{ fontSize: 10.5, color: T.text3 }}> — {t.note}</span>
                    </span>
                    <span style={{ fontSize: 11.5, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>{n === undefined ? '…' : n}</span>
                  </label>
                )
              })}
            </div>
            <div style={{ fontSize: 10.5, color: T.text3, margin: '9px 0', lineHeight: 1.5 }}>
              Not touched: you and any coach with a portal login, kit bags, your package price list, and card payments already taken through your payment provider. Deleting players also removes their bookings, lesson summaries, messages and family logins, the same as Delete on the roster.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input value={word} onChange={e => setWord(e.target.value)} placeholder="Type DELETE to confirm" disabled={state === 'busy'}
                style={{ flex: '1 1 180px', minWidth: 0, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 10px', color: T.text, fontSize: 12.5, fontFamily: FONT }} />
              <button onClick={() => { void run() }} disabled={!ready}
                style={{ appearance: 'none', background: ready ? T.bad : 'transparent', color: ready ? '#fff' : T.bad, border: `1px solid ${T.bad}`, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5 }}>
                {state === 'busy' ? (progress || 'Deleting…') : picked.length ? `Delete ${total} record${total === 1 ? '' : 's'}` : 'Delete'}
              </button>
              <button onClick={() => setShown(false)} disabled={state === 'busy'}
                style={{ appearance: 'none', background: 'transparent', color: T.text3, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontFamily: FONT, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {typeof state === 'object' && (
          <div style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.6 }}>
            {state.results.map(r => (
              <div key={r.key} style={{ color: r.ok ? T.text2 : T.bad }}>{r.ok ? '✓' : '✕'} {r.label}: {r.text}</div>
            ))}
            {state.results.every(r => r.ok) && <div style={{ color: T.text3 }}>You can import again above.</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// Resource Centre module settings. Both controls act on the coach's OWN live
// Resource Centre (the coach_resources rows behind /resources), not on a preview.
//
// Why this exists: the Lumio starter library could only ever be loaded during
// onboarding. A coach who chose “I’ll add my own” was stuck with an empty Centre
// for good — a one-way door with no handle on the inside. And a coach who loaded
// it by mistake had to delete every card one at a time. Both now have a control.
// One honest line about the mailbox/calendar, wherever Settings used to offer a
// toggle that only wrote to this browser.
//
// The old controls — a Google/Outlook picker on the profile, "Google Calendar"
// and "Outlook" switches on the booking page — looked like they connected
// something. They did not: connecting needs the provider's consent screen, and
// the switches only set a local preference. A coach could therefore turn
// "Google Calendar" on, see it stay on, and reasonably conclude their bookings
// were syncing. This reads the real connection instead and sends them to the one
// place that can change it.
function ConnectedAccountsLine({ T, accent, onOpen, demo }: { T: ThemeTokens; accent: AccentTokens; onOpen: () => void; demo?: boolean }) {
  // The demo portal has no account to ask about, so it starts settled rather
  // than flashing "Checking…" at a coach who is only looking around.
  const [state, setState] = useState<{ loading: boolean; mail: string | null; cal: string | null; reauth: boolean }>(
    () => ({ loading: !demo, mail: null, cal: null, reauth: false }))
  useEffect(() => {
    if (demo) return
    let off = false
    ;(async () => {
      try {
        const res = await fetch('/api/coach/integrations')
        if (!res.ok) { if (!off) setState(s0 => ({ ...s0, loading: false })); return }
        const j = await res.json()
        const conns: { provider: string; email_address: string | null; capabilities: string[]; status: string }[] = j.connections || []
        const name = (p: string) => p === 'google' ? 'Gmail' : p === 'microsoft' ? 'Outlook' : 'iCloud'
        const live = conns.filter(c => c.status !== 'reauth')
        const mail = live.find(c => (c.capabilities || []).includes('send_email'))
        const cal = live.find(c => (c.capabilities || []).includes('calendar'))
        if (!off) setState({
          loading: false,
          mail: mail ? `${name(mail.provider)}${mail.email_address ? ` · ${mail.email_address}` : ''}` : null,
          cal: cal ? name(cal.provider) : null,
          reauth: conns.some(c => c.status === 'reauth'),
        })
      } catch { if (!off) setState(s0 => ({ ...s0, loading: false })) }
    })()
    return () => { off = true }
  }, [demo])

  const line = state.loading ? 'Checking…'
    : demo ? 'Connect a mailbox and calendar from your own portal.'
    : state.reauth ? 'A connected account needs reconnecting — sync and send-as have stopped.'
    : state.mail || state.cal
      ? `${state.cal ? `Bookings sync to your ${state.cal} calendar` : 'No calendar connected'} · ${state.mail ? `email sends from ${state.mail}` : 'email sends from the Lumio address'}`
      : 'Nothing connected yet — bookings stay in Lumio and email sends from the Lumio address.'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${state.reauth ? T.warn : T.border}`, background: T.panel2, borderRadius: 10, padding: '11px 12px', marginBottom: 12 }}>
      <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: state.reauth ? T.warn : T.text2, lineHeight: 1.5 }}>{line}</div>
      <button onClick={onOpen} style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', background: accent.hex, color: T.btnText, flexShrink: 0 }}>
        {state.mail || state.cal ? 'Manage' : 'Connect'}
      </button>
    </div>
  )
}

function ResourceCentreSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  // The switch shows what is TRUE, not only what was chosen. The setting starts
  // as "on" for every academy, but the library is only in the Resource Centre
  // once it has been loaded — so a new academy that skipped the setup wizard saw
  // this switch on, over a count of 89 resources, with none there. It is on when
  // the setting is on AND Lumio's resources are really in the academy's library;
  // otherwise it is off, and switching it on loads them.
  const library = useCoachTable<{ id: string; title: string; url?: string | null }>('coach_resources')
  const loaded = library.rows.filter(isLumioResource).length
  const wanted = s.resourcesPreloaded !== false
  const on = wanted && (library.loading || loaded > 0)
  const [seed, setSeed] = useState<'idle' | 'busy' | 'error' | { added: number }>('idle')
  const [wipe, setWipe] = useState<'idle' | 'busy' | 'error' | { removed: number }>('idle')

  const toggleLibrary = async (v: boolean) => {
    if (seed === 'busy' || wipe === 'busy') return
    setSettings({ resourcesPreloaded: v })
    if (!v) { setSeed('idle'); return }
    setSeed('busy')
    try {
      // Safe to run whatever the coach already has — the seeder skips any title
      // already in their library, so switching this back on never duplicates.
      const added = await seedLumioResources()
      invalidateCoachTable('coach_resources')  // Resource Centre reads a cached table — force a fresh read
      await library.reload()                   // …and so does the switch above
      setSeed({ added })
    } catch { setSeed('error') }
  }

  const clearAll = async () => {
    if (seed === 'busy' || wipe === 'busy') return
    if (!confirm('Delete every resource in your Resource Centre? That includes the Lumio library and anything you have added yourself. This cannot be undone.')) return
    setWipe('busy')
    try {
      const uid = await currentCoachId()
      if (!uid) { setWipe('error'); return }
      // Scoped to the signed-in coach to match RLS (coach_id = auth.uid()); the
      // .select() hands back the deleted rows, so the coach gets a real count
      // rather than a button that appears to do nothing.
      const { data, error } = await sb().from('coach_resources').delete().eq('coach_id', uid).select('id, url')
      if (error) throw new Error(error.message)
      invalidateCoachTable('coach_resources')
      await library.reload()
      // The files those resources carried go too (the server removes only files
      // that no resource uses any more). They used to stay in storage for good.
      const paths = ((data ?? []) as { url?: string | null }[]).map(r => String(r.url || '')).filter(u => u.startsWith('file:')).map(u => u.slice(5))
      if (paths.length) void fetch('/api/coach/resources/file', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths }) }).catch(() => { /* left for the next tidy */ })
      // The library has just been deleted, so the toggle must stop claiming it
      // is loaded — otherwise it reads “on” over an empty Centre.
      setSettings({ resourcesPreloaded: false })
      setSeed('idle')
      setWipe({ removed: (data ?? []).length })
    } catch { setWipe('error') }
  }

  const note: CSSProperties = { fontSize: 11, marginBottom: 8, lineHeight: 1.5 }
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 8px' }}>Library</div>
      <Toggle T={T} accent={accent} on={on} onChange={v => { void toggleLibrary(v) }} label="Lumio starter library"
        desc={on ? `${library.loading ? LUMIO_RESOURCES.length : loaded} drills, plans and worksheets in your live Resource Centre, tagged to the racket system.`
          : wanted ? `Not loaded yet. Switch this on to add Lumio’s ${LUMIO_RESOURCES.length} drills, plans and worksheets to your Resource Centre.`
          : 'Off — Lumio’s library, drill library and book shelf are hidden. Your Resource Centre and the player app show only what you add yourself.'} />
      {seed === 'busy' && <div style={{ ...note, color: T.text3 }}>Loading the library into your Resource Centre…</div>}
      {typeof seed === 'object' && <div style={{ ...note, color: T.good }}>✓ Added {seed.added} resource{seed.added === 1 ? '' : 's'}{seed.added === 0 ? ' — you already had the full library' : ''}.</div>}
      {seed === 'error' && <div style={{ ...note, color: T.bad }}>Couldn’t load the library — try again.</div>}
      <div style={{ ...note, color: T.text3, marginBottom: 16 }}>Switching this off hides Lumio’s resources straight away — nothing is deleted, and your own stay put. Switch it back on to bring them back. To delete everything for good, use Clear all resources.</div>

      <div style={{ fontSize: 10, fontWeight: 700, color: T.bad, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Danger zone</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 12px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>Clear all resources</div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2, lineHeight: 1.5 }}>Permanently deletes every resource in your live Resource Centre — Lumio’s and your own. There is no undo.</div>
        <button onClick={() => { void clearAll() }} disabled={wipe === 'busy'}
          style={{ marginTop: 10, appearance: 'none', background: 'transparent', color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: wipe === 'busy' ? 'default' : 'pointer', opacity: wipe === 'busy' ? 0.6 : 1 }}>
          {wipe === 'busy' ? 'Clearing…' : 'Clear all resources'}
        </button>
        {typeof wipe === 'object' && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8 }}>Cleared {wipe.removed} resource{wipe.removed === 1 ? '' : 's'}.</div>}
        {wipe === 'error' && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>Couldn’t clear your resources — try again.</div>}
      </div>
    </>
  )
}

// Booking confirmation emails — lives on the Booking Calendar module because that
// is where bookings are made, and a coach looking for "does this email people?"
// looks at the calendar rather than at a messaging screen.
//
// This is a kill switch with real-world consequences in BOTH directions: on, and
// a test booking emails a real parent; off, and nobody is told their session is
// confirmed. So the copy states plainly who receives what, and the panel warns
// when the coach's own copy cannot be delivered.
function BookingEmailsSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const profile = useCoachProfile()
  const on = s.bookingEmails !== false
  const coachEmail = (profile.contact_email || '').trim()

  const note: CSSProperties = { fontSize: 11, marginBottom: 8, lineHeight: 1.5 }
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 8px' }}>Confirmation emails</div>
      <Toggle T={T} accent={accent} on={on} onChange={v => setSettings({ bookingEmails: v })} label="Email a confirmation when a booking is made"
        desc={on
          ? 'Sent from your own address the moment a booking is created — with the date, the venue and a map link, what you covered last session including any homework, and what this session will work on.'
          : 'Off — nobody is emailed when a booking is made, including you.'} />

      {on && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 12px', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Who receives it</div>
          <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.6 }}>
            <div><strong style={{ color: T.text }}>Under 16</strong> — sent to the parent on the player&apos;s record, never to the child. If a player&apos;s age is blank they are treated as under 16.</div>
            <div style={{ marginTop: 5 }}><strong style={{ color: T.text }}>16 and over</strong> — sent to the player.</div>
            <div style={{ marginTop: 5 }}><strong style={{ color: T.text }}>You</strong> — always copied, so a booking never goes unseen. Your copy also states where the player&apos;s went, and why.</div>
          </div>
        </div>
      )}

      {on && !coachEmail && (
        <div style={{ ...note, color: T.warn, background: `${T.warn}14`, border: `1px solid ${T.warn}33`, borderRadius: 9, padding: '9px 11px' }}>
          ⚠ No contact email on your profile, so your own copy cannot be sent. Add one in Settings → Contact details — players and parents will still be emailed.
        </div>
      )}
      <div style={{ ...note, color: T.text3, marginBottom: 16 }}>
        A player with no email on file — and an under-16 with no parent email — is skipped rather than emailed at a guessed address. Add addresses on the Player Roster.
      </div>
    </>
  )
}

// How big the Lumio starter kit actually is — derived from the seed data rather
// than hard-coded, so this copy can never drift from what the button inserts.
const LUMIO_KIT_COUNT = EQUIPMENT_KIT_CHOICES.reduce((n, k) => n + k.count, 0)
const LUMIO_INVENTORY_COUNT = EQUIPMENT_CATEGORY_CHOICES.reduce((n, c) => n + c.count, 0)

// Equipment & Kit module settings — the same two controls as the Resource Centre
// above, over the coach's OWN live module.
//
// Why this exists: the starter kit could only ever be loaded from the setup
// wizard, and the wizard only offers itself on an empty module. A coach who
// chose “I’ll add my own”, or who later cleared the lot, had no route back to
// Lumio’s list; a coach who loaded it by mistake had to delete 67 rows one at a
// time. Both now have a control here.
//
// Unlike Resources, this module is backed by TWO tables — coach_kit_items (the
// per-session-type checklists) and coach_equipment (the inventory) — so both the
// seed and the wipe must cover the pair, or the module is left half-full.
function EquipmentKitSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  // `equipmentSeeded` now means “the coach has answered the starter-kit question”
  // (it used to mean “we auto-seeded”). It is what LiveEquipment reads to decide
  // whether to show SetupWizard, so this toggle and that wizard stay in step.
  const on = s.equipmentSeeded === true
  // What is actually in the module. The line under the toggle used to print the
  // size of Lumio's full kit, which is wrong for a coach who chose to start empty.
  const { rows: kitRows } = useCoachTable<{ id: string }>('coach_kit_items')
  const { rows: invRows } = useCoachTable<{ id: string }>('coach_equipment')
  const [seed, setSeed] = useState<'idle' | 'busy' | 'error' | { kits: number; items: number }>('idle')
  const [wipe, setWipe] = useState<'idle' | 'busy' | 'error' | { kits: number; items: number }>('idle')

  const toggleKit = async (v: boolean) => {
    if (seed === 'busy' || wipe === 'busy') return
    setSettings({ equipmentSeeded: v })
    if (!v) { setSeed('idle'); return }
    setSeed('busy')
    try {
      // Called with no selection = the whole starter kit (the optional argument is
      // for the wizard's tick boxes). The seeder skips anything the coach already
      // has, so pressing this twice never duplicates a row.
      const { kits, items } = await seedLumioEquipment()
      invalidateCoachTable('coach_kit_items')  // both halves are cached table reads —
      invalidateCoachTable('coach_equipment')  // force a fresh read of each
      setSeed({ kits, items })
    } catch { setSeed('error') }
  }

  const clearAll = async () => {
    if (seed === 'busy' || wipe === 'busy') return
    if (!confirm('Delete every kit checklist item and every piece of inventory? That includes Lumio’s starter kit and anything you have added yourself. This cannot be undone.')) return
    setWipe('busy')
    try {
      const uid = await currentCoachId()
      if (!uid) { setWipe('error'); return }
      // Scoped to the signed-in coach to match RLS (coach_id = auth.uid()); the
      // .select() hands back the deleted rows, so the coach gets a real count
      // rather than a button that appears to do nothing. Two deletes, because the
      // module is two tables — clearing only one would leave it half-populated.
      // The ACADEMY's list only (staff_id null). A coach who has set up their own
      // kit list keeps it in these same tables (migration 168), and the head
      // coach's sign-in is allowed to delete those rows too — clearing the club's
      // store cupboard must not empty a coach's car boot.
      const kitDel = await sb().from('coach_kit_items').delete().eq('coach_id', uid).is('staff_id', null).select('id')
      if (kitDel.error) throw new Error(kitDel.error.message)
      const invDel = await sb().from('coach_equipment').delete().eq('coach_id', uid).is('staff_id', null).select('id')
      if (invDel.error) throw new Error(invDel.error.message)
      invalidateCoachTable('coach_kit_items')
      invalidateCoachTable('coach_equipment')
      // The module is empty again, so the coach has in effect un-answered the setup
      // question. Clearing the flag is what lets the setup wizard offer itself a
      // second time, instead of leaving them staring at an empty module with no
      // way to get Lumio's kit back.
      setSettings({ equipmentSeeded: false })
      setSeed('idle')
      setWipe({ kits: (kitDel.data ?? []).length, items: (invDel.data ?? []).length })
    } catch { setWipe('error') }
  }

  const note: CSSProperties = { fontSize: 11, marginBottom: 8, lineHeight: 1.5 }
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 8px' }}>Starter kit</div>
      <Toggle T={T} accent={accent} on={on} onChange={v => { void toggleKit(v) }} label="Lumio starter kit"
        desc={on ? `${kitRows.length} checklist item${kitRows.length === 1 ? '' : 's'} and ${invRows.length} inventory item${invRows.length === 1 ? '' : 's'} in your live module — edit quantities and remove what you don’t carry. The full starter kit is ${LUMIO_KIT_COUNT} checklist items and ${LUMIO_INVENTORY_COUNT} inventory items.` : 'Off — your kit checklists and inventory show only what you add yourself.'} />
      {seed === 'busy' && <div style={{ ...note, color: T.text3 }}>Loading the starter kit into your Equipment &amp; Kit module…</div>}
      {typeof seed === 'object' && <div style={{ ...note, color: T.good }}>✓ Added {seed.kits} kit item{seed.kits === 1 ? '' : 's'} and {seed.items} inventory item{seed.items === 1 ? '' : 's'}{seed.kits + seed.items === 0 ? ' — you already had the full starter kit' : ''}.</div>}
      {seed === 'error' && <div style={{ ...note, color: T.bad }}>Couldn’t load the starter kit — try again.</div>}
      <div style={{ ...note, color: T.text3, marginBottom: 16 }}>Switching this off leaves the kit you already have — it only stops Lumio’s starter kit being added. To empty the module, use Clear all kit &amp; inventory.</div>

      <div style={{ fontSize: 10, fontWeight: 700, color: T.bad, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Danger zone</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 12px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>Clear all kit &amp; inventory</div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2, lineHeight: 1.5 }}>Permanently deletes every session kit checklist and every inventory item — Lumio’s and your own. There is no undo. You’ll be offered the starter kit again next time you open the module.</div>
        <button onClick={() => { void clearAll() }} disabled={wipe === 'busy'}
          style={{ marginTop: 10, appearance: 'none', background: 'transparent', color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: wipe === 'busy' ? 'default' : 'pointer', opacity: wipe === 'busy' ? 0.6 : 1 }}>
          {wipe === 'busy' ? 'Clearing…' : 'Clear all kit & inventory'}
        </button>
        {typeof wipe === 'object' && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8 }}>Cleared {wipe.kits} kit item{wipe.kits === 1 ? '' : 's'} and {wipe.items} inventory item{wipe.items === 1 ? '' : 's'}.</div>}
        {wipe === 'error' && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>Couldn’t clear your equipment — try again.</div>}
      </div>
    </>
  )
}

// Payments & Packages module settings. Scope is the PRICE LIST only
// (coach_packages) — see clearAll for why the payments themselves are left alone.
//
// Why this exists: same one-way door as the other two modules. The starter price
// list was only ever offered on an empty module, so a coach who started from
// scratch (or cleared it) could never get Lumio’s packages back, and a coach who
// loaded them by mistake had to delete six packages by hand.
function PaymentsPackagesSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  // `packagesSeeded` now means “the coach has answered the starter-packages
  // question” (it used to mean “we auto-seeded”), and LivePayments reads it to
  // decide whether to show SetupWizard.
  //
  // It also reads On when the starter packages are plainly there: academies
  // set up before the question existed have all six and no answer recorded,
  // and the switch said Off above a price list full of them.
  const priceList = useCoachTable<{ name: string | null }>('coach_packages')
  const on = s.packagesSeeded === true || priceList.rows.some(r => LUMIO_PACKAGES.some(l => l.name === r.name))
  const [seed, setSeed] = useState<'idle' | 'busy' | 'error' | { added: number }>('idle')
  const [wipe, setWipe] = useState<'idle' | 'busy' | 'error' | { removed: number }>('idle')

  const togglePackages = async (v: boolean) => {
    if (seed === 'busy' || wipe === 'busy') return
    setSettings({ packagesSeeded: v })
    if (!v) { setSeed('idle'); return }
    setSeed('busy')
    try {
      // No argument = all of them (the optional list is for the wizard's tick
      // boxes). The seeder skips any package name the coach already has, so this
      // never duplicates and never overwrites prices they have edited.
      const added = await seedLumioPackages()
      invalidateCoachTable('coach_packages')  // the price list is a cached table read
      setSeed({ added })
    } catch { setSeed('error') }
  }

  const clearAll = async () => {
    if (seed === 'busy' || wipe === 'busy') return
    if (!confirm('Delete every package in your price list? That includes Lumio’s starter packages and any you have priced yourself. Player payments are not affected. This cannot be undone.')) return
    setWipe('busy')
    try {
      const uid = await currentCoachId()
      if (!uid) { setWipe('error'); return }
      // ONLY coach_packages. coach_payments is deliberately untouched: those rows
      // are real money — what each player has actually paid or owes — not a starter
      // set, and no button in Settings should be able to wipe a payment history.
      // (They reference a package by free-text name, not a foreign key, so deleting
      // the price list leaves every payment row intact and readable.)
      // Scoped to the signed-in coach to match RLS (coach_id = auth.uid()); the
      // .select() hands back the deleted rows so the coach gets a real count.
      const { data, error } = await sb().from('coach_packages').delete().eq('coach_id', uid).select('id')
      if (error) throw new Error(error.message)
      invalidateCoachTable('coach_packages')
      // Price list is empty again, so the coach has in effect un-answered the setup
      // question — clearing the flag lets the setup wizard offer the packages again.
      setSettings({ packagesSeeded: false })
      setSeed('idle')
      setWipe({ removed: (data ?? []).length })
    } catch { setWipe('error') }
  }

  const note: CSSProperties = { fontSize: 11, marginBottom: 8, lineHeight: 1.5 }
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 8px' }}>Price list</div>
      <Toggle T={T} accent={accent} on={on} onChange={v => { void togglePackages(v) }} label="Lumio starter packages"
        desc={on ? `${LUMIO_PACKAGES.length} ready-written packages in your live price list — rename, re-price or remove any of them.` : 'Off — your price list shows only the packages you add yourself.'} />
      {seed === 'busy' && <div style={{ ...note, color: T.text3 }}>Loading the starter packages into your price list…</div>}
      {typeof seed === 'object' && <div style={{ ...note, color: T.good }}>✓ Added {seed.added} package{seed.added === 1 ? '' : 's'}{seed.added === 0 ? ' — you already had the full set' : ''}.</div>}
      {seed === 'error' && <div style={{ ...note, color: T.bad }}>Couldn’t load the starter packages — try again.</div>}
      <div style={{ ...note, color: T.text3, marginBottom: 16 }}>Prices are Lumio’s suggestions, not yours — check every one before you share your price list. Switching this off leaves the packages you already have; to empty the list, use Clear all packages.</div>

      <div style={{ fontSize: 10, fontWeight: 700, color: T.bad, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Danger zone</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '11px 12px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>Clear all packages</div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2, lineHeight: 1.5 }}>Permanently deletes every package in your price list — Lumio’s and your own. Player payments and lesson packs are not touched. There is no undo.</div>
        <button onClick={() => { void clearAll() }} disabled={wipe === 'busy'}
          style={{ marginTop: 10, appearance: 'none', background: 'transparent', color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 9, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: wipe === 'busy' ? 'default' : 'pointer', opacity: wipe === 'busy' ? 0.6 : 1 }}>
          {wipe === 'busy' ? 'Clearing…' : 'Clear all packages'}
        </button>
        {typeof wipe === 'object' && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8 }}>Cleared {wipe.removed} package{wipe.removed === 1 ? '' : 's'}.</div>}
        {wipe === 'error' && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>Couldn’t clear your packages — try again.</div>}
      </div>
    </>
  )
}

// The lesson types a booking can be given (the Add booking form's list, less
// "Block", which is not a lesson). A real academy chooses among these.
const BOOKABLE_TYPES = ['Private', 'Group', 'Cardio', 'Match play']

// Lumio Coach Kit & Racket Progression rewards the coach can order (demo only —
// no real checkout/fulfilment). Effort tracking uses the player's own watch, so
// there's no GPS tracker — the kit is the capture stand, mic and rewards. £85.
const KIT_OFFERS = [
  { id: 'kit',     name: 'Lumio Coach Kit',     price: '£85', desc: 'Capture stand, mic, your first set of 9 reward keyrings & dampeners and the Black-stage trophy — everything to start. No GPS tracker: effort uses the player’s own smartwatch.', cta: 'Order kit' },
  { id: 'rackets', name: 'Reward set (×9)',     price: '£50 / set', desc: 'The Racket Progression rewards — a coloured keyring + matching dampener per level. Reorder as you award them.', cta: 'Reorder set' },
]

// A box whose value is checked before it is kept.
//
// What is typed is checked as it is typed, and a line under the box says what
// is wrong. It is SAVED when the coach leaves the box (or closes the card), and
// only if it passes — otherwise what was saved before stays. Saving on every
// keystroke kept the last readable part of something unreadable: "999999" in
// the rate box left 999 saved, and clearing the box to type "-5" left no rate
// at all, both without a word. The head coach's email and phone took any text
// (and copied it to their record on the Coaches page), and the bookable hours
// took "whenever" and quietly became 08:00–20:00.
function CheckedInput({ T, start, check, onGood, placeholder, kept, inputMode }: {
  T: ThemeTokens; start: string; check: (v: string) => string; onGood: (v: string) => void
  placeholder?: string; inputMode?: 'decimal' | 'text'
  /** The words after the problem, saying what is still saved. */
  kept: (saved: string) => string
}) {
  const [text, setText] = useState(start)
  const [err, setErr] = useState('')
  const latest = useRef(start)
  const saved = useRef(start)
  const [savedText, setSavedText] = useState(start)
  const good = useRef(onGood); const rule = useRef(check)
  useEffect(() => { good.current = onGood; rule.current = check })
  const commit = () => {
    const v = latest.current.trim()
    if (v === saved.current || rule.current(v)) return
    saved.current = v
    setSavedText(v)
    good.current(v)
  }
  // Closing the card with Escape never leaves the box, so save then too.
  useEffect(() => () => commit(), [])
  return (
    <>
      <input style={input(T)} value={text} placeholder={placeholder} inputMode={inputMode} aria-invalid={!!err}
        onChange={e => { latest.current = e.target.value; setText(e.target.value); setErr(check(e.target.value.trim())) }}
        onBlur={commit} />
      {err && <div role="alert" style={{ fontSize: 11, color: T.bad, marginTop: 5 }}>{err} {kept(savedText)}</div>}
    </>
  )
}

// The hourly rate, typed as money. The box used to strip everything that was
// not a digit, so 38.50 became 3850. It reads what was typed with the same
// rule as the Payments page and says what is wrong otherwise. An empty box
// means no hourly rate is shown.
function RateField({ T }: { T: ThemeTokens }) {
  const [start] = useState(() => { const r = getSettings().privateRate; return r ? String(r) : '' })
  return (
    <Field T={T} label="Private lesson rate (£ / hour)" hint="Leave it empty to show no hourly rate.">
      <CheckedInput T={T} start={start} inputMode="decimal" placeholder="e.g. 38 or 38.50"
        check={v => { if (!v) return ''; const a = parseAmount(v, { max: 1000 }); return a.ok ? '' : a.error }}
        onGood={v => { const a = v ? parseAmount(v, { max: 1000 }) : null; setSettings({ privateRate: a && a.ok ? a.pounds : 0 }) }}
        kept={saved => saved ? `The rate is still ${formatPounds(parseFloat(saved.replace(/[£,\s]/g, '')) || 0)} an hour.` : 'No rate is saved.'} />
    </Field>
  )
}

// A real academy's venues live in Venues & courts (the database), not in this
// browser. This card used to list the demo academy's four venues instead, with
// a "home site" picker and "calendar connected" switches that changed nothing.
function HomeVenueLine({ T, accent, onManage }: { T: ThemeTokens; accent: AccentTokens; onManage: () => void }) {
  const venues = useCoachTable<{ id: string; name: string; is_home: boolean | null }>('coach_venues')
  const home = venues.rows.find(v => v.is_home)
  const line = venues.loading ? 'Checking…'
    : !venues.rows.length ? 'No venues yet. Add the place you coach and its courts.'
    : home ? `${home.name} is your home venue${venues.rows.length > 1 ? `, with ${venues.rows.length - 1} other${venues.rows.length === 2 ? '' : 's'}` : ''}.`
    : `${venues.rows.length} venue${venues.rows.length === 1 ? '' : 's'}, none set as home yet.`
  return (
    <Field T={T} label="Venues & home base" hint="Venues, their courts and which one is home are all set in Venues & courts.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${T.border}`, background: T.panel2, borderRadius: 10, padding: '11px 12px' }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: T.text2, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{line}</div>
        <button onClick={onManage} style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', background: accent.hex, color: T.btnText, flexShrink: 0 }}>Manage venues</button>
      </div>
    </Field>
  )
}

// Changing the portal's address after setup. The setup wizard says it can be
// changed later in Settings; there was nowhere to do it.
//
// The address is checked as it is typed by the same route the wizard uses, and
// the database has the last word (migration 193 refuses a reserved or malformed
// one; a unique index refuses one already taken). The old address stops working
// the moment this saves, so the coach is told exactly what that breaks first.
function PortalAddress({ T, accent, current }: { T: ThemeTokens; accent: AccentTokens; current: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current)
  // The last answer from the address checker. It is only used while it is
  // about the address now in the box (see `check` below).
  const [answer, setAnswer] = useState<{ slug: string; available: boolean; reason?: string; suggestion?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const want = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const check = answer && answer.slug === want ? answer : null
  useEffect(() => {
    if (!editing || !want || want === current) return
    let off = false
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/coach/slug-check?slug=${encodeURIComponent(want)}`)
        const j = await r.json()
        if (!off && r.ok) setAnswer(j)
      } catch { /* the database still checks on save */ }
    }, 350)
    return () => { off = true; clearTimeout(t) }
  }, [want, editing, current])
  const verdict = !want ? 'Type the address you would like: letters, numbers and hyphens.'
    : want === current ? 'This is your address now.'
    : !check ? 'Checking…'
    : check.available ? `lumiosports.com/tennis/coach/${check.slug} is free.`
    : check.reason === 'reserved' ? 'That word is used by Lumio itself. Choose a different address.'
    : check.reason === 'long' ? 'That is too long. Keep it to 60 characters.'
    : check.reason === 'short' || check.reason === 'empty' ? 'An address needs at least 2 letters or numbers.'
    : check.suggestion ? `That address is taken. ${check.suggestion} is free.`
    : 'That address is taken. Try a different one.'
  const canSave = !!check?.available && check.slug === want && !busy
  const save = async () => {
    if (!canSave) return
    if (!confirm(`Change your portal address to lumiosports.com/tennis/coach/${want}?\n\nYour old address (${current}) stops working straight away. You will need to update anything that uses it: bookmarks, the link on your website, your sign-in page link, the parent consent form link, and the Lumio app if you have added it to a phone's home screen (remove it and add it again from the new address).\n\nBooking links and camp sign-up links you have already sent keep working.`)) return
    setBusy(true); setErr('')
    try {
      await saveCoachProfile({ portal_slug: want })
      // The portal lives at the new address now; this page no longer exists.
      window.location.assign(`/tennis/coach/${want}`)
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      setErr(/duplicate|unique/i.test(m) ? 'Another academy took that address a moment ago. Choose a different one.' : (m || 'The address could not be changed. Nothing was changed. Try again.'))
      setBusy(false)
    }
  }
  return (
    <Field T={T} label="Portal address" hint={editing ? undefined : 'Where you and your coaches open the portal.'}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <code style={{ fontSize: 12.5, color: T.text, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px', overflowWrap: 'anywhere' }}>lumiosports.com/tennis/coach/{current}</code>
          <button onClick={() => { setValue(current); setEditing(true) }} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Change…</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.text3, whiteSpace: 'nowrap' }}>…/tennis/coach/</span>
            <input style={input(T)} value={value} onChange={e => { setValue(e.target.value); setErr('') }} maxLength={80} aria-label="New portal address" autoFocus />
          </div>
          <div style={{ fontSize: 11, color: check && !check.available ? T.bad : T.text3, marginTop: 5 }}>{verdict}</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 5, lineHeight: 1.5 }}>Your old address stops working as soon as you change it, so links and bookmarks that use it will need updating.</div>
          {err && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 5 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { void save() }} disabled={!canSave} style={{ appearance: 'none', border: 0, borderRadius: 9, padding: '8px 13px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: canSave ? 'pointer' : 'default', background: accent.hex, color: T.btnText, opacity: canSave ? 1 : 0.5 }}>{busy ? 'Changing…' : 'Change address'}</button>
            <button onClick={() => setEditing(false)} disabled={busy} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 9, padding: '8px 13px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </>
      )}
    </Field>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export function SettingsPanel({ T, accent, density, demo = false }: Common & { demo?: boolean }) {
  const s = useCoachSettings()
  // A link from elsewhere in the portal ("Connect", "Add it", "Settings →
  // Venues") can name the panel it wants, so the coach lands on it rather than
  // at the top of this page. Same one-shot pattern as lumio_open_player.
  const [open, setOpen] = useState<string | null>(() => {
    try { return sessionStorage.getItem('lumio_open_settings') || null } catch { /* ignore */ }
    return null
  })
  // Used once: cleared after the page has mounted (not while reading it above,
  // because a first render can be thrown away and run again).
  useEffect(() => { try { sessionStorage.removeItem('lumio_open_settings') } catch { /* ignore */ } }, [])
  // Records found by Import data but not yet imported — closing the modal asks first.
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [askImport, setAskImport] = useState(false)
  const [addVenueOpen, setAddVenueOpen] = useState(false)
  // Demo "order" state — which kit items the coach has added to their order.
  const [ordered, setOrdered] = useState<string[]>([])
  // Feature flags — Video & Audio each toggle their half of the module. Fallback
  // matches page.tsx (demo = elite/all-on, live founder = prolite).
  // Pinned on the demo, so the tier reads Elite and every feature shows ON —
  // matching the portal, which also ignores stored flags there.
  const featFallback = demo ? 'elite' : NEW_ACCOUNT_TIER
  const [feat, setFeat] = useState(() => demo ? DEMO_FLAGS : getFlags(featFallback))
  useEffect(() => {
    if (demo) { setFeat(DEMO_FLAGS); return }
    const r = () => setFeat(getFlags(featFallback)); r(); return subscribeFeatures(r)
  }, [featFallback, demo])

  // Per-area settings — persisted via the same localStorage store as the rest of
  // Settings (survives reload, applies across the portal). Each value reads from
  // the store (merged over defaults) and writes the full object back on change.
  // Seed every per-area block falls back to. The demo keeps its sample persona;
  // a real academy falls back to blanks and fills from the coach's own profile.
  const D = demo ? DEFAULT_SETTINGS : LIVE_DEFAULT_SETTINGS
  const profile = { ...D.profile, ...(s.profile || {}) }
  // Canonical head-coach record — the same record the Coaches module renders,
  // so Settings → Head coach profile and the Coaches page can never disagree.
  // (Recomputed each render; useCoachSettings re-renders on any settings change.)
  const hp = getHeadProfile()

  // Seed the Head coach profile from the SIGNED-IN coach's real profile (from
  // onboarding) the first time, so a real coach sees their own name/email/phone
  // instead of the demo persona. Only fills values still at their demo default,
  // so it never clobbers the coach's own edits — and does nothing in the demo
  // (no real profile → no display_name).
  const realProfile = useCoachProfile()
  // The academy's web address — the same slug as the portal it is looking at.
  const portalSlug = String((useParams() as { slug?: string } | null)?.slug || 'your-academy')
  const [linkCopied, setLinkCopied] = useState(false)
  const [logoErr, setLogoErr] = useState('')
  // One upload handler for both places a logo can be chosen.
  const pickLogo = async (f: File | undefined) => {
    if (!f) return
    setLogoErr('')
    try { await saveBrandLogo(await fileToLogoDataUrl(f)); realProfile.reload() } catch { setLogoErr(LOGO_NOT_IMAGE) }
  }
  useEffect(() => {
    if (realProfile.loading || !realProfile.display_name) return
    const patch: Record<string, any> = {}
    if (!s.coach || s.coach === COACH_ORG.coach) patch.coach = realProfile.display_name
    // Same for the academy name — it comes from onboarding as brand_name.
    if ((!s.academy || s.academy === COACH_ORG.academy) && realProfile.brand_name) patch.academy = realProfile.brand_name
    const needEmail = !profile.email || profile.email === DEFAULT_SETTINGS.profile.email
    const needPhone = !profile.phone || profile.phone === DEFAULT_SETTINGS.profile.phone
    if ((needEmail && realProfile.contact_email) || (needPhone && realProfile.contact_phone)) {
      patch.profile = {
        ...profile,
        email: needEmail && realProfile.contact_email ? realProfile.contact_email : profile.email,
        phone: needPhone && realProfile.contact_phone ? realProfile.contact_phone : profile.phone,
      }
    }
    if (Object.keys(patch).length) setSettings(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realProfile.loading, realProfile.display_name, realProfile.brand_name, realProfile.contact_email, realProfile.contact_phone])
  // conn.* is a leftover local preference from onboarding — the real connection
  // state lives server-side (see ConnectedAccountsLine), so nothing writes here
  // any more.
  const booking = { ...D.booking, ...(s.booking || {}) }
  const setBooking = (n: typeof booking) => setSettings({ booking: n })
  const gdpr = { ...D.gdpr, ...(s.gdpr || {}) }
  const setGdpr = (n: typeof gdpr) => setSettings({ gdpr: n })
  // Live (real) portals start with an EMPTY DSL — the demo default (a sample head
  // coach) must not leak onto a brand-new academy. The demo keeps the sample data.
  const staffCfg = { ...D.staff, ...(s.staff || {}) }
  const setStaffCfg = (n: typeof staffCfg) => setSettings({ staff: n })
  const msg = { ...D.messaging, ...(s.messaging || {}) }
  const setMsg = (n: typeof msg) => setSettings({ messaging: n })
  const rewards = { ...D.rewards, ...(s.rewards || {}) }
  const setRewards = (n: typeof rewards) => setSettings({ rewards: n })

  // Two switches on the Effort & Rewards card are the same thing as a section
  // switch that already works, so on a real academy they read and write that:
  // the leaderboard on the Effort & Rewards page, and the "Effort & rewards"
  // section of the player app. They used to save a value nothing read.
  const leaderboardOn = !(s.sectionsOff?.gpsheatmaps || []).includes('leaderboard')
  const effortToPlayers = !(s.sectionsOff?.student || []).includes('rewards')

  const [hiddenMenu, setHiddenMenu] = useState<string[]>([])
  useEffect(() => { setHiddenMenu(getHidden()); return subscribeMenu(() => setHiddenMenu(getHidden())) }, [])
  const shownCount = COACH_SIDEBAR.filter(i => !hiddenMenu.includes(i.id)).length

  const sharingList = [s.shareHomework && 'homework', s.shareNextFocus && 'next focus', s.shareCoachNote && 'coach note'].filter(Boolean).join(', ') || 'nothing'

  const GROUPS = ['You', 'Academy', 'Coaching', 'People & compliance', 'Rewards & system']
  const cards = [
    { id: 'profile',     g: 'You',        icon: 'people',    t: 'Head coach profile',  d: `${[hp.name, hp.role, hp.accreditation].filter(Boolean).join(' · ') || 'Your details, calendar and safeguarding'}` },
    { id: 'integrations',g: 'You',        icon: 'calendar',  t: 'Connected accounts',  d: 'Email & calendar sync — Google, Outlook, iCloud' },
    { id: 'academy',     g: 'Academy',    icon: 'home',      t: 'Academy profile',     d: demo ? [s.academy, s.cert].filter(Boolean).join(' · ') : (s.academy ? `${s.academy} · logo & portal address` : 'Add your academy name & logo') },
    // The old summary read "Google + Outlook sync" off two local switches that
    // connected nothing. Booking defaults are real settings, so that is what it
    // now reports; what is actually connected lives in Connected accounts.
    { id: 'booking',     g: 'Academy',    icon: 'calendar',  t: 'Booking calendar',    d: `${booking.defaultDuration}m default · ${booking.buffer}m buffer${demo ? ` · ${booking.autoConfirm ? 'auto-confirm' : 'you approve each one'}` : ''}` },
    { id: 'availability',g: 'Academy',    icon: 'grid',      t: 'Availability & courts', d: `${s.bookableHours} · ${demo ? s.lessonTypes.length : (s.lessonTypes.filter(t => BOOKABLE_TYPES.includes(t)).length || BOOKABLE_TYPES.length)} lesson types` },
    { id: 'partnerlogin',g: 'Academy',    icon: 'shield',    t: 'Partner sign-in page', d: s.partnerLogin ? `On · lumiosports.com/login/${portalSlug}` : 'Off · families use the standard Lumio sign-in' },
    { id: 'pricing',     g: 'Academy',    icon: 'pound',     t: 'Pricing & packages',  d: s.privateRate ? `Private ${formatPounds(s.privateRate)}/hr · take payments` : 'Set your hourly rate · take payments' },
    { id: 'belts',       g: 'Coaching',   icon: 'trophy',    t: 'Racket criteria',     d: demo ? `Award racket at: ${s.awardThreshold === 4 ? 'Mastered' : 'Consistent'} or better` : `A skill shows as done to players at ${s.awardThreshold === 4 ? 'four bars (Consistent)' : 'three bars (Consolidating)'}` },
    { id: 'rewards',     g: 'Coaching',   icon: 'flag',      t: 'Effort & Rewards',    d: demo ? `Leaderboard ${rewards.leaderboard ? 'on' : 'off'} · watch consent default ${rewards.watchConsentDefault ? 'on' : 'off'}` : `Leaderboard ${leaderboardOn ? 'on' : 'off'} · ${effortToPlayers ? 'shown to players' : 'hidden from players'}` },
    { id: 'sharing',     g: 'Coaching',   icon: 'megaphone', t: 'Sharing a summary',      d: `Shares include: ${sharingList}` },
    { id: 'gdpr',        g: 'People & compliance', icon: 'shield', t: 'Players & data (GDPR)', d: `Retention ${gdpr.retentionYears}y · DPA ${gdpr.dpaAccepted ? 'accepted' : 'pending'}` },
    { id: 'staff',       g: 'People & compliance', icon: 'people', t: 'Staff & safeguarding',  d: `DSL ${staffCfg.dsl || 'not set'} · DBS reminders ${staffCfg.reminderDays}d` },
    { id: 'messaging',   g: 'People & compliance', icon: 'note',   t: 'Messaging',             d: `${[msg.email && 'Email', demo && msg.text && 'Text', msg.inapp && 'In-app'].filter(Boolean).join(' · ') || 'No channels'}` },
    { id: 'kit',         g: 'Rewards & system', icon: 'wrench',   t: 'Lumio Coach Kit & rewards', d: demo ? 'Your plan: Coach £39/mo · order kit & rewards' : (s.ownRewards ? 'You supply your own rewards' : 'Lumio keyrings & dampeners · not on sale yet') },
    { id: 'appearance',  g: 'Rewards & system', icon: 'settings', t: 'Appearance',          d: `${s.theme === 'white' ? 'White' : s.theme === 'light' ? 'Light' : 'Dark'} · ${ACCENT_PRESETS[s.accentKey]?.label ?? ''} · ${s.density}` },
    { id: 'menu',        g: 'Rewards & system', icon: 'eye',      t: 'Menu visibility',     d: `${shownCount} of ${COACH_SIDEBAR.length} menu items shown` },
    { id: 'help',        g: 'Rewards & system', icon: 'note',     t: 'Help & guidance',     d: `${[s.helpHints !== false && 'Page guides', s.gettingStarted !== false && 'Getting started'].filter(Boolean).join(' · ') || 'Both off'}` },
    { id: 'studentapp',  g: 'Rewards & system', icon: 'people',   t: 'Parent & player app', d: s.studentApp ? 'On · families can be invited; Player view in your profile menu' : 'Off · players and parents cannot open their page' },
    { id: 'contact',     g: 'You',        icon: 'note',     t: 'Contact & calendar',  d: 'Your contact email & phone · what is connected' },
    { id: 'venuescfg',   g: 'Academy',    icon: 'home',     t: 'Venues & courts',     d: 'Venues, courts & calendar links' },
    { id: 'devcfg',      g: 'Coaching',   icon: 'trophy',   t: 'Coaching, rewards & modules', d: 'Racket criteria, effort & module setup' },
    { id: 'privacy',     g: 'People & compliance', icon: 'shield', t: 'Privacy & compliance', d: 'GDPR, consents & data retention' },
    { id: 'import',      g: 'Rewards & system', icon: 'note',  t: 'Import data',          d: 'Bulk import from a spreadsheet or photo' },
  // "Players & data (GDPR)" is a demo-only card. On a real academy every
  // control on it either did nothing (default consents, retention period, the
  // export button) or disagreed with Privacy & compliance about whether the
  // data agreement was accepted. Privacy & compliance is the one place for it.
  //
  // "Sharing a summary" is the demo's too. On a real academy the three switches
  // saved and changed nothing: a shared lesson summary always carries the
  // homework and the next focus, and never the private coach note.
  ].filter(c => demo || (c.id !== 'gdpr' && c.id !== 'sharing'))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Tap any card to customise it — changes apply across the portal instantly.</p>
        </div>
        {/* Asks first, and only ever touches how the portal looks — see
            resetSettings. It used to wipe every setting on one click. */}
        {!demo && <button onClick={() => {
          if (!confirm('Reset how your portal looks?\n\nThis puts back the theme, accent colour, density, help hints, hidden menu items and hidden page sections as they were when you started.\n\nNothing else changes. Your academy and head coach details, DBS and safeguarding records, prices, booking and messaging settings and the player app all stay as they are.')) return
          resetSettings()
          for (const id of getHidden()) setMenuHidden(id, false)
        }} style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 9, padding: '7px 12px', fontSize: 11.5, cursor: 'pointer' }}>Reset appearance</button>}
      </div>

      {GROUPS.map(group => {
        const gc = cards.filter(c => c.g === group)
        if (!gc.length) return null
        return (
          <div key={group} style={{ marginBottom: density.gap + 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{group}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: density.gap }}>
              {gc.map(c => (
                <div key={c.id} onClick={() => setOpen(c.id)}
                  style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name={c.icon} size={16} stroke={1.7} style={{ color: accent.hex }} /></div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, flex: 1 }}>{c.t}</div>
                    <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>Edit →</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Per-module settings — every menu item gets a settings home. General
          controls now (show in sidebar); deeper per-module config (section
          toggles, colour, setup) rolls out into these modals next. */}
      <div style={{ marginBottom: density.gap + 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: density.gap }}>
          {COACH_SIDEBAR.filter(i => i.id !== 'settings').map(item => {
            const hidden = hiddenMenu.includes(item.id)
            return (
              <div key={item.id} onClick={() => setOpen(`module:${item.id}`)}
                style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name={item.icon} size={16} stroke={1.7} style={{ color: accent.hex }} /></div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, flex: 1 }}>{item.label}</div>
                  <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>Edit →</span>
                </div>
                <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{hidden ? 'Hidden from the sidebar' : 'Shown in the sidebar'}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Editors ── */}
      {open?.startsWith('module:') && (() => {
        const mid = open.slice('module:'.length)
        const item = COACH_SIDEBAR.find(i => i.id === mid)
        if (!item) return null
        const locked = ALWAYS_VISIBLE.includes(mid)
        const hidden = hiddenMenu.includes(mid)
        const sections = MODULE_SECTIONS[mid] || []
        const off = s.sectionsOff?.[mid] || []
        return (
          <Modal readOnly={demo} T={T} accent={accent} title={item.label} sub="Module settings" onClose={() => setOpen(null)}>
            <Toggle T={T} accent={accent} on={!hidden} onChange={v => { if (!locked) setMenuHidden(mid, !v) }} label="Show in the sidebar" desc={locked ? 'Always visible — can’t be hidden.' : 'Hide this module from the coach menu.'} />
            {sections.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 8px' }}>Sections</div>
                {sections.map(sec => (
                  <Toggle key={sec.key} T={T} accent={accent} on={!off.includes(sec.key)} onChange={v => setSectionOff(mid, sec.key, !v)} label={sec.label} desc={off.includes(sec.key) ? 'Hidden on this page' : 'Shown'} />
                ))}
              </>
            )}
            {mid === 'resources' && <ResourceCentreSettings T={T} accent={accent} />}
            {mid === 'equipment' && <EquipmentKitSettings T={T} accent={accent} />}
            {mid === 'payments' && <PaymentsPackagesSettings T={T} accent={accent} />}
            {mid === 'calendar' && <BookingEmailsSettings T={T} accent={accent} />}
            {sections.length === 0 && mid !== 'resources' && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 10, lineHeight: 1.5 }}>More options for {item.label} — section toggles, colour and setup — are coming to this panel.</div>}
          </Modal>
        )
      })()}
      {open === 'contact' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Contact & calendar" onClose={() => setOpen(null)}><CoachContactSettings T={T} accent={accent} />
        {/* What is really connected, read from the account — in place of a
            picker that showed "Bookings → calendar" with nothing connected. */}
        <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 10px' }}>Email &amp; calendar sync</div>
        <ConnectedAccountsLine T={T} accent={accent} demo={demo} onOpen={() => setOpen('integrations')} /></Modal>)}
      {(open === 'venuescfg' || open === 'venuescfg:new') && (<Modal wide readOnly={demo} T={T} accent={accent} title="Venues & courts" onClose={() => setOpen(null)}><CoachVenuesSettings T={T} accent={accent} addNew={open === 'venuescfg:new'} /></Modal>)}
      {open === 'devcfg' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Coaching, rewards & modules" onClose={() => setOpen(null)}><CoachDevelopmentSettings T={T} accent={accent} /></Modal>)}
      {open === 'privacy' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Privacy & compliance" onClose={() => setOpen(null)}><CoachCompliance T={T} accent={accent} demo={demo} /></Modal>)}
      {open === 'import' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Import data" onClose={() => { if (pendingImport) setAskImport(true); else setOpen(null) }}><CoachImport T={T} accent={accent} onPendingChange={setPendingImport} />{!demo && <ImportStartAgain T={T} />}</Modal>)}
      {open === 'import' && askImport && pendingImport && (
        <ImportPendingDialog pending={pendingImport}
          onDone={() => { setAskImport(false); setPendingImport(null); setOpen(null) }}
          onCancel={() => setAskImport(false)} />
      )}
      {open === 'integrations' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Connected accounts" sub="Connect your mailbox & calendar to add bookings to your calendar and send as you" onClose={() => setOpen(null)}>
          <IntegrationsPanel T={T} accent={accent} />
        </Modal>
      )}
      {open === 'partnerlogin' && (() => {
        const url = `https://lumiosports.com/login/${portalSlug}`
        const hasLogo = !!(s.brandLogo || realProfile.brand_logo_url)
        return (
        <Modal readOnly={demo} T={T} accent={accent} title="Partner sign-in page" sub="Your academy's own sign-in page — your logo, name and colours, running on Lumio Tennis Coach" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={!!s.partnerLogin && hasLogo} onChange={v => { if (v && !hasLogo) return; setSettings({ partnerLogin: v }) }}
            label="Use my own sign-in page"
            desc={hasLogo
              ? 'On: players, parents and your coaches sign in on your page, and welcome emails link there. Off: everyone uses the standard Lumio sign-in.'
              : 'Add your logo below first — it is what makes the page yours.'} />
          <Field T={T} label="Your logo" hint="The same logo as your Academy profile.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {hasLogo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={s.brandLogo || realProfile.brand_logo_url || ''} alt="Club logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: T.panel2, border: `1px solid ${T.border}` }} />
                : <div style={{ width: 44, height: 44, borderRadius: 8, background: T.panel2, border: `1px dashed ${T.border}`, display: 'grid', placeItems: 'center', fontSize: 10, color: T.text3 }}>none</div>}
              <label style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ⬆ {hasLogo ? 'Change logo' : 'Upload logo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; void pickLogo(f) }} />
              </label>
            </div>
            {logoErr && <div role="alert" style={{ fontSize: 11.5, color: T.bad, marginTop: 6 }}>{logoErr}</div>}
          </Field>
          {s.partnerLogin && (
            <Field T={T} label="Your sign-in link" hint="Put it behind the “Log in” button on your website. Signing in at lumiosports.com works too — it's the same account.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <code style={{ fontSize: 12.5, color: accent.hex, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px' }}>{url.replace('https://', '')}</code>
                <button onClick={() => { try { navigator.clipboard.writeText(url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800) } catch { /* ignore */ } }}
                  style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{linkCopied ? '✓ Copied' : 'Copy link'}</button>
                <a href={`/login/${portalSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: accent.hex, textDecoration: 'none' }}>Open ↗</a>
              </div>
            </Field>
          )}
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>
            The page uses your theme and accent colour from Appearance ({s.theme === 'white' ? 'White' : s.theme === 'light' ? 'Light' : 'Dark'} · {ACCENT_PRESETS[s.accentKey]?.label ?? ''}).
          </p>
        </Modal>
        )
      })()}
      {open === 'academy' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Academy profile" sub="Shown across the portal — sidebar, dashboard, packs and certificates" onClose={() => setOpen(null)}>
          {/* The academy name lives in two places — these settings, and the
              account's profile row that emails, certificates, the player app
              and the sidebar all read. Editing only the first is how "PG
              Tennis" could be typed here while every other screen still said
              "Penrith Tennis Club". Both are written, on blur, every time. */}
          <Field T={T} label="Academy name"><input style={input(T)} placeholder="Your academy name" value={s.academy}
            onChange={e => setSettings({ academy: e.target.value })}
            onBlur={e => { const v = e.target.value.trim(); if (!demo && v && v !== realProfile.brand_name) saveCoachProfile({ brand_name: v }).then(() => realProfile.reload()).catch(() => {}) }} /></Field>
          <Field T={T} label="Head coach name"><input style={input(T)} placeholder="Your name" value={s.coach}
            onChange={e => setSettings({ coach: e.target.value })}
            onBlur={e => { const v = e.target.value.trim(); if (demo) return; if (v !== e.target.value || !v) setSettings({ coach: v || realProfile.display_name || '' }); if (v && v !== realProfile.display_name) saveCoachProfile({ display_name: v }).then(() => realProfile.reload()).catch(() => {}) }} /></Field>
          {/* This box and Head coach profile → Accreditation were one stored
              value under two labels, so each overwrote the other. It is the
              coach's accreditation everywhere it is shown, so a real academy
              edits it in one place: Head coach profile. */}
          {demo && <Field T={T} label="Certification / tagline"><input style={input(T)} placeholder="e.g. LTA Accredited Coach" value={s.cert} onChange={e => setSettings({ cert: e.target.value })} /></Field>}
          <Field T={T} label="Club logo" hint="Top-left of your portal, and on packs, certificates and the player app.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {(s.brandLogo || realProfile.brand_logo_url)
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={s.brandLogo || realProfile.brand_logo_url || ''} alt="Club logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: T.panel2, border: `1px solid ${T.border}` }} />
                : <div style={{ width: 44, height: 44, borderRadius: 8, background: T.panel2, border: `1px dashed ${T.border}`, display: 'grid', placeItems: 'center', fontSize: 10, color: T.text3 }}>none</div>}
              <label style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ⬆ Upload logo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; void pickLogo(f) }} />
              </label>
              {(s.brandLogo || realProfile.brand_logo_url) && <button onClick={() => { setLogoErr(''); void saveBrandLogo(null).then(() => realProfile.reload()) }} style={{ appearance: 'none', background: 'transparent', border: 0, color: T.bad, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Remove</button>}
            </div>
            {logoErr && <div role="alert" style={{ fontSize: 11.5, color: T.bad, marginTop: 6 }}>{logoErr}</div>}
          </Field>
          {!demo && <PortalAddress T={T} accent={accent} current={portalSlug} />}
        </Modal>
      )}

      {open === 'belts' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Racket criteria" sub={demo ? 'When does a racket count as earned?' : 'When does a skill count as done?'} onClose={() => setOpen(null)}>
          {/* A real academy grades on four bars, the fourth being Consistent,
              and its Racket Progression page always awards a racket at four
              bars on every skill. What this choice changes is the player's own
              page and camp targets — so it is named in the academy's own
              words and says so. (The demo keeps its sample scale.) */}
          {demo ? (
            <Field T={T} label="Award a racket when every skill reaches" hint="Affects racket progress % everywhere — try it, then open Player Development.">
              <Seg T={T} accent={accent} value={s.awardThreshold}
                options={[{ v: 3, label: 'Consistent' }, { v: 4, label: 'Mastered' }]}
                onChange={v => setSettings({ awardThreshold: v as 3 | 4 })} />
            </Field>
          ) : (
            <Field T={T} label="Show a skill as done to players at" hint="Used on a player’s own page and for camp targets. On your Racket Progression page a racket is always earned at four bars (Consistent) on every skill.">
              <Seg T={T} accent={accent} value={s.awardThreshold}
                options={[{ v: 3, label: 'Three bars (Consolidating)' }, { v: 4, label: 'Four bars (Consistent)' }]}
                onChange={v => setSettings({ awardThreshold: v as 3 | 4 })} />
            </Field>
          )}
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>The skills under each racket are Lumio’s standard set, the same for every academy. See them in Coaching, rewards &amp; modules.</div>
        </Modal>
      )}

      {open === 'availability' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Availability & courts" onClose={() => setOpen(null)}>
          <Field T={T} label="Bookable hours" hint={demo ? undefined : 'The start times families are offered when they book through one of your booking links. Your own calendar is not limited by them.'}>
            {demo
              ? <input style={input(T)} value={s.bookableHours} onChange={e => setSettings({ bookableHours: e.target.value })} />
              : <CheckedInput T={T} start={s.bookableHours} placeholder="e.g. 08:00 – 20:00" kept={() => 'The hours have not been changed.'}
                  check={v => !v ? 'Enter the hours you can be booked, for example 08:00 – 20:00.' : readHours(v) ? '' : 'Those hours could not be read. Type a start time and a later end time, for example 08:00 – 20:00.'}
                  onGood={v => setSettings({ bookableHours: v })} />}
          </Field>
          <Field T={T} label="Lesson types offered" hint={demo ? 'Tap to toggle.' : 'The types you can choose when you add a booking. Tap to toggle; at least one stays on.'}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(demo ? ['Private', 'Group', 'Cardio', 'Match play', 'Cardio Tennis', 'Squad', 'Camp'] : BOOKABLE_TYPES).map(lt => {
                const on = s.lessonTypes.includes(lt)
                // The last lesson type cannot be switched off: with none ticked
                // the booking form would have nothing to offer.
                const last = !demo && on && s.lessonTypes.filter(x => BOOKABLE_TYPES.includes(x)).length <= 1
                return <button key={lt} disabled={last} onClick={() => setSettings({ lessonTypes: on ? s.lessonTypes.filter(x => x !== lt) : [...s.lessonTypes, lt] })}
                  style={{ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 8, padding: '5px 11px', fontSize: 11.5, cursor: 'pointer', fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{lt}</button>
              })}
            </div>
          </Field>
          {/* The demo keeps its sample venues. A real academy is shown its own,
              from Venues & courts. */}
          {!demo && <HomeVenueLine T={T} accent={accent} onManage={() => setOpen('venuescfg')} />}
          {demo && (() => {
            const venues = [...VENUES, ...getAddedVenues()]
            const homeId = s.primaryVenueId || (venues.find(v => v.primary)?.id ?? venues[0]?.id ?? '')
            return (
              <>
                <Field T={T} label="Home / main site" hint="Shown as your home base in the Court Planner.">
                  <select style={input(T)} value={homeId} onChange={e => setSettings({ primaryVenueId: e.target.value })}>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field T={T} label="Calendar sync per site" hint="Connected sites show live court availability.">
                  {venues.map(v => {
                    const on = (s.syncedVenues || []).includes(v.id)
                    return <Toggle key={v.id} T={T} accent={accent} on={on} label={v.name} desc={on ? 'Calendar connected' : 'Not connected'}
                      onChange={() => setSettings({ syncedVenues: on ? (s.syncedVenues || []).filter(x => x !== v.id) : [...new Set([...(s.syncedVenues || []), v.id])] })} />
                  })}
                </Field>
                <button onClick={() => { setOpen(null); setAddVenueOpen(true) }} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, marginTop: 4 }}>+ Add venue</button>
              </>
            )
          })()}
        </Modal>
      )}

      {addVenueOpen && <AddVenueModal T={T} accent={accent} onClose={() => setAddVenueOpen(false)} />}

      {open === 'pricing' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Pricing & packages" sub="Reflected on the Payments page" onClose={() => setOpen(null)}>
          <RateField T={T} />
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>Packages and renewal rules are managed on the Payments page; this rate feeds new quotes and the Payments header.</div>
          <TakePayments T={T} accent={accent} />
        </Modal>
      )}

      {open === 'kit' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Lumio Coach Kit & rewards" sub={demo ? 'Order your capture kit and Racket Progression rewards' : 'Whose rewards your players earn'} onClose={() => setOpen(null)}>
          {/* Not every academy wants Lumio's merchandise, and the ladder works
              perfectly well without it. Switching this on changes what the
              Racket Progression screen says a reward IS — nothing else. */}
          <Toggle T={T} accent={accent} on={!!s.ownRewards} onChange={v => setSettings({ ownRewards: v })}
            label="I supply my own rewards"
            desc={s.ownRewards
              ? 'Racket Progression talks about your reward, not Lumio keyrings. Certificates still print from here.'
              : 'On: use your own badges, wristbands or club trophies instead of the Lumio keyring and dampener sets.'} />
          <div style={{ height: 14 }} />
          {/* Read-only plan line. Demo only: it is a sample, and on a real
              academy it contradicted Plan & features. */}
          {demo && <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <Icon name="shield" size={15} stroke={1.7} style={{ color: accent.hex }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Your Lumio plan</div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Coach · £39 / month</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, background: T.hover, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo</span>
          </div>}
          {/* The kit cannot be bought yet. A real academy is shown what it will
              be, with no order buttons and no basket that goes nowhere. */}
          {!demo && <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5, margin: '0 0 10px' }}><strong style={{ color: T.text }}>Not on sale yet.</strong> The Lumio kit is still being tested, so it cannot be ordered here. To be told when it is ready, email <a href="mailto:hello@lumiosports.com?subject=Lumio%20Coach%20Kit" style={{ color: accent.hex, fontWeight: 600 }}>hello@lumiosports.com</a>.</div>}

          {/* Orderable kit / rackets */}
          {KIT_OFFERS.map(item => {
            const on = ordered.includes(item.id)
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : T.panel2, borderRadius: 10, padding: '11px 12px', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{item.name}</span>
                    <span style={{ fontSize: 12, color: accent.hex, fontWeight: 700 }}>{item.price}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                </div>
                {demo && <button onClick={() => setOrdered(prev => on ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                  style={{ appearance: 'none', flexShrink: 0, border: on ? `1px solid ${accent.border}` : 0, borderRadius: 8, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', background: on ? 'transparent' : accent.hex, color: on ? accent.hex : T.btnText, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {on ? <><Icon name="check" size={12} stroke={2.2} /> Added to order</> : item.cta}
                </button>}
              </div>
            )
          })}

          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>
            Racket certificates are included — print them per player from <strong style={{ color: T.text2 }}>Player Development</strong>. Kit &amp; mic pricing is indicative while the hardware is field-tested.
          </div>
          {demo && <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: T.panel2, border: `1px dashed ${T.border}`, borderRadius: 9, padding: '9px 12px' }}>
            <span style={{ fontSize: 15 }}>🛒</span>
            <span style={{ fontSize: 11.5, color: T.text2 }}>{ordered.length ? `${ordered.length} item${ordered.length > 1 ? 's' : ''} in your order` : 'Your order is empty'} · <span style={{ color: T.text3 }}>demo only — no real checkout or fulfilment yet</span></span>
          </div>}
        </Modal>
      )}

      {open === 'sharing' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Sharing a summary" sub="What's included when you share or export a lesson summary" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={s.shareHomework} onChange={v => setSettings({ shareHomework: v })} label="Include homework" desc="The practice set for the week" />
          <Toggle T={T} accent={accent} on={s.shareNextFocus} onChange={v => setSettings({ shareNextFocus: v })} label="Include next session focus" desc="What you'll work on next" />
          <Toggle T={T} accent={accent} on={s.shareCoachNote} onChange={v => setSettings({ shareCoachNote: v })} label="Include private coach note" desc="Off by default — usually for your eyes only" />
        </Modal>
      )}

      {open === 'appearance' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Appearance" sub="Watch the whole portal change as you tweak these" onClose={() => setOpen(null)}>
          <Field T={T} label="Theme">
            <Seg T={T} accent={accent} value={s.theme} options={[{ v: 'dark', label: 'Dark' }, { v: 'light', label: 'Light' }, { v: 'white', label: 'White' }]} onChange={v => setSettings({ theme: v as 'dark' | 'light' | 'white' })} />
          </Field>
          <Field T={T} label="Accent colour">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(ACCENT_PRESETS) as AccentKey[]).map(k => {
                const p = ACCENT_PRESETS[k]; const on = s.accentKey === k
                return <button key={k} onClick={() => setSettings({ accentKey: k })} title={p.label} aria-label={p.label} aria-pressed={on}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: p.hex, border: on ? `3px solid ${T.text}` : `2px solid ${T.border}`, cursor: 'pointer', appearance: 'none', boxShadow: on ? `0 0 0 2px ${p.hex}55` : 'none' }} />
              })}
            </div>
            {/* The names only show on hover otherwise — say which one is picked. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, color: T.text3 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT_PRESETS[s.accentKey]?.hex ?? accent }} />
              Selected: <strong style={{ color: T.text, fontWeight: 600 }}>{ACCENT_PRESETS[s.accentKey]?.label ?? 'Custom'}</strong>
            </div>
          </Field>
          <Field T={T} label="Density">
            <Seg T={T} accent={accent} value={s.density} options={[{ v: 'compact', label: 'Compact' }, { v: 'regular', label: 'Regular' }, { v: 'spacious', label: 'Spacious' }]} onChange={v => setSettings({ density: v as 'compact' | 'regular' | 'spacious' })} />
          </Field>
        </Modal>
      )}

      {open === 'menu' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Menu visibility" sub="Hide nav items you don't use — they leave the sidebar instantly. Dashboard, Coaches and Settings always stay." onClose={() => setOpen(null)}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Video &amp; Audio</div>
            <Toggle T={T} accent={accent} on={feat.video} onChange={v => setFlag('video', v)} label="Video" desc="Court clips and AI highlights. Turn off to hide the Video tab — the menu becomes “Audio”." />
            <Toggle T={T} accent={accent} on={feat.audio} onChange={v => setFlag('audio', v)} label="Audio" desc="Session audio recordings. Turn off to hide the Audio tab — the menu becomes “Video”." />
          </div>
          {COACH_GROUPS.map(group => {
            const items = COACH_SIDEBAR.filter(i => i.group === group)
            if (!items.length) return null
            return (
              <div key={group} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{group}</div>
                {items.map(item => {
                  const locked = ALWAYS_VISIBLE.includes(item.id)
                  if (locked) return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, opacity: 0.65 }}>
                      <Icon name={item.icon} size={15} stroke={1.7} style={{ color: T.text3 }} />
                      <div style={{ flex: 1, fontSize: 12.5, color: T.text, fontWeight: 600 }}>{item.label}</div>
                      <span style={{ fontSize: 9.5, color: T.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Always on</span>
                    </div>
                  )
                  return <Toggle key={item.id} T={T} accent={accent} on={!hiddenMenu.includes(item.id)} onChange={v => setMenuHidden(item.id, !v)} label={item.label} />
                })}
              </div>
            )
          })}
        </Modal>
      )}

      {/* Parent & player app — deliberately NOT readOnly in the demo. Every
          other card is locked there because it would edit a sample academy's
          data; this one only decides whether the Player view is offered in the
          profile menu, and locking it would make that view unreachable in the
          demo now it's off by default. */}
      {open === 'studentapp' && (
        <Modal T={T} accent={accent} title="Parent & player app" sub="The player & parent view of your academy" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={!!s.studentApp} onChange={v => setSettings({ studentApp: v })}
            label="Player app" desc="On: you can invite players and parents to their own page, and your profile menu gains a Player view so you can see it as they do. Off: nobody can be invited, and families who already have a login cannot open their page until you switch it back on." />
          {!!s.studentApp && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '18px 0 4px' }}>Sections</div>
              <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, margin: '0 0 10px' }}>
                What a player or parent sees on their page. A section with nothing in it stays hidden whether or not it is switched on here — so turning one on does not put an empty panel in front of a family.
              </div>
              {/* A section whose module the academy does not have is not a choice
                  to offer — a coach on Essential switching "Racket progression"
                  on and seeing nothing happen is a toggle that lies. */}
              {STUDENT_TOGGLEABLE.filter(sec => !sec.module || feat[sec.module] !== false).map(sec => {
                const hidden = (s.sectionsOff?.student || []).includes(sec.key)
                return (
                  <Toggle key={sec.key} T={T} accent={accent} on={!hidden}
                    onChange={v => setSectionOff('student', sec.key, !v)}
                    label={sec.label} desc={sec.blurb} />
                )
              })}
            </>
          )}
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5, marginTop: 14 }}>
            The parent &amp; player app is a <strong style={{ color: T.text2 }}>Pro / Academy</strong>{' '}feature. It&rsquo;s yours to switch on or off here for now — no billing attached yet.
          </div>
        </Modal>
      )}

      {open === 'profile' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Head coach profile" sub="Your details, calendar sync and safeguarding record" onClose={() => setOpen(null)}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 10px' }}>Contact details</div>
          <Field T={T} label="Name">
            <input style={input(T)} value={hp.name} onChange={e => setHeadProfile({ name: e.target.value })}
              onBlur={e => { const v = e.target.value.trim(); if (v !== e.target.value || !v) setHeadProfile({ name: v || realProfile.display_name || '' }); if (v && v !== realProfile.display_name) saveCoachProfile({ display_name: v }).then(() => realProfile.reload()).catch(() => {}) }} />
          </Field>
          {/* The demo's only: on a real academy the head coach's role is "Head
              Coach" on every screen that shows one (the Coaches page holds it
              read-only), so a box here changed nothing anyone could see. */}
          {demo && <Field T={T} label="Role"><input style={input(T)} value={hp.role} onChange={e => setHeadProfile({ role: e.target.value })} /></Field>}
          <Field T={T} label="Accreditation" hint="Shown on your profile card and to your players.">
            <select style={{ ...input(T), cursor: 'pointer' }} value={hp.accreditation} onChange={e => setHeadProfile({ accreditation: e.target.value })}>
              {Array.from(new Set([hp.accreditation, ...ACCREDITATIONS].filter(Boolean))).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          {/* Checked by the same rule as Contact & calendar: these are copied
              to the head coach's record on the Coaches page. */}
          <Field T={T} label="Email">
            {demo
              ? <input style={input(T)} value={hp.email} onChange={e => setHeadProfile({ email: e.target.value })} />
              : <CheckedInput T={T} start={hp.email || ''} kept={() => 'The saved address has not been changed.'}
                  check={v => v && (v.length > 254 || !EMAIL_OK.test(v)) ? 'That email address does not look right. Check it, or leave it empty.' : ''}
                  onGood={v => setHeadProfile({ email: v })} />}
          </Field>
          <Field T={T} label="Phone">
            {demo
              ? <input style={input(T)} value={hp.phone} onChange={e => setHeadProfile({ phone: e.target.value })} />
              : <CheckedInput T={T} start={hp.phone || ''} kept={() => 'The saved number has not been changed.'}
                  check={v => v && !phoneOk(v) ? 'That phone number does not look right. Use digits, with + for a country code, for example +44 7700 900123.' : ''}
                  onGood={v => setHeadProfile({ phone: v })} />}
          </Field>

          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Email &amp; calendar sync</div>
          <ConnectedAccountsLine T={T} accent={accent} demo={demo} onOpen={() => setOpen('integrations')} />

          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>DBS &amp; safeguarding documents</div>
          <Field T={T} label="DBS certificate number"><input style={input(T)} value={hp.dbsNumber} onChange={e => setHeadProfile({ dbsNumber: e.target.value })} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field T={T} label="DBS expiry"><input type="date" style={input(T)} value={hp.dbsExpiry} onChange={e => setHeadProfile({ dbsExpiry: e.target.value })} /></Field>
            <Field T={T} label="Safeguarding training"><input type="date" style={input(T)} value={hp.safeguardingDate} onChange={e => setHeadProfile({ safeguardingDate: e.target.value, safeguardingTrained: !!e.target.value })} /></Field>
          </div>
          {/* The sample upload is the demo's. Lumio does not store certificate
              files, so a real academy is not shown a button that opens nothing
              or told that a file it never chose has been uploaded. */}
          {demo && <button style={{ width: '100%', appearance: 'none', border: `1px dashed ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '10px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⬆ Upload DBS certificate (PDF)</button>}
          {demo && <div style={{ fontSize: 11, color: T.good, marginTop: 6 }}>✓ riverside-dbs-2024.pdf · uploaded · demo only</div>}
          {!demo && <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5 }}>These details are your record on the Coaches page too. Lumio keeps the number and dates, not the certificate itself.</div>}
        </Modal>
      )}

      {open === 'booking' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Booking calendar" sub="Calendar sync and booking defaults" onClose={() => setOpen(null)}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 10px' }}>External calendar sync</div>
          <ConnectedAccountsLine T={T} accent={accent} demo={demo} onOpen={() => setOpen('integrations')} />
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Booking defaults</div>
          <Field T={T} label="Default lesson length">
            <Seg T={T} accent={accent} value={booking.defaultDuration} options={[{ v: 30, label: '30 min' }, { v: 45, label: '45 min' }, { v: 60, label: '60 min' }]} onChange={v => setBooking({ ...booking, defaultDuration: v })} />
          </Field>
          <Field T={T} label="Buffer between bookings (min)"><input style={input(T)} inputMode="numeric" value={String(booking.buffer)} onChange={e => setBooking({ ...booking, buffer: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
          {/* Holding a booking for approval is not built: a booking made through
              a booking link is confirmed there and then. So a real academy is
              told that, not offered a switch that changed nothing. */}
          {demo
            ? <Toggle T={T} accent={accent} on={booking.autoConfirm} onChange={v => setBooking({ ...booking, autoConfirm: v })} label="Auto-confirm bookings" desc="Off = you approve each request before it's booked." />
            : <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>The default length is what the Add booking form starts on. The buffer is the gap kept between lessons when a family books through a booking link. Bookings made through a link are confirmed straight away; to hold one, open it in the calendar and set it to Pending.</div>}
        </Modal>
      )}

      {open === 'rewards' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Effort & Rewards" sub="The smartwatch reward system — separate from Racket Progression" onClose={() => setOpen(null)}>
          {demo ? (
            <>
              <Toggle T={T} accent={accent} on={rewards.leaderboard} onChange={v => setRewards({ ...rewards, leaderboard: v })} label="Show squad leaderboard" desc="Rank players by XP across the academy." />
              <Toggle T={T} accent={accent} on={rewards.levelsVisible} onChange={v => setRewards({ ...rewards, levelsVisible: v })} label="Show effort levels to players" desc="Rookie → Elite progression in the player view." />
              <Toggle T={T} accent={accent} on={rewards.watchConsentDefault} onChange={v => setRewards({ ...rewards, watchConsentDefault: v })} label="Default new players to wearable consent" desc="Off is safer — capture effort only with explicit parent consent." />
            </>
          ) : (
            <>
              {/* Each of these is an existing, working switch under another
                  name (see leaderboardOn above). Wearable consent has no
                  default: it is recorded for each player, by their parent. */}
              <Toggle T={T} accent={accent} on={leaderboardOn} onChange={v => setSectionOff('gpsheatmaps', 'leaderboard', !v)} label="Show squad leaderboard" desc="The XP ranking on your Effort & Rewards page." />
              <Toggle T={T} accent={accent} on={effortToPlayers} onChange={v => setSectionOff('student', 'rewards', !v)} label="Show effort & rewards to players" desc="XP, effort level and session scores on a player’s own page. The same switch as Parent & player app → Effort & rewards." />
              <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, margin: '2px 0 8px' }}>Wearable consent is recorded for each player on the Player Roster (Edit → Consent). Effort is only captured for players who have it.</div>
            </>
          )}
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>Effort &amp; Rewards uses the player&apos;s own smartwatch and never advances a racket — <strong style={{ color: T.text2 }}>Racket Progression stays coach-assessed</strong> against the LTA Youth pathway.</div>
        </Modal>
      )}

      {open === 'gdpr' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Players & data (GDPR)" sub="Default consent, retention and data rights" onClose={() => setOpen(null)}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 10px' }}>Default consent for new players</div>
          <Toggle T={T} accent={accent} on={gdpr.data} onChange={v => setGdpr({ ...gdpr, data: v })} label="Data processing" desc="Coach the player and manage their record." />
          <Toggle T={T} accent={accent} on={gdpr.photo} onChange={v => setGdpr({ ...gdpr, photo: v })} label="Photo & video" desc="Capture footage for coaching." />
          <Toggle T={T} accent={accent} on={gdpr.medical} onChange={v => setGdpr({ ...gdpr, medical: v })} label="Medical & emergency" />
          <Toggle T={T} accent={accent} on={gdpr.wearable} onChange={v => setGdpr({ ...gdpr, wearable: v })} label="Wearable / heart-rate" desc="Smartwatch effort data for the reward system." />
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Retention &amp; rights</div>
          <Field T={T} label="Keep player records for">
            <Seg T={T} accent={accent} value={gdpr.retentionYears} options={[{ v: 1, label: '1 year' }, { v: 3, label: '3 years' }, { v: 7, label: '7 years' }]} onChange={v => setGdpr({ ...gdpr, retentionYears: v })} />
          </Field>
          <Toggle T={T} accent={accent} on={gdpr.dpaAccepted} onChange={v => setGdpr({ ...gdpr, dpaAccepted: v })} label="Data Processing Agreement accepted" desc="Lumio processes this data on your behalf." />
          <button style={{ width: '100%', appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '9px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>⬇ Export all academy data</button>
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: 8 }}>Per-player consent is recorded on each player; parents can also submit it via your public consent form.</div>
        </Modal>
      )}

      {open === 'staff' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Staff & safeguarding" sub="Designated lead, DBS reminders and policy" onClose={() => setOpen(null)}>
          <Field T={T} label="Designated Safeguarding Lead"><input style={input(T)} value={staffCfg.dsl} onChange={e => setStaffCfg({ ...staffCfg, dsl: e.target.value })} /></Field>
          <Field T={T} label="DBS renewal reminder">
            <Seg T={T} accent={accent} value={staffCfg.reminderDays} options={[{ v: 30, label: '30 days' }, { v: 60, label: '60 days' }, { v: 90, label: '90 days' }]} onChange={v => setStaffCfg({ ...staffCfg, reminderDays: v })} />
          </Field>
          <Toggle T={T} accent={accent} on={staffCfg.policyOn} onChange={v => setStaffCfg({ ...staffCfg, policyOn: v })} label="Require safeguarding training for all staff" desc="Flags any coach without recorded training." />
          {/* What these two settings actually do, said plainly: they drive the
              warnings on the Coaches page. Nothing is emailed. */}
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>The reminder is a warning on the <strong style={{ color: T.text2 }}>Coaches</strong> page: a DBS is flagged once it is within this many days of expiring, and (when the switch is on) so is any coach with no safeguarding training recorded. Lumio does not send reminder emails. Manage individual DBS certificates and dates on the Coaches page.</div>
        </Modal>
      )}

      {open === 'help' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Help & guidance" sub="The bits that explain the portal" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={s.helpHints !== false} onChange={v => setSettings({ helpHints: v })}
            label="Page guides (the ⓘ button)"
            desc="A small ⓘ beside each page title: what the page is for, how to use it, and the things worth knowing. Switch it off once you know your way around." />
          <Toggle T={T} accent={accent} on={s.gettingStarted !== false} onChange={v => setSettings({ gettingStarted: v })}
            label="Getting started checklist"
            desc="Seven steps on your dashboard that tick themselves off as you set the portal up. It disappears on its own once they are all done." />
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, marginTop: 12 }}>
            Turning either back on is this same switch — nothing is lost, and the checklist picks up wherever you actually are.
          </div>
          <Field T={T} label="Starter guides (PDF)" hint="The same guides that come with your welcome email — handy to pass to a new coach.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['Quick start guide', 'lumio-quick-start-guide.pdf'], ['Getting started guide', 'lumio-getting-started-guide.pdf'], ['Portal guide', 'lumio-portal-guide.pdf']].map(([t, f]) => (
                <a key={f} href={`/guides/${f}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: accent.hex, textDecoration: 'none' }}>📄 {t} ↗</a>
              ))}
            </div>
          </Field>
        </Modal>
      )}

      {open === 'messaging' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Messaging" sub="How you reach parents and players" onClose={() => setOpen(null)}>
          {/* A real academy's email goes out from its connected mailbox, or
              from the Lumio address with replies sent to its contact email —
              never from an address typed here, so the box is the demo's only. */}
          {demo
            ? <Field T={T} label="Sender email"><input style={input(T)} value={msg.senderEmail} onChange={e => setMsg({ ...msg, senderEmail: e.target.value })} /></Field>
            : <Field T={T} label="Email sender">
                <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.55 }}>Email goes out from your own mailbox once one is connected (Connected accounts). Until then it goes from the Lumio address, and replies come to your contact email (Contact &amp; calendar).</div>
              </Field>}
          {/* Texts go out over Lumio's own messaging number, server-side — there is
              no per-coach sending number, so the live portal states that instead of
              offering a field that wouldn't change where texts come from. */}
          {demo
            ? <Field T={T} label="Sender phone (SMS)"><input style={input(T)} value={msg.senderPhone} onChange={e => setMsg({ ...msg, senderPhone: e.target.value })} /></Field>
            : <Field T={T} label="Text (SMS) sender">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '2px 8px' }}>{V2_LABEL}</span>
                  <span style={{ flex: 1, minWidth: 200, fontSize: 12.5, color: T.text3, lineHeight: 1.55 }}>{V2_NOTES.sms}</span>
                </div>
              </Field>}
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Channels</div>
          <Toggle T={T} accent={accent} on={msg.email} onChange={v => setMsg({ ...msg, email: v })} label="Email" desc={demo ? 'Uses the sender email above.' : 'Off: email is not offered when you send a message.'} />
          {/* The toggle stays for the demo (which shows the finished product) and
              is off the table in a real portal until V2 — a switch that turns
              nothing on is worse than one that says why. */}
          {demo
            ? <Toggle T={T} accent={accent} on={msg.text} onChange={v => setMsg({ ...msg, text: v })} label="Text (SMS)" desc="Uses the sender phone above." />
            : <Toggle T={T} accent={accent} on={false} onChange={() => {}} label={`Text (SMS) · ${V2_LABEL}`} desc="Email and in-app both send today. Tell us if texting is something you'd use and it moves up the list." />}
          <Toggle T={T} accent={accent} on={msg.inapp} onChange={v => setMsg({ ...msg, inapp: v })} label="In-app (Lumio message)" desc={demo ? 'Always available to players in the app.' : 'A message in the player app. Off: it is not offered when you send a message.'} />
        </Modal>
      )}
    </div>
  )
}
