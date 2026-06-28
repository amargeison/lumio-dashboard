'use client'

// The Lumio starter resource library — the curated drills, technique videos,
// plans and worksheets, tagged to the racket system. Seeded into coach_resources
// when a coach chooses "load Lumio resources" (onboarding or Settings). Columns
// match coach_resources: title, category(kind), format, level, duration, racket,
// tags, url, notes(description).

import { sb, currentCoachId } from './coach-db'

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`

export const LUMIO_RESOURCES: Record<string, any>[] = [
  { title: 'Split-step & first-move reaction', category: 'Drill', level: 'Beginner', format: 'Video', duration: '4 min', racket: 'white', tags: 'movement, warm-up', notes: 'Reaction-cue split-step ladder for foundation movers.', url: yt('J1UhPl1UrYs') },
  { title: 'Low-to-high topspin forehand', category: 'Technique', level: 'Intermediate', format: 'Video', duration: '7 min', racket: 'blue', tags: 'forehand, spin', notes: 'Frame-by-frame swing path for heavy topspin.', url: yt('KV9DTSNkLAg') },
  { title: 'Kick serve in 5 steps', category: 'Technique', level: 'Advanced', format: 'Video', duration: '9 min', racket: 'brown', tags: 'serve, spin', notes: 'Build a reliable kick serve from toss to pronation.', url: null },
  { title: '8-week Green-racket block', category: 'Training plan', level: 'Intermediate', format: 'Plan', duration: '8 weeks', racket: 'green', tags: 'serve, periodisation', notes: 'Periodised plan to earn the Green racket serve criteria.', url: null },
  { title: 'Cross-court rally targets', category: 'Drill', level: 'All levels', format: 'PDF', duration: null, racket: 'yellow', tags: 'consistency, rally', notes: 'Printable court targets for rally depth & direction.', url: null },
  { title: 'Net play & volley progression', category: 'Drill', level: 'Intermediate', format: 'Video', duration: '6 min', racket: 'orange', tags: 'volley, net', notes: 'Feed sequence from block volley to closing the net.', url: null },
  { title: 'Footwork agility ladder set', category: 'Fitness', level: 'All levels', format: 'PDF', duration: '15 min', racket: null, tags: 'movement, warm-up', notes: 'Off-court ladder routine for split-step speed.', url: null },
  { title: 'Compete: reset routine card', category: 'Mental', level: 'Advanced', format: 'Worksheet', duration: null, racket: 'black', tags: 'mental, routines', notes: 'Between-points reset & breathing routine worksheet.', url: null },
  { title: 'Serve+1 forehand patterns', category: 'Drill', level: 'Advanced', format: 'Video', duration: '8 min', racket: 'red', tags: 'patterns, tactics', notes: 'Three go-to serve+1 patterns and how to drill them.', url: null },
  { title: 'Parent guide: ball stages', category: 'Training plan', level: 'Beginner', format: 'PDF', duration: null, racket: null, tags: 'parents, red-orange-green', notes: 'Explains the red/orange/green/yellow ball pathway for parents.', url: null },
  { title: 'Drop shot & touch session', category: 'Technique', level: 'Intermediate', format: 'Video', duration: '5 min', racket: 'purple', tags: 'touch, specialty', notes: 'Disguised drop shot mechanics and feel drills.', url: null },
  { title: 'Match-play tactics worksheet', category: 'Mental', level: 'Advanced', format: 'Worksheet', duration: null, racket: 'red', tags: 'tactics, scouting', notes: 'Pre-match plan and opponent-read worksheet.', url: null },

  // — Technique —
  { title: 'Two-handed backhand fundamentals', category: 'Technique', level: 'Beginner', format: 'Video', duration: '6 min', racket: 'yellow', tags: 'backhand, technique', notes: 'Grip, unit turn and contact point for a reliable two-hander.', url: null },
  { title: 'Slice backhand: stay low & carve', category: 'Technique', level: 'Intermediate', format: 'Video', duration: '5 min', racket: 'blue', tags: 'backhand, slice', notes: 'Knife-edge slice for defence, approach and variety.', url: null },
  { title: 'Flat serve mechanics & toss', category: 'Technique', level: 'Intermediate', format: 'Video', duration: '8 min', racket: 'green', tags: 'serve, technique', notes: 'Trophy position, toss consistency and racket-drop timing.', url: null },
  { title: 'Open-stance forehand recovery', category: 'Technique', level: 'Advanced', format: 'Video', duration: '6 min', racket: 'red', tags: 'forehand, footwork', notes: 'Load, explode and recover from the open stance.', url: null },

  // — Training plan —
  { title: '6-week Orange-racket block', category: 'Training plan', level: 'Beginner', format: 'Plan', duration: '6 weeks', racket: 'orange', tags: 'periodisation, beginner', notes: 'Structured block to earn the Orange racket criteria.', url: null },
  { title: 'Pre-tournament 2-week taper', category: 'Training plan', level: 'Advanced', format: 'Plan', duration: '2 weeks', racket: 'red', tags: 'periodisation, competition', notes: 'Sharpen and taper into a target tournament week.', url: null },
  { title: 'Adult improver — 8-session plan', category: 'Training plan', level: 'Intermediate', format: 'Plan', duration: '8 weeks', racket: 'yellow', tags: 'adults, technique', notes: 'Eight-session pathway for returning adult players.', url: null },

  // — Fitness —
  { title: 'Dynamic warm-up routine', category: 'Fitness', level: 'All levels', format: 'PDF', duration: '10 min', racket: null, tags: 'warm-up, mobility', notes: 'On-court dynamic warm-up to prep for any session.', url: null },
  { title: 'Court sprints & recovery intervals', category: 'Fitness', level: 'Intermediate', format: 'PDF', duration: '20 min', racket: null, tags: 'conditioning, speed', notes: 'Tennis-specific interval set for match endurance.', url: null },
  { title: 'Core & rotational power circuit', category: 'Fitness', level: 'Advanced', format: 'PDF', duration: '25 min', racket: null, tags: 'strength, power', notes: 'Med-ball and core circuit for racket-head speed.', url: null },
  { title: 'Cool-down & mobility flow', category: 'Fitness', level: 'All levels', format: 'PDF', duration: '8 min', racket: null, tags: 'recovery, mobility', notes: 'Post-session stretch and mobility sequence.', url: null },

  // — Mental —
  { title: 'Pre-match focus routine', category: 'Mental', level: 'Intermediate', format: 'Worksheet', duration: null, racket: null, tags: 'routines, focus', notes: 'A simple pre-match routine to arrive ready to compete.', url: null },
  { title: 'Goal-setting & review sheet', category: 'Mental', level: 'All levels', format: 'Worksheet', duration: null, racket: null, tags: 'goals, review', notes: 'Termly goal-setting and self-review for players.', url: null },
  { title: 'Dealing with nerves & tight points', category: 'Mental', level: 'Advanced', format: 'Worksheet', duration: null, racket: 'black', tags: 'mental, pressure', notes: 'Tools for playing the big points freely.', url: null },

  // — Books / reading —
  { title: 'Winning Ugly — Brad Gilbert', category: 'Books', level: 'All levels', format: 'PDF', duration: null, racket: null, tags: 'tactics, reading', notes: 'Classic on match-craft and outthinking opponents.', url: null },
  { title: 'The Inner Game of Tennis — Gallwey', category: 'Books', level: 'All levels', format: 'PDF', duration: null, racket: null, tags: 'mental, reading', notes: 'The foundational text on the mental side of the game.', url: null },
  { title: 'Coaching reading list (junior pathway)', category: 'Books', level: 'Beginner', format: 'PDF', duration: null, racket: null, tags: 'coaching, parents', notes: 'Curated reading for coaches and parents of juniors.', url: null },
  { title: 'Periodisation for tennis — primer', category: 'Books', level: 'Advanced', format: 'PDF', duration: null, racket: null, tags: 'planning, reading', notes: 'A short primer on planning a player’s training year.', url: null },
]

// Insert the library for the current coach (skips if they already have these titles).
export async function seedLumioResources(): Promise<number> {
  const uid = await currentCoachId()
  if (!uid) return 0
  const existing = await sb().from('coach_resources').select('title').eq('coach_id', uid)
  const have = new Set((existing.data ?? []).map((r: any) => (r.title || '').toLowerCase()))
  const rows = LUMIO_RESOURCES.filter(r => !have.has(r.title.toLowerCase())).map(r => ({ ...r, coach_id: uid }))
  if (!rows.length) return 0
  const { error } = await sb().from('coach_resources').insert(rows)
  if (error) { console.error('[lumio-resources] seed', error.message); throw new Error(error.message) }
  return rows.length
}
