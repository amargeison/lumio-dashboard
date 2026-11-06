'use client'

// Who has a login, and the invite controls for them. Reads go through the HQ's own
// session; Revoke and invites go through the server, because members and invites are
// closed to browser writes.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, UserCheck } from 'lucide-react'
import { Card, EmptyState, Pill, SectionTitle, buttonPrimary, buttonSecondary } from './ui'
import { TP_DARK, TP_RED } from '@/data/tenproject/demo-data'
import { useImpact } from './ImpactDataContext'
import { familiesToInvite, memberLines, type InviteRow, type MemberLine, type MemberRow, type MemberStatus } from '@/lib/impact/members'

const sb = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const small: React.CSSProperties = { ...buttonSecondary, padding: '5px 9px', fontSize: 11 }
const TONE: Record<MemberStatus, 'green' | 'amber' | 'grey' | 'red'> = { active: 'green', invited: 'amber', expired: 'red', revoked: 'grey' }
const ROLE_LABEL = { coach: 'Coach', parent: 'Parent', school: 'School' }

async function post(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'That didn’t work. Please try again.')
  return data
}

/** The org's logins. Only the HQ of a live portal gets anything back. */
export function useMembers() {
  const { mode, org } = useImpact()
  const on = mode === 'live' && !!org?.canEdit
  const [members, setMembers] = useState<MemberRow[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [emails, setEmails] = useState<Record<string, string | null>>({})
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!on) return
    const db = sb()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return
    const [m, i, s, f, sc] = await Promise.all([
      db.from('impact_members').select('*').eq('hq_id', user.id),
      db.from('impact_invites').select('id, hq_id, role, staff_id, family_id, school_id, email, expires_at, accepted_at, revoked_at, created_at').eq('hq_id', user.id),
      db.from('tp_staff').select('id, name, email').eq('hq_id', user.id),
      db.from('tp_families').select('id, guardian_name').eq('hq_id', user.id),
      db.from('tp_schools').select('id, name').eq('hq_id', user.id),
    ])
    setMembers((m.data ?? []) as MemberRow[])
    setInvites((i.data ?? []) as InviteRow[])
    setNames(Object.fromEntries([
      ...(s.data ?? []).map(x => [x.id, x.name]), ...(f.data ?? []).map(x => [x.id, x.guardian_name]), ...(sc.data ?? []).map(x => [x.id, x.name]),
    ]))
    setEmails(Object.fromEntries((s.data ?? []).map(x => [x.id, x.email])))
    setLoaded(true)
  }, [on])
  useEffect(() => { void load() }, [load])

  const lines = useMemo(() => memberLines(members, invites), [members, invites])
  return { on, loaded, lines, names, emails, reload: load }
}

/** "Invite parent" or "Invite coach" on one person's card, or where their invite stands. */
export function InviteButton({ role, targetId, label, hasEmail, lines, onDone }: {
  role: 'parent' | 'coach'; targetId: string; label: string; hasEmail: boolean; lines: MemberLine[]; onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const line = lines.find(l => l.role === role && (role === 'parent' ? l.familyId : l.staffId) === targetId)
  if (line?.status === 'active') return <Pill tone="green">LOGIN ACTIVE</Pill>
  if (line?.status === 'invited') return <Pill tone="amber">INVITED</Pill>
  if (!hasEmail) return null
  async function go() {
    setBusy(true); setErr('')
    try { await post('/api/impact/invite', { role, targetId }); onDone() }
    catch (e) { setErr(e instanceof Error ? e.message : 'The invite wasn’t sent.') }
    setBusy(false)
  }
  return (
    <span style={{ display: 'inline-grid', gap: 3 }}>
      <button onClick={go} disabled={busy} style={small}><Mail size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{busy ? 'Sending…' : label}</button>
      {err && <span role="alert" style={{ fontSize: 10.5, color: TP_RED }}>{err}</span>}
    </span>
  )
}

/** Every family with an email and no login, after a count and a confirm. */
export function BulkInvite({ families, lines, onDone }: {
  families: { id: string; email: string | null; unsubscribed: boolean }[]; lines: MemberLine[]; onDone: () => void
}) {
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState('')
  const [err, setErr] = useState('')
  const count = familiesToInvite(families, lines).length
  if (!count && !report && !err) return null
  async function go() {
    setBusy(true); setSure(false); setErr(''); setReport('')
    try {
      const r = await post('/api/impact/invite', { bulk: true }) as { sent: number; failed: number; left: number }
      setReport(`${r.sent} invite${r.sent === 1 ? '' : 's'} sent.${r.failed ? ` ${r.failed} failed.` : ''}${r.left ? ` ${r.left} left for the next hour, as invites are limited to 50 an hour.` : ''}`)
      onDone()
    } catch (e) { setErr(e instanceof Error ? e.message : 'The invites weren’t sent.') }
    setBusy(false)
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {count > 0 && !sure && <button onClick={() => setSure(true)} disabled={busy} style={buttonSecondary}>{busy ? 'Sending…' : `Invite all families with an email and no login (${count})`}</button>}
      {sure && <>
        <span style={{ fontSize: 12, color: TP_DARK }}>Send {count} invite{count === 1 ? '' : 's'}? Invites are limited to 50 an hour.</span>
        <button onClick={go} style={buttonPrimary}>Send invites</button>
        <button onClick={() => setSure(false)} style={buttonSecondary}>Cancel</button>
      </>}
      {report && <span role="status" style={{ fontSize: 12, color: '#187A3C' }}>{report}</span>}
      {err && <span role="alert" style={{ fontSize: 12, color: TP_RED }}>{err}</span>}
    </div>
  )
}

// Settings → People.
export default function MembersCard() {
  const { on, loaded, lines, names, reload } = useMembers()
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  if (!on) return null

  async function act(l: MemberLine, action: 'revoke' | 'resend') {
    setBusy(l.key); setErr('')
    try { await post('/api/impact/members', { action, memberId: l.memberId, inviteId: l.inviteId }); await reload() }
    catch (e) { setErr(e instanceof Error ? e.message : 'That didn’t work. Please try again.') }
    setBusy('')
  }

  return (
    <Card>
      <SectionTitle sub="Coaches and parents who can sign in. Invite people from the Families and Coaches tabs.">
        <UserCheck size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />People
      </SectionTitle>
      {err && <div role="alert" style={{ fontSize: 12, color: TP_RED, marginBottom: 8 }}>{err}</div>}
      {loaded && !lines.length && <EmptyState compact icon={UserCheck} title="No logins yet" sub="Invite a parent from Families, or a coach from Coaches." />}
      {lines.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: TP_DARK }}>
            <thead><tr style={{ textAlign: 'left', color: '#8A847E', fontSize: 10.5 }}>
              <th style={{ padding: '6px 4px' }}>Role</th><th style={{ padding: '6px 4px' }}>Name</th><th style={{ padding: '6px 4px' }}>Email</th><th style={{ padding: '6px 4px' }}>Status</th><th />
            </tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.key} style={{ borderTop: '1px solid #F0EBE5' }}>
                  <td style={{ padding: '8px 4px' }}>{ROLE_LABEL[l.role]}</td>
                  <td style={{ padding: '8px 4px', fontWeight: 700, color: TP_DARK }}>{names[l.staffId ?? l.familyId ?? l.schoolId ?? ''] ?? '—'}</td>
                  <td style={{ padding: '8px 4px', color: '#6B6560' }}>{l.email || '—'}</td>
                  <td style={{ padding: '8px 4px' }}><Pill tone={TONE[l.status]}>{l.status.toUpperCase()}</Pill></td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {l.inviteId && l.status !== 'active' && <button disabled={busy === l.key} onClick={() => act(l, 'resend')} style={{ ...small, marginRight: 6 }}>Resend invite</button>}
                    {(l.status === 'active' || l.status === 'invited') && <button disabled={busy === l.key} onClick={() => act(l, 'revoke')} style={small}>Revoke</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
