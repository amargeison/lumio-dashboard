'use client'

// Communications on a live portal (brief 4): Inbox, Newsletters, Automations, Audiences.
// The demo keeps its canned tabs (CommsTab). Everything here is the org's real data:
//   Inbox        threads from impact_messages — email replies to reply+<org>@…, family-app
//                replies — answered from the thread, optionally assigned to a coach
//   Newsletters  the builder, "Send me a test", schedule or send, and the results
//   Automations  five switches, each with its preview of who would get it today
//   Audiences    every audience with how many can be reached by email
// Reads and drafts go straight to Supabase as the HQ (RLS + hq_id); sending goes through
// the server routes, which make every consent decision.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Inbox as InboxIcon, Newspaper, Zap, Target, Send, Mail, MessageSquare, Smartphone, UserCheck, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Card, SectionTitle, Pill, EmptyState, formField, formLabel, buttonPrimary, buttonSecondary } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { LiveSendWizard } from './LiveSendWizard'
import { currentHq, impactFetch } from '@/lib/impact/org-scope'
import { NewslettersTab, type CampaignListRow } from './NewslettersTab'
import { AutomationsTab } from './AutomationsTab'
import type { Audience } from '@/lib/impact/audiences'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface MessageRow {
  id: string; thread_key: string; family_id: string | null; channel: 'email' | 'sms' | 'app'; direction: 'in' | 'out'
  subject: string | null; body: string; status: string; detail: string | null; created_at: string; read_at: string | null; from_address: string | null
}
interface ThreadRow { thread_key: string; family_id: string | null; assigned_staff_id: string | null; closed_at: string | null }

type Sub = 'inbox' | 'newsletters' | 'automations' | 'audiences'
const CH_ICON = { email: Mail, sms: Smartphone, app: MessageSquare } as const
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })

/** Unread inbound messages for this org — for the sidebar badge. */
export function useCommsUnread(enabled: boolean): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let stop = false
    const load = async () => {
      try {
        const db = sb(); const hq = await currentHq(db)
        const { count } = await db.from('impact_messages').select('id', { count: 'exact', head: true }).eq('hq_id', hq).eq('direction', 'in').is('read_at', null)
        if (!stop) setN(count ?? 0)
      } catch { /* the badge just stays as it was */ }
    }
    load()
    const t = setInterval(load, 60_000)
    const again = () => load()
    window.addEventListener('impact-comms-read', again)
    return () => { stop = true; clearInterval(t); window.removeEventListener('impact-comms-read', again) }
  }, [enabled])
  return n
}

export function LiveComms() {
  const ctx = useImpact()
  const [sub, setSub] = useState<Sub>('inbox')
  const [wizard, setWizard] = useState(false)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [threads, setThreads] = useState<ThreadRow[]>([])
  const [campaigns, setCampaigns] = useState<CampaignListRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [newFor, setNewFor] = useState<Audience | null>(null)

  const reload = useCallback(async () => {
    try {
      const db = sb(); const hq = await currentHq(db)
      const [m, t, c] = await Promise.all([
        db.from('impact_messages').select('id, thread_key, family_id, channel, direction, subject, body, status, detail, created_at, read_at, from_address').eq('hq_id', hq).order('created_at', { ascending: false }).limit(1500),
        db.from('impact_threads').select('thread_key, family_id, assigned_staff_id, closed_at').eq('hq_id', hq),
        db.from('impact_campaigns').select('id, name, status, subject, preheader, sections, audience, scheduled_at, sent_at, counts, error, created_at, updated_at').eq('hq_id', hq).eq('kind', 'newsletter').order('created_at', { ascending: false }).limit(200),
      ])
      if (m.error || t.error || c.error) throw new Error((m.error ?? t.error ?? c.error)!.message)
      setMessages((m.data ?? []) as MessageRow[]); setThreads((t.data ?? []) as ThreadRow[]); setCampaigns((c.data ?? []) as CampaignListRow[]); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t load your messages.') } finally { setLoaded(true) }
  }, [])
  useEffect(() => { reload() }, [reload])

  const unread = messages.filter(m => m.direction === 'in' && !m.read_at).length
  const SUBTABS: { id: Sub; label: string; icon: typeof InboxIcon }[] = [
    { id: 'inbox', label: 'Inbox', icon: InboxIcon }, { id: 'newsletters', label: 'Newsletters', icon: Newspaper },
    { id: 'automations', label: 'Automations', icon: Zap }, { id: 'audiences', label: 'Audiences', icon: Target },
  ]
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUBTABS.map(t => {
            const Icon = t.icon, active = sub === t.id
            return (
              <button key={t.id} onClick={() => setSub(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: active ? TP_DARK : '#fff', color: active ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                <Icon size={14} /> {t.label}{t.id === 'inbox' && unread > 0 && <span style={{ background: TP_RED, color: '#fff', borderRadius: 999, fontSize: 9.5, fontWeight: 900, padding: '1px 6px' }}>{unread}</span>}
              </button>
            )
          })}
        </div>
        <button onClick={() => setWizard(true)} style={buttonPrimary}><Send size={14} /> Send message</button>
      </div>
      {error && <Card><div style={{ fontSize: 12.5, color: TP_RED }}>{error}</div></Card>}
      {sub === 'inbox' && <InboxTab loaded={loaded} messages={messages} threads={threads} onChange={reload} staff={ctx.data.TP_COACHES.map(c => ({ id: c.id, name: c.name }))} />}
      {sub === 'newsletters' && <NewslettersTab campaigns={campaigns} loaded={loaded} onChange={reload} startFor={newFor} onStarted={() => setNewFor(null)} />}
      {sub === 'automations' && <AutomationsTab />}
      {sub === 'audiences' && <AudiencesTab onNewsletter={a => { setNewFor(a); setSub('newsletters') }} />}
      {wizard && <LiveSendWizard onClose={() => { setWizard(false); reload() }} />}
    </div>
  )
}

// ─── Inbox ──────────────────────────────────────────────────────────────────
function InboxTab({ loaded, messages, threads, onChange, staff }: { loaded: boolean; messages: MessageRow[]; threads: ThreadRow[]; onChange: () => void; staff: { id: string; name: string }[] }) {
  const { people } = useImpact()
  const families = useMemo(() => new Map((people?.families ?? []).map(f => [f.id, f])), [people])
  const [open, setOpen] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const byThread = useMemo(() => {
    const m = new Map<string, MessageRow[]>()
    for (const x of messages) { if (!m.has(x.thread_key)) m.set(x.thread_key, []); m.get(x.thread_key)!.push(x) }
    return m
  }, [messages])
  const list = [...byThread.entries()]
    .filter(([, ms]) => showAll || ms.some(x => x.direction === 'in'))
    .map(([key, ms]) => ({ key, ms, last: ms[0], unread: ms.filter(x => x.direction === 'in' && !x.read_at).length, thread: threads.find(t => t.thread_key === key) }))
    .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at))
  const nameOf = (key: string, ms: MessageRow[]) => {
    const fid = ms.find(x => x.family_id)?.family_id
    return (fid && families.get(fid)?.guardian) || ms.find(x => x.from_address)?.from_address || (key.startsWith('email:') ? key.slice(6) : 'Family')
  }

  if (open && byThread.get(open)) {
    const ms = [...byThread.get(open)!].reverse()
    return <ThreadView threadKey={open} name={nameOf(open, ms)} messages={ms} thread={threads.find(t => t.thread_key === open)} staff={staff} onBack={() => setOpen(null)} onChange={onChange} />
  }
  const unread = messages.filter(m => m.direction === 'in' && !m.read_at).length
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <SectionTitle sub="Replies by email and from the family app, one thread per family">{unread ? `Inbox · ${unread} unread` : 'Inbox'}</SectionTitle>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowAll(v => !v)} style={{ ...buttonSecondary, padding: '6px 11px', fontSize: 11.5 }}>{showAll ? 'Only conversations with replies' : 'Show everything sent too'}</button>
          <button onClick={onChange} aria-label="Refresh" style={{ ...buttonSecondary, padding: '6px 9px' }}><RefreshCw size={13} /></button>
        </div>
      </div>
      {!loaded && <div style={{ fontSize: 12.5, color: '#6B6560' }}>Loading…</div>}
      {loaded && !list.length && <EmptyState compact icon={InboxIcon} title="No replies yet" sub="When a family replies to one of your emails, or messages you from the family app, it lands here." />}
      <div style={{ display: 'grid', gap: 7 }}>
        {list.map(t => {
          const Icon = CH_ICON[t.last.channel]
          const coach = staff.find(s => s.id === t.thread?.assigned_staff_id)
          return (
            <button key={t.key} onClick={() => setOpen(t.key)} style={{ background: t.unread ? '#FDF3F3' : '#F7F5F2', border: 'none', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>
                  {nameOf(t.key, t.ms)}{t.unread > 0 && <span style={{ marginLeft: 7, background: TP_RED, color: '#fff', borderRadius: 999, fontSize: 9.5, fontWeight: 900, padding: '1px 6px' }}>{t.unread}</span>}
                  {t.key.startsWith('email:') && <span style={{ marginLeft: 7 }}><Pill tone="amber">Not a family here</Pill></span>}
                  {coach && <span style={{ marginLeft: 7 }}><Pill tone="dark">{coach.name}</Pill></span>}
                  {t.thread?.closed_at && <span style={{ marginLeft: 7 }}><Pill tone="green">Done</Pill></span>}
                </div>
                <div style={{ fontSize: 10.5, color: '#8A847E', display: 'flex', alignItems: 'center', gap: 5 }}><Icon size={11} />{when(t.last.created_at)}</div>
              </div>
              <div style={{ fontSize: 12, color: '#5B554F', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.last.direction === 'out' ? 'You: ' : ''}{t.last.body || t.last.subject}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function ThreadView({ threadKey, name, messages, thread, staff, onBack, onChange }: { threadKey: string; name: string; messages: MessageRow[]; thread?: ThreadRow; staff: { id: string; name: string }[]; onBack: () => void; onChange: () => void }) {
  const familyId = threadKey.startsWith('family:') ? threadKey.slice(7) : null
  const lastIn = [...messages].reverse().find(m => m.direction === 'in')
  const [channel, setChannel] = useState<'email' | 'app' | 'sms'>(lastIn?.channel ?? 'email')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  // Opening the thread reads it.
  useEffect(() => {
    if (!messages.some(m => m.direction === 'in' && !m.read_at)) return
    (async () => {
      const db = sb(); const hq = await currentHq(db)
      await db.from('impact_messages').update({ read_at: new Date().toISOString() }).eq('hq_id', hq).eq('thread_key', threadKey).eq('direction', 'in').is('read_at', null)
      window.dispatchEvent(new Event('impact-comms-read'))
      onChange()
    })().catch(() => {})
  }, [threadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveThread = async (patch: Partial<ThreadRow>, done: string) => {
    if (!familyId) return
    setBusy(true); setNote(null)
    try {
      const db = sb(); const hq = await currentHq(db)
      const { error } = await db.from('impact_threads').upsert({ hq_id: hq, thread_key: threadKey, family_id: familyId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'hq_id,thread_key' })
      if (error) throw new Error(error.message)
      setNote({ ok: true, text: done }); onChange()
    } catch (e) { setNote({ ok: false, text: e instanceof Error ? e.message : 'Couldn’t save.' }) } finally { setBusy(false) }
  }

  async function reply() {
    if (!familyId || !text.trim() || busy) return
    setBusy(true); setNote(null)
    try {
      const res = await impactFetch('/api/impact/message/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipients: [{ familyId }], channels: [channel], body: text }) })
      const j = await res.json().catch(() => ({})) as { error?: string; results?: { ok: boolean; detail: string }[] }
      if (!res.ok) { setNote({ ok: false, text: j.error || 'Couldn’t send.' }); return }
      const r = j.results?.[0]
      setNote({ ok: !!r?.ok, text: r?.ok ? `Sent — ${r.detail}` : `Not sent — ${r?.detail ?? 'unknown reason'}` })
      if (r?.ok) setText('')
      onChange()
    } catch { setNote({ ok: false, text: 'Couldn’t reach the server. It may not have sent, so check before trying again.' }) } finally { setBusy(false) }
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={onBack} style={{ ...buttonSecondary, padding: '6px 10px' }}><ArrowLeft size={13} /> Inbox</button>
        <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK, flex: 1, minWidth: 160 }}>{name}</div>
        {familyId && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6B6560' }}>
            <UserCheck size={13} /> Assign to coach
            <select value={thread?.assigned_staff_id ?? ''} disabled={busy} onChange={e => saveThread({ assigned_staff_id: e.target.value || null }, e.target.value ? 'Assigned.' : 'Unassigned.')} style={{ ...formField, width: 'auto', padding: '5px 8px' }}>
              <option value="">Nobody</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
        {familyId && <button disabled={busy} onClick={() => saveThread({ closed_at: thread?.closed_at ? null : new Date().toISOString() }, thread?.closed_at ? 'Reopened.' : 'Marked done.')} style={{ ...buttonSecondary, padding: '6px 10px' }}><CheckCircle size={13} /> {thread?.closed_at ? 'Reopen' : 'Mark done'}</button>}
      </div>
      <div style={{ display: 'grid', gap: 8, maxHeight: 460, overflowY: 'auto', padding: 2 }}>
        {messages.map(m => {
          const Icon = CH_ICON[m.channel]
          const mine = m.direction === 'out'
          return (
            <div key={m.id} style={{ justifySelf: mine ? 'end' : 'start', maxWidth: '82%', background: mine ? '#1A1614' : '#F7F5F2', color: mine ? '#fff' : TP_DARK, borderRadius: 12, padding: '9px 12px' }}>
              <div style={{ fontSize: 10.5, opacity: 0.75, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <Icon size={11} />{mine ? 'You' : name} · {when(m.created_at)}{mine && m.status !== 'sent' && m.status !== 'filed' ? ` · ${m.status}` : ''}
              </div>
              {m.subject && !mine && <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 2 }}>{m.subject}</div>}
              <div style={{ fontSize: 12.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.body || m.detail}</div>
            </div>
          )
        })}
      </div>
      {familyId ? (
        <div style={{ marginTop: 12, borderTop: '1px solid #EEE9E3', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {(['email', 'app', 'sms'] as const).map(c => (
              <button key={c} onClick={() => setChannel(c)} style={{ background: channel === c ? TP_DARK : '#F7F5F2', color: channel === c ? '#fff' : '#5B554F', border: 'none', borderRadius: 999, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>Reply by {c === 'app' ? 'app' : c.toUpperCase()}</button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Write a reply…" style={{ ...formField, resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <div role="status" style={{ fontSize: 11.5, fontWeight: 700, color: note?.ok ? '#187A3C' : TP_RED }}>{note?.text}</div>
            <button onClick={reply} disabled={busy || !text.trim()} style={{ ...buttonPrimary, opacity: busy || !text.trim() ? 0.6 : 1 }}><Send size={13} /> {busy ? 'Sending…' : 'Send reply'}</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 12, color: '#6B6560', background: '#FFF7E6', borderRadius: 10, padding: '9px 12px' }}>
          This address isn’t one of your families, so it can’t be answered from here. If it should be, add the email to the family in Families — new replies will then join their thread.
        </div>
      )}
    </Card>
  )
}

// ─── Audiences ──────────────────────────────────────────────────────────────
interface AudienceSummary { audience: Audience; name: string; line: string; total: number; reachable: number }
function AudiencesTab({ onNewsletter }: { onNewsletter: (a: Audience) => void }) {
  const [rows, setRows] = useState<AudienceSummary[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    impactFetch('/api/impact/comms/audience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRows(j.audiences) })
      .catch(e => setError(e instanceof Error ? e.message : 'Couldn’t load audiences.'))
  }, [])
  return (
    <Card>
      <SectionTitle sub="Worked out from your records each time. Every send leaves out families without consent, who unsubscribed, opted out, or have no working email.">Audiences</SectionTitle>
      {error && <div style={{ fontSize: 12.5, color: TP_RED }}>{error}</div>}
      {!rows && !error && <div style={{ fontSize: 12.5, color: '#6B6560' }}>Counting…</div>}
      <div style={{ display: 'grid', gap: 7 }}>
        {(rows ?? []).map(r => (
          <div key={`${r.audience.kind}:${r.audience.id ?? ''}`} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F5F2', borderRadius: 10, padding: '10px 13px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>{r.line}</div>
            </div>
            <button disabled={!r.reachable} onClick={() => onNewsletter(r.audience)} style={{ ...buttonSecondary, padding: '6px 11px', fontSize: 11.5, opacity: r.reachable ? 1 : 0.5 }}><Newspaper size={13} /> Newsletter</button>
          </div>
        ))}
      </div>
      <div style={{ ...formLabel, marginTop: 12, textTransform: 'none', fontWeight: 600 }}>“Opened the last newsletter” counts opens reported by email apps; Apple Mail reports every email as opened, so it over-counts.</div>
    </Card>
  )
}
