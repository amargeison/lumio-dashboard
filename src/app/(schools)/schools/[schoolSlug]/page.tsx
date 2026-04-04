'use client'

import { use, useState, useEffect, useRef } from 'react'
import {
  Users, Shield, Calendar, FileText, Phone, UserPlus,
  AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles,
  TrendingUp, Activity, X, ChevronRight, Mail, Plus,
  ChevronUp, ChevronDown, GitBranch, Volume2, Mic,
} from 'lucide-react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useSchoolVoiceCommands } from '@/hooks/useSchoolVoiceCommands'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { SafeguardingReviewModal } from '@/components/modals/SafeguardingReviewModal'
import { EmployeeProfileCard, getGridCols, type StaffRecord } from '@/components/team/EmployeeProfileCard'

// ─── Seed data ────────────────────────────────────────────────────────────────

interface SchoolData {
  name: string
  headteacher: string | null
  town: string | null
  ofsted_rating: string | null
  pupil_count: number | null
  staff_count: number | null
}

const ATTENDANCE_BY_YEAR = [
  { year: 'Reception', pct: 96.1 },
  { year: 'Year 1',    pct: 94.8 },
  { year: 'Year 2',    pct: 93.2 },
  { year: 'Year 3',    pct: 95.7 },
  { year: 'Year 4',    pct: 92.4 },
  { year: 'Year 5',    pct: 94.1 },
  { year: 'Year 6',    pct: 91.8 },
]

const WORKFLOWS = [
  { name: 'Daily Absence Alert',      status: 'COMPLETE', time: '7:32am'  },
  { name: 'DBS Reminder — M. Taylor', status: 'ACTION',   time: '8:00am'  },
  { name: 'Cover Booking — Mrs Jones',status: 'COMPLETE', time: '8:14am'  },
  { name: 'Safeguarding Log Sync',    status: 'RUNNING',  time: '8:30am'  },
  { name: 'Parent Comms — Yr 4 Trip', status: 'COMPLETE', time: 'Yesterday' },
  { name: 'Ofsted Readiness Check',   status: 'COMPLETE', time: 'Monday'  },
]

const STAFF_TODAY = [
  { name: 'Mrs K. Collins',  role: 'Year 3',      status: 'in'    },
  { name: 'Mr T. Rashid',    role: 'Year 5',      status: 'in'    },
  { name: 'Mrs S. Okafor',   role: 'SENCO',       status: 'absent'},
  { name: 'Mr D. Whitmore',  role: 'Year 6',      status: 'cover' },
  { name: 'Miss R. Khan',    role: 'Year 1',      status: 'in'    },
  { name: 'Mrs J. Andrews',  role: 'Office',      status: 'in'    },
]

const SCHEDULE = [
  { time: '8:50am', event: 'Register period',             type: 'admin'   },
  { time: '10:00am',event: 'Year 6 SATs prep — Hall',     type: 'academic'},
  { time: '11:30am',event: 'SENCO review meeting',        type: 'meeting' },
  { time: '2:00pm', event: 'Parent consultation — J. Morris', type: 'parent' },
]

const COMPLIANCE = [
  { item: 'DBS checks current',       status: 'ok',      detail: '38/41 current'         },
  { item: 'M. Taylor DBS overdue',    status: 'urgent',  detail: 'Expired 10 Mar 2026'   },
  { item: 'Fire drill completed',     status: 'ok',      detail: 'Completed 14 Mar'      },
  { item: 'Safeguarding training',    status: 'pending', detail: '2 staff due by Apr 30' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ragColor(pct: number) {
  if (pct >= 96) return '#22C55E'
  if (pct >= 92) return '#0D9488'
  if (pct >= 88) return '#F59E0B'
  return '#EF4444'
}

function WFBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETE: { bg: 'rgba(34,197,94,0.1)',   text: '#22C55E', label: 'Complete'  },
    RUNNING:  { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', label: 'Running'   },
    ACTION:   { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Action'    },
  }
  const s = map[status] ?? map.RUNNING
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {status === 'RUNNING' ? <Loader2 size={10} className="animate-spin" /> : status === 'COMPLETE' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
      {s.label}
    </span>
  )
}

function StaffBadge({ status }: { status: string }) {
  if (status === 'in')     return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>In</span>
  if (status === 'absent') return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Absent</span>
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>Cover</span>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {children}
    </div>
  )
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
      {action}
    </div>
  )
}

// ─── Greeting banner ─────────────────────────────────────────────────────────

const SCHOOL_BG_GRADIENTS = [
  'from-teal-950/80 via-emerald-950/90 to-cyan-950',
  'from-emerald-950 via-teal-950/80 to-cyan-950/90',
  'from-cyan-950 via-emerald-950/80 to-teal-950/90',
  'from-teal-950/90 via-cyan-950 to-emerald-950/80',
  'from-emerald-950/80 via-cyan-950/90 to-teal-950',
  'from-cyan-950/90 via-teal-950 to-emerald-950/80',
  'from-teal-950 via-emerald-950/90 to-cyan-950/80',
]

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
  { text: "It is the supreme art of the teacher to awaken joy in creative expression and knowledge.", author: "Albert Einstein" },
  { text: "The influence of a good teacher can never be erased.", author: "Unknown" },
  { text: "Be the teacher you needed when you were younger.", author: "Unknown" },
  { text: "Teaching is the greatest act of optimism.", author: "Colleen Wilcox" },
  { text: "Every day may not be good, but there is something good in every day.", author: "Alice Morse Earle" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Leadership is not about being in charge. It is about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
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

const SCHOOL_CLOSING_LINES = [
  "Have a brilliant day \u2014 you're making a difference to every child in that building.",
  "Go get 'em. Today's going to be a great one.",
  "Make today count \u2014 the kids are lucky to have you.",
  "Have an amazing day. You've got everything you need to make it brilliant.",
  "Now go make it happen. You've got this.",
  "That's your briefing \u2014 go be brilliant today.",
  "Have a fantastic day. Every lesson, every moment matters.",
  "Off you go \u2014 today is going to be great.",
  "You're ready. Go make today one to remember.",
  "Have a wonderful day \u2014 the school is in great hands.",
  "Go show them what great teaching looks like.",
  "That's everything \u2014 now go have a brilliant day.",
  "Make today amazing. You've already started it right.",
  "Have a great day \u2014 the difference you make is enormous.",
  "Go get 'em. Today's yours.",
  "That's your morning sorted \u2014 now go be outstanding.",
  "Have a brilliant one. Every child in that school is better off because you're there.",
  "Go make today brilliant. You've got this.",
  "That's the briefing done \u2014 now go do what you do best.",
  "Have an incredible day. The work you do matters more than you know.",
  "Off you go \u2014 make today one the kids will remember.",
  "You're ready for today. Go make it count.",
  "Have a great day \u2014 you're doing something that truly matters.",
  "Go get 'em \u2014 today is full of possibility.",
  "That's everything you need. Now go be brilliant.",
  "Have a wonderful day \u2014 every moment you give is worth it.",
  "Go make today outstanding. You've already done the hard part by showing up.",
  "Have a fantastic day \u2014 the school is lucky to have you.",
  "That's your briefing \u2014 go make today brilliant.",
  "Off you go. Make today count for every child in that building.",
  "Have a great one. You're changing lives \u2014 don't forget that.",
  "Go get 'em. Today has your name on it.",
  "Have a brilliant day \u2014 you make a difference every single day.",
  "That's everything \u2014 now go have the day you deserve.",
  "Go be brilliant. The school needs you at your best today.",
  "Have an amazing day \u2014 every lesson is an opportunity.",
  "You're set. Go make today one to be proud of.",
  "Have a great day \u2014 the work you do here genuinely matters.",
  "Go get 'em. Make today brilliant for every child you see.",
  "That's your morning briefing \u2014 now go make today outstanding.",
  "Have a wonderful day. You're exactly where you're needed.",
  "Go make today brilliant. Every child is counting on people like you.",
  "Have a fantastic day \u2014 you're already ahead just by being prepared.",
  "Off you go. Today is going to be great.",
  "Have a brilliant day \u2014 go show them what great looks like.",
  "That's everything \u2014 go make today incredible.",
  "Go get 'em. You've got this and then some.",
  "Have a great day \u2014 the difference you make here is real.",
  "Go be outstanding. Today is waiting for you.",
  "Have a brilliant one \u2014 every child in that school is better for you being there.",
  "That's your briefing. Now go make today matter.",
  "Have an amazing day \u2014 you're doing something truly important.",
  "Go get 'em. Make every moment count today.",
  "Have a fantastic day \u2014 you're ready and the school needs you.",
  "Off you go \u2014 go make today one to remember.",
  "Have a brilliant day. The impact you have is greater than you realise.",
  "That's everything \u2014 now go be brilliant.",
  "Go make today outstanding. You've got everything you need.",
  "Have a great day \u2014 go show them what you're made of.",
  "That's your morning briefing done. Now go have an absolutely brilliant day.",
]

// ─── World Clock ────────────────────────────────────────────────────────────

function SchoolWorldClock() {
  const [now, setNow] = useState(() => new Date())
  const localTz = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Europe/London'
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  const zones = (() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_world_zones') : null; return s ? JSON.parse(s) : [{ label: 'London', tz: 'Europe/London' }, { label: 'New York', tz: 'America/New_York' }, { label: 'Dubai', tz: 'Asia/Dubai' }, { label: 'Tokyo', tz: 'Asia/Tokyo' }] } catch { return [{ label: 'London', tz: 'Europe/London' }, { label: 'New York', tz: 'America/New_York' }, { label: 'Dubai', tz: 'Asia/Dubai' }, { label: 'Tokyo', tz: 'Asia/Tokyo' }] } })()
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3" style={{ minWidth: 160 }}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {zones.map((z: { label: string; tz: string }) => (
          <div key={z.label} className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-black text-white">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: z.tz, hour12: false })}</span>
            <span className="text-xs" style={{ color: z.tz === localTz ? '#FBBF24' : 'rgba(94,234,212,0.6)' }}>{z.label}</span>
          </div>
        ))}
      </div>
      <div className="text-xs mt-1" style={{ color: '#FBBF24' }}>World Clock</div>
    </div>
  )
}

// ─── Photo Frame ────────────────────────────────────────────────────────────

const SCHOOL_DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
]

function PhotoFrame() {
  const [photos, setPhotos] = useState<string[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-photo-frame') : null; if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map((x: any) => typeof x === 'string' ? x : x.src) } } catch {} return typeof window !== 'undefined' && (localStorage.getItem('lumio_schools_demo_loaded') === 'true' || localStorage.getItem('lumio_demo_active') === 'true') ? SCHOOL_DEMO_PHOTOS : [] })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [photoPositions, setPhotoPositions] = useState<Record<number, { x: number; y: number }>>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-photo-positions') : null; return s ? JSON.parse(s) : {} } catch { return {} } })
  const [hasEverDragged, setHasEverDragged] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio-photo-dragged') === 'true')
  const [hoveringFrame, setHoveringFrame] = useState(false)
  const [showCloudModal, setShowCloudModal] = useState<'google' | 'icloud' | null>(null)
  const isDragging = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 50, y: 50 })

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])
  useEffect(() => { localStorage.setItem('lumio-photo-frame', JSON.stringify(photos)) }, [photos])
  useEffect(() => { localStorage.setItem('lumio-photo-positions', JSON.stringify(photoPositions)) }, [photoPositions])
  function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file || photos.length >= 5) return; const reader = new FileReader(); reader.onload = (ev) => { const src = ev.target?.result as string; setPhotos(prev => [...prev, src]); setCurrentIdx(photos.length) }; reader.readAsDataURL(file); e.target.value = '' }
  function handleRemovePhoto() { if (photos.length <= 1) return; setPhotos(prev => prev.filter((_, i) => i !== currentIdx)); setCurrentIdx(prev => Math.max(0, prev - 1)) }

  function onDragStart(cx: number, cy: number) {
    isDragging.current = true; dragStartRef.current = { x: cx, y: cy }
    posStartRef.current = photoPositions[currentIdx] || { x: 50, y: 50 }
    if (!hasEverDragged) { setHasEverDragged(true); localStorage.setItem('lumio-photo-dragged', 'true') }
  }
  function onDragMove(cx: number, cy: number, el: HTMLElement) {
    if (!isDragging.current) return
    const r = el.getBoundingClientRect()
    const dx = (cx - dragStartRef.current.x) / r.width * 100
    const dy = (cy - dragStartRef.current.y) / r.height * 100
    setPhotoPositions(p => ({ ...p, [currentIdx]: { x: Math.min(100, Math.max(0, posStartRef.current.x - dx)), y: Math.min(100, Math.max(0, posStartRef.current.y - dy)) } }))
  }
  function onDragEnd() { isDragging.current = false }
  function resetPosition() { setPhotoPositions(p => { const n = { ...p }; delete n[currentIdx]; return n }) }
  const pos = photoPositions[currentIdx] || { x: 50, y: 50 }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer m-4" style={{ border: '2px dashed #374151', height: 220 }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">{'\u{1F4F7}'}</div><div className="text-xs" style={{ color: '#9CA3AF' }}>Add your photos</div>
        </div>
      ) : (
      <div className="relative" style={{ height: 220, cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseEnter={() => setHoveringFrame(true)} onMouseLeave={() => { setHoveringFrame(false); onDragEnd() }}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
        onMouseMove={e => onDragMove(e.clientX, e.clientY, e.currentTarget)}
        onMouseUp={onDragEnd}
        onTouchStart={e => { const t = e.touches[0]; if (t) onDragStart(t.clientX, t.clientY) }}
        onTouchMove={e => { const t = e.touches[0]; if (t) onDragMove(t.clientX, t.clientY, e.currentTarget as HTMLElement) }}
        onTouchEnd={onDragEnd}>
        <img src={photos[currentIdx]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${pos.x}% ${pos.y}%`, position: 'absolute', inset: 0, pointerEvents: 'none', transition: isDragging.current ? 'none' : 'object-position 0.15s ease', userSelect: 'none' }} />
        {photos.length > 1 && (<>
          <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i - 1 + photos.length) % photos.length) }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'‹'}</button>
          <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i + 1) % photos.length) }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'›'}</button>
        </>)}
        <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{currentIdx + 1} / {photos.length}</div>
        {(pos.x !== 50 || pos.y !== 50) && hoveringFrame && <button onClick={e => { e.stopPropagation(); resetPosition() }} className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>Reset</button>}
        {!hasEverDragged && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>{'\u2725'} Drag to reposition</div>}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); setShowCloudModal('google') }} title="Import from Google Photos" style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><path d="M12 7c-2.76 0-5 2.24-5 5h5V7z" fill="#EA4335"/><path d="M7 12c0 2.76 2.24 5 5 5v-5H7z" fill="#FBBC04"/><path d="M12 17c2.76 0 5-2.24 5-5h-5v5z" fill="#34A853"/><path d="M17 12c0-2.76-2.24-5-5-5v5h5z" fill="#4285F4"/></svg></button>
          <button onClick={e => { e.stopPropagation(); setShowCloudModal('icloud') }} title="Import from iCloud" style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><svg width="12" height="8" viewBox="0 0 24 16"><path d="M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#3B82F6"/></svg></button>
        </div>
      </div>
      )}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderTop: photos.length > 0 ? '1px solid #1F2937' : 'none' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{'\u{1F5BC}\u{FE0F}'}</span>
          {photos.length > 1 && <>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'transparent', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>)}</>}
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'transparent', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '\u23F8' : '\u25B6'}</button>}
        </div>
        <div className="flex items-center gap-1.5">
          {photos.length > 1 && <button onClick={handleRemovePhoto} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, border: '1px solid #1F2937', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }} title="Remove this photo">{'\u2715'}</button>}
          <button onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 5} title={photos.length >= 5 ? 'Maximum 5 photos' : 'Add a photo'} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: '1px solid #1F2937', background: 'transparent', color: photos.length >= 5 ? '#6B7280' : '#0D9488', cursor: photos.length >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} style={{ display: 'none' }} />
        </div>
      </div>
      {showCloudModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowCloudModal(null)}>
          <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{showCloudModal === 'google' ? '📸' : '☁️'}</div>
            <h3 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{showCloudModal === 'google' ? 'Google Photos' : 'iCloud Photos'}</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>Connect your {showCloudModal === 'google' ? 'Google Photos' : 'iCloud'} to import photos directly into your frame. Available in the next update — for now, upload photos directly using the + Add button above.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#1A1B23', borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Notify me when available</span>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: '#0D9488', position: 'relative', cursor: 'pointer' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, right: 2 }} /></div>
            </div>
            <button onClick={() => setShowCloudModal(null)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0D9488', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI Morning Summary ─────────────────────────────────────────────────────

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
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
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
            <div className="text-center flex-shrink-0 w-12"><div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div><div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate" style={{ color: m.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: m.status === 'done' ? 'line-through' : 'none' }}>{m.title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{m.type}</p></div>
            {m.status !== 'done' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{'\u2705'} Join</button>
                <button className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151' }}>Forward</button>
                <button className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'rgba(127,29,29,0.2)', color: '#F87171', border: '1px solid rgba(127,29,29,0.3)' }}>Decline</button>
              </div>
            )}
            {m.status === 'now' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function SchoolGreetingBanner({ schoolName, firstName, pupils, staff, demoActive }: { schoolName: string; firstName?: string; pupils?: number; staff?: number; demoActive?: boolean }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => SCHOOL_BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useElevenLabsTTS()
  const { isListening, lastCommand, startListening, stopListening } = useSchoolVoiceCommands()
  const [quote, setQuote] = useState(SCHOOL_QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => { const start = new Date(new Date().getFullYear(), 0, 1).getTime(); const dayOfYear = Math.floor((Date.now() - start) / 86400000); setQuote(SCHOOL_QUOTES[dayOfYear % SCHOOL_QUOTES.length]) }, [])
  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = OPENING_LINES[dayOfYear % OPENING_LINES.length]
    const closingLine = SCHOOL_CLOSING_LINES[dayOfYear % SCHOOL_CLOSING_LINES.length]
    const script = `${greeting}, ${firstName || 'there'}. ${openingLine} Attendance is 96.2%. 1 safeguarding concern needs attention. 2 staff updates and an Ofsted check due this week. ${closingLine}`
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script]
    let chunk = ''; const chunks: string[] = []
    for (const s of sentences) { if ((chunk + s).length > 480) { if (chunk) chunks.push(chunk.trim()); chunk = s } else { chunk += s } }
    if (chunk) chunks.push(chunk.trim())
    if (chunks.length > 0) speak(chunks[0])
  }

  // Handle voice command actions
  useEffect(() => {
    if (!lastCommand) return
    const { action, response, data } = lastCommand
    speak(response)
    if (action === 'PLAY_BRIEFING') setTimeout(() => handleBriefing(), 1500)
    else if (action === 'STOP_AUDIO') stop()
    else if (action === 'NAVIGATE' && data?.path) {
      const base = window.location.pathname.split('/').slice(0, 3).join('/')
      setTimeout(() => { window.location.href = `${base}/${data.path}` }, 1500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand])

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
              <button onClick={handleBriefing} title="Text-to-Speech — Lumio will read your morning headlines, meetings today and urgent items aloud" className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#2DD4BF' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
                <Volume2 size={15} strokeWidth={1.75} />
              </button>
              <button onClick={() => isListening ? stopListening() : startListening()} title={isListening ? 'Listening...' : "Voice Commands — say 'Hi Lumio' or tap the mic"}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer', backgroundColor: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', border: isListening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isListening ? '#EF4444' : '#F9FAFB', animation: isListening ? 'pulse 1.5s infinite' : 'none' }}>
                <Mic size={14} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-teal-300 text-sm mb-2">{date}</p>
            <p style={{ color: '#FBBF24' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; &mdash; {quote.author}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Pupils', value: demoActive ? (pupils || '1,147') : '—', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '👨‍🎓' },
              { label: 'Staff', value: demoActive ? (staff || 89) : '—', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
              { label: 'Alerts', value: demoActive ? 6 : 0, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴' },
              { label: 'Reports', value: demoActive ? 2 : 0, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '📋' },
            ].map(item => (
              <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                <span className="text-base">{item.icon}</span>
                <span className="text-lg font-black text-white">{item.value}</span>
                <span className="text-xs opacity-70">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <span className="text-3xl">{weather.icon}</span>
              <div>
                <div className="text-xl font-black text-white">{weather.temp}</div>
                <div className="text-xs text-teal-300">{weather.condition}</div>
              </div>
            </div>
            <SchoolWorldClock />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── School Morning Roundup ──────────────────────────────────────────────────

const SCHOOL_DAY_ITEMS = [
  { id: 'attendance', icon: '✅', label: 'Attendance', count: 3, urgent: true, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    messages: [
      { id: 'a1', from: 'Year 7', avatar: 'Y7', subject: '3 unexplained absences', preview: 'Students: Jamie Wilson, Priya Patel, Marcus Lee \u2014 no contact from parents yet.', time: '8:45am', urgent: true, read: false },
    ]},
  { id: 'safeguarding', icon: '🛡️', label: 'Safeguarding', count: 1, urgent: true, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    messages: [
      { id: 's1', from: 'Mrs Davies (SENCO)', avatar: 'MD', subject: 'CP Case review due today', preview: 'Child Protection case for Student A requires review before end of day. TAC meeting scheduled 3pm.', time: '8:30am', urgent: true, read: false },
    ]},
  { id: 'send', icon: '📋', label: 'SEND Updates', count: 2, urgent: false, color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',
    messages: [
      { id: 'se1', from: 'SEND Team', avatar: 'ST', subject: 'EHC Plan review \u2014 deadline in 3 days', preview: 'Annual review for Student B EHC Plan is due Friday. Draft outcomes need sign-off from SENCO.', time: '9:00am', urgent: false, read: false },
      { id: 'se2', from: 'SEND Team', avatar: 'ST', subject: 'New SEND referral received', preview: 'Class teacher has referred Year 5 student for assessment. Initial meeting to be scheduled.', time: 'Yesterday', urgent: false, read: true },
    ]},
  { id: 'staff', icon: '👥', label: 'Staff Updates', count: 2, urgent: false, color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
    messages: [
      { id: 'st1', from: 'HR System', avatar: 'HR', subject: 'Supply cover needed \u2014 Period 3 & 4', preview: 'Mr Thompson (Science) called in sick. Cover needed for Year 9 and Year 11 classes this afternoon.', time: '7:58am', urgent: false, read: false },
      { id: 'st2', from: 'HR System', avatar: 'HR', subject: 'DBS renewal reminder', preview: '2 staff members have DBS checks expiring within 30 days. Action required before compliance deadline.', time: 'Yesterday', urgent: false, read: true },
    ]},
  { id: 'ofsted', icon: '🏫', label: 'Ofsted Readiness', count: 1, urgent: false, color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)',
    messages: [
      { id: 'o1', from: 'Compliance System', avatar: 'CS', subject: 'Online Safety audit due this week', preview: 'Annual online safety review must be completed and signed off by the headteacher before Friday.', time: '8:00am', urgent: false, read: false },
    ]},
]

function SchoolMorningRoundup() {
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
                  <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {item.messages.map(msg => (
                    <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', opacity: msg.read ? 0.7 : 1 }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: item.color + '22', color: item.color }}>{msg.avatar}</div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.from}</span>
                              {!msg.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />}
                              {msg.urgent && <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', fontSize: 10 }}>Urgent</span>}
                            </div>
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
      <div className="space-y-2 mt-3">
        {[
          { icon: '📱', label: 'SMS Alerts', count: 3, sub: 'unread parent texts', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)' },
          { icon: '📞', label: 'Phone Messages', count: 1, sub: 'voicemail from parent', color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)' },
          { icon: '📧', label: 'Email Inbox', count: 7, sub: 'flagged for action', color: '#0D9488', bg: 'rgba(13,148,136,0.06)', border: 'rgba(13,148,136,0.2)' },
          { icon: '🔔', label: 'Push Notifications', count: 4, sub: 'app alerts', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)' },
          { icon: '📋', label: 'MIS Alerts', count: 2, sub: 'from Arbor/SIMS', color: '#EC4899', bg: 'rgba(236,72,153,0.06)', border: 'rgba(236,72,153,0.2)' },
          { icon: '🏫', label: 'Ofsted Portal', count: 1, sub: 'new correspondence', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)' },
          { icon: '💬', label: 'Teams/Slack', count: 5, sub: 'unread staff messages', color: '#6366F1', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.2)' },
          { icon: '📟', label: 'Announcements', count: 0, sub: 'no new broadcasts', color: '#6B7280', bg: 'rgba(107,114,128,0.04)', border: 'rgba(107,114,128,0.15)' },
        ].map((ch: any) => (
          <div key={ch.label} className="rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all" style={{ backgroundColor: ch.bg || '#111318', border: `1px solid ${ch.border || '#1F2937'}` }}>
            <div className="w-full flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5"><span className="text-base">{ch.icon}</span><span className="text-sm font-bold" style={{ color: ch.color || '#F9FAFB' }}>{ch.label}</span>{ch.count > 0 && <span className="text-xs" style={{ color: '#6B7280' }}>{ch.sub}</span>}</div>
              <div className="flex items-center gap-2"><span className="text-base font-black" style={{ color: ch.color || '#F9FAFB' }}>{ch.count}</span><span className="text-xs" style={{ color: '#6B7280' }}>{'\u25BC'}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'School Office',
  'HR & Staff',
  'Curriculum',
  'SEND & DSL',
  'Finance',
  'Facilities',
  'Admissions',
  'Safeguarding',
]

// ─── Onboarding Modal ─────────────────────────────────────────────────────────

interface InviteRow {
  email: string
  role: string
}

function OnboardingModal({
  slug,
  school,
  onComplete,
}: {
  slug: string
  school: SchoolData
  onComplete: () => void
}) {
  const [step, setStep] = useState(1)
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'teacher' }])
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  function addInviteRow() {
    if (invites.length >= 5) return
    setInvites(prev => [...prev, { email: '', role: 'teacher' }])
  }

  function updateInvite(index: number, field: keyof InviteRow, value: string) {
    setInvites(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  async function handleSendInvites() {
    const validInvites = invites.filter(r => r.email.trim())
    setSending(true)
    try {
      if (validInvites.length > 0) {
        // Fire-and-forget; if the invite endpoint doesn't exist yet we skip silently
        await fetch('/api/schools/auth/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, invites: validInvites }),
        }).catch(() => {/* endpoint may not exist yet */})
      }
    } finally {
      setSending(false)
      setStep(3)
    }
  }

  function handleFinish() {
    if (!selectedDept) return
    onComplete()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#111318',
          border: '1px solid #1F2937',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal header bar */}
        <div style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.05em', color: 'white' }}>Lumio for Schools</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Step {step} of 3 — {step === 1 ? 'Your school' : step === 2 ? 'Invite team' : 'First department'}
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(n => (
              <div
                key={n}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: n <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Step 1: School details ── */}
        {step === 1 && (
          <div style={{ padding: '32px 28px' }}>
            <h2 style={{ color: '#F9FAFB', margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Welcome to Lumio, {school.name}! 👋
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.6 }}>
              Let&apos;s get your school set up in 3 steps.
            </p>

            {/* Pre-filled school info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {[
                { label: 'School name', value: school.name },
                { label: 'Town', value: school.town ?? '—' },
                { label: 'Headteacher', value: school.headteacher ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937', borderRadius: '10px', padding: '12px 16px' }}>
                  <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', margin: '0 0 2px', textTransform: 'uppercase' }}>{label}</p>
                  <p style={{ color: '#F9FAFB', fontSize: '14px', margin: 0, fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg,#0D9488,#0F766E)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2: Invite team ── */}
        {step === 2 && (
          <div style={{ padding: '32px 28px' }}>
            <h2 style={{ color: '#F9FAFB', margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Invite your team
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
              Add colleagues who should have access to your school workspace.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {invites.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      placeholder="colleague@school.edu"
                      value={row.email}
                      onChange={e => updateInvite(i, 'email', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #1F2937',
                        borderRadius: '10px',
                        padding: '10px 12px 10px 36px',
                        color: '#F9FAFB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <select
                    value={row.role}
                    onChange={e => updateInvite(i, 'role', e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid #1F2937',
                      borderRadius: '10px',
                      padding: '10px 10px',
                      color: '#F9FAFB',
                      fontSize: '12px',
                      outline: 'none',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="headteacher">Headteacher</option>
                    <option value="deputy">Deputy</option>
                    <option value="business_manager">Business Mgr</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              ))}
            </div>

            {invites.length < 5 && (
              <button
                onClick={addInviteRow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0 0 20px',
                }}
              >
                <Plus size={14} /> Add another
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleSendInvites}
                disabled={sending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 20px',
                  background: sending ? 'rgba(13,148,136,0.4)' : 'linear-gradient(135deg,#0D9488,#0F766E)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                Send invites &amp; continue →
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '6px',
                  textDecoration: 'underline',
                }}
              >
                Skip for now →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: First department ── */}
        {step === 3 && (
          <div style={{ padding: '32px 28px' }}>
            <h2 style={{ color: '#F9FAFB', margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Which department do you want to set up first?
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
              You can always come back and configure others later.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    padding: '14px 12px',
                    background: selectedDept === dept
                      ? 'rgba(13,148,136,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: selectedDept === dept
                      ? '1px solid #0D9488'
                      : '1px solid #1F2937',
                    borderRadius: '10px',
                    color: selectedDept === dept ? '#0D9488' : '#D1D5DB',
                    fontSize: '13px',
                    fontWeight: selectedDept === dept ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={!selectedDept}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 20px',
                background: selectedDept ? 'linear-gradient(135deg,#0D9488,#0F766E)' : 'rgba(255,255,255,0.06)',
                color: selectedDept ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: selectedDept ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              Let&apos;s go →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolDashboard({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug: _slug } = use(params)
  const attendanceAvg = Math.round(ATTENDANCE_BY_YEAR.reduce((s, y) => s + y.pct, 0) / ATTENDANCE_BY_YEAR.length * 10) / 10
  const staffIn = STAFF_TODAY.filter(s => s.status === 'in').length

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showLiveOnboarding, setShowLiveOnboarding] = useState(false)
  const [schoolId, setSchoolId] = useState('')
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)
  const [demoDataActive, setDemoDataActive] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('lumio_schools_demo_loaded') === 'true'
  )
  const [showLockdown, setShowLockdown] = useState(false)
  const [lockdownStep, setLockdownStep] = useState(0)
  const [lockdownType, setLockdownType] = useState<'emergency' | 'drill' | ''>('')
  const [showSafeguardingReview, setShowSafeguardingReview] = useState(false)
  const [lockdownIncident, setLockdownIncident] = useState('Intruder on site')
  const [lockdownDesc, setLockdownDesc] = useState('')
  const [lockdownLocation, setLockdownLocation] = useState('Unknown')
  const [lockdownBanner, setLockdownBanner] = useState(false)

  useEffect(() => {
    fetch(`/api/schools/${_slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setSchoolData(data)
          if (data.id) setSchoolId(data.id)
          if (data.demo_data_active) setDemoDataActive(true)
          // Set school role — default to SLT (headteacher/owner) for now
          // The school creator is always SLT level
          if (!localStorage.getItem('lumio_school_role_level')) {
            localStorage.setItem('lumio_school_role_level', '1')
            localStorage.setItem('lumio_school_is_owner', 'true')
          }
          // Live onboarding wizard — only show if NEVER completed AND recently created
          const schoolOnboarded = data.onboarding_completed || data.onboarded || data.onboarding_complete
          const schoolDismissed = localStorage.getItem(`onboarding-dismissed-${_slug}`)
          if (schoolOnboarded || schoolDismissed) {
            localStorage.setItem(`lumio_onboarded_${_slug}`, 'true')
            localStorage.setItem('lumio_onboarding_shown', 'true')
          } else if (!data.demo_data_active) {
            const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0
            const isNewTenant = createdAt > 0 && (Date.now() - createdAt) < 10 * 60 * 1000
            if (isNewTenant && !localStorage.getItem(`lumio_onboarded_${_slug}`) && !localStorage.getItem('lumio_onboarding_shown') && !localStorage.getItem('lumio_tour_completed')) {
              setShowLiveOnboarding(true)
              return
            }
          }
        }
        // Only show old onboarding modal if no localStorage guard AND no dismiss
        const key = `lumio_onboarded_${_slug}`
        if (!localStorage.getItem(key) && !localStorage.getItem(`onboarding-dismissed-${_slug}`) && !localStorage.getItem('lumio_onboarding_shown')) {
          // Don't show — existing tenants should not see onboarding; set the guard
          localStorage.setItem(key, 'true')
        }
      })
      .catch(() => {})
      .finally(() => {
        // If API didn't return data, build from localStorage (set during checkout)
        setSchoolData(prev => {
          if (prev) return prev
          const storedName = localStorage.getItem(`lumio_school_${_slug}_name`)
          if (!storedName) return prev
          return {
            name: storedName,
            headteacher: null,
            town: null,
            ofsted_rating: null,
            pupil_count: null,
            staff_count: null,
          }
        })
      })
  }, [_slug])

  function completeOnboarding() {
    localStorage.setItem(`lumio_onboarded_${_slug}`, 'true')
    setShowOnboarding(false)
  }

  const isAdminImpersonating = typeof window !== 'undefined' && localStorage.getItem('lumio_impersonated_from_admin') === 'true'
  const ownerName = isAdminImpersonating
    ? (localStorage.getItem('lumio_impersonated_user_name') || localStorage.getItem(`lumio_school_${_slug}_owner`) || '')
    : (localStorage.getItem(`lumio_school_${_slug}_owner`) || '')
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('lumio_user_email') || '' : ''
  const userName = typeof window !== 'undefined' ? localStorage.getItem('lumio_user_name') || '' : ''
  const firstName = ownerName ? ownerName.split(' ')[0] : userName ? userName.split(' ')[0] : userEmail ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1) : undefined
  const schoolName = schoolData?.name || localStorage.getItem(`lumio_school_${_slug}_name`) || ''

  const [activeTab, setActiveTab] = useState('today')
  const [staffSubTab, setStaffSubTab] = useState<'today'|'org'|'info'|'school'>('today')
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  const TABS = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'quick-wins', label: 'Quick Wins', icon: '⚡' },
    { id: 'tasks', label: 'Daily Tasks', icon: '✅' },
    { id: 'insights', label: 'Insights', icon: '📊' },
    { id: 'dont-miss', label: "Don't Miss", icon: '🔴' },
    { id: 'staff', label: 'Staff', icon: '👥' },
  ]

  return (
    <div className="space-y-4">

      {/* 1. Greeting banner */}
      <SchoolGreetingBanner schoolName={schoolName} firstName={firstName || 'there'} pupils={schoolData?.pupil_count || undefined} staff={schoolData?.staff_count || undefined} demoActive={demoDataActive} />

      {/* 2. Tab bar */}
      <div className="border-b overflow-x-auto scrollbar-none -mx-4 sm:-mx-5" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
        <div className="flex items-center gap-0 min-w-max px-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={{ borderBottomColor: activeTab === t.id ? '#0D9488' : 'transparent', color: activeTab === t.id ? '#2DD4BF' : '#6B7280', backgroundColor: activeTab === t.id ? 'rgba(13,148,136,0.05)' : 'transparent' }}>
              <span className="text-base">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Quick actions — 2 rows of 10 */}
      <div className="px-4 py-3" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937', borderRadius: 12 }}>
        <span className="text-xs font-semibold mb-1.5 block" style={{ color: '#4B5563' }}>Quick actions</span>
        {[
          [
            { label: 'Safeguarding Referral', icon: '\u{1F6A8}', pulse: false },
            { label: 'School Lockdown', icon: '\u{1F534}', pulse: false, red: true },
            { label: 'New Concern', icon: '\u26A0\uFE0F' },
            { label: 'Mark Register', icon: '\u2705' },
            { label: 'Behaviour Incident', icon: '\u{1F4CB}' },
            { label: 'Log Absence', icon: '\u{1FAE5}' },
            { label: 'Parent Contact', icon: '\u{1F4DE}' },
            { label: 'Book Cover', icon: '\u{1F4D6}' },
            { label: 'New Admission', icon: '\u2795' },
            { label: 'Refer to SENCO', icon: '\u{1F9E0}' },
          ],
          [
            { label: 'Create Lesson Plan', icon: '\u2728' },
            { label: 'Send Parent Email', icon: '\u{1F4E7}' },
            { label: 'Pupil Progress Note', icon: '\u{1F4C8}' },
            { label: 'Request Resources', icon: '\u{1F4E6}' },
            { label: 'IT Support', icon: '\u{1F4BB}' },
            { label: 'Book CPD / Training', icon: '\u{1F393}' },
            { label: 'Claim Expenses', icon: '\u{1F4B0}' },
            { label: 'Request Leave', icon: '\u{1F3D6}\uFE0F' },
            { label: 'Report Staff Absence', icon: '\u{1F464}' },
            { label: 'Submit Risk Assessment', icon: '\u26A0\uFE0F' },
          ],
        ].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, marginBottom: ri === 0 ? 6 : 0, overflowX: 'auto' }} className="scrollbar-hide">
            {row.map((a: any) => (
              <button key={a.label} onClick={() => { if (a.label === 'School Lockdown') { setShowLockdown(true); setLockdownStep(0); setLockdownType('') } }} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all hover:opacity-90 ${a.pulse ? 'animate-pulse' : ''}`} style={{ backgroundColor: a.label === 'Safeguarding Referral' || a.red ? '#DC2626' : '#0D9488', color: '#F9FAFB' }}>
                <span>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 4. Safeguarding alert — only when demo data is active */}
      {demoDataActive && activeTab === 'today' && (
        <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderLeft: '4px solid #EF4444' }}>
          <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
          </div>
          <button onClick={() => setShowSafeguardingReview(true)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Review now</button>
        </div>
      )}

      {/* TAB: Today */}
      {activeTab === 'today' && (
        <>
          {demoDataActive ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-1 flex flex-col"><SchoolMorningRoundup /></div>
            <div className="lg:col-span-1 flex flex-col"><SchoolMeetingsToday /></div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <PhotoFrame />
              <SchoolAIPanel />
              <div className="rounded-xl p-4 mt-3" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{'\u{1F916}'}</span>
                  <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
                  <span className="ml-auto text-xs" style={{ color: '#64748b' }}>Updated just now</span>
                </div>
                <div className="space-y-2">
                  {[
                    { n: 1, text: 'Attendance today is 96.2% — Year 6 at 91.8%, below 94% target', color: '#F59E0B' },
                    { n: 2, text: '1 open safeguarding concern requires DSL review before 3pm', color: '#EF4444' },
                    { n: 3, text: '3 cover lessons needed this afternoon — 2 unassigned', color: '#F59E0B' },
                    { n: 4, text: 'SENCO review meeting at 11:30 — 4 pupils on agenda', color: '#3B82F6' },
                    { n: 5, text: 'Year 11 mock results due for upload by end of day', color: '#3B82F6' },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold w-4 flex-shrink-0 mt-0.5" style={{ color: h.color }}>{h.n}</span>
                      <span className="text-xs" style={{ color: '#D1D5DB' }}>{h.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Staff Today */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: '#F9FAFB' }}>👥 Staff Today</h3>
                {demoDataActive ? (
                  <div className="space-y-1">
                    {STAFF_TODAY.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 py-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{s.name.split(' ').slice(-1)[0][0]}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{s.name}</p></div>
                        <StaffBadge status={s.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs py-4 text-center" style={{ color: '#6B7280' }}>No staff data yet. Import staff via CSV or sync from your MIS.</p>
                )}
              </div>
            </div>
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="text-5xl mb-4">🏫</div>
              <h2 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Connect your tools to get started</h2>
              <p className="text-sm text-center mb-6" style={{ color: '#6B7280', maxWidth: 400 }}>Your daily overview, AI insights and schedule will appear here once your data is connected. Load demo data to explore.</p>
              <button onClick={() => { localStorage.setItem('lumio_schools_demo_loaded', 'true'); window.location.reload() }} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>✨ Explore with Demo Data</button>
            </div>
          )}
        </>
      )}

      {/* TAB: Quick Wins */}
      {activeTab === 'quick-wins' && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>⚡ Quick Wins</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>High impact, low effort — sorted by priority. Do these first.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <span>🔗</span>
            <span className="text-sm" style={{ color: '#5EEAD4' }}>These suggestions are AI-generated based on your role. Connect your tools in Settings for personalised insights.</span>
          </div>
          {true ? (
            <div className="space-y-3">
              {([
                { id: 'qw1', title: 'Mark your morning register', description: 'Quick admin task to start the day.', impact: 'high' as const, effort: '2min', category: 'Admin', action: 'Mark now', source: 'MIS' },
                { id: 'qw2', title: 'Reply to 3 parent emails flagged for action', description: 'Flagged emails awaiting your response.', impact: 'high' as const, effort: '4min', category: 'Comms', action: 'Open inbox', source: 'Email' },
                { id: 'qw3', title: 'Log yesterday\'s behaviour incident', description: 'Incident not yet recorded in the system.', impact: 'medium' as const, effort: '2min', category: 'Pastoral', action: 'Log now', source: 'Behaviour Log' },
                { id: 'qw4', title: 'Complete SENCO referral form for Year 7 pupil', description: 'Referral form partially completed — needs finishing.', impact: 'medium' as const, effort: '3min', category: 'SEND', action: 'Complete form', source: 'SEND Register' },
                { id: 'qw5', title: 'Upload Year 11 mock results to MIS', description: 'Results due for upload by end of day.', impact: 'medium' as const, effort: '4min', category: 'Data', action: 'Upload now', source: 'MIS' },
                { id: 'qw6', title: 'Submit outstanding expense claim (£42.50)', description: 'Claim submitted but awaiting your sign-off.', impact: 'medium' as const, effort: '2min', category: 'Finance', action: 'Submit claim', source: 'Finance' },
              ]).map(win => {
                const impactColors = win.impact === 'high'
                  ? { bg: 'rgba(239,68,68,0.12)', color: '#F87171' }
                  : { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' }
                return (
                  <div key={win.id} className="rounded-2xl p-5 transition-all"
                    style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: impactColors.bg, color: impactColors.color }}>{win.impact.toUpperCase()} IMPACT</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}>⏱ {win.effort}</span>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{win.category}</span>
                        </div>
                        <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{win.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{win.description}</p>
                        <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {win.source}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                          style={{ backgroundColor: '#7C3AED' }}>
                          {win.action} →
                        </button>
                        <button className="px-4 py-2 text-xs rounded-xl transition-colors"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                          Mark done
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      )}

      {/* TAB: Daily Tasks — matches business portal format */}
      {activeTab === 'tasks' && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>{'✅'} Daily Tasks</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>0/8 done · pulled from MIS, Lumio workflows, and manual entries</p>
            </div>
            <button className="px-4 py-2 text-sm font-bold rounded-xl transition-colors" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>+ Add task</button>
          </div>
          <div className="flex gap-2 mb-5 flex-wrap">
            {[{f:'all',l:'All (8)'},{f:'critical',l:'Critical (1)'},{f:'high',l:'High (4)'},{f:'medium',l:'Medium (2)'},{f:'low',l:'Low (1)'}].map(p => (
              <button key={p.f} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all" style={{ backgroundColor: p.f === 'all' ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: p.f === 'all' ? '#fff' : '#6B7280' }}>{p.l}</button>
            ))}
          </div>
          <div className="space-y-2">
            {[
              {id:'dt1',priority:'Critical',color:'#EF4444',dept:'Safeguarding',source:'lumio',time:'Before 3pm',title:'Review open safeguarding concern with DSL',desc:'Year 9 pupil — DSL sign-off required before 3pm today.',tag:'SG-2026-001',action:'Review now'},
              {id:'dt2',priority:'High',color:'#F59E0B',dept:'Admin',source:'lumio',time:'09:30',title:'Confirm attendance for all classes',desc:'3 unexplained absences flagged — parents not yet contacted.',action:'View registers'},
              {id:'dt3',priority:'High',color:'#F59E0B',dept:'Cover',source:'workflow',time:'08:45',title:'Assign cover for Period 3 and Period 5',desc:'Mr Johnson absent — 2 lessons currently unassigned.',tag:'COV-07',action:'Assign cover'},
              {id:'dt4',priority:'High',color:'#F59E0B',dept:'Curriculum',source:'manual',time:'Any time',title:'Upload Year 11 mock results to MIS',desc:'Results due by 4pm — 3 classes outstanding.',action:'Upload results'},
              {id:'dt5',priority:'Medium',color:'#3B82F6',dept:'HR',source:'workflow',time:'16:00',title:"Approve leave request — Ms O'Brien",desc:'Compassionate leave 7-8 April. Needs sign-off today.',tag:'HR-04',action:'Approve'},
              {id:'dt6',priority:'Medium',color:'#3B82F6',dept:'Finance',source:'manual',time:'Any time',title:'Submit outstanding expense claim',desc:'£42.50 travel — overdue by 3 days.',action:'Submit claim'},
              {id:'dt7',priority:'High',color:'#F59E0B',dept:'SEND',source:'lumio',time:'11:30',title:'Confirm SENCO meeting agenda',desc:'4 pupils on review — agenda not yet circulated.',action:'Open agenda'},
              {id:'dt8',priority:'Low',color:'#6B7280',dept:'Facilities',source:'manual',time:'Any time',title:'Sign off Year 9 trip risk assessment',desc:'All approvals received — final sign-off needed.',action:'Sign off'},
            ].map((t: any) => (
              <div key={t.id} className="rounded-xl p-4 flex items-start gap-4" style={{ backgroundColor: '#111318', border: `1px solid ${t.id === 'dt1' ? 'rgba(239,68,68,0.3)' : '#1F2937'}` }}>
                <button className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${t.color}1a`, color: t.color }}>{t.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.dept}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(108,63,197,0.1)', color: '#A78BFA' }}>{t.source}</span>
                    <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{t.time}</span>
                  </div>
                  <h4 className="font-semibold text-sm" style={{ color: '#E5E7EB' }}>{t.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>{t.desc}</p>
                  {t.tag && <span className="inline-block text-xs mt-2 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>{t.tag}</span>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap" style={{ backgroundColor: '#7C3AED' }}>{t.action} →</button>
                  <button className="px-4 py-2 text-xs rounded-xl transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>Mark done</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* TAB: Insights */}
      {activeTab === 'insights' && (
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>📊 Insights</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>AI-generated from your live data — updated every morning at 6am</p>
            </div>
            <div className="text-xs" style={{ color: '#374151' }}>Last run: today 07:00</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ALERT */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2"><span className="text-xl">🚨</span><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F87171' }}>ALERT</span></div>
                <div className="text-right"><div className="text-lg font-black" style={{ color: '#F87171' }}>6 at risk</div><div className="text-xs" style={{ color: '#6B7280' }}>+1 since last week</div></div>
              </div>
              <h3 className="font-bold mb-2 leading-tight" style={{ color: '#F9FAFB' }}>6 pupils below attendance threshold</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>Attendance engine flagged 6 pupils below 90%. At-risk pupils are 3× more likely to require intervention.</p>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#374151' }}>📡 Attendance Monitor</span><button className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: '#F87171', backgroundColor: 'rgba(255,255,255,0.05)' }}>View at-risk →</button></div>
            </div>
            {/* OPPORTUNITY */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2"><span className="text-xl">💡</span><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FBBF24' }}>OPPORTUNITY</span></div>
                <div className="text-right"><div className="text-lg font-black" style={{ color: '#FBBF24' }}>3 referrals</div><div className="text-xs" style={{ color: '#6B7280' }}>Score: High priority</div></div>
              </div>
              <h3 className="font-bold mb-2 leading-tight" style={{ color: '#F9FAFB' }}>3 SEND pupils due annual review this term</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>Reviews are statutory. Missing deadlines risks Ofsted action. Two parents not yet contacted.</p>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#374151' }}>📡 SEND tracker</span><button className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: '#FBBF24', backgroundColor: 'rgba(255,255,255,0.05)' }}>View referrals →</button></div>
            </div>
            {/* TREND */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2"><span className="text-xl">📈</span><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60A5FA' }}>TREND</span></div>
                <div className="text-right"><div className="text-lg font-black" style={{ color: '#4ADE80' }}>87%</div><div className="text-xs" style={{ color: '#6B7280' }}>+4% vs last month</div></div>
              </div>
              <h3 className="font-bold mb-2 leading-tight" style={{ color: '#F9FAFB' }}>Ofsted readiness score up 4% this month</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>Self-assessment improvements in Safeguarding and Curriculum. Target 90% by end of term.</p>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#374151' }}>📡 Ofsted readiness engine</span><button className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: '#60A5FA', backgroundColor: 'rgba(255,255,255,0.05)' }}>View report →</button></div>
            </div>
            {/* ACHIEVEMENT */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2"><span className="text-xl">🏆</span><span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4ADE80' }}>ACHIEVEMENT</span></div>
                <div className="text-right"><div className="text-lg font-black" style={{ color: '#4ADE80' }}>32h saved</div><div className="text-xs" style={{ color: '#6B7280' }}>£640 value</div></div>
              </div>
              <h3 className="font-bold mb-2 leading-tight" style={{ color: '#F9FAFB' }}>Admin workflows saved 32 hours this month</h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>Cover booking, absence logging and parent contact automation ran 47 times. Average 40 mins saved per task.</p>
              <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#374151' }}>📡 Workflow execution logs</span><button className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: '#4ADE80', backgroundColor: 'rgba(255,255,255,0.05)' }}>View breakdown →</button></div>
            </div>
          </div>

          {/* AI Intelligence Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8 pt-6" style={{ borderTop: '1px solid #1F2937' }}>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(217,119,6,0.3)' }}>
              <div className="flex items-center gap-2 mb-3"><span>🧠</span><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Executive Briefing</span></div>
              <div className="space-y-2">
                {['Attendance at 96.2% — Year 6 below target', '1 safeguarding concern awaiting DSL review', '3 cover lessons unassigned for this afternoon', 'Ofsted readiness at 87% — up 4% this month'].map((s, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#D97706' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>{s}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(108,63,197,0.3)' }}>
              <div className="flex items-center gap-2 mb-3"><span>✨</span><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Summary</span><span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Generated now</span></div>
              <div className="space-y-2">
                {['Attendance stable at 96.2% — Year 6 dipping below 94% target, Year 3 recovering well', 'Behaviour incidents down 18% this week — new lunch rota contributing', 'Staff absence: 1 teacher off today, cover arranged for 2 of 3 lessons', 'Priority this week: Year 11 mock results upload, SENCO reviews, Ofsted self-assessment'].map((s, i) => (
                  <div key={i} className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#7C3AED' }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>{s}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(13,148,136,0.3)' }}>
              <div className="flex items-center gap-2 mb-3"><span>⚡</span><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span><span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Today</span></div>
              <div className="space-y-2">
                {[
                  { n: 1, text: 'Attendance 96.2% — Year 6 at 91.8%, below 94% target', color: 'text-amber-400' },
                  { n: 2, text: '1 safeguarding concern — DSL review required today', color: 'text-red-400' },
                  { n: 3, text: '3 cover lessons needed — 2 unassigned', color: 'text-amber-400' },
                  { n: 4, text: 'Year 11 mock results upload due 4pm', color: 'text-teal-400' },
                  { n: 5, text: 'Ofsted readiness 87% — 3% from Outstanding threshold', color: 'text-teal-400' },
                ].map(h => (
                  <div key={h.n} className="flex items-start gap-2"><span className={`text-xs font-bold w-4 flex-shrink-0 mt-0.5 ${h.color}`}>{h.n}</span><span className="text-xs" style={{ color: '#D1D5DB' }}>{h.text}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Don't Miss — matches business portal NotToMiss format exactly */}
      {activeTab === 'dont-miss' && (() => {
        const U: Record<string, { bg: string; border: string; tagBg: string; label: string }> = {
          critical: { bg: 'rgba(153,27,27,0.15)', border: 'rgba(239,68,68,0.35)', tagBg: '#DC2626', label: '🔴 CRITICAL' },
          today:    { bg: 'rgba(120,53,15,0.12)', border: 'rgba(245,158,11,0.25)', tagBg: '#D97706', label: '🟡 TODAY' },
          soon:     { bg: 'rgba(29,78,216,0.08)', border: 'rgba(59,130,246,0.2)',  tagBg: '#2563EB', label: '🔵 THIS WEEK' },
        }
        const ALL = [
          { id: 'dm1', urgency: 'critical', category: 'Safeguarding', deadline: 'Before 3pm today', title: 'Open safeguarding concern — DSL sign-off required', body: 'Year 9 pupil concern logged 2 days ago. DSL review is overdue. Ofsted requires same-day review for high-risk concerns.', consequence: 'Statutory breach risk', action: 'Review now' },
          { id: 'dm2', urgency: 'critical', category: 'Exams', deadline: '4pm today', title: 'Year 11 mock results not uploaded to MIS', body: '3 classes outstanding. Results needed for progress reports going to parents Friday. Data manager flagged this yesterday.', consequence: 'Parent reports delayed', action: 'Upload results' },
          { id: 'dm3', urgency: 'critical', category: 'Cover', deadline: 'Before Period 3', title: '2 cover lessons unassigned this afternoon', body: 'Mr Johnson absent — Period 3 Year 10 Maths and Period 5 Year 8 Science have no cover supervisor assigned.', consequence: 'Classes unsupervised', action: 'Assign cover' },
          { id: 'dm4', urgency: 'today', category: 'SEND', deadline: '11:30am', title: 'SENCO review meeting agenda not circulated', body: '4 pupils on agenda for 11:30 review. Agenda not yet sent to class teachers or parents attending.', consequence: 'Meeting delayed', action: 'Send agenda' },
          { id: 'dm5', urgency: 'today', category: 'CPD', deadline: 'Sunday midnight', title: 'CPD booking closes Sunday — Trauma-informed teaching', body: '3 staff have not confirmed attendance. Course is fully funded and counts toward appraisal targets.', consequence: 'Places lost', action: 'Book now' },
          { id: 'dm6', urgency: 'soon', category: 'Compliance', deadline: 'End of month', title: 'Ofsted self-assessment due end of month', body: 'Currently 87% complete. 3 sections outstanding: Behaviour, SEND provision, and Curriculum impact. Target is 90%.', consequence: 'Inspection readiness at risk', action: 'Complete now' },
        ]
        const [dismissed, setDismissedDM] = React.useState<Set<string>>(new Set())
        const active = ALL.filter(i => !dismissed.has(i.id))
        return (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>🔴 Don&apos;t Miss Today</h2>
                <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Critical items that need your attention — sorted by urgency</p>
              </div>
              <div className="text-sm" style={{ color: '#6B7280' }}>{active.length} items</div>
            </div>
            <div className="space-y-3">
              {active.map(item => {
                const u = U[item.urgency]
                return (
                  <div key={item.id} className="rounded-2xl p-5"
                    style={{ backgroundColor: u.bg, border: `1px solid ${u.border}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
                            style={{ backgroundColor: u.tagBg }}>{u.label}</span>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{item.category}</span>
                          <span className="text-xs" style={{ color: '#6B7280' }}>Deadline: {item.deadline}</span>
                        </div>
                        <h3 className="font-bold mb-1.5" style={{ color: '#F9FAFB' }}>{item.title}</h3>
                        <p className="text-sm leading-relaxed mb-2" style={{ color: '#9CA3AF' }}>{item.body}</p>
                        <p className="text-xs" style={{ color: 'rgba(248,113,113,0.8)' }}>⚠️ If not done: {item.consequence}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => { if (item.action === 'Review now') setShowSafeguardingReview(true) }}
                          className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                          style={{ backgroundColor: '#7C3AED' }}>
                          {item.action} →
                        </button>
                        <button onClick={() => setDismissedDM(prev => { const n = new Set(prev); n.add(item.id); return n })}
                          className="px-4 py-2 text-xs rounded-xl transition-colors"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {active.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Nothing critical today!</p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>All urgent items are handled.</p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* TAB: Staff */}
      {activeTab === 'staff' && (() => {
        const SCHOOL_STAFF = [
          { name: 'Sarah Mitchell', role: 'Headteacher', dept: 'SLT', initials: 'SM', color: '#0D9488', status: 'available', email: 'headteacher@oakridge.edu', level: 1, stats: { TEA: 92, COM: 95, PLA: 88, ENG: 91, WEL: 86, EXP: 97 }, overall: 94 },
          { name: 'James Okafor', role: 'Deputy Head', dept: 'SLT', initials: 'JO', color: '#6D28D9', status: 'available', email: 'deputy@oakridge.edu', level: 2, stats: { TEA: 89, COM: 91, PLA: 85, ENG: 88, WEL: 90, EXP: 82 }, overall: 88 },
          { name: 'Emma Clarke', role: 'SENCO', dept: 'SEND', initials: 'EC', color: '#EC4899', status: 'in-meeting', email: 'senco@oakridge.edu', level: 2, stats: { TEA: 84, COM: 92, PLA: 90, ENG: 79, WEL: 95, EXP: 86 }, overall: 87 },
          { name: 'Tom Bradley', role: 'Year 6 Teacher', dept: 'Teaching', initials: 'TB', color: '#3B82F6', status: 'available', email: 'tbradley@oakridge.edu', level: 3, stats: { TEA: 86, COM: 82, PLA: 91, ENG: 93, WEL: 78, EXP: 74 }, overall: 84 },
          { name: 'Priya Patel', role: 'DSL', dept: 'Safeguarding', initials: 'PP', color: '#EF4444', status: 'available', email: 'dsl@oakridge.edu', level: 2, stats: { TEA: 81, COM: 94, PLA: 77, ENG: 85, WEL: 92, EXP: 88 }, overall: 86 },
          { name: 'Mark Davis', role: 'Business Manager', dept: 'Admin', initials: 'MD', color: '#F59E0B', status: 'away', email: 'bursar@oakridge.edu', level: 2, stats: { TEA: 78, COM: 85, PLA: 93, ENG: 72, WEL: 80, EXP: 91 }, overall: 83 },
        ]
        const statusC: Record<string, { dot: string; label: string }> = { available: { dot: '#22C55E', label: 'Available' }, 'in-meeting': { dot: '#F59E0B', label: 'In meeting' }, away: { dot: '#6B7280', label: 'Away' } }
        return (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[{ id: 'today' as const, label: '👥 Staff Today' }, { id: 'org' as const, label: '🏢 Org Chart' }, { id: 'info' as const, label: '🃏 Staff Info' }, { id: 'school' as const, label: '📋 School Info' }].map(t => (
              <button key={t.id} onClick={() => setStaffSubTab(t.id)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: staffSubTab === t.id ? '#0D9488' : '#111318', color: staffSubTab === t.id ? '#F9FAFB' : '#6B7280', border: staffSubTab === t.id ? 'none' : '1px solid #1F2937' }}>{t.label}</button>
            ))}
          </div>

          {/* AI suggestions banner */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-0" style={{ backgroundColor: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)' }}>
            <span>🔗</span>
            <span className="text-sm" style={{ color: '#A78BFA' }}>These suggestions are AI-generated based on your role. Connect your tools in Settings for personalised insights.</span>
          </div>

          {/* STAFF TODAY */}
          {staffSubTab === 'today' && (
            <>
              <div><h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Staff Today</h2><p className="text-xs" style={{ color: '#6B7280' }}>{SCHOOL_STAFF.filter(s => s.status === 'available').length} available · {SCHOOL_STAFF.filter(s => s.status !== 'available').length} away/busy</p></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {SCHOOL_STAFF.map(m => (
                  <div key={m.name} className="rounded-2xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${m.color}20`, color: m.color }}>{m.initials}</div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: statusC[m.status]?.dot || '#6B7280', borderColor: '#111318' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm" style={{ color: '#E5E7EB' }}>{m.name}</span>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{m.role} · {m.dept}</p>
                        <span className="text-xs font-medium" style={{ color: statusC[m.status]?.dot || '#6B7280' }}>{statusC[m.status]?.label || m.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ORG CHART */}
          {staffSubTab === 'org' && (
            <div>
              <h2 className="text-xl font-black mb-6" style={{ color: '#F9FAFB' }}>Organisation Chart</h2>
              <div className="flex justify-center mb-6">
                <div className="rounded-xl p-4 text-center w-48" style={{ backgroundColor: '#111318', border: '2px solid #0D9488' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>SM</div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Sarah Mitchell</p>
                  <p className="text-[10px]" style={{ color: '#0D9488' }}>Headteacher</p>
                </div>
              </div>
              <div className="flex justify-center mb-2"><div className="w-px h-8" style={{ backgroundColor: '#374151' }} /></div>
              <div className="flex justify-center mb-2"><div className="h-px" style={{ backgroundColor: '#374151', width: '70%' }} /></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {SCHOOL_STAFF.filter(s => s.level >= 2).map(m => (
                  <div key={m.name} className="flex flex-col items-center">
                    <div className="w-px h-6 mb-2" style={{ backgroundColor: '#374151' }} />
                    <div className="rounded-xl p-3 text-center w-full" style={{ backgroundColor: '#111318', border: `1px solid ${m.color}` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1" style={{ backgroundColor: `${m.color}20`, color: m.color }}>{m.initials}</div>
                      <p className="text-xs font-bold truncate" style={{ color: '#F9FAFB' }}>{m.name}</p>
                      <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF INFO — FIFA/Panini cards (identical to business portal Team Info) */}
          {staffSubTab === 'info' && (() => {
            const SCHOOL_DEMO_STAFF: StaffRecord[] = [
              { first_name: 'Sarah', last_name: 'Mitchell', job_title: 'Headteacher', department: 'Leadership', email: 'headteacher@oakridge.edu' },
              { first_name: 'James', last_name: 'Okafor', job_title: 'Deputy Head', department: 'Leadership', email: 'deputy@oakridge.edu' },
              { first_name: 'Emma', last_name: 'Clarke', job_title: 'SENCO', department: 'HR', email: 'senco@oakridge.edu' },
              { first_name: 'Tom', last_name: 'Bradley', job_title: 'Year 6 Teacher', department: 'Support', email: 'tbradley@oakridge.edu' },
              { first_name: 'Priya', last_name: 'Patel', job_title: 'DSL', department: 'Support', email: 'dsl@oakridge.edu' },
              { first_name: 'Mark', last_name: 'Davis', job_title: 'Business Manager', department: 'Finance', email: 'bursar@oakridge.edu' },
            ]
            return (
              <div className="space-y-4">
                <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Staff Info</h2>
                <div className={`grid gap-4 justify-items-center ${getGridCols(SCHOOL_DEMO_STAFF.length)}`}>
                  {SCHOOL_DEMO_STAFF.map((s, i) => (
                    <EmployeeProfileCard key={i} staff={s} index={i} isCurrentUser={i === 0} onViewProfile={() => {}} teamSize={SCHOOL_DEMO_STAFF.length} />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* SCHOOL INFO */}
          {staffSubTab === 'school' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>School Info</h2>

              {/* School Documents */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#9CA3AF' }}>SCHOOL DOCUMENTS</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { icon: '📋', title: 'Staff Handbook', sub: 'Employment policies, conduct, benefits' },
                    { icon: '🏖️', title: 'Leave & Holiday Policy', sub: 'Annual leave, INSET days, booking' },
                    { icon: '❤️', title: 'Health & Wellbeing', sub: 'Mental health, EAP, sick leave' },
                    { icon: '🔒', title: 'Data & Security', sub: 'GDPR, data handling, safeguarding' },
                    { icon: '💰', title: 'Expenses Policy', sub: 'Claims, limits, deadlines' },
                    { icon: '📚', title: 'CPD & Development', sub: 'Training budget, study leave' },
                  ].map(d => (
                    <div key={d.title} className="rounded-xl p-4 cursor-pointer hover:border-teal-500/30 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <span className="text-lg">{d.icon}</span>
                      <p className="text-sm font-semibold mt-2" style={{ color: '#F9FAFB' }}>{d.title}</p>
                      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{d.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* School Details */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#9CA3AF' }}>SCHOOL DETAILS</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Ofsted Rating', 'Outstanding (2023)'],
                    ['School Type', 'Academy'],
                    ['Phase', 'Secondary'],
                    ['Capacity', '1,200 pupils'],
                    ['NOR (Number on Roll)', '1,147'],
                    ['Location', 'London, UK'],
                    ['Website', 'margy-high-school.co.uk'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
                      <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Contacts */}
              <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#9CA3AF' }}>KEY CONTACTS</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Headteacher', 'Dr Sarah Mitchell'],
                    ['Deputy Head', 'Mr James Okafor'],
                    ['SENCO', 'Mrs Linda Patel'],
                    ['DSL', 'Mr Tom Briggs'],
                    ['Finance', 'Mrs Claire Andrews'],
                    ['IT Support', 'Mr Dev Sharma'],
                  ].map(([role, name]) => (
                    <div key={role} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{role}</span>
                      <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Useful Links */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#9CA3AF' }}>USEFUL LINKS</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { icon: '🔗', title: 'School MIS', sub: 'Arbor / SIMS' },
                    { icon: '🔗', title: 'Google Workspace', sub: 'Microsoft 365' },
                    { icon: '🔗', title: 'Parent Portal', sub: 'Communications' },
                    { icon: '🔗', title: 'Governor Portal', sub: 'Governance docs' },
                    { icon: '🔗', title: 'Ofsted Dashboard', sub: 'Readiness tracker' },
                    { icon: '🔗', title: 'DfE Portal', sub: 'Returns & data' },
                  ].map(l => (
                    <div key={l.title} className="rounded-xl p-3 cursor-pointer hover:border-teal-500/30 transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="flex items-center gap-2">
                        <span>{l.icon}</span>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{l.title}</p>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>{l.sub}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        )
      })()}

      {/* Stats row + Attendance + Workflows + Compliance — demo data only */}
      {demoDataActive ? (
      <div className="space-y-4">
          <div className="flex justify-end">
            <span className="text-[10px]" style={{ color: '#4B5563' }}>Last updated: {lastUpdated}</span>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Attendance today',  value: `${attendanceAvg}%`,         sub: '7-year group avg',      color: ragColor(attendanceAvg), icon: Activity   },
              { label: 'Active workflows',  value: '23',                         sub: '3 need attention',      color: '#6C3FC5',               icon: GitBranch  },
              { label: 'Open concerns',     value: '1',                          sub: 'Safeguarding',          color: '#EF4444',               icon: Shield     },
              { label: 'Staff in today',    value: `${staffIn}/${STAFF_TODAY.length}`, sub: '1 on cover',       color: '#0D9488',               icon: Users      },
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
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Attendance + Workflows — two col */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Attendance by year */}
        <Card>
          <CardHeader title="Attendance by Year Group" action={<span className="text-xs" style={{ color: '#9CA3AF' }}>Today</span>} />
          <div className="px-5 py-4 space-y-3">
            {ATTENDANCE_BY_YEAR.map(y => (
              <div key={y.year} className="flex items-center gap-3">
                <p className="text-xs w-20 shrink-0" style={{ color: '#9CA3AF' }}>{y.year}</p>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${y.pct}%`, backgroundColor: ragColor(y.pct) }} />
                </div>
                <p className="text-xs w-12 text-right font-medium shrink-0" style={{ color: ragColor(y.pct) }}>{y.pct}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Active workflows */}
        <Card>
          <CardHeader title="Today's Workflows" />
          <div className="flex flex-col gap-1">
            {WORKFLOWS.map((wf, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{wf.name}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}><Clock size={10} />{wf.time}</p>
                </div>
                <WFBadge status={wf.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

          {/* Compliance Tracker */}
          <Card>
            <CardHeader title="Compliance Tracker" />
            <div className="flex flex-col gap-1">
              {COMPLIANCE.map((c, i) => {
                const icon = c.status === 'ok' ? <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                           : c.status === 'urgent' ? <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                           : <Clock size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
                return (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    {icon}
                    <div className="min-w-0">
                      <p className="text-xs font-medium" style={{ color: c.status === 'urgent' ? '#F9FAFB' : '#D1D5DB' }}>{c.item}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{c.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
      </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Attendance today',  value: '--',  sub: 'No data yet', icon: Activity   },
            { label: 'Active workflows',  value: '0',   sub: 'None set up', icon: GitBranch  },
            { label: 'Open concerns',     value: '0',   sub: 'No records',  icon: Shield     },
            { label: 'Staff in today',    value: '--',  sub: 'No staff imported', icon: Users },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(107,114,153,0.1)' }}>
                    <Icon size={14} style={{ color: '#6B7280' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#4B5563' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.sub}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Live tenant onboarding wizard ──────────────────────── */}
      {showLiveOnboarding && schoolId && (
        <OnboardingWizard
          type="school"
          tenantId={schoolId}
          onComplete={() => {
            setShowLiveOnboarding(false)
            localStorage.setItem(`lumio_onboarded_${_slug}`, 'true')
            localStorage.setItem('lumio_onboarding_shown', 'true')
            localStorage.setItem(`onboarding-dismissed-${_slug}`, 'true')
          }}
        />
      )}

      {/* ── Onboarding modal ────────────────────────────────────── */}
      {showOnboarding && schoolData && (
        <OnboardingModal slug={_slug} school={schoolData} onComplete={completeOnboarding} />
      )}

      {/* Lockdown drill banner */}
      {lockdownBanner && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-6 py-3" style={{ backgroundColor: '#DC2626', color: '#fff' }}>
          <span className="text-sm font-bold animate-pulse">{'\u{1F534}'} LOCKDOWN {lockdownType === 'drill' ? 'DRILL' : ''} ACTIVE &mdash; Click Stand Down when complete</span>
          <button onClick={() => setLockdownBanner(false)} className="px-4 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#16A34A', color: '#fff' }}>{'\u{1F7E2}'} Stand Down</button>
        </div>
      )}

      {/* Lockdown wizard */}
      {showSafeguardingReview && <SafeguardingReviewModal onClose={() => setShowSafeguardingReview(false)} isDemoMode={demoDataActive} />}
      {showLockdown && (
        <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4">
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2"><span className="text-lg">{'\u{1F6A8}'}</span><span className="text-white font-bold">School Lockdown Protocol</span><span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">Step {lockdownStep + 1}/5</span></div>
              <button onClick={() => setShowLockdown(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            <div className="px-6 py-5">
              {lockdownStep === 0 && (<div className="space-y-4"><div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(220,38,38,0.15)', border: '2px solid rgba(220,38,38,0.4)' }}><div className="text-4xl mb-3">{'\u26A0\uFE0F'}</div><h3 className="text-lg font-bold text-white mb-2">You are initiating a School Lockdown</h3><p className="text-sm text-gray-400">This will alert staff, parents, and emergency services. Only proceed if genuine emergency or authorised drill.</p></div><div className="grid grid-cols-2 gap-3"><button onClick={() => { setLockdownType('emergency'); setLockdownStep(1) }} className="py-4 rounded-xl text-sm font-bold" style={{ backgroundColor: '#DC2626', color: '#fff' }}>{'\u{1F534}'} GENUINE EMERGENCY</button><button onClick={() => { setLockdownType('drill'); setLockdownStep(1) }} className="py-4 rounded-xl text-sm font-bold" style={{ backgroundColor: '#CA8A04', color: '#fff' }}>{'\u{1F7E1}'} DRILL / PRACTICE</button></div></div>)}
              {lockdownStep === 1 && (<div className="space-y-4"><h3 className="text-white font-semibold">Incident Details</h3><div><label className="text-xs text-gray-400 mb-1 block">Incident type</label><select value={lockdownIncident} onChange={e => setLockdownIncident(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Intruder on site</option><option>Threat received</option><option>Nearby police incident</option><option>Suspicious person</option><option>Other</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Brief description</label><textarea value={lockdownDesc} onChange={e => setLockdownDesc(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Location of threat</label><select value={lockdownLocation} onChange={e => setLockdownLocation(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Main entrance</option><option>School grounds</option><option>Nearby area</option><option>Unknown</option></select></div><div className="flex gap-3"><button onClick={() => setLockdownStep(0)} className="flex-1 py-2.5 rounded-xl text-sm bg-gray-800 text-gray-400">Back</button><button onClick={() => setLockdownStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-700 text-white">Next</button></div></div>)}
              {lockdownStep === 2 && (<div className="space-y-4"><h3 className="text-white font-semibold">Communications to trigger</h3><div className="space-y-2">{['Alert all staff via emergency broadcast','Send SMS to all parents/carers','Send email to all parents/carers','Post notice on school website','Notify local authority designated officer','Contact emergency services (999)','Lock all external doors','Activate PA system announcement'].map(item => <label key={item} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-900 text-sm text-gray-300 cursor-pointer"><input type="checkbox" defaultChecked className="rounded" />{item}</label>)}</div><div className="flex gap-3"><button onClick={() => setLockdownStep(1)} className="flex-1 py-2.5 rounded-xl text-sm bg-gray-800 text-gray-400">Back</button><button onClick={() => setLockdownStep(3)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-700 text-white">Next</button></div></div>)}
              {lockdownStep === 3 && (<div className="space-y-4"><h3 className="text-white font-semibold">Message Preview</h3><div><label className="text-xs text-gray-400 mb-1 block">SMS to parents</label><textarea rows={3} defaultValue={`URGENT: We have initiated a lockdown ${lockdownType === 'drill' ? 'drill ' : ''}procedure. Your child is safe. Do NOT come to school. We will update you shortly.`} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Email subject</label><input defaultValue={`URGENT: School Lockdown ${lockdownType === 'drill' ? 'Drill ' : ''}Initiated`} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="flex gap-3"><button onClick={() => setLockdownStep(2)} className="flex-1 py-2.5 rounded-xl text-sm bg-gray-800 text-gray-400">Back</button><button onClick={() => setLockdownStep(4)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-700 text-white">{lockdownType === 'drill' ? 'Initiate Drill' : 'INITIATE LOCKDOWN'}</button></div></div>)}
              {lockdownStep === 4 && (<div className="space-y-4 text-center"><div className="text-5xl mb-2">{lockdownType === 'drill' ? '\u{1F7E1}' : '\u{1F534}'}</div><h3 className="text-lg font-bold text-white">Lockdown {lockdownType === 'drill' ? 'Drill' : 'Protocol'} Initiated {demoDataActive ? '(DEMO)' : ''}</h3>{demoDataActive ? (<div className="text-left space-y-2 bg-gray-900 rounded-xl p-4"><p className="text-xs text-gray-400 mb-2">In a live plan this would:</p>{['\u2705 Broadcast emergency alert to all 89 staff','\u2705 Send SMS to 1,147 parent contacts','\u2705 Send email to all registered parents','\u2705 Post lockdown notice on school website','\u2705 Log incident with timestamp for Ofsted/legal records','\u2705 Notify local authority','\u2705 Auto-generate incident report'].map((item, i) => <div key={i} className="text-xs text-gray-300">{item}</div>)}</div>) : (<div className="text-left bg-red-900/20 border border-red-700/30 rounded-xl p-4"><p className="text-xs text-red-400 font-bold">LOCKDOWN ACTIVE</p><p className="text-xs text-gray-400">{lockdownIncident} &middot; {lockdownLocation} &middot; Ref: LKD-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-{Math.floor(Math.random()*900)+100}</p></div>)}<button onClick={() => { setShowLockdown(false); setLockdownBanner(true) }} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-700 text-white">Close &mdash; Lockdown Active</button></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
