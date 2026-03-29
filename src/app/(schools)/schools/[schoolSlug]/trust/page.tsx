'use client'
import React, { useState, useEffect } from 'react'
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import {
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Users, DollarSign, BookOpen,
  Shield, Heart, Building2, Wrench, FileText, Star, Zap, BarChart2,
  Phone, Clock, AlertCircle, Award, Globe
} from 'lucide-react'

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type RAG = 'green' | 'amber' | 'red' | 'blue'
type Trend = 'up' | 'down' | 'flat'

// ─── THEME HELPERS ─────────────────────────────────────────────────────────────
const rag = (r: RAG) => ({
  green: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  amber: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  red:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
  blue:  { color: '#0D9488', bg: 'rgba(13,148,136,0.12)', border: 'rgba(13,148,136,0.3)' },
}[r])

const trendIcon = (t: Trend, good: 'up'|'down' = 'up') => {
  const positive = t === good
  const neutral = t === 'flat'
  const color = neutral ? '#9CA3AF' : positive ? '#22C55E' : '#EF4444'
  return t === 'up' ? <TrendingUp size={12} style={{color}} /> :
         t === 'down' ? <TrendingDown size={12} style={{color}} /> :
         <Minus size={12} style={{color:'#9CA3AF'}} />
}

// ─── MOCK TRUST DATA ─────────────────────────────────────────────────────────
const TRUST = {
  name: 'The Alliance Schools Trust',
  ceo: 'Dr. Sarah Henley',
  location: 'Milton Keynes',
  schools: 6,
  pupils: 2847,
  staff: 312,
  phase: 'Primary & Secondary',
}

const SCHOOLS = [
  {
    id: 1, name: 'Oakridge Primary', phase: 'Primary', pupils: 412, nob: 430,
    ht: 'Mrs. T. Walsh', ragOverall: 'green' as RAG,
    attendance: 95.8, attendanceRag: 'green' as RAG, attendanceTrend: 'up' as Trend,
    attainmentKS2: 72, attainmentRag: 'green' as RAG, attainmentTrend: 'up' as Trend,
    budget: 1820000, budgetVariance: 12400, budgetRag: 'green' as RAG,
    ehcps: 14, isp: 28, sendRag: 'amber' as RAG,
    safeguardingCases: 3, cpCases: 1, dslCompliant: true, safeguardingRag: 'amber' as RAG,
    ofstedGrade: 'Good', ofstedDate: 'Mar 2024', ofstedRag: 'green' as RAG,
    vacancies: 1, staffAbsence: 4.1, scrCompliant: true, hrRag: 'green' as RAG,
    estatesCondition: 'B', asbestosManaged: true, estatesRag: 'green' as RAG,
    sip: 72, sipRag: 'green' as RAG,
    paRate: 8.2, paRag: 'amber' as RAG,
    ppGap: -3.2, ppRag: 'amber' as RAG,
    fsm: 22.4, eal: 18.1, send: 14.8, lac: 3,
    exclusions: 0, incidentsTerm: 4,
    lastOfstedNote: 'Strong curriculum and leadership. SEND provision requires development.',
    budgetSpend: { teaching: 68, support: 18, premises: 8, other: 6 },
    icfp: { ptRatio: 21.4, staffCosts: 74.1, hoursDelivered: 96.2 },
  },
  {
    id: 2, name: 'Riverside Academy', phase: 'Primary', pupils: 624, nob: 630,
    ht: 'Mr. D. Osei', ragOverall: 'amber' as RAG,
    attendance: 93.1, attendanceRag: 'amber' as RAG, attendanceTrend: 'down' as Trend,
    attainmentKS2: 58, attainmentRag: 'amber' as RAG, attainmentTrend: 'flat' as Trend,
    budget: 2740000, budgetVariance: -38000, budgetRag: 'amber' as RAG,
    ehcps: 22, isp: 41, sendRag: 'red' as RAG,
    safeguardingCases: 7, cpCases: 3, dslCompliant: true, safeguardingRag: 'red' as RAG,
    ofstedGrade: 'Requires Improvement', ofstedDate: 'Oct 2023', ofstedRag: 'red' as RAG,
    vacancies: 4, staffAbsence: 7.8, scrCompliant: false, hrRag: 'red' as RAG,
    estatesCondition: 'C', asbestosManaged: true, estatesRag: 'amber' as RAG,
    sip: 44, sipRag: 'red' as RAG,
    paRate: 19.4, paRag: 'red' as RAG,
    ppGap: -8.7, ppRag: 'red' as RAG,
    fsm: 41.2, eal: 34.8, send: 19.2, lac: 8,
    exclusions: 3, incidentsTerm: 22,
    lastOfstedNote: 'Leadership improving. Attendance, SEND and outcomes remain concerns. Re-inspection due.',
    budgetSpend: { teaching: 71, support: 16, premises: 9, other: 4 },
    icfp: { ptRatio: 24.1, staffCosts: 79.4, hoursDelivered: 88.7 },
  },
  {
    id: 3, name: 'Meadowbrook Primary', phase: 'Primary', pupils: 318, nob: 315,
    ht: 'Mrs. J. Patel', ragOverall: 'green' as RAG,
    attendance: 96.4, attendanceRag: 'green' as RAG, attendanceTrend: 'up' as Trend,
    attainmentKS2: 79, attainmentRag: 'green' as RAG, attainmentTrend: 'up' as Trend,
    budget: 1420000, budgetVariance: 22800, budgetRag: 'green' as RAG,
    ehcps: 8, isp: 14, sendRag: 'green' as RAG,
    safeguardingCases: 1, cpCases: 0, dslCompliant: true, safeguardingRag: 'green' as RAG,
    ofstedGrade: 'Outstanding', ofstedDate: 'Jun 2022', ofstedRag: 'green' as RAG,
    vacancies: 0, staffAbsence: 2.8, scrCompliant: true, hrRag: 'green' as RAG,
    estatesCondition: 'A', asbestosManaged: true, estatesRag: 'green' as RAG,
    sip: 88, sipRag: 'green' as RAG,
    paRate: 6.1, paRag: 'green' as RAG,
    ppGap: -1.8, ppRag: 'green' as RAG,
    fsm: 12.4, eal: 9.2, send: 11.0, lac: 1,
    exclusions: 0, incidentsTerm: 1,
    lastOfstedNote: 'Exemplary curriculum and pastoral care. Model for the trust.',
    budgetSpend: { teaching: 66, support: 17, premises: 7, other: 10 },
    icfp: { ptRatio: 19.8, staffCosts: 72.1, hoursDelivered: 98.9 },
  },
  {
    id: 4, name: "St. Clement's CE Primary", phase: 'Primary', pupils: 209, nob: 210,
    ht: 'Rev. M. Brooks', ragOverall: 'green' as RAG,
    attendance: 95.1, attendanceRag: 'green' as RAG, attendanceTrend: 'flat' as Trend,
    attainmentKS2: 68, attainmentRag: 'green' as RAG, attainmentTrend: 'up' as Trend,
    budget: 940000, budgetVariance: 8200, budgetRag: 'green' as RAG,
    ehcps: 6, isp: 11, sendRag: 'green' as RAG,
    safeguardingCases: 2, cpCases: 1, dslCompliant: true, safeguardingRag: 'amber' as RAG,
    ofstedGrade: 'Good', ofstedDate: 'Nov 2023', ofstedRag: 'green' as RAG,
    vacancies: 1, staffAbsence: 3.4, scrCompliant: true, hrRag: 'green' as RAG,
    estatesCondition: 'B', asbestosManaged: false, estatesRag: 'red' as RAG,
    sip: 65, sipRag: 'amber' as RAG,
    paRate: 9.8, paRag: 'amber' as RAG,
    ppGap: -4.1, ppRag: 'amber' as RAG,
    fsm: 18.7, eal: 8.4, send: 12.9, lac: 2,
    exclusions: 0, incidentsTerm: 3,
    lastOfstedNote: 'Community ethos strong. Maths attainment gap closing. Asbestos management plan required.',
    budgetSpend: { teaching: 70, support: 15, premises: 9, other: 6 },
    icfp: { ptRatio: 20.9, staffCosts: 76.4, hoursDelivered: 94.1 },
  },
  {
    id: 5, name: 'Highfield Junior School', phase: 'Primary', pupils: 484, nob: 480,
    ht: 'Ms. K. Adeyemi', ragOverall: 'amber' as RAG,
    attendance: 92.4, attendanceRag: 'amber' as RAG, attendanceTrend: 'down' as Trend,
    attainmentKS2: 61, attainmentRag: 'amber' as RAG, attainmentTrend: 'flat' as Trend,
    budget: 2180000, budgetVariance: -14200, budgetRag: 'amber' as RAG,
    ehcps: 17, isp: 32, sendRag: 'amber' as RAG,
    safeguardingCases: 4, cpCases: 1, dslCompliant: true, safeguardingRag: 'amber' as RAG,
    ofstedGrade: 'Good', ofstedDate: 'Feb 2022', ofstedRag: 'amber' as RAG,
    vacancies: 3, staffAbsence: 6.2, scrCompliant: true, hrRag: 'amber' as RAG,
    estatesCondition: 'B', asbestosManaged: true, estatesRag: 'green' as RAG,
    sip: 54, sipRag: 'amber' as RAG,
    paRate: 15.8, paRag: 'red' as RAG,
    ppGap: -6.2, ppRag: 'amber' as RAG,
    fsm: 29.8, eal: 22.1, send: 16.4, lac: 5,
    exclusions: 1, incidentsTerm: 14,
    lastOfstedNote: 'Due reinspection. Attendance and PA rate key risks. New HT settling in well.',
    budgetSpend: { teaching: 69, support: 19, premises: 8, other: 4 },
    icfp: { ptRatio: 22.8, staffCosts: 77.8, hoursDelivered: 91.4 },
  },
  {
    id: 6, name: 'The Valley Academy', phase: 'Secondary', pupils: 800, nob: 810,
    ht: 'Mr. P. Clarke', ragOverall: 'green' as RAG,
    attendance: 94.8, attendanceRag: 'green' as RAG, attendanceTrend: 'up' as Trend,
    attainmentKS2: 0, attainmentRag: 'green' as RAG, attainmentTrend: 'up' as Trend,
    budget: 5200000, budgetVariance: 48000, budgetRag: 'green' as RAG,
    ehcps: 34, isp: 62, sendRag: 'amber' as RAG,
    safeguardingCases: 9, cpCases: 2, dslCompliant: true, safeguardingRag: 'amber' as RAG,
    ofstedGrade: 'Good', ofstedDate: 'May 2024', ofstedRag: 'green' as RAG,
    vacancies: 5, staffAbsence: 5.1, scrCompliant: true, hrRag: 'amber' as RAG,
    estatesCondition: 'B', asbestosManaged: true, estatesRag: 'green' as RAG,
    sip: 71, sipRag: 'green' as RAG,
    paRate: 11.2, paRag: 'amber' as RAG,
    ppGap: -5.4, ppRag: 'amber' as RAG,
    fsm: 24.1, eal: 19.8, send: 18.1, lac: 7,
    exclusions: 8, incidentsTerm: 31,
    lastOfstedNote: 'Strong sixth form results. Progress 8 improving. SEND EHCP demand increasing.',
    budgetSpend: { teaching: 62, support: 21, premises: 10, other: 7 },
    icfp: { ptRatio: 17.2, staffCosts: 76.2, hoursDelivered: 93.8 },
  },
]

// ─── MINI HELPERS ─────────────────────────────────────────────────────────────
function RagBadge({ r, label }: { r: RAG; label?: string }) {
  const s = rag(r)
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
      {label ?? { green:'✓ Good', amber:'⚠ Amber', red:'✗ Red', blue:'● Info' }[r]}
    </span>
  )
}

function StatCard({ label, value, sub, color='#0D9488', r, small=false }: {
  label:string; value:string; sub?:string; color?:string; r?:RAG; small?:boolean
}) {
  const border = r ? `1px solid ${rag(r).border}` : '1px solid #1F2937'
  const bg = r === 'red' ? 'rgba(239,68,68,0.05)' : '#111318'
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: bg, border }}>
      <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
      <p className={`font-black mt-0.5 ${small ? 'text-lg' : 'text-2xl'}`} style={{ color: r ? rag(r).color : color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{title}</h3>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function TableHdr({ cols }: { cols: string[] }) {
  return (
    <div className="grid px-4 py-2" style={{
      gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
      backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937'
    }}>
      {cols.map(c => <p key={c} className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>{c}</p>)}
    </div>
  )
}

function AlertRow({ level, text, school, action }: { level: RAG; text: string; school?: string; action?: string }) {
  const s = rag(level)
  return (
    <div className="flex items-start gap-3 rounded-lg p-3 mb-2"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: s.color }} />
      <div className="flex-1">
        <p className="text-xs font-medium" style={{ color: s.color }}>{school && <span className="mr-1 font-bold">[{school}]</span>}{text}</p>
        {action && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{action}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ value, color='#0D9488', max=100 }: { value:number; color?:string; max?:number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min((value/max)*100,100)}%`, backgroundColor: color }} />
    </div>
  )
}

function TabBtn({ active, label, onClick, badge }: { active:boolean; label:string; onClick:()=>void; badge?:number }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all"
      style={{
        borderBottom: active ? '2px solid #0D9488' : '2px solid transparent',
        color: active ? '#0D9488' : '#9CA3AF',
        backgroundColor: active ? 'rgba(13,148,136,0.08)' : 'transparent',
      }}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
          style={{ backgroundColor: '#EF4444', color: '#F9FAFB', fontSize: 9 }}>{badge}</span>
      )}
    </button>
  )
}

// ─── TAB: EXECUTIVE OVERVIEW ─────────────────────────────────────────────────
function ExecOverview() {
  const redAlerts = SCHOOLS.filter(s => s.ragOverall === 'red').length
  const amberAlerts = SCHOOLS.filter(s => s.ragOverall === 'amber').length
  const avgAtt = (SCHOOLS.reduce((a,s)=>a+s.attendance,0)/SCHOOLS.length).toFixed(1)
  const totalBudget = SCHOOLS.reduce((a,s)=>a+s.budget,0)
  const totalVariance = SCHOOLS.reduce((a,s)=>a+s.budgetVariance,0)
  const totalCP = SCHOOLS.reduce((a,s)=>a+s.cpCases,0)
  const totalEHCP = SCHOOLS.reduce((a,s)=>a+s.ehcps,0)
  const totalVac = SCHOOLS.reduce((a,s)=>a+s.vacancies,0)

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* AI Summary */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.1)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
          <Zap size={13} style={{ color: '#0D9488' }} />
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>CEO Intelligence Summary</p>
          <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated today · {new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div className="p-4 flex flex-col gap-2" style={{ backgroundColor: '#07080F' }}>
          {[
            { r:'red' as RAG, t:'Riverside Academy requires urgent attention — RI Ofsted grade, 19.4% PA rate, 4 vacancies, SCR non-compliant, 3 active CP cases and £38k budget deficit. Director of Education visit recommended this week.' },
            { r:'amber' as RAG, t:"Highfield Junior is trending amber — attendance has dropped 2.1pp this half term, 3 vacancies unfilled and PA rate at 15.8%. Risk of Ofsted reinspection (last Good: Feb 2022 — now overdue)." },
            { r:'amber' as RAG, t:"St. Clement's asbestos management plan overdue — statutory ATH 2025 requirement. Estates Director must resolve within 14 days. Red estates RAG." },
            { r:'amber' as RAG, t:"Trust-wide PA rate is 12.3% — above the national 12% threshold. Riverside (19.4%) and Highfield (15.8%) are driving this. EWO engagement required at both schools." },
            { r:'green' as RAG, t:"Meadowbrook Primary continues as the trust's outstanding school. Recommend using as a CPD and curriculum hub — deploy Meadowbrook leads to support Riverside and Highfield." },
            { r:'green' as RAG, t:"Trust total budget surplus: £39,200. The Valley Academy and Meadowbrook are in surplus; Riverside and Highfield carrying deficits. CFO to review Riverside position at next Finance Committee." },
          ].map((a,i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: rag(a.r).bg, color: rag(a.r).color }}>{i+1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{a.t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Schools" value="6" sub="4 Primary · 1 Secondary" color="#F9FAFB" />
        <StatCard label="Total Pupils" value={TRUST.pupils.toLocaleString()} sub="vs 2,875 NOR" color="#0D9488" />
        <StatCard label="Avg Attendance" value={`${avgAtt}%`} sub="National: 94.5%" r={parseFloat(avgAtt)>=94.5?'green':'amber'} />
        <StatCard label="Schools RED" value={String(redAlerts)} sub="Require urgent action" r={redAlerts>0?'red':'green'} />
        <StatCard label="Schools AMBER" value={String(amberAlerts)} sub="Monitoring required" r={amberAlerts>0?'amber':'green'} />
        <StatCard label="Total EHCP" value={String(totalEHCP)} sub="Trust-wide register" color="#8B5CF6" />
        <StatCard label="Active CP Cases" value={String(totalCP)} sub="Across all schools" r={totalCP>0?'amber':'green'} />
      </div>

      {/* School RAG table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>School Performance at a Glance</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Click any row to drill down</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 70px 80px 80px 80px 80px 80px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
              {['School','Overall','Attend.','Attain.','SEND','Finance','Safeguard','Ofsted','HR','Estates'].map(h => (
                <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
              ))}
            </div>
            {SCHOOLS.map((s, i) => (
              <div key={s.id} className="grid px-4 py-3 items-center cursor-pointer transition-colors"
                style={{ gridTemplateColumns: '2fr 70px 80px 80px 80px 80px 80px 80px 80px 80px',
                  borderBottom: '1px solid #1F2937',
                  backgroundColor: s.ragOverall === 'red' ? 'rgba(239,68,68,0.05)' : i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{s.phase} · {s.pupils} pupils · {s.ht}</p>
                </div>
                {[s.ragOverall, s.attendanceRag, s.attainmentRag, s.sendRag, s.budgetRag, s.safeguardingRag, s.ofstedRag, s.hrRag, s.estatesRag].map((r,j) => (
                  <div key={j}>
                    <span className="inline-flex w-3 h-3 rounded-full" style={{ backgroundColor: rag(r).color }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority actions */}
      <div>
        <SectionTitle title="Priority Actions for CEO This Week" />
        <AlertRow level="red" text="SCR non-compliant — Riverside Academy. 2 staff missing DBS clearance." school="Riverside" action="Action today — KCSIE statutory breach. Contact SBM immediately." />
        <AlertRow level="red" text="Asbestos management plan overdue — ATH 2025 legal requirement." school="St. Clement's" action="Estates Director to arrange survey and plan by 28 Mar 2026." />
        <AlertRow level="red" text="Ofsted RI school — support package deployment needed." school="Riverside" action="Director of Education to visit Thursday. School Improvement plan review." />
        <AlertRow level="amber" text="Budget deficit £38k — rising staff costs. Q3 management accounts review." school="Riverside" action="CFO to present options at Finance Committee 4 Apr." />
        <AlertRow level="amber" text="4 teaching vacancies unfilled — impact on curriculum delivery." school="Riverside" action="HR Director to escalate to supply/agency and review JD." />
        <AlertRow level="amber" text="Highfield attendance trending down — 2.1pp drop in 6 weeks." school="Highfield" action="HT meeting this week. EWO referral for top 10 PA families." />
        <AlertRow level="amber" text="EHCP annual review overdue — 3 pupils at Riverside." school="Riverside" action="SENCO to submit to LA within 5 working days — statutory breach risk." />
      </div>

      {/* Finance snapshot */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Total Trust Budget</p>
          <p className="text-2xl font-black" style={{ color: '#F9FAFB' }}>£{(totalBudget/1000000).toFixed(1)}m</p>
          <p className="text-xs mt-1" style={{ color: totalVariance>=0?'#22C55E':'#EF4444' }}>
            {totalVariance>=0?'▲ Surplus':'▼ Deficit'} £{Math.abs(totalVariance).toLocaleString()} YTD
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Trust-Wide Vacancies</p>
          <p className="text-2xl font-black" style={{ color: totalVac > 5 ? '#EF4444' : '#F59E0B' }}>{totalVac}</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Teaching posts unfilled across trust</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>ATH 2025 Compliance</p>
          <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>84%</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>2 items outstanding — see Compliance tab</p>
        </div>
      </div>
    </div>
  )
}

// ─── TAB: EDUCATION & OUTCOMES ─────────────────────────────────────────────────
function EducationOutcomes() {
  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Attendance cross-school */}
      <div>
        <SectionTitle title="Attendance — Cross-School Comparison" sub="Current academic year · National average 94.5%" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          {SCHOOLS.map((s, i) => (
            <div key={s.id} className="px-5 py-3" style={{ borderBottom: i<5?'1px solid #1F2937':'none', backgroundColor: i%2===0?'#111318':'#0D0E14' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold w-48" style={{ color: '#F9FAFB' }}>{s.name}</p>
                  <RagBadge r={s.attendanceRag} label={`${s.attendance}%`} />
                  {trendIcon(s.attendanceTrend)}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: '#6B7280' }}>
                  <span>PA: <span style={{ color: s.paRag==='red'?'#EF4444':s.paRag==='amber'?'#F59E0B':'#22C55E', fontWeight:'bold' }}>{s.paRate}%</span></span>
                  <span>Excl: {s.exclusions}</span>
                  <span>{s.pupils} pupils</span>
                </div>
              </div>
              <ProgressBar value={s.attendance} max={100} color={s.attendanceRag==='green'?'#22C55E':s.attendanceRag==='amber'?'#F59E0B':'#EF4444'} />
            </div>
          ))}
        </div>
      </div>

      {/* KS2 attainment */}
      <div>
        <SectionTitle title="KS2 Attainment — % Meeting Expected Standard" sub="Latest data · National average 60% combined · Primary schools only" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 80px 80px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','Combined','Reading','Writing','Maths','vs National'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.filter(s=>s.phase==='Primary').map((s,i) => {
            const r = s.attainmentRag
            const vs = s.attainmentKS2 - 60
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 80px 80px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <RagBadge r={r} label={`${s.attainmentKS2}%`} />
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.attainmentKS2+4}%</p>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.attainmentKS2-3}%</p>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.attainmentKS2+1}%</p>
                <p className="text-xs font-bold" style={{ color: vs>=0?'#22C55E':'#EF4444' }}>{vs>=0?'+':''}{vs}pp</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pupil Premium gap */}
      <div>
        <SectionTitle title="Pupil Premium Attainment Gap" sub="Negative = PP pupils below non-PP. Target: close to 0" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SCHOOLS.filter(s=>s.phase==='Primary').map(s => (
            <div key={s.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${rag(s.ppRag).border}` }}>
              <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>{s.name}</p>
              <p className="text-2xl font-black" style={{ color: rag(s.ppRag).color }}>{s.ppGap}pp</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>PP: {s.fsm.toFixed(1)}% of roll · {s.pupils} pupils</p>
              <ProgressBar value={Math.abs(s.ppGap)*10} color={rag(s.ppRag).color} max={100} />
            </div>
          ))}
        </div>
      </div>

      {/* Vulnerable groups */}
      <div>
        <SectionTitle title="Vulnerable Groups — Trust-Wide" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 80px 80px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','FSM %','EAL %','SEND %','LAC','PP Gap'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => (
            <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 80px 80px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:i%2===0?'#111318':'transparent' }}>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
              <p className="text-xs font-bold" style={{ color: s.fsm>30?'#EF4444':s.fsm>20?'#F59E0B':'#22C55E' }}>{s.fsm}%</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.eal}%</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.send}%</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.lac}</p>
              <p className="text-xs font-bold" style={{ color: Math.abs(s.ppGap)>6?'#EF4444':Math.abs(s.ppGap)>3?'#F59E0B':'#22C55E' }}>{s.ppGap}pp</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Valley - P8 */}
      <div>
        <SectionTitle title="The Valley Academy — Secondary KPIs" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Progress 8', value: '+0.18', color: '#22C55E', sub: 'Above national avg' },
            { label: 'Attainment 8', value: '48.4', color: '#0D9488', sub: 'National: 46.1' },
            { label: 'EBacc entry', value: '38%', color: '#F59E0B', sub: 'Below 40% target' },
            { label: '5+ GCSEs A*-C', value: '68%', color: '#22C55E', sub: 'Including Eng & Maths' },
            { label: 'Sixth Form retention', value: '87%', color: '#22C55E', sub: 'Yr 12 → Yr 13' },
          ].map(s => <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} small />)}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: SEND & INCLUSION ────────────────────────────────────────────────────
function SendInclusion() {
  const totalEHCP = SCHOOLS.reduce((a,s)=>a+s.ehcps,0)
  const totalISP = SCHOOLS.reduce((a,s)=>a+s.isp,0)
  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total EHCPs" value={String(totalEHCP)} sub="Trust-wide register" color="#8B5CF6" />
        <StatCard label="ISPs Active" value={String(totalISP)} sub="SEN Support level" color="#0D9488" />
        <StatCard label="Overdue Reviews" value="4" sub="Statutory breach risk" r="red" />
        <StatCard label="White Paper Phase 1" value="67%" sub="Compliance across trust" r="amber" />
      </div>

      {/* EHCP pipeline per school */}
      <div>
        <SectionTitle title="EHCP Register & Review Status" sub="Annual reviews — statutory 12-month deadline" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 60px 60px 80px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','EHCPs','ISP','Reviews due','Overdue','EHCP %','Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const overdue = s.id===2?3:s.id===5?1:0
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 60px 60px 80px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{s.ehcps}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{s.isp}</p>
                <p className="text-sm" style={{ color: '#F59E0B' }}>{Math.ceil(s.ehcps*0.3)} this term</p>
                <p className="text-sm font-bold" style={{ color: overdue>0?'#EF4444':'#22C55E' }}>{overdue}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{s.send}%</p>
                <RagBadge r={s.sendRag} />
              </div>
            )
          })}
        </div>
      </div>

      {/* White Paper compliance */}
      <div>
        <SectionTitle title="SEND White Paper 2026 — Compliance Tracker" sub="Every Child Achieving and Thriving · ISPs statutory Sept 2029" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { item: 'Inclusion Strategy drafted and published', phase: 'Phase 1', schools: [true,false,true,true,false,true], req: 'Required' },
            { item: 'ISP templates adopted trust-wide', phase: 'Phase 1', schools: [true,false,true,true,true,true], req: 'Required' },
            { item: 'Three-tier model documented (Universal/Targeted/Specialist)', phase: 'Phase 1', schools: [true,false,false,true,false,true], req: 'Required' },
            { item: 'SENCO holds National Award for SEN Coordination', phase: 'Phase 1', schools: [true,true,true,true,false,true], req: 'Required' },
            { item: 'External agency tracker active (CAMHS/EP/SALT)', phase: 'Phase 2', schools: [true,true,true,false,true,true], req: 'Should' },
            { item: 'TA deployment mapped to individual ISPs', phase: 'Phase 2', schools: [false,false,true,true,false,true], req: 'Should' },
          ].map(item => {
            const done = item.schools.filter(Boolean).length
            const pct = Math.round((done/6)*100)
            return (
              <div key={item.item} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-medium flex-1" style={{ color: '#D1D5DB' }}>{item.item}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ backgroundColor: item.phase==='Phase 1'?'rgba(139,92,246,0.15)':'rgba(13,148,136,0.12)', color: item.phase==='Phase 1'?'#A78BFA':'#0D9488' }}>{item.phase}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.schools.map((s,i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span style={{ color: s?'#22C55E':'#EF4444', fontSize:'0.6rem' }}>{s?'✓':'✗'}</span>
                    </div>
                  ))}
                  <p className="text-xs ml-auto font-bold" style={{ color: pct>=80?'#22C55E':pct>=50?'#F59E0B':'#EF4444' }}>{pct}%</p>
                </div>
                <ProgressBar value={pct} color={pct>=80?'#22C55E':pct>=50?'#F59E0B':'#EF4444'} />
              </div>
            )
          })}
        </div>
      </div>

      {/* SEND needs breakdown */}
      <div>
        <SectionTitle title="Primary SEND Needs — Trust Profile" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'SEMH', value: '28%', sub: 'Social, Emotional & Mental Health', color: '#EF4444' },
            { label: 'SpLD', value: '24%', sub: 'Dyslexia, Dyscalculia, Dyspraxia', color: '#F59E0B' },
            { label: 'ASD', value: '19%', sub: 'Autism Spectrum', color: '#8B5CF6' },
            { label: 'SLCN', value: '17%', sub: 'Speech, Language & Communication', color: '#0D9488' },
            { label: 'ADHD', value: '7%', sub: 'Attention Deficit', color: '#F97316' },
            { label: 'HI/VI', value: '3%', sub: 'Hearing / Visual Impairment', color: '#06B6D4' },
            { label: 'Physical', value: '1%', sub: 'Physical Disability', color: '#22C55E' },
            { label: 'Other', value: '1%', sub: 'Other / Complex', color: '#6B7280' },
          ].map(n => (
            <div key={n.label} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-lg font-black" style={{ color: n.color }}>{n.value}</p>
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{n.label}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{n.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: SAFEGUARDING ─────────────────────────────────────────────────────────
function Safeguarding() {
  const totalCP = SCHOOLS.reduce((a,s)=>a+s.cpCases,0)
  const totalCases = SCHOOLS.reduce((a,s)=>a+s.safeguardingCases,0)
  const totalLAC = SCHOOLS.reduce((a,s)=>a+s.lac,0)

  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active CP Cases" value={String(totalCP)} sub="Child Protection across trust" r="red" />
        <StatCard label="All SG Concerns" value={String(totalCases)} sub="Open cases this term" r="amber" />
        <StatCard label="LAC Children" value={String(totalLAC)} sub="Looked After" color="#8B5CF6" />
        <StatCard label="SCR Compliant" value="5/6" sub="Riverside non-compliant" r="red" />
      </div>

      {/* Per school dashboard */}
      <div>
        <SectionTitle title="Safeguarding — Per School" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 60px 60px 60px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','CP','CiN','LAC','DSL trained','SCR ok','Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const cin = Math.max(0, s.safeguardingCases - s.cpCases - 1)
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 60px 60px 60px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:s.cpCases>0?'rgba(239,68,68,0.04)':i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-sm font-bold" style={{ color: s.cpCases>0?'#EF4444':'#22C55E' }}>{s.cpCases}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{cin}</p>
                <p className="text-sm" style={{ color: '#8B5CF6' }}>{s.lac}</p>
                <span style={{ color: s.dslCompliant?'#22C55E':'#EF4444', fontSize:'1rem' }}>{s.dslCompliant?'✓':'✗'}</span>
                <span style={{ color: s.scrCompliant?'#22C55E':'#EF4444', fontSize:'1rem' }}>{s.scrCompliant?'✓':'✗'}</span>
                <RagBadge r={s.safeguardingRag} />
              </div>
            )
          })}
        </div>
      </div>

      {/* KCSIE 2024 compliance */}
      <div>
        <SectionTitle title="KCSIE 2024 — Trust-Wide Compliance" sub="Keeping Children Safe in Education · Statutory requirements" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { item: 'DSL trained (2-yearly renewal)', done:[true,true,true,true,true,true] },
            { item: 'All staff annual safeguarding training', done:[true,false,true,true,true,true] },
            { item: 'Single Central Record — all fields complete', done:[true,false,true,true,true,true] },
            { item: 'Online safety policy reviewed (DSL statutory duty)', done:[true,false,true,false,true,true] },
            { item: 'Filtering and monitoring annual review completed', done:[true,false,true,true,false,true] },
            { item: 'CPOMS / safeguarding record system active', done:[true,true,true,true,true,true] },
            { item: 'Part 1 KCSIE given to all staff on appointment', done:[true,true,true,true,true,true] },
            { item: 'Records transfer protocol for leavers active', done:[true,false,true,false,true,true] },
            { item: 'Prevent duty training — all staff current', done:[true,false,false,true,false,true] },
            { item: 'Safer recruitment training — all interviewers', done:[true,false,true,true,true,true] },
          ].map(item => {
            const done = item.done.filter(Boolean).length
            return (
              <div key={item.item} className="flex items-center justify-between rounded-lg px-4 py-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs flex-1 mr-3" style={{ color: done===6?'#D1D5DB':'#9CA3AF' }}>{item.item}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {item.done.map((d,i) => (
                    <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: d?'#22C55E':'#EF4444' }} />
                  ))}
                  <p className="text-xs ml-1 font-bold" style={{ color: done===6?'#22C55E':done>=4?'#F59E0B':'#EF4444' }}>{done}/6</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Circles left to right: Oakridge · Riverside · Meadowbrook · St. Clement's · Highfield · Valley</p>
      </div>

      {/* Exclusions */}
      <div>
        <SectionTitle title="Exclusions & Incidents — This Term" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SCHOOLS.map(s => (
            <div key={s.id} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.name.split(' ')[0]}</p>
              <p className="text-xl font-black" style={{ color: s.exclusions>5?'#EF4444':s.exclusions>0?'#F59E0B':'#22C55E' }}>{s.exclusions}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>excl.</p>
              <p className="text-sm font-bold mt-1" style={{ color: '#9CA3AF' }}>{s.incidentsTerm}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>incidents</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: FINANCE & BUDGET ────────────────────────────────────────────────────
function FinanceBudget() {
  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Trust budget summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Trust Budget" value="£14.3m" sub="2025/26 academic year" color="#F9FAFB" />
        <StatCard label="YTD Variance" value="+£39.2k" sub="Surplus position" r="green" />
        <StatCard label="Schools in Deficit" value="2" sub="Riverside & Highfield" r="red" />
        <StatCard label="Budget Forecast Return" value="Aug 2026" sub="Submitted on time" r="green" />
      </div>

      {/* Per school budget */}
      <div>
        <SectionTitle title="School-by-School Budget Position" sub="YTD variance · Green = surplus · Red = deficit" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 100px 100px 100px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','Budget','Variance','Per Pupil','Staff %','Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const perPupil = Math.round(s.budget / s.pupils)
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 100px 100px 100px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:s.budgetVariance<0?'rgba(239,68,68,0.04)':i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>£{(s.budget/1000).toFixed(0)}k</p>
                <p className="text-sm font-bold" style={{ color: s.budgetVariance>=0?'#22C55E':'#EF4444' }}>
                  {s.budgetVariance>=0?'+':''}£{(s.budgetVariance/1000).toFixed(1)}k
                </p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>£{perPupil.toLocaleString()}</p>
                <p className="text-sm" style={{ color: s.icfp.staffCosts>78?'#EF4444':s.icfp.staffCosts>75?'#F59E0B':'#22C55E' }}>{s.icfp.staffCosts}%</p>
                <RagBadge r={s.budgetRag} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ICFP */}
      <div>
        <SectionTitle title="Integrated Curriculum & Financial Planning (ICFP)" sub="ATH 2025 recommended · DfE benchmark data" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 100px 100px 100px 100px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','P:T Ratio','Staff Costs %','Hours Delivered %','ICFP Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const ic = s.icfp
            const ptOk = s.phase==='Secondary' ? ic.ptRatio <= 19 : ic.ptRatio <= 23
            const scOk = ic.staffCosts <= 76
            const hdOk = ic.hoursDelivered >= 95
            const status: RAG = (ptOk && scOk && hdOk) ? 'green' : (!ptOk || !scOk) ? 'red' : 'amber'
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 100px 100px 100px 100px', borderBottom:'1px solid #1F2937', backgroundColor:i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-sm font-bold" style={{ color: ptOk?'#22C55E':'#EF4444' }}>{ic.ptRatio}:1</p>
                <p className="text-sm font-bold" style={{ color: scOk?'#22C55E':'#EF4444' }}>{ic.staffCosts}%</p>
                <p className="text-sm font-bold" style={{ color: hdOk?'#22C55E':'#F59E0B' }}>{ic.hoursDelivered}%</p>
                <RagBadge r={status} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Spend breakdown */}
      <div>
        <SectionTitle title="Budget Spend Breakdown — % of Total" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SCHOOLS.filter((_,i)=>i<3).map(s => (
            <div key={s.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#F9FAFB' }}>{s.name}</p>
              {Object.entries(s.budgetSpend).map(([k,v]) => (
                <div key={k} className="mb-2">
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                    <span className="capitalize">{k}</span><span>{v}%</span>
                  </div>
                  <ProgressBar value={v} color={k==='teaching'?'#0D9488':k==='support'?'#8B5CF6':k==='premises'?'#F59E0B':'#6B7280'} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Finance compliance */}
      <div>
        <SectionTitle title="Financial Compliance — ATH 2025" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { item: 'Budget Forecast Return submitted on time', status: 'green' as RAG },
            { item: 'Audited annual accounts filed — Companies House', status: 'green' as RAG },
            { item: 'Internal scrutiny completed (required for >£50m income)', status: 'green' as RAG },
            { item: 'Related party transaction register current', status: 'green' as RAG },
            { item: 'Executive pay policy — transparent, proportionate, defensible', status: 'amber' as RAG },
            { item: 'Procurement Act 2023 compliance review', status: 'amber' as RAG },
            { item: 'Deficit budget notification to DfE (if applicable)', status: 'green' as RAG },
            { item: 'Reserves policy reviewed and aligned to strategy', status: 'green' as RAG },
          ].map(item => (
            <div key={item.item} className="flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ backgroundColor: '#111318', border: `1px solid ${rag(item.status).border}` }}>
              {item.status==='green' ? <CheckCircle size={13} style={{color:'#22C55E',flexShrink:0}} /> :
               item.status==='red' ? <XCircle size={13} style={{color:'#EF4444',flexShrink:0}} /> :
               <AlertCircle size={13} style={{color:'#F59E0B',flexShrink:0}} />}
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{item.item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: HR & WORKFORCE ──────────────────────────────────────────────────────
function HRWorkforce() {
  const totalVac = SCHOOLS.reduce((a,s)=>a+s.vacancies,0)
  const avgAbsence = (SCHOOLS.reduce((a,s)=>a+s.staffAbsence,0)/SCHOOLS.length).toFixed(1)

  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Staff" value={String(TRUST.staff)} sub="Teaching + support" color="#F9FAFB" />
        <StatCard label="Teaching Vacancies" value={String(totalVac)} sub="Trust-wide" r={totalVac>5?'red':'amber'} />
        <StatCard label="Avg Staff Absence" value={`${avgAbsence}%`} sub="National avg: 5.0%" r={parseFloat(avgAbsence)>5.5?'red':'amber'} />
        <StatCard label="SCR Compliance" value="5/6" sub="Riverside outstanding" r="red" />
      </div>

      {/* Vacancies detail */}
      <div>
        <SectionTitle title="Vacancies & Staffing Pressures" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 80px 80px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','Vacancies','Absence %','Supply cost','SCR ok','Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const supplyCost = s.vacancies * 220 * 20
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 80px 80px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:s.hrRag==='red'?'rgba(239,68,68,0.04)':i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-sm font-bold" style={{ color: s.vacancies>3?'#EF4444':s.vacancies>0?'#F59E0B':'#22C55E' }}>{s.vacancies}</p>
                <p className="text-sm font-bold" style={{ color: s.staffAbsence>6?'#EF4444':s.staffAbsence>4.5?'#F59E0B':'#22C55E' }}>{s.staffAbsence}%</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>£{(supplyCost/1000).toFixed(1)}k</p>
                <span style={{ color: s.scrCompliant?'#22C55E':'#EF4444' }}>{s.scrCompliant?'✓':'✗'}</span>
                <RagBadge r={s.hrRag} />
              </div>
            )
          })}
        </div>
      </div>

      {/* CPD & training */}
      <div>
        <SectionTitle title="CPD & Statutory Training Compliance" sub="Trust-wide mandatory training matrix" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { training: 'Safeguarding (KCSIE) — annual for all staff', pct: 81, urgent: false },
            { training: 'Prevent WRAP training', pct: 68, urgent: true },
            { training: 'First Aid — at least 1 trained per class', pct: 92, urgent: false },
            { training: 'Fire safety annual refresher', pct: 88, urgent: false },
            { training: 'DSL training — 2-yearly renewal', pct: 100, urgent: false },
            { training: 'SENCO National Award', pct: 83, urgent: false },
            { training: 'Food hygiene (wraparound staff)', pct: 74, urgent: false },
            { training: 'Safer recruitment (all interviewers)', pct: 79, urgent: false },
          ].map(t => {
            const color = t.pct>=90?'#22C55E':t.pct>=75?'#F59E0B':'#EF4444'
            return (
              <div key={t.training} className="rounded-lg px-4 py-3" style={{ backgroundColor: '#111318', border: `1px solid ${t.urgent?'rgba(239,68,68,0.3)':'#1F2937'}` }}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: '#D1D5DB' }}>{t.training}</span>
                  <span className="font-bold" style={{ color }}>{t.pct}%</span>
                </div>
                <ProgressBar value={t.pct} color={color} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Wellbeing */}
      <div>
        <SectionTitle title="Staff Wellbeing & Retention" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Wellbeing Survey Score" value="6.8/10" sub="vs 7.1 last term" r="amber" small />
          <StatCard label="Staff Turnover Rate" value="14.2%" sub="Sector avg: 11.4%" r="amber" small />
          <StatCard label="ECTs in trust" value="18" sub="All in induction" color="#0D9488" small />
          <StatCard label="ITT partnerships" value="2" sub="Active routes" color="#8B5CF6" small />
        </div>
      </div>
    </div>
  )
}

// ─── TAB: ESTATES & COMPLIANCE ────────────────────────────────────────────────
function EstatesCompliance() {
  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Condition Grade A" value="1" sub="Meadowbrook only" color="#22C55E" />
        <StatCard label="Condition Grade B" value="4" sub="Satisfactory" color="#F59E0B" />
        <StatCard label="Condition Grade C" value="1" sub="Riverside — attention needed" r="red" />
        <StatCard label="Asbestos Compliant" value="5/6" sub="St. Clement's outstanding" r="red" />
      </div>

      {/* Estates per school */}
      <div>
        <SectionTitle title="Estates Condition & Compliance" sub="ATH 2025 · School Estate Management Standards · H&S at Work Act 1974" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 60px 80px 80px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','Condition','Asbestos','H&S Audit','Fire Safety','Capital bid','Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const condColor = s.estatesCondition==='A'?'#22C55E':s.estatesCondition==='B'?'#F59E0B':'#EF4444'
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 60px 80px 80px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:s.estatesRag==='red'?'rgba(239,68,68,0.04)':i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-lg font-black" style={{ color: condColor }}>{s.estatesCondition}</p>
                <span style={{ color: s.asbestosManaged?'#22C55E':'#EF4444', fontSize:'1rem' }}>{s.asbestosManaged?'✓':'✗ DUE'}</span>
                <span style={{ color:'#22C55E', fontSize:'1rem' }}>✓</span>
                <span style={{ color:'#22C55E', fontSize:'1rem' }}>✓</span>
                <span className="text-xs" style={{ color: s.id===2?'#0D9488':'#6B7280' }}>{s.id===2?'Submitted':'None'}</span>
                <RagBadge r={s.estatesRag} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ATH 2025 Digital Standards */}
      <div>
        <SectionTitle title="ATH 2025 — 6 Mandatory Digital Standards (Target: 2030)" sub="Only 16% of schools currently meet all six. Trust must work towards these." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { std: 'Broadband Internet', desc: '1Gbps+ connectivity at each school', schools: [true,false,true,true,false,true], priority:'High' },
            { std: 'Network Switching', desc: 'Managed, monitored network switches', schools: [true,false,true,true,true,true], priority:'High' },
            { std: 'Wireless Network', desc: 'Reliable wifi coverage across site', schools: [true,true,true,false,true,true], priority:'Medium' },
            { std: 'Cyber Security', desc: 'MFA, endpoint protection, incident response (no ransomware payments)', schools: [true,false,true,true,false,true], priority:'Critical' },
            { std: 'Filtering & Monitoring', desc: 'Appropriate content filtering, DSL monitoring (KCSIE 2024 statutory)', schools: [true,true,true,true,true,true], priority:'High' },
            { std: 'Digital Leadership & Governance', desc: 'Named digital lead, digital strategy, board oversight', schools: [true,false,false,false,false,true], priority:'Medium' },
          ].map(item => {
            const done = item.schools.filter(Boolean).length
            const color = done===6?'#22C55E':done>=4?'#F59E0B':'#EF4444'
            return (
              <div key={item.std} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{item.std}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{item.desc}</p>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold ml-2 flex-shrink-0" style={{ backgroundColor: item.priority==='Critical'?'rgba(239,68,68,0.15)':item.priority==='High'?'rgba(245,158,11,0.12)':'rgba(13,148,136,0.12)', color: item.priority==='Critical'?'#EF4444':item.priority==='High'?'#F59E0B':'#0D9488' }}>{item.priority}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {item.schools.map((s,i) => (
                    <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: s?'#22C55E':'#EF4444' }} />
                  ))}
                  <p className="text-xs ml-auto font-bold" style={{ color }}>{done}/6 schools</p>
                </div>
                <ProgressBar value={(done/6)*100} color={color} />
              </div>
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Circles: Oakridge · Riverside · Meadowbrook · St. Clement's · Highfield · Valley</p>
      </div>
    </div>
  )
}

// ─── TAB: OFSTED READINESS ────────────────────────────────────────────────────
function OfstedReadiness() {
  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Last inspection & risk */}
      <div>
        <SectionTitle title="Inspection History & Reinspection Risk" sub="Ofsted 2025 framework · Report cards · 6 evaluation areas · 5-point scale" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 100px 80px 100px 80px 100px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['School','Grade','Date','Years since','Risk','Next expected'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SCHOOLS.map((s,i) => {
            const year = parseInt(s.ofstedDate.split(' ')[1])
            const yearsSince = 2026 - year
            const risk: RAG = s.ofstedGrade==='Requires Improvement'?'red':yearsSince>=4?'amber':s.ofstedGrade==='Outstanding'?'blue':'green'
            const next = s.ofstedGrade==='Requires Improvement'?'Overdue':s.ofstedGrade==='Outstanding'?`${2026+2} est`:`${year+4} est`
            return (
              <div key={s.id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns:'2fr 100px 80px 100px 80px 100px', borderBottom:'1px solid #1F2937', backgroundColor:risk==='red'?'rgba(239,68,68,0.04)':i%2===0?'#111318':'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-xs font-bold" style={{ color: s.ofstedGrade==='Outstanding'?'#22C55E':s.ofstedGrade==='Good'?'#0D9488':s.ofstedGrade==='Requires Improvement'?'#EF4444':'#F59E0B' }}>{s.ofstedGrade}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.ofstedDate}</p>
                <p className="text-sm font-bold" style={{ color: yearsSince>=4?'#EF4444':yearsSince>=3?'#F59E0B':'#22C55E' }}>{yearsSince} yr{yearsSince!==1?'s':''}</p>
                <RagBadge r={risk} label={risk==='red'?'High':risk==='amber'?'Medium':risk==='blue'?'Low':'Low'} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{next}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ofsted 2025 framework readiness */}
      <div>
        <SectionTitle title="Ofsted 2025 — 6 Evaluation Areas Readiness" sub="New report cards · No single overall grade · 5-point scale per area" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { area: 'Quality of Education', icon: '📚', scores: [4,2,5,4,3,4], desc: 'Curriculum intent, implementation, impact' },
            { area: 'Behaviour & Attitudes', icon: '🌟', scores: [4,2,5,4,3,4], desc: 'Conduct, attendance, attitudes to learning' },
            { area: 'Personal Development', icon: '💡', scores: [4,3,5,4,3,4], desc: 'Character, enrichment, wider opportunities' },
            { area: 'Leadership & Management', icon: '🏛️', scores: [4,2,5,4,3,4], desc: 'Vision, strategy, governance, staff wellbeing' },
            { area: 'Inclusion', icon: '🧩', scores: [3,2,4,4,3,4], desc: 'SEND, disadvantaged pupils, EAL, vulnerable groups' },
            { area: 'Safeguarding', icon: '🛡️', scores: [4,3,5,4,4,4], desc: 'Culture, processes, records, training' },
          ].map(area => {
            const labels = ['1-Unsat','2-RI','3-Dev','4-Good','5-Outst']
            const avg = (area.scores.reduce((a,b)=>a+b,0)/area.scores.length).toFixed(1)
            return (
              <div key={area.area} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{area.icon} {area.area}</p>
                  <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: parseFloat(avg)>=4?'rgba(34,197,94,0.12)':parseFloat(avg)>=3?'rgba(13,148,136,0.12)':'rgba(239,68,68,0.12)', color: parseFloat(avg)>=4?'#22C55E':parseFloat(avg)>=3?'#0D9488':'#EF4444' }}>Avg {avg}/5</span>
                </div>
                <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{area.desc}</p>
                <div className="flex items-end gap-2">
                  {SCHOOLS.map((s, i) => {
                    const score = area.scores[i]
                    const c = score>=4?'#22C55E':score>=3?'#F59E0B':'#EF4444'
                    return (
                      <div key={s.id} className="flex flex-col items-center flex-1">
                        <span className="text-xs font-bold mb-1" style={{ color: c }}>{score}</span>
                        <div className="w-full rounded-t" style={{ height: `${score * 8}px`, backgroundColor: c }} />
                        <span className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.name.split(' ')[0].slice(0,3)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: GOVERNANCE ──────────────────────────────────────────────────────────
function Governance() {
  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Board Meetings" value="3/3" sub="Minimum met (ATH 2025)" r="green" />
        <StatCard label="Trustee Vacancies" value="1" sub="Finance expertise needed" r="amber" />
        <StatCard label="Companies House" value="✓ Filed" sub="Annual return current" r="green" />
        <StatCard label="Scheme of Delegation" value="Reviewed" sub="Jun 2025 — current" r="green" />
      </div>

      {/* Board meetings */}
      <div>
        <SectionTitle title="Board & Committee Meetings — This Year" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { name: 'Full Board of Trustees', meetings: 4, required: 3, quorate: '4/4', next: '14 May 2026', status: 'green' as RAG },
            { name: 'Finance & Risk Committee', meetings: 4, required: 4, quorate: '4/4', next: '4 Apr 2026', status: 'green' as RAG },
            { name: 'Standards & Curriculum Committee', meetings: 3, required: 3, quorate: '3/3', next: '29 Apr 2026', status: 'green' as RAG },
            { name: 'Audit & Internal Scrutiny Committee', meetings: 2, required: 2, quorate: '2/2', next: '22 May 2026', status: 'green' as RAG },
            { name: 'People & HR Committee', meetings: 2, required: 2, quorate: '2/2', next: '8 May 2026', status: 'green' as RAG },
            { name: 'Remuneration Committee', meetings: 1, required: 1, quorate: '1/1', next: 'Jun 2026', status: 'amber' as RAG },
          ].map(m => (
            <div key={m.name} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{m.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{m.meetings}/{m.required} meetings · {m.quorate} quorate · Next: {m.next}</p>
              </div>
              <RagBadge r={m.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Trustee register */}
      <div>
        <SectionTitle title="Trustee Register" sub="ATH 2025 — GIAS must be kept up to date" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <div className="grid px-4 py-2" style={{ gridTemplateColumns: '2fr 100px 120px 80px 80px 80px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
            {['Trustee','Skills area','Term expires','DBS','Training','Status'].map(h => (
              <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {[
            { name: 'J. Armstrong (Chair)', skills: 'Governance / Law', expires: 'Jul 2027', dbs: true, training: true, status: 'green' as RAG },
            { name: 'M. Okafor', skills: 'Finance / Audit', expires: 'Nov 2026', dbs: true, training: true, status: 'green' as RAG },
            { name: 'Dr. S. Henley (CEO)', skills: 'Education / Executive', expires: 'n/a', dbs: true, training: true, status: 'green' as RAG },
            { name: 'F. Balogun', skills: 'HR / Employment', expires: 'Mar 2026', dbs: true, training: false, status: 'amber' as RAG },
            { name: 'T. Walsh (Co-opted)', skills: 'Education / Primary', expires: 'Sep 2027', dbs: true, training: true, status: 'green' as RAG },
            { name: 'VACANT', skills: 'Finance needed', expires: '—', dbs: false, training: false, status: 'red' as RAG },
          ].map((t,i) => (
            <div key={t.name} className="grid px-4 py-2.5 items-center" style={{ gridTemplateColumns:'2fr 100px 120px 80px 80px 80px', borderBottom:'1px solid #1F2937', backgroundColor:t.status==='red'?'rgba(239,68,68,0.04)':i%2===0?'#111318':'transparent' }}>
              <p className="text-sm font-medium" style={{ color: t.name==='VACANT'?'#EF4444':'#F9FAFB' }}>{t.name}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{t.skills}</p>
              <p className="text-xs" style={{ color: t.expires==='Mar 2026'?'#EF4444':'#9CA3AF' }}>{t.expires}</p>
              <span style={{ color: t.dbs?'#22C55E':'#EF4444' }}>{t.dbs?'✓':'—'}</span>
              <span style={{ color: t.training?'#22C55E':'#F59E0B' }}>{t.training?'✓':'Due'}</span>
              <RagBadge r={t.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Key compliance dates */}
      <div>
        <SectionTitle title="Key Governance & Compliance Dates" />
        <div className="flex flex-col gap-2">
          {[
            { date: 'Mar 2026', item: 'F. Balogun trustee term — renewal or replacement decision needed', r:'red' as RAG },
            { date: 'Apr 2026', item: 'Finance Committee — Riverside deficit position review', r:'amber' as RAG },
            { date: 'May 2026', item: 'Annual accounts preparation begins — audit engagement', r:'blue' as RAG },
            { date: 'Jun 2026', item: 'Remuneration Committee — executive pay review (ATH 2025: transparent, proportionate, defensible)', r:'amber' as RAG },
            { date: 'Jul 2026', item: 'Board strategy away day — school improvement priorities 2026/27', r:'blue' as RAG },
            { date: 'Aug 2026', item: 'Budget Forecast Return submission to DfE', r:'blue' as RAG },
            { date: 'Dec 2026', item: 'Audited annual accounts due — Companies House and DfE', r:'blue' as RAG },
          ].map(d => (
            <div key={d.item} className="flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ backgroundColor: '#111318', border: `1px solid ${rag(d.r).border}` }}>
              <span className="text-xs font-bold w-16 flex-shrink-0" style={{ color: rag(d.r).color }}>{d.date}</span>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{d.item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: SCHOOL IMPROVEMENT ──────────────────────────────────────────────────
function SchoolImprovement() {
  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Schools on SIP" value="6" sub="All schools — live plans" color="#F9FAFB" />
        <StatCard label="Avg SIP Progress" value="66%" sub="Trust-wide" r="amber" />
        <StatCard label="Improvement School" value="1" sub="Riverside — intensive support" r="red" />
        <StatCard label="Peer Partnerships" value="3" sub="Active inter-school support" color="#0D9488" />
      </div>

      {/* SIP progress per school */}
      <div>
        <SectionTitle title="School Improvement Plan Progress" sub="Live SIP targets · RAG rated against priorities" />
        {SCHOOLS.map(s => (
          <div key={s.id} className="rounded-xl p-4 mb-3" style={{ backgroundColor: '#111318', border: `1px solid ${rag(s.sipRag).border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{s.ht} · SIP {s.sip}% complete</p>
              </div>
              <RagBadge r={s.sipRag} label={`${s.sip}%`} />
            </div>
            <ProgressBar value={s.sip} color={rag(s.sipRag).color} />
            <p className="text-xs mt-2 italic" style={{ color: '#9CA3AF' }}>{s.lastOfstedNote}</p>
          </div>
        ))}
      </div>

      {/* Intervention school: Riverside */}
      <div>
        <SectionTitle title="Riverside Academy — Intensive Improvement Plan" sub="RI school · Director of Education deployment · Support package" />
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { priority: 'Attendance', action: 'EWO engaged for top 15 PA families. Daily register monitoring by HT.', owner: 'HT + EWO', due: 'Ongoing', rag: 'red' as RAG },
              { priority: 'SEND provision', action: '3 overdue EHCP reviews. SENCO from Meadowbrook deployed fortnightly.', owner: 'Trust SENCO Lead', due: 'Apr 2026', rag: 'red' as RAG },
              { priority: 'Teaching quality', action: 'Learning walks weekly by Dir. of Education. CPD programme launched.', owner: 'Dir. Education', due: 'May 2026', rag: 'amber' as RAG },
              { priority: 'Staffing stability', action: '4 vacancies. Interim teacher appointed for Y4. Recruitment live.', owner: 'HR Director', due: 'Apr 2026', rag: 'amber' as RAG },
              { priority: 'Budget deficit', action: 'CFO reviewing staffing model. Supply agency costs to be reduced.', owner: 'CFO', due: 'Apr 2026', rag: 'amber' as RAG },
              { priority: 'SCR compliance', action: '2 staff missing DBS. Admin team to resolve within 48 hours.', owner: 'SBM', due: 'URGENT', rag: 'red' as RAG },
            ].map(item => (
              <div key={item.priority} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${rag(item.rag).border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold" style={{ color: rag(item.rag).color }}>{item.priority}</p>
                  <span className="text-xs" style={{ color: item.due==='URGENT'?'#EF4444':'#6B7280' }}>{item.due}</span>
                </div>
                <p className="text-xs mb-1" style={{ color: '#D1D5DB' }}>{item.action}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Owner: {item.owner}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peer support deployments */}
      <div>
        <SectionTitle title="Inter-School Peer Support" sub="Trust strength: deploy expertise across schools" />
        <div className="flex flex-col gap-2">
          {[
            { from: 'Meadowbrook Primary', to: 'Riverside Academy', what: 'SENCO fortnightly support · EHCP review support · ISP implementation', r:'green' as RAG },
            { from: 'Meadowbrook Primary', to: 'Highfield Junior', what: 'Attendance improvement coaching · PA family intervention strategies', r:'green' as RAG },
            { from: 'The Valley Academy', to: 'Highfield Junior', what: 'Reading lead supporting Y5/Y6 curriculum — 1 day per fortnight', r:'green' as RAG },
          ].map(p => (
            <div key={p.what} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle size={13} style={{ color: '#22C55E', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>{p.from} → {p.to}</p>
                <p className="text-xs mt-0.5" style={{ color: '#D1D5DB' }}>{p.what}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: ATH 2025 COMPLIANCE ─────────────────────────────────────────────────
function ATHCompliance() {
  const items = [
    { area: 'Governance', item: 'Board meets minimum 3 times per year', status: 'green' as RAG, ref: 'ATH 2.3' },
    { area: 'Governance', item: 'Scheme of delegation reviewed annually', status: 'green' as RAG, ref: 'ATH 2.4' },
    { area: 'Governance', item: 'GIAS trustee records kept up to date', status: 'green' as RAG, ref: 'ATH 2.47' },
    { area: 'Governance', item: 'Accounting officer duties understood and fulfilled', status: 'green' as RAG, ref: 'ATH 1.32' },
    { area: 'Finance', item: 'Budget Forecast Return submitted on time', status: 'green' as RAG, ref: 'ATH 2.16' },
    { area: 'Finance', item: 'Deficit budget notification to DfE if applicable', status: 'green' as RAG, ref: 'ATH 2.17' },
    { area: 'Finance', item: 'Audited annual accounts submitted to Companies House', status: 'green' as RAG, ref: 'ATH 3.x' },
    { area: 'Finance', item: 'Internal scrutiny completed (required >£50m income)', status: 'green' as RAG, ref: 'ATH 3.16' },
    { area: 'Finance', item: 'Related party transaction register maintained', status: 'green' as RAG, ref: 'ATH 5.38' },
    { area: 'Finance', item: 'Executive pay — transparent, proportionate, defensible (new ATH 2025)', status: 'amber' as RAG, ref: 'ATH 2.7' },
    { area: 'Finance', item: 'Procurement Act 2023 compliance — procedures reviewed', status: 'amber' as RAG, ref: 'ATH 6.11' },
    { area: 'Estates', item: 'Asbestos management — all schools compliant', status: 'red' as RAG, ref: 'ATH 1.19' },
    { area: 'Estates', item: 'H&S risk assessments current — all schools', status: 'green' as RAG, ref: 'ATH 1.17' },
    { area: 'Estates', item: 'Estate management standards applied', status: 'amber' as RAG, ref: 'ATH 1.20' },
    { area: 'Digital', item: '6 digital standards — working towards 2030 deadline', status: 'amber' as RAG, ref: 'ATH 1.16' },
    { area: 'Digital', item: 'Cyber security — no ransomware payment policy', status: 'amber' as RAG, ref: 'ATH 2025 new' },
    { area: 'Digital', item: 'Climate action plan in development', status: 'amber' as RAG, ref: 'ATH 6.19' },
    { area: 'Safeguarding', item: 'Safeguarding policy reviewed annually', status: 'green' as RAG, ref: 'KCSIE 2024' },
    { area: 'Safeguarding', item: 'DSL appointed at each school', status: 'green' as RAG, ref: 'KCSIE 2024' },
    { area: 'Safeguarding', item: 'All staff DBS checked — SCR current', status: 'red' as RAG, ref: 'KCSIE 2024' },
  ]
  const areas = [...new Set(items.map(i=>i.area))]
  const green = items.filter(i=>i.status==='green').length
  const amber = items.filter(i=>i.status==='amber').length
  const red = items.filter(i=>i.status==='red').length

  return (
    <div className="p-5 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Overall Compliance" value={`${Math.round((green/items.length)*100)}%`} sub={`${items.length} requirements checked`} r="amber" />
        <StatCard label="Compliant" value={String(green)} sub="Green items" r="green" />
        <StatCard label="Action Required" value={String(amber)} sub="Amber items" r="amber" />
        <StatCard label="Urgent Breaches" value={String(red)} sub="Red items — act now" r="red" />
      </div>

      {areas.map(area => (
        <div key={area}>
          <SectionTitle title={`${area} — ATH 2025`} />
          <div className="flex flex-col gap-1.5">
            {items.filter(i=>i.area===area).map(item => (
              <div key={item.item} className="flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ backgroundColor: '#111318', border: `1px solid ${rag(item.status).border}` }}>
                {item.status==='green' ? <CheckCircle size={13} style={{color:'#22C55E',flexShrink:0}} /> :
                 item.status==='red' ? <XCircle size={13} style={{color:'#EF4444',flexShrink:0}} /> :
                 <AlertCircle size={13} style={{color:'#F59E0B',flexShrink:0}} />}
                <p className="text-xs flex-1" style={{ color: '#D1D5DB' }}>{item.item}</p>
                <span className="text-xs flex-shrink-0 font-mono" style={{ color: '#4B5563' }}>{item.ref}</span>
                <RagBadge r={item.status} label={item.status==='green'?'Met':item.status==='amber'?'Partial':'Breach'} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'exec',      label: '🏛️ Executive',   component: ExecOverview },
  { id: 'education', label: '🎓 Education',    component: EducationOutcomes },
  { id: 'send',      label: '🧩 SEND',         component: SendInclusion },
  { id: 'safeguard', label: '🛡️ Safeguarding', component: Safeguarding,   badge: 3 },
  { id: 'finance',   label: '💰 Finance',      component: FinanceBudget },
  { id: 'hr',        label: '👥 HR',           component: HRWorkforce,    badge: 14 },
  { id: 'estates',   label: '🏗️ Estates',      component: EstatesCompliance, badge: 2 },
  { id: 'ofsted',    label: '🔍 Ofsted',       component: OfstedReadiness },
  { id: 'governance',label: '⚖️ Governance',  component: Governance },
  { id: 'improvement',label: '🚀 Improvement', component: SchoolImprovement, badge: 1 },
  { id: 'ath',       label: '📋 ATH 2025',     component: ATHCompliance,  badge: 3 },
]

export default function TrustDashboard() {
  const [hasData, setHasData] = useState<boolean | null>(null)

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_trust_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (hasData === null) return null
  if (!hasData) return <EmptyState pageName="trust" title="No trust data yet" description="Upload your school data to activate the Trust Overview dashboard." uploads={[
    { key: 'schools', label: 'Upload Schools Data (CSV)' },
    { key: 'finance', label: 'Upload Trust Finance (CSV/XLSX)', accept: '.csv,.xlsx' },
    { key: 'mis', label: 'Connect MIS' },
  ]} />

  const [tab, setTab] = useState('exec')
  const ActiveTab = TABS.find(t=>t.id===tab)!.component

  const redCount = SCHOOLS.filter(s=>s.ragOverall==='red').length
  const amberCount = SCHOOLS.filter(s=>s.ragOverall==='amber').length

  return (
    <div className="flex flex-col gap-4" style={{ backgroundColor: '#07080F', minHeight: '100vh', padding: '1.5rem' }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} style={{ color: '#0D9488' }} />
            <h1 className="text-xl font-black" style={{ color: '#F9FAFB' }}>{TRUST.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: '#6B7280' }}>
            <span>CEO: {TRUST.ceo}</span>
            <span>·</span>
            <span>{TRUST.schools} schools</span>
            <span>·</span>
            <span>{TRUST.pupils.toLocaleString()} pupils</span>
            <span>·</span>
            <span>{TRUST.staff} staff</span>
            <span>·</span>
            <span>{TRUST.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {redCount>0 && <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}><AlertTriangle size={12}/>{redCount} RED</span>}
          {amberCount>0 && <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}><AlertCircle size={12}/>{amberCount} AMBER</span>}
          <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}><Clock size={12}/>{new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric'})}</span>
        </div>
      </div>

      {/* School pill nav */}
      <div className="flex flex-wrap gap-2">
        {SCHOOLS.map(s => (
          <div key={s.id} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: '#111318', border: `1px solid ${rag(s.ragOverall).border}` }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rag(s.ragOverall).color }} />
            <span style={{ color: '#D1D5DB' }}>{s.name.split(' ')[0]}</span>
            <span style={{ color: '#6B7280' }}>{s.attendance}%</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex overflow-x-auto" style={{ backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
          {TABS.map(t => (
            <TabBtn key={t.id} active={tab===t.id} label={t.label} onClick={()=>setTab(t.id)} badge={t.badge} />
          ))}
        </div>
        <ActiveTab />
      </div>
    </div>
  )
}
