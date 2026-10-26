'use client'

// Cards on file and recent card charges, shared by every screen that shows
// them (a player's card, a booking, the Payments page). One request, kept for
// a short while and refreshed after anything changes, so opening ten bookings
// does not ask ten times.

import { useEffect, useState } from 'react'

export type PayMethod = {
  id: string; player_id: string; status: 'invited' | 'active'; kind: 'card' | 'bacs_debit' | null
  brand: string | null; last4: string | null; exp_month: number | null; exp_year: number | null
  saved_at: string | null; link_sent_to: string | null; link_sent_at: string | null
  policy_agreed_at: string | null; agreed_by: string | null; created_at: string; url: string
}
export type PayCharge = {
  id: string; player_id: string | null; player_name: string | null; booking_id: string | null
  kind: 'lesson' | 'late_cancel' | 'no_show' | 'other' | 'group' | 'membership' | null; description: string | null
  /** A weekly-group answer this payment was for (migration 214). */
  reply_id?: string | null
  amount_pennies: number; status: 'pending' | 'charging' | 'processing' | 'paid' | 'failed' | 'refunded'
  failure_reason: string | null; refunded_pennies: number | null; charged_by: string | null
  created_at: string; paid_at: string | null
}
export type Wallet = { connected: boolean; chargesEnabled: boolean; methods: PayMethod[]; charges: PayCharge[] }

const EMPTY: Wallet = { connected: false, chargesEnabled: false, methods: [], charges: [] }
let cache: { at: number; data: Wallet } | null = null
let inflight: Promise<Wallet> | null = null
const subs = new Set<(w: Wallet) => void>()

async function fetchWallet(): Promise<Wallet> {
  try {
    const r = await fetch('/api/coach/pay/cards', { cache: 'no-store' })
    if (!r.ok) return EMPTY
    const d = await r.json()
    return { connected: !!d.connected, chargesEnabled: !!d.chargesEnabled, methods: d.methods || [], charges: d.charges || [] }
  } catch { return EMPTY }
}

/** Ask again now (after a charge, a card link, a removal) and tell every screen. */
export async function reloadWallet(): Promise<Wallet> {
  inflight = fetchWallet()
  const data = await inflight
  inflight = null
  cache = { at: Date.now(), data }
  subs.forEach(f => f(data))
  return data
}

/**
 * `fresh`: ask again on opening, whatever is cached — for the screens where
 * money is decided (a booking, the Payments page), so a charge made on another
 * device or by the automatic runner is never offered a second time from a
 * stale list. (The server would refuse it anyway; this keeps the screen honest.)
 */
export function useWallet(opts: { fresh?: boolean } = {}): { wallet: Wallet; loading: boolean } {
  const [w, setW] = useState<Wallet | null>(!opts.fresh && cache && Date.now() - cache.at < 60_000 ? cache.data : null)
  useEffect(() => {
    subs.add(setW)
    if (opts.fresh || !cache || Date.now() - cache.at >= 60_000) {
      if (!inflight) void reloadWallet(); else inflight.then(setW)
    } else setW(cache.data)
    return () => { subs.delete(setW) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return { wallet: w || EMPTY, loading: !w }
}

/** The card or Direct Debit a player has saved now. */
export const savedFor = (w: Wallet, playerId?: string | null) =>
  (playerId && w.methods.find(m => m.player_id === playerId && m.status === 'active')) || null

/** An open "save your card" invitation for a player. */
export const invitedFor = (w: Wallet, playerId?: string | null) =>
  (playerId && w.methods.find(m => m.player_id === playerId && m.status === 'invited')) || null

/** Charges for one lesson, newest first. */
export const chargesFor = (w: Wallet, bookingId?: string | null) => (bookingId ? w.charges.filter(c => c.booking_id === bookingId) : [])

/** "Visa •••• 4242" / "Direct Debit •••• 1234" */
export function methodLabel(m: Pick<PayMethod, 'kind' | 'brand' | 'last4'>): string {
  const brand = m.kind === 'bacs_debit' ? 'Direct Debit' : (m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : 'Card')
  return `${brand} •••• ${m.last4 || '????'}`
}

/** What a charge's state means, in words. */
export function chargeState(c: PayCharge): { text: string; tone: 'good' | 'warn' | 'bad' | 'muted' } {
  if (c.status === 'paid') return c.refunded_pennies ? { text: 'Part refunded', tone: 'warn' } : { text: 'Paid', tone: 'good' }
  if (c.status === 'refunded') return { text: 'Refunded', tone: 'muted' }
  if (c.status === 'processing') return { text: 'Direct Debit on its way', tone: 'warn' }
  if (c.status === 'charging') return { text: 'Charging…', tone: 'warn' }
  if (c.status === 'failed') return { text: 'Failed', tone: 'bad' }
  return { text: 'Waiting for payment', tone: 'muted' }
}
