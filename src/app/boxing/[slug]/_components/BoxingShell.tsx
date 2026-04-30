'use client'

// Boxing v2 left sidebar — visual upgrade only. activeSection state stays in
// page.tsx so role filtering, view-switching and the existing right-side
// FighterCard column remain untouched. Theme tokens are reused from the
// cricket v2 design system so all sport portals share one v2 look.

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { BOXING_NAV_GROUPS, BOXING_ORG, type BoxingNavGroup } from '../_lib/boxing-dashboard-data'

export type BoxingSidebarProps = {
  T:        ThemeTokens
  accent:   AccentTokens
  active:   string
  onNav:    (id: string) => void
  expanded: boolean
  pinned?:  boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onTogglePin?:  () => void
  // Allow page.tsx to filter the nav (role-based) without forking the data.
  groups?:  BoxingNavGroup[]
  // Brand chip — replaces the H tile when the user has a club logo.
  logoUrl?: string | null
  brandLabel?: string
  // Slots for the role switcher + sign-out / footer that already exist on
  // the page. The sidebar owns spacing; the page owns content.
  footer?:  React.ReactNode
}

export function BoxingSidebar({
  T, accent, active, onNav, expanded, pinned,
  onMouseEnter, onMouseLeave, onTogglePin,
  groups = BOXING_NAV_GROUPS,
  logoUrl, brandLabel, footer,
}: BoxingSidebarProps) {
  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: expanded ? 220 : 72,
        flexShrink: 0,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        overflow: 'hidden',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'width 250ms ease',
      }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', minHeight: 56, borderBottom: `1px solid ${T.border}`, justifyContent: expanded ? 'flex-start' : 'center' }}>
        {logoUrl
          ? // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: accent.hex,
              display: 'grid', placeItems: 'center',
              color: T.btnText, fontWeight: 700, fontSize: 13,
              flexShrink: 0,
            }}>{(brandLabel || BOXING_ORG.fighterShort).split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
        }
        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Lumio</span>
            <span style={{ fontSize: 9.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{brandLabel || BOXING_ORG.fighterShort}</span>
          </div>
        )}
        {expanded && onTogglePin && (
          <button onClick={onTogglePin} title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            style={{ background: 'transparent', border: 0, cursor: 'pointer', color: pinned ? accent.hex : T.text3, padding: 4, transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)', transition: 'transform 200ms, color 200ms' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(grp => {
          if (grp.items.length === 0) return null
          return (
            <div key={grp.g}>
              {expanded && (
                <div style={{ padding: '0 8px 6px', fontSize: 9.5, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', userSelect: 'none' }}>
                  {grp.g}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {grp.items.map(item => {
                  const isActive = active === item.id
                  return (
                    <button key={item.id}
                      onClick={() => onNav(item.id)}
                      title={expanded ? undefined : item.label}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: expanded ? '6px 8px' : '6px 0',
                        borderRadius: 6,
                        background: isActive ? accent.dim : 'transparent',
                        color: isActive ? T.text : T.text2,
                        boxShadow: isActive ? `inset 2px 0 0 ${accent.hex}` : 'none',
                        border: 'none', cursor: 'pointer',
                        textAlign: 'left', width: '100%',
                        justifyContent: expanded ? 'flex-start' : 'center',
                        transition: 'background .12s, color .12s',
                      }}>
                      <Icon name={item.icon || 'dot'} size={13} stroke={1.6}
                        style={{ color: isActive ? accent.hex : T.text3, flexShrink: 0 }} />
                      {expanded && <span style={{ flex: 1, fontSize: 12.5 }}>{item.label}</span>}
                      {expanded && item.badge && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 3,
                          background: accent.hex, color: T.btnText,
                          fontWeight: 700, letterSpacing: '0.04em',
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {footer}
    </aside>
  )
}
