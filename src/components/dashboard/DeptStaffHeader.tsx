'use client'

import { type StaffMember, getStaffInitials, getStaffName, getStaffShortName } from '@/lib/staff/deptMatch'

const DEPT_COLORS: Record<string, string> = {
  sales: '#10B981', hr: '#3B82F6', marketing: '#EC4899', accounts: '#F59E0B',
  operations: '#F97316', it: '#06B6D4', support: '#EF4444', success: '#14B8A6',
  partners: '#8B5CF6', strategy: '#6366F1', trials: '#A855F7', crm: '#8B5CF6',
  projects: '#F59E0B',
}

export default function DeptStaffHeader({ staff, lead, dept }: {
  staff: StaffMember[]; lead: StaffMember | null; dept: string
}) {
  const color = DEPT_COLORS[dept.toLowerCase()] || '#6C3FC5'
  if (!lead) return null

  const leadName = getStaffName(lead)
  const leadInitials = getStaffInitials(lead)
  const empIds: Record<string, string> = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('lumio_staff_ids') || '{}') } catch { return {} } })() : {}
  const leadId = empIds[lead.email || ''] || ''

  return (
    <div className="rounded-xl overflow-hidden mb-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Lead avatar */}
        <div className="flex items-center justify-center rounded-full text-lg font-black shrink-0" style={{ width: 52, height: 52, backgroundColor: `${color}20`, color, border: `2px solid ${color}50` }}>
          {leadInitials}
        </div>
        {/* Lead info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{leadName}</p>
          <p className="text-xs" style={{ color }}>{lead.job_title || 'Team Member'} &middot; {lead.department || dept}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: '#4B5563' }}>
            {leadId && <span>{leadId}</span>}
            {lead.email && <span>{lead.email}</span>}
          </div>
        </div>
      </div>
      {/* Team strip */}
      {staff.length > 1 && (
        <div className="flex items-center gap-2 px-5 py-2.5" style={{ borderTop: '1px solid #1F2937' }}>
          <span className="text-[11px] shrink-0" style={{ color: '#6B7280' }}>Department team:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {staff.map((s, i) => (
              <div key={s.email || i} className="flex items-center justify-center rounded-full text-[8px] font-bold" style={{ width: 24, height: 24, backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }} title={getStaffName(s)}>
                {getStaffInitials(s)}
              </div>
            ))}
            <span className="text-[11px] ml-1" style={{ color: '#6B7280' }}>
              {staff.map(s => getStaffShortName(s)).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
