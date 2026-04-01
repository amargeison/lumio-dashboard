'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  ArrowLeft, ArrowRight, Check, Upload, Loader2, X,
  Download, Mail, Plus, Calendar, ExternalLink,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// ─── Supabase helper ─────────────────────────────────────────────────────────

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  type: 'business' | 'school'
  tenantId: string
  onComplete: () => void
}

interface Integration {
  id: string
  name: string
  description: string
  color: string
  mode: 'oauth' | 'apikey' | 'apikey+subdomain' | 'support'
  oauthUrl?: string
  supportNote?: string
}

interface InviteRow {
  email: string
  role: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface TemplateCard {
  id: string
  label: string
  file: string
  uploadStatus: UploadStatus
}

// ─── Theme tokens ────────────────────────────────────────────────────────────

const T = {
  bg: '#0A0B10',
  card: '#111318',
  input: '#1A1D26',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(124,58,237,0.5)',
  purple: '#7C3AED',
  purpleHover: '#6D28D9',
  purpleFaint: 'rgba(124,58,237,0.05)',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  green: '#22C55E',
  greenBg: 'rgba(34,197,94,0.15)',
  greenBorder: 'rgba(34,197,94,0.3)',
  red: '#EF4444',
}

// ─── Integration definitions ─────────────────────────────────────────────────

const BUSINESS_INTEGRATIONS: Integration[] = [
  { id: 'google',     name: 'Google Workspace',  description: 'Gmail, Calendar, Drive',        color: '#4285F4', mode: 'oauth', oauthUrl: '/api/integrations/google/auth' },
  { id: 'microsoft',  name: 'Microsoft 365',     description: 'Outlook, Teams, OneDrive',      color: '#00A4EF', mode: 'oauth', oauthUrl: '/api/integrations/microsoft/auth' },
  { id: 'slack',      name: 'Slack',             description: 'Team messaging & notifications', color: '#4A154B', mode: 'oauth', oauthUrl: '/api/integrations/slack/auth' },
  { id: 'hubspot',    name: 'HubSpot',           description: 'CRM, contacts & deals',         color: '#FF7A59', mode: 'apikey' },
  { id: 'xero',       name: 'Xero',              description: 'Accounting & invoicing',        color: '#13B5EA', mode: 'oauth', oauthUrl: '/api/integrations/xero/auth' },
  { id: 'quickbooks', name: 'QuickBooks',         description: 'Accounting & payroll',          color: '#2CA01C', mode: 'oauth', oauthUrl: '/api/integrations/quickbooks/auth' },
]

const SCHOOL_INTEGRATIONS: Integration[] = [
  { id: 'google',    name: 'Google Workspace', description: 'Gmail, Classroom, Drive',       color: '#4285F4', mode: 'oauth', oauthUrl: '/api/integrations/google/auth' },
  { id: 'microsoft', name: 'Microsoft 365',    description: 'Outlook, Teams, OneDrive',      color: '#00A4EF', mode: 'oauth', oauthUrl: '/api/integrations/microsoft/auth' },
  { id: 'arbor',     name: 'Arbor',            description: 'MIS — pupil & staff data',      color: '#00B894', mode: 'apikey+subdomain' },
  { id: 'sims',      name: 'SIMS',             description: 'Requires IT setup — we\'ll guide you', color: '#1E3A5F', mode: 'support', supportNote: 'Requires IT setup — we\'ll guide you' },
  { id: 'bromcom',   name: 'Bromcom',          description: 'MIS — attendance & timetable',  color: '#E84393', mode: 'apikey' },
  { id: 'wonde',     name: 'Wonde',            description: 'Universal school data sync',    color: '#6C5CE7', mode: 'apikey' },
]

const BUSINESS_TEMPLATES: TemplateCard[] = [
  { id: 'staff',    label: 'Staff / Team',        file: '/templates/business_staff.csv',    uploadStatus: 'idle' },
  { id: 'contacts', label: 'Contacts / CRM',      file: '/templates/business_contacts.csv', uploadStatus: 'idle' },
  { id: 'accounts', label: 'Accounts / Clients',   file: '/templates/business_accounts.csv', uploadStatus: 'idle' },
]

const SCHOOL_TEMPLATES: TemplateCard[] = [
  { id: 'pupils',   label: 'Pupils',              file: '/templates/schools_pupils.csv',   uploadStatus: 'idle' },
  { id: 'staff',    label: 'Staff',               file: '/templates/schools_staff.csv',    uploadStatus: 'idle' },
  { id: 'contacts', label: 'Contacts / Parents',  file: '/templates/schools_contacts.csv', uploadStatus: 'idle' },
]

const ROLES = ['Admin', 'Manager', 'Staff']
const TOTAL_STEPS = 4

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingWizard({ type, tenantId, onComplete }: Props) {
  const [step, setStep] = useState(1)

  // Step 1 — integrations
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [apiKeys, setApiKeys]     = useState<Record<string, string>>({})
  const [subdomains, setSubdomains] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState<Record<string, boolean>>({})

  // Step 2 — uploads
  const [templates, setTemplates] = useState<TemplateCard[]>(
    type === 'business' ? [...BUSINESS_TEMPLATES] : [...SCHOOL_TEMPLATES],
  )
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Step 3 — invites
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'Staff' }])
  const [sendingInvites, setSendingInvites] = useState(false)
  const [invitesSent, setInvitesSent] = useState(false)

  const integrations = type === 'business' ? BUSINESS_INTEGRATIONS : SCHOOL_INTEGRATIONS

  // ── Persist step to DB ───────────────────────────────────────────────────

  async function persistStep(nextStep: number) {
    const table = type === 'business' ? 'businesses' : 'schools'
    await supabase()
      .from(table)
      .update({ onboarding_step: nextStep })
      .eq('id', tenantId)
      .then(() => {})
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  function advance() {
    if (step < TOTAL_STEPS) {
      const next = step + 1
      setStep(next)
      persistStep(next)
    } else {
      finish()
    }
  }

  function goBack() {
    if (step > 1) setStep(step - 1)
  }

  async function finish() {
    const table = type === 'business' ? 'businesses' : 'schools'
    await supabase()
      .from(table)
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: TOTAL_STEPS,
      })
      .eq('id', tenantId)
    localStorage.setItem('lumio_onboarding_shown', 'true')
    onComplete()
  }

  // ── Step 1: Connect integration ──────────────────────────────────────────

  async function connectOAuth(integration: Integration) {
    window.open(integration.oauthUrl, '_blank')
    setConnected(prev => ({ ...prev, [integration.id]: true }))
    await supabase().from('tenant_integrations').insert({
      tenant_id: tenantId, tenant_type: type, service_name: integration.id,
      status: 'connected', connected_at: new Date().toISOString(),
    })
  }

  async function connectApiKey(integration: Integration) {
    const key = apiKeys[integration.id]
    if (!key?.trim()) return
    setConnecting(prev => ({ ...prev, [integration.id]: true }))
    await supabase().from('tenant_integrations').insert({
      tenant_id: tenantId, tenant_type: type, service_name: integration.id,
      api_key: key.trim(), subdomain: subdomains[integration.id] || null,
      status: 'connected', connected_at: new Date().toISOString(),
    })
    setConnected(prev => ({ ...prev, [integration.id]: true }))
    setConnecting(prev => ({ ...prev, [integration.id]: false }))
  }

  async function raiseSupport(integration: Integration) {
    setConnecting(prev => ({ ...prev, [integration.id]: true }))
    await supabase().from('tenant_integrations').insert({
      tenant_id: tenantId, tenant_type: type, service_name: integration.id, status: 'pending',
    })
    setConnected(prev => ({ ...prev, [integration.id]: true }))
    setConnecting(prev => ({ ...prev, [integration.id]: false }))
  }

  // ── Step 2: File upload ──────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (templateId: string, file: File) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, uploadStatus: 'uploading' as UploadStatus } : t))
    try {
      await supabase().from('onboarding_uploads').insert({
        tenant_id: tenantId, tenant_type: type, file_type: templateId, filename: file.name, status: 'pending',
      })
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, uploadStatus: 'success' as UploadStatus } : t))
    } catch {
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, uploadStatus: 'error' as UploadStatus } : t))
    }
  }, [tenantId, type])

  // ── Step 3: Invites ──────────────────────────────────────────────────────

  function addInviteRow() { setInvites(prev => [...prev, { email: '', role: 'Staff' }]) }
  function updateInvite(index: number, field: keyof InviteRow, value: string) {
    setInvites(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }
  function removeInvite(index: number) { setInvites(prev => prev.filter((_, i) => i !== index)) }

  async function sendInvites() {
    const valid = invites.filter(r => r.email.trim())
    if (!valid.length) { advance(); return }
    setSendingInvites(true)
    await supabase().from('tenant_invites').insert(
      valid.map(r => ({ tenant_id: tenantId, tenant_type: type, email: r.email.trim(), role: r.role.toLowerCase(), status: 'pending' }))
    )
    setSendingInvites(false)
    setInvitesSent(true)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: T.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header: Logo + progress + close */}
      <div style={{ padding: '20px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Image src="/lumio-logo-primary.png" alt="Lumio" width={320} height={160} style={{ width: 120, height: 'auto' }} priority />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: T.muted }}>Step {step} of {TOTAL_STEPS}</span>
            <button onClick={() => { localStorage.setItem('lumio_onboarding_shown', 'true'); onComplete() }} title="Close and skip setup" style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted }}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, width: '100%' }}>
          <div style={{ height: 4, backgroundColor: T.purple, borderRadius: 2, width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px 120px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {step === 1 && <StepConnect integrations={integrations} connected={connected} apiKeys={apiKeys} subdomains={subdomains} connecting={connecting} onOAuth={connectOAuth} onApiKey={connectApiKey} onSupport={raiseSupport} onApiKeyChange={(id, v) => setApiKeys(p => ({ ...p, [id]: v }))} onSubdomainChange={(id, v) => setSubdomains(p => ({ ...p, [id]: v }))} />}
          {step === 2 && <StepUpload templates={templates} fileRefs={fileRefs} onUpload={handleFileUpload} />}
          {step === 3 && <StepInvite invites={invites} sending={sendingInvites} sent={invitesSent} onAdd={addInviteRow} onUpdate={updateInvite} onRemove={removeInvite} onSend={sendInvites} />}
          {step === 4 && <StepBookCall />}
        </div>
      </div>

      {/* Footer: navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: T.bg, borderTop: `1px solid ${T.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 51 }}>
        <div>
          {step > 1 && (
            <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.muted, fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button onClick={advance} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: T.purple, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = T.purpleHover }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.purple }}>
            {step === TOTAL_STEPS ? 'Finish Setup' : 'Continue'} <ArrowRight size={16} />
          </button>
          <button onClick={advance} style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
            Skip this step &rarr;
          </button>
        </div>
        <div style={{ width: 60 }} />
      </div>
    </div>
  )
}

// ─── Step 1: Connect Your Tools ──────────────────────────────────────────────

function StepConnect({ integrations, connected, apiKeys, subdomains, connecting, onOAuth, onApiKey, onSupport, onApiKeyChange, onSubdomainChange }: {
  integrations: Integration[]; connected: Record<string, boolean>; apiKeys: Record<string, string>; subdomains: Record<string, string>; connecting: Record<string, boolean>
  onOAuth: (i: Integration) => void; onApiKey: (i: Integration) => void; onSupport: (i: Integration) => void; onApiKeyChange: (id: string, v: string) => void; onSubdomainChange: (id: string, v: string) => void
}) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text, marginBottom: 8 }}>Connect your tools</h1>
      <p style={{ fontSize: 15, color: T.muted, marginBottom: 32 }}>Link your existing platforms so Lumio can sync your data automatically.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {integrations.map(intg => {
          const isConnected = connected[intg.id]
          return (
            <div key={intg.id} style={{
              backgroundColor: T.card, borderRadius: 16, border: `1px solid ${isConnected ? T.greenBorder : T.border}`, padding: 24,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              ...(isConnected ? { boxShadow: `0 0 0 1px ${T.greenBorder}` } : {}),
            }}
              onMouseEnter={e => { if (!isConnected) e.currentTarget.style.borderColor = T.borderHover }}
              onMouseLeave={e => { if (!isConnected) e.currentTarget.style.borderColor = T.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: intg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 16 }}>{intg.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{intg.name}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>{intg.description}</div>
                </div>
              </div>
              {isConnected ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: T.green, backgroundColor: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 8, padding: '6px 12px' }}>
                  <Check size={14} /> Connected
                </div>
              ) : intg.mode === 'oauth' ? (
                <button onClick={() => onOAuth(intg)} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, backgroundColor: T.purple, color: '#FFF', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = T.purpleHover }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.purple }}>
                  <ExternalLink size={14} /> Connect with {intg.name}
                </button>
              ) : intg.mode === 'support' ? (
                <div>
                  <p style={{ fontSize: 13, color: T.muted, marginBottom: 10, fontStyle: 'italic' }}>{intg.supportNote}</p>
                  <button onClick={() => onSupport(intg)} disabled={connecting[intg.id]} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, backgroundColor: T.card, color: T.muted, border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    {connecting[intg.id] ? <Loader2 size={14} className="animate-spin" /> : 'Request Setup'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {intg.mode === 'apikey+subdomain' && (
                    <input type="text" placeholder="Subdomain (e.g. yourschool)" value={subdomains[intg.id] || ''} onChange={e => onSubdomainChange(intg.id, e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, fontSize: 13, outline: 'none', backgroundColor: T.input, color: T.text }} />
                  )}
                  <input type="text" placeholder="API Key" value={apiKeys[intg.id] || ''} onChange={e => onApiKeyChange(intg.id, e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, outline: 'none', backgroundColor: T.input, color: T.text }} />
                  <button onClick={() => onApiKey(intg)} disabled={connecting[intg.id] || !apiKeys[intg.id]?.trim()} style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    backgroundColor: apiKeys[intg.id]?.trim() ? T.purple : 'rgba(255,255,255,0.08)', color: apiKeys[intg.id]?.trim() ? '#FFF' : T.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>{connecting[intg.id] ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Upload Your Data ────────────────────────────────────────────────

function StepUpload({ templates, fileRefs, onUpload }: {
  templates: TemplateCard[]; fileRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>; onUpload: (templateId: string, file: File) => void
}) {
  const [dragOver, setDragOver] = useState<string | null>(null)

  function handleDrop(templateId: string, e: React.DragEvent) {
    e.preventDefault(); setDragOver(null)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) onUpload(templateId, file)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text, marginBottom: 8 }}>Import your data</h1>
      <p style={{ fontSize: 15, color: T.muted, marginBottom: 32 }}>Download our templates, fill them in, and upload to populate your workspace.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} style={{ backgroundColor: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 16 }}>{t.label}</div>
            <a href={t.file} download style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.purple, fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
              <Download size={16} /> Download Template
            </a>
            {t.uploadStatus === 'success' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.green, fontSize: 14, fontWeight: 600, padding: '16px 0' }}>
                <Check size={18} /> Uploaded — we&apos;ll process this shortly
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(t.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(t.id, e)}
                onClick={() => fileRefs.current[t.id]?.click()}
                style={{
                  border: `2px dashed ${dragOver === t.id ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.4)'}`,
                  borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  backgroundColor: dragOver === t.id ? T.purpleFaint : 'transparent',
                }}>
                <input ref={el => { fileRefs.current[t.id] = el }} type="file" accept=".csv" style={{ display: 'none' }}
                  onChange={e => { const file = e.target.files?.[0]; if (file) onUpload(t.id, file) }} />
                {t.uploadStatus === 'uploading' ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: T.purple, margin: '0 auto' }} />
                ) : t.uploadStatus === 'error' ? (
                  <div style={{ color: T.red, fontSize: 13 }}>Upload failed — click to retry</div>
                ) : (
                  <>
                    <Upload size={20} style={{ color: T.muted, margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, color: T.muted }}>
                      Drag & drop your <strong style={{ color: T.text }}>.csv</strong> here, or <span style={{ color: T.purple, fontWeight: 600 }}>browse</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Invite Your Team ────────────────────────────────────────────────

function StepInvite({ invites, sending, sent, onAdd, onUpdate, onRemove, onSend }: {
  invites: InviteRow[]; sending: boolean; sent: boolean
  onAdd: () => void; onUpdate: (i: number, f: keyof InviteRow, v: string) => void; onRemove: (i: number) => void; onSend: () => void
}) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text, marginBottom: 8 }}>Invite your team</h1>
      <p style={{ fontSize: 15, color: T.muted, marginBottom: 32 }}>Get your colleagues set up so they can hit the ground running.</p>

      {sent ? (
        <div style={{ backgroundColor: T.greenBg, borderRadius: 16, padding: 32, textAlign: 'center', border: `1px solid ${T.greenBorder}` }}>
          <Check size={40} style={{ color: T.green, margin: '0 auto 12px' }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 4 }}>Invites sent!</div>
          <div style={{ fontSize: 14, color: T.muted }}>Your team will receive an email with instructions to join.</div>
        </div>
      ) : (
        <div style={{ backgroundColor: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invites.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                  <input type="email" placeholder="colleague@company.com" value={row.email} onChange={e => onUpdate(i, 'email', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, outline: 'none', backgroundColor: T.input, color: T.text }} />
                </div>
                <select value={row.role} onChange={e => onUpdate(i, 'role', e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, outline: 'none', backgroundColor: T.input, color: T.text, minWidth: 120 }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {invites.length > 1 && (
                  <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}><X size={16} /></button>
                )}
              </div>
            ))}
          </div>
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.purple, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16, padding: 0 }}>
            <Plus size={16} /> Add another
          </button>
          <div style={{ marginTop: 24 }}>
            <button onClick={onSend} disabled={sending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.purple, color: '#FFF', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = T.purpleHover }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.purple }}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {sending ? 'Sending...' : 'Send Invites'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Book Your Onboarding Call ───────────────────────────────────────

function StepBookCall() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text, marginBottom: 8 }}>Book your onboarding call</h1>
      <p style={{ fontSize: 15, color: T.muted, marginBottom: 32 }}>Let us walk you through everything and get you fully set up.</p>

      <div style={{ backgroundColor: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: T.purpleFaint, border: `1px solid ${T.borderHover}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Calendar size={28} style={{ color: T.purple }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>30-minute onboarding call with the Lumio team</div>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>We&apos;ll help you connect your data, configure your settings, and answer any questions.</p>
        <a href="https://calendly.com/lumio" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: T.purple, color: '#FFF', border: 'none', borderRadius: 10, padding: '14px 36px', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          <Calendar size={18} /> Book a Call
        </a>
        <div style={{ marginTop: 24, fontSize: 14, color: T.muted }}>
          Or email us at{' '}
          <a href="mailto:hello@lumiocms.com" style={{ color: T.purple, textDecoration: 'none', fontWeight: 600 }}>hello@lumiocms.com</a>
        </div>
      </div>
    </div>
  )
}
