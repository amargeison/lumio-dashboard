'use client'

// Leads: schools and funders, from first contact to partnered or funded.
//
// Two pipelines shown as boards. A card moves by dragging it or from its panel,
// and the panel holds everything about the lead: how to reach them, what they
// said, notes, the next follow-up and which list they're on. Leads arrive by
// hand, from a spreadsheet, or from Meta lead ads through the org's private
// address. Closing a school as Partnered offers to create or link the school;
// closing a funder as Funded offers to record the donation.
//
// Reads and writes go straight to impact_leads as the signed-in HQ (RLS). The
// demo shows a hand-written board, read-only.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Download, Plus, Upload, X } from 'lucide-react'
import { Card, Pill, Stat } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import {
  PIPELINES, SOURCES, CONTACT_METHODS, FOLLOWUP_POINTS, amountPence, guessColumn, isClosed, leadEdits, matchStage, notesForDisplay, stagePoints, stagesOf, ukDate, weekOf, withLeadLinks,
  type ImportColumn, type Lead, type LeadEvent, type Pipeline,
} from '@/lib/impact/leads'
import { fundedPlan, fundingOutcome, markSchoolFunded, matchSchool, partnerWithNewSchool, partnerWithSchool, recordFunding, withSchools, type CampaignRef, type FundedPlan, type SchoolRef } from '@/lib/impact/lead-actions'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const MUTED = '#6B6560', FAINT = '#8A847E', LINE = '#E7E2DC', PAPER = '#F7F5F2', AMBER = '#9A6A0B', GREEN = '#187A3C'
const pipelines = Object.keys(PIPELINES) as Pipeline[]

const field: React.CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: '#fff', color: TP_DARK, border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }
const label: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: FAINT, marginBottom: 4 }
const primary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: TP_RED, color: '#fff', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
const secondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${LINE}`, background: '#fff', color: TP_DARK, borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }
const chip = (on: boolean): React.CSSProperties => ({ border: `1px solid ${on ? TP_RED : LINE}`, background: on ? '#FDE8E8' : '#fff', color: on ? TP_RED : MUTED, borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })

const ageWords = (iso: string) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)
  return d <= 0 ? 'today' : d === 1 ? '1 day' : d < 60 ? `${d} days` : `${Math.round(d / 30)} months`
}
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d+]/g, '').replace(/^0/, '44').replace(/^\+/, '')}`
const pounds = (pence: number) => `£${(pence / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`
const problem = (e: unknown, fallback: string) => e instanceof Error ? e.message : fallback

/** Reads past Supabase's 1,000-row page, since an import can bring in 2,000. */
async function allLeads(): Promise<Lead[]> {
  const out: Lead[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb().from('impact_leads').select('*').order('created_at', { ascending: false }).range(from, from + 999)
    if (error) throw error
    out.push(...(data as Lead[]))
    if (!data || data.length < 1000) return out
  }
}
async function hqId() {
  const { data: { user } } = await sb().auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  return user.id
}
async function logEvent(lead: Pick<Lead, 'id'>, event: Partial<LeadEvent>) {
  const { error } = await sb().from('impact_lead_events').insert({ hq_id: await hqId(), lead_id: lead.id, ...event })
  if (error) throw new Error('That was saved, but its history could not be.')
}
async function updateLead(id: string, patch: Partial<Lead>) {
  const { error } = await sb().from('impact_leads').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error('That could not be saved.')
}
async function moveLead(lead: Lead, to: string, extra: Partial<Lead> = {}) {
  await updateLead(lead.id, { stage: to, stage_changed_at: new Date().toISOString(), ...extra })
  await logEvent(lead, { kind: 'stage', from_stage: lead.stage, to_stage: to, points: stagePoints(lead.pipeline, lead.stage, to) })
}

type Closing = { lead: Lead; to: 'Partnered' } | {
  lead: Lead; to: 'Funded'; plan: Exclude<FundedPlan, { kind: 'close' }>
  schoolName: string; outcome: ReturnType<typeof fundingOutcome>
}
type Closed = { notice: string; added?: SchoolRef }

/** Everything the Funded dialog needs, read fresh so its sums are today's. */
async function fundedClosing(lead: Lead): Promise<Closing | null> {
  const { data: campaigns } = await sb().from('tp_fundraising_campaigns').select('id, school_id, status, target_pence')
  const plan = fundedPlan(lead, (campaigns ?? []) as CampaignRef[])
  if (plan.kind === 'close') return null
  const { data: school } = await sb().from('tp_schools').select('name, status').eq('id', lead.school_id as string).single()
  if (!school) throw new Error('That school could not be found.')
  let raised = 0
  if (plan.kind === 'donate') {
    const { data: gifts } = await sb().from('tp_donations').select('amount_pence').eq('campaign_id', plan.campaignId)
    raised = (gifts ?? []).reduce((n, g) => n + (g.amount_pence as number), 0)
  }
  const campaign = (campaigns ?? []).find(c => plan.kind === 'donate' && c.id === plan.campaignId) as CampaignRef | undefined
  return { lead, to: 'Funded', plan, schoolName: school.name as string, outcome: fundingOutcome(plan, lead.amount_pence as number, school as { status: string }, campaign, raised) }
}

export default function LeadsTab() {
  const ctx = useImpact()
  const demo = ctx.mode === 'demo'
  const canEdit = !demo && !!ctx.org?.canEdit
  const [addedSchools, setAddedSchools] = useState<SchoolRef[]>([])
  const schools: SchoolRef[] = useMemo(() => withSchools(ctx.data.SCHOOLS.map(s => ({ id: s.id, name: s.name })), addedSchools), [ctx.data.SCHOOLS, addedSchools])
  const [rows, setRows] = useState<Lead[]>([])
  const [loading, setLoading] = useState(canEdit)
  const [pipe, setPipe] = useState<Pipeline>('schools')
  const [q, setQ] = useState('')
  const [list, setList] = useState<string | null>(null)
  const [dueOnly, setDueOnly] = useState(false)
  const [openId, setOpenId] = useState<string | 'new' | null>(null)
  const [modal, setModal] = useState<'import' | 'ads' | null>(null)
  const [closing, setClosing] = useState<Closing | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState('')
  const board = useRef<HTMLDivElement>(null)
  const today = ukDate(new Date())

  const load = useCallback(async () => {
    if (!canEdit) return
    try { setRows(await allLeads()) } catch { setError('Leads could not be loaded. Please refresh the page.') }
    setLoading(false)
  }, [canEdit])
  useEffect(() => { void load() }, [load])
  // Each pipeline opens at its first stage, not wherever the last one was scrolled to.
  useEffect(() => { if (board.current) board.current.scrollLeft = 0 }, [pipe])

  const leads = demo ? ctx.data.DEMO_LEADS : rows
  const open = openId === 'new' ? null : leads.find(l => l.id === openId) ?? null
  const lists = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of leads) if (l.list?.trim()) m.set(l.list.trim(), (m.get(l.list.trim()) || 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [leads])
  const due = leads.filter(l => l.next_action_at && l.next_action_at <= today && !isClosed(l.pipeline, l.stage))
  const needle = q.trim().toLowerCase()
  const shown = leads.filter(l => l.pipeline === pipe
    && (!list || (l.list || '').trim() === list)
    && (!dueOnly || (l.next_action_at && l.next_action_at <= today))
    && (!needle || [l.name, l.org_name, l.for_name, l.email, l.phone, l.notes, l.campaign].some(x => (x || '').toLowerCase().includes(needle))))

  /** Moves a lead, stopping first if winning it has something to offer. */
  async function requestMove(lead: Lead, to: string) {
    if (!canEdit || to === lead.stage) return
    setError(''); setNotice('')
    try {
      if (to === 'Partnered' && !lead.school_id) { setClosing({ lead, to }); return }
      if (to === 'Funded') {
        const offer = await fundedClosing(lead)
        if (offer) { setClosing(offer); return }
      }
      await moveLead(lead, to)
      await load()
    } catch (e) { setError(problem(e, 'It could not be moved.')) }
  }

  async function copyEmails() {
    const emails = shown.map(l => l.email).filter(Boolean) as string[]
    try { await navigator.clipboard.writeText(emails.join(', ')); setCopied(`${emails.length} email address${emails.length === 1 ? '' : 'es'} copied.`) }
    catch { setCopied(emails.join(', ')) }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        {canEdit ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setModal('ads')} style={secondary}><Download size={14} /> Leads from ads</button>
            <button onClick={() => setModal('import')} style={secondary}><Upload size={14} /> Import a spreadsheet</button>
            <button onClick={() => setOpenId('new')} style={primary}><Plus size={14} /> Add lead</button>
          </div>
        ) : <Pill tone="grey">{demo ? 'DEMO · READ-ONLY' : 'READ-ONLY'}</Pill>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <Stat label="New this week" value={leads.filter(l => weekOf(ukDate(l.created_at)) === weekOf(today)).length} sub="Across both pipelines" />
        <button onClick={() => due.length && setDueOnly(v => !v)} disabled={!due.length} style={{ all: 'unset', cursor: due.length ? 'pointer' : 'default', display: 'grid' }} aria-pressed={dueOnly}>
          <Stat label="Follow-ups due" value={due.length} accent={due.length > 0} sub={due.length ? 'Today or overdue · tap to show them' : 'All caught up'} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', padding: 2, background: '#EFEBE6', borderRadius: 9 }}>
          {pipelines.map(p => (
            <button key={p} onClick={() => setPipe(p)} aria-pressed={pipe === p} style={{ border: 'none', padding: '9px 14px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', background: pipe === p ? '#fff' : 'transparent', color: pipe === p ? TP_DARK : MUTED, fontWeight: pipe === p ? 800 : 600 }}>
              {/* Open leads only; the closed stages are on the board too, so it says so. */}
              {PIPELINES[p].label} · {leads.filter(l => l.pipeline === p && !isClosed(p, l.stage)).length} open
            </button>
          ))}
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, organisation, email, notes…" aria-label="Search leads" style={{ ...field, flex: '1 1 200px', width: 'auto', maxWidth: 320 }} />
        {dueOnly && <button onClick={() => setDueOnly(false)} style={chip(true)}>✕ Follow-ups due only</button>}
      </div>

      {lists.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>Lists:</span>
          {lists.map(([name, n]) => <button key={name} onClick={() => setList(list === name ? null : name)} style={chip(list === name)}>{name} · {n}</button>)}
          {list && canEdit && <button onClick={copyEmails} style={chip(false)}>Copy their emails</button>}
          {copied && <span style={{ fontSize: 11.5, color: GREEN }}>{copied}</span>}
        </div>
      )}
      {error && <div role="alert" style={{ fontSize: 12.5, color: TP_RED }}>{error}</div>}
      {notice && <div role="status" style={{ fontSize: 12.5, color: GREEN }}>{notice}</div>}

      <div ref={board} style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }} data-testid="lead-board">
        {stagesOf(pipe).map(stage => {
          const col = shown.filter(l => l.stage === stage).sort((a, b) => (a.next_action_at || '9999').localeCompare(b.next_action_at || '9999') || b.created_at.localeCompare(a.created_at))
          const closed = isClosed(pipe, stage)
          return (
            <div key={stage} onDragOver={e => { if (canEdit) e.preventDefault() }}
              onDrop={e => { const lead = rows.find(l => l.id === e.dataTransfer.getData('text/plain')); if (lead) void requestMove(lead, stage) }}
              style={{ flex: '0 0 220px', background: closed ? PAPER : '#fff', border: `1px solid ${LINE}`, borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>{stage}</div>
                <div style={{ fontSize: 11, color: FAINT, marginLeft: 'auto' }}>{col.length}</div>
              </div>
              {col.map(l => {
                const overdue = !!l.next_action_at && l.next_action_at < today
                const dueToday = l.next_action_at === today
                return (
                  <button key={l.id} onClick={() => setOpenId(l.id)} data-testid="lead-card" draggable={canEdit}
                    onDragStart={e => e.dataTransfer.setData('text/plain', l.id)}
                    style={{ textAlign: 'left', background: '#fff', border: `1px solid ${!closed && overdue ? TP_RED : !closed && dueToday ? AMBER : LINE}`, borderRadius: 9, padding: '8px 10px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{l.org_name || l.name}</span>
                    {l.org_name && <span style={{ fontSize: 11, color: MUTED }}>{[l.name !== l.org_name ? l.name : null, l.for_name].filter(Boolean).join(' · ')}</span>}
                    <span style={{ fontSize: 10.5, color: FAINT }}>{[l.source, ageWords(l.created_at), l.amount_pence ? pounds(l.amount_pence) : null].filter(Boolean).join(' · ')}</span>
                    {l.next_action_at && !closed && <span style={{ fontSize: 10.5, fontWeight: overdue ? 800 : 600, color: overdue ? TP_RED : dueToday ? AMBER : MUTED }}>{overdue ? 'Overdue' : dueToday ? 'Today' : dayLabel(l.next_action_at)}{l.next_action ? `: ${l.next_action}` : ''}</span>}
                    {l.list && <span style={{ fontSize: 10, color: TP_RED, fontWeight: 700 }}>{l.list}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {!loading && leads.length === 0 && (
        <Card style={{ borderStyle: 'dashed', textAlign: 'center', color: MUTED, fontSize: 13 }}>No leads yet — add one, import a spreadsheet, or connect Leads from ads</Card>
      )}

      {openId && <LeadPanel lead={open} pipeline={pipe} lists={lists.map(l => l[0])} schools={schools} canEdit={canEdit} notice={notice}
        onMove={requestMove} onClose={() => { setOpenId(null); setNotice('') }} onChanged={load} />}
      {modal === 'import' && <ImportLeads pipeline={pipe} onClose={() => setModal(null)} onDone={load} />}
      {modal === 'ads' && <AdsLeads onClose={() => setModal(null)} onTest={load} />}
      {closing && <ClosingDialog closing={closing} schools={schools} onClose={() => setClosing(null)} onDone={async done => {
        setClosing(null)
        setNotice(done.notice)
        const { added } = done
        if (added) setAddedSchools(a => [...a, added])
        await load()
        ctx.reload?.()
      }} />}
    </div>
  )
}

function Shell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div role="dialog" aria-label={title} style={{ width: '100%', maxWidth: wide ? 720 : 560, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK, flex: 1, minWidth: 0 }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 8, color: MUTED, width: 32, height: 32, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Winning a lead ───────────────────────────────────────────────────────────
function ClosingDialog({ closing, schools, onClose, onDone }: { closing: Closing; schools: SchoolRef[]; onClose: () => void; onDone: (done: Closed) => Promise<void> }) {
  const { lead } = closing
  const orgName = lead.org_name || lead.name
  const match = matchSchool(orgName, schools)
  const [choice, setChoice] = useState(match?.id ?? 'new')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const funded = closing.to === 'Funded' ? closing : null

  async function run(work: () => Promise<Closed>) {
    setBusy(true); setErr('')
    try { await onDone(await work()) } catch (e) { setErr(problem(e, 'That could not be saved.')); setBusy(false) }
  }
  const justClose = () => run(async () => { await moveLead(lead, closing.to); return { notice: '' } })
  const partner = () => run(async () => {
    const hq = await hqId()
    if (choice === 'new') {
      const school_id = await partnerWithNewSchool(sb(), hq, lead)
      await moveLead(lead, 'Partnered', { school_id })
      return { notice: `✓ Added ${orgName} to Schools`, added: { id: school_id, name: orgName } }
    }
    const school_id = await partnerWithSchool(sb(), hq, lead, choice)
    await moveLead(lead, 'Partnered', { school_id })
    return { notice: `✓ Linked to ${schools.find(s => s.id === choice)?.name ?? 'the school'}` }
  })
  const fund = (mark: boolean) => run(async () => {
    if (!funded) return { notice: '' }
    const hq = await hqId()
    const campaign_id = await recordFunding(sb(), hq, lead, funded.plan)
    if (mark) await markSchoolFunded(sb(), hq, lead.school_id as string, orgName)
    await moveLead(lead, 'Funded', { campaign_id })
    return { notice: mark ? `✓ ${funded.schoolName} marked as funded` : '' }
  })

  return (
    <Shell title={closing.to === 'Partnered' ? `${orgName}: partnered` : `${orgName}: funded`} onClose={onClose}>
      {closing.to === 'Partnered' ? (<>
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55, marginBottom: 10 }}>
          {match ? `${match.name} is already on your Schools list, so it’s selected below.` : 'Add this school to your Schools list, or link it to one that’s already there.'}
          {' '}An existing school only has its empty contact details filled in.
        </div>
        <label><span style={label}>School</span>
          <select value={choice} onChange={e => setChoice(e.target.value)} style={field}>
            <option value="new">Create a new school: {orgName}</option>
            {schools.map(s => <option key={s.id} value={s.id}>Link to {s.name}</option>)}
          </select>
        </label>
      </>) : funded && (
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>
          {funded.plan.kind === 'donate'
            ? `Record ${pounds(lead.amount_pence as number)} from ${orgName} as a donation to ${funded.schoolName}’s campaign?`
            : `${funded.schoolName} has no fundraising campaign. Create one with a ${pounds(lead.amount_pence as number)} target and record ${orgName}’s donation against it?`}
          {funded.outcome && !funded.outcome.meetsTarget && <div style={{ marginTop: 8, color: TP_DARK, fontWeight: 700 }}>{pounds(funded.outcome.total)} of {pounds(funded.outcome.target)} raised — the school stays at fundraising</div>}
        </div>
      )}
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={justClose} disabled={busy} style={secondary}>Just close it</button>
        <button onClick={funded ? () => fund(false) : partner} disabled={busy} style={funded?.outcome?.meetsTarget ? secondary : primary}>
          {busy ? 'Saving…' : !funded ? (choice === 'new' ? 'Create school and close' : 'Link school and close') : 'Record donation and close'}
        </button>
        {funded?.outcome?.meetsTarget && <button onClick={() => fund(true)} disabled={busy} style={primary}>
          {busy ? 'Saving…' : `${funded.plan.kind === 'donate' ? 'Record donation' : 'Create campaign, record donation'} and mark ${funded.schoolName} as funded`}
        </button>}
      </div>
    </Shell>
  )
}

// ── One lead ─────────────────────────────────────────────────────────────────
function LeadPanel({ lead, pipeline, lists, schools, canEdit, notice, onMove, onClose, onChanged }: {
  lead: Lead | null; pipeline: Pipeline; lists: string[]; schools: SchoolRef[]; canEdit: boolean; notice: string
  onMove: (lead: Lead, to: string) => Promise<void>; onClose: () => void; onChanged: () => Promise<void>
}) {
  const [d, setD] = useState<Partial<Lead>>(() => lead ? { ...lead } : { pipeline, stage: 'Enquired', source: 'Other' })
  const [amount, setAmount] = useState(lead?.amount_pence ? String(lead.amount_pence / 100) : '')
  const [events, setEvents] = useState<LeadEvent[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [sure, setSure] = useState(false)
  const set = (k: keyof Lead, v: unknown) => setD(x => ({ ...x, [k]: v }))
  const pipe = (d.pipeline || pipeline) as Pipeline
  const today = ukDate(new Date())
  const leadId = lead?.id, stage = lead?.stage, schoolId = lead?.school_id, campaignId = lead?.campaign_id

  // A move can link a school or campaign while this is open, and Save mustn't undo that.
  useEffect(() => {
    if (leadId && stage) setD(x => withLeadLinks(x, { stage, school_id: schoolId, campaign_id: campaignId }))
  }, [leadId, stage, schoolId, campaignId])

  useEffect(() => {
    if (!canEdit || !leadId) return
    let live = true
    sb().from('impact_lead_events').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
      .then(({ data }) => { if (live) setEvents((data ?? []) as LeadEvent[]) })
    return () => { live = false }
  }, [canEdit, leadId, stage])

  async function run(key: string, work: () => Promise<void>, fallback: string) {
    setBusy(key); setErr('')
    try { await work() } catch (e) { setErr(problem(e, fallback)) }
    setBusy('')
  }
  const fields = () => ({
    pipeline: pipe, name: String(d.name || d.org_name || '').trim(), org_name: String(d.org_name || '').trim() || null, for_name: String(d.for_name || '').trim() || null,
    email: String(d.email || '').trim().toLowerCase() || null, phone: String(d.phone || '').trim() || null,
    source: d.source || null, contact_method: d.contact_method || null, list: String(d.list || '').trim() || null,
    next_action_at: d.next_action_at || null, next_action: String(d.next_action || '').trim() || null,
    amount_pence: amountPence(amount), school_id: d.school_id || null,
  })
  /** Null when the panel's values can be saved; otherwise says what's wrong, on screen. */
  const checked = () => {
    const f = fields()
    const problem = !f.name ? 'Give the lead a name or an organisation.'
      : f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) ? 'That email address does not look right.'
      : amount.trim() && f.amount_pence === null ? 'Enter the amount as a number, like 5000.' : ''
    if (problem) setErr(problem)
    return problem ? null : f
  }
  // The dialogs decide from the school and amount, so what's on screen is saved first.
  const moveTo = (to: string) => {
    const f = checked()
    if (!lead || !f || to === lead.stage) return
    void run('move', async () => {
      const edits = leadEdits(lead, f)
      if (Object.keys(edits).length) { await updateLead(lead.id, edits); await onChanged() }
      await onMove({ ...lead, ...edits }, to)
    }, 'It could not be moved.')
  }
  const save = () => {
    const f = checked()
    if (!f) return
    void run('save', async () => {
      if (lead) { await updateLead(lead.id, f); await onChanged(); onClose(); return }
      const { data: made, error } = await sb().from('impact_leads').insert({ ...f, hq_id: await hqId(), stage: d.stage || 'Enquired', notes: note.trim() ? `[${today}] ${note.trim()}` : null }).select('id, stage').single()
      if (error || !made) throw new Error('It could not be saved.')
      await logEvent(made, { kind: 'created', to_stage: made.stage, points: 0 })
      await onChanged(); onClose()
    }, 'It could not be saved.')
  }
  const addNote = () => {
    if (!lead || !note.trim()) return
    void run('note', async () => {
      const notes = [lead.notes, `[${today}] ${note.trim()}`].filter(Boolean).join('\n').slice(0, 5000)
      await updateLead(lead.id, { notes })
      await logEvent(lead, { kind: 'note', text: note.trim().slice(0, 300), points: 0 })
      setNote(''); await onChanged()
    }, 'The note could not be saved.')
  }
  const followupDone = () => {
    if (!lead?.next_action_at) return
    const at = lead.next_action_at
    void run('done', async () => {
      const text = `Follow-up done${lead.next_action ? `: ${lead.next_action}` : ''}`
      await updateLead(lead.id, { next_action_at: null, next_action: null, notes: [lead.notes, `[${today}] ${text}`].filter(Boolean).join('\n').slice(0, 5000) })
      await logEvent(lead, { kind: 'followup', text, points: at >= today ? FOLLOWUP_POINTS : 0 })
      setD(x => ({ ...x, next_action_at: null, next_action: null })); await onChanged()
    }, 'That could not be saved.')
  }
  const remove = () => {
    if (!lead) return
    if (!sure) { setSure(true); return }
    void run('delete', async () => {
      const { error } = await sb().from('impact_leads').delete().eq('id', lead.id)
      if (error) throw new Error('It could not be deleted.')
      await onChanged(); onClose()
    }, 'It could not be deleted.')
  }

  const off = !canEdit
  const linked = schools.find(s => s.id === d.school_id)?.name
  return (
    <Shell title={lead ? lead.org_name || lead.name : 'Add a lead'} onClose={onClose} wide>
      {lead && (
        <div style={{ marginBottom: 14 }}>
          <div style={label}>Stage</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {stagesOf(pipe).map(st => {
              const on = lead.stage === st
              return <button key={st} onClick={() => moveTo(st)} disabled={off || !!busy} aria-pressed={on} style={{ border: `1px solid ${on ? TP_RED : LINE}`, background: on ? TP_RED : '#fff', color: on ? '#fff' : MUTED, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: on ? 800 : 600, cursor: off ? 'default' : 'pointer', fontFamily: 'inherit' }}>{st}</button>
            })}
          </div>
        </div>
      )}
      <fieldset disabled={off} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <label><span style={label}>{pipe === 'funders' ? 'Funder' : 'School'}</span><input value={d.org_name || ''} onChange={e => set('org_name', e.target.value)} style={field} /></label>
          <label><span style={label}>Contact name</span><input value={d.name || ''} onChange={e => set('name', e.target.value)} style={field} /></label>
          <label><span style={label}>Contact role</span><input value={d.for_name || ''} onChange={e => set('for_name', e.target.value)} placeholder={pipe === 'funders' ? 'e.g. Grants officer' : 'e.g. Headteacher'} style={field} /></label>
          <label><span style={label}>Email</span><input value={d.email || ''} onChange={e => set('email', e.target.value)} type="email" style={field} /></label>
          <label><span style={label}>Phone</span><input value={d.phone || ''} onChange={e => set('phone', e.target.value)} type="tel" style={field} /></label>
          <label><span style={label}>Source</span><select value={d.source || ''} onChange={e => set('source', e.target.value)} style={field}><option value="">—</option>{Array.from(new Set([...SOURCES, d.source].filter(Boolean))).map(s => <option key={s as string}>{s}</option>)}</select></label>
          <label><span style={label}>Last contact by</span><select value={d.contact_method || ''} onChange={e => set('contact_method', e.target.value)} style={field}><option value="">—</option>{CONTACT_METHODS.map(m => <option key={m}>{m}</option>)}</select></label>
          {!lead && <label><span style={label}>Pipeline</span><select value={pipe} onChange={e => set('pipeline', e.target.value)} style={field}>{pipelines.map(p => <option key={p} value={p}>{PIPELINES[p].label}</option>)}</select></label>}
          <label><span style={label}>List (optional)</span><input value={d.list || ''} onChange={e => set('list', e.target.value)} list="lead-lists" placeholder="e.g. Contact next term" style={field} /><datalist id="lead-lists">{lists.map(l => <option key={l} value={l} />)}</datalist></label>
          <label><span style={label}>Next follow-up</span><input type="date" value={d.next_action_at || ''} onChange={e => set('next_action_at', e.target.value || null)} style={field} /></label>
          <label><span style={label}>What to do</span><input value={d.next_action || ''} onChange={e => set('next_action', e.target.value)} placeholder="e.g. Send the proposal" style={field} /></label>
          {pipe === 'funders' && <label><span style={label}>Amount (£)</span><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="e.g. 5000" style={field} /></label>}
          <label><span style={label}>{pipe === 'funders' ? 'For school (optional)' : 'Linked school'}</span><select value={d.school_id || ''} onChange={e => set('school_id', e.target.value || null)} style={field}><option value="">{schools.length ? 'None' : 'No schools yet'}</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        </div>
      </fieldset>
      {notice && <div role="status" style={{ fontSize: 12, color: GREEN, marginTop: 10 }}>{notice}</div>}
      {lead?.campaign_id && linked && <div style={{ fontSize: 12, color: GREEN, marginTop: 10 }}>✓ Donation recorded against {linked}’s campaign</div>}

      {lead && (lead.email || lead.phone || lead.next_action_at) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {lead.phone && <a href={`tel:${lead.phone}`} style={secondary}>Call</a>}
          {lead.phone && <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" style={secondary}>WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} style={secondary}>Email</a>}
          {canEdit && lead.next_action_at && <button onClick={followupDone} disabled={!!busy} style={{ ...secondary, color: GREEN }}>{busy === 'done' ? 'Saving…' : '✓ Follow-up done'}</button>}
        </div>
      )}

      {lead && (lead.message || lead.campaign) && (
        <div style={{ marginTop: 12, background: PAPER, borderRadius: 9, padding: '9px 11px' }}>
          <div style={label}>{lead.message ? `What they said${lead.campaign ? ` · ${lead.campaign}` : ''}` : 'Came from'}</div>
          <div style={{ fontSize: 12.5, color: TP_DARK, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{lead.message || lead.campaign}</div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div style={label}>Notes</div>
        {lead?.notes && <div style={{ fontSize: 12.5, color: TP_DARK, whiteSpace: 'pre-wrap', lineHeight: 1.55, marginBottom: 6, maxHeight: 160, overflowY: 'auto' }}>{notesForDisplay(lead.notes)}</div>}
        {canEdit && <div style={{ display: 'flex', gap: 6 }}>
          <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && lead) addNote() }} placeholder="e.g. Head is keen, governors meet in January" style={field} />
          {lead && <button onClick={addNote} disabled={!note.trim() || !!busy} style={{ ...secondary, flexShrink: 0 }}>{busy === 'note' ? '…' : 'Add note'}</button>}
        </div>}
      </div>

      {lead && events.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={label}>History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
            {events.map(e => (
              <div key={e.id} style={{ fontSize: 11.5, color: MUTED }}>
                {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })} · {e.kind === 'stage' ? `${e.from_stage} → ${e.to_stage}` : e.kind === 'created' ? `Added${e.text ? ` (${e.text})` : ''}` : e.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginTop: 10 }}>{err}</div>}
      {canEdit && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {lead && <button onClick={remove} disabled={!!busy} style={{ ...secondary, color: TP_RED }}>{sure ? 'Delete, including notes?' : 'Delete'}</button>}
          <button onClick={save} disabled={!!busy} style={{ ...primary, marginLeft: 'auto' }}>{busy === 'save' ? 'Saving…' : lead ? 'Save' : 'Add lead'}</button>
        </div>
      )}
    </Shell>
  )
}

// ── Importing a spreadsheet ──────────────────────────────────────────────────
const COLUMN_LABEL: Record<ImportColumn, string> = { org_name: 'School / organisation', name: 'Contact name', for_name: 'Contact role', email: 'Email', phone: 'Phone', stage: 'Status / stage', notes: 'Notes', source: 'Source', contact_method: 'Contact method', list: 'List', created: 'Date added', next_action_at: 'Next follow-up', amount: 'Amount (£)', skip: 'Leave out' }

function ImportLeads({ pipeline, onClose, onDone }: { pipeline: Pipeline; onClose: () => void; onDone: () => Promise<void> }) {
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
      const all = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false, defval: '' })
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
  }).filter(o => o.name || o.org_name || o.email || o.phone)

  const go = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/impact/leads/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pipeline: pipe, rows: records }) })
      const d = await r.json()
      if (!r.ok) setMsg({ text: d.error || 'The import did not work.', bad: true })
      else { setMsg({ text: `✓ ${d.added} lead${d.added === 1 ? '' : 's'} brought in.${d.skipped ? ` ${d.skipped} row${d.skipped === 1 ? '' : 's'} had no name, organisation, email or phone.` : ''}` }); await onDone(); setRows([]); setHeaders([]) }
    } catch { setMsg({ text: 'You appear to be offline. Nothing was imported.', bad: true }) }
    setBusy(false)
  }

  const small: React.CSSProperties = { ...field, width: 'auto', padding: '6px 7px', fontSize: 12 }
  return (
    <Shell title="Import a spreadsheet of leads" onClose={onClose} wide>
      <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>An Excel or CSV file with one lead per row and headings in the first row. You check which column is which before anything is saved, and a status column is matched to your stages.</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <select value={pipe} onChange={e => setPipe(e.target.value as Pipeline)} style={small} aria-label="Pipeline">{pipelines.map(p => <option key={p} value={p}>Into {PIPELINES[p].label}</option>)}</select>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={e => void read(e.target.files?.[0])} style={{ fontSize: 12, color: MUTED }} />
      </div>
      {headers.length > 0 && (<>
        <div style={{ overflowX: 'auto', marginTop: 12, border: `1px solid ${LINE}`, borderRadius: 9 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%', color: TP_DARK }}>
            <thead>
              <tr>{headers.map((h, i) => <th key={i} style={{ padding: 6, textAlign: 'left', borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>{h || `Column ${i + 1}`}</th>)}</tr>
              <tr>{headers.map((_, i) => <th key={i} style={{ padding: 6, borderBottom: `1px solid ${LINE}` }}>
                <select value={map[i]} onChange={e => setMap(m => m.map((x, j) => (j === i ? e.target.value as ImportColumn : x)))} style={small} aria-label={`Column ${i + 1} holds`}>
                  {(Object.keys(COLUMN_LABEL) as ImportColumn[]).map(c => <option key={c} value={c}>{COLUMN_LABEL[c]}</option>)}
                </select></th>)}</tr>
            </thead>
            <tbody>{rows.slice(0, 4).map((r, i) => <tr key={i}>{headers.map((_, j) => <td key={j} style={{ padding: 6, color: map[j] === 'skip' ? FAINT : TP_DARK, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(r[j] ?? '')}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
          {records.length} of {rows.length} rows will come in.
          {map.includes('stage') && ` Stages: ${Object.entries(records.reduce<Record<string, number>>((a, r) => { const s = r.stage || stagesOf(pipe)[0]; a[s] = (a[s] || 0) + 1; return a }, {})).map(([s, n]) => `${s} ${n}`).join(' · ')}.`}
        </div>
      </>)}
      {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? TP_RED : GREEN, marginTop: 10 }}>{msg.text}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={secondary}>Close</button>
        <button onClick={go} disabled={busy || !records.length} style={{ ...primary, opacity: busy || !records.length ? 0.6 : 1 }}>{busy ? 'Bringing in…' : `Bring in ${records.length || ''} leads`}</button>
      </div>
    </Shell>
  )
}

// ── Leads from ads ───────────────────────────────────────────────────────────
function AdsLeads({ onClose, onTest }: { onClose: () => void; onTest: () => Promise<void> }) {
  const [hook, setHook] = useState<{ url: string | null; lastUsedAt: string | null } | null>(null)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [busy, setBusy] = useState('')
  const [sure, setSure] = useState(false)
  useEffect(() => {
    let live = true
    fetch('/api/impact/leads/hook').then(r => r.json()).then(d => {
      if (!live) return
      if (d.error) { setHook({ url: null, lastUsedAt: null }); setMsg({ text: d.error, bad: true }) } else setHook(d)
    }).catch(() => { if (live) setHook({ url: null, lastUsedAt: null }) })
    return () => { live = false }
  }, [])
  const make = async (rotate = false) => {
    if (rotate && !sure) { setSure(true); return }
    setBusy('make'); setMsg(null); setSure(false)
    try {
      const r = await fetch('/api/impact/leads/hook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotate }) })
      const d = await r.json()
      if (!r.ok) setMsg({ text: d.error || 'It could not be made.', bad: true }); else setHook(d)
    } catch { setMsg({ text: 'You appear to be offline.', bad: true }) }
    setBusy('')
  }
  const test = async () => {
    if (!hook?.url) return
    setBusy('test'); setMsg(null)
    try {
      const r = await fetch(hook.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: 'Test Lead', school_name: 'Test School', email: 'test.lead@example.com', phone_number: '07700 900000', campaign_name: 'Test from Lumio' }) })
      const d = await r.json()
      setMsg(r.ok ? { text: d.created ? '✓ A test lead has arrived at Enquired in Schools.' : '✓ Received. The test lead was already there, so a note was added to it.' } : { text: d.error || 'The test did not arrive.', bad: true })
      await onTest()
    } catch { setMsg({ text: 'The test could not be sent.', bad: true }) }
    setBusy('')
  }
  const copy = async () => { if (hook?.url) { try { await navigator.clipboard.writeText(hook.url); setMsg({ text: 'Address copied.' }) } catch { setMsg({ text: hook.url }) } } }
  const step: React.CSSProperties = { fontSize: 12.5, color: MUTED, lineHeight: 1.55, margin: '4px 0' }
  const status = msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? TP_RED : GREEN, marginTop: 8 }}>{msg.text}</div>
  return (
    <Shell title="Leads from your ads" onClose={onClose}>
      <div style={step}>New enquiries from Meta lead ads or your website form can arrive here on their own, at <strong>Enquired</strong>, instead of in a spreadsheet. Keep the automation you already have and point it at your private address.</div>
      {!hook ? <div style={step}>Loading…</div> : hook.url ? (<>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
          <input readOnly value={hook.url} aria-label="Your private address" onFocus={e => e.target.select()} style={field} />
          <button onClick={copy} style={{ ...primary, flexShrink: 0 }}>Copy</button>
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>{hook.lastUsedAt ? `Last lead received ${new Date(hook.lastUsedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}` : 'No leads received yet.'} Keep this address private: anyone who has it can add leads.</div>
        <ol style={{ ...step, paddingLeft: 18, marginTop: 12 }}>
          <li><strong>In Zapier:</strong> trigger “Facebook Lead Ads → New Lead”, then action “Webhooks by Zapier → POST”, URL = the address above, payload type JSON. Map the lead’s name, school, email, phone and answers (any field names work).</li>
          <li><strong>In Make:</strong> “Facebook Lead Ads → Watch leads”, then “HTTP → Make a request”, method POST, the address above, body type JSON with the lead’s fields.</li>
          <li>For a funder enquiry, add a field <code>pipeline</code> = <code>funders</code> (or put “grant”, “sponsor” or “foundation” in the form name) and it lands in Funders.</li>
        </ol>
        {status}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={test} disabled={!!busy} style={secondary}>{busy === 'test' ? 'Sending…' : 'Send a test lead'}</button>
          <button onClick={() => make(true)} disabled={!!busy} style={secondary}>{sure ? 'The old address stops working. Replace it?' : 'Make a new address'}</button>
        </div>
      </>) : (<>
        {status}
        <button onClick={() => make(false)} disabled={!!busy} style={{ ...primary, marginTop: 12 }}>{busy ? 'Making it…' : 'Make my private address'}</button>
      </>)}
    </Shell>
  )
}
