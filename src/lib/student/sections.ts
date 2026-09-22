// The student app's sections, in the order they appear, as ONE list.
//
// This registry is the single source of truth for three things that used to be
// three separate lists waiting to drift: what the view renders, what the coach
// can switch off in Settings, and what the parent portal shows. Add a section
// here and it appears in all three.
//
// Deliberately dependency-free — the settings store, the coach portal and the
// public parent portal all import it, and a cycle through any of them would be
// a build error rather than a design.

export type StudentSectionKey =
  | 'progress' | 'nextsession' | 'camp' | 'highlights' | 'report' | 'rewards'
  | 'racket' | 'homework' | 'lessons' | 'resources' | 'messages'

export type StudentSection = {
  key: StudentSectionKey
  label: string
  blurb: string
  /** Always on. The header IS the page — switching it off leaves nothing. */
  locked?: boolean
}

export const STUDENT_SECTIONS: StudentSection[] = [
  { key: 'progress',   label: 'Progress header',       blurb: 'Photo, racket level and the goal you set together.', locked: true },
  { key: 'nextsession', label: 'Next session',         blurb: 'When and where the next lesson is, with a map and what the coach is planning to cover.' },
  { key: 'camp',       label: 'Camp',                  blurb: 'Turns on by itself once they are booked on a camp, and off when it finishes.' },
  { key: 'highlights', label: 'Session highlights',    blurb: 'Clips you saved from sessions, plus your voice notes.' },
  { key: 'report',     label: 'Session report',        blurb: 'Distance, speed and heart rate from a tracked session.' },
  { key: 'rewards',    label: 'Effort & rewards',      blurb: 'XP, effort level and the three session scores.' },
  { key: 'racket',     label: 'Racket progression',    blurb: 'The racket ladder and how far through the current one they are.' },
  { key: 'homework',   label: "Homework & what's next", blurb: 'What to practise before the next lesson.' },
  { key: 'lessons',    label: 'Recent lessons',        blurb: 'Your lesson summaries and coach notes.' },
  { key: 'resources',  label: 'Recommended resources', blurb: 'Drills, guides and books you have recommended for them.' },
  { key: 'messages',   label: 'Messages',              blurb: 'Your conversation with the player or parent — they can reply from their page.' },
]

/** For the Settings card — everything the coach is allowed to switch off. */
export const STUDENT_TOGGLEABLE = STUDENT_SECTIONS.filter(s => !s.locked)

// A section is shown when the coach has not switched it off AND there is
// something in it. Emptiness is decided by the caller, because only it knows
// whether a clip list came back empty or simply has not loaded yet.
export function studentSectionOn(key: StudentSectionKey, off: string[] | undefined, hasData: boolean): boolean {
  if (key !== 'progress' && (off || []).includes(key)) return false
  return hasData
}
