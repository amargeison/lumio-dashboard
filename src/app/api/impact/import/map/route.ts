import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { importGate, recordImportSpend } from '@/lib/import-engine/guard'
import type { SheetPlan } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_FIELDS, IMPACT_IMPORT_CATEGORIES, IMPACT_ENUMS, IMPACT_MEANINGS, type ImpactImportCategory } from '@/lib/impact/import-schema'
import { impactHq } from '@/lib/impact/import-auth'

export const runtime = 'nodejs'
export const maxDuration = 120

// Lumio Impact bulk import — works out what each spreadsheet tab holds from a
// sample (the browser then maps every row itself). Same approach as Tennis
// Coach's map step; Impact's own schema, prompt, guards and auth.

const PROMPT = `You are setting up a schools sport-programme organisation's portal from their own spreadsheet. Below is a sample of each tab: the first rows (row index: cells separated by " | ") and, per column, some of the different values found in that column.

For EVERY tab, decide what ONE ROW represents, and how its columns map to these fields:
${IMPACT_IMPORT_CATEGORIES.map(c => `  ${c}: ${IMPACT_IMPORT_FIELDS[c].join(', ')}`).join('\n')}

${IMPACT_MEANINGS}

Allowed values for enumerated fields:
${Object.entries(IMPACT_ENUMS).map(([k, v]) => `  ${k}: ${v.join(' | ')}`).join('\n')}

Return ONLY JSON, no commentary:
{"plans":[{"sheet":"<exact tab name>","category":"${IMPACT_IMPORT_CATEGORIES.join('|')}|skip","confidence":"high|medium|low","reason":"<one short sentence>","header_row":<0-based row index of the column headings, -1 if none>,"first_data_row":<row index of the first record>,"columns":{"<field>":<column index> or [column indexes to join]},"notes_columns":[<other useful column indexes>],"values":{"<field>":{"<value as written>":"<allowed value>"}},"default":{"<field>":"<value for every row>"},"irregular":false}]}

Rules:
- The category is what ONE ROW is. One plan per tab, in the order given.
- A tab listing children with their parents' details is "children" (guardian_name/email/phone come from the parent columns). A mixed contacts list with tags/roles is "contacts".
- Never "fix" values in "values" maps beyond mapping to an allowed enumerated value.
- confidence: "high" only when obvious; the user confirms anything else.
- "irregular": true ONLY when there is no heading row with one record per row below it AND the tab still holds schools/programmes. Use sparingly.
- For enumerated fields add a "values" entry for every sample value that is not already allowed.
- Map by meaning, not exact heading. Do not invent columns.`

export async function POST(req: NextRequest) {
  const hq = await impactHq()
  if (hq instanceof NextResponse) return hq
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  const limited = importGate(hq.user.id)
  if (limited) return limited

  const body = await req.json().catch(() => ({})) as { fileName?: string; sheets?: { name: string; sample: string }[] }
  const sheets = (Array.isArray(body.sheets) ? body.sheets : []).filter(s => s && typeof s.name === 'string' && typeof s.sample === 'string').slice(0, 20)
  if (!sheets.length) return NextResponse.json({ error: 'No tabs to read' }, { status: 400 })
  const text = `File: ${String(body.fileName || 'workbook').slice(0, 200)}\n\n${sheets.map(s => s.sample.slice(0, 16000)).join('\n\n')}`

  try {
    const res = await new Anthropic({ apiKey }).messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000,
      messages: [{ role: 'user', content: [{ type: 'text', text }, { type: 'text', text: PROMPT }] }],
    })
    recordImportSpend(hq.user.id, res.usage, 'claude-sonnet-4-6', 'impact')
    let txt = ''
    for (const b of res.content) if (b.type === 'text') txt += b.text
    const match = txt.replace(/```json\s*/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Could not work out what the tabs hold.' }, { status: 422 })
    const parsed = JSON.parse(match[0]) as { plans?: SheetPlan<ImpactImportCategory>[] }
    const names = new Set(sheets.map(s => s.name))
    const cats = new Set<string>([...IMPACT_IMPORT_CATEGORIES, 'skip'])
    const isIdx = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 500
    const norm = (n: unknown) => String(n ?? '').trim().toLowerCase()
    const realName = (n: unknown) => [...names].find(x => norm(x) === norm(n))
    const plans = (parsed.plans || []).filter(p => p && realName(p.sheet) && cats.has(p.category)).map(p => ({
      ...p,
      sheet: realName(p.sheet)!,
      confidence: p.confidence === 'high' || p.confidence === 'low' ? p.confidence : 'medium',
      reason: typeof p.reason === 'string' ? p.reason.slice(0, 200) : undefined,
      header_row: typeof p.header_row === 'number' ? p.header_row : -1,
      columns: Object.fromEntries(Object.entries(p.columns || {}).filter(([, c]) => Array.isArray(c) ? c.every(isIdx) : isIdx(c))),
      notes_columns: (p.notes_columns || []).filter(isIdx),
    }))
    return NextResponse.json({ plans })
  } catch (err) {
    const e = err as { message?: string; status?: number }
    return NextResponse.json({ error: `Could not read the tabs: ${e?.message ?? 'unknown error'}` }, { status: typeof e?.status === 'number' ? e.status : 500 })
  }
}
