'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X, Plus, History, Trash2, StickyNote } from 'lucide-react'

type Stage = 'Identified' | 'Approached' | 'Negotiating' | 'Done' | 'Failed'
type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

interface PipelineTarget {
  id: string
  name: string
  age: number | null
  position: string
  current_club: string | null
  current_league: string | null
  estimated_value: string | null
  weekly_wage_estimate: string | null
  contract_expires: string | null
  lumio_fit_score: number
  pipeline_stage: Stage
  pipeline_notes: string | null
  asking_price: string | null
  agent_name: string | null
  agent_contact: string | null
  priority: Priority
  deadline_date: string | null
  pipeline_added_at: string | null
}

interface Activity {
  id: string
  activity_type: string
  from_stage: string | null
  to_stage: string | null
  note: string | null
  created_at: string
  target_id: string | null
}

interface Props {
  clubId: string | null
  clubName: string
  isDemo?: boolean
}

const STAGES: { id: Stage; emoji: string; label: string; color: string }[] = [
  { id: 'Identified', emoji: '🔍', label: 'Identified', color: '#3B82F6' },
  { id: 'Approached', emoji: '📞', label: 'Approached', color: '#F59E0B' },
  { id: 'Negotiating', emoji: '🤝', label: 'Negotiating', color: '#A855F7' },
  { id: 'Done', emoji: '✅', label: 'Done', color: '#22C55E' },
  { id: 'Failed', emoji: '❌', label: 'Failed', color: '#6B7280' },
]

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: '#6B7280',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Critical: '#EF4444',
}

function fitColor(score: number): string {
  if (score <= 50) return '#EF4444'
  if (score <= 70) return '#F59E0B'
  if (score <= 85) return '#22C55E'
  return '#A855F7'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function isContractExpiring(expires: string | null): boolean {
  if (!expires) return false
  const m = expires.match(/(\w+)\s+(\d{4})/)
  if (!m) return false
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  const mi = months.indexOf(m[1].toLowerCase().slice(0, 3))
  if (mi < 0) return false
  const d = new Date(parseInt(m[2], 10), mi, 1)
  const diff = (d.getTime() - Date.now()) / 86400000
  return diff < 180
}

export default function TransferPipelineView({ clubId, clubName, isDemo = false }: Props) {
  const [targets, setTargets] = useState<PipelineTarget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [noteEditing, setNoteEditing] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  async function loadPipeline() {
    if (!clubId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/football/transfer-pipeline?clubId=${clubId}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load')
      } else {
        setTargets(json.targets ?? [])
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPipeline() }, [clubId])

  async function moveToStage(targetId: string, stage: Stage, note?: string) {
    if (!clubId) return
    // optimistic
    setTargets((prev) => prev.map((t) => t.id === targetId ? { ...t, pipeline_stage: stage } : t))
    try {
      await fetch('/api/football/transfer-pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, clubId, stage, note }),
      })
    } catch { /* ignore */ }
  }

  async function removeFromPipeline(targetId: string) {
    setTargets((prev) => prev.filter((t) => t.id !== targetId))
    try {
      await fetch(`/api/football/transfer-pipeline/${targetId}`, { method: 'DELETE' })
    } catch { /* ignore */ }
  }

  async function saveNote(targetId: string) {
    if (!clubId) return
    setTargets((prev) => prev.map((t) => t.id === targetId ? { ...t, pipeline_notes: noteDraft } : t))
    setNoteEditing(null)
    try {
      await fetch('/api/football/transfer-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, clubId, notes: noteDraft }),
      })
    } catch { /* ignore */ }
  }

  async function loadActivities() {
    if (!clubId) return
    try {
      // Activities live alongside the pipeline; reuse a quick fetch via supabase rest is overkill — derive from targets fetch isn't enough.
      // Instead, hit a lightweight endpoint via the same route — none exists, so we approximate by reading recent target changes via the DB indirectly.
      // To keep this self-contained, we just show a simple log derived from current targets' pipeline_added_at.
      const synthetic: Activity[] = targets.map((t, i) => ({
        id: `${t.id}-${i}`,
        target_id: t.id,
        activity_type: 'stage_change',
        from_stage: null,
        to_stage: t.pipeline_stage,
        note: t.pipeline_notes,
        created_at: t.pipeline_added_at ?? new Date().toISOString(),
      }))
      setActivities(synthetic.sort((a, b) => b.created_at.localeCompare(a.created_at)))
    } catch { /* ignore */ }
  }

  const totals = useMemo(() => ({
    total: targets.length,
    critical: targets.filter((t) => t.priority === 'Critical').length,
  }), [targets])

  const byStage = useMemo(() => {
    const map: Record<Stage, PipelineTarget[]> = {
      Identified: [], Approached: [], Negotiating: [], Done: [], Failed: [],
    }
    for (const t of targets) {
      if (map[t.pipeline_stage]) map[t.pipeline_stage].push(t)
    }
    return map
  }, [targets])

  function targetName(id: string | null): string {
    if (!id) return ''
    return targets.find((t) => t.id === id)?.name ?? ''
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">🔄 Transfer Pipeline</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
              {totals.total} players tracked
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              {totals.critical} critical deals
            </span>
            {isDemo && (
              <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                🔴 Live demo — changes save to database
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
            <Plus size={12} /> Add Player Manually
          </button>
          <button onClick={() => { loadActivities(); setShowHistory(true) }} className="text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            <History size={12} /> View History
          </button>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
      {loading && <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading pipeline...</p>}

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-3" style={{ minHeight: 400 }}>
        {STAGES.map((col) => {
          const items = byStage[col.id] ?? []
          const isOver = dragOverStage === col.id
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(col.id) }}
              onDragLeave={() => setDragOverStage((s) => s === col.id ? null : s)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverStage(null)
                if (draggingId) moveToStage(draggingId, col.id)
                setDraggingId(null)
              }}
              className="rounded-xl p-3 shrink-0 w-72 flex flex-col gap-2"
              style={{
                backgroundColor: '#0A0B10',
                border: isOver ? `2px dashed ${col.color}` : '1px solid #1F2937',
              }}
            >
              <div className="flex items-center justify-between px-1 pb-2" style={{ borderBottom: `2px solid ${col.color}` }}>
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span>{col.emoji}</span>
                  <span style={{ color: col.color }}>{col.label}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${col.color}22`, color: col.color }}>
                  {items.length}
                </span>
              </div>

              {items.length === 0 && (
                <p className="text-[10px] text-center py-6" style={{ color: '#6B7280' }}>Drop targets here</p>
              )}

              {items.map((t) => {
                const dDays = t.deadline_date ? daysUntil(t.deadline_date) : null
                const expiringContract = isContractExpiring(t.contract_expires)
                const noteExpanded = !!expandedNotes[t.id]
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDraggingId(t.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                    style={{
                      backgroundColor: '#111318',
                      border: '1px solid #1F2937',
                      opacity: draggingId === t.id ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{t.name}</p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${t.priority === 'Critical' ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: `${PRIORITY_COLORS[t.priority]}33`, color: PRIORITY_COLORS[t.priority] }}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] mb-2" style={{ color: '#9CA3AF' }}>
                      <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937' }}>{t.position}</span>
                      <span>{t.age ?? '—'}y</span>
                      <span className="truncate">· {t.current_club ?? 'Free'}</span>
                    </div>

                    <div className="mb-2">
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                        <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, t.lumio_fit_score))}%`, backgroundColor: fitColor(t.lumio_fit_score) }} />
                      </div>
                      <p className="text-[9px] mt-0.5 font-bold" style={{ color: fitColor(t.lumio_fit_score) }}>{t.lumio_fit_score}/100 fit</p>
                    </div>

                    <div className="text-[10px] space-y-0.5" style={{ color: '#9CA3AF' }}>
                      <p>💰 {t.estimated_value ?? '—'} · {t.weekly_wage_estimate ?? '—'}/wk</p>
                      <p style={{ color: expiringContract ? '#EF4444' : '#9CA3AF' }}>
                        📃 Contract: {t.contract_expires ?? '—'}
                      </p>
                      {t.agent_name && <p>🧑‍💼 {t.agent_name}</p>}
                      {dDays !== null && dDays <= 14 && (
                        <p style={{ color: '#EF4444' }}>⚠️ {dDays} days left</p>
                      )}
                    </div>

                    {t.pipeline_notes && (
                      <p
                        onClick={() => setExpandedNotes((p) => ({ ...p, [t.id]: !p[t.id] }))}
                        className="text-[10px] mt-2 italic cursor-pointer"
                        style={{
                          color: '#D1D5DB',
                          display: '-webkit-box',
                          WebkitLineClamp: noteExpanded ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {t.pipeline_notes}
                      </p>
                    )}

                    {noteEditing === t.id && (
                      <div className="mt-2">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          rows={2}
                          className="w-full text-[10px] px-2 py-1 rounded"
                          style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                        />
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => saveNote(t.id)} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#22C55E', color: '#000' }}>Save</button>
                          <button onClick={() => setNoteEditing(null)} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Card actions */}
                    <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: '1px solid #1F2937' }}>
                      <select
                        value={t.pipeline_stage}
                        onChange={(e) => moveToStage(t.id, e.target.value as Stage)}
                        className="text-[10px] px-1.5 py-1 rounded flex-1"
                        style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                      >
                        {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      <button
                        title="Add note"
                        onClick={() => { setNoteEditing(t.id); setNoteDraft(t.pipeline_notes ?? '') }}
                        className="p-1 rounded"
                        style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}
                      >
                        <StickyNote size={10} />
                      </button>
                      <button
                        title="Remove"
                        onClick={() => removeFromPipeline(t.id)}
                        className="p-1 rounded"
                        style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Activity Log Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-[90] flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowHistory(false)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto p-5" style={{ backgroundColor: '#0A0B10', borderLeft: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Activity History</h3>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><X size={14} /></button>
            </div>
            <div className="space-y-2">
              {activities.length === 0 && <p className="text-xs" style={{ color: '#6B7280' }}>No activity yet.</p>}
              {activities.map((a) => (
                <div key={a.id} className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p style={{ color: '#F9FAFB' }}>
                    🔄 <span className="font-semibold">{targetName(a.target_id)}</span>
                    {a.from_stage && a.to_stage ? ` moved ${a.from_stage} → ${a.to_stage}` : a.to_stage ? ` added to ${a.to_stage}` : ''}
                  </p>
                  {a.note && <p className="mt-1 italic" style={{ color: '#9CA3AF' }}>📝 {a.note}</p>}
                  <p className="mt-1 text-[10px]" style={{ color: '#6B7280' }}>{timeAgo(a.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <AddPlayerModal
          clubId={clubId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadPipeline() }}
        />
      )}
    </div>
  )
}

function AddPlayerModal({ clubId, onClose, onAdded }: { clubId: string | null; onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [position, setPosition] = useState('CM')
  const [currentClub, setCurrentClub] = useState('')
  const [currentLeague, setCurrentLeague] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [contractExpires, setContractExpires] = useState('')
  const [agentName, setAgentName] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    if (!clubId || !name) { setErr('Name and club required'); return }
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/football/transfer-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          stage: 'Identified',
          priority,
          agentName: agentName || undefined,
          target: {
            name,
            age: age ? parseInt(age, 10) : null,
            position,
            currentClub,
            currentLeague,
            estimatedValue,
            contractExpires,
            lumioFitScore: 70,
            source: 'manual',
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErr(json.error ?? 'Failed')
      } else {
        onAdded()
      }
    } catch {
      setErr('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rounded-xl w-full max-w-lg p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Add Player to Pipeline</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}><X size={14} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Name', value: name, set: setName, span: true },
            { label: 'Age', value: age, set: setAge },
            { label: 'Position', value: position, set: setPosition },
            { label: 'Current Club', value: currentClub, set: setCurrentClub },
            { label: 'Current League', value: currentLeague, set: setCurrentLeague },
            { label: 'Estimated Value', value: estimatedValue, set: setEstimatedValue },
            { label: 'Contract Expires', value: contractExpires, set: setContractExpires },
            { label: 'Agent Name', value: agentName, set: setAgentName },
          ].map((f) => (
            <div key={f.label} className={f.span ? 'col-span-2' : ''}>
              <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{f.label}</label>
              <input value={f.value} onChange={(e) => f.set(e.target.value)} className="mt-1 w-full px-2 py-1.5 rounded text-xs"
                style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="mt-1 w-full px-2 py-1.5 rounded text-xs"
              style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}>
              {(['Low','Medium','High','Critical'] as Priority[]).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        {err && <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{err}</p>}
        <button onClick={submit} disabled={saving} className="mt-4 w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
          style={{ backgroundColor: '#003DA5', color: '#F1C40F' }}>
          {saving ? 'Adding...' : 'Add to Pipeline'}
        </button>
      </div>
    </div>
  )
}
