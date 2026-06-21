import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

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

  const name = (file.name || '').toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())

  // Build the user content for Claude depending on file type.
  const content: any[] = []
  try {
    if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
      content.push({ type: 'text', text: `${SCHEMA_PROMPT}\n\n--- FILE: ${file.name} ---\n${buf.toString('utf-8').slice(0, 120000)}` })
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buf, { type: 'buffer' })
      const text = wb.SheetNames.map(sn => `# Sheet: ${sn}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sn])}`).join('\n\n').slice(0, 120000)
      content.push({ type: 'text', text: `${SCHEMA_PROMPT}\n\n--- FILE: ${file.name} ---\n${text}` })
    } else if (name.endsWith('.docx')) {
      try {
        const mammoth: any = await import('mammoth')
        const { value } = await mammoth.extractRawText({ buffer: buf })
        content.push({ type: 'text', text: `${SCHEMA_PROMPT}\n\n--- FILE: ${file.name} ---\n${String(value).slice(0, 120000)}` })
      } catch {
        return NextResponse.json({ error: 'Word (.docx) import needs the "mammoth" package — run: npm install mammoth. Or export the document as PDF or CSV.' }, { status: 400 })
      }
    } else if (name.endsWith('.pdf')) {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } })
      content.push({ type: 'text', text: SCHEMA_PROMPT })
    } else if (/\.(png|jpe?g|webp|gif)$/.test(name)) {
      const mt = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : name.endsWith('.gif') ? 'image/gif' : 'image/jpeg'
      content.push({ type: 'image', source: { type: 'base64', media_type: mt, data: buf.toString('base64') } })
      content.push({ type: 'text', text: SCHEMA_PROMPT })
    } else {
      // Unknown — try as plain text.
      content.push({ type: 'text', text: `${SCHEMA_PROMPT}\n\n--- FILE: ${file.name} ---\n${buf.toString('utf-8').slice(0, 120000)}` })
    }
  } catch (e) {
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
    const match = txt.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Could not extract any records from that file.' }, { status: 422 })
    const extracted = JSON.parse(match[0])
    return NextResponse.json({ extracted })
  } catch (err: any) {
    console.error('[coach/import]', err)
    // Surface the real reason so failures are diagnosable (model, key, network…).
    const detail = err?.error?.error?.message || err?.message || String(err)
    const status = typeof err?.status === 'number' ? err.status : 500
    return NextResponse.json({ error: `Import failed: ${detail}` }, { status })
  }
}
