'use client'

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachSettings } from '../_lib/use-settings'
import { useCoachProfile, saveCoachProfile, sb, currentCoachId } from '../_lib/coach-db'
import { setSettings, resetSettings, getHeadProfile, setHeadProfile, ACCENT_PRESETS, ACCREDITATIONS, DEFAULT_SETTINGS, type AccentKey } from '../_lib/settings-store'
import { COACH_SIDEBAR, COACH_GROUPS, VENUES, COACH_ORG } from '../_lib/coach-data'
import { getAddedVenues } from '../_lib/venues-store'
import { AddVenueModal } from './AddVenueModal'
import { getHidden, setHidden as setMenuHidden, ALWAYS_VISIBLE, subscribe as subscribeMenu } from '../_lib/menu-visibility'
import { IntegrationsPanel } from './IntegrationsPanel'
import { CoachContactSettings } from './CoachContactSettings'
import { CoachVenuesSettings } from './CoachVenuesSettings'
import { CoachDevelopmentSettings } from './CoachDevelopmentSettings'
import { CoachCompliance } from './CoachCompliance'
import { CoachImport } from './CoachImport'

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

  // Per-area settings — persisted via the same localStorage store as the rest of
  // Settings (survives reload, applies across the portal). Each value reads from
  // the store (merged over defaults) and writes the full object back on change.
  const profile = { ...DEFAULT_SETTINGS.profile, ...(s.profile || {}) }
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
  }, [realProfile.loading, realProfile.display_name, realProfile.contact_email, realProfile.contact_phone])
  const conn = { ...DEFAULT_SETTINGS.conn, ...(s.conn || {}) }
  const setConn = (n: typeof conn) => setSettings({ conn: n })
  const booking = { ...DEFAULT_SETTINGS.booking, ...(s.booking || {}) }
  const setBooking = (n: typeof booking) => setSettings({ booking: n })
  const gdpr = { ...DEFAULT_SETTINGS.gdpr, ...(s.gdpr || {}) }
  const setGdpr = (n: typeof gdpr) => setSettings({ gdpr: n })
  // Live (real) portals start with an EMPTY DSL — the demo default (a sample head
  // coach) must not leak onto a brand-new academy. The demo keeps the sample data.
  const staffDefaults = demo ? DEFAULT_SETTINGS.staff : { ...DEFAULT_SETTINGS.staff, dsl: '' }
  const staffCfg = { ...staffDefaults, ...(s.staff || {}) }
  const setStaffCfg = (n: typeof staffCfg) => setSettings({ staff: n })
  const msg = { ...DEFAULT_SETTINGS.messaging, ...(s.messaging || {}) }
  const setMsg = (n: typeof msg) => setSettings({ messaging: n })
  const rewards = { ...DEFAULT_SETTINGS.rewards, ...(s.rewards || {}) }
  const setRewards = (n: typeof rewards) => setSettings({ rewards: n })

  const [hiddenMenu, setHiddenMenu] = useState<string[]>([])
  useEffect(() => { setHiddenMenu(getHidden()); return subscribeMenu(() => setHiddenMenu(getHidden())) }, [])
  const shownCount = COACH_SIDEBAR.filter(i => !hiddenMenu.includes(i.id)).length

  const sharingList = [s.shareHomework && 'homework', s.shareNextFocus && 'next focus', s.shareCoachNote && 'coach note'].filter(Boolean).join(', ') || 'nothing'

  const GROUPS = ['You', 'Academy', 'Coaching', 'People & compliance', 'Rewards & system']
  const cards = [
    { id: 'profile',     g: 'You',        icon: 'people',    t: 'Head coach profile',  d: `${hp.name} · ${hp.role} · email & calendar ${conn.calendarSync ? 'synced' : 'off'}` },
    { id: 'integrations',g: 'You',        icon: 'calendar',  t: 'Connected accounts',  d: 'Email & calendar sync — Google, Outlook, iCloud' },
    { id: 'academy',     g: 'Academy',    icon: 'home',      t: 'Academy profile',     d: `${s.academy} · ${s.cert}` },
    { id: 'booking',     g: 'Academy',    icon: 'calendar',  t: 'Booking calendar',    d: `${[booking.google && 'Google', booking.outlook && 'Outlook'].filter(Boolean).join(' + ') || 'No'} sync · ${booking.defaultDuration}m default` },
    { id: 'availability',g: 'Academy',    icon: 'grid',      t: 'Availability & courts', d: `${s.bookableHours} · ${s.lessonTypes.length} lesson types` },
    { id: 'pricing',     g: 'Academy',    icon: 'pound',     t: 'Pricing & packages',  d: `Private £${s.privateRate}/hr · packs & renewals` },
    { id: 'belts',       g: 'Coaching',   icon: 'trophy',    t: 'Racket criteria',     d: `Award racket at: ${s.awardThreshold === 4 ? 'Mastered' : 'Consistent'} or better` },
    { id: 'rewards',     g: 'Coaching',   icon: 'flag',      t: 'Effort & Rewards',    d: `Leaderboard ${rewards.leaderboard ? 'on' : 'off'} · watch consent default ${rewards.watchConsentDefault ? 'on' : 'off'}` },
    { id: 'sharing',     g: 'Coaching',   icon: 'megaphone', t: 'Parent sharing',      d: `Shares include: ${sharingList}` },
    { id: 'gdpr',        g: 'People & compliance', icon: 'shield', t: 'Players & data (GDPR)', d: `Retention ${gdpr.retentionYears}y · DPA ${gdpr.dpaAccepted ? 'accepted' : 'pending'}` },
    { id: 'staff',       g: 'People & compliance', icon: 'people', t: 'Staff & safeguarding',  d: `DSL ${staffCfg.dsl || 'not set'} · DBS reminders ${staffCfg.reminderDays}d` },
    { id: 'messaging',   g: 'People & compliance', icon: 'note',   t: 'Messaging',             d: `${[msg.email && 'Email', msg.text && 'Text', msg.inapp && 'In-app'].filter(Boolean).join(' · ') || 'No channels'}` },
    { id: 'kit',         g: 'Rewards & system', icon: 'wrench',   t: 'Lumio Coach Kit & rewards', d: 'Your plan: Coach £39/mo · order kit & rewards' },
    { id: 'appearance',  g: 'Rewards & system', icon: 'settings', t: 'Appearance',          d: `${s.theme === 'light' ? 'Light' : 'Dark'} · ${ACCENT_PRESETS[s.accentKey].label} · ${s.density}` },
    { id: 'menu',        g: 'Rewards & system', icon: 'eye',      t: 'Menu visibility',     d: `${shownCount} of ${COACH_SIDEBAR.length} menu items shown` },
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
        return (
          <Modal readOnly={demo} T={T} accent={accent} title={item.label} sub="Module settings" onClose={() => setOpen(null)}>
            <Toggle T={T} accent={accent} on={!hidden} onChange={v => { if (!locked) setMenuHidden(mid, !v) }} label="Show in the sidebar" desc={locked ? 'Always visible — can’t be hidden.' : 'Hide this module from the coach menu.'} />
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 10, lineHeight: 1.5 }}>More options for {item.label} — section toggles, colour and setup — are coming to this panel.</div>
          </Modal>
        )
      })()}
      {open === 'contact' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Contact & calendar" onClose={() => setOpen(null)}><CoachContactSettings T={T} accent={accent} /></Modal>)}
      {open === 'venuescfg' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Venues & courts" onClose={() => setOpen(null)}><CoachVenuesSettings T={T} accent={accent} /></Modal>)}
      {open === 'devcfg' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Coaching, rewards & modules" onClose={() => setOpen(null)}><CoachDevelopmentSettings T={T} accent={accent} /></Modal>)}
      {open === 'privacy' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Privacy & compliance" onClose={() => setOpen(null)}><CoachCompliance T={T} accent={accent} demo={demo} /></Modal>)}
      {open === 'import' && (<Modal wide readOnly={demo} T={T} accent={accent} title="Import data" onClose={() => setOpen(null)}><CoachImport T={T} accent={accent} /></Modal>)}
      {open === 'integrations' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Connected accounts" sub="Connect your mailbox & calendar for two-way sync and send-as-you email" onClose={() => setOpen(null)}>
          <IntegrationsPanel T={T} accent={accent} />
        </Modal>
      )}
      {open === 'academy' && (
        <Modal readOnly={demo} T={T} accent={accent} title="Academy profile" sub="Shown across the portal — sidebar, dashboard, packs and certificates" onClose={() => setOpen(null)}>
          <Field T={T} label="Academy name"><input style={input(T)} value={s.academy} onChange={e => setSettings({ academy: e.target.value })} /></Field>
          <Field T={T} label="Head coach name"><input style={input(T)} value={s.coach} onChange={e => setSettings({ coach: e.target.value })} /></Field>
          <Field T={T} label="Certification / tagline"><input style={input(T)} value={s.cert} onChange={e => setSettings({ cert: e.target.value })} /></Field>
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
            <input style={input(T)} inputMode="numeric" value={String(s.privateRate)} onChange={e => setSettings({ privateRate: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
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
            <Toggle T={T} accent={accent} on={s.audioOnly} onChange={v => setSettings({ audioOnly: v })} label="Audio only" desc="Hide the video half — the module shows audio only and the menu item is renamed “Audio only”." />
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
          <Field T={T} label="Connected account" hint="Sessions and bookings sync both ways.">
            <Seg T={T} accent={accent} value={conn.emailProvider} options={[{ v: 'google', label: 'Google' }, { v: 'outlook', label: 'Outlook' }, { v: 'none', label: 'None' }]} onChange={v => setConn({ ...conn, emailProvider: v })} />
          </Field>
          <Toggle T={T} accent={accent} on={conn.calendarSync} onChange={v => setConn({ ...conn, calendarSync: v })} label="Two-way calendar sync" desc="Bookings appear in your calendar; your busy times block new bookings." />

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
          <Toggle T={T} accent={accent} on={booking.google} onChange={v => setBooking({ ...booking, google: v })} label="Google Calendar" desc="Two-way sync of bookings and busy times." />
          <Toggle T={T} accent={accent} on={booking.outlook} onChange={v => setBooking({ ...booking, outlook: v })} label="Outlook / Microsoft 365" desc="Two-way sync with your work calendar." />
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
          <Field T={T} label="Sender phone (SMS)"><input style={input(T)} value={msg.senderPhone} onChange={e => setMsg({ ...msg, senderPhone: e.target.value })} /></Field>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 10px' }}>Channels</div>
          <Toggle T={T} accent={accent} on={msg.email} onChange={v => setMsg({ ...msg, email: v })} label="Email" desc="Uses the sender email above." />
          <Toggle T={T} accent={accent} on={msg.text} onChange={v => setMsg({ ...msg, text: v })} label="Text (SMS)" desc="Uses the sender phone above." />
          <Toggle T={T} accent={accent} on={msg.inapp} onChange={v => setMsg({ ...msg, inapp: v })} label="In-app (Lumio message)" desc="Always available to players in the app." />
        </Modal>
      )}
    </div>
  )
}
