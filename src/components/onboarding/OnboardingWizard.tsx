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

const ROLES_BUSINESS = ['Admin', 'Manager', 'Staff']
const ROLES_SCHOOL   = ['Admin', 'Manager', 'Staff']

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
  const roles = type === 'business' ? ROLES_BUSINESS : ROLES_SCHOOL

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
    // Open OAuth flow in new tab (placeholder URLs — will be wired later)
    window.open(integration.oauthUrl, '_blank')
    // Optimistically mark as connected after a short delay
    setConnected(prev => ({ ...prev, [integration.id]: true }))
    await supabase().from('tenant_integrations').insert({
      tenant_id: tenantId,
      tenant_type: type,
      service_name: integration.id,
      status: 'connected',
      connected_at: new Date().toISOString(),
    })
  }

  async function connectApiKey(integration: Integration) {
    const key = apiKeys[integration.id]
    if (!key?.trim()) return
    setConnecting(prev => ({ ...prev, [integration.id]: true }))
    const sub = subdomains[integration.id] || null
    await supabase().from('tenant_integrations').insert({
      tenant_id: tenantId,
      tenant_type: type,
      service_name: integration.id,
      api_key: key.trim(),
      subdomain: sub,
      status: 'connected',
      connected_at: new Date().toISOString(),
    })
    setConnected(prev => ({ ...prev, [integration.id]: true }))
    setConnecting(prev => ({ ...prev, [integration.id]: false }))
  }

  async function raiseSupport(integration: Integration) {
    setConnecting(prev => ({ ...prev, [integration.id]: true }))
    await supabase().from('tenant_integrations').insert({
      tenant_id: tenantId,
      tenant_type: type,
      service_name: integration.id,
      status: 'pending',
    })
    setConnected(prev => ({ ...prev, [integration.id]: true }))
    setConnecting(prev => ({ ...prev, [integration.id]: false }))
  }

  // ── Step 2: File upload ──────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (templateId: string, file: File) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, uploadStatus: 'uploading' as UploadStatus } : t))
    try {
      await supabase().from('onboarding_uploads').insert({
        tenant_id: tenantId,
        tenant_type: type,
        file_type: templateId,
        filename: file.name,
        status: 'pending',
      })
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, uploadStatus: 'success' as UploadStatus } : t))
    } catch {
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, uploadStatus: 'error' as UploadStatus } : t))
    }
  }, [tenantId, type])

  // ── Step 3: Invites ──────────────────────────────────────────────────────

  function addInviteRow() {
    setInvites(prev => [...prev, { email: '', role: 'Staff' }])
  }

  function updateInvite(index: number, field: keyof InviteRow, value: string) {
    setInvites(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  function removeInvite(index: number) {
    setInvites(prev => prev.filter((_, i) => i !== index))
  }

  async function sendInvites() {
    const valid = invites.filter(r => r.email.trim())
    if (!valid.length) { advance(); return }
    setSendingInvites(true)
    const rows = valid.map(r => ({
      tenant_id: tenantId,
      tenant_type: type,
      email: r.email.trim(),
      role: r.role.toLowerCase(),
      status: 'pending',
    }))
    await supabase().from('tenant_invites').insert(rows)
    setSendingInvites(false)
    setInvitesSent(true)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      backgroundColor: '#FFFFFF',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header: Logo + progress */}
      <div style={{ padding: '20px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Image src="/lumio-logo-primary.png" alt="Lumio" width={320} height={160} style={{ width: 120, height: 'auto' }} priority />
          <span style={{ fontSize: 13, color: '#6B7280' }}>Step {step} of {TOTAL_STEPS}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, width: '100%' }}>
          <div style={{
            height: 4, backgroundColor: '#7C3AED', borderRadius: 2,
            width: `${progressPct}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px 120px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {step === 1 && <StepConnect
            integrations={integrations}
            connected={connected}
            apiKeys={apiKeys}
            subdomains={subdomains}
            connecting={connecting}
            onOAuth={connectOAuth}
            onApiKey={connectApiKey}
            onSupport={raiseSupport}
            onApiKeyChange={(id, v) => setApiKeys(p => ({ ...p, [id]: v }))}
            onSubdomainChange={(id, v) => setSubdomains(p => ({ ...p, [id]: v }))}
          />}

          {step === 2 && <StepUpload
            templates={templates}
            fileRefs={fileRefs}
            onUpload={handleFileUpload}
          />}

          {step === 3 && <StepInvite
            invites={invites}
            roles={roles}
            sending={sendingInvites}
            sent={invitesSent}
            onAdd={addInviteRow}
            onUpdate={updateInvite}
            onRemove={removeInvite}
            onSend={sendInvites}
          />}

          {step === 4 && <StepBookCall />}
        </div>
      </div>

      {/* Footer: navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 51,
      }}>
        <div>
          {step > 1 && (
            <button onClick={goBack} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', color: '#6B7280',
              fontSize: 14, cursor: 'pointer', padding: '8px 0',
            }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button onClick={advance} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: '#7C3AED', color: '#FFFFFF',
            border: 'none', borderRadius: 10, padding: '12px 32px',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED' }}
          >
            {step === TOTAL_STEPS ? 'Finish Setup' : 'Continue'} <ArrowRight size={16} />
          </button>
          <button onClick={advance} style={{
            background: 'none', border: 'none', color: '#9CA3AF',
            fontSize: 13, cursor: 'pointer', padding: '4px 0',
          }}>
            Skip this step &rarr;
          </button>
        </div>
        <div style={{ width: 60 }} /> {/* spacer to balance back button */}
      </div>
    </div>
  )
}

// ─── Step 1: Connect Your Tools ──────────────────────────────────────────────

function StepConnect({
  integrations, connected, apiKeys, subdomains, connecting,
  onOAuth, onApiKey, onSupport, onApiKeyChange, onSubdomainChange,
}: {
  integrations: Integration[]
  connected: Record<string, boolean>
  apiKeys: Record<string, string>
  subdomains: Record<string, string>
  connecting: Record<string, boolean>
  onOAuth: (i: Integration) => void
  onApiKey: (i: Integration) => void
  onSupport: (i: Integration) => void
  onApiKeyChange: (id: string, v: string) => void
  onSubdomainChange: (id: string, v: string) => void
}) {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Connect your tools</h1>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
        Link your existing platforms so Lumio can sync your data automatically.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {integrations.map(intg => {
          const isConnected = connected[intg.id]
          return (
            <div key={intg.id} style={{
              backgroundColor: '#F9FAFB', borderRadius: 16,
              border: '1px solid #E5E7EB', padding: 24,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              ...(isConnected ? { borderColor: '#7C3AED', boxShadow: '0 0 0 1px #7C3AED' } : {}),
            }}
              onMouseEnter={e => { if (!isConnected) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)' } }}
              onMouseLeave={e => { if (!isConnected) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' } }}
            >
              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: intg.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#FFF', fontWeight: 700, fontSize: 16,
                }}>
                  {intg.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{intg.name}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{intg.description}</div>
                </div>
              </div>

              {isConnected ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: '#059669', fontSize: 14, fontWeight: 600,
                }}>
                  <Check size={16} /> Connected
                </div>
              ) : intg.mode === 'oauth' ? (
                <button onClick={() => onOAuth(intg)} style={{
                  width: '100%', padding: '10px 16px', borderRadius: 8,
                  backgroundColor: '#7C3AED', color: '#FFF', border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <ExternalLink size={14} /> Connect with {intg.name}
                </button>
              ) : intg.mode === 'support' ? (
                <div>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 10, fontStyle: 'italic' }}>
                    {intg.supportNote}
                  </p>
                  <button onClick={() => onSupport(intg)} disabled={connecting[intg.id]} style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8,
                    backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                    {connecting[intg.id] ? <Loader2 size={14} className="animate-spin" /> : 'Request Setup'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {intg.mode === 'apikey+subdomain' && (
                    <input
                      type="text"
                      placeholder="Subdomain (e.g. yourschool)"
                      value={subdomains[intg.id] || ''}
                      onChange={e => onSubdomainChange(intg.id, e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid #D1D5DB', fontSize: 13, outline: 'none',
                        backgroundColor: '#FFF',
                      }}
                    />
                  )}
                  <input
                    type="text"
                    placeholder="API Key"
                    value={apiKeys[intg.id] || ''}
                    onChange={e => onApiKeyChange(intg.id, e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #D1D5DB', fontSize: 13, outline: 'none',
                      backgroundColor: '#FFF',
                    }}
                  />
                  <button onClick={() => onApiKey(intg)} disabled={connecting[intg.id] || !apiKeys[intg.id]?.trim()} style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8,
                    backgroundColor: apiKeys[intg.id]?.trim() ? '#7C3AED' : '#E5E7EB',
                    color: apiKeys[intg.id]?.trim() ? '#FFF' : '#9CA3AF',
                    border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    {connecting[intg.id] ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
                  </button>
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

function StepUpload({
  templates, fileRefs, onUpload,
}: {
  templates: TemplateCard[]
  fileRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onUpload: (templateId: string, file: File) => void
}) {
  const [dragOver, setDragOver] = useState<string | null>(null)

  function handleDrop(templateId: string, e: React.DragEvent) {
    e.preventDefault()
    setDragOver(null)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) onUpload(templateId, file)
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Import your data</h1>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
        Download our templates, fill them in, and upload to populate your workspace.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.id} style={{
            backgroundColor: '#F9FAFB', borderRadius: 16,
            border: '1px solid #E5E7EB', padding: 24,
          }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 16 }}>{t.label}</div>

            {/* Download */}
            <a href={t.file} download style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#7C3AED', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', marginBottom: 16,
            }}>
              <Download size={16} /> Download Template
            </a>

            {/* Upload dropzone */}
            {t.uploadStatus === 'success' ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: '#059669', fontSize: 14, fontWeight: 600,
                padding: '16px 0',
              }}>
                <Check size={18} /> Uploaded — we&apos;ll process this shortly
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(t.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(t.id, e)}
                onClick={() => fileRefs.current[t.id]?.click()}
                style={{
                  border: `2px dashed ${dragOver === t.id ? '#7C3AED' : '#D1D5DB'}`,
                  borderRadius: 12, padding: '24px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                  backgroundColor: dragOver === t.id ? '#F5F3FF' : 'transparent',
                }}
              >
                <input
                  ref={el => { fileRefs.current[t.id] = el }}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) onUpload(t.id, file)
                  }}
                />
                {t.uploadStatus === 'uploading' ? (
                  <Loader2 size={24} className="animate-spin" style={{ color: '#7C3AED', margin: '0 auto' }} />
                ) : t.uploadStatus === 'error' ? (
                  <div style={{ color: '#EF4444', fontSize: 13 }}>Upload failed — click to retry</div>
                ) : (
                  <>
                    <Upload size={20} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, color: '#6B7280' }}>
                      Drag & drop your <strong>.csv</strong> here, or <span style={{ color: '#7C3AED', fontWeight: 600 }}>browse</span>
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

function StepInvite({
  invites, roles, sending, sent,
  onAdd, onUpdate, onRemove, onSend,
}: {
  invites: InviteRow[]
  roles: string[]
  sending: boolean
  sent: boolean
  onAdd: () => void
  onUpdate: (i: number, f: keyof InviteRow, v: string) => void
  onRemove: (i: number) => void
  onSend: () => void
}) {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Invite your team</h1>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
        Get your colleagues set up so they can hit the ground running.
      </p>

      {sent ? (
        <div style={{
          backgroundColor: '#F0FDF4', borderRadius: 16, padding: 32,
          textAlign: 'center', border: '1px solid #BBF7D0',
        }}>
          <Check size={40} style={{ color: '#059669', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Invites sent!</div>
          <div style={{ fontSize: 14, color: '#6B7280' }}>Your team will receive an email with instructions to join.</div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invites.map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={row.email}
                    onChange={e => onUpdate(i, 'email', e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                      border: '1px solid #D1D5DB', fontSize: 14, outline: 'none',
                      backgroundColor: '#FFF',
                    }}
                  />
                </div>
                <select
                  value={row.role}
                  onChange={e => onUpdate(i, 'role', e.target.value)}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #D1D5DB', fontSize: 14, outline: 'none',
                    backgroundColor: '#FFF', color: '#374151', minWidth: 120,
                  }}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {invites.length > 1 && (
                  <button onClick={() => onRemove(i)} style={{
                    background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4,
                  }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={onAdd} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#7C3AED',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            marginTop: 16, padding: 0,
          }}>
            <Plus size={16} /> Add another
          </button>

          <div style={{ marginTop: 24 }}>
            <button onClick={onSend} disabled={sending} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: '#7C3AED', color: '#FFF', border: 'none',
              borderRadius: 10, padding: '12px 28px', fontSize: 15,
              fontWeight: 600, cursor: 'pointer', width: '100%',
            }}>
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
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Book your onboarding call</h1>
      <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 32 }}>
        Let us walk you through everything and get you fully set up.
      </p>

      <div style={{
        backgroundColor: '#F9FAFB', borderRadius: 16,
        border: '1px solid #E5E7EB', padding: 40,
        textAlign: 'center', maxWidth: 520, margin: '0 auto',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: '#F5F3FF', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Calendar size={28} style={{ color: '#7C3AED' }} />
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          30-minute onboarding call with the Lumio team
        </div>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 1.6 }}>
          We&apos;ll help you connect your data, configure your settings, and answer any questions.
        </p>

        <a
          href="https://calendly.com/lumio"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: '#7C3AED', color: '#FFF', border: 'none',
            borderRadius: 10, padding: '14px 36px', fontSize: 16,
            fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
          }}
        >
          <Calendar size={18} /> Book a Call
        </a>

        <div style={{ marginTop: 24, fontSize: 14, color: '#9CA3AF' }}>
          Or email us at{' '}
          <a href="mailto:hello@lumiocms.com" style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>
            hello@lumiocms.com
          </a>
        </div>
      </div>
    </div>
  )
}
