import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { fileToContent, UnreadableFile } from '@/lib/coach/file-to-content'
import { cleanRecord, IMPORT_CATEGORIES, type ImportCategory } from '@/lib/coach/import-records'

export const runtime = 'nodejs'
export const maxDuration = 120

// AI bulk import for the Tennis Coach portal. Accepts a coach's data file
// (CSV / Excel / PDF / image), uses Claude to work out which records are
// players, coaches/staff, courts, camps, equipment, payments or resources, and
// returns categorised JSON. The client previews it and inserts on confirm.
// Auth = the coach's own Supabase session.

const SCHEMA_PROMPT = `You are importing a tennis coach's data into their academy management system. Read the supplied file and extract every record you can find, sorting each into the correct category. Map columns/labels intelligently even if headings differ.

Output ONE record per line as a JSON object (JSON Lines) — no array, no markdown, no commentary. Each line has a "type" plus any of that type's fields you can determine:
  players:   name, category, age, parent_name, racket_stage, goal, level, email, phone, notes
  staff:     name, role, email, phone, qualifications, notes
  courts:    name, surface, location, hours, status, notes
  camps:     name, start_date, end_date, capacity, price, location, notes
  equipment: item, category, quantity, status, notes
  payments:  player_name, item, amount, status, due_date, notes
  resources: title, type, url, category, notes
Example line: {"type":"players","name":"Amy Clark","age":11,"racket_stage":"orange"}
Rules:
- "category" for players is one of: Junior, Performance, Adult (infer from age/level if not explicit).
- "racket_stage" is one of: white, yellow, orange, green, blue, purple, brown, red, black (map any belt/level colour; lowercase).
- Dates as YYYY-MM-DD (British day-first when ambiguous). Amounts as plain numbers (no currency symbol).
- "status" for payments: paid, due, or overdue. For equipment: in_stock, low, or order. For courts: available, maintenance, or booked.
- Useful details with no field (DOB, medical notes, school…) go in "notes".
- Skip headings, totals and blank rows. Be thorough — extract ALL records, not just examples.`

// JSON Lines rather than one big object: if the answer is cut off, only the
// last half-written line is lost instead of the whole file.
function parseLines(txt: string): Record<string, Record<string, unknown>[]> {
  const out: Record<string, Record<string, unknown>[]> = {}
  const add = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    const rec = value as Record<string, unknown>
    const type = String(rec.type || '') as ImportCategory
    if (!IMPORT_CATEGORIES.includes(type)) return
    const clean = cleanRecord(type, rec)
    if (clean) (out[type] ||= []).push(clean)
  }
  const body = txt.replace(/```(?:json|jsonl)?/gi, '')
  for (const line of body.split('\n')) {
    const l = line.trim().replace(/,$/, '')
    if (!l.startsWith('{')) continue
    try { add(JSON.parse(l)) } catch { /* half-written last line */ }
  }
  // An older-style single object ({"players":[...]}) still works.
  if (!Object.keys(out).length) {
    const m = body.match(/\{[\s\S]*\}/)
    if (m) { try { const o = JSON.parse(m[0]) as Record<string, unknown>; for (const c of IMPORT_CATEGORIES) for (const r of (Array.isArray(o[c]) ? o[c] as Record<string, unknown>[] : [])) add({ ...r, type: c }) } catch { /* ignore */ } }
  }
  return out
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

  // Two ways in: a file (PDF, Word, photo…), or a piece of a spreadsheet tab
  // the browser has already opened and split up (JSON { text, label }).
  const content: any[] = []
  const isChunk = (req.headers.get('content-type') || '').includes('application/json')
  if (isChunk) {
    const body = await req.json().catch(() => ({})) as { text?: string; label?: string }
    const text = String(body.text || '').slice(0, 40000)
    if (!text.trim()) return NextResponse.json({ extracted: {} })
    content.push({ type: 'text', text: `--- FILE: ${String(body.label || 'spreadsheet').slice(0, 200)} ---\n${text}` }, { type: 'text', text: SCHEMA_PROMPT })
  } else {
    let file: File | null = null
    try { file = (await req.formData()).get('file') as File | null } catch { /* ignore */ }
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    // Reading the file is shared with the camp importer. It used to live here as
    // the only copy, which meant the rest of the product could not accept a
    // spreadsheet without reimplementing all of this.
    try {
      const { blocks } = await fileToContent(file)
      content.push(...blocks, { type: 'text', text: SCHEMA_PROMPT })
    } catch (e) {
      if (e instanceof UnreadableFile) return NextResponse.json({ error: e.message }, { status: 400 })
      console.error('[coach/import] parse', e)
      return NextResponse.json({ error: 'Could not read that file. Try exporting it as CSV.' }, { status: 400 })
    }
  }

  try {
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: content as any }],
    })
    let txt = ''
    for (const b of res.content) if (b.type === 'text') txt += b.text
    const extracted = parseLines(txt)
    const found = Object.values(extracted).reduce((n, r) => n + r.length, 0)
    // A piece of a tab with nothing in it is not an error — the next piece may have.
    if (!found && !isChunk) return NextResponse.json({ error: 'Could not find any records in that file. Try a CSV or a clearer document.' }, { status: 422 })
    // Cut off before the end: keep what was read, and say so.
    return NextResponse.json({ extracted, ...(res.stop_reason === 'max_tokens' ? { truncated: true } : {}) })
  } catch (err: any) {
    console.error('[coach/import]', err)
    // Surface the real reason so failures are diagnosable (model, key, network…).
    const detail = err?.error?.error?.message || err?.message || String(err)
    const status = typeof err?.status === 'number' ? err.status : 500
    return NextResponse.json({ error: `Import failed: ${detail}` }, { status })
  }
}
