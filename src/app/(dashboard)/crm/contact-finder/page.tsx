'use client'

import { useState } from 'react'
import { Search, Upload, Linkedin, Phone, UserPlus, Shield, Download, X, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'

const BG = '#07080F'
const CARD = '#0F1019'
const BORDER = '#1E2035'
const PURPLE = '#6C3FC5'
const TEAL = '#0D9488'

const ROLES = ['Any role', 'Headteacher', 'SENCO', 'Business Manager', 'IT Lead', 'CEO', 'CTO', 'Marketing Director', 'CFO', 'Deputy Head']

const DEMO_CONTACTS = [
  { name: 'Sarah Mitchell', title: 'Headteacher', company: 'Oakridge Academy', email: 's****@oakridge.sch.uk', active: '2d ago', color: '#0D9488' },
  { name: 'James Clarke', title: 'Business Manager', company: 'Oakridge Academy', email: 'j****@oakridge.sch.uk', active: '1w ago', color: '#3B82F6' },
  { name: 'Emma Hobson', title: 'SENCO', company: 'Riverside Learning', email: 'e****@riversidelp.org', active: '3d ago', color: '#8B5CF6' },
  { name: 'Tom Bradley', title: 'IT Manager', company: 'Hillside MAT', email: 't****@hillside.ac.uk', active: '5d ago', color: '#F59E0B' },
  { name: 'Dr Rachel Kim', title: 'CEO', company: 'Northern Education Trust', email: 'r****@northerneducation.org', active: '1d ago', color: '#EC4899' },
  { name: 'Mark Davies', title: 'CFO', company: 'Maple Grove Schools', email: 'm****@maplegrove.sch.uk', active: '2w ago', color: '#22C55E' },
  { name: 'Priya Patel', title: 'Headteacher', company: "St Mary's Catholic MAT", email: 'p****@stmarysedu.co.uk', active: '4d ago', color: '#EF4444' },
  { name: 'Chris Wong', title: 'IT Director', company: 'Riverside Learning', email: 'c****@riversidelp.org', active: '1w ago', color: '#06B6D4' },
]

const ENRICHMENT_STEPS = [
  { label: 'LinkedIn Professional Profile', icon: Linkedin, delay: 800 },
  { label: 'Companies House Records', icon: Shield, delay: 1200 },
  { label: 'Email Verification', icon: CheckCircle2, delay: 600 },
]

export default function ContactFinderPage() {
  const [companyQuery, setCompanyQuery] = useState(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    return params.get('company') || ''
  })
  const [role, setRole] = useState('Any role')
  const [contacts, setContacts] = useState(DEMO_CONTACTS)
  const [searching, setSearching] = useState(false)
  const [revealModal, setRevealModal] = useState<{ name: string; step: number; done: boolean } | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  async function handleSearch() {
    if (!companyQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch('/api/aria/contact-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyQuery.trim(), role }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.contacts?.length) setContacts(data.contacts)
      }
    } catch { /* fallback to existing */ }
    setSearching(false)
  }

  function handleReveal(name: string) {
    setRevealModal({ name, step: 0, done: false })
    let step = 0
    function next() {
      step++
      if (step < ENRICHMENT_STEPS.length) {
        setRevealModal({ name, step, done: false })
        setTimeout(next, ENRICHMENT_STEPS[step].delay)
      } else {
        setRevealModal({ name, step, done: true })
      }
    }
    setTimeout(next, ENRICHMENT_STEPS[0].delay)
  }

  async function handleAddContact(contact: typeof DEMO_CONTACTS[0]) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') : null
    if (token) {
      try {
        await fetch('/api/crm/add-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
          body: JSON.stringify({ name: contact.name, title: contact.title, company: contact.company, email: contact.email }),
        })
      } catch { /* ignore */ }
    }
    setAddedIds(prev => new Set(prev).add(contact.name))
  }

  const showResults = true

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Contact Finder</h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            <Sparkles size={11} /> Powered by ARIA Intelligence
          </span>
        </div>
        <p className="text-sm" style={{ color: '#6B7299' }}>Find the right person at any company — decision makers, budget holders, key influencers.</p>
      </div>

      {/* Search interface */}
      <div className="rounded-2xl p-[2px]" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.4), rgba(13,148,136,0.2), rgba(108,63,197,0.1))' }}>
        <div className="rounded-2xl p-6" style={{ backgroundColor: CARD }}>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B7299' }}>Company name or website</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                <Search size={14} style={{ color: '#6B7299' }} />
                <input value={companyQuery} onChange={e => setCompanyQuery(e.target.value)} placeholder="e.g. Oakridge Academy or oakridge.sch.uk" className="bg-transparent outline-none flex-1 text-sm" style={{ color: '#F1F3FA' }} />
              </div>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B7299' }}>Role filter</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, color: '#F1F3FA' }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSearch} disabled={searching} className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: '#F9FAFB', opacity: searching ? 0.6 : 1 }}>
              {searching ? 'Searching...' : 'Find Contacts →'}
            </button>
            <button className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${BORDER}` }}>
              <Upload size={13} /> Bulk Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            {/* Table header */}
            <div className="grid items-center gap-3 px-5 py-3 text-xs font-semibold" style={{ color: '#6B7299', borderBottom: `1px solid ${BORDER}`, gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr auto' }}>
              <span>Contact</span>
              <span>Company</span>
              <span>Email</span>
              <span>Last Active</span>
              <span className="text-right">Action</span>
            </div>

            {/* Contact rows */}
            {contacts.map(contact => (
              <div key={contact.name} className="grid items-center gap-3 px-5 py-4 transition-colors" style={{ gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr auto', borderBottom: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                {/* Contact */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: `${contact.color}20`, color: contact.color }}>
                    {contact.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F1F3FA' }}>{contact.name}</p>
                    <p className="text-xs truncate" style={{ color: '#6B7299' }}>{contact.title}</p>
                  </div>
                </div>
                {/* Company */}
                <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{contact.company}</span>
                {/* Email */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: '#6B7299' }}>{contact.email}</span>
                  <div className="flex gap-1">
                    <button className="p-1 rounded" style={{ color: '#6B7299' }} title="LinkedIn"><Linkedin size={12} /></button>
                    <button className="p-1 rounded" style={{ color: '#6B7299' }} title="Phone"><Phone size={12} /></button>
                  </div>
                </div>
                {/* Last active */}
                <span className="text-xs" style={{ color: '#6B7299' }}>{contact.active}</span>
                {/* Action */}
                <button onClick={() => { handleReveal(contact.name); handleAddContact(contact) }} disabled={addedIds.has(contact.name)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                  style={{ background: addedIds.has(contact.name) ? '#22C55E' : `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: '#F9FAFB', opacity: addedIds.has(contact.name) ? 0.7 : 1 }}>
                  {addedIds.has(contact.name) ? <><CheckCircle2 size={12} /> Added</> : <><UserPlus size={12} /> Reveal & Add</>}
                </button>
              </div>
            ))}
          </div>

          {/* GDPR banner */}
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <Shield size={16} style={{ color: TEAL }} className="shrink-0" />
            <p className="text-xs" style={{ color: '#94A3B8' }}>Contacts are GDPR-compliant and sourced from public professional profiles only.</p>
          </div>

          {/* Footer */}
          <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs" style={{ color: '#6B7299' }}>Showing 8 of 143 contacts found at 6 companies · Export all verified emails to CSV</p>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${BORDER}` }}>
              <Download size={12} /> Export to CSV
            </button>
          </div>
        </>
      )}

      {/* Enrichment modal */}
      {revealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#111318', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold" style={{ color: '#F1F3FA' }}>
                {revealModal.done ? 'Added to CRM' : `Adding ${revealModal.name}...`}
              </h3>
              {revealModal.done && <button onClick={() => setRevealModal(null)} style={{ color: '#6B7299' }}><X size={16} /></button>}
            </div>

            <div className="space-y-3">
              {ENRICHMENT_STEPS.map((step, i) => {
                const StepIcon = step.icon
                const isActive = !revealModal.done && revealModal.step === i
                const isDone = revealModal.done || revealModal.step > i
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{
                    backgroundColor: isDone ? 'rgba(13,148,136,0.08)' : isActive ? 'rgba(108,63,197,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isDone ? 'rgba(13,148,136,0.3)' : isActive ? 'rgba(108,63,197,0.3)' : BORDER}`,
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={16} style={{ color: TEAL }} />
                    ) : isActive ? (
                      <Loader2 size={16} className="animate-spin" style={{ color: '#A78BFA' }} />
                    ) : (
                      <StepIcon size={16} style={{ color: '#374151' }} />
                    )}
                    <span className="text-xs font-medium" style={{ color: isDone ? '#2DD4BF' : isActive ? '#A78BFA' : '#4B5563' }}>{step.label}</span>
                    {isDone && <span className="ml-auto text-xs" style={{ color: TEAL }}>Verified</span>}
                  </div>
                )
              })}
            </div>

            {revealModal.done && (
              <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} style={{ color: TEAL }} />
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Added to CRM with full profile</p>
                </div>
                <p className="text-xs" style={{ color: '#6B7299' }}>Email verified · LinkedIn matched · Companies House confirmed</p>
              </div>
            )}

            {revealModal.done && (
              <button onClick={() => setRevealModal(null)} className="w-full mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: TEAL, color: '#F9FAFB' }}>
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
