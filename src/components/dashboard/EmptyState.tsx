'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Database, X, CheckCircle, Link2, Plus } from 'lucide-react'
import { loadDemoData } from '@/lib/devUtils'
import { invalidateWorkspaceCache } from '@/hooks/useWorkspace'

export interface UploadButton {
  key: string
  label: string
  accept?: string
  icon?: React.ReactNode
}

interface EmptyStateProps {
  pageKey: string          // unique key e.g. 'crm', 'sales', 'hr'
  title: string
  description: string
  uploads: UploadButton[]
  accentColor?: string
}

const INTEGRATIONS = [
  { name: 'HubSpot', logo: '\u{1F7E0}', category: 'CRM' },
  { name: 'Salesforce', logo: '\u2601\uFE0F', category: 'CRM' },
  { name: 'Xero', logo: '\u{1F499}', category: 'Finance' },
  { name: 'QuickBooks', logo: '\u{1F7E2}', category: 'Finance' },
  { name: 'Slack', logo: '\u{1F49C}', category: 'Comms' },
  { name: 'Google Workspace', logo: '\u{1F535}', category: 'Productivity' },
  { name: 'Microsoft 365', logo: '\u{1F537}', category: 'Productivity' },
  { name: 'Zapier', logo: '\u26A1', category: 'Automation' },
  { name: 'Stripe', logo: '\u{1F4B3}', category: 'Payments' },
  { name: 'Pipedrive', logo: '\u{1F7E4}', category: 'CRM' },
]

const ALL_PAGES = [
  'overview','crm','sales','marketing','projects','hr','partners',
  'finance','insights','workflows','strategy','reports','settings',
  'inbox','calendar','analytics','accounts','support','success',
  'trials','operations','it',
]

export function DashboardEmptyState({
  pageKey, title, description, uploads, accentColor = '#6C3FC5'
}: EmptyStateProps) {
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [intModal, setIntModal] = useState(false)
  const [showDevButton, setShowDevButton] = useState(false)
  const [showClearDemo, setShowClearDemo] = useState(false)

  useEffect(() => {
    setShowDevButton(
      process.env.NODE_ENV === 'development' ||
      window.location.hostname.includes('vercel.app')
    )
    setShowClearDemo(localStorage.getItem('lumio_demo_active') === 'true')
  }, [])
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function storageKey() {
    return `lumio_dashboard_${pageKey}_hasData`
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [previewCols, setPreviewCols] = useState<string[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [importKey, setImportKey] = useState('')

  async function handleFile(key: string, file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      showToast('Please upload an Excel (.xlsx) or CSV file')
      return
    }

    showToast(`Parsing ${file.name}...`)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

      if (!rows.length) {
        showToast('Your file appears to be empty')
        return
      }

      const cols = Object.keys(rows[0])
      const hasName = cols.some(c => /name/i.test(c))
      if (!hasName) {
        showToast("We couldn't find a Name column — please check your file")
        return
      }

      setPreviewCols(cols.slice(0, 6))
      setPreviewRows(rows.slice(0, 5))
      setAllRows(rows)
      setImportKey(key)
    } catch {
      showToast('Failed to parse file — please check the format')
    }
  }

  async function confirmImport() {
    showToast(`Importing ${allRows.length} records...`)
    const cols = Object.keys(allRows[0])
    const nameCol = cols.find(c => /^name$/i.test(c)) || cols.find(c => /name/i.test(c)) || cols[0]
    const emailCol = cols.find(c => /email/i.test(c))
    const roleCol = cols.find(c => /role|title|position|job/i.test(c))
    const deptCol = cols.find(c => /dept|department/i.test(c))
    const phoneCol = cols.find(c => /phone|tel|mobile/i.test(c))
    const dateCol = cols.find(c => /start|date|joined/i.test(c))

    const mapped = allRows.map(r => ({
      name: r[nameCol] || '',
      email: emailCol ? r[emailCol] : undefined,
      role: roleCol ? r[roleCol] : undefined,
      department: deptCol ? r[deptCol] : undefined,
      phone: phoneCol ? r[phoneCol] : undefined,
      start_date: dateCol ? r[dateCol] : undefined,
    }))

    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/import/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
          body: JSON.stringify({ key: importKey, rows: mapped, columns: Object.keys(allRows[0]) }),
        })
      } catch { /* continue with localStorage fallback */ }
    }

    showToast(`✓ ${allRows.length} records imported successfully`)
    window.dispatchEvent(new CustomEvent('staff-updated', { detail: { count: allRows.length } }))
    setPreviewRows([])
    setAllRows([])
    await new Promise(r => setTimeout(r, 1000))
    localStorage.setItem(storageKey(), 'true')
    ALL_PAGES.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
    window.location.reload()
  }

  const TEMPLATES: Record<string, string> = {
    people: 'Name,Email,Role,Department,Phone,Start Date\nJohn Smith,john@company.com,Manager,Sales,07700 900001,2026-01-15',
    org: 'Name,Email,Role,Department,Manager\nJohn Smith,john@company.com,CEO,Executive,',
    pipeline: 'Company,Deal Value,Stage,Owner,Close Date\nAcme Corp,15000,Proposal,Sophie Williams,2026-04-30',
    accounts: 'Company Name,ARR,Contract Value,Contract End,Status\nAcme Corp,24000,24000,2026-12-31,Active',
    revenue: 'Month,Revenue,Target\n2026-01,34200,38000',
    campaigns: 'Campaign Name,Platform,Sent,Open Rate,Clicks,Status\nQ1 Launch,Email,2840,44%,312,Active',
    leads: 'Name,Company,Email,Source,Score,Status\nRachel Fox,Lakewood Academy,rachel@lakewood.com,Webinar,94,Hot',
    tickets: 'Ticket ID,Company,Issue,Priority,Status,Created\nTKT-001,Acme Corp,Login issue,P1,Open,2026-03-20',
    health: 'Company,ARR,Health Score,CSM,Last Contact,Risk\nAcme Corp,24000,82,Sophie Williams,2026-03-20,Low',
    contacts: 'Name,Company,Email,Phone,Role,Stage\nJohn Smith,Acme Corp,john@acme.com,07700 900001,CEO,Customer',
    processes: 'Process Name,Department,Owner,Status,Last Updated\nInvoice Approval,Finance,George Harrison,Active,2026-03-15',
    systems: 'System Name,Type,Owner,Status,Licence Expiry\nSlack,SaaS,IT,Active,2026-12-31',
    assets: 'Asset Name,Type,Assigned To,Status,Purchase Date\nMacBook Pro 14,Laptop,John Smith,Active,2025-06-15',
    projects: 'Project Name,Code,Status,Priority,Deadline,Budget\nNew Website,WEB,In Progress,High,2026-06-30,50000',
    tasks: 'Task,Project,Priority,Assignee,Points,Status\nDesign homepage,WEB,High,Sophie Williams,5,In Progress',
    partners: 'Partner Name,Type,Status,Contact,Revenue Share\nAcme Partners,Reseller,Active,John Smith,15%',
    deals: 'Partner,Deal,Value,Status,Close Date\nAcme Partners,Enterprise Deal,45000,Negotiation,2026-05-30',
    competitors: 'Competitor,Product,Strength,Weakness,Market Share\nHubSpot,CRM,Brand recognition,Expensive,28%',
    faq: 'Question,Answer,Category,Published\nHow do I reset my password?,Go to Settings > Security,Account,Yes',
    data: 'Name,Value,Category,Date\nMetric 1,100,Revenue,2026-03-01',
    metrics: 'Metric,Value,Target,Period\nMRR,28400,30000,2026-03',
    team: 'Name,Email,Role,Department,Phone,Start Date\nJohn Smith,john@company.com,Manager,Sales,07700 900001,2026-01-15',
    trials: 'Company,Contact,Email,Start Date,Status\nAcme Corp,John Smith,john@acme.com,2026-03-15,Active',
    onboarding: 'Company,Step,Status,Completed Date\nAcme Corp,Welcome Email,Complete,2026-03-15',
    renewals: 'Company,ARR,Renewal Date,Health,CSM\nAcme Corp,24000,2026-06-30,Green,Sophie Williams',
  }

  function downloadTemplate(key: string) {
    const csv = TEMPLATES[key] || `Column1,Column2,Column3\nSample,Data,Here`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumio-${key}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function clearDemoData() {
    setLoading(true)
    showToast('Clearing demo data...')

    // Call the API to delete Supabase records
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/onboarding/clear-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
        })
      } catch { /* continue with localStorage cleanup */ }
    }

    // Clear localStorage flags
    Object.keys(localStorage)
      .filter(k => (k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_') || k.startsWith('lumio_school_')) && k !== 'lumio_dashboard_overview_hasData')
      .forEach(k => localStorage.removeItem(k))
    localStorage.removeItem('lumio_staff_imported')
    localStorage.setItem('lumio_demo_active', 'false')

    invalidateWorkspaceCache()
    window.location.reload()
  }

  async function handleDemo() {
    setLoading(true)
    showToast('Loading demo data...')

    // Call the API to insert Supabase records
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      try {
        await fetch('/api/onboarding/load-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
        })
      } catch { /* continue — localStorage flags ensure the UI still works */ }
    }

    // Set localStorage flags for immediate UI update
    ALL_PAGES.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
    localStorage.setItem('lumio_demo_active', 'true')
    localStorage.setItem('lumio-photo-frame', JSON.stringify([
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80',
    ]))

    invalidateWorkspaceCache()
    window.location.reload()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 30%, ${accentColor}08 0%, transparent 65%)`
      }} />

      <div className="relative flex flex-col items-center text-center max-w-md w-full">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{
          background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`,
          border: `1px solid ${accentColor}40`
        }}>
          <Database size={36} style={{ color: accentColor }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#9CA3AF' }}>{description}</p>

        {/* Upload buttons */}
        <div className="flex flex-col gap-2.5 w-full mb-4">
          {uploads.map(btn => (
            <div key={btn.key}>
              <input
                type="file"
                multiple
                accept={btn.accept ?? '.csv,.xlsx,.xls'}
                className="hidden"
                ref={el => { fileRefs.current[btn.key] = el }}
                onChange={e => {
                  const files = e.target.files
                  if (files && files.length > 0) handleFile(btn.key, files[0])
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileRefs.current[btn.key]?.click()}
                  className="flex items-center gap-2 flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = `${accentColor}0A` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.backgroundColor = '#111318' }}>
                  <Upload size={14} style={{ color: accentColor, flexShrink: 0 }} />
                  {btn.label}
                </button>
                <button
                  onClick={() => downloadTemplate(btn.key)}
                  className="shrink-0 text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#4B5563', border: '1px solid #1F2937' }}
                  onMouseEnter={e => { e.currentTarget.style.color = accentColor }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#4B5563' }}
                  title={`Download ${btn.key} CSV template`}>
                  ↓ Template
                </button>
              </div>
            </div>
          ))}

          {/* Connect integration button */}
          <button
            onClick={() => setIntModal(true)}
            className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all text-left"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#9CA3AF' }}>
            <Link2 size={14} style={{ flexShrink: 0 }} />
            Connect an Integration (HubSpot, Xero, Slack + more)
          </button>
        </div>

        {/* Clear demo data */}
        {showClearDemo && (
          <button
            onClick={clearDemoData}
            className="text-xs mt-1 mb-3"
            style={{ color: '#4B5563' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563' }}>
            ✕ Clear demo data
          </button>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          <span className="text-xs" style={{ color: '#4B5563' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
        </div>

        {/* Dev shortcut — only shown in development or on Vercel preview */}
        {showDevButton && (
          <button
            onClick={() => loadDemoData(pageKey)}
            className="w-full rounded-xl px-4 py-2 text-xs font-medium mb-2"
            style={{ border: '1px solid #1F2937', color: '#4B5563', backgroundColor: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#6B7280' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#4B5563' }}>
            ⚡ Dev: Load Demo Instantly
          </button>
        )}

        {/* Demo data button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all"
          style={{ backgroundColor: accentColor, color: '#F9FAFB', opacity: loading ? 0.75 : 1 }}>
          {loading ? 'Loading demo data...' : '\u2728 Explore with Demo Data'}
        </button>
        <p className="text-xs mt-3" style={{ color: '#4B5563' }}>
          Pre-filled sample data so you can explore every feature before adding your own
        </p>
      </div>

      {/* Integrations modal */}
      {intModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Connect an Integration</p>
              <button onClick={() => setIntModal(false)} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>
              Lumio connects directly to your existing tools. Select one to get started — or contact us to set up a custom integration.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {INTEGRATIONS.map(int => (
                <button key={int.name}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2937'}
                  onClick={() => { setIntModal(false); showToast(`${int.name} integration — contact us to set up`) }}>
                  <span className="text-base">{int.logo}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{int.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{int.category}</p>
                  </div>
                </button>
              ))}
              <button
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 col-span-2"
                style={{ backgroundColor: '#0A0B11', border: `1px dashed ${accentColor}40`, color: accentColor }}
                onClick={() => { setIntModal(false); showToast('Custom integration — our team will be in touch') }}>
                <Plus size={14} />
                <span className="text-xs font-medium">Request a custom integration</span>
              </button>
            </div>
            <div className="flex gap-3">
              <a href="mailto:hello@lumiocms.com"
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center"
                style={{ backgroundColor: accentColor, color: '#F9FAFB' }}>
                Contact Us
              </a>
              <button onClick={() => setIntModal(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import preview modal */}
      {previewRows.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-2xl p-6 w-full max-w-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Preview Import</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{allRows.length} rows found · Showing first 5</p>
              </div>
              <button onClick={() => { setPreviewRows([]); setAllRows([]) }} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            <div className="overflow-x-auto mb-4 rounded-lg" style={{ border: '1px solid #1F2937' }}>
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0A0B10' }}>
                  {previewCols.map(c => <th key={c} className="text-left px-3 py-2 font-semibold" style={{ color: '#6B7280' }}>{c}</th>)}
                </tr></thead>
                <tbody>{previewRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                    {previewCols.map(c => <td key={c} className="px-3 py-2" style={{ color: '#D1D5DB' }}>{String(r[c] || '')}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmImport}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ backgroundColor: accentColor, color: '#F9FAFB' }}>
                Import {allRows.length} Records
              </button>
              <button onClick={() => { setPreviewRows([]); setAllRows([]) }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{ backgroundColor: accentColor, color: '#F9FAFB', maxWidth: 360 }}>
          <CheckCircle size={14} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Hook to check if a page has data to display.
 * Fast path: checks localStorage.
 * Async fallback: checks workspace demo_data_active flag via API.
 */
export function useHasDashboardData(pageKey: string): boolean | null {
  const [has, setHas] = useState<boolean | null>(null)

  useEffect(() => {
    const demoActive = localStorage.getItem('lumio_demo_active') === 'true'

    // Fast path 1: demo mode is active — all pages have data
    if (demoActive) {
      ALL_PAGES.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
      setHas(true)
      return
    }

    // Staff presence is now determined by Supabase query, not localStorage

    // Per-page flag ONLY trusted when demo is active (already handled above)
    // When demo is off, ignore stale lumio_dashboard_*_hasData flags

    // Async fallback: check Supabase via workspace status API
    const token = localStorage.getItem('workspace_session_token')
    if (!token) {
      setHas(false)
      return
    }

    fetch('/api/workspace/status', { headers: { 'x-workspace-token': token } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.demo_data_active) {
          // Sync localStorage so future checks are instant
          ALL_PAGES.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
          localStorage.setItem('lumio_demo_active', 'true')
          setHas(true)
        } else {
          setHas(false)
        }
      })
      .catch(() => setHas(false))
  }, [pageKey])

  return has
}

// Hook to check if a school page has data
export function useHasSchoolData(pageKey: string): boolean | null {
  const [has, setHas] = useState<boolean | null>(null)
  useEffect(() => {
    setHas(localStorage.getItem(`lumio_school_${pageKey}_hasData`) === 'true')
  }, [pageKey])
  return has
}
