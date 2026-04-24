import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// ──────────────────────────────────────────────────────────────────────────
// RGR Partner Dashboard payload.
//
// v1 (now): serves scripts/rgr/data.json verbatim.
// v2: replace fs.readFile with a join against the OxEd platform tables —
// see scripts/rgr/build_data.py for the canonical joins + derivations.
// Same Payload shape either way; the client never knows the difference.
//
// Auth: gated on a partner role. This is a stub — wire into the real
// admin/tenant role system before live customer rollout. The nav-side
// filter (tenant.partner === 'RGR') is a UX sugar, not a security boundary.
// ──────────────────────────────────────────────────────────────────────────

const PAYLOAD_PATH = path.join(process.cwd(), 'scripts', 'rgr', 'data.json')

let cached: { mtime: number; body: string } | null = null

async function loadPayload(): Promise<string> {
  const stat = await fs.stat(PAYLOAD_PATH)
  const mtime = stat.mtimeMs
  if (cached && cached.mtime === mtime) return cached.body
  const body = await fs.readFile(PAYLOAD_PATH, 'utf-8')
  cached = { mtime, body }
  return body
}

export async function GET() {
  try {
    const body = await loadPayload()
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (err) {
    console.error('[api/partners/rgr/dashboard]', err)
    return NextResponse.json({ error: 'Failed to load RGR dashboard payload' }, { status: 500 })
  }
}
