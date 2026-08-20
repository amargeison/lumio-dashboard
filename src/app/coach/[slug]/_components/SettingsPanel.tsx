'use client'

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachSettings } from '../_lib/use-settings'
import { useCoachProfile, saveCoachProfile, sb, currentCoachId, invalidateCoachTable } from '../_lib/coach-db'
import { setSettings, resetSettings, getHeadProfile, setHeadProfile, ACCENT_PRESETS, ACCREDITATIONS, DEFAULT_SETTINGS, LIVE_DEFAULT_SETTINGS, MODULE_SECTIONS, setSectionOff, type AccentKey } from '../_lib/settings-store'
import { COACH_SIDEBAR, COACH_GROUPS, VENUES, COACH_ORG } from '../_lib/coach-data'
import { getAddedVenues } from '../_lib/venues-store'
import { AddVenueModal } from './AddVenueModal'
import { getHidden, setHidden as setMenuHidden, ALWAYS_VISIBLE, subscribe as subscribeMenu } from '../_lib/menu-visibility'
import { getFlags, setFlag, subscribe as subscribeFeatures } from '../_lib/feature-flags'
import { IntegrationsPanel } from './IntegrationsPanel'
import { CoachContactSettings } from './CoachContactSettings'
import { CoachVenuesSettings } from './CoachVenuesSettings'
import { CoachDevelopmentSettings } from './CoachDevelopmentSettings'
import { CoachCompliance } from './CoachCompliance'
import { CoachImport } from './CoachImport'
import { seedLumioResources, LUMIO_RESOURCES } from '../_lib/lumio-resources'
import { seedLumioEquipment, EQUIPMENT_KIT_CHOICES, EQUIPMENT_CATEGORY_CHOICES } from '../_lib/lumio-equipment'
import { seedLumioPackages, LUMIO_PACKAGES } from '../_lib/lumio-packages'

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
  setSettings({ brandLogo: dataUrl || '' })
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

// Resource Centre module settings. Both controls act on the coach's OWN live
// Resource Centre (the coach_resources rows behind /resources), not on a preview.
//
// Why this exists: the Lumio starter library could only ever be loaded during
// onboarding. A coach who chose “I’ll add my own” was stuck with an empty Centre
// for good — a one-way door with no handle on the inside. And a coach who loaded
// it by mistake had to delete every card one at a time. Both now have a control.
function ResourceCentreSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const s = useCoachSettings()
  const on = s.resourcesPreloaded !== false
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
      const { data, error } = await sb().from('coach_resources').delete().eq('coach_id', uid).select('id')
      if (error) throw new Error(error.message)
      invalidateCoachTable('coach_resources')
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
        desc={on ? `${LUMIO_RESOURCES.length} drills, plans and worksheets in your live Resource Centre, tagged to the racket system.` : 'Off — your Resource Centre shows only the resources you add yourself.'} />
      {seed === 'busy' && <div style={{ ...note, color: T.text3 }}>Loading the library into your Resource Centre…</div>}
      {typeof seed === 'object' && <div style={{ ...note, color: T.good }}>✓ Added {seed.added} resource{seed.added === 1 ? '' : 's'}{seed.added === 0 ? ' — you already had the full library' : ''}.</div>}
      {seed === 'error' && <div style={{ ...note, color: T.bad }}>Couldn’t load the library — try again.</div>}
      <div style={{ ...note, color: T.text3, marginBottom: 16 }}>Switching this off leaves the resources you already have — it only stops Lumio’s library being added. To empty the Centre, use Clear all resources.</div>

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
      const kitDel = await sb().from('coach_kit_items').delete().eq('coach_id', uid).select('id')
      if (kitDel.error) throw new Error(kitDel.error.message)
      const invDel = await sb().from('coach_equipment').delete().eq('coach_id', uid).select('id')
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
        desc={on ? `${LUMIO_KIT_COUNT} checklist items across ${EQUIPMENT_KIT_CHOICES.length} session types and ${LUMIO_INVENTORY_COUNT} inventory items in your live module — edit quantities and remove what you don’t carry.` : 'Off — your kit checklists and inventory show only what you add yourself.'} />
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
  const on = s.packagesSeeded === true
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

// Lumio Coach Kit & Racket Progression rewards the coach can order (demo only —
// no real checkout/fulfilment). Effort tracking uses the player's own watch, so
// there's no GPS tracker — the kit is the capture stand, mic and rewards. £85.
const KIT_OFFERS = [
  { id: 'kit',     name: 'Lumio Coach Kit',     price: '£85', desc: 'Capture stand, mic, your first set of 9 reward keyrings & dampeners and the Black-stage trophy — everything to start. No GPS tracker: effort uses the player’s own smartwatch.', cta: 'Order kit' },
  { id: 'rackets', name: 'Reward set (×9)',     price: '£50 / set', desc: 'The Racket Progression rewards — a coloured keyring + matching dampener per level. Reorder as you award them.', cta: 'Reorder set' },
]

// ════════════════════════════════════════════════════════════════════════════
export function SettingsPanel({ T, accent, density, demo = false }: Common & { demo?: boolean }) {
  const s = useCoachSettings()
  const [open, setOpen] = useState<string | null>(null)
  const [addVenueOpen, setAddVenueOpen] = useState(false)
  // Demo "order" state — which kit items the coach has added to their order.
  const [ordered, setOrdered] = useState<string[]>([])
  // Feature flags — Video & Audio each toggle their half of the module. Fallback
  // matches page.tsx (demo = elite/all-on, live founder = prolite).
  const featFallback = demo ? 'elite' : 'prolite'
  const [feat, setFeat] = useState(() => getFlags(featFallback))
  useEffect(() => { const r = () => setFeat(getFlags(featFallback)); r(); return subscribeFeatures(r) }, [featFallback])

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
  const conn = { ...D.conn, ...(s.conn || {}) }
  const setConn = (n: typeof conn) => setSettings({ conn: n })
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

  const [hiddenMenu, setHiddenMenu] = useState<string[]>([])
  useEffect(() => { setHiddenMenu(getHidden()); return subscribeMenu(() => setHiddenMenu(getHidden())) }, [])
  const shownCount = COACH_SIDEBAR.filter(i => !hiddenMenu.includes(i.id)).length

  const sharingList = [s.shareHomework && 'homework', s.shareNextFocus && 'next focus', s.shareCoachNote && 'coach note'].filter(Boolean).join(', ') || 'nothing'

  const GROUPS = ['You', 'Academy', 'Coaching', 'People & compliance', 'Rewards & system']
  const cards = [
    { id: 'profile',     g: 'You',        icon: 'people',    t: 'Head coach profile',  d: `${[hp.name, hp.role].filter(Boolean).join(' · ')} · email & calendar ${conn.calendarSync ? 'synced' : 'off'}` },
    { id: 'integrations',g: 'You',        icon: 'calendar',  t: 'Connected accounts',  d: 'Email & calendar sync — Google, Outlook, iCloud' },
    { id: 'academy',     g: 'Academy',    icon: 'home',      t: 'Academy profile',     d: [s.academy, s.cert].filter(Boolean).join(' · ') || 'Add your academy name & accreditation' },
    { id: 'booking',     g: 'Academy',    icon: 'calendar',  t: 'Booking calendar',    d: `${[booking.google && 'Google', booking.outlook && 'Outlook'].filter(Boolean).join(' + ') || 'No'} sync · ${booking.defaultDuration}m default` },
    { id: 'availability',g: 'Academy',    icon: 'grid',      t: 'Availability & courts', d: `${s.bookableHours} · ${s.lessonTypes.length} lesson types` },
    { id: 'pricing',     g: 'Academy',    icon: 'pound',     t: 'Pricing & packages',  d: s.privateRate ? `Private £${s.privateRate}/hr · packs & renewals` : 'Set your hourly rate · packs & renewals' },
    { id: 'belts',       g: 'Coaching',   icon: 'trophy',    t: 'Racket criteria',     d: `Award racket at: ${s.awardThreshold === 4 ? 'Mastered' : 'Consistent'} or better` },
    { id: 'rewards',     g: 'Coaching',   icon: 'flag',      t: 'Effort & Rewards',    d: `Leaderboard ${rewards.leaderboard ? 'on' : 'off'} · watch consent default ${rewards.watchConsentDefault ? 'on' : 'off'}` },
    { id: 'sharing',     g: 'Coaching',   icon: 'megaphone', t: 'Parent sharing',      d: `Shares include: ${sharingList}` },
    { id: 'gdpr',        g: 'People & compliance', icon: 'shield', t: 'Players & data (GDPR)', d: `Retention ${gdpr.retentionYears}y · DPA ${gdpr.dpaAccepted ? 'accepted' : 'pending'}` },
    { id: 'staff',       g: 'People & compliance', icon: 'people', t: 'Staff & safeguarding',  d: `DSL ${staffCfg.dsl || 'not set'} · DBS reminders ${staffCfg.reminderDays}d` },
    { id: 'messaging',   g: 'People & compliance', icon: 'note',   t: 'Messaging',             d: `${[msg.email && 'Email', msg.text && 'Text', msg.inapp && 'In-app'].filter(Boolean).join(' · ') || 'No channels'}` },
    { id: 'kit',         g: 'Rewards & system', icon: 'wrench',   t: 'Lumio Coach Kit & rewards', d: 'Your plan: Coach £39/mo · order kit & rewards' },
    { id: 'appearance',  g: 'Rewards & system', icon: 'settings', t: 'Appearance',          d: `${s.theme === 'light' ? 'Light' : 'Dark'} · ${ACCENT_PRESETS[s.accentKey].label} · ${s.density}` },
    { id: 'menu',        g: 'Rewards & system', icon: 'eye',      t: 'Menu visibility',     d: `${shownCount} of ${COACH_SIDEBAR.length} menu items shown` },
    { id: 'studentapp',  g: 'Rewards & system', icon: 'people',   t: 'Parent & student app', d: s.studentApp ? 'On · Student view available in your profile menu' : 'Off · your switcher shows coach views only' },
    { id: 'contact',     g: 'You',        icon: 'note',     t: 'Contact & calendar',  d: 'Sender email, phone & calendar sync' },
    { id: 'venuescfg',   g: 'Academy',    icon: 'home',     t: 'Venues & courts',     d: 'Venues, courts & calendar links' },
    { id: 'devcfg',      g: 'Coaching',   icon: 'trophy',   t: 'Coaching, rewards & modules', d: 'Racket criteria, effort & module setup' },
    { id: 'privacy',     g: 'People & compliance', icon: 'shield', t: 'Privacy & compliance', d: 'GDPR, consents & data retention' },
    { id: 'import',      g: 'Rewards & system', icon: 'note',  t: 'Import data',          d: 'Bulk import from a spreadsheet or photo' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Tap any card to customise it — changes apply across the portal instantly.</p>
        </div>
        {!demo && <button onClick={() => resetSettings()} style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 9, padding: '7px 12px', fontSize: 11.5, cursor: 'pointer' }}>Reset to defaults</button>}
      </div>

      {GROUPS.map(group => {
        const gc = cards.filter(c => c.g === group)
        if (!gc.length) return null
        return (
          <div key={group} style={{ marginBottom: density.gap + 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{group}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: density.gap }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: density.gap }}>
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
      {open === 'contact' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Contact & calendar" onClose={() => setOpen(null)}><CoachContactSettings T={T} accent={accent} /></Modal>)}
      {open === 'venuescfg' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Venues & courts" onClose={() => setOpen(null)}><CoachVenuesSettings T={T} accent={accent} /></Modal>)}
      {open === 'devcfg' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Coaching, rewards & modules" onClose={() => setOpen(null)}><CoachDevelopmentSettings T={T} accent={accent} /></Modal>)}
      {open === 'privacy' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Privacy & compliance" onClose={() => setOpen(null)}><CoachCompliance T={T} accent={accent} demo={demo} /></Modal>)}
      {open === 'import' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Import data" onClose={() => setOpen(null)}><CoachImport T={T} accent={accent} /></Modal>)}
      {open === 'integrations' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Connected accounts" sub="Connect your mailbox & calendar to add bookings to your calendar and send as you" onClose={() => setOpen(null)}>
          <IntegrationsPanel T={T} accent={accent} />
        </Modal>
      )}
      {open === 'academy' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Academy profile" sub="Shown across the portal — sidebar, dashboard, packs and certificates" onClose={() => setOpen(null)}>
          <Field T={T} label="Academy name"><input style={input(T)} placeholder="Your academy name" value={s.academy} onChange={e => setSettings({ academy: e.target.value })} /></Field>
          <Field T={T} label="Head coach name"><input style={input(T)} placeholder="Your name" value={s.coach} onChange={e => setSettings({ coach: e.target.value })} /></Field>
          <Field T={T} label="Certification / tagline"><input style={input(T)} placeholder="e.g. LTA Accredited Coach" value={s.cert} onChange={e => setSettings({ cert: e.target.value })} /></Field>
        </Modal>
      )}

      {open === 'belts' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Racket criteria" sub="When does a racket count as earned?" onClose={() => setOpen(null)}>
          <Field T={T} label="Award a racket when every skill reaches" hint="Affects racket progress % everywhere — try it, then open Player Development.">
            <Seg T={T} accent={accent} value={s.awardThreshold}
              options={[{ v: 3, label: 'Consistent' }, { v: 4, label: 'Mastered' }]}
              onChange={v => setSettings({ awardThreshold: v as 3 | 4 })} />
          </Field>
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>The skill-to-racket mapping itself is editable in <code>coach-data.ts</code>; a drag-and-drop editor is on the roadmap.</div>
        </Modal>
      )}

      {open === 'availability' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Availability & courts" onClose={() => setOpen(null)}>
          <Field T={T} label="Bookable hours"><input style={input(T)} value={s.bookableHours} onChange={e => setSettings({ bookableHours: e.target.value })} /></Field>
          <Field T={T} label="Lesson types offered" hint="Tap to toggle.">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Private', 'Group', 'Cardio', 'Match play', 'Cardio Tennis', 'Squad', 'Camp'].map(lt => {
                const on = s.lessonTypes.includes(lt)
                return <button key={lt} onClick={() => setSettings({ lessonTypes: on ? s.lessonTypes.filter(x => x !== lt) : [...s.lessonTypes, lt] })}
                  style={{ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 8, padding: '5px 11px', fontSize: 11.5, cursor: 'pointer', fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{lt}</button>
              })}
            </div>
          </Field>
          {(() => {
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
          <Field T={T} label="Private lesson rate (£ / hour)">
            <input style={input(T)} inputMode="numeric" placeholder="e.g. 38" value={s.privateRate ? String(s.privateRate) : ''} onChange={e => setSettings({ privateRate: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
          </Field>
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>Packages and renewal rules are managed on the Payments page; this rate feeds new quotes and the Payments header.</div>
        </Modal>
      )}

      {open === 'kit' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Lumio Coach Kit & rewards" sub="Order your capture kit and Racket Progression rewards" onClose={() => setOpen(null)}>
          {/* Read-only plan line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <Icon name="shield" size={15} stroke={1.7} style={{ color: accent.hex }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Your Lumio plan</div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Coach · £39 / month</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, background: T.hover, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo</span>
          </div>

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
                <button onClick={() => setOrdered(prev => on ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                  style={{ appearance: 'none', flexShrink: 0, border: on ? `1px solid ${accent.border}` : 0, borderRadius: 8, padding: '8px 12px', fontSize: 11.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', background: on ? 'transparent' : accent.hex, color: on ? accent.hex : T.btnText, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {on ? <><Icon name="check" size={12} stroke={2.2} /> Added to order</> : item.cta}
                </button>
              </div>
            )
          })}

          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>
            Racket certificates are included — print them per player from <strong style={{ color: T.text2 }}>Player Development</strong>. Kit &amp; mic pricing is indicative while the hardware is field-tested.
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: T.panel2, border: `1px dashed ${T.border}`, borderRadius: 9, padding: '9px 12px' }}>
            <span style={{ fontSize: 15 }}>🛒</span>
            <span style={{ fontSize: 11.5, color: T.text2 }}>{ordered.length ? `${ordered.length} item${ordered.length > 1 ? 's' : ''} in your order` : 'Your order is empty'} · <span style={{ color: T.text3 }}>demo only — no real checkout or fulfilment yet</span></span>
          </div>
        </Modal>
      )}

      {open === 'sharing' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Parent sharing" sub="What's included when you share or export a lesson summary" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={s.shareHomework} onChange={v => setSettings({ shareHomework: v })} label="Include homework" desc="The practice set for the week" />
          <Toggle T={T} accent={accent} on={s.shareNextFocus} onChange={v => setSettings({ shareNextFocus: v })} label="Include next session focus" desc="What you'll work on next" />
          <Toggle T={T} accent={accent} on={s.shareCoachNote} onChange={v => setSettings({ shareCoachNote: v })} label="Include private coach note" desc="Off by default — usually for your eyes only" />
        </Modal>
      )}

      {open === 'appearance' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Appearance" sub="Watch the whole portal change as you tweak these" onClose={() => setOpen(null)}>
          <Field T={T} label="Theme">
            <Seg T={T} accent={accent} value={s.theme} options={[{ v: 'dark', label: 'Dark' }, { v: 'light', label: 'Light' }]} onChange={v => setSettings({ theme: v as 'dark' | 'light' })} />
          </Field>
          <Field T={T} label="Accent colour">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(ACCENT_PRESETS) as AccentKey[]).map(k => {
                const p = ACCENT_PRESETS[k]; const on = s.accentKey === k
                return <button key={k} onClick={() => setSettings({ accentKey: k })} title={p.label}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: p.hex, border: on ? `3px solid ${T.text}` : `2px solid ${T.border}`, cursor: 'pointer', appearance: 'none', boxShadow: on ? `0 0 0 2px ${p.hex}55` : 'none' }} />
              })}
            </div>
          </Field>
          <Field T={T} label="Density">
            <Seg T={T} accent={accent} value={s.density} options={[{ v: 'compact', label: 'Compact' }, { v: 'regular', label: 'Regular' }, { v: 'spacious', label: 'Spacious' }]} onChange={v => setSettings({ density: v as 'compact' | 'regular' | 'spacious' })} />
          </Field>
          <Field T={T} label="Club logo" hint="Replaces the Lumio mark top-left in your portal.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {s.brandLogo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={s.brandLogo} alt="Club logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: T.panel2, border: `1px solid ${T.border}` }} />
                : <div style={{ width: 44, height: 44, borderRadius: 8, background: T.panel2, border: `1px dashed ${T.border}`, display: 'grid', placeItems: 'center', fontSize: 10, color: T.text3 }}>none</div>}
              <label style={{ appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ⬆ Upload logo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { await saveBrandLogo(await fileToLogoDataUrl(f)) } catch { /* ignore */ } }} />
              </label>
              {s.brandLogo && <button onClick={() => saveBrandLogo(null)} style={{ appearance: 'none', background: 'transparent', border: 0, color: T.bad, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Remove</button>}
            </div>
          </Field>
        </Modal>
      )}

      {open === 'menu' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Menu visibility" sub="Hide nav items you don't use — they leave the sidebar instantly. Dashboard and Settings always stay." onClose={() => setOpen(null)}>
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

      {/* Parent & student app — deliberately NOT readOnly in the demo. Every
          other card is locked there because it would edit a sample academy's
          data; this one only decides whether the Student view is offered in the
          profile menu, and locking it would make that view unreachable in the
          demo now it's off by default. */}
      {open === 'studentapp' && (
        <Modal T={T} accent={accent} title="Parent & student app" sub="The player & parent view of your academy" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={!!s.studentApp} onChange={v => setSettings({ studentApp: v })}
            label="Student app" desc="On: your profile menu gains a Student view so you can see the academy as a player or parent does. Off: coach views only." />
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>
            The parent &amp; student app is a <strong style={{ color: T.text2 }}>Pro / Academy</strong> feature. It&rsquo;s yours to switch on or off here for now — no billing attached yet.
          </div>
        </Modal>
      )}

      {open === 'profile' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Head coach profile" sub="Your details, calendar sync and safeguarding documents" onClose={() => setOpen(null)}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 10px' }}>Contact details</div>
          <Field T={T} label="Name">
            <input style={input(T)} value={hp.name} onChange={e => setHeadProfile({ name: e.target.value })}
              onBlur={e => { const v = e.target.value.trim(); if (v && v !== realProfile.display_name) saveCoachProfile({ display_name: v }).then(() => realProfile.reload()).catch(() => {}) }} />
          </Field>
          <Field T={T} label="Role"><input style={input(T)} value={hp.role} onChange={e => setHeadProfile({ role: e.target.value })} /></Field>
          <Field T={T} label="Accreditation" hint="Shown on your profile card and to families.">
            <select style={{ ...input(T), cursor: 'pointer' }} value={hp.accreditation} onChange={e => setHeadProfile({ accreditation: e.target.value })}>
              {Array.from(new Set([hp.accreditation, ...ACCREDITATIONS].filter(Boolean))).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field T={T} label="Email"><input style={input(T)} value={hp.email} onChange={e => setHeadProfile({ email: e.target.value })} /></Field>
          <Field T={T} label="Phone"><input style={input(T)} value={hp.phone} onChange={e => setHeadProfile({ phone: e.target.value })} /></Field>

          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Email &amp; calendar sync</div>
          <Field T={T} label="Connected account" hint="Sessions and bookings are added to your calendar.">
            <Seg T={T} accent={accent} value={conn.emailProvider} options={[{ v: 'google', label: 'Google' }, { v: 'outlook', label: 'Outlook' }, { v: 'none', label: 'None' }]} onChange={v => setConn({ ...conn, emailProvider: v })} />
          </Field>
          <Toggle T={T} accent={accent} on={conn.calendarSync} onChange={v => setConn({ ...conn, calendarSync: v })} label="Calendar sync (one-way)" desc="Your Lumio bookings are added to your calendar. Busy times from it show striped in your diary." />

          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>DBS &amp; safeguarding documents</div>
          <Field T={T} label="DBS certificate number"><input style={input(T)} value={hp.dbsNumber} onChange={e => setHeadProfile({ dbsNumber: e.target.value })} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field T={T} label="DBS expiry"><input type="date" style={input(T)} value={hp.dbsExpiry} onChange={e => setHeadProfile({ dbsExpiry: e.target.value })} /></Field>
            <Field T={T} label="Safeguarding training"><input type="date" style={input(T)} value={hp.safeguardingDate} onChange={e => setHeadProfile({ safeguardingDate: e.target.value, safeguardingTrained: !!e.target.value })} /></Field>
          </div>
          <button style={{ width: '100%', appearance: 'none', border: `1px dashed ${T.border}`, background: T.panel2, color: T.text2, borderRadius: 9, padding: '10px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⬆ Upload DBS certificate (PDF)</button>
          <div style={{ fontSize: 11, color: T.good, marginTop: 6 }}>✓ riverside-dbs-2024.pdf · uploaded · demo only</div>
        </Modal>
      )}

      {open === 'booking' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Booking calendar" sub="Sync external calendars and set booking defaults" onClose={() => setOpen(null)}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 10px' }}>External calendar sync</div>
          <Toggle T={T} accent={accent} on={booking.google} onChange={v => setBooking({ ...booking, google: v })} label="Google Calendar" desc="Bookings are added to your Google Calendar; busy times show striped." />
          <Toggle T={T} accent={accent} on={booking.outlook} onChange={v => setBooking({ ...booking, outlook: v })} label="Outlook / Microsoft 365" desc="Bookings are added to your work calendar; busy times show striped." />
          <Field T={T} label="iCal subscribe URL" hint="Paste a read-only feed to overlay external commitments.">
            <input style={input(T)} value={booking.ical} onChange={e => setBooking({ ...booking, ical: e.target.value })} placeholder="webcal://…" />
          </Field>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Booking defaults</div>
          <Field T={T} label="Default lesson length">
            <Seg T={T} accent={accent} value={booking.defaultDuration} options={[{ v: 30, label: '30 min' }, { v: 45, label: '45 min' }, { v: 60, label: '60 min' }]} onChange={v => setBooking({ ...booking, defaultDuration: v })} />
          </Field>
          <Field T={T} label="Buffer between bookings (min)"><input style={input(T)} inputMode="numeric" value={String(booking.buffer)} onChange={e => setBooking({ ...booking, buffer: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
          <Toggle T={T} accent={accent} on={booking.autoConfirm} onChange={v => setBooking({ ...booking, autoConfirm: v })} label="Auto-confirm bookings" desc="Off = you approve each request before it's booked." />
        </Modal>
      )}

      {open === 'rewards' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Effort & Rewards" sub="The smartwatch reward system — separate from Racket Progression" onClose={() => setOpen(null)}>
          <Toggle T={T} accent={accent} on={rewards.leaderboard} onChange={v => setRewards({ ...rewards, leaderboard: v })} label="Show squad leaderboard" desc="Rank players by XP across the academy." />
          <Toggle T={T} accent={accent} on={rewards.levelsVisible} onChange={v => setRewards({ ...rewards, levelsVisible: v })} label="Show effort levels to players" desc="Rookie → Elite progression in the student view." />
          <Toggle T={T} accent={accent} on={rewards.watchConsentDefault} onChange={v => setRewards({ ...rewards, watchConsentDefault: v })} label="Default new players to wearable consent" desc="Off is safer — capture effort only with explicit parent consent." />
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
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, marginTop: 6 }}>Manage individual DBS certificates and dates on the <strong style={{ color: T.text2 }}>Staff</strong> page.</div>
        </Modal>
      )}

      {open === 'messaging' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Messaging" sub="How you reach parents and players" onClose={() => setOpen(null)}>
          <Field T={T} label="Sender email"><input style={input(T)} value={msg.senderEmail} onChange={e => setMsg({ ...msg, senderEmail: e.target.value })} /></Field>
          {/* Texts go out over Lumio's own messaging number, server-side — there is
              no per-coach sending number, so the live portal states that instead of
              offering a field that wouldn't change where texts come from. */}
          {demo
            ? <Field T={T} label="Sender phone (SMS)"><input style={input(T)} value={msg.senderPhone} onChange={e => setMsg({ ...msg, senderPhone: e.target.value })} /></Field>
            : <Field T={T} label="Text (SMS) sender">
                <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.55 }}>
                  Texts send from Lumio&rsquo;s messaging number — there&rsquo;s no per-coach number to set. Replies come back to your Lumio inbox.
                </div>
              </Field>}
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Channels</div>
          <Toggle T={T} accent={accent} on={msg.email} onChange={v => setMsg({ ...msg, email: v })} label="Email" desc="Uses the sender email above." />
          <Toggle T={T} accent={accent} on={msg.text} onChange={v => setMsg({ ...msg, text: v })} label="Text (SMS)" desc={demo ? 'Uses the sender phone above.' : 'Sends from Lumio’s messaging number.'} />
          <Toggle T={T} accent={accent} on={msg.inapp} onChange={v => setMsg({ ...msg, inapp: v })} label="In-app (Lumio message)" desc="Always available to players in the app." />
        </Modal>
      )}
    </div>
  )
}
