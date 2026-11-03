'use client'

// The portal's own "are you sure?" and "just so you know" boxes, in place of the
// browser's confirm() and alert().
//
// The browser's boxes stop the whole tab until they are answered. Chrome froze
// on one ("Move up to …" on Adult levels), and inside the iPhone app's web view
// they are not shown at all — confirm() quietly answers "no", so the button
// looked broken. These are drawn by the page, in the coach's colours, and never
// block anything else.
//
//   if (!(await askConfirm(`Delete ${name}?`))) return
//   await tell('Please allow pop-ups to print the pack.')
//
// The box mounts itself the first time it is needed, so no page has to remember
// to add it. Several questions asked at once are shown one after another.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { useCoachSettings } from './use-settings'
import { coachTheme, accentText, readableOn } from './theme'

type Ask = {
  kind: 'confirm' | 'tell'
  message: string
  yes: string
  no: string
  danger: boolean
  done: (ok: boolean) => void
}

export type AskOptions = {
  /** Words on the button that goes ahead. Defaults to "OK". */
  yes?: string
  /** Words on the button that backs out. Defaults to "Cancel". */
  no?: string
  /** Draws the go-ahead button in red, for deleting and taking money back. */
  danger?: boolean
}

let queue: Ask[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
let mounted = false

function mount() {
  if (mounted || typeof document === 'undefined') return
  mounted = true
  const el = document.createElement('div')
  el.setAttribute('data-coach-ask', '')
  document.body.appendChild(el)
  createRoot(el).render(<AskHost />)
}

function push(a: Omit<Ask, 'done'>): Promise<boolean> {
  // Without a page there is nobody to ask; going ahead silently would be worse.
  if (typeof document === 'undefined') return Promise.resolve(false)
  mount()
  // A quick double-click can ask before the first box is on screen. The same
  // question twice gets one box; the second asker is told no, so the action
  // cannot run twice.
  if (queue.some(q => q.kind === a.kind && q.message === a.message)) return Promise.resolve(a.kind === 'tell')
  return new Promise(resolve => {
    queue = [...queue, { ...a, done: resolve }]
    emit()
  })
}

/** Asks a yes/no question. Resolves true only if the coach chose to go ahead. */
export function askConfirm(message: string, opts: AskOptions = {}): Promise<boolean> {
  const danger = opts.danger ?? /^(delete|remove|discard|clear|reset|void|take .* off file)\b/i.test(message.trim())
  return push({ kind: 'confirm', message, yes: opts.yes ?? 'OK', no: opts.no ?? 'Cancel', danger })
}

/** Shows a message with a single OK. Resolves once it has been closed. */
export function tell(message: string): Promise<void> {
  return push({ kind: 'tell', message, yes: 'OK', no: '', danger: false }).then(() => undefined)
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const current = () => queue[0] ?? null

function AskHost() {
  const ask = useSyncExternalStore(subscribe, current, () => null)
  const settings = useCoachSettings()
  const { T, accent } = coachTheme(settings.theme, settings.accentKey)
  const yesRef = useRef<HTMLButtonElement>(null)
  const [shown, setShown] = useState<Ask | null>(null)

  useEffect(() => { setShown(ask) }, [ask])
  useEffect(() => { if (shown) yesRef.current?.focus() }, [shown])

  const answer = (ok: boolean) => {
    const a = queue[0]
    if (!a) return
    queue = queue.slice(1)
    emit()
    a.done(ok)
  }

  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); answer(shown.kind === 'tell') }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [shown])

  if (!shown) return null
  const yesBg = shown.danger ? '#DC2626' : accent.hex
  return (
    <div role="presentation" onClick={e => { if (e.target === e.currentTarget) answer(shown.kind === 'tell') }}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role={shown.kind === 'confirm' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-describedby="coach-ask-message"
        style={{ width: '100%', maxWidth: 420, background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.4)', padding: '20px 20px 16px' }}>
        <div id="coach-ask-message" style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere', maxHeight: '60vh', overflowY: 'auto' }}>{shown.message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          {shown.kind === 'confirm' && (
            <button onClick={() => answer(false)}
              style={{ appearance: 'none', padding: '9px 16px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{shown.no}</button>
          )}
          <button ref={yesRef} onClick={() => answer(true)}
            style={{ appearance: 'none', padding: '9px 18px', borderRadius: 9, border: 0, background: yesBg, color: shown.danger ? '#FFFFFF' : readableOn(accent.hex), fontSize: 13, fontWeight: 700, cursor: 'pointer', outlineColor: accentText(accent) }}>{shown.yes}</button>
        </div>
      </div>
    </div>
  )
}
