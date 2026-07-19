'use client'

// HQ Social media tab — mapped from the tennis "Media & Content" module,
// re-themed for Ten Project. Compose panel's "Generate with AI" is live
// (cycles canned captions); scheduling adds to the queue in-session.

import React, { useState } from 'react'
import { Instagram, Facebook, Youtube, Twitter, Sparkles, CalendarClock, Send } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import { TP_RED, TP_DARK, SOCIAL_STATS, SOCIAL_QUEUE, SOCIAL_AI_CAPTIONS } from '@/data/tenproject/demo-data'

const PLATFORM_ICON: Record<string, React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>> = {
  Instagram, Facebook, YouTube: Youtube, 'X / Twitter': Twitter,
}

const STATUS_TONE: Record<string, 'green' | 'amber' | 'grey'> = {
  scheduled: 'green', draft: 'grey', 'needs approval': 'amber',
}

export default function SocialTab() {
  const [queue, setQueue] = useState(SOCIAL_QUEUE)
  const [platforms, setPlatforms] = useState<string[]>(['IG'])
  const [caption, setCaption] = useState('')
  const [aiIdx, setAiIdx] = useState(0)
  const [when, setWhen] = useState('Today 17:00')

  function generate() {
    setCaption(SOCIAL_AI_CAPTIONS[aiIdx % SOCIAL_AI_CAPTIONS.length])
    setAiIdx(i => i + 1)
  }

  function schedule() {
    if (!caption.trim()) return
    setQueue(prev => [{ id: `new-${Date.now()}`, when, platform: platforms[0] ?? 'IG', status: 'scheduled', text: caption.trim(), media: false }, ...prev])
    setCaption('')
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle sub="One place for every channel — post to all of them, with family consent checked before anything goes out">Social media</SectionTitle>

      {/* Follower tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {SOCIAL_STATS.map(s => {
          const Icon = PLATFORM_ICON[s.platform] ?? Instagram
          return (
            <Card key={s.platform} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: TP_DARK }}>{s.followers}</div>
                <Icon size={18} style={{ color: TP_RED }} />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK, marginTop: 2 }}>{s.platform} <span style={{ color: '#8A847E', fontWeight: 600 }}>{s.handle}</span></div>
              <div style={{ fontSize: 10.5, color: '#187A3C', fontWeight: 700, marginTop: 3 }}>▲ {s.delta}</div>
            </Card>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {([
          [String(queue.filter(q => q.status === 'scheduled').length), 'SCHEDULED THIS WEEK'],
          [String(queue.filter(q => q.status === 'draft').length), 'DRAFTS'],
          [String(queue.filter(q => q.status === 'needs approval').length), 'PENDING APPROVAL'],
          ['38K', 'REACH (LAST 7 DAYS)'],
          ['#tenproject', 'COMPETITION TAG'],
        ] as [string, string][]).map(([v, l]) => (
          <Card key={l} style={{ padding: '13px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: TP_RED, marginTop: 3 }}>{v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        {/* Queue */}
        <Card>
          <SectionTitle sub="What’s going out — approve, edit or pull anything before it posts">
            <CalendarClock size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Post queue
          </SectionTitle>
          <div style={{ display: 'grid', gap: 8 }}>
            {queue.map(q => (
              <div key={q.id} style={{ background: '#F7F5F2', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK }}>
                    <Pill tone="dark">{q.platform}</Pill>&nbsp; {q.when} {q.media && '· 📷'}
                  </div>
                  <Pill tone={STATUS_TONE[q.status]}>{q.status.toUpperCase()}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: '#33302C', lineHeight: 1.5 }}>{q.text}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10 }}>
            Photos of children only ever post where the family’s photo-consent flag is green — checked automatically.
          </div>
        </Card>

        {/* Compose */}
        <Card>
          <SectionTitle sub="Write once, post everywhere">Compose</SectionTitle>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, marginBottom: 5 }}>PLATFORMS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {['IG', 'FB', 'X', 'YT'].map(p => (
              <button key={p} onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                style={{ background: platforms.includes(p) ? TP_RED : '#F7F5F2', color: platforms.includes(p) ? '#fff' : TP_DARK, border: 'none', borderRadius: 8, padding: '7px 13px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={generate} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', marginBottom: 10 }}>
            <Sparkles size={14} /> Generate with AI
          </button>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5} placeholder="Caption — or generate one above"
            style={{ width: '100%', border: '1px solid #E7E2DC', borderRadius: 10, padding: '11px 13px', fontSize: 12.5, outline: 'none', background: '#F7F5F2', resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <select value={when} onChange={e => setWhen(e.target.value)} style={{ flex: 1, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 11px', fontSize: 12, background: '#F7F5F2', outline: 'none' }}>
              {['Today 17:00', 'Tomorrow 09:00', 'Sat 15:30', 'Sun 18:00'].map(w => <option key={w}>{w}</option>)}
            </select>
            <button onClick={schedule} disabled={!caption.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: caption.trim() ? TP_RED : '#D9D3CC', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 900, cursor: caption.trim() ? 'pointer' : 'not-allowed' }}>
              <Send size={13} /> Schedule
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
