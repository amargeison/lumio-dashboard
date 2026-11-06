'use client'

// The printed Activity Booklet: on Equipment and in Settings → Welcome pack. HQ uploads
// it here; the file itself only ever leaves through a short-lived signed link. Live only,
// as the demo has no file behind it.

import React, { useRef, useState } from 'react'
import { BookOpen, ExternalLink, Upload } from 'lucide-react'
import { Card, Pill, SectionTitle, buttonPrimary, buttonSecondary } from './ui'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { sb, usePackAccess } from './PackIssue'
import { currentHq } from '@/lib/impact/org-scope'
import { longDate } from '@/lib/impact/compliance'
import { MAX_BOOKLET_PDF_BYTES, pdfSize, printKitLine } from '@/lib/impact/booklet-pdf'

/** Opens the tab first, so a phone doesn't treat it as a pop-up once the link comes back. */
export async function openBookletPdf(hqId: string) {
  const tab = window.open('', '_blank')
  const res = await fetch(`/api/impact/booklet-pdf?hq=${encodeURIComponent(hqId)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.url) { tab?.close(); throw new Error(body.error ?? 'The booklet couldn’t be opened.') }
  if (tab) tab.location.href = body.url
  else window.location.href = body.url
}

export default function BookletPdfCard({ printKit = false, bare = false, title = 'Activity Booklet' }: { printKit?: boolean; bare?: boolean; title?: string }) {
  const { mode } = useImpact()
  const { on, packs, canEdit, reload } = usePackAccess()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  if (mode !== 'live' || !on) return null
  const b = packs.booklet
  const kit = printKitLine(packs)

  async function upload(file: File | undefined) {
    if (!file) return
    setMsg(null)
    if (file.size > MAX_BOOKLET_PDF_BYTES) { setMsg({ text: 'That PDF is over the 10 MB limit.', bad: true }); return }
    setBusy(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/impact/booklet-pdf', { method: 'POST', body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'The PDF couldn’t be uploaded.')
      setMsg({ text: '✓ PDF uploaded.' }); reload()
    } catch (e) { setMsg({ text: e instanceof Error ? e.message : 'The PDF couldn’t be uploaded.', bad: true }) }
    setBusy(false)
    if (input.current) input.current.value = ''
  }
  async function open() {
    setMsg(null)
    try { await openBookletPdf(await currentHq(sb())) }
    catch (e) { setMsg({ text: e instanceof Error ? e.message : 'The booklet couldn’t be opened.', bad: true }) }
  }

  const body = (<>
    <SectionTitle sub="The printed booklet, for families to open from the parent app. Private: only your organisation’s logins can get it. PDF, up to 10 MB."><BookOpen size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />{title}</SectionTitle>
    {b?.pdf_path
      ? <div style={{ fontSize: 12.5, color: TP_DARK }}><strong>{b.pdf_name ?? 'booklet.pdf'}</strong><span style={{ color: '#6B6560' }}>{[b.pdf_pages ? `${b.pdf_pages} ${b.pdf_pages === 1 ? 'page' : 'pages'}` : null, b.pdf_bytes ? pdfSize(b.pdf_bytes) : null, b.pdf_uploaded_at ? `uploaded ${longDate(b.pdf_uploaded_at.slice(0, 10))}` : null].filter(Boolean).map(x => ` · ${x}`).join('')}</span></div>
      : <div style={{ fontSize: 12.5, color: '#6B6560' }}>No PDF uploaded yet.</div>}
    {printKit && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, fontSize: 12, color: '#6B6560' }}>{kit.text}{kit.low && <Pill tone="amber">LOW</Pill>}</div>}
    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
      {b?.pdf_path && <button onClick={open} style={buttonSecondary}><ExternalLink size={13} /> Open</button>}
      {canEdit && <button onClick={() => input.current?.click()} disabled={busy} style={buttonPrimary}><Upload size={13} /> {busy ? 'Uploading…' : b?.pdf_path ? 'Replace' : 'Upload PDF'}</button>}
      <input ref={input} type="file" accept="application/pdf" aria-label="Booklet PDF" onChange={e => upload(e.target.files?.[0])} style={{ display: 'none' }} />
    </div>
    {msg && <div role="status" style={{ fontSize: 12, color: msg.bad ? TP_RED : '#187A3C', marginTop: 8 }}>{msg.text}</div>}
  </>)
  return bare ? body : <Card>{body}</Card>
}
