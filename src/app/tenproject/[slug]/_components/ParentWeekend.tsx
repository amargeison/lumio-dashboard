'use client'

// Parent app (live) → "Your weekend session": the family's weekend venue, its next
// date, the family QR to show at check-in (when QR check-in is on), and "We're coming" / "Not this week" for
// that date (impact_parent_weekend / impact_parent_set_intent, migration 237). The
// answer feeds the volunteer view's expected numbers. Shows nothing for a family with
// no weekend venue.

import React, { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { MapPin } from 'lucide-react'
import { TP_DARK, TP_RED } from '@/data/tenproject/demo-data'
import QrCode from './QrCode'
import { nextDateFor } from '@/lib/impact/community-actions'
import { moduleOn } from '@/lib/impact/org'
import { useImpact } from './ImpactDataContext'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
const longDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

type Weekend = { family_id: string; checkin_code: string; waitlisted: boolean; venue: { id: string; name: string; address: string | null; postcode: string | null; session_day: string | null; session_time: string | null } | null; intents: { session_date: string; coming: boolean }[] }

export default function ParentWeekend() {
  // Settings → Modules → QR check-in. Off: no family QR card.
  const qrOn = moduleOn(useImpact().org?.settings, 'qr_checkin')
  const [w, setW] = useState<Weekend | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    const { data } = await sb().rpc('impact_parent_weekend')
    setW(((data as Weekend[] | null) ?? []).find(x => x.venue || x.waitlisted) ?? null)
  }, [])
  useEffect(() => { load() }, [load])
  if (!w) return null

  if (w.waitlisted || !w.venue) return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>YOUR WEEKEND SESSION</div>
      <div style={{ fontSize: 13, color: TP_DARK, marginTop: 6 }}>You’re on the waiting list{w.venue ? ` for ${w.venue.name}` : ''}. We’ll message you as soon as there’s a place.</div>
    </div>
  )
  const v = w.venue
  const next = nextDateFor(v.session_day, todayIso())
  const answer = next ? w.intents.find(i => i.session_date === next) : undefined
  async function say(coming: boolean) {
    if (!next) return
    setBusy(true); setError(null)
    const { error: e } = await sb().rpc('impact_parent_set_intent', { p_family: w!.family_id, p_date: next, p_coming: coming })
    if (e) setError(e.message); else await load()
    setBusy(false)
  }
  const btn = (on: boolean, primary: boolean): React.CSSProperties => ({ flex: 1, background: on ? (primary ? '#187A3C' : TP_DARK) : '#fff', color: on ? '#fff' : TP_DARK, border: '1px solid #E7E2DC', borderRadius: 10, padding: '11px 10px', fontSize: 13, fontWeight: 800, cursor: busy ? 'default' : 'pointer' })
  const where = [v.address, v.postcode].filter(Boolean).join(', ')
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }}>YOUR WEEKEND SESSION</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK, marginTop: 4 }}>{v.name}</div>
      <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 2 }}>{[v.session_day, v.session_time].filter(Boolean).join(' ')}{next ? ` · next: ${longDate(next)}` : ''}</div>
      {where && <div style={{ fontSize: 11.5, color: '#5B554F', marginTop: 6 }}><MapPin size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4, color: TP_RED }} />{where}</div>}
      {next && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button disabled={busy} onClick={() => say(true)} style={btn(answer?.coming === true, true)}>{answer?.coming === true ? '✓ We’re coming' : 'We’re coming'}</button>
          <button disabled={busy} onClick={() => say(false)} style={btn(answer?.coming === false, false)}>{answer?.coming === false ? '✓ Not this week' : 'Not this week'}</button>
        </div>
      )}
      {error && <div role="alert" style={{ fontSize: 12, color: TP_RED, fontWeight: 700, marginTop: 6 }}>{error}</div>}
      {qrOn && <div style={{ textAlign: 'center', marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TP_DARK, letterSpacing: 0.6, marginBottom: 6 }}>YOUR FAMILY QR — SHOW IT WHEN YOU ARRIVE</div>
        <div style={{ display: 'inline-block' }}><QrCode value={w.checkin_code} size={150} label="Your family check-in code" /></div>
        <div style={{ fontSize: 11, color: '#8A847E', letterSpacing: 1, marginTop: 4 }}>{w.checkin_code.replace(/(.{4})(?=.)/g, '$1 ')}</div>
      </div>}
    </div>
  )
}
