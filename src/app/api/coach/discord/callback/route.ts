import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sessionCoachId, serviceClient, publicOrigin } from '@/lib/coach/oauth'
import { exchangeInviteCode } from '@/lib/coach/discord'
import { safeReturnPath } from '../../oauth/safe-return'

export const runtime = 'nodejs'

// Discord sends the coach back here after they add the bot to a server.
//
// This is where a server becomes theirs. The state cookie proves the round trip
// started in their own session; the code, exchanged server-to-server, proves
// which server Discord actually added the bot to. Only then is the server
// recorded against the coach — and from then on only they see it in Lumio.
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req.nextUrl.origin)
  const store = await cookies()
  const saved = store.get('lumio_discord_state')?.value
  // A path on this site only — the cookie is copied from the address bar.
  const ret = safeReturnPath(store.get('lumio_discord_return')?.value)
  const back = (status: string) => {
    const sep = ret.includes('?') ? '&' : '?'
    const res = NextResponse.redirect(new URL(`${ret}${sep}discord=${status}`, origin))
    res.cookies.delete('lumio_discord_state')
    res.cookies.delete('lumio_discord_return')
    return res
  }

  if (req.nextUrl.searchParams.get('error')) return back('cancelled')
  const coachId = await sessionCoachId()
  if (!coachId) return back('signin')
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  if (!code || !state || !saved || state !== saved) return back('state')

  const guild = await exchangeInviteCode(code, `${origin}/api/coach/discord/callback`)
  if (!guild) return back('exchange')

  const db = serviceClient()
  const { data: owner } = await db.from('coach_discord_guilds').select('coach_id').eq('guild_id', guild.id).maybeSingle()
  // Somebody else already runs this server through Lumio. Two academies in one
  // server is possible but it is a decision for a person, not a side effect of
  // clicking an invite link.
  if (owner && (owner as { coach_id: string }).coach_id !== coachId) return back('taken')

  const { error } = await db.from('coach_discord_guilds').upsert(
    { coach_id: coachId, guild_id: guild.id, guild_name: guild.name },
    { onConflict: 'guild_id' },
  )
  return back(error ? 'store_error' : 'added')
}
