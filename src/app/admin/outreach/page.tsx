'use client'

// Admin → Outreach. Lumio's own business-to-business email: a contact list,
// campaigns per audience, and a slow drip from our own mailbox.
//
// The page is a thin view over /api/admin/outreach — every rule about who may
// be emailed is enforced on the server (src/lib/outreach/core.ts), so nothing
// here can send to a contact the server would hold back.

import { useCallback, useEffect, useRef, useState } from 'react'
import { readWorkbook, SPREADSHEET_RE, type SheetData } from '@/lib/coach/read-workbook'
import FindContacts from './FindContacts'

type Segment = 'academy' | 'venue' | 'coach'
type Contact = {
  id: string; email: string; org_name: string | null; contact_name: string | null; segment: Segment
  legal_form: string | null; corporate_ok: boolean; basis: 'b2b' | 'opt_in'; status: 'active' | 'replied' | 'unsubscribed' | 'bounced'
}
type Campaign = {
  id: string; name: string; segment: Segment; subject: string; body: string; status: 'draft' | 'active' | 'paused'; sent: number; failed: number; waiting: number; held: number
  style: 'plain' | 'designed'; headline: string | null; image_url: string | null; button_text: string | null; button_url: string | null
}
type Send = { id: string; campaign_id: string; email: string; status: string; error: string | null; sent_at: string | null; created_at: string }
type Data = {
  mailbox: { ready: boolean; from: string; host: string }
  linkBase: string
  settings: { company_line: string; daily_limit: number; paused: boolean; warmup: boolean }
  todaysLimit: number; maxDaily: number
  sentToday: number; contacts: Contact[]; campaigns: Campaign[]; recent: Send[]
}

const C = { card: '#111318', line: '#1F2937', text: '#F9FAFB', sub: '#9CA3AF', dim: '#6B7280', accent: '#F5A623', good: '#34D399', bad: '#F87171', warn: '#FBBF24' }
const SEG: Record<Segment, string> = { academy: 'Tennis academies', venue: 'Venues that manage coaches', coach: 'Individual coaches' }

// First drafts, one per audience. They are starting points to edit, not copy to
// send as-is. {{org}} and {{first_name|there}} are filled in per contact.
const STARTER: Record<Segment, { name: string; subject: string; body: string }> = {
  academy: {
    name: 'Academies — introduction',
    subject: 'Lesson write-ups and player progress for {{org}}',
    body: `Hi {{first_name|there}},

I run Lumio Tennis Coach, a platform built for tennis academies with more than one coach. I am getting in touch because {{org}} looks like exactly who it was made for.

In short: each coach records a lesson on their phone and it writes the summary for the parent; every player has a racket-colour pathway with tracked criteria; and the head coach sees the whole academy — players, sessions, camps and payments — in one place.

We are taking on a small group of founding academies who get everything free while we build it around how they work.

Would a 15-minute look be useful? There is a live demo here if you would rather see it first: https://lumiosports.com/tennis-coach

Best wishes,
Arron Margeison
Lumio`,
  },
  venue: {
    name: 'Venues — introduction',
    subject: 'One place to see the coaching at {{org}}',
    body: `Hi {{first_name|there}},

I run Lumio Tennis Coach. I am writing to {{org}} because you have coaches working across your courts, and that is the situation it was built for.

It gives the venue one view of the coaching programme — who is coaching whom, on which court, what was covered and what parents were told — while each coach keeps their own players and diary. It sits alongside your court booking system; it does not replace it.

We are working with a small number of founding venues who get it free while we shape it with them.

If it is of interest, the demo is here: https://lumiosports.com/tennis-coach — or reply and I will show you round in 15 minutes.

Best wishes,
Arron Margeison
Lumio`,
  },
  coach: {
    name: 'Coaches — people who asked to hear from us',
    subject: 'Your Lumio Tennis Coach demo',
    body: `Hi {{first_name|there}},

Thanks for trying the Lumio Tennis Coach demo. I wanted to say hello personally and ask what you made of it.

If you would like your own account, founding coaches get everything free: https://lumiosports.com/tennis-coach

And if something was missing or confusing, just reply — I read every one.

Best wishes,
Arron Margeison
Lumio`,
  },
}

const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : '')
async function api(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/api/admin/outreach', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
    body: JSON.stringify({ action, ...payload }),
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error || 'Something went wrong.')
  return d
}

const btn = (kind: 'primary' | 'ghost' | 'danger' = 'ghost'): React.CSSProperties => ({
  appearance: 'none', cursor: 'pointer', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600,
  border: `1px solid ${kind === 'primary' ? C.accent : kind === 'danger' ? C.bad : C.line}`,
  background: kind === 'primary' ? C.accent : 'transparent',
  color: kind === 'primary' ? '#111318' : kind === 'danger' ? C.bad : C.sub,
})
const input: React.CSSProperties = { width: '100%', background: '#0A0B10', border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 13, outline: 'none' }
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) =>
  <div className="rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, padding: 16, ...style }}>{children}</div>
const Pill = ({ children, color }: { children: React.ReactNode; color: string }) =>
  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color, background: `${color}22`, whiteSpace: 'nowrap' }}>{children}</span>

// ── Import ───────────────────────────────────────────────────────────────────
const COLS: [string, RegExp][] = [
  ['email', /public e-?mail|e-?mail/i], ['org', /organi[sz]ation|club|company|business|^name$/i],
  ['contact', /decision|contact (person|name)|^contact$|first name|full name/i], ['role', /^role|job title/i],
  ['segment', /segment/i], ['legal_form', /legal form|entity/i], ['pecr', /pecr|cold email/i],
  ['website', /^website|^url/i], ['source', /^source$/i], ['notes', /research notes|^notes/i],
]
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
function rowsFrom(sheets: SheetData[]) {
  // The tab with the most real addresses under an "Email" heading wins — a notes
  // tab that merely mentions email in a sentence must not be mistaken for the list.
  let best: { sheet: string; rows: Record<string, string>[]; columns: string[] } | null = null
  for (const s of sheets) {
    const short = (c: string) => c.length <= 40
    const h = s.rows.findIndex((r, i) => i < 15 && r.some(c => short(c) && /e-?mail/i.test(c)))
    if (h === -1) continue
    const head = s.rows[h]
    const idx: Record<string, number> = {}
    for (const [key, re] of COLS) { if (key === 'email') continue; const i = head.findIndex(c => short(c) && re.test(c)); if (i !== -1 && idx[key] === undefined) idx[key] = i }
    // Several headings can contain the word ("Cold email allowed?", "Date
    // emailed"); the email column is the one that actually holds addresses.
    const body = s.rows.slice(h + 1)
    const emailCols = head.map((c, i) => (short(c) && /e-?mail/i.test(c) ? i : -1)).filter(i => i !== -1)
      .map(i => ({ i, n: body.filter(r => EMAIL_RE.test(r[i] || '')).length })).sort((x, y) => y.n - x.n)
    if (!emailCols.length || !emailCols[0].n) continue
    idx.email = emailCols[0].i
    if (idx.pecr === idx.email) delete idx.pecr
    const rows = s.rows.slice(h + 1).map(r => Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, r[i] || '']))).filter(r => EMAIL_RE.test(String(r.email)))
    if (rows.length && (!best || rows.length > best.rows.length)) best = { sheet: s.name, rows, columns: Object.keys(idx) }
  }
  return best
}

function ImportBox({ onDone, total }: { onDone: () => void; total: number }) {
  const [found, setFound] = useState<{ sheet: string; rows: Record<string, string>[]; columns: string[] } | null>(null)
  const [segment, setSegment] = useState<Segment>('academy')
  const [optIn, setOptIn] = useState(false)
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const pick = async (f: File | undefined) => {
    setMsg(''); setFound(null)
    if (!f) return
    if (!SPREADSHEET_RE.test(f.name)) { setMsg('Choose a spreadsheet (.xlsx or .csv).'); return }
    try {
      const got = rowsFrom(await readWorkbook(f))
      if (!got) setMsg('Could not find a tab with an email column in that file.')
      else setFound(got)
    } catch { setMsg('Could not read that file.') }
  }
  const run = async () => {
    if (!found || busy) return
    setBusy(true)
    try {
      const d = await api('import', { rows: found.rows, segment, basis: optIn ? 'opt_in' : 'b2b', source: `Import ${new Date().toISOString().slice(0, 10)}` })
      setMsg(`Added ${d.added}. ${d.held ? `${d.held} held back until you confirm they are a company or organisation. ` : ''}${d.dupes ? `${d.dupes} already on the list. ` : ''}${d.suppressed ? `${d.suppressed} skipped — they unsubscribed. ` : ''}`)
      setFound(null); if (file.current) file.current.value = ''
      onDone()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Import failed.') }
    setBusy(false)
  }
  const wipe = async () => {
    if (busy || !total) return
    if (!confirm(`Delete all ${total} contacts and start again?\n\nAnyone already emailed is kept, so they cannot be emailed twice. Unsubscribes are kept. This cannot be undone.`)) return
    setBusy(true); setMsg('')
    try {
      const d = await api('wipeContacts')
      setMsg(`Deleted ${d.removed} contact${d.removed === 1 ? '' : 's'}.${d.kept ? ` Kept ${d.kept} already emailed.` : ''} You can import again.`)
      setFound(null); if (file.current) file.current.value = ''
      onDone()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not delete the contacts.') }
    setBusy(false)
  }
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold mb-1">Import contacts</div>
        {total > 0 && <button onClick={() => { void wipe() }} disabled={busy} style={{ ...btn('danger'), padding: '5px 10px' }}>Delete all contacts…</button>}
      </div>
      <div className="text-xs mb-3" style={{ color: C.dim }}>A spreadsheet with an email column — the target list works as it is. Organisation, contact, segment and legal form are picked up when present.</div>
      <input ref={file} type="file" accept=".xlsx,.xls,.csv" onChange={e => { void pick(e.target.files?.[0]) }} className="text-xs" style={{ color: C.sub }} />
      {found && (
        <div className="mt-3 space-y-3">
          <div className="text-xs" style={{ color: C.sub }}>Found <b style={{ color: C.text }}>{found.rows.length}</b> rows with an email in “{found.sheet}” ({found.columns.join(', ')}).</div>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: C.sub }}>
            <label>Audience when the sheet does not say:{' '}
              <select value={segment} onChange={e => setSegment(e.target.value as Segment)} style={{ ...input, width: 'auto', display: 'inline-block', padding: '5px 8px' }}>
                {(Object.keys(SEG) as Segment[]).map(s => <option key={s} value={s}>{SEG[s]}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)} /> These people asked to hear from Lumio (opted in)</label>
          </div>
          <button onClick={() => { void run() }} disabled={busy} style={btn('primary')}>{busy ? 'Importing…' : `Import ${found.rows.length}`}</button>
        </div>
      )}
      {!!msg && <div className="text-xs mt-3" style={{ color: C.sub }}>{msg}</div>}
    </Card>
  )
}

// ── Campaign editor ──────────────────────────────────────────────────────────
function Editor({ camp, onClose, onSaved }: { camp: Partial<Campaign> & { segment: Segment }; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(camp.name || '')
  const [segment, setSegment] = useState<Segment>(camp.segment)
  const [subject, setSubject] = useState(camp.subject || '')
  const [body, setBody] = useState(camp.body || '')
  const [style, setStyle] = useState<'plain' | 'designed'>(camp.style || 'plain')
  const [headline, setHeadline] = useState(camp.headline || '')
  const [imageUrl, setImageUrl] = useState(camp.image_url || '')
  const [buttonText, setButtonText] = useState(camp.button_text || '')
  const [buttonUrl, setButtonUrl] = useState(camp.button_url || '')
  const [preview, setPreview] = useState<{ subject: string; html: string; as: string } | null>(null)
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState('')
  const content = { subject, body, style, headline, image_url: imageUrl, button_text: buttonText, button_url: buttonUrl }

  const upload = async (f: File | undefined) => {
    if (!f) return
    setBusy('upload'); setMsg('')
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await fetch('/api/admin/outreach/image', { method: 'POST', headers: { 'x-admin-token': token() }, body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Could not upload that picture.')
      setImageUrl(d.url)
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not upload that picture.') }
    setBusy('')
  }

  const act = async (what: 'save' | 'preview' | 'test') => {
    setBusy(what); setMsg('')
    try {
      if (what === 'save') { await api('campaign', { id: camp.id, name, segment, ...content }); onSaved(); onClose(); return }
      const d = await api(what, { segment, ...content })
      if (what === 'preview') setPreview(d); else setMsg(`Test sent to ${d.to}.`)
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed.') }
    setBusy('')
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 980, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-semibold">{camp.id ? 'Edit campaign' : 'New campaign'}</div>
          <button onClick={onClose} style={btn()}>Close</button>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <div className="space-y-3">
            <div><div className="text-xs mb-1" style={{ color: C.dim }}>Name (only you see this)</div><input value={name} onChange={e => setName(e.target.value)} style={input} /></div>
            <div><div className="text-xs mb-1" style={{ color: C.dim }}>Goes to</div>
              <select value={segment} onChange={e => setSegment(e.target.value as Segment)} style={input}>
                {(Object.keys(SEG) as Segment[]).map(s => <option key={s} value={s}>{SEG[s]}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: C.dim }}>Look</div>
              <div className="flex gap-2">
                {(['plain', 'designed'] as const).map(k => (
                  <button key={k} onClick={() => { setStyle(k); setPreview(null) }} style={{ ...btn(), flex: 1, color: style === k ? C.accent : C.sub, borderColor: style === k ? C.accent : C.line }}>
                    {k === 'plain' ? 'Plain personal email' : 'Designed, with logo and picture'}
                  </button>
                ))}
              </div>
              <div className="text-xs mt-1" style={{ color: C.dim, lineHeight: 1.5 }}>
                {style === 'plain' ? 'Reads like you typed it. Best for a first email to someone who does not know you.' : 'A branded newsletter layout. Best for people who already know Lumio — image-heavy mail to strangers is more likely to be filtered as promotion.'}
              </div>
            </div>
            <div><div className="text-xs mb-1" style={{ color: C.dim }}>Subject</div><input value={subject} onChange={e => setSubject(e.target.value)} style={input} /></div>
            {style === 'designed' && <>
              <div><div className="text-xs mb-1" style={{ color: C.dim }}>Headline</div><input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="The big line at the top" style={input} /></div>
              <div>
                <div className="text-xs mb-1" style={{ color: C.dim }}>Picture (optional) — PNG or JPG, about 1200 pixels wide</div>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="file" accept="image/png,image/jpeg,image/gif" onChange={e => { void upload(e.target.files?.[0]) }} className="text-xs" style={{ color: C.sub }} />
                  {busy === 'upload' && <span className="text-xs" style={{ color: C.dim }}>Uploading…</span>}
                  {!!imageUrl && <button onClick={() => setImageUrl('')} style={{ ...btn(), padding: '3px 8px' }}>Remove picture</button>}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {!!imageUrl && <img src={imageUrl} alt="" style={{ display: 'block', marginTop: 8, maxWidth: '100%', maxHeight: 120, borderRadius: 8, border: `1px solid ${C.line}` }} />}
              </div>
            </>}
            <div><div className="text-xs mb-1" style={{ color: C.dim }}>Email — plain text, a blank line between paragraphs</div>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={16} style={{ ...input, lineHeight: 1.5, resize: 'vertical' }} />
            </div>
            {style === 'designed' && (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)' }}>
                <div><div className="text-xs mb-1" style={{ color: C.dim }}>Button text</div><input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="See the demo" style={input} /></div>
                <div><div className="text-xs mb-1" style={{ color: C.dim }}>Button link</div><input value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="https://lumiosports.com/tennis-coach" style={input} /></div>
              </div>
            )}
            <div className="text-xs" style={{ color: C.dim, lineHeight: 1.6 }}>
              Use <code>{'{{org}}'}</code>, <code>{'{{first_name|there}}'}</code> (the word after the bar is used when we have no name). Who it is from, why they are getting it and the unsubscribe link are added underneath automatically.
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { void act('save') }} disabled={!!busy} style={btn('primary')}>{busy === 'save' ? 'Saving…' : 'Save'}</button>
              <button onClick={() => { void act('preview') }} disabled={!!busy} style={btn()}>{busy === 'preview' ? 'Loading…' : 'Preview'}</button>
              <button onClick={() => { void act('test') }} disabled={!!busy} style={btn()}>{busy === 'test' ? 'Sending…' : 'Send a test to the outreach inbox'}</button>
            </div>
            {!!msg && <div className="text-xs" style={{ color: C.sub }}>{msg}</div>}
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: C.dim }}>{preview ? `Preview — as sent to ${preview.as}` : 'Press Preview to see it as a recipient will'}</div>
            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', minHeight: 300 }}>
              {preview && <>
                <div style={{ fontFamily: 'Arial', fontSize: 14, fontWeight: 700, color: '#111827', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>{preview.subject}</div>
                {/* Our own server-rendered email, shown in a sandboxed frame so it looks as it will in a mail app and cannot touch this page. */}
                <iframe title="Email preview" sandbox="" srcDoc={preview.html} style={{ display: 'block', width: '100%', height: 640, border: 0, background: '#fff' }} />
              </>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OutreachPage() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState<(Partial<Campaign> & { segment: Segment }) | null>(null)
  const [filter, setFilter] = useState<'all' | Segment | 'held'>('all')
  const [company, setCompany] = useState(''); const [limit, setLimit] = useState('250'); const [warmup, setWarmup] = useState(true)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach', { headers: { 'x-admin-token': token() } })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not load outreach.')
      setData(d); setCompany(d.settings.company_line); setLimit(String(d.settings.daily_limit)); setWarmup(d.settings.warmup); setErr('')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load outreach.') }
  }, [])
  useEffect(() => { void load() }, [load])

  const run = async (label: string, fn: () => Promise<unknown>, after = '') => {
    setBusy(label); setNote('')
    try { const d = await fn() as { note?: string; sent?: number; failed?: number } | undefined; setNote(after || d?.note || (d && 'sent' in d ? `Sent ${d.sent}${d.failed ? `, ${d.failed} failed` : ''}.` : '')); await load() }
    catch (e) { setNote(e instanceof Error ? e.message : 'Something went wrong.') }
    setBusy('')
  }

  if (err) return <div className="text-sm" style={{ color: C.bad }}>{err} <span style={{ color: C.dim }}>If this is the first time, run migration 189 in Supabase.</span></div>
  if (!data) return <div className="text-sm" style={{ color: C.dim }}>Loading…</div>

  const { settings, contacts } = data
  const isHeld = (c: Contact) => c.status === 'active' && !c.corporate_ok && c.basis !== 'opt_in'
  const shown = contacts.filter(c => filter === 'all' ? true : filter === 'held' ? isHeld(c) : c.segment === filter)
  const heldCount = contacts.filter(isHeld).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Outreach</h1>
          <div className="text-xs mt-1" style={{ color: C.dim }}>Business emails from our own mailbox, a few every ten minutes in working hours. Companies and organisations only, unless they opted in.</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { void run('pause', () => api('settings', { paused: !settings.paused })) }} style={btn(settings.paused ? 'primary' : 'danger')}>
            {settings.paused ? 'Resume sending' : 'Pause all sending'}
          </button>
          <button onClick={() => { void run('send', () => api('sendNow', { max: 5 })) }} disabled={!!busy} style={btn()}>{busy === 'send' ? 'Sending…' : 'Send next 5 now'}</button>
        </div>
      </div>

      {!!note && <div className="text-xs rounded-lg px-3 py-2" style={{ background: '#0A0B10', border: `1px solid ${C.line}`, color: C.sub }}>{note}</div>}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <Card>
          <div className="text-xs" style={{ color: C.dim }}>Mailbox</div>
          <div className="text-sm font-semibold mt-1" style={{ color: data.mailbox.ready ? C.good : C.bad }}>{data.mailbox.ready ? 'Connected' : 'Not set up'}</div>
          <div className="text-xs mt-1" style={{ color: C.sub, wordBreak: 'break-all' }}>{data.mailbox.ready ? data.mailbox.from : 'Add the OUTREACH_SMTP_* settings on the server.'}</div>
        </Card>
        <Card>
          <div className="text-xs" style={{ color: C.dim }}>Sent today</div>
          <div className="text-2xl font-bold mt-1">{data.sentToday}<span className="text-sm font-normal" style={{ color: C.dim }}> / {data.todaysLimit}</span></div>
          <div className="text-xs mt-1" style={{ color: settings.paused ? C.warn : C.sub }}>
            {settings.paused ? 'Paused' : data.todaysLimit < settings.daily_limit ? `Warming up towards ${settings.daily_limit} a day` : 'Mon–Fri, 9am–5pm UK'}
          </div>
        </Card>
        <Card>
          <div className="text-xs" style={{ color: C.dim }}>Contacts</div>
          <div className="text-2xl font-bold mt-1">{contacts.length}</div>
          <div className="text-xs mt-1" style={{ color: heldCount ? C.warn : C.sub }}>{heldCount ? `${heldCount} held back — not confirmed as a company` : 'None held back'}</div>
        </Card>
        <Card>
          <div className="text-xs" style={{ color: C.dim }}>Replies · Unsubscribed · Bounced</div>
          <div className="text-2xl font-bold mt-1">
            {contacts.filter(c => c.status === 'replied').length} · {contacts.filter(c => c.status === 'unsubscribed').length} · {contacts.filter(c => c.status === 'bounced').length}
          </div>
          <div className="text-xs mt-1" style={{ color: C.sub }}>
            Read from the mailbox at 7am, 4pm and 11pm. Out-of-office replies are not counted.{' '}
            <button onClick={() => { void run('inbox', () => api('syncInbox')) }} disabled={!!busy} style={{ background: 'none', border: 0, padding: 0, color: C.text, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
              {busy === 'inbox' ? 'Checking…' : 'Check now'}
            </button>
          </div>
        </Card>
      </div>

      {/* Campaigns */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Campaigns</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SEG) as Segment[]).map(s => (
              <button key={s} onClick={() => setEditing({ segment: s, ...STARTER[s] })} style={btn()}>+ {s === 'academy' ? 'Academies' : s === 'venue' ? 'Venues' : 'Coaches'}</button>
            ))}
          </div>
        </div>
        {data.campaigns.length === 0
          ? <div className="text-xs" style={{ color: C.dim }}>No campaigns yet. Start one from a draft with the buttons above — each opens a starting email you can rewrite.</div>
          : <div className="space-y-2">{data.campaigns.map(c => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5" style={{ background: '#0A0B10', border: `1px solid ${C.line}` }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div className="text-sm font-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div className="text-xs" style={{ color: C.dim }}>{SEG[c.segment]}</div>
              </div>
              <Pill color={c.status === 'active' ? C.good : c.status === 'paused' ? C.warn : C.dim}>{c.status}</Pill>
              <div className="text-xs" style={{ color: C.sub, fontVariantNumeric: 'tabular-nums' }}>
                {c.sent} sent · {c.waiting} waiting{c.held ? ` · ${c.held} held` : ''}{c.failed ? ` · ${c.failed} failed` : ''}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(c)} style={btn()}>Edit</button>
                {c.status === 'active'
                  ? <button onClick={() => { void run('st', () => api('campaignStatus', { id: c.id, status: 'paused' })) }} style={btn()}>Pause</button>
                  : <button onClick={() => { if (confirm(`Start “${c.name}”? It will go to ${c.waiting} contact${c.waiting === 1 ? '' : 's'}, a few every ten minutes in working hours, up to ${data.todaysLimit} today.`)) void run('st', () => api('campaignStatus', { id: c.id, status: 'active' })) }} style={btn('primary')}>Start</button>}
                {c.status !== 'active' && <button onClick={() => { if (confirm(`Delete “${c.name}” and its send history?`)) void run('del', () => api('deleteCampaign', { id: c.id })) }} style={btn('danger')}>Delete</button>}
              </div>
            </div>
          ))}</div>}
      </Card>

      {/* Settings */}
      <Card>
        <div className="text-sm font-semibold mb-3">Settings</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,3fr) minmax(0,1fr) auto', alignItems: 'end' }}>
          <div>
            <div className="text-xs mb-1" style={{ color: C.dim }}>Sender details at the foot of every email (optional) — left blank, it shows your name, “Lumio Tennis Coach” and your reply address</div>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Arron Margeison · Lumio Tennis Coach · London — or your registered company details once you have them" style={input} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: C.dim }}>Emails per day</div>
            <input value={limit} onChange={e => setLimit(e.target.value.replace(/\D/g, ''))} style={input} />
          </div>
          <button onClick={() => { void run('set', () => api('settings', { company_line: company, daily_limit: Math.min(data.maxDaily, Number(limit) || 0), warmup }), 'Settings saved.') }} style={btn('primary')}>Save</button>
        </div>
        <label className="flex items-start gap-2 text-xs mt-3" style={{ color: C.sub, lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={warmup} onChange={e => setWarmup(e.target.checked)} style={{ marginTop: 2 }} />
          <span><b style={{ color: C.text }}>Warm up a new mailbox.</b> Starts at 30 a day and adds 15 each day until it reaches your limit (250 takes about three weeks). Turn this off only once the mailbox has been sending for a while — a brand-new address that sends hundreds on day one is the surest way to land in spam or have the mailbox suspended.</span>
        </label>
        <div className="text-xs mt-2" style={{ color: C.dim }}>Up to {data.maxDaily} a day. Sent a few at a time every ten minutes, Mon–Fri 9am–5pm UK. Unsubscribe links point at {data.linkBase}.</div>
      </Card>

      <FindContacts onContactsChanged={() => { void load() }} />

      <ImportBox onDone={() => { void load() }} total={contacts.length} />

      {/* Contacts */}
      <Card style={{ padding: 0 }}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold mr-2">Contacts</div>
          {(['all', 'academy', 'venue', 'coach', 'held'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...btn(), padding: '4px 10px', color: filter === f ? C.accent : C.sub, borderColor: filter === f ? C.accent : C.line }}>
              {f === 'all' ? `All ${contacts.length}` : f === 'held' ? `Held back ${heldCount}` : `${f[0].toUpperCase()}${f.slice(1)} ${contacts.filter(c => c.segment === f).length}`}
            </button>
          ))}
        </div>
        <div style={{ maxHeight: 520, overflow: 'auto' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {['Organisation', 'Email', 'Audience', 'Legal form', 'May email?', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: C.dim, position: 'sticky', top: 0, background: C.card }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-xs" style={{ color: C.dim }}>No contacts here yet.</td></tr>}
              {shown.slice(0, 600).map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td className="px-4 py-2 text-xs"><div style={{ color: C.text, fontWeight: 600 }}>{c.org_name || '—'}</div><div style={{ color: C.dim }}>{c.contact_name || ''}</div></td>
                  <td className="px-4 py-2 text-xs" style={{ color: C.sub, wordBreak: 'break-all' }}>{c.email}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: C.sub }}>{c.segment}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: C.sub }}>{c.legal_form || '—'}</td>
                  <td className="px-4 py-2 text-xs">
                    {c.basis === 'opt_in' ? <Pill color={C.good}>opted in</Pill> : (
                      <label className="flex items-center gap-2" style={{ color: c.corporate_ok ? C.good : C.warn, cursor: 'pointer' }}>
                        <input type="checkbox" checked={c.corporate_ok} onChange={e => { void run('c', () => api('contact', { id: c.id, patch: { corporate_ok: e.target.checked } })) }} />
                        {c.corporate_ok ? 'Company / organisation' : 'Not confirmed'}
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <select value={c.status} onChange={e => { void run('c', () => api('contact', { id: c.id, patch: { status: e.target.value } })) }}
                      style={{ ...input, width: 'auto', padding: '4px 6px', fontSize: 12, color: c.status === 'active' ? C.sub : c.status === 'replied' ? C.good : C.bad }}>
                      {['active', 'replied', 'unsubscribed', 'bounced'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-xs"><button onClick={() => { if (confirm(`Remove ${c.email}?`)) void run('c', () => api('deleteContacts', { ids: [c.id] })) }} style={{ ...btn(), padding: '3px 8px' }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length > 600 && <div className="px-4 py-3 text-xs" style={{ color: C.dim }}>Showing the first 600 of {shown.length}.</div>}
        </div>
      </Card>

      {/* Recent sends */}
      <Card style={{ padding: 0 }}>
        <div className="px-4 py-3 text-sm font-semibold" style={{ borderBottom: `1px solid ${C.line}` }}>Recent sends</div>
        {data.recent.length === 0 ? <div className="px-4 py-6 text-xs" style={{ color: C.dim }}>Nothing sent yet.</div> : (
          <table className="w-full text-sm"><tbody>
            {data.recent.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td className="px-4 py-2 text-xs" style={{ color: C.dim, whiteSpace: 'nowrap' }}>{new Date(s.sent_at || s.created_at).toLocaleString('en-GB')}</td>
                <td className="px-4 py-2 text-xs" style={{ color: C.sub }}>{s.email}</td>
                <td className="px-4 py-2 text-xs" style={{ color: C.dim }}>{data.campaigns.find(c => c.id === s.campaign_id)?.name || ''}</td>
                <td className="px-4 py-2 text-xs"><Pill color={s.status === 'sent' ? C.good : s.status === 'failed' ? C.bad : C.warn}>{s.status}</Pill> <span style={{ color: C.dim }}>{s.error || ''}</span></td>
              </tr>
            ))}
          </tbody></table>
        )}
      </Card>

      {editing && <Editor camp={editing} onClose={() => setEditing(null)} onSaved={() => { void load() }} />}
    </div>
  )
}
