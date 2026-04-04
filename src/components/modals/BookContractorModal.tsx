'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Loader2, Star, MapPin } from 'lucide-react'

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }

const TYPES = [
  { id: 'plumber', icon: '🔧', label: 'Plumber' },
  { id: 'electrician', icon: '⚡', label: 'Electrician' },
  { id: 'painter', icon: '🎨', label: 'Painter / Decorator' },
  { id: 'locksmith', icon: '🔑', label: 'Locksmith' },
  { id: 'roofer', icon: '🏠', label: 'Roofer' },
  { id: 'glazier', icon: '🪟', label: 'Glazier' },
  { id: 'cleaner', icon: '🧹', label: 'Deep Clean' },
  { id: 'pest', icon: '🐛', label: 'Pest Control' },
  { id: 'hvac', icon: '❄️', label: 'HVAC / Heating' },
  { id: 'fire', icon: '🧯', label: 'Fire Safety' },
  { id: 'builder', icon: '🏗️', label: 'Builder' },
  { id: 'it', icon: '💻', label: 'IT / Networking' },
]

const DEMO_CONTRACTORS = [
  { name: 'MK Facilities Services', distance: '4.2 miles', rate: '£45/hr', rating: 4.9, highlights: ['DBS checked all staff', 'School specialist — 12 years experience', 'Same-day availability'], approved: true },
  { name: 'BrightSpark Electrical', distance: '7.8 miles', rate: '£55/hr', rating: 4.7, highlights: ['NICEIC registered', 'Emergency call-out available', 'PAT testing included'], approved: true },
  { name: 'ProFix Maintenance', distance: '11.3 miles', rate: '£38/hr', rating: 4.5, highlights: ['Multi-trade team', 'Fixed-price quotes', 'Insurance-backed guarantee'], approved: false },
]

const STEPS = ['Configure', 'Research', 'Results', 'Book']

export default function BookContractorModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [step, setStep] = useState(0)
  const [contractorType, setContractorType] = useState('')
  const [urgency, setUrgency] = useState('routine')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [accessNotes, setAccessNotes] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (step !== 1) return
    setProgress(0)
    const timers = [
      setTimeout(() => setProgress(25), 700),
      setTimeout(() => setProgress(50), 1400),
      setTimeout(() => setProgress(75), 2100),
      setTimeout(() => setProgress(100), 2800),
      setTimeout(() => setStep(2), 3200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [step])

  const selectedType = TYPES.find(t => t.id === contractorType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl flex flex-col" style={{ maxWidth: 600, maxHeight: '90vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">🔧</span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Book Contractor</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>Find and book approved contractors</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <div className="flex items-center gap-1 px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: i <= step ? '#0D9488' : '#1F2937', color: i <= step ? '#F9FAFB' : '#6B7280' }}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: i <= step ? '#F9FAFB' : '#6B7280' }}>{s}</span>
              </div>
              {i < 3 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: i < step ? '#0D9488' : '#1F2937' }} />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>What type of contractor?</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TYPES.map(t => (
                    <button key={t.id} onClick={() => setContractorType(t.id)} className="flex flex-col items-center gap-1.5 rounded-xl p-3"
                      style={{ backgroundColor: contractorType === t.id ? 'rgba(13,148,136,0.15)' : '#0A0B10', border: contractorType === t.id ? '1px solid #0D9488' : '1px solid #1F2937' }}>
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-xs text-center font-medium" style={{ color: contractorType === t.id ? '#0D9488' : '#9CA3AF' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Urgency</label>
                  <select value={urgency} onChange={e => setUrgency(e.target.value)} style={S}>
                    <option value="emergency">Emergency (today)</option><option value="urgent">Urgent (48 hours)</option><option value="routine">Routine</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Preferred date</label><input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} style={S} /></div>
              </div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Location / area</label><input value={location} onChange={e => setLocation(e.target.value)} style={S} placeholder="e.g. Main building, Room 12" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Description of work</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="resize-none" style={S} placeholder="Describe the issue or work required..." /></div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={40} className="animate-spin mb-4" style={{ color: '#0D9488' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Finding contractors...</h3>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{selectedType?.icon} Searching for {selectedType?.label || 'contractors'} near you</p>
              <div className="w-full max-w-xs space-y-2">
                {['Checking approved supplier list', 'Verifying DBS and insurance', 'Comparing availability and rates', 'Preparing recommendations'].map((item, i) => (
                  <div key={item} className="flex items-center gap-2 text-left">
                    {progress >= (i + 1) * 25 ? <Check size={14} style={{ color: '#0D9488' }} /> : <div className="w-3.5 h-3.5 rounded-full border-2 animate-pulse" style={{ borderColor: '#374151' }} />}
                    <span className="text-xs" style={{ color: progress >= (i + 1) * 25 ? '#0D9488' : '#6B7280' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>3 contractors available</p>
              {DEMO_CONTRACTORS.map((c, i) => (
                <div key={c.name} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: selectedIdx === i ? '2px solid #0D9488' : '1px solid #1F2937' }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{c.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}><MapPin size={10} /> {c.distance}</span>
                        <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{c.rate}</span>
                        <span className="flex items-center gap-0.5 text-xs" style={{ color: '#FBBF24' }}><Star size={10} fill="#FBBF24" /> {c.rating}</span>
                      </div>
                    </div>
                    {c.approved && <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>Approved</span>}
                  </div>
                  <ul className="space-y-1 mb-3">{c.highlights.map(h => <li key={h} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}><span style={{ color: '#0D9488' }}>•</span>{h}</li>)}</ul>
                  <button onClick={() => { setSelectedIdx(i); setStep(3) }} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: selectedIdx === i ? '#0D9488' : 'rgba(13,148,136,0.1)', color: selectedIdx === i ? '#F9FAFB' : '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                    {selectedIdx === i ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 3 && selectedIdx !== null && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#0D9488' }}>Selected contractor</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#F9FAFB' }}>{DEMO_CONTRACTORS[selectedIdx].name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{DEMO_CONTRACTORS[selectedIdx].rate} • {DEMO_CONTRACTORS[selectedIdx].distance}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Contact name</label><input value={contactName} onChange={e => setContactName(e.target.value)} style={S} placeholder="Your name" /></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Contact phone</label><input value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={S} placeholder="07700 900123" /></div>
              </div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Access notes</label><textarea value={accessNotes} onChange={e => setAccessNotes(e.target.value)} rows={2} className="resize-none" style={S} placeholder="Key collection, parking, site access..." /></div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {step > 0 && step !== 1 ? <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#9CA3AF' }}><ArrowLeft size={12} /> Back</button> : <div />}
          {step === 0 && <button onClick={() => { if (contractorType) setStep(1) }} disabled={!contractorType} className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: contractorType ? '#0D9488' : '#374151', color: '#F9FAFB', opacity: contractorType ? 1 : 0.5 }}>Find Contractors <ArrowRight size={14} /></button>}
          {step === 3 && <button onClick={() => { onToast(`Booking request sent to ${DEMO_CONTRACTORS[selectedIdx!].name}`); onClose() }} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Confirm Booking</button>}
        </div>
      </div>
    </div>
  )
}
