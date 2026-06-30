// Server-only transcription via OpenAI Whisper (whisper-1) or Groq Whisper.
// Whisper's API caps uploads at 25MB, and lesson recordings are long (a 48-min
// session is ~39MB). So we always transcode to mono 16kHz MP3 (also extracts the
// audio track from a video), and if it's still too big we split into time chunks
// and stitch the transcripts. Requires `ffmpeg` on the server.
//
// We request verbose JSON so each call returns timestamped segments — used by
// the video-highlights feature to cut per-shot clips from what the coach said.

import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

const execFileP = promisify(execFile)
const MAX_BYTES = 24 * 1024 * 1024 // stay safely under OpenAI's 25MB limit
const CHUNK_SECONDS = 20 * 60      // 20-minute chunks when a compressed file is still too large

export type TranscriptSegment = { start: number; end: number; text: string }
export type TimedTranscript = { text: string; segments: TranscriptSegment[] }

// Which speech-to-text backend to use. Both expose the same OpenAI-shaped
// /audio/transcriptions endpoint, so the request code below is identical.
// Groq runs Whisper Large v3 Turbo with a generous free tier and ~1/10th the
// cost of OpenAI, so it's preferred when GROQ_API_KEY is set.
type AsrProvider = { name: string; url: string; key: string; model: string }
function resolveProvider(): AsrProvider {
  if (process.env.GROQ_API_KEY) return { name: 'Groq', url: 'https://api.groq.com/openai/v1/audio/transcriptions', key: process.env.GROQ_API_KEY, model: 'whisper-large-v3-turbo' }
  if (process.env.OPENAI_API_KEY) return { name: 'OpenAI', url: 'https://api.openai.com/v1/audio/transcriptions', key: process.env.OPENAI_API_KEY, model: 'whisper-1' }
  throw new Error('Transcription is not configured (set GROQ_API_KEY or OPENAI_API_KEY).')
}

// Full transcription with timestamped segments (timestamps are relative to the
// start of THIS media file, with chunk offsets already applied).
export async function transcribeMediaTimed(input: Buffer, mime: string, originalName: string): Promise<TimedTranscript> {
  const provider = resolveProvider()

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lumio-media-'))
  try {
    const ext = extFromName(originalName) || (mime.includes('video') ? 'mp4' : 'm4a')
    const srcPath = path.join(dir, `src.${ext}`)
    await fs.writeFile(srcPath, input)

    // Compress to mono 16k MP3 (extracts audio from video too).
    const audioPath = path.join(dir, 'audio.mp3')
    await ffmpeg(['-i', srcPath, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', '-y', audioPath])

    const { size } = await fs.stat(audioPath)
    const segments: TranscriptSegment[] = []
    if (size <= MAX_BYTES) {
      const r = await whisper(await fs.readFile(audioPath), provider)
      segments.push(...r.segments)
    } else {
      const pattern = path.join(dir, 'chunk-%03d.mp3')
      await ffmpeg(['-i', audioPath, '-f', 'segment', '-segment_time', String(CHUNK_SECONDS), '-c', 'copy', '-y', pattern])
      const parts = (await fs.readdir(dir)).filter(f => /^chunk-\d+\.mp3$/.test(f)).sort()
      for (let i = 0; i < parts.length; i++) {
        const r = await whisper(await fs.readFile(path.join(dir, parts[i])), provider)
        const offset = i * CHUNK_SECONDS
        for (const s of r.segments) segments.push({ start: s.start + offset, end: s.end + offset, text: s.text })
      }
    }
    const text = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim()
    return { text, segments }
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

// Text-only convenience (unchanged contract for existing callers).
export async function transcribeMedia(input: Buffer, mime: string, originalName: string): Promise<string> {
  return (await transcribeMediaTimed(input, mime, originalName)).text
}

async function whisper(buf: Buffer, provider: AsrProvider): Promise<TimedTranscript> {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(buf)], { type: 'audio/mpeg' }), 'audio.mp3')
  form.append('model', provider.model)
  form.append('language', 'en')
  form.append('response_format', 'verbose_json')
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${provider.key}` },
    body: form,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`${provider.name} transcription error ${res.status}: ${t.slice(0, 300)}`)
  }
  const json = await res.json().catch(() => ({})) as { text?: string; segments?: Array<{ start?: number; end?: number; text?: string }> }
  const segments: TranscriptSegment[] = Array.isArray(json.segments)
    ? json.segments.map(s => ({ start: Number(s.start) || 0, end: Number(s.end) || 0, text: (s.text || '').trim() })).filter(s => s.text)
    : []
  // Fall back to a single pseudo-segment if the provider didn't return segments.
  if (!segments.length && json.text) segments.push({ start: 0, end: 0, text: json.text.trim() })
  return { text: (json.text || segments.map(s => s.text).join(' ')).trim(), segments }
}

// Use a system ffmpeg by default, or a binary at FFMPEG_PATH (lets us install a
// static ffmpeg in the app user's home dir without root on the VPS).
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'
async function ffmpeg(args: string[]) {
  try {
    await execFileP(FFMPEG_BIN, ['-hide_banner', '-loglevel', 'error', ...args], { maxBuffer: 32 * 1024 * 1024 })
  } catch (e: unknown) {
    const err = e as { stderr?: string; message?: string }
    throw new Error('Audio processing failed — is ffmpeg installed/at FFMPEG_PATH on the server? ' + (err?.stderr || err?.message || String(e)).slice(0, 300))
  }
}

function extFromName(name: string): string | null {
  const m = /\.([a-z0-9]+)$/i.exec(name || '')
  return m ? m[1].toLowerCase() : null
}
