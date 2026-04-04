'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, Sparkles, Mail, Calendar, Shield } from 'lucide-react'

const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500'

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Documents', 'AI Briefing', 'Submit']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current; const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${done ? 'bg-teal-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-[#6B7280]'}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px w-16 mx-2 mb-5 transition-colors ${i < current ? 'bg-teal-500' : 'bg-[#1F2937]'}`} />}
          </div>
        )
      })}
    </div>
  )
}

const AUDIT_TYPES = ['Statutory annual audit','Internal audit','VAT inspection','HMRC enquiry','Due diligence','Grant audit']

const DOC_CHECKLIST = {
  'Statutory Accounts': ['Draft statutory accounts prepared','Prior year comparatives agreed','Accounting policies reviewed and consistent','Related party transactions documented','Post balance sheet events noted','Going concern assessment prepared'],
  'Financial Records': ['Bank statements \u2014 all accounts, full year','Bank reconciliations \u2014 all months','Sales ledger \u2014 aged debtors and reconciliation','Purchase ledger \u2014 aged creditors and reconciliation','Fixed asset register \u2014 additions, disposals, depreciation','Stock/inventory count sheets and valuation','Loan agreements and facility letters'],
  'Payroll & HR': ['Payroll reports \u2014 full year by month','P60s and P11Ds prepared','PAYE reconciliation to HMRC','Pension contributions reconciliation','Directors\u2019 service agreements','Board minutes \u2014 all meetings during period'],
  'Tax': ['Corporation tax computation draft','R&D tax credit claim (if applicable)','Capital allowances schedule','VAT returns \u2014 all periods','PAYE/NI reconciliation'],
  'Governance': ['Board minutes \u2014 full set for period','Shareholder register up to date','Articles of association available','Statutory books up to date','Companies House filings current'],
}
const ALL_DOCS = Object.values(DOC_CHECKLIST).flat()

export default function AuditPage() {
  const [step, setStep] = useState(0)
  const [auditType, setAuditType] = useState('Statutory annual audit')
  const [yearEnd, setYearEnd] = useState('')
  const [auditorFirm, setAuditorFirm] = useState('')
  const [auditStart, setAuditStart] = useState('')
  const [partner, setPartner] = useState('')
  const [fee, setFee] = useState('')
  const [firstAudit, setFirstAudit] = useState(false)
  const [risks, setRisks] = useState('')

  const [checked, setChecked] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('audit_checklist'); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  useEffect(() => { try { localStorage.setItem('audit_checklist', JSON.stringify([...checked])) } catch {} }, [checked])

  const [briefing, setBriefing] = useState('')
  const [generating, setGenerating] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function toggle(doc: string) { setChecked(prev => { const n = new Set(prev); n.has(doc) ? n.delete(doc) : n.add(doc); return n }) }

  async function generateBriefing() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/football-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', query: `FINANCE AUDIT: Generate a professional auditor briefing note for a ${auditType} for the year ended ${yearEnd || '31 March 2026'}. Include: Business overview, Key accounting policies, Significant transactions, Known risk areas${risks ? ': ' + risks : ''}, Areas requiring audit focus, Management key judgements. Professional tone for opening meeting with ${auditorFirm || 'external auditors'}.` }) })
      const d = await res.json()
      setBriefing(typeof d.result === 'string' ? d.result : d.result?.summary || `Auditor Briefing Note\n${auditType} \u2014 Year ended ${yearEnd || '31 March 2026'}\n\nBusiness Overview\nLumio is a B2B SaaS platform providing integrated business management tools. The company has experienced 12% MoM revenue growth with a current ARR of approximately \u00A3500k.\n\nKey Accounting Policies\nRevenue is recognised on a subscription basis over the contract period. Development costs are capitalised where they meet the criteria of IAS 38. All other costs are expensed as incurred.\n\nSignificant Transactions\n\u2022 Series A fundraise completed in Q2 (\u00A32.1m)\n\u2022 Office relocation and new lease agreement\n\u2022 3 key hires in senior leadership team\n\nKnown Risk Areas\n${risks || 'No material risk areas identified by management.'}\n\nAreas Requiring Audit Focus\n\u2022 Revenue recognition \u2014 contract modifications and deferred income\n\u2022 Capitalised development costs \u2014 impairment assessment\n\u2022 Related party transactions \u2014 director loan account\n\u2022 Going concern \u2014 cash runway assessment\n\nManagement Key Judgements\n\u2022 Useful life of capitalised development (3 years)\n\u2022 Expected credit loss provision methodology\n\u2022 Going concern period (12 months from signing)`)
    } catch { setBriefing(`Auditor Briefing Note\n${auditType}\nYear ended ${yearEnd || '31 March 2026'}\n\nProfessional briefing note for ${auditorFirm || 'external auditors'}. Revenue recognition, capitalised development costs, and going concern are the key audit focus areas.`) }
    setGenerating(false)
  }

  const auditRef = `AUD-${yearEnd ? yearEnd.slice(0, 4) : '2026'}-001`

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto" style={{ backgroundColor: '#07080F' }}>
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />ACCOUNTS-AUDIT-01
      </div>
      <div className="mb-6">
        <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4"><ArrowLeft className="w-4 h-4" /> Back to Accounts</Link>
        <h1 className="text-2xl font-bold">Audit Preparation</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Prepare your audit pack, generate an AI briefing note, and schedule the opening meeting.</p>
      </div>
      <StepIndicator current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Audit Details</h2>
            <div><label className="text-xs text-gray-400 mb-1 block">Audit type</label>
              <div className="grid grid-cols-2 gap-2">{AUDIT_TYPES.map(t => (
                <button key={t} onClick={() => setAuditType(t)} className={`py-2 px-3 rounded-xl border text-xs text-left transition-all ${auditType === t ? 'border-purple-500 bg-purple-600/10 text-purple-300' : 'border-[#1F2937] text-gray-400 hover:border-gray-600'}`}>{t}</button>
              ))}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Year end date</label><input type="date" value={yearEnd} onChange={e => setYearEnd(e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Audit start date</label><input type="date" value={auditStart} onChange={e => setAuditStart(e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} /></div>
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Auditor firm</label><input value={auditorFirm} onChange={e => setAuditorFirm(e.target.value)} placeholder="e.g. Grant Thornton" className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Partner/contact</label><input value={partner} onChange={e => setPartner(e.target.value)} className={INPUT} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Estimated fee (&pound;)</label><input type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="12000" className={INPUT} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={firstAudit} onChange={e => setFirstAudit(e.target.checked)} className="rounded" />First audit with this firm</label>
            <div><label className="text-xs text-gray-400 mb-1 block">Known risk areas</label><textarea value={risks} onChange={e => setRisks(e.target.value)} rows={2} placeholder="Any areas of concern..." className={INPUT} /></div>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white">Next &mdash; Document Checklist</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Audit Document Checklist</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>{checked.size} of {ALL_DOCS.length} ready</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1F2937] mb-4"><div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(checked.size / ALL_DOCS.length) * 100}%` }} /></div>
            {Object.entries(DOC_CHECKLIST).map(([section, docs]) => (
              <div key={section} className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{section}</h3>
                <div className="space-y-1">
                  {docs.map(doc => (
                    <label key={doc} className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-white/[0.02] transition-colors">
                      <button onClick={() => toggle(doc)} className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked.has(doc) ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`}>{checked.has(doc) && <Check className="w-3 h-3 text-white" />}</button>
                      <span className={`text-sm ${checked.has(doc) ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{doc}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#1F2937] text-gray-400">Back</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm font-bold bg-purple-600 text-white">Next &mdash; AI Briefing</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-purple-400" /><h2 className="font-semibold">AI Auditor Briefing Note</h2></div>
            {!briefing && !generating && <button onClick={generateBriefing} className="w-full py-3 rounded-xl text-sm font-bold bg-purple-600 text-white flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Generate Briefing Note</button>}
            {generating && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" /><p className="text-sm text-gray-400">Generating auditor briefing...</p></div>}
            {briefing && <textarea value={briefing} onChange={e => setBriefing(e.target.value)} rows={18} className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 outline-none resize-vertical" />}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#1F2937] text-gray-400">Back</button>
            <button onClick={() => setStep(3)} disabled={!briefing} className={`flex-1 py-3 rounded-xl text-sm font-bold ${briefing ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-gray-600'}`}>Next &mdash; Submit</button>
          </div>
        </div>
      )}

      {step === 3 && !submitted && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-purple-400" /><h2 className="font-semibold">Audit Pack Summary</h2></div>
            <div className="space-y-2 text-sm">
              {[{ l: 'Audit Ref', v: auditRef },{ l: 'Type', v: auditType },{ l: 'Year End', v: yearEnd || 'Not set' },{ l: 'Auditor', v: auditorFirm || 'Not set' },{ l: 'Documents Ready', v: `${checked.size} of ${ALL_DOCS.length}` },{ l: 'Briefing', v: briefing ? 'Generated' : 'Not generated' }].map(r => (
                <div key={r.l} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #1F2937' }}><span className="text-gray-400">{r.l}</span><span className="text-white font-medium">{r.v}</span></div>
              ))}
            </div>
          </div>
          <button onClick={() => setSubmitted(true)} className="w-full py-3.5 rounded-xl text-sm font-bold bg-teal-600 text-white">{'\u2705'} Submit Audit Pack</button>
        </div>
      )}

      {step === 3 && submitted && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">{'\u2705'}</div>
            <h2 className="text-xl font-bold mb-2">Audit Pack Ready &mdash; {auditRef}</h2>
            <p className="text-sm text-gray-400 mb-6">{checked.size}/{ALL_DOCS.length} documents &middot; Briefing generated &middot; {auditType}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white flex items-center gap-2"><Mail className="w-4 h-4" /> Email Audit Pack</button>
              <button className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1F2937] text-gray-300 flex items-center gap-2"><Calendar className="w-4 h-4" /> Book Opening Meeting</button>
              <button className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1F2937] text-gray-300 flex items-center gap-2"><Calendar className="w-4 h-4" /> Set Completion Reminder</button>
            </div>
          </div>
          <Link href="/accounts" className="block text-center text-sm text-gray-500 hover:text-gray-300">&larr; Back to Accounts</Link>
        </div>
      )}
    </div>
  )
}
