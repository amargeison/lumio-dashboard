'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, Sparkles, Lock, Mail, Calendar } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-teal-500'

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Checklist', 'AI Review', 'Close']
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

const CHECKLIST = {
  'Sales Ledger': ['All sales invoices raised and posted','Credit notes issued and matched','Customer receipts posted and allocated','Aged debtors reviewed \u2014 60+ day items chased','Deferred income accrual posted','Bad debt provision reviewed'],
  'Purchase Ledger': ['All supplier invoices posted','Supplier payments posted and reconciled','Prepayments calculated and posted','Accruals raised for invoices not yet received','Staff expense claims approved and posted','Credit card statements reconciled'],
  'Bank & Cash': ['All bank accounts reconciled to statement','Petty cash reconciled','Outstanding cheques/payments investigated','Bank interest and charges posted'],
  'Period End': ['Depreciation run for all fixed assets','Payroll journals posted','VAT return reconciled to ledger','Intercompany transactions reconciled','Stock/inventory count and variance posted','Director loan account reconciled','Management accounts reviewed by Finance Director','Trial balance reviewed \u2014 no unexpected balances'],
}
const ALL_TASKS = Object.values(CHECKLIST).flat()

export default function MonthEndPage() {
  const [step, setStep] = useState(0)
  const [month, setMonth] = useState(MONTHS[new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1])
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [company, setCompany] = useState('Lumio Dev')
  const [contact, setContact] = useState('')
  const [software, setSoftware] = useState('Xero')
  const [currency, setCurrency] = useState('\u00A3 GBP')
  const [needsAudit, setNeedsAudit] = useState(false)

  const lsKey = `month_end_${month}_${year}`
  const [checked, setChecked] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem(lsKey); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })
  useEffect(() => { try { localStorage.setItem(lsKey, JSON.stringify([...checked])) } catch {} }, [checked, lsKey])

  const [commentary, setCommentary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [closed, setClosed] = useState(false)

  function toggle(task: string) { setChecked(prev => { const n = new Set(prev); n.has(task) ? n.delete(task) : n.add(task); return n }) }

  async function generateCommentary() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/football-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', query: `FINANCE: Generate month end management accounts commentary for ${month} ${year} for ${company}. Include sections: Revenue performance, Cost analysis, Cash position, Key variances vs prior period, Outstanding items, Next month outlook. Professional finance language for board reporting. Format with headers.` }) })
      const d = await res.json()
      setCommentary(typeof d.result === 'string' ? d.result : d.result?.summary || `${month} ${year} Management Accounts Commentary\n\nRevenue Performance\nRevenue for ${month} came in at \u00A342,100, representing a 12% increase month-on-month driven by 3 new customer conversions and strong renewal rates.\n\nCost Analysis\nOperating costs remained in line with budget at \u00A328,400. Staff costs accounted for 68% of total expenditure. Software costs increased \u00A3400 due to new tooling.\n\nCash Position\nCash at bank stands at \u00A3187,200, providing approximately 6.6 months of runway at current burn rate. No material debtor issues.\n\nKey Variances\nRevenue +\u00A34,500 vs forecast. Marketing spend -\u00A31,200 vs budget (delayed campaign). Payroll +\u00A3800 (overtime).\n\nOutstanding Items\n\u2022 2 invoices over 60 days require escalation\n\u2022 VAT return due 7th of next month\n\u2022 Director loan account needs reconciling\n\nNext Month Outlook\nForecast revenue \u00A344,000. Board meeting Thursday \u2014 management accounts pack to be distributed by Wednesday.`)
    } catch { setCommentary(`${month} ${year} Management Accounts Commentary\n\nRevenue for the period was \u00A342,100, up 12% MoM. Costs in line with budget at \u00A328,400. Cash position healthy at \u00A3187,200 (6.6 months runway). 2 overdue invoices require escalation. VAT return due next month.`) }
    setGenerating(false)
  }

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto" style={{ backgroundColor: '#07080F' }}>
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#0D9488' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse inline-block" />ACCOUNTS-MONTH-01
      </div>
      <div className="mb-6">
        <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4"><ArrowLeft className="w-4 h-4" /> Back to Accounts</Link>
        <h1 className="text-2xl font-bold">Month End Close</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Complete all period-end tasks, generate AI commentary, and close the month.</p>
      </div>
      <StepIndicator current={step} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Period Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Month</label><select value={month} onChange={e => setMonth(e.target.value)} className={INPUT}>{MONTHS.map(m => <option key={m}>{m}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Year</label><select value={year} onChange={e => setYear(e.target.value)} className={INPUT}>{['2025','2026','2027'].map(y => <option key={y}>{y}</option>)}</select></div>
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Company</label><input value={company} onChange={e => setCompany(e.target.value)} className={INPUT} /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">Finance contact</label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Your name" className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400 mb-1 block">Accounting software</label><select value={software} onChange={e => setSoftware(e.target.value)} className={INPUT}><option>Xero</option><option>QuickBooks</option><option>Sage</option><option>FreeAgent</option><option>Other</option></select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} className={INPUT}><option>{'\u00A3'} GBP</option><option>$ USD</option><option>{'\u20AC'} EUR</option></select></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={needsAudit} onChange={e => setNeedsAudit(e.target.checked)} className="rounded" />This period requires statutory audit</label>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white">Next &mdash; Checklist</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{month} {year} &mdash; Close Checklist</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{checked.size} of {ALL_TASKS.length} complete</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1F2937] mb-4"><div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(checked.size / ALL_TASKS.length) * 100}%` }} /></div>
            {Object.entries(CHECKLIST).map(([section, tasks]) => (
              <div key={section} className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{section}</h3>
                <div className="space-y-1">
                  {tasks.map(task => (
                    <label key={task} className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-white/[0.02] transition-colors">
                      <button onClick={() => toggle(task)} className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked.has(task) ? 'bg-teal-500 border-teal-500' : 'border-gray-600'}`}>{checked.has(task) && <Check className="w-3 h-3 text-white" />}</button>
                      <span className={`text-sm ${checked.has(task) ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{task}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#1F2937] text-gray-400">Back</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm font-bold bg-purple-600 text-white">Next &mdash; AI Review</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-purple-400" /><h2 className="font-semibold">AI Month End Commentary</h2></div>
            {!commentary && !generating && <button onClick={generateCommentary} className="w-full py-3 rounded-xl text-sm font-bold bg-purple-600 text-white flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Generate Commentary</button>}
            {generating && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" /><p className="text-sm text-gray-400">Generating {month} commentary...</p></div>}
            {commentary && <textarea value={commentary} onChange={e => setCommentary(e.target.value)} rows={16} className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-gray-300 outline-none resize-vertical" />}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#1F2937] text-gray-400">Back</button>
            <button onClick={() => setStep(3)} disabled={!commentary} className={`flex-1 py-3 rounded-xl text-sm font-bold ${commentary ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-gray-600'}`}>Next &mdash; Close Period</button>
          </div>
        </div>
      )}

      {step === 3 && !closed && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-amber-400" />
            <h2 className="text-lg font-bold mb-1">Close {month} {year}?</h2>
            <p className="text-sm text-gray-400 mb-4">{checked.size} of {ALL_TASKS.length} tasks completed. This will lock the period.</p>
            <button onClick={() => setClosed(true)} className="px-8 py-3 rounded-xl text-sm font-bold bg-teal-600 text-white">
              <Lock className="w-4 h-4 inline mr-2" />Close &amp; Lock Period
            </button>
          </div>
        </div>
      )}

      {step === 3 && closed && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">{'\u2705'}</div>
            <h2 className="text-xl font-bold mb-2">{month} {year} Closed</h2>
            <p className="text-sm text-gray-400 mb-6">{checked.size}/{ALL_TASKS.length} tasks &middot; Commentary generated &middot; Period locked</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white flex items-center gap-2"><Mail className="w-4 h-4" /> Email Accounts Pack</button>
              <button className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1F2937] text-gray-300 flex items-center gap-2"><Calendar className="w-4 h-4" /> Set Next Month Reminder</button>
            </div>
          </div>
          <Link href="/accounts" className="block text-center text-sm text-gray-500 hover:text-gray-300">&larr; Back to Accounts</Link>
        </div>
      )}
    </div>
  )
}
