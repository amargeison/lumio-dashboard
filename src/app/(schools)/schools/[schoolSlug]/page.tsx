'use client'

import { use, useState, useEffect, useRef } from 'react'
import {
  Users, Shield, Calendar, FileText, Phone, UserPlus,
  AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles,
  TrendingUp, Activity, X, ChevronRight, Mail, Plus,
  ChevronUp, ChevronDown, GitBranch, Volume2, Mic,
} from 'lucide-react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useVoiceCommands } from '@/hooks/useVoiceCommands'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
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
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>}
          {photos.length > 1 && <button onClick={handleRemovePhoto} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #1F2937', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }} title="Remove this photo">✕ Remove</button>}
          <button onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 5} title={photos.length >= 5 ? 'Maximum 5 photos' : 'Add a photo'} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #1F2937', background: 'transparent', color: photos.length >= 5 ? '#6B7280' : '#0D9488', cursor: photos.length >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} style={{ display: 'none' }} />
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed #374151' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">📷</div><div className="text-xs" style={{ color: '#9CA3AF' }}>Add your photos</div>
        </div>
      ) : (
      <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 150, cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
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
        {!hasEverDragged && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>✥ Drag to reposition</div>}
      </div>
      )}
      {photos.length > 1 && <div className="px-4 pb-3 flex items-center gap-2"><span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>)}</div>}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1F2937', background: '#0A0B10', borderRadius: '0 0 16px 16px' }}>
        <p style={{ fontSize: 10, color: '#6B7280', margin: '0 0 6px', textAlign: 'center' }}>Import from</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCloudModal('google')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid #1F2937', background: '#111318', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }} onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.color = '#9CA3AF' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><path d="M12 7c-2.76 0-5 2.24-5 5h5V7z" fill="#EA4335"/><path d="M7 12c0 2.76 2.24 5 5 5v-5H7z" fill="#FBBC04"/><path d="M12 17c2.76 0 5-2.24 5-5h-5v5z" fill="#34A853"/><path d="M17 12c0-2.76-2.24-5-5-5v5h5z" fill="#4285F4"/></svg>
            Google Photos ✦
          </button>
          <button onClick={() => setShowCloudModal('icloud')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid #1F2937', background: '#111318', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }} onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.color = '#9CA3AF' }}>
            <svg width="14" height="10" viewBox="0 0 24 16"><path d="M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#3B82F6"/></svg>
            iCloud ✦
          </button>
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
  const { isListening, lastCommand, startListening, stopListening } = useVoiceCommands()
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
    const { action, response } = lastCommand
    speak(response)
    if (action === 'PLAY_BRIEFING') setTimeout(() => handleBriefing(), 1500)
    else if (action === 'STOP_AUDIO') stop()
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
              { label: 'Pupils', value: demoActive ? (pupils || 423) : '—', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '👨‍🎓' },
              { label: 'Staff', value: demoActive ? (staff || 41) : '—', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
              { label: 'Alerts', value: demoActive ? 3 : 0, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴' },
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

      {/* 3. Quick actions */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937', borderRadius: 12 }}>
        <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
        {[
          { label: 'New Concern', icon: '⚠️' },
          { label: 'Log Absence', icon: '📋' },
          { label: 'Parent Contact', icon: '📞' },
          { label: 'Book Cover', icon: '📅' },
          { label: 'New Admission', icon: '➕' },
          { label: 'Run Report', icon: '📊' },
          { label: 'Claim Expenses', icon: '💰' },
          { label: 'Request Leave', icon: '🏖️' },
          { label: 'Report Staff Absence', icon: '🤒' },
        ].map(a => (
          <button key={a.label} onClick={() => {}} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      {/* 4. Safeguarding alert — only when demo data is active */}
      {demoDataActive && (
        <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderLeft: '4px solid #EF4444' }}>
          <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
          </div>
          <button className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Review now</button>
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
                { id: 'qw1', title: 'Sign off open DSL concern', description: 'Logged 2 days ago, requires DSL review before end of day.', impact: 'high' as const, effort: '2min', category: 'Safeguarding', action: 'Review now', source: 'Safeguarding' },
                { id: 'qw2', title: 'Chase 4 pupils below 85% attendance', description: 'Persistent absence threshold reached. Trigger parent contact.', impact: 'high' as const, effort: '2min', category: 'Attendance', action: 'Send letters', source: 'MIS' },
                { id: 'qw3', title: 'Approve 3 pending expense claims', description: 'Staff claims submitted this week awaiting sign-off.', impact: 'medium' as const, effort: '5min', category: 'Finance', action: 'Review claims', source: 'Finance' },
                { id: 'qw4', title: "Complete EHCP draft for tomorrow's review", description: 'Annual review meeting at 9am, draft must be submitted today.', impact: 'medium' as const, effort: '5min', category: 'SEND', action: 'Open EHCP', source: 'SEND Register' },
                { id: 'qw5', title: 'Chase 3 outstanding trip permission slips', description: "Year 5 trip is Friday. 3 families haven't responded.", impact: 'medium' as const, effort: '10min', category: 'Curriculum', action: 'Send reminders', source: 'Trips' },
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

      {/* TAB: Daily Tasks */}
      {activeTab === 'tasks' && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>✅ Daily Tasks</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Your essential daily checklist — stay on top of operations.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <span>🔗</span>
            <span className="text-sm" style={{ color: '#5EEAD4' }}>These suggestions are AI-generated based on your role. Connect your tools in Settings for personalised insights.</span>
          </div>
          {true ? (
            <div className="space-y-3">
              {([
                { id: 'dt1', title: 'Submit daily attendance return to DfE', description: 'Must be submitted by 12pm. 94% recorded so far.', impact: 'high' as const, effort: '5min', category: 'Admin', action: 'Submit now', source: 'MIS' },
                { id: 'dt2', title: 'Review and respond to parent concern logged yesterday', description: 'Mrs. Clarke raised a concern via Parent Portal at 4:32pm.', impact: 'high' as const, effort: '10min', category: 'Safeguarding', action: 'Open concern', source: 'Parent Portal' },
                { id: 'dt3', title: 'Approve cover arrangement for Period 3', description: 'Mr. Davies absence — cover not yet confirmed.', impact: 'medium' as const, effort: '5min', category: 'HR', action: 'Assign cover', source: 'Cover Manager' },
                { id: 'dt4', title: 'Prepare agenda for Thursday SLT meeting', description: 'Meeting in 2 days. No agenda submitted yet.', impact: 'medium' as const, effort: '15min', category: 'SLT', action: 'Create agenda', source: 'Calendar' },
                { id: 'dt5', title: 'Respond to 2 new admissions enquiries', description: 'Both received yesterday via website form.', impact: 'medium' as const, effort: '5min', category: 'Admissions', action: 'View enquiries', source: 'Admissions' },
              ]).map(task => {
                const impactColors = task.impact === 'high'
                  ? { bg: 'rgba(239,68,68,0.12)', color: '#F87171' }
                  : { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' }
                return (
                  <div key={task.id} className="rounded-2xl p-5 transition-all"
                    style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: impactColors.bg, color: impactColors.color }}>{task.impact.toUpperCase()} IMPACT</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}>⏱ {task.effort}</span>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{task.category}</span>
                        </div>
                        <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{task.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{task.description}</p>
                        <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {task.source}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                          style={{ backgroundColor: '#7C3AED' }}>
                          {task.action} →
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

      {/* TAB: Insights */}
      {activeTab === 'insights' && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>📊 Insights</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Key trends and metrics — know what&apos;s changing before it becomes a problem.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <span>🔗</span>
            <span className="text-sm" style={{ color: '#5EEAD4' }}>These suggestions are AI-generated based on your role. Connect your tools in Settings for personalised insights.</span>
          </div>
          <div className="space-y-3">
            {([
              { id: 'in1', title: 'Attendance dropped 2.1% vs last week', description: 'Currently 91.9%. Year 3 and Year 5 showing the biggest dip.', impact: 'high' as const, category: 'Attendance', source: 'MIS' },
              { id: 'in2', title: 'SEND cohort now 22.3% of roll', description: 'Above national average of 18.1%. EHCP requests up 3 this term.', impact: 'high' as const, category: 'SEND', source: 'SEND Register' },
              { id: 'in3', title: 'Budget variance of £4,200 in Premises', description: 'Heating costs higher than forecast. Review recommended.', impact: 'medium' as const, category: 'Finance', source: 'Finance' },
              { id: 'in4', title: 'Year 6 SATs prep: 67% of intervention sessions complete', description: 'On track but 4 pupils need additional support sessions.', impact: 'medium' as const, category: 'Curriculum', source: 'Curriculum' },
            ]).map(insight => {
              const impactColors = insight.impact === 'high'
                ? { bg: 'rgba(239,68,68,0.12)', color: '#F87171' }
                : { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' }
              return (
                <div key={insight.id} className="rounded-2xl p-5 transition-all"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: impactColors.bg, color: impactColors.color }}>{insight.impact.toUpperCase()} IMPACT</span>
                        <span className="text-xs" style={{ color: '#6B7280' }}>{insight.category}</span>
                      </div>
                      <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{insight.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{insight.description}</p>
                      <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {insight.source}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                        style={{ backgroundColor: '#7C3AED' }}>
                        View detail →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: Don't Miss */}
      {activeTab === 'dont-miss' && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2" style={{ color: '#F9FAFB' }}>🔴 Don&apos;t Miss</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Urgent deadlines and compliance actions — these cannot wait.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <span>🔗</span>
            <span className="text-sm" style={{ color: '#5EEAD4' }}>These suggestions are AI-generated based on your role. Connect your tools in Settings for personalised insights.</span>
          </div>
          {true ? (
            <div className="space-y-3">
              {([
                { id: 'dm1', title: 'Ofsted data return due in 3 days', description: 'Annual census data must be submitted to Ofsted portal by Friday.', effort: '1min', category: 'Compliance', action: 'Submit now', source: 'DfE' },
                { id: 'dm2', title: 'SCR check outstanding for 1 new staff member', description: 'Started 2 weeks ago. Single Central Record incomplete.', effort: '2min', category: 'Safeguarding', action: 'Complete SCR', source: 'SCR' },
                { id: 'dm3', title: 'Grant claim deadline: Tomorrow 5pm', description: 'PE & Sport Premium claim worth £18,500 must be submitted.', effort: '5min', category: 'Finance', action: 'Open claim', source: 'Finance' },
                { id: 'dm4', title: '3 staff DBS renewals overdue', description: 'All 3 exceeded 3-year renewal window. Action required immediately.', effort: '2min', category: 'HR', action: 'Review now', source: 'HR' },
              ]).map(item => (
                <div key={item.id} className="rounded-2xl p-5 transition-all"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#F87171' }}>HIGH IMPACT</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(124,58,237,0.12)', color: '#A78BFA' }}>⏱ {item.effort}</span>
                        <span className="text-xs" style={{ color: '#6B7280' }}>{item.category}</span>
                      </div>
                      <h3 className="font-bold mb-1" style={{ color: '#F9FAFB' }}>{item.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.description}</p>
                      <p className="text-xs mt-2" style={{ color: '#374151' }}>Source: {item.source}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button className="px-4 py-2 text-white text-sm font-bold rounded-xl whitespace-nowrap"
                        style={{ backgroundColor: '#7C3AED' }}>
                        {item.action} →
                      </button>
                      <button className="px-4 py-2 text-xs rounded-xl transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
                        Mark done
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>School Details</p>
                  {[['School Name', schoolName || 'Oakridge Primary'], ['Type', 'Community Primary'], ['URN', '114286'], ['Ofsted Rating', 'Good (2023)'], ['Pupils on Roll', '412'], ['Staff', '41'], ['Address', 'Oakridge Lane, London SE15']].map(([l, v]) => (
                    <div key={l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
                  {[['Headteacher', 'Sarah Mitchell'], ['Deputy Head', 'James Okafor'], ['SENCO', 'Emma Clarke'], ['DSL', 'Priya Patel'], ['Business Manager', 'Mark Davis'], ['Chair of Governors', 'Dr Helen Wright']].map(([r, n]) => (
                    <div key={r} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{r}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{n}</span></div>
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

    </div>
  )
}
