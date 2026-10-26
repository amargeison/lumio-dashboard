// The coach's private "about them" log on each client (pure — no database).
//
// The personal side a good coach remembers: the family, work, a holiday coming
// up, what they love outside tennis. It is the coach's own: never shown to the
// client or their family, never sent to Lumio Coach. A health note is special
// category data and is only kept for a client who has consented to health
// notes (the database refuses it otherwise — migration 219).

export type NoteKind = 'family' | 'work' | 'interests' | 'holidays' | 'health' | 'other'
export const NOTE_KINDS: { id: NoteKind; label: string; hint: string }[] = [
  { id: 'family', label: 'Family', hint: 'Partner, children, who brings them' },
  { id: 'work', label: 'Work', hint: 'Job, shifts, a busy season' },
  { id: 'interests', label: 'Interests', hint: 'Other sports, teams they follow, hobbies' },
  { id: 'holidays', label: 'Holidays', hint: 'Trips coming up, time away' },
  { id: 'health', label: 'Health', hint: 'Only with their consent to health notes' },
  { id: 'other', label: 'Other', hint: 'Anything else worth remembering' },
]
export const kindLabel = (k: string) => NOTE_KINDS.find(n => n.id === k)?.label || 'Other'

export type PlayerNote = { id: string; player_id: string; kind: NoteKind; text: string; noted_on: string; pinned?: boolean | null; created_at?: string }

/** Pinned first, then newest. */
export const sortNotes = <N extends Pick<PlayerNote, 'pinned' | 'noted_on' | 'created_at'>>(notes: N[]): N[] =>
  [...notes].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || String(b.noted_on).localeCompare(String(a.noted_on)) || String(b.created_at || '').localeCompare(String(a.created_at || '')))

/** A note is 1 to 1,000 characters; a health note needs consent. Returns the problem, or null. */
export function noteProblem(kind: string, text: string, consentMedical: boolean): string | null {
  const t = text.trim()
  if (!t) return 'Write the note first.'
  if (t.length > 1000) return 'Keep a note under 1,000 characters.'
  if (!NOTE_KINDS.some(n => n.id === kind)) return 'Choose what the note is about.'
  if (kind === 'health' && !consentMedical) return 'A health note can only be kept for a client who has consented to health notes. Record their consent on the Consent tab first.'
  return null
}
