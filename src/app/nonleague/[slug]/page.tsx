'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { use } from 'react'
import {
  Users, Home, Calendar, Target, Bell, Shield, Shirt, Clipboard, Trophy,
  UserPlus, DollarSign, Heart, MapPin, MessageSquare, Menu, ChevronLeft,
  Loader2,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import NonLeagueContent, { NL_SIDEBAR_ITEMS, type NLDeptId } from '@/app/(demo-workspace)/demo/football-amateur/[slug]/nl-content'
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'

// ─── NONLEAGUE ROLES ──────────────────────────────────────────────────────────
const NONLEAGUE_ROLES = [
  { id: 'manager',   label: 'Manager',         icon: '⚽', description: 'Squad & tactics'     },
  { id: 'assistant', label: 'Asst Manager',    icon: '📋', description: 'Match prep & squad'  },
  { id: 'secretary', label: 'Club Secretary',  icon: '📋', description: 'Admin & compliance'  },
  { id: 'treasurer', label: 'Treasurer',       icon: '💰', description: 'Finance & subs'      },
  { id: 'sponsor',   label: 'Sponsor',         icon: '🤝', description: 'Sponsorship & events'},
]

// ─── Theme Colors (Amber) ──────────────────────────────────────────────────

const PRIMARY = '#D97706'
const DARK    = '#B45309'
const ACCENT  = '#FDE68A'
const BG      = '#0F172A'
const CARD_BG = '#1E293B'
const BORDER  = '#334155'
const TEXT     = '#F8FAFC'
const TEXT_SEC = '#94A3B8'

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: PRIMARY, color: TEXT }}>{message}</div>
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, session, onPinChange }: { activeDept: string; onSelect: (d: string) => void; open: boolean; onClose: () => void; session?: SportsDemoSession; onPinChange?: (pinned: boolean) => void }) {
  const items = NL_SIDEBAR_ITEMS
  const sectionLabels = [...new Set(items.map(i => i.section))]
  const sections = sectionLabels.map(label => ({ label, items: items.filter(i => i.section === label) }))

  const [pinned, setPinned] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem('lumio_nonleague_sidebar_pinned') === '1'; return false })
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = pinned || hovered
  const togglePin = () => { const next = !pinned; setPinned(next); if (typeof window !== 'undefined') localStorage.setItem('lumio_nonleague_sidebar_pinned', next ? '1' : '0'); onPinChange?.(next) }
  const handleMouseEnter = () => { if (timerRef.current) clearTimeout(timerRef.current); setHovered(true) }
  const handleMouseLeave = () => { timerRef.current = setTimeout(() => setHovered(false), 200) }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 z-30 transition-all duration-200" style={{ width: expanded ? 200 : 52, backgroundColor: BG, borderRight: `1px solid ${BORDER}` }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-2.5 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, minHeight: 52 }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: PRIMARY, color: '#fff' }}>HF</div>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: TEXT }}>Harfield FC</p>
                <p className="text-[10px] truncate" style={{ color: TEXT_SEC }}>Non-League Portal</p>
              </div>
              <button onClick={togglePin} className="shrink-0 p-1 rounded" style={{ color: pinned ? PRIMARY : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }} title={pinned ? 'Unpin' : 'Pin open'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
              </button>
            </>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-1.5 py-3 overflow-y-auto amateur-sidebar-scroll">
          {sections.map((sec, si) => (
            <div key={si}>
              {sec.label && expanded && <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1.5" style={{ color: '#4B5563' }}>{sec.label}</p>}
              {sec.items.map(item => {
                const active = activeDept === item.id
                return (
                  <button key={item.id} onClick={() => { onSelect(item.id); if (!pinned) setHovered(false) }} className="flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium text-left w-full transition-all"
                    style={{ backgroundColor: active ? `${PRIMARY}1f` : 'transparent', color: active ? PRIMARY : TEXT_SEC, borderLeft: active ? `2px solid ${PRIMARY}` : '2px solid transparent', paddingLeft: expanded ? 12 : 0, justifyContent: expanded ? 'flex-start' : 'center' }} title={expanded ? undefined : item.label}>
                    <item.icon size={15} strokeWidth={active ? 2.5 : 2} />{expanded && <span className="truncate">{item.label}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {session && (
          <RoleSwitcher
            session={session}
            roles={NONLEAGUE_ROLES}
            accentColor="#D97706"
            onRoleChange={(role) => {
              const key = 'lumio_nonleague_demo_session'
              const stored = localStorage.getItem(key)
              if (stored) {
                const parsed = JSON.parse(stored)
                localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
              }
            }}
            sidebarCollapsed={!expanded}
          />
        )}

        {/* Footer logo */}
        <div className="mt-auto shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
          {expanded && (
            <div className="pb-3 pt-2 flex flex-col items-center gap-2">
              <Image src="/football_logo.png" alt="Football" width={80} height={80} style={{ width: 60, height: 'auto', objectFit: 'contain', opacity: 0.7 }} />
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 100, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <aside className="relative z-50 w-56 flex flex-col" style={{ backgroundColor: BG, borderRight: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-xs font-semibold" style={{ color: TEXT_SEC }}>NAVIGATION</span>
              <button onClick={onClose} style={{ color: TEXT_SEC }}><ChevronLeft size={16} /></button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto amateur-sidebar-scroll">
              {items.map(item => {
                const active = activeDept === item.id
                return (
                  <button key={item.id} onClick={() => { onSelect(item.id); onClose() }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full" style={{ backgroundColor: active ? `${PRIMARY}1f` : 'transparent', color: active ? PRIMARY : TEXT_SEC }}>
                    <item.icon size={15} strokeWidth={active ? 2.5 : 2} /><span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function NonLeaguePortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="nonleague"
      defaultClubName="Harfield FC"
      defaultSlug={slug}
      accentColor="#D97706"
      accentColorLight="#F59E0B"
      sportEmoji="⚽"
      sportLabel="Lumio Non League"
      roles={NONLEAGUE_ROLES}
    >
      {(session) => <NonLeaguePortalInner session={session} />}
    </SportsDemoGate>
  )
}

function NonLeaguePortalInner({ session }: { session: SportsDemoSession }) {
  const [activeDept, setActiveDept] = useState<string>('nl-overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sidebarPinned, setSidebarPinned] = useState(() => { if (typeof window !== 'undefined') return localStorage.getItem('lumio_nonleague_sidebar_pinned') === '1'; return false })
  const activeRole = session.role
  const clubName = session.clubName || 'Harfield FC'

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const deptLabel = NL_SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: TEXT, height: '100vh', overflow: 'hidden' }}>
      <Toast message={toast} />

      {/* Scrollbar styles */}
      <style>{`
        .amateur-sidebar-scroll { scrollbar-width: thin; scrollbar-color: ${BORDER} transparent; }
        .amateur-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .amateur-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .amateur-sidebar-scroll::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }
        .amateur-quickactions-hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .amateur-quickactions-hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Demo workspace banner */}
      <div className="flex items-center justify-between px-6 py-2 text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#0D9488', color: '#ffffff' }}>
        <span>Demo workspace · sample data</span>
        <a href="/pricing-sports" className="flex items-center gap-1 hover:underline font-semibold" style={{ color: '#ffffff' }}>To see your own data — sign up free →</a>
      </div>

      {/* Top-right avatar + notifications */}
      <div style={{ position: 'fixed', top: 40, right: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Notifications" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: `1px solid ${BORDER}`, color: TEXT_SEC, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
        </button>
        <button style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: PRIMARY, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          {(session.userName || 'Steve').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </button>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <button className="p-1.5 rounded-lg" style={{ color: TEXT_SEC }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
        <span className="text-sm font-semibold ml-2 truncate" style={{ color: TEXT }}>{clubName}</span>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeDept={activeDept} onSelect={(d) => setActiveDept(d)} open={sidebarOpen} onClose={() => setSidebarOpen(false)} session={session} onPinChange={setSidebarPinned} />

        <div className="flex-1 flex flex-col overflow-y-auto min-w-0" style={{ marginLeft: sidebarPinned ? 220 : 72, transition: 'margin-left 250ms ease' }}>
          <main className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">{deptLabel}</h1>
                <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{clubName} &middot; Northern Premier League West</p>
              </div>
            </div>

            <NonLeagueContent activeDept={activeDept as NLDeptId} onToast={fireToast} userName={session.userName} />
          </main>
        </div>
      </div>
    </div>
  )
}
