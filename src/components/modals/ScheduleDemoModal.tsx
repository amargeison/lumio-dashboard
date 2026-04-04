'use client'
import { useState } from 'react'
import { Calendar } from 'lucide-react'
import ModalShell, { Label, inputStyle, CheckGroup } from './ModalShell'

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM']
const PRODUCTS = ['CRM', 'HR', 'Accounts', 'Sales', 'Schools']

export default function ScheduleDemoModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState(TIMES[0])
  const [products, setProducts] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!company || !contact || !email || !date) throw new Error('Fill required fields'); onSubmit() }}
      title="Schedule Demo" subtitle="Book a product demo" icon={Calendar} iconColor="#0D9488" submitLabel="Schedule Demo →" submitIcon={Calendar}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Company</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Meridian Group" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Marcus Webb" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marcus@meridian.co" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Phone</Label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Preferred Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Preferred Time</Label><select value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{TIMES.map(t => <option key={t}>{t}</option>)}</select></div>
      </div>
      <div><Label>Product Focus</Label><CheckGroup options={PRODUCTS} selected={products} onToggle={v => setProducts(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} /></div>
      <div><Label>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Interested in CRM migration from Salesforce..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
