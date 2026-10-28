// The coach's dashboard for the iPhone app — the same panels, numbers and
// wording as the portal's dashboard (LiveCoachDashboard.tsx), worked out on the
// server from the coach's own rows so the app only has to draw them.
//
// Every rule here is the portal's, moved rather than re-invented: the UK day
// and Monday-to-Sunday week, "owed" from lib/coach/money, the camp figures from
// campMoney, the racket framework, the stock rules. Where the portal narrows to
// one coach's rows ("mine"), so does this.

import { ukDate, ukTime, ukWeek, addDaysIso, daysBetweenIso } from '@/lib/coach/uk-date'
import { campSpans, campsBetween, campsOn, campDayLabel, type CampRow } from '@/lib/coach/camp-dates'
import { campMoney } from '@/lib/coach/camp-money'
import { formatPennies, formatPounds, paymentOwedPennies } from '@/lib/coach/money'
import { RACKET_STAGES, SKILLS_BY_STAGE } from '@/lib/coach/racket-framework'
import { stockState, stockNeedsAttention, STOCK_LABEL } from '@/lib/coach/stock'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export type DashboardRows = {
  players: Row[]; bookings: Row[]; lessons: Row[]; payments: Row[]; attendance: Row[]; skills: Row[]
  messages: Row[]; equipment: Row[]; staff: Row[]; venues: Row[]; camps: Row[]; campAttendees: Row[]
}

export type BriefSignal = { tag: string; pri: 'high' | 'med' | 'low'; text: string }

export type AppDashboard = {
  greeting: string
  greetName: string
  clubName: string
  headline: string
  racketsDue: number
  camp: null | {
    id: string; name: string; where: string; running: boolean; when: string; whenTone: 'good' | 'warn' | 'plain'
    fill: number | null
    figures: { label: string; value: string; tone: 'text' | 'good' | 'warn' | 'bad' | 'muted' }[]
    note: string
  }
  stats: {
    thisWeek: number
    next: { label: string; date: string } | null
    players: number
    unbooked: { id: string; name: string }[]
    paymentsDue: string
    paymentsLabel: string
  }
  inbox: { id: string; who: string; incoming: boolean; tag: string; text: string; at: string | null; unread: boolean; playerId: string | null; reaction: string | null }[]
  needs: { id: string; name: string; reason: string; avatar: string | null }[]
  needsMore: number
  upcoming: { id: string; kind: 'camp' | 'session'; when: string; date: string; title: string; sub: string }[]
  recent: { id: string; player: string; when: string; focus: string }[]
  kit: { items: { id: string; name: string; state: string; tone: 'bad' | 'order' | 'warn' }[]; more: number; empty: string }
  briefing: { signals: BriefSignal[]; todayCount: number; role: 'head' | 'coach' }
  /** Settings → Dashboard → Sections the coach has switched off. */
  sectionsOff: string[]
}

const RACKET_READY_SCORE = 4
const plainText = (t?: string | null) => String(t ?? '').replace(/\[([^\]]+)\]\((?:https?:|\/)[^)\s]*\)/g, '$1').replace(/\s*\n+\s*/g, ' · ')
const fmtDate = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB', { timeZone: 'Europe/London' }) } catch { return d } }
const shortDay = (iso?: string | null) => iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '') : ''

export function buildDashboard(raw: DashboardRows, o: {
  clubName: string
  /** The person signed in: an invited coach's own name, or the academy profile's. */
  personName: string
  /** An invited coach: their rows only, as the portal's "mine". */
  myStaffId: string | null
  features: { racket?: boolean }
  sectionsOff?: string[]
  now?: Date
}): AppDashboard {
  const now = o.now ?? new Date()
  const myStaffId = o.myStaffId
  const mine = <R extends Row>(rows: R[]) => myStaffId ? rows.filter(r => r.staff_id === myStaffId) : rows
  const d = (() => {
    if (!myStaffId) return raw
    const players = mine(raw.players)
    const ids = new Set(players.map(p => p.id))
    const theirs = (rows: Row[]) => rows.filter(r => r.player_id && ids.has(r.player_id))
    return { ...raw, players, bookings: mine(raw.bookings), lessons: mine(raw.lessons), payments: theirs(raw.payments), messages: theirs(raw.messages) }
  })()

  const today = ukDate(now)
  const nowHM = ukTime(now)
  const week = ukWeek(today)
  const dk = (x?: string | null) => String(x ?? '').slice(0, 10)
  const active = (b: Row) => b.status !== 'cancelled'
  const byWhen = (a: Row, b: Row) => (dk(a.booking_date) + (a.start_time ?? '')).localeCompare(dk(b.booking_date) + (b.start_time ?? ''))
  const todays = d.bookings.filter(b => dk(b.booking_date) === today && active(b)).sort((a, b) => String(a.start_time ?? '').localeCompare(String(b.start_time ?? '')))
  const upcoming = d.bookings.filter(b => dk(b.booking_date) >= today && active(b)).sort(byWhen)
  const next = upcoming.find(b => dk(b.booking_date) > today || (!!b.start_time && String(b.start_time) >= nowHM))
  const thisWeek = d.bookings.filter(b => dk(b.booking_date) >= week.start && dk(b.booking_date) <= week.end && active(b))
  const weekAhead = addDaysIso(today, 7)

  const due = d.payments.filter(p => paymentOwedPennies(p as never) > 0)
  const duePennies = due.reduce((n, p) => n + paymentOwedPennies(p as never), 0)
  const dueText = formatPennies(duePennies)
  const duePlayers = new Set(due.map(p => p.player_id ? `id:${p.player_id}` : `name:${String(p.player_name || '').trim().toLowerCase()}`)).size

  const skillFor = (pid: string) => Object.fromEntries(d.skills.filter(s => s.player_id === pid).map(s => [s.skill, s.score]))
  const racketsReady = !o.features.racket ? [] : d.players.filter(p => {
    const st = RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
    if (st < 0) return false
    const list = SKILLS_BY_STAGE[RACKET_STAGES[st].id] || []
    if (!list.length) return false
    const m = skillFor(p.id)
    return list.every(s => (Number(m[s]) || 0) >= RACKET_READY_SCORE)
  })

  const attPct = (pid: string) => { const r = d.attendance.filter(a => a.player_id === pid); return r.length ? Math.round(r.filter(a => a.present).length / r.length * 100) : null }
  const lower = (x?: string | null) => (x || '').trim().toLowerCase()
  const soleName = (n?: string | null) => !!lower(n) && d.players.filter(q => lower(q.name) === lower(n)).length === 1
  const hasUpcoming = (p: Row) => upcoming.some(b => b.player_id ? b.player_id === p.id : (soleName(p.name) && lower(b.player_name) === lower(p.name)))
  const needsAll = d.players.map(p => {
    const a = attPct(p.id)
    if (a !== null && a < 80) return { p, reason: `Attendance ${a}%` }
    if (!hasUpcoming(p)) return { p, reason: 'No upcoming session' }
    return null
  }).filter(Boolean) as { p: Row; reason: string }[]

  const inboxRows = d.messages.filter(m => !m.dismissed).sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 5)
  const tagFor = (rawName?: string | null, playerId?: string | null): string => {
    const key = (rawName || '').trim()
    if (key.startsWith('camp:') || /^camp\s*·/i.test(key)) return 'Camp'
    const n = key.split(',')[0].trim().toLowerCase()
    const owner = playerId ? d.players.find(p => p.id === playerId) : null
    if (owner) return n && (owner.parent_name || '').trim().toLowerCase() === n ? 'Parent' : 'Player'
    if (!n) return 'Contact'
    if (d.venues.some(v => (v.name || '').trim().toLowerCase() === n)) return 'Venue'
    if (d.staff.some(s => (s.name || '').trim().toLowerCase() === n)) return 'Coach'
    if (d.players.some(p => (p.name || '').trim().toLowerCase() === n)) return 'Player'
    if (d.players.some(p => (p.parent_name || '').trim().toLowerCase() === n)) return 'Parent'
    return 'Contact'
  }

  const unbooked = d.players.filter(p => !hasUpcoming(p))
  const daysBetween = (a: string, b: string) => Math.max(0, daysBetweenIso(a, b))
  const campAttendeeCount = (campId: string) => (d.campAttendees || []).filter(a => a.camp_id === campId && (a.status || 'confirmed') !== 'cancelled').length
  const campList = campSpans((d.camps || []) as CampRow[])
  const upcomingCamps = campsBetween(campList, today, weekAhead)
  const todayCamps = campsOn(campList, today)

  const camp = (() => {
    const c = todayCamps[0] || campsBetween(campList, today, '9999-12-31')[0]
    if (!c) return null
    const row = (d.camps || []).find(x => String(x.id) === String(c.id)) || {}
    const att = (d.campAttendees || []).filter(a => a.camp_id === c.id && (a.status || 'confirmed') !== 'cancelled')
    const m = campMoney(row as never, att as never)
    const costs: { amount?: number }[] = Array.isArray(row.costs) ? row.costs : []
    const totalCost = costs.reduce((n, x) => n + (Number(x.amount) || 0), 0)
    const dayNo = c.start <= today ? daysBetween(c.start, today) + 1 : 0
    const away = daysBetween(today, c.start)
    const coachCount = Array.isArray(row.coach_ids) ? (row.coach_ids as unknown[]).length : 0
    const running = dayNo > 0
    const margin = m.booked - totalCost
    return {
      id: String(c.id), name: String(c.name), where: c.where || '', running,
      when: running ? `Day ${dayNo} of ${c.days}` : away === 0 ? 'Starts today' : away === 1 ? 'Starts tomorrow' : `${away} days to go`,
      whenTone: (running ? 'good' : away <= 14 ? 'warn' : 'plain') as 'good' | 'warn' | 'plain',
      fill: m.capacity > 0 ? Math.min(1, m.seats / m.capacity) : null,
      figures: [
        { label: 'Booked', value: m.capacity ? `${m.seats}/${m.capacity}` : String(m.seats), tone: 'text' as const },
        { label: 'Coaches going', value: coachCount ? String(coachCount) : '—', tone: (coachCount ? 'text' : 'warn') as 'text' | 'warn' },
        { label: 'Collected', value: formatPounds(m.collected), tone: 'good' as const },
        { label: 'Still owed', value: formatPounds(m.outstanding), tone: (m.outstanding > 0 ? 'warn' : 'muted') as 'warn' | 'muted' },
        { label: costs.length ? 'Margin' : 'Booked value', value: formatPounds(costs.length ? margin : m.booked), tone: (costs.length && margin < 0 ? 'bad' : 'text') as 'bad' | 'text' },
      ],
      note: coachCount === 0
        ? 'No coaches assigned to this trip yet — open the camp and add them.'
        : m.outstanding > 0
          ? `${formatPounds(m.outstanding)} still to collect before you travel.`
          : costs.length ? 'Everyone has paid. Costs are tracked on the Finance tab.' : 'Everyone has paid — add your costs to see the margin.',
    }
  })()

  // ── The briefing's facts (the portal's signals, word for word) ───────────────
  const myPlayers = mine(d.players)
  const myTodays = mine(todays)
  const myNext = mine(upcoming)[0]
  const myLessonsThisWeek = mine(d.lessons).filter(l => dk(l.session_date) >= week.start && dk(l.session_date) <= week.end).length
  const myReady = mine(racketsReady)
  const lowAtt = myPlayers.map(p => ({ p, a: attPct(p.id) })).filter(x => x.a !== null && (x.a as number) < 80).sort((a, b) => (a.a as number) - (b.a as number))
  const signals: BriefSignal[] = []
  if (myStaffId && duePennies > 0) signals.push({ tag: 'payments', pri: 'med', text: `${duePlayers} of your players ${duePlayers > 1 ? 'have' : 'has'} an outstanding balance — ${dueText}. Worth collecting at their next session.` })
  if (!myStaffId) signals.push({ tag: 'payments', pri: duePennies > 0 ? 'high' : 'low', text: duePennies > 0 ? `${duePlayers} player${duePlayers > 1 ? 's have' : ' has'} an outstanding balance — ${dueText} to collect.` : 'No outstanding balances on lessons and packages.' })
  if (o.features.racket) signals.push({ tag: 'rackets', pri: myReady.length ? 'high' : 'low', text: myReady.length ? `${myReady.length} player${myReady.length > 1 ? 's are' : ' is'} ready to move up a racket — book ${myReady.length > 1 ? 'assessments' : 'an assessment'}: ${myReady.slice(0, 3).map(p => p.name).join(', ')}.` : 'No players ready to move up a racket yet — keep logging skill progress.' })
  if (todayCamps.length) {
    const c = todayCamps[0]
    signals.push({ tag: 'camps', pri: 'high', text: `${c.name} is running today — ${campDayLabel(c)}${c.where ? ` at ${c.where}` : ''}.` })
  } else if (upcomingCamps.length) {
    const c = upcomingCamps[0]
    const away = daysBetween(today, c.start)
    signals.push({ tag: 'camps', pri: away <= 7 ? 'high' : 'med', text: `${c.name} starts ${away <= 1 ? 'tomorrow' : `in ${away} days`}${c.where ? ` at ${c.where}` : ''} — ${campAttendeeCount(c.id)} booked on.` })
  }
  signals.push({ tag: 'retention', pri: lowAtt.length ? 'high' : 'low', text: lowAtt.length ? `${lowAtt[0].p.name} is at ${lowAtt[0].a}% attendance — worth a check-in.` : 'Attendance is healthy across your players.' })
  signals.push({ tag: 'schedule', pri: myTodays.length ? 'med' : 'low', text: myTodays.length ? `${myTodays.length} session${myTodays.length > 1 ? 's' : ''} today${myTodays[0]?.start_time ? ` from ${myTodays[0].start_time}` : ''}.${myNext && dk(myNext.booking_date) > today ? ` Next after today: ${fmtDate(myNext.booking_date)} ${myNext.start_time || ''}.` : ''}` : (myNext ? `No sessions today — next is ${fmtDate(myNext.booking_date)} ${myNext.start_time || ''}.` : 'No upcoming sessions booked — add bookings in the calendar.') })
  signals.push({ tag: 'progress', pri: 'low', text: myLessonsThisWeek ? `${myLessonsThisWeek} lesson summar${myLessonsThisWeek > 1 ? 'ies' : 'y'} written this week (Monday to Sunday) — keep sharing the wins with players.` : 'No lesson summaries yet this week — log one after your next session.' })

  const nextSessions = upcoming.filter(b => dk(b.booking_date) > today && dk(b.booking_date) <= weekAhead).slice(0, 5)
  const recentSummaries = [...d.lessons].sort((a, b) => dk(b.session_date).localeCompare(dk(a.session_date))).slice(0, 3)
  const kitAttention = d.equipment.filter(i => stockNeedsAttention(i))
  const kitUncounted = d.equipment.filter(i => stockState(i) === 'uncounted').length

  const hour = Number(ukTime(now).slice(0, 2))
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = o.personName.trim().split(/\s+/)[0] || ''
  const greetName = firstName && firstName.toLowerCase() !== (o.clubName || '').trim().toLowerCase().split(/\s+/)[0] ? firstName : ''

  return {
    greeting, greetName, clubName: o.clubName,
    headline: `${myTodays.length} session${myTodays.length === 1 ? '' : 's'} today${racketsReady.length ? `, ${racketsReady.length} racket assessment${racketsReady.length === 1 ? '' : 's'} due` : ''}`,
    racketsDue: racketsReady.length,
    camp,
    stats: {
      thisWeek: thisWeek.length,
      next: next ? { label: `${dk(next.booking_date) === today ? 'Today' : dk(next.booking_date) === addDaysIso(today, 1) ? 'Tomorrow' : fmtDate(next.booking_date)}${next.start_time ? ' ' + next.start_time : ''}`, date: dk(next.booking_date) } : null,
      players: d.players.length,
      unbooked: unbooked.map(p => ({ id: String(p.id), name: String(p.name || 'Player') })),
      paymentsDue: dueText,
      paymentsLabel: myStaffId ? 'Due from my players' : 'Payments due',
    },
    inbox: inboxRows.map(m => ({
      id: String(m.id),
      who: String(m.recipients || 'Message').split(',')[0].trim(),
      incoming: m.direction === 'in',
      tag: tagFor(m.recipients, m.player_id),
      text: plainText(`${m.subject ? `${m.subject} — ` : ''}${m.body || ''}`),
      at: m.created_at ?? null,
      unread: m.direction === 'in' && !m.read,
      playerId: m.player_id ?? null,
      reaction: m.reaction ?? null,
    })),
    needs: needsAll.slice(0, 5).map(({ p, reason }) => ({ id: String(p.id), name: String(p.name || 'Player'), reason, avatar: p.avatar_url ?? null })),
    needsMore: Math.max(0, needsAll.length - 5),
    upcoming: [
      ...upcomingCamps.map(c => ({ id: String(c.id), kind: 'camp' as const, when: shortDay(c.start), date: c.start, title: c.name, sub: `${c.days > 1 ? `${c.days} days` : 'One day'}${c.where ? ` · ${c.where}` : ''}` })),
      ...nextSessions.map(b => {
        const who = String(b.player_name || '').trim(), t = String(b.title || '').trim()
        return {
          id: String(b.id), kind: 'session' as const, when: `${shortDay(b.booking_date)}${b.start_time ? ` ${b.start_time}` : ''}`, date: dk(b.booking_date),
          title: who || t || 'Session',
          sub: who && t && t.toLowerCase() !== who.toLowerCase() ? `${t}${b.court ? ` · ${b.court}` : ''}` : '',
        }
      }),
    ],
    recent: recentSummaries.map(l => ({ id: String(l.id), player: String(l.player_name || 'Session'), when: fmtDate(l.session_date), focus: String(l.focus || '') })),
    kit: {
      items: kitAttention.slice(0, 5).map(i => { const st = stockState(i); return { id: String(i.id), name: String(i.item || 'Item'), state: STOCK_LABEL[st], tone: (st === 'repair' || st === 'out' ? 'bad' : st === 'order' ? 'order' : 'warn') as 'bad' | 'order' | 'warn' } }),
      more: Math.max(0, kitAttention.length - 5),
      empty: d.equipment.length === 0 ? 'No kit list yet.' : kitUncounted > 0 ? `Nothing flagged. ${kitUncounted} item${kitUncounted === 1 ? ' has' : 's have'} not been counted yet.` : 'All stocked up. ✅',
    },
    briefing: { signals, todayCount: myTodays.length, role: myStaffId ? 'coach' : 'head' },
    sectionsOff: o.sectionsOff || [],
  }
}
