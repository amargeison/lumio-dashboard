'use client'

import { useState } from 'react'
import type { ThemeTokens, AccentTokens, SidebarKey } from '../_lib/theme'
import { FONT, FONT_MONO } from '../_lib/theme'
import { NAV_GROUPS, type NavItem } from '../_lib/data'
import { Icon } from './Icon'

type Common = { T: ThemeTokens; accent: AccentTokens; active: string; onNav: (id: string) => void; dark: boolean }

// ─── Brand mark ────────────────────────────────────────────────────────

function Brand({ T, accent, dark, compact }: { T: ThemeTokens; accent: AccentTokens; dark: boolean; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? 0 : '2px 4px' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: accent.hex, display: 'grid', placeItems: 'center', color: dark ? '#0E1014' : '#fff', fontWeight: 700, fontSize: 13, fontFamily: FONT }}>L</div>
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Lumio</span>
          <span style={{ fontSize: 9.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Oakridge CC</span>
        </div>
      )}
    </div>
  )
}

function SearchBox({ T, onClick }: { T: ThemeTokens; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.panel, color: T.text3, fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: FONT, width: '100%' }}>
      <Icon name="search" size={13} stroke={1.5} />
      <span style={{ flex: 1 }}>Search…</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, padding: '1px 5px', borderRadius: 4, border: `1px solid ${T.border}` }}>⌘K</span>
    </button>
  )
}

function UserChip({ T }: { T: ThemeTokens }) {
  return (
    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: T.panel, border: `1px solid ${T.border}` }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#3a3530,#5a4f44)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600 }}>JW</div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, fontSize: 11 }}>
        <span style={{ color: T.text }}>James Whitlock</span>
        <span style={{ color: T.text3 }}>Director</span>
      </div>
    </div>
  )
}

function NavRow({ T, accent, item, active, onClick }: { T: ThemeTokens; accent: AccentTokens; item: NavItem; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
        borderRadius: 6, color: active ? T.text : (hov ? T.text : T.text2),
        background: active ? accent.dim : (hov ? T.hover : 'transparent'),
        boxShadow: active ? `inset 2px 0 0 ${accent.hex}` : 'none',
        transition: 'background .12s, color .12s',
      }}>
      <Icon name={item.icon || 'dot'} size={13} stroke={1.6} style={{ color: active ? accent.hex : T.text3 }} />
      <span style={{ flex: 1, fontSize: 12.5 }}>{item.label}</span>
      {item.badge && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: accent.hex, color: '#0E1014', fontWeight: 700, letterSpacing: '0.04em' }}>{item.badge}</span>}
    </div>
  )
}

// ─── Full sidebar ─────────────────────────────────────────────────────

function SidebarFull({ T, accent, active, onNav, dark, onSearch }: Common & { onSearch?: () => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (g: string) => setCollapsed(c => ({ ...c, [g]: !c[g] }))
  return (
    <aside style={{ width: 230, flexShrink: 0, borderRight: `1px solid ${T.border}`, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 14, background: T.bg, overflow: 'auto' }}>
      <Brand T={T} accent={accent} dark={dark} />
      <SearchBox T={T} onClick={onSearch} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
        {NAV_GROUPS.map((grp, gi) => {
          const isCol = collapsed[grp.g]
          return (
            <div key={gi}>
              <div onClick={() => toggle(grp.g)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px 6px', fontSize: 9.5, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', userSelect: 'none' }}>
                <span style={{ display: 'inline-block', transform: isCol ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}>
                  <Icon name="chevron-down" size={9} stroke={2} />
                </span>
                <span>{grp.g}</span>
              </div>
              {!isCol && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {grp.items.map(it => <NavRow key={it.id} T={T} accent={accent} item={it} active={active === it.id} onClick={() => onNav(it.id)} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <UserChip T={T} />
    </aside>
  )
}

// ─── Rail sidebar ─────────────────────────────────────────────────────

const RAIL: NavItem[] = [
  { id: 'dashboard',          label: 'Dashboard',     icon: 'home' },
  { id: 'match-centre',       label: 'Match Centre',  icon: 'flag' },
  { id: 'squad',              label: 'Squad',         icon: 'people' },
  { id: 'medical',            label: 'Medical',       icon: 'medical' },
  { id: 'video-analysis',     label: 'Video',         icon: 'play' },
  { id: 'performance-stats',  label: 'Stats',         icon: 'lightning' },
  { id: 'county-championship',label: 'Comps',         icon: 'trophy' },
  { id: 'contract-hub',       label: 'Contracts',     icon: 'briefcase' },
  { id: 'media-hub',          label: 'Media',         icon: 'megaphone' },
  { id: 'operations',         label: 'Operations',    icon: 'wrench' },
]

function RailIcon({ T, accent, item, active, onClick }: { T: ThemeTokens; accent: AccentTokens; item: NavItem; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} title={item.label}
      style={{
        position: 'relative', cursor: 'pointer', width: 38, height: 38, borderRadius: 9,
        display: 'grid', placeItems: 'center',
        color: active ? accent.hex : (hov ? T.text : T.text2),
        background: active ? accent.dim : (hov ? T.hover : 'transparent'),
        transition: 'background .12s, color .12s',
      }}>
      <Icon name={item.icon} size={16} stroke={1.6} />
      {hov && (
        <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8, padding: '4px 8px', borderRadius: 5, background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 11, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          {item.label}
        </div>
      )}
    </div>
  )
}

function SidebarRail({ T, accent, active, onNav, dark }: Common) {
  return (
    <aside style={{ width: 60, flexShrink: 0, borderRight: `1px solid ${T.border}`, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: T.bg }}>
      <Brand T={T} accent={accent} dark={dark} compact />
      <div style={{ height: 8 }} />
      {RAIL.map(it => <RailIcon key={it.id} T={T} accent={accent} item={it} active={active === it.id} onClick={() => onNav(it.id)} />)}
      <div style={{ marginTop: 'auto', width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#3a3530,#5a4f44)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>JW</div>
    </aside>
  )
}

// ─── Hybrid sidebar ───────────────────────────────────────────────────

const PINNED: NavItem[] = [
  { id: 'dashboard',      label: 'Dashboard',    icon: 'home' },
  { id: 'match-centre',   label: 'Match Centre', icon: 'flag' },
  { id: 'squad',          label: 'Squad',        icon: 'people' },
  { id: 'medical',        label: 'Medical',      icon: 'medical' },
  { id: 'video-analysis', label: 'Video',        icon: 'play' },
  { id: 'contract-hub',   label: 'Contracts',    icon: 'briefcase' },
]

function SidebarHybrid({ T, accent, active, onNav, dark, onSearch }: Common & { onSearch?: () => void }) {
  return (
    <aside style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${T.border}`, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 14, background: T.bg, overflow: 'auto' }}>
      <Brand T={T} accent={accent} dark={dark} />
      <SearchBox T={T} onClick={onSearch} />
      <div>
        <div style={{ padding: '0 8px 6px', fontSize: 9.5, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="pin" size={9} stroke={2} /> Pinned
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {PINNED.map(it => <NavRow key={it.id} T={T} accent={accent} item={it} active={active === it.id} onClick={() => onNav(it.id)} />)}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <div style={{ padding: '0 8px 6px', fontSize: 9.5, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>All sections</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_GROUPS.flatMap(g => g.items).slice(0, 12).map(it => <NavRow key={it.id} T={T} accent={accent} item={it} active={active === it.id} onClick={() => onNav(it.id)} />)}
        </div>
      </div>
      <UserChip T={T} />
    </aside>
  )
}

export function Sidebar({ T, accent, style, active, onNav, dark, onSearch }: Common & { style: SidebarKey; onSearch?: () => void }) {
  if (style === 'rail')   return <SidebarRail   T={T} accent={accent} active={active} onNav={onNav} dark={dark} />
  if (style === 'hybrid') return <SidebarHybrid T={T} accent={accent} active={active} onNav={onNav} dark={dark} onSearch={onSearch} />
  return <SidebarFull T={T} accent={accent} active={active} onNav={onNav} dark={dark} onSearch={onSearch} />
}

// ─── Topbar ───────────────────────────────────────────────────────────

export function Topbar({ T, accent, onCmdK, onAsk }: { T: ThemeTokens; accent: AccentTokens; onCmdK: () => void; onAsk: () => void }) {
  const [bell, setBell] = useState(true)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', marginBottom: 6, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text3 }}>
        <span>Today</span>
        <Icon name="chevron-right" size={11} />
        <span style={{ color: T.text }}>Dashboard</span>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onCmdK} style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.panel, color: T.text3, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
          <Icon name="search" size={12} stroke={1.6} />
          <span>Search · jump · ask…</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, padding: '1px 5px', borderRadius: 4, border: `1px solid ${T.border}` }}>⌘K</span>
        </button>
        <button onClick={onAsk} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: accent.dim, color: accent.hex, padding: '6px 10px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Icon name="sparkles" size={12} stroke={1.8} /> Ask Lumio
        </button>
        <div title="Live" style={{ fontSize: 11, color: T.good, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.good, animation: 'cricketV2PulseDim 2s infinite' }} /> LIVE
        </div>
        <button onClick={() => setBell(b => !b)} style={{ position: 'relative', appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, padding: '6px 9px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
          <Icon name="bell" size={13} />
          {bell && <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: T.bad }} />}
        </button>
        <button style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, padding: '6px 10px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <Icon name="plus" size={12} /> Quick add
        </button>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3a3530,#5a4f44)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>JW</div>
      </div>
    </div>
  )
}
