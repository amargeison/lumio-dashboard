import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { IMPORT_FIELDS, IMPORT_CATEGORIES, ENUMS, type SheetPlan } from '@/lib/coach/import-records'

export const runtime = 'nodejs'
export const maxDuration = 120

// Works out what each tab of a coach's workbook holds, from a sample of it.
//
// The AI is not asked to copy any rows here — only to say "this tab is players,
// the heading is on row 2, name is column 0, age is column 3, 'Owes' means due".
// The browser then applies that to every row. That is what lets a workbook with
// a dozen tabs and thousands of rows import in seconds instead of failing: the
// answer stays a few hundred tokens long however big the file is.

const FIELD_LIST = IMPORT_CATEGORIES.map(c => `  ${c}: ${IMPORT_FIELDS[c].join(', ')}`).join('\n')
const ENUM_LIST = Object.entries(ENUMS).map(([k, v]) => `  ${k}: ${v.join(' | ')}`).join('\n')

// What each category IS, in the coach's terms. The first version only listed
// field names, and a holiday workbook came back with 567 "resources" that were
// clubs abroad, 933 "courts" that were one venue per booking, and "payments"
// that were court-hire bills. The definitions below are what stops that.
const MEANINGS = `What each category means:
- players: people who take lessons or go on camps (children or adults). One per person.
- staff: coaches and assistants who work for the academy.
- courts: the coach's OWN regular courts/venues where weekly coaching happens — normally a handful. NOT hotels, resorts, clubs abroad, holiday destinations or one-off hire.
- camps: holiday camps, camp weeks, tours, trips and residential or overseas camps. One per camp, NOT one per attendee. A club, resort or place abroad that hosts a camp or tour is a camp's location, not a court or a resource.
- equipment: kit the academy owns, stocks or sells (balls, rackets, shirts, prizes).
- payments: money a PLAYER or family owes or has paid — player_name is that person. Costs the academy pays out (court hire, hotels, flights, coach wages, suppliers) are NOT payments.
- resources: coaching material — drills, videos, documents, web links, books. NEVER places, clubs, venues or people.
- skip: anything else — expense and cost sheets, budgets, supplier or hotel contact lists, summaries and dashboards, dropdown lists, instructions, and TIMETABLES (a grid of times down the side and days across the top, with a group or coach in each box — those boxes are sessions, not players, staff or courts).`

const PROMPT = `You are setting up a tennis coach's academy software from their own spreadsheet. Below is a sample of each tab: the first rows (row index: cells separated by " | ") and, per column, some of the different values found in that column.

For EVERY tab, decide what ONE ROW represents, and how its columns map to these fields:
${FIELD_LIST}

${MEANINGS}

Allowed values for enumerated fields:
${ENUM_LIST}

Return ONLY JSON, no commentary:
{"plans":[{"sheet":"<exact tab name>","category":"players|staff|courts|camps|equipment|payments|resources|skip","confidence":"high|medium|low","reason":"<one short sentence for the coach, e.g. 'Lists children with ages and racket colours'>","header_row":<0-based row index of the column headings, -1 if none>,"first_data_row":<row index of the first record>,"columns":{"<field>":<column index> or [column indexes to join]},"notes_columns":[<other useful column indexes to keep in notes>],"values":{"<field>":{"<value as written>":"<allowed value>"}},"default":{"<field>":"<value for every row>"},"tab_record":null,"paid_column":null,"irregular":false}]}

Rules:
- The category is what ONE ROW is. A column that repeats the same few values on every row (the venue, the camp name, the coach) describes the row — map it to a field such as location, or to notes. It never becomes records of its own.
- A tab per camp (its name or title rows name the camp, the rows list who is going): category "players" for the rows, plus "tab_record":{"category":"camps","name":"<camp name>","start_date":"YYYY-MM-DD","end_date":"YYYY-MM-DD","location":"<place>","price":<number>} using only what the tab shows. Use tab_record in the same way whenever the tab as a whole is one camp or trip.
- One plan per tab, in the order given. A tab holding two kinds of record side by side may have two plans with the same sheet name.
- confidence: "high" only when it is obvious. "medium" when it is a reasonable guess, "low" when unsure. The coach is asked to confirm anything that is not high, so do not overclaim.
- Map every tab you can. A title row, blank rows or notes ABOVE the headings do not make a tab irregular — just set header_row to the headings' row. Nor do merged cells, colour-coding or a totals row at the bottom.
- "irregular": true ONLY when there is no heading row with one record per row below it AND the tab still holds records worth importing (a form laid out down the page, a list typed as free text). Those tabs are read row by row, which is very slow, so use it sparingly and leave columns empty. A weekly timetable or rota is NOT irregular — it is "skip".
- Rows marked "merged title/section row" are headings, never records. A tab laid out in BLOCKS (a merged banner naming a venue or group, then that block's own heading row and rows) is still a normal tab: map the columns from the first block's heading row and set header_row to it — the banners and repeated headings are handled for you, and for courts the banner becomes the court's location.
- A camp's own tab (attendee list): its rows are players who are almost always already on the main register; still map them as players (they are matched up by name), and give the camp in tab_record with the SAME name as it has on the camps list if you can see one.
- A totals or "average" line at the bottom is not a record; set nothing for it (it is filtered out).
- payments.amount is what was CHARGED — the invoice total (Net, Amount, Fee, Total, Price). When a tab has a total AND a "Paid"/"Balance"/"Outstanding" column, amount is the total, never the balance: a paid invoice has a balance of 0 and must still show what it was for. Use a balance column only when it is the only money column. status says whether it has been paid.
- On a camp's attendee tab (one with a tab_record for the camp), if a column says whether each child has paid ("Paid?", "✓", "Owes"), give its index as "paid_column".
- racket_stage is this product's OWN nine-colour racket pathway (white, yellow, orange, green, blue, purple, brown, red, black — white is the start, black the top). The LTA Youth BALL colours (Blue/tots, Red, Orange, Green, Yellow — "stage", "ball colour") are a different scale: a six-year-old on Red ball is a beginner, not near the top. Never map a ball-colour or LTA-stage column to racket_stage; put it in notes_columns instead. Only map racket_stage when the heading says racket, belt or pathway colour.
- Map by meaning, not exact heading ("Surname" + "First name" → name as [first, surname]; "Mum/Dad" → parent_name).
- Use notes_columns for columns worth keeping that have no field (DOB, medical, club, school, availability…). Never put a column in both.
- For enumerated fields (category, racket_stage, status) add a "values" entry for every sample value that is not already an allowed value, e.g. {"status":{"Owes":"due","✓":"paid"}}.
- A tab of juniors with no category column may use "default":{"category":"Junior"}. Only when it is clearly true.
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
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()
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
    // Tab names matched loosely ("Players " is the tab "Players").
    const norm = (n: unknown) => String(n ?? '').trim().toLowerCase()
    const realName = (n: unknown) => [...names].find(x => norm(x) === norm(n))
    const plans = (parsed.plans || []).filter(p => p && realName(p.sheet) && cats.has(p.category)).map(p => ({
      ...p,
      sheet: realName(p.sheet)!,
      confidence: p.confidence === 'high' || p.confidence === 'low' ? p.confidence : 'medium',
      reason: typeof p.reason === 'string' ? p.reason.slice(0, 200) : undefined,
      tab_record: p.tab_record && typeof p.tab_record === 'object' && (IMPORT_CATEGORIES as string[]).includes(p.tab_record.category) ? p.tab_record : undefined,
      header_row: typeof p.header_row === 'number' ? p.header_row : -1,
      columns: Object.fromEntries(Object.entries(p.columns || {}).filter(([, c]) => Array.isArray(c) ? c.every(isIdx) : isIdx(c))),
      notes_columns: (p.notes_columns || []).filter(isIdx),
      paid_column: isIdx(p.paid_column) ? p.paid_column : undefined,
    }))
    return NextResponse.json({ plans })
  } catch (err) {
    console.error('[coach/import/map]', err)
    const e = err as { message?: string; status?: number; error?: { error?: { message?: string } } }
    const detail = e?.error?.error?.message || e?.message || String(err)
    return NextResponse.json({ error: `Could not read the tabs: ${detail}` }, { status: typeof e?.status === 'number' ? e.status : 500 })
  }
}
