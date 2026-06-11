'use client'

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { BELTS, type Resource } from '../_lib/coach-data'

export function VideoModal({ T, accent, resource, onClose }: { T: ThemeTokens; accent: AccentTokens; resource: Resource; onClose: () => void }) {
  const belt = resource.belt ? BELTS.find(b => b.id === resource.belt) : undefined
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 880, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}>
            <Icon name="play" size={16} stroke={1.7} style={{ color: accent.hex }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{resource.title}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>
              {resource.category} · {resource.duration}
              {belt && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}><span style={{ width: 12, height: 8, borderRadius: 2, background: belt.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{belt.name}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {/* 16:9 player */}
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${resource.video}?rel=0&modestbranding=1`}
            title={resource.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11.5, color: T.text2, flex: 1, minWidth: 160 }}>{resource.desc}</div>
          <span style={{ fontSize: 9.5, color: T.text3, fontFamily: FONT_MONO }}>via YouTube</span>
          <a href={`https://www.youtube.com/watch?v=${resource.video}`} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', appearance: 'none', padding: '7px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600 }}>
            Open on YouTube ↗
          </a>
        </div>
      </div>
    </div>
  )
}
