'use client'

// The Send Message wizard on a live portal: real families in, real per-family
// results out, through POST /api/impact/message/send. The route makes every
// consent decision. What this screen shows is only a guide to them.

import React, { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Mail, MessageSquare, Send, Smartphone, Sparkles, Users, X } from 'lucide-react'
import { EmptyState, Pill } from './ui'
import { draftWithImpactAI } from '@/lib/impact/ai'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact, type ImpactFamily } from './ImpactDataContext'
import { InviteButton, useMembers } from './MembersCard'

type Channel = 'email' | 'app' | 'sms'
type Outcome = 'sent' | 'filed' | 'failed' | 'refused'
type SendResult = { i: number; name: string; channel: Channel; ok: boolean; outcome: Outcome; detail: string; inviteFamilyId?: string }
type SendResponse = { status: string; logged: boolean; results: SendResult[] }

const CHANNELS: { id: Channel; label: string; hint: string; icon: typeof Mail }[] = [
  { id: 'email', label: 'EMAIL', hint: 'From your organisation’s verified address', icon: Mail },
  { id: 'app', label: 'APP', hint: 'In the family app for families with a login, saved for the rest', icon: MessageSquare },
  { id: 'sms', label: 'SMS', hint: 'Only sends once texting is switched on', icon: Smartphone },
]

const blocked = (f: ImpactFamily) => f.unsubscribed ? 'Unsubscribed' : f.consentData !== true ? 'No contact consent' : null

export function LiveSendWizard({ onClose, defaultMessage }: { onClose: () => void; defaultMessage?: string }) {
  const { people, brand } = useImpact()
  const { lines, reload: reloadMembers } = useMembers()
  const families = useMemo(() => people?.families ?? [], [people])
  const eligible = useMemo(() => families.filter(f => !blocked(f)), [families])

  const [step, setStep] = useState(1)
  const [picked, setPicked] = useState<string[]>([])
  const [childId, setChildId] = useState('')
  const [channels, setChannels] = useState<Channel[]>(['email'])
  const [message, setMessage] = useState(defaultMessage ?? '')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<SendResponse | null>(null)

  const single = picked.length === 1 ? families.find(f => f.id === picked[0]) : undefined
  const toggleFamily = (id: string) => { setChildId(''); setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }
  const toggleChannel = (c: Channel) => setChannels(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  const allPicked = eligible.length > 0 && picked.length === eligible.length

  async function draftMessage() {
    setDrafting(true)
    try {
      setMessage(await draftWithImpactAI(`Write a short, warm message (under 70 words) from ${brand.org} to families about this week's free community family tennis session. Do not name any child. Sign off with "${brand.tagline}".`, 220))
    } catch { /* keep what they have written */ } finally { setDrafting(false) }
  }

  async function send() {
    if (sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/impact/message/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: picked.map(familyId => ({ familyId, ...(childId && familyId === single?.id ? { childId } : {}) })),
          channels,
          body: message,
        }),
      })
      const json = await res.json().catch(() => null) as (SendResponse & { error?: string }) | null
      if (!res.ok || !json?.results) setError(json?.error || 'Couldn’t send. Please try again.')
      else setDone(json)
    } catch {
      setError('Couldn’t reach the server. It may not have sent, so check before trying again.')
    } finally {
      setSending(false)
    }
  }

  const stepChip = (n: number, label: string) => (
    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: step >= n ? TP_RED : '#EFEBE6', color: step >= n ? '#fff' : '#8A847E', fontSize: 10.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <span style={{ fontSize: 11, fontWeight: 800, color: step >= n ? TP_DARK : '#8A847E' }}>{label}</span>
    </div>
  )

  const nextDisabled = (step === 1 && picked.length === 0) || (step === 2 && channels.length === 0) || (step === 3 && !message.trim()) || sending
  const count = (o: Outcome) => done?.results.filter(r => r.outcome === o).length ?? 0
  const inApp = done?.results.filter(r => r.outcome === 'filed' && r.detail.startsWith('In the family app')).length ?? 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 560, width: '100%', maxHeight: '86vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK }}>
            <Send size={15} style={{ verticalAlign: '-2px', marginRight: 7, color: TP_RED }} />Send Message
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
        </div>

        {done ? (
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK, margin: '10px 0 4px' }}>
              {count('sent')} sent · {inApp ? `${inApp} in the app · ` : ''}{count('filed') - inApp} saved for the app · {count('refused') + count('failed')} not sent
            </div>
            {!done.logged && <div style={{ fontSize: 12, color: TP_RED, marginBottom: 6 }}>These results couldn’t be saved to the message log. Keep a note of them.</div>}
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              {done.results.map((r, n) => {
                const Icon = r.outcome === 'sent' ? CheckCircle : r.outcome === 'filed' ? Clock : AlertCircle
                const colour = r.outcome === 'sent' ? '#187A3C' : r.outcome === 'filed' ? '#8A847E' : TP_RED
                return (
                  <div key={n} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#F7F5F2', borderRadius: 10, padding: '9px 12px' }}>
                    <Icon size={15} style={{ color: colour, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{r.name} · {r.channel.toUpperCase()}</div>
                      <div style={{ fontSize: 11.5, color: '#6B6560', overflowWrap: 'anywhere' }}>{r.detail}</div>
                      {r.inviteFamilyId && <div style={{ marginTop: 5 }}><InviteButton role="parent" targetId={r.inviteFamilyId} label="Invite parent" hasEmail={!!families.find(f => f.id === r.inviteFamilyId)?.email} lines={lines} onDone={reloadMembers} /></div>}
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={onClose} style={{ marginTop: 16, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Done</button>
          </div>
        ) : (<>
          <div style={{ display: 'flex', gap: 14, margin: '10px 0 16px', flexWrap: 'wrap' }}>
            {stepChip(1, 'Who')}{stepChip(2, 'How')}{stepChip(3, 'Message')}{stepChip(4, 'Preview')}
          </div>

          {step === 1 && (<>
            {families.length === 0 && <EmptyState compact icon={Users} title="No families yet" sub="Families appear here once they’re added to the portal." />}
            {eligible.length > 1 && (
              <button onClick={() => { setChildId(''); setPicked(allPicked ? [] : eligible.map(f => f.id)) }}
                style={{ marginBottom: 8, background: '#fff', color: TP_RED, border: `1px solid ${TP_RED}44`, borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                {allPicked ? 'Clear all' : `All ${eligible.length} families with contact consent`}
              </button>
            )}
            <div style={{ display: 'grid', gap: 6 }}>
              {families.map(f => {
                const why = blocked(f)
                const active = picked.includes(f.id)
                return (
                  <button key={f.id} disabled={!!why} onClick={() => toggleFamily(f.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: active ? '#FDE8E8' : '#F7F5F2', border: active ? `1.5px solid ${TP_RED}` : '1.5px solid transparent', borderRadius: 10, padding: '10px 12px', cursor: why ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: why ? 0.6 : 1 }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>{f.guardian}</span>
                      <span style={{ display: 'block', fontSize: 10.5, color: '#8A847E' }}>{why ?? (f.children.map(c => c.name).join(', ') || 'No children linked')}</span>
                    </span>
                    {active && <CheckCircle size={15} style={{ color: '#187A3C', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </>)}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {CHANNELS.map(({ id, label, hint, icon: Icon }) => {
                const active = channels.includes(id)
                return (
                  <button key={id} onClick={() => toggleChannel(id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: active ? '#FDE8E8' : '#F7F5F2', border: active ? `1.5px solid ${TP_RED}` : '1.5px solid transparent', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left' }}>
                    <span>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: TP_DARK }}><Icon size={14} style={{ verticalAlign: '-2px', marginRight: 8, color: TP_RED }} />{label}</span>
                      <span style={{ display: 'block', fontSize: 10.5, color: '#8A847E', marginTop: 2 }}>{hint}</span>
                    </span>
                    {active && <CheckCircle size={15} style={{ color: '#187A3C', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} maxLength={10000}
                placeholder={`Message to ${picked.length === 1 ? single?.guardian ?? 'this family' : `${picked.length} families`}`}
                style={{ width: '100%', border: '1px solid #E7E2DC', borderRadius: 10, padding: '11px 13px', fontSize: 13, outline: 'none', background: '#F7F5F2', resize: 'vertical', fontFamily: 'inherit' }} />
              <button onClick={draftMessage} disabled={drafting}
                style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: TP_RED, border: `1px solid ${TP_RED}44`, borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                <Sparkles size={13} /> {drafting ? 'Drafting…' : 'Draft it for me (AI)'}
              </button>
              {single && single.children.length > 0 && (
                <label style={{ display: 'block', marginTop: 12, fontSize: 11.5, fontWeight: 800, color: TP_DARK }}>
                  About (optional)
                  <select value={childId} onChange={e => setChildId(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 5, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 11px', fontSize: 12.5, background: '#F7F5F2', fontFamily: 'inherit' }}>
                    <option value="">Nobody in particular</option>
                    {single.children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              <div style={{ fontSize: 11, color: '#8A847E', marginTop: 8 }}>
                A message that names a child without green photo consent won’t be sent to that family.
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#8A847E', letterSpacing: 0.6, marginBottom: 6 }}>PREVIEW</div>
              <div style={{ background: '#F7F5F2', borderRadius: 12, padding: '13px 15px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>To: {single?.guardian ?? `${picked.length} families`}</div>
                <div style={{ display: 'flex', gap: 5, margin: '7px 0' }}>{channels.map(c => <Pill key={c} tone="red">{c.toUpperCase()}</Pill>)}</div>
                <div style={{ fontSize: 12.5, color: '#33302C', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{message}</div>
              </div>
              <div style={{ fontSize: 11, color: '#8A847E', marginTop: 8 }}>
                Consent is checked again as it sends. Anyone opted out of a channel doesn’t get it on that channel, and you’ll see each family’s result next.
              </div>
              {error && <div style={{ fontSize: 12, color: TP_RED, fontWeight: 700, marginTop: 8 }}>{error}</div>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} disabled={sending} style={{ background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '10px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
              {step > 1 ? '← Back' : 'Cancel'}
            </button>
            <button onClick={() => step < 4 ? setStep(step + 1) : send()} disabled={nextDisabled}
              style={{ background: nextDisabled ? '#D9D3CC' : TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 18px', fontSize: 12.5, fontWeight: 900, cursor: nextDisabled ? 'not-allowed' : 'pointer' }}>
              {step < 4 ? 'Next →' : sending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}
