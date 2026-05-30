'use client'

// JuniorBroadcastCard — single broadcast post render. Author header,
// title, body, audience pill, pinned chip, reactions row (read-only
// counts in Commit 3 — interactive toggle wired in Commit 4).
//
// Visual: full-width card on the Noticeboard column. Left-edge accent
// stripe applied externally via parent (Commit 5 unread tracking).

import { Lock } from 'lucide-react'
import {
  formatRelativeTime,
  type JuniorBroadcast,
  type JuniorBroadcastAuthorRole,
  type JuniorReaction,
  type JuniorReactionType,
} from '../_lib/junior-noticeboard-data'

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      'rgba(255,255,255,0.85)',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentLight:'#22C55E',
  accentDim:  'rgba(22,163,74,0.15)',
  accent55:   'rgba(22,163,74,0.55)',
  amber:      '#F59E0B',
  amberDim:   'rgba(245,158,11,0.15)',
  amber55:    'rgba(245,158,11,0.55)',
  purple:     '#A78BFA',
  purpleDim:  'rgba(167,139,250,0.15)',
  purple55:   'rgba(167,139,250,0.55)',
} as const

interface Props {
  broadcast: JuniorBroadcast
  isUnread?: boolean  // Commit 5 wires this
  // Commit 4 will wire these — kept optional for Commit 3 forward-compat:
  reactions?: JuniorReaction[]  // overlay map state from parent (defaults to broadcast.reactions)
  userId?: string
  onReact?: (type: JuniorReactionType) => void
}

const ROLE_LABEL: Record<JuniorBroadcastAuthorRole, string> = {
  'chair':            'Chair',
  'welfare_officer':  'Welfare Officer',
  'coach':            'Coach',
  'team_manager':     'Team Manager',
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function JuniorBroadcastCard({
  broadcast,
  isUnread = false,
  reactions,
  userId,
  onReact,
}: Props) {
  const r = reactions ?? broadcast.reactions
  const counts = {
    acknowledged: r.filter(x => x.type === 'acknowledged').length,
    done:         r.filter(x => x.type === 'done').length,
    seen:         r.filter(x => x.type === 'seen').length,
  }
  const myReaction = userId
    ? r.find(x => x.userId === userId)?.type
    : undefined
  const canReact = Boolean(userId && onReact)

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: C.panel,
        border: `1px solid ${C.border}`,
        borderLeft: isUnread ? `3px solid ${C.accent}` : `3px solid transparent`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Top row — author + audience pill + pinned chip */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Initials avatar */}
          <div
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{
              backgroundColor: C.accentDim,
              color: C.accentLight,
              border: `1px solid ${C.accent55}`,
            }}
          >
            {initialsOf(broadcast.author.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: C.text }}>
              {broadcast.author.name}
            </div>
            <div className="text-[10px]" style={{ color: C.text4 }}>
              {ROLE_LABEL[broadcast.author.role]}
            </div>
          </div>
        </div>

        {/* Audience pill + pinned chip */}
        <div className="flex items-center gap-1.5 shrink-0">
          <AudiencePill broadcast={broadcast} />
          {broadcast.pinned && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
              style={{
                backgroundColor: C.accentDim,
                color: C.accentLight,
                border: `1px solid ${C.accent55}`,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              📌 PINNED
            </span>
          )}
        </div>
      </div>

      {/* Title + body */}
      <h3 className="text-base font-bold mb-1.5" style={{ color: C.text }}>
        {broadcast.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: C.text2 }}>
        {broadcast.body}
      </p>

      {/* Reactions row + timestamp */}
      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-center gap-1.5">
          <ReactionButton
            type="acknowledged" emoji="👍" title="Acknowledged"
            count={counts.acknowledged} active={myReaction === 'acknowledged'}
            canReact={canReact} onClick={() => onReact?.('acknowledged')}
          />
          <ReactionButton
            type="done" emoji="✅" title="Done"
            count={counts.done} active={myReaction === 'done'}
            canReact={canReact} onClick={() => onReact?.('done')}
          />
          <ReactionButton
            type="seen" emoji="👀" title="Seen"
            count={counts.seen} active={myReaction === 'seen'}
            canReact={canReact} onClick={() => onReact?.('seen')}
          />
        </div>
        <div className="text-[10px]" style={{ color: C.text4 }}>
          {formatRelativeTime(broadcast.timestamp)}
        </div>
      </div>
    </div>
  )
}

// ─── Reaction button ─────────────────────────────────────────────────

function ReactionButton({
  emoji, title, count, active, canReact, onClick,
}: {
  type: JuniorReactionType
  emoji: string
  title: string
  count: number
  active: boolean
  canReact: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canReact}
      title={title}
      className="px-2 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 transition-all"
      style={{
        backgroundColor: active ? C.accentDim : 'transparent',
        color: active ? C.accentLight : C.text4,
        border: `1px solid ${active ? C.accent55 : 'transparent'}`,
        cursor: canReact ? 'pointer' : 'default',
      }}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  )
}

// ─── Audience pill ────────────────────────────────────────────────────

function AudiencePill({ broadcast }: { broadcast: JuniorBroadcast }) {
  if (broadcast.audience === 'club_wide') {
    return (
      <span
        className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: C.accentDim,
          color: C.accentLight,
          border: `1px solid ${C.accent55}`,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Club-wide
      </span>
    )
  }
  if (broadcast.audience === 'staff_only') {
    return (
      <span
        className="text-[9px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
        style={{
          backgroundColor: C.amberDim,
          color: C.amber,
          border: `1px solid ${C.amber55}`,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <Lock size={9} />
        Staff only
      </span>
    )
  }
  return (
    <span
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: C.purpleDim,
        color: C.purple,
        border: `1px solid ${C.purple55}`,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {broadcast.ageBand} only
    </span>
  )
}
