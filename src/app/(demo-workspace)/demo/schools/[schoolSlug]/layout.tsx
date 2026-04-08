// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING: dev.lumiocms.com/schools/[slug]  →  THIS FILE (layout + page.tsx)
// ═══════════════════════════════════════════════════════════════════════════════
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, GraduationCap, Sunrise, Network, Pin, DoorOpen, Clock,
} from 'lucide-react'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import { getSchoolClientRole } from '@/lib/detect-school-role'
import { SCHOOL_ROLES, type SchoolRole } from '@/lib/schoolRoles'
import { SchoolRoleContext } from '@/lib/SchoolRoleContext'

const COLLAPSED_W = 72
const EXPANDED_W = 200

const NAV = [
  { section: null,          path: '',              label: 'Overview',               icon: LayoutDashboard, badge: null },
  { section: null,          path: 'slt',           label: 'SLT Suite',              icon: GraduationCap,   badge: null },
  { section: null,          path: 'insights',      label: 'Insights',               icon: Sparkles,        badge: null },
  { section: 'Departments', path: 'school-office', label: 'School Office',          icon: Building2,       badge: null },
  { section: null,          path: 'hr-staff',      label: 'HR & Staff',             icon: Users,           badge: null },
  { section: null,          path: 'curriculum',    label: 'Curriculum',             icon: BookOpen,        badge: null },
  { section: null,          path: 'timetable',     label: 'Timetable',              icon: Clock,           badge: null },
  { section: null,          path: 'students',      label: 'Students',               icon: GraduationCap,   badge: null },
  { section: null,          path: 'classes',       label: 'Classes',                icon: DoorOpen,        badge: null },
  { section: null,          path: 'send-dsl',      label: 'SEND & DSL',             icon: Heart,           badge: 2    },
  { section: null,          path: 'finance',       label: 'Finance',                icon: DollarSign,      badge: null },
  { section: null,          path: 'facilities',    label: 'Facilities',             icon: Wrench,          badge: null },
  { section: null,          path: 'admissions',    label: 'Admissions & Marketing', icon: UserPlus,        badge: null },
  { section: null,          path: 'safeguarding',  label: 'Safeguarding',           icon: Shield,          badge: 1    },
  { section: null,          path: 'wraparound',    label: 'Pre & After School',     icon: Sunrise,         badge: null },
  { section: null,          path: 'reports',       label: 'Reports',                icon: FileText,        badge: null },
  { section: 'Tools',       path: 'trust',         label: 'Trust Overview',         icon: Network,         badge: null },
  { section: null,          path: 'ofsted',        label: 'Ofsted Mode',            icon: Shield,          badge: 'NEW' },
  { section: null,          path: 'workflows',     label: 'Workflows',              icon: GitBranch,       badge: null },
  { section: null,          path: '/parent',       label: 'Parent Portal',          icon: Users,           badge: null },
  { section: null,          path: 'settings',      label: 'Settings',               icon: Settings,        badge: null },
]

// ─── School notifications (demo) ─────────────────────────────────────────────
const SCHOOL_NOTIFICATIONS = [
  { id: 'sn1', dept: 'safeguarding', icon: '🛡️', title: 'Safeguarding concern logged', body: 'Year 9 pupil — DSL review required before 3pm today.', time: '12 mins ago', read: false },
  { id: 'sn2', dept: 'hr-staff', icon: '📋', title: 'DBS renewal overdue', body: 'M. Taylor DBS expired 10 March — renewal action needed.', time: '45 mins ago', read: false },
  { id: 'sn3', dept: 'students', icon: '🫥', title: '3 unexplained absences', body: 'Reception, Year 4, Year 6 — parents not yet contacted.', time: '1 hour ago', read: false },
  { id: 'sn4', dept: 'send-dsl', icon: '🧠', title: 'SENCO review at 11:30', body: '4 pupils on agenda — meeting papers circulated to staff.', time: '2 hours ago', read: true },
  { id: 'sn5', dept: 'finance', icon: '💰', title: 'Expense claim awaiting approval', body: '£42.50 travel claim from Mrs Collins — 3 days overdue.', time: '3 hours ago', read: true },
  { id: 'sn6', dept: 'facilities', icon: '🔧', title: 'Maintenance request', body: 'Year 2 classroom heater not working — logged by site team.', time: 'Yesterday', read: true },
  { id: 'sn7', dept: 'school-office', icon: '📞', title: 'Parent callback requested', body: 'Mrs Morris (Year 4) — regarding Thursday school trip.', time: 'Yesterday', read: true },
  { id: 'sn8', dept: 'all', icon: '⚡', title: 'Workflow completed', body: 'Daily Absence Alert ran successfully at 7:32am.', time: 'Today 7:32am', read: true },
  { id: 'sn9', dept: 'all', icon: '🤖', title: 'Lumio AI insight', body: 'Attendance dropped below 93% for Year 6 this week.', time: 'Yesterday', read: true },
  { id: 'sn10', dept: 'all', icon: '📅', title: 'Staff meeting tomorrow', body: 'Whole-school CPD session — 3:30pm in the Main Hall.', time: '2 days ago', read: true },
]

function SchoolNotificationsPanel({ onClose, depts }: { onClose: () => void; depts: string[] }) {
  const filtered = SCHOOL_NOTIFICATIONS.filter(n => depts.includes('all') || depts.includes(n.dept) || n.dept === 'all')
  const [items, setItems] = useState(filtered)
  const unreadCount = items.filter(n => !n.read).length
  return (
    <>
      <div className="fixed inset-0 z-[79]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full z-[80] flex flex-col" style={{ width: 380, backgroundColor: '#111318', borderLeft: '1px solid #1F2937', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Notifications</h2>
            {unreadCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>{unreadCount}</span>}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && <button onClick={() => setItems(prev => prev.map(n => ({ ...n, read: true })))} className="text-xs font-medium" style={{ color: '#0D9488' }}>Mark all read</button>}
            <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="text-3xl mb-3">🔔</span>
              <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>No notifications for your role</p>
            </div>
          ) : items.map(n => (
            <div key={n.id} className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937', borderLeft: n.read ? 'none' : '3px solid #0D9488', backgroundColor: n.read ? 'transparent' : 'rgba(13,148,136,0.04)' }}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: '#1F2937' }}>{n.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate" style={{ color: n.read ? '#9CA3AF' : '#F9FAFB' }}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#0D9488' }} />}
                  </div>
                  <p className="text-xs mb-1 leading-relaxed" style={{ color: '#6B7280' }}>{n.body}</p>
                  <p className="text-xs" style={{ color: '#4B5563' }}>{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

interface Props { children: React.ReactNode; params: Promise<{ schoolSlug: string }> }

export default function SchoolLayout({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Match /schools/[slug] or /demo/schools/[slug] — this layout file is under
  // /demo/schools/[slug] so nav links must keep the /demo/ prefix to avoid
  // punting users into the live (auth-gated) schools portal.
  const slugMatch = pathname.match(/(?:^|\/)demo\/schools\/([^/]+)/) || pathname.match(/\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? ''
  const isDemoRoute = pathname.startsWith('/demo/schools/')
  const base = isDemoRoute ? `/demo/schools/${slug}` : `/schools/${slug}`

  const [isSchoolDemo, setIsSchoolDemo] = useState(false)
  const [activeRole, setActiveRole] = useState<SchoolRole>('slt_admin')
  const roleConfig = SCHOOL_ROLES[activeRole]
  useEffect(() => {
    const check = () => setIsSchoolDemo(localStorage.getItem('lumio_schools_demo_loaded') === 'true')
    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [])

  const [schoolName, setSchoolName] = useState(slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
  const [initials, setInitials] = useState('SC')
  const [planLabel, setPlanLabel] = useState('Live workspace')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null)

  useEffect(() => {
    function sync() {
      const storedLogo =
        localStorage.getItem(`lumio_school_logo_${slug}`)
        || localStorage.getItem('lumio_school_logo')
      if (storedLogo) setSchoolLogo(storedLogo)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('lumio-logo-updated', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('lumio-logo-updated', sync)
    }
  }, [slug])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) return
    const blobUrl = URL.createObjectURL(file)
    setSchoolLogo(blobUrl)
    const token = localStorage.getItem('workspace_session_token')
    const fd = new FormData()
    fd.append('logo', file)
    try {
      const res = await fetch('/api/workspace/logo', { method: 'POST', headers: token ? { 'x-workspace-token': token } : {}, body: fd })
      const data = await res.json()
      if (data.logo_url) {
        setSchoolLogo(data.logo_url)
        localStorage.setItem(`lumio_school_logo_${slug}`, data.logo_url)
      }
      URL.revokeObjectURL(blobUrl)
    } catch { /* ignore */ }
  }

  async function handleLogoRemove() {
    setSchoolLogo(null)
    localStorage.removeItem(`lumio_school_logo_${slug}`)
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/workspace/logo', { method: 'DELETE', headers: { 'x-workspace-token': token } })
      } catch { /* ignore */ }
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(`lumio_school_${slug}_name`)
    if (stored) { setSchoolName(stored) } else {
      fetch(`/api/schools/${slug}`).then(r => r.ok ? r.json() : null).then(data => {
        if (data?.name) { setSchoolName(data.name); localStorage.setItem(`lumio_school_${slug}_name`, data.name) }
      }).catch(() => {})
    }
    const storedInitials = localStorage.getItem(`lumio_school_${slug}_initials`)
    if (storedInitials) setInitials(storedInitials)
    const plan = localStorage.getItem(`lumio_school_${slug}_plan`)
    if (plan) setPlanLabel(`${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`)
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    setUserName(localStorage.getItem('lumio_user_name') || '')
    setUserEmail(localStorage.getItem('lumio_user_email') || '')
    // Load user avatar — instant from localStorage cache
    const cachedPhoto = localStorage.getItem('lumio_user_photo')
    if (cachedPhoto && !cachedPhoto.startsWith('data:')) setUserPhoto(cachedPhoto)
    const storedEmail = localStorage.getItem('lumio_user_email')
    if (storedEmail) {
      const staffPhoto = localStorage.getItem(`lumio_staff_photo_${storedEmail}`)
      if (staffPhoto && !staffPhoto.startsWith('data:')) setUserPhoto(staffPhoto)
    }
    // Always fetch from Supabase in background to confirm/update avatar
    const wsToken = localStorage.getItem('workspace_session_token')
    if (wsToken) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': wsToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user_avatar_url) {
            setUserPhoto(data.user_avatar_url)
            localStorage.setItem('lumio_user_photo', data.user_avatar_url)
            if (data.owner_email) localStorage.setItem(`lumio_staff_photo_${data.owner_email}`, data.user_avatar_url)
          }
        })
        .catch(() => {})
    }
    function onAvatarUpdated(e: Event) {
      const url = (e as CustomEvent).detail
      setUserPhoto(url || null)
    }
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)

    return () => { window.removeEventListener('lumio-avatar-updated', onAvatarUpdated) }
  }, [slug])

  const expanded = pinned || hovered
  const sidebarW = expanded ? EXPANDED_W : COLLAPSED_W

  function togglePin() {
    const next = !pinned
    setPinned(next)
    localStorage.setItem('lumio_sidebar_pinned', String(next))
  }

  function handleMouseEnter() { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true) }
  function handleMouseLeave() { leaveTimer.current = setTimeout(() => setHovered(false), 200) }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F' }}>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden md:flex flex-col transition-[width] duration-200"
        style={{ width: sidebarW, backgroundColor: '#07080F', borderRight: '1px solid #1F2937', overflow: 'hidden' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex shrink-0 items-center justify-center" style={{ borderBottom: '1px solid #1F2937', minHeight: 72, padding: expanded ? '12px 10px' : '12px 4px', gap: expanded ? 10 : 0 }}>
          <div className="relative flex items-center justify-center shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: schoolLogo ? 'transparent' : '#0D9488', color: '#F9FAFB', border: '1px solid #1F2937', fontSize: 26, fontWeight: 700 }}>
            {schoolLogo ? <img key={schoolLogo} src={schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} onError={() => setSchoolLogo(null)} /> : schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{schoolName}</p>
                <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
              </div>
              <button onClick={togglePin} className="flex items-center justify-center rounded p-1 shrink-0"
                style={{ color: pinned ? '#0D9488' : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }}
                title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
                <Pin size={14} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-1.5 py-3 space-y-0.5">
          {NAV.filter(item => {
            if ((item as any).sltOnly) {
              const r = typeof window !== 'undefined' ? getSchoolClientRole() : { role_level: 4 as const, isOwner: false }
              return r.role_level <= 1 || r.isOwner
            }
            // Role-based nav filtering
            const navPerms = roleConfig.permissions.nav
            if (navPerms.includes('all')) return true
            const itemPath = item.path || 'overview'
            if (itemPath === 'settings') return true // always show settings
            return navPerms.includes(itemPath)
          }).map((item, i) => {
            const prev = NAV[i - 1]
            const showSection = expanded && item.section && item.section !== prev?.section
            // Absolute-path nav items (like /parent) are separate standalone routes
            // that live outside the demo tree — never add the /demo prefix to them.
            const EXTERNAL_ABSOLUTE_PATHS = ['/parent']
            const isExternalAbsolute = item.path.startsWith('/') && EXTERNAL_ABSOLUTE_PATHS.includes(item.path)
            const absolutePrefixed = item.path.startsWith('/')
              ? (isDemoRoute && !isExternalAbsolute ? `/demo${item.path}/${slug}` : `${item.path}/${slug}`)
              : `${base}/${item.path}`
            const href = item.path === '' ? base : absolutePrefixed
            const absoluteActiveRoot = item.path.startsWith('/') ? (isDemoRoute && !isExternalAbsolute ? `/demo${item.path}` : item.path) : ''
            const isActive = item.path === ''
              ? pathname === base || pathname === `${base}/`
              : item.path.startsWith('/')
                ? pathname.startsWith(absoluteActiveRoot)
                : pathname.startsWith(`${base}/${item.path}`)
            const Icon = item.icon
            return (
              <div key={item.path || 'overview'}>
                {showSection && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>}
                <Link href={href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors"
                  style={{ backgroundColor: isActive ? '#0D9488' : 'transparent', color: isActive ? '#F9FAFB' : '#9CA3AF', paddingLeft: expanded ? 12 : 0, paddingRight: expanded ? 12 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}
                  title={expanded ? undefined : item.label}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = '#111318'; e.currentTarget.style.color = '#F9FAFB' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}>
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  {expanded && <span className="flex-1 truncate text-xs">{item.label}</span>}
                  {expanded && item.badge !== null && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
                      style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#EF4444', color: '#F9FAFB', fontSize: 10 }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {expanded && (
            <div className="pb-3">
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden" style={{ width: EXPANDED_W, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
          <div className="flex shrink-0 items-center justify-center" style={{ borderBottom: '1px solid #1F2937', minHeight: 72, padding: '12px 10px', gap: 10 }}>
            <div className="relative flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: schoolLogo ? 'transparent' : '#0D9488', color: '#F9FAFB', border: '1px solid #1F2937' }}>
              {schoolLogo ? <img key={schoolLogo} src={schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} onError={() => setSchoolLogo(null)} /> : schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{schoolName}</p>
              <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ color: '#9CA3AF' }}><X size={16} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {NAV.filter(item => {
              if ((item as any).sltOnly) { const r = typeof window !== 'undefined' ? getSchoolClientRole() : { role_level: 4 as const, isOwner: false }; return r.role_level <= 1 || r.isOwner }
              const navPerms = roleConfig.permissions.nav
              if (navPerms.includes('all')) return true
              const itemPath = item.path || 'overview'
              if (itemPath === 'settings') return true
              return navPerms.includes(itemPath)
            }).map((item, i) => {
              const prev = NAV[i - 1]
              const showSection = item.section && item.section !== prev?.section
              const href = item.path === '' ? base : `${base}/${item.path}`
              const isActive = item.path === '' ? pathname === base || pathname === `${base}/` : pathname.startsWith(`${base}/${item.path}`)
              const Icon = item.icon
              return (
                <div key={item.path || 'overview'}>
                  {showSection && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>}
                  <Link href={href} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ backgroundColor: isActive ? '#0D9488' : 'transparent', color: isActive ? '#F9FAFB' : '#9CA3AF' }}>
                    <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                    <span className="flex-1 truncate text-xs">{item.label}</span>
                    {item.badge !== null && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#EF4444', color: '#F9FAFB', fontSize: 10 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </div>
              )
            })}
          </nav>
          <div className="mt-auto px-4 pb-3" style={{ borderTop: '1px solid #1F2937' }}>
            <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
              <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
            </a>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden transition-[padding] duration-200" style={{ paddingLeft: sidebarW }}>
        {/* Top-right: bell + avatar */}
        <div className="fixed hidden md:flex items-center gap-2" style={{ top: 12, right: 20, zIndex: 60 }}>
          {(() => {
            const depts = roleConfig.permissions.notificationDepts
            const bellCount = depts.length === 0 ? 0 : SCHOOL_NOTIFICATIONS.filter(n => !n.read && (depts.includes('all') || depts.includes(n.dept) || n.dept === 'all')).length
            return (
              <button onClick={() => { if (depts.length > 0) setNotificationsOpen(o => !o) }}
                className="relative flex items-center justify-center rounded-full"
                style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: depts.length === 0 ? '#374151' : '#9CA3AF', cursor: depts.length === 0 ? 'not-allowed' : 'pointer', opacity: depts.length === 0 ? 0.5 : 1 }}>
                <Bell size={16} strokeWidth={1.75} />
                {bellCount > 0 && <span className="absolute flex items-center justify-center rounded-full" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>{bellCount}</span>}
              </button>
            )
          })()}
          <AvatarDropdown initials={initials} logoutRedirect="/schools/login" logoutClearKeys={['lumio_school_']} settingsHref={`${base}/settings`} />
        </div>
        {notificationsOpen && <SchoolNotificationsPanel onClose={() => setNotificationsOpen(false)} depts={roleConfig.permissions.notificationDepts} />}

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={18} /></button>
          <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{schoolName}</span>
        </div>

        {isSchoolDemo && (
          <div className="flex items-center justify-between px-6 shrink-0" style={{ height: 40, minHeight: 40, background: '#0D9488', color: '#F9FAFB', paddingRight: 140 }}>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span>Demo workspace · sample data</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ opacity: 0.7 }}>Preview as:</span>
              <select value={activeRole} onChange={e => setActiveRole(e.target.value as SchoolRole)} title="This shows how Lumio looks for different staff roles. In a live school, roles are set automatically from your MIS." className="text-xs font-semibold rounded-lg outline-none cursor-pointer" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '2px 6px' }}>
                {(Object.entries(SCHOOL_ROLES) as [SchoolRole, typeof SCHOOL_ROLES[SchoolRole]][]).map(([key, r]) => (
                  <option key={key} value={key} style={{ backgroundColor: '#111318', color: '#F9FAFB' }}>{r.icon} {r.label}</option>
                ))}
              </select>
            </div>
            <button onClick={() => { const savedPhoto = localStorage.getItem('lumio_user_photo'); const savedName = localStorage.getItem('lumio_user_name'); localStorage.removeItem('lumio_schools_demo_loaded'); Object.keys(localStorage).filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_schools_demo') || k.includes('_hasData')).forEach(k => localStorage.removeItem(k)); if (savedPhoto) localStorage.setItem('lumio_user_photo', savedPhoto); if (savedName) localStorage.setItem('lumio_user_name', savedName); window.location.href = `/schools/${slug}` }}
              className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ display: 'none' }}>
              Clear Demo Data
            </button>
          </div>
        )}
        {activeRole === 'governor' && isSchoolDemo && (
          <div className="flex items-center gap-2 px-6 shrink-0" style={{ height: 36, minHeight: 36, background: 'linear-gradient(90deg, #1E293B, #111827)', color: '#9CA3AF', borderBottom: '1px solid #1F2937' }}>
            <span style={{ fontSize: 14 }}>🏛️</span>
            <span className="text-xs font-medium">Governor view — read-only dashboard and reports. No quick actions or editing capabilities.</span>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <SchoolRoleContext.Provider value={activeRole}>
            {children}
          </SchoolRoleContext.Provider>
        </main>
      </div>
    </div>
  )
}
