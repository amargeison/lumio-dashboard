'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Upload, X, ArrowRight, Loader2, ChevronRight, Camera } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: 'hr',          label: 'HR & People',         emoji: '👥', desc: 'Onboarding, offboarding, leave, payroll' },
  { id: 'sales',       label: 'Sales & CRM',          emoji: '📈', desc: 'Pipeline, proposals, deal automation' },
  { id: 'finance',     label: 'Finance & Accounts',   emoji: '💰', desc: 'Invoicing, chasing, VAT, payroll' },
  { id: 'marketing',   label: 'Marketing',            emoji: '📣', desc: 'Campaigns, content, MQL handoff' },
  { id: 'support',     label: 'Customer Support',     emoji: '🎧', desc: 'Tickets, triage, SLA management' },
  { id: 'success',     label: 'Customer Success',     emoji: '📊', desc: 'Health scores, renewals, churn alerts' },
  { id: 'operations',  label: 'Operations',           emoji: '📦', desc: 'Stock, purchasing, suppliers' },
  { id: 'it',          label: 'IT & Systems',         emoji: '🖥️', desc: 'Provisioning, access, device management' },
  { id: 'legal',       label: 'Legal & Compliance',   emoji: '⚖️', desc: 'Contracts, filings, NDAs' },
  { id: 'exec',        label: 'Executive',            emoji: '🏆', desc: 'Briefings, board packs, OKR tracking' },
  { id: 'projects',    label: 'Projects',             emoji: '🗂️', desc: 'Task management, status updates' },
  { id: 'partners',    label: 'Partners',             emoji: '🤝', desc: 'Referrals, onboarding, co-selling' },
]

const INTEGRATIONS = [
  { id: 'notion',      label: 'Notion',       logo: '◻️' },
  { id: 'hubspot',     label: 'HubSpot',      logo: '🟠' },
  { id: 'xero',        label: 'Xero',         logo: '🔵' },
  { id: 'slack',       label: 'Slack',        logo: '💜' },
  { id: 'microsoft',   label: 'Microsoft 365',logo: '🔷' },
  { id: 'google',      label: 'Google Workspace', logo: '🔴' },
  { id: 'salesforce',  label: 'Salesforce',   logo: '☁️' },
  { id: 'zendesk',     label: 'Zendesk',      logo: '🎫' },
  { id: 'pipedrive',   label: 'Pipedrive',    logo: '🟢' },
  { id: 'quickbooks',  label: 'QuickBooks',   logo: '🟩' },
  { id: 'jira',        label: 'Jira',         logo: '🔵' },
  { id: 'github',      label: 'GitHub',       logo: '⚫' },
  { id: 'intercom',    label: 'Intercom',     logo: '🩵' },
  { id: 'freshdesk',   label: 'Freshdesk',    logo: '🌿' },
  { id: 'none',        label: 'None yet',     logo: '➕' },
]

const BUILD_STEPS = [
  'Provisioning your workspace…',
  'Loading workflow library…',
  'Seeding demo data…',
  'Configuring selected departments…',
  'Connecting AI engine…',
  'Running final checks…',
  'Your workspace is ready.',
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  const labels = ['Your company', 'Departments', 'Your tools', 'Invite team']
  return (
    <div className="flex items-center gap-0 justify-center mb-10">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done ? 'bg-teal-500 text-white' : active ? 'bg-[#6C3FC5] text-white' : 'text-[#6B7280]'
              }`} style={!done && !active ? { backgroundColor: '#1F2937' } : {}}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-px w-12 mx-2 mb-4 ${i < current ? 'bg-teal-500' : 'bg-[#1F2937]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  // Session — loaded from localStorage on mount
  const [sessionToken, setSessionToken] = useState('')
  const [companyId, setCompanyId]       = useState('')
  const [step, setStep]                 = useState(0)

  // Step 0 — company details
  const [companyName, setCompanyName]   = useState('')
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState('')
  const [nameError, setNameError]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 1 — departments
  const [depts, setDepts]               = useState<string[]>([])

  // Step 2 — integrations
  const [integrations, setIntegrations] = useState<string[]>([])

  // Step 3 — team invites
  const [invites, setInvites]           = useState(['', '', '', '', ''])

  // Building state
  const [building, setBuilding]         = useState(false)
  const [buildLog, setBuildLog]         = useState<string[]>([])
  const [buildDone, setBuildDone]       = useState(false)
  const [slug, setSlug]                 = useState('')

  // Load session
  useEffect(() => {
    const token = localStorage.getItem('demo_session_token') || ''
    const cId   = localStorage.getItem('demo_company_id')    || ''
    const cName = localStorage.getItem('demo_company_name')  || ''
    if (!token) { router.replace('/demo'); return }
    setSessionToken(token)
    setCompanyId(cId)
    setCompanyName(cName)
  }, [router])

  // ── handlers ─────────────────────────────────────────────────────────────────

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function toggleDept(id: string) {
    setDepts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  function toggleIntegration(id: string) {
    setIntegrations(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function setInvite(i: number, val: string) {
    setInvites(prev => { const next = [...prev]; next[i] = val; return next })
  }

  async function startBuild() {
    setBuilding(true)
    setBuildLog([])

    // Upload logo if provided
    let logoUrl = ''
    if (logoFile) {
      const fd = new FormData()
      fd.append('logo', logoFile)
      fd.append('company_id', companyId)
      try {
        const r = await fetch('/api/demo/upload-logo', { method: 'POST', body: fd })
        if (r.ok) { const d = await r.json(); logoUrl = d.url || '' }
      } catch { /* silent */ }
    }

    // Provision workspace
    let newSlug = ''
    try {
      const r = await fetch('/api/demo/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-token': sessionToken },
        body: JSON.stringify({
          company_id: companyId,
          company_name: companyName,
          departments: depts,
          integrations,
          logo_url: logoUrl,
          invites: invites.filter(Boolean),
        }),
      })
      if (r.ok) {
        const d = await r.json()
        newSlug = d.slug || ''
        if (newSlug) localStorage.setItem('demo_company_slug', newSlug)
        if (logoUrl) localStorage.setItem('demo_company_logo', logoUrl)
      }
    } catch { /* graceful */ }

    setSlug(newSlug)

    // Animated build log
    for (const log of BUILD_STEPS) {
      await new Promise(r => setTimeout(r, 480))
      setBuildLog(prev => [...prev, log])
    }

    // Persist company + logo for the workspace to pick up
    try {
      localStorage.setItem('demo_company_name', companyName)
      localStorage.setItem('lumio_company_name', companyName)
      localStorage.setItem('workspace_company_name', companyName)
      if (logoPreview) {
        localStorage.setItem('lumio_company_logo', logoPreview)
        localStorage.setItem('workspace_company_logo', logoPreview)
      }
    } catch { /* ignore quota */ }

    // Post logo to workspace endpoint once build is complete
    if (logoFile) {
      try {
        const fd2 = new FormData()
        fd2.append('logo', logoFile)
        fd2.append('company_id', companyId)
        await fetch('/api/workspace/logo', { method: 'POST', body: fd2 })
      } catch { /* silent */ }
    }

    setBuilding(false)
    setBuildDone(true)

    // Auto-redirect after brief pause
    setTimeout(() => {
      const storedSlug = newSlug || localStorage.getItem('demo_company_slug') || ''
      router.push(storedSlug ? `/demo/${storedSlug}` : '/demo')
    }, 1800)
  }

  // ── render ───────────────────────────────────────────────────────────────────

  if (building || buildDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              {buildDone
                ? <Check className="w-7 h-7 text-teal-400" />
                : <Loader2 className="w-7 h-7 text-teal-400 animate-spin" />}
            </div>
            <h2 className="text-xl font-bold">
              {buildDone ? `${companyName}'s workspace is ready` : 'Building your workspace…'}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              {buildDone ? 'Taking you in now…' : 'This takes about 3 seconds'}
            </p>
          </div>
          <div className="rounded-xl p-5 font-mono text-sm space-y-2"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            {buildLog.map((log, i) => (
              <div key={i} className={`flex items-center gap-2 ${
                i === buildLog.length - 1 && !buildDone ? 'text-teal-400' : 'text-[#6B7280]'
              }`}>
                <span style={{ color: '#374151' }}>{String(i + 1).padStart(2, '0')}</span>
                <span>{log}</span>
                {i === buildLog.length - 1 && !buildDone && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" />
                )}
                {(i < buildLog.length - 1 || buildDone) && (
                  <Check className="w-3.5 h-3.5 ml-auto text-teal-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      <div className="mx-auto max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-xl font-black tracking-tight">Lumio</span>
        </div>

        <Steps current={step} />

        {/* ── Step 0: Departments ──────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Which departments matter to you?</h1>
              <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                Pick at least 3. Your workspace will be seeded with realistic data for each one.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DEPARTMENTS.map(dept => {
                const selected = depts.includes(dept.id)
                return (
                  <button key={dept.id} onClick={() => toggleDept(dept.id)}
                    className="flex flex-col gap-1.5 p-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: selected ? 'rgba(13,148,136,0.08)' : '#111318',
                      border: `1px solid ${selected ? '#0D9488' : '#1F2937'}`,
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{dept.emoji}</span>
                      {selected && <Check size={14} style={{ color: '#0D9488' }} />}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{dept.label}</div>
                    <div className="text-[10px] leading-tight" style={{ color: '#6B7280' }}>{dept.desc}</div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="text-sm" style={{ color: '#9CA3AF' }}>← Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={depts.length < 3}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                {depts.length < 3 ? `Select ${3 - depts.length} more` : 'Next'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Integrations ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">What tools do you use today?</h1>
              <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                We&apos;ll show you how Lumio connects to what you already have. Skip if you&apos;re not sure yet.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {INTEGRATIONS.map(integ => {
                const selected = integrations.includes(integ.id)
                return (
                  <button key={integ.id} onClick={() => toggleIntegration(integ.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: selected ? 'rgba(108,63,197,0.1)' : '#111318',
                      border: `1px solid ${selected ? '#6C3FC5' : '#1F2937'}`,
                    }}>
                    <span className="text-2xl">{integ.logo}</span>
                    <span className="text-[10px] text-center leading-tight" style={{ color: selected ? '#A78BFA' : '#9CA3AF' }}>
                      {integ.label}
                    </span>
                    {selected && <Check size={10} style={{ color: '#6C3FC5' }} />}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-sm" style={{ color: '#9CA3AF' }}>← Back</button>
              <button onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Invite team ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Invite your team</h1>
              <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                Everyone gets their own magic link. Optional — you can do this later.
              </p>
            </div>

            <div className="rounded-xl p-6 space-y-3"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              {invites.map((inv, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: '#6B7280' }}>{i + 1}</span>
                  <input
                    type="email"
                    value={inv}
                    onChange={e => setInvite(i, e.target.value)}
                    placeholder={`colleague${i + 1}@${companyName.toLowerCase().replace(/\s+/g, '') || 'company'}.com`}
                    className="flex-1 rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#6C3FC5')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: '#0A0B12', border: '1px solid #1F2937', color: '#6B7280' }}>
              Each invited person gets an email with a magic link to join your trial workspace. All invitees will be removed when the 14-day trial ends.
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="text-sm" style={{ color: '#9CA3AF' }}>← Back</button>
              <button onClick={startBuild}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Build my workspace <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
