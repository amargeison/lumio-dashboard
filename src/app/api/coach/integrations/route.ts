import { NextRequest, NextResponse } from 'next/server'
import { listConnections, deleteConnection, providerConfigured, sessionCoachId, type Provider } from '@/lib/coach/oauth'

// GET  → the coach's connected accounts (safe fields only) + which OAuth
//        providers are configured in this environment (so the UI can enable
//        or grey out the Connect buttons).
// DELETE?provider=google → disconnect that account.
export async function GET() {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const connections = await listConnections(coachId)
  return NextResponse.json({
    connections,
    configured: {
      google: providerConfigured('google'),
      microsoft: providerConfigured('microsoft'),
      icloud: true, // iCloud needs no app credentials — just the coach's app password
    },
  })
}

export async function DELETE(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const provider = req.nextUrl.searchParams.get('provider') as Provider | null
  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })
  const { error } = await deleteConnection(coachId, provider)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
