import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase.from('business_sessions').select('business_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', session.business_id).eq('provider', 'asana').maybeSingle()
  if (!creds?.access_token) return NextResponse.json({ error: 'Asana not connected', connected: false }, { status: 404 })

  const headers = { Accept: 'application/json', Authorization: `Bearer ${creds.access_token}` }
  const baseUrl = 'https://app.asana.com/api/1.0'

  try {
    const today = new Date().toISOString().split('T')[0]

    const [tasksRes, projectsRes] = await Promise.all([
      fetch(`${baseUrl}/tasks?assignee=me&workspace=&opt_fields=due_on,completed&completed_since=now&limit=100`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`${baseUrl}/projects?opt_fields=name,archived&limit=100`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
    ])

    const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : []
    const projects = Array.isArray(projectsRes.data) ? projectsRes.data : []

    const openTasks = tasks.filter((t: any) => !t.completed)
    const overdueTasks = openTasks.filter((t: any) => t.due_on && t.due_on < today)
    const dueToday = openTasks.filter((t: any) => t.due_on === today)
    const activeProjects = projects.filter((p: any) => !p.archived)

    return NextResponse.json({
      connected: true, provider: 'asana',
      open_tasks: openTasks.length,
      overdue_tasks: overdueTasks.length,
      active_projects: activeProjects.length,
      due_today: dueToday.length,
    })
  } catch (err) {
    console.error('[asana/snapshot]', err)
    return NextResponse.json({ error: 'Failed to fetch Asana data', connected: true }, { status: 502 })
  }
}
