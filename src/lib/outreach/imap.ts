// Server-only, dependency-free IMAP reader — the other half of smtp.ts.
//
// Outreach sends from an ordinary mailbox, so the answers come back to that
// mailbox: replies, out-of-office notes and "address not found" bounces. This
// reads the recent inbox so those can be counted without anyone copying them
// across by hand.
//
// It only ever LOOKS. The mailbox is opened with EXAMINE (read-only) and the
// messages are fetched with BODY.PEEK, so nothing is marked as read, moved or
// deleted — the inbox is exactly as its owner left it.
//
// Flow: TLS connect → LOGIN → EXAMINE INBOX → UID SEARCH SINCE → UID FETCH
// (a handful of headers and the first few KB of the body) → LOGOUT.

import tls from 'node:tls'

export type InboxMessage = {
  uid: number
  date: Date | null                    // when the mailbox received it
  from: string                         // bare address, lower-cased
  subject: string
  headers: Record<string, string>      // lower-cased names, unfolded values
  text: string                         // best-effort plain text of the start of the body
}

type Unit = { text: string; literals: Buffer[] }

const quote = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** RFC 2047 encoded words ("=?UTF-8?B?…?=") → text. */
export function decodeWords(s: string): string {
  return s.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=(\s+(?==\?))?/g, (_m, charset: string, enc: string, data: string) => {
    try {
      const buf = enc.toLowerCase() === 'b'
        ? Buffer.from(data, 'base64')
        : Buffer.from(data.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_x, h: string) => String.fromCharCode(parseInt(h, 16))), 'latin1')
      return new TextDecoder(charset.toLowerCase().replace(/^utf8$/, 'utf-8')).decode(buf)
    } catch { return data }
  })
}

export function parseHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i > 0) out[line.slice(0, i).trim().toLowerCase()] = decodeWords(line.slice(i + 1).trim())
  }
  return out
}

/** "Jane <JANE@club.co.uk>" → "jane@club.co.uk". */
export function addressOf(v: string): string {
  const m = v.match(/<([^<>\s]+@[^<>\s]+)>/) || v.match(/([^\s<>"',;:()]+@[^\s<>"',;:()]+)/)
  return (m ? m[1] : '').trim().toLowerCase()
}

function decodeBody(body: string, encoding: string, charset: string): string {
  const enc = encoding.trim().toLowerCase()
  let buf: Buffer
  if (enc === 'base64') {
    // The fetch is cut at a byte count, so the last line may be a part line.
    const clean = body.replace(/[^A-Za-z0-9+/=]/g, '')
    buf = Buffer.from(clean.slice(0, clean.length - (clean.length % 4)), 'base64')
  } else if (enc === 'quoted-printable') {
    buf = Buffer.from(body.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_x, h: string) => String.fromCharCode(parseInt(h, 16))), 'latin1')
  } else {
    buf = Buffer.from(body, 'latin1')
  }
  try { return new TextDecoder((charset || 'utf-8').toLowerCase().replace(/^utf8$/, 'utf-8')).decode(buf) } catch { return buf.toString('utf8') }
}

const stripHtml = (s: string) => s.replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')

/**
 * The readable start of a message. `raw` is the first few KB of the body as it
 * sits on the server (latin1, so bytes survive); `top` is the message's own
 * headers. Finds the first text/plain part of a multipart message, or falls
 * back to text/html with the tags removed.
 */
export function plainText(top: Record<string, string>, raw: string): string {
  const ctype = top['content-type'] || 'text/plain'
  const charsetOf = (ct: string) => (ct.match(/charset="?([^";\s]+)"?/i) || [])[1] || 'utf-8'
  if (!/^multipart\//i.test(ctype)) {
    const t = decodeBody(raw, top['content-transfer-encoding'] || '', charsetOf(ctype))
    return /html/i.test(ctype) ? stripHtml(t) : t
  }
  // Walk every part header in the fragment, nested multiparts included.
  const parts: { type: string; enc: string; body: string }[] = []
  const re = /\r?\n?--[^\r\n]+\r?\n((?:[!-9;-~]+:[^\r\n]*(?:\r?\n[ \t][^\r\n]*)*\r?\n)+)\r?\n/g
  const marks: { end: number; start: number; h: Record<string, string> }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec('\r\n' + raw))) marks.push({ start: m.index, end: m.index + m[0].length, h: parseHeaders(m[1]) })
  const src = '\r\n' + raw
  marks.forEach((k, i) => {
    const until = i + 1 < marks.length ? marks[i + 1].start : src.length
    const body = src.slice(k.end, until).replace(/\r?\n--[^\r\n]*--\s*$/, '')
    parts.push({ type: k.h['content-type'] || 'text/plain', enc: k.h['content-transfer-encoding'] || '', body })
  })
  const pick = parts.find(p => /^text\/plain/i.test(p.type)) || parts.find(p => /^text\/html/i.test(p.type))
  if (!pick) return decodeBody(raw, '', 'utf-8')
  const t = decodeBody(pick.body, pick.enc, charsetOf(pick.type))
  return /html/i.test(pick.type) ? stripHtml(t) : t
}

/**
 * Read the inbox's recent messages. Never throws: a mailbox that cannot be
 * reached comes back as { ok: false, error } so the caller can say so.
 */
export async function readInbox(o: { host: string; port?: number; user: string; pass: string; sinceDays?: number; max?: number }):
  Promise<{ ok: true; messages: InboxMessage[] } | { ok: false; error: string }> {
  let socket: tls.TLSSocket | null = null
  try {
    socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const s = tls.connect({ host: o.host, port: o.port || 993, servername: o.host }, () => resolve(s))
      s.setTimeout(25_000)
      s.once('error', reject)
      s.once('timeout', () => reject(new Error('IMAP timeout')))
    })
    const sock = socket

    // ── Reader. IMAP mixes lines with "literals": `{123}` at the end of a line
    // means the next 123 BYTES are data, then the line carries on. So this
    // works on bytes and never splits on a newline that sits inside a literal.
    let buf: Buffer = Buffer.alloc(0)
    let cur: Unit = { text: '', literals: [] }
    let need = 0                                  // bytes of literal still to read
    const done: Unit[] = []
    let wake: (() => void) | null = null
    let dead: Error | null = null
    const pump = () => {
      for (;;) {
        if (need > 0) {
          if (buf.length < need) return
          cur.literals.push(buf.subarray(0, need)); buf = buf.subarray(need); need = 0
          continue
        }
        const nl = buf.indexOf('\r\n')
        if (nl < 0) return
        const line = buf.subarray(0, nl).toString('latin1'); buf = buf.subarray(nl + 2)
        const lit = line.match(/\{(\d+)\}$/)
        if (lit) { cur.text += line.slice(0, lit.index) + `\u0000${cur.literals.length}\u0000`; need = Number(lit[1]); continue }
        cur.text += line
        done.push(cur); cur = { text: '', literals: [] }
      }
    }
    sock.on('data', (c: Buffer) => { buf = buf.length ? Buffer.concat([buf, c]) : c; pump(); const w = wake; wake = null; w?.() })
    sock.on('error', (e: Error) => { dead = e; const w = wake; wake = null; w?.() })
    sock.on('timeout', () => { dead = new Error('IMAP timeout'); const w = wake; wake = null; w?.() })
    sock.on('close', () => { dead = dead || new Error('IMAP connection closed'); const w = wake; wake = null; w?.() })
    const next = async (): Promise<Unit> => {
      for (;;) {
        const u = done.shift()
        if (u) return u
        if (dead) throw dead
        await new Promise<void>(r => { wake = r })
      }
    }
    let n = 0
    const cmd = async (line: string): Promise<Unit[]> => {
      const tag = `A${++n}`
      sock.write(`${tag} ${line}\r\n`)
      const got: Unit[] = []
      for (;;) {
        const u = await next()
        if (u.text.startsWith(tag + ' ')) {
          if (!/^\S+ OK/i.test(u.text)) throw new Error(`IMAP: ${u.text.slice(tag.length + 1, 160).replace(o.pass, '…')}`)
          return got
        }
        got.push(u)
      }
    }

    const hello = await next()
    if (!/^\* (OK|PREAUTH)/i.test(hello.text)) throw new Error('IMAP: unexpected greeting')
    await cmd(`LOGIN ${quote(o.user)} ${quote(o.pass)}`)
    await cmd('EXAMINE INBOX')

    const since = new Date(Date.now() - (o.sinceDays ?? 14) * 86400000)
    const found = await cmd(`UID SEARCH SINCE ${since.getUTCDate()}-${MONTHS[since.getUTCMonth()]}-${since.getUTCFullYear()}`)
    const uids = found.filter(u => /^\* SEARCH/i.test(u.text)).flatMap(u => u.text.split(/\s+/).slice(2).map(Number)).filter(x => x > 0)
      .sort((a, b) => a - b).slice(-(o.max ?? 300))

    const messages: InboxMessage[] = []
    const FIELDS = 'FROM SUBJECT AUTO-SUBMITTED X-AUTOREPLY X-AUTORESPOND X-AUTO-RESPONSE-SUPPRESS PRECEDENCE X-FAILED-RECIPIENTS CONTENT-TYPE CONTENT-TRANSFER-ENCODING'
    for (let i = 0; i < uids.length; i += 40) {
      const got = await cmd(`UID FETCH ${uids.slice(i, i + 40).join(',')} (UID INTERNALDATE BODY.PEEK[HEADER.FIELDS (${FIELDS})] BODY.PEEK[TEXT]<0.12000>)`)
      for (const u of got) {
        if (!/^\* \d+ FETCH/i.test(u.text)) continue
        const uid = Number((u.text.match(/\bUID (\d+)/i) || [])[1])
        if (!uid) continue
        const dm = u.text.match(/INTERNALDATE "([^"]+)"/i)
        const d = dm ? new Date(dm[1].trim().replace(/^(\d{1,2})-(\w{3})-(\d{4})/, '$1 $2 $3')) : null
        // Which literal is which is told by the words just in front of it.
        const lit = (marker: RegExp) => {
          const mm = u.text.match(new RegExp(marker.source + '[^\\u0000]*\\u0000(\\d+)\\u0000', 'i'))
          return mm ? u.literals[Number(mm[1])]?.toString('latin1') ?? '' : ''
        }
        const headers = parseHeaders(lit(/BODY\[HEADER\.FIELDS/))
        const text = plainText(headers, lit(/BODY\[TEXT\]/))
        messages.push({
          uid, date: d && !isNaN(d.getTime()) ? d : null,
          from: addressOf(headers.from || ''), subject: headers.subject || '', headers,
          text: text.replace(/\r\n/g, '\n').slice(0, 8000),
        })
      }
    }
    try { sock.write(`A${++n} LOGOUT\r\n`) } catch { /* already gone */ }
    sock.end()
    return { ok: true, messages }
  } catch (e) {
    try { socket?.destroy() } catch { /* ignore */ }
    const msg = e instanceof Error ? e.message : 'IMAP error'
    return { ok: false, error: /AUTHENTICATIONFAILED|Invalid credentials/i.test(msg) ? 'The mailbox refused the sign-in. For Gmail, check the app password and that IMAP is on.' : msg }
  }
}
