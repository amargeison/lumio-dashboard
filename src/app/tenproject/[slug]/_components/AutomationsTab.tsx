'use client'

// Automations on a live portal. Five, each off until an HQ switches it on: a switch, its
// email(s) to edit, "who would receive it today" (worked out on the server by the same
// rules the scheduler uses), and the limits that apply to all of them — quiet hours from
// Settings → Messaging and one automated message per family per day.
// Switching the welcome on records the moment, so only families who join after that get it.

import React, { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Zap, Eye, Save } from 'lucide-react'
import { Card, SectionTitle, Pill, formField, formLabel, buttonPrimary, buttonSecondary } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { currentHq, impactFetch } from '@/lib/impact/org-scope'
import { AUTOMATION_KINDS, AUTOMATION_META, templateFor, type AutomationConfig, type AutomationKind } from '@/lib/impact/automations'
import { quietHours } from '@/lib/impact/comms-settings'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
interface Row { id: string; kind: AutomationKind; enabled: boolean; config: AutomationConfig }
interface Preview { send: { name: string; step: string; subject: string; body: string }[]; waiting: { name: string; step: string }[]; skipped: { name: string; step: string; reason: string }[] }

export function AutomationsTab() {
  const { org } = useImpact()
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const q = quietHours(org?.settings.messaging)
  const load = useCallback(async () => {
    try {
      const db = sb(); const hq = await currentHq(db)
      const { data, error } = await db.from('impact_automations').select('id, kind, enabled, config').eq('hq_id', hq)
      if (error) throw new Error(error.message)
      setRows((data ?? []) as Row[])
    } catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t load automations.') }
  }, [])
  useEffect(() => { load() }, [load])
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card style={{ padding: 14 }}>
        <SectionTitle sub={`Each one is off until you switch it on. Nothing automated goes out in your quiet hours (${q.start}–${q.end}, Settings → Messaging), and a family gets at most one automated message a day. Families without consent, who unsubscribed or have no working email are left out.`}>Automations</SectionTitle>
        {error && <div style={{ fontSize: 12.5, color: TP_RED }}>{error}</div>}
      </Card>
      {AUTOMATION_KINDS.map(k => <AutomationCard key={k} kind={k} row={rows.find(r => r.kind === k)} onSaved={load} />)}
    </div>
  )
}

function AutomationCard({ kind, row, onSaved }: { kind: AutomationKind; row?: Row; onSaved: () => void }) {
  const { people } = useImpact()
  const meta = AUTOMATION_META[kind]
  const [config, setConfig] = useState<AutomationConfig>(row?.config ?? {})
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  useEffect(() => { setConfig(row?.config ?? {}) }, [row])
  const venues = people?.community?.venues ?? []

  async function save(enabled: boolean, next: AutomationConfig = config) {
    setBusy(true); setNote(null)
    try {
      const db = sb(); const hq = await currentHq(db)
      const cfg = kind === 'welcome' && enabled && !row?.enabled ? { ...next, since: new Date().toISOString() } : next
      const { error } = await db.from('impact_automations').upsert({ hq_id: hq, kind, enabled, config: cfg, updated_at: new Date().toISOString() }, { onConflict: 'hq_id,kind' })
      if (error) throw new Error(error.message)
      setNote({ ok: true, text: enabled !== !!row?.enabled ? (enabled ? 'Switched on — the next run picks it up within five minutes.' : 'Switched off.') : 'Saved.' })
      onSaved()
    } catch (e) { setNote({ ok: false, text: e instanceof Error ? e.message : 'Couldn’t save.' }) } finally { setBusy(false) }
  }
  async function showPreview() {
    setBusy(true); setNote(null)
    try {
      const r = await impactFetch('/api/impact/comms/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, config }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setPreview(j)
    } catch (e) { setNote({ ok: false, text: e instanceof Error ? e.message : 'Couldn’t preview.' }) } finally { setBusy(false) }
  }
  const setTemplate = (step: string, patch: { subject?: string; body?: string }) => {
    const key = kind === 'welcome' ? step : 'main'
    const cur = templateFor(kind, step, config)
    setConfig(c => ({ ...c, templates: { ...(c.templates ?? {}), [key]: { ...cur, ...(c.templates?.[key] ?? {}), ...patch } } }))
  }
  const toggleVenue = (id: string) => setConfig(c => ({ ...c, venues: (c.venues ?? []).includes(id) ? (c.venues ?? []).filter(x => x !== id) : [...(c.venues ?? []), id] }))

  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Zap size={15} style={{ color: row?.enabled ? TP_RED : '#B8B2AC' }} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: TP_DARK }}>{meta.title} {row?.enabled ? <Pill tone="green">ON</Pill> : <Pill tone="grey">OFF</Pill>}</div>
          <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>{meta.when}</div>
        </div>
        <button onClick={showPreview} disabled={busy} style={{ ...buttonSecondary, padding: '6px 10px', fontSize: 11.5 }}><Eye size={13} /> Who would get it today</button>
        <button onClick={() => setOpen(o => !o)} style={{ ...buttonSecondary, padding: '6px 10px', fontSize: 11.5 }}>{open ? 'Close' : 'Edit'}</button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: TP_DARK, cursor: busy ? 'default' : 'pointer' }}>
          <input type="checkbox" checked={!!row?.enabled} disabled={busy} onChange={e => save(e.target.checked)} style={{ width: 18, height: 18 }} /> On
        </label>
      </div>
      {open && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12, borderTop: '1px solid #EEE9E3', paddingTop: 12 }}>
          {meta.steps.map(s => {
            const t = templateFor(kind, s.id, config)
            return (
              <div key={s.id} style={{ background: '#F7F5F2', borderRadius: 10, padding: 10 }}>
                {meta.steps.length > 1 && <div style={{ fontSize: 11, fontWeight: 900, color: '#8A847E', marginBottom: 6 }}>{s.label.toUpperCase()}</div>}
                <label style={{ display: 'block' }}><span style={formLabel}>Subject</span><input value={t.subject} onChange={e => setTemplate(s.id, { subject: e.target.value })} style={formField} maxLength={150} /></label>
                <label style={{ display: 'block', marginTop: 6 }}><span style={formLabel}>Email</span><textarea value={t.body} onChange={e => setTemplate(s.id, { body: e.target.value })} rows={4} style={{ ...formField, resize: 'vertical' }} maxLength={2500} /></label>
              </div>
            )
          })}
          <div style={{ fontSize: 11, color: '#8A847E' }}>You can use {meta.placeholders.map(p => `{${p}}`).join(', ')}. There’s no placeholder for a child’s name, on purpose.</div>
          {kind === 'programme_week' && <div style={{ fontSize: 11.5, color: '#5B554F' }}>Sent when a programme is <b>running</b> and its current week (Schools → programme) is 1–10, using that week of the Activity Booklet. Each week goes once per family. It overlaps the Booklet-week nudge, so switch on one or the other.</div>}
          {kind === 'session_reminder' && venues.length > 0 && (
            <div><span style={formLabel}>Weekend venues (none ticked = all)</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{venues.map(v => <label key={v.id} style={{ fontSize: 12, color: TP_DARK, display: 'inline-flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={(config.venues ?? []).includes(v.id)} onChange={() => toggleVenue(v.id)} />{v.name}</label>)}</div>
            </div>
          )}
          <div><button onClick={() => save(!!row?.enabled)} disabled={busy} style={buttonPrimary}><Save size={13} /> Save</button></div>
        </div>
      )}
      {note && <div role="status" style={{ fontSize: 12, color: note.ok ? '#187A3C' : TP_RED, fontWeight: 700, marginTop: 8 }}>{note.text}</div>}
      {preview && (
        <div style={{ marginTop: 10, background: '#F7F5F2', borderRadius: 10, padding: 10, fontSize: 12, color: TP_DARK }}>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>{preview.send.length ? `${preview.send.length} ${preview.send.length === 1 ? 'family' : 'families'} would get it today${row?.enabled ? '' : ' if it were on'}` : 'Nobody would get it today.'}</div>
          {preview.send.slice(0, 30).map((p, i) => <div key={i} style={{ color: '#5B554F' }}>{p.name} — “{p.subject}”</div>)}
          {preview.send.length > 30 && <div style={{ color: '#8A847E' }}>…and {preview.send.length - 30} more</div>}
          {preview.waiting.length > 0 && <div style={{ color: '#8A847E', marginTop: 4 }}>{preview.waiting.length} already have another automated message today, so theirs waits.</div>}
          {preview.skipped.length > 0 && <div style={{ color: '#8A847E', marginTop: 4 }}>Left out: {preview.skipped.map(s => `${s.name} (${s.reason})`).slice(0, 10).join(', ')}{preview.skipped.length > 10 ? '…' : ''}</div>}
        </div>
      )}
    </Card>
  )
}
