// What the parent app shows for a child, an email opt-in and the sticker count. No
// database here, so it runs the same in the browser and the tests.

import { httpsUrl } from './booklet-import'
import type { Booklet } from './packs'

/** "Sam, 8 — Hollinsmere Primary", with the age or school left out when there isn't one. */
export function childLine(c: { name: string; age?: number | null; school?: string | null }): string {
  const who = c.age ? `${c.name}, ${c.age}` : c.name
  return c.school ? `${who} — ${c.school}` : who
}

interface EmailChoice { opt_in_email: boolean | null; unsubscribed_at?: string | null }

/** An unsubscribe beats the stored flag, which the email link leaves as it was. */
export const emailTicked = (f: EmailChoice) => !f.unsubscribed_at && f.opt_in_email === true

/** Only a tick on an unsubscribed family opts them back in. */
export const optsBackIn = (f: EmailChoice, ticked: boolean | null) => !!f.unsubscribed_at && ticked === true

/** "5 Nov", the day it was in the UK. */
export const ukDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })

export interface StickerArea { id: string; label: string; desc: string }

/** The org's stickers. Live has none until the booklet has them; the demo keeps its own. */
export function stickerAreas(booklet: Booklet | null, live: boolean, demo: readonly StickerArea[]): readonly StickerArea[] {
  if (booklet?.stickers.length) return booklet.stickers.map(s => ({ id: s.id, label: s.label, desc: s.description }))
  return live ? [] : demo
}

/** Has the org written anything in its booklet? */
export const bookletWritten = (b: Booklet | null) =>
  !!b && (!!b.title || b.stickers.length > 0 || b.weeks.some(w => w.title || w.focus || w.home_task))

/** The link for a week's video. Absent, or anything but https, means no link. */
export function videoLink(b: Booklet | null, key: string | undefined): string | null {
  const url = key ? b?.videos?.[key] : undefined
  return httpsUrl(url) ? url : null
}

export interface ScorecardGame { a: number | null; b: number | null }
export const scorecardTotal = (games: ScorecardGame[], side: 'a' | 'b') => games.reduce((n, g) => n + (g[side] ?? 0), 0)
/** Only an org that turns it on for week 10 gets the Festival scorecard. */
export const scorecardOn = (b: Booklet | null) => b?.weeks.find(w => w.week === 10)?.scorecard === true
