'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ExternalLink, ThumbsUp, Check, Bookmark, Share2, X, Send, Settings } from 'lucide-react'

// ─── Action tracker ───────────────────────────────────────────────────────────

async function trackAction(itemType: string, itemRef: string, actionTaken: string) {
  try {
    await fetch('/api/briefing/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: itemType, item_ref: itemRef, action_taken: actionTaken }),
    })
  } catch { /* fire-and-forget, ignore errors */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Email {
  id: string; from: string; fromEmail: string; subject: string
  preview: string; time: string; urgent: boolean; read: boolean
}
interface SlackMsg {
  id: string; channel: string; sender: string; message: string; time: string
}
interface NotionItem {
  id: string; title: string; type: string; page: string; time: string; url: string
}
interface LinkedInItem {
  id: string; type: 'connection' | 'message' | 'reaction'; name: string; detail: string; time: string
}
interface NewsItem {
  id: string; headline: string; source: string; time: string; url: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const EMAILS: Email[] = [
  { id: 'e1', from: 'Tom Wright',    fromEmail: 'tom.wright@bramblehill.org.uk', subject: 'Invoice overdue — Ref INV-2026-041',       preview: 'Hi, just chasing the invoice from last month — can you confirm when this will be settled?', time: '8:14am',  urgent: true,  read: false },
  { id: 'e2', from: 'Apex Consulting', fromEmail: 'contracts@apex.co.uk',       subject: 'Renewal discussion — contract ends Apr 30', preview: 'We'd like to discuss the terms for our renewal. Can we schedule a call this week?',          time: '7:52am',  urgent: true,  read: false },
  { id: 'e3', from: 'Stripe',        fromEmail: 'no-reply@stripe.com',           subject: 'Payment confirmed — £4,800 from Oakridge', preview: 'Your payment of £4,800.00 from Oakridge Schools Ltd has been processed successfully.',        time: '7:31am',  urgent: false, read: true  },
  { id: 'e4', from: 'Helen Park',    fromEmail: 'helen.park@greenfield.sch.uk',  subject: 'Re: Lumio Pro demo — follow-up questions', preview: 'Thank you for the demo yesterday. We have a few questions about the safeguarding module...',  time: 'Yesterday', urgent: false, read: true  },
  { id: 'e5', from: 'Dan Marsh',     fromEmail: 'dan@lumiocms.com',              subject: 'Crestview — proposal ready for review',   preview: 'I've finished the proposal for Crestview Academy. Can you cast an eye before I send it?',     time: 'Yesterday', urgent: false, read: true  },
]

const SLACK_MSGS: SlackMsg[] = [
  { id: 's1', channel: '#sa-02-leads',   sender: 'Charlotte D.', message: 'Lakewood Academy just hit 87 on the lead score — should I reach out today?',       time: '9:02am'    },
  { id: 's2', channel: '#hr-general',    sender: 'Priya S.',     message: 'New joiner IT provisioning for Marcus is done ✅ He's all set for Monday.',          time: '8:45am'    },
  { id: 's3', channel: '#support-queue', sender: 'James H.',     message: 'P1 ticket at Elmfield is escalating — SLA breach in 20 mins if unresolved.',        time: '8:30am'    },
  { id: 's4', channel: '#sales',         sender: 'Sophie Bell',  message: 'Oakridge demo confirmed for 11am. I'll send the prep doc in the next 10 minutes.',   time: '8:15am'    },
  { id: 's5', channel: '#general',       sender: 'Raj Patel',    message: 'Anyone else noticing the Supabase dashboard is slow this morning? Checking logs.',   time: 'Yesterday' },
]

const NOTION_ITEMS: NotionItem[] = [
  { id: 'n1', title: '@you mentioned in Testing Guide', type: 'mention',  page: 'QA Testing Guide v2',         time: '2h ago',    url: 'https://notion.so' },
  { id: 'n2', title: 'Competitor pricing doc updated',  type: 'update',   page: 'Competitor Analysis — HubSpot', time: '4h ago',  url: 'https://notion.so' },
  { id: 'n3', title: 'Sales Playbook — 3 comments',     type: 'comment',  page: 'Sales Playbook 2026',         time: 'Yesterday', url: 'https://notion.so' },
  { id: 'n4', title: 'Action item assigned to you',     type: 'task',     page: 'Q2 Planning Board',           time: 'Yesterday', url: 'https://notion.so' },
  { id: 'n5', title: 'Onboarding checklist updated',    type: 'update',   page: 'Customer Onboarding Docs',    time: '2d ago',    url: 'https://notion.so' },
]

const LINKEDIN_ITEMS: LinkedInItem[] = [
  { id: 'l1', type: 'connection', name: 'Sarah Nightingale',  detail: 'Head of EdTech at Futures Group · 2nd connection', time: '1h ago'    },
  { id: 'l2', type: 'message',    name: 'Marcus Reid',        detail: 'Hi, saw your post on school automation — would love to connect about a project...', time: '3h ago' },
  { id: 'l3', type: 'connection', name: 'Dr. Alan Cross',     detail: 'CEO at Brightfields MAT · 3rd connection',         time: '5h ago'    },
  { id: 'l4', type: 'reaction',   name: 'Your post',          detail: '47 reactions on "How we automated HR onboarding in a day" — 12 new comments',  time: 'Yesterday' },
  { id: 'l5', type: 'message',    name: 'Yasmin Patel',       detail: 'Following up on the demo from last week — are you free Thursday afternoon?',    time: 'Yesterday' },
]

const NEWS_ITEMS: NewsItem[] = [
  { id: 'w1', headline: 'Zendesk confirms Sell will be retired in August 2027 — customers urged to migrate', source: 'TechCrunch',          time: '2h ago',    url: '#' },
  { id: 'w2', headline: 'UK EdTech sector attracts record £1.2bn in investment in Q1 2026',                source: 'EdTech Magazine',     time: '4h ago',    url: '#' },
  { id: 'w3', headline: 'HubSpot launches new AI-powered SMB tier — direct competition to mid-market tools', source: 'SaaStr',            time: '6h ago',    url: '#' },
  { id: 'w4', headline: 'UK school automation market up 34% year-on-year — report from Bett 2026',         source: 'Schools Week',        time: 'Yesterday', url: '#' },
  { id: 'w5', headline: 'Ofsted announces new inspection framework pilot for autumn 2026 term',             source: 'Guardian Education', time: 'Yesterday', url: '#' },
]

// ─── Source config ────────────────────────────────────────────────────────────

type Source = 'email' | 'slack' | 'notion' | 'linkedin' | 'news'

const SOURCE_CFG: Record<Source, { icon: string; label: string; color: string; bg: string; border: string; externalLabel: string; externalUrl: string }> = {
  email:    { icon: '📧', label: 'Emails',        color: '#60A5FA', bg: 'rgba(96,165,250,0.06)',   border: 'rgba(96,165,250,0.18)',  externalLabel: 'Open in Gmail',    externalUrl: 'https://mail.google.com' },
  slack:    { icon: '💬', label: 'Slack',         color: '#C084FC', bg: 'rgba(192,132,252,0.06)',  border: 'rgba(192,132,252,0.18)', externalLabel: 'Open in Slack',    externalUrl: 'https://slack.com'       },
  notion:   { icon: '📋', label: 'Notion',        color: '#FB923C', bg: 'rgba(251,146,60,0.06)',   border: 'rgba(251,146,60,0.18)',  externalLabel: 'Open Notion',      externalUrl: 'https://notion.so'       },
  linkedin: { icon: '💼', label: 'LinkedIn',      color: '#2DD4BF', bg: 'rgba(45,212,191,0.06)',   border: 'rgba(45,212,191,0.18)',  externalLabel: 'Open LinkedIn',    externalUrl: 'https://linkedin.com'    },
  news:     { icon: '📰', label: 'Industry News', color: '#FBBF24', bg: 'rgba(251,191,36,0.06)',   border: 'rgba(251,191,36,0.18)',  externalLabel: 'View all news',    externalUrl: '#'                       },
}

const COUNTS: Record<Source, number> = { email: EMAILS.length, slack: SLACK_MSGS.length, notion: NOTION_ITEMS.length, linkedin: LINKEDIN_ITEMS.length, news: NEWS_ITEMS.length }
const URGENT: Record<Source, boolean> = { email: EMAILS.some(e => e.urgent), slack: SLACK_MSGS.some(s => s.channel === '#support-queue'), notion: false, linkedin: false, news: false }

// ─── Email pane ───────────────────────────────────────────────────────────────

function EmailPane() {
  const [replyId,  setReplyId]  = useState<string | null>(null)
  const [replyText,setReplyText]= useState('')
  const [archived, setArchived] = useState<Set<string>>(new Set())
  const [urgent,   setUrgent]   = useState<Set<string>>(new Set(EMAILS.filter(e => e.urgent).map(e => e.id)))
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState<Set<string>>(new Set())
  const [notConnected, setNotConnected] = useState(false)

  async function sendReply(email: Email) {
    setSending(true)
    setNotConnected(false)
    const res = await fetch('/api/integrations/email/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email.fromEmail, subject: email.subject, reply_body: replyText }),
    })
    setSending(false)
    if (res.status === 503) { setNotConnected(true); return }
    trackAction('email', email.id, 'replied')
    setSent(s => new Set([...s, email.id]))
    setReplyId(null)
    setReplyText('')
  }

  return (
    <div className="space-y-2">
      {notConnected && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
          Connect your email account in <Link href="/settings" className="underline ml-1">Settings → Integrations</Link> to enable replies.
        </div>
      )}
      {EMAILS.filter(e => !archived.has(e.id)).map(email => (
        <div key={email.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              {email.from[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold truncate" style={{ color: email.read ? '#9CA3AF' : '#F9FAFB' }}>{email.from}</span>
                {urgent.has(email.id) && <span className="shrink-0 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#F87171' }}>Urgent</span>}
                {sent.has(email.id) && <span className="shrink-0 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>Replied ✓</span>}
                <span className="ml-auto shrink-0 text-xs" style={{ color: '#6B7280' }}>{email.time}</span>
              </div>
              <p className="text-xs font-medium truncate mb-0.5" style={{ color: '#D1D5DB' }}>{email.subject}</p>
              <p className="text-xs truncate" style={{ color: '#6B7280' }}>{email.preview}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 pb-2">
            <button onClick={() => { setReplyId(replyId === email.id ? null : email.id); setReplyText('') }}
              className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              Reply
            </button>
            <button onClick={() => { trackAction('email', email.id, 'archived'); setArchived(a => new Set([...a, email.id])) }}
              className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              Archive
            </button>
            <button onClick={() => setUrgent(u => { const n = new Set(u); u.has(email.id) ? n.delete(email.id) : n.add(email.id); return n })}
              className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: urgent.has(email.id) ? 'rgba(239,68,68,0.12)' : '#1F2937', color: urgent.has(email.id) ? '#F87171' : '#9CA3AF' }}>
              {urgent.has(email.id) ? '● Urgent' : 'Mark urgent'}
            </button>
            <a href={SOURCE_CFG.email.externalUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
              <ExternalLink size={11} /> Gmail
            </a>
          </div>

          {/* Inline compose */}
          {replyId === email.id && (
            <div className="px-4 pb-3">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${email.from}…`}
                  rows={3}
                  className="w-full px-3 py-2 text-xs resize-none"
                  style={{ backgroundColor: '#111318', color: '#F9FAFB', outline: 'none' }}
                />
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid #1F2937', backgroundColor: '#0D0E14' }}>
                  <button
                    onClick={() => sendReply(email)}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: (!replyText.trim() || sending) ? 0.6 : 1 }}>
                    <Send size={11} /> {sending ? 'Sending…' : 'Send'}
                  </button>
                  <button onClick={() => setReplyId(null)} className="text-xs" style={{ color: '#9CA3AF' }}><X size={13} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Slack pane ───────────────────────────────────────────────────────────────

function SlackPane() {
  const [replyId,   setReplyId]   = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [reacted,   setReacted]   = useState<Set<string>>(new Set())
  const [done,      setDone]      = useState<Set<string>>(new Set())
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState<Set<string>>(new Set())
  const [notConnected, setNotConnected] = useState(false)

  async function sendReply(msg: SlackMsg) {
    setSending(true)
    setNotConnected(false)
    const res = await fetch('/api/integrations/slack/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: msg.channel, message: replyText }),
    })
    setSending(false)
    if (res.status === 503) { setNotConnected(true); return }
    trackAction('slack', msg.id, 'replied')
    setSent(s => new Set([...s, msg.id]))
    setReplyId(null)
    setReplyText('')
  }

  return (
    <div className="space-y-2">
      {notConnected && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
          Connect your Slack workspace in <Link href="/settings" className="underline ml-1">Settings → Integrations</Link> to enable replies.
        </div>
      )}
      {SLACK_MSGS.filter(s => !done.has(s.id)).map(msg => (
        <div key={msg.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#C084FC' }}>
              {msg.sender[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.sender}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(192,132,252,0.1)', color: '#C084FC' }}>{msg.channel}</span>
                {sent.has(msg.id) && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>Replied ✓</span>}
                <span className="ml-auto text-xs" style={{ color: '#6B7280' }}>{msg.time}</span>
              </div>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{msg.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            <button onClick={() => { setReplyId(replyId === msg.id ? null : msg.id); setReplyText('') }}
              className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              Reply
            </button>
            <button onClick={() => setReacted(r => { const n = new Set(r); r.has(msg.id) ? n.delete(msg.id) : n.add(msg.id); return n })}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: reacted.has(msg.id) ? 'rgba(251,191,36,0.12)' : '#1F2937', color: reacted.has(msg.id) ? '#FBBF24' : '#9CA3AF' }}>
              <ThumbsUp size={11} /> {reacted.has(msg.id) ? '1' : ''}
            </button>
            <button onClick={() => { trackAction('slack', msg.id, 'done'); setDone(d => new Set([...d, msg.id])) }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              <Check size={11} /> Done
            </button>
            <a href={SOURCE_CFG.slack.externalUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
              <ExternalLink size={11} /> Slack
            </a>
          </div>
          {replyId === msg.id && (
            <div className="px-4 pb-3">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply in ${msg.channel}…`} rows={2}
                  className="w-full px-3 py-2 text-xs resize-none"
                  style={{ backgroundColor: '#111318', color: '#F9FAFB', outline: 'none' }} />
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid #1F2937', backgroundColor: '#0D0E14' }}>
                  <button onClick={() => sendReply(msg)} disabled={!replyText.trim() || sending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: '#C084FC', color: '#F9FAFB', opacity: (!replyText.trim() || sending) ? 0.6 : 1 }}>
                    <Send size={11} /> {sending ? 'Sending…' : 'Send'}
                  </button>
                  <button onClick={() => setReplyId(null)} className="text-xs" style={{ color: '#9CA3AF' }}><X size={13} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Notion pane ──────────────────────────────────────────────────────────────

function NotionPane() {
  const [read, setRead] = useState<Set<string>>(new Set())
  return (
    <div className="space-y-2">
      {NOTION_ITEMS.filter(n => !read.has(n.id)).map(item => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#FB923C' }}>N</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#F9FAFB' }}>{item.title}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.page} · {item.time}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#FB923C' }}>
              <ExternalLink size={11} /> View
            </a>
            <button onClick={() => { trackAction('notion', item.id, 'read'); setRead(r => new Set([...r, item.id])) }} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              Read
            </button>
          </div>
        </div>
      ))}
      {NOTION_ITEMS.filter(n => !read.has(n.id)).length === 0 && (
        <p className="text-xs text-center py-3" style={{ color: '#4B5563' }}>All caught up in Notion ✓</p>
      )}
    </div>
  )
}

// ─── LinkedIn pane ────────────────────────────────────────────────────────────

function LinkedInPane() {
  const [accepted,  setAccepted]  = useState<Set<string>>(new Set())
  const [ignored,   setIgnored]   = useState<Set<string>>(new Set())
  const [replyId,   setReplyId]   = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const visible = LINKEDIN_ITEMS.filter(l => !ignored.has(l.id))
  return (
    <div className="space-y-2">
      {visible.map(item => (
        <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#2DD4BF' }}>
              {item.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{item.name}</span>
                <span className="ml-auto text-xs" style={{ color: '#6B7280' }}>{item.time}</span>
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.detail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            {item.type === 'connection' && !accepted.has(item.id) && (
              <>
                <button onClick={() => { trackAction('linkedin', item.id, 'accepted'); setAccepted(a => new Set([...a, item.id])) }}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: 'rgba(45,212,191,0.12)', color: '#2DD4BF' }}>
                  Accept
                </button>
                <button onClick={() => { trackAction('linkedin', item.id, 'ignored'); setIgnored(i => new Set([...i, item.id])) }}
                  className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                  Ignore
                </button>
              </>
            )}
            {item.type === 'connection' && accepted.has(item.id) && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>Connected ✓</span>
            )}
            {item.type === 'message' && (
              <button onClick={() => setReplyId(replyId === item.id ? null : item.id)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                Reply
              </button>
            )}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
              <ExternalLink size={11} /> LinkedIn
            </a>
          </div>
          {replyId === item.id && (
            <div className="px-4 pb-3">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…" rows={2}
                  className="w-full px-3 py-2 text-xs resize-none"
                  style={{ backgroundColor: '#111318', color: '#F9FAFB', outline: 'none' }} />
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid #1F2937', backgroundColor: '#0D0E14' }}>
                  <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: '#2DD4BF', color: '#07080F' }}
                    onClick={() => { setReplyId(null); setReplyText('') }}>
                    <Send size={11} /> Send via LinkedIn
                  </button>
                  <button onClick={() => setReplyId(null)} className="text-xs" style={{ color: '#9CA3AF' }}><X size={13} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── News pane ────────────────────────────────────────────────────────────────

function NewsPane() {
  const [saved, setSaved]   = useState<Set<string>>(new Set())
  const [shared, setShared] = useState<Set<string>>(new Set())
  return (
    <div className="space-y-2">
      {NEWS_ITEMS.map(item => (
        <div key={item.id} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#F9FAFB' }}>{item.headline}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{item.source} · {item.time}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#FBBF24' }}>
              <ExternalLink size={11} /> Read
            </a>
            <button onClick={() => setSaved(s => { const n = new Set(s); s.has(item.id) ? n.delete(item.id) : n.add(item.id); return n })}
              className="p-1.5 rounded-lg" style={{ backgroundColor: saved.has(item.id) ? 'rgba(251,191,36,0.15)' : '#1F2937', color: saved.has(item.id) ? '#FBBF24' : '#9CA3AF' }}>
              <Bookmark size={12} />
            </button>
            <button onClick={() => setShared(s => new Set([...s, item.id]))}
              className="p-1.5 rounded-lg" style={{ backgroundColor: shared.has(item.id) ? 'rgba(192,132,252,0.15)' : '#1F2937', color: shared.has(item.id) ? '#C084FC' : '#9CA3AF' }}>
              <Share2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const PANE_ORDER: Source[] = ['email', 'slack', 'notion', 'linkedin', 'news']

export default function MorningReview() {
  const [expanded, setExpanded] = useState<Source | null>('email')

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#F9FAFB' }}>
          🌅 Morning Roundup
          <span className="text-xs font-normal" style={{ color: '#6B7280' }}>Since you were last here</span>
        </h3>
        <Link href="/settings" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
          <Settings size={12} /> Connect accounts
        </Link>
      </div>

      {/* Source rows */}
      <div className="divide-y" style={{ borderColor: '#1F2937' }}>
        {PANE_ORDER.map(source => {
          const cfg   = SOURCE_CFG[source]
          const count = COUNTS[source]
          const isUrgent = URGENT[source]
          const isOpen = expanded === source
          return (
            <div key={source}>
              <button
                onClick={() => setExpanded(isOpen ? null : source)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors"
                style={{ backgroundColor: isOpen ? cfg.bg : 'transparent' }}
                onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = cfg.bg }}
                onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <span className="text-base shrink-0">{cfg.icon}</span>
                <span className="text-sm font-semibold flex-1" style={{ color: cfg.color }}>{cfg.label}</span>
                {isUrgent && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#F87171' }}>Urgent</span>
                )}
                <span className="text-base font-black w-6 text-right" style={{ color: cfg.color }}>{count}</span>
                {isOpen
                  ? <ChevronUp  size={14} style={{ color: '#6B7280' }} />
                  : <ChevronDown size={14} style={{ color: '#6B7280' }} />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2" style={{ backgroundColor: cfg.bg }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{cfg.label}</span>
                    <a href={cfg.externalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
                      <ExternalLink size={11} /> {cfg.externalLabel}
                    </a>
                  </div>
                  {source === 'email'    && <EmailPane />}
                  {source === 'slack'    && <SlackPane />}
                  {source === 'notion'   && <NotionPane />}
                  {source === 'linkedin' && <LinkedInPane />}
                  {source === 'news'     && <NewsPane />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
