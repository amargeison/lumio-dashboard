'use client'

// A client's welcome link and monthly plan — the strips under "Card on file"
// on their profile in Player Roster.
//
//   Welcome     send (or copy) their welcome link: a few questions, their card
//               or Direct Debit and the cancellation policy, and agreeing to
//               their monthly plan if they have one. Their answers show here.
//   Monthly     a set amount on a set day each month, taken from their saved
//               card or Direct Debit once they have agreed to it.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, rowsChanged } from '../_lib/coach-db'
import { useWallet, reloadWallet, savedFor, chargeState } from '../_lib/pay-wallet'
import { readable, type Answers, type Version } from '@/lib/coach/questionnaire'
import { planWords, monthWords, monthOf, nextMonth, nextBillDate, ordinal, type Plan, type Covers } from '@/lib/coach/memberships'
import { ukDate } from '@/lib/coach/uk-date'
import { formatPennies } from '@/lib/coach/money'
import { consentWords, type RecordConsent } from '@/lib/coach/recording-consent'

type Link = { id: string; player_id: string; version: Version; sent_at: string | null; sent_to: string | null; opened_at: string | null; completed_at: string | null; created_at: string }
type Qn = { id: string; player_id: string; version: Version; answers: Answers & { health?: string }; health_consent: boolean; submitted_at: string }
type Bill = { id: string; membership_id: string; period: string; amount_pennies: number; charge_id: string | null; status: string; failure_reason: string | null; created_at: string }
type PlanRow = Plan & { notes?: string | null; agreed_by?: string | null; created_at: string }

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' }) : '')
const dayIso = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

export function ClientSetup({ T, accent, player, pad }: {
  T: ThemeTokens; accent: AccentTokens; pad: number
  player: { id: string; name: string; email?: string | null; parent_email?: string | null; contact_email?: string | null } & RecordConsent
}) {
  const links = useCoachTable<Link>('coach_welcome_links')
  const qns = useCoachTable<Qn>('coach_questionnaires')
  const plans = useCoachTable<PlanRow>('coach_memberships')
  const bills = useCoachTable<Bill>('coach_membership_bills')
  const { rows: groups } = useCoachTable<{ id: string; name: string; active: boolean }>('coach_groups')
  const { wallet } = useWallet()
  const [version, setVersion] = useState<Version>('short')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [editing, setEditing] = useState<PlanRow | 'new' | null>(null)

  const first = player.name.split(/\s+/)[0]
  const to = player.parent_email || player.email || player.contact_email || ''
  const link = links.rows.filter(l => l.player_id === player.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null
  const qn = qns.rows.filter(q => q.player_id === player.id).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0] || null
  const plan = plans.rows.filter(p => p.player_id === player.id && p.status !== 'ended').sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null
  const myBills = plan ? bills.rows.filter(b => b.membership_id === plan.id).sort((a, b) => b.period.localeCompare(a.period)) : []
  const card = savedFor(wallet, player.id)

  const btn: CSSProperties = { appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 7, color: T.text2, padding: '0 10px', minHeight: 32, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
  const primary: CSSProperties = { ...btn, border: 0, background: accent.hex, color: T.btnText }
  const wrap: CSSProperties = { padding: `8px ${pad + 4}px`, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: FONT }
  const head = (t: string) => <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{t}</div>
  const pill = (t: string, tone: string) => <span style={{ fontSize: 10.5, fontWeight: 700, color: tone, background: `${tone}1f`, border: `1px solid ${tone}44`, borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>{t}</span>

  const sendWelcome = async (send: boolean) => {
    if (busy) return
    setBusy(send ? 'send' : 'copy'); setMsg(null)
    try {
      const r = await fetch('/api/coach/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerIds: [player.id], version, send }) })
      const d = await r.json()
      if (!r.ok) setMsg({ text: d.error || 'That did not work.', bad: true })
      else if (!send && d.url) { try { await navigator.clipboard.writeText(d.url); setMsg({ text: 'Link copied. Send it however suits you.' }) } catch { setMsg({ text: `Copy this link: ${d.url}` }) } }
      else setMsg(d.sent ? { text: `✓ Welcome link sent${to ? ` to ${to}` : ''}.` } : { text: d.noEmail?.length ? `There is no email address for ${first}. Copy the link instead.` : 'The email did not send. Copy the link and send it yourself.', bad: true })
      rowsChanged('coach_welcome_links')
    } catch { setMsg({ text: 'You appear to be offline.', bad: true }) }
    finally { setBusy('') }
  }
  const setStatus = async (status: Plan['status']) => {
    if (!plan || busy) return
    if (status === 'ended' && !confirm(`End ${first}’s monthly plan? No more monthly payments are taken. Anything already taken stays as it is.`)) return
    setBusy(status); setMsg(null)
    try { await dbUpdate('coach_memberships', plan.id, { status }); setMsg({ text: status === 'ended' ? 'Plan ended.' : status === 'paused' ? 'Paused. Nothing is taken until you resume it.' : 'Resumed.' }) }
    catch (e) { setMsg({ text: e instanceof Error ? e.message : 'That could not be saved.', bad: true }) }
    finally { setBusy('') }
  }
  const chargeNow = async () => {
    if (!plan || busy) return
    if (!confirm(`Take ${formatPennies(plan.amount_pennies)} for ${monthWords(monthOf(ukDate()))} from ${first}’s saved card or Direct Debit now?`)) return
    setBusy('charge'); setMsg(null)
    try {
      const r = await fetch('/api/coach/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'charge-now', id: plan.id }) })
      const d = await r.json()
      setMsg(d.ok ? { text: d.status === 'processing' ? '✓ Direct Debit started. It arrives in about three working days.' : `✓ ${formatPennies(plan.amount_pennies)} taken.` } : { text: d.error || 'The payment did not go through.', bad: true })
      rowsChanged('coach_membership_bills'); void reloadWallet()
    } catch { setMsg({ text: 'You appear to be offline. Nothing was taken.', bad: true }) }
    finally { setBusy('') }
  }

  const setRecord = async (ok: boolean) => {
    if (busy) return
    if (!ok && !confirm(`Note that ${first} no longer agrees to lessons being recorded? Recordings already made stay until you delete them.`)) return
    setBusy('rec'); setMsg(null)
    try { await dbUpdate('coach_players', player.id, ok ? { consent_record: true, consent_record_at: new Date().toISOString(), consent_record_by: 'Agreed in person', consent_record_how: 'in_person' } : { consent_record: false, consent_record_at: new Date().toISOString(), consent_record_how: 'withdrawn' }) }
    catch (e) { setMsg({ text: e instanceof Error ? e.message : 'That could not be saved.', bad: true }) }
    finally { setBusy('') }
  }
  const billState = (b: Bill) => {
    const c = b.charge_id ? wallet.charges.find(x => x.id === b.charge_id) : null
    if (c) { const st = chargeState(c); return { text: st.text, tone: st.tone === 'good' ? T.good : st.tone === 'bad' ? T.bad : st.tone === 'warn' ? T.warn : T.text3 } }
    if (b.status === 'failed') return { text: 'Failed', tone: T.bad }
    return { text: b.status === 'charging' ? 'Taking…' : 'Taken', tone: T.text3 }
  }
  const thisMonth = monthOf(ukDate())
  const thisBill = myBills.find(b => b.period === thisMonth)
  const canChargeNow = !!plan && plan.status === 'active' && !!plan.agreed_at && thisMonth >= plan.starts_month && !!card && (!thisBill || thisBill.status === 'failed')

  return (
    <>
      <div data-testid="welcome-strip" style={wrap}>
        {head('Welcome link & questionnaire')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <span style={{ color: link?.completed_at ? T.good : link?.sent_at ? T.warn : T.text3 }}>
            {!link ? 'Not sent yet.' : link.completed_at ? `✓ Finished ${day(link.completed_at)}.` : link.sent_at ? `Sent ${day(link.sent_at)}${link.opened_at ? `, opened ${day(link.opened_at)}` : ''}. Not finished yet.` : 'Link made, not emailed.'}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={version} onChange={e => setVersion(e.target.value as Version)} aria-label="Which questionnaire" style={{ ...btn, minHeight: 32, cursor: 'pointer', background: T.panel2 }}>
              <option value="short">Short questions (5 min)</option>
              <option value="long">Long questions (15 min)</option>
            </select>
            <button onClick={() => sendWelcome(true)} disabled={!!busy || !to} title={to ? `Email it to ${to}` : 'Add an email address to send it'} style={{ ...primary, opacity: !to ? 0.5 : 1 }}>{busy === 'send' ? 'Sending…' : link?.sent_at && !link.completed_at ? 'Send again' : 'Send welcome link'}</button>
            <button onClick={() => sendWelcome(false)} disabled={!!busy} style={btn}>{busy === 'copy' ? 'Copying…' : 'Copy link'}</button>
          </span>
        </div>
        {qn && (
          <div>
            <button onClick={() => setShowAnswers(s => !s)} style={{ ...btn, minHeight: 28, color: accent.hex, borderColor: accent.border }}>{showAnswers ? 'Hide' : 'See'} {first}’s answers ({day(qn.submitted_at)})</button>
            {showAnswers && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="answers">
                {readable(qn.version, qn.answers).map(r => (
                  <div key={r.q} style={{ fontSize: 12, lineHeight: 1.45 }}>
                    <div style={{ color: T.text3 }}>{r.q}</div>
                    <div style={{ color: T.text }}>{r.a}</div>
                  </div>
                ))}
                {qn.answers.health && (
                  <div style={{ fontSize: 12, lineHeight: 1.45 }}>
                    <div style={{ color: T.text3 }}>Health (shared with their consent)</div>
                    <div style={{ color: T.text }}>{qn.answers.health}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {msg && <div role="status" style={{ fontSize: 11.5, color: msg.bad ? T.bad : T.good, overflowWrap: 'anywhere' }}>{msg.text}</div>}
      </div>

      <div data-testid="record-consent" style={wrap}>
        {head('Recording lessons')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <span style={{ color: player.consent_record ? T.good : T.warn }}>{consentWords(player, first)}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {!player.consent_record && <button onClick={() => setRecord(true)} disabled={!!busy} style={btn}>{busy === 'rec' ? 'Saving…' : 'They agreed in person'}</button>}
            {player.consent_record && <button onClick={() => setRecord(false)} disabled={!!busy} style={{ ...btn, color: T.bad }}>{busy === 'rec' ? 'Saving…' : 'They withdrew it'}</button>}
          </span>
        </div>
        <div style={{ fontSize: 11, color: T.text3 }}>Their welcome link asks them. Until they agree, their lessons cannot be recorded.</div>
      </div>

      <div data-testid="plan-strip" style={wrap}>
        {head('Monthly plan')}
        {!plan && !editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ color: T.text3 }}>No monthly plan. {first} pays lesson by lesson (or from a pack).</span>
            <button onClick={() => setEditing('new')} style={{ ...btn, marginLeft: 'auto' }}>Set up a monthly plan</button>
          </div>
        )}
        {plan && !editing && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ color: T.text, fontWeight: 600 }}>{plan.name} · {planWords(plan)}</span>
              {plan.status === 'offered' ? pill('Waiting for them to agree', T.warn)
                : plan.status === 'paused' ? pill('Paused', T.text3)
                : !card ? pill('Waiting for a card', T.warn)
                : pill(`Next ${dayIso(nextBillDate(plan, new Set(myBills.filter(b => b.status !== 'failed').map(b => b.period))))}`, T.good)}
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {canChargeNow && <button onClick={chargeNow} disabled={!!busy} style={primary}>{busy === 'charge' ? 'Taking…' : `Take ${monthWords(thisMonth).split(' ')[0]} now`}</button>}
                <button onClick={() => setEditing(plan)} disabled={!!busy} style={btn}>Edit</button>
                {plan.status === 'paused' ? <button onClick={() => setStatus('active')} disabled={!!busy} style={btn}>Resume</button>
                  : plan.status === 'active' ? <button onClick={() => setStatus('paused')} disabled={!!busy} style={btn}>Pause</button> : null}
                <button onClick={() => setStatus('ended')} disabled={!!busy} style={{ ...btn, color: T.bad }}>End</button>
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>
              From {monthWords(plan.starts_month)} · {plan.covers === 'lessons' ? 'covers their one-to-one lessons' : plan.covers === 'group' ? `covers their place in ${groups.find(g => g.id === plan.group_id)?.name || 'a weekly group'}` : 'covers nothing else'}
              {plan.agreed_at ? ` · agreed ${day(plan.agreed_at)}${plan.agreed_by ? ` by ${plan.agreed_by}` : ''}` : ` · ${first} agrees to it from their welcome link`}
            </div>
            {myBills.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {myBills.slice(0, 4).map(b => { const st = billState(b); return <span key={b.id} title={b.failure_reason || ''} style={{ fontSize: 11, color: T.text2 }}>{monthWords(b.period).split(' ')[0]} {formatPennies(b.amount_pennies)} {pill(st.text, st.tone)}</span> })}
              </div>
            )}
          </>
        )}
        {editing && <PlanForm T={T} accent={accent} playerId={player.id} plan={editing === 'new' ? null : editing} groups={groups.filter(g => g.active)}
          onDone={text => { setEditing(null); if (text) setMsg({ text }) }} />}
        {!editing && msg && plan && <div role="status" style={{ fontSize: 11.5, color: msg.bad ? T.bad : T.good }}>{msg.text}</div>}
      </div>
    </>
  )
}

function PlanForm({ T, accent, playerId, plan, groups, onDone }: {
  T: ThemeTokens; accent: AccentTokens; playerId: string; plan: PlanRow | null; groups: { id: string; name: string }[]; onDone: (msg?: string) => void
}) {
  const now = monthOf(ukDate())
  const months = [now]; for (let i = 0; i < 5; i++) months.push(nextMonth(months[months.length - 1]))
  const [d, setD] = useState({
    name: plan?.name || 'Monthly plan', amount: plan ? String(plan.amount_pennies / 100) : '', day: plan?.day_of_month ?? 1,
    starts: plan?.starts_month || nextMonth(now), covers: (plan?.covers || 'lessons') as Covers, group: plan?.group_id || groups[0]?.id || '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const field: CSSProperties = { minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 7, padding: '7px 8px', fontSize: 12, fontFamily: FONT, boxSizing: 'border-box', width: '100%' }
  const lbl: CSSProperties = { display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, marginBottom: 3 }
  const save = async () => {
    const pennies = Math.round(parseFloat(d.amount.replace(/[£,\s]/g, '')) * 100)
    if (!d.name.trim()) { setErr('Give the plan a name.'); return }
    if (!(pennies >= 50 && pennies <= 200000)) { setErr('Enter the monthly amount, between £0.50 and £2,000.'); return }
    if (d.covers === 'group' && !d.group) { setErr('Choose the group it covers.'); return }
    setBusy(true); setErr('')
    const row = { name: d.name.trim().slice(0, 80), amount_pennies: pennies, day_of_month: Number(d.day), starts_month: d.starts, covers: d.covers, group_id: d.covers === 'group' ? d.group : null }
    try {
      if (plan) {
        const reagree = !!plan.agreed_at && (pennies !== plan.amount_pennies || Number(d.day) !== plan.day_of_month)
        if (reagree && !confirm('Changing the amount or the day means they need to agree again before the next payment is taken. Send them their welcome link afterwards. Carry on?')) { setBusy(false); return }
        await dbUpdate('coach_memberships', plan.id, row)
        onDone(reagree ? 'Saved. They need to agree to the new amount: send their welcome link.' : 'Saved.')
      } else {
        await dbInsert('coach_memberships', { ...row, player_id: playerId, status: 'offered' })
        onDone('Plan set up. Send their welcome link so they can agree to it and save a card or Direct Debit.')
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'It could not be saved.') }
    finally { setBusy(false) }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        <label><span style={lbl}>Name</span><input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} style={field} /></label>
        <label><span style={lbl}>£ a month</span><input inputMode="decimal" value={d.amount} onChange={e => setD({ ...d, amount: e.target.value })} placeholder="e.g. 150" style={field} /></label>
        <label><span style={lbl}>Taken on the</span><select value={d.day} onChange={e => setD({ ...d, day: Number(e.target.value) })} style={field}>{Array.from({ length: 28 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{ordinal(n)}</option>)}</select></label>
        <label><span style={lbl}>Starting</span><select value={d.starts} onChange={e => setD({ ...d, starts: e.target.value })} style={field}>{months.map(m => <option key={m} value={m}>{monthWords(m)}</option>)}</select></label>
        <label><span style={lbl}>It covers</span><select value={d.covers} onChange={e => setD({ ...d, covers: e.target.value as Covers })} style={field}>
          <option value="lessons">Their one-to-one lessons</option>
          <option value="group" disabled={!groups.length}>A weekly group place</option>
          <option value="none">Nothing else (just the amount)</option>
        </select></label>
        {d.covers === 'group' && <label><span style={lbl}>Group</span><select value={d.group} onChange={e => setD({ ...d, group: e.target.value })} style={field}>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
      </div>
      <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.5 }}>What it covers is not charged again lesson by lesson. The client agrees to the plan from their welcome link; nothing is taken until they have, and until they have a card or Direct Debit saved.</div>
      {err && <div role="alert" style={{ fontSize: 11.5, color: T.bad }}>{err}</div>}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={() => onDone()} style={{ appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 7, color: T.text2, padding: '0 12px', minHeight: 32, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={save} disabled={busy} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 7, padding: '0 14px', minHeight: 32, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>{busy ? 'Saving…' : plan ? 'Save' : 'Set up plan'}</button>
      </div>
    </div>
  )
}
