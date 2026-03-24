'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, Zap,
} from 'lucide-react'

const NAV = [
  { section: null,          path: '',              label: 'Overview',               icon: LayoutDashboard, badge: null },
  { section: null,          path: 'insights',      label: 'Insights',               icon: Sparkles,        badge: null },
  { section: 'Departments', path: 'school-office', label: 'School Office',          icon: Building2,       badge: null },
  { section: null,          path: 'hr-staff',      label: 'HR & Staff',             icon: Users,           badge: null },
  { section: null,          path: 'curriculum',    label: 'Curriculum',             icon: BookOpen,        badge: null },
  { section: null,          path: 'send-dsl',      label: 'SEND & DSL',             icon: Heart,           badge: 2    },
  { section: null,          path: 'finance',       label: 'Finance',                icon: DollarSign,      badge: null },
  { section: null,          path: 'facilities',    label: 'Facilities',             icon: Wrench,          badge: null },
  { section: null,          path: 'admissions',    label: 'Admissions & Marketing', icon: UserPlus,        badge: null },
  { section: null,          path: 'safeguarding',  label: 'Safeguarding',           icon: Shield,          badge: 1    },
  { section: 'Tools',       path: 'workflows',     label: 'Workflows',              icon: GitBranch,       badge: null },
  { section: null,          path: 'reports',       label: 'Reports',                icon: FileText,        badge: null },
  { section: null,          path: 'settings',      label: 'Settings',               icon: Settings,        badge: null },
]

interface Props { children: React.ReactNode }

export default function DemoSchoolLayout({ children }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

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
        <div className="flex shrink-0 items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
              <Building2 size={12} color="white" />
            </div>
            <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} style={{ color: '#9CA3AF' }}><X size={16} /></button>
        </div>

        <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #1F2937', backgroundColor: 'rgba(13,148,136,0.06)' }}>
          <p className="text-xs font-semibold truncate" style={{ color: '#F9FAFB' }}>Oakridge Primary School</p>
          <p className="text-xs" style={{ color: '#0D9488' }}>Trial workspace</p>
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
          <Link href="/demo" className="block w-full rounded-lg py-2 text-center text-xs font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Upgrade to Live
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col md:pl-[200px] overflow-hidden">
        {/* Demo banner */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 shrink-0" style={{ backgroundColor: 'rgba(13,148,136,0.12)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Zap size={13} style={{ color: '#0D9488', flexShrink: 0 }} />
            <p className="text-xs truncate" style={{ color: '#0D9488' }}>
              <span className="font-semibold">Trial workspace</span> · 14 days remaining · Demo data only
            </p>
          </div>
          <Link href="/demo" className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Invite team
          </Link>
        </div>

        {/* Top bar */}
        <header className="flex h-12 shrink-0 items-center gap-3 px-4 md:px-6" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#07080F' }}>
          <button className="md:hidden" onClick={() => setOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={20} /></button>
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>Oakridge Primary School</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative" style={{ color: '#9CA3AF' }}>
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB', fontSize: 9 }}>3</span>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>SH</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
