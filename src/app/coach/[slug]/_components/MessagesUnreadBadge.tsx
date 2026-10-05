'use client'

// How many messages are waiting to be read, beside "Messages" in the menu.
//
// A reply from a parent used to change nothing a coach could see: no dot in
// the list, no number in the menu. Somebody had to open Messages and read down
// it to find out. This counts messages that came IN and have not been opened.
// It reads the same shared rows the Messages page does, so it drops the moment
// a conversation is opened, and it looks again every two minutes for replies
// that arrive while the coach is on another page.

import { useEffect } from 'react'
import type { AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'

export function MessagesUnreadBadge({ accent, expanded, btnText }: { accent: AccentTokens; expanded: boolean; btnText: string }) {
  const { rows, reload } = useCoachTable<{ direction?: string | null; read?: boolean | null }>('coach_messages')
  useEffect(() => {
    const id = setInterval(() => { void reload() }, 120000)
    return () => clearInterval(id)
  }, [reload])
  const n = rows.filter(m => m.direction === 'in' && !m.read).length
  if (!n) return null
  const label = `${n} unread message${n === 1 ? '' : 's'}`
  // Menu closed to its icons: a dot. Open: the number.
  return expanded
    ? <span aria-label={label} title={label} style={{ fontSize: 9.5, fontWeight: 700, color: btnText, background: accent.hex, padding: '1px 6px', borderRadius: 999, minWidth: 16, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{n > 99 ? '99+' : n}</span>
    : <span aria-label={label} title={label} style={{ width: 7, height: 7, borderRadius: '50%', background: accent.hex, marginLeft: -8, marginTop: -11, flexShrink: 0 }} />
}
