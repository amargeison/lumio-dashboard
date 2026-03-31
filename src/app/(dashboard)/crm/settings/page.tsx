'use client'

import { useState, useEffect } from 'react'
import { Check, Settings } from 'lucide-react'

const CARD = '#121320'
const BORDER = '#1E2035'
const PURPLE = '#8B5CF6'

const CRM_INTEGRATIONS = [
  { key: 'hubspot', name: 'HubSpot', desc: 'CRM & marketing automation', category: 'CRM' },
  { key: 'salesforce', name: 'Salesforce', desc: 'Enterprise CRM', category: 'CRM' },
  { key: 'pipedrive', name: 'Pipedrive', desc: 'Sales pipeline management', category: 'CRM' },
  { key: 'gmail', name: 'Gmail', desc: 'Google email', category: 'Email' },
  { key: 'outlook', name: 'Outlook', desc: 'Microsoft email', category: 'Email' },
  { key: 'gcal', name: 'Google Calendar', desc: 'Calendar sync', category: 'Calendar' },
  { key: 'outlook_cal', name: 'Outlook Calendar', desc: 'Calendar sync', category: 'Calendar' },
]

const PIPELINE_STAGES = ['New Lead', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost']

export default function CRMSettingsPage() {
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({})
  const [currency, setCurrency] = useState('GBP')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [dealNotifs, setDealNotifs] = useState(true)

  useEffect(() => {
    const state: Record<string, boolean> = {}
    CRM_INTEGRATIONS.forEach(i => { state[i.key] = localStorage.getItem(`lumio_integration_${i.key}`) === 'true' })
    setIntegrations(state)
    setCurrency(localStorage.getItem('lumio_crm_currency') || 'GBP')
    setEmailNotifs(localStorage.getItem('lumio_crm_notif_email') !== 'false')
    setDealNotifs(localStorage.getItem('lumio_crm_notif_deals') !== 'false')
  }, [])

  function toggleIntegration(key: string) {
    const next = !integrations[key]
    setIntegrations(prev => ({ ...prev, [key]: next }))
    localStorage.setItem(`lumio_integration_${key}`, String(next))
  }

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
      </button>
    )
  }

  const categories = ['CRM', 'Email', 'Calendar']

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>CRM Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7299' }}>Integrations, pipeline, and preferences</p>
      </div>

      {/* Integrations */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Integrations</p>
        </div>
        <div className="p-5 space-y-5">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B7299', letterSpacing: '0.05em' }}>{cat.toUpperCase()}</p>
              <div className="space-y-2">
                {CRM_INTEGRATIONS.filter(i => i.category === cat).map(integ => (
                  <div key={integ.key} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0F1019', border: integrations[integ.key] ? '1px solid rgba(34,197,94,0.3)' : `1px solid ${BORDER}` }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#F1F3FA' }}>{integ.name}</p>
                      <p className="text-xs" style={{ color: '#6B7299' }}>{integ.desc}</p>
                    </div>
                    {integrations[integ.key] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: '#22C55E' }}><Check size={12} /> Connected</span>
                        <button onClick={() => toggleIntegration(integ.key)} className="text-xs px-2.5 py-1 rounded-lg" style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>Disconnect</button>
                      </div>
                    ) : (
                      <button onClick={() => toggleIntegration(integ.key)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>Connect</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Pipeline Stages</p>
        </div>
        <div className="p-5 space-y-2">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ backgroundColor: '#0F1019', border: `1px solid ${BORDER}` }}>
              <span className="text-xs font-bold" style={{ color: '#6B7299', width: 20 }}>{i + 1}</span>
              <span className="text-sm" style={{ color: '#F1F3FA' }}>{stage}</span>
            </div>
          ))}
          <p className="text-xs mt-2" style={{ color: '#6B7299' }}>Stage customisation coming soon</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Preferences</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#F1F3FA' }}>Currency</span>
            <select value={currency} onChange={e => { setCurrency(e.target.value); localStorage.setItem('lumio_crm_currency', e.target.value) }} className="text-sm rounded-lg px-3 py-1.5 outline-none" style={{ backgroundColor: '#0F1019', border: `1px solid ${BORDER}`, color: '#F1F3FA' }}>
              <option>GBP</option><option>USD</option><option>EUR</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F1F3FA' }}>Email notifications</p><p className="text-xs" style={{ color: '#6B7299' }}>Get emailed about CRM activity</p></div>
            <Toggle on={emailNotifs} onToggle={() => { const v = !emailNotifs; setEmailNotifs(v); localStorage.setItem('lumio_crm_notif_email', String(v)) }} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F1F3FA' }}>Deal notifications</p><p className="text-xs" style={{ color: '#6B7299' }}>Alerts when deals move stages</p></div>
            <Toggle on={dealNotifs} onToggle={() => { const v = !dealNotifs; setDealNotifs(v); localStorage.setItem('lumio_crm_notif_deals', String(v)) }} />
          </div>
        </div>
      </div>
    </div>
  )
}
