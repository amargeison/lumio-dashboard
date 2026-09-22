// The shape of a student's page, and the one place that decides whether the
// person reading it is an adult player or a child's parent.
//
// Two very different callers fill this in: the coach portal, which reads the
// academy's tables directly with the head coach's own access, and the parent
// portal, which gets a bundle assembled server-side and scoped to exactly one
// child. They agree on this type and nothing else, which is what lets one view
// serve both.

import type { StudentNextSession } from './next-session'
export type { StudentNextSession }

/** Mirrors the coach's feature flags (see _lib/feature-flags.ts). */
export type StudentFeatures = { effort?: boolean; video?: boolean; audio?: boolean; racket?: boolean }

export type StudentPlayer = {
  id: string
  name: string
  nickname?: string | null
  age?: number | null
  category?: string | null          // Junior | Performance | Adult
  level?: string | null
  racket_stage?: string | null
  goal?: string | null
  avatar_url?: string | null
  parent_name?: string | null
  parent_email?: string | null
  xp_total?: number | null
}

export type StudentSkill = { skill: string; score: number }

export type StudentReview = {
  focus?: string; covered?: string[]; takeaways?: string[]; drills?: string[]
  homework?: string; nextFocus?: string; coachNote?: string; rating?: number
  skillsWorked?: string[]; type?: string; recap?: string
}

export type StudentLesson = {
  id: string
  session_date: string | null
  focus: string | null
  summary: string | null
  ai_review?: string | null
  review_json?: StudentReview | null
  rating?: number | null
}

export type StudentClip = {
  id: string
  title: string | null
  shot_type?: string | null
  duration_seconds?: number | null
  created_at?: string | null
  url?: string | null
}

export type StudentVoiceNote = {
  id: string
  title: string | null
  created_at?: string | null
  duration_seconds?: number | null
  url?: string | null
}

export type StudentWatchSession = {
  started_at: string | null
  duration_min?: number | null
  distance_m?: number | null
  avg_hr?: number | null
  max_hr?: number | null
  effort_score?: number | null
  movement_score?: number | null
  consistency_score?: number | null
  xp_awarded?: number | null
}

export type StudentResource = {
  id: string
  title: string
  category?: string | null
  format?: string | null
  racket?: string | null
  level?: string | null
  duration?: string | null
  notes?: string | null
  url?: string | null
}

// A camp the player is actually on. Assembled from coach_camp_attendees joined
// to coach_camps, so it exists only when they have a confirmed place.
export type StudentCamp = {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  location?: string | null
  region?: string | null
  audience?: string | null          // junior | adult | mixed
  board?: string | null
  daily_rhythm?: string | null
  description?: string | null
  overseas?: boolean | null
  itinerary?: unknown
  equipment?: unknown
  parent_brief?: unknown
  paid?: boolean | null
  status?: string | null            // confirmed | pending
  balance_link?: string | null
  /** The coach's one line on what the week is for. */
  intent?: string | null
  objectives?: unknown
  outcomes?: unknown
  /** The trip hub record — hotel, travel, taxis, where to eat, who to ring.
      Shared with everyone on the trip, so nothing player-specific lives here. */
  trip?: unknown
  /** THIS player's targets only. The API filters the camp's array down to the
      one row before it leaves the server — see /api/portal/player. */
  player_targets?: unknown
  /** From their own attendee row: where they sleep, when they land, and the one
      thing they are there to work on. */
  room?: string | null
  arrival?: string | null
  camp_goal?: string | null
}

// A book the coach has put in this player's hands. Denormalised on purpose —
// see migration 174.
export type StudentBook = {
  id: string
  title: string
  author?: string | null
  note?: string | null
  topic?: string | null
  spine?: string | null
}

export type StudentMessage = {
  id: string
  body: string
  subject?: string | null
  /** 'in' = from the player/parent, anything else = from the coach. */
  direction?: string | null
  from_name?: string | null
  created_at?: string | null
  /** The coach this was addressed to, when the sender picked one. */
  to_name?: string | null
  /** The message this answers — rendered as a quote above the body. */
  reply_to?: string | null
  /** One of 👍 ❤️ 😄 ✅ 🎾 🙌, the same set the coach's inbox uses. */
  reaction?: string | null
  /** Set on camp-wide messages. */
  camp_id?: string | null
}

/** Somebody the family can write to by name. */
export type StudentCoach = {
  id: string
  name: string
  role?: string | null
  avatar_url?: string | null
}

/** A camp conversation: everyone booked on it, and the coaches travelling. */
export type StudentCampThread = {
  campId: string
  name: string
  /** How many people are in it, so "Camp · 9 people" is honest. */
  people: number
  messages: StudentMessage[]
}

export type StudentBundle = {
  player: StudentPlayer
  skills: StudentSkill[]
  lessons: StudentLesson[]
  clips: StudentClip[]
  voiceNotes: StudentVoiceNote[]
  watch: StudentWatchSession[]
  resources: StudentResource[]
  camps: StudentCamp[]
  /** The next booked lesson — when, where and what it covers. Built on the
      server (src/lib/student/next-session.ts); null when nothing is booked. */
  nextSession?: StudentNextSession | null
  /** Which of the coach's paid modules are live. A section whose module is off
      is not shown, however much data sits behind it — see studentSectionOn.
      Undefined means "not known yet" and nothing is gated on it. */
  features?: StudentFeatures | null
  /** Books the coach recommended to this player specifically. */
  books: StudentBook[]
  /** The conversation with the coach, newest first. */
  messages: StudentMessage[]
  /** The coaching team, so a family can write to a person rather than a club. */
  coaches?: StudentCoach[]
  /** One thread per camp they are on — families and coaches together. */
  campThreads?: StudentCampThread[]
  /** Section keys the coach has switched off (settings.sectionsOff.student). */
  sectionsOff: string[]
  /** Mastery score that counts as "earned" (settings.awardThreshold, 3 or 4). */
  awardThreshold: number
}

// ── Who is reading this page ────────────────────────────────────────────────
//
// Three answers, not two. "Adult" and "junior" are both confident readings and
// each gets its own voice; the third is for a player with no age, no category
// and no parent on file, where guessing wrong is worse than staying neutral —
// an adult told "here's how Alex is getting on" reads oddly, but a parent
// greeted with "here's where YOU are at" reads as though the academy has lost
// track of who the player is.

export type StudentAudience = 'adult' | 'junior' | 'unknown'

export type StudentFraming = {
  audience: StudentAudience
  /** First name, or the whole name if there is only one word. */
  first: string
  /** "Your" / "Mia's" — use at the start of a title. */
  possessive: string
  /** "your" / "Mia's" — mid-sentence. */
  possessiveLower: string
  /** "you" / "Mia" */
  subject: string
  greeting: string
}

export function studentAudience(p: Pick<StudentPlayer, 'category' | 'age' | 'parent_name' | 'parent_email'>): StudentAudience {
  if ((p.category || '').trim().toLowerCase() === 'adult') return 'adult'
  if (typeof p.age === 'number' && p.age >= 18) return 'adult'
  if (typeof p.age === 'number' && p.age > 0 && p.age < 18) return 'junior'
  if ((p.parent_name || '').trim() || (p.parent_email || '').trim()) return 'junior'
  return 'unknown'
}

export function studentFraming(p: StudentPlayer): StudentFraming {
  const audience = studentAudience(p)
  const full = (p.nickname || p.name || '').trim()
  const first = full.split(/\s+/).filter(Boolean)[0] || full || 'your player'
  if (audience === 'adult') {
    return {
      audience, first,
      possessive: 'Your', possessiveLower: 'your', subject: 'you',
      greeting: 'Good to see you — here’s where you’re at',
    }
  }
  return {
    audience, first,
    possessive: `${first}’s`, possessiveLower: `${first}’s`, subject: first,
    greeting: audience === 'junior'
      ? `Good to see you — here’s how ${first} is getting on`
      : `Here’s how ${first} is getting on`,
  }
}

// ── Small shared derivations ────────────────────────────────────────────────

/** Homework and next focus come from the most recent lesson that carries them. */
export function latestGuidance(lessons: StudentLesson[]): { homework: string; nextFocus: string; from: StudentLesson | null } {
  for (const l of lessons) {
    const r = l.review_json || {}
    if ((r.homework || '').trim() || (r.nextFocus || '').trim()) {
      return { homework: (r.homework || '').trim(), nextFocus: (r.nextFocus || '').trim(), from: l }
    }
  }
  return { homework: '', nextFocus: '', from: lessons[0] || null }
}

/** A camp is on the student's page from the moment they are booked until it ends. */
export function activeCamps(camps: StudentCamp[], today = new Date()): StudentCamp[] {
  const key = today.toISOString().slice(0, 10)
  return camps
    .filter(c => {
      const ends = (c.end_date || c.start_date || '').slice(0, 10)
      return !ends || ends >= key
    })
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
}

export function daysUntil(dateISO: string | null | undefined, today = new Date()): number | null {
  if (!dateISO) return null
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}

/** jsonb columns arrive as unknown — coerce to a list of strings for display. */
export function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map(x => {
      if (typeof x === 'string') return x
      if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>
        return String(o.label ?? o.name ?? o.item ?? o.title ?? o.text ?? '').trim()
      }
      return String(x ?? '').trim()
    }).filter(Boolean)
  }
  if (typeof v === 'string') return v.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
  return []
}
