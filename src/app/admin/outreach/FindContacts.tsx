'use client'

// Outreach → Find contacts.
//
// Looks for organisations and their public contact email, so a list does not
// have to be researched by hand every time.
//
// The page is laid out so the two kinds of step cannot be confused:
//   • FREE steps (the Companies House register, reading an organisation's own
//     website) are ordinary buttons.
//   • PAID steps (a web search, billed per use) sit in their own outlined box,
//     show what they will cost first, and run only when "Run paid search" is
//     pressed. Nothing on this page, and nothing on the server, starts one by
//     itself.

import { useCallback, useEffect, useRef, useState } from 'react'

type Segment = 'academy' | 'venue' | 'coach'
type Prospect = {
  id: string; org_name: string; company_number: string | null; legal_form: string | null; corporate_ok: boolean
  town: string | null; segment: Segment; website: string | null; email: string | null
  state: 'new' | 'no_email' | 'unsure' | 'found' | 'nothing' | 'added' | 'dismissed'; searched_paid: boolean; notes: string | null
}
type Overview = {
  prospects: Prospect[]; counts: Record<string, number>; searchable: number
  spend: { spent: number; cap: number; perLookup: number; perDiscover: number }
  ready: { companiesHouse: boolean; paid: boolean }
}

const C = { card: '#111318', line: '#1F2937', text: '#F9FAFB', sub: '#9CA3AF', dim: '#6B7280', accent: '#F5A623', good: '#34D399', bad: '#F87171', warn: '#FBBF24', paid: '#A78BFA' }
const token = () => (typeof window === 'undefined' ? '' : localStorage.getItem('admin_session_token') || '')
const btn = (kind: 'primary' | 'ghost' | 'danger' | 'paid' = 'ghost', off = false): React.CSSProperties => ({
  appearance: 'none', cursor: off ? 'default' : 'pointer', opacity: off ? 0.5 : 1, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  border: `1px solid ${kind === 'primary' ? C.accent : kind === 'danger' ? C.bad : kind === 'paid' ? C.paid : C.line}`,
  background: kind === 'primary' ? C.accent : kind === 'paid' ? C.paid : 'transparent',
  color: kind === 'primary' || kind === 'paid' ? '#111318' : kind === 'danger' ? C.bad : C.sub,
})
const input: React.CSSProperties = { width: '100%', background: '#0A0B10', border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 13, outline: 'none' }
const label: React.CSSProperties = { display: 'block', fontSize: 11, color: C.dim, marginBottom: 4 }
const usd = (n: number) => `$${n.toFixed(2)}`
const STATE: Record<Prospect['state'], [string, string]> = {
  new: ['Not looked up yet', C.dim], no_email: ['No email found', C.warn], unsure: ['Email not confirmed', C.paid], found: ['Email found', C.good],
  nothing: ['Nothing found', C.dim], added: ['Added', C.good], dismissed: ['Dismissed', C.dim],
}

async function call(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/api/admin/outreach/find', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token() }, body: JSON.stringify({ action, ...payload }) })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error || 'Something went wrong.')
  return d as Record<string, unknown>
}

export default function FindContacts({ onContactsChanged }: { onContactsChanged: () => void }) {
  const [data, setData] = useState<Overview | null>(null)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [progress, setProgress] = useState('')
  const stop = useRef(false)
  // free search
  const [words, setWords] = useState('tennis'); const [exclude, setExclude] = useState('table tennis, construction, surfaces, courts ltd'); const [location, setLocation] = useState('')
  const [segment, setSegment] = useState<Segment>('academy'); const [max, setMax] = useState('100')
  // paid
  const [paidOpen, setPaidOpen] = useState<'' | 'lookup' | 'discover'>('')
  const [howMany, setHowMany] = useState('25'); const [desc, setDesc] = useState(''); const [count, setCount] = useState('15'); const [cap, setCap] = useState('20')
  const [view, setView] = useState<'all' | Prospect['state']>('all')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach/find', { headers: { 'x-admin-token': token() } })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not load.')
      setData(d); setCap(String(d.spend.cap)); setErr('')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load.') }
  }, [])
  useEffect(() => { void load() }, [load])

  const run = async (name: string, fn: () => Promise<Record<string, unknown> | void>) => {
    setBusy(name); setNote(''); setProgress(''); stop.current = false
    try { const d = await fn(); if (d && typeof d.note === 'string') setNote(d.note) }
    catch (e) { setNote(e instanceof Error ? e.message : 'Something went wrong.') }
    setBusy(''); setProgress(''); await load()
  }

  // FREE: a few at a time until there are none left, or Stop is pressed.
  const freeLook = () => run('free', async () => {
    let checked = 0, found = 0
    for (;;) {
      const d = await call('freeLook') as { checked: number; found: number; left: number }
      checked += d.checked; found += d.found
      setProgress(`Checked ${checked}, found ${found} email${found === 1 ? '' : 's'} — ${d.left} to go`)
      if (!d.checked || !d.left || stop.current) break
    }
    return { note: `Looked up ${checked} for free: ${found} email${found === 1 ? '' : 's'} found.${stop.current ? ' Stopped.' : ''}` }
  })

  // PAID: only ever called from the "Run paid search" button below.
  const paidLookup = (total: number) => run('paid', async () => {
    let done = 0, found = 0, unsure = 0, stopped = ''
    while (done < total && !stop.current) {
      const d = await call('paidLookup', { confirm: 'paid' }) as { done: number; found: number; unsure: number; left: number; stopped: string }
      done += d.done; found += d.found; unsure += d.unsure
      setProgress(`Searched ${done} of ${total} — ${found} email${found === 1 ? '' : 's'} found`)
      if (d.stopped) { stopped = d.stopped; break }
      if (!d.done || !d.left) break
    }
    setPaidOpen('')
    return { note: `Paid search: ${done} searched, ${found} email${found === 1 ? '' : 's'} found${unsure ? `, ${unsure} to check by hand` : ''}.${stop.current ? ' Stopped.' : ''} ${stopped}`.trim() }
  })

  if (err) return (
    <div className="rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, padding: 16 }}>
      <div className="text-sm font-semibold mb-1">Find contacts</div>
      <div className="text-xs" style={{ color: C.bad }}>{err} <span style={{ color: C.dim }}>If this is the first time, run migration 190 in Supabase.</span></div>
    </div>
  )
  if (!data) return null

  const n = (s: string) => data.counts[s] || 0
  const total = Math.max(1, Math.min(data.searchable, Number(howMany) || 0))
  const room = Math.max(0, data.spend.cap - data.spend.spent)
  const shown = data.prospects.filter(p => view === 'all' || p.state === view)
  const working = !!busy

  return (
    <div className="rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, padding: 16 }}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <div className="text-sm font-semibold">Find contacts</div>
        <div className="text-xs" style={{ color: C.dim }}>Finds companies and the contact email they publish. Everything here is free unless it is in the purple box.</div>
      </div>

      {/* ── Step 1: the register (free) ── */}
      <div className="text-xs font-semibold mb-2" style={{ color: C.sub }}>1 · Find companies on the Companies House register <span style={{ color: C.good }}>· free</span></div>
      {!data.ready.companiesHouse && (
        <div className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: '#0A0B10', border: `1px solid ${C.line}`, color: C.warn }}>
          Needs a free Companies House API key on the server (COMPANIES_HOUSE_API_KEY). Until then this button cannot run; the rest of the page still works.
        </div>
      )}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <div><label style={label}>Company name contains</label><input value={words} onChange={e => setWords(e.target.value)} placeholder="tennis" style={input} /></div>
        <div><label style={label}>But not (comma separated)</label><input value={exclude} onChange={e => setExclude(e.target.value)} placeholder="table tennis, construction" style={input} /></div>
        <div><label style={label}>Area (optional)</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Manchester" style={input} /></div>
        <div><label style={label}>File them under</label>
          <select value={segment} onChange={e => setSegment(e.target.value as Segment)} style={input}>
            <option value="academy">Tennis academies</option><option value="venue">Venues that manage coaches</option><option value="coach">Individual coaches</option>
          </select></div>
        <div><label style={label}>How many new ones</label><input type="number" min={1} max={500} value={max} onChange={e => setMax(e.target.value)} style={input} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <button disabled={working || !data.ready.companiesHouse} style={btn('primary', working || !data.ready.companiesHouse)}
          onClick={() => { void run('find', () => call('findCompanies', { words, exclude, location, segment, max: Number(max) || 100 })) }}>
          {busy === 'find' ? 'Searching the register…' : 'Find companies'}
        </button>
      </div>

      {/* ── Step 2: their websites (free) ── */}
      <div className="text-xs font-semibold mt-5 mb-2" style={{ color: C.sub }}>2 · Look on their own websites for a contact email <span style={{ color: C.good }}>· free</span></div>
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={working || !n('new')} style={btn('primary', working || !n('new'))} onClick={() => { void freeLook() }}>
          {busy === 'free' ? 'Looking…' : `Look up ${n('new')} waiting`}
        </button>
        <button disabled={working || !n('found')} style={btn('ghost', working || !n('found'))}
          onClick={() => { void run('add', async () => { const d = await call('add'); onContactsChanged(); return d }) }}>
          {busy === 'add' ? 'Adding…' : `Add ${n('found')} with an email to contacts`}
        </button>
        {(busy === 'free' || busy === 'paid') && <button style={btn('danger')} onClick={() => { stop.current = true; setProgress(p => p + ' — stopping after this batch') }}>Stop</button>}
        <span className="text-xs" style={{ color: C.dim }}>{progress}</span>
      </div>
      <div className="text-xs mt-2" style={{ color: C.dim }}>
        It guesses the web address from the company name, checks the page really is theirs, and reads the email they publish. It will miss companies whose web address is nothing like their name — that is what the paid search is for.
      </div>

      {/* ── Paid ── */}
      <div className="rounded-lg mt-5" style={{ border: `1px solid ${C.paid}66`, padding: 12, background: '#0A0B10' }}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="text-xs font-semibold" style={{ color: C.paid }}>Paid web search · never runs by itself</div>
          <div className="text-xs" style={{ color: C.sub, fontVariantNumeric: 'tabular-nums' }}>This month: {usd(data.spend.spent)} of {usd(data.spend.cap)}</div>
        </div>
        <div className="text-xs mt-1" style={{ color: C.dim }}>
          Billed by Anthropic to the API key the server already uses, in US dollars. It only runs when you press a button in this box, and stops at the monthly limit.
        </div>
        {!data.ready.paid && <div className="text-xs mt-2" style={{ color: C.warn }}>Not set up on the server (ANTHROPIC_API_KEY), so these buttons cannot run.</div>}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button disabled={working || !data.ready.paid || !data.searchable} style={btn('ghost', working || !data.ready.paid || !data.searchable)} onClick={() => setPaidOpen(paidOpen === 'lookup' ? '' : 'lookup')}>
            Search for the {data.searchable} without an email…
          </button>
          <button disabled={working || !data.ready.paid} style={btn('ghost', working || !data.ready.paid)} onClick={() => setPaidOpen(paidOpen === 'discover' ? '' : 'discover')}>
            Find organisations from a description…
          </button>
          <span style={{ flex: 1 }} />
          <label className="text-xs" style={{ color: C.dim }}>Monthly limit $</label>
          <input type="number" min={0} max={500} value={cap} onChange={e => setCap(e.target.value)} style={{ ...input, width: 80 }} />
          <button disabled={working} style={btn('ghost', working)} onClick={() => { void run('cap', () => call('cap', { cap: Number(cap) })) }}>Save</button>
        </div>

        {paidOpen === 'lookup' && (
          <div className="mt-3 rounded-lg" style={{ border: `1px solid ${C.line}`, padding: 12 }}>
            <div className="flex flex-wrap items-end gap-3">
              <div style={{ width: 120 }}><label style={label}>How many to search</label><input type="number" min={1} max={data.searchable} value={howMany} onChange={e => setHowMany(e.target.value)} style={input} /></div>
              <div className="text-xs" style={{ color: C.text, lineHeight: 1.6 }}>
                About <b>{usd(total * data.spend.perLookup)}</b> for {total} — roughly {(data.spend.perLookup * 100).toFixed(0)}¢ each.
                <div style={{ color: C.dim }}>One web search per organisation to find its website; reading the site for the email is free. {usd(room)} left this month.</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button disabled={working || total * data.spend.perLookup > room + 0.001} style={btn('paid', working || total * data.spend.perLookup > room + 0.001)} onClick={() => { void paidLookup(total) }}>
                {busy === 'paid' ? 'Searching…' : `Run paid search — about ${usd(total * data.spend.perLookup)}`}
              </button>
              <button style={btn()} onClick={() => setPaidOpen('')}>Cancel</button>
              {total * data.spend.perLookup > room + 0.001 && <span className="text-xs self-center" style={{ color: C.warn }}>That is more than is left this month — search fewer, or raise the limit.</span>}
            </div>
          </div>
        )}

        {paidOpen === 'discover' && (
          <div className="mt-3 rounded-lg" style={{ border: `1px solid ${C.line}`, padding: 12 }}>
            <label style={label}>Who are you looking for?</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="e.g. padel clubs in the north west of England that employ their own coaches" style={{ ...input, resize: 'vertical' }} />
            <div className="flex flex-wrap items-end gap-3 mt-2">
              <div style={{ width: 120 }}><label style={label}>Up to how many</label><input type="number" min={3} max={25} value={count} onChange={e => setCount(e.target.value)} style={input} /></div>
              <div style={{ width: 220 }}><label style={label}>File them under</label>
                <select value={segment} onChange={e => setSegment(e.target.value as Segment)} style={input}>
                  <option value="academy">Tennis academies</option><option value="venue">Venues that manage coaches</option><option value="coach">Individual coaches</option>
                </select></div>
              <div className="text-xs" style={{ color: C.text, lineHeight: 1.6 }}>
                About <b>{usd(data.spend.perDiscover)}</b> a run.
                <div style={{ color: C.dim }}>Each one found is then checked against the register for free. Any that is not a registered company is held back when added.</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button disabled={working || data.spend.perDiscover > room + 0.001} style={btn('paid', working || data.spend.perDiscover > room + 0.001)}
                onClick={() => { void run('discover', async () => { const d = await call('paidDiscover', { confirm: 'paid', description: desc, segment, count: Number(count) || 15 }); setPaidOpen(''); return d }) }}>
                {busy === 'discover' ? 'Searching the web…' : `Run paid search — about ${usd(data.spend.perDiscover)}`}
              </button>
              <button style={btn()} onClick={() => setPaidOpen('')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {!!note && <div className="text-xs rounded-lg px-3 py-2 mt-3" style={{ background: '#0A0B10', border: `1px solid ${C.line}`, color: C.sub }}>{note}</div>}

      {/* ── The list ── */}
      {data.prospects.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {(['all', 'found', 'unsure', 'no_email', 'new', 'nothing'] as const).map(s => {
              const c = s === 'all' ? data.prospects.length : n(s)
              if (s !== 'all' && !c) return null
              return <button key={s} onClick={() => setView(s)} style={{ ...btn(), borderColor: view === s ? C.accent : C.line, color: view === s ? C.accent : C.sub }}>{s === 'all' ? 'All' : STATE[s][0]} {c}</button>
            })}
            <span style={{ flex: 1 }} />
            <button disabled={working} style={btn('danger', working)} onClick={() => { if (window.confirm('Clear everything on this list that has not been added to contacts? They will not be offered again.')) void run('clear', () => call('clear')) }}>Clear list</button>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto', border: `1px solid ${C.line}`, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, fontSize: 12 }}>
              <thead><tr>{['Organisation', 'Legal form', 'Website', 'Email', 'Where it is up to', ''].map(h => <th key={h} style={{ textAlign: 'left', fontSize: 10, color: C.dim, fontWeight: 600, padding: '7px 10px', textTransform: 'uppercase', letterSpacing: '0.05em', position: 'sticky', top: 0, background: C.card }}>{h}</th>)}</tr></thead>
              <tbody>
                {shown.slice(0, 300).map(p => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: '7px 10px', color: C.text }}>{p.org_name}{p.town ? <span style={{ color: C.dim }}> · {p.town}</span> : null}</td>
                    <td style={{ padding: '7px 10px', color: p.corporate_ok ? C.sub : C.warn, whiteSpace: 'nowrap' }}>{p.legal_form || 'Unknown'}{p.corporate_ok ? '' : ' — will be held'}</td>
                    <td style={{ padding: '7px 10px' }}>{p.website ? <a href={p.website} target="_blank" rel="noreferrer" style={{ color: C.sub, textDecoration: 'underline' }}>{p.website.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span style={{ color: C.dim }}>—</span>}</td>
                    <td style={{ padding: '7px 10px', color: p.email ? C.text : C.dim, wordBreak: 'break-all' }}>{p.email || '—'}</td>
                    <td style={{ padding: '7px 10px', color: STATE[p.state][1], whiteSpace: 'nowrap' }} title={p.notes || ''}>{STATE[p.state][0]}{p.searched_paid && p.state !== 'found' && p.state !== 'unsure' ? ' (searched)' : ''}</td>
                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {p.state === 'unsure' && <button disabled={working} style={{ ...btn('ghost', working), padding: '3px 8px', marginRight: 6 }} onClick={() => { void run('row', () => call('accept', { ids: [p.id] })) }}>Use it</button>}
                      {(p.state === 'no_email' || p.state === 'nothing' || p.state === 'new') && <button disabled={working} style={{ ...btn('ghost', working), padding: '3px 8px', marginRight: 6 }}
                        onClick={() => { const e = window.prompt(`Contact email for ${p.org_name}`); if (e) void run('row', () => call('setEmail', { ids: [p.id], email: e })) }}>Type email</button>}
                      <button disabled={working} style={{ ...btn('ghost', working), padding: '3px 8px' }} onClick={() => { void run('row', () => call('dismiss', { ids: [p.id] })) }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown.length > 300 && <div className="text-xs mt-1" style={{ color: C.dim }}>Showing the first 300 of {shown.length}.</div>}
        </div>
      )}
    </div>
  )
}
