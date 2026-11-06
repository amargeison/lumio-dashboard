'use client'

import React, { useState } from 'react'
import { BookOpen, Award, Calendar, MessageCircle, Users, PlayCircle, CheckCircle, QrCode, Heart, MapPin, Navigation, Camera } from 'lucide-react'
import { Pill, EmptyState } from './ui'
import { TP_RED, TP_DARK, TP_PAPER } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { isoToday, longDate } from '@/lib/impact/compliance'
import { familyWeek } from '@/lib/impact/family-week'
import { moduleOn } from '@/lib/impact/org'
import { parentPackLines } from '@/lib/impact/packs'
import type { ParentContext } from './ImpactDataContext'
import type { ParentDetails } from '@/lib/impact/member-actions'

type Tab = 'week' | 'progress' | 'sessions' | 'messages' | 'family'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }[] = [
  { id: 'week', label: 'This Week', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: Award },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'family', label: 'Family', icon: Users },
]

// A signed-in parent's own details and consents. Saved by the database, which only
// lets a family change its own.
function ParentDetailsForm({ parent }: { parent: ParentContext }) {
  const h = parent.home
  const [d, setD] = useState<ParentDetails>({ email: h.email, phone: h.phone, emergency_contact: h.emergency_contact, consent_data: h.consent_data, consent_photo: h.consent_photo, opt_in_email: h.opt_in_email, opt_in_sms: h.opt_in_sms, opt_in_app: h.opt_in_app })
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const set = (patch: Partial<ParentDetails>) => { setD(x => ({ ...x, ...patch })); setNote('') }
  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 10px', fontSize: 16, fontFamily: 'inherit', color: TP_DARK, background: '#fff' }
  const label: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6560', marginBottom: 3 }
  const tick = (text: string, value: boolean | null, key: keyof ParentDetails) => (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: TP_DARK }}>
      <input type="checkbox" checked={value === true} onChange={e => set({ [key]: e.target.checked })} /> {text}
    </label>
  )
  async function save() {
    setBusy(true); setNote('')
    try { await parent.save(d); setNote('Saved.') }
    catch (e) { setNote(e instanceof Error ? e.message : 'Your details could not be saved.') }
    setBusy(false)
  }
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'grid', gap: 9 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>Your details</div>
      <label><span style={label}>Email</span><input type="email" value={d.email ?? ''} onChange={e => set({ email: e.target.value })} style={field} /></label>
      <label><span style={label}>Phone</span><input type="tel" value={d.phone ?? ''} onChange={e => set({ phone: e.target.value })} style={field} /></label>
      <label><span style={label}>Emergency contact</span><input value={d.emergency_contact ?? ''} onChange={e => set({ emergency_contact: e.target.value })} style={field} /></label>
      <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK, marginTop: 4 }}>Consents</div>
      {tick('We agree to our data being held for the programme', d.consent_data, 'consent_data')}
      {tick('Photos and filming are OK', d.consent_photo, 'consent_photo')}
      <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK, marginTop: 4 }}>How we hear from you</div>
      {tick('Email', d.opt_in_email, 'opt_in_email')}
      {tick('Text', d.opt_in_sms, 'opt_in_sms')}
      {tick('In this app', d.opt_in_app, 'opt_in_app')}
      <button onClick={save} disabled={busy} style={{ background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{busy ? 'Saving…' : 'Save'}</button>
      {note && <div role="status" style={{ fontSize: 11.5, color: note === 'Saved.' ? '#187A3C' : TP_RED }}>{note}</div>}
    </div>
  )
}

const CURRENT_WEEK = 3 // index into CURRICULUM → Week 4 (backhand block, weeks 3&4)

export default function ParentApp({ fullScreen = false }: { fullScreen?: boolean }) {
  const [tab, setTab] = useState<Tab>('week')
  const [confirmed, setConfirmed] = useState(false)
  const [practiceLogged, setPracticeLogged] = useState(false)
  const { brand, copy, data, packs, packChildren, mode, org, parent, sessionsByChild } = useImpact()
  const { CURRICULUM, STICKER_AREAS, PARENT, PARENT_MESSAGES, CAMPAIGN, VENUE_DETAILS } = data
  // The booklet is the org's own. Live has no stickers to show until it's written.
  const booklet = moduleOn(org?.settings, 'packs') ? packs?.booklet ?? null : null
  const stickers = booklet?.stickers.length ? booklet.stickers.map(s => ({ id: s.id, label: s.label, desc: s.description })) : mode === 'live' ? [] : STICKER_AREAS
  const packOn = !!packs && moduleOn(org?.settings, 'packs') && packs.items.some(i => i.active)
  const childId = (c: { id?: string; name: string }) => c.id ?? packChildren?.find(k => k.name.startsWith(`${c.name} `))?.id ?? ''
  const block = CURRICULUM[1] // weeks 3 & 4 — BACKHAND
  // The family's linked weekend venue
  const homeVenue = VENUE_DETAILS[PARENT.venue.id]
  const MAP_Q = encodeURIComponent(`${homeVenue?.address}, ${homeVenue?.postcode}`)
  const childNames = PARENT.children.map(c => c.name)
  // Live portal with no families registered yet
  const noFamily = PARENT.children.length === 0
  // Live: the family's own sessions and the org's booklet. The demo keeps its script.
  const live = mode === 'live'
  const thisWeek = familyWeek(PARENT.children.map(c => sessionsByChild?.[c.id ?? ''] ?? []), booklet, isoToday())

  return (
    <div style={fullScreen ? {} : { display: 'flex', justifyContent: 'center' }}>
      {/* Phone frame on desktop; full-bleed on mobile */}
      <div style={fullScreen
        ? { width: '100%', background: TP_PAPER, display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 52px)', overflow: 'hidden' }
        : { width: 375, background: TP_PAPER, borderRadius: 28, border: '1px solid #E7E2DC', overflow: 'hidden', boxShadow: '0 18px 44px #00000014', display: 'flex', flexDirection: 'column', height: 700 }}>
        {/* Header */}
        <div style={{ background: TP_DARK, padding: '14px 18px 12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoDark} alt={brand.logoAlt} style={{ height: 26, width: 'auto', display: 'block' }} />
          <div style={{ color: '#C9C4BE', fontSize: 11.5, marginTop: 6 }}>
            {noFamily ? <>Welcome · {brand.tagline}</> : live ? <>Hi {PARENT.name.split(' ')[0]}{thisWeek.week ? ` — Week ${thisWeek.week}` : ''}{brand.tagline ? ` · ${brand.tagline}` : ''}</> : <>Hi {PARENT.name.split(' ')[0]} — Week 4 of 10 · {brand.tagline}</>}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'grid', gap: 10, alignContent: 'start' }}>
          {noFamily && (
            <EmptyState icon={Users} title="No families registered yet" sub="When parents register their children, each family sees their child's ten weeks here — this week's skill, sticker progress, sessions and messages." />
          )}
          {!noFamily && tab === 'week' && (
            <>
              {live ? <>
                <div style={{ background: TP_RED, borderRadius: 14, padding: 16, color: '#fff' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.85, letterSpacing: 1 }}>{thisWeek.week ? `WEEK ${thisWeek.week}` : 'THIS WEEK'}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{thisWeek.booklet?.title || (thisWeek.week ? `Week ${thisWeek.week}` : 'Your programme')}</div>
                  <div style={{ fontSize: 12, marginTop: 6, opacity: 0.95 }}>{thisWeek.booklet?.focus || 'This week’s activity appears here once it’s in the booklet.'}</div>
                </div>
                {thisWeek.booklet?.home_task && (
                  <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>TRY AT HOME</div>
                    <div style={{ fontSize: 13, color: TP_DARK, marginTop: 4 }}>{thisWeek.booklet.home_task}</div>
                  </div>
                )}
                <button onClick={() => setTab('sessions')} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>NEXT SESSION</div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK, marginTop: 3 }}>{thisWeek.next ? `${longDate(thisWeek.next.session_date)}${thisWeek.next.venue ? ` · ${thisWeek.next.venue}` : ''}` : 'No sessions coming up yet'}</div>
                </button>
              </> : <>
              <div style={{ background: TP_RED, borderRadius: 14, padding: 16, color: '#fff' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.85, letterSpacing: 1 }}>WEEKS {block.weeks}</div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>{block.skill}</div>
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.95 }}>{block.didYouKnow}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>TOP TIPS</div>
                <div style={{ fontSize: 13, color: TP_DARK, marginTop: 4 }}>{block.tip}</div>
              </div>
              <a href={copy.parent.videoUrl} target="_blank" rel="noreferrer" style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'flex', gap: 10, alignItems: 'center', textDecoration: 'none' }}>
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
                {practiceLogged ? `✓ Practice logged — great work ${childNames.join(' & ')}!` : 'We practised this week — log it'}
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

              </>}

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
                <div style={{ fontSize: 10.5, color: '#8A847E' }}>{copy.parent.stickerNote}</div>
              </button>

              {/* Latest message */}
              {PARENT_MESSAGES[0] && (
              <button onClick={() => setTab('messages')} style={{ background: '#fff', border: 'none', borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>LATEST MESSAGE</span>
                  <span style={{ fontSize: 10, color: '#8A847E' }}>{PARENT_MESSAGES[0].when}</span>
                </div>
                <div style={{ fontSize: 12, color: TP_DARK, lineHeight: 1.5 }}>
                  <strong style={{ color: TP_RED }}>{PARENT_MESSAGES[0].from}:</strong> {PARENT_MESSAGES[0].text}
                </div>
              </button>
              )}

              {/* Family photo competition */}
              {!live && <div style={{ background: TP_DARK, borderRadius: 12, padding: 14, color: '#fff', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Camera size={22} style={{ color: TP_RED, flexShrink: 0 }} />
                <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  <strong>{copy.parent.competitionTitle}</strong>{copy.parent.competitionBody}
                </div>
              </div>}
            </>
          )}

          {!noFamily && tab === 'progress' && (
            <>
              {packOn && packs && PARENT.children.map(child => (
                <div key={`pack-${child.name}`} style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6, marginBottom: 8 }}>{PARENT.children.length > 1 ? `${child.name.toUpperCase()}’S WELCOME PACK` : 'YOUR WELCOME PACK'}</div>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {parentPackLines(packs, childId(child), iso => longDate(iso.slice(0, 10))).map(l => (
                      <div key={l.item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                        <span style={{ fontWeight: 800, color: TP_DARK }}>{l.done ? '✓ ' : ''}{l.item.name}</span>
                        <span style={{ color: '#6B6560', textAlign: 'right' }}>{l.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {PARENT.children.map(child => (
                <div key={child.name} style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>{child.name}{child.age ? `, ${child.age}` : ''}</div>
                    <Pill tone="red">{Math.min(child.stickers, stickers.length || 6)} of {stickers.length || 6} stickers</Pill>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {stickers.map((area, i) => {
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
              {booklet && (booklet.title || booklet.weeks.some(w => w.title)) && (
                <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TP_DARK }}>{booklet.title || 'Activity Booklet'}</div>
                  {booklet.intro && <div style={{ fontSize: 12, color: '#6B6560', marginTop: 4, lineHeight: 1.5 }}>{booklet.intro}</div>}
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {booklet.weeks.filter(w => w.title || w.focus || w.home_task).map(w => (
                      <div key={w.week} style={{ background: TP_PAPER, borderRadius: 9, padding: '8px 10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK }}>Week {w.week}{w.title ? ` · ${w.title}` : ''}</div>
                        {w.focus && <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{w.focus}</div>}
                        {w.home_task && <div style={{ fontSize: 11, color: '#6B6560', marginTop: 2 }}>{w.home_task}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: '#8A847E', textAlign: 'center' }}>
                Stickers mirror the printed Activity Booklet — the real stickers stay in the book!
              </div>
            </>
          )}

          {!noFamily && tab === 'sessions' && live && (
            <>
              {PARENT.children.map(c => (
                <div key={c.id ?? c.name} style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK, marginBottom: 6 }}>{c.name}</div>
                  {!sessionsByChild?.[c.id ?? '']?.length && <div style={{ fontSize: 12, color: '#6B6560' }}>No sessions yet.</div>}
                  {(sessionsByChild?.[c.id ?? ''] ?? []).map(s => {
                    const mark = parent?.attendance.find(a => a.session_id === s.id && a.child_id === c.id)
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: TP_DARK, borderTop: '1px solid #F0EBE5', padding: '6px 0' }}>
                        <span>{longDate(s.session_date)}{s.venue ? ` · ${s.venue}` : ''}</span>
                        {mark && <Pill tone={mark.present ? 'green' : 'grey'}>{mark.present ? 'PRESENT' : 'ABSENT'}</Pill>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}

          {!noFamily && tab === 'sessions' && !live && (
            <>
              <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>YOUR NEXT FAMILY SESSION</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK, marginTop: 4 }}>{PARENT.venue.name}</div>
                <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 2 }}>{PARENT.venue.day} {PARENT.venue.time} · free · all the family welcome</div>
                <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 8, background: TP_PAPER, borderRadius: 9, padding: '8px 10px' }}>
                  <MapPin size={12} style={{ verticalAlign: '-2px', marginRight: 5, color: TP_RED }} />{homeVenue?.address}, {homeVenue?.postcode}
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
                  Scan at the gate — “Tap to check in: {childNames.join(' + ')}?” Works offline; syncs when you have signal.
                </div>
              </div>
            </>
          )}

          {!noFamily && tab === 'messages' && (
            <>
              {PARENT_MESSAGES.length === 0 && mode === 'live' && <EmptyState compact icon={MessageCircle} title="No messages yet" sub="Messages from your programme appear here." />}
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

          {!noFamily && tab === 'family' && (
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
              {parent && <ParentDetailsForm parent={parent} />}
              {!parent && <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TP_DARK, marginBottom: 8 }}>Consents</div>
                <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B6560' }}>Data consent</span>{!live || PARENT.consents.data ? <Pill tone="green">GIVEN</Pill> : <Pill tone="grey">NOT GIVEN</Pill>}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B6560' }}>Photo & filming</span>{!live || PARENT.consents.photo ? <Pill tone="green">GIVEN</Pill> : <Pill tone="grey">NOT GIVEN</Pill>}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B6560' }}>Emergency contact</span><span style={{ fontWeight: 700, color: TP_DARK }}>{PARENT.consents.emergency}</span></div>
                </div>
              </div>}
              {!live && <div style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Heart size={22} style={{ color: TP_RED, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK }}>Become a {brand.volunteer}</div>
                  <div style={{ fontSize: 11.5, color: '#6B6560' }}>Lend us your voice and enthusiasm — help run Saturday’s session.</div>
                </div>
              </div>}
              {!live && <div style={{ background: TP_DARK, borderRadius: 12, padding: 14, color: '#fff' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}>Support a school</div>
                <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 3 }}>{CAMPAIGN.school} is fundraising for its 2026/27 programme — £{(CAMPAIGN.target - CAMPAIGN.raised).toLocaleString()} to go.</div>
                <button style={{ marginTop: 9, background: TP_RED, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Donate</button>
              </div>}
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
