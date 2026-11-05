'use client'

// Staff CPD for one school, in its readiness card. Live portals only, and only
// for the org's HQ: the rows are written as the signed-in user, so tp_cpd's RLS
// confines them to this org.

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { GraduationCap, X } from 'lucide-react'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const field: React.CSSProperties = { border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 10px', fontSize: 12, background: '#fff', fontFamily: 'inherit', minWidth: 0 }

export function CpdPanel({ schoolId }: { schoolId: string }) {
  const { org, cpd, reload } = useImpact()
  const [draft, setDraft] = useState({ staff_name: '', course: '', cpd_date: '', provider: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!org?.canEdit) return null
  const rows = (cpd ?? []).filter(c => c.school_id === schoolId)
  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => ({ ...d, [k]: e.target.value }))

  async function run(work: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setError('')
    const { error: failed } = await work()
    setBusy(false)
    if (failed) { setError('Couldn’t save that. If this keeps happening, CPD records may not be switched on for this portal yet.'); return false }
    reload?.()
    return true
  }
  async function add() {
    const client = sb()
    const { data: { user } } = await client.auth.getUser()
    if (!user) { setError('Please sign in again.'); return }
    const saved = await run(() => client.from('tp_cpd').insert({
      hq_id: user.id, school_id: schoolId, staff_name: draft.staff_name.trim(), course: draft.course.trim(),
      cpd_date: draft.cpd_date || null, provider: draft.provider.trim() || null,
    }))
    if (saved) setDraft({ staff_name: '', course: '', cpd_date: '', provider: '' })
  }

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid #EFEBE6', paddingTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK, marginBottom: 8 }}>
        <GraduationCap size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />Staff CPD
      </div>
      <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
        {rows.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, background: '#F7F5F2', borderRadius: 9, padding: '8px 11px', fontSize: 11.5, color: '#5B554F' }}>
            <span style={{ minWidth: 0 }}><strong style={{ color: TP_DARK }}>{c.staff_name}</strong> — {c.course}{c.cpd_date ? `, ${new Date(c.cpd_date).toLocaleDateString('en-GB')}` : ''}{c.provider ? ` (${c.provider})` : ''}</span>
            <button aria-label={`Remove ${c.course}`} disabled={busy} onClick={() => run(() => sb().from('tp_cpd').delete().eq('id', c.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A847E', padding: 0 }}><X size={14} /></button>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
        <input style={field} placeholder="Staff member" aria-label="Staff member" value={draft.staff_name} onChange={set('staff_name')} />
        <input style={field} placeholder="Course" aria-label="Course" value={draft.course} onChange={set('course')} />
        <input style={field} type="date" aria-label="Date" value={draft.cpd_date} onChange={set('cpd_date')} />
        <input style={field} placeholder="Provider" aria-label="Provider" value={draft.provider} onChange={set('provider')} />
      </div>
      <button onClick={add} disabled={busy || !draft.staff_name.trim() || !draft.course.trim()} style={{ marginTop: 8, background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', opacity: busy || !draft.staff_name.trim() || !draft.course.trim() ? 0.5 : 1 }}>Add CPD record</button>
      {error && <div style={{ fontSize: 11.5, color: TP_RED, marginTop: 6, fontWeight: 700 }}>{error}</div>}
    </div>
  )
}
