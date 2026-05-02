'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '../_lib/theme'
import { FONT, FONT_MONO } from '../_lib/theme'
import type { Fixture } from '../_lib/data'
import { Icon } from './Icon'

// ─── Keyboard helper ──────────────────────────────────────────────────

export function useKey(combo: 'cmdk' | 'esc', handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const meta = e.metaKey || e.ctrlKey
      if (combo === 'cmdk' && meta && k === 'k') { e.preventDefault(); handler(e) }
      if (combo === 'esc' && k === 'escape') handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo, handler])
}

// ─── Command palette ──────────────────────────────────────────────────

type PaletteItem = { kind: 'page' | 'action' | 'jump'; icon: string; label: string; hint: string; onPick?: () => void }

export function CommandPalette({
  T, accent, open, onClose, onAskLumio,
}: { T: ThemeTokens; accent: AccentTokens; open: boolean; onClose: () => void; onAskLumio: () => void }) {
  const [q, setQ]     = useState('')
  const [sel, setSel] = useState(0)
  const inputRef      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 30); setQ(''); setSel(0) }
  }, [open])

  const ALL: PaletteItem[] = [
    { kind: 'page',   icon: 'home',      label: 'Dashboard',                        hint: 'Go to' },
    { kind: 'page',   icon: 'flag',      label: 'Match Centre',                     hint: 'Go to' },
    { kind: 'page',   icon: 'people',    label: 'Squad Manager',                    hint: 'Go to' },
    { kind: 'page',   icon: 'medical',   label: 'Medical Hub',                      hint: 'Go to' },
    { kind: 'page',   icon: 'play',      label: 'Video Analysis',                   hint: 'Go to' },
    { kind: 'page',   icon: 'lightning', label: 'D/L Calculator',                   hint: 'Go to' },
    { kind: 'page',   icon: 'note',      label: 'Declaration Planner',              hint: 'Go to' },
    { kind: 'page',   icon: 'briefcase', label: 'Contract Hub',                     hint: 'Go to' },
    { kind: 'page',   icon: 'trophy',    label: 'County Championship',              hint: 'Go to' },
    { kind: 'action', icon: 'sparkles',  label: 'Ask Lumio…',                       hint: 'AI', onPick: onAskLumio },
    { kind: 'action', icon: 'plus',      label: 'New training session',             hint: 'Create' },
    { kind: 'action', icon: 'note',      label: 'Draft match report',               hint: 'Create' },
    { kind: 'action', icon: 'check',     label: 'Confirm starting XI for Sat',      hint: 'Approve' },
    { kind: 'action', icon: 'mic',       label: 'Schedule press scrum',             hint: 'Schedule' },
    { kind: 'jump',   icon: 'search',    label: 'Find player: D. Hartley',          hint: 'Player' },
    { kind: 'jump',   icon: 'search',    label: 'Find player: A. Patel',            hint: 'Player' },
    { kind: 'jump',   icon: 'search',    label: 'Fixture: vs Loxwood (Sat)',        hint: 'Fixture' },
  ]

  const items = q.trim() ? ALL.filter(it => it.label.toLowerCase().includes(q.toLowerCase())) : ALL.slice(0, 8)

  useEffect(() => { setSel(0) }, [q])

  const pick = (it: PaletteItem) => { it.onPick?.(); onClose() }

  useKey('esc', () => { if (open) onClose() })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
      if (e.key === 'Enter')     { e.preventDefault(); items[sel] && pick(items[sel]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, sel])

  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'start center', paddingTop: 90, zIndex: 100, animation: 'cricketV2FadeUp .15s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <Icon name="search" size={14} stroke={1.6} style={{ color: T.text3 }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search players, fixtures, pages, or ask Lumio…"
            style={{ flex: 1, appearance: 'none', border: 0, outline: 'none', background: 'transparent', color: T.text, fontSize: 14, fontFamily: FONT }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, padding: '2px 6px', borderRadius: 4, border: `1px solid ${T.border}`, color: T.text3 }}>esc</span>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto', padding: 6 }}>
          {items.length === 0 && <div style={{ padding: '20px 14px', color: T.text3, fontSize: 12.5 }}>No results · try a different keyword.</div>}
          {items.map((it, i) => (
            <div key={i} onMouseEnter={() => setSel(i)} onClick={() => pick(it)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: sel === i ? accent.dim : 'transparent', color: sel === i ? T.text : T.text2 }}>
              <Icon name={it.icon} size={13} stroke={1.6} style={{ color: sel === i ? accent.hex : T.text3 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{it.label}</span>
              <span style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{it.hint}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '8px 14px', borderTop: `1px solid ${T.border}`, fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>
          <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
          <span style={{ marginLeft: 'auto', color: accent.hex }}>⌘K</span>
        </div>
      </div>
    </div>
  )
}

// ─── Ask Lumio side sheet ─────────────────────────────────────────────

type ChatMsg = { role: 'user' | 'lumio'; text: string; refs?: string[] }
type Sport = 'cricket' | 'football' | 'womens' | 'rugby' | 'nonleague' | 'grassroots' | 'tennis' | 'darts'

// Static demo replies. The Ask Lumio modal is presentation-only — replies
// are hardcoded keyword matches with a 1.1s "thinking" delay. When this
// is wired to a real AI route, the sport branch picks the API endpoint;
// for now the sport branch picks the prompt set + reply content so each
// portal renders its own context-relevant suggestions. Each portal MUST
// pass its own `sport` prop — the default is cricket, so an unset prop
// will surface cricket replies on a football/rugby/etc dashboard.

function generateReplyCricket(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('xi') || Q.includes('lineup') || Q.includes('hartley') || Q.includes('loxwood')) {
    return {
      text: 'Recommended XI: Patel (c), Reed, Bishop, Whitman, Khan, Cope, Singh, Davies (wk), Trent, Kapoor, Foster (12th: Lawson).\n\nReasoning: Hartley’s 6/10 hamstring score and 11.4 km load yesterday flag him for rest. Patel opens — Loxwood’s top-3 strike at 8.4 vs LA-seam (S/R). Two spinners after lunch as Oakridge dries.',
      refs: ['Medical Hub · Hartley', 'Opposition Scout · Loxwood', 'GPS · 24 Apr'],
    }
  }
  if (Q.includes('workload') || Q.includes('bowl')) {
    return {
      text: 'Workload risks this week:\n• Reed — 38 overs across 4 days. Cap at 12 today, rest Sun.\n• Foster — back-to-back T20s; manage 8-over ceiling.\n• Trent — green; cleared for full spell.',
      refs: ['Bowling Workload', 'GPS Tracking'],
    }
  }
  if (Q.includes('glamorgan') || Q.includes('lose') || Q.includes('lost')) {
    return {
      text: 'Glamorgan loss attribution:\n1. Death overs — 11.8 RPO in 46-50 (season avg 8.1).\n2. Middle-order collapse 3/14 (28-32 ov) vs LA-spin.\n3. 2 dropped catches inside circle.\n\nDrill scheduled Tuesday: yorker repeats + LA-spin sweep clinic.',
      refs: ['Match Report 16 Apr', 'Practice Log', 'Catches'],
    }
  }
  if (Q.includes('contract') || Q.includes('expir')) {
    return {
      text: '4 contracts expire by 31 Aug:\n• A. Patel · 31 Jul · KEY — agent talks open.\n• M. Trescott · 15 Aug · monitor (injury).\n• L. Cope · 31 Aug · likely renew, +12%.\n• T. Lawson · 31 Aug · academy → senior offer.',
      refs: ['Contract Hub'],
    }
  }
  if (Q.includes('weather') || Q.includes('forecast') || Q.includes('rain')) {
    return {
      text: 'Day 1 forecast: 9° at toss, peaks 13° by 14:00, 34% chance of rain after 16:00.\n\nStrategy implication: bowl first if you win the toss — moisture under cloud cover until 13:00. Prioritise top-order wickets pre-lunch; you may not get a full day.',
      refs: ['Weather · Met', 'Pitch report'],
    }
  }
  return {
    text: 'I can pull from the squad, opposition, performance, medical, ops, and contracts data. Try one of the suggestions on the left, or ask something more specific — e.g. "show me bowlers in form on green pitches".',
    refs: [],
  }
}

function generateReplyFootball(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('xi') || Q.includes('lineup') || Q.includes('henderson') || Q.includes('hartwell')) {
    return {
      text: 'Recommended XI vs Hartwell: Hayes (gk); Reid, Chen, Ashton (cb); Rowe, Cole, Morris, Porter (mid); Walsh, Wilson, Harris (fwd).\n\nReasoning: Walsh returns from his 3-match ban — start him over Wilson on form. Henderson held back to bench: hamstring 6/10, scan results 14:00. Hartwell press high from goal kicks — work short build-up; their LB pushes high, space behind to exploit.',
      refs: ['Medical Hub · Henderson', 'Opposition Scout · Hartwell', 'GPS · last 7 days'],
    }
  }
  if (Q.includes('workload') || Q.includes('training') || Q.includes('load')) {
    return {
      text: 'Training load risks this week:\n• Walsh — back from suspension; 80% intensity Tuesday only, full from Wed.\n• Henderson — hamstring 6/10, light only until scan results.\n• Reid — accumulated 320 mins last 7 days; rest Wed.\n• Cole — green; cleared for full session load.',
      refs: ['Performance · GPS Load', 'Medical Hub'],
    }
  }
  if (Q.includes('northgate') || Q.includes('lose') || Q.includes('lost')) {
    return {
      text: 'Northgate City loss attribution (1–2, 26 Apr):\n1. Set pieces — 2 conceded from corners; 22% above league avg conceded from set play.\n2. Final-third turnovers — 18 in attacking third (season avg 11).\n3. Sub timing — pressure window 70–85 not exploited; first change at 78\'.\n\nDrill scheduled Wed: defensive corner shape + counter-press triggers.',
      refs: ['Match Report 26 Apr', 'Set Piece Library', 'Substitution log'],
    }
  }
  if (Q.includes('contract') || Q.includes('expir')) {
    return {
      text: '4 contracts expire by 30 Jun:\n• T. Walsh · 30 Jun · KEY — agent talks open at £8k/wk.\n• B. Chen · 30 Jun · monitor (recent doubt).\n• D. Morris · 30 Jun · likely renew, +10%.\n• Okafor · 30 Jun · within budget if Henderson restructured.',
      refs: ['Contract Hub'],
    }
  }
  if (Q.includes('weather') || Q.includes('forecast') || Q.includes('rain') || Q.includes('saturday')) {
    return {
      text: 'Saturday vs Hartwell forecast: 12°C at kick-off, 11 mph SW wind, light cloud. Pitch firm, soft underfoot — 4G studs recommended.\n\nStrategy implication: slight cross-wind, attacking the south end first half preferred for set-piece delivery. Backup venue Glenmoor Park (3G) confirmed if pitch inspection fails 08:00.',
      refs: ['Weather · Met', 'Pitch inspection log'],
    }
  }
  return {
    text: 'I can pull from the squad, opposition, performance, medical, set pieces, and contracts data. Try one of the suggestions on the left, or ask something more specific — e.g. "show me set-piece patterns Hartwell concede most from".',
    refs: [],
  }
}

function generateReplyWomens(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('xi') || Q.includes('lineup') || Q.includes('zhang') || Q.includes('bristol')) {
    return {
      text: 'Recommended XI vs Bristol City: Clarke (gk); Osei, Reed, Whitmore (cb); Walsh, Nair, Turner, Maxwell (mid); Carter, Brennan, Iversen (fwd).\n\nReasoning: Zhang flagged red on ACL risk monitor — luteal phase + load cap 60%. Hold for Wed&apos;s rotation. Nair available despite ovulatory laxity flag, with strapping. Bristol press high up the pitch — work the wide channels.',
      refs: ['ACL Risk Monitor', 'Cycle Tracking', 'Opposition Scout · Bristol'],
    }
  }
  if (Q.includes('cycle') || Q.includes('acl') || Q.includes('welfare')) {
    return {
      text: 'Player welfare flags this week:\n• E. Zhang — luteal phase + ACL high risk; load cap 60%, no contact training Tue-Wed.\n• C. Reed — menstrual phase; load cap 65%.\n• P. Nair — ovulatory laxity flag; strap-and-go for Sat.\n• S. Turner — RTP P3, 4 weeks out.',
      refs: ['ACL Risk Monitor', 'Cycle Tracking', 'Medical Hub'],
    }
  }
  if (Q.includes('fsr') || Q.includes('compliance') || Q.includes('salary')) {
    return {
      text: 'WSL FSR position: 74% of relevant revenue committed to wages — within the 85% squad cost rule. £180k headroom. Game Standards: 6 of 8 areas green; physiotherapy hours and travel-day hotel standard flagged amber.',
      refs: ['FSR Dashboard', 'Salary Compliance', 'Game Standards'],
    }
  }
  if (Q.includes('contract') || Q.includes('expir')) {
    return {
      text: '3 contracts expire 30 Jun:\n• A. Walsh · captain · KEY — talks open at £85k/yr.\n• L. Brennan · 30 Jun · monitor (FSR impact tier 1).\n• J. Osei · 30 Jun · loan return; recall option exercised.',
      refs: ['Contract Hub', 'FSR Dashboard'],
    }
  }
  return {
    text: 'I can pull from the squad, opposition, FSR, ACL/cycle/maternity welfare, medical, salary compliance, and Game Standards data. Try one of the suggestions on the left.',
    refs: [],
  }
}

function generateReplyRugby(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('xv') || Q.includes('lineup') || Q.includes('jersey') || Q.includes('henderson')) {
    return {
      text: 'Recommended XV vs Jersey Reds: Forwards — Patel, Williams, Cole, Henderson, Okonkwo, Reilly, Tate (capt), Hughes. Backs — Foster, Drake, Mitchell, Nwosu, Brennan, Carter, Reed.\n\nReasoning: Henderson cleared by physio (concussion HIA Day 6). Lineout success has been 68% — Williams returns to throwing, Cole back to lock to stabilise. Jersey breakdown speed 3.4s — slow our jackal target to 3.0s under pressure.',
      refs: ['Medical · Henderson', 'Set Piece Analytics', 'GPS · 7 days'],
    }
  }
  if (Q.includes('concussion') || Q.includes('hia') || Q.includes('rtp')) {
    return {
      text: 'Active HIA / concussion protocols:\n• Henderson — Day 6 of 6, cleared for contact this morning.\n• Brennan — Day 4 of 6, no contact training until Thursday.\n• Williams — RTP P2 (running), CRT5 in 48h before contact clearance.',
      refs: ['Medical Hub', 'Concussion & HIA', 'Return to Play'],
    }
  }
  if (Q.includes('cap') || Q.includes('salary')) {
    return {
      text: 'Cap position: £6.4M of £6.6M senior cap committed (97%). £200k headroom for Jun window. Patel renewal at £180k/yr (3 yrs) would breach — needs Brennan restructure first or use marquee allocation.',
      refs: ['Cap Dashboard', 'Scenario Modeller'],
    }
  }
  if (Q.includes('contract') || Q.includes('expir')) {
    return {
      text: '4 contracts expire 30 Jun:\n• Tate (capt) · 30 Jun · KEY — talks at £200k/yr, marquee discussion.\n• Foster · 30 Jun · monitor (England call-up bumps value).\n• Reed · 30 Jun · likely renew, +8%.\n• Hughes · 30 Jun · academy → senior, within budget.',
      refs: ['Contract Hub', 'Cap Impact Modeller'],
    }
  }
  return {
    text: 'I can pull from the squad, medical, GPS load, cap dashboard, recruitment, and franchise readiness data. Try one of the suggestions on the left.',
    refs: [],
  }
}

function generateReplyNonLeague(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('xi') || Q.includes('lineup') || Q.includes('runcorn')) {
    return {
      text: 'Likely XI vs Runcorn (Sat): Calloway (gk); Morley, Prescott, Cartwright, Okonkwo (def); Brennan, Whitmore, Deakin (mid); Fletcher, Grady, Webb (fwd).\n\nReasoning: Platt out (calf, 12 Apr return). Mellor still suspended. Pearson on the bench — first start watch if Brennan flags. Runcorn press from goal kicks — work the long out-ball to Grady.',
      refs: ['Squad · Availability', 'Match Fee Tracker', 'Discipline Log'],
    }
  }
  if (Q.includes('match fee') || Q.includes('fee') || Q.includes('budget')) {
    return {
      text: 'Match fee budget this week: £695 across 18 in matchday squad + travel allowances. Season-to-date: 78% of £18k budget spent with 12 fixtures left. Trim Match-by-match contracts for the run-in — ~£140 saving across 4 fixtures.',
      refs: ['Match Fee Tracker', 'Finance · Budget'],
    }
  }
  if (Q.includes('registration') || Q.includes('fa') || Q.includes('compliance')) {
    return {
      text: 'FA registration check: 22 of 23 squad members registered. Pearson trial → registration form pending county FA approval (submitted 28 Mar, expect this week). Check loan stop-date for Bright (Bolton) — 31 May.',
      refs: ['Player Registration', 'Discipline Log'],
    }
  }
  if (Q.includes('sponsor') || Q.includes('fundraising') || Q.includes('insurance')) {
    return {
      text: 'Commercial summary: 3 sponsors renewing within 60 days (£8.4k combined). Two fundraising events booked (race night 12 Apr, golf day 4 May). Public liability insurance renewal due 1 Jun — quote being shopped now, current £1.6k.',
      refs: ['Sponsorship', 'Fundraising', 'Insurance'],
    }
  }
  return {
    text: 'I can pull from the squad, match fees, registrations, finance, sponsorship, fundraising, and ground/operations data. Try one of the suggestions on the left.',
    refs: [],
  }
}

function generateReplyGrassroots(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('availability') || Q.includes('playing') || Q.includes('sunday')) {
    return {
      text: 'Sunday availability so far: 13 of 16 confirmed in WhatsApp, 2 declined (Tommo — work, Kev — wedding), 1 no reply (Daz — chase him). FA Sunday Cup R1 vs Millfield — bring boots and a jacket, forecast says light rain after 11.',
      refs: ['Availability', 'Fixtures · FA Sunday Cup'],
    }
  }
  if (Q.includes('subs') || Q.includes('fees') || Q.includes('money')) {
    return {
      text: 'Subs collection: £620 of £720 target collected. 4 outstanding — Tommo £50 (6 weeks behind 🔴), Andy £30, Pete £20, Lee £10. WhatsApp reminder ready to go — say the word.',
      refs: ['Subs Tracker', 'Finances'],
    }
  }
  if (Q.includes('dbs') || Q.includes('safeguarding') || Q.includes('welfare')) {
    return {
      text: 'DBS status: Dave Nolan (manager) and Bob Turner (treasurer) BOTH OVERDUE. They cannot have unsupervised access to juniors until renewed. Phil Rees and Sarah Nolan valid. Welfare officer (Sarah) up to date.',
      refs: ['DBS Tracker', 'Safeguarding'],
    }
  }
  if (Q.includes('pitch') || Q.includes('referee') || Q.includes('booking')) {
    return {
      text: 'Sunday matchday: pitch booked at Millfield Rec, ref Graham Foster confirmed (£35 cash on the day). 3G backup at Glenmoor not needed — forecast says pitch will pass. Programme printed, ball pumped, kit washed.',
      refs: ['Pitch Booking', 'Referee Bookings'],
    }
  }
  return {
    text: 'I can help with availability, subs, DBS/safeguarding, pitch and ref bookings, kit, and FA admin. Try one of the suggestions on the left.',
    refs: [],
  }
}

function generateReplyTennis(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('opponent') || Q.includes('vega') || Q.includes('match')) {
    return {
      text: 'Today vs Vega (13:00 Court 4):\n• Serve — 62% first-serve, kicks T on deuce. Step in early on second serves to body.\n• Return — stands 2m behind baseline; chip-and-charge worth a try sets 1-2.\n• Backhand — flat down the line, cross-court has 18% more UE than yours.',
      refs: ['Match Prep', 'H2H', 'Tagged clips'],
    }
  }
  if (Q.includes('ranking') || Q.includes('points') || Q.includes('atp') || Q.includes('wta')) {
    return {
      text: 'Ranking position: ATP 84 (career high 79). Defending 90 points from this clay event last year — keep them with a R16 finish or better. Madrid quallies start in 12 days; flight Wed evening or Thu morning.',
      refs: ['Ranking · ATP', 'Schedule'],
    }
  }
  if (Q.includes('coach') || Q.includes('travel') || Q.includes('budget')) {
    return {
      text: 'Coaching block: Marco off-tour Mon-Wed, Sarah on practice court Tue-Fri. Travel costs YTD: £42k of £85k budget (49%). Hotel for Madrid quallies: 4-night premium room cleared with sponsor activation budget.',
      refs: ['Team', 'Travel & Logistics', 'Sponsorship'],
    }
  }
  if (Q.includes('sponsor') || Q.includes('appearance')) {
    return {
      text: 'Sponsor obligations this week: Vanta Sports renewal call Thu 14:00 (Marco joining). One social post owed for the racquet brand by Sunday. Appearance at junior clinic Sat 09:00 — pre-game routine starts 10:30 after.',
      refs: ['Sponsorship', 'Calendar'],
    }
  }
  return {
    text: 'I can pull from match prep, ranking, sponsors, coaching team, travel, and tournament schedule. Try one of the suggestions on the left.',
    refs: [],
  }
}

function generateReplyDarts(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('opponent') || Q.includes('merrick') || Q.includes('match')) {
    return {
      text: 'Tonight vs D. Merrick (8pm, BO11):\n• H2H — Jake leads 8-3. Avg 99.4 vs Merrick (vs his 96.2 season).\n• Pattern — Merrick starts slow, averages 92 in first 3 legs vs 99 from leg 4 onwards. Punish early.\n• Doubles — favourite checkout D16, drops to D5 under pressure.',
      refs: ['Match Prep', 'H2H', 'Checkout patterns'],
    }
  }
  if (Q.includes('ranking') || Q.includes('order of merit') || Q.includes('points')) {
    return {
      text: 'PDC Order of Merit: 14th. Defending £11k from this Players Championship last year. Win tonight to push toward top 12 and the Premier League invitation conversation.',
      refs: ['Ranking · OoM', 'Schedule'],
    }
  }
  if (Q.includes('sponsor') || Q.includes('vanta') || Q.includes('appearance')) {
    return {
      text: 'Sponsor obligations: Vanta Sports renewal call Thu 14:00 (Marco + James). One Reel owed for the shirt sponsor by Friday. Q&A appearance at Sheffield darts academy Sat — confirm with Sarah.',
      refs: ['Sponsorship', 'Social Media', 'Calendar'],
    }
  }
  if (Q.includes('shoulder') || Q.includes('routine') || Q.includes('mental')) {
    return {
      text: 'Routines & welfare:\n• Shoulder — Dr. Singh treatment 08:30 tomorrow, mobility work daily.\n• Pre-match routine — updated by Sarah; new breathing anchor for pressure checkouts.\n• Sleep last 7 nights — 6.8h avg, push toward 7.5h with phone curfew at 22:00.',
      refs: ['Medical', 'Mental Performance'],
    }
  }
  return {
    text: 'I can help with match prep, ranking, sponsors, mental performance, training, and travel. Try one of the suggestions on the left.',
    refs: [],
  }
}

function generateReply(q: string, sport: Sport): { text: string; refs: string[] } {
  switch (sport) {
    case 'football':   return generateReplyFootball(q)
    case 'womens':     return generateReplyWomens(q)
    case 'rugby':      return generateReplyRugby(q)
    case 'nonleague':  return generateReplyNonLeague(q)
    case 'grassroots': return generateReplyGrassroots(q)
    case 'tennis':     return generateReplyTennis(q)
    case 'darts':      return generateReplyDarts(q)
    case 'cricket':
    default:           return generateReplyCricket(q)
  }
}

const SUGGESTED_BY_SPORT: Record<Sport, string[]> = {
  cricket: [
    'Best XI vs Loxwood given Hartley’s fitness?',
    'Bowling workload risks this week',
    'Why did we lose to Glamorgan?',
    'Players nearing contract expiry',
    'Forecast effect on day 1 strategy',
  ],
  football: [
    'Best XI vs Hartwell given Henderson’s fitness?',
    'Training load risks this week',
    'Why did we lose to Northgate City?',
    'Players nearing contract expiry',
    'Forecast effect on Saturday match',
  ],
  womens: [
    'Best XI vs Bristol given Zhang’s ACL flag?',
    'Cycle / ACL welfare risks this week',
    'WSL FSR position and headroom',
    'Players nearing contract expiry',
    'Game Standards compliance gaps',
  ],
  rugby: [
    'Best XV vs Jersey Reds given Henderson’s HIA?',
    'Concussion / HIA / RTP status this week',
    'Cap position and renewal headroom',
    'Players nearing contract expiry',
    'Lineout success trend last 5 matches',
  ],
  nonleague: [
    'Likely XI vs Runcorn this Saturday?',
    'Match fee budget — what can we trim?',
    'FA registration and discipline status',
    'Sponsor renewals and fundraising pipeline',
    'Insurance renewal and ground hire revenue',
  ],
  grassroots: [
    'Who’s playing on Sunday?',
    'Who still owes subs?',
    'DBS / safeguarding status',
    'Pitch and referee booked for Sunday?',
    'Cup draw and committee actions this week',
  ],
  tennis: [
    'Match brief — opponent today?',
    'Ranking position and points to defend',
    'Coaching block and travel costs',
    'Sponsor obligations this week',
    'Mental performance and recovery flags',
  ],
  darts: [
    'Match brief — opponent tonight?',
    'PDC Order of Merit position',
    'Sponsor obligations this week',
    'Shoulder rehab and routine updates',
    'Travel + practice plan for next event',
  ],
}

function Dot({ delay }: { delay: number }) {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: `cricketV2PulseDim 1.1s ${delay}ms infinite` }} />
}

export function AskLumio({ T, accent, open, onClose, sport = 'cricket' }: { T: ThemeTokens; accent: AccentTokens; open: boolean; onClose: () => void; sport?: Sport }) {
  const [q, setQ]               = useState('')
  const [thread, setThread]     = useState<ChatMsg[]>([])
  const [thinking, setThinking] = useState(false)
  const sheetRef                = useRef<HTMLDivElement>(null)

  useKey('esc', () => { if (open) onClose() })

  const SUGGESTED = SUGGESTED_BY_SPORT[sport]

  const ask = (text?: string) => {
    const Q = (text ?? q).trim()
    if (!Q) return
    setThread(t => [...t, { role: 'user', text: Q }])
    setQ('')
    setThinking(true)
    setTimeout(() => {
      const reply = generateReply(Q, sport)
      setThread(t => [...t, { role: 'lumio', text: reply.text, refs: reply.refs }])
      setThinking(false)
    }, 1100)
  }

  useEffect(() => {
    if (sheetRef.current) sheetRef.current.scrollTop = sheetRef.current.scrollHeight
  }, [thread, thinking])

  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 110, animation: 'cricketV2FadeUp .15s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, height: '100%', background: T.panel, borderLeft: `1px solid ${T.borderHi}`, display: 'flex', flexDirection: 'column', animation: 'cricketV2SlideLeft .22s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent.dim, display: 'grid', placeItems: 'center', color: accent.hex }}>
            <Icon name="sparkles" size={14} stroke={1.8} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Ask Lumio</span>
            <span style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>contextual · season + squad</span>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', padding: 6, borderRadius: 6 }} title="Close (esc)">✕</button>
        </div>

        <div ref={sheetRef} style={{ flex: 1, overflow: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {thread.length === 0 && (
            <>
              <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>
                Ask anything about today&apos;s match, the squad, the season, or operations. Lumio reads your data and cites where each answer came from.
              </div>
              <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Try</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => ask(s)}
                    style={{ appearance: 'none', textAlign: 'left', border: `1px solid ${T.border}`, background: T.panel2, color: T.text, padding: '10px 12px', borderRadius: 9, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT, transition: 'border-color .12s, background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
          {thread.map((m, i) => (
            <div key={i} style={{ animation: 'cricketV2FadeUp .25s' }}>
              {m.role === 'user' ? (
                <div style={{ marginLeft: 36, padding: '10px 12px', borderRadius: 10, background: accent.dim, color: T.text, fontSize: 12.5, lineHeight: 1.45 }}>{m.text}</div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: accent.dim, display: 'grid', placeItems: 'center', color: accent.hex, flexShrink: 0 }}>
                    <Icon name="sparkles" size={11} stroke={1.8} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>
                    {m.text.split('\n').map((ln, j) => <p key={j} style={{ margin: '0 0 8px' }}>{ln}</p>)}
                    {m.refs && m.refs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {m.refs.map((r, k) => (
                          <span key={k} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, border: `1px solid ${T.border}`, color: T.text3, fontFamily: FONT_MONO }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div style={{ display: 'flex', gap: 10, color: T.text3, fontSize: 12, alignItems: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: accent.dim, display: 'grid', placeItems: 'center', color: accent.hex, flexShrink: 0 }}>
                <Icon name="sparkles" size={11} stroke={1.8} />
              </div>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask Lumio…"
            style={{ flex: 1, appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text, padding: '9px 12px', borderRadius: 8, outline: 'none', fontSize: 13, fontFamily: FONT }} />
          <button onClick={() => ask()} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, padding: '9px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ─── Fixture drawer ───────────────────────────────────────────────────

function DrawerRow({ T, label, value }: { T: ThemeTokens; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', width: 110, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: T.text }}>{value}</div>
    </div>
  )
}

export function FixtureDrawer({ T, accent, fixture, onClose }: { T: ThemeTokens; accent: AccentTokens; fixture: Fixture | null; onClose: () => void }) {
  useKey('esc', () => { if (fixture) onClose() })
  if (!fixture) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end', zIndex: 105, animation: 'cricketV2FadeUp .12s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, height: '100%', background: T.panel, borderLeft: `1px solid ${T.borderHi}`, display: 'flex', flexDirection: 'column', animation: 'cricketV2SlideLeft .2s ease-out', overflow: 'auto' }}>
        <div style={{ position: 'relative', padding: '20px 22px 22px', borderBottom: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 14, padding: 6 }} title="Close">✕</button>
          <div style={{ fontSize: 10.5, color: accent.hex, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{fixture.comp}</div>
          <h2 style={{ margin: '6px 0 0', fontFamily: FONT, fontSize: 30, fontWeight: 400, color: T.text, letterSpacing: '-0.01em', lineHeight: 1.1 }}>vs {fixture.opp}</h2>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 6 }}>{fixture.day} {fixture.date} · {fixture.time} · {fixture.venue}</div>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <DrawerRow T={T} label="Side" value={fixture.side} />
          <DrawerRow T={T} label="Toss" value={fixture.toss || '—'} />
          <DrawerRow T={T} label="Forecast" value={fixture.forecast || '☁ mixed'} />
          <DrawerRow T={T} label="Last meeting" value="Loxwood W (17 Aug 2025) · 248/9 chased" />
          <DrawerRow T={T} label="Head-to-head (3y)" value="W 4 · D 1 · L 3" />

          <div>
            <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Threat XI</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Cooper (c)','Briggs','Holt','Mansoor','Ali','Pickett','Devine','Khan†','Slater','Yeo','Toller'].map((p, i) => (
                <span key={i} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 99, background: T.panel2, border: `1px solid ${T.border}`, color: T.text2 }}>{p}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Pitch report</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ k: 'Pace', v: 0.7 }, { k: 'Bounce', v: 0.55 }, { k: 'Spin', v: 0.4 }, { k: 'Carry', v: 0.65 }].map((m, i) => (
                <div key={i} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: T.panel2, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{m.k}</div>
                  <div style={{ height: 4, marginTop: 6, background: T.hover, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${m.v * 100}%`, height: '100%', background: accent.hex }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, padding: '10px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Open match brief</button>
            <button style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text, padding: '10px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer' }}>Add to plan</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────

export function useToast(): [string | null, (msg: string) => void] {
  const [toast, setToast] = useState<string | null>(null)
  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2400) }
  return [toast, show]
}

export function Toast({ T, accent, msg }: { T: ThemeTokens; accent: AccentTokens; msg: string | null }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 16px', background: T.panel, color: T.text, border: `1px solid ${T.borderHi}`,
      borderRadius: 10, fontSize: 12.5, boxShadow: '0 16px 40px -10px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 200, animation: 'cricketV2SlideUp .2s',
    }}>
      <Icon name="check" size={13} stroke={2} style={{ color: accent.hex }} />
      {msg}
    </div>
  )
}
