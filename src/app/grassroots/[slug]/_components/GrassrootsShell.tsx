'use client'

// Grassroots v2 sidebar nav. Visual layer only — page.tsx still owns the
// SIDEBAR_ITEMS list (route ids), role filtering, RoleSwitcher, and the
// brand header / footer chrome. This shell renders the nav list with
// Lucide icons + group headers + NEW badges. Falls back gracefully for
// any v1 id not yet mapped.

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { GRASSROOTS_NAV_GROUPS } from '../_lib/grassroots-dashboard-data'

export type GrassrootsSidebarItem = { id: string; label: string; group?: string; icon?: string; badge?: string }

const V2_LOOKUP: Record<string, { icon: string; group: string; label: string; badge?: string }> = (() => {
  const map: Record<string, { icon: string; group: string; label: string; badge?: string }> = {}
  for (const g of GRASSROOTS_NAV_GROUPS) for (const it of g.items) {
    map[it.id] = { icon: it.icon, group: g.g, label: it.label, badge: it.badge }
  }
  return map
})()

function resolveItem(it: GrassrootsSidebarItem): { id: string; label: string; icon: string; group: string; badge?: string } {
  const v2 = V2_LOOKUP[it.id]
  if (v2) return { id: it.id, label: v2.label, icon: v2.icon, group: v2.group, badge: v2.badge }
  return {
    id: it.id,
    label: it.label,
    icon: it.icon ?? 'dot',
    group: it.group ?? 'More',
    badge: it.badge,
  }
}

export function GrassrootsSidebarNav({
  T, accent, items, expanded, activeId, onSelect,
}: {
  T: ThemeTokens
  accent: AccentTokens
  items: GrassrootsSidebarItem[]   // SIDEBAR_ITEMS from page.tsx (already role-filtered)
  expanded: boolean
  activeId: string
  onSelect: (id: string) => void
}) {
  const resolved = items.map(resolveItem)
  const groupOrder: string[] = []
  for (const g of GRASSROOTS_NAV_GROUPS) groupOrder.push(g.g)
  for (const r of resolved) if (!groupOrder.includes(r.group)) groupOrder.push(r.group)

  return (
    <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
      {groupOrder.map(group => {
        const groupItems = resolved.filter(r => r.group === group)
        if (groupItems.length === 0) return null
        return (
          <div key={group} style={{ marginBottom: 12 }}>
            {expanded && (
              <div style={{
                fontSize: 9, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.text3, padding: '4px 8px', marginBottom: 2,
              }}>{group}</div>
            )}
            {groupItems.map(item => {
              const active = activeId === item.id
              return (
                <button key={item.id}
                  onClick={() => onSelect(item.id)}
                  title={expanded ? undefined : item.label}
                  style={{
                    appearance: 'none', border: 0, width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: expanded ? '7px 10px' : '7px 0',
                    margin: '0 0 1px 0', borderRadius: 7, textAlign: 'left',
                    background: active ? `${accent.hex}14` : 'transparent',
                    color: active ? '#fff' : T.text3,
                    borderLeft: active ? `2px solid ${accent.hex}` : '2px solid transparent',
                    cursor: 'pointer',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    transition: 'background-color .12s, color .12s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text2 }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.text3 }}>
                  <Icon name={item.icon || 'dot'} size={13} stroke={1.6}
                    style={{ color: active ? accent.hex : T.text3, flexShrink: 0 }} />
                  {expanded && (
                    <>
                      <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em',
                          padding: '1px 5px', borderRadius: 3,
                          background: accent.hex, color: '#fff',
                        }}>{item.badge}</span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
