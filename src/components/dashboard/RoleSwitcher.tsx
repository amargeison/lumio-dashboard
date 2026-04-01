'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Eye, X, ChevronDown } from 'lucide-react'

const ROLES = [
  { key: 'owner', label: 'Owner', emoji: '👑', level: 1 },
  { key: 'director', label: 'Director', emoji: '🎯', level: 1 },
  { key: 'admin', label: 'Admin', emoji: '🛡️', level: 2 },
  { key: 'manager', label: 'Manager', emoji: '📋', level: 3 },
  { key: 'user', label: 'User', emoji: '👤', level: 4 },
]

/**
 * Role switcher pill — only renders for workspace owners.
 * Stores impersonated role in localStorage and triggers re-render.
 */
export function RoleSwitcherPill() {
  const [isOwner, setIsOwner] = useState(false)
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsOwner(localStorage.getItem('lumio_user_is_owner') === 'true')
    setImpersonating(localStorage.getItem('lumio_impersonated_role'))
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!isOwner) return null

  const currentRole = ROLES.find(r => r.key === (impersonating || 'owner')) || ROLES[0]
  const isPreview = !!impersonating && impersonating !== 'owner'

  function selectRole(key: string) {
    if (key === 'owner') {
      localStorage.removeItem('lumio_impersonated_role')
      setImpersonating(null)
    } else {
      localStorage.setItem('lumio_impersonated_role', key)
      setImpersonating(key)
    }
    setOpen(false)
    // Force re-render of sidebar and all role-dependent components
    window.dispatchEvent(new Event('lumio-settings-changed'))
    window.location.reload()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
        style={{ backgroundColor: isPreview ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: isPreview ? '#F59E0B' : '#9CA3AF', border: `1px solid ${isPreview ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
        <Eye size={12} /> Viewing as: {currentRole.emoji} {currentRole.label} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 rounded-xl py-1.5 shadow-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 100, minWidth: 180 }}>
          {ROLES.map(r => (
            <button key={r.key} onClick={() => selectRole(r.key)} className="flex w-full items-center gap-2 px-4 py-2 text-xs transition-colors"
              style={{ color: currentRole.key === r.key ? '#F9FAFB' : '#9CA3AF', backgroundColor: currentRole.key === r.key ? 'rgba(108,63,197,0.1)' : 'transparent' }}
              onMouseEnter={e => { if (currentRole.key !== r.key) e.currentTarget.style.backgroundColor = '#1F2937' }}
              onMouseLeave={e => { if (currentRole.key !== r.key) e.currentTarget.style.backgroundColor = 'transparent' }}>
              <span>{r.emoji}</span> {r.label}
              {currentRole.key === r.key && <span className="ml-auto text-[10px]" style={{ color: '#7C3AED' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Amber preview banner — shows when impersonating a role.
 */
export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState<string | null>(null)

  useEffect(() => {
    setImpersonating(localStorage.getItem('lumio_impersonated_role'))
  }, [])

  if (!impersonating || impersonating === 'owner') return null

  const role = ROLES.find(r => r.key === impersonating)

  function exitPreview() {
    localStorage.removeItem('lumio_impersonated_role')
    window.dispatchEvent(new Event('lumio-settings-changed'))
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2" style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)' }}>
      <Eye size={14} style={{ color: '#F59E0B' }} />
      <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
        Previewing as: {role?.emoji} {role?.label} — your actual role is Owner
      </span>
      <button onClick={exitPreview} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
        <X size={10} /> Exit Preview
      </button>
    </div>
  )
}
