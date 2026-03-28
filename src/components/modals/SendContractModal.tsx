'use client'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const CONTRACT_TYPES = ['Permanent', 'Fixed Term', 'Part Time', 'Zero Hours'] as const
const NOTICE_PERIODS = ['1 week', '2 weeks', '1 month', '2 months', '3 months']
const PROBATION_PERIODS = ['None', '3 months', '6 months', '12 months']

export default function SendContractModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [employee, setEmployee] = useState('')
  const [email, setEmail] = useState('')
  const [contractType, setContractType] = useState<typeof CONTRACT_TYPES[number]>('Permanent')
  const [startDate, setStartDate] = useState('')
  const [salary, setSalary] = useState('')
  const [notice, setNotice] = useState(NOTICE_PERIODS[2])
  const [probation, setProbation] = useState(PROBATION_PERIODS[1])
  const [notes, setNotes] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!employee || !email || !startDate || !salary) throw new Error('Fill required fields'); onSubmit() }}
      title="Send Contract" subtitle="Generate and send an employment contract" icon={FileText} iconColor="#8B5CF6" submitLabel="Send Contract →" submitIcon={FileText}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Employee Name</Label><input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="Sophie Williams" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sophie@company.com" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Contract Type</Label><PillSelector options={[...CONTRACT_TYPES]} value={contractType} onChange={setContractType} colors={{ Permanent: '#0D9488', 'Fixed Term': '#8B5CF6', 'Part Time': '#22D3EE', 'Zero Hours': '#F59E0B' }} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Start Date</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Salary (£)</Label><input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="35000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Notice Period</Label><select value={notice} onChange={e => setNotice(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{NOTICE_PERIODS.map(n => <option key={n}>{n}</option>)}</select></div>
        <div><Label>Probation Period</Label><select value={probation} onChange={e => setProbation(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{PROBATION_PERIODS.map(p => <option key={p}>{p}</option>)}</select></div>
      </div>
      <div><Label>Additional Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any special terms or conditions..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
