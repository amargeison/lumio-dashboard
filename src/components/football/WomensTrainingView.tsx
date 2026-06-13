'use client'

// Women's Training — full coaching workspace.
// Tabs: Mon–Sun day sessions (sections / drills / equipment / GPS targets /
// coaching points), Session Plans (live builder + library), Load Report,
// Recovery. Demo only: GPS + AI-generated plans are derived/pre-written.

import { useState } from 'react'
import {
  Clipboard, BarChart3, Heart, Clock, Activity, Dumbbell, Target,
  CheckCircle2, Plus, X, Sparkles, Users, MapPin, Timer, Gauge,
} from 'lucide-react'

const C = {
  card: '#0D1017', cardAlt: '#111318', panel2: '#0B0D12',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', textSec: '#9CA3AF', muted: '#6B7280', text2: '#D1D5DB',
  primary: '#EC4899', accent: '#BE185D',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
} as const

type Phase = { name: string; mins: number; detail: string; players: string; equipment: string[]; points: string[] }
type Gps = { distance: string; hiSpeed: string; sprints: string; rpe: string }
type DaySession = {
  key: string; day: string; date: string; mdTag: string; theme: string
  intensity: 'High' | 'Medium' | 'Low' | 'Off'
  focus: string; sessionTime: string
  am: { title: string; type: string; duration: string; location: string }
  pm: { title: string; type: string; duration: string; location: string }
  blocks: Phase[]; gps: Gps; coachingPoints: string[]; availability: string
}

const intColor = (i: string) => i === 'High' ? C.bad : i === 'Medium' ? C.warn : i === 'Low' ? C.good : C.muted

// ─── Weekly session content (Oakridge Women, WSL 2 · MD = Sunday) ──────────
const DAYS: DaySession[] = [
  {
    key: 'mon', day: 'Monday', date: 'MD+1', mdTag: 'MD+1', theme: 'Recovery & Regeneration', intensity: 'Low',
    focus: 'Flush yesterday’s match load; screen for soreness/injury.', sessionTime: '10:00',
    am: { title: 'Recovery + Pool', type: 'Regeneration', duration: '45 min', location: 'Hydro suite' },
    pm: { title: 'Video Review', type: 'Analysis', duration: '40 min', location: 'Team room' },
    blocks: [
      { name: 'Screening & monitoring', mins: 15, detail: 'Wellness questionnaire, CMJ jump test, soreness map. Flag anyone <85% readiness for modified load.', players: 'Full squad', equipment: ['Force plate', 'Tablets', 'GPS vests'], points: ['Log subjective wellness before any work', 'Compare CMJ to 7-day baseline'] },
      { name: 'Pool regeneration', mins: 20, detail: 'Contrast hot/cold, easy aqua-jog intervals, mobility flows. Starters lead with cold-first protocol.', players: 'Match starters (90+ min)', equipment: ['Pool', 'Float belts'], points: ['Keep HR low — this is a flush, not a session', 'Cold exposure 2–3 min max'] },
      { name: 'Mobility + soft tissue', mins: 20, detail: 'Foam-roll circuit + band mobility for hips/ankles. Physio hands-on for flagged players.', players: 'Full squad', equipment: ['Foam rollers', 'Mobility bands', 'Mats'], points: ['Target match-stressed areas', 'No loaded strength today'] },
      { name: 'Video — match review', mins: 40, detail: 'Clip pack from Hartwell: pressing triggers, transition moments, set-piece review. Honest, solutions-focused.', players: 'Full squad (PM)', equipment: ['Projector', 'Clip pack'], points: ['Lead with 2 wins before corrections', 'Tie clips to this week’s theme'] },
    ],
    gps: { distance: '2.8 km', hiSpeed: '40 m', sprints: '0', rpe: '3 / 10' },
    coachingPoints: ['Readiness over output today', 'Identify Tuesday’s modified-load group', 'Confirm any scan referrals before noon'],
    availability: '24 available · 2 modified (Hughes hamstring, Brooks concussion protocol)',
  },
  {
    key: 'tue', day: 'Tuesday', date: 'MD-5', mdTag: 'MD-5', theme: 'Tactical Pressing', intensity: 'High',
    focus: 'High-press structure & triggers vs a back four; biggest physical day of the week.', sessionTime: '10:00',
    am: { title: 'Tactical Pressing', type: 'Tactical', duration: '90 min', location: 'Main pitch' },
    pm: { title: 'Set Pieces', type: 'Set-play', duration: '35 min', location: 'Main pitch' },
    blocks: [
      { name: 'RAMP warm-up', mins: 15, detail: 'Raise/activate/mobilise/potentiate. Ball-circuit + 2 progressive sprints to prime for high-speed work.', players: 'Full squad', equipment: ['Cones', 'Hurdles', 'Balls', 'GPS vests'], points: ['Hit 2 max-effort efforts before main block', 'Activate posterior chain'] },
      { name: 'Pressing rondo 6v3+3', mins: 20, detail: 'Two boxes; on the press trigger the middle three jump to win it back inside 6 seconds, then transition to the second box.', players: 'Full squad in 3 groups', equipment: ['Cones', 'Bibs (3 colours)', 'Balls'], points: ['Trigger = back-pass or heavy touch', 'First presser sets the angle, screens the switch', '6-second turnover rule'] },
      { name: '11v11 press shape', mins: 35, detail: 'Phase-of-play: front three press the build-up, midfield steps to second line, back four pushes up to halfway. Coach freezes on mistimed triggers.', players: 'Full squad', equipment: ['Full goals', 'Mannequins', 'Bibs', 'Tactics board'], points: ['Compactness 30–35m between lines', 'Winger pins the full-back, striker screens the pivot', 'Back line steps as a unit on the trigger'] },
      { name: 'Set pieces — attacking corners', mins: 35, detail: 'Two delivery routines + near-post flick variation. Defending the back-post run (Hartwell’s A. Reece threat).', players: 'Full squad (PM)', equipment: ['Balls', 'Mannequins', 'Mini-goals', 'Cones'], points: ['Attack the ball, don’t wait for it', 'Block the back-post runner early', 'First-contact zone is non-negotiable'] },
    ],
    gps: { distance: '6.8 km', hiSpeed: '720 m', sprints: '26', rpe: '8 / 10' },
    coachingPoints: ['Highest-load day — manage modified group minutes', 'Triggers must be collective, not individual', 'Bank the corner routine for matchday'],
    availability: '23 available · Hughes (modified, no max sprints) · Brooks (non-contact only)',
  },
  {
    key: 'wed', day: 'Wednesday', date: 'MD-4', mdTag: 'MD-4', theme: 'Possession & Build-up', intensity: 'Medium',
    focus: 'Playing through the thirds; gym strength block in the PM.', sessionTime: '10:30',
    am: { title: 'Possession Patterns', type: 'Technical', duration: '75 min', location: 'Main pitch' },
    pm: { title: 'Gym — Strength', type: 'Physical', duration: '45 min', location: 'Performance gym' },
    blocks: [
      { name: 'Activation + passing circuit', mins: 15, detail: 'Dynamic activation then a 4-corner passing pattern building tempo and first-touch direction.', players: 'Full squad', equipment: ['Cones', 'Poles', 'Balls'], points: ['Open body shape to receive', 'Pass to the correct foot'] },
      { name: 'Positional rondo 4v4+3', mins: 20, detail: 'Possession with positional rules — find the free player in the third zone to progress. Reward line-breaking passes.', players: 'Full squad', equipment: ['Cones', 'Bibs', 'Balls'], points: ['Create the passing triangle', 'Receive on the half-turn', 'Third-man runs to unlock'] },
      { name: 'Build-up 9v7 to targets', mins: 25, detail: 'GK + back four + pivot build past a 7-player mid-block to two target players. Switch the point of attack to free the winger.', players: 'Full squad', equipment: ['Full goal', 'Mini-goals', 'Mannequins', 'Bibs'], points: ['Pivot drops to make a 3', 'Full-backs give the width', 'Switch when the press shifts ball-side'] },
      { name: 'Lower-body strength', mins: 45, detail: 'Trap-bar deadlift, Nordics, single-leg work. ACL-prevention emphasis; loads individualised from the screening data.', players: 'Full squad (PM)', equipment: ['Trap bars', 'Dumbbells', 'Nordic bench', 'Bands'], points: ['Quality over load', 'Nordics every week — ACL prevention', 'Match loads to readiness score'] },
    ],
    gps: { distance: '5.4 km', hiSpeed: '420 m', sprints: '14', rpe: '6 / 10' },
    coachingPoints: ['Tempo of ball, not of players', 'Strength block is non-negotiable for ACL prevention', 'Keep high-speed exposure moderate (MD-4)'],
    availability: '24 available · Turner (ACL RTP) joins gym block only',
  },
  {
    key: 'thu', day: 'Thursday', date: 'MD-3', mdTag: 'MD-3', theme: 'Match Simulation', intensity: 'High',
    focus: 'Tactical rehearsal of the matchday plan vs a Hartwell-shaped opposition.', sessionTime: '10:00',
    am: { title: 'Match Simulation', type: 'Match Prep', duration: '90 min', location: 'Main pitch' },
    pm: { title: 'Rest', type: 'Recovery', duration: '—', location: '—' },
    blocks: [
      { name: 'RAMP + reactive warm-up', mins: 15, detail: 'Activation with reactive agility and 2 progressive sprints. Prime decision-speed for the main block.', players: 'Full squad', equipment: ['Cones', 'Ladders', 'Balls', 'GPS vests'], points: ['Eyes up — react to a visual cue', 'Two max efforts before the game'] },
      { name: 'Tactical walk-through', mins: 20, detail: 'Shadow-play the matchday shape: pressing triggers, build-up exits, set-piece roles. Walk then jog tempo.', players: 'First XI + bench', equipment: ['Mannequins', 'Tactics board', 'Bibs'], points: ['Every player knows their trigger', 'Rehearse the restart roles', 'Confirm the press cues'] },
      { name: '11v11 phase game', mins: 40, detail: 'Bench/academy set up as Hartwell (direct LW, back-post corner threat). Conditioned scoring to reward the game plan.', players: 'Full squad', equipment: ['Full goals', 'Bibs', 'Balls'], points: ['Win the ball high, score within 8 seconds', 'Double-up on their direct winger', 'Defend the back post on corners'] },
      { name: 'Cool-down', mins: 15, detail: 'Easy ball circulation, static stretch, hydration. Set the recovery expectation for Friday.', players: 'Full squad', equipment: ['Balls', 'Mats'], points: ['Down-regulate properly', 'Refuel within 30 min'] },
    ],
    gps: { distance: '6.5 km', hiSpeed: '680 m', sprints: '24', rpe: '8 / 10' },
    coachingPoints: ['Last high-load day before MD', 'Clarity of roles over volume', 'Name the XI to drive intensity'],
    availability: '23 available · Hughes returns to full contact · Brooks symptom-free, graded contact',
  },
  {
    key: 'fri', day: 'Friday', date: 'MD-2', mdTag: 'MD-2', theme: 'Activation & Set Pieces', intensity: 'Low',
    focus: 'Sharpen, not fatigue. Speed primers + final set-piece detail.', sessionTime: '11:00',
    am: { title: 'Light Walk-through', type: 'Tactical', duration: '50 min', location: 'Main pitch' },
    pm: { title: 'Pre-match Talk', type: 'Meeting', duration: '30 min', location: 'Team room' },
    blocks: [
      { name: 'Speed + activation', mins: 15, detail: 'Neural primers — flying 20s, reactive starts. Short and sharp to wake the nervous system without fatigue.', players: 'Full squad', equipment: ['Cones', 'Timing gates', 'GPS vests'], points: ['Quality sprint mechanics', 'Long rest between efforts'] },
      { name: 'Finishing carousel', mins: 20, detail: 'Two-touch finishing from cutbacks and through-balls — confidence and rhythm in front of goal.', players: 'Outfield', equipment: ['Balls', 'Full goals', 'Mini-goals'], points: ['First touch sets the finish', 'Hit the target every time'] },
      { name: 'Set-piece walk-through', mins: 15, detail: 'Confirm attacking corner routines and defensive assignments for Hartwell. Low intensity, high clarity.', players: 'Full squad', equipment: ['Balls', 'Mannequins', 'Cones'], points: ['Everyone knows their job', 'No new info — reinforce only'] },
    ],
    gps: { distance: '3.6 km', hiSpeed: '260 m', sprints: '8', rpe: '4 / 10' },
    coachingPoints: ['Leave them wanting more', 'Confirm the matchday XI + roles', 'Hydration + sleep message tonight'],
    availability: '24 available · full squad trained',
  },
  {
    key: 'sat', day: 'Saturday', date: 'MD-1', mdTag: 'MD-1', theme: 'Travel & Pre-match', intensity: 'Low',
    focus: 'Travel to Hartwell, light primer, team meeting.', sessionTime: '—',
    am: { title: 'Travel', type: 'Logistics', duration: '—', location: 'Coach to Hartwell' },
    pm: { title: 'Team Meeting', type: 'Meeting', duration: '40 min', location: 'Hotel' },
    blocks: [
      { name: 'Travel-day primer', mins: 20, detail: 'Optional pitch-side mobility + activation on arrival to offset travel stiffness. Keep it gentle.', players: 'Starters', equipment: ['Bands', 'Foam rollers', 'Balls'], points: ['Move after the coach journey', 'No fatigue today'] },
      { name: 'Tactical meeting', mins: 40, detail: 'Final opposition walk-through, individual match-ups, set-piece roles, and motivational message.', players: 'Full squad', equipment: ['Projector', 'Clip pack'], points: ['Short, sharp, clear', 'Each player owns one match-up', 'Confidence in the plan'] },
    ],
    gps: { distance: '1.2 km', hiSpeed: '20 m', sprints: '0', rpe: '2 / 10' },
    coachingPoints: ['Logistics run by Travel & Logistics module', 'Sleep + nutrition discipline', 'Set the tone for MD'],
    availability: '18 travelling · 6 non-travelling (academy minutes Sunday)',
  },
  {
    key: 'sun', day: 'Sunday', date: 'MD', mdTag: 'MD', theme: 'MATCHDAY — Hartwell Women (A)', intensity: 'High',
    focus: 'Execute the plan. KO 14:00.', sessionTime: '14:00',
    am: { title: 'Pre-match warm-up', type: 'Matchday', duration: '30 min', location: 'Hartwell Stadium' },
    pm: { title: 'MATCH', type: 'Fixture', duration: '90+ min', location: 'Hartwell Stadium' },
    blocks: [
      { name: 'Pre-match warm-up', mins: 30, detail: 'Structured RAMP, position-specific prep (GK with GK coach), set-piece refresh, final activation.', players: 'Matchday 18', equipment: ['Balls', 'Cones', 'Bibs', 'GPS vests'], points: ['Peak by kickoff, not before', 'Position-specific finishing/handling', 'Energy + focus'] },
      { name: 'Match', mins: 95, detail: 'WSL 2 fixture vs Hartwell Women. Live in-game GPS + tactical tracking; HT adjustments from the analysts.', players: 'Matchday 18', equipment: ['Match kit', 'GPS vests'], points: ['Trust the press triggers', 'Win the set-piece battle', 'Stick to the game plan'] },
    ],
    gps: { distance: '10.2 km', hiSpeed: '880 m', sprints: '30', rpe: '9 / 10' },
    coachingPoints: ['Game plan from the Tactics module', 'Manage subs to load data', 'Capture clips for Monday review'],
    availability: 'Matchday 18 named · academy cover for non-travellers',
  },
]

// ─── Session-plan builder (canned AI generator) ────────────────────────────
type SessionPlan = {
  id: string; title: string; type: string; duration: string; intensity: string
  squad: string; area: string; phase: string; theme: string
  blocks: Phase[]; gps: Gps; createdBy: string; tag?: string
}

const SESSION_TYPES = ['Tactical', 'Possession', 'Pressing', 'Set Pieces', 'Finishing', 'Physical', 'Match Prep', 'Recovery'] as const
const DURATIONS = ['60 min', '75 min', '90 min', '105 min', '120 min']
const INTENSITIES = ['Low', 'Medium', 'High']
const AREAS = ['Full pitch', 'Half pitch', 'Final third', 'Boxes / channels']
const PHASES = ['MD-5 (load)', 'MD-4', 'MD-3', 'MD-2', 'MD-1 (sharpen)', 'MD+1 (recover)', 'Pre-season']
const THEMES = ['High press & triggers', 'Build-up through thirds', 'Counter-attack transition', 'Low-block defending', 'Crossing & finishing', 'Set-piece routines', 'Speed & power', 'Regeneration']

type Main = { name: string; detail: string; equip: string[]; points: string[] }
const TYPE_LIB: Record<string, { base: string[]; cool: string; mains: Main[] }> = {
  Tactical: { base: ['Bibs', 'Mannequins', 'Tactics board', 'Full goals'], cool: 'Ball circulation + static stretch', mains: [
    { name: 'Positional rondo', detail: 'Possession with zone rules; reward line-breaking passes and third-man runs to progress.', equip: ['Cones', 'Bibs', 'Balls'], points: ['Create the triangle', 'Receive on the half-turn'] },
    { name: '11v11 phase of play', detail: 'Rehearse the team shape in/out of possession with coach freezes on key moments.', equip: ['Full goals', 'Mannequins', 'Bibs'], points: ['Compactness between lines', 'Collective triggers'] },
  ] },
  Possession: { base: ['Bibs', 'Cones', 'Mini-goals'], cool: 'Easy passing + mobility', mains: [
    { name: 'Positional game 8v8+3', detail: 'Keep the ball under positional rules; switch the point of attack to progress.', equip: ['Cones', 'Bibs', 'Balls'], points: ['Body shape to receive', 'Switch to the free side'] },
    { name: 'Build-up to targets', detail: 'Play from the GK past a mid-block to target players in the final third.', equip: ['Full goal', 'Mini-goals', 'Mannequins'], points: ['Pivot drops to a 3', 'Width from full-backs'] },
  ] },
  Pressing: { base: ['Bibs (3 colours)', 'Cones', 'GPS vests'], cool: 'Down-regulation jog + stretch', mains: [
    { name: 'Pressing rondo 6v3+3', detail: 'Win it back inside 6 seconds on the trigger, then transition to the next box.', equip: ['Cones', 'Bibs', 'Balls'], points: ['Trigger = back-pass / heavy touch', 'First presser sets the angle'] },
    { name: 'Press shape 11v11', detail: 'Front line presses build-up; midfield and back line step as a unit to compress.', equip: ['Full goals', 'Mannequins', 'Bibs'], points: ['Pin the full-back', 'Step together on the cue'] },
  ] },
  'Set Pieces': { base: ['Balls', 'Mannequins', 'Mini-goals'], cool: 'Static stretch', mains: [
    { name: 'Attacking corners', detail: 'Two delivery routines + a near-post flick variation; rehearse first-contact zones.', equip: ['Balls', 'Mannequins', 'Cones'], points: ['Attack the ball', 'Own the first-contact zone'] },
    { name: 'Defending set plays', detail: 'Zonal + man assignments, blocking the back-post runner, clearing the first contact.', equip: ['Balls', 'Bibs', 'Mannequins'], points: ['Block the runner early', 'Clear with height + distance'] },
  ] },
  Finishing: { base: ['Balls', 'Full goals', 'Mini-goals'], cool: 'Mobility + stretch', mains: [
    { name: 'Finishing carousel', detail: 'Two-touch finishing from cutbacks and through-balls; build rhythm and confidence.', equip: ['Balls', 'Full goals', 'Cones'], points: ['First touch sets the finish', 'Hit the target'] },
    { name: 'Crossing & finishing', detail: 'Wide overloads to deliver, with near/far-post and cutback runs to attack.', equip: ['Balls', 'Mannequins', 'Full goals'], points: ['Attack the cross with conviction', 'Time the run, not the ball'] },
  ] },
  Physical: { base: ['GPS vests', 'Cones', 'Hurdles'], cool: 'Cool-down jog + foam roll', mains: [
    { name: 'Speed & power', detail: 'Flying sprints, reactive starts and acceleration mechanics with full recovery between efforts.', equip: ['Timing gates', 'Cones', 'Hurdles'], points: ['Quality mechanics', 'Full rest = full speed'] },
    { name: 'Strength circuit', detail: 'Trap-bar deadlift, Nordics and single-leg work; ACL-prevention emphasis, individualised loads.', equip: ['Trap bars', 'Dumbbells', 'Nordic bench', 'Bands'], points: ['Nordics every week', 'Match load to readiness'] },
  ] },
  'Match Prep': { base: ['Bibs', 'Mannequins', 'Full goals', 'Tactics board'], cool: 'Cool-down + refuel', mains: [
    { name: 'Tactical walk-through', detail: 'Shadow-play the matchday shape: triggers, build-up exits, set-piece roles.', equip: ['Mannequins', 'Tactics board', 'Bibs'], points: ['Every player owns a role', 'Rehearse the restarts'] },
    { name: '11v11 game-plan rehearsal', detail: 'Opposition-shaped bench; conditioned scoring rewards the game plan.', equip: ['Full goals', 'Bibs', 'Balls'], points: ['Win high, score fast', 'Execute the match-ups'] },
  ] },
  Recovery: { base: ['Foam rollers', 'Mobility bands', 'Mats'], cool: 'Breathing + mobility', mains: [
    { name: 'Pool regeneration', detail: 'Contrast therapy + easy aqua-jog intervals + mobility flows to flush match load.', equip: ['Pool', 'Float belts'], points: ['Keep HR low', 'Cold 2–3 min max'] },
    { name: 'Mobility + soft tissue', detail: 'Foam-roll circuit and band mobility, physio hands-on for flagged players.', equip: ['Foam rollers', 'Bands', 'Mats'], points: ['Target stressed areas', 'No loaded strength'] },
  ] },
}

function generatePlan(inp: { type: string; duration: string; squad: string; intensity: string; area: string; phase: string; theme: string }): SessionPlan {
  const lib = TYPE_LIB[inp.type] ?? TYPE_LIB.Tactical
  const dur = parseInt(inp.duration) || 90
  const warm = inp.intensity === 'High' ? 15 : 12
  const cool = 10
  const mainTotal = Math.max(24, dur - warm - cool)
  const nMain = Math.min(2, lib.mains.length)
  const per = Math.round(mainTotal / nMain)
  const blocks: Phase[] = []
  blocks.push({
    name: inp.intensity === 'High' ? 'RAMP warm-up' : 'Activation warm-up', mins: warm,
    detail: inp.intensity === 'High' ? 'Raise/activate/mobilise/potentiate with 2 progressive sprints to prime for high-speed work.' : 'Dynamic activation and a ball circuit to raise tempo and switch on.',
    players: inp.squad, equipment: ['Cones', 'Balls', 'GPS vests', ...(inp.intensity === 'High' ? ['Hurdles'] : [])],
    points: ['Progressive intensity', inp.intensity === 'High' ? 'Two max efforts before main block' : 'Mobilise key joints'],
  })
  lib.mains.slice(0, nMain).forEach((m, i) => blocks.push({
    name: `Main ${i + 1} — ${m.name}`, mins: per, detail: m.detail, players: inp.squad,
    equipment: [...new Set([...m.equip, ...lib.base])], points: m.points,
  }))
  blocks.push({ name: 'Cool-down', mins: cool, detail: lib.cool, players: inp.squad, equipment: ['Mats', 'Balls'], points: ['Down-regulate properly', 'Refuel within 30 min'] })

  const f = inp.intensity === 'High' ? 1 : inp.intensity === 'Medium' ? 0.78 : 0.5
  const km = (dur / 90 * 7.2 * f)
  const gps: Gps = {
    distance: km.toFixed(1) + ' km',
    hiSpeed: Math.round(km * 100 * f) + ' m',
    sprints: String(Math.round(28 * (dur / 90) * f)),
    rpe: Math.min(9, Math.round((f * 9))) + ' / 10',
  }
  return {
    id: 'plan-' + Math.random().toString(36).slice(2, 8),
    title: `${inp.theme} — ${inp.type}`, type: inp.type, duration: inp.duration, intensity: inp.intensity,
    squad: inp.squad, area: inp.area, phase: inp.phase, theme: inp.theme,
    blocks, gps, createdBy: 'AI session builder', tag: 'New',
  }
}

const SEED_PLANS: SessionPlan[] = [
  generatePlan({ type: 'Pressing', duration: '90 min', squad: '22 players', intensity: 'High', area: 'Full pitch', phase: 'MD-5 (load)', theme: 'High press & triggers' }),
  generatePlan({ type: 'Set Pieces', duration: '60 min', squad: '20 players', intensity: 'Medium', area: 'Final third', phase: 'MD-2', theme: 'Set-piece routines' }),
  generatePlan({ type: 'Recovery', duration: '60 min', squad: '24 players', intensity: 'Low', area: 'Boxes / channels', phase: 'MD+1 (recover)', theme: 'Regeneration' }),
].map((p, i) => ({ ...p, createdBy: ['Sarah Frost (Head Coach)', 'Set-piece coach', 'Sports science'][i], tag: undefined }))

// ─── Load report data ──────────────────────────────────────────────────────
type GpsRow = { player: string; pos: string; distance: number; hiSpeed: number; sprints: number; maxSpeed: number; acwr: number; load: 'optimal' | 'high' | 'overload' }
const GPS_DATA: GpsRow[] = [
  { player: 'L. Barker',   pos: 'CM', distance: 10.4, hiSpeed: 880, sprints: 24, maxSpeed: 28.8, acwr: 1.05, load: 'optimal' },
  { player: 'D. Morris',   pos: 'LW', distance: 10.2, hiSpeed: 820, sprints: 28, maxSpeed: 30.2, acwr: 1.10, load: 'optimal' },
  { player: 'Z. Williams', pos: 'ST', distance: 9.8,  hiSpeed: 760, sprints: 26, maxSpeed: 29.8, acwr: 1.02, load: 'optimal' },
  { player: 'J. Tilley',   pos: 'RW', distance: 10.6, hiSpeed: 940, sprints: 32, maxSpeed: 30.6, acwr: 1.34, load: 'high' },
  { player: 'P. Granger',  pos: 'CDM',distance: 10.4, hiSpeed: 700, sprints: 20, maxSpeed: 28.0, acwr: 0.98, load: 'optimal' },
  { player: 'N. Carter',   pos: 'CAM',distance: 10.5, hiSpeed: 840, sprints: 28, maxSpeed: 30.0, acwr: 1.28, load: 'high' },
  { player: 'C. Porter',   pos: 'CB', distance: 9.4,  hiSpeed: 620, sprints: 22, maxSpeed: 28.8, acwr: 0.92, load: 'optimal' },
  { player: 'K. Okonkwo',  pos: 'RB', distance: 10.4, hiSpeed: 820, sprints: 28, maxSpeed: 30.4, acwr: 1.06, load: 'optimal' },
  { player: 'S. Foley',    pos: 'LB', distance: 10.7, hiSpeed: 900, sprints: 27, maxSpeed: 30.1, acwr: 1.12, load: 'optimal' },
  { player: 'M. Brennan',  pos: 'CB', distance: 9.6,  hiSpeed: 640, sprints: 19, maxSpeed: 28.2, acwr: 0.88, load: 'optimal' },
  { player: 'A. Reid',     pos: 'CB', distance: 9.8,  hiSpeed: 700, sprints: 21, maxSpeed: 28.9, acwr: 1.41, load: 'overload' },
  { player: 'E. Hayes',    pos: 'GK', distance: 5.2,  hiSpeed: 120, sprints: 4,  maxSpeed: 24.0, acwr: 0.95, load: 'optimal' },
]
const WEEK_LOAD = [
  { day: 'Mon', au: 180 }, { day: 'Tue', au: 720 }, { day: 'Wed', au: 480 },
  { day: 'Thu', au: 650 }, { day: 'Fri', au: 300 }, { day: 'Sat', au: 90 }, { day: 'Sun', au: 980 },
]

// ─── Recovery data ─────────────────────────────────────────────────────────
const RECOVERY_GROUPS = [
  { group: 'Group 1 — High minutes', who: 'Match starters 80+ min', protocol: 'Cold-first contrast, compression, +1h sleep target, lighter MD+1', color: C.bad },
  { group: 'Group 2 — Rotation', who: '45–80 min / fatigued', protocol: 'Standard pool flush, mobility, normal MD+1 load', color: C.warn },
  { group: 'Group 3 — Low minutes / unused', who: 'Bench < 45 min', protocol: 'Top-up conditioning MD+1, full training load', color: C.good },
]
const RECOVERY_SCHEDULE = [
  { day: 'Mon (MD+1)', items: ['Pool contrast 20 min', 'Soft-tissue / physio', 'Sleep audit review', 'Wellness screening'] },
  { day: 'Wed (MD-4)', items: ['Post-gym foam roll', 'Compression boots 20 min', 'Hydration check'] },
  { day: 'Fri (MD-2)', items: ['Light mobility', 'Sleep + nutrition brief', 'Optional massage slots'] },
  { day: 'Sun (MD)',   items: ['Post-match refuel < 30 min', 'Compression on travel', 'Cold immersion on return'] },
]
const RECOVERY_FLAGS = [
  { player: 'M. Hughes', note: 'Grade 2 hamstring — RTP graded, no max sprints until MD-3', tone: C.warn },
  { player: 'T. Brooks', note: 'Concussion protocol — graded return to contact, symptom-free 48h', tone: C.warn },
  { player: 'A. Reid',   note: 'ACWR 1.41 (overload) — modify Thursday high-speed volume', tone: C.bad },
  { player: 'S. Turner', note: 'ACL RTP Phase 3 — gym + non-contact only, on-track', tone: C.blue },
]

// ─── Small UI helpers ──────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-2" style={{ backgroundColor: `${color}18` }}><Icon size={14} style={{ color }} /></div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
    </div>
  )
}
function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: `${color}1a`, color }}>{children}</span>
}

function PlanBlocks({ blocks, gps }: { blocks: Phase[]; gps: Gps }) {
  const equip = [...new Set(blocks.flatMap(b => b.equipment))]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[['Distance', gps.distance], ['Hi-speed', gps.hiSpeed], ['Sprints', gps.sprints], ['Target RPE', gps.rpe]].map(([k, v]) => (
          <div key={k} className="rounded-lg p-2.5" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="text-[10px]" style={{ color: C.muted }}>{k}</div>
            <div className="text-sm font-bold" style={{ color: C.text }}>{v}</div>
          </div>
        ))}
      </div>
      {blocks.map((b, i) => (
        <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold" style={{ color: C.text }}>{b.name}</span>
            <Chip color={C.primary}><Timer size={10} className="inline mr-1" />{b.mins} min</Chip>
          </div>
          <p className="text-xs mb-2" style={{ color: C.text2 }}>{b.detail}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <span style={{ color: C.muted }}><Users size={11} className="inline mr-1" style={{ color: C.blue }} />{b.players}</span>
            <span style={{ color: C.muted }}><Dumbbell size={11} className="inline mr-1" style={{ color: C.warn }} />{b.equipment.join(', ')}</span>
          </div>
          {b.points.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {b.points.map((p, j) => <li key={j} className="text-[11px] flex items-start gap-1.5" style={{ color: C.textSec }}><Target size={10} className="mt-0.5 shrink-0" style={{ color: C.primary }} />{p}</li>)}
            </ul>
          )}
        </div>
      ))}
      <div className="rounded-lg p-3" style={{ backgroundColor: `${C.warn}10`, border: `1px solid ${C.warn}30` }}>
        <div className="text-[11px] font-bold mb-1" style={{ color: C.warn }}><Dumbbell size={11} className="inline mr-1" />Equipment checklist</div>
        <div className="text-[11px]" style={{ color: C.text2 }}>{equip.join(' · ')}</div>
      </div>
    </div>
  )
}

type Tab = string

export default function WomensTrainingView() {
  const [tab, setTab] = useState<Tab>('tue')
  const [plans, setPlans] = useState<SessionPlan[]>(SEED_PLANS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [builder, setBuilder] = useState(false)
  const [form, setForm] = useState({ type: 'Tactical', duration: '90 min', squad: '22 players', intensity: 'High', area: 'Full pitch', phase: 'MD-5 (load)', theme: 'High press & triggers' })

  const openBuilder = () => { setTab('sessions'); setBuilder(true) }
  const submit = () => {
    const plan = generatePlan(form)
    setPlans(p => [plan, ...p]); setExpanded(plan.id); setBuilder(false)
  }

  const dayTabs = DAYS.map(d => ({ id: d.key, label: d.day.slice(0, 3) }))
  const featTabs = [{ id: 'sessions', label: 'Session Plans' }, { id: 'load', label: 'Load Report' }, { id: 'recovery', label: 'Recovery' }]
  const day = DAYS.find(d => d.key === tab)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Training</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>Weekly plan · session builder · GPS load · recovery — a full coaching workspace for the week.</p>
      </div>

      {/* Header action buttons (live) */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={openBuilder} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: C.primary, color: '#fff' }}><Clipboard size={12} />New Session Plan</button>
        <button onClick={() => setTab('load')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: C.primary, color: '#fff' }}><BarChart3 size={12} />Load Report</button>
        <button onClick={() => setTab('recovery')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: C.primary, color: '#fff' }}><Heart size={12} />Recovery Schedule</button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Today's Session" value="10:00" icon={Clock} color={C.primary} />
        <StatCard label="This Week" value="MD-5 → MD" icon={Clipboard} color={C.blue} />
        <StatCard label="Avg Load (7d)" value="68%" icon={Activity} color={C.good} />
        <StatCard label="Recovery Groups" value="3" icon={Heart} color={C.warn} />
      </div>

      {/* Tab bar: days + feature tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {dayTabs.map(t => {
          const active = tab === t.id
          const d = DAYS.find(x => x.key === t.id)!
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, background: 'transparent', padding: '9px 13px', fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.textSec, borderBottom: `2px solid ${active ? C.primary : 'transparent'}`, marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.25 }}>
              <span>{t.label}</span>
              <span style={{ fontSize: 8.5, color: active ? intColor(d.intensity) : C.muted, fontWeight: 700 }}>{d.mdTag}</span>
            </button>
          )
        })}
        <span style={{ width: 1, height: 22, background: C.borderHi, margin: '0 6px', flexShrink: 0 }} />
        {featTabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, background: 'transparent', padding: '9px 13px', fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.textSec, borderBottom: `2px solid ${active ? C.primary : 'transparent'}`, marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.label}</button>
          )
        })}
      </div>

      {/* DAY DETAIL */}
      {day && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: `linear-gradient(135deg, ${C.primary}1a, ${C.cardAlt})`, border: `1px solid ${C.border}` }}>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black" style={{ color: C.text }}>{day.day}</h3>
                  <Chip color={intColor(day.intensity)}>{day.mdTag} · {day.intensity}</Chip>
                </div>
                <p className="text-sm font-semibold mt-0.5" style={{ color: C.primary }}>{day.theme}</p>
                <p className="text-xs mt-1" style={{ color: C.textSec }}>{day.focus}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black" style={{ color: C.text }}>{day.sessionTime}</div>
                <div className="text-[10px]" style={{ color: C.muted }}>session start</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[day.am, day.pm].map((s, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] font-bold uppercase" style={{ color: C.muted }}>{i === 0 ? 'AM' : 'PM'}</div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{s.title}</div>
                  <div className="text-[11px] mt-0.5 flex flex-wrap gap-x-3" style={{ color: C.textSec }}><span>{s.type}</span><span><Timer size={10} className="inline mr-0.5" />{s.duration}</span><span><MapPin size={10} className="inline mr-0.5" />{s.location}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
            <h4 className="text-sm font-bold mb-3" style={{ color: C.text }}>Session breakdown</h4>
            <PlanBlocks blocks={day.blocks} gps={day.gps} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: C.text }}><Target size={13} className="inline mr-1.5" style={{ color: C.primary }} />Coaching points</h4>
              <ul className="space-y-1.5">{day.coachingPoints.map((p, i) => <li key={i} className="text-xs flex items-start gap-2" style={{ color: C.text2 }}><CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: C.good }} />{p}</li>)}</ul>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: C.text }}><Users size={13} className="inline mr-1.5" style={{ color: C.blue }} />Squad availability</h4>
              <p className="text-xs" style={{ color: C.text2 }}>{day.availability}</p>
              <div className="mt-3 rounded-lg p-2.5" style={{ backgroundColor: `${C.good}10`, border: `1px solid ${C.good}30` }}>
                <div className="text-[11px] font-bold" style={{ color: C.good }}><Gauge size={11} className="inline mr-1" />Session GPS target</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.text2 }}>{day.gps.distance} · {day.gps.hiSpeed} hi-speed · {day.gps.sprints} sprints · RPE {day.gps.rpe}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSION PLANS */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold" style={{ color: C.text }}>Session Plan Library</h3>
              <p className="text-xs" style={{ color: C.textSec }}>{plans.length} plans · build a new one with the AI session builder</p>
            </div>
            <button onClick={() => setBuilder(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: C.primary, color: '#fff' }}><Plus size={13} />New session plan</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {plans.map(p => (
              <div key={p.id} className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${p.tag ? C.primary : C.border}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold" style={{ color: C.text }}>{p.title}</h4>
                      {p.tag && <Chip color={C.primary}>{p.tag}</Chip>}
                    </div>
                    <div className="text-[11px] mt-1 flex flex-wrap gap-x-3" style={{ color: C.textSec }}><span>{p.duration}</span><span>{p.area}</span><span>{p.phase}</span><span>{p.squad}</span></div>
                    <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>by {p.createdBy}</div>
                  </div>
                  <Chip color={intColor(p.intensity)}>{p.intensity}</Chip>
                </div>
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="mt-2 text-[11px] font-semibold" style={{ color: C.primary }}>{expanded === p.id ? 'Hide plan ▲' : 'View full plan ▼'}</button>
                {expanded === p.id && <div className="mt-3"><PlanBlocks blocks={p.blocks} gps={p.gps} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOAD REPORT */}
      {tab === 'load' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Weekly load (team AU)</h3>
            <div className="flex items-end gap-2 h-32">
              {WEEK_LOAD.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div className="w-full rounded-t" style={{ height: `${d.au / 980 * 100}%`, backgroundColor: d.au > 800 ? C.bad : d.au > 500 ? C.warn : C.primary, minHeight: 4 }} />
                  <span className="text-[10px]" style={{ color: C.muted }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
              <p className="text-sm font-semibold" style={{ color: C.text }}>GPS Training Load (latest session)</p>
              <span className="text-xs" style={{ color: C.muted }}>{GPS_DATA.length} players · ACWR flagged</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Pos', 'Distance', 'Hi-Speed', 'Sprints', 'Max Speed', 'ACWR', 'Load'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
                <tbody>
                  {GPS_DATA.map((g, i) => {
                    const lc = g.load === 'optimal' ? C.good : g.load === 'high' ? C.warn : C.bad
                    return (
                      <tr key={i} style={{ borderBottom: i < GPS_DATA.length - 1 ? `1px solid ${C.border}` : undefined }}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: C.text }}>{g.player}</td>
                        <td className="px-4 py-2.5" style={{ color: C.muted }}>{g.pos}</td>
                        <td className="px-4 py-2.5" style={{ color: C.textSec }}>{g.distance.toFixed(1)} km</td>
                        <td className="px-4 py-2.5" style={{ color: C.textSec }}>{g.hiSpeed} m</td>
                        <td className="px-4 py-2.5" style={{ color: C.textSec }}>{g.sprints}</td>
                        <td className="px-4 py-2.5" style={{ color: C.textSec }}>{g.maxSpeed.toFixed(1)} km/h</td>
                        <td className="px-4 py-2.5 font-mono font-bold" style={{ color: g.acwr > 1.3 ? C.bad : g.acwr < 0.8 ? C.warn : C.good }}>{g.acwr.toFixed(2)}</td>
                        <td className="px-4 py-2.5"><Chip color={lc}>{g.load.toUpperCase()}</Chip></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-2.5 text-[11px]" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>ACWR = acute:chronic workload ratio. Sweet spot 0.8–1.3; above 1.3 raises soft-tissue risk → modify load.</div>
          </div>
        </div>
      )}

      {/* RECOVERY */}
      {tab === 'recovery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RECOVERY_GROUPS.map(g => (
              <div key={g.group} className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}`, borderTop: `3px solid ${g.color}` }}>
                <div className="text-sm font-bold" style={{ color: C.text }}>{g.group}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{g.who}</div>
                <p className="text-xs mt-2" style={{ color: C.text2 }}>{g.protocol}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: C.text }}>Recovery schedule</h4>
              <div className="space-y-2.5">
                {RECOVERY_SCHEDULE.map(r => (
                  <div key={r.day}>
                    <div className="text-[11px] font-bold mb-1" style={{ color: C.primary }}>{r.day}</div>
                    <div className="flex flex-wrap gap-1.5">{r.items.map(it => <span key={it} className="px-2 py-0.5 rounded-md text-[10px]" style={{ backgroundColor: C.panel2, color: C.text2, border: `1px solid ${C.border}` }}>{it}</span>)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <h4 className="text-sm font-bold mb-3" style={{ color: C.text }}>Individual flags</h4>
              <div className="space-y-2">
                {RECOVERY_FLAGS.map(f => (
                  <div key={f.player} className="rounded-lg p-2.5 flex items-start gap-2" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
                    <Heart size={13} className="mt-0.5 shrink-0" style={{ color: f.tone }} />
                    <div><span className="text-xs font-bold" style={{ color: C.text }}>{f.player}</span><span className="text-[11px]" style={{ color: C.text2 }}> — {f.note}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI SESSION BUILDER MODAL */}
      {builder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setBuilder(false)}>
          <div onClick={e => e.stopPropagation()} className="rounded-2xl w-full" style={{ maxWidth: 540, backgroundColor: C.card, border: `1px solid ${C.borderHi}`, maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2"><Sparkles size={16} style={{ color: C.primary }} /><span className="text-sm font-bold" style={{ color: C.text }}>AI Session Builder</span></div>
              <button onClick={() => setBuilder(false)}><X size={18} style={{ color: C.muted }} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs" style={{ color: C.textSec }}>Tell the assistant what you want — it builds a full plan with phases, equipment, coaching points and a GPS load target.</p>
              {([
                ['Session type', 'type', SESSION_TYPES as unknown as string[]],
                ['Duration', 'duration', DURATIONS],
                ['Squad size', 'squad', ['16 players', '18 players', '20 players', '22 players', '24 players']],
                ['Intensity', 'intensity', INTENSITIES],
                ['Pitch area', 'area', AREAS],
                ['Phase of week', 'phase', PHASES],
                ['Focus theme', 'theme', THEMES],
              ] as [string, keyof typeof form, string[]][]).map(([label, key, opts]) => (
                <div key={key as string}>
                  <label className="text-[11px] font-semibold" style={{ color: C.muted }}>{label}</label>
                  <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full mt-1 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: C.panel2, color: C.text, border: `1px solid ${C.border}` }}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-[10px]" style={{ color: C.muted }}>Demo — generated locally, no live AI call.</span>
              <button onClick={submit} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: C.primary, color: '#fff' }}><Sparkles size={13} />Generate session plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
