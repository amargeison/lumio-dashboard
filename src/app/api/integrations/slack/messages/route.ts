import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

/**
 * GET /api/integrations/slack/messages
 * Fetches recent messages from Slack channels using stored OAuth token.
 */
export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['slack', 'microsoft_slack'])
  if (!tokenData) {
    return NextResponse.json({ error: 'Slack not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })
  }

  const { access_token } = tokenData
  const providers = ['slack', 'microsoft_slack']

  try {
    // Get list of channels the bot is in
    const channelsRes = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=10',
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    if (channelsRes.status === 401) {
      await flagTokenExpired(businessId, providers)
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    const channelsData = await channelsRes.json()
    if (!channelsData.ok) {
      if (channelsData.error === 'token_revoked' || channelsData.error === 'invalid_auth') {
        await flagTokenExpired(businessId, providers)
        return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
      }
      console.error('[slack/messages] Channels error:', channelsData.error)
      return NextResponse.json({ error: 'Failed to fetch Slack channels' }, { status: 502 })
    }

    // Get authenticated user's ID to filter out their own messages
    let authUserId = ''
    try {
      const authRes = await fetch('https://slack.com/api/auth.test', { headers: { Authorization: `Bearer ${access_token}` } })
      const authData = await authRes.json()
      if (authData.ok) authUserId = authData.user_id || ''
    } catch { /* ignore */ }

    const channels: { id: string; name: string; num_members: number }[] = channelsData.channels || []

    // Fetch recent messages from top 5 channels (most members first)
    const sortedChannels = channels.sort((a, b) => (b.num_members || 0) - (a.num_members || 0)).slice(0, 5)
    const oneDayAgo = String(Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000))

    const allMessages: { id: string; channel: string; sender: string; text: string; timestamp: string; unread: boolean }[] = []

    await Promise.all(
      sortedChannels.map(async (ch) => {
        try {
          const histRes = await fetch(
            `https://slack.com/api/conversations.history?channel=${ch.id}&limit=5&oldest=${oneDayAgo}`,
            { headers: { Authorization: `Bearer ${access_token}` } },
          )
          const histData = await histRes.json()
          if (!histData.ok) return

          for (const msg of (histData.messages || []).slice(0, 5)) {
            if (msg.subtype && msg.subtype !== 'bot_message') continue // skip system messages
            allMessages.push({
              id: msg.ts,
              channel: `#${ch.name}`,
              sender: msg.user || msg.username || 'Bot',
              text: (msg.text || '').slice(0, 200),
              timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
              unread: true, // Slack doesn't give per-message read status easily
            })
          }
        } catch { /* skip channel */ }
      }),
    )

    // Sort by timestamp descending, take top 10
    allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ messages: allMessages.slice(0, 10) })
  } catch (err) {
    console.error('[slack/messages] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
