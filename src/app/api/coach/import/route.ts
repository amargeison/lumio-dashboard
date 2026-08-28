import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { fileToContent, UnreadableFile } from '@/lib/coach/file-to-content'

export const maxDuration = 60

// AI bulk import for the Tennis Coach portal. Accepts a coach's data file
// (CSV / Excel / PDF / image), uses Claude to work out which records are
// players, coaches/staff, courts, camps, equipment, payments or resources, and
// returns categorised JSON. The client previews it and inserts on confirm.
// Auth = the coach's own Supabase session.

const SCHEMA_PROMPT = `You are importing a tennis coach's data into their academy management system. Read the supplied file and extract every record you can find, sorting each into the correct category. Map columns/labels intelligently even if headings differ.

Return ONLY valid JSON (no markdown, no commentary) in exactly this shape — omit any category with no records, and omit any field you can't determine:
{
  "players":   [{"name","category","age","parent_name","racket_stage","goal","level","email","phone","notes"}],
  "staff":     [{"name","role","email","phone","qualifications","notes"}],
  "courts":    [{"name","surface","location","hours","status","notes"}],
  "camps":     [{"name","start_date","end_date","capacity","price","location","notes"}],
  "equipment": [{"item","category","quantity","status","notes"}],
  "payments":  [{"player_name","item","amount","status","due_date","notes"}],
  "resources": [{"title","type","url","category","notes"}]
}
Rules:
- "category" for players is one of: Junior, Performance, Adult (infer from age/level if not explicit).
- "racket_stage" is one of: white, yellow, orange, green, blue, purple, brown, red, black (map any belt/level colour; lowercase).
- Dates as YYYY-MM-DD. Amounts as plain numbers (no currency symbol).
- "status" for payments: paid, due, or overdue. For equipment: in_stock, low, or order. For courts: available, maintenance, or booked.
- Be thorough — extract ALL rows, not just examples.`

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

  let file: File | null = null
  try { file = (await req.formData()).get('file') as File | null } catch { /* ignore */ }
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  // Reading the file is shared with the camp importer. It used to live here as
  // the only copy, which meant the rest of the product could not accept a
  // spreadsheet without reimplementing all of this.
  const content: any[] = []
  try {
    const { blocks } = await fileToContent(file)
    content.push(...blocks, { type: 'text', text: SCHEMA_PROMPT })
  } catch (e) {
    if (e instanceof UnreadableFile) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[coach/import] parse', e)
    return NextResponse.json({ error: 'Could not read that file. Try exporting it as CSV.' }, { status: 400 })
  }

  try {
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: content as any }],
    })
    let txt = ''
    for (const b of res.content) if (b.type === 'text') txt += b.text
    // Strip any ```json fences, then grab the JSON object.
    const cleaned = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Could not find any records in that file. Try a CSV or a clearer document.' }, { status: 422 })
    let extracted: any
    try { extracted = JSON.parse(match[0]) }
    catch { return NextResponse.json({ error: 'The AI response could not be read — try a smaller or simpler file.' }, { status: 422 }) }
    return NextResponse.json({ extracted })
  } catch (err: any) {
    console.error('[coach/import]', err)
    // Surface the real reason so failures are diagnosable (model, key, network…).
    const detail = err?.error?.error?.message || err?.message || String(err)
    const status = typeof err?.status === 'number' ? err.status : 500
    return NextResponse.json({ error: `Import failed: ${detail}` }, { status })
  }
}
