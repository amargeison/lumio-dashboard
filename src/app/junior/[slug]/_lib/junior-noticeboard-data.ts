// junior-noticeboard-data.ts
//
// Broadcasts + activity events demo data for the Noticeboard.
// Separated from junior-dashboard-data.ts because (a) volume is
// significant (8 broadcasts + 15 events at v1, will grow), (b) only
// the Noticeboard surface consumes it, (c) matches Phase 3a/3b
// _lib data-file conventions.
//
// Strategic split confirmed:
//   INBOX     = personal messages addressed to me (DMs)
//   NOTICEBOARD = broadcasts (chair/coach/welfare posts) + activity
//               events (system-generated)
//
// Phase 3c v1 ports the previous "Pete Connolly · Insurance renewal"
// entry FROM JUNIOR_INBOX (where it was structurally miscategorised
// as a DM) INTO JUNIOR_BROADCASTS. See commit 1b for the Inbox
// removal.
//
// Reactions are demo-state mutable inside the Noticeboard component.
// Seed reaction counts in this file represent "what other club
// members have already reacted" — the local user's own reaction is
// applied on top via component state.
//
// Timestamps are ISO strings. The UI derives human display
// ("Yesterday", "2 hours ago") via formatRelativeTime below. Anchor
// date for the demo is 24 May 2026 (matches JUNIOR_NEXT_FIXTURE).

import type { JuniorAgeBand } from './junior-club-data'

// ─── Broadcast types ──────────────────────────────────────────────────

export type JuniorBroadcastAudience = 'club_wide' | 'staff_only' | 'age_band'
export type JuniorBroadcastAuthorRole = 'chair' | 'welfare_officer' | 'coach' | 'team_manager'
export type JuniorReactionType = 'acknowledged' | 'done' | 'seen'

export type JuniorReaction = {
  userId: string
  type: JuniorReactionType
  timestamp: string  // ISO
}

export type JuniorBroadcast = {
  id: string
  author: { name: string; role: JuniorBroadcastAuthorRole }
  timestamp: string  // ISO
  title: string
  body: string
  pinned: boolean
  audience: JuniorBroadcastAudience
  ageBand?: JuniorAgeBand
  reactions: JuniorReaction[]
}

// ─── Activity event types ─────────────────────────────────────────────

export type JuniorActivityCategory =
  | 'availability' | 'registration' | 'logistics' | 'compliance'
  | 'match_outcome' | 'welfare' | 'achievement'

/** Visibility:
 *   'all'   = visible to every role
 *   'staff' = any non-parent_guardian role
 *   string[] = explicit role whitelist (used for welfare events) */
export type JuniorActivityVisibility = 'all' | 'staff' | string[]

export type JuniorActivityEvent = {
  id: string
  category: JuniorActivityCategory
  timestamp: string
  title: string
  detail?: string
  ageBand?: JuniorAgeBand
  actorName?: string
  visibility: JuniorActivityVisibility
}

// ─── Broadcasts seed data ─────────────────────────────────────────────

export const JUNIOR_BROADCASTS: JuniorBroadcast[] = [
  {
    id: 'b1',
    author: { name: 'Pete Connolly', role: 'chair' },
    timestamp: '2026-05-21T19:30:00+01:00',  // 3 days ago, anchor 24 May
    title: 'AGM 2026 — Mon 14 Jul, 19:30 at the pavilion',
    body: "All parents and volunteers — date confirmed for the annual AGM. Monday 14 July, 19:30 at the pavilion. Refreshments from 19:15. Agenda goes out two weeks before — Saoirse will circulate. Items to add? Email Saoirse or reply here with a 👍 to acknowledge. Please prioritise attending — it's the one night a year the club's direction gets set by the people who actually show up.",
    pinned: true,
    audience: 'club_wide',
    reactions: [
      // 12 acknowledged + 4 done — synthetic parent userIds for seed
      ...Array.from({ length: 12 }).map((_, i) => ({
        userId: `parent-${i + 1}`,
        type: 'acknowledged' as const,
        timestamp: '2026-05-21T20:15:00+01:00',
      })),
      ...Array.from({ length: 4 }).map((_, i) => ({
        userId: `parent-${i + 13}`,
        type: 'done' as const,
        timestamp: '2026-05-21T21:00:00+01:00',
      })),
    ],
  },
  {
    id: 'b2',  // migrated from JUNIOR_INBOX item 5
    author: { name: 'Pete Connolly', role: 'chair' },
    timestamp: '2026-05-23T21:18:00+01:00',  // Yesterday 21:18 (anchor 24 May)
    title: 'Club public liability insurance renews 31 May — action needed',
    body: 'All — heads up. Our annual public liability insurance is up for renewal 31 May. Renewal quote came in £20 higher than last year. Need committee sign-off this week, then I can pay and forward the certificate to FA. Charter Standard panel checks for this. Please thumbs-up below or flag any concerns.',
    pinned: false,
    audience: 'club_wide',
    reactions: [
      // Jo Sefer's "Budget's fine — go ahead" reply captured as 👍
      {
        userId: 'jo-sefer',
        type: 'acknowledged',
        timestamp: '2026-05-23T21:34:00+01:00',
      },
    ],
  },
  {
    id: 'b3',
    author: { name: 'Pete Connolly', role: 'chair' },
    timestamp: '2026-05-20T19:00:00+01:00',  // 4 days ago
    title: 'Committee actions · Mon 05 May',
    body: "Quick summary of what landed on the committee from Monday's meeting: (1) Goalpost replacement — Jo Sefer drafting price list this week. (2) Fundraising Lead recruitment — Helena drafting the parent-WhatsApp ask. (3) AGM venue confirmed — see pinned post. Action owners tagged in the Committee Suite tracker.",
    pinned: false,
    audience: 'staff_only',
    reactions: [
      { userId: 'helena-mahan', type: 'seen', timestamp: '2026-05-20T19:30:00+01:00' },
      { userId: 'jo-sefer', type: 'seen', timestamp: '2026-05-20T20:00:00+01:00' },
      { userId: 'saoirse-lynch', type: 'seen', timestamp: '2026-05-20T20:15:00+01:00' },
      { userId: 'jenna-holroyd', type: 'seen', timestamp: '2026-05-20T21:00:00+01:00' },
    ],
  },
  {
    id: 'b4',
    author: { name: 'Jenna Holroyd', role: 'welfare_officer' },
    timestamp: '2026-05-22T10:00:00+01:00',  // 2 days ago
    title: 'Charter Standard refresher — every volunteer coach, deadline 30 Jun',
    body: "All volunteer coaches — your annual FA Safeguarding refresher is due before 30 June. It's the online module from the FA Learning portal, ~45 minutes. Once you've done it, send me your certificate (PDF or screenshot of the completion page) and I'll log it in the DBS register. Parents — no action needed from your side; just heads up that every volunteer is up to date.",
    pinned: false,
    audience: 'club_wide',
    reactions: [
      ...Array.from({ length: 7 }).map((_, i) => ({
        userId: `coach-${i + 1}`,
        type: 'done' as const,
        timestamp: '2026-05-22T14:00:00+01:00',
      })),
      ...Array.from({ length: 3 }).map((_, i) => ({
        userId: `coach-${i + 8}`,
        type: 'seen' as const,
        timestamp: '2026-05-22T15:00:00+01:00',
      })),
    ],
  },
  {
    id: 'b5',
    author: { name: 'Jenna Holroyd', role: 'welfare_officer' },
    timestamp: '2026-05-23T08:00:00+01:00',  // Yesterday
    title: 'Lost property pile is getting biblical — please check Saturday',
    body: 'The lost-property box in the pavilion is overflowing again. Mostly hoodies and water bottles. Please ask your child to have a look on Saturday before kick-off. Anything still there at the end of next week goes to the County FA charity bag run.',
    pinned: false,
    audience: 'club_wide',
    reactions: [
      ...Array.from({ length: 14 }).map((_, i) => ({
        userId: `parent-lost-${i + 1}`,
        type: 'seen' as const,
        timestamp: '2026-05-23T10:00:00+01:00',
      })),
    ],
  },
  {
    id: 'b6',
    author: { name: 'Mark Hutchings', role: 'coach' },
    timestamp: '2026-05-24T08:30:00+01:00',  // 5 hours ago (anchor 24 May ~13:30)
    title: 'U11 Lions Tuesday training — Pitch 3 this week',
    body: "U11 parents — quick one. Tuesday training is on Pitch 3 this week (not our usual Pitch 1) — Council are aerating Pitch 1 and Pitch 2 won't take the U13 Falcons session at the same slot. 18:00 same start, parking same place. See you Tuesday.",
    pinned: false,
    audience: 'age_band',
    ageBand: 'U11',
    reactions: [
      ...Array.from({ length: 9 }).map((_, i) => ({
        userId: `u11-parent-${i + 1}`,
        type: 'acknowledged' as const,
        timestamp: '2026-05-24T09:00:00+01:00',
      })),
    ],
  },
  {
    id: 'b7',
    author: { name: 'Greta Yardley', role: 'coach' },
    timestamp: '2026-05-24T07:30:00+01:00',  // 6 hours ago
    title: 'U13 Falcons — Cornwall Coast festival sign-ups close Friday',
    body: "U13 Falcons families — Cornwall Coast festival weekend (Sat 14 / Sun 15 June) sign-up sheet goes to the organisers Friday close-of-play. We need to send a confirmed squad and travel headcount. £85 per player includes pitch fee, two nights' bunkhouse, and meals. If you're in, drop a 👍 below by Thu end-of-day and I'll DM you the Stripe link.",
    pinned: false,
    audience: 'age_band',
    ageBand: 'U13',
    reactions: [
      ...Array.from({ length: 6 }).map((_, i) => ({
        userId: `u13-parent-${i + 1}`,
        type: 'acknowledged' as const,
        timestamp: '2026-05-24T08:00:00+01:00',
      })),
      {
        userId: 'u13-parent-7',
        type: 'done',
        timestamp: '2026-05-24T08:15:00+01:00',
      },
    ],
  },
  {
    id: 'b8',
    author: { name: 'Pete Connolly', role: 'chair' },
    timestamp: '2026-05-24T11:30:00+01:00',  // 2 hours ago
    title: 'Foxhill Hardware kit sponsorship — renewed for 2026/27',
    body: "Heads up — Foxhill Hardware (kit sponsor) confirmed for next season at the same £500/yr rate. 3-year commitment was up for review and they signed for another two. That's the front-of-shirt across every age band sorted. Banner stays as-is. Will draft a thank-you post for the club Insta to go out after the AGM.",
    pinned: false,
    audience: 'staff_only',
    reactions: [
      { userId: 'helena-mahan', type: 'done', timestamp: '2026-05-24T12:00:00+01:00' },
      { userId: 'jo-sefer', type: 'done', timestamp: '2026-05-24T12:15:00+01:00' },
      { userId: 'kim-atherton', type: 'done', timestamp: '2026-05-24T12:30:00+01:00' },
    ],
  },
]

// ─── Activity events seed data ────────────────────────────────────────

export const JUNIOR_ACTIVITY_EVENTS: JuniorActivityEvent[] = [
  {
    id: 'a1',
    category: 'availability',
    timestamp: '2026-05-24T13:20:00+01:00',  // 10 min ago
    title: 'Jack Carter confirmed for Saturday U11 fixture',
    detail: 'Auto-confirmed via Parent App',
    ageBand: 'U11',
    visibility: 'all',
  },
  {
    id: 'a2',
    category: 'availability',
    timestamp: '2026-05-24T11:30:00+01:00',  // 2 hours ago
    title: 'Lily Mendoza unavailable Saturday — illness',
    detail: 'Parent-flagged via Inbox',
    ageBand: 'U9',
    visibility: 'all',
  },
  {
    id: 'a3',
    category: 'registration',
    timestamp: '2026-05-24T09:30:00+01:00',  // 4 hours ago
    title: 'New U7 enquiry — P. Khouri family',
    detail: 'Welcome pack sent · consent forms pending',
    ageBand: 'U7',
    visibility: 'all',
  },
  {
    id: 'a4',
    category: 'registration',
    timestamp: '2026-05-23T14:00:00+01:00',  // Yesterday
    title: 'New U10 enquiry — J. Mendoza family',
    detail: 'Sibling of current U13 player · fast-track',
    ageBand: 'U10',
    visibility: 'all',
  },
  {
    id: 'a5',
    category: 'logistics',
    timestamp: '2026-05-24T12:30:00+01:00',  // 1 hour ago
    title: 'Car #3 fully booked for Saturday away (U13 Falcons)',
    detail: '4 seats · Helena Mahan driving',
    ageBand: 'U13',
    visibility: 'all',
  },
  {
    id: 'a6',
    category: 'logistics',
    timestamp: '2026-05-24T10:30:00+01:00',  // 3 hours ago
    title: 'Pitch 2 confirmed available 09:00 Saturday',
    detail: 'Council emailed 07:42 — playable',
    visibility: 'all',
  },
  {
    id: 'a7',
    category: 'logistics',
    timestamp: '2026-05-24T07:30:00+01:00',  // 6 hours ago
    title: 'Saturday match-day rota published',
    detail: 'All 8 fixtures · ref bookings green',
    visibility: 'all',
  },
  {
    id: 'a8',
    category: 'compliance',
    timestamp: '2026-05-23T16:00:00+01:00',  // Yesterday
    title: 'DBS renewal due · M. Hutchings · 14 Jun',
    detail: 'Renewal window open · 30 days notice',
    visibility: 'staff',
  },
  {
    id: 'a9',
    category: 'compliance',
    timestamp: '2026-05-22T11:00:00+01:00',  // 2 days ago
    title: 'FA Charter Standard panel · 5 of 6 categories green',
    detail: 'Insurance renewal still amber',
    visibility: 'staff',
  },
  {
    id: 'a10',
    category: 'compliance',
    timestamp: '2026-05-24T08:30:00+01:00',  // 5 hours ago
    title: 'Insurance certificate renewed and filed with FA',
    detail: 'Treasurer signed off · cert PDF in shared drive',
    visibility: 'staff',
  },
  {
    id: 'a11',
    category: 'match_outcome',
    timestamp: '2026-05-03T11:30:00+01:00',  // Sat 03 May — matches JUNIOR_RECENTS first row
    title: 'U11 Lions beat Meridian Town Youth 4-2',
    detail: 'Jack Carter MOTM · brace from Adam Sefer',
    ageBand: 'U11',
    visibility: 'all',
  },
  {
    id: 'a12',
    category: 'match_outcome',
    timestamp: '2026-05-03T11:00:00+01:00',  // Sat 03 May
    title: 'U9 Tigers lost to Crown Park 1-3',
    detail: 'Charlie Bell scored consolation late',
    ageBand: 'U9',
    visibility: 'all',
  },
  {
    id: 'a13',
    category: 'welfare',
    timestamp: '2026-05-23T13:00:00+01:00',  // Yesterday
    title: 'U13 player flagged for welfare follow-up · routine check scheduled',
    detail: 'Welfare Officer + parent loop',
    ageBand: 'U13',
    visibility: ['welfare_officer', 'chairman'],
  },
  {
    id: 'a14',
    category: 'achievement',
    timestamp: '2026-05-19T10:00:00+01:00',  // 5 days ago
    title: 'Jack Carter — Player of the Month March',
    detail: 'U11 Lions captain · second time this season',
    ageBand: 'U11',
    visibility: 'all',
  },
  {
    id: 'a15',
    category: 'achievement',
    timestamp: '2026-05-17T10:00:00+01:00',  // 1 week ago
    title: 'U13 Falcons promoted to Surrey Youth League Division 1 next season',
    detail: 'League placement confirmed by County FA',
    ageBand: 'U13',
    visibility: 'all',
  },
]

// ─── Timestamp display helper ─────────────────────────────────────────

/** Converts an ISO timestamp to a relative human display string.
 *  Anchored to Date.now() so the demo ages as users return — once the
 *  seed data is a week stale it'll read "2 weeks ago". */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
