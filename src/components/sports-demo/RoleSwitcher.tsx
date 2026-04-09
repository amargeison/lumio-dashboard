'use client'

import { useState } from 'react'
import type { SportsDemoSession } from './SportsDemoGate'

interface Props {
  session: SportsDemoSession
  roles: Array<{ id: string; label: string; icon: string }>
  accentColor: string
  onRoleChange: (role: string) => void
  onReset: () => void
  collapsed?: boolean
}

export default function RoleSwitcher({
  session, roles, accentColor, onRoleChange, onReset, collapsed = false
}: Props) {
  const [open, setOpen] = useState(false)
  const current = roles.find(r => r.id === session.role) ?? roles[0]

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all hover:border-opacity-80 ${collapsed ? 'justify-center' : ''}`}
        style={{ borderColor: `${accentColor}40`, background: `${accentColor}10` }}>
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: `${accentColor}60` }}>
          {session.userPhoto
            ? <img src={session.userPhoto} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center text-xs font-bold"
                style={{ background: `${accentColor}30`, color: accentColor }}>
                {(session.userName || session.email)[0].toUpperCase()}
              </div>}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-semibold text-white truncate">{session.userName || session.email.split('@')[0]}</div>
            <div className="text-[10px] truncate" style={{ color: accentColor }}>{current.icon} {current.label}</div>
          </div>
        )}
        {!collapsed && <span className="text-gray-600 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden shadow-2xl z-50">
          <div className="px-3 py-2.5 border-b border-gray-800/50">
            <div className="flex items-center gap-2">
              {session.logoUrl
                ? <img src={session.logoUrl} className="w-6 h-6 rounded object-cover flex-shrink-0" alt="" />
                : <span className="text-sm flex-shrink-0">🛡️</span>}
              <div className="min-w-0">
                <div className="text-xs text-white font-medium truncate">{session.clubName}</div>
                <div className="text-[10px] text-gray-500">Demo session</div>
              </div>
            </div>
          </div>
          <div className="py-1">
            <div className="px-3 py-1.5 text-[9px] text-gray-600 uppercase tracking-wider font-bold">View as</div>
            {roles.map(r => (
              <button key={r.id} onClick={() => { onRoleChange(r.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  session.role === r.id ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={session.role === r.id ? { background: `${accentColor}15`, color: accentColor } : undefined}>
                <span>{r.icon}</span>
                <span className="text-xs font-medium">{r.label}</span>
                {session.role === r.id && <span className="ml-auto text-[9px]" style={{ color: accentColor }}>● Active</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-800/50 px-3 py-2">
            <button onClick={() => { setOpen(false); onReset() }}
              className="w-full text-xs text-gray-600 hover:text-gray-400 text-left transition-colors py-1">
              ↺ Reset demo / switch account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
