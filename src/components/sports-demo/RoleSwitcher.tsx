'use client'

import { useState } from 'react'
import type { SportsDemoSession } from './SportsDemoGate'

interface RoleSwitcherProps {
  session: SportsDemoSession
  roles: Array<{ id: string; label: string; icon: string; description?: string }>
  accentColor: string
  onRoleChange: (newRole: string) => void
  sidebarCollapsed?: boolean
}

export default function RoleSwitcher({
  session, roles, accentColor, onRoleChange, sidebarCollapsed = false
}: RoleSwitcherProps) {
  const [open, setOpen] = useState(false)
  const currentRole = roles.find(r => r.id === session.role) ?? roles[0]

  const handleSwitch = (roleId: string) => {
    const key = `lumio_sports_demo_${session.sport}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        parsed.role = roleId
        localStorage.setItem(key, JSON.stringify(parsed))
      }
    } catch { /* ignore */ }
    onRoleChange(roleId)
    setOpen(false)
  }

  if (sidebarCollapsed) return (
    <button onClick={() => setOpen(!open)} title={`Viewing as ${currentRole?.label}`}
      className="w-full flex items-center justify-center py-3 text-lg"
      style={{ color: accentColor }}>
      {currentRole?.icon ?? '👤'}
    </button>
  )

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0d1117] border border-gray-700 rounded-xl p-2 shadow-2xl z-50">
          <div className="text-[10px] text-gray-600 uppercase tracking-wider px-2 pb-2">Switch view</div>
          {roles.map(r => (
            <button key={r.id} onClick={() => handleSwitch(r.id)}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all ${
                r.id === session.role ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
              style={r.id === session.role ? { background: `${accentColor}15` } : {}}>
              <span className="text-sm flex-shrink-0">{r.icon}</span>
              <div>
                <div className="text-xs font-semibold">{r.label}</div>
                {r.id === session.role && <div className="text-[10px]" style={{ color: accentColor }}>Current view</div>}
              </div>
              {r.id === session.role && <span className="ml-auto text-[10px] font-bold" style={{ color: accentColor }}>✓</span>}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all hover:border-gray-600"
        style={{ borderColor: `${accentColor}40`, background: `${accentColor}10` }}>
        <div className="w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center bg-gray-800"
          style={{ borderColor: `${accentColor}50` }}>
          {session.photoDataUrl
            ? <img src={session.photoDataUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-base">{currentRole?.icon ?? '👤'}</span>}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-semibold text-white truncate">{session.userName}</div>
          <div className="text-[10px] truncate" style={{ color: accentColor }}>{currentRole?.label}</div>
        </div>
        <span className="text-gray-600 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
    </div>
  )
}
