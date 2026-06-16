'use client'

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import type { Resource } from '../_lib/coach-data'
import { addResource } from '../_lib/resources-store'

const CATEGORIES: Resource['category'][] = ['Drill', 'Technique', 'Training plan', 'Fitness', 'Mental']
const LEVELS: Resource['level'][] = ['Beginner', 'Intermediate', 'Advanced', 'All levels']
const FORMATS: Resource['format'][] = ['Video', 'PDF', 'Plan', 'Worksheet']

export function AddResourceModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Resource['category']>('Drill')
  const [level, setLevel] = useState<Resource['level']>('All levels')
  const [format, setFormat] = useState<Resource['format']>('Video')
  const [duration, setDuration] = useState('')
  const [tags, setTags] = useState('')
  const [desc, setDesc] = useState('')
  const [video, setVideo] = useState('')

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const label: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const canSave = title.trim().length > 0
  const save = () => {
    if (!canSave) return
    const resource: Resource = {
      id: `res-${Date.now()}`,
      title: title.trim(),
      category,
      level,
      format,
      duration: duration.trim() || '—',
      tags: tags.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean),
      desc: desc.trim() || 'Added resource.',
      video: format === 'Video' && video.trim() ? video.trim() : undefined,
    }
    addResource(resource)
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="grid" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>Add resource</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Slice backhand progression" style={input} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as Resource['category'])} style={input}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div>
              <label style={label}>Level</label>
              <select value={level} onChange={e => setLevel(e.target.value as Resource['level'])} style={input}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Format</label>
              <select value={format} onChange={e => setFormat(e.target.value as Resource['format'])} style={input}>{FORMATS.map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            <div>
              <label style={label}>Duration</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="6 min / 8 weeks" style={input} />
            </div>
          </div>
          {format === 'Video' && (
            <div>
              <label style={label}>YouTube video id (optional)</label>
              <input value={video} onChange={e => setVideo(e.target.value)} placeholder="e.g. dQw4w9WgXcQ" style={input} />
              <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>Just the id — it embeds an in-app player on the card.</div>
            </div>
          )}
          <div>
            <label style={label}>Tags (comma-separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="backhand, slice" style={input} />
          </div>
          <div>
            <label style={label}>Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="One line on what it covers" style={input} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '10px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={14} stroke={2} /> Add resource
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '10px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
