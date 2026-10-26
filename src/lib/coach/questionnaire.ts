// The welcome questionnaire: "where I am now, where I want to be", what they
// like in lessons, and the other sessions they would join (pure — no database).
//
// Two versions, as Pete asked: a short one (about five minutes) for everyone,
// and a long one (closer to half an hour, with a rating for each part of their
// game) for clients who want to go into it properly. The coach chooses which
// to send. Every question has words for the player themselves and for a parent
// answering about a child.

export type Version = 'short' | 'long'
export type QKind = 'single' | 'multi' | 'text' | 'scale'
export type Question = {
  id: string; section: string; kind: QKind; versions: Version[]
  self: string; child: string; options?: string[]; optional?: boolean; hint?: string
}

export const SECTIONS: { id: string; title: string }[] = [
  { id: 'now', title: 'Where you are now' },
  { id: 'goals', title: 'Where you want to be' },
  { id: 'lessons', title: 'Your lessons' },
  { id: 'more', title: 'Anything else?' },
  { id: 'practical', title: 'When you can play' },
]

export const SCALE_PARTS = ['Forehand', 'Backhand', 'Serve', 'Return', 'Volleys and net play', 'Movement', 'Fitness', 'Match nerves'] as const
export const INTERESTS = ['Adult group sessions', 'Cardio tennis', 'Match play nights', 'Doubles sessions', 'Junior squad', 'Tennis holidays and trips', 'More private lessons'] as const

const BOTH: Version[] = ['short', 'long']
const LONG: Version[] = ['long']

export const QUESTIONS: Question[] = [
  { id: 'level', section: 'now', kind: 'single', versions: BOTH, self: 'Which best describes you as a player?', child: 'Which best describes {first} as a player?',
    options: ['Just starting out', 'Coming back after a break', 'Social or club player', 'League or team player', 'Competitive, playing tournaments'] },
  { id: 'years', section: 'now', kind: 'single', versions: BOTH, self: 'How long have you been playing?', child: 'How long has {first} been playing?',
    options: ['Under a year', '1 to 3 years', '3 to 10 years', 'More than 10 years'] },
  { id: 'often', section: 'now', kind: 'single', versions: BOTH, self: 'How often do you play now?', child: 'How often does {first} play now?',
    options: ['Less than once a week', 'Once a week', '2 or 3 times a week', '4 or more times a week'] },
  { id: 'game_now', section: 'now', kind: 'text', versions: BOTH, self: 'In a sentence or two, how would you describe your game right now?', child: 'In a sentence or two, how would you describe {first}’s game right now?' },
  { id: 'ratings', section: 'now', kind: 'scale', versions: LONG, self: 'How would you rate each part of your game?', child: 'How would you rate each part of {first}’s game?',
    options: [...SCALE_PARTS], hint: '1 needs a lot of work · 5 a real strength' },
  { id: 'best', section: 'now', kind: 'text', versions: LONG, optional: true, self: 'What is the best part of your game?', child: 'What is the best part of {first}’s game?' },
  { id: 'frustrates', section: 'now', kind: 'text', versions: LONG, optional: true, self: 'What frustrates you most when you play?', child: 'What frustrates {first} most when they play?' },
  { id: 'matches', section: 'now', kind: 'single', versions: LONG, self: 'Do you play matches?', child: 'Does {first} play matches?',
    options: ['No, not yet', 'Friendly matches', 'Club league or team', 'Tournaments, with a rating'] },

  { id: 'goals', section: 'goals', kind: 'multi', versions: BOTH, self: 'What would you most like from your tennis?', child: 'What would {first} most like from their tennis?',
    options: ['Enjoy it and keep fit', 'Rally more consistently', 'A better serve', 'Win more matches', 'Play doubles better', 'Compete in tournaments', 'Get back to my level after a break or injury', 'Make a team or squad'] },
  { id: 'goal_3m', section: 'goals', kind: 'text', versions: BOTH, self: 'What would you like to be able to do in three months’ time?', child: 'What would you like {first} to be able to do in three months’ time?' },
  { id: 'goal_12m', section: 'goals', kind: 'text', versions: LONG, optional: true, self: 'And in a year?', child: 'And in a year?' },
  { id: 'coached', section: 'goals', kind: 'single', versions: LONG, self: 'How do you like to be coached?', child: 'How does {first} like to be coached?',
    options: ['Show me', 'Explain why', 'Let me work it out', 'Video helps me', 'A mix of all of these'] },

  { id: 'likes', section: 'lessons', kind: 'multi', versions: BOTH, self: 'What do you enjoy most in lessons?', child: 'What does {first} enjoy most in lessons?',
    options: ['Drills and repetition', 'Match play and points', 'Video of my strokes', 'Fitness and movement', 'Technique', 'Tactics', 'Games and fun'] },
  { id: 'less_of', section: 'lessons', kind: 'text', versions: LONG, optional: true, self: 'Anything you would like less of?', child: 'Anything {first} would like less of?' },

  { id: 'interests', section: 'more', kind: 'multi', versions: BOTH, optional: true, self: 'Would you like to hear about any of these?', child: 'Would {first} like to hear about any of these?',
    options: [...INTERESTS] },

  { id: 'when', section: 'practical', kind: 'multi', versions: BOTH, optional: true, self: 'When can you usually play?', child: 'When can {first} usually play?',
    options: ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Saturdays', 'Sundays'] },
  { id: 'other_sport', section: 'practical', kind: 'text', versions: LONG, optional: true, self: 'Any other sport or exercise?', child: 'Any other sport or exercise?' },
]

export const questionsFor = (v: Version) => QUESTIONS.filter(q => q.versions.includes(v))
export const minutesFor = (v: Version) => (v === 'long' ? 15 : 5)

export const wordsFor = (q: Question, childFirst: string | null) => (childFirst ? q.child.replace(/\{first\}/g, childFirst) : q.self)

export type Answers = Record<string, string | string[] | Record<string, number>>

/** Keep only real answers to real questions: known options, short text, ratings 1 to 5. */
export function cleanAnswers(v: Version, raw: unknown): Answers {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const out: Answers = {}
  for (const q of questionsFor(v)) {
    const a = r[q.id]
    if (q.kind === 'single' && typeof a === 'string' && q.options?.includes(a)) out[q.id] = a
    else if (q.kind === 'multi' && Array.isArray(a)) { const pick = q.options!.filter(o => a.includes(o)); if (pick.length) out[q.id] = pick }
    else if (q.kind === 'text' && typeof a === 'string' && a.trim()) out[q.id] = a.trim().slice(0, 1000)
    else if (q.kind === 'scale' && a && typeof a === 'object') {
      const s: Record<string, number> = {}
      for (const part of q.options || []) { const n = Math.round(Number((a as Record<string, unknown>)[part])); if (n >= 1 && n <= 5) s[part] = n }
      if (Object.keys(s).length) out[q.id] = s
    }
  }
  return out
}

/** The questions still unanswered that need an answer. */
export function missing(v: Version, a: Answers): Question[] {
  return questionsFor(v).filter(q => !q.optional && (a[q.id] == null || (Array.isArray(a[q.id]) && !(a[q.id] as string[]).length)))
}

/** For the coach: each answered question in plain words. */
export function readable(v: Version, a: Answers): { section: string; q: string; a: string }[] {
  const out: { section: string; q: string; a: string }[] = []
  for (const q of questionsFor(v)) {
    const x = a[q.id]
    if (x == null) continue
    const text = typeof x === 'string' ? x : Array.isArray(x) ? x.join(', ') : Object.entries(x).map(([k, n]) => `${k} ${n}/5`).join(' · ')
    out.push({ section: SECTIONS.find(s => s.id === q.section)?.title || '', q: q.self, a: text })
  }
  return out
}

/** What they said they would like to hear about (for the coach's lists). */
export const interestsOf = (a: Answers | null | undefined): string[] => (Array.isArray(a?.interests) ? (a!.interests as string[]) : [])
