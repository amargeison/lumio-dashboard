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
        <div className="flex shrink-0 items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
              <Building2 size={12} color="white" />
            </div>
            <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
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

        <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs font-semibold truncate" style={{ color: '#9CA3AF' }}>{schoolName}</p>
          <p className="text-xs" style={{ color: '#4B5563' }}>{planLabel}</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-[200px] overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-6" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#07080F' }}>
          <button className="md:hidden" onClick={() => setOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={20} /></button>
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="hidden md:block opacity-80 hover:opacity-100 transition-opacity">
              <img src="/lumio-transparent-new.png" alt="Lumio" width={80} height={22} />
            </a>
            <div className="hidden md:block h-4 w-px mx-1" style={{ backgroundColor: '#1F2937' }} />
            <div className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              {schoolName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{schoolName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative" style={{ color: '#9CA3AF' }}>
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB', fontSize: 9 }}>3</span>
            </button>
            <AvatarDropdown initials={initials} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
