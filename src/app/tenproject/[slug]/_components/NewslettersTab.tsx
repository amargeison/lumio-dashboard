'use client'

// Newsletters on a live portal: the list, the builder and the results.
//
// Builder: subject, preheader, sections (headline, body, optional image, optional
// button), the footer the org can't remove (address, sender, unsubscribe), a mobile /
// desktop preview of exactly what is sent, "Send me a test", and AI drafting from the
// org's own facts in three angles — the whole thing or one section at a time. Nothing
// goes to families until a person presses Send now (or schedules it).
// Results: recipients, sent, delivered, opened, unsubscribed, bounced, skipped (and why).

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Newspaper, Plus, Sparkles, Trash2, Send, Clock, Smartphone, Monitor, ArrowLeft, FlaskConical, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, SectionTitle, Pill, EmptyState, formField, formLabel, buttonPrimary, buttonSecondary } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { currentHq, impactFetch } from '@/lib/impact/org-scope'
import { draftNewsletter } from '@/lib/impact/ai'
import { ANGLES, type AngleId } from '@/lib/impact/ai-prompt'
import { AUDIENCE_LABELS, NEEDS_ID, type Audience, type AudienceKind } from '@/lib/impact/audiences'
import { cleanSections, draftProblem, footerAddress, renderNewsletter, LIMITS, type NewsletterSection } from '@/lib/impact/newsletter'
import { inQuietHours, quietHours } from '@/lib/impact/comms-settings'
import { countStatuses } from '@/lib/impact/campaign-send'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface CampaignListRow {
  id: string; name: string; status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  subject: string | null; preheader: string | null; sections: unknown; audience: unknown
  scheduled_at: string | null; sent_at: string | null; counts: Record<string, number> | null; error: string | null; created_at: string; updated_at: string
}

const TONE: Record<string, 'green' | 'amber' | 'grey' | 'red' | 'dark'> = { sent: 'green', sending: 'amber', scheduled: 'amber', draft: 'grey', failed: 'red', cancelled: 'grey' }
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
const emptySection = (): NewsletterSection => ({ headline: '', body: '', image: null, button: null })

export function NewslettersTab({ campaigns, loaded, onChange, startFor, onStarted }: { campaigns: CampaignListRow[]; loaded: boolean; onChange: () => void; startFor: Audience | null; onStarted: () => void }) {
  const [open, setOpen] = useState<CampaignListRow | 'new' | null>(null)
  const [presetAudience, setPresetAudience] = useState<Audience | null>(null)
  useEffect(() => { if (startFor) { setPresetAudience(startFor); setOpen('new'); onStarted() } }, [startFor, onStarted])

  if (open === 'new' || (open && (open.status === 'draft' || open.status === 'scheduled'))) {
    return <Builder initial={open === 'new' ? null : open} presetAudience={presetAudience} onClose={() => { setOpen(null); setPresetAudience(null); onChange() }} />
  }
  if (open) return <Results campaign={open} onBack={() => { setOpen(null); onChange() }} />

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <SectionTitle sub="Build, test, schedule and send — then see who it reached">Newsletters</SectionTitle>
        <button onClick={() => setOpen('new')} style={buttonPrimary}><Plus size={14} /> New newsletter</button>
      </div>
      {!loaded && <div style={{ fontSize: 12.5, color: '#6B6560' }}>Loading…</div>}
      {loaded && !campaigns.length && <EmptyState compact icon={Newspaper} title="No newsletters yet" sub="Start one, or let the AI draft it from your sessions, booklet week and key dates." />}
      <div style={{ display: 'grid', gap: 7 }}>
        {campaigns.map(c => {
          const n = c.counts ?? {}
          return (
            <button key={c.id} onClick={() => setOpen(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#F7F5F2', border: 'none', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>{c.subject || c.name || 'Untitled newsletter'}</div>
                <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2 }}>
                  {c.status === 'sent' && c.sent_at ? `Sent ${when(c.sent_at)} · ${n.sent ?? 0} sent, ${n.opened ?? 0} opened` : c.status === 'scheduled' && c.scheduled_at ? `Scheduled for ${when(c.scheduled_at)}` : c.status === 'failed' ? (c.error ?? 'Failed') : `Edited ${when(c.updated_at)}`}
                </div>
              </div>
              <Pill tone={TONE[c.status] ?? 'grey'}>{c.status.toUpperCase()}</Pill>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Builder ────────────────────────────────────────────────────────────────
function Builder({ initial, presetAudience, onClose }: { initial: CampaignListRow | null; presetAudience: Audience | null; onClose: () => void }) {
  const { brand, org } = useImpact()
  const settings = org?.settings ?? {}
  const [id, setId] = useState<string | null>(initial?.id ?? null)
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [preheader, setPreheader] = useState(initial?.preheader ?? '')
  const [sections, setSections] = useState<NewsletterSection[]>(() => { const s = cleanSections(initial?.sections); return s.length ? s : [emptySection()] })
  const [audience, setAudience] = useState<Audience>(() => (initial?.audience as Audience) ?? presetAudience ?? { kind: 'all', id: null })
  const [scheduleAt, setScheduleAt] = useState(() => initial?.scheduled_at ? toLocalInput(initial.scheduled_at) : '')
  const [angle, setAngle] = useState<AngleId>('this_week')
  const [focusDate, setFocusDate] = useState('')
  const [view, setView] = useState<'mobile' | 'desktop'>('mobile')
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [reach, setReach] = useState<{ line: string; reachable: number; total: number } | null>(null)
  const [lists, setLists] = useState<{ schools: { id: string; name: string }[]; venues: { id: string; name: string }[] }>({ schools: [], venues: [] })
  const [confirmSend, setConfirmSend] = useState(false)
  const status = initial?.status ?? 'draft'

  // The reachable count, refreshed whenever the audience changes.
  useEffect(() => {
    if (NEEDS_ID.includes(audience.kind) && !audience.id) { setReach(null); return }
    let stop = false
    impactFetch('/api/impact/comms/audience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audience }) })
      .then(async r => { const j = await r.json(); if (stop) return; if (r.ok) { setReach({ line: j.line, reachable: j.reachable, total: j.total }); setLists({ schools: j.schools ?? [], venues: j.venues ?? [] }) } else setReach({ line: j.error ?? 'Couldn’t count this audience.', reachable: 0, total: 0 }) })
      .catch(() => { if (!stop) setReach(null) })
    return () => { stop = true }
  }, [audience])

  const clean = useMemo(() => cleanSections(sections), [sections])
  const footer = { org: brand.org, address: footerAddress(settings), sender: null }
  const html = useMemo(() => renderNewsletter({ subject: subject || '(no subject)', preheader, sections: clean }, footer, null).html, [subject, preheader, clean, footer.org, footer.address]) // eslint-disable-line react-hooks/exhaustive-deps
  const problem = draftProblem({ subject, sections: clean })
  const q = quietHours(settings.messaging)

  const flash = (ok: boolean, text: string) => setNote({ ok, text })
  async function save(next: 'draft' | 'scheduled' = status === 'scheduled' ? 'scheduled' : 'draft', scheduled?: string | null): Promise<string | null> {
    const db = sb(); const hq = await currentHq(db)
    const row = { name: (subject.trim() || 'Newsletter').slice(0, 150), subject: subject.trim(), preheader: preheader.trim(), sections: clean, audience, channels: ['email'], status: next, scheduled_at: next === 'scheduled' ? scheduled ?? null : null }
    if (id) {
      const { error } = await db.from('impact_campaigns').update(row).eq('id', id).eq('hq_id', hq)
      if (error) throw new Error(error.message)
      return id
    }
    const { data, error } = await db.from('impact_campaigns').insert({ ...row, hq_id: hq, kind: 'newsletter' }).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'Couldn’t save.')
    setId(data.id as string)
    return data.id as string
  }
  const run = async (label: string, f: () => Promise<void>) => {
    setBusy(label); setNote(null)
    try { await f() } catch (e) { flash(false, e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy(null) }
  }

  const aiAll = () => run('ai', async () => {
    const d = await draftNewsletter(angle, undefined, focusDate || null)
    if (d.subject) setSubject(d.subject)
    if (d.preheader) setPreheader(d.preheader)
    if (d.sections?.length) setSections(d.sections.map(s => ({ ...emptySection(), ...s })))
    flash(true, 'Drafted from your facts. Read it through — nothing is sent until you press Send.')
  })
  const aiSection = (i: number) => run(`ai${i}`, async () => {
    const d = await draftNewsletter(angle, { index: i, current: clean[i] ?? sections[i], others: sections.filter((_, j) => j !== i).map(s => s.headline).filter(Boolean) }, focusDate || null)
    setSections(ss => ss.map((s, j) => (j === i ? { ...s, headline: d.headline ?? s.headline, body: d.body ?? s.body } : s)))
  })
  const test = () => run('test', async () => {
    const saved = await save()
    const r = await impactFetch('/api/impact/comms/campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test', id: saved }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'The test couldn’t be sent.')
    flash(true, `Test sent to ${j.to}.`)
  })
  const schedule = () => run('schedule', async () => {
    if (!scheduleAt) throw new Error('Choose a date and time first.')
    const at = new Date(scheduleAt)
    if (!(at.getTime() > Date.now() + 60_000)) throw new Error('Choose a time in the future.')
    await save('scheduled', at.toISOString())
    flash(true, `Scheduled for ${when(at.toISOString())}.${inQuietHours(at, q) ? ` That’s inside your quiet hours (${q.start}–${q.end}), so it will go when they end.` : ''}`)
  })
  const unschedule = () => run('unschedule', async () => { await save('draft'); flash(true, 'Back to a draft — it won’t send.') })
  const sendNow = () => run('send', async () => {
    const saved = await save('draft')
    const r = await impactFetch('/api/impact/comms/campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', id: saved }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || 'It couldn’t be sent.')
    setConfirmSend(false)
    onClose()
  })
  const remove = () => run('delete', async () => {
    if (id) { const db = sb(); const hq = await currentHq(db); const { error } = await db.from('impact_campaigns').delete().eq('id', id).eq('hq_id', hq); if (error) throw new Error(error.message) }
    onClose()
  })
  const setSection = (i: number, patch: Partial<NewsletterSection>) => setSections(ss => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, d: -1 | 1) => setSections(ss => { const n = [...ss]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); return n })
  const upcomingLogo = /^https:\/\//.test(settings.logo ?? '') ? settings.logo! : null

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onClose} style={{ ...buttonSecondary, padding: '6px 10px' }}><ArrowLeft size={13} /> Newsletters</button>
        <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK, flex: 1 }}>{initial ? 'Edit newsletter' : 'New newsletter'}</div>
        {status === 'scheduled' && initial?.scheduled_at && <Pill tone="amber">Scheduled {when(initial.scheduled_at)}</Pill>}
        <button onClick={() => run('save', async () => { await save(); flash(true, 'Saved.') })} disabled={!!busy} style={buttonSecondary}>{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, alignItems: 'start' }}>
        {/* ── Left: content ── */}
        <div style={{ display: 'grid', gap: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Sparkles size={14} style={{ color: TP_RED }} /><span style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK }}>Draft with AI</span></div>
            <div style={{ fontSize: 11.5, color: '#6B6560', marginBottom: 8 }}>Written from your real sessions, venues, booklet week, welcome pack and key dates, in your brand voice (Settings → Messaging). It never names a child or makes claims that aren’t in your records.</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {ANGLES.map(a => <button key={a.id} onClick={() => setAngle(a.id)} style={{ background: angle === a.id ? TP_DARK : '#F7F5F2', color: angle === a.id ? '#fff' : '#5B554F', border: 'none', borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>{a.label}</button>)}
            </div>
            {angle === 'date_push' && <label style={{ display: 'block', marginBottom: 8 }}><span style={formLabel}>The date to push (optional)</span><input type="date" value={focusDate} onChange={e => setFocusDate(e.target.value)} style={{ ...formField, maxWidth: 200 }} /></label>}
            <button onClick={aiAll} disabled={!!busy} style={{ ...buttonSecondary, opacity: busy ? 0.6 : 1 }}><Sparkles size={13} /> {busy === 'ai' ? 'Drafting…' : clean.length ? 'Replace with an AI draft' : 'Write the whole newsletter'}</button>
          </Card>

          <Card style={{ padding: 14 }}>
            <label style={{ display: 'block' }}><span style={formLabel}>Subject</span><input value={subject} maxLength={LIMITS.subject} onChange={e => setSubject(e.target.value)} style={formField} placeholder="What’s on this weekend" /></label>
            <label style={{ display: 'block', marginTop: 10 }}><span style={formLabel}>Preheader (the preview line under the subject)</span><input value={preheader} maxLength={LIMITS.preheader} onChange={e => setPreheader(e.target.value)} style={formField} /></label>
          </Card>

          {sections.map((s, i) => (
            <Card key={i} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#8A847E', flex: 1 }}>SECTION {i + 1}</span>
                <button onClick={() => aiSection(i)} disabled={!!busy} title="Rewrite this section with AI" style={{ ...buttonSecondary, padding: '4px 9px', fontSize: 11 }}><Sparkles size={12} /> {busy === `ai${i}` ? 'Writing…' : 'Regenerate'}</button>
                {i > 0 && <button onClick={() => move(i, -1)} aria-label="Move up" style={{ ...buttonSecondary, padding: '4px 7px' }}><ArrowUp size={12} /></button>}
                {i < sections.length - 1 && <button onClick={() => move(i, 1)} aria-label="Move down" style={{ ...buttonSecondary, padding: '4px 7px' }}><ArrowDown size={12} /></button>}
                {sections.length > 1 && <button onClick={() => setSections(ss => ss.filter((_, j) => j !== i))} aria-label="Remove section" style={{ ...buttonSecondary, padding: '4px 7px', color: TP_RED }}><Trash2 size={12} /></button>}
              </div>
              <input value={s.headline} maxLength={LIMITS.headline} onChange={e => setSection(i, { headline: e.target.value })} placeholder="Headline" style={{ ...formField, fontWeight: 800 }} />
              <textarea value={s.body} maxLength={LIMITS.body} onChange={e => setSection(i, { body: e.target.value })} rows={5} placeholder="A few short sentences. A blank line starts a new paragraph." style={{ ...formField, marginTop: 8, resize: 'vertical' }} />
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 11.5, fontWeight: 700, color: '#5B554F', cursor: 'pointer' }}>Image and button {s.image || s.button ? '(added)' : '(optional)'}</summary>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  <label><span style={formLabel}>Image (https link)</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={s.image?.url ?? ''} onChange={e => setSection(i, { image: e.target.value ? { url: e.target.value, alt: s.image?.alt ?? '' } : null })} placeholder="https://…" style={formField} />
                      {upcomingLogo && <button onClick={() => setSection(i, { image: { url: upcomingLogo, alt: brand.org } })} style={{ ...buttonSecondary, padding: '6px 9px', fontSize: 11, whiteSpace: 'nowrap' }}>Use our logo</button>}
                    </div>
                  </label>
                  {s.image && <label><span style={formLabel}>Describe the image (for screen readers)</span><input value={s.image.alt} maxLength={LIMITS.alt} onChange={e => setSection(i, { image: { ...s.image!, alt: e.target.value } })} style={formField} /></label>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 6 }}>
                    <label><span style={formLabel}>Button text</span><input value={s.button?.label ?? ''} maxLength={LIMITS.label} onChange={e => setSection(i, { button: { label: e.target.value, url: s.button?.url ?? '' } })} style={formField} /></label>
                    <label><span style={formLabel}>Button link (https)</span><input value={s.button?.url ?? ''} onChange={e => setSection(i, { button: { label: s.button?.label ?? '', url: e.target.value } })} placeholder="https://…" style={formField} /></label>
                  </div>
                  <div style={{ fontSize: 11, color: '#8A847E' }}>Picture uploads come with the new Settings; for now use a picture that’s already online (https).</div>
                </div>
              </details>
            </Card>
          ))}
          {sections.length < LIMITS.sections && <button onClick={() => setSections(ss => [...ss, emptySection()])} style={{ ...buttonSecondary, justifyContent: 'center', borderStyle: 'dashed' }}><Plus size={13} /> Add a section</button>}

          <Card style={{ padding: 14 }}>
            <span style={formLabel}>Who it’s for</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <select value={audience.kind} onChange={e => { const kind = e.target.value as AudienceKind; setAudience({ kind, id: kind === 'school' ? lists.schools[0]?.id ?? null : kind === 'venue' ? lists.venues[0]?.id ?? null : null }) }} style={{ ...formField, width: 'auto' }}>
                {(Object.keys(AUDIENCE_LABELS) as AudienceKind[]).map(k => <option key={k} value={k}>{AUDIENCE_LABELS[k]}</option>)}
              </select>
              {audience.kind === 'school' && <select value={audience.id ?? ''} onChange={e => setAudience({ kind: 'school', id: e.target.value })} style={{ ...formField, width: 'auto' }}>{lists.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
              {audience.kind === 'venue' && <select value={audience.id ?? ''} onChange={e => setAudience({ kind: 'venue', id: e.target.value })} style={{ ...formField, width: 'auto' }}>{lists.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: reach && reach.reachable ? TP_DARK : TP_RED, marginTop: 8 }}>{reach ? reach.line : 'Counting…'}</div>
            <div style={{ fontSize: 11, color: '#8A847E', marginTop: 2 }}>Worked out again at the moment it sends.</div>
          </Card>
        </div>

        {/* ── Right: preview and send ── */}
        <div style={{ display: 'grid', gap: 12, position: 'sticky', top: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 900, color: TP_DARK, flex: 1 }}>Preview</span>
              <button onClick={() => setView('mobile')} aria-label="Mobile" style={{ ...buttonSecondary, padding: '4px 8px', background: view === 'mobile' ? '#F0EBE5' : '#fff' }}><Smartphone size={13} /></button>
              <button onClick={() => setView('desktop')} aria-label="Desktop" style={{ ...buttonSecondary, padding: '4px 8px', background: view === 'desktop' ? '#F0EBE5' : '#fff' }}><Monitor size={13} /></button>
            </div>
            <div style={{ fontSize: 11.5, color: '#6B6560', marginBottom: 6 }}><b style={{ color: TP_DARK }}>{subject || '(no subject)'}</b>{preheader ? ` — ${preheader}` : ''}</div>
            <div style={{ display: 'flex', justifyContent: 'center', background: '#F4F2EF', borderRadius: 10, padding: 8 }}>
              <iframe title="Newsletter preview" sandbox="" srcDoc={html} style={{ width: view === 'mobile' ? 375 : '100%', maxWidth: '100%', height: 560, border: '1px solid #E7E2DC', borderRadius: view === 'mobile' ? 18 : 6, background: '#fff' }} />
            </div>
          </Card>

          <Card style={{ padding: 14, display: 'grid', gap: 10 }}>
            {problem && <div style={{ fontSize: 12, color: TP_RED, fontWeight: 700 }}>{problem}</div>}
            <button onClick={test} disabled={!!busy || !!problem} style={{ ...buttonSecondary, justifyContent: 'center', opacity: busy || problem ? 0.6 : 1 }}><FlaskConical size={13} /> {busy === 'test' ? 'Sending a test…' : 'Send me a test'}</button>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ flex: 1, minWidth: 180 }}><span style={formLabel}>Schedule for</span><input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} style={formField} /></label>
              <button onClick={schedule} disabled={!!busy || !!problem || !reach?.reachable} style={{ ...buttonSecondary, opacity: busy || problem || !reach?.reachable ? 0.6 : 1 }}><Clock size={13} /> {status === 'scheduled' ? 'Reschedule' : 'Schedule'}</button>
              {status === 'scheduled' && <button onClick={unschedule} disabled={!!busy} style={buttonSecondary}>Unschedule</button>}
            </div>
            <div style={{ fontSize: 11, color: '#8A847E' }}>Scheduled sends wait for your quiet hours ({q.start}–{q.end}) to end.</div>
            {!confirmSend
              ? <button onClick={() => setConfirmSend(true)} disabled={!!busy || !!problem || !reach?.reachable} style={{ ...buttonPrimary, justifyContent: 'center', opacity: busy || problem || !reach?.reachable ? 0.6 : 1 }}><Send size={14} /> Send now</button>
              : <div style={{ background: '#FDF3F3', borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK, marginBottom: 8 }}>Send “{subject}” to {reach?.reachable ?? 0} {reach?.reachable === 1 ? 'family' : 'families'} now? This can’t be undone.</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={sendNow} disabled={!!busy} style={buttonPrimary}><Send size={13} /> {busy === 'send' ? 'Sending…' : 'Yes, send it'}</button>
                    <button onClick={() => setConfirmSend(false)} disabled={!!busy} style={buttonSecondary}>Not yet</button>
                  </div>
                </div>}
            {note && <div role="status" style={{ fontSize: 12, color: note.ok ? '#187A3C' : TP_RED, fontWeight: 700 }}>{note.text}</div>}
            {id && <button onClick={remove} disabled={!!busy} style={{ ...buttonSecondary, justifyContent: 'center', color: TP_RED }}><Trash2 size={13} /> Delete this draft</button>}
          </Card>
        </div>
      </div>
    </div>
  )
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// ─── Results ────────────────────────────────────────────────────────────────
interface RecipientRow { family_id: string | null; status: string; skip_reason: string | null; error: string | null }
function Results({ campaign, onBack }: { campaign: CampaignListRow; onBack: () => void }) {
  const { people } = useImpact()
  const names = useMemo(() => new Map((people?.families ?? []).map(f => [f.id, f.guardian])), [people])
  const [rows, setRows] = useState<RecipientRow[] | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const load = useCallback(async () => {
    const db = sb(); const hq = await currentHq(db)
    const { data } = await db.from('impact_campaign_recipients').select('family_id, status, skip_reason, error').eq('hq_id', hq).eq('campaign_id', campaign.id).limit(20000)
    setRows((data ?? []) as RecipientRow[])
  }, [campaign.id])
  useEffect(() => { load() }, [load])
  const c = countStatuses(rows ?? [])
  const reasons = (rows ?? []).filter(r => r.status === 'skipped').reduce<Record<string, number>>((n, r) => ({ ...n, [r.skip_reason ?? 'other']: (n[r.skip_reason ?? 'other'] ?? 0) + 1 }), {})
  const tiles: [string, number, string?][] = [['RECIPIENTS', c.recipients], ['SENT', c.sent], ['DELIVERED', c.delivered], ['OPENED', c.opened + c.unsubscribed, 'Apple Mail opens every email, so this over-counts'], ['UNSUBSCRIBED', c.unsubscribed], ['BOUNCED', c.bounced + c.complained], ['NOT SENT', c.skipped + c.failed]]
  const shown = (rows ?? []).filter(r => filter === 'all' || r.status === filter)
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...buttonSecondary, padding: '6px 10px' }}><ArrowLeft size={13} /> Newsletters</button>
        <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK, flex: 1 }}>{campaign.subject}</div>
        <Pill tone={TONE[campaign.status] ?? 'grey'}>{campaign.status.toUpperCase()}</Pill>
        <button onClick={load} aria-label="Refresh" style={{ ...buttonSecondary, padding: '6px 9px' }}><RefreshCw size={13} /></button>
      </div>
      {campaign.status === 'sending' && <Card><div style={{ fontSize: 12.5, color: '#6B6560' }}>Still sending — big lists go out in batches every few minutes. {c.queued} waiting.</div></Card>}
      {campaign.error && <Card><div style={{ fontSize: 12.5, color: TP_RED }}>{campaign.error}</div></Card>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        {tiles.map(([l, v, hint]) => (
          <Card key={l} style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: TP_DARK, marginTop: 3 }}>{rows ? v : '…'}</div>
            {hint && <div style={{ fontSize: 10, color: '#8A847E', marginTop: 2 }}>{hint}</div>}
          </Card>
        ))}
      </div>
      {Object.keys(reasons).length > 0 && <Card style={{ padding: 14 }}><div style={{ fontSize: 12, color: '#5B554F' }}><b style={{ color: TP_DARK }}>Not sent because:</b> {Object.entries(reasons).map(([k, v]) => `${v} ${k}`).join(' · ')}</div></Card>}
      <Card>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {['all', 'sent', 'delivered', 'opened', 'unsubscribed', 'bounced', 'skipped', 'failed'].map(f => <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? TP_DARK : '#F7F5F2', color: filter === f ? '#fff' : '#5B554F', border: 'none', borderRadius: 999, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>{f.toUpperCase()}</button>)}
        </div>
        <div style={{ display: 'grid', gap: 5 }}>
          {shown.slice(0, 500).map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, background: '#F7F5F2', borderRadius: 8, padding: '7px 11px', fontSize: 12, color: TP_DARK }}>
              <span>{(r.family_id && names.get(r.family_id)) || 'A removed family'}</span>
              <span style={{ color: '#6B6560' }}>{r.status}{r.skip_reason ? ` — ${r.skip_reason}` : ''}{r.error ? ` — ${r.error}` : ''}</span>
            </div>
          ))}
          {rows && !shown.length && <div style={{ fontSize: 12, color: '#6B6560' }}>Nobody here.</div>}
        </div>
      </Card>
    </div>
  )
}
