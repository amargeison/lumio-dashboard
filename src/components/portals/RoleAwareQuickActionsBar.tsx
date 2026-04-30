'use client'

import type { QuickAction } from '@/data/football/role-quick-actions'
import {
  FOOTBALL_ROLE_QUICK_ACTIONS,
  FOOTBALL_GENERIC_ACTIONS,
} from '@/data/football/role-quick-actions'
import {
  CRICKET_ROLE_QUICK_ACTIONS,
  CRICKET_GENERIC_ACTIONS,
} from '@/data/cricket/role-quick-actions'
import {
  WOMENS_ROLE_QUICK_ACTIONS,
  WOMENS_GENERIC_ACTIONS,
} from '@/data/womens/role-quick-actions'

type Sport = 'football' | 'cricket' | 'womens'

type Props = {
  sport: Sport
  role: string
  onNavigate: (deptId: string) => void
  onAction?: (modalId: string) => void
  accentHex?: string
}

const COUNT = 6

function lookup(sport: Sport, role: string): QuickAction[] {
  const map = sport === 'football' ? FOOTBALL_ROLE_QUICK_ACTIONS
            : sport === 'cricket'  ? CRICKET_ROLE_QUICK_ACTIONS
            : WOMENS_ROLE_QUICK_ACTIONS
  const generic = sport === 'football' ? FOOTBALL_GENERIC_ACTIONS
                : sport === 'cricket'  ? CRICKET_GENERIC_ACTIONS
                : WOMENS_GENERIC_ACTIONS
  const roleSet = map[role]
  if (!roleSet || roleSet.length === 0) return generic.slice(0, COUNT)
  if (roleSet.length >= COUNT) return roleSet.slice(0, COUNT)
  // Pad with generic to always reach 6
  const seen = new Set(roleSet.map(a => a.id))
  const padding = generic.filter(a => !seen.has(a.id)).slice(0, COUNT - roleSet.length)
  return [...roleSet, ...padding]
}

export default function RoleAwareQuickActionsBar({
  sport, role, onNavigate, onAction, accentHex = '#003DA5',
}: Props) {
  const actions = lookup(sport, role)

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {actions.map(a => (
        <button
          key={a.id}
          onClick={() => {
            if (a.targetDept) onNavigate(a.targetDept)
            else if (a.modalId && onAction) onAction(a.modalId)
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentHex; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3139'; e.currentTarget.style.color = '#9CA3AF' }}
          style={{
            appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            background: 'transparent', border: '1px solid #2d3139',
            color: '#9CA3AF', fontSize: 12, cursor: 'pointer',
            transition: 'border-color .12s, color .12s', whiteSpace: 'nowrap',
          }}
        >
          <a.icon size={13} />
          <span>{a.label}</span>
          {a.badge != null && (
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3,
              background: accentHex, color: '#fff', fontWeight: 700, marginLeft: 2,
            }}>{a.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
