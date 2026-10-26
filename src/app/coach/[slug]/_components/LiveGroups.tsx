'use client'

// Weekly Groups — "Thursday Adults, 7pm, up to 8, £15 each".
//
// Each group has its regulars. Some days before every session (six, by
// default) each of them is emailed their own link: coming this week? A yes
// takes a place and, when the coach takes card payments, pays for it from the
// saved card there and then. Cancelling is free until the cancellation window
// closes; after that the place stands. The coach sees each week fill up here,
// can answer for someone, ask early, or call the week off (everyone refunded
// and told).
//
// The groups and members are saved from here; the weeks and answers are
// written by the server (/api/coach/groups, the client's link, the timer).

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, rowsChanged } from '../_lib/coach-db'
import { useCoachSettings } from '../_lib/use-settings'
import { useWallet, reloadWallet, savedFor } from '../_lib/pay-wallet'
import { WEEKDAYS, upcomingDate, askOn, dayWords, everyWords, cancelState, untilWords } from '@/lib/coach/groups'
import { readPolicy } from '@/lib/coach/cancel-policy'
import { formatPennies } from '@/lib/coach/money'
import { niceTime } from '@/lib/coach/reminders'
import { ukDate } from '@/lib/coach/uk-date'
import { planCovering, type Plan } from '@/lib/coach/memberships'

export type Group = {
  id: string; name: string; weekday: number; start_time: string; duration_min: number
  venue_id: string | null; court: string | null; capacity: number; price_pennies: number; ask_days: number
  active: boolean; notes: string | null; staff_id: string | null; created_at: string
}
type Member = { id: string; group_id: string; player_id: string }
type Week = { id: string; group_id: string; session_date: string; booking_id: string | null; status: 'open' | 'cancelled'; asked_at: string | null }
type Reply = { id: string; session_id: string; group_id: string; player_id: string; sent_at: string | null; opened_at: string | null; answer: 'yes' | 'no' | null; answered_by: string | null; late: boolean }
type Player = { id: string; name: string; email?: string | null; parent_email?: string | null; contact_email?: string | null }
type Venue = { id: string; name: string }

export function LiveGroups({ T, accent, onNavigate }: { T: ThemeTokens; accent: AccentTokens; onNavigate?: (id: string) => void }) {
  const groups = useCoachTable<Group>('coach_groups')
  const members = useCoachTable<Member>('coach_group_members')
  const weeks = useCoachTable<Week>('coach_group_sessions')
  const replies = useCoachTable<Reply>('coach_group_replies')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const { rows: venues } = useCoachTable<Venue>('coach_venues')
  const { rows: plans } = useCoachTable<Plan>('coach_memberships')
  const { wallet, loading: walletLoading } = useWallet({ fresh: true })
  const s = useCoachSettings()
  const policy = readPolicy(s.cancelPolicy)
  const [edit, setEdit] = useState<Group | 'new' | null>(null)

  const list = useMemo(() => groups.rows.slice().sort((a, b) => Number(b.active) - Number(a.active) || a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)), [groups.rows])
  const btn: CSSProperties = { appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ maxWidth: 640 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Weekly Groups</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3, lineHeight: 1.5 }}>Everyone in a group is asked if they are coming, a few days before each session. Saying yes takes a place and pays for it. Cancelling is free until {policy.hours ? `${policy.hours} hours before` : 'the start'}; after that the place stands.</p>
        </div>
        <button onClick={() => setEdit('new')} style={btn}>＋ New group</button>
      </div>

      {!walletLoading && !wallet.chargesEnabled && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, padding: '10px 12px', borderRadius: 10, fontSize: 12.5, color: T.text2, background: T.panel, border: `1px solid ${T.border}` }}>
          <span style={{ flex: 1, minWidth: 220 }}>Card payments are not on yet, so people who say yes pay you on the day. Connect your bank to take the money when they say yes.</span>
          {onNavigate && <button onClick={() => onNavigate('settings')} style={{ ...btn, background: 'transparent', color: accent.hex, border: `1px solid ${accent.border}`, padding: '6px 11px', fontSize: 12 }}>Settings → Pricing</button>}
        </div>
      )}

      {!groups.loading && list.length === 0 && (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 12, padding: 22, textAlign: 'center', color: T.text3, fontSize: 13, lineHeight: 1.6 }}>
          No groups yet. Make one for each weekly session (say, Thursday Adults at 7pm, £15 each), add its regulars, and Lumio does the asking every week.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(g => (
          <GroupCard key={g.id} T={T} accent={accent} g={g} policyHours={policy.hours}
            venue={venues.find(v => v.id === g.venue_id) || null}
            memberIds={Array.from(new Set(members.rows.filter(m => m.group_id === g.id).map(m => m.player_id)))}
            weeks={weeks.rows.filter(w => w.group_id === g.id)} replies={replies.rows.filter(r => r.group_id === g.id)}
            players={players} chargesEnabled={wallet.chargesEnabled} wallet={wallet} plans={plans} onEdit={() => setEdit(g)} />
        ))}
      </div>

      {edit && <GroupEditor T={T} accent={accent} group={edit === 'new' ? null : edit} players={players} venues={venues}
        memberRows={edit === 'new' ? [] : members.rows.filter(m => m.group_id === edit.id)}
        defaultPrice={defaultGroupPrice(s.priceList)} onClose={() => setEdit(null)} />}
    </div>
  )
}

/** £ per person from the price list's Group line, if it has one. */
function defaultGroupPrice(list: unknown): number {
  const rules = Array.isArray(list) ? list as { type?: string; basis?: string; amount?: number }[] : []
  const r = rules.find(x => (x.type || '').toLowerCase() === 'group' && x.basis === 'person' && Number(x.amount) > 0)
  return r ? Math.round(Number(r.amount) * 100) : 1500
}

// ── One group ────────────────────────────────────────────────────────────────
function GroupCard({ T, accent, g, venue, memberIds, weeks, replies, players, chargesEnabled, wallet, plans, policyHours, onEdit }: {
  T: ThemeTokens; accent: AccentTokens; g: Group; venue: Venue | null; memberIds: string[]; weeks: Week[]; replies: Reply[]
  players: Player[]; chargesEnabled: boolean; wallet: ReturnType<typeof useWallet>['wallet']; plans: Plan[]; policyHours: number; onEdit: () => void
}) {
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [callOff, setCallOff] = useState(false)
  const date = upcomingDate(g)
  const week = weeks.find(w => w.session_date === date) || null
  const mine = week ? replies.filter(r => r.session_id === week.id) : []
  const nameOf = (id: string) => players.find(p => p.id === id)?.name || 'Someone'
  const chargesFor = (replyId: string) => wallet.charges.filter(c => c.reply_id === replyId)
  const yes = mine.filter(r => r.answer === 'yes')
  const paidPennies = mine.reduce((n, r) => n + chargesFor(r.id).filter(c => c.status === 'paid').reduce((a, c) => a + c.amount_pennies - (c.refunded_pennies || 0), 0), 0)
  const past = weeks.filter(w => w.session_date < date).sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 4)
  const cs = cancelState(date, g.start_time, policyHours)

  const call = async (body: Record<string, unknown>, done: (d: any) => string) => {
    setBusy(String(body.action || body.reason)); setMsg(null)
    try {
      const url = body.reason ? '/api/coach/rain-off' : '/api/coach/groups'
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok || d.error) setMsg({ text: d.error || 'That did not work. Please try again.', bad: true })
      else setMsg({ text: done(d) })
      rowsChanged('coach_group_sessions', 'coach_group_replies', 'coach_bookings')
      void reloadWallet()
    } catch { setMsg({ text: 'You appear to be offline.', bad: true }) }
    finally { setBusy('') }
  }
  const ask = () => call({ action: 'ask', groupId: g.id }, d => d.asked ? `✓ Asked ${d.asked} ${d.asked === 1 ? 'person' : 'people'}.${d.noEmail ? ` ${d.noEmail} had no email address.` : ''}` : d.noEmail ? `${d.noEmail} ${d.noEmail === 1 ? 'person has' : 'people have'} no email address. Add one on their player card.` : 'Everyone has been asked already.')
  const mark = (r: Reply, answer: 'yes' | 'no') => call({ action: 'mark', replyId: r.id, answer }, d => answer === 'yes' ? `✓ ${nameOf(r.player_id)} marked as coming.` : `✓ ${nameOf(r.player_id)} marked as not coming.${d.refunded ? ` ${formatPennies(d.refunded)} refunded.` : ''}${d.warning ? ` ${d.warning}` : ''}`)
  const off = (reason: 'weather' | 'coach') => week?.booking_id && call({ bookingIds: [week.booking_id], reason }, d => {
    const r = d.results?.[0]
    return `✓ Called off.${r?.refunded ? ` ${formatPennies(r.refunded)} refunded.` : ''}${r?.told ? ` Told ${r.told}.` : ''}${r?.problem ? ` ${r.problem}` : ''}`
  })

  const pill = (text: string, tone: string): ReactNode => <span style={{ fontSize: 11, fontWeight: 700, color: tone, background: `${tone}1f`, border: `1px solid ${tone}44`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{text}</span>
  const small: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '0 10px', minHeight: 30, fontSize: 12, cursor: 'pointer', fontFamily: FONT }
  const lead: CSSProperties = { ...small, border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, fontWeight: 700 }

  // Everyone to show for this week: the answers, plus members not asked yet.
  const rows = [
    ...mine.map(r => ({ playerId: r.player_id, r })),
    ...memberIds.filter(id => !mine.some(r => r.player_id === id)).map(id => ({ playerId: id, r: null as Reply | null })),
  ].sort((a, b) => rank(a.r) - rank(b.r) || nameOf(a.playerId).localeCompare(nameOf(b.playerId)))

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, opacity: g.active ? 1 : 0.7 }} data-testid="group-card">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{g.name}</div>
        {!g.active && pill('Paused', T.text3)}
        <div style={{ fontSize: 12.5, color: T.text3, flex: 1, minWidth: 200 }}>
          {everyWords(g)} · {g.duration_min} min{venue ? ` · ${venue.name}` : ''}{g.court ? `, ${g.court}` : ''} · {formatPennies(g.price_pennies)} each · {g.capacity} places · {memberIds.length} in the group
        </div>
        <button onClick={onEdit} style={small}>Edit</button>
      </div>

      {g.active && (
        <div style={{ marginTop: 12, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 11, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{dayWords(date)} at {niceTime(g.start_time)}</div>
            {week?.status === 'cancelled' ? pill('Called off', T.bad)
              : week ? pill(`${yes.length} of ${g.capacity} coming`, yes.length >= g.capacity ? T.good : accent.hex)
              : pill(askOn(date, g.ask_days) <= ukDate() ? 'Not asked yet' : `Asks on ${dayWords(askOn(date, g.ask_days))}`, T.text3)}
            {week && week.status === 'open' && paidPennies > 0 && pill(`${formatPennies(paidPennies)} paid`, T.good)}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {week?.status !== 'cancelled' && !cs.started && <button onClick={ask} disabled={!!busy || !memberIds.length} style={lead}>{busy === 'ask' ? 'Asking…' : week ? 'Ask anyone not asked' : 'Ask now'}</button>}
              {week?.status === 'open' && week.booking_id && !cs.started && <button onClick={() => setCallOff(v => !v)} disabled={!!busy} style={small}>Call this week off</button>}
            </div>
          </div>
          {callOff && week?.status === 'open' && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 9, border: `1px solid ${T.bad}55`, fontSize: 12.5, color: T.text2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: 200 }}>Everyone who paid is refunded in full, and everyone coming is told by email.</span>
              <button onClick={() => { setCallOff(false); void off('weather') }} disabled={!!busy} style={{ ...small, color: T.bad, borderColor: `${T.bad}66` }}>Rained off</button>
              <button onClick={() => { setCallOff(false); void off('coach') }} disabled={!!busy} style={{ ...small, color: T.bad, borderColor: `${T.bad}66` }}>I can’t coach</button>
            </div>
          )}
          {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? T.bad : T.good, marginTop: 8 }}>{msg.text}</div>}
          {!memberIds.length && <div style={{ fontSize: 12.5, color: T.text3, marginTop: 8 }}>Nobody in this group yet. Press Edit to add its regulars.</div>}
          {rows.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rows.map(({ playerId, r }) => {
                const ch = r ? chargesFor(r.id) : []
                const paid = ch.find(c => c.status === 'paid'), dd = ch.find(c => c.status === 'processing'), refunded = ch.find(c => c.status === 'refunded'), failed = ch.find(c => c.status === 'failed')
                const card = savedFor(wallet, playerId)
                const answer = !r ? pill('Not asked yet', T.text3)
                  : r.answer === 'yes' ? pill(r.answered_by === 'coach' ? 'Coming (you marked)' : 'Coming', T.good)
                  : r.answer === 'no' ? pill(r.late ? 'Cancelled late' : 'Can’t come', r.late ? T.warn : T.text3)
                  : pill(r.opened_at ? 'Seen, no answer' : r.sent_at ? 'Asked' : 'Not asked yet', T.text3)
                const money = !r || (r.answer !== 'yes' && !paid && !refunded) ? null
                  : paid ? pill(`Paid ${formatPennies(paid.amount_pennies)}`, T.good)
                  : dd ? pill('Direct Debit on its way', T.good)
                  : refunded ? pill('Refunded', T.text3)
                  : planCovering(plans, { playerId, groupId: g.id }) ? pill('Monthly plan', T.good)
                  : r.answered_by === 'coach' ? pill('Paying you directly', T.text3)
                  : !chargesEnabled ? pill('Pays on the day', T.text3)
                  : failed ? pill('Card failed · link sent', T.warn)
                  : pill(card ? 'Not paid yet' : 'No card · payment link', T.warn)
                return (
                  <div key={playerId} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 2px', borderTop: `1px solid ${T.border}` }} data-testid="group-row">
                    <span style={{ fontSize: 13, color: T.text, minWidth: 140, flex: '1 1 140px' }}>{nameOf(playerId)}</span>
                    {answer}{money}
                    {r && week?.status === 'open' && !cs.started && (
                      <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                        {r.answer !== 'yes' && <button onClick={() => mark(r, 'yes')} disabled={!!busy} style={small} title="They are coming and paying you another way">Mark coming</button>}
                        {r.answer !== 'no' && <button onClick={() => mark(r, 'no')} disabled={!!busy} style={small}>Mark not coming</button>}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {week && week.status === 'open' && !cs.started && policyHours > 0 && (
            <div style={{ fontSize: 11.5, color: T.text3, marginTop: 8 }}>{cs.free ? `Free cancellation ends ${untilWords(cs.freeUntil)}.` : 'The free cancellation window has closed: places now stand.'}</div>
          )}
        </div>
      )}

      {past.length > 0 && (
        <div style={{ fontSize: 11.5, color: T.text3, marginTop: 10 }}>
          Recent weeks: {past.map(w => `${new Date(`${w.session_date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} ${w.status === 'cancelled' ? 'called off' : `${replies.filter(r => r.session_id === w.id && r.answer === 'yes').length} came`}`).join(' · ')}
        </div>
      )}
    </div>
  )
}
const rank = (r: Reply | null) => (r?.answer === 'yes' ? 0 : !r?.answer ? 1 : 2)

// ── Making or changing a group ───────────────────────────────────────────────
function Shell({ T, title, onClose, children }: { T: ThemeTokens; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div role="dialog" aria-label={title} style={{ width: '100%', maxWidth: 680, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1, minWidth: 0 }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, width: 32, height: 32, fontSize: 17, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function GroupEditor({ T, accent, group, players, venues, memberRows, defaultPrice, onClose }: {
  T: ThemeTokens; accent: AccentTokens; group: Group | null; players: Player[]; venues: Venue[]; memberRows: Member[]; defaultPrice: number; onClose: () => void
}) {
  const [d, setD] = useState(() => ({
    name: group?.name || '', weekday: group?.weekday ?? 3, start_time: group?.start_time || '19:00', duration_min: String(group?.duration_min ?? 60),
    venue_id: group?.venue_id || '', court: group?.court || '', capacity: String(group?.capacity ?? 8),
    price: ((group?.price_pennies ?? defaultPrice) / 100).toFixed((group?.price_pennies ?? defaultPrice) % 100 ? 2 : 0), ask_days: group?.ask_days ?? 6, active: group?.active ?? true,
  }))
  const [picked, setPicked] = useState<Set<string>>(() => new Set(memberRows.map(m => m.player_id)))
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof d, v: unknown) => setD(x => ({ ...x, [k]: v }))

  const field: CSSProperties = { width: '100%', minWidth: 0, boxSizing: 'border-box', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12.5, fontFamily: FONT, outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 4 }
  const sorted = players.slice().sort((a, b) => Number(picked.has(b.id)) - Number(picked.has(a.id)) || a.name.localeCompare(b.name))
  const shown = sorted.filter(p => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))
  const noEmail = (p: Player) => !(p.parent_email || p.email || p.contact_email)

  const save = async () => {
    const name = d.name.trim()
    const price = Math.round(parseFloat(String(d.price).replace(/[£,\s]/g, '')) * 100)
    const capacity = Math.round(Number(d.capacity)), duration = Math.round(Number(d.duration_min))
    if (!name) { setErr('Give the group a name.'); return }
    if (!/^\d{2}:\d{2}$/.test(d.start_time)) { setErr('Choose a start time.'); return }
    if (!(duration >= 15 && duration <= 600)) { setErr('The length should be between 15 minutes and 10 hours.'); return }
    if (!(capacity >= 1 && capacity <= 50)) { setErr('Places should be between 1 and 50.'); return }
    if (!(price >= 0 && price <= 20000)) { setErr('The price per person should be between £0 and £200.'); return }
    setBusy(true); setErr('')
    try {
      const row = { name, weekday: Number(d.weekday), start_time: d.start_time, duration_min: duration, venue_id: d.venue_id || null, court: d.court.trim() || null, capacity, price_pennies: price, ask_days: Number(d.ask_days), active: !!d.active, updated_at: new Date().toISOString() }
      const g = group ? (await dbUpdate('coach_groups', group.id, row), group) : await dbInsert('coach_groups', row)
      const had = new Set(memberRows.map(m => m.player_id))
      for (const id of picked) if (!had.has(id)) await dbInsert('coach_group_members', { group_id: g.id, player_id: id })
      for (const m of memberRows) if (!picked.has(m.player_id)) await dbRemove('coach_group_members', m.id)
      rowsChanged('coach_group_members', 'coach_groups')
      onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'It could not be saved.') }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!group || !confirm(`Delete ${group.name}? Its weeks and answers go too. Payments already taken stay in Payments.`)) return
    try { await dbRemove('coach_groups', group.id); rowsChanged('coach_group_members', 'coach_group_sessions', 'coach_group_replies'); onClose() }
    catch (e) { setErr(e instanceof Error ? e.message : 'It could not be deleted.') }
  }

  return (
    <Shell T={T} title={group ? `Edit ${group.name}` : 'New weekly group'} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <label style={{ gridColumn: '1 / -1' }}><span style={lbl}>Name</span><input value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Thursday Adults" style={field} /></label>
        <label><span style={lbl}>Day</span><select value={d.weekday} onChange={e => set('weekday', Number(e.target.value))} style={field}>{WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}s</option>)}</select></label>
        <label><span style={lbl}>Starts</span><input type="time" value={d.start_time} onChange={e => set('start_time', e.target.value)} style={field} /></label>
        <label><span style={lbl}>Minutes</span><input inputMode="numeric" value={d.duration_min} onChange={e => set('duration_min', e.target.value)} style={field} /></label>
        <label><span style={lbl}>Venue</span><select value={d.venue_id} onChange={e => set('venue_id', e.target.value)} style={field}><option value="">—</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        <label><span style={lbl}>Court (optional)</span><input value={d.court} onChange={e => set('court', e.target.value)} placeholder="e.g. Court 2" style={field} /></label>
        <label><span style={lbl}>Places</span><input inputMode="numeric" value={d.capacity} onChange={e => set('capacity', e.target.value)} style={field} /></label>
        <label><span style={lbl}>£ per person</span><input inputMode="decimal" value={d.price} onChange={e => set('price', e.target.value)} style={field} /></label>
        <label><span style={lbl}>Ask them</span><select value={d.ask_days} onChange={e => set('ask_days', Number(e.target.value))} style={field}>{[2, 3, 4, 5, 6, 7, 10, 14].map(n => <option key={n} value={n}>{n} days before</option>)}</select></label>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 12.5, color: T.text2, cursor: 'pointer' }}>
        <input type="checkbox" checked={d.active} onChange={e => set('active', e.target.checked)} /> Running (untick to pause it, for a holiday or the off-season)
      </label>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ ...lbl, marginBottom: 0 }}>In the group · {picked.size}</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a player…" aria-label="Find a player" style={{ ...field, maxWidth: 220, marginLeft: 'auto', padding: '6px 8px' }} />
        </div>
        <div style={{ maxHeight: 240, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 9, padding: 6, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 2 }}>
          {shown.map(p => (
            <label key={p.id} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5, color: T.text2, padding: '4px 6px', borderRadius: 6, cursor: 'pointer', background: picked.has(p.id) ? accent.dim : 'transparent' }}>
              <input type="checkbox" checked={picked.has(p.id)} onChange={() => setPicked(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              {noEmail(p) && <span title="No email address, so they cannot be asked" style={{ fontSize: 10, color: T.warn, marginLeft: 'auto' }}>no email</span>}
            </label>
          ))}
          {!shown.length && <div style={{ fontSize: 12, color: T.text3, padding: 6 }}>No players match.</div>}
        </div>
      </div>

      {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {group && <button onClick={remove} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.bad, borderRadius: 8, padding: '0 12px', minHeight: 34, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Delete group</button>}
        <button onClick={save} disabled={busy} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 36, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{busy ? 'Saving…' : group ? 'Save' : 'Make the group'}</button>
      </div>
    </Shell>
  )
}
