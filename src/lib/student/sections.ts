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
  /** The paid module this section belongs to. When that module is not live for
      the academy the section does not exist for the family, whatever data sits
      behind it and whatever the section toggle says. Declared here rather than
      checked at each render because a section added later would otherwise
      quietly default to visible — which is exactly how the racket ladder ended
      up on the pages of academies that do not have Racket Progression. */
  module?: StudentModuleKey
}

/** Mirrors FeatureKey in the coach portal's _lib/feature-flags.ts. */
export type StudentModuleKey = 'effort' | 'video' | 'audio' | 'racket'
export type StudentFeatureMap = Partial<Record<StudentModuleKey, boolean>>

export const STUDENT_SECTIONS: StudentSection[] = [
  { key: 'progress',   label: 'Progress header',       blurb: 'Photo, racket level and the goal you set together.', locked: true },
  { key: 'nextsession', label: 'Next session',         blurb: 'When and where the next lesson is, with a map and what the coach is planning to cover.' },
  { key: 'camp',       label: 'Camp',                  blurb: 'Turns on by itself once they are booked on a camp, and off when it finishes.' },
  { key: 'highlights', label: 'Session highlights',    blurb: 'Clips you saved from sessions, plus your voice notes.', module: 'video' },
  { key: 'report',     label: 'Session report',        blurb: 'Distance, speed and heart rate from a tracked session.', module: 'effort' },
  { key: 'rewards',    label: 'Effort & rewards',      blurb: 'XP, effort level and the three session scores.', module: 'effort' },
  { key: 'racket',     label: 'Racket progression',    blurb: 'The racket ladder and how far through the current one they are.', module: 'racket' },
  { key: 'homework',   label: "Homework & what's next", blurb: 'What to practise before the next lesson.' },
  { key: 'lessons',    label: 'Recent lessons',        blurb: 'Your lesson summaries and coach notes.' },
  { key: 'resources',  label: 'Recommended resources', blurb: 'Drills, guides and books you have recommended for them.' },
  { key: 'messages',   label: 'Messages',              blurb: 'Your conversation with the player or parent — they can reply from their page.' },
]

/** For the Settings card — everything the coach is allowed to switch off. */
export const STUDENT_TOGGLEABLE = STUDENT_SECTIONS.filter(s => !s.locked)

const MODULE_OF = new Map(STUDENT_SECTIONS.map(s => [s.key, s.module]))

// A section is shown when its MODULE is live for the academy, the coach has not
// switched it off, and there is something in it.
//
// The module check comes first and is not negotiable: a family whose academy is
// not on a plan with Racket Progression must not see a racket ladder, no matter
// how many skill rows the player has or what the section toggle happens to say.
//
// `features` undefined means we do not know yet — an academy whose coach has not
// opened their portal since the flags started travelling. Nothing is gated in
// that case, because hiding a section that has always worked on a guess is worse
// than the bug being fixed.
export function studentSectionOn(
  key: StudentSectionKey, off: string[] | undefined, hasData: boolean, features?: StudentFeatureMap | null,
): boolean {
  const mod = MODULE_OF.get(key)
  if (mod && features && features[mod] === false) return false
  if (key !== 'progress' && (off || []).includes(key)) return false
  return hasData
}
