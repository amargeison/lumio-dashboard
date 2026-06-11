'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { BOOKS, COACH_ORG, type Book } from '../_lib/coach-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}

export function BooksPanel({ T, accent, density }: Common) {
  const topics = ['All', 'Mental', 'Tactics', 'Development', 'Memoir'] as const
  const [topic, setTopic] = useState<typeof topics[number]>('All')
  const [recommended, setRecommended] = useState<Set<string>>(new Set())
  const list = topic === 'All' ? BOOKS : BOOKS.filter(b => b.topic === topic)

  const toggle = (id: string) => setRecommended(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const topicColour = (t: Book['topic']) => t === 'Mental' ? accent.hex : t === 'Tactics' ? '#3A8EE0' : t === 'Development' ? T.good : t === 'Memoir' ? T.warn : T.text2

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: density.gap, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, color: T.text2 }}>
          {COACH_ORG.coachShort}’s recommended reading for players &amp; parents
          {recommended.size > 0 && <span style={{ color: accent.hex, fontWeight: 600 }}> · {recommended.size} recommended</span>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {topics.map(t => <button key={t} onClick={() => setTopic(t)} style={{ appearance: 'none', border: `1px solid ${topic === t ? accent.border : T.border}`, padding: '5px 11px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: topic === t ? accent.dim : 'transparent', color: topic === t ? accent.hex : T.text2, fontWeight: topic === t ? 600 : 400 }}>{t}</button>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: density.gap }} className="cm-books">
        {list.map(b => {
          const on = recommended.has(b.id)
          return (
            <Card key={b.id} T={T} density={density} style={on ? { borderColor: accent.border } : undefined}>
              <div style={{ display: 'flex', gap: 14 }}>
                {/* book cover */}
                <div style={{ width: 64, height: 92, borderRadius: '3px 6px 6px 3px', flexShrink: 0, background: `linear-gradient(135deg, ${b.spine}, ${b.spine}cc)`, boxShadow: '0 4px 12px -4px rgba(0,0,0,0.5)', borderLeft: `4px solid rgba(0,0,0,0.25)`, padding: '8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.95)', fontWeight: 700, lineHeight: 1.15 }}>{b.title}</div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)' }}>{b.author.split(' ').slice(-1)[0]}</div>
                </div>
                {/* details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, lineHeight: 1.25 }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>{b.author} · {b.year}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: `${topicColour(b.topic)}1f`, color: topicColour(b.topic), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.topic}</span>
                    <span style={{ fontSize: 10, color: T.text3 }}>{b.audience}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: T.text2, marginTop: 10, lineHeight: 1.5, fontStyle: 'italic' }}>“{b.why}”</div>
              <button onClick={() => toggle(b.id)}
                style={{ marginTop: 12, width: '100%', appearance: 'none', border: on ? `1px solid ${accent.border}` : `1px solid ${T.border}`, padding: '7px 12px', borderRadius: 9, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Icon name={on ? 'check' : 'plus'} size={13} stroke={2} /> {on ? 'Recommended to player' : 'Recommend to player'}
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
