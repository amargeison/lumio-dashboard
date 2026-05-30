'use client'

// JuniorActivityRow — single activity event row. Compact, single-line
// visual: category icon + label + detail + actor + timestamp. Sits
// alongside JuniorBroadcastCard in the combined feed.

import {
  UserCheck,
  UserPlus,
  Truck,
  ShieldCheck,
  Trophy,
  HeartHandshake,
  Award,
  type LucideIcon,
} from 'lucide-react'
import {
  formatRelativeTime,
  type JuniorActivityEvent,
  type JuniorActivityCategory,
} from '../_lib/junior-noticeboard-data'

const C = {
  panel:      '#0D1117',
  border:     '#1F2937',
  text:       '#F9FAFB',
  text2:      'rgba(255,255,255,0.85)',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
} as const

interface Props {
  event: JuniorActivityEvent
  isUnread?: boolean
}

interface CategoryStyle {
  icon: LucideIcon
  label: string
  color: string
}

const CATEGORY: Record<JuniorActivityCategory, CategoryStyle> = {
  availability:   { icon: UserCheck,     label: 'AVAILABILITY',   color: '#22C55E' },
  registration:   { icon: UserPlus,      label: 'REGISTRATION',   color: '#60A5FA' },
  logistics:      { icon: Truck,         label: 'LOGISTICS',      color: '#94A3B8' },
  compliance:     { icon: ShieldCheck,   label: 'COMPLIANCE',     color: '#F59E0B' },
  match_outcome:  { icon: Trophy,        label: 'MATCH RESULT',   color: '#FBBF24' },
  welfare:        { icon: HeartHandshake,label: 'WELFARE',        color: '#F472B6' },
  achievement:    { icon: Award,         label: 'ACHIEVEMENT',    color: '#FBBF24' },
}

export default function JuniorActivityRow({ event, isUnread = false }: Props) {
  const cat = CATEGORY[event.category]
  const Icon = cat.icon

  return (
    <div
      className="rounded-lg px-4 py-3 flex items-start gap-3"
      style={{
        backgroundColor: C.panel,
        border: `1px solid ${C.border}`,
        borderLeft: isUnread ? `3px solid ${C.accent}` : `3px solid transparent`,
      }}
    >
      {/* Icon */}
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{
          backgroundColor: `${cat.color}26`,
          border: `1px solid ${cat.color}55`,
        }}
      >
        <Icon size={13} style={{ color: cat.color }} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div
          className="text-[9px] font-semibold mb-0.5"
          style={{ color: cat.color, letterSpacing: '0.08em' }}
        >
          {cat.label}
        </div>
        <div className="text-sm leading-snug" style={{ color: C.text2 }}>
          {event.title}
        </div>
        {event.detail && (
          <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>
            {event.detail}
          </div>
        )}
        {event.actorName && (
          <div className="text-[10px] mt-1" style={{ color: C.text4 }}>
            by {event.actorName}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-[10px] mt-1" style={{ color: C.text4 }}>
        {formatRelativeTime(event.timestamp)}
      </div>
    </div>
  )
}
