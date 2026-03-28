'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, Zap, GraduationCap, Sunrise, Network,
} from 'lucide-react'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'

const NAV = [
  { section: null,          path: '',              label: 'Overview',               icon: LayoutDashboard, badge: null },
  { section: null,          path: 'insights',      label: 'Insights',               icon: Sparkles,        badge: null },
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
  { section: null,          path: 'workflows',     label: 'Workflows',              icon: GitBranch,       badge: null },
  { section: null,          path: 'reports',       label: 'Reports',                icon: FileText,        badge: null },
  { section: null,          path: 'settings',      label: 'Settings',               icon: Settings,        badge: null },
]

interface Props { children: React.ReactNode }

export default function DemoSchoolLayout({ children }: Props) {
  const [open, setOpen] = useState(false)
  const [isSchoolDemo, setIsSchoolDemo] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsSchoolDemo(localStorage.getItem('lumio_school_demo_active') === 'true')
  }, [])

  function clearSchoolDemo() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_school_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_school_demo_active', 'false')
    window.location.reload()
  }

  const slugMatch = pathname.match(/\/demo\/schools\/([^/]+)/)
  const slug = slugMatch?.[1] ?? 'oakridge-primary'
  const base = `/demo/schools/${slug}`

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F' }}>
      {open && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={['fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'].join(' ')}
        style={{ width: 200, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}
      >
        <div className="flex shrink-0 items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>OP</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>Oakridge Primary School</p>
            <p className="text-[10px] truncate" style={{ color: '#0D9488' }}>Trial workspace</p>
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

        {/* Sidebar bottom: avatar + bell + logo */}
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {isSchoolDemo && (
            <button onClick={clearSchoolDemo}
              className="block w-full px-4 py-2 text-center text-xs font-semibold transition-colors"
              style={{ color: '#EF4444' }}>
              ✕ Clear Demo Data
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>SH</div>
            <span className="flex-1 text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>SH</span>
            <button className="relative flex items-center justify-center rounded-lg p-1.5" style={{ color: '#9CA3AF' }}>
              <Bell size={16} strokeWidth={1.75} />
              <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            </button>
          </div>
          <div className="px-4 pb-3">
            <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block opacity-40 hover:opacity-70 transition-opacity">
              <img src="/lumio-transparent-new.png" alt="Lumio" width={80} height={22} />
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col md:pl-[200px] overflow-hidden">
        {/* Demo banner */}
        <div className="flex items-center justify-between gap-3 mx-4 mt-3 px-4 py-2.5 rounded-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e1040 0%, #1a1050 40%, #0d3a3a 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Zap size={13} style={{ color: '#0D9488', flexShrink: 0 }} />
            <p className="text-xs truncate" style={{ color: '#F9FAFB' }}>
              <span className="font-semibold">Trial workspace</span> · 14 days remaining · Demo data only
            </p>
          </div>
          <Link href="/schools/checkout" className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Buy Lumio
          </Link>
        </div>

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => setOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={18} /></button>
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
