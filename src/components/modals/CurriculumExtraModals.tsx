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

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const SUBJECTS = ['Maths', 'English', 'Science', 'History', 'Geography', 'Art', 'PE', 'Music', 'RE', 'Computing', 'MFL']
const YEAR_GROUPS = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6']
const TERMS = ['Autumn', 'Spring', 'Summer']
const BUDGET_CODES = ['Curriculum', 'SEND', 'PE & Sports Premium', 'Pupil Premium', 'Capital', 'Other']
const DEMO_STAFF = [
  'Mrs J. Thompson',
  'Mr A. Patel',
  'Miss L. Davies',
  'Mr K. O\'Brien',
  'Mrs S. Hussain',
  'Ms R. Chen',
]

/* ──────────────────────────────────────────────
   1. Scheme of Work Review Modal
   ────────────────────────────────────────────── */

export function SchemeOfWorkReviewModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [yearGroup, setYearGroup] = useState('')
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  const gaps = [
    'No explicit vocabulary progression mapped between units 2 and 3',
    'Assessment checkpoint missing after the fractions block',
    'Cross-curricular links to Science not referenced in the electricity unit',
  ]

  const suggestions = [
    'Add a retrieval practice starter to the beginning of each unit',
    'Embed tier-2 vocabulary targets across every lesson objective',
    'Include a low-stakes quiz at the midpoint of each half-term',
    'Map SEND scaffolding strategies explicitly within the medium-term plan',
    'Align end-of-unit assessments to the updated national curriculum descriptors',
  ]

  useEffect(() => {
    if (step === 2 && !reviewDone) {
      setLoading(true)
      const t = setTimeout(() => { setLoading(false); setReviewDone(true) }, 2000)
      return () => clearTimeout(t)
    }
  }, [step, reviewDone])

  return (
    <WizardShell onClose={onClose} title="Scheme of Work Review" subtitle="AI-assisted curriculum audit" icon="📋" step={step} totalSteps={3} stepLabels={['Select', 'Review', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Subject</Label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label req>Year Group</Label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select year group...</option>
              {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <Label req>Term</Label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select term...</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Reviewing {subject || 'subject'} scheme for {yearGroup || 'year group'}, {term || 'term'}...</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#F9FAFB' }}>Gaps Identified</p>
                <div className="space-y-2">
                  {gaps.map((g, i) => (
                    <div key={i} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <p className="text-xs" style={{ color: '#F87171' }}>{g}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#F9FAFB' }}>Improvement Suggestions</p>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                      <p className="text-xs" style={{ color: '#D1D5DB' }}>{i + 1}. {s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check size={16} style={{ color: '#0D9488' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Review notes saved</p>
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            The scheme of work review for {subject || 'the selected subject'} ({yearGroup || 'year group'}, {term || 'term'}) has been saved with {gaps.length} gaps and {suggestions.length} suggestions.
          </p>
          <DemoConfirm isDemoMode={isDemoMode} text="Review notes have been saved and will appear in your curriculum audit log." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   2. Plan Assessment Calendar Modal
   ────────────────────────────────────────────── */

export function PlanAssessmentCalendarModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [yearGroup, setYearGroup] = useState('')
  const [term, setTerm] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [grid, setGrid] = useState<Record<string, boolean[]>>({})

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']

  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  useEffect(() => {
    const g: Record<string, boolean[]> = {}
    selectedSubjects.forEach(s => {
      if (!grid[s]) g[s] = Array(6).fill(false)
      else g[s] = grid[s]
    })
    setGrid(g)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjects])

  const toggleCell = (subject: string, weekIdx: number) => {
    setGrid(prev => {
      const row = [...(prev[subject] || Array(6).fill(false))]
      row[weekIdx] = !row[weekIdx]
      return { ...prev, [subject]: row }
    })
  }

  const totalAssessments = Object.values(grid).reduce((sum, row) => sum + row.filter(Boolean).length, 0)

  return (
    <WizardShell onClose={onClose} title="Plan Assessment Calendar" subtitle="Map assessments across the half-term" icon="📅" step={step} totalSteps={3} stepLabels={['Configure', 'Schedule', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Year Group</Label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select year group...</option>
              {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <Label req>Term</Label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select term...</option>
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => {
                const active = selectedSubjects.includes(s)
                return (
                  <button key={s} onClick={() => toggleSubject(s)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors" style={{
                    backgroundColor: active ? 'rgba(13,148,136,0.2)' : '#1F2937',
                    color: active ? '#0D9488' : '#9CA3AF',
                    border: `1px solid ${active ? 'rgba(13,148,136,0.4)' : '#374151'}`,
                  }}>{s}</button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {selectedSubjects.length === 0 ? (
            <p className="text-xs" style={{ color: '#6B7280' }}>Go back and select at least one subject.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th className="text-left px-2 py-2 font-semibold" style={{ color: '#9CA3AF' }}>Subject</th>
                      {weeks.map(w => <th key={w} className="px-2 py-2 font-semibold text-center" style={{ color: '#9CA3AF' }}>{w}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSubjects.map(subj => (
                      <tr key={subj}>
                        <td className="px-2 py-2 font-medium" style={{ color: '#D1D5DB' }}>{subj}</td>
                        {weeks.map((_, wi) => {
                          const on = grid[subj]?.[wi] || false
                          return (
                            <td key={wi} className="px-2 py-2 text-center">
                              <button onClick={() => toggleCell(subj, wi)} className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-colors" style={{
                                backgroundColor: on ? 'rgba(13,148,136,0.2)' : '#1F2937',
                                border: `1px solid ${on ? '#0D9488' : '#374151'}`,
                              }}>
                                {on && <Check size={14} style={{ color: '#0D9488' }} />}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs font-medium" style={{ color: '#0D9488' }}>{totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''} planned</p>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check size={16} style={{ color: '#0D9488' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Assessment calendar updated &mdash; staff notified</p>
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            {totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''} scheduled across {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} for {yearGroup || 'the selected year group'}, {term || 'term'}.
          </p>
          <DemoConfirm isDemoMode={isDemoMode} text="The assessment calendar has been updated and staff have been notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   3. Moderation Request Modal
   ────────────────────────────────────────────── */

export function ModerationRequestModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [yearGroup, setYearGroup] = useState('')
  const [sampleCount, setSampleCount] = useState(5)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])

  const toggleStaff = (name: string) => {
    setSelectedStaff(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  return (
    <WizardShell onClose={onClose} title="Moderation Request" subtitle="Request internal or external moderation" icon="🔍" step={step} totalSteps={3} stepLabels={['Details', 'Invite', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Subject</Label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label req>Year Group</Label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select year group...</option>
              {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <Label req>Work Samples Needed</Label>
            <input type="number" min={1} max={30} value={sampleCount} onChange={e => setSampleCount(Number(e.target.value))} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Number of student work samples to include in the moderation pack.</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Label>Select Moderators</Label>
          <div className="space-y-2">
            {DEMO_STAFF.map(name => {
              const on = selectedStaff.includes(name)
              return (
                <button key={name} onClick={() => toggleStaff(name)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors" style={{
                  backgroundColor: on ? 'rgba(13,148,136,0.08)' : '#1F2937',
                  border: `1px solid ${on ? 'rgba(13,148,136,0.3)' : '#374151'}`,
                }}>
                  <div className="flex items-center justify-center rounded-md" style={{
                    width: 20, height: 20,
                    backgroundColor: on ? '#0D9488' : 'transparent',
                    border: on ? 'none' : '1.5px solid #4B5563',
                  }}>
                    {on && <Check size={12} style={{ color: '#fff' }} />}
                  </div>
                  <span className="text-sm" style={{ color: on ? '#F9FAFB' : '#9CA3AF' }}>{name}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>{selectedStaff.length} moderator{selectedStaff.length !== 1 ? 's' : ''} selected</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check size={16} style={{ color: '#0D9488' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Moderation request sent to {selectedStaff.length} staff</p>
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            {subject || 'Subject'} moderation for {yearGroup || 'year group'} with {sampleCount} work sample{sampleCount !== 1 ? 's' : ''} has been requested.
            {selectedStaff.length > 0 && ` Sent to: ${selectedStaff.join(', ')}.`}
          </p>
          <DemoConfirm isDemoMode={isDemoMode} text="Moderation request has been sent and staff will be notified via email." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   4. Order Resources Modal
   ────────────────────────────────────────────── */

export function OrderResourcesModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [resourceName, setResourceName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [supplier, setSupplier] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [budgetCode, setBudgetCode] = useState('')

  return (
    <WizardShell onClose={onClose} title="Order Resources" subtitle="Submit a resource purchase request" icon="📦" step={step} totalSteps={3} stepLabels={['Item', 'Cost', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Resource Name</Label>
            <input type="text" value={resourceName} onChange={e => setResourceName(e.target.value)} placeholder="e.g. Numicon Base Boards Pack" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Quantity</Label>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label>Supplier (optional)</Label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. TTS Group, YPO" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Estimated Cost (&pound;)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>&pound;</span>
              <input type="number" min={0} step={0.01} value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg pl-7 pr-3 py-2 text-sm" style={iS} />
            </div>
          </div>
          <div>
            <Label req>Budget Code</Label>
            <select value={budgetCode} onChange={e => setBudgetCode(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select budget code...</option>
              {BUDGET_CODES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>Summary</p>
            <p className="text-sm mt-1" style={{ color: '#D1D5DB' }}>{quantity}x {resourceName || 'Item'}{supplier ? ` from ${supplier}` : ''}</p>
            {estimatedCost && <p className="text-sm font-semibold mt-0.5" style={{ color: '#F9FAFB' }}>&pound;{Number(estimatedCost).toFixed(2)}</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check size={16} style={{ color: '#0D9488' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Resource request submitted to {budgetCode || 'budget'} holder</p>
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            {quantity}x {resourceName || 'Resource'}{supplier ? ` (${supplier})` : ''} &mdash; &pound;{estimatedCost ? Number(estimatedCost).toFixed(2) : '0.00'} against {budgetCode || 'selected'} budget.
          </p>
          <DemoConfirm isDemoMode={isDemoMode} text="Your resource request has been submitted and the budget holder will be notified for approval." />
        </div>
      )}
    </WizardShell>
  )
}
