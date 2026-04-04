'use client'
import { useState } from 'react'
import { X, ChevronRight, Check, Shield, AlertTriangle, Users, Bell, FileText, Download, Mail, Save } from 'lucide-react'

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
}

const iS: React.CSSProperties = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

const STEP_LABELS = ['Review', 'Assess', 'Actions', 'Notify', 'Close']

export function SafeguardingReviewModal({ onClose, isDemoMode = true }: { onClose: () => void; isDemoMode?: boolean }) {
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 4000) }

  // Step 1
  const [flaggedRead, setFlaggedRead] = useState(false)

  // Step 2
  const [riskLevel, setRiskLevel] = useState('')
  const [category, setCategory] = useState('')
  const [dslNotes, setDslNotes] = useState('')
  const [knownToServices, setKnownToServices] = useState(false)

  // Step 3
  const [actions, setActions] = useState<Record<string, { checked: boolean; assignee: string; due: string }>>({
    'Schedule follow-up conversation with pupil': { checked: true, assignee: '', due: '' },
    'Contact parent/carer': { checked: false, assignee: '', due: '' },
    'Refer to social services (Section 17 / Section 47)': { checked: false, assignee: '', due: '' },
    'Refer to CAMHS': { checked: false, assignee: '', due: '' },
    'Inform class teachers (with appropriate detail)': { checked: false, assignee: '', due: '' },
    'Update EHCP / SEND record': { checked: false, assignee: '', due: '' },
    'Complete MASH referral': { checked: false, assignee: '', due: '' },
    'Contact police': { checked: false, assignee: '', due: '' },
    'Notify headteacher': { checked: false, assignee: '', due: '' },
    'Notify governors': { checked: false, assignee: '', due: '' },
  })

  // Step 4
  const [notifyList, setNotifyList] = useState<Record<string, boolean>>({
    'Headteacher — Dr Sarah Mitchell': true,
    'Deputy DSL — Mr James Okafor': true,
    'Local Authority Designated Officer (LADO)': false,
    'Parent/Carer': false,
    'Social Services': false,
    'Police': false,
  })
  const [notifyMethod, setNotifyMethod] = useState('Email')
  const [notifyMessage, setNotifyMessage] = useState(
    `Dear colleague,\n\nI am writing to inform you of a safeguarding concern that has been reviewed today (Reference: SG-2026-0001).\n\nThe concern relates to a Year 9 pupil and has been assessed as requiring follow-up. Actions have been assigned and monitoring is in place.\n\nPlease treat this information as strictly confidential.\n\nKind regards,\nDesignated Safeguarding Lead`
  )

  // Step 5
  const [closeOption, setCloseOption] = useState<'close' | 'open' | 'escalate'>('open')
  const [closingSummary, setClosingSummary] = useState('')
  const [escalateTo, setEscalateTo] = useState('')
  const [escalationNotes, setEscalationNotes] = useState('')
  const [reviewDays, setReviewDays] = useState('7')
  const [submitted, setSubmitted] = useState(false)

  const checkedActionCount = Object.values(actions).filter(a => a.checked).length
  const statusLabel = closeOption === 'close' ? 'Closed' : closeOption === 'escalate' ? 'Escalated' : 'Monitoring'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl flex flex-col max-h-[92vh] rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
              <Shield size={16} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>SG-REV-01</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>DSL Workflow</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Safeguarding — Concern Review</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Review the logged concern, assess risk level, assign actions, and close or escalate.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1; const active = step === s; const done = step > s
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 28, height: 28, backgroundColor: done ? '#0D9488' : active ? 'rgba(108,63,197,0.2)' : '#1F2937', color: done ? '#fff' : active ? '#A78BFA' : '#6B7280' }}>
                    {done ? <Check size={12} /> : s}
                  </div>
                  <span className="text-[10px] whitespace-nowrap" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <div className="h-px w-10 mx-1.5 mb-4" style={{ backgroundColor: done ? '#0D9488' : '#1F2937' }} />}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {/* STEP 1 — REVIEW */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-sm font-bold" style={{ color: '#EF4444' }}>SG-2026-0001</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>DSL Review Required</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div><span style={{ color: '#6B7280' }}>Pupil:</span> <span style={{ color: '#F9FAFB' }}>Year 9 — [Name redacted]</span></div>
                  <div><span style={{ color: '#6B7280' }}>Logged by:</span> <span style={{ color: '#F9FAFB' }}>Ms Clarke</span></div>
                  <div><span style={{ color: '#6B7280' }}>Date logged:</span> <span style={{ color: '#F9FAFB' }}>2 days ago</span></div>
                  <div><span style={{ color: '#6B7280' }}>Type:</span> <span style={{ color: '#F9FAFB' }}>Pastoral / Wellbeing</span></div>
                </div>
                <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#1F2937' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Description</p>
                  <p className="text-sm" style={{ color: '#D1D5DB', lineHeight: 1.6 }}>Pupil appeared distressed, disclosed issues at home. Further follow-up recommended.</p>
                </div>
                <div className="text-xs" style={{ color: '#6B7280' }}>Previous concerns: <span style={{ color: '#22C55E' }}>None on record</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setFlaggedRead(true); showToast('Concern flagged as read') }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: flaggedRead ? 'rgba(13,148,136,0.15)' : '#1F2937', color: flaggedRead ? '#0D9488' : '#9CA3AF', border: flaggedRead ? '1px solid rgba(13,148,136,0.3)' : '1px solid #374151' }}>
                  {flaggedRead ? '✓ Flagged as read' : 'Flag as read'}
                </button>
                <button onClick={() => showToast('Request sent to Ms Clarke')} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151' }}>
                  Request more info
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — ASSESS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div>
                  <Label req>Risk level</Label>
                  <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={iS}>
                    <option value="">Select risk level...</option>
                    <option>Low — monitor and record</option>
                    <option>Medium — action required within 5 days</option>
                    <option>High — action required today</option>
                    <option>Critical — contact authorities immediately</option>
                  </select>
                </div>
                <div className="mt-4">
                  <Label req>Category</Label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={iS}>
                    <option value="">Select category...</option>
                    <option>Emotional abuse</option><option>Physical abuse</option><option>Neglect</option>
                    <option>Sexual abuse</option><option>Exploitation</option><option>Radicalisation</option>
                    <option>Domestic violence (witnessed)</option><option>Self-harm / mental health</option><option>Other</option>
                  </select>
                </div>
                <div className="mt-4">
                  <Label>DSL assessment notes</Label>
                  <textarea value={dslNotes} onChange={e => setDslNotes(e.target.value)} rows={4} placeholder="Record your professional assessment..." className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={iS} />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <span className="text-sm" style={{ color: '#D1D5DB' }}>Previously known to social services?</span>
                  <button onClick={() => setKnownToServices(!knownToServices)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: knownToServices ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', color: knownToServices ? '#EF4444' : '#6B7280', border: knownToServices ? '1px solid rgba(239,68,68,0.3)' : '1px solid #374151' }}>
                    {knownToServices ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — ACTIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>ASSIGN ACTIONS</p>
                <div className="space-y-2">
                  {Object.entries(actions).map(([action, data]) => (
                    <div key={action}>
                      <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer" style={{ backgroundColor: data.checked ? 'rgba(13,148,136,0.06)' : '#1F2937', border: data.checked ? '1px solid rgba(13,148,136,0.2)' : '1px solid #374151' }}>
                        <input type="checkbox" checked={data.checked} onChange={e => setActions(prev => ({ ...prev, [action]: { ...prev[action], checked: e.target.checked } }))} className="rounded" />
                        <span className="text-sm flex-1" style={{ color: '#D1D5DB' }}>{action}</span>
                      </label>
                      {data.checked && (
                        <div className="flex gap-2 mt-1.5 ml-8">
                          <select value={data.assignee} onChange={e => setActions(prev => ({ ...prev, [action]: { ...prev[action], assignee: e.target.value } }))} className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none" style={iS}>
                            <option value="">Assign to...</option>
                            <option>Dr Sarah Mitchell (Head)</option><option>Mr James Okafor (Deputy DSL)</option>
                            <option>Mr Tom Briggs (DSL)</option><option>Ms Clarke</option><option>Mrs Patel</option>
                          </select>
                          <input type="date" value={data.due} onChange={e => setActions(prev => ({ ...prev, [action]: { ...prev[action], due: e.target.value } }))} className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ ...iS, colorScheme: 'dark' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: '#6B7280' }}>{checkedActionCount} action{checkedActionCount !== 1 ? 's' : ''} selected</p>
              </div>
            </div>
          )}

          {/* STEP 4 — NOTIFY */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>WHO TO NOTIFY</p>
                <div className="space-y-2 mb-4">
                  {Object.entries(notifyList).map(([person, checked]) => (
                    <label key={person} className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer" style={{ backgroundColor: '#1F2937', border: checked ? '1px solid rgba(13,148,136,0.3)' : '1px solid #374151' }}>
                      <input type="checkbox" checked={checked} onChange={e => setNotifyList(prev => ({ ...prev, [person]: e.target.checked }))} className="rounded" />
                      <span className="text-sm" style={{ color: '#D1D5DB' }}>{person}</span>
                    </label>
                  ))}
                </div>
                <div className="mb-4">
                  <Label>Notification method</Label>
                  <div className="flex gap-2">
                    {['Email', 'SMS', 'Phone call'].map(m => (
                      <button key={m} onClick={() => setNotifyMethod(m)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: notifyMethod === m ? 'rgba(108,63,197,0.15)' : '#1F2937', color: notifyMethod === m ? '#A78BFA' : '#6B7280', border: notifyMethod === m ? '1px solid rgba(108,63,197,0.3)' : '1px solid #374151' }}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Message preview</Label>
                  <textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={6} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={iS} />
                </div>
                {isDemoMode && <p className="text-xs mt-3 italic" style={{ color: '#6B7280' }}>On a live plan notifications would be sent instantly to selected contacts</p>}
              </div>
            </div>
          )}

          {/* STEP 5 — CLOSE */}
          {step === 5 && !submitted && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>CLOSE OR ESCALATE</p>
                <div className="space-y-2 mb-4">
                  {([
                    { value: 'close' as const, label: 'Close concern — monitoring complete, no further action', color: '#22C55E' },
                    { value: 'open' as const, label: 'Keep open — ongoing monitoring required', color: '#FBBF24' },
                    { value: 'escalate' as const, label: 'Escalate — refer to external agency', color: '#EF4444' },
                  ]).map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer" style={{ backgroundColor: closeOption === opt.value ? `${opt.color}10` : '#1F2937', border: closeOption === opt.value ? `1px solid ${opt.color}40` : '1px solid #374151' }}>
                      <input type="radio" name="close" checked={closeOption === opt.value} onChange={() => setCloseOption(opt.value)} />
                      <span className="text-sm" style={{ color: '#D1D5DB' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {closeOption === 'close' && (
                  <div><Label>Closing summary</Label><textarea value={closingSummary} onChange={e => setClosingSummary(e.target.value)} rows={3} placeholder="Summary of actions taken and outcome..." className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={iS} /></div>
                )}
                {closeOption === 'open' && (
                  <div><Label>Review in</Label><div className="flex gap-2">{['3', '5', '7', '14', '30'].map(d => <button key={d} onClick={() => setReviewDays(d)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: reviewDays === d ? 'rgba(251,191,36,0.15)' : '#1F2937', color: reviewDays === d ? '#FBBF24' : '#6B7280', border: reviewDays === d ? '1px solid rgba(251,191,36,0.3)' : '1px solid #374151' }}>{d} days</button>)}</div></div>
                )}
                {closeOption === 'escalate' && (
                  <div className="space-y-3">
                    <div><Label req>Escalate to</Label><select value={escalateTo} onChange={e => setEscalateTo(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={iS}><option value="">Select...</option><option>Social Services</option><option>LADO</option><option>Police</option><option>CAMHS</option><option>Other</option></select></div>
                    <div><Label>Escalation notes</Label><textarea value={escalationNotes} onChange={e => setEscalationNotes(e.target.value)} rows={3} placeholder="Reason for escalation..." className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={iS} /></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5 — SUBMITTED CONFIRMATION */}
          {step === 5 && submitted && (
            <div className="space-y-4">
              {/* Formal report card — light background */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
                <div className="p-6" style={{ backgroundColor: '#FAFAFA' }}>
                  <div className="max-w-md mx-auto text-center" style={{ fontFamily: 'Georgia, serif' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6B7280' }}>SAFEGUARDING REVIEW COMPLETE</p>
                    <div className="h-px my-3" style={{ backgroundColor: '#D1D5DB' }} />
                    <div className="text-left space-y-2 text-xs" style={{ color: '#374151' }}>
                      <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Reference:</span><span className="font-semibold">SG-2026-0001</span></div>
                      <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Pupil:</span><span>Year 9 (identity protected)</span></div>
                      <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Risk level:</span><span className="font-semibold">{riskLevel || '—'}</span></div>
                      <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Actions assigned:</span><span>{checkedActionCount}</span></div>
                      <div className="flex justify-between"><span style={{ color: '#6B7280' }}>Status:</span><span className="font-bold" style={{ color: closeOption === 'close' ? '#22C55E' : closeOption === 'escalate' ? '#EF4444' : '#FBBF24' }}>{statusLabel}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 px-4 py-3" style={{ backgroundColor: '#111318', borderTop: '1px solid #1F2937' }}>
                  <button onClick={() => showToast(isDemoMode ? 'On a live plan this would generate a formatted PDF for Ofsted evidence' : 'PDF exported')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}><Download size={12} /> Export Report</button>
                  <button onClick={() => showToast(isDemoMode ? 'On a live plan this would email the report to the DSL team' : 'Report emailed')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}><Mail size={12} /> Email DSL</button>
                  <button onClick={() => showToast(isDemoMode ? 'On a live plan this would be saved to your safeguarding record, timestamped and Ofsted-ready' : 'Saved')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}><Save size={12} /> Save</button>
                </div>
              </div>
              {isDemoMode && <p className="text-xs text-center italic" style={{ color: '#6B7280' }}>On a live plan this concern would be updated in your safeguarding record, actions assigned to staff, and notifications sent. Your record would be Ofsted-ready and timestamped.</p>}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 1 && !submitted ? setStep(step - 1) : onClose()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>
            {step === 1 || submitted ? 'Close' : '← Back'}
          </button>
          {!submitted && step < 5 && (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Next <ChevronRight size={14} />
            </button>
          )}
          {!submitted && step === 5 && (
            <button onClick={() => setSubmitted(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: closeOption === 'escalate' ? '#EF4444' : '#0D9488', color: '#F9FAFB' }}>
              <Check size={14} /> {closeOption === 'escalate' ? 'Escalate & Submit' : closeOption === 'close' ? 'Close & Save' : 'Save & Set Review'}
            </button>
          )}
          {submitted && (
            <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <Check size={14} /> Done
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-xl px-5 py-3 shadow-2xl max-w-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm" style={{ color: '#F9FAFB' }}>{toast}</p>
        </div>
      )}
    </div>
  )
}
