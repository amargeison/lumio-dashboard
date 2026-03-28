'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, GraduationCap, Sunrise, Network,
} from 'lucide-react'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

const NAV = [
  { section: null,          path: '',              label: 'Overview',               icon: LayoutDashboard, badge: null },
  { section: null,          path: 'insights',      label: 'Insights',               icon: Sparkles,        badge: null },
  { section: 'Departments', path: 'school-office', label: 'School Office',          icon: Building2,       badge: null },
  { section: null,          path: 'hr-staff',      label: 'HR & Staff',             icon: Users,           badge: null },
  { section: null,          path: 'curriculum',    label: 'Curriculum',             icon: BookOpen,        badge: null },
  { section: null,          path: 'students',      label: 'Students',               icon: GraduationCap,   badge: null },
  { section: null,          path: 'send-dsl',      label: 'SEND & DSL',             icon: Heart,           badge: 2    },
  { section: null,          path: 'finance',       label: 'Finance',                icon: DollarSign,      badge: null },
  { section: null,          path: 'facilities',    label: 'Facilities',             icon: Wrench,          badge: null },
  { section: null,          path: 'admissions',    label: 'Admissions & Marketing', icon: UserPlus,        badge: null },
  { section: null,          path: 'safeguarding',  label: 'Safeguarding',           icon: Shield,          badge: 1    },
  { section: null,          path: 'wraparound',    label: 'Pre & After School',     icon: Sunrise,         badge: null },
  { section: 'Tools',       path: 'trust',         label: 'Trust Overview',         icon: Network,         badge: null },
  { section: null,          path: 'workflows',     label: 'Workflows',              icon: GitBranch,       badge: null },
  { section: null,          path: 'reports',       label: 'Reports',                icon: FileText,        badge: null },
  { section: null,          path: 'settings',      label: 'Settings',               icon: Settings,        badge: null },
]

interface Props {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}

export default function SchoolLayout({ children }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Extract slug from pathname: /schools/[slug]/...
  const slugMatch = pathname.match(/\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? ''
  const base = `/schools/${slug}`

  const [schoolName, setSchoolName] = useState(
    slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  )
  useEffect(() => {
    const stored = localStorage.getItem(`lumio_school_${slug}_name`)
    if (stored) { setSchoolName(stored); return }
    // Fallback: fetch from API if localStorage is empty
    fetch(`/api/schools/${slug}`).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.name) {
        setSchoolName(data.name)
        localStorage.setItem(`lumio_school_${slug}_name`, data.name)
      }
    }).catch(() => {})
  }, [slug])

  const [initials, setInitials] = useState('SH')
  useEffect(() => {
    const stored = localStorage.getItem(`lumio_school_${slug}_initials`)
    if (stored) setInitials(stored)
  }, [slug])

  const [planLabel, setPlanLabel] = useState('Trial workspace')
  useEffect(() => {
    const plan = localStorage.getItem(`lumio_school_${slug}_plan`)
    if (plan) setPlanLabel(`${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`)
  }, [slug])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F' }}>
      {open && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={['fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'].join(' ')}
        style={{ width: 200, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}
      >
        <div className="flex shrink-0 items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            {schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{schoolName}</p>
            <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{planLabel}</p>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} style={{ color: '#9CA3AF' }}><X size={16} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item, i) => {
            const prev = NAV[i - 1]
            const showSection = item.section && item.section !== prev?.section
            const href = item.path === '' ? base : `${base}/${item.path}`
            const isActive = item.path === ''
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(`${base}/${item.path}`)
            const Icon = item.icon
            return (
              <div key={item.path || 'overview'}>
                {showSection && (
                  <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>
                )}
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={{ backgroundColor: isActive ? '#0D9488' : 'transparent', color: isActive ? '#F9FAFB' : '#9CA3AF' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = '#111318'; e.currentTarget.style.color = '#F9FAFB' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}
                >
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

        {/* Sidebar bottom: avatar + Lumio logo */}
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 px-4 py-3">
            <AvatarDropdown initials={initials} />
            <span className="flex-1 text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{initials}</span>
          </div>
          <div className="pb-3">
            <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
              <img src="/lumio-transparent-new.png" alt="Lumio" width={120} height={33} />
            </a>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-[200px] overflow-hidden">
        {/* Notifications bell — top-right of content area */}
        <button
          className="fixed z-40 hidden md:flex items-center justify-center rounded-full transition-colors"
          style={{ top: 16, right: 16, width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.75} />
          <span className="absolute rounded-full" style={{ top: 8, right: 8, width: 6, height: 6, backgroundColor: '#EF4444' }} />
        </button>
        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => setOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={18} /></button>
          <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{schoolName}</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
