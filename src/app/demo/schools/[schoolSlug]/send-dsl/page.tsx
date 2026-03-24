'use client'
import React, { useState } from 'react'
import {
  Sparkles, AlertTriangle, FileText, User, ClipboardList, TrendingDown,
  Shield, BookOpen, Users, ChevronRight, CheckCircle, XCircle, Clock,
  AlertCircle, Activity, Building, Laptop, GraduationCap, FolderOpen
} from 'lucide-react'

// ─── Shared helpers ────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{ backgroundColor: '#0D9488', color: '#F9FAFB', maxWidth: 360 }}>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>×</button>
    </div>
  )
}

function StatCard({ label, value, sub, color = '#0D9488', alert = false }:
  { label: string; value: string; sub: string; color?: string; alert?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: '#111318',
      border: alert ? '1px solid rgba(239,68,68,0.5)' : '1px solid #1F2937'
    }}>
      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: bg }}>{label}</span>
  )
}

function SectionHeader({ title, badge, action, badgeColor = '#0D9488', badgeBg = 'rgba(13,148,136,0.12)' }:
  { title: string; badge?: string; action?: string; badgeColor?: string; badgeBg?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
        {badge && <Badge label={badge} color={badgeColor} bg={badgeBg} />}
      </div>
      {action && <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>{action}</span>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {children}
    </div>
  )
}

function AIHighlights({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
        <Sparkles size={14} style={{ color: '#0D9488' }} />
        <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Summary</span>
        <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated just now</span>
      </div>
      <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#07080F' }}>
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{i + 1}</span>
            <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm" style={{ borderBottom: '1px solid #1F2937' }}>
      {done
        ? <CheckCircle size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
        : <XCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />}
      <span style={{ color: done ? '#D1D5DB' : '#9CA3AF' }}>{label}</span>
      {!done && <Badge label="Pending" color="#F59E0B" bg="rgba(245,158,11,0.12)" />}
    </div>
  )
}

function AlertRow({ level, text, sub }: { level: 'high' | 'medium' | 'low'; text: string; sub?: string }) {
  const cfg = {
    high: { border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)', dot: '#EF4444', text: '#FCA5A5' },
    medium: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)', dot: '#F59E0B', text: '#FCD34D' },
    low: { border: 'rgba(13,148,136,0.3)', bg: 'rgba(13,148,136,0.08)', dot: '#0D9488', text: '#5EEAD4' },
  }[level]
  return (
    <div className="flex items-start gap-3 rounded-lg p-3" style={{ border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
      <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      <div>
        <p className="text-sm font-medium" style={{ color: cfg.text }}>{text}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ value, color = '#0D9488', label, sub }: { value: number; color?: string; label?: string; sub?: string }) {
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
          <span>{label}</span>
          {sub && <span>{sub}</span>}
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function SubTabs({ tabs, active, onChange, accentColor = '#0D9488' }:
  { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void; accentColor?: string }) {
  return (
    <div className="flex flex-wrap gap-1 px-4 pt-3 pb-0" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0A0B11' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="px-3 py-2 text-xs font-medium rounded-t-lg transition-all"
          style={{
            borderBottom: active === t.id ? `2px solid ${accentColor}` : '2px solid transparent',
            color: active === t.id ? accentColor : '#9CA3AF',
            backgroundColor: active === t.id ? 'rgba(13,148,136,0.08)' : 'transparent'
          }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Data ──────────────────────────────────────────────────────────────────

const SEND_HIGHLIGHTS = [
  'EHCP annual review for S. Williams (Year 5) is overdue — LA invite letter not sent. Action required within 5 working days.',
  'T. Morris EHCP annual review due 15 April — LA invite letter not yet sent. 20 days remaining.',
  'P. Clarke (Year 6) has no secondary transition plan confirmed — must be resolved before July.',
  'ISP templates not yet created — statutory requirement from September 2029 (White Paper Phase 1).',
  'CAMHS referral for O. Hassan has been waiting 9 weeks — consider interim SEMH support.',
  'SEN budget: £31,200 of £48,500 spent — on track. Inclusive Mainstream Fund application not yet submitted.',
]

const DSL_HIGHLIGHTS = [
  'Safeguarding concern SG-2026-047 (Welfare) — DSL review is overdue by 2 days. Immediate action required.',
  'KCSIE 2024 online safety compliance gap — annual filtering & monitoring review not yet completed (statutory DSL duty).',
  'LAC pupil Y. Singh (Year 6) — Personal Education Plan (PEP) is overdue. Virtual head must be notified.',
  '2 staff members have not completed annual KCSIE safeguarding update — deadline end of term.',
  'Former Pupil C safeguarding file not yet transferred to new school — KCSIE 2024 requires immediate secure transfer.',
]

const SEND_REGISTER = [
  { name: 'T. Morris', year: 'Year 4', category: 'SEMH', tier: 'Targeted', ehcp: true, ispStatus: 'Active', lastReview: 'Oct 2024' },
  { name: 'A. Patel', year: 'Year 2', category: 'SpLD (Dyslexia)', tier: 'Targeted', ehcp: false, ispStatus: 'Active', lastReview: 'Nov 2024' },
  { name: 'L. Chen', year: 'Year 3', category: 'ASD', tier: 'Specialist', ehcp: true, ispStatus: 'Active', lastReview: 'Sep 2024' },
  { name: 'S. Williams', year: 'Year 5', category: 'Hearing Impairment', tier: 'Specialist', ehcp: true, ispStatus: 'Overdue review', lastReview: 'Jan 2025' },
  { name: 'R. Brown', year: 'Year 1', category: 'SLCN', tier: 'Targeted+', ehcp: false, ispStatus: 'Active', lastReview: 'Jan 2025' },
  { name: 'O. Hassan', year: 'Year 4', category: 'SEMH / ADHD', tier: 'Targeted', ehcp: false, ispStatus: 'Draft', lastReview: '—' },
  { name: 'P. Clarke', year: 'Year 6', category: 'Physical Disability', tier: 'Specialist', ehcp: true, ispStatus: 'Active', lastReview: 'Mar 2025' },
  { name: 'M. Osei', year: 'Reception', category: 'GLD', tier: 'Universal', ehcp: false, ispStatus: 'Monitoring', lastReview: '—' },
]

const EHCP_PIPELINE = [
  { name: 'J. Ford', year: 'Year 3', stage: 'Assessment Agreed', requestDate: '17 Nov 2024', weeksPassed: 17, weeksLeft: 3 },
  { name: 'C. Osei', year: 'Year 6', stage: 'Evidence Gathering', requestDate: '8 Dec 2024', weeksPassed: 14, weeksLeft: 6 },
  { name: 'K. Yeboah', year: 'Year 1', stage: 'Request Received', requestDate: '12 Jan 2025', weeksPassed: 10, weeksLeft: 10 },
]

const EHCP_REVIEWS = [
  { name: 'S. Williams', year: 'Year 5', last: 'Jan 2025', next: 'Jan 2026', status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', notes: 'LA invite not sent — action required' },
  { name: 'T. Morris', year: 'Year 4', last: 'Apr 2025', next: '15 Apr 2026', status: 'LA invite not sent', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', notes: '20 days remaining' },
  { name: 'L. Chen', year: 'Year 3', last: 'Jun 2025', next: 'Jun 2026', status: 'On track', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', notes: 'EP report received' },
  { name: 'P. Clarke', year: 'Year 6', last: 'Mar 2025', next: 'Mar 2026', status: 'Scheduled', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', notes: 'Transition to secondary included' },
]

const AGENCIES = [
  { agency: 'CAMHS', referrals: 4, waitWeeks: 9, active: 2, next: '2 Apr', status: 'Delayed' },
  { agency: 'Educational Psychologist', referrals: 6, waitWeeks: 12, active: 3, next: '15 Apr', status: 'Long wait' },
  { agency: 'SALT (NHS)', referrals: 5, waitWeeks: 4, active: 4, next: '28 Mar', status: 'Active' },
  { agency: 'Occupational Therapy', referrals: 3, waitWeeks: 6, active: 1, next: '10 Apr', status: 'Moderate' },
  { agency: 'Early Help / Family Support', referrals: 2, waitWeeks: 0, active: 2, next: '26 Mar', status: 'Active' },
]

const INTERVENTIONS = [
  { name: 'Reading Recovery', pupils: 12, sendPupils: 8, provider: 'Mrs. Ahmed', freq: 'Daily 30min', impact: 'High' },
  { name: 'SEMH Thrive', pupils: 10, sendPupils: 9, provider: 'School Counsellor', freq: '2x weekly', impact: 'High' },
  { name: 'Speech & Language', pupils: 7, sendPupils: 7, provider: 'External SALT', freq: 'Weekly', impact: 'High' },
  { name: 'Maths Catch-up', pupils: 14, sendPupils: 6, provider: 'TA — Mr. Clarke', freq: 'Daily 20min', impact: 'Medium' },
  { name: 'Social Skills Group', pupils: 6, sendPupils: 5, provider: 'TA — Ms. Perry', freq: 'Weekly', impact: 'Medium' },
  { name: '1:1 Literacy (SpLD)', pupils: 4, sendPupils: 4, provider: 'HLTA', freq: '3x weekly', impact: 'High' },
]

const WHITEPAPER_TASKS = [
  { task: 'Inclusion Strategy drafted and published', done: true },
  { task: 'Universal offer baseline defined for all staff', done: true },
  { task: 'Three-tier support model mapped to register', done: false },
  { task: 'ISP template designed and piloted', done: false },
  { task: 'Staff SEND CPD plan agreed and scheduled', done: true },
  { task: 'National Inclusion Standards reviewed', done: false },
  { task: 'Inclusive Mainstream Fund applied for', done: false },
  { task: 'Experts at Hand application submitted', done: false },
  { task: 'Parent comms updated re: new system', done: true },
  { task: 'SENCO on SLT with protected time agreed', done: true },
]

const TA_STAFF = [
  { name: 'Ms. Perry', pupils: 3, hours: 10, type: '1:1', trained: true, reviewDue: 'Jul 2025' },
  { name: 'Mr. Clarke', pupils: 5, hours: 12, type: 'Group', trained: true, reviewDue: 'Apr 2025' },
  { name: 'Mrs. Okafor', pupils: 2, hours: 8, type: '1:1', trained: false, reviewDue: 'Overdue' },
  { name: 'Mr. Singh', pupils: 4, hours: 9, type: 'Group', trained: true, reviewDue: 'Sep 2025' },
]

// DSL data
const CASES = [
  { ref: 'SG-2026-047', pupil: 'J. Ford', year: 'Year 3', type: 'CP', category: 'Neglect / Domestic Abuse', sw: 'Priya Shah (LA)', nextMeeting: '26 Mar — TAF', opened: '12 Jan 2026', notes: 'Father removed from household. Mum engaging with support.' },
  { ref: 'SG-2026-031', pupil: 'C. Osei', year: 'Year 5', type: 'CP', category: 'Physical Abuse', sw: 'James Obi (LA)', nextMeeting: '3 Apr — CPC', opened: '5 Mar 2026', notes: 'Strategy meeting held. Police involved.' },
  { ref: 'SG-2026-012', pupil: 'M. Brown', year: 'Year 2', type: 'CiN', category: 'Neglect', sw: 'Family Support Worker', nextMeeting: '7 Apr — CiN Review', opened: '14 Oct 2025', notes: 'Attendance improved. Breakfast club supporting.' },
  { ref: 'SG-2026-019', pupil: 'K. Ahmed', year: 'Year 4', type: 'CiN', category: 'Parent mental health', sw: 'Early Help Team', nextMeeting: '2 Apr — Review', opened: '3 Feb 2026', notes: 'Mum receiving community mental health support.' },
]

const LAC = [
  { name: 'Y. Singh', year: 'Year 6', pepCurrent: false, lacReview: '28 Apr', att: '88%', send: true, pp: true },
  { name: 'D. Mensah', year: 'Year 4', pepCurrent: true, lacReview: '7 Apr', att: '91%', send: false, pp: true },
  { name: 'F. Okafor', year: 'Year 2', pepCurrent: true, lacReview: '14 May', att: '95%', send: true, pp: true },
]

const KCSIE_CHECKLIST = [
  { label: 'Child protection policy — current academic year', done: true },
  { label: 'Safeguarding policy publicly available', done: true },
  { label: 'Single Central Record up to date', done: true },
  { label: 'DBS checks current — all staff & volunteers', done: true },
  { label: 'Safer recruitment trained governor on panel', done: true },
  { label: 'DSL appointed and in job description', done: true },
  { label: 'Deputy DSL trained to same standard as DSL', done: true },
  { label: 'DSL training renewed within 2 years', done: true },
  { label: 'Annual staff safeguarding update delivered', done: true },
  { label: 'Online safety in safeguarding policy (KCSIE 2024)', done: false },
  { label: 'Filtering & monitoring annual review completed', done: false },
  { label: 'Online safety annual risk assessment completed', done: false },
  { label: 'Staff training includes filtering & monitoring', done: false },
  { label: 'Prevent duty policy reviewed', done: true },
  { label: 'Child-on-child abuse policy updated', done: true },
  { label: 'Safeguarding audit within last 12 months', done: true },
]

const TRAINING_MATRIX = [
  { name: 'DSL (Mrs. Hall)', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Nov 2025' },
  { name: 'Deputy DSL', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Nov 2025' },
  { name: 'Head', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Sep 2025' },
  { name: 'Year 5 Teacher', kcsie: true, annual: true, online: false, prevent: true, pop: true, due: 'Sep 2025' },
  { name: 'Year 6 Teacher', kcsie: true, annual: true, online: true, prevent: false, pop: true, due: 'Sep 2025' },
  { name: 'Year 4 Teacher', kcsie: true, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
  { name: 'Ms. Perry (TA)', kcsie: true, annual: true, online: false, prevent: true, pop: true, due: 'Sep 2025' },
  { name: 'Mr. Clarke (TA)', kcsie: true, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
  { name: 'Mrs. Okafor (TA)', kcsie: false, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
]

const ONLINE_INCIDENTS = [
  { date: '5 Nov', type: 'Cyberbullying', pupil: 'Z. Hassan (Year 6)', status: 'Resolved', urgency: 'medium' as const },
  { date: '18 Jan', type: 'Inappropriate content', pupil: 'A. Park (Year 5)', status: 'Resolved', urgency: 'low' as const },
  { date: '18 Mar', type: 'Contact from unknown adult online', pupil: 'J. Ford (Year 6)', status: 'Open — monitoring', urgency: 'high' as const },
]

const RECORDS_TRANSFERS = [
  { pupil: 'Former Pupil A', left: 'Jan 2026', school: 'Riverside Academy', transferred: true, receipt: true },
  { pupil: 'Former Pupil B', left: 'Feb 2026', school: "St. Mary's Primary", transferred: true, receipt: false },
  { pupil: 'Former Pupil C', left: 'Mar 2026', school: 'TBC', transferred: false, receipt: false },
]

const ATTENDANCE_CONCERNS = [
  { name: 'J. Ford', year: 'Year 3', pct: 79, status: 'Letter due', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { name: 'C. Osei', year: 'Year 6', pct: 82, status: 'Monitoring', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { name: 'M. Brown', year: 'Year 5', pct: 84, status: 'First warning sent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
]

// ─── SEND Tabs ─────────────────────────────────────────────────────────────

function SendOverview({ onAction }: { onAction: (s: string) => void }) {
  const byNeed = [
    { type: 'SEMH', count: 11, color: '#F97316' },
    { type: 'SpLD', count: 9, color: '#8B5CF6' },
    { type: 'SLCN', count: 7, color: '#06B6D4' },
    { type: 'ASD', count: 5, color: '#10B981' },
    { type: 'MLD', count: 3, color: '#F59E0B' },
    { type: 'Physical', count: 2, color: '#EC4899' },
    { type: 'HI/VI', count: 1, color: '#6366F1' },
  ]
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="SEND Register" value="38" sub="26.2% of roll (Nat: 20%)" color="#8B5CF6" />
        <StatCard label="Active EHCPs" value="14" sub="3 in assessment" color="#0D9488" />
        <StatCard label="Annual Reviews Overdue" value="1" sub="5 due this term" color="#EF4444" alert />
        <StatCard label="ISPs Active / Draft" value="24 / 4" sub="Templates not created" color="#F59E0B" />
      </div>

      {/* White Paper banner */}
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #1E3A5F, #1a2e4a)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p className="text-xs font-bold mb-1" style={{ color: '#A5B4FC' }}>📄 2026 SEND White Paper — "Every Child Achieving and Thriving"</p>
        <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Published 23 Feb 2026 · Consultation closes 18 May 2026 · ISPs statutory Sept 2029</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
          {[
            { phase: 'Phase 1 (Now)', desc: 'Align to best practice. ISP templates. SEND CPD.' },
            { phase: 'Phase 2 (2026/27)', desc: 'National Inclusion Standards. Pilot ISPs.' },
            { phase: 'Phase 3 (2029+)', desc: 'ISPs statutory. Digital EHCPs. EHCP reassessments.' },
          ].map(p => (
            <div key={p.phase} className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="font-semibold" style={{ color: '#C7D2FE' }}>{p.phase}</p>
              <p className="mt-0.5" style={{ color: '#9CA3AF' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* By need */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>SEND REGISTER BY PRIMARY NEED</p>
          <div className="flex flex-col gap-2">
            {byNeed.map(n => (
              <div key={n.type} className="flex items-center gap-3">
                <span className="text-xs w-16 flex-shrink-0" style={{ color: '#9CA3AF' }}>{n.type}</span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{ width: `${(n.count / 38) * 100}%`, backgroundColor: n.color }} />
                </div>
                <span className="text-xs font-bold w-4 text-right" style={{ color: '#D1D5DB' }}>{n.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Three-tier */}
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>THREE-TIER SUPPORT MODEL (2026 WHITE PAPER)</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Universal', sub: 'Quality-first teaching for all', value: 62, color: '#10B981' },
              { label: 'Targeted / Targeted+', sub: 'ISP required — SALT, EP, sensory', value: 28, color: '#6366F1' },
              { label: 'Specialist', sub: 'EHCP + Specialist Provision Package', value: 10, color: '#EF4444' },
            ].map(t => (
              <div key={t.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-xs font-semibold" style={{ color: '#D1D5DB' }}>{t.label}</span>
                    <span className="text-xs ml-2" style={{ color: '#6B7280' }}>{t.sub}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: t.color }}>{t.value}%</span>
                </div>
                <ProgressBar value={t.value} color={t.color} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent alerts */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>URGENT ACTIONS</p>
        <div className="flex flex-col gap-2">
          <AlertRow level="high" text="S. Williams (Year 5) — EHCP annual review overdue, LA invite not sent" sub="Action required within 5 working days" />
          <AlertRow level="high" text="P. Clarke (Year 6) — No secondary transition plan confirmed" sub="Must be resolved before July — secondary school must receive EHCP file" />
          <AlertRow level="medium" text="O. Hassan (Year 4) — CAMHS referral waiting 9 weeks" sub="Consider interim SEMH support while awaiting" />
          <AlertRow level="medium" text="ISP templates not yet created" sub="Required for White Paper Phase 1 compliance — stat. Sept 2029" />
          <AlertRow level="medium" text="Inclusive Mainstream Fund application not submitted" sub="£1.6bn national fund — application deadline approaching" />
        </div>
      </div>
    </div>
  )
}

function EhcpTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Pipeline stages */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { stage: 'Request Received', count: 2, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
          { stage: 'Assessment Agreed', count: 3, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
          { stage: 'Evidence Gathering', count: 2, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
          { stage: 'Draft Plan', count: 1, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
          { stage: 'Final Issued', count: 14, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
        ].map(s => (
          <div key={s.stage} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.stage}</p>
          </div>
        ))}
      </div>

      {/* 20-week tracker */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>20-WEEK STATUTORY DEADLINE TRACKER</p>
        <div className="flex flex-col gap-3">
          {EHCP_PIPELINE.map(e => {
            const urgency = e.weeksLeft <= 3 ? '#EF4444' : e.weeksLeft <= 6 ? '#F59E0B' : '#0D9488'
            return (
              <div key={e.name} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{e.name} ({e.year})</span>
                    <Badge label={e.stage} color={urgency} bg={`${urgency}20`} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: urgency }}>{e.weeksLeft} wks left</span>
                </div>
                <ProgressBar value={(e.weeksPassed / 20) * 100} color={urgency} />
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Requested: {e.requestDate} · Week {e.weeksPassed} of 20</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Annual reviews */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>ANNUAL REVIEW SCHEDULE</p>
        <Card>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            <div className="grid grid-cols-5 gap-3 px-5 py-2">
              {['Name', 'Year', 'Last Review', 'Next Due', 'Status'].map(h => (
                <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
              ))}
            </div>
            {EHCP_REVIEWS.map(r => (
              <div key={r.name} className="grid grid-cols-5 gap-3 px-5 py-3 items-center"
                style={{ backgroundColor: r.status === 'Overdue' ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.name}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{r.year}</p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>{r.last}</p>
                <p className="text-sm" style={{ color: r.status === 'Overdue' ? '#EF4444' : '#D1D5DB' }}>{r.next}</p>
                <div className="flex flex-col gap-1">
                  <Badge label={r.status} color={r.color} bg={r.bg} />
                  <p className="text-xs" style={{ color: '#6B7280' }}>{r.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Y6 Transition */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>YEAR 6 TRANSITION TRACKER</p>
        <div className="flex flex-col gap-2">
          {[
            { name: 'P. Clarke', secondary: 'Hillside Academy', ehcpSent: true, planDone: true, parentConsulted: true },
            { name: 'L. Chen (possible)', secondary: 'TBC', ehcpSent: false, planDone: false, parentConsulted: true },
          ].map(t => (
            <div key={t.name} className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
              <div>
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{t.name}</span>
                <span className="text-xs ml-2" style={{ color: '#6B7280' }}>→ {t.secondary}</span>
              </div>
              <div className="flex gap-4 text-xs">
                <span style={{ color: t.ehcpSent ? '#22C55E' : '#EF4444' }}>{t.ehcpSent ? '✓' : '✗'} EHCP sent</span>
                <span style={{ color: t.planDone ? '#22C55E' : '#EF4444' }}>{t.planDone ? '✓' : '✗'} Transition plan</span>
                <span style={{ color: t.parentConsulted ? '#22C55E' : '#F59E0B' }}>{t.parentConsulted ? '✓' : '○'} Parent consulted</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IspTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#FCD34D' }}>⚠️ ISP Templates Not Yet Created</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>Individual Support Plans become a statutory requirement from September 2029 (2026 White Paper Phase 3). Schools must pilot templates in Phase 1 (2025/26). Recommend creating templates this half-term.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="ISPs Active" value="24" sub="Fully signed off" color="#22C55E" />
        <StatCard label="ISPs in Draft" value="4" sub="Awaiting sign-off" color="#F59E0B" />
        <StatCard label="ISPs Overdue Review" value="4" sub="Past review date" color="#EF4444" alert />
        <StatCard label="No ISP Yet" value="10" sub="SEN support — to action" color="#8B5CF6" />
      </div>

      <Card>
        <SectionHeader title="ISP Status — All SEND Pupils" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid gap-3 px-5 py-2" style={{ gridTemplateColumns: '1fr 60px 100px 80px 100px 100px 80px' }}>
            {['Pupil', 'Year', 'Need', 'Tier', 'ISP Status', 'Next Review', 'Parent ✓'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {SEND_REGISTER.map(p => {
            const statusColor = p.ispStatus === 'Active' ? '#22C55E' : p.ispStatus === 'Draft' ? '#F59E0B' : p.ispStatus === 'Overdue review' ? '#EF4444' : '#6B7280'
            const statusBg = p.ispStatus === 'Active' ? 'rgba(34,197,94,0.12)' : p.ispStatus === 'Draft' ? 'rgba(245,158,11,0.12)' : p.ispStatus === 'Overdue review' ? 'rgba(239,68,68,0.12)' : 'rgba(107,114,128,0.12)'
            const tierColor = p.tier === 'Specialist' ? '#EF4444' : p.tier === 'Targeted+' ? '#8B5CF6' : p.tier === 'Targeted' ? '#3B82F6' : '#6B7280'
            return (
              <div key={p.name} className="grid gap-3 px-5 py-3 items-center"
                style={{ gridTemplateColumns: '1fr 60px 100px 80px 100px 100px 80px', backgroundColor: p.ispStatus === 'Overdue review' ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.name}</p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>{p.year}</p>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{p.category}</p>
                <Badge label={p.tier} color={tierColor} bg={`${tierColor}20`} />
                <Badge label={p.ispStatus} color={statusColor} bg={statusBg} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.lastReview}</p>
                <span style={{ color: p.ehcp ? '#22C55E' : '#6B7280' }}>{p.ehcp ? '✓ Yes' : '—'}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function AgenciesTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <Card>
        <SectionHeader title="External Agency Tracker" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            {['Agency', 'Referrals', 'Wait (wks)', 'Active', 'Status'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {AGENCIES.map(a => {
            const statusColor = a.status === 'Active' ? '#22C55E' : a.status === 'Delayed' || a.status === 'Long wait' ? '#EF4444' : '#F59E0B'
            return (
              <div key={a.agency} className="grid grid-cols-5 gap-3 px-5 py-3 items-center">
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{a.agency}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{a.referrals}</p>
                <p className="text-sm font-bold" style={{ color: a.waitWeeks > 6 ? '#EF4444' : a.waitWeeks > 4 ? '#F59E0B' : '#22C55E' }}>{a.waitWeeks}</p>
                <p className="text-sm font-bold" style={{ color: '#0D9488' }}>{a.active}</p>
                <Badge label={a.status} color={statusColor} bg={`${statusColor}20`} />
              </div>
            )
          })}
        </div>
      </Card>

      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#A5B4FC' }}>📌 Experts at Hand Programme — 2026 White Paper</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>£1.8bn nationally to bring SALT, EP and OT closer to schools — reducing dependency on long NHS waits. Apply via your Integrated Care Board. <span style={{ color: '#EF4444', fontWeight: 600 }}>Application not yet submitted.</span></p>
      </div>

      <Card>
        <SectionHeader title="Intervention Impact Tracker" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            {['Intervention', 'All Pupils', 'SEND Pupils', 'Provider', 'Impact'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {INTERVENTIONS.map(i => (
            <div key={i.name} className="grid grid-cols-5 gap-3 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{i.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{i.pupils}</p>
              <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{i.sendPupils}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{i.provider}</p>
              <Badge label={i.impact} color={i.impact === 'High' ? '#22C55E' : '#3B82F6'} bg={i.impact === 'High' ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)'} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function WhitepaperTab() {
  const done = WHITEPAPER_TASKS.filter(t => t.done).length
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Phase 1 Progress</p>
          <p className="text-2xl font-black mt-1" style={{ color: '#0D9488' }}>{done}/{WHITEPAPER_TASKS.length}</p>
          <ProgressBar value={(done / WHITEPAPER_TASKS.length) * 100} color="#0D9488" />
        </div>
        <div className="flex-1 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>ISPs Statutory From</p>
          <p className="text-2xl font-black mt-1" style={{ color: '#F59E0B' }}>Sept 2029</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Start piloting now</p>
        </div>
        <div className="flex-1 rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Consultation Closes</p>
          <p className="text-2xl font-black mt-1" style={{ color: '#8B5CF6' }}>18 May</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>2026 — respond now</p>
        </div>
      </div>

      <Card>
        <SectionHeader title="Phase 1 Compliance Checklist (2025/26)" badge={`${done}/${WHITEPAPER_TASKS.length} complete`} badgeColor="#0D9488" badgeBg="rgba(13,148,136,0.12)" />
        <div className="p-5 flex flex-col gap-0">
          {WHITEPAPER_TASKS.map(t => <CheckItem key={t.task} label={t.task} done={t.done} />)}
        </div>
      </Card>

      <Card>
        <SectionHeader title="What Ofsted Will Look For — SEND & Inclusion (2025 Framework)" />
        <div className="p-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { area: 'Inclusion (standalone area)', detail: 'How well school meets needs of SEND, disadvantaged and vulnerable pupils. SENCO empowered as whole-school leader.' },
            { area: 'Annual Inclusion Strategy', detail: 'Annual duty — published and embedded. Ofsted will assess how leaders ensure it is delivered in practice.' },
            { area: 'Staff Training', detail: 'All staff must have SEND training. New duty to signpost DfE-funded CPD opportunities.' },
            { area: 'EHCP & ISP Quality', detail: 'Needs identified, planned for and reviewed. Annual reviews on time. ISPs evidence provision and outcomes.' },
            { area: 'Progress of SEND Pupils', detail: 'Specific evidence of progress for SEND pupils. Ofsted takes particular care with this group.' },
            { area: 'Parent Engagement', detail: 'Co-production with parents in ISPs and annual reviews. Complaints and mediation process robust.' },
          ].map(o => (
            <div key={o.area} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#0D9488' }}>{o.area}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{o.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StaffingTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="TAs Deployed (SEND)" value="6" sub="Full-time equivalents" color="#0D9488" />
        <StatCard label="1:1 Hours/week" value="42 hrs" sub="Across EHCP pupils" color="#8B5CF6" />
        <StatCard label="SEND CPD Complete" value="18/22" sub="4 staff outstanding" color="#F59E0B" />
        <StatCard label="SENCO Protected Time" value="2.5 days" sub="Recommended: 3+ days" color="#EF4444" alert />
      </div>

      <Card>
        <SectionHeader title="TA Deployment — SEND Pupils" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            {['TA Name', 'SEND Pupils', 'Hours/wk', 'Type', 'SEND Training'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {TA_STAFF.map(t => (
            <div key={t.name} className="grid grid-cols-5 gap-3 px-5 py-3 items-center"
              style={{ backgroundColor: !t.trained ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{t.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{t.pupils}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{t.hours}</p>
              <Badge label={t.type} color="#3B82F6" bg="rgba(59,130,246,0.12)" />
              <span style={{ color: t.trained ? '#22C55E' : '#EF4444', fontSize: '0.75rem' }}>
                {t.trained ? '✓ Current' : '✗ Outstanding'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── DSL Tabs ──────────────────────────────────────────────────────────────

function DslOverview() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.3)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#D1D5DB' }}>🛡️ KCSIE 2024 — In force from 1 September 2024</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>The DSL holds overall statutory responsibility for safeguarding including online safety and understanding filtering/monitoring systems. This responsibility cannot be delegated.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open Cases" value="4" sub="2 CP · 2 CiN" color="#EF4444" alert />
        <StatCard label="Looked After Children" value="3" sub="2 primary school age" color="#8B5CF6" />
        <StatCard label="Referrals This Term" value="6" sub="vs 7 last term" color="#0D9488" />
        <StatCard label="KCSIE Compliance" value="87%" sub="4 gaps identified" color="#F59E0B" alert />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>ACTIVE CONCERNS</p>
          <div className="flex flex-col gap-2">
            <AlertRow level="high" text="SG-2026-047 — DSL review overdue by 2 days" sub="J. Ford (Year 3) — Welfare concern. TAF meeting 26 Mar." />
            <AlertRow level="high" text="SG-2026-031 — Physical abuse allegation — under investigation" sub="C. Osei (Year 5) — Strategy meeting held. Police involved." />
            <AlertRow level="medium" text="SG-2026-012 — CiN plan active (Neglect)" sub="M. Brown (Year 2) — Next review 7 Apr." />
            <AlertRow level="medium" text="SG-2026-019 — CiN plan active (Parent MH)" sub="K. Ahmed (Year 4) — Next review 2 Apr." />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>KEY UPCOMING DATES</p>
          <div className="flex flex-col gap-2">
            {[
              { date: '26 Mar', event: 'TAF Meeting — J. Ford', urgent: true },
              { date: '2 Apr', event: 'CiN Review — K. Ahmed', urgent: false },
              { date: '7 Apr', event: 'CiN Review — M. Brown', urgent: false },
              { date: '7 Apr', event: 'LAC Review — D. Mensah', urgent: false },
              { date: '11 Apr', event: 'Safer recruitment — 2 new staff', urgent: false },
              { date: '1 Jul', event: 'Annual safeguarding audit due', urgent: false },
            ].map(e => (
              <div key={e.event} className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ backgroundColor: e.urgent ? 'rgba(239,68,68,0.08)' : '#0A0B11', border: `1px solid ${e.urgent ? 'rgba(239,68,68,0.3)' : '#1F2937'}` }}>
                <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: e.urgent ? '#EF4444' : '#6B7280' }}>{e.date}</span>
                <span className="text-sm flex-1" style={{ color: e.urgent ? '#FCA5A5' : '#D1D5DB' }}>{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CasesTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Child Protection', count: 2, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
          { label: 'Children in Need', count: 2, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
          { label: 'Looked After', count: 3, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
          { label: 'Early Help', count: 4, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Monitored', count: 6, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {CASES.map(c => (
          <div key={c.ref} className="rounded-xl p-4"
            style={{ backgroundColor: '#111318', border: `1px solid ${c.type === 'CP' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{c.pupil} ({c.year})</span>
                <Badge label={c.ref} color="#6B7280" bg="rgba(107,114,128,0.12)" />
                <Badge label={c.type} color={c.type === 'CP' ? '#EF4444' : '#F59E0B'} bg={c.type === 'CP' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'} />
                <Badge label={c.category} color="#3B82F6" bg="rgba(59,130,246,0.12)" />
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: '#6B7280' }}>Opened: {c.opened}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2" style={{ color: '#9CA3AF' }}>
              <p><span style={{ color: '#6B7280' }}>SW: </span>{c.sw}</p>
              <p><span style={{ color: '#6B7280' }}>Next: </span>{c.nextMeeting}</p>
            </div>
            <p className="text-xs italic" style={{ color: '#6B7280' }}>{c.notes}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>LOOKED AFTER CHILDREN</p>
        <Card>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            <div className="grid grid-cols-6 gap-3 px-5 py-2">
              {['Pupil', 'Year', 'PEP Current', 'LAC Review', 'Attendance', 'PP+ Claimed'].map(h => (
                <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
              ))}
            </div>
            {LAC.map(l => (
              <div key={l.name} className="grid grid-cols-6 gap-3 px-5 py-3 items-center"
                style={{ backgroundColor: !l.pepCurrent ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{l.name}</p>
                <p className="text-sm" style={{ color: '#D1D5DB' }}>{l.year}</p>
                <span style={{ color: l.pepCurrent ? '#22C55E' : '#EF4444', fontSize: '0.75rem' }}>{l.pepCurrent ? '✓ Current' : '✗ Overdue'}</span>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{l.lacReview}</p>
                <p className="text-sm font-bold" style={{ color: parseInt(l.att) < 90 ? '#EF4444' : '#D1D5DB' }}>{l.att}</p>
                <span style={{ color: l.pp ? '#22C55E' : '#EF4444', fontSize: '0.75rem' }}>{l.pp ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ComplianceTab() {
  const done = KCSIE_CHECKLIST.filter(i => i.done).length
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="KCSIE Compliance" value={`${done}/${KCSIE_CHECKLIST.length}`} sub="4 gaps require action" color={done === KCSIE_CHECKLIST.length ? '#22C55E' : '#F59E0B'} />
        <StatCard label="Safer Recruitment" value="100%" sub="All staff checked" color="#22C55E" />
        <StatCard label="Last Audit" value="Met" sub="Conducted Jan 2025 — next Jul 2025" color="#22C55E" />
      </div>
      <Card>
        <SectionHeader title="KCSIE 2024 Full Compliance Checklist" badge={`${done}/${KCSIE_CHECKLIST.length}`} badgeColor={done === KCSIE_CHECKLIST.length ? '#22C55E' : '#F59E0B'} badgeBg={done === KCSIE_CHECKLIST.length ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'} />
        <div className="px-5 pb-5 pt-3 grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-8">
          {KCSIE_CHECKLIST.map(i => <CheckItem key={i.label} label={i.label} done={i.done} />)}
        </div>
      </Card>
    </div>
  )
}

function OnlineSafetyTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#93C5FD' }}>💻 KCSIE 2024: Online Safety is a DSL Statutory Responsibility</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>The DSL must personally understand the filtering and monitoring systems in place. Schools must conduct an annual risk assessment and review filtering/monitoring at least annually. This cannot be delegated.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Filtering System" value="Active" sub="Smoothwall — reviewed Nov 2024" color="#22C55E" />
        <StatCard label="Monitoring System" value="Active" sub="Weekly reports reviewed by DSL" color="#22C55E" />
        <StatCard label="Annual Review" value="Overdue" sub="Due Jan 2025 — not completed" color="#EF4444" alert />
        <StatCard label="Online Incidents YTD" value="3" sub="2 resolved · 1 open" color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <SectionHeader title="Filtering & Monitoring Compliance" />
          <div className="px-5 pb-5 pt-3 flex flex-col gap-0">
            {[
              { label: 'Filtering system active on all school devices', done: true },
              { label: 'Filtering covers all school networks', done: true },
              { label: 'DSL understands filtering system capability', done: true },
              { label: 'Monitoring system active and alerts reviewed', done: true },
              { label: 'Annual filtering & monitoring review completed', done: false },
              { label: 'Online safety annual risk assessment completed', done: false },
              { label: 'CP policy includes online safety section (KCSIE 2024)', done: false },
              { label: 'Staff training includes filtering & monitoring', done: false },
              { label: 'Staff acceptable use policy current', done: true },
              { label: 'Pupil acceptable use agreement in place', done: true },
            ].map(i => <CheckItem key={i.label} label={i.label} done={i.done} />)}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <SectionHeader title="Online Incidents This Year" />
            <div className="p-4 flex flex-col gap-2">
              {ONLINE_INCIDENTS.map(i => (
                <AlertRow key={i.date} level={i.urgency} text={`${i.type} — ${i.pupil}`} sub={`${i.date} · ${i.status}`} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader title="Online Safety Curriculum" />
            <div className="px-5 pb-4 pt-3 flex flex-col gap-0">
              {[
                { label: 'Online safety taught in PSHE (all years)', done: true },
                { label: 'Sharing nudes guidance delivered (Y5/Y6)', done: true },
                { label: 'Safer Internet Day programme delivered', done: true },
                { label: 'Safe use of AI discussed with older pupils', done: false },
                { label: 'Parent online safety workshop this year', done: false },
              ].map(i => <CheckItem key={i.label} label={i.label} done={i.done} />)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TrainingTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Staff Training Current" value="18/22" sub="4 staff outstanding" color="#F59E0B" />
        <StatCard label="DSL Training Valid" value="Yes" sub="Renewed Nov 2024 (2yr)" color="#22C55E" />
        <StatCard label="Deputy DSL Training" value="Yes" sub="Renewed Nov 2024" color="#22C55E" />
        <StatCard label="Governor Training" value="2/3" sub="1 governor outstanding" color="#F59E0B" />
      </div>

      <Card>
        <SectionHeader title="Whole-School Safeguarding Training Matrix" />
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-7 gap-2 px-5 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
              {['Staff Member', 'KCSIE Induction', 'Annual Update', 'Online Safety', 'Prevent', 'Peer-on-Peer', 'Next Due'].map(h => (
                <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
              ))}
            </div>
            {TRAINING_MATRIX.map((s, i) => (
              <div key={s.name} className="grid grid-cols-7 gap-2 px-5 py-2 items-center"
                style={{ borderBottom: '1px solid #1F2937', backgroundColor: (!s.kcsie || !s.annual) ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                {[s.kcsie, s.annual, s.online, s.prevent, s.pop].map((v, j) => (
                  <span key={j} style={{ color: v ? '#22C55E' : '#EF4444', fontSize: '0.875rem' }}>{v ? '✓' : '✗'}</span>
                ))}
                <p className="text-xs font-medium" style={{ color: s.due.includes('⚠') ? '#EF4444' : '#6B7280' }}>{s.due}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="DSL Supervision Log" />
        <div className="p-5 flex flex-col gap-2">
          {[
            { date: '3 Feb 2026', with: 'External Safeguarding Lead', notes: 'Reviewed CP cases, discussed strategy for SG-2026-031' },
            { date: '2 Dec 2025', with: 'Head / External supervisor', notes: 'End-of-term case review and DSL wellbeing check' },
            { date: '1 Oct 2025', with: 'External Safeguarding Lead', notes: 'New academic year case overview and KCSIE 2024 update' },
          ].map(s => (
            <div key={s.date} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold" style={{ color: '#D1D5DB' }}>{s.date} — {s.with}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.notes}</p>
            </div>
          ))}
          <p className="text-xs" style={{ color: '#6B7280' }}>Next supervision: 1 May 2026</p>
        </div>
      </Card>
    </div>
  )
}

function RecordsTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(107,114,128,0.08)', border: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#D1D5DB' }}>📁 KCSIE 2024 Records Requirements</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>The DSL must keep detailed, accurate, written chronological records of all concerns. Records must be kept separately from pupil files, held securely, and transferred immediately when pupils leave — with confirmation of receipt obtained.</p>
      </div>

      <Card>
        <SectionHeader title="Records Transfer — Leavers" badge="1 outstanding" badgeColor="#EF4444" badgeBg="rgba(239,68,68,0.12)" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            {['Pupil', 'Left', 'New School', 'File Transferred', 'Receipt Confirmed'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {RECORDS_TRANSFERS.map(r => (
            <div key={r.pupil} className="grid grid-cols-5 gap-3 px-5 py-3 items-center"
              style={{ backgroundColor: !r.transferred ? 'rgba(239,68,68,0.05)' : !r.receipt ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{r.pupil}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{r.left}</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{r.school}</p>
              <span style={{ color: r.transferred ? '#22C55E' : '#EF4444', fontSize: '0.75rem' }}>{r.transferred ? '✓ Sent' : '✗ Pending'}</span>
              <span style={{ color: r.receipt ? '#22C55E' : '#F59E0B', fontSize: '0.75rem' }}>{r.receipt ? '✓ Confirmed' : r.transferred ? '○ Awaited' : '—'}</span>
            </div>
          ))}
        </div>
        <div className="p-4">
          <AlertRow level="high" text="Former Pupil C — safeguarding file not yet transferred" sub="Pupil left 3 weeks ago. New placement unknown. KCSIE 2024 requires immediate action." />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Single Central Record" badge="Fully compliant" badgeColor="#22C55E" badgeBg="rgba(34,197,94,0.12)" />
        <div className="px-5 pb-5 pt-3 flex flex-col gap-0">
          {[
            { label: 'All teaching staff on SCR', done: true },
            { label: 'All support staff on SCR', done: true },
            { label: 'All volunteers on SCR', done: true },
            { label: 'Contractors with unsupervised access on SCR', done: true },
            { label: 'SCR reviewed this academic year', done: true },
            { label: 'SCR accessible to Ofsted on request', done: true },
          ].map(i => <CheckItem key={i.label} label={i.label} done={i.done} />)}
        </div>
      </Card>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

const SEND_TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'ehcp', label: '📄 EHCP Pipeline' },
  { id: 'isp', label: '🗂 ISP Tracker' },
  { id: 'agencies', label: '🔗 Agencies & Interventions' },
  { id: 'whitepaper', label: '📋 White Paper' },
  { id: 'staffing', label: '👥 TA & Staffing' },
]

const DSL_TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'cases', label: '🔴 Case Management' },
  { id: 'compliance', label: '✅ KCSIE Compliance' },
  { id: 'online', label: '💻 Online Safety' },
  { id: 'training', label: '🎓 Training Matrix' },
  { id: 'records', label: '📁 Records & SCR' },
]

const QUICK_ACTIONS = [
  { label: 'Log Concern', icon: <AlertTriangle size={14} /> },
  { label: 'EHCP Review', icon: <FileText size={14} /> },
  { label: 'Pupil Passport', icon: <User size={14} /> },
  { label: 'Intervention Log', icon: <ClipboardList size={14} /> },
  { label: 'Attendance Concern', icon: <TrendingDown size={14} /> },
]

export default function DemoSendDslPage() {
  const [section, setSection] = useState<'send' | 'dsl'>('send')
  const [sendTab, setSendTab] = useState('overview')
  const [dslTab, setDslTab] = useState('overview')
  const [toast, setToast] = useState('')

  function fireToast(action: string) {
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>SEND & DSL</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>SEND register, EHCP pipeline, ISP tracker, safeguarding and KCSIE compliance</p>
      </div>

      {/* Section toggle */}
      <div className="flex gap-2">
        {[
          { id: 'send', label: '🧩 SEND / SENCO', sub: '38 pupils on register' },
          { id: 'dsl', label: '🛡️ Safeguarding / DSL', sub: '4 open cases · 1 overdue' },
        ].map(s => (
          <button key={s.id} onClick={() => setSection(s.id as 'send' | 'dsl')}
            className="flex-1 rounded-xl px-4 py-3 text-left transition-all"
            style={{
              backgroundColor: section === s.id ? 'rgba(13,148,136,0.15)' : '#111318',
              border: section === s.id ? '1px solid rgba(13,148,136,0.5)' : '1px solid #1F2937',
            }}>
            <p className="text-sm font-semibold" style={{ color: section === s.id ? '#0D9488' : '#D1D5DB' }}>{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{s.sub}</p>
          </button>
        ))}
      </div>

      {/* AI Summary */}
      <AIHighlights items={section === 'send' ? SEND_HIGHLIGHTS : DSL_HIGHLIGHTS} />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => fireToast(a.label)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0F766E')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0D9488')}>
            {a.icon}{a.label}
          </button>
        ))}
      </div>

      {/* SEND section */}
      {section === 'send' && (
        <Card>
          <SubTabs tabs={SEND_TABS} active={sendTab} onChange={setSendTab} />
          {sendTab === 'overview' && <SendOverview onAction={fireToast} />}
          {sendTab === 'ehcp' && <EhcpTab />}
          {sendTab === 'isp' && <IspTab />}
          {sendTab === 'agencies' && <AgenciesTab />}
          {sendTab === 'whitepaper' && <WhitepaperTab />}
          {sendTab === 'staffing' && <StaffingTab />}
        </Card>
      )}

      {/* DSL section */}
      {section === 'dsl' && (
        <Card>
          <SubTabs tabs={DSL_TABS} active={dslTab} onChange={setDslTab} accentColor="#EF4444" />
          {dslTab === 'overview' && <DslOverview />}
          {dslTab === 'cases' && <CasesTab />}
          {dslTab === 'compliance' && <ComplianceTab />}
          {dslTab === 'online' && <OnlineSafetyTab />}
          {dslTab === 'training' && <TrainingTab />}
          {dslTab === 'records' && <RecordsTab />}
        </Card>
      )}

      {/* Attendance concerns (always visible) */}
      <Card>
        <SectionHeader
          title="Attendance Concerns (<85%)"
          badge="3 pupils"
          badgeColor="#F59E0B"
          badgeBg="rgba(245,158,11,0.12)"
          action="Generate letters →"
        />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            {['Name', 'Year', 'Attendance', 'Action'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {ATTENDANCE_CONCERNS.map(row => (
            <div key={row.name} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{row.pct}%</p>
                <div className="flex-1 max-w-[80px] h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div style={{ width: `${row.pct}%`, backgroundColor: '#EF4444' }} className="h-full rounded-full" />
                </div>
              </div>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
