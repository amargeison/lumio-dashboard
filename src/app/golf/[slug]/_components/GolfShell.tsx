'use client'

// Golf v2 sidebar nav — visual layer only. The page.tsx still owns the
// SIDEBAR_ITEMS list (route ids), role-based filtering, RoleSwitcher, plan
// badge, and sign-out button. This shell renders the *navigation list*
// itself with Lucide icons + group headers + NEW badges, replacing the
// emoji-driven v1 list. Phase 2 will lift the right-side player card and
// the rest of the aside chrome into here.

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { GOLF_NAV_GROUPS } from '../_lib/golf-dashboard-data'

export type GolfSidebarItem = { id: string; label: string; icon: string; group: string; badge?: string }

// Build a fast lookup from the v2 nav data so we can map any v1 id to its
// v2 icon + (optional) NEW badge without losing route fidelity.
const V2_LOOKUP: Record<string, { icon: string; group: string; label: string; badge?: string }> = (() => {
  const map: Record<string, { icon: string; group: string; label: string; badge?: string }> = {}
  for (const g of GOLF_NAV_GROUPS) for (const it of g.items) {
    map[it.id] = { icon: it.icon, group: g.g, label: it.label, badge: it.badge }
  }
  return map
})()

// Resolve a v1 SIDEBAR_ITEMS row to v2 presentation. Falls back to v1 label
// + a generic icon when an id doesn't appear in GOLF_NAV_GROUPS — that way
// every route still renders a link, even those not yet grouped in v2.
function resolveItem(it: GolfSidebarItem): GolfSidebarItem {
  const v2 = V2_LOOKUP[it.id]
  if (!v2) return it
  return { id: it.id, label: v2.label, icon: v2.icon, group: v2.group, badge: v2.badge }
}

export function GolfSidebarNav({
  T, accent, items, expanded, activeId, onSelect,
}: {
  T: ThemeTokens
  accent: AccentTokens
  items: GolfSidebarItem[]                // SIDEBAR_ITEMS from page.tsx (already role-filtered)
  expanded: boolean
  activeId: string
  onSelect: (id: string) => void
}) {
  // Resolve each item through the v2 lookup, then group by v2 group order.
  const resolved = items.map(resolveItem)
  const groupOrder: string[] = []
  for (const g of GOLF_NAV_GROUPS) groupOrder.push(g.g)
  // Keep any extras (legacy v1 group names) at the end so nothing gets
  // dropped if the v1 list has ids we haven't grouped yet.
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
