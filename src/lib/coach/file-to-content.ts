// ─────────────────────────────────────────────────────────────────────────────
// Turning a coach's file into something the model can read.
//
// Lifted out of /api/coach/import, which had the only working version of this in
// the codebase. Spreadsheets get flattened to CSV, Word to raw text, PDFs go
// through as native document blocks and screenshots as images — so a coach can
// hand over whatever they actually have rather than whatever we would prefer.
//
// It is shared rather than copied because the alternative is two extractors that
// drift: one learns to handle a .numbers export and the other does not, and
// which one you get depends on which screen you happened to be on.
// ─────────────────────────────────────────────────────────────────────────────

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }

// nginx defaults to a 1MB request body, so anything larger needs
// `client_max_body_size 12m;` in the site config or it 413s before reaching us.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

// Beyond this the model is reading a novel, not a camp plan. Trimming keeps the
// call fast and the cost sane, and the notice means the model knows it is not
// seeing everything rather than silently assuming it is.
const MAX_TEXT = 120_000

export class UnreadableFile extends Error {}

const trim = (s: string) =>
  s.length > MAX_TEXT ? `${s.slice(0, MAX_TEXT)}\n\n[... truncated - the file was longer than this]` : s

/**
 * Everything the model needs in order to read one uploaded file.
 *
 * Returns the content blocks WITHOUT any instruction attached — the caller adds
 * its own prompt. That separation is the point: onboarding wants records out of
 * a spreadsheet, the camp designer wants a week's plan out of a PDF, and both
 * read the file in exactly the same way.
 */
export async function fileToContent(file: File): Promise<{ blocks: ContentBlock[]; kind: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UnreadableFile(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB — try exporting it as a PDF or CSV.`)
  }

  const name = (file.name || '').toLowerCase()
  const buf = Buffer.from(await file.arrayBuffer())
  const header = (kind: string) => `--- FILE: ${file.name} (${kind}) ---`

  if (/\.(csv|tsv|txt|md)$/.test(name)) {
    return { kind: 'text', blocks: [{ type: 'text', text: `${header('text')}\n${trim(buf.toString('utf-8'))}` }] }
  }

  if (/\.(xlsx|xls|xlsm)$/.test(name)) {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'buffer' })
    // Every sheet, named. A coach's workbook routinely has the schedule on one
    // tab and the kit list on another, and losing the tab names loses the point.
    const text = wb.SheetNames
      .map(sn => `# Sheet: ${sn}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sn])}`)
      .join('\n\n')
    return { kind: 'spreadsheet', blocks: [{ type: 'text', text: `${header('spreadsheet')}\n${trim(text)}` }] }
  }

  if (name.endsWith('.docx')) {
    try {
      const mammoth: any = await import('mammoth')
      const { value } = await mammoth.extractRawText({ buffer: buf })
      return { kind: 'document', blocks: [{ type: 'text', text: `${header('Word document')}\n${trim(String(value))}` }] }
    } catch {
      throw new UnreadableFile('Word files need the "mammoth" package installed on the server. Export it as a PDF and try again.')
    }
  }

  if (name.endsWith('.pdf')) {
    // Native document block — the model reads the layout, so a table in a
    // brochure survives as a table rather than becoming soup.
    return {
      kind: 'pdf',
      blocks: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } }],
    }
  }

  if (/\.(png|jpe?g|webp|gif)$/.test(name)) {
    const media_type = name.endsWith('.png') ? 'image/png'
      : name.endsWith('.webp') ? 'image/webp'
      : name.endsWith('.gif') ? 'image/gif'
      : 'image/jpeg'
    return { kind: 'image', blocks: [{ type: 'image', source: { type: 'base64', media_type, data: buf.toString('base64') } }] }
  }

  // Unknown extension. If it decodes as text it is probably an export with an
  // odd suffix; if it is binary, say so plainly rather than sending rubbish.
  const asText = buf.toString('utf-8')
  // eslint-disable-next-line no-control-regex
  const looksBinary = /[\x00-\x08\x0E-\x1F]/.test(asText.slice(0, 2000))
  if (looksBinary) {
    throw new UnreadableFile('That file type is not supported. Try a PDF, spreadsheet, Word document, or a screenshot.')
  }
  return { kind: 'text', blocks: [{ type: 'text', text: `${header('text')}\n${trim(asText)}` }] }
}

/** The accept attribute for a file input, kept beside what the parser handles. */
export const UPLOAD_ACCEPT = '.pdf,.csv,.tsv,.txt,.md,.xlsx,.xls,.xlsm,.docx,.png,.jpg,.jpeg,.webp,.gif'
