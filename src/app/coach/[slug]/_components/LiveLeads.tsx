'use client'

// Leads — every enquiry, from first contact to joined, in one place.
//
// Two pipelines with the coach's own stages (UK coaching, Holidays), shown as
// a board. A lead opens into a panel with everything about them: how to reach
// them, what they said, notes, the next follow-up, which waiting list they are
// on, and buttons to move them on. Leads arrive by hand, from a spreadsheet,
// or straight from Meta lead ads through the academy's private address.
//
// The weekly score is light on purpose: points for moving leads on and for
// following up on the day you said, and a streak for weeks with five or more.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, rowsChanged } from '../_lib/coach-db'
import { PIPELINES, SOURCES, CONTACT_METHODS, stagesOf, isClosed, stagePoints, scoreOf, FOLLOWUP_POINTS, STREAK_POINTS, guessColumn, matchStage, type Pipeline, type ImportColumn } from '@/lib/coach/leads'
import { ukDate } from '@/lib/coach/uk-date'

export type Lead = {
  id: string; pipeline: Pipeline; stage: string; name: string; for_name?: string | null; email?: string | null; phone?: string | null
  source?: string | null; campaign?: string | null; message?: string | null; notes?: string | null; contact_method?: string | null
  google_review?: boolean | null; list?: string | null; next_action_at?: string | null; next_action?: string | null
  player_id?: string | null; stage_changed_at?: string | null; created_at: string
}
type LeadEvent = { id: string; lead_id: string; kind: string; from_stage?: string | null; to_stage?: string | null; text?: string | null; points?: number | null; created_at: string }

const ageWords = (iso: string) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)
  return d <= 0 ? 'today' : d === 1 ? '1 day' : d < 60 ? `${d} days` : `${Math.round(d / 30)} months`
}
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d+]/g, '').replace(/^0/, '44').replace(/^\+/, '')}`

export function LiveLeads({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const leads = useCoachTable<Lead>('coach_leads')
  const events = useCoachTable<LeadEvent>('coach_lead_events')
  const [pipe, setPipe] = useState<Pipeline>('coaching')
  const [q, setQ] = useState('')
  const [list, setList] = useState<string | null>(null)
  const [dueOnly, setDueOnly] = useState(false)
  const [open, setOpen] = useState<Lead | 'new' | null>(null)
  const [modal, setModal] = useState<'import' | 'ads' | null>(null)
  const today = ukDate()

  const score = useMemo(() => scoreOf(events.rows, today), [events.rows, today])
  const lists = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of leads.rows) if (l.list?.trim()) m.set(l.list.trim(), (m.get(l.list.trim()) || 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [leads.rows])
  const due = leads.rows.filter(l => l.next_action_at && l.next_action_at <= today && !isClosed(l.pipeline, l.stage))
  const shown = leads.rows.filter(l => l.pipeline === pipe
    && (!list || (l.list || '').trim() === list)
    && (!dueOnly || (l.next_action_at && l.next_action_at <= today))
    && (!q.trim() || [l.name, l.for_name, l.email, l.phone, l.notes, l.campaign].some(x => (x || '').toLowerCase().includes(q.trim().toLowerCase()))))

  const btn: CSSProperties = { appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }
  const chip = (on: boolean): CSSProperties => ({ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 999, padding: '5px 11px', fontSize: 12, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' })

  const copyEmails = async () => {
    const emails = shown.map(l => l.email).filter(Boolean) as string[]
    try { await navigator.clipboard.writeText(emails.join(', ')); alert(`${emails.length} email address${emails.length === 1 ? '' : 'es'} copied. Paste them into your email (in the Bcc box) or Mailchimp.`) }
    catch { alert(emails.join(', ')) }
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Leads</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Every enquiry, from first contact to joined.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setModal('ads')} style={btn}>📥 Leads from ads</button>
          <button onClick={() => setModal('import')} style={btn}>⬆ Import a spreadsheet</button>
          <button onClick={() => setOpen('new')} style={{ ...btn, border: 0, background: accent.hex, color: T.btnText }}>＋ Add lead</button>
        </div>
      </div>

      {/* Score and what needs doing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Tile T={T} label="This week" value={`${score.week} point${score.week === 1 ? '' : 's'}`} sub={score.week >= STREAK_POINTS ? 'Streak kept for this week ✓' : `${STREAK_POINTS - score.week} more to keep the streak`} tone={score.week >= STREAK_POINTS ? T.good : T.text} />
        <Tile T={T} label="Streak" value={`${score.streak} week${score.streak === 1 ? '' : 's'}`} sub={`Weeks with ${STREAK_POINTS}+ points`} tone={score.streak ? accent.hex : T.text} />
        <Tile T={T} label="Follow-ups due" value={String(due.length)} sub={due.length ? 'Today or overdue' : 'All caught up'} tone={due.length ? T.warn : T.good} onClick={due.length ? () => setDueOnly(v => !v) : undefined} />
        <Tile T={T} label="New this week" value={String(leads.rows.filter(l => Date.now() - Date.parse(l.created_at) < 7 * 86_400_000).length)} sub="Across both pipelines" tone={T.text} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ display: 'flex', padding: 2, background: T.hover, borderRadius: 9 }}>
          {(Object.keys(PIPELINES) as Pipeline[]).map(p => (
            <button key={p} onClick={() => setPipe(p)} style={{ appearance: 'none', border: 0, padding: '9px 14px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT, background: pipe === p ? T.panel : 'transparent', color: pipe === p ? T.text : T.text2, fontWeight: pipe === p ? 700 : 500, boxShadow: pipe === p ? `0 0 0 1px ${T.border}` : 'none' }}>
              {PIPELINES[p].label} · {leads.rows.filter(l => l.pipeline === p && !isClosed(p, l.stage)).length}
            </button>
          ))}
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, notes…" aria-label="Search leads"
          style={{ flex: '1 1 200px', maxWidth: 320, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }} />
        {dueOnly && <button onClick={() => setDueOnly(false)} style={chip(true)}>✕ Follow-ups due only</button>}
      </div>
      {lists.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: T.text3 }}>Lists:</span>
          {lists.map(([name, n]) => <button key={name} onClick={() => setList(list === name ? null : name)} style={chip(list === name)}>{name} · {n}</button>)}
          {list && <button onClick={copyEmails} style={{ ...chip(false), color: accent.hex }}>Copy their emails</button>}
        </div>
      )}

      {/* The board */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }} data-testid="lead-board">
        {stagesOf(pipe).map(stage => {
          const col = shown.filter(l => l.stage === stage).sort((a, b) => (a.next_action_at || '9999').localeCompare(b.next_action_at || '9999') || b.created_at.localeCompare(a.created_at))
          const closed = isClosed(pipe, stage)
          return (
            <div key={stage} style={{ flex: '0 0 230px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120, opacity: closed ? 0.85 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{stage}</div>
                <div style={{ fontSize: 11, color: T.text3, marginLeft: 'auto' }}>{col.length}</div>
              </div>
              {col.map(l => {
                const overdue = l.next_action_at && l.next_action_at < today
                const dueToday = l.next_action_at === today
                return (
                  <button key={l.id} onClick={() => setOpen(l)} data-testid="lead-card"
                    style={{ appearance: 'none', textAlign: 'left', background: T.panel2, border: `1px solid ${overdue ? `${T.bad}66` : dueToday ? `${T.warn}66` : T.border}`, borderRadius: 9, padding: '8px 10px', cursor: 'pointer', fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{l.name}{l.for_name ? <span style={{ color: T.text3, fontWeight: 400 }}> · for {l.for_name}</span> : null}</span>
                    <span style={{ fontSize: 10.5, color: T.text3 }}>{[l.source, ageWords(l.created_at)].filter(Boolean).join(' · ')}{l.google_review ? ' · ★ review' : ''}</span>
                    {l.next_action_at && !closed && <span style={{ fontSize: 10.5, color: overdue ? T.bad : dueToday ? T.warn : T.text2 }}>{overdue ? 'Overdue' : dueToday ? 'Today' : dayLabel(l.next_action_at)}{l.next_action ? `: ${l.next_action}` : ''}</span>}
                    {l.list && <span style={{ fontSize: 10, color: accent.hex }}>{l.list}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      {!leads.loading && leads.rows.length === 0 && (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 12, padding: 20, textAlign: 'center', color: T.text3, fontSize: 13, marginTop: 10 }}>
          No leads yet. Add one, import your spreadsheet, or connect your Meta ads so new enquiries arrive here on their own.
        </div>
      )}

      {open && <LeadPanel T={T} accent={accent} lead={open === 'new' ? null : open} pipeline={pipe} lists={lists.map(l => l[0])}
        events={open === 'new' ? [] : events.rows.filter(e => e.lead_id === open.id)}
        onClose={() => setOpen(null)} onChanged={l => { if (l) setOpen(l); rowsChanged('coach_leads', 'coach_lead_events') }} />}
      {modal === 'import' && <ImportLeads T={T} accent={accent} pipeline={pipe} onClose={() => setModal(null)} onDone={() => rowsChanged('coach_leads')} />}
      {modal === 'ads' && <AdsLeads T={T} accent={accent} onClose={() => setModal(null)} onTest={() => rowsChanged('coach_leads', 'coach_lead_events')} />}
    </div>
  )
}

function Tile({ T, label, value, sub, tone, onClick }: { T: ThemeTokens; label: string; value: string; sub: string; tone: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color: tone, marginTop: 3 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function Shell({ T, title, onClose, children, wide }: { T: ThemeTokens; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div role="dialog" aria-label={title} style={{ width: '100%', maxWidth: wide ? 720 : 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1, minWidth: 0 }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, width: 32, height: 32, fontSize: 17, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── One lead ─────────────────────────────────────────────────────────────────
function LeadPanel({ T, accent, lead, pipeline, lists, events, onClose, onChanged }: {
  T: ThemeTokens; accent: AccentTokens; lead: Lead | null; pipeline: Pipeline; lists: string[]; events: LeadEvent[]
  onClose: () => void; onChanged: (l: Lead | null) => void
}) {
  const [d, setD] = useState<Partial<Lead>>(() => lead ? { ...lead } : { pipeline, stage: 'Enquired', source: 'Other' })
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const set = (k: keyof Lead, v: unknown) => setD(x => ({ ...x, [k]: v }))
  const pipe = (d.pipeline || pipeline) as Pipeline
  const today = ukDate()

  const field: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }
  const small: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '0 11px', minHeight: 32, fontSize: 12, cursor: 'pointer', fontFamily: FONT }

  const fields = () => ({
    pipeline: pipe, name: String(d.name || '').trim(), for_name: String(d.for_name || '').trim() || null,
    email: String(d.email || '').trim().toLowerCase() || null, phone: String(d.phone || '').trim() || null,
    source: d.source || null, contact_method: d.contact_method || null, list: String(d.list || '').trim() || null,
    next_action_at: d.next_action_at || null, next_action: String(d.next_action || '').trim() || null, google_review: !!d.google_review,
  })
  const save = async () => {
    const f = fields()
    if (!f.name) { setErr('Give the lead a name.'); return }
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) { setErr('That email address does not look right.'); return }
    setBusy('save'); setErr('')
    try {
      if (!lead) {
        const made = await dbInsert('coach_leads', { ...f, stage: d.stage || 'Enquired', notes: note.trim() ? `[${today}] ${note.trim()}` : null })
        await dbInsert('coach_lead_events', { lead_id: made.id, kind: 'created', to_stage: made.stage, points: 0 })
        onChanged(null); onClose()
      } else {
        const done = await dbUpdate('coach_leads', lead.id, f)
        onChanged({ ...lead, ...(done || f) } as Lead)
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'It could not be saved.') }
    finally { setBusy('') }
  }
  const move = async (to: string) => {
    if (!lead || to === lead.stage) return
    setBusy(to); setErr('')
    try {
      const pts = stagePoints(lead.pipeline, lead.stage, to)
      await dbUpdate('coach_leads', lead.id, { stage: to, stage_changed_at: new Date().toISOString() })
      await dbInsert('coach_lead_events', { lead_id: lead.id, kind: 'stage', from_stage: lead.stage, to_stage: to, points: pts })
      onChanged({ ...lead, stage: to })
      setD(x => ({ ...x, stage: to }))
    } catch (e) { setErr(e instanceof Error ? e.message : 'It could not be moved.') }
    finally { setBusy('') }
  }
  const addNote = async () => {
    if (!lead || !note.trim()) return
    setBusy('note')
    try {
      const notes = [lead.notes, `[${today}] ${note.trim()}`].filter(Boolean).join('\n').slice(0, 5000)
      await dbUpdate('coach_leads', lead.id, { notes })
      await dbInsert('coach_lead_events', { lead_id: lead.id, kind: 'note', text: note.trim().slice(0, 300), points: 0 })
      setNote(''); onChanged({ ...lead, notes })
    } catch (e) { setErr(e instanceof Error ? e.message : 'The note could not be saved.') }
    finally { setBusy('') }
  }
  const followupDone = async () => {
    if (!lead?.next_action_at) return
    setBusy('done')
    try {
      const onTime = lead.next_action_at >= today
      const text = `Follow-up done${lead.next_action ? `: ${lead.next_action}` : ''}`
      const notes = [lead.notes, `[${today}] ${text}`].filter(Boolean).join('\n').slice(0, 5000)
      await dbUpdate('coach_leads', lead.id, { next_action_at: null, next_action: null, notes })
      await dbInsert('coach_lead_events', { lead_id: lead.id, kind: 'followup', text, points: onTime ? FOLLOWUP_POINTS : 0 })
      setD(x => ({ ...x, next_action_at: null, next_action: null })); onChanged({ ...lead, next_action_at: null, next_action: null, notes })
    } catch (e) { setErr(e instanceof Error ? e.message : 'That could not be saved.') }
    finally { setBusy('') }
  }
  const toRoster = async () => {
    if (!lead) return
    setBusy('roster'); setErr('')
    try {
      const child = (lead.for_name || '').trim()
      const player = await dbInsert('coach_players', child
        ? { name: child, parent_name: lead.name, parent_email: lead.email || null, phone: lead.phone || null, category: 'Junior' }
        : { name: lead.name, email: lead.email || null, phone: lead.phone || null, category: 'Adult' })
      const to = lead.pipeline === 'coaching' ? 'Joined' : lead.stage
      await dbUpdate('coach_leads', lead.id, { player_id: player.id, ...(to !== lead.stage ? { stage: to, stage_changed_at: new Date().toISOString() } : {}) })
      if (to !== lead.stage) await dbInsert('coach_lead_events', { lead_id: lead.id, kind: 'stage', from_stage: lead.stage, to_stage: to, points: stagePoints(lead.pipeline, lead.stage, to) })
      rowsChanged('coach_players')
      onChanged({ ...lead, player_id: player.id, stage: to })
      setD(x => ({ ...x, player_id: player.id, stage: to }))
    } catch (e) { setErr(e instanceof Error ? e.message : 'They could not be added to the roster.') }
    finally { setBusy('') }
  }
  const remove = async () => {
    if (!lead || !confirm(`Delete ${lead.name} from your leads? Their notes go too.`)) return
    try { await dbRemove('coach_leads', lead.id); onChanged(null); onClose() } catch (e) { setErr(e instanceof Error ? e.message : 'It could not be deleted.') }
  }

  const stages = stagesOf(pipe)
  return (
    <Shell T={T} title={lead ? lead.name : 'Add a lead'} onClose={onClose} wide>
      {lead && (
        <div style={{ marginBottom: 14 }}>
          <div style={lbl}>Stage</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {stages.map(st => {
              const on = (d.stage || lead.stage) === st
              return <button key={st} onClick={() => move(st)} disabled={!!busy} aria-pressed={on}
                style={{ appearance: 'none', border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.hex : 'transparent', color: on ? T.btnText : T.text2, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: FONT }}>{busy === st ? '…' : st}</button>
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <label><span style={lbl}>Name</span><input value={d.name || ''} onChange={e => set('name', e.target.value)} style={field} /></label>
        <label><span style={lbl}>For (a child, optional)</span><input value={d.for_name || ''} onChange={e => set('for_name', e.target.value)} placeholder="e.g. Alfie" style={field} /></label>
        <label><span style={lbl}>Email</span><input value={d.email || ''} onChange={e => set('email', e.target.value)} type="email" style={field} /></label>
        <label><span style={lbl}>Phone</span><input value={d.phone || ''} onChange={e => set('phone', e.target.value)} type="tel" style={field} /></label>
        <label><span style={lbl}>Source</span><select value={d.source || ''} onChange={e => set('source', e.target.value)} style={field}><option value="">—</option>{Array.from(new Set([...SOURCES, d.source].filter(Boolean))).map(s => <option key={s as string}>{s}</option>)}</select></label>
        <label><span style={lbl}>Last contact by</span><select value={d.contact_method || ''} onChange={e => set('contact_method', e.target.value)} style={field}><option value="">—</option>{CONTACT_METHODS.map(m => <option key={m}>{m}</option>)}</select></label>
        {!lead && <label><span style={lbl}>Pipeline</span><select value={pipe} onChange={e => set('pipeline', e.target.value)} style={field}>{(Object.keys(PIPELINES) as Pipeline[]).map(p => <option key={p} value={p}>{PIPELINES[p].label}</option>)}</select></label>}
        <label><span style={lbl}>List (optional)</span><input value={d.list || ''} onChange={e => set('list', e.target.value)} list="lead-lists" placeholder="e.g. Midweek evenings waiting list" style={field} /><datalist id="lead-lists">{lists.map(l => <option key={l} value={l} />)}</datalist></label>
        <label><span style={lbl}>Next follow-up</span><input type="date" value={d.next_action_at || ''} onChange={e => set('next_action_at', e.target.value || null)} style={field} /></label>
        <label><span style={lbl}>What to do</span><input value={d.next_action || ''} onChange={e => set('next_action', e.target.value)} placeholder="e.g. Send trial times" style={field} /></label>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, color: T.text2, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!d.google_review} onChange={e => set('google_review', e.target.checked)} /> Has left a Google review
      </label>

      {lead && (lead.email || lead.phone) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {lead.phone && <a href={`tel:${lead.phone}`} style={{ ...small, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>📞 Call</a>}
          {lead.phone && <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" style={{ ...small, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>🟢 WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} style={{ ...small, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>✉️ Email</a>}
          {lead.next_action_at && <button onClick={followupDone} disabled={!!busy} style={{ ...small, color: T.good, borderColor: `${T.good}66` }}>{busy === 'done' ? 'Saving…' : `✓ Follow-up done${lead.next_action_at >= today ? ' (+1 point)' : ''}`}</button>}
        </div>
      )}

      {lead && (lead.message || lead.campaign) && (
        <div style={{ marginTop: 12, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px' }}>
          <div style={lbl}>{lead.message ? `What they said${lead.campaign ? ` · ${lead.campaign}` : ''}` : 'Came from'}</div>
          <div style={{ fontSize: 12.5, color: T.text2, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{lead.message || lead.campaign}</div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div style={lbl}>Notes</div>
        {lead?.notes && <div style={{ fontSize: 12.5, color: T.text2, whiteSpace: 'pre-wrap', lineHeight: 1.55, marginBottom: 6, maxHeight: 160, overflowY: 'auto' }}>{lead.notes}</div>}
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && lead) void addNote() }} placeholder="e.g. Injured, wants to restart soon" style={field} />
          {lead && <button onClick={addNote} disabled={!note.trim() || !!busy} style={{ ...small, flexShrink: 0 }}>{busy === 'note' ? '…' : 'Add note'}</button>}
        </div>
      </div>

      {lead && events.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={lbl}>History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
            {events.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map(e => (
              <div key={e.id} style={{ fontSize: 11.5, color: T.text3 }}>
                {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })} · {e.kind === 'stage' ? `${e.from_stage} → ${e.to_stage}` : e.kind === 'created' ? `Added${e.text ? ` (${e.text})` : ''}` : e.text}
                {e.points ? <span style={{ color: accent.hex }}> +{e.points}</span> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {lead && <button onClick={remove} style={{ ...small, color: T.bad }}>Delete</button>}
        {lead && !lead.player_id && <button onClick={toRoster} disabled={!!busy} style={small}>{busy === 'roster' ? 'Adding…' : '➕ Add to Player Roster'}</button>}
        {lead?.player_id && <span style={{ fontSize: 12, color: T.good, alignSelf: 'center' }}>✓ On your roster</span>}
        <button onClick={save} disabled={!!busy} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 36, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{busy === 'save' ? 'Saving…' : lead ? 'Save' : 'Add lead'}</button>
      </div>
    </Shell>
  )
}

// ── Importing a spreadsheet ──────────────────────────────────────────────────
const COLUMN_LABEL: Record<ImportColumn, string> = { name: 'Name', for_name: 'Child’s name', email: 'Email', phone: 'Phone', stage: 'Status / stage', notes: 'Notes', source: 'Source', contact_method: 'Contact method', list: 'List', created: 'Date enquired', skip: 'Leave out' }

function ImportLeads({ T, accent, pipeline, onClose, onDone }: { T: ThemeTokens; accent: AccentTokens; pipeline: Pipeline; onClose: () => void; onDone: () => void }) {
  const [pipe, setPipe] = useState<Pipeline>(pipeline)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<unknown[][]>([])
  const [map, setMap] = useState<ImportColumn[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)

  const read = async (file?: File | null) => {
    if (!file) return
    setMsg(null)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const all = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
      const head = (all[0] || []).map(h => String(h ?? '').trim())
      const body = all.slice(1).filter(r => r.some(c => String(c ?? '').trim()))
      if (!head.length || !body.length) { setMsg({ text: 'That file looks empty. The first row should be the column headings.', bad: true }); return }
      setHeaders(head); setRows(body); setMap(head.map(guessColumn))
    } catch { setMsg({ text: 'That file could not be read. Save it as .xlsx or .csv and try again.', bad: true }) }
  }

  const records = rows.map(r => {
    const o: Record<string, string> = {}
    map.forEach((m, i) => { if (m !== 'skip') { const v = r[i] instanceof Date ? (r[i] as Date).toISOString() : String(r[i] ?? '').trim(); if (v) o[m] = o[m] ? `${o[m]} ${v}` : v } })
    if (o.stage) o.stage = matchStage(pipe, o.stage)
    return o
  }).filter(o => o.name || o.email || o.phone)

  const go = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/coach/leads/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pipeline: pipe, rows: records }) })
      const d = await r.json()
      if (!r.ok) setMsg({ text: d.error || 'The import did not work.', bad: true })
      else { setMsg({ text: `✓ ${d.added} lead${d.added === 1 ? '' : 's'} brought in.${d.skipped ? ` ${d.skipped} row${d.skipped === 1 ? '' : 's'} had no name, email or phone.` : ''}` }); onDone(); setRows([]); setHeaders([]) }
    } catch { setMsg({ text: 'You appear to be offline. Nothing was imported.', bad: true }) }
    finally { setBusy(false) }
  }

  const field: CSSProperties = { minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 7px', fontSize: 12, fontFamily: FONT }
  return (
    <Shell T={T} title="Import a spreadsheet of leads" onClose={onClose} wide>
      <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>An Excel or CSV file with one lead per row and headings in the first row. You check which column is which before anything is saved; a status column is matched to your stages.</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <select value={pipe} onChange={e => setPipe(e.target.value as Pipeline)} style={field} aria-label="Pipeline">{(Object.keys(PIPELINES) as Pipeline[]).map(p => <option key={p} value={p}>Into {PIPELINES[p].label}</option>)}</select>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={e => void read(e.target.files?.[0])} style={{ fontSize: 12, color: T.text2 }} />
      </div>
      {headers.length > 0 && (
        <>
          <div style={{ overflowX: 'auto', marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 9 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
              <thead>
                <tr>{headers.map((h, i) => <th key={i} style={{ padding: 6, textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.text, whiteSpace: 'nowrap' }}>{h || `Column ${i + 1}`}</th>)}</tr>
                <tr>{headers.map((_, i) => <th key={i} style={{ padding: 6, borderBottom: `1px solid ${T.border}` }}>
                  <select value={map[i]} onChange={e => setMap(m => m.map((x, j) => (j === i ? e.target.value as ImportColumn : x)))} style={field} aria-label={`Column ${i + 1} holds`}>
                    {(Object.keys(COLUMN_LABEL) as ImportColumn[]).map(c => <option key={c} value={c}>{COLUMN_LABEL[c]}</option>)}
                  </select></th>)}</tr>
              </thead>
              <tbody>{rows.slice(0, 4).map((r, i) => <tr key={i}>{headers.map((_, j) => <td key={j} style={{ padding: 6, color: map[j] === 'skip' ? T.text3 : T.text2, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r[j] instanceof Date ? (r[j] as Date).toLocaleDateString('en-GB') : String(r[j] ?? '')}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 8 }}>
            {records.length} of {rows.length} rows will come in.
            {map.includes('stage') && ` Stages: ${Object.entries(records.reduce<Record<string, number>>((a, r) => { const s = r.stage || stagesOf(pipe)[0]; a[s] = (a[s] || 0) + 1; return a }, {})).map(([s, n]) => `${s} ${n}`).join(' · ')}.`}
          </div>
        </>
      )}
      {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? T.bad : T.good, marginTop: 10 }}>{msg.text}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '0 14px', minHeight: 36, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Close</button>
        <button onClick={go} disabled={busy || !records.length} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 36, fontSize: 13, fontWeight: 700, cursor: busy || !records.length ? 'not-allowed' : 'pointer', opacity: busy || !records.length ? 0.5 : 1, fontFamily: FONT }}>{busy ? 'Importing…' : `Import ${records.length || ''} lead${records.length === 1 ? '' : 's'}`}</button>
      </div>
    </Shell>
  )
}

// ── Leads from ads ───────────────────────────────────────────────────────────
function AdsLeads({ T, accent, onClose, onTest }: { T: ThemeTokens; accent: AccentTokens; onClose: () => void; onTest: () => void }) {
  const [hook, setHook] = useState<{ url: string | null; lastUsedAt: string | null } | null>(null)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [busy, setBusy] = useState('')
  useEffect(() => {
    let live = true
    fetch('/api/coach/leads/hook').then(r => r.json()).then(d => {
      if (!live) return
      if (d.error) { setHook({ url: null, lastUsedAt: null }); setMsg({ text: d.error, bad: true }) } else setHook(d)
    }).catch(() => { if (live) setHook({ url: null, lastUsedAt: null }) })
    return () => { live = false }
  }, [])
  const make = async (rotate = false) => {
    if (rotate && !confirm('Make a new address? The old one stops working, so update it in Zapier or Make straight away.')) return
    setBusy('make'); setMsg(null)
    try { const r = await fetch('/api/coach/leads/hook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotate }) }); const d = await r.json(); if (!r.ok) setMsg({ text: d.error || 'It could not be made.', bad: true }); else setHook(d) }
    catch { setMsg({ text: 'You appear to be offline.', bad: true }) } finally { setBusy('') }
  }
  const test = async () => {
    if (!hook?.url) return
    setBusy('test'); setMsg(null)
    try {
      const r = await fetch(hook.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: 'Test Lead', email: 'test.lead@example.com', phone_number: '07700 900000', campaign_name: 'Test from Lumio', message: 'This is a test lead. Delete it whenever you like.' }) })
      const d = await r.json()
      setMsg(r.ok ? { text: d.created ? '✓ A test lead has arrived at Enquired in UK coaching.' : '✓ Received. The test lead was already there, so a note was added to it.' } : { text: d.error || 'The test did not arrive.', bad: true })
      onTest()
    } catch { setMsg({ text: 'The test could not be sent.', bad: true }) } finally { setBusy('') }
  }
  const copy = async () => { if (hook?.url) { try { await navigator.clipboard.writeText(hook.url); setMsg({ text: 'Address copied.' }) } catch { setMsg({ text: hook.url }) } } }
  const step: CSSProperties = { fontSize: 12.5, color: T.text2, lineHeight: 1.55, margin: '4px 0' }
  return (
    <Shell T={T} title="Leads from your ads" onClose={onClose}>
      <div style={step}>New enquiries from Meta lead ads (or your website form) can arrive here on their own, at <strong>Enquired</strong>, instead of in a spreadsheet. You keep the automation you already have and point it at your private Lumio address.</div>
      {!hook ? <div style={{ ...step, color: T.text3 }}>Loading…</div> : hook.url ? (
        <>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
            <input readOnly value={hook.url} aria-label="Your private address" onFocus={e => e.target.select()} style={{ flex: 1, minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12, fontFamily: 'monospace' }} />
            <button onClick={copy} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '0 12px', minHeight: 34, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Copy</button>
          </div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 4 }}>{hook.lastUsedAt ? `Last lead received ${new Date(hook.lastUsedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}.` : 'Nothing received yet.'} Keep this address private: anyone with it can add leads.</div>
          <ol style={{ ...step, paddingLeft: 18, marginTop: 12 }}>
            <li><strong>In Zapier:</strong> trigger “Facebook Lead Ads → New Lead”, then action “Webhooks by Zapier → POST”, URL = the address above, payload type JSON. Map the lead’s name, email, phone and answers (any field names work).</li>
            <li><strong>In Make:</strong> “Facebook Lead Ads → Watch leads”, then “HTTP → Make a request”, method POST, the address above, body type JSON with the lead’s fields.</li>
            <li>For a holiday enquiry, add a field <code>pipeline</code> = <code>holiday</code> (or put “holiday” or “trip” in the form name) and it lands in Holidays.</li>
          </ol>
          {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? T.bad : T.good, marginTop: 8 }}>{msg.text}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={test} disabled={!!busy} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '0 14px', minHeight: 36, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{busy === 'test' ? 'Sending…' : 'Send a test lead'}</button>
            <button onClick={() => make(true)} disabled={!!busy} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '0 14px', minHeight: 36, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Make a new address</button>
          </div>
        </>
      ) : (
        <>
          {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? T.bad : T.good, marginTop: 8 }}>{msg.text}</div>}
          <button onClick={() => make(false)} disabled={!!busy} style={{ marginTop: 12, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 38, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{busy === 'make' ? 'Making…' : 'Make my private address'}</button>
        </>
      )}
    </Shell>
  )
}
