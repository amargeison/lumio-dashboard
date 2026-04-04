'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, MapPin, Star, Check, Loader2 } from 'lucide-react'

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }

const TRIP_TYPES = [
  { id: 'museum', icon: '🏛️', label: 'Museum / Gallery' },
  { id: 'outdoor', icon: '🌿', label: 'Outdoor Education' },
  { id: 'theatre', icon: '🎭', label: 'Theatre / Arts' },
  { id: 'sports', icon: '⚽', label: 'Sports Event' },
  { id: 'science', icon: '🔬', label: 'Science Centre' },
  { id: 'historical', icon: '🏰', label: 'Historical Site' },
  { id: 'coastal', icon: '🌊', label: 'Coastal / Beach' },
  { id: 'creative', icon: '🎨', label: 'Creative Workshop' },
  { id: 'residential', icon: '🌍', label: 'Residential Trip' },
  { id: 'farm', icon: '🚜', label: 'Farm Visit' },
  { id: 'theme', icon: '🎪', label: 'Theme Park' },
  { id: 'adventure', icon: '🏔️', label: 'Adventure Activity' },
]

const DEMO_VENUES = [
  {
    name: 'Natural History Museum', distance: '42 miles', costPerHead: '£8.50', rating: 4.8,
    highlights: ['Free entry for school groups', 'Dedicated learning workshops', 'STEM curriculum-aligned activities'],
    ofsted: true,
  },
  {
    name: 'Cotswold Wildlife Park', distance: '28 miles', costPerHead: '£12.00', rating: 4.6,
    highlights: ['Hands-on animal encounters', 'Guided educational tours', 'Picnic areas and covered lunch spaces'],
    ofsted: true,
  },
  {
    name: 'Warwick Castle', distance: '35 miles', costPerHead: '£15.50', rating: 4.7,
    highlights: ['KS2 History curriculum links', 'Live medieval demonstrations', 'Risk assessment provided by venue'],
    ofsted: true,
  },
]

const STEPS = ['Configure', 'Research', 'Results', 'Book']

export default function SchoolTripsModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [step, setStep] = useState(0)
  const [tripType, setTripType] = useState('')
  const [yearGroup, setYearGroup] = useState('Year 5')
  const [tripDate, setTripDate] = useState('')
  const [pupils, setPupils] = useState(30)
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('')
  const [maxTravel, setMaxTravel] = useState('1 hour')
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null)
  const [leadTeacher, setLeadTeacher] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [riskAssessment, setRiskAssessment] = useState(false)
  const [parentalConsent, setParentalConsent] = useState(true)
  const [medicalNeeds, setMedicalNeeds] = useState(false)
  const [emailBody, setEmailBody] = useState('')
  const [researching, setResearching] = useState(false)
  const [researchProgress, setResearchProgress] = useState(0)

  // Simulate research
  useEffect(() => {
    if (step !== 1) return
    setResearching(true)
    setResearchProgress(0)
    const steps = [
      { delay: 800, progress: 25 },
      { delay: 1600, progress: 50 },
      { delay: 2400, progress: 75 },
      { delay: 3200, progress: 100 },
    ]
    const timers = steps.map(s => setTimeout(() => setResearchProgress(s.progress), s.delay))
    const done = setTimeout(() => { setResearching(false); setStep(2) }, 3500)
    return () => { timers.forEach(clearTimeout); clearTimeout(done) }
  }, [step])

  // Pre-fill email when venue selected
  useEffect(() => {
    if (selectedVenue !== null) {
      const v = DEMO_VENUES[selectedVenue]
      setEmailBody(`Dear ${v.name} Bookings Team,\n\nI am writing to enquire about a school visit for ${pupils} ${yearGroup} pupils from our school.\n\nProposed date: ${tripDate || 'TBC'}\n\nCould you please confirm availability, pricing for a group of ${pupils}, and send us your risk assessment documentation?\n\nMany thanks,\n${leadTeacher || '[Lead Teacher Name]'}`)
    }
  }, [selectedVenue, pupils, yearGroup, tripDate, leadTeacher])

  function handleSendEnquiry() {
    onToast(`Enquiry sent to ${DEMO_VENUES[selectedVenue!].name} — confirmation expected within 48 hours`)
    onClose()
  }

  const selectedType = TRIP_TYPES.find(t => t.id === tripType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl flex flex-col" style={{ maxWidth: 620, maxHeight: '90vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">🚌</span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>School Trip Researcher</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>AI-powered venue finding and booking</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: i <= step ? '#0D9488' : '#1F2937', color: i <= step ? '#F9FAFB' : '#6B7280' }}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: i <= step ? '#F9FAFB' : '#6B7280' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: i < step ? '#0D9488' : '#1F2937' }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 0 — Configure */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>What type of trip?</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TRIP_TYPES.map(t => (
                    <button key={t.id} onClick={() => setTripType(t.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors"
                      style={{ backgroundColor: tripType === t.id ? 'rgba(13,148,136,0.15)' : '#0A0B10', border: tripType === t.id ? '1px solid #0D9488' : '1px solid #1F2937' }}>
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-xs text-center font-medium" style={{ color: tripType === t.id ? '#0D9488' : '#9CA3AF' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16 }}>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#4B5563' }}>Logistics</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Year group</label>
                    <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={S}>
                      {Array.from({ length: 13 }, (_, i) => `Year ${i + 1}`).map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Trip date (approx.)</label>
                    <input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} style={S} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Number of pupils</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPupils(Math.max(1, pupils - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: 'none' }}>−</button>
                      <span className="text-sm font-bold flex-1 text-center" style={{ color: '#F9FAFB' }}>{pupils}</span>
                      <button onClick={() => setPupils(pupils + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: 'none' }}>+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Budget per head (£)</label>
                    <input value={budget} onChange={e => setBudget(e.target.value)} style={S} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Location / departure</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} style={S} placeholder="e.g. Milton Keynes" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Max travel time</label>
                    <select value={maxTravel} onChange={e => setMaxTravel(e.target.value)} style={S}>
                      <option>30 mins</option><option>1 hour</option><option>2 hours</option><option>Half day travel</option><option>Full day travel</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Research */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={40} className="animate-spin mb-4" style={{ color: '#0D9488' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Lumio is researching venues...</h3>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                {selectedType?.icon} Finding {selectedType?.label || 'venues'} for {pupils} {yearGroup} pupils
              </p>
              <div className="w-full max-w-xs space-y-2">
                {[
                  { label: 'Searching for venues', done: researchProgress >= 25 },
                  { label: 'Checking Ofsted suitability', done: researchProgress >= 50 },
                  { label: 'Verifying risk assessment requirements', done: researchProgress >= 75 },
                  { label: 'Preparing recommendations', done: researchProgress >= 100 },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-left">
                    {item.done ? <Check size={14} style={{ color: '#0D9488' }} /> : <div className="w-3.5 h-3.5 rounded-full border-2 animate-pulse" style={{ borderColor: '#374151' }} />}
                    <span className="text-xs" style={{ color: item.done ? '#0D9488' : '#6B7280' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Results */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>We found {DEMO_VENUES.length} venues matching your criteria</p>
              {DEMO_VENUES.map((v, i) => (
                <div key={v.name} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: selectedVenue === i ? '2px solid #0D9488' : '1px solid #1F2937' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{v.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}><MapPin size={10} /> {v.distance}</span>
                        <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{v.costPerHead}/head</span>
                        <span className="flex items-center gap-0.5 text-xs" style={{ color: '#FBBF24' }}><Star size={10} fill="#FBBF24" /> {v.rating}</span>
                      </div>
                    </div>
                    {v.ofsted && <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>Ofsted Suitable</span>}
                  </div>
                  <ul className="space-y-1 mb-3">
                    {v.highlights.map(h => (
                      <li key={h} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                        <span style={{ color: '#0D9488' }}>•</span> {h}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => { setSelectedVenue(i); setStep(3) }}
                    className="w-full py-2 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: selectedVenue === i ? '#0D9488' : 'rgba(13,148,136,0.1)', color: selectedVenue === i ? '#F9FAFB' : '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                    {selectedVenue === i ? '✓ Selected' : 'Select this venue'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Step 3 — Book */}
          {step === 3 && selectedVenue !== null && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#0D9488' }}>Selected venue</p>
                <p className="text-sm font-bold mt-1" style={{ color: '#F9FAFB' }}>{DEMO_VENUES[selectedVenue].name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{DEMO_VENUES[selectedVenue].distance} • {DEMO_VENUES[selectedVenue].costPerHead}/head • {pupils} pupils</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Lead teacher</label><input value={leadTeacher} onChange={e => setLeadTeacher(e.target.value)} style={S} placeholder="Mrs Smith" /></div>
                <div><label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Emergency contact</label><input value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} style={S} placeholder="07700 900123" /></div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Risk assessment completed?', val: riskAssessment, set: setRiskAssessment },
                  { label: 'Parental consent required?', val: parentalConsent, set: setParentalConsent },
                  { label: 'Medical needs to flag?', val: medicalNeeds, set: setMedicalNeeds },
                ].map(t => (
                  <div key={t.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{t.label}</span>
                    <button onClick={() => t.set(!t.val)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: t.val ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: 3, left: t.val ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Enquiry email (editable)</label>
                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} className="resize-none" style={S} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {step > 0 && step !== 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#9CA3AF' }}>
              <ArrowLeft size={12} /> Back
            </button>
          ) : <div />}
          {step === 0 && (
            <button onClick={() => { if (tripType) setStep(1) }} disabled={!tripType}
              className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: tripType ? '#0D9488' : '#374151', color: '#F9FAFB', opacity: tripType ? 1 : 0.5 }}>
              Research Venues <ArrowRight size={14} />
            </button>
          )}
          {step === 3 && (
            <button onClick={handleSendEnquiry} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Send Enquiry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
