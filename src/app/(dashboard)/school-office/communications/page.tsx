'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  MessageSquare, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronLeft, Mail, Phone, Users, Clock,
  FileText, Send, Eye, Paperclip, BarChart2, Sparkles,
} from 'lucide-react'
import { PageShell, SectionCard, StatCard } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import Link from 'next/link'

// ─── Supabase ──────────────────────────────────────────────────────────────────

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CommRecord {
  id: string
  subject: string
  audience: string
  audience_filter: string | null
  send_email: boolean
  send_sms: boolean
  status: string
  recipient_count: number
  email_sent: number
  email_opened: number
  sms_sent: number
  send_at: string | null
  sent_at: string | null
  created_at: string
}

interface CommResult {
  status: string
  id: string | null
  audience: string
  channels_fired: string[]
  scheduled_for: string | null
}

interface Template {
  slug: string
  title: string
  category: string
  subject: string
  body: string
}

// ─── Built-in Templates (mirrors DB seeds) ─────────────────────────────────────

const BUILTIN_TEMPLATES: Template[] = [
  {
    slug: 'term-dates',
    title: 'Term Dates Reminder',
    category: 'Admin',
    subject: 'Important: Term Dates {{school_year}}',
    body: `Dear Parent/Carer,

Please find below the key term dates for {{school_year}}:

Autumn Term: {{autumn_start}} – {{autumn_end}}
Spring Term: {{spring_start}} – {{spring_end}}
Summer Term: {{summer_start}} – {{summer_end}}

Please make note of these dates when planning family holidays. We are unable to authorise absence during term time except in exceptional circumstances.

Kind regards,
{{head_teacher_name}}
{{school_name}}`,
  },
  {
    slug: 'absence-notification',
    title: 'Absence Notification',
    category: 'Attendance',
    subject: 'Attendance Alert: {{pupil_name}}',
    body: `Dear {{contact_name}},

We are writing to inform you that {{pupil_name}} was absent from school on {{absence_date}}.

If this absence was not previously communicated to us, please contact the school office on {{school_phone}} as soon as possible.

Kind regards,
{{school_name}} Attendance Team`,
  },
  {
    slug: 'parents-evening',
    title: 'Parents\' Evening Invitation',
    category: 'Events',
    subject: 'Parents\' Evening — Book Your Appointment',
    body: `Dear Parent/Carer of {{pupil_name}},

We would like to invite you to our upcoming Parents' Evening on {{event_date}} between {{event_start}} and {{event_end}}.

To book your appointment, please {{booking_instructions}}.

We look forward to seeing you.

Kind regards,
{{school_name}}`,
  },
  {
    slug: 'trip-permission',
    title: 'Trip Permission Slip',
    category: 'Events',
    subject: 'Permission Required: {{trip_name}}',
    body: `Dear Parent/Carer,

We are pleased to inform you that {{pupil_name}}'s class will be visiting {{trip_destination}} on {{trip_date}}.

• Departure: {{departure_time}}  •  Return: {{return_time}}
• Cost: {{trip_cost}}
• What to bring: {{what_to_bring}}

Please give permission by {{deadline_date}}.

Kind regards,
{{teacher_name}}, {{school_name}}`,
  },
  {
    slug: 'newsletter',
    title: 'School Newsletter',
    category: 'Newsletter',
    subject: '{{school_name}} Newsletter — {{month_year}}',
    body: `Dear Families,

Welcome to this month's newsletter. Here's what has been happening at {{school_name}}:

{{newsletter_intro}}

UPCOMING EVENTS
{{events_list}}

ACHIEVEMENTS
{{achievements}}

REMINDERS
{{reminders}}

Kind regards,
{{head_teacher_name}}
{{school_name}}`,
  },
]

// ─── Constants ─────────────────────────────────────────────────────────────────

const AUDIENCES = ['All Parents', 'Year Group', 'Class', 'Custom List']
const YEAR_GROUPS = [
  'Nursery', 'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4',
  'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11',
]

const CATEGORY_COLOURS: Record<string, { bg: string; color: string }> = {
  'Admin':      { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
  'Attendance': { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
  'Events':     { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
  'Newsletter': { bg: 'rgba(139,92,246,0.12)',  color: '#A855F7' },
}

// ─── Compose Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void
  onSent: (record: CommRecord, result: CommResult) => void
}

function ComposeModal({ onClose, onSent }: ModalProps) {
  const [view, setView]             = useState<'templates' | 'compose'>('templates')
  const [subject, setSubject]       = useState('')
  const [body, setBody]             = useState('')
  const [templateId, setTemplateId] = useState<string | undefined>()
  const [audience, setAudience]     = useState('All Parents')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [sendEmail, setSendEmail]   = useState(true)
  const [sendSms, setSendSms]       = useState(false)
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [preview, setPreview]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [result, setResult]         = useState<CommResult | null>(null)

  function applyTemplate(t: Template) {
    setSubject(t.subject)
    setBody(t.body)
    setTemplateId(t.slug)
    setView('compose')
  }

  async function handleSend() {
    if (!subject.trim()) { setError('Subject is required.'); return }
    if (!body.trim()) { setError('Message body is required.'); return }
    if (!sendEmail && !sendSms) { setError('Select at least one channel (email or SMS).'); return }
    if (scheduleMode && !scheduleDate) { setError('Please choose a date to schedule.'); return }

    const sendAt = scheduleMode && scheduleDate
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : undefined

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/workflows/school/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          template_id: templateId,
          audience,
          audience_filter: (audience === 'Year Group' || audience === 'Class') ? audienceFilter : undefined,
          send_email: sendEmail,
          send_sms: sendSms,
          send_at: sendAt,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }

      const r = data as CommResult
      setResult(r)
      onSent({
        id: r.id ?? crypto.randomUUID(),
        subject: subject.trim(),
        audience,
        audience_filter: audienceFilter || null,
        send_email: sendEmail,
        send_sms: sendSms,
        status: sendAt ? 'Scheduled' : 'Sent',
        recipient_count: 0,
        email_sent: 0,
        email_opened: 0,
        sms_sent: 0,
        send_at: sendAt ?? null,
        sent_at: sendAt ? null : new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, r)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (result) {
    const sent = result.status === 'sent'
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="w-full max-w-md rounded-2xl p-7" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: sent ? 'rgba(13,148,136,0.15)' : 'rgba(59,130,246,0.15)' }}>
              {sent ? <Send size={28} style={{ color: '#0D9488' }} /> : <Clock size={28} style={{ color: '#60A5FA' }} />}
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>
                {sent ? 'Message Sent' : 'Message Scheduled'}
              </h3>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                {sent
                  ? `Sent to ${result.audience}`
                  : `Scheduled for ${result.scheduled_for ? new Date(result.scheduled_for).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}`}
              </p>
            </div>
            <div className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Channels triggered</p>
              <div className="flex flex-col gap-2">
                {result.channels_fired.includes('email') && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} style={{ color: '#0D9488' }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>Email sent via Resend (n8n)</span>
                  </div>
                )}
                {result.channels_fired.includes('sms') && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} style={{ color: '#0D9488' }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>SMS sent via n8n workflow</span>
                  </div>
                )}
                {result.channels_fired.length === 0 && (
                  <div className="flex items-center gap-2">
                    <FileText size={13} style={{ color: '#9CA3AF' }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>Saved — n8n webhook not configured</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="w-full rounded-lg py-2.5 text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-2xl rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center gap-2">
            {view === 'compose' && (
              <button type="button" onClick={() => setView('templates')}
                className="mr-1 rounded-lg p-1 hover:bg-gray-800 transition-colors">
                <ChevronLeft size={16} style={{ color: '#9CA3AF' }} />
              </button>
            )}
            <MessageSquare size={18} style={{ color: '#0D9488' }} />
            <h2 className="text-base font-semibold" style={{ color: '#F9FAFB' }}>
              {view === 'templates' ? 'Choose a Template' : 'Compose Message'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-800">
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {/* ── TEMPLATE PICKER ─────────────────────────────────────────────── */}
          {view === 'templates' && (
            <div className="px-6 py-5">
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                Start from a template or write from scratch.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {BUILTIN_TEMPLATES.map(t => {
                  const c = CATEGORY_COLOURS[t.category] ?? CATEGORY_COLOURS['Admin']
                  return (
                    <button key={t.slug} type="button" onClick={() => applyTemplate(t)}
                      className="rounded-xl p-4 text-left transition-colors hover:bg-gray-800/50"
                      style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: c.bg, color: c.color }}>{t.category}</span>
                        <ChevronRight size={13} style={{ color: '#374151' }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{t.title}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6B7280' }}>{t.subject}</p>
                    </button>
                  )
                })}
                {/* Blank */}
                <button type="button" onClick={() => { setTemplateId(undefined); setSubject(''); setBody(''); setView('compose') }}
                  className="rounded-xl p-4 text-left transition-colors hover:bg-gray-800/50"
                  style={{ backgroundColor: '#07080F', border: '1px dashed #374151' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} style={{ color: '#6B7280' }} />
                    <span className="text-xs" style={{ color: '#6B7280' }}>Blank</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>Write from scratch</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5563' }}>Custom subject and message</p>
                </button>
              </div>
            </div>
          )}

          {/* ── COMPOSE ─────────────────────────────────────────────────────── */}
          {view === 'compose' && (
            <div className="flex flex-col gap-4 px-6 py-5">
              {/* Preview toggle */}
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setPreview(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: preview ? '#0D9488' : '#6B7280' }}>
                  <Eye size={13} /> {preview ? 'Edit' : 'Preview'}
                </button>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Message subject…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Message *</label>
                {preview ? (
                  <div className="w-full min-h-[180px] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap"
                    style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#D1D5DB', lineHeight: '1.7' }}>
                    {body || <span style={{ color: '#4B5563' }}>No content yet</span>}
                  </div>
                ) : (
                  <textarea value={body} onChange={e => setBody(e.target.value)}
                    rows={10} placeholder="Write your message here…"
                    className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none font-mono"
                    style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', lineHeight: '1.7' }} />
                )}
                <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
                  Use {'{{variable}}'} placeholders — these are filled by n8n before sending.
                </p>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Audience *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {AUDIENCES.map(a => {
                    const sel = audience === a
                    return (
                      <button key={a} type="button" onClick={() => setAudience(a)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: sel ? 'rgba(13,148,136,0.2)' : 'rgba(55,65,81,0.4)',
                          color: sel ? '#0D9488' : '#9CA3AF',
                          border: `1px solid ${sel ? '#0D9488' : '#374151'}`,
                        }}>
                        {a}
                      </button>
                    )
                  })}
                </div>
                {audience === 'Year Group' && (
                  <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }}>
                    <option value="">Select year group…</option>
                    {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                {audience === 'Class' && (
                  <input value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
                    placeholder="Class name (e.g. 4B, Year 6 Badgers)"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB' }} />
                )}
              </div>

              {/* Channels */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Send Via</label>
                <div className="flex gap-3">
                  {[
                    { id: 'email', label: 'Email', icon: Mail, val: sendEmail, set: setSendEmail },
                    { id: 'sms', label: 'SMS', icon: Phone, val: sendSms, set: setSendSms },
                  ].map(({ id, label, icon: Icon, val, set: setVal }) => (
                    <button key={id} type="button" onClick={() => setVal(!val)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: val ? 'rgba(13,148,136,0.15)' : 'rgba(55,65,81,0.3)',
                        color: val ? '#0D9488' : '#9CA3AF',
                        border: `1px solid ${val ? '#0D9488' : '#374151'}`,
                      }}>
                      <Icon size={14} />
                      {label}
                      {val && <CheckCircle2 size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Schedule</label>
                  <button type="button" onClick={() => setScheduleMode(v => !v)}
                    className="relative h-5 w-9 rounded-full transition-colors"
                    style={{ backgroundColor: scheduleMode ? '#0D9488' : '#374151' }}>
                    <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                      style={{ left: scheduleMode ? '1.125rem' : '0.125rem' }} />
                  </button>
                </div>
                {scheduleMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark' }} />
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{ backgroundColor: '#07080F', border: '1px solid #374151', color: '#F9FAFB', colorScheme: 'dark' }} />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                  <p className="text-xs" style={{ color: '#FCA5A5' }}>{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1 pb-1">
                <button type="button" onClick={onClose}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: 'rgba(55,65,81,0.4)', color: '#9CA3AF', border: '1px solid #374151' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleSend} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                  {submitting
                    ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    : scheduleMode
                    ? <><Clock size={14} /> Schedule</>
                    : <><Send size={14} /> Send Now</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Status & channel badges ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, { bg: string; color: string }> = {
    'Draft':     { bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF' },
    'Scheduled': { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
    'Sent':      { bg: 'rgba(13,148,136,0.12)',  color: '#0D9488' },
    'Failed':    { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
  }
  const c = colours[status] ?? colours['Draft']
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}>{status}</span>
  )
}

function ChannelPills({ email, sms }: { email: boolean; sms: boolean }) {
  return (
    <div className="flex gap-1">
      {email && <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>Email</span>}
      {sms   && <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>SMS</span>}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const supabase = useSupabase()
  const [showModal, setShowModal] = useState(false)
  const [comms, setComms]         = useState<CommRecord[]>([])
  const [loading, setLoading]     = useState(true)
  const [sentCount, setSentCount] = useState(0)
  const [scheduledCount, setScheduledCount] = useState(0)
  const [openRate, setOpenRate]   = useState(0)
  const [totalRecipients, setTotalRecipients] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('school_communications')
          .select('id, subject, audience, audience_filter, send_email, send_sms, status, recipient_count, email_sent, email_opened, sms_sent, send_at, sent_at, created_at')
          .order('created_at', { ascending: false })
          .limit(50)

        if (data) {
          const records = data as CommRecord[]
          setComms(records)
          setSentCount(records.filter(c => c.status === 'Sent').length)
          setScheduledCount(records.filter(c => c.status === 'Scheduled').length)
          const totSent = records.reduce((s, c) => s + c.email_sent, 0)
          const totOpened = records.reduce((s, c) => s + c.email_opened, 0)
          setOpenRate(totSent > 0 ? Math.round((totOpened / totSent) * 100) : 0)
          setTotalRecipients(records.reduce((s, c) => s + c.recipient_count, 0))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function handleSent(record: CommRecord) {
    setComms(prev => [record, ...prev])
    if (record.status === 'Sent') setSentCount(c => c + 1)
    if (record.status === 'Scheduled') setScheduledCount(c => c + 1)
  }

  const stats = [
    {
      label: 'Messages Sent',
      value: String(sentCount),
      trend: 'total sent',
      trendDir: 'up' as const,
      trendGood: true,
      icon: Send,
      sub: 'all time',
    },
    {
      label: 'Scheduled',
      value: String(scheduledCount),
      trend: scheduledCount > 0 ? 'queued' : 'none pending',
      trendDir: scheduledCount > 0 ? 'up' as const : 'down' as const,
      trendGood: true,
      icon: Clock,
      sub: 'awaiting send',
    },
    {
      label: 'Open Rate',
      value: `${openRate}%`,
      trend: openRate >= 70 ? 'strong' : openRate >= 40 ? 'average' : 'low',
      trendDir: openRate >= 50 ? 'up' as const : 'down' as const,
      trendGood: openRate >= 50,
      icon: BarChart2,
      sub: 'email opens',
    },
    {
      label: 'Total Recipients',
      value: String(loading ? '…' : totalRecipients),
      trend: 'reached',
      trendDir: 'up' as const,
      trendGood: true,
      icon: Users,
      sub: 'across all sends',
    },
  ]

  const scheduledComms = comms.filter(c => c.status === 'Scheduled')
  const sentComms      = comms.filter(c => c.status === 'Sent')

  return (
    <PageShell>
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/school-office"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'rgba(107,114,128,0.1)', color: '#9CA3AF', border: '1px solid #374151' }}>
          <ChevronLeft size={11} /> School Office
        </Link>
        <ChevronRight size={12} style={{ color: '#374151' }} />
        <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: 'rgba(13,148,136,0.08)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}>
          <MessageSquare size={12} /> Parent Communications
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Parent Communication Blast</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Send emails and SMS to parents — 5 built-in templates, audience targeting, delivery tracking
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
          <Plus size={15} />
          New Message
        </button>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* Scheduled */}
      {scheduledComms.length > 0 && (
        <SectionCard title={`Scheduled (${scheduledComms.length})`}>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {scheduledComms.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{c.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    To: {c.audience}{c.audience_filter ? ` · ${c.audience_filter}` : ''}
                    {c.send_at ? ` · Sends ${new Date(c.send_at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ChannelPills email={c.send_email} sms={c.send_sms} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Sent history */}
      <SectionCard title="Message History">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin" style={{ color: '#9CA3AF' }} />
          </div>
        ) : sentComms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <MessageSquare size={28} style={{ color: '#374151' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>No messages sent yet</p>
            <button onClick={() => setShowModal(true)} className="text-xs font-medium" style={{ color: '#0D9488' }}>
              Send your first message →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Subject', 'Audience', 'Channel', 'Sent', 'Opens', 'Status'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                {sentComms.map(c => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 text-sm font-medium max-w-[200px] truncate" style={{ color: '#F9FAFB' }}>{c.subject}</td>
                    <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                      {c.audience}{c.audience_filter ? ` · ${c.audience_filter}` : ''}
                    </td>
                    <td className="py-3 pr-4"><ChannelPills email={c.send_email} sms={c.send_sms} /></td>
                    <td className="py-3 pr-4 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: c.email_opened > 0 ? '#0D9488' : '#6B7280' }}>
                      {c.email_sent > 0 ? `${c.email_opened}/${c.email_sent}` : '—'}
                    </td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Templates library */}
      <SectionCard title="Template Library">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {BUILTIN_TEMPLATES.map(t => {
            const c = CATEGORY_COLOURS[t.category] ?? CATEGORY_COLOURS['Admin']
            return (
              <div key={t.slug} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: c.bg, color: c.color }}>{t.category}</span>
                  <Paperclip size={12} style={{ color: '#374151' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{t.title}</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6B7280' }}>{t.subject}</p>
                <button type="button" onClick={() => setShowModal(true)}
                  className="mt-3 text-xs font-medium" style={{ color: '#0D9488' }}>
                  Use template →
                </button>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {showModal && <ComposeModal onClose={() => setShowModal(false)} onSent={handleSent} />}
    </PageShell>
  )
}
