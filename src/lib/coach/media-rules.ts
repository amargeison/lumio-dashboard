// What counts as a recording, and whether an academy has recordings switched on.
//
// One place, read by the browser (before a file leaves the coach's device) and
// by every server route that takes one in (sign, upload, process). They used to
// have no rule at all: the Video tab's picker only SUGGESTS video files, so a
// PDF chosen through "All files" or dropped on the page was uploaded, filed as
// an "audio recording", sent to the transcriber, and came back to the coach as
// a message about ffmpeg paths on the server.
//
// No imports, so both sides can read it. The two functions that touch the
// database are handed the caller's own client.

export type MediaKind = 'audio' | 'video'

// By file ending. mp4 and webm can hold either sound alone or pictures; the
// browser's own description of the file (below) settles those when it has one.
const VIDEO_EXT = new Set(['mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi', '3gp'])
const AUDIO_EXT = new Set(['mp3', 'm4a', 'wav', 'aac', 'ogg', 'oga', 'opus', 'flac', 'weba', 'amr', 'aiff', 'caf'])
// Sound-only files that arrive in a container video also uses.
const EITHER_EXT = new Set(['mp4', 'webm', '3gp'])

const extOf = (name?: string | null) => (/\.([a-z0-9]+)$/i.exec(name || '')?.[1] || '').toLowerCase()

/**
 * Is this file a sound recording, a video, or neither?
 * The browser's description ("video/mp4") wins when it gives one; the file
 * ending decides otherwise. Null means it is not a recording at all.
 */
export function mediaKindOf(fileName?: string | null, mime?: string | null): MediaKind | null {
  const type = (mime || '').toLowerCase()
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  // A description that is something else entirely (application/pdf, text/html)
  // is not a recording whatever the file is called.
  if (type && type !== 'application/octet-stream') return null
  const ext = extOf(fileName)
  if (VIDEO_EXT.has(ext)) return 'video'
  if (AUDIO_EXT.has(ext)) return 'audio'
  return null
}

/**
 * The server's check when the browser asks to upload `fileName` as `kind`.
 * It only has the name to go on (the bytes go straight to storage), so the
 * ending must be one that kind can have. Returns the reason, or null if fine.
 */
export function mediaNameProblem(kind: MediaKind, fileName?: string | null): string | null {
  const ext = extOf(fileName)
  const ok = kind === 'video' ? VIDEO_EXT.has(ext) : (AUDIO_EXT.has(ext) || EITHER_EXT.has(ext))
  return ok ? null : NOT_A_RECORDING[kind]
}

export const NOT_A_RECORDING: Record<MediaKind, string> = {
  video: 'That is not a video file, so it was not uploaded. Choose a video such as an MP4 or MOV.',
  audio: 'That is not an audio file, so it was not uploaded. Choose a recording such as an MP3, M4A or WAV.',
}

export const MEDIA_SWITCHED_OFF: Record<MediaKind, string> = {
  video: 'Video is switched off for this academy. The head coach can switch it on in Settings, under Plan & features.',
  audio: 'Audio is switched off for this academy. The head coach can switch it on in Settings, under Plan & features.',
}

// The least a database client has to do for the two checks below. Both the
// routes' service client and a test double fit it.
type Db = { from: (table: string) => any }   // eslint-disable-line @typescript-eslint/no-explicit-any

// ── An invited coach's recordings ───────────────────────────────────────────
// A recording belongs to the ACADEMY and hangs off a player. An invited coach
// reaches the recordings of the players assigned to them and nobody else's —
// the same line the database draws for them (migration 166) — restated in the
// routes because those use the service key. Which academy, and which coach
// record, come from coachGate() in lib/coach/membership.ts.

/** The ids of the players assigned to one coach at an academy. */
export async function coachPlayerIds(db: Db, academyId: string, staffId: string): Promise<Set<string>> {
  const { data } = await db.from('coach_players').select('id').eq('coach_id', academyId).eq('staff_id', staffId).limit(5000)
  return new Set(((data as { id: string }[] | null) ?? []).map(p => p.id))
}

export const RECORDING_NEEDS_OWN_PLAYER = 'Choose which of your players this recording is for. You can add recordings for the players assigned to you.'

/**
 * The player a new recording by an invited coach is for: one of THEIR players,
 * by id, or by name when exactly one of their players has it. Null when it is
 * nobody of theirs — the recording is then refused, because one filed against
 * no player (or somebody else's) is one they could never see again.
 */
export async function ownPlayerForRecording(
  db: Db, academyId: string, staffId: string, playerId?: string | null, playerName?: string | null,
): Promise<{ id: string; name: string } | null> {
  const { data } = await db.from('coach_players').select('id, name').eq('coach_id', academyId).eq('staff_id', staffId).limit(5000)
  const own = (data as { id: string; name: string | null }[] | null) ?? []
  const tidy = (v?: string | null) => (v || '').trim().toLowerCase()
  const hits = playerId ? own.filter(p => p.id === playerId) : tidy(playerName) ? own.filter(p => tidy(p.name) === tidy(playerName)) : []
  return hits.length === 1 ? { id: hits[0].id, name: (hits[0].name || '').trim() } : null
}

/**
 * Has this academy got `kind` switched on (Settings → Plan & features)?
 *
 * The switches are saved in coach_settings.data.features. The portal hides the
 * Video & Audio page when both are off, but the routes behind it went on
 * accepting uploads from anyone who called them directly. An academy that has
 * never saved a choice has everything on (the founder default — see
 * NEW_ACCOUNT_TIER in feature-flags.ts). If the settings cannot be read the
 * answer is NO: a check that cannot be made must not pass.
 */
export async function mediaSwitchedOn(db: Db, academyId: string, kind: MediaKind): Promise<boolean> {
  try {
    const { data, error } = await db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle()
    if (error) return false
    const features = (data?.data as { features?: Record<string, unknown> } | null | undefined)?.features
    if (!features || typeof features !== 'object' || !(kind in features)) return true
    return features[kind] === true
  } catch {
    return false
  }
}
