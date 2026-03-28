'use client'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import ModalShell, { Label, inputStyle } from './ModalShell'

const INDUSTRIES = ['SaaS / Software', 'EdTech', 'FinTech', 'E-commerce', 'Consulting', 'Agency', 'Healthcare', 'Legal', 'Property', 'Manufacturing', 'Charity', 'Other']
const SOURCES = ['Referral', 'Inbound', 'Outbound', 'Event', 'Other']

export default function NewClientModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [contact, setContact] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [value, setValue] = useState('')
  const [source, setSource] = useState(SOURCES[0])

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!company || !contact || !email) throw new Error('Fill required fields'); onSubmit() }}
      title="Add Client" subtitle="Add a new client to the CRM" icon={UserPlus} submitLabel="Add Client →" submitIcon={UserPlus}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Company Name</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Industry</Label><select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Sarah Chen" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Job Title</Label><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="VP Sales" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@axontech.io" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Phone</Label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 20 1234 5678" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Website</Label><input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://axontech.io" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Est. Annual Value (£)</Label><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="50000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label>Source</Label><select value={source} onChange={e => setSource(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
    </ModalShell>
  )
}
