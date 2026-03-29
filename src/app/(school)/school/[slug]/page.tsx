'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, GraduationCap, Sunrise, Network,
  ChevronUp, ChevronDown, ArrowRight, Zap, Clock,
  Phone, Calendar, CheckCircle2, AlertTriangle, Activity,
  TrendingUp, Loader2, Volume2, Mic,
} from 'lucide-react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId = 'overview' | 'insights' | 'school-office' | 'hr-staff' | 'curriculum' | 'students' | 'send-dsl' | 'finance' | 'facilities' | 'admissions' | 'safeguarding' | 'wraparound' | 'trust' | 'workflows' | 'reports' | 'settings'

const NAV: { section: string | null; id: DeptId; label: string; icon: React.ElementType }[] = [
  { section: null,          id: 'overview',      label: 'Overview',               icon: LayoutDashboard },
  { section: null,          id: 'insights',      label: 'Insights',               icon: Sparkles        },
  { section: 'Departments', id: 'school-office', label: 'School Office',          icon: Building2       },
  { section: null,          id: 'hr-staff',      label: 'HR & Staff',             icon: Users           },
  { section: null,          id: 'curriculum',    label: 'Curriculum',             icon: BookOpen        },
  { section: null,          id: 'students',      label: 'Students',               icon: GraduationCap   },
  { section: null,          id: 'send-dsl',      label: 'SEND & DSL',             icon: Heart           },
  { section: null,          id: 'finance',       label: 'Finance',                icon: DollarSign      },
  { section: null,          id: 'facilities',    label: 'Facilities',             icon: Wrench          },
  { section: null,          id: 'admissions',    label: 'Admissions & Marketing', icon: UserPlus        },
  { section: null,          id: 'safeguarding',  label: 'Safeguarding',           icon: Shield          },
  { section: null,          id: 'wraparound',    label: 'Pre & After School',     icon: Sunrise         },
  { section: 'Tools',       id: 'trust',         label: 'Trust Overview',         icon: Network         },
  { section: null,          id: 'workflows',     label: 'Workflows',              icon: GitBranch       },
  { section: null,          id: 'reports',       label: 'Reports',                icon: FileText        },
  { section: null,          id: 'settings',      label: 'Settings',               icon: Settings        },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, schoolName }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void; schoolName: string
}) {
  const inner = (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
      {NAV.map((item, i) => {
        const prev = NAV[i - 1]
        const showSection = item.section && item.section !== prev?.section
        const active = activeDept === item.id
        const Icon = item.icon
        return (
          <div key={item.id}>
            {showSection && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>
            )}
            <button
              onClick={() => { onSelect(item.id); onClose() }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium w-full text-left transition-colors"
              style={{ backgroundColor: active ? '#0D9488' : 'transparent', color: active ? '#F9FAFB' : '#9CA3AF' }}
            >
              <Icon size={15} strokeWidth={1.75} className="shrink-0" />
              <span className="flex-1 truncate text-xs">{item.label}</span>
            </button>
          </div>
        )
      })}
    </nav>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0 overflow-y-auto" style={{ width: 200, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
        <div className="flex shrink-0 items-center gap-1.5 px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
            <Building2 size={12} color="white" />
          </div>
          <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
        </div>
        {inner}
        <div className="mt-auto shrink-0 flex items-center justify-center py-4 px-3">
          <a href="https://lumiocms.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full">
            <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: '80%', maxWidth: 140, height: 'auto', opacity: 0.5, display: 'block' }} />
          </a>
        </div>
      </aside>
      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden" style={{ width: 240, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
          <div className="flex shrink-0 items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
            <button onClick={onClose} style={{ color: '#9CA3AF' }}><X size={16} /></button>
          </div>
          {inner}
        </aside>
      )}
    </>
  )
}

// ─── AI Morning Summary Panel ───────────────────────────────────────────────

const SCHOOL_AI_HIGHLIGHTS = [
  'Attendance today is 96.2% \u2014 Year 6 is at 91.8%, below the 94% target',
  '1 open safeguarding concern \u2014 DSL sign-off required today',
  'Mrs S. Okafor (SENCO) is absent \u2014 cover arranged for morning',
  'M. Taylor DBS expired 10 March \u2014 renewal overdue, action needed',
  'Year 4 trip permission deadline is Friday \u2014 12 of 28 still outstanding',
  'Year 6 SATs prep session at 10am \u2014 28 pupils confirmed',
]

function SchoolAIPanel() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #0D9488' }}>
      <button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: open ? '1px solid rgba(13,148,136,0.3)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#0D9488' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#2DD4BF' }}>{dayLabel}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#0D9488' }} /> : <ChevronDown size={14} style={{ color: '#0D9488' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
          {SCHOOL_AI_HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#2DD4BF' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#99F6E4' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Quotes (120 entries, same as business portal) ──────────────────────────

const SCHOOL_QUOTES = [
  { text: "Every child deserves a champion.", author: "Rita Pierson" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Children must be taught how to think, not what to think.", author: "Margaret Mead" },
  { text: "A good teacher can inspire hope and ignite the imagination.", author: "Brad Henry" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou" },
  { text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss" },
  { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "All our dreams can come true if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Difficulties in life are intended to make us better, not bitter.", author: "Dan Reeves" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Don't wait for opportunity \u2014 create it.", author: "George Bernard Shaw" },
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
  { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires.", author: "William Arthur Ward" },
  { text: "Nine tenths of education is encouragement.", author: "Anatole France" },
  { text: "A teacher affects eternity; they can never tell where their influence stops.", author: "Henry Adams" },
  { text: "The whole purpose of education is to turn mirrors into windows.", author: "Sydney J. Harris" },
  { text: "What a teacher writes on the blackboard of life can never be erased.", author: "Unknown" },
  { text: "The task of the modern educator is not to cut down jungles, but to irrigate deserts.", author: "C.S. Lewis" },
  { text: "Education breeds confidence. Confidence breeds hope. Hope breeds peace.", author: "Confucius" },
  { text: "The greatest sign of success for a teacher is to be able to say, the children are now working as if I did not exist.", author: "Maria Montessori" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Tell me and I forget. Show me and I remember. Let me do and I understand.", author: "Xunzi" },
  { text: "Every student can learn, just not on the same day or in the same way.", author: "George Evans" },
  { text: "The best teachers are those who show you where to look but don't tell you what to see.", author: "Alexandra K. Trenfor" },
  { text: "Children are not things to be moulded, but people to be unfolded.", author: "Jess Lair" },
  { text: "If a child can't learn the way we teach, maybe we should teach the way they learn.", author: "Ignacio Estrada" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates" },
  { text: "A school should not be a preparation for life. A school should be life.", author: "Elbert Hubbard" },
  { text: "The principal goal of education is to create people who are capable of doing new things.", author: "Jean Piaget" },
  { text: "Good teaching is one-fourth preparation and three-fourths theatre.", author: "Gail Godwin" },
  { text: "In teaching you cannot see the fruit of a day's work. It is invisible and remains so, maybe for twenty years.", author: "Jacques Barzun" },
  { text: "The best thing about being a teacher is that it matters.", author: "Todd Whitaker" },
  { text: "No significant learning occurs without a significant relationship.", author: "James Comer" },
  { text: "To teach is to learn twice.", author: "Joseph Joubert" },
  { text: "It takes a big heart to help shape little minds.", author: "Unknown" },
  { text: "I am not a teacher, but an awakener.", author: "Robert Frost" },
  { text: "Teaching kids to count is fine, but teaching them what counts is best.", author: "Bob Talbert" },
  { text: "A child miseducated is a child lost.", author: "John F. Kennedy" },
  { text: "Intelligence plus character \u2014 that is the goal of true education.", author: "Martin Luther King Jr." },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { text: "Give a child a fish and you feed them for a day. Teach a child to fish and you feed them for a lifetime.", author: "Chinese Proverb" },
  { text: "What we want is to see the child in pursuit of knowledge, not knowledge in pursuit of the child.", author: "George Bernard Shaw" },
  { text: "The function of education is to teach one to think intensively and critically.", author: "Martin Luther King Jr." },
  { text: "Teachers open the door, but you must enter by yourself.", author: "Chinese Proverb" },
  { text: "Education is not about filling a bucket, but lighting a fire.", author: "W.B. Yeats" },
  { text: "It is the supreme art of the teacher to awaken joy in creative expression and knowledge.", author: "Albert Einstein" },
  { text: "The influence of a good teacher can never be erased.", author: "Unknown" },
  { text: "Be the teacher you needed when you were younger.", author: "Unknown" },
  { text: "Teaching is the greatest act of optimism.", author: "Colleen Wilcox" },
  { text: "Every day may not be good, but there is something good in every day.", author: "Alice Morse Earle" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "The best leaders are those most interested in surrounding themselves with assistants and associates smarter than they are.", author: "John C. Maxwell" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "Great leaders don't set out to be a leader. They set out to make a difference.", author: "Jeremy Bravo" },
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy" },
  { text: "All our dreams can come true if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "The ones who are crazy enough to think they can change the world are the ones that do.", author: "Steve Jobs" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
  { text: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso" },
  { text: "Play is the highest form of research.", author: "Albert Einstein" },
  { text: "The child who reads will be the adult who thinks.", author: "Unknown" },
  { text: "Educating the mind without educating the heart is no education at all.", author: "Aristotle" },
  { text: "A person's a person, no matter how small.", author: "Dr. Seuss" },
  { text: "Children need models rather than critics.", author: "Joseph Joubert" },
]

const OPENING_LINES = [
  "Today is going to be a great day \u2014 here's your morning roundup.",
  "Rise and shine! Let's see what today has in store for you.",
  "Good things are coming today \u2014 let's get into it.",
  "You've got this. Here's everything you need to hit the ground running.",
  "Today's your day. Here's your morning roundup.",
  "The best time to make things happen is right now \u2014 let's get started.",
  "Another day, another opportunity. Here's what's on the agenda.",
  "Morning! The world is ready for you \u2014 here's your briefing.",
  "Let's make today count. Here's your roundup.",
  "Great days start with great mornings \u2014 here's yours.",
  "Today has potential written all over it. Let's dig in.",
  "Good morning! Here's your world for the day.",
  "Every great day starts somewhere \u2014 let's start here.",
  "Today is full of possibility \u2014 let's see what we can do with it.",
  "Morning energy activated. Here's your roundup.",
  "The day is yours \u2014 here's how it's shaping up.",
  "A fresh day, a fresh start \u2014 here's your morning roundup.",
  "Good morning! Big things start with mornings like this.",
  "Morning! Let's make something happen today.",
  "Today's going to be one of the good ones. Here's your roundup.",
  "You showed up. That's already half the battle. Here's the rest.",
  "Good morning! Here's your world for the day.",
  "The momentum starts now. Here's your morning briefing.",
  "Something good is going to happen today \u2014 here's your briefing.",
  "Let's make this one count. Here's your morning roundup.",
  "Ready? Because today is ready for you. Here's your briefing.",
  "Onwards and upwards. Here's what's waiting for you today.",
  "Today is a blank page \u2014 let's write something good.",
  "You're already ahead just by starting. Here's your briefing.",
  "The day is looking good \u2014 here's the rundown.",
  "One day at a time, one great morning at a time \u2014 here's yours.",
  "Fuel up and focus \u2014 here's your morning briefing.",
  "The best version of today starts right now. Let's go.",
  "Morning! Here's everything you need to own the day.",
  "Good days are built one morning at a time \u2014 here's yours.",
  "Today has your name on it. Here's the briefing.",
  "Let's get into it \u2014 here's your morning roundup.",
  "New day, new wins waiting to happen. Here's your briefing.",
  "The day is already looking up \u2014 here's your roundup.",
  "Morning! You've got everything you need to make today great.",
  "Today is full of good things \u2014 here's where they start.",
  "Eyes up, chin up, here's your morning roundup.",
  "Today is ready when you are. Here's your briefing.",
  "Good morning! Let's see what today is made of.",
  "The best part of the day is right now \u2014 it's all uphill from here.",
  "Morning! Let's stack some wins today.",
  "You've got a great day ahead \u2014 here's the proof.",
  "Start strong, finish stronger \u2014 here's your morning briefing.",
  "Good morning! Here's your launchpad for the day.",
  "The momentum is yours \u2014 here's your morning briefing.",
  "Morning! Everything you need is right here \u2014 let's go.",
  "Today's going to be a good one \u2014 here's your roundup.",
  "Let's build something great today \u2014 starting with this briefing.",
  "Good morning! Here's your daily dose of let's get it.",
  "The day ahead looks good from here \u2014 here's your roundup.",
  "Morning! Here's your daily briefing \u2014 make it count.",
  "Today is yours to shape \u2014 here's your morning roundup.",
  "Good morning! The best moments of today are still ahead.",
]

// ─── School Day Overview ────────────────────────────────────────────────────

const SCHOOL_DAY_ITEMS = [
  { id: 'attendance', icon: '\u2705', label: 'Attendance', count: 3, urgent: true, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    messages: [
      { id: 'a1', from: 'Year 7', avatar: 'Y7', subject: '3 unexplained absences', preview: 'Students: Jamie Wilson, Priya Patel, Marcus Lee \u2014 no contact from parents yet.', time: '8:45am', urgent: true, read: false },
    ]},
  { id: 'safeguarding', icon: '\uD83D\uDEE1\uFE0F', label: 'Safeguarding', count: 1, urgent: true, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    messages: [
      { id: 's1', from: 'Mrs Davies (SENCO)', avatar: 'MD', subject: 'CP Case review due today', preview: 'Child Protection case for Student A requires review before end of day. TAC meeting scheduled 3pm.', time: '8:30am', urgent: true, read: false },
    ]},
  { id: 'send', icon: '\uD83D\uDCCB', label: 'SEND Updates', count: 2, urgent: false, color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',
    messages: [
      { id: 'se1', from: 'SEND Team', avatar: 'ST', subject: 'EHC Plan review \u2014 deadline in 3 days', preview: 'Annual review for Student B EHC Plan is due Friday.', time: '9:00am', urgent: false, read: false },
    ]},
  { id: 'staff', icon: '\uD83D\uDC65', label: 'Staff Updates', count: 2, urgent: false, color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
    messages: [
      { id: 'st1', from: 'HR System', avatar: 'HR', subject: 'Supply cover needed \u2014 Period 3 & 4', preview: 'Mr Thompson called in sick. Cover needed for Year 9 and Year 11 this afternoon.', time: '7:58am', urgent: false, read: false },
    ]},
  { id: 'ofsted', icon: '\uD83C\uDFEB', label: 'Ofsted Readiness', count: 1, urgent: false, color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)',
    messages: [
      { id: 'o1', from: 'Compliance', avatar: 'CS', subject: 'Online Safety audit due this week', preview: 'Annual online safety review must be completed before Friday.', time: '8:00am', urgent: false, read: false },
    ]},
]

function SchoolDayOverview() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🌅 School Day Overview</h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>
      <div className="space-y-2">
        {SCHOOL_DAY_ITEMS.map(item => {
          const isOpen = expanded === item.id
          return (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
              <button onClick={() => setExpanded(isOpen ? null : item.id)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.label}</span>
                  {item.urgent && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Urgent</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: item.color }}>{item.count}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '\u25B2' : '\u25BC'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {item.messages.map(msg => (
                    <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: item.color + '22', color: item.color }}>{msg.avatar}</div>
                          <div>
                            <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.from}</span>
                            <div className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{msg.subject}</div>
                          </div>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#6B7280' }}>{msg.time}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{msg.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Photo Frame ────────────────────────────────────────────────────────────

function PhotoFrame() {
  const [photos, setPhotos] = useState<string[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_photo_frame') : null; return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotos(prev => { const next = [...prev, ev.target?.result as string].slice(-20); localStorage.setItem('lumio_photo_frame', JSON.stringify(next)); return next })
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotos(prev => { const next = prev.filter((_, i) => i !== idx); localStorage.setItem('lumio_photo_frame', JSON.stringify(next)); if (currentIdx >= next.length) setCurrentIdx(Math.max(0, next.length - 1)); return next })
  }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '\u23F8 Pause' : '\u25B6 Play'}</button>}
          <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed #374151' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">📷</div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>Add your photos</div>
        </div>
      ) : (
        <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 150 }}>
          <img src={photos[currentIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          {photos.length > 1 && (<>
            <button onClick={() => setCurrentIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\u2039</button>
            <button onClick={() => setCurrentIdx(i => (i + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\u203A</button>
          </>)}
          <button onClick={() => removePhoto(currentIdx)} className="absolute top-2 right-2 rounded-full text-xs" style={{ width: 20, height: 20, backgroundColor: 'rgba(0,0,0,0.6)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\u00D7</button>
          <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{currentIdx + 1} / {photos.length}</div>
        </div>
      )}
      <div className="px-4 pb-3 flex-shrink-0">
        {photos.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>
            {[3, 5, 10, 30].map(s => (
              <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Meetings Today ─────────────────────────────────────────────────────────

const SCHOOL_MEETINGS = [
  { id: '1', title: 'Register period', time: '08:50', duration: '10 min', type: 'admin', status: 'done' },
  { id: '2', title: 'Year 6 SATs prep', time: '10:00', duration: '60 min', type: 'academic', status: 'now' },
  { id: '3', title: 'SENCO review meeting', time: '11:30', duration: '30 min', type: 'meeting', status: 'upcoming' },
  { id: '4', title: 'Parent consultation \u2014 J. Morris', time: '14:00', duration: '20 min', type: 'parent', status: 'upcoming' },
]

function SchoolMeetingsToday() {
  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📅 Today's Schedule</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{SCHOOL_MEETINGS.length} items</span>
      </div>
      <div className="space-y-1">
        {SCHOOL_MEETINGS.map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ opacity: m.status === 'done' ? 0.4 : 1 }}>
            <div className="text-center flex-shrink-0 w-12">
              <div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: m.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: m.status === 'done' ? 'line-through' : 'none' }}>{m.title}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{m.type}</p>
            </div>
            {m.status === 'now' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Greeting Banner ────────────────────────────────────────────────────────

const SCHOOL_BG_GRADIENTS = [
  'from-teal-950/80 via-emerald-950/90 to-cyan-950',
  'from-emerald-950 via-teal-950/80 to-cyan-950/90',
  'from-cyan-950 via-emerald-950/80 to-teal-950/90',
  'from-teal-950/90 via-cyan-950 to-emerald-950/80',
  'from-emerald-950/80 via-cyan-950/90 to-teal-950',
  'from-cyan-950/90 via-teal-950 to-emerald-950/80',
  'from-teal-950 via-emerald-950/90 to-cyan-950/80',
]

function SchoolBanner({ firstName, schoolName }: { firstName?: string; schoolName?: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => SCHOOL_BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useElevenLabsTTS()
  const [quote, setQuote] = useState(SCHOOL_QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime()
    const dayOfYear = Math.floor((Date.now() - start) / 86400000)
    setQuote(SCHOOL_QUOTES[dayOfYear % SCHOOL_QUOTES.length])
  }, [])

  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = OPENING_LINES[dayOfYear % OPENING_LINES.length]
    const name = firstName || 'there'
    const script = `${greeting}, ${name}. ${openingLine} Attendance is 96.2%. 1 safeguarding concern needs attention. 2 staff updates and an Ofsted check due this week.`
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script]
    let chunk = ''
    const chunks: string[] = []
    for (const s of sentences) {
      if ((chunk + s).length > 480) { if (chunk) chunks.push(chunk.trim()); chunk = s } else { chunk += s }
    }
    if (chunk) chunks.push(chunk.trim())
    if (chunks.length > 0) speak(chunks[0])
  }

  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-600 rounded-full opacity-10 blur-3xl" />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName || 'there'} 👋</h1>
              <button onClick={handleBriefing} title="Text-to-Speech" className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#2DD4BF' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
                <Volume2 size={15} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-teal-300 text-sm mb-2">{date}</p>
            <p style={{ color: '#FBBF24' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; &mdash; {quote.author}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Pupils', value: 423, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '👨‍🎓' },
              { label: 'Staff', value: 41, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
              { label: 'Alerts', value: 3, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴' },
              { label: 'Reports', value: 2, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '📋' },
            ].map(item => (
              <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                <span className="text-base">{item.icon}</span>
                <span className="text-lg font-black text-white">{item.value}</span>
                <span className="text-xs opacity-70">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex-shrink-0">
            <span className="text-3xl">{weather.icon}</span>
            <div>
              <div className="text-xl font-black text-white">{weather.temp}</div>
              <div className="text-xs text-teal-300">{weather.condition}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Connect Data Prompt ────────────────────────────────────────────────────

function ConnectDataPrompt({ onGoToSettings }: { onGoToSettings: () => void }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.25)' }}>
      <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#2DD4BF', border: '1px solid rgba(13,148,136,0.25)' }}>
        <Zap size={12} /> Get started
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Connect your school systems</h3>
      <p className="text-sm mb-5 mx-auto max-w-sm" style={{ color: '#9CA3AF' }}>
        Link your MIS (SIMS, Arbor, Bromcom), staff systems, and safeguarding tools to see live data.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onGoToSettings} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Go to Integrations <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Coming Soon View ───────────────────────────────────────────────────────

function ComingSoonView({ dept }: { dept: DeptId }) {
  const item = NAV.find(s => s.id === dept)
  if (!item) return null
  const Icon = item.icon
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <Icon size={28} style={{ color: '#0D9488' }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{item.label}</h2>
      <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>This section is being built for your school workspace.</p>
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#2DD4BF', border: '1px solid rgba(13,148,136,0.25)' }}>
        <Sparkles size={10} /> Coming soon
      </span>
    </div>
  )
}

// ─── Settings View ──────────────────────────────────────────────────────────

function SettingsView({ schoolName }: { schoolName: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      {[
        { title: 'School', fields: [['School name', schoolName], ['Plan', 'Lumio Schools'], ['Status', 'Active']] },
        { title: 'Integrations', fields: [['MIS (SIMS/Arbor)', 'Not connected'], ['Safeguarding (CPOMS/MyConcern)', 'Not connected'], ['HR/Staff', 'Not connected'], ['Finance', 'Not connected']] },
        { title: 'Team', fields: [['Staff members', '1 (you)'], ['Pending invites', '0']] },
      ].map(section => (
        <div key={section.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{section.title}</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {section.fields.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: value === 'Not connected' ? '#6B7280' : '#F9FAFB' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Overview View ──────────────────────────────────────────────────────────

function OverviewView({ schoolName, firstName, onGoToSettings }: { schoolName: string; firstName?: string; onGoToSettings: () => void }) {
  return (
    <div className="space-y-4">
      <SchoolBanner firstName={firstName} schoolName={schoolName} />

      {/* Quick actions */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937', borderRadius: 12 }}>
        <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
        {[
          { label: 'New Concern', icon: '⚠️' },
          { label: 'Register Class', icon: '✅' },
          { label: 'Add Student', icon: '➕' },
          { label: 'Staff Alert', icon: '🔔' },
          { label: 'Ofsted Check', icon: '🏫' },
        ].map(a => (
          <button key={a.label} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      {/* 3-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-1 flex flex-col">
          <SchoolDayOverview />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <SchoolMeetingsToday />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <PhotoFrame />
          <SchoolAIPanel />
        </div>
      </div>

      {/* Safeguarding alert */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
        </div>
        <button className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Review now</button>
      </div>

      {/* Connect data + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ConnectDataPrompt onGoToSettings={onGoToSettings} />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Attendance', value: '96.2%', icon: Activity, color: '#0D9488' },
              { label: 'Staff', value: '41', icon: Users, color: '#6C3FC5' },
              { label: 'Workflows', value: '23', icon: GitBranch, color: '#22C55E' },
              { label: 'Concerns', value: '1', icon: Shield, color: '#EF4444' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}18` }}>
                      <Icon size={14} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{s.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SchoolWorkspaceDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [schoolName, setSchoolName] = useState('Your School')
  const [userName, setUserName]     = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem(`lumio_school_${slug}_name`) || 'Your School'
    const owner = localStorage.getItem(`lumio_school_${slug}_owner`) || ''
    setSchoolName(name)
    setUserName(owner)

    fetch(`/api/schools/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.workspace_type !== 'live' && data.active === false) { router.replace('/school/trial-ended'); return }
        if (data.name) setSchoolName(data.name)
      })
      .catch(() => {})
  }, [slug, router])

  const deptLabel = NAV.find(d => d.id === activeDept)?.label || 'Overview'
  const initials = userName ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : schoolName.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} schoolName={schoolName} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-6" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#07080F' }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={20} /></button>
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{schoolName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>Live</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative" style={{ color: '#9CA3AF' }}><Bell size={18} /></button>
            <AvatarDropdown initials={initials} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold">{deptLabel}</h1>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Workspace: <span style={{ color: '#F9FAFB' }}>{schoolName}</span></p>
            </div>
          </div>

          {activeDept === 'overview' && <OverviewView schoolName={schoolName} firstName={userName ? userName.split(' ')[0] : undefined} onGoToSettings={() => setActiveDept('settings')} />}
          {activeDept === 'settings' && <SettingsView schoolName={schoolName} />}
          {activeDept !== 'overview' && activeDept !== 'settings' && <ComingSoonView dept={activeDept} />}
        </main>
      </div>
    </div>
  )
}
