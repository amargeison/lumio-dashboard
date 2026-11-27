'use client'

// Settings → Messaging on a live portal: who emails go out as and whether that address is
// verified (from /api/impact/settings/status, which asks Resend), where replies land,
// quiet hours, texts on or off, the brand voice the AI writes in, and a test send to
// yourself. Saved into impact_orgs.settings.messaging; the audit log records each save.

import React, { useEffect, useState } from 'react'
import { MessageSquare, Save, Send, Sparkles } from 'lucide-react'
import { Card, SectionTitle, formField, formLabel, buttonPrimary, buttonSecondary, Pill } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { impactFetch } from '@/lib/impact/org-scope'
import { brandVoice, quietHours } from '@/lib/impact/comms-settings'
import { smsOn } from '@/lib/impact/org'

export type LineState = 'connected' | 'not_connected' | 'attention'
export interface SettingsStatus {
  email: { state: LineState; sender: string | null; detail: string }
  sms: { state: LineState; on: boolean; available: boolean; detail: string }
  meta: { state: LineState; detail: string; lastUsedAt: string | null }
  replyTo: string
  erase: boolean
}

/** What's connected, for Messaging and Integrations. */
export function useSettingsStatus(): { status: SettingsStatus | null; error: string; reload: () => void } {
  const { org } = useImpact()
  const [status, setStatus] = useState<SettingsStatus | null>(null)
  const [error, setError] = useState('')
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!org?.canEdit) return
    impactFetch('/api/impact/settings/status').then(async r => {
      const j = await r.json().catch(() => ({}))
      if (r.ok) { setStatus(j as SettingsStatus); setError('') } else setError((j as { error?: string }).error ?? 'Couldn’t check your connections.')
    }).catch(() => setError('Couldn’t check your connections.'))
  }, [org?.canEdit, n])
  return { status, error, reload: () => setN(x => x + 1) }
}

export const STATE_PILL: Record<LineState, { tone: 'green' | 'grey' | 'amber'; text: string }> = {
  connected: { tone: 'green', text: 'CONNECTED' }, not_connected: { tone: 'grey', text: 'NOT CONNECTED' }, attention: { tone: 'amber', text: 'NEEDS ATTENTION' },
}

const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid #F0EBE5', padding: '8px 0' }

export function MessagingSettings({ onSaved }: { onSaved?: () => void }) {
  const { org, brand } = useImpact()
  const { status } = useSettingsStatus()
  const m = org?.settings.messaging
  const q = quietHours(m), v = brandVoice(m)
  const [start, setStart] = useState(q.start)
  const [end, setEnd] = useState(q.end)
  const [sms, setSms] = useState(smsOn(org?.settings))
  const [tone, setTone] = useState(v.tone)
  const [signOff, setSignOff] = useState(m?.voice?.signOff ?? '')
  const [use, setUse] = useState(v.use.join(', '))
  const [avoid, setAvoid] = useState(v.avoid.join(', '))
  const [age, setAge] = useState(v.readingAge)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)
  if (!org) return null
  const slug = org.slug

  async function save() {
    if (!org) return
    setBusy(true); setNote(null)
    const r = await org.save({ ...org.settings, messaging: { ...(org.settings.messaging ?? {}), sms, quietStart: start, quietEnd: end, voice: { tone, signOff, use: use.split(',').map(s => s.trim()).filter(Boolean), avoid: avoid.split(',').map(s => s.trim()).filter(Boolean), readingAge: age } } })
    setBusy(false)
    setNote(r.ok ? { ok: true, text: 'Saved' } : { ok: false, text: r.error ?? 'Couldn’t save.' })
    if (r.ok) onSaved?.()
  }
  async function sendTest() {
    setTesting(true); setTest(null)
    const r = await impactFetch('/api/impact/settings/test-email', { method: 'POST' })
    const j = await r.json().catch(() => ({})) as { error?: string; sentTo?: string; dry?: boolean }
    setTesting(false)
    setTest(r.ok ? { ok: true, text: j.dry ? `Test run locally: nothing sent (${j.sentTo}).` : `Sent to ${j.sentTo}, your sign-in address.` } : { ok: false, text: j.error ?? 'The test couldn’t be sent.' })
  }
  const e = status?.email
  return (
    <Card>
      <SectionTitle sub="How your emails go out, when they wait, and how the AI writes for you">
        <MessageSquare size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Messaging
      </SectionTitle>
      <div style={{ display: 'grid', fontSize: 12.5, marginBottom: 12 }}>
        <div style={row}>
          <span style={{ color: '#8A847E', fontWeight: 700 }}>Emails come from</span>
          <span style={{ fontWeight: 800, color: TP_DARK, textAlign: 'right', overflowWrap: 'anywhere' }}>
            {e ? <>{brand.org}{e.sender ? ` <${e.sender}>` : ''} <Pill tone={STATE_PILL[e.state].tone}>{STATE_PILL[e.state].text}</Pill></> : '…'}
          </span>
        </div>
        {e && <div style={{ fontSize: 11, color: '#8A847E', padding: '4px 0 6px' }}>{e.detail} Lumio sets up and verifies the sending address.</div>}
        <div style={row}>
          <span style={{ color: '#8A847E', fontWeight: 700 }}>Replies go to</span>
          <span style={{ fontWeight: 800, color: TP_DARK, textAlign: 'right', overflowWrap: 'anywhere' }}>reply+{slug}@inbound.lumiosports.com → your Inbox</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label><span style={formLabel}>Quiet hours from</span><input type="time" value={start} onChange={e => setStart(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Until</span><input type="time" value={end} onChange={e => setEnd(e.target.value)} style={formField} /></label>
      </div>
      <div style={{ fontSize: 11, color: '#8A847E', margin: '4px 0 12px' }}>Automations and scheduled newsletters wait until quiet hours end (UK time). A message you send yourself goes straight away.</div>

      <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, color: TP_DARK, margin: '4px 0 12px' }}>
        <input type="checkbox" checked={sms} onChange={e => setSms(e.target.checked)} style={{ marginTop: 2 }} />
        <span><strong>Texts (SMS)</strong><br /><span style={{ fontSize: 11, color: '#8A847E' }}>{!status ? '' : !status.sms.available ? status.sms.detail : sms ? 'On: texts go to families who said yes to texts.' : 'Off: your organisation sends no texts, whatever is chosen when sending.'}</span></span>
      </label>

      <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK, margin: '4px 0 6px' }}><Sparkles size={13} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />Brand voice (for AI drafts)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label><span style={formLabel}>Tone</span><input value={tone} maxLength={120} onChange={e => setTone(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Sign-off</span><input value={signOff} maxLength={120} onChange={e => setSignOff(e.target.value)} placeholder={brand.tagline || 'The team'} style={formField} /></label>
        <label><span style={formLabel}>Words and phrases to use (commas)</span><input value={use} onChange={e => setUse(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Words and phrases to avoid (commas)</span><input value={avoid} onChange={e => setAvoid(e.target.value)} style={formField} /></label>
        <label><span style={formLabel}>Reading age</span><input type="number" min={7} max={16} value={age} onChange={e => setAge(Number(e.target.value))} style={{ ...formField, maxWidth: 100 }} /></label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={busy || !org.canEdit} style={{ ...buttonPrimary, opacity: busy || !org.canEdit ? 0.6 : 1 }}><Save size={13} /> {busy ? 'Saving…' : 'Save'}</button>
        {note && <span role="status" style={{ fontSize: 12, fontWeight: 700, color: note.ok ? '#187A3C' : TP_RED }}>{note.text}</span>}
        <span style={{ flex: 1 }} />
        <button onClick={sendTest} disabled={testing || !org.canEdit || e?.state === 'not_connected'} style={{ ...buttonSecondary, opacity: testing || e?.state === 'not_connected' ? 0.6 : 1 }}><Send size={13} /> {testing ? 'Sending…' : 'Send me a test email'}</button>
      </div>
      {test && <div role="status" style={{ fontSize: 12, fontWeight: 700, color: test.ok ? '#187A3C' : TP_RED, marginTop: 6, textAlign: 'right' }}>{test.text}</div>}
    </Card>
  )
}
