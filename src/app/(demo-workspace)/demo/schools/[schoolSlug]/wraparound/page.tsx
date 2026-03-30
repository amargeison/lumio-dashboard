'use client'
import React, { useState } from 'react'
import { Sparkles, AlertTriangle, CheckCircle, XCircle, Clock, Users, DollarSign, Calendar, Sun, Coffee, Sunset, Star, ChevronRight, Phone } from 'lucide-react'
import SchoolEmptyState from '@/components/dashboard/SchoolEmptyState'
import { useHasSchoolData } from '@/components/dashboard/EmptyState'
import DeptAISummary from '@/components/DeptAISummary'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{ backgroundColor: '#0D9488', color: '#F9FAFB', maxWidth: 360 }}>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>×</button>
    </div>
  )
}

function StatCard({ label, value, sub, color = '#0D9488', alert = false }: {
  label: string; value: string; sub?: string; color?: string; alert?: boolean
}) {
  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: '#111318',
      border: alert ? '1px solid rgba(239,68,68,0.5)' : '1px solid #1F2937',
    }}>
      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {children}
    </div>
  )
}

function SectionHeader({ title, badge, action, badgeColor = '#0D9488', badgeBg = 'rgba(13,148,136,0.12)' }: {
  title: string; badge?: string; action?: string; badgeColor?: string; badgeBg?: string
}) {
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
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function AlertRow({ level, text, sub }: { level: 'high' | 'medium' | 'low'; text: string; sub?: string }) {
  const cfg = {
    high: { border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)', dot: '#EF4444', color: '#FCA5A5' },
    medium: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)', dot: '#F59E0B', color: '#FCD34D' },
    low: { border: 'rgba(13,148,136,0.3)', bg: 'rgba(13,148,136,0.08)', dot: '#0D9488', color: '#5EEAD4' },
  }[level]
  return (
    <div className="flex items-start gap-3 rounded-lg p-3" style={{ border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
      <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      <div>
        <p className="text-sm font-medium" style={{ color: cfg.color }}>{text}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
      </div>
    </div>
  )
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
      {done
        ? <CheckCircle size={13} style={{ color: '#22C55E', flexShrink: 0 }} />
        : <XCircle size={13} style={{ color: '#EF4444', flexShrink: 0 }} />}
      <span className="text-xs" style={{ color: done ? '#D1D5DB' : '#6B7280' }}>{label}</span>
      {!done && <Badge label="Action needed" color="#F59E0B" bg="rgba(245,158,11,0.12)" />}
    </div>
  )
}

function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-0 px-3 pt-2" style={{ backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="px-3 py-2 text-xs font-medium rounded-t-lg transition-all"
          style={{
            borderBottom: active === t.id ? '2px solid #0D9488' : '2px solid transparent',
            color: active === t.id ? '#0D9488' : '#9CA3AF',
            backgroundColor: active === t.id ? 'rgba(13,148,136,0.08)' : 'transparent',
          }}>{t.label}</button>
      ))}
    </div>
  )
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY_REGISTER_BC = [
  { name: 'T. Morris', year: 'Y4', arrived: '07:48', meal: 'Hot', fsm: true, send: true, checkedIn: true },
  { name: 'A. Patel', year: 'Y2', arrived: '07:52', meal: 'Cold', fsm: false, send: true, checkedIn: true },
  { name: 'R. Brown', year: 'Y1', arrived: '08:01', meal: 'Hot', fsm: true, send: true, checkedIn: true },
  { name: 'O. Hassan', year: 'Y4', arrived: '07:55', meal: 'Hot', fsm: true, send: true, checkedIn: true },
  { name: 'D. Mensah', year: 'Y4', arrived: '07:44', meal: 'Hot', fsm: true, send: false, checkedIn: true },
  { name: 'E. Singh', year: 'Y3', arrived: '08:05', meal: 'Hot', fsm: false, send: false, checkedIn: true },
  { name: 'K. Yeboah', year: 'Y5', arrived: '—', meal: 'Cold', fsm: false, send: false, checkedIn: false },
  { name: 'P. Clarke', year: 'Y6', arrived: '07:50', meal: 'Hot', fsm: false, send: true, checkedIn: true },
]

const TODAY_REGISTER_ASC = [
  { name: 'T. Morris', year: 'Y4', bookedUntil: '17:30', collectedBy: '—', collectedTime: '—', activity: 'Arts & Crafts', send: true, collected: false },
  { name: 'L. Chen', year: 'Y3', bookedUntil: '18:00', collectedBy: 'Min Chen', collectedTime: '16:45', activity: 'Homework Club', send: true, collected: true },
  { name: 'S. Williams', year: 'Y5', bookedUntil: '17:00', collectedBy: '—', collectedTime: '—', activity: 'Sports', send: true, collected: false },
  { name: 'F. Ahmed', year: 'Y5', bookedUntil: '18:00', collectedBy: 'Nasreen Ahmed', collectedTime: '17:55', activity: 'Homework Club', send: false, collected: true },
  { name: 'M. Osei', year: 'Rec', bookedUntil: '17:30', collectedBy: '—', collectedTime: '—', activity: 'Free Play', send: false, collected: false },
  { name: 'J. Ford', year: 'Y3', bookedUntil: '17:00', collectedBy: 'Kelly Ford', collectedTime: '16:58', activity: 'Sports', send: false, collected: true },
  { name: 'C. Osei', year: 'Y6', bookedUntil: '18:00', collectedBy: '—', collectedTime: '—', activity: 'Homework Club', send: false, collected: false },
  { name: 'E. Clarke', year: 'Y2', bookedUntil: '17:30', collectedBy: 'James Clarke', collectedTime: '17:28', activity: 'Arts & Crafts', send: false, collected: true },
]

const BOOKINGS = [
  { name: 'T. Morris', year: 'Y4', type: 'Regular', sessions: ['BC', 'ASC'], daysPerWeek: 5, paymentStatus: 'Paid', method: 'Tax-Free Childcare', totalPerTerm: 285 },
  { name: 'L. Chen', year: 'Y3', type: 'Regular', sessions: ['ASC'], daysPerWeek: 5, paymentStatus: 'Paid', method: 'Universal Credit', totalPerTerm: 195 },
  { name: 'S. Williams', year: 'Y5', type: 'Regular', sessions: ['ASC'], daysPerWeek: 3, paymentStatus: 'Overdue', method: 'Bank transfer', totalPerTerm: 117 },
  { name: 'F. Ahmed', year: 'Y5', type: 'Regular', sessions: ['ASC'], daysPerWeek: 5, paymentStatus: 'Paid', method: 'ParentPay', totalPerTerm: 195 },
  { name: 'R. Brown', year: 'Y1', type: 'Regular', sessions: ['BC'], daysPerWeek: 5, paymentStatus: 'Free (FSM)', method: '—', totalPerTerm: 0 },
  { name: 'D. Mensah', year: 'Y4', type: 'Regular', sessions: ['BC', 'ASC'], daysPerWeek: 5, paymentStatus: 'Paid', method: 'Childcare Vouchers', totalPerTerm: 285 },
  { name: 'C. Osei', year: 'Y6', type: 'Ad-hoc', sessions: ['ASC'], daysPerWeek: 2, paymentStatus: 'Overdue', method: 'Bank transfer', totalPerTerm: 78 },
  { name: 'K. Yeboah', year: 'Y5', type: 'Regular', sessions: ['BC'], daysPerWeek: 3, paymentStatus: 'Paid', method: 'ParentPay', totalPerTerm: 0 },
]

const WAITING_LIST = [
  { name: 'New pupil A', year: 'Y2', requested: 'BC + ASC', since: '10 Mar 2025', priority: 'FSM' },
  { name: 'New pupil B', year: 'Y4', requested: 'ASC', since: '14 Mar 2025', priority: 'Standard' },
  { name: 'New pupil C', year: 'Y1', requested: 'BC', since: '18 Mar 2025', priority: 'SEND' },
]

const STAFF = [
  { name: 'Mrs. Hall', role: 'Club Manager', qualLevel: 3, dbs: true, firstAid: true, safeguarding: true, foodHygiene: true, sessions: 'BC + ASC' },
  { name: 'Mr. Clarke', role: 'Playworker', qualLevel: 2, dbs: true, firstAid: true, safeguarding: true, foodHygiene: false, sessions: 'BC + ASC' },
  { name: 'Ms. Perry', role: 'Playworker', qualLevel: 2, dbs: true, firstAid: false, safeguarding: true, foodHygiene: true, sessions: 'ASC' },
  { name: 'Mrs. Okafor', role: 'Assistant', qualLevel: 2, dbs: true, firstAid: false, safeguarding: false, foodHygiene: false, sessions: 'BC' },
]

const ACTIVITIES_THIS_WEEK = [
  { day: 'Mon', bc: 'Quiet reading / Lego', asc: 'Sports (outdoor)' },
  { day: 'Tue', bc: 'Drawing / colouring', asc: 'Arts & Crafts' },
  { day: 'Wed', bc: 'Board games', asc: 'Homework Club' },
  { day: 'Thu', bc: 'Story time', asc: 'Sports (indoor)' },
  { day: 'Fri', bc: 'Cooking club (Y4–Y6)', asc: 'Free play / Games' },
]

const HAF_SESSIONS = [
  { period: 'Easter 2025', dates: '15–17 Apr', capacity: 24, booked: 18, fsm: 14, activities: 'Sports, art, cooking', status: 'Confirmed' },
  { period: 'Summer 2025', dates: '28 Jul–8 Aug', capacity: 30, booked: 8, fsm: 0, activities: 'TBC', status: 'Planning' },
]

// ─── Tab content ──────────────────────────────────────────────────────────────

function OverviewTab({ onAction }: { onAction: (s: string) => void }) {
  const bcCheckedIn = TODAY_REGISTER_BC.filter(p => p.checkedIn).length
  const ascPresent = TODAY_REGISTER_ASC.filter(p => !p.collected).length
  const ascTotal = TODAY_REGISTER_ASC.length
  const ratio = ascPresent <= 8 ? '✓ 1:8 Met' : ascPresent <= 16 ? '✓ 1:8 Met (2 staff)' : '⚠ Check ratios'
  const ratioOk = ascPresent <= 16

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Live status banner */}
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }} />
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Live — Tuesday 24 Mar 2026</p>
          <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>After School Club in session · 15:30</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: '🥣 Breakfast Club', value: `${bcCheckedIn}/${TODAY_REGISTER_BC.length}`, sub: 'Attended this morning', color: '#F59E0B' },
            { label: '🌅 After School', value: `${ascPresent} present`, sub: `${TODAY_REGISTER_ASC.filter(p => p.collected).length} collected`, color: '#0D9488' },
            { label: '👥 Staff on duty', value: '3', sub: `Ratio: ${ratio}`, color: ratioOk ? '#22C55E' : '#EF4444' },
            { label: '💰 Income today', value: '£73.50', sub: '3 ad-hoc bookings', color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-black mt-0.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Policy callout */}
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #1a1f35, #141929)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p className="text-xs font-bold mb-1" style={{ color: '#A5B4FC' }}>📋 Children's Wellbeing & Schools Bill — Free Breakfast Clubs Now Statutory</p>
        <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
          National rollout from April 2026. All state primary schools must offer a free breakfast club (minimum 30 mins, 8am start) for every pupil in Reception–Year 6. DfE funds early adopters directly. Schools must track attendance and return data to DfE termly.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
          {[
            { label: 'Free BC', desc: 'Statutory from Apr 2026 · All primaries · Rec–Y6' },
            { label: 'Wraparound', desc: 'Expected 8am–6pm on site · Paid childcare · Working families' },
            { label: 'HAF Programme', desc: '£200m+ pa · Free holiday provision for FSM pupils' },
          ].map(p => (
            <div key={p.label} className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="font-semibold" style={{ color: '#C7D2FE' }}>{p.label}</p>
              <p className="mt-0.5" style={{ color: '#9CA3AF' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Registered (BC)" value="28" sub="18 free · 10 paid" color="#F59E0B" />
        <StatCard label="Registered (ASC)" value="34" sub="32 regular · 2 ad-hoc" color="#0D9488" />
        <StatCard label="Waiting List" value="3" sub="1 SEND · 1 FSM priority" color="#8B5CF6" />
        <StatCard label="Overdue Payments" value="2" sub="£195 outstanding" color="#EF4444" alert />
      </div>

      {/* Alerts */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>ALERTS</p>
        <div className="flex flex-col gap-2">
          <AlertRow level="high" text="S. Williams — payment overdue (£117, 3 weeks)" sub="Bank transfer not received. Contact Diane Williams: 07556 789012" />
          <AlertRow level="high" text="C. Osei — payment overdue (£78, 1 week)" sub="Ad-hoc bookings unpaid. Automated reminder sent Mon." />
          <AlertRow level="medium" text="Mrs. Okafor — first aid and safeguarding training outstanding" sub="Statutory requirement — must complete before next session" />
          <AlertRow level="medium" text="DfE Breakfast Club data return due — 31 Mar" sub="Termly attendance data required for grant compliance" />
          <AlertRow level="low" text="3 pupils on waiting list — spaces may be available after April" sub="Review capacity and notify parents" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>QUICK ACTIONS</p>
        <div className="flex flex-wrap gap-2">
          {['Take register', 'Log collection', 'Record incident', 'Chase payment', 'Add booking', 'DfE data return'].map(a => (
            <button key={a} onClick={() => onAction(a)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: '#1F2937', color: '#D1D5DB', border: '1px solid #374151' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0D9488'; e.currentTarget.style.color = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#D1D5DB' }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* This week activities */}
      <Card>
        <SectionHeader title="This Week's Activity Programme" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-3 gap-3 px-5 py-2">
            {['Day', '🥣 Breakfast Club', '🌅 After School'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {ACTIVITIES_THIS_WEEK.map(a => (
            <div key={a.day} className="grid grid-cols-3 gap-3 px-5 py-3">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{a.day}</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{a.bc}</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{a.asc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function BreakfastTab() {
  const attended = TODAY_REGISTER_BC.filter(p => p.checkedIn).length
  const fsmCount = TODAY_REGISTER_BC.filter(p => p.fsm).length

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Free BC policy banner */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#FCD34D' }}>🥣 Free Breakfast Club — National Rollout April 2026</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Funded by DfE. Open to ALL pupils Rec–Y6 free of charge. Minimum 30 mins before school, starting 8am. School must provide enrichment activities (not just food). DfE data return required each term. School is an <strong style={{ color: '#FCD34D' }}>Early Adopter</strong> — joined April 2025.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Attended Today" value={`${attended}`} sub={`of ${TODAY_REGISTER_BC.length} booked`} color="#F59E0B" />
        <StatCard label="FSM Pupils" value={`${fsmCount}`} sub="Free breakfast eligible" color="#22C55E" />
        <StatCard label="Hot Meals Today" value="6" sub="Cereal + toast: 2" color="#0D9488" />
        <StatCard label="This Week Average" value="26" sub="vs 24 last week" color="#8B5CF6" />
      </div>

      {/* Today's register */}
      <Card>
        <SectionHeader title="Today's Breakfast Club Register" badge={`${attended}/${TODAY_REGISTER_BC.length} present`} badgeColor="#F59E0B" badgeBg="rgba(245,158,11,0.12)" action="Print register →" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-6 gap-3 px-5 py-2">
            {['Name', 'Year', 'Arrived', 'Meal', 'FSM', 'Status'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {TODAY_REGISTER_BC.map(p => (
            <div key={p.name} className="grid grid-cols-6 gap-3 px-5 py-3 items-center"
              style={{ backgroundColor: !p.checkedIn ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.name}</p>
                {p.send && <Badge label="SEND" color="#8B5CF6" bg="rgba(139,92,246,0.15)" />}
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.year}</p>
              <p className="text-sm" style={{ color: p.checkedIn ? '#22C55E' : '#EF4444' }}>{p.arrived}</p>
              <Badge label={p.meal} color={p.meal === 'Hot' ? '#F59E0B' : '#9CA3AF'} bg={p.meal === 'Hot' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)'} />
              <span style={{ color: p.fsm ? '#22C55E' : '#4B5563', fontSize: '0.75rem' }}>{p.fsm ? '✓ FSM' : '—'}</span>
              <Badge label={p.checkedIn ? 'Present' : 'Absent'} color={p.checkedIn ? '#22C55E' : '#EF4444'} bg={p.checkedIn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'} />
            </div>
          ))}
        </div>
      </Card>

      {/* DfE grant tracker */}
      <Card>
        <SectionHeader title="DfE Free Breakfast Club Grant Tracker" />
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Grant Allocated" value="£8,400" sub="2025/26 academic year" color="#0D9488" />
            <StatCard label="Spent to Date" value="£5,230" sub="62% — on track" color="#22C55E" />
            <StatCard label="Pupils Accessing" value="28" sub="Avg daily attendance: 26" color="#F59E0B" />
            <StatCard label="Data Return Due" value="31 Mar" sub="Termly DfE requirement" color="#F97316" alert />
          </div>
          <div>
            <p className="text-xs font-semibold mb-3 uppercase" style={{ color: '#9CA3AF' }}>GRANT COMPLIANCE CHECKLIST</p>
            <div className="flex flex-col gap-0">
              {[
                { label: 'Breakfast club open to ALL Rec–Y6 pupils', done: true },
                { label: 'Minimum 30 minutes before school start', done: true },
                { label: 'Starts at 8am or earlier', done: true },
                { label: 'Food provided (hot or cold)', done: true },
                { label: 'Enrichment activities delivered (not just food)', done: true },
                { label: 'Autumn term data return submitted to DfE', done: true },
                { label: 'Spring term data return (due 31 Mar)', done: false },
                { label: 'Manager holds Level 3 qualification', done: true },
                { label: '50% staff hold Level 2 qualification', done: true },
                { label: 'Ofsted Early Years/Childcare Register — current', done: true },
                { label: 'Staff:child ratio maintained (1:8 for under-8s)', done: true },
                { label: 'All staff DBS checked', done: true },
              ].map(i => <CheckItem key={i.label} label={i.label} done={i.done} />)}
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance trend */}
      <Card>
        <SectionHeader title="Breakfast Club — Attendance Trend (This Term)" />
        <div className="p-5">
          <div className="flex items-end gap-1.5 h-24">
            {[
              { w: 'W1', v: 22 }, { w: 'W2', v: 24 }, { w: 'W3', v: 23 }, { w: 'W4', v: 26 },
              { w: 'W5', v: 25 }, { w: 'W6', v: 27 }, { w: 'W7', v: 26 }, { w: 'W8', v: 26 },
            ].map(d => (
              <div key={d.w} className="flex flex-col items-center flex-1">
                <span className="text-xs mb-1 font-semibold" style={{ color: '#F59E0B' }}>{d.v}</span>
                <div className="w-full rounded-t" style={{ height: `${(d.v / 30) * 72}px`, backgroundColor: '#F59E0B', opacity: 0.8 }} />
                <span className="text-xs mt-1" style={{ color: '#6B7280' }}>{d.w}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Capacity: 30 · Average this term: 24.9 · Trend: ↑ improving</p>
        </div>
      </Card>
    </div>
  )
}

function AfterSchoolTab() {
  const present = TODAY_REGISTER_ASC.filter(p => !p.collected).length
  const collected = TODAY_REGISTER_ASC.filter(p => p.collected).length

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Currently In Club" value={`${present}`} sub={`${collected} already collected`} color="#0D9488" />
        <StatCard label="Staff on Duty" value="3" sub="Ratio: ✓ 1:8 met" color="#22C55E" />
        <StatCard label="Booked to 6pm" value="4" sub="Latest pickup 18:00" color="#8B5CF6" />
        <StatCard label="Incidents Today" value="0" sub="No incidents logged" color="#22C55E" />
      </div>

      {/* Live register */}
      <Card>
        <SectionHeader
          title="After School Club — Live Register"
          badge={`${present} present`}
          badgeColor="#0D9488"
          badgeBg="rgba(13,148,136,0.12)"
          action="Log collection →"
        />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid gap-3 px-5 py-2" style={{ gridTemplateColumns: '1.5fr 60px 80px 100px 120px 100px 80px' }}>
            {['Name', 'Year', 'Until', 'Activity', 'Collected by', 'Time', 'Status'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {TODAY_REGISTER_ASC.map(p => (
            <div key={p.name} className="grid gap-3 px-5 py-3 items-center"
              style={{
                gridTemplateColumns: '1.5fr 60px 80px 100px 120px 100px 80px',
                backgroundColor: !p.collected ? 'rgba(13,148,136,0.03)' : 'transparent',
              }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{p.name}</p>
                {p.send && <Badge label="SEND" color="#8B5CF6" bg="rgba(139,92,246,0.15)" />}
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.year}</p>
              <p className="text-xs font-semibold" style={{ color: '#D1D5DB' }}>{p.bookedUntil}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.activity}</p>
              <p className="text-xs" style={{ color: p.collected ? '#22C55E' : '#6B7280' }}>{p.collectedBy}</p>
              <p className="text-xs" style={{ color: p.collected ? '#22C55E' : '#4B5563' }}>{p.collectedTime}</p>
              <Badge
                label={p.collected ? 'Collected' : 'In club'}
                color={p.collected ? '#22C55E' : '#0D9488'}
                bg={p.collected ? 'rgba(34,197,94,0.12)' : 'rgba(13,148,136,0.12)'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Ratio dashboard */}
      <Card>
        <SectionHeader title="Staff:Child Ratio Compliance" badge="✓ Met" badgeColor="#22C55E" badgeBg="rgba(34,197,94,0.12)" />
        <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold mb-3 uppercase" style={{ color: '#9CA3AF' }}>OFSTED REQUIRED RATIOS</p>
            {[
              { label: 'Under 5s (Early Years)', ratio: '1:8', current: '1:4', ok: true },
              { label: 'Ages 5–7 (Childcare Register)', ratio: '1:8', current: '1:7', ok: true },
              { label: 'Ages 8+ (recommended)', ratio: '1:10', current: '1:6', ok: true },
              { label: 'Minimum 2 staff always', ratio: '2 staff', current: '3 staff', ok: true },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{r.label}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Required: {r.ratio} · Current: {r.current}</p>
                </div>
                <span style={{ color: r.ok ? '#22C55E' : '#EF4444' }}>{r.ok ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold mb-3 uppercase" style={{ color: '#9CA3AF' }}>STAFF ON DUTY NOW</p>
            {STAFF.filter(s => s.sessions.includes('ASC')).map(s => (
              <div key={s.name} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: '#1F2937', color: '#0D9488' }}>{s.name[0]}</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{s.role} · L{s.qualLevel}</p>
                </div>
                <div className="flex gap-1">
                  {s.firstAid && <Badge label="FA" color="#22C55E" bg="rgba(34,197,94,0.12)" />}
                  {s.safeguarding && <Badge label="SG" color="#0D9488" bg="rgba(13,148,136,0.12)" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function BookingsTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Bookings" value="42" sub="Regular + ad-hoc" color="#0D9488" />
        <StatCard label="Regular Contracts" value="38" sub="Termly / annual" color="#22C55E" />
        <StatCard label="Ad-hoc Bookings" value="4" sub="This week" color="#F59E0B" />
        <StatCard label="Waiting List" value="3" sub="1 SEND priority" color="#8B5CF6" />
      </div>

      {/* Bookings table */}
      <Card>
        <SectionHeader title="All Bookings" action="Export →" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid gap-3 px-5 py-2" style={{ gridTemplateColumns: '1.5fr 60px 80px 80px 80px 100px 80px' }}>
            {['Pupil', 'Year', 'Type', 'Sessions', 'Days/wk', 'Payment', 'Term cost'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {BOOKINGS.map((b, i) => (
            <div key={b.name} className="grid gap-3 px-5 py-3 items-center"
              style={{
                gridTemplateColumns: '1.5fr 60px 80px 80px 80px 100px 80px',
                backgroundColor: b.paymentStatus === 'Overdue' ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{b.name}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{b.year}</p>
              <Badge label={b.type} color={b.type === 'Regular' ? '#0D9488' : '#F59E0B'} bg={b.type === 'Regular' ? 'rgba(13,148,136,0.12)' : 'rgba(245,158,11,0.12)'} />
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{b.sessions.join(' + ')}</p>
              <p className="text-xs text-center" style={{ color: '#D1D5DB' }}>{b.daysPerWeek}</p>
              <div>
                <Badge
                  label={b.paymentStatus}
                  color={b.paymentStatus === 'Paid' ? '#22C55E' : b.paymentStatus === 'Free (FSM)' ? '#0D9488' : '#EF4444'}
                  bg={b.paymentStatus === 'Paid' ? 'rgba(34,197,94,0.12)' : b.paymentStatus === 'Free (FSM)' ? 'rgba(13,148,136,0.12)' : 'rgba(239,68,68,0.12)'}
                />
                {b.paymentStatus !== 'Free (FSM)' && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{b.method}</p>}
              </div>
              <p className="text-sm font-semibold" style={{ color: b.totalPerTerm === 0 ? '#0D9488' : '#D1D5DB' }}>
                {b.totalPerTerm === 0 ? 'Free' : `£${b.totalPerTerm}`}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Waiting list */}
      <Card>
        <SectionHeader title="Waiting List" badge={`${WAITING_LIST.length} pupils`} badgeColor="#8B5CF6" badgeBg="rgba(139,92,246,0.15)" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {WAITING_LIST.map(w => (
            <div key={w.name} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{w.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{w.year} · Requested: {w.requested} · Since: {w.since}</p>
              </div>
              <Badge
                label={w.priority}
                color={w.priority === 'FSM' ? '#22C55E' : w.priority === 'SEND' ? '#8B5CF6' : '#9CA3AF'}
                bg={w.priority === 'FSM' ? 'rgba(34,197,94,0.12)' : w.priority === 'SEND' ? 'rgba(139,92,246,0.15)' : 'rgba(107,114,128,0.12)'}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function FinanceTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Income This Term" value="£6,840" sub="Paid + grant" color="#22C55E" />
        <StatCard label="DfE Grant (BC)" value="£2,100" sub="Spring term allocation" color="#0D9488" />
        <StatCard label="Parent Fees" value="£4,740" sub="After school charges" color="#8B5CF6" />
        <StatCard label="Outstanding" value="£195" sub="2 families · 3 weeks" color="#EF4444" alert />
      </div>

      {/* Payment methods breakdown */}
      <Card>
        <SectionHeader title="Payment Methods — This Term" />
        <div className="p-5 flex flex-col gap-3">
          {[
            { method: 'Tax-Free Childcare', families: 8, amount: 1840, pct: 38.8 },
            { method: 'Universal Credit (childcare)', families: 5, amount: 1120, pct: 23.6 },
            { method: 'Childcare Vouchers', families: 4, amount: 890, pct: 18.8 },
            { method: 'ParentPay / Bank transfer', families: 6, amount: 890, pct: 18.8 },
          ].map(m => (
            <div key={m.method}>
              <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                <span>{m.method} · {m.families} families</span>
                <span>£{m.amount.toLocaleString()} ({m.pct}%)</span>
              </div>
              <ProgressBar value={m.pct} color="#0D9488" />
            </div>
          ))}
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
            Tip: Tax-Free Childcare and Universal Credit give parents 20–85% back on childcare costs — encourage sign-up.
          </p>
        </div>
      </Card>

      {/* Outstanding payments */}
      <Card>
        <SectionHeader title="Outstanding Payments" badge="2 families" badgeColor="#EF4444" badgeBg="rgba(239,68,68,0.12)" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {[
            { name: 'S. Williams', year: 'Y5', amount: 117, weeks: 3, contact: '07556 789012', lastChased: '21 Mar' },
            { name: 'C. Osei', year: 'Y6', amount: 78, weeks: 1, contact: '07789 456789', lastChased: '24 Mar' },
          ].map(p => (
            <div key={p.name} className="px-5 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{p.name} ({p.year})</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Overdue {p.weeks} week{p.weeks > 1 ? 's' : ''} · Last chased: {p.lastChased}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone size={10} style={{ color: '#6B7280' }} />
                    <p className="text-xs" style={{ color: '#6B7280' }}>{p.contact}</p>
                  </div>
                </div>
                <p className="text-lg font-black" style={{ color: '#EF4444' }}>£{p.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue summary chart */}
      <Card>
        <SectionHeader title="Monthly Revenue — This Academic Year" />
        <div className="p-5">
          <div className="flex items-end gap-2 h-24">
            {[
              { m: 'Sep', v: 780 }, { m: 'Oct', v: 820 }, { m: 'Nov', v: 790 }, { m: 'Dec', v: 420 },
              { m: 'Jan', v: 860 }, { m: 'Feb', v: 840 }, { m: 'Mar', v: 610 },
            ].map(d => (
              <div key={d.m} className="flex flex-col items-center flex-1">
                <span className="text-xs mb-1 font-semibold" style={{ color: '#0D9488' }}>£{d.v}</span>
                <div className="w-full rounded-t" style={{ height: `${(d.v / 900) * 72}px`, backgroundColor: '#0D9488', opacity: 0.8 }} />
                <span className="text-xs mt-1" style={{ color: '#6B7280' }}>{d.m}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Dec reduced — half term. Mar partial. Excludes DfE grant income.</p>
        </div>
      </Card>
    </div>
  )
}

function StaffComplianceTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Staff in Club" value="4" sub="BC and ASC combined" color="#0D9488" />
        <StatCard label="DBS Checked" value="4/4" sub="All current" color="#22C55E" />
        <StatCard label="L3 Qualified Manager" value="Yes" sub="Mrs. Hall · L3 Childcare" color="#22C55E" />
        <StatCard label="Training Gaps" value="3" sub="First aid · food hygiene · SG" color="#EF4444" alert />
      </div>

      {/* Staff matrix */}
      <Card>
        <SectionHeader title="Staff Qualifications & Compliance" />
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-8 gap-2 px-5 py-2" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0A0B11' }}>
              {['Name', 'Role', 'Level', 'DBS', 'First Aid', 'Safeguarding', 'Food Hygiene', 'Sessions'].map(h => (
                <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
              ))}
            </div>
            {STAFF.map((s, i) => (
              <div key={s.name} className="grid grid-cols-8 gap-2 px-5 py-3 items-center"
                style={{ borderBottom: '1px solid #1F2937', backgroundColor: (!s.firstAid || !s.safeguarding) ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.role}</p>
                <Badge label={`L${s.qualLevel}`} color={s.qualLevel >= 3 ? '#22C55E' : '#0D9488'} bg={s.qualLevel >= 3 ? 'rgba(34,197,94,0.12)' : 'rgba(13,148,136,0.12)'} />
                {[s.dbs, s.firstAid, s.safeguarding, s.foodHygiene].map((v, j) => (
                  <span key={j} style={{ color: v ? '#22C55E' : '#EF4444', fontSize: '1rem' }}>{v ? '✓' : '✗'}</span>
                ))}
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.sessions}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4">
          <AlertRow level="medium" text="Mrs. Okafor — first aid, safeguarding and food hygiene outstanding" sub="Statutory requirements before next session. Book training immediately." />
        </div>
      </Card>

      {/* Ofsted compliance */}
      <Card>
        <SectionHeader title="Ofsted Childcare Register — Compliance" badge="Registered" badgeColor="#22C55E" badgeBg="rgba(34,197,94,0.12)" />
        <div className="px-5 pb-5 pt-3 grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-8">
          {[
            { label: 'Registered on Early Years Register (under-5s)', done: true },
            { label: 'Registered on Compulsory Childcare Register (5–8)', done: true },
            { label: 'Public liability insurance in place', done: true },
            { label: 'Health & safety risk assessments current', done: true },
            { label: 'Fire evacuation procedure — club specific', done: true },
            { label: 'Complaints policy displayed / accessible', done: true },
            { label: 'Equal opportunities policy current', done: true },
            { label: 'Ofsted inspection due (last: Sep 2023)', done: true },
            { label: 'All staff DBS — on SCR', done: true },
            { label: 'Manager holds L3 qualification', done: true },
            { label: '50% staff hold L2 qualification', done: true },
            { label: 'Staff:child ratios documented and maintained', done: true },
          ].map(i => <CheckItem key={i.label} label={i.label} done={i.done} />)}
        </div>
      </Card>
    </div>
  )
}

function HolidayClubTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      {/* HAF policy */}
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#A5B4FC' }}>🏖️ Holiday Activities & Food (HAF) Programme</p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Government-funded via local authorities. Over £200m per year. Provides FREE holiday provision (4 hours/day, 4 days/week) for children eligible for benefits-related FSM in Reception–Year 11. Includes healthy food and enriching activities. Schools can run their own HAF provision or refer pupils to LA-run sessions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="FSM Pupils Eligible" value="18" sub="HAF entitled this school" color="#8B5CF6" />
        <StatCard label="Easter Booked" value="14" sub="of 18 eligible" color="#22C55E" />
        <StatCard label="Summer (planned)" value="8" sub="Bookings open soon" color="#F59E0B" />
        <StatCard label="LA HAF Coordinator" value="Contact" sub="Refer unplaced FSM pupils" color="#0D9488" />
      </div>

      {/* HAF sessions */}
      <Card>
        <SectionHeader title="HAF Sessions — This Year" />
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-6 gap-3 px-5 py-2">
            {['Period', 'Dates', 'Capacity', 'Booked', 'FSM Places', 'Status'].map(h => (
              <p key={h} className="text-xs font-medium" style={{ color: '#6B7280' }}>{h}</p>
            ))}
          </div>
          {HAF_SESSIONS.map(s => (
            <div key={s.period} className="grid grid-cols-6 gap-3 px-5 py-3 items-center">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{s.period}</p>
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{s.dates}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{s.capacity}</p>
              <p className="text-sm font-bold" style={{ color: '#0D9488' }}>{s.booked}</p>
              <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{s.fsm || 'TBC'}</p>
              <Badge
                label={s.status}
                color={s.status === 'Confirmed' ? '#22C55E' : '#F59E0B'}
                bg={s.status === 'Confirmed' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Easter club */}
      <Card>
        <SectionHeader title="Easter Holiday Club 2025 — Programme" badge="15–17 Apr" badgeColor="#F59E0B" badgeBg="rgba(245,158,11,0.12)" />
        <div className="p-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { day: 'Tuesday 15 Apr', theme: '🎨 Art & Design Day', activities: 'Painting, clay, collage, outdoor art trail. Led by Mrs. Hall + visiting artist.' },
            { day: 'Wednesday 16 Apr', theme: '⚽ Sports Day', activities: 'Multi-sports, team games, mini Olympics. Led by Mr. Clarke + sports coach.' },
            { day: 'Thursday 17 Apr', theme: '🍳 Cooking Club', activities: 'Healthy recipes, food science, tasting. Led by Ms. Perry + parent volunteer.' },
          ].map(d => (
            <div key={d.day} className="rounded-xl p-3" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#0D9488' }}>{d.day}</p>
              <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{d.theme}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{d.activities}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* FSM not yet booked */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: '#C4B5FD' }}>FSM Pupils Not Yet Booked — Easter</p>
        <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>4 FSM-eligible pupils have not yet booked Easter provision. Contact families and refer to LA HAF coordinator if school places not taken.</p>
        <div className="flex flex-wrap gap-2 text-xs" style={{ color: '#D1D5DB' }}>
          {['R. Brown (Y1)', 'O. Hassan (Y4)', 'K. Yeboah (Y5)', 'M. Osei (Rec)'].map(n => (
            <span key={n} className="rounded-lg px-2 py-1" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#C4B5FD' }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Session settings */}
        <Card>
          <SectionHeader title="Session Times & Pricing" />
          <div className="p-5 flex flex-col gap-3">
            {[
              { label: 'Breakfast Club Start', value: '07:45', note: 'Free (DfE funded)' },
              { label: 'School Day Start', value: '08:55', note: '' },
              { label: 'After School Club Start', value: '15:15', note: '£6.50 / session' },
              { label: 'After School Club End', value: '18:00', note: '£7.50 after 17:30' },
              { label: 'Ad-hoc booking fee', value: '£7.50', note: 'Subject to availability' },
              { label: 'Sibling discount', value: '10%', note: 'Second child onwards' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</span>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.value}</span>
                  {s.note && <p className="text-xs" style={{ color: '#6B7280' }}>{s.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Capacity */}
        <Card>
          <SectionHeader title="Capacity" />
          <div className="p-5 flex flex-col gap-3">
            {[
              { session: '🥣 Breakfast Club', capacity: 30, booked: 28, color: '#F59E0B' },
              { session: '🌅 After School (3:15–5:00)', capacity: 24, booked: 22, color: '#0D9488' },
              { session: '🌆 After School (5:00–6:00)', capacity: 16, booked: 12, color: '#8B5CF6' },
            ].map(c => (
              <div key={c.session}>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                  <span>{c.session}</span>
                  <span style={{ color: c.booked >= c.capacity ? '#EF4444' : '#D1D5DB' }}>{c.booked}/{c.capacity} places</span>
                </div>
                <ProgressBar value={(c.booked / c.capacity) * 100} color={c.booked >= c.capacity ? '#EF4444' : c.color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Ofsted reg */}
        <Card>
          <SectionHeader title="Ofsted Registration" />
          <div className="p-5 flex flex-col gap-2">
            {[
              { label: 'Registration status', value: 'Registered — Early Years + Compulsory Childcare Register' },
              { label: 'Ofsted number', value: 'EY123456' },
              { label: 'Last inspection', value: 'Sep 2023 — Met' },
              { label: 'Next inspection (est.)', value: 'Sep 2026' },
              { label: 'Insurance provider', value: 'Zurich Municipal' },
              { label: 'Insurance renewal', value: 'August 2025' },
            ].map(s => (
              <div key={s.label} className="flex items-start gap-3 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <span className="text-xs w-36 flex-shrink-0" style={{ color: '#6B7280' }}>{s.label}</span>
                <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <SectionHeader title="Club Contacts" />
          <div className="p-5 flex flex-col gap-2">
            {[
              { label: 'Club Manager', value: 'Mrs. Hall · 07712 000001' },
              { label: 'Emergency (out of hours)', value: 'Mrs. Hall mobile: 07712 000001' },
              { label: 'DfE Breakfast Club lead', value: 'dfe.breakfastclubs@education.gov.uk' },
              { label: 'LA Wraparound lead', value: 'Milton Keynes Council · 01908 000000' },
              { label: 'LA HAF coordinator', value: 'haf@milton-keynes.gov.uk' },
            ].map(s => (
              <div key={s.label} className="flex items-start gap-3 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <span className="text-xs w-36 flex-shrink-0" style={{ color: '#6B7280' }}>{s.label}</span>
                <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'breakfast', label: '🥣 Breakfast Club' },
  { id: 'afterschool', label: '🌅 After School' },
  { id: 'bookings', label: '📅 Bookings' },
  { id: 'finance', label: '💰 Finance' },
  { id: 'staff', label: '👥 Staff & Compliance' },
  { id: 'holiday', label: '🏖️ Holiday Club' },
  { id: 'settings', label: '⚙️ Settings' },
]

export default function WraparoundPage() {
  const hasData = useHasSchoolData('wraparound')
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState('')
  if (hasData === null) return null
  if (!hasData) return <SchoolEmptyState pageKey="wraparound" title="No wraparound data yet" description="Upload your breakfast and after school club data to activate Pre & After School." uploads={[{ key: 'wraparound', label: 'Upload Club Register (CSV)' }]} />

  function fireToast(action: string) {
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Pre & After School</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
          Wraparound childcare · Breakfast club · After school club · HAF holiday provision
        </p>
      </div>

      <DeptAISummary dept="wraparound" portal="schools" />

      {/* AI highlights */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
          <Sparkles size={14} style={{ color: '#0D9488' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Summary</span>
          <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated just now</span>
        </div>
        <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#07080F' }}>
          {[
            'Breakfast club attended by 22 of 28 registered pupils this morning (78.6%) — on track for DfE data return due 31 March.',
            'After school club: 4 pupils still in club, 4 already collected. All staff:child ratios met. No incidents today.',
            '2 families have overdue payments totalling £195 — S. Williams (£117, 3 weeks) and C. Osei (£78, 1 week). Automated reminders sent.',
            'Mrs. Okafor has 3 outstanding statutory training requirements (first aid, safeguarding, food hygiene) — action before next session.',
            'Easter HAF: 14 of 18 FSM-eligible pupils booked. 4 families not yet engaged — contact recommended before end of term.',
            'Children\'s Wellbeing & Schools Bill: free breakfast clubs are now statutory from April 2026. This school is already an Early Adopter — national rollout now begins.',
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <SubTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'overview' && <OverviewTab onAction={fireToast} />}
        {tab === 'breakfast' && <BreakfastTab />}
        {tab === 'afterschool' && <AfterSchoolTab />}
        {tab === 'bookings' && <BookingsTab />}
        {tab === 'finance' && <FinanceTab />}
        {tab === 'staff' && <StaffComplianceTab />}
        {tab === 'holiday' && <HolidayClubTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
