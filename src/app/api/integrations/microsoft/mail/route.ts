import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function getBusinessId(token: string) {
  const { data } = await getSupabase()
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data?.business_id || null
}

/**
 * GET /api/integrations/microsoft/mail
 * Fetches latest emails from Microsoft Graph using stored OAuth tokens.
 */
export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const supabase = getSupabase()

  // Look up Outlook token
  const { data: tokenRow } = await supabase
    .from('integration_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('business_id', businessId)
    .in('provider', ['microsoft_outlook', 'outlook'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!tokenRow?.access_token) {
    return NextResponse.json({ error: 'Outlook not connected', code: 'NOT_CONNECTED' }, { status: 404 })
  }

  try {
    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,webLink&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${tokenRow.access_token}` } },
    )

    if (graphRes.status === 401) {
      await supabase
        .from('integration_tokens')
        .update({ expires_at: new Date(0).toISOString() })
        .eq('business_id', businessId)
        .in('provider', ['microsoft_outlook', 'outlook'])
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    if (!graphRes.ok) {
      const errBody = await graphRes.text()
      console.error('[microsoft/mail] Graph API error:', graphRes.status, errBody)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 502 })
    }

    const data = await graphRes.json()
    const emails = (data.value || []).map((msg: Record<string, unknown>) => {
      const from = msg.from as { emailAddress?: { name?: string; address?: string } } | undefined
      return {
        id: msg.id,
        subject: msg.subject || '(No subject)',
        senderName: from?.emailAddress?.name || from?.emailAddress?.address || 'Unknown',
        senderEmail: from?.emailAddress?.address || '',
        receivedAt: msg.receivedDateTime,
        isRead: msg.isRead || false,
        preview: msg.bodyPreview || '',
        webLink: msg.webLink || null,
      }
    })

    return NextResponse.json({ emails })
  } catch (err) {
    console.error('[microsoft/mail] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
