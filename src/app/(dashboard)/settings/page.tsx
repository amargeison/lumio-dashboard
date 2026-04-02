'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Users, CreditCard, Key, Bell, Copy, Check, Shield, Upload } from 'lucide-react'
import { Badge, SectionCard, PageShell } from '@/components/page-ui'

const teamMembers = [
  { name: 'James Hartley', email: 'james@lumiodemo.com',     role: 'Admin',   lastLogin: '21 Mar 2026, 09:14' },
  { name: 'Dan Marsh',       email: 'dan@lumio.io',        role: 'Admin',   lastLogin: '21 Mar 2026, 08:52' },
  { name: 'Sophie Bell',     email: 'sophie@lumio.io',     role: 'Manager', lastLogin: '20 Mar 2026, 17:30' },
  { name: 'Raj Patel',       email: 'raj@lumio.io',        role: 'Member',  lastLogin: '20 Mar 2026, 14:05' },
  { name: 'Amara Diallo',    email: 'amara@lumio.io',      role: 'Member',  lastLogin: '21 Mar 2026, 08:20' },
  { name: 'Chris Ogunleye',  email: 'chris@lumio.io',      role: 'Member',  lastLogin: '19 Mar 2026, 11:47' },
]

const plans = [
  {
    id: 'starter', name: 'Starter', price: '£99/mo', current: false,
    features: ['Up to 5 users', '10 workflows', 'Email support', 'Basic reporting'],
  },
  {
    id: 'growth', name: 'Growth', price: '£299/mo', current: true,
    features: ['Up to 25 users', 'Unlimited workflows', 'Priority support', 'Advanced reporting', 'Custom branding'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Custom', current: false,
    features: ['Unlimited users', 'Unlimited workflows', 'Dedicated CSM', 'SLA guarantee', 'SSO & SAML', 'Custom integrations'],
  },
]

const apiKeys = [
  { label: 'Production API Key', key: 'lm_live_••••••••••••••••••••••••8f2a', created: '1 Jan 2026'  },
  { label: 'Test API Key',       key: 'lm_test_••••••••••••••••••••••••3c9d', created: '15 Feb 2026' },
]

const notifications = [
  { group: 'Workflows',  items: ['Workflow run failed', 'Workflow completed', 'New workflow created'] },
  { group: 'Support',    items: ['New ticket assigned', 'SLA breach warning', 'CSAT score received']  },
  { group: 'Accounts',   items: ['Invoice overdue', 'Payment received', 'New invoice raised']         },
  { group: 'Customers',  items: ['RAG status changed to Red', 'Customer health score drop', 'Renewal due in 30 days'] },
]

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
      style={{ backgroundColor: '#1F2937', color: copied ? '#22C55E' : '#9CA3AF' }}
      onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function NotificationRow({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <label className="flex cursor-pointer items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      <span className="text-sm" style={{ color: '#F9FAFB' }}>{label}</span>
      <div
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#0D9488' : '#1F2937' }}
        onClick={() => setChecked(!checked)}
      >
        <div
          className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
          style={{ backgroundColor: '#F9FAFB', transform: checked ? 'translateX(16px)' : 'translateX(2px)' }}
        />
      </div>
    </label>
  )
}

function LogoUpload() {
  const [logo, setLogo] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_company_logo') || '' : '')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const companyName = typeof window !== 'undefined' ? localStorage.getItem('lumio_company_name') || 'Lumio' : 'Lumio'
  const initials = companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) { setToast('File too large (max 2MB)'); setTimeout(() => setToast(''), 3000); return }
    setUploading(true)
    const token = localStorage.getItem('workspace_session_token')
    if (!token) { setUploading(false); return }
    const fd = new FormData()
    fd.append('logo', file)
    try {
      const res = await fetch('/api/workspace/logo', { method: 'POST', headers: { 'x-workspace-token': token }, body: fd })
      const data = await res.json()
      if (data.logo_url) {
        setLogo(data.logo_url)
        localStorage.setItem('lumio_company_logo', data.logo_url)
        localStorage.setItem('workspace_company_logo', data.logo_url)
        // Dispatch custom event so same-tab components (Sidebar) pick up the change
        window.dispatchEvent(new CustomEvent('lumio-logo-updated', { detail: data.logo_url }))
        setToast('✓ Logo updated')
        setTimeout(() => setToast(''), 3000)
      }
    } catch { setToast('Upload failed'); setTimeout(() => setToast(''), 3000) }
    setUploading(false)
  }

  return (
    <SectionCard title="Company Logo">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: logo ? 'transparent' : '#6C3FC5', color: '#F9FAFB', border: '1px solid #1F2937' }}>
          {logo ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setLogo('')} /> : <span className="text-xl font-bold">{initials}</span>}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: uploading ? 0.6 : 1 }}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Logo'}
          </button>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>PNG, JPG, SVG or WebP · Max 2MB</p>
        </div>
        {toast && <span className="text-xs font-medium ml-2" style={{ color: toast.startsWith('✓') ? '#22C55E' : '#EF4444' }}>{toast}</span>}
      </div>
    </SectionCard>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  useEffect(() => {
    const slug = localStorage.getItem('lumio_workspace_slug') || document.cookie.split('; ').find(r => r.startsWith('lumio_tenant_slug='))?.split('=')[1]
    if (slug) { localStorage.setItem('lumio_active_dept', 'settings'); router.replace(`/${slug}`) }
  }, [router])

  return (
    <PageShell>

      {/* Company Logo */}
      <LogoUpload />

      {/* Team Members */}
      <SectionCard title="Team Members" action="Invite member">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Email', 'Role', 'Last Login', 'Actions'].map((col) => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m, i) => (
                <tr key={m.email} style={{ borderBottom: i < teamMembers.length - 1 ? '1px solid #1F2937' : undefined }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
                        {m.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span style={{ color: '#F9FAFB' }}>{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{m.email}</td>
                  <td className="px-5 py-3"><Badge status={m.role.toLowerCase() === 'admin' ? 'active' : m.role.toLowerCase() === 'manager' ? 'pending' : 'inactive'} /></td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{m.lastLogin}</td>
                  <td className="px-5 py-3">
                    <button className="text-xs" style={{ color: '#0D9488' }}>Edit</button>
                    {m.role !== 'Admin' && (
                      <button className="ml-3 text-xs" style={{ color: '#EF4444' }}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Subscription */}
      <SectionCard title="Subscription">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col gap-4 rounded-xl p-5"
              style={{
                backgroundColor: plan.current ? 'rgba(13,148,136,0.08)' : '#07080F',
                border: `1px solid ${plan.current ? '#0D9488' : '#1F2937'}`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>{plan.name}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: plan.current ? '#0D9488' : '#F9FAFB' }}>{plan.price}</p>
                </div>
                {plan.current && (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>
                    <Shield size={10} /> Current
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                    <Check size={12} style={{ color: '#0D9488', flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button
                  className="mt-auto w-full rounded-lg py-2 text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1F2937' }}
                >
                  {plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* API Keys */}
      <SectionCard title="API Keys" action="Generate new key">
        <div className="flex flex-col">
          {apiKeys.map((k) => (
            <div key={k.label} className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: '1px solid #1F2937' }}>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{k.label}</p>
                <p className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{k.key}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Created {k.created}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <CopyButton value={k.key} />
                <button className="text-xs" style={{ color: '#EF4444' }}>Revoke</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notification Preferences">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          {notifications.map((group) => (
            <div key={group.group}>
              <div className="px-5 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{group.group}</p>
              </div>
              {group.items.map((item, i) => (
                <NotificationRow key={item} label={item} defaultChecked={i < 2} />
              ))}
            </div>
          ))}
        </div>
      </SectionCard>

    </PageShell>
  )
}
