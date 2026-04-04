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

/* ── Shared constants ─────────────────────────────────────────────── */

const CLASSES = ['3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B']
const SUBJECTS = ['Maths', 'English', 'Science', 'History', 'Geography', 'Art', 'PE', 'Music', 'RE', 'Computing', 'MFL']

const DEMO_PUPILS = [
  'Oliver Thompson', 'Amelia Clarke', 'Noah Patel', 'Isla Williams',
  'George Mitchell', 'Freya Robinson', 'Harry Singh', 'Olivia Brown',
] as const

const CLASS_CAPACITIES: Record<string, string> = {
  '3A': '26/30 pupils', '3B': '24/30 pupils', '4A': '28/30 pupils', '4B': '22/30 pupils',
  '5A': '25/30 pupils', '5B': '27/30 pupils', '6A': '24/30 pupils', '6B': '23/30 pupils',
}

/* ── 1. MovePupilModal ────────────────────────────────────────────── */

export function MovePupilModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [currentClass, setCurrentClass] = useState(CLASSES[0])
  const [newClass, setNewClass] = useState('')

  const availableClasses = CLASSES.filter(c => c !== currentClass)

  return (
    <WizardShell onClose={onClose} title="Move Pupil" subtitle="Transfer a pupil between classes" icon="🔄" step={step} totalSteps={3} stepLabels={['Select', 'Move To', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Pupil Name</Label>
            <input type="text" placeholder="e.g. Oliver Thompson" value={pupilName} onChange={e => setPupilName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Current Class</Label>
            <select value={currentClass} onChange={e => { setCurrentClass(e.target.value); setNewClass('') }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Label req>Select New Class</Label>
          <div className="grid grid-cols-2 gap-3">
            {availableClasses.map(c => {
              const selected = newClass === c
              return (
                <button key={c} onClick={() => setNewClass(c)} className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors" style={{ backgroundColor: selected ? 'rgba(13,148,136,0.12)' : '#1F2937', border: selected ? '1px solid #0D9488' : '1px solid #374151' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Class {c}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{CLASS_CAPACITIES[c]}</p>
                  </div>
                  {selected && <Check size={16} style={{ color: '#0D9488' }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex items-center gap-2 mb-3">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Pupil moved — teachers notified</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Pupil</span><span style={{ color: '#F9FAFB' }}>{pupilName || 'Not specified'}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>From</span><span style={{ color: '#F9FAFB' }}>Class {currentClass}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>To</span><span style={{ color: '#F9FAFB' }}>Class {newClass || '—'}</span></div>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Move has been recorded and both class teachers have been notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ── 2. GenerateClassReportModal ──────────────────────────────────── */

export function GenerateClassReportModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [selectedClass, setSelectedClass] = useState(CLASSES[0])
  const [period, setPeriod] = useState('This term')
  const [focus, setFocus] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const PERIODS = ['This term', 'This half term', 'This year']
  const FOCUS_OPTIONS = ['Attendance', 'Behaviour', 'Progress', 'All']

  const toggleFocus = (f: string) => {
    if (f === 'All') {
      if (focus.includes('All')) setFocus([])
      else setFocus(['Attendance', 'Behaviour', 'Progress', 'All'])
    } else {
      const next = focus.includes(f) ? focus.filter(x => x !== f && x !== 'All') : [...focus.filter(x => x !== 'All'), f]
      if (next.length === 3 && !next.includes('All')) next.push('All')
      setFocus(next)
    }
  }

  useEffect(() => {
    if (step === 3 && !generated) {
      setGenerating(true)
      const t = setTimeout(() => { setGenerating(false); setGenerated(true) }, 2000)
      return () => clearTimeout(t)
    }
  }, [step, generated])

  return (
    <WizardShell onClose={onClose} title="Generate Class Report" subtitle="AI-powered class performance summary" icon="📊" step={step} totalSteps={3} stepLabels={['Select', 'Focus', 'Generate']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Class</Label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label req>Period</Label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Label>Report Focus Areas</Label>
          <div className="space-y-2">
            {FOCUS_OPTIONS.map(f => {
              const checked = focus.includes(f)
              return (
                <button key={f} onClick={() => toggleFocus(f)} className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition-colors" style={{ backgroundColor: checked ? 'rgba(13,148,136,0.12)' : '#1F2937', border: checked ? '1px solid #0D9488' : '1px solid #374151' }}>
                  <div className="flex items-center justify-center rounded" style={{ width: 18, height: 18, backgroundColor: checked ? '#0D9488' : '#374151' }}>
                    {checked && <Check size={12} style={{ color: '#fff' }} />}
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{f}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm mt-4 font-medium" style={{ color: '#F9FAFB' }}>Generating report for Class {selectedClass}...</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Analysing {period.toLowerCase()} data</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Class {selectedClass} — {period}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Class Size</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#F9FAFB' }}>{CLASS_CAPACITIES[selectedClass]?.split('/')[0] || '24'}</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Avg Attendance</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#0D9488' }}>94.2%</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Behaviour Incidents</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#F59E0B' }}>7</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Progress Summary</p>
                  <p className="text-lg font-bold mt-1" style={{ color: '#0D9488' }}>On Track</p>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Summary</p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: '#D1D5DB' }}>
                  Class {selectedClass} is performing well overall for {period.toLowerCase()}. Attendance remains strong at 94.2%, above the school average. There have been 7 minor behaviour incidents, all resolved. The majority of pupils are on track or above expected progress. Two pupils have been flagged for additional maths support.
                </p>
              </div>
              <p className="text-xs" style={{ color: '#6B7280' }}>Report saved to class record</p>
              <DemoConfirm isDemoMode={isDemoMode} text="Report has been generated and saved to the class record." />
            </>
          )}
        </div>
      )}
    </WizardShell>
  )
}

/* ── 3. AssessmentEntryModal ──────────────────────────────────────── */

export function AssessmentEntryModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [selectedClass, setSelectedClass] = useState(CLASSES[0])
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [assessmentName, setAssessmentName] = useState('')
  const [maxMarks, setMaxMarks] = useState(40)
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    DEMO_PUPILS.forEach(p => { m[p] = '' })
    return m
  })

  const updateMark = (pupil: string, val: string) => {
    const num = val === '' ? '' : String(Math.min(Math.max(0, Number(val)), maxMarks))
    setMarks(prev => ({ ...prev, [pupil]: num }))
  }

  const pct = (val: string) => {
    if (val === '' || maxMarks <= 0) return '—'
    return `${Math.round((Number(val) / maxMarks) * 100)}%`
  }

  return (
    <WizardShell onClose={onClose} title="Assessment Entry" subtitle="Record assessment marks for a class" icon="📝" step={step} totalSteps={3} stepLabels={['Configure', 'Entry', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Class</Label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label req>Subject</Label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label req>Assessment Name</Label>
            <input type="text" placeholder="e.g. End of Unit 5 Test" value={assessmentName} onChange={e => setAssessmentName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Max Marks</Label>
            <input type="number" min={1} max={200} value={maxMarks} onChange={e => setMaxMarks(Number(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <Label>Enter Marks (out of {maxMarks})</Label>
            <span className="text-xs" style={{ color: '#6B7280' }}>{DEMO_PUPILS.length} pupils</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#1F2937' }}>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#9CA3AF' }}>Pupil</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: '#9CA3AF', width: 90 }}>Mark</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: '#9CA3AF', width: 70 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_PUPILS.map((pupil, idx) => (
                  <tr key={pupil} style={{ borderTop: '1px solid #374151', backgroundColor: idx % 2 === 0 ? '#111318' : 'rgba(31,41,55,0.4)' }}>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: '#F9FAFB' }}>{pupil}</td>
                    <td className="px-4 py-2 text-center">
                      <input type="number" min={0} max={maxMarks} value={marks[pupil]} onChange={e => updateMark(pupil, e.target.value)} placeholder="—" className="w-16 rounded-lg px-2 py-1.5 text-xs text-center outline-none" style={iS} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: marks[pupil] !== '' ? '#0D9488' : '#6B7280' }}>{pct(marks[pupil])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex items-center gap-2 mb-3">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Assessment data saved for {DEMO_PUPILS.length} pupils</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Assessment</span><span style={{ color: '#F9FAFB' }}>{assessmentName || 'Untitled'}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Class</span><span style={{ color: '#F9FAFB' }}>{selectedClass}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Subject</span><span style={{ color: '#F9FAFB' }}>{subject}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Max Marks</span><span style={{ color: '#F9FAFB' }}>{maxMarks}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Pupils Entered</span><span style={{ color: '#F9FAFB' }}>{Object.values(marks).filter(v => v !== '').length} / {DEMO_PUPILS.length}</span></div>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Assessment marks have been recorded and are available in the class gradebook." />
        </div>
      )}
    </WizardShell>
  )
}

/* ── 4. SetHomeworkModal ──────────────────────────────────────────── */

export function SetHomeworkModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [selectedClass, setSelectedClass] = useState(CLASSES[0])
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [task, setTask] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  return (
    <WizardShell onClose={onClose} title="Set Homework" subtitle="Assign homework to a class" icon="📚" step={step} totalSteps={3} stepLabels={['Details', 'Resources', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Class</Label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label req>Subject</Label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label req>Task Description</Label>
            <textarea rows={4} placeholder="Describe the homework task..." value={task} onChange={e => setTask(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label req>Due Date</Label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Upload Resources</Label>
            <div className="flex flex-col items-center justify-center rounded-xl py-10 px-6 cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ border: '2px dashed #374151' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full mb-3" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                <span className="text-lg">📎</span>
              </div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Drop files here or click to upload</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>PDF, DOCX, images up to 10 MB</p>
            </div>
          </div>
          <div>
            <Label>Link URL (optional)</Label>
            <input type="url" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex items-center gap-2 mb-3">
              <Check size={16} style={{ color: '#0D9488' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Homework set — pupils and parents notified</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Class</span><span style={{ color: '#F9FAFB' }}>{selectedClass}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Subject</span><span style={{ color: '#F9FAFB' }}>{subject}</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Due Date</span><span style={{ color: '#F9FAFB' }}>{dueDate || 'Not set'}</span></div>
              {task && <div className="pt-2" style={{ borderTop: '1px solid #374151' }}><p className="text-xs" style={{ color: '#6B7280' }}>Task</p><p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>{task}</p></div>}
              {linkUrl && <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Link</span><span className="truncate ml-4" style={{ color: '#0D9488' }}>{linkUrl}</span></div>}
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Homework has been assigned. Pupils and parents will receive a notification." />
        </div>
      )}
    </WizardShell>
  )
}
