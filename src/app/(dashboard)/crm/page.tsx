'use client'

import React, { useState } from 'react'
import {
  Phone, Heart, TrendingUp, AlertCircle, Star, Search, Download,
  Sparkles, Users, RotateCcw, Plus, X, ChevronRight, ChevronDown,
  Mail, Calendar, FileText, MessageSquare, Zap, Activity,
  CheckCircle2, Clock, ArrowRight, Filter,
} from 'lucide-react'
import { PageShell, StatCard, QuickActions, Badge } from '@/components/page-ui'
import { parseNum } from '@/components/chart-ui'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactStatus = 'lead' | 'trial' | 'customer' | 'cold' | 'churned'
type DealStage     = 'lead' | 'qualified' | 'demo' | 'proposal' | 'closing' | 'won' | 'lost'
type DealHeat      = 'hot' | 'warm' | 'cold'
type ActivityType  = 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'conversion'

interface Contact {
  id: string; first_name: string; last_name: string; email: string; phone: string
  job_title: string; company: string; status: ContactStatus; source: string
  owner: string; notes: string; last_contacted: string; created_at: string
}

interface Deal {
  id: string; contact_id: string; company: string; value_annual: number
  stage: DealStage; heat: DealHeat; owner: string; next_action: string
  next_action_date: string; notes: string; created_at: string
  won_at?: string; lost_at?: string; lost_reason?: string
}

interface ActivityLog {
  id: string; contact_id: string; deal_id?: string; type: ActivityType
  title: string; body: string; logged_by: string; created_at: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const CONTACTS: Contact[] = [
  { id: 'c1', first_name: 'Helen',   last_name: 'Park',     email: 'helen.park@greenfield.sch.uk',    phone: '01234 567890', job_title: 'Headteacher',         company: 'Greenfield Academy',   status: 'customer', source: 'referral',  owner: 'Dan Marsh',   notes: 'Key decision maker. Happy with Lumio Core.', last_contacted: '2026-03-20', created_at: '2025-09-01' },
  { id: 'c2', first_name: 'Tom',     last_name: 'Wright',   email: 'tom.wright@bramblehill.org.uk',   phone: '01432 112233', job_title: 'CEO',                  company: 'Bramble Hill Trust',   status: 'customer', source: 'demo',      owner: 'Sophie Bell', notes: 'Enterprise account. Renewal May 2026.',      last_contacted: '2026-03-18', created_at: '2025-08-14' },
  { id: 'c3', first_name: 'Lisa',    last_name: 'Chen',     email: 'l.chen@hopscotch.sch.uk',         phone: '0161 445 9900', job_title: 'School Business Mgr', company: 'Hopscotch Learning',   status: 'customer', source: 'inbound',   owner: 'Raj Patel',   notes: 'Raised concern about pricing last month.',   last_contacted: '2026-03-05', created_at: '2025-10-22' },
  { id: 'c4', first_name: 'Ben',     last_name: 'Armitage', email: 'b.armitage@oakridge.co.uk',       phone: '0113 287 6541', job_title: 'Operations Director', company: 'Oakridge Schools Ltd', status: 'trial',    source: 'event',     owner: 'Dan Marsh',   notes: 'In trial — day 9. Very engaged.',           last_contacted: '2026-03-22', created_at: '2026-03-14' },
  { id: 'c5', first_name: 'Amy',     last_name: 'Hughes',   email: 'a.hughes@crestview.ac.uk',        phone: '029 2045 6789', job_title: 'Principal',           company: 'Crestview Academy',    status: 'lead',     source: 'outbound',  owner: 'Sophie Bell', notes: 'Interested in Lumio Pro. Awaiting proposal.', last_contacted: '2026-03-19', created_at: '2026-03-01' },
  { id: 'c6', first_name: 'Paul',    last_name: 'Norton',   email: 'p.norton@elmfield.org',           phone: '0131 552 3344', job_title: 'Finance Director',    company: 'Elmfield Institute',   status: 'lead',     source: 'referral',  owner: 'Raj Patel',   notes: 'Discovery call done. Following up.',        last_contacted: '2026-03-15', created_at: '2026-02-28' },
  { id: 'c7', first_name: 'Gary',    last_name: 'Stone',    email: 'g.stone@sunfield.org.uk',         phone: '01473 991122', job_title: 'Headteacher',         company: 'Sunfield Trust',       status: 'cold',     source: 'inbound',   owner: 'Dan Marsh',   notes: 'No response in 6 weeks. Try different channel.', last_contacted: '2026-02-08', created_at: '2025-12-10' },
  { id: 'c8', first_name: 'Priya',   last_name: 'Sharma',   email: 'p.sharma@torchbearer.org.uk',     phone: '01512 334455', job_title: 'Deputy Head',         company: 'Torchbearer Trust',    status: 'customer', source: 'demo',      owner: 'Sophie Bell', notes: 'Key contact left — new contact needed.',    last_contacted: '2026-03-02', created_at: '2025-07-30' },
]

const DEALS: Deal[] = [
  { id: 'd1', contact_id: 'c5', company: 'Crestview Academy',    value_annual: 19200,  stage: 'proposal', heat: 'hot',  owner: 'Sophie Bell', next_action: 'Follow up on proposal',    next_action_date: '2026-03-25', notes: 'Sent proposal 18 Mar. Awaiting response.',  created_at: '2026-03-01' },
  { id: 'd2', contact_id: 'c4', company: 'Oakridge Schools Ltd', value_annual: 55000,  stage: 'demo',     heat: 'hot',  owner: 'Dan Marsh',   next_action: 'Demo call at 11am today',   next_action_date: '2026-03-24', notes: 'Trial converting well. Needs custom quote.', created_at: '2026-03-14' },
  { id: 'd3', contact_id: 'c6', company: 'Elmfield Institute',   value_annual: 33400,  stage: 'qualified',heat: 'warm', owner: 'Raj Patel',   next_action: 'Send product comparison',   next_action_date: '2026-03-26', notes: 'Qualified on discovery call.',              created_at: '2026-02-28' },
  { id: 'd4', contact_id: 'c1', company: 'Greenfield Academy',   value_annual: 42000,  stage: 'closing',  heat: 'hot',  owner: 'Dan Marsh',   next_action: 'Review contract draft',     next_action_date: '2026-03-24', notes: 'In final negotiation. Legal reviewing.',    created_at: '2025-12-01' },
  { id: 'd5', contact_id: 'c2', company: 'Bramble Hill Trust',   value_annual: 76000,  stage: 'closing',  heat: 'warm', owner: 'Sophie Bell', next_action: 'Send renewal pack',         next_action_date: '2026-04-01', notes: 'Renewal in May. Early renewal discussion.', created_at: '2026-01-15' },
]

const ACTIVITY: ActivityLog[] = [
  { id: 'a1',  contact_id: 'c4', deal_id: 'd2', type: 'call',         title: 'Discovery call — Oakridge',     body: 'Spoke with Ben for 40 mins. Very positive. Trial going well. Demo booked for 24 Mar.',          logged_by: 'Dan Marsh',   created_at: '2026-03-22T09:15:00Z' },
  { id: 'a2',  contact_id: 'c1', deal_id: 'd4', type: 'stage_change', title: 'Greenfield moved to Closing',   body: 'Deal advanced from Negotiation to Closing after legal confirmed contract template.',            logged_by: 'Dan Marsh',   created_at: '2026-03-21T14:00:00Z' },
  { id: 'a3',  contact_id: 'c5', deal_id: 'd1', type: 'email',        title: 'Proposal sent — Crestview',     body: 'Full proposal PDF sent including pricing tiers, onboarding timeline, and case studies.',        logged_by: 'Sophie Bell', created_at: '2026-03-18T11:30:00Z' },
  { id: 'a4',  contact_id: 'c3', deal_id: undefined, type: 'note',    title: 'Pricing concern — Hopscotch',   body: 'Lisa mentioned budget is tight this year. May need to offer a Growth plan discount to retain.', logged_by: 'Raj Patel',   created_at: '2026-03-17T16:00:00Z' },
  { id: 'a5',  contact_id: 'c6', deal_id: 'd3', type: 'meeting',      title: 'Discovery call — Elmfield',     body: 'Paul joined with their CFO. Strong interest in Lumio Pro. Needs competitor comparison.', logged_by: 'Raj Patel',   created_at: '2026-03-15T10:00:00Z' },
  { id: 'a6',  contact_id: 'c2', deal_id: 'd5', type: 'call',         title: 'Renewal prep call — Bramble',   body: 'Tom keen to renew. Wants to upgrade from Growth to Enterprise. Sent new pricing.',            logged_by: 'Sophie Bell', created_at: '2026-03-12T09:00:00Z' },
  { id: 'a7',  contact_id: 'c8', deal_id: undefined, type: 'note',    title: 'Contact change — Torchbearer', body: 'Priya is leaving at end of month. Need to identify new primary contact urgently.',             logged_by: 'Sophie Bell', created_at: '2026-03-10T13:00:00Z' },
  { id: 'a8',  contact_id: 'c4', deal_id: 'd2', type: 'email',        title: 'Trial welcome email sent',      body: 'Automated onboarding sequence fired. Day 1 email with setup guide and video walkthrough.',   logged_by: 'System',      created_at: '2026-03-14T08:00:00Z' },
  { id: 'a9',  contact_id: 'c1', deal_id: 'd4', type: 'conversion',   title: 'Greenfield confirmed verbal yes', body: 'Helen confirmed by phone they are proceeding. Contract being drafted by legal team.',       logged_by: 'Dan Marsh',   created_at: '2026-03-08T15:30:00Z' },
  { id: 'a10', contact_id: 'c7', deal_id: undefined, type: 'email',   title: 'Re-engagement attempt — Sunfield', body: 'Sent re-engagement email to Gary. Last contact was 6 weeks ago. No reply yet.',          logged_by: 'Dan Marsh',   created_at: '2026-03-05T10:00:00Z' },
]

// ─── Sequences ────────────────────────────────────────────────────────────────

const SEQUENCES = [
  {
    name: 'Trial Expiry Sequence', trigger: 'Trial workspace created', active: true, contacts_in: 3,
    steps: [
      { day: 7,  action: 'Email: Mid-trial check-in + feature highlights' },
      { day: 12, action: 'Email: "3 days left" — what to do before trial ends' },
      { day: 14, action: 'Email + call task: Trial expiry, book conversion call' },
    ],
  },
  {
    name: 'No-Reply Chaser', trigger: 'Lead goes 7 days without response', active: true, contacts_in: 2,
    steps: [
      { day: 7,  action: 'Email: Gentle follow-up with value reminder' },
      { day: 14, action: 'Email: Different angle — case study or ROI calc' },
      { day: 21, action: 'Task: Assign to senior rep for personal outreach' },
    ],
  },
  {
    name: 'New Customer Onboarding', trigger: 'Deal marked Won', active: true, contacts_in: 4,
    steps: [
      { day: 0,  action: 'Email: Welcome + access credentials + onboarding call invite' },
      { day: 3,  action: 'Email: Getting started guide + video walkthroughs' },
      { day: 14, action: 'Call task: 2-week check-in with Customer Success' },
      { day: 30, action: 'Email: 30-day review request + NPS survey' },
    ],
  },
  {
    name: 'Renewal Reminder Sequence', trigger: '90 days before renewal date', active: true, contacts_in: 2,
    steps: [
      { day: 0,  action: 'Email: "90 days to renewal" — value summary and highlights' },
      { day: 30, action: 'Email: Early renewal incentive offer' },
      { day: 60, action: 'Call task: Account review call' },
      { day: 76, action: 'Email: Final renewal reminder — 14 days to go' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: DealStage[] = ['lead', 'qualified', 'demo', 'proposal', 'closing']
const STAGE_LABELS: Record<string, string> = { lead: 'Lead', qualified: 'Qualified', demo: 'Demo Booked', proposal: 'Proposal Sent', closing: 'Closing', won: 'Won', lost: 'Lost' }
const STATUS_COLORS: Record<ContactStatus, { bg: string; text: string }> = {
  lead:     { bg: 'rgba(13,148,136,0.1)',   text: '#0D9488' },
  trial:    { bg: 'rgba(108,63,197,0.12)',  text: '#A78BFA' },
  customer: { bg: 'rgba(34,197,94,0.1)',    text: '#22C55E' },
  cold:     { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF' },
  churned:  { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444' },
}
const HEAT_COLORS: Record<DealHeat, { bg: string; text: string }> = {
  hot:  { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444' },
  warm: { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B' },
  cold: { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF' },
}
const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone, email: Mail, meeting: Calendar, note: FileText,
  stage_change: ChevronRight, conversion: CheckCircle2,
}
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: '#0D9488', email: '#6C3FC5', meeting: '#F59E0B', note: '#9CA3AF',
  stage_change: '#60A5FA', conversion: '#22C55E',
}

function Badge2({ status }: { status: string }) {
  const lc = status.toLowerCase() as ContactStatus
  const c = STATUS_COLORS[lc] ?? { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF' }
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: c.bg, color: c.text }}>{status}</span>
}

function HeatBadge({ heat }: { heat: DealHeat }) {
  const c = HEAT_COLORS[heat]
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: c.bg, color: c.text }}>{heat}</span>
}

function contactName(c: Contact) { return `${c.first_name} ${c.last_name}` }
function daysAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Pipeline', 'Contacts', 'Deals', 'Activity', 'Sequences'] as const
type Tab = typeof TABS[number]

// ─── Modal helpers ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>{title}</h2>
          <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: '#9CA3AF' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── New Contact Modal ────────────────────────────────────────────────────────

function NewContactModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', job_title: '', company: '', status: 'lead', source: 'inbound', owner: 'Dan Marsh' })
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title="New Contact" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="First name"><Input value={form.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name"><Input value={form.last_name} onChange={set('last_name')} /></Field>
        <Field label="Email"><Input value={form.email} onChange={set('email')} placeholder="name@school.org.uk" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="01234 567890" /></Field>
        <Field label="Job title"><Input value={form.job_title} onChange={set('job_title')} /></Field>
        <Field label="Company"><Input value={form.company} onChange={set('company')} /></Field>
        <Field label="Status"><Select value={form.status} onChange={set('status')} options={['lead','trial','customer','cold','churned']} /></Field>
        <Field label="Source"><Select value={form.source} onChange={set('source')} options={['inbound','outbound','referral','demo','event']} /></Field>
        <Field label="Owner"><Select value={form.owner} onChange={set('owner')} options={['Dan Marsh','Sophie Bell','Raj Patel']} /></Field>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel</button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Save Contact</button>
      </div>
    </Modal>
  )
}

// ─── New Deal Modal ───────────────────────────────────────────────────────────

function NewDealModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ company: '', value: '', stage: 'lead', heat: 'warm', owner: 'Dan Marsh', next_action: '' })
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title="New Deal" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Company"><Input value={form.company} onChange={set('company')} /></Field>
        <Field label="Annual value (£)"><Input value={form.value} onChange={set('value')} placeholder="25000" /></Field>
        <Field label="Stage"><Select value={form.stage} onChange={set('stage')} options={['lead','qualified','demo','proposal','closing']} /></Field>
        <Field label="Heat"><Select value={form.heat} onChange={set('heat')} options={['hot','warm','cold']} /></Field>
        <Field label="Owner"><Select value={form.owner} onChange={set('owner')} options={['Dan Marsh','Sophie Bell','Raj Patel']} /></Field>
        <Field label="Next action"><Input value={form.next_action} onChange={set('next_action')} /></Field>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel</button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>Create Deal</button>
      </div>
    </Modal>
  )
}

// ─── Log Activity Modal ───────────────────────────────────────────────────────

function LogActivityModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ type: 'call', contact: 'Helen Park', title: '', notes: '' })
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title="Log Activity" onClose={onClose}>
      <div className="space-y-3 mb-4">
        <Field label="Type"><Select value={form.type} onChange={set('type')} options={['call','email','meeting','note','stage_change','conversion']} /></Field>
        <Field label="Contact"><Select value={form.contact} onChange={set('contact')} options={CONTACTS.map(c => contactName(c))} /></Field>
        <Field label="Title"><Input value={form.title} onChange={set('title')} placeholder="e.g. Follow-up call" /></Field>
        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} placeholder="What happened?" rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel</button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Log Activity</button>
      </div>
    </Modal>
  )
}

// ─── Lost Reason Modal ────────────────────────────────────────────────────────

function LostReasonModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title="Mark Deal as Lost" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>Recording a lost reason helps improve future win rates.</p>
      <Field label="Lost reason">
        <Select value={reason} onChange={setReason} options={['', 'Price too high', 'Chose competitor', 'No budget', 'No decision', 'Poor fit', 'Timing']} />
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel</button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Mark Lost</button>
      </div>
    </Modal>
  )
}

// ─── Contact Side Panel ───────────────────────────────────────────────────────

function ContactPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const activity = ACTIVITY.filter(a => a.contact_id === contact.id)
  const deals = DEALS.filter(d => d.contact_id === contact.id)
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md flex flex-col" style={{ backgroundColor: '#111318', borderLeft: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1F2937' }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>{contactName(contact)}</h2>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{contact.job_title} · {contact.company}</p>
        </div>
        <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Details */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Contact Details</p>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}><Mail size={13} style={{ color: '#9CA3AF' }} />{contact.email}</div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}><Phone size={13} style={{ color: '#9CA3AF' }} />{contact.phone}</div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
            <Badge2 status={contact.status} />
            <span style={{ color: '#9CA3AF' }}>Source: {contact.source}</span>
            <span style={{ color: '#9CA3AF' }}>Owner: {contact.owner}</span>
          </div>
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[{ icon: Phone, label: 'Call' }, { icon: Mail, label: 'Email' }, { icon: Calendar, label: 'Meet' }, { icon: FileText, label: 'Note' }].map(({ icon: Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-1 rounded-xl py-3 text-xs" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#9CA3AF' }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
        {/* Notes */}
        {contact.notes && (
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)' }}>
            <p className="text-xs" style={{ color: '#C4B5FD' }}>{contact.notes}</p>
          </div>
        )}
        {/* Associated deals */}
        {deals.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Deals</p>
            {deals.map(d => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl p-3 mb-2" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{d.company}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>£{d.value_annual.toLocaleString()} · {STAGE_LABELS[d.stage]}</p>
                </div>
                <HeatBadge heat={d.heat} />
              </div>
            ))}
          </div>
        )}
        {/* Activity */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Activity Timeline</p>
          {activity.length === 0 && <p className="text-xs" style={{ color: '#9CA3AF' }}>No activity yet.</p>}
          {activity.map(a => {
            const Icon = ACTIVITY_ICONS[a.type]
            return (
              <div key={a.id} className="flex gap-3 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #1F2937' }}>
                  <Icon size={12} style={{ color: ACTIVITY_COLORS[a.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{a.title}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{a.body}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{daysAgo(a.created_at)} · {a.logged_by}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Deal Side Panel ──────────────────────────────────────────────────────────

function DealPanel({ deal, onClose, onMarkLost }: { deal: Deal; onClose: () => void; onMarkLost: () => void }) {
  const contact = CONTACTS.find(c => c.id === deal.contact_id)
  const activity = ACTIVITY.filter(a => a.deal_id === deal.id)
  const STAGE_LIST: DealStage[] = ['lead', 'qualified', 'demo', 'proposal', 'closing', 'won']
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md flex flex-col" style={{ backgroundColor: '#111318', borderLeft: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1F2937' }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>{deal.company}</h2>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>£{deal.value_annual.toLocaleString()} ARR · {contact ? contactName(contact) : '—'}</p>
        </div>
        <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Stage progress */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Stage Progress</p>
          <div className="flex items-center gap-1 flex-wrap">
            {STAGE_LIST.map((s, i) => {
              const stages = STAGE_LIST
              const currentIdx = stages.indexOf(deal.stage)
              const isActive = s === deal.stage
              const isPast   = i < currentIdx
              return (
                <React.Fragment key={s}>
                  <span className="text-xs px-2 py-1 rounded" style={{
                    backgroundColor: isActive ? '#6C3FC5' : isPast ? 'rgba(108,63,197,0.15)' : '#1F2937',
                    color: isActive ? '#F9FAFB' : isPast ? '#A78BFA' : '#6B7280',
                  }}>{STAGE_LABELS[s]}</span>
                  {i < STAGE_LIST.length - 1 && <ChevronRight size={10} style={{ color: '#374151' }} />}
                </React.Fragment>
              )
            })}
          </div>
        </div>
        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span style={{ color: '#9CA3AF' }}>Heat</span><HeatBadge heat={deal.heat} /></div>
          <div className="flex justify-between"><span style={{ color: '#9CA3AF' }}>Owner</span><span style={{ color: '#F9FAFB' }}>{deal.owner}</span></div>
          <div className="flex justify-between"><span style={{ color: '#9CA3AF' }}>Next action</span><span style={{ color: '#F9FAFB' }}>{deal.next_action}</span></div>
          <div className="flex justify-between"><span style={{ color: '#9CA3AF' }}>Due</span><span style={{ color: '#F9FAFB' }}>{deal.next_action_date}</span></div>
        </div>
        {/* Notes */}
        {deal.notes && (
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)' }}>
            <p className="text-xs" style={{ color: '#C4B5FD' }}>{deal.notes}</p>
          </div>
        )}
        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 rounded-lg py-2 text-xs font-medium" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
            Mark Won
          </button>
          <button onClick={onMarkLost} className="flex-1 rounded-lg py-2 text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            Mark Lost
          </button>
        </div>
        {/* Activity */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Activity</p>
          {activity.length === 0 && <p className="text-xs" style={{ color: '#9CA3AF' }}>No activity logged.</p>}
          {activity.map(a => {
            const Icon = ACTIVITY_ICONS[a.type]
            return (
              <div key={a.id} className="flex gap-3 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #1F2937' }}>
                  <Icon size={12} style={{ color: ACTIVITY_COLORS[a.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{a.title}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{a.body}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{daysAgo(a.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const overviewStats = [
  { label: 'Total Contacts',      value: '171',     trend: '+4',    trendDir: 'up'   as const, trendGood: true,  icon: Users,       sub: 'in CRM'           },
  { label: 'MRR',                 value: '£28,400', trend: '+6%',   trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp,  sub: 'vs last month'    },
  { label: 'Open Deals',          value: '5',       trend: '+1',    trendDir: 'up'   as const, trendGood: true,  icon: Activity,    sub: 'in pipeline'      },
  { label: 'Churn Rate',          value: '2.1%',    trend: '-0.2%', trendDir: 'down' as const, trendGood: true,  icon: AlertCircle, sub: 'below 3% target'  },
  { label: 'Avg Deal Size',       value: '£45,120', trend: '+8%',   trendDir: 'up'   as const, trendGood: true,  icon: Star,        sub: 'annual value'     },
]

const overviewHighlights = [
  '3 trials expiring this week — £8,400 combined value at risk of not converting',
  'Pipeline velocity up 18% — deals now closing in an average of 11 days',
  'Greenfield Academy verbal yes confirmed — contract with legal, closing imminent',
  '10 accounts due for renewal in the next 30 days representing £42,000 ARR',
  'Churn rate at 2.1% — below the 3% target for the fourth consecutive month',
]

function OverviewTab({ onNewContact, onNewDeal }: { onNewContact: () => void; onNewDeal: () => void }) {
  const actions = [
    { label: 'New Contact',    icon: Plus     },
    { label: 'New Deal',       icon: TrendingUp },
    { label: 'Log Call',       icon: Phone    },
    { label: 'Send NPS',       icon: Star     },
    { label: 'Chase Renewal',  icon: RotateCcw },
    { label: 'Dept Insights',  icon: Sparkles },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {overviewStats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <QuickActions items={actions} />

      {/* AI Highlights */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>CRM</span>
        </div>
        <ul className="space-y-2.5">
          {overviewHighlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline snapshot */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Pipeline Snapshot</p>
            <button onClick={onNewDeal} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}><Plus size={12} /> Add Deal</button>
          </div>
          {DEALS.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < DEALS.length - 1 ? '1px solid #111318' : undefined }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{d.company}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>£{d.value_annual.toLocaleString()} · {d.owner}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA' }}>{STAGE_LABELS[d.stage]}</span>
              <HeatBadge heat={d.heat} />
            </div>
          ))}
        </div>

        {/* Recent contacts */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Contacts</p>
            <button onClick={onNewContact} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}><Plus size={12} /> Add</button>
          </div>
          {CONTACTS.slice(0, 5).map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < 4 ? '1px solid #111318' : undefined }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                {c.first_name[0]}{c.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{contactName(c)}</p>
                <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{c.company}</p>
              </div>
              <Badge2 status={c.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Activity</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#111318' }}>
          {ACTIVITY.slice(0, 6).map(a => {
            const Icon = ACTIVITY_ICONS[a.type]
            const contact = CONTACTS.find(c => c.id === a.contact_id)
            return (
              <div key={a.id} className="flex gap-4 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #1F2937' }}>
                  <Icon size={13} style={{ color: ACTIVITY_COLORS[a.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{a.title}</p>
                  <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{contact ? `${contactName(contact)} · ${contact.company}` : ''}</p>
                </div>
                <p className="text-xs shrink-0" style={{ color: '#6B7280' }}>{daysAgo(a.created_at)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline Tab (Kanban) ────────────────────────────────────────────────────

function PipelineTab({ onNewDeal }: { onNewDeal: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Deal Pipeline</p>
        <button onClick={onNewDeal} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
          <Plus size={14} /> New Deal
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageDeals = DEALS.filter(d => d.stage === stage)
          const total = stageDeals.reduce((s, d) => s + d.value_annual, 0)
          return (
            <div key={stage} className="flex-shrink-0 w-64 rounded-xl flex flex-col" style={{ backgroundColor: '#0D0E14', border: '1px solid #1F2937' }}>
              {/* Column header */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{STAGE_LABELS[stage]}</p>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{stageDeals.length}</span>
                </div>
                {total > 0 && <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>£{total.toLocaleString()}</p>}
              </div>

              {/* Deal cards */}
              <div className="flex-1 p-2 space-y-2">
                {stageDeals.map(d => {
                  const contact = CONTACTS.find(c => c.id === d.contact_id)
                  const created = new Date(d.created_at)
                  const daysIn = Math.floor((Date.now() - created.getTime()) / 86400000)
                  return (
                    <div key={d.id} className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: '#F9FAFB' }}>{d.company}</p>
                          {contact && <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{contactName(contact)}</p>}
                        </div>
                        <HeatBadge heat={d.heat} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: '#0D9488' }}>£{d.value_annual.toLocaleString()}</p>
                        <span className="text-xs" style={{ color: '#6B7280' }}>{daysIn}d in stage</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>{d.owner.split(' ').map(n => n[0]).join('')}</span>
                        <button className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA' }}>
                          Next stage <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {stageDeals.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: '#374151' }}>No deals</p>
                )}
                {/* Add deal in column */}
                <button onClick={onNewDeal} className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs" style={{ color: '#6B7280', border: '1px dashed #1F2937' }}>
                  <Plus size={12} /> Add deal
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

const CONTACT_FILTERS = ['All', 'Customers', 'Trials', 'Leads', 'Cold'] as const
type ContactFilter = typeof CONTACT_FILTERS[number]

function ContactsTab({ onNewContact, onSelectContact }: { onNewContact: () => void; onSelectContact: (c: Contact) => void }) {
  const [filter, setFilter] = useState<ContactFilter>('All')
  const [search, setSearch] = useState('')

  const filtered = CONTACTS.filter(c => {
    if (filter === 'Customers' && c.status !== 'customer') return false
    if (filter === 'Trials'    && c.status !== 'trial')    return false
    if (filter === 'Leads'     && c.status !== 'lead')     return false
    if (filter === 'Cold'      && c.status !== 'cold')     return false
    if (search) {
      const q = search.toLowerCase()
      if (!contactName(c).toLowerCase().includes(q) && !c.company.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-3" style={{ color: '#9CA3AF' }} />
          <input type="text" placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-lg py-2 pl-8 pr-3 text-sm" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB', width: 220 }} />
        </div>
        <div className="flex gap-1">
          {CONTACT_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: filter === f ? '#0D9488' : '#111318', color: filter === f ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${filter === f ? '#0D9488' : '#1F2937'}` }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={onNewContact} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <Plus size={14} /> New Contact
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Name', 'Company', 'Job Title', 'Status', 'Last Contacted', 'Owner', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} onClick={() => onSelectContact(c)} className="cursor-pointer transition-colors"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #0D0E14' : undefined }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D0E14'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <span className="font-medium" style={{ color: '#F9FAFB' }}>{contactName(c)}</span>
                  </div>
                </td>
                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{c.company}</td>
                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{c.job_title}</td>
                <td className="px-5 py-3"><Badge2 status={c.status} /></td>
                <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{daysAgo(c.last_contacted)}</td>
                <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{c.owner}</td>
                <td className="px-5 py-3"><ChevronRight size={14} style={{ color: '#6B7280' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Deals Tab ────────────────────────────────────────────────────────────────

function DealsTab({ onNewDeal, onSelectDeal }: { onNewDeal: () => void; onSelectDeal: (d: Deal) => void }) {
  const [stageFilter, setStageFilter] = useState<string>('All')
  const [heatFilter,  setHeatFilter]  = useState<string>('All')

  const filtered = DEALS.filter(d => {
    if (stageFilter !== 'All' && d.stage !== stageFilter) return false
    if (heatFilter  !== 'All' && d.heat  !== heatFilter)  return false
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: '#9CA3AF' }} />
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            <option value="All">All stages</option>
            {PIPELINE_STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <select value={heatFilter} onChange={e => setHeatFilter(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            <option value="All">All heat</option>
            {['hot','warm','cold'].map(h => <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={onNewDeal} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
          <Plus size={14} /> New Deal
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Company', 'Contact', 'Stage', 'Value', 'Heat', 'Owner', 'Next Action', 'Days Open', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => {
              const contact = CONTACTS.find(c => c.id === d.contact_id)
              const daysOpen = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000)
              return (
                <tr key={d.id} onClick={() => onSelectDeal(d)} className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #0D0E14' : undefined }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D0E14'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{d.company}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{contact ? contactName(contact) : '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA' }}>{STAGE_LABELS[d.stage]}</span></td>
                  <td className="px-4 py-3 font-medium text-xs" style={{ color: '#0D9488' }}>£{d.value_annual.toLocaleString()}</td>
                  <td className="px-4 py-3"><HeatBadge heat={d.heat} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{d.owner}</td>
                  <td className="px-4 py-3 text-xs max-w-32 truncate" style={{ color: '#9CA3AF' }}>{d.next_action}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{daysOpen}d</td>
                  <td className="px-4 py-3"><ChevronRight size={14} style={{ color: '#6B7280' }} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

const ACTIVITY_FILTERS = ['All', 'Calls', 'Emails', 'Meetings', 'Notes', 'Stage changes', 'Conversions'] as const
const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  'Calls': 'call', 'Emails': 'email', 'Meetings': 'meeting',
  'Notes': 'note', 'Stage changes': 'stage_change', 'Conversions': 'conversion',
}

function ActivityTab({ onLogActivity }: { onLogActivity: () => void }) {
  const [filter, setFilter] = useState('All')

  const filtered = ACTIVITY.filter(a => {
    if (filter === 'All') return true
    return a.type === ACTIVITY_TYPE_MAP[filter]
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1">
          {ACTIVITY_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: filter === f ? '#1F2937' : 'transparent', color: filter === f ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${filter === f ? '#374151' : 'transparent'}` }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={onLogActivity} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <Plus size={14} /> Log Activity
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(a => {
          const Icon = ACTIVITY_ICONS[a.type]
          const contact = CONTACTS.find(c => c.id === a.contact_id)
          return (
            <div key={a.id} className="flex gap-4 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid #1F2937' }}>
                <Icon size={14} style={{ color: ACTIVITY_COLORS[a.type] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{a.title}</p>
                  <p className="text-xs shrink-0" style={{ color: '#6B7280' }}>{daysAgo(a.created_at)}</p>
                </div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{a.body}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {contact ? <span style={{ color: '#9CA3AF' }}>{contactName(contact)} · {contact.company}</span> : null}
                  {' · '}{a.logged_by}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sequences Tab ────────────────────────────────────────────────────────────

function SequencesTab() {
  const [active, setActive] = useState<Record<number, boolean>>(Object.fromEntries(SEQUENCES.map((s, i) => [i, s.active])))

  return (
    <div className="space-y-4">
      {SEQUENCES.map((seq, i) => (
        <div key={seq.name} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{seq.name}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Trigger: {seq.trigger}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA' }}>
                {seq.contacts_in} contacts in sequence
              </span>
              {/* Toggle */}
              <button
                onClick={() => setActive(a => ({ ...a, [i]: !a[i] }))}
                className="flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ backgroundColor: active[i] ? '#0D9488' : '#374151', padding: 2 }}>
                <span className="h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: active[i] ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex flex-col gap-2">
              {seq.steps.map((step, j) => (
                <div key={j} className="flex items-start gap-3">
                  <div className="flex h-6 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                    D{step.day}
                  </div>
                  <p className="text-xs pt-0.5" style={{ color: '#D1D5DB' }}>{step.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [tab, setTab]                     = useState<Tab>('Overview')
  const [showNewContact, setShowNewContact] = useState(false)
  const [showNewDeal,    setShowNewDeal]    = useState(false)
  const [showLogActivity,setShowLogActivity]= useState(false)
  const [showLostReason, setShowLostReason] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedDeal,    setSelectedDeal]    = useState<Deal    | null>(null)

  return (
    <PageShell>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: '1px solid #1F2937' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? '#F9FAFB' : '#9CA3AF',
              borderBottom: tab === t ? '2px solid #0D9488' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tab === 'Overview'   && <OverviewTab   onNewContact={() => setShowNewContact(true)} onNewDeal={() => setShowNewDeal(true)} />}
        {tab === 'Pipeline'   && <PipelineTab   onNewDeal={() => setShowNewDeal(true)} />}
        {tab === 'Contacts'   && <ContactsTab   onNewContact={() => setShowNewContact(true)} onSelectContact={setSelectedContact} />}
        {tab === 'Deals'      && <DealsTab      onNewDeal={() => setShowNewDeal(true)} onSelectDeal={setSelectedDeal} />}
        {tab === 'Activity'   && <ActivityTab   onLogActivity={() => setShowLogActivity(true)} />}
        {tab === 'Sequences'  && <SequencesTab  />}
      </div>

      {/* Modals */}
      {showNewContact  && <NewContactModal  onClose={() => setShowNewContact(false)} />}
      {showNewDeal     && <NewDealModal     onClose={() => setShowNewDeal(false)} />}
      {showLogActivity && <LogActivityModal onClose={() => setShowLogActivity(false)} />}
      {showLostReason  && <LostReasonModal  onClose={() => setShowLostReason(false)} />}

      {/* Side panels */}
      {selectedContact && <ContactPanel contact={selectedContact} onClose={() => setSelectedContact(null)} />}
      {selectedDeal    && <DealPanel    deal={selectedDeal}       onClose={() => setSelectedDeal(null)}    onMarkLost={() => { setSelectedDeal(null); setShowLostReason(true) }} />}
    </PageShell>
  )
}
