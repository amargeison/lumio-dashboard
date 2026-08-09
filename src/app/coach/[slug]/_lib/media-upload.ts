'use client'

// Shared upload orchestration for every coach "add a recording" entry point:
// MediaCaptureModal (Lesson Summaries + Session Planner "Add audio") and
// LiveVideoAudio (the Video & Audio page). Both used to hand-roll the same
// sign → upload → process sequence; they now share this module, so a fix lands
// in both at once.
//
// Two things this exists to guarantee:
//
// 1. ORDERING. Supabase Storage acknowledges the signed-URL PUT before the object
//    is reliably readable back through the service-role download path that
//    /api/coach/media/process uses. Posting to /process the instant the PUT
//    resolved is a race, and losing it produced "Could not read uploaded file:
//    Object not found" and a manual "Retry AI review" click. The order here is
//    sign → upload → CONFIRM the object is readable → process, and the confirm
//    step retries on a short backoff. (/process retries the download itself too,
//    so the happy path never needs a manual retry.)
//
// 2. PROGRESS. uploadToSignedUrl gives no byte progress, so a large file left the
//    UI on a static "Uploading…" for minutes and looked frozen. We PUT to the
//    signed URL over XHR instead — same request supabase-js makes — which gives
//    real upload.onprogress events. If that fails for any reason we fall back to
//    supabase-js and simply report indeterminate progress.

import { sb } from './coach-db'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const SIGNED_OUT_MESSAGE =
  'Uploading recordings needs a signed-in coach account. The demo runs on sample data — sign up for founder access to add your own audio/video.'

// ── Progress reporting ───────────────────────────────────────────────────────
export type UploadPhase = 'signing' | 'uploading' | 'confirming' | 'starting'

export type UploadProgress = {
  phase: UploadPhase
  index: number        // 0-based index of the file currently being handled
  total: number        // files in this batch
  pct: number | null   // bytes uploaded for THIS file; null when not measurable
  fileName: string
}

export type UploadItem = { blob: Blob; name: string; title?: string; duration?: number }
export type UploadedMedia = { id: string; isVideo: boolean; index: number; item: UploadItem }

type SignResponse = { id: string; path: string; token: string; signedUrl?: string }

// ── Step 1 — mint the signed upload URL (server also creates the coach_media row)
async function signUpload(kind: 'audio' | 'video', playerName: string | null | undefined, fileName: string): Promise<SignResponse> {
  const res = await fetch('/api/coach/media/sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, playerName: playerName || null, fileName }),
  })
  if (res.status === 401) throw new Error(SIGNED_OUT_MESSAGE)
  const j = await res.json().catch(() => ({} as Record<string, string>))
  if (!res.ok) throw new Error(j.error || `Could not start upload (${res.status})`)
  return j as SignResponse
}

// ── Step 2 — the bytes. XHR so we get real progress events.
// Mirrors what supabase-js uploadToSignedUrl sends for a Blob body: a PUT to the
// signed URL carrying multipart form-data with a `cacheControl` field and the
// blob under an empty field name.
function putWithProgress(signedUrl: string, blob: Blob, accessToken: string | null, onPct: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl, true)
    // Same auth headers supabase-js attaches, so the gateway sees an identical
    // request — the URL's token is what actually authorises the write.
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anon) xhr.setRequestHeader('apikey', anon)
    if (accessToken || anon) xhr.setRequestHeader('authorization', `Bearer ${accessToken || anon}`)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = e => { if (e.lengthComputable && e.total) onPct(Math.min(99, Math.round((e.loaded / e.total) * 100))) }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve()
      : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error('Upload failed — network error'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    const form = new FormData()
    form.append('cacheControl', '3600')
    form.append('', blob)
    xhr.send(form)
  })
}

async function uploadBlob(sign: SignResponse, blob: Blob, onPct: (pct: number | null) => void): Promise<void> {
  if (sign.signedUrl) {
    const token = await sb().auth.getSession()
      .then((r: { data: { session: { access_token?: string } | null } }) => r.data.session?.access_token ?? null)
      .catch(() => null)
    try { await putWithProgress(sign.signedUrl, blob, token, onPct); return }
    catch (e) { console.warn('[media-upload] progress upload failed — falling back to supabase-js', e) }
  }
  // Fallback: no byte progress available, so report indeterminate.
  onPct(null)
  const { error } = await sb().storage.from('coach-media')
    .uploadToSignedUrl(sign.path, sign.token, blob, { contentType: blob.type || undefined })
  // If the XHR attempt above actually landed the object before failing, the retry
  // collides with it — that's a success, not an error.
  if (error && !/already exists|duplicate|resource already/i.test(error.message)) {
    throw new Error('Upload to storage failed: ' + error.message)
  }
}

// ── Step 3 — confirm the object is readable back before anything reads it ────
// Asks the server (service role, the SAME read path /process uses) whether each
// object is retrievable yet, on a short backoff. Returns false if it never
// confirmed inside ~16s — we still start processing in that case, because
// /process retries the download itself; this just means the coach waited a moment
// longer for a state we couldn't verify.
export async function confirmReadable(ids: string[]): Promise<boolean> {
  if (!ids.length) return true
  const delays = [0, 400, 900, 1600, 2600, 4000, 6000]
  for (const d of delays) {
    if (d) await sleep(d)
    try {
      const r = await fetch('/api/coach/media/ready', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const j = await r.json().catch(() => ({} as { ready?: boolean }))
      if (j?.ready) return true
    } catch { /* transient — keep trying */ }
  }
  console.warn('[media-upload] storage never confirmed the object as readable — starting anyway (process retries)')
  return false
}

// ── Step 4 — kick off the AI pipeline, retrying a transient failure ──────────
export async function startProcess(ids: string[]): Promise<void> {
  let lastErr = 'Could not start the AI review'
  for (const d of [0, 1200, 3000]) {
    if (d) await sleep(d)
    let res: Response
    try {
      res = await fetch('/api/coach/media/process', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
    } catch { lastErr = 'Network error starting the AI review'; continue }
    if (res.ok) return
    if (res.status === 401) throw new Error('AI review needs a signed-in coach account.')
    const j = await res.json().catch(() => ({} as { error?: string }))
    lastErr = j.error || `AI review failed (${res.status})`
    // 4xx other than 404 is a real rejection — retrying won't help. A 404 can
    // simply be the just-inserted row not visible yet, so that one we retry.
    if (res.status >= 400 && res.status < 500 && res.status !== 404) throw new Error(lastErr)
  }
  throw new Error(lastErr)
}

// ── The whole sequence ───────────────────────────────────────────────────────
// Uploads every item in order, reporting progress, then confirms readability and
// starts the AI review for `processIds` (defaults to every uploaded id).
export async function uploadMedia(
  items: UploadItem[],
  opts: {
    kind: 'audio' | 'video'
    playerName?: string | null
    onProgress?: (p: UploadProgress) => void
    // Runs after each file lands — used to write title/duration onto the row.
    afterEach?: (m: UploadedMedia) => void | Promise<void>
  },
): Promise<UploadedMedia[]> {
  const out: UploadedMedia[] = []
  const total = items.length
  for (let i = 0; i < total; i++) {
    const item = items[i]
    const report = (phase: UploadPhase, pct: number | null) =>
      opts.onProgress?.({ phase, index: i, total, pct, fileName: item.name })
    report('signing', null)
    const isVideo = item.blob.type.startsWith('video') || (!item.blob.type && opts.kind === 'video')
    const sign = await signUpload(isVideo ? 'video' : 'audio', opts.playerName, item.name)
    report('uploading', 0)
    await uploadBlob(sign, item.blob, pct => report('uploading', pct))
    report('uploading', 100)
    const m: UploadedMedia = { id: sign.id, isVideo, index: i, item }
    if (opts.afterEach) await opts.afterEach(m)
    out.push(m)
  }
  return out
}

// Confirm-then-start, as one step, with the phase reported for the UI.
export async function confirmAndProcess(ids: string[], onPhase?: (p: UploadPhase) => void): Promise<void> {
  if (!ids.length) return
  onPhase?.('confirming')
  await confirmReadable(ids)
  onPhase?.('starting')
  await startProcess(ids)
}

// ── Pipeline status → what the coach reads ───────────────────────────────────
// /api/coach/media/process writes these breadcrumbs onto coach_media.status as it
// works, so the UI can show the real stage instead of one static "processing".
export const PROCESSING_STATUSES = ['uploaded', 'processing', 'transcribing', 'summarising'] as const

export function isProcessingStatus(s?: string | null): boolean {
  return s === 'processing' || s === 'transcribing' || s === 'summarising'
}

// 0 = uploading/queued, 1 = transcribing, 2 = writing the summary, 3 = done.
export function processStep(s?: string | null): number {
  switch (s) {
    case 'transcribing': return 1
    case 'summarising': return 2
    case 'done': return 3
    default: return 0
  }
}

export function processStageLabel(s?: string | null): string {
  switch (s) {
    case 'transcribing': return 'Transcribing the recording…'
    case 'summarising': return 'Writing the summary…'
    case 'done': return 'Summary ready'
    default: return 'Preparing the recording…'
  }
}

export function processStageShort(s?: string | null): string {
  switch (s) {
    case 'transcribing': return 'Transcribing…'
    case 'summarising': return 'Writing summary…'
    case 'done': return 'Done'
    default: return 'Preparing…'
  }
}

// ── Polling a media row to completion ────────────────────────────────────────
export type MediaState = {
  status?: string | null
  review?: Record<string, unknown> | null
  transcript?: string
  error?: string | null
}

// Polls /api/coach/media/{id} until it reports done or error, surfacing every
// status change so the caller can move its progress UI along. Rejects on timeout
// or when the pipeline reports an error.
export async function pollMedia(id: string, opts: {
  onStatus?: (status: string) => void
  isAlive?: () => boolean
  intervalMs?: number
  timeoutMs?: number
} = {}): Promise<MediaState> {
  const interval = opts.intervalMs ?? 2500
  const timeout = opts.timeoutMs ?? 10 * 60 * 1000
  const started = Date.now()
  let last = ''
  for (;;) {
    if (opts.isAlive && !opts.isAlive()) return {}
    if (Date.now() - started > timeout) throw new Error('Still processing — it will appear in Lesson Summaries shortly.')
    await sleep(interval)
    if (opts.isAlive && !opts.isAlive()) return {}
    let j: MediaState | null = null
    try { j = await fetch(`/api/coach/media/${id}`).then(r => r.json()) } catch { /* keep polling */ }
    if (!j) continue
    const status = String(j.status || '')
    if (status && status !== last) { last = status; opts.onStatus?.(status) }
    if (status === 'done') return j
    if (status === 'error') throw new Error(j.error || 'Processing failed')
  }
}
