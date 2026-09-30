// ─────────────────────────────────────────────────────────────────────────────
// Reading a spreadsheet in the browser, every tab of it.
//
// Big workbooks used to be uploaded whole and flattened into one block of text
// for the AI to retype row by row. Past a few hundred rows that broke three
// ways: the upload hit the size limit, the text was cut off at 120k characters,
// and the AI's answer ran out of room halfway through a player list, so the
// JSON never closed and the file "could not be read".
//
// Now the browser opens the workbook itself (no upload limit), and the AI is
// only shown a sample of each tab to say what the columns mean. The rows are
// turned into records here, in a loop, however many there are.
// ─────────────────────────────────────────────────────────────────────────────

export type SheetData = { name: string; rows: string[][] }

export const SPREADSHEET_RE = /\.(xlsx|xlsm|xlsb|xls|ods|csv|tsv)$/i

const pad = (n: number) => String(n).padStart(2, '0')

/** Every non-empty tab as rows of trimmed text. Dates come out as YYYY-MM-DD. */
export async function readWorkbook(file: File): Promise<SheetData[]> {
  const mod = await import('xlsx')
  // CommonJS interop: some bundlers put the library under .default.
  const XLSX = (mod.SSF ? mod : (mod as unknown as { default: typeof mod }).default)
  const name = file.name.toLowerCase()
  const isText = /\.(csv|tsv)$/.test(name)
  const wb = isText
    // raw: keep "12/03/2026" as typed, rather than letting the parser guess it
    // is an American date.
    ? XLSX.read(await file.text(), { type: 'string', raw: true, FS: name.endsWith('.tsv') ? '\t' : undefined })
    : XLSX.read(await file.arrayBuffer(), { type: 'array', cellNF: true, cellHTML: false, cellFormula: false, cellStyles: false, sheetStubs: false })

  const out: SheetData[] = []
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn]
    if (!ws || !ws['!ref']) continue
    // Date cells are stored as numbers with a date format. Write them out as
    // ISO so nobody has to guess whether 03/04 is March or April.
    if (!isText) {
      for (const k in ws) {
        if (k[0] === '!') continue
        const c = ws[k] as { t?: string; v?: unknown; z?: string; w?: string }
        if (c && c.t === 'n' && typeof c.v === 'number' && c.z && XLSX.SSF.is_date(c.z)) {
          const d = XLSX.SSF.parse_date_code(c.v)
          if (d && d.y) c.w = `${d.y}-${pad(d.m)}-${pad(d.d)}`
        }
      }
    }
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '', blankrows: false })
    const rows: string[][] = []
    for (const r of aoa) {
      const cells = (r as unknown[]).map(c => (c === null || c === undefined ? '' : String(c).replace(/\s+/g, ' ').trim()))
      while (cells.length && !cells[cells.length - 1]) cells.pop()
      if (cells.length) rows.push(cells)
    }
    if (rows.length) out.push({ name: sn, rows })
  }
  return out
}

/**
 * What the AI sees of one tab: its first rows, and for each column a handful of
 * the different values found anywhere in it — enough to tell a status column
 * from a notes column without sending the whole tab.
 */
export function sheetSample(s: SheetData, maxRows = 15, maxCols = 40) {
  const clip = (v: string, n: number) => (v.length > n ? v.slice(0, n) + '…' : v)
  const head = s.rows.slice(0, maxRows).map((r, i) => `${i}: ${r.slice(0, maxCols).map(c => clip(c, 50)).join(' | ')}`)
  const width = Math.min(maxCols, Math.max(0, ...s.rows.slice(0, 200).map(r => r.length)))
  const columns: string[] = []
  for (let c = 0; c < width; c++) {
    const seen = new Set<string>()
    for (const r of s.rows) {
      const v = r[c]
      if (v) seen.add(clip(v, 30))
      if (seen.size >= 8) break
    }
    if (seen.size) columns.push(`col ${c}: ${[...seen].join(' ; ')}`)
  }
  return `### Tab "${s.name}" — ${s.rows.length} rows\n${head.join('\n')}\n-- sample values per column --\n${columns.join('\n')}`
}

/** A tab as plain text in pieces small enough for one quick AI read each. */
export function sheetChunks(s: SheetData, maxChars = 7000): string[] {
  const line = (r: string[]) => r.join(' | ')
  const header = s.rows.slice(0, 2).map(line).join('\n')
  const chunks: string[] = []
  let cur: string[] = []
  let size = 0
  for (let i = 2; i < s.rows.length; i++) {
    const l = line(s.rows[i])
    if (size + l.length > maxChars && cur.length) { chunks.push(cur.join('\n')); cur = []; size = 0 }
    cur.push(l); size += l.length + 1
  }
  if (cur.length) chunks.push(cur.join('\n'))
  if (!chunks.length) chunks.push('')
  return chunks.map(c => `Tab "${s.name}" (first rows, repeated for context):\n${header}\n---\n${c}`)
}
