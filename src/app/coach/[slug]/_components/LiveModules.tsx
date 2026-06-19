'use client'

// Schema-driven live CRUD modules for the Tennis Coach portal. One component
// drives every data module (players, staff, bookings, lessons, camps,
// payments) against the RLS-protected coach tables via coach-db.

import { useState } from 'react'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, RACKET_STAGES, type CoachTable } from '../_lib/coach-db'

type ThemeTokens = {
  text: string; text2: string; text3: string; panel: string; panel2: string
  border: string; btnText: string; isDark: boolean
}
type AccentTokens = { hex: string; dim: string }

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'money'
export interface Field {
  key: string
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
}
export interface ModuleConfig {
  table: CoachTable
  title: string
  singular: string
  blurb: string
  fields: Field[]
  columns: string[]
  // When set, the form shows a "Generate AI review" button that POSTs the
  // current draft to this endpoint and fills the `ai_review` field.
  aiReview?: { endpoint: string }
}

// ── Cell formatting ─────────────────────────────────────────────────────────
function formatCell(field: Field | undefined, value: any): string {
  if (value === null || value === undefined || value === '') return '—'
  if (!field) return String(value)
  if (field.type === 'money') return `£${Number(value).toLocaleString()}`
  if (field.type === 'date') { try { return new Date(value).toLocaleDateString('en-GB') } catch { return String(value) } }
  if (field.type === 'select') return field.options?.find(o => o.value === value)?.label ?? String(value)
  return String(value)
}

// ── The form modal ──────────────────────────────────────────────────────────
function FormModal({ config, initial, onClose, onSave, T, accent }: {
  config: ModuleConfig; initial: Record<string, any> | null
  onClose: () => void; onSave: (row: Record<string, any>) => Promise<void>
  T: ThemeTokens; accent: AccentTokens
}) {
  const [draft, setDraft] = useState<Record<string, any>>(initial ?? {})
  const [saving, setSaving] = useState(false)
  const [genning, setGenning] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: string, v: any) => setDraft(d => ({ ...d, [k]: v }))

  const generateReview = async () => {
    setGenning(true); setErr('')
    try {
      const res = await fetch(config.aiReview!.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error || 'AI review failed')
      setDraft(d => ({ ...d, ai_review: data.review }))
    } catch (e) { setErr(e instanceof Error ? e.message : 'AI review failed') }
    setGenning(false)
  }

  const save = async () => {
    for (const f of config.fields) {
      if (f.required && !String(draft[f.key] ?? '').trim()) { setErr(`${f.label} is required`); return }
    }
    setSaving(true); setErr('')
    try { await onSave(draft); onClose() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
          {initial?.id ? `Edit ${config.singular}` : `Add ${config.singular}`}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.fields.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                {f.label}{f.required ? ' *' : ''}
              </label>
              {f.type === 'textarea' ? (
                <textarea value={draft[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} rows={3} placeholder={f.placeholder} style={{ ...inputStyle, resize: 'vertical' }} />
              ) : f.type === 'select' ? (
                <select value={draft[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'money' || f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={draft[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>
        {config.aiReview && (
          <button onClick={generateReview} disabled={genning} style={{ marginTop: 12, width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${accent.hex}`, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: genning ? 0.6 : 1 }}>
            {genning ? 'Generating…' : (draft.ai_review ? '↻ Regenerate AI review' : '✨ Generate AI review')}
          </button>
        )}
        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Generic live module ─────────────────────────────────────────────────────
export function LiveModule({ config, T, accent }: { config: ModuleConfig; T: ThemeTokens; accent: AccentTokens }) {
  const { rows, loading, add, edit, remove } = useCoachTable(config.table)
  const [editing, setEditing] = useState<Record<string, any> | null | undefined>(undefined) // undefined = closed

  const fieldFor = (key: string) => config.fields.find(f => f.key === key)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>{config.title}</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>{config.blurb}</p>
        </div>
        <button onClick={() => setEditing(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Icon name="plus" size={14} /> Add {config.singular}
        </button>
      </div>

      {loading ? (
        <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      ) : rows.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No {config.title.toLowerCase()} yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>{config.blurb}</p>
          <button onClick={() => setEditing(null)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Add your first {config.singular.toLowerCase()}
          </button>
        </div>
      ) : (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {config.columns.map(c => (
                    <th key={c} style={{ textAlign: 'left', padding: '11px 16px', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {fieldFor(c)?.label ?? c}
                    </th>
                  ))}
                  <th style={{ padding: '11px 16px' }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {config.columns.map(c => (
                      <td key={c} style={{ padding: '11px 16px', color: c === config.columns[0] ? T.text : T.text2 }}>
                        {formatCell(fieldFor(c), row[c])}
                      </td>
                    ))}
                    <td style={{ padding: '8px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setEditing(row)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', color: T.text3, cursor: 'pointer', marginRight: 6, fontSize: 12, fontWeight: 600 }}>
                        Edit
                      </button>
                      <button onClick={() => { if (confirm(`Delete this ${config.singular.toLowerCase()}?`)) remove(row.id) }} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing !== undefined && (
        <FormModal
          config={config}
          initial={editing}
          onClose={() => setEditing(undefined)}
          onSave={row => (editing?.id ? edit(editing.id, row) : add(row))}
          T={T}
          accent={accent}
        />
      )}
    </div>
  )
}

// ── Module configs ──────────────────────────────────────────────────────────
const STAGE_OPTIONS = RACKET_STAGES.map(s => ({ value: s.id, label: s.name }))

export const PLAYERS_CONFIG: ModuleConfig = {
  table: 'coach_players', title: 'Players', singular: 'Player',
  blurb: 'The players you coach.',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'nickname', label: 'Nickname', type: 'text' },
    { key: 'level', label: 'Level', type: 'text', placeholder: 'e.g. Performance, Red ball' },
    { key: 'racket_stage', label: 'Racket stage', type: 'select', options: STAGE_OPTIONS },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['name', 'level', 'racket_stage', 'email'],
}

export const STAFF_CONFIG: ModuleConfig = {
  table: 'coach_staff', title: 'Coaches & staff', singular: 'Staff member',
  blurb: 'Your coaching team directory.',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text', placeholder: 'e.g. Head Coach, Assistant' },
    { key: 'qualifications', label: 'Qualifications', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['name', 'role', 'qualifications', 'email'],
}

export const BOOKINGS_CONFIG: ModuleConfig = {
  table: 'coach_bookings', title: 'Booking calendar', singular: 'Booking',
  blurb: 'Courts, hours and bookings.',
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. 1:1 with Sam' },
    { key: 'player_name', label: 'Player', type: 'text' },
    { key: 'court', label: 'Court', type: 'text' },
    { key: 'booking_date', label: 'Date', type: 'date' },
    { key: 'start_time', label: 'Start time', type: 'text', placeholder: 'e.g. 16:00' },
    { key: 'duration_min', label: 'Duration (min)', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'confirmed', label: 'Confirmed' }, { value: 'pending', label: 'Pending' }, { value: 'cancelled', label: 'Cancelled' },
    ] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['title', 'player_name', 'court', 'booking_date', 'start_time', 'status'],
}

export const LESSONS_CONFIG: ModuleConfig = {
  table: 'coach_sessions', title: 'Lesson summaries', singular: 'Lesson summary',
  blurb: 'Log sessions and generate AI reviews.',
  fields: [
    { key: 'player_name', label: 'Player', type: 'text', required: true },
    { key: 'session_date', label: 'Date', type: 'date' },
    { key: 'focus', label: 'Focus', type: 'text', placeholder: 'e.g. Serve, footwork' },
    { key: 'rating', label: 'Rating (1–5)', type: 'number' },
    { key: 'summary', label: 'Coach notes', type: 'textarea' },
    { key: 'ai_review', label: 'AI review (generated)', type: 'textarea', placeholder: 'Use the button below to generate a shareable review.' },
  ],
  columns: ['player_name', 'session_date', 'focus', 'rating'],
  aiReview: { endpoint: '/api/coach/ai-review' },
}

export const GPS_CONFIG: ModuleConfig = {
  table: 'coach_gps_sessions', title: 'GPS & video', singular: 'GPS session',
  blurb: 'On-court GPS metrics and video links per session.',
  fields: [
    { key: 'player_name', label: 'Player', type: 'text', required: true },
    { key: 'session_date', label: 'Date', type: 'date' },
    { key: 'distance_m', label: 'Distance (m)', type: 'number' },
    { key: 'top_speed_kmh', label: 'Top speed (km/h)', type: 'number' },
    { key: 'avg_hr', label: 'Avg HR (bpm)', type: 'number' },
    { key: 'video_url', label: 'Video link', type: 'text', placeholder: 'https://…' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['player_name', 'session_date', 'distance_m', 'top_speed_kmh', 'avg_hr'],
}

export const CAMPS_CONFIG: ModuleConfig = {
  table: 'coach_camps', title: 'Training camps', singular: 'Camp',
  blurb: 'Day camps and tours.',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'start_date', label: 'Start date', type: 'date' },
    { key: 'end_date', label: 'End date', type: 'date' },
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'price', label: 'Price (£)', type: 'money' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['name', 'start_date', 'end_date', 'capacity', 'price'],
}

export const PAYMENTS_CONFIG: ModuleConfig = {
  table: 'coach_payments', title: 'Payments', singular: 'Payment',
  blurb: 'Packages, invoices and renewals.',
  fields: [
    { key: 'player_name', label: 'Player', type: 'text', required: true },
    { key: 'item', label: 'Item', type: 'text', placeholder: 'e.g. 10-lesson block' },
    { key: 'amount', label: 'Amount (£)', type: 'money' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'paid', label: 'Paid' }, { value: 'due', label: 'Due' }, { value: 'overdue', label: 'Overdue' },
    ] },
    { key: 'due_date', label: 'Due date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['player_name', 'item', 'amount', 'status', 'due_date'],
}

export const SESSION_PLANS_CONFIG: ModuleConfig = {
  table: 'coach_session_plans', title: 'Session Planner', singular: 'Session plan',
  blurb: 'Plan your coaching sessions and drills.',
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. U10 squad — serve & volley' },
    { key: 'session_date', label: 'Date', type: 'date' },
    { key: 'group_name', label: 'Group / player', type: 'text' },
    { key: 'focus', label: 'Focus', type: 'text' },
    { key: 'duration_min', label: 'Duration (min)', type: 'number' },
    { key: 'drills', label: 'Drills', type: 'textarea', placeholder: 'List the drills for this session…' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['title', 'session_date', 'group_name', 'focus', 'duration_min'],
}

export const COURTS_CONFIG: ModuleConfig = {
  table: 'coach_courts', title: 'Court Planner', singular: 'Court',
  blurb: 'Your courts, surfaces and hours.',
  fields: [
    { key: 'name', label: 'Court name', type: 'text', required: true, placeholder: 'e.g. Court 1' },
    { key: 'surface', label: 'Surface', type: 'select', options: [
      { value: 'hard', label: 'Hard' }, { value: 'clay', label: 'Clay' }, { value: 'grass', label: 'Grass' }, { value: 'astro', label: 'Astro' }, { value: 'indoor', label: 'Indoor' },
    ] },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'hours', label: 'Hours', type: 'text', placeholder: 'e.g. Mon–Fri 8am–8pm' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'available', label: 'Available' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'booked', label: 'Booked out' },
    ] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['name', 'surface', 'location', 'hours', 'status'],
}

export const DEVELOPMENT_CONFIG: ModuleConfig = {
  table: 'coach_development', title: 'Player Development', singular: 'Development note',
  blurb: 'Four-corner development tracking per player.',
  fields: [
    { key: 'player_name', label: 'Player', type: 'text', required: true },
    { key: 'area', label: 'Area', type: 'select', options: [
      { value: 'technical', label: 'Technical' }, { value: 'tactical', label: 'Tactical' }, { value: 'physical', label: 'Physical' }, { value: 'social', label: 'Social' }, { value: 'psychological', label: 'Psychological' },
    ] },
    { key: 'rating', label: 'Rating (1–5)', type: 'number' },
    { key: 'target', label: 'Target', type: 'text' },
    { key: 'review_date', label: 'Review date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['player_name', 'area', 'rating', 'target', 'review_date'],
}

export const EQUIPMENT_CONFIG: ModuleConfig = {
  table: 'coach_equipment', title: 'Equipment', singular: 'Item',
  blurb: 'Your equipment inventory.',
  fields: [
    { key: 'item', label: 'Item', type: 'text', required: true, placeholder: 'e.g. Balls (dozen)' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Balls, Rackets, Nets' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'in_stock', label: 'In stock' }, { value: 'low', label: 'Low' }, { value: 'order', label: 'Order needed' },
    ] },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['item', 'category', 'quantity', 'status'],
}

export const RESOURCES_CONFIG: ModuleConfig = {
  table: 'coach_resources', title: 'Resource Centre', singular: 'Resource',
  blurb: 'Documents, links, drills and policies.',
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', options: [
      { value: 'document', label: 'Document' }, { value: 'video', label: 'Video' }, { value: 'link', label: 'Link' }, { value: 'drill', label: 'Drill' }, { value: 'policy', label: 'Policy' },
    ] },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'url', label: 'Link / URL', type: 'text', placeholder: 'https://…' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  columns: ['title', 'type', 'category', 'url'],
}

// ── Racket Progression view (lives over the players table) ───────────────────
export function RacketProgressionView({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows, loading, edit } = useCoachTable<any>('coach_players')

  const counts = RACKET_STAGES.map(s => rows.filter(r => r.racket_stage === s.id).length)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Racket Progression</h2>
        <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Set the reward stage for each player. Add players in the Players module first.</p>
      </div>

      {/* Distribution */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {RACKET_STAGES.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 999, padding: '5px 12px' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
            <span style={{ color: T.text2, fontSize: 12 }}>{s.name}</span>
            <span style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{counts[i]}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      ) : rows.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No players yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>Add players in the Players module, then set their stage here.</p>
        </div>
      ) : (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {rows.map((p: any) => {
            const stage = RACKET_STAGES.find(s => s.id === p.racket_stage)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: stage?.colour ?? T.border, border: '1px solid rgba(128,128,128,0.4)', flexShrink: 0 }} />
                  <span style={{ color: T.text, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  {p.level && <span style={{ color: T.text3, fontSize: 12 }}>· {p.level}</span>}
                </div>
                <select value={p.racket_stage ?? ''} onChange={e => edit(p.id, { racket_stage: e.target.value })}
                  style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', color: T.text, fontSize: 13, cursor: 'pointer' }}>
                  <option value="">No stage</option>
                  {RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
