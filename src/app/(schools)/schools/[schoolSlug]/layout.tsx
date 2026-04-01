'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, GraduationCap, Sunrise, Network, Pin, LogOut, DoorOpen, Clock,
} from 'lucide-react'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import { getSchoolClientRole } from '@/lib/detect-school-role'

const COLLAPSED_W = 48
const EXPANDED_W = 200

const NAV = [
  { section: null,          path: '',              label: 'Overview',               icon: LayoutDashboard, badge: null },
  { section: null,          path: 'slt',           label: 'SLT Suite',              icon: GraduationCap,   badge: null, sltOnly: true },
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
  { section: 'Tools',       path: 'trust',         label: 'Trust Overview',         icon: Network,         badge: null },
  { section: null,          path: 'ofsted',        label: 'Ofsted Mode',            icon: Shield,          badge: 'NEW' },
  { section: null,          path: 'workflows',     label: 'Workflows',              icon: GitBranch,       badge: null },
  { section: null,          path: 'reports',       label: 'Reports',                icon: FileText,        badge: null },
  { section: null,          path: '/parent',       label: 'Parent Portal',          icon: Users,           badge: null },
  { section: null,          path: 'settings',      label: 'Settings',               icon: Settings,        badge: null },
]

interface Props { children: React.ReactNode; params: Promise<{ schoolSlug: string }> }

export default function SchoolLayout({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slugMatch = pathname.match(/\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? ''
  const base = `/schools/${slug}`

  const [schoolName, setSchoolName] = useState(slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
  const [initials, setInitials] = useState('SC')
  const [planLabel, setPlanLabel] = useState('Trial workspace')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

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

    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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
        <div className="flex shrink-0 items-center gap-2.5 px-2.5 py-4" style={{ borderBottom: '1px solid #1F2937', minHeight: 56 }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            {schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
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
            return true
          }).map((item, i) => {
            const prev = NAV[i - 1]
            const showSection = expanded && item.section && item.section !== prev?.section
            const href = item.path === '' ? base : item.path.startsWith('/') ? `${item.path}/${slug}` : `${base}/${item.path}`
            const isActive = item.path === '' ? pathname === base || pathname === `${base}/` : item.path.startsWith('/') ? pathname.startsWith(item.path) : pathname.startsWith(`${base}/${item.path}`)
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
          <div className="flex shrink-0 items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              {schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
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
              return true
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
          <button onClick={() => setNotificationsOpen(o => !o)}
            className="relative flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', cursor: 'pointer' }}>
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute flex items-center justify-center rounded-full" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>3</span>
          </button>
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button onClick={() => setAvatarOpen(o => !o)}
              style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#0D9488', border: 'none', color: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              {initials}
            </button>
            {avatarOpen && (
              <div className="rounded-xl py-2 shadow-xl" style={{ position: 'absolute', top: 44, right: 0, minWidth: 160, backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 70 }}>
                {userName && <div className="px-4 py-2" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{userName}</p>{userEmail && <p className="text-xs truncate" style={{ color: '#6B7280' }}>{userEmail}</p>}</div>}
                <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_school_')).forEach(k => localStorage.removeItem(k)); router.replace('/schools/login') }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm" style={{ color: '#EF4444' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
        {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={18} /></button>
          <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{schoolName}</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
