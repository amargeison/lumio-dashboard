import { createClient } from '@supabase/supabase-js'

// ─── SSO Integration point ──────────────────────────────────────────────────
// When Google Workspace or Microsoft 365 SSO is connected,
// call propagateAllStaff(businessId, syncedUsers)
// from src/app/api/workspace/sync-sso/route.ts
// The propagation logic is identical regardless of source.
// ─────────────────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export interface StaffMember {
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  phone?: string
  start_date?: string
}

export function generateEmployeeId(index: number): string {
  return 'LUM-' + String(index + 1).padStart(3, '0')
}

export async function propagateStaffMember(
  businessId: string,
  staff: StaffMember,
  employeeId: string,
): Promise<void> {
  const supabase = getSupabase()
  const fullName = [staff.first_name, staff.last_name].filter(Boolean).join(' ')

  // 1. Payroll record
  await supabase.from('workspace_payroll').upsert({
    business_id: businessId,
    employee_id: employeeId,
    first_name: staff.first_name,
    last_name: staff.last_name,
    email: staff.email,
    job_title: staff.job_title,
    department: staff.department,
    salary: null,
    pay_frequency: 'monthly',
    bank_details_pending: true,
    start_date: staff.start_date || null,
    status: 'active',
  }, { onConflict: 'business_id,email', ignoreDuplicates: true })

  // 2. IT asset record
  await supabase.from('workspace_it_assets').upsert({
    business_id: businessId,
    employee_id: employeeId,
    first_name: staff.first_name,
    last_name: staff.last_name,
    email: staff.email,
    department: staff.department,
    laptop_assigned: false,
    phone_assigned: false,
    system_access: [],
    it_onboarding_complete: false,
  }, { onConflict: 'business_id,email', ignoreDuplicates: true })

  // 3. Employee checklist record
  await supabase.from('workspace_employee_checklist').upsert({
    business_id: businessId,
    employee_id: employeeId,
    employee_name: fullName,
    email: staff.email,
    department: staff.department,
    hr_contract_sent: false,
    hr_handbook_sent: false,
    hr_induction_booked: false,
    accounts_bank_details: false,
    accounts_payroll_set_up: false,
    it_laptop_assigned: false,
    it_accounts_created: false,
    it_access_granted: false,
    it_equipment_delivered: false,
    completed: false,
  }, { onConflict: 'business_id,email', ignoreDuplicates: true })
}

export async function propagateAllStaff(
  businessId: string,
  staffList: StaffMember[],
): Promise<void> {
  for (let i = 0; i < staffList.length; i++) {
    const staff = staffList[i]
    if (!staff.email) continue
    const employeeId = generateEmployeeId(i)
    await propagateStaffMember(businessId, staff, employeeId)
  }
}
