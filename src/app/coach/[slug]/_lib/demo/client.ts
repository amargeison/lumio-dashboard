// A stand-in for the Supabase browser client, backed by the in-memory demo
// store. It understands the handful of query shapes the coach portal uses —
// select / insert / update / delete / upsert with the usual filters — and
// answers them from memory, in the same { data, error, count } envelope.
//
// It is deliberately forgiving: a filter it does not know is ignored rather
// than thrown on, because a demo that shows slightly too much is fine and a
// demo that crashes is not.

import { demoTable, demoId, ensureDemo, DEMO_COACH_ID, DEMO_EMAIL, type Row } from './store'

type Pred = (r: Row) => boolean
type Result = { data: unknown; error: null | { message: string }; count?: number | null }

const likeToRegex = (pattern: string) => new RegExp('^' + String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i')
const same = (a: unknown, b: unknown) => a === b || (a != null && b != null && String(a) === String(b))

function compare(op: string, value: unknown, want: unknown): boolean {
  switch (op) {
    case 'eq': return same(value, want)
    case 'neq': return !same(value, want)
    case 'gt': return value != null && String(value) > String(want)
    case 'gte': return value != null && String(value) >= String(want)
    case 'lt': return value != null && String(value) < String(want)
    case 'lte': return value != null && String(value) <= String(want)
    case 'like': case 'ilike': return value != null && likeToRegex(String(want)).test(String(value))
    case 'is': return want === null || want === 'null' ? value == null : want === true || want === 'true' ? value === true : want === false || want === 'false' ? value === false : same(value, want)
    case 'in': {
      const list = Array.isArray(want) ? want : String(want).replace(/^\(|\)$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      return list.some(x => same(value, x))
    }
    case 'cs': case 'contains': return Array.isArray(value) && (Array.isArray(want) ? want : [want]).every(x => value.some(v => same(v, x)))
    default: return true
  }
}

class Query implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: Row | Row[] | null = null
  private preds: Pred[] = []
  private orders: { col: string; asc: boolean }[] = []
  private lim: number | null = null
  private offset = 0
  private one: 'single' | 'maybe' | null = null
  private head = false
  private wantCount = false
  private returning = false
  private conflict: string[] = ['id']

  constructor(private table: string) {}

  // ── verbs ──
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op !== 'select') { this.returning = true; return this }
    this.head = !!opts?.head; this.wantCount = !!opts?.count
    return this
  }
  insert(rows: Row | Row[]) { this.op = 'insert'; this.payload = rows; return this }
  update(patch: Row) { this.op = 'update'; this.payload = patch; return this }
  delete() { this.op = 'delete'; return this }
  upsert(rows: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = 'upsert'; this.payload = rows
    if (opts?.onConflict) this.conflict = opts.onConflict.split(',').map(s => s.trim())
    return this
  }

  // ── filters ──
  private where(col: string, op: string, want: unknown) { this.preds.push(r => compare(op, r[col], want)); return this }
  eq(col: string, v: unknown) { return this.where(col, 'eq', v) }
  neq(col: string, v: unknown) { return this.where(col, 'neq', v) }
  gt(col: string, v: unknown) { return this.where(col, 'gt', v) }
  gte(col: string, v: unknown) { return this.where(col, 'gte', v) }
  lt(col: string, v: unknown) { return this.where(col, 'lt', v) }
  lte(col: string, v: unknown) { return this.where(col, 'lte', v) }
  like(col: string, v: unknown) { return this.where(col, 'like', v) }
  ilike(col: string, v: unknown) { return this.where(col, 'ilike', v) }
  is(col: string, v: unknown) { return this.where(col, 'is', v) }
  in(col: string, v: unknown[]) { return this.where(col, 'in', v) }
  contains(col: string, v: unknown) { return this.where(col, 'contains', v) }
  filter(col: string, op: string, v: unknown) { return this.where(col, op, v) }
  match(obj: Row) { for (const [k, v] of Object.entries(obj || {})) this.where(k, 'eq', v); return this }
  not(col: string, op: string, v: unknown) { this.preds.push(r => !compare(op, r[col], v)); return this }
  /** "a.eq.1,b.is.null" — any of them. */
  or(expr: string) {
    const parts = String(expr).split(',').map(p => { const [col, op, ...rest] = p.trim().split('.'); return { col, op, want: rest.join('.') } })
    this.preds.push(r => parts.some(p => compare(p.op, r[p.col], p.want === 'null' ? null : p.want)))
    return this
  }

  // ── shape ──
  order(col: string, opts?: { ascending?: boolean }) { this.orders.push({ col, asc: opts?.ascending !== false }); return this }
  limit(n: number) { this.lim = n; return this }
  range(from: number, to: number) { this.offset = from; this.lim = to - from + 1; return this }
  single() { this.one = 'single'; return this }
  maybeSingle() { this.one = 'maybe'; return this }

  private matches(r: Row) { return this.preds.every(p => p(r)) }
  private stamp(row: Row): Row {
    const now = new Date().toISOString()
    return { id: demoId(), coach_id: DEMO_COACH_ID, created_at: now, updated_at: now, ...row }
  }

  private run(): Result {
    const rows = demoTable(this.table)
    const list = (v: Row | Row[] | null) => (Array.isArray(v) ? v : v ? [v] : [])
    let out: Row[] = []

    if (this.op === 'select') {
      out = rows.filter(r => this.matches(r))
      for (const o of [...this.orders].reverse()) {
        out = [...out].sort((a, b) => { const x = a[o.col], y = b[o.col]; const c = x == null ? (y == null ? 0 : 1) : y == null ? -1 : x < y ? -1 : x > y ? 1 : 0; return o.asc ? c : -c })
      }
      const total = out.length
      if (this.offset) out = out.slice(this.offset)
      if (this.lim != null) out = out.slice(0, this.lim)
      if (this.head) return { data: null, error: null, count: total }
      return this.shape(out, this.wantCount ? total : undefined)
    }
    if (this.op === 'insert') {
      out = list(this.payload).map(r => this.stamp(r))
      rows.unshift(...out)
    } else if (this.op === 'upsert') {
      for (const r of list(this.payload)) {
        const hit = rows.find(x => this.conflict.every(c => r[c] != null && same(x[c], r[c])))
        if (hit) { Object.assign(hit, r, { updated_at: new Date().toISOString() }); out.push(hit) }
        else { const n = this.stamp(r); rows.unshift(n); out.push(n) }
      }
    } else if (this.op === 'update') {
      out = rows.filter(r => this.matches(r))
      for (const r of out) Object.assign(r, this.payload)
    } else if (this.op === 'delete') {
      out = rows.filter(r => this.matches(r))
      for (const r of out) rows.splice(rows.indexOf(r), 1)
    }
    return this.returning ? this.shape(out) : { data: null, error: null }
  }

  private shape(out: Row[], count?: number): Result {
    // Copies, so a component editing what it was handed cannot edit the store.
    const copy = out.map(r => ({ ...r }))
    if (this.one === 'single') return copy[0] ? { data: copy[0], error: null, count } : { data: null, error: { message: 'No rows found' }, count }
    if (this.one === 'maybe') return { data: copy[0] ?? null, error: null, count }
    return { data: copy, error: null, count }
  }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    // The academy's data arrives as its own chunk on first use; every query waits for it.
    return ensureDemo().then(() => {
      try { return this.run() } catch (e) { return { data: null, error: { message: e instanceof Error ? e.message : 'demo store error' } } as Result }
    }).then(ok, fail)
  }
}

const demoUser = { id: DEMO_COACH_ID, email: DEMO_EMAIL, app_metadata: { role: 'demo', sport: 'coach' }, user_metadata: {} }
const okStorage = {
  upload: async () => ({ data: { path: 'demo' }, error: null }),
  uploadToSignedUrl: async () => ({ data: { path: 'demo' }, error: null }),
  remove: async () => ({ data: [], error: null }),
  createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }),
  getPublicUrl: () => ({ data: { publicUrl: '' } }),
}

const client = {
  from: (table: string) => new Query(table),
  rpc: async () => ({ data: null, error: null }),
  auth: {
    getUser: async () => ({ data: { user: demoUser }, error: null }),
    getSession: async () => ({ data: { session: { access_token: 'demo', user: demoUser } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() { /* nothing to stop */ } } } }),
    signOut: async () => ({ error: null }),
  },
  storage: { from: () => okStorage },
  channel: () => ({ on() { return this }, subscribe() { return this }, unsubscribe() { /* none */ } }),
  removeChannel: () => {},
}

/** The demo's database. Same surface the portal uses on the real one. */
export function demoClient() { return client }
