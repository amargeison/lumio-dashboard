'use client'

// HQ Social media — mapped from the tennis "Media & Content" module and built
// out into a full scheduler/analytics suite (a Later/Hootsuite replacement),
// re-themed for Ten Project. Queue, Compose and Published are sub-tabs.

import React, { useState } from 'react'
import { Instagram, Facebook, Youtube, Twitter, Sparkles, CalendarClock, Send, Image as ImageIcon, Video, Layers, Clock, Heart, MessageCircle, Share2, Bookmark, Eye, TrendingUp, CheckCircle, Hash } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import {
  TP_RED, TP_DARK, SOCIAL_STATS, SOCIAL_QUEUE, SOCIAL_PUBLISHED, SOCIAL_AI_CAPTIONS,
  SOCIAL_GROWTH, SOCIAL_BEST_TIMES, SOCIAL_HASHTAGS, type SocialPost,
} from '@/data/tenproject/demo-data'

const PLATFORM_ICON: Record<string, React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>> = {
  Instagram, Facebook, YouTube: Youtube, 'X / Twitter': Twitter, IG: Instagram, FB: Facebook, YT: Youtube, X: Twitter,
}
const STATUS_TONE: Record<string, 'green' | 'amber' | 'grey'> = { scheduled: 'green', draft: 'grey', 'needs approval': 'amber' }

// A faux media thumbnail — coloured gradient + type icon, so the feed "looks live"
function Thumb({ media, hue, size = 60 }: { media: string; hue: number; size?: number }) {
  if (media === 'none') return null
  const Icon = media === 'video' ? Video : media === 'carousel' ? Layers : ImageIcon
  return (
    <div style={{ width: size, height: size, borderRadius: 9, flexShrink: 0, background: `linear-gradient(135deg, hsl(${hue} 55% 62%), hsl(${(hue + 40) % 360} 60% 48%))`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #ffffff10 0 6px, transparent 6px 12px)' }} />
      <Icon size={size * 0.32} style={{ color: '#fff', opacity: 0.95, zIndex: 1 }} />
      {media === 'video' && <div style={{ position: 'absolute', bottom: 4, right: 5, background: '#00000088', color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: 4, padding: '1px 4px', zIndex: 1 }}>0:45</div>}
      {media === 'carousel' && <div style={{ position: 'absolute', top: 4, right: 5, background: '#00000088', color: '#fff', fontSize: 8, fontWeight: 800, borderRadius: 4, padding: '1px 4px', zIndex: 1 }}>1/4</div>}
    </div>
  )
}

type SubTab = 'queue' | 'compose' | 'published'

export default function SocialTab() {
  const [sub, setSub] = useState<SubTab>('queue')
  const [queue, setQueue] = useState<SocialPost[]>(SOCIAL_QUEUE)
  const [platforms, setPlatforms] = useState<string[]>(['IG'])
  const [caption, setCaption] = useState('')
  const [aiIdx, setAiIdx] = useState(0)
  const [when, setWhen] = useState('Today 17:00')
  const [media, setMedia] = useState<'photo' | 'video' | 'carousel' | 'none'>('photo')
  const [tags, setTags] = useState<string[]>(['#tenproject', '#LearnPlayTogether'])

  function generate() { setCaption(SOCIAL_AI_CAPTIONS[aiIdx % SOCIAL_AI_CAPTIONS.length]); setAiIdx(i => i + 1) }
  function schedule() {
    if (!caption.trim()) return
    setQueue(prev => [{ id: `new-${Date.now()}`, when, platform: (platforms[0] as SocialPost['platform']) ?? 'IG', status: 'scheduled', text: caption.trim() + (tags.length ? ' ' + tags.join(' ') : ''), media, hue: 8 }, ...prev])
    setCaption(''); setSub('queue')
  }

  const maxG = Math.max(...SOCIAL_GROWTH.map(g => g.n)), minG = Math.min(...SOCIAL_GROWTH.map(g => g.n))
  const gpts = SOCIAL_GROWTH.map((g, i) => `${(i / (SOCIAL_GROWTH.length - 1)) * 300},${70 - ((g.n - minG) / (maxG - minG)) * 60}`).join(' ')

  const SUBTABS: { id: SubTab; label: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }[] = [
    { id: 'queue', label: 'Queue', icon: CalendarClock },
    { id: 'compose', label: 'Compose', icon: Sparkles },
    { id: 'published', label: 'Published & analytics', icon: TrendingUp },
  ]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Sub-tabs + accounts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUBTABS.map(t => {
            const Icon = t.icon; const active = sub === t.id
            return (
              <button key={t.id} onClick={() => setSub(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: active ? TP_DARK : '#fff', color: active ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                <Icon size={14} /> {t.label}
              </button>
            )
          })}
        </div>
        <button onClick={() => setSub('compose')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
          <Send size={14} /> New post
        </button>
      </div>

      {/* Follower tiles — account overview, shown on every tab */}
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

      {/* ── QUEUE ── */}
      {sub === 'queue' && (<>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {([[String(queue.filter(q => q.status === 'scheduled').length), 'SCHEDULED'], [String(queue.filter(q => q.status === 'draft').length), 'DRAFTS'], [String(queue.filter(q => q.status === 'needs approval').length), 'NEEDS APPROVAL'], ['38K', 'REACH (7 DAYS)'], ['#tenproject', 'CAMPAIGN TAG']] as [string, string][]).map(([v, l]) => (
            <Card key={l} style={{ padding: '13px 16px' }}><div style={{ fontSize: 10, fontWeight: 800, color: '#8A847E', letterSpacing: 0.8 }}>{l}</div><div style={{ fontSize: 19, fontWeight: 900, color: TP_RED, marginTop: 3 }}>{v}</div></Card>
          ))}
        </div>
        <Card>
          <SectionTitle sub="Everything booked in — with the media, ready to approve, edit or pull before it posts">
            <CalendarClock size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Post queue
          </SectionTitle>
          <div style={{ display: 'grid', gap: 9 }}>
            {queue.map(q => {
              const PIcon = PLATFORM_ICON[q.platform] ?? Instagram
              return (
                <div key={q.id} style={{ display: 'flex', gap: 12, background: '#F7F5F2', borderRadius: 11, padding: '11px 13px', alignItems: 'flex-start' }}>
                  <Thumb media={q.media} hue={q.hue} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK }}>
                        <PIcon size={12} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />{q.platform} · {q.when} · <span style={{ color: '#8A847E', fontWeight: 700 }}>{q.media === 'none' ? 'text' : q.media}</span>
                      </div>
                      <Pill tone={STATUS_TONE[q.status]}>{q.status.toUpperCase()}</Pill>
                    </div>
                    <div style={{ fontSize: 12, color: '#33302C', lineHeight: 1.5 }}>{q.text}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {q.status === 'needs approval' && <button style={{ background: '#187A3C', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>Approve</button>}
                      <button onClick={() => { setCaption(q.text); setSub('compose') }} style={{ background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 7, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => setQueue(prev => prev.filter(x => x.id !== q.id))} style={{ background: '#fff', color: TP_RED, border: '1px solid #E7E2DC', borderRadius: 7, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}>Pull</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: '#8A847E', marginTop: 10 }}>
            Photos of children only post where the family’s photo-consent flag is green — checked automatically before anything goes out.
          </div>
        </Card>
      </>)}

      {/* ── COMPOSE ── */}
      {sub === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="Write once, post to every channel — with AI, hashtags and best-time built in">Compose</SectionTitle>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, marginBottom: 5 }}>PLATFORMS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {['IG', 'FB', 'X', 'YT'].map(p => (
                <button key={p} onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{ background: platforms.includes(p) ? TP_RED : '#F7F5F2', color: platforms.includes(p) ? '#fff' : TP_DARK, border: 'none', borderRadius: 8, padding: '7px 13px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}>{p}</button>
              ))}
            </div>

            {/* Media upload */}
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, marginBottom: 5 }}>MEDIA</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              {(['photo', 'video', 'carousel'] as const).map(m => (
                <button key={m} onClick={() => setMedia(m)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: media === m ? '#FDE8E8' : '#F7F5F2', border: media === m ? `1.5px solid ${TP_RED}` : '1.5px solid transparent', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                  {m === 'video' ? <Video size={16} style={{ color: TP_RED }} /> : m === 'carousel' ? <Layers size={16} style={{ color: TP_RED }} /> : <ImageIcon size={16} style={{ color: TP_RED }} />}
                  <span style={{ fontSize: 10, fontWeight: 800, color: TP_DARK }}>{m}</span>
                </button>
              ))}
              <div style={{ flex: 1, border: '1.5px dashed #D9D3CC', borderRadius: 10, padding: '12px', fontSize: 11, color: '#8A847E', textAlign: 'center', fontWeight: 700 }}>Drop {media} here — or choose files</div>
            </div>

            <button onClick={generate} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: TP_DARK, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', marginBottom: 10 }}>
              <Sparkles size={14} /> Generate caption with AI
            </button>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} placeholder="Caption — or generate one above" style={{ width: '100%', border: '1px solid #E7E2DC', borderRadius: 10, padding: '11px 13px', fontSize: 12.5, outline: 'none', background: '#F7F5F2', resize: 'vertical', fontFamily: 'inherit' }} />

            {/* Hashtags */}
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, margin: '12px 0 5px' }}><Hash size={11} style={{ verticalAlign: '-1px' }} /> SUGGESTED HASHTAGS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SOCIAL_HASHTAGS.map(h => {
                const on = tags.includes(h)
                return <button key={h} onClick={() => setTags(prev => on ? prev.filter(x => x !== h) : [...prev, h])} style={{ background: on ? TP_RED : '#F7F5F2', color: on ? '#fff' : '#5B554F', border: 'none', borderRadius: 999, padding: '4px 10px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>{h}</button>
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
              <select value={when} onChange={e => setWhen(e.target.value)} style={{ flex: 1, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 11px', fontSize: 12, background: '#F7F5F2', outline: 'none' }}>
                {['Today 17:00', 'Tomorrow 09:00', 'Sat 15:30', 'Sun 11:00', 'Best time (auto)'].map(w => <option key={w}>{w}</option>)}
              </select>
              <button onClick={schedule} disabled={!caption.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: caption.trim() ? TP_RED : '#D9D3CC', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 900, cursor: caption.trim() ? 'pointer' : 'not-allowed' }}>
                <Send size={13} /> Schedule
              </button>
            </div>
          </Card>

          {/* Live preview + best times */}
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card>
              <SectionTitle sub="How it’ll look — live preview">Preview</SectionTitle>
              <div style={{ border: '1px solid #E7E2DC', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', background: '#fff' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/tenproject-favicon-64.png" alt="TP" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: TP_DARK }}>tenprojectuk</div>
                  <div style={{ marginLeft: 'auto', fontSize: 10, color: '#8A847E' }}>{platforms.join(' · ') || 'IG'}</div>
                </div>
                {media !== 'none' ? (
                  <div style={{ width: '100%', aspectRatio: '1/1', background: `linear-gradient(135deg, hsl(8 55% 62%), hsl(48 60% 48%))`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #ffffff10 0 8px, transparent 8px 16px)' }} />
                    {media === 'video' ? <Video size={40} style={{ color: '#fff', zIndex: 1 }} /> : media === 'carousel' ? <Layers size={40} style={{ color: '#fff', zIndex: 1 }} /> : <ImageIcon size={40} style={{ color: '#fff', zIndex: 1 }} />}
                  </div>
                ) : null}
                <div style={{ padding: '10px 12px', fontSize: 12, color: '#33302C', lineHeight: 1.5, background: '#fff' }}>
                  <strong>tenprojectuk</strong> {caption || 'Your caption will appear here…'}
                  {tags.length > 0 && <div style={{ color: TP_RED, marginTop: 4 }}>{tags.join(' ')}</div>}
                </div>
              </div>
            </Card>
            <Card>
              <SectionTitle sub="When your audience is most active"><Clock size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Best time to post</SectionTitle>
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(SOCIAL_BEST_TIMES).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, fontSize: 11.5, color: '#5B554F' }}>
                    <span style={{ fontWeight: 900, color: TP_RED, width: 28 }}>{k}</span> {v.replace('Best time: ', '')}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── PUBLISHED & ANALYTICS ── */}
      {sub === 'published' && (<>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <Card>
            <SectionTitle sub="Total followers across all channels, last 8 weeks">
              <TrendingUp size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />Follower growth
            </SectionTitle>
            <svg viewBox="0 0 300 78" style={{ width: '100%', height: 140 }} preserveAspectRatio="none">
              <polyline points={`0,70 ${gpts} 300,70`} fill="#FDE8E8" stroke="none" />
              <polyline points={gpts} fill="none" stroke={TP_RED} strokeWidth="2.5" strokeLinejoin="round" />
              {SOCIAL_GROWTH.map((g, i) => <circle key={g.w} cx={(i / (SOCIAL_GROWTH.length - 1)) * 300} cy={70 - ((g.n - minG) / (maxG - minG)) * 60} r="2.6" fill={TP_RED} />)}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}>
              <span>{SOCIAL_GROWTH[0].n.toLocaleString()}</span><span>+26% → {SOCIAL_GROWTH[SOCIAL_GROWTH.length - 1].n.toLocaleString()}</span>
            </div>
          </Card>
          <Card>
            <SectionTitle sub="This month across all channels">Performance</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([['1.3M', 'REACH'], ['9.4%', 'ENGAGEMENT'], ['504', 'LINK CLICKS'], ['+710', 'NEW FOLLOWERS']] as [string, string][]).map(([v, l]) => (
                <div key={l} style={{ background: '#F7F5F2', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: TP_RED }}>{v}</div>
                  <div style={{ fontSize: 9.5, color: '#8A847E', fontWeight: 800, letterSpacing: 0.4 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <SectionTitle sub="What’s live — with the numbers each post pulled in">Published posts</SectionTitle>
          <div style={{ display: 'grid', gap: 10 }}>
            {SOCIAL_PUBLISHED.map(pst => {
              const PIcon = PLATFORM_ICON[pst.platform] ?? Instagram
              return (
                <div key={pst.id} style={{ display: 'flex', gap: 12, background: pst.top ? '#FDE8E8' : '#F7F5F2', borderRadius: 11, padding: '11px 13px', alignItems: 'flex-start' }}>
                  <Thumb media={pst.media} hue={pst.hue} size={64} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: TP_DARK }}>
                        <PIcon size={12} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />{pst.platform} · {pst.when}
                        {pst.top && <Pill tone="red">TOP POST</Pill>}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#8A847E', fontWeight: 700 }}><Eye size={11} style={{ verticalAlign: '-1px', marginRight: 3 }} />{pst.reach.toLocaleString()} reach</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#33302C', lineHeight: 1.5 }}>{pst.text}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                      {([[Heart, pst.likes], [MessageCircle, pst.comments], [Share2, pst.shares], [Bookmark, pst.saves]] as [React.ComponentType<{ size?: number; style?: React.CSSProperties }>, number][]).map(([Ic, n], i) => (
                        <span key={i} style={{ fontSize: 11.5, fontWeight: 800, color: '#5B554F' }}><Ic size={12} style={{ verticalAlign: '-2px', marginRight: 4, color: TP_RED }} />{n}</span>
                      ))}
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#5B554F', marginLeft: 'auto' }}>{pst.clicks} link clicks</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </>)}
    </div>
  )
}
