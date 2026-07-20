// Server-only, dependency-free SMTP client (STARTTLS) — used to send "as the
// coach" over iCloud, which offers no send API (unlike Gmail/Graph). Node core
// `net`/`tls` only; runs on the Node.js runtime (never Edge).
//
// Flow: connect plaintext → EHLO → STARTTLS → upgrade to TLS → EHLO → AUTH LOGIN
// → MAIL FROM / RCPT TO → DATA → QUIT. Handles multiline replies, dot-stuffing
// and a hard timeout.

import net from 'node:net'
import tls from 'node:tls'

export type SmtpMail = {
  host: string
  port: number
  user: string          // SMTP username (Apple ID)
  pass: string          // app-specific password
  from: string          // From: address (usually === user)
  to: string
  subject: string
  html: string
  replyTo?: string
  bcc?: string
}

function encodeHeaderWord(s: string): string {
  // RFC 2047 for non-ASCII header values (subjects with emoji/accents).
  return /^[\x20-\x7E]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`
}

function buildMime(m: SmtpMail): string {
  const headers = [
    `From: ${m.from}`,
    `To: ${m.to}`,
    m.replyTo ? `Reply-To: ${m.replyTo}` : '',
    `Subject: ${encodeHeaderWord(m.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ].filter(Boolean).join('\r\n')
  // Normalise newlines and dot-stuff (lines starting with "." → "..") so the
  // body can't prematurely terminate the DATA command.
  const body = m.html.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
  return `${headers}\r\n\r\n${body}`
}

export async function sendMailSmtp(m: SmtpMail): Promise<{ ok: boolean; error?: string }> {
  let socket: net.Socket | tls.TLSSocket = net.connect({ host: m.host, port: m.port })
  socket.setEncoding('utf8')

  let buffer = ''
  let waiter: { resolve: (code: number) => void; reject: (e: Error) => void } | null = null

  // Deliver a complete SMTP reply (final line "NNN <text>", space not hyphen).
  const flush = () => {
    if (!waiter) return
    const lines = buffer.split(/\r?\n/)
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const code = parseInt(lines[i].slice(0, 3), 10)
        buffer = lines.slice(i + 1).join('\r\n')
        const w = waiter; waiter = null
        w.resolve(code)
        return
      }
    }
  }
  const attach = (s: net.Socket | tls.TLSSocket) => {
    s.on('data', (c: string) => { buffer += c; flush() })
    s.on('error', (e: Error) => { const w = waiter; waiter = null; w?.reject(e) })
    s.on('timeout', () => { const w = waiter; waiter = null; w?.reject(new Error('SMTP timeout')) })
  }
  socket.setTimeout(20_000)
  attach(socket)

  const expect = (want: number, alsoOk: number[] = []) => new Promise<number>((resolve, reject) => {
    waiter = {
      resolve: (code) => (code === want || alsoOk.includes(code)) ? resolve(code) : reject(new Error(`SMTP ${code} (wanted ${want})`)),
      reject,
    }
    flush()   // drain a reply that already arrived (e.g. the 220 greeting)
  })
  const send = (line: string) => socket.write(line + '\r\n')
  const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64')

  const upgradeTls = () => new Promise<tls.TLSSocket>((resolve, reject) => {
    const secure = tls.connect({ socket: socket as net.Socket, servername: m.host }, () => resolve(secure))
    secure.setEncoding('utf8')
    secure.setTimeout(20_000)
    secure.once('error', reject)
  })

  try {
    await expect(220)                                   // greeting
    send('EHLO lumiosports.com'); await expect(250)
    send('STARTTLS'); await expect(220)
    socket = await upgradeTls()
    buffer = ''
    attach(socket)
    send('EHLO lumiosports.com'); await expect(250)
    send('AUTH LOGIN'); await expect(334)
    send(b64(m.user)); await expect(334)
    send(b64(m.pass)); await expect(235)
    send(`MAIL FROM:<${m.from}>`); await expect(250)
    send(`RCPT TO:<${m.to}>`); await expect(250, [251])
    if (m.bcc) { send(`RCPT TO:<${m.bcc}>`); await expect(250, [251]) }
    send('DATA'); await expect(354)
    socket.write(buildMime(m) + '\r\n.\r\n'); await expect(250)
    send('QUIT')
    socket.end()
    return { ok: true }
  } catch (e) {
    try { socket.end() } catch { /* ignore */ }
    return { ok: false, error: e instanceof Error ? e.message : 'SMTP error' }
  }
}
