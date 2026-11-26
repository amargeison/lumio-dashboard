'use client'

// Volunteer view, live: check a family in from their QR (camera) or the code under it
// (typed). Each check-in records attendance for every child in the family at today's
// weekend session at the venue (impact_family_checkin, migration 237) and the numbers
// below — checked in, expected ("We're coming"), not coming — come from
// impact_weekend_day. The camera is only opened when "Scan" is pressed, and the frames
// never leave the device (decoded here with jsQR).

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Camera, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { Card, SectionTitle, formField, buttonPrimary, buttonSecondary } from './ui'
import { TP_DARK, TP_RED } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { currentHq } from '@/lib/impact/org-scope'
import { checkIn, weekendDay, type WeekendDay } from '@/lib/impact/community-actions'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

export default function FamilyCheckIn() {
  const ctx = useImpact()
  const venues = ctx.people?.community?.venues ?? []
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [day, setDay] = useState<WeekendDay | null>(null)
  const [scanning, setScanning] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)

  const refresh = useCallback(async () => {
    if (!venueId) return
    try { setDay(await weekendDay(sb(), await currentHq(sb()), venueId, todayIso())) } catch { setDay(null) }
  }, [venueId])
  useEffect(() => { refresh() }, [refresh])

  const submit = useCallback(async (raw: string) => {
    const c = raw.trim()
    if (!c || !venueId) return
    setBusy(true); setResult(null)
    try {
      const r = await checkIn(sb(), await currentHq(sb()), venueId, c)
      if (!r.ok) setResult({ ok: false, text: r.error })
      else {
        const v = r.value
        setResult({ ok: true, text: v.children.length ? `${v.family}: ${v.children.join(', ')} checked in${v.already.length ? ` (${v.already.join(', ')} already in)` : ''}.` : v.already.length ? `${v.family}: already checked in.` : `${v.family}: no children are recorded for this family.` })
        setCode('')
        refresh()
        ctx.reload?.()   // the register below shows them in
      }
    } catch (e) { setResult({ ok: false, text: e instanceof Error ? e.message : 'Please sign in again.' }) }
    finally { setBusy(false) }
  }, [venueId, refresh, ctx])

  const stop = useCallback(() => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setScanning(false) }, [])
  useEffect(() => stop, [stop])
  async function scan() {
    setResult(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      stream.current = s; setScanning(true)
      const jsQR = (await import('jsqr')).default
      requestAnimationFrame(function loop() {
        const v = video.current
        if (!stream.current) return
        if (v && v.srcObject !== s) { v.srcObject = s; v.play().catch(() => {}) }
        if (v && v.readyState >= 2 && v.videoWidth) {
          const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight
          const g = c.getContext('2d', { willReadFrequently: true })!
          g.drawImage(v, 0, 0)
          const found = jsQR(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height)
          if (found?.data) { stop(); submit(found.data); return }
        }
        requestAnimationFrame(loop)
      })
    } catch { setResult({ ok: false, text: 'The camera couldn’t be opened — allow camera access, or type the code instead.' }); stop() }
  }

  if (!venues.length) return null
  return (
    <Card>
      <SectionTitle sub="Scan a family’s QR, or type the code under it — every child in the family is checked in to today’s session">Family check-in</SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select aria-label="Venue" style={{ ...formField, width: 'auto' }} value={venueId} onChange={e => setVenueId(e.target.value)}>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button style={buttonPrimary} disabled={busy || scanning} onClick={scan}><Camera size={13} /> Scan</button>
        <form onSubmit={e => { e.preventDefault(); submit(code) }} style={{ display: 'flex', gap: 6, flex: '1 1 220px' }}>
          <input aria-label="Family code" placeholder="Or type the code, e.g. KZGR JJQ4 8HHT" value={code} onChange={e => setCode(e.target.value)} style={{ ...formField, letterSpacing: 1 }} autoCapitalize="characters" />
          <button type="submit" style={{ ...buttonSecondary, whiteSpace: 'nowrap' }} disabled={busy || !code.trim()}>Check in</button>
        </form>
      </div>
      {scanning && (
        <div style={{ position: 'relative', marginTop: 10, maxWidth: 360 }}>
          <video ref={video} muted playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
          <button aria-label="Stop scanning" onClick={stop} style={{ position: 'absolute', top: 8, right: 8, background: '#fff', border: 'none', borderRadius: 99, padding: 6, cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}
      {result && <div role={result.ok ? 'status' : 'alert'} style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: result.ok ? '#187A3C' : TP_RED }}>
        {result.ok ? <CheckCircle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} /> : <AlertTriangle size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5 }} />}{result.text}</div>}
      {day && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: TP_DARK, flexWrap: 'wrap' }}>
          <span><b style={{ fontSize: 18 }}>{day.checked_in_children}</b> children in ({day.checked_in_families} families)</span>
          <span><b style={{ fontSize: 18 }}>{day.expected_families}</b> families said they’re coming ({day.expected_children} children)</span>
          <span><b style={{ fontSize: 18 }}>{day.not_coming_families}</b> not this week</span>
        </div>
      )}
    </Card>
  )
}
