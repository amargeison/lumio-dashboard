'use client'

// Coach view → Messages (live only): the family conversations the HQ has assigned to this
// coach (impact_threads.assigned_staff_id). RLS gives a coach those threads and their
// messages and nothing else. Read-only: replies are sent by the HQ from its Inbox, so
// every message still goes out from the org's verified address with its consent checks.

import React, { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, MessageSquare, Smartphone, Send } from 'lucide-react'
import { Card, SectionTitle, EmptyState } from './ui'
import { TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const ICON = { email: Mail, sms: Smartphone, app: MessageSquare } as const
interface Msg { id: string; thread_key: string; family_id: string | null; channel: 'email' | 'sms' | 'app'; direction: 'in' | 'out'; body: string; subject: string | null; created_at: string }

export function CoachMessages() {
  const { coach } = useImpact()
  const [threads, setThreads] = useState<{ thread_key: string; family_id: string | null; closed_at: string | null }[] | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (!coach) return
    (async () => {
      const db = sb()
      const { data: t, error: e1 } = await db.from('impact_threads').select('thread_key, family_id, closed_at').eq('hq_id', coach.hqId).eq('assigned_staff_id', coach.staffId)
      if (e1) throw new Error(e1.message)
      setThreads(t ?? [])
      const keys = (t ?? []).map(x => x.thread_key)
      if (!keys.length) return
      const { data: m, error: e2 } = await db.from('impact_messages').select('id, thread_key, family_id, channel, direction, body, subject, created_at').eq('hq_id', coach.hqId).in('thread_key', keys).order('created_at').limit(1000)
      if (e2) throw new Error(e2.message)
      setMsgs((m ?? []) as Msg[])
    })().catch(e => setError(e instanceof Error ? e.message : 'Couldn’t load messages.'))
  }, [coach])

  if (!coach) return <Card><EmptyState icon={Send} title="Messages" sub="Sign in as a coach to see the conversations your HQ passes to you." /></Card>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error && <Card><div style={{ fontSize: 12.5, color: '#D7262C' }}>{error}</div></Card>}
      {threads && !threads.length && <Card><EmptyState icon={Send} title="Nothing assigned to you" sub="When your HQ assigns a family’s conversation to you, it appears here." /></Card>}
      {(threads ?? []).map(t => {
        const ms = msgs.filter(m => m.thread_key === t.thread_key)
        const name = (t.family_id && coach.families[t.family_id]?.guardian_name) || 'A family'
        return (
          <Card key={t.thread_key}>
            <SectionTitle sub={t.closed_at ? 'Marked done by HQ' : 'Your HQ replies from its Inbox — tell them what to say'}>{name}</SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {ms.map(m => {
                const Icon = ICON[m.channel]
                return (
                  <div key={m.id} style={{ background: m.direction === 'in' ? '#F7F5F2' : '#EFEBE6', borderRadius: 10, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, color: '#8A847E', display: 'flex', gap: 5, alignItems: 'center' }}><Icon size={11} />{m.direction === 'in' ? name : 'HQ'} · {new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: 12.5, color: TP_DARK, whiteSpace: 'pre-wrap', marginTop: 2 }}>{m.body}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
