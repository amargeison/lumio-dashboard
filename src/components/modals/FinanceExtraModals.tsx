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

/* ─────────────────────────────────────────────
   1. Purchase Request Modal
   ───────────────────────────────────────────── */

export function PurchaseRequestModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [cost, setCost] = useState('')
  const [supplier, setSupplier] = useState('')
  const [urgency, setUrgency] = useState('Medium')
  const [budgetCode, setBudgetCode] = useState('Curriculum')
  const [lineManager, setLineManager] = useState('Sarah Mitchell')
  const [justification, setJustification] = useState('')
  const [ref] = useState(genRef('PO'))

  return (
    <WizardShell onClose={onClose} title="Purchase Request" subtitle="Submit a new purchase order request" icon="🛒" step={step} totalSteps={3} stepLabels={['Details', 'Approval', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Item Description</Label>
            <input value={item} onChange={e => setItem(e.target.value)} placeholder="e.g. 30x Year 5 Maths Textbooks" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Quantity</Label>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value ? Number(e.target.value) : '')} placeholder="1" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Estimated Cost (&pound;)</Label>
              <input value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          </div>
          <div>
            <Label>Supplier (optional)</Label>
            <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. YPO, TTS Group" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Urgency</Label>
            <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Low', 'Medium', 'High', 'Urgent'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Budget Code</Label>
            <select value={budgetCode} onChange={e => setBudgetCode(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Curriculum', 'SEND', 'PE & Sports Premium', 'Pupil Premium', 'Capital', 'Maintenance', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label req>Line Manager Approval</Label>
            <select value={lineManager} onChange={e => setLineManager(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Sarah Mitchell', 'James Okafor', 'Mark Davis'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label req>Justification</Label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={4} placeholder="Explain why this purchase is needed..." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Purchase request submitted</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Ref: {ref}</p>
          </div>
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Item</span><span style={{ color: '#F9FAFB' }}>{item || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Quantity</span><span style={{ color: '#F9FAFB' }}>{quantity || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Cost</span><span style={{ color: '#F9FAFB' }}>&pound;{cost || '0.00'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Budget Code</span><span style={{ color: '#F9FAFB' }}>{budgetCode}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Approver</span><span style={{ color: '#F9FAFB' }}>{lineManager}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Urgency</span><span style={{ color: urgency === 'Urgent' ? '#EF4444' : urgency === 'High' ? '#F59E0B' : '#F9FAFB' }}>{urgency}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your purchase request has been routed for approval." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   2. Spend vs Forecast Modal
   ───────────────────────────────────────────── */

const spendRows = [
  { area: 'Staffing', forecast: 485000, actual: 491200 },
  { area: 'Curriculum Resources', forecast: 32000, actual: 28750 },
  { area: 'SEND Provision', forecast: 67500, actual: 71300 },
  { area: 'Premises & Maintenance', forecast: 41000, actual: 43800 },
  { area: 'ICT & Software', forecast: 18500, actual: 17200 },
]

function varianceColor(v: number) {
  const abs = Math.abs(v)
  if (abs <= 2) return '#10B981'
  if (abs <= 5) return '#F59E0B'
  return '#EF4444'
}

export function SpendVsForecastModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [budgetArea, setBudgetArea] = useState('Staffing')
  const [period, setPeriod] = useState('This Term')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const totalForecast = spendRows.reduce((s, r) => s + r.forecast, 0)
  const totalActual = spendRows.reduce((s, r) => s + r.actual, 0)

  return (
    <WizardShell onClose={onClose} title="Spend vs Forecast" subtitle="Compare actual spend against budget forecasts" icon="📊" step={step} totalSteps={3} stepLabels={['Configure', 'Report', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Budget Area</Label>
            <select value={budgetArea} onChange={e => setBudgetArea(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Staffing', 'Curriculum', 'SEND', 'Premises', 'ICT', 'Catering', 'Other'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <Label req>Period</Label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['This Month', 'This Term', 'This Year', 'Custom'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {period === 'Custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label req>Start Date</Label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              </div>
              <div>
                <Label req>End Date</Label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              </div>
            </div>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Period: {period === 'Custom' ? `${customStart} to ${customEnd}` : period}</p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #374151' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: '#1F2937' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: '#9CA3AF' }}>Budget Area</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: '#9CA3AF' }}>Forecast</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: '#9CA3AF' }}>Actual</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: '#9CA3AF' }}>Variance</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: '#9CA3AF' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {spendRows.map(r => {
                  const variance = r.actual - r.forecast
                  const pct = ((variance / r.forecast) * 100).toFixed(1)
                  return (
                    <tr key={r.area} style={{ borderTop: '1px solid #374151' }}>
                      <td className="px-3 py-2" style={{ color: '#F9FAFB' }}>{r.area}</td>
                      <td className="text-right px-3 py-2" style={{ color: '#F9FAFB' }}>&pound;{r.forecast.toLocaleString()}</td>
                      <td className="text-right px-3 py-2" style={{ color: '#F9FAFB' }}>&pound;{r.actual.toLocaleString()}</td>
                      <td className="text-right px-3 py-2 font-semibold" style={{ color: varianceColor(Math.abs(Number(pct))) }}>{variance >= 0 ? '+' : ''}&pound;{variance.toLocaleString()}</td>
                      <td className="text-right px-3 py-2 font-semibold" style={{ color: varianceColor(Math.abs(Number(pct))) }}>{variance >= 0 ? '+' : ''}{pct}%</td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: '2px solid #374151', backgroundColor: '#1F2937' }}>
                  <td className="px-3 py-2 font-bold" style={{ color: '#F9FAFB' }}>Total</td>
                  <td className="text-right px-3 py-2 font-bold" style={{ color: '#F9FAFB' }}>&pound;{totalForecast.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 font-bold" style={{ color: '#F9FAFB' }}>&pound;{totalActual.toLocaleString()}</td>
                  <td className="text-right px-3 py-2 font-bold" style={{ color: varianceColor(Math.abs(((totalActual - totalForecast) / totalForecast) * 100)) }}>{totalActual - totalForecast >= 0 ? '+' : ''}&pound;{(totalActual - totalForecast).toLocaleString()}</td>
                  <td className="text-right px-3 py-2 font-bold" style={{ color: varianceColor(Math.abs(((totalActual - totalForecast) / totalForecast) * 100)) }}>{(((totalActual - totalForecast) / totalForecast) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-2">&#128202;</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Report exported</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Spend vs Forecast — {period === 'Custom' ? `${customStart} to ${customEnd}` : period}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your report has been exported and is ready to download." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   3. Grant Application Modal
   ───────────────────────────────────────────── */

export function GrantApplicationModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [grantName, setGrantName] = useState('')
  const [funder, setFunder] = useState('')
  const [deadline, setDeadline] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [qualifies, setQualifies] = useState('')
  const [previousApps, setPreviousApps] = useState(false)
  const [previousDetails, setPreviousDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    if (step === 3 && !draftReady) {
      setLoading(true)
      const t = setTimeout(() => { setLoading(false); setDraftReady(true) }, 2000)
      return () => clearTimeout(t)
    }
  }, [step, draftReady])

  return (
    <WizardShell onClose={onClose} title="Grant Application" subtitle="Draft and submit a funding application" icon="💰" step={step} totalSteps={4} stepLabels={['Details', 'Eligibility', 'AI Draft', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Grant Name</Label>
            <input value={grantName} onChange={e => setGrantName(e.target.value)} placeholder="e.g. DfE Condition Improvement Fund" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Funder</Label>
            <input value={funder} onChange={e => setFunder(e.target.value)} placeholder="e.g. Department for Education" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Deadline</Label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Amount (&pound;)</Label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Purpose of Grant</Label>
            <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={3} placeholder="What will the funding be used for?" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <Label req>How Does the School Qualify?</Label>
            <textarea value={qualifies} onChange={e => setQualifies(e.target.value)} rows={3} placeholder="Describe eligibility criteria the school meets..." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Label>Previous Applications to This Funder?</Label>
              <button onClick={() => setPreviousApps(!previousApps)} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ backgroundColor: previousApps ? '#0D9488' : '#374151' }}>
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform" style={{ transform: previousApps ? 'translateX(18px)' : 'translateX(3px)' }} />
              </button>
            </div>
            {previousApps && (
              <div>
                <Label>Details of Previous Applications</Label>
                <textarea value={previousDetails} onChange={e => setPreviousDetails(e.target.value)} rows={2} placeholder="Outcome, amount, year..." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
              </div>
            )}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm mt-3" style={{ color: '#9CA3AF' }}>Generating application draft...</p>
            </div>
          ) : (
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: '#0D9488' }}>Executive Summary</p>
                <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>
                  {grantName || 'This grant'} application seeks &pound;{amount || '—'} from {funder || 'the funder'} to support
                  {purpose ? ` ${purpose.slice(0, 80)}...` : ' the school\'s strategic improvement priorities.'}
                  The school serves a diverse community with above-average levels of pupil premium eligibility and is committed to raising standards through targeted investment.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: '#0D9488' }}>Need</p>
                <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>
                  Current provision falls short of national benchmarks in the identified areas. Without additional funding, the school cannot address
                  the infrastructure and resource gaps that directly impact pupil outcomes. Independent surveys and condition reports confirm urgent action is required.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: '#0D9488' }}>Impact</p>
                <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>
                  The investment will benefit approximately 420 pupils over a 3-year period, improving attainment by an estimated 8-12% in key stage outcomes.
                  Staff CPD will be embedded to ensure long-term sustainability of impact beyond the grant period.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: '#0D9488' }}>Budget Breakdown</p>
                <div className="space-y-1 mt-1">
                  {[
                    { item: 'Equipment & Resources', pct: 40 },
                    { item: 'Staff Training & CPD', pct: 25 },
                    { item: 'External Consultancy', pct: 15 },
                    { item: 'Infrastructure Works', pct: 12 },
                    { item: 'Monitoring & Evaluation', pct: 8 },
                  ].map(b => (
                    <div key={b.item} className="flex justify-between text-xs">
                      <span style={{ color: '#D1D5DB' }}>{b.item}</span>
                      <span style={{ color: '#F9FAFB' }}>&pound;{amount ? (Number(amount.replace(/,/g, '')) * b.pct / 100).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} ({b.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Grant application saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Deadline reminder set for 7 days before{deadline ? ` (${deadline})` : ''}.</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your draft application has been saved and a deadline reminder has been scheduled." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   4. Audit Prep Modal
   ───────────────────────────────────────────── */

const auditChecklistMap: Record<string, string[]> = {
  Internal: [
    'Review internal financial controls and segregation of duties',
    'Verify petty cash records and reconciliations',
    'Check purchase order approval trail for sample transactions',
    'Audit payroll records against staffing structure',
    'Review governor meeting minutes for financial oversight',
    'Validate bank reconciliation statements',
    'Inspect asset register accuracy and completeness',
    'Check compliance with Financial Regulations Manual',
    'Review budget monitoring reports for the period',
    'Verify grant income is correctly allocated and reported',
  ],
  External: [
    'Prepare year-end financial statements for auditor review',
    'Compile full bank reconciliation for audit period',
    'Gather all supplier invoices and payment evidence',
    'Prepare payroll summary with pension contributions',
    'Provide governors\' approved budget and amendments',
    'Document all related-party transactions',
    'Prepare schedule of fixed assets and depreciation',
    'Compile income records including lettings and grants',
    'Prepare debtors and creditors aged listings',
    'Ensure all journal entries are documented and approved',
  ],
  Ofsted: [
    'Prepare self-evaluation form (SEF) and school development plan',
    'Compile safeguarding audit trail and single central record',
    'Prepare SEND provision map and outcomes data',
    'Gather attendance data and intervention evidence',
    'Prepare curriculum intent and implementation documentation',
    'Compile pupil premium strategy and impact data',
    'Prepare staff CPD log and performance management records',
    'Gather behaviour and exclusion data with analysis',
    'Prepare governance structure and meeting attendance',
    'Compile parental engagement and survey data',
  ],
  'LA Financial': [
    'Prepare Consistent Financial Reporting (CFR) return',
    'Compile Schools Financial Value Standard (SFVS) evidence',
    'Prepare budget plan with 3-year forecast',
    'Document procurement compliance for purchases over threshold',
    'Provide evidence of governor approval for budget',
    'Prepare staff cost analysis against benchmarks',
    'Compile grant expenditure reports (PP, PE, SEND)',
    'Prepare contracts register with renewal dates',
    'Document any deficit recovery plan if applicable',
    'Provide evidence of benchmarking against similar schools',
  ],
  DfE: [
    'Prepare Academy Trust accounts and audit documentation',
    'Compile Academies Financial Handbook compliance checklist',
    'Prepare related-party transactions register',
    'Document executive pay justification and benchmarking',
    'Prepare land and buildings valuation schedule',
    'Compile funding agreement compliance evidence',
    'Prepare management accounts for the period',
    'Document risk register and board review evidence',
    'Prepare consolidated financial statements',
    'Compile internal audit findings and action plans',
  ],
}

export function AuditPrepModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [auditType, setAuditType] = useState('Internal')
  const [auditDate, setAuditDate] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [ref] = useState(genRef('AUD'))

  const allFocus = ['Governance', 'Staffing', 'Finance', 'Curriculum', 'SEND', 'Safeguarding', 'Premises']
  const checklist = auditChecklistMap[auditType] || auditChecklistMap['Internal']
  const totalChecked = Object.values(checked).filter(Boolean).length

  function toggleFocus(f: string) {
    setFocusAreas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  return (
    <WizardShell onClose={onClose} title="Audit Prep" subtitle="Prepare for an upcoming audit" icon="📋" step={step} totalSteps={3} stepLabels={['Audit Type', 'Period', 'Checklist']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Audit Type</Label>
            <select value={auditType} onChange={e => { setAuditType(e.target.value); setChecked({}) }} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Internal', 'External', 'Ofsted', 'LA Financial', 'DfE'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Audit Date</Label>
            <input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Period Start</Label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Period End</Label>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          </div>
          <div>
            <Label req>Focus Areas</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {allFocus.map(f => {
                const active = focusAreas.includes(f)
                return (
                  <button key={f} onClick={() => toggleFocus(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{
                    backgroundColor: active ? 'rgba(13,148,136,0.2)' : '#1F2937',
                    color: active ? '#0D9488' : '#9CA3AF',
                    border: `1px solid ${active ? '#0D9488' : '#374151'}`,
                  }}>{f}</button>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{auditType} Audit Checklist</p>
            <p className="text-xs font-semibold" style={{ color: totalChecked === checklist.length ? '#10B981' : '#F59E0B' }}>{totalChecked}/{checklist.length} complete</p>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#1F2937' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(totalChecked / checklist.length) * 100}%`, backgroundColor: totalChecked === checklist.length ? '#10B981' : '#0D9488' }} />
          </div>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <button key={i} onClick={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))} className="flex items-start gap-3 w-full text-left rounded-lg p-3 transition-colors" style={{ backgroundColor: checked[i] ? 'rgba(13,148,136,0.06)' : '#1F2937', border: `1px solid ${checked[i] ? 'rgba(13,148,136,0.3)' : '#374151'}` }}>
                <div className="flex items-center justify-center rounded shrink-0 mt-0.5" style={{ width: 18, height: 18, backgroundColor: checked[i] ? '#0D9488' : 'transparent', border: checked[i] ? 'none' : '1.5px solid #4B5563' }}>
                  {checked[i] && <Check size={12} style={{ color: '#fff' }} />}
                </div>
                <span className="text-xs leading-relaxed" style={{ color: checked[i] ? '#6B7280' : '#D1D5DB', textDecoration: checked[i] ? 'line-through' : 'none' }}>{item}</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Audit prep checklist generated</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Ref: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your audit checklist has been saved and can be shared with your team." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   5. Supplier Search Modal
   ───────────────────────────────────────────── */

const demoSuppliers = [
  { name: 'YPO', category: 'Stationery & Resources', delivery: '2-3 days', rating: 4.7, priceRange: '£5 – £500' },
  { name: 'TTS Group', category: 'Curriculum Resources', delivery: '3-5 days', rating: 4.5, priceRange: '£10 – £2,000' },
  { name: 'Hope Education', category: 'Furniture & Equipment', delivery: '5-7 days', rating: 4.3, priceRange: '£20 – £5,000' },
  { name: 'Findel Education', category: 'General Supplies', delivery: '2-4 days', rating: 4.4, priceRange: '£3 – £1,500' },
  { name: 'RM Technology', category: 'IT Equipment', delivery: '5-10 days', rating: 4.6, priceRange: '£50 – £10,000' },
]

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-xs" style={{ color: i < full ? '#F59E0B' : (i === full && half) ? '#F59E0B' : '#374151' }}>
          {i < full ? '\u2605' : (i === full && half) ? '\u2605' : '\u2606'}
        </span>
      ))}
      <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>{rating}</span>
    </div>
  )
}

export function SupplierSearchModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('Stationery')
  const [keyword, setKeyword] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')

  return (
    <WizardShell onClose={onClose} title="Supplier Search" subtitle="Find and compare approved suppliers" icon="🔍" step={step} totalSteps={3} stepLabels={['Search', 'Results', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Category</Label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Stationery', 'IT Equipment', 'Furniture', 'Cleaning', 'Catering', 'Curriculum Resources', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Keyword</Label>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. whiteboards, laptops" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Min (&pound;)</Label>
              <input value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="0" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label>Budget Max (&pound;)</Label>
              <input value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="10,000" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Showing 5 approved suppliers for &ldquo;{category}&rdquo;</p>
          {demoSuppliers.map(s => (
            <div key={s.name} className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{s.category}</p>
                </div>
                <Stars rating={s.rating} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Delivery: {s.delivery}</span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Price range: {s.priceRange}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Supplier shortlist saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>5 suppliers added to your shortlist for {category}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your supplier shortlist has been saved and can be shared with your procurement team." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   6. Export Accounts Modal
   ───────────────────────────────────────────── */

export function ExportAccountsModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [reportType, setReportType] = useState('Trial Balance')
  const [period, setPeriod] = useState('This Quarter')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [format, setFormat] = useState('PDF')

  const previewData = {
    'Trial Balance': { income: 1245800, expenditure: 1187350 },
    'Income & Expenditure': { income: 1245800, expenditure: 1187350 },
    'Balance Sheet': { income: 892400, expenditure: 847200 },
    'Cash Flow': { income: 1102600, expenditure: 1056900 },
    'Budget vs Actuals': { income: 1245800, expenditure: 1210500 },
  }
  const data = previewData[reportType as keyof typeof previewData] || previewData['Trial Balance']
  const surplus = data.income - data.expenditure

  return (
    <WizardShell onClose={onClose} title="Export Accounts" subtitle="Generate and export financial reports" icon="📑" step={step} totalSteps={3} stepLabels={['Configure', 'Preview', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Report Type</Label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Trial Balance', 'Income & Expenditure', 'Balance Sheet', 'Cash Flow', 'Budget vs Actuals'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label req>Period</Label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['This Month', 'This Quarter', 'This Year', 'Custom'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {period === 'Custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label req>Start Date</Label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              </div>
              <div>
                <Label req>End Date</Label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              </div>
            </div>
          )}
          <div>
            <Label req>Format</Label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['PDF', 'Excel', 'CSV'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Report Preview</p>
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#6B7280' }}>Report</span>
              <span className="font-semibold" style={{ color: '#F9FAFB' }}>{reportType}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#6B7280' }}>Period</span>
              <span className="font-semibold" style={{ color: '#F9FAFB' }}>{period === 'Custom' ? `${customStart} to ${customEnd}` : period}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#6B7280' }}>Format</span>
              <span className="font-semibold" style={{ color: '#F9FAFB' }}>{format}</span>
            </div>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 12 }}>
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: '#6B7280' }}>Total Income</span>
                <span className="font-semibold" style={{ color: '#10B981' }}>&pound;{data.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: '#6B7280' }}>Total Expenditure</span>
                <span className="font-semibold" style={{ color: '#EF4444' }}>&pound;{data.expenditure.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-2" style={{ borderTop: '1px solid #374151' }}>
                <span className="font-bold" style={{ color: '#F9FAFB' }}>{surplus >= 0 ? 'Surplus' : 'Deficit'}</span>
                <span className="font-bold" style={{ color: surplus >= 0 ? '#10B981' : '#EF4444' }}>&pound;{Math.abs(surplus).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Accounts exported as {format}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{reportType} — {period === 'Custom' ? `${customStart} to ${customEnd}` : period}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text={`Your ${reportType} report has been exported as ${format} and is ready to download.`} />
        </div>
      )}
    </WizardShell>
  )
}
