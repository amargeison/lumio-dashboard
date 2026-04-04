'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface StaffMember {
  id: string
  first_name: string
  last_name: string
  job_title: string
  department: string
  email: string | null
  phone: string | null
  start_date: string | null
  status: string
  manager?: string
}

export interface DepartmentGroup {
  department: string
  manager: StaffMember | null
  members: StaffMember[]
}

function isManager(role: string): boolean {
  return /manager|head|director|vp|chief|lead|ceo|cto|cfo|coo|md/i.test(role)
}

export function useStaffData(workspaceId?: string) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const refresh = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    try {
      const { data, error: err } = await supabase
        .from('business_employees')
        .select('*')
        .eq('business_id', workspaceId)
        .order('department', { ascending: true })
        .order('last_name', { ascending: true })

      if (err) throw err
      setStaff((data || []) as StaffMember[])
    } catch (e: any) {
      setError(e?.message || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, supabase])

  useEffect(() => { refresh() }, [refresh])

  // Listen for staff-updated events
  useEffect(() => {
    function onUpdate() { refresh() }
    window.addEventListener('staff-updated', onUpdate)
    return () => window.removeEventListener('staff-updated', onUpdate)
  }, [refresh])

  // Derived data
  const departments = Array.from(new Set(staff.map(s => s.department).filter(Boolean)))

  const byDepartment: DepartmentGroup[] = departments.map(dept => {
    const members = staff.filter(s => s.department === dept)
    const manager = members.find(m => isManager(m.job_title)) || null
    return { department: dept, manager, members }
  })

  const recentStarters = staff.filter(s => {
    if (!s.start_date) return false
    const start = new Date(s.start_date)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return start >= thirtyDaysAgo
  })

  const orgTree = buildOrgTree(staff)

  return {
    staff,
    loading,
    error,
    refresh,
    departments,
    byDepartment,
    recentStarters,
    orgTree,
    count: staff.length,
  }
}

// Build org chart tree from staff data
interface OrgNode {
  member: StaffMember
  children: OrgNode[]
}

function buildOrgTree(staff: StaffMember[]): OrgNode[] {
  // Find CEO/MD/top-level
  const topLevel = staff.filter(s => /ceo|md|managing director|founder|owner/i.test(s.job_title))
  const directors = staff.filter(s => /director|vp|chief|head/i.test(s.job_title) && !topLevel.includes(s))
  const managers = staff.filter(s => /manager|lead|supervisor/i.test(s.job_title) && !topLevel.includes(s) && !directors.includes(s))
  const individual = staff.filter(s => !topLevel.includes(s) && !directors.includes(s) && !managers.includes(s))

  function buildNode(member: StaffMember): OrgNode {
    // Find direct reports — same department, lower level
    const reports = [...directors, ...managers, ...individual].filter(s =>
      s.department === member.department && s.id !== member.id
    )
    return { member, children: reports.map(r => ({ member: r, children: [] })) }
  }

  if (topLevel.length > 0) {
    return topLevel.map(ceo => ({
      member: ceo,
      children: directors.map(d => buildNode(d)),
    }))
  }

  // No CEO found — group by department heads
  return directors.map(d => buildNode(d))
}

// Dispatch staff update event (call after upload)
export function dispatchStaffUpdate(count: number) {
  window.dispatchEvent(new CustomEvent('staff-updated', { detail: { count } }))
}
