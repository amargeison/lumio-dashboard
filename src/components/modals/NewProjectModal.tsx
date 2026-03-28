'use client'
import { useState } from 'react'
import { Layers, Plus, X } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const DEPARTMENTS = ['HR', 'Sales', 'Marketing', 'Operations', 'IT', 'Support', 'Success', 'Engineering', 'Product']
const STATUSES = ['Planning', 'Active', 'On Hold'] as const

export default function NewProjectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [owner, setOwner] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState<typeof STATUSES[number]>('Planning')
  const [description, setDescription] = useState('')
  const [milestones, setMilestones] = useState(['', '', ''])

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!name || !owner || !startDate || !description) throw new Error('Fill required fields'); onSubmit() }}
      title="Create Project" subtitle="Start a new project" icon={Layers} iconColor="#8B5CF6" submitLabel="Create Project →" submitIcon={Layers}>
      <div><Label required>Project Name</Label><input value={name} onChange={e => setName(e.target.value)} placeholder="Q2 Product Launch" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Department</Label><select value={department} onChange={e => setDepartment(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
        <div><Label required>Owner</Label><input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Dan Marsh" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label required>Start Date</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>End Date</Label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Budget (£)</Label><input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="25000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label>Status</Label><PillSelector options={[...STATUSES]} value={status} onChange={setStatus} colors={{ Planning: '#F59E0B', Active: '#0D9488', 'On Hold': '#9CA3AF' }} /></div>
      <div><Label required>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Project scope and objectives..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
      <div>
        <Label>Key Milestones (up to 3)</Label>
        <div className="flex flex-col gap-2">
          {milestones.map((m, i) => (
            <input key={i} value={m} onChange={e => { const n = [...milestones]; n[i] = e.target.value; setMilestones(n) }}
              placeholder={`Milestone ${i + 1}`} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          ))}
        </div>
      </div>
    </ModalShell>
  )
}
