'use client'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'] as const

export default function NewDealModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [dealName, setDealName] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState<typeof STAGES[number]>('Lead')
  const [closeDate, setCloseDate] = useState('')
  const [probability, setProbability] = useState('')
  const [notes, setNotes] = useState('')

  const prob = parseInt(probability) || 0
  const probColor = prob < 30 ? '#EF4444' : prob < 70 ? '#F59E0B' : '#22C55E'

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!dealName || !company || !value || !closeDate) throw new Error('Fill required fields'); onSubmit() }}
      title="Create Deal" subtitle="Add a new deal to the pipeline" icon={TrendingUp} submitLabel="Create Deal →" submitIcon={TrendingUp}>
      <div><Label required>Deal Name</Label><input value={dealName} onChange={e => setDealName(e.target.value)} placeholder="Axon Technologies — Enterprise Suite" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Company</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Sarah Chen" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Stage</Label><PillSelector options={[...STAGES]} value={stage} onChange={setStage} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Value (£)</Label><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="182000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Expected Close</Label><input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Probability (%)</Label>
          {probability && <span className="text-xs font-bold" style={{ color: probColor }}>{prob}%</span>}
        </div>
        <input type="number" value={probability} onChange={e => setProbability(e.target.value)} placeholder="75" min="0" max="100" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        {probability && (
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(prob, 100)}%`, backgroundColor: probColor }} />
          </div>
        )}
      </div>
      <div><Label>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Key stakeholders, timeline notes..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
