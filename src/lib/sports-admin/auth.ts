// Who may use the sports admin area.
//
// The password lives ONLY in the server's environment (SPORTS_ADMIN_TOKEN).
// There is no fallback: if it is not set, nobody gets in. It used to fall back
// to a password written in the source, and the admin page carried that same
// password in the code every browser downloads.

import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

export function sportsAdminOk(token: string | null | undefined): boolean {
  const real = process.env.SPORTS_ADMIN_TOKEN
  if (!real || real.length < 12 || !token) return false
  const a = Buffer.from(token), b = Buffer.from(real)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function sportsAdminDenied() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
