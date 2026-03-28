'use client'
import { useState } from 'react'
import { Monitor } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const CATEGORIES = ['Hardware', 'Software', 'Access', 'Network', 'Security', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
const PRIORITY_COLORS: Record<string, string> = { Low: '#22C55E', Medium: '#F59E0B', High: '#F97316', Critical: '#EF4444' }
const TEAM = ['Unassigned', 'Dan Marsh', 'Sophie Williams', 'Raj Patel', 'Alex Turner']

export default function NewITTicketModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('Medium')
  const [reportedBy, setReportedBy] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState(TEAM[0])

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!title || !reportedBy || !description) throw new Error('Fill required fields'); onSubmit() }}
      title="Raise IT Ticket" subtitle="Log a new IT support request" icon={Monitor} iconColor="#F59E0B" submitLabel="Raise Ticket →" submitIcon={Monitor}>
      <div><Label required>Title</Label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Laptop won't connect to VPN" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Category</Label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><Label required>Reported By</Label><input value={reportedBy} onChange={e => setReportedBy(e.target.value)} placeholder="Sophie Williams" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Priority</Label><PillSelector options={[...PRIORITIES]} value={priority} onChange={setPriority} colors={PRIORITY_COLORS} /></div>
      <div><Label required>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the issue in detail..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
      <div><Label>Assign To</Label><select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{TEAM.map(t => <option key={t}>{t}</option>)}</select></div>
    </ModalShell>
  )
}
