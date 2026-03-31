'use client'

import React, { useState, useEffect } from 'react'
import { Users, Check, Clock, Laptop, Phone, Shield, X, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistItem {
  employee_id: string; employee_name: string; email: string; department: string
  hr_contract_sent: boolean; hr_handbook_sent: boolean; hr_induction_booked: boolean
  accounts_bank_details: boolean; accounts_payroll_set_up: boolean
  it_laptop_assigned: boolean; it_accounts_created: boolean; it_access_granted: boolean; it_equipment_delivered: boolean
  completed: boolean
}

interface PayrollItem {
  employee_id: string; first_name: string; last_name: string; email: string
  job_title: string; department: string; salary: number | null
  pay_frequency: string; bank_details_pending: boolean; status: string
}

interface ITAssetItem {
  employee_id: string; first_name: string; last_name: string; email: string
  department: string; laptop_assigned: boolean; laptop_model: string | null
  phone_assigned: boolean; phone_model: string | null
  system_access: string[]; it_onboarding_complete: boolean; notes: string | null
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color, backgroundColor: bg }}>{label}</span>
}

// ─── HR: Staff List ──────────────────────────────────────────────────────────

export function HRStaffList() {
  const [staff, setStaff] = useState<PayrollItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch('/api/workspace/payroll', { headers: { 'x-workspace-token': token } })
      .then(r => r.json())
      .then(d => setStaff(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 200 }} />
  if (!staff.length) return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-sm" style={{ color: '#6B7280' }}>No staff imported yet. Import via Settings &rarr; Data Import.</p>
    </div>
  )

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: '#0D9488' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Staff List</p>
          <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>{staff.length} members</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Name', 'Job Title', 'Department', 'Start Date', 'Employee ID', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.email} style={{ borderBottom: '1px solid #1F2937' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{[s.first_name, s.last_name].filter(Boolean).join(' ')}</td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.job_title || '—'}</td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.department || '—'}</td>
                <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.status === 'active' ? '—' : s.status}</td>
                <td className="px-4 py-3" style={{ color: '#6B7280' }}>{s.employee_id}</td>
                <td className="px-4 py-3"><Badge label={s.status === 'active' ? 'Active' : s.status} color={s.status === 'active' ? '#22C55E' : '#F59E0B'} bg={s.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── HR: New Starter Checklist ───────────────────────────────────────────────

const CHECKLIST_ITEMS: { field: string; label: string; group: string }[] = [
  { field: 'hr_contract_sent', label: 'Contract sent', group: 'HR' },
  { field: 'hr_handbook_sent', label: 'Handbook sent', group: 'HR' },
  { field: 'hr_induction_booked', label: 'Induction booked', group: 'HR' },
  { field: 'accounts_bank_details', label: 'Bank details received', group: 'Accounts' },
  { field: 'accounts_payroll_set_up', label: 'Payroll set up', group: 'Accounts' },
  { field: 'it_laptop_assigned', label: 'Laptop assigned', group: 'IT' },
  { field: 'it_accounts_created', label: 'Accounts created', group: 'IT' },
  { field: 'it_access_granted', label: 'Access granted', group: 'IT' },
  { field: 'it_equipment_delivered', label: 'Equipment delivered', group: 'IT' },
]

export function HRChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch('/api/workspace/checklist', { headers: { 'x-workspace-token': token } })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggleField(email: string, field: string, current: boolean) {
    const token = getToken()
    const next = !current
    setItems(prev => prev.map(i => i.email === email ? { ...i, [field]: next } : i))
    await fetch('/api/workspace/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
      body: JSON.stringify({ email, field, value: next }),
    }).catch(() => {})
  }

  if (loading) return <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 200 }} />
  if (!items.length) return null

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: '#0D9488' }} />
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Starter Checklist</p>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: '#1F2937' }}>
        {items.map(item => {
          const done = CHECKLIST_ITEMS.filter(c => (item as unknown as Record<string, unknown>)[c.field] === true).length
          const total = CHECKLIST_ITEMS.length
          const pct = Math.round((done / total) * 100)
          const isExpanded = expanded === item.email
          const allDone = done === total

          return (
            <div key={item.email}>
              <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(isExpanded ? null : item.email)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{item.employee_name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{item.department || '—'} &middot; {item.employee_id}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {allDone ? (
                    <Badge label="Complete" color="#22C55E" bg="rgba(34,197,94,0.1)" />
                  ) : (
                    <>
                      <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#0D9488' }} />
                      </div>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{done}/{total}</span>
                    </>
                  )}
                  {isExpanded ? <ChevronUp size={14} style={{ color: '#6B7280' }} /> : <ChevronDown size={14} style={{ color: '#6B7280' }} />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-5 pb-4 space-y-3">
                  {['HR', 'Accounts', 'IT'].map(group => (
                    <div key={group}>
                      <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>{group}</p>
                      <div className="space-y-1">
                        {CHECKLIST_ITEMS.filter(c => c.group === group).map(c => {
                          const checked = (item as unknown as Record<string, unknown>)[c.field] === true
                          return (
                            <button key={c.field} className="flex items-center gap-2 w-full text-left rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10' }}
                              onClick={() => toggleField(item.email, c.field, checked)}>
                              <div className="flex items-center justify-center rounded" style={{ width: 18, height: 18, backgroundColor: checked ? '#0D9488' : '#1F2937', border: checked ? 'none' : '1px solid #374151' }}>
                                {checked && <Check size={12} style={{ color: '#fff' }} />}
                              </div>
                              <span className="text-xs" style={{ color: checked ? '#9CA3AF' : '#F9FAFB', textDecoration: checked ? 'line-through' : 'none' }}>{c.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Accounts: Payroll ───────────────────────────────────────────────────────

export function AccountsPayroll() {
  const [items, setItems] = useState<PayrollItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editEmail, setEditEmail] = useState<string | null>(null)
  const [editSalary, setEditSalary] = useState('')
  const [editFreq, setEditFreq] = useState('monthly')
  const [editBank, setEditBank] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch('/api/workspace/payroll', { headers: { 'x-workspace-token': token } })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openEdit(item: PayrollItem) {
    setEditEmail(item.email)
    setEditSalary(item.salary != null ? String(item.salary) : '')
    setEditFreq(item.pay_frequency || 'monthly')
    setEditBank(item.bank_details_pending)
  }

  async function saveEdit() {
    if (!editEmail) return
    const token = getToken()
    await fetch('/api/workspace/payroll', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
      body: JSON.stringify({
        email: editEmail,
        salary: editSalary ? parseFloat(editSalary) : null,
        pay_frequency: editFreq,
        bank_details_pending: editBank,
      }),
    }).catch(() => {})
    setItems(prev => prev.map(i => i.email === editEmail ? { ...i, salary: editSalary ? parseFloat(editSalary) : null, pay_frequency: editFreq, bank_details_pending: editBank } : i))
    setEditEmail(null)
  }

  if (loading) return <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 200 }} />
  if (!items.length) return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-sm" style={{ color: '#6B7280' }}>No payroll data yet. Import staff to populate.</p>
    </div>
  )

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Payroll</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Department', 'Employee ID', 'Pay Frequency', 'Salary', 'Bank Details', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.email} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{[s.first_name, s.last_name].filter(Boolean).join(' ')}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.department || '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#6B7280' }}>{s.employee_id}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.pay_frequency}</td>
                  <td className="px-4 py-3" style={{ color: s.salary != null ? '#F9FAFB' : '#6B7280' }}>{s.salary != null ? `£${Number(s.salary).toLocaleString()}` : 'Not set'}</td>
                  <td className="px-4 py-3">{s.bank_details_pending ? <Badge label="Pending" color="#F59E0B" bg="rgba(245,158,11,0.1)" /> : <Badge label="Received" color="#22C55E" bg="rgba(34,197,94,0.1)" />}</td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: '#A78BFA' }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setEditEmail(null)}>
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Edit Payroll</h3>
              <button onClick={() => setEditEmail(null)} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Salary (£)</label>
                <input type="number" value={editSalary} onChange={e => setEditSalary(e.target.value)} placeholder="0" className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Pay Frequency</label>
                <select value={editFreq} onChange={e => setEditFreq(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                  <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="annually">Annually</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Bank details received</span>
                <button onClick={() => setEditBank(!editBank)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: !editBank ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: !editBank ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditEmail(null)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── IT: Team Assets ─────────────────────────────────────────────────────────

const SYSTEM_OPTIONS = ['Google Workspace', 'Microsoft 365', 'Slack', 'GitHub', 'Jira', 'Notion', 'HubSpot', 'Xero', 'Sage', 'Custom']

export function ITAssets() {
  const [items, setItems] = useState<ITAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editEmail, setEditEmail] = useState<string | null>(null)
  const [editState, setEditState] = useState({ laptop_assigned: false, laptop_model: '', phone_assigned: false, phone_model: '', system_access: [] as string[], it_onboarding_complete: false, notes: '' })

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch('/api/workspace/it-assets', { headers: { 'x-workspace-token': token } })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openEdit(item: ITAssetItem) {
    setEditEmail(item.email)
    setEditState({
      laptop_assigned: item.laptop_assigned, laptop_model: item.laptop_model || '',
      phone_assigned: item.phone_assigned, phone_model: item.phone_model || '',
      system_access: item.system_access || [], it_onboarding_complete: item.it_onboarding_complete,
      notes: item.notes || '',
    })
  }

  async function saveEdit() {
    if (!editEmail) return
    const token = getToken()
    await fetch('/api/workspace/it-assets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
      body: JSON.stringify({ email: editEmail, ...editState }),
    }).catch(() => {})
    setItems(prev => prev.map(i => i.email === editEmail ? { ...i, ...editState } : i))
    setEditEmail(null)
  }

  function toggleSystem(sys: string) {
    setEditState(prev => ({
      ...prev,
      system_access: prev.system_access.includes(sys) ? prev.system_access.filter(s => s !== sys) : [...prev.system_access, sys],
    }))
  }

  if (loading) return <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 200 }} />
  if (!items.length) return (
    <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-sm" style={{ color: '#6B7280' }}>No IT asset data yet. Import staff to populate.</p>
    </div>
  )

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Team Assets</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Dept', 'Employee ID', 'Laptop', 'Phone', 'IT Onboarding', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.email} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{[s.first_name, s.last_name].filter(Boolean).join(' ')}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{s.department || '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#6B7280' }}>{s.employee_id}</td>
                  <td className="px-4 py-3">{s.laptop_assigned ? <Badge label="Assigned" color="#22C55E" bg="rgba(34,197,94,0.1)" /> : <Badge label="Not assigned" color="#6B7280" bg="rgba(107,114,128,0.1)" />}</td>
                  <td className="px-4 py-3">{s.phone_assigned ? <Badge label="Assigned" color="#22C55E" bg="rgba(34,197,94,0.1)" /> : <Badge label="Not assigned" color="#6B7280" bg="rgba(107,114,128,0.1)" />}</td>
                  <td className="px-4 py-3">{s.it_onboarding_complete ? <Badge label="Complete" color="#22C55E" bg="rgba(34,197,94,0.1)" /> : <Badge label="Pending" color="#F59E0B" bg="rgba(245,158,11,0.1)" />}</td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: '#A78BFA' }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setEditEmail(null)}>
          <div className="rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Edit IT Assets</h3>
              <button onClick={() => setEditEmail(null)} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              {/* Laptop */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Laptop assigned</span>
                <button onClick={() => setEditState(p => ({ ...p, laptop_assigned: !p.laptop_assigned }))} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: editState.laptop_assigned ? '#0D9488' : '#374151', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: editState.laptop_assigned ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
              {editState.laptop_assigned && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Laptop model</label>
                  <input value={editState.laptop_model} onChange={e => setEditState(p => ({ ...p, laptop_model: e.target.value }))} placeholder="e.g. MacBook Pro 14" className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
                </div>
              )}
              {/* Phone */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Phone assigned</span>
                <button onClick={() => setEditState(p => ({ ...p, phone_assigned: !p.phone_assigned }))} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: editState.phone_assigned ? '#0D9488' : '#374151', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: editState.phone_assigned ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
              {editState.phone_assigned && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Phone model</label>
                  <input value={editState.phone_model} onChange={e => setEditState(p => ({ ...p, phone_model: e.target.value }))} placeholder="e.g. iPhone 15" className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
                </div>
              )}
              {/* System access */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: '#6B7280' }}>System access</label>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_OPTIONS.map(sys => {
                    const active = editState.system_access.includes(sys)
                    return (
                      <button key={sys} onClick={() => toggleSystem(sys)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{
                        backgroundColor: active ? 'rgba(13,148,136,0.15)' : '#0A0B10',
                        color: active ? '#0D9488' : '#6B7280',
                        border: active ? '1px solid rgba(13,148,136,0.3)' : '1px solid #1F2937',
                      }}>{sys}</button>
                    )
                  })}
                </div>
              </div>
              {/* IT onboarding */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>IT onboarding complete</span>
                <button onClick={() => setEditState(p => ({ ...p, it_onboarding_complete: !p.it_onboarding_complete }))} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: editState.it_onboarding_complete ? '#0D9488' : '#374151', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: editState.it_onboarding_complete ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
              {/* Notes */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Notes</label>
                <textarea value={editState.notes} onChange={e => setEditState(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none resize-vertical" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditEmail(null)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
