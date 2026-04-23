// ─── Live Notification System ────────────────────────────────────────────────
// Fetches real notifications from connected integrations (Calendar, Gmail)
// and business data (Supabase). Falls back gracefully if integrations unavailable.

export type NotificationItem = {
  id: string
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  body: string
  time: string
  dept: string
  deptLabel: string | null
  deptRoute: string | null
  roles: string[]
  category: string
  source: 'live' | 'demo' | 'supabase'
  actionUrl?: string
}

export async function fetchLiveNotifications(
  userRole: string,
  slug: string,
  hasCalendar: boolean,
  hasGmail: boolean
): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = []
  const today = new Date().toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  try {
    // ── MCP-based notifications (Calendar + Gmail) ────────────────────────
    const mcpServers: Array<{ type: string; url: string; name: string }> = []
    if (hasCalendar) mcpServers.push({ type: 'url', url: 'https://gcal.mcp.claude.com/mcp', name: 'gcal' })
    if (hasGmail) mcpServers.push({ type: 'url', url: 'https://gmail.mcp.claude.com/mcp', name: 'gmail' })

    if (mcpServers.length > 0) {
      const response = await fetch('/api/ai/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          mcp_servers: mcpServers,
          messages: [{
            role: 'user',
            content: `You are a notification system for a business dashboard. Role: ${userRole}.

${hasCalendar ? `1. Use gcal_list_events to get calendar events from ${today}T00:00:00 to ${weekEnd}T23:59:59 Europe/London timezone.` : ''}
${hasGmail ? `2. Use gmail_search_messages with query "is:unread" to get unread emails (max 10). Also search "is:draft newer_than:3d" for recent unsent drafts.` : ''}

Return ONLY a valid JSON array of notifications. Each item:
{
  "id": "live-[unique]",
  "type": "calendar|email|draft|alert",
  "priority": "high|medium|low",
  "icon": "emoji",
  "title": "short title max 60 chars",
  "body": "one line description max 100 chars",
  "time": "human readable e.g. Today 14:00 or Tomorrow or 2hrs ago",
  "dept": "all",
  "deptLabel": null,
  "deptRoute": null,
  "roles": ["admin","director","manager","standard"],
  "category": "meetings|messages|tasks",
  "source": "live"
}

Rules:
- Calendar events: priority "high" if within 2hrs, "medium" if today/tomorrow, "low" if later this week
- Unread emails: priority "high" if marked important, "medium" otherwise
- Old drafts (3+ days unsent): priority "medium" with title "Unsent draft: [subject]"
- Max 15 notifications total
- Sort by priority then time
- Return ONLY the JSON array, no other text`
          }]
        })
      })

      const data = await response.json()
      const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '[]'
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const liveNotifs: NotificationItem[] = JSON.parse(match[0])
          notifications.push(...liveNotifs.map(n => ({ ...n, source: 'live' as const })))
        } catch { /* invalid JSON — skip */ }
      }
    }

    // ── Supabase-based business notifications ─────────────────────────────
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Resolve workspace slug → business_id for business-scoped queries
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        const businessId = business?.id

        if (['admin', 'director'].includes(userRole)) {
          if (businessId) {
            // Overdue invoices
            const { data: invoices } = await supabase
              .from('business_invoices')
              .select('id, amount, company, due_date')
              .eq('business_id', businessId)
              .eq('status', 'overdue')
              .limit(5)

            if (invoices && invoices.length > 0) {
              const total = invoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
              notifications.push({
                id: 'live-invoices-overdue',
                priority: 'high',
                icon: '💰',
                title: `${invoices.length} invoice${invoices.length > 1 ? 's' : ''} overdue`,
                body: `£${total.toLocaleString()} outstanding — action needed`,
                time: 'Overdue',
                dept: 'accounts',
                deptLabel: 'Accounts',
                deptRoute: '/accounts',
                roles: ['admin', 'director'],
                category: 'finance',
                source: 'supabase',
              })
            }

            // At-risk CRM contacts
            const { data: atRisk } = await supabase
              .from('crm_contacts')
              .select('id, name, aria_score')
              .eq('tenant_id', businessId)
              .lt('aria_score', 40)
              .limit(10)

            if (atRisk && atRisk.length > 0) {
              notifications.push({
                id: 'live-customers-atrisk',
                priority: 'high',
                icon: '🔴',
                title: `${atRisk.length} contacts in critical health`,
                body: `${atRisk[0]?.name || 'Multiple accounts'} and others need attention`,
                time: 'Action needed',
                dept: 'success',
                deptLabel: 'Customer Success',
                deptRoute: '/success',
                roles: ['admin', 'director', 'manager'],
                category: 'customers',
                source: 'supabase',
              })
            }
          }

          // Expiring trials
          const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          const { data: expiringTrials } = await supabase
            .from('demo_tenants')
            .select('id, company_name, expires_at')
            .eq('status', 'active')
            .lt('expires_at', threeDaysFromNow)
            .limit(5)

          if (expiringTrials && expiringTrials.length > 0) {
            notifications.push({
              id: 'live-trials-expiring',
              priority: 'high',
              icon: '⏰',
              title: `${expiringTrials.length} trial${expiringTrials.length > 1 ? 's' : ''} expiring soon`,
              body: `${expiringTrials[0]?.company_name || 'Multiple trials'} expiring within 3 days`,
              time: 'Urgent',
              dept: 'trials',
              deptLabel: 'Trials',
              deptRoute: '/trials',
              roles: ['admin', 'director', 'manager'],
              category: 'trials',
              source: 'supabase',
            })
          }
        }

        // Unassigned tasks (visible to manager+)
        if (businessId) {
          const { data: openTasks } = await supabase
            .from('business_tasks')
            .select('id, title, created_at, priority')
            .eq('business_id', businessId)
            .eq('done', false)
            .is('assignee', null)
            .limit(10)

          if (openTasks && openTasks.length > 0) {
            notifications.push({
              id: 'live-tickets-unassigned',
              priority: openTasks.length > 3 ? 'high' : 'medium',
              icon: '🎫',
              title: `${openTasks.length} task${openTasks.length > 1 ? 's' : ''} unassigned`,
              body: `Oldest: ${openTasks[0]?.title || 'Unassigned task'} — needs attention`,
              time: 'Now',
              dept: 'support',
              deptLabel: 'Support',
              deptRoute: '/support',
              roles: ['admin', 'director', 'manager'],
              category: 'support',
              source: 'supabase',
            })
          }
        }
      }
    } catch (e) {
      console.error('Supabase notification fetch failed:', e)
    }
  } catch (e) {
    console.error('Live notification fetch failed:', e)
  }

  // Filter by role and sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return notifications
    .filter(n => n.roles.includes(userRole))
    .sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1))
}
