'use client'

import { useState } from 'react'
import { Check, Loader2, ArrowRight, ArrowLeft, X, Mail } from 'lucide-react'

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', width: '100%' }

const DEPARTMENTS = [
  { id: 'hr', icon: '👥', name: 'HR & People', desc: 'Onboarding, leave, reviews' },
  { id: 'sales', icon: '📈', name: 'Sales & CRM', desc: 'Pipeline, deals, forecasting' },
  { id: 'accounts', icon: '💰', name: 'Finance & Accounts', desc: 'Invoices, payroll, reporting' },
  { id: 'marketing', icon: '📣', name: 'Marketing', desc: 'Campaigns, content, leads' },
  { id: 'support', icon: '🎧', name: 'Customer Support', desc: 'Tickets, SLAs, CSAT' },
  { id: 'success', icon: '🏆', name: 'Customer Success', desc: 'Health scores, renewals' },
  { id: 'operations', icon: '⚙️', name: 'Operations', desc: 'Procurement, processes' },
  { id: 'it', icon: '💻', name: 'IT & Systems', desc: 'Assets, provisioning, security' },
  { id: 'legal', icon: '⚖️', name: 'Legal & Compliance', desc: 'Contracts, GDPR, policies' },
  { id: 'executive', icon: '🏛️', name: 'Executive', desc: 'Board reports, OKRs, strategy' },
  { id: 'projects', icon: '📋', name: 'Projects', desc: 'Sprints, roadmap, tasks' },
  { id: 'partners', icon: '🤝', name: 'Partners', desc: 'Referrals, integrations' },
]

const TOOLS = [
  { id: 'notion', icon: '📝', name: 'Notion' },
  { id: 'hubspot', icon: '🟠', name: 'HubSpot' },
  { id: 'xero', icon: '💙', name: 'Xero' },
  { id: 'slack', icon: '💜', name: 'Slack' },
  { id: 'microsoft', icon: '🔷', name: 'Microsoft 365' },
  { id: 'google', icon: '🔵', name: 'Google Workspace' },
  { id: 'salesforce', icon: '☁️', name: 'Salesforce' },
  { id: 'zendesk', icon: '🟢', name: 'Zendesk' },
  { id: 'pipedrive', icon: '🟤', name: 'Pipedrive' },
  { id: 'quickbooks', icon: '🟩', name: 'QuickBooks' },
  { id: 'jira', icon: '🔷', name: 'Jira' },
  { id: 'github', icon: '⚫', name: 'GitHub' },
  { id: 'intercom', icon: '🔵', name: 'Intercom' },
  { id: 'freshdesk', icon: '🟢', name: 'Freshdesk' },
  { id: 'none', icon: '➖', name: 'None yet' },
]

type Step = 'departments' | 'tools' | 'invite' | 'building'

interface Props {
  companyName: string
  ownerEmail: string
  sessionToken: string
  onComplete: () => void
}

export default function GettingStartedModal({ ownerEmail, sessionToken, onComplete }: Props) {
  const [step, setStep] = useState<Step>('departments')
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['hr', 'sales', 'accounts'])
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [inviteEmails, setInviteEmails] = useState(['', '', '', '', ''])
  const [buildProgress, setBuildProgress] = useState(0)
  const domain = ownerEmail?.split('@')[1] || 'company.com'

  function toggleDept(id: string) { setSelectedDepts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]) }
  function toggleTool(id: string) { setSelectedTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]) }

  async function handleBuild() {
    setStep('building')
    for (const p of [20, 40, 60, 80, 100]) {
      await new Promise(r => setTimeout(r, 600))
      setBuildProgress(p)
    }
    if (sessionToken) {
      try {
        await fetch('/api/onboarding/complete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-workspace-token': sessionToken } }).catch(() => {})
        localStorage.setItem('lumio_selected_departments', JSON.stringify(selectedDepts))
        localStorage.setItem('lumio_selected_tools', JSON.stringify(selectedTools))
        const ALL = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','accounts','support','success','trials','operations','it']
        ALL.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
        localStorage.setItem('lumio-photo-frame', JSON.stringify([
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
          'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80',
        ]))
        const demoRes = await fetch('/api/onboarding/load-demo', {
          method: 'POST',
          headers: { 'x-workspace-token': sessionToken }
        }).catch(() => null)
        if (demoRes?.ok) {
          const demoData = await demoRes.json().catch(() => ({}))
          if (demoData.flagError) {
            console.warn('[onboarding] demo_data_active flag failed:', demoData.flagError)
          }
          localStorage.setItem('lumio_demo_active', 'true')
        }
      } catch { /* continue */ }
    }
    await new Promise(r => setTimeout(r, 800))
    onComplete()
  }

  const stepNum = step === 'departments' ? 1 : step === 'tools' ? 2 : step === 'invite' ? 3 : 4

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <div className="w-full rounded-2xl flex flex-col" style={{ maxWidth: 640, maxHeight: '92vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {step !== 'building' && (
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <p className="text-xs font-semibold tracking-widest" style={{ color: '#0D9488' }}>STEP {stepNum} OF 3</p>
              <div className="flex gap-1 mt-2">{[1,2,3].map(i => <div key={i} className="h-1 rounded-full" style={{ width: 40, backgroundColor: i <= stepNum ? '#0D9488' : '#1F2937' }} />)}</div>
            </div>
            <button onClick={onComplete} style={{ color: '#4B5563' }}><X size={16} /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6">

          {step === 'departments' && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Which departments matter to you?</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Pick at least 3. Your workspace will be seeded with realistic data for each one.</p></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{DEPARTMENTS.map(d => {
                const sel = selectedDepts.includes(d.id)
                return (<button key={d.id} onClick={() => toggleDept(d.id)} className="flex items-center gap-3 rounded-xl p-3 text-left transition-all" style={{ backgroundColor: sel ? 'rgba(13,148,136,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? 'rgba(13,148,136,0.5)' : '#1F2937'}` }}>
                  <span className="text-xl">{d.icon}</span>
                  <div className="min-w-0"><p className="text-xs font-semibold truncate" style={{ color: sel ? '#F9FAFB' : '#9CA3AF' }}>{d.name}</p><p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{d.desc}</p></div>
                  {sel && <Check size={14} style={{ color: '#0D9488', marginLeft: 'auto', flexShrink: 0 }} />}
                </button>)
              })}</div>
              <p className="text-xs" style={{ color: '#4B5563' }}>{selectedDepts.length} selected</p>
            </div>
          )}

          {step === 'tools' && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>What tools do you use today?</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>We&apos;ll show you how Lumio connects to what you already have. Skip if not sure.</p></div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{TOOLS.map(t => {
                const sel = selectedTools.includes(t.id)
                return (<button key={t.id} onClick={() => toggleTool(t.id)} className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all" style={{ backgroundColor: sel ? 'rgba(108,63,197,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? 'rgba(108,63,197,0.5)' : '#1F2937'}` }}>
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs font-medium truncate w-full text-center" style={{ color: sel ? '#A78BFA' : '#9CA3AF' }}>{t.name}</span>
                </button>)
              })}</div>
            </div>
          )}

          {step === 'invite' && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Invite your team</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Everyone gets their own magic link. Optional — you can do this later.</p></div>
              <div className="space-y-2">{inviteEmails.map((email, i) => (<input key={i} value={email} onChange={e => { const next = [...inviteEmails]; next[i] = e.target.value; setInviteEmails(next) }} placeholder={`colleague${i + 1}@${domain}`} style={S} />))}</div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <p className="text-xs" style={{ color: '#9CA3AF' }}><Mail size={11} className="inline mr-1" style={{ color: '#0D9488' }} />Each invited person gets an email with a magic link to access the workspace instantly.</p>
              </div>
            </div>
          )}

          {step === 'building' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={40} className="animate-spin mb-6" style={{ color: '#0D9488' }} />
              <h2 className="text-xl font-bold mb-1" style={{ color: '#F9FAFB' }}>Building your workspace...</h2>
              <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>This takes about 3 seconds</p>
              <div className="w-full max-w-xs space-y-3">
                {[{ label: 'Provisioning your workspace', t: 20 }, { label: 'Loading workflow library', t: 40 }, { label: 'Seeding demo data', t: 60 }, { label: 'Configuring selected departments', t: 80 }, { label: 'Connecting AI engine', t: 100 }].map((item, i) => {
                  const done = buildProgress >= item.t
                  return (<div key={i} className="flex items-center gap-3 text-left">
                    <span className="text-xs font-mono w-5 shrink-0" style={{ color: '#4B5563' }}>{String(i + 1).padStart(2, '0')}</span>
                    {done ? <Check size={14} style={{ color: '#0D9488' }} /> : <Loader2 size={14} className="animate-spin" style={{ color: '#374151' }} />}
                    <span className="text-sm" style={{ color: done ? '#0D9488' : '#6B7280' }}>{item.label}{done ? '' : '...'}</span>
                  </div>)
                })}
              </div>
            </div>
          )}
        </div>

        {step !== 'building' && (
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
            {step !== 'departments' ? (
              <button onClick={() => { if (step === 'tools') setStep('departments'); else if (step === 'invite') setStep('tools') }} className="flex items-center gap-1 text-sm font-medium" style={{ color: '#9CA3AF' }}><ArrowLeft size={14} /> Back</button>
            ) : <div />}
            <button onClick={() => { if (step === 'departments') setStep('tools'); else if (step === 'tools') setStep('invite'); else if (step === 'invite') handleBuild() }}
              disabled={step === 'departments' && selectedDepts.length < 3}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: step === 'departments' && selectedDepts.length < 3 ? 0.5 : 1 }}>
              {step === 'invite' ? 'Build my workspace' : 'Next'} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
