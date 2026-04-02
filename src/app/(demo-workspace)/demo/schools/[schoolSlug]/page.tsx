'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkles, Users, Shield, UserPlus, GitBranch, FileText,
  Activity, Phone, Calendar, AlertTriangle, CheckCircle2,
  Clock, Loader2, TrendingUp, Zap, X, ClipboardList,
  Volume2, Mic, ChevronUp, ChevronDown,
} from 'lucide-react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useVoiceCommands } from '@/hooks/useVoiceCommands'

// ─── Seed data ────────────────────────────────────────────────────────────────

const SCHOOL = { name: 'Oakridge Primary School', headteacher: 'Sarah Henderson', ofsted: 'Good', pupils: 423, staff: 41, town: 'Milton Keynes' }

const ATTENDANCE_BY_YEAR = [
  { year: 'Reception', pct: 96.1 }, { year: 'Year 1', pct: 94.8 },
  { year: 'Year 2',    pct: 93.2 }, { year: 'Year 3', pct: 95.7 },
  { year: 'Year 4',    pct: 92.4 }, { year: 'Year 5', pct: 94.1 },
  { year: 'Year 6',    pct: 91.8 },
]

const WORKFLOWS = [
  { name: 'Daily Absence Alert',       status: 'COMPLETE', time: '7:32am'    },
  { name: 'DBS Reminder — M. Taylor',  status: 'ACTION',   time: '8:00am'    },
  { name: 'Cover Booking — Mrs Jones', status: 'COMPLETE', time: '8:14am'    },
  { name: 'Safeguarding Log Sync',     status: 'RUNNING',  time: '8:30am'    },
  { name: 'Parent Comms — Yr 4 Trip',  status: 'COMPLETE', time: 'Yesterday' },
  { name: 'Ofsted Readiness Check',    status: 'COMPLETE', time: 'Monday'    },
]

const STAFF_TODAY = [
  { name: 'Mrs K. Collins', role: 'Year 3', status: 'in'     },
  { name: 'Mr T. Rashid',   role: 'Year 5', status: 'in'     },
  { name: 'Mrs S. Okafor',  role: 'SENCO',  status: 'absent' },
  { name: 'Mr D. Whitmore', role: 'Year 6', status: 'cover'  },
  { name: 'Miss R. Khan',   role: 'Year 1', status: 'in'     },
  { name: 'Mrs J. Andrews', role: 'Office', status: 'in'     },
]

const SCHEDULE = [
  { time: '8:50am',  event: 'Register period',                 type: 'admin'    },
  { time: '10:00am', event: 'Year 6 SATs prep — Hall',         type: 'academic' },
  { time: '11:30am', event: 'SENCO review meeting',            type: 'meeting'  },
  { time: '2:00pm',  event: "Parent consultation — J. Morris", type: 'parent'   },
]

const COMPLIANCE = [
  { item: 'DBS checks current',    status: 'ok',      detail: '38/41 current'         },
  { item: 'M. Taylor DBS overdue', status: 'urgent',  detail: 'Expired 10 Mar 2026'   },
  { item: 'Fire drill completed',  status: 'ok',      detail: 'Completed 14 Mar'      },
  { item: 'Safeguarding training', status: 'pending', detail: '2 staff due by Apr 30' },
]

const ROUNDUP_ITEMS = [
  { icon: '\u2705', label: 'Morning register',  detail: '6 of 7 year groups submitted',           meta: 'Year 4 outstanding',    status: 'warning' as const },
  { icon: '\uD83D\uDD34', label: 'DBS expiry',        detail: 'M. Taylor — expired 10 Mar 2026',        meta: 'Renewal pending',       status: 'urgent'  as const },
  { icon: '\uD83D\uDCCB', label: 'EHCP review due',   detail: 'J. Morris — 14 Apr 2026',                meta: '18 days remaining',     status: 'pending' as const },
  { icon: '\uD83D\uDC69\u200D\uD83C\uDFEB', label: 'Cover arranged',  detail: 'Mrs Jones (Yr 4) — confirmed 8:14am',    meta: 'Agency: Monarch Supply', status: 'ok'     as const },
  { icon: '\uD83D\uDCAC', label: 'Parent messages',   detail: '3 messages received today',               meta: '1 unread',              status: 'info'    as const },
]

const STATUS_COLOURS = {
  ok:      { bg: 'rgba(34,197,94,0.08)',   text: '#22C55E' },
  warning: { bg: 'rgba(245,158,11,0.08)',  text: '#F59E0B' },
  urgent:  { bg: 'rgba(239,68,68,0.08)',   text: '#EF4444' },
  pending: { bg: 'rgba(96,165,250,0.08)',  text: '#60A5FA' },
  info:    { bg: 'rgba(167,139,250,0.08)', text: '#A78BFA' },
}

const TABS = ['Today', 'Safeguarding', 'Attendance', 'Staff', 'SEND'] as const
type Tab = typeof TABS[number]

// ─── Greeting banner data ────────────────────────────────────────────────────

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
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "A teacher affects eternity; they can never tell where their influence stops.", author: "Henry Adams" },
  { text: "The whole purpose of education is to turn mirrors into windows.", author: "Sydney J. Harris" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires.", author: "William Arthur Ward" },
  { text: "Nine tenths of education is encouragement.", author: "Anatole France" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Every student can learn, just not on the same day or in the same way.", author: "George Evans" },
  { text: "The best teachers are those who show you where to look but don't tell you what to see.", author: "Alexandra K. Trenfor" },
  { text: "Children are not things to be moulded, but people to be unfolded.", author: "Jess Lair" },
  { text: "Teaching is the one profession that creates all other professions.", author: "Unknown" },
  { text: "The art of teaching is the art of assisting discovery.", author: "Mark Van Doren" },
  { text: "To teach is to learn twice.", author: "Joseph Joubert" },
  { text: "It takes a big heart to help shape little minds.", author: "Unknown" },
  { text: "Education breeds confidence. Confidence breeds hope. Hope breeds peace.", author: "Confucius" },
]

// ─── AI Morning Summary data ────────────────────────────────────────────────

const SCHOOL_AI_HIGHLIGHTS = [
  'Attendance today is 94.3% — Year 6 is at 91.8%, below the 94% target',
  '1 open safeguarding concern — DSL sign-off required today',
  'Mrs S. Okafor (SENCO) is absent — cover arranged for morning',
  'M. Taylor DBS expired 10 March — renewal overdue, action needed',
  'Year 4 trip permission deadline is Friday — 12 of 28 still outstanding',
  'Year 6 SATs prep session at 10am — 28 pupils confirmed',
]

// ─── Meetings data ──────────────────────────────────────────────────────────

const SCHOOL_MEETINGS = [
  { id: '1', title: 'Register period', time: '08:50', duration: '10 min', type: 'admin', status: 'done' },
  { id: '2', title: 'Year 6 SATs prep', time: '10:00', duration: '60 min', type: 'academic', status: 'now' },
  { id: '3', title: 'SENCO review meeting', time: '11:30', duration: '30 min', type: 'meeting', status: 'upcoming' },
  { id: '4', title: 'Parent consultation — J. Morris', time: '14:00', duration: '20 min', type: 'parent', status: 'upcoming' },
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
    COMPLETE: { bg: 'rgba(34,197,94,0.1)',   text: '#22C55E', label: 'Complete' },
    RUNNING:  { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', label: 'Running'  },
    ACTION:   { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Action'   },
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
  if (status === 'absent') return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)',   color: '#EF4444' }}>Absent</span>
  return                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>Cover</span>
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxWidth: 420 }}>
      <Zap size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
      <p className="text-sm" style={{ color: '#D1D5DB' }}>{message}</p>
      <button onClick={onClose} style={{ color: '#6B7280' }}><X size={14} /></button>
    </div>
  )
}

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

const SCHOOL_DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80',
]

function PhotoFrame() {
  const [photos, setPhotos] = useState<string[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_photo_frame') : null; if (s) { const p = JSON.parse(s); if (p.length > 0) return p }; return SCHOOL_DEFAULT_PHOTOS } catch { return SCHOOL_DEFAULT_PHOTOS } })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [photoPositions, setPhotoPositions] = useState<Record<number, { x: number; y: number }>>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-photo-positions') : null; return s ? JSON.parse(s) : {} } catch { return {} } })
  const [hasEverDragged, setHasEverDragged] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio-photo-dragged') === 'true')
  const [hoveringFrame, setHoveringFrame] = useState(false)
  const isDragging = useRef(false); const dragStartRef = useRef({ x: 0, y: 0 }); const posStartRef = useRef({ x: 50, y: 50 })
  useEffect(() => { if (intervalRef.current) clearInterval(intervalRef.current); if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000); return () => { if (intervalRef.current) clearInterval(intervalRef.current) } }, [isPlaying, photos.length, intervalSecs])
  useEffect(() => { localStorage.setItem('lumio-photo-positions', JSON.stringify(photoPositions)) }, [photoPositions])
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) { Array.from(e.target.files || []).forEach(file => { const reader = new FileReader(); reader.onload = (ev) => setPhotos(prev => { const next = [...prev, ev.target?.result as string].slice(-20); localStorage.setItem('lumio_photo_frame', JSON.stringify(next)); return next }); reader.readAsDataURL(file) }); e.target.value = '' }
  function removePhoto(idx: number) { setPhotos(prev => { const next = prev.filter((_, i) => i !== idx); localStorage.setItem('lumio_photo_frame', JSON.stringify(next)); if (currentIdx >= next.length) setCurrentIdx(Math.max(0, next.length - 1)); return next }) }
  function onDragStart(cx: number, cy: number) { isDragging.current = true; dragStartRef.current = { x: cx, y: cy }; posStartRef.current = photoPositions[currentIdx] || { x: 50, y: 50 }; if (!hasEverDragged) { setHasEverDragged(true); localStorage.setItem('lumio-photo-dragged', 'true') } }
  function onDragMove(cx: number, cy: number, el: HTMLElement) { if (!isDragging.current) return; const r = el.getBoundingClientRect(); const dx = (cx - dragStartRef.current.x) / r.width * 100; const dy = (cy - dragStartRef.current.y) / r.height * 100; setPhotoPositions(p => ({ ...p, [currentIdx]: { x: Math.min(100, Math.max(0, posStartRef.current.x - dx)), y: Math.min(100, Math.max(0, posStartRef.current.y - dy)) } })) }
  function onDragEnd() { isDragging.current = false }
  function resetPosition() { setPhotoPositions(p => { const n = { ...p }; delete n[currentIdx]; return n }) }
  const pos = photoPositions[currentIdx] || { x: 50, y: 50 }
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">{'\uD83D\uDDBC\uFE0F'}</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '\u23F8 Pause' : '\u25B6 Play'}</button>}
          <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed #374151' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">{'\uD83D\uDCF7'}</div><div className="text-xs" style={{ color: '#9CA3AF' }}>Add your photos</div>
        </div>
      ) : (
        <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 150, cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
          onMouseEnter={() => setHoveringFrame(true)} onMouseLeave={() => { setHoveringFrame(false); onDragEnd() }}
          onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }} onMouseMove={e => onDragMove(e.clientX, e.clientY, e.currentTarget)} onMouseUp={onDragEnd}
          onTouchStart={e => { const t = e.touches[0]; if (t) onDragStart(t.clientX, t.clientY) }} onTouchMove={e => { const t = e.touches[0]; if (t) onDragMove(t.clientX, t.clientY, e.currentTarget as HTMLElement) }} onTouchEnd={onDragEnd}>
          <img src={photos[currentIdx]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${pos.x}% ${pos.y}%`, position: 'absolute', inset: 0, pointerEvents: 'none', transition: isDragging.current ? 'none' : 'object-position 0.15s ease', userSelect: 'none' }} />
          {photos.length > 1 && (<><button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i - 1 + photos.length) % photos.length) }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'\u2039'}</button><button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i + 1) % photos.length) }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'\u203A'}</button></>)}
          <button onClick={e => { e.stopPropagation(); removePhoto(currentIdx) }} className="absolute top-2 right-2 rounded-full flex items-center justify-center text-xs" style={{ width: 20, height: 20, backgroundColor: 'rgba(0,0,0,0.6)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.2)' }}>{'\u00D7'}</button>
          <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{currentIdx + 1} / {photos.length}</div>
          {(pos.x !== 50 || pos.y !== 50) && hoveringFrame && <button onClick={e => { e.stopPropagation(); resetPosition() }} className="absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>Reset</button>}
          {!hasEverDragged && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>✥ Drag to reposition</div>}
        </div>
      )}
      {photos.length > 1 && <div className="px-4 pb-3 flex items-center gap-2"><span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>)}</div>}
    </div>
  )
}

// ─── AI Morning Summary ─────────────────────────────────────────────────────

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

function SchoolMeetingsToday() {
  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>{'\uD83D\uDCC5'} Today&apos;s Schedule</h3>
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

// ─── Greeting Banner ────────────────────────────────────────────────────────

function SchoolGreetingBanner() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => SCHOOL_BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useElevenLabsTTS()
  const { isListening, lastCommand, startListening, stopListening } = useVoiceCommands()
  const [quote, setQuote] = useState(SCHOOL_QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '\uD83C\uDF24\uFE0F' })

  const firstName = SCHOOL.headteacher.replace(/^(Mrs?|Ms|Miss|Dr)\s+/, '').split(' ')[0]

  useEffect(() => { const start = new Date(new Date().getFullYear(), 0, 1).getTime(); const dayOfYear = Math.floor((Date.now() - start) / 86400000); setQuote(SCHOOL_QUOTES[dayOfYear % SCHOOL_QUOTES.length]) }, [])
  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const script = `${greeting}, ${firstName}. Attendance today is 94.3%. 1 safeguarding concern needs attention. 2 staff updates and an Ofsted check due this week. Have a brilliant day.`
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
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName} {'\uD83D\uDC4B'}</h1>
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
              { label: 'Pupils', value: SCHOOL.pupils, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '\uD83D\uDC68\u200D\uD83C\uDF93' },
              { label: 'Staff', value: SCHOOL.staff, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '\uD83D\uDC65' },
              { label: 'Alerts', value: 3, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '\uD83D\uDD34' },
              { label: 'Reports', value: 2, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '\uD83D\uDCCB' },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoSchoolOverviewPage() {
  const [toast, setToast]         = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('Today')
  const [demoCleared, setDemoCleared] = useState(false)

  useEffect(() => {
    const active = localStorage.getItem('lumio_school_demo_active')
    if (active === 'false') setDemoCleared(true)
  }, [])

  const attendanceAvg = Math.round(ATTENDANCE_BY_YEAR.reduce((s, y) => s + y.pct, 0) / ATTENDANCE_BY_YEAR.length * 10) / 10
  const staffIn       = STAFF_TODAY.filter(s => s.status === 'in').length

  function fireToast(action: string) {
    setToast(`In your live workspace, this would: ${action}`)
    setTimeout(() => setToast(''), 4000)
  }

  if (demoCleared) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <Sparkles size={28} style={{ color: '#0D9488' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>Demo data cleared</h2>
        <p className="text-sm mb-4 max-w-sm" style={{ color: '#9CA3AF' }}>
          This is what your empty school workspace looks like. Ready to go live? Buy Lumio to connect your real school data.
        </p>
        <a href="/schools/checkout" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Buy Lumio →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Greeting Banner (live-style) */}
      <SchoolGreetingBanner />

      {/* Safeguarding alert */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
        </div>
        <button onClick={() => fireToast('open safeguarding concern detail and DSL review panel')}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>
          Review now
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Log Absence',    action: 'log a pupil absence and trigger the attendance workflow',     icon: Users,    color: '#0D9488' },
          { label: 'New Concern',    action: 'open a new safeguarding concern form for DSL review',         icon: Shield,   color: '#EF4444' },
          { label: 'Parent Contact', action: 'compose and send a parent communication via email or SMS',    icon: Phone,    color: '#6C3FC5' },
          { label: 'Book Cover',     action: 'create a new supply cover booking and notify the cover pool', icon: Calendar, color: '#F59E0B' },
          { label: 'New Admission',  action: 'start the new pupil admission workflow with 3-step form',     icon: UserPlus, color: '#0D9488' },
          { label: 'Run Report',     action: 'generate an AI-powered report for governors or Ofsted',       icon: FileText, color: '#9CA3AF' },
        ].map(({ label, action, icon: Icon, color }) => (
          <button key={label} onClick={() => fireToast(action)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            <Icon size={14} style={{ color }} />{label}
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === tab ? '#0D9488' : 'transparent',
              color: activeTab === tab ? '#F9FAFB' : '#6B7280',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Non-Today tab placeholder */}
      {activeTab !== 'Today' ? (
        <div className="rounded-xl px-6 py-12 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>{activeTab}</p>
          <p className="text-xs max-w-sm mx-auto" style={{ color: '#6B7280' }}>
            In your live workspace, this tab shows a dedicated {activeTab.toLowerCase()} view with real-time data from your school.
          </p>
        </div>
      ) : (
        <>
          {/* ═══ 3-COLUMN GRID: Morning Roundup / Meetings / Photo Frame + AI ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

            {/* LEFT — Morning Roundup */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} style={{ color: '#0D9488' }} />
                    <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>{'\uD83C\uDF05'} Morning Roundup</h3>
                  </div>
                  <span className="text-xs" style={{ color: '#6B7280' }}>Updated 8:30am</span>
                </div>
                <div className="space-y-2">
                  {ROUNDUP_ITEMS.map((item, i) => {
                    const s = STATUS_COLOURS[item.status]
                    return (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <span className="text-lg w-7 text-center shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{item.label}</p>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
                          {item.meta}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* MIDDLE — Today's Schedule */}
            <div className="lg:col-span-1 flex flex-col">
              <SchoolMeetingsToday />
            </div>

            {/* RIGHT — Photo Frame + AI Panel */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <PhotoFrame />
              <SchoolAIPanel />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Attendance today', value: `${attendanceAvg}%`,               sub: '7-year group avg', color: ragColor(attendanceAvg), icon: Activity  },
              { label: 'Active workflows', value: '23',                               sub: '3 need attention', color: '#6C3FC5',               icon: GitBranch },
              { label: 'Open concerns',    value: '1',                                sub: 'Safeguarding',     color: '#EF4444',               icon: Shield    },
              { label: 'Staff in today',   value: `${staffIn}/${STAFF_TODAY.length}`, sub: '1 on cover',       color: '#0D9488',               icon: Users     },
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

          {/* 2-col: attendance + workflows */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Attendance by Year Group</p>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Today</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {ATTENDANCE_BY_YEAR.map(y => (
                  <div key={y.year} className="flex items-center gap-3">
                    <p className="text-xs w-20 shrink-0" style={{ color: '#9CA3AF' }}>{y.year}</p>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                      <div className="h-full rounded-full" style={{ width: `${y.pct}%`, backgroundColor: ragColor(y.pct) }} />
                    </div>
                    <p className="text-xs w-12 text-right font-medium shrink-0" style={{ color: ragColor(y.pct) }}>{y.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Today&apos;s Workflows</p>
              </div>
              <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
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
            </div>
          </div>

          {/* Staff + Compliance */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Staff Today</p></div>
              <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
                {STAFF_TODAY.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                      {s.name.split(' ').slice(-1)[0][0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{s.role}</p>
                    </div>
                    <StaffBadge status={s.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Compliance Tracker</p></div>
              <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
                {COMPLIANCE.map((c, i) => {
                  const icon = c.status === 'ok'     ? <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                             : c.status === 'urgent' ? <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                             :                         <Clock         size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
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
            </div>
          </div>
        </>
      )}

      {/* Upgrade CTA */}
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
          <Zap size={12} /> Ready to go live?
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#F9FAFB' }}>This is your real dashboard. Without the demo data.</h2>
        <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>
          Connect {SCHOOL.name} to Lumio for Schools and your team starts saving hours from day one.
        </p>
        <Link href="/schools" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Set up your school workspace →
        </Link>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
