import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const REDIRECT_URI = 'https://lumiocms.com/api/auth/callback/microsoft-sso'

// ─── Department matching ─────────────────────────────────────────────────────

const LUMIO_DEPARTMENTS: { slug: string; label: string; patterns: RegExp }[] = [
  { slug: 'hr',         label: 'HR & People',       patterns: /\b(hr|human resources|people|talent|recruitment)\b/i },
  { slug: 'sales',      label: 'Sales',             patterns: /\b(sales|business development|revenue)\b/i },
  { slug: 'marketing',  label: 'Marketing',         patterns: /\b(marketing|brand|communications|comms|content|digital)\b/i },
  { slug: 'accounts',   label: 'Finance',           patterns: /\b(finance|accounts|accounting|payroll|treasury)\b/i },
  { slug: 'operations', label: 'Operations',        patterns: /\b(operations|ops|logistics|supply chain|procurement)\b/i },
  { slug: 'it',         label: 'IT & Systems',      patterns: /\b(it|technology|tech|engineering|development|devops|infrastructure|systems)\b/i },
  { slug: 'legal',      label: 'Legal',             patterns: /\b(legal|compliance|governance|regulatory)\b/i },
  { slug: 'projects',   label: 'Projects',          patterns: /\b(project|pmo|delivery)\b/i },
  { slug: 'success',    label: 'Customer Success',  patterns: /\b(success|customer success|csm|account management)\b/i },
  { slug: 'support',    label: 'Support',           patterns: /\b(support|helpdesk|service desk|customer service)\b/i },
  { slug: 'workflows',  label: 'Workflows',         patterns: /\b(workflow|automation|process)\b/i },
  { slug: 'partners',   label: 'Partners',          patterns: /\b(partner|partnerships|alliances|channel)\b/i },
  { slug: 'strategy',   label: 'Strategy',          patterns: /\b(strategy|executive|leadership|c-suite|board)\b/i },
]

function matchDepartment(msDepartment?: string, msJobTitle?: string): { slug: string; label: string } | null {
  const text = [msDepartment, msJobTitle].filter(Boolean).join(' ')
  if (!text) return null
  for (const dept of LUMIO_DEPARTMENTS) {
    if (dept.patterns.test(text)) return { slug: dept.slug, label: dept.label }
  }
  return null
}

/**
 * GET /api/auth/callback/microsoft-sso
 * Handles Microsoft SSO login for the business portal.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  let redirectTo = '/'
  try {
    const parsed = JSON.parse(stateRaw || '{}')
    redirectTo = parsed.redirectTo || '/'
  } catch { /* ignore */ }

  if (error) {
    console.error('[microsoft-sso] OAuth error:', error, errorDesc)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDesc || error)}`, req.nextUrl.origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No+authorization+code+received', req.nextUrl.origin))
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[microsoft-sso] Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET')
    return NextResponse.redirect(new URL('/login?error=SSO+not+configured', req.nextUrl.origin))
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('[microsoft-sso] Token exchange failed:', tokenRes.status, errBody)
      return NextResponse.redirect(new URL('/login?error=Microsoft+sign-in+failed', req.nextUrl.origin))
    }

    const tokens = await tokenRes.json()
    const { access_token } = tokens

    // Get user profile with jobTitle and department
    const profileRes = await fetch(
      'https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle,department',
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    if (!profileRes.ok) {
      console.error('[microsoft-sso] Failed to get Microsoft profile:', profileRes.status)
      return NextResponse.redirect(new URL('/login?error=Failed+to+get+Microsoft+profile', req.nextUrl.origin))
    }

    const profile = await profileRes.json()
    const email = (profile.mail || profile.userPrincipalName || '').toLowerCase().trim()
    const msJobTitle = profile.jobTitle || null
    const msDepartment = profile.department || null

    if (!email) {
      console.error('[microsoft-sso] No email in Microsoft profile:', profile)
      return NextResponse.redirect(new URL('/login?error=No+email+found+in+Microsoft+account', req.nextUrl.origin))
    }

    console.log('[microsoft-sso] Microsoft profile:', { email, name: profile.displayName, jobTitle: msJobTitle, department: msDepartment })

    const supabase = getSupabase()

    // Look up business by owner_email OR as a team member in workspace_staff
    let business = null as { id: string; slug: string; company_name: string; owner_name: string; owner_email: string; logo_url: string | null; status: string; plan: string } | null

    // Try owner first
    const { data: ownerBiz } = await supabase
      .from('businesses')
      .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan')
      .eq('owner_email', email)
      .eq('status', 'active')
      .maybeSingle()

    if (ownerBiz) {
      business = ownerBiz
    } else {
      // Try as team member — look up in workspace_staff
      const { data: staffMatch } = await supabase
        .from('workspace_staff')
        .select('business_id')
        .eq('email', email)
        .limit(1)
        .maybeSingle()

      if (staffMatch) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan')
          .eq('id', staffMatch.business_id)
          .eq('status', 'active')
          .maybeSingle()
        if (biz) business = biz
      }
    }

    if (!business) {
      console.log('[microsoft-sso] No business found for email:', email)
      return NextResponse.redirect(new URL(
        `/login?error=no_account&message=${encodeURIComponent('No Lumio account found for ' + email + '. Start a free trial or contact hello@lumiocms.com.')}`,
        req.nextUrl.origin,
      ))
    }

    // Department auto-matching
    const deptMatch = matchDepartment(msDepartment || undefined, msJobTitle || undefined)
    const departmentAssigned = !!deptMatch
    const assignedDept = deptMatch?.label || null
    const assignedSlug = deptMatch?.slug || null

    console.log('[microsoft-sso] Department match:', { msDepartment, msJobTitle, matched: assignedDept, pending: !departmentAssigned })

    // Upsert into workspace_staff with Microsoft profile data
    await supabase.from('workspace_staff').upsert({
      business_id: business.id,
      email,
      first_name: profile.displayName?.split(' ')[0] || null,
      last_name: profile.displayName?.split(' ').slice(1).join(' ') || null,
      job_title: msJobTitle,
      department: assignedDept || msDepartment || null,
      microsoft_job_title: msJobTitle,
      microsoft_department: msDepartment,
      sso_provider: 'microsoft',
    }, { onConflict: 'business_id,email' }).then(({ error: upsertErr }) => {
      if (upsertErr) console.error('[microsoft-sso] workspace_staff upsert error:', upsertErr)
    })

    // Create session token (30-day expiry)
    const sessionToken = crypto.randomUUID()
    const { error: sessionError } = await supabase.from('business_sessions').insert({
      token: sessionToken,
      business_id: business.id,
      email,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (sessionError) {
      console.error('[microsoft-sso] Failed to create session:', sessionError)
      return NextResponse.redirect(new URL('/login?error=Failed+to+create+session', req.nextUrl.origin))
    }

    console.log('[microsoft-sso] Session created for:', email, 'slug:', business.slug)

    // Redirect to portal with session data + department info
    const dest = redirectTo !== '/' ? redirectTo : `/${business.slug}`
    const url = new URL(dest, req.nextUrl.origin)
    url.searchParams.set('sso_session', sessionToken)
    url.searchParams.set('sso_slug', business.slug)
    url.searchParams.set('sso_company', business.company_name || '')
    url.searchParams.set('sso_name', business.owner_name || profile.displayName || '')
    url.searchParams.set('sso_email', email)
    if (business.logo_url) url.searchParams.set('sso_logo', business.logo_url)
    if (msJobTitle) url.searchParams.set('sso_job_title', msJobTitle)
    if (assignedDept) url.searchParams.set('sso_department', assignedDept)
    if (assignedSlug) url.searchParams.set('sso_dept_slug', assignedSlug)
    if (!departmentAssigned) url.searchParams.set('sso_dept_pending', 'true')
    url.searchParams.set('sso_first_login', 'true')

    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[microsoft-sso] Unhandled error:', err)
    return NextResponse.redirect(new URL(
      `/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'Something went wrong')}`,
      req.nextUrl.origin,
    ))
  }
}
