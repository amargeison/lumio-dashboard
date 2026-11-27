'use client'

// Settings on a live Impact portal (brief 5): a list of sections on the left, one section
// at a time on the right, like the Coach SettingsPanel. Every save shows "Saved" and leaves
// a row in impact_orgs' audit log (migration 240): saves to impact_orgs.settings are
// logged by the database itself; the booklet, venues and people actions log their own.
// Nothing here is a switch for something that doesn't exist yet.

import React, { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Building2, UserCheck, LayoutGrid, MessageSquare, BookOpen, MapPin, Database, Plug, Sparkles, Moon, LifeBuoy, History,
  CheckCircle, Upload, Download, RefreshCw, Trash2,
} from 'lucide-react'
import { Card, SectionTitle, Pill, formField, formLabel, buttonPrimary, buttonSecondary, EmptyState } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { ModulesCard } from './OrgSettings'
import MembersCard from './MembersCard'
import ImportCard from './ImportCard'
import ImportHistoryCard from './ImportHistoryCard'
import WelcomePackSettings from './WelcomePackSettings'
import { MessagingSettings, STATE_PILL, useSettingsStatus } from './MessagingSettings'
import { aiFeatureOn, privacyUrlOf, type ImpactOrgSettings } from '@/lib/impact/org'
import { currentHq, impactFetch } from '@/lib/impact/org-scope'
import { orgTerms, termDatesProblem } from '@/lib/impact/term'
import { logAppChange } from '@/lib/impact/settings-log'
import { EXPORT_DAYS } from '@/lib/impact/exports'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const SECTIONS = [
  { id: 'organisation', label: 'Organisation', icon: Building2 },
  { id: 'people', label: 'People & access', icon: UserCheck },
  { id: 'modules', label: 'Modules', icon: LayoutGrid },
  { id: 'messaging', label: 'Messaging', icon: MessageSquare },
  { id: 'booklet', label: 'Welcome pack & booklet', icon: BookOpen },
  { id: 'venues', label: 'Venues & sessions', icon: MapPin },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'appearance', label: 'Appearance', icon: Moon },
  { id: 'history', label: 'Change history', icon: History },
  { id: 'help', label: 'Help', icon: LifeBuoy },
] as const
type SectionId = typeof SECTIONS[number]['id']

const Saved = ({ state, error }: { state: 'idle' | 'saving' | 'saved' | 'error'; error?: string | null }) =>
  state === 'saved' ? <span role="status" style={{ fontSize: 11.5, color: '#187A3C', fontWeight: 800 }}><CheckCircle size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />Saved</span>
  : state === 'error' ? <span role="alert" style={{ fontSize: 11.5, color: TP_RED, fontWeight: 800 }}>{error || 'Couldn’t save. Please try again.'}</span> : null

const Note = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 11.5, color: '#6B6560', background: '#F7F5F2', borderRadius: 9, padding: '9px 11px', lineHeight: 1.5 }}>{children}</div>

// ── Organisation ────────────────────────────────────────────────────────────
type Field = { key: string; label: string; placeholder?: string; type?: string; get: (s: ImpactOrgSettings) => string; set: (s: ImpactOrgSettings, v: string) => ImpactOrgSettings }
const plain = (key: keyof ImpactOrgSettings, label: string, placeholder?: string, type?: string): Field => ({
  key, label, placeholder, type, get: s => String(s[key] ?? ''), set: (s, v) => ({ ...s, [key]: v }),
})
const ORG_FIELDS: Field[] = [
  plain('org', 'Organisation name', 'e.g. Northvale Sport Foundation'),
  plain('legal', 'Legal name', 'As registered, e.g. … CIO'),
  plain('tagline', 'Tagline', 'Optional'),
  plain('domain', 'Website', 'yourorg.org.uk'),
  plain('email', 'Contact email', 'info@yourorg.org.uk', 'email'),
  plain('phone', 'Phone', 'Optional', 'tel'),
  plain('address', 'Registered address', 'Street, postcode'),
  plain('town', 'Town', 'Optional'),
  plain('volunteer', 'What you call volunteers', 'e.g. Volunteer, Court Captain'),
  plain('charityNumber', 'Charity number', 'Leave blank until registered'),
  plain('privacyUrl', 'Privacy policy link', 'https://yourorg.org.uk/privacy', 'url'),
  { key: 'sgName', label: 'Safeguarding lead', placeholder: 'Name', get: s => s.safeguarding?.name ?? '', set: (s, v) => ({ ...s, safeguarding: { ...(s.safeguarding ?? {}), name: v } }) },
  { key: 'sgContact', label: 'Safeguarding lead contact', placeholder: 'Phone or email', get: s => s.safeguarding?.contact ?? '', set: (s, v) => ({ ...s, safeguarding: { ...(s.safeguarding ?? {}), contact: v } }) },
]

function OrganisationSection() {
  const { org, brand } = useImpact()
  const [draft, setDraft] = useState<ImpactOrgSettings>(org?.settings ?? {})
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  const [logoState, setLogoState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [logoErr, setLogoErr] = useState<string | null>(null)
  // A save (or a reload) brings new settings: start from them.
  const [seen, setSeen] = useState(org?.settings)
  if (org?.settings !== seen) { setSeen(org?.settings); setDraft(org?.settings ?? {}) }
  if (!org) return null
  const editable = org.canEdit
  async function save() {
    if (!org) return
    if (draft.privacyUrl?.trim() && !privacyUrlOf(draft)) { setProblem('The privacy policy link must be a full web address starting https://'); setState('error'); return }
    setProblem(null); setState('saving')
    const r = await org.save({ ...org.settings, ...draft })
    setState(r.ok ? 'saved' : 'error'); if (!r.ok) setProblem(r.error ?? null)
  }
  async function upload(f: File | undefined) {
    if (!f || !org) return
    setLogoState('saving'); setLogoErr(null)
    const body = new FormData(); body.append('file', f)
    const r = await impactFetch('/api/impact/settings/logo', { method: 'POST', body })
    const j = await r.json().catch(() => ({})) as { error?: string; logo?: string; logoPath?: string }
    if (!r.ok || !j.logo) { setLogoState('error'); setLogoErr(j.error ?? 'The logo couldn’t be uploaded.'); return }
    const s = await org.save({ ...org.settings, logo: j.logo, logoDark: j.logo, logoPath: j.logoPath })
    setLogoState(s.ok ? 'saved' : 'error'); if (!s.ok) setLogoErr(s.error ?? null)
  }
  return (
    <Card>
      <SectionTitle sub="Your organisation’s own details, used across the portal, the parent app, sign-up page and emails">
        <Building2 size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Organisation
      </SectionTitle>
      {!editable && org.readOnlyReason && <div style={{ marginBottom: 10 }}><Note>{org.readOnlyReason}</Note></div>}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#F7F5F2', borderRadius: 12, padding: '12px 14px', marginBottom: 14, flexWrap: 'wrap' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo} alt={brand.logoAlt} style={{ height: 44, maxWidth: 180, objectFit: 'contain' }} />
        {editable && <label style={{ ...buttonSecondary, cursor: 'pointer' }}><Upload size={13} /> {logoState === 'saving' ? 'Uploading…' : 'Upload logo'}
          <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => { upload(e.target.files?.[0]); e.target.value = '' }} /></label>}
        <span style={{ fontSize: 11, color: '#8A847E' }}>PNG, JPEG or WebP, up to 2 MB.</span>
        <Saved state={logoState} error={logoErr} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {ORG_FIELDS.map(f => (
          <label key={f.key} style={{ display: 'grid', gap: 4 }}>
            <span style={formLabel}>{f.label}</span>
            <input type={f.type ?? 'text'} value={f.get(draft)} placeholder={f.placeholder} readOnly={!editable} maxLength={300}
              onChange={e => { setState('idle'); setDraft(d => f.set(d, e.target.value)) }} style={{ ...formField, background: editable ? '#fff' : '#F7F5F2' }} />
            {f.key === 'charityNumber' && <span style={{ fontSize: 10.5, color: '#8A847E' }}>{draft.charityNumber?.trim() ? `Shown in your newsletter footer as “Registered charity no. ${draft.charityNumber.trim()}”.` : 'Status: awaiting registration. Once you add it, it appears in your newsletter footer.'}</span>}
            {f.key === 'privacyUrl' && <span style={{ fontSize: 10.5, color: '#8A847E' }}>{privacyUrlOf(draft) ? 'Your sign-up page is open and links to it.' : 'Your sign-up page stays closed until this is set.'}</span>}
          </label>
        ))}
      </div>
      {editable && <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
        <button onClick={save} disabled={state === 'saving'} style={buttonPrimary}>{state === 'saving' ? 'Saving…' : 'Save details'}</button>
        <Saved state={state} error={problem} />
      </div>}
    </Card>
  )
}

// ── Venues & sessions ───────────────────────────────────────────────────────
interface VenueRow { id: string; name: string; session_day: string | null; session_time: string | null; capacity: number | null; session_minutes: number | null }
const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function VenueDefaults() {
  const { org, reload } = useImpact()
  const [rows, setRows] = useState<VenueRow[] | null>(null)
  const [state, setState] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})
  const [err, setErr] = useState('')
  useEffect(() => {
    let live = true
    ;(async () => {
      const db = sb(); const hq = await currentHq(db)
      const { data, error } = await db.from('tp_venues').select('id, name, session_day, session_time, capacity, session_minutes').eq('hq_id', hq).order('name')
      if (!live) return
      if (error) setErr('Your venues couldn’t be read.'); else setRows((data ?? []) as VenueRow[])
    })()
    return () => { live = false }
  }, [])
  if (!org) return null
  const edit = (id: string, patch: Partial<VenueRow>) => { setRows(r => (r ?? []).map(v => (v.id === id ? { ...v, ...patch } : v))); setState(s => ({ ...s, [id]: 'idle' })) }
  async function save(v: VenueRow) {
    setState(s => ({ ...s, [v.id]: 'saving' }))
    const mins = v.session_minutes == null || Number.isNaN(v.session_minutes) ? null : Math.round(v.session_minutes)
    if (mins !== null && (mins < 15 || mins > 480)) { setState(s => ({ ...s, [v.id]: 'error' })); setErr('A session is between 15 minutes and 8 hours.'); return }
    const cap = v.capacity == null || Number.isNaN(v.capacity) ? null : Math.round(v.capacity)
    if (cap !== null && cap < 1) { setState(s => ({ ...s, [v.id]: 'error' })); setErr('Capacity is at least 1, or leave it blank.'); return }
    setErr('')
    const db = sb(); const hq = await currentHq(db)
    const patch = { session_day: v.session_day || null, session_time: (v.session_time ?? '').trim().slice(0, 40) || null, capacity: cap, session_minutes: mins }
    const { data: done, error } = await db.from('tp_venues').update(patch).eq('id', v.id).eq('hq_id', hq).select('id')
    if (error || !done?.length) { setState(s => ({ ...s, [v.id]: 'error' })); setErr('That venue couldn’t be saved.'); return }
    await logAppChange(db, hq, 'venues', { venue: v.id, ...patch })
    setState(s => ({ ...s, [v.id]: 'saved' })); reload?.()
  }
  return (
    <Card>
      <SectionTitle sub="The usual weekend session at each venue. Add or rename venues on the Venues page.">
        <MapPin size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Venue defaults
      </SectionTitle>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginBottom: 8 }}>{err}</div>}
      {rows && !rows.length && <EmptyState compact icon={MapPin} title="No venues yet" sub="Add one on the Venues page." />}
      <div style={{ display: 'grid', gap: 8 }}>
        {(rows ?? []).map(v => (
          <div key={v.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px,1.3fr) 1fr 1fr 0.7fr 0.8fr auto', gap: 8, alignItems: 'end', borderBottom: '1px solid #F0EBE5', paddingBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK, paddingBottom: 8 }}>{v.name}</div>
            <label><span style={formLabel}>Day</span><select value={v.session_day ?? ''} disabled={!org.canEdit} onChange={e => edit(v.id, { session_day: e.target.value })} style={formField}>{DAYS.map(d => <option key={d} value={d}>{d || '—'}</option>)}</select></label>
            <label><span style={formLabel}>Time</span><input value={v.session_time ?? ''} placeholder="e.g. 10–11am" readOnly={!org.canEdit} maxLength={40} onChange={e => edit(v.id, { session_time: e.target.value })} style={formField} /></label>
            <label><span style={formLabel}>Capacity</span><input type="number" min={1} value={v.capacity ?? ''} readOnly={!org.canEdit} onChange={e => edit(v.id, { capacity: e.target.value === '' ? null : Number(e.target.value) })} style={formField} /></label>
            <label><span style={formLabel}>Minutes</span><input type="number" min={15} max={480} step={5} value={v.session_minutes ?? ''} placeholder="60" readOnly={!org.canEdit} onChange={e => edit(v.id, { session_minutes: e.target.value === '' ? null : Number(e.target.value) })} style={formField} /></label>
            <div style={{ display: 'grid', gap: 3, justifyItems: 'end' }}>
              {org.canEdit && <button onClick={() => save(v)} disabled={state[v.id] === 'saving'} style={{ ...buttonSecondary, padding: '7px 11px' }}>{state[v.id] === 'saving' ? 'Saving…' : 'Save'}</button>}
              <Saved state={state[v.id] ?? 'idle'} error=" " />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#8A847E', marginTop: 8 }}>Capacity sets when new sign-ups for that venue go on its waiting list.</div>
    </Card>
  )
}

function TermDates() {
  const { org } = useImpact()
  const [terms, setTerms] = useState(() => (org?.settings.termDates ?? []).map(t => ({ ...t })))
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  if (!org) return null
  const edit = (i: number, patch: Partial<{ name: string; start: string; end: string }>) => { setState('idle'); setTerms(t => t.map((x, j) => (j === i ? { ...x, ...patch } : x))) }
  async function save() {
    if (!org) return
    const p = termDatesProblem(terms)
    if (p) { setProblem(p); setState('error'); return }
    setProblem(null); setState('saving')
    const sorted = [...terms].sort((a, b) => a.start.localeCompare(b.start))
    const r = await org.save({ ...org.settings, termDates: sorted })
    setState(r.ok ? 'saved' : 'error'); if (!r.ok) setProblem(r.error ?? null); else setTerms(sorted)
  }
  const shown = orgTerms(terms)
  return (
    <Card>
      <SectionTitle sub="Your own term dates. “This term” on Overview, Community, Insights, audiences and funder documents follows them; a holiday counts with the term just finished.">
        <MapPin size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Term dates
      </SectionTitle>
      {!terms.length && <div style={{ marginBottom: 10 }}><Note>No term dates yet, so terms run Autumn 1 Sept–31 Dec, Spring 1 Jan–31 Mar and Summer 1 Apr–31 Aug.</Note></div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {terms.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <label><span style={formLabel}>Term</span><select value={t.name} disabled={!org.canEdit} onChange={e => edit(i, { name: e.target.value })} style={formField}>{['Autumn', 'Spring', 'Summer'].map(n => <option key={n}>{n}</option>)}</select></label>
            <label><span style={formLabel}>Starts</span><input type="date" value={t.start} readOnly={!org.canEdit} onChange={e => edit(i, { start: e.target.value })} style={formField} /></label>
            <label><span style={formLabel}>Ends</span><input type="date" value={t.end} readOnly={!org.canEdit} onChange={e => edit(i, { end: e.target.value })} style={formField} /></label>
            {org.canEdit && <button onClick={() => { setState('idle'); setTerms(x => x.filter((_, j) => j !== i)) }} aria-label="Remove this term" style={{ ...buttonSecondary, padding: '7px 9px' }}><Trash2 size={13} /></button>}
          </div>
        ))}
      </div>
      {org.canEdit && <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={() => { setState('idle'); setTerms(t => [...t, { name: 'Autumn', start: '', end: '' }]) }} style={buttonSecondary} disabled={terms.length >= 30}>Add a term</button>
        <button onClick={save} disabled={state === 'saving'} style={buttonPrimary}>{state === 'saving' ? 'Saving…' : 'Save term dates'}</button>
        <Saved state={state} error={problem} />
      </div>}
      {shown.length > 0 && state !== 'error' && <div style={{ fontSize: 11, color: '#8A847E', marginTop: 8 }}>Counted as: {shown.map(t => `${t.name} ${t.start} → ${t.end}`).join(' · ')}</div>}
    </Card>
  )
}

// ── Data ────────────────────────────────────────────────────────────────────
interface ExportLine { id: string; status: string; created_at: string; expires_at: string; bytes: number | null; requested_by: string | null }
const when = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

function ExportCard() {
  const { org } = useImpact()
  const [rows, setRows] = useState<ExportLine[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; link?: string } | null>(null)
  const [n, setN] = useState(0)
  const load = () => setN(x => x + 1)
  useEffect(() => {
    let live = true
    ;(async () => {
      const db = sb(); const hq = await currentHq(db)
      const { data } = await db.from('impact_exports').select('id, status, created_at, expires_at, bytes, requested_by').eq('hq_id', hq).order('created_at', { ascending: false }).limit(10)
      if (live) setRows((data ?? []) as ExportLine[])
    })()
    return () => { live = false }
  }, [n])
  if (!org) return null
  async function go() {
    setBusy(true); setMsg(null)
    const r = await impactFetch('/api/impact/settings/export', { method: 'POST' })
    const j = await r.json().catch(() => ({})) as { error?: string; sentTo?: string; link?: string }
    setBusy(false)
    setMsg(r.ok ? { ok: true, text: j.link ? 'Made (locally: nothing emailed).' : `Done. We’ve emailed the link to ${j.sentTo}, your sign-in address.`, link: j.link } : { ok: false, text: j.error ?? 'The export couldn’t be made.' })
    load()
  }
  const STATUS: Record<string, string> = { building: 'Being made', ready: 'Ready', failed: 'Failed', expired: 'Expired, file deleted' }
  return (
    <Card>
      <SectionTitle sub="Everything your organisation holds in Lumio Impact, as one ZIP with a spreadsheet (CSV) for each table">
        <Download size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Export everything
      </SectionTitle>
      <Note>The link is emailed to your own sign-in address and only works for you, signed in, for {EXPORT_DAYS} days. Then the file is deleted. It holds personal information about families and children, so store it securely.</Note>
      {org.canEdit && <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={go} disabled={busy} style={buttonPrimary}><Download size={13} /> {busy ? 'Making your export…' : 'Export everything'}</button>
        {msg && <span role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 12, fontWeight: 700, color: msg.ok ? '#187A3C' : TP_RED }}>{msg.text}{msg.link && <> <a href={msg.link}>Download</a></>}</span>}
      </div>}
      {rows.length > 0 && <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
        {rows.map(r => <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#6B6560', borderTop: '1px solid #F0EBE5', paddingTop: 5 }}>
          <span>{when(r.created_at)}{r.bytes ? ` · ${Math.max(1, Math.round(r.bytes / 1024))} KB` : ''}</span>
          <span>{STATUS[r.status] ?? r.status}{r.status === 'ready' ? ` until ${when(r.expires_at)}` : ''}</span>
        </div>)}
      </div>}
    </Card>
  )
}

function EraseCard() {
  const { org, reload } = useImpact()
  const [q, setQ] = useState('')
  const [families, setFamilies] = useState<{ id: string; guardian_name: string; email: string | null }[]>([])
  const [pick, setPick] = useState<string | null>(null)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => {
    if (q.trim().length < 2) return
    const t = setTimeout(async () => {
      const db = sb(); const hq = await currentHq(db)
      const like = `%${q.trim().replace(/[%_\\,()]/g, '')}%`
      const { data } = await db.from('tp_families').select('id, guardian_name, email').eq('hq_id', hq).is('erased_at', null).or(`guardian_name.ilike.${like},email.ilike.${like}`).order('guardian_name').limit(8)
      setFamilies((data ?? []) as typeof families)
    }, 250)
    return () => clearTimeout(t)
  }, [q])
  const found = q.trim().length < 2 ? [] : families
  if (!org?.canEdit) return null
  const chosen = found.find(f => f.id === pick)
  async function go() {
    if (!pick) return
    setBusy(true); setMsg(null)
    const r = await impactFetch('/api/impact/settings/erase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ familyId: pick, confirm }) })
    const j = await r.json().catch(() => ({})) as { error?: string; children?: number; messages?: number; loginsDeleted?: number; alreadyErased?: boolean }
    setBusy(false)
    if (!r.ok) { setMsg({ ok: false, text: j.error ?? 'The family couldn’t be erased.' }); return }
    setMsg({ ok: true, text: j.alreadyErased ? 'That family was already erased.' : `Erased. ${j.children ?? 0} child record${j.children === 1 ? '' : 's'} anonymised, ${j.messages ?? 0} message${j.messages === 1 ? '' : 's'} deleted${j.loginsDeleted ? `, ${j.loginsDeleted} login deleted` : ''}.` })
    setPick(null); setConfirm(''); setQ(''); reload?.()
  }
  return (
    <Card>
      <SectionTitle sub="When a family asks for their data to be erased (GDPR). This can’t be undone.">
        <Trash2 size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Erase a family
      </SectionTitle>
      <Note>Removes their names, contact details, notes, medical and SEN(D) information, messages and logins. Year group, school, programme, attendance, fees and stickers stay, without names, so your totals and accounts still add up. The change history records who did it and when.</Note>
      <label style={{ display: 'block', marginTop: 12 }}><span style={formLabel}>Find the family</span><input value={q} onChange={e => { setQ(e.target.value); setPick(null) }} placeholder="Name or email" style={formField} /></label>
      {found.length > 0 && !pick && <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>{found.map(f => <button key={f.id} onClick={() => setPick(f.id)} style={{ ...buttonSecondary, justifyContent: 'flex-start' }}>{f.guardian_name}{f.email ? ` · ${f.email}` : ''}</button>)}</div>}
      {chosen && <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12.5, color: TP_DARK }}>Erase <strong>{chosen.guardian_name}</strong> and their children? Type <strong>ERASE</strong> to confirm.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} style={{ ...formField, maxWidth: 140 }} aria-label="Type ERASE to confirm" />
          <button onClick={go} disabled={busy || confirm !== 'ERASE'} style={{ ...buttonPrimary, opacity: confirm === 'ERASE' ? 1 : 0.5 }}>{busy ? 'Erasing…' : 'Erase this family'}</button>
          <button onClick={() => { setPick(null); setConfirm('') }} style={buttonSecondary}>Cancel</button>
        </div>
      </div>}
      {msg && <div role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: msg.ok ? '#187A3C' : TP_RED }}>{msg.text}</div>}
    </Card>
  )
}

function DataSection() {
  const { status } = useSettingsStatus()
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <ImportCard />
      <ImportHistoryCard />
      <ExportCard />
      {status?.erase && <EraseCard />}
      <Card>
        <SectionTitle><Database size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Keeping data</SectionTitle>
        <Note>Your records stay until you change or erase them; nothing is deleted on a timer. Your organisation is the controller of this data and Lumio is the processor. Export everything to keep your own copy, and erase a family when they ask.</Note>
      </Card>
    </div>
  )
}

// ── Integrations ────────────────────────────────────────────────────────────
function IntegrationLine({ name, state, children }: { name: string; state?: keyof typeof STATE_PILL; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #F0EBE5', padding: '11px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: TP_DARK }}>{name}</span>
        {state ? <Pill tone={STATE_PILL[state].tone}>{STATE_PILL[state].text}</Pill> : <span style={{ fontSize: 11, color: '#8A847E' }}>Checking…</span>}
      </div>
      <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 4, lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

function IntegrationsSection() {
  const { status, error } = useSettingsStatus()
  const { org } = useImpact()
  const [hook, setHook] = useState<{ url: string | null; lastUsedAt: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { impactFetch('/api/impact/leads/hook').then(async r => { if (r.ok) setHook(await r.json()) }).catch(() => {}) }, [])
  async function make(rotate: boolean) {
    setBusy(true); setMsg('')
    const r = await impactFetch('/api/impact/leads/hook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotate }) })
    setBusy(false)
    if (r.ok) { setHook(await r.json()); setMsg(rotate ? 'New address made. The old one has stopped working: update Zapier or Make.' : 'Address made.') } else setMsg('That didn’t work. Please try again.')
  }
  return (
    <Card>
      <SectionTitle sub="The services your portal really uses, and whether each one is working"><Plug size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Integrations</SectionTitle>
      {error && <div role="alert" style={{ fontSize: 12, color: TP_RED }}>{error}</div>}
      <IntegrationLine name="Email (Resend)" state={status?.email.state}>{status ? <>{status.email.sender ? `Sending as ${status.email.sender}. ` : ''}{status.email.detail}</> : null}</IntegrationLine>
      <IntegrationLine name="Meta lead ads (via Zapier or Make)" state={status?.meta.state}>
        {status?.meta.detail}{hook?.lastUsedAt ? ` Last lead ${when(hook.lastUsedAt)}.` : ''}
        {hook?.url && <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, background: '#F7F5F2', borderRadius: 7, padding: '6px 8px', marginTop: 6, overflowWrap: 'anywhere' }}>{hook.url}</div>}
        {org?.canEdit && <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {hook && !hook.url && <button onClick={() => make(false)} disabled={busy} style={buttonSecondary}>Make my leads address</button>}
          {hook?.url && <button onClick={() => make(true)} disabled={busy} style={buttonSecondary}><RefreshCw size={12} /> Replace the address</button>}
          {msg && <span role="status" style={{ fontSize: 11.5, fontWeight: 700, color: TP_DARK }}>{msg}</span>}
        </div>}
      </IntegrationLine>
      <IntegrationLine name="Texts (Twilio)" state={status?.sms.state}>{status?.sms.detail}{status?.sms.available ? ' Switch texts on or off in Messaging.' : ''}</IntegrationLine>
    </Card>
  )
}

// ── AI ──────────────────────────────────────────────────────────────────────
const AI_USES: { id: string; label: string; desc: string }[] = [
  { id: 'newsletter', label: 'Newsletter drafts', desc: 'Writing and rewriting newsletter sections in Communications' },
  { id: 'message', label: 'Message drafts', desc: 'Drafting a message or a reply to a family' },
  { id: 'social', label: 'Social captions', desc: 'Captions and post ideas in Social' },
  { id: 'import', label: 'Reading imported files', desc: 'Turning a spreadsheet or document into records in Import data. The import template works without it' },
]
const pounds = (p: number) => `£${(p / 100).toFixed(2)}`

function AiSection() {
  const { org } = useImpact()
  const [usage, setUsage] = useState<{ spentPence: number; capPence: number } | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  useEffect(() => { impactFetch('/api/ai/impact').then(async r => { if (r.ok) setUsage(await r.json()) }).catch(() => {}) }, [])
  if (!org) return null
  async function flip(id: string, on: boolean) {
    if (!org) return
    setState('saving')
    const off = { ...(org.settings.ai?.off ?? {}) }
    if (on) delete off[id]; else off[id] = true
    const r = await org.save({ ...org.settings, ai: { ...(org.settings.ai ?? {}), off } })
    setState(r.ok ? 'saved' : 'error')
  }
  const pct = usage ? Math.min(100, Math.round((usage.spentPence / Math.max(1, usage.capPence)) * 100)) : 0
  return (
    <Card>
      <SectionTitle sub="What the AI does for you, today’s allowance, and a switch for each use"><Sparkles size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />AI</SectionTitle>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ color: '#8A847E', fontWeight: 700 }}>Used today</span>
        <span style={{ fontWeight: 800, color: TP_DARK }}>{usage ? `${pounds(usage.spentPence)} of ${pounds(usage.capPence)}` : '…'}</span>
      </div>
      <div style={{ height: 8, background: '#F0EBE5', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? TP_RED : TP_DARK }} /></div>
      <div style={{ fontSize: 11, color: '#8A847E', margin: '4px 0 12px' }}>Every use below shares this daily allowance. It resets at midnight; when it’s used up, AI pauses and everything else carries on. The AI only drafts: nothing is sent without you.</div>
      {AI_USES.map(u => {
        const on = aiFeatureOn(org.settings, u.id)
        return (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #F0EBE5' }}>
            <div><div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{u.label}</div><div style={{ fontSize: 11, color: '#8A847E', marginTop: 2 }}>{u.desc}</div></div>
            <Switch on={on} disabled={!org.canEdit || state === 'saving'} label={`${on ? 'Switch off' : 'Switch on'} ${u.label}`} onChange={() => flip(u.id, !on)} />
          </div>
        )
      })}
      <Saved state={state} />
    </Card>
  )
}

function Switch({ on, onChange, disabled, label }: { on: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button onClick={onChange} disabled={disabled} aria-pressed={on} aria-label={label} style={{ width: 42, height: 24, borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer', background: on ? TP_RED : '#D9D3CC', position: 'relative', flexShrink: 0, opacity: disabled ? 0.6 : 1 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </button>
  )
}

// ── Appearance (this device) ────────────────────────────────────────────────
function SwitchRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0EBE5' }}>
      <div><div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{label}</div><div style={{ fontSize: 11, color: '#8A847E', marginTop: 2 }}>{desc}</div></div>
      <Switch on={on} onChange={onChange} label={label} />
    </div>
  )
}

function AppearanceSection() {
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && localStorage.getItem('tp_dark') === '1')
  const [pinned, setPinned] = useState(() => typeof window === 'undefined' || localStorage.getItem('tp_sidebar_pin') !== '0')
  const flipDark = () => { const n = !dark; setDark(n); if (n) localStorage.setItem('tp_dark', '1'); else localStorage.removeItem('tp_dark'); window.dispatchEvent(new Event('tp-theme')) }
  const flipPin = () => { const n = !pinned; setPinned(n); localStorage.setItem('tp_sidebar_pin', n ? '1' : '0'); window.dispatchEvent(new Event('tp-sidebar-pin')) }
  return (
    <Card>
      <SectionTitle sub="Just for you, on this device"><Moon size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Appearance</SectionTitle>
      <SwitchRow label="Dark mode" desc="Darkens the portal; logos, photos and documents keep their colours" on={dark} onChange={flipDark} />
      <SwitchRow label="Keep the sidebar open" desc="Off: the sidebar folds into a rail that opens when you point at it" on={pinned} onChange={flipPin} />
    </Card>
  )
}

// ── Change history ──────────────────────────────────────────────────────────
interface LogRow { id: string; actor_id: string | null; section: string; source: string; diff: Record<string, unknown>; at: string }
const SECTION_LABEL: Record<string, string> = { organisation: 'Organisation', people: 'People & access', modules: 'Modules', messaging: 'Messaging', booklet: 'Welcome pack & booklet', venues: 'Venues & sessions', data: 'Data', integrations: 'Integrations', ai: 'AI', other: 'Other settings' }

const KEY_LABEL: Record<string, string> = {
  org: 'name', legal: 'legal name', tagline: 'tagline', domain: 'website', email: 'contact email', phone: 'phone', address: 'address', town: 'town',
  volunteer: 'volunteer name', volunteers: 'volunteer name', charityNumber: 'charity number', privacyUrl: 'privacy policy link', safeguarding: 'safeguarding lead',
  logo: 'logo', logoDark: 'logo', logoPath: 'logo', modules: 'modules', messaging: 'messaging', termDates: 'term dates', ai: 'AI switches',
}
const keysLine = (keys: string[]) => `Changed ${[...new Set(keys.map(k => KEY_LABEL[k] ?? k))].join(', ')}`

function describe(r: LogRow): string {
  const d = r.diff ?? {}
  if (d.truncated) return keysLine((d.keys as string[] | undefined) ?? ['settings'])
  if (r.section === 'data') {
    if (d.export) return `Exported everything (${d.rows ?? 0} rows)`
    if (d.erasedFamily && 'loginsDeleted' in d) return `Deleted ${d.loginsDeleted} parent login${d.loginsDeleted === 1 ? '' : 's'} after an erase`
    if (d.erasedFamily) return `Erased a family (${d.children ?? 0} children, ${d.messages ?? 0} messages)`
  }
  if (r.section === 'people') return String(d.action ?? 'Changed access').replace(/^./, c => c.toUpperCase())
  if (r.section === 'venues' && d.venue) return 'Changed a venue’s usual session'
  if (r.section === 'booklet') return d.packItem ? `Saved the pack item “${String(d.name ?? '')}”` : 'Saved the booklet'
  if (r.source === 'auto') {
    if (d.modules && typeof d.modules === 'object') {
      const m = d.modules as { from?: Record<string, boolean> | null; to?: Record<string, boolean> | null }
      const ids = [...new Set([...Object.keys(m.from ?? {}), ...Object.keys(m.to ?? {})])].filter(k => (m.from ?? {})[k] !== (m.to ?? {})[k])
      if (ids.length) return ids.map(k => `${(m.to ?? {})[k] === false ? 'Switched off' : 'Switched on'} ${k.replace(/_/g, ' ')}`).join(', ')
    }
    if (d.ai && typeof d.ai === 'object') {
      const off = ((d.ai as { to?: { off?: Record<string, boolean> } }).to?.off) ?? {}
      const names = Object.keys(off).filter(k => off[k])
      return names.length ? `AI switched off for: ${names.join(', ')}` : 'AI switched on for everything'
    }
    return keysLine(Object.keys(d))
  }
  return 'Saved'
}

function HistorySection() {
  const [rows, setRows] = useState<LogRow[] | null>(null)
  const [me, setMe] = useState<string | null>(null)
  useEffect(() => {
    (async () => {
      const db = sb(); const hq = await currentHq(db)
      const { data: { user } } = await db.auth.getUser(); setMe(user?.id ?? null)
      const { data } = await db.from('impact_settings_log').select('id, actor_id, section, source, diff, at').eq('hq_id', hq).order('at', { ascending: false }).limit(60)
      setRows((data ?? []) as LogRow[])
    })()
  }, [])
  return (
    <Card>
      <SectionTitle sub="Who changed what in Settings, and when (newest first)"><History size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Change history</SectionTitle>
      {rows && !rows.length && <EmptyState compact icon={History} title="No changes yet" sub="Saves in Settings appear here." />}
      <div style={{ display: 'grid' }}>
        {(rows ?? []).map(r => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '110px 150px 1fr 90px', gap: 10, fontSize: 11.5, padding: '7px 0', borderTop: '1px solid #F0EBE5', color: '#6B6560' }}>
            <span>{when(r.at)}</span>
            <span style={{ fontWeight: 800, color: TP_DARK }}>{SECTION_LABEL[r.section] ?? r.section}</span>
            <span style={{ overflowWrap: 'anywhere' }}>{describe(r)}</span>
            <span style={{ textAlign: 'right' }}>{r.actor_id == null ? 'Lumio' : r.actor_id === me ? 'You' : 'A colleague'}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Help ────────────────────────────────────────────────────────────────────
function HelpSection() {
  const { brand, org } = useImpact()
  const subject = encodeURIComponent(`Lumio Impact help: ${brand.org}`)
  return (
    <Card>
      <SectionTitle sub="Stuck, or something looks wrong?"><LifeBuoy size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Help</SectionTitle>
      <Note>Email Lumio support and we’ll get back to you, usually the same working day. Say which page you were on and what you expected to happen; please don’t include children’s details.</Note>
      <a href={`mailto:support@lumiosports.com?subject=${subject}`} style={{ ...buttonPrimary, marginTop: 12, textDecoration: 'none' }}><LifeBuoy size={13} /> Email Lumio support</a>
      {org && <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10 }}>Your portal: /impact/{org.slug}</div>}
    </Card>
  )
}

// ── The panel ───────────────────────────────────────────────────────────────
export default function LiveSettings() {
  const [open, setOpen] = useState<SectionId>(() => {
    try { const s = sessionStorage.getItem('tp_open_settings'); if (s && SECTIONS.some(x => x.id === s)) return s as SectionId } catch { /* ignore */ }
    return 'organisation'
  })
  useEffect(() => { try { sessionStorage.setItem('tp_open_settings', open) } catch { /* ignore */ } }, [open])
  const body = useMemo(() => {
    switch (open) {
      case 'organisation': return <OrganisationSection />
      case 'people': return <MembersCard />
      case 'modules': return <ModulesCard />
      case 'messaging': return <MessagingSettings />
      case 'booklet': return <WelcomePackSettings />
      case 'venues': return <div style={{ display: 'grid', gap: 16 }}><VenueDefaults /><TermDates /></div>
      case 'data': return <DataSection />
      case 'integrations': return <IntegrationsSection />
      case 'ai': return <AiSection />
      case 'appearance': return <AppearanceSection />
      case 'history': return <HistorySection />
      case 'help': return <HelpSection />
    }
  }, [open])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, 210px) 1fr', gap: 18, alignItems: 'start' }}>
      <nav aria-label="Settings sections" style={{ position: 'sticky', top: 12, background: '#fff', border: '1px solid #E7E2DC', borderRadius: 14, padding: 6, display: 'grid', gap: 2 }}>
        {SECTIONS.map(s => {
          const Icon = s.icon, on = s.id === open
          return (
            <button key={s.id} onClick={() => setOpen(s.id)} aria-current={on ? 'page' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', border: 'none', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: on ? 900 : 700, background: on ? '#F7F0EF' : 'transparent', color: on ? TP_RED : TP_DARK }}>
              <Icon size={14} /> {s.label}
            </button>
          )
        })}
      </nav>
      <div style={{ minWidth: 0 }}>{body}</div>
    </div>
  )
}
