'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Loader2 } from 'lucide-react'

type ModalProps = { onClose: () => void; isDemoMode?: boolean }
const iS: React.CSSProperties = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

function WizardShell({ onClose, title, subtitle, icon, step, totalSteps, stepLabels, setStep, children, onFinish }: {
  onClose: () => void; title: string; subtitle: string; icon: string
  step: number; totalSteps: number; stepLabels: string[]; setStep: (s: number) => void; children: React.ReactNode; onFinish?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>{icon}</div>
            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {stepLabels.map((l, i) => {
            const s = i + 1; const active = step === s; const done = step > s
            return (<div key={l} className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: done ? '#0D9488' : active ? 'rgba(13,148,136,0.2)' : '#1F2937', color: done ? '#fff' : active ? '#0D9488' : '#6B7280' }}>{done ? <Check size={12} /> : s}</div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>{l}</span>
              {i < stepLabels.length - 1 && <ChevronRight size={12} style={{ color: '#374151' }} />}
            </div>)
          })}
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>{step === 1 ? 'Cancel' : '\u2190 Back'}</button>
          {step === totalSteps
            ? <button onClick={() => { onFinish?.(); onClose() }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Check size={14} /> Done</button>
            : <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Next <ChevronRight size={14} /></button>}
        </div>
      </div>
    </div>
  )
}
function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
}
function DemoConfirm({ isDemoMode, text }: { isDemoMode?: boolean; text: string }) {
  return isDemoMode ? (
    <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
      <p className="text-xs font-semibold" style={{ color: '#0D9488' }}>Demo mode</p>
      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>On a live plan this would be actioned instantly and synced to your MIS.</p>
    </div>
  ) : <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{text}</p>
}
function genRef(prefix: string) { return `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}` }

/* ─── Demo data ─── */
const DEMO_TEACHERS = ['Mrs S. Thompson', 'Mr D. Patel', 'Ms R. Clarke', 'Mr J. Edwards', 'Mrs L. Morgan', 'Mr A. Williams', 'Ms K. Bennett', 'Mr T. Hughes']
const DEMO_CLASSES = ['7A English', '8B Maths', '9C Science', '10D History', '11E Geography', '7F Art', '8G PE', '9H Music']
const DEMO_ROOMS = [
  { name: 'Room 101', capacity: 30, facilities: ['Projector', 'Whiteboard'] },
  { name: 'Room 204', capacity: 32, facilities: ['Projector', 'Whiteboard', 'Computers'] },
  { name: 'Science Lab 1', capacity: 28, facilities: ['Projector', 'Whiteboard', 'Science Lab'] },
  { name: 'Sports Hall', capacity: 60, facilities: ['Sports Hall'] },
  { name: 'Room 112', capacity: 25, facilities: ['Projector', 'Computers'] },
  { name: 'Room 305', capacity: 30, facilities: ['Projector', 'Whiteboard'] },
]
const PERIODS = ['1', '2', '3', '4', '5', '6']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const SUBJECTS = ['English', 'Maths', 'Science', 'History', 'Geography', 'Art', 'PE', 'Music']

/* ═══════════════════════════════════════════════════════
   1. CoverLessonModal
   ═══════════════════════════════════════════════════════ */
export function CoverLessonModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [teacher, setTeacher] = useState('')
  const [cls, setCls] = useState('')
  const [date, setDate] = useState('')
  const [period, setPeriod] = useState('')
  const [instructions, setInstructions] = useState('')
  const [resourcesNeeded, setResourcesNeeded] = useState(false)
  const ref = genRef('COV')

  return (
    <WizardShell onClose={onClose} title="Cover Lesson" subtitle="Arrange cover for an absent teacher" icon="🔄" step={step} totalSteps={3} stepLabels={['Details', 'Cover Work', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Absent Teacher</Label>
            <select value={teacher} onChange={e => setTeacher(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select teacher...</option>
              {DEMO_TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Class</Label>
            <select value={cls} onChange={e => setCls(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select class...</option>
              {DEMO_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label req>Date</Label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Period</Label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
                <option value="">Select period...</option>
                {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Cover Work Instructions</Label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={5} placeholder="Describe the work students should complete during this lesson..." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Resources Needed</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Mark if printed materials or equipment are required</p>
            </div>
            <button onClick={() => setResourcesNeeded(!resourcesNeeded)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: resourcesNeeded ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: resourcesNeeded ? 20 : 2 }} />
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Cover lesson created</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>Notification sent to cover supervisor.</p>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>Reference: <span style={{ color: '#F9FAFB' }}>{ref}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Absent Teacher: <span style={{ color: '#F9FAFB' }}>{teacher || '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Class: <span style={{ color: '#F9FAFB' }}>{cls || '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Date: <span style={{ color: '#F9FAFB' }}>{date || '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Period: <span style={{ color: '#F9FAFB' }}>{period ? `Period ${period}` : '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Resources Needed: <span style={{ color: '#F9FAFB' }}>{resourcesNeeded ? 'Yes' : 'No'}</span></p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Cover lesson will be created and the cover supervisor notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════
   2. RoomFinderModal
   ═══════════════════════════════════════════════════════ */
export function RoomFinderModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const [period, setPeriod] = useState('')
  const [capacityMin, setCapacityMin] = useState('')
  const [facilities, setFacilities] = useState<string[]>([])
  const [selectedRoom, setSelectedRoom] = useState('')

  const facilityOptions = ['Projector', 'Whiteboard', 'Computers', 'Science Lab', 'Sports Hall']

  const toggleFacility = (f: string) => {
    setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const filteredRooms = DEMO_ROOMS.filter(r => {
    if (capacityMin && r.capacity < parseInt(capacityMin)) return false
    if (facilities.length > 0 && !facilities.every(f => r.facilities.includes(f))) return false
    return true
  }).slice(0, 4)

  const availabilityStatuses = ['Available', 'Available', 'Booked P3', 'Available']

  return (
    <WizardShell onClose={onClose} title="Room Finder" subtitle="Search for available rooms" icon="🏫" step={step} totalSteps={3} stepLabels={['Search', 'Results', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label req>Date</Label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Period</Label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
                <option value="">Select period...</option>
                {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Minimum Capacity</Label>
            <input type="number" value={capacityMin} onChange={e => setCapacityMin(e.target.value)} placeholder="e.g. 25" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label>Required Facilities</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {facilityOptions.map(f => (
                <label key={f} className="flex items-center gap-2 rounded-lg p-2 cursor-pointer" style={{ backgroundColor: facilities.includes(f) ? 'rgba(13,148,136,0.1)' : '#1F2937', border: `1px solid ${facilities.includes(f) ? 'rgba(13,148,136,0.3)' : '#374151'}` }}>
                  <input type="checkbox" checked={facilities.includes(f)} onChange={() => toggleFacility(f)} className="sr-only" />
                  <div className="flex items-center justify-center w-4 h-4 rounded border" style={{ borderColor: facilities.includes(f) ? '#0D9488' : '#6B7280', backgroundColor: facilities.includes(f) ? '#0D9488' : 'transparent' }}>
                    {facilities.includes(f) && <Check size={10} style={{ color: '#fff' }} />}
                  </div>
                  <span className="text-xs" style={{ color: '#F9FAFB' }}>{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>
            {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found {period ? `for Period ${period}` : ''} {date ? `on ${date}` : ''}
          </p>
          {filteredRooms.map((room, i) => {
            const status = availabilityStatuses[i] || 'Available'
            const available = status === 'Available'
            return (
              <label key={room.name} className={`flex items-center justify-between rounded-xl p-4 cursor-pointer transition-colors ${!available ? 'opacity-50' : ''}`} style={{ backgroundColor: selectedRoom === room.name ? 'rgba(13,148,136,0.1)' : '#1F2937', border: `1px solid ${selectedRoom === room.name ? 'rgba(13,148,136,0.3)' : '#374151'}` }}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="room" value={room.name} checked={selectedRoom === room.name} disabled={!available} onChange={() => setSelectedRoom(room.name)} className="sr-only" />
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border-2" style={{ borderColor: selectedRoom === room.name ? '#0D9488' : '#6B7280' }}>
                    {selectedRoom === room.name && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0D9488' }} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{room.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Capacity: {room.capacity} &middot; {room.facilities.join(', ')}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: available ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: available ? '#10B981' : '#EF4444' }}>
                  {status}
                </span>
              </label>
            )
          })}
          {filteredRooms.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#6B7280' }}>No rooms match your criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Room booked</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Room <span style={{ color: '#F9FAFB' }}>{selectedRoom || '—'}</span> booked for <span style={{ color: '#F9FAFB' }}>{period ? `Period ${period}` : '—'}</span> on <span style={{ color: '#F9FAFB' }}>{date || '—'}</span>.
            </p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Room booking will be confirmed and visible on the timetable." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════
   3. PrintTimetableModal
   ═══════════════════════════════════════════════════════ */
export function PrintTimetableModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [timetableType, setTimetableType] = useState('Class')
  const [name, setName] = useState('')
  const [weekSelect, setWeekSelect] = useState('This week')

  return (
    <WizardShell onClose={onClose} title="Print Timetable" subtitle="Generate a printable timetable" icon="🖨️" step={step} totalSteps={3} stepLabels={['Configure', 'Preview', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Timetable Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['Class', 'Teacher', 'Room'].map(t => (
                <button key={t} onClick={() => setTimetableType(t)} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: timetableType === t ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${timetableType === t ? 'rgba(13,148,136,0.3)' : '#374151'}`, color: timetableType === t ? '#0D9488' : '#9CA3AF' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label req>{timetableType} Name</Label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`Enter ${timetableType.toLowerCase()} name...`} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Week</Label>
            <select value={weekSelect} onChange={e => setWeekSelect(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['This week', 'Next week', 'Custom'].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>
            {timetableType} timetable: {name || '—'} &middot; {weekSelect}
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
            <div className="grid grid-cols-6" style={{ backgroundColor: '#1F2937' }}>
              <div className="p-2 text-xs font-semibold" style={{ color: '#6B7280', borderRight: '1px solid #374151' }}></div>
              {DAYS.map(d => (
                <div key={d} className="p-2 text-xs font-semibold text-center" style={{ color: '#9CA3AF', borderRight: '1px solid #374151' }}>{d}</div>
              ))}
            </div>
            {PERIODS.map(p => (
              <div key={p} className="grid grid-cols-6" style={{ borderTop: '1px solid #374151' }}>
                <div className="p-2 text-xs font-medium" style={{ color: '#6B7280', borderRight: '1px solid #374151', backgroundColor: '#1F2937' }}>P{p}</div>
                {DAYS.map(d => (
                  <div key={`${d}-${p}`} className="p-2 text-center" style={{ borderRight: '1px solid #374151', backgroundColor: '#111318' }}>
                    <div className="h-4 rounded" style={{ backgroundColor: '#1F2937' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: '#6B7280' }}>Preview — actual timetable data will populate on print</p>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Timetable sent to printer</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {timetableType} timetable for <span style={{ color: '#F9FAFB' }}>{name || '—'}</span> ({weekSelect})
            </p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Timetable will be sent to the default printer." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════
   4. ExportTimetablePDFModal
   ═══════════════════════════════════════════════════════ */
export function ExportTimetablePDFModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [timetableType, setTimetableType] = useState('Class')
  const [name, setName] = useState('')
  const [period, setPeriod] = useState('This week')
  const [orientation, setOrientation] = useState('Landscape')
  const [includeStaff, setIncludeStaff] = useState(true)
  const [includeRooms, setIncludeRooms] = useState(true)
  const [includeColors, setIncludeColors] = useState(true)

  return (
    <WizardShell onClose={onClose} title="Export Timetable PDF" subtitle="Download timetable as PDF" icon="📄" step={step} totalSteps={3} stepLabels={['Configure', 'Format', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Timetable Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['Class', 'Teacher', 'Room'].map(t => (
                <button key={t} onClick={() => setTimetableType(t)} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: timetableType === t ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${timetableType === t ? 'rgba(13,148,136,0.3)' : '#374151'}`, color: timetableType === t ? '#0D9488' : '#9CA3AF' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label req>{timetableType} Name</Label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`Enter ${timetableType.toLowerCase()} name...`} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Period</Label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['This week', 'Next week', 'Custom'].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Orientation</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {['Portrait', 'Landscape'].map(o => (
                <button key={o} onClick={() => setOrientation(o)} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: orientation === o ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${orientation === o ? 'rgba(13,148,136,0.3)' : '#374151'}`, color: orientation === o ? '#0D9488' : '#9CA3AF' }}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Include in PDF</Label>
            <div className="space-y-2 mt-1">
              {[
                { label: 'Staff Names', value: includeStaff, setter: setIncludeStaff },
                { label: 'Room Numbers', value: includeRooms, setter: setIncludeRooms },
                { label: 'Subject Colors', value: includeColors, setter: setIncludeColors },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <span className="text-sm" style={{ color: '#F9FAFB' }}>{item.label}</span>
                  <button onClick={() => item.setter(!item.value)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: item.value ? '#0D9488' : '#374151' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: item.value ? 20 : 2 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>PDF generated and downloaded</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {timetableType} timetable for <span style={{ color: '#F9FAFB' }}>{name || '—'}</span> &middot; {orientation} &middot; {period}
            </p>
          </div>
          <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>Includes: {[includeStaff && 'Staff Names', includeRooms && 'Room Numbers', includeColors && 'Subject Colors'].filter(Boolean).join(', ') || 'None'}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="PDF will be generated and downloaded to your device." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════
   5. SwapTeacherModal
   ═══════════════════════════════════════════════════════ */
export function SwapTeacherModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [originalTeacher, setOriginalTeacher] = useState('')
  const [day, setDay] = useState('')
  const [periodNum, setPeriodNum] = useState('')
  const [date, setDate] = useState('')
  const [replacement, setReplacement] = useState('')

  const replacementTeachers = [
    { name: 'Mr A. Williams', status: 'Available' as const },
    { name: 'Ms K. Bennett', status: 'Available' as const },
    { name: 'Mr T. Hughes', status: 'Busy' as const },
    { name: 'Mrs L. Morgan', status: 'On Cover' as const },
    { name: 'Mr D. Patel', status: 'Available' as const },
  ].filter(t => t.name !== originalTeacher)

  return (
    <WizardShell onClose={onClose} title="Swap Teacher" subtitle="Reassign a lesson to a different teacher" icon="🔀" step={step} totalSteps={3} stepLabels={['Select', 'Replace', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Original Teacher</Label>
            <select value={originalTeacher} onChange={e => setOriginalTeacher(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select teacher...</option>
              {DEMO_TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label req>Day</Label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
                <option value="">Select day...</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label req>Period</Label>
              <select value={periodNum} onChange={e => setPeriodNum(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
                <option value="">Select period...</option>
                {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label req>Date</Label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>
            Available teachers for {day || '—'} Period {periodNum || '—'}
          </p>
          {replacementTeachers.map(t => {
            const available = t.status === 'Available'
            return (
              <label key={t.name} className={`flex items-center justify-between rounded-xl p-4 cursor-pointer transition-colors ${!available ? 'opacity-50' : ''}`} style={{ backgroundColor: replacement === t.name ? 'rgba(13,148,136,0.1)' : '#1F2937', border: `1px solid ${replacement === t.name ? 'rgba(13,148,136,0.3)' : '#374151'}` }}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="replacement" value={t.name} checked={replacement === t.name} disabled={!available} onChange={() => setReplacement(t.name)} className="sr-only" />
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border-2" style={{ borderColor: replacement === t.name ? '#0D9488' : '#6B7280' }}>
                    {replacement === t.name && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0D9488' }} />}
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{t.name}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                  backgroundColor: t.status === 'Available' ? 'rgba(16,185,129,0.1)' : t.status === 'Busy' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  color: t.status === 'Available' ? '#10B981' : t.status === 'Busy' ? '#EF4444' : '#F59E0B'
                }}>
                  {t.status}
                </span>
              </label>
            )
          })}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Teacher swap confirmed</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>Both teachers have been notified.</p>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>Original: <span style={{ color: '#F9FAFB' }}>{originalTeacher || '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Replacement: <span style={{ color: '#F9FAFB' }}>{replacement || '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Lesson: <span style={{ color: '#F9FAFB' }}>{day || '—'}, Period {periodNum || '—'}</span></p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Date: <span style={{ color: '#F9FAFB' }}>{date || '—'}</span></p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Teacher swap will be confirmed and both staff members notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════
   6. LogRoomConflictModal
   ═══════════════════════════════════════════════════════ */
export function LogRoomConflictModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [room, setRoom] = useState('')
  const [date, setDate] = useState('')
  const [periodsAffected, setPeriodsAffected] = useState<string[]>([])
  const [altRoom, setAltRoom] = useState('')
  const ref = genRef('RC')

  const togglePeriod = (p: string) => {
    setPeriodsAffected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const affectedClasses = periodsAffected.map((p, i) => {
    const classes = ['7A English', '8B Maths', '9C Science', '10D History', '11E Geography', '7F Art']
    return { period: p, cls: classes[i % classes.length] }
  })

  const altRooms = DEMO_ROOMS.filter(r => r.name !== room)

  return (
    <WizardShell onClose={onClose} title="Log Room Conflict" subtitle="Report and resolve a room booking conflict" icon="⚠️" step={step} totalSteps={3} stepLabels={['Details', 'Classes', 'Resolution']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Conflicted Room</Label>
            <select value={room} onChange={e => setRoom(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select room...</option>
              {DEMO_ROOMS.map(r => <option key={r.name} value={r.name}>{r.name} (Cap: {r.capacity})</option>)}
            </select>
          </div>
          <div>
            <Label req>Date</Label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Periods Affected</Label>
            <div className="grid grid-cols-6 gap-2 mt-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => togglePeriod(p)} className="px-3 py-2 rounded-lg text-sm font-medium text-center transition-colors" style={{ backgroundColor: periodsAffected.includes(p) ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${periodsAffected.includes(p) ? 'rgba(13,148,136,0.3)' : '#374151'}`, color: periodsAffected.includes(p) ? '#0D9488' : '#9CA3AF' }}>
                  P{p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>
            Affected classes in {room || '—'} on {date || '—'}
          </p>
          {affectedClasses.length > 0 ? affectedClasses.map(ac => (
            <div key={ac.period} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>P{ac.period}</span>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{ac.cls}</p>
              </div>
              <span className="text-xs" style={{ color: '#F59E0B' }}>Needs relocation</span>
            </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#6B7280' }}>Select affected periods in Step 1 to see classes.</p>
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label req>Alternative Room</Label>
            <select value={altRoom} onChange={e => setAltRoom(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select alternative room...</option>
              {altRooms.map(r => <option key={r.name} value={r.name}>{r.name} (Cap: {r.capacity})</option>)}
            </select>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Conflict logged and resolved</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Ref: <span style={{ color: '#F9FAFB' }}>{ref}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              {affectedClasses.length} class{affectedClasses.length !== 1 ? 'es' : ''} relocated from <span style={{ color: '#F9FAFB' }}>{room || '—'}</span> to <span style={{ color: '#F9FAFB' }}>{altRoom || '—'}</span>
            </p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Room conflict will be logged and affected staff notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════
   7. BlockPlannerModal
   ═══════════════════════════════════════════════════════ */
export function BlockPlannerModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [yearGroup, setYearGroup] = useState('')
  const [term, setTerm] = useState('Autumn')
  const [subjectsPerWeek, setSubjectsPerWeek] = useState('5')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [roomNotes, setRoomNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (step === 3 && !generated) {
      setGenerating(true)
      const timer = setTimeout(() => {
        setGenerating(false)
        setGenerated(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [step, generated])

  const subjectCount = Math.min(parseInt(subjectsPerWeek) || 5, 8)
  const blockSubjects = SUBJECTS.slice(0, subjectCount)

  return (
    <WizardShell onClose={onClose} title="Block Planner" subtitle="AI-assisted block timetable generation" icon="🧩" step={step} totalSteps={4} stepLabels={['Configure', 'Constraints', 'Generate', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Year Group</Label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select year group...</option>
              {['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <Label req>Term</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['Autumn', 'Spring', 'Summer'].map(t => (
                <button key={t} onClick={() => setTerm(t)} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: term === t ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${term === t ? 'rgba(13,148,136,0.3)' : '#374151'}`, color: term === t ? '#0D9488' : '#9CA3AF' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label req>Subjects per Week</Label>
            <input type="number" value={subjectsPerWeek} onChange={e => setSubjectsPerWeek(e.target.value)} min={1} max={8} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Teacher Availability Notes</Label>
            <textarea value={teacherNotes} onChange={e => setTeacherNotes(e.target.value)} rows={4} placeholder="e.g. Mrs Thompson unavailable Wednesday PM, Mr Patel part-time Thu/Fri..." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <Label>Room Availability Notes</Label>
            <textarea value={roomNotes} onChange={e => setRoomNotes(e.target.value)} rows={4} placeholder="e.g. Science Lab 1 unavailable Monday, Sports Hall shared with primary..." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Generating block plan...</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Analysing constraints and optimising allocation</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                Block plan for {yearGroup || '—'} &middot; {term} Term &middot; {subjectsPerWeek} subjects/week
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
                <div className="grid" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)`, backgroundColor: '#1F2937' }}>
                  <div className="p-2 text-xs font-semibold" style={{ color: '#6B7280', borderRight: '1px solid #374151' }}>Subject</div>
                  {DAYS.map(d => (
                    <div key={d} className="p-2 text-xs font-semibold text-center" style={{ color: '#9CA3AF', borderRight: '1px solid #374151' }}>{d}</div>
                  ))}
                </div>
                {blockSubjects.map((subj, si) => {
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
                  const color = colors[si % colors.length]
                  return (
                    <div key={subj} className="grid" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, 1fr)`, borderTop: '1px solid #374151' }}>
                      <div className="p-2 text-xs font-medium truncate" style={{ color: '#9CA3AF', borderRight: '1px solid #374151', backgroundColor: '#1F2937' }}>{subj}</div>
                      {DAYS.map((d, di) => {
                        const hasSlot = (si + di) % 3 !== 0
                        return (
                          <div key={`${subj}-${d}`} className="p-1.5" style={{ borderRight: '1px solid #374151', backgroundColor: '#111318' }}>
                            {hasSlot && (
                              <div className="h-5 rounded text-center flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                                <span className="text-[10px] font-medium" style={{ color }}>{`P${((si + di) % 6) + 1}`}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-center" style={{ color: '#6B7280' }}>AI-generated block plan — review and adjust before confirming</p>
            </>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Block plan saved</p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {yearGroup || '—'} &middot; {term} Term &middot; {subjectsPerWeek} subjects across {DAYS.length} days
            </p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Block plan will be saved and applied to the timetable." />
        </div>
      )}
    </WizardShell>
  )
}
