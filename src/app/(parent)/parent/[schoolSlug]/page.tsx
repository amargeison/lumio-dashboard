'use client'

import { useState, useEffect, use } from 'react'
import { Calendar, BarChart3, FileText, MessageSquare, ClipboardList, Phone, CreditCard, Clock, Check, X, AlertTriangle, ChevronDown, Send, User } from 'lucide-react'

// ─── Demo Data ───────────────────────────────────────────────────────────────

const CHILD = { name: 'Oliver Henderson', year: 'Year 5', form: '5T', teacher: 'Mr T. Rashid', photo: null }

const TIMETABLE = [
  { time: '08:50', lesson: 'Registration', room: '5T', status: 'done' },
  { time: '09:00', lesson: 'English — Persuasive Writing', room: '5T', status: 'done' },
  { time: '10:00', lesson: 'Maths — Fractions & Decimals', room: '5T', status: 'now' },
  { time: '11:00', lesson: 'Break', room: '', status: 'upcoming' },
  { time: '11:15', lesson: 'Science — Forces & Magnets', room: 'Lab 2', status: 'upcoming' },
  { time: '12:15', lesson: 'Lunch', room: '', status: 'upcoming' },
  { time: '13:15', lesson: 'PE — Athletics', room: 'Sports Hall', status: 'upcoming' },
  { time: '14:15', lesson: 'Art — Landscape Painting', room: 'Art Room', status: 'upcoming' },
  { time: '15:10', lesson: 'Home time', room: '', status: 'upcoming' },
]

const MESSAGES = [
  { id: '1', from: 'Mrs K. Collins', subject: 'Year 5 Trip to Science Museum — 14 April', date: 'Today', read: false, body: 'Dear parents, we are planning a trip to the Science Museum on 14 April. Please complete the consent form by Friday 4 April. Children will need a packed lunch.' },
  { id: '2', from: 'Mr T. Rashid', subject: 'Homework reminder — Maths worksheet', date: 'Yesterday', read: true, body: 'Just a reminder that the fractions worksheet is due on Monday. Please encourage your child to show their working.' },
  { id: '3', from: 'School Office', subject: 'Summer term dates and INSET days', date: '25 Mar', read: true, body: 'Please find attached the confirmed dates for the summer term including 2 INSET days on 6 June and 21 July.' },
  { id: '4', from: 'Mrs S. Okafor', subject: 'SENCO catch-up — Oliver doing well', date: '20 Mar', read: true, body: 'Just to let you know Oliver has made excellent progress this term. His reading has improved significantly and he is much more confident in group work.' },
]

const ATTENDANCE_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 29 + i)
  const day = d.getDay()
  if (day === 0 || day === 6) return { date: d, status: 'weekend' as const }
  if (i === 8) return { date: d, status: 'absent' as const }
  if (i === 15) return { date: d, status: 'late' as const }
  return { date: d, status: 'present' as const }
})

const GRADES = [
  { subject: 'English', current: 'Expected+', target: 'Greater Depth', comment: 'Excellent creative writing. Needs to work on SPaG accuracy.' },
  { subject: 'Maths', current: 'Expected', target: 'Expected+', comment: 'Good understanding of number. Fractions remain a focus area.' },
  { subject: 'Science', current: 'Expected+', target: 'Greater Depth', comment: 'Very curious and engaged. Excellent practical work.' },
  { subject: 'History', current: 'Expected', target: 'Expected', comment: 'Good knowledge recall. Written responses could be more detailed.' },
  { subject: 'PE', current: 'Greater Depth', target: 'Greater Depth', comment: 'Outstanding across all areas. Represents school in athletics.' },
]

const CONSENTS = [
  { id: '1', title: 'Science Museum Trip — 14 April', deadline: '4 Apr 2026', status: 'pending' as const },
  { id: '2', title: 'Annual Photo Consent 2025/26', deadline: '—', status: 'signed' as const },
  { id: '3', title: 'Swimming Lessons — Summer Term', deadline: '18 Apr 2026', status: 'pending' as const },
  { id: '4', title: 'Internet & Device Use Policy', deadline: '—', status: 'signed' as const },
]

const EVENTS = [
  { date: 'Mon 31 Mar', event: 'Year 5 assembly — 9:15am', type: 'school' },
  { date: 'Wed 2 Apr', event: 'Parents evening — 4:00-7:00pm', type: 'parent' },
  { date: 'Fri 4 Apr', event: 'Non-uniform day (charity)', type: 'school' },
]

// ─── Components ──────────────────────────────────────────────────────────────

type Tab = 'today' | 'attendance' | 'reports' | 'messages' | 'consents'

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: BarChart3 },
  { id: 'reports', label: 'Reports & Progress', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'consents', label: 'Consent & Forms', icon: ClipboardList },
]

function Card({ children, title, action }: { children: React.ReactNode; title?: string; action?: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{title}</p>
          {action}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { present: '#22C55E', absent: '#EF4444', late: '#F59E0B', weekend: '#CBD5E1' }
  return <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[status] || '#CBD5E1', display: 'inline-block' }} />
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ParentPortalPage({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = use(params)
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState<Tab>('today')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parentName, setParentName] = useState('Mrs Henderson')
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('lumio_parent_token')
    const name = localStorage.getItem('lumio_parent_name')
    if (token && name) { setLoggedIn(true); setParentName(name) }
    const schoolName = schoolSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    localStorage.setItem('lumio_parent_school_name', schoolName)
  }, [schoolSlug])

  function handleLogin() {
    setLoading(true); setError('')
    // Demo: accept any input
    setTimeout(() => {
      localStorage.setItem('lumio_parent_token', 'demo')
      localStorage.setItem('lumio_parent_name', 'Mrs Henderson')
      setLoggedIn(true)
      setParentName('Mrs Henderson')
      setLoading(false)
    }, 800)
  }

  // ─── Login Screen ──────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <User size={28} color="white" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>Welcome to the Parent Portal</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 32 }}>{schoolSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, textAlign: 'left' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Email address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@email.com" type="email"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }} onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>PIN</label>
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" type="password" inputMode="numeric"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 18, letterSpacing: '0.2em', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }} onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0' }}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin() }} />
          </div>
          {error && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, backgroundColor: '#0D9488', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 16 }}>
            First time? <a href="#" style={{ color: '#0D9488', textDecoration: 'underline' }}>Set up your account</a>
          </p>
        </div>
      </div>
    )
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  const attendancePresent = ATTENDANCE_DAYS.filter(d => d.status === 'present').length
  const attendanceTotal = ATTENDANCE_DAYS.filter(d => d.status !== 'weekend').length
  const attendancePct = Math.round((attendancePresent / attendanceTotal) * 1000) / 10
  const unreadMessages = MESSAGES.filter(m => !m.read).length
  const pendingConsents = CONSENTS.filter(c => c.status === 'pending').length

  return (
    <div>
      {/* Welcome + Child Card */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>Welcome back, {parentName.split(' ').pop()}</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Child overview */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
          {CHILD.name.split(' ').map(w => w[0]).join('')}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{CHILD.name}</p>
          <p style={{ fontSize: 12, color: '#64748B' }}>{CHILD.year} · {CHILD.form} · {CHILD.teacher}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>TODAY</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>Present ✓</p>
          </div>
          <div style={{ backgroundColor: '#F0F9FF', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#0D9488', fontWeight: 600 }}>ATTENDANCE</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#0D9488' }}>{attendancePct}%</p>
          </div>
          <div style={{ backgroundColor: '#FFF7ED', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#EA580C', fontWeight: 600 }}>NEXT LESSON</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#EA580C' }}>Science</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Report Absence', icon: Phone, onClick: () => setShowAbsenceModal(true) },
          { label: 'Message School', icon: MessageSquare, onClick: () => setShowMessageModal(true) },
          { label: 'Pay for Trip', icon: CreditCard, onClick: () => alert('ParentPay integration coming soon') },
          { label: 'View Timetable', icon: Clock, onClick: () => setTab('today') },
        ].map(a => (
          <button key={a.label} onClick={a.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, backgroundColor: '#0D9488', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
            <a.icon size={14} /> {a.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 4, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
              backgroundColor: tab === t.id ? '#0D9488' : 'transparent', color: tab === t.id ? '#fff' : '#64748B' }}>
            <t.icon size={14} /> {t.label}
            {t.id === 'messages' && unreadMessages > 0 && <span style={{ backgroundColor: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>{unreadMessages}</span>}
            {t.id === 'consents' && pendingConsents > 0 && <span style={{ backgroundColor: '#F59E0B', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>{pendingConsents}</span>}
          </button>
        ))}
      </div>

      {/* ── TODAY TAB ─────────────────────────────────────────────────────── */}
      {tab === 'today' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Today's Timetable">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {TIMETABLE.map(t => (
                <div key={t.time} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', opacity: t.status === 'done' ? 0.4 : 1 }}>
                  <span style={{ width: 48, fontSize: 12, fontWeight: 700, color: '#64748B', flexShrink: 0 }}>{t.time}</span>
                  <span style={{ fontSize: 13, fontWeight: t.status === 'now' ? 700 : 400, color: t.status === 'done' ? '#94A3B8' : '#1E293B', textDecoration: t.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{t.lesson}</span>
                  {t.room && <span style={{ fontSize: 11, color: '#94A3B8' }}>{t.room}</span>}
                  {t.status === 'now' && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22C55E', animation: 'pulse 2s infinite' }} />}
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="This Week">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EVENTS.map(e => (
                  <div key={e.event} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0D9488', width: 72, flexShrink: 0 }}>{e.date}</span>
                    <span style={{ fontSize: 13, color: '#1E293B' }}>{e.event}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Messages from School">
              {MESSAGES.filter(m => !m.read).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0D9488', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{m.subject}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{m.from} · {m.date}</p>
                  </div>
                </div>
              ))}
              {MESSAGES.filter(m => !m.read).length === 0 && <p style={{ fontSize: 13, color: '#94A3B8' }}>No new messages</p>}
            </Card>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ────────────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Attendance This Term">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 56, fontWeight: 900, color: attendancePct >= 96 ? '#22C55E' : attendancePct >= 92 ? '#0D9488' : '#F59E0B' }}>{attendancePct}%</p>
              <p style={{ fontSize: 13, color: '#64748B' }}>{attendancePresent} of {attendanceTotal} school days attended</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                <span style={{ fontSize: 11, color: '#22C55E' }}>● Present: {attendancePresent}</span>
                <span style={{ fontSize: 11, color: '#EF4444' }}>● Absent: {ATTENDANCE_DAYS.filter(d => d.status === 'absent').length}</span>
                <span style={{ fontSize: 11, color: '#F59E0B' }}>● Late: {ATTENDANCE_DAYS.filter(d => d.status === 'late').length}</span>
              </div>
            </div>
          </Card>
          <Card title="Last 30 Days" action={<button onClick={() => setShowAbsenceModal(true)} style={{ fontSize: 12, fontWeight: 600, color: '#0D9488', background: 'none', border: '1px solid #0D9488', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>Report Absence</button>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} style={{ fontSize: 10, textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>{d}</span>)}
              {ATTENDANCE_DAYS.map((d, i) => (
                <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600,
                  backgroundColor: d.status === 'present' ? '#DCFCE7' : d.status === 'absent' ? '#FEE2E2' : d.status === 'late' ? '#FEF3C7' : '#F1F5F9',
                  color: d.status === 'present' ? '#16A34A' : d.status === 'absent' ? '#DC2626' : d.status === 'late' ? '#D97706' : '#CBD5E1' }}>
                  {d.date.getDate()}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── REPORTS TAB ───────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <Card title="Subject Progress — Spring Term 2026">
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                {['Subject', 'Current', 'Target', 'Teacher Comment'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#64748B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADES.map(g => (
                <tr key={g.subject} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{g.subject}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ backgroundColor: g.current === 'Greater Depth' ? '#DCFCE7' : '#F0F9FF', color: g.current === 'Greater Depth' ? '#16A34A' : '#0D9488', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{g.current}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748B' }}>{g.target}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748B', maxWidth: 300 }}>{g.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── MESSAGES TAB ──────────────────────────────────────────────────── */}
      {tab === 'messages' && (
        <Card title="Messages" action={<button onClick={() => setShowMessageModal(true)} style={{ fontSize: 12, fontWeight: 600, color: '#fff', backgroundColor: '#0D9488', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Send size={12} /> New Message</button>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {MESSAGES.map(m => (
              <div key={m.id}>
                <button onClick={() => setSelectedMessage(selectedMessage === m.id ? null : m.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid #F1F5F9', background: 'none', border: 'none', borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', cursor: 'pointer', textAlign: 'left' }}>
                  {!m.read && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0D9488', flexShrink: 0 }} />}
                  {m.read && <span style={{ width: 6, height: 6, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: m.read ? 400 : 700, color: '#1E293B' }}>{m.subject}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{m.from} · {m.date}</p>
                  </div>
                </button>
                {selectedMessage === m.id && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: 8, margin: '4px 0 12px', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                    {m.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── CONSENTS TAB ──────────────────────────────────────────────────── */}
      {tab === 'consents' && (
        <Card title="Consent & Forms">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {CONSENTS.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.title}</p>
                  {c.deadline !== '—' && <p style={{ fontSize: 11, color: '#64748B' }}>Deadline: {c.deadline}</p>}
                </div>
                {c.status === 'signed' ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Signed</span>
                ) : (
                  <button style={{ fontSize: 12, fontWeight: 600, color: '#fff', backgroundColor: '#0D9488', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                    Complete Form
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Absence Modal ─────────────────────────────────────────────────── */}
      {showAbsenceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Report Absence</h3>
              <button onClick={() => setShowAbsenceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Child</label><input value={CHILD.name} readOnly style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#F8FAFC', boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Date</label><input type="date" defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Reason</label><select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }}><option>Illness</option><option>Medical appointment</option><option>Family emergency</option><option>Other</option></select></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Notes</label><textarea rows={2} placeholder="Any additional details..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, resize: 'none', boxSizing: 'border-box' }} /></div>
              <button onClick={() => { setShowAbsenceModal(false); alert('Absence reported') }} style={{ width: '100%', padding: 12, borderRadius: 10, backgroundColor: '#0D9488', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Message Modal ─────────────────────────────────────────────────── */}
      {showMessageModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Message School</h3>
              <button onClick={() => setShowMessageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>To</label><select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }}><option>School Office</option><option>Mr T. Rashid (Class Teacher)</option><option>Mrs S. Okafor (SENCO)</option><option>Headteacher</option></select></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Subject</label><input placeholder="What's this about?" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box' }} /></div>
              <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Message</label><textarea rows={4} placeholder="Type your message..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, resize: 'none', boxSizing: 'border-box' }} /></div>
              <button onClick={() => { setShowMessageModal(false); alert('Message sent') }} style={{ width: '100%', padding: 12, borderRadius: 10, backgroundColor: '#0D9488', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Send size={14} /> Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
