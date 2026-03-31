'use client'

import React, { useState, useEffect } from 'react'
import { X, MessageSquare, User, Mail, Phone, Calendar, MapPin, Hash, Star, Sparkles } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StaffRecord {
  first_name?: string; last_name?: string; email?: string
  job_title?: string; department?: string; phone?: string; start_date?: string
}

export interface StaffProfile {
  favourite_movie?: string; favourite_book?: string; dream_holiday?: string
  favourite_music?: string; hidden_talent?: string; favourite_food?: string
  best_advice?: string; superhero_power?: string
}

// ─── Department colours ──────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  director: '#7C3AED', leadership: '#7C3AED', executive: '#7C3AED',
  marketing: '#EC4899', comms: '#EC4899',
  sales: '#10B981', 'business development': '#10B981',
  hr: '#3B82F6', people: '#3B82F6', 'human resources': '#3B82F6',
  accounts: '#F59E0B', finance: '#F59E0B', accounting: '#F59E0B',
  operations: '#F97316', ops: '#F97316',
  it: '#06B6D4', technology: '#06B6D4', tech: '#06B6D4', engineering: '#06B6D4',
  support: '#EF4444', helpdesk: '#EF4444',
  success: '#14B8A6', 'customer success': '#14B8A6',
  legal: '#6366F1', compliance: '#6366F1',
}

function getDeptColor(dept?: string): string {
  if (!dept) return '#6B7280'
  const lower = dept.toLowerCase()
  for (const [key, color] of Object.entries(DEPT_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#6B7280'
}

// ─── Employee ID ─────────────────────────────────────────────────────────────

function getEmployeeIds(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('lumio_staff_ids') || '{}') } catch { return {} }
}

function getOrCreateId(email: string, index: number): string {
  const ids = getEmployeeIds()
  if (ids[email]) return ids[email]
  const nextNum = Object.keys(ids).length + 1
  const id = `LUM-${String(Math.max(nextNum, index + 1)).padStart(3, '0')}`
  ids[email] = id
  localStorage.setItem('lumio_staff_ids', JSON.stringify(ids))
  return id
}

// ─── Profile storage ─────────────────────────────────────────────────────────

function getProfiles(): Record<string, StaffProfile> {
  try { return JSON.parse(localStorage.getItem('lumio_staff_profiles') || '{}') } catch { return {} }
}

function saveProfile(email: string, profile: StaffProfile) {
  const all = getProfiles()
  all[email] = profile
  localStorage.setItem('lumio_staff_profiles', JSON.stringify(all))
}

// ─── Fun questions ───────────────────────────────────────────────────────────

const FUN_QUESTIONS: { key: keyof StaffProfile; emoji: string; label: string }[] = [
  { key: 'favourite_movie', emoji: '🎬', label: 'Favourite movie' },
  { key: 'favourite_book', emoji: '📚', label: 'Favourite book' },
  { key: 'dream_holiday', emoji: '✈️', label: 'Dream holiday' },
  { key: 'favourite_music', emoji: '🎵', label: 'Favourite music' },
  { key: 'hidden_talent', emoji: '🎯', label: 'Hidden talent' },
  { key: 'favourite_food', emoji: '🍕', label: 'Favourite food' },
  { key: 'best_advice', emoji: '💡', label: 'Best advice' },
  { key: 'superhero_power', emoji: '⚡', label: 'Superhero power' },
]

// ─── Shimmer CSS (injected once) ─────────────────────────────────────────────

const SHIMMER_STYLE_ID = 'lumio-sticker-shimmer'

function injectShimmerCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById(SHIMMER_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = SHIMMER_STYLE_ID
  style.textContent = `
    @keyframes lumio-shimmer {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .lumio-sticker:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }
    .lumio-sticker:hover .lumio-shimmer-border {
      opacity: 1;
    }
    .lumio-shimmer-border {
      opacity: 0;
      transition: opacity 0.3s;
      background: linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #7c3aed, #ff0080);
      background-size: 300% 300%;
      animation: lumio-shimmer 3s ease infinite;
    }
  `
  document.head.appendChild(style)
}

// ─── Seeded random for consistent stats ─────────────────────────────────────

function seedHash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i)
  return Math.abs(h)
}

function seededStat(name: string, salt: string): number {
  return 60 + (seedHash(name + salt) % 40)
}

function getPositionAbbr(title: string): string {
  const t = (title || '').toLowerCase()
  if (/ceo|managing director|founder|owner|president/i.test(t)) return 'CEO'
  if (/cto/i.test(t)) return 'CTO'
  if (/cfo/i.test(t)) return 'CFO'
  if (/coo/i.test(t)) return 'COO'
  if (/director/i.test(t)) return 'DIR'
  if (/head of/i.test(t)) return 'HOD'
  if (/vp|vice president/i.test(t)) return 'VP'
  if (/market/i.test(t)) return 'MKT'
  if (/sale/i.test(t)) return 'SAL'
  if (/engineer|develop|tech/i.test(t)) return 'DEV'
  if (/design/i.test(t)) return 'DES'
  if (/hr|people|human/i.test(t)) return 'HR'
  if (/finance|account/i.test(t)) return 'FIN'
  if (/operat/i.test(t)) return 'OPS'
  if (/support/i.test(t)) return 'SUP'
  if (/manager|lead/i.test(t)) return 'MGR'
  if (/senior/i.test(t)) return 'SNR'
  return 'STF'
}

function getRating(title: string): number {
  const t = (title || '').toLowerCase()
  if (/ceo|cto|cfo|coo|founder|owner|president|managing director/i.test(t)) return 93 + (seedHash(t) % 6)
  if (/director|vp|vice president|head of/i.test(t)) return 86 + (seedHash(t) % 8)
  if (/manager|lead|principal|senior/i.test(t)) return 79 + (seedHash(t) % 7)
  return 74 + (seedHash(t) % 6)
}

// ─── Sticker Card ────────────────────────────────────────────────────────────

export function EmployeeProfileCard({
  staff, index, isCurrentUser, onViewProfile, onMessage, variant = 'full',
}: {
  staff: StaffRecord; index: number; isCurrentUser: boolean
  onViewProfile: () => void; onMessage?: () => void; variant?: 'full' | 'mini'
}) {
  useEffect(() => { injectShimmerCSS() }, [])

  const name = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Unknown'
  const shortName = staff.first_name ? `${staff.first_name} ${(staff.last_name || '')[0] || ''}`.trim() : name
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const deptColor = getDeptColor(staff.department)
  const empId = getOrCreateId(staff.email || `staff-${index}`, index)
  const profile = getProfiles()[staff.email || ''] || {}
  const filledFacts = FUN_QUESTIONS.filter(q => profile[q.key])

  // ── Mini variant (for org chart) ─────────────────────────────────────────
  if (variant === 'mini') {
    return (
      <div className="lumio-sticker relative rounded-xl overflow-hidden cursor-pointer" style={{ width: 160, transition: 'transform 0.25s, box-shadow 0.25s' }} onClick={onViewProfile}>
        <div className="lumio-shimmer-border absolute inset-0 rounded-xl" style={{ padding: 1.5 }}>
          <div className="w-full h-full rounded-[10px]" style={{ backgroundColor: '#111318' }} />
        </div>
        <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${deptColor}, ${deptColor}88)` }} />
          {/* Dept badge + You badge */}
          <div className="flex items-center justify-center gap-1.5 pt-2 px-2">
            {isCurrentUser && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Star size={6} /> You
              </span>
            )}
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${deptColor}20`, color: deptColor, border: `1px solid ${deptColor}40` }}>
              {staff.department || 'Team'}
            </span>
          </div>
          {/* Avatar */}
          <div className="flex justify-center py-2.5">
            <div className="flex items-center justify-center rounded-full text-xl font-black" style={{ width: 60, height: 60, backgroundColor: `${deptColor}25`, color: deptColor, border: `2px solid ${deptColor}50` }}>
              {initials}
            </div>
          </div>
          {/* Name + title + ID */}
          <div className="text-center px-2 pb-2.5">
            <p className="text-xs font-bold truncate" style={{ color: '#F9FAFB' }}>{shortName}</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{staff.job_title || 'Team Member'}</p>
            <p className="text-[9px] mt-1" style={{ color: '#4B5563' }}>{empId}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Full variant — FIFA player card style ──────────────────────────────────
  const posAbbr = getPositionAbbr(staff.job_title || '')
  const rating = getRating(staff.job_title || '')
  const stats = [
    { label: 'PAC', value: seededStat(name, 'pac') },
    { label: 'SHO', value: seededStat(name, 'sho') },
    { label: 'PAS', value: seededStat(name, 'pas') },
    { label: 'DRI', value: seededStat(name, 'dri') },
    { label: 'DEF', value: seededStat(name, 'def') },
    { label: 'PHY', value: seededStat(name, 'phy') },
  ]

  return (
    <div className="lumio-sticker relative rounded-2xl overflow-hidden cursor-pointer" style={{ width: 200, transition: 'transform 0.25s, box-shadow 0.25s' }} onClick={onViewProfile}>
      {/* Shimmer border */}
      <div className="lumio-shimmer-border absolute inset-0 rounded-2xl" style={{ padding: 2 }}>
        <div className="w-full h-full rounded-[14px]" style={{ backgroundColor: '#111318' }} />
      </div>

      <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Gradient top section */}
        <div style={{ background: `linear-gradient(180deg, ${deptColor}40 0%, ${deptColor}15 40%, #111318 100%)`, paddingBottom: 4 }}>

          {/* Position + Rating badges */}
          <div className="flex items-start justify-between px-3 pt-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black leading-none" style={{ color: '#F9FAFB' }}>{rating}</span>
              <span className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color: deptColor }}>{posAbbr}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              {isCurrentUser && (
                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Star size={7} /> You
                </span>
              )}
              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${deptColor}25`, color: deptColor, border: `1px solid ${deptColor}40` }}>
                {staff.department || 'Team'}
              </span>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex justify-center py-3">
            <div className="flex items-center justify-center rounded-full text-4xl font-black" style={{ width: 110, height: 110, backgroundColor: `${deptColor}20`, color: deptColor, border: `4px solid ${deptColor}60`, boxShadow: `0 0 20px ${deptColor}30` }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Name + title */}
        <div className="text-center px-3 -mt-1">
          <p className="text-sm font-black tracking-wide" style={{ color: '#F9FAFB' }}>{name}</p>
          <p className="text-[10px] mt-0.5 font-semibold" style={{ color: deptColor }}>{staff.job_title || 'Team Member'}</p>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${deptColor}40, transparent)` }} />

        {/* Stats grid — FIFA style */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 px-4">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold" style={{ color: '#6B7280', width: 22 }}>{s.label}</span>
              <span className="text-xs font-black" style={{ color: s.value >= 85 ? '#22C55E' : s.value >= 75 ? '#F9FAFB' : '#9CA3AF' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ID + date */}
        <div className="flex items-center justify-center gap-3 px-3 mt-2 text-[9px]" style={{ color: '#4B5563' }}>
          <span>{empId}</span>
          {staff.start_date && <span>{staff.start_date}</span>}
        </div>

        {/* Buttons */}
        <div className="flex gap-1.5 p-3 pt-2">
          {onMessage && (
            <button onClick={e => { e.stopPropagation(); onMessage() }} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              <MessageSquare size={10} /> Message
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onViewProfile() }} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold" style={{ backgroundColor: `${deptColor}15`, color: deptColor, border: `1px solid ${deptColor}30` }}>
            <User size={10} /> Profile
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Full Profile Modal ──────────────────────────────────────────────────────

export function ProfileModal({
  staff, index, isCurrentUser, onClose,
}: {
  staff: StaffRecord; index: number; isCurrentUser: boolean; onClose: () => void
}) {
  const name = [staff.first_name, staff.last_name].filter(Boolean).join(' ') || 'Unknown'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const deptColor = getDeptColor(staff.department)
  const empId = getOrCreateId(staff.email || `staff-${index}`, index)

  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<StaffProfile>(() => getProfiles()[staff.email || ''] || {})

  function handleSave() {
    if (staff.email) saveProfile(staff.email, profile)
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#0F1019', border: '1px solid #1F2937' }}>

        {/* Close button */}
        <div className="flex items-center justify-end px-6 pt-4">
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Sticker card — top half */}
        <div className="px-6 pb-6">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ height: 6, background: `linear-gradient(90deg, ${deptColor}, ${deptColor}88)` }} />
            <div className="flex items-start gap-6 p-6">
              {/* Avatar */}
              <div className="flex items-center justify-center rounded-full text-4xl font-black shrink-0" style={{ width: 120, height: 120, backgroundColor: `${deptColor}25`, color: deptColor, border: `3px solid ${deptColor}50` }}>
                {initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>{name}</h2>
                  {isCurrentUser && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <Star size={8} /> You
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>{staff.job_title || 'Team Member'}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color: '#6B7280' }}>
                  <span className="inline-flex items-center gap-1"><Hash size={12} />{empId}</span>
                  <span className="inline-flex items-center gap-1" style={{ backgroundColor: `${deptColor}20`, color: deptColor, padding: '2px 8px', borderRadius: 12 }}>{staff.department || 'Team'}</span>
                  {staff.start_date && <span className="inline-flex items-center gap-1"><Calendar size={12} />Joined {staff.start_date}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom half — two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">

          {/* Left — Work details */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Work Details</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {[
                ['Employee ID', empId],
                ['Department', staff.department || '—'],
                ['Job Title', staff.job_title || '—'],
                ['Start Date', staff.start_date || '—'],
                ['Email', staff.email || '—'],
                ['Phone', staff.phone || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
                  <span className="text-xs font-medium text-right" style={{ color: '#F9FAFB' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Fun facts */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: '#F9FAFB' }}><Sparkles size={14} style={{ color: '#F59E0B' }} />Fun Facts</p>
              {isCurrentUser && !editing && (
                <button onClick={() => setEditing(true)} className="text-[11px] font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                  Edit my profile
                </button>
              )}
            </div>
            <div className="p-5 space-y-3">
              {FUN_QUESTIONS.map(q => (
                <div key={q.key}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{q.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{q.label}</span>
                  </div>
                  {editing && isCurrentUser ? (
                    <input
                      value={profile[q.key] || ''}
                      onChange={e => setProfile(p => ({ ...p, [q.key]: e.target.value }))}
                      placeholder={`Your ${q.label.toLowerCase()}...`}
                      className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                      style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB' }}
                    />
                  ) : (
                    <p className="text-xs pl-6" style={{ color: profile[q.key] ? '#D1D5DB' : '#4B5563' }}>
                      {profile[q.key] || 'Not set'}
                    </p>
                  )}
                </div>
              ))}
              {editing && (
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>Save</button>
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-xs" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
