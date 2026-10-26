'use client'

// Payments → "Monthly plans & welcome links".
//
// The monthly plans at a glance (who is on one, what comes in each month,
// whether this month has been taken), and the welcome links: who has
// answered, who has been sent one but not finished, sending to many at once,
// and what clients said they would like to hear about — with their email
// addresses one click away, for a message to that list.

import { useMemo, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, rowsChanged } from '../_lib/coach-db'
import { useWallet, savedFor, chargeState } from '../_lib/pay-wallet'
import { planWords, monthOf, monthWords, ordinal, type Plan } from '@/lib/coach/memberships'
import { interestsOf, type Answers, type Version } from '@/lib/coach/questionnaire'
import { ukDate } from '@/lib/coach/uk-date'
import { formatPennies } from '@/lib/coach/money'

type Player = { id: string; name: string; email?: string | null; parent_email?: string | null; contact_email?: string | null }
type Link = { id: string; player_id: string; sent_at: string | null; opened_at: string | null; completed_at: string | null; created_at: string }
type Qn = { player_id: string; answers: Answers; submitted_at: string }
type Bill = { membership_id: string; period: string; amount_pennies: number; charge_id: string | null; status: string; failure_reason: string | null }

const emailOf = (p: Player) => p.parent_email || p.email || p.contact_email || ''

export function MonthlyPlans({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows: players } = useCoachTable<Player>('coach_players')
  const { rows: plans } = useCoachTable<Plan>('coach_memberships')
  const { rows: bills } = useCoachTable<Bill>('coach_membership_bills')
  const { rows: links } = useCoachTable<Link>('coach_welcome_links')
  const { rows: qns } = useCoachTable<Qn>('coach_questionnaires')
  const { wallet } = useWallet()
  const [picking, setPicking] = useState(false)
  const nameOf = (id: string) => players.find(p => p.id === id)?.name || 'Someone'
  const period = monthOf(ukDate())

  const live = plans.filter(p => p.status !== 'ended')
  const running = live.filter(p => p.status === 'active' && p.agreed_at)
  const monthly = running.reduce((n, p) => n + p.amount_pennies, 0)
  const waiting = live.filter(p => p.status === 'offered').length
  const billFor = (p: Plan) => bills.find(b => b.membership_id === p.id && b.period === period)
  const taken = running.reduce((n, p) => { const b = billFor(p); const c = b?.charge_id ? wallet.charges.find(x => x.id === b.charge_id) : null; return n + (c && (c.status === 'paid' || c.status === 'processing') ? p.amount_pennies : 0) }, 0)

  const latest = (id: string) => links.filter(l => l.player_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const answered = new Set(qns.map(q => q.player_id))
  const sentNotDone = players.filter(p => { const l = latest(p.id); return l?.sent_at && !l.completed_at }).length
  const notSent = players.filter(p => !latest(p.id)?.sent_at && !answered.has(p.id)).length

  // "Would you like to hear about…": who said yes to what (their latest answers).
  const interests = useMemo(() => {
    const byPlayer = new Map<string, Qn>()
    for (const q of qns) { const had = byPlayer.get(q.player_id); if (!had || q.submitted_at > had.submitted_at) byPlayer.set(q.player_id, q) }
    const m = new Map<string, string[]>()
    for (const [pid, q] of byPlayer) for (const i of interestsOf(q.answers)) m.set(i, [...(m.get(i) || []), pid])
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [qns])

  const tile = (label: string, value: string, sub: string, tone = T.text) => (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: tone, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{sub}</div>
    </div>
  )
  const small: CSSProperties = { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '0 10px', minHeight: 30, fontSize: 12, cursor: 'pointer', fontFamily: FONT }
  const copy = async (ids: string[], what: string) => {
    const emails = Array.from(new Set(ids.map(id => players.find(p => p.id === id)).filter(Boolean).map(p => emailOf(p as Player)).filter(Boolean)))
    try { await navigator.clipboard.writeText(emails.join(', ')); alert(`${emails.length} email address${emails.length === 1 ? '' : 'es'} for “${what}” copied. Paste them into the Bcc box of your email.`) }
    catch { alert(emails.join(', ')) }
  }

  return (
    <div data-testid="monthly-plans" style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Monthly plans &amp; welcome links</div>
        <span style={{ fontSize: 11.5, color: T.text3 }}>Set a plan up on a player’s profile in Player Roster. Their welcome link asks them to agree to it.</span>
        <button onClick={() => setPicking(true)} style={{ ...small, marginLeft: 'auto', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, fontWeight: 700 }}>Send welcome links…</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
        {tile('Each month', formatPennies(monthly), `${running.length} plan${running.length === 1 ? '' : 's'} running`, T.good)}
        {tile(monthWords(period).split(' ')[0], formatPennies(taken), `of ${formatPennies(monthly)} taken so far`)}
        {tile('Waiting to agree', String(waiting), waiting ? 'Send them their welcome link' : 'None', waiting ? T.warn : T.text)}
        {tile('Questionnaires', String(answered.size), `${sentNotDone} sent, not finished · ${notSent} not sent`)}
      </div>

      {live.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead><tr>{['Player', 'Plan', 'Status', `${monthWords(period).split(' ')[0]}`].map(h => <th key={h} style={{ textAlign: 'left', fontSize: 10, color: T.text3, fontWeight: 700, padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>)}</tr></thead>
            <tbody>
              {live.map(p => {
                const b = billFor(p)
                const c = b?.charge_id ? wallet.charges.find(x => x.id === b.charge_id) : null
                const st = c ? chargeState(c) : null
                const card = savedFor(wallet, p.player_id)
                const status = p.status === 'offered' ? ['Waiting for them to agree', T.warn] : p.status === 'paused' ? ['Paused', T.text3] : !card ? ['Waiting for a card', T.warn] : ['Running', T.good]
                const day = Number(ukDate().slice(8, 10))
                const month = st ? [st.text, st.tone === 'good' ? T.good : st.tone === 'bad' ? T.bad : T.warn] : b?.status === 'failed' ? ['Failed', T.bad]
                  : p.status !== 'active' || period < p.starts_month ? ['—', T.text3] : day < p.day_of_month ? [`Due on the ${ordinal(p.day_of_month)}`, T.text3] : ['Not taken', T.warn]
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontSize: 12.5, color: T.text, fontWeight: 600 }}>{nameOf(p.player_id)}</td>
                    <td style={{ padding: 8, fontSize: 12, color: T.text2 }}>{p.name} · {planWords(p)}</td>
                    <td style={{ padding: 8, fontSize: 11.5, color: status[1], fontWeight: 700 }}>{status[0]}</td>
                    <td style={{ padding: 8, fontSize: 11.5, color: month[1], fontWeight: 700 }} title={b?.failure_reason || ''}>{month[0]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {interests.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Would like to hear about</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {interests.map(([what, ids]) => (
              <button key={what} onClick={() => copy(ids, what)} title={ids.map(nameOf).join(', ')} style={{ ...small, color: T.text }}>{what} · {ids.length} <span style={{ color: accent.hex, marginLeft: 4 }}>Copy emails</span></button>
            ))}
          </div>
        </div>
      )}

      {picking && <SendMany T={T} accent={accent} players={players} latest={latest} answered={answered} onClose={() => setPicking(false)} />}
    </div>
  )
}

function SendMany({ T, accent, players, latest, answered, onClose }: {
  T: ThemeTokens; accent: AccentTokens; players: Player[]; latest: (id: string) => Link | undefined; answered: Set<string>; onClose: () => void
}) {
  // To start with: everyone with an email who has not been sent one and has not answered.
  const [picked, setPicked] = useState<Set<string>>(() => new Set(players.filter(p => emailOf(p) && !latest(p.id)?.sent_at && !answered.has(p.id)).map(p => p.id)))
  const [version, setVersion] = useState<Version>('short')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const state = (p: Player) => { const l = latest(p.id); return answered.has(p.id) ? 'answered' : l?.completed_at ? 'finished' : l?.sent_at ? 'sent' : '' }
  const send = async () => {
    if (busy || !picked.size) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/coach/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerIds: Array.from(picked), version, send: true }) })
      const d = await r.json()
      if (!r.ok) setMsg({ text: d.error || 'That did not work.', bad: true })
      else setMsg({ text: `✓ Sent ${d.sent}.${d.noEmail?.length ? ` No email address: ${d.noEmail.join(', ')}.` : ''}${d.failed?.length ? ` Did not send: ${d.failed.join(', ')}.` : ''}`, bad: !!d.failed?.length })
      rowsChanged('coach_welcome_links')
    } catch { setMsg({ text: 'You appear to be offline.', bad: true }) }
    finally { setBusy(false) }
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div role="dialog" aria-label="Send welcome links" style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1 }}>Send welcome links</div>
          <button onClick={onClose} aria-label="Close" style={{ appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, width: 32, height: 32, fontSize: 17, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55, marginBottom: 10 }}>Each person gets their own link: a few questions about their tennis, then their card or Direct Debit and your cancellation policy, and their monthly plan if you have set one up.</div>
        <select value={version} onChange={e => setVersion(e.target.value as Version)} style={{ background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 9px', fontSize: 12.5, fontFamily: FONT, marginBottom: 10 }}>
          <option value="short">Short questions (about 5 minutes)</option>
          <option value="long">Long questions (about 15 minutes)</option>
        </select>
        <div style={{ maxHeight: 320, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 9, padding: 6 }}>
          {players.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => {
            const st = state(p)
            return (
              <label key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: emailOf(p) ? T.text2 : T.text3, padding: '5px 6px', cursor: emailOf(p) ? 'pointer' : 'default' }}>
                <input type="checkbox" disabled={!emailOf(p)} checked={picked.has(p.id)} onChange={() => setPicked(s => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })} />
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: st === 'answered' || st === 'finished' ? T.good : st ? T.warn : T.text3 }}>{!emailOf(p) ? 'no email' : st === 'answered' ? 'answered' : st === 'finished' ? 'finished' : st === 'sent' ? 'sent, not finished' : ''}</span>
              </label>
            )
          })}
        </div>
        {msg && <div role="status" style={{ fontSize: 12.5, color: msg.bad ? T.bad : T.good, marginTop: 8 }}>{msg.text}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '0 14px', minHeight: 36, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Close</button>
          <button onClick={send} disabled={busy || !picked.size} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '0 16px', minHeight: 36, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy || !picked.size ? 0.5 : 1, fontFamily: FONT }}>{busy ? 'Sending…' : `Send to ${picked.size}`}</button>
        </div>
      </div>
    </div>
  )
}
