import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { fileToContent, UnreadableFile } from '@/lib/import-engine/file-to-content'
import { parseRecordLines } from '@/lib/import-engine/records'
import { importGate, recordImportSpend } from '@/lib/import-engine/guard'
import { IMPACT_IMPORT_SCHEMA, IMPACT_IMPORT_FIELDS, IMPACT_IMPORT_CATEGORIES, IMPACT_MEANINGS } from '@/lib/impact/import-schema'
import { impactHq } from '@/lib/impact/import-auth'

export const runtime = 'nodejs'
export const maxDuration = 120

// Lumio Impact bulk import — read step. Accepts an org's file (PDF, Word,
// photo, text) or a piece of a spreadsheet tab the browser already opened,
// and returns categorised records (schools, programmes, venues, coaches,
// volunteers, families, children, registers, fundraising, feedback, contacts).
// Same engine as Tennis Coach's importer; Impact's own schema, prompt, guards
// and auth.

const SCHEMA_PROMPT = `You are importing a schools sport-programme organisation's data into their management portal. Read the supplied file and extract every record you can find. Map columns/labels intelligently even if headings differ.

Output ONE record per line as a JSON object (JSON Lines) — no array, no markdown, no commentary. Each line has a "type" plus any of that type's fields you can determine:
${IMPACT_IMPORT_CATEGORIES.map(c => `  ${c}: ${IMPACT_IMPORT_FIELDS[c].join(', ')}`).join('\n')}
Example lines:
{"type":"schools","name":"Hollinsmere Primary","borough":"Northvale","status":"running"}
{"type":"children","name":"Amy Clark","date_of_birth":"2018-03-12","year_group":"Y3","guardian_name":"Jo Clark","guardian_email":"jo@example.com","photo_consent":"yes"}
${IMPACT_MEANINGS}
Rules:
- One line per real thing. Do not repeat a school, venue or family for every row it appears on.
- Copy values as written — do NOT fix, guess or invent them. An impossible or partial date, an email with no @, an amount in words: copy it exactly; it is checked afterwards and shown to the user.
- A row naming two children (e.g. "Jack & Mia Okafor (twins)"): copy the name exactly as written; it is split afterwards.
- Never leave out a child, parent or contact — every person in the file matters.
- Useful details with no field go in "notes". Medical information goes in medical_notes.
- Skip headings, totals and blank rows. Be thorough — extract ALL records.`

export async function POST(req: NextRequest) {
  const hq = await impactHq()
  if (hq instanceof NextResponse) return hq
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  const limited = importGate(hq.user.id)
  if (limited) return limited

  const content: Anthropic.ContentBlockParam[] = []
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
    try {
      const { blocks } = await fileToContent(file)
      content.push(...(blocks as Anthropic.ContentBlockParam[]), { type: 'text', text: SCHEMA_PROMPT })
    } catch (e) {
      if (e instanceof UnreadableFile) return NextResponse.json({ error: e.message }, { status: 400 })
      return NextResponse.json({ error: 'Could not read that file. Try exporting it as CSV.' }, { status: 400 })
    }
  }

  try {
    const model = isChunk ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6'
    const res = await new Anthropic({ apiKey }).messages.create({ model, max_tokens: 16000, messages: [{ role: 'user', content }] })
    recordImportSpend(hq.user.id, res.usage, model, 'impact')
    let txt = ''
    for (const b of res.content) if (b.type === 'text') txt += b.text
    const extracted = parseRecordLines(IMPACT_IMPORT_SCHEMA, txt)
    const found = Object.values(extracted).reduce((n, r) => n + (r?.length ?? 0), 0)
    if (!found && !isChunk) return NextResponse.json({ error: 'Could not find any records in that file.' }, { status: 422 })
    return NextResponse.json({ extracted, ...(res.stop_reason === 'max_tokens' ? { truncated: true } : {}) })
  } catch (err) {
    const e = err as { message?: string; status?: number }
    return NextResponse.json({ error: `Import failed: ${e?.message ?? 'unknown error'}` }, { status: typeof e?.status === 'number' ? e.status : 500 })
  }
}
