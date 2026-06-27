// Server-only transcription via OpenAI Whisper (whisper-1).
// Whisper's API caps uploads at 25MB, and lesson recordings are long (a 48-min
// session is ~39MB). So we always transcode to mono 16kHz MP3 (also extracts the
// audio track from a video), and if it's still too big we split into time chunks
// and stitch the transcripts. Requires `ffmpeg` on the server.

import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

const execFileP = promisify(execFile)
const MAX_BYTES = 24 * 1024 * 1024 // stay safely under OpenAI's 25MB limit
const CHUNK_SECONDS = 20 * 60      // 20-minute chunks when a compressed file is still too large

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

export async function transcribeMedia(input: Buffer, mime: string, originalName: string): Promise<string> {
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
    let parts: string[]
    if (size <= MAX_BYTES) {
      parts = [audioPath]
    } else {
      const pattern = path.join(dir, 'chunk-%03d.mp3')
      await ffmpeg(['-i', audioPath, '-f', 'segment', '-segment_time', String(CHUNK_SECONDS), '-c', 'copy', '-y', pattern])
      parts = (await fs.readdir(dir)).filter(f => /^chunk-\d+\.mp3$/.test(f)).sort().map(f => path.join(dir, f))
    }

    const pieces: string[] = []
    for (const p of parts) {
      pieces.push(await whisper(await fs.readFile(p), provider))
    }
    return pieces.join('\n').trim()
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function whisper(buf: Buffer, provider: AsrProvider): Promise<string> {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(buf)], { type: 'audio/mpeg' }), 'audio.mp3')
  form.append('model', provider.model)
  form.append('language', 'en')
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${provider.key}` },
    body: form,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`${provider.name} transcription error ${res.status}: ${t.slice(0, 300)}`)
  }
  const json = await res.json().catch(() => ({})) as { text?: string }
  return (json.text || '').trim()
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
