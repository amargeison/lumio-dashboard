'use client'

// Settings → Messaging on a live portal (brief 4): who emails go out as and where replies
// land (read-only — Lumio sets the verified sender), quiet hours, the brand voice the AI
// writes in, and today's AI usage against the org's daily allowance. Saved into
// impact_orgs.settings.messaging. Settings is rebuilt in brief 5; this card moves there.

import React, { useEffect, useState } from 'react'
import { MessageSquare, Save, Sparkles } from 'lucide-react'
import { Card, SectionTitle, formField, formLabel, buttonPrimary } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { impactFetch } from '@/lib/impact/org-scope'
import { brandVoice, quietHours } from '@/lib/impact/comms-settings'

const pounds = (p: number) => `£${(p / 100).toFixed(2)}`

export function MessagingSettings() {
  const { org, brand } = useImpact()
  const m = org?.settings.messaging
  const q = quietHours(m), v = brandVoice(m)
  const [start, setStart] = useState(q.start)
  const [end, setEnd] = useState(q.end)
  const [tone, setTone] = useState(v.tone)
  const [signOff, setSignOff] = useState(m?.voice?.signOff ?? '')
  const [use, setUse] = useState(v.use.join(', '))
  const [avoid, setAvoid] = useState(v.avoid.join(', '))
  const [age, setAge] = useState(v.readingAge)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [usage, setUsage] = useState<{ spentPence: number; capPence: number } | null>(null)
  useEffect(() => {
    impactFetch('/api/ai/impact').then(async r => { if (r.ok) setUsage(await r.json()) }).catch(() => {})
  }, [])
  if (!org) return null
  const slug = org.slug

  async function save() {
    if (!org) return
    setBusy(true); setNote(null)
    const r = await org.save({ ...org.settings, messaging: { quietStart: start, quietEnd: end, voice: { tone, signOff, use: use.split(',').map(s => s.trim()).filter(Boolean), avoid: avoid.split(',').map(s => s.trim()).filter(Boolean), readingAge: age } } })
    setBusy(false)
    setNote(r.ok ? { ok: true, text: 'Saved.' } : { ok: false, text: r.error ?? 'Couldn’t save.' })
  }
  const pct = usage ? Math.min(100, Math.round((usage.spentPence / Math.max(1, usage.capPence)) * 100)) : 0
  return (
    <Card>
      <SectionTitle sub="How your emails go out, when they don’t, and how the AI writes for you">
        <MessageSquare size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Messaging
      </SectionTitle>
      <div style={{ display: 'grid', gap: 6, fontSize: 12.5, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #F0EBE5', paddingBottom: 8 }}>
          <span style={{ color: '#8A847E', fontWeight: 700 }}>Emails come from</span>
          <span style={{ fontWeight: 800, color: TP_DARK, textAlign: 'right' }}>{brand.org}, from your verified address (set up by Lumio)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #F0EBE5', paddingBottom: 8 }}>
          <span style={{ color: '#8A847E', fontWeight: 700 }}>Replies go to</span>
          <span style={{ fontWeight: 800, color: TP_DARK, textAlign: 'right', overflowWrap: 'anywhere' }}>reply+{slug}@inbound.lumiosports.com → your Inbox</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label><span style={formLabel}>Quiet hours from</span><input type="time" value={start} onChange={e => setStart(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Until</span><input type="time" value={end} onChange={e => setEnd(e.target.value)} style={formField} /></label>
      </div>
      <div style={{ fontSize: 11, color: '#8A847E', margin: '4px 0 12px' }}>Automations and scheduled newsletters wait until quiet hours end (UK time). A message you send yourself goes straight away.</div>

      <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK, margin: '4px 0 6px' }}><Sparkles size={13} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />Brand voice (for AI drafts)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label><span style={formLabel}>Tone</span><input value={tone} maxLength={120} onChange={e => setTone(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Sign-off</span><input value={signOff} maxLength={120} onChange={e => setSignOff(e.target.value)} placeholder={brand.tagline || 'The team'} style={formField} /></label>
        <label><span style={formLabel}>Words and phrases to use (commas)</span><input value={use} onChange={e => setUse(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Words and phrases to avoid (commas)</span><input value={avoid} onChange={e => setAvoid(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Reading age</span><input type="number" min={7} max={16} value={age} onChange={e => setAge(Number(e.target.value))} style={{ ...formField, maxWidth: 100 }} /></label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <button onClick={save} disabled={busy || !org.canEdit} style={{ ...buttonPrimary, opacity: busy || !org.canEdit ? 0.6 : 1 }}><Save size={13} /> {busy ? 'Saving…' : 'Save'}</button>
        {note && <span role="status" style={{ fontSize: 12, fontWeight: 700, color: note.ok ? '#187A3C' : TP_RED }}>{note.text}</span>}
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #F0EBE5', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span style={{ color: '#8A847E', fontWeight: 700 }}>AI used today</span>
          <span style={{ fontWeight: 800, color: TP_DARK }}>{usage ? `${pounds(usage.spentPence)} of ${pounds(usage.capPence)}` : '…'}</span>
        </div>
        <div style={{ height: 8, background: '#F0EBE5', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? TP_RED : TP_DARK }} /></div>
        <div style={{ fontSize: 11, color: '#8A847E', marginTop: 4 }}>Newsletter and message drafts, captions and file imports share this daily allowance. It resets at midnight; when it’s used up, AI drafting pauses and everything else carries on.</div>
      </div>
    </Card>
  )
}
