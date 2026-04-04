'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Loader2, Download, Mail, Printer, Share2, FileText, BookOpen, Users, Calendar, BarChart2 } from 'lucide-react'

// ─── Shared ──────────────────────────────────────────────────────────────────

const SUBJECTS = ['Maths', 'English', 'Science', 'History', 'Geography', 'Art', 'PE', 'Music', 'RE', 'Computing', 'MFL', 'Other']
const YEAR_GROUPS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
const DURATIONS = ['30 mins', '45 mins', '60 mins', 'Double lesson (90 mins)']
const RESOURCES = ['Whiteboard', 'iPads', 'Textbooks', 'Worksheets', 'Practical equipment']

type Step = 1 | 2 | 3 | 4

function ModalShell({ onClose, title, subtitle, icon, step, setStep, children, onExport }: {
  onClose: () => void; title: string; subtitle: string; icon: React.ReactNode
  step: Step; setStep: (s: Step) => void; children: React.ReactNode; onExport?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>{icon}</div>
            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {['Configure', 'Generate', 'Review', 'Export'].map((l, i) => {
            const s = (i + 1) as Step; const active = step === s; const done = step > s
            return (<div key={l} className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: done ? '#0D9488' : active ? 'rgba(13,148,136,0.2)' : '#1F2937', color: done ? '#fff' : active ? '#0D9488' : '#6B7280' }}>{done ? <Check size={12} /> : s}</div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>{l}</span>
              {i < 3 && <ChevronRight size={12} style={{ color: '#374151' }} />}
            </div>)
          })}
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 1 ? setStep((step - 1) as Step) : onClose()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>{step === 1 ? 'Cancel' : '← Back'}</button>
          {step === 4 ? <button onClick={() => { onExport?.(); onClose() }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Check size={14} /> Done</button>
           : step === 2 ? <span className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}><Loader2 size={14} className="animate-spin" /> Generating...</span>
           : <button onClick={() => setStep((step + 1) as Step)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Next <ChevronRight size={14} /></button>}
        </div>
      </div>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>
}

const iS = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

function ExportButtons({ toast }: { toast: (m: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[{ icon: Download, label: 'Download PDF', color: '#0D9488' }, { icon: Mail, label: 'Email to Team', color: '#8B5CF6' }, { icon: Printer, label: 'Print', color: '#F59E0B' }, { icon: Share2, label: 'Save to Library', color: '#22D3EE' }].map(b => (
        <button key={b.label} onClick={() => toast(b.label)} className="flex items-center gap-2 rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
          <b.icon size={16} style={{ color: b.color }} /><span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{b.label}</span>
        </button>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-4"><p className="text-xs font-bold mb-2" style={{ color: '#0D9488' }}>{title}</p><div className="text-sm" style={{ color: '#D1D5DB', lineHeight: 1.7 }}>{children}</div></div>
}

// ─── 1. Lesson Plan ──────────────────────────────────────────────────────────

export function LessonPlanModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[4])
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(DURATIONS[2])
  const [objective, setObjective] = useState('')
  const [sendToggle, setSendToggle] = useState(false)
  const [sendNotes, setSendNotes] = useState('')
  const [selectedRes, setSelectedRes] = useState<string[]>(['Whiteboard'])
  const [plan, setPlan] = useState<any>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (step !== 2) return
    fetch('/api/lesson-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, yearGroup, topic, duration, objective, sendConsiderations: sendToggle ? sendNotes : '', resources: selectedRes }) })
      .then(r => r.json()).then(d => { setPlan(d); setStep(3) }).catch(() => setStep(3))
  }, [step])

  return (
    <ModalShell onClose={onClose} title="Generate Lesson Plan" subtitle="AI-powered lesson planning" icon={<BookOpen size={15} style={{ color: '#0D9488' }} />} step={step} setStep={setStep} onExport={() => setToast('Saved')}>
      {step === 1 && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><Label required>Subject</Label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div><div><Label required>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div></div>
        <div><Label required>Topic</Label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions and Decimals" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        <div><Label>Duration</Label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{DURATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
        <div><Label required>Learning Objective</Label><textarea value={objective} onChange={e => setObjective(e.target.value)} rows={2} placeholder="Pupils will be able to..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        <div className="flex items-center gap-3"><Label>SEND considerations?</Label><button onClick={() => setSendToggle(!sendToggle)} className="relative w-10 h-5 rounded-full" style={{ backgroundColor: sendToggle ? '#0D9488' : '#374151' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: sendToggle ? 22 : 2 }} /></button></div>
        {sendToggle && <textarea value={sendNotes} onChange={e => setSendNotes(e.target.value)} rows={2} placeholder="e.g. 3 pupils with dyslexia, 1 EAL" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />}
        <div><Label>Resources</Label><div className="flex flex-wrap gap-2">{RESOURCES.map(r => <button key={r} onClick={() => setSelectedRes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: selectedRes.includes(r) ? 'rgba(13,148,136,0.2)' : '#1F2937', border: `1px solid ${selectedRes.includes(r) ? '#0D9488' : '#374151'}`, color: selectedRes.includes(r) ? '#0D9488' : '#9CA3AF' }}>{r}</button>)}</div></div>
      </div>}
      {step === 2 && <div className="flex flex-col items-center py-12"><Loader2 size={32} className="animate-spin mb-6" style={{ color: '#0D9488' }} />{['Structuring learning objectives...', 'Designing activities...', 'Adding differentiation...'].map((l, i) => <p key={i} className="text-sm mb-2" style={{ color: '#D1D5DB' }}>{l}</p>)}</div>}
      {step === 3 && plan && <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <h3 className="text-base font-bold mb-1" style={{ color: '#F9FAFB' }}>{topic || 'Lesson Plan'}</h3>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{subject} · {yearGroup} · {duration}</p>
        <Section title="STARTER">{plan.starter}</Section>
        <Section title="MAIN ACTIVITY">{plan.main}</Section>
        <Section title="PLENARY">{plan.plenary}</Section>
        <Section title="DIFFERENTIATION">{plan.differentiation}</Section>
        <Section title="ASSESSMENT">{plan.assessment}</Section>
        <Section title="RESOURCES">{plan.resources}</Section>
      </div>}
      {step === 4 && <ExportButtons toast={m => { setToast(m); setTimeout(() => setToast(''), 2000) }} />}
      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </ModalShell>
  )
}

// ─── 2. Cover Work ───────────────────────────────────────────────────────────

export function CoverWorkModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [cls, setCls] = useState(''); const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[4]); const [subject, setSubject] = useState(''); const [teacher, setTeacher] = useState(''); const [date, setDate] = useState(new Date().toISOString().split('T')[0]); const [duration, setDuration] = useState('1 lesson'); const [instructions, setInstructions] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => { if (step === 2) setTimeout(() => setStep(3), 2000) }, [step])

  return (
    <ModalShell onClose={onClose} title="Cover Work Generator" subtitle="Create self-contained cover work" icon={<FileText size={15} style={{ color: '#F59E0B' }} />} step={step} setStep={setStep}>
      {step === 1 && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><Label required>Class</Label><input value={cls} onChange={e => setCls(e.target.value)} placeholder="5T" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label required>Subject</Label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Maths" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>Absent Teacher</Label><input value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="Mr Rashid" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>Duration</Label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>1 lesson</option><option>Half day</option><option>Full day</option></select></div></div>
        <div><Label>Instructions for cover teacher</Label><textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} placeholder="Any special instructions..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
      </div>}
      {step === 2 && <div className="flex flex-col items-center py-12"><Loader2 size={32} className="animate-spin mb-6" style={{ color: '#F59E0B' }} /><p className="text-sm" style={{ color: '#D1D5DB' }}>Creating self-contained cover work...</p></div>}
      {step === 3 && <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#1F2937' }}><p className="text-xs font-bold" style={{ color: '#F59E0B' }}>COVER SHEET</p><p className="text-sm mt-1" style={{ color: '#F9FAFB' }}>Class: {cls || '5T'} · {subject || 'Maths'} · {yearGroup} · {date}</p><p className="text-xs" style={{ color: '#6B7280' }}>Absent: {teacher || 'Teacher'} · Duration: {duration}</p></div>
        <Section title="TASK 1 — INDEPENDENT PRACTICE">Complete the {subject || 'maths'} worksheet on the desk. Work through questions 1-10 independently. Show your working in your exercise book.</Section>
        <Section title="TASK 2 — READING COMPREHENSION">Read the text provided and answer the 5 comprehension questions. Write in full sentences using evidence from the text.</Section>
        <Section title="TASK 3 — CREATIVE CHALLENGE">Design a poster explaining one key concept from today&apos;s {subject || 'topic'}. Include diagrams, key vocabulary and at least 3 facts.</Section>
        <Section title="EXTENSION">For those who finish early: Write 5 quiz questions about today&apos;s topic for a partner to answer.</Section>
      </div>}
      {step === 4 && <ExportButtons toast={m => { setToast(m); setTimeout(() => setToast(''), 2000) }} />}
      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </ModalShell>
  )
}

// ─── 3. Parents Evening ──────────────────────────────────────────────────────

export function ParentsEveningModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [eventName, setEventName] = useState('Parents Evening'); const [date, setDate] = useState(''); const [startTime, setStartTime] = useState('16:00'); const [endTime, setEndTime] = useState('19:00'); const [slotDuration, setSlotDuration] = useState('10'); const [breakTime, setBreakTime] = useState('2'); const [location, setLocation] = useState('Main Hall')
  const [toast, setToast] = useState('')

  const totalSlots = Math.floor(((parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1] || '0')) - (parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1] || '0'))) / (parseInt(slotDuration) + parseInt(breakTime)))

  useEffect(() => { if (step === 2) setTimeout(() => setStep(3), 2000) }, [step])

  return (
    <ModalShell onClose={onClose} title="Parents Evening Planner" subtitle="Schedule appointments automatically" icon={<Calendar size={15} style={{ color: '#8B5CF6' }} />} step={step} setStep={setStep}>
      {step === 1 && <div className="space-y-4">
        <div><Label>Event Name</Label><input value={eventName} onChange={e => setEventName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        <div className="grid grid-cols-3 gap-3"><div><Label required>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>Start</Label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>End</Label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Slot Duration (mins)</Label><select value={slotDuration} onChange={e => setSlotDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>5</option><option>10</option><option>15</option></select></div><div><Label>Break Between (mins)</Label><select value={breakTime} onChange={e => setBreakTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>0</option><option>1</option><option>2</option><option>5</option></select></div></div>
        <div><Label>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        {totalSlots > 0 && <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}><p className="text-sm font-bold" style={{ color: '#0D9488' }}>{totalSlots} appointment slots available</p></div>}
      </div>}
      {step === 2 && <div className="flex flex-col items-center py-12"><Loader2 size={32} className="animate-spin mb-6" style={{ color: '#8B5CF6' }} /><p className="text-sm" style={{ color: '#D1D5DB' }}>Building appointment schedule...</p></div>}
      {step === 3 && <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <h3 className="text-base font-bold mb-3" style={{ color: '#F9FAFB' }}>{eventName}</h3>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{date || 'TBC'} · {startTime}–{endTime} · {location} · {totalSlots} slots</p>
        <div className="space-y-2">{Array.from({ length: Math.min(totalSlots, 6) }, (_, i) => { const mins = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1] || '0') + i * (parseInt(slotDuration) + parseInt(breakTime)); const h = Math.floor(mins / 60); const m = mins % 60; return <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: '#1F2937' }}><span className="text-xs font-bold w-14" style={{ color: '#6B7280' }}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</span><span className="text-sm" style={{ color: '#F9FAFB' }}>Slot {i + 1} — Available</span></div> })}</div>
        {totalSlots > 6 && <p className="text-xs mt-2" style={{ color: '#6B7280' }}>+ {totalSlots - 6} more slots</p>}
      </div>}
      {step === 4 && <div className="space-y-4"><ExportButtons toast={m => { setToast(m); setTimeout(() => setToast(''), 2000) }} /><button className="w-full flex items-center justify-center gap-2 rounded-xl p-4 text-sm font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }} onClick={() => { setToast('Booking links sent to parents'); setTimeout(() => setToast(''), 2000) }}><Mail size={14} /> Send Booking Links to Parents</button></div>}
      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </ModalShell>
  )
}

// ─── 4. Assessment Tracker ───────────────────────────────────────────────────

export function AssessmentTrackerModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState(''); const [subject, setSubject] = useState(SUBJECTS[0]); const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[4]); const [assessmentType, setAssessmentType] = useState('End of unit'); const [date, setDate] = useState(''); const [maxMarks, setMaxMarks] = useState('40')
  const [toast, setToast] = useState('')
  const pupils = ['Olivia H.', 'Jack T.', 'Amara O.', 'Ethan M.', 'Sophie W.', 'Noah B.', 'Isla C.', 'George D.']

  useEffect(() => { if (step === 2) setTimeout(() => setStep(3), 1800) }, [step])

  return (
    <ModalShell onClose={onClose} title="Assessment Tracker" subtitle="Set up and analyse assessments" icon={<BarChart2 size={15} style={{ color: '#22D3EE' }} />} step={step} setStep={setStep}>
      {step === 1 && <div className="space-y-4">
        <div><Label required>Assessment Name</Label><input value={name} onChange={e => setName(e.target.value)} placeholder="Spring Term Maths Assessment" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        <div className="grid grid-cols-3 gap-3"><div><Label>Subject</Label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div><div><Label>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div><div><Label>Max Marks</Label><input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Type</Label><select value={assessmentType} onChange={e => setAssessmentType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{['End of unit', 'Mock exam', 'Baseline', 'Formative', 'Summative', 'Phonics screening', 'SATs'].map(t => <option key={t}>{t}</option>)}</select></div><div><Label>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div></div>
      </div>}
      {step === 2 && <div className="flex flex-col items-center py-12"><Loader2 size={32} className="animate-spin mb-6" style={{ color: '#22D3EE' }} /><p className="text-sm" style={{ color: '#D1D5DB' }}>Setting up tracker...</p></div>}
      {step === 3 && <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="px-4 py-3" style={{ backgroundColor: '#0A0B10', borderBottom: '1px solid #1F2937' }}><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{name || 'Assessment'} — {subject} {yearGroup}</p></div>
        <table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid #1F2937' }}><th className="text-left px-4 py-2 text-xs" style={{ color: '#6B7280' }}>Pupil</th><th className="text-center px-4 py-2 text-xs" style={{ color: '#6B7280' }}>Mark /{maxMarks}</th><th className="text-center px-4 py-2 text-xs" style={{ color: '#6B7280' }}>%</th><th className="text-center px-4 py-2 text-xs" style={{ color: '#6B7280' }}>Grade</th></tr></thead>
        <tbody>{pupils.map((p, i) => { const mark = [36, 28, 32, 18, 24, 34, 30, 22][i]; const pct = Math.round(mark / parseInt(maxMarks || '40') * 100); return <tr key={p} style={{ borderBottom: '1px solid #1F2937' }}><td className="px-4 py-2" style={{ color: '#F9FAFB' }}>{p}</td><td className="px-4 py-2 text-center" style={{ color: '#D1D5DB' }}>{mark}</td><td className="px-4 py-2 text-center" style={{ color: pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444' }}>{pct}%</td><td className="px-4 py-2 text-center" style={{ color: '#D1D5DB' }}>{pct >= 80 ? 'GD' : pct >= 60 ? 'EXS' : 'WTS'}</td></tr> })}</tbody></table>
      </div>}
      {step === 4 && <ExportButtons toast={m => { setToast(m); setTimeout(() => setToast(''), 2000) }} />}
      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </ModalShell>
  )
}

// ─── 5. Report Writer ────────────────────────────────────────────────────────

export function ReportWriterModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [reportType, setReportType] = useState('End of term'); const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[4]); const [subject, setSubject] = useState('All subjects'); const [tone, setTone] = useState('Friendly'); const [wordLimit, setWordLimit] = useState('100'); const [themes, setThemes] = useState<string[]>(['Progress', 'Targets'])
  const [reports, setReports] = useState<any[]>([])
  const [toast, setToast] = useState('')
  const THEMES = ['Progress', 'Effort', 'Behaviour', 'Targets', 'Strengths', 'Areas to improve']

  useEffect(() => {
    if (step !== 2) return
    fetch('/api/report-writer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportType, yearGroup, subject, tone, wordLimit, themes }) })
      .then(r => r.json()).then(d => { setReports(d.reports || []); setStep(3) }).catch(() => setStep(3))
  }, [step])

  return (
    <ModalShell onClose={onClose} title="Report Writer" subtitle="AI-generated pupil reports" icon={<Users size={15} style={{ color: '#8B5CF6' }} />} step={step} setStep={setStep}>
      {step === 1 && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><Label>Report Type</Label><select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{['End of term', 'Annual report', 'Progress update', 'SEND report', 'Mid-year review'].map(t => <option key={t}>{t}</option>)}</select></div><div><Label>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div></div>
        <div className="grid grid-cols-3 gap-3"><div><Label>Subject</Label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>All subjects</option>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div><div><Label>Tone</Label><select value={tone} onChange={e => setTone(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>Formal</option><option>Friendly</option><option>Concise</option></select></div><div><Label>Word Limit</Label><select value={wordLimit} onChange={e => setWordLimit(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>50</option><option>100</option><option>150</option><option>200</option></select></div></div>
        <div><Label>Themes</Label><div className="flex flex-wrap gap-2">{THEMES.map(t => <button key={t} onClick={() => setThemes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: themes.includes(t) ? 'rgba(139,92,246,0.2)' : '#1F2937', border: `1px solid ${themes.includes(t) ? '#8B5CF6' : '#374151'}`, color: themes.includes(t) ? '#A78BFA' : '#9CA3AF' }}>{t}</button>)}</div></div>
      </div>}
      {step === 2 && <div className="flex flex-col items-center py-12"><Loader2 size={32} className="animate-spin mb-6" style={{ color: '#8B5CF6' }} />{['Analysing pupil data...', 'Drafting personalised comments...', 'Applying school tone...'].map((l, i) => <p key={i} className="text-sm mb-2" style={{ color: '#D1D5DB' }}>{l}</p>)}</div>}
      {step === 3 && <div className="space-y-3">{reports.map((r, i) => (
        <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-2"><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.pupil}</p><div className="flex gap-2"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>{r.attainment}</span><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{r.effort}</span></div></div>
          <p className="text-xs" style={{ color: '#D1D5DB', lineHeight: 1.7 }}>{r.comment}</p>
        </div>
      ))}</div>}
      {step === 4 && <ExportButtons toast={m => { setToast(m); setTimeout(() => setToast(''), 2000) }} />}
      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </ModalShell>
  )
}
