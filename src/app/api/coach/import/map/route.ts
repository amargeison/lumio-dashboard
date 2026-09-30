import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { IMPORT_FIELDS, IMPORT_CATEGORIES, ENUMS, type SheetPlan } from '@/lib/coach/import-records'

export const runtime = 'nodejs'
export const maxDuration = 60

// Works out what each tab of a coach's workbook holds, from a sample of it.
//
// The AI is not asked to copy any rows here — only to say "this tab is players,
// the heading is on row 2, name is column 0, age is column 3, 'Owes' means due".
// The browser then applies that to every row. That is what lets a workbook with
// a dozen tabs and thousands of rows import in seconds instead of failing: the
// answer stays a few hundred tokens long however big the file is.

const FIELD_LIST = IMPORT_CATEGORIES.map(c => `  ${c}: ${IMPORT_FIELDS[c].join(', ')}`).join('\n')
const ENUM_LIST = Object.entries(ENUMS).map(([k, v]) => `  ${k}: ${v.join(' | ')}`).join('\n')

const PROMPT = `You are setting up a tennis coach's academy software from their own spreadsheet. Below is a sample of each tab: the first rows (row index: cells separated by " | ") and, per column, some of the different values found in that column.

For EVERY tab, decide what it holds and how its columns map to these fields:
${FIELD_LIST}

Allowed values for enumerated fields:
${ENUM_LIST}

Return ONLY JSON, no commentary:
{"plans":[{"sheet":"<exact tab name>","category":"players|staff|courts|camps|equipment|payments|resources|skip","header_row":<0-based row index of the column headings, -1 if none>,"first_data_row":<row index of the first record>,"columns":{"<field>":<column index> or [column indexes to join]},"notes_columns":[<other useful column indexes to keep in notes>],"values":{"<field>":{"<value as written>":"<allowed value>"}},"default":{"<field>":"<value for every row>"},"irregular":false}]}

Rules:
- One plan per tab, in the order given. A tab that holds two kinds of record side by side may have two plans with the same sheet name.
- "skip": instructions, totals/summary/pivot tabs, dropdown or lookup lists, charts, empty templates.
- "irregular": true when the tab is NOT one record per row (a timetable grid, a form, several stacked tables, free text). Those are read another way, so leave columns empty.
- Map by meaning, not exact heading ("Surname" + "First name" → name as [first, surname]; "Mum/Dad" → parent_name; "Balance" → amount).
- Use notes_columns for columns worth keeping that have no field (DOB, medical, club, school, availability…). Never put a column in both.
- For enumerated fields (category, racket_stage, status) add a "values" entry for every sample value that is not already an allowed value, e.g. {"status":{"Owes":"due","✓":"paid"}}.
- A tab of juniors with no category column may use "default":{"category":"Junior"}; a payments tab where every row is paid may default status. Only when it is clearly true.
- Do not invent columns. Use only indexes you can see.`

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

  const body = await req.json().catch(() => ({})) as { fileName?: string; sheets?: { name: string; sample: string }[] }
  const sheets = (Array.isArray(body.sheets) ? body.sheets : []).filter(s => s && typeof s.name === 'string' && typeof s.sample === 'string').slice(0, 20)
  if (!sheets.length) return NextResponse.json({ error: 'No tabs to read' }, { status: 400 })
  const text = `File: ${String(body.fileName || 'workbook').slice(0, 200)}\n\n${sheets.map(s => s.sample.slice(0, 16000)).join('\n\n')}`

  try {
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: [{ type: 'text', text }, { type: 'text', text: PROMPT }] }],
    })
    let txt = ''
    for (const b of res.content) if (b.type === 'text') txt += b.text
    const match = txt.replace(/```json\s*/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Could not work out what the tabs hold.' }, { status: 422 })
    const parsed = JSON.parse(match[0]) as { plans?: SheetPlan[] }
    const names = new Set(sheets.map(s => s.name))
    const cats = new Set<string>([...IMPORT_CATEGORIES, 'skip'])
    const isIdx = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 500
    const plans = (parsed.plans || []).filter(p => p && names.has(p.sheet) && cats.has(p.category)).map(p => ({
      ...p,
      header_row: typeof p.header_row === 'number' ? p.header_row : -1,
      columns: Object.fromEntries(Object.entries(p.columns || {}).filter(([, c]) => Array.isArray(c) ? c.every(isIdx) : isIdx(c))),
      notes_columns: (p.notes_columns || []).filter(isIdx),
    }))
    return NextResponse.json({ plans })
  } catch (err) {
    console.error('[coach/import/map]', err)
    const e = err as { message?: string; status?: number; error?: { error?: { message?: string } } }
    const detail = e?.error?.error?.message || e?.message || String(err)
    return NextResponse.json({ error: `Could not read the tabs: ${detail}` }, { status: typeof e?.status === 'number' ? e.status : 500 })
  }
}
