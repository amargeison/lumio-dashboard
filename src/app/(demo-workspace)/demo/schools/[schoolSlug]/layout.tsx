'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, Zap, GraduationCap, Sunrise, Network, Pin, LogOut,
  Clock, ArrowRight,
} from 'lucide-react'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'

const COLLAPSED_W = 48
const EXPANDED_W = 200

const NAV = [
  { section: null,          path: '',              label: 'Overview',               icon: LayoutDashboard, badge: null },
  { section: null,          path: 'insights',      label: 'Insights',               icon: Sparkles,        badge: null },
  { section: null,          path: 'slt',           label: 'SLT Suite',              icon: GraduationCap,   badge: null },
  { section: 'Departments', path: 'school-office', label: 'School Office',          icon: Building2,       badge: null },
  { section: null,          path: 'hr-staff',      label: 'HR & Staff',             icon: Users,           badge: null },
  { section: null,          path: 'curriculum',    label: 'Curriculum',             icon: BookOpen,        badge: null },
  { section: null,          path: 'students',      label: 'Students',               icon: GraduationCap,   badge: null },
  { section: null,          path: 'send-dsl',      label: 'SEND & DSL',             icon: Heart,           badge: 2    },
  { section: null,          path: 'wraparound',    label: 'Pre & After School',     icon: Sunrise,         badge: null },
  { section: null,          path: 'finance',       label: 'Finance',                icon: DollarSign,      badge: null },
  { section: null,          path: 'facilities',    label: 'Facilities',             icon: Wrench,          badge: null },
  { section: null,          path: 'admissions',    label: 'Admissions & Marketing', icon: UserPlus,        badge: null },
  { section: null,          path: 'safeguarding',  label: 'Safeguarding',           icon: Shield,          badge: 1    },
  { section: 'Tools',       path: 'trust',         label: 'Trust Overview',         icon: Network,         badge: null },
  { section: null,          path: 'ofsted',        label: 'Ofsted Mode',            icon: Shield,          badge: 'NEW' },
  { section: null,          path: 'workflows',     label: 'Workflows',              icon: GitBranch,       badge: null },
  { section: null,          path: 'reports',       label: 'Reports',                icon: FileText,        badge: null },
  { section: null,          path: 'settings',      label: 'Settings',               icon: Settings,        badge: null },
]

interface Props { children: React.ReactNode }

export default function DemoSchoolLayout({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [isSchoolDemo, setIsSchoolDemo] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(true)
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slugMatch = pathname.match(/\/demo\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? 'oakridge-primary'
  const base = `/demo/schools/${slug}`

  useEffect(() => {
    setIsSchoolDemo(localStorage.getItem('lumio_school_demo_active') === 'true')
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    const cachedPhoto = localStorage.getItem('lumio_user_photo')
    if (cachedPhoto && !cachedPhoto.startsWith('data:')) setUserPhoto(cachedPhoto)
    const email = localStorage.getItem('lumio_user_email')
    if (email) { const p = localStorage.getItem(`lumio_staff_photo_${email}`); if (p && !p.startsWith('data:')) setUserPhoto(p) }
    function onAvatarUpdated(e: Event) { setUserPhoto((e as CustomEvent).detail || null) }
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => { document.removeEventListener('mousedown', handleClick); window.removeEventListener('lumio-avatar-updated', onAvatarUpdated) }
  }, [])

  function clearSchoolDemo() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_school_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_school_demo_active', 'false')
    window.location.reload()
  }

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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>OP</div>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>Oakridge Primary</p>
                <p className="text-[10px] truncate" style={{ color: '#0D9488' }}>Trial workspace</p>
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
          {NAV.map((item, i) => {
            const prev = NAV[i - 1]
            const showSection = expanded && item.section && item.section !== prev?.section
            const href = item.path === '' ? base : `${base}/${item.path}`
            const isActive = item.path === '' ? pathname === base || pathname === `${base}/` : pathname.startsWith(`${base}/${item.path}`)
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
          {expanded && isSchoolDemo && (
            <button onClick={clearSchoolDemo} className="block w-full px-4 py-2 text-center text-xs font-semibold" style={{ color: '#EF4444' }}>
              ✕ Clear Demo Data
            </button>
          )}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>OP</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>Oakridge Primary</p>
              <p className="text-[10px] truncate" style={{ color: '#0D9488' }}>Trial workspace</p>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ color: '#9CA3AF' }}><X size={16} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {NAV.map((item, i) => {
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
              style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: userPhoto ? 'transparent' : '#0D9488', border: 'none', color: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, overflow: 'hidden', padding: 0 }}>
              {userPhoto ? (
                <img src={userPhoto} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={() => setUserPhoto(null)} />
              ) : 'SH'}
            </button>
            {avatarOpen && (
              <div className="rounded-xl py-2 shadow-xl" style={{ position: 'absolute', top: 44, right: 0, minWidth: 160, backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 70 }}>
                <div className="px-4 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>Sarah Henderson</p>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>Headteacher</p>
                </div>
                <Link href="/schools/checkout" onClick={() => setAvatarOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm" style={{ color: '#0D9488' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <Zap size={14} /> Buy Lumio
                </Link>
                <button onClick={() => { router.replace('/schools/login') }}
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

        {/* Trial banner — teal bar matching business demo portal */}
        {showUpgrade && (
          <div className="flex items-center justify-between px-4 py-2 text-sm shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', paddingRight: 120 }}>
            <div className="flex items-center gap-2">
              <Clock size={13} />
              <span className="font-medium">Trial workspace — 14 days remaining</span>
              <span className="hidden sm:inline opacity-75">· Demo data only</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#F9FAFB' }}>
                <UserPlus size={11} /> Invite team
              </button>
              <button onClick={clearSchoolDemo} className="hidden sm:inline font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                Clear Demo Data
              </button>
              <Link href="/schools/checkout" className="font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                Buy <ArrowRight size={11} className="inline" />
              </Link>
              <button onClick={() => setShowUpgrade(false)} className="opacity-70 hover:opacity-100">✕</button>
            </div>
          </div>
        )}

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={18} /></button>
          <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>Oakridge Primary School</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ClearDemoBar />
          {children}
        </main>
      </div>
    </div>
  )
}
