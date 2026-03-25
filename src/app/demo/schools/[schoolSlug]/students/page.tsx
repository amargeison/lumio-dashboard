'use client'
import React, { useState, useMemo } from 'react'
import { Search, Filter, ChevronRight, X, AlertTriangle, User, BookOpen, Shield, Activity, Phone, Heart, Users, FileText, Star } from 'lucide-react'
import SchoolEmptyState from '@/components/dashboard/SchoolEmptyState'
import { useHasSchoolData } from '@/components/dashboard/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'all' | 'teacher' | 'senco' | 'dsl' | 'pastoral' | 'admin'
type FilterKey = 'year' | 'send' | 'pp' | 'lac' | 'eal' | 'fsm' | 'all'

interface Pupil {
  id: number
  name: string
  year: string
  dob: string
  gender: 'M' | 'F'
  ethnicity: string
  eal: boolean
  fsm: boolean
  pp: boolean
  lac: boolean
  youngCarer: boolean
  // SEND
  sendStatus: 'None' | 'Monitoring' | 'SEN Support' | 'EHCP'
  sendNeed?: string
  sendTier?: 'Universal' | 'Targeted' | 'Targeted+' | 'Specialist'
  ispStatus?: 'Active' | 'Draft' | 'Review due'
  // Academic
  readingAge?: string
  bookBand?: string
  phonicsPhase?: string
  mathsGroup?: string
  attainment: 'Above' | 'Expected' | 'Below'
  attendancePct: number
  // Safeguarding
  safeguardingFlag: boolean
  cpStatus?: string
  socialWorker?: string
  // Medical
  medicalNotes?: string
  dietary?: string
  medication?: string
  // Contact
  parent1: string
  parent1Phone: string
  parent2?: string
  parent2Phone?: string
  // Pastoral
  behaviourNotes?: string
  passportSummary?: string
  keyStrengths?: string[]
  supportStrategies?: string[]
  // Interventions
  interventions?: string[]
  // Class
  class: string
  classTeacher: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const PUPILS: Pupil[] = [
  {
    id: 1, name: 'T. Morris', year: 'Year 4', dob: '12/09/2015', gender: 'M', class: '4M', classTeacher: 'Mrs. Mitchell',
    ethnicity: 'White British', eal: false, fsm: true, pp: true, lac: false, youngCarer: false,
    sendStatus: 'EHCP', sendNeed: 'SEMH', sendTier: 'Specialist', ispStatus: 'Active',
    readingAge: '7y 6m', bookBand: 'Purple', attainment: 'Below', attendancePct: 91.4,
    safeguardingFlag: false, medicalNotes: 'ADHD — takes Ritalin at 12pm daily', dietary: 'None', medication: 'Ritalin 10mg (lunchtime)',
    parent1: 'Sara Morris', parent1Phone: '07712 345678', parent2: 'Dan Morris', parent2Phone: '07798 765432',
    passportSummary: 'T. learns best with clear structure, movement breaks and 1:1 check-ins. He loves football and Minecraft.',
    keyStrengths: ['Creative', 'Enthusiastic', 'Strong verbal reasoning', 'Excellent spatial awareness'],
    supportStrategies: ['Chunked tasks — max 3 steps', 'Fidget tools allowed at desk', 'Seat near front, away from window', '5-min movement break every 45 mins', 'Explicit praise for effort'],
    behaviourNotes: 'Can become dysregulated after unstructured time. De-escalation: low voice, neutral tone, give space.',
    interventions: ['SEMH Thrive (2x weekly)', 'Reading Recovery (daily)', '1:1 SENCO check-in (weekly)'],
  },
  {
    id: 2, name: 'A. Patel', year: 'Year 2', dob: '3/02/2017', gender: 'F', class: '2P', classTeacher: 'Mr. Peters',
    ethnicity: 'Asian — Indian', eal: false, fsm: false, pp: false, lac: false, youngCarer: false,
    sendStatus: 'SEN Support', sendNeed: 'SpLD (Dyslexia)', sendTier: 'Targeted', ispStatus: 'Active',
    readingAge: '5y 8m', bookBand: 'Orange', attainment: 'Below', attendancePct: 96.2,
    safeguardingFlag: false, medicalNotes: 'None', dietary: 'Vegetarian',
    parent1: 'Priya Patel', parent1Phone: '07834 567890',
    passportSummary: 'A. is a kind, creative pupil who enjoys art and science. She finds reading and spelling challenging.',
    keyStrengths: ['Artistic', 'Curious', 'Articulate', 'Resilient'],
    supportStrategies: ['Coloured overlay (yellow)', 'Font size 14pt minimum', 'Oral alternatives to written tasks where possible', 'Paired reading with Y5 buddy', 'Extra time for written tasks'],
    interventions: ['1:1 Literacy SpLD (3x weekly)', 'SALT vocabulary group (weekly)'],
  },
  {
    id: 3, name: 'L. Chen', year: 'Year 3', dob: '22/05/2016', gender: 'M', class: '3C', classTeacher: 'Miss Carver',
    ethnicity: 'Chinese', eal: false, fsm: false, pp: false, lac: false, youngCarer: false,
    sendStatus: 'EHCP', sendNeed: 'ASD', sendTier: 'Specialist', ispStatus: 'Active',
    readingAge: '9y 2m', bookBand: 'Gold', attainment: 'Expected', attendancePct: 97.8,
    safeguardingFlag: false, medicalNotes: 'Sensory sensitivities — noise and texture. Has ear defenders.', dietary: 'No pork (religious)',
    parent1: 'Min Chen', parent1Phone: '07923 456789', parent2: 'Fang Chen', parent2Phone: '07611 234567',
    passportSummary: 'L. is a logical, detail-focused pupil with excellent memory. Transitions and unexpected changes are challenging.',
    keyStrengths: ['Excellent memory', 'Strong maths ability', 'Methodical', 'Passionate about trains and coding'],
    supportStrategies: ['5-minute warnings before transitions', 'Visual timetable on desk', 'Ear defenders available', 'Literal, precise language', 'Quiet workspace for assessments', 'Avoid idioms/sarcasm without explanation'],
    interventions: ['Social skills group (weekly)', 'Sensory circuits (3x weekly AM)'],
  },
  {
    id: 4, name: 'S. Williams', year: 'Year 5', dob: '7/11/2014', gender: 'F', class: '5W', classTeacher: 'Mrs. Walsh',
    ethnicity: 'Black Caribbean', eal: false, fsm: true, pp: true, lac: false, youngCarer: false,
    sendStatus: 'EHCP', sendNeed: 'Hearing Impairment', sendTier: 'Specialist', ispStatus: 'Review due',
    readingAge: '10y 4m', bookBand: 'White', attainment: 'Expected', attendancePct: 93.1,
    safeguardingFlag: false, medicalNotes: 'Wears bilateral hearing aids. Radio aid in classroom — teacher must wear FM transmitter.', dietary: 'None', medication: 'None',
    parent1: 'Diane Williams', parent1Phone: '07556 789012',
    passportSummary: 'S. is a confident, articulate pupil who enjoys drama and creative writing. She lip-reads as well as uses hearing aids.',
    keyStrengths: ['Creative writer', 'Confident speaker', 'Empathetic', 'Determined'],
    supportStrategies: ['Teacher to wear FM transmitter at all times', 'Face pupil when speaking', 'Repeat questions from other pupils', 'Written instructions as backup', 'Front-row seating, good sightline to teacher', 'Avoid speaking whilst writing on board'],
    interventions: ['Deaf support teacher (fortnightly)', 'EHCP annual review due — overdue'],
  },
  {
    id: 5, name: 'R. Brown', year: 'Year 1', dob: '15/03/2018', gender: 'M', class: '1B', classTeacher: 'Miss Baker',
    ethnicity: 'Mixed — White/Black African', eal: false, fsm: true, pp: true, lac: false, youngCarer: false,
    sendStatus: 'SEN Support', sendNeed: 'SLCN', sendTier: 'Targeted+', ispStatus: 'Active',
    readingAge: '4y 10m', bookBand: 'Pink', phonicsPhase: 'Phase 3', attainment: 'Below', attendancePct: 88.4,
    safeguardingFlag: true, cpStatus: 'CiN — Neglect', socialWorker: 'Family Support Worker',
    medicalNotes: 'None', dietary: 'None',
    parent1: 'Kelly Brown', parent1Phone: '07423 890123',
    passportSummary: 'R. responds well to nurturing adults and clear routines. He loves dinosaurs and outdoor play.',
    keyStrengths: ['Enthusiastic', 'Creative play', 'Improving speech clarity', 'Loves learning when engaged'],
    supportStrategies: ['Repeat and model language back', 'SALT visual aids in classroom', 'Shortened instructions', 'Check understanding verbally', 'Breakfast club attendance (supports wellbeing and readiness to learn)', 'Nurture group on Mondays'],
    interventions: ['SALT external (weekly)', 'Nurture group (Monday)', 'Reading Recovery (daily)'],
  },
  {
    id: 6, name: 'O. Hassan', year: 'Year 4', dob: '28/06/2015', gender: 'M', class: '4M', classTeacher: 'Mrs. Mitchell',
    ethnicity: 'Black African', eal: false, fsm: true, pp: true, lac: false, youngCarer: false,
    sendStatus: 'SEN Support', sendNeed: 'SEMH / ADHD', sendTier: 'Targeted', ispStatus: 'Draft',
    readingAge: '8y 0m', bookBand: 'Gold', attainment: 'Expected', attendancePct: 89.7,
    safeguardingFlag: false, medicalNotes: 'CAMHS referral pending (9 weeks). No current medication.', dietary: 'Halal',
    parent1: 'Amira Hassan', parent1Phone: '07678 901234',
    passportSummary: 'O. is funny, energetic and kind. He can find sustained attention and impulse control challenging.',
    keyStrengths: ['Humour and warmth', 'Sporty', 'Good oral comprehension', 'Popular with peers'],
    supportStrategies: ['Short burst tasks with brain breaks', 'Reward chart (weekly targets)', 'Seating away from distractions', 'Fidget tools available', 'Lunch club on Wednesdays for social skills'],
    behaviourNotes: 'Escalation signs: tapping, leaving seat, talking out of turn. De-escalate with quiet 1:1, offer movement break.',
    interventions: ['CAMHS referral (awaiting — 9 weeks)', 'Social skills group (weekly)', 'Maths catch-up (daily)'],
  },
  {
    id: 7, name: 'P. Clarke', year: 'Year 6', dob: '14/01/2014', gender: 'M', class: '6C', classTeacher: 'Mr. Cooper',
    ethnicity: 'White British', eal: false, fsm: false, pp: false, lac: false, youngCarer: false,
    sendStatus: 'EHCP', sendNeed: 'Physical Disability', sendTier: 'Specialist', ispStatus: 'Active',
    readingAge: '13y+', bookBand: 'Lime+', attainment: 'Above', attendancePct: 95.3,
    safeguardingFlag: false, medicalNotes: 'Cerebral palsy — uses walking frame. Occupational therapy input termly. Adapted PE.', dietary: 'None', medication: 'None',
    parent1: 'James Clarke', parent1Phone: '07512 012345', parent2: 'Yvonne Clarke', parent2Phone: '07489 123456',
    passportSummary: 'P. is an articulate, highly motivated learner who excels academically. He needs physical access adaptations.',
    keyStrengths: ['Exceptional academic ability', 'Emotionally mature', 'Strong communicator', 'Loves history and debate'],
    supportStrategies: ['Ground floor classroom always', 'Adapted PE programme (OT-designed)', 'Laptop for extended writing', 'Extra time in assessments (25%)', 'Physical access check for all trips'],
    interventions: ['OT (termly)', 'Secondary transition plan in progress'],
  },
  {
    id: 8, name: 'M. Osei', year: 'Reception', dob: '2/08/2019', gender: 'F', class: 'RO', classTeacher: 'Mrs. Oliver',
    ethnicity: 'Black African', eal: true, fsm: true, pp: true, lac: false, youngCarer: false,
    sendStatus: 'Monitoring', sendTier: 'Universal', ispStatus: undefined,
    readingAge: undefined, bookBand: 'Pink', phonicsPhase: 'Phase 1/2', attainment: 'Below', attendancePct: 93.6,
    safeguardingFlag: false, medicalNotes: 'None', dietary: 'None',
    parent1: 'Grace Osei', parent1Phone: '07634 234567',
    passportSummary: 'M. is a joyful, social learner who is developing English rapidly. She is new to the UK (arrived Oct 2024).',
    keyStrengths: ['Social', 'Resilient', 'Picks up language quickly', 'Loves stories and music'],
    supportStrategies: ['Visual supports for all instructions', 'Picture-word labels in classroom', 'EAL buddy (Y1 pupil who speaks Twi)', 'Focus on oral vocabulary before phonics', 'Home-school communication via translation app'],
    interventions: ['EAL small group (daily)', 'EYFS monitoring — SEND referral under consideration'],
  },
  {
    id: 9, name: 'J. Ford', year: 'Year 3', dob: '30/04/2016', gender: 'M', class: '3C', classTeacher: 'Miss Carver',
    ethnicity: 'White British', eal: false, fsm: true, pp: true, lac: false, youngCarer: true,
    sendStatus: 'None', sendTier: undefined, ispStatus: undefined,
    readingAge: '7y 4m', bookBand: 'White', attainment: 'Expected', attendancePct: 79.0,
    safeguardingFlag: true, cpStatus: 'CP — Neglect/Domestic Abuse', socialWorker: 'Priya Shah (LA)',
    medicalNotes: 'Frequently arrives without breakfast. Signs of tiredness.', dietary: 'FSM',
    parent1: 'Kelly Ford', parent1Phone: '07456 345678',
    passportSummary: 'J. is a caring pupil who looks out for his younger siblings. Home circumstances are complex.',
    keyStrengths: ['Empathetic', 'Responsible', 'Enjoys art and sport'],
    supportStrategies: ['Breakfast club daily', 'Nurture group', 'Quiet check-in with trusted adult each morning', 'Avoid highlighting absence in front of peers'],
    behaviourNotes: 'Can be withdrawn on Monday mornings. Check in before register.',
    interventions: ['Breakfast club', 'Nurture group (weekly)', 'DSL monitoring — open CP case'],
  },
  {
    id: 10, name: 'C. Osei', year: 'Year 6', dob: '18/07/2013', gender: 'F', class: '6C', classTeacher: 'Mr. Cooper',
    ethnicity: 'Black African', eal: false, fsm: false, pp: false, lac: false, youngCarer: false,
    sendStatus: 'None', ispStatus: undefined,
    readingAge: '12y 0m', bookBand: 'Lime+', attainment: 'Above', attendancePct: 82.0,
    safeguardingFlag: false, medicalNotes: 'Anxiety — SATs related. Parents in communication with school.', dietary: 'None',
    parent1: 'Kwame Osei', parent1Phone: '07789 456789',
    passportSummary: 'C. is a high-attaining, conscientious pupil experiencing anxiety ahead of SATs. Referred to school counsellor.',
    keyStrengths: ['Academic excellence', 'Organised', 'Creative writer', 'Natural leader'],
    supportStrategies: ['Regular check-in with class teacher', 'Growth mindset language', 'SATs anxiety plan in place', 'Counsellor sessions (Thursdays)'],
    interventions: ['School counsellor (weekly)', 'Attendance monitoring — below 85%'],
  },
  {
    id: 11, name: 'D. Mensah', year: 'Year 4', dob: '9/12/2015', gender: 'M', class: '4M', classTeacher: 'Mrs. Mitchell',
    ethnicity: 'Black African', eal: false, fsm: true, pp: true, lac: true, youngCarer: false,
    sendStatus: 'None', ispStatus: undefined,
    readingAge: '9y 0m', bookBand: 'Gold', attainment: 'Expected', attendancePct: 91.4,
    safeguardingFlag: false, medicalNotes: 'None', dietary: 'None',
    parent1: 'Foster Carer — Jane Cooper', parent1Phone: '07823 567890',
    passportSummary: 'D. is a settled, sociable pupil in long-term foster care. PEP up to date. Virtual school head engaged.',
    keyStrengths: ['Popular with peers', 'Sporty', 'Good verbal communication'],
    supportStrategies: ['Consistent trusted adult identified', 'PP+ funding supports 1:1 reading', 'Predictable routines', 'Positive behaviour support — avoid public sanctions'],
    interventions: ['LAC review (Apr 2025)', 'PP+ 1:1 reading (daily)', 'Foster carer engagement regular'],
  },
  {
    id: 12, name: 'F. Ahmed', year: 'Year 5', dob: '21/03/2015', gender: 'F', class: '5W', classTeacher: 'Mrs. Walsh',
    ethnicity: 'Asian — Pakistani', eal: false, fsm: false, pp: false, lac: false, youngCarer: false,
    sendStatus: 'None', ispStatus: undefined,
    readingAge: '11y 6m', bookBand: 'Lime+', attainment: 'Above', attendancePct: 98.7,
    safeguardingFlag: false, medicalNotes: 'Nut allergy — EpiPen stored in school office and classroom.', dietary: 'Halal, nut-free', medication: 'EpiPen (school office + classroom)',
    parent1: 'Nasreen Ahmed', parent1Phone: '07567 678901', parent2: 'Tariq Ahmed', parent2Phone: '07534 789012',
    passportSummary: 'F. is an exceptional all-round pupil. High attainer, school council rep, choir member.',
    keyStrengths: ['Academic excellence', 'Leadership', 'Musically talented', 'Reliable and mature'],
    supportStrategies: ['Challenge and extension opportunities', 'Leadership roles', 'ALWAYS check food before activities'],
    interventions: ['Maths enrichment group', 'School council representative'],
  },
]

// ─── Helper components ────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: bg }}>{label}</span>
  )
}

function TabBtn({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-2 text-xs font-medium rounded-t-lg transition-all"
      style={{
        borderBottom: active ? '2px solid #0D9488' : '2px solid transparent',
        color: active ? '#0D9488' : '#9CA3AF',
        backgroundColor: active ? 'rgba(13,148,136,0.08)' : 'transparent',
      }}>{label}</button>
  )
}

function InfoRow({ label, value, highlight = false }: { label: string; value?: string; highlight?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
      <span className="text-xs w-32 flex-shrink-0" style={{ color: '#6B7280' }}>{label}</span>
      <span className="text-xs font-medium flex-1" style={{ color: highlight ? '#FCD34D' : '#D1D5DB' }}>{value}</span>
    </div>
  )
}

// ─── Flags helper ─────────────────────────────────────────────────────────────

function PupilFlags({ pupil }: { pupil: Pupil }) {
  return (
    <div className="flex flex-wrap gap-1">
      {pupil.sendStatus !== 'None' && (
        <Badge label={pupil.sendStatus} color="#8B5CF6" bg="rgba(139,92,246,0.15)" />
      )}
      {pupil.pp && <Badge label="PP" color="#F59E0B" bg="rgba(245,158,11,0.15)" />}
      {pupil.lac && <Badge label="LAC" color="#A78BFA" bg="rgba(167,139,250,0.15)" />}
      {pupil.fsm && <Badge label="FSM" color="#22C55E" bg="rgba(34,197,94,0.12)" />}
      {pupil.eal && <Badge label="EAL" color="#06B6D4" bg="rgba(6,182,212,0.15)" />}
      {pupil.youngCarer && <Badge label="Young Carer" color="#EC4899" bg="rgba(236,72,153,0.12)" />}
      {pupil.safeguardingFlag && <Badge label="⚠ SG" color="#EF4444" bg="rgba(239,68,68,0.2)" />}
    </div>
  )
}

// ─── Individual pupil profile modal ──────────────────────────────────────────

function PupilProfile({ pupil, onClose, view }: { pupil: Pupil; onClose: () => void; view: ViewMode }) {
  const [tab, setTab] = useState('overview')

  const attendanceColor = pupil.attendancePct < 85 ? '#EF4444' : pupil.attendancePct < 90 ? '#F59E0B' : '#22C55E'

  const tabs = [
    { id: 'overview', label: '👤 Overview' },
    { id: 'passport', label: '📋 Pupil Passport' },
    { id: 'academic', label: '📈 Academic' },
    { id: 'attendance', label: '📅 Attendance' },
    { id: 'send', label: '🧩 SEND' },
    { id: 'safeguarding', label: '🛡️ Safeguarding' },
    { id: 'medical', label: '❤️ Medical' },
    { id: 'contacts', label: '📞 Contacts' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="h-full w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: '#07080F', borderLeft: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#111318' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: '#1F2937', color: '#0D9488' }}>
              {pupil.name.split(' ')[0][0]}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#F9FAFB' }}>{pupil.name}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{pupil.year} · {pupil.class} · {pupil.classTeacher}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PupilFlags pupil={pupil} />
            <button onClick={onClose} style={{ color: '#6B7280' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-0 px-3 pt-2" style={{ backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
          {tabs.map(t => <TabBtn key={t.id} id={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Attendance</p>
                  <p className="text-2xl font-black mt-1" style={{ color: attendanceColor }}>{pupil.attendancePct}%</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>This academic year</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Attainment</p>
                  <p className="text-2xl font-black mt-1" style={{ color: pupil.attainment === 'Above' ? '#22C55E' : pupil.attainment === 'Below' ? '#EF4444' : '#0D9488' }}>{pupil.attainment}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Overall expectation</p>
                </div>
              </div>
              <div className="flex flex-col gap-0">
                <InfoRow label="Date of Birth" value={pupil.dob} />
                <InfoRow label="Gender" value={pupil.gender === 'M' ? 'Male' : 'Female'} />
                <InfoRow label="Ethnicity" value={pupil.ethnicity} />
                <InfoRow label="Class" value={`${pupil.class} — ${pupil.classTeacher}`} />
                <InfoRow label="FSM Eligible" value={pupil.fsm ? 'Yes' : 'No'} />
                <InfoRow label="Pupil Premium" value={pupil.pp ? 'Yes' : 'No'} />
                <InfoRow label="EAL" value={pupil.eal ? 'Yes' : 'No'} />
                <InfoRow label="LAC" value={pupil.lac ? 'Yes — see safeguarding tab' : 'No'} />
                <InfoRow label="Young Carer" value={pupil.youngCarer ? 'Yes — handle sensitively' : 'No'} />
              </div>
              {pupil.safeguardingFlag && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#FCA5A5' }}>⚠️ Safeguarding Flag Active</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{pupil.cpStatus} — see Safeguarding tab. Contact DSL for details.</p>
                </div>
              )}
              {pupil.medicalNotes && pupil.medicalNotes !== 'None' && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#FCD34D' }}>⚕️ Medical Note</p>
                  <p className="text-xs" style={{ color: '#D1D5DB' }}>{pupil.medicalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* PUPIL PASSPORT */}
          {tab === 'passport' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(13,148,136,0.3)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#0D9488' }}>ABOUT ME</p>
                <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{pupil.passportSummary || 'No passport summary added yet.'}</p>
              </div>
              {pupil.keyStrengths && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={14} style={{ color: '#F59E0B' }} />
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>My Strengths</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pupil.keyStrengths.map(s => (
                      <span key={s} className="rounded-lg px-2 py-1 text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#FCD34D' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {pupil.supportStrategies && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={14} style={{ color: '#0D9488' }} />
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>How to Support Me</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {pupil.supportStrategies.map(s => (
                      <div key={s} className="flex items-start gap-2 py-1" style={{ borderBottom: '1px solid #1F2937' }}>
                        <span style={{ color: '#0D9488' }}>✓</span>
                        <p className="text-xs" style={{ color: '#D1D5DB' }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pupil.behaviourNotes && (
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#FCA5A5' }}>BEHAVIOUR — DE-ESCALATION NOTES</p>
                  <p className="text-xs" style={{ color: '#D1D5DB' }}>{pupil.behaviourNotes}</p>
                </div>
              )}
              {pupil.interventions && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Current Interventions</p>
                  {pupil.interventions.map(i => (
                    <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid #1F2937' }}>
                      <span style={{ color: '#8B5CF6' }}>▸</span>
                      <p className="text-xs" style={{ color: '#D1D5DB' }}>{i}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACADEMIC */}
          {tab === 'academic' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Reading Age', value: pupil.readingAge || '—' },
                  { label: 'Book Band', value: pupil.bookBand || '—' },
                  { label: 'Phonics Phase', value: pupil.phonicsPhase || (pupil.year === 'Year 1' || pupil.year === 'Year 2' ? 'Phase 5' : '—') },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: '#0D9488' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Attainment by Subject</p>
                {[
                  { subject: 'Reading', level: pupil.attainment, color: pupil.attainment === 'Above' ? '#22C55E' : pupil.attainment === 'Below' ? '#EF4444' : '#0D9488' },
                  { subject: 'Writing', level: pupil.attainment === 'Above' ? 'Expected' : pupil.attainment, color: pupil.attainment === 'Above' ? '#0D9488' : pupil.attainment === 'Below' ? '#EF4444' : '#0D9488' },
                  { subject: 'Maths', level: pupil.attainment, color: pupil.attainment === 'Above' ? '#22C55E' : pupil.attainment === 'Below' ? '#F59E0B' : '#0D9488' },
                  { subject: 'Science', level: 'Expected', color: '#0D9488' },
                ].map(s => (
                  <div key={s.subject} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>{s.subject}</span>
                    <Badge label={s.level} color={s.color} bg={`${s.color}20`} />
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Assessment History</p>
                {[
                  { period: 'Autumn Term 2024', reading: pupil.attainment === 'Above' ? 'Above' : 'Expected', maths: 'Expected', writing: pupil.attainment },
                  { period: 'Spring Term 2025', reading: pupil.attainment, maths: pupil.attainment === 'Below' ? 'Expected' : pupil.attainment, writing: pupil.attainment },
                ].map(a => (
                  <div key={a.period} className="flex items-center gap-4 py-2 text-xs" style={{ borderBottom: '1px solid #1F2937' }}>
                    <span className="w-36 flex-shrink-0" style={{ color: '#6B7280' }}>{a.period}</span>
                    <span style={{ color: '#D1D5DB' }}>R: {a.reading}</span>
                    <span style={{ color: '#D1D5DB' }}>W: {a.writing}</span>
                    <span style={{ color: '#D1D5DB' }}>M: {a.maths}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {tab === 'attendance' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Overall', value: `${pupil.attendancePct}%`, color: attendanceColor },
                  { label: 'Authorised', value: `${Math.round((100 - pupil.attendancePct) * 0.6)}%`, color: '#9CA3AF' },
                  { label: 'Unauthorised', value: `${Math.round((100 - pupil.attendancePct) * 0.4)}%`, color: pupil.attendancePct < 90 ? '#EF4444' : '#9CA3AF' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {pupil.attendancePct < 85 && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-xs font-bold" style={{ color: '#FCA5A5' }}>⚠️ Persistent Absentee — Below 85%</p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Escalation letter due. Consider EWO referral if attendance does not improve.</p>
                </div>
              )}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold mb-3 uppercase" style={{ color: '#9CA3AF' }}>Monthly Attendance</p>
                <div className="flex items-end gap-2 h-20">
                  {[
                    { m: 'Sep', v: 97 }, { m: 'Oct', v: 94 }, { m: 'Nov', v: pupil.attendancePct < 85 ? 72 : 91 },
                    { m: 'Dec', v: 96 }, { m: 'Jan', v: pupil.attendancePct < 90 ? 78 : 93 }, { m: 'Feb', v: 95 },
                    { m: 'Mar', v: pupil.attendancePct }, 
                  ].map(d => {
                    const c = d.v < 85 ? '#EF4444' : d.v < 90 ? '#F59E0B' : '#0D9488'
                    return (
                      <div key={d.m} className="flex flex-col items-center flex-1">
                        <span className="text-xs mb-1 font-semibold" style={{ color: c }}>{d.v}%</span>
                        <div className="w-full rounded-t" style={{ height: `${(d.v / 100) * 56}px`, backgroundColor: c }} />
                        <span className="text-xs mt-1" style={{ color: '#6B7280' }}>{d.m}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SEND */}
          {tab === 'send' && (
            <div className="flex flex-col gap-4">
              {pupil.sendStatus === 'None' ? (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>No SEND needs identified</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'SEND Status', value: pupil.sendStatus, color: '#8B5CF6' },
                      { label: 'Primary Need', value: pupil.sendNeed || '—', color: '#A78BFA' },
                      { label: 'Support Tier', value: pupil.sendTier || '—', color: '#0D9488' },
                      { label: 'ISP Status', value: pupil.ispStatus || '—', color: pupil.ispStatus === 'Active' ? '#22C55E' : '#F59E0B' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
                        <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {pupil.supportStrategies && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#9CA3AF' }}>ISP — Classroom Strategies</p>
                      {pupil.supportStrategies.map(s => (
                        <div key={s} className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                          <span style={{ color: '#8B5CF6' }}>▸</span>
                          <p className="text-xs" style={{ color: '#D1D5DB' }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {pupil.interventions && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#9CA3AF' }}>Active Interventions</p>
                      {pupil.interventions.map(i => (
                        <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                          <span style={{ color: '#0D9488' }}>✓</span>
                          <p className="text-xs" style={{ color: '#D1D5DB' }}>{i}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SAFEGUARDING */}
          {tab === 'safeguarding' && (
            <div className="flex flex-col gap-4">
              {!pupil.safeguardingFlag && !pupil.lac ? (
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>No active safeguarding concerns</p>
                </div>
              ) : (
                <>
                  {pupil.safeguardingFlag && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)' }}>
                      <p className="text-sm font-bold mb-2" style={{ color: '#FCA5A5' }}>⚠️ Active Safeguarding Concern</p>
                      <InfoRow label="CP Status" value={pupil.cpStatus} highlight />
                      <InfoRow label="Social Worker" value={pupil.socialWorker} />
                      <div className="mt-3 text-xs p-2 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#9CA3AF' }}>
                        Full case details are held by the DSL. Contact Mrs. Hall before discussing with any other party.
                      </div>
                    </div>
                  )}
                  {pupil.lac && (
                    <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}>
                      <p className="text-sm font-bold mb-2" style={{ color: '#C4B5FD' }}>💜 Looked After Child</p>
                      <InfoRow label="Foster Carer" value={pupil.parent1} />
                      <InfoRow label="PEP Status" value="Up to date" />
                      <InfoRow label="Virtual School Head" value="Engaged — see LAC file" />
                      <InfoRow label="PP+ Funding" value="Active" />
                    </div>
                  )}
                </>
              )}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#9CA3AF' }}>Wellbeing Notes</p>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{pupil.behaviourNotes || 'No specific wellbeing notes recorded.'}</p>
              </div>
            </div>
          )}

          {/* MEDICAL */}
          {tab === 'medical' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#9CA3AF' }}>Medical Information</p>
                <InfoRow label="Medical Notes" value={pupil.medicalNotes} highlight={!!(pupil.medicalNotes && pupil.medicalNotes !== 'None')} />
                <InfoRow label="Medication" value={pupil.medication} highlight />
                <InfoRow label="Dietary Requirements" value={pupil.dietary} />
              </div>
              {pupil.medication && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-xs font-bold" style={{ color: '#FCA5A5' }}>⚕️ Medication Required</p>
                  <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>{pupil.medication}</p>
                </div>
              )}
              {pupil.dietary && pupil.dietary !== 'None' && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p className="text-xs font-bold" style={{ color: '#FCD34D' }}>🍽️ Dietary Note</p>
                  <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>{pupil.dietary}</p>
                </div>
              )}
            </div>
          )}

          {/* CONTACTS */}
          {tab === 'contacts' && (
            <div className="flex flex-col gap-4">
              {[
                { label: 'Primary Contact', name: pupil.parent1, phone: pupil.parent1Phone, priority: '1st' },
                ...(pupil.parent2 ? [{ label: 'Secondary Contact', name: pupil.parent2, phone: pupil.parent2Phone || '', priority: '2nd' }] : []),
              ].map(c => (
                <div key={c.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{c.label}</p>
                    <Badge label={c.priority} color="#0D9488" bg="rgba(13,148,136,0.12)" />
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={12} style={{ color: '#6B7280' }} />
                    <p className="text-sm" style={{ color: '#0D9488' }}>{c.phone}</p>
                  </div>
                </div>
              ))}
              {pupil.safeguardingFlag && pupil.socialWorker && (
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#FCA5A5' }}>Social Worker</p>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{pupil.socialWorker}</p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Contact via DSL — do not contact independently</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const VIEW_MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'all', label: 'All Pupils', icon: '👥' },
  { id: 'teacher', label: 'Teacher View', icon: '🧑‍🏫' },
  { id: 'senco', label: 'SENCO View', icon: '🧩' },
  { id: 'dsl', label: 'DSL View', icon: '🛡️' },
  { id: 'pastoral', label: 'Pastoral View', icon: '💙' },
  { id: 'admin', label: 'Admin View', icon: '📋' },
]

const YEARS = ['All Years', 'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6']

export default function StudentsPage() {
  const hasData = useHasSchoolData('students')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('all')
  const [yearFilter, setYearFilter] = useState('All Years')
  const [flagFilter, setFlagFilter] = useState<FilterKey>('all')
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null)
  const filtered = useMemo(() => {
    return PUPILS.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.class.toLowerCase().includes(search.toLowerCase()) ||
        p.classTeacher.toLowerCase().includes(search.toLowerCase())
      const matchYear = yearFilter === 'All Years' || p.year === yearFilter
      const matchFlag =
        flagFilter === 'all' ? true :
        flagFilter === 'send' ? p.sendStatus !== 'None' :
        flagFilter === 'pp' ? p.pp :
        flagFilter === 'lac' ? p.lac :
        flagFilter === 'eal' ? p.eal :
        flagFilter === 'fsm' ? p.fsm :
        true
      return matchSearch && matchYear && matchFlag
    })
  }, [search, yearFilter, flagFilter])
  if (hasData === null) return null
  if (!hasData) return <SchoolEmptyState pageKey="students" title="No student data yet" description="Upload your student roll, attendance and assessment data to activate Students." uploads={[{ key: 'students', label: 'Upload Student Data (CSV)' }]} />

  // Stats
  const totalSend = PUPILS.filter(p => p.sendStatus !== 'None').length
  const totalPP = PUPILS.filter(p => p.pp).length
  const totalLAC = PUPILS.filter(p => p.lac).length
  const totalSG = PUPILS.filter(p => p.safeguardingFlag).length
  const totalPA = PUPILS.filter(p => p.attendancePct < 85).length

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Students</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>All pupils · Profiles, SEND, safeguarding, attendance and contacts</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Pupils', value: PUPILS.length.toString(), color: '#F9FAFB' },
          { label: 'SEND Register', value: totalSend.toString(), color: '#8B5CF6' },
          { label: 'Pupil Premium', value: totalPP.toString(), color: '#F59E0B' },
          { label: 'Safeguarding', value: totalSG.toString(), color: '#EF4444' },
          { label: 'Pers. Absentees', value: totalPA.toString(), color: '#F97316' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* View mode selector */}
      <div className="rounded-xl p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-xs mb-2" style={{ color: '#6B7280' }}>View as</p>
        <div className="flex flex-wrap gap-2">
          {VIEW_MODES.map(m => (
            <button key={m.id} onClick={() => setView(m.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: view === m.id ? 'rgba(13,148,136,0.15)' : '#0A0B11',
                border: view === m.id ? '1px solid rgba(13,148,136,0.5)' : '1px solid #1F2937',
                color: view === m.id ? '#0D9488' : '#9CA3AF',
              }}>
              <span>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg px-3 py-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <Search size={14} style={{ color: '#6B7280' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, class or teacher..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#F9FAFB' }}
          />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: '#6B7280' }} /></button>}
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={flagFilter} onChange={e => setFlagFilter(e.target.value as FilterKey)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}>
          <option value="all">All Groups</option>
          <option value="send">SEND</option>
          <option value="pp">Pupil Premium</option>
          <option value="lac">Looked After</option>
          <option value="eal">EAL</option>
          <option value="fsm">FSM</option>
        </select>
      </div>

      {/* Result count */}
      <p className="text-xs" style={{ color: '#6B7280' }}>
        Showing {filtered.length} of {PUPILS.length} pupils
        {(search || yearFilter !== 'All Years' || flagFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setYearFilter('All Years'); setFlagFilter('all') }}
            className="ml-2" style={{ color: '#0D9488' }}>Clear filters</button>
        )}
      </p>

      {/* Pupil list — columns depend on view */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {/* Table header */}
        <div className="grid gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide"
          style={{
            backgroundColor: '#0A0B11', color: '#6B7280',
            gridTemplateColumns: view === 'senco' ? '1.5fr 80px 100px 100px 100px 80px 30px'
              : view === 'dsl' ? '1.5fr 80px 80px 120px 100px 30px'
              : view === 'admin' ? '1.5fr 80px 80px 100px 120px 30px'
              : view === 'pastoral' ? '1.5fr 80px 80px 100px 120px 30px'
              : '1.5fr 80px 80px 120px 80px 30px'
          }}>
          <span>Name</span>
          <span>Year</span>
          {view === 'senco' && <><span>SEND</span><span>Tier</span><span>ISP</span><span>Attend.</span></>}
          {view === 'dsl' && <><span>SG Flag</span><span>CP/LAC</span><span>Attendance</span></>}
          {view === 'admin' && <><span>FSM</span><span>PP</span><span>Medical</span></>}
          {view === 'pastoral' && <><span>Attendance</span><span>Flags</span><span>Concern</span></>}
          {(view === 'all' || view === 'teacher') && <><span>Flags</span><span>Attend.</span></>}
          <span></span>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {filtered.map((pupil, i) => {
            const attendColor = pupil.attendancePct < 85 ? '#EF4444' : pupil.attendancePct < 90 ? '#F59E0B' : '#22C55E'
            return (
              <div key={pupil.id}
                className="grid gap-3 px-4 py-3 items-center cursor-pointer transition-colors"
                style={{
                  gridTemplateColumns: view === 'senco' ? '1.5fr 80px 100px 100px 100px 80px 30px'
                    : view === 'dsl' ? '1.5fr 80px 80px 120px 100px 30px'
                    : view === 'admin' ? '1.5fr 80px 80px 100px 120px 30px'
                    : view === 'pastoral' ? '1.5fr 80px 80px 100px 120px 30px'
                    : '1.5fr 80px 80px 120px 80px 30px',
                  backgroundColor: pupil.safeguardingFlag ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}
                onClick={() => setSelectedPupil(pupil)}>

                {/* Name */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{pupil.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{pupil.class} · {pupil.classTeacher}</p>
                </div>

                {/* Year */}
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{pupil.year}</p>

                {/* SENCO columns */}
                {view === 'senco' && (
                  <>
                    <div>{pupil.sendStatus !== 'None' ? <Badge label={pupil.sendStatus} color="#8B5CF6" bg="rgba(139,92,246,0.15)" /> : <span style={{ color: '#4B5563' }}>—</span>}</div>
                    <div>{pupil.sendTier ? <Badge label={pupil.sendTier} color="#0D9488" bg="rgba(13,148,136,0.12)" /> : <span style={{ color: '#4B5563' }}>—</span>}</div>
                    <div>{pupil.ispStatus ? <Badge label={pupil.ispStatus} color={pupil.ispStatus === 'Active' ? '#22C55E' : '#F59E0B'} bg={pupil.ispStatus === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'} /> : <span style={{ color: '#4B5563' }}>—</span>}</div>
                    <p className="text-sm font-bold" style={{ color: attendColor }}>{pupil.attendancePct}%</p>
                  </>
                )}

                {/* DSL columns */}
                {view === 'dsl' && (
                  <>
                    <div>{pupil.safeguardingFlag ? <Badge label="⚠ Active" color="#EF4444" bg="rgba(239,68,68,0.15)" /> : <span style={{ color: '#4B5563' }}>None</span>}</div>
                    <div>{pupil.lac ? <Badge label="LAC" color="#A78BFA" bg="rgba(167,139,250,0.15)" /> : pupil.cpStatus ? <Badge label="CP/CiN" color="#EF4444" bg="rgba(239,68,68,0.15)" /> : <span style={{ color: '#4B5563' }}>—</span>}</div>
                    <p className="text-sm font-bold" style={{ color: attendColor }}>{pupil.attendancePct}%</p>
                  </>
                )}

                {/* Admin columns */}
                {view === 'admin' && (
                  <>
                    <div>{pupil.fsm ? <Badge label="FSM" color="#22C55E" bg="rgba(34,197,94,0.12)" /> : <span style={{ color: '#4B5563' }}>No</span>}</div>
                    <div>{pupil.pp ? <Badge label="PP" color="#F59E0B" bg="rgba(245,158,11,0.12)" /> : <span style={{ color: '#4B5563' }}>No</span>}</div>
                    <p className="text-xs" style={{ color: pupil.medication ? '#FCD34D' : '#9CA3AF' }}>{pupil.medication || (pupil.medicalNotes !== 'None' ? 'Notes' : '—')}</p>
                  </>
                )}

                {/* Pastoral columns */}
                {view === 'pastoral' && (
                  <>
                    <p className="text-sm font-bold" style={{ color: attendColor }}>{pupil.attendancePct}%</p>
                    <PupilFlags pupil={pupil} />
                    <div>{pupil.safeguardingFlag || pupil.attendancePct < 85 ? <Badge label="Review" color="#EF4444" bg="rgba(239,68,68,0.12)" /> : <span style={{ color: '#4B5563' }}>—</span>}</div>
                  </>
                )}

                {/* All / Teacher columns */}
                {(view === 'all' || view === 'teacher') && (
                  <>
                    <PupilFlags pupil={pupil} />
                    <p className="text-sm font-bold" style={{ color: attendColor }}>{pupil.attendancePct}%</p>
                  </>
                )}

                <ChevronRight size={14} style={{ color: '#4B5563' }} />
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: '#6B7280' }}>No pupils match your search</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#6B7280' }}>
        <span>Flags:</span>
        {[
          { label: 'PP', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
          { label: 'SEND', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
          { label: 'LAC', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
          { label: 'FSM', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
          { label: 'EAL', color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
          { label: '⚠ SG', color: '#EF4444', bg: 'rgba(239,68,68,0.2)' },
        ].map(f => <Badge key={f.label} label={f.label} color={f.color} bg={f.bg} />)}
      </div>

      {/* Pupil profile slide-over */}
      {selectedPupil && (
        <PupilProfile
          pupil={selectedPupil}
          view={view}
          onClose={() => setSelectedPupil(null)}
        />
      )}
    </div>
  )
}
