'use client'

import React, { useState } from 'react'
import { BookOpen, Award, Calendar, MessageCircle, Users, PlayCircle, CheckCircle, QrCode, Heart, MapPin, Navigation, Camera } from 'lucide-react'
import { Pill } from './ui'
import {
  TP_RED, TP_DARK, TP_PAPER, CURRICULUM, STICKER_AREAS, PARENT, PARENT_MESSAGES, CAMPAIGN, VENUE_DETAILS,
} from '@/data/tenproject/demo-data'

const YT_CHANNEL = 'https://www.youtube.com/channel/UC3-1ehFIPwAKgH98SXfLf1w'
const KINGSMEAD = VENUE_DETAILS.kingsmead
const MAP_Q = encodeURIComponent(`${KINGSMEAD.address}, ${KINGSMEAD.postcode}`)

type Tab = 'week' | 'progress' | 'sessions' | 'messages' | 'family'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }[] = [
  { id: 'week', label: 'This Week', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: Award },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'family', label: 'Family', icon: Users },
]

const CURRENT_WEEK = 3 // index into CURRICULUM → Week 4 (backhand block, weeks 3&4)

export default function ParentApp({ fullScreen = false }: { fullScreen?: boolean }) {
  const [tab, setTab] = useState<Tab>('week')
  const [confirmed, setConfirmed] = useState(false)
  const [practiceLogged, setPracticeLogged] = useState(false)
  const block = CURRICULUM[1] // weeks 3 & 4 — BACKHAND

  return (
    <div style={fullScreen ? {} : { display: 'flex', justifyContent: 'center' }}>
      {/* Phone frame on desktop; full-bleed on mobile */}
      <div style={fullScreen
        ? { width: '100%', background: TP_PAPER, display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 52px)', overflow: 'hidden' }
        : { width: 375, background: TP_PAPER, borderRadius: 28, border: '1px solid #E7E2DC', overflow: 'hidden', boxShadow: '0 18px 44px #00000014', display: 'flex', flexDirection: 'column', height: 700 }}>
        {/* Header */}
        <div style={{ background: TP_DARK, padding: '14px 18px 12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ height: 26, width: 'auto', display: 'block' }} />
          <div style={{ color: '#C9C4BE', fontSize: 11.5, marginTop: 6 }}>
            Hi {PARENT.name.split(' ')[0]} — Week 4 of 10 · LEARN. PLAY. TOGETHER.
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'grid', gap: 10, alignContent: 'start' }}>
          {tab === 'week' && (
            <>
              <div style={{ background: TP_RED, borderRadius: 14, padding: 16, color: '#fff' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.85, letterSpacing: 1 }}>WEEKS {block.weeks}</div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>{block.skill}</div>
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.95 }}>{block.didYouKnow}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>TOP TIPS</div>
                <div style={{ fontSize: 13, color: TP_DARK, marginTop: 4 }}>{block.tip}</div>
              </div>
              <a href={YT_CHANNEL} target="_blank" rel="noreferrer" style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none' }}>
                <PlayCircle size={30} style={{ color: TP_RED, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TP_DARK }}>Watch: the backhand</div>
                  <div style={{ fontSize: 11.5, color: '#6B6560' }}>Take it to your court, try it at home — but most of all try it as a family!</div>
                </div>
                <span style={{ color: TP_RED, fontWeight: 900, fontSize: 13 }}>▶</span>
              </a>
              <button
                onClick={() => setPracticeLogged(true)}
                style={{ background: practiceLogged ? '#187A3C' : TP_DARK, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {practiceLogged ? '✓ Practice logged — great work Mia & Tom!' : 'We practised this week — log it'}
              </button>

              {/* Next session */}
              <button onClick={() => setTab('sessions')} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>NEXT FAMILY SESSION</div>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK, marginTop: 3 }}>{PARENT.venue.day} {PARENT.venue.time.split('–')[0]} · {PARENT.venue.name}</div>
                    <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{confirmed ? '✓ You’re confirmed' : 'Tap to confirm you’re coming'}</div>
                  </div>
                  <Calendar size={22} style={{ color: TP_RED, flexShrink: 0 }} />
                </div>
              </button>

              {/* Progress snapshot */}
              <button onClick={() => setTab('progress')} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6, marginBottom: 8 }}>STICKER PROGRESS</div>
                {PARENT.children.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <div style={{ width: 44, fontSize: 12, fontWeight: 900, color: TP_DARK }}>{c.name}</div>
                    <div style={{ flex: 1, background: '#EFEBE6', borderRadius: 999, height: 9 }}>
                      <div style={{ width: `${(c.stickers / 6) * 100}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#6B6560' }}>{c.stickers}/6</div>
                  </div>
                ))}
                <div style={{ fontSize: 10.5, color: '#8A847E' }}>Mia earned The Shots sticker today — tap to see the wall 🎉</div>
              </button>

              {/* Latest message */}
              <button onClick={() => setTab('messages')} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>LATEST MESSAGE</span>
                  <span style={{ fontSize: 10, color: '#8A847E' }}>{PARENT_MESSAGES[0].when}</span>
                </div>
                <div style={{ fontSize: 12, color: TP_DARK, lineHeight: 1.5 }}>
                  <strong style={{ color: TP_RED }}>{PARENT_MESSAGES[0].from}:</strong> {PARENT_MESSAGES[0].text}
                </div>
              </button>

              {/* #tenproject competition */}
              <div style={{ background: TP_DARK, borderRadius: 12, padding: 14, color: '#fff', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Camera size={22} style={{ color: TP_RED, flexShrink: 0 }} />
                <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  <strong>#tenproject competition</strong> — share a family practice photo or clip for the chance to win a trip to Wimbledon! (Only ever shared with your consent.)
                </div>
              </div>
            </>
          )}

          {tab === 'progress' && (
            <>
              {PARENT.children.map(child => (
                <div key={child.name} style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>{child.name}, {child.age}</div>
                    <Pill tone="red">{child.stickers} of 6 stickers</Pill>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {STICKER_AREAS.map((area, i) => {
                      const earned = i < child.stickers
                      return (
                        <div key={area.id} style={{ background: earned ? '#FDE8E8' : '#F7F5F2', border: earned ? `1.5px solid ${TP_RED}55` : '1.5px dashed #D9D3CC', borderRadius: 10, padding: '9px 10px' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: earned ? TP_RED : '#8A847E' }}>
                            {earned ? '★ ' : ''}{area.label}
                          </div>
                          <div style={{ fontSize: 9.5, color: '#8A847E', marginTop: 2 }}>{area.desc}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#8A847E', textAlign: 'center' }}>
                Stickers mirror the printed Activity Booklet — the real stickers stay in the book!
              </div>
            </>
          )}

          {tab === 'sessions' && (
            <>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>YOUR NEXT FAMILY SESSION</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK, marginTop: 4 }}>{PARENT.venue.name}</div>
                <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 2 }}>{PARENT.venue.day} {PARENT.venue.time} · free · all the family welcome</div>
                <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 8, background: TP_PAPER, borderRadius: 9, padding: '8px 10px' }}>
                  <MapPin size={12} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />{KINGSMEAD.address}, {KINGSMEAD.postcode}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <a href={`https://maps.google.com/?q=${MAP_Q}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', background: TP_PAPER, color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 0', fontSize: 11.5, fontWeight: 800, textDecoration: 'none' }}>
                    <MapPin size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />View map
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${MAP_Q}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', background: TP_PAPER, color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '9px 0', fontSize: 11.5, fontWeight: 800, textDecoration: 'none' }}>
                    <Navigation size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />Directions
                  </a>
                </div>
                <button
                  onClick={() => setConfirmed(true)}
                  style={{ marginTop: 10, width: '100%', background: confirmed ? '#187A3C' : TP_RED, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {confirmed ? '✓ You’re confirmed — see you Saturday!' : 'We’re coming — one-tap confirm'}
                </button>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TP_DARK, letterSpacing: 0.6, marginBottom: 8 }}>YOUR CHECK-IN CODE</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, background: TP_PAPER, borderRadius: 12, border: '1px solid #E7E2DC' }}>
                  <QrCode size={84} style={{ color: TP_DARK }} />
                </div>
                <div style={{ fontSize: 11, color: '#6B6560', marginTop: 8 }}>
                  Scan at the gate — “Tap to check in: Mia + Tom?” Works offline; syncs when you have signal.
                </div>
              </div>
            </>
          )}

          {tab === 'messages' && (
            <>
              {PARENT_MESSAGES.map(m => (
                <div key={m.id} style={{ background: '#fff', borderRadius: 12, padding: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: TP_RED }}>{m.from}</span>
                    <span style={{ fontSize: 10.5, color: '#8A847E' }}>{m.when}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: TP_DARK }}>{m.text}</div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#8A847E', textAlign: 'center' }}>
                One inbox replaces the weekly emails — only your venue, only your week.
              </div>
            </>
          )}

          {tab === 'family' && (
            <>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK, marginBottom: 8 }}>Your children</div>
                {PARENT.children.map(c => (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: TP_DARK, borderBottom: '1px solid #F0EBE5', padding: '6px 0' }}>
                    <span>{c.name}, {c.age} — {c.school}</span>
                    <CheckCircle size={14} style={{ color: '#187A3C' }} />
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK, marginBottom: 8 }}>Consents</div>
                <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B6560' }}>Data consent</span><Pill tone="green">GIVEN</Pill></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B6560' }}>Photo & filming</span><Pill tone="green">GIVEN</Pill></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B6560' }}>Emergency contact</span><span style={{ fontWeight: 700, color: TP_DARK }}>{PARENT.consents.emergency}</span></div>
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Heart size={22} style={{ color: TP_RED, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>Become a TENOR</div>
                  <div style={{ fontSize: 11.5, color: '#6B6560' }}>Lend us your voice and enthusiasm — help run Saturday’s session.</div>
                </div>
              </div>
              <div style={{ background: TP_DARK, borderRadius: 12, padding: 14, color: '#fff' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}>Support a school</div>
                <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 3 }}>{CAMPAIGN.school} is fundraising for its 2026/27 programme — £{(CAMPAIGN.target - CAMPAIGN.raised).toLocaleString()} to go.</div>
                <button style={{ marginTop: 9, background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Donate</button>
              </div>
            </>
          )}
        </div>

        {/* Bottom tab bar */}
        <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid #E7E2DC' }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0 12px', cursor: 'pointer', color: active ? TP_RED : '#8A847E' }}>
                <Icon size={19} style={{ display: 'block', margin: '0 auto' }} />
                <div style={{ fontSize: 9.5, fontWeight: active ? 800 : 600, marginTop: 3 }}>{t.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
